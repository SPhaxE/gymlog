import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from './config';
import { demoEnv } from './demo';
import { headStats, landmarks, volumeBonuses } from './stats';
import { learnPersonalFactors } from './personal';
import { DAYS, entry, NOW, session } from './testkit';
import type { Profile } from './types';

const env = demoEnv({ ...DEFAULT_CONFIG, personal: { ...DEFAULT_CONFIG.personal, enabled: false }, volumeBonus: { ...DEFAULT_CONFIG.volumeBonus, enabled: false } });
const full = demoEnv();
const profile: Profile = { experience: 'intermediate', equipment: ['barbell', 'dumbbell', 'machine', 'cable', 'smith', 'bodyweight'], minutes: 60, gender: 'male' };
const head = (id: string) => env.heads.get(id)!;
const BENCH = 'barbell-bench-press-4'; // 主练中下胸，协同上胸
const W = [[60, 8], [60, 8], [60, 8]] as [number, number][];

describe('容量地标与近 7 天容量（ia §1.10）', () => {
  it('三条地标按肌群大小缩放：大 8/16/22、中 7/13/18、小 5/10/14', () => {
    expect(landmarks(env, head('mid-lower-pectoralis'))).toMatchObject({ mev: 8, mav: 16, mrv: 22 });
    expect(landmarks(env, head('lateral-deltoid'))).toMatchObject({ mev: 7, mav: 13, mrv: 18 });
    expect(landmarks(env, head('tibialis'))).toMatchObject({ mev: 5, mav: 10, mrv: 14 });
  });
  it('主练 1 组记 1、协同记 0.5；热身组和跳过的动作不计', () => {
    const h = [session(30, [entry(BENCH, [...W]), { exerciseId: BENCH, skipped: true, sets: [{ type: 'work', weightKg: 60, reps: 8 }] }]),
      session(29, [{ exerciseId: BENCH, skipped: false, sets: [{ type: 'warmup', weightKg: 40, reps: 8 }] }])];
    const st = headStats(env, h, profile, NOW);
    expect(st.get('mid-lower-pectoralis')!.sets7d).toBe(3);
    expect(st.get('upper-pectoralis')!.sets7d).toBe(1.5);
  });
  it('近 7 天是滚动 7 天：8 天前的不算', () => {
    const st = headStats(env, [session(DAYS(8), [entry(BENCH, W)]), session(DAYS(2), [entry(BENCH, W)])], profile, NOW);
    expect(st.get('mid-lower-pectoralis')!.sets7d).toBe(3);
  });
  it('档位：未练 / 不足 / 达标 / 超量', () => {
    const many = Array.from({ length: 8 }, (_, i) => session(DAYS(1) + i, [entry(BENCH, W)]));
    const st = headStats(env, many, profile, NOW);
    expect(st.get('mid-lower-pectoralis')!.level).toBe('over'); // 24 > 22
    expect(st.get('upper-pectoralis')!.level).toBe('ok'); // 12：8–22
    expect(st.get('lateral-deltoid')!.level).toBe('none');
    expect(headStats(env, [session(30, [entry(BENCH, W)])], profile, NOW).get('mid-lower-pectoralis')!.level).toBe('low');
  });
});

describe('恢复度与时相（ia §1.3、§1.10）', () => {
  it('从未练过：不显示恢复度（null），时相 untrained', () => {
    const st = headStats(env, [], profile, NOW).get('lateral-deltoid')!;
    expect(st.recovery).toBeNull();
    expect(st.phase).toBe('untrained');
  });
  it('窗口 = 基础 × 训练量 × 力竭度 × 经验：大肌群 3 组、力竭度 8、进阶 → 72 × 0.8 = 57.6 小时', () => {
    const st = headStats(env, [session(10, [entry(BENCH, W)])], profile, NOW).get('mid-lower-pectoralis')!;
    expect(st.windowHours).toBeCloseTo(57.6, 9);
    expect(st.hoursSince).toBeCloseTo(10, 9);
  });
  it('力竭度系数 ≤6 / ≤8 / ≤9 / >9 → 0.85 / 1.0 / 1.15 / 1.3', () => {
    const w = (x: number) => headStats(env, [session(1, [entry(BENCH, W)], { exertion: x })], profile, NOW).get('mid-lower-pectoralis')!.windowHours!;
    expect([w(6), w(8), w(9), w(10)].map((v) => v / w(8))).toEqual([0.85, 1, 1.15, 1.3].map((k) => expect.closeTo(k, 9)));
  });
  it('经验系数：新手恢复慢、高阶恢复快', () => {
    const w = (experience: Profile['experience']) => headStats(env, [session(1, [entry(BENCH, W)])], { ...profile, experience }, NOW).get('mid-lower-pectoralis')!.windowHours!;
    expect(w('novice')).toBeGreaterThan(w('intermediate'));
    expect(w('advanced')).toBeLessThan(w('intermediate'));
  });
  it('四档时相：修复期 < 50% ≤ 恢复中 < 100% ≤ 黄金窗 < 2 倍窗口 ≤ 已回落', () => {
    const at = (h: number) => headStats(env, [session(h, [entry(BENCH, W)])], profile, NOW).get('mid-lower-pectoralis')!.phase;
    expect([at(10), at(40), at(70), at(130)]).toEqual(['repair', 'recovering', 'golden', 'decayed']);
  });
  it('恢复从训练结束算，不从开始算', () => {
    const s = session(5, [entry(BENCH, W)], { durationMin: 120 });
    expect(headStats(env, [s], profile, NOW).get('mid-lower-pectoralis')!.hoursSince).toBeCloseTo(5, 9);
  });
});

describe('个人恢复系数自学习（V1 ⑥）', () => {
  const pair = (second: number) => [session(50, [entry(BENCH, [[60, 8], [60, 8], [60, 8]])]), session(10, [entry(BENCH, [[second, 8], [second, 8], [second, 8]])])];
  it('恢复快（间隔短于窗口仍没退步）→ 系数下调', () => {
    expect(learnPersonalFactors(full, pair(62.5), profile).get('mid-lower-pectoralis')).toBeLessThan(1);
  });
  it('恢复慢（退步了）→ 系数上调，并让恢复窗口变长', () => {
    const h = pair(55);
    expect(learnPersonalFactors(full, h, profile).get('mid-lower-pectoralis')).toBeGreaterThan(1);
    expect(headStats(full, h, profile, NOW).get('mid-lower-pectoralis')!.windowHours).toBeGreaterThan(headStats(env, h, profile, NOW).get('mid-lower-pectoralis')!.windowHours!);
  });
});

describe('容量进阶（ia §1.10：连续多周吃满最低有效量 → 每周 +1，最多 +4）', () => {
  const weekly = (weeks: number) => Array.from({ length: weeks }, (_, w) => session(DAYS(7 * (w + 1) + 1), [entry(BENCH, W), entry(BENCH, W), entry(BENCH, W)]));
  it('连续 2 周都 ≥ 最低有效量 → +2：适宜量 +2、最低有效量 +1', () => {
    const b = volumeBonuses(full, weekly(2), NOW);
    expect(b.get('mid-lower-pectoralis')).toBe(2);
    expect(headStats(full, weekly(2), profile, NOW).get('mid-lower-pectoralis')).toMatchObject({ mev: 9, mav: 18, mrv: 24 });
  });
  it('最多 +4', () => {
    expect(volumeBonuses(full, weekly(6), NOW).get('mid-lower-pectoralis')).toBe(4);
  });
});
