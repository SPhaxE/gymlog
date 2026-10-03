/** 测试用的小工具：用相对时间造训练记录 */
import { HOUR } from './sets';
import type { Entry, Session, SetRecord, SetType } from './types';

export const NOW = new Date(2026, 9, 3, 20, 30).getTime(); // 本地时间 2026-10-03 20:30
let seq = 0;
/** [重量, 次数] 列表 → 工作组；也可传完整 SetRecord */
export const sets = (rows: ([number, number] | SetRecord)[], type: SetType = 'work'): SetRecord[] =>
  rows.map((r) => (Array.isArray(r) ? { type, weightKg: r[0], reps: r[1], rpe: null } : r));
export const entry = (exerciseId: string, rows: ([number, number] | SetRecord)[], skipped = false): Entry => ({ exerciseId, skipped, sets: sets(rows) });
/** hoursAgo：训练「结束」距 now 的小时数；默认时长 60 分钟 */
export function session(hoursAgo: number, exercises: Entry[], extra: Partial<Session> = {}, now = NOW): Session {
  const durationMin = extra.durationMin ?? 60;
  return { id: extra.id ?? `t${++seq}`, startMs: now - hoursAgo * HOUR - durationMin * 60e3, durationMin, exertion: 8, exercises, ...extra };
}
export const DAYS = (n: number) => n * 24;
