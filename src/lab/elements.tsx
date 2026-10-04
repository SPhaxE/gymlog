/** 参考图里可以挪用的版式元素（ref1 / ref3 / ref5 / ref2），用演示场景的引擎数据画出来。 */
import { useMemo, type ReactNode } from 'react';
import { DAY, sessionStats, startOfDay } from '../engine';
import { IconButton, Nav, Num, Sparkline } from '../components';
import type { Fixtures } from '../playground/fixtures';
import { T } from '../styles/tokens.gen';
import { grainTile } from './Atmosphere';
import { SnapChart } from './motions';
import s from './lab.module.css';

/* E1 点阵日历（ref1）：近 3 个月，每天一个点，练过的点亮，今天一圈 */
export function DotCalendar({ f }: { f: Fixtures }) {
  const months = useMemo(() => {
    const trained = new Map<number, boolean>();
    for (const x of f.history) { const d = startOfDay(x.startMs); trained.set(d, trained.get(d) || false); }
    const now = new Date(f.now), out: { label: string; cols: { t: number; inMonth: boolean }[][] }[] = [];
    for (let m = 2; m >= 0; m--) {
      const first = new Date(now.getFullYear(), now.getMonth() - m, 1), last = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      let t = first.getTime() - ((first.getDay() + 6) % 7) * DAY;
      const cols: { t: number; inMonth: boolean }[][] = [];
      while (t <= last.getTime()) { const col = []; for (let i = 0; i < 7; i++, t += DAY) col.push({ t: startOfDay(t), inMonth: new Date(t).getMonth() === first.getMonth() }); cols.push(col); }
      out.push({ label: `${first.getMonth() + 1}月`, cols });
    }
    return { out, trained };
  }, [f]);
  const today = startOfDay(f.now);
  return (
    <div className={s.dots}>
      {months.out.map((m) => (
        <div key={m.label} className={s.dotMonth}>
          <span className="milo-text-caption">{m.label}</span>
          <div className={s.dotGrid}>{m.cols.map((col, ci) => <div key={ci} className={s.dotCol}>{col.map(({ t, inMonth }) => (
            <i key={t} className={!inMonth ? s.dotOut : t === today ? s.dotToday : months.trained.has(t) ? s.dotOn : t > today ? s.dotFuture : s.dot} />
          ))}</div>)}</div>
        </div>
      ))}
    </div>
  );
}

/* E2 环中数字（ref1「1」「2」）：今日第几个动作 / 已完成组数 */
export function RingNumber({ n, p, title, sub }: { n: number; p: number; title: string; sub: string }) {
  const r = T['space/3xl'] - T['stroke/ring-progress'], c = 2 * Math.PI * r, box = T['space/3xl'] * 2;
  return (
    <div className={s.ringRow}>
      <svg width={box} height={box} className={s.ring}>
        <circle cx={box / 2} cy={box / 2} r={r} className={s.ringTrack} />
        <circle cx={box / 2} cy={box / 2} r={r} className={s.ringProg} strokeDasharray={`${c * p} ${c}`} transform={`rotate(-90 ${box / 2} ${box / 2})`} />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={s.ringNum}>{n}</text>
      </svg>
      <div><div className="milo-text-heading">{title}</div><div className="milo-text-caption">{sub}</div></div>
    </div>
  );
}

/* E3 竖向胶囊量表（ref3 Active Cards）：近 8 周每周完成组数，本周骨白 */
export function WeekBars({ f }: { f: Fixtures }) {
  const weeks = useMemo(() => {
    const end = startOfDay(f.now) + DAY, out = Array.from({ length: 8 }, (_, i) => ({ i, sets: 0 }));
    for (const x of f.history) { const k = Math.floor((end - x.startMs) / (7 * DAY)); if (k >= 0 && k < 8) out[7 - k].sets += sessionStats(x).sets; }
    return out;
  }, [f]);
  const max = Math.max(...weeks.map((w) => w.sets), 1);
  return (
    <div className={s.bars}>
      {weeks.map((w) => (
        <div key={w.i} className={s.barCol}>
          <span className={s.barVal}>{w.sets}</span>
          <div className={s.barTrack}><i className={w.i === 7 ? s.barNow : s.barFill} style={{ height: `${(w.sets / max) * 100}%` }} /></div>
          <span className="milo-text-micro">{w.i === 7 ? '本周' : `−${7 - w.i}`}</span>
        </div>
      ))}
    </div>
  );
}

/* E4 超大渐变数字（ref5「60%」）：结算页唯一的一次「大声」 */
export function GiantNumber({ value, unit, caption }: { value: string; unit: string; caption: string }) {
  const g = grainTile();
  return (
    <div className={s.giant} style={{ ['--grain' as string]: g ? `url(${g})` : 'none' }}>
      <span className="milo-text-caption">{caption}</span>
      <div className={s.giantNum}>{value}<i>{unit}</i></div>
    </div>
  );
}

/* E5 曲线 + 游标气泡 + 渐变面积（ref2 / ref4 / ref5）—— 与 M04 合在一起 */
export const CursorChart = ({ f }: { f: Fixtures }) => <SnapChart points={f.trends.normal} />;

/* E6 磨砂玻璃浮层（ref3）：卡片浮在图表上，背后模糊 */
export function GlassCard({ f }: { f: Fixtures }) {
  return (
    <div className={s.glassStage}>
      <div className={s.glassBack}><SnapChart points={f.trends.normal} area /></div>
      <div className={s.glass}><span className="milo-text-caption">近 4 周</span><Num size="l" value="+5.3" unit="kg" /><Sparkline points={f.trends.normal} label="杠铃卧推" /></div>
    </div>
  );
}

/* E7 只有选中项写名称的导航（ref2） */
export const CompactNav = () => <div className={s.navBox}><Nav selected="body" progress={8 / 14} compact /></div>;

/* E8 圆角方形图标按钮（ref4 / ref5 的返回、更多） */
export function SquareButtons() {
  return <div className={s.squareRow}><span className={s.square}><IconButton icon="back" label="返回" /></span><span className={s.square}><IconButton icon="more" label="更多" /></span>
    <span className={s.caption}>对照：</span><IconButton icon="back" label="返回" /><IconButton icon="more" label="更多" /></div>;
}

export const Pair = ({ children }: { children: ReactNode }) => <div className={s.pair}>{children}</div>;
