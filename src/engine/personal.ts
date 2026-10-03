import { endMs, type Env } from './env';
import { countedSets, entryE1rm, HOUR } from './sets';
import { headWindow } from './stats';
import type { Profile, Session } from './types';

/**
 * 个人恢复系数自学习（V1 learnPersonalFactors，ia §1.2「个人恢复系数」）：
 * 同一动作在同一肌头上连续两次练，若间隔不超过模型窗口的 1.5 倍——后一次没退步说明恢复比模型快，系数 −5%；退步则 +5%。
 * 系数夹在 [0.6, 1.6]，初值 1。
 */
export function learnPersonalFactors(env: Env, history: Session[], profile: Profile | null): Map<string, number> {
  const { min, max, learnRate } = env.cfg.personal;
  const exp = profile?.experience ?? 'intermediate';
  const byHead = new Map<string, { start: number; end: number; exId: string; e1rm: number; sets: number; exertion: number | null | undefined }[]>();
  for (const s of [...history].sort((a, b) => a.startMs - b.startMs)) {
    for (const entry of s.exercises) {
      const ex = env.ex.get(entry.exerciseId), n = countedSets(entry).length, v = entryE1rm(entry);
      if (!ex || !n || v == null) continue;
      for (const h of ex.primaryHeads) {
        const arr = byHead.get(h) ?? [];
        arr.push({ start: s.startMs, end: endMs(s), exId: ex.id, e1rm: v, sets: n, exertion: s.exertion });
        byHead.set(h, arr);
      }
    }
  }
  const out = new Map<string, number>();
  for (const [hid, rows] of byHead) {
    const head = env.heads.get(hid);
    if (!head) continue;
    let f = 1;
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1], cur = rows[i];
      if (prev.exId !== cur.exId) continue; // 只在同一个动作上比表现
      const gap = (cur.start - prev.end) / HOUR;
      if (gap > headWindow(env, head, prev.sets, prev.exertion, exp, f) * 1.5) continue; // 隔太久，学不到东西
      f = cur.e1rm >= prev.e1rm * 0.995 ? f * (1 - learnRate) : f * (1 + learnRate);
      f = Math.min(max, Math.max(min, Math.round(f * 1000) / 1000));
    }
    if (f !== 1) out.set(hid, f);
  }
  return out;
}
