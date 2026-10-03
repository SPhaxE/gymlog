import { DEFAULT_CONFIG, type EngineConfig } from './config';
import type { Exercise, Head, Muscles, Region, Session, Tier, TierInfo } from './types';

/** 下肢 → 背 → 胸 → 肩 → 手臂 → 核心（ia §1.2 规则 5） */
export const REGION_ORDER: Region[] = ['lower', 'back', 'chest', 'shoulders', 'arms', 'core'];

export interface Env {
  ex: Map<string, Exercise>;
  exList: Exercise[];
  heads: Map<string, Head>;
  headList: Head[];
  tiers: Record<Tier, TierInfo>;
  cfg: EngineConfig;
}

export function createEnv(exercises: Exercise[], muscles: Muscles, cfg: EngineConfig = DEFAULT_CONFIG): Env {
  return {
    ex: new Map(exercises.map((e) => [e.id, e])),
    exList: exercises,
    heads: new Map(muscles.heads.map((h) => [h.id, h])),
    headList: muscles.heads,
    tiers: muscles.tiers,
    cfg,
  };
}

export const regionOfEx = (env: Env, ex: Exercise): Region => env.heads.get(ex.primaryHeads[0])?.region ?? 'core';
export const endMs = (s: Session) => s.startMs + (s.durationMin ?? 0) * 60e3;
/** 今天 0 点（本地时间） */
export const startOfDay = (now: number) => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); };
