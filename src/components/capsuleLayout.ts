/** 胶囊列的几何（纯函数，可测）：总高固定，放大的部分由其余胶囊让出来（像 Dock）。
 *  mag：手指位置（浮点下标），null = 静止。离手指最近的一颗放到 capsule-focus-h，其余按余弦权重（半径 magnifier-radius）插值到 capsule-near-h。 */
import { T } from '../styles/tokens.gen';

export interface CapBox { i: number; x: number; y: number; w: number; h: number; weight: number; focus: boolean }

export function cosineWeight(d: number, radius = T['motion/magnifier-radius']) {
  return d < radius ? 0.5 * (1 + Math.cos((Math.PI * d) / radius)) : 0;
}

export function capsuleLayout(n: number, height: number, left: number, right: number, mag: number | null): { caps: CapBox[]; top: number; rest: number } {
  const gap = T['size/capsule-gap'];
  const nearest = mag == null ? -1 : Math.max(0, Math.min(n - 1, Math.round(mag)));
  const weights = Array.from({ length: n }, (_, i) => (mag == null ? 0 : cosineWeight(Math.abs(i - mag))));
  const target = (i: number) => (i === nearest ? T['size/capsule-focus-h'] : T['size/capsule-near-h']);
  const sumW = weights.reduce((a, w) => a + w, 0), sumTW = weights.reduce((a, w, i) => a + target(i) * w, 0);
  // base·Σ(1−w) + Σ target·w = 总高 − 间距；静止高度不超过 capsule-rest-max-h
  const rest = Math.min(T['size/capsule-rest-max-h'], n ? (height - gap * (n - 1) - sumTW) / Math.max(1, n - sumW) : 0);
  let y = 0;
  const caps = weights.map((w, i) => {
    const h = rest + (target(i) - rest) * w, grow = (i === nearest ? T['size/capsule-focus-grow'] : T['size/capsule-near-grow']) * w;
    const box = { i, x: left - grow, y, w: right - left + grow, h, weight: i === nearest ? w : w * 0.4, focus: i === nearest };
    y += h + gap;
    return box;
  });
  return { caps, top: Math.max(0, (height - (y - gap)) / 2), rest };
}

/** 触点 y（相对轨道顶）→ 浮点下标：按静止时的均分算，胶囊之间没有死区（ia §1.10 命中规则） */
export function indexAt(y: number, height: number, n: number) {
  return Math.max(0, Math.min(n - 1, (y / height) * n - 0.5));
}
