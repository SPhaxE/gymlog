/** MuscleWiki 真实解剖路径（public/bodymap，V1 原样）的半身：按包围盒中线裁掉左半，切口贴容器左边缘。
 *  分层同 V1 BodyMap：中性部位 → 肌肉组 → 轮廓层；腹股沟不着色。量完锚点后通过 onAnchors 交给父组件画引线。 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { HeadStat } from '../engine';
import s from './explore.module.css';

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

export function HalfBody({ gender, view, stats, focus, height, onAnchors, relativeTo }: {
  gender: 'male' | 'female'; view: 'front' | 'back'; stats: Map<string, HeadStat>; focus: string | null; height: number;
  onAnchors: (a: Anchors) => void; relativeTo: React.RefObject<HTMLElement | null>;
}) {
  const [data, setData] = useState<BodyMap | null>(null);
  const [vb, setVb] = useState<number[] | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => { let on = true; setVb(null); load(gender).then((d) => on && setData(d)); return () => { on = false; }; }, [gender, view]);

  // 第一次渲染整张图，量出包围盒，再按中线裁成半身
  useLayoutEffect(() => {
    if (!data || vb || !svg.current) return;
    const bb = svg.current.getBBox(), cx = bb.x + bb.width / 2;
    setVb([cx, bb.y - 4, bb.x + bb.width - cx + 4, bb.height + 8]);
  }, [data, vb]);

  // 裁好后量每个肌头的锚点：可见半边里面积最大的一块的中心
  useLayoutEffect(() => {
    if (!vb || !svg.current || !relativeTo.current) return;
    const el = svg.current, ctm = el.getScreenCTM(), base = relativeTo.current.getBoundingClientRect(), cx = vb[0];
    if (!ctm) return;
    const out: Anchors = {};
    for (const g of el.querySelectorAll<SVGGElement>('g[data-head]')) {
      let best: { a: number; x: number; y: number } | null = null;
      for (const p of g.querySelectorAll('path')) {
        const b = p.getBBox(), l = Math.max(b.x, cx), r = b.x + b.width;
        if (r < cx + 6) continue;
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
  const full = (data.viewBox ?? '0 0 676.49 1203.49').split(' ').map(Number);
  const box = vb ?? full;
  const tier = (id: string) => {
    const h = stats.get(id);
    if (!h || !(h.sets7d > 0)) return s.tNone;
    return h.level === 'over' ? s.tOver : h.level === 'ok' ? s.tOk : s.tLow;
  };
  return (
    <svg ref={svg} className={s.figure} viewBox={box.join(' ')} height={height} width={(height * box[2]) / box[3]} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <g className={s.neutral}>{NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
      {Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body').map((k) => (
        <g key={k} data-head={k} className={`${tier(k)} ${k === focus ? s.tFocus : ''}`}>
          {(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}
        </g>
      ))}
      <g className={s.contour}>
        {(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} strokeWidth={p.strokeWidth || 3.49} />)}
        {(v.body?.lines ?? []).map((l, i) => <line key={i} {...l} strokeWidth={l.strokeWidth || 3.49} />)}
      </g>
    </svg>
  );
}
