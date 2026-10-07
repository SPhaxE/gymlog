/** 我的（P11，ia §1.11 / §1.14 / §1.15）：档案、成长、导航设置、数据、关于。
 *  五层：
 *  - 战略：用户在这里回答三件事——我现在长到哪儿了（牛龄 · 连胜 · 牛劲）、我的档案对不对（改一项，处方跟着变）、我的数据我做主（导出 / 载入示例 / 清除）。
 *  - 范围：成长卡 + 档案四格（经验 · 时长 · 器械 · 体型，含可选体重）+ 消息 + 导航三项设置（进度环 · 休息描边 · 结束提示）+ 数据（载入示例 · 导出 CSV · 清除）+ 关于。
 *    「钱包 · 商城」一行（6f：牛劲余额 · 可用卡券数，进钱包，钱包里去商城）；「Milo Pro」一行（6g，线框 prohub W2 三态：未开通 → 付费墙 /pro，试用中 / 已开通 → 会员中心 /me/pro）。
 *    数据里「演示：会员状态」开关（ia §1.17：会员 / 非会员两种状态在这里切换展示；打开 = 开通年度，关掉 = 切回免费，已得的不收回）。
 *  - 结构：Tab 根页（导航「我的」选中）；整页一个滚动区；子页：牛龄 /me/level、钱包 /me/wallet（→ 商城 /shop）、消息 /me/messages；改档案走底部面板（点哪格改哪项）。
 *  - 框架：页头（跟着滑走）→ 成长卡（第一屏主角）→ 档案四格 → 消息 → 导航 → 数据 → 关于。没有主操作按钮（设置页）；面板里的「保存」在拇指区。
 *  - 成长卡那句话：连胜快断的这周换成「这周快断了：还差 N 次，只剩 M 天」（6g 补），点卡照常进牛龄页，那里给出口。
 *  - 表现：荧光只有成长卡的进度条一处；危险操作（清除）用危险色，载入 / 清除都先二次确认；设置的开关立即生效、不需要保存。
 *  设计过程见 design/hifi/me/（线框 me2 W2 成长卡做主角；Stitch 第 1 轮 m6）。 */
import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BackToTop, Dialog, GrowthCard, List, ListRow, OptionCard, OptionGroup, PageHeader, ProBadge, ProfileTile, Screen, SectionLabel, Sheet, Switch, Tag, useToast } from '../components';
import { env } from '../data/demo';
import { csvFileName, csvSetCount, historyCsv } from '../data/exportCsv';
import { saveTextFile } from '../data/exportFile';
import { growthOf, messagesOf, riskOf, unreadOf } from '../data/me';
import { mergeProfile, profileError, profileFacts, updateProfile } from '../data/profile';
import { setSettings } from '../data/settings';
import { DEFAULT_PROFILE, demoState, store, useStore } from '../data/store';
import { activate, cancel, dayText, proPeriods, proStatus, trialUsed, usePro } from '../data/pro';
import { useSource } from '../data/useSource';
import { couponsOf, restockMessages, useWallet } from '../data/wallet';
import { weeklyTarget } from '../engine';
import type { Profile } from '../engine/types';
import { GoalHint } from './GoalHint';
import { ProfileSheet, type ProfileField } from './ProfileSheet';
import { TabNav } from './TabNav';
import type { Tab } from '../components';
import s from './MePage.module.css';

const REST_END = [['vibrate', '描边 + 振动', '休息结束时，选中项变成对勾，手机振一下'], ['outline', '仅描边', '只有结束态（描边 / 对勾），不振动']] as const;

