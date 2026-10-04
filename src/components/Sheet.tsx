/** 底部面板：遮罩 bg/scrim，面板 bg/sheet，顶角 radius/xl，顶部抓手；点遮罩或 × 关闭 */
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import s from './Sheet.module.css';

export function Sheet({ title, meta, onClose, children }: { title: string; meta?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className={s.scrim} onClick={onClose}>
      <section className={s.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className={s.grip} />
        <div className={s.head}>
          <h2 className="milo-text-title-m">{title}</h2>
          {meta && <span className={`milo-text-caption ${s.meta}`}>{meta}</span>}
          <span className={s.sp} />
          <button type="button" className={s.close} onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
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
