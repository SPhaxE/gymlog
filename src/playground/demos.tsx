/** Playground 的交互演示：真实状态、真实动效（矩阵里是静态展示）。每个演示挂在一个组件小节下面。 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import {
  BackToTop, Banner, Button, Cascade, Dialog, ExerciseRow, PageHeader, RestDock, SharedDetail, SteelPlate, dotMonths, sharedTransition, Nav, NumberField, OptionCard, OptionGroup, ProgressSteps, Sheet, SheetBlock, Stepper, TopBar, TrendChart, WeekStrip,
  LandmarkRuler, PhaseSegments, Num, Screen, SetRow, clock, useCountdown, useToast, type Tab,
  Mascot, MASCOT_MOODS, MASCOT_STAGES, MOOD_NAME, STAGE_NAME, RewardModal, REWARD_NAME, AgeBadge, GrowthBar, Paywall, type MascotMood, type MascotStage, type Reward,
} from '../components';
import { BodyPage } from '../pages/BodyPage';
import { HomePage } from '../pages/HomePage';
import { T } from '../styles/tokens.gen';
import type { Fixtures } from './fixtures';
import { Stage } from './Stage';
import { afterSession, growthDemoUser, growthSample, sampleRewards } from '../data/growth';
import { GROWTH_CONFIG, STAGE_LABEL, levelInfo } from '../engine';
import curve from '../engine/growthCurve.json';
import s from './Playground.module.css';

const Note = ({ children }: { children: ReactNode }) => <p className={`milo-text-caption ${s.note}`}>{children}</p>;

/** 按钮：点保存 → 加载中（不可重复点）→ 轻提示 */
function SaveDemo() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className={s.demoPad}>
      <Button kind="neutral" loading={busy} onClick={() => { setBusy(true); window.setTimeout(() => { setBusy(false); toast.show('已保存 · 3 组'); }, T['motion/slow'] * 3); }}>保存这次训练</Button>
    </div>
  );
}
export function ButtonDemo() {
  return <div className={s.demoCol}><Stage short label="按钮演示"><SaveDemo /></Stage><Note>加载时按钮宽度不变、不能重复点；结束后轻提示停在导航位置上方。</Note></div>;
}

/** 表单：建档的三类输入。器械至少选一类；时长 30–150 步进 15；重量 0–500 行内报错 */
const EQUIP = ['杠铃', '哑铃', '固定器械', '绳索', '史密斯机', '自重 / 负重'];
export function FormDemo() {
  const [exp, setExp] = useState('intermediate');
  const [eq, setEq] = useState<string[]>(EQUIP);
  const [min, setMin] = useState(60);
  const [w, setW] = useState('62.5');
  const n = Number(w), wErr = w.trim() === '' ? undefined : !/^\d+(\.\d+)?$/.test(w.trim()) ? '只能填数字' : n > 500 ? '重量范围 0–500 kg' : undefined;
  return (
    <div className={s.formDemo}>
      <ProgressSteps current={2} total={3} />
      <OptionGroup label="训练经验">
        {([['beginner', '新手', '练了不到 1 年'], ['intermediate', '进阶', '规律训练 1–3 年'], ['advanced', '高阶', '3 年以上，熟悉周期']] as const).map(([k, t, d]) => (
          <OptionCard key={k} title={t} detail={d} selected={exp === k} onClick={() => setExp(k)} />
        ))}
      </OptionGroup>
      <div className={s.chips}>
        {EQUIP.map((e) => <OptionCard key={e} mode="multi" title={e} selected={eq.includes(e)} onClick={() => setEq((xs) => xs.includes(e) ? xs.filter((x) => x !== e) : [...xs, e])} />)}
      </div>
      {eq.length === 0 && <Banner tone="error" detail="器械至少选一类，否则排不出动作" />}
      <div className={s.row}><span className="milo-text-body">单次训练时长</span><Stepper label="单次训练时长" value={min} step={15} min={30} max={150} unit="分钟" onChange={setMin} /></div>
      <NumberField label="重量（试试输入 620 或字母）" unit="kg" value={w} onChange={setW} error={wErr} helper="0 表示自重" />
      <Button disabled={eq.length === 0 || !!wErr}>下一步</Button>
      <Note>单选组可以用方向键切换；多选没有选中任何一项时「下一步」不可用，并说明原因。</Note>
    </div>
  );
}

