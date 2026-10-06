/** 本地存储（阶段 6a，ia §1.1 / §1.5 / §1.6 / §1.7）：档案、历史、进行中的训练、组间休息、建档草稿，全部只存在本机（brief：无账号、无后端）。
 *  - 一个键 milo:v1，整份 JSON；每次改动立即写入（每完成一组也是），杀进程后能恢复。
 *  - 写入失败（隐私模式、配额满）不静默：state.saveError 有值，外壳显示可见提示和「重试」；内存里的数据不丢。
 *  - 演示数据：建档最后一步可选「载入演示数据」——成长引擎的进阶用户练了 30 周（与奖励、牛龄同一套模拟），「我的」里可清除或重新载入。
 *    加的辅助动作过一遍守约检查（keepCompliant），不让演示用户的连胜被「练了没恢复的肌头」冲成 0；模拟里的减量周同时存进 deloads。
 *  - deloads：采纳过的每一次减量（时间戳）。守约周按计划减量也算守约，成长引擎要知道是哪几周；deload 只记最近一次，不够用。
 *  - 页面带 ?scenario=… 时不读这里，走 mock 场景（截图、回归测试、Playground 用）。 */
import { useSyncExternalStore } from 'react';
import { DAY, blockedHeads, planFor, prescribe, simulateUser, startOfDay } from '../engine';
import { demoEnv } from '../engine/demo';
import type { DeloadState, Profile, Session } from '../engine/types';

export const STORE_KEY = 'milo:v1';
export const DEMO_WEEKS = 30;
/** 演示数据多模拟的周数（相位）：0 = 最后一周正好是减量周；3 = 最后一周是减量后第 3 周，有升有平有降；见 demoState */
export const DEMO_PHASE = 3;

/** 进行中训练的一组：输入框里的原始文字（保留用户正在输入的状态），完成后才计入 */
export interface DraftSet { type: 'work' | 'warmup' | 'drop'; weight: string; reps: string; done: boolean }
export interface DraftEntry { exerciseId: string; name: string; sets: number; repRange: [number, number]; restSec: number; unilateral: boolean; suggestKg: number | null; skipped: boolean; rows: DraftSet[] }
export interface ActiveSession { id: string; startMs: number; entries: DraftEntry[]; cur: number }

/** 「我的」里的导航设置（ia §1.11）：改动立即生效，不需要重启 */
export interface Settings {
  /** 导航外圈的今日进度环 */
  ring: boolean;
  /** 选中项小胶囊里的休息倒计时描边 */
  restOutline: boolean;
  /** 休息结束提示：vibrate = 结束态 + 振动；outline = 只有结束态（描边 / 对勾） */
  restEnd: 'vibrate' | 'outline';
}
export const DEFAULT_SETTINGS: Settings = { ring: true, restOutline: true, restEnd: 'vibrate' };

export interface AppState {
  v: 1;
  profile: Profile | null;
  /** 建档草稿：每一步的选择实时保存，杀进程回到上次那一步（ia §1.1）；故事不记步骤 */
  draft: { step: 1 | 2 | 3; profile: Profile } | null;
  history: Session[];
  deload: DeloadState;
  /** 采纳过的减量周（每次采纳的时间，毫秒）：守约周的判定要知道哪几周是按计划减量的，`deload` 只记最近一次 */
  deloads: number[];
  active: ActiveSession | null;
  /** 组间休息：按结束时间戳算（ia §1.6），App 切后台回来剩余时间仍然对 */
  rest: { endAt: number; totalMs: number } | null;
  demo: boolean;
  settings: Settings;
  /** 最后一次写入失败的原因（只在内存里） */
  saveError?: string;
}

export const DEFAULT_PROFILE: Profile = { experience: 'intermediate', equipment: ['barbell', 'dumbbell', 'machine', 'cable', 'smith', 'bodyweight'], minutes: 60, gender: 'male' };
const EMPTY: AppState = { v: 1, profile: null, draft: null, history: [], deload: { status: 'none', atMs: 0 }, deloads: [], active: null, rest: null, demo: false, settings: DEFAULT_SETTINGS };

function read(): AppState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...EMPTY };
    const s = JSON.parse(raw) as AppState;
    // settings 逐项补默认：旧存档没有这个字段，以后新加的设置项也不用迁移
    return s && s.v === 1 ? { ...EMPTY, ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings }, saveError: undefined } : { ...EMPTY };
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

