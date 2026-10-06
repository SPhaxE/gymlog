import { describe, expect, it } from 'vitest';
import { DAY } from '../engine';
import type { Session } from '../engine';
import { homeData, sourceOf, type Source } from './demo';
import { exerciseTrend, gainsData, groupGains } from './gains';
import { demoState } from './store';

// 同 scenarios.test.ts：取傍晚
const NOW = new Date(2026, 9, 3, 20.5).getTime();
const BENCH = 'barbell-bench-press-4', PULLUP = 'chin-ups-184';

const sess = (id: string, daysAgo: number, exerciseId: string, sets: [number | null, number][]): Session => ({
  id, startMs: NOW - daysAgo * DAY, exercises: [{ exerciseId, skipped: false, sets: sets.map(([w, r]) => ({ type: 'work' as const, weightKg: w, reps: r })) }],
});
const src = (history: Session[]): Source => ({ history, profile: sourceOf('plain-prescription', NOW).profile, deload: { status: 'none', atMs: 0 } });

describe('增量总览的数据（ia §1.9）', () => {
  it('演示数据：三组结论都有，近 4 周有 PR', () => {
    const d = gainsData(demoState(NOW) as unknown as Source, NOW);
    const kinds = groupGains(d.rows, false).map((g) => g.kind);
    expect(kinds).toEqual(['add', 'hold', 'cut']);
    expect(d.summary.pr).toBeGreaterThan(0);
    expect(d.summary.trained).toBeGreaterThan(0);
  });

  it('摘要自洽：上升 + 持平 + 下降 + 基线 = 练过的动作数，且和列表是同一个数', () => {
    for (const sc of ['plain-prescription', 'deload-suggested', 'advanced-profile']) {
      const d = gainsData(sc, NOW), m = d.summary;
      expect(m.up + m.flat + m.down + m.baseline, sc).toBe(m.trained);
      const inWin = d.rows.filter((r) => r.lastMs > NOW - 28 * DAY);
      expect(inWin.filter((r) => r.delta.dir === 'up').length, sc).toBe(m.up);
      expect(inWin.filter((r) => r.delta.dir === 'down').length, sc).toBe(m.down);
    }
  });

  it('「下次目标」和首页处方是同一个数（重量、理由）', () => {
    for (const sc of ['plain-prescription', 'deload-suggested', 'deload-adopted', 'advanced-profile']) {
      const rx = homeData(sc, NOW).rx;
      const d = gainsData(sc, NOW);
      expect(rx.kind, sc).toBe('plan');
      if (rx.kind !== 'plan') continue;
      for (const it of rx.items) {
        const row = d.rows.find((r) => r.exerciseId === it.exerciseId);
        if (!row) continue;                                    // 处方里有、但从没练过的新动作：增量页没有行
        expect(row.target?.weightKg ?? null, `${sc} ${it.name}`).toBe(it.suggestion.weightKg);
        expect(row.reason, `${sc} ${it.name}`).toBe(it.suggestion.reason.text);
      }
    }
  });

  it('减量周：所有行合成一组「week」，目标重量标注已减量', () => {
    const d = gainsData('deload-adopted', NOW);
    expect(d.dv.kind).toBe('week');
    const g = groupGains(d.rows, true);
    expect(g.map((x) => x.kind)).toEqual(['week']);
    expect(g[0].rows.length).toBe(d.rows.length);
    expect(d.rows.some((r) => r.deloaded)).toBe(true);
    expect(groupGains([], true)).toEqual([]);
  });

  it('没练过任何动作：空', () => {
    const d = gainsData('cold-start', NOW);
    expect(d.empty).toBe(true);
    expect(d.rows).toEqual([]);
    expect(d.summary).toEqual({ pr: 0, up: 0, flat: 0, down: 0, baseline: 0, trained: 0 });
    expect(d.regions).toEqual([]);
  });

  it('只练过 1 次：基线，没有涨跌，也没有工作组 → 没有目标可给', () => {
    const d = gainsData(src([sess('a', 3, BENCH, [[60, 8]])]), NOW);
    expect(d.rows).toHaveLength(1);
    const r = d.rows[0];
    expect(r.baseline).toBe(true);
    expect(r.delta).toEqual({ dir: 'baseline', diff: null });
    expect(d.summary).toMatchObject({ baseline: 1, trained: 1, up: 0, down: 0 });
  });

  it('涨跌带 ±1% 的持平边界；方向与数值同源', () => {
    const run = (w2: number) => gainsData(src([sess('a', 10, BENCH, [[100, 5]]), sess('b', 3, BENCH, [[w2, 5]])]), NOW).rows[0];
    expect(run(100.5).delta.dir).toBe('flat');
    expect(run(110).delta.dir).toBe('up');
    expect(run(90).delta.dir).toBe('down');
    expect(run(110).delta.diff).toBeGreaterThan(0);
    expect(run(90).delta.diff).toBeLessThan(0);
  });

  it('自重动作没有 1RM：改用次数比，单位写「次」', () => {
    const d = gainsData(src([sess('a', 10, PULLUP, [[null, 5]]), sess('b', 3, PULLUP, [[null, 7]])]), NOW);
    const r = d.rows[0];
    expect(r.metric).toBe('reps');
    expect(r.unit).toBe('次');
    expect(r.latest).toBe(7);
    expect(r.delta).toEqual({ dir: 'up', diff: 2 });
  });

  it('动作库里没有的动作 id：不出行、不报错', () => {
    const d = gainsData(src([sess('a', 3, 'not-an-exercise', [[50, 8]]), sess('b', 3, BENCH, [[60, 8]])]), NOW);
    expect(d.rows.map((r) => r.exerciseId)).toEqual([BENCH]);
  });

  it('超过 4 周没练的动作：不进摘要，列表里仍然在', () => {
    const d = gainsData(src([sess('a', 70, BENCH, [[60, 8]]), sess('b', 60, BENCH, [[65, 8]])]), NOW);
    expect(d.rows).toHaveLength(1);
    expect(d.rows[0].daysAgo).toBe(60);
    expect(d.summary.trained).toBe(0);
  });

  it('排序：近 4 周有 PR 的在前；部位按固定顺序、只列实有的', () => {
    const d = gainsData('plain-prescription', NOW);
    const firstNoPr = d.rows.findIndex((r) => !r.pr4w);
    expect(firstNoPr === -1 || d.rows.slice(firstNoPr).every((r) => !r.pr4w)).toBe(true);
    expect(new Set(d.regions).size).toBe(d.regions.length);
    expect(d.regions.every((g) => d.rows.some((r) => r.region === g))).toBe(true);
  });

  it('迷你曲线：最多 8 个点，时间正序', () => {
    for (const r of gainsData('plain-prescription', NOW).rows) {
      expect(r.points.length).toBeLessThanOrEqual(8);
      expect(r.points.map((p) => p.t)).toEqual([...r.points.map((p) => p.t)].sort((a, b) => a - b));
    }
  });

  it('暴露减量信号，页面不用再算一遍', () => {
    expect(gainsData('deload-suggested', NOW).dv.kind).toBe('suggest');
    expect(gainsData('deload-suggested', NOW).sig.hits.length).toBeGreaterThan(0);
  });
});