/** 反馈：轻提示三种、二次确认、底部面板 */
function FeedbackInner() {
  const toast = useToast();
  const [dlg, setDlg] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <div className={s.demoPad}>
      <div className={s.demoButtons}>
        <Button kind="ghost" size="s" onClick={() => toast.show('已保存 · 3 组')}>成功提示</Button>
        <Button kind="ghost" size="s" onClick={() => toast.show('保存失败，数据还在本机', { kind: 'error' })}>失败提示</Button>
        <Button kind="ghost" size="s" onClick={() => toast.show('已删除这次训练', { action: { label: '撤销', run: () => toast.show('已恢复') } })}>可撤销</Button>
        <Button kind="danger" size="s" onClick={() => setDlg(true)}>删除训练</Button>
        <Button kind="neutral" size="s" onClick={() => setSheet(true)}>打开面板</Button>
      </div>
      {/* 和记录页详情里的真流程一致：二次确认、不可撤销（ia §1.8）；「可撤销」那一条只是 Toast 组件自己的能力演示 */}
      <Dialog open={dlg} onClose={() => setDlg(false)} tone="danger" icon="trash" title="删除这次训练？" confirm="删除"
        onConfirm={() => { setDlg(false); toast.show('已删除 10月3日 周六 的训练'); }}>
        <p>删除后，近 7 天容量、恢复度、趋势和新纪录都会重新计算，不能撤销。</p>
      </Dialog>
      {sheet && <Sheet title="中下胸" meta="大肌群" onClose={() => setSheet(false)}>
        <PhaseSegments phase="recovering" />
        <SheetBlock label="近 7 天容量"><LandmarkRuler value={7.5} mev={8} mav={16} mrv={22} /></SheetBlock>
      </Sheet>}
    </div>
  );
}
export function FeedbackDemo() {
  return <div className={s.demoCol}><Stage label="反馈演示"><FeedbackInner /></Stage>
    <Note>对话框打开时焦点进入、Tab 在框内循环、Esc 关闭，关闭后焦点回到「删除训练」；面板同理，点遮罩也能关。</Note></div>;
}

