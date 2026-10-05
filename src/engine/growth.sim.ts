/** 等级曲线模拟（阶段 5.5c）：合成三类用户的长期训练历史，用来定牛龄门槛、做回归测试，也给 /playground 的演示当数据源。
 *  合成规则（尽量贴近真实的进阶训练者）：
 *  - 每周 3 练（新手、单次 60 分钟）或 4 练（进阶 45 分钟、上下肢分化），两次训练至少隔 48 小时，同一部位隔 72 小时以上；
 *  - 预估 1RM 按「先快后慢」增长：e(t) = e0 × (1 + G × (1 − exp(−t / τ)))，新手 G 大 τ 小，老手 G 小；每次训练带 ±1.5% 的状态波动；
 *  - 每 5 周一次减量周（采纳，量减半、强度 90%），减量周之后力量略有回弹；
 *  - 随机掺入漏练周（只练 1 次）和病假周（不练），约 8%。
 *  所有随机数用固定种子，结果可复现。 */
import { DAY } from './sets';
import type { Profile, Session } from './types';

export type SimKind = 'novice' | 'intermediate' | 'advanced';

interface Lift { id: string; e0: number; reps: number; sets: number; growth: number }

/** 三类人的力量起点（kg，预估 1RM）与总增幅、时间常数（周） */
const PARAMS: Record<SimKind, { scale: number; G: number; tau: number; perWeek: 3 | 4; minutes: number }> = {
  novice: { scale: 0.55, G: 0.9, tau: 30, perWeek: 3, minutes: 60 },
  intermediate: { scale: 1, G: 0.35, tau: 55, perWeek: 4, minutes: 45 },
  advanced: { scale: 1.35, G: 0.1, tau: 70, perWeek: 3, minutes: 90 },
};

/** 上下肢分化（4 练）或 A / B 全身（3 练）；动作取自演示动作库 */
const LOWER: Lift[] = [
  { id: 'barbell-squat-8', e0: 100, reps: 5, sets: 4, growth: 1 },
  { id: 'dumbbell-romanian-deadlift-291', e0: 60, reps: 8, sets: 3, growth: 0.9 },
  { id: 'machine-seated-leg-curl-1198', e0: 45, reps: 10, sets: 3, growth: 0.7 },
  { id: 'vertical-leg-press-1690', e0: 160, reps: 10, sets: 3, growth: 0.9 },
];
const UPPER: Lift[] = [
  { id: 'barbell-bench-press-4', e0: 80, reps: 5, sets: 4, growth: 0.9 },
  { id: 'machine-pulldown-23', e0: 70, reps: 8, sets: 3, growth: 0.8 },
  { id: 'barbell-overhead-press-303', e0: 50, reps: 6, sets: 3, growth: 0.75 },
  { id: 'dumbbell-lateral-raise-20', e0: 10, reps: 12, sets: 3, growth: 0.5 },
  { id: 'barbell-curl-1', e0: 35, reps: 10, sets: 2, growth: 0.55 },
];
const PULL: Lift[] = [
  { id: 'barbell-deadlift-39', e0: 130, reps: 5, sets: 3, growth: 1 },
  { id: 'barbell-incline-bench-press-55', e0: 70, reps: 8, sets: 3, growth: 0.85 },
];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

/** 由目标预估 1RM 反推这一组用多重（Epley 与 Brzycki 的平均的反函数，按 2.5 kg 取整） */
function weightFor(e: number, reps: number) {
  const k = ((1 + reps / 30) + 36 / (37 - reps)) / 2;
  return Math.max(2.5, Math.round(e / k / 2.5) * 2.5);
}

export interface SimUser { kind: SimKind; profile: Profile; history: Session[]; deloads: number[]; start: number; weeks: number }

/** 合成一个用户 weeks 周的历史；start = 第一周的周一 0 点 */
export function simulateUser(kind: SimKind, weeks: number, start: number, seed = 7): SimUser {
  const P = PARAMS[kind], rand = rng(seed + kind.length * 101);
  const profile: Profile = { experience: kind, equipment: ['barbell', 'dumbbell', 'machine', 'cable', 'smith', 'bodyweight'], minutes: P.minutes, gender: 'male' };
  const history: Session[] = [], deloads: number[] = [];
  const days = P.perWeek === 4 ? [0, 1, 3, 4] : [0, 2, 4];
  const plans = P.perWeek === 4 ? [LOWER, UPPER, [...PULL, LOWER[2]], UPPER] : [[LOWER[0], UPPER[0], UPPER[1], UPPER[3]], [PULL[0], UPPER[2], PULL[1], LOWER[2]], [LOWER[0], UPPER[0], LOWER[1], UPPER[4]]];
  let trainedWeeks = 0;
  for (let w = 0; w < weeks; w++) {
    const deload = w % 5 === 4;
    const r = rand();
    const sick = !deload && r < 0.03, missed = !deload && !sick && r < 0.08;
    if (deload) deloads.push(start + w * 7 * DAY + 8 * 3600e3);
    if (sick) continue;
    days.forEach((d, i) => {
      if (missed && i > 0) return;
      const t = trainedWeeks + i / days.length;
      const lifts = plans[i % plans.length];
      const startMs = start + (w * 7 + d) * DAY + 18 * 3600e3;
      history.push({
        id: `sim-${kind}-${w}-${i}`, startMs, durationMin: P.minutes, exertion: deload ? 6 : 8,
        exercises: lifts.map((l) => {
          const e = l.e0 * P.scale * (1 + P.G * l.growth * (1 - Math.exp(-t / P.tau))) * (1 + (rand() - 0.5) * 0.03);
          const wt = weightFor(deload ? e * 0.9 : e, l.reps);
          const n = deload ? Math.max(1, Math.round(l.sets / 2)) : l.sets;
          return { exerciseId: l.id, skipped: false, sets: Array.from({ length: n }, () => ({ type: 'work' as const, weightKg: wt, reps: l.reps, rpe: deload ? 6 : 8 })) };
        }),
      });
    });
    if (!deload) trainedWeeks++;
  }
  return { kind, profile, history, deloads, start, weeks };
}

/** 2025-01-06 是周一：模拟统一从这天开始，避免受「今天」影响 */
export const SIM_START = new Date(2025, 0, 6).getTime();
