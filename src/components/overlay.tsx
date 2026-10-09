/** 悬浮层（DESIGN §9.3）：Dialog、Toast、Sheet 都渲染到同一个宿主里。
 *  App 壳把宿主放在屏幕框里；Playground 的每块迷你屏幕各有自己的宿主，所以弹窗只盖住那块屏幕。
 *  返回键：打开的悬浮层按后开先关的顺序登记，系统返回键先关最上面的一层（壳里接 Capacitor backButton）。 */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export const OverlayHost = createContext<HTMLElement | null>(null);

export function Portal({ children }: { children: ReactNode }) {
  const host = useContext(OverlayHost);
  const target = host ?? (typeof document !== 'undefined' ? document.body : null);
  return target ? createPortal(children, target) : null;
}

/** 返回键栈：返回 true 表示这一层处理掉了 */
const backStack: (() => void)[] = [];
export function useBackHandler(active: boolean, onBack: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return;
    const fn = () => ref.current();
    backStack.push(fn);
    return () => { const i = backStack.lastIndexOf(fn); if (i >= 0) backStack.splice(i, 1); };
  }, [active]);
}
export function handleBack(): boolean {
  const top = backStack.at(-1);
  if (!top) return false;
  top();
  return true;
}

/** 焦点圈定：打开时聚焦第一个可聚焦元素，Tab 在层内循环，Esc 关闭，关闭后焦点回到打开前的位置 */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, onClose: () => void, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const before = document.activeElement as HTMLElement | null;
    const items = () => [...el.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
    (items()[0] ?? el).focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); list.at(-1)!.focus(); }
      else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
    };
    el.addEventListener('keydown', key);
    return () => { el.removeEventListener('keydown', key); before?.focus?.({ preventScroll: true }); };
  }, [ref, onClose, enabled]);
}

/** 每个出现都有退场（2026-10-09 走查 1 #02，DESIGN §9.6）：悬浮层卸载时，把它最后一帧的 DOM 复制一份留在原处、播退场动画（exitClass），播完删掉。
 *  这样不管是谁关的（遮罩、×、返回键，还是父组件选完直接不渲染了）都有退场，调用处不用改。
 *  复制品不可交互、读屏不念（inert + aria-hidden），画布照原样拷过去；减少动态效果、页面转场进行中（整页快照会把它拍进去）、skip 为真时不留。
 *  严格模式在开发时会「挂上 → 卸下 → 再挂上」一次：挂上后第一帧之前的卸下不算。 */
export function useExitGhost(ref: RefObject<HTMLElement | null>, exitClass: string, skip?: boolean) {
  const skipRef = useRef(skip);
  skipRef.current = skip;
  useLayoutEffect(() => {
    const el = ref.current;
    let live = false;
    const raf = requestAnimationFrame(() => { live = true; });
    return () => {
      cancelAnimationFrame(raf);
      const parent = el?.parentNode;
      if (!el || !parent || !live || skipRef.current || !el.isConnected || document.documentElement.dataset.vt
        || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const g = el.cloneNode(true) as HTMLElement;
      const src = el.querySelectorAll('canvas'), dst = g.querySelectorAll('canvas');
      src.forEach((c, i) => { try { dst[i].width = c.width; dst[i].height = c.height; dst[i].getContext('2d')?.drawImage(c, 0, 0); } catch { /* 画布拷不了就留空 */ } });
      g.inert = true; g.setAttribute('aria-hidden', 'true'); g.removeAttribute('role'); g.removeAttribute('aria-label'); g.dataset.ghost = '';
      g.classList.add(exitClass);
      parent.insertBefore(g, el.nextSibling);
      const done = () => g.remove();
      g.addEventListener('animationend', (e) => { if (e.target === g) done(); });
      window.setTimeout(done, 1000);   // 兜底：动画事件没来（标签页在后台）也删掉
    };
  }, [ref, exitClass]);
}

/* ---------- Toast 队列 ---------- */
export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem { id: number; kind: ToastKind; message: string; action?: { label: string; run: () => void } }
interface ToastApi { show: (message: string, opts?: { kind?: ToastKind; action?: ToastItem['action'] }) => void; items: ToastItem[]; dismiss: (id: number) => void }
const ToastCtx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const show = useCallback<ToastApi['show']>((message, opts) => {
    const id = ++seq.current;
    // 一次只显示一条：新的替换旧的
    setItems([{ id, message, kind: opts?.kind ?? 'success', action: opts?.action }]);
  }, []);
  const api = useMemo(() => ({ show, items, dismiss }), [show, items, dismiss]);
  return <ToastCtx.Provider value={api}>{children}</ToastCtx.Provider>;
}
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast 需要 ToastProvider');
  return ctx;
}
