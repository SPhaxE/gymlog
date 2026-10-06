/** 内容基础件（视觉语言 v2）。字号只用 .milo-text-* 文字样式，颜色、间距、圆角只用 tokens.css。 */
import { useContext, type CSSProperties, type ReactNode } from 'react';
import { BodyRender, PALETTE } from './thermal';
import { Icon, type IconName } from './Icon';
import { cx, forced, type Forced } from './state';
import s from './ui.module.css';

/** 数字：压缩粗体（font/number），单位跟一个小号 Caption，颜色 text/secondary */
export type NumSize = 'hero' | 'xl' | 'l' | 'm' | 's' | 'xs';
export function Num({ value, unit, size = 'm' }: { value: ReactNode; unit?: string; size?: NumSize }) {
  return <span className={s.num}><b className={`milo-text-number-${size}`}>{value}</b>{unit && <i className={s.unit}>{unit}</i>}</span>;
}

/** 增减：方向用形状 + 文字，不只靠颜色（ia §1.9）。up = 涨；down = 降；flat = ±1% 以内；baseline = 只有 1 次记录 */
export type DeltaDir = 'up' | 'down' | 'flat' | 'baseline';
export function Delta({ dir, value }: { dir: DeltaDir; value?: string }) {
  const icon: Record<DeltaDir, IconName | null> = { up: 'up', down: 'down', flat: 'flat', baseline: null };
  const text = dir === 'flat' ? '持平' : dir === 'baseline' ? '基线' : value;
  return <span className={cx(s.delta, s[dir])}>{icon[dir] && <Icon name={icon[dir]!} small />}<b>{text}</b></span>;
}

/** 页头 C 的细栏：大标题（带 data-title-collapse 的 h1）滑出屏幕顶的同时淡入，只有标题。
 *  外壳是零高度的 sticky——不占位、不挤版（身体页的舞台靠 ResizeObserver 算图高），必须放在滚动区里、页头前面；
 *  时间线是「标题滑出」（Screen 上 timeline-scope），不写死像素；不支持滚动驱动动画的浏览器里它不出现，页面照常可用。
 *  shown：强制显示（playground「已滚过大标题」态、截图用）。装饰性重复，读屏跳过。 */
export function SlimBar({ title, shown }: { title: string; shown?: boolean }) {
  return <div className={s.slimWrap} aria-hidden="true"><div className={cx(s.slim, shown && s.slimShown)}><span className="milo-text-heading">{title}</span></div></div>;
}

/** Tab 根页的页头：标题（Title/L）+ 右侧附件；上方可有一行小字（日期）。
 *  collapse：页头在滚动区里时开（页头 C）——大标题滑走后顶上留一条细标题栏；训练中的首页（有「结束」和进度）不开。 */
export function PageHeader({ title, eyebrow, trailing, children, collapse, collapsed }: { title: string; eyebrow?: ReactNode; trailing?: ReactNode; children?: ReactNode; collapse?: boolean; /** 强制显示细栏（静态展示用） */ collapsed?: boolean }) {
  return (
    <>
      {collapse && <SlimBar title={title} shown={collapsed} />}
      <header className={s.header}>
        {eyebrow && <div className={`milo-text-caption ${s.secondary}`}>{eyebrow}</div>}
        <div className={s.row}><h1 className="milo-text-title-l" data-title-collapse={collapse ? '' : undefined}>{title}</h1><span className={s.sp} />{trailing}</div>
        {children}
      </header>
    </>
  );
}

/** 子页页头（没有 Tab 的页：处方依据、动作详情、训练详情、训练进行中）：返回 + 标题（Heading）+ 右侧操作 */
export function TopBar({ title, sub, onBack, trailing, titleStyle }: { title: string; sub?: ReactNode; onBack?: () => void; trailing?: ReactNode; /** 标题的共享元素名（M09 钻入转场） */ titleStyle?: CSSProperties }) {
  return (
    <header className={s.topBar}>
      {onBack && <button type="button" className={cx('milo-press milo-focus', s.back)} onClick={onBack} aria-label="返回"><Icon name="back" /></button>}
      <div className={s.topTitle}><h1 className="milo-text-heading" style={titleStyle}>{title}</h1>{sub && <div className={`milo-text-caption ${s.secondary}`}>{sub}</div>}</div>
      {trailing}
    </header>
  );
}

/** 标签：neutral = 信息；strong = 骨白实心（PR）；outline = 虚线（首次、基线、未做）；danger = 错误 */
export type TagTone = 'neutral' | 'strong' | 'outline' | 'danger';
export function Tag({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: TagTone; icon?: IconName }) {
  return <span className={cx(s.tag, s[`tag_${tone}`])}>{icon && <Icon name={icon} small />}{children}</span>;
}

