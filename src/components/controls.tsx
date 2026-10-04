/** 表单控件（DESIGN §9）：Chip、Switch、OptionCard、Stepper、NumberField、ProgressSteps。
 *  选中一律骨白（control/selected），不用荧光；命中区不小于 size/hit-min。 */
import { useId, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx, forced, type Forced } from './state';
import s from './controls.module.css';

/** 筛选标签（P09 按部位筛选）：aria-pressed */
export function Chip({ children, selected, onClick, disabled, state }: { children: ReactNode; selected?: boolean; onClick?: () => void; disabled?: boolean; state?: Forced }) {
  return (
    <button type="button" className={cx('milo-press milo-focus', s.chip, selected && s.chipOn)} aria-pressed={!!selected} onClick={onClick} disabled={disabled} {...forced(state)}>
      {children}
    </button>
  );
}

/** 开关（我的 · 导航分组）：role=switch；开 = 骨白轨道 + 深色圆钮 */
export function Switch({ checked, onChange, label, disabled, state }: { checked: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean; state?: Forced }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={cx('milo-press milo-focus', s.switch, checked && s.switchOn)}
      onClick={() => onChange?.(!checked)} disabled={disabled} {...forced(state)}>
      <i className={s.knob} />
    </button>
  );
}

/** 选项卡（建档 / 设置）：single = 单选（role=radio，圆点），multi = 多选（role=checkbox，勾） */
export function OptionCard({ title, detail, selected, mode = 'single', onClick, disabled, state }: {
  title: string; detail?: string; selected: boolean; mode?: 'single' | 'multi'; onClick?: () => void; disabled?: boolean; state?: Forced;
}) {
  return (
    <button type="button" role={mode === 'single' ? 'radio' : 'checkbox'} aria-checked={selected} className={cx('milo-press milo-focus', s.option, selected && s.optionOn)}
      onClick={onClick} disabled={disabled} {...forced(state)}>
      <span className={s.optionText}><b className="milo-text-body-strong">{title}</b>{detail && <span className="milo-text-caption">{detail}</span>}</span>
      <i className={cx(mode === 'single' ? s.radio : s.check, selected && s.markOn)}>{selected && mode === 'multi' && <Icon name="check" small />}</i>
    </button>
  );
}

/** 一组选项卡：单选时方向键切换（radiogroup） */
export function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={s.group} role="radiogroup" aria-label={label}
      onKeyDown={(e) => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]:not(:disabled)')];
        const i = items.indexOf(document.activeElement as HTMLButtonElement);
        if (i < 0) return;
        e.preventDefault();
        const next = items[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
        next.focus(); next.click();
      }}>
      {children}
    </div>
  );
}

/** 步进器：重量 ±步进、时长 ±15、休息 ±15 秒。到上下限时对应按钮禁用；数值用 Number/M */
export function Stepper({ value, display, unit, step, min, max, onChange, label, disabled, state }: {
  value: number; display?: string; unit?: string; step: number; min: number; max: number; onChange?: (v: number) => void; label: string; disabled?: boolean; state?: Forced;
}) {
  const set = (v: number) => onChange?.(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className={cx(s.stepper, disabled && 'milo-disabled')} role="group" aria-label={label}>
      <button type="button" className={cx('milo-press milo-focus', s.stepBtn)} aria-label={`减 ${step}${unit ?? ''}`} disabled={disabled || value <= min} onClick={() => set(value - step)}><Icon name="minus" /></button>
      <output className={cx('milo-focus', s.stepVal)} tabIndex={disabled ? -1 : 0} aria-live="polite" {...forced(state)}
        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); set(value + step); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); set(value - step); } }}>
        <b className="milo-text-number-m">{display ?? value}</b>{unit && <i>{unit}</i>}
      </output>
      <button type="button" className={cx('milo-press milo-focus', s.stepBtn)} aria-label={`加 ${step}${unit ?? ''}`} disabled={disabled || value >= max} onClick={() => set(value + step)}><Icon name="plus" /></button>
    </div>
  );
}

/** 数字输入（记组：重量、次数）：大号数字 + 单位；error 时描边与提示为 feedback/danger，提示经 aria-describedby 读出。
 *  不在这里截断或纠正输入（ia §1.5：超范围一律拒绝并行内提示）。 */
export function NumberField({ label, value, unit, placeholder, error, helper, onChange, disabled, state, mode = 'decimal' }: {
  label: string; value: string; unit?: string; placeholder?: string; error?: string; helper?: string; onChange?: (v: string) => void;
  disabled?: boolean; state?: Forced; mode?: 'decimal' | 'numeric';
}) {
  const id = useId(), hint = error ?? helper;
  return (
    <label className={cx(s.field, error && s.fieldError, disabled && 'milo-disabled')}>
      <span className="milo-text-caption">{label}</span>
      <span className={cx(s.fieldBox, state === 'focused' && s.fieldFocus)} {...forced(state)}>
        <input className={s.input} value={value} placeholder={placeholder} inputMode={mode} disabled={disabled} aria-invalid={!!error || undefined}
          aria-describedby={hint ? id : undefined} readOnly={!onChange} onChange={(e) => onChange?.(e.target.value)} />
        {unit && <i className={s.fieldUnit}>{unit}</i>}
      </span>
      {hint && <span id={id} className={cx('milo-text-caption', error ? s.errorText : s.helper)}>{error && <Icon name="alert" small />}{hint}</span>}
    </label>
  );
}

/** 建档进度：已完成与当前段骨白，其余为轨道；右侧「1 / 3」 */
export function ProgressSteps({ current, total }: { current: number; total: number }) {
  return (
    <div className={s.steps} role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={`第 ${current} 步，共 ${total} 步`}>
      <div className={s.stepBars}>{Array.from({ length: total }, (_, i) => <i key={i} className={i < current ? s.stepOn : undefined} />)}</div>
      <span className="milo-text-number-xs">{current} / {total}</span>
    </div>
  );
}
