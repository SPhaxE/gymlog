/** 人体（MuscleWiki 真实路径，public/bodymap，V1 原样）。分层同 V1：中性部位 → 肌肉组 → 轮廓层；腹股沟不着色。
 *  版式规则（DESIGN §4，同 V1 BodyProgressMap）：人体放在内容区里（左缘 = 页面边距），不越过组件最外层；
 *  半身：按包围盒从左裁掉 ratio/figure-crop（露出约 58%），左缘再加 ratio/figure-fade 宽的渐隐，裁切读起来是有意的暗角，不是一刀切。
 *  热成像上面再叠一层「光」（ThermalLight，混合模式 screen）：浅荧光轮廓从下往上描出、一道细光沿轮廓游走、扫描光带周期性从下往上扫过人体——
 *  动的东西都在这一层，下面带滤镜的热像层静止不重画。
 *  量完锚点后通过 onAnchors 交给胶囊列画引线（坐标相对 relativeTo）。 */
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import { BodyRender, heatOf, tables } from './thermal';
import s from './BodyFigure.module.css';

type Path = { d: string; strokeWidth?: number };
type Part = { paths?: Path[]; lines?: { x1: number; y1: number; x2: number; y2: number; strokeWidth?: number }[] };
type BodyMap = { viewBox?: string; front: Record<string, Part>; back: Record<string, Part> };
const NEUTRAL = ['neck', 'feet', 'hands', 'groin'];
const cache = new Map<string, Promise<BodyMap>>();
const load = (g: string) => {
  if (!cache.has(g)) cache.set(g, fetch(`${import.meta.env.BASE_URL}bodymap/bodymap-${g}.json`).then((r) => r.json()));
  return cache.get(g)!;
};
export type Anchors = Record<string, [number, number]>;

/** 热力图扫描线的「逐层扫描」动效方案（2026-10-06 用户要几个方案看；/lab 里四个并排比较，选定后定为默认）：
 *  raster 逐行显影：扫描线先是一排暗栅，从脚到头一行行打开、露出底下的热力，停一会儿再从下往上一行行合上；
 *  slice  切片扫描：一条亮线一行一行往上跳（不是平滑滑动），走过的行留一段渐暗的余辉，像 CT 一层层切过去；
 *  wave   呼吸波：所有扫描线常亮很淡，一道亮度波逐行往上传，连续不断；
 *  iso    等温分层：按每块肌肉的热度分层——最热的肌肉里的扫描线先亮，接着次热的，一层层亮到最凉的，再一起暗下去。 */
export type ScanFxKind = 'raster' | 'slice' | 'wave' | 'iso';
export const ScanFx = createContext<ScanFxKind | null>(null);

