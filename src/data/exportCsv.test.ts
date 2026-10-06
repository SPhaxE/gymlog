import { describe, expect, it } from 'vitest';
import type { Session } from '../engine/types';
import { csvFileName, csvSetCount, CSV_HEADER, historyCsv } from './exportCsv';
import { env } from './demo';
import { demoState } from './store';

const T1 = new Date(2026, 9, 3, 18, 5).getTime(), T0 = new Date(2026, 8, 30, 7, 30).getTime();
const name = (id: string) => ({ a: '杠铃卧推', b: '哑铃, 侧平举', c: '引体"向上"' } as Record<string, string>)[id] ?? id;
const H: Session[] = [
  { id: 's1', startMs: T1, durationMin: 61, exercises: [
    { exerciseId: 'a', skipped: false, sets: [{ type: 'warmup', weightKg: 40, reps: 10 }, { type: 'work', weightKg: 80, reps: 8, rpe: 8 }, { type: 'drop', weightKg: 60, reps: 10 }] },
    { exerciseId: 'b', skipped: true, sets: [] },
    { exerciseId: 'c', skipped: false, sets: [{ type: 'work', weightKg: null, repsLeft: 8, repsRight: 7 }] },
  ] },
  { id: 's0', startMs: T0, exercises: [{ exerciseId: 'b', skipped: false, sets: [{ type: 'work', weightKg: 10, reps: 12 }] }] },
];

describe('导出 CSV', () => {
  const lines = historyCsv(H, name).split('\r\n');
  it('UTF-8 带 BOM、第一行表头、行尾 CRLF 收尾', () => {
    expect(historyCsv(H, name).startsWith('﻿')).toBe(true);
    expect(lines[0]).toBe('﻿' + CSV_HEADER.join(','));
    expect(lines.at(-1)).toBe('');
  });
  it('每组一行，按时间正序；没做的动作不导', () => {
    expect(lines).toHaveLength(1 + 5 + 1);   // 表头 + 5 组 + 收尾空行
    expect(lines[1].startsWith('2026-09-30,07:30,')).toBe(true);
    expect(lines.slice(1, 6).some((l) => l.includes('侧平举') && l.startsWith('2026-10-03'))).toBe(false);
  });
  it('热身组不占序号、类型写清；单侧写左右；自重没有重量', () => {
    expect(lines[2]).toBe('2026-10-03,18:05,杠铃卧推,,热身组,40,10,,,,61');
    expect(lines[3]).toBe('2026-10-03,18:05,杠铃卧推,1,正式组,80,8,,,8,61');
    expect(lines[4]).toBe('2026-10-03,18:05,杠铃卧推,2,递减组,60,10,,,,61');
    expect(lines[5]).toBe('2026-10-03,18:05,"引体""向上""",1,正式组,,,8,7,,61');
  });
  it('字段里有逗号 / 引号就加引号（逗号在动作名里）', () => {
    expect(lines[1]).toBe('2026-09-30,07:30,"哑铃, 侧平举",1,正式组,10,12,,,,');
  });
  it('csvSetCount 和导出的行数一致；文件名带日期', () => {
    expect(csvSetCount(H)).toBe(5);
    expect(csvFileName(T1)).toBe('milo-训练记录-2026-10-03.csv');
  });
  it('演示数据：每一组一行，没有空动作名', () => {
    const st = demoState(new Date(2026, 9, 6, 18).getTime());
    const out = historyCsv(st.history, (id) => env.ex.get(id)?.name ?? id).split('\r\n');
    expect(out.length - 2).toBe(csvSetCount(st.history));
    expect(out.slice(1, -1).every((l) => l.split(',').length >= CSV_HEADER.length)).toBe(true);
  });
});