/** 演示数据的辅助动作：成长模拟只排了主项，处方引擎会优先补没练过的肌头（小腿、斜方、后束……），
 *  演示时就会一排「首次」。这里按训练日给每次训练加 3–4 个辅助动作，重量随周数线性涨约 20%。
 *  [动作, 起始重量 kg, 次数, 组数]，下标 = 一周里的第几练 */
const ACCESSORY: [string, number, number, number][][] = [
  [['barbell-calf-raises-210', 90, 12, 3], ['barbell-seated-calf-raise-350', 50, 15, 2], ['cable-seated-leg-extension-999', 40, 12, 3]],
  [['barbell-close-grip-bench-press-211', 60, 8, 3], ['dumbbell-rear-delt-row-319', 17.5, 12, 3], ['cable-rope-pushdown-241', 27.5, 12, 2], ['dumbbell-bench-press-377', 30, 10, 2]],
  [['barbell-shrug-351', 100, 10, 3], ['dumbbell-hammer-curl-3', 15, 10, 2], ['cable-rope-kneeling-face-pull-1001', 22.5, 15, 2], ['barbell-rack-pull-1818', 140, 5, 2], ['barbell-wrist-curl-52', 30, 15, 2]],
  [['dumbbell-chest-fly-379', 15, 12, 3], ['cable-rope-skullcrusher-243', 22.5, 12, 2], ['cable-rope-kneeling-crunch-1004', 40, 15, 3], ['smith-machine-hanging-knee-tuck-936', 10, 12, 3], ['dumbbell-bench-wrist-extension-1061', 7.5, 15, 2]],
];

/** 演示数据：进阶用户、每周 4 练，练到昨天为止的 30 周（成长引擎同一套模拟，数字全部实算），每次训练再加辅助动作 */
export function demoState(now: number, profile?: Profile, phase = DEMO_PHASE): Pick<AppState, 'profile' | 'history' | 'deload' | 'deloads' | 'demo'> {
  // 模拟里每 5 周一个减量周（w % 5 === 4）。多模拟 phase 周、再截掉开头，让展示的最后一周落在减量之后的正常周：
  // 否则演示用户正好停在减量周，增量页「与上一次比」几乎全是 ▼，像是全面退步（2026-10-06）
  const total = DEMO_WEEKS + phase;
  const u = simulateUser('intermediate', total, startOfDay(now) - total * 7 * DAY);
  const from = startOfDay(now) - DEMO_WEEKS * 7 * DAY;
  const history = u.history.filter((s) => s.startMs >= from && s.startMs < startOfDay(now)).map((s) => {
    const [, , w, i] = s.id.split('-').map(Number);
    const deload = (s.exertion ?? 8) < 8, grow = 1 + 0.2 * (w / DEMO_WEEKS);
    const extra = ACCESSORY[i % ACCESSORY.length].map(([exerciseId, kg, reps, sets]) => ({
      exerciseId, skipped: false,
      sets: Array.from({ length: deload ? Math.max(1, Math.round(sets / 2)) : sets }, () => ({ type: 'work' as const, weightKg: Math.round((deload ? 0.9 : 1) * kg * grow / 2.5) * 2.5, reps, rpe: deload ? 6 : 8 })),
    }));
    extra.forEach((e) => ADDED.add(e));
    return { ...s, exercises: [...s.exercises, ...extra] };
  });
  shapeNextSteps(history);
  backfill(history, profile ?? u.profile, now);
  return { profile: profile ?? u.profile, history, deload: { status: 'none', atMs: 0 }, deloads: u.deloads.filter((ms) => ms >= from && ms < startOfDay(now)), demo: true };
}

/** 让演示用户的「下一步」有升有保有降（增量页分三组、首页处方都靠它），不动预估 1RM 的走向：
 *  - 主项（深蹲、卧推、硬拉）模拟里按 5 次编，而引擎对复合动作的次数区间是 6–8，「掉到下限以下」会让它们永远被判「该减重」→ 全部抬到 6 次；
 *  - 其余动作按名字散列分三种：多数维持原样（做到次数上限 → 该加重）、约 1/5 最近一次少做一次（保持，次数 +1）、
 *    约 1/9 最近一次状态差（重量降一档、最后一组掉到下限以下 → 该减重，预估 1RM 也跟着低一点），都只改每个动作的最近一次。 */
