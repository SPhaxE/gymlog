/** 增量总览的数据（P09，ia §1.9）：每个练过的动作一行——预估 1RM（自重动作用次数）、与上一次的涨跌、近 4 周有没有 PR、下次目标；
 *  再按引擎结论分成「该加重 / 保持 / 该减重」，加上近 4 周摘要与减量状态。
 *  口径只有一个：
 *   - 下次目标 = 引擎的 suggest（和首页处方同一个函数、同一份历史、同一个减量状态），首页有的动作两边的数一定一样；
 *   - 涨跌 = 最近一次与上一次比，±trendEps（1%）以内算持平，减量信号用的是同一个 trendDir；
 *   - PR = exerciseRecords 的 isPR，和结算页、奖励弹窗是同一个。
 *  传场景名走 mock，传 Source 走本机存储（同 homeData / bodyData）。 */
import { countedSets, DAY, e1rm, exerciseRecords, planFor, REGION_ORDER, regionOfEx, suggest, trendDir, bestReps } from '../engine';
import type { DeloadView, Region } from '../engine';
import type { Point } from '../components/charts';
import type { DeltaDir } from '../components/ui';
import { deloadInfo, env, fmt, sourceOf, type DeloadSignal, type Source } from './demo';

export type Verdict = 'add' | 'hold' | 'cut';
/** week = 减量周：目标重量已经 ×0.9，再分「该加重」会标题和数字自相矛盾，所以合成一组 */
export type GroupKind = Verdict | 'week';

export interface GainRow {
  exerciseId: string;
  name: string;
  region: Region;
  /** 引擎对下一次的结论（suggest 的 reason.kind；还没有工作组的「首次」并入保持） */
  verdict: Verdict;
  /** 有记录但还没有一组工作组：没有目标可给 */
  first: boolean;
  /** e1rm = 预估 1RM（kg）；reps = 自重动作，没有重量，用每次最好一组的次数 */
  metric: 'e1rm' | 'reps';
  unit: 'kg' | '次';
  /** 有记录的次数 */
  n: number;
  /** 有效数值少于 2 个：只有基线，没有涨跌 */
  baseline: boolean;
  latest: number | null;
  delta: { dir: DeltaDir; diff: number | null };
  /** 最近 8 个有效点，时间正序（迷你曲线用） */
  points: Point[];
  pr4w: boolean;
  lastMs: number;
  daysAgo: number;
  /** 下次目标，如「85 kg × 6」「自重 × 7」「65 kg × 8/8/7」；first 时为 null */
  target: { text: string; weightKg: number | null } | null;
  /** 减量周：目标重量已 ×0.9 */
  deloaded: boolean;
  reason: string;
}

export interface GainsSummary {
  /** 近 4 周的 PR 次数 */
  pr: number;
  /** 近 4 周练过的动作里：预估上升 / 持平 / 下降 / 只有基线（四项加起来 = trained） */
  up: number; flat: number; down: number; baseline: number;
  trained: number;
}

export interface GainsData {
  now: number;
  dv: DeloadView;
  sig: DeloadSignal;
  summary: GainsSummary;
  /** 已排序：近 4 周有 PR 的在前，再按最近练的时间；部位筛选与分组由页面做 */
  rows: GainRow[];
  /** 实有行的部位，按固定顺序 */
  regions: Region[];
  empty: boolean;
}

