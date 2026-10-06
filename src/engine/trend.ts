/** 趋势方向（ia §1.9）：与上一次相比 ±trendEps 以内算持平。
 *  减量信号（deload.ts）、处方的「先不加重」（load.ts）、增量页的涨跌（data/gains.ts）都走这一个函数，口径只有一个。 */
export type TrendDir = 'up' | 'down' | 'flat';

export function trendDir(prev: number, cur: number, eps: number): TrendDir {
  if (cur > prev * (1 + eps)) return 'up';
  if (cur < prev * (1 - eps)) return 'down';
  return 'flat';
}
