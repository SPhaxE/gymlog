/** 知识卡（P16，/shop/guide/:id；ia §1.16 / F6）。线框 ?board=guide W2（证据在顶 + 商品就在下面），Stitch 知识卡 V1 + V2 的结论句（docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：先讲清楚为什么、什么时候用、怎么用，再给商品——知识卡是商城的主要入口，不是广告（T16）。
 *  - 范围：按你的数据的那句话 + 证据面板（腰带：预估 1RM ÷ 体重走势 + 门槛线，越过写「已越过推荐门槛」）；没被触发时写「入门」· 什么时候用 · 怎么用 3 条 ·
 *    「不构成医疗建议 / 护具只辅助」· 相关商品（含已下架的，点进去提示）· 「不再提示这一类」（容量页 / 增量页的提示不再出现这一类；再点一次恢复）。
 *    不写任何功效数字（Stitch 编的「腹压 +18%」一律不用）。
 *  - 结构：子页，入口 容量页 / 增量页的知识卡提示、商城「为你推荐」；→ 商品详情 P17。
 *  - 框架：第一优先 = 证据（为什么现在给你看）；主操作 = 底部「看 {第一件商品}」（拇指区）；相关商品行在上面也能直接点。
 *  - 表现：证据面板骨白线 + 灰门槛虚线，结论条骨白；整页唯一荧光是底部主按钮。 */
import { useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { BackToTop, Button, EvidencePanel, ProductCard, Screen, SectionLabel, StateView, TopBar, useToast } from '../components';
import { KNOWLEDGE, PRODUCTS, type KnowledgeId } from '../data/growth';
import { TIP_PAGES } from '../data/knowledge';
import { mute } from '../data/wallet';
import { offOf, useShop } from './useShop';
import s from './ShopPages.module.css';

export function GuidePage({ scenario, now }: { scenario?: string; now: number }) {
  const nav = useNavigate(), loc = useLocation(), toast = useToast();
  const topRef = useRef<HTMLDivElement>(null);
  const id = useParams().id as KnowledgeId;
  const { balance, hits, wallet, update } = useShop(scenario, now);
  const k = KNOWLEDGE[id];
  const back = () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/shop' + loc.search, { replace: true }));
  if (!k) return (
    <Screen label="知识卡"><TopBar title="知识卡" onBack={back} />
      <div className={s.body}><StateView kind="empty" title="没有这张知识卡" detail="可能是旧链接。" action="回商城" onAction={() => nav('/shop' + loc.search, { replace: true })} /></div>
    </Screen>
  );
  const hit = hits.find((h) => h.id === id);
  const products = PRODUCTS.filter((p) => p.knowledge === id);
  const first = products.find((p) => p.status !== 'off');
  const muted = wallet.muted.includes(id);
  // 只有会在容量页 / 增量页弹提示的那几类才有「不再提示」（助力带是通用卡，不弹）
  const tipped = Object.values(TIP_PAGES).some((ids) => ids.includes(id));
  const toggleMute = () => {
    update((w) => (muted ? { ...w, muted: w.muted.filter((x) => x !== id) } : mute(w, id)));
    toast.show(muted ? '这一类提示恢复了' : '容量页、增量页不再提示这一类');
  };
  const go = (pid: string) => nav(`/shop/item/${pid}${loc.search}`);

  return (
    <Screen label="知识卡">
      <TopBar title="知识卡" onBack={back} />
      <div ref={topRef} className={s.scroll}>
        <div className={`${s.body} ${first ? s.withCta : ''}`}>
          <h2 className={`milo-text-title-l ${s.kTitle}`}>{k.title}</h2>
          {hit?.evidence
            ? <EvidencePanel {...hit.evidence} />
            : <p className={`milo-text-body ${s.note}`}>{hit ? hit.why : '入门知识：先弄懂再决定要不要买。'}</p>}
          {hit?.evidence && <p className={`milo-text-body ${s.note}`}>{hit.why}。</p>}

          <section className={s.sec} aria-label="什么时候用">
            <SectionLabel>什么时候用</SectionLabel>
            <p className={`milo-text-body ${s.note}`}>{k.when}。</p>
          </section>
          <section className={s.sec} aria-label="怎么用">
            <SectionLabel>怎么用</SectionLabel>
            <ol className={s.how}>{k.how.map((h, i) => <li key={i} className="milo-text-body"><b className="milo-text-number-s">{i + 1}</b>{h}</li>)}</ol>
            <p className={`milo-text-micro ${s.note}`}>{k.supplement ? '补剂说明不构成医疗建议，有基础疾病请先咨询医生。' : '护具只辅助，不代替力量与动作质量。不构成医疗建议。'}</p>
          </section>

          {products.length > 0 && (
            <section className={s.sec} aria-label="相关商品">
              <SectionLabel>相关商品</SectionLabel>
              <div className={s.stack}>{products.map((p) => <ProductCard key={p.id} {...p} variant="row" off={offOf(p.member, balance)} onClick={() => go(p.id)} />)}</div>
            </section>
          )}
          {tipped && <button type="button" className={`milo-text-caption milo-focus ${s.link}`} onClick={toggleMute}>{muted ? '已不再提示这一类 · 恢复提示' : '不再提示这一类'}</button>}
        </div>
      </div>
      {first && <div className={s.cta}><Button kind="primary" glow onClick={() => go(first.id)}>看{first.name}</Button></div>}
      <BackToTop target={topRef} lift={!!first} />
    </Screen>
  );
}
