/** 钱包与商城的本机数据（6f，ia §1.15 / §1.16 / F6）：兑换卡券、演示下单、到货提醒、「不再提示这一类」。
 *  - 牛劲余额不存计数器：成长引擎从训练历史现算获得，再减去这里记下的花费（WalletAction：兑换扣牛劲、下单抵扣）。
 *  - 卡券 = 兑换动作本身（id 唯一）；被哪一单用掉、过没过期都从订单和时间现算。冻结卡兑换后归成长引擎管（断档周自动用），不进卡券列表。
 *  - 价格：演示模式全部会员权益已解锁（ia §1.17），一律按会员价结算；牛劲按会员价的 20% 封顶（100 牛劲 = 1 元，2026-10-07 定）；
 *    会员价不到 ¥99 的单加 ¥10 运费，免邮券抵掉它；商家券只在同一商家、会员价满额时可用。
 *  - 下单是演示：不收集支付信息，提交即成功，订单号标「演示订单」。
 *  - 到货提醒：记在本机，「我的 · 消息」立刻来一条「演示：已到货」（用户 2026-10-07 选）。
 *  - 演示场景（?scenario=）不读也不写存储，记在模块内存里（刷新复位），和 finder.ts 的 useExtras 同一个做法。 */
import { useSyncExternalStore } from 'react';
import { DAY } from '../engine';
import { COUPONS, productById, type CouponType, type KnowledgeId, type Product } from './growth';
import type { Message } from './me';
import { EMPTY_WALLET, store, useStore, type Order, type WalletState } from './store';

export type { Order, Restock, WalletState } from './store';
export { EMPTY_WALLET } from './store';

/** 卡券有效期（兑换起算） */
export const COUPON_DAYS = 30;
/** 会员价不到这个数的单收运费 */
export const FREE_SHIP_FROM = 99;
export const SHIP_FEE = 10;
/** 商家券的门槛与面额（COUPONS.merchant 的标题「满 200 减 30」） */
export const MERCHANT_COUPON = { merchant: '铁砧运动', min: 200, off: 30 };

export interface OwnedCoupon { id: string; type: CouponType; title: string; detail: string; atMs: number; expireAt: number; state: 'available' | 'used' | 'expired'; orderId: string | null }

/** 我的卡券：可用的在前（快过期的先），其后已用、已过期（新的在前）。冻结卡不在这里（归连胜）；
 *  Pro 体验 7 天（6g）兑换的那一刻就开通了体验，所以一出现就是「已用」 */
export function couponsOf(w: WalletState, now: number): OwnedCoupon[] {
  const out: OwnedCoupon[] = [];
  for (const a of w.actions) {
    if (a.kind === 'redeem' && a.id && a.coupon === 'trial') {
      out.push({ id: a.id, type: 'trial', title: COUPONS.trial.title, detail: COUPONS.trial.detail, atMs: a.atMs, expireAt: a.atMs + 7 * DAY, orderId: null, state: 'used' });
      continue;
    }
    if (a.kind !== 'redeem' || !a.id || (a.coupon !== 'merchant' && a.coupon !== 'shipping')) continue;
    const order = w.orders.find((o) => o.couponId === a.id);
    const expireAt = a.atMs + COUPON_DAYS * DAY, spec = COUPONS[a.coupon];
    out.push({ id: a.id, type: a.coupon, title: spec.title, detail: spec.detail, atMs: a.atMs, expireAt, orderId: order?.id ?? null,
      state: order ? 'used' : now > expireAt ? 'expired' : 'available' });
  }
  const rank = { available: 0, used: 1, expired: 2 } as const;
  return out.sort((a, b) => rank[a.state] - rank[b.state] || (a.state === 'available' ? a.expireAt - b.expireAt : b.atMs - a.atMs));
}

/** 这张券在这件商品上能抵多少（不能用 = 0） */
export function couponOff(c: Pick<OwnedCoupon, 'type'>, p: Product): number {
  if (c.type === 'merchant') return p.merchant === MERCHANT_COUPON.merchant && p.member >= MERCHANT_COUPON.min ? MERCHANT_COUPON.off : 0;
  if (c.type === 'shipping') return shipOf(p);
  return 0;
}
export const shipOf = (p: Product) => (p.member < FREE_SHIP_FROM ? SHIP_FEE : 0);
/** 这件商品能用的券（抵得多的在前） */
export const usableCoupons = (cs: OwnedCoupon[], p: Product) => cs.filter((c) => c.state === 'available' && couponOff(c, p) > 0).sort((a, b) => couponOff(b, p) - couponOff(a, p));

