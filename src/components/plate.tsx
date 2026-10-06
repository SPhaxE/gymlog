/** 钢板打孔日历（记录页顶部；2026-10-06 第 7 轮按用户反馈重做）。
 *  一块深色冲压钢板（中性冷灰，不再偏荧光绿）：练过的日子是冲出来的孔，没练的日子只有一个很淡的样冲点；今天刻一圈细环。
 *  光（用户：背后光效要固定，要看得到光线透过孔产生的光束——丁达尔效应）：
 *  - 光源固定在屏幕上（左上方、屏幕外），不跟着板走；板后的「灯箱」是一张画布：以光源为心的荧光渐变，离光越近的孔越亮；
 *  - 每个孔向光源的反方向射出一束体积光（锥形、由亮到无，叠加发光），板前另一张画布画；光束里有几粒浮尘慢慢飘（只在光束里看得见）；
 *  - 页面滚动时板相对光源移动，孔的亮暗和光束的角度跟着真实变化（滚动时每帧重画一次，停下就不画）；减少动态效果时浮尘不动。
 *  交互（M04 磁吸游标 + 码表）：在板上按住横向拖，游标吸到最近一个练过的日子，孔口一圈光晕呼吸、手机轻振、上方读数行按位滚到那天；
 *  点一下也能选；选中后读数行里的「查看」（或再点一次同一个孔、或回车）钻进那天的训练详情。整块板是一个手势区（命中远大于 48），
 *  读屏是一个滑块：左右键换日子、回车打开。
 *  一页只放一块（荧光只给这块板）；没练过任何一天时板后不点灯（没有孔，也就没有光）。 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import { Icon } from './Icon';
import { dotDays, Odometer, type DotMonth } from './dataviz';
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
const STEEL_TOP = 'var(--milo-prim-gray-400)';
const STEEL_BOT = 'var(--milo-prim-gray-300)';
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

/* ---------- 光：画布用的颜色从 Token 读（CSS 变量 → rgb），不写死 ---------- */
type RGB = [number, number, number];
const toRgb = (hex: string): RGB => { const h = hex.trim().replace('#', '') || '0'; const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
/** 颜色 + 不透明度 → 8 位十六进制（画布认这个写法；数值全来自 Token） */
const tint = (c: RGB, a: number) => `#${[...c, Math.round(Math.max(0, Math.min(1, a)) * 255)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
function palette() {
  const cs = getComputedStyle(document.documentElement), v = (k: string) => toRgb(cs.getPropertyValue(k));
  return { hot: v('--milo-prim-lime-300'), lime: v('--milo-prim-lime-500'), deep: v('--milo-prim-lime-900'), base: v('--milo-color-bg-base'), dust: v('--milo-prim-gray-900') };
}
/** 光源在屏幕上的位置（视口坐标，固定不动）：屏幕左上角附近。板在它右下方，光束朝右下打；页面往上滚，板升到光源上方，光束慢慢转成朝右、朝右上 */
const lightAt = () => [window.innerWidth * 0.02, window.innerHeight * 0.04] as const;
const BEAM_SPILL = 0.35;  // 光束画布比板高出的比例（光束可以略微落到板下面）
const DUST = 34;

export interface PlateDay { t: number; title: string; value: string; unit: string; sub?: string }

export function SteelPlate({ months, label = '近 3 个月训练', selected, onSelect, onOpen, day, dense }: {
  months: DotMonth[]; label?: string;
  /** 选中的那天（startOfDay 毫秒）；给了 onSelect 才能拖 / 点 */ selected?: number | null; onSelect?: (t: number) => void;
  /** 打开那天的训练（读数行的「查看」、再点一次同一个孔、回车） */ onOpen?: (t: number) => void;
  /** 选中那天的读数（日期 · 部位 / 数值 · 单位 / 小字）；没有就不画读数行 */ day?: PlateDay | null;
  /** 静态展示（playground 矩阵）：不跑浮尘 */ dense?: boolean;
}) {
  const g = useMemo(() => plateLayout(months), [months]);
  const uid = useId().replace(/:/g, ''), u = (k: string) => `${uid}-${k}`, ref = (k: string) => `url(#${u(k)})`;
  const n = dotDays(months), lit = g.holes.length > 0, { r, pitch, h } = g;
  const dr = pitch * 0.12;  // 样冲点半径
  const fig = useRef<HTMLElement>(null), back = useRef<HTMLCanvasElement>(null), front = useRef<HTMLCanvasElement>(null);
  const sel = selected != null ? g.holes.find((p) => p.t === selected) ?? null : null;
  const [press, setPress] = useState(false);

  /* ---------- 画光：板后灯箱 + 板前光束 + 浮尘 ---------- */
  const draw = useRef<() => void>(() => {});
  useEffect(() => {
    if (!lit) return;
    const el = fig.current!, bc = back.current!, fc = front.current!;
    // 画不了（测试环境没有画布、或浏览器拒绝）就不点灯：钢板照样能看、能拖
    if (!bc.getContext('2d') || !fc.getContext('2d') || typeof ResizeObserver === 'undefined') return;
    const pal = palette(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const still = dense || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const beams = document.createElement('canvas'), dust = document.createElement('canvas');
    let W = 0, H = 0, raf = 0, last = 0, visible = true;
    const motes = Array.from({ length: DUST }, (_, i) => { const q = rnd(101 + i); return { x: q(), y: q() * (1 + BEAM_SPILL), s: 0.4 + q() * 0.9, v: 0.15 + q() * 0.35, ph: q() * 6.28 }; });
    const size = () => {
      W = el.clientWidth; H = el.clientHeight;
      for (const [c, hh] of [[bc, H], [fc, H * (1 + BEAM_SPILL)], [beams, H * (1 + BEAM_SPILL)], [dust, H * (1 + BEAM_SPILL)]] as const) { c.width = Math.round(W * dpr); c.height = Math.round(hh * dpr); }
      fc.style.top = `${el.offsetTop}px`; fc.style.height = `${H * (1 + BEAM_SPILL)}px`;  // 光束画布和板顶对齐（上面可能有读数行）
    };
    const paintStatic = () => {
      const k = W / g.w, rect = el.getBoundingClientRect(), [lx0, ly0] = lightAt(), lx = lx0 - rect.left, ly = ly0 - rect.top;
      // 板后灯箱：以光源为心的荧光渐变（离光越近越亮，最远的孔也留一点底光，不是黑洞）
      const b = bc.getContext('2d')!; b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = tint(pal.deep, 1); b.fillRect(0, 0, W, H);
      // 渐变的半径按「光源到板最远角」算：近处的孔接近白热，远处的孔只剩暗绿底光
      const R = Math.hypot(W - lx, H - ly), gr = b.createRadialGradient(lx, ly, 0, lx, ly, R);
      gr.addColorStop(0, tint(pal.dust, 1)); gr.addColorStop(0.32, tint(pal.hot, 1)); gr.addColorStop(0.55, tint(pal.lime, 0.7)); gr.addColorStop(0.8, tint(pal.lime, 0.28)); gr.addColorStop(1, tint(pal.lime, 0.1));
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      // 板前光束：每个孔沿「离开光源」的方向射出一束锥形光，叠加发光（重叠处更亮）
      const c = beams.getContext('2d')!; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H * (1 + BEAM_SPILL));
      c.globalCompositeOperation = 'lighter'; c.filter = `blur(${(r * k * 0.35).toFixed(2)}px)`;
      const dmax = Math.hypot(W - lx, H - ly) * 1.05;
      for (const p of g.holes) {
        const x = p.x * k, y = p.y * k, rr = r * k, dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
        const near = Math.max(0, 1 - d / dmax), on = sel && sel.t === p.t ? 1.7 : 1, I = (0.12 + 0.88 * near ** 1.8) * on;
        const len = pitch * k * (3.2 + 3 * near) * (on > 1 ? 1.25 : 1), w0 = rr * 0.85, w1 = rr * (2.6 + 1.2 * near);
        const ex = x + ux * len, ey = y + uy * len, lg = c.createLinearGradient(x, y, ex, ey);
        lg.addColorStop(0, tint(pal.hot, 0.46 * I)); lg.addColorStop(0.35, tint(pal.lime, 0.17 * I)); lg.addColorStop(1, tint(pal.lime, 0));
        c.fillStyle = lg; c.beginPath();
        c.moveTo(x + nx * w0, y + ny * w0); c.lineTo(ex + nx * w1, ey + ny * w1); c.lineTo(ex - nx * w1, ey - ny * w1); c.lineTo(x - nx * w0, y - ny * w0); c.closePath(); c.fill();
        const bl = c.createRadialGradient(x, y, rr * 0.6, x, y, rr * 2.4); bl.addColorStop(0, tint(pal.hot, 0.3 * I)); bl.addColorStop(1, tint(pal.lime, 0));
        c.fillStyle = bl; c.fillRect(x - rr * 2.4, y - rr * 2.4, rr * 4.8, rr * 4.8);
      }
      c.filter = 'none'; c.globalCompositeOperation = 'source-over';
    };
    const paintFront = (time: number) => {
      const f = fc.getContext('2d')!; f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fc.width, fc.height); f.drawImage(beams, 0, 0);
      // 浮尘：一粒粒画在一张单独的画布上，再只留下落在光束里的部分（destination-in），叠加到光束上
      const d = dust.getContext('2d')!; d.setTransform(dpr, 0, 0, dpr, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H * (1 + BEAM_SPILL));
      const tt = time / 1000;
      for (const m of motes) {
        const x = ((m.x + tt * m.v * 0.02) % 1) * W, y = ((m.y + tt * m.v * 0.012 + Math.sin(tt * 0.6 + m.ph) * 0.004) % (1 + BEAM_SPILL)) * H;
        d.fillStyle = tint(pal.dust, 0.75 + 0.25 * Math.sin(tt * 1.7 + m.ph)); d.beginPath(); d.arc(x, y, m.s, 0, 6.283); d.fill();
      }
      d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'destination-in'; d.drawImage(beams, 0, 0);
      f.globalCompositeOperation = 'lighter'; f.drawImage(dust, 0, 0); f.globalCompositeOperation = 'source-over';
    };
    const redraw = () => { paintStatic(); paintFront(performance.now()); };
    draw.current = redraw;
    const loop = (time: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (time - last > 33) { paintFront(time); last = time; }  // 浮尘约 30 帧
      raf = requestAnimationFrame(loop);
    };
    let pending = 0;
    const onScroll = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; redraw(); }); };
    size(); redraw();
    const ro = new ResizeObserver(() => { size(); redraw(); }); ro.observe(el);
    const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !still && !raf) raf = requestAnimationFrame(loop); });
    io?.observe(el);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(pending); ro.disconnect(); io?.disconnect(); document.removeEventListener('scroll', onScroll, { capture: true }); window.removeEventListener('resize', onScroll); };
  }, [g, lit, dense, sel?.t]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- 手势：按住横向拖吸到最近的孔（M04），点一下选中，再点同一个孔打开 ---------- */
  const at = useCallback((clientX: number, clientY: number) => {
    const rc = fig.current!.getBoundingClientRect(), k = rc.width / g.w, x = (clientX - rc.left) / k, y = (clientY - rc.top) / k;
    let best: Pt | null = null, bd = Infinity;
    for (const p of g.holes) { const d = (p.x - x) ** 2 + ((p.y - y) * 0.6) ** 2; if (d < bd) { bd = d; best = p; } }  // 竖向放宽：手指横着拖时上下略偏也吸得住
    return best;
  }, [g]);
  const gest = useRef<{ x: number; y: number; t0: number | null; moved: boolean } | null>(null);
  const pick = (p: Pt | null) => { if (p && p.t !== selected) { onSelect?.(p.t); navigator.vibrate?.(T['motion/press'] / 10); } };
  const down = (e: React.PointerEvent) => {
    if (!onSelect || !lit) return;
    gest.current = { x: e.clientX, y: e.clientY, t0: selected ?? null, moved: false }; setPress(true);
    pick(at(e.clientX, e.clientY));
  };
  const move = (e: React.PointerEvent) => {
    const st = gest.current; if (!st) return;
    if (Math.abs(e.clientX - st.x) > T['motion/drag-slop']) st.moved = true;
    if (st.moved) pick(at(e.clientX, e.clientY));
  };
  const up = (e: React.PointerEvent) => {
    const st = gest.current; gest.current = null; setPress(false);
    if (!st || st.moved || !onOpen) return;
    const p = at(e.clientX, e.clientY);
    if (p && st.t0 === p.t) onOpen(p.t);  // 点的是已经选中的那个孔：打开
  };
  const key = (e: React.KeyboardEvent) => {
    if (!onSelect || !lit) return;
    const order = [...g.holes].sort((a, b) => a.t - b.t), i = order.findIndex((p) => p.t === selected);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = Math.max(0, Math.min(order.length - 1, (i < 0 ? order.length - 1 : i) + (e.key === 'ArrowRight' ? 1 : -1))); pick(order[j]); }
    if (e.key === 'Enter' && selected != null) { e.preventDefault(); onOpen?.(selected); }
  };
  const live = !!onSelect && lit;

  return (
    <div className={s.wrap} data-plate data-holes={g.holes.length}>
      {day !== undefined && (
        <div className={s.readout} aria-live="polite">
          {day ? <>
            <div className={s.rdText}><b className="milo-text-body-strong">{day.title}</b>{day.sub && <span className="milo-text-caption">{day.sub}</span>}</div>
            <span className={s.rdVal}><Odometer value={day.value} size="m" /><i>{day.unit}</i></span>
            {onOpen && <button type="button" className={cx('milo-press milo-focus', s.rdGo)} onClick={() => onOpen(day.t)} aria-label={`查看${day.title}的训练`}><Icon name="chevron" small /></button>}
          </> : <span className="milo-text-caption">{lit ? '按住钢板横向拖，或点一个孔，看那天练了什么' : '练完第一次，这里会冲出第一个孔'}</span>}
        </div>
      )}
      <figure ref={fig} className={cx(s.plate, live && s.live, press && s.pressing)} role={live ? 'slider' : 'img'} tabIndex={live ? 0 : undefined}
        aria-label={`${label}：练了 ${n} 天`} aria-valuetext={live && day ? `${day.title}，${day.value} ${day.unit}` : undefined}
        aria-valuemin={live ? 0 : undefined} aria-valuemax={live ? Math.max(0, g.holes.length - 1) : undefined}
        aria-valuenow={live ? Math.max(0, [...g.holes].sort((a, b) => a.t - b.t).findIndex((p) => p.t === selected)) : undefined}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { gest.current = null; setPress(false); }} onKeyDown={key}>
        {lit && <canvas ref={back} className={s.back} aria-hidden="true" />}
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
        {/* 选中的孔：一圈呼吸的光晕（M04 的「焦点光晕」），位置按板宽的百分比放 */}
        {sel && <i className={s.focus} style={{ left: `${(sel.x / g.w) * 100}%`, top: `${(sel.y / h) * 100}%`, width: `${((r * 3.2) / g.w) * 100}%` }} aria-hidden="true" />}
      </figure>
      {lit && <canvas ref={front} className={s.beams} aria-hidden="true" />}
    </div>
  );
}
