/** 增量总览页（P09，ia §1.9）：一屏回答「我有没有在变强、下一次该加多少」。
 *  五层：
 *  - 战略：用户在两次训练之间翻一眼，确认力量在涨，并且知道下次每个动作做多少——下次的数必须和首页处方是同一个数。
 *  - 范围：近 4 周摘要、减量状态行（可点开面板）、按部位筛选、按引擎结论分组的动作列表；本次交付列表行只读，点进曲线页在下一次交付接。
 *  - 结构：Tab 根页（导航「增量」选中）；没练过任何动作时是空状态，唯一出路是回首页。
 *  - 框架：页头 → 摘要卡 → 减量状态 → 部位筛选 → 三组列表（该加重 / 保持 / 该减重；减量周合成一组）。整页只有「该加重」的图标底是荧光。
 *  - 表现：摘要里破纪录次数用码表滚动（M04）；切部位时列表交错弹入（M07）；涨跌一律 ▲▼= 形状 + 文字；页头右上角一组同心杠铃片是装饰，不可点。 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Cascade, Chip, Delta, GainGroupHead, GainRow, Nav, Num, Odometer, PageHeader, Screen, StateView, useToast, type Tab } from '../components';
import { env, fmt, REGION_NAME } from '../data/demo';
import { gainsData, groupGains, type GainRow as Row } from '../data/gains';
import { useSource } from '../data/useSource';
import { useTrainingNav } from '../data/useTrainingNav';
import type { Region } from '../engine';
import { DeloadBanner } from './DeloadBanner';
import { DeloadSheet } from './DeloadSheet';
import s from './GainsPage.module.css';

/** 涨跌文字：重量动作 ±kg，自重动作 ±次 */
const deltaText = (r: Row) => {
  const d = r.delta.diff;
  return d == null || d === 0 ? undefined : `${d > 0 ? '+' : '−'}${fmt(Math.abs(d))} ${r.unit}`;
};
/** 目标后的小字：减量周写系数；很久没练写「N 周前」 */
const noteOf = (r: Row) => (r.deloaded ? `减量 ×${env.cfg.deload.intensity}` : r.daysAgo >= 56 ? `${Math.floor(r.daysAgo / 7)} 周前` : undefined);

export function GainsPage({ scenario, now, onTab }: { scenario?: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const nav = useNavigate(), toast = useToast();
  const { src, adopt, skip } = useSource(scenario, now);
  const d = useMemo(() => gainsData(src, now), [src, now]);
  const navState = useTrainingNav(scenario, 0, now);
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [deloadOpen, setDeloadOpen] = useState(false);
  const week = d.dv.kind === 'week';
  const shown = region === 'all' || !d.regions.includes(region) ? d.rows : d.rows.filter((r) => r.region === region);
  const groups = groupGains(shown, week);
  const sm = d.summary;

  return (
    <Screen label="增量">
      <PageHeader title="增量" eyebrow="力量有没有在涨" trailing={<span className={s.plates} aria-hidden="true"><i /><i /><i /></span>} />
      <div className={s.body}>
        {d.empty ? (
          <StateView kind="empty" title="还没有训练记录" detail="练完第一次，这里就会告诉你每个动作有没有在涨、下次该加多少。" action="去今日处方" onAction={() => nav('/today' + (scenario ? `?scenario=${scenario}` : ''))} />
        ) : (
          <>
            <Card label="近 4 周摘要">
              <div className={s.sum}>
                <div className={s.pr}>
                  <span className="milo-text-caption">近 4 周破纪录</span>
                  <span className={s.prNum}><Odometer value={String(sm.pr)} size="xl" /><span className="milo-text-body">次</span></span>
                </div>
                {sm.trained === 0 ? (
                  <p className={`milo-text-caption ${s.idle}`}>近 4 周还没练，下面是之前的记录。</p>
                ) : (
                  <ul className={s.stats} aria-label={`近 4 周练过 ${sm.trained} 个动作`}>
                    {([['up', sm.up, '上升'], ['flat', sm.flat, ''], ['down', sm.down, '下降'], ['baseline', sm.baseline, '']] as const).map(([dir, n, label]) => (
                      <li key={dir}><Num size="l" value={n} /><Delta dir={dir} value={label} /></li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            <DeloadBanner dv={d.dv} hits={d.sig.hits.length} onOpen={() => setDeloadOpen(true)} />

            {d.regions.length > 1 && (
              <div className={s.chips} role="group" aria-label="按部位筛选">
                <Chip selected={region === 'all'} onClick={() => setRegion('all')}>全部</Chip>
                {d.regions.map((r) => <Chip key={r} selected={region === r} onClick={() => setRegion(r)}>{REGION_NAME[r]}</Chip>)}
              </div>
            )}

            <Cascade replayKey={region}>
              {groups.map((g) => (
                <section key={g.kind} className={s.group}>
                  <GainGroupHead kind={g.kind} count={g.rows.length} />
                  {g.rows.map((r) => (
                    <GainRow key={r.exerciseId} name={r.name} latest={r.latest} unit={r.unit} delta={{ dir: r.delta.dir, value: deltaText(r) }} pr={r.pr4w}
                      points={r.points} target={r.target?.text ?? null} note={noteOf(r)} />
                  ))}
                </section>
              ))}
            </Cascade>
          </>
        )}
      </div>
      <Nav selected="gains" {...navState} onSelect={onTab} />
      {deloadOpen && <DeloadSheet hits={d.sig.hits} onClose={() => setDeloadOpen(false)}
        onAdopt={() => { adopt(); setDeloadOpen(false); toast.show(`已进入减量周 · ${env.cfg.deload.days} 天`); }}
        onSkip={() => { skip(); setDeloadOpen(false); toast.show(`这次不减，${env.cfg.deload.days} 天内不再提醒`); }} />}
    </Screen>
  );
}
