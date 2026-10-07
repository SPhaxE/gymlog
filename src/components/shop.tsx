/** 钱包与商城组件（6f，ia §1.15 / §1.16；Stitch 取舍见 docs/brief.md 2026-10-07）。
 *  - 商品卡：商城 V2 的排法（商家在名字上方、状态标压在图左上，一屏 4 张）+ V1 的缺货整卡变暗；row = 知识卡里的相关商品行。
 *  - 状态不只靠颜色：热销 / 折扣 / 新品 实心小标，缺货虚线框，已下架灰字。
 *  - 荧光只给每屏唯一焦点（主按钮）；这里的标、价格、证据图都不用荧光，「最大比例」这类标一律灰。
 *  - 数字全部由调用方算好传进来（data/wallet.ts 的 quote）。不写功效数字。 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cx, forced, type Forced } from './state';
import s from './shop.module.css';

export type ProductStatus = 'normal' | 'hot' | 'sale' | 'new' | 'oos' | 'off';
const STATUS: Record<ProductStatus, string> = { normal: '', hot: '热销', sale: '折扣', new: '新品', oos: '缺货', off: '已下架' };
const yuan = (n: number) => `¥${n.toLocaleString('en-US')}`;

/** 商品状态标：热销 / 折扣 / 新品 实心；缺货 虚线；已下架 灰字；普通不出标 */
export function StatusTag({ status }: { status: ProductStatus }) {
  if (status === 'normal') return null;
  return <span className={cx('milo-text-micro', s.tag, s[`tag_${status}`])}>{STATUS[status]}</span>;
}

/** 商品图：public/shop/<id>.webp；加载好之前 / 没有图时显示品类占位（护具 = 横条、补给 = 罐子），不出现破图 */
function Pic({ id, category, className }: { id?: string; category: '护具' | '补给'; className?: string }) {
  const [img, setImg] = useState(false);
  return (
    <span className={cx(s.pic, !img && (category === '补给' ? s.picSupp : s.picGear), className)} aria-hidden="true">
      {!img && <i />}
      {id && <img className={cx(s.picImg, !img && s.picWait)} src={`${import.meta.env.BASE_URL}shop/${id}.webp`} alt="" draggable={false} onLoad={() => setImg(true)} onError={() => setImg(false)} />}
    </span>
  );
}

/** 商品详情的大图（同一张商品图，占满宽度；缺货 / 已下架变灰） */
export function ProductImage({ id, category, dim }: { id?: string; category: '护具' | '补给'; dim?: boolean }) {
  return <span className={cx(s.hero, dim && s.dim)}><Pic id={id} category={category} /></span>;
}

export interface ProductCardProps {
  id?: string; name: string; merchant: string; spec?: string; price: number; member: number; category: '护具' | '补给'; status: ProductStatus; was?: number;
  /** 牛劲最多能抵多少元（会员价 × 20% 与余额取小） */
  off: number;
  variant?: 'grid' | 'row';
  onClick?: () => void; state?: Forced;
}
/** 商品卡。grid = 商城两列（图 + 左上状态标 → 商家 → 名字 → 价格 + 划线价 → 会员价 · 牛劲抵）；row = 知识卡里的相关商品行。
 *  缺货整卡变暗但仍可点（进详情设到货提醒）；已下架不出现在商城列表，row 里出现时灰字、仍可点（详情页提示并回商城） */
