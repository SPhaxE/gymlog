/** 知识卡触发（6f，ia §1.16 触发表 2026-10-06）：数据说明「需要」的时候才给，不是广告。
 *  - 腰带：深蹲 / 硬拉类（杠铃）最近的预估 1RM ≥ 体重 × 1.5（需要档案体重；没填就不触发）→ 增量页
 *  - 肌酸：近 4 个整周每周正式组数一路不降、且最后一周比第一周多 ≥ 10% → 增量页
 *  - 蛋白质与睡眠：某个肌头的个人恢复系数 ≥ 1.15（恢复窗口比预期长）或近 7 天练超了上限（MRV）→ 容量页
 *  - 护膝：近 4 周平均每周膝主导动作（主练股四头）≥ 12 组 → 容量页
 *  - 助力带：没有「握力先力竭」的数据，不触发，作为通用卡留在商城（用户 2026-10-06）
 *  一屏最多一条：每页按上面的顺序取第一张没被静音、这次没被收起的。训练流程里不出现（只有容量页、增量页用）。 */
import { useSyncExternalStore } from 'react';
import { DAY, exerciseRecords, headStats, startOfDay } from '../engine';
import type { Session } from '../engine/types';
import { env, fmt, type Source } from './demo';
import type { KnowledgeId } from './growth';

export const BELT_RATIO = 1.5;
export const CREATINE_RISE = 0.1;
export const SLOW_FACTOR = 1.15;
export const KNEE_SETS = 12;

export interface TipHit {
  id: KnowledgeId;
  /** 按你的数据说的那句话 */
  why: string;
  /** 证据：腰带 = 预估 1RM ÷ 体重的走势（最后一点是现在） */
  evidence?: { label: string; value: string; unit: string; series: number[]; threshold: number; detail: string };
}

const QUAD_HEADS = ['inner-quadricep', 'outer-quadricep', 'rectus-femoris'];
const counted = (s: Session) => s.exercises.reduce((n, e) => n + (e.skipped ? 0 : e.sets.filter((x) => x.type !== 'warmup').length), 0);

/** 近 n 个整周（不含本周）每周的值，老的在前 */
function weekly(history: Session[], now: number, n: number, f: (s: Session) => number): number[] {
  const end = startOfDay(now) - ((new Date(startOfDay(now)).getDay() + 6) % 7) * DAY;
  return Array.from({ length: n }, (_, i) => {
    const from = end - (n - i) * 7 * DAY, to = from + 7 * DAY;
    return history.filter((s) => s.startMs >= from && s.startMs < to).reduce((a, s) => a + f(s), 0);
  });
}

function belt(src: Pick<Source, 'history' | 'profile'>, now: number): TipHit | null {
  const w = src.profile?.weightKg;
  if (!w) return null;
  let best: { name: string; e1rm: number; series: number[] } | null = null;
  for (const ex of env.exList) {
    if (ex.equipmentType !== 'barbell' || !/深蹲|硬拉/.test(ex.name) || /架上|箱|跳/.test(ex.name)) continue;
    const recs = exerciseRecords(env, src.history, ex.id).filter((r) => r.e1rm != null && r.session.startMs <= now);
    const last = recs.at(-1);
    if (!last || last.session.startMs < now - 28 * DAY) continue;
    // 近 4 周最好的一次；走势画「到那天为止的最好成绩」（减量周的低点不让线来回折）
    const top = Math.max(...recs.filter((r) => r.session.startMs >= now - 28 * DAY).map((r) => r.e1rm!));
    let run = 0;
    const series = recs.map((r) => (run = Math.max(run, r.e1rm!)) / w).slice(-12);
    if (!best || top > best.e1rm) best = { name: ex.name, e1rm: top, series };
  }
  if (!best || best.e1rm / w < BELT_RATIO) return null;
  const ratio = Math.round((best.e1rm / w) * 100) / 100;
  return { id: 'belt', why: `你的${best.name}预估 1RM 已到体重的 ${ratio} 倍`,
    evidence: { label: `${best.name}最好预估 1RM ÷ 体重`, value: ratio.toFixed(2), unit: '× 体重', series: best.series, threshold: BELT_RATIO, detail: `${fmt(best.e1rm)} kg ÷ ${fmt(w)} kg` } };
}

