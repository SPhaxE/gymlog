/** 首页（P01，线框 W2 + 视觉语言 v2）：第一个动作做主角，增量尺把「上次 → 这次」画在刻度上。
 *  开始训练是这一屏唯一的荧光；减量、恢复日、动作池不足占用主角卡上方的状态位（ia §1.2）。
 *  数据：?scenario= 时走演示场景；否则读本机存储（阶段 6a）。「开始训练」把处方抄进进行中的训练、进 P03；有没练完的训练时变「继续训练」（ia §1.5 中断）。
 *  今天已练完（ia §1.2）：主角换成「今天已练完」——睡着的小牛、本次三格摘要、这次练到的肌头离黄金窗还有几小时；
 *  不在练完的瞬间就推下一份处方，「再练一次」是次要操作，点了才展开现算的处方。 */
import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { startSession } from '../data/session';
import { useStore } from '../data/store';
import { Banner, Button, Card, Cascade, ExerciseRow, Icon, Mascot, Nav, Num, PageHeader, PrescriptionHero, Screen, SectionLabel, Tag, type Tab } from '../components';
import { dateLabel, env, fmt, homeData, REGION_NAME, type DoneToday } from '../data/demo';
import s from './HomePage.module.css';

export function HomePage({ scenario, now, onTab }: { scenario?: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const st = useStore(), nav = useNavigate();
  const d = useMemo(() => homeData(scenario ?? st, now), [scenario, st.history, st.profile, st.deload, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = !scenario, resume = live && st.active != null;
  const start = () => { if (!live) return; if (!resume && d.rx.kind === 'plan') startSession(d.rx, now); nav('/session'); };
  const { rx, dv } = d;
  const [again, setAgain] = useState(false);
  const done = d.done && !again && !resume ? d.done : null;
  const items = rx.kind === 'plan' && !done ? rx.items : [];
  const [first, ...rest] = items;
  return (
    <Screen label="首页">
      <PageHeader title={done ? '今天' : '今日处方'} eyebrow={dateLabel(now)} trailing={done ? undefined : <a className={s.link} href="#why">为什么是这些</a>}>
        {rx.kind === 'plan' && !done && (
          <div className={s.tags}>
            <Tag>{rx.totals.exercises} 个动作</Tag><Tag>{rx.totals.sets} 组</Tag><Tag>{rx.totals.regions.map((r) => REGION_NAME[r]).join(' · ')}</Tag>
          </div>
        )}
      </PageHeader>

      <div className={s.body}>
        {resume && <Banner title="上次训练还没结束" detail="已记的组都还在，接着练或者去结束" />}
        {dv.kind === 'suggest' && <Banner title="建议本周减量" detail={`${d.hits} 个动作的预估 1RM 连降两次`} actions={<Button kind="ghost" size="s">看看</Button>} />}
        {dv.kind === 'week' && <Banner title={`减量周 · 还剩 ${dv.daysLeft} 天`} detail="组数减半、强度 ×0.9" />}
        {dv.kind === 'note' && <Banner quiet detail={`减量信号仍在 · 你选了这次不减（${dv.daysLeft} 天内不再提示）`} />}
        {rx.kind === 'pool-empty' && <Banner title="当前器械下没有可排的动作" detail="去「我的」里加器械" actions={<Button kind="ghost" size="s">去设置</Button>} />}
        {done && <Done d={done} onSummary={live ? () => nav(`/summary/${done.session.id}`) : undefined} />}
        {!done && rx.kind === 'rest' && <RestDay blocked={rx.blocked.slice(0, 6).map((h) => [h.name, Math.round(h.hoursLeft)] as [string, number])} />}

        {first && <PrescriptionHero order={1} region={REGION_NAME[first.region]} name={first.name} weight={first.suggestion.weightKg} sets={first.sets} reps={first.repRange}
          reason={first.suggestion.reason.text} last={d.lastWeight(first.exerciseId)} step={env.cfg.loadStep} deload={dv.kind === 'week'} />}
        {rest.length > 0 && (
          <>
            <SectionLabel>接下来</SectionLabel>
            <div className={s.rows}>
              <Cascade>
                {rest.map((it) => (
                  <ExerciseRow key={it.exerciseId} name={it.name} detail={`${REGION_NAME[it.region]} · ${it.sets} × ${it.repRange.join('–')}`} weight={it.suggestion.weightKg} />
                ))}
              </Cascade>
            </div>
          </>
        )}
      </div>

      {done ? <div className={s.cta}><Button kind="ghost" onClick={() => setAgain(true)}>再练一次</Button></div>
        : (rx.kind === 'plan' || resume) && <div className={s.cta}><Button glow onClick={start}>{resume ? '继续训练' : '开始训练'}</Button></div>}
      <Nav selected="home" progress={done ? 1 : rx.kind === 'plan' ? 0 : null} onSelect={onTab} />
    </Screen>
  );
}

function RestDay({ blocked }: { blocked: [string, number][] }) {
  return (
    <Card hero>
      <div className="milo-text-caption">今天</div>
      <div className={`milo-text-title-m ${s.primary}`}>恢复日</div>
      <div className="milo-text-caption">候选肌头都还在修复期，今天适合休息。离恢复还需要：</div>
      <ul className={s.restList}>{blocked.map(([n, h]) => <li key={n}><span>{n}</span><Num size="s" value={h} unit="小时" /></li>)}</ul>
    </Card>
  );
}

/** 今天已练完：睡着的小牛（恢复中）+ 本次摘要 + 每个练到的肌头的恢复条（满了 = 进黄金窗） */
function Done({ d, onSummary }: { d: DoneToday; onSummary?: () => void }) {
  const next = d.heads.find((h) => h.hours > 0);
  return (
    <>
      <section className={s.done}>
        <div className={s.doneGlow} aria-hidden="true" />
        <div className={s.doneFig}><Mascot stage={d.stage} mood="rest" animate /></div>
        <div className={s.doneText}>
          <span className={s.doneTick}><Icon name="check" /></span>
          <h2 className={`milo-text-title-l ${s.primary}`}>今天已练完</h2>
          <p className="milo-text-caption">超量恢复从现在开始：睡一觉，它会比今天更强一点。{next && <>最快的 <b className={s.primary}>{next.name}</b> 约 {Math.round(next.hours)} 小时后进黄金窗。</>}</p>
        </div>
        <div className={s.doneStats}>
          <div><span className="milo-text-caption">时长</span><Num size="s" value={Math.max(1, d.session.durationMin ?? 0)} unit="分钟" /></div>
          <div><span className="milo-text-caption">组数</span><Num size="s" value={d.sets} unit="组" /></div>
          <div><span className="milo-text-caption">总负荷</span><Num size="s" value={fmt(d.load)} unit="kg" /></div>
        </div>
        {onSummary && <Button kind="neutral" size="s" onClick={onSummary}>看本次结算</Button>}
      </section>
      {d.heads.length > 0 && (
        <>
          <SectionLabel>恢复进度 · 满格进黄金窗</SectionLabel>
          <ul className={s.recover}>
            <Cascade>
              {d.heads.slice(0, 6).map((h) => (
                <li key={h.id}>
                  <span className={s.primary}>{h.name}</span>
                  <i className={s.bar} style={{ '--p': Math.max(0.04, Math.min(1, h.recovery)) } as CSSProperties} />
                  <Num size="s" value={h.hours > 0 ? Math.round(h.hours) : '已到'} unit={h.hours > 0 ? '小时' : undefined} />
                </li>
              ))}
            </Cascade>
          </ul>
        </>
      )}
    </>
  );
}
