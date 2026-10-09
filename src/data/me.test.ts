import { beforeEach, describe, expect, it } from 'vitest';
import type { GrowthEvent, GrowthState } from '../engine';
import { deleteSession } from './session';
import { demoteNote, deloadsOf, eventTitle, growthLog, growthOf, levelLabel, LIFT_MAX, messagesOf, nextGoal, riskOf, unreadOf } from './me';
import { demoRiskState, demoState, riskDemoNow, store } from './store';

const NOW = new Date(2026, 9, 6, 18, 0).getTime();
const at = (d: number, h = 18) => new Date(2026, 8, d, h).getTime();

/** 手搭一个成长状态（只填被测函数读的字段） */
const G = (o: Partial<GrowthState> & { events?: GrowthEvent[] } = {}): GrowthState => ({
  points: 100, level: 7, stage: 'sturdy', sub: 2, next: { need: 5, progress: 0.62, lift: { exerciseId: 'barbell-bench-press-4', name: '杠铃卧推', kg: 3 }, cycles: 1 },
  streak: { weeks: 9, best: 9, freezeCards: 1, current: null, history: [] }, niujin: { balance: 0, ledger: [] }, events: [], ...o,
});
const E = (kind: GrowthEvent['kind'], atMs: number, o: Partial<GrowthEvent> = {}): GrowthEvent => ({ kind, atMs, niujin: 30, ...o });

describe('牛龄与离下一级', () => {
  it('演示用户：公牛段、长连胜（每个星期几载入都一样）', () => {
    const st = demoState(NOW), g = growthOf({ history: st.history, profile: st.profile, deloads: st.deloads }, NOW);
    expect(g.stage).toBe('bull');
    expect(g.streak.weeks).toBeGreaterThanOrEqual(15);
    expect(levelLabel(g)).toMatch(/^公牛 · [123] 级$/);
  });
  it('场景数据源：减量状态 adopted 当一次减量周；没有就是空', () => {
    expect(deloadsOf({ status: 'adopted', atMs: 5 })).toEqual([5]);
    expect(deloadsOf({ status: 'dismissed', atMs: 5 })).toEqual([]);
    expect(deloadsOf({ status: 'adopted', atMs: 5 }, [1, 2])).toEqual([1, 2]);
  });
  it('涨幅合理就写「再涨 X kg」+ 周期；涨幅太大（演示用户是 47.5 kg）不写 kg，只剩周期', () => {
    expect(nextGoal(G())).toEqual({ pct: 62, lift: { name: '杠铃卧推', kg: 3 }, cycles: 1, stageUp: false });
    const far = G({ next: { need: 51, progress: 0.01, lift: { exerciseId: 'x', name: '杠铃卧推', kg: LIFT_MAX + 0.5 }, cycles: 5 } });
    expect(nextGoal(far)).toEqual({ pct: 1, lift: null, cycles: 5, stageUp: false });
    expect(nextGoal(G({ sub: 3 }))!.stageUp).toBe(true);
    expect(nextGoal(G({ next: null }))).toBeNull();
    const st = demoState(NOW), g = growthOf({ history: st.history, profile: st.profile, deloads: st.deloads }, NOW);
    expect(nextGoal(g)!.lift).toBeNull();
  });
});

describe('成长记录', () => {
  const g = G({
    events: [
      E('level', at(10), { level: 7 }), E('pr', at(20), { sessionId: 'a', exerciseName: '杠铃深蹲', fromKg: 142, toKg: 145 }), E('week', at(28), { weeks: 9, niujin: 0 }), E('freeze', at(21), { weeks: 8, niujin: 0 }),
      E('pr', at(12), { sessionId: 'b', exerciseName: '引体向上', fromKg: 10, toKg: 12 }), E('pr', at(12), { sessionId: 'b', exerciseName: '杠铃卧推', fromKg: 90, toKg: 92 }),
    ],
  });
  it('新的在前；只记里程碑，守约周不进；同一次训练的几个 PR 合成一行', () => {
    const rows = growthLog(g);
    expect(rows.map((r) => r.kind)).toEqual(['freeze', 'pr', 'pr', 'level']);
    expect(rows[0]).toMatchObject({ title: '冻结卡自动使用', niujin: null });
    expect(rows[1]).toMatchObject({ title: 'PR：杠铃深蹲 142 → 145 kg', niujin: 30 });
    expect(rows[1].detail).toBeUndefined();
    expect(rows[2]).toMatchObject({ title: '新纪录 2 个', detail: '引体向上、杠铃卧推', niujin: 60 });
    expect(rows[3].title).toBe('升级：壮牛 2 级');
  });
  it('降级说明按时间插进记录里', () => {
    const rows = growthLog(g, [{ atMs: at(25), kind: 'demote', text: '连胜 9 周 → 0 周' }]);
    expect(rows.map((r) => r.kind)).toEqual(['demote', 'freeze', 'pr', 'pr', 'level']);
    expect(rows[0]).toMatchObject({ title: '删除训练后重新计算', detail: '连胜 9 周 → 0 周', niujin: null });
  });
  it('事件的一句话：升段、连胜、训练周期', () => {
    expect(eventTitle(E('stage', 1, { level: 9 }))).toBe('升段：公牛');
    expect(eventTitle(E('streak', 1, { weeks: 12 }))).toBe('连胜 12 周');
    expect(eventTitle(E('cycle', 1, { weeks: 3 }))).toBe('完成第 3 个训练周期');
  });
});

