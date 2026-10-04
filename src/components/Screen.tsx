/** 页面框（版式规则 DESIGN §4）：背景全出血，内容区左右各留 size/gutter；最宽 size/content-max-w，宽屏居中；
 *  上下避开系统栏（Capacitor 注入 --safe-area-inset-*）；底部给导航留出 nav-bar-h + nav-bottom。 */
import type { ReactNode } from 'react';
import s from './Screen.module.css';

export function Screen({ label, children }: { label: string; children: ReactNode }) {
  return <main className={s.screen} aria-label={label}>{children}</main>;
}
