/** 下单确认（P18，/shop/checkout?item=&size=；ia F6）。线框 ?board=order W1，Stitch 确认订单 V2（「最大比例」标改灰，docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：演示一笔完整下单，展示卡券和牛劲怎么抵，同时不误导（演示模式，不收集任何支付信息）。
 *  - 范围：演示模式横幅 · 商品行（规格、商家、会员价）· 卡券（能用的里抵得最多的先选好；点开底部面板换一张或不用）·
 *    牛劲抵扣开关（按会员价的 20% 封顶，100 牛劲 = 1 元；一元都抵不了时开关不可用并写还差多少）· 金额明细 + 合计 · 提交（提交中按钮禁用，不会重复下单）。
 *  - 结构：P17「购买」→ 这里 → 提交 → P19 订单完成（替换历史：返回不回到这一页）。
 *  - 框架：第一优先 = 商品 + 合计；主操作 = 底部「提交订单 · ¥」（拇指区）。
 *  - 表现：整页唯一荧光 = 提交按钮；「最大比例」是灰标；没有任何支付输入。 */
import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BackToTop, Breakdown, Button, List, ListRow, OptionCard, OptionGroup, OrderLine, Screen, Sheet, StateView, Switch, TopBar } from '../components';
import { productById } from '../data/growth';
import { couponOff, placeOrder, quote, usableCoupons } from '../data/wallet';
import { keepQuery, useShop } from './useShop';
import s from './ShopPages.module.css';
import { usePageNav } from '../shell/pageNav';

const yuan = (n: number) => `¥${n.toLocaleString('en-US')}`;

export function CheckoutPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation();
  const pn = usePageNav();
  const topRef = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(loc.search);
  const p = productById(params.get('item') ?? ''), size = params.get('size');
  const { balance, coupons, update } = useShop(scenario, now);
  const usable = useMemo(() => (p ? usableCoupons(coupons, p) : []), [coupons, p]);
  const [couponId, setCouponId] = useState<string | null | undefined>(undefined);
  const [useNiujin, setUseNiujin] = useState(true);
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const back = () => pn.back('/shop' + keepQuery(loc.search));
  if (!p || p.status === 'oos' || p.status === 'off') return (
    <Screen label="确认订单"><TopBar title="确认订单" onBack={back} />
      <div className={s.body}><StateView kind="empty" title={p ? '这件商品现在买不了' : '没有要买的商品'} detail={p ? '缺货或已下架。' : '从商品详情点「购买」进来。'} action="回商城" onAction={() => nav('/shop' + keepQuery(loc.search), { replace: true })} /></div>
    </Screen>
  );
  // 还没手动选过：默认用抵得最多的那张
  const coupon = couponId === undefined ? usable[0] ?? null : usable.find((c) => c.id === couponId) ?? null;
  const q = quote(p, balance, coupon, useNiujin);
  const canNiujin = q.niujinAfford > 0;
  const submit = () => {
    if (busy) return;
    setBusy(true);
    // 演示：提交即成功；短暂的提交中让按钮先禁用（防重复点），再进订单完成页（替换历史）
    window.setTimeout(() => {
      let id = '';
      update((w) => { const r = placeOrder(w, p, size, q, coupon, Date.now()); id = r.order.id; return r.wallet; });
      pn.push(`/shop/order/${id}${keepQuery(loc.search)}`, { replace: true });
    }, 600);
  };
  const rows: [string, number, ('minus' | 'plus')?][] = [['商品', q.price], ['会员价', q.price - q.member, 'minus']];
  if (q.ship) rows.push(['运费', q.ship]);
  if (q.couponOff) rows.push([coupon!.title, q.couponOff, 'minus']);
  if (q.niujinOff) rows.push([`牛劲 ${(q.niujinOff * 100).toLocaleString('en-US')}`, q.niujinOff, 'minus']);

  return (
    <Screen label="确认订单">
      <TopBar title="确认订单" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        <div className={`${s.body} ${s.withCta}`}>
          <OrderLine id={p.id} name={p.name} size={size} merchant={p.merchant} category={p.category} member={p.member} />
          <div className={s.card}><List>
            <ListRow kind="nav" title="卡券" disabled={usable.length === 0} onClick={() => setPick(true)}
              trailing={<span className="milo-text-caption">{coupon ? `${coupon.title} −${yuan(q.couponOff)}` : usable.length ? `${usable.length} 张可用` : '没有能用的券'}</span>} />
          </List>
            <div className={s.switchRow}>
              <span className={s.switchText}>
                <span className="milo-text-body">牛劲抵扣{useNiujin && canNiujin && q.niujinOff === q.niujinCap && <span className={`milo-text-micro ${s.gray}`}>最大比例</span>}</span>
                <span className={`milo-text-caption ${s.muted}`}>{canNiujin ? `用 ${(Math.min(q.niujinCap, q.niujinAfford) * 100).toLocaleString('en-US')} 牛劲抵 ${yuan(Math.min(q.niujinCap, q.niujinAfford))}（最多 20%）` : `还差 ${q.niujinShort} 牛劲才能抵 ¥1`}</span>
              </span>
              <Switch checked={useNiujin && canNiujin} disabled={!canNiujin} label="牛劲抵扣" onChange={setUseNiujin} />
            </div>
          </div>
          <Breakdown rows={rows} total={q.pay} />
          <p className={`milo-text-micro ${s.note}`}>提交后，用掉的牛劲和卡券可以在钱包里看到。</p>
        </div>
      </div>
      <div className={s.cta}><Button kind="primary" glow loading={busy} disabled={busy} onClick={submit}>提交订单 · {yuan(q.pay)}</Button></div>
      {pick && (
        <Sheet title="选卡券" meta={p.name} onClose={() => setPick(false)}>
          <div className={s.sheetBody}>
            <OptionGroup label="卡券">
              {usable.map((c) => <OptionCard key={c.id} title={c.title} detail={`这单抵 ${yuan(couponOff(c, p))}`} selected={coupon?.id === c.id} onClick={() => { setCouponId(c.id); setPick(false); }} />)}
              <OptionCard title="不用券" selected={!coupon} onClick={() => { setCouponId(null); setPick(false); }} />
            </OptionGroup>
          </div>
        </Sheet>
      )}
      <BackToTop target={topRef} lift />
    </Screen>
  );
}