/** 记组：预填 → 完成（一次点击）→ 自动开始组间休息（结束时间戳）→ ±15 / 跳过 → 下一组 */
interface SetState { weight: string; reps: string; done: boolean }
function SessionInner({ f }: { f: Fixtures }) {
  const toast = useToast();
  const it = f.items[0];
  const rest = 180;
  const w0 = it?.suggestion.weightKg != null ? String(it.suggestion.weightKg) : '';
  const [sets, setSets] = useState<SetState[]>(() => Array.from({ length: it?.sets ?? 3 }, () => ({ weight: w0, reps: String(it?.repRange[1] ?? 8), done: false })));
  const [editing, setEditing] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null), [dockOpen, setDockOpen] = useState(true);
  const left = useCountdown(end);
  const cur = sets.findIndex((x) => !x.done);
  const err = (x: SetState): { msg: string; field: 'weight' | 'reps' } | undefined => {
    const n = Number(x.weight);
    if (x.weight && (!/^\d+(\.\d+)?$/.test(x.weight) || n > 500)) return { msg: '最多 500 kg', field: 'weight' };
    if (x.reps && (!/^\d+$/.test(x.reps) || Number(x.reps) < 1 || Number(x.reps) > 100)) return { msg: '1–100 次', field: 'reps' };
  };
  const patch = (i: number, k: 'weight' | 'reps', v: string) => setSets((xs) => xs.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const done = (i: number) => {
    setSets((xs) => xs.map((x, j) => j === i ? { ...x, done: true } : x));
    setEditing(null);
    if (editing === i) { toast.show(`已修改第 ${i + 1} 组`); return; }
    const last = sets.filter((x) => !x.done).length === 1;
    if (last) { setEnd(null); toast.show('这个动作练完了'); } else { setEnd(Date.now() + rest * 1000); setDockOpen(true); }
  };
  return (
    <Screen label="训练中">
      <TopBar title="训练中" sub={<Num size="s" value="12:40" />} onBack={() => {}} trailing={<Button kind="ghost" size="s">结束</Button>} />
      <div className={s.sessionBody}>
        <ExerciseRow name={it?.name ?? '杠铃卧推'} detail={`${it?.sets ?? 3} × ${(it?.repRange ?? [6, 8]).join('–')} · 休息 ${clock(rest)}`} weight={it?.suggestion.weightKg ?? null}
          status={cur < 0 ? 'done' : 'current'} sets={[sets.filter((x) => x.done).length, sets.length]} />
        {sets.map((x, i) => (
          <SetRow key={i} index={i + 1} weight={x.weight} reps={x.reps} error={err(x)?.msg} errorField={err(x)?.field}
            status={editing === i ? 'editing' : x.done ? 'done' : i === cur ? 'current' : 'todo'}
            onChange={(k, v) => patch(i, k, v)} onDone={() => done(i)} onEdit={() => setEditing(i)} />
        ))}
        <button type="button" className={s.reset} onClick={() => { setSets((xs) => xs.map((x) => ({ ...x, done: false }))); setEnd(null); }}>重来</button>
      </div>
      {end != null && <div className={s.restDock}><RestDock remaining={left} total={rest} open={dockOpen} onToggle={setDockOpen}
        onAdjust={(d) => setEnd((e) => Math.max(Date.now(), (e ?? Date.now()) + d * 1000))} onSkip={() => { setEnd(null); setDockOpen(false); }} /></div>}
    </Screen>
  );
}
export function SessionDemo({ f }: { f: Fixtures }) {
  return <div className={s.demoCol}><Stage tall label="记组演示"><SessionInner f={f} /></Stage>
    <Note>当前组预填建议值，点「完成」一次就记完；完成后自动开始组间休息（按结束时间戳算，切后台回来仍然准）。休息面板点「收起」缩成小胶囊，再点长回来（M02）。把重量改成 620 看行内报错；已完成的组点铅笔修改。</Note></div>;
}

/** 导航：点切换（小胶囊滑过去、图标由暗到亮画出）；开始训练出暗色整圈，+1 组推进荧光；开始休息后小胶囊里出现实线描边与剩余时间 */
function NavInner() {
  const [tab, setTab] = useState<Tab>('home');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(0);
  const [end, setEnd] = useState<number | null>(null);
  const left = useCountdown(end), total = 120;
  const resting = end != null && left > 0;
  return (
    <Screen label="导航演示">
      <div className={s.navDemoBody}>
        <div className={s.demoButtons}>
          {started ? <Button kind="ghost" size="s" disabled={done >= 14} onClick={() => setDone((d) => Math.min(14, d + 1))}>完成 1 组（{done}/14）</Button>
            : <Button kind="ghost" size="s" onClick={() => setStarted(true)}>开始训练</Button>}
          <Button kind="ghost" size="s" onClick={() => { setStarted(false); setDone(0); setEnd(null); }}>重置</Button>
          <Button kind="ghost" size="s" onClick={() => setEnd(resting ? null : Date.now() + total * 1000)}>{resting ? '结束休息' : '开始休息 2:00'}</Button>
        </div>
        <Note>{started ? `外圈 = 整场训练（暗色整圈），荧光 = 已完成 ${done} / 14 组，最后一组走满` : '还没开始训练：不画外圈'}；休息中选中项写剩余时间，小胶囊里的实线描边跟着小胶囊滑、按剩余比例平滑收短。</Note>
      </div>
      <Nav selected={tab} onSelect={(t) => setTab(t)} progress={done / 14} started={started} rest={resting ? clock(left) : undefined} restEndAt={resting ? end! : undefined} restTotalMs={total * 1000} />
    </Screen>
  );
}
export function NavDemo() {
  return <div className={s.demoCol}><Stage label="导航演示"><NavInner /></Stage></div>;
}

