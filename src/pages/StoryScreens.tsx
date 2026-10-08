/** 初见引导（P12 故事段，分镜 design/brand/story/storyboard.md）：米洛（Milo）的故事 → 渐进超负荷 → 超量恢复（黄金窗小互动）→ 两者合起来 → Milo 替你算 → 你的小牛。
 *  - 像 Stories 一样播：顶部 8 段进度条，每幕播完自动进下一幕；点右半屏下一幕、左半屏上一幕，按住暂停；右上角「跳过」直接进建档。
 *  - 背景是远 / 中 / 近三层场景（用户出图，scripts/story_png.py 抠图），前 6 幕同一个镜头左右平移（视差）；人物是米洛 6 个姿势。
 *  - 刻度尺、天数、曲线、阶梯、碎屑、产品小样都是代码生成；产品小样用真组件（胶囊、处方卡）。
 *  - 减少动态效果：每幕直接到最后一帧，互动换成按钮；故事不记进度（杀进程回第 1 幕）。?scene=N 从第 N 幕开始（截图用）。 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BodyFigure, Button, CapsuleRail, Lockup, LogoGlyph, Mascot, PrescriptionHero, Screen, type Anchors } from '../components';
import { capsuleLayout } from '../components/capsuleLayout';
import { bodyData } from '../data/demo';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import { STORY_ASSETS, type StoryAsset } from './storyAssets';
import s from './StoryScreens.module.css';

const url = (k: StoryAsset) => `${import.meta.env.BASE_URL}story/${k}.webp`;
const still = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** 每幕：时长（毫秒，0 = 等互动）、镜头位置（0 = 最左，1 = 最右）、文字 */
const SCENES: { ms: number; cam: number; h: string; b: ReactNode; sh?: string }[] = [
  { ms: 6500, cam: 0.05, h: '两千五百年前，有个扛牛的人', b: <>公元前 6 世纪的克罗顿，古代奥运六届摔跤冠军——力量训练的祖师爷，米洛（Milo）。</> },
  { ms: 6000, cam: 0.2, h: '他每天扛起同一头小牛', b: <>传说，小牛刚出生，他就把它扛上肩，绕着场地走一圈。</> },
  { ms: 9500, cam: 0.45, h: '小牛每天只重一点', b: <>他每天也只多扛一点。几年后，肩上是一头公牛。这就是<b>渐进超负荷</b>。</> },
  { ms: 8000, cam: 0.62, h: '可他是在什么时候变强的？', b: <>不是扛的时候，是睡着以后：练完先变弱，恢复后比原来更强一点——<b>超量恢复</b>。</> },
  { ms: 0, cam: 0.62, h: '在黄金窗里再练一次', b: <>光点沿着曲线走，进入荧光那一段时，点「开始训练」。</> },
  { ms: 9000, cam: 0.95, h: '两件事合起来，就是变强', b: <>每次只多一点 × 在恢复的最高点再练。他扛着公牛，走进了奥林匹亚。</> },
  { ms: 9000, cam: 0.95, h: '现在，Milo 替你算这两件事', b: <>哪块肌肉恢复好了、这一组该加多少——打开 App，就是今天的答案。</>, sh: '74%' },
  { ms: 0, cam: 0.95, h: '你的小牛，今天出生', b: <>你每变强一点，它就长大一点。</> },
];

