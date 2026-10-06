/** 动效组件（2026-10-04 用户选定 8motions 的 02 / 03 / 07）：
 *  Cascade  — M07 弹簧交错流：子项依次从下方弹入，错开 motion/stagger，总窗口不超过 motion/list-max；
 *  RestDock — M02 流体胶囊形变：组间休息平时是底部一颗小胶囊，点开原地长成休息面板（尺寸与圆角一起按软弹簧过渡）；
 *  SharedDetail / sharedTransition / sharedName — M03 共享元素展开：列表行的卡片、名称、数字原地变形成整屏详情（View Transitions），返回时变回去；
 *    首页「开始训练」时主角卡原地展开成组行、训练中点列表行换动作，也是它。
 *  Tilt — M01 3D 倾斜光影（2026-10-06 加）：按住核心卡片移动时随触点微倾、高光跟手，松手弹簧回正。只给「这一刻的主角」（结算页新纪录卡）。
 *  都有「减少动态效果」降级：直接到位。 */
import { Children, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { pillPath, REST_RING_VT, REST_VT, useRestRatio } from './Nav';
import { flushSync } from 'react-dom';
import { T } from '../styles/tokens.gen';
import { IconButton } from './Button';
import { Icon } from './Icon';
import { useBackHandler } from './overlay';
import { cx } from './state';
import { RestBar, clock } from './training';
import s from './motion.module.css';

export function Cascade({ children, replayKey, still }: { children: ReactNode; replayKey?: string | number; /** 不播入场（从曲线页返回、共享元素转场要拍到完整的列表行时） */ still?: boolean }) {
  const items = Children.toArray(children), step = Math.min(T['motion/stagger'], T['motion/list-max'] / Math.max(1, items.length - 1));
  return <div key={replayKey} className={cx(s.cascade, still && s.cascadeStill)}>{items.map((c, i) => <div key={i} className={s.cascadeItem} style={{ animationDelay: `${Math.round(i * step)}ms` }}>{c}</div>)}</div>;
}

export function RestDock({ remaining, total, open, onToggle, onAdjust, onSkip, ring }: {
  remaining: number; total: number; open: boolean; onToggle: (open: boolean) => void; onAdjust?: (d: number) => void; onSkip?: () => void;
  /** 「导航滑块」形态（2026-10-06，首页训练中）：和导航选中滑块一模一样——骨白胶囊、图标在上时间在下、里面一道按剩余比例收短的实线；
   *  width = 导航一项的宽度，endAt 让描边按帧走；收起时带共享名 REST_VT（切 Tab 时胶囊下滑消失），里面的进度条带 REST_RING_VT（飞进导航滑块） */
  ring?: { width: number; endAt: number };
}) {
  const ratio = Math.max(0, Math.min(1, remaining / total));
  // 导航滑块形态：胶囊 ↔ 面板也走共享元素（同名 REST_VT），胶囊原地长成面板、面板缩回胶囊
  const toggle = ring ? (v: boolean) => sharedTransition(() => onToggle(v)) : onToggle;
  if (ring && !open) return <RingPill remaining={remaining} total={total} width={ring.width} endAt={ring.endAt} onOpen={() => toggle(true)} />;
  return (
    <div className={cx(s.dock, open && s.dockOpen)} style={{ ['--rest' as string]: `${ratio * 100}%`, ...(ring ? REST_VT : {}) }}>
      {open ? (
        <div className={s.dockBody}>
          <RestBar remaining={remaining} total={total} onAdjust={onAdjust} onSkip={onSkip} onDismiss={() => toggle(false)} />
          {remaining > 0 && <button type="button" className={cx('milo-focus', s.collapse)} onClick={() => toggle(false)}>收起</button>}
        </div>
      ) : (
        <button type="button" className={cx('milo-press milo-focus', s.pill)} onClick={() => onToggle(true)} aria-label={remaining > 0 ? `组间休息剩余 ${clock(remaining)}，展开` : '休息结束，展开'}>
          <Icon name={remaining > 0 ? 'timer' : 'check'} small />
          <span>{remaining > 0 ? '休息' : '休息结束'}</span>
          {remaining > 0 && <b>{clock(remaining)}</b>}
        </button>
      )}
    </div>
  );
}

/** 休息胶囊的「导航滑块」形态：尺寸和内描边的几何与导航选中滑块一致（进度条才能原样飞过去），配色跟页面组件（凹底 + 细线），进度条到了滑块上才换成滑块的深色 */
function RingPill({ remaining, total, width, endAt, onOpen }: { remaining: number; total: number; width: number; endAt: number; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const el = ref.current!; const m = () => setBox([el.offsetWidth, el.offsetHeight]);
    m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect();
  }, []);
  const rr = useRestRatio(endAt, total * 1000);
  const inset = T['stroke/ring-rest'] / 2 + T['space/2xs'];
  return (
    <button ref={ref} type="button" className={cx('milo-press milo-focus', s.ringPill, remaining <= 0 && s.ringDone)} style={{ width, ...REST_VT }} onClick={onOpen}
      aria-label={remaining > 0 ? `组间休息剩余 ${clock(remaining)}，展开` : '休息结束，展开'}>
      {box && remaining > 0 && <svg className={s.ringLayer} style={REST_RING_VT} aria-hidden="true"><path className={s.ringRest} d={pillPath(inset, inset, box[0] - inset * 2, box[1] - inset * 2)} pathLength={1} style={{ strokeDasharray: `${rr} 1` }} /></svg>}
      <Icon name={remaining > 0 ? 'timer' : 'check'} small />
      <b>{remaining > 0 ? clock(remaining) : '好了'}</b>
    </button>
  );
}