/** 整页：身体页的放大镜（按住胶囊列上下滑），首页的第一屏 */
export function MagnifierDemo({ f }: { f: Fixtures }) {
  return (
    <div className={s.demoRow}>
      <div className={s.demoCol}><Stage tall label="身体页"><BodyPage scenario="done-today" now={f.now} initialFocus={null} /></Stage>
        <Note>胶囊列上竖向短滑 = 滚动页面；按住 150 ms 不动进入放大镜，上下滑逐个放大，焦点胶囊左边写组数、恢复度与时相，名称在右（手指底下）。松手只退出；轻点胶囊或人体上的肌肉打开详情。正面 / 背面、男 / 女切换是抽卡。</Note></div>
      <div className={s.demoCol}><Stage tall label="首页"><HomePage scenario="plain-prescription" now={f.now} /></Stage>
        <Note>首页第一屏：今天练什么、第一个动作的建议重量、开始训练（这一屏唯一的荧光）。</Note></div>
    </div>
  );
}

/** 回到顶端：往下滑过一屏，右下角出现按钮；点了平滑滚回顶，按钮收起 */
function BackTopDemo({ f }: { f: Fixtures }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={s.demoCol}>
      <Stage tall label="回到顶端演示">
        <Screen label="回到顶端">
          <div ref={ref} className={s.headerDemoScroll}>
            <PageHeader title="今日处方"><p className="milo-text-caption">10月3日 周六</p></PageHeader>
            <div className={s.headerDemoBody}>
              {[...f.items, ...f.items, ...f.items, ...f.items].map((x, i) => <ExerciseRow key={i} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg} />)}
            </div>
          </div>
          <BackToTop target={ref} />
        </Screen>
      </Stage>
      <Note>往下滑过一屏：右下角从下往上弹出「回到顶端」；点一下平滑滚回顶，按钮收起。页头跟着内容滑走，不留细标题栏。</Note>
    </div>
  );
}

/** 钢板日历：往下滑，亮区从右移到中间、左边，两侧漏光换边，钢面一道淡反光扫过（滚动位置驱动，滑回去还原） */
function PlateDemo({ f }: { f: Fixtures }) {
  return (
    <div className={s.demoCol}>
      <Stage tall label="钢板日历演示">
        <Screen label="钢板日历">
          <div className={s.headerDemoScroll}>
            <PageHeader title="记录" />
            <div className={s.headerDemoBody}>
              <SteelPlate months={dotMonths(f.trainedDays, f.now)} />
              {f.items.concat(f.items).map((x, i) => <ExerciseRow key={i} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg} />)}
            </div>
          </div>
        </Screen>
      </Stage>
      <Note>往下滑：板后那团软光从右（静止）移到中间、左边，孔的亮暗跟着换；亮区靠哪边，那边的板外缘漏光；钢面一道淡反光慢慢扫过。滑回去还原。减少动态效果 / 不支持滚动驱动动画的浏览器里是静止的。</Note>
    </div>
  );
}

export function ChartDemo({ f }: { f: Fixtures }) {
  const [sel, setSel] = useState<number | null>(null);
  return <div className={s.demoPad}><TrendChart points={f.trends.normal} selected={sel} onSelect={setSel} /><Note>点一个点，或聚焦后用 ← → 逐次查看。</Note></div>;
}