export function StoryScreens({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(() => Math.max(0, Math.min(SCENES.length - 1, Number(new URLSearchParams(location.search).get('scene') ?? 1) - 1)));
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false); // 互动幕：做对了才能自动往下
  const [brand, setBrand] = useState(false);  // 第 3 幕：天数走完、刻度到 450 kg 后，品牌 Logo 才出现
  const [host, setHost] = useState<HTMLElement | null>(null);  // 互动幕的「开始训练」按钮要放在整屏底部拇指区，经 portal 挂到根容器上
  const go = useCallback((d: number) => { setReady(false); setBrand(false); setI((x) => Math.max(0, Math.min(SCENES.length - 1, x + d))); }, []);
  const sc = SCENES[i];
  const ms = sc.ms || (ready ? 2600 : 0);

  // 自动进下一幕：按住暂停；按住结束后从头计（简单可靠，Stories 的通行做法是继续计，这里幕短，差别不大）
  useEffect(() => {
    if (!ms || paused || i === SCENES.length - 1) return;
    const t = window.setTimeout(() => go(1), ms);
    return () => clearTimeout(t);
  }, [i, ms, paused, go]);

  const press = useRef<{ t: number; x: number } | null>(null);
  const onDown = (e: React.PointerEvent) => { press.current = { t: performance.now(), x: e.clientX }; setPaused(true); };
  const onUp = (e: React.PointerEvent) => {
    const p = press.current; press.current = null; setPaused(false);
    if (!p || performance.now() - p.t > 350) return; // 按住 = 暂停，不翻页
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    go(e.clientX - r.left < r.width * 0.3 ? -1 : 1);
  };

  return (
    <Screen label={`故事 第 ${i + 1} 幕，共 ${SCENES.length} 幕`}>
    <div ref={setHost} className={s.story} style={{ '--cam': sc.cam, ...(sc.sh ? { '--stage-h': sc.sh } : {}) } as CSSProperties}>
      <Backdrop />
      <div className={s.bars} aria-hidden="true">
        {SCENES.map((_, k) => <i key={k} className={k < i ? s.barDone : k === i ? s.barNow : undefined} style={k === i && ms ? { '--ms': `${ms}ms`, animationPlayState: paused ? 'paused' : 'running' } as CSSProperties : undefined} />)}
      </div>
      <button type="button" className={`milo-focus ${s.skip}`} onClick={onDone}>跳过</button>

      {/* 点击区：左 30% 上一幕，其余下一幕；互动幕和最后一幕的按钮在点击区之上 */}
      <div className={s.tap} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { press.current = null; setPaused(false); }} aria-hidden="true" />

      <div className={s.stage} key={`st${i}`}>
        {i === 0 && <Figure k="M1" enter="walk" glow />}
        {i === 1 && <><Figure k="M2" enter="fade" /><Ruler value={30} label="第 1 天" /></>}
        {i === 2 && <Progression onFull={() => setBrand(true)} />}
        {i === 3 && <><Figure k="M6" enter="fade" small /><Zz /><Curve /></>}
        {i === 4 && <GoldenWindow host={host} onSuccess={() => setReady(true)} />}
        {i === 5 && <Staircase />}
        {i === 6 && <Product />}
        {i === 7 && <Calf />}
      </div>

      <div className={s.text} key={`tx${i}`} aria-live="polite">
        <h1 className="milo-text-title-l">{sc.h}</h1>
        <p className="milo-text-body">{sc.b}</p>
      </div>

      {i === 2 && brand && <Brand />}
      {i === SCENES.length - 1 && <div className={s.cta}><Button glow onClick={onDone}>开始建档</Button></div>}
      {i < SCENES.length - 1 && sc.ms > 0 && <span className={s.hint} aria-hidden="true">点击继续</span>}
    </div>
    </Screen>
  );
}

/* ---------------- 场景三层：同一个镜头（--cam）左右平移，远景慢、近景快 ---------------- */
function Backdrop() {
  return (
    <div className={s.backdrop} aria-hidden="true">
      <img className={`${s.layer} ${s.far}`} src={url('S1-far')} alt="" draggable={false} />
      <img className={`${s.layer} ${s.mid}`} src={url('S1-mid')} alt="" draggable={false} />
      <img className={`${s.layer} ${s.near}`} src={url('S1-near')} alt="" draggable={false} />
      <div className={s.vignette} />
      {/* 荧光尘粒：缓慢往上飘，错开起点和速度，给整个故事一层若有若无的空气感 */}
      <div className={s.motes}>{Array.from({ length: 16 }, (_, k) => <i key={k} style={{ '--x': `${(k * 37 + 11) % 100}%`, '--s': k % 3, '--k': k } as CSSProperties} />)}</div>
    </div>
  );
}

/** 米洛：站在地面线上；宽度按素材像素 × 统一比例（6 个姿势同一个比例） */
function Figure({ k, enter, glow, small, className }: { k: StoryAsset; enter?: 'walk' | 'fade' | 'pop'; glow?: boolean; small?: boolean; className?: string }) {
  const a = STORY_ASSETS[k];
  return <img className={`${s.fig} ${enter ? s[`in_${enter}`] : ''} ${glow ? s.laurel : ''} ${small ? s.figSmall : ''} ${className ?? ''}`} src={url(k)} alt=""
    style={{ '--w': a.w, '--h': a.h } as CSSProperties} draggable={false} />;
}

function Zz() {
  return <div className={s.zz} aria-hidden="true"><i>z</i><i>z</i><i>z</i></div>;
}

