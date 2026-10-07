/** 增量总览页（P09，ia §1.9）：一屏回答「我有没有在变强、下一次该加多少」。
 *  五层：
 *  - 战略：用户在两次训练之间翻一眼，确认力量在涨，并且知道下次每个动作做多少——下次的数必须和首页处方是同一个数。
 *  - 范围：近 4 周摘要、减量状态行（可点开面板）、按部位筛选、按引擎结论分组的动作列表；点一行进这个动作的曲线页（/gains/:exerciseId），返回时还原筛选和滚动位置。
 *  - 结构：Tab 根页（导航「增量」选中）；没练过任何动作时是空状态，唯一出路是回首页。
 *  - 框架：整页是一个滚动区——页头首屏（标题 + 配重片环摘要 + 破纪录）跟着内容一起滑走，不钉在顶上，列表区最大；
 *    页头跟着滑走（不留细标题栏），「部位筛选」一行滑到顶后贴顶（半透明虚化底），随时能换部位；长了右下角有回到顶端。首屏 → 减量状态 → 筛选 → 三组（该加重 / 保持 / 该减重；减量周合成一组）。
 *    整页只有「该加重」色带是荧光。
 *  - 表现：页头背景是一圈很淡的配重片同心纹（每页一处）；环 = 近 4 周练过的动作按涨 / 持平 / 退 / 刚开始记分段，每个数后面写「个动作」；
 *    破纪录次数用码表滚动（M04）；切部位时列表交错弹入（M07）；涨跌一律 ▲▼= 形状 + 文字。
 *  （2026-10-06 返工：用户验收「页头没有设计感、摘要数字看不懂、页头贴顶、曲线对不齐」；Stitch g8 的取舍见 design/hifi/gains/decision.md） */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { flushSync } from 'react-dom';
import { BackToTop, Cascade, Chip, Collapsible, GainGroupHead, GainRow, GainSummary, PageHeader, Screen, StateView, drillTransition, useToast, type Tab } from '../components';
import { env, fmt, REGION_NAME } from '../data/demo';
import { gainsData, groupGains, type GainRow as Row } from '../data/gains';
import type { GainGroupKind as GroupKind } from '../components';
import { useSource } from '../data/useSource';
import type { Region } from '../engine';
import { T } from '../styles/tokens.gen';
import { DeloadBanner } from './DeloadBanner';
import { TipBanner } from './TipBanner';
import { DeloadSheet } from './DeloadSheet';
import { TabNav } from './TabNav';
import s from './GainsPage.module.css';

/** 点进曲线页前记下部位筛选和滚动位置，返回时还原（按场景分开记；刷新页面就忘了，不写存储） */
const memo = new Map<string, { region: Region | 'all'; top: number; from?: string; open?: Partial<Record<GroupKind, boolean>> }>();

/** 涨跌文字：重量动作 ±kg，自重动作 ±次 */
const deltaText = (r: Row) => {
  const d = r.delta.diff;
  return d == null || d === 0 ? undefined : `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))} ${r.unit}`;
};
/** 目标后的小字：减量周写系数；很久没练写「N 周前」 */
const noteOf = (r: Row) => (r.deloaded ? `减量 ×${env.cfg.deload.intensity}` : r.daysAgo >= 56 ? `${Math.floor(r.daysAgo / 7)} 周前` : undefined);

