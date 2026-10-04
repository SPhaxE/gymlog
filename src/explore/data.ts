/** 高保真页的数据：全部来自 TS 引擎在演示场景上的实算值（mock/），不手填数字。 */
import { buildScenario, demoEnv } from '../engine/demo';
import { DAY, deloadSignal, deloadView, exerciseRecords, headStats, prescribe, sessionStats, startOfDay } from '../engine';
import type { DeloadView, HeadStat, Prescription } from '../engine';
import type { Region } from '../engine/types';

export const env = demoEnv();
export const REGION_NAME: Record<Region, string> = { lower: '下肢', back: '背', chest: '胸', shoulders: '肩', arms: '手臂', core: '核心' };
export const PHASE_NAME = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '未练过' } as const;
export const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');
/** 多久以前：48 小时内写小时，再久写天 */
export const ago = (h: number) => (h < 48 ? `约 ${Math.max(1, Math.round(h))} 小时前` : `约 ${Math.round(h / 24)} 天前`);
export const dateLabel = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`; };

export interface BodyData { stats: Map<string, HeadStat>; kpi: { load: number; sets: number; days: number }; gender: 'male' | 'female'; trainedToday: boolean }

export function bodyData(scenario: string, now: number): BodyData {
  const { history, profile } = buildScenario(scenario, now);
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

export interface HomeData { rx: Prescription; dv: DeloadView; hits: number; now: number; lastWeight: (exerciseId: string) => number | null }

export function homeData(scenario: string, now: number): HomeData {
  const { history, profile, deload } = buildScenario(scenario, now);
  const sig = deloadSignal(env, history);
  const dv = deloadView(env, sig, deload, now);
  const rx = prescribe(env, history, profile!, { now, deload: dv.kind === 'week' });
  const lastWeight = (id: string) => {
    const r = exerciseRecords(env, history, id).at(-1);
    if (!r) return null;
    const w = r.entry.sets.filter((s) => s.type === 'work').map((s) => s.weightKg ?? 0);
    return w.length ? Math.max(...w) : null;
  };
  return { rx, dv, hits: sig.hits.length, now, lastWeight };
}
