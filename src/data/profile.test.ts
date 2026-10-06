import { beforeEach, describe, expect, it } from 'vitest';
import type { Profile } from '../engine/types';
import { EQUIPMENT, EQUIPMENT_EXT, EXPERIENCES, parseWeight, profileError, profileFacts, updateProfile } from './profile';
import { DEFAULT_PROFILE, STORE_KEY, store } from './store';

describe('体重（可选，ia §1.1）：输入框文字 → 体重', () => {
  it('空 = 不填，不报错', () => {
    expect(parseWeight('')).toEqual({});
    expect(parseWeight('   ')).toEqual({});
  });
  it('整数、一位小数都行', () => {
    expect(parseWeight('72')).toEqual({ kg: 72 });
    expect(parseWeight('72.5')).toEqual({ kg: 72.5 });
    expect(parseWeight(' 30 ')).toEqual({ kg: 30 });
    expect(parseWeight('250')).toEqual({ kg: 250 });
  });
  it('写错了一律拒绝并给行内提示，不替用户改数', () => {
    expect(parseWeight('7a').error).toBe('写成数字，最多一位小数');
    expect(parseWeight('72.55').error).toBe('写成数字，最多一位小数');
    expect(parseWeight('-5').error).toBe('写成数字，最多一位小数');
    expect(parseWeight('29.9').error).toBe('体重范围 30–250 kg');
    expect(parseWeight('300').error).toBe('体重范围 30–250 kg');
    expect(parseWeight('0').error).toBe('体重范围 30–250 kg');
  });
});

describe('档案四格上的字', () => {
  const p: Profile = { ...DEFAULT_PROFILE };
  it('默认档案：进阶 · 60 分钟 · 6 类 · 男', () => {
    expect(profileFacts(p)).toEqual({ experience: '进阶', minutes: 60, equipment: 6, body: '男' });
  });
  it('填了体重，体型那一格带上；扩展器械也算进「几类」', () => {
    expect(profileFacts({ ...p, gender: 'female', weightKg: 58.5 }).body).toBe('女 · 58.5 kg');
    expect(profileFacts({ ...p, equipment: [...p.equipment, 'kettlebell'] }).equipment).toBe(7);
  });
  it('名称表：3 档经验、6 类常用器械、3 类扩展器械', () => {
    expect(EXPERIENCES.map((e) => e[1])).toEqual(['新手', '进阶', '高阶']);
    expect(EQUIPMENT).toHaveLength(6);
    expect(EQUIPMENT_EXT.map((e) => e[1])).toEqual(['壶铃', '弹力带', '杠铃片']);
  });
});

describe('档案校验与写入（和建档同一套规则）', () => {
  const base: Profile = { ...DEFAULT_PROFILE };
  it('器械至少一类；时长 30–150 步进 15；体重 30–250', () => {
    expect(profileError(base)).toBeNull();
    expect(profileError({ ...base, equipment: [] })).toContain('器械至少选一类');
    expect(profileError({ ...base, minutes: 20 })).toContain('时长');
    expect(profileError({ ...base, minutes: 160 })).toContain('时长');
    expect(profileError({ ...base, minutes: 50 })).toContain('时长');
    expect(profileError({ ...base, weightKg: 20 })).toContain('体重范围');
    expect(profileError({ ...base, weightKg: 72 })).toBeNull();
  });

  beforeEach(() => { localStorage.clear(); store.clear(); store.update((s) => ({ ...s, profile: { ...DEFAULT_PROFILE } })); });

  it('改一项就写入存储，别的项不动', () => {
    expect(updateProfile({ minutes: 45 })).toBeNull();
    expect(store.get().profile).toEqual({ ...DEFAULT_PROFILE, minutes: 45 });
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).profile.minutes).toBe(45);
  });
  it('不合法的改动被拒绝，档案原样', () => {
    expect(updateProfile({ equipment: [] })).toContain('器械至少选一类');
    expect(updateProfile({ weightKg: 500 })).toContain('体重范围');
    expect(store.get().profile).toEqual(DEFAULT_PROFILE);
  });
  it('填体重、再清空（= 不填）', () => {
    expect(updateProfile({ weightKg: 72 })).toBeNull();
    expect(store.get().profile?.weightKg).toBe(72);
    expect(updateProfile({ weightKg: undefined })).toBeNull();
    expect(store.get().profile).not.toHaveProperty('weightKg');
  });
  it('还没有档案时不写', () => {
    store.clear();
    expect(updateProfile({ minutes: 45 })).toBe('还没有档案');
    expect(store.get().profile).toBeNull();
  });
});
