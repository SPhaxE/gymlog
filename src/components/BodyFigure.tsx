/** 人体（MuscleWiki 真实路径，public/bodymap，V1 原样）。分层同 V1：中性部位 → 肌肉组 → 轮廓层；腹股沟不着色。
 *  版式规则（DESIGN §4，同 V1 BodyProgressMap）：人体放在内容区里（左缘 = 页面边距），不越过组件最外层；
 *  半身：按包围盒从左裁掉 ratio/figure-crop（露出约 58%），左缘再加 ratio/figure-fade 宽的渐隐，裁切读起来是有意的暗角，不是一刀切。
 *  热成像上面再叠一层「光」（ThermalLight，混合模式 screen）：浅荧光轮廓从下往上描出、一道细光沿轮廓游走、扫描光带周期性从下往上扫过人体——
 *  动的东西都在这一层，下面带滤镜的热像层静止不重画。
 *  量完锚点后通过 onAnchors 交给胶囊列画引线（坐标相对 relativeTo）。 */
import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import { BodyRender, heatOf, rampTables, tables } from './thermal';
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
/** fit 时裁切量的范围：至少裁掉 25%（仍是半身），最多 70%（窄屏也露得出肩和手臂） */
const FIT_MIN = 0.25, FIT_MAX = 0.7;

/** 热力图扫描线的「逐层扫描」动效方案（2026-10-06 用户要几个方案看；当时在 /lab 里并排比较，选定后定为默认；现在的待选在 /preview 方案台）：
 *  band   扫描光带（第 7 轮的默认，2026-10-07 换下）：一条扫描光带周期性从脚扫到头；
 *  raster 逐行显影：扫描线先是一排暗栅，从脚到头一行行打开、露出底下的热力，停一会儿再从下往上一行行合上；
 *  slice  切片扫描：一条亮线一行一行往上跳（不是平滑滑动），走过的行留一段渐暗的余辉，像 CT 一层层切过去；
 *  wave   呼吸波：所有扫描线常亮很淡，一道亮度波逐行往上传，连续不断；
 *  iso    等温分层：按每块肌肉的热度分层——最热的肌肉里的扫描线先亮，接着次热的，一层层亮到最凉的，再一起暗下去。
 *  第二批（2026-10-07 用户：S 层再来四种呼应主题的，不局限扫描线）——见 ThemeFx：
 *  pump   泵感：练过的肌肉像练完充血一样「咚-咚」双拍胀亮，越热越亮，节拍是慢牛的静息心率；
 *  steam  蒸腾：练过的肌肉往上冒热气（细小光点上升、散开、消失），越热冒得越多越快；
 *  fiber  牛劲：沿肌肉的轮廓线跑一段段流光（像力量顺着肌纤维传过去），越热越亮越快；
 *  beam   奥赛台顶光：呼应记录页钢板的丁达尔光束——斜光慢慢摆过人体、光里有浮尘；跟着光摆的点光源在肌肉上打高光和阴影，强化形体；
 *  molten 熔流（2026-10-07 用户：金属渐变留在 F，流动效果放 S）：只有「流」这一层——一道道亮带一直往上流，
 *         穿过固定的 Turbulent Displace 扭曲场被搅弯，裁在练过的肌肉里、screen 叠在 F 层上；越热越亮、流得越快。配 F1 就是流动的熔融金属。 */
export type ScanFxKind = 'band' | 'raster' | 'slice' | 'wave' | 'iso' | 'pump' | 'steam' | 'fiber' | 'beam' | 'molten';
export const ScanFx = createContext<ScanFxKind | null>(null);

/** 描边方案（2026-10-06 用户：现在的描边太抢眼，要四个方案）：
 *  glow 描出游光（第 7 轮的默认，2026-10-07 换下）：浅荧光实线，挂载时从下往上描出 + 细光沿轮廓游走；
 *  hair 发丝：极细、很淡的静态浅荧光线，没有描出和游光；
 *  soft 柔光：不画清晰的线，只有轮廓位置一圈很淡的模糊光；
 *  dot  点线：细点虚线，淡；
 *  rim  只描外缘：人体内部的肌肉分界线不画，只在剪影最外圈有一道淡淡的内缘光。 */
export type ContourFxKind = 'glow' | 'hair' | 'soft' | 'dot' | 'rim';
export const ContourFx = createContext<ContourFxKind | null>(null);

