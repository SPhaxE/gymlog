import { beforeEach, describe, expect, it } from 'vitest';
import { DAY } from '../engine';
import { COUPONS, PRODUCTS, SHOP_PRODUCTS, productById } from './growth';
import { knowledgeHits, recommendFor, tipFor } from './knowledge';
import { growthOf } from './me';
import { DEMO_WEIGHT, demoLegState, demoState, store } from './store';
import { couponsOf, demoWallet, EMPTY_WALLET, mute, placeOrder, quote, redeem, remind, restockMessages, usableCoupons } from './wallet';

const NOW = new Date(2026, 9, 7, 18, 0).getTime();
const belt = productById('belt-10')!, straps = productById('straps')!;

describe('钱包与下单（6f，ia §1.15 / F6）', () => {
  beforeEach(() => { store.clear(); store.update((s) => ({ ...s, ...demoState(NOW) })); });

  it('腰带满减 + 牛劲：296 − 30 − 59 = 207（牛劲按会员价 20% 封顶，各页统一）', () => {
    const q = quote(belt, 6060, { type: 'merchant' }, true);
    expect(q).toMatchObject({ member: 296, ship: 0, couponOff: 30, niujinCap: 59, niujinOff: 59, pay: 207 });
    expect(quote(belt, 6060, null, false).pay).toBe(296);
  });

  it('牛劲不足：够几元抵几元；一元都抵不了时写还差多少', () => {
    expect(quote(belt, 2050, null, true).niujinOff).toBe(20);
    const q = quote(belt, 40, null, true);
    expect(q.niujinOff).toBe(0);
    expect(q.niujinShort).toBe(60);
  });

  it('会员价不到 99 元收 10 元运费，免邮券抵掉；商家券只对同商家、满额', () => {
    expect(quote(straps, 0, null, false).pay).toBe(72);
    expect(quote(straps, 0, { type: 'shipping' }, false).pay).toBe(62);
    const cs = couponsOf(demoWallet(NOW), NOW);
    expect(usableCoupons(cs, straps).map((c) => c.type)).toEqual(['shipping']);
    expect(usableCoupons(cs, belt).map((c) => c.type)).toEqual(['merchant']);
    expect(usableCoupons(cs, productById('whey')!)).toEqual([]);
  });

  it('下单：牛劲进流水、余额减少，券变已用，订单号是演示订单号', () => {
    const before = growthOf(store.get(), NOW).niujin.balance;
    const w = store.get().wallet, c = usableCoupons(couponsOf(w, NOW), belt)[0];
    const q = quote(belt, before, c, true);
    const { wallet, order } = placeOrder(w, belt, 'M', q, c, NOW);
    expect(order.id).toMatch(/^MILO-20261007-\d{4}$/);
    expect(order.pay).toBe(207);
    store.update((s) => ({ ...s, wallet }));
    const g = growthOf(store.get(), NOW);
    expect(g.niujin.balance).toBe(before - 5900);
    expect(g.niujin.ledger.at(-1)).toMatchObject({ amount: -5900, label: '下单抵扣：杠铃腰带 10 毫米' });
    expect(couponsOf(wallet, NOW).find((x) => x.id === c.id)!.state).toBe('used');
  });

  it('兑换：扣牛劲；冻结卡归连胜（加卡），不进卡券列表；券 30 天后过期', () => {
    const before = growthOf(store.get(), NOW);
    const w = redeem(redeem(store.get().wallet, 'freeze', NOW), 'shipping', NOW);
    store.update((s) => ({ ...s, wallet: w }));
    const g = growthOf(store.get(), NOW);
    expect(g.niujin.balance).toBe(before.niujin.balance - COUPONS.freeze.cost - COUPONS.shipping.cost);
    expect(g.streak.freezeCards).toBe(before.streak.freezeCards + 1);
    expect(couponsOf(w, NOW).some((c) => c.type === 'freeze')).toBe(false);
    expect(couponsOf(w, NOW + 31 * DAY).filter((c) => c.state === 'expired').length).toBe(3);
  });

  it('到货提醒：只记一次，消息里来一条「已到货」', () => {
    const w = remind(remind(EMPTY_WALLET, 'knee', NOW), 'knee', NOW + 1);
    expect(w.restock).toHaveLength(1);
    expect(restockMessages(w)[0]).toMatchObject({ kind: 'restock', title: '7 毫米护膝 已到货' });
  });

  it('商品 5 件、上架的状态全有；已下架不在商城列表', () => {
    expect(PRODUCTS).toHaveLength(5);
    expect(new Set(PRODUCTS.map((p) => p.status))).toEqual(new Set(['normal', 'hot', 'sale', 'new', 'oos']));
    expect(SHOP_PRODUCTS.some((p) => p.status === 'off')).toBe(false);
    for (const p of PRODUCTS) expect(p.member).toBeLessThan(p.price);
  });
});

describe('知识卡触发（ia §1.16）', () => {
  it('演示用户：硬拉预估 1RM ÷ 体重 ≥ 1.5 → 腰带，挂在增量页；没填体重不触发', () => {
    const d = demoState(NOW);
    expect(d.profile!.weightKg).toBe(DEMO_WEIGHT);
    const hits = knowledgeHits(d, NOW);
    expect(hits[0].id).toBe('belt');
    expect(hits[0].evidence!.series.at(-1)).toBeGreaterThanOrEqual(1.5);
    expect(tipFor('gains', hits, [])!.id).toBe('belt');
    expect(tipFor('gains', hits, ['belt'])?.id).not.toBe('belt');
    expect(tipFor('body', hits, []) == null || ['protein', 'knee'].includes(tipFor('body', hits, [])!.id)).toBe(true);
    expect(knowledgeHits({ ...d, profile: { ...d.profile!, weightKg: undefined } }, NOW).some((h) => h.id === 'belt')).toBe(false);
  });

  it('没有触发：商城推荐通用入门卡（助力带）；静音不影响商城推荐', () => {
    expect(recommendFor([])).toEqual({ id: 'straps', why: null });
    expect(knowledgeHits({ history: [], profile: null }, NOW)).toEqual([]);
    expect(mute(mute(EMPTY_WALLET, 'belt'), 'belt').muted).toEqual(['belt']);
  });
});

describe('Pro 体验 7 天券（6g）', () => {
  it('兑换扣 2,000 牛劲；卡券里一出现就是「已用」，不能拿去下单', () => {
    const d = demoState(NOW);
    const w = redeem(EMPTY_WALLET, 'trial', NOW);
    const before = growthOf({ ...d, wallet: EMPTY_WALLET }, NOW).niujin.balance;
    expect(growthOf({ ...d, wallet: w }, NOW).niujin.balance).toBe(before - COUPONS.trial.cost);
    const [c] = couponsOf(w, NOW);
    expect(c).toMatchObject({ type: 'trial', state: 'used', expireAt: NOW + 7 * DAY });
    expect(usableCoupons(couponsOf(w, NOW), productById('belt-10')!)).toEqual([]);
  });
});

describe('「腿练得多」的演示用户（/demo 容量页知识卡那一步）', () => {
  it('一周七天载入，容量页都是护膝那一条（不是练太多的蛋白质）；主演示用户不触发', () => {
    for (let d = 0; d < 7; d++) {
      const now = new Date(2026, 9, 5 + d, 18).getTime();
      expect(tipFor('body', knowledgeHits(demoLegState(now), now), [])?.id).toBe('knee');
      expect(tipFor('body', knowledgeHits(demoState(now), now), [])).toBeNull();
    }
  });
});
