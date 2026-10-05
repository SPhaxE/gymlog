/** 训练结算（P05，ia §1.7，阶段 6a）：说清「这次比上次好在哪」，并把奖励时刻放在这里（brief 阶段 6 第 2 项）。
 *  - 主角：有 PR 时是最大的那个 PR（荧光，这一屏唯一）；没有 PR 时是总负荷。下面三格：时长 · 组数 · 总负荷。
 *  - 逐个动作：本次预估 1RM 与上次的差值；首次 = 基线；没做 = 未做。
 *  - 成长：保存前后各算一次成长引擎，成长值的增量 + 当前牛龄；进页面时按引擎事件弹奖励（升段 > PR > 连胜 > 升级 > 周期，只弹一个）。
 *  - 力竭度 1–10（默认 8，可跳过）写回这次训练，驱动恢复窗口；「下次」一行写最慢恢复的部位还要多久。
 *  - 「完成」回首页（替换历史，不能返回到结算）。 */
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { AgeBadge, Button, Delta, GrowthBar, Num, RewardModal, Screen, SectionLabel, TopBar } from '../components';
import { dateLabel, env, fmt, REGION_NAME } from '../data/demo';
import { rewardOf } from '../data/growth';
import { setExertion } from '../data/session';
import { useStore } from '../data/store';
import { growth, headStats, pickRewards, regionOfEx, summarize } from '../engine';
import s from './SummaryPage.module.css';

const shown = new Set<string>();  // 这次打开 App 里已经弹过奖励的训练（刷新后不再重复弹）

