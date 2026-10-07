/** 会员 Milo Pro（6g，ia §1.17；线框 ?board=pro W2 + W3、?board=prohub W1）：只做设计与演示，任何功能都不拦截。
 *  - 开通 / 试用：假成功，不收集支付信息；存一段有效期（试用 7 天 / 月 30 天 / 年 365 天）。
 *  - 切回免费（会员中心「管理订阅」，二次确认）：当前一段在这一刻结束；之前 ×1.5 拿到的牛劲、送的冻结卡都不收回（ia 边界情况）。
 *  - 付费墙 W2「用你的数据讲权益」：多拿的牛劲 = 近 30 天进账 × 0.5；冻结卡每月 2 张；会员价省多少（推荐商品）；周期自动编排。没有历史的新用户退回通用对比表（W1）。
 *  - 演示场景（?scenario=）不读也不写存储，记在模块内存（同 wallet.ts）。 */
import { useSyncExternalStore } from 'react';
import { DAY, GROWTH_CONFIG, type GrowthState } from '../engine';
import { SHOP_PRODUCTS, type KnowledgeId, type Product } from './growth';
import { store, useStore, type Order, type ProPeriod } from './store';

export type Plan = ProPeriod['plan'];
export const PLAN_DAYS: Record<Plan, number> = { trial: 7, month: 30, year: 365 };
export const PLAN_PRICE: Record<Plan, string> = { trial: '7 天', month: '¥18', year: '¥128' };

/** 现在有效的那一段（没有 = 免费） */
export const activeOf = (ps: ProPeriod[], now: number) => ps.find((p) => now >= p.fromMs && now <= p.toMs) ?? null;
/** 会员状态：free / trial / pro；剩几天 */
export function proStatus(ps: ProPeriod[], now: number): { kind: 'free' | 'trial' | 'pro'; period: ProPeriod | null; daysLeft: number } {
  const p = activeOf(ps, now);
  return { kind: !p ? 'free' : p.plan === 'trial' ? 'trial' : 'pro', period: p, daysLeft: p ? Math.max(0, Math.ceil((p.toMs - now) / DAY)) : 0 };
}
/** 用过试用就不再给试用 */
export const trialUsed = (ps: ProPeriod[]) => ps.some((p) => p.plan === 'trial');

export const activate = (ps: ProPeriod[], plan: Plan, now: number): ProPeriod[] => {
  const cur = activeOf(ps, now);
  // 试用中改开正式：试用这一段就此结束，正式从现在起算
  const rest = cur ? ps.map((p) => (p === cur ? { ...p, toMs: now - 1 } : p)) : ps;
  return [...rest, { plan, fromMs: now, toMs: now + PLAN_DAYS[plan] * DAY }];
};
export const cancel = (ps: ProPeriod[], now: number): ProPeriod[] => ps.map((p) => (now >= p.fromMs && now <= p.toMs ? { ...p, toMs: now - 1 } : p));

/** 给成长引擎的有效期 */
export const proPeriods = (ps: ProPeriod[]) => ps.map(({ fromMs, toMs }) => ({ fromMs, toMs }));

export interface ProFacts {
  /** 近 30 天进账（不含会员加成）与 Pro 会多给的 */
  earned30: number; extra30: number;
  freezePerMonth: number;
  streak: number;
  /** 近 30 天有进账才讲得出「你的账单」；没有（新用户、很久没练）退回通用对比表 W1 */
  hasHistory: boolean;
}
/** 付费墙 W2 的「按你的数据」：从成长引擎的流水算（已经是会员的那几天按 ×1 还原） */
export function proFacts(g: GrowthState, now: number): ProFacts {
  const rate = GROWTH_CONFIG.niujin.proRate;
  const earned30 = Math.round(g.niujin.ledger.filter((r) => r.amount > 0 && r.atMs > now - 30 * DAY).reduce((a, r) => a + (r.pro ? r.amount / rate : r.amount), 0));
  return { earned30, extra30: Math.round(earned30 * (rate - 1)), freezePerMonth: GROWTH_CONFIG.proFreezePerMonth, streak: g.streak.weeks, hasHistory: earned30 > 0 };
}

