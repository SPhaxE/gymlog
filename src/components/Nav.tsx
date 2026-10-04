/** 底部导航（ia §1.12，v2）：5 项都是「图标 + 名称」，选中项骨白实心。
 *  外圈 = 今日进度：实线，从顶边正中顺时针；progress null 不画环（恢复日、动作池不足、空态），0 只画轨道，1 满环。
 *  休息：选中项的名称换成剩余时间，小胶囊外加一道虚线描边 + 端点圆点（restRatio = 剩余 ÷ 总时长），与外圈靠线型区分。 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import { Icon } from './Icon';
import s from './Nav.module.css';

export const TABS = [['home', '首页', '/explore/home'], ['body', '身体', '/explore/body'], ['gains', '增量', '#'], ['log', '记录', '#'], ['me', '我的', '#']] as const;
export type Tab = (typeof TABS)[number][0];

/** 圆角矩形路径，从顶边正中起顺时针（描边进度用 pathLength=1） */
export function pillPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(h / 2, w / 2), cx = x + w / 2;
  return `M${cx},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;
}

export function Nav({ selected, progress, rest, restRatio }: { selected: Tab; progress: number | null; rest?: string; restRatio?: number }) {
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
  }, [selected]);
  const sw = T['stroke/ring-progress'], half = sw / 2, gap = T['stroke/ring-gap'] + T['stroke/ring-rest'] / 2;
  const ring = geo.w ? pillPath(half, half, geo.w - sw, geo.h - sw) : '';
  const p = geo.pill;
  const restRing = p && rest && restRatio != null ? pillPath(p[0] - gap, p[1] - gap, p[2] + gap * 2, p[3] + gap * 2) : '';
  const restEnd = restRing ? endPoint(restRing, restRatio!) : null;
  return (
    <nav ref={nav} className={s.nav} aria-label="主导航">
      <svg className={s.ring} aria-hidden="true">
        {progress != null && ring && <path className={s.track} d={ring} />}
        {progress != null && progress > 0 && ring && <path className={s.progress} d={ring} pathLength={1} style={{ strokeDasharray: `${Math.min(1, progress)} 1` }} />}
        {restRing && (
          <>
            {/* 休息：虚线只走剩余比例那一段——实线路径做遮罩，虚线路径画在下面 */}
            <mask id={maskId}><path d={restRing} pathLength={1} className={s.restMask} style={{ strokeDasharray: `${Math.max(0, Math.min(1, restRatio!))} 1` }} /></mask>
            <path className={s.rest} d={restRing} mask={`url(#${maskId})`} />
          </>
        )}
        {restEnd && <circle className={s.restDot} cx={restEnd[0]} cy={restEnd[1]} r={T['stroke/ring-rest']} />}
      </svg>
      {TABS.map(([k, label, href]) => (
        <a key={k} ref={k === selected ? on : undefined} href={href} className={k === selected ? s.on : s.item} aria-current={k === selected ? 'page' : undefined}>
          <Icon name={k} className={s.icon} />
          <span>{k === selected && rest ? rest : label}</span>
        </a>
      ))}
    </nav>
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