describe('删除训练后的降级说明（ia §1.14）', () => {
  it('牛龄或连胜回退才写；没回退不写', () => {
    expect(demoteNote(G(), G(), NOW)).toBeNull();
    const down = G({ level: 6, stage: 'sturdy', sub: 1 });
    expect(demoteNote(G(), down, NOW)).toEqual({ atMs: NOW, kind: 'demote', text: '牛龄 壮牛 · 2 级 → 壮牛 · 1 级' });
    const broken = G({ streak: { weeks: 0, best: 9, freezeCards: 1, current: null, history: [] } });
    expect(demoteNote(G(), broken, NOW)!.text).toBe('连胜 9 周 → 0 周');
    expect(demoteNote(G(), G({ level: 6, sub: 1, streak: broken.streak }), NOW)!.text).toContain('；');
  });

  beforeEach(() => { localStorage.clear(); store.clear(); store.update((s) => ({ ...s, ...demoState(NOW) })); });
  it('删上周的一次训练：那周练不够，连胜断了，成长记录里多一条说明（存储里）', () => {
    expect(store.get().notes).toEqual([]);
    expect(deleteSession('sim-intermediate-32-3', NOW)).toBe(true);
    const n = store.get().notes;
    expect(n).toHaveLength(1);
    expect(n[0].atMs).toBe(NOW);
    expect(n[0].text).toContain('连胜');
    expect(growthLog(growthOf({ history: store.get().history, profile: store.get().profile, deloads: store.get().deloads }, NOW), n)[0]).toMatchObject({ kind: 'demote', title: '删除训练后重新计算' });
  });
  it('删一次不影响牛龄 / 连胜的训练（本周的）：没有说明', () => {
    const last = [...store.get().history].sort((a, b) => b.startMs - a.startMs)[0];
    // 昨天及更早的最后一次训练若在本周（开放周），删了不会让已结束的周掉档
    const weekStartMs = new Date(2026, 9, 5).getTime();
    if (last.startMs >= weekStartMs) { deleteSession(last.id, NOW); expect(store.get().notes).toEqual([]); }
  });
});

describe('消息（ia §1.15）', () => {
  const g = G({
    events: [
      E('level', at(1, 18), { sessionId: 's1', level: 7, niujin: 100 }), E('pr', at(1, 18), { sessionId: 's1', exerciseName: '杠铃深蹲', fromKg: 140, toKg: 142, niujin: 30 }), E('pr', at(1, 18), { sessionId: 's1', exerciseName: '杠铃卧推', fromKg: 90, toKg: 92, niujin: 30 }),
      E('pr', at(5, 18), { sessionId: 's2', exerciseName: '引体向上', fromKg: 10, toKg: 12 }),
      E('week', at(7, 23), { weeks: 3, niujin: 0 }), E('streak', at(7, 23), { weeks: 4, niujin: 100 }),
      E('freeze', at(14, 23), { weeks: 4, niujin: 0 }),
    ],
  });
  const ms = messagesOf(g);
  it('一次训练达成多项：只弹最高优先级的一个，其余合并成一条；只有一项就没有消息', () => {
    const merged = ms.find((m) => m.id === 'm-s1')!;
    expect(merged.title).toBe('同时达成 2 项');
    expect(merged.detail).toContain('升级：壮牛 2 级');
    expect(merged.detail).toBe('升级：壮牛 2 级 · PR 杠铃卧推');
    expect(merged.niujin).toBe(130);   // 弹出的是 PR（优先级比升级高），其余是 升级 100 + 另一个 PR 30
    expect(ms.some((m) => m.id === 'm-s2')).toBe(false);
  });
  it('周结算里的奖励、冻结卡自动使用各是一条；守约周不进消息', () => {
    expect(ms.find((m) => m.id.startsWith('m-streak'))).toMatchObject({ kind: 'reward', title: '连胜 4 周', niujin: 100 });
    expect(ms.find((m) => m.id.startsWith('m-freeze'))).toMatchObject({ kind: 'freeze', title: '冻结卡已自动使用', niujin: 0 });
    expect(ms.some((m) => m.title.startsWith('守约周'))).toBe(false);
  });
  it('新的在前；未读 = 比「看过消息的时刻」新', () => {
    expect(ms.map((m) => m.kind)).toEqual(['freeze', 'reward', 'reward']);
    expect(unreadOf(ms, at(7))).toBe(2);
    expect(unreadOf(ms, at(30))).toBe(0);
    expect(unreadOf(ms, 0)).toBe(3);
  });
  it('演示数据：看过消息的时刻定在 5 天前，有几条新消息', () => {
    const st = demoState(NOW), g2 = growthOf({ history: st.history, profile: st.profile, deloads: st.deloads }, NOW);
    const all = messagesOf(g2), n = unreadOf(all, st.messagesSeenAt);
    expect(all.length).toBeGreaterThan(3);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(all.length);
  });
});

describe('连胜快断（6g 补，牛龄页 StreakRisk）', () => {
  it('演示「快断」：本周日上午、这周只留一次训练 → 引擎判 risk，还差的次数 > 剩下 1 天，手上没有冻结卡；平时的演示用户不快断', () => {
    for (let d = 0; d < 7; d++) {
      const now = new Date(2026, 9, 5 + d, 18).getTime(), at = riskDemoNow(now);
      const g = growthOf(demoRiskState(now), at);
      const r = riskOf(g, at);
      expect(r?.daysLeft).toBe(1);
      expect(r!.need).toBeGreaterThan(1);
      expect(g.streak.freezeCards).toBe(0);
      expect(riskOf(growthOf(demoState(now), now), now)).toBeNull();
    }
  });
  it('没有历史的新用户：哪天打开都不提示「这周快断了」（连胜 0 周没有东西可断，2026-10-09 周五才暴露）', () => {
    for (let d = 0; d < 7; d++) {
      const now = new Date(2026, 9, 5 + d, 18).getTime();
      expect(riskOf(growthOf({ ...demoState(now), history: [] }, now), now)).toBeNull();
    }
  });
});
