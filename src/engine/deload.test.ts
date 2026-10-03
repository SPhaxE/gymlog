import { describe, expect, it } from 'vitest';
import { demoEnv } from './demo';
import { deloadSignal, deloadView } from './deload';
import { DAY } from './sets';
import { DAYS, entry, NOW, session } from './testkit';

const env = demoEnv();
const BENCH = 'barbell-bench-press-4', SQUAT = 'barbell-squat-8', ROW = 'barbell-curl-1';
/** 每个动作一串重量（× 5 次 × 3 组），按时间先后 */
const hist = (series: Record<string, number[]>) => {
  const n = Math.max(...Object.values(series).map((v) => v.length));
  return Array.from({ length: n }, (_, i) => session(DAYS(3 * (n - i)), Object.entries(series)
    .filter(([, v]) => v[i] != null).map(([id, v]) => entry(id, [[v[i], 5], [v[i], 5], [v[i], 5]]))));
};

describe('减量信号（ia §1.2 规则 8）', () => {
  it('两个动作的预估 1RM 都连续两次下降 > 1% → 触发', () => {
    const sig = deloadSignal(env, hist({ [BENCH]: [100, 100, 97, 94], [SQUAT]: [140, 135, 130] }));
    expect(sig.active).toBe(true);
    expect(sig.hits.map((h) => h.exerciseId).sort()).toEqual([BENCH, SQUAT].sort());
    expect(sig.hits.find((h) => h.exerciseId === BENCH)!.dropPct).toBe(6);
  });
  it('只有一个动作在掉 → 不触发', () => {
    const sig = deloadSignal(env, hist({ [BENCH]: [100, 97, 94], [SQUAT]: [140, 140, 140] }));
    expect(sig).toMatchObject({ active: false, hits: [{ exerciseId: BENCH }] });
  });
  it('1% 以内的正常波动不算下降', () => {
    expect(deloadSignal(env, hist({ [BENCH]: [100, 99.5, 99], [SQUAT]: [140, 139, 138] })).active).toBe(false);
  });
  it('只看最近三次：先掉后回升不触发', () => {
    expect(deloadSignal(env, hist({ [BENCH]: [100, 95, 90, 92.5], [SQUAT]: [140, 135, 130, 135], [ROW]: [40, 40, 40] })).active).toBe(false);
  });
  it('不足三次记录不判断', () => {
    expect(deloadSignal(env, hist({ [BENCH]: [100, 90], [SQUAT]: [140, 120] })).hits).toEqual([]);
  });
});

describe('减量状态（ia §1.2 规则 8）', () => {
  const on = { active: true }, off = { active: false };
  it('有信号、没处理过 → 建议', () => {
    expect(deloadView(env, on, null, NOW)).toEqual({ kind: 'suggest' });
    expect(deloadView(env, off, null, NOW)).toEqual({ kind: 'none' });
  });
  it('采纳后持续 6 天，倒数剩余天数；到期后回到按信号判断', () => {
    expect(deloadView(env, off, { status: 'adopted', atMs: NOW }, NOW)).toEqual({ kind: 'week', daysLeft: 6 });
    expect(deloadView(env, off, { status: 'adopted', atMs: NOW - 2.5 * DAY }, NOW)).toEqual({ kind: 'week', daysLeft: 4 });
    expect(deloadView(env, on, { status: 'adopted', atMs: NOW - 6 * DAY }, NOW)).toEqual({ kind: 'suggest' });
  });
  it('「这次不减」后 6 天内不再弹出，只留一行小字；信号消失就什么都不显示', () => {
    expect(deloadView(env, on, { status: 'dismissed', atMs: NOW - 1 * DAY }, NOW)).toEqual({ kind: 'note', daysLeft: 5 });
    expect(deloadView(env, off, { status: 'dismissed', atMs: NOW - 1 * DAY }, NOW)).toEqual({ kind: 'none' });
    expect(deloadView(env, on, { status: 'dismissed', atMs: NOW - 7 * DAY }, NOW)).toEqual({ kind: 'suggest' });
  });
});
