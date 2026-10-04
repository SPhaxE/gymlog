/** 训练与记录（DESIGN §9）：处方行、处方主角卡、组行、组间休息条、训练记录行、周历、动作示范框。
 *  数字一律 font/number；方向与状态用形状 + 文字，不只靠颜色。 */
import { useEffect, useState, type ReactNode } from 'react';
import { T } from '../styles/tokens.gen';
import { Button, IconButton } from './Button';
import { IncrementRuler } from './Gauges';
import { sharedName } from './motion';
import { Icon } from './Icon';
import { cx, forced, type Forced } from './state';
import { Card, Num, Tag } from './ui';
import s from './training.module.css';

const fmt = (x: number) => (Math.round(x * 10) / 10).toLocaleString('en-US');
/** 秒 → 1:35（时间写法，ia §1.6） */
export const clock = (sec: number) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.floor(Math.max(0, sec) % 60)).padStart(2, '0')}`;

/* ---------- 处方行（P01「接下来」、P03 动作列表） ---------- */
export type ExerciseStatus = 'todo' | 'current' | 'done' | 'skipped';
export function ExerciseRow({ name, detail, weight, status = 'todo', sets, onClick, state, sharedId }: {
  name: string; detail: string; weight: number | null; status?: ExerciseStatus; sets?: [number, number]; onClick?: () => void; state?: Forced;
  /** M03：给卡片、名称、重量起共享名，点开时原地变形成 SharedDetail（详情打开时传 undefined，避免同名） */
  sharedId?: string;
}) {
  const trailing = status === 'skipped' ? <Tag tone="outline">未做</Tag>
    : status === 'done' ? <span className={s.doneMark}><Num size="s" value={`${sets?.[0] ?? 0}/${sets?.[1] ?? 0}`} unit="组" /><Icon name="check" small /></span>
    : weight != null ? <span style={sharedId ? sharedName('num', sharedId) : undefined}><Num value={fmt(weight)} unit="kg" /></span> : <Tag tone="outline">首次</Tag>;
  return (
    <button type="button" className={cx('milo-press milo-focus', s.exRow, s[`ex_${status}`])} onClick={onClick} aria-current={status === 'current' ? 'step' : undefined}
      style={sharedId ? sharedName('card', sharedId) : undefined} {...forced(state)}>
      <span className={s.exText}><b className="milo-text-body-strong" style={sharedId ? { ...sharedName('title', sharedId), width: 'fit-content' } : undefined}>{name}</b><span className="milo-text-caption">{status === 'current' && sets ? `进行中 · 第 ${sets[0] + 1} 组 · ` : ''}{detail}</span></span>
      {trailing}
    </button>
  );
}

/* ---------- 处方主角卡（P01 第一个动作） ---------- */
export function PrescriptionHero({ order, region, name, weight, sets, reps, reason, last, step, deload, onClick, state }: {
  order: number; region: string; name: string; weight: number | null; sets: number; reps: [number, number]; reason: string; last: number | null; step: number;
  deload?: boolean; onClick?: () => void; state?: Forced;
}) {
  return (
    <Card hero onClick={onClick} label={`${name}，${weight != null ? `${fmt(weight)} 千克` : '首次'}，${sets} 组 ${reps.join('到')} 次`} state={state}>
      <div className={s.heroTop}><span className="milo-text-caption">第 {order} 个 · {region}</span>{deload && <Tag>减量周 · 强度 ×0.9</Tag>}</div>
      <div className={`milo-text-heading ${s.primary}`}>{name}</div>
      <div className={s.heroRow}>
        {weight != null ? <Num size="hero" value={fmt(weight)} unit="kg" /> : <span className={`milo-text-title-l ${s.primary}`}>首次</span>}
        <span className={s.target}><Num size="l" value={`${sets} × ${reps.join('–')}`} /><span className="milo-text-caption">组 × 次</span></span>
      </div>
      <div className="milo-text-caption">{weight != null ? reason : `选一个能干净做完 ${reps[0]} 次的重量`}</div>
      {weight != null && last != null && weight > 0 && <IncrementRuler last={last} next={weight} step={step} />}
    </Card>
  );
}

/* ---------- 组行（P03 记组） ---------- */
export type SetType = 'work' | 'warmup' | 'drop';
export type SetStatus = 'todo' | 'current' | 'done' | 'editing';
export function SetRow({ index, type = 'work', status, weight, reps, rpe, error, onDone, onEdit, onChange, state }: {
  index: number; type?: SetType; status: SetStatus; weight: string; reps: string; rpe?: string; error?: string;
  onDone?: () => void; onEdit?: () => void; onChange?: (f: 'weight' | 'reps', v: string) => void; state?: Forced;
}) {
  const idx = type === 'warmup' ? '热' : type === 'drop' ? '递' : String(index);
  const missing = !weight.trim() ? '重量' : !reps.trim() ? '次数' : null;
  const editable = status === 'current' || status === 'editing';
  return (
    <div className={cx(s.set, s[`set_${status}`], error && s.setError)} role="group" aria-label={`第 ${index} 组${type === 'warmup' ? '（热身，不计入）' : type === 'drop' ? '（递减）' : ''}`}>
      <span className={cx(s.idx, type !== 'work' && s.idxType)}>{status === 'done' && type === 'work' ? <Icon name="check" small /> : idx}</span>
      {editable ? (
        <span className={s.inputs}>
          <SetInput label="重量" unit="kg" value={weight} onChange={(v) => onChange?.('weight', v)} invalid={!!error} />
          <i className={s.times}>×</i>
          <SetInput label="次数" unit="次" value={reps} onChange={(v) => onChange?.('reps', v)} mode="numeric" />
        </span>
      ) : (
        <span className={s.vals}>
          <Num size="m" value={weight || '—'} unit="kg" /><i className={s.times}>×</i><Num size="m" value={reps || '—'} unit="次" />
          {rpe && <span className={s.rpe}>RPE {rpe}</span>}
          {type === 'warmup' && <Tag tone="outline">不计入</Tag>}
        </span>
      )}
      <span className={s.setAction}>
        {status === 'current' && <Button kind="neutral" size="s" onClick={onDone} disabled={!!missing || !!error} state={state}>完成</Button>}
        {status === 'editing' && <Button kind="ghost" size="s" onClick={onDone} disabled={!!missing || !!error} state={state}>保存</Button>}
        {status === 'done' && <IconButton kind="plain" icon="edit" label={`修改第 ${index} 组`} onClick={onEdit} state={state} />}
      </span>
      {(error || (editable && missing)) && <span className={cx('milo-text-caption', error ? s.err : s.hint)}>{error ?? `填好${missing}才能完成`}</span>}
    </div>
  );
}
function SetInput({ label, unit, value, onChange, invalid, mode = 'decimal' }: { label: string; unit: string; value: string; onChange: (v: string) => void; invalid?: boolean; mode?: 'decimal' | 'numeric' }) {
  return (
    <label className={cx(s.setInput, invalid && s.setInputBad)}>
      <span className="milo-sr">{label}</span>
      <input value={value} inputMode={mode} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} placeholder="—" />
      <i>{unit}</i>
    </label>
  );
}

/* ---------- 组间休息条（P03 悬浮，ia §1.6） ---------- */
/** 用结束时间戳算剩余秒数（切后台、锁屏回来仍然正确） */
export function useCountdown(endAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endAt == null) return;
    const id = window.setInterval(() => setNow(Date.now()), T['motion/base']);
    return () => clearInterval(id);
  }, [endAt]);
  return endAt == null ? 0 : Math.max(0, Math.ceil((endAt - now) / 1000));
}

export type RestState = 'running' | 'ending' | 'done';
/** 剩余 ≤ 10 秒为 ending：倒计时前加「即将结束」，进度条变虚线；结束为 done：换成对勾 + 「开始下一组」 */
export function RestBar({ remaining, total, onAdjust, onSkip, onDismiss }: {
  remaining: number; total: number; onAdjust?: (d: number) => void; onSkip?: () => void; onDismiss?: () => void;
}) {
  const st: RestState = remaining <= 0 ? 'done' : remaining <= 10 ? 'ending' : 'running';
  return (
    <div className={cx(s.rest, s[`rest_${st}`])} role="timer" aria-label={st === 'done' ? '休息结束' : `组间休息剩余 ${clock(remaining)}`}>
      <span className={s.restIcon}><Icon name={st === 'done' ? 'check' : 'timer'} /></span>
      <span className={s.restText}>
        <span className="milo-text-caption">{st === 'done' ? '休息结束' : st === 'ending' ? '即将结束' : '组间休息'}</span>
        {st === 'done' ? <b className="milo-text-body-strong">开始下一组</b> : <Num size="l" value={clock(remaining)} />}
      </span>
      {st === 'done' ? <IconButton kind="plain" icon="close" label="关闭休息提示" onClick={onDismiss} /> : (
        <span className={s.restBtns}>
          <button type="button" className={cx('milo-press milo-focus', s.restBtn)} onClick={() => onAdjust?.(-15)} aria-label="少休息 15 秒">−15</button>
          <button type="button" className={cx('milo-press milo-focus', s.restBtn)} onClick={() => onAdjust?.(15)} aria-label="多休息 15 秒">+15</button>
          <button type="button" className={cx('milo-press milo-focus', s.restBtn)} onClick={onSkip} aria-label="跳过休息"><Icon name="skip" small /></button>
        </span>
      )}
      {st !== 'done' && <i className={s.restTrack}><i style={{ width: `${Math.min(1, remaining / total) * 100}%` }} /></i>}
    </div>
  );
}

/* ---------- 训练记录行（P07） ---------- */
export function SessionRow({ date, weekday, title, meta, prs, deload, onClick, state }: {
  date: number; weekday: string; title: string; meta: string; prs?: number; deload?: boolean; onClick?: () => void; state?: Forced;
}) {
  return (
    <button type="button" className={cx('milo-press milo-focus', s.session)} onClick={onClick} {...forced(state)}>
      <span className={s.date}><b className="milo-text-number-m">{date}</b><span className="milo-text-caption">周{weekday}</span></span>
      <span className={s.exText}><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{meta}</span></span>
      {deload && <Tag>减量</Tag>}
      {prs ? <Tag tone="strong" icon="star">PR {prs}</Tag> : null}
      <Icon name="chevron" small />
    </button>
  );
}

/* ---------- 周历（P07 顶部） ---------- */
export type DayStatus = 'trained' | 'rest' | 'today' | 'future';
export interface DayProps { weekday: string; day: number; status: DayStatus; pr?: boolean; selected?: boolean; onClick?: () => void; state?: Forced }
export function DayCell({ weekday, day, status, pr, selected, onClick, state }: DayProps) {
  const label = `周${weekday} ${day} 日${status === 'trained' ? '，已训练' : status === 'today' ? '，今天' : ''}${pr ? '，有 PR' : ''}`;
  return (
    <button type="button" className={cx('milo-press milo-focus', s.day, s[`day_${status}`], selected && s.daySel)} disabled={status === 'future'}
      aria-pressed={!!selected} aria-label={label} onClick={onClick} {...forced(state)}>
      <span className={s.wd}>{weekday}</span>
      <span className={s.dayNum}>{day}</span>
      <span className={s.mark}>{pr ? <Icon name="star" small /> : status === 'trained' ? <i className={s.dot} /> : null}</span>
    </button>
  );
}
export function WeekStrip({ days, label = '本周' }: { days: DayProps[]; label?: string }) {
  return <div className={s.week} role="group" aria-label={label}>{days.map((d) => <DayCell key={d.weekday} {...d} />)}</div>;
}

/* ---------- 动作示范（P05，ia §1.4） ---------- */
export type MediaState = 'loading' | 'ready' | 'missing' | 'error';
/** 只通过动作的 media 字段引用；没有素材显示「暂无示范」，不拿相近动作顶替；加载失败显示文字要领提示，不显示破图。保留 MuscleWiki 署名与链接 */
export function MediaFrame({ src, label, force }: { src: string | null; label: string; force?: MediaState }) {
  const [st, setSt] = useState<MediaState>(src ? 'loading' : 'missing');
  useEffect(() => setSt(src ? 'loading' : 'missing'), [src]);
  const shown = force ?? st;
  let overlay: ReactNode = null;
  if (shown === 'missing') overlay = <><Icon name="info" /><b className="milo-text-body-strong">暂无示范</b><span className="milo-text-caption">按下方文字要领做</span></>;
  if (shown === 'error') overlay = <><Icon name="alert" /><b className="milo-text-body-strong">示范加载失败</b><span className="milo-text-caption">按下方文字要领做</span></>;
  return (
    <figure className={s.media}>
      <div className={cx(s.mediaBox, shown === 'loading' && s.mediaLoading)} aria-busy={shown === 'loading' || undefined}>
        {src && shown !== 'missing' && shown !== 'error' && (
          <video src={src} muted loop playsInline autoPlay preload="metadata" aria-label={label} className={shown === 'ready' ? s.video : s.videoHidden}
            onLoadedData={() => setSt('ready')} onError={() => setSt('error')} />
        )}
        {overlay && <div className={s.mediaMsg}>{overlay}</div>}
      </div>
      <figcaption className={cx('milo-text-micro', s.credit)}>示范：<a href="https://musclewiki.com" target="_blank" rel="noreferrer">MuscleWiki</a></figcaption>
    </figure>
  );
}
