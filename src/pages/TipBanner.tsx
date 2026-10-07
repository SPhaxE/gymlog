/** 容量页 / 增量页的知识卡提示（ia §1.16；线框 ?board=tips W1 + W3，用户 2026-10-07 选）：放在页面摘要下面，一屏最多一条。
 *  被数据触发、没被「不再提示这一类」、这次没被 ✕ 收起的第一张；点进知识卡，✕ 收起时高度弹簧收回（Collapsible），不顶歪别的组件。训练流程（首页）不用它。 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Collapsible, KnowledgeTip } from '../components';
import { KNOWLEDGE } from '../data/growth';
import { dismissTip, knowledgeHits, tipFor, useDismissed } from '../data/knowledge';
import type { Source } from '../data/demo';
import { useWallet } from '../data/wallet';
import { T } from '../styles/tokens.gen';

export function TipBanner({ page, src, scenario, now, className }: { page: 'body' | 'gains'; src: Pick<Source, 'history' | 'profile'>; scenario?: string; now: number; className?: string }) {
  const nav = useNavigate(), loc = useLocation();
  const [wallet] = useWallet(scenario, now);
  const dismissed = useDismissed();
  const hits = useMemo(() => knowledgeHits(src, now), [src, now]);
  const hit = tipFor(page, hits, wallet.muted, dismissed);
  // 收起时先留着内容播完高度收回，再卸掉
  const [shown, setShown] = useState(hit);
  if (hit && hit.id !== shown?.id) setShown(hit);
  useEffect(() => {
    if (hit || !shown) return;
    const id = window.setTimeout(() => setShown(null), T['motion/spring-ms'] * 2);
    return () => window.clearTimeout(id);
  }, [hit, shown]);
  if (!shown) return null;
  const k = KNOWLEDGE[shown.id];
  return (
    <div className={className}>
      <Collapsible open={!!hit}>
        <KnowledgeTip variant="tip" title={k.title} why={shown.why} onOpen={() => nav(`/shop/guide/${shown.id}${loc.search}`)} onDismiss={() => dismissTip(shown.id)} />
      </Collapsible>
    </div>
  );
}
