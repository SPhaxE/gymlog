import { describe, expect, it } from 'vitest';
import { demoEnv } from './demo';
import { planFor, suggest } from './load';
import { DAYS, entry, NOW, session } from './testkit';

const env = demoEnv();
const ex = (id: string) => env.ex.get(id)!;
const BENCH = ex('barbell-bench-press-4'), SQUAT = ex('barbell-squat-8'), RAISE = ex('dumbbell-lateral-raise-20'), CHIN = ex('chin-ups-184');
const tip = (e: typeof BENCH, rows: [number, number][][], deload = false) => {
  const h = rows.map((r, i) => session(DAYS(3 * (rows.length - i)), [entry(e.id, r)]));
  return suggest(env, h, e, planFor(env, e, deload), deload);
};

describe('组数与次数（ia §1.2 规则 4）', () => {
  it('复合 3 组 6–8 次、休息 3:00；孤立 2 组 10–12 次、休息 2:00', () => {
    expect(planFor(env, BENCH, false)).toEqual({ sets: 3, repRange: [6, 8], restSec: 180 });
    expect(planFor(env, RAISE, false)).toEqual({ sets: 2, repRange: [10, 12], restSec: 120 });
  });
  it('减量周组数减半（四舍五入，至少 1 组）', () => {
    expect(planFor(env, BENCH, true).sets).toBe(2);
    expect(planFor(env, RAISE, true).sets).toBe(1);
  });
});

describe('双进阶建议重量（ia §1.2 规则 7）', () => {
  it('第一次做这个动作：不给重量，不编造数字', () => {
    const s = suggest(env, [], BENCH, planFor(env, BENCH, false), false);
    expect(s.weightKg).toBeNull();
    expect(s.reason.kind).toBe('first');
    expect(s.repsPerSet).toEqual([6, 6, 6]);
  });
  it('只有热身组的记录也算没做过', () => {
    const h = [session(DAYS(3), [{ exerciseId: BENCH.id, skipped: false, sets: [{ type: 'warmup', weightKg: 40, reps: 10 }] }])];
    expect(suggest(env, h, BENCH, planFor(env, BENCH, false), false).reason.kind).toBe('first');
  });
  it('上肢全部顶到上限 → +2.5%，回到下限次数', () => {
    const s = tip(BENCH, [[[100, 8], [100, 8], [100, 8]]]);
    expect(s).toMatchObject({ weightKg: 102.5, repsPerSet: [6, 6, 6], reason: { kind: 'add', last: '100 kg × 8/8/8' } });
  });
  it('下肢全部顶到上限 → +5%', () => {
    expect(tip(SQUAT, [[[100, 8], [100, 8], [100, 8]]]).weightKg).toBe(105);
  });
  it('加重至少一个步进（2.5 kg）', () => {
    expect(tip(RAISE, [[[10, 12], [10, 12]]]).weightKg).toBe(12.5);
  });
  it('任一组掉出下限 → 减 7.5%', () => {
    const s = tip(BENCH, [[[100, 8], [100, 6], [100, 5]]]);
    expect(s).toMatchObject({ weightKg: 92.5, repsPerSet: [6, 6, 6], reason: { kind: 'cut' } });
  });
  it('在区间内 → 重量不变，每组多做 1 次（不超过上限）', () => {
    const s = tip(BENCH, [[[100, 7], [100, 8], [100, 6]]]);
    expect(s).toMatchObject({ weightKg: 100, repsPerSet: [8, 8, 7], reason: { kind: 'hold' } });
  });
  it('顶到上限但预估 1RM 比前一次低 > 1% → 先不加重', () => {
    const s = tip(BENCH, [[[105, 8], [105, 8], [105, 8]], [[100, 8], [100, 8], [100, 8]]]);
    expect(s.weightKg).toBe(100);
    expect(s.reason.kind).toBe('hold');
    expect(s.reason.text).toContain('先不加重');
  });
  it('看的是最近一次记录，不是更早的', () => {
    expect(tip(BENCH, [[[100, 5], [100, 5], [100, 5]], [[95, 8], [95, 8], [95, 8]]]).reason.kind).toBe('add');
  });
  it('减量周：在原建议上强度 ×0.9，按 2.5 kg 取整', () => {
    const s = tip(BENCH, [[[100, 8], [100, 8], [100, 8]]], true);
    expect(s.weightKg).toBe(92.5); // 102.5 × 0.9 = 92.25 → 92.5
    expect(s.repsPerSet).toHaveLength(2);
  });
  it('自重动作顶到上限：不加重，每组多做 1 次', () => {
    const s = tip(CHIN, [[[0, 8], [0, 8], [0, 8]]]);
    expect(s).toMatchObject({ weightKg: 0, repsPerSet: [9, 9, 9], reason: { kind: 'hold', last: '8/8/8' } });
  });
  it('与 now 无关：同样的历史，早晚算出同样的建议', () => {
    const h = [session(DAYS(3), [entry(BENCH.id, [[100, 8], [100, 8], [100, 8]])])];
    const a = suggest(env, h, BENCH, planFor(env, BENCH, false), false);
    expect(suggest(env, [...h].reverse(), BENCH, planFor(env, BENCH, false), false)).toEqual(a);
    expect(NOW).toBeGreaterThan(h[0].startMs);
  });
});
