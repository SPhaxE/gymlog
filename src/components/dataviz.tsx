/** 版式元素（2026-10-04 用户选定 E1–E4，E5 并入 TrendChart）：
 *  DotCalendar 点阵日历（ref1）· StepRing 环中数字（ref1）· WeekBars 竖向胶囊量表（ref3）· GiantNumber 超大渐变数字（ref5）· Odometer 滚动码表（8motions 04）。 */
import type { CSSProperties, ReactNode } from 'react';
import { DAY, startOfDay } from '../engine';
import { T } from '../styles/tokens.gen';
import { cx } from './state';
import s from './dataviz.module.css';

/* ---------- E1 点阵日历 ---------- */
export type DotState = 'trained' | 'rest' | 'today' | 'future' | 'out';
/** done：这一天练过（今天也能练过——state 里「今天」优先，所以单独带一个标记） */
export interface DotCell { t: number; state: DotState; done: boolean }
export interface DotMonth { label: string; weeks: DotCell[][] }

/** 近 count 个自然月，每月按「周一开始」排成列；trained 是练过的日子（startOfDay 毫秒）。
 *  状态优先级：不在本月 > 今天 > 未来 > 练过 > 休息；跨月的那一周在两个月里各出现一次（另一个月的日子是 out） */
export function dotMonths(trained: Set<number>, now: number, count = 3): DotMonth[] {
  const today = startOfDay(now), d = new Date(now), out: DotMonth[] = [];
  for (let m = count - 1; m >= 0; m--) {
    const first = new Date(d.getFullYear(), d.getMonth() - m, 1), last = new Date(d.getFullYear(), d.getMonth() - m + 1, 0);
    let t = startOfDay(first.getTime() - ((first.getDay() + 6) % 7) * DAY);
    const weeks: DotCell[][] = [];
    while (t <= last.getTime()) {
      const col: DotCell[] = [];
      for (let i = 0; i < 7; i++, t = startOfDay(t + DAY * 1.5)) {
        const inMonth = new Date(t).getMonth() === first.getMonth();
        const state: DotState = !inMonth ? 'out' : t === today ? 'today' : t > today ? 'future' : trained.has(t) ? 'trained' : 'rest';
        col.push({ t, state, done: inMonth && t <= today && trained.has(t) });
      }
      weeks.push(col);
    }
    out.push({ label: `${first.getMonth() + 1}月`, weeks });
  }
  return out;
}

/** 近几个月练了几天（含今天练过的） */
export const dotDays = (months: DotMonth[]) => months.reduce((k, m) => k + m.weeks.flat().filter((x) => x.done).length, 0);

export function DotCalendar({ months, label = '近 3 个月训练' }: { months: DotMonth[]; label?: string }) {
  const n = dotDays(months);
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
export function WeekBars({ weeks, unit = '组' }: { weeks: { label: string; value: number; current?: boolean }[]; unit?: string }) {
  const max = Math.max(1, ...weeks.map((w) => w.value));
  return (
    <div className={s.bars} style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} role="img" aria-label={weeks.map((w) => `${w.label} ${w.value} ${unit}`).join('，')}>
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

/* ---------- 肌头近 8 周（6g 补：高级分析 · 肌群容量趋势，Stitch trend V2） ---------- */
/** 每周组数柱：最低（MEV）到上限（MRV）是一条底带 + 两条虚线（和面板上的刻度尺同一套说法），本周骨白实心、之前的暗、减量周斜纹（形状不只靠颜色）；只在本周柱头标数（每根都标太碎）。
 *  挂载时柱子按 M07 从左到右依次长出来；减少动态效果时直接到位。 */
export function HeadWeeks({ weeks, mev, mrv, unit = '组' }: { weeks: { value: number; deload?: boolean }[]; mev: number; mrv: number; unit?: string }) {
  const top = Math.max(mrv * 1.15, ...weeks.map((w) => w.value), 1);
  const pct = (v: number) => `${(v / top) * 100}%`;
  const last = weeks.length - 1;
  return (
    <figure className={s.hw} role="img" aria-label={`近 ${weeks.length} 周每周组数：${weeks.map((w, i) => `${i === last ? '本周' : `${last - i} 周前`} ${w.value}${w.deload ? '（减量周）' : ''}`).join('，')}；最低 ${mev}、上限 ${mrv} ${unit}`}>
      <div className={s.hwPlot} style={{ '--lo': pct(mev), '--hi': pct(mrv) } as CSSProperties}>
        <i className={s.hwBand} aria-hidden="true" /><span className={cx('milo-text-micro', s.hwBandLabel)} aria-hidden="true">最低 {mev} – 上限 {mrv}</span>
        <div className={s.hwBars} style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }} aria-hidden="true">
          {weeks.map((w, i) => (
            <span key={i} className={s.hwCol}>
              {i === last && <b className={cx('milo-text-number-s', s.hwVal)} style={{ bottom: pct(w.value) }}>{w.value}</b>}
              <i className={cx(s.hwBar, i === last && s.hwNow, w.deload && s.hwDeload)} style={{ height: pct(w.value), '--d': i } as CSSProperties} />
            </span>
          ))}
        </div>
      </div>
      <figcaption className={cx('milo-text-micro', s.hwAxis)} aria-hidden="true"><span>{weeks.length} 周前</span>{weeks.some((w) => w.deload) && <span className={s.hwKey}><i />减量周</span>}<span>本周</span></figcaption>
    </figure>
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
export function Odometer({ value, size = 'xl' }: { value: string; size?: 'hero' | 'xl' | 'l' | 'm' }) {
  return (
    <span className={cx(s.odo, `milo-text-number-${size}`)} aria-label={value}>
      {[...value].map((ch, i) => /\d/.test(ch)
        ? <span key={value.length - i} className={s.odoCol} aria-hidden="true"><span className={s.odoStrip} style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>{'0123456789'.split('').map((d) => <i key={d}>{d}</i>)}</span></span>
        : <span key={`c${value.length - i}`} aria-hidden="true">{ch}</span>)}
    </span>
  );
}
