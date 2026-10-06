/** 导出训练记录（ia §1.11「数据」，2026-10-06）：每组一行，表格软件直接打开。
 *  - 列：日期、开始时间、动作、第几组、类型、重量(kg)、次数、左次数、右次数、RPE、本次时长(分钟)；第一行是表头；
 *  - 热身组、递减组也导，「类型」一列写清；热身组不占「第几组」的序号（和训练详情一致）；没做的动作不导；
 *  - UTF-8 带 BOM（Excel 才认得中文），行尾 CRLF，字段里有逗号 / 引号 / 换行就加引号；按时间正序。 */
import type { Session } from '../engine/types';

export const CSV_HEADER = ['日期', '开始时间', '动作', '第几组', '类型', '重量(kg)', '次数', '左次数', '右次数', 'RPE', '本次时长(分钟)'];
const TYPE = { work: '正式组', warmup: '热身组', drop: '递减组' } as const;
const pad = (n: number) => String(n).padStart(2, '0');
const cell = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const dayText = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export function historyCsv(history: Session[], nameOf: (exerciseId: string) => string): string {
  const rows: (string | number | null | undefined)[][] = [];
  for (const s of [...history].sort((a, b) => a.startMs - b.startMs)) {
    const d = new Date(s.startMs), time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    for (const e of s.exercises) {
      if (e.skipped) continue;
      let n = 0;
      for (const x of e.sets) rows.push([dayText(s.startMs), time, nameOf(e.exerciseId), x.type === 'warmup' ? '' : ++n, TYPE[x.type], x.weightKg, x.reps, x.repsLeft, x.repsRight, x.rpe, s.durationMin]);
    }
  }
  return '﻿' + [CSV_HEADER, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

export const csvFileName = (now: number) => `milo-训练记录-${dayText(now)}.csv`;

/** 一共导出了多少组（页面上提示「已导出 N 组」用；和 historyCsv 同一口径） */
export const csvSetCount = (history: Session[]) => history.reduce((a, s) => a + s.exercises.reduce((b, e) => b + (e.skipped ? 0 : e.sets.length), 0), 0);
