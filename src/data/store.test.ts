import { describe, expect, it } from 'vitest';
import { homeData } from './demo';
import { demoState } from './store';

describe('演示数据', () => {
  it('连续 7 天，今天的处方里都没有「首次」（演示的第一眼要有建议重量）', () => {
    for (let d = 0; d < 7; d++) {
      const now = new Date(2026, 9, 5 + d, 18).getTime();
      const st = demoState(now);
      const h = homeData({ history: st.history, profile: st.profile, deload: st.deload }, now);
      expect(h.rx.kind).toBe('plan');
      const items = h.rx.kind === 'plan' ? h.rx.items : [];
      expect(items.filter((i) => i.suggestion.weightKg == null).map((i) => i.name), `第 ${d} 天`).toEqual([]);
    }
  });
  it('只有昨天以前的训练（今天还没练）', () => {
    const now = new Date(2026, 9, 6, 18).getTime();
    expect(demoState(now).history.every((s) => s.startMs < new Date(2026, 9, 6).getTime())).toBe(true);
  });
});
