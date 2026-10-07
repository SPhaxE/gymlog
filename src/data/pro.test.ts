import { describe, expect, it } from 'vitest';
import { DAY } from '../engine';
import { growthOf } from './me';
import { activate, cancel, proFacts, proPeriods, proStatus, trialUsed } from './pro';
import { demoState } from './store';

const NOW = new Date(2026, 9, 7, 18, 0).getTime();

describe('会员（6g，ia §1.17）', () => {
  it('试用 7 天 → 剩几天；改开年度：试用就此结束，年度从现在起', () => {
    let ps = activate([], 'trial', NOW);
    expect(proStatus(ps, NOW + 2 * DAY)).toMatchObject({ kind: 'trial', daysLeft: 5 });
    expect(trialUsed(ps)).toBe(true);
    ps = activate(ps, 'year', NOW + 2 * DAY);
    expect(proStatus(ps, NOW + 3 * DAY).kind).toBe('pro');
    expect(ps.filter((p) => NOW + 3 * DAY >= p.fromMs && NOW + 3 * DAY <= p.toMs)).toHaveLength(1);
  });

  it('切回免费：现在是免费；之前 ×1.5 拿到的牛劲不收回', () => {
    const d = demoState(NOW);
    const ps = activate([], 'year', NOW - 20 * DAY);
    const asPro = growthOf({ ...d, pro: proPeriods(ps) }, NOW).niujin.balance;
    const after = cancel(ps, NOW);
    expect(proStatus(after, NOW + 1).kind).toBe('free');
    expect(growthOf({ ...d, pro: proPeriods(after) }, NOW).niujin.balance).toBe(asPro);
    expect(asPro).toBeGreaterThan(growthOf(d, NOW).niujin.balance);
  });

  it('付费墙的「按你的数据」：近 30 天进账 × 0.5；没有历史时 hasHistory = false', () => {
    const d = demoState(NOW), f = proFacts(growthOf(d, NOW), NOW);
    expect(f.earned30).toBeGreaterThan(0);
    expect(f.extra30).toBe(Math.round(f.earned30 * 0.5));
    expect(proFacts(growthOf({ history: [], profile: null }, NOW), NOW).hasHistory).toBe(false);
  });
});
