/** 会员 Milo Pro（6g，ia §1.17；线框 ?board=pro W2 + W3、?board=prohub W1）：只做设计与演示，任何功能都不拦截。
 *  - 开通 / 试用：假成功，不收集支付信息；存一段有效期（试用 7 天 / 月 30 天 / 年 365 天）。
 *  - 切回免费（会员中心「管理订阅」，二次确认）：当前一段在这一刻结束；之前 ×1.5 拿到的牛劲、送的冻结卡都不收回（ia 边界情况）。
 *  - 付费墙 W2「用你的数据讲权益」：多拿的牛劲 = 近 30 天进账 × 0.5；冻结卡每月 2 张；会员价省多少（推荐商品）；周期自动编排。没有历史的新用户退回通用对比表（W1）。
 *  - 演示场景（?scenario=）不读也不写存储，记在模块内存（同 wallet.ts）。 */
import { useSyncExternalStore } from 'react';
import { DAY, GROWTH_CONFIG, type GrowthState } from '../engine';
import { store, useStore, type ProPeriod } from './store';

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
  hasHistory: boolean;
}
/** 付费墙 W2 的「按你的数据」：从成长引擎的流水算（已经是会员的那几天按 ×1 还原） */
export function proFacts(g: GrowthState, now: number): ProFacts {
  const rate = GROWTH_CONFIG.niujin.proRate;
  const earned30 = Math.round(g.niujin.ledger.filter((r) => r.amount > 0 && r.atMs > now - 30 * DAY).reduce((a, r) => a + (r.pro ? r.amount / rate : r.amount), 0));
  return { earned30, extra30: Math.round(earned30 * (rate - 1)), freezePerMonth: GROWTH_CONFIG.proFreezePerMonth, streak: g.streak.weeks, hasHistory: g.niujin.ledger.length > 0 };
}

/** 本月 Pro 给了你什么（会员中心）：这个月 ×1.5 多拿的牛劲 · 冻结卡领 / 用 */
export function proThisMonth(g: GrowthState, now: number) {
  const d = new Date(now), from = new Date(d.getFullYear(), d.getMonth(), 1).getTime(), rate = GROWTH_CONFIG.niujin.proRate;
  const extra = Math.round(g.niujin.ledger.filter((r) => r.pro && r.amount > 0 && r.atMs >= from).reduce((a, r) => a + r.amount * (1 - 1 / rate), 0));
  const used = g.events.filter((e) => e.kind === 'freeze' && e.atMs >= from).length;
  return { extra, freezeGot: GROWTH_CONFIG.proFreezePerMonth, freezeUsed: used };
}

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