export function ProductCard({ id, name, merchant, price, member, category, status, was, off, variant = 'grid', onClick, state }: ProductCardProps) {
  const dim = status === 'oos' || status === 'off';
  const label = `${name}，${merchant}，${yuan(price)}${was ? `，原价 ${yuan(was)}` : ''}，会员 ${yuan(member)}${STATUS[status] ? `，${STATUS[status]}` : ''}`;
  const sub = status === 'off' ? '已下架' : `会员 ${yuan(member)}${off > 0 ? ` · 牛劲抵 ${yuan(off)}` : ''}`;
  if (variant === 'row') return (
    <button type="button" className={cx('milo-press milo-focus', s.row, dim && s.dim)} onClick={onClick} aria-label={label} {...forced(state)}>
      <Pic id={id} category={category} className={s.picRow} />
      <span className={s.rowText}>
        <span className={s.nameLine}><b className="milo-text-body-strong">{name}</b><StatusTag status={status} /></span>
        <span className={cx('milo-text-caption', s.muted)}>{sub}</span>
      </span>
      <span className={s.rowPrice}><b className="milo-text-number-m">{yuan(price)}</b>{was && <s className={cx('milo-text-micro', s.muted)}>{yuan(was)}</s>}</span>
      <Icon name="chevron" small />
    </button>
  );
  return (
    <button type="button" className={cx('milo-press milo-focus', s.card, dim && s.dim)} onClick={onClick} aria-label={label} {...forced(state)}>
      <span className={s.picBox}><Pic id={id} category={category} /><span className={s.tagAt}><StatusTag status={status} /></span></span>
      <span className={cx('milo-text-micro', s.muted)}>{merchant}</span>
      <b className={cx('milo-text-body-strong', s.name)}>{name}</b>
      <span className={s.priceLine}><b className="milo-text-number-m">{yuan(price)}</b>{was && <s className={cx('milo-text-micro', s.muted)}>{yuan(was)}</s>}</span>
      <span className={cx('milo-text-micro', s.muted)}>{sub}</span>
    </button>
  );
}

/** 商城顶部「为你推荐」：知识卡的理由（按你的训练数据）+ 对应商品一行；没有触发时是通用入门卡（label 换成「入门知识」）。整张点进知识卡 */
export function RecommendCard({ title, why, product, onClick, state }: { title: string; why: string | null; product?: { name: string; price: number }; onClick?: () => void; state?: Forced }) {
  return (
    <button type="button" className={cx('milo-press milo-focus', s.rec)} onClick={onClick} {...forced(state)}>
      <span className={s.recHead}><span className={cx('milo-text-micro', s.recLabel)}>{why ? '知识卡 · 按你的训练数据' : '知识卡 · 入门'}</span><Icon name="chevron" small /></span>
      <b className="milo-text-title-m">{title}</b>
      {why && <span className={cx('milo-text-caption', s.muted)}>{why}</span>}
      {product && <span className={cx('milo-text-caption', s.recProduct)}>相关：{product.name} · <b className="milo-text-number-s">{yuan(product.price)}</b></span>}
    </button>
  );
}

/** 详情页价格区（详情 V1）：现价大字 + 划线价 + 会员价标，一行读完 */
export function PriceBlock({ price, was, member }: { price: number; was?: number; member: number }) {
  return (
    <div className={s.priceBlock}>
      <b className="milo-text-number-xl">{yuan(price)}</b>
      {was && <s className={cx('milo-text-caption', s.muted)}>{yuan(was)}</s>}
      <span className={cx('milo-text-label', s.member)}>会员 {yuan(member)}</span>
    </div>
  );
}

/** 牛劲能抵多少：可抵 ¥N（余额 · 每单最多 20%）；一元都抵不了时写还差多少牛劲 */
export function NiujinLine({ off, balance, short }: { off: number; balance: number; short?: number }) {
  return (
    <div className={cx(s.niujin, !off && s.niujinNone)}>
      <b className="milo-text-body-strong">{off > 0 ? `牛劲可抵 ${yuan(off)}` : '牛劲暂不能抵扣'}</b>
      <span className={cx('milo-text-caption', s.muted)}>{off > 0 ? `余额 ${balance.toLocaleString('en-US')} · 每单最多 20%` : `还差 ${short ?? 0} 牛劲`}</span>
    </div>
  );
}

