/** /spec：活的规范（DESIGN.md v2 的实物）——讲「规则」：颜色角色、文字样式、间距圆角、版式、品牌（IP 与 Logo 的用法）。
 *  数值直接读 tokens.css / tokens.gen.ts；改 tokens.json 重新生成后这里同步变化。每页开工前先对照这里。
 *  2026-10-07 地址各司其职：组件的全部变体与交互态只在 /playground；待选与落选方案只在 /preview；原 /brand 并成本页第 6 章，原 /check 的构建信息放在页头。 */
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SectionLabel } from '../components';
import { BrandSpec } from './BrandSpec';
import tokens from '../../design/tokens/tokens.json';
import { T } from '../styles/tokens.gen';
import s from './Preview.module.css';

const COLORS: [string, string[]][] = [
  ['底与面', ['bg/base', 'bg/raised', 'bg/raised-2', 'bg/sheet', 'line/default', 'line/strong']],
  ['文字', ['text/primary', 'text/secondary', 'text/disabled', 'feedback/danger']],
  ['骨白：选中 / 实心中性', ['control/selected', 'action/primary', 'nav/pill', 'data/gauge']],
  ['荧光：每屏唯一焦点 + 进度', ['accent/default', 'text/on-accent', 'text/on-accent-secondary', 'nav/progress']],
  ['数据：容量四档', ['data/tier-none', 'data/tier-low', 'data/tier-ok', 'data/tier-over', 'data/body', 'data/leader']],
];
// 其余语义色（数据、导航、反馈等）也全部列出：规范页就是 tokens.json 的全量实物（原 /check 的职责）
const LISTED = new Set(COLORS.flatMap(([, ks]) => ks));
const REST = Object.keys(tokens.semantic.color).filter((k) => !LISTED.has(k));
const SAMPLE: Record<string, string> = {
  'Number/Hero': '85', 'Number/XL': '7.5', 'Number/L': '3 × 6–8', 'Number/M': '13,854', 'Number/S': '6.5/13', 'Number/XS': '0/10', 'Title/L': '今日处方', 'Title/M': '中下胸',
  Heading: '杠铃深蹲', 'Body/Strong': '器械站姿提踵', Body: '还需 50 小时', Label: '近 7 天容量', Caption: '上次全部顶到 8 次 → +5 kg', Micro: '人体图：MuscleWiki',
};
const TEXT = tokens.textStyles.map((x) => [x.name.toLowerCase().replace('/', '-'), x.name, SAMPLE[x.name] ?? (x.name.startsWith('Readout') ? '8 · 16 · 22 · 1:35' : '中下胸 恢复 3% · 修复期')] as const);
const cssVar = (k: string) => `var(--milo-color-${k.replace('/', '-')})`;

export function Preview() {
  // 旧地址 /brand 转来时带 #brand：页面是懒加载的，渲染完再滚到那一章
  useEffect(() => { const id = window.location.hash.slice(1); if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView()); }, []);
  return (
    <div className={s.page}>
      <h1 className="milo-text-title-l">慢牛 Milo · 规范 v2</h1>
      <p className={`milo-text-micro ${s.build}`}>{Capacitor.isNativePlatform() ? 'Android 应用' : '网页'} · 提交 {__BUILD_COMMIT__} · 构建于 {__BUILD_TIME__.slice(0, 16).replace('T', ' ')} UTC</p>
      <p className="milo-text-caption">本页是 docs/DESIGN.md 的实物：数值全部来自 design/tokens/tokens.json。阶段 6 每页开工前对照这里；页面与组件里不许出现散落的颜色和尺寸（npm run check:hardcoded）。</p>

      <h2 className="milo-text-heading">1 颜色角色</h2>
      {COLORS.map(([group, keys]) => (
        <div key={group} className={s.group}>
          <SectionLabel>{group}</SectionLabel>
          <div className={s.swatches}>{keys.map((k) => <div key={k} className={s.swatch}><i style={{ background: cssVar(k) }} /><span className="milo-text-micro">{k}</span></div>)}</div>
        </div>
      ))}

      {REST.length > 0 && <div className={s.group}>
        <SectionLabel>其余（数据、导航、反馈）</SectionLabel>
        <div className={s.swatches}>{REST.map((k) => <div key={k} className={s.swatch}><i style={{ background: cssVar(k) }} /><span className="milo-text-micro">{k}</span></div>)}</div>
      </div>}

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
      <p className="milo-text-body">组件的全部变体与交互态（按下、聚焦、禁用、加载、错误）和动效演示在 <a className={s.link} href="/playground">/playground</a>；待选和落选的视觉方案在 <a className={s.link} href="/preview">/preview</a>。这一页只放规则。</p>

      <h2 className="milo-text-heading" id="brand">6 品牌：IP 小牛与 Logo</h2>
      <BrandSpec />
    </div>
  );
}
