import { describe, expect, it } from 'vitest';
import { CUT } from './iconSets';
import { goesRightOrUp, parseStroke, reverseStroke, strokeToD, strokeWindow, tracePlan } from './iconTrace';

const s = (d: string) => parseStroke(d)!;

describe('选中图标描线：从左到右、从下到上（2026-10-06 用户）', () => {
  it('解析 M / L / H / V / A（大小写），相对坐标转成绝对坐标', () => {
    const p = s('M4 11l8-7h3v2A2 2 0 0 1 17 9');
    expect(p.start).toEqual([4, 11]);
    expect(p.segs.map((g) => g.to)).toEqual([[12, 4], [15, 4], [15, 6], [17, 9]]);
    expect(parseStroke('M0 0C1 1 2 2 3 3')).toBeNull();   // 图标集没有的命令：不动它
  });
  it('反转：从终点出发逐段倒着走，弧线扫掠取反；再反一次回到原样', () => {
    const p = s('M2 2L10 2A4 4 0 0 1 14 6');
    const r = reverseStroke(p);
    expect(r.start).toEqual([14, 6]);
    expect(r.segs).toEqual([{ k: 'A', to: [10, 2], rx: 4, ry: 4, rot: 0, large: 0, sweep: 0 }, { k: 'L', to: [2, 2] }]);
    expect(strokeToD(reverseStroke(r))).toBe(strokeToD(p));
  });
  it('方向：横向为主要往右，竖向为主要往上（y 向下）', () => {
    expect(goesRightOrUp(s('M2 12H20'))).toBe(true);
    expect(goesRightOrUp(s('M20 12H2'))).toBe(false);
    expect(goesRightOrUp(s('M12 20V4'))).toBe(true);
    expect(goesRightOrUp(s('M12 4V20'))).toBe(false);
  });
  it('图标集里每一笔定好方向后都是往右或往上', () => {
    for (const [name, d] of Object.entries(CUT)) {
      for (const { d: od } of tracePlan(d.split(/(?=M)/))) {
        const p = parseStroke(od);
        if (p) expect(goesRightOrUp(p), `${name}: ${od}`).toBe(true);
      }
    }
  });
  it('起笔顺序：左下先、右上后；每笔的窗口在 0–1 内依次错开', () => {
    const plan = tracePlan(['M14 4H20', 'M2 20H8', 'M8 12H14']);   // 右上、左下、中间
    expect(plan.map((x) => x.order)).toEqual([2, 0, 1]);
    expect(strokeWindow(0, 3)).toEqual([0, 0.6]);
    const [a, b] = strokeWindow(2, 3);
    expect(a).toBeCloseTo(0.4); expect(b).toBeCloseTo(1);
    expect(strokeWindow(0, 1)).toEqual([0, 1]);
  });
});
