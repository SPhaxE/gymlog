/** 页面框（版式规则 DESIGN §4）：背景全出血，内容区左右各留 size/gutter；最宽 size/content-max-w，宽屏居中；
 *  上下避开系统栏（Capacitor 注入 --safe-area-inset-*）；底部给导航留出 nav-bar-h + nav-bottom。
 *  ScreenAtmosphere：可选的氛围层（Tab 根页底层的流体噪点渐变 FluidBackdrop），垫在内容下面、底色上面；不提供时就是纯 bg/base。 */
import { createContext, useContext, type ReactNode } from 'react';
import s from './Screen.module.css';

export const ScreenAtmosphere = createContext<ReactNode>(null);

export function Screen({ label, children }: { label: string; children: ReactNode }) {
  const atm = useContext(ScreenAtmosphere);
  return <main className={s.screen} aria-label={label}>{atm && <div className={s.atm} aria-hidden="true">{atm}</div>}{children}</main>;
}
