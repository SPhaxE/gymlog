/** 主题色流体粒子（2026-10-08 走查 1 #10 #18：「荧光点缀色块全改成流体粒子渐变，要有设计感」「右上角的同心环改成会动的、主题色渐变粒子」）。
 *  一种材质、三种方案（/preview 方案台并排，用户选定后替换主角卡右上角的荧光弥散、页头右上角的配重片同心纹）：
 *  - dust  漂浮光尘：光源角附近一团细小光点慢慢往上飘、明灭，离光源越近越亮越密；
 *  - flow  流场丝带：粒子顺着缓慢变化的流场走，留下拖尾，汇成丝缎一样的流纹；
 *  - orbit 环轨粒子：粒子沿一圈圈同心轨道转（内圈快、外圈慢），就是会动的配重片环。
 *  颜色只取主题色原色（荧光 300 → 500 → 700 → 900 的渐变，离光源越远越暗）；叠加混合（lighter），暗处几乎不见。
 *  画布按容器大小 × 设备像素比（最多 2）；约 30 帧；离开视野或页面隐藏时停；减少动态效果时只画一帧静止的。 */
import { useEffect, useRef } from 'react';
import s from './particles.module.css';

export type ParticleKind = 'dust' | 'flow' | 'orbit';

const hexVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim().slice(0, 7);
const toTriple = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0) as [number, number, number];
const STOPS = ['--milo-prim-lime-300', '--milo-prim-lime-500', '--milo-prim-lime-700', '--milo-prim-lime-900'];
/** 0（近光源、亮）→ 1（远、暗）在四个荧光原色之间插值 */
function ramp(cols: [number, number, number][], t: number, a: number) {
  const x = Math.max(0, Math.min(0.999, t)) * (cols.length - 1), i = Math.floor(x), f = x - i, p = cols[i], q = cols[i + 1];
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return '#' + [0, 1, 2].map((k) => h(p[k] + (q[k] - p[k]) * f)).join('') + h(Math.max(0, Math.min(1, a)) * 255);
}

type P = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; k: number; th: number };

