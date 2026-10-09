/** 动效组件（2026-10-04 用户选定 8motions 的 02 / 03 / 07）：
 *  Cascade  — M07 弹簧交错流：子项依次从下方弹入，错开 motion/stagger，总窗口不超过 motion/list-max；
 *  RestDock — 组间休息计时小胶囊（2026-10-08 走查 1：只保留小的，不再点开长成面板）；
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
import { clock } from './training';
import s from './motion.module.css';

export function Cascade({ children, replayKey, still }: { children: ReactNode; replayKey?: string | number; /** 不播入场（从曲线页返回、共享元素转场要拍到完整的列表行时） */ still?: boolean }) {
  const items = Children.toArray(children), step = Math.min(T['motion/stagger'], T['motion/list-max'] / Math.max(1, items.length - 1));
  return <div key={replayKey} className={cx(s.cascade, still && s.cascadeStill)}>{items.map((c, i) => <div key={i} className={s.cascadeItem} style={{ animationDelay: `${Math.round(i * step)}ms` }}>{c}</div>)}</div>;
}

/** 可收起的一块（2026-10-06 用户：增量分组要能点标题收起）：
 *  高度按 motion/spring 在 0 ↔ 内容高之间过渡（M02 的「尺寸弹簧」，grid-template-rows 0fr ↔ 1fr，不写死高度）；
 *  每次展开，子项按 M07 依次从下方弹入（Cascade 重播）；第一次挂载不播（外层列表自己有入场）；收起后 inert（读屏、Tab 键都跳过）。 */
export function Collapsible({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  const seq = useRef(0), was = useRef(open);
  if (open && !was.current) seq.current += 1;   // 渲染时同步记一次「展开」：子项的入场和高度过渡同一帧开始
  was.current = open;
  return (
    <div id={id} className={cx(s.collapsible, open && s.collapsibleOpen)} inert={!open || undefined}>
      <div className={s.collapsibleInner}><Cascade replayKey={seq.current} still={seq.current === 0}>{children}</Cascade></div>
    </div>
  );
}

/** 组间休息计时（2026-10-08 走查 1 #21 #27：只保留小胶囊，不再点开长成面板——±15 / 跳过一起去掉，打下一组就是结束休息）。
 *  和导航选中滑块同形：尺寸和内描边几何一致（进度条才能原样飞过去），配色跟页面组件（凹底 + 细线），进度条到了滑块上才换成滑块的深色；
 *  只是状态，不可点（role=timer）；整颗胶囊带共享名 REST_VT（切 Tab 时胶囊下滑消失），里面的进度条带 REST_RING_VT（飞进导航滑块）；
 *  休息结束换成对勾 +「好了」，直到打下一组。width 不给时按内容宽（Playground）。 */
export function RestDock({ remaining, total, endAt, width }: { remaining: number; total: number; endAt: number; /** 导航一项的宽度 */ width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const el = ref.current!; const m = () => setBox([el.offsetWidth, el.offsetHeight]);
    m(); const ro = new ResizeObserver(m); ro.observe(el); return () => ro.disconnect();
  }, []);
  const rr = useRestRatio(endAt, total * 1000);
  const inset = T['stroke/ring-rest'] / 2 + T['space/2xs'];
  return (
    <div ref={ref} role="timer" className={cx(s.ringPill, remaining <= 0 && s.ringDone)} style={{ ...(width ? { width } : {}), ...REST_VT }}
      aria-label={remaining > 0 ? `组间休息剩余 ${clock(remaining)}` : '休息结束'}>
      {box && remaining > 0 && <svg className={s.ringLayer} style={REST_RING_VT} aria-hidden="true"><path className={s.ringRest} d={pillPath(inset, inset, box[0] - inset * 2, box[1] - inset * 2)} pathLength={1} style={{ strokeDasharray: `${rr} 1` }} /></svg>}
      <Icon name={remaining > 0 ? 'timer' : 'check'} small active={remaining <= 0} />
      <b>{remaining > 0 ? clock(remaining) : '好了'}</b>
    </div>
  );
}

