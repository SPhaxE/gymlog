/** 图表（DESIGN §5）：Sparkline（P09 列表行的趋势小线）、TrendChart（P10 动作进步曲线）。
 *  时间一律按正序画（旧 → 新），组件内部再排一次（ia §1.9：V1 把倒序当正序，进步画成了退步）。
 *  PR 点同时用形状（菱形）区分，不只靠颜色。 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Odometer } from './dataviz';
import { T } from '../styles/tokens.gen';
import { cx } from './state';
import s from './charts.module.css';

export interface Point { t: number; v: number; pr?: boolean; label?: string }
const asc = (ps: Point[]) => [...ps].sort((a, b) => a.t - b.t);
const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');

function scale(ps: Point[], w: number, h: number, pad: number) {
  const vs = ps.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const t0 = ps[0].t, t1 = ps.at(-1)!.t, ts = t1 - t0 || 1;
  return (p: Point): [number, number] => [ps.length === 1 ? w / 2 : pad + ((p.t - t0) / ts) * (w - pad * 2), pad + (1 - (p.v - lo) / span) * (h - pad * 2)];
}
const diamond = (x: number, y: number, r: number) => `M${x},${y - r * 1.4} L${x + r * 1.4},${y} L${x},${y + r * 1.4} L${x - r * 1.4},${y} Z`;

export function Sparkline({ points, label }: { points: Point[]; label: string }) {
  const ps = asc(points), w = T['size/spark-w'], h = T['size/spark-h'], r = T['stroke/ring-progress'] / 2 + T['stroke/hairline'];
  if (ps.length < 2) return <svg className={s.spark} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}：只有 1 次记录`}><line className={s.base} x1={0} x2={w} y1={h / 2} y2={h / 2} /></svg>;
  const at = scale(ps, w, h, r * 1.6), last = at(ps.at(-1)!);
  return (
    <svg className={s.spark} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}：${fmt(ps[0].v)} → ${fmt(ps.at(-1)!.v)}`}>
      <polyline className={s.line} points={ps.map((p) => at(p).join(',')).join(' ')} />
      {ps.map((p, i) => p.pr && i < ps.length - 1 ? <path key={i} className={s.pr} d={diamond(...at(p), r * 0.8)} /> : null)}
      {ps.at(-1)!.pr ? <path className={s.pr} d={diamond(...last, r)} /> : <circle className={s.last} cx={last[0]} cy={last[1]} r={r} />}
    </svg>
  );
}

/** 平滑曲线（Catmull-Rom → 三次贝塞尔），ref2 / ref4 / ref5 都是圆滑的线；只用于两点以上 */
function smooth(xy: [number, number][]) {
  return xy.map(([x, y], k) => {
    if (!k) return `M${x},${y}`;
    const p0 = xy[k - 2] ?? xy[k - 1], p1 = xy[k - 1], p3 = xy[k + 1] ?? [x, y];
    return `C${p1[0] + (x - p0[0]) / 6},${p1[1] + (y - p0[1]) / 6} ${x - (p3[0] - p1[0]) / 6},${y - (p3[1] - p1[1]) / 6} ${x},${y}`;
  }).join(' ');
}

/** 动作进步曲线（P10；2026-10-04 用户选定 E5 + M04）：预估 1RM 对日期，时间按正序画。
 *  圆滑曲线 + 下方荧光渐隐面积；按住横向拖，竖向游标吸到最近一次训练（吸附时轻振），顶部读数按位滚动（Odometer）；
 *  选中点有一圈呼吸光晕。也可以点、或聚焦后用 ← → 逐次看。PR 点是菱形。少于 2 次不画线。 */