/** 知识卡的证据面板（知识卡 V1 的证据图 + 大数，V2 的结论句）：一条走势线 + 门槛虚线；越过门槛时写「已越过推荐门槛」 */
export function EvidencePanel({ label, value, unit, series, threshold, detail }: { label: string; value: string; unit: string; series: number[]; threshold: number; detail?: string }) {
  const W = 100, H = 40, lo = Math.min(threshold, ...series) * 0.92, hi = Math.max(threshold, ...series) * 1.04;
  const y = (v: number) => H - ((v - lo) / (hi - lo || 1)) * H;
  const pts = series.map((v, i) => `${series.length > 1 ? (i / (series.length - 1)) * W : W},${y(v)}`);
  const over = (series.at(-1) ?? 0) >= threshold;
  return (
    <figure className={s.evidence} aria-label={`${label}：${value} ${unit}${over ? '，已越过推荐门槛' : ''}`}>
      <figcaption className={cx('milo-text-caption', s.muted)}>{label}</figcaption>
      <div className={s.evBody}>
        <div className={s.evNum}><b className="milo-text-number-xl">{value}</b><span className={cx('milo-text-caption', s.muted)}>{unit}</span></div>
        <svg className={s.evChart} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <line className={s.evGate} x1={0} x2={W} y1={y(threshold)} y2={y(threshold)} vectorEffect="non-scaling-stroke" />
          <polyline className={s.evLine} points={pts.join(' ')} vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <p className={cx('milo-text-caption', s.evFoot)}>
        <span className={cx(s.evMark, over && s.evOver)} aria-hidden="true" />{over ? '已越过推荐门槛' : '还没到推荐门槛'}（{threshold} {unit}）{detail && <span className={s.muted}> · {detail}</span>}
      </p>
    </figure>
  );
}

/** 钱包底部的两个出口（钱包 W2 / Stitch V1）：「去商城抵扣」是这一屏唯一的荧光，「兑换卡券」描边；各带一行说明 */
export function WalletExits({ onShop, onRedeem, redeemFrom, state }: { onShop?: () => void; onRedeem?: () => void; redeemFrom: number; state?: Forced }) {
  return (
    <div className={s.exits}>
      <button type="button" className={cx('milo-press milo-focus', s.exit, s.exitMain)} onClick={onShop} {...forced(state)}><b>去商城抵扣</b><span className="milo-text-micro">每单最多抵 20%</span></button>
      <button type="button" className={cx('milo-press milo-focus', s.exit)} onClick={onRedeem}><b>兑换卡券</b><span className="milo-text-micro">{redeemFrom} 牛劲起</span></button>
    </div>
  );
}

/** 下单 / 订单里的商品行：图 + 名字 + 规格 · 商家 + 会员价 */
export function OrderLine({ id, name, size, merchant, category, member, qty = 1 }: { id?: string; name: string; size: string | null; merchant: string; category: '护具' | '补给'; member: number; qty?: number }) {
  return (
    <div className={s.orderLine}>
      <Pic id={id} category={category} className={s.picRow} />
      <span className={s.rowText}><b className="milo-text-body-strong">{name}</b><span className={cx('milo-text-caption', s.muted)}>{size ? `${size} · ` : ''}{merchant} · ×{qty}</span></span>
      <b className="milo-text-number-m">{yuan(member)}</b>
    </div>
  );
}

/** 金额明细：一行一项（减项写 −¥），最下面合计大字 */
export function Breakdown({ rows, total, totalLabel = '合计' }: { rows: [string, number, ('minus' | 'plus')?][]; total: number; totalLabel?: string }) {
  return (
    <div className={s.breakdown}>
      {rows.map(([k, v, sign]) => (
        <div key={k} className={s.bRow}><span className={cx('milo-text-caption', s.muted)}>{k}</span><span className="milo-text-number-s">{sign === 'minus' ? '−' : ''}{yuan(v)}</span></div>
      ))}
      <div className={s.bTotal}><span className="milo-text-heading">{totalLabel}</span><b className="milo-text-number-xl">{yuan(total)}</b></div>
    </div>
  );
}

/** 演示模式横幅：不收集任何支付信息，提交即成功 */
export function DemoBanner({ children = '演示模式 · 不收集任何支付信息，提交即成功' }: { children?: ReactNode }) {
  return <p className={cx('milo-text-caption', s.demo)}><i aria-hidden="true" />{children}</p>;
}

/** 商城卡片网格：两列，行高按内容（grid-auto-rows: max-content，DESIGN §9.6） */
export function ProductGrid({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div className={s.grid} style={style}>{children}</div>;
}
