/** 牛龄（P13，ia §1.14）：长期的「变强」——牛龄；短期的「守约」——连胜。两条线对应引擎的两半：渐进超负荷、超量恢复。
 *  五层：
 *  - 战略：用户看到自己长到哪一段、离下一级还差什么（能照着做的说法）、这个月守约得怎么样；也是删训练后「可能降级」落地的地方。
 *  - 范围：页头（5 段名字 + 小牛 + 段名小级）、离下一级的进度与那句话、三个数（连胜 · 本周 · 冻结卡）、最近 12 周守约点阵、成长记录（里程碑，一次 6 条、再点展开）、降级说明；
 *    没有历史时是「牛犊 1 级 · 连胜 0」+「完成第一次训练开始长大」；这周快断了有一行提示。
 *  - 结构：子页（没有 Tab，导航不出现），从「我的」顶部的成长卡进入，返回回到「我的」；整页一个滚动区。
 *  - 框架：顶栏（返回 + 牛龄）→ 页头 → 离下一级 → 三格 → 最近 12 周 → 成长记录 → 一行小字（删训练会重算、可能降级）。没有主操作按钮（浏览页）。
 *  - 表现：荧光只有进度条一处；小牛是品牌位置，可以用 IP 小牛；功能位置（连胜、记录）不放小牛（语气分工）；守约点阵的每种状态形状 / 纹理都不同，不只靠颜色。
 *  设计过程见 design/hifi/me/（线框 level W1 小牛为主角；Stitch 第 1 轮 m6）。 */
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Banner, Button, GrowthBar, LedgerRow, MessageRow, Num, Screen, SectionLabel, StageHero, StreakWeeks, TopBar, type StreakWeekStatus } from '../components';
import { dateOf } from '../data/growth';
import { growthLog, growthOf, nextGoal } from '../data/me';
import { useStore } from '../data/store';
import { useSource } from '../data/useSource';
import { weeklyTarget } from '../engine';
import { GoalHint } from './GoalHint';
import s from './LevelPage.module.css';

/** 成长记录一次露几条 */
const CHUNK = 6;

export function LevelPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation();
  const st = useStore();
  const { src } = useSource(scenario, now);
  const g = useMemo(() => growthOf(src, now), [src, now]);
  const log = useMemo(() => growthLog(g, scenario ? [] : st.notes), [g, scenario, st.notes]);
  const [shown, setShown] = useState(CHUNK);
  const cur = g.streak.current, empty = src.history.length === 0, goal = nextGoal(g);
  const weeks = g.streak.history.slice(-12).map((w): StreakWeekStatus => (w.status === 'risk' ? 'open' : w.status));
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/me' + loc.search, { replace: true }));

  return (
    <Screen label="牛龄">
      <TopBar title="牛龄" onBack={back} />
      <div className={s.scroll}>
        <div className={s.body}>
          <StageHero stage={g.stage} sub={g.sub} />
          <GrowthBar bare stage={g.stage} sub={g.sub} progress={g.next?.progress ?? 1} lift={goal?.lift} cycles={goal?.cycles} hint={<GoalHint g={g} empty={empty} />} />

          <div className={s.stats} role="group" aria-label="连胜与本周">
            <div className={s.stat}><Num size="l" value={g.streak.weeks} unit="周" /><i className="milo-text-caption">连胜</i></div>
            <div className={s.stat}><Num size="l" value={`${cur?.done ?? 0} / ${cur?.target ?? weeklyTarget(src.profile)}`} unit="次" /><i className="milo-text-caption">本周</i></div>
            <div className={s.stat}><Num size="l" value={g.streak.freezeCards} unit="张" /><i className="milo-text-caption">冻结卡</i></div>
          </div>
          {cur?.status === 'risk' && <Banner tone="error" detail="这周快断了：剩下的天数不够练完目标次数。" />}

          {weeks.length > 0 && (
            <section className={s.sec} aria-label="最近 12 周"><SectionLabel>最近 12 周</SectionLabel><StreakWeeks weeks={weeks} /></section>
          )}

          <section className={s.sec} aria-label="成长记录">
            <SectionLabel>成长记录</SectionLabel>
            {log.length === 0
              ? <p className={`milo-text-caption ${s.empty}`}>练完第一次训练，这里会开始记录升级、新纪录和守约。</p>
              : <div>{log.slice(0, shown).map((r) => (r.niujin != null
                ? <LedgerRow key={r.id} plain label={r.title} amount={r.niujin} date={dateOf(r.atMs)} detail={r.detail} />
                : <MessageRow key={r.id} kind={r.kind === 'freeze' ? 'freeze' : 'demote'} title={r.title} detail={r.detail ?? ''} date={dateOf(r.atMs)} />))}</div>}
            {log.length > shown && <div className={s.more}><Button kind="ghost" size="s" onClick={() => setShown((n) => n + CHUNK)}>更早的记录 · 还有 {log.length - shown} 条</Button></div>}
          </section>

          <p className={`milo-text-caption ${s.note}`}>删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。</p>
        </div>
      </div>
    </Screen>
  );
}
