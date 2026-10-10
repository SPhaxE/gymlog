/** 钢板打孔日历（记录页顶部；2026-10-06 第 7 轮按用户反馈重做）。
 *  一块深色冲压钢板（中性冷灰，不再偏荧光绿）：练过的日子是冲出来的孔，没练的日子只有一个很淡的样冲点；今天刻一圈细环。
 *  光（用户：背后光效要固定，要看得到光线透过孔产生的光束——丁达尔效应）：
 *  - 光源固定在屏幕上（左上方、屏幕外），不跟着板走；板后的「灯箱」是一张画布：以光源为心的荧光渐变，离光越近的孔越亮；
 *  - 每个孔向光源的反方向射出一束体积光（锥形、由亮到无，叠加发光），板前另一张画布画；光束里有几粒浮尘慢慢飘（只在光束里看得见）；
 *  - 页面滚动时板相对光源移动，孔的亮暗和光束的角度跟着真实变化（滚动时每帧重画一次，停下就不画）；减少动态效果时浮尘不动。
 *  交互（M04 磁吸游标 + 码表）：在板上按住横向拖，游标吸到最近一个练过的日子，孔口一圈光晕呼吸、手机轻振、上方读数行按位滚到那天；
 *  点一下也能选；选中后读数行里的「查看」（或再点一次同一个孔、或回车）钻进那天的训练详情。整块板是一个手势区（命中远大于 48），
 *  读屏是一个滑块：左右键换日子、回车打开。
 *  一页只放一块（荧光只给这块板）；没练过任何一天时板后不点灯（没有孔，也就没有光）。
 *  2026-10-10 全局浅色（用户：「钢板透光等特效，浅色模式下就可以省去」）：板跟随所在主题（不再是局部深色岛）。浅色 = 纸上一块浅色拉丝铝板，
 *  孔里露出平涂的荧光底板（plate/hole）+ 孔壁一圈很淡的内阴影；不挂灯、不画光晕 / 光束 / 浮尘，也不跑任何循环。颜色全走 plate/* 语义色，深色值和原来逐像素相同。 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { T } from '../styles/tokens.gen';
import { useElementTheme } from '../styles/theme';
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

/* ---------- 颜色：全部来自 Token（高光 plate/hi、暗部 plate/lo，透明度一律 color-mix） ---------- */
const mix = (c: string, p: number) => `color-mix(in srgb, ${c} ${+p.toFixed(1)}%, transparent)`;
const hi = (p: number) => mix('var(--milo-color-plate-hi)', p);
/** 暗部再乘 --plate-lo-k（深色 = 1 不变；浅色 0.45：墨色阴影压淡，铝板不发脏） */
const lo = (p: number) => `color-mix(in srgb, var(--milo-color-plate-lo) calc(${+p.toFixed(1)}% * var(--plate-lo-k, 1)), transparent)`;
const STEEL_TOP = 'var(--milo-prim-gray-400)';
const STEEL_BOT = 'var(--milo-prim-gray-300)';
/** 走查 1：2026-10-09 用户选定 lamp（默认），steel / center 留在方案台对照。steel = 原来的中性冷灰钢板（光源只是算光束用的一个点，看不见）；
 *  lamp = 主题黑钢板 + 光源固定在屏幕左上、板后看得见它的光（板边漏出光晕，随滚动沿板边滑动，和光束角度一致）；
 *  center = 主题黑钢板 + 光源在板后正中、跟着板走（光晕从板四周漏出来，光束从中心往外放射，不再随滚动变角度）。
 *  两个新方案的休息日都是白色手绘圈（4 种笔触轮换），可以选中。 */
