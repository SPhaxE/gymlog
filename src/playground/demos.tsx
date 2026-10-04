/** Playground 的交互演示：真实状态、真实动效（矩阵里是静态展示）。每个演示挂在一个组件小节下面。 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Banner, Button, Cascade, Dialog, ExerciseRow, RestDock, SharedDetail, sharedTransition, Nav, NumberField, OptionCard, OptionGroup, ProgressSteps, Sheet, SheetBlock, Stepper, TopBar, TrendChart, WeekStrip,
  LandmarkRuler, PhaseSegments, Num, Screen, SetRow, clock, useCountdown, useToast, type Tab,
} from '../components';
import { BodyPage } from '../pages/BodyPage';
import { HomePage } from '../pages/HomePage';
import { T } from '../styles/tokens.gen';
import type { Fixtures } from './fixtures';
import { Stage } from './Stage';
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
      <Dialog open={dlg} onClose={() => setDlg(false)} tone="danger" icon="trash" title="删除这次训练？" confirm="删除"
        onConfirm={() => { setDlg(false); toast.show('已删除这次训练', { action: { label: '撤销', run: () => toast.show('已恢复') } }); }}>
        近 7 天容量、恢复度、趋势和 PR 会重新计算。
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
  const err = (x: SetState) => { const n = Number(x.weight); return x.weight && (!/^\d+(\.\d+)?$/.test(x.weight) || n > 500) ? '重量范围 0–500 kg' : x.reps && (!/^\d+$/.test(x.reps) || Number(x.reps) < 1 || Number(x.reps) > 100) ? '次数范围 1–100' : undefined; };
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
          <SetRow key={i} index={i + 1} weight={x.weight} reps={x.reps} error={err(x)}
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
  const items = f.items.slice(0, 4), it = items.find((x) => x.exerciseId === open);
  return (
    <Screen label="共享元素">
      <div className={s.expandList}>
        {items.map((x) => (
          <ExerciseRow key={x.exerciseId} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg}
            sharedId={open === x.exerciseId ? undefined : x.exerciseId} onClick={() => sharedTransition(() => setOpen(x.exerciseId))} />
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
        st.textContent = `${appFontFaces()}\n:root { --font-ui: 'Noto Sans SC Variable', system-ui, sans-serif; --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace; }`;
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

export const DEMOS: Record<string, (f: Fixtures) => ReactNode> = {
  Icon: () => <IconGridBoard />,
  ExerciseRow: (f) => <CascadeDemo f={f} />,
  SharedDetail: (f) => <div className={s.demoCol}><Stage tall label="共享元素演示"><ExpandInner f={f} /></Stage><Note>点一个动作：卡片原地长满屏，名称和重量飞到详情的位置并放大；点返回变回去。</Note></div>,
  Button: () => <ButtonDemo />,
  OptionCard: () => <FormDemo />,
  DialogCard: () => <FeedbackDemo />,
  SetRow: (f) => <SessionDemo f={f} />,
  Nav: () => <NavDemo />,
  CapsuleRail: (f) => <MagnifierDemo f={f} />,
  TrendChart: (f) => <ChartDemo f={f} />,
  WeekStrip: (f) => <WeekDemo f={f} />,
};