export function GainsPage({ scenario, now, onTab }: { scenario?: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const nav = useNavigate(), loc = useLocation(), toast = useToast();
  const { src, adopt, skip } = useSource(scenario, now);
  const key = scenario ?? 'live', scroll = useRef<HTMLDivElement>(null);
  const d = useMemo(() => gainsData(src, now), [src, now]);
  const [region, setRegion] = useState<Region | 'all'>(() => memo.get(key)?.region ?? 'all');
  // 分组展开状态（2026-10-06 用户：展开太多、点标题要能收起）：默认只展开第一组，其余只露组头；点进曲线再回来还原
  const [openMap, setOpenMap] = useState<Partial<Record<GroupKind, boolean>>>(() => memo.get(key)?.open ?? {});
  useLayoutEffect(() => { const m = memo.get(key); if (m && scroll.current) scroll.current.scrollTop = m.top; }, [key]);
  // 钻入转场：被点的那一行带共享名；从曲线页返回时，落回的那一行（memo.from）也带名，且这一次不播入场（转场要拍到完整的列表行）
  const [drill, setDrill] = useState<string | null>(() => memo.get(key)?.from ?? null);
  const [landed] = useState(() => !!memo.get(key)?.from);
  useLayoutEffect(() => {
    if (!landed) return;
    const m = memo.get(key); if (m) memo.set(key, { ...m, from: undefined });
    const id = window.setTimeout(() => setDrill(null), T['motion/spring-ms'] * 3);  // 转场放完后撤掉共享名
    return () => window.clearTimeout(id);
  }, [key, landed]);
  const open = (id: string) => {
    memo.set(key, { region, top: scroll.current?.scrollTop ?? 0, from: id, open: openMap });
    drillTransition(() => nav(`/gains/${id}${loc.search}`), '[data-drill-ready=trend]', 'in', () => flushSync(() => setDrill(id)));
  };
  const [deloadOpen, setDeloadOpen] = useState(false);
  const week = d.dv.kind === 'week';
  const shown = region === 'all' || !d.regions.includes(region) ? d.rows : d.rows.filter((r) => r.region === region);
  const groups = groupGains(shown, week);
  const sm = d.summary;

  return (
    <Screen label="增量">
      <div ref={scroll} className={s.scroll} data-drill-ready="gains">
        <div className={s.hero}>
          <span className={s.plate} aria-hidden="true" />
          <PageHeader title="增量">{!d.empty && <GainSummary {...sm} />}</PageHeader>
        </div>
        <div className={s.body}>
          {d.empty ? (
            <StateView kind="empty" title="还没有训练记录" detail="练完第一次，这里就会告诉你每个动作有没有在涨、下次该加多少。" action="去今日处方" onAction={() => nav('/today' + (scenario ? `?scenario=${scenario}` : ''))} />
          ) : (
            <>
              <DeloadBanner dv={d.dv} hits={d.sig.hits.length} onOpen={() => setDeloadOpen(true)} />
              <TipBanner page="gains" src={src} scenario={scenario} now={now} />

              {d.regions.length > 1 && (
                <div className={s.chipBar}>
                  <div className={s.chips} role="group" aria-label="按部位筛选">
                    <Chip selected={region === 'all'} onClick={() => setRegion('all')}>全部</Chip>
                    {d.regions.map((r) => <Chip key={r} selected={region === r} onClick={() => setRegion(r)}>{REGION_NAME[r]}</Chip>)}
                  </div>
                </div>
              )}

              <Cascade replayKey={region} still={landed}>
                {groups.map((g, gi) => {
                  // 只有一组（减量周）时不用收；否则默认只展开第一组
                  const solo = groups.length === 1, isOpen = solo || (openMap[g.kind] ?? gi === 0), bodyId = `gains-${g.kind}`;
                  return (
                    <section key={g.kind} className={s.group}>
                      <GainGroupHead kind={g.kind} count={g.rows.length} expanded={isOpen} controls={bodyId} onToggle={solo ? undefined : () => setOpenMap((m) => ({ ...m, [g.kind]: !isOpen }))} />
                      <Collapsible open={isOpen} id={bodyId}>
                        {g.rows.map((r) => (
                          <GainRow key={r.exerciseId} name={r.name} latest={r.latest} unit={r.unit} delta={{ dir: r.delta.dir, value: deltaText(r) }} pr={r.pr4w}
                            points={r.points} target={r.target?.text ?? null} note={noteOf(r)} onClick={() => open(r.exerciseId)} drillId={drill === r.exerciseId ? r.exerciseId : undefined} />
                        ))}
                      </Collapsible>
                    </section>
                  );
                })}
              </Cascade>
            </>
          )}
        </div>
      </div>
      <TabNav selected="gains" scenario={scenario} now={now} onTab={onTab} />
      {deloadOpen && <DeloadSheet hits={d.sig.hits} onClose={() => setDeloadOpen(false)}
        onAdopt={() => { adopt(); setDeloadOpen(false); toast.show(`已进入减量周 · ${env.cfg.deload.days} 天`); }}
        onSkip={() => { skip(); setDeloadOpen(false); toast.show(`这次不减，${env.cfg.deload.days} 天内不再提醒`); }} />}
      <BackToTop target={scroll} />
    </Screen>
  );
}
