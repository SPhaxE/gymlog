/** 钢板打孔日历（6c 记录页顶部；方案与取舍见 design/hifi/log/plate-plan.md，原型 proto/plate.tpl.html）。
 *  一块深色冲压钢板：练过的日子是冲出来的孔，板后面透出荧光；没练的日子只有一个很淡的样冲点；今天刻一圈细环。
 *  光影随页面滑动变化：板后一大团软光（静止时亮区在右，往下滑移到中间、左边）、板两侧的漏光、钢面一道很淡的反光——
 *  全是合成线程的 CSS 滚动驱动动画（transform / opacity），SVG 本身是静态的，没有每帧脚本；
 *  不支持滚动驱动动画的浏览器和「减少动态效果」下全部静态定在静止位置。
 *  用法：页头 → 钢板 → 周列表；整块板对读屏是一张图（「近 3 个月练了 N 天」），孔不单独点击（命中区 < 48，只展示）。
 *  一页只放一块（荧光只给这块板）；没练过任何一天时板后不点灯（没有孔，也就没有光）。 */
import { useId, useMemo } from 'react';
import { dotDays, type DotMonth } from './dataviz';
import { cx } from './state';
import s from './plate.module.css';

/* ---------- 几何（SVG 用户单位；viewBox 宽固定，实际宽度按容器等比缩放） ---------- */
const W = 328, PADX = 22, TOP = 30, BOT = 18, GAP = 0.7, RATIO = 0.36;
interface Pt { x: number; y: number; t: number }
export interface PlateGeom { w: number; h: number; pitch: number; r: number; holes: Pt[]; dimples: Pt[]; ahead: Pt[]; today: (Pt & { done: boolean }) | null; labels: { x: number; text: string }[] }

/** 把 dotMonths 排成钢板上的位置：每月一组列（月与月之间留一个窄缝），每列 7 行（周一在上）；不在本月的格子不画 */
export function plateLayout(months: DotMonth[]): PlateGeom {
  const cols = months.reduce((k, m) => k + m.weeks.length, 0), units = cols + GAP * (months.length - 1);
  const pitch = (W - PADX * 2) / units;
  const holes: Pt[] = [], dimples: Pt[] = [], ahead: Pt[] = [], labels: PlateGeom['labels'] = [];
  let today: PlateGeom['today'] = null, x = PADX + pitch / 2;
  for (const m of months) {
    labels.push({ x: x - pitch / 2 + 1, text: m.label });
    for (const col of m.weeks) {
      col.forEach((c, i) => {
        const p = { x, y: TOP + pitch / 2 + i * pitch, t: c.t };
        if (c.state === 'out') return;
        if (c.state === 'future') ahead.push(p);
        else { if (c.state === 'today') today = { ...p, done: c.done }; (c.done ? holes : dimples).push(p); }
      });
      x += pitch;
    }
    x += pitch * GAP;
  }
  return { w: W, h: TOP + 7 * pitch + BOT, pitch, r: pitch * RATIO, holes, dimples, ahead, today, labels };
}

/* ---------- 颜色：全部来自 Token（高光用骨白、暗部用近黑，透明度一律 color-mix） ---------- */
const mix = (c: string, p: number) => `color-mix(in srgb, ${c} ${+p.toFixed(1)}%, transparent)`;
const hi = (p: number) => mix('var(--milo-prim-gray-900)', p);
const lo = (p: number) => mix('var(--milo-prim-gray-0)', p);
const STEEL_TOP = 'color-mix(in srgb, var(--milo-prim-gray-400) 92%, var(--milo-prim-lime-900))';
const STEEL_BOT = 'color-mix(in srgb, var(--milo-prim-gray-300) 90%, var(--milo-prim-lime-900))';
const f2 = (n: number) => +n.toFixed(2);
const circ = (cx: number, cy: number, r: number) => `M${f2(cx - r)} ${f2(cy)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0Z`;

