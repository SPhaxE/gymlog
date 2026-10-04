/** 底部导航（ia §1.12）：5 项都是「图标 + 名称」，选中项是滑动的骨白小胶囊。
 *  外圈 = 今日进度（2026-10-04 用户选定 R1 改版）：
 *   - progress null：不画环（恢复日、动作池不足、空态）；还没开始训练（started 为假且 progress 为 0）：也不画；
 *   - 开始训练后：先从顶边正中顺时针「画」出一圈暗色待走轨道，再在上面走荧光进度；
 *   - 进度是轨迹：尾部淡（opacity/trace-min）、头部实，没有端点圆点；1 = 满环。
 *  休息：选中项的名称换成剩余时间；小胶囊里面一道实线内描边按剩余比例收短（没有虚线、没有端点），
 *   给 restEndAt + restTotalMs 时按帧平滑走（不按秒一格一格跳）；只给 restRatio 时是静态（Playground）。
 *  选中切换时：图标先出一圈短暂的「加载」轨迹（iconmotionref1），再沿路径画出来。 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 休息剩余比例：有结束时间戳时按帧算（减少动态效果时按秒），否则用静态比例 */
function useRestRatio(endAt?: number, totalMs?: number, ratio?: number) {
  const [r, setR] = useState(() => (endAt && totalMs ? Math.max(0, (endAt - Date.now()) / totalMs) : ratio ?? 0));
  useEffect(() => {
    if (!endAt || !totalMs) { setR(ratio ?? 0); return; }
    const tick = () => setR(Math.max(0, Math.min(1, (endAt - Date.now()) / totalMs)));
    tick();
    if (reduced()) { const id = window.setInterval(tick, 1000); return () => clearInterval(id); }
    let raf = 0;
    const loop = () => { tick(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [endAt, totalMs, ratio]);
  return r;
}

export function Nav({ selected, progress, started, rest, restRatio, restEndAt, restTotalMs, onSelect, itemState }: {
  selected: Tab; progress: number | null; started?: boolean;
  /** 选中项上显示的剩余时间文字（1:35）；有它才画休息描边 */
  rest?: string; restRatio?: number; restEndAt?: number; restTotalMs?: number;
  onSelect?: (tab: Tab, path: string) => void; itemState?: Forced;
}) {
  const nav = useRef<HTMLElement>(null), on = useRef<HTMLAnchorElement>(null);
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
  // 选中切换计数：首屏不放加载动效，之后每次切换放一次
  const prevSel = useRef(selected), [switches, setSwitches] = useState(0);
  useEffect(() => { if (prevSel.current !== selected) { prevSel.current = selected; setSwitches((n) => n + 1); } }, [selected]);

  const rr = useRestRatio(restEndAt, restTotalMs, restRatio);
  const sw = T['stroke/ring-progress'], half = sw / 2, inset = T['stroke/ring-rest'] / 2 + T['space/2xs'];
  const ring = geo.w ? pillPath(half, half, geo.w - sw, geo.h - sw) : '';
  const p = geo.pill;
  const restRing = p && rest ? pillPath(p[0] + inset, p[1] + inset, p[2] - inset * 2, p[3] - inset * 2) : '';
  const showRing = progress != null && (started || progress > 0) && !!ring;
  const firstOff = TABS.find(([k]) => k !== selected)?.[0];
  return (
    <nav ref={nav} className={s.nav} aria-label="主导航">
      <svg className={s.ring} aria-hidden="true">
        {showRing && <path className={s.track} d={ring} pathLength={1} />}
        {showRing && progress! > 0 && <TraceRing d={ring} p={Math.min(1, progress!)} />}
      </svg>
      {p && <span className={s.pill} aria-hidden="true" style={{ transform: `translate(${p[0]}px, ${p[1]}px)`, width: p[2], height: p[3] }} />}
      {/* 休息内描边：单独一层，压在骨白滑块上、文字下；实线、无端点，按剩余比例收短 */}
      {restRing && (
        <svg className={s.restLayer} aria-hidden="true">
          <path className={s.rest} d={restRing} pathLength={1} style={{ strokeDasharray: `${rr} 1` }} />
        </svg>
      )}
      {TABS.map(([k, label, href]) => (
        <a key={k} ref={k === selected ? on : undefined} href={href} className={cx('milo-press milo-focus', k === selected ? s.on : s.item)} aria-current={k === selected ? 'page' : undefined}
          aria-label={k === selected && rest ? `${label}，休息剩余 ${rest}` : undefined}
          onClick={(e) => { if (onSelect) { e.preventDefault(); onSelect(k, href); } }} {...(k === firstOff ? forced(itemState) : {})}>
          <span key={k === selected ? `on${switches}` : k} className={cx(s.iconWrap, k === selected && switches > 0 && s.loading)}>
            {k === selected && switches > 0 && <Loader />}
            <Icon name={k} className={s.icon} active={k === selected && switches > 0} />
          </span>
          <span>{k === selected && rest ? rest : label}</span>
        </a>
      ))}
    </nav>
  );
}

/** 选中瞬间的加载轨迹（iconmotionref1）：一段从透明渐到实色的圆弧绕图标转一圈后淡出 */
function Loader() {
  return (
    <svg className={s.loader} viewBox="0 0 24 24" aria-hidden="true">
      <defs><linearGradient id="navLoaderGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0" /><stop offset="1" stopColor="currentColor" /></linearGradient></defs>
      <path d="M12 2.5a9.5 9.5 0 1 1-9.5 9.5" fill="none" stroke="url(#navLoaderGrad)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** 轨迹环：把已走的那段切成若干小段，不透明度从 opacity/trace-min 升到 1（尾淡头实），没有端点 */
function TraceRing({ d, p }: { d: string; p: number }) {
  const n = 28, lo = T['opacity/trace-min'];
  return (
    <g className={s.trace}>
      {Array.from({ length: n }, (_, i) => {
        const a = (p * i) / n, len = p / n + (i < n - 1 ? p / n : 0); // 每段向前多盖一段，后画的（更实的）压住前一段，不露缝
        return <path key={i} className={s.progressSeg} d={d} pathLength={1} style={{ strokeDasharray: `${len} 1`, strokeDashoffset: -a, opacity: lo + ((1 - lo) * (i + 1)) / n }} />;
      })}
    </g>
  );
}
