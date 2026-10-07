/** 点人体选肌肉（6e 找动作，线框 ?board=finder；用户 2026-10-07：只是检索器，可读性优先，不用容量页视效）。
 *  - 平涂高对比：没选的中灰、选中的骨白、同一块肌肉里没选到的肌头浅灰；肌肉之间留一道底色缝；手、脚、脖子更暗；不发光、不扫描。
 *  - 半身，版式同容量页（从左裁 ratio/figure-crop、左缘渐隐），但放在面板右栏（拇指区）。
 *  - 命中区：按「组」点（组 = 调用方给的 groupOf，找动作里是整块肌肉）；点在缝里或剪影边上 24 px 以内都算离得最近的那组（最近吸附）——
 *    挂载后按 3 px 网格用真实路径采样一遍、多源 BFS 往外扩 8 格，得到每组的实际命中区；skip 里的肌头在这一面不当目标（它的地方归给邻居）。
 *    jsdom 等没有 isPointInFill 的环境退回「点到哪个肌头算哪个」。
 *  - 键盘 / 读屏：每组一个看不见的按钮（aria-pressed）。按下时被点的那组先变亮一档（M08 按压反馈），松手才选。 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import s from './BodyPicker.module.css';

type Part = { paths?: { d: string }[] };
type BodyMap = { viewBox?: string; front: Record<string, Part>; back: Record<string, Part> };
const NEUTRAL = ['neck', 'feet', 'hands', 'groin'];
const cache = new Map<string, Promise<BodyMap>>();
const load = (g: string) => {
  if (!cache.has(g)) cache.set(g, fetch(`${import.meta.env.BASE_URL}bodymap/bodymap-${g}.json`).then((r) => r.json()));
  return cache.get(g)!;
};
const STEP = 3, REACH = 8;   // 采样 3 px；往外吸附 8 格 = 24 px

export function BodyPicker({ gender, view, height, groupOf, groupName, skip = [], lit = [], dim = [], onPick }: {
  gender: 'male' | 'female'; view: 'front' | 'back'; height: number;
  /** 肌头 → 组（找动作里是整块肌肉）；返回 null 的肌头不可点 */
  groupOf: (head: string) => string | null; groupName: (group: string) => string;
  /** 这一面上不当目标的肌头 */
  skip?: string[];
  /** 亮（选中）的肌头；dim = 同一组里没选到的肌头 */
  lit?: string[]; dim?: string[];
  onPick: (group: string) => void;
}) {
  const [data, setData] = useState<BodyMap | null>(null);
  const [vb, setVb] = useState<number[] | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const grid = useRef<{ lab: Int16Array; cols: number; rows: number; groups: string[] } | null>(null);
  useEffect(() => { let on = true; setVb(null); load(gender).then((d) => on && setData(d)); return () => { on = false; }; }, [gender, view]);
  useLayoutEffect(() => {
    if (!data || vb || !svg.current) return;
    const bb = svg.current.getBBox(), pad = bb.height * 0.004, x0 = bb.x + bb.width * T['ratio/figure-crop'];
    setVb([x0, bb.y - pad, bb.x + bb.width - x0 + pad, bb.height + pad * 2]);
  }, [data, vb]);

  // 命中区：真实路径采样 + 最近吸附
  useLayoutEffect(() => {
    grid.current = null;
    const el = svg.current;
    if (!vb || !el) return;
    const paths = [...el.querySelectorAll<SVGPathElement>('g[data-group] path')];
    if (!paths.length || typeof paths[0].isPointInFill !== 'function') return;
    const r = el.getBoundingClientRect(), ctm = el.getScreenCTM();
    if (!ctm || !r.width) return;
    const inv = ctm.inverse(), cols = Math.ceil(r.width / STEP), rows = Math.ceil(r.height / STEP);
    const groups = [...new Set(paths.map((p) => (p.parentNode as SVGGElement).dataset.group!))];
    const gi = paths.map((p) => groups.indexOf((p.parentNode as SVGGElement).dataset.group!)), boxes = paths.map((p) => p.getBBox());
    const lab = new Int16Array(cols * rows).fill(-1), q: number[] = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const pt = new DOMPoint(r.left + x * STEP, r.top + y * STEP).matrixTransform(inv);
      for (let i = 0; i < paths.length; i++) {
        const b = boxes[i];
        if (pt.x < b.x || pt.x > b.x + b.width || pt.y < b.y || pt.y > b.y + b.height || !paths[i].isPointInFill(pt)) continue;
        lab[y * cols + x] = gi[i]; q.push(y * cols + x); break;
      }
    }
    const depth = new Uint8Array(cols * rows);
    for (let k = 0; k < q.length; k++) {
      const v = q[k], y = (v / cols) | 0, x = v % cols;
      if (depth[v] >= REACH) continue;
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || xx < 0 || yy >= rows || xx >= cols) continue;
        const u = yy * cols + xx;
        if (lab[u] !== -1) continue;
        lab[u] = lab[v]; depth[u] = depth[v] + 1; q.push(u);
      }
    }
    grid.current = { lab, cols, rows, groups };
  }, [vb, height]);

  const groupAt = (e: React.PointerEvent | React.MouseEvent): string | null => {
    const g = grid.current, el = svg.current;
    if (g && el) {
      const r = el.getBoundingClientRect(), x = Math.round((e.clientX - r.left) / STEP), y = Math.round((e.clientY - r.top) / STEP);
      if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return null;
      const l = g.lab[y * g.cols + x];
      return l >= 0 ? g.groups[l] : null;
    }
    return (e.target as Element).closest?.('g[data-group]')?.getAttribute('data-group') ?? null;
  };

  if (!data) return <div className={s.wrap} style={{ height }} />;
  const v = data[view];
  const box = vb ?? (data.viewBox ?? '0 0 676.49 1203.49').split(' ').map(Number);
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const groupsHere = [...new Set(heads.filter((h) => !skip.includes(h)).map(groupOf).filter((x): x is string => !!x))];
  const cls = (h: string) => (lit.includes(h) ? s.lit : dim.includes(h) ? s.dim : pressed && groupOf(h) === pressed ? s.pressed : s.muscle);
  return (
    <div className={s.wrap}>
      <svg ref={svg} className={vb ? s.figure : s.measuring} viewBox={box.join(' ')} height={height} width={(height * box[2]) / box[3]} preserveAspectRatio="xMinYMin meet" aria-hidden="true"
        onPointerDown={(e) => setPressed(groupAt(e))} onPointerLeave={() => setPressed(null)} onPointerCancel={() => setPressed(null)}
        onPointerUp={(e) => { const g = groupAt(e); setPressed(null); if (g) onPick(g); }}>
        <g className={s.base}>{(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>
        <g className={s.neutral}>{NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
        {heads.map((h) => {
          const g = skip.includes(h) ? null : groupOf(h);
          return <g key={h} data-head={h} data-group={g ?? undefined} className={cls(h)}>{(v[h].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>;
        })}
      </svg>
      <div className={s.sr}>{groupsHere.map((g) => <button key={g} type="button" aria-pressed={heads.some((h) => groupOf(h) === g && lit.includes(h))} onClick={() => onPick(g)}>{groupName(g)}</button>)}</div>
    </div>
  );
}
