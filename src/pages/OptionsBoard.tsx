/** /preview 方案台（2026-10-06 用户：新建一个 /preview 专门用来测试方案）：同一个人、同一份演示数据，把待选的视觉方案并排放，
 *  每格一个真实渲染（不是截图），动效照常跑。选定的方案再定为默认、写进 DESIGN.md，这里留作对照。
 *  原来 /preview 上的基础规范页挪到了 /spec。
 *  当前三组（都是容量页的人体）：描边 O、肌头内部容量 F、热力图扫描线 S；每组第一格是现行做法。 */
import { useMemo, useRef, type ReactNode } from 'react';
import { BodyFigure, ContourFx, FillFx, ScanFx, type ContourFxKind, type FillFxKind, type ScanFxKind } from '../components';
import { bodyData } from '../data/demo';
import s from './OptionsBoard.module.css';

const noop = () => {};
const CONTOUR: [ContourFxKind | null, string, string][] = [
  [null, 'O0 现行', '浅荧光实线，挂载时从下往上描出 + 细光沿轮廓游走'],
  ['hair', 'O1 发丝', '极细、很淡的静态线；没有描出和游光'],
  ['soft', 'O2 柔光', '不画清晰的线，只有轮廓位置一圈模糊的淡光'],
  ['dot', 'O3 点线', '细点虚线，淡'],
  ['rim', 'O4 只描外缘', '人体内部的肌肉分界线不画，只在剪影最外圈一道内缘光'],
];
const FILL: [FillFxKind | null, string, string][] = [
  [null, 'F0 现行', '热成像：每块肌肉径向渐变 + 扩散 + 荧光渐变映射'],
  ['metal', 'F1 金属渐变', 'Gradient Ramp → Turbulent Displace → Fast Box Blur → Colorama：枪灰 / 钢 / 骨白高光，热的偏荧光'],
  ['topo', 'F2 等高线', '热度量化成几档，只画档与档之间的细线，档内很淡'],
  ['halftone', 'F3 半调点阵', '网格点，热度越高点越大'],
  ['liquid', 'F4 液位', '近 7 天组数 ÷ 最大可恢复量 = 液面高度，液面一道亮线'],
];
const SCAN: [ScanFxKind, string, string][] = [
  ['raster', 'S1 逐行显影', '暗栅从脚到头一行行打开，露出热力，再一行行合上'],
  ['slice', 'S2 切片扫描', '亮线一行行跳上去，留余辉'],
  ['wave', 'S3 呼吸波', '一道亮度波逐行往上传'],
  ['iso', 'S4 等温分层', '最热的肌肉先亮，一层层亮到最凉的'],
];

function Figure({ now, children }: { now: number; children?: (fig: ReactNode) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => bodyData('plain-prescription', now).stats, [now]);
  const fig = <div ref={ref} className={s.fig}><BodyFigure gender="male" view="front" stats={stats} focus={null} height={400} onAnchors={noop} relativeTo={ref} /></div>;
  return <>{children ? children(fig) : fig}</>;
}

function Cell({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <figure className={s.cell} data-option={id}>
      <div className={s.stage}>{children}</div>
      <figcaption><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{note}</span></figcaption>
    </figure>
  );
}

export function OptionsBoard({ now }: { now: number }) {
  return (
    <div className={s.page}>
      <header className={s.head}>
        <h1 className="milo-text-title-l">方案台</h1>
        <p className="milo-text-caption">同一个人、同一份演示数据，待选方案并排实时渲染。选定后定为默认；基础规范在 /spec，组件在 /playground。</p>
      </header>
      <section className={s.group} aria-label="描边">
        <h2 className="milo-text-heading">描边 · O</h2>
        <div className={s.grid}>{CONTOUR.map(([k, t, n]) => <Cell key={t} id={`contour-${k ?? 'now'}`} title={t} note={n}><ContourFx.Provider value={k}><Figure now={now} /></ContourFx.Provider></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="肌头内部容量">
        <h2 className="milo-text-heading">肌头内部容量 · F</h2>
        <div className={s.grid}>{FILL.map(([k, t, n]) => <Cell key={t} id={`fill-${k ?? 'now'}`} title={t} note={n}><FillFx.Provider value={k}><ContourFx.Provider value="hair"><Figure now={now} /></ContourFx.Provider></FillFx.Provider></Cell>)}</div>
        <p className="milo-text-caption">（这一组统一用 O1 发丝描边，只比较内部填充。）</p>
      </section>
      <section className={s.group} aria-label="热力图扫描线">
        <h2 className="milo-text-heading">热力图扫描线 · S</h2>
        <div className={s.grid}>{SCAN.map(([k, t, n]) => <Cell key={t} id={`scan-${k}`} title={t} note={n}><ScanFx.Provider value={k}><Figure now={now} /></ScanFx.Provider></Cell>)}</div>
      </section>
    </div>
  );
}
