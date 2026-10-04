/** 按钮（DESIGN §9）。
 *  kind：primary = 荧光（每屏唯一的行动焦点）；neutral = 骨白实心（完成、确认）；ghost = 描边（次要）；danger = 危险操作（删除、清除）。
 *  size：l = 整宽 size/button-h；s = 自适应宽 size/button-h-s，用于行内和状态条。
 *  状态：按下 / 聚焦（state 强制显示，见 state.ts）、禁用、加载（三点，aria-busy，宽度不变）。 */
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cx, forced, type Forced } from './state';
import s from './Button.module.css';

export type ButtonKind = 'primary' | 'neutral' | 'ghost' | 'danger';
export interface ButtonProps {
  kind?: ButtonKind; size?: 'l' | 's'; icon?: IconName; children: ReactNode; onClick?: () => void;
  disabled?: boolean; loading?: boolean; state?: Forced; type?: 'button' | 'submit';
}

export function Button({ kind = 'primary', size = 'l', icon, children, onClick, disabled, loading, state, type = 'button' }: ButtonProps) {
  return (
    <button type={type} className={cx('milo-press milo-focus', s.btn, s[kind], s[size])} onClick={loading ? undefined : onClick}
      disabled={disabled} aria-busy={loading || undefined} {...forced(state)}>
      <span className={cx(s.label, loading && s.hidden)}>{icon && <Icon name={icon} small={size === 's'} />}{children}</span>
      {loading && <span className={cx('milo-dots', s.dots)} role="status" aria-label="加载中"><i /><i /><i /></span>}
    </button>
  );
}

/** 图标按钮：raised = 圆形实底（页头、面板关闭）；plain = 无底（行内）。视觉 size/button-h-s，命中区补到 hit-min。必须有 label。 */
export function IconButton({ icon, label, kind = 'raised', onClick, disabled, state }: {
  icon: IconName; label: string; kind?: 'raised' | 'plain'; onClick?: () => void; disabled?: boolean; state?: Forced;
}) {
  return (
    <button type="button" className={cx('milo-press milo-focus', s.iconBtn, s[kind])} onClick={onClick} disabled={disabled} aria-label={label} {...forced(state)}>
      <Icon name={icon} />
    </button>
  );
}
