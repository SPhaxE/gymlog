/** 首页（P01，线框 W2 + 视觉语言 v2）：第一个动作做主角，增量尺把「上次 → 这次」画在刻度上。
 *  开始训练是这一屏唯一的荧光；减量、恢复日、动作池不足占用主角卡上方的状态位（ia §1.2）。 */
import { useMemo } from 'react';
import { Banner, Button, Card, ExerciseRow, Nav, Num, PageHeader, PrescriptionHero, Screen, SectionLabel, Tag, type Tab } from '../components';
import { dateLabel, env, homeData, REGION_NAME } from '../data/demo';
import s from './HomePage.module.css';

export function HomePage({ scenario, now, onTab }: { scenario: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const d = useMemo(() => homeData(scenario, now), [scenario, now]);
  const { rx, dv } = d;
  const items = rx.kind === 'plan' ? rx.items : [];
  const [first, ...rest] = items;
  return (
    <Screen label="首页">
      <PageHeader title="今日处方" eyebrow={dateLabel(now)} trailing={<a className={s.link} href="#why">为什么是这些</a>}>
        {rx.kind === 'plan' && (
          <div className={s.tags}>
            <Tag>{rx.totals.exercises} 个动作</Tag><Tag>{rx.totals.sets} 组</Tag><Tag>{rx.totals.regions.map((r) => REGION_NAME[r]).join(' · ')}</Tag>
          </div>
        )}
      </PageHeader>

      <div className={s.body}>
        {dv.kind === 'suggest' && <Banner title="建议本周减量" detail={`${d.hits} 个动作的预估 1RM 连降两次`} actions={<Button kind="ghost" size="s">看看</Button>} />}
        {dv.kind === 'week' && <Banner title={`减量周 · 还剩 ${dv.daysLeft} 天`} detail="组数减半、强度 ×0.9" />}
        {dv.kind === 'note' && <Banner quiet detail={`减量信号仍在 · 你选了这次不减（${dv.daysLeft} 天内不再提示）`} />}
        {rx.kind === 'pool-empty' && <Banner title="当前器械下没有可排的动作" detail="去「我的」里加器械" actions={<Button kind="ghost" size="s">去设置</Button>} />}
        {rx.kind === 'rest' && <RestDay blocked={rx.blocked.slice(0, 6).map((h) => [h.name, Math.round(h.hoursLeft)] as [string, number])} />}

        {first && <PrescriptionHero order={1} region={REGION_NAME[first.region]} name={first.name} weight={first.suggestion.weightKg} sets={first.sets} reps={first.repRange}
          reason={first.suggestion.reason.text} last={d.lastWeight(first.exerciseId)} step={env.cfg.loadStep} deload={dv.kind === 'week'} />}
        {rest.length > 0 && (
          <>
            <SectionLabel>接下来</SectionLabel>
            <div className={s.rows}>
              {rest.map((it) => (
                <ExerciseRow key={it.exerciseId} name={it.name} detail={`${REGION_NAME[it.region]} · ${it.sets} × ${it.repRange.join('–')}`} weight={it.suggestion.weightKg} />
              ))}
            </div>
          </>
        )}
      </div>

      {rx.kind === 'plan' && <div className={s.cta}><Button>开始训练</Button></div>}
      <Nav selected="home" progress={rx.kind === 'plan' ? 0 : null} onSelect={onTab} />
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
