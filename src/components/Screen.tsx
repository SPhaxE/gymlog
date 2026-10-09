/** 页面框（版式规则 DESIGN §4）：背景全出血，内容区左右各留 size/gutter；最宽 size/content-max-w，宽屏居中；
 *  沉浸式全屏（2026-10-08）：底色与氛围层铺到状态栏和手势条下面，只有 frame 里的内容避让系统栏（Capacitor 注入 --safe-area-inset-*，global.css 收成 --safe-top / --safe-bottom）；
 *  底部给导航留出 nav-bar-h + nav-bottom。
 *  ScreenAtmosphere：可选的氛围层（Tab 根页底层的流体噪点渐变 FluidBackdrop），垫在内容下面、底色上面；不提供时就是纯 bg/base。 */
import { createContext, useContext, type ReactNode } from 'react';
import s from './Screen.module.css';

export const ScreenAtmosphere = createContext<ReactNode>(null);

export function Screen({ label, children, theme }: { label: string; children: ReactNode;
  /** 整页固定一种主题（故事引导是深色的电影画面，浅色模式下也不变） */ theme?: 'dark' | 'light' }) {
  const atm = useContext(ScreenAtmosphere);
  return <main className={s.screen} aria-label={label} data-theme={theme}>{atm && <div className={s.atm} aria-hidden="true">{atm}</div>}<div className={s.frame}>{children}</div></main>;
}
