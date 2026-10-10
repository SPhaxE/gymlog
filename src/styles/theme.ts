/** 主题（2026-10-10 用户：浅色模式，验证 Token 体系）。
 *  ★ 代码级一键切换：改下面这一行。'dark' / 'light' / 'system'（跟随系统）。用户在「我的 → 外观」选过的话以用户的为准。
 *  原理：页面只用语义色（--milo-color-*），tokens.css 里 :root 是深色、[data-theme='light'] 是浅色；切主题 = 改 <html data-theme>。
 *  任意元素加 data-theme 就是一块局部主题——App 里不再用（2026-10-10 用户：要真·全局浅色），只给方案台 / Playground 的单格强制深或浅。
 *  画布特效（流体背景、颗粒光、粒子、钢板、人体）从元素自己身上读 --milo-color-*，主题一变就重画（useTheme / useElementTheme）。 */
import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';

export type Theme = 'dark' | 'light';
export type ThemePref = Theme | 'system';

export const DEFAULT_THEME: ThemePref = 'dark';

const KEY = 'milo-theme';           // 用户在「我的 → 外观」的选择
const APPLIED = 'milo-theme-applied';   // 上次实际用的主题：index.html 里的小脚本首帧前就套上，不闪
const sysDark = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string | null) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* 隐私模式 */ } };
const isPref = (x: unknown): x is ThemePref => x === 'dark' || x === 'light' || x === 'system';

/** 地址栏 ?theme=light|dark（演示、截图、门禁用）只管这一次打开，不写进用户的选择 */
const urlPref = (): ThemePref | null => {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search).get('theme');
  return isPref(q) ? q : null;
};

export function themePref(): ThemePref {
  const u = read(KEY);
  return urlPref() ?? (isPref(u) ? u : DEFAULT_THEME);
}
export const resolve = (p: ThemePref): Theme => (p === 'system' ? (sysDark() ? 'dark' : 'light') : p);

const listeners = new Set<() => void>();
let current: Theme = 'dark';

/** 套上主题：<html data-theme>、浏览器顶栏色、安卓状态栏图标深浅 */
export function applyTheme(p: ThemePref = themePref()) {
  const t = resolve(p);
  current = t;
  const html = document.documentElement;
  html.dataset.theme = t;
  html.style.background = '';
  const bg = getComputedStyle(html).getPropertyValue('--milo-color-bg-base').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t);
  write(APPLIED, t);
  if (Capacitor.isNativePlatform()) void SystemBars.setStyle({ style: t === 'light' ? SystemBarsStyle.Light : SystemBarsStyle.Dark }).catch(() => undefined);
  listeners.forEach((f) => f());
}

/** 「我的 → 外观」：记下用户的选择并立即生效 */
export function setThemePref(p: ThemePref) {
  write(KEY, p === DEFAULT_THEME ? null : p);
  applyTheme(urlPref() ?? p);
}

/** 启动时调用一次；跟随系统时，系统切换深浅也跟着切 */
export function installTheme() {
  applyTheme();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (themePref() === 'system') applyTheme(); });
  // 别的窗口改了外观（/demo 的主题按钮改的是手机里那个同源 iframe）：这里也跟着换
  window.addEventListener('storage', (e) => { if (e.key === KEY) applyTheme(); });
}

const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
/** 用户在「我的 → 外观」的选择（没选过就是 DEFAULT_THEME） */
export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, themePref, () => DEFAULT_THEME);
}
/** 当前主题（画布特效把它放进 effect 依赖，切主题就重画） */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => current, () => 'dark');
}
/** 元素所在的主题：最近的 [data-theme]（方案台 / Playground 单格可以局部强制深或浅），没有就是全局主题。
 *  画布与 SVG 按它选色带、选混合模式；全局主题一变就重算（放进 effect / useMemo 依赖就会重画） */
export function useElementTheme(ref: RefObject<Element | null>): Theme {
  const theme = useTheme();
  const [t, setT] = useState<Theme>(theme);
  useLayoutEffect(() => {
    const v = ref.current?.closest('[data-theme]')?.getAttribute('data-theme');
    setT(v === 'light' || v === 'dark' ? v : theme);
  }, [ref, theme]);
  return t;
}
