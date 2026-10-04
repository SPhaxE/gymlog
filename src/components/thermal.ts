/** 热成像渲染（/lab 预览中，用户选定前默认不开）：把肌头「近 7 天组数」按三条地标映射成热度 t ∈ [0, 1]，
 *  再用渐变映射（SVG feComponentTransfer）上色。色板只取主题色：
 *  - lime：暗 → 橄榄 → 黄绿 → 荧光 → 浅荧光（热成像感最强，但荧光会铺满人体，违反「每屏一处荧光」）；
 *  - bone：暗 → 暗骨 → 中骨 → 骨白，只有超过最大可恢复量才到荧光（荧光仍只标异常热点）。
 *  明度随 t 单调上升，不靠色相也能分出冷热。 */
import { createContext } from 'react';
import tokens from '../../design/tokens/tokens.json';
import type { HeadStat } from '../engine';

export type ThermalPalette = 'lime' | 'bone';
export type ThermalStyle = 'bloom' | 'iso' | 'scan';
export interface Thermal { palette: ThermalPalette; style: ThermalStyle }
/** null = 现行的四档明暗 + 纹理 */
export const BodyRender = createContext<Thermal | null>(null);

export const PALETTE: Record<ThermalPalette, string[]> = {
  lime: ['gray-50', 'lime-900', 'lime-700', 'lime-500', 'lime-300'],
  bone: ['gray-50', 'bone-800', 'bone-500', 'bone-100', 'lime-500'],
};

const prim = (tokens as unknown as { primitives: { color: Record<string, { value: string }> } }).primitives.color;
const rgb = (k: string) => { const h = prim[k].value.slice(1, 7); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };

/** feFuncR/G/B 的 tableValues：输入是灰度 t，输出是色板上对应的颜色 */
export function tables(p: ThermalPalette): [string, string, string] {
  const cs = PALETTE[p].map(rgb);
  return [0, 1, 2].map((ch) => cs.map((c) => c[ch].toFixed(3)).join(' ')) as [string, string, string];
}

/** CSS 里用的同一条色带（胶囊量尺联动）：在相邻两个色标之间 color-mix */
export function heatCss(t: number, p: ThermalPalette) {
  const stops = PALETTE[p], x = Math.max(0, Math.min(1, t)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
  return `color-mix(in oklab, var(--milo-prim-${stops[i + 1]}) ${Math.round(f * 100)}%, var(--milo-prim-${stops[i]}))`;
}

/** 热度：没练 0.04（人体轮廓仍可见）；0 → 最低有效量 0.12 → 0.4；→ 适宜量 0.7；→ 最大可恢复量 0.88；再往上到 1 */
export function heatOf(h: Pick<HeadStat, 'sets7d' | 'mev' | 'mav' | 'mrv'> | undefined): number {
  if (!h || !(h.sets7d > 0)) return 0.04;
  const s = h.sets7d, lerp = (a: number, b: number, x0: number, x1: number) => a + ((s - x0) / (x1 - x0)) * (b - a);
  if (s <= h.mev) return lerp(0.12, 0.4, 0, h.mev);
  if (s <= h.mav) return lerp(0.4, 0.7, h.mev, h.mav);
  if (s <= h.mrv) return lerp(0.7, 0.88, h.mav, h.mrv);
  return Math.min(1, lerp(0.88, 1, h.mrv, h.mrv * 1.5));
}
