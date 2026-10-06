import { describe, expect, it } from 'vitest';
import { startOfDay } from '../engine';
import { dotDays, dotMonths } from './dataviz';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const day = (y: number, m: number, d: number) => startOfDay(at(y, m, d));
const cellOf = (months: ReturnType<typeof dotMonths>, label: string, t: number) => months.find((m) => m.label === label)!.weeks.flat().find((c) => c.t === t)!;

describe('dotMonths（点阵 / 钢板日历的日期格）', () => {
  const now = at(2026, 10, 6);  // 周二
  const trained = new Set([day(2026, 8, 3), day(2026, 9, 30), day(2026, 10, 5), day(2026, 10, 6), day(2026, 10, 7)]);  // 10/7 在今天之后，不该算练过
  const months = dotMonths(trained, now, 3);

  it('近 3 个自然月，每列 7 格、从周一开始', () => {
    expect(months.map((m) => m.label)).toEqual(['8月', '9月', '10月']);
    for (const m of months) for (const col of m.weeks) { expect(col).toHaveLength(7); expect(new Date(col[0].t).getDay()).toBe(1); }
  });

  it('状态优先级：不在本月 > 今天 > 未来 > 练过 > 休息', () => {
    expect(cellOf(months, '10月', day(2026, 10, 6)).state).toBe('today');
    expect(cellOf(months, '10月', day(2026, 10, 7)).state).toBe('future');
    expect(cellOf(months, '10月', day(2026, 10, 5)).state).toBe('trained');
    expect(cellOf(months, '10月', day(2026, 10, 4)).state).toBe('rest');
    expect(cellOf(months, '8月', day(2026, 7, 27)).state).toBe('out');  // 8/1 是周六，第一列从 7/27 开始
  });

  it('今天练过时 done 为真（state 仍是 today）；未来的、不在本月的格子 done 一律为假', () => {
    expect(cellOf(months, '10月', day(2026, 10, 6))).toMatchObject({ state: 'today', done: true });
    expect(cellOf(months, '10月', day(2026, 10, 7)).done).toBe(false);
    for (const m of months) for (const c of m.weeks.flat()) if (c.state === 'out') expect(c.done).toBe(false);
  });

  it('跨月的那一周在两个月里各出现一次，练过的日子只在它自己的月里算一次', () => {
    const sep30 = day(2026, 9, 30);
    expect(cellOf(months, '9月', sep30)).toMatchObject({ state: 'trained', done: true });
    expect(cellOf(months, '10月', sep30)).toMatchObject({ state: 'out', done: false });
    expect(dotDays(months)).toBe(4);  // 8/3、9/30、10/5、10/6
  });

  it('没练过任何一天：0 天', () => {
    expect(dotDays(dotMonths(new Set(), now, 3))).toBe(0);
  });
});
