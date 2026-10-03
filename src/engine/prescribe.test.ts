import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from './config';
import { REGION_ORDER, startOfDay } from './env';
import { demoEnv } from './demo';
import { budgetFor, prescribe, type Prescription } from './prescribe';
import { DAY, HOUR } from './sets';
import { DAYS, entry, NOW, session } from './testkit';
import type { Profile } from './types';

const env = demoEnv();
const flat = demoEnv({ ...DEFAULT_CONFIG, volumeBonus: { ...DEFAULT_CONFIG.volumeBonus, enabled: false } });
const ALL: Profile['equipment'] = ['barbell', 'dumbbell', 'machine', 'cable', 'smith', 'bodyweight'];
const profile: Profile = { experience: 'intermediate', equipment: ALL, minutes: 60, gender: 'male' };
const BENCH = 'barbell-bench-press-4', RAISE = 'dumbbell-lateral-raise-20';
type Plan = Extract<Prescription, { kind: 'plan' }>;
const plan = (r: Prescription): Plan => { expect(r.kind).toBe('plan'); return r as Plan; };
const ids = (r: Prescription) => r.items.map((i) => i.exerciseId);

describe('每日预算（ia §1.1）', () => {
  it('组数 = round(分钟 × 14 / 60)，动作数 = max(3, round(组数 / 2.3))', () => {
    expect(budgetFor(60)).toEqual({ setsPerDay: 14, exercisesPerDay: 6 });
    expect(budgetFor(90)).toEqual({ setsPerDay: 21, exercisesPerDay: 9 });
    expect(budgetFor(30)).toEqual({ setsPerDay: 7, exercisesPerDay: 3 });
    expect(budgetFor(15)).toEqual({ setsPerDay: 4, exercisesPerDay: 3 });
  });
  it('处方不超出预算；减量周预算减半', () => {
    const r = plan(prescribe(env, [], profile, { now: NOW }));
    expect(r.totals.sets).toBeLessThanOrEqual(14);
    expect(r.totals.exercises).toBeLessThanOrEqual(6);
    const d = plan(prescribe(env, [], profile, { now: NOW, deload: true }));
    expect(d.budget.setsPerDay).toBe(7);
    expect(d.totals.sets).toBeLessThanOrEqual(7);
  });
});

