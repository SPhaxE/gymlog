/** 演示数据：全部来自 TS 引擎在演示场景（mock/）上的实算值，不手填数字。页面与预览页共用。 */
import { buildScenario, demoEnv } from '../engine/demo';
import { DAY, deloadSignal, deloadView, exerciseRecords, growth, headStats, prescribe, sessionHeadSets, sessionStats, startOfDay } from '../engine';
import type { DeloadView, HeadStat, Prescription, Stage } from '../engine';
import type { DeloadState, Profile, Region, Session } from '../engine/types';

export const env = demoEnv();
export const REGION_NAME: Record<Region, string> = { lower: '下肢', back: '背', chest: '胸', shoulders: '肩', arms: '手臂', core: '核心' };
export const PHASE_NAME = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '未练过' } as const;
export const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');
/** 多久以前：48 小时内写小时，再久写天 */
export const ago = (h: number) => (h < 48 ? `约 ${Math.max(1, Math.round(h))} 小时前` : `约 ${Math.round(h / 24)} 天前`);
export const dateLabel = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`; };

export interface BodyData { stats: Map<string, HeadStat>; kpi: { load: number; sets: number; days: number }; gender: 'male' | 'female'; trainedToday: boolean }

/** 数据源：演示场景（?scenario=，截图与回归用）或本机存储里的真实数据 */
export interface Source { history: Session[]; profile: Profile | null; deload: DeloadState; /** 采纳过的每一次减量（真存储才有；演示场景只有 deload 里最近一次） */ deloads?: number[] }
export const sourceOf = (scenario: string, now: number): Source => buildScenario(scenario, now);

export function bodyData(scenario: string | Source, now: number): BodyData {
  const { history, profile } = typeof scenario === 'string' ? sourceOf(scenario, now) : scenario;
  const stats = headStats(env, history, profile, now);
  let load = 0, sets = 0;
  const days = new Set<number>();
  for (const s of history) {
    if (s.startMs < now - 7 * DAY || s.startMs > now) continue;
    const st = sessionStats(s);
    load += st.load; sets += st.sets; days.add(startOfDay(s.startMs));
  }
  const trainedToday = history.some((s) => s.startMs >= startOfDay(now) && s.startMs <= now);
  return { stats, kpi: { load, sets, days: days.size }, gender: profile?.gender === 'female' ? 'female' : 'male', trainedToday };
}

/** 今天已练完（ia §1.2）：本次摘要 + 这次练到的肌头离黄金窗还有几小时（最快的在前） */
export interface DoneToday { session: Session; sets: number; load: number; stage: Stage; heads: { id: string; name: string; hours: number; recovery: number }[] }
export interface HomeData { rx: Prescription; dv: DeloadView; hits: number; sig: DeloadSignal; now: number; lastWeight: (exerciseId: string) => number | null; done: DoneToday | null }

/** 减量信号 + 它在此刻的状态（建议 / 减量周 / 这次不减 / 无）：首页、增量页都从这里取，状态行和面板才不会各说各话 */
export type DeloadSignal = ReturnType<typeof deloadSignal>;
export function deloadInfo(src: Pick<Source, 'history' | 'deload'>, now: number): { sig: DeloadSignal; dv: DeloadView } {
  const sig = deloadSignal(env, src.history);
  return { sig, dv: deloadView(env, sig, src.deload, now) };
}

export function homeData(scenario: string | Source, now: number): HomeData {
  const { history, profile, deload } = typeof scenario === 'string' ? sourceOf(scenario, now) : scenario;
  const { sig, dv } = deloadInfo({ history, deload }, now);
  const rx = prescribe(env, history, profile!, { now, deload: dv.kind === 'week' });
  const lastWeight = (id: string) => {
    const r = exerciseRecords(env, history, id).at(-1);
    if (!r) return null;
    const w = r.entry.sets.filter((s) => s.type === 'work').map((s) => s.weightKg ?? 0);
    return w.length ? Math.max(...w) : null;
  };
  const last = history.filter((s) => s.startMs >= startOfDay(now) && s.startMs <= now).at(-1);
  let done: DoneToday | null = null;
  if (last) {
    const stats = headStats(env, history, profile, now), { sets, load } = sessionStats(last);
    const ids = [...new Set(last.exercises.filter((e) => !e.skipped).flatMap((e) => env.ex.get(e.exerciseId)?.primaryHeads ?? []))];
    const heads = ids.flatMap((id) => { const h = stats.get(id); return h ? [{ id, name: h.name, hours: h.hoursLeft, recovery: h.recovery ?? 0 }] : []; }).sort((a, b) => a.hours - b.hours);
    done = { session: last, sets, load, heads, stage: growth(env, { history, profile, now }).stage };
  }
  return { rx, dv, hits: sig.hits.length, sig, now, lastWeight, done };
}

/** 肌头近 n 周每周组数（6g 补「高级分析 · 肌群容量趋势」，容量页肌头面板）：周一起算，最后一项是本周（还没过完）；
 *  组数口径同 sets7d（主练 1 组算 1、协同算 0.5）；deloads = 减量周开始的时间（那一周画斜纹） */
export function headWeeks(history: Session[], headId: string, now: number, deloads: number[], n = 8): { value: number; deload: boolean }[] {
  const monday = startOfDay(now) - ((new Date(startOfDay(now)).getDay() + 6) % 7) * DAY;
  return Array.from({ length: n }, (_, i) => {
    const from = monday - (n - 1 - i) * 7 * DAY, to = from + 7 * DAY;
    const value = history.filter((s) => s.startMs >= from && s.startMs < to && s.startMs <= now).reduce((a, s) => a + (sessionHeadSets(env, s).get(headId) ?? 0), 0);
    return { value: Math.round(value * 2) / 2, deload: deloads.some((ms) => ms >= from && ms < to) };
  });
}