export function BodyFigure({ gender, view, stats, focus, height, onAnchors, relativeTo, onPick }: {
  gender: 'male' | 'female'; view: 'front' | 'back'; stats: Map<string, HeadStat>; focus: string | null; height: number;
  onAnchors: (a: Anchors) => void; relativeTo: React.RefObject<HTMLElement | null>;
  /** 轻点某块肌肉（只有带 data-head 的肌头可点；其余部分不接触摸，页面照常滚动） */
  onPick?: (id: string) => void;
}) {
  const [data, setData] = useState<BodyMap | null>(null);
  const [vb, setVb] = useState<number[] | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const thermal = useContext(BodyRender), fid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  useEffect(() => { let on = true; setVb(null); load(gender).then((d) => on && setData(d)); return () => { on = false; }; }, [gender, view]);

  // 第一次渲染整张图量包围盒，再按 ratio/figure-crop 从左裁
  useLayoutEffect(() => {
    if (!data || vb || !svg.current) return;
    const bb = svg.current.getBBox(), pad = bb.height * 0.004, x0 = bb.x + bb.width * T['ratio/figure-crop'];
    setVb([x0, bb.y - pad, bb.x + bb.width - x0 + pad, bb.height + pad * 2]);
  }, [data, vb]);

  // 锚点：每个肌头在可见部分里面积最大的一块的中心
  useLayoutEffect(() => {
    if (!vb || !svg.current || !relativeTo.current) return;
    const el = svg.current, ctm = el.getScreenCTM(), base = relativeTo.current.getBoundingClientRect(), x0 = vb[0];
    if (!ctm) return;
    const minVisible = vb[2] * T['ratio/figure-fade'];
    const out: Anchors = {};
    for (const g of el.querySelectorAll<SVGGElement>('g[data-head]')) {
      let best: { a: number; x: number; y: number } | null = null;
      for (const p of g.querySelectorAll('path')) {
        const b = p.getBBox(), l = Math.max(b.x, x0 + minVisible), r = b.x + b.width;
        if (r <= l) continue; // 落在裁掉或渐隐的部分里
        const a = (r - l) * b.height;
        if (!best || a > best.a) best = { a, x: (l + r) / 2, y: b.y + b.height / 2 };
      }
      if (!best) continue;
      const pt = new DOMPoint(best.x, best.y).matrixTransform(ctm);
      out[g.dataset.head!] = [pt.x - base.left, pt.y - base.top];
    }
    onAnchors(out);
  }, [vb, height, stats, onAnchors, relativeTo]);

  if (!data) return null;
  const v = data[view];
  const pick = onPick && ((e: React.MouseEvent) => { const id = (e.target as Element).closest?.('g[data-head]')?.getAttribute('data-head'); if (id) onPick(id); });
  const box = vb ?? (data.viewBox ?? '0 0 676.49 1203.49').split(' ').map(Number);
  const tier = (id: string) => {
    const h = stats.get(id);
    if (!h || !(h.sets7d > 0)) return s.tNone;
    return h.level === 'over' ? s.tOver : h.level === 'ok' ? s.tOk : s.tLow;
  };
  if (thermal) return <ThermalSvg {...{ svgRef: svg, vb, box, height, v, stats, focus, fid, thermal, pick }} />;
  return (
    <svg ref={svg} className={`${vb ? s.figure : s.measuring} ${pick ? s.pickable : ''}`} onClick={pick} viewBox={box.join(' ')} height={height} width={(height * box[2]) / box[3]} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <g className={s.neutral}>{NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
      {Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body').map((k) => (
        <g key={k} data-head={k} className={`${tier(k)} ${k === focus ? s.tFocus : ''}`}>
          {(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}
        </g>
      ))}
      <g className={s.contour}>
        {(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}
        {(v.body?.lines ?? []).map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
      </g>
    </svg>
  );
}

/** 热成像：每块肌肉先按热度画成灰阶，再整体做一次「扩散（模糊）+ 渐变映射」。
 *  bloom：清晰的肌肉叠在自己的辉光上；iso：更强的扩散后量化成等温带，裁回人体轮廓；scan：bloom + 横向扫描线与颗粒，像热像仪画面。 */
function ThermalSvg({ svgRef, vb, box, height, v, stats, focus, fid, thermal, pick }: {
  svgRef: React.RefObject<SVGSVGElement | null>; vb: number[] | null; box: number[]; height: number; v: Record<string, Part>; stats: Map<string, HeadStat>;
  focus: string | null; fid: string; thermal: { palette: 'lime' | 'bone'; style: 'bloom' | 'iso' | 'scan' }; pick?: (e: React.MouseEvent) => void;
}) {
  const [r, g, b] = tables(thermal.palette), iso = thermal.style === 'iso', unit = box[3] / 100;
  const gray = (t: number) => `color-mix(in srgb, white ${Math.round(t * 100)}%, black)`;
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const fn = iso ? 'discrete' : 'table';
  const fx = useContext(ScanFx);
  const w = (height * box[2]) / box[3];
  return (
    <span className={s.stack} style={{ width: w, height }}>
    <svg ref={svgRef} className={`${vb ? s.thermal : s.measuring} ${pick ? s.pickable : ''}`} onClick={pick} viewBox={box.join(' ')} height={height} width={w} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs>
        {/* 每块肌肉一个径向渐变：中心是它的热度，边缘降到 55%，看起来是一团热而不是一块颜色 */}
        {heads.map((k) => { const h = heatOf(stats.get(k)); return (
          <radialGradient key={k} id={`g${fid}${k}`} cx="0.5" cy="0.45" r="0.62">
            <stop offset="0" style={{ stopColor: gray(Math.min(1, h * 1.08)) }} /><stop offset="1" style={{ stopColor: gray(h * 0.55) }} />
          </radialGradient>); })}
        <filter id={`h${fid}`} colorInterpolationFilters="sRGB" x="-15%" y="-8%" width="130%" height="116%">
          {/* 内部：小半径扩散后裁回肌肉轮廓 → 中心热、边缘凉；外部：大半径扩散做热晕；iso 把内部量化成等温带 */}
          <feGaussianBlur in="SourceGraphic" stdDeviation={unit * (iso ? 1.5 : 0.7)} result="soft" />
          <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={unit * 2.6} result="halo" />
          <feComponentTransfer in="halo" result="haloDim"><feFuncA type="linear" slope={iso ? 0 : 0.7} /></feComponentTransfer>
          <feMerge result="heat"><feMergeNode in="haloDim" /><feMergeNode in="inner" /></feMerge>
          <feComponentTransfer in="heat"><feFuncR type={fn} tableValues={r} /><feFuncG type={fn} tableValues={g} /><feFuncB type={fn} tableValues={b} /></feComponentTransfer>
        </filter>
        {thermal.style === 'scan' && <>
          <pattern id={`s${fid}`} width={unit} height={unit * 0.9} patternUnits="userSpaceOnUse"><rect width={unit} height={unit * 0.3} className={s.scanLine} /></pattern>
          <filter id={`n${fid}`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /><feComposite in2="SourceAlpha" operator="in" /></filter>
        </>}
      </defs>
      <g filter={`url(#h${fid})`}>
        {NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} style={{ fill: gray(0.04) }} />))}
        {heads.map((k) => (
          <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#g${fid}${k})`} />)}</g>
        ))}
      </g>
      {thermal.style === 'scan' && (
        <g className={s.scan}>
          {Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} fill={`url(#s${fid})`} />))}
          <g filter={`url(#n${fid})`} className={s.grain}>{Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
        </g>
      )}
      {focus && v[focus] && <g className={s.thermalFocus}>{(v[focus].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>}
      {/* 轮廓画在上面的光层里；这里留一份不上色的，只为量包围盒（头部只有轮廓，没有肌肉路径，不量它头会被裁掉） */}
      <g className={s.measureOnly}>{(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>
    </svg>
    {vb && <ThermalLight box={box} height={height} width={w} v={v} fid={fid} noBeam={!!fx} />}
    {vb && fx && <ScanLines kind={fx} box={box} height={height} width={w} v={v} fid={fid} heat={(k) => heatOf(stats.get(k))} />}
    </span>
  );
}

/** 热像上面的「光」（2026-10-06 用户：黑色勾线让轮廓不清楚，改浅荧光并给好看的动效；热力图也要扫描线动效）：
 *  - 轮廓：浅荧光细线，挂载时从下往上描出（遮罩矩形从脚到头长出来）；
 *  - 游光：同一组轮廓的更亮一份，被一条横向光带遮着，光带每隔一阵从下往上扫过一次（像光沿着轮廓爬上去）；
 *  - 扫描光带：裁在人体剪影里的一条荧光带（带细扫描线），周期性从下往上扫过热力图；
 *  整层 mix-blend-mode: screen（只提亮、不盖住热像）、不接触摸；减少动态效果时只留静止的轮廓。 */
function ThermalLight({ box, height, width, v, fid, noBeam }: { box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; noBeam?: boolean }) {
  const [x, y, bw, bh] = box, unit = bh / 100;
  const silhouette = Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />));
  const contour = (v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />);
  return (
    <svg className={`${s.light} ${s.lightHalf}`} viewBox={box.join(' ')} width={width} height={height} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs>
        <clipPath id={`c${fid}`}>{silhouette}</clipPath>
        <mask id={`r${fid}`} maskUnits="userSpaceOnUse" x={x} y={y} width={bw} height={bh}><rect className={s.reveal} x={x} y={y} width={bw} height={bh} fill="white" /></mask>
        <linearGradient id={`gb${fid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0" /><stop offset="0.5" stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={`m${fid}`} maskUnits="userSpaceOnUse" x={x} y={y} width={bw} height={bh}><rect className={s.glintBand} x={x} y={y} width={bw} height={bh * 0.22} fill={`url(#gb${fid})`} /></mask>
        {/* 扫描光带：往上走，所以最亮的一道边在顶上，往下渐淡；带里一排细扫描线（同样往下渐淡） */}
        <linearGradient id={`sb${fid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s.beamStop0} /><stop offset="0.04" className={s.beamStop2} /><stop offset="0.3" className={s.beamStop1} /><stop offset="1" className={s.beamStop0} />
        </linearGradient>
        <pattern id={`sl${fid}`} width={unit} height={unit * 0.8} patternUnits="userSpaceOnUse"><rect width={unit} height={unit * 0.25} className={s.beamLine} /></pattern>
        <mask id={`bm${fid}`} maskUnits="userSpaceOnUse" x={x} y={y} width={bw} height={bh * 0.14}><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sb${fid})`} /></mask>
      </defs>
      <g mask={`url(#r${fid})`}>
        <g className={s.contourLime}>{contour}</g>
        <g className={s.glint} mask={`url(#m${fid})`}>{contour}</g>
      </g>
      {!noBeam && <g clipPath={`url(#c${fid})`} className={s.beamWrap}>
        <g className={s.beam}><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sb${fid})`} /><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sl${fid})`} mask={`url(#bm${fid})`} /></g>
      </g>}
    </svg>
  );
}