/* ---------- M03 共享元素展开（View Transitions） ---------- */
/** 共享元素的名字：同一个 id 的卡片、名称、数字在列表与详情里同名，转场时由浏览器把它们从旧位置变形到新位置。
 *  view-transition-class = 部位（card / title / num），CSS 按部位定转场方式。
 *  同一时刻只给「正在展开 / 收起的那一项」起名：转场层里的分组按文档顺序叠放，列表其他行要是也有名字，会画在展开的卡片上面（用户 2026-10-05 逐帧看到的遮挡错） */
export const sharedName = (part: 'card' | 'title' | 'num' | 'swap', id: string) => ({ viewTransitionName: `x-${part}-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`, viewTransitionClass: part }) as CSSProperties;

/** M09 钻入转场（2026-10-06，增量页的一行 ↔ 动作曲线页）：列表行里的名称、最新值、小曲线，分别飞成详情页的标题、大数字、整张曲线；
 *  整页只做很快的淡出 / 淡入（见 interactive.css 的 data-vt='drill'）。名字按动作 id 起，列表里只有「被点的那一行」带名字（同名不能出现两次）。
 *  part：name 名称 → 标题；num 最新值 → 大数字；line 小曲线 → 整张曲线。 */
export const drillName = (part: 'name' | 'num' | 'line', id: string) => ({ viewTransitionName: `x-drill-${part}-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`, viewTransitionClass: `d${part}` }) as CSSProperties;

/** 钻入 / 退出转场：before 里（flushSync）让起点页的共享名就位；go 里跳转；等 ready 选择器出现（目标页挂好、共享名就位）才拍新快照。
 *  dir：in = 进详情，out = 回列表（只影响整页淡入时要不要上浮）。不支持或减少动态效果时直接跳转。 */
export function drillTransition(go: () => void, ready: string, dir: 'in' | 'out', before?: () => void, after?: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<unknown> } };
  if (!doc.startViewTransition || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { go(); return; }
  before?.();
  const html = document.documentElement;
  html.dataset.vt = 'drill'; html.dataset.vtDir = dir;
  const vt = doc.startViewTransition(() => new Promise<void>((done) => {
    go();
    const t0 = performance.now();
    const check = () => (document.querySelector(ready) || performance.now() - t0 > T['motion/slow'] ? done() : window.setTimeout(check, 16));
    check();
  }));
  void vt.finished.catch(() => undefined).finally(() => { delete html.dataset.vt; delete html.dataset.vtDir; after?.(); });
}

/** 用 View Transitions 包住一次状态切换（flushSync 让新 DOM 在回调里就位）；不支持或减少动态效果时直接切换 */
export function sharedTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || still) { update(); return; }
  doc.startViewTransition(() => flushSync(update));
}

