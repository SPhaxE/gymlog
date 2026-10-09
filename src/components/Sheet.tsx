/** 底部面板：遮罩 bg/scrim，面板 bg/sheet，顶角 radius/xl，顶部抓手；点遮罩、×、Esc 或系统返回键关闭；打开时焦点进入面板，关闭后回到原处。
 *  阻尼拖拽（2026-10-04 用户选定 M05）：内容放得下（≤ 屏高 92%）就按内容高打开、只有一档、不出滚动；放不下才在两档之间吸附——屏高 60% 与近全屏（92%）；
 *  拉过上限越拉越重（橡皮筋 ×0.3）；松手按手指速度判档（快速上甩到近全屏、快速下甩关闭），慢慢松手吸到最近一档；拖到低档 60% 以下松手也关闭。
 *  面板盖住导航（ia §1.12），关掉即恢复。docked：只做静态展示（Playground 矩阵），不抢焦点、不登记返回键、不可拖。 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { IconButton } from './Button';
import { useBackHandler, useExitGhost, useFocusTrap } from './overlay';
import { cx } from './state';
import s from './Sheet.module.css';

const LOW = 0.6, HIGH = 0.92, RUBBER = 0.3, FLING = 0.6; // 屏高比例、橡皮筋系数、甩动速度阈值（px/ms）

export function Sheet({ title, meta, onClose, children, docked, tall }: { title: string; meta?: ReactNode; onClose: () => void; children: ReactNode; docked?: boolean;
  /** 一打开就停在近全屏那一档（找动作检索面板，6e） */ tall?: boolean }) {
  const ref = useRef<HTMLElement>(null), scrim = useRef<HTMLDivElement>(null);
  useBackHandler(!docked, onClose);
  useFocusTrap(ref, onClose, !docked);
  // 退场：面板往下滑走、遮罩淡掉
  useExitGhost(scrim, s.out, docked);
  const [anchors, setAnchors] = useState<[number, number] | null>(null);
  const [hgt, setHgt] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const g = useRef<{ y: number; h0: number; hist: [number, number][] } | null>(null);

  useLayoutEffect(() => {
    if (docked || !ref.current || !scrim.current) return;
    // 遮罩铺到状态栏下面、上边留了状态栏高的内边距：面板能用的高度不算这一段
    const H = scrim.current.clientHeight - (parseFloat(getComputedStyle(scrim.current).paddingTop) || 0), natural = ref.current.scrollHeight;
    // 放得下（≤ 92%）就按内容高打开、只有这一档，面板里不出滚动（键盘、确认这类定高内容，2026-10-08 走查 1 #19）；放不下才分 60% / 92% 两档
    const fits = natural <= H * HIGH;
    const lo = fits ? natural : H * LOW, hi = fits ? natural : H * HIGH;
    setAnchors([lo, hi]); setHgt(tall ? hi : lo);
  }, [docked, tall]);

  const down = (e: React.PointerEvent) => {
    if (!anchors || hgt == null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    g.current = { y: e.clientY, h0: hgt, hist: [[e.timeStamp, e.clientY]] }; setDrag(true);
  };
  const move = (e: React.PointerEvent) => {
    const st = g.current;
    if (!st || !anchors) return;
    st.hist.push([e.timeStamp, e.clientY]); if (st.hist.length > 6) st.hist.shift();
    const raw = st.h0 - (e.clientY - st.y);
    setHgt(raw > anchors[1] ? anchors[1] + (raw - anchors[1]) * RUBBER : Math.max(0, raw));
  };
  const up = () => {
    const st = g.current; g.current = null; setDrag(false);
    if (!st || !anchors || hgt == null) return;
    const [[t0, y0], [t1, y1]] = [st.hist[0], st.hist.at(-1)!], v = (y1 - y0) / Math.max(1, t1 - t0); // 向下为正
    if (v > FLING && hgt <= anchors[0] * 1.05) return onClose();
    if (v > FLING) return setHgt(anchors[0]);
    if (v < -FLING) return setHgt(anchors[1]);
    if (hgt < anchors[0] * 0.6) return onClose();
    setHgt(Math.abs(hgt - anchors[0]) < Math.abs(hgt - anchors[1]) ? anchors[0] : anchors[1]);
  };

  return (
    <div ref={scrim} className={s.scrim} onClick={onClose}>
      <section ref={ref} className={cx(s.sheet, drag && s.dragging)} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        style={hgt != null ? { height: hgt } : undefined}>
        <div className={s.grip} onPointerDown={docked ? undefined : down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-hidden="true"><i /></div>
        <div className={s.head}>
          <div className={s.headText}>
            <h2 className="milo-text-title-m">{title}</h2>
            {meta && <span className={`milo-text-caption ${s.meta}`}>{meta}</span>}
          </div>
          <IconButton icon="close" label="关闭" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}

/** 面板里的一块：标题（Label）+ 内容，bg/raised、radius/m */
export function SheetBlock({ label, trailing, children }: { label: string; /** 标题行右边（如「Pro ›」） */ trailing?: ReactNode; children: ReactNode }) {
  return <div className={s.block}>{trailing ? <div className={s.blockHead}><span className="milo-text-label">{label}</span>{trailing}</div> : <div className="milo-text-label">{label}</div>}{children}</div>;
}
