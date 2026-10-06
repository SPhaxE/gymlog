import type { Env } from './env';
import { exerciseRecords, prMap, sessionStats } from './records';
import { countedSets, entryE1rm, totalReps } from './sets';
import type { Session } from './types';

export interface SummaryRow {
  exerciseId: string; skipped: boolean; e1rm?: number | null; isPR?: boolean; baseline?: boolean;
  prevE1rm?: number | null; delta?: number | null; repsDelta?: number;
  /** 这次之前的最好预估 1RM：新纪录的「比之前最好多了多少」以它为准（逐动作表仍与上次比），与奖励弹窗同一口径 */
  prevBest?: number | null;
}

/** 完成结算（ia §1.7）：总组数、总负荷、PR、逐动作与上次比 */
export function summarize(env: Env, history: Session[], session: Session) {
  const before = history.filter((s) => s.id !== session.id && s.startMs < session.startMs);
  const all = history.some((s) => s.id === session.id) ? history : [...history, session];
  const prs = prMap(env, all).get(session.id) ?? new Set<string>();
  const { sets, load } = sessionStats(session);
  const rows: SummaryRow[] = session.exercises.map((entry) => {
    if (!countedSets(entry).length) return { exerciseId: entry.exerciseId, skipped: true };
    const cur = entryE1rm(entry);
    const prevRecs = exerciseRecords(env, before, entry.exerciseId);
    const prev = prevRecs[prevRecs.length - 1];
    const row: SummaryRow = { exerciseId: entry.exerciseId, skipped: false, e1rm: cur, isPR: prs.has(entry.exerciseId), baseline: !prev };
    if (prev) {
      row.prevE1rm = prev.e1rm;
      const bests = prevRecs.map((r) => r.e1rm).filter((x): x is number => x != null);
      row.prevBest = bests.length ? Math.max(...bests) : null;
      row.delta = cur != null && prev.e1rm != null ? cur - prev.e1rm : null;
      const sum = (en: typeof entry) => countedSets(en).reduce((n, s) => n + totalReps(s), 0);
      row.repsDelta = sum(entry) - sum(prev.entry);
    }
    return row;
  });
  return { sets, load, rows, prs: rows.filter((r) => r.isPR), first: before.length === 0 };
}