function creatine(src: Pick<Source, 'history'>, now: number): TipHit | null {
  const w = weekly(src.history, now, 4, counted);
  if (w[0] <= 0 || w.some((v, i) => i > 0 && v < w[i - 1]) || w[3] < w[0] * (1 + CREATINE_RISE)) return null;
  return { id: 'creatine', why: `你近 4 周的训练量一路在涨（每周 ${w[0]} → ${w[3]} 组）` };
}

function protein(src: Pick<Source, 'history' | 'profile'>, now: number): TipHit | null {
  const st = [...headStats(env, src.history, src.profile, now).values()].filter((h) => h.sets7d > 0 || h.lastSession);
  const slow = st.filter((h) => h.personal >= SLOW_FACTOR).sort((a, b) => b.personal - a.personal)[0];
  if (slow) return { id: 'protein', why: `你的${slow.name}恢复比预期窗口慢了约 ${Math.round((slow.personal - 1) * 100)}%` };
  const over = st.filter((h) => h.level === 'over').sort((a, b) => b.sets7d / b.mrv - a.sets7d / a.mrv)[0];
  return over ? { id: 'protein', why: `你的${over.name}近 7 天练了 ${fmt(over.sets7d)} 组，超过了能恢复的上限` } : null;
}

function knee(src: Pick<Source, 'history'>, now: number): TipHit | null {
  const kneeSets = (s: Session) => s.exercises.reduce((n, e) => {
    const ex = env.ex.get(e.exerciseId);
    return n + (!e.skipped && ex && ex.primaryHeads.some((h) => QUAD_HEADS.includes(h)) ? e.sets.filter((x) => x.type !== 'warmup').length : 0);
  }, 0);
  const avg = weekly(src.history, now, 4, kneeSets).reduce((a, b) => a + b, 0) / 4;
  return avg >= KNEE_SETS ? { id: 'knee', why: `你近 4 周每周约 ${Math.round(avg)} 组深蹲类动作，膝盖用得多` } : null;
}

/** 全部触发了的知识卡（顺序 = 优先级） */
export function knowledgeHits(src: Pick<Source, 'history' | 'profile'>, now: number): TipHit[] {
  return [belt(src, now), creatine(src, now), protein(src, now), knee(src, now)].filter((x): x is TipHit => !!x);
}

/** 每页挂哪几类（ia §1.16：只出现在容量页、增量页） */
export const TIP_PAGES: Record<'body' | 'gains', KnowledgeId[]> = { gains: ['belt', 'creatine'], body: ['protein', 'knee'] };

/** 这一页要显示的那一条：一屏最多一条，跳过静音的和这次收起的 */
export const tipFor = (page: 'body' | 'gains', hits: TipHit[], muted: KnowledgeId[], dismissed: KnowledgeId[] = []): TipHit | null =>
  hits.find((h) => TIP_PAGES[page].includes(h.id) && !muted.includes(h.id) && !dismissed.includes(h.id)) ?? null;

/** 商城「为你推荐」：第一张触发了的（不管静音——商城是用户自己进来的）；没有就给通用入门卡（助力带） */
export const recommendFor = (hits: TipHit[]): { id: KnowledgeId; why: string | null } => (hits[0] ? { id: hits[0].id, why: hits[0].why } : { id: 'straps', why: null });

/* ---- ✕ 收起：只管这一次打开 App（模块内存，刷新复位）；永久不提示走「不再提示这一类」（store.wallet.muted） ---- */
let closed: KnowledgeId[] = [];
const subs = new Set<() => void>();
export const dismissTip = (id: KnowledgeId) => { closed = [...closed, id]; subs.forEach((f) => f()); };
/** 测试用 */
export const resetDismissed = () => { closed = []; subs.forEach((f) => f()); };
export const useDismissed = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => closed);
