/** 反馈（DESIGN §9）：Toast、Dialog、Skeleton、StateView（页面级数据态：加载 / 空 / 错误）、LoadMore（分段加载）。 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { T } from '../styles/tokens.gen';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { LogoGlyph } from './Logo';
import { Portal, useBackHandler, useFocusTrap, useToast, type ToastKind } from './overlay';
import { cx } from './state';
import s from './feedback.module.css';

/** 轻提示：操作结果（已保存、已删除 · 撤销、保存失败）。role=status / alert；停留 motion/toast-hold，有操作的停留加倍 */
export function Toast({ kind = 'success', message, action, onAction }: { kind?: ToastKind; message: string; action?: string; onAction?: () => void }) {
  const icon: Record<ToastKind, IconName> = { success: 'check', error: 'alert', info: 'info' };
  return (
    <div className={cx(s.toast, kind === 'error' && s.toastError)} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon name={icon[kind]} />
      <span className={s.toastText}>{message}</span>
      {action && <button type="button" className={cx('milo-press milo-focus', s.toastAction)} onClick={onAction}>{action}</button>}
    </div>
  );
}

/** 轻提示的出口：放在壳 / 迷你屏幕的悬浮层里，读 ToastProvider 的队列 */
export function ToastViewport() {
  const { items, dismiss } = useToast();
  const t = items[0];
  useEffect(() => {
    if (!t) return;
    const id = window.setTimeout(() => dismiss(t.id), T['motion/toast-hold'] * (t.action ? 2 : 1));
    return () => clearTimeout(id);
  }, [t, dismiss]);
  return (
    <div className={s.viewport} aria-live="polite">
      {t && <div key={t.id} className={s.toastIn}><Toast kind={t.kind} message={t.message} action={t.action?.label} onAction={() => { t.action?.run(); dismiss(t.id); }} /></div>}
    </div>
  );
}

/** 对话框：只用于二次确认（删除训练、载入示例数据、清除全部数据）。焦点圈定、Esc / 返回键关闭、关闭后焦点回到原处。
 *  确认按钮：tone=danger 时为危险按钮，否则骨白；取消为描边。 */
export function DialogCard({ title, children, icon, confirm, cancel = '取消', tone = 'neutral', onConfirm, onCancel }: {
  title: string; children?: ReactNode; icon?: IconName; confirm: string; cancel?: string; tone?: 'neutral' | 'danger'; onConfirm?: () => void; onCancel?: () => void;
}) {
  return (
    <div className={s.dialog} role="alertdialog" aria-modal="true" aria-label={title}>
      {icon && <span className={cx(s.dialogIcon, tone === 'danger' && s.dialogIconDanger)}><Icon name={icon} /></span>}
      <h2 className="milo-text-title-m">{title}</h2>
      {children && <div className={cx('milo-text-body', s.dialogBody)}>{children}</div>}
      <div className={s.dialogActions}>
        <Button kind={tone === 'danger' ? 'danger' : 'neutral'} onClick={onConfirm}>{confirm}</Button>
        <Button kind="ghost" onClick={onCancel}>{cancel}</Button>
      </div>
    </div>
  );
}

export function Dialog({ open, onClose, ...card }: Parameters<typeof DialogCard>[0] & { open: boolean; onClose: () => void }) {
  useBackHandler(open, onClose);
  if (!open) return null;
  return <Portal><DialogLayer onClose={onClose}><DialogCard {...card} onCancel={card.onCancel ?? onClose} /></DialogLayer></Portal>;
}
function DialogLayer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, onClose);
  return <div ref={ref} className={s.scrim} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>{children}</div>;
}

/** 骨架：加载中占位，形状与真实内容同尺寸，避免跳动。减少动态效果时不闪 */
export type SkeletonShape = 'line' | 'num' | 'row' | 'card' | 'capsule';
export function Skeleton({ shape = 'line' }: { shape?: SkeletonShape }) {
  if (shape === 'row') return <div className={s.skRow} aria-hidden="true"><i className={s.sk} /><span><i className={cx(s.sk, s.skLine)} /><i className={cx(s.sk, s.skShort)} /></span><i className={cx(s.sk, s.skNum)} /></div>;
  if (shape === 'card') return <div className={s.skCard} aria-hidden="true"><i className={cx(s.sk, s.skShort)} /><i className={cx(s.sk, s.skLine)} /><i className={cx(s.sk, s.skHero)} /><i className={cx(s.sk, s.skLine)} /></div>;
  return <i className={cx(s.sk, shape === 'num' ? s.skHero : shape === 'capsule' ? s.skCapsule : s.skLine)} aria-hidden="true" />;
}

/** 页面级数据态（ia 各页「边界情况」）：loading 骨架 / empty 引导 / error 重试。部分数据态在页面里就地处理（缺的行隐藏，不显示 0） */
export type StateKind = 'loading' | 'empty' | 'error';
export function StateView({ kind, title, detail, action, onAction }: { kind: StateKind; title?: string; detail?: string; action?: string; onAction?: () => void }) {
  if (kind === 'loading') return <div className={s.loading} role="status" aria-label="加载中"><Skeleton shape="card" /><Skeleton shape="row" /><Skeleton shape="row" /><Skeleton shape="row" /></div>;
  return (
    <div className={s.state} role={kind === 'error' ? 'alert' : undefined}>
      <span className={cx(s.stateIcon, kind === 'error' && s.dialogIconDanger)}><Icon name={kind === 'error' ? 'alert' : 'calendar'} /></span>
      {title && <h2 className="milo-text-heading">{title}</h2>}
      {detail && <p className={cx('milo-text-body', s.dialogBody)}>{detail}</p>}
      {action && <div className={s.stateAction}><Button kind={kind === 'error' ? 'neutral' : 'primary'} size="s" icon={kind === 'error' ? 'refresh' : undefined} onClick={onAction}>{action}</Button></div>}
    </div>
  );
}

/** 分段加载（2026-10-08 走查 1 #17，DESIGN §9.2）：长列表滑到底自动加载下一段——底部先露出 Logo 加载态（条一根根长出来）和「加载中」，
 *  停 motion/slow 再接上（让加载看得见，不是一下子蹦出来）；全部加载完写「到底了」。不写「还有 N 周」按钮。
 *  没有 IntersectionObserver 的环境（测试）退回一个「加载更多」按钮。left = 还剩多少没显示（0 = 到底了）。 */
export function LoadMore({ left, onMore }: { left: number; onMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const io = typeof IntersectionObserver !== 'undefined';
  useEffect(() => {
    const el = ref.current;
    if (!el || !io || left <= 0) return;
    let t = 0;
    // 每次剩余数变了重新观察：加载完内容还不够一屏、哨兵仍在视野里时会接着加载
    const ob = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || t) return;
      setBusy(true);
      t = window.setTimeout(() => { setBusy(false); onMore(); }, T['motion/slow']);
    }, { rootMargin: `0% 0% ${T['size/hit-min']}px 0%` });
    ob.observe(el);
    return () => { ob.disconnect(); window.clearTimeout(t); };
  }, [left, io, onMore]);
  if (left <= 0) return <p className={cx('milo-text-caption', s.loadEnd)}>到底了</p>;
  return (
    <div ref={ref} className={s.loadMore} role="status" aria-live="polite">
      {io ? <><LogoGlyph mark="bars" state={busy ? 'loading' : 'idle'} small className={s.loadGlyph} /><span className="milo-text-caption">{busy ? '加载中' : '加载更多'}</span></>
        : <Button kind="ghost" size="s" onClick={onMore}>加载更多</Button>}
    </div>
  );
}