/* ---------- M03 共享元素展开（View Transitions） ---------- */
/** 共享元素的名字：同一个 id 的卡片、名称、数字在列表与详情里同名，转场时由浏览器把它们从旧位置变形到新位置。
 *  view-transition-class = 部位（card / title / num），CSS 按部位定转场方式。
 *  fluid = M02 流体胶囊形变（容量页胶囊 ↔ 肌头详情浮层，FluidPanel）。
 *  同一时刻只给「正在展开 / 收起的那一项」起名：转场层里的分组按文档顺序叠放，列表其他行要是也有名字，会画在展开的卡片上面（用户 2026-10-05 逐帧看到的遮挡错） */
export const sharedName = (part: 'card' | 'title' | 'num' | 'swap' | 'pic' | 'fluid', id: string) => ({ viewTransitionName: `x-${part}-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`, viewTransitionClass: part }) as CSSProperties;

/** M09 钻入转场（2026-10-06，增量页的一行 ↔ 动作曲线页）：列表行里的名称、最新值、小曲线，分别飞成详情页的标题、大数字、整张曲线；
 *  整页只做很快的淡出 / 淡入（见 interactive.css 的 data-vt='drill'）。名字按动作 id 起，列表里只有「被点的那一行」带名字（同名不能出现两次）。
 *  part：name 名称 → 标题；num 最新值 → 大数字；line 小曲线 → 整张曲线。 */
export const drillName = (part: 'name' | 'num' | 'line', id: string) => ({ viewTransitionName: `x-drill-${part}-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`, viewTransitionClass: `d${part}` }) as CSSProperties;

/** 页面级转场的骨架（M09 钻入、Tab 横滑、子页推入 / 推出共用）：before 里（flushSync）让起点页的共享名就位；回调里跳转，
 *  等 ready() 为真（目标页挂好、共享名就位）才拍新快照，最多等 3 × motion/slow（重页面借这段时间渲染）。
 *  vt / dir 挂在 <html data-vt data-vt-dir> 上，CSS 按它选转场（interactive.css）。不支持、减少动态效果、或已经有一次页面转场在跑时直接跳转（不嵌套）。 */
export function viewTransit(o: { vt: 'drill' | 'tab' | 'push' | 'pop'; dir?: string; go: () => void; ready: () => boolean; before?: () => void; after?: () => void }) {
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<unknown> } };
  const html = document.documentElement;
  if (!doc.startViewTransition || html.dataset.vt || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { o.go(); return; }
  o.before?.();
  html.dataset.vt = o.vt; if (o.dir) html.dataset.vtDir = o.dir;
  const vt = doc.startViewTransition(() => new Promise<void>((done) => {
    o.go();
    // 回调期间页面暂停渲染、rAF 不跑，所以用 setTimeout 轮询
    const t0 = performance.now();
    const check = () => (o.ready() || performance.now() - t0 > T['motion/slow'] * 3 ? done() : window.setTimeout(check, 16));
    check();
  }));
  void vt.finished.catch(() => undefined).finally(() => { delete html.dataset.vt; delete html.dataset.vtDir; o.after?.(); });
}

/** 钻入 / 退出转场（M09）：ready 是目标页挂好后才有的选择器；dir：in = 进详情，out = 回列表（只影响整页淡入时要不要上浮） */
export function drillTransition(go: () => void, ready: string, dir: 'in' | 'out', before?: () => void, after?: () => void) {
  viewTransit({ vt: 'drill', dir, go, ready: () => !!document.querySelector(ready), before, after });
}

/** 换了一页：<main> 换成了另一个节点（Tab 根页、子页都用 Screen 渲染 <main>，路由切换时整页重挂） */
export function pageSwapped() {
  const m0 = document.querySelector('main');
  return () => { const m = document.querySelector('main'); return !!m && m !== m0; };
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
    if (el && el !== document.documentElement) { e.stopImmediatePropagation(); e.preventDefault(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); }  // SVG 元素没有 .click()
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
