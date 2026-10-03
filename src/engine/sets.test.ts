import { describe, expect, it } from 'vitest';
import { bestReps, e1rm, entryE1rm, setLoad, totalReps } from './sets';

describe('组与预估 1RM（brief 口径表、ia §1.5）', () => {
  it('预估 1RM = Epley 与 Brzycki 的平均', () => {
    // 100 kg × 5：Epley 116.67，Brzycki 112.5 → 114.58
    expect(e1rm(100, 5)).toBeCloseTo((100 * (1 + 5 / 30) + (100 * 36) / 32) / 2, 9);
    // 1 次：Epley 103.33，Brzycki 100 → 101.67
    expect(e1rm(100, 1)).toBeCloseTo(101.6667, 3);
  });
  it('重量 ≤ 0、次数 < 1 或 ≥ 37 时没有预估 1RM', () => {
    expect(e1rm(0, 10)).toBeNull();
    expect(e1rm(null, 10)).toBeNull();
    expect(e1rm(60, 0)).toBeNull();
    expect(e1rm(60, 37)).toBeNull();
  });
  it('单侧动作：趋势取左右较大一侧，总次数 = 左 + 右，只填一侧按 ×2', () => {
    const s = { type: 'work' as const, weightKg: 20, repsLeft: 10, repsRight: 8 };
    expect(bestReps(s)).toBe(10);
    expect(totalReps(s)).toBe(18);
    expect(totalReps({ type: 'work', weightKg: 20, repsLeft: 9 })).toBe(18);
    expect(setLoad(s)).toBe(360);
  });
  it('热身组不计入预估 1RM', () => {
    const v = entryE1rm({ exerciseId: 'x', skipped: false, sets: [{ type: 'warmup', weightKg: 200, reps: 5 }, { type: 'work', weightKg: 100, reps: 5 }] });
    expect(v).toBeCloseTo(e1rm(100, 5)!, 9);
  });
  it('递减组计入预估 1RM，跳过的动作不计', () => {
    expect(entryE1rm({ exerciseId: 'x', skipped: false, sets: [{ type: 'drop', weightKg: 80, reps: 8 }] })).toBeCloseTo(e1rm(80, 8)!, 9);
    expect(entryE1rm({ exerciseId: 'x', skipped: true, sets: [{ type: 'work', weightKg: 80, reps: 8 }] })).toBeNull();
  });
});
