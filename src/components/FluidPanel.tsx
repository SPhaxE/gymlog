/** M02 流体胶囊形变（2026-10-09 走查 1 #29）：被点的那颗胶囊原地长成浮在页面上的面板——不是贴底抽屉。
 *  面板左右贴页面边距，竖向贴着那颗胶囊的位置（anchorY，胶囊顶边的屏幕 y），夹在安全区里；放不下才在面板里滚动。
 *  转场：面板与胶囊同名（sharedName 'fluid'），框按 motion/spring-soft 变形（有一点过冲），图像对裁成 radius/xl——胶囊很矮时自然是胶囊形，长大了是圆角面板；
 *  旧快照前半程淡出、新快照从四分之一处淡入（缩回时内容不会先没了）。遮罩自带一个独立共享名（x-fscrim），开时淡入、关时淡出，叠在页面之上、面板之下（interactive.css）。
 *  role=dialog、焦点圈定、Esc / 返回键 / 点外面 / 右上角「关闭」都能关；不是共享元素打开时（如 ?head= 直接进来）自己淡入、关时留复制品淡出。 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { T } from '../styles/tokens.gen';
import { IconButton } from './Button';
import { sharedName } from './motion';
import { useBackHandler, useExitGhost, useFocusTrap } from './overlay';
import { cx } from './state';
import s from './FluidPanel.module.css';

export const FLUID_SCRIM = { viewTransitionName: 'x-fscrim', viewTransitionClass: 'fscrim' } as React.CSSProperties;

export function FluidPanel({ title, meta, onClose, children, sharedId, anchorY, docked }: { title: string; meta?: ReactNode; onClose: () => void; children: ReactNode;
  /** 共享元素 id：面板与标题和那颗胶囊同名 */ sharedId?: string;
  /** 胶囊顶边的屏幕 y：面板顶边尽量对齐它；不给就竖向居中 */ anchorY?: number;
  /** 只做静态展示（Playground）：不抢焦点、不登记返回键、不定位 */ docked?: boolean }) {
  const ref = useRef<HTMLElement>(null), scrim = useRef<HTMLDivElement>(null);
  useBackHandler(!docked, onClose);
  useFocusTrap(ref, onClose, !docked);
  useExitGhost(scrim, s.out, docked || !!sharedId);
  const [top, setTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (docked) return;
    const sc = scrim.current!, el = ref.current!, cs = getComputedStyle(sc), r = sc.getBoundingClientRect();
    const lo = parseFloat(cs.paddingTop) || 0, hi = r.height - (parseFloat(cs.paddingBottom) || 0), h = Math.min(el.scrollHeight, hi - lo);
    const want = anchorY == null ? (lo + hi - h) / 2 : anchorY - r.top - T['space/l'];
    setTop(Math.max(lo, Math.min(hi - h, want)));
  }, [anchorY, docked]);
  return (
    <div ref={scrim} className={cx(s.scrim, sharedId && s.shared, docked && s.docked)} style={sharedId ? FLUID_SCRIM : undefined} onClick={onClose}>
      <section ref={ref} className={s.panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onClick={(e) => e.stopPropagation()}
        style={{ ...(top != null ? { top } : {}), ...(sharedId ? sharedName('fluid', sharedId) : {}) }}>
        <div className={s.head}>
          <div className={s.headText}>
            {/* 共享时标题收成文字本身的宽：转场里名称按字号比例放大，不会按整行宽被拉成一大团 */}
            <h2 className="milo-text-title-m" style={sharedId ? { ...sharedName('title', sharedId), width: 'fit-content' } : undefined}>{title}</h2>
            {meta && <span className={`milo-text-caption ${s.meta}`}>{meta}</span>}
          </div>
          <IconButton icon="close" label="关闭" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}
