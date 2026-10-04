/** 图标风格候选（/lab 预览中，用户选定前 Icon 仍用现行一套）：
 *  geo  = iconref1 实心几何：只用三角、圆、方拼形，没有描边；
 *  cut  = iconref2 断笔线性：2 号圆头描边，故意留缺口、斜切；
 *  trace = iconmotionref1 运动轨迹：同 cut 的线稿，描边从透明渐变到实色，选中时沿路径画出来。 */
import { createContext } from 'react';

export type IconStyle = 'current' | 'geo' | 'cut' | 'trace';
export const IconStyleCtx = createContext<IconStyle>('current');

/** 实心几何（fill，evenodd） */
export const GEO: Record<string, string> = {
  home: 'M12 2.5 21.5 11v10.5h-7v-6h-5v6h-7V11z',
  body: 'M12 2a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 0 1 12 2zM4.5 9.8h15L15 22H9z',
  gains: 'M2.5 21.5 21.5 2.5v19z',
  log: 'M3 3h18v5H3zm0 6.5h18v5H3zM3 16h11v5H3z',
  me: 'M12 2.5a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zM3.5 21.5V18a4.5 4.5 0 0 1 4.5-4.5h8a4.5 4.5 0 0 1 4.5 4.5v3.5z',
  check: 'M2.5 12.5 6 9l4 4L18 5l3.5 3.5L10 20z',
  timer: 'M12 2.5a9.5 9.5 0 1 1-9.5 9.5H12z',
  back: 'M16 2.5 6.5 12l9.5 9.5z',
  plus: 'M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z',
  star: 'M12 1.5 14.6 9.4 22.5 12l-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z',
};

/** 断笔线性（stroke，圆头；每个 d 可含多段） */
export const CUT: Record<string, string> = {
  home: 'M3.5 11.5 12 4l8.5 7.5M6 14v6h4.5M14.5 20H18v-6M10.5 20v-4h3v4',
  body: 'M13.6 4.4A2.3 2.3 0 1 0 12 8M7 21l1.8-9.5h6.4L17 21M6 13.5l3-2M18 13.5l-3-2',
  gains: 'M3.5 18l5-5.5 4 3.5 6.5-8M14.5 7.5h5v5',
  log: 'M14 3.5H6v17h12v-12M9 11.5h6M9 15.5h3.5M17 3.5l1 1',
  me: 'M9.4 9.3A3.4 3.4 0 1 1 12 10.8M4.5 20.5c.9-3.6 3.9-5.8 7.5-5.8 1.6 0 3.1.4 4.3 1.2M19 18.5l.5 2',
  check: 'M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7.5M8 11.5l3.5 3.5L20.5 6',
  timer: 'M12 8v4.5l3 2M19.2 9A8 8 0 1 1 14.5 4.9M10 2h4M18.5 5.5l1-1',
  back: 'M10 5.5 3.5 12l6.5 6.5M7 12h13.5',
  plus: 'M12 4v6.5M12 14v6M4 12h6.5M14 12h6',
  star: 'M12 3.5l2.3 5.6 6 .5-4.6 3.9 1.4 5.9L12 16.3 6.9 19.4l1.4-5.9-4.6-3.9 6-.5z',
};
