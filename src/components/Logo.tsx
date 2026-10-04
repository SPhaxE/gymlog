/** Logo（阶段 5.5b 第一轮，2026-10-05）：用户选的两个方向各自精修，再出一个组合。
 *  - M「牛角 M」（意向图 3_40AM）：粗重的 M，两侧外缘顶出荧光新月角；整体 skewX(−11°)，与 I3 图标同一个倾斜。
 *  - B「递增条牛头」（意向图 3_44AM）：9 根竖条，从角往中间一根比一根长（每次只多一点 = 渐进超负荷），下缘收成 V 形牛脸；两根角条是荧光。
 *  - 组合：图标用递增条，字标里的 M 用牛角 M。
 *  2026-10-05 用户选定 B（递增条牛头）；≤ 24 像素用 7 根宽条的简化版（small）。M 与组合保留在代码里，不再出现在评审页。
 *  状态（brief「增长与商业化层」§5）：idle 平常 / loading 加载 / training 训练中 / pr 破纪录 / rest 恢复日 / deload 减量周。
 *  状态只改姿态、发光、点缀与条的长短，不改标志本身；动效全部用 CSS（motion Token），减少动态效果时静止。 */
import type { CSSProperties } from 'react';
import s from './Logo.module.css';

export type LogoMark = 'm' | 'bars';
export type LogoState = 'idle' | 'loading' | 'training' | 'pr' | 'rest' | 'deload';
export const LOGO_STATE_NAME: Record<LogoState, string> = { idle: '平常', loading: '加载', training: '训练中', pr: '破纪录', rest: '恢复日', deload: '减量周' };

const SLANT = 'translate(4.67 0) skewX(-11)'; // 以 y = 24 为轴倾斜 11°（48 画布），同图标网格规范

/** 牛角 M：画布 48 × 48 */
const M_BODY = 'M7 41V17h9.5L24 28.5 31.5 17H41v24h-9.5V30.5L26 38.5h-4l-5.5-8V41z';
const HORN_L = 'M7 17C3.2 14.4 2.6 9.2 4.6 4.2 5.3 9 8.4 12.2 14.6 13.4L15.6 17z';
const HORN_R = 'M41 17C44.8 14.4 45.4 9.2 43.4 4.2 42.7 9 39.6 12.2 33.4 13.4L32.4 17z';

/** 递增条：9 根，[上缘, 下缘]；两侧角条最短、越往中间越长 */
const BARS: Array<[number, number]> = [[5, 18], [12, 25.5], [14.5, 30.5], [16, 35.5], [16.5, 41], [16, 35.5], [14.5, 30.5], [12, 25.5], [5, 18]];
const BAR_W = 3.4, BAR_GAP = 1.3, BAR_X0 = 24 - (9 * BAR_W + 8 * BAR_GAP) / 2;

function MarkM() {
  return (
    <g transform={SLANT}>
      <path className={s.hornL} d={HORN_L} />
      <path className={s.hornR} d={HORN_R} />
      <path className={s.body} d={M_BODY} />
      <path className={s.trace} d={M_BODY} pathLength={1} />
    </g>
  );
}

/** 小尺寸（≤ 24px）：7 根、更宽的条，免得糊成一片 */
const BARS_S: Array<[number, number]> = [[6, 19], [13, 27], [15.5, 33.5], [16.5, 41], [15.5, 33.5], [13, 27], [6, 19]];
const BAR_W_S = 4.4, BAR_GAP_S = 1.9, BAR_X0_S = 24 - (7 * BAR_W_S + 6 * BAR_GAP_S) / 2;

function MarkBars({ small }: { small?: boolean }) {
  const bars = small ? BARS_S : BARS, w = small ? BAR_W_S : BAR_W, gap = small ? BAR_GAP_S : BAR_GAP, x0 = small ? BAR_X0_S : BAR_X0;
  return (
    <g transform={SLANT}>
      {bars.map(([t, b], i) => (
        <rect key={i} className={i === 0 || i === bars.length - 1 ? s.barHorn : s.bar} style={{ '--i': i } as CSSProperties}
          x={x0 + i * (w + gap)} y={t} width={w} height={b - t} rx={w / 2} />
      ))}
    </g>
  );
}

/** 标志本身（无底板）；state 驱动动效 */
export function LogoGlyph({ mark, state = 'idle', small, className }: { mark: LogoMark; state?: LogoState; small?: boolean; className?: string }) {
  return (
    <svg className={`${className ?? s.glyph} ${s[state]}`} viewBox="0 0 48 48" aria-hidden="true">
      {state === 'training' && <g className={s.speed}><path d="M1 20h7M-1 26h8M2 32h6" /></g>}
      {state === 'pr' && <g className={s.burst}><path d="M4 2 6 5M44 2 42 5M24 0v3M1 10l3 1M47 10l-3 1" /></g>}
      <g className={s.pose}>{mark === 'm' ? <MarkM /> : <MarkBars small={small} />}</g>
      {state === 'rest' && <g className={s.zz}><text x="38" y="12" fontSize="7">z</text><text x="43" y="6" fontSize="5">z</text></g>}
      {state === 'deload' && <circle className={s.ring} cx="24" cy="24" r="23" />}
    </svg>
  );
}

/** App 图标：圆角方形底板 + 标志 */
export function AppIcon({ mark, state = 'idle', light, className }: { mark: LogoMark; state?: LogoState; light?: boolean; className?: string }) {
  return (
    <span className={`${className ?? s.appIcon} ${light ? s.appIconLight : ''}`} role="img" aria-label="慢牛 Milo">
      <LogoGlyph mark={mark} state={state} className={s.appGlyph} />
    </span>
  );
}

/** 横排组合：图标 + 「慢牛 Milo」。hornM：字标的 M 用牛角 M */
export function Lockup({ mark, hornM, mono, className }: { mark?: LogoMark; hornM?: boolean; mono?: boolean; className?: string }) {
  return (
    <span className={`${className ?? s.lockup} ${mono ? s.mono : ''}`} role="img" aria-label="慢牛 Milo">
      {mark && <LogoGlyph mark={mark} className={s.lockGlyph} />}
      <span className={s.word}>
        <span className={s.cn}>慢牛</span>
        {hornM ? <span className={s.en}><svg className={s.mInline} viewBox="2 2 44 40" aria-hidden="true"><MarkM /></svg>ilo</span> : <span className={s.en}>Milo</span>}
      </span>
    </span>
  );
}