/** 状态条：减量建议 / 减量周 / 动作池不足 / 继续上次训练 / 错误。左侧竖条：骨白（info）或 feedback/danger（error）；quiet 为一行小字 */
export function Banner({ title, detail, tone = 'info', actions, quiet }: { title?: string; detail: ReactNode; tone?: 'info' | 'error'; actions?: ReactNode; quiet?: boolean }) {
  if (quiet) return <div className={`milo-text-caption ${s.secondary}`}>{detail}</div>;
  return (
    <div className={cx(s.banner, tone === 'error' && s.bannerError)} role={tone === 'error' ? 'alert' : undefined}>
      {tone === 'error' && <Icon name="alert" />}
      <div className={s.bannerText}>{title && <b className="milo-text-body-strong">{title}</b>}<span className="milo-text-caption">{detail}</span></div>
      {actions && <div className={s.bannerActions}>{actions}</div>}
    </div>
  );
}
/** @deprecated 用 Banner */
export const StatusStrip = Banner;

export function List({ children, label }: { children: ReactNode; label?: string }) {
  return <ul className={s.list} aria-label={label}>{children}</ul>;
}

/** 列表行：左两行（名称 / 说明），右侧附件；行间用刻度分隔线。
 *  kind：static = 只读；nav = 可点、行尾箭头；toggle = 行尾开关（整行可点）；danger = 危险操作（文字 feedback/danger）。 */
export type RowKind = 'static' | 'nav' | 'toggle' | 'danger';
export function ListRow({ title, detail, trailing, icon, kind = 'static', onClick, disabled, state }: {
  title: ReactNode; detail?: ReactNode; trailing?: ReactNode; icon?: IconName; kind?: RowKind; onClick?: () => void; disabled?: boolean; state?: Forced;
}) {
  const body = (
    <>
      {icon && <span className={s.rowIcon}><Icon name={icon} /></span>}
      <div className={s.rowText}><div className="milo-text-body-strong">{title}</div>{detail && <div className={`milo-text-caption ${s.secondary}`}>{detail}</div>}</div>
      {trailing}
      {kind === 'nav' && <Icon name="chevron" small />}
    </>
  );
  if (kind === 'static') return <li className={s.listRow}>{body}</li>;
  // 开关行：整行是 label，点文字等于点行尾的开关（开关本身是按钮，不能再套一层按钮）
  if (kind === 'toggle') return <li className={s.rowItem}><label className={cx(s.listRow, s.rowLabel, disabled && 'milo-disabled')}>{body}</label></li>;
  return (
    <li className={s.rowItem}>
      <button type="button" className={cx('milo-press milo-focus', s.listRow, s.rowBtn, kind === 'danger' && s.rowDanger)} onClick={onClick} disabled={disabled} {...forced(state)}>{body}</button>
    </li>
  );
}

export function SectionLabel({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return <div className={cx('milo-text-label', s.secondary, s.section)}>{children}{trailing && <><span className={s.sp} />{trailing}</>}</div>;
}

/** 卡片：bg/raised + 细描边 + radius/l；hero 变体带一点径向渐变深度。传 onClick 时整卡可点 */
export function Card({ children, hero, onClick, label, state }: { children: ReactNode; hero?: boolean; onClick?: () => void; label?: string; state?: Forced }) {
  const h = hero ? { 'data-hero': '' } : {};
  if (onClick) return <button type="button" aria-label={label} className={cx('milo-press milo-focus', hero ? s.hero : s.card, s.cardBtn)} onClick={onClick} {...h} {...forced(state)}>{children}</button>;
  return <section className={hero ? s.hero : s.card} aria-label={label} {...h}>{children}</section>;
}

/** 容量图例：四档用明暗 + 纹理区分，不只靠色相 */
export function TierLegend() {
  const thermal = useContext(BodyRender);
  if (thermal) {
    // 热成像色带：0 → 1，上面两道刻度标最低有效量（0.4）与适宜量（0.7），和 thermal.heatOf 一致
    const stops = PALETTE[thermal.palette].map((k, i, a) => `var(--milo-prim-${k}) ${(i / (a.length - 1)) * 100}%`).join(', ');
    return (
      <div className={s.heat} role="img" aria-label="容量图例：越亮越热。未练、不足、达标、超量">
        <span>未练</span>
        <i className={s.heatBar} style={{ background: `linear-gradient(90deg, ${stops})` }}><b style={{ left: '40%' }} /><b style={{ left: '70%' }} /></i>
        <span>超量</span>
        <em>刻度：最低 · 适宜</em>
      </div>
    );
  }
  return (
    <div className={s.legend}>
      <span><i className={s.tNone} />未练</span><span><i className={s.tLow} />不足</span><span><i className={s.tOk} />达标</span><span><i className={s.tOver} />超量</span>
    </div>
  );
}
