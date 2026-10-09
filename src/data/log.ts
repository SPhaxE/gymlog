/** 记录页（P07，ia §1.8）的数据：训练按「周一开始」分周，周头合计（次数 · 组数 · 总负荷），每次训练一行；钢板日历要的「练过的日子」。
 *  全部从历史现算，不存派生数据：删一次训练后重算，PR 标、周合计、日历上的孔自然回退（prMap 本来就是按历史重算的）。
 *  口径：
 *   - 主要部位 = mainRegions（按有效组数，最多 3 个）；组数 / 总负荷 = sessionStats（只算计入组，总负荷 = Σ 重量 × 次数）；
 *   - PR 数 = prMap 里这次训练创的 PR 个数，和结算页、奖励弹窗是同一个；
 *   - 日期不在今年时带年份（周头写完整年月日，行里写在周几前面）。
 *  传场景名走 mock，传 Source 走本机存储（同 homeData / gainsData）。 */
import { DAY, mainRegions, prMap, sessionStats, startOfDay, summarize, weekStart } from '../engine';
import type { SetType } from '../engine';
import { dateLabel, env, fmt, REGION_NAME, sourceOf, type Source } from './demo';

export interface LogRow {
  id: string;
  t: number;
  /** 「10/6」 */
  date: string;
  /** 周几（一…日） */
  weekday: string;
  /** 不在今年时才有 */
  year?: number;
  /** 主要部位，「下肢 · 背 · 手臂」；一个动作都没算上时写「训练」 */
  title: string;
  /** 「6 个动作 · 14 组 · 52 分钟」 */
  meta: string;
  prs: number;
  /** 这次的正式组数、总负荷（按月合计用） */
  sets: number; load: number;
}
export interface LogWeek {
  /** 这一周周一 0 点（毫秒），当 key 用 */
  key: number;
  /** 「本周」「上周」，更早的没有 */
  label: string;
  /** 「10月5日–10月11日」「9月21日–27日」「2025年12月29日–2026年1月4日」 */
  range: string;
  count: number;
  sets: number;
  load: number;
  rows: LogRow[];
}
export interface LogData {
  /** 新的在前 */
  weeks: LogWeek[];
  /** 练过的日子（startOfDay 毫秒），钢板日历用 */
  trained: Set<number>;
  /** 每个练过的日子 → 那天（最晚的）一次训练：钢板上选中一天时的读数，点「查看」打开它 */
  byDay: Map<number, PlateDayInfo>;
  total: number;
  empty: boolean;
}

const WD = '日一二三四五六';

export interface PlateDayInfo { id: string; t: number; date: string; regions: string; sets: number; load: number; prs: number }

/** 周一到周日的范围写法：同月省略后一个月份，跨年写完整年月日；只有不在今年才带年 */
export function weekRange(start: number, now: number): string {
  const a = new Date(start), b = new Date(start + 6 * DAY), y = new Date(now).getFullYear();
  const part = (d: Date, withYear: boolean, withMonth = true) => `${withYear ? `${d.getFullYear()}年` : ''}${withMonth ? `${d.getMonth() + 1}月` : ''}${d.getDate()}日`;
  if (a.getFullYear() !== b.getFullYear()) return `${part(a, true)}–${part(b, true)}`;
  const yr = a.getFullYear() !== y;
  return `${part(a, yr)}–${part(b, false, a.getMonth() !== b.getMonth())}`;
}

export function logData(scenario: string | Source, now: number): LogData {
  const { history } = typeof scenario === 'string' ? sourceOf(scenario, now) : scenario;
  const prs = prMap(env, history), thisWeek = weekStart(now), y = new Date(now).getFullYear();
  const byWeek = new Map<number, LogWeek>(), trained = new Set<number>(), byDay = new Map<number, PlateDayInfo>();
  for (const s of [...history].sort((a, b) => b.startMs - a.startMs)) {
    const k = weekStart(s.startMs), d = new Date(s.startMs), st = sessionStats(s);
    let w = byWeek.get(k);
    if (!w) { w = { key: k, label: k === thisWeek ? '本周' : k === thisWeek - 7 * DAY ? '上周' : '', range: weekRange(k, now), count: 0, sets: 0, load: 0, rows: [] }; byWeek.set(k, w); }
    w.count += 1; w.sets += st.sets; w.load += st.load;
    const regions = mainRegions(env, s).map((r) => REGION_NAME[r]).join(' · ');
    w.rows.push({
      id: s.id, t: s.startMs, date: `${d.getMonth() + 1}/${d.getDate()}`, weekday: WD[d.getDay()], year: d.getFullYear() === y ? undefined : d.getFullYear(),
      title: regions || '训练', meta: `${s.exercises.filter((e) => !e.skipped).length} 个动作 · ${st.sets} 组${s.durationMin ? ` · ${s.durationMin} 分钟` : ''}`, prs: prs.get(s.id)?.size ?? 0, sets: st.sets, load: st.load,
    });
    trained.add(startOfDay(s.startMs));
    const day = startOfDay(s.startMs);
    if (!byDay.has(day)) byDay.set(day, { id: s.id, t: day, date: `${d.getMonth() + 1}月${d.getDate()}日 周${WD[d.getDay()]}`, regions: regions || '训练', sets: st.sets, load: st.load, prs: prs.get(s.id)?.size ?? 0 });
  }
  const weeks = [...byWeek.values()].sort((a, b) => b.key - a.key);
  return { weeks, trained, byDay, total: history.length, empty: history.length === 0 };
}