/* ---------- 糙钢板的划痕、颗粒、脏污：确定性的小随机（同一个种子永远同一块板），模块加载时算一次 ---------- */
const rnd = (seed: number) => { let n = seed >>> 0; return () => ((n = Math.imul(n ^ (n >>> 15), 2246822507) >>> 0, n = Math.imul(n ^ (n >>> 13), 3266489909) >>> 0, (n ^ (n >>> 16)) >>> 0) / 4294967296); };
const scratches = (seed: number, count: number, w: number, h: number) => { const r = rnd(seed); return Array.from({ length: count }, () => {
  const x = r() * w, y = r() * h, len = 4 + r() * 20, a = (r() - 0.5) * 0.5, light = r() < 0.75;
  return { d: `M${f2(x)} ${f2(y)}l${f2(Math.cos(a) * len)} ${f2(Math.sin(a) * len)}`, stroke: light ? hi(3 + r() * 6) : lo(24 + r() * 22), width: f2(0.3 + r() * 0.35) };
}); };
const SCR1 = scratches(3, 11, 120, 70), SCR2 = scratches(9, 6, 150, 90);
const GRAIN = (() => { const r = rnd(77); return Array.from({ length: 46 }, () => ({ cx: f2(r() * 37), cy: f2(r() * 29), r: f2(0.2 + r() * 0.25), fill: r() < 0.5 ? hi(7 + r() * 7) : lo(30 + r() * 25) })); })();
const BLOTS = (() => { const r = rnd(21); return Array.from({ length: 8 }, () => ({ cx: f2(r() * W), cy: f2(r() * 200), rx: f2(18 + r() * 46), ry: f2(8 + r() * 20), dark: r() < 0.55, rot: f2(r() * 60 - 30) })); })();

