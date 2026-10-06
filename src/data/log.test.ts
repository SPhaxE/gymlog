import { describe, expect, it } from 'vitest';
import { DAY, e1rm, mainRegions, prMap, sessionStats, startOfDay, summarize, weekStart } from '../engine';
import type { Session } from '../engine';
import { env, homeData, sourceOf, type Source } from './demo';
import { gainsData } from './gains';
import { logData, logDetail, weekRange, weekTotals } from './log';
import { demoState } from './store';

// 取傍晚（同 gains.test.ts）；2026-10-03 是周六
const NOW = new Date(2026, 9, 3, 20.5).getTime();
const BENCH = 'barbell-bench-press-4';
const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h).getTime();
const sess = (id: string, startMs: number, sets: [number | null, number][], extra: Partial<Session> = {}): Session => ({
  id, startMs, ...extra, exercises: [{ exerciseId: BENCH, skipped: false, sets: sets.map(([w, r]) => ({ type: 'work' as const, weightKg: w, reps: r })) }],
});
const src = (history: Session[]): Source => ({ history, profile: sourceOf('plain-prescription', NOW).profile, deload: { status: 'none', atMs: 0 } });

describe('记录页的数据（P07，ia §1.8）', () => {
  it('演示数据：按周分组、新的在前，行数 = 训练数，练过的日子 = 有训练的天数', () => {
    const d = logData(demoState(NOW) as unknown as Source, NOW);
    expect(d.empty).toBe(false);
    expect(d.weeks.map((w) => w.key)).toEqual([...d.weeks.map((w) => w.key)].sort((a, b) => b - a));
    expect(d.weeks.flatMap((w) => w.rows)).toHaveLength(d.total);
    for (const w of d.weeks) for (const r of w.rows) expect(weekStart(r.t)).toBe(w.key);
    expect(d.trained.size).toBeGreaterThan(0);
    expect(d.trained.size).toBeLessThanOrEqual(d.total);
  });

  it('周合计 = 这一周每次训练的组数与总负荷之和（和 sessionStats 同一口径）', () => {
    const history = (demoState(NOW) as unknown as Source).history, d = logData(src(history), NOW);
    for (const w of d.weeks) {
      const ss = history.filter((s) => weekStart(s.startMs) === w.key).map(sessionStats);
      expect(w.count).toBe(ss.length);
      expect(w.sets).toBe(ss.reduce((n, x) => n + x.sets, 0));
      expect(w.load).toBeCloseTo(ss.reduce((n, x) => n + x.load, 0), 6);
    }
  });

  it('行里的部位、PR 数和引擎同口径；同一周里新的在前', () => {
    const history = (demoState(NOW) as unknown as Source).history, d = logData(src(history), NOW), prs = prMap(env, history);
    for (const w of d.weeks) {
      expect(w.rows.map((r) => r.t)).toEqual([...w.rows.map((r) => r.t)].sort((a, b) => b - a));
      for (const r of w.rows) {
        const s = history.find((x) => x.id === r.id)!;
        expect(r.prs).toBe(prs.get(s.id)?.size ?? 0);
        expect(r.title).toBe(mainRegions(env, s).length ? r.title : '训练');
      }
    }
  });

  it('钢板上选中一天的读数：每个练过的日子对上那天（最晚的）一次训练，日期、部位、组数、总负荷同口径', () => {
    const h = [sess('a', at(2026, 10, 1, 9), [[60, 8], [60, 8]]), sess('b', at(2026, 10, 1, 19), [[62.5, 8]]), sess('c', at(2026, 10, 3), [[60, 8], [60, 7]])];
    const d = logData(src(h), NOW);
    expect([...d.byDay.keys()].sort()).toEqual([...d.trained].sort());
    const oct1 = d.byDay.get(startOfDay(at(2026, 10, 1)))!;
    expect(oct1).toMatchObject({ id: 'b', date: '10月1日 周四', sets: 1, load: sessionStats(h[1]).load });
    expect(d.byDay.get(startOfDay(at(2026, 10, 3)))).toMatchObject({ id: 'c', date: '10月3日 周六', sets: 2 });
  });
  it('一个具体的周：10/1 周四胸推 3 组、10/3 周六胸推 2 组 → 本周合计 2 次 · 5 组，日期「10/3」周「六」', () => {
    const h = [sess('a', at(2026, 10, 1), [[60, 8], [60, 8], [60, 7]], { durationMin: 40 }), sess('b', at(2026, 10, 3, 12), [[62.5, 8], [62.5, 6]])];
    const d = logData(src(h), NOW), w = d.weeks[0];
    expect(d.weeks).toHaveLength(1);
    expect(w).toMatchObject({ label: '本周', range: '9月28日–10月4日', count: 2, sets: 5 });
    expect(w.load).toBeCloseTo(60 * 23 + 62.5 * 14, 6);
    expect(weekTotals(w)).toBe('2 次 · 5 组 · 2,255 kg');
    expect(w.rows[0]).toMatchObject({ id: 'b', date: '10/3', weekday: '六', title: expect.any(String) });
    expect(w.rows[1].meta).toBe('1 个动作 · 3 组 · 40 分钟');
    expect(w.rows[0].meta).toBe('1 个动作 · 2 组');
  });

  it('本周、上周有标，更早的没有；每周的范围写法对；同一周的两次训练只在一周里', () => {
    const h = [sess('a', at(2026, 9, 24), [[60, 8]]), sess('b', at(2026, 9, 29), [[60, 8]]), sess('c', at(2026, 9, 30), [[60, 8]]), sess('d', at(2026, 9, 10), [[60, 8]])];
    const d = logData(src(h), NOW);
    expect(d.weeks.map((w) => [w.label, w.range, w.count])).toEqual([['本周', '9月28日–10月4日', 2], ['上周', '9月21日–27日', 1], ['', '9月7日–13日', 1]]);
  });

  it('练过的日子按日去重（一天练了两次只算一天）', () => {
    const h = [sess('a', at(2026, 10, 2, 8), [[60, 8]]), sess('b', at(2026, 10, 2, 19), [[60, 8]])];
    const d = logData(src(h), NOW);
    expect(d.trained).toEqual(new Set([startOfDay(at(2026, 10, 2))]));
    expect(d.total).toBe(2);
  });

  it('不在今年的训练带年份；周范围：同月省略月份、跨月写两个月、跨年写完整年月日', () => {
    const h = [sess('old', at(2025, 12, 30), [[60, 8]])];
    expect(logData(src(h), NOW).weeks[0].rows[0].year).toBe(2025);
    expect(weekRange(at(2026, 9, 21, 0), NOW)).toBe('9月21日–27日');
    expect(weekRange(at(2026, 9, 28, 0), NOW)).toBe('9月28日–10月4日');
    expect(weekRange(at(2025, 12, 29, 0), NOW)).toBe('2025年12月29日–2026年1月4日');
    expect(weekRange(at(2025, 11, 3, 0), NOW)).toBe('2025年11月3日–9日');
  });

  it('没有任何训练 = 空', () => {
    const d = logData(src([]), NOW);
    expect(d).toMatchObject({ empty: true, total: 0, weeks: [] });
    expect(d.trained.size).toBe(0);
  });

  it('删一次训练后重算：周合计、行数、练过的日子、PR 标都回退（数据全是现算的）', () => {
    const h = [sess('a', at(2026, 9, 22), [[60, 8]]), sess('b', at(2026, 9, 25), [[62.5, 8]]), sess('c', at(2026, 10, 1), [[65, 8]])];  // 一次比一次重：b、c 各创一次 PR
    const before = logData(src(h), NOW), after = logData(src(h.filter((s) => s.id !== 'c')), NOW);
    expect(before.weeks.flatMap((w) => w.rows).find((r) => r.id === 'c')!.prs).toBe(1);
    expect(before.weeks.flatMap((w) => w.rows).find((r) => r.id === 'b')!.prs).toBe(1);
    expect(after.weeks.flatMap((w) => w.rows).map((r) => r.id)).toEqual(['b', 'a']);
    expect(after.total).toBe(2);
    expect(after.trained.has(startOfDay(at(2026, 10, 1)))).toBe(false);
    expect(after.weeks.flatMap((w) => w.rows).find((r) => r.id === 'b')!.prs).toBe(1);  // 删的是最后一次，前面的 PR 不变
    const mid = logData(src(h.filter((s) => s.id !== 'b')), NOW);
    expect(mid.weeks.flatMap((w) => w.rows).find((r) => r.id === 'c')!.prs).toBe(1);  // 删掉中间的：c 仍比 a 重，PR 还在
  });

  it('数据口径：DAY 与 weekStart 一致（周一 0 点）', () => {
    const k = weekStart(NOW);
    expect(new Date(k).getDay()).toBe(1);
    expect(weekStart(k + 6 * DAY + 3600e3)).toBe(k);
  });

  it('详情（P08）：每一组、热身不占序号、自重与单侧写法、PR 与增幅（和结算页同口径）', () => {
    const squat = (id: string, startMs: number, sets: Session['exercises'][number]['sets']): Session => ({ id, startMs, durationMin: 61, exercises: [{ exerciseId: BENCH, skipped: false, sets }, { exerciseId: 'chin-ups-184', skipped: false, sets: [{ type: 'work', weightKg: null, reps: 8 }] }, { exerciseId: 'barbell-squat-24', skipped: true, sets: [] }] });
    const h = [sess('a', at(2026, 9, 24), [[60, 8]]), squat('b', at(2026, 10, 1), [{ type: 'warmup', weightKg: 40, reps: 12 }, { type: 'work', weightKg: 65, reps: 8, rpe: 8 }, { type: 'work', weightKg: 65, reps: 7 }, { type: 'drop', weightKg: 50, reps: 10 }])];
    const d = logDetail(src(h), 'b', NOW)!;
    expect(d).toMatchObject({ id: 'b', title: '10月1日 周四', stats: { exercises: 2, sets: 4 } });
    expect(d.sub.endsWith('61 分钟')).toBe(true);
    const bench = d.exercises[0];
    expect(bench.sets.map((x) => [x.n, x.type, x.weight, x.reps, x.rpe])).toEqual([[null, 'warmup', '40 kg', '12', null], [1, 'work', '65 kg', '8', 8], [2, 'work', '65 kg', '7', null], [3, 'drop', '50 kg', '10', null]]);
    expect(d.exercises[1].sets[0]).toMatchObject({ weight: '自重', reps: '8' });
    expect(d.exercises[2]).toMatchObject({ skipped: true, sets: [] });
    expect(bench.pr).toBe(true);
    expect(d.prs[0]).toMatchObject({ exerciseId: BENCH, name: expect.any(String) });
    expect(d.prs[0].gain!).toBeGreaterThan(0);
    // 与结算页同一个 PR（summarize）
    expect(d.prs.map((x) => x.exerciseId)).toEqual(summarize(env, h, h[1]).prs.map((r) => r.exerciseId));
  });

  it('详情：单侧动作写「左 8 · 右 7」；不存在的训练返回 null（页面给回记录的出口）', () => {
    const uni: Session = { id: 'u', startMs: at(2026, 10, 2), exercises: [{ exerciseId: BENCH, skipped: false, sets: [{ type: 'work', weightKg: 12, repsLeft: 8, repsRight: 7 }] }] };
    expect(logDetail(src([uni]), 'u', NOW)!.exercises[0].sets[0]).toMatchObject({ weight: '12 kg', reps: '左 8 · 右 7' });
    expect(logDetail(src([uni]), 'nope', NOW)).toBeNull();
  });

  it('删掉最后一次：首页「上次重量」、增量页最新预估值、记录页的行与 PR 标一起回退（全是现算的，没有要手动失效的缓存）', () => {
    const h = [sess('a', at(2026, 9, 22), [[60, 8], [60, 8]]), sess('b', at(2026, 9, 25), [[62.5, 8], [62.5, 8]]), sess('c', at(2026, 10, 1), [[65, 8], [65, 8]])];
    const full = src(h), cut = src(h.filter((s) => s.id !== 'c'));
    expect(homeData(full, NOW).lastWeight(BENCH)).toBe(65);
    expect(homeData(cut, NOW).lastWeight(BENCH)).toBe(62.5);
    const row = (s: Source) => gainsData(s, NOW).rows.find((r) => r.exerciseId === BENCH)!;
    expect(row(full).latest!).toBeGreaterThan(row(cut).latest!);
    expect(row(cut).latest!).toBeCloseTo(e1rm(62.5, 8)!, 1);
    const rows = (s: Source) => logData(s, NOW).weeks.flatMap((w) => w.rows);
    expect(rows(full).find((r) => r.id === 'c')!.prs).toBe(1);
    expect(rows(cut).map((r) => r.id)).toEqual(['b', 'a']);
    expect(logData(cut, NOW).trained.has(startOfDay(at(2026, 10, 1)))).toBe(false);
  });
});

