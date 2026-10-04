/** 动效组件（2026-10-04 用户选定 8motions 的 02 / 03 / 07）：
 *  Cascade  — M07 弹簧交错流：子项依次从下方弹入，错开 motion/stagger，总窗口不超过 motion/list-max；
 *  RestDock — M02 流体胶囊形变：组间休息平时是底部一颗小胶囊，点开原地长成休息面板（尺寸与圆角一起按软弹簧过渡）；
 *  SharedDetail / sharedTransition / sharedName — M03 共享元素展开：列表行的卡片、名称、数字原地变形成整屏详情（View Transitions），返回时变回去。
 *  都有「减少动态效果」降级：直接到位。 */
import { Children, useEffect, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
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

/* ---------- M03 共享元素展开（View Transitions） ---------- */
/** 共享元素的名字：同一个 id 的卡片、名称、数字在列表与详情里同名，转场时由浏览器把它们从旧位置变形到新位置 */
export const sharedName = (part: 'card' | 'title' | 'num', id: string) => ({ viewTransitionName: `x-${part}-${id.replace(/[^a-zA-Z0-9-]/g, '-')}` });

/** 用 View Transitions 包住一次状态切换（flushSync 让新 DOM 在回调里就位）；不支持或减少动态效果时直接切换 */
export function sharedTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || still) { update(); return; }
  doc.startViewTransition(() => flushSync(update));
}

/** 详情整屏：卡片底、标题、主数字与列表行同名（sharedName），转场时列表行原地长成这一屏；其余内容随后淡入。返回键 / 按钮关闭 */
export function SharedDetail({ id, title, sub, hero, onBack, children }: { id: string; title: string; sub?: ReactNode; hero?: ReactNode; onBack: () => void; children?: ReactNode }) {
  useBackHandler(true, onBack);
  useEffect(() => { document.querySelector<HTMLElement>('[data-shared-back]')?.focus({ preventScroll: true }); }, []);
  return (
    <div className={s.detail} style={sharedName('card', id)} role="dialog" aria-label={title} aria-modal="true">
      <div className={s.detailHead}>
        <span data-shared-back tabIndex={-1} />
        <IconButton icon="back" label="返回" onClick={onBack} />
        <div className={s.detailTitle}><h2 className="milo-text-title-m" style={sharedName('title', id)}>{title}</h2>{sub && <span className="milo-text-caption">{sub}</span>}</div>
      </div>
      {hero && <div className={s.detailHero} style={sharedName('num', id)}>{hero}</div>}
      <div className={s.detailBody}>{children}</div>
    </div>
  );
}
