/** /lab：参考要素的落地记录（docs/refs-elements.md）。2026-10-04 用户选定：
 *  A4 + 底层流体噪点渐变 · T4 改荧光热 · I3（iconref2 倾斜 + iconmotionref1 加载轨迹）· R1 改版 · E1–E5 · M02–M08。
 *  这里放的都是组件库里的正式组件，规格以 DESIGN.md 为准；音乐律动只在这里用麦克风演示。 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Button, Cascade, DotCalendar, ExerciseRow, FluidBackdrop, GiantNumber, Icon, ICONS, Nav, Num, RestDock, ScreenAtmosphere, Sheet, SheetBlock, StepRing, TrendChart,
  WeekBars, dotMonths, LandmarkRuler, PhaseSegments, clock, type Tab,
} from '../components';
import { PALETTE } from '../components/thermal';
import { BodyPage } from '../pages/BodyPage';
import { HomePage } from '../pages/HomePage';
import { fixtures } from '../playground/fixtures';
import { Stage } from '../playground/Stage';
import { T } from '../styles/tokens.gen';
import s from './lab.module.css';

function Block({ id, title, src, children }: { id: string; title: string; src: string; children: ReactNode }) {
  return (
    <figure className={s.block} id={id}>
      <figcaption><b className="milo-text-heading">{id} · {title}</b><span className="milo-text-caption">{src}</span></figcaption>
      {children}
    </figure>
  );
}

/** 麦克风电平（0–1）：演示「随音乐律动」。网页拿不到别的 App 正在放的音乐，只能听麦克风，见 refs-elements.md */
function useMicLevel() {
  const [on, setOn] = useState(false), [err, setErr] = useState('');
  const level = useRef(0), stop = useRef<() => void>(() => {});
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = new AudioContext(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
      an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      let raf = 0;
      const loop = () => { an.getByteTimeDomainData(buf); let sum = 0; for (const v of buf) sum += ((v - 128) / 128) ** 2; level.current = Math.min(1, Math.sqrt(sum / buf.length) * 4); raf = requestAnimationFrame(loop); };
      loop();
      stop.current = () => { cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); void ac.close(); level.current = 0; };
      setOn(true); setErr('');
    } catch (e) { setErr(`没拿到麦克风：${(e as Error).message}`); }
  };
  useEffect(() => () => stop.current(), []);
  const read = useMemo(() => () => level.current, []);
  return { on, err, read, toggle: () => (on ? (stop.current(), setOn(false)) : void start()) };
}

/** R1：未开始（无环）→ 开始训练（画出一整圈暗色轨道 = 整场训练）→ 每完成一组荧光往前走 → 最后一组走满；休息时胶囊内实线平滑收短 */
function RingDemo() {
  const [started, setStarted] = useState(false), [done, setDone] = useState(0), [end, setEnd] = useState<number | null>(null);
  const total = 90 * 1000;
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!end) return; const id = setInterval(() => setNow(Date.now()), T['motion/base']); return () => clearInterval(id); }, [end]);
  const left = end ? Math.max(0, Math.ceil((end - now) / 1000)) : 0;
  const rest = end && left > 0 ? clock(left) : undefined;
  return (
    <div className={s.card}>
      <div className={s.navBox}><Nav selected="home" progress={done / 14} started={started} rest={rest} restEndAt={rest ? end! : undefined} restTotalMs={total} /></div>
      <div className={s.btnRow}>
        <button type="button" disabled={started} onClick={() => { setStarted(true); setDone(0); setEnd(null); }}>开始训练</button>
        <button type="button" disabled={!started || done >= 14} onClick={() => { setDone((d) => Math.min(14, d + 1)); setEnd(Date.now() + total); setNow(Date.now()); }}>完成 1 组（{done}/14）</button>
        <button type="button" onClick={() => { setStarted(false); setDone(0); setEnd(null); }}>重置</button>
      </div>
    </div>
  );
}

