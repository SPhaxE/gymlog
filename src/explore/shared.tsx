/** 高保真页共用的件：导航（5 项都带名称）、分段控件、刻度尺。M3 时拆进 src/components。 */
import type { ReactNode } from 'react';
import s from './explore.module.css';

const ICONS: Record<string, string> = {
  home: 'M4 11.2 12 4l8 7.2V20h-5.2v-5.4H9.2V20H4z',
  body: 'M12 2.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM6.4 9h11.2l-.6 2.2-3.2 1V16l1.6 6h-2.3L12 17.2 10.9 22H8.6l1.6-6v-3.8l-3.2-1z',
  gains: 'M3 18.5 9.2 12l3.6 3.6L19 9.3V13h2V6h-7v2h3.6l-4.8 4.8L9.2 9.2 1.6 17.1z',
  log: 'M5 3h14v18H5zm3 4v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z',
  me: 'M12 3.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zM4 20.5c.6-4 3.8-6.6 8-6.6s7.4 2.6 8 6.6z',
};
export const TABS = [['home', '首页'], ['body', '身体'], ['gains', '增量'], ['log', '记录'], ['me', '我的']] as const;
export type Tab = (typeof TABS)[number][0];

export function Icon({ name }: { name: string }) {
  return <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[name]} fillRule="evenodd" /></svg>;
}

/** 底部导航：5 项都是「图标 + 名称」，选中项骨白实心；外圈细环 = 今日进度（null 不画环，0 只画轨道） */
export function Nav({ selected, progress, rest }: { selected: Tab; progress: number | null; rest?: string }) {
  return (
    <nav className={s.nav} aria-label="主导航">
      {progress != null && (
        <svg className={s.navRing} preserveAspectRatio="none" aria-hidden="true">
          <rect className={s.navTrack} x="1" y="1" rx="30" ry="30" />
          {progress > 0 && <rect className={s.navProgress} x="1" y="1" rx="30" ry="30" pathLength={1} style={{ strokeDasharray: `${progress} 1` }} />}
        </svg>
      )}
      {TABS.map(([k, label]) => (
        <a key={k} href={`/explore/${k}`} className={k === selected ? s.navOn : s.navItem} aria-current={k === selected ? 'page' : undefined}>
          <Icon name={k} />
          <span>{k === selected && rest ? rest : label}</span>
        </a>
      ))}
    </nav>
  );
}

export function Segmented<T extends string>({ items, value, onChange }: { items: [T, string][]; value: T; onChange?: (v: T) => void }) {
  return (
    <div className={s.seg} role="tablist">
      {items.map(([k, label]) => (
        <button key={k} type="button" role="tab" aria-selected={k === value} className={k === value ? s.segOn : undefined} onClick={() => onChange?.(k)}>{label}</button>
      ))}
    </div>
  );
}

/** 刻度线：做分隔线或量尺，不做装饰 */
export function Ticks({ className }: { className?: string }) {
  return <div className={`${s.ticks} ${className ?? ''}`} aria-hidden="true" />;
}

export function Screen({ children, label }: { children: ReactNode; label: string }) {
  return <main className={s.screen} aria-label={label}>{children}</main>;
}
