import { beforeEach, describe, expect, it } from 'vitest';
import { headStats, prescribe } from '../engine';
import { env } from './demo';
import { addToToday, FAMILIES, FAMILY_OF, finderRows, itemFor, resetScenarioExtras, suggestFamily, swapCandidates, withExtras } from './finder';
import muscles from '../../mock/muscles.json';
import { completeSet, hasWork, pauseSession, resumeSession, startSession, swapExercise, toggleWarmup, warmFlags, warmupRows, workDone } from './session';
import { demoState, store } from './store';

const NOW = new Date(2026, 9, 6, 18, 0).getTime();
const src = () => { const s = store.get(); return { history: s.history, profile: s.profile, deload: s.deload }; };

describe('找动作（6e，ia T19）', () => {
  beforeEach(() => { store.clear(); store.update((s) => ({ ...s, ...demoState(NOW) })); resetScenarioExtras(); });

  it('整块肌肉覆盖全部有动作的肌头，一个肌头只属于一块', () => {
    const withEx = muscles.heads.filter((h) => h.exerciseCount > 0).map((h) => h.id);
    expect(Object.keys(FAMILY_OF).sort()).toEqual([...withEx].sort());
    expect(FAMILIES.flatMap((f) => f.heads)).toHaveLength(withEx.length);
  });

  it('列表：每个动作都练到选中的肌头；我有的器械在前，主练在前', () => {
    const s = { ...src(), profile: { ...src().profile!, equipment: ['barbell', 'dumbbell'] as const } };
    const rows = finderRows(['mid-lower-pectoralis'], { history: s.history, profile: { ...s.profile, equipment: [...s.profile.equipment] } });
    expect(rows.length).toBeGreaterThan(5);
    for (const r of rows) expect([...r.ex.primaryHeads, ...r.ex.secondaryHeads]).toContain('mid-lower-pectoralis');
    const firstNotOwned = rows.findIndex((r) => !r.owned);
    expect(rows.slice(firstNotOwned).every((r) => !r.owned)).toBe(true);
    const owned = rows.filter((r) => r.owned);
    expect(owned.findIndex((r) => !r.primary) === -1 || owned.slice(owned.findIndex((r) => !r.primary)).every((r) => !r.primary)).toBe(true);
  });

  it('首页进来先选本周还差最多的那块肌肉', () => {
    const f = suggestFamily(headStats(env, src().history, src().profile!, NOW));
    expect(FAMILIES.map((x) => x.id)).toContain(f);
  });

  it('换一个：候选都练同一块主练肌头、器械我有、不含自己', () => {
    const squat = env.exList.find((e) => e.name === '杠铃深蹲')!;
    const c = swapCandidates(squat.id, src());
    expect(c.length).toBeGreaterThan(0);
    for (const r of c) {
      expect(r.ex.id).not.toBe(squat.id);
      expect(r.ex.primaryHeads.some((h) => squat.primaryHeads.includes(h))).toBe(true);
      expect(src().profile!.equipment).toContain(r.ex.equipmentType);
    }
  });

  it('加到今天：没开始 → 排在处方后面；重复不加；恢复日加了也变成一份处方', () => {
    const rx = prescribe(env, src().history, src().profile!, { now: NOW });
    const extra = env.exList.find((e) => !rx.items.some((i) => i.exerciseId === e.id) && src().profile!.equipment.includes(e.equipmentType))!;
    expect(addToToday(extra.id, 'plain-prescription', src(), NOW)).toBe('plan');
    expect(addToToday(extra.id, 'plain-prescription', src(), NOW)).toBe('dup');
    const merged = withExtras(rx, [extra.id], src().history);
    expect(merged.items.at(-1)!.exerciseId).toBe(extra.id);
    expect(merged.kind === 'plan' && merged.totals.exercises).toBe(rx.items.length + 1);
    const rest = { ...rx, kind: 'rest' as const, items: [] as [] };
    expect(withExtras(rest, [extra.id], src().history).kind).toBe('plan');
  });

  it('加到今天：训练中 → 加在最后', () => {
    const rx = prescribe(env, src().history, src().profile!, { now: NOW });
    if (rx.kind !== 'plan') throw new Error('应当有处方');
    startSession(rx, NOW);
    const extra = env.exList.find((e) => !rx.items.some((i) => i.exerciseId === e.id))!;
    expect(addToToday(extra.id, undefined, src(), NOW)).toBe('session');
    expect(store.get().active!.entries.at(-1)!.exerciseId).toBe(extra.id);
  });
});

