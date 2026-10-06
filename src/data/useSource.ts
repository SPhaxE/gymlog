/** 页面的数据源 + 减量操作 + 删除训练（首页、增量页、曲线页、记录页共用）：
 *  - 真用户：读本机存储，采纳 / 不减写进存储（data/deload.ts），删除训练写进存储（data/session.ts）；
 *  - 演示场景（?scenario=，截图、回归、演示路线）：不读也不写存储，减量状态只在本页内存里改、删掉的训练记在模块级的内存里（刷新即复位，
 *    所有用 useSource 的页面订阅同一份，删完回到别的页也已重算）——这样场景里点「采纳」「删除」也能走完完整流程，不会有点了没反应的按钮。
 *    身体页不走这里（直接读场景），场景里删除不影响它。 */
import { useMemo, useState, useSyncExternalStore } from 'react';
import type { DeloadState } from '../engine/types';
import { adoptDeload, skipDeload } from './deload';
import { sourceOf, type Source } from './demo';
import { deleteSession } from './session';
import { useStore } from './store';

const gone = new Map<string, Set<string>>(), subs = new Set<() => void>();
let version = 0;
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const removeInScenario = (scenario: string, id: string) => { gone.set(scenario, new Set(gone.get(scenario)).add(id)); version += 1; subs.forEach((f) => f()); };
/** 测试用：清掉场景里删掉的训练 */
export const resetScenarioRemovals = () => { gone.clear(); version += 1; subs.forEach((f) => f()); };

export function useSource(scenario: string | undefined, now: number) {
  const st = useStore();
  const [local, setLocal] = useState<DeloadState | null>(null);
  const removals = useSyncExternalStore(subscribe, () => version);
  const src = useMemo<Source>(() => {
    if (scenario) { const b = sourceOf(scenario, now), g = gone.get(scenario); return { ...b, history: g ? b.history.filter((s) => !g.has(s.id)) : b.history, deload: local ?? b.deload }; }
    return { history: st.history, profile: st.profile, deload: st.deload, deloads: st.deloads };
  }, [scenario, now, local, removals, st.history, st.profile, st.deload, st.deloads]);
  const adopt = () => (scenario ? setLocal({ status: 'adopted', atMs: now }) : adoptDeload());
  const skip = () => (scenario ? setLocal({ status: 'dismissed', atMs: now }) : skipDeload());
  const remove = (id: string) => { if (scenario) removeInScenario(scenario, id); else deleteSession(id); };
  return { src, adopt, skip, remove };
}
