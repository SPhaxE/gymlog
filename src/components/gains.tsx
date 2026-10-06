/** 增量页的三个件（P09，ia §1.9）：GainSummary（页头首屏的摘要）、GainGroupHead（结论色带）、GainRow（一个动作一行）。
 *  GainSummary：一个「配重片」环——环按「在涨 / 持平 / 在退 / 刚开始记」分四段（段上没有字，字在右边图例里，每个数后面都写「个动作」），
 *   环心是近 4 周练过的动作数；下面一行是近 4 周破纪录次数（压缩粗体大数字）。涨跌用形状 + 文字区分，不只靠颜色。
 *  GainGroupHead：整行色带；「该加重」是整页唯一的荧光，其余是灰带；带带一句话说明引擎为什么这样分。
 *  GainRow：三列固定宽度——名称（近 4 周有 PR 的打 PR 标）+ 下次目标（本行最大的数字）｜迷你曲线｜最近预估值 + 涨跌；
 *   曲线和数值各占固定宽度的列，所有行的曲线从同一条竖线开始，每条曲线下一条淡基线（每条自己缩放，只表达形状，不同动作之间不比大小）。
 *   ExerciseRow 右侧只有一个重量，装不下这些，所以单独一个件。没有 onClick 时是静态行（不假装能点）。 */
import { useId } from 'react';
import { Icon, type IconName } from './Icon';
import { Skeleton } from './feedback';
import { Sparkline, type Point } from './charts';
import { Odometer } from './dataviz';
import { cx, forced, type Forced } from './state';
import { Ticks } from './Ticks';
import { Delta, Num, Tag, type DeltaDir } from './ui';
import { T } from '../styles/tokens.gen';
import s from './gains.module.css';

const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');

export interface GainCounts { up: number; flat: number; down: number; baseline: number }
const SEGMENTS: { key: keyof GainCounts; label: string; glyph: string }[] = [
  { key: 'up', label: '在涨', glyph: '▲' }, { key: 'flat', label: '持平', glyph: '=' }, { key: 'down', label: '在退', glyph: '▼' }, { key: 'baseline', label: '刚开始记', glyph: '○' },
];

/** 配重片环：四段弧长按个数占比，弧之间留 stroke/ring-gap 的缝；外圈一圈刻度，整环从 12 点顺时针 */
function PlateDial({ counts, total }: { counts: GainCounts; total: number }) {
  const hatch = `hatch-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`, hp = T['space/s'];
  const box = T['space/5xl'] * 3, sw = T['stroke/ring-progress'] * 2, c = box / 2;
  const r = c - T['size/tick-major'] - T['space/xs'] - sw / 2, len = 2 * Math.PI * r, gap = T['stroke/ring-gap'] / len;
  const n = SEGMENTS.filter((g) => counts[g.key] > 0).length;
  let at = 0;
  const arcs = SEGMENTS.map((g) => {
    const f = total ? counts[g.key] / total : 0;
    if (!f) return null;
    const draw = Math.max(0.004, f - (n > 1 ? gap : 0)), start = at + (n > 1 ? gap / 2 : 0);
    at += f;
    return <circle key={g.key} className={s[`arc_${g.key}`]} cx={c} cy={c} r={r} pathLength={1} strokeWidth={g.key === 'baseline' ? sw / 2 : sw}
      stroke={g.key === 'down' ? `url(#${hatch})` : undefined} strokeDasharray={`${draw} ${1 - draw}`} strokeDashoffset={-start} transform={`rotate(-90 ${c} ${c})`} />;
  });
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * 2 * Math.PI, major = i % 5 === 0, r1 = c - T['space/2xs'], r0 = r1 - (major ? T['size/tick-major'] : T['size/tick-minor']);
    return <line key={i} className={major ? s.tickMajor : s.tickMinor} x1={c + r0 * Math.sin(a)} y1={c - r0 * Math.cos(a)} x2={c + r1 * Math.sin(a)} y2={c - r1 * Math.cos(a)} />;
  });
  return (
    <svg className={s.dial} width={box} height={box} viewBox={`0 0 ${box} ${box}`} aria-hidden="true">
      <defs><pattern id={hatch} width={hp} height={hp} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line className={s.hatchLine} x1={0} y1={0} x2={0} y2={hp} /></pattern></defs>
      {ticks}
      <circle className={s.dialTrack} cx={c} cy={c} r={r} strokeWidth={sw} />
      {arcs}
    </svg>
  );
}

