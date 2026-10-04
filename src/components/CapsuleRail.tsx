/** 胶囊列 + 引线 + 放大镜手势（ia §1.10）：
 *  按住 motion/long-press 进入放大镜；进入前移动超过 motion/drag-slop 视为滚动；上下滑动逐个放大；松手选中最近的肌头；轻点直接选中。
 *  胶囊：名称 · 组数/适宜量；底色按「组数 ÷ 最大可恢复量」从左填充（胶囊本身就是量尺）；0 组为斜纹；焦点为实心荧光 + 黑字，多一行恢复度与时相。 */
import { useRef } from 'react';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import type { Anchors } from './BodyFigure';
import { capsuleLayout, indexAt, type CapBox } from './capsuleLayout';
import s from './CapsuleRail.module.css';

const PHASE = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '未练过' } as const;
const fmt = (x: number) => String(Math.round(x * 10) / 10);

export function recoveryLine(h: HeadStat) {
  if (h.recovery == null) return '未练过';
  return `恢复 ${Math.round(h.recovery * 100)}% · ${PHASE[h.phase]}${h.hoursLeft > 0.5 ? ` · 还需 ${Math.round(h.hoursLeft)} 小时` : ''}`;
}

export function CapsuleRail({ ids, stats, anchors, width, height, left, right, mag, onMag, onSelect }: {
  ids: string[]; stats: Map<string, HeadStat>; anchors: Anchors; width: number; height: number; left: number; right: number;
  mag: number | null; onMag: (f: number | null) => void; onSelect: (id: string) => void;
}) {
  const n = ids.length;
  const { caps, top } = capsuleLayout(n, height, left, right, mag);
  const still = capsuleLayout(n, height, left, right, null);
  const span = still.caps.length ? still.caps[n - 1].y + still.caps[n - 1].h : height;
  const g = useRef<{ x: number; y: number; timer: number; on: boolean } | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const fAt = (clientY: number) => indexAt(clientY - rail.current!.getBoundingClientRect().top - still.top, span, n);

  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
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
    const i = Math.round(st.on && mag != null ? mag : fAt(e.clientY));
    onMag(i);
    if (ids[i]) onSelect(ids[i]);
  };
  const cancel = () => { if (g.current) clearTimeout(g.current.timer); g.current = null; };

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
      <div ref={rail} className={s.rail} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
        role="listbox" aria-label="肌头容量（按住上下滑动放大）">
        {caps.map((c, k) => <Capsule key={ids[k]} h={stats.get(ids[k])!} c={c} top={top} />)}
      </div>
    </>
  );
}

/** 单个胶囊。在轨道里由 CapsuleRail 定位；standalone 时按自身宽高排在文档流里（Playground、说明页） */
export function Capsule({ h, c, top = 0, standalone }: { h: HeadStat; c: CapBox; top?: number; standalone?: boolean }) {
  const none = !(h.sets7d > 0);
  const fill = Math.min(1, h.sets7d / h.mrv) * 100;
  return (
    <div className={`${c.focus ? s.focus : none ? s.none : s.cap} ${standalone ? s.standalone : ''}`} data-id={h.id} role="option" aria-selected={c.focus}
      style={{ left: c.x, top: top + c.y, width: c.w, height: c.h, ['--w' as string]: c.weight }}>
      {!c.focus && !none && <div className={`${s.gauge} ${h.sets7d > h.mrv ? s.gaugeOver : ''}`} style={{ width: `${fill}%` }} />}
      <div className={s.l1}>
        <span className={s.name}>{h.name}</span>
        <span className={s.val}><b>{fmt(h.sets7d)}</b>/{h.mav}{c.focus && <i> 组</i>}</span>
      </div>
      {c.focus && <div className={s.l2}>{recoveryLine(h)}</div>}
    </div>
  );
}
