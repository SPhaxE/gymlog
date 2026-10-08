import { describe, expect, it } from 'vitest';
import { CUT } from './iconSets';
import { goesRightOrUp, parseStroke, reverseStroke, strokeToD, strokeWindow, tracePlan } from './iconTrace';

const s = (d: string) => parseStroke(d)!;

describe('选中图标描线：从下到上优先，再从左到右（2026-10-06 / 2026-10-08 用户）', () => {
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
  it('方向：横笔往右，竖笔往上（y 向下）', () => {
    expect(goesRightOrUp(s('M2 12H20'))).toBe(true);
    expect(goesRightOrUp(s('M20 12H2'))).toBe(false);
    expect(goesRightOrUp(s('M12 20V4'))).toBe(true);
    expect(goesRightOrUp(s('M12 4V20'))).toBe(false);
  });
  it('从下到上优先于从左到右（2026-10-08 用户）：斜笔只要偏离水平超过 15° 就往上画，哪怕横向走得更多', () => {
    expect(goesRightOrUp(s('M2 4L20 12'))).toBe(false);   // 往右下：横向为主，但有明显下行 → 要反过来从右下往左上画
    expect(goesRightOrUp(s('M20 12L2 4'))).toBe(true);
    expect(goesRightOrUp(s('M2 12L20 13'))).toBe(true);   // 几乎水平：还是从左往右
    const [p] = tracePlan(['M2 4L20 12']);
    expect(parseStroke(p.d)!.start).toEqual([20, 12]);
  });
  it('起笔顺序：先下后上，一样高再先左后右', () => {
    // 右边偏低的一笔（y = 18）比左边偏高的一笔（y = 14）先画；旧规则（x − y）会先画左边那笔
    expect(tracePlan(['M2 14H6', 'M16 18H22']).map((x) => x.order)).toEqual([1, 0]);
    expect(tracePlan(['M12 20H18', 'M2 21H8']).map((x) => x.order)).toEqual([1, 0]);   // 差不到 1.5：一样高，左边先
  });
  it('闭合折线：从最下面的顶点起笔、先往上走', () => {
    const [p] = tracePlan(['M4 4H20V20H4Z']);
    const q = parseStroke(p.d)!;
    expect(q.start).toEqual([4, 20]);
    expect(q.segs[0].to[1]).toBeLessThan(20);
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
