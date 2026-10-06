/** 休息结束提示（「我的」→ 导航 → 休息结束提示 = 描边 + 振动）：倒计时刚走完时振一下。
 *  挂在外壳上（AppShell 的 RestEndBuzz），休息中切到任何一页都会振，不只是首页；切后台回来才发现已经结束的不补振。 */
import { useEffect } from 'react';
import { useCountdown } from '../components';
import { T } from '../styles/tokens.gen';
import { useStore } from './store';

export function useRestEndBuzz() {
  const st = useStore();
  const left = useCountdown(st.rest?.endAt ?? null);
  useEffect(() => {
    if (!st.rest || left > 0 || st.settings.restEnd !== 'vibrate' || Date.now() - st.rest.endAt > T['motion/toast-hold']) return;
    navigator.vibrate?.([T['motion/fast'] / 2, T['motion/fast'] / 3, T['motion/fast'] / 2]);
  }, [st.rest?.endAt, left > 0]); // eslint-disable-line react-hooks/exhaustive-deps
}
