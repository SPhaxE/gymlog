/** 悬浮层（DESIGN §9.3）：Dialog、Toast、Sheet 都渲染到同一个宿主里。
 *  App 壳把宿主放在屏幕框里；Playground 的每块迷你屏幕各有自己的宿主，所以弹窗只盖住那块屏幕。
 *  返回键：打开的悬浮层按后开先关的顺序登记，系统返回键先关最上面的一层（壳里接 Capacitor backButton）。 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