/** 肌头内部容量的显示方案（2026-10-06 用户要四个，其中一个是 Metallic Gradient）：
 *  thermal  热成像（第 7 轮的默认，2026-10-07 换下）：逐肌径向渐变 + 扩散 + 渐变映射 + 扫描线与颗粒；
 *  metal    Metallic Gradient（按用户给的 AE 参考视频）：Gradient Ramp → Turbulent Displace + 模糊 → Colorama（暗 → 橄榄 → 荧光 → 骨白热）
 *           → 下缘白热亮边 + 细内缘高光 + 外发光 + 颗粒；静态。流动那一层在 S 层（ScanFxKind molten），两层叠起来就是流动的熔融金属；
 *  topo     等高线：热度量化成几档，只画档与档之间的细线（像地形图），档内很淡；
 *  halftone 半调点阵：同样大小的网格点，热度越高点越大（印刷网点）；
 *  liquid   液位：每块肌肉像一个容器，近 7 天组数 ÷ 最大可恢复量 = 液面高度，液面一道亮线。 */
export type FillFxKind = 'thermal' | 'metal' | 'topo' | 'halftone' | 'liquid';
export const FillFx = createContext<FillFxKind | null>(null);
/** 容量人体的默认三层（2026-10-07 用户在 /preview 方案台选定：O2 柔光 + F1 金属渐变 + S9 熔流）。
 *  三个 context 不给值（null）就用这里；原来的默认留成可选项：描边 glow（浅荧光描出 + 游光）、填充 thermal（热成像）、S 层 band（扫描光带）。 */
export const DEFAULT_LOOK = { contour: 'soft', fill: 'metal', scan: 'molten' } as const satisfies { contour: ContourFxKind; fill: FillFxKind; scan: ScanFxKind };

export function BodyFigure({ gender, view, stats, focus, height, width, fit, onAnchors, relativeTo, onPick }: {
  gender: 'male' | 'female'; view: 'front' | 'back'; stats: Map<string, HeadStat>; focus: string | null; height: number;
  /** 外框宽：变了要重量锚点（不参与绘制） */ width?: number;
  /** 可用宽度（2026-10-10 用户：左缘要贴页面边距、手要碰到胶囊）：给了就不用固定的 ratio/figure-crop，
   *  按「露出宽 = 可用宽」反算从左裁多少——左缘落在页面边距、右缘（手）落在胶囊列起点；裁切量夹在 [FIT_MIN, FIT_MAX] 里，保证还是半身 */ fit?: number;
  onAnchors: (a: Anchors) => void; relativeTo: React.RefObject<HTMLElement | null>;
  /** 轻点某块肌肉（只有带 data-head 的肌头可点；其余部分不接触摸，页面照常滚动） */
  onPick?: (id: string) => void;
}) {
  const [data, setData] = useState<BodyMap | null>(null);
  const [bb, setBb] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const thermal = useContext(BodyRender), fid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  useEffect(() => { let on = true; setBb(null); load(gender).then((d) => on && setData(d)); return () => { on = false; }; }, [gender, view]);

  // 第一次渲染整张图量包围盒，再从左裁：固定 ratio/figure-crop，或按可用宽度反算（fit）
  useLayoutEffect(() => {
    if (!data || bb || !svg.current) return;
    const b = svg.current.getBBox();
    setBb({ x: b.x, y: b.y, width: b.width, height: b.height });
  }, [data, bb]);
  const vb = useMemo(() => {
    if (!bb) return null;
    const pad = bb.height * 0.004, h = bb.height + pad * 2;
    const crop = fit ? Math.min(FIT_MAX, Math.max(FIT_MIN, 1 - ((fit / height) * h - pad) / bb.width)) : T['ratio/figure-crop'];
    const x0 = bb.x + bb.width * crop;
    return [x0, bb.y - pad, bb.x + bb.width - x0 + pad, h];
  }, [bb, fit, height]);

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
  }, [vb, height, width, stats, onAnchors, relativeTo]);

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
  // 三层视效：context 没给就用默认（DEFAULT_LOOK）；旧默认（glow / thermal / band）在下面的渲染里就是「不套方案」的那条路
  const scanK = useContext(ScanFx) ?? DEFAULT_LOOK.scan, contourK = useContext(ContourFx) ?? DEFAULT_LOOK.contour, fillK = useContext(FillFx) ?? DEFAULT_LOOK.fill;
  const fx = scanK === 'band' ? null : scanK, contourFx = contourK === 'glow' ? null : contourK, fill = fillK === 'thermal' ? null : fillK;
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
      {fill ? <FillLayer kind={fill} v={v} heads={heads} stats={stats} fid={fid} unit={unit} gray={gray} /> : (
      <g filter={`url(#h${fid})`}>
        {NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} style={{ fill: gray(0.04) }} />))}
        {heads.map((k) => (
          <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#g${fid}${k})`} />)}</g>
        ))}
      </g>)}
      {thermal.style === 'scan' && !fill && (
        <g className={s.scan}>
          {Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} fill={`url(#s${fid})`} />))}
          <g filter={`url(#n${fid})`} className={s.grain}>{Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
        </g>
      )}
      {focus && v[focus] && <g className={s.thermalFocus}>{(v[focus].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>}
      {/* 轮廓画在上面的光层里；这里留一份不上色的，只为量包围盒（头部只有轮廓，没有肌肉路径，不量它头会被裁掉） */}
      <g className={s.measureOnly}>{(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>
    </svg>
    {vb && <ThermalLight box={box} height={height} width={w} v={v} fid={fid} noBeam={!!fx} contour={contourFx} />}
    {vb && fx && <ScanLines kind={fx} box={box} height={height} width={w} v={v} fid={fid} heat={(k) => heatOf(stats.get(k))} />}
    </span>
  );
}

/** 热像上面的「光」（2026-10-06 用户：黑色勾线让轮廓不清楚，改浅荧光并给好看的动效；热力图也要扫描线动效）：
 *  - 轮廓：浅荧光细线，挂载时从下往上描出（遮罩矩形从脚到头长出来）；
 *  - 游光：同一组轮廓的更亮一份，被一条横向光带遮着，光带每隔一阵从下往上扫过一次（像光沿着轮廓爬上去）；
 *  - 扫描光带：裁在人体剪影里的一条荧光带（带细扫描线），周期性从下往上扫过热力图；
 *  整层 mix-blend-mode: screen（只提亮、不盖住热像）、不接触摸；减少动态效果时只留静止的轮廓。 */
function ThermalLight({ box, height, width, v, fid, noBeam, contour: kind }: { box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; noBeam?: boolean; contour?: Exclude<ContourFxKind, 'glow'> | null }) {
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
      {kind ? <ContourVariant kind={kind} contour={contour} silhouette={silhouette} fid={fid} unit={unit} /> : (
      <g mask={`url(#r${fid})`}>
        <g className={s.contourLime}>{contour}</g>
        <g className={s.glint} mask={`url(#m${fid})`}>{contour}</g>
      </g>)}
      {!noBeam && <g clipPath={`url(#c${fid})`} className={s.beamWrap}>
        <g className={s.beam}><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sb${fid})`} /><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sl${fid})`} mask={`url(#bm${fid})`} /></g>
      </g>}
    </svg>
  );
}

