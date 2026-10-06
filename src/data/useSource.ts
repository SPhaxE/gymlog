/** 页面的数据源 + 减量操作（首页、增量页共用）：
 *  - 真用户：读本机存储，采纳 / 不减写进存储（data/deload.ts）；
 *  - 演示场景（?scenario=，截图、回归、演示路线）：不读也不写存储，减量状态只在本页内存里改——
 *    这样场景里点「采纳」也能走完「面板 → 减量周」的完整流程，不会有点了没反应的按钮。 */
import { useMemo, useState } from 'react';
import type { DeloadState } from '../engine/types';
import { adoptDeload, skipDeload } from './deload';
import { sourceOf, type Source } from './demo';
import { useStore } from './store';

export function useSource(scenario: string | undefined, now: number) {
  const st = useStore();
  const [local, setLocal] = useState<DeloadState | null>(null);
  const src = useMemo<Source>(() => {
    if (scenario) { const b = sourceOf(scenario, now); return { ...b, deload: local ?? b.deload }; }
    return { history: st.history, profile: st.profile, deload: st.deload };
  }, [scenario, now, local, st.history, st.profile, st.deload]);
  const adopt = () => (scenario ? setLocal({ status: 'adopted', atMs: now }) : adoptDeload());
  const skip = () => (scenario ? setLocal({ status: 'dismissed', atMs: now }) : skipDeload());
  return { src, adopt, skip };
}
