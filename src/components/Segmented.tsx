/** 分段控件：选中项骨白实心（control/selected）。高 size/segment-h，命中区向外扩到 hit-min。
 *  role=radiogroup，方向键切换。state 强制显示在第一个未选中项上（Playground 用）。 */
import { cx, forced, type Forced } from './state';
import s from './Segmented.module.css';

export function Segmented<V extends string>({ items, value, onChange, label, disabled, state }: {
  items: readonly (readonly [V, string])[]; value: V; onChange?: (v: V) => void; label: string; disabled?: boolean; state?: Forced;
}) {
  const firstOff = items.find(([k]) => k !== value)?.[0];
  const move = (d: number) => { const i = items.findIndex(([k]) => k === value); onChange?.(items[(i + d + items.length) % items.length][0]); };
  return (
    <div className={s.seg} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      }}>
      {items.map(([k, text]) => (
        <button key={k} type="button" role="radio" aria-checked={k === value} tabIndex={k === value ? 0 : -1} disabled={disabled}
          className={cx('milo-press milo-focus', k === value ? s.on : s.item)} onClick={() => onChange?.(k)} {...(k === firstOff ? forced(state) : {})}>
          {text}
        </button>
      ))}
    </div>
  );
}
