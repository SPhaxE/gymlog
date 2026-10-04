/** /preview：活的规范（DESIGN.md v2 的实物）。Token、文字样式、间距、版式规则和每个组件的状态都在这一页，
 *  数值直接读 tokens.css / tokens.gen.ts；改 tokens.json 重新生成后这里同步变化。阶段 6 每页开工前先对照这里。 */
import { SectionLabel } from '../components';
import { T } from '../styles/tokens.gen';
import s from './Preview.module.css';

const COLORS: [string, string[]][] = [
  ['底与面', ['bg/base', 'bg/raised', 'bg/raised-2', 'bg/sheet', 'line/default', 'line/strong']],
  ['文字', ['text/primary', 'text/secondary', 'text/disabled', 'feedback/danger']],
  ['骨白：选中 / 实心中性', ['control/selected', 'action/primary', 'nav/pill', 'data/gauge']],
  ['荧光：每屏唯一焦点 + 进度', ['accent/default', 'text/on-accent', 'text/on-accent-secondary', 'nav/progress']],
  ['数据：容量四档', ['data/tier-none', 'data/tier-low', 'data/tier-ok', 'data/tier-over', 'data/body', 'data/leader']],
];
const TEXT = [
  ['number-hero', 'Number/Hero', '85'], ['number-xl', 'Number/XL', '7.5'], ['number-l', 'Number/L', '3 × 6–8'], ['number-m', 'Number/M', '13,854'],
  ['number-s', 'Number/S', '6.5/13'], ['number-xs', 'Number/XS', '0/10'], ['title-l', 'Title/L', '今日处方'], ['title-m', 'Title/M', '中下胸'],
  ['heading', 'Heading', '杠铃深蹲'], ['body-strong', 'Body/Strong', '器械站姿提踵'], ['body', 'Body', '还需 50 小时'], ['label', 'Label', '近 7 天容量'],
  ['caption', 'Caption', '上次全部顶到 8 次 → +5 kg'], ['micro', 'Micro', '人体图：MuscleWiki'],
] as const;
const cssVar = (k: string) => `var(--milo-color-${k.replace('/', '-')})`;

export function Preview() {
  return (
    <div className={s.page}>
      <h1 className="milo-text-title-l">慢牛 Milo · 基础规范 v2</h1>
      <p className="milo-text-caption">本页是 docs/DESIGN.md 的实物：数值全部来自 design/tokens/tokens.json。阶段 6 每页开工前对照这里；页面与组件里不许出现散落的颜色和尺寸（npm run check:hardcoded）。</p>

      <h2 className="milo-text-heading">1 颜色角色</h2>
      {COLORS.map(([group, keys]) => (
        <div key={group} className={s.group}>
          <SectionLabel>{group}</SectionLabel>
          <div className={s.swatches}>{keys.map((k) => <div key={k} className={s.swatch}><i style={{ background: cssVar(k) }} /><span className="milo-text-micro">{k}</span></div>)}</div>
        </div>
      ))}

      <h2 className="milo-text-heading">2 文字样式</h2>
      <div className={s.type}>{TEXT.map(([cls, name, sample]) => (
        <div key={cls} className={s.typeRow}><span className={`milo-text-micro ${s.meta}`}>{name}</span><span className={`milo-text-${cls}`}>{sample}</span></div>
      ))}</div>

      <h2 className="milo-text-heading">3 间距与圆角（4 的倍数）</h2>
      <div className={s.spaces}>{(['2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl'] as const).map((k) => (
        <div key={k} className={s.spaceRow}><span className={`milo-text-micro ${s.meta}`}>space/{k} · {T[`space/${k}`]}</span><i style={{ width: `var(--milo-space-${k})` }} /></div>
      ))}</div>
      <div className={s.radii}>{(['xs', 's', 'm', 'l', 'xl', 'pill'] as const).map((k) => <div key={k} style={{ borderRadius: `var(--milo-radius-${k})` }}><span className="milo-text-micro">radius/{k}</span></div>)}</div>

      <h2 className="milo-text-heading">4 版式</h2>
      <div className={s.layout}>
        <div className={s.frame}>
          <div className={s.gutterL} /><div className={s.gutterR} />
          <div className={s.bodyBox}><span className="milo-text-micro">人体：在内容区内，左缘渐隐（同 V1）</span></div>
          <div className={s.navBox}><span className="milo-text-micro">导航 · 距底 nav-bottom</span></div>
        </div>
        <ul className={`milo-text-caption ${s.rules}`}>
          <li>背景全出血；一切内容（含人体图、胶囊、导航）在左右 size/gutter（{T['size/gutter']}）之内。</li>
          <li>内容最宽 size/content-max-w（{T['size/content-max-w']}），宽屏居中。</li>
          <li>页头：上边距 space/l，块间 space/s；页头到内容 space/m。</li>
          <li>内容底部留出 nav-bar-h + nav-bottom + space/s；有固定主按钮时再加 button-h + space/2xl。</li>
          <li>人体半身：从包围盒左侧裁掉 ratio/figure-crop（{Math.round(T['ratio/figure-crop'] * 100)}%），左缘 ratio/figure-fade（{Math.round(T['ratio/figure-fade'] * 100)}%）渐隐，不透明度 opacity/figure。</li>
          <li>触控目标不小于 size/hit-min（{T['size/hit-min']}）；视觉更小的件（分段、静止胶囊）把命中区外扩。</li>
        </ul>
      </div>

      <h2 className="milo-text-heading">5 组件与交互态</h2>
      <p className="milo-text-body">组件的全部变体与交互态（按下、聚焦、禁用、加载、错误）在 <a className={s.link} href="/playground">/playground</a>，这一页只放基础规范。</p>
    </div>
  );
}
