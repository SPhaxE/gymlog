/** 8motions.md 的八种动效形式，按 Milo 的 Token 改写（数值不照搬）。每个都是可以上手的演示。 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, ExerciseRow, IconButton, Num, PrescriptionHero, RestBar, Screen, clock, type Point } from '../components';
import { REGION_NAME } from '../data/demo';
import type { Fixtures } from '../playground/fixtures';
import { Stage } from '../playground/Stage';
import { T } from '../styles/tokens.gen';
import { SPRING, SPRING_SOFT } from './spring';
import s from './lab.module.css';

const springVars = { '--spring': SPRING.easing, '--spring-ms': `${SPRING.ms}ms`, '--soft': SPRING_SOFT.easing, '--soft-ms': `${SPRING_SOFT.ms}ms` } as CSSProperties;
export const SpringScope = ({ children }: { children: ReactNode }) => <div style={springVars}>{children}</div>;

/* M01 3D 倾斜光影：主角卡跟手微倾 ±5°，高光跟着手指，松手弹簧回正 */
export function TiltGlare({ f }: { f: Fixtures }) {
  const [tilt, setTilt] = useState<{ x: number; y: number; on: boolean }>({ x: 0.5, y: 0.5, on: false });
  const it = f.items[0];
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, on: true });
  };
  const st = { '--rx': `${(0.5 - tilt.y) * 10}deg`, '--ry': `${(tilt.x - 0.5) * 10}deg`, '--gx': `${tilt.x * 100}%`, '--gy': `${tilt.y * 100}%` } as CSSProperties;
  return (
    <div className={s.tiltWrap} onPointerMove={move} onPointerLeave={() => setTilt({ x: 0.5, y: 0.5, on: false })} onPointerUp={() => setTilt({ x: 0.5, y: 0.5, on: false })}>
      <div className={tilt.on ? s.tiltOn : s.tilt} style={st}>
        <PrescriptionHero order={1} region={REGION_NAME[it.region]} name={it.name} weight={it.suggestion.weightKg} sets={it.sets} reps={it.repRange}
          reason={it.suggestion.reason.text} last={f.home.lastWeight(it.exerciseId)} step={f.step} />
        <i className={s.glare} />
      </div>
    </div>
  );
}

/* M02 流体胶囊形变：休息小胶囊 → 原地长成休息面板（尺寸与圆角一起过渡），再点收回 */
export function FluidMorph() {
  const [open, setOpen] = useState(false);
  const [end] = useState(() => Date.now() + 95 * 1000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), T['motion/base']); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.ceil((end - now) / 1000)) || 95;
  return (
    <Stage short label="流体形变">
      <div className={s.morphArea}>
        <div className={open ? s.morphOpen : s.morph}>
          {!open && <button type="button" className={s.morphBtn} onClick={() => setOpen(true)}>休息 <b>{clock(left)}</b></button>}
          {open && <div className={s.morphBody}><RestBar remaining={left} total={180} onSkip={() => setOpen(false)} onAdjust={() => {}} />
            <button type="button" className={s.morphClose} onClick={() => setOpen(false)}>收起</button></div>}
        </div>
      </div>
    </Stage>
  );
}