/** 扫描线逐层动效（方案见上面 ScanFxKind）：扫描线一行一个矩形（约 110 行，间距 0.9% 人体高），裁在人体剪影里；
 *  每行的动画一样、只差起始时间（从脚往头按行错开），所以看起来是一层层推上去的；只动 opacity。
 *  raster 用 multiply（暗栅盖在热力上，打开才露出来），其余用 screen（只提亮）；iso 不按行、按肌肉热度排先后。 */
function ScanLines({ kind, box, height, width, v, fid, heat }: { kind: Exclude<ScanFxKind, 'band'>; box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; heat: (k: string) => number }) {
  if (kind === 'pump' || kind === 'steam' || kind === 'fiber' || kind === 'beam' || kind === 'molten') return <ThemeFx kind={kind} box={box} height={height} width={width} v={v} fid={fid} heat={heat} />;
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

/** 可复现的伪随机（mulberry32）：同一个种子每次渲染出一样的粒子 */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

/** S 层第二批：呼应主题的四个动效（说明见 ScanFxKind）。只动 transform / opacity / stroke-dashoffset，减少动态效果时全静止 */
function ThemeFx({ kind, box, height, width, v, fid, heat }: { kind: 'pump' | 'steam' | 'fiber' | 'beam' | 'molten'; box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; heat: (k: string) => number }) {
  const [x, y, bw, bh] = box, unit = bh / 100, slow = T['motion/slow'];
  const gray = (t: number) => `color-mix(in srgb, white ${Math.round(t * 100)}%, black)`;
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const hot = heads.map((k) => [k, heat(k)] as const).filter(([, h]) => h > 0.12);
  const silhouette = Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />));
  // 蒸腾要知道每块肌肉的上沿在哪：先画一份看不见的量包围盒
  const meas = useRef<SVGGElement>(null);
  const [boxes, setBoxes] = useState<Record<string, [number, number, number, number]>>({});
  useLayoutEffect(() => {
    if (kind !== 'steam' || !meas.current) return;
    const out: Record<string, [number, number, number, number]> = {};
    meas.current.querySelectorAll<SVGGElement>('g[data-m]').forEach((g) => {
      try { const b = g.getBBox(); if (b.width) out[g.dataset.m!] = [b.x, b.y, b.width, b.height]; } catch { /* jsdom 没有 getBBox */ }
    });
    setBoxes(out);
  }, [kind, v]);
  // 熔流每帧都要重算整条滤镜（湍流 + 置换 + 模糊），而它流得很慢：SMIL 不让它自己跑，改成每秒约 15 次手动步进
  // （setCurrentTime），整页帧率不被拖累；滚出屏幕、页面切到后台时停步进（省电，手机上不白跑）
  const flowSvg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = flowSvg.current;
    if (kind !== 'molten' || !el || typeof el.pauseAnimations !== 'function') return;
    el.pauseAnimations();
    let seen = true, t = el.getCurrentTime(), last = performance.now();
    const step = T['motion/slow'] / 5;   // 70：约 14 帧 / 秒
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (seen && !document.hidden) { t += (now - last) / 1000; el.setCurrentTime(t); }
      last = now;
    }, step);
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([e]) => { seen = e.isIntersecting; }) : null;
    io?.observe(el);
    return () => { window.clearInterval(timer); io?.disconnect(); };
  }, [kind]);
  const svgProps = { className: `${s.fx} ${s.fxScreen} ${s.lightHalf}`, viewBox: box.join(' '), width, height, preserveAspectRatio: 'xMinYMin meet', 'aria-hidden': true } as const;

  if (kind === 'molten') {
    // 亮带 = spreadMethod reflect 的竖向渐变（暗 → 亮 → 暗），一直往上平移；扭曲场不动，亮带流过它就被搅成熔体的流纹。
    // 滤镜和渐变的属性 CSS 动不了，用 SMIL；减少动态效果时不挂动画（只剩静止的一层淡流纹）
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    return (
      // 单独一层（will-change）：熔流每步重算滤镜时，只重画它自己，不连带下面静止的金属层一起重新栅格化（2026-10-10 性能，容量页栅格耗时降到约 1/8）
      <svg {...svgProps} className={`${svgProps.className} ${s.ownLayer}`} ref={flowSvg} data-flow="molten">
        <defs>
          {hot.map(([k, h]) => (
            <linearGradient key={k} id={`mo${fid}${k}`} x1="0" y1="0" x2="0" y2="0.45" spreadMethod="reflect">
              <stop offset="0" style={{ stopColor: gray(0) }} /><stop offset="0.7" style={{ stopColor: gray(h * 0.25) }} /><stop offset="1" style={{ stopColor: gray(Math.min(1, h * 0.95)) }} />
              {!still && <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 -0.9" dur={`${Math.round(slow * (34 - h * 18))}ms`} repeatCount="indefinite" />}
            </linearGradient>
          ))}
          <filter id={`mo${fid}`} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={2} seed={5} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={unit * 7} xChannelSelector="R" yChannelSelector="G" result="disp">
              {!still && <animate attributeName="scale" values={`${unit * 5};${unit * 9};${unit * 5}`} dur={`${slow * 24}ms`} repeatCount="indefinite" />}
            </feDisplacementMap>
            <feGaussianBlur in="disp" stdDeviation={unit * 0.35} result="soft" />
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
            {/* 灰阶 → 荧光到骨白（只提亮，screen 叠上去不会压暗 F 层） */}
            <feColorMatrix in="inner" type="matrix" values="0.85 0 0 0 0  0 1 0 0 0  0.55 0 0 0 0  0 0 0 1 0" />
          </filter>
        </defs>
        <g filter={`url(#mo${fid})`}>
          {hot.map(([k]) => <g key={k}>{(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} fill={`url(#mo${fid}${k})`} />)}</g>)}
        </g>
      </svg>
    );
  }

  if (kind === 'pump') return (
    <svg {...svgProps}>
      <defs><filter id={`pp${fid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={unit * 0.8} /></filter></defs>
      {hot.map(([k, h]) => (
        <g key={k} className={s.pumpHead} style={{ '--h': h.toFixed(2), animationDuration: `${Math.round(slow * (6 - h * 2))}ms` } as React.CSSProperties} filter={`url(#pp${fid})`}>
          {(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} />)}
        </g>
      ))}
    </svg>
  );

  if (kind === 'fiber') return (
    <svg {...svgProps}>
      <defs><filter id={`fb${fid}`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={unit * 0.25} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <g filter={`url(#fb${fid})`}>
        {hot.map(([k, h], i) => (v[k].paths ?? []).map((p, j) => (
          <path key={k + j} d={p.d} pathLength={100} className={s.fiberRun} strokeWidth={unit * (0.22 + h * 0.3)}
            style={{ '--h': h.toFixed(2), animationDuration: `${Math.round(slow * (12 - h * 6))}ms`, animationDelay: `${-Math.round((i * 7 + j * 3) * slow / 5)}ms` } as React.CSSProperties} />
        )))}
      </g>
    </svg>
  );

  if (kind === 'steam') {
    const parts: ReactNode[] = [];
    hot.forEach(([k, h], i) => {
      const b = boxes[k]; if (!b) return;
      const r = rng(i * 97 + 13), n = Math.round(4 + h * 10);
      for (let j = 0; j < n; j++) {
        const px = b[0] + b[2] * (0.15 + r() * 0.7), py = b[1] + b[3] * (0.1 + r() * 0.4);
        const dur = slow * (9 - h * 4) * (0.8 + r() * 0.4);
        parts.push(<circle key={k + j} className={s.steamDot} cx={px} cy={py} r={unit * (0.3 + r() * 0.45)}
          style={{ '--rise': `${-(unit * (6 + r() * 6)).toFixed(1)}px`, '--drift': `${((r() - 0.5) * unit * 3).toFixed(1)}px`, '--h': h.toFixed(2), animationDuration: `${Math.round(dur)}ms`, animationDelay: `${-Math.round(r() * dur)}ms` } as React.CSSProperties} />);
      }
    });
    return (
      <svg {...svgProps}>
        <g ref={meas} className={s.measureOnly}>{hot.map(([k]) => <g key={k} data-m={k}>{(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} />)}</g>)}</g>
        <defs><filter id={`st${fid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={unit * 0.12} /></filter></defs>
        <g filter={`url(#st${fid})`}>{parts}</g>
      </svg>
    );
  }

  // beam：奥赛台顶光（2026-10-07 用户：光束要能在肌肉上打出高光和阴影，像站上奥赛台，强化形体）。
  // 斜光从左上打下来、整束左右慢慢摆，光里浮尘漂；同时把每块肌肉当成一个鼓起的枕头（白色肌肉 + 黑色缝 → 模糊 = 高度图），
  // 用一盏跟着光束摆的点光源做 SVG 光照：镜面高光走 screen 层（只提亮），漫反射的暗面走 multiply 层（只压暗），都裁在剪影里。
  const r = rng(7), dust = Array.from({ length: 34 }, (_, i) => {
    const dur = slow * (14 + r() * 10);
    return <circle key={i} className={s.beamDust} cx={x + bw * (0.1 + r() * 0.8)} cy={y + bh * (0.05 + r() * 0.9)} r={unit * (0.15 + r() * 0.3)}
      style={{ '--dx': `${((r() - 0.5) * unit * 5).toFixed(1)}px`, '--dy': `${((r() - 0.3) * unit * 5).toFixed(1)}px`, animationDuration: `${Math.round(dur)}ms`, animationDelay: `${-Math.round(r() * dur)}ms` } as React.CSSProperties} />;
  });
  const cone = `M${x + bw * 0.2} ${y - bh * 0.05} L${x + bw * 0.36} ${y - bh * 0.05} L${x + bw * 0.88} ${y + bh * 1.05} L${x + bw * 0.42} ${y + bh * 1.05} Z`;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 光源：人体左上方高处，和光束同周期左右摆（光束 CSS 摆 30 个 slow 来回，这里一来一回 60 个 slow）
  const lx = x + bw * 0.4, ly = y - bh * 0.12, lz = bh * 0.32, swing = bw * 0.3;
  const light = (
    <fePointLight x={lx} y={ly} z={lz}>
      {!still && <animate attributeName="x" values={`${lx + swing};${lx - swing};${lx + swing}`} dur={`${slow * 60}ms`} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />}
    </fePointLight>
  );
  // 高度图：黑底 + 白色肌肉，肌肉之间描一道黑缝，模糊后每块肌肉都是中间高、边上低
  const relief = (
    <>
      <rect x={x} y={y} width={bw} height={bh} className={s.reliefBase} />
      {Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} className={s.reliefMuscle} strokeWidth={unit * 0.4} />))}
    </>
  );
  const heightMap = <><feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0" /><feGaussianBlur in="h0" stdDeviation={unit * 0.9} result="h" /></>;
  return (
    <>
      <svg {...svgProps} className={`${s.fx} ${s.fxMul} ${s.lightHalf}`}>
        <defs>
          <clipPath id={`bsc${fid}`}>{silhouette}</clipPath>
          <filter id={`bd${fid}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {heightMap}
            <feDiffuseLighting in="h" surfaceScale={unit * 3} diffuseConstant={1.25} className={s.stageLight}>{light}</feDiffuseLighting>
            {/* 暗面压得更深一点（gamma），亮面接近白 = multiply 后不变 */}
            <feComponentTransfer><feFuncR type="gamma" exponent="1.35" amplitude="1.08" /><feFuncG type="gamma" exponent="1.35" amplitude="1.08" /><feFuncB type="gamma" exponent="1.35" amplitude="1.08" /></feComponentTransfer>
          </filter>
        </defs>
        <g clipPath={`url(#bsc${fid})`} className={s.stageShade}><g filter={`url(#bd${fid})`}>{relief}</g></g>
      </svg>
      <svg {...svgProps}>
        <defs>
          <linearGradient id={`bg${fid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className={s.beamStop0} /><stop offset="1" className={s.beamStop1} /></linearGradient>
          <filter id={`bf${fid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={unit * 2.4} /></filter>
          <clipPath id={`bc${fid}`}>{silhouette}</clipPath>
          <mask id={`bm${fid}`} maskUnits="userSpaceOnUse" x={x - bw} y={y - bh * 0.1} width={bw * 3} height={bh * 1.2}><g className={s.beamSway}><path d={cone} fill="white" filter={`url(#bf${fid})`} /></g></mask>
          <filter id={`bs${fid}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {heightMap}
            <feSpecularLighting in="h" surfaceScale={unit * 3} specularConstant={1.1} specularExponent={22} className={s.stageLight} result="spec">{light}</feSpecularLighting>
            {/* 镜面光的 alpha 就是亮度：只留高光本身，暗处全透明 */}
            <feComposite in="spec" in2="spec" operator="arithmetic" k1={0} k2={1} k3={0} k4={0} />
          </filter>
        </defs>
        <g className={s.beamSway}><path d={cone} fill={`url(#bg${fid})`} filter={`url(#bf${fid})`} /></g>
        <g clipPath={`url(#bc${fid})`} mask={`url(#bm${fid})`}><rect x={x} y={y} width={bw} height={bh} className={s.beamLit} /></g>
        <g clipPath={`url(#bc${fid})`} className={s.stageSpec}><g filter={`url(#bs${fid})`}>{relief}</g></g>
        <g mask={`url(#bm${fid})`}>{dust}</g>
      </svg>
    </>
  );
}

/** 描边的四个方案（ContourFxKind）：都是静态的，只换线的样子，不再描出 / 游光 */
function ContourVariant({ kind, contour, silhouette, fid, unit }: { kind: Exclude<ContourFxKind, 'glow'>; contour: ReactNode; silhouette: ReactNode; fid: string; unit: number }) {
  if (kind === 'hair') return <g className={s.cHair}>{contour}</g>;
  if (kind === 'dot') return <g className={s.cDot}>{contour}</g>;
  if (kind === 'soft') return (
    <>
      <defs><filter id={`cs${fid}`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={unit * 0.35} /></filter></defs>
      <g className={s.cSoft} filter={`url(#cs${fid})`}>{contour}</g>
    </>
  );
  // rim：剪影收缩一点再和原剪影相减，只剩最外一圈边，模糊成内缘光；内部肌肉分界线不画
  return (
    <>
      <defs>
        <filter id={`cr${fid}`} x="-5%" y="-5%" width="110%" height="110%">
          {/* 先膨胀再收缩（闭运算）把肌肉之间的缝合上，得到整个人的剪影；再收缩一圈和剪影相减，只剩最外一圈 */}
          <feMorphology in="SourceAlpha" operator="dilate" radius={unit * 0.6} result="grow" />
          <feMorphology in="grow" operator="erode" radius={unit * 0.6} result="solid" />
          <feMorphology in="solid" operator="erode" radius={unit * 0.35} result="in" />
          <feComposite in="solid" in2="in" operator="out" result="edge" />
          <feGaussianBlur in="edge" stdDeviation={unit * 0.35} result="soft" />
          <feFlood className={s.cRimFlood} result="c" />
          <feComposite in="c" in2="soft" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#cr${fid})`}>{silhouette}<g className={s.cRimFill}>{contour}</g></g>
    </>
  );
}

/** 肌头内部容量的四个方案（FillFxKind）。每块肌肉仍是 g[data-head]（锚点、轻点要用） */
function FillLayer({ kind, v, heads, stats, fid, unit, gray }: { kind: Exclude<FillFxKind, 'thermal'>; v: Record<string, Part>; heads: string[]; stats: Map<string, HeadStat>; fid: string; unit: number; gray: (t: number) => string }) {
  const neutral = NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} style={{ fill: gray(0.06) }} />));
  const H = (k: string) => heatOf(stats.get(k));
  if (kind === 'metal') {
    // 照用户给的 AE 参考（2026-10-07）：Gradient Ramp（每块肌肉自下而上的灰阶，热度越高越亮）→ Turbulent Displace（大尺度湍流扭曲）
    // + Fast Box Blur（强模糊，像熔化的流体）→ Colorama（暗 → 橄榄 → 荧光 → 浅荧光 → 骨白热）→ 形状边缘一圈亮的内缘光 + 外发光 + 一点颗粒
    const [r, g, b] = rampTables(['gray-50', 'lime-900', 'lime-700', 'lime-500', 'lime-300', 'gray-900']);
    return (
      <>
        <defs>
          {heads.map((k) => { const h = H(k); return (
            <linearGradient key={k} id={`mg${fid}${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: gray(h * 0.62) }} /><stop offset="0.55" style={{ stopColor: gray(Math.min(1, h * 0.9)) }} /><stop offset="1" style={{ stopColor: gray(Math.min(1, h * 1.12)) }} />
            </linearGradient>); })}
          <filter id={`mf${fid}`} colorInterpolationFilters="sRGB" x="-20%" y="-10%" width="140%" height="120%">
            {/* Turbulent Displace：只在形状内部把渐变搅成熔融的流动，形状本身的边不动（再裁回原形） */}
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={3} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={unit * 5} xChannelSelector="R" yChannelSelector="G" result="disp" />
            {/* Fast Box Blur：SVG 没有盒式模糊，用高斯模糊代替 */}
            <feGaussianBlur in="disp" stdDeviation={unit * 0.9} result="soft" />
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
            {/* Colorama：暗 → 橄榄 → 荧光 → 浅荧光 → 骨白热 */}
            <feComponentTransfer in="inner" result="col"><feFuncR type="table" tableValues={r} /><feFuncG type="table" tableValues={g} /><feFuncB type="table" tableValues={b} /></feComponentTransfer>
            {/* 底缘白热亮边：形状减去上移一点的自己 = 只剩下沿一道月牙；亮度跟着那里的颜色走（凉的肌肉不发亮） */}
            <feOffset in="SourceAlpha" dy={unit * -0.5} result="up" />
            <feComposite in="SourceAlpha" in2="up" operator="out" result="lip" />
            <feGaussianBlur in="lip" stdDeviation={unit * 0.12} result="lipS" />
            <feComposite in="col" in2="lipS" operator="in" result="rimBase" />
            <feComponentTransfer in="rimBase" result="rim"><feFuncR type="linear" slope="2.4" /><feFuncG type="linear" slope="2.4" /><feFuncB type="linear" slope="2.4" /></feComponentTransfer>
            {/* 整圈极细的内缘高光（参考里形状四周那道亮线） */}
            <feMorphology in="SourceAlpha" operator="erode" radius={unit * 0.18} result="er" />
            <feComposite in="SourceAlpha" in2="er" operator="out" result="edge" />
            <feComposite in="col" in2="edge" operator="in" result="edgeCol" />
            <feComponentTransfer in="edgeCol" result="edgeHi"><feFuncR type="linear" slope="1.5" /><feFuncG type="linear" slope="1.5" /><feFuncB type="linear" slope="1.5" /><feFuncA type="linear" slope="0.8" /></feComponentTransfer>
            {/* 外发光：大半径 + 小半径两层 */}
            <feGaussianBlur in="col" stdDeviation={unit * 3} result="glowL" />
            <feComponentTransfer in="glowL" result="glowLD"><feFuncA type="linear" slope="0.9" /></feComponentTransfer>
            <feGaussianBlur in="col" stdDeviation={unit * 0.9} result="glowS" />
            <feComponentTransfer in="glowS" result="glowSD"><feFuncA type="linear" slope="0.7" /></feComponentTransfer>
            {/* 颗粒（Noise） */}
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={11} result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.12 0 0 0 0" result="grainW" />
            <feComposite in="grainW" in2="inner" operator="in" result="grainIn" />
            <feMerge><feMergeNode in="glowLD" /><feMergeNode in="glowSD" /><feMergeNode in="col" /><feMergeNode in="grainIn" /><feMergeNode in="edgeHi" /><feMergeNode in="rim" /></feMerge>
          </filter>
        </defs>
        <g filter={`url(#mf${fid})`}>
          {neutral}
          {heads.map((k) => <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#mg${fid}${k})`} />)}</g>)}
        </g>
      </>
    );
  }
  if (kind === 'topo') {
    const [r, g, b] = rampTables(['gray-50', 'lime-900', 'lime-700', 'lime-500', 'lime-300']);
    return (
      <>
        <defs>
          {heads.map((k) => { const h = H(k); return (
            <radialGradient key={k} id={`tg${fid}${k}`} cx="0.5" cy="0.45" r="0.7"><stop offset="0" style={{ stopColor: gray(Math.min(1, h * 1.15)) }} /><stop offset="1" style={{ stopColor: gray(h * 0.1) }} /></radialGradient>); })}
          <filter id={`tf${fid}`} colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={unit * 1.2} result="soft" />
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
            <feComponentTransfer in="inner" result="bands"><feFuncR type="discrete" tableValues="0 0.12 0.25 0.38 0.5 0.62 0.75 0.88 1" /><feFuncG type="discrete" tableValues="0 0.12 0.25 0.38 0.5 0.62 0.75 0.88 1" /><feFuncB type="discrete" tableValues="0 0.12 0.25 0.38 0.5 0.62 0.75 0.88 1" /></feComponentTransfer>
            <feConvolveMatrix in="bands" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="edges" />
            <feComponentTransfer in="edges" result="lines"><feFuncR type="linear" slope="4" /><feFuncG type="linear" slope="4" /><feFuncB type="linear" slope="4" /></feComponentTransfer>
            <feComponentTransfer in="bands" result="dim"><feFuncR type="linear" slope="0.35" /><feFuncG type="linear" slope="0.35" /><feFuncB type="linear" slope="0.35" /></feComponentTransfer>
            <feComposite in="lines" in2="dim" operator="arithmetic" k2="1" k3="1" result="sum" />
            <feComponentTransfer in="sum"><feFuncR type="table" tableValues={r} /><feFuncG type="table" tableValues={g} /><feFuncB type="table" tableValues={b} /></feComponentTransfer>
          </filter>
        </defs>
        <g filter={`url(#tf${fid})`}>
          {neutral}
          {heads.map((k) => <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#tg${fid}${k})`} />)}</g>)}
        </g>
      </>
    );
  }
  if (kind === 'halftone') {
    const cell = unit * 1.5;
    return (
      <>
        <defs>{heads.map((k) => { const h = H(k), rr = cell * 0.5 * Math.sqrt(Math.max(0.04, h)); return (
          <pattern key={k} id={`hp${fid}${k}`} width={cell} height={cell} patternUnits="userSpaceOnUse"><rect width={cell} height={cell} className={s.htBase} /><circle cx={cell / 2} cy={cell / 2} r={rr} className={h > 0.05 ? s.htDot : s.htDotOff} /></pattern>); })}</defs>
        {neutral}
        {heads.map((k) => <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#hp${fid}${k})`} />)}</g>)}
      </>
    );
  }
  // liquid：每块肌肉自己的包围盒里，从下往上灌到 组数 ÷ 最大可恢复量
  return (
    <>
      <defs>{heads.map((k) => { const st = stats.get(k), lv = st && st.sets7d > 0 ? Math.min(1, st.sets7d / st.mrv) : 0; return (
        <linearGradient key={k} id={`lq${fid}${k}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" className={s.lqDeep} /><stop offset={Math.max(0, lv - 0.04)} className={s.lqFill} /><stop offset={lv} className={s.lqSurface} /><stop offset={Math.min(1, lv + 0.001)} className={s.lqEmpty} /><stop offset="1" className={s.lqEmpty} />
        </linearGradient>); })}</defs>
      {neutral}
      {heads.map((k) => <g key={k} data-head={k} className={s.lqHead}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#lq${fid}${k})`} />)}</g>)}
    </>
  );
}
