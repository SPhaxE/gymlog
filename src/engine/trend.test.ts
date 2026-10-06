import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from './config';
import { trendDir } from './trend';

const eps = DEFAULT_CONFIG.trendEps;
describe('趋势方向：±1% 以内算持平（ia §1.9）', () => {
  it('阈值就是 1%', () => expect(eps).toBe(0.01));
  it('明显涨 / 跌', () => {
    expect(trendDir(100, 103, eps)).toBe('up');
    expect(trendDir(100, 97, eps)).toBe('down');
  });
  it('恰好 ±1% 算持平，刚好超过一点点才算涨跌', () => {
    expect(trendDir(100, 101, eps)).toBe('flat');
    expect(trendDir(100, 99, eps)).toBe('flat');
    expect(trendDir(100, 101.01, eps)).toBe('up');
    expect(trendDir(100, 98.99, eps)).toBe('down');
  });
  it('没变就是持平', () => expect(trendDir(100, 100, eps)).toBe('flat'));
});
