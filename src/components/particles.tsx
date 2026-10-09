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

export function ParticleField({ kind, anchor = [1, 0], spread = 1, strength = 1, inward, className }: {
  kind: ParticleKind;
  /** 光源在容器里的位置（0–1），默认右上角 */ anchor?: [number, number];
  /** 影响范围（相对容器长边） */ spread?: number;
  /** 亮度与密度（训练中的页面给小一点） */ strength?: number;
  /** orbit：一圈圈轨道同时向内收缩，收到光源那一点（亮核），外面再补上新的一圈（2026-10-09 用户：增量页头用 P3 + 向内层层收缩到右上角的光点） */ inward?: boolean;
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
    // 颜色查表（2026-10-10 性能）：每个粒子每帧要两次颜色，原来每次都现拼十六进制串；先把 256 级颜色和 256 级透明度拼好，用的时候查表（字节本来就只有 256 级，画出来一样）
    const HEX = Array.from({ length: 256 }, (_, i) => ramp(cols, i / 255, 0).slice(0, 7));
    const ALPHA = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
    const q = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 255);
    const col = (t: number, a: number) => HEX[q(t)] + ALPHA[q(a)];
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
        c.globalCompositeOperation = 'destination-out'; c.fillStyle = col(1, kind === 'flow' ? 0.05 : 0.16); c.fillRect(0, 0, W, H);
      } else c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      // 光源处一层很淡的底光：粒子是主角，底光只让它们像是从同一个光里来的
      const g = c.createRadialGradient(ax, ay, 0, ax, ay, R * 0.75);
      g.addColorStop(0, col(0.3, 0.16 * strength)); g.addColorStop(0.5, col(0.7, 0.05 * strength)); g.addColorStop(1, col(1, 0));
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
            c.strokeStyle = col(f * 0.9 + p.k * 0.1, lifeA * Math.pow(1 - f, 1.3) * 0.75 * strength);
            c.lineWidth = p.size; c.beginPath(); c.moveTo(px, py); c.lineTo(p.x, p.y); c.stroke();
          }
          if (p.age > p.life || f > 1.05) spawn(p);
          continue;
        } else {
          // 环轨：第 k 圈半径 = R × (0.18 + 0.82 k)，角速度内快外慢，同一个方向转
          const kk = inward ? (((p.k - t * 0.0011) % 1) + 1) % 1 : p.k;   // 内收：每圈的半径一直变小，到了中心从最外圈重新出现
          const ring = (inward ? 0.02 : 0.12) + (inward ? 0.98 : 0.88) * kk, w = 0.004 / Math.sqrt(Math.max(0.05, ring)), wob = 1 + Math.sin(p.th * 5 + t * 0.02 + p.size) * 0.015;
          p.th += w; p.x = ax + Math.cos(p.th) * R * 0.85 * ring * wob; p.y = ay + Math.sin(p.th) * R * 0.85 * ring * wob;
        }
        const f = fall(p.x, p.y);
        if (p.age > p.life || f > 1.1) { const th = p.th; spawn(p); if (kind === 'orbit') { p.k = ringOf(); p.th = th; } continue; }
        const a = lifeA * Math.pow(Math.max(0, 1 - f), 1.4) * strength;
        if (a <= 0.01) continue;
        const r = p.size * (kind === 'dust' ? 1.2 - f * 0.5 : 1);
        c.fillStyle = col(f, a * 0.22); c.beginPath(); c.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2); c.fill();   // 光晕
        c.fillStyle = col(f * 0.6, a); c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();           // 亮核
      }
      if (kind === 'orbit' && inward) {
        // 光点：所有轨道收进去的那一点，亮核 + 一圈泛光（轻微呼吸）
        const br = 0.85 + Math.sin(t * 0.05) * 0.15, cr = R * 0.09;
        const core = c.createRadialGradient(ax, ay, 0, ax, ay, cr * 2.4);
        core.addColorStop(0, col(0, 0.2 * br * strength)); core.addColorStop(0.25, col(0.15, 0.1 * br * strength)); core.addColorStop(1, col(0.6, 0));   // 拖尾模式会层层叠加，每帧只补一点
        c.globalCompositeOperation = 'lighter'; c.fillStyle = core; c.beginPath(); c.arc(ax, ay, cr * 2.4, 0, Math.PI * 2); c.fill();
      }
      if (kind === 'orbit' && !inward && t % 6 === 0) {
        // 轨道本身（拖尾模式下隔几帧补一笔，亮度落在一个很淡的平衡点）：很淡的一圈圈（配重片的车削纹），只在光源附近看得出
        c.globalCompositeOperation = 'source-over'; c.lineWidth = dpr * 0.6;
        for (let k = 0; k <= 7; k++) { const rr = R * 0.85 * (0.12 + 0.88 * (k / 7)); c.strokeStyle = col(0.8, 0.12 * strength * (1 - k / 8)); c.beginPath(); c.arc(ax, ay, rr, 0, Math.PI * 2); c.stroke(); }
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
  }, [kind, anchor[0], anchor[1], spread, strength, inward]);   // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className={`${s.field} ${className ?? ''}`} aria-hidden="true" />;
}

