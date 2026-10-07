import { describe, expect, it } from 'vitest';
import { DAY } from '../engine';
import { growthOf } from './me';
import { activate, cancel, monthStart, pitchProduct, proFacts, proPeriods, proPitch, proSaved, proStatus, trialUsed } from './pro';
import type { Order } from './store';
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

  it('付费墙四条：按你的数据写；会员价举被数据触发的那件商品，没有就挑省得最多的在售商品', () => {
    const f = proFacts(growthOf(demoState(NOW), NOW), NOW);
    const belt = pitchProduct([{ id: 'belt' }]);
    expect(belt.id).toBe('belt-10');
    const rows = proPitch(f, belt);
    expect(rows[0].value).toBe(`+${f.extra30.toLocaleString('en-US')}`);
    expect(rows[2]).toMatchObject({ value: '¥33', reason: '杠铃腰带 10 毫米 ¥329 → ¥296' });
    const any = pitchProduct([]);
    expect(any.status).not.toBe('oos');
    expect(any.status).not.toBe('off');
  });

  it('会员价本月省下：只算本月、下单那一刻是会员的订单', () => {
    const ps = activate([], 'year', NOW - 2 * DAY);
    const o = (atMs: number): Order => ({ id: String(atMs), atMs, productId: 'belt-10', name: '腰带', size: null, price: 329, member: 296, ship: 0, couponOff: 0, niujinOff: 0, pay: 296, couponId: null, couponTitle: null });
    expect(proSaved([o(NOW - DAY), o(NOW - 3 * DAY), o(NOW - 40 * DAY)], ps, monthStart(NOW))).toBe(33);
  });
});
