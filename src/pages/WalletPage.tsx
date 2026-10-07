/** 钱包（P14，/me/wallet；ia §1.15）。线框 ?board=wallet W2，Stitch 钱包 V1 + V2 的刻度尺分隔（docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：知道自己攒了多少牛劲、能换什么，并且把它用掉（T15 / T17）——钱包是增长闭环后半段的落点。
 *  - 范围：余额（≈ 元、本月进账）· 我的卡券（冻结卡 + 兑换来的券，可用 / 已用 / 过期）· 最近明细 5 条（「全部明细」就地展开）· 两个出口：去商城抵扣、兑换卡券。
 *    兑换列表：冻结卡 · 免邮券 · 商家满减券；Pro 体验 7 天（6g）只在「用过免费试用、现在是免费」时出现——还有免费试用时它没有意义（付费墙试用不花牛劲），已是会员时也用不上；兑换即开通 7 天体验，卡券里记一张「已用」。
 *  - 结构：子页，入口「我的 → 钱包 · 商城」、牛龄页连胜快断时的「兑一张冻结卡」（?redeem=freeze：进来就打开兑换面板、只放冻结卡，兑完回牛龄页）；兑换走底部面板（可撤销的操作 → 面板，DESIGN §9.6 第 14 条），兑换成功轻提示；可用的券「去用」→ 商城。
 *  - 框架：第一优先 = 余额；主操作 = 底部拇指区两个出口（「去商城抵扣」荧光，「兑换卡券」描边）；返回左上。
 *  - 表现：余额码表大数 + 刻度尺分隔；支出骨白、获得荧光（流水行自带）；这一屏唯一的荧光块是「去商城抵扣」。 */
import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BackToTop, Coupon, LedgerRow, NiujinBalance, Screen, SectionLabel, Sheet, StateView, TopBar, WalletExits, useToast } from '../components';
import { COUPONS, dateOf, type CouponType } from '../data/growth';
import { activate, proStatus, trialUsed, usePro } from '../data/pro';
import { redeem } from '../data/wallet';
import { DAY } from '../engine';
import { useShop } from './useShop';
import s from './ShopPages.module.css';

const REDEEMABLE: CouponType[] = ['freeze', 'shipping', 'merchant'];
const RECENT = 5, ALL = 30;

export function WalletPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation(), toast = useToast();
  const topRef = useRef<HTMLDivElement>(null);
  const { g, balance, coupons, update } = useShop(scenario, now);
  const [pro, setPro] = usePro(scenario);
  const redeemable: CouponType[] = proStatus(pro, now).kind === 'free' && trialUsed(pro) ? [...REDEEMABLE, 'trial'] : REDEEMABLE;
  const [all, setAll] = useState(false);
  const only = new URLSearchParams(loc.search).get('redeem') === 'freeze';
  const [sheet, setSheet] = useState(only);
  const ledger = useMemo(() => [...g.niujin.ledger].reverse(), [g]);
  const month = useMemo(() => g.niujin.ledger.filter((r) => r.amount > 0 && r.atMs > now - 30 * DAY).reduce((a, r) => a + r.amount, 0), [g, now]);
  const freeze = g.streak.freezeCards;
  const usable = coupons.filter((c) => c.state === 'available').length + (freeze > 0 ? 1 : 0);
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/me' + loc.search, { replace: true }));
  const shop = () => nav('/shop' + loc.search);
  const doRedeem = (t: CouponType) => {
    update((w) => redeem(w, t, Date.now())); setSheet(false);
    if (t === 'trial') setPro((x) => activate(x, 'trial', now));
    toast.show(t === 'trial' ? '已兑换：Milo Pro 体验 7 天，今天起生效' : `已兑换：${COUPONS[t].title}`);
    if (only && (window.history.state?.idx ?? 0) > 0) nav(-1);   // 从牛龄页「兑一张冻结卡」来的：兑完回去看连胜保住了
  };

  return (
    <Screen label="钱包">
      <TopBar title="钱包" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        <div className={`${s.body} ${s.withExits}`}>
          <NiujinBalance balance={balance} month={month} />

          <section className={s.sec} aria-label="我的卡券">
            <SectionLabel>我的卡券 · {usable} 张可用</SectionLabel>
            {freeze === 0 && coupons.length === 0
              ? <p className={`milo-text-caption ${s.note}`}>还没有卡券。用牛劲兑换一张，下单时能抵钱、断档时保住连胜。</p>
              : <div className={s.stack}>
                  {freeze > 0 && <Coupon type="freeze" title={`${COUPONS.freeze.title} ×${freeze}`} detail={COUPONS.freeze.detail} state="available" />}
                  {coupons.map((c) => <Coupon key={c.id} type={c.type} title={c.title} detail={c.state === 'available' ? `${c.detail.split(' · ')[0]} · ${dateOf(c.expireAt)}前` : c.state === 'used' ? (c.type === 'trial' ? `已开通体验 · ${dateOf(c.expireAt)}到期` : '已用在一笔演示订单') : `${dateOf(c.expireAt)}过期`}
                    state={c.state} onUse={c.state === 'available' ? shop : undefined} />)}
                </div>}
          </section>

          <section className={s.sec} aria-label="明细">
            <SectionLabel>{all ? '全部明细' : '最近'}</SectionLabel>
            {ledger.length === 0
              ? <StateView kind="empty" title="还没有牛劲" detail="完成一次训练 +10，破纪录 +30，守约一周 +50。" />
              : <div className={s.stack}>
                  {ledger.slice(0, all ? ALL : RECENT).map((r, i) => <LedgerRow key={`${r.atMs}-${i}`} label={r.label} amount={r.amount} date={dateOf(r.atMs)} pro={r.pro} />)}
                </div>}
            {!all && ledger.length > RECENT && <button type="button" className={`milo-text-body milo-focus ${s.link}`} onClick={() => setAll(true)}>全部明细（{Math.min(ledger.length, ALL)} 条）</button>}
            {all && ledger.length > ALL && <p className={`milo-text-caption ${s.foot}`}>只显示最近 {ALL} 条。</p>}
          </section>
        </div>
      </div>
      <div className={s.cta}><WalletExits onShop={shop} onRedeem={() => setSheet(true)} redeemFrom={Math.min(...REDEEMABLE.map((t) => COUPONS[t].cost))} /></div>
      {sheet && (
        <Sheet title={only ? '兑一张冻结卡' : '兑换卡券'} meta={`牛劲余额 ${balance.toLocaleString('en-US')}`} onClose={() => setSheet(false)}>
          <div className={s.sheetBody}>
            {(only ? (['freeze'] as CouponType[]) : redeemable).map((t) => <Coupon key={t} type={t} title={COUPONS[t].title} detail={COUPONS[t].detail} state="redeem" cost={COUPONS[t].cost} balance={balance} onRedeem={() => doRedeem(t)} />)}
          </div>
        </Sheet>
      )}
      <BackToTop target={topRef} lift />
    </Screen>
  );
}
