/** 会员中心（P21，/me/pro；ia §1.17 / F7）。线框 ?board=prohub W1；Stitch 会员中心 = V2 骨架 + V1 卡上的刻度尺改成有效期进度（docs/brief.md 2026-10-07，Claude 选，用户授权）。
 *  五层：
 *  - 战略：开通以后看得见「值不值」，也退得出去（切回免费不收回已得的东西）。
 *  - 范围：会员卡（方案 · 已开通 / 试用中 / 已到期 · 到期日与剩几天 · 有效期刻度尺）· 这个月 Pro 给了你（多拿的牛劲 · 冻结卡 领 / 用 · 会员价省下）·
 *    权益入口（周期计划自动编排 → 增量页的减量状态、高级分析 → 容量页并打开近 7 天练得最多那块的面板〔近 8 周 · Pro〕、钱包、商城）· 管理订阅（演示：切回免费，二次确认）。
 *    试用中多一条「开通正式会员」→ P20；已到期：卡变灰、不出本月统计，给「重新开通」→ P20。从没开过：直接转 P20。
 *  - 结构：入口 开通成功后、我的「会员」行（已开通 / 试用中）；返回 → 来源页（直接打开的链接回「我的」）。切回免费 → 回「我的」+ 轻提示。
 *  - 框架：第一优先 = 到期日 + 本月得到的；**没有主操作**（不制造「再买点」的压力）；危险操作（切回免费）沉底，是居中对话框（DESIGN §9.6 第 14 条：不可撤销的这一段就此结束）。
 *  - 表现：数字窄体（码表）；整页唯一的荧光是会员卡尺子上的「今天」；权益行 M07 交错弹入 + 刻度尺画出，卡上的走过段与今天刻度从开通那头滑到今天。 */
import { useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { BackToTop, Dialog, MonthStats, PerkLedger, ProCard, Screen, SectionLabel, TopBar, useToast } from '../components';
import { bodyData } from '../data/demo';
import { PLAN_NAME, cancel, monthStart, proSaved, proStatus, proThisMonth, usePro } from '../data/pro';
import { keepQuery, useShop } from './useShop';
import s from './ShopPages.module.css';
import p from './ProPages.module.css';

export function ProHubPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation(), toast = useToast();
  const topRef = useRef<HTMLDivElement>(null);
  const q = keepQuery(loc.search);
  const { g, wallet, src } = useShop(scenario, now);
  // 「高级分析」进容量页、直接打开近 7 天练得最多那块的面板（那里有「近 8 周」）
  const topHead = useMemo(() => [...bodyData(src, now).stats.values()].sort((a, b) => b.sets7d - a.sets7d)[0]?.id ?? '', [src, now]);
  const [ps, update] = usePro(scenario);
  const [ask, setAsk] = useState(false);
  const st = proStatus(ps, now);
  const last = st.period ?? [...ps].sort((a, b) => b.toMs - a.toMs)[0];
  const month = useMemo(() => proThisMonth(g, now), [g, now]);
  const saved = useMemo(() => proSaved(wallet.orders, ps, monthStart(now)), [wallet.orders, ps, now]);
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/me' + q, { replace: true }));
  const go = (path: string) => () => nav(path + q);
  if (!last) return <Navigate to={'/pro' + q} replace />;

  const status = st.kind === 'free' ? 'expired' : st.kind;
  const off = () => { setAsk(false); update((x) => cancel(x, now)); toast.show('已切回免费，之前拿到的牛劲和冻结卡都还在'); nav('/me' + q, { replace: true }); };
  return (
    <Screen label="会员中心">
      <TopBar title="会员中心" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        <div className={`${s.body} ${p.hubBody}`}>
          <ProCard plan={PLAN_NAME[last.plan]} status={status} fromMs={last.fromMs} toMs={last.toMs} now={now} />
          {status === 'expired'
            ? <button type="button" className={`milo-text-body milo-focus ${s.link}`} onClick={go('/pro')}>重新开通</button>
            : <>
                <section className={s.sec} aria-label="这个月 Pro 给了你">
                  <SectionLabel>这个月 Pro 给了你</SectionLabel>
                  <MonthStats items={[
                    { value: `+${month.extra.toLocaleString('en-US')}`, label: '多拿的牛劲' },
                    { value: `${month.freezeGot} / ${month.freezeUsed}`, label: '冻结卡 领 / 用' },
                    { value: `¥${saved}`, label: '会员价省' },
                  ]} />
                </section>
                <section className={s.sec} aria-label="权益">
                  <SectionLabel>权益</SectionLabel>
                  <PerkLedger kind="link" label="权益" items={[
                    { value: '周期计划自动编排', reason: '减量周到点自动插进处方', onClick: go('/gains') },
                    { value: '高级分析', reason: '肌群容量趋势 · 动作对比', onClick: () => nav(`/body?head=${topHead}${q ? `&${q.slice(1)}` : ''}`) },
                    { value: '钱包', reason: `冻结卡 ${g.streak.freezeCards} 张 · 牛劲 ×1.5`, onClick: go('/me/wallet') },
                    { value: '商城', reason: '会员价已生效', onClick: go('/shop') },
                  ]} />
                </section>
                {status === 'trial' && <button type="button" className={`milo-text-body milo-focus ${s.link}`} onClick={go('/pro')}>开通正式会员</button>}
                <button type="button" className={`milo-text-caption milo-focus ${s.link} ${p.manage}`} onClick={() => setAsk(true)}>管理订阅</button>
              </>}
        </div>
      </div>
      <Dialog open={ask} onClose={() => setAsk(false)} icon="refresh" title="切回免费？" confirm="切回免费" onConfirm={off}>
        <p className={p.dlgNote}>这一段{st.kind === 'trial' ? '试用' : '会员'}现在结束。之前多拿的牛劲、领到的冻结卡都不收回；以后随时可以再开通。</p>
      </Dialog>
      <BackToTop target={topRef} />
    </Screen>
  );
}
