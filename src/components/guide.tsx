/** 动作要领的底部抽屉（P04，线框 p04 W3 + Stitch p04-v2 版式 + v3 的大号步骤编号）：
 *  常态露出一句话要点（前面一道荧光短竖 = 全屏唯一的荧光）和 3 步，全在拇指区；往上拉（或点把手 / 提示行）展开出练到的肌头和我的进步（M05 阻尼抽屉）。
 *  拖动只认把手区域：竖向拖过 hit-min 的一半就切换，松手弹到位；减少动态效果时直接切换。 */
import { useRef, type ReactNode } from 'react';
import { T } from '../styles/tokens.gen';
import { Icon } from './Icon';
import { cx } from './state';
import s from './guide.module.css';

export function GuideDrawer({ cue, steps, open, onOpen, more, footer }: {
  cue: string; steps: string[]; open: boolean; onOpen: (v: boolean) => void;
  /** 展开后才看到的部分（练到的肌头、我的进步） */
  more?: ReactNode;
  /** 抽屉底部的操作（「加到今天」），常态也在 */
  footer?: ReactNode;
}) {
  const drag = useRef<{ y: number; id: number } | null>(null);
  const half = T['size/hit-min'] / 2;
  return (
    <section className={cx(s.drawer, open && s.open)} aria-label="动作要领">
      <button type="button" className={cx('milo-focus', s.grab)} aria-expanded={open} aria-label={open ? '收起' : '展开：练到的肌头 · 我的进步'}
        onPointerDown={(e) => { drag.current = { y: e.clientY, id: e.pointerId }; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerUp={(e) => { const d = drag.current; drag.current = null; if (!d) return; const dy = e.clientY - d.y; if (Math.abs(dy) < half) onOpen(!open); else onOpen(dy < 0); }}
        onPointerCancel={() => { drag.current = null; }}>
        <i />
      </button>
      <div className={s.scroll}>
        <p className={cx('milo-text-heading', s.cue)}>{cue}</p>
        <ol className={s.steps}>{steps.map((t, i) => <li key={i}><b>{i + 1}</b><span className="milo-text-body">{t}</span></li>)}</ol>
        {more && (open ? <div className={s.more}>{more}</div>
          : <button type="button" className={cx('milo-press milo-focus', s.peek)} onClick={() => onOpen(true)}><span className="milo-text-caption">往上拉：练到的肌头 · 我的进步</span><Icon name="up" small /></button>)}
      </div>
      {footer && <div className={s.footer}>{footer}</div>}
    </section>
  );
}
