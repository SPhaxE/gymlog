/** 首页（P01，线框 W2 + 视觉语言 v2）：第一个动作做主角，增量尺把「上次 → 这次」画在刻度上。
 *  开始训练是这一屏唯一的荧光；减量、恢复日、动作池不足占用主角卡上方的状态位（ia §1.2）。 */
import { useMemo } from 'react';
import { IncrementRuler } from '../components/Gauges';
import { Nav } from '../components/Nav';
import { Screen } from '../components/Screen';
import { Button, Card, List, ListRow, Num, PageHeader, SectionLabel, StatusStrip, Tag } from '../components/ui';
import { dateLabel, env, fmt, homeData, REGION_NAME } from '../data/demo';
import type { RxItem } from '../engine';
import s from './HomePage.module.css';

export function HomePage({ scenario, now }: { scenario: string; now: number }) {
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
        {dv.kind === 'suggest' && <StatusStrip title="建议本周减量" detail={`${d.hits} 个动作的预估 1RM 连降两次 · 点开看看`} />}
        {dv.kind === 'week' && <StatusStrip title={`减量周 · 还剩 ${dv.daysLeft} 天`} detail="组数减半、强度 ×0.9" />}
        {dv.kind === 'note' && <StatusStrip quiet detail={`减量信号仍在 · 你选了这次不减（${dv.daysLeft} 天内不再提示）`} />}
        {rx.kind === 'pool-empty' && <StatusStrip title="当前器械下没有可排的动作" detail="去「我的」里加器械" />}
        {rx.kind === 'rest' && <RestDay blocked={rx.blocked.slice(0, 6).map((h) => [h.name, Math.round(h.hoursLeft)] as [string, number])} />}

        {first && <Hero it={first} last={d.lastWeight(first.exerciseId)} />}
        {rest.length > 0 && (
          <>
            <SectionLabel>接下来</SectionLabel>
            <List>
              {rest.map((it) => (
                <ListRow key={it.exerciseId} title={it.name} detail={`${REGION_NAME[it.region]} · ${it.sets} × ${it.repRange.join('–')}`}
                  trailing={it.suggestion.weightKg != null ? <Num value={fmt(it.suggestion.weightKg)} unit="kg" /> : <Tag>首次</Tag>} />
              ))}
            </List>
          </>
        )}
      </div>

      {rx.kind === 'plan' && <div className={s.cta}><Button>开始训练</Button></div>}
      <Nav selected="home" progress={rx.kind === 'plan' ? 0 : null} />
    </Screen>
  );
}

function Hero({ it, last }: { it: RxItem; last: number | null }) {
  const w = it.suggestion.weightKg;
  return (
    <Card hero>
      <div className="milo-text-caption">第 1 个 · {REGION_NAME[it.region]}</div>
      <div className={`milo-text-heading ${s.primary}`}>{it.name}</div>
      <div className={s.heroRow}>
        {w != null ? <Num size="hero" value={fmt(w)} unit="kg" /> : <span className="milo-text-title-l">首次</span>}
        <span className={s.target}><Num size="l" value={`${it.sets} × ${it.repRange.join('–')}`} /><span className="milo-text-caption">组 × 次</span></span>
      </div>
      <div className="milo-text-caption">{w != null ? it.suggestion.reason.text : `选一个能干净做完 ${it.repRange[0]} 次的重量`}</div>
      {w != null && last != null && w > 0 && <IncrementRuler last={last} next={w} step={env.cfg.loadStep} />}
    </Card>
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