export function ParticleField({ kind, anchor = [1, 0], spread = 1, strength = 1, className }: {
  kind: ParticleKind;
  /** 光源在容器里的位置（0–1），默认右上角 */ anchor?: [number, number];
  /** 影响范围（相对容器长边） */ spread?: number;
  /** 亮度与密度（训练中的页面给小一点） */ strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = cv?.getContext('2d') ?? null; } catch { ctx = null; }
    if (!cv || !ctx) return;
    const c = ctx;
    const cols = STOPS.map((n) => toTriple(hexVar(n)));
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, R = 1, ax = 0, ay = 0, ps: P[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    // 新粒子：离光源的距离按 √ 分布再压一下（近处更密）
    const spawn = (p?: P): P => {
      const d = R * Math.pow(Math.random(), kind === 'flow' ? 1.1 : 1.7), th = Math.random() * Math.PI * 2;   // 越靠光源越密：密度本身就是渐变
      const n = p ?? ({} as P);
      n.x = ax + Math.cos(th) * d; n.y = ay + Math.sin(th) * d; n.vx = 0; n.vy = 0; n.age = 0;
      n.life = kind === 'flow' ? rand(90, 220) : rand(120, 280); n.size = (kind === 'dust' ? rand(0.3, 1) : rand(0.35, 1.25)) * dpr; n.k = Math.random(); n.th = th;
      return n;
    };
    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.max(1, Math.round(r.width * dpr)); H = cv.height = Math.max(1, Math.round(r.height * dpr));
      R = Math.max(W, H) * 0.9 * spread; ax = anchor[0] * W; ay = anchor[1] * H;
      const area = (r.width * r.height) / 40000;   // 每 200 × 200 的面积
      const n = Math.round((kind === 'flow' ? 320 : kind === 'orbit' ? 300 : 420) * Math.min(3, Math.max(0.6, area)) * strength);
      ps = Array.from({ length: n }, () => { const p = spawn(); p.age = Math.random() * p.life; return p; });
      if (kind === 'orbit') ps.forEach((p) => { p.k = ringOf(); p.th = Math.random() * Math.PI * 2; });
    };
    // 环轨：8 道轨，按周长分配粒子（外圈长、分得多），轨道才连得成环
    const ringOf = () => { const u = Math.random(); return Math.min(7, Math.floor(Math.sqrt(u) * 8)) / 7; };
    const fall = (x: number, y: number) => Math.hypot(x - ax, y - ay) / R;   // 0 光源 → 1 边缘
    let t = 0;
    const step = () => {
      t += 1;
      if (kind !== 'dust') {
        // 拖尾：每帧把旧的擦淡一点（保持透明底）；流场拖得长，环轨拖成一小段彗尾
        c.globalCompositeOperation = 'destination-out'; c.fillStyle = ramp(cols, 1, kind === 'flow' ? 0.05 : 0.16); c.fillRect(0, 0, W, H);
      } else c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      // 光源处一层很淡的底光：粒子是主角，底光只让它们像是从同一个光里来的
      const g = c.createRadialGradient(ax, ay, 0, ax, ay, R * 0.75);
      g.addColorStop(0, ramp(cols, 0.3, 0.16 * strength)); g.addColorStop(0.5, ramp(cols, 0.7, 0.05 * strength)); g.addColorStop(1, ramp(cols, 1, 0));
      if (kind === 'dust') { c.fillStyle = g; c.fillRect(0, 0, W, H); }
      for (const p of ps) {
        p.age += 1;
        const lifeA = Math.sin(Math.min(1, p.age / p.life) * Math.PI);   // 渐亮 → 渐暗
        if (kind === 'dust') {
          p.vx += (Math.sin((p.y + t * 0.6) * 0.012 + p.k * 6) * 0.012 - p.vx * 0.02) * dpr;
          p.vy += (-0.006 - p.vy * 0.02) * dpr;
          p.x += p.vx; p.y += p.vy;
        } else if (kind === 'flow') {
          const sc = 0.004 / dpr, a = Math.sin(p.x * sc * 3 + t * 0.004) * 1.4 + Math.cos(p.y * sc * 4 - t * 0.003) * 1.4 + Math.sin((p.x + p.y) * sc + t * 0.002);
          const px = p.x, py = p.y;
          p.x += Math.cos(a) * 0.9 * dpr; p.y += Math.sin(a) * 0.9 * dpr;
          const f = fall(p.x, p.y);
          if (f < 1) {
            c.strokeStyle = ramp(cols, f * 0.9 + p.k * 0.1, lifeA * Math.pow(1 - f, 1.3) * 0.75 * strength);
            c.lineWidth = p.size; c.beginPath(); c.moveTo(px, py); c.lineTo(p.x, p.y); c.stroke();
          }
          if (p.age > p.life || f > 1.05) spawn(p);
          continue;
        } else {
          // 环轨：第 k 圈半径 = R × (0.18 + 0.82 k)，角速度内快外慢，同一个方向转
          const ring = 0.12 + 0.88 * p.k, w = 0.004 / Math.sqrt(ring), wob = 1 + Math.sin(p.th * 5 + t * 0.02 + p.size) * 0.015;
          p.th += w; p.x = ax + Math.cos(p.th) * R * 0.85 * ring * wob; p.y = ay + Math.sin(p.th) * R * 0.85 * ring * wob;
        }
        const f = fall(p.x, p.y);
        if (p.age > p.life || f > 1.1) { const th = p.th; spawn(p); if (kind === 'orbit') { p.k = ringOf(); p.th = th; } continue; }
        const a = lifeA * Math.pow(Math.max(0, 1 - f), 1.4) * strength;
        if (a <= 0.01) continue;
        const r = p.size * (kind === 'dust' ? 1.2 - f * 0.5 : 1);
        c.fillStyle = ramp(cols, f, a * 0.22); c.beginPath(); c.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2); c.fill();   // 光晕
        c.fillStyle = ramp(cols, f * 0.6, a); c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();           // 亮核
      }
      if (kind === 'orbit' && t % 6 === 0) {
        // 轨道本身（拖尾模式下隔几帧补一笔，亮度落在一个很淡的平衡点）：很淡的一圈圈（配重片的车削纹），只在光源附近看得出
        c.globalCompositeOperation = 'source-over'; c.lineWidth = dpr * 0.6;
        for (let k = 0; k <= 7; k++) { const rr = R * 0.85 * (0.12 + 0.88 * (k / 7)); c.strokeStyle = ramp(cols, 0.8, 0.12 * strength * (1 - k / 8)); c.beginPath(); c.arc(ax, ay, rr, 0, Math.PI * 2); c.stroke(); }
      }
    };
    resize();
    let raf = 0, last = 0, onScreen = true;
    const loop = (now: number) => { if (now - last > 33) { step(); last = now; } raf = requestAnimationFrame(loop); };
    const run = () => { cancelAnimationFrame(raf); if (!still && onScreen && !document.hidden) raf = requestAnimationFrame(loop); };
    // 静止版：先空跑一段，让流纹 / 光点分布开再定格
    for (let i = 0; i < (still ? 160 : 40); i++) step();
    const ro = new ResizeObserver(() => { resize(); for (let i = 0; i < 40; i++) step(); });
    ro.observe(cv);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); }) : null;
    io?.observe(cv);
    document.addEventListener('visibilitychange', run);
    run();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io?.disconnect(); document.removeEventListener('visibilitychange', run); };
  }, [kind, anchor[0], anchor[1], spread, strength]);   // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className={`${s.field} ${className ?? ''}`} aria-hidden="true" />;
}
