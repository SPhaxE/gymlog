/** 底部面板：遮罩 bg/scrim，面板 bg/sheet，顶角 radius/xl，顶部抓手；点遮罩、×、Esc 或系统返回键关闭；打开时焦点进入面板，关闭后回到原处。
 *  面板盖住导航（ia §1.12），关掉即恢复。 */
import { useRef, type ReactNode } from 'react';
import { IconButton } from './Button';
import { useBackHandler, useFocusTrap } from './overlay';
import s from './Sheet.module.css';

/** docked：只做静态展示（Playground 的矩阵），不抢焦点、不登记返回键 */
export function Sheet({ title, meta, onClose, children, docked }: { title: string; meta?: ReactNode; onClose: () => void; children: ReactNode; docked?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useBackHandler(!docked, onClose);
  useFocusTrap(ref, onClose, !docked);
  return (
    <div className={s.scrim} onClick={onClose}>
      <section ref={ref} className={s.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className={s.grip} />
        <div className={s.head}>
          <h2 className="milo-text-title-m">{title}</h2>
          {meta && <span className={`milo-text-caption ${s.meta}`}>{meta}</span>}
          <span className={s.sp} />
          <IconButton icon="close" label="关闭" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}

/** 面板里的一块：标题（Label）+ 内容，bg/raised、radius/m */
export function SheetBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className={s.block}><div className="milo-text-label">{label}</div>{children}</div>;
}
