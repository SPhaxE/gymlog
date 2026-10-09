/** /playground：全部组件 × 全部交互态（阶段 5 门禁），外加真实交互与动效演示。
 *  目录在 src/playground/catalog.tsx；示例数字来自引擎在演示场景上的实算值（fixtures.ts）。
 *  Pressed / Focused 在代码里是 :active / :focus-visible，这里强制显示；触屏优先，没有悬停态。 */
import { Fragment, useMemo } from 'react';
import { CATALOG, GROUPS, NOT_IN_MATRIX, TOTAL, cn, variants, type Entry, type Variant } from '../playground/catalog';
import { DEMOS } from '../playground/demos';
import { fixtures, type Fixtures } from '../playground/fixtures';
import { Segmented } from '../components';
import { setThemePref, useTheme } from '../styles/theme';
import s from '../playground/Playground.module.css';

const cx = (...xs: (string | false | undefined)[]) => xs.filter(Boolean).join(' ');

function Cell({ e, v, f, bare }: { e: Entry; v: Variant; f: Fixtures; bare?: boolean }) {
  const label = Object.values(v.props).map(cn).join(' · ');
  return (
    <figure className={cx(s.cell, s[`size_${e.size ?? 'auto'}`])} data-variant={v.key}>
      <div className={s.cellStage}>{e.render(v.props, f)}</div>
      {!bare && label && <figcaption className={`milo-text-micro ${s.caption}`}>{label}</figcaption>}
    </figure>
  );
}

function Matrix({ e, f }: { e: Entry; f: Fixtures }) {
  const vs = variants(e);
  if (!e.rows || !e.cols) return <div className={s.list}>{vs.map((v) => <Cell key={v.key} e={e} v={v} f={f} />)}</div>;
  const cols = e.axes[e.cols];
  const rowKeys = e.rows.reduce<Record<string, string>[]>((acc, ax) => acc.flatMap((r) => e.axes[ax].map((val) => ({ ...r, [ax]: val }))), [{}])
    .filter((r) => vs.some((v) => Object.entries(r).every(([k, val]) => v.props[k] === val)));
  return (
    <div className={s.matrixScroll}>
      <div className={s.matrix} style={{ gridTemplateColumns: `max-content repeat(${cols.length}, max-content)` }}>
        <span />
        {cols.map((c) => <span key={c} className={`milo-text-label ${s.axis}`}>{cn(c)}</span>)}
        {rowKeys.map((r) => (
          <Fragment key={JSON.stringify(r)}>
            <span className={`milo-text-label ${s.axis} ${s.rowAxis}`}>{Object.values(r).map(cn).join(' · ')}</span>
            {cols.map((c) => {
              const v = vs.find((x) => Object.entries({ ...r, [e.cols!]: c }).every(([k, val]) => x.props[k] === val));
              return v ? <Cell key={c} e={e} v={v} f={f} bare /> : <span key={c} className={s.hole} aria-hidden="true">—</span>;
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function Section({ e, f }: { e: Entry; f: Fixtures }) {
  const n = variants(e).length, axes = Object.entries(e.axes);
  const demo = DEMOS[e.name];
  return (
    <section id={e.name} className={s.section}>
      <header className={s.sectionHead}>
        <h3 className="milo-text-heading">{e.name}{e.covers && <span className={`milo-text-caption ${s.muted}`}> · 含 {e.covers.join('、')}</span>}</h3>
        <p className={`milo-text-caption ${s.muted}`}>
          {axes.length ? axes.filter(([k]) => k !== 'name').map(([k, vals]) => `${k}：${vals.map(cn).join(' / ')}`).join('　') : '单个组件'}{e.name === 'Icon' && `${e.axes.name.length} 个图标`}　·　{n} 个变体
        </p>
        <p className={`milo-text-body ${s.desc}`}>{e.desc}</p>
      </header>
      <Matrix e={e} f={f} />
      {demo && <div className={s.demo}><h4 className="milo-text-label">交互演示</h4>{demo(f)}</div>}
    </section>
  );
}

export function Playground({ now }: { now: number }) {
  const f = useMemo(() => fixtures(now), [now]);
  const theme = useTheme();
  const total = TOTAL();
  return (
    <div className={s.page} data-total={total}>
      <aside className={s.side}>
        <p className="milo-text-heading">慢牛 Milo</p>
        <p className={`milo-text-caption ${s.muted}`}>组件与交互态 · 规范 v2</p>
        {/* 主题（2026-10-10）：同一套组件在深色 / 浅色下对照——只换 <html data-theme>，组件一行不改 */}
        <Segmented label="主题" items={[['dark', '深色'], ['light', '浅色']] as const} value={theme} onChange={(v) => setThemePref(v)} />
        <nav className={s.toc} aria-label="组件目录">
          {GROUPS.map((g) => (
            <div key={g} className={s.tocGroup}>
              <p className={`milo-text-label ${s.muted}`}>{g}</p>
              {CATALOG.filter((e) => e.group === g).map((e) => <a key={e.name} href={`#${e.name}`} className={`milo-text-caption ${s.tocLink}`}>{e.name}</a>)}
            </div>
          ))}
          <div className={s.tocGroup}>
            <p className={`milo-text-label ${s.muted}`}>规范与页面</p>
            <a className={`milo-text-caption ${s.tocLink}`} href="/spec">基础规范（颜色、文字、间距、版式）</a>
            <a className={`milo-text-caption ${s.tocLink}`} href="#Icon">图标网格规范（Icon 一节）</a>
            <a className={`milo-text-caption ${s.tocLink}`} href="/today">App（5 个 Tab）</a>
          </div>
        </nav>
      </aside>
      <main className={s.main}>
        <header className={s.hero}>
          <h1 className="milo-text-title-l">组件与交互态</h1>
          <p className={`milo-text-body ${s.desc}`}>
            {CATALOG.length} 个组件 · {total} 个变体 · 深色 / 浅色两套主题（左上角切换）。样式只引用 tokens.css（npm run check:hardcoded）；示例数字来自引擎在演示场景上的实算值。
            按下 / 聚焦在代码里是 :active / :focus-visible，这里强制显示；触屏优先，没有悬停态。系统开启「减少动态效果」时，按下不缩放、滑块直接到位、骨架不闪。
          </p>
          <p className={`milo-text-caption ${s.muted}`}>不进矩阵的导出：{Object.entries(NOT_IN_MATRIX).map(([k, why]) => `${k}（${why}）`).join('；')}</p>
        </header>
        {GROUPS.map((g) => (
          <div key={g} className={s.group}>
            <h2 className={`milo-text-title-m ${s.groupTitle}`}>{g}</h2>
            {CATALOG.filter((e) => e.group === g).map((e) => <Section key={e.name} e={e} f={f} />)}
          </div>
        ))}
      </main>
    </div>
  );
}
