/** 增长层组件（阶段 5.5c，brief「增长与商业化层」，ia §1.14–§1.17）。
 *  品牌位置（牛龄徽章、付费墙、开通成功）放 IP 小牛，功能位置（连胜、流水、卡券、商品）不放，遵守「语气分工」。
 *  数字全部由调用方从引擎（growth.ts）算好传进来；这里只管怎么显示和各个状态。 */
import type { CSSProperties, ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { Odometer } from './dataviz';
import { Mascot, MascotHead, STAGE_NAME, type MascotStage } from './Mascot';
import { cx } from './state';
import s from './growth.module.css';

const STAGES: MascotStage[] = ['newborn', 'young', 'sturdy', 'bull', 'milo'];

/* ---------------- 牛龄 ---------------- */

/** 牛龄徽章：compact = 「我的」根页顶部一行（头像 + 段名 + 连胜）；full = 牛龄页头（头像 + 段名 + 三颗小级） */
export function AgeBadge({ stage, sub, size = 'full', streak }: { stage: MascotStage; sub: 1 | 2 | 3; size?: 'compact' | 'full'; streak?: number }) {
  const label = `${STAGE_NAME[stage]} ${sub} 级`;
  if (size === 'compact') return (
    <span className={cx(s.badgeC, stage === 'milo' && s.miloTone)} aria-label={`牛龄 ${label}${streak != null ? `，连胜 ${streak} 周` : ''}`}>
      <MascotHead stage={stage} className={s.badgeHeadC} />
      <b className="milo-text-label">{label}</b>
      {streak != null && <><i className={s.dot} /><span className="milo-text-caption">连胜 {streak} 周</span></>}
    </span>
  );
  return (
    <div className={cx(s.badge, stage === 'milo' && s.miloTone)} aria-label={`牛龄 ${label}`}>
      <span className={s.badgeHead}><MascotHead stage={stage} className={s.badgeHeadImg} /></span>
      <div className={s.badgeText}>
        <span className={cx('milo-text-label', s.muted)}>牛龄 · 第 {STAGES.indexOf(stage) + 1} / 5 段</span>
        <b className="milo-text-title-m">{STAGE_NAME[stage]}</b>
        <span className={s.pips} aria-hidden="true">{[1, 2, 3].map((p) => <i key={p} className={cx(p <= sub && s.pipOn)} />)}<span className="milo-text-caption">{sub} / 3 级</span></span>
      </div>
    </div>
  );
}

/** 成长条：离下一级还差多少，用能照着做的说法（「深蹲预估 1RM 再涨 2.5 kg」「或再完成 1 个周期」），不用抽象经验值 */
export function GrowthBar({ stage, sub, progress, lift, cycles }: { stage: MascotStage; sub: 1 | 2 | 3; progress: number; lift?: { name: string; kg: number } | null; cycles?: number }) {
  const max = stage === 'milo' && sub === 3;
  const nextStage = sub === 3 ? STAGES[STAGES.indexOf(stage) + 1] : stage, nextSub = sub === 3 ? 1 : sub + 1;
  const near = !max && progress >= 0.85;
  return (
    <div className={cx(s.growth, near && s.near, max && s.max)}>
      <div className={s.growthHead}>
        <span className="milo-text-label">{STAGE_NAME[stage]} {sub} 级</span>
        <span className={cx('milo-text-caption', s.muted)}>{max ? '满级' : `→ ${STAGE_NAME[nextStage]} ${nextSub} 级${sub === 3 ? ' · 升段' : ''}`}</span>
      </div>
      <div className={s.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((max ? 1 : progress) * 100)} aria-label="离下一级的进度">
        <span className={s.fill} style={{ '--p': max ? 1 : progress } as CSSProperties} />
      </div>
      <p className={cx('milo-text-caption', s.hint)}>
        {max ? 'Milo 满级。接下来比的只有昨天的自己。'
          : <>{lift ? <>{lift.name}预估 1RM 再涨 <b>{lift.kg} kg</b></> : '再创一次纪录'}{cycles ? <>，或再完成 <b>{cycles} 个周期</b></> : null}{near ? ' · 快到了' : ''}</>}
      </p>
    </div>
  );
}

/* ---------------- 连胜 ---------------- */

export type StreakStatus = 'zero' | 'open' | 'kept' | 'risk' | 'frozen' | 'deload' | 'milestone';
const STREAK_LINE: Record<StreakStatus, string> = {
  zero: '完成这周的训练，连胜从 1 开始',
  open: '这周还在进行，按处方练够就守约',
  kept: '这周已守约',
  risk: '这周快断了：剩下的天数不够练完',
  frozen: '上周没练够，已自动用掉 1 张冻结卡，连胜保住',
  deload: '减量周：少练一次也算守约',
  milestone: '里程碑周！',
};
/** 连胜条：连胜周数 + 本周进度（已练 / 目标次数）+ 状态说明；只按「周」算，不做每日打卡 */
export function StreakBar({ weeks, done, target, status, freeze = 0 }: { weeks: number; done: number; target: number; status: StreakStatus; freeze?: number }) {
  return (
    <div className={cx(s.streak, s[`st_${status}`])}>
      <div className={s.streakNum}><b className="milo-text-number-xl">{weeks}</b><span className="milo-text-label">周连胜</span></div>
      <div className={s.streakBody}>
        <div className={s.week} aria-label={`本周已练 ${done} / ${target} 次`}>
          {Array.from({ length: target }, (_, i) => <i key={i} className={cx(i < done && s.on)} />)}
          <span className={cx('milo-text-readout-m', s.muted)}>{done} / {target}</span>
        </div>
        <p className={cx('milo-text-caption', s.streakLine)}>
          {status === 'risk' && <Icon name="alert" small />}{STREAK_LINE[status]}{status === 'milestone' ? ` 连胜 ${weeks} 周` : ''}
          {freeze > 0 && status !== 'frozen' && <span className={s.muted}> · 冻结卡 ×{freeze}</span>}
        </p>
      </div>
    </div>
  );
}

/** 冻结卡：有卡（断档时周一自动用）/ 没卡（去兑换或开会员）/ 刚自动用了一张 */
export function FreezeCard({ count, state, cost, onRedeem }: { count: number; state: 'have' | 'none' | 'used'; cost: number; onRedeem?: () => void }) {
  return (
    <div className={cx(s.freeze, state === 'used' && s.freezeUsed)}>
      <span className={s.ice} aria-hidden="true"><i /></span>
      <div className={s.freezeText}>
        <b className="milo-text-body-strong">{state === 'used' ? '冻结卡已自动使用' : `连胜冻结卡 ×${count}`}</b>
        <span className="milo-text-caption">{state === 'have' ? '生病、出差时保住连胜：断档那周的周一自动用一张' : state === 'none' ? `${cost} 牛劲兑换一张，或开通 Pro 每月送 2 张` : `上周没练够，连胜保住了。还剩 ${count} 张`}</span>
      </div>
      {state === 'none' && <Button kind="neutral" size="s" onClick={onRedeem}>兑换</Button>}
    </div>
  );
}

/* ---------------- 牛劲与卡券 ---------------- */

/** 牛劲余额：大号码表 + 本月进账；会员显示 ×1.5 */
export function NiujinBalance({ balance, month, pro }: { balance: number; month: number; pro?: boolean }) {
  return (
    <div className={s.balance}>
      <span className={cx('milo-text-label', s.muted)}>牛劲余额</span>
      <div className={s.balanceNum}><Odometer value={String(balance)} size="xl" />{pro && <span className={s.pro}>Pro ×1.5</span>}</div>
      <span className="milo-text-caption">本月 <b className={s.plus}>+{month}</b> · 100 牛劲抵 1 元，单笔最多抵 20%</span>
    </div>
  );
}

/** 牛劲流水一行：获得（荧光 +）/ 花出（骨白 −）/ 会员加成标注 */
export function LedgerRow({ label, amount, date, pro }: { label: string; amount: number; date: string; pro?: boolean }) {
  return (
    <div className={s.ledger}>
      <span className={s.ledgerText}><span className="milo-text-body">{label}</span><span className={cx('milo-text-caption', s.muted)}>{date}{pro ? ' · 会员 ×1.5' : ''}</span></span>
      <b className={cx('milo-text-number-m', amount >= 0 ? s.plus : s.minus)}>{amount >= 0 ? '+' : '−'}{Math.abs(amount)}</b>
    </div>
  );
}

const COUPON_MARK: Record<'merchant' | 'shipping' | 'trial' | 'freeze', string> = { merchant: '¥30', shipping: '免邮', trial: '7天', freeze: '冻结' };
/** 卡券：票根造型（两侧缺口 + 虚线）。可用 / 已用 / 过期；兑换态显示所需牛劲，余额不够时按钮不可用并写明还差多少 */
export function Coupon({ type, title, detail, state, cost, balance, onRedeem }: {
  type: 'merchant' | 'shipping' | 'trial' | 'freeze'; title: string; detail: string; state: 'redeem' | 'available' | 'used' | 'expired'; cost?: number; balance?: number; onRedeem?: () => void;
}) {
  const short = state === 'redeem' && cost != null && balance != null && balance < cost;
  return (
    <div className={cx(s.coupon, s[`cp_${state}`])}>
      <span className={s.stub}><b className="milo-text-heading">{COUPON_MARK[type]}</b></span>
      <span className={s.couponBody}>
        <b className="milo-text-body-strong">{title}</b>
        <span className="milo-text-caption">{detail}</span>
        {state === 'redeem' && <span className={cx('milo-text-caption', short ? s.muted : s.plus)}>{cost} 牛劲{short ? ` · 还差 ${cost! - balance!}` : ''}</span>}
      </span>
      {state === 'redeem' && <Button kind="neutral" size="s" disabled={short} onClick={onRedeem}>兑换</Button>}
      {state !== 'redeem' && <span className={cx('milo-text-label', s.couponState)}>{state === 'available' ? '可用' : state === 'used' ? '已用' : '已过期'}</span>}
    </div>
  );
}

/* ---------------- 商城 ---------------- */

/** 情境知识卡：tip = 身体页 / 增量页里的一行提示（一屏最多一条，可关闭、可「不再提示这一类」）；header = 知识卡详情页头 */
export function KnowledgeTip({ title, why, when, how, supplement, variant, onOpen, onDismiss, onMute }: {
  title: string; why: string; when?: string; how?: string[]; supplement?: boolean; variant: 'tip' | 'header'; onOpen?: () => void; onDismiss?: () => void; onMute?: () => void;
}) {
  if (variant === 'tip') return (
    <div className={s.tip}>
      <button type="button" className={cx(s.tipMain, 'milo-press milo-focus')} onClick={onOpen}>
        <span className={s.tipMark} aria-hidden="true">i</span>
        <span className={s.tipText}><span className={cx('milo-text-caption', s.muted)}>{why}</span><b className="milo-text-body-strong">{title}</b></span>
        <Icon name="chevron" small />
      </button>
      <div className={s.tipActions}>
        <button type="button" className={cx(s.link, 'milo-text-caption milo-focus')} onClick={onMute}>不再提示这一类</button>
        <button type="button" className={cx(s.close, 'milo-focus')} aria-label="关闭提示" onClick={onDismiss}><Icon name="close" small /></button>
      </div>
    </div>
  );
  return (
    <header className={s.kHead}>
      <span className={cx('milo-text-label', s.plus)}>知识卡 · 为什么现在给你看</span>
      <h2 className="milo-text-title-m">{title}</h2>
      <p className={cx('milo-text-body', s.muted)}>{why}。适合：{when}。</p>
      {how && <ol className={s.how}>{how.map((h, i) => <li key={i} className="milo-text-body"><b className="milo-text-number-s">{i + 1}</b>{h}</li>)}</ol>}
      <p className={cx('milo-text-micro', s.muted)}>{supplement ? '补剂说明不构成医疗建议，有基础疾病请先咨询医生。' : '护具只辅助，不代替力量与动作质量。'}</p>
    </header>
  );
}

/** 商品卡：普通 / 会员价 / 牛劲抵扣 / 已下架。商品图用几何品类图标代替（不放真实商品图） */
export function ProductCard({ name, merchant, spec, price, member, category, state, off, onClick }: {
  name: string; merchant: string; spec: string; price: number; member: number; category: '护具' | '补给'; state: 'normal' | 'member' | 'niujin' | 'off'; off?: number; onClick?: () => void;
}) {
  const final = state === 'member' ? member : state === 'niujin' ? price - (off ?? 0) : price;
  return (
    <button type="button" className={cx(s.product, state === 'off' && s.productOff, 'milo-press milo-focus')} onClick={onClick} disabled={state === 'off'}>
      <span className={cx(s.pic, category === '补给' ? s.picSupp : s.picGear)} aria-hidden="true"><i /></span>
      <span className={s.productText}>
        <span className={cx('milo-text-caption', s.muted)}>{merchant} · {category}</span>
        <b className="milo-text-body-strong">{name}</b>
        <span className={cx('milo-text-caption', s.muted)}>{spec}</span>
        <span className={s.priceRow}>
          {state === 'off' ? <span className="milo-text-label">已下架</span> : <>
            <b className="milo-text-number-m">¥{final}</b>
            {state !== 'normal' && <s className={cx('milo-text-caption', s.muted)}>¥{price}</s>}
            {state === 'member' && <span className={s.pro}>Pro 价</span>}
            {state === 'niujin' && <span className={s.chip}>牛劲抵 ¥{off}</span>}
          </>}
        </span>
      </span>
    </button>
  );
}

/* ---------------- 会员 ---------------- */

/** Pro 标记：locked = 高级分析处的入口标记；active = 已开通 */
export function ProBadge({ state }: { state: 'locked' | 'active' }) {
  return <span className={cx(s.proBadge, state === 'active' && s.proActive)}>{state === 'active' ? <Icon name="check" small /> : null}Pro</span>;
}

const PERKS: [string, string, string][] = [
  ['处方、记录、身体页、增量页', '✓', '✓'], ['周期计划自动编排（减量周自动插入）', '—', '✓'], ['高级分析：肌群容量趋势、动作对比', '—', '✓'],
  ['牛劲', '×1', '×1.5'], ['连胜冻结卡', '兑换', '每月 2 张'], ['商城会员价、免邮券', '—', '✓'], ['数据导出', '—', '✓'],
];
const PLANS: Record<'month' | 'year' | 'trial', [string, string, string]> = { month: ['月度', '¥18', '/ 月'], year: ['年度', '¥128', '/ 年 · 约 ¥10.7 / 月'], trial: ['试用', '7 天', '到期前提醒，不自动扣费'] };

/** 付费墙：免费 vs Pro 对比 + 方案（月度 / 年度 / 试用 7 天）；会员态显示到期与管理；success = 开通成功（Milo 庆祝）。全程标「演示模式」，支付走假成功 */
export function Paywall({ plan, member, success, onPlan, onBuy }: { plan: 'month' | 'year' | 'trial'; member?: boolean; success?: boolean; onPlan?: (p: 'month' | 'year' | 'trial') => void; onBuy?: () => void }) {
  if (success) return (
    <div className={cx(s.paywall, s.paySuccess)}>
      <span className={s.demo}>演示模式</span>
      <div className={s.payHero}><Mascot stage="milo" mood="pr" animate /></div>
      <h2 className="milo-text-title-m">欢迎加入 Milo Pro</h2>
      <p className={cx('milo-text-body', s.muted)}>全部权益已解锁。牛劲 ×1.5 从下一次训练开始算，本月 2 张冻结卡已放进钱包。</p>
      <div className={s.payCta}><Button kind="primary" glow onClick={onBuy}>开始用</Button></div>
    </div>
  );
  return (
    <div className={s.paywall}>
      <span className={s.demo}>演示模式</span>
      <header className={s.payHead}><span className={cx('milo-text-label', s.plus)}>Milo Pro</span><h2 className="milo-text-title-m">{member ? '你是 Pro 会员' : '练得更聪明一点'}</h2>
        {member && <p className={cx('milo-text-caption', s.muted)}>年度会员 · 2027 年 10 月 5 日到期 · 本月冻结卡已领 2 张</p>}</header>
      <div className={s.perks} role="table" aria-label="免费与 Pro 对比">
        <div className={cx(s.perkRow, s.perkHead)} role="row"><span role="columnheader" /><span role="columnheader" className="milo-text-micro">免费</span><span role="columnheader" className={cx('milo-text-micro', s.plus)}>Pro</span></div>
        {PERKS.map(([k, f, p]) => <div key={k} className={s.perkRow} role="row"><span role="cell" className="milo-text-caption">{k}</span><span role="cell" className={cx('milo-text-caption', s.muted)}>{f}</span><span role="cell" className={cx('milo-text-caption', s.plus)}>{p}</span></div>)}
      </div>
      {!member && <>
        <div className={s.plans} role="radiogroup" aria-label="选择方案">
          {(['month', 'year', 'trial'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={plan === k} className={cx(s.plan, plan === k && s.planOn, 'milo-press milo-focus')} onClick={() => onPlan?.(k)}>
              {k === 'year' && <span className={s.save}>省 40%</span>}
              <span className="milo-text-label">{PLANS[k][0]}</span><b className="milo-text-number-m">{PLANS[k][1]}</b><span className={cx('milo-text-micro', s.muted)}>{PLANS[k][2]}</span>
            </button>
          ))}
        </div>
        <div className={s.payCta}><Button kind="primary" glow onClick={onBuy}>{plan === 'trial' ? '开始 7 天试用' : '开通（演示，不扣费）'}</Button></div>
      </>}
      {member && <div className={s.payCta}><Button kind="ghost" onClick={onBuy}>管理订阅</Button></div>}
    </div>
  );
}

/* ---------------- 消息 ---------------- */

/** 「我的」→ 消息里的一行：合并的奖励 / 冻结卡已自动使用 / 降级说明（删除训练后重算） */
export function MessageRow({ kind, title, detail, date, unread }: { kind: 'reward' | 'freeze' | 'demote'; title: string; detail: string; date: string; unread?: boolean }) {
  const mark: ReactNode = kind === 'reward' ? <Icon name="star" small /> : kind === 'freeze' ? <span className={s.iceS} /> : <Icon name="down" small />;
  return (
    <div className={cx(s.msg, s[`msg_${kind}`])}>
      <span className={s.msgMark} aria-hidden="true">{mark}</span>
      <span className={s.msgText}><b className="milo-text-body-strong">{title}</b><span className={cx('milo-text-caption', s.muted)}>{detail}</span></span>
      <span className={s.msgSide}><span className={cx('milo-text-micro', s.muted)}>{date}</span>{unread && <i className={s.unread} aria-label="未读" />}</span>
    </div>
  );
}
