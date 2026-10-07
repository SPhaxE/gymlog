/** 「我的」与牛龄页（P11 / P13，ia §1.11 / §1.14 / §1.15）的数据：牛龄、连胜、成长记录、消息，全部从训练历史现算，不存计数器。
 *  - 牛龄 / 连胜 / 牛劲 / 事件：成长引擎 growth()；采纳过的减量周（deloads）按计划减量也算守约；
 *  - 离下一级：优先用「主项预估 1RM 再涨 X kg」，涨幅太大（> LIFT_MAX）就不写这个数，改写「再完成 N 个训练周期」——公牛段升一级要的成长值大，
 *    直接写「再涨 47.5 kg」没有可行动的意义（ia §1.14 要的是照着做得到的说法）；
 *  - 成长记录 = 引擎事件（升级、PR、连胜里程碑、训练周期、守约周、冻结卡）+ 删训练后的降级说明（降级发生在删的那一刻，事后算不出来，所以存了一条）；
 *  - 消息 = 同时达成多项时没弹出的其余奖励（一次训练只弹一个，其余合并成一条）+ 周结算里的奖励 / 冻结卡自动使用；未读 = 比「看过消息的时刻」新。 */
import { DAY, growth, GROWTH_CONFIG, levelInfo, REWARD_PRIORITY, STAGE_LABEL, type GrowthEvent, type GrowthState } from '../engine';
import type { DeloadState, Profile, Session } from '../engine/types';
import { env, fmt, type Source } from './demo';
import type { GrowthNote, WalletState } from './store';

/** 主项预估 1RM 要涨的 kg 超过这个数，就不写「再涨 X kg」 */
export const LIFT_MAX = 10;


/** 减量状态 → 减量周列表（演示场景只有最近一次；真存储另有 deloads 列表） */
export const deloadsOf = (deload: DeloadState, stored?: number[]): number[] => stored ?? (deload.status === 'adopted' ? [deload.atMs] : []);

/** wallet：用户兑换卡券、下单抵扣花掉的牛劲（6f，data/wallet.ts）；不传 = 没花过 */
export function growthOf(src: Pick<Source, 'history' | 'profile'> & { deloads?: number[]; deload?: DeloadState; wallet?: Pick<WalletState, 'actions'>; pro?: { fromMs: number; toMs: number }[] }, now: number): GrowthState {
  return growth(env, { history: src.history, profile: src.profile, now, deloads: src.deloads ?? (src.deload ? deloadsOf(src.deload) : []), wallet: src.wallet?.actions, pro: src.pro });
}

/** 「壮牛 · 2 级」 */
export const levelLabel = (g: Pick<GrowthState, 'stage' | 'sub'>) => `${STAGE_LABEL[g.stage]} · ${g.sub} 级`;

/** 离下一级的说法：lift = 主项预估 1RM 再涨多少（涨幅合理才有），cycles = 再完成几个训练周期；满级 / 没有下一级时为 null */
export function nextGoal(g: GrowthState): { pct: number; lift: { name: string; kg: number } | null; cycles: number; stageUp: boolean } | null {
  if (!g.next) return null;
  const lift = g.next.lift && g.next.lift.kg <= LIFT_MAX ? { name: g.next.lift.name, kg: g.next.lift.kg } : null;
  return { pct: Math.round(g.next.progress * 100), lift, cycles: g.next.cycles, stageUp: g.sub === 3 };
}

/* ---------- 成长记录 ---------- */

export type LogKind = 'level' | 'pr' | 'streak' | 'cycle' | 'freeze' | 'demote';
export interface GrowthLogRow {
  id: string;
  atMs: number;
  kind: LogKind;
  title: string;
  /** 补充一句：同一次训练的几个 PR 是哪几个、冻结卡 / 降级的说明 */
  detail?: string;
  /** 这一条发的牛劲；没有（冻结卡、降级说明）为 null */
  niujin: number | null;
}