/** 配重片光环（2026-10-09 走查 1 #10 #18 收尾，DESIGN §6）：环轨粒子一圈圈向内收到光点（ParticleField orbit inward）+ 统一的薄模糊、七成透明。
 *  取代所有静态的配重片同心纹：增量页头、曲线页页头、牛龄页小牛背后（光点在正中）、「我的」成长卡、会员卡 / 开通成功、商城推荐卡。
 *  铺满最近的定位祖先（祖先要 isolation: isolate，它画在内容后面）。 */
export function OrbitPlate({ anchor = [1, 0], spread = 0.75, strength = 0.8, className }: { anchor?: [number, number]; spread?: number; strength?: number; className?: string }) {
  return <ParticleField kind="orbit" inward anchor={anchor} spread={spread} strength={strength} className={`${s.orbit} ${className ?? ''}`} />;
}

/** 主角卡的颗粒渐变光（2026-10-09 用户：主角卡 P0 的形是对的，但清晰度太低、没有噪点粒子渐变的动态 → 方案台 H 组）。
 *  都保留 P0 的形（右上角一团荧光，往左下渐隐），区别在颗粒怎么动：
 *  - grain  高清动态颗粒：按设备像素画，每个像素的亮度随机抖（胶片颗粒），颗粒只在光里、约 12 帧刷新；
 *  - drift  颗粒流光：同样的颗粒，光团的中心沿一条小椭圆慢慢漂、半径慢慢呼吸，光是活的；
 *  - dither 点阵渐变：光由一颗颗 1 像素的亮点组成（越亮越密），点在慢慢闪烁换位；
 *  - pulse  脉搏泵动（2026-10-09 用户选定，主角卡默认）：「H1 和 H2 看起来一样，噪点变得太快」→ 颗粒固定不动，
 *           外面压一层模糊（由使用方的 CSS 给），光团按心跳的节奏泵：一大一小两下（扩张快、回落慢），然后歇一拍。
 *           颗粒是一张只生成一次的遮罩，光是一张径向渐变，每帧只是渐变 × 遮罩，比逐像素便宜得多，所以能跑 30 帧。
 *  减少动态效果时定格一帧；离开视野、页面隐藏时停。 */