/* M03 共享元素展开：列表里的动作行原地长成详情，返回时缩回原位（FLIP） */
export function SharedElement({ f }: { f: Fixtures }) {
  const box = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<{ i: number; r: DOMRect; open: boolean } | null>(null);
  const items = f.items.slice(0, 4);
  const openAt = (i: number, el: HTMLElement) => {
    const b = box.current!.getBoundingClientRect(), r = el.getBoundingClientRect();
    setSel({ i, r: new DOMRect(r.left - b.left, r.top - b.top, r.width, r.height), open: false });
    requestAnimationFrame(() => requestAnimationFrame(() => setSel((x) => x && { ...x, open: true })));
  };
  const close = () => { setSel((x) => x && { ...x, open: false }); setTimeout(() => setSel(null), SPRING.ms); };
  const it = sel ? items[sel.i] : null;
  return (
    <Stage label="共享元素">
      <Screen label="共享元素">
        <div ref={box} className={s.sharedList}>
          {items.map((x, i) => (
            <div key={x.exerciseId} className={s.sharedRow} style={{ visibility: sel?.i === i ? 'hidden' : undefined }} onClick={(e) => openAt(i, e.currentTarget)}>
              <ExerciseRow name={x.name} detail={`${REGION_NAME[x.region]} · ${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg} />
            </div>
          ))}
          {sel && it && (
            <div className={sel.open ? s.sharedOpen : s.shared} style={sel.open ? undefined : { left: sel.r.x, top: sel.r.y, width: sel.r.width, height: sel.r.height }}>
              <div className={s.sharedHead}><IconButton icon="back" label="返回" onClick={close} /><span className="milo-text-caption">{REGION_NAME[it.region]}</span></div>
              <div className="milo-text-title-m">{it.name}</div>
              {it.suggestion.weightKg != null ? <Num size="hero" value={it.suggestion.weightKg} unit="kg" /> : <span className="milo-text-title-l">首次</span>}
              <span className="milo-text-caption">{it.suggestion.reason.text || `选一个能干净做完 ${it.repRange[0]} 次的重量`}</span>
            </div>
          )}
        </div>
      </Screen>
    </Stage>
  );
}

/* M04 磁吸游标 + 滚动码表：在曲线上横向拖，游标吸到最近一次训练，顶部数字按位翻滚 */
export function Odometer({ value }: { value: string }) {
  return (
    <span className={s.odo} aria-label={value}>
      {[...value].map((ch, i) => /\d/.test(ch)
        ? <span key={i} className={s.odoCol} aria-hidden="true"><span className={s.odoStrip} style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>{'0123456789'.split('').map((d) => <i key={d}>{d}</i>)}</span></span>
        : <span key={i} aria-hidden="true">{ch}</span>)}
    </span>
  );
}
export function SnapChart({ points, area = true }: { points: Point[]; area?: boolean }) {
  const ps = [...points].sort((a, b) => a.t - b.t);
  const [i, setI] = useState(ps.length - 1);
  const [drag, setDrag] = useState(false);
  const w = T['size/screen-w'] - T['size/gutter'] * 2, h = T['size/chart-h'], pad = T['space/l'];
  const vs = ps.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs);
  const xy = ps.map((p, k) => [pad + (k / Math.max(1, ps.length - 1)) * (w - pad * 2), pad + (1 - (p.v - lo) / (hi - lo || 1)) * (h - pad * 2)] as const);
  // 平滑曲线（Catmull-Rom → 贝塞尔），ref2 / ref4 / ref5 都是圆滑的线
  const d = xy.map(([x, y], k) => {
    if (!k) return `M${x},${y}`;
    const p0 = xy[k - 2] ?? xy[k - 1], p1 = xy[k - 1], p3 = xy[k + 1] ?? [x, y];
    return `C${p1[0] + (x - p0[0]) / 6},${p1[1] + (y - p0[1]) / 6} ${x - (p3[0] - p1[0]) / 6},${y - (p3[1] - p1[1]) / 6} ${x},${y}`;
  }).join(' ');
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left;
    let best = 0;
    xy.forEach(([px], k) => { if (Math.abs(px - x) < Math.abs(xy[best][0] - x)) best = k; });
    if (best !== i && navigator.vibrate) navigator.vibrate(T['motion/press'] / 10);
    setI(best);
  };
  const v = ps[i]?.v ?? 0;
  return (
    <div className={s.snap}>
      <div className={s.snapHead}><Odometer value={(Math.round(v * 10) / 10).toFixed(1)} /><span className="milo-text-caption">kg · {ps[i]?.label}{ps[i]?.pr ? ' · PR' : ''}</span></div>
      <svg width={w} height={h} className={s.snapSvg} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); pick(e); }}
        onPointerMove={(e) => drag && pick(e)} onPointerUp={() => setDrag(false)}>
        <defs><linearGradient id="labArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className={s.areaTop} /><stop offset="1" className={s.areaBottom} /></linearGradient></defs>
        {area && <path d={`${d} L${xy.at(-1)![0]},${h} L${xy[0][0]},${h} Z`} fill="url(#labArea)" />}
        <path d={d} className={s.snapLine} />
        <line x1={xy[i][0]} x2={xy[i][0]} y1={0} y2={h} className={s.snapRule} />
        <circle cx={xy[i][0]} cy={xy[i][1]} r={T['size/chart-dot'] * 3} className={s.snapHalo} />
        <circle cx={xy[i][0]} cy={xy[i][1]} r={T['size/chart-dot'] + 1} className={s.snapDot} />
      </svg>
    </div>
  );
}

/* M05 阻尼底部面板：两档（半屏 / 近全屏），拖过头有橡皮筋阻尼；松手按速度判档，向下甩出去就关 */
export function RubberSheet() {
  const H = T['size/screen-h'] * 0.6, anchors = [H * 0.45, H * 0.9];
  const [vis, setVis] = useState(anchors[0]);
  const [drag, setDrag] = useState(false);
  const [open, setOpen] = useState(true);
  const g = useRef<{ y: number; v0: number; hist: [number, number][] } | null>(null);
  const rubber = (x: number) => (x > anchors[1] ? anchors[1] + (x - anchors[1]) * 0.3 : Math.max(0, x));
  const down = (e: React.PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); g.current = { y: e.clientY, v0: vis, hist: [[e.timeStamp, e.clientY]] }; setDrag(true); };
  const move = (e: React.PointerEvent) => { const st = g.current; if (!st) return; st.hist.push([e.timeStamp, e.clientY]); if (st.hist.length > 6) st.hist.shift(); setVis(rubber(st.v0 - (e.clientY - st.y))); };
  const up = () => {
    const st = g.current; g.current = null; setDrag(false);
    if (!st) return;
    const [[t0, y0], [t1, y1]] = [st.hist[0], st.hist.at(-1)!], v = (y1 - y0) / Math.max(1, t1 - t0); // px/ms，向下为正
    const cur = vis;
    if (v > 0.6) { if (cur < anchors[1] * 0.75) { setOpen(false); setVis(0); } else setVis(anchors[0]); return; }
    if (v < -0.6) { setVis(anchors[1]); return; }
    setVis(anchors.reduce((a, b) => Math.abs(b - cur) < Math.abs(a - cur) ? b : a));
  };
  return (
    <Stage label="阻尼面板">
      <div className={s.sheetArea}>
        {!open && <div className={s.sheetReopen}><Button kind="neutral" size="s" onClick={() => { setOpen(true); setVis(anchors[0]); }}>打开面板</Button></div>}
        <div className={drag ? s.rsheetDrag : s.rsheet} style={{ height: H, transform: `translateY(${H - (open ? vis : 0)}px)` }}>
          <div className={s.rgrip} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><i /></div>
          <div className="milo-text-title-m">中下胸</div>
          <p className="milo-text-caption">拖住顶部抓手上下拉：半屏 / 近全屏两档；拉过头越拉越重；快速下甩会关闭。</p>
        </div>
      </div>
    </Stage>
  );
}

/* M06 弥散光晕边框：只给每屏唯一的行动焦点——2 号圆锥渐变描边慢转 + 背后呼吸光晕 */
export function ConicGlow() {
  return <div className={s.glowPad}><div className={s.conic}><Button>开始训练</Button></div></div>;
}

/* M07 弹簧交错流：列表按 motion/stagger 依次从下方弹入 */
export function Stagger({ f }: { f: Fixtures }) {
  const [k, setK] = useState(0);
  return (
    <div className={s.demoPad}>
      <Button kind="ghost" size="s" icon="refresh" onClick={() => setK((x) => x + 1)}>重放</Button>
      <div key={k} className={s.staggerList}>
        {f.items.map((x, i) => (
          <div key={x.exerciseId} className={s.staggerItem} style={{ animationDelay: `${i * T['motion/stagger']}ms` }}>
            <ExerciseRow name={x.name} detail={`${REGION_NAME[x.region]} · ${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestion.weightKg} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* M08 微缩 + 过冲：按下缩到 motion/press-scale 并压一层内阴影，松手按弹簧回到 1（自带一点过冲） */
export function PressOvershoot() {
  return (
    <div className={s.pressRow}>
      <div className={s.pressCol}><span className="milo-text-caption">现行：缩放 + 叠色</span><Button kind="neutral">完成</Button></div>
      <div className={s.pressCol}><span className="milo-text-caption">候选：内阴影 + 弹簧回弹</span><div className={s.overshoot}><Button kind="neutral">完成</Button></div></div>
    </div>
  );
}
