/** 进行中的训练（P03，ia §1.5 记组 / §1.6 组间休息 / §1.7 结算）：所有改动立即写进本地存储（store）。
 *  - 开始：把今日处方抄成草稿；重量预填建议重量，次数预填处方的每组目标（引擎已按「上次 + 1、加重后回到下限」算好）。
 *  - 完成一组只有一个入口 completeSet；完成后自动开始组间休息（结束时间戳），最后一个动作的最后一组不触发。
 *  - 结束：只有存在已完成的工作组才保存；没做的动作标「未做」；写进历史后清掉进行中的训练和休息。 */
import type { Prescription, RxItem } from '../engine';
import type { Session, SetRecord } from '../engine/types';
import { noteForDelete } from './me';
import { store, type ActiveSession, type DraftEntry, type DraftSet } from './store';

export const MAX_SETS = 10;

/** 行内校验（ia §1.5 输入范围）：返回出错的格和文案；空值不算错（缺值另有提示） */
export function setError(row: Pick<DraftSet, 'weight' | 'reps'>): { field: 'weight' | 'reps'; msg: string } | undefined {
  const w = row.weight.trim(), r = row.reps.trim();
  if (w && (!/^\d+(\.\d+)?$/.test(w) || Number(w) > 500)) return { field: 'weight', msg: '最多 500 kg' };
  if (r && (!/^\d+$/.test(r) || Number(r) < 1 || Number(r) > 100)) return { field: 'reps', msg: '1–100 次' };
}

/** 热身组（6e，线框 warm W2）：只给「当天第一个练到这些主练肌头的复合动作」、正式重量 ≥ 40 kg 的排；40% × 8 → 60% × 5 → 80% × 3，按步进取整。
 *  热身组不计入容量 / 趋势 / 新纪录 / 导航外圈（ia §1.5），也不占「第几组」的序号；打卡热身不触发组间休息。 */
export const WARMUP = { minKg: 40, steps: [[0.4, 8], [0.6, 5], [0.8, 3]] as const };
export function warmupRows(kg: number | null, step = 2.5): DraftSet[] {
  if (kg == null || kg < WARMUP.minKg) return [];
  return WARMUP.steps.map(([p, reps]) => ({ type: 'warmup' as const, weight: String(Math.max(step, Math.round((kg * p) / step) * step)), reps: String(reps), done: false }));
}
export const isWork = (x: DraftSet) => x.type !== 'warmup';
/** 这个动作的正式组（工作组 + 递减组）都打完了没有：热身组不算 */
export const workDone = (en: DraftEntry) => en.rows.every((x) => x.done || !isWork(x));

/** 处方里的一个动作 → 草稿；warm = 要不要排热身组 */
export function entryFor(it: RxItem, warm = false, step = 2.5): DraftEntry {
  const kg = it.suggestion.weightKg;
  return {
    exerciseId: it.exerciseId, name: it.name, sets: it.sets, repRange: it.repRange, restSec: it.restSec, unilateral: it.unilateral,
    suggestKg: kg, skipped: false,
    rows: [...(warm ? warmupRows(kg, step) : []),
      ...Array.from({ length: it.sets }, (_, i) => ({ type: 'work' as const, weight: kg != null ? String(kg) : '', reps: String(it.suggestion.repsPerSet[i] ?? it.repRange[0]), done: false }))],
  };
}
/** 哪几个动作排热身：复合动作，且它的主练肌头还没被前面的复合动作热过 */
export function warmFlags(items: Pick<RxItem, 'mechanic' | 'primaryHeads'>[]): boolean[] {
  const warmed = new Set<string>();
  return items.map((it) => {
    if (it.mechanic !== 'compound') return false;
    const fresh = it.primaryHeads.some((h) => !warmed.has(h));
    it.primaryHeads.forEach((h) => warmed.add(h));
    return fresh;
  });
}

export function startSession(rx: Extract<Prescription, { kind: 'plan' }>, now: number, step = 2.5) {
  const warm = warmFlags(rx.items);
  const entries: DraftEntry[] = rx.items.map((it, i) => entryFor(it, warm[i], step));
  const active: ActiveSession = { id: `s-${now}`, startMs: now, entries, cur: 0 };
  store.update((s) => ({ ...s, active, rest: null, extras: null }));
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
  const lastOfAll = e === en.length - 1 && workDone(en[e]);
  // 这个动作做完了就自动跳到下一个没做完的动作（热身组没打不算没做完）
  const next = workDone(en[e]) ? en.findIndex((x, i) => i > e && !x.skipped && !workDone(x)) : e;
  store.update((s) => ({ ...s, active: s.active && { ...s.active, cur: next >= 0 ? next : e }, rest: lastOfAll ? null : { endAt: now + en[e].restSec * 1000, totalMs: en[e].restSec * 1000 } }));
}

