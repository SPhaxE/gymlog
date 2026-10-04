import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrendChart } from './charts';

describe('TrendChart', () => {
  it('倒序传入也按时间正序画（ia §1.9：V1 把进步画成了退步）', () => {
    const pts = [{ t: 3, v: 107.5, label: 'c' }, { t: 1, v: 100, label: 'a' }, { t: 2, v: 102.5, label: 'b' }];
    const { container } = render(<TrendChart points={pts} />);
    const xy = container.querySelector('polyline')!.getAttribute('points')!.split(' ').map((p) => p.split(',').map(Number));
    expect(xy.map(([x]) => x)).toEqual([...xy.map(([x]) => x)].sort((a, b) => a - b));
    // 越新越重 → y 越小（越靠上）
    expect(xy[0][1]).toBeGreaterThan(xy[2][1]);
  });
  it('少于 2 次不画线，并提示再练一次', () => {
    const { container, getByText } = render(<TrendChart points={[{ t: 1, v: 100, label: 'a' }]} />);
    expect(container.querySelector('polyline')).toBeNull();
    getByText('再练一次就能看到趋势');
  });
});
