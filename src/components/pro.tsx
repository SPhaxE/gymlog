/** 会员组件（6g，ia §1.17；线框 ?board=pro W2 + W3、?board=prohub W1；Stitch 取舍见 docs/brief.md 2026-10-07）。
 *  三页统一「一张卡 + 刻度尺分隔」（同 6f 钱包）：
 *  - PerkLedger：付费墙 V2 的单卡权益账单（数在上、理由在下，不折行）；也做会员中心的权益入口（行可点、带 ›）和开通成功「刚到手的」（左右一行）。
 *  - PlanPicker：付费墙 V1 的一行分段（骨白滑块按软弹簧滑到选中项，M02 的尺寸弹簧），「省 40%」骨白小标挂在年度上方。
 *  - ProCard：会员中心 V2 的会员卡 + V1 卡上的刻度尺改成「有效期走到哪了」：走过的刻度骨白、没走的暗，荧光刻度 = 今天（这一屏唯一的荧光）。
 *  - MonthStats：「这个月 Pro 给了你」三格，数在上（码表）、名称在下。
 *  - ProWelcome：开通成功的品牌时刻——小牛站在配重片同心环里，三道环纹从脚下荡开一次，再依次弹出标题和明细。
 *  荧光只给每屏唯一焦点；所有入场在「减少动态效果」时直接定格。数字全部由调用方算好传入（data/pro.ts）。 */
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import { Mascot, type MascotStage } from './Mascot';
import { Odometer } from './dataviz';
import { cx, forced, type Forced } from './state';
import s from './pro.module.css';

const at = (i: number) => ({ '--d': i }) as CSSProperties;

export interface PerkItem { value: string; unit?: string; reason: string; onClick?: () => void }
/** 权益账单。value = 付费墙（大数 + 单位 / 理由）；link = 会员中心权益入口（名称 / 说明 + ›，整行 ≥ 48 可点）；pair = 开通成功（左名右注，一行）。
 *  入场：行按 M07 交错弹入，行间刻度尺跟着从左往右画出来 */
export function PerkLedger({ items, kind = 'value', label, state }: { items: PerkItem[]; kind?: 'value' | 'link' | 'pair'; label: string; state?: Forced }) {
  return (
    <div className={cx(s.ledger, s[`ledger_${kind}`])} role="list" aria-label={label}>
      {items.map((it, i) => {
        const body = kind === 'pair'
          ? <><b className={cx('milo-text-body-strong', s.pairKey)}>{it.value}{it.unit && <span className={cx('milo-text-number-m', s.pairUnit)}>{it.unit}</span>}</b><span className={cx('milo-text-caption', s.muted)}>{it.reason}</span></>
          : kind === 'link'
            ? <><span className={s.linkText}><b className="milo-text-body-strong">{it.value}</b><span className={cx('milo-text-caption', s.muted)}>{it.reason}</span></span><Icon name="chevron" small /></>
            : <><span className={s.valueLine}><b className={/^[+¥\d]/.test(it.value) ? 'milo-text-number-l' : cx('milo-text-title-m', s.word)}>{it.value}</b>{it.unit && <span className={cx('milo-text-body-strong', s.unit)}>{it.unit}</span>}</span><span className={cx('milo-text-caption', s.muted)}>{it.reason}</span></>;
        return (
          <div key={it.value + it.reason} role="listitem" className={s.item} style={at(i)}>
            {i > 0 && <i className={s.rule} aria-hidden="true" />}
            {it.onClick
              ? <button type="button" className={cx('milo-press milo-focus', s.row, s.rowBtn)} onClick={it.onClick} {...(i === 0 ? forced(state) : {})}>{body}</button>
              : <div className={s.row}>{body}</div>}
          </div>
        );
      })}
    </div>
  );
}

export interface PlanOption<V extends string> { id: V; name: string; price: string; tag?: string }
/** 方案分段：一行、整宽、每项 ≥ 48 高；骨白滑块按软弹簧滑到选中项（不是瞬移），方向键可切 */
export function PlanPicker<V extends string>({ plans, value, onChange, state }: { plans: PlanOption<V>[]; value: V; onChange?: (v: V) => void; state?: Forced }) {
  const idx = Math.max(0, plans.findIndex((p) => p.id === value));
  const move = (d: number) => onChange?.(plans[(idx + d + plans.length) % plans.length].id);
  return (
    <div className={s.plans} role="radiogroup" aria-label="选择方案" style={{ '--n': plans.length, '--i': idx } as CSSProperties}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      }}>
      <i className={s.thumb} aria-hidden="true" />
      {plans.map((p, i) => (
        <button key={p.id} type="button" role="radio" aria-checked={i === idx} tabIndex={i === idx ? 0 : -1} aria-label={`${p.name} ${p.price}${p.tag ? `，${p.tag}` : ''}`}
          className={cx('milo-focus', s.plan, i === idx && s.planOn)} onClick={() => onChange?.(p.id)} {...(i !== idx && i === (idx + 1) % plans.length ? forced(state) : {})}>
          {p.tag && <span className={cx('milo-text-micro', s.save)} aria-hidden="true">{p.tag}</span>}
          <span className="milo-text-caption">{p.name}</span><b className="milo-text-number-m">{p.price}</b>
        </button>
      ))}
    </div>
  );
}

