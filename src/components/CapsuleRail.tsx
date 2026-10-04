/** 胶囊列 + 引线 + 放大镜手势（ia §1.10）：
 *  手势只在胶囊列的静止宽度 [left, right] 里接（hit 层），人体在它左边，轻点肌肉打开详情，两块命中区不重叠。
 *  竖向短滑 = 滚动页面（hit 层 touch-action: pan-y）；按住 motion/long-press 不动才进入放大镜，进入后锁住页面滚动；
 *  进入前移动超过 motion/drag-slop 或浏览器开始滚动（pointercancel）都取消。上下滑动逐个放大；
 *  松手只是退出放大镜，不打开详情（2026-10-04 用户改）；要看详情就轻点胶囊。
 *  胶囊：名称 · 组数/适宜量；底色按「组数 ÷ 最大可恢复量」从左填充（胶囊本身就是量尺）；0 组为斜纹。
 *  焦点（2026-10-04 用户第三轮反馈：无必要勿增实体）：还是那颗胶囊，实心荧光；名称挪到最右（手指按着的地方，放大前已经看过名称），
 *   组数 / 恢复度 / 时相 / 还需几小时写在左边，手指挡不到。 */
import { useContext, useEffect, useRef } from 'react';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import type { Anchors } from './BodyFigure';
import { capsuleLayout, indexAt, type CapBox } from './capsuleLayout';
import { BodyRender, heatCss, heatOf } from './thermal';
import s from './CapsuleRail.module.css';

const PHASE = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '未练过' } as const;
const fmt = (x: number) => String(Math.round(x * 10) / 10);

export function CapsuleRail({ ids, stats, anchors, width, height, left, right, mag, onMag, onSelect }: {
  ids: string[]; stats: Map<string, HeadStat>; anchors: Anchors; width: number; height: number; left: number; right: number;
  mag: number | null; onMag: (f: number | null) => void; onSelect: (id: string) => void;
}) {
  const n = ids.length;
  const { caps, top } = capsuleLayout(n, height, left, right, mag);
  const still = capsuleLayout(n, height, left, right, null);
  const span = still.caps.length ? still.caps[n - 1].y + still.caps[n - 1].h : height;
  const g = useRef<{ x: number; y: number; timer: number; on: boolean } | null>(null);
  const rail = useRef<HTMLDivElement>(null), hit = useRef<HTMLDivElement>(null);
  const fAt = (clientY: number) => indexAt(clientY - rail.current!.getBoundingClientRect().top - still.top, span, n);

  // 放大镜开着时拦下 touchmove，页面不跟着滚；没开时不拦，竖向短滑照常滚动页面（必须是非 passive 的原生监听）
  useEffect(() => {
    const el = hit.current!;
    const stop = (e: TouchEvent) => { if (g.current?.on) e.preventDefault(); };
    el.addEventListener('touchmove', stop, { passive: false });
    return () => el.removeEventListener('touchmove', stop);
  }, []);

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
    const cy = e.clientY;
    g.current = { x: e.clientX, y: cy, on: false, timer: window.setTimeout(() => { if (g.current) { g.current.on = true; onMag(fAt(cy)); } }, T['motion/long-press']) };
  };
  const move = (e: React.PointerEvent) => {
    const st = g.current;
    if (!st) return;
    if (!st.on) { if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > T['motion/drag-slop']) { clearTimeout(st.timer); g.current = null; } return; }
    onMag(fAt(e.clientY));
  };
  const up = (e: React.PointerEvent) => {
    const st = g.current;
    g.current = null;
    if (!st) return;
    clearTimeout(st.timer);
    // 放大镜里松手：只退出放大镜，胶囊回到静止；没进放大镜（轻点）才打开详情
    if (st.on) { onMag(null); return; }
    const i = Math.round(fAt(e.clientY));
    if (ids[i]) onSelect(ids[i]);
  };
  // 浏览器接管成滚动（触屏竖向滑过它自己的阈值）时会发 pointercancel：取消长按；万一已在放大镜里也一并退出
  const cancel = () => { const st = g.current; g.current = null; if (!st) return; clearTimeout(st.timer); if (st.on) onMag(null); };

  return (
    <>
      <svg className={s.leaders} width={width} height={height} aria-hidden="true">
        {caps.map((c, k) => {
          const a = anchors[ids[k]];
          if (!a) return null;
          const cy = top + c.y + c.h / 2, ex = c.x - T['size/leader-elbow'] - (k % 4) * T['size/leader-stagger'];
          return (
            <g key={ids[k]} className={c.focus ? s.leaderOn : s.leader}>
              <polyline points={`${a[0]},${a[1]} ${ex},${a[1]} ${ex},${cy} ${c.x},${cy}`} />
              <circle cx={a[0]} cy={a[1]} r={c.focus ? T['stroke/ring-progress'] : T['stroke/focus']} />
            </g>
          );
        })}
      </svg>
      <div ref={rail} className={s.rail} role="listbox" aria-label="肌头容量（轻点看详情，按住上下滑动放大）">
        {caps.map((c, k) => <Capsule key={ids[k]} h={stats.get(ids[k])!} c={c} top={top} />)}
      </div>
      {/* 手势层：只盖胶囊列的静止宽度；人体在它左边另有轻点命中 */}
      <div ref={hit} className={s.hit} style={{ left, width: right - left }} aria-hidden="true"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onContextMenu={(e) => e.preventDefault()} />
    </>
  );
}

/** 单个胶囊。在轨道里由 CapsuleRail 定位；standalone 时按自身宽高排在文档流里（Playground、说明页） */
export function Capsule({ h, c, top = 0, standalone }: { h: HeadStat; c: CapBox; top?: number; standalone?: boolean }) {
  const none = !(h.sets7d > 0);
  const fill = Math.min(1, h.sets7d / h.mrv) * 100;
  const thermal = useContext(BodyRender);
  return (
    <div className={`${c.focus ? s.focus : none ? s.none : s.cap} ${standalone ? s.standalone : ''}`} data-id={h.id} role="option" aria-selected={c.focus}
      style={{ left: c.x, top: top + c.y, width: c.w, height: c.h, ['--w' as string]: c.weight }}>
      {!c.focus && !none && <div className={`${s.gauge} ${h.sets7d > h.mrv && !thermal ? s.gaugeOver : ''}`}
        style={{ width: `${fill}%`, ...(thermal ? { background: heatCss(heatOf(h), thermal.palette), opacity: 0.55 } : {}) }} />}
      {c.focus ? <FocusBody h={h} /> : (
        <div className={s.l1}>
          <span className={s.name}>{h.name}</span>
          <span className={s.val}><b>{fmt(h.sets7d)}</b>/{h.mav}</span>
        </div>
      )}
    </div>
  );
}

/** 焦点胶囊的内容：左边三行（组数 / 恢复度 · 时相 / 还需几小时），名称在最右（手指底下） */
function FocusBody({ h }: { h: HeadStat }) {
  const pct = h.recovery == null ? null : Math.round(h.recovery * 100);
  return (
    <div className={s.fRow}>
      <div className={s.fInfo}>
        <span className={s.fSets}><b>{fmt(h.sets7d)}</b>/{h.mav} 组</span>
        <span className={s.fLine}>{pct == null ? '未练过' : <>恢复 <b>{pct}</b>% · {PHASE[h.phase]}</>}</span>
        {pct != null && <span className={s.fLine}>{h.hoursLeft > 0.5 ? <>还需 <b>{Math.round(h.hoursLeft)}</b> 小时</> : '已恢复'}</span>}
      </div>
      <span className={s.fName}>{h.name}</span>
    </div>
  );
}
