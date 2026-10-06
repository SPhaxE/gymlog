/** 底部导航（ia §1.12）：5 项都是「图标 + 名称」，选中项是滑动的骨白小胶囊。
 *  外圈 = 今日进度（2026-10-04 用户第二轮反馈）：
 *   1. 还没开始训练（started 为假且 progress 为 0）或 progress null：不画环；
 *   2. 开始训练、0 组：一整圈暗色轨道，示意整场训练（本次会话里第一次出现时从顶边正中顺时针画出，切 Tab 不重画）；
 *   3. 每打卡一组，荧光实线沿轨道往前走一段（无端点），最后一组打完正好走满一圈。
 *  休息：选中项的名称换成剩余时间；骨白小胶囊里面一道实线内描边按剩余比例收短（没有虚线、没有端点）。
 *   描边画在小胶囊自己里面，跟小胶囊一起滑；给 restEndAt + restTotalMs 时按帧平滑走，只给 restRatio 时是静态（Playground）。
 *  选中切换时：图标自己的笔画由暗到亮画出来（iconmotionref1），见 Icon 的 active。 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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

/** 休息计时的共享元素名（2026-10-06）：首页训练中，休息计时是主按钮旁一颗和这里选中滑块一模一样的胶囊（导航上不再重复显示）；
 *  切到别的 Tab 时，那颗胶囊借 View Transitions 原地飞进这里的滑块，切回首页再飞回去——同一时刻屏上只有一个计时器。 */
export const REST_VT = { viewTransitionName: 'x-rest-timer', viewTransitionClass: 'rest' } as CSSProperties;
/** 计时胶囊飞进来时，这一页的滑块直接停在目标位置（不再从上一个 Tab 滑过来），否则转场结束后会跳一下 */
export const navHandoff = { skipSlide: false };

/** 跨页面记住上一个 Nav 的选中项和滑块位置（模块级，App 里同一时刻只有一个 Nav 在屏上） */
const memo: { tab: Tab | null; pill: [number, number, number, number] | null; ring: boolean; progress: number } = { tab: null, pill: null, ring: false, progress: 0 };

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 休息剩余比例：有结束时间戳时按帧算（减少动态效果时按秒），否则用静态比例 */
export function useRestRatio(endAt?: number, totalMs?: number, ratio?: number) {
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
  // App 里每个 Tab 页各有一个 Nav，切 Tab 时 Nav 是新挂载的：从上一个 Nav 留下的选中项与滑块位置接着动，滑块才会滑、图标才会放加载态
  const [cameFrom] = useState(() => {
    if (navHandoff.skipSlide) { navHandoff.skipSlide = false; return null; }
    return memo.tab && memo.tab !== selected && memo.pill ? { tab: memo.tab, pill: memo.pill } : null;
  });
  const slid = useRef(false);
  useLayoutEffect(() => {
    const el = nav.current!;
    const measure = () => {
      const a = el.getBoundingClientRect(), b = on.current?.getBoundingClientRect();
      const g = { w: a.width, h: a.height, pill: b ? [b.left - a.left, b.top - a.top, b.width, b.height] as [number, number, number, number] : null };
      memo.pill = g.pill; memo.tab = selected;
      setGeo(g);
    };
    const from = slid.current ? null : cameFrom;
    let raf = 0, ready = !from;
    if (from) {
      // 先按旧位置画一帧，下一帧再量新位置，滑块的 transform 过渡才会生效；在那之前忽略 ResizeObserver 的首次回调
      const a = el.getBoundingClientRect();
      setGeo({ w: a.width, h: a.height, pill: from.pill });
      // 严格模式下副作用会跑两遍：只有真的滑过一次才记 slid，第二遍照样从旧位置起滑
      raf = requestAnimationFrame(() => requestAnimationFrame(() => { ready = true; slid.current = true; measure(); }));
    } else measure();
    const ro = new ResizeObserver(() => { if (ready) measure(); }); ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [selected, rest]);
  // 选中切换计数：首屏不放加载动效；同一个 Nav 里切换、或从另一页的 Nav 切过来，都放一次
  const prevSel = useRef(selected), [switches, setSwitches] = useState(() => (memo.tab && memo.tab !== selected ? 1 : 0));
  useEffect(() => { if (prevSel.current !== selected) { prevSel.current = selected; setSwitches((n) => n + 1); } }, [selected]);

  const rr = useRestRatio(restEndAt, restTotalMs, restRatio);
  const sw = T['stroke/ring-progress'], half = sw / 2, inset = T['stroke/ring-rest'] / 2 + T['space/2xs'];
  const ring = geo.w ? pillPath(half, half, geo.w - sw, geo.h - sw) : '';
  const p = geo.pill;
  // 休息描边的坐标相对小胶囊自己（画在小胶囊里面，跟着一起滑）
  const restRing = p && rest ? pillPath(inset, inset, p[2] - inset * 2, p[3] - inset * 2) : '';
  const showRing = progress != null && (started || progress > 0) && !!ring;
  const target = showRing ? Math.min(1, progress!) : 0;
  // 暗色轨道只在「本次会话第一次出现」或「同一个 Nav 里从无到有（刚点开始训练）」时画一圈
  const [drawIn, setDrawIn] = useState(() => !memo.ring);
  const prevShow = useRef(showRing);
  useEffect(() => { if (showRing && !prevShow.current) setDrawIn(true); prevShow.current = showRing; memo.ring = showRing; }, [showRing]);
  // 荧光进度：从上一个 Nav 留下的值接着走（训练页回来时能看到这一组走出去的那一段）
  const [shown, setShown] = useState(() => (memo.ring ? memo.progress : 0));
  useEffect(() => {
    memo.progress = target;
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => setShown(target)); });
    return () => cancelAnimationFrame(raf);
  }, [target]);
  const firstOff = TABS.find(([k]) => k !== selected)?.[0];
  return (
    <nav ref={nav} className={s.nav} aria-label="主导航">
      <svg className={s.ring} aria-hidden="true">
        {showRing && <path className={drawIn ? s.trackDraw : s.track} d={ring} pathLength={1} />}
        {showRing && <path className={s.progress} d={ring} pathLength={1} style={{ strokeDasharray: `${shown} 1` }} />}
      </svg>
      {p && (
        <span className={s.pill} aria-hidden="true" style={{ transform: `translate(${p[0]}px, ${p[1]}px)`, width: p[2], height: p[3], ...(rest ? REST_VT : {}) }}>
          {/* 休息内描边：画在小胶囊里面，滑动时和小胶囊同步；实线、无端点，按剩余比例收短 */}
          {restRing && <svg className={s.restLayer}><path className={s.rest} d={restRing} pathLength={1} style={{ strokeDasharray: `${rr} 1` }} /></svg>}
        </span>
      )}
      {TABS.map(([k, label, href]) => (
        <a key={k} ref={k === selected ? on : undefined} href={href} className={cx('milo-press milo-focus', k === selected ? s.on : s.item)} aria-current={k === selected ? 'page' : undefined}
          aria-label={k === selected && rest ? `${label}，休息剩余 ${rest}` : undefined}
          onClick={(e) => { if (onSelect) { e.preventDefault(); onSelect(k, href); } }} {...(k === firstOff ? forced(itemState) : {})}>
          <span key={k === selected ? `on${switches}` : k} className={s.iconWrap}>
            <Icon name={k} className={s.icon} active={k === selected && switches > 0} />
          </span>
          <span>{k === selected && rest ? rest : label}</span>
        </a>
      ))}
    </nav>
  );
}