describe('动作进步曲线的数据（P10）', () => {
  it('和增量页同一行：最新值、涨跌、下次目标一字不差', () => {
    const list = gainsData('plain-prescription', NOW);
    for (const r of list.rows) {
      const tr = exerciseTrend('plain-prescription', r.exerciseId, NOW)!;
      expect(tr, r.name).not.toBeNull();
      expect(tr.row, r.name).toEqual(r);
      expect(tr.sessions.at(-1)?.v, r.name).toBe(r.latest);
    }
  });

  it('曲线时间正序、最多 24 点；明细最近 8 次、新的在前', () => {
    const tr = exerciseTrend('plain-prescription', BENCH, NOW) ?? exerciseTrend('plain-prescription', gainsData('plain-prescription', NOW).rows[0].exerciseId, NOW)!;
    const ts = tr.sessions.map((x) => x.t);
    expect(ts).toEqual([...ts].sort((a, b) => a - b));
    expect(tr.sessions.length).toBeLessThanOrEqual(24);
    expect(tr.recent.length).toBeLessThanOrEqual(8);
    expect(tr.recent.map((x) => x.t)).toEqual([...tr.recent.map((x) => x.t)].sort((a, b) => b - a));
  });

  it('PR 点和结算页同一口径（exerciseRecords 的 isPR）；第一次是基线不算 PR', () => {
    const tr = exerciseTrend(src([sess('a', 30, BENCH, [[60, 8]]), sess('b', 20, BENCH, [[65, 8]]), sess('c', 10, BENCH, [[65, 8]])]), BENCH, NOW)!;
    expect(tr.sessions.map((x) => x.pr)).toEqual([false, true, false]);
  });

  it('每次的各组与最好一组：热身组不计，最好一组按预估 1RM 选', () => {
    const history: Session[] = [{ id: 'a', startMs: NOW - 3 * DAY, exercises: [{ exerciseId: BENCH, skipped: false, sets: [
      { type: 'warmup', weightKg: 20, reps: 10 }, { type: 'work', weightKg: 60, reps: 8 }, { type: 'work', weightKg: 62.5, reps: 6 }, { type: 'work', weightKg: 60, reps: 7 }] }] }];
    const tr = exerciseTrend(src(history), BENCH, NOW)!;
    expect(tr.sessions[0].sets).toEqual(['60 kg × 8', '62.5 kg × 6', '60 kg × 7']);
    expect(tr.sessions[0].best).toBe('60 kg × 8');          // 60×8 ≈ 76 > 62.5×6 ≈ 75
  });

  it('只练过 1 次：一个点，是基线', () => {
    const tr = exerciseTrend(src([sess('a', 3, BENCH, [[60, 8]])]), BENCH, NOW)!;
    expect(tr.sessions).toHaveLength(1);
    expect(tr.row.baseline).toBe(true);
  });

  it('自重动作：用次数，单位「次」，组写「自重 × N」', () => {
    const tr = exerciseTrend(src([sess('a', 10, PULLUP, [[null, 5], [null, 5]]), sess('b', 3, PULLUP, [[null, 7], [null, 6]])]), PULLUP, NOW)!;
    expect(tr.row.unit).toBe('次');
    expect(tr.sessions.map((x) => x.v)).toEqual([5, 7]);
    expect(tr.sessions[1].sets).toEqual(['自重 × 7', '自重 × 6']);
    expect(tr.sessions[1].best).toBe('自重 × 7');
  });

  it('动作不存在或没有记录：null（页面给「找不到」和回增量页的出口）', () => {
    expect(exerciseTrend('plain-prescription', 'not-an-exercise', NOW)).toBeNull();
    expect(exerciseTrend('cold-start', BENCH, NOW)).toBeNull();
  });
});
