/** 动作进步曲线页（P10，ia §1.9）：选一个动作，看它的预估 1RM 随时间怎么变，以及下次该做多少。
 *  五层：
 *  - 战略：从增量页点进某个动作，确认「这个动作真的在涨」并看到具体哪一天、每一组做了什么；下次的数和首页处方、增量页是同一个数。
 *  - 范围：大数字（选中那一天的预估值 + 比上一次的涨跌）、曲线、选中那天的每一组、下次目标、最近 8 次明细；只练过 1 次 / 自重动作 / 动作不存在三种边界。
 *  - 结构：子页（没有导航），来自增量页；返回回到增量页原来的筛选和滚动位置，直接打开链接时返回去增量页。
 *  - 框架：整页一个滚动区，页头首屏（大数字）跟着内容滑走；曲线 → 选中那天 → 下次目标 → 最近 8 次。整页只有曲线的荧光渐隐面积是荧光。
 *  - 表现：大数字按位滚动（M04）；按住曲线横向拖，游标吸到最近一次训练（吸附轻振）；点明细的一行也能选中那天；PR 点是菱形，涨跌用 ▲▼= 形状 + 文字。
 *  （Stitch g9 三种结构的取舍见 design/hifi/gains/decision.md）
 *  6g 补「高级分析 · 动作对比」（线框 proentry W2、Stitch compare V2）：曲线上方一行「对比 ＋ 选一个动作」+ 右边「Pro ›」；点开底部面板（可撤销 → 面板）列出同部位、同口径、练过 2 次以上的动作，
 *  选了就把它的曲线以虚线叠上来，图下一行图例同时读两条（游标那天 + 对比动作那天及以前最近的一次）；✕ 取消对比。演示不拦截，Pro 只是标明这是 Pro 的权益。 */
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { BackToTop, Banner, Chip, Delta, Icon, List, ListRow, Odometer, ProLink, Screen, SectionLabel, Sheet, StateView, Tag, TopBar, TrendChart, drillName, drillTransition } from '../components';
import { env, fmt, REGION_NAME } from '../data/demo';
import { POINTS, compareCandidates, exerciseTrend } from '../data/gains';
import { proStatus, usePro } from '../data/pro';
import { useSource } from '../data/useSource';
import { guideQuery } from './FinderSheet';
import s from './TrendPage.module.css';
import { usePageNav } from '../shell/pageNav';

const dayText = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}月${d.getDate()}日`; };

export function TrendPage({ scenario, now }: { scenario?: string; now: number }) {
  const { exerciseId = '' } = useParams();
  const nav = useNavigate(), loc = useLocation();
  const pn = usePageNav();
  const topRef = useRef<HTMLDivElement>(null);
  const { src } = useSource(scenario, now);
  const d = useMemo(() => exerciseTrend(src, exerciseId, now), [src, exerciseId, now]);
  const [sel, setSel] = useState<number | null>(null);   // 选中的是曲线上第几次；null = 最新一次
  const [cmpId, setCmpId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const cands = useMemo(() => (picking || cmpId ? compareCandidates(src, exerciseId, now) : []), [picking, cmpId, src, exerciseId, now]);
  const cmp = cands.find((c) => c.id === cmpId) ?? null;
  const [pro] = usePro(scenario);
  const proOn = proStatus(pro, now).kind !== 'free';
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
  // 拖曲线换日子时页面不许跳（2026-10-06 用户）：组列表按所有记录里最多的组数预留高度，大数字按最长的读数预留宽度
  const keep = { '--rows': Math.max(...sessions.map((x) => x.sets.length)), '--chars': Math.max(...sessions.map((x) => fmt(x.v).length)) } as CSSProperties;

  return (
    <Screen label={`${row.name} 进步曲线`}>
      <TopBar title={row.name} sub={sub} onBack={back} titleStyle={drillName('name', exerciseId)}
        trailing={<button type="button" className={`milo-press milo-focus ${s.guide}`} onClick={() => pn.push(`/exercise/${exerciseId}?${guideQuery(loc.search, 'trend')}`)}>要领</button>} />
      <div ref={topRef} className={s.scroll} style={keep} data-drill-ready="trend">
        <header className={s.hero}>
          <span className={s.plate} aria-hidden="true" />
          <span className={`milo-text-caption ${s.label}`}>{reps ? '每次最好一组的次数' : '预估 1RM'} · {dayText(cur.t)}{cur.pr ? ' · 新纪录' : ''}</span>
          <div className={s.big} style={drillName('num', exerciseId)}>
            <span className={s.odo}><Odometer value={fmt(cur.v)} size="hero" /></span><span className="milo-text-heading">{row.unit}</span>
          </div>
          <div className={s.deltaRow}>
            <Delta dir={cur.delta.dir} value={diffText(cur.delta)} />
            {cur.delta.dir !== 'baseline' && <span className="milo-text-caption">比上一次</span>}
          </div>
        </header>

        <div className={s.body}>
          {sessions.length < 2 && <Banner quiet detail="只有 1 次记录，再练一次就能看到趋势。" />}
          {sessions.length >= 2 && <div className={s.cmpRow}>
            {cmp
              ? <span className={s.cmpOn}><Chip selected onClick={() => setPicking(true)}>对比 · {cmp.name}</Chip><button type="button" className={`milo-focus ${s.cmpX}`} aria-label="取消对比" onClick={() => setCmpId(null)}><Icon name="close" small /></button></span>
              : <Chip onClick={() => setPicking(true)}>对比 ＋ 选一个动作</Chip>}
            <ProLink active={proOn} onClick={() => pn.push((proOn ? '/me/pro' : '/pro') + loc.search)} />
          </div>}
          <div><TrendChart draw tail={{ n: POINTS, style: drillName('line', exerciseId) }} points={sessions.map((x) => ({ t: x.t, v: x.v, pr: x.pr, label: x.label }))} selected={i} onSelect={setSel} unit={row.unit} readout={false}
            compare={cmp ? { name: cmp.name, points: cmp.points } : undefined} /></div>
          {cmp && (() => { const c = [...cmp.points].reverse().find((p) => p.t <= cur.t) ?? cmp.points[0]; return (
            <p className={`milo-text-caption ${s.legend}`} aria-live="polite">
              <span><i className={s.keySolid} aria-hidden="true" />{row.name} <b className="milo-text-number-s">{fmt(cur.v)}</b> {row.unit}</span>
              <span><i className={s.keyDash} aria-hidden="true" />{cmp.name} <b className="milo-text-number-s">{fmt(c.v)}</b> {row.unit} · {c.label}</span>
            </p>); })()}

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
                      {x.pr && <span className={s.recPr}><Tag tone="accent">PR</Tag></span>}
                      <b className={`milo-text-number-m ${s.recV}`}>{fmt(x.v)}<i>{row.unit}</i></b>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
      {picking && (
        <Sheet title="对比另一个动作" meta={`${REGION_NAME[row.region]} · 练过 2 次以上`} onClose={() => setPicking(false)}>
          {cands.length
            ? <div className={s.cmpList}><List label="可以对比的动作">{cands.map((c) => (
                <ListRow key={c.id} kind="nav" title={c.name} detail={`最近 ${fmt(c.last)} ${c.unit}`} trailing={c.id === cmpId ? <Tag tone="strong">对比中</Tag> : undefined}
                  onClick={() => { setCmpId(c.id); setPicking(false); }} />))}</List></div>
            : <StateView kind="empty" title="还没有能对比的动作" detail="同部位的其它动作练满 2 次，就能叠上来比一比。" />}
        </Sheet>
      )}
      <BackToTop target={topRef} />
    </Screen>
  );
}
