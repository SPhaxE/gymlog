/** 记录页（P07，ia §1.8）的数据：训练按「周一开始」分周，周头合计（次数 · 组数 · 总负荷），每次训练一行；钢板日历要的「练过的日子」。
 *  全部从历史现算，不存派生数据：删一次训练后重算，PR 标、周合计、日历上的孔自然回退（prMap 本来就是按历史重算的）。
 *  口径：
 *   - 主要部位 = mainRegions（按有效组数，最多 3 个）；组数 / 总负荷 = sessionStats（只算计入组，总负荷 = Σ 重量 × 次数）；
 *   - PR 数 = prMap 里这次训练创的 PR 个数，和结算页、奖励弹窗是同一个；
 *   - 日期不在今年时带年份（周头写完整年月日，行里写在周几前面）。
 *  传场景名走 mock，传 Source 走本机存储（同 homeData / gainsData）。 */
import { mainRegions, prMap, sessionStats, startOfDay, weekStart, DAY } from '../engine';
import { env, fmt, REGION_NAME, sourceOf, type Source } from './demo';

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
  total: number;
  empty: boolean;
}

const WD = '日一二三四五六';

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
  const byWeek = new Map<number, LogWeek>(), trained = new Set<number>();
  for (const s of [...history].sort((a, b) => b.startMs - a.startMs)) {
    const k = weekStart(s.startMs), d = new Date(s.startMs), st = sessionStats(s);
    let w = byWeek.get(k);
    if (!w) { w = { key: k, label: k === thisWeek ? '本周' : k === thisWeek - 7 * DAY ? '上周' : '', range: weekRange(k, now), count: 0, sets: 0, load: 0, rows: [] }; byWeek.set(k, w); }
    w.count += 1; w.sets += st.sets; w.load += st.load;
    const regions = mainRegions(env, s).map((r) => REGION_NAME[r]).join(' · ');
    w.rows.push({
      id: s.id, t: s.startMs, date: `${d.getMonth() + 1}/${d.getDate()}`, weekday: WD[d.getDay()], year: d.getFullYear() === y ? undefined : d.getFullYear(),
      title: regions || '训练', meta: `${s.exercises.filter((e) => !e.skipped).length} 个动作 · ${st.sets} 组${s.durationMin ? ` · ${s.durationMin} 分钟` : ''}`, prs: prs.get(s.id)?.size ?? 0,
    });
    trained.add(startOfDay(s.startMs));
  }
  const weeks = [...byWeek.values()].sort((a, b) => b.key - a.key);
  return { weeks, trained, total: history.length, empty: history.length === 0 };
}

/** 一周的合计行：「2 次 · 25 组 · 9,244 kg」（读屏和测试用；页面上拆成三个带单位的数） */
export const weekTotals = (w: Pick<LogWeek, 'count' | 'sets' | 'load'>) => `${w.count} 次 · ${w.sets} 组 · ${fmt(w.load)} kg`;