export function SteelPlate({ months, label = '近 3 个月训练' }: { months: DotMonth[]; label?: string }) {
  const g = useMemo(() => plateLayout(months), [months]);
  const uid = useId().replace(/:/g, ''), u = (k: string) => `${uid}-${k}`, ref = (k: string) => `url(#${u(k)})`;
  const n = dotDays(months), lit = g.holes.length > 0, { r, pitch, h } = g;
  const dr = pitch * 0.12;  // 样冲点半径
  return (
    <div className={s.wrap} data-plate data-holes={g.holes.length}>
      {lit && <><i className={cx(s.lamp, s.leak, s.leakL)} /><i className={cx(s.lamp, s.leak, s.leakR)} /></>}
      <figure className={s.plate} role="img" aria-label={`${label}：练了 ${n} 天`}>
        {lit && <><i className={cx(s.lamp, s.soft)} /><i className={cx(s.lamp, s.core)} /></>}
        <svg className={s.svg} viewBox={`0 0 ${g.w} ${f2(h)}`} aria-hidden="true">
          <defs>
            <linearGradient id={u('steel')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: STEEL_TOP }} /><stop offset="1" style={{ stopColor: STEEL_BOT }} /></linearGradient>
            <radialGradient id={u('vig')} cx=".5" cy=".5" r=".72"><stop offset=".5" style={{ stopColor: lo(0) }} /><stop offset="1" style={{ stopColor: lo(58) }} /></radialGradient>
            <radialGradient id={u('blotD')}><stop offset="0" style={{ stopColor: lo(22) }} /><stop offset="1" style={{ stopColor: lo(0) }} /></radialGradient>
            <radialGradient id={u('blotL')}><stop offset="0" style={{ stopColor: hi(5) }} /><stop offset="1" style={{ stopColor: hi(0) }} /></radialGradient>
            {/* 孔口：亮的只有冲切面右下一小段碎光；孔外一圈很浅的暗晕（凹痕） */}
            <linearGradient id={u('rim')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: hi(0) }} /><stop offset=".5" style={{ stopColor: hi(0) }} /><stop offset=".78" style={{ stopColor: hi(34) }} /><stop offset="1" style={{ stopColor: hi(66) }} /></linearGradient>
            <radialGradient id={u('dish')}><stop offset=".70" style={{ stopColor: lo(0) }} /><stop offset=".79" style={{ stopColor: lo(30) }} /><stop offset="1" style={{ stopColor: lo(0) }} /></radialGradient>
            <radialGradient id={u('dimple')}><stop offset="0" style={{ stopColor: lo(85) }} /><stop offset=".6" style={{ stopColor: lo(42) }} /><stop offset="1" style={{ stopColor: lo(0) }} /></radialGradient>
            <linearGradient id={u('dimpleHi')} x1="0" y1="0" x2="1" y2="1"><stop offset=".5" style={{ stopColor: hi(0) }} /><stop offset="1" style={{ stopColor: hi(48) }} /></linearGradient>
            <pattern id={u('scr1')} width="120" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(-3)">{SCR1.map((p, i) => <path key={i} d={p.d} fill="none" style={{ stroke: p.stroke }} strokeWidth={p.width} />)}</pattern>
            <pattern id={u('scr2')} width="150" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(33)">{SCR2.map((p, i) => <path key={i} d={p.d} fill="none" style={{ stroke: p.stroke }} strokeWidth={p.width} />)}</pattern>
            <pattern id={u('grain')} width="37" height="29" patternUnits="userSpaceOnUse">{GRAIN.map((p, i) => <circle key={i} cx={p.cx} cy={p.cy} r={p.r} style={{ fill: p.fill }} />)}</pattern>
            {/* 孔：暗壁（露出的亮窗向右下偏一点，左上的壁厚、右下的薄，孔有厚度）+ 右下的碎亮边 + 凹痕 */}
            <g id={u('hole')}>
              <path fillRule="evenodd" d={`${circ(0, 0, r)} ${circ(0.04 * r, 0.05 * r, 0.86 * r)}`} style={{ fill: lo(90) }} />
              <circle r={f2(r + 0.4)} fill="none" stroke={ref('rim')} strokeWidth={0.7} />
              <circle r={f2(r * 1.28)} fill={ref('dish')} />
            </g>
            <g id={u('dim')}><circle r={f2(dr)} fill={ref('dimple')} /><circle r={f2(dr + 0.25)} fill="none" stroke={ref('dimpleHi')} strokeWidth={0.6} /></g>
            <mask id={u('holes')} maskUnits="userSpaceOnUse" x="0" y="0" width={g.w} height={f2(h)}>
              <rect width={g.w} height={f2(h)} fill="white" />
              {g.holes.map((p) => <circle key={p.t} cx={f2(p.x)} cy={f2(p.y)} r={f2(r)} fill="black" />)}
            </mask>
          </defs>
          <g mask={ref('holes')}>
            <rect width={g.w} height={f2(h)} fill={ref('steel')} />
            {BLOTS.map((b, i) => <ellipse key={i} cx={b.cx} cy={f2(b.cy % h)} rx={b.rx} ry={b.ry} fill={ref(b.dark ? 'blotD' : 'blotL')} transform={`rotate(${b.rot} ${b.cx} ${f2(b.cy % h)})`} />)}
            <rect width={g.w} height={f2(h)} fill={ref('scr1')} /><rect width={g.w} height={f2(h)} fill={ref('scr2')} /><rect width={g.w} height={f2(h)} fill={ref('grain')} />
            <rect width={g.w} height={f2(h)} fill={ref('vig')} />
          </g>
          {/* 边框：一道槽（暗线）+ 槽里侧一道发丝亮边；外沿的亮边由 CSS 画（跟圆角走） */}
          <rect x="7" y="7" width={g.w - 14} height={f2(h - 14)} rx="4" fill="none" style={{ stroke: lo(78) }} strokeWidth="2" />
          <rect x="8.4" y="8.4" width={g.w - 16.8} height={f2(h - 16.8)} rx="3.2" fill="none" style={{ stroke: hi(7) }} strokeWidth=".8" />
          {/* 月份：蚀刻的小字（暗字 + 右下一道亮边） */}
          {g.labels.map((l) => <g key={l.text} fontSize="9.5" letterSpacing="1"><text x={f2(l.x + 0.6)} y={TOP - 9 + 0.6} style={{ fill: hi(20) }}>{l.text}</text><text x={f2(l.x)} y={TOP - 9} style={{ fill: lo(65) }}>{l.text}</text></g>)}
          {g.holes.map((p) => <use key={p.t} href={`#${u('hole')}`} x={f2(p.x)} y={f2(p.y)} />)}
          {g.dimples.map((p) => <use key={p.t} href={`#${u('dim')}`} x={f2(p.x)} y={f2(p.y)} />)}
          {g.ahead.map((p) => <circle key={p.t} cx={f2(p.x)} cy={f2(p.y)} r=".55" style={{ fill: hi(9) }} />)}
          {g.today && <g transform={`translate(${f2(g.today.x)} ${f2(g.today.y)})`} fill="none"><circle r={f2(r * 1.42)} style={{ stroke: lo(62) }} strokeWidth="1" /><circle r={f2(r * 1.42 + 0.6)} style={{ stroke: hi(22) }} strokeWidth=".7" /></g>}
        </svg>
        {lit && <i className={cx(s.lamp, s.sheen)} />}
      </figure>
    </div>
  );
}
