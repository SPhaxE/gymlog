/** 导航胶囊环的训练状态（ia §1.12）：5 个 Tab 根页的导航都读这里，训练中切到身体页也能看到进度和休息。
 *  - 进行中：外圈 = 已打卡工作组 ÷ 计划组数（跳过的动作不算分母，加组超过计划封顶满环）；0 组时一整圈暗色轨道（started）；
 *    休息中：选中项写剩余时间、小胶囊里走休息描边（按结束时间戳，切后台回来仍然准）。
 *  - 今天练完了：满环。还没开始：不画环。
 *  - 「我的」里的导航设置：关掉今日进度环 → 不画外圈；关掉休息倒计时描边 → 选中项仍写剩余时间，只是不画描边。
 *  - ?scenario= 演示场景不读本机存储，用页面给的 fallback（也不受设置影响）。 */
import { clock, useCountdown } from '../components';
import { startOfDay } from '../engine';
import { useStore } from './store';

export interface TrainingNav { progress: number | null; started?: boolean; rest?: string; restEndAt?: number; restTotalMs?: number }

export function useTrainingNav(scenario: string | undefined, fallback: number | null, now = Date.now()): TrainingNav {
  const st = useStore();
  const left = useCountdown(!scenario && st.active && st.rest ? st.rest.endAt : null);
  if (scenario) return { progress: fallback };
  const { ring, restOutline } = st.settings;
  const a = st.active;
  let nav: TrainingNav;
  if (a) {
    const total = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.length), 0);
    const done = a.entries.reduce((n, x) => n + x.rows.filter((r) => r.done && r.type !== 'warmup').length, 0);
    const resting = st.rest && left > 0;
    nav = { progress: total ? Math.min(1, done / total) : 0, started: true, ...(resting ? { rest: clock(left), restEndAt: st.rest!.endAt, restTotalMs: st.rest!.totalMs } : {}) };
  } else if (st.history.some((s) => s.startMs >= startOfDay(now) && s.startMs <= now)) nav = { progress: 1 };
  else nav = { progress: fallback ?? 0 };
  if (!ring) nav = { ...nav, progress: null, started: undefined };
  if (!restOutline) { const { restEndAt: _a, restTotalMs: _b, ...rest } = nav; nav = rest; }
  return nav;
}
