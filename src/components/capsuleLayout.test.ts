import { describe, expect, it } from 'vitest';
import { T } from '../styles/tokens.gen';
import { capsuleLayout, cosineWeight, indexAt } from './capsuleLayout';

// 轨道正好是胶囊列的最小高（每颗都在静止上限）：容量页舞台放不下时就是这个高度，放大要从其余胶囊里让
const n = 19, H = n * T['size/capsule-rest-max-h'] + (n - 1) * T['size/capsule-gap'];
const total = (c: ReturnType<typeof capsuleLayout>['caps']) => c.reduce((a, b) => a + b.h, 0) + T['size/capsule-gap'] * (c.length - 1);

describe('胶囊列几何（ia §1.10 放大镜）', () => {
  it('静止时等高，不超过 capsule-rest-max-h，整列在轨道里垂直居中', () => {
    const { caps, top } = capsuleLayout(n, H, 150, 344, null);
    expect(new Set(caps.map((c) => c.h.toFixed(3))).size).toBe(1);
    expect(caps[0].h).toBeLessThanOrEqual(T['size/capsule-rest-max-h']);
    expect(top * 2 + total(caps)).toBeCloseTo(H, 6);
  });
  it('放大时总高不变（像 Dock）：中心放到 capsule-focus-h，向左伸出 capsule-focus-grow', () => {
    const { caps } = capsuleLayout(n, H, 150, 344, 4);
    expect(total(caps)).toBeCloseTo(H, 6);
    expect(caps[4]).toMatchObject({ focus: true, h: T['size/capsule-focus-h'], x: 150 - T['size/capsule-focus-grow'] });
    expect(caps[3].h).toBeGreaterThan(caps[0].h);
    expect(caps[3].h).toBeLessThanOrEqual(T['size/capsule-near-h']);
  });
  it('余弦衰减：半径外为 0，越近越大', () => {
    expect(cosineWeight(0)).toBe(1);
    expect(cosineWeight(T['motion/magnifier-radius'])).toBe(0);
    expect(cosineWeight(1)).toBeGreaterThan(cosineWeight(2));
  });
  it('触点按均分映射到下标，两端夹住，没有死区', () => {
    expect(indexAt(0, H, n)).toBe(0);
    expect(indexAt(H, H, n)).toBe(n - 1);
    expect(Math.round(indexAt(H / 2, H, n))).toBe(9);
  });
});