export type GrainKind = 'grain' | 'drift' | 'dither' | 'pulse';
export function GrainGlow({ kind, anchor = [0.95, 0], size = 1, strength = 1, calm, className }: {
  kind: GrainKind; anchor?: [number, number];
  /** 光团半径（相对卡的对角线） */ size?: number; strength?: number;
  /** pulse：训练中更慢、更淡（走查 1 §5：粒子训练中也用，但更慢、更淡） */ calm?: boolean; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = cv?.getContext('2d') ?? null; } catch { ctx = null; }
    if (!cv || !ctx) return;
    const c = ctx, still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const [hot, lime, deep] = ['--milo-prim-lime-300', '--milo-prim-lime-500', '--milo-prim-lime-900'].map((n) => toTriple(hexVar(n)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (kind === 'pulse') return;
    let W = 0, H = 0, img: ImageData | null = null, noise = new Uint8Array(1), t = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = cv.width = Math.max(1, Math.round(r.width * dpr)); H = cv.height = Math.max(1, Math.round(r.height * dpr));
      img = c.createImageData(W, H);
      noise = new Uint8Array(W * H + 4099); for (let i = 0; i < noise.length; i++) noise[i] = (Math.random() * 256) | 0;
    };
    const draw = () => {
      if (!img) return;
      t += 1;
      const d = img.data, sec = t / 12;
      // 光团：P0 的形——右上角的椭圆光，半径约为对角线的 0.62 × size
      const wob = kind === 'drift' ? 1 : 0;
      const cx = (anchor[0] + wob * Math.sin(sec * 0.35) * 0.06) * W, cy = (anchor[1] + wob * Math.cos(sec * 0.27) * 0.08) * H;
      const R = Math.hypot(W, H) * 0.62 * size * (1 + wob * Math.sin(sec * 0.5) * 0.06), rx = R * 1.3, ry = R * 1.1;   // 和 P0 一样宽、往左下拖得长
      const off = (t * 977) % 4096;   // 每帧换一段噪声：颗粒在动
      for (let y = 0; y < H; y++) {
        const dy = (y - cy) / ry;
        for (let x = 0; x < W; x++) {
          const i = y * W + x, o = i * 4, dx = (x - cx) / rx, q = 1 - Math.sqrt(dx * dx + dy * dy);
          if (q <= 0) { d[o + 3] = 0; continue; }
          const I = Math.pow(q, 2.2), n = noise[i + off] / 255;   // 光的强度（越靠边衰减越快、没有硬边）× 颗粒
          // 颜色随强度连续过渡：暗绿 → 荧光 → 亮荧光（不分档，避免出现一圈圈色阶）
          const u = Math.min(1, I * 1.6), v = Math.max(0, I * 1.6 - 1) / 0.6, cA = u < 1 ? deep : lime, cB = u < 1 ? lime : hot, f = u < 1 ? u : Math.min(1, v);
          let a: number;
          if (kind === 'dither') { const on = n < Math.pow(I, 1.3) * 0.6; a = on ? Math.min(1, 0.3 + I * 0.8) : 0; }
          else a = I * 0.5 * (0.45 + n * 1.1);
          d[o] = cA[0] + (cB[0] - cA[0]) * f; d[o + 1] = cA[1] + (cB[1] - cA[1]) * f; d[o + 2] = cA[2] + (cB[2] - cA[2]) * f; d[o + 3] = Math.min(255, a * 255 * strength);
        }
      }
      c.putImageData(img, 0, 0);
    };
    resize(); draw();
    let raf = 0, last = 0, onScreen = true;
    const loop = (now: number) => { if (now - last > 83) { draw(); last = now; } raf = requestAnimationFrame(loop); };   // 约 12 帧：颗粒刷新，像胶片
    const run = () => { cancelAnimationFrame(raf); if (!still && onScreen && !document.hidden) raf = requestAnimationFrame(loop); };
    const ro = new ResizeObserver(() => { resize(); draw(); }); ro.observe(cv);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); }) : null;
    io?.observe(cv);
    document.addEventListener('visibilitychange', run);
    run();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io?.disconnect(); document.removeEventListener('visibilitychange', run); };
  }, [kind, anchor[0], anchor[1], size, strength, calm]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (kind === 'pulse') return <PulseGlow anchor={anchor} size={size} strength={strength * (calm ? 0.75 : 1)} period={calm ? 2.6 : 1.8} className={className} />;
  return <canvas ref={ref} className={`${s.field} ${className ?? ''}`} aria-hidden="true" />;
}

/** 心跳：一大一小两下（扩张快、回落慢），之后歇一拍。p 是一个周期里的位置（0–1），返回 0–1 */
export function heartbeat(p: number) {
  const beat = (at: number, rise: number, fall: number) => { const d = p - at; return Math.exp(-((d / (d < 0 ? rise : fall)) ** 2)); };
  return Math.min(1, beat(0.14, 0.035, 0.09) + 0.55 * beat(0.34, 0.035, 0.12));
}

/** pulse 的画法（2026-10-10 性能：小米 15 上训练时略卡，看下来是这张画布每秒重画 30 次整卡）：
 *  形和颗粒都不变，只是把「每帧重画」拆成两层、各画一次：
 *  - 光：一张椭圆径向渐变，按泵到最大那一刻画好（半径 ×1.06、亮度 ×1.4）；
 *  - 颗粒：固定的逐像素透明度，做成外层的 mask-image（遮罩不动，颗粒就不会跟着缩放）。
 *  心跳交给合成器：光那一层按 heartbeat() 采样出的关键帧动 transform（以光源为原点缩放）和 opacity——主线程每帧零开销、不重新栅格化。
 *  减少动态效果时停在歇拍；离开视野、切后台暂停动画。 */