export function WeekDemo({ f }: { f: Fixtures }) {
  const [sel, setSel] = useState<number | null>(null);
  return <div className={s.demoPad}><WeekStrip days={f.week.map((d, i) => ({ ...d, selected: sel === i, onClick: () => setSel(i) }))} /></div>;
}

/** M07 交错入场：重放看列表依次弹入 */
function CascadeDemo({ f }: { f: Fixtures }) {
  const [k, setK] = useState(0);
  return (
    <div className={s.demoPad}>
      <Button kind="ghost" size="s" icon="refresh" onClick={() => setK((x) => x + 1)}>重放</Button>
      <Cascade replayKey={k}>
        {f.items.map((x) => <ExerciseRow key={x.exerciseId} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg} />)}
      </Cascade>
    </div>
  );
}

/** M03 共享元素展开：点一行，卡片、名称、重量原地变形成详情；返回变回去 */
function ExpandInner({ f }: { f: Fixtures }) {
  const [open, setOpen] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);  // 只有正在展开 / 收起的那一行有共享名
  const items = f.items.slice(0, 4), it = items.find((x) => x.exerciseId === open);
  return (
    <Screen label="共享元素">
      <div className={s.expandList}>
        {items.map((x) => (
          <ExerciseRow key={x.exerciseId} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg}
            sharedId={active === x.exerciseId && open !== x.exerciseId ? x.exerciseId : undefined}
            onClick={() => { flushSync(() => setActive(x.exerciseId)); sharedTransition(() => setOpen(x.exerciseId)); }} />
        ))}
      </div>
      {it && (
        <SharedDetail id={it.exerciseId} title={it.name} sub={`${it.sets} × ${it.repRange.join('–')} · 休息 ${clock(it.restSec ?? 180)}`}
          hero={it.suggestion.weightKg != null ? <Num size="hero" value={it.suggestion.weightKg} unit="kg" /> : undefined}
          onBack={() => sharedTransition(() => setOpen(null))}>
          <span className="milo-text-body">{it.suggestion.reason.text || `选一个能干净做完 ${it.repRange[0]} 次的重量`}</span>
        </SharedDetail>
      )}
    </Screen>
  );
}

/** 外层（App）已加载的 @font-face 规则：注入规范板，让它用 App 自带的字体，不去连 Google Fonts */
function appFontFaces() {
  return [...document.styleSheets].flatMap((sh) => { try { return [...sh.cssRules]; } catch { return []; } })
    .filter((r) => r instanceof CSSFontFaceRule).map((r) => r.cssText).join('\n');
}

/** 图标网格规范板（design/icon-grid/index.html）整页内嵌：同源 iframe，高度跟着内容走；字体用 App 自带的 */
export function IconGridBoard() {
  const ref = useRef<HTMLIFrameElement>(null), [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    let ro: ResizeObserver | null = null;
    const fit = () => {
      const doc = el.contentDocument;
      if (!doc?.body) return;
      if (!doc.getElementById('app-fonts')) {
        const st = doc.createElement('style');
        st.id = 'app-fonts';
        // 族名已由 vite.config.ts 的 milo-font-alias 去掉「 Variable」后缀，和规范板里写的 'Noto Sans SC' / 'JetBrains Mono' 对得上，不用再改名
        st.textContent = appFontFaces();
        doc.head.appendChild(st);
      }
      const measure = () => setH(doc.documentElement.scrollHeight);
      measure(); ro?.disconnect(); ro = new ResizeObserver(measure); ro.observe(doc.body);
    };
    el.addEventListener('load', fit); fit();
    return () => { el.removeEventListener('load', fit); ro?.disconnect(); };
  }, []);
  return <iframe ref={ref} className={s.gridFrame} src="/design/icon-grid/index.html" title="图标网格规范" style={h ? { height: h } : undefined} />;
}

