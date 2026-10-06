import { beforeEach, describe, expect, it } from 'vitest';
import { prescribe } from '../engine';
import { env } from './demo';
import { addSet, completeSet, finishSession, setError, setField, startSession, toggleSkip } from './session';
import { DEFAULT_PROFILE, demoState, store, STORE_KEY } from './store';

const NOW = new Date(2026, 9, 6, 18, 0).getTime();
const plan = () => {
  const s = store.get();
  const rx = prescribe(env, s.history, s.profile!, { now: NOW });
  if (rx.kind !== 'plan') throw new Error('演示用户今天应当有处方');
  return rx;
};

describe('进行中的训练（ia §1.5–§1.7）', () => {
  beforeEach(() => { store.clear(); store.update((s) => ({ ...s, ...demoState(NOW) })); });

  it('演示数据：30 周、只到昨天为止，档案是进阶', () => {
    const s = store.get();
    expect(s.demo).toBe(true);
    expect(s.profile?.experience).toBe('intermediate');
    expect(s.history.length).toBeGreaterThan(80);
    expect(Math.max(...s.history.map((x) => x.startMs))).toBeLessThan(new Date(2026, 9, 6).getTime());
  });

  it('开始：照抄处方，重量预填建议、次数预填每组目标', () => {
    const rx = plan();
    startSession(rx, NOW);
    const a = store.get().active!;
    expect(a.entries.map((e) => e.exerciseId)).toEqual(rx.items.map((i) => i.exerciseId));
    const e0 = a.entries[0], it0 = rx.items[0];
    expect(e0.rows).toHaveLength(it0.sets);
    expect(e0.rows[0].weight).toBe(it0.suggestion.weightKg != null ? String(it0.suggestion.weightKg) : '');
    expect(e0.rows[0].reps).toBe(String(it0.suggestion.repsPerSet[0] ?? it0.repRange[0]));
  });

  it('完成一组：立即写入本地存储，并按结束时间戳开始休息；超范围不能完成', () => {
    startSession(plan(), NOW);
    setField(0, 0, 'weight', '620');
    expect(setError(store.get().active!.entries[0].rows[0])).toEqual({ field: 'weight', msg: '最多 500 kg' });
    completeSet(0, 0, NOW + 60e3);
    expect(store.get().active!.entries[0].rows[0].done).toBe(false);
    setField(0, 0, 'weight', '80');
    completeSet(0, 0, NOW + 60e3);
    const s = store.get();
    expect(s.active!.entries[0].rows[0].done).toBe(true);
    expect(s.rest!.endAt).toBe(NOW + 60e3 + s.active!.entries[0].restSec * 1000);
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).active.entries[0].rows[0].done).toBe(true);
  });

  it('加组上限 10；跳过的动作和没做的组不计入；没有已完成的工作组不保存', () => {
    startSession(plan(), NOW);
    for (let i = 0; i < 12; i++) addSet(0);
    expect(store.get().active!.entries[0].rows).toHaveLength(10);
    expect(finishSession(NOW + 3600e3)).toBeNull();
    expect(store.get().active).not.toBeNull();
    setField(0, 0, 'weight', '60');  // 首次做的动作没有建议重量：自己填
    completeSet(0, 0, NOW + 60e3);
    toggleSkip(1);
    const before = store.get().history.length;
    const saved = finishSession(NOW + 3600e3, 8)!;
    expect(saved.exercises[0].sets).toHaveLength(1);
    expect(saved.exercises[1].skipped).toBe(true);
    expect(saved.durationMin).toBe(60);
    const s = store.get();
    expect(s.history).toHaveLength(before + 1);
    expect(s.active).toBeNull();
    expect(s.rest).toBeNull();
  });

  it('清除全部数据：回到没建档（故事引导再出现一次）', () => {
    store.clear();
    expect(store.get().profile).toBeNull();
    expect(store.get().draft).toBeNull();
    expect(DEFAULT_PROFILE.minutes).toBe(60);
  });
});
