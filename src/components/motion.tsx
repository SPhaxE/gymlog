/** 动效组件（2026-10-04 用户选定 8motions 的 02 / 03 / 07）：
 *  Cascade  — M07 弹簧交错流：子项依次从下方弹入，错开 motion/stagger，总窗口不超过 motion/list-max；
 *  RestDock — M02 流体胶囊形变：组间休息平时是底部一颗小胶囊，点开原地长成休息面板（尺寸与圆角一起按软弹簧过渡）；
 *  ExpandOverlay — M03 共享元素展开：从列表项的位置原地长成整屏详情，关闭时缩回原位（FLIP）。
 *  都有「减少动态效果」降级：直接到位。 */
import { Children, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { T } from '../styles/tokens.gen';
import { IconButton } from './Button';
import { Icon } from './Icon';
import { useBackHandler } from './overlay';
import { cx } from './state';
import { RestBar, clock } from './training';
import s from './motion.module.css';

export function Cascade({ children, replayKey }: { children: ReactNode; replayKey?: string | number }) {
  const items = Children.toArray(children), step = Math.min(T['motion/stagger'], T['motion/list-max'] / Math.max(1, items.length - 1));
  return <div key={replayKey} className={s.cascade}>{items.map((c, i) => <div key={i} className={s.cascadeItem} style={{ animationDelay: `${Math.round(i * step)}ms` }}>{c}</div>)}</div>;
}

export function RestDock({ remaining, total, open, onToggle, onAdjust, onSkip }: {
  remaining: number; total: number; open: boolean; onToggle: (open: boolean) => void; onAdjust?: (d: number) => void; onSkip?: () => void;
}) {
  const ratio = Math.max(0, Math.min(1, remaining / total));
  return (
    <div className={cx(s.dock, open && s.dockOpen)} style={{ ['--rest' as string]: `${ratio * 100}%` }}>
      {open ? (
        <div className={s.dockBody}>
          <RestBar remaining={remaining} total={total} onAdjust={onAdjust} onSkip={onSkip} onDismiss={() => onToggle(false)} />
          {remaining > 0 && <button type="button" className={cx('milo-focus', s.collapse)} onClick={() => onToggle(false)}>收起</button>}
        </div>
      ) : (
        <button type="button" className={cx('milo-press milo-focus', s.pill)} onClick={() => onToggle(true)} aria-label={remaining > 0 ? `组间休息剩余 ${clock(remaining)}，展开` : '休息结束，展开'}>
          <Icon name={remaining > 0 ? 'timer' : 'check'} small />
          <span>{remaining > 0 ? '休息' : '休息结束'}</span>
          {remaining > 0 && <b>{clock(remaining)}</b>}
        </button>
      )}
    </div>
  );
}

/** origin：列表项相对容器的矩形（getBoundingClientRect 减去容器的位置）；open 为真时长成整屏，变假时缩回 origin 后调用 onClosed */
export function ExpandOverlay({ origin, open, onClose, onClosed, title, children }: {
  origin: { x: number; y: number; w: number; h: number }; open: boolean; onClose: () => void; onClosed: () => void; title: string; children: ReactNode;
}) {
  const [grown, setGrown] = useState(false);
  useBackHandler(open, onClose);
  useLayoutEffect(() => {
    if (open) { const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true))); return () => cancelAnimationFrame(id); }
    setGrown(false);
    const t = window.setTimeout(onClosed, T['motion/spring-ms']);
    return () => clearTimeout(t);
  }, [open, onClosed]);
  useEffect(() => { if (grown) document.querySelector<HTMLElement>('[data-expand-back]')?.focus({ preventScroll: true }); }, [grown]);
  return (
    <div className={cx(s.expand, grown && s.expandOpen)} role="dialog" aria-label={title} aria-modal="true"
      style={grown ? undefined : { left: origin.x, top: origin.y, width: origin.w, height: origin.h }}>
      <div className={s.expandHead}><span data-expand-back tabIndex={-1} /><IconButton icon="back" label="返回" onClick={onClose} /><h2 className="milo-text-heading">{title}</h2></div>
      <div className={s.expandBody}>{children}</div>
    </div>
  );
}
