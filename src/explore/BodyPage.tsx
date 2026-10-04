/** 身体页高保真（线框 W3 + Stitch 第 2 轮 V1）：压暗的 MuscleWiki 半身作背景，右侧胶囊叠在上面。
 *  放大镜按 ia §1.10：按住 150 ms 进入，进入前移动超过 8 px 算滚动；余弦衰减；松手选中最近的肌头并打开详情面板；轻点也能打开。 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HeadStat } from '../engine';
import { HalfBody, type Anchors } from './HalfBody';
import { ago, bodyData, fmt, PHASE_NAME, REGION_NAME } from './data';
import { Nav, Screen, Segmented, Ticks } from './shared';
import s from './explore.module.css';

const HOLD_MS = 150, SLOP = 8, RADIUS = 3; // motion/long-press、motion/drag-slop、motion/magnifier-radius
const MAG_H = 62, NEAR_H = 34, MAX_BASE = 30, GROW = 34, NEAR_GROW = 10;
const TIER_NAME = { large: '大肌群', medium: '中肌群', small: '小肌群' } as const;

export function BodyPage({ scenario, now, initialFocus }: { scenario: string; now: number; initialFocus: string | null }) {
  const data = useMemo(() => bodyData(scenario, now), [scenario, now]);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [gender, setGender] = useState<'male' | 'female'>(data.gender);
  const [anchors, setAnchors] = useState<Anchors>({});
  const [mag, setMag] = useState<number | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 360, h: 560 });
  useEffect(() => {
    const el = stage.current!;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const onAnchors = useCallback((a: Anchors) => setAnchors(a), []);

  const ids = useMemo(() => Object.keys(anchors).filter((id) => data.stats.has(id)).sort((a, b) => anchors[a][1] - anchors[b][1] || anchors[a][0] - anchors[b][0]), [anchors, data]);
  // 截图 / 首次打开时停在「中下胸」被按住的状态，方便和设计稿对照
  useEffect(() => {
    if (initialFocus && ids.length && mag == null) { const i = ids.indexOf(initialFocus); if (i >= 0) setMag(i); }
  }, [ids, initialFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  // 胶囊布局：总高固定，放大的部分由其余胶囊让出来（像 Dock）
  const left = Math.round(box.w * 0.43), right = box.w - 16, H = box.h, n = ids.length;
  // 余弦衰减（半径 3）：离手指最近的一颗放到 MAG_H，其余按权重轻微放大到 NEAR_H
  const nearest = mag == null ? -1 : Math.round(mag);
  const weights = ids.map((_, i) => (mag == null ? 0 : Math.abs(i - mag) < RADIUS ? 0.5 * (1 + Math.cos((Math.PI * Math.abs(i - mag)) / RADIUS)) : 0));
  const target = (i: number) => (i === nearest ? MAG_H : NEAR_H);
  // 总高固定：base·Σ(1−w) + Σ target·w = H − 间距
  const sumW = weights.reduce((a, w) => a + w, 0), sumTW = weights.reduce((a, w, i) => a + target(i) * w, 0);
  const base = Math.min(MAX_BASE, n ? (H - 4 * (n - 1) - sumTW) / Math.max(1, n - sumW) : 0);
  let y = 0;
  const caps = ids.map((id, i) => {
    const w = weights[i], h = base + (target(i) - base) * w, grow = (i === nearest ? GROW : NEAR_GROW) * w;
    const c = { id, w: i === nearest ? w : w * 0.4, x: left - grow, y, h, wid: right - left + grow, nearest: i === nearest };
    y += h + 4;
    return c;
  });
  const top = Math.max(0, (H - (y - 4)) / 2);

  // 手势
  const g = useRef<{ x: number; y: number; timer: number; on: boolean } | null>(null);
  const fAt = (clientY: number) => {
    const r = stage.current!.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, (clientY - r.top - top) / (H / n) - 0.5));
  };
  const down = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const cy = e.clientY;
    g.current = { x: e.clientX, y: cy, on: false, timer: window.setTimeout(() => { if (g.current) { g.current.on = true; setSheet(null); setMag(fAt(cy)); } }, HOLD_MS) };
  };
  const move = (e: React.PointerEvent) => {
    const st = g.current;
    if (!st) return;
    if (!st.on) { if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > SLOP) { clearTimeout(st.timer); g.current = null; } return; }
    setMag(fAt(e.clientY));
  };
  const up = (e: React.PointerEvent) => {
    const st = g.current;
    g.current = null;
    if (!st) return;
    clearTimeout(st.timer);
    const i = Math.round(st.on ? mag ?? fAt(e.clientY) : fAt(e.clientY));
    setMag(i);
    if (ids[i]) setSheet(ids[i]);
  };

  const k = data.kpi;
  // 外圈：今天练完 = 满环；还没练 = 只画轨道（精确的「已完成 / 计划组数」在 M3 由 store 提供）
  const progress = data.trainedToday ? 1 : 0;
  return (
    <Screen label="身体">
      <header className={s.head}>
        <div className={s.row}>
          <h1 className="milo-text-title-l">身体</h1>
          <div className={s.sp} />
          <Segmented items={[['front', '正面'], ['back', '背面']]} value={view} onChange={(v) => { setView(v); setMag(null); setSheet(null); }} />
          <Segmented items={[['male', '男'], ['female', '女']]} value={gender} onChange={(v) => { setGender(v); setMag(null); }} />
        </div>
        <div className={s.kpi}>
          <span className="milo-text-caption">近 7 天</span>
          <span><b className="milo-text-number-m">{fmt(k.load)}</b><i>kg</i></span>
          <span><b className="milo-text-number-m">{k.sets}</b><i>组</i></span>
          <span><b className="milo-text-number-m">{k.days}</b><i>天</i></span>
        </div>
        <Ticks />
        {k.sets === 0 && <div className={s.statusQuiet}>练完第一次训练后，这里会显示每块肌肉近 7 天的容量和恢复。</div>}
        <div className={s.legend}>
          <span><i className={s.lgNone} />未练</span><span><i className={s.lgLow} />不足</span><span><i className={s.lgOk} />达标</span><span><i className={s.lgOver} />超量</span>
        </div>
      </header>

      <div ref={stage} className={s.stage}>
        <div className={s.figureWrap}>
          <HalfBody gender={gender} view={view} stats={data.stats} focus={mag != null ? ids[Math.round(mag)] ?? null : sheet} height={H} onAnchors={onAnchors} relativeTo={stage} />
        </div>
        <svg className={s.leaders} width={box.w} height={H} aria-hidden="true">
          {caps.map((c, i) => {
            const a = anchors[c.id];
            if (!a) return null;
            const cy = top + c.y + c.h / 2, ex = c.x - 10 - (i % 4) * 3, on = c.nearest;
            return (
              <g key={c.id} className={on ? s.leaderOn : s.leader}>
                <polyline points={`${a[0]},${a[1]} ${ex},${a[1]} ${ex},${cy} ${c.x},${cy}`} />
                <circle cx={a[0]} cy={a[1]} r={on ? 3.5 : 1.8} />
              </g>
            );
          })}
        </svg>
        <div className={s.rail} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { if (g.current) clearTimeout(g.current.timer); g.current = null; }}>
          {caps.map((c) => <Capsule key={c.id} h={data.stats.get(c.id)!} c={c} top={top} />)}
        </div>
      </div>

      {sheet && <HeadSheet h={data.stats.get(sheet)!} onClose={() => { setSheet(null); setMag(null); }} />}
      <Nav selected="body" progress={progress} />
    </Screen>
  );
}

function Capsule({ h, c, top }: { h: HeadStat; c: { x: number; y: number; h: number; wid: number; w: number; nearest: boolean }; top: number }) {
  const none = !(h.sets7d > 0);
  const fill = Math.min(1, h.sets7d / h.mrv) * 100;
  const cls = c.nearest ? s.capFocus : none ? s.capNone : s.cap;
  return (
    <div className={cls} data-id={h.id} style={{ left: c.x, top: top + c.y, width: c.wid, height: c.h, ['--w' as string]: c.w }}>
      {!c.nearest && !none && <div className={s.capGauge} style={{ width: `${fill}%` }} />}
      <div className={s.capL1}>
        <span className={s.capName}>{h.name}</span>
        <span className={s.capVal}><b>{fmt(h.sets7d)}</b>/{h.mav}{c.nearest && <i> 组</i>}</span>
      </div>
      {c.nearest && (
        <div className={s.capL2}>
          {h.recovery == null ? '未练过' : `恢复 ${Math.round(h.recovery * 100)}% · ${PHASE_NAME[h.phase]}${h.hoursLeft > 0.5 ? ` · 还需 ${Math.round(h.hoursLeft)} 小时` : ''}`}
        </div>
      )}
    </div>
  );
}

/** 肌头详情面板（线框 sheet W1：恢复在上、容量在下） */
function HeadSheet({ h, onClose }: { h: HeadStat; onClose: () => void }) {
  const phases = ['repair', 'recovering', 'golden', 'decayed'] as const;
  const x = (v: number) => `${(v / (h.mrv * 1.1)) * 100}%`;
  return (
    <div className={s.scrim} onClick={onClose}>
      <section className={s.sheet} onClick={(e) => e.stopPropagation()} aria-label={`${h.name}详情`}>
        <div className={s.grip} />
        <div className={s.row}>
          <h2 className="milo-text-title-m">{h.name}</h2>
          <span className="milo-text-caption">{REGION_NAME[h.region]} · {TIER_NAME[h.tier]}</span>
          <div className={s.sp} />
          <button type="button" className={s.close} onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div className={s.block}>
          <div className="milo-text-label">恢复</div>
          <div className={s.bigRow}>
            <b className="milo-text-number-hero">{h.recovery == null ? '—' : Math.round(h.recovery * 100)}</b><i>%</i>
            <span className={s.sp} />
            <span className="milo-text-body">{h.recovery == null ? '从未练过' : h.hoursLeft > 0.5 ? `还需 ${Math.round(h.hoursLeft)} 小时` : '已恢复'}</span>
          </div>
          <div className={s.phases}>{phases.map((p) => <span key={p} className={p === h.phase ? s.phaseOn : undefined}>{PHASE_NAME[p]}</span>)}</div>
        </div>
        <div className={s.block}>
          <div className="milo-text-label">近 7 天容量</div>
          <div className={s.bigRow}><b className="milo-text-number-xl">{fmt(h.sets7d)}</b><i>组</i></div>
          <div className={s.ruler}>
            <div className={s.rulerFill} style={{ width: x(h.sets7d) }} />
            {([['最低', h.mev], ['适宜', h.mav], ['上限', h.mrv]] as const).map(([n, v]) => (
              <div key={n} className={s.mark} style={{ left: x(v) }}><span>{n} {v}</span></div>
            ))}
          </div>
          {h.hoursSince != null && <div className="milo-text-caption">最近一次：{ago(h.hoursSince)} · {fmt(h.lastSets)} 组</div>}
        </div>
      </section>
    </div>
  );
}
