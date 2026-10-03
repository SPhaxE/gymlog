import { REGION_ORDER, regionOfEx, startOfDay, type Env } from './env';
import { planFor, suggest, type Plan, type Suggestion } from './load';
import { countedSets, DAY, halfUp } from './sets';
import { headStats, type HeadStat } from './stats';
import type { EquipmentType, Exercise, Profile, Region, Session } from './types';

const EQUIP_RANK: Record<EquipmentType, number> = { barbell: 0, dumbbell: 1, machine: 2, cable: 3, smith: 4, bodyweight: 5, kettlebell: 6, band: 7, plate: 8 };

/** 单次训练时长 → 每天的组数与动作数（ia §1.1：setsPerDay = round(分钟×14/60)，exercisesPerDay = max(3, round(setsPerDay/2.3))） */
export function budgetFor(minutes: number) {
  const setsPerDay = Math.round((minutes * 14) / 60);
  return { setsPerDay, exercisesPerDay: Math.max(3, Math.round(setsPerDay / 2.3)) };
}

export interface RxItem {
  exerciseId: string; name: string; equipment: string; mechanic: Exercise['mechanic']; unilateral: boolean;
  region: Region; primaryHeads: string[]; secondaryHeads: string[];
  sets: number; repRange: [number, number]; restSec: number;
  why: { head: string; priority: number };
  suggestion: Suggestion;
}
interface RxBase { budget: ReturnType<typeof budgetFor>; stats: Map<string, HeadStat>; blocked: HeadStat[]; deload: boolean }
export type Prescription =
  | (RxBase & { kind: 'rest'; items: [] })
  | (RxBase & { kind: 'pool-empty'; items: []; cands: HeadStat[] })
  | (RxBase & { kind: 'plan'; items: RxItem[]; cands: HeadStat[]; totals: { sets: number; exercises: number; regions: Region[]; heads: string[] } });

/** 今日处方（ia §1.2）：纯函数，同样的输入一定得到同样的处方 */
export function prescribe(env: Env, history: Session[], profile: Profile, opts: { now: number; deload?: boolean }): Prescription {
  const { now } = opts;
  const deload = !!opts.deload;
  const budget = budgetFor(profile.minutes);
  if (deload) budget.setsPerDay = Math.max(2, halfUp(budget.setsPerDay * env.cfg.deload.volume));
  const stats = headStats(env, history, profile, now);
  const equip = new Set(profile.equipment);

  // 规则 1：近 7 天到上限的不排；恢复度 < 50% 的不排
  const cands = [...stats.values()].filter((h) => h.exerciseCount > 0 && h.sets7d < h.mrv && (h.recovery == null || h.recovery >= env.cfg.readiness.block));
  const blocked = [...stats.values()].filter((h) => h.exerciseCount > 0 && !cands.includes(h)).sort((a, b) => b.hoursLeft - a.hoursLeft);
  const base: RxBase = { budget, stats, blocked, deload };
  if (!cands.length) return { kind: 'rest', items: [], ...base };

  // 规则 3：同一动作 7 天内不重复，按日历日算——今天 0 点往前数 6 天（含今天）
  const cutoff = startOfDay(now) - 6 * DAY;
  const used7 = new Set<string>();
  for (const s of history) if (s.startMs >= cutoff) for (const e of s.exercises) if (!e.skipped) used7.add(e.exerciseId);
  const pool = env.exList.filter((e) => equip.has(e.equipmentType) && !used7.has(e.id));
  // 规则 6：做过的动作优先（有历史才有建议重量与理由）
  const familiar = new Set<string>();
  for (const s of history) for (const e of s.exercises) if (countedSets(e).length) familiar.add(e.exerciseId);

  const virtual = new Map(cands.map((h) => [h.id, h.sets7d]));
  const chosen: { ex: Exercise; plan: Plan; why: RxItem['why'] }[] = [];
  const regionCount = new Map<Region, number>(), headCount = new Map<string, number>();
  let setsLeft = budget.setsPerDay;
  const prio = (h: HeadStat) => {
    const v = virtual.get(h.id)!;
    return h.phaseCoef * (0.4 + Math.max(0, h.mav - v) / h.mav + (v < h.mev ? 0.5 : 0));
  };
  const skipHead = new Set<string>();
  let perHead = 1; // 规则 3：每个肌头先排 1 个，排不满再放宽到 2 个
  for (let guard = 0; guard < 80 && chosen.length < budget.exercisesPerDay && setsLeft > 0; guard++) {
    const ranked = cands.filter((h) => !skipHead.has(h.id) && virtual.get(h.id)! < h.mrv)
      .sort((a, b) => prio(b) - prio(a) || REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
    let picked: { head: HeadStat; ex: Exercise } | null = null;
    for (const head of ranked) {
      if ((headCount.get(head.id) ?? 0) >= perHead || (regionCount.get(head.region) ?? 0) >= 2) { skipHead.add(head.id); continue; }
      const options = pool
        .filter((e) => e.primaryHeads.includes(head.id) && !chosen.some((c) => c.ex.id === e.id))
        .filter((e) => planFor(env, e, deload).sets <= setsLeft)
        .sort((a, b) => Number(b.mechanic === 'compound') - Number(a.mechanic === 'compound')
          || Number(familiar.has(b.id)) - Number(familiar.has(a.id))
          || EQUIP_RANK[a.equipmentType] - EQUIP_RANK[b.equipmentType] || (a.id < b.id ? -1 : 1));
      if (options.length) { picked = { head, ex: options[0] }; break; }
      skipHead.add(head.id);
    }
    if (!picked) {
      if (perHead < 2) { perHead = 2; skipHead.clear(); continue; }
      break;
    }
    const { head, ex } = picked;
    const plan = planFor(env, ex, deload);
    chosen.push({ ex, plan, why: { head: head.id, priority: prio(head) } });
    setsLeft -= plan.sets;
    regionCount.set(head.region, (regionCount.get(head.region) ?? 0) + 1);
    for (const h of ex.primaryHeads) { headCount.set(h, (headCount.get(h) ?? 0) + 1); if (virtual.has(h)) virtual.set(h, virtual.get(h)! + plan.sets); }
    for (const h of ex.secondaryHeads) if (virtual.has(h)) virtual.set(h, virtual.get(h)! + plan.sets * 0.5);
  }
  // 与 V1 不同：有候选肌头但排不出动作，是「动作池不足」，不是恢复日（ia §1.2 边界情况）
  if (!chosen.length) return { kind: 'pool-empty', items: [], cands, ...base };

  // 规则 5：部位成块，块内复合在前
  chosen.sort((a, b) => REGION_ORDER.indexOf(regionOfEx(env, a.ex)) - REGION_ORDER.indexOf(regionOfEx(env, b.ex))
    || Number(b.ex.mechanic === 'compound') - Number(a.ex.mechanic === 'compound'));
  const items: RxItem[] = chosen.map(({ ex, plan, why }) => ({
    exerciseId: ex.id, name: ex.name, equipment: ex.equipment, mechanic: ex.mechanic, unilateral: ex.unilateral,
    region: regionOfEx(env, ex), primaryHeads: ex.primaryHeads, secondaryHeads: ex.secondaryHeads,
    sets: plan.sets, repRange: plan.repRange, restSec: plan.restSec, why,
    suggestion: suggest(env, history, ex, plan, deload),
  }));
  return {
    kind: 'plan', items, ...base, cands,
    totals: { sets: items.reduce((n, i) => n + i.sets, 0), exercises: items.length, regions: [...new Set(items.map((i) => i.region))], heads: [...new Set(items.flatMap((i) => i.primaryHeads))] },
  };
}