/** 事件 → 一句话（成长记录与消息共用） */
export function eventTitle(e: GrowthEvent): string {
  switch (e.kind) {
    case 'stage': { const { stage } = levelInfo(e.level!); return `升段：${STAGE_LABEL[stage]}`; }
    case 'level': { const { stage, sub } = levelInfo(e.level!); return `升级：${STAGE_LABEL[stage]} ${sub} 级`; }
    case 'pr': return `PR：${e.exerciseName ?? ''} ${fmt(e.fromKg ?? 0)} → ${fmt(e.toKg ?? 0)} kg`;
    case 'streak': return `连胜 ${e.weeks} 周`;
    case 'cycle': return `完成第 ${e.weeks} 个训练周期`;
    case 'week': return `守约周 · 连胜 ${e.weeks} 周`;
    case 'freeze': return '冻结卡自动使用，连胜保住了';
  }
}

/** 合并消息里一项的短说法：PR 只写动作名（完整的「142 → 145 kg」在成长记录和记录页里有） */
const shortTitle = (e: GrowthEvent) => (e.kind === 'pr' ? `PR ${e.exerciseName ?? ''}` : eventTitle(e));

/** 成长记录（牛龄页）：新的在前。只记里程碑——升级 / 升段、连胜里程碑、训练周期、冻结卡自动使用、删训练后的降级说明；
 *  守约周每周都有（上面的十二周点阵已经画了），不进记录；同一次训练的几个 PR 合成一行（一次训练常常破好几个）。 */
export function growthLog(g: GrowthState, notes: GrowthNote[] = []): GrowthLogRow[] {
  const rows: GrowthLogRow[] = [], prs = new Map<string, GrowthEvent[]>();
  g.events.forEach((e, i) => {
    if (e.kind === 'week') return;
    if (e.kind === 'pr') { const k = e.sessionId ?? `t${e.atMs}`; prs.set(k, [...(prs.get(k) ?? []), e]); return; }
    const id = `${e.kind}-${e.atMs}-${i}`;
    if (e.kind === 'freeze') rows.push({ id, atMs: e.atMs, kind: 'freeze', title: '冻结卡自动使用', detail: `那一周没练够，连胜保住了（${e.weeks} 周）`, niujin: null });
    else rows.push({ id, atMs: e.atMs, kind: e.kind === 'stage' ? 'level' : e.kind, title: eventTitle(e), niujin: e.niujin });
  });
  for (const [k, evs] of prs) {
    const names = evs.slice(0, 3).map((e) => e.exerciseName ?? '').join('、') + (evs.length > 3 ? ' 等' : '');
    rows.push({ id: `pr-${k}`, atMs: Math.max(...evs.map((e) => e.atMs)), kind: 'pr', title: evs.length === 1 ? eventTitle(evs[0]) : `新纪录 ${evs.length} 个`, detail: evs.length === 1 ? undefined : names, niujin: evs.reduce((a, e) => a + e.niujin, 0) });
  }
  notes.forEach((n, i) => rows.push({ id: `${n.kind}-${n.atMs}-${i}`, atMs: n.atMs, kind: n.kind, title: '删除训练后重新计算', detail: n.text, niujin: null }));
  return rows.sort((a, b) => b.atMs - a.atMs);
}

/** 删除训练后，牛龄 / 连胜回退了吗？回退了就写一句话（不弹窗，只写进成长记录，ia §1.14）；没回退返回 null */
export function demoteNote(before: GrowthState, after: GrowthState, atMs: number): GrowthNote | null {
  const parts: string[] = [];
  if (after.level < before.level) parts.push(`牛龄 ${levelLabel(before)} → ${levelLabel(after)}`);
  if (after.streak.weeks < before.streak.weeks) parts.push(`连胜 ${before.streak.weeks} 周 → ${after.streak.weeks} 周`);
  return parts.length ? { atMs, kind: 'demote', text: parts.join('；') } : null;
}

