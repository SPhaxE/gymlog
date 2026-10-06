/** 减量面板（底部 Sheet，首页「看看」与增量页状态行共用）：说清楚为什么建议减量（哪几个动作连着退步、退了多少），
 *  再给两个选择——「采纳」进 6 天减量周、「这次不减」6 天内不再提醒。
 *  交互五层：战略＝让用户明白引擎为什么这样建议、并且能自己决定；范围＝列依据 + 两个按钮；结构＝面板不是页面，关掉回到来源页；
 *  框架＝依据在上、说明一行、按钮固定在面板底部拇指区；表现＝每个动作一块：名称、三次预估 1RM、累计降幅（▼ + 文字）、小曲线。 */
import { Button, Delta, SheetBlock, Sheet, Sparkline } from '../components';
import { env, fmt } from '../data/demo';
import type { DeloadHit } from '../engine';
import s from './DeloadSheet.module.css';

export function DeloadSheet({ hits, onAdopt, onSkip, onClose }: { hits: DeloadHit[]; onAdopt: () => void; onSkip: () => void; onClose: () => void }) {
  const days = env.cfg.deload.days;
  return (
    <Sheet title="建议本周减量" meta={`${hits.length} 个动作的预估 1RM 连降两次`} onClose={onClose}>
      <div className={s.wrap}>
        {hits.map((h) => (
          <SheetBlock key={h.exerciseId} label={h.name}>
            <div className={s.row}>
              <div className={s.text}>
                <span className="milo-text-body">{h.series.map(fmt).join(' → ')} kg</span>
                <span className={s.delta}><Delta dir="down" value={`近三次累计 −${fmt(h.dropPct)}%`} /></span>
              </div>
              <Sparkline points={h.series.map((v, i) => ({ t: i, v }))} label={`${h.name} 近三次预估 1RM`} />
            </div>
          </SheetBlock>
        ))}
        <p className={`milo-text-caption ${s.note}`}>减量周：组数减半、强度 ×0.9，持续 {days} 天。</p>
        {/* 两个按钮固定在面板底部（面板默认只有屏高 60%，依据多了在上面滚，按钮永远看得见）；左「这次不减」右「采纳」，主操作靠右拇指 */}
        <div className={s.actions}>
          <Button kind="ghost" onClick={onSkip}>这次不减</Button>
          <Button kind="neutral" onClick={onAdopt}>采纳减量</Button>
        </div>
      </div>
    </Sheet>
  );
}