/** 本月 Pro 给了你什么（会员中心）：这个月 ×1.5 多拿的牛劲 · 冻结卡领 / 用 */
export function proThisMonth(g: GrowthState, now: number) {
  const d = new Date(now), from = new Date(d.getFullYear(), d.getMonth(), 1).getTime(), rate = GROWTH_CONFIG.niujin.proRate;
  const extra = Math.round(g.niujin.ledger.filter((r) => r.pro && r.amount > 0 && r.atMs >= from).reduce((a, r) => a + r.amount * (1 - 1 / rate), 0));
  const used = g.events.filter((e) => e.kind === 'freeze' && e.atMs >= from).length;
  return { extra, freezeGot: GROWTH_CONFIG.proFreezePerMonth, freezeUsed: used };
}

/** 免费 vs Pro 完整对比（付费墙「看完整对比」、没有历史的新用户；ia §1.17 Pro 权益） */
export const PRO_PERKS: [string, string, string][] = [
  ['处方 · 记录 · 容量 · 增量', '✓', '✓'], ['周期计划自动编排', '—', '✓'], ['高级分析', '—', '✓'],
  ['牛劲', '×1', '×1.5'], ['连胜冻结卡', '兑换', '每月 2 张'], ['商城会员价 · 免邮券', '—', '✓'], ['数据导出', '—', '✓'],
];

/** 付费墙「会员价省多少」举的那件商品：被数据触发的知识卡对应的商品优先，没有就挑省得最多的（只看在售） */
export function pitchProduct(hits: { id: KnowledgeId }[]): Product {
  const byHit = hits.map((h) => SHOP_PRODUCTS.find((p) => p.knowledge === h.id && p.status !== 'oos')).find(Boolean);
  return byHit ?? [...SHOP_PRODUCTS].filter((p) => p.status !== 'oos').sort((a, b) => b.price - b.member - (a.price - a.member))[0];
}

export interface PerkLine { value: string; unit?: string; reason: string }
/** 付费墙 W2 的四条：都按这个人的数据写（Stitch 付费墙 V2 的单卡 + 刻度尺；docs/brief.md 2026-10-07） */
export function proPitch(f: ProFacts, product: Product): PerkLine[] {
  return [
    { value: `+${f.extra30.toLocaleString('en-US')}`, unit: '牛劲', reason: `你这 30 天拿了 ${f.earned30.toLocaleString('en-US')}，Pro ×${GROWTH_CONFIG.niujin.proRate}` },
    { value: String(f.freezePerMonth), unit: '张冻结卡 / 月', reason: f.streak > 0 ? `断档那周自动用，连胜 ${f.streak} 周不会断` : '断档那周自动用，连胜不会断' },
    { value: `¥${product.price - product.member}`, unit: '会员价省', reason: `${product.name} ¥${product.price} → ¥${product.member}` },
    { value: '周期自动编排', reason: '减量周到点自动插进处方' },
  ];
}

/** 会员价这个月省下多少：本月下的演示订单里，下单那一刻是会员的，原价 − 会员价 */
export const proSaved = (orders: Order[], ps: ProPeriod[], from: number) =>
  orders.filter((o) => o.atMs >= from && activeOf(ps, o.atMs)).reduce((a, o) => a + (o.price - o.member), 0);
export const monthStart = (now: number) => { const d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };

/** 「2027 年 10 月 7 日」 */
export const dayText = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`; };
export const PLAN_NAME: Record<Plan, string> = { trial: '试用', month: '月度', year: '年度' };

/* ---- 读写：真用户存 store.pro；演示场景存模块内存 ---- */
const mem = new Map<string, ProPeriod[]>(), subs = new Set<() => void>();
let ver = 0;
const bump = () => { ver += 1; subs.forEach((f) => f()); };
export const resetScenarioPro = () => { mem.clear(); bump(); };
export function usePro(scenario: string | undefined): [ProPeriod[], (fn: (ps: ProPeriod[]) => ProPeriod[]) => void] {
  const st = useStore();
  useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => ver);
  const ps = scenario ? mem.get(scenario) ?? [] : st.pro;
  const update = (fn: (ps: ProPeriod[]) => ProPeriod[]) => {
    if (scenario) { mem.set(scenario, fn(mem.get(scenario) ?? [])); bump(); }
    else store.update((s) => ({ ...s, pro: fn(s.pro) }));
  };
  return [ps, update];
}
