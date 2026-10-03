import { regionOfEx, type Env } from './env';
import { exerciseRecords } from './records';
import { bestReps, halfUp, r1, roundStep } from './sets';
import type { Exercise, Session } from './types';

export interface Plan { sets: number; repRange: [number, number]; restSec: number }

/** 组数与次数（ia §1.2 规则 4）：复合 3 组 6–8 次 休息 3:00；孤立 2 组 10–12 次 休息 2:00；减量周组数 ×0.5 */
export function planFor(env: Env, ex: Exercise, deload: boolean): Plan {
  const compound = ex.mechanic === 'compound';
  let sets = compound ? 3 : 2;
  if (deload) sets = Math.max(1, halfUp(sets * env.cfg.deload.volume));
  return { sets, repRange: compound ? [6, 8] : [10, 12], restSec: compound ? 180 : 120 };
}

export type ReasonKind = 'first' | 'add' | 'hold' | 'cut';
export interface Suggestion {
  /** null = 冷启动或首次做这个动作：不给建议重量，不编造数字（ia §1.2 边界情况） */
  weightKg: number | null;
  repsPerSet: number[];
  reason: { kind: ReasonKind; text: string; last?: string; first?: number };
}

/**
 * 双进阶（ia §1.2 规则 7）：上次所有工作组都顶到上限且趋势没有明显下滑 → 加重（上肢 +2.5%，下肢 +5%，至少一个步进）；
 * 任一组掉出下限 → 减 7.5%；其余重量不变、每组目标 +1 次。减量周强度 ×0.9。
 */
export function suggest(env: Env, history: Session[], ex: Exercise, plan: Plan, deload: boolean): Suggestion {
  const [lower, upper] = plan.repRange, step = env.cfg.loadStep, P = env.cfg.progress;
  const recs = exerciseRecords(env, history, ex.id);
  const last = recs[recs.length - 1];
  const none: Suggestion = { weightKg: null, repsPerSet: Array(plan.sets).fill(lower), reason: { kind: 'first', text: '首次记录', first: upper } };
  if (!last) return none;
  const work = last.entry.sets.filter((s) => s.type === 'work');
  if (!work.length) return none;
  const reps = work.map(bestReps);
  const W = Math.max(...work.map((s) => s.weightKg ?? 0));
  const lastTxt = `${W > 0 ? r1(W) + ' kg × ' : ''}${reps.join('/')}`;
  const prev = recs[recs.length - 2];
  const trendDown = !!prev && last.e1rm != null && prev.e1rm != null && last.e1rm < prev.e1rm * 0.99;
  const isLower = regionOfEx(env, ex) === 'lower';
  let weightKg = W, kind: ReasonKind, text: string, repsPerSet: number[];
  const allTop = reps.every((r) => r >= upper), anyLow = reps.some((r) => r < lower);
  if (anyLow) {
    weightKg = W > 0 ? Math.min(W - step, roundStep(W * (1 - P.down), step)) : 0;
    kind = 'cut';
    text = `上次 ${reps.join('/')}，有一组掉到下限 ${lower} 次以下 → 减 ${r1(P.down * 100)}%`;
    repsPerSet = Array(plan.sets).fill(lower);
  } else if (allTop && !trendDown) {
    if (W > 0) {
      weightKg = Math.max(roundStep(W * (1 + (isLower ? P.upLower : P.upUpper)), step), W + step);
      kind = 'add';
      text = `上次 ${reps.join('/')} 全部顶到 ${upper} 次上限 → +${r1(weightKg - W)} kg`;
    } else {
      kind = 'hold';
      text = `上次 ${reps.join('/')} 全部顶到 ${upper} 次上限，自重动作先多做 1 次`;
    }
    repsPerSet = Array(plan.sets).fill(W > 0 ? lower : upper + 1);
  } else {
    kind = 'hold';
    text = allTop && trendDown
      ? `上次 ${reps.join('/')} 已到上限，但预估 1RM 比前一次低 ${r1((1 - last.e1rm! / prev!.e1rm!) * 100)}%，先不加重`
      : `上次 ${reps.join('/')}，还没全部做到 ${upper} 次 → 重量不变，每组多做 1 次`;
    repsPerSet = Array.from({ length: plan.sets }, (_, i) => Math.max(lower, Math.min(upper, (reps[Math.min(i, reps.length - 1)] || lower) + 1)));
  }
  if (deload && weightKg > 0) {
    weightKg = Math.max(0, roundStep(weightKg * env.cfg.deload.intensity, step));
    text += `；减量周强度 ×${env.cfg.deload.intensity}`;
  }
  return { weightKg, repsPerSet, reason: { kind, text, last: lastTxt } };
}