/** 按月分组（2026-10-09 走查 1 选定 W2）：月 → 周 → 每次训练。按训练日期分月；一周跨两个月时拆在两个月里，各自只算本月那几次 */
export interface LogMonth { key: number; label: string; count: number; sets: number; load: number; weeks: LogWeek[] }
export function byMonth(weeks: LogWeek[], now: number): LogMonth[] {
  const y = new Date(now).getFullYear(), out = new Map<number, LogMonth>();
  for (const w of weeks) for (const r of w.rows) {
    const d = new Date(r.t), key = d.getFullYear() * 12 + d.getMonth();
    let m = out.get(key);
    if (!m) { m = { key, label: d.getFullYear() === y ? `${d.getMonth() + 1} 月` : `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`, count: 0, sets: 0, load: 0, weeks: [] }; out.set(key, m); }
    let mw = m.weeks.find((x) => x.key === w.key);
    if (!mw) { mw = { ...w, count: 0, sets: 0, load: 0, rows: [] }; m.weeks.push(mw); }
    mw.rows.push(r); mw.count += 1; mw.sets += r.sets; mw.load += r.load;
    m.count += 1; m.sets += r.sets; m.load += r.load;
  }
  return [...out.values()].sort((a, b) => b.key - a.key);
}

/** 一周的合计行：「2 次 · 25 组 · 9,244 kg」（读屏和测试用；页面上拆成三个带单位的数） */
export const weekTotals = (w: Pick<LogWeek, 'count' | 'sets' | 'load'>) => `${w.count} 次 · ${w.sets} 组 · ${fmt(w.load)} kg`;

/* ---------- 训练详情（P08）：每个动作每一组 ---------- */
export interface DetailSet {
  /** 计入组的序号（热身组不占序号） */
  n: number | null;
  type: SetType;
  /** 「26 kg」「自重」 */
  weight: string;
  /** 「8」「左 8 · 右 7」 */
  reps: string;
  rpe: number | null;
}
export interface DetailExercise { exerciseId: string; name: string; skipped: boolean; pr: boolean; sets: DetailSet[] }
export interface LogDetail {
  id: string;
  t: number;
  /** 「10月3日 周六」 */
  title: string;
  /** 「胸 · 肩 · 61 分钟」 */
  sub: string;
  stats: { exercises: number; sets: number; load: number };
  /** 这次创的 PR，增幅大的在前；gain = 比之前最好多了多少（和结算页、奖励弹窗同一口径，没有「之前」时为 null） */
  prs: { exerciseId: string; name: string; e1rm: number; gain: number | null }[];
  exercises: DetailExercise[];
}

const repsText = (s: { reps?: number | null; repsLeft?: number | null; repsRight?: number | null }) =>
  s.repsLeft != null || s.repsRight != null ? `左 ${s.repsLeft ?? 0} · 右 ${s.repsRight ?? 0}` : `${s.reps ?? 0}`;

/** 一次训练的详情；这次训练不在历史里（已被删除、地址写错）返回 null，页面给回记录页的出口 */
export function logDetail(scenario: string | Source, id: string, now: number): LogDetail | null {
  const { history } = typeof scenario === 'string' ? sourceOf(scenario, now) : scenario;
  const ses = history.find((x) => x.id === id);
  if (!ses) return null;
  const sum = summarize(env, history, ses), name = (exId: string) => env.ex.get(exId)?.name ?? exId;
  const regions = mainRegions(env, ses).map((r) => REGION_NAME[r]).join(' · ');
  const prs = sum.prs.flatMap((r) => (r.e1rm == null ? [] : [{ exerciseId: r.exerciseId, name: name(r.exerciseId), e1rm: r.e1rm, gain: r.prevBest != null ? r.e1rm - r.prevBest : null }]))
    .sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0));
  const exercises: DetailExercise[] = ses.exercises.map((e) => {
    let n = 0;
    const sets: DetailSet[] = e.skipped ? [] : e.sets.map((x) => ({
      n: x.type === 'warmup' ? null : ++n, type: x.type, weight: (x.weightKg ?? 0) > 0 ? `${fmt(x.weightKg!)} kg` : '自重', reps: repsText(x), rpe: x.rpe ?? null,
    }));
    return { exerciseId: e.exerciseId, name: name(e.exerciseId), skipped: e.skipped || !sets.some((x) => x.type !== 'warmup'), pr: sum.prs.some((r) => r.exerciseId === e.exerciseId), sets };
  });
  return {
    id: ses.id, t: ses.startMs, title: dateLabel(ses.startMs), sub: [regions, ses.durationMin ? `${ses.durationMin} 分钟` : ''].filter(Boolean).join(' · '),
    stats: { exercises: exercises.filter((e) => !e.skipped).length, sets: sum.sets, load: sum.load }, prs, exercises,
  };
}
