/** 增长层组件（阶段 5.5c，brief「增长与商业化层」，ia §1.14–§1.17）。
 *  品牌位置（牛龄徽章、付费墙、开通成功）放 IP 小牛，功能位置（连胜、流水、卡券、商品）不放，遵守「语气分工」。
 *  数字全部由调用方从引擎（growth.ts）算好传进来；这里只管怎么显示和各个状态。 */
import { type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { Odometer } from './dataviz';
import { Mascot, MascotHead, STAGE_NAME, type MascotStage } from './Mascot';
import { PropGlyph, type PropKind } from './PropGlyph';
import { cx, forced, type Forced } from './state';
import { Ticks } from './Ticks';
import { Num } from './ui';
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
export function GrowthBar({ stage, sub, progress, lift, cycles, hint, bare }: {
  stage: MascotStage; sub: 1 | 2 | 3; progress: number; lift?: { name: string; kg: number } | null; cycles?: number;
  /** 自己写那句话（没有历史、涨幅太大等引擎反推不出可行动的说法时） */
  hint?: ReactNode;
  /** 牛龄页：上面的页头已经写了「段名 · 小级」，这里不再重复，只写「离下一级」和下一级是什么 */
  bare?: boolean;
}) {
  const max = stage === 'milo' && sub === 3;
  const nextStage = sub === 3 ? STAGES[STAGES.indexOf(stage) + 1] : stage, nextSub = sub === 3 ? 1 : sub + 1;
  const near = !max && progress >= 0.85;
  return (
    <div className={cx(s.growth, near && s.near, max && s.max)}>
      <div className={s.growthHead}>
        <span className="milo-text-label">{bare ? '离下一级' : `${STAGE_NAME[stage]} ${sub} 级`}</span>
        <span className={cx('milo-text-caption', s.muted)}>{max ? '满级' : `→ ${STAGE_NAME[nextStage]} ${nextSub} 级${sub === 3 ? ' · 升段' : ''}`}</span>
      </div>
      <div className={s.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((max ? 1 : progress) * 100)} aria-label="离下一级的进度">
        <span className={s.fill} style={{ '--p': max ? 1 : progress } as CSSProperties} />
      </div>
      <p className={cx('milo-text-caption', s.hint)}>
        {hint ?? (max ? 'Milo 满级。接下来比的只有昨天的自己。'
          : <>{lift ? <>{lift.name}预估 1RM 再涨 <b>{lift.kg} kg</b>{cycles ? <>，或再完成 <b>{cycles} 个周期</b></> : null}</> : cycles ? <>再完成 <b>{cycles} 个训练周期</b></> : '再创一次纪录'}{near ? ' · 快到了' : ''}</>)}
      </p>
    </div>
  );
}

/** 「我的」第一屏的成长卡（主角）：小牛头像 + 牛龄 + 离下一级的进度条与一句能照着做的话；下面三个数：连胜周数、本周进度、牛劲。
 *  整张卡是按钮，点进牛龄页；卡的右上角有淡淡的配重片同心槽纹（品牌语言，只放这一处）。进度条是这一屏唯一的荧光。 */
export function GrowthCard({ stage, sub, progress, hint, streak, done, target, niujin, onClick, state }: {
  stage: MascotStage; sub: 1 | 2 | 3; progress: number; hint: ReactNode; streak: number; done: number; target: number; niujin: string; onClick?: () => void; state?: Forced;
}) {
  const body = (
    <>
      <span className={s.gcTop}>
        <span className={s.gcHead}><MascotHead stage={stage} className={s.badgeHeadImg} /></span>
        <span className={s.gcWho}>
          <b className="milo-text-title-m">{STAGE_NAME[stage]} · {sub} 级</b>
          <span className={s.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="离下一级的进度"><span className={s.fill} style={{ '--p': progress } as CSSProperties} /></span>
          <span className={cx('milo-text-caption', s.hint)}>{hint}</span>
        </span>
        {onClick && <Icon name="chevron" small />}
      </span>
      <Ticks />
      <span className={s.gcStats}>
        <span className={s.gcStat}><Num size="l" value={streak} unit="周" /><i className="milo-text-caption">连胜</i></span>
        <span className={s.gcStat}><Num size="l" value={`${done} / ${target}`} unit="次" /><i className="milo-text-caption">本周</i></span>
        <span className={s.gcStat}><Num size="l" value={niujin} /><i className="milo-text-caption">牛劲</i></span>
      </span>
    </>
  );
  const label = `牛龄 ${STAGE_NAME[stage]} ${sub} 级，连胜 ${streak} 周，本周已练 ${done} / ${target} 次，牛劲 ${niujin}`;
  if (!onClick) return <section className={s.gcard} aria-label={label}>{body}</section>;
  return <button type="button" className={cx('milo-press milo-focus', s.gcard, s.gcardBtn)} onClick={onClick} aria-label={`${label}，查看牛龄`} {...forced(state)}>{body}</button>;
}

/** 牛龄页头：顶上一行 5 段名字（当前这一段加下划线，一眼看到「现在在哪、还有几段」），小牛站在一圈圈配重片同心环里，下面是大号「段名 · 小级」。 */
export function StageHero({ stage, sub, mood = 'idle' }: { stage: MascotStage; sub: 1 | 2 | 3; mood?: 'idle' | 'happy' | 'rest' | 'deload' }) {
  return (
    <div className={s.hero}>
      <ol className={s.stages} aria-label="牛龄五段">
        {STAGES.map((st) => <li key={st} className={cx('milo-text-label', st === stage && s.stageNow)} aria-current={st === stage ? 'step' : undefined}>{STAGE_NAME[st]}</li>)}
      </ol>
      <div className={s.stageArea}>
        <i className={s.rings} aria-hidden="true" />
        <Mascot stage={stage} mood={mood} animate title={`${STAGE_NAME[stage]}`} />
      </div>
      <b className="milo-text-title-l">{STAGE_NAME[stage]} · {sub} 级</b>
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

/** 连胜快断的一行（6g 补，线框 ?board=proentry W3 / W4，Stitch risk V1）：引擎判「快断」（这周还差的次数 > 剩下的天数）时，牛龄页三格下面出现。
 *  按手上有没有冻结卡、是不是会员给出口——有卡：只说结果，不放按钮；没卡 · 免费：描边「兑一张冻结卡」+ 文字链「Pro 每月送 2 张」；没卡 · 会员（本月 2 张已用完）：只给「兑一张」。
 *  「!」标 + 深灰底，不用危险红（不是错误），不用荧光；按钮与文字链的命中区各 ≥ 48、互不重叠。 */
export function StreakRisk({ need, daysLeft, freeze, pro, cost, onRedeem, onPro, state }: {
  need: number; daysLeft: number; freeze: number; pro: boolean; cost: number; onRedeem?: () => void; onPro?: () => void; state?: Forced;
}) {
  const line = freeze > 0 ? `有 ${freeze} 张冻结卡：这周没练够会自动用掉一张，连胜保住。`
    : pro ? '这个月 Pro 送的 2 张已经用了。没练够的那周会断。' : '断了连胜从 0 开始。冻结卡会在没练够的那周自动用掉一张。';
  return (
    <section className={s.risk} aria-label="连胜快断了">
      <div className={s.riskHead}><span className={s.riskMark} aria-hidden="true">!</span><b className="milo-text-body-strong">这周快断了：还差 {need} 次，只剩 {daysLeft} 天</b></div>
      <p className={cx('milo-text-caption', s.muted, s.riskLine)}>{line}</p>
      {freeze === 0 && <div className={s.riskActs}>
        <Button kind="ghost" onClick={onRedeem} state={state}>兑一张冻结卡 · {cost.toLocaleString('en-US')} 牛劲</Button>
        {!pro && <button type="button" className={cx('milo-text-caption milo-focus', s.riskLink)} onClick={onPro}>Pro 每月送 2 张<Icon name="chevron" small /></button>}
      </div>}
    </section>
  );
}

/** 最近若干周的守约状态点阵（牛龄页）：实心骨白 = 守约，暗 = 减量周（按计划减量也算守约），斜纹 = 冻结卡抵掉，虚线 = 没守约，粗框 = 本周；下面一行图例。
 *  不只靠颜色：每种状态的形状 / 纹理都不同；整条是一张图，读屏读汇总。 */
export type StreakWeekStatus = 'kept' | 'deload' | 'frozen' | 'missed' | 'open';
const WEEK_LEGEND: [StreakWeekStatus, string][] = [['kept', '守约'], ['deload', '减量周'], ['frozen', '冻结卡'], ['missed', '没守约'], ['open', '本周']];
export function StreakWeeks({ weeks }: { weeks: StreakWeekStatus[] }) {
  const n = (k: StreakWeekStatus) => weeks.filter((w) => w === k).length;
  return (
    <div className={s.weeksBox}>
      <div className={s.weeks} role="img" style={{ '--n': Math.max(12, weeks.length) } as CSSProperties}
        aria-label={`最近 ${weeks.length} 周：守约 ${n('kept')} 周，减量周 ${n('deload')} 周，冻结卡抵掉 ${n('frozen')} 周，没守约 ${n('missed')} 周`}>
        {weeks.map((w, i) => <i key={i} className={cx(s.wk, s[`wk_${w}`])} />)}
      </div>
      <ul className={s.legend} aria-hidden="true">{WEEK_LEGEND.map(([k, t]) => <li key={k} className="milo-text-caption"><i className={cx(s.wk, s.wkS, s[`wk_${k}`])} />{t}</li>)}</ul>
    </div>
  );
}

/** 冻结卡：有卡（断档时周一自动用）/ 没卡（去兑换或开会员）/ 刚自动用了一张 */
export function FreezeCard({ count, state, cost, onRedeem }: { count: number; state: 'have' | 'none' | 'used'; cost: number; onRedeem?: () => void }) {
  return (
    <div className={cx(s.freeze, state === 'used' && s.freezeUsed)}>
      <PropGlyph kind="freeze" used={state === 'used'} dim={state === 'none'} className={s.ice} />
      <div className={s.freezeText}>
        <b className="milo-text-body-strong">{state === 'used' ? '冻结卡已自动使用' : `连胜冻结卡 ×${count}`}</b>
        <span className="milo-text-caption">{state === 'have' ? '生病、出差时保住连胜：断档那周的周一自动用一张' : state === 'none' ? `${cost} 牛劲兑换一张，或开通 Pro 每月送 2 张` : `上周没练够，连胜保住了。还剩 ${count} 张`}</span>
      </div>
      {state === 'none' && <Button kind="neutral" size="s" onClick={onRedeem}>兑换</Button>}
    </div>
  );
}

/* ---------------- 牛劲与卡券 ---------------- */

/** 牛劲余额（钱包 V1 的大数 + ≈¥，V2 的刻度尺分隔）：大号码表 + 约合多少元 + 本月进账；会员显示 ×1.5 */
export function NiujinBalance({ balance, month, pro }: { balance: number; month: number; pro?: boolean }) {
  return (
    <div className={s.balance}>
      <span className={s.balanceHead}><span className={cx('milo-text-label', s.muted)}>牛劲余额</span><span className={cx('milo-text-number-s', s.muted)}>≈ ¥{Math.floor(balance / 100).toLocaleString('en-US')}</span></span>
      <div className={s.balanceNum}><Odometer value={balance.toLocaleString('en-US')} size="xl" />{pro && <span className={s.pro}>Pro ×1.5</span>}</div>
      <Ticks />
      <span className="milo-text-caption">本月 <b className={s.plus}>+{month}</b> · 100 牛劲抵 1 元，单笔最多抵 20%</span>
    </div>
  );
}

/** 牛劲流水一行：获得（荧光 +）/ 花出（骨白 −）/ 会员加成标注；plain = 获得也用骨白（一屏有很多行时，荧光只留给一处焦点，如牛龄页的成长记录） */
export function LedgerRow({ label, amount, date, pro, detail, plain }: { label: string; amount: number; date: string; pro?: boolean; detail?: string; plain?: boolean }) {
  return (
    <div className={s.ledger}>
      <span className={s.ledgerText}><span className="milo-text-body">{label}</span><span className={cx('milo-text-caption', s.muted)}>{date}{detail ? ` · ${detail}` : ''}{pro ? ' · 会员 ×1.5' : ''}</span></span>
      <b className={cx('milo-text-number-m', amount >= 0 && !plain ? s.plus : s.minus)}>{amount >= 0 ? '+' : '−'}{Math.abs(amount)}</b>
    </div>
  );
}

const COUPON_MARK: Record<'merchant' | 'shipping' | 'trial' | 'freeze', string> = { merchant: '¥30', shipping: '免邮', trial: '7天', freeze: '冻结' };
const COUPON_PROP: Record<'merchant' | 'shipping' | 'trial' | 'freeze', PropKind> = { merchant: 'merchant', shipping: 'shipping', trial: 'trial', freeze: 'freeze' };
/** 卡券：票根造型（两侧缺口 + 虚线）。可用 / 已用 / 过期；兑换态显示所需牛劲，余额不够时按钮不可用并写明还差多少 */
/** onUse：可用的券点「去用」（钱包 → 商城）；冻结卡这类自动使用的不给 onUse，只写「可用」 */
export function Coupon({ type, title, detail, state, cost, balance, onRedeem, onUse }: {
  type: 'merchant' | 'shipping' | 'trial' | 'freeze'; title: string; detail: string; state: 'redeem' | 'available' | 'used' | 'expired'; cost?: number; balance?: number; onRedeem?: () => void; onUse?: () => void;
}) {
  const short = state === 'redeem' && cost != null && balance != null && balance < cost;
  return (
    <div className={cx(s.coupon, s[`cp_${state}`])}>
      <span className={s.stub}><PropGlyph kind={COUPON_PROP[type]} dim={state === 'used' || state === 'expired'} className={s.stubGlyph} /><b className="milo-text-label">{COUPON_MARK[type]}</b></span>
      <span className={s.couponBody}>
        <b className="milo-text-body-strong">{title}</b>
        <span className="milo-text-caption">{detail}</span>
        {state === 'redeem' && <span className={cx('milo-text-caption', short ? s.muted : s.plus)}>{cost} 牛劲{short ? ` · 还差 ${cost! - balance!}` : ''}</span>}
      </span>
      {state === 'redeem' && <Button kind="neutral" size="s" disabled={short} onClick={onRedeem}>兑换</Button>}
      {state === 'available' && onUse && <button type="button" className={cx('milo-text-label milo-focus', s.couponUse)} onClick={onUse}>去用<Icon name="chevron" small /></button>}
      {state !== 'redeem' && !(state === 'available' && onUse) && <span className={cx('milo-text-label', s.couponState)}>{state === 'available' ? '可用' : state === 'used' ? '已用' : '已过期'}</span>}
    </div>
  );
}

/* ---------------- 商城 ---------------- */

/** 情境知识卡：tip = 容量页 / 增量页摘要下面的一条细横幅（线框 ?board=tips W1 + W3，用户 2026-10-07 选）——点主体进知识卡，✕ 这次收起；
 *  一屏最多一条；「不再提示这一类」放在知识卡页底（不在横幅上挤第三个命中区）；不用荧光（荧光留给页面唯一焦点）。header = 知识卡详情页头 */
export function KnowledgeTip({ title, why, when, how, supplement, variant, onOpen, onDismiss, state }: {
  title: string; why: string; when?: string; how?: string[]; supplement?: boolean; variant: 'tip' | 'header'; onOpen?: () => void; onDismiss?: () => void; state?: Forced;
}) {
  if (variant === 'tip') return (
    <div className={s.tip}>
      <button type="button" className={cx(s.tipMain, 'milo-press milo-focus')} onClick={onOpen} {...forced(state)}>
        <span className={s.tipMark} aria-hidden="true">i</span>
        <span className={s.tipText}><span className={cx('milo-text-caption', s.muted)}>{why}</span><b className="milo-text-body-strong">{title}</b></span>
        <Icon name="chevron" small />
      </button>
      <button type="button" className={cx(s.close, 'milo-focus')} aria-label="收起这条提示" onClick={onDismiss}><Icon name="close" small /></button>
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

/* ---------------- 会员 ---------------- */

/** Pro 标记：locked = 高级分析处的入口标记；active = 已开通 */
export function ProBadge({ state }: { state: 'locked' | 'active' }) {
  return <span className={cx(s.proBadge, state === 'active' && s.proActive)}>{state === 'active' ? <Icon name="check" small /> : null}Pro</span>;
}

const PERKS: [string, string, string][] = [
  ['处方、记录、容量页、增量页', '✓', '✓'], ['周期计划自动编排（减量周自动插入）', '—', '✓'], ['高级分析：肌群容量趋势、动作对比', '—', '✓'],
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

/** 「我的」→ 消息里的一行：合并的奖励 / 冻结卡已自动使用 / 降级说明（删除训练后重算）/ 到货提醒（6f，商家图标）；奖励的图标只有未读时是荧光，读过的变回中性（一屏很多条时不会满屏荧光） */
/** amount：这一条入账多少牛劲——单独一列右对齐的大数字（2026-10-06 审美调整：别埋在小字里，一眼扫得到） */
export function MessageRow({ kind, title, detail, date, unread, amount }: { kind: 'reward' | 'freeze' | 'demote' | 'restock'; title: string; detail: string; date: string; unread?: boolean; amount?: number }) {
  const mark: ReactNode = kind === 'reward' ? <Icon name="star" small /> : kind === 'freeze' ? <PropGlyph kind="freeze" className={s.iceS} /> : kind === 'restock' ? <PropGlyph kind="merchant" className={s.iceS} /> : <Icon name="down" small />;
  return (
    <div className={cx(s.msg, s[`msg_${kind}`], unread && s.msgUnread)}>
      <span className={s.msgMark} aria-hidden="true">{mark}</span>
      <span className={s.msgText}><b className="milo-text-body-strong">{title}</b><span className={cx('milo-text-caption', s.muted)}>{detail}</span></span>
      <span className={s.msgSide}>
        {amount != null && amount > 0 && <span className={s.msgAmt}><b className="milo-text-number-m">+{amount.toLocaleString('en-US')}</b><i>牛劲</i></span>}
        <span className={cx('milo-text-micro', s.muted)}>{date}{unread && <i className={s.unread} aria-label="未读" />}</span>
      </span>
    </div>
  );
}
