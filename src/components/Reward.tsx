/** 奖励弹窗（阶段 5.5c，brief §4、ia §1.15）：全 App 情绪最高的时刻，按「品牌时刻」编排。
 *  把前面攒下的东西全用上：IP 小牛 PNG（升段时旧形态蓄力 → 闪白 → 新形态弹出，就是「小牛长大」）、A4 主角卡（荧光弥散 + 颗粒）、
 *  M06 旋转光晕描边、M04 滚动码表（牛劲、PR 重量）、M07 弹簧交错入场、M08 按下回弹、Logo 破纪录态（条点亮 + 再长一节）、
 *  再加上冲击波、光芒、碎屑、闪屏、震屏和手机振动。
 *  - 三档强度：升段 = 满档（蓄力、闪屏、冲击波、光芒、大碎屑、震屏、长振动）；破纪录 / 连胜里程碑 = 高；升小级 / 周期完成 = 中。
 *  - 一次只弹一个（pickRewards 排好优先级），其余合并成一行「还有 N 条进了消息」。
 *  - 点一下跳过动画直接到定格；系统开启「减少动态效果」时：无碎屑、无震动、小牛不做成长动画，只淡入定格。
 *  - 只在结算页或回到 Tab 根页时出现，训练进行中不弹（ia §1.15）。 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from './Button';
import { Odometer } from './dataviz';
import { LogoGlyph } from './Logo';
import { Mascot, STAGE_NAME, type MascotMood, type MascotStage } from './Mascot';
import { Portal, useBackHandler, useFocusTrap } from './overlay';
import { cx } from './state';
import { T } from '../styles/tokens.gen';
import s from './Reward.module.css';

export type RewardKind = 'stage' | 'pr' | 'streak' | 'level' | 'cycle';
export type Reward =
  | { kind: 'stage'; from: MascotStage; to: MascotStage; niujin: number }
  | { kind: 'pr'; stage: MascotStage; exercise: string; fromKg: number; toKg: number; niujin: number }
  | { kind: 'streak'; stage: MascotStage; weeks: number; niujin: number }
  | { kind: 'level'; stage: MascotStage; sub: 2 | 3; niujin: number }
  | { kind: 'cycle'; stage: MascotStage; n: number; weeks: number; gainPct: number; niujin: number };

export const REWARD_NAME: Record<RewardKind, string> = { stage: '升段', pr: '破纪录', streak: '连胜里程碑', level: '升级', cycle: '周期完成' };
const TIER: Record<RewardKind, 'max' | 'high' | 'mid'> = { stage: 'max', pr: 'high', streak: 'high', level: 'mid', cycle: 'mid' };
const STAGE_ORDER: MascotStage[] = ['newborn', 'young', 'sturdy', 'bull', 'milo'];
/** 升段文案（品牌位置，可以俏皮；遵守「语气分工」） */
const STAGE_LINE: Record<MascotStage, string> = {
  newborn: '一切从这一头小牛开始。',
  young: '小牛站起来了。每次只多一点，它就一直在长。',
  sturdy: '肩峰长出来了——这是你一组一组扛出来的。',
  bull: '成年公牛。你已经是自己最强的样子，而且还在涨。',
  milo: 'Milo。传说里扛着小牛走成公牛的人——现在是你。',
};
const MOOD: Record<RewardKind, MascotMood> = { stage: 'happy', pr: 'pr', streak: 'happy', level: 'happy', cycle: 'idle' };

const fmt1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const BEAT = T['motion/slow'] / 2;

/** 数字从 from 滚到 to（缓出）；still 时直接给终值 */
function useCountUp(from: number, to: number, delayBeats: number, beats: number, still: boolean, decimals = 0) {
  const [v, setV] = useState(still ? to : from);
  useEffect(() => {
    if (still || reduced()) { setV(to); return; }
    let raf = 0; const t0 = performance.now() + delayBeats * BEAT, dur = beats * BEAT;
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / dur)), e = 1 - (1 - k) ** 3;
      const p = 10 ** decimals; setV(Math.round((from + (to - from) * e) * p) / p);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, delayBeats, beats, still, decimals]);
  return v;
}

/** 碎屑：黄金角均匀撒开，距离、大小、形状、颜色按序号确定（同一个弹窗每次一样，截图可复现） */
function Burst({ n, spread }: { n: number; spread: number }) {
  const bits = useMemo(() => Array.from({ length: n }, (_, i) => {
    const a = (i * 137.508) % 360, d = spread * (0.55 + ((i * 7919) % 100) / 220), z = 0.5 + ((i * 104729) % 10) / 12;
    return { a, d, z, shape: i % 3 === 0 ? 'dot' : i % 3 === 1 ? 'tri' : 'bar', tone: i % 5 === 0 ? 'bone' : i % 4 === 0 ? 'pale' : 'lime', k: i % 6 };
  }), [n, spread]);
  return (
    <span className={s.burst} aria-hidden="true">
      {bits.map((b, i) => <i key={i} className={cx(s.bit, s[b.shape], s[b.tone])} style={{ '--a': `${b.a}deg`, '--d': b.d, '--z': b.z, '--k': b.k } as CSSProperties} />)}
    </span>
  );
}

