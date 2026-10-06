/** 减量状态行（首页、增量页共用）：同一个 deloadView 只在这里渲染一次，两页的文案不会漂移。
 *  只有「建议减量」可点（打开面板）；减量周、这次不减只是状态，不可点——没有死路按钮。 */
import { Banner, Button } from '../components';
import type { DeloadView } from '../engine';

export function DeloadBanner({ dv, hits, onOpen }: { dv: DeloadView; hits: number; onOpen: () => void }) {
  if (dv.kind === 'suggest') return <Banner title="建议本周减量" detail={`${hits} 个动作的预估 1RM 连降两次`} actions={<Button kind="ghost" size="s" onClick={onOpen}>看看</Button>} />;
  if (dv.kind === 'week') return <Banner title={`减量周 · 还剩 ${dv.daysLeft} 天`} detail="组数减半、强度 ×0.9" />;
  if (dv.kind === 'note') return <Banner quiet detail={`减量信号仍在 · 你选了这次不减（${dv.daysLeft} 天内不再提示）`} />;
  return null;
}