/** 免费 vs Pro 完整对比（付费墙「看完整对比」展开；没有历史的新用户直接看它） */
export function PerkTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className={s.table} role="table" aria-label="免费与 Pro 对比">
      <div className={cx(s.tRow, s.tHead)} role="row"><span role="columnheader" /><span role="columnheader" className="milo-text-micro">免费</span><span role="columnheader" className="milo-text-micro">Pro</span></div>
      {rows.map(([k, f, p]) => (
        <div key={k} className={s.tRow} role="row"><span role="cell" className="milo-text-caption">{k}</span><span role="cell" className={cx('milo-text-caption', s.muted)}>{f}</span><b role="cell" className="milo-text-caption">{p}</b></div>
      ))}
    </div>
  );
}

const md = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1} 月 ${d.getDate()} 日`; };
const ymd = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
/** 会员卡：方案 + 状态标 + 到期；下面一把有效期刻度尺——走过的骨白、没走的暗，荧光刻度 = 今天，挂载时从开通那头滑到今天 */
export function ProCard({ plan, status, fromMs, toMs, now }: { plan: string; status: 'pro' | 'trial' | 'expired'; fromMs: number; toMs: number; now: number }) {
  const p = Math.min(1, Math.max(0, (now - fromMs) / (toMs - fromMs || 1)));
  const days = Math.max(0, Math.ceil((toMs - now) / 86_400_000));
  const tag = status === 'pro' ? '已开通' : status === 'trial' ? '试用中' : '已到期';
  const line = status === 'expired' ? `已于 ${md(toMs)}到期` : status === 'trial' ? `还剩 ${days} 天 · ${md(toMs)}到期，不自动扣费` : `${new Date(toMs).getFullYear()} 年 ${md(toMs)}到期 · 还剩 ${days} 天`;
  return (
    <section className={cx(s.card, status === 'expired' && s.cardOff)} aria-label={`Milo Pro ${plan}，${tag}，${line}`}>
      <div className={s.cardHead}>
        <b className={cx('milo-text-title-l', s.cardTitle)}>Milo Pro · {plan}</b>
        <span className={cx('milo-text-label', s.state, s[`state_${status}`])}>{tag}</span>
      </div>
      <p className={cx('milo-text-caption', s.muted, s.cardLine)}>{line}</p>
      <div className={s.ruler} style={{ '--p': p } as CSSProperties} aria-hidden="true">
        <span className={cx('milo-text-micro', s.todayLabel)}>{status !== 'expired' ? '今天' : ''}</span>
        <div className={s.span}><i className={s.spanDim} /><i className={s.spanLit} />{status !== 'expired' && <i className={s.today} />}</div>
        <div className={cx('milo-text-micro', s.spanEnds)}><span>开通 {ymd(fromMs)}</span><span>到期 {ymd(toMs)}</span></div>
      </div>
    </section>
  );
}

/** 「这个月 Pro 给了你」三格：数在上（码表滚动）、名称在下 */
export function MonthStats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className={s.stats}>
      {items.map((it, i) => (
        <div key={it.label} className={s.stat} style={at(i)}>
          <Odometer value={it.value} size="l" />
          <i className={s.statRule} aria-hidden="true" />
          <span className={cx('milo-text-caption', s.muted)}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/** 开通成功的品牌时刻：配重片同心环 + 三道环纹从小牛脚下荡开一次 + 小牛弹出；标题、到期日依次升起 */
export function ProWelcome({ stage, title, line, children }: { stage: MascotStage; title: string; line: string; children?: ReactNode }) {
  return (
    <div className={s.welcome}>
      <div className={s.stage}>
        <i className={s.grooves} aria-hidden="true" />
        <i className={s.wave} style={at(0)} aria-hidden="true" /><i className={s.wave} style={at(1)} aria-hidden="true" /><i className={s.wave} style={at(2)} aria-hidden="true" />
        <span className={s.pop}><Mascot stage={stage} mood="happy" animate title="开心的小牛" /></span>
      </div>
      <h2 className={cx('milo-text-title-l', s.wTitle)}>{title}</h2>
      <p className={cx('milo-text-caption', s.muted, s.wLine)}>{line}</p>
      {children && <div className={s.wMore}>{children}</div>}
    </div>
  );
}

/** 「Pro ›」小入口（6g 补，Stitch trend / compare V2）：挂在权益真内容的块标题旁（肌头面板「近 8 周」、曲线页「对比」）和商品详情的会员价旁。
 *  未开通 = 描边，进付费墙；已开通 = 骨白实底，进会员中心。不是主操作，不用荧光；视觉小、命中区外扩到 48 */
export function ProLink({ active, onClick, label, state }: { active?: boolean; onClick?: () => void; label?: string; state?: Forced }) {
  return (
    <button type="button" className={cx('milo-focus', s.proLink)} onClick={onClick} aria-label={label ?? (active ? '这是 Pro 的权益，已开通，查看会员中心' : '这是 Pro 的权益，看看 Pro')} {...forced(state)}>
      <span className={cx(s.proMark, active && s.proMarkOn)}>Pro</span><Icon name="chevron" small />
    </button>
  );
}
