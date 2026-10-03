import { describe, expect, it } from 'vitest';
import { demoEnv } from './demo';
import { exerciseRecords, mainRegions, prMap, sessionStats } from './records';
import { summarize } from './summary';
import { DAYS, entry, session } from './testkit';

const env = demoEnv();
const BENCH = 'barbell-bench-press-4', CURL = 'barbell-curl-1', RAISE = 'dumbbell-lateral-raise-20';

describe('PR 与基线（ia §1.7）', () => {
  const a = session(DAYS(9), [entry(BENCH, [[100, 5]])], { id: 'a' });
  const b = session(DAYS(6), [entry(BENCH, [[100, 5]])], { id: 'b' });
  const c = session(DAYS(3), [entry(BENCH, [[102.5, 5]])], { id: 'c' });
  it('第一次是基线，不算 PR；持平不算；更高才算', () => {
    const r = exerciseRecords(env, [c, a, b], BENCH); // 乱序输入也按时间排
    expect(r.map((x) => [x.session.id, x.baseline, x.isPR])).toEqual([['a', true, false], ['b', false, false], ['c', false, true]]);
  });
  it('提高不到 0.05 kg 不算 PR', () => {
    const d = session(DAYS(1), [entry(BENCH, [[102.52, 5]])], { id: 'd' });
    expect(exerciseRecords(env, [a, c, d], BENCH).at(-1)!.isPR).toBe(false);
  });
  it('热身组不计入预估 1RM，也就不会因热身创 PR', () => {
    const w = session(DAYS(1), [{ exerciseId: BENCH, skipped: false, sets: [{ type: 'warmup', weightKg: 140, reps: 3 }, { type: 'work', weightKg: 90, reps: 5 }] }], { id: 'w' });
    expect(exerciseRecords(env, [a, w], BENCH).at(-1)!.isPR).toBe(false);
  });
  it('prMap 随历史重算：删掉更高的那次，后面的就成了 PR', () => {
    const top = session(DAYS(4), [entry(BENCH, [[110, 5]])], { id: 'top' });
    expect(prMap(env, [a, top, c]).get('c')!.has(BENCH)).toBe(false);
    expect(prMap(env, [a, c]).get('c')!.has(BENCH)).toBe(true);
  });
});

describe('训练统计与完成结算（ia §1.7）', () => {
  it('总组数与总负荷只算计入组；单侧动作次数左右相加', () => {
    const s = session(1, [
      { exerciseId: BENCH, skipped: false, sets: [{ type: 'warmup', weightKg: 40, reps: 10 }, { type: 'work', weightKg: 100, reps: 5 }, { type: 'drop', weightKg: 80, reps: 6 }] },
      { exerciseId: 'dumbbell-concentration-curl-562', skipped: false, sets: [{ type: 'work', weightKg: 12, reps: null, repsLeft: 10, repsRight: 9 }] },
      { exerciseId: CURL, skipped: true, sets: [{ type: 'work', weightKg: 40, reps: 10 }] },
    ]);
    expect(sessionStats(s)).toEqual({ sets: 3, load: 100 * 5 + 80 * 6 + 12 * 19 });
  });
  it('主要部位按有效组数排序，最多 3 个', () => {
    const s = session(1, [entry(RAISE, [[10, 12], [10, 12], [10, 12], [10, 12]]), entry(BENCH, [[100, 5], [100, 5]]), entry(CURL, [[30, 10]]), entry('barbell-squat-8', [[100, 5]])]);
    // 肩 4 组 > 胸 2 组 > 腿 1 组 × 3 个主练肌头 = 3 > 手臂 1 组 × 2 个肌头 = 2
    expect(mainRegions(env, s)).toEqual(['shoulders', 'lower', 'chest']);
  });
  it('结算：第一次训练标为基线；之后逐动作给出与上次的差', () => {
    const a = session(DAYS(3), [entry(BENCH, [[100, 5], [100, 5]])], { id: 'a' });
    const b = session(1, [entry(BENCH, [[105, 5], [105, 4]]), entry(CURL, [[30, 10]]), { exerciseId: RAISE, skipped: true, sets: [] }], { id: 'b' });
    expect(summarize(env, [a], a)).toMatchObject({ first: true, rows: [{ baseline: true, isPR: false }] });
    const r = summarize(env, [a], b); // 还没存进历史的这次训练也能结算
    expect(r.first).toBe(false);
    expect(r.prs.map((x) => x.exerciseId)).toEqual([BENCH]);
    expect(r.rows[0]).toMatchObject({ baseline: false, repsDelta: -1 });
    expect(r.rows[0].delta).toBeCloseTo(r.rows[0].e1rm! - r.rows[0].prevE1rm!, 9);
    expect(r.rows[1]).toMatchObject({ exerciseId: CURL, baseline: true, isPR: false });
    expect(r.rows[2]).toEqual({ exerciseId: RAISE, skipped: true });
  });
});
