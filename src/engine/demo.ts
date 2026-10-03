/** 演示数据：mock/*.json → 引擎可用的历史与档案（与原型 prototype/data.js 同一套换算）。
 *  用于测试夹具，也用于设置里的「载入示例数据」（brief P1）。 */
import exercisesJson from '../../mock/exercises.json';
import historyJson from '../../mock/history.json';
import musclesJson from '../../mock/muscles.json';
import profileJson from '../../mock/profile.json';
import scenariosJson from '../../mock/scenarios.json';
import { createEnv } from './env';
import type { EngineConfig } from './config';
import { DAY, HOUR } from './sets';
import type { DeloadState, Exercise, Muscles, Profile, Session } from './types';

interface RawSession extends Omit<Session, 'startMs'> { daysAgo: number; startTime: string }
interface RawProfile { id: string; experience: Profile['experience']; equipment: Profile['equipment']; sessionMinutes: number; sex: Profile['gender'] }
interface Scenario {
  id: string; profile: string | null; profilePatch?: Partial<Profile>; inject?: string;
  history?: { replaceWith?: RawSession[]; remove?: string[]; append?: RawSession[] };
  appState?: { deload?: { status: 'adopted' | 'dismissed'; daysLeft?: number; dismissedDaysAgo?: number } };
}

export const demoExercises = exercisesJson as unknown as Exercise[];
export const demoMuscles = musclesJson as unknown as Muscles;
export const demoScenarios = (scenariosJson as unknown as { scenarios: Scenario[] }).scenarios;
export const demoEnv = (cfg?: EngineConfig) => createEnv(demoExercises, demoMuscles, cfg);

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** daysAgo + startTime → 真实时间戳（本地时间）；今天的训练若落在「现在」之后，挪到刚结束 */
export function materialize(raw: RawSession[], now: number): Session[] {
  return raw.map((r) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - r.daysAgo);
    const [hh, mm] = r.startTime.split(':').map(Number);
    let startMs = d.getTime() + hh * HOUR + mm * 60e3;
    const dur = r.durationMin ?? 0;
    if (r.daysAgo === 0 && startMs + dur * 60e3 > now - 5 * 60e3) startMs = now - dur * 60e3 - 5 * 60e3;
    const { daysAgo: _d, startTime: _t, ...rest } = clone(r);
    return { ...rest, startMs };
  }).sort((a, b) => a.startMs - b.startMs);
}

export const profileFrom = (p: RawProfile): Profile => ({ experience: p.experience, equipment: [...p.equipment], minutes: p.sessionMinutes, gender: p.sex });

/** 按 mock/scenarios.json 的场景构造：历史、档案、减量状态 */
export function buildScenario(id: string, now: number): { history: Session[]; profile: Profile | null; deload: DeloadState; inject: string | null } {
  const sc = demoScenarios.find((s) => s.id === id);
  if (!sc) throw new Error('没有这个场景：' + id);
  let raw = clone((historyJson as unknown as { sessions: RawSession[] }).sessions);
  const h = sc.history ?? {};
  if (h.replaceWith) raw = clone(h.replaceWith);
  if (h.remove) raw = raw.filter((s) => !h.remove!.includes(s.id));
  if (h.append) raw = raw.concat(clone(h.append));
  let profile: Profile | null = null;
  if (sc.profile) {
    profile = profileFrom((profileJson as unknown as { profiles: RawProfile[] }).profiles.find((p) => p.id === sc.profile)!);
    if (sc.profilePatch) Object.assign(profile, sc.profilePatch);
  }
  let deload: DeloadState = { status: 'none', atMs: 0 };
  const d = sc.appState?.deload;
  if (d?.status === 'adopted') deload = { status: 'adopted', atMs: now - (6 - (d.daysLeft ?? 6)) * DAY };
  if (d?.status === 'dismissed') deload = { status: 'dismissed', atMs: now - (d.dismissedDaysAgo ?? 0) * DAY };
  return { history: materialize(raw, now), profile, deload, inject: sc.inject ?? null };
}
