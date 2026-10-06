/** 记录页（P07，ia §1.8）：过去每一次练了什么。
 *  五层：
 *  - 战略：用户翻一眼就知道这三个月练得勤不勤，并能顺着时间找到某一次训练。
 *  - 范围：近 3 个月钢板日历（练过的日子是冲出来的孔）+ 按周分组的训练列表（每周合计：次数 · 组数 · 总负荷）+ 空态；
 *    一次渲染最近 8 周，底部「更早的训练」再展开 8 周（ia：数百条分段加载）；不在今年的带年份。
 *  - 结构：Tab 根页（导航「记录」选中）；整页一个滚动区；没有任何训练时钢板是一块没有孔的板，唯一出路是回今日处方。
 *  - 框架：页头 C（大标题滑走后顶上留 44 高的细标题栏）→ 一句话「近 3 个月练了 N 天」→ 钢板 → 周头（本周 · 日期范围 | 三个带单位的合计）→ 票根行。
 *    列表区最大；这一页没有主操作按钮（浏览页）；点一行进训练详情 P08（M09 钻入转场：日期飞成详情标题、部位飞成副标题），返回还原滚动位置和展开的周数。
 *  - 表现：钢板是这一页唯一的荧光（孔 + 板两侧的漏光），随页面滑动换亮区（见 components/plate.*）；PR 标用骨白；周合计的数字用压缩粗体。
 *  设计过程与取舍见 design/hifi/log/（Stitch l6 的 C 票根行、钢板方案 plate-plan.md）。 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router';
import { Button, Num, PageHeader, Screen, SessionRow, StateView, SteelPlate, dotDays, dotMonths, drillTransition, type Tab } from '../components';
import { fmt } from '../data/demo';
import { logData, weekTotals } from '../data/log';
import { useSource } from '../data/useSource';
import { T } from '../styles/tokens.gen';
import { TabNav } from './TabNav';
import s from './LogPage.module.css';

/** 一次渲染几周 */
const CHUNK = 8;
/** 点进详情前记下滚动位置、展开了几周、点的是哪一行，返回时还原（按场景分开记；刷新页面就忘了，不写存储） */
const memo = new Map<string, { top: number; shown: number; from?: string }>();

export function LogPage({ scenario, now, onTab }: { scenario?: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const nav = useNavigate(), loc = useLocation();
  const { src } = useSource(scenario, now);
  const key = scenario ?? 'live', scroll = useRef<HTMLDivElement>(null);
  const d = useMemo(() => logData(src, now), [src, now]);
  const months = useMemo(() => dotMonths(d.trained, now, 3), [d.trained, now]);
  const days = dotDays(months);
  const [shown, setShown] = useState(() => memo.get(key)?.shown ?? CHUNK);
  const weeks = d.weeks.slice(0, shown), more = d.weeks.length - weeks.length;
  useLayoutEffect(() => { const m = memo.get(key); if (m && scroll.current) scroll.current.scrollTop = m.top; }, [key]);
  // 钻入转场：被点的那一行带共享名；从详情返回时，落回的那一行（memo.from）也带名，转场放完后撤掉
  const [drill, setDrill] = useState<string | null>(() => memo.get(key)?.from ?? null);
  const [landed] = useState(() => !!memo.get(key)?.from);  // 先记下「是不是从详情落回来的」：严格模式下 effect 会跑两遍，第二遍 memo 里的 from 已经清掉了
  useLayoutEffect(() => {
    if (!landed) return;
    const m = memo.get(key); if (m) memo.set(key, { ...m, from: undefined });
    const id = window.setTimeout(() => setDrill(null), T['motion/spring-ms'] * 3);
    return () => window.clearTimeout(id);
  }, [key, landed]);
  const open = (id: string) => {
    memo.set(key, { top: scroll.current?.scrollTop ?? 0, shown, from: id });
    drillTransition(() => nav(`/log/${id}${loc.search}`), '[data-drill-ready=logdetail]', 'in', () => flushSync(() => setDrill(id)));
  };

  return (
    <Screen label="记录">
      <div ref={scroll} className={s.scroll} data-drill-ready="log">
        <PageHeader collapse title="记录" eyebrow="过去每一次练了什么">
          <p className={s.lead}>{days > 0 ? <>近 3 个月练了 <b>{days}</b> 天</> : '近 3 个月还没练过'}</p>
        </PageHeader>
        <div className={s.body}>
          <SteelPlate months={months} />
          {d.empty ? (
            <StateView kind="empty" title="还没有训练记录" detail="练完第一次，这里会按周列出每次训练，并在钢板上冲出一个孔。" action="去今日处方" onAction={() => nav('/today' + (scenario ? `?scenario=${scenario}` : ''))} />
          ) : (
            <>
              {weeks.map((w) => (
                <section key={w.key} className={s.week}>
                  <header className={s.weekHead}>
                    <h2 className={`milo-text-body-strong ${s.weekTitle}`}>{w.label && <b>{w.label}</b>}<span className="milo-text-caption">{w.range}</span></h2>
                    <span className={s.totals} role="text" aria-label={weekTotals(w)}><Num size="s" value={w.count} unit="次" /><Num size="s" value={w.sets} unit="组" /><Num size="s" value={fmt(w.load)} unit="kg" /></span>
                  </header>
                  <div className={s.rows}>
                    {w.rows.map((r) => <SessionRow key={r.id} date={r.date} weekday={r.weekday} year={r.year} title={r.title} meta={r.meta} prs={r.prs} onClick={() => open(r.id)} drillId={drill === r.id ? r.id : undefined} />)}
                  </div>
                </section>
              ))}
              {more > 0 && <div className={s.more}><Button kind="ghost" size="s" onClick={() => setShown((n) => n + CHUNK)}>更早的训练 · 还有 {more} 周</Button></div>}
            </>
          )}
        </div>
      </div>
      <TabNav selected="log" scenario={scenario} now={now} onTab={onTab} />
    </Screen>
  );
}
