/** 版式元素（2026-10-04 用户选定 E1–E4，E5 并入 TrendChart）：
 *  DotCalendar 点阵日历（ref1）· StepRing 环中数字（ref1）· WeekBars 竖向胶囊量表（ref3）· GiantNumber 超大渐变数字（ref5）· Odometer 滚动码表（8motions 04）。 */
import type { ReactNode } from 'react';
import { DAY, startOfDay } from '../engine';
import { T } from '../styles/tokens.gen';
import { cx } from './state';
import s from './dataviz.module.css';

/* ---------- E1 点阵日历 ---------- */
export type DotState = 'trained' | 'rest' | 'today' | 'future' | 'out';
export interface DotMonth { label: string; weeks: { t: number; state: DotState }[][] }

/** 近 count 个自然月，每月按「周一开始」排成列；trained 是练过的日子（startOfDay 毫秒） */
export function dotMonths(trained: Set<number>, now: number, count = 3): DotMonth[] {
  const today = startOfDay(now), d = new Date(now), out: DotMonth[] = [];
  for (let m = count - 1; m >= 0; m--) {
    const first = new Date(d.getFullYear(), d.getMonth() - m, 1), last = new Date(d.getFullYear(), d.getMonth() - m + 1, 0);
    let t = startOfDay(first.getTime() - ((first.getDay() + 6) % 7) * DAY);
    const weeks: { t: number; state: DotState }[][] = [];
    while (t <= last.getTime()) {
      const col: { t: number; state: DotState }[] = [];
      for (let i = 0; i < 7; i++, t = startOfDay(t + DAY * 1.5)) {
        const inMonth = new Date(t).getMonth() === first.getMonth();
        col.push({ t, state: !inMonth ? 'out' : t === today ? 'today' : t > today ? 'future' : trained.has(t) ? 'trained' : 'rest' });
      }
      weeks.push(col);
    }
    out.push({ label: `${first.getMonth() + 1}月`, weeks });
  }
  return out;
}

export function DotCalendar({ months, label = '近 3 个月训练' }: { months: DotMonth[]; label?: string }) {
  const n = months.reduce((k, m) => k + m.weeks.flat().filter((x) => x.state === 'trained').length, 0);
  return (
    <div className={s.dots} role="img" aria-label={`${label}：练了 ${n} 天`}>
      {months.map((m) => (
        <div key={m.label} className={s.dotMonth}>
          <span className="milo-text-caption">{m.label}</span>
          <div className={s.dotGrid}>{m.weeks.map((col, ci) => <div key={ci} className={s.dotCol}>{col.map(({ t, state }) => <i key={t} className={s[`dot_${state}`]} />)}</div>)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- E2 环中数字 ---------- */
/** 序号放在进度环里：训练中第几个动作 + 这个动作的组数进度 */
export function StepRing({ n, ratio, title, sub, done }: { n: number; ratio: number; title: ReactNode; sub?: ReactNode; done?: boolean }) {
  const box = T['space/3xl'] * 2, sw = T['stroke/ring-progress'], r = (box - sw) / 2 - T['space/2xs'];
  return (
    <div className={cx(s.ringRow, done && s.ringDone)}>
      <svg width={box} height={box} className={s.ring} role="img" aria-label={`第 ${n} 个，完成 ${Math.round(ratio * 100)}%`}>
        <circle cx={box / 2} cy={box / 2} r={r} className={s.ringTrack} />
        <circle cx={box / 2} cy={box / 2} r={r} className={s.ringProg} pathLength={1} strokeDasharray={`${Math.max(0, Math.min(1, ratio))} 1`} transform={`rotate(-90 ${box / 2} ${box / 2})`} />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={s.ringNum}>{n}</text>
      </svg>
      <div className={s.ringText}><div className="milo-text-heading">{title}</div>{sub && <div className="milo-text-caption">{sub}</div>}</div>
    </div>
  );
}

/* ---------- E3 竖向胶囊量表 ---------- */
export function WeekBars({ weeks, unit = '组', compact }: { weeks: { label: string; value: number; current?: boolean }[]; unit?: string; compact?: boolean }) {
  const max = Math.max(1, ...weeks.map((w) => w.value));
  return (
    <div className={cx(s.bars, compact && s.barsCompact)} style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} role="img" aria-label={weeks.map((w) => `${w.label} ${w.value} ${unit}`).join('，')}>
      {weeks.map((w) => (
        <div key={w.label} className={s.barCol}>
          <span className={s.barVal}>{w.value}</span>
          <div className={s.barTrack}><i className={w.current ? s.barNow : s.barFill} style={{ height: `${(w.value / max) * 100}%` }} /></div>
          <span className="milo-text-micro">{w.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- E4 超大渐变数字 ---------- */
/** 结算页唯一一次「大声」（DESIGN §8）：数字从骨白渐隐 + 颗粒 */
export function GiantNumber({ value, unit, caption }: { value: string; unit?: string; caption?: ReactNode }) {
  return (
    <div className={s.giant}>
      {caption && <span className="milo-text-caption">{caption}</span>}
      <div className={s.giantNum} aria-label={`${value}${unit ? ` ${unit}` : ''}`}>{value}{unit && <i>{unit}</i>}</div>
    </div>
  );
}

/* ---------- 滚动码表 ---------- */
/** 每一位数字是一条 0–9 的竖带，按弹簧滚到目标位；非数字字符原样显示。按「从右数第几位」配对，97.5 → 100 时个位、十位各自滚，不会整体错位 */
export function Odometer({ value, size = 'xl' }: { value: string; size?: 'xl' | 'l' | 'm' }) {
  return (
    <span className={cx(s.odo, `milo-text-number-${size}`)} aria-label={value}>
      {[...value].map((ch, i) => /\d/.test(ch)
        ? <span key={value.length - i} className={s.odoCol} aria-hidden="true"><span className={s.odoStrip} style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>{'0123456789'.split('').map((d) => <i key={d}>{d}</i>)}</span></span>
        : <span key={`c${value.length - i}`} aria-hidden="true">{ch}</span>)}
    </span>
  );
}