/** 小牛交互演示：切牛龄、切状态，看动效 */
function MascotDemo() {
  const [stage, setStage] = useState<MascotStage>('newborn'), [mood, setMood] = useState<MascotMood>('idle');
  return (
    <div className={s.demoPad}>
      <div className={s.demoButtons}>{MASCOT_STAGES.map((st) => <Button key={st} kind={stage === st ? 'neutral' : 'ghost'} size="s" onClick={() => setStage(st)}>{STAGE_NAME[st]}</Button>)}</div>
      <div className={s.demoButtons}>{MASCOT_MOODS.map((m) => <Button key={m} kind={mood === m ? 'neutral' : 'ghost'} size="s" onClick={() => setMood(m)}>{MOOD_NAME[m]}</Button>)}</div>
      <div className={s.mascotStage}><Mascot stage={stage} mood={mood} animate title={`${STAGE_NAME[stage]} · ${MOOD_NAME[mood]}`} /></div>
      <Note>5 种牛龄 × 6 种状态（PNG）。前四种单眼，Milo 双眼发光；速度线、z、碎屑、Milo 的泛光 / 星光 / 扫光都由代码生成；换状态时比例与地面线不变。系统开启「减少动态效果」时静止。</Note>
    </div>
  );
}

/** 奖励弹窗演示：①直接看每种奖励的完整编排；②「保存下一次训练」——演示用户（等级曲线模拟里的进阶用户）一次次往下练，
 *  引擎算出这次达成了什么，只弹优先级最高的一个，其余进消息 */
function RewardInner() {
  const [reward, setReward] = useState<Reward | null>(null), [queued, setQueued] = useState(0), [pro, setPro] = useState(false);
  const [i, setI] = useState(-1), [log, setLog] = useState<string[]>([]);
  const samples = sampleRewards();
  const play = (k: keyof typeof samples) => { const r = samples[k]; setQueued(k === 'stage' ? 2 : 0); setReward(pro ? { ...r, niujin: Math.round(r.niujin * GROWTH_CONFIG.niujin.proRate) } : r); };
  const step = () => {
    const n = Math.min(i + 1, growthDemoUser().history.length - 1);
    const r = afterSession(n, pro);
    setI(n);
    setLog((l) => [`第 ${r.week} 周 · ${STAGE_LABEL[r.g.stage]} ${r.g.sub} 级 · 连胜 ${r.g.streak.weeks} 周 · 牛劲 ${r.g.niujin.balance}${r.popup ? ` · 弹：${REWARD_NAME[r.popup.kind]}` : ''}${r.messages.length ? ` · 消息 ${r.messages.length} 条` : ''}`, ...l].slice(0, 5));
    if (r.popup) { setQueued(r.messages.filter((m) => m.kind !== 'week').length); setReward(r.popup); }
  };
  /** 一直练到下一次有弹窗为止 */
  const skipTo = () => {
    const u = growthDemoUser();
    for (let n = i + 1; n < u.history.length; n++) {
      const r = afterSession(n, pro);
      if (r.popup) { setI(n); setLog((l) => [`第 ${r.week} 周 · ${STAGE_LABEL[r.g.stage]} ${r.g.sub} 级 · 连胜 ${r.g.streak.weeks} 周 · 牛劲 ${r.g.niujin.balance} · 弹：${REWARD_NAME[r.popup!.kind]}`, ...l].slice(0, 5)); setQueued(r.messages.filter((m) => m.kind !== 'week').length); setReward(r.popup); return; }
    }
  };
  return (
    <div className={s.demoPad}>
      <div className={s.demoButtons}>{(['stage', 'milo', 'pr', 'streak', 'level', 'cycle'] as const).map((k) => (
        <Button key={k} kind="ghost" size="s" onClick={() => play(k)}>{k === 'milo' ? '升段 · Milo' : REWARD_NAME[k]}</Button>
      ))}</div>
      <div className={s.demoButtons}>
        <Button kind="neutral" size="s" onClick={step}>保存下一次训练</Button>
        <Button kind="ghost" size="s" onClick={skipTo}>练到下一个奖励</Button>
        <Button kind={pro ? 'neutral' : 'ghost'} size="s" onClick={() => setPro(!pro)}>{pro ? 'Pro 会员' : '免费用户'}</Button>
      </div>
      <div className={s.rewardLog}>{log.length ? log.map((l, k) => <p key={k} className="milo-text-caption">{l}</p>) : <p className="milo-text-caption">还没开始练。点「保存下一次训练」或「练到下一个奖励」。</p>}</div>
      <RewardModal reward={reward} pro={pro} queued={queued} onClose={() => setReward(null)} />
    </div>
  );
}
function RewardDemo() {
  return <div className={s.demoCol}><Stage tall label="奖励演示"><RewardInner /></Stage>
    <Note>升段约 2.5 秒：旧形态蓄力 → 闪屏、冲击波、碎屑、震屏 → 新形态弹出 → 文字弹簧入场 → 牛劲码表滚动 → 五段路径长到新段 → 「收下」按钮带光晕。点一下跳过；手机上会振动；系统开启「减少动态效果」时只淡入定格。</Note></div>;
}

