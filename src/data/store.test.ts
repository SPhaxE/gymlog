import { describe, expect, it } from 'vitest';
import { growth } from '../engine';
import { env, homeData } from './demo';
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
  it('成长状态合理：每天（周一到周日）载入，没有一周被判违规，连胜是长连胜，减量周按计划算守约', () => {
    for (let d = 0; d < 7; d++) {
      const now = new Date(2026, 9, 5 + d, 18).getTime();
      const st = demoState(now);
      const g = growth(env, { history: st.history, profile: st.profile, now, deloads: st.deloads });
      expect(g.streak.history.filter((w) => w.violation).map((w) => new Date(w.start).toISOString().slice(0, 10)), `第 ${d} 天`).toEqual([]);
      expect(g.streak.weeks, `第 ${d} 天`).toBeGreaterThanOrEqual(15);
      expect(g.streak.history.some((w) => w.status === 'deload'), `第 ${d} 天`).toBe(true);
      expect(st.deloads.length).toBeGreaterThan(3);
    }
  });
  it('只有昨天以前的训练（今天还没练）', () => {
    const now = new Date(2026, 9, 6, 18).getTime();
    expect(demoState(now).history.every((s) => s.startMs < new Date(2026, 9, 6).getTime())).toBe(true);
  });
});
