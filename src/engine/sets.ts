import type { Entry, SetRecord } from './types';

export const HOUR = 3600e3;
export const DAY = 24 * HOUR;
export const halfUp = (x: number) => Math.floor(x + 0.5);
export const r1 = (x: number) => Math.round(x * 10) / 10;
export const roundStep = (x: number, step: number) => Math.round(x / step) * step;

/** 计入容量、趋势与 PR 的组：工作组与递减组；热身组不计（ia §1.5） */
export const isCounted = (s: SetRecord) => s.type !== 'warmup';

/** 单侧动作取左右较大的一侧（用于预估 1RM 与趋势） */
export function bestReps(s: SetRecord): number {
  if (s.reps != null) return s.reps;
  const l = s.repsLeft, r = s.repsRight;
  if (l == null && r == null) return 0;
  return Math.max(l ?? 0, r ?? 0);
}

/** 总次数：全产品只在这里算（ia §1.5）。单侧：左 + 右；只填一侧按 ×2 */
export function totalReps(s: SetRecord): number {
  if (s.reps != null) return s.reps;
  const l = s.repsLeft, r = s.repsRight;
  if (l != null && r != null) return l + r;
  return 2 * (l ?? r ?? 0);
}

export const setLoad = (s: SetRecord) => (s.weightKg ?? 0) * totalReps(s);

/** 预估 1RM = Epley 与 Brzycki 的平均（brief 口径表）；次数 ≥ 37 或重量 ≤ 0 时无意义，返回 null */
export function e1rm(weightKg: number | null, reps: number): number | null {
  if (!(weightKg != null && weightKg > 0) || !(reps >= 1) || reps >= 37) return null;
  const epley = weightKg * (1 + reps / 30);
  const brzycki = (weightKg * 36) / (37 - reps);
  return (epley + brzycki) / 2;
}

export const countedSets = (entry: Entry | undefined | null) => (entry && !entry.skipped ? entry.sets.filter(isCounted) : []);

/** 一次训练里某动作的预估 1RM = 所有计入组的最大值 */
export function entryE1rm(entry: Entry | undefined | null): number | null {
  let best: number | null = null;
  for (const s of countedSets(entry)) {
    const v = e1rm(s.weightKg, bestReps(s));
    if (v != null && (best == null || v > best)) best = v;
  }
  return best;
}
