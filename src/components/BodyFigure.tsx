/** 半身人体（MuscleWiki 真实路径，public/bodymap，V1 原样）。分层同 V1：中性部位 → 肌肉组 → 轮廓层；腹股沟不着色。
 *  版式规则（DESIGN §4，同 V1 BodyProgressMap）：人体放在内容区里（左缘 = 页面边距），不越过组件最外层；
 *  按包围盒从左裁掉 ratio/figure-crop（露出约 58%），左缘再加 ratio/figure-fade 宽的渐隐，裁切读起来是有意的暗角，不是一刀切。
 *  量完锚点后通过 onAnchors 交给胶囊列画引线（坐标相对 relativeTo）。 */
import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
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
  return (
    <svg ref={svgRef} className={`${vb ? s.thermal : s.measuring} ${pick ? s.pickable : ''}`} onClick={pick} viewBox={box.join(' ')} height={height} width={(height * box[2]) / box[3]} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
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
      <g className={s.thermalContour}>{(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>
    </svg>
  );
}
