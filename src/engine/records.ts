import type { Env } from './env';
import { countedSets, entryE1rm, setLoad } from './sets';
import type { Entry, Region, Session } from './types';

export interface ExerciseRecord { session: Session; entry: Entry; e1rm: number | null; isPR: boolean; baseline: boolean }

/** 某动作的全部记录（时间正序）。第一次是基线、不算 PR；PR 需比此前最好成绩高 ≥ prMinKg（ia §1.7） */
export function exerciseRecords(env: Env, history: Session[], exId: string): ExerciseRecord[] {
  const recs: ExerciseRecord[] = [];
  let best = -1;
  for (const s of [...history].sort((a, b) => a.startMs - b.startMs)) {
    const entry = s.exercises.find((e) => e.exerciseId === exId && countedSets(e).length);
    if (!entry) continue;
    const v = entryE1rm(entry);
    const first = recs.length === 0;
    const isPR = !first && v != null && v - best >= env.cfg.prMinKg;
    if (v != null && v > best) best = v;
    recs.push({ session: s, entry, e1rm: v, isPR, baseline: first });
  }
  return recs;
}

/** 一遍扫完所有训练：训练 id → 这次创 PR 的动作 id（历史变化后重算，删记录也能正确回退） */
export function prMap(env: Env, history: Session[]): Map<string, Set<string>> {
  const best = new Map<string, number>(), seen = new Set<string>(), out = new Map<string, Set<string>>();
  for (const s of [...history].sort((a, b) => a.startMs - b.startMs)) {
    const prs = new Set<string>();
    for (const entry of s.exercises) {
      const v = entryE1rm(entry);
      if (v == null) continue;
      if (seen.has(entry.exerciseId) && v - (best.get(entry.exerciseId) ?? -1) >= env.cfg.prMinKg) prs.add(entry.exerciseId);
      seen.add(entry.exerciseId);
      if (v > (best.get(entry.exerciseId) ?? -1)) best.set(entry.exerciseId, v);
    }
    out.set(s.id, prs);
  }
  return out;
}

/** 一次训练的总组数与总负荷（只算计入组；总负荷 = Σ 重量 × 总次数） */
export function sessionStats(session: Session) {
  let sets = 0, load = 0;
  for (const e of session.exercises) for (const s of countedSets(e)) { sets += 1; load += setLoad(s); }
  return { sets, load };
}

/** 一次训练的主要部位（按有效组数，最多 3 个） */
export function mainRegions(env: Env, session: Session): Region[] {
  const m = new Map<Region, number>();
  for (const e of session.exercises) {
    const ex = env.ex.get(e.exerciseId), n = countedSets(e).length;
    if (!ex || !n) continue;
    for (const h of ex.primaryHeads) { const r = env.heads.get(h)?.region; if (r) m.set(r, (m.get(r) ?? 0) + n); }
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r);
}
