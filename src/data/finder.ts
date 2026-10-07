/** 找动作（6e 检索面板，ia T19；线框 design/wireframes ?board=finder，Stitch e6 finder-v2）：按肌肉找到能练它、我有器械的动作，加到今天。
 *  - 点人体按「整块肌肉」选（同一块肌肉的几个头合并成一个命中目标），面板左栏再细分到肌头：
 *    真实路径算过，半身人体上逐个肌头点，正 / 背各有 9 块命中区 < 48（三角肌前束只有 24），合并后全部 ≥ 48。
 *  - 某一面只露一条的肌肉不在那一面当目标（去另一面点）：大腿内收肌背面 27 px（正面 69），斜方肌正面 46（背面大）。
 *  - 列表三样：动作名、器械、上次重量；我没有的器械排最后、变灰（不隐藏）。
 *  - 「加到今天」：训练中 → 加在最后（session.addExercise）；还没开始 → 记进今天的 extras，首页处方后面跟着它，开始训练时一起抄进草稿。
 *    演示场景（?scenario=）不写存储，记在模块内存里（刷新复位），和 useSource 的删除同一个做法。 */
import { useSyncExternalStore } from 'react';
import { exerciseRecords, rxItemFor, startOfDay, type HeadStat, type Prescription, type RxItem } from '../engine';
import type { Exercise, Session } from '../engine/types';
import { env, type Source } from './demo';
import { addExercise, swapExercise } from './session';
import { store, useStore } from './store';