export type PlateLook = 'steel' | 'lamp' | 'center';
// 主题黑钢面 = plate/steel-*（深色值就是原来的 bg-raised-2 / bg-raised）；浅色下 steel 方案也走它（深色的 steel 仍是上面的冷灰）
const DARK_TOP = 'var(--milo-color-plate-steel-top)';
const DARK_BOT = 'var(--milo-color-plate-steel-bottom)';
const REST_INK = 'color-mix(in srgb, var(--milo-color-brand-mark) 34%, transparent)';   // 2026-10-09 用户：白圈太明显，压暗（浅色下是墨圈）
/** 手绘圈：4 种笔触（差别不大）——收尾多绕一点 / 留一个小口 / 绕两圈 / 斜一点的椭圆；按日期轮换，同一天永远同一种 */
function handCircle(cx: number, cy: number, rr: number, t: number) {
  const k = Math.floor(t / 864e5) % 4, q = rnd(Math.floor(t / 864e5));
  const [a0, sweep, r0, r1, ex, ey, rot] = [[-110, 385, 1, 1.04, 1, 1, 0], [200, 330, 1, 1, 1, 1, 0], [-60, 700, 0.94, 1.08, 1, 1, 0], [-140, 370, 1, 1.03, 1.08, 0.9, 24]][k];
  const pts: string[] = [], n = Math.ceil(sweep / 14), ph = q() * 6.28, rr2 = rr * (0.92 + q() * 0.1);
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = ((a0 + sweep * u) * Math.PI) / 180, rad = rr2 * (r0 + (r1 - r0) * u) * (1 + Math.sin(a * 3 + ph) * 0.035);
    const x = Math.cos(a) * rad * ex, y = Math.sin(a) * rad * ey, rc = (rot * Math.PI) / 180;
    pts.push(`${f2(cx + x * Math.cos(rc) - y * Math.sin(rc))} ${f2(cy + x * Math.sin(rc) + y * Math.cos(rc))}`);
  }
  return `M${pts.join('L')}`;
}
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
/** 颜色从钢板自己身上读语义色（方案台 / Playground 单格可以局部强制主题）；只有深色画灯光，这几个语义色的深色值就是原来的原色 */
function palette(el: Element) {
  const cs = getComputedStyle(el), v = (k: string) => toRgb(cs.getPropertyValue(k));
  return { hot: v('--milo-color-fx-glow-hot'), lime: v('--milo-color-accent-default'), deep: v('--milo-color-fx-glow-deep'), base: v('--milo-color-bg-base'), dust: v('--milo-color-plate-hi') };
}
/** 光源在屏幕上的位置（视口坐标，固定不动）：屏幕左上角附近。板在它右下方，光束朝右下打；页面往上滚，板升到光源上方，光束慢慢转成朝右、朝右上。
 *  frame：把哪块区域当「屏幕」（方案台、Playground 的迷你手机）；不给就是整个视口 */
const lightAt = (frame?: HTMLElement | null) => {
  const r = frame?.getBoundingClientRect() ?? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  return [r.left + r.width * 0.02, r.top + r.height * 0.04] as const;
};
const BEAM_SPILL = 0.35;  // 光束画布比板高出的比例（光束可以略微落到板下面）
const DUST = 34;

export interface PlateDay { t: number; title: string; value: string; unit: string; sub?: string; /** 休息日：没有训练可打开 */ rest?: boolean }