describe('热身组 / 换一个 / 暂停（6e）', () => {
  beforeEach(() => { store.clear(); store.update((s) => ({ ...s, ...demoState(NOW) })); });

  it('热身：40% × 8 → 60% × 5 → 80% × 3，按 2.5 取整；不到 40 kg 不排', () => {
    expect(warmupRows(85).map((r) => `${r.weight}×${r.reps}`)).toEqual(['35×8', '50×5', '67.5×3']);
    expect(warmupRows(37.5)).toEqual([]);
    expect(warmupRows(null)).toEqual([]);
  });

  it('只给第一个练到这些主练肌头的复合动作排热身', () => {
    expect(warmFlags([
      { mechanic: 'compound', primaryHeads: ['a', 'b'] }, { mechanic: 'compound', primaryHeads: ['a'] },
      { mechanic: 'isolation', primaryHeads: ['c'] }, { mechanic: 'compound', primaryHeads: ['b', 'c'] },
    ])).toEqual([true, false, false, true]);
  });

  it('热身不计入：只打热身不算有记录；打完热身不触发休息；正式组打完才算这个动作做完', () => {
    const it = itemFor(env.exList.find((e) => e.name === '杠铃深蹲')!.id, src().history)!;
    const rx = prescribe(env, src().history, src().profile!, { now: NOW });
    if (rx.kind !== 'plan') throw new Error('应当有处方');
    startSession({ ...rx, items: [{ ...it, suggestion: { ...it.suggestion, weightKg: 85 } }] }, NOW);
    const rows = store.get().active!.entries[0].rows;
    expect(rows.filter((r) => r.type === 'warmup')).toHaveLength(3);
    toggleWarmup(0, 0);
    expect(store.get().active!.entries[0].rows[0].done).toBe(true);
    expect(store.get().rest).toBeNull();
    expect(hasWork(store.get().active)).toBe(false);
    const w0 = rows.findIndex((r) => r.type === 'work');
    for (let j = w0; j < rows.length; j++) completeSet(0, j, NOW + j * 60e3);
    expect(workDone(store.get().active!.entries[0])).toBe(true);   // 热身 2、3 没打也算做完
    expect(hasWork(store.get().active)).toBe(true);
  });

  it('换一个：没打过正式组 → 原地换；打过 → 已打的留下，新动作插在后面并切过去', () => {
    const rx = prescribe(env, src().history, src().profile!, { now: NOW });
    if (rx.kind !== 'plan') throw new Error('应当有处方');
    startSession(rx, NOW);
    const [a0] = store.get().active!.entries;
    const other = itemFor(swapCandidates(a0.exerciseId, src())[0].ex.id, src().history)!;
    swapExercise(0, other);
    expect(store.get().active!.entries[0].exerciseId).toBe(other.exerciseId);
    expect(store.get().active!.entries).toHaveLength(rx.items.length);
    const w = store.get().active!.entries[0].rows.findIndex((r) => r.type === 'work');
    store.update((s) => ({ ...s, active: { ...s.active!, entries: s.active!.entries.map((e, i) => (i ? e : { ...e, rows: e.rows.map((r) => ({ ...r, weight: r.weight || '20' })) })) } }));
    completeSet(0, w, NOW + 60e3);
    swapExercise(0, itemFor(a0.exerciseId, src().history)!);
    const en = store.get().active!.entries;
    expect(en).toHaveLength(rx.items.length + 1);
    expect(en[0].rows.every((r) => r.done)).toBe(true);
    expect(en[0].sets).toBe(1);
    expect(en[1].exerciseId).toBe(a0.exerciseId);
    expect(store.get().active!.cur).toBe(1);
  });

  it('暂停：休息停掉、已记的组都在；继续后暂停的时长不算进训练时长', () => {
    const rx = prescribe(env, src().history, src().profile!, { now: NOW });
    if (rx.kind !== 'plan') throw new Error('应当有处方');
    startSession(rx, NOW);
    store.update((s) => ({ ...s, rest: { endAt: NOW + 90e3, totalMs: 90e3 } }));
    pauseSession(NOW + 10 * 60e3);
    expect(store.get().active!.pausedAt).toBe(NOW + 10 * 60e3);
    expect(store.get().rest).toBeNull();
    resumeSession(NOW + 40 * 60e3);
    expect(store.get().active!.pausedAt).toBeUndefined();
    expect(store.get().active!.startMs).toBe(NOW + 30 * 60e3);
  });
});