function PulseGlow({ anchor, size, strength, period, className }: { anchor: [number, number]; size: number; strength: number; period: number; className?: string }) {
  const box = useRef<HTMLSpanElement>(null), ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const wrap = box.current, cv = ref.current;
    let c: CanvasRenderingContext2D | null = null;
    try { c = cv?.getContext('2d') ?? null; } catch { c = null; }
    if (!wrap || !cv || !c) return;
    const ctx = c, still = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const [hot, lime, deep] = ['--milo-prim-lime-300', '--milo-prim-lime-500', '--milo-prim-lime-900'].map((n) => toTriple(hexVar(n)));
    const dpr = Math.min(2, window.devicePixelRatio || 1), PEAK_R = 1.06, PEAK_A = 1.4;
    // 颜色随强度连续过渡：暗绿 → 荧光 → 亮荧光（同 H1）
    const color = (I: number, a: number) => {
      const u = Math.min(1, I * 1.6), v = Math.max(0, I * 1.6 - 1) / 0.6, A = u < 1 ? deep : lime, B = u < 1 ? lime : hot, f = u < 1 ? u : Math.min(1, v);
      const h = (x: number) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0');
      return '#' + [0, 1, 2].map((k) => h(A[k] + (B[k] - A[k]) * f)).join('') + h(Math.max(0, Math.min(1, a)) * 255);
    };
    const paint = () => {
      const r = wrap.getBoundingClientRect(), W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
      // 颗粒遮罩：每个像素一个固定的透明度（0.29–1），和 H1 的颗粒同一个分布
      const g = document.createElement('canvas'); g.width = W; g.height = H;
      const gc = g.getContext('2d');
      if (gc) {
        const img = gc.createImageData(W, H), d = img.data;
        for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = ((0.45 + Math.random() * 1.1) / 1.55) * 255; }
        gc.putImageData(img, 0, 0);
        const url = g.toDataURL();
        wrap.style.setProperty('mask-image', `url(${url})`); wrap.style.setProperty('-webkit-mask-image', `url(${url})`);
      }
      // 光：泵到最大那一刻（右上角的椭圆光，横 1.3R、竖 1.1R，强度 (1 − r)^2.2）
      cv.width = W; cv.height = H;
      const R = Math.hypot(W, H) * 0.62 * size * PEAK_R;
      ctx.setTransform(R * 1.3, 0, 0, R * 1.1, anchor[0] * W, anchor[1] * H);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      for (let k = 0; k <= 16; k++) { const rr = k / 16, I = Math.pow(1 - rr, 2.2); grad.addColorStop(rr, color(I, I * 0.775 * strength * PEAK_A)); }
      ctx.fillStyle = grad; ctx.fillRect(-1, -1, 2, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    paint();
    const at = (b: number) => ({ transform: `scale(${(1 + b * 0.06) / PEAK_R})`, opacity: (1 + b * 0.4) / PEAK_A });
    cv.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
    let anim: Animation | null = null;
    if (still || typeof cv.animate !== 'function') Object.assign(cv.style, at(0));
    else anim = cv.animate(Array.from({ length: 49 }, (_, i) => ({ offset: i / 48, ...at(heartbeat(i / 48)) })), { duration: period * 1000, iterations: Infinity });
    const sync = (seen: boolean) => { if (!anim) return; if (seen && !document.hidden) anim.play(); else anim.pause(); };
    let onScreen = true;
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(onScreen); }) : null;
    io?.observe(wrap);
    const vis = () => sync(onScreen);
    document.addEventListener('visibilitychange', vis);
    let w0 = wrap.clientWidth, h0 = wrap.clientHeight;   // 挂载时已画过，尺寸真的变了才重画
    const ro = new ResizeObserver(([e]) => { const { width, height } = e.contentRect; if (Math.abs(width - w0) > 1 || Math.abs(height - h0) > 1) { w0 = width; h0 = height; paint(); } });
    ro.observe(wrap);
    return () => { anim?.cancel(); io?.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [anchor[0], anchor[1], size, strength, period]);   // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={box} className={`${s.field} ${s.pulse} ${className ?? ''}`} aria-hidden="true"><canvas ref={ref} className={s.field} /></span>;
}