/* ---------------- 刻度尺：kg 一格一格往前走 ---------------- */
const TICK = 30; // 每格 kg
function Ruler({ value, label, flash }: { value: number; label?: string; flash?: number }) {
  const lo = Math.floor(value / TICK) * TICK - TICK * 6;
  const ticks = Array.from({ length: 14 }, (_, k) => lo + k * TICK);
  const x = (v: number) => ((v - value) / TICK) * 26 + 180; // 当前值固定在中间（viewBox 360 宽）
  return (
    <div className={s.ruler}>
      <svg viewBox="0 0 360 64" className={s.rulerSvg} aria-hidden="true">
        {ticks.map((t) => <g key={t}><line className={s.tick} x1={x(t)} x2={x(t)} y1={20} y2={t % (TICK * 2) === 0 ? 36 : 30} />
          {t % (TICK * 2) === 0 && t >= 0 && <text className={s.tickNum} x={x(t)} y={52} textAnchor="middle" fontSize="11">{t}</text>}</g>)}
        <line className={s.needle} x1={180} x2={180} y1={10} y2={40} />
      </svg>
      <div className={s.readout}>
        {label && <span className="milo-text-caption">{label}</span>}
        <b className="milo-text-number-l">{Math.round(value)}<small> kg</small></b>
        {flash != null && <span key={flash} className={s.plusOne}>+ 一点</span>}
      </div>
    </div>
  );
}

/* ---------------- 第 3 幕：天数快进，肩上的牛长大，刻度往前走，走完后品牌 Logo 在屏幕中下方长出来 ---------------- */
/** 品牌位（2026-10-06 用户：Logo 移到中下方，强化品牌感）：递增条一根根从下往上长出来 → 光晕一闪 → 字标「慢牛 Milo」随后升起；
 *  放在文字块下面、屏幕水平正中，是这一幕收尾的落点。 */
function Brand() {
  return (
    <div className={s.brand} aria-hidden="true">
      <span className={s.brandHalo} />
      <LogoGlyph mark="bars" state="loading" className={s.brandGlyph} />
      <Lockup className={s.brandWord} />
    </div>
  );
}

