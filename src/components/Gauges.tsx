/** 量尺类组件（视觉语言 v2「刻度」）：
 *  PhaseSegments — 恢复时相四段，当前段荧光（时相条属于「进度」类用途，允许荧光）；
 *  LandmarkRuler — 近 7 天组数对照最低 / 适宜 / 上限三条地标；
 *  IncrementRuler — 上次重量 → 这次建议重量，两者之间那段（增量）骨白高亮。 */
import s from './Gauges.module.css';

const PHASES = [['repair', '修复期'], ['recovering', '恢复中'], ['golden', '黄金窗'], ['decayed', '已回落']] as const;
const fmt = (x: number) => String(Math.round(x * 10) / 10);

export function PhaseSegments({ phase }: { phase: string }) {
  return <div className={s.phases}>{PHASES.map(([k, n]) => <span key={k} className={k === phase ? s.phaseOn : undefined}>{n}</span>)}</div>;
}

export function LandmarkRuler({ value, mev, mav, mrv }: { value: number; mev: number; mav: number; mrv: number }) {
  const x = (v: number) => `${(v / (mrv * 1.1)) * 100}%`;
  return (
    <div className={s.ruler} role="img" aria-label={`近 7 天 ${fmt(value)} 组；最低 ${mev}、适宜 ${mav}、上限 ${mrv}`}>
      <div className={s.fill} style={{ width: x(value) }} />
      {([['最低', mev], ['适宜', mav], ['上限', mrv]] as const).map(([n, v]) => <div key={n} className={s.mark} style={{ left: x(v) }}><span>{n} {v}</span></div>)}
    </div>
  );
}

export function IncrementRuler({ last, next, step }: { last: number; next: number; step: number }) {
  const lo = Math.floor((Math.min(last, next) - 4 * step) / step) * step, hi = Math.ceil((Math.max(last, next) + 4 * step) / step) * step;
  const n = Math.round((hi - lo) / step), x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const a = Math.min(last, next), b = Math.max(last, next), diff = next - last;
  return (
    <div className={s.inc} role="img" aria-label={`上次 ${fmt(last)} kg，这次 ${fmt(next)} kg`}>
      <div className={s.ticks}>{Array.from({ length: n + 1 }, (_, i) => <i key={i} className={i % 2 ? undefined : s.major} />)}</div>
      <div className={s.span} style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }} />
      {diff === 0 ? <div className={`${s.at} ${s.next}`} style={{ left: x(next) }}><span>重量不变 · {fmt(next)}</span></div> : <>
        {/* 两个标注向外推：左边那个右对齐、右边那个左对齐，差一个步进时也不重叠 */}
        <div className={`${s.at} ${diff > 0 ? s.toLeft : s.toRight}`} style={{ left: x(last) }}><span>上次 {fmt(last)}</span></div>
        <div className={`${s.at} ${s.next} ${diff > 0 ? s.toRight : s.toLeft}`} style={{ left: x(next) }}><span>{diff > 0 ? '+' : '−'}{fmt(Math.abs(diff))} kg</span></div>
      </>}
    </div>
  );
}
