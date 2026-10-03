import { factorFrom } from './config';
import { endMs, type Env } from './env';
import { deloadSignal } from './deload';
import { learnPersonalFactors } from './personal';
import { countedSets, DAY, halfUp, HOUR } from './sets';
import type { Experience, Head, Level, Phase, Profile, Session } from './types';

export interface Landmarks { mev: number; mav: number; mrv: number; bonus: number }

/** 三条容量地标：按肌群大小缩放；容量进阶加成 b 让适宜量与上限 +b、最低有效量 +⌊b/2⌋（V1 volumeTarget） */
export function landmarks(env: Env, head: Head, bonus = 0): Landmarks {
  const k = env.tiers[head.tier].volumeScale, b = Math.max(0, Math.min(env.cfg.volumeBonus.maxWeeks, bonus));
  return { mev: halfUp(env.cfg.mev * k) + Math.floor(b / 2), mav: halfUp(env.cfg.mav * k) + b, mrv: halfUp(env.cfg.mrv * k) + b, bonus: b };
}

/** 一次训练里各肌头的有效组数：主练 1，协同 0.5；跳过的动作、热身组不计（ia §1.10） */
export function sessionHeadSets(env: Env, session: Session, primaryOnly = false): Map<string, number> {
  const m = new Map<string, number>();
  for (const entry of session.exercises) {
    const ex = env.ex.get(entry.exerciseId);
    const n = countedSets(entry).length;
    if (!ex || !n) continue;
    for (const h of ex.primaryHeads) m.set(h, (m.get(h) ?? 0) + n);
    if (!primaryOnly) for (const h of ex.secondaryHeads) m.set(h, (m.get(h) ?? 0) + n * 0.5);
  }
  return m;
}

/** 这个肌头这次要多久回到基线：基础窗口 × 训练量 × 力竭度 × 经验 × 个人系数（ia §1.10） */
export function headWindow(env: Env, head: Head, lastSets: number, exertion: number | null | undefined, experience: Experience, personal = 1) {
  const c = env.cfg;
  return env.tiers[head.tier].baseWindowHours * factorFrom(c.volumeFactor, lastSets) * factorFrom(c.exertionFactor, exertion ?? 8) * c.experienceFactor[experience] * personal;
}

export const phaseOf = (ratio: number): Exclude<Phase, 'untrained'> => (ratio < 0.5 ? 'repair' : ratio < 1 ? 'recovering' : ratio < 2 ? 'golden' : 'decayed');

/**
 * 容量进阶（V1 weeklyVolumeBonus）：从上一周起往前数，连续每周主练组数都 ≥ 最低有效量，就 +1，最多 +4。
 * 不需要额外存状态；出现减量信号时一律归零。
 */
export function volumeBonuses(env: Env, history: Session[], now: number): Map<string, number> {
  const out = new Map<string, number>();
  if (!env.cfg.volumeBonus.enabled || deloadSignal(env, history).active) return out;
  const weeks: Map<string, number>[] = [];
  for (let w = 1; w <= env.cfg.volumeBonus.maxWeeks; w++) {
    const end = now - w * 7 * DAY, start = end - 7 * DAY, m = new Map<string, number>();
    for (const s of history) if (s.startMs > start && s.startMs <= end) for (const [h, v] of sessionHeadSets(env, s, true)) m.set(h, (m.get(h) ?? 0) + v);
    weeks.push(m);
  }
  for (const head of env.headList) {
    const { mev } = landmarks(env, head);
    let b = 0;
    for (const m of weeks) { if ((m.get(head.id) ?? 0) < mev) break; b++; }
    if (b) out.set(head.id, b);
  }
  return out;
}

export interface HeadStat extends Landmarks {
  id: string; name: string; region: Head['region']; tier: Head['tier']; exerciseCount: number;
  sets7d: number; lastSession: Session | null; lastEndMs: number | null; lastSets: number;
  windowHours: number | null; hoursSince: number | null; ratio: number | null; recovery: number | null;
  phase: Phase; hoursLeft: number; gap: number; phaseCoef: number; priority: number; level: Level; personal: number;
}

/** 每个肌头的近 7 天容量、恢复度与时相（ia §1.3、§1.10）。近 7 天是滚动 7 天：now − 7 天 */
export function headStats(env: Env, history: Session[], profile: Profile | null, now: number): Map<string, HeadStat> {
  const exp = profile?.experience ?? 'intermediate';
  const personal = env.cfg.personal.enabled ? learnPersonalFactors(env, history, profile) : new Map<string, number>();
  const bonus = volumeBonuses(env, history, now);
  const perSession = history.map((s) => [s, sessionHeadSets(env, s)] as const);
  const out = new Map<string, HeadStat>();
  for (const head of env.headList) {
    const lm = landmarks(env, head, bonus.get(head.id) ?? 0);
    let sets7d = 0, last: Session | null = null, lastSets = 0;
    for (const [s, m] of perSession) {
      const v = m.get(head.id);
      if (!v) continue;
      if (s.startMs >= now - 7 * DAY && s.startMs <= now) sets7d += v;
      if (!last || endMs(s) > endMs(last)) { last = s; lastSets = v; }
    }
    const pf = personal.get(head.id) ?? 1;
    let windowHours: number | null = null, hoursSince: number | null = null, ratio: number | null = null, recovery: number | null = null, phase: Phase = 'untrained', hoursLeft = 0;
    if (last) {
      windowHours = headWindow(env, head, lastSets, last.exertion, exp, pf);
      hoursSince = Math.max(0, (now - endMs(last)) / HOUR);
      ratio = hoursSince / windowHours;
      recovery = Math.min(1, ratio);
      phase = phaseOf(ratio);
      hoursLeft = Math.max(0, windowHours - hoursSince);
    }
    const gap = Math.max(0, lm.mav - sets7d) / lm.mav + (sets7d < lm.mev ? 0.5 : 0);
    const phaseCoef = phase === 'golden' ? 1.25 : recovery == null || recovery >= env.cfg.readiness.partial ? 1.0 : 0.6;
    const level: Level = sets7d <= 0 ? 'none' : sets7d < lm.mev ? 'low' : sets7d <= lm.mrv ? 'ok' : 'over';
    out.set(head.id, {
      id: head.id, name: head.name, region: head.region, tier: head.tier, exerciseCount: head.exerciseCount,
      sets7d, ...lm, lastSession: last, lastEndMs: last ? endMs(last) : null, lastSets,
      windowHours, hoursSince, ratio, recovery, phase, hoursLeft, gap, phaseCoef, priority: phaseCoef * (0.4 + gap), level, personal: pf,
    });
  }
  return out;
}