function shapeNextSteps(history: Session[]) {
  const env = (ENV ??= demoEnv());
  for (const s of history) for (const e of s.exercises) {
    const ex = env.ex.get(e.exerciseId);
    if (!ex) continue;
    const lower = planFor(env, ex, false).repRange[0];
    for (const r of e.sets) if (r.reps != null && r.reps < lower) r.reps = lower;
  }
  const last = new Map<string, Session['exercises'][number]>();
  for (const s of history) for (const e of s.exercises) last.set(e.exerciseId, e);
  const main = new Set(['barbell-squat-8', 'barbell-bench-press-4', 'barbell-deadlift-39']);
  for (const [id, e] of last) {
    const ex = env.ex.get(id);
    if (!ex || main.has(id) || e.sets.length < 2) continue;
    const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 9, lower = planFor(env, ex, false).repRange[0];
    if (h < 2) { const r = e.sets[0]; if (r.reps != null) r.reps = Math.max(lower, r.reps - 1); }
    else if (h === 2) {
      for (const r of e.sets) if (r.weightKg) r.weightKg = Math.max(2.5, Math.round((r.weightKg * 0.95) / 2.5) * 2.5);
      const r = e.sets[e.sets.length - 1]; r.reps = lower - 1;
    }
  }
}

/** 演示的第一眼：今天的处方里不要出现「首次」（处方会轮换动作，演示数据没练过的就成了首次）。
 *  把今天处方里没有记录的动作补进 2–4 周前的几次训练（不影响近 7 天的容量与恢复），起始重量按器械给一个保守值；
 *  补完会改变处方，最多补 4 轮。真实用户的数据不走这里。 */
const START_KG: Record<string, number> = { barbell: 40, dumbbell: 12.5, machine: 35, cable: 25, smith: 40, bodyweight: 10 };
let ENV: ReturnType<typeof demoEnv> | null = null;
function backfill(history: Session[], profile: Profile, now: number) {
  const env = (ENV ??= demoEnv());
  const old = history.filter((s) => s.startMs < now - 14 * DAY && s.startMs >= now - 28 * DAY).slice(-6);
  keepCompliant(history, profile);
  for (let round = 0; round < 4 && old.length; round++) {
    const rx = prescribe(env, history, profile, { now });
    const missing = rx.kind === 'plan' ? rx.items.filter((it) => it.suggestion.weightKg == null) : [];
    if (!missing.length) return;
    for (const it of missing) {
      const kg = START_KG[env.ex.get(it.exerciseId)?.equipmentType ?? 'machine'] ?? 30;
      old.forEach((s, k) => {
        const e = { exerciseId: it.exerciseId, skipped: false,
          sets: Array.from({ length: it.sets }, () => ({ type: 'work' as const, weightKg: kg + Math.floor(k / 2) * 2.5, reps: it.repRange[1], rpe: 8 })) };
        ADDED.add(e); s.exercises.push(e);
      });
    }
    keepCompliant(history, profile);
  }
}

/** 我们给演示数据加的动作（每次训练的辅助动作、补进旧训练的动作）；守约检查只动它们，不动模拟本身的训练 */
const ADDED = new WeakSet<object>();

/** 守约检查：模拟本身按处方练、不会练到没恢复的肌头，而我们加的辅助动作不管恢复度——比如周六的飞鸟练到了周四刚练过上斜卧推的上胸（恢复度 40%），
 *  成长引擎就判这一周违规，演示用户的连胜永远是 0（2026-10-06 探针）。
 *  按时间顺序逐次训练找出练到恢复度 < 50% 的肌头：先拿掉这次训练里我们加的、主要练这些肌头的动作；还不行，再从前 21 天的训练里（最近的优先）
 *  拿掉我们加的、练这些肌头的动作（前几次加的动作把肌头练累了，这次的模拟训练才会撞上）。拿掉只会让后面的训练恢复得更好，所以按顺序一遍就够。 */
function keepCompliant(history: Session[], profile: Profile) {
  const env = (ENV ??= demoEnv());
  const trains = (e: Session['exercises'][number], heads: string[], primaryOnly: boolean) => {
    const ex = env.ex.get(e.exerciseId);
    return !!ex && (ex.primaryHeads.some((h) => heads.includes(h)) || (!primaryOnly && ex.secondaryHeads.some((h) => heads.includes(h))));
  };
  for (let i = 0; i < history.length; i++) {
    let bad = blockedHeads(env, history, i, profile);
    for (let j = i; bad.length && j >= 0 && history[j].startMs > history[i].startMs - 21 * DAY; j--) {
      const keep = history[j].exercises.filter((e) => !(ADDED.has(e) && trains(e, bad, j === i)));
      if (keep.length === history[j].exercises.length) continue;
      history[j].exercises = keep;
      bad = blockedHeads(env, history, i, profile);
    }
  }
}
