/** 对照测试：用原型的系数跑 TS 引擎，结果必须与低保真原型（prototype/engine.js）逐项一致——证明移植没改动逻辑。 */
import { describe, expect, it } from 'vitest';
import { PROTOTYPE_CONFIG } from './config';
import { buildScenario, demoEnv, demoExercises, demoMuscles, demoScenarios } from './demo';
import { deloadSignal, deloadView } from './deload';
import { headStats } from './stats';
import { prescribe } from './prescribe';

// 原型是浏览器脚本：在 "type": "module" 下没有 module.exports，只挂到 globalThis.MiloEngine
// @ts-expect-error 原型是无类型声明的浏览器脚本，这里只取它的副作用
await import('../../prototype/engine.js');
const P = (globalThis as any).MiloEngine;
const env = demoEnv(PROTOTYPE_CONFIG);
const base = new Date(2026, 9, 3).getTime();
const NOWS = [base + 7.25 * 3600e3, base + 13 * 3600e3, base + 20.5 * 3600e3];

describe('与低保真原型逐项一致（原型系数）', () => {
  for (const sc of demoScenarios.filter((s) => s.profile && !s.inject)) {
    it(`场景 ${sc.id}`, () => {
      for (const now of NOWS) {
        const { history, profile, deload } = buildScenario(sc.id, now);
        const penv = P.makeEnv(demoExercises, demoMuscles, now);
        const pv = P.deloadView(P.deloadSignal(penv, history), deload, now);
        const tv = deloadView(env, deloadSignal(env, history), deload, now);
        expect(tv).toEqual(pv);
        const prx = P.prescribe(penv, history, profile, { now, deload: pv.kind === 'week' });
        const trx = prescribe(env, history, profile!, { now, deload: tv.kind === 'week' });
        expect(trx.kind).toBe(prx.kind);
        const pick = (r: { items: { exerciseId: string; sets: number; suggestion: { weightKg: number | null; reason: { kind: string } } }[] }) =>
          r.items.map((i) => [i.exerciseId, i.sets, i.suggestion.weightKg, i.suggestion.reason.kind]);
        expect(pick(trx)).toEqual(pick(prx));
        expect(trx.blocked.map((h) => h.id)).toEqual(prx.blocked.map((h: { id: string }) => h.id));
        const ps = P.headStats(penv, history, profile, now), ts = headStats(env, history, profile, now);
        for (const [id, h] of ts) {
          const q = ps.get(id);
          expect([h.sets7d, h.phase, h.level, h.mev, h.mav, h.mrv]).toEqual([q.sets7d, q.phase, q.level, q.mev, q.mav, q.mrv]);
          if (q.recovery == null) expect(h.recovery).toBeNull(); else expect(h.recovery).toBeCloseTo(q.recovery, 9);
        }
      }
    });
  }
});
