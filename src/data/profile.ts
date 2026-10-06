/** 档案（ia §1.1 / §1.11）：建档第 3 步和「我的」里的编辑面板共用的名称表、校验和写入。
 *  - 档案四格：训练经验、单次时长、可用器械、体型示意（性别）；体重（可选）写在体型那一格的面板里；
 *  - 校验与建档一致：器械至少一类，时长 30–150 步进 15，体重 30–250 kg、最多一位小数（不填也行）；
 *  - 改档案不用迁移处方：处方每次都从档案现算；训练进行中改的，进行中的那次不受影响（它是开始时的快照），下一次才按新档案排。 */
import type { EquipmentType, Experience, Profile } from '../engine/types';
import { store } from './store';

export const EXPERIENCES: [Experience, string, string][] = [['novice', '新手', '练了不到 1 年'], ['intermediate', '进阶', '规律训练 1–3 年'], ['advanced', '高阶', '3 年以上，熟悉周期']];
export const EQUIPMENT: [EquipmentType, string][] = [['barbell', '杠铃'], ['dumbbell', '哑铃'], ['machine', '固定器械'], ['cable', '绳索'], ['smith', '史密斯机'], ['bodyweight', '自重 / 负重']];
/** 扩展器械默认收起、默认不选 */
export const EQUIPMENT_EXT: [EquipmentType, string][] = [['kettlebell', '壶铃'], ['band', '弹力带'], ['plate', '杠铃片']];
export const EXPERIENCE_NAME: Record<Experience, string> = { novice: '新手', intermediate: '进阶', advanced: '高阶' };
export const GENDER_NAME = { male: '男', female: '女' } as const;

export const MINUTES = { min: 30, max: 150, step: 15 } as const;
export const WEIGHT = { min: 30, max: 250 } as const;

/** 输入框里的文字 → 体重（kg）。空 = 不填（kg 为空，不报错）；写错一律拒绝并给行内提示，不替用户改数 */
export function parseWeight(text: string): { kg?: number; error?: string } {
  const t = text.trim();
  if (!t) return {};
  if (!/^\d+(\.\d)?$/.test(t)) return { error: '写成数字，最多一位小数' };
  const kg = Number(t);
  if (kg < WEIGHT.min || kg > WEIGHT.max) return { error: `体重范围 ${WEIGHT.min}–${WEIGHT.max} kg` };
  return { kg };
}

/** 档案四格上的字：训练经验、单次时长、可用器械（几类，扩展器械也算）、体型示意（填了体重就带上） */
export function profileFacts(p: Profile) {
  return {
    experience: EXPERIENCE_NAME[p.experience],
    minutes: p.minutes,
    equipment: p.equipment.length,
    body: p.weightKg != null ? `${GENDER_NAME[p.gender]} · ${p.weightKg} kg` : GENDER_NAME[p.gender],
  };
}

/** 档案改不动的原因（给面板里的行内提示用）；没问题返回 null */
export function profileError(p: Profile): string | null {
  if (p.equipment.length === 0) return '器械至少选一类，否则排不出动作';
  if (p.minutes < MINUTES.min || p.minutes > MINUTES.max || (p.minutes - MINUTES.min) % MINUTES.step !== 0) return `时长 ${MINUTES.min}–${MINUTES.max} 分钟，每次加减 ${MINUTES.step}`;
  if (p.weightKg != null && (p.weightKg < WEIGHT.min || p.weightKg > WEIGHT.max)) return `体重范围 ${WEIGHT.min}–${WEIGHT.max} kg`;
  return null;
}

/** 改档案：校验通过才写；返回错误文案（null = 已写入）。写存储失败走 store.saveError，外壳有可见提示，这里不吞 */
export function updateProfile(patch: Partial<Profile>): string | null {
  const cur = store.get().profile;
  if (!cur) return '还没有档案';
  const next: Profile = { ...cur, ...patch };
  if (patch.weightKg === undefined && 'weightKg' in patch) delete next.weightKg;   // 清空体重 = 不填
  const err = profileError(next);
  if (err) return err;
  store.update((s) => ({ ...s, profile: next }));
  return null;
}