/** I3：点导航切换，选中项的图标笔画由暗到亮画出来（iconmotionref1） */
function NavPick() {
  const [tab, setTab] = useState<Tab>('home');
  return <div className={s.navBox}><Nav selected={tab} progress={8 / 14} started onSelect={(x) => setTab(x)} /></div>;
}

function Ramp() {
  const stops = PALETTE.lime.map((k, i, a) => `var(--milo-prim-${k}) ${(i / (a.length - 1)) * 100}%`).join(', ');
  return (
    <div className={s.ramp}>
      <i style={{ background: `linear-gradient(90deg, ${stops})` }} />
      <span className="milo-text-micro"><b>未练</b><b>最低</b><b>适宜</b><b>上限</b><b>超量</b></span>
    </div>
  );
}

function RestDockDemo() {
  const [open, setOpen] = useState(false);
  const [end] = useState(() => Date.now() + 95 * 1000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), T['motion/base']); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.ceil((end - now) / 1000));
  return <Stage short label="M02"><div className={s.dockArea}><RestDock remaining={left} total={180} open={open} onToggle={setOpen} onAdjust={() => {}} onSkip={() => setOpen(false)} /></div></Stage>;
}

function SheetDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Stage label="M05">
      <div className={s.sheetArea}>
        {!open && <div className={s.sheetReopen}><Button kind="neutral" size="s" onClick={() => setOpen(true)}>打开面板</Button></div>}
        {open && <Sheet title="中下胸" meta="大肌群" onClose={() => setOpen(false)}><PhaseSegments phase="recovering" /><SheetBlock label="近 7 天容量"><LandmarkRuler value={7.5} mev={8} mav={16} mrv={22} /></SheetBlock>
          <p className="milo-text-caption">拖抓手：两档吸附、拉过头越拉越重、快速下甩关闭。</p></Sheet>}
      </div>
    </Stage>
  );
}