/** 五段成长路径：已到的段点亮，当前段呼吸；升段时进度线从旧段长到新段 */
function StagePath({ from, to }: { from: number; to: number }) {
  return (
    <div className={s.path} style={{ '--from': from / 4, '--to': to / 4 } as CSSProperties} aria-label={`成长路径：${STAGE_NAME[STAGE_ORDER[to]]}`}>
      <span className={s.pathTrack} /><span className={cx(s.pathFill, s.in)} />
      {STAGE_ORDER.map((st, i) => (
        <span key={st} className={cx(s.node, i <= to && s.nodeOn, i === to && s.nodeNow)} style={{ '--i': i } as CSSProperties}>
          <i /><b className="milo-text-micro">{STAGE_NAME[st]}</b>
        </span>
      ))}
    </div>
  );
}

/** 弹窗本体（不含遮罩）。still = 定格画面（目录矩阵、截图、减少动态效果） */
export function RewardCard({ reward, pro, queued = 0, still, onClaim }: { reward: Reward; pro?: boolean; queued?: number; still?: boolean; onClaim?: () => void }) {
  const tier = TIER[reward.kind];
  const t0 = reward.kind === 'stage' ? 6 : 2; // 「爆点」在第几拍
  const stage = reward.kind === 'stage' ? reward.to : reward.stage;
  const niujin = useCountUp(0, reward.niujin, t0 + 4, 5, !!still);
  const kg = useCountUp(reward.kind === 'pr' ? reward.fromKg : 0, reward.kind === 'pr' ? reward.toKg : 0, t0 + 3, 5, !!still, 1);
  const weeks = useCountUp(0, reward.kind === 'streak' ? reward.weeks : 0, t0 + 2, 4, !!still);

  let headline: ReactNode, metric: ReactNode = null, line: string, path: ReactNode = null;
  switch (reward.kind) {
    case 'stage':
      headline = STAGE_NAME[reward.to]; line = STAGE_LINE[reward.to];
      path = <StagePath from={STAGE_ORDER.indexOf(reward.from)} to={STAGE_ORDER.indexOf(reward.to)} />;
      break;
    case 'pr':
      // 走查 1 #23：大数字 + 涨幅胶囊是主角（同一行），动作名在下面单独一行；涨幅已在胶囊里，说明句不再重复
      headline = reward.exercise; line = '慢慢变牛，就是这样。';
      metric = (
        <div className={cx(s.metric, s.metricRow, s.in)} aria-label={`预估 1RM ${fmt1(reward.toKg)} kg，比之前多 ${fmt1(reward.toKg - reward.fromKg)} kg`}>
          <span className={s.kg}><Odometer value={fmt1(kg)} size="xl" /><i>kg</i></span>
          <span className={s.delta}>+{fmt1(reward.toKg - reward.fromKg)} kg</span>
        </div>
      );
      break;
    case 'streak':
      headline = <span className={s.giant}>{weeks}<i>周</i></span>; line = `连续 ${reward.weeks} 周守约：该练就练，该休就休。`;
      metric = (
        <div className={cx(s.weeks, s.in)} aria-hidden="true">
          {Array.from({ length: Math.min(12, reward.weeks) }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
          {reward.weeks > 12 && <b className="milo-text-micro">+{reward.weeks - 12}</b>}
        </div>
      );
      break;
    case 'level':
      headline = `${STAGE_NAME[reward.stage]} ${reward.sub} 级`; line = reward.sub === 3 ? `再升一级就是${STAGE_NAME[STAGE_ORDER[STAGE_ORDER.indexOf(reward.stage) + 1]] ?? '满级'}。` : '每次只多一点，等级一格一格亮起来。';
      metric = (
        <div className={cx(s.pips, s.in)} aria-label={`${reward.sub} / 3 级`}>
          {[1, 2, 3].map((p) => <i key={p} className={cx(p <= reward.sub && s.pipOn, p === reward.sub && s.pipNew)} />)}
        </div>
      );
      break;
    case 'cycle':
      headline = `第 ${reward.n} 个周期`; line = '练满一轮、按时减量，下一轮更重。';
      metric = (
        <div className={cx(s.stats, s.in)}>
          <span><b className="milo-text-number-l">{reward.weeks}</b><i className="milo-text-caption">周训练</i></span>
          <span><b className="milo-text-number-l">1</b><i className="milo-text-caption">个减量周</i></span>
          <span><b className="milo-text-number-l">+{fmt1(reward.gainPct)}%</b><i className="milo-text-caption">主项预估 1RM</i></span>
        </div>
      );
      break;
  }

  return (
    <div className={cx(s.card, still && s.still)} data-theme="dark" data-kind={reward.kind} data-tier={tier} data-milo={stage === 'milo' || undefined}
      style={{ '--t0': t0 } as CSSProperties} role="dialog" aria-modal="true" aria-label={`${REWARD_NAME[reward.kind]}：${typeof headline === 'string' ? headline : line}`}>
      <span className={cx(s.border, s.loop)} aria-hidden="true" />
      <div className={s.stageArea}>
        {tier !== 'mid' && <span className={cx(s.rays, s.loop)} aria-hidden="true" />}
        <span className={s.halo} aria-hidden="true" />
        {tier !== 'mid' && <span className={s.rings} aria-hidden="true"><i /><i /><i /></span>}
        <Burst n={tier === 'max' ? 30 : tier === 'high' ? 20 : 12} spread={tier === 'max' ? 3.6 : 2.8} />
        {reward.kind === 'stage' && <span className={s.old}><Mascot stage={reward.from} mood="focused" /></span>}
        <span className={cx(s.hero, s.in)}><Mascot stage={stage} mood={MOOD[reward.kind]} animate={!still} /></span>
        {reward.kind === 'pr' && <span className={cx(s.stamp, s.in)}>新纪录</span>}
      </div>
      <p className={cx(s.label, s.in, 'milo-text-label')} style={{ '--n': 0 } as CSSProperties}>
        {reward.kind === 'pr' && <LogoGlyph mark="bars" state={still ? 'idle' : 'pr'} small className={s.labelGlyph} />}
        {REWARD_NAME[reward.kind]}{reward.kind === 'pr' && ' · 预估 1RM'}
      </p>
      {reward.kind === 'pr' && metric}
      <h2 className={cx(s.headline, s.in)} style={{ '--n': reward.kind === 'pr' ? 2 : 1 } as CSSProperties}>{headline}</h2>
      {reward.kind !== 'pr' && metric}
      <p className={cx(s.line, s.in, 'milo-text-body')} style={{ '--n': 3 } as CSSProperties}>{line}</p>
      {path}
      <div className={cx(s.gain, s.in)} style={{ '--n': 4 } as CSSProperties} aria-label={`获得 ${reward.niujin} 牛劲`}>
        <span className={s.plus}>+</span><Odometer value={String(niujin)} size="l" /><span className="milo-text-label">牛劲</span>
        {pro && <span className={cx(s.pro, s.loop)}>Pro ×1.5</span>}
      </div>
      <div className={cx(s.cta, s.in)} style={{ '--n': 5 } as CSSProperties}>
        <Button kind="primary" glow onClick={onClaim}>收下</Button>
        {queued > 0 && <p className={cx(s.queued, 'milo-text-caption')}>还有 {queued} 条奖励已放进「消息」</p>}
      </div>
    </div>
  );
}

/** 带遮罩的弹窗：闪屏、背景光晕、点一下跳过、手机振动、返回键 / Esc 关闭 */
export function RewardModal({ reward, pro, queued, onClose }: { reward: Reward | null; pro?: boolean; queued?: number; onClose: () => void }) {
  useBackHandler(!!reward, onClose);
  if (!reward) return null;
  return <Portal><RewardLayer key={JSON.stringify(reward)} reward={reward} pro={pro} queued={queued} onClose={onClose} /></Portal>;
}

function RewardLayer({ reward, pro, queued, onClose }: { reward: Reward; pro?: boolean; queued?: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  useFocusTrap(ref, onClose);
  const tier = TIER[reward.kind];
  useEffect(() => {
    if (reduced()) { setDone(true); return; }
    const t0 = (reward.kind === 'stage' ? 6 : 2) * BEAT, f = T['motion/fast'];
    const pattern = tier === 'max' ? [f / 4, f / 3, f / 4, f / 3, f] : tier === 'high' ? [f / 4, f / 3, f / 2] : [f / 4];
    const timers = [window.setTimeout(() => navigator.vibrate?.(pattern), t0), window.setTimeout(() => setDone(true), (reward.kind === 'stage' ? 14 : 10) * BEAT)];
    if (reward.kind === 'stage') timers.push(window.setTimeout(() => navigator.vibrate?.([f / 6, f / 2, f / 6, f / 2]), 2 * BEAT));
    return () => timers.forEach(clearTimeout);
  }, [reward.kind, tier]);
  return (
    <div ref={ref} className={cx(s.layer, done && s.done)} data-theme="dark" data-tier={tier} data-milo={(reward.kind === 'stage' ? reward.to : reward.stage) === 'milo' || undefined}
      style={{ '--t0': reward.kind === 'stage' ? 6 : 2 } as CSSProperties}
      onClick={() => { if (!done) setDone(true); }}>
      <span className={s.bloom} aria-hidden="true" />
      <span className={s.flash} aria-hidden="true" />
      <div className={s.shake}><RewardCard reward={reward} pro={pro} queued={queued} still={false} onClaim={onClose} /></div>
    </div>
  );
}
