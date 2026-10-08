/** 选中图标的描线方向（2026-10-06 用户：导航图标以及所有选中图标的线条加载动画，都从左到右、从下到上；
 *  2026-10-08 用户补：**从下到上优先于从左到右**）。纯函数，给 Icon 的 runTrace 用：
 *  - 每一笔（M 开头的子路径）先定方向：只要有明显的竖向走势（偏离水平超过 15°）就从下往上画；接近水平的才从左往右画；方向不对就把这一笔反过来写；
 *    闭合笔画从最下面的顶点起笔（一样低取最左），第一段能往上走就往上走；首尾几乎重合的带弧线笔画按第一段的走向判断；
 *  - 各笔的起笔顺序：先比高低（下面的先画），差不多高（相差 1.5 个单位以内）再比左右（左边的先画）。
 *  路径命令只支持图标集里出现的 M / L / H / V / A / Z（大小写都行），其余原样不动（不反转）。 */

type Pt = [number, number];
type Seg = { k: 'L'; to: Pt } | { k: 'A'; to: Pt; rx: number; ry: number; rot: number; large: number; sweep: number };
export interface Stroke { start: Pt; segs: Seg[]; closed: boolean }

const fmt = (n: number) => String(Math.round(n * 1000) / 1000);

/** 一笔（单个 M 开头的子路径）→ 起点 + 绝对坐标的线段；不认识的命令返回 null */
export function parseStroke(d: string): Stroke | null {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? [];
  let i = 0, cmd = '', cur: Pt = [0, 0], start: Pt = [0, 0], closed = false;
  const segs: Seg[] = [];
  const num = () => Number(toks[i++]);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), c = cmd.toUpperCase();
    if (c === 'M') { const x = num(), y = num(); cur = rel ? [cur[0] + x, cur[1] + y] : [x, y]; start = cur; cmd = rel ? 'l' : 'L'; }
    else if (c === 'L') { const x = num(), y = num(); cur = rel ? [cur[0] + x, cur[1] + y] : [x, y]; segs.push({ k: 'L', to: cur }); }
    else if (c === 'H') { const x = num(); cur = [rel ? cur[0] + x : x, cur[1]]; segs.push({ k: 'L', to: cur }); }
    else if (c === 'V') { const y = num(); cur = [cur[0], rel ? cur[1] + y : y]; segs.push({ k: 'L', to: cur }); }
    else if (c === 'A') {
      const rx = num(), ry = num(), rot = num(), large = num(), sweep = num(), x = num(), y = num();
      cur = rel ? [cur[0] + x, cur[1] + y] : [x, y];
      segs.push({ k: 'A', to: cur, rx, ry, rot, large, sweep });
    } else if (c === 'Z') { closed = true; if (cur[0] !== start[0] || cur[1] !== start[1]) segs.push({ k: 'L', to: start }); cur = start; }
    else return null;
  }
  return { start, segs, closed };
}

const end = (s: Stroke): Pt => (s.segs.length ? s.segs[s.segs.length - 1].to : s.start);

/** 反过来写这一笔：从终点出发、逐段倒着走；弧线的扫掠方向取反 */
export function reverseStroke(s: Stroke): Stroke {
  const pts = [s.start, ...s.segs.map((g) => g.to)];
  const segs: Seg[] = [];
  for (let j = s.segs.length - 1; j >= 0; j--) {
    const g = s.segs[j], to = pts[j];
    segs.push(g.k === 'L' ? { k: 'L', to } : { ...g, to, sweep: g.sweep ? 0 : 1 });
  }
  return { start: end(s), segs, closed: s.closed };
}

export function strokeToD(s: Stroke): string {
  return `M${fmt(s.start[0])} ${fmt(s.start[1])}` + s.segs.map((g) => (g.k === 'L'
    ? `L${fmt(g.to[0])} ${fmt(g.to[1])}`
    : `A${fmt(g.rx)} ${fmt(g.ry)} ${fmt(g.rot)} ${g.large} ${g.sweep} ${fmt(g.to[0])} ${fmt(g.to[1])}`)).join('');
}

