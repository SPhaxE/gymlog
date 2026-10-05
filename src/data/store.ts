/** 本地存储（阶段 6a，ia §1.1 / §1.5 / §1.6 / §1.7）：档案、历史、进行中的训练、组间休息、建档草稿，全部只存在本机（brief：无账号、无后端）。
 *  - 一个键 milo:v1，整份 JSON；每次改动立即写入（每完成一组也是），杀进程后能恢复。
 *  - 写入失败（隐私模式、配额满）不静默：state.saveError 有值，外壳显示可见提示和「重试」；内存里的数据不丢。
 *  - 演示数据：建档最后一步可选「载入演示数据」——成长引擎的进阶用户练了 30 周（与奖励、牛龄同一套模拟），「我的」里可清除或重新载入。
 *  - 页面带 ?scenario=… 时不读这里，走 mock 场景（截图、回归测试、Playground 用）。 */
import { useSyncExternalStore } from 'react';
import { DAY, simulateUser, startOfDay } from '../engine';
import type { DeloadState, Profile, Session } from '../engine/types';

export const STORE_KEY = 'milo:v1';
export const DEMO_WEEKS = 30;

/** 进行中训练的一组：输入框里的原始文字（保留用户正在输入的状态），完成后才计入 */
export interface DraftSet { type: 'work' | 'warmup' | 'drop'; weight: string; reps: string; done: boolean }
export interface DraftEntry { exerciseId: string; name: string; sets: number; repRange: [number, number]; restSec: number; unilateral: boolean; suggestKg: number | null; skipped: boolean; rows: DraftSet[] }
export interface ActiveSession { id: string; startMs: number; entries: DraftEntry[]; cur: number }

export interface AppState {
  v: 1;
  profile: Profile | null;
  /** 建档草稿：每一步的选择实时保存，杀进程回到上次那一步（ia §1.1）；故事不记步骤 */
  draft: { step: 1 | 2 | 3; profile: Profile } | null;
  history: Session[];
  deload: DeloadState;
  active: ActiveSession | null;
  /** 组间休息：按结束时间戳算（ia §1.6），App 切后台回来剩余时间仍然对 */
  rest: { endAt: number; totalMs: number } | null;
  demo: boolean;
  /** 最后一次写入失败的原因（只在内存里） */
  saveError?: string;
}

export const DEFAULT_PROFILE: Profile = { experience: 'intermediate', equipment: ['barbell', 'dumbbell', 'machine', 'cable', 'smith', 'bodyweight'], minutes: 60, gender: 'male' };
const EMPTY: AppState = { v: 1, profile: null, draft: null, history: [], deload: { status: 'none', atMs: 0 }, active: null, rest: null, demo: false };

function read(): AppState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY };
    const s = JSON.parse(raw) as AppState;
    return s && s.v === 1 ? { ...EMPTY, ...s, saveError: undefined } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

let state: AppState = typeof localStorage === 'undefined' ? { ...EMPTY } : read();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function write(next: AppState) {
  const { saveError: _e, ...persist } = next;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(persist));
    state = { ...next, saveError: undefined };
  } catch (e) {
    state = { ...next, saveError: e instanceof Error ? e.message : String(e) };
  }
  emit();
}

export const store = {
  get: () => state,
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
  /** 改一处，立即写入 */
  update(fn: (s: AppState) => AppState) { write(fn(state)); },
  /** 写入失败后重试（外壳里的「重试」按钮） */
  retry() { write(state); },
  /** 清除全部数据：回到故事引导（ia §1.13：清除后故事再出现一次） */
  clear() { write({ ...EMPTY }); },
  /** 测试用：从存储重新读 */
  reload() { state = read(); emit(); },
};

export function useStore(): AppState {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** 演示数据：进阶用户、每周 4 练，练到昨天为止的 30 周（成长引擎同一套模拟，数字全部实算） */
export function demoState(now: number, profile?: Profile): Pick<AppState, 'profile' | 'history' | 'deload' | 'demo'> {
  const start = startOfDay(now) - DEMO_WEEKS * 7 * DAY;
  const u = simulateUser('intermediate', DEMO_WEEKS, start);
  const history = u.history.filter((s) => s.startMs < startOfDay(now));
  return { profile: profile ?? u.profile, history, deload: { status: 'none', atMs: 0 }, demo: true };
}
