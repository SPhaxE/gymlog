/** 增长层规则（brief §3–§4，ia §1.14–§1.15）的逐条测试 */
import { describe, expect, it } from 'vitest';
import { demoEnv } from './demo';
import { exerciseWeight, growth, GROWTH_CONFIG, pickRewards, weekStart, weeklyTarget, type GrowthEvent } from './growth';
import { SIM_START } from './growth.sim';
import { DAY } from './sets';
import type { Profile, Session } from './types';

const env = demoEnv();
const P: Profile = { experience: 'intermediate', equipment: ['barbell', 'dumbbell', 'machine', 'cable', 'smith', 'bodyweight'], minutes: 60, gender: 'male' };
const MON = SIM_START; // 周一
const at = (week: number, day: number, hour = 18) => MON + (week * 7 + day) * DAY + hour * 3600e3;
let n = 0;
/** 一次训练：[动作, 重量, 次数][]，每个动作 3 组 */
const S = (ms: number, lifts: [string, number, number][]): Session => ({
  id: `t${n++}`, startMs: ms, durationMin: 60, exertion: 8,
  exercises: lifts.map(([id, w, r]) => ({ exerciseId: id, skipped: false, sets: [0, 1, 2].map(() => ({ type: 'work' as const, weightKg: w, reps: r })) })),
});
const SQ = 'barbell-squat-8', BP = 'barbell-bench-press-4', CURL = 'barbell-curl-1', ROW = 'machine-pulldown-23';
/** 一周 3 练：周一下肢、周三上肢、周五下肢（互不冲突，不违反恢复） */
const week = (w: number, sq = 100, bp = 80) => [S(at(w, 0), [[SQ, sq, 5]]), S(at(w, 2), [[BP, bp, 5], [ROW, 60, 8]]), S(at(w, 4), [[SQ, sq, 5]])];

describe('牛龄（成长值）', () => {
  it('没有历史：牛犊 1 级、连胜 0、离下一级差完整一级', () => {
    const g = growth(env, { history: [], profile: P, now: at(0, 3) });
    expect(g.level).toBe(0); expect(g.stage).toBe('newborn'); expect(g.sub).toBe(1);
    expect(g.streak.weeks).toBe(0);
    expect(g.next?.need).toBe(GROWTH_CONFIG.levels[1]);
  });

  it('第一次是基线不加分；创新高按相对增幅加分，并计一次 PR', () => {
    const h = [S(at(0, 0), [[SQ, 100, 5]]), S(at(0, 4), [[SQ, 102.5, 5]])];
    const g = growth(env, { history: h, profile: P, now: at(0, 5) });
    expect(g.points).toBeCloseTo(2.5 * 1 + GROWTH_CONFIG.prPoints, 1); // 深蹲：大肌群复合 ×1
    expect(g.events.filter((e) => e.kind === 'pr')).toHaveLength(1);
  });

  it('每动作每周增幅封顶、PR 每周只计一次', () => {
    const h = [S(at(0, 0), [[SQ, 100, 5]]), S(at(0, 2), [[SQ, 105, 5]]), S(at(0, 4), [[SQ, 110, 5]])];
    const g = growth(env, { history: h, profile: P, now: at(0, 6) });
    expect(g.points).toBeCloseTo(GROWTH_CONFIG.weeklyCapPct + GROWTH_CONFIG.prPoints, 1);
  });

  it('动作分量：大肌群复合 1、中 0.6、小 0.3', () => {
    expect(exerciseWeight(env, env.ex.get(SQ)!)).toBe(1);
    expect(exerciseWeight(env, env.ex.get('barbell-overhead-press-303')!)).toBe(0.6);
    expect(exerciseWeight(env, env.ex.get(CURL)!)).toBe(0.3);
  });

  it('删掉一次训练会重算（可能降级）', () => {
    const h = [...week(0), ...week(1, 105, 82.5), ...week(2, 110, 85), ...week(3, 115, 87.5)];
    const full = growth(env, { history: h, profile: P, now: at(4, 0) });
    const cut = growth(env, { history: h.filter((s) => s.id !== h[10].id), profile: P, now: at(4, 0) }); // 删掉第 4 周唯一一次卧推
    expect(cut.points).toBeLessThan(full.points);
  });

  it('下一级给可行动的说法：主项再涨多少 kg、或再完成几个周期', () => {
    const g = growth(env, { history: [...week(0), ...week(1, 102.5)], profile: P, now: at(2, 0) });
    expect(g.next?.lift?.exerciseId).toBe(SQ);
    expect(g.next!.lift!.kg).toBeGreaterThan(0);
    expect(g.next!.cycles).toBeGreaterThan(0);
  });
});

