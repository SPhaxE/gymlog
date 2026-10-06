/** 训练与记录（DESIGN §9）：处方行、处方主角卡、组行、组间休息条、训练记录行、周历、动作示范框。
 *  数字一律 font/number；方向与状态用形状 + 文字，不只靠颜色。 */
import { useEffect, useState, type ReactNode } from 'react';
import { T } from '../styles/tokens.gen';
import { Button, IconButton } from './Button';
import { Odometer } from './dataviz';
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
export function ExerciseRow({ name, detail, weight, status = 'todo', sets, dots, onClick, state, sharedId }: {
  name: string; detail: string; weight: number | null; status?: ExerciseStatus; sets?: [number, number]; onClick?: () => void; state?: Forced;
  /** 训练中：每组一个点（● 已打卡 / ○ 待做），一眼看到这个动作做到哪（2026-10-06 首页即打卡，线框 checkin W2 的组格子） */
  dots?: [number, number];
  /** M03：给卡片、名称、重量起共享名，点开时原地变形成 SharedDetail（详情打开时传 undefined，避免同名） */
  sharedId?: string;
}) {
  const trailing = status === 'skipped' ? <Tag tone="outline">未做</Tag>
    : status === 'done' ? <span className={s.doneMark}><Num size="s" value={`${sets?.[0] ?? 0}/${sets?.[1] ?? 0}`} unit="组" /><Icon name="check" small /></span>
    : weight != null ? <span style={sharedId ? sharedName('num', sharedId) : undefined}><Num value={fmt(weight)} unit="kg" /></span> : <Tag tone="outline">首次</Tag>;
  return (
    <button type="button" className={cx('milo-press milo-focus', s.exRow, s[`ex_${status}`])} onClick={onClick} aria-current={status === 'current' ? 'step' : undefined}
      style={sharedId ? sharedName('card', sharedId) : undefined} {...forced(state)}>
      <span className={s.exText}><b className="milo-text-body-strong" style={sharedId ? { ...sharedName('title', sharedId), width: 'fit-content' } : undefined}>{name}</b><span className="milo-text-caption">{status === 'current' && sets ? `进行中 · 第 ${sets[0] + 1} 组 · ` : ''}{detail}</span>
        {dots && <span className={s.dots} aria-label={`已打卡 ${dots[0]} / ${dots[1]} 组`}>{Array.from({ length: dots[1] }, (_, i) => <i key={i} className={i < dots[0] ? s.dotOn : undefined} />)}</span>}</span>
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
/** 报错只落在出错的那一格：红圈只圈那个输入框，红字就在它正下方、和它同宽（用户 2026-10-05：红字与警告项一比一，不再整行描红） */
export function SetRow({ index, type = 'work', status, weight, reps, rpe, error, errorField = 'weight', onDone, onEdit, onChange, keypad, state }: {
  index: number; type?: SetType; status: SetStatus; weight: string; reps: string; rpe?: string; error?: string; errorField?: 'weight' | 'reps';
  /** 用自带数字键盘（P03）：输入框不弹系统键盘，点一下只是选中这一格（field = 当前选中的格） */
  keypad?: { field: 'weight' | 'reps' | null; onFocus: (f: 'weight' | 'reps') => void };
  onDone?: () => void; onEdit?: () => void; onChange?: (f: 'weight' | 'reps', v: string) => void; state?: Forced;
}) {
  const idx = type === 'warmup' ? '热' : type === 'drop' ? '递' : String(index);
  const missing = !weight.trim() ? '重量' : !reps.trim() ? '次数' : null;
  const editable = status === 'current' || status === 'editing';
  // 提示落在哪一格：报错落在出错的那格；缺值落在缺的那格
  const noteField = error ? errorField : missing === '重量' ? 'weight' : missing ? 'reps' : null;
  // 提示在出错 / 缺值的那一格正下方、和它同宽；它是组行的第二行，不参与第一行的对齐（2026-10-06 真机：提示把输入框往上顶、序号和按钮对不齐）
  const note = editable && noteField && <span className={s.noteRow}><span className={cx('milo-text-caption', s.fieldNote, noteField === 'reps' && s.fieldNoteReps, error ? s.err : s.hint)} role={error ? 'alert' : undefined}>{error ?? `先填${missing}`}</span></span>;
  return (
    <div className={cx(s.set, s[`set_${status}`])} role="group" aria-label={`第 ${index} 组${type === 'warmup' ? '（热身，不计入）' : type === 'drop' ? '（递减）' : ''}`}>
      <span className={cx(s.idx, type !== 'work' && s.idxType)}>{status === 'done' && type === 'work' ? <Icon name="check" small /> : idx}</span>
      {editable ? (
        <span className={s.inputs}>
          <SetInput label="重量" unit="kg" value={weight} onChange={(v) => onChange?.('weight', v)} invalid={!!error && errorField === 'weight'}
            pad={keypad && { on: keypad.field === 'weight', focus: () => keypad.onFocus('weight') }} />
          <i className={s.times}>×</i>
          <SetInput label="次数" unit="次" value={reps} onChange={(v) => onChange?.('reps', v)} mode="numeric" invalid={!!error && errorField === 'reps'}
            pad={keypad && { on: keypad.field === 'reps', focus: () => keypad.onFocus('reps') }} />
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
      {note}
    </div>
  );
}
function SetInput({ label, unit, value, onChange, invalid, mode = 'decimal', pad }: {
  label: string; unit: string; value: string; onChange: (v: string) => void; invalid?: boolean; mode?: 'decimal' | 'numeric'; pad?: { on: boolean; focus: () => void };
}) {
  return (
    <label className={cx(s.setInput, invalid && s.setInputBad, pad?.on && s.setInputOn)} onPointerDown={pad ? (e) => { e.preventDefault(); pad.focus(); } : undefined}>
      <span className="milo-sr">{label}</span>
      <input value={value} inputMode={pad ? 'none' : mode} readOnly={!!pad} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} placeholder="—"
        onFocus={pad ? () => pad.focus() : undefined} />
      <i>{unit}</i>
    </label>
  );
}

/* ---------- 训练页自带数字键盘（P03，Stitch s6 V2 + V1 的「下一组」键） ---------- */
/** 0–9、小数点、退格；上面一排步进（重量 ±步进 kg，次数 ±1）；右下「下一组」= 完成当前这一组（唯一入口，缺值 / 超范围时不可用） */
export function NumPad({ onKey, onStep, step, unit, onNext, nextDisabled, nextLabel = '下一组' }: {
  onKey: (k: string) => void; onStep: (d: number) => void; step: number; unit: string; onNext: () => void; nextDisabled?: boolean; nextLabel?: string;
}) {
  const key = (k: string, label: ReactNode = k, extra?: string) => (
    <button key={k} type="button" className={cx('milo-press milo-focus', s.key, extra)} onClick={() => onKey(k)} aria-label={k === 'del' ? '删除' : undefined}>{label}</button>
  );
  const stepKey = (d: number) => <button type="button" className={cx('milo-press milo-focus', s.key, s.keyStep)} onClick={() => onStep(d)} aria-label={`${d > 0 ? '加' : '减'} ${Math.abs(d)} ${unit}`}>{d > 0 ? '+' : '−'}{Math.abs(d)}<small>{unit}</small></button>;
  // 4 列：1 2 3 −步进 / 4 5 6 +步进 / 7 8 9 退格 / . 0 下一组（占两格）
  return (
    <div className={s.pad} role="group" aria-label="数字键盘">
      {key('1')}{key('2')}{key('3')}{stepKey(-step)}
      {key('4')}{key('5')}{key('6')}{stepKey(step)}
      {key('7')}{key('8')}{key('9')}{key('del', <Icon name="back" small />)}
      {key('.')}{key('0')}
      <button type="button" className={cx('milo-press milo-focus', s.key, s.keyNext)} onClick={onNext} disabled={nextDisabled}>{nextLabel}</button>
    </div>
  );
}

/* ---------- 组行（首页即打卡，2026-10-06） ---------- */
/** 一组 = 一整行按钮（命中区整行、不低于 hit-min）：序号 | 重量 × 次数 | 状态。点一下打开改数面板（SetEditor），不在行里放输入框。
 *  current：当前要打的这一组，选中描边；重量空（首次动作）时写「填重量」，不预先报红。done：序号换成勾，数字变灰。 */
export function SetLine({ index, weight, reps, status, onClick, state }: {
  index: number; weight: string; reps: string; status: 'done' | 'current' | 'todo'; onClick?: () => void; state?: Forced;
}) {
  const empty = !weight.trim();
  return (
    <button type="button" className={cx('milo-press milo-focus', s.line, s[`line_${status}`])} onClick={onClick} {...forced(state)}
      aria-label={`第 ${index} 组，${empty ? '还没填重量' : `${weight} 千克`} ${reps || '—'} 次，${status === 'done' ? '已打卡，点开修改' : '点开修改'}`}>
      <span className={s.lineIdx}>{status === 'done' ? <Icon name="check" small /> : index}</span>
      <span className={s.lineVals}>
        {empty ? <span className={s.lineEmpty}>填重量</span> : <Num size="m" value={weight} unit="kg" />}
        <i className={s.times}>×</i><Num size="m" value={reps || '—'} unit="次" />
      </span>
      <Icon name="edit" small />
    </button>
  );
}

/** 改数面板的内容（放在 Sheet 里，M05 阻尼抽屉）：两块大格子（重量 / 次数，点一下切换正在改的那格）+ 一行提示 + 数字键盘。
 *  提示行永远占位（空也占一行），出现提示、报错都不挤动格子和键盘（DESIGN §9.6 提示不位移）。数字用滚动码表（M04），±步进时按位滚动。 */
export function SetEditor({ weight, reps, field, onField, onKey, onStep, step, hint, error, onDone, doneLabel, doneDisabled }: {
  weight: string; reps: string; field: 'weight' | 'reps'; onField: (f: 'weight' | 'reps') => void; onKey: (k: string) => void; onStep: (d: number) => void; step: number;
  hint?: string; error?: string; onDone: () => void; doneLabel: string; doneDisabled?: boolean;
}) {
  const tile = (f: 'weight' | 'reps', v: string, unit: string, label: string) => (
    <button type="button" className={cx('milo-press milo-focus', s.tile, field === f && s.tileOn, error && field === f && s.tileBad)} onClick={() => onField(f)} aria-pressed={field === f} aria-label={`${label} ${v || '未填'} ${unit}`}>
      <span className="milo-text-caption">{label}</span>
      <span className={s.tileNum}>{v ? <Odometer value={v} size="xl" /> : <b className={s.tileEmpty}>—</b>}<i>{unit}</i></span>
    </button>
  );
  return (
    <div className={s.editor}>
      <div className={s.tiles}>{tile('weight', weight, 'kg', '重量')}<i className={s.times}>×</i>{tile('reps', reps, '次', '次数')}</div>
      <p className={cx('milo-text-caption', s.editorNote, error ? s.err : s.hint)} role={error ? 'alert' : undefined}>{error ?? hint ?? ' '}</p>
      <NumPad onKey={onKey} onStep={onStep} step={field === 'weight' ? step : 1} unit={field === 'weight' ? 'kg' : '次'} onNext={onDone} nextDisabled={doneDisabled} nextLabel={doneLabel} />
    </div>
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
/** 票根行（6c，Stitch l6 C 的取舍）：左边大号日期（10/6）+ 周几，虚线（撕口），中间主要部位和动作 / 组 / 分钟，右边骨白 PR 标；
 *  没有 onClick 是静态行（不画箭头、没有按下反馈）；有 onClick 整行可点（≥ 48）。date 传数字（只有「日」）或「10/6」；year 只有不在今年时才传 */
export function SessionRow({ date, weekday, year, title, meta, prs, deload, onClick, state }: {
  date: number | string; weekday: string; year?: number; title: string; meta: string; prs?: number; deload?: boolean; onClick?: () => void; state?: Forced;
}) {
  const body = (
    <>
      <span className={s.date}><b className="milo-text-number-m">{date}</b><span className="milo-text-caption">{year ? `${year} · ` : ''}周{weekday}</span></span>
      <span className={s.exText}><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{meta}</span></span>
      {deload && <Tag>减量</Tag>}
      {prs ? <Tag tone="strong" icon="star">PR {prs}</Tag> : null}
      {onClick && <Icon name="chevron" small />}
    </>
  );
  return onClick
    ? <button type="button" className={cx('milo-press milo-focus', s.session)} onClick={onClick} {...forced(state)}>{body}</button>
    : <div className={cx(s.session, s.sessionStatic)}>{body}</div>;
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
