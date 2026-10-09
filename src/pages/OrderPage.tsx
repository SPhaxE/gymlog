/** 订单完成（P19，/shop/order/:id；ia F6）。线框 ?board=order W2，Stitch 订单完成 V2（换开心的小牛、去掉和「回商城」重复的 ×，docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：收得住——这一单成了、花了多少牛劲和券，看完回去接着逛或练。
 *  - 范围：小牛开心 + 下单成功 + 演示订单号（不会真的发货）· 明细：商品 · 规格、实付、用掉（牛劲 · 券）、牛劲余额 之前 → 现在；订单不存在 = 空状态 + 回商城。
 *  - 结构：P18 提交后替换历史进来；返回（左上 / 系统返回键）→ 商城 P15，不回确认页。
 *  - 框架：第一优先 = 成功 + 余额变化；主操作 = 底部「回商城」，次要文字链「查看钱包」。
 *  - 表现：品牌时刻放 IP 小牛（Mascot happy，牛龄跟着用户）；荧光只有主按钮。 */
import { useNavigate, useLocation, useParams } from 'react-router';
import { Button, Mascot, Screen, StateView, TopBar, useBackHandler } from '../components';
import { keepQuery, useShop } from './useShop';
import s from './ShopPages.module.css';
import { usePageNav } from '../shell/pageNav';

const yuan = (n: number) => `¥${n.toLocaleString('en-US')}`;

export function OrderPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation();
  const pn = usePageNav();
  const { id } = useParams();
  const { wallet, g, balance } = useShop(scenario, now);
  const toShop = () => nav('/shop' + keepQuery(loc.search), { replace: true });
  useBackHandler(true, toShop);
  const o = wallet.orders.find((x) => x.id === id);
  if (!o) return (
    <Screen label="订单"><TopBar title="订单" onBack={toShop} />
      <div className={s.body}><StateView kind="empty" title="没有这笔订单" detail="订单只存在这台设备上。" action="回商城" onAction={toShop} /></div>
    </Screen>
  );
  const spent = o.niujinOff * 100, latest = wallet.orders.at(-1)?.id === o.id;
  const used = [spent ? `${spent.toLocaleString('en-US')} 牛劲` : '', o.couponTitle ?? ''].filter(Boolean).join(' · ') || '没有用牛劲和券';
  return (
    <Screen label="订单完成">
      <TopBar title="订单完成" onBack={toShop} />
      <div className={s.scroll}>
        <div className={`${s.body} ${s.withCta}`}>
          <div className={s.done}>
            <div className={s.doneMascot}><Mascot stage={g.stage} mood="happy" animate title="开心的小牛" /></div>
            <h2 className={`milo-text-title-l ${s.doneTitle}`}>下单成功</h2>
            <p className={`milo-text-caption ${s.note}`}>订单号 {o.id}</p>
          </div>
          <div className={s.kv}>
            <div className={s.kvRow}><span className="milo-text-caption">{o.name}{o.size ? ` · ${o.size}` : ''}</span><span className="milo-text-number-s">{yuan(o.price)}</span></div>
            <div className={s.kvRow}><span className="milo-text-caption">实付</span><b className="milo-text-number-l">{yuan(o.pay)}</b></div>
            <div className={s.kvRow}><span className="milo-text-caption">用掉</span><span className="milo-text-body">{used}</span></div>
            {latest && spent > 0 && <div className={s.kvRow}><span className="milo-text-caption">牛劲余额</span><span className="milo-text-number-s">{(balance + spent).toLocaleString('en-US')} → {balance.toLocaleString('en-US')}</span></div>}
          </div>
        </div>
      </div>
      <div className={s.cta}>
        <button type="button" className={`milo-text-body milo-focus ${s.link}`} onClick={() => pn.push('/me/wallet' + keepQuery(loc.search))}>查看钱包</button>
        <Button kind="primary" glow onClick={toShop}>回商城</Button>
      </div>
    </Screen>
  );
}
