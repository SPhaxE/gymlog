/** 图标（2026-10-04 用户选定 I3）：2 号圆头线稿，故意留缺口，整体右倾（iconref2 的动态感）；颜色跟随 currentColor。
 *  默认 size/icon，small 为 size/icon-s。active：选中瞬间的加载态（iconmotionref1 的 Motion Trace）——
 *   每一笔画出来，已画出的那段沿笔画由暗到亮（尾部几乎透明、笔头实色圆头），画满后整枚提亮定格（导航选中、选项打勾时用）。
 *   方向（2026-10-06 用户）：横向为主的笔从左往右、竖向为主的从下往上，各笔按左下 → 右上依次起笔（iconTrace.ts）。
 *  装饰性，含义由文字或 aria-label 给出。
 *  PATHS 是旧的实心一套，只在 /preview 方案台对照（IconStyleCtx = 'current'）时用。 */
import { useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import { CUT, GEO, IconStyleCtx, SLANT } from './iconSets';
import { strokeWindow, tracePlan } from './iconTrace';
import s from './Icon.module.css';

const PATHS = {
  // 导航
  home: 'M4 11.2 12 4l8 7.2V20h-5.2v-5.4H9.2V20H4z',
  body: 'M12 2.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM6.4 9h11.2l-.6 2.2-3.2 1V16l1.6 6h-2.3L12 17.2 10.9 22H8.6l1.6-6v-3.8l-3.2-1z',
  gains: 'M3 18.5 9.2 12l3.6 3.6L19 9.3V13h2V6h-7v2h3.6l-4.8 4.8L9.2 9.2 1.6 17.1z',
  log: 'M5 3h14v18H5zm3 4v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z',
  me: 'M12 3.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zM4 20.5c.6-4 3.8-6.6 8-6.6s7.4 2.6 8 6.6z',
  // 操作
  close: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z',
  back: 'M14.6 5 16 6.4 10.4 12l5.6 5.6-1.4 1.4-7-7z',
  chevron: 'M9.4 5 8 6.4 13.6 12 8 17.6 9.4 19l7-7z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
  minus: 'M5 11h14v2H5z',
  check: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z',
  more: 'M6 10.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zm6 0a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zm6 0a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z',
  edit: 'M4 17.2V20h2.8L17 9.8 14.2 7zM15.6 5.6l2.8 2.8 1.4-1.4a1 1 0 0 0 0-1.4l-1.4-1.4a1 1 0 0 0-1.4 0z',
  trash: 'M9 3h6l1 1.5h4v2H4v-2h4zM6 8h12l-1 13H7z',
  timer: 'M9 1.5h6v2H9zM12 5a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3.5V13h2V8.5z',
  skip: 'M4 6v12l8.5-6zM12.5 6v12l8.5-6z',
  play: 'M8 5v14l11-7z',
  refresh: 'M12 4a8 8 0 0 1 6.9 4H16v2h6V4h-2v2.4A10 10 0 1 0 22 12h-2a8 8 0 1 1-8-8z',
  calendar: 'M7 2h2v2h6V2h2v2h3v17H4V4h3zM6 9v10h12V9z',
  // 状态
  info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm-1 7v7h2v-7zm0-4v2h2V6z',
  alert: 'M12 3 22.4 20.5H1.6zm-1 6v6h2V9zm0 7.5v2h2v-2z',
  up: 'M12 6l7 11H5z',
  down: 'M12 18 5 7h14z',
  flat: 'M5 8.5h14v2.5H5zm0 4.5h14v2.5H5z',
  star: 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8z',
} as const;
export type IconName = keyof typeof PATHS;
export const ICONS = Object.keys(PATHS) as IconName[];

const SEG = 18, TAIL = 0.06; // 每一笔切成的渐变段数；尾部最暗处的不透明度（参考图是 Black 0% → White 100%）
const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2); // 两头慢、中间快：起笔和收笔都看得清

/** 逐帧改每段的虚线和不透明度：段 i 盖住已画部分的第 i/SEG 段（再向前多盖一段防缝），越靠笔头越亮；画满后渐到全实。
 *  每一笔有自己的起止窗口（data-k = 第几个起笔，data-n = 共几笔）：左下的先画，右上的后画 */
function runTrace(g: SVGGElement, done: () => void) {
  const segs = Array.from(g.querySelectorAll<SVGPathElement>('path'));
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { done(); return () => {}; }
  const draw = T['motion/slow'] * 2, settle = T['motion/base'], t0 = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = now - t0, p = Math.min(1, t / draw), u = Math.max(0, Math.min(1, (t - draw) / settle));
    for (const el of segs) {
      const [a, b] = strokeWindow(Number(el.dataset.k), Number(el.dataset.n));
      const h = easeInOut(Math.max(0, Math.min(1, (p - a) / (b - a))));
      const i = Number(el.dataset.i), o = TAIL + (1 - TAIL) * ((i + 1) / SEG) ** 1.6;
      el.style.strokeDasharray = `${(h / SEG) * (i < SEG - 1 ? 2 : 1)} 2`;
      el.style.strokeDashoffset = `${(-h * i) / SEG}`;
      el.style.opacity = h <= 0 ? '0' : String(o + (1 - o) * u);   // 还没起笔的笔不露圆头小点
    }
    if (u >= 1) done(); else raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function Icon({ name, small, className, active }: { name: IconName; small?: boolean; className?: string; active?: boolean }) {
  const style = useContext(IconStyleCtx), gid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const cls = className ?? (small ? s.small : s.icon);
  const strokes = useMemo(() => tracePlan(CUT[name]?.split(/(?=M)/) ?? []), [name]);
  const g = useRef<SVGGElement>(null), [drawn, setDrawn] = useState(false);
  const tracing = !!active && !drawn;
  useLayoutEffect(() => {
    if (!active) { setDrawn(false); return; }
    if (!g.current) return;
    return runTrace(g.current, () => setDrawn(true));
  }, [active, name]);
  if (style === 'geo' && GEO[name]) return <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d={GEO[name]} fillRule="evenodd" /></svg>;
  if ((style === 'cut' || style === 'trace' || style === 'slant') && CUT[name]) {
    const trace = style === 'trace', tf = style === 'slant' ? SLANT : undefined;
    const line = { d: CUT[name], strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, transform: tf };
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        {trace && <defs><linearGradient id={gid} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="currentColor" stopOpacity="0.15" /><stop offset="0.75" stopColor="currentColor" /></linearGradient></defs>}
        {tracing ? (
          /* 加载态（iconmotionref1）：每一笔从左往右 / 从下往上画，左下的笔先起；已画出的部分由暗到亮，只有最亮的笔头一段是圆头 */
          <g ref={g}>
            {strokes.map(({ d, order }, j) => Array.from({ length: SEG }, (_, i) => (
              <path key={`${j}-${i}`} data-i={i} data-k={order} data-n={strokes.length} {...line} d={d} stroke="currentColor" pathLength={1} strokeLinecap={i === SEG - 1 ? 'round' : 'butt'}
                style={{ strokeDasharray: '0 2', opacity: 0 }} />
            )))}
          </g>
        ) : <path {...line} stroke={trace ? `url(#${gid})` : 'currentColor'} />}
      </svg>
    );
  }
  return (
    <svg className={className ?? (small ? s.small : s.icon)} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fillRule="evenodd" />
    </svg>
  );
}