const STEPS: [number, StoryAsset][] = [[0, 'M2'], [0.22, 'M3'], [0.5, 'M4'], [0.78, 'M5']];
function Progression({ onFull }: { onFull: () => void }) {
  const [p, setP] = useState(still() ? 1 : 0);
  useEffect(() => { if (p >= 1) onFull(); }, [p >= 1]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (still()) return;
    let raf = 0; const t0 = performance.now(), D = 6500;
    const f = (t: number) => { const x = Math.min(1, (t - t0) / D); setP(x); if (x < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, []);
  const e = 1 - Math.pow(1 - p, 1.6);
  const day = Math.max(1, Math.round(1 + e * 1459)), kg = 30 + e * 420;
  const step = STEPS.filter(([at]) => p >= at).length - 1;
  return (
    <>
      {STEPS.map(([, k], j) => <Figure key={k} k={k} className={j === step ? s.figOn : s.figOff} />)}
      <Ruler value={kg} label={`第 ${day} 天`} flash={step} />
    </>
  );
}

/* ---------------- 第 4 幕：超量恢复曲线 ---------------- */
// 曲线（viewBox 320 × 170，基线 y = 110）：训练 → 下凹（修复期）→ 回升（恢复中）→ 冲过基线（黄金窗）→ 回落（已回落）
const BASE = 110;
// 第三段在峰顶（178.4, 63.5）一分为二（同一条曲线，形状不变）：黄金窗里练对了，峰顶之后的「回落」压暗，下一轮从峰顶接出去（走查 1 #04）
const PEAK = { x: 178.4, y: 63.5 };
const HEAD = `M0 ${BASE} L36 ${BASE} C48 ${BASE} 52 156 82 156 C112 156 118 ${BASE} 130 ${BASE - 6} C145 72.5 163.4 ${PEAK.y} ${PEAK.x} ${PEAK.y}`;
const TAIL = `C183.4 ${PEAK.y} 188 64.5 192 66 C220 78 260 100 320 106`;
const CURVE = `${HEAD} ${TAIL}`;
// 下一轮 = 第一轮（从「练」那一刻起）原样缩小（横 0.5、竖 0.6）贴到峰顶：起笔切线水平，和峰顶的切线一致，接得上（C1 连续）；新的基线就是峰顶的高度
const NEXT = `M${PEAK.x} ${PEAK.y} C184.4 ${PEAK.y} 186.4 91.1 201.3 91.1 C216.3 91.1 219.3 ${PEAK.y} 225.3 59.9 C235.2 34.7 248.2 33.5 256.2 37.1 C270.1 44.3 290.1 57.5 320 61.1`;
const PHASES: [string, number, number, boolean][] = [['修复期', 40, 96, false], ['恢复中', 96, 132, false], ['黄金窗', 132, 204, true], ['已回落', 204, 320, false]];
function Curve({ children, lit = true, instant, fadeTail }: { children?: ReactNode; lit?: boolean; instant?: boolean; /** 峰顶之后压暗（下一轮从峰顶接出时） */ fadeTail?: boolean }) {
  return (
    <svg viewBox="0 0 320 170" className={`${s.curve} ${instant ? s.instant : ''}`} aria-label="超量恢复曲线：训练后先下降，恢复后超过原来的水平，再慢慢回落">
      <line className={s.base} x1={0} x2={320} y1={BASE} y2={BASE} />
      <text className={s.baseLabel} x={316} y={BASE + 14} fontSize="10" textAnchor="end">原来的水平</text>
      {lit && <rect className={s.golden} x={132} y={20} width={72} height={140} rx={6} />}
      {fadeTail ? <><path className={s.curvePath} d={HEAD} pathLength={1} /><path className={s.curveTail} d={`M${PEAK.x} ${PEAK.y} ${TAIL}`} /></> : <path className={s.curvePath} d={CURVE} pathLength={1} />}
      {PHASES.map(([n, a, b, g], k) => <text key={n} className={`${s.phase} ${g ? s.phaseLit : ''}`} style={{ '--k': k } as CSSProperties} x={(a + b) / 2} y={168} fontSize="10" textAnchor="middle">{n}</text>)}
      <text className={s.trainMark} x={36} y={BASE - 12} fontSize="10" textAnchor="middle">练</text>
      {children}
    </svg>
  );
}

/* ---------------- 第 4b 幕：黄金窗小互动（按钮 = 首页的「开始训练」） ---------------- */
type GW = 'run' | 'early' | 'late' | 'ok';
function GoldenWindow({ host, onSuccess }: { host: HTMLElement | null; onSuccess: () => void }) {
  const path = useRef<SVGPathElement>(null);
  const [st, setSt] = useState<GW>(still() ? 'ok' : 'run');
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const pos = useRef(0);
  useEffect(() => { if (st === 'ok') onSuccess(); }, [st, onSuccess]);
  useEffect(() => {
    if (st !== 'run') return;
    let raf = 0, t0 = performance.now();
    const f = (t: number) => {
      const el = path.current; if (!el) return;
      const L = el.getTotalLength(), x = (((t - t0) / 4200) % 1) * 0.86 + 0.1; // 从下凹开始走，走到回落段
      pos.current = x;
      const q = el.getPointAtLength(L * x); setPt({ x: q.x, y: q.y });
      if ((t - t0) / 4200 > 1) { setSt('late'); return; } // 走完一趟还没点 = 错过
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [st]);
  useEffect(() => { if (st === 'early' || st === 'late') { const t = window.setTimeout(() => setSt('run'), 1800); return () => clearTimeout(t); } }, [st]);
  const hit = () => {
    if (st !== 'run' || !pt) return;
    setSt(pt.x < 132 ? 'early' : pt.x <= 204 ? 'ok' : 'late');
  };
  const inWin = st === 'run' && !!pt && pt.x >= 132 && pt.x <= 204;  // 光点在荧光段里：按钮脉冲加快加亮，手把手教「就是现在」
  const msg = { run: '等光点走进荧光那一段', early: '太早了：还没恢复好，越练越累', late: '错过了：又回到原来的水平', ok: '就是这样！在最高点再练，下一次从更高的地方开始' }[st];
  return (
    <>
      <div className={s.gwStack}>
      <Curve instant fadeTail={st === 'ok'}>
        <path ref={path} d={CURVE} fill="none" stroke="none" />
        {st === 'ok' && <line className={s.base2} x1={PEAK.x} x2={320} y1={PEAK.y} y2={PEAK.y} />}
        {st === 'ok' && <path className={s.nextCycle} d={NEXT} pathLength={1} />}
        {pt && st !== 'ok' && <circle className={`${s.dot} ${st !== 'run' ? s.dotStop : ''}`} cx={pt.x} cy={pt.y} r={6} />}
      </Curve>
      <p className={`milo-text-body-strong ${s.gwMsg} ${st === 'ok' ? s.gwOk : st !== 'run' ? s.gwBad : ''}`} role="status">{msg}</p>
      </div>
      {st === 'ok' && <Burst />}
      {st === 'ok' && <div className={s.calfGrow}><Mascot stage="young" mood="happy" animate /></div>}
      {/* 和首页同一个「开始训练」按钮（荧光 + 圆锥描边慢转 + 呼吸光晕），放在整屏底部拇指区；外面再叠两圈脉冲引导点击 */}
      {host && st !== 'ok' && createPortal(
        <div className={`${s.gwCta} ${inWin ? s.gwHot : ''} ${st !== 'run' ? s.gwOff : ''}`}>
          <span className={s.pulse} aria-hidden="true" />
          <Button glow onClick={hit} disabled={st !== 'run'}>开始训练</Button>
        </div>, host)}
    </>
  );
}

/** 荧光碎屑（代码生成，不绑在任何人物上） */
function Burst() {
  return <div className={s.burst} aria-hidden="true">{Array.from({ length: 18 }, (_, k) => <i key={k} style={{ '--a': `${k * 20}deg`, '--d': `calc(var(--milo-space-5xl) * ${1.3 + (k % 3) * 0.45})`, '--k': k } as CSSProperties} />)}</div>;
}

/* ---------------- 第 5 幕：一段接一段，峰值一级比一级高，连成阶梯；米洛扛着公牛沿阶梯走上去，走进奥林匹亚拱门的光里 ---------------- */
const STAIR_N = 5;
function Staircase() {
  const { d, peaks } = useMemo(() => {
    let x = 8, y = 168, out = `M0 ${y} L${x} ${y}`;
    const pk: [number, number][] = [];
    for (let k = 0; k < STAIR_N; k++) { // 每段：练 → 下凹 → 回升 → 冲过基线；下一段从峰值开始，所以峰值一级比一级高
      const peak = y - 34;
      out += ` C${x + 8} ${y} ${x + 12} ${y + 14} ${x + 20} ${y + 14} C${x + 32} ${y + 14} ${x + 38} ${peak} ${x + 52} ${peak}`;
      x += 52; y = peak + 6; pk.push([x, peak]);
    }
    return { d: out, peaks: pk };
  }, []);
  return (
    <>
      <div className={s.archWrap}>
        <img className={s.arch} src={url('S2')} alt="" draggable={false} />
        <div className={s.archLight} aria-hidden="true" />
      </div>
      <svg viewBox="0 0 320 180" className={s.stairs} aria-label="一段段超量恢复曲线连起来，峰值越来越高">
        <path className={s.stairGlow} d={d} pathLength={1} />
        <path className={s.stairPath} d={d} pathLength={1} />
        {peaks.map(([x, y], k) => <g key={k} className={s.peak} style={{ '--k': k } as CSSProperties}><circle cx={x} cy={y} r={3.5} /><text x={x} y={y - 9} fontSize="9" textAnchor="middle">+1</text></g>)}
      </svg>
      <div className={s.climber}><Figure k="M5" className={s.figClimb} /></div>
      <div className={s.sweep} aria-hidden="true" />
    </>
  );
}

/* ---------------- 第 6 幕：产品小样（真组件，自动演示） ----------------
 *  第一张 = 容量页的演示：人体上肌肉按恢复程度着色，一根手指按在右侧胶囊列上往下滑，胶囊像放大镜一样逐个展开，最后停在「黄金窗」那一颗；
 *  第二张 = 处方卡（杠铃卧推 85 kg · +2.5）。两张几乎同时弹入，第二张紧跟第一张。 */
const DEMO_HEADS: [string, Partial<HeadStat>][] = [
  ['anterior-deltoid', { phase: 'repair', recovery: 0.34, hoursLeft: 31 }],
  ['upper-pectoralis', { phase: 'recovering', recovery: 0.8, hoursLeft: 9 }],
  ['mid-lower-pectoralis', { phase: 'golden', recovery: 1.02, hoursLeft: 0 }],
  ['short-head-bicep', { phase: 'recovering', recovery: 0.9, hoursLeft: 5 }],
  ['lateral-deltoid', { phase: 'repair', recovery: 0.52, hoursLeft: 18 }],
];
const GOLDEN = 'mid-lower-pectoralis';
const FIG_SCALE = 2.9;  // 人体按演示框高度的这么多倍画，只露出肩、胸、手臂（上半身），肌肉才看得清，胶囊的引线也不会挤在一小团里
const FIG_LIFT = 0.16;  // 再往上提演示框高度的这么多：把头顶让出去，胸和肩落在框的中央
const ease = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

function BodyDemo() {
  const stats = useMemo(() => {
    const all = bodyData('advanced-profile', Date.now()).stats, out = new Map<string, HeadStat>();
    for (const [id, patch] of DEMO_HEADS) { const h = all.get(id); if (h) out.set(id, { ...h, ...patch } as HeadStat); }
    return out;
  }, []);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [anchors, setAnchors] = useState<Anchors>({});
  const [mag, setMag] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current!, ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const ids = useMemo(() => Object.keys(anchors).filter((id) => stats.has(id)).sort((a, b) => anchors[a][1] - anchors[b][1] || anchors[a][0] - anchors[b][0]), [anchors, stats]);
  const n = ids.length, gold = ids.indexOf(GOLDEN);
  const left = size.w * T['ratio/rail-start'], right = size.w;

  // 自动演示：停一下 → 按下第一颗 → 慢慢滑到最后一颗 → 停一下 → 滑回「黄金窗」那一颗，按住不放
  const slow = T['motion/slow'];
  useEffect(() => {
    if (n < 2) return;
    if (still()) { setMag(gold); return; }
    const t0 = performance.now(), A = slow * 2.5, B = slow * 9, C = slow * 1.2, D = slow * 3.5;
    let raf = 0;
    const f = (t: number) => {
      const x = t - t0;
      if (x < A) setMag(null);
      else if (x < A + B) setMag(ease((x - A) / B) * (n - 1));
      else if (x < A + B + C) setMag(n - 1);
      else if (x < A + B + C + D) setMag((n - 1) + (gold - (n - 1)) * ease((x - A - B - C) / D));
      else { setMag(gold); return; }
      raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [n, gold, slow]);

  // 手指：跟着放大镜的位置走（按静止时的均分算，和 CapsuleRail 的手势命中是同一个映射）
  const finger = useMemo(() => {
    if (mag == null || !n || !size.h) return null;
    const st = capsuleLayout(n, size.h, left, right, null), span = st.caps[n - 1].y + st.caps[n - 1].h;
    return st.top + ((mag + 0.5) / n) * span;
  }, [mag, n, size.h, left, right]);
  const focusId = mag != null ? ids[Math.round(mag)] ?? null : null;

  return (
    <div ref={box} className={s.bodyDemo} aria-hidden="true">
      <div className={s.bodyClip}>
        <div className={s.bodyFig} style={{ top: -size.h * FIG_LIFT }}>
          {size.h > 0 && <BodyFigure gender="male" view="front" stats={stats} focus={focusId} height={size.h * FIG_SCALE} onAnchors={setAnchors} relativeTo={box} />}
        </div>
      </div>
      {size.h > 0 && n > 0 && <CapsuleRail ids={ids} stats={stats} anchors={anchors} width={size.w} height={size.h} left={left} right={right} mag={mag} onMag={() => {}} onSelect={() => {}} />}
      {finger != null && <i className={s.finger} style={{ top: finger }} />}
    </div>
  );
}

function Product() {
  return (
    <div className={s.product}>
      <div className={s.pCard} style={{ '--k': 0 } as CSSProperties}>
        <span className={`milo-text-label ${s.pLabel}`}>什么时候练 · 超量恢复</span>
        <BodyDemo />
      </div>
      <div className={s.pCard} style={{ '--k': 1 } as CSSProperties}>
        <span className={`milo-text-label ${s.pLabel}`}>加多少 · 渐进超负荷</span>
        <PrescriptionHero order={1} region="胸" name="杠铃卧推" weight={85} sets={3} reps={[6, 8]} reason="上次 82.5 kg × 8 / 8 / 8，全部做到上限 → +2.5 kg" last={82.5} step={2.5} />
      </div>
    </div>
  );
}

/* ---------------- 第 7 幕：你的小牛 ---------------- */
const AGES = ['newborn', 'young', 'sturdy', 'bull', 'milo'] as const;
function Calf() {
  return (
    <>
      <div className={s.calf}><Mascot stage="newborn" mood="happy" animate /></div>
      <div className={s.ages} aria-label="5 种牛龄：牛犊、小牛、壮牛、公牛、Milo，现在是牛犊">
        {AGES.map((a, k) => <span key={a} className={k === 0 ? s.ageOn : s.ageOff} style={{ '--k': k } as CSSProperties}><Mascot stage={a} /></span>)}
      </div>
      <Burst />
    </>
  );
}
