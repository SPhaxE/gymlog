/** 半身人体（MuscleWiki 真实路径，public/bodymap，V1 原样）。分层同 V1：中性部位 → 肌肉组 → 轮廓层；腹股沟不着色。
 *  版式规则（DESIGN §4，同 V1 BodyProgressMap）：人体放在内容区里（左缘 = 页面边距），不越过组件最外层；
 *  按包围盒从左裁掉 ratio/figure-crop（露出约 58%），左缘再加 ratio/figure-fade 宽的渐隐，裁切读起来是有意的暗角，不是一刀切。
 *  量完锚点后通过 onAnchors 交给胶囊列画引线（坐标相对 relativeTo）。 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
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

export function BodyFigure({ gender, view, stats, focus, height, onAnchors, relativeTo }: {
  gender: 'male' | 'female'; view: 'front' | 'back'; stats: Map<string, HeadStat>; focus: string | null; height: number;
  onAnchors: (a: Anchors) => void; relativeTo: React.RefObject<HTMLElement | null>;
}) {
  const [data, setData] = useState<BodyMap | null>(null);
  const [vb, setVb] = useState<number[] | null>(null);
  const svg = useRef<SVGSVGElement>(null);
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
  const box = vb ?? (data.viewBox ?? '0 0 676.49 1203.49').split(' ').map(Number);
  const tier = (id: string) => {
    const h = stats.get(id);
    if (!h || !(h.sets7d > 0)) return s.tNone;
    return h.level === 'over' ? s.tOver : h.level === 'ok' ? s.tOk : s.tLow;
  };
  return (
    <svg ref={svg} className={vb ? s.figure : s.measuring} viewBox={box.join(' ')} height={height} width={(height * box[2]) / box[3]} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
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
