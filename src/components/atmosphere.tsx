/** 氛围（2026-10-04 用户选定 A4 + 底层流体背景）：
 *  - 颗粒：canvas 生成一块中灰噪声贴图（只生成一次），挂到 :root 的 --grain，用 overlay 叠加——暗处几乎不见，只在有光处显出质感；
 *  - FluidBackdrop：Tab 根页最底层的流体噪点渐变。几团主题色光斑在低分辨率 canvas 上缓慢漂移，CSS 放大 + 模糊得到流体感，上面再叠颗粒。
 *    level()（0–1）可选：传入音频电平时光斑随之涨落（原 /lab 用麦克风演示过，2026-10-07 /lab 撤掉后没有页面用；系统音乐的限制见 docs/refs-elements.md）。
 *    页面隐藏时停；减少动态效果时只画一帧静止的。训练中的页面不用（DESIGN §7）。 */
import { useEffect, useRef } from 'react';
import s from './atmosphere.module.css';

let tile: string | null = null;
export function grainTile() {
  if (tile !== null || typeof document === 'undefined') return tile ?? '';
  const c = document.createElement('canvas'), n = 160;
  c.width = c.height = n;
  let ctx: CanvasRenderingContext2D | null = null;
  try { ctx = c.getContext('2d'); } catch { ctx = null; }
  if (!ctx) return (tile = '');
  const img = ctx.createImageData(n, n);
  // 中灰附近的细颗粒
  for (let i = 0; i < img.data.length; i += 4) { const v = 64 + Math.random() * 128; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return (tile = c.toDataURL());
}
/** 启动时调用一次：把颗粒贴图挂到 --grain，主角卡、底部面板、流体背景共用 */
export function installGrain() {
  const g = grainTile();
  if (g) document.documentElement.style.setProperty('--grain', `url(${g})`);
}

/** 取 Token 原色（--milo-prim-*）的 6 位十六进制，再按需要拼上透明度字节 */
const hexVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim().slice(0, 7);
const withAlpha = (hex: string, a: number) => hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

/** 光斑：位置在 0–1 的画布坐标里绕各自的中心做李萨如漂移 */
const BLOBS = [
  { c: '--milo-prim-lime-500', a: 0.09, x: 0.9, y: 0.08, r: 0.5, fx: 0.07, fy: 0.05, ax: 0.1, ay: 0.06 },
  { c: '--milo-prim-lime-900', a: 0.3, x: 0.1, y: 0.4, r: 0.55, fx: 0.045, fy: 0.06, ax: 0.12, ay: 0.1 },
  { c: '--milo-prim-bone-500', a: 0.05, x: 0.3, y: 0.98, r: 0.5, fx: 0.05, fy: 0.035, ax: 0.18, ay: 0.05 },
  { c: '--milo-prim-lime-700', a: 0.05, x: 0.75, y: 0.62, r: 0.38, fx: 0.06, fy: 0.08, ax: 0.1, ay: 0.12 },
];

export function FluidBackdrop({ level }: { level?: () => number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = cv?.getContext('2d') ?? null; } catch { ctx = null; }
    if (!cv || !ctx) return;
    const W = (cv.width = 48), H = (cv.height = 96);
    const cols = BLOBS.map((b) => hexVar(b.c));
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = 0, energy = 0;
    const draw = (t: number) => {
      const sec = t / 1000, lv = level?.() ?? 0;
      energy += (lv - energy) * 0.25; // 平滑，避免一跳一跳
      ctx!.clearRect(0, 0, W, H);
      ctx!.globalCompositeOperation = 'lighter';
      BLOBS.forEach((b, i) => {
        const x = (b.x + Math.sin(sec * b.fx * Math.PI * 2 + i) * b.ax) * W, y = (b.y + Math.cos(sec * b.fy * Math.PI * 2 + i * 1.7) * b.ay) * H;
        const r = b.r * (1 + energy * 0.35) * Math.max(W, H) * 0.55;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, withAlpha(cols[i], b.a * (1 + energy * 1.2)));
        g.addColorStop(1, withAlpha(cols[i], 0));
        ctx!.fillStyle = g; ctx!.fillRect(0, 0, W, H);
      });
    };
    const loop = (t: number) => {
      if (t - last > 33) { draw(t); last = t; } // 约 30 帧，够流体感、省电
      raf = requestAnimationFrame(loop);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && !still) raf = requestAnimationFrame(loop); };
    draw(performance.now());
    vis();
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
  }, [level]);
  return (
    <div className={s.fluid} aria-hidden="true">
      <canvas ref={ref} className={s.canvas} />
      <div className={s.grain} />
    </div>
  );
}