/** 等级曲线：横轴周数（0–180），纵轴 15 级；三条线是三类合成用户，空心点是进阶用户的目标节奏，竖线是当前拖到的级 */
function LevelCurve({ users, target, lv }: { users: Record<'novice' | 'intermediate' | 'advanced', { reach: (number | null)[] }>; target: number[]; lv: number }) {
  const W = 300, H = 150, X = (w: number) => 24 + (w / 180) * (W - 32), Y = (l: number) => H - 18 - (l / 14) * (H - 30);
  const line = (r: (number | null)[]) => r.map((w, l) => (w == null ? null : `${X(w).toFixed(1)},${Y(l).toFixed(1)}`)).filter(Boolean).join(' ');
  return (
    <svg className={s.curve} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="等级曲线：三类用户到达每一级的周数">
      {[0, 3, 6, 9, 12].map((l) => <g key={l}><line className={s.curveGrid} x1={24} x2={W - 8} y1={Y(l)} y2={Y(l)} /><text className={s.curveTick} x={2} y={Y(l) + 3} fontSize={7.5}>{STAGE_LABEL[levelInfo(l).stage]}</text></g>)}
      {[0, 26, 52, 104, 156].map((w) => <text key={w} className={s.curveTick} x={X(w) - 6} y={H - 4} fontSize={7.5}>{w}周</text>)}
      <line className={s.curveNow} x1={24} x2={W - 8} y1={Y(lv)} y2={Y(lv)} />
      <polyline className={s.curveAdv} points={line(users.advanced.reach)} />
      <polyline className={s.curveNov} points={line(users.novice.reach)} />
      <polyline className={s.curveMid} points={line(users.intermediate.reach)} />
      {target.map((w, l) => <circle key={l} className={s.curveTarget} cx={X(w)} cy={Y(l)} r={2.4} />)}
      <text className={s.curveKey} x={W - 92} y={14} fontSize={8}><tspan className={s.kNov}>新手</tspan> · <tspan className={s.kMid}>进阶</tspan> · <tspan className={s.kAdv}>老手</tspan></text>
    </svg>
  );
}

