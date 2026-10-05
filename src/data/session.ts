/** 进行中的训练（P03，ia §1.5 记组 / §1.6 组间休息 / §1.7 结算）：所有改动立即写进本地存储（store）。
 *  - 开始：把今日处方抄成草稿；重量预填建议重量，次数预填处方的每组目标（引擎已按「上次 + 1、加重后回到下限」算好）。
 *  - 完成一组只有一个入口 completeSet；完成后自动开始组间休息（结束时间戳），最后一个动作的最后一组不触发。
 *  - 结束：只有存在已完成的工作组才保存；没做的动作标「未做」；写进历史后清掉进行中的训练和休息。 */
import type { Prescription } from '../engine';
import type { Session, SetRecord } from '../engine/types';
import { store, type ActiveSession, type DraftEntry, type DraftSet } from './store';

export const MAX_SETS = 10;

/** 行内校验（ia §1.5 输入范围）：返回出错的格和文案；空值不算错（缺值另有提示） */
export function setError(row: Pick<DraftSet, 'weight' | 'reps'>): { field: 'weight' | 'reps'; msg: string } | undefined {
  const w = row.weight.trim(), r = row.reps.trim();
  if (w && (!/^\d+(\.\d+)?$/.test(w) || Number(w) > 500)) return { field: 'weight', msg: '最多 500 kg' };
  if (r && (!/^\d+$/.test(r) || Number(r) < 1 || Number(r) > 100)) return { field: 'reps', msg: '1–100 次' };
}

export function startSession(rx: Extract<Prescription, { kind: 'plan' }>, now: number) {
  const entries: DraftEntry[] = rx.items.map((it) => ({
    exerciseId: it.exerciseId, name: it.name, sets: it.sets, repRange: it.repRange, restSec: it.restSec, unilateral: it.unilateral,
    suggestKg: it.suggestion.weightKg, skipped: false,
    rows: Array.from({ length: it.sets }, (_, i) => ({ type: 'work' as const, weight: it.suggestion.weightKg != null ? String(it.suggestion.weightKg) : '', reps: String(it.suggestion.repsPerSet[i] ?? it.repRange[0]), done: false })),
  }));
  const active: ActiveSession = { id: `s-${now}`, startMs: now, entries, cur: 0 };
  store.update((s) => ({ ...s, active, rest: null }));
}

const patchActive = (fn: (a: ActiveSession) => ActiveSession) => store.update((s) => (s.active ? { ...s, active: fn(s.active) } : s));
const patchRow = (e: number, r: number, fn: (x: DraftSet) => DraftSet) =>
  patchActive((a) => ({ ...a, entries: a.entries.map((en, i) => (i !== e ? en : { ...en, rows: en.rows.map((x, j) => (j === r ? fn(x) : x)) })) }));

export const setField = (e: number, r: number, f: 'weight' | 'reps', v: string) => patchRow(e, r, (x) => ({ ...x, [f]: v }));
export const editSet = (e: number, r: number) => patchRow(e, r, (x) => ({ ...x, done: false }));
export const focusExercise = (e: number) => patchActive((a) => ({ ...a, cur: e }));

/** 完成一组：有缺值或超范围时不做任何事（按钮本来就不可用）；完成后开始休息 */
export function completeSet(e: number, r: number, now = Date.now()) {
  const a = store.get().active;
  if (!a) return;
  const row = a.entries[e]?.rows[r];
  if (!row || !row.weight.trim() || !row.reps.trim() || setError(row)) return;
  patchRow(e, r, (x) => ({ ...x, done: true }));
  const en = store.get().active!.entries;
  const lastOfAll = e === en.length - 1 && en[e].rows.every((x) => x.done);
  // 这个动作做完了就自动跳到下一个没做完的动作
  const next = en[e].rows.every((x) => x.done) ? en.findIndex((x, i) => i > e && !x.skipped && x.rows.some((y) => !y.done)) : e;
  store.update((s) => ({ ...s, active: s.active && { ...s.active, cur: next >= 0 ? next : e }, rest: lastOfAll ? null : { endAt: now + en[e].restSec * 1000, totalMs: en[e].restSec * 1000 } }));
}

export function addSet(e: number) {
  patchActive((a) => ({ ...a, entries: a.entries.map((en, i) => {
    if (i !== e || en.rows.length >= MAX_SETS) return en;
    const last = en.rows[en.rows.length - 1];
    return { ...en, rows: [...en.rows, { type: 'work', weight: last?.weight ?? '', reps: last?.reps ?? String(en.repRange[0]), done: false }] };
  }) }));
}
export const toggleSkip = (e: number) => patchActive((a) => ({ ...a, entries: a.entries.map((en, i) => (i === e ? { ...en, skipped: !en.skipped } : en)) }));
export const adjustRest = (d: number) => store.update((s) => (s.rest ? { ...s, rest: { endAt: Math.max(Date.now(), s.rest.endAt + d * 1000), totalMs: s.rest.totalMs } } : s));
export const skipRest = () => store.update((s) => ({ ...s, rest: null }));

/** 草稿 → 引擎的 Session（只收已完成的组；没做的动作 skipped） */
export function toSession(a: ActiveSession, now: number, exertion: number | null): Session {
  return {
    id: a.id, startMs: a.startMs, durationMin: Math.max(1, Math.round((now - a.startMs) / 60e3)), exertion,
    exercises: a.entries.map((en) => {
      const sets: SetRecord[] = en.rows.filter((x) => x.done).map((x) => ({ type: x.type, weightKg: Number(x.weight), reps: Number(x.reps) }));
      return { exerciseId: en.exerciseId, skipped: en.skipped || sets.length === 0, sets };
    }),
  };
}

export const hasWork = (a: ActiveSession | null) => !!a?.entries.some((en) => en.rows.some((x) => x.done && x.type !== 'warmup'));

/** 结束训练：没有已完成的工作组 → 不保存（返回 null）；否则写进历史、清掉进行中的训练 */
export function finishSession(now = Date.now(), exertion: number | null = 8): Session | null {
  const a = store.get().active;
  if (!a || !hasWork(a)) return null;
  const s = toSession(a, now, exertion);
  store.update((x) => ({ ...x, history: [...x.history, s], active: null, rest: null }));
  return s;
}
export const discardSession = () => store.update((x) => ({ ...x, active: null, rest: null }));
/** 结算页改力竭度（写回刚保存的那次训练） */
export const setExertion = (id: string, v: number | null) => store.update((x) => ({ ...x, history: x.history.map((s) => (s.id === id ? { ...s, exertion: v } : s)) }));