export function SummaryPage() {
  const { id } = useParams();
  const st = useStore(), nav = useNavigate();
  const ses = st.history.find((x) => x.id === id);
  const d = useMemo(() => {
    if (!ses) return null;
    const end = ses.startMs + (ses.durationMin ?? 0) * 60e3 + 60e3;
    const sum = summarize(env, st.history, ses);
    const before = growth(env, { history: st.history.filter((x) => x.id !== ses.id), profile: st.profile, now: end });
    const after = growth(env, { history: st.history, profile: st.profile, now: end });
    const { popup, messages } = pickRewards(after.events, ses.startMs - 1);
    const stats = headStats(env, st.history, st.profile, end);
    const trained = new Set(ses.exercises.filter((e) => !e.skipped).flatMap((e) => env.ex.get(e.exerciseId)?.primaryHeads ?? []));
    let slow: { region: string; hours: number } | null = null;
    for (const h of trained) { const x = stats.get(h); if (x && (!slow || x.hoursLeft > slow.hours)) slow = { region: REGION_NAME[x.region], hours: x.hoursLeft }; }
    const regions = [...new Set(ses.exercises.filter((e) => !e.skipped && env.ex.has(e.exerciseId)).map((e) => regionOfEx(env, env.ex.get(e.exerciseId)!)))].map((r) => REGION_NAME[r]);
    return { sum, before, after, reward: popup ? rewardOf(popup, after) : null, queued: messages.length, slow, regions, end };
  }, [ses, st.history, st.profile]);
  const [reward, setReward] = useState(() => (d && id && !shown.has(id) ? d.reward : null));
  if (!ses || !d) return <Navigate to="/today" replace />;
  if (reward && id) shown.add(id);

  const { sum, after, before } = d;
  const name = (exId: string) => env.ex.get(exId)?.name ?? exId;
  const best = [...sum.prs].sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0];
  const gained = Math.round((after.points - before.points) * 10) / 10;
  const next = after.next;

  return (
    <Screen label="训练结算">
      <TopBar title="练完了" sub={`${dateLabel(ses.startMs)} · ${d.regions.join(' · ')}`} />
      <div className={s.body}>
        {best ? (
          <div className={s.hero}>
            <div className={s.heroTop}><span className={s.pr}>PR</span><span className="milo-text-label">新纪录 · {name(best.exerciseId)}</span>
              {best.prevE1rm != null && <span className={s.prev}>上次 {fmt(best.prevE1rm)} kg</span>}</div>
            <div className={s.heroNum}><span className="milo-text-caption">预估 1RM</span><Num size="hero" value={fmt(best.e1rm ?? 0)} unit="kg" />{best.delta != null && <span className={s.plus}>+{fmt(best.delta)} kg</span>}</div>
            <HeroTicks />
          </div>
        ) : (
          <div className={s.heroQuiet}>
            <span className="milo-text-label">{sum.first ? '第一次训练 · 作为基线' : '这次没有新纪录'}</span>
            <Num size="hero" value={fmt(sum.load)} unit="kg" />
            <span className="milo-text-caption">总负荷</span>
          </div>
        )}

        <div className={s.stats}>
          <div><span className="milo-text-caption">时长</span><Num size="m" value={`${ses.durationMin ?? 0}`} unit="分钟" /></div>
          <div><span className="milo-text-caption">组数</span><Num size="m" value={sum.sets} unit="组" /></div>
          <div><span className="milo-text-caption">总负荷</span><Num size="m" value={fmt(sum.load)} unit="kg" /></div>
        </div>

        <SectionLabel>逐个动作</SectionLabel>
        <div className={s.rows}>
          {sum.rows.map((r) => (
            <div key={r.exerciseId} className={s.row}>
              <span className="milo-text-body">{name(r.exerciseId)}</span>
              {r.skipped ? <span className={`milo-text-caption ${s.muted}`}>未做</span>
                : r.baseline ? <span className={`milo-text-caption ${s.muted}`}>首次记录，作为基线</span>
                : r.e1rm == null ? <span className="milo-text-caption">次数 {r.repsDelta && r.repsDelta > 0 ? '+' : ''}{r.repsDelta ?? 0}</span>
                : <span className={s.val}><Num size="s" value={fmt(r.e1rm)} unit="kg" /><Delta dir={r.delta == null || Math.abs(r.delta) < 0.05 ? 'flat' : r.delta > 0 ? 'up' : 'down'} value={r.delta != null ? fmt(Math.abs(r.delta)) : undefined} /></span>}
            </div>
          ))}
        </div>

        <SectionLabel>成长</SectionLabel>
        <AgeBadge stage={after.stage} sub={after.sub} size="compact" streak={after.streak.weeks} />
        {next && <GrowthBar stage={after.stage} sub={after.sub} progress={next.progress} lift={next.lift} cycles={next.cycles} />}
        <p className={`milo-text-caption ${s.muted}`}>这次成长值 +{gained}</p>

        <div className={s.exertion}>
          <div><span className="milo-text-body">力竭度</span><span className={`milo-text-caption ${s.muted}`}>用来算恢复窗口，可以不填</span></div>
        </div>
        <div className={s.rate} role="radiogroup" aria-label="力竭度 1–10">
          {Array.from({ length: 10 }, (_, k) => k + 1).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={(ses.exertion ?? 8) === v} className={`milo-press milo-focus ${(ses.exertion ?? 8) === v ? s.rateOn : ''}`}
              onClick={() => setExertion(ses.id, v)}>{v}</button>
          ))}
        </div>
        {d.slow && <p className="milo-text-caption">下次：{d.slow.region}约 {Math.max(1, Math.round(d.slow.hours))} 小时后恢复 · 下一份处方已经更新</p>}
      </div>
      <div className={s.cta}><Button kind={best ? 'neutral' : undefined} onClick={() => nav('/today', { replace: true })}>完成</Button></div>
      <RewardModal reward={reward} queued={d.queued} onClose={() => setReward(null)} />
    </Screen>
  );
}

/** 新纪录卡底部的刻度（Stitch s6 V3）：细刻度一排，和身体页、首页同一套视觉语言 */
function HeroTicks() {
  return <div className={s.ticks} aria-hidden="true">{Array.from({ length: 31 }, (_, k) => <i key={k} className={k % 5 === 0 ? s.tickL : undefined} />)}</div>;
}