export function MePage({ scenario, now, onTab }: { scenario?: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const nav = useNavigate(), loc = useLocation(), toast = useToast();
  const st = useStore();
  const topRef = useRef<HTMLDivElement>(null);
  const { src } = useSource(scenario, now);
  // 演示场景（?scenario=）不读也不写本机存储：改档案只改本页内存，刷新复位——点了不会没反应
  const [local, setLocal] = useState<Profile | null>(null);
  const profile = local ?? src.profile ?? DEFAULT_PROFILE;
  const [wallet] = useWallet(scenario, now);
  const [pro, setPro] = usePro(scenario);
  const g = useMemo(() => growthOf({ ...src, profile, wallet, pro: proPeriods(pro) }, now), [src, profile, wallet, pro, now]);
  const ps = proStatus(pro, now);
  const proDetail = ps.kind === 'trial' ? `试用中 · 还剩 ${ps.daysLeft} 天` : ps.kind === 'pro' ? `${dayText(ps.period!.toMs)}到期` : trialUsed(pro) ? '月 ¥18 · 年 ¥128' : '7 天免费试用';
  const toggleDemoPro = (on: boolean) => { setPro((x) => (on ? activate(x, 'year', now) : cancel(x, now))); toast.show(on ? '演示：已开通年度会员' : '演示：已切回免费，已得的牛劲和卡券不收回'); };
  // 演示场景不标已读（消息页同样不显示未读点），这里也不显示未读数，免得「N 条新」点进去清不掉
  const unread = useMemo(() => (scenario ? 0 : unreadOf([...messagesOf(g), ...restockMessages(wallet)], st.messagesSeenAt)), [scenario, g, wallet, st.messagesSeenAt]);
  const facts = profileFacts(profile);
  const [edit, setEdit] = useState<ProfileField | null>(null);
  const [restSheet, setRestSheet] = useState(false);
  const [confirm, setConfirm] = useState<'load' | 'clear' | null>(null);
  const cur = g.streak.current, empty = src.history.length === 0, sets = csvSetCount(src.history), risk = riskOf(g, now);

  const save = (patch: Partial<Profile>): string | null => {
    if (scenario) { const next = mergeProfile(profile, patch), e = profileError(next); if (!e) setLocal(next); return e; }
    const e = updateProfile(patch);
    // 体型示意 / 体重不影响处方（面板里写着），不说「处方重算」
    if (!e) toast.show(Object.keys(patch).every((k) => k === 'gender' || k === 'weightKg') ? '已保存' : '已保存，今日处方按新档案重算');
    return e;
  };
  const exportCsv = async () => {
    try {
      const r = await saveTextFile(csvFileName(now), historyCsv(src.history, (id) => env.ex.get(id)?.name ?? id));
      if (r !== 'cancelled') toast.show(`已导出 ${sets} 组训练记录`);
    } catch (e) {
      toast.show(`导出失败：${e instanceof Error ? e.message : '请重试'}`);
    }
  };
  const load = () => {
    setConfirm(null);
    // 旧数据删训练时写下的降级说明属于旧记录，换成示例数据后一起清掉
    store.update((x) => ({ ...x, ...demoState(Date.now(), x.profile ?? undefined), draft: null, notes: [] }));
    toast.show('已载入示例数据：练了 30 周的进阶用户');
  };
  const clear = () => { setConfirm(null); store.clear(); nav('/onboarding', { replace: true }); };

  return (
    <Screen label="我的">
      <div ref={topRef} className={s.scroll}>
        <PageHeader title="我的" />
        <div className={s.body}>
          <GrowthCard stage={g.stage} sub={g.sub} progress={g.next?.progress ?? 1} hint={risk ? <><b>这周快断了</b>：还差 {risk.need} 次，只剩 {risk.daysLeft} 天</> : <GoalHint g={g} empty={empty} />} streak={g.streak.weeks}
            done={cur?.done ?? 0} target={cur?.target ?? weeklyTarget(profile)} niujin={g.niujin.balance.toLocaleString('en-US')} onClick={() => nav(`/me/level${loc.search}`)} />

          <section className={s.group} aria-label="档案">
            <SectionLabel>档案</SectionLabel>
            <div className={s.tiles}>
              <ProfileTile label="训练经验" value={facts.experience} onClick={() => setEdit('experience')} />
              <ProfileTile label="单次时长" value={facts.minutes} unit="分钟" onClick={() => setEdit('minutes')} />
              <ProfileTile label="可用器械" value={facts.equipment} unit="类" onClick={() => setEdit('equipment')} />
              <ProfileTile label="体型示意" value={facts.body} onClick={() => setEdit('body')} />
            </div>
          </section>

          <div className={s.card}><List label="钱包、会员与消息">
            <ListRow kind="nav" title="钱包 · 商城" detail={`牛劲 ${g.niujin.balance.toLocaleString('en-US')} · ${couponsOf(wallet, now).filter((c) => c.state === 'available').length + (g.streak.freezeCards > 0 ? 1 : 0)} 张卡券可用`} onClick={() => nav(`/me/wallet${loc.search}`)} />
            <ListRow kind="nav" title="Milo Pro" detail={proDetail} onClick={() => nav(`${ps.kind === 'free' ? '/pro' : '/me/pro'}${loc.search}`)}
              trailing={ps.kind !== 'free' ? <ProBadge state="active" /> : undefined} />
            <ListRow kind="nav" title="消息" detail="同时达成的其余奖励、冻结卡自动使用" onClick={() => nav(`/me/messages${loc.search}`)}
              trailing={unread > 0 ? <Tag tone="strong">{unread} 条新</Tag> : undefined} />
          </List></div>

          <section className={s.group} aria-label="导航">
            <SectionLabel>导航</SectionLabel>
            <div className={s.card}><List>
              <ListRow kind="toggle" title="显示今日进度环" detail="导航外圈：今天练了多少" trailing={<Switch checked={st.settings.ring} label="显示今日进度环" onChange={(v) => setSettings({ ring: v })} />} />
              <ListRow kind="toggle" title="显示休息倒计时描边" detail="选中项里的描边，随休息时间走" trailing={<Switch checked={st.settings.restOutline} label="显示休息倒计时描边" onChange={(v) => setSettings({ restOutline: v })} />} />
              <ListRow kind="nav" title="休息结束提示" onClick={() => setRestSheet(true)} trailing={<span className="milo-text-caption">{REST_END.find(([k]) => k === st.settings.restEnd)![1]}</span>} />
            </List></div>
          </section>

          <section className={s.group} aria-label="数据">
            <SectionLabel>数据</SectionLabel>
            <div className={s.card}><List>
              <ListRow kind="nav" title="载入示例数据" detail="练了 30 周的进阶用户，各页都有内容" onClick={() => setConfirm('load')} />
              <ListRow kind="toggle" title="演示：会员状态" detail="打开 = 年度会员，关掉 = 免费；各页一起变" trailing={<Switch checked={ps.kind !== 'free'} label="演示：会员状态" onChange={toggleDemoPro} />} />
              <ListRow kind="nav" title="导出 CSV" detail={empty ? '还没有训练记录' : `${src.history.length} 次训练 · ${sets} 组，用表格软件打开`} disabled={empty} onClick={exportCsv} />
              <ListRow kind="danger" title="清除全部数据" onClick={() => setConfirm('clear')} />
            </List></div>
          </section>

          <section className={s.group} aria-label="关于">
            <SectionLabel>关于</SectionLabel>
            <div className={s.card}><List>
              <ListRow title="人体图与动作示范" trailing={<span className="milo-text-caption">MuscleWiki</span>} />
              <ListRow title="版本" trailing={<span className="milo-text-caption">0.1.0 · {__BUILD_COMMIT__}</span>} />
            </List></div>
          </section>
          <p className={`milo-text-caption ${s.motto}`}>慢慢变牛。</p>
        </div>
      </div>

      {edit && <ProfileSheet field={edit} profile={profile} training={!!st.active} onSave={save} onClose={() => setEdit(null)} />}
      {restSheet && (
        <Sheet title="休息结束提示" meta="组间休息倒计时走完时" onClose={() => setRestSheet(false)}>
          <div className={s.sheetBody}>
            <OptionGroup label="休息结束提示">
              {REST_END.map(([k, t, d]) => <OptionCard key={k} title={t} detail={d} selected={st.settings.restEnd === k} onClick={() => { setSettings({ restEnd: k }); setRestSheet(false); }} />)}
            </OptionGroup>
          </div>
        </Sheet>
      )}
      <Dialog open={confirm === 'load'} onClose={() => setConfirm(null)} icon="refresh" title="载入示例数据？" confirm="载入" onConfirm={load}>
        <p className={s.dlgNote}>会覆盖现有的训练记录，换成练了 30 周的进阶用户；档案不变，进行中的训练也不受影响。</p>
      </Dialog>
      <Dialog open={confirm === 'clear'} onClose={() => setConfirm(null)} tone="danger" icon="trash" title="清除全部数据？" confirm="清除" onConfirm={clear}>
        <p className={s.dlgNote}>档案、训练记录和进行中的训练都会删除，回到首次建档，不能撤销。</p>
      </Dialog>
      <TabNav selected="me" scenario={scenario} now={now} onTab={onTab} />
      <BackToTop target={topRef} />
    </Screen>
  );
}
