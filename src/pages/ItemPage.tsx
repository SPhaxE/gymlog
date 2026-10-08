/** 商品详情（P17，/shop/item/:id；ia §1.16 / F6）。线框 ?board=item W1（正常）+ W2（缺货），Stitch 详情 V1（价格区）+ 缺货 V2 的处理（docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：看清价格（会员价、牛劲能抵多少）和状态，决定买不买。
 *  - 范围：大图 · 状态标 + 商家 · 名字 · 现价 / 划线价 / 会员价 · 牛劲可抵（不足写还差多少）· 规格（尺码 / 口味）· 商家 · 规格说明（不写功效数字，Stitch 编的参数表不用）· 相关知识卡。
 *    状态：正常 / 热销 / 折扣 / 新品 → 「购买」；缺货 → 「到货提醒」（设了以后「已设提醒 · 看消息」，不是死按钮）；已下架 → 整页变灰 + 「回商城看看别的」（ia：提示并回 P15）。
 *  - 结构：子页；→ 下单确认 P18（带规格）；相关知识卡 → P16。
 *  - 框架：第一优先 = 价格区；主操作 = 底部拇指区一个按钮，按状态换文案，永远有出口。
 *  - 表现：只有可以买的时候主按钮是荧光；缺货 / 下架是描边 / 骨白（缺货不出荧光购买键）。 */
import { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { BackToTop, Banner, Button, List, ListRow, NiujinLine, PriceBlock, ProductImage, Screen, Segmented, SectionLabel, StateView, StatusTag, TopBar, useToast } from '../components';
import { KNOWLEDGE, productById } from '../data/growth';
import { proStatus, usePro } from '../data/pro';
import { quote, remind } from '../data/wallet';
import { useShop } from './useShop';
import s from './ShopPages.module.css';

export function ItemPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation(), toast = useToast();
  const topRef = useRef<HTMLDivElement>(null);
  const p = productById(useParams().id ?? '');
  const { balance, wallet, update } = useShop(scenario, now);
  const [pro] = usePro(scenario);
  const proOn = proStatus(pro, now).kind !== 'free';
  const [size, setSize] = useState(() => (p?.sizes ? p.sizes[Math.floor((p.sizes.length - 1) / 2)] : null));
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/shop' + loc.search, { replace: true }));
  const toShop = () => nav('/shop' + loc.search, { replace: true });
  if (!p) return (
    <Screen label="商品详情"><TopBar title="商品详情" onBack={back} />
      <div className={s.body}><StateView kind="empty" title="没有这件商品" detail="可能是旧链接。" action="回商城" onAction={toShop} /></div>
    </Screen>
  );
  const q = quote(p, balance, null, true);
  const reminded = wallet.restock.some((r) => r.productId === p.id);
  const off = p.status === 'off', oos = p.status === 'oos';
  const setRemind = () => { update((w) => remind(w, p.id, Date.now())); toast.show('到货提醒已设：到了会在「我的 · 消息」告诉你'); };

  return (
    <Screen label="商品详情">
      <TopBar title="商品详情" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        <div className={`${s.body} ${s.withCta}`}>
          {off && <Banner title="这件商品已下架" detail="商家不再出售。去商城看看别的。" />}
          <ProductImage id={p.id} category={p.category} dim={off || oos} />
          <div className={`${s.itemHead} ${off ? s.off : ''}`}>
            <span className={s.tagLine}><StatusTag status={p.status} /><span className={`milo-text-caption ${s.muted}`}>{p.merchant} · {p.category}</span></span>
            <h2 className={`milo-text-title-m ${s.kTitle}`}>{p.name}</h2>
            <PriceBlock price={p.price} was={p.was} member={p.member} proActive={proOn} onPro={() => nav((proOn ? '/me/pro' : '/pro') + loc.search)} />
            <span className={`milo-text-caption ${s.muted}`}>{p.spec}</span>
          </div>
          {!off && <NiujinLine off={q.niujinOff} balance={balance} short={q.niujinShort} />}
          {p.sizes && !off && (
            <section className={s.sec} aria-label="规格">
              <SectionLabel>规格</SectionLabel>
              <Segmented items={p.sizes.map((z) => [z, z] as const)} value={size ?? p.sizes[0]} onChange={setSize} label="规格" />
            </section>
          )}
          <section className={s.sec} aria-label="商家说明">
            <SectionLabel>商家 · 规格说明</SectionLabel>
            <p className={`milo-text-body ${s.note}`}>{p.about}</p>
          </section>
          <div className={s.card}><List>
            <ListRow kind="nav" title={`相关知识卡：${KNOWLEDGE[p.knowledge].title}`} onClick={() => nav(`/shop/guide/${p.knowledge}${loc.search}`)} />
          </List></div>
        </div>
      </div>
      <div className={s.cta}>
        {off ? <Button kind="neutral" onClick={toShop}>回商城看看别的</Button>
          : oos ? <>
              <p className={`milo-text-caption ${s.ctaNote}`}>缺货 · {p.eta}</p>
              {reminded ? <Button kind="ghost" icon="check" onClick={() => nav('/me/messages' + loc.search)}>已设到货提醒 · 看消息</Button>
                : <Button kind="ghost" onClick={setRemind}>到货提醒</Button>}
            </>
          : <Button kind="primary" glow onClick={() => nav(`/shop/checkout?item=${p.id}${size ? `&size=${encodeURIComponent(size)}` : ''}${loc.search.replace(/^\?/, '&')}`)}>购买 · 会员价 ¥{p.member}</Button>}
      </div>
      <BackToTop target={topRef} lift />
    </Screen>
  );
}