/** 删掉一次训练前后各算一遍成长状态，回退了就返回要存的说明 */
export function noteForDelete(history: Session[], id: string, profile: Profile | null, deloads: number[], now: number): GrowthNote | null {
  const rest = history.filter((s) => s.id !== id);
  return demoteNote(growth(env, { history, profile, now, deloads }), growth(env, { history: rest, profile, now, deloads }), now);
}

/* ---------- 消息 ---------- */

export interface Message {
  id: string;
  atMs: number;
  kind: 'reward' | 'freeze' | 'restock';
  title: string;
  detail: string;
  /** 这一条入账的牛劲（冻结卡为 0）：页面单独一列右对齐 */
  niujin: number;
}

const rank = (e: GrowthEvent) => REWARD_PRIORITY.indexOf(e.kind);

/** 消息：新的在前。
 *  - 一次训练达成多项：弹窗只弹优先级最高的那个（ia §1.15），其余合并成一条「同时达成 N 项」；只达成一项就没有消息；
 *  - 周结算里的奖励（连胜里程碑、训练周期）没有训练可挂，直接是一条消息；冻结卡自动使用也是；守约周每周都有，不进消息（成长记录里有）。 */
export function messagesOf(g: GrowthState): Message[] {
  const bySession = new Map<string, GrowthEvent[]>(), out: Message[] = [];
  for (const e of g.events) {
    if (e.kind === 'week') continue;
    if (e.sessionId) bySession.set(e.sessionId, [...(bySession.get(e.sessionId) ?? []), e]);
    else if (e.kind === 'freeze') out.push({ id: `m-${e.kind}-${e.atMs}`, atMs: e.atMs, kind: 'freeze', title: '冻结卡已自动使用', detail: `那一周没练够，用掉 1 张冻结卡，连胜保住了（${e.weeks} 周）`, niujin: 0 });
    else out.push({ id: `m-${e.kind}-${e.atMs}`, atMs: e.atMs, kind: 'reward', title: eventTitle(e), detail: e.kind === 'streak' ? '周结算达成，已入账' : '周期结算达成，已入账', niujin: e.niujin });
  }
  for (const [sid, evs] of bySession) {
    const popup = [...evs].sort((a, b) => rank(a) - rank(b) || a.atMs - b.atMs)[0];
    const rest = evs.filter((e) => e !== popup);
    if (!rest.length) continue;
    const niujin = rest.reduce((a, e) => a + e.niujin, 0), atMs = Math.max(...rest.map((e) => e.atMs));
    const names = rest.slice(0, 3).map(shortTitle).join(' · ') + (rest.length > 3 ? ` 等 ${rest.length} 项` : '');
    out.push({ id: `m-${sid}`, atMs, kind: 'reward', title: rest.length === 1 ? eventTitle(rest[0]) : `同时达成 ${rest.length} 项`, detail: rest.length === 1 ? '和当天弹出的奖励一起达成' : names, niujin });
  }
  return out.sort((a, b) => b.atMs - a.atMs);
}

export const unreadOf = (messages: Message[], seenAt: number) => messages.filter((m) => m.atMs > seenAt).length;

/** 引擎常数（页面上不写死：每次 PR 加几点成长值等要用时从这里取） */
export const GROWTH = GROWTH_CONFIG;

/** 这周快断了吗（6g 补，牛龄页 StreakRisk / 「我的」成长卡）：引擎判 risk 时给「还差几次、还剩几天（含今天）」，否则 null */
export function riskOf(g: GrowthState, now: number): { need: number; daysLeft: number } | null {
  const cur = g.streak.current;
  if (!cur || cur.status !== 'risk') return null;
  const end = cur.start + 7 * DAY - 1;
  return { need: cur.target - cur.done, daysLeft: Math.floor((end - now) / DAY) + 1 };
}