/** 这一笔的走向（SVG 的 y 向下）：首尾几乎重合时用第一段的走向 */
function heading(s: Stroke): Pt {
  const e = end(s);
  const dx = e[0] - s.start[0], dy = e[1] - s.start[1];
  if (Math.hypot(dx, dy) > 1.5 || !s.segs.length) return [dx, dy];
  const f = s.segs[0].to;
  return [f[0] - s.start[0], f[1] - s.start[1]];
}

const FLAT = Math.tan(Math.PI / 12);   // 15°：偏离水平不超过它才算「横笔」
/** 方向对吗（从下到上优先）：有竖向走势的要往上（dy < 0，y 向下）；接近水平的横笔要往右（dx > 0） */
export function goesRightOrUp(s: Stroke): boolean {
  const [dx, dy] = heading(s);
  return Math.abs(dy) > Math.abs(dx) * FLAT ? dy < 0 : dx >= 0;
}

const isLoop = (s: Stroke) => { const e = end(s); return s.segs.length > 2 && Math.hypot(e[0] - s.start[0], e[1] - s.start[1]) < 0.01 && s.segs.every((g) => g.k === 'L'); };
const SAME_ROW = 1.5;   // 起笔高低相差这么多以内算「一样高」，再比左右
/** 闭合的折线（星形、方框）：起点挪到最下面的顶点（一样低取最左），描线从那里起笔；带弧线的闭合笔画不动 */
export function startAtBottomLeft(s: Stroke): Stroke {
  if (!isLoop(s)) return s;
  const pts = [s.start, ...s.segs.slice(0, -1).map((g) => g.to)];
  let best = 0;
  pts.forEach((p, i) => { const q = pts[best]; if (p[1] > q[1] + SAME_ROW || (Math.abs(p[1] - q[1]) <= SAME_ROW && p[0] < q[0])) best = i; });
  const ring = [...pts.slice(best), ...pts.slice(0, best)];
  return { start: ring[0], segs: [...ring.slice(1), ring[0]].map((to) => ({ k: 'L' as const, to })), closed: s.closed };
}

export interface TracePlan { d: string; order: number }

/** 闭合折线的第一段往上走吗 */
const firstUp = (s: Stroke) => s.segs.length > 0 && s.segs[0].to[1] < s.start[1] - 0.01;

/** 一枚图标的所有笔画 → 定好方向的路径 + 起笔顺序（0 起：下面的先画，一样高左边的先画） */
export function tracePlan(strokes: string[]): TracePlan[] {
  const oriented = strokes.map((d) => {
    const s = parseStroke(d);
    if (!s) return { d, at: [0, 0] as Pt };
    const b = startAtBottomLeft(s);
    // 闭合折线：两个绕向里挑第一段往上走的那个（从下到上优先）；都不往上才按横笔规则
    const o = isLoop(b) && (firstUp(b) || firstUp(reverseStroke(b))) ? (firstUp(b) ? b : reverseStroke(b)) : goesRightOrUp(b) ? b : reverseStroke(b);
    return { d: strokeToD(o), at: o.start };
  });
  // 起笔顺序：先比高低（y 向下，y 大 = 在下面 = 先画），差不多高再比左右
  const cmp = (a: Pt, b: Pt) => (Math.abs(a[1] - b[1]) > SAME_ROW ? b[1] - a[1] : a[0] - b[0]);
  const rank = oriented.map((x, i) => [x.at, i] as const).sort((a, b) => cmp(a[0], b[0]) || a[1] - b[1]);
  const order = new Array<number>(strokes.length);
  rank.forEach(([, i], r) => { order[i] = r; });
  return oriented.map((x, i) => ({ d: x.d, order: order[i] }));
}

/** 第 order 笔（共 n 笔）在整段描线时长里的起止（0–1）：每笔占 60%，起笔在剩下的 40% 里均匀错开 */
export function strokeWindow(order: number, n: number): [number, number] {
  const len = n > 1 ? 0.6 : 1, gap = n > 1 ? (1 - len) / (n - 1) : 0;
  return [order * gap, order * gap + len];
}