export function Lab({ now }: { now: number }) {
  const f = useMemo(() => fixtures(now), [now]);
  const mic = useMicLevel();
  const [sel, setSel] = useState<number | null>(f.trends.normal.length - 1);
  const [k, setK] = useState(0);
  return (
    <div className={s.page}>
      <header className={s.hero}>
        <h1 className="milo-text-title-l">参考要素 · 已选定</h1>
        <p className={`milo-text-body ${s.muted}`}>2026-10-04 的选择：A4 + 底层流体噪点渐变 · T4 改荧光热 · I3 倾斜图标 + 加载轨迹 · R1 改版 · E1–E5 · M02–M08。
          下面都是组件库里的正式组件，已经用在 App 和 /playground 里；说明见 docs/refs-elements.md。</p>
      </header>

      <section className={s.section}>
        <h2 className="milo-text-title-m">A · 主角卡噪点 + 底层流体背景</h2>
        <div className={s.row}>
          <Block id="A4" title="首页（Tab 根页）" src="底层光斑缓慢漂移 + 颗粒；主角卡右上荧光噪点渐变；开始训练带光晕边框（M06）">
            <ScreenAtmosphere.Provider value={<FluidBackdrop level={mic.on ? mic.read : undefined} />}>
              <Stage tall label="A4"><HomePage scenario="plain-prescription" now={now} /></Stage>
            </ScreenAtmosphere.Provider>
            <div className={s.btnRow}><button type="button" onClick={mic.toggle}>{mic.on ? '停止律动' : '随声音律动（麦克风演示）'}</button></div>
            {mic.err && <span className="milo-text-caption">{mic.err}</span>}
          </Block>
          <Block id="T4" title="荧光热 · 扫描线" src="身体页的正式渲染：热核 + 扩散 + 扫描线与颗粒；胶囊量尺同一条色带；按住胶囊列仍可放大">
            <Stage tall label="T4"><BodyPage scenario="rest-day" now={now} initialFocus={null} /></Stage>
            <Ramp />
          </Block>
        </div>
      </section>

      <section className={s.section}>
        <h2 className="milo-text-title-m">I · 图标（iconref2 倾斜断笔 + iconmotionref1 加载轨迹）</h2>
        <div className={s.card} id="I3">
          <div className={s.icons}>{ICONS.map((n) => <span key={n} className={s.iconCell}><Icon name={n} /><i>{n}</i></span>)}</div>
          <span className="milo-text-caption">点导航切换：选中项的每一笔从起点画到终点，已画出的部分由暗到亮（笔头最亮），画满后整枚提亮定格</span>
          <NavPick />
        </div>
      </section>

      <section className={s.section}>
        <h2 className="milo-text-title-m">R · 进度环（R1 改版）</h2>
        <Block id="R1" title="开始训练 → 轨道 → 进度 → 休息" src="未开始不画环；开始训练画出一整圈暗色轨道（= 整场训练）；每完成一组荧光实线往前走一段，最后一组走满；休息时小胶囊里一道实线跟着小胶囊滑、按帧平滑收短"><RingDemo /></Block>
      </section>

      <section className={s.section}>
        <h2 className="milo-text-title-m">E · 版式元素</h2>
        <div className={s.row}>
          <Block id="E1" title="点阵日历" src="ref1 · 记录页顶部"><div className={s.card}><DotCalendar months={dotMonths(f.trainedDays, f.now)} /></div></Block>
          <Block id="E2" title="环中数字" src="ref1 · 训练中的动作序号与组数"><div className={s.card}>
            <StepRing n={1} ratio={1} done title={f.items[0]?.name ?? '杠铃深蹲'} sub="3 / 3 组" />
            <StepRing n={2} ratio={1 / 3} title={f.items[1]?.name ?? '窄握下拉'} sub="第 2 / 3 组" />
            <StepRing n={3} ratio={0} title={f.items[2]?.name ?? '杠铃硬拉'} sub="待做" /></div></Block>
          <Block id="E3" title="竖向胶囊量表" src="ref3 · 增量页近 8 周组数"><div className={s.card}><WeekBars weeks={f.weekBars} /></div></Block>
          <Block id="E4" title="超大渐变数字" src="ref5 · 结算页"><div className={s.card}><GiantNumber value="+5" unit="kg" caption="杠铃深蹲 · 预估 1RM 新高" /></div></Block>
          <Block id="E5" title="曲线 + 游标 + 码表（M04）" src="ref2 / ref4 / ref5 · 按住横向拖，吸到最近一次，数字按位滚动"><div className={s.card}><TrendChart points={f.trends.normal} selected={sel} onSelect={setSel} /></div></Block>
        </div>
      </section>

      <section className={s.section}>
        <h2 className="milo-text-title-m">M · 动效</h2>
        <div className={s.row}>
          <Block id="M02" title="休息小胶囊 ↔ 面板" src="点小胶囊原地长成面板，「收起」缩回"><RestDockDemo /></Block>
          <Block id="M05" title="阻尼底部面板" src="两档吸附、橡皮筋、按速度判档"><SheetDemo /></Block>
          <Block id="M06" title="光晕边框" src="只给首页「开始训练」"><div className={s.card}><div className={s.glowPad}><Button glow>开始训练</Button></div></div></Block>
          <Block id="M07" title="弹簧交错流" src="列表依次弹入"><div className={s.card}>
            <div className={s.btnRow}><button type="button" onClick={() => setK((x) => x + 1)}>重放</button></div>
            <Cascade replayKey={k}>{f.items.map((x) => <ExerciseRow key={x.exerciseId} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg} />)}</Cascade></div></Block>
          <Block id="M08" title="按下内阴影 + 弹簧回弹" src="所有可点的件"><div className={s.card}><Button kind="neutral">完成</Button><Num size="s" value="M03 见 /playground · SharedDetail" /></div></Block>
        </div>
      </section>
    </div>
  );
}