export function TrendChart({ points, selected, onSelect, unit = 'kg' }: { points: Point[]; selected?: number | null; onSelect?: (i: number) => void; unit?: string }) {
  const box = useRef<HTMLDivElement>(null), drag = useRef(false), gid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [w, setW] = useState(T['size/screen-w'] - T['size/gutter'] * 2);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => el.clientWidth && setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ps = asc(points), h = T['size/chart-h'], r = T['size/chart-dot'], pad = T['space/l'];
  if (!ps.length) return <div className={s.empty}>还没有这个动作的记录</div>;
  // 右侧留一条刻度标注栏（space/3xl），数据点不和标注重叠
  const gut = T['space/3xl'], at = scale(ps, w - gut, h, pad), xy = ps.map(at) as [number, number][];
  const vs = ps.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs);
  const grid = ps.length > 1 && hi > lo ? [hi, (hi + lo) / 2, lo] : [ps[0].v];
  const sel = selected != null && ps[selected] ? selected : null;
  const pick = (clientX: number, el: SVGSVGElement) => {
    if (!onSelect) return;
    const x = clientX - el.getBoundingClientRect().left;
    let best = 0;
    xy.forEach(([px], k) => { if (Math.abs(px - x) < Math.abs(xy[best][0] - x)) best = k; });
    if (best !== sel) { onSelect(best); navigator.vibrate?.(T['motion/press'] / 10); }
  };
  const key = (e: React.KeyboardEvent) => {
    if (!onSelect) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); onSelect(Math.min(ps.length - 1, (sel ?? -1) + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); onSelect(Math.max(0, (sel ?? ps.length) - 1)); }
  };
  const line = ps.length > 1 ? smooth(xy) : '';
  return (
    <div ref={box} className={s.chart}>
      <div className={s.readout} aria-live="polite">
        {sel != null ? <><Odometer value={fmt(ps[sel].v)} size="m" /><i>{unit}</i><span className="milo-text-caption">{ps[sel].label}{ps[sel].pr ? ' · PR' : ''}</span></>
          : <span className="milo-text-caption">{ps.length > 1 ? '按住横向拖，或点一个点查看当次' : '再练一次就能看到趋势'}</span>}
      </div>
      <svg className={cx('milo-focus', s.plot)} width={w} height={h} tabIndex={onSelect ? 0 : -1} onKeyDown={key} role="img"
        aria-label={`预估 1RM，共 ${ps.length} 次：${fmt(ps[0].v)} 到 ${fmt(ps.at(-1)!.v)} ${unit}`}
        onPointerDown={(e) => { if (!onSelect) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = true; pick(e.clientX, e.currentTarget); }}
        onPointerMove={(e) => drag.current && pick(e.clientX, e.currentTarget)} onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }}>
        <defs><linearGradient id={`a${gid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className={s.areaTop} /><stop offset="1" className={s.areaBottom} /></linearGradient></defs>
        {grid.map((v) => { const y = at({ t: ps[0].t, v })[1]; return <g key={v}><line className={s.grid} x1={0} x2={w - gut + T['space/xs']} y1={y} y2={y} /><text className={s.axis} x={w} y={y + T['space/xs']}>{fmt(v)}</text></g>; })}
        {line && <path d={`${line} L${xy.at(-1)![0]},${h} L${xy[0][0]},${h} Z`} fill={`url(#a${gid})`} />}
        {sel != null && <line className={s.rule} x1={xy[sel][0]} x2={xy[sel][0]} y1={0} y2={h} />}
        {line && <path className={s.trend} d={line} />}
        {ps.map((p, i) => p.pr ? <path key={i} className={cx(s.prDot, i === sel && s.on)} d={diamond(...xy[i], r)} /> : <circle key={i} className={cx(s.dot, i === sel && s.on)} cx={xy[i][0]} cy={xy[i][1]} r={r} />)}
        {sel != null && <circle className={s.halo} cx={xy[sel][0]} cy={xy[sel][1]} r={r * 3} />}
      </svg>
      <div className={cx('milo-text-micro', s.dates)}><span>{ps[0].label}</span>{ps.length > 1 && <span>{ps.at(-1)!.label}</span>}</div>
    </div>
  );
}
