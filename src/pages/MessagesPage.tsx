/** 消息（「我的」→ 消息，ia §1.15）：一次训练同时达成多项时，弹窗只弹优先级最高的那个，其余合并成一条收在这里；周结算的奖励、冻结卡自动使用也是。
 *  五层：
 *  - 战略：让「没弹出来的奖励」有地方可去，不丢也不打扰（训练中不弹窗，ia §1.15）。
 *  - 范围：消息列表（新的在前，一次最多 30 条）、未读小点、空态。
 *  - 结构：子页（没有 Tab），从「我的」的「消息」行进入；一进来就算看过（「我的」上的未读数清零），这次进来的未读小点照常显示，离开后才消失。
 *  - 框架：顶栏（返回 + 消息）→ 列表。没有主操作按钮。
 *  - 表现：奖励是荧光图标（只给未读），冻结卡是冰块；按月分段；入账的牛劲单独一列右对齐的大数字（一眼扫得到）；不放小牛（功能位置）。 */
import { useEffect, useRef, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BackToTop, MessageRow, Screen, SectionLabel, StateView, TopBar } from '../components';
import { dateOf } from '../data/growth';
import { markMessagesSeen } from '../data/inbox';
import { growthOf, messagesOf, type Message } from '../data/me';
import { useStore } from '../data/store';
import { useSource } from '../data/useSource';
import s from './MessagesPage.module.css';

const MAX = 30;
/** 按月分段（新的在前），段头「10月」「9月」；不在今年的带年份 */
function byMonth(ms: Message[]): [string, Message[]][] {
  const y = new Date().getFullYear(), out = new Map<string, Message[]>();
  for (const m of ms) { const d = new Date(m.atMs), k = `${d.getFullYear() === y ? '' : `${d.getFullYear()}年`}${d.getMonth() + 1}月`; out.set(k, [...(out.get(k) ?? []), m]); }
  return [...out.entries()];
}

export function MessagesPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation();
  const st = useStore();
  const topRef = useRef<HTMLDivElement>(null);
  const { src } = useSource(scenario, now);
  const all = useMemo(() => messagesOf(growthOf(src, now)), [src, now]);
  const [seenAt] = useState(st.messagesSeenAt);   // 进来时「看过的时刻」：这一次的未读小点照常显示
  useEffect(() => { if (!scenario) markMessagesSeen(); }, [scenario]);
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/me' + loc.search, { replace: true }));
  return (
    <Screen label="消息">
      <TopBar title="消息" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        {all.length === 0
          ? <div className={s.empty}><StateView kind="empty" title="还没有消息" detail="一次训练同时达成多项奖励时，没弹出来的会收在这里。" /></div>
          : <div className={s.body}>
              {byMonth(all.slice(0, MAX)).map(([label, ms]) => (
                <section key={label} className={s.month} aria-label={label}>
                  <SectionLabel>{label}</SectionLabel>
                  {ms.map((m) => <MessageRow key={m.id} kind={m.kind} title={m.title} detail={m.detail} amount={m.niujin} date={dateOf(m.atMs)} unread={!scenario && m.atMs > seenAt} />)}
                </section>
              ))}
              {all.length > MAX && <p className={`milo-text-caption ${s.note}`}>只显示最近 {MAX} 条。</p>}
            </div>}
      </div>
      <BackToTop target={topRef} />
    </Screen>
  );
}