/** 扫描线逐层动效（方案见上面 ScanFxKind）：扫描线一行一个矩形（约 110 行，间距 0.9% 人体高），裁在人体剪影里；
 *  每行的动画一样、只差起始时间（从脚往头按行错开），所以看起来是一层层推上去的；只动 opacity。
 *  raster 用 multiply（暗栅盖在热力上，打开才露出来），其余用 screen（只提亮）；iso 不按行、按肌肉热度排先后。 */
function ScanLines({ kind, box, height, width, v, fid, heat }: { kind: ScanFxKind; box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; heat: (k: string) => number }) {
  const [x, y, bw, bh] = box, unit = bh / 100, pitch = unit * 0.9, n = Math.floor(bh / pitch);
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const silhouette = Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />));
  const sweep = T['motion/slow'] * (kind === 'wave' ? 7 : 5);   // 从脚扫到头用多久
  if (kind === 'iso') {
    // 按热度从高到低排名，名次决定先后；没练过（热度 0）的不亮
    const rank = heads.map((k) => [k, heat(k)] as const).filter(([, h]) => h > 0.05).sort((a, b) => b[1] - a[1]);
    return (
      <svg className={`${s.fx} ${s.fxScreen} ${s.lightHalf}`} viewBox={box.join(' ')} width={width} height={height} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
        <defs><pattern id={`ip${fid}`} width={unit} height={pitch} patternUnits="userSpaceOnUse"><rect width={unit} height={unit * 0.3} className={s.fxLine} /></pattern></defs>
        {rank.map(([k], i) => (
          <g key={k} className={s.isoLayer} style={{ animationDelay: `${Math.round((i / Math.max(1, rank.length - 1)) * sweep)}ms` }}>
            {(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} fill={`url(#ip${fid})`} />)}
          </g>
        ))}
      </svg>
    );
  }
  const cls = { raster: s.rasterLine, slice: s.sliceLine, wave: s.waveLine }[kind];
  return (
    <svg className={`${s.fx} ${kind === 'raster' ? s.fxMul : s.fxScreen} ${s.lightHalf}`} viewBox={box.join(' ')} width={width} height={height} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs><clipPath id={`sc${fid}`}>{silhouette}</clipPath></defs>
      <g clipPath={`url(#sc${fid})`}>
        {Array.from({ length: n }, (_, i) => {
          const j = n - 1 - i;   // 从下往上数第几行
          const delay = kind === 'wave' ? (j % 24) * (sweep / 24) : (j / n) * sweep;
          return <rect key={i} className={cls} x={x} y={y + i * pitch} width={bw} height={kind === 'raster' ? pitch * 0.62 : unit * 0.3} style={{ animationDelay: `${Math.round(delay)}ms` }} />;
        })}
      </g>
    </svg>
  );
}
