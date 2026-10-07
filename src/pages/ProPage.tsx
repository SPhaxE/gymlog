/** 会员 · 付费墙（P20，/pro；ia §1.17 / F7）。线框 ?board=pro W2（用你的数据讲权益）+ W3（开通成功）；
 *  Stitch：付费墙 = V2 的单卡刻度尺 + V1 的一行分段，开通成功 = V2（换真小牛、去掉顶栏 ×）（docs/brief.md 2026-10-07，Claude 选，用户授权）。
 *  五层：
 *  - 战略：完整展示会员商业链路（作品集），但不误导、不拦截——演示模式下全部功能照常可用（T18）；权益用「你的账单」讲，不是广告。
 *  - 范围：演示模式横幅 · 「这 30 天，Pro 会多给你」四条（多拿的牛劲 = 近 30 天进账 × 0.5、每月 2 张冻结卡 + 你的连胜、会员价省多少〔被数据触发的那件商品〕、周期自动编排）·
 *    「看完整对比」就地展开免费 vs Pro 七行 · 方案 月 ¥18 / 年 ¥128（默认，省 40%）/ 试用 7 天（用过就不再给）· 假成功开通 · 开通成功（小牛庆祝 + 刚到手的三样）。
 *    近 30 天没有进账（新用户、很久没练）：讲不出「你的」，退回 W1——标题「练得更聪明一点」+ 对比表直接摊开。试用中进来：只给月 / 年，标题下写还剩几天。已是正式会员：直接转会员中心 P21。
 *  - 结构：入口 我的「会员」行、商品详情会员价旁的 Pro、会员中心（试用中「开通正式会员」）；开通成功是本页的第二态（不进历史），「开始用」/ 返回键 → 回来源页。
 *  - 框架：第一优先 = 对我有什么用（权益账单）；主操作 = 拇指区「开通年度（演示，不扣费）」，方案分段紧贴在它上方；看对比是次要文字链。
 *  - 表现：荧光只给主按钮（M06 光晕边框）；分段滑块骨白、「省 40%」骨白小标；权益行 M07 交错弹入 + 刻度尺画出；开通成功：同心环纹荡开 + 小牛软弹簧弹出（减少动态效果时定格）。 */
import { useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { BackToTop, Button, Collapsible, DemoBanner, PerkLedger, PerkTable, PlanPicker, ProWelcome, Screen, TopBar, useBackHandler, type PlanOption } from '../components';
import { DAY, GROWTH_CONFIG } from '../engine';
import { T } from '../styles/tokens.gen';
import { PLAN_DAYS, PLAN_NAME, PLAN_PRICE, PRO_PERKS, activate, dayText, pitchProduct, proFacts, proPitch, proStatus, trialUsed, usePro, type Plan } from '../data/pro';
import { keepQuery, useShop } from './useShop';
import s from './ShopPages.module.css';
import p from './ProPages.module.css';

const DEMO = '演示模式 · 不收集支付信息，不扣费';

export function ProPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation();
  const topRef = useRef<HTMLDivElement>(null);
  const { g, hits } = useShop(scenario, now);
  const [ps, update] = usePro(scenario);
  const st = proStatus(ps, now);
  const [plan, setPlan] = useState<Plan>('year');
  const [table, setTable] = useState(false);
  const [done, setDone] = useState<{ plan: Plan; toMs: number } | null>(null);
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/me' + keepQuery(loc.search), { replace: true }));
  useBackHandler(!!done, back);

  const facts = useMemo(() => proFacts(g, now), [g, now]);
  const rows = useMemo(() => proPitch(facts, pitchProduct(hits)), [facts, hits]);
  const plans: PlanOption<Plan>[] = [
    { id: 'month', name: '月度', price: PLAN_PRICE.month }, { id: 'year', name: '年度', price: PLAN_PRICE.year, tag: '省 40%' },
    ...(st.kind === 'free' && !trialUsed(ps) ? [{ id: 'trial' as const, name: '试用', price: PLAN_PRICE.trial }] : []),
  ];
  const pick = plans.some((x) => x.id === plan) ? plan : 'year';

  if (done) return (
    <Screen label="开通成功">
      <div className={s.scroll}>
        <div className={`${s.body} ${s.withCta} ${p.welcomeBody}`}>
          <DemoBanner>{DEMO}</DemoBanner>
          <ProWelcome stage={g.stage} title="欢迎加入 Milo Pro" line={`${PLAN_NAME[done.plan]}会员 · ${dayText(done.toMs)}到期${done.plan === 'trial' ? ' · 不自动扣费' : ''}`}>
            <PerkLedger kind="pair" label="刚到手的" items={[
              { value: '冻结卡', unit: `×${GROWTH_CONFIG.proFreezePerMonth}`, reason: '本月的已放进钱包' },
              { value: '牛劲', unit: `×${GROWTH_CONFIG.niujin.proRate}`, reason: '从下一次训练起' },
              { value: '会员价', reason: '商城已生效' },
            ]} />
          </ProWelcome>
        </div>
      </div>
      <div className={s.cta}><Button kind="primary" glow onClick={back}>开始用</Button></div>
    </Screen>
  );
  if (st.kind === 'pro') return <Navigate to={'/me/pro' + keepQuery(loc.search)} replace />;

  // 展开对比后把表滚进视野（不然它藏在拇指区的方案和按钮后面）：等高度弹簧走完再滚
  const openTable = () => { const next = !table; setTable(next); if (next) window.setTimeout(() => document.getElementById('pro-table')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }), T['motion/spring-ms']); };
  const buy = () => { update((x) => activate(x, pick, now)); setDone({ plan: pick, toMs: now + PLAN_DAYS[pick] * DAY }); };
  const cta = pick === 'trial' ? '开始 7 天试用（演示）' : `开通${PLAN_NAME[pick]}（演示，不扣费）`;
  return (
    <Screen label="Milo Pro">
      <TopBar title="Milo Pro" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        <div className={`${s.body} ${p.payBody}`}>
          <DemoBanner>{DEMO}</DemoBanner>
          {facts.hasHistory ? <>
            <header className={p.head}>
              <h2 className={`milo-text-title-l ${p.title}`}>这 30 天，Pro 会多给你</h2>
              <p className={`milo-text-caption ${s.note}`}>{st.kind === 'trial' ? `试用还剩 ${st.daysLeft} 天 · 开通后从今天起算` : '按你的训练数据算'}</p>
            </header>
            <PerkLedger label="Pro 会多给你" items={rows} />
            <button type="button" className={`milo-text-body milo-focus ${s.link} ${p.more}`} aria-expanded={table} aria-controls="pro-table" onClick={openTable}>
              {table ? '收起对比' : '看完整对比'}<span className={`${p.caret} ${table ? p.caretUp : ''}`} aria-hidden="true">›</span>
            </button>
            <Collapsible open={table} id="pro-table"><PerkTable rows={PRO_PERKS} /></Collapsible>
          </> : <>
            <header className={p.head}>
              <h2 className={`milo-text-title-l ${p.title}`}>练得更聪明一点</h2>
              <p className={`milo-text-caption ${s.note}`}>免费版保留处方、记录、容量、增量的完整闭环</p>
            </header>
            <PerkTable rows={PRO_PERKS} />
          </>}
        </div>
      </div>
      <div className={`${s.cta} ${p.buy}`}>
        <PlanPicker plans={plans} value={pick} onChange={setPlan} />
        <Button kind="primary" glow onClick={buy}>{cta}</Button>
      </div>
      <BackToTop target={topRef} lift />
    </Screen>
  );
}