/** 牛龄拖条：从牛犊 1 拖到 Milo 3，徽章、成长条、小牛一起变；下面是三类合成用户到达每一级的周数（等级曲线模拟） */
function AgeInner() {
  const [lv, setLv] = useState(4);
  const { stage, sub } = levelInfo(lv);
  const L = GROWTH_CONFIG.levels, need = lv < 14 ? L[lv + 1] - L[lv] : 0;
  const users = curve.users as Record<'novice' | 'intermediate' | 'advanced', { reach: (number | null)[] }>;
  // 「再涨几 kg」：用演示用户当前的引擎结论换算（每点成长值约等于主项预估 1RM 涨多少 kg），进度 45% 时还差 55%
  const ns = growthSample().next!, lift = ns.lift, kgPerPoint = lift ? lift.kg / ns.need : 0;
  return (
    <div className={s.demoPad}>
      <div className={s.ageStage}><Mascot stage={stage} mood="idle" animate /></div>
      <AgeBadge stage={stage} sub={sub} />
      <GrowthBar stage={stage} sub={sub} progress={0.45} lift={need && lift ? { name: lift.name, kg: Math.ceil(need * 0.55 * kgPerPoint * 2) / 2 } : null} cycles={need ? Math.ceil((need * 0.55) / GROWTH_CONFIG.cyclePoints) : 0} />
      <input className={s.ageRange} type="range" min={0} max={14} value={lv} onChange={(e) => setLv(Number(e.target.value))} aria-label="牛龄（15 级）" />
      <LevelCurve users={users} target={curve.target} lv={lv} />
      <p className="milo-text-caption">到达这一级（成长值 ≥ {L[lv]}）的周数：新手 {users.novice.reach[lv] ?? '—'} · 进阶 {users.intermediate.reach[lv] ?? '—'} · 老手 {users.advanced.reach[lv] ?? '—'}（目标：进阶 {curve.target[lv]}）</p>
    </div>
  );
}
function AgeDemo() {
  return <div className={s.demoCol}><Stage tall label="牛龄演示"><AgeInner /></Stage>
    <Note>15 级门槛由等级曲线模拟反推：进阶用户稳定训练，小牛约 2 个月、壮牛约 6 个月、公牛约 12 个月、Milo 约 24 个月；新手更快，老手靠周期和 PR 也能稳步升级。成长条下面那句「再涨几 kg」由引擎按当前主项反推。</Note></div>;
}

/** 付费墙流程：选方案 → 开通（演示，不扣费）→ Milo 庆祝 → 会员态 */
function PaywallInner() {
  const [plan, setPlan] = useState<'month' | 'year' | 'trial'>('year'), [step, setStep] = useState<'choose' | 'success' | 'member'>('choose');
  return (
    <div className={s.demoPad}>
      <Paywall plan={plan} onPlan={setPlan} success={step === 'success'} member={step === 'member'}
        onBuy={() => setStep(step === 'choose' ? 'success' : step === 'success' ? 'member' : 'choose')} />
    </div>
  );
}
function PaywallDemo() {
  return <div className={s.demoCol}><Stage tall label="会员演示"><PaywallInner /></Stage><Note>演示模式：全部权益已解锁，开通走假成功，不收集支付信息；在会员态点「管理订阅」回到未开通。</Note></div>;
}

export const DEMOS: Record<string, (f: Fixtures) => ReactNode> = {
  RewardCard: () => <RewardDemo />,
  AgeBadge: () => <AgeDemo />,
  Paywall: () => <PaywallDemo />,
  Mascot: () => <MascotDemo />,
  Icon: () => <IconGridBoard />,
  ExerciseRow: (f) => <CascadeDemo f={f} />,
  SharedDetail: (f) => <div className={s.demoCol}><Stage tall label="共享元素演示"><ExpandInner f={f} /></Stage><Note>点一个动作：卡片原地长满屏，名称和重量飞到详情的位置并放大；点返回变回去。</Note></div>,
  Button: () => <ButtonDemo />,
  OptionCard: () => <FormDemo />,
  DialogCard: () => <FeedbackDemo />,
  SetRow: (f) => <SessionDemo f={f} />,
  Nav: () => <NavDemo />,
  CapsuleRail: (f) => <MagnifierDemo f={f} />,
  BackToTop: (f) => <BackTopDemo f={f} />,
  SteelPlate: (f) => <PlateDemo f={f} />,
  TrendChart: (f) => <ChartDemo f={f} />,
  WeekStrip: (f) => <WeekDemo f={f} />,
};
