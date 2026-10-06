/** 「离下一级还差什么」的那句话（「我的」成长卡与牛龄页共用）：用能照着做的说法，不写抽象经验值（ia §1.14）。
 *  没有历史：完成第一次训练开始长大；满级：Milo 的话；主项预估 1RM 涨幅合理就写 kg，太大就改写训练周期数（见 data/me.ts 的 nextGoal）。 */
import type { GrowthState } from '../engine';
import { nextGoal } from '../data/me';

export function GoalHint({ g, empty }: { g: GrowthState; empty: boolean }) {
  if (empty) return <>完成第一次训练开始长大</>;
  const goal = nextGoal(g);
  if (!goal) return <>Milo 满级。接下来比的只有昨天的自己。</>;
  const up = goal.stageUp ? '升段' : '升 1 小级';
  if (goal.lift) return <>再涨 <b>{goal.lift.kg} kg</b> {goal.lift.name}的预估 1RM，{up}</>;
  if (goal.cycles) return <>再完成 <b>{goal.cycles} 个训练周期</b>，{up}</>;
  return <>再创几次纪录，{up}</>;
}
