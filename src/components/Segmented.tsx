/** 分段控件：选中项骨白实心（control/selected）。高 size/segment-h，命中区向外扩到 hit-min。 */
import s from './Segmented.module.css';

export function Segmented<V extends string>({ items, value, onChange, label }: { items: readonly (readonly [V, string])[]; value: V; onChange?: (v: V) => void; label: string }) {
  return (
    <div className={s.seg} role="radiogroup" aria-label={label}>
      {items.map(([k, text]) => (
        <button key={k} type="button" role="radio" aria-checked={k === value} className={k === value ? s.on : s.item} onClick={() => onChange?.(k)}>{text}</button>
      ))}
    </div>
  );
}
