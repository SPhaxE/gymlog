/** mock/scenarios.json 的每个场景在 V1 系数下触发预期状态（移植自 scripts/verify_prototype.js），一天中三个时刻都要成立 */
import { describe, expect, it } from 'vitest';
import { buildScenario, demoEnv } from './demo';
import { deloadSignal, deloadView, type DeloadView } from './deload';
import { startOfDay } from './env';
import { prescribe, type Prescription } from './prescribe';
import { exerciseRecords, prMap } from './records';
import { headStats } from './stats';
import { summarize } from './summary';

const env = demoEnv();
const base = new Date(2026, 9, 3).getTime();
const NOWS = [base + 7.25 * 3600e3, base + 13 * 3600e3, base + 20.5 * 3600e3];

function run(id: string, now: number) {
  const sc = buildScenario(id, now);
  if (!sc.profile) return { ...sc, rx: null, dv: null };
  const dv = deloadView(env, deloadSignal(env, sc.history), sc.deload, now);
  return { ...sc, dv, rx: prescribe(env, sc.history, sc.profile, { now, deload: dv.kind === 'week' }) };
}
type Run = { rx: Prescription; dv: DeloadView; history: ReturnType<typeof buildScenario>['history'] };
const cases: [string, (r: Run) => void][] = [
  ['deload-suggested', (r) => { expect(r.rx.kind).toBe('plan'); expect(r.dv.kind).toBe('suggest'); }],
  ['plain-prescription', (r) => { expect(r.rx.kind).toBe('plan'); expect(r.dv.kind).toBe('none'); }],
  ['deload-adopted', (r) => { expect(r.rx.kind).toBe('plan'); expect(r.dv).toEqual({ kind: 'week', daysLeft: 6 }); expect(r.rx.deload).toBe(true); }],
  ['deload-dismissed', (r) => { expect(r.rx.kind).toBe('plan'); expect(r.dv.kind).toBe('note'); }],
  ['rest-day', (r) => expect(r.rx.kind).toBe('rest')],
  ['pool-exhausted', (r) => expect(r.rx.kind).toBe('pool-empty')],
  ['cold-start', (r) => { expect(r.rx.kind).toBe('plan'); expect(r.rx.items.every((i) => i.suggestion.weightKg == null)).toBe(true); }],
  ['advanced-profile', (r) => { expect(r.rx.kind).toBe('plan'); expect(r.rx.budget).toEqual({ setsPerDay: 21, exercisesPerDay: 9 }); }],
  ['done-today', (r) => expect(r.history.filter((s) => s.startMs >= startOfDay(NOWS[0])).length).toBe(1)],
];

describe('演示场景（V1 系数，早 / 午 / 晚三个时刻）', () => {
  for (const [id, check] of cases) {
    it(id, () => { for (const now of NOWS) check(run(id, now) as Run); });
  }
  it('fresh-install 没有档案；engine-error 带注入标记', () => {
    expect(buildScenario('fresh-install', NOWS[2]).profile).toBeNull();
    expect(buildScenario('engine-error', NOWS[2]).inject).toBe('engine.throw');
  });
  it('今天的训练落在「现在」之后时挪到刚结束，不会出现未来的记录', () => {
    for (const now of NOWS) for (const id of ['done-today', 'deload-suggested']) {
      for (const s of buildScenario(id, now).history) expect(s.startMs + (s.durationMin ?? 0) * 60e3).toBeLessThanOrEqual(now);
    }
  });
});

describe('演示历史的口径（P05 / P06）', () => {
  const now = NOWS[1];
  const { history, profile } = buildScenario('deload-suggested', now);
  it('demo-w0-push 创了 4 个 PR；第一次训练是基线', () => {
    expect(summarize(env, history, history.find((s) => s.id === 'demo-w0-push')!).prs).toHaveLength(4);
    expect(summarize(env, history, history[0]).first).toBe(true);
    expect([...prMap(env, history.slice(0, 1)).values()][0].size).toBe(0);
  });
  it('新动作只有 1 次记录，面拉 2 次', () => {
    expect(exerciseRecords(env, history, 'dumbbell-bulgarian-split-squat-317')).toHaveLength(1);
    expect(exerciseRecords(env, history, 'machine-face-pulls-22')).toHaveLength(2);
  });
  it('P06：有 6 个肌头从未练过', () => {
    expect([...headStats(env, history, profile!, now).values()].filter((h) => h.phase === 'untrained')).toHaveLength(6);
  });
});