/** 转场中点按不丢（2026-10-06 查出）：View Transitions 进行时，页面上的元素点不到——点击的目标是 <html>、elementFromPoint 也只给 <html>，
 *  `::view-transition { pointer-events: none }` 在 Chrome 里并不能让点按穿过去。用户在休息面板展开（约半秒）期间点组行，这一下会被吞掉；
 *  整套检查里「点组行改数」偶发失败就是这个（机器慢、转场更久时必现）。
 *  做法：装一次，包住 startViewTransition 记下正在跑的那次；按下（pointerdown）时如果目标是 <html> 且转场在跑，就 skipTransition（DOM 早已是终态，
 *  动画被用户的点按打断），并记下按下的坐标；随后到来的那个落在 <html> 上的 click 被拦下，改成点坐标处的真元素。 */
export function guardTransitionTaps() {
  const doc = document as Document & { startViewTransition?: (cb?: () => unknown) => { finished: Promise<unknown>; skipTransition: () => void } };
  const w = window as unknown as { __tapGuard?: boolean };
  if (!doc.startViewTransition || w.__tapGuard) return;
  w.__tapGuard = true;
  const start = doc.startViewTransition.bind(doc);
  let active: { skipTransition: () => void } | null = null;
  doc.startViewTransition = (cb) => {
    const vt = start(cb);
    active = vt;
    void vt.finished.catch(() => undefined).finally(() => { if (active === vt) active = null; });
    return vt;
  };
  let lost: { x: number; y: number } | null = null;
  document.addEventListener('pointerdown', (e) => {
    if (active && e.target === document.documentElement) { lost = { x: e.clientX, y: e.clientY }; active.skipTransition(); active = null; } else lost = null;
  }, true);
  document.addEventListener('click', (e) => {
    if (!lost || e.target !== document.documentElement) return;
    const { x, y } = lost; lost = null;
    const el = document.elementFromPoint(x, y);
    if (el && el !== document.documentElement) { e.stopImmediatePropagation(); e.preventDefault(); (el as HTMLElement).click(); }
  }, true);
}

/** 详情整屏：卡片底、标题、主数字与列表行同名（sharedName），转场时列表行原地长成这一屏；其余内容随后淡入。返回键 / 按钮关闭 */
export function SharedDetail({ id, title, sub, hero, onBack, children }: { id: string; title: string; sub?: ReactNode; hero?: ReactNode; onBack: () => void; children?: ReactNode }) {
  useBackHandler(true, onBack);
  useEffect(() => { document.querySelector<HTMLElement>('[data-shared-back]')?.focus({ preventScroll: true }); }, []);
  return (
    <div className={s.detail} style={sharedName('card', id)} role="dialog" aria-label={title} aria-modal="true">
      <div className={s.detailHead}>
        <span data-shared-back tabIndex={-1} />
        <IconButton icon="back" label="返回" onClick={onBack} />
        <div className={s.detailTitle}><h2 className="milo-text-title-m" style={sharedName('title', id)}>{title}</h2>{sub && <span className="milo-text-caption">{sub}</span>}</div>
      </div>
      {hero && <div className={s.detailHero} style={sharedName('num', id)}>{hero}</div>}
      <div className={s.detailBody}>{children}</div>
    </div>
  );
}

/* ---------- M01 3D 倾斜光影 ---------- */
/** 按住在卡片上移动：俯仰 / 偏航各最多 TILT_MAX 度（8motions 01 的 ±5°），一道径向高光跟着手指；松手按弹簧回正。
 *  竖向滑动交给页面滚动（touch-action: pan-y，开始滚动时浏览器发 pointercancel，卡片回正）；减少动态效果时不动。 */
const TILT_MAX = 5;
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || still() || (e.pointerType !== 'mouse' && !e.buttons)) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - y) * 2 * TILT_MAX).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 2 * TILT_MAX).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    el.dataset.tilting = '';
  };
  const reset = () => { const el = ref.current; if (!el) return; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); delete el.dataset.tilting; };
  return (
    <div ref={ref} className={cx(s.tilt, className)} onPointerMove={move} onPointerDown={move} onPointerUp={reset} onPointerLeave={reset} onPointerCancel={reset}>
      {children}
      <i className={s.glare} aria-hidden="true" />
    </div>
  );
}