/** 整块肌肉 → 它的肌头（顺序 = 左栏细分胶囊的顺序） */
export const FAMILIES: { id: string; name: string; heads: string[] }[] = [
  { id: 'chest', name: '胸', heads: ['upper-pectoralis', 'mid-lower-pectoralis'] },
  { id: 'delts', name: '三角肌', heads: ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid'] },
  { id: 'biceps', name: '肱二头肌', heads: ['long-head-bicep', 'short-head-bicep'] },
  { id: 'triceps', name: '肱三头肌', heads: ['lateral-head-triceps', 'long-head-triceps', 'medial-head-triceps'] },
  { id: 'forearms', name: '前臂', heads: ['wrist-extensors', 'wrist-flexors'] },
  { id: 'abs', name: '腹直肌', heads: ['upper-abdominals', 'lower-abdominals'] },
  { id: 'obliques', name: '腹斜肌', heads: ['obliques'] },
  { id: 'traps', name: '斜方肌', heads: ['upper-trapezius', 'traps-middle', 'lower-trapezius'] },
  { id: 'lats', name: '背阔肌', heads: ['lats'] },
  { id: 'lowerback', name: '下背', heads: ['lowerback'] },
  { id: 'glutes', name: '臀', heads: ['gluteus-maximus', 'gluteus-medius'] },
  { id: 'quads', name: '股四头肌', heads: ['inner-quadricep', 'outer-quadricep', 'rectus-femoris'] },
  { id: 'hamstrings', name: '腘绳肌', heads: ['lateral-hamstrings', 'medial-hamstrings'] },
  { id: 'adductors', name: '大腿内收肌', heads: ['inner-thigh'] },
  { id: 'calves', name: '小腿', heads: ['gastrocnemius', 'soleus', 'tibialis'] },
];
export const FAMILY_OF: Record<string, string> = Object.fromEntries(FAMILIES.flatMap((f) => f.heads.map((h) => [h, f.id])));
export const familyById = (id: string) => FAMILIES.find((f) => f.id === id);
/** 某一面上只露一条、不当点选目标的肌头（它的地方归给旁边的肌肉） */
export const PICK_SKIP: Record<'front' | 'back', string[]> = { front: ['upper-trapezius'], back: ['inner-thigh'] };
/** 一块肌肉在哪一面点：正面能点的优先 */
export const sideOf = (familyId: string): 'front' | 'back' => (['traps', 'lats', 'lowerback', 'glutes', 'hamstrings', 'triceps'].includes(familyId) ? 'back' : 'front');

export const EQUIP_NAME: Record<string, string> = { barbell: '杠铃', dumbbell: '哑铃', machine: '固定器械', cable: '绳索', smith: '史密斯', bodyweight: '自重', kettlebell: '壶铃', band: '弹力带', plate: '杠铃片' };

export interface FinderRow { ex: Exercise; primary: boolean; owned: boolean; last: number | null }

/** 上次这个动作正式组的最大重量（没做过 = null） */
export function lastWeightOf(history: Session[], exId: string): number | null {
  const r = exerciseRecords(env, history, exId).at(-1);
  if (!r) return null;
  const w = r.entry.sets.filter((s) => s.type !== 'warmup').map((s) => s.weightKg ?? 0);
  return w.length ? Math.max(...w) : null;
}

/** 练到这些肌头的动作：我有的器械在前 → 主练在前 → 练过的在前 → 复合在前 */
export function finderRows(heads: string[], src: Pick<Source, 'history' | 'profile'>): FinderRow[] {
  const owned = new Set(src.profile?.equipment ?? []);
  return env.exList
    .filter((e) => heads.some((h) => e.primaryHeads.includes(h) || e.secondaryHeads.includes(h)))
    .map((ex) => ({ ex, primary: heads.some((h) => ex.primaryHeads.includes(h)), owned: owned.has(ex.equipmentType), last: lastWeightOf(src.history, ex.id) }))
    .sort((a, b) => Number(b.owned) - Number(a.owned) || Number(b.primary) - Number(a.primary) || Number(b.last != null) - Number(a.last != null)
      || Number(b.ex.mechanic === 'compound') - Number(a.ex.mechanic === 'compound') || (a.ex.id < b.ex.id ? -1 : 1));
}

/** 从首页进来时先替你选好的那块肌肉：本周还差最多（适宜量 − 近 7 天组数，只算已恢复的肌头） */
export function suggestFamily(stats: Map<string, HeadStat>): string {
  let best = FAMILIES[0].id, gap = -1;
  for (const f of FAMILIES) {
    const g = f.heads.reduce((n, h) => { const x = stats.get(h); return x && x.exerciseCount > 0 && (x.recovery == null || x.recovery >= 0.5) ? n + Math.max(0, x.mav - x.sets7d) : n; }, 0);
    if (g > gap) { gap = g; best = f.id; }
  }
  return best;
}

/** 换一个的候选（线框 swap W1）：主练肌头有交集、我有的器械；同器械类型 → 练过的 → 复合 在前；第一个是「推荐」 */
export function swapCandidates(exId: string, src: Pick<Source, 'history' | 'profile'>, exclude: string[] = []): FinderRow[] {
  const cur = env.ex.get(exId);
  if (!cur) return [];
  const owned = new Set(src.profile?.equipment ?? []);
  return env.exList
    .filter((e) => e.id !== exId && !exclude.includes(e.id) && owned.has(e.equipmentType) && e.primaryHeads.some((h) => cur.primaryHeads.includes(h)))
    .map((ex) => ({ ex, primary: true, owned: true, last: lastWeightOf(src.history, ex.id) }))
    .sort((a, b) => Number(b.ex.equipmentType === cur.equipmentType) - Number(a.ex.equipmentType === cur.equipmentType) || Number(b.last != null) - Number(a.last != null)
      || Number(b.ex.mechanic === cur.mechanic) - Number(a.ex.mechanic === cur.mechanic)
      || b.ex.primaryHeads.filter((h) => cur.primaryHeads.includes(h)).length - a.ex.primaryHeads.filter((h) => cur.primaryHeads.includes(h)).length || (a.ex.id < b.ex.id ? -1 : 1))
    .slice(0, 6);
}

export const itemFor = (exId: string, history: Session[], deload = false): RxItem | null => { const ex = env.ex.get(exId); return ex ? rxItemFor(env, history, ex, deload) : null; };

/** 处方 + 今天手动加的动作（已经在处方里的不重复加）。恢复日 / 动作池不足时，只要加了就变成一份只有这些动作的处方 */
export function withExtras(rx: Prescription, ids: string[], history: Session[]): Prescription {
  const add = ids.filter((id) => !rx.items.some((it) => it.exerciseId === id)).map((id) => itemFor(id, history, rx.deload)).filter((x): x is RxItem => !!x);
  if (!add.length) return rx;
  const items = [...rx.items, ...add];
  return { ...rx, kind: 'plan', items, cands: 'cands' in rx ? rx.cands : [],
    totals: { sets: items.reduce((n, i) => n + i.sets, 0), exercises: items.length, regions: [...new Set(items.map((i) => i.region))], heads: [...new Set(items.flatMap((i) => i.primaryHeads))] } };
}

/* ---- 今天手动加的动作：真用户存 store.extras；演示场景存模块内存 ---- */
const mem = new Map<string, string[]>(), subs = new Set<() => void>();
let ver = 0;
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const resetScenarioExtras = () => { mem.clear(); ver += 1; subs.forEach((f) => f()); };

export function useExtras(scenario: string | undefined, now: number) {
  const st = useStore();
  useSyncExternalStore(sub, () => ver);
  const day = startOfDay(now);
  const ids = scenario ? mem.get(scenario) ?? [] : st.extras && st.extras.day === day ? st.extras.ids : [];
  return ids;
}

/** 加到今天：训练中加在最后并返回 'session'；没开始就记进今天的处方后面并返回 'plan'；已经在今天里了返回 'dup' */
export function addToToday(exId: string, scenario: string | undefined, src: Pick<Source, 'history' | 'deload'>, now: number, planned: string[] = []): 'session' | 'plan' | 'dup' {
  const st = store.get();
  if (!scenario && st.active) {
    if (st.active.entries.some((e) => e.exerciseId === exId)) return 'dup';
    const it = itemFor(exId, src.history);
    if (it) addExercise(it);
    return 'session';
  }
  const day = startOfDay(now);
  const cur = scenario ? mem.get(scenario) ?? [] : st.extras?.day === day ? st.extras.ids : [];
  if (cur.includes(exId) || planned.includes(exId)) return 'dup';
  if (scenario) { mem.set(scenario, [...cur, exId]); ver += 1; subs.forEach((f) => f()); }
  else store.update((s) => ({ ...s, extras: { day, ids: [...cur, exId] } }));
  return 'plan';
}

/** 换一个：训练中把第 e 个动作换成 exId */
export function swapTo(e: number, exId: string, history: Session[]) {
  const it = itemFor(exId, history);
  if (it) swapExercise(e, it);
}
