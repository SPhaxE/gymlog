/** 增量页的两个件（P09，ia §1.9）：GainRow（一个动作一行）、GainGroupHead（结论组头）。
 *  GainRow：左边名称（近 4 周有 PR 的打 PR 标）+ 下次目标，中间迷你曲线，右边最近预估值 + 涨跌（▲▼ 形状 + 文字，不只靠颜色）。
 *   ExerciseRow 右侧只有一个重量，装不下这些，所以单独一个件。没有 onClick 时是静态行（不假装能点）。
 *  GainGroupHead：「该加重」是整页唯一的荧光色（图标底），其余灰；每组一句话说明引擎为什么这样分。 */
import { Icon, type IconName } from './Icon';
import { Skeleton } from './feedback';
import { Sparkline, type Point } from './charts';
import { cx, forced, type Forced } from './state';
import { Delta, Num, Tag, type DeltaDir } from './ui';
import s from './gains.module.css';

const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');

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
      <span className={s.name}><b className="milo-text-body-strong">{name}</b>{pr && <Tag tone="strong" icon="star">PR</Tag>}</span>
      <span className={s.spark}><Sparkline points={points} label={`${name} 预估 1RM`} /></span>
      <span className={s.value}>{latest != null ? <Num size="m" value={fmt(latest)} unit={unit} /> : <span className="milo-text-caption">—</span>}</span>
      <span className={s.target}>
        {target ? <><i>下次</i> <b className="milo-text-number-s">{target}</b></> : <span className="milo-text-caption">先做出一组工作组</span>}
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
    <h2 className={cx(s.head, kind === 'add' && s.headLit)}>
      <i className={s.headIcon} aria-hidden="true"><Icon name={h.icon} small /></i>
      <span className={s.headText}><b className="milo-text-title-m">{h.title}</b><span className="milo-text-caption">{h.hint}</span></span>
      <span className={s.count}><Num size="m" value={count} unit="个" /></span>
    </h2>
  );
}
