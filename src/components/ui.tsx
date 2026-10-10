/** 内容基础件（视觉语言 v2）。字号只用 .milo-text-* 文字样式，颜色、间距、圆角只用 tokens.css。 */
import { useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLightLook } from './BodyFigure';
import { BodyRender, PALETTE } from './thermal';
import { Icon, type IconName } from './Icon';
import { GrainGlow } from './particles';
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

/** Tab 根页的页头：标题（Title/L）+ 右侧附件；附加信息（日期、计数、标签）一律放在标题下面（children）。
 *  标题上方不放任何东西、也没有细标题栏（2026-10-06 用户：五个 Tab 切换时大标题必须在同一个位置；滑走后不再出小页头）。 */
export function PageHeader({ title, trailing, children }: { title: string; trailing?: ReactNode; children?: ReactNode }) {
  return (
    <header className={s.header}>
      <div className={s.row}><h1 className="milo-text-title-l">{title}</h1><span className={s.sp} />{trailing}</div>
      {children}
    </header>
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
/** accent = 荧光细线小标（2026-10-09 DESIGN §1 第 7 条）：一屏重复出现的「得到」标记（列表每行的 PR）用它，不用骨白实心块 */
export type TagTone = 'neutral' | 'strong' | 'outline' | 'danger' | 'accent';
export function Tag({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: TagTone; icon?: IconName }) {
  return <span className={cx(s.tag, s[`tag_${tone}`])}>{icon && <Icon name={icon} small />}{children}</span>;
}

/** 状态条：减量建议 / 减量周 / 动作池不足 / 继续上次训练 / 错误。左侧竖条：骨白（info）或 feedback/danger（error）；quiet 为一行小字 */
export function Banner({ title, detail, tone = 'info', actions, quiet }: { title?: string; detail: ReactNode; tone?: 'info' | 'error'; actions?: ReactNode; quiet?: boolean }) {
  if (quiet) return <div className={`milo-text-caption ${s.secondary}`}>{detail}</div>;
  return (
    <div className={cx(s.banner, tone === 'error' && s.bannerError)} role={tone === 'error' ? 'alert' : undefined}>
      {tone === 'error' && <Icon name="alert" active />}
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

/** 卡片：bg/raised + 细描边 + radius/l；hero 变体 = 主角卡：右上角一团颗粒荧光按心跳泵（H4，2026-10-09 用户选定），左下一点骨白。
 *  calm = 训练中：泵得更慢、更淡。传 onClick 时整卡可点 */
export function Card({ children, hero, calm, onClick, label, state }: { children: ReactNode; hero?: boolean; calm?: boolean; onClick?: () => void; label?: string; state?: Forced }) {
  const h = hero ? { 'data-hero': '' } : {};
  const body = hero ? <>{children}<GrainGlow kind="pulse" calm={calm} className={s.heroGlow} /></> : children;
  if (onClick) return <button type="button" aria-label={label} className={cx('milo-press milo-focus', hero ? s.hero : s.card, s.cardBtn)} onClick={onClick} {...h} {...forced(state)}>{body}</button>;
  return <section className={hero ? s.hero : s.card} aria-label={label} {...h}>{body}</section>;
}

/** 档案格（「我的」的 2×2）：小字名称在上、大字当前值在下，整格是按钮，点开对应的编辑面板；没有 onClick 就是只读 */
export function ProfileTile({ label, value, unit, onClick, state }: { label: string; value: ReactNode; unit?: string; onClick?: () => void; state?: Forced }) {
  const body = (
    <>
      <span className={cx('milo-text-caption', s.secondary)}>{label}</span>
      <span className={s.tileValue}><b className="milo-text-number-m">{value}</b>{unit && <i className={s.unit}>{unit}</i>}</span>
    </>
  );
  if (!onClick) return <div className={s.tile}>{body}</div>;
  return <button type="button" className={cx('milo-press milo-focus', s.tile, s.tileBtn)} onClick={onClick} aria-label={`${label}：${value}${unit ?? ''}，修改`} {...forced(state)}>{body}</button>;
}

/** 容量图例：四档用明暗 + 纹理区分，不只靠色相 */
export function TierLegend() {
  const thermal = useContext(BodyRender);
  // 浅色（2026-10-10 全局浅色）：色带跟人体用的浅色方案走（方案色带的前 5 段）
  const ref = useRef<HTMLDivElement>(null), look = useLightLook(ref);
  if (thermal) {
    // 热成像色带：0 → 1，上面两道刻度标最低有效量（0.4）与适宜量（0.7），和 thermal.heatOf 一致
    const stops = (look ? look.ramp.slice(0, 5) : PALETTE[thermal.palette]).map((k, i, a) => `var(--milo-prim-${k}) ${(i / (a.length - 1)) * 100}%`).join(', ');
    return (
      <div ref={ref} className={s.heat} role="img" aria-label={`容量图例：${look ? look.legend : '越亮越热'}。未练、不足、达标、超量`}>
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