const WINDOW = 28 * DAY;
const POINTS = 8;
const md = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}/${d.getDate()}`; };

function repsText(reps: number[]) {
  return new Set(reps).size === 1 ? String(reps[0]) : reps.join('/');
}

/** 一个动作的一行（增量页列表与曲线页共用，数字是同一份）：没有这个动作或没有记录返回 null */
function build(history: Source['history'], id: string, now: number, week: boolean) {
  const ex = env.ex.get(id);
  if (!ex) return null;                                  // 动作库里已经没有的动作不出行
  const recs = exerciseRecords(env, history, id).filter((r) => r.session.startMs <= now);
  if (!recs.length) return null;

  // 指标：有预估 1RM 就用它；自重动作（算不出 1RM）退回每次最好一组的次数
  const metric: GainRow['metric'] = recs.some((r) => r.e1rm != null) ? 'e1rm' : 'reps';
  const val = (r: (typeof recs)[number]) => (metric === 'e1rm' ? r.e1rm : Math.max(0, ...countedSets(r.entry).map(bestReps)));
  const valid = recs.flatMap((r) => { const v = val(r); return v != null && v > 0 ? [{ r, v }] : []; });
  const last = recs[recs.length - 1];
  const cur = valid.at(-1)?.v ?? null, prev = valid.at(-2)?.v ?? null;
  const baseline = valid.length < 2;
  const dir: DeltaDir = baseline || cur == null || prev == null ? 'baseline'
    : metric === 'e1rm' ? trendDir(prev, cur, env.cfg.trendEps) : cur > prev ? 'up' : cur < prev ? 'down' : 'flat';
  const diff = baseline || cur == null || prev == null ? null : Math.round((cur - prev) * 10) / 10;

  const sg = suggest(env, history, ex, planFor(env, ex, week), week);
  const first = sg.reason.kind === 'first';
  const reps = repsText(sg.repsPerSet);
  const target = first ? null : { weightKg: sg.weightKg, text: (sg.weightKg ?? 0) > 0 ? `${fmt(sg.weightKg!)} kg × ${reps}` : `自重 × ${reps}` };

  const row: GainRow = {
    exerciseId: id, name: ex.name, region: regionOfEx(env, ex),
    verdict: first ? 'hold' : (sg.reason.kind as Verdict), first, metric, unit: metric === 'e1rm' ? 'kg' : '次',
    n: recs.length, baseline, latest: cur == null ? null : Math.round(cur * 10) / 10,
    delta: { dir, diff },
    points: valid.slice(-POINTS).map(({ r, v }) => ({ t: r.session.startMs, v, pr: r.isPR, label: md(r.session.startMs) })),
    pr4w: recs.some((r) => r.isPR && r.session.startMs > now - WINDOW),
    lastMs: last.session.startMs, daysAgo: Math.max(0, Math.floor((now - last.session.startMs) / DAY)),
    target, deloaded: week && !first, reason: sg.reason.text,
  };
  return { row, valid, metric };
}

export function gainsData(scenario: string | Source, now: number): GainsData {
  const src = typeof scenario === 'string' ? sourceOf(scenario, now) : scenario;
  const { history } = src;
  const { sig, dv } = deloadInfo(src, now);
  const week = dv.kind === 'week';

  const ids = new Set<string>();
  for (const s of history) for (const e of s.exercises) if (!e.skipped) ids.add(e.exerciseId);

  const rows: GainRow[] = [];
  for (const id of ids) {
    const b = build(history, id, now, week);
    if (b) rows.push(b.row);
  }
  rows.sort((a, b) => Number(b.pr4w) - Number(a.pr4w) || b.lastMs - a.lastMs || a.name.localeCompare(b.name, 'zh'));

  // 近 4 周摘要：只看最近一次记录落在窗口内的动作，涨跌用的就是行里的 delta，所以摘要和列表是同一个数
  const inWin = rows.filter((r) => r.lastMs > now - WINDOW);
  const summary: GainsSummary = { pr: 0, up: 0, flat: 0, down: 0, baseline: 0, trained: inWin.length };
  for (const r of inWin) {
    if (r.delta.dir === 'up') summary.up++; else if (r.delta.dir === 'flat') summary.flat++; else if (r.delta.dir === 'down') summary.down++; else summary.baseline++;
  }
  for (const id of ids) {
    if (!env.ex.has(id)) continue;
    summary.pr += exerciseRecords(env, history, id).filter((r) => r.isPR && r.session.startMs > now - WINDOW && r.session.startMs <= now).length;
  }

  const have = new Set(rows.map((r) => r.region));
  return { now, dv, sig, summary, rows, regions: REGION_ORDER.filter((r) => have.has(r)), empty: rows.length === 0 };
}

/** 分组：减量周合成一组；否则按引擎结论分「该加重 / 保持 / 该减重」，空组不出。传入的行已经按部位筛过 */
export function groupGains(rows: GainRow[], week: boolean): { kind: GroupKind; rows: GainRow[] }[] {
  if (week) return rows.length ? [{ kind: 'week', rows }] : [];
  return (['add', 'hold', 'cut'] as const).map((kind) => ({ kind, rows: rows.filter((r) => r.verdict === kind) })).filter((g) => g.rows.length);
}


/* ---------- 动作进步曲线页（P10）---------- */
export interface TrendSession {
  /** 开始时间（毫秒），也是曲线的横坐标 */
  t: number;
  /** 「10/3」 */
  label: string;
  /** 这次的值：预估 1RM（kg），自重动作是最好一组的次数 */
  v: number;
  pr: boolean;
  /** 最好一组，如「26 kg × 8」「自重 × 9」 */
  best: string;
  /** 这次每一组（热身组不计），如「26 kg × 8」 */
  sets: string[];
}
export interface TrendData {
  now: number;
  /** 和增量页同一行：最新值、涨跌、下次目标、理由都从这里取，两页的数一定一样 */
  row: GainRow;
  /** 时间正序，最多最近 24 次（曲线用） */
  sessions: TrendSession[];
  /** 最近 8 次，新的在前（明细表用） */
  recent: TrendSession[];
}

const setText = (s: { weightKg: number | null; reps?: number | null; repsLeft?: number | null; repsRight?: number | null }) => {
  const reps = bestReps(s as Parameters<typeof bestReps>[0]);
  return (s.weightKg ?? 0) > 0 ? `${fmt(s.weightKg!)} kg × ${reps}` : `自重 × ${reps}`;
};

/** 某个动作的全部曲线数据；动作不在库里、或还没有任何记录返回 null（页面提示「找不到」并给回增量页的出口） */
export function exerciseTrend(scenario: string | Source, exerciseId: string, now: number): TrendData | null {
  const src = typeof scenario === 'string' ? sourceOf(scenario, now) : scenario;
  const { dv } = deloadInfo(src, now);
  const b = build(src.history, exerciseId, now, dv.kind === 'week');
  if (!b) return null;
  const sessions: TrendSession[] = b.valid.slice(-24).map(({ r, v }) => {
    const sets = countedSets(r.entry);
    const best = b.metric === 'e1rm'
      ? sets.reduce((m, s) => ((e1rm(s.weightKg, bestReps(s)) ?? 0) > (e1rm(m.weightKg, bestReps(m)) ?? 0) ? s : m), sets[0])
      : sets.reduce((m, s) => (bestReps(s) > bestReps(m) ? s : m), sets[0]);
    return { t: r.session.startMs, label: md(r.session.startMs), v: Math.round(v * 10) / 10, pr: r.isPR, best: setText(best), sets: sets.map(setText) };
  });
  return { now, row: b.row, sessions, recent: [...sessions].reverse().slice(0, 8) };
}