export function GainSummary({ trained, up, flat, down, baseline, pr }: GainCounts & { trained: number; pr: number }) {
  const counts = { up, flat, down, baseline };
  return (
    <section className={s.sum} aria-label="近 4 周摘要">
      <div className={s.dialRow}>
        <div className={s.dialBox}>
          <PlateDial counts={counts} total={trained} />
          <div className={s.dialCenter}><b className="milo-text-number-l">{trained}</b><span className="milo-text-caption">个动作 · 近 4 周</span></div>
        </div>
        {trained === 0 ? (
          <p className={cx('milo-text-body', s.idle)}>近 4 周还没练。<br />下面是之前的记录。</p>
        ) : (
          <ul className={s.legend} aria-label={`近 4 周练了 ${trained} 个动作`}>
            {SEGMENTS.map((g) => (
              <li key={g.key} className={cx(s[`lg_${g.key}`], !counts[g.key] && s.legendZero)}>
                <i aria-hidden="true">{g.glyph}</i><Num size="m" value={counts[g.key]} /><span className="milo-text-body">个{g.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={s.prRow}>
        <span className={s.prNum}><Odometer value={String(pr)} size="xl" /><span className="milo-text-heading">次破纪录</span></span>
        <span className="milo-text-caption">近 4 周</span>
      </div>
      <Ticks />
    </section>
  );
}

export function GainRow({ name, latest, unit = 'kg', delta, pr, points, target, note, onClick, state }: {
  name: string; latest: number | null; unit?: string;
  delta: { dir: DeltaDir; value?: string };
  /** 近 4 周有 PR */
  pr?: boolean; points: Point[];
  /** 下次目标，如「85 kg × 6」；null = 还没有工作组，没有目标可给 */
  target: string | null;
  /** 目标后面的小字：「减量 ×0.9」「6 周前」 */
  note?: string;
  onClick?: () => void; state?: Forced | 'loading';
}) {
  if (state === 'loading') return <div className={cx(s.row, s.loading)} aria-busy="true"><Skeleton shape="row" /></div>;
  const body = (
    <>
      <span className={s.name}><b className="milo-text-body-strong">{name}</b>{pr && <Tag tone="strong">PR</Tag>}</span>
      <span className={s.spark}><Sparkline points={points} label={`${name} 预估 1RM`} /></span>
      <span className={s.value}>{latest != null ? <Num size="s" value={fmt(latest)} unit={unit} /> : <span className="milo-text-caption">—</span>}</span>
      <span className={s.target}>
        {target ? <><i>下次</i> <b className="milo-text-number-m">{target}</b></> : <span className="milo-text-caption">先做出一组工作组</span>}
        {note && <span className={cx('milo-text-caption', s.note)}>{note}</span>}
      </span>
      <span className={s.delta}><Delta dir={delta.dir} value={delta.value} /></span>
    </>
  );
  if (!onClick) return <div className={s.row}>{body}</div>;
  return (
    <button type="button" className={cx('milo-press milo-focus', s.row, s.btn)} onClick={onClick} aria-label={`查看${name}的进步曲线`} {...forced(state)}>
      {body}
    </button>
  );
}

export type GroupKind = 'add' | 'hold' | 'cut' | 'week';
const HEAD: Record<GroupKind, { title: string; hint: string; icon: IconName }> = {
  add: { title: '该加重', hint: '次数做满了，可以加一档', icon: 'up' },
  hold: { title: '保持，次数 +1', hint: '重量不变，每组多做 1 次', icon: 'flat' },
  cut: { title: '该减重', hint: '有一组没做满，先退一档', icon: 'down' },
  week: { title: '本周目标 · 减量', hint: '组数减半，强度 ×0.9', icon: 'timer' },
};
export function GainGroupHead({ kind, count }: { kind: GroupKind; count: number }) {
  const h = HEAD[kind];
  return (
    <div className={s.headWrap}>
      <h2 className={cx(s.band, kind === 'add' ? s.headLit : s.bandGrey)}>
        <Icon name={h.icon} small />
        <b className="milo-text-heading">{h.title}</b>
        <span className={cx('milo-text-caption', s.count)}>{count} 个动作</span>
      </h2>
      <p className={cx('milo-text-caption', s.hint)}>{h.hint}</p>
    </div>
  );
}
