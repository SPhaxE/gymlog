/** 引擎的数据形状：与 mock/*.json 一致（阶段 2 定下的数据约定，见 mock/README.md） */
export type SetType = 'warmup' | 'work' | 'drop';
export type Experience = 'novice' | 'intermediate' | 'advanced';
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'smith' | 'bodyweight' | 'kettlebell' | 'band' | 'plate';
export type Region = 'lower' | 'back' | 'chest' | 'shoulders' | 'arms' | 'core';
export type Tier = 'large' | 'medium' | 'small';
export type Phase = 'repair' | 'recovering' | 'golden' | 'decayed' | 'untrained';
export type Level = 'none' | 'low' | 'ok' | 'over';

export interface SetRecord {
  type: SetType;
  weightKg: number | null;
  reps?: number | null;
  repsLeft?: number | null;
  repsRight?: number | null;
  rpe?: number | null;
}
export interface Entry {
  exerciseId: string;
  skipped: boolean;
  sets: SetRecord[];
}
export interface Session {
  id: string;
  startMs: number;
  durationMin?: number;
  /** 力竭度 1–10（ia §1.7），没填按 8 */
  exertion?: number | null;
  exercises: Entry[];
}
export interface Exercise {
  id: string;
  name: string;
  nameEn?: string;
  equipment: string;
  equipmentType: EquipmentType;
  mechanic: 'compound' | 'isolation';
  primaryHeads: string[];
  secondaryHeads: string[];
  unilateral: boolean;
}
export interface Head {
  id: string;
  name: string;
  region: Region;
  tier: Tier;
  exerciseCount: number;
}
export interface TierInfo {
  name: string;
  baseWindowHours: number;
  volumeScale: number;
}
export interface Muscles {
  heads: Head[];
  tiers: Record<Tier, TierInfo>;
  regions: { id: Region; name: string }[];
}
export interface Profile {
  experience: Experience;
  equipment: EquipmentType[];
  /** 单次训练时长（分钟） */
  minutes: number;
  gender: 'male' | 'female';
}
export interface DeloadState {
  status: 'none' | 'adopted' | 'dismissed';
  atMs: number;
}