export function addSet(e: number) {
  patchActive((a) => ({ ...a, entries: a.entries.map((en, i) => {
    if (i !== e || en.rows.filter(isWork).length >= MAX_SETS) return en;
    const last = en.rows[en.rows.length - 1];
    return { ...en, rows: [...en.rows, { type: 'work', weight: last?.weight ?? '', reps: last?.reps ?? String(en.repRange[0]), done: false }] };
  }) }));
}
/** 热身组打卡 / 取消：点一颗算做完一组，不开始组间休息 */
export const toggleWarmup = (e: number, r: number) => patchRow(e, r, (x) => (x.type === 'warmup' ? { ...x, done: !x.done } : x));

/** 换一个（6e，线框 swap W1）：只换今天。这个动作还没打过正式组 → 原地换掉；打过 → 已打的组留在原动作下（组数收成已打的），新动作插在它后面并切过去 */
export function swapExercise(e: number, it: RxItem, step = 2.5) {
  patchActive((a) => {
    const en = a.entries[e];
    if (!en) return a;
    const hadWarm = en.rows.some((x) => !isWork(x));
    const fresh = entryFor(it, hadWarm && it.mechanic === 'compound', step);
    const doneRows = en.rows.filter((x) => x.done && isWork(x));
    if (!doneRows.length) return { ...a, entries: a.entries.map((x, i) => (i === e ? fresh : x)), cur: e };
    const kept = { ...en, sets: doneRows.length, rows: en.rows.filter((x) => x.done) };
    return { ...a, entries: [...a.entries.slice(0, e), kept, fresh, ...a.entries.slice(e + 1)], cur: e + 1 };
  });
}
/** 训练中「加到今天」：排在最后，不排热身；返回它的位置 */
export function addExercise(it: RxItem): number {
  let at = -1;
  patchActive((a) => { at = a.entries.length; return { ...a, entries: [...a.entries, entryFor(it)] }; });
  return at;
}
/** 暂停（6e，线框 pause W2）：已记的组都在，组间休息停掉；继续时把暂停的时长从训练时长里扣掉 */
export const pauseSession = (now = Date.now()) => store.update((s) => (s.active ? { ...s, active: { ...s.active, pausedAt: now }, rest: null } : s));
export const resumeSession = (now = Date.now()) => store.update((s) => {
  const a = s.active;
  if (!a?.pausedAt) return s;
  const { pausedAt, ...rest } = a;
  return { ...s, active: { ...rest, startMs: a.startMs + Math.max(0, now - pausedAt) } };
});

export const toggleSkip = (e: number) => patchActive((a) => ({ ...a, entries: a.entries.map((en, i) => (i === e ? { ...en, skipped: !en.skipped } : en)) }));

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
/** 删除一次训练（记录页详情的「删除这次训练」，ia §1.8）：从历史里拿掉。容量 / 恢复度 / 趋势 / PR / 处方 / 增量全是从历史现算的（各页 useMemo 依赖 history），
 *  删完自动重算，不用逐项失效；减量状态原样保留。进行中的训练、草稿不受影响。返回有没有删到（id 不存在返回 false） */
export function deleteSession(id: string, now = Date.now()): boolean {
  const st = store.get();
  if (!st.history.some((s) => s.id === id)) return false;
  // 牛龄 / 连胜也是从历史现算的：删一次训练可能让它们回退，回退发生在删的这一刻，记一条写进成长记录（不弹窗，ia §1.14）
  const note = noteForDelete(st.history, id, st.profile, st.deloads, now);
  store.update((x) => ({ ...x, history: x.history.filter((s) => s.id !== id), notes: note ? [...x.notes, note] : x.notes }));
  return true;
}
export const discardSession = () => store.update((x) => ({ ...x, active: null, rest: null }));
/** 结算页改力竭度（写回刚保存的那次训练） */
export const setExertion = (id: string, v: number | null) => store.update((x) => ({ ...x, history: x.history.map((s) => (s.id === id ? { ...s, exertion: v } : s)) }));
