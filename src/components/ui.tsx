/** 基础件（视觉语言 v2）。字号只用 .milo-text-* 文字样式，颜色、间距、圆角只用 tokens.css。
 *  Num：数字用压缩粗体（font/number），单位跟一个小号 Caption，颜色 text/secondary。 */
import type { ReactNode } from 'react';
import s from './ui.module.css';

type NumSize = 'hero' | 'xl' | 'l' | 'm' | 's' | 'xs';
export function Num({ value, unit, size = 'm' }: { value: ReactNode; unit?: string; size?: NumSize }) {
  return <span className={s.num}><b className={`milo-text-number-${size}`}>{value}</b>{unit && <i className={s.unit}>{unit}</i>}</span>;
}

/** 页头：标题（Title/L）+ 右侧附件（链接、分段控件）；上方可有一行小字（日期） */
export function PageHeader({ title, eyebrow, trailing, children }: { title: string; eyebrow?: ReactNode; trailing?: ReactNode; children?: ReactNode }) {
  return (
    <header className={s.header}>
      {eyebrow && <div className={`milo-text-caption ${s.secondary}`}>{eyebrow}</div>}
      <div className={s.row}><h1 className="milo-text-title-l">{title}</h1><span className={s.sp} />{trailing}</div>
      {children}
    </header>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className={s.tag}>{children}</span>;
}

/** 状态条：减量建议、减量周、动作池不足。左侧一道骨白竖条；quiet 为一行小字 */
export function StatusStrip({ title, detail, quiet }: { title?: string; detail: ReactNode; quiet?: boolean }) {
  if (quiet) return <div className={`milo-text-caption ${s.secondary}`}>{detail}</div>;
  return <div className={s.status}><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{detail}</span></div>;
}

/** 按钮：primary = 荧光（每屏唯一的行动焦点）；neutral = 骨白实心（完成、确认）；ghost = 描边 */
export function Button({ kind = 'primary', children, onClick }: { kind?: 'primary' | 'neutral' | 'ghost'; children: ReactNode; onClick?: () => void }) {
  return <button type="button" className={s[kind]} onClick={onClick}>{children}</button>;
}

/** 列表行：左两行（名称 / 说明），右侧数值或标签；行间用刻度分隔线 */
export function ListRow({ title, detail, trailing }: { title: ReactNode; detail?: ReactNode; trailing?: ReactNode }) {
  return (
    <li className={s.listRow}>
      <div><div className="milo-text-body-strong">{title}</div>{detail && <div className={`milo-text-caption ${s.secondary}`}>{detail}</div>}</div>
      {trailing}
    </li>
  );
}
export function List({ children }: { children: ReactNode }) {
  return <ul className={s.list}>{children}</ul>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className={`milo-text-label ${s.secondary}`}>{children}</div>;
}

/** 卡片：bg/raised + 细描边 + radius/l；hero 变体带一点径向渐变深度 */
export function Card({ children, hero }: { children: ReactNode; hero?: boolean }) {
  return <section className={hero ? s.hero : s.card}>{children}</section>;
}

/** 容量图例：四档用明暗 + 纹理区分，不只靠色相 */
export function TierLegend() {
  return (
    <div className={s.legend}>
      <span><i className={s.tNone} />未练</span><span><i className={s.tLow} />不足</span><span><i className={s.tOk} />达标</span><span><i className={s.tOver} />超量</span>
    </div>
  );
}