export interface Quote {
  price: number; member: number; ship: number; couponOff: number;
  /** 这一单牛劲最多能抵（元，会员价 × 20%）、余额够抵多少、实际抵多少 */
  niujinCap: number; niujinAfford: number; niujinOff: number;
  /** 一元都抵不了时还差多少牛劲（抵扣开关不可用，ia F6） */
  niujinShort: number;
  pay: number;
}
/** 算一单：会员价 + 运费 − 券 − 牛劲；牛劲按会员价的 20% 封顶，100 牛劲抵 1 元 */
export function quote(p: Product, balance: number, coupon: Pick<OwnedCoupon, 'type'> | null, useNiujin: boolean): Quote {
  const ship = shipOf(p), cOff = coupon ? couponOff(coupon, p) : 0;
  const niujinCap = Math.floor(p.member * 0.2), niujinAfford = Math.max(0, Math.floor(balance / 100));
  const off = useNiujin ? Math.min(niujinCap, niujinAfford, Math.max(0, p.member + ship - cOff)) : 0;
  return { price: p.price, member: p.member, ship, couponOff: cOff, niujinCap, niujinAfford, niujinOff: off, niujinShort: niujinAfford > 0 ? 0 : 100 - Math.max(0, balance),
    pay: Math.max(0, p.member + ship - cOff - off) };
}

/** 演示订单号：MILO-年月日-4 位（按当天第几单） */
export function orderId(now: number, n: number): string {
  const d = new Date(now), p = (x: number, k = 2) => String(x).padStart(k, '0');
  return `MILO-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(412 + n, 4)}`;
}

/* ---------- 操作（纯函数：旧状态 → 新状态）---------- */

/** 兑换一张卡券：扣牛劲；冻结卡同时加一张（成长引擎算） */
export function redeem(w: WalletState, type: CouponType, now: number): WalletState {
  const c = COUPONS[type];
  return { ...w, actions: [...w.actions, { atMs: now, kind: 'redeem', label: c.title, cost: c.cost, freeze: type === 'freeze' ? 1 : undefined, id: `c-${type}-${now}`, coupon: type }] };
}

/** 下单：记订单 + 牛劲花费（抵扣为 0 就不记流水）；券由订单的 couponId 标成已用 */
export function placeOrder(w: WalletState, p: Product, size: string | null, q: Quote, coupon: OwnedCoupon | null, now: number): { wallet: WalletState; order: Order } {
  const today = w.orders.filter((o) => new Date(o.atMs).toDateString() === new Date(now).toDateString()).length;
  const order: Order = { id: orderId(now, today), atMs: now, productId: p.id, name: p.name, size, price: q.price, member: q.member, ship: q.ship, couponOff: q.couponOff,
    niujinOff: q.niujinOff, pay: q.pay, couponId: coupon?.id ?? null, couponTitle: coupon?.title ?? null };
  const actions = q.niujinOff > 0 ? [...w.actions, { atMs: now, kind: 'order' as const, label: p.name, cost: q.niujinOff * 100, id: order.id }] : w.actions;
  return { wallet: { ...w, actions, orders: [...w.orders, order] }, order };
}

export const remind = (w: WalletState, productId: string, now: number): WalletState =>
  (w.restock.some((r) => r.productId === productId) ? w : { ...w, restock: [...w.restock, { productId, atMs: now }] });
export const mute = (w: WalletState, id: KnowledgeId): WalletState => (w.muted.includes(id) ? w : { ...w, muted: [...w.muted, id] });

/** 到货提醒的消息（演示：设了就当已到货，ia F6 用户 2026-10-07 选「本机 + 消息」） */
export function restockMessages(w: WalletState): Message[] {
  return w.restock.map((r) => ({ id: `m-restock-${r.productId}-${r.atMs}`, atMs: r.atMs, kind: 'restock' as const, niujin: 0,
    title: `${productById(r.productId)?.name ?? '商品'} 已到货`, detail: '演示：你设的到货提醒。真实上线后，到货时才会发这条' }));
}

/** 演示用户的钱包：兑换过一张免邮券（12 天前）和一张铁砧运动满减券（3 天前），都还没用 */
export function demoWallet(now: number): WalletState {
  let w = redeem(EMPTY_WALLET, 'shipping', now - 12 * DAY);
  w = redeem(w, 'merchant', now - 3 * DAY);
  return w;
}

/* ---------- 读写：真用户存 store.wallet；演示场景存模块内存 ---------- */
const mem = new Map<string, WalletState>(), subs = new Set<() => void>();
let ver = 0;
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const bump = () => { ver += 1; subs.forEach((f) => f()); };
/** 测试用 */
export const resetScenarioWallet = () => { mem.clear(); bump(); };

const scenarioWallet = (scenario: string, now: number) => mem.get(scenario) ?? demoWallet(now);

export function useWallet(scenario: string | undefined, now: number): [WalletState, (fn: (w: WalletState) => WalletState) => void] {
  const st = useStore();
  useSyncExternalStore(sub, () => ver);
  const w = scenario ? scenarioWallet(scenario, now) : st.wallet;
  const update = (fn: (w: WalletState) => WalletState) => {
    if (scenario) { mem.set(scenario, fn(scenarioWallet(scenario, now))); bump(); }
    else store.update((s) => ({ ...s, wallet: fn(s.wallet) }));
  };
  return [w, update];
}
