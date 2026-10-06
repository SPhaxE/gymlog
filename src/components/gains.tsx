/** 增量页的三个件（P09，ia §1.9）：GainSummary（页头首屏的摘要）、GainGroupHead（结论色带）、GainRow（一个动作一行）。
 *  GainSummary：一个「配重片」环——环按「在涨 / 持平 / 在退 / 刚开始记」分四段（段上没有字，字在右边图例里，每个数后面都写「个动作」），
 *   环心是近 4 周练过的动作数；下面一行是近 4 周破纪录次数（压缩粗体大数字）。涨跌用形状 + 文字区分，不只靠颜色。
 *  GainGroupHead：整行色带；「该加重」是整页唯一的荧光，其余是灰带；带带一句话说明引擎为什么这样分。
 *  GainRow：三列固定宽度——名称（近 4 周有 PR 的打 PR 标）+ 下次目标（本行最大的数字）｜迷你曲线｜最近预估值 + 涨跌；
 *   曲线和数值各占固定宽度的列，所有行的曲线从同一条竖线开始，每条曲线下一条淡基线（每条自己缩放，只表达形状，不同动作之间不比大小）。
 *   ExerciseRow 右侧只有一个重量，装不下这些，所以单独一个件。没有 onClick 时是静态行（不假装能点）。 */
import { Icon, type IconName } from './Icon';
import { Skeleton } from './feedback';
import { Sparkline, type Point } from './charts';
import { Odometer } from './dataviz';
import { drillName } from './motion';
import { cx, forced, type Forced } from './state';
import { Delta, Num, Tag, type DeltaDir } from './ui';
import s from './gains.module.css';

const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');

export interface GainCounts { up: number; flat: number; down: number; baseline: number }


/** 刻度尺：整条尺按「在涨 / 持平 / 在退」的个数占比分段，字直接写在段上（数字 + 形状 + 名称，不只靠颜色）；「刚开始记」只有一个基线记录，
 *  没有涨跌可比，所以不占尺的长度，写在尺下面一行。上下各一排刻度，像卷尺。 */
export function GainSummary({ trained, up, flat, down, baseline, pr }: GainCounts & { trained: number; pr: number }) {
  const trend = [{ key: 'up' as const, n: up, label: '个在涨', glyph: '▲' }, { key: 'flat' as const, n: flat, label: '个持平', glyph: '=' }, { key: 'down' as const, n: down, label: '个在退', glyph: '▼' }].filter((g) => g.n > 0);
  return (
    <section className={s.sum} aria-label="近 4 周摘要">
      <p className={cx('milo-text-heading', s.lead)}>{trained === 0 ? '近 4 周还没练，下面是之前的记录' : <>近 4 周练了 <b>{trained}</b> 个动作</>}</p>
      {trained > 0 && (
        <>
          {trend.length > 0 ? (
            <ul className={s.ruler} aria-label={`近 4 周练了 ${trained} 个动作`}>
              {trend.map((g) => (
                <li key={g.key} className={s[`seg_${g.key}`]} style={{ flexGrow: g.n }}>
                  <span className={s.segTop}><b className="milo-text-number-m">{g.n}</b><i aria-hidden="true">{g.glyph}</i></span>
                  <span className="milo-text-caption">{g.label}</span>
                </li>
              ))}
            </ul>
          ) : <div className={s.rulerEmpty} aria-hidden="true" />}
          {baseline > 0 && <p className={cx('milo-text-caption', s.footnote)}><i aria-hidden="true">○</i> {baseline} 个刚开始记（只有 1 次记录，还没有涨跌可比）</p>}
        </>
      )}
      <div className={s.prRow}>
        <span className={s.prNum}><Odometer value={String(pr)} size="hero" /><span className="milo-text-heading">次破纪录</span></span>
        <span className="milo-text-caption">近 4 周</span>
      </div>
    </section>
  );
}

export function GainRow({ name, latest, unit = 'kg', delta, pr, points, target, note, onClick, state, drillId }: {
  name: string; latest: number | null; unit?: string;
  delta: { dir: DeltaDir; value?: string };
  /** 近 4 周有 PR */
  pr?: boolean; points: Point[];
  /** 下次目标，如「85 kg × 6」；null = 还没有工作组，没有目标可给 */
  target: string | null;
  /** 目标后面的小字：「减量 ×0.9」「6 周前」 */
  note?: string;
  onClick?: () => void; state?: Forced | 'loading';
  /** 钻入转场里被点的 / 返回时落回的那一行：名称、最新值、小曲线带共享名（M09），同名只能有一份，所以列表里只有这一行给 */
  drillId?: string;
}) {
  if (state === 'loading') return <div className={cx(s.row, s.loading)} aria-busy="true"><Skeleton shape="row" /></div>;
  const body = (
    <>
      <span className={s.name}><b className="milo-text-body-strong" style={drillId ? drillName('name', drillId) : undefined}>{name}</b>{pr && <Tag tone="strong">PR</Tag>}</span>
      <span className={s.spark} style={drillId ? drillName('line', drillId) : undefined}><Sparkline area points={points} label={`${name} 预估 1RM`} /></span>
      <span className={s.value} style={drillId ? drillName('num', drillId) : undefined}>{latest != null ? <Num size="s" value={fmt(latest)} unit={unit} /> : <span className="milo-text-caption">—</span>}</span>
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
