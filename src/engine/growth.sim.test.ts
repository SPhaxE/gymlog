/** 等级曲线回归测试（阶段 5.5c）：三类合成用户跑 3.5 年，检查升级节奏是否还在 brief §3 定的目标区间里。
 *  GROWTH_DERIVE=1：按目标节奏从「进阶用户」的曲线反推 15 级门槛并打印（改了成长值规则后用它重新定数）；
 *  GROWTH_WRITE=1：把三条曲线写到 src/engine/growthCurve.json（给 /playground 的曲线图用）。 */
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demoEnv } from './demo';
import { growth, GROWTH_CONFIG, STAGE_LABEL, levelInfo } from './growth';
import { simulateUser, SIM_START, type SimKind } from './growth.sim';
import { DAY } from './sets';

const env = demoEnv();
const WEEKS = 182;
/** 进阶用户（稳定训练）到达第 1…14 级的目标周数（2026-10-05 用户拍板：小牛≈2 月、壮牛≈6 月、公牛≈12 月、Milo≈24 月；前 2 个月每 2–3 周升一小级） */
export const TARGET_WEEKS = [2.5, 5, 8, 12, 18, 26, 34, 43, 52, 64, 78, 104, 130, 156];
const wk = (ms: number) => (ms - SIM_START) / (7 * DAY);

function run(kind: SimKind, cfg = GROWTH_CONFIG) {
  const u = simulateUser(kind, WEEKS, SIM_START);
  const g = growth(env, { history: u.history, profile: u.profile, now: SIM_START + WEEKS * 7 * DAY, deloads: u.deloads, cfg });
  const reach = Array<number | null>(15).fill(null); reach[0] = 0;
  for (const e of g.events) if ((e.kind === 'level' || e.kind === 'stage') && e.level != null && reach[e.level] == null) reach[e.level] = Math.round(wk(e.atMs) * 10) / 10;
  return { u, g, reach };
}

describe('牛龄曲线', () => {
  const runs = { novice: run('novice'), intermediate: run('intermediate'), advanced: run('advanced') };

  it('进阶用户：每一级都在目标周数 ±25%（前 3 级 ±2 周）以内', () => {
    const r = runs.intermediate.reach;
    TARGET_WEEKS.forEach((t, i) => {
      const got = r[i + 1];
      expect(got, `第 ${i + 2} 级`).not.toBeNull();
      const tol = i < 3 ? 2 : t * 0.25;
      expect(Math.abs(got! - t), `第 ${i + 2} 级：${got} 周 vs 目标 ${t} 周`).toBeLessThanOrEqual(tol);
    });
  });

  it('新手长得更快，但不会一个月冲到壮牛', () => {
    const n = runs.novice.reach, m = runs.intermediate.reach;
    for (const l of [3, 6, 9, 12]) expect(n[l]!).toBeLessThanOrEqual(m[l]!);
    expect(n[6]!).toBeGreaterThan(8);
  });

  it('老手（增幅很小）也能靠周期和 PR 稳步升级：一年内到壮牛，三年半内到 Milo', () => {
    const a = runs.advanced.reach;
    expect(a[3]!).toBeLessThanOrEqual(16);
    expect(a[6]!).toBeLessThanOrEqual(52);
    expect(a[12]).not.toBeNull();
  });

  it('稳定训练的人连胜不断：最长连胜覆盖大半时间（漏练周会断，减量周不断）', () => {
    for (const k of ['novice', 'intermediate', 'advanced'] as const) expect(runs[k].g.streak.best).toBeGreaterThan(15);
  });

  it('推导 / 导出（只在设了环境变量时有输出）', () => {
    if (process.env.GROWTH_DERIVE) {
      const flat = { ...GROWTH_CONFIG, levels: [0, ...Array(14).fill(1e9)] };
      const u = simulateUser('intermediate', WEEKS, SIM_START);
      const at = (w: number) => growth(env, { history: u.history, profile: u.profile, now: SIM_START + w * 7 * DAY, deloads: u.deloads, cfg: flat }).points;
      console.log('derived levels', JSON.stringify([0, ...TARGET_WEEKS.map((w) => Math.round(at(w) / 2) * 2)]));
      for (const k of ['novice', 'intermediate', 'advanced'] as const) console.log(k, runs[k].reach.map((w, i) => `${STAGE_LABEL[levelInfo(i).stage]}${levelInfo(i).sub}:${w}`).join(' '));
    }
    if (process.env.GROWTH_WRITE) {
      const out = Object.fromEntries((['novice', 'intermediate', 'advanced'] as const).map((k) => [k, { reach: runs[k].reach, bestStreak: runs[k].g.streak.best, niujin: runs[k].g.niujin.balance,
        prs: runs[k].g.events.filter((e) => e.kind === 'pr').length, cycles: runs[k].g.events.filter((e) => e.kind === 'cycle').length }]));
      writeFileSync('src/engine/growthCurve.json', JSON.stringify({ weeks: WEEKS, target: [0, ...TARGET_WEEKS], users: out }, null, 1) + '\n');
    }
  });
});