describe('守约周连胜', () => {
  it('目标次数：新手 3；进阶 / 高阶单次 ≤ 45 分钟 4 次，否则 3 次', () => {
    expect(weeklyTarget({ ...P, experience: 'novice', minutes: 30 })).toBe(3);
    expect(weeklyTarget({ ...P, minutes: 45 })).toBe(4);
    expect(weeklyTarget(P)).toBe(3);
  });

  it('练够次数算守约，连胜 + 1，发 +50 牛劲', () => {
    const g = growth(env, { history: week(0), profile: P, now: at(1, 1) });
    expect(g.streak.weeks).toBe(1);
    expect(g.niujin.ledger.some((r) => r.label === '守约周' && r.amount === 50)).toBe(true);
  });

  it('在恢复度 < 50% 时练同一肌头，这周不算守约', () => {
    const bad = [S(at(0, 0, 8), [[SQ, 100, 5]]), S(at(0, 0, 14), [[SQ, 100, 5]]), S(at(0, 2), [[BP, 80, 5]]), S(at(0, 4), [[BP, 80, 5]])];
    const g = growth(env, { history: bad, profile: P, now: at(1, 1) });
    expect(g.streak.history[0].violation).toBe(true);
    expect(g.streak.weeks).toBe(0);
  });

  it('漏练：没有冻结卡就断；有冻结卡自动用一张，连胜保住（冻结周不加周数）', () => {
    const h = [...week(0), S(at(1, 0), [[SQ, 100, 5]]), ...week(2)];
    expect(growth(env, { history: h, profile: P, now: at(3, 1) }).streak.weeks).toBe(1);
    const g = growth(env, { history: h, profile: P, now: at(3, 1), wallet: [{ atMs: at(0, 1), kind: 'redeem', label: '连胜冻结卡', cost: 300, freeze: 1 }] });
    expect(g.streak.weeks).toBe(2);
    expect(g.streak.history[1].status).toBe('frozen');
    expect(g.streak.freezeCards).toBe(0);
    expect(g.events.some((e) => e.kind === 'freeze')).toBe(true);
  });

  it('减量周少练一次也算守约，且距上个周期 ≥ 3 周时算完成一个训练周期', () => {
    const deload = at(3, 0, 8);
    const h = [...week(0), ...week(1), ...week(2), S(at(3, 0), [[SQ, 90, 5]]), S(at(3, 3), [[BP, 70, 5]])];
    const g = growth(env, { history: h, profile: P, now: at(4, 1), deloads: [deload] });
    expect(g.streak.history[3].status).toBe('deload');
    expect(g.streak.weeks).toBe(4);
    expect(g.events.some((e) => e.kind === 'cycle')).toBe(true);
    expect(g.events.some((e) => e.kind === 'streak' && e.weeks === 4)).toBe(true); // 连胜 4 周里程碑
  });

  it('本周还没练够：剩余天数够就是 open，不够就是 risk（快断）', () => {
    const open = growth(env, { history: [S(at(0, 0), [[SQ, 100, 5]])], profile: P, now: at(0, 1, 9) });
    expect(open.streak.current?.status).toBe('open');
    const risk = growth(env, { history: [S(at(0, 0), [[SQ, 100, 5]])], profile: P, now: at(0, 6, 9) });
    expect(risk.streak.current?.status).toBe('risk');
  });
});

describe('牛劲与奖励', () => {
  it('完成训练一天只算一次；会员期间 ×1.5', () => {
    const h = [S(at(0, 0, 8), [[SQ, 100, 5]]), S(at(0, 0, 19), [[BP, 80, 5]])];
    const free = growth(env, { history: h, profile: P, now: at(0, 1) });
    expect(free.niujin.ledger.filter((r) => r.label === '完成训练')).toHaveLength(1);
    const pro = growth(env, { history: h, profile: P, now: at(0, 1), pro: { fromMs: MON, toMs: at(5, 0) } });
    expect(pro.niujin.ledger.find((r) => r.label === '完成训练')!.amount).toBe(15);
  });

  it('兑换扣牛劲', () => {
    const g = growth(env, { history: week(0), profile: P, now: at(1, 1), wallet: [{ atMs: at(1, 0, 20), kind: 'redeem', label: '免邮券', cost: 30 }] });
    expect(g.niujin.ledger.at(-1)!.amount).toBe(-30);
    expect(g.niujin.balance).toBe(30 + 50 - 30);
  });

  it('奖励弹窗只弹一个：升段 > PR > 连胜里程碑 > 升小级 > 周期完成，其余进消息', () => {
    const ev = (kind: GrowthEvent['kind'], atMs: number): GrowthEvent => ({ kind, atMs, niujin: 0 });
    const events = [ev('cycle', 5), ev('level', 6), ev('pr', 7), ev('streak', 8), ev('stage', 9), ev('week', 9)];
    const r = pickRewards(events, 4);
    expect(r.popup?.kind).toBe('stage');
    expect(r.messages.map((e) => e.kind).sort()).toEqual(['cycle', 'level', 'pr', 'streak', 'week']);
    expect(pickRewards(events, 9).popup).toBeNull();
  });

  it('周从周一开始', () => {
    expect(weekStart(at(0, 6, 23))).toBe(MON);
    expect(weekStart(at(1, 0, 0))).toBe(MON + 7 * DAY);
  });
});