describe('今日处方的规则（ia §1.2）', () => {
  const cold = plan(prescribe(env, [], profile, { now: NOW }));
  it('纯函数：同样输入两次得到同样处方', () => {
    expect(ids(prescribe(env, [], profile, { now: NOW }))).toEqual(ids(cold));
  });
  it('冷启动：照常排动作，但一个建议重量都不给', () => {
    expect(cold.items.length).toBeGreaterThanOrEqual(3);
    expect(cold.items.every((i) => i.suggestion.weightKg == null && i.suggestion.reason.kind === 'first')).toBe(true);
  });
  it('同一天不重复动作；每个肌头先排 1 个', () => {
    expect(new Set(ids(cold)).size).toBe(cold.items.length);
    expect(new Set(cold.items.map((i) => i.why.head)).size).toBe(cold.items.length);
  });
  it('同一部位最多 2 个动作', () => {
    const per = new Map<string, number>();
    for (const i of cold.items) { const r = cold.stats.get(i.why.head)!.region; per.set(r, (per.get(r) ?? 0) + 1); }
    expect(Math.max(...per.values())).toBeLessThanOrEqual(2);
  });
  it('部位成块按固定顺序排，块内复合在前', () => {
    const order = cold.items.map((i) => REGION_ORDER.indexOf(i.region));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    for (let k = 1; k < cold.items.length; k++) {
      const [a, b] = [cold.items[k - 1], cold.items[k]];
      if (a.region === b.region) expect(!(a.mechanic === 'isolation' && b.mechanic === 'compound')).toBe(true);
    }
  });
  it('复合 3 组 6–8 次，孤立 2 组 10–12 次', () => {
    for (const i of cold.items) expect([i.sets, i.repRange]).toEqual(i.mechanic === 'compound' ? [3, [6, 8]] : [2, [10, 12]]);
  });
  it('只用档案里有的器械', () => {
    const r = plan(prescribe(env, [], { ...profile, equipment: ['dumbbell'] }, { now: NOW }));
    expect(r.items.every((i) => env.ex.get(i.exerciseId)!.equipmentType === 'dumbbell')).toBe(true);
  });
  it('恢复度 < 50% 的肌头不排，列进「还在恢复」', () => {
    const h = [session(2, [entry(BENCH, [[100, 8], [100, 8], [100, 8], [100, 8]])], { exertion: 10 })];
    const r = plan(prescribe(env, h, profile, { now: NOW }));
    expect(r.blocked.map((b) => b.id)).toContain('mid-lower-pectoralis');
    expect(r.items.some((i) => i.primaryHeads.includes('mid-lower-pectoralis'))).toBe(false);
  });
  it('近 7 天组数到上限（MRV）的肌头不排，即使已经恢复', () => {
    const six = Array.from({ length: 6 }, () => [10, 12] as [number, number]);
    const h = [6, 5, 4].map((d) => session(DAYS(d), [entry(RAISE, six)]));
    const r = plan(prescribe(flat, h, profile, { now: NOW }));
    const lat = r.stats.get('lateral-deltoid')!;
    expect(lat.sets7d).toBeGreaterThanOrEqual(lat.mrv);
    expect(lat.recovery).toBeGreaterThanOrEqual(0.5);
    expect(r.blocked.map((b) => b.id)).toContain('lateral-deltoid');
    expect(r.items.some((i) => i.primaryHeads.includes('lateral-deltoid'))).toBe(false);
  });
  it('同一动作 7 个日历日内不重复，与现在是几点无关', () => {
    for (const hh of [0.5, 7, 13, 23.5]) {
      const now = startOfDay(NOW) + hh * HOUR;
      const sixDays = session(0, [entry(BENCH, [[100, 8]])], { startMs: startOfDay(now) - 6 * DAY + 1 * HOUR, durationMin: 60 }, now);
      const sevenDays = session(0, [entry(BENCH, [[100, 8]])], { startMs: startOfDay(now) - 7 * DAY + 22 * HOUR, durationMin: 60 }, now);
      const bb: Profile = { ...profile, equipment: ['barbell'], minutes: 120 };
      expect(ids(prescribe(env, [sixDays], bb, { now }))).not.toContain(BENCH);
      const r = plan(prescribe(env, [sevenDays], bb, { now }));
      expect(r.cands.map((h) => h.id)).toContain('mid-lower-pectoralis');
      expect(ids(r)).toContain(BENCH);
    }
  });
  it('做过的动作优先（有历史才有建议重量）', () => {
    const head = cold.items[0].why.head;
    const alt = [...env.exList].filter((e) => e.primaryHeads.includes(head) && e.mechanic === cold.items[0].mechanic && e.id !== cold.items[0].exerciseId)[0];
    const h = [session(DAYS(8), [entry(alt.id, [[50, 8], [50, 8], [50, 8]])])];
    const r = plan(prescribe(env, h, profile, { now: NOW }));
    const it = r.items.find((i) => i.exerciseId === alt.id)!;
    expect(it).toBeDefined();
    expect(it.suggestion.weightKg).not.toBeNull();
  });
  it('减量周：组数减半、建议重量 ×0.9', () => {
    const h = [session(DAYS(8), [entry(BENCH, [[100, 8], [100, 8], [100, 8]])])];
    const bb: Profile = { ...profile, equipment: ['barbell'], minutes: 120 };
    const n = plan(prescribe(env, h, bb, { now: NOW })), d = plan(prescribe(env, h, bb, { now: NOW, deload: true }));
    expect(d.deload).toBe(true);
    for (const i of d.items) expect(i.sets).toBe(i.mechanic === 'compound' ? 2 : 1);
    expect(n.items.find((i) => i.exerciseId === BENCH)!.suggestion.weightKg).toBe(102.5);
    expect(d.items.find((i) => i.exerciseId === BENCH)!.suggestion.weightKg).toBe(92.5);
  });
  it('全部肌头都在恢复 → 恢复日', () => {
    const h = [session(1, env.exList.map((e) => entry(e.id, [[50, 8], [50, 8], [50, 8]])), { exertion: 10 })];
    const r = prescribe(env, h, profile, { now: NOW });
    expect(r.kind).toBe('rest');
    expect(r.items).toEqual([]);
    expect(r.blocked.length).toBeGreaterThan(0);
    expect(r.blocked[0].hoursLeft).toBeGreaterThanOrEqual(r.blocked.at(-1)!.hoursLeft);
  });
  it('有候选肌头但器械里没有可排的动作 → 动作池不足，不是恢复日', () => {
    const smith = env.exList.filter((e) => e.equipmentType === 'smith');
    const h = [session(DAYS(2), smith.map((e) => entry(e.id, [[40, 8]])))];
    const r = prescribe(env, h, { ...profile, equipment: ['smith'] }, { now: NOW });
    expect(r.kind).toBe('pool-empty');
    if (r.kind === 'pool-empty') expect(r.cands.length).toBeGreaterThan(0);
  });
});
