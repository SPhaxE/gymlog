/** 底部导航（ia §1.12，v2）：5 项都是「图标 + 名称」，选中项骨白实心。
 *  外圈 = 今日进度：实线，从顶边正中顺时针；progress null 不画环（恢复日、动作池不足、空态），0 只画轨道，1 满环。
 *  休息：选中项的名称换成剩余时间，小胶囊里面一道内描边虚线 + 端点圆点（restRatio = 剩余 ÷ 总时长），与外圈靠线型和位置区分。 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import { Icon } from './Icon';
import { cx, forced, type Forced } from './state';
import s from './Nav.module.css';

export const TABS = [['home', '首页', '/today'], ['body', '身体', '/body'], ['gains', '增量', '/gains'], ['log', '记录', '/log'], ['me', '我的', '/me']] as const;
export type Tab = (typeof TABS)[number][0];

/** 圆角矩形路径，从顶边正中起顺时针（描边进度用 pathLength=1） */
export function pillPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(h / 2, w / 2), cx = x + w / 2;
  return `M${cx},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
}

/** onSelect：壳里接路由（不整页刷新）；不传时就是普通链接。itemState：在第一个未选中项上强制显示按下 / 聚焦（Playground 用）。
 *  选中项的骨白底是一块独立的滑块，切换时滑过去（motion/base）；减少动态效果时直接到位。 */
export function Nav({ selected, progress, rest, restRatio, onSelect, itemState, trace, compact }: {
  selected: Tab; progress: number | null; rest?: string; restRatio?: number; onSelect?: (tab: Tab, path: string) => void; itemState?: Forced;
  /** /lab 候选（iconmotionref1）：进度环尾部渐隐、头部实色加圆点，像运动轨迹 */
  trace?: boolean;
  /** /lab 候选（ref2 Cardy Pay）：只有选中项写名称，其余只有图标 */
  compact?: boolean;
}) {
  const nav = useRef<HTMLElement>(null), on = useRef<HTMLAnchorElement>(null), maskId = useId();
  const [geo, setGeo] = useState<{ w: number; h: number; pill: [number, number, number, number] | null }>({ w: 0, h: 0, pill: null });
  useLayoutEffect(() => {
    const el = nav.current!;
    const measure = () => {
      const a = el.getBoundingClientRect(), b = on.current?.getBoundingClientRect();
      setGeo({ w: a.width, h: a.height, pill: b ? [b.left - a.left, b.top - a.top, b.width, b.height] : null });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [selected, rest]);
  // 休息描边是小胶囊的内描边：向内缩半个线宽再留 space/2xs，整条线都在骨白里面，不会碰到外圈
  const sw = T['stroke/ring-progress'], half = sw / 2, inset = T['stroke/ring-rest'] / 2 + T['space/2xs'];
  const ring = geo.w ? pillPath(half, half, geo.w - sw, geo.h - sw) : '';
  const p = geo.pill;
  const restRing = p && rest && restRatio != null ? pillPath(p[0] + inset, p[1] + inset, p[2] - inset * 2, p[3] - inset * 2) : '';
  const restEnd = restRing ? endPoint(restRing, restRatio!) : null;
  const firstOff = TABS.find(([k]) => k !== selected)?.[0];
  return (
    <nav ref={nav} className={s.nav} aria-label="主导航">
      <svg className={s.ring} aria-hidden="true">
        {progress != null && ring && <path className={s.track} d={ring} />}
        {progress != null && progress > 0 && ring && !trace && <path className={s.progress} d={ring} pathLength={1} style={{ strokeDasharray: `${Math.min(1, progress)} 1` }} />}
        {progress != null && progress > 0 && ring && trace && <TraceRing d={ring} p={Math.min(1, progress)} />}
      </svg>
      {p && <span className={s.pill} aria-hidden="true" style={{ transform: `translate(${p[0]}px, ${p[1]}px)`, width: p[2], height: p[3] }} />}
      {/* 休息内描边：单独一层，压在骨白滑块上、文字下 */}
      {restRing && (
        <svg className={s.restLayer} aria-hidden="true">
          <mask id={maskId}><path d={restRing} pathLength={1} className={s.restMask} style={{ strokeDasharray: `${Math.max(0, Math.min(1, restRatio!))} 1` }} /></mask>
          <path className={s.rest} d={restRing} mask={`url(#${maskId})`} />
          {restEnd && <circle className={s.restDot} cx={restEnd[0]} cy={restEnd[1]} r={T['stroke/ring-rest']} />}
        </svg>
      )}
      {TABS.map(([k, label, href]) => (
        <a key={k} ref={k === selected ? on : undefined} href={href} className={cx('milo-press milo-focus', k === selected ? s.on : s.item)} aria-current={k === selected ? 'page' : undefined}
          aria-label={k === selected && rest ? `${label}，休息剩余 ${rest}` : undefined}
          onClick={(e) => { if (onSelect) { e.preventDefault(); onSelect(k, href); } }} {...(k === firstOff ? forced(itemState) : {})}>
          <Icon name={k} className={s.icon} active={k === selected} />
          {(!compact || k === selected) ? <span>{k === selected && rest ? rest : label}</span> : <span className="milo-sr">{label}</span>}
        </a>
      ))}
    </nav>
  );
}

/** 轨迹环：把已走的那段切成若干小段，不透明度从 opacity/trace-min 升到 1（尾淡头实），端点一个实心圆 */
function TraceRing({ d, p }: { d: string; p: number }) {
  const n = 28, lo = T['opacity/trace-min'], end = endPoint(d, p);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (p * i) / n, len = p / n + (i < n - 1 ? p / n : 0); // 每段向前多盖一段，后画的（更实的）压住前一段，不露缝
        return <path key={i} className={s.progressSeg} d={d} pathLength={1} style={{ strokeDasharray: `${len} 1`, strokeDashoffset: -a, opacity: lo + ((1 - lo) * (i + 1)) / n }} />;
      })}
      {end && <circle className={s.traceHead} cx={end[0]} cy={end[1]} r={T['stroke/ring-progress']} />}
    </>
  );
}

/** 路径上按比例取点（休息描边的端点圆点）；SSR / jsdom 没有几何 API 时返回 null */
function endPoint(d: string, ratio: number): [number, number] | null {
  if (typeof document === 'undefined') return null;
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d);
  if (typeof el.getTotalLength !== 'function') return null;
  try { const pt = el.getPointAtLength(el.getTotalLength() * Math.max(0, Math.min(1, ratio))); return [pt.x, pt.y]; } catch { return null; }
}