export function SteelPlate({ months, label = '近 3 个月训练', selected, onSelect, onOpen, day, dense, look = 'lamp', frame }: {
  months: DotMonth[]; label?: string;
  /** 选中的那天（startOfDay 毫秒）；给了 onSelect 才能拖 / 点 */ selected?: number | null; onSelect?: (t: number) => void;
  /** 打开那天的训练（读数行的「查看」、再点一次同一个孔、回车） */ onOpen?: (t: number) => void;
  /** 选中那天的读数（日期 · 部位 / 数值 · 单位 / 小字）；没有就不画读数行 */ day?: PlateDay | null;
  /** 静态展示（playground 矩阵）：不跑浮尘 */ dense?: boolean;
  /** 外观（走查 1 待选，见 PlateLook） */ look?: PlateLook;
  /** 光源参照的「屏幕」（方案台的迷你手机）；不给 = 视口 */ frame?: React.RefObject<HTMLElement | null>;
}) {
  const g = useMemo(() => plateLayout(months), [months]);
  const uid = useId().replace(/:/g, ''), u = (k: string) => `${uid}-${k}`, ref = (k: string) => `url(#${u(k)})`;
  const n = dotDays(months), lit = g.holes.length > 0, { r, pitch, h } = g;
  const dr = pitch * 0.12;  // 样冲点半径
  const fig = useRef<HTMLElement>(null), back = useRef<HTMLCanvasElement>(null), front = useRef<HTMLCanvasElement>(null), halo = useRef<HTMLElement>(null);
  const dark = look !== 'steel';
  // 浅色（所在主题，见 useElementTheme）：不点灯——没有灯、光晕、光束、浮尘，孔里是平涂荧光
  const light = useElementTheme(fig) === 'light';
  // lamp：灯画在「屏幕」那一层（不跟内容滚）——App 里是 Screen（<main>），方案台里是传进来的 frame；钢板只算它在哪、亮多少
  const lamp = useRef<HTMLElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => { if (look === 'lamp') setHost(frame?.current ?? fig.current?.closest('main') ?? null); }, [look, frame]);
  // 新外观里休息日也能选中（手绘圈）
  const pickable = useMemo(() => (dark ? [...g.holes, ...g.dimples] : g.holes), [g, dark]);
  const sel = selected != null ? pickable.find((p) => p.t === selected) ?? null : null;
  const [press, setPress] = useState(false);

  /* ---------- 画光：板后灯箱 + 板前光束 + 浮尘 ---------- */
  const draw = useRef<() => void>(() => {});
  useEffect(() => {
    if (!lit || light) return;
    const el = fig.current!, bc = back.current!, fc = front.current!;
    // 画不了（测试环境没有画布、或浏览器拒绝）就不点灯：钢板照样能看、能拖
    if (!bc.getContext('2d') || !fc.getContext('2d') || typeof ResizeObserver === 'undefined') return;
    const pal = palette(el), dpr = Math.min(2, window.devicePixelRatio || 1);
    const still = dense || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const beams = document.createElement('canvas'), dust = document.createElement('canvas');
    let W = 0, H = 0, raf = 0, last = 0, visible = true;
    const motes = Array.from({ length: DUST }, (_, i) => { const q = rnd(101 + i); return { x: q(), y: q() * (1 + BEAM_SPILL), s: 0.4 + q() * 0.9, v: 0.15 + q() * 0.35, ph: q() * 6.28 }; });
    const size = () => {
      W = el.clientWidth; H = el.clientHeight;
      for (const [c, hh] of [[bc, H], [fc, H * (1 + BEAM_SPILL)], [beams, H * (1 + BEAM_SPILL)], [dust, H * (1 + BEAM_SPILL)]] as const) { c.width = Math.round(W * dpr); c.height = Math.round(hh * dpr); }
      fc.style.top = `${el.offsetTop}px`; fc.style.height = `${H * (1 + BEAM_SPILL)}px`;  // 光束画布和板顶对齐（上面可能有读数行）
    };
    // 灯的亮度（lamp，2026-10-09 用户：钢板上移后「关灯」，要渐变、不能瞬间，并且和透光联动）：
    // 板的中线在灯下面 0.8 个板高以上 = 全亮；中线升到灯的高度 = 全灭；中间平滑过渡。实际亮度按 motion/slow 的时间常数追目标值（滚得再快也是慢慢暗下去）
    let on = 1, target = 1, tAnim = 0, rafOn = 0;
    const aim = () => {
      if (look !== 'lamp') return 1;
      const rect = el.getBoundingClientRect(), [, ly0] = lightAt(frame?.current), c = rect.top + rect.height / 2, u = Math.max(0, Math.min(1, (c - ly0) / (rect.height * 0.8)));
      return u * u * (3 - 2 * u);
    };
    const paintStatic = () => {
      const k = W / g.w, rect = el.getBoundingClientRect(), [lx0, ly0] = look === 'center' ? [rect.left + W * 0.5, rect.top + H * 0.42] : lightAt(frame?.current), lx = lx0 - rect.left, ly = ly0 - rect.top;
      if (lamp.current && host) {
        const hr = host.getBoundingClientRect();
        lamp.current.style.setProperty('--lx', `${(lx0 - hr.left).toFixed(1)}px`); lamp.current.style.setProperty('--ly', `${(ly0 - hr.top).toFixed(1)}px`); lamp.current.style.opacity = on.toFixed(3);
      }
      // 看得见的光源：板后的光晕跟着光源的位置走（lamp：屏幕上固定、滚动时沿板边滑；center：板后正中）
      if (halo.current) { const hr = halo.current.getBoundingClientRect(); halo.current.style.setProperty('--hx', `${(lx0 - hr.left).toFixed(1)}px`); halo.current.style.setProperty('--hy', `${(ly0 - hr.top).toFixed(1)}px`); }
      // 板后灯箱：以光源为心的荧光渐变（离光越近越亮，最远的孔也留一点底光，不是黑洞）
      const b = bc.getContext('2d')!; b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = tint(pal.base, 1); b.fillRect(0, 0, W, H);
      b.globalAlpha = on; b.fillStyle = tint(pal.deep, 1); b.fillRect(0, 0, W, H);   // 关灯时孔里只剩板后的暗
      // 渐变的半径按「光源到板最远角」算：近处的孔接近白热，远处的孔只剩暗绿底光
      const R = Math.hypot(W - lx, H - ly), gr = b.createRadialGradient(lx, ly, 0, lx, ly, R);
      // 灯箱底光压暗一些（孔里不是一块实心的绿）；每个孔再垫一团中心亮、边缘暗的光——透过来的光像一团雾，不是一块色片（用户 2026-10-06：不要那么实，要有泛光）
      gr.addColorStop(0, tint(pal.hot, 0.8)); gr.addColorStop(0.35, tint(pal.lime, 0.62)); gr.addColorStop(0.6, tint(pal.lime, 0.36)); gr.addColorStop(0.85, tint(pal.lime, 0.16)); gr.addColorStop(1, tint(pal.lime, 0.07));
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      const dmaxB = Math.hypot(W - lx, H - ly) * 1.05;
      for (const p of g.holes) {
        const x = p.x * k, y = p.y * k, rr = r * k, near = Math.max(0, 1 - Math.hypot(x - lx, y - ly) / dmaxB), I = 0.4 + 0.6 * near ** 1.3;
        // 孔里：中心偏向光源的一侧最亮，往孔边渐暗成深绿——像一团透过来的光，不是一块平涂的色片
        const hg = b.createRadialGradient(x - rr * 0.2, y - rr * 0.2, 0, x, y, rr * 1.05);
        hg.addColorStop(0, tint(pal.dust, 0.85 * I)); hg.addColorStop(0.4, tint(pal.hot, 0.75 * I)); hg.addColorStop(0.8, tint(pal.lime, 0.45)); hg.addColorStop(1, tint(pal.deep, 0.85));
        b.fillStyle = hg; b.fillRect(x - rr * 1.1, y - rr * 1.1, rr * 2.2, rr * 2.2);
      }
      b.globalAlpha = 1;
      // 板前光束：每个孔沿「离开光源」的方向射出一束锥形光，叠加发光（重叠处更亮）
      const c = beams.getContext('2d')!; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H * (1 + BEAM_SPILL));
      c.globalCompositeOperation = 'lighter'; c.filter = `blur(${(r * k * 0.6).toFixed(2)}px)`;  // 糊一点：光束和泛光是雾，不是硬边的形
      const dmax = Math.hypot(W - lx, H - ly) * 1.05;
      for (const p of g.holes) {
        const x = p.x * k, y = p.y * k, rr = r * k, dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
        const near = Math.max(0, 1 - d / dmax), pick = sel && sel.t === p.t ? 1.6 : 1, I = (0.3 + 0.7 * near ** 1.5) * pick * on;
        const len = pitch * k * (3.2 + 3 * near) * (pick > 1 ? 1.25 : 1), w0 = rr * 0.85, w1 = rr * (2.6 + 1.2 * near);
        const ex = x + ux * len, ey = y + uy * len, lg = c.createLinearGradient(x, y, ex, ey);
        lg.addColorStop(0, tint(pal.hot, 0.36 * I)); lg.addColorStop(0.3, tint(pal.lime, 0.14 * I)); lg.addColorStop(1, tint(pal.lime, 0));
        c.fillStyle = lg; c.beginPath();
        c.moveTo(x + nx * w0, y + ny * w0); c.lineTo(ex + nx * w1, ey + ny * w1); c.lineTo(ex - nx * w1, ey - ny * w1); c.lineTo(x - nx * w0, y - ny * w0); c.closePath(); c.fill();
        // 泛光：孔口往外漫出一大圈柔光，压在钢面上（离光越近越大越亮）
        const R2 = rr * (3.2 + 1.8 * near), bl = c.createRadialGradient(x, y, rr * 0.5, x, y, R2);
        bl.addColorStop(0, tint(pal.hot, 0.5 * I)); bl.addColorStop(0.3, tint(pal.lime, 0.2 * I)); bl.addColorStop(1, tint(pal.lime, 0));
        c.fillStyle = bl; c.fillRect(x - R2, y - R2, R2 * 2, R2 * 2);
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
    const tween = (now: number) => {
      rafOn = 0;
      const dt = tAnim ? now - tAnim : 16; tAnim = now;
      on += (target - on) * Math.min(1, dt / T['motion/slow']);
      if (Math.abs(target - on) < 0.004) on = target;
      redraw();
      if (on !== target) rafOn = requestAnimationFrame(tween); else tAnim = 0;
    };
    const onScroll = () => {
      target = aim();
      if (target !== on) { if (!rafOn) rafOn = requestAnimationFrame(tween); return; }
      if (!pending) pending = requestAnimationFrame(() => { pending = 0; redraw(); });
    };
    size(); on = target = aim(); redraw();
    const ro = new ResizeObserver(() => { size(); redraw(); }); ro.observe(el);
    const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !still && !raf) raf = requestAnimationFrame(loop); });
    io?.observe(el);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(pending); cancelAnimationFrame(rafOn); ro.disconnect(); io?.disconnect(); document.removeEventListener('scroll', onScroll, { capture: true }); window.removeEventListener('resize', onScroll); };
  }, [g, lit, dense, sel?.t, look, host, light]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- 手势：按住横向拖吸到最近的孔（M04），点一下选中，再点同一个孔打开 ---------- */
  const at = useCallback((clientX: number, clientY: number) => {
    const rc = fig.current!.getBoundingClientRect(), k = rc.width / g.w, x = (clientX - rc.left) / k, y = (clientY - rc.top) / k;
    let best: Pt | null = null, bd = Infinity;
    for (const p of pickable) { const d = (p.x - x) ** 2 + ((p.y - y) * 0.6) ** 2; if (d < bd) { bd = d; best = p; } }  // 竖向放宽：手指横着拖时上下略偏也吸得住
    return best;
  }, [g, pickable]);
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
    if (p && st.t0 === p.t && g.holes.some((h) => h.t === p.t)) onOpen(p.t);  // 点的是已经选中的那个孔：打开（休息日没有训练可开）
  };
  const key = (e: React.KeyboardEvent) => {
    if (!onSelect || !lit) return;
    const order = [...pickable].sort((a, b) => a.t - b.t), i = order.findIndex((p) => p.t === selected);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const j = Math.max(0, Math.min(order.length - 1, (i < 0 ? order.length - 1 : i) + (e.key === 'ArrowRight' ? 1 : -1))); pick(order[j]); }
    if (e.key === 'Enter' && selected != null && g.holes.some((h) => h.t === selected)) { e.preventDefault(); onOpen?.(selected); }
  };
  const live = !!onSelect && lit;

  return (
    <div className={cx(s.wrap, dark && s.dark, light && s.light)} data-plate data-holes={g.holes.length} data-look={look}>
      {look === 'center' && lit && !light && <i ref={halo} className={cx(s.halo, s.haloCenter)} aria-hidden="true" />}
      {look === 'lamp' && lit && host && !light && createPortal(<i ref={lamp} className={s.lamp} aria-hidden="true" />, host)}
      {day !== undefined && (
        <div className={s.readout} aria-live="polite">
          {day ? <>
            <div className={s.rdText}><b className="milo-text-body-strong">{day.title}</b>{day.sub && <span className="milo-text-caption">{day.sub}</span>}</div>
            <span className={s.rdVal}><Odometer value={day.value} size="m" /><i>{day.unit}</i></span>
            {onOpen && !day.rest && <button type="button" className={cx('milo-press milo-focus', s.rdGo)} onClick={() => onOpen(day.t)} aria-label={`查看${day.title}的训练`}><Icon name="chevron" small /></button>}
          </> : <span className="milo-text-caption">{lit ? '按住钢板横向拖，或点一个孔，看那天练了什么' : '练完第一次，这里会冲出第一个孔'}</span>}
        </div>
      )}
      <figure ref={fig} className={cx(s.plate, live && s.live, press && s.pressing)} role={live ? 'slider' : 'img'} tabIndex={live ? 0 : undefined}
        aria-label={`${label}：练了 ${n} 天`} aria-valuetext={live && day ? `${day.title}，${day.value} ${day.unit}` : undefined}
        aria-valuemin={live ? 0 : undefined} aria-valuemax={live ? Math.max(0, g.holes.length - 1) : undefined}
        aria-valuenow={live ? Math.max(0, [...g.holes].sort((a, b) => a.t - b.t).findIndex((p) => p.t === selected)) : undefined}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { gest.current = null; setPress(false); }} onKeyDown={key}>
        {/* 板后：深色是灯箱画布；浅色是一块平涂荧光底板（CSS 填 plate/hole，不画） */}
        {lit && (light ? <i className={s.back} aria-hidden="true" /> : <canvas ref={back} className={s.back} aria-hidden="true" />)}
        <svg className={s.svg} viewBox={`0 0 ${g.w} ${f2(h)}`} aria-hidden="true">
          <defs>
            <linearGradient id={u('steel')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: dark || light ? DARK_TOP : STEEL_TOP }} /><stop offset="1" style={{ stopColor: dark || light ? DARK_BOT : STEEL_BOT }} /></linearGradient>
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
              <path fillRule="evenodd" d={`${circ(0, 0, r)} ${circ(0.04 * r, 0.05 * r, 0.86 * r)}`} style={{ fill: lo(55) }} />
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
            {/* 浅色：不要暗污渍（只留亮的光泽斑），划痕 / 颗粒 / 暗角压淡（.tex / .vig）——铝板干净、不发脏不发灰 */}
            {BLOTS.map((b, i) => (!light || !b.dark) && <ellipse key={i} cx={b.cx} cy={f2(b.cy % h)} rx={b.rx} ry={b.ry} fill={ref(b.dark ? 'blotD' : 'blotL')} transform={`rotate(${b.rot} ${b.cx} ${f2(b.cy % h)})`} />)}
            <rect className={s.tex} width={g.w} height={f2(h)} fill={ref('scr1')} /><rect className={s.tex} width={g.w} height={f2(h)} fill={ref('scr2')} /><rect className={s.tex} width={g.w} height={f2(h)} fill={ref('grain')} />
            <rect className={s.vig} width={g.w} height={f2(h)} fill={ref('vig')} />
          </g>
          {/* 边框：一道槽（暗线）+ 槽里侧一道发丝亮边；外沿的亮边由 CSS 画（跟圆角走） */}
          <rect className={s.groove} x="7" y="7" width={g.w - 14} height={f2(h - 14)} rx="4" fill="none" style={{ stroke: lo(78) }} strokeWidth="2" />
          <rect x="8.4" y="8.4" width={g.w - 16.8} height={f2(h - 16.8)} rx="3.2" fill="none" style={{ stroke: hi(7) }} strokeWidth=".8" />
          {/* 月份：钢印字（骨白 80% + 右下一道暗影）。2026-10-06 用户：暗字压在灰钢上看不清——对比度约 7:1（骨白 80% 对钢面 gray-400），不再用暗字。
              浅色：墨字（plate/label）+ 右下一道纸白浮雕影 */}
          {g.labels.map((l) => <g key={l.text} fontSize="10.5" fontWeight="600" letterSpacing="1"><text x={f2(l.x + 0.7)} y={TOP - 8 + 0.7} style={{ fill: light ? hi(90) : lo(80) }}>{l.text}</text><text x={f2(l.x)} y={TOP - 8} style={{ fill: mix('var(--milo-color-plate-label)', light ? 100 : 80) }}>{l.text}</text></g>)}
          {g.holes.map((p) => <use key={p.t} href={`#${u('hole')}`} x={f2(p.x)} y={f2(p.y)} />)}
          {dark
            ? g.dimples.map((p) => <path key={p.t} d={handCircle(p.x, p.y, r * 0.92, p.t)} fill="none" style={{ stroke: REST_INK }} strokeWidth={0.75} strokeLinecap="round" strokeLinejoin="round" />)
            : g.dimples.map((p) => <use key={p.t} href={`#${u('dim')}`} x={f2(p.x)} y={f2(p.y)} />)}
          {g.ahead.map((p) => <circle key={p.t} cx={f2(p.x)} cy={f2(p.y)} r=".55" style={{ fill: light ? lo(22) : hi(9) }} />)}
          {g.today && <g transform={`translate(${f2(g.today.x)} ${f2(g.today.y)})`} fill="none"><circle r={f2(r * 1.42)} style={{ stroke: lo(62) }} strokeWidth="1" /><circle r={f2(r * 1.42 + 0.6)} style={{ stroke: hi(22) }} strokeWidth=".7" /></g>}
        </svg>
        {/* 选中的孔：一圈呼吸的光晕（M04 的「焦点光晕」），位置按板宽的百分比放 */}
        {sel && <i className={s.focus} style={{ left: `${(sel.x / g.w) * 100}%`, top: `${(sel.y / h) * 100}%`, width: `${((r * 3.2) / g.w) * 100}%` }} aria-hidden="true" />}
      </figure>
      {lit && !light && <canvas ref={front} className={s.beams} aria-hidden="true" />}
    </div>
  );
}
