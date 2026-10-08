/** 商城（P15，/shop；ia §1.16）。线框 ?board=shop W1，Stitch 商城 V2 的卡片排法 + V1 的缺货整卡变暗（docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：在训练数据说明「需要」的时候，弄懂补剂 / 护具该不该用，并能直接买到（T16）；不做成一般电商，先讲为什么再卖。
 *  - 范围：为你推荐（第一张被数据触发的知识卡；没有触发时是通用入门卡：助力带）· 品类 全部 / 护具 / 补剂 · 5 款商品 × 状态（热销 / 折扣 / 新品 / 缺货）；
 *    已下架的不在列表里（从知识卡进详情时提示）；商家与品牌全部虚构，价格为示例。
 *  - 结构：子页，入口 钱包「去商城抵扣」、卡券「去用」；→ 知识卡 P16、商品 P17；右上牛劲余额点进钱包。
 *  - 框架：第一优先 = 为你推荐的理由；主操作 = 点商品（两列卡片，滑一下就到拇指区）；没有固定主按钮。
 *  - 表现：推荐卡背景配重片槽纹；状态标形状 + 文字（缺货虚线、整卡变暗）；整页不放荧光块（荧光留给详情页的「购买」）。 */
import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BackToTop, ProductCard, ProductGrid, RecommendCard, Screen, Segmented, TopBar } from '../components';
import { KNOWLEDGE, SHOP_PRODUCTS } from '../data/growth';
import { recommendFor } from '../data/knowledge';
import { offOf, useShop } from './useShop';
import s from './ShopPages.module.css';

type Cat = 'all' | '护具' | '补剂';
const CATS = [['all', '全部'], ['护具', '护具'], ['补剂', '补剂']] as const;

export function ShopPage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation();
  const topRef = useRef<HTMLDivElement>(null);
  const { balance, hits } = useShop(scenario, now);
  const [cat, setCat] = useState<Cat>('all');
  const rec = recommendFor(hits), k = KNOWLEDGE[rec.id];
  const recProduct = SHOP_PRODUCTS.find((p) => p.knowledge === rec.id);
  const list = useMemo(() => SHOP_PRODUCTS.filter((p) => cat === 'all' || p.category === cat), [cat]);
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/me/wallet' + loc.search, { replace: true }));
  const go = (path: string) => nav(path + loc.search);

  return (
    <Screen label="商城">
      <TopBar title="商城" onBack={back} trailing={
        <button type="button" className={`milo-press milo-focus ${s.balanceChip}`} onClick={() => go('/me/wallet')} aria-label={`牛劲余额 ${balance}，去钱包`}>
          <b className="milo-text-number-s">{balance.toLocaleString('en-US')}</b><span className="milo-text-caption">牛劲</span>
        </button>} />
      <div ref={topRef} className={s.scroll}>
        <div className={s.body}>
          <RecommendCard title={k.title} why={rec.why} product={recProduct && { name: recProduct.name, price: recProduct.price }} onClick={() => go(`/shop/guide/${rec.id}`)} />
          <Segmented items={CATS} value={cat} onChange={setCat} label="品类" />
          <ProductGrid>
            {list.map((p) => <ProductCard key={p.id} {...p} off={offOf(p.member, balance)} onClick={() => go(`/shop/item/${p.id}`)} />)}
          </ProductGrid>
        </div>
      </div>
      <BackToTop target={topRef} />
    </Screen>
  );
}
