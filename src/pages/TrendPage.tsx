/** 动作进步曲线页（P10，ia §1.9）：选一个动作，看它的预估 1RM 随时间怎么变，以及下次该做多少。
 *  五层：
 *  - 战略：从增量页点进某个动作，确认「这个动作真的在涨」并看到具体哪一天、每一组做了什么；下次的数和首页处方、增量页是同一个数。
 *  - 范围：大数字（选中那一天的预估值 + 比上一次的涨跌）、曲线、选中那天的每一组、下次目标、最近 8 次明细；只练过 1 次 / 自重动作 / 动作不存在三种边界。
 *  - 结构：子页（没有导航），来自增量页；返回回到增量页原来的筛选和滚动位置，直接打开链接时返回去增量页。
 *  - 框架：整页一个滚动区，页头首屏（大数字）跟着内容滑走；曲线 → 选中那天 → 下次目标 → 最近 8 次。整页只有曲线的荧光渐隐面积是荧光。
 *  - 表现：大数字按位滚动（M04）；按住曲线横向拖，游标吸到最近一次训练（吸附轻振）；点明细的一行也能选中那天；PR 点是菱形，涨跌用 ▲▼= 形状 + 文字。
 *  （Stitch g9 三种结构的取舍见 design/hifi/gains/decision.md） */
import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { Banner, Delta, Odometer, Screen, SectionLabel, StateView, Tag, TopBar, TrendChart, drillName, drillTransition } from '../components';
import { env, fmt, REGION_NAME } from '../data/demo';
import { exerciseTrend } from '../data/gains';
import { useSource } from '../data/useSource';
import s from './TrendPage.module.css';

const dayText = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}月${d.getDate()}日`; };

export function TrendPage({ scenario, now }: { scenario?: string; now: number }) {
  const { exerciseId = '' } = useParams();
  const nav = useNavigate(), loc = useLocation();
  const { src } = useSource(scenario, now);
  const d = useMemo(() => exerciseTrend(src, exerciseId, now), [src, exerciseId, now]);
  const [sel, setSel] = useState<number | null>(null);   // 选中的是曲线上第几次；null = 最新一次
  // 从增量页来的就退回增量页（回到原来的筛选和滚动位置）；直接打开的链接替换成增量页
  // 目标页可能是增量页，也可能是训练详情（从详情点动作进来的）：等「不是曲线页的那个」挂好
  const back = () => drillTransition(
    () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/gains' + loc.search, { replace: true })), '[data-drill-ready]:not([data-drill-ready=trend])', 'out');

  if (!exerciseId) return <Navigate to={'/gains' + loc.search} replace />;
  if (!d) return (
    <Screen label="动作进步曲线">
      <TopBar title="找不到这个动作" onBack={back} />
      <div className={s.empty}>
        <StateView kind="empty" title="没有这个动作的记录" detail="它可能已经不在动作库里，或者你还没练过它。" action="回增量页" onAction={() => nav('/gains' + loc.search, { replace: true })} />
      </div>
    </Screen>
  );

  const { row, sessions, recent } = d;
  const i = sel != null && sessions[sel] ? sel : sessions.length - 1;
  const cur = sessions[i];
  const reps = row.metric === 'reps';
  const diffText = (x: { dir: string; diff: number | null }) => (x.diff == null || x.diff === 0 ? undefined : `${x.diff > 0 ? '+' : '−'}${fmt(Math.abs(x.diff))} ${row.unit}`);
  const sub = `${REGION_NAME[row.region]} · 共 ${row.n} 次记录`;

  return (
    <Screen label={`${row.name} 进步曲线`}>
      <TopBar title={row.name} sub={sub} onBack={back} titleStyle={drillName('name', exerciseId)} />
      <div className={s.scroll} data-drill-ready="trend">
        <header className={s.hero}>
          <span className={s.plate} aria-hidden="true" />
          <span className={`milo-text-caption ${s.label}`}>{reps ? '每次最好一组的次数' : '预估 1RM'} · {dayText(cur.t)}{cur.pr ? ' · 新纪录' : ''}</span>
          <div className={s.big} style={drillName('num', exerciseId)}>
            <Odometer value={fmt(cur.v)} size="hero" /><span className="milo-text-heading">{row.unit}</span>
          </div>
          <div className={s.deltaRow}>
            <Delta dir={cur.delta.dir} value={diffText(cur.delta)} />
            {cur.delta.dir !== 'baseline' && <span className="milo-text-caption">比上一次</span>}
          </div>
        </header>

        <div className={s.body}>
          {sessions.length < 2 && <Banner quiet detail="只有 1 次记录，再练一次就能看到趋势。" />}
          <div style={drillName('line', exerciseId)}><TrendChart draw points={sessions.map((x) => ({ t: x.t, v: x.v, pr: x.pr, label: x.label }))} selected={i} onSelect={setSel} unit={row.unit} readout={false} /></div>

          <section className={s.day} aria-label={`${dayText(cur.t)}的每一组`}>
            <SectionLabel>{dayText(cur.t)} · {cur.sets.length} 组</SectionLabel>
            <ul className={s.sets}>
              {cur.sets.map((x, k) => (
                <li key={k}><span className="milo-text-body">第 {k + 1} 组</span><b className="milo-text-number-m">{x}</b></li>
              ))}
            </ul>
          </section>

          <section className={s.next} aria-label="下次目标">
            <SectionLabel>下次目标</SectionLabel>
            {row.target ? (
              <>
                <b className="milo-text-number-l">{row.target.text}</b>
                <p className="milo-text-caption">{row.reason}{row.deloaded ? ` · 减量周 ×${env.cfg.deload.intensity}` : ''}</p>
                <p className={`milo-text-caption ${s.same}`}>和首页处方、增量页是同一个数</p>
              </>
            ) : <p className="milo-text-body">先做出一组工作组，才有下次目标。</p>}
          </section>

          <section aria-label="最近 8 次">
            <SectionLabel>最近 {recent.length} 次 · 点一次看当天</SectionLabel>
            <ul className={s.recent}>
              {recent.map((x, k) => {
                const idx = sessions.length - 1 - k;
                return (
                  <li key={x.t}>
                    <button type="button" className={`milo-press milo-focus ${s.rec}`} aria-pressed={idx === i} onClick={() => setSel(idx)}>
                      <span className={s.recDate}>{x.label}</span>
                      <span className={`milo-text-body ${s.recBest}`}>{x.best}</span>
                      {x.pr && <span className={s.recPr}><Tag tone="strong">PR</Tag></span>}
                      <b className={`milo-text-number-m ${s.recV}`}>{fmt(x.v)}<i>{row.unit}</i></b>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </Screen>
  );
}
