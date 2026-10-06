import type { Env } from './env';
import { exerciseRecords } from './records';
import { DAY, r1 } from './sets';
import { trendDir } from './trend';
import type { DeloadState, Session } from './types';

export interface DeloadHit { exerciseId: string; name: string; series: number[]; dropPct: number }

/** 减量信号：至少 2 个动作的预估 1RM 连续两次下降、每次降幅 > 1%（ia §1.2 规则 8） */
export function deloadSignal(env: Env, history: Session[]): { active: boolean; hits: DeloadHit[] } {
  const ids = new Set<string>();
  for (const s of history) for (const e of s.exercises) if (!e.skipped) ids.add(e.exerciseId);
  const hits: DeloadHit[] = [];
  for (const id of ids) {
    const v = exerciseRecords(env, history, id).map((r) => r.e1rm).filter((x): x is number => x != null);
    if (v.length < 3) continue;
    const [a, b, c] = v.slice(-3);
    if (trendDir(a, b, env.cfg.trendEps) === 'down' && trendDir(b, c, env.cfg.trendEps) === 'down') hits.push({ exerciseId: id, name: env.ex.get(id)?.name ?? id, series: [a, b, c].map(r1), dropPct: r1((1 - c / a) * 100) });
  }
  return { active: hits.length >= 2, hits };
}

export type DeloadView = { kind: 'none' } | { kind: 'suggest' } | { kind: 'week'; daysLeft: number } | { kind: 'note'; daysLeft: number };

/** 把「信号 + 用户采纳 / 这次不减」合成今日处方要显示的状态：采纳后持续 6 天；不减则 6 天内不再弹出，只留一行小字 */
export function deloadView(env: Env, signal: { active: boolean }, state: DeloadState | null | undefined, now: number): DeloadView {
  const d = state ?? { status: 'none', atMs: 0 };
  const days = env.cfg.deload.days;
  if (d.status === 'adopted') {
    const left = Math.ceil(days - (now - d.atMs) / DAY);
    if (left > 0) return { kind: 'week', daysLeft: left };
  }
  if (d.status === 'dismissed' && now - d.atMs < days * DAY) {
    return signal.active ? { kind: 'note', daysLeft: Math.ceil(days - (now - d.atMs) / DAY) } : { kind: 'none' };
  }
  return signal.active ? { kind: 'suggest' } : { kind: 'none' };
}
