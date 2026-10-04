/** IP 小牛（阶段 5.5b 第一轮，2026-10-05）：取用户选定的两张意向图之长——
 *  3_13AM 的几何构成（圆、圆角矩形、新月角；骨白 + 灰两色，荧光只给角）与「角从无到芽到新月」的成长线；
 *  3_27AM 的成长幅度（壮牛起肩峰、公牛压眉）与正脸表情（星星眼、闭眼、垂眼）。
 *  身体侧向右、头转向观众，所以每个阶段都能做表情。几何全部在 200 × 140 的画布里按参数生成，换阶段只换参数。
 *  颜色只用原色 Token：骨白 bone-100、灰 gray-600 / gray-500 / gray-800、眼 gray-0、角 lime-500。 */
import type { ReactNode } from 'react';
import s from './Mascot.module.css';

export type MascotStage = 0 | 1 | 2 | 3 | 4;
export type MascotMood = 'idle' | 'focused' | 'happy' | 'sleep' | 'pr' | 'tired';
export const STAGE_NAME = ['牛犊', '小牛', '壮牛', '公牛', '米洛'] as const;
export const MOOD_NAME: Record<MascotMood, string> = { idle: '平常', focused: '专注', happy: '开心', sleep: '恢复日', pr: '破纪录', tired: '减量周' };

const G = 128; // 地面
/** 每个阶段的体型：体长、体高、腿长、腿宽、头、肩峰、角（0 无 / 1 芽 / 2 小 / 3 中 / 4 大）、眉（0 无 / 1 坚定 / 2 压眉） */
const P = [
  { bl: 44, bh: 26, ll: 19, lw: 8, hs: 31, hump: 0, horn: 0, brow: 0 },
  { bl: 56, bh: 30, ll: 25, lw: 9, hs: 33, hump: 0.1, horn: 1, brow: 0 },
  { bl: 72, bh: 38, ll: 29, lw: 11, hs: 35, hump: 0.55, horn: 2, brow: 1 },
  { bl: 86, bh: 46, ll: 31, lw: 13, hs: 38, hump: 0.95, horn: 3, brow: 2 },
  { bl: 88, bh: 47, ll: 31, lw: 13.5, hs: 39, hump: 1, horn: 4, brow: 2 },
] as const;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 新月角：根在 (x, y)（头顶外侧），先向外略下沉再向上弯，尖朝上微内收；side = −1 左 / 1 右 */
function horn(x: number, y: number, size: number, side: number) {
  const w = size * 0.95, h = size * 1.05, t = size * 0.42;
  const X = (k: number) => r1(x + side * k);
  return `M${X(-t * 0.9)},${r1(y + t * 0.15)}`
    + ` C${X(w * 0.25)},${r1(y + t * 1.05)} ${X(w * 1.2)},${r1(y + t * 0.5)} ${X(w * 1.02)},${r1(y - h)}`
    + ` C${X(w * 0.78)},${r1(y - h * 0.42)} ${X(w * 0.32)},${r1(y - t * 0.15)} ${X(-t * 0.2)},${r1(y - t * 0.55)} Z`;
}

/** 四角星（破纪录的星星眼与彩屑） */
function star(cx: number, cy: number, r: number) {
  const k = r * 0.28;
  return `M${r1(cx)},${r1(cy - r)} L${r1(cx + k)},${r1(cy - k)} L${r1(cx + r)},${r1(cy)} L${r1(cx + k)},${r1(cy + k)} L${r1(cx)},${r1(cy + r)} L${r1(cx - k)},${r1(cy + k)} L${r1(cx - r)},${r1(cy)} L${r1(cx - k)},${r1(cy - k)} Z`;
}

/** 正脸：头、耳、角、口鼻、眼、眉。hx / hy 为头中心，hs 为头高 */
export function Face({ hx, hy, hs, hornLevel, brow, mood }: { hx: number; hy: number; hs: number; hornLevel: number; brow: number; mood: MascotMood }) {
  const hw = hs * 0.92, ex = hs * 0.21, ey = hy - hs * 0.06, er = hs * 0.075;
  const sw = Math.max(1.4, hs * 0.07);
  let eyes: ReactNode;
  if (mood === 'happy') eyes = [-1, 1].map((d) => <path key={d} className={s.lineInk} strokeWidth={sw} d={`M${r1(hx + d * ex - er * 1.3)},${r1(ey + er * 0.6)} Q${r1(hx + d * ex)},${r1(ey - er * 1.6)} ${r1(hx + d * ex + er * 1.3)},${r1(ey + er * 0.6)}`} />);
  else if (mood === 'sleep') eyes = [-1, 1].map((d) => <path key={d} className={s.lineInk} strokeWidth={sw} d={`M${r1(hx + d * ex - er * 1.3)},${r1(ey)} Q${r1(hx + d * ex)},${r1(ey + er * 1.6)} ${r1(hx + d * ex + er * 1.3)},${r1(ey)}`} />);
  else if (mood === 'pr') eyes = [-1, 1].map((d) => <path key={d} className={s.ink} d={star(hx + d * ex, ey, er * 2.1)} />);
  else if (mood === 'tired') eyes = [-1, 1].map((d) => <path key={d} className={s.ink} d={`M${r1(hx + d * ex - er * 1.2)},${r1(ey)} A${r1(er * 1.2)},${r1(er * 1.2)} 0 0 0 ${r1(hx + d * ex + er * 1.2)},${r1(ey)} Z`} />);
  else eyes = [-1, 1].map((d) => <circle key={d} className={s.ink} cx={r1(hx + d * ex)} cy={r1(ey)} r={r1(er * (brow === 2 ? 1 : 1.15))} />);
  // 眉：坚定 = 内低外高的短斜线；压眉 = 更陡更长；减量周 = 内高外低（累）
  const b = mood === 'tired' ? -0.8 : mood === 'focused' ? Math.max(brow, 1) : mood === 'idle' ? brow : 0;
  const brows = b === 0 ? null : [-1, 1].map((d) => {
    const lift = b < 0 ? -1 : 1, len = er * (b === 2 ? 2.3 : 1.8), slope = er * (b === 2 ? 1.1 : b < 0 ? 0.55 : 0.7) * lift;
    const by = ey - er * 2.1;
    return <path key={d} className={s.lineInk} strokeWidth={sw} d={`M${r1(hx + d * (ex - len * 0.75))},${r1(by + slope)} L${r1(hx + d * (ex + len * 0.55))},${r1(by - slope)}`} />;
  });
  const hornSize = [0, 0, hs * 0.3, hs * 0.4, hs * 0.48][hornLevel];
  return (
    <g>
      {/* 耳：灰色扁椭圆，略下垂 */}
      {[-1, 1].map((d) => <ellipse key={d} className={s.grey} cx={r1(hx + d * hw * 0.68)} cy={r1(hy - hs * 0.16)} rx={r1(hs * 0.3)} ry={r1(hs * 0.12)} transform={`rotate(${d * 14} ${r1(hx + d * hw * 0.68)} ${r1(hy - hs * 0.16)})`} />)}
      {hornLevel === 1 && [-1, 1].map((d) => <circle key={d} className={s.horn} cx={r1(hx + d * hw * 0.34)} cy={r1(hy - hs * 0.6)} r={r1(hs * 0.075)} />)}
      {hornLevel >= 2 && [-1, 1].map((d) => <path key={d} className={s.horn} d={horn(hx + d * hw * 0.36, hy - hs * 0.36, hornSize, d)} />)}
      <rect className={s.bone} x={r1(hx - hw / 2)} y={r1(hy - hs / 2)} width={r1(hw)} height={r1(hs)} rx={r1(hs * 0.36)} />
      <rect className={s.muzzle} x={r1(hx - hw * 0.4)} y={r1(hy + hs * 0.12)} width={r1(hw * 0.8)} height={r1(hs * 0.36)} rx={r1(hs * 0.18)} />
      {[-1, 1].map((d) => <ellipse key={d} className={s.nostril} cx={r1(hx + d * hw * 0.15)} cy={r1(hy + hs * 0.3)} rx={r1(hs * 0.055)} ry={r1(hs * 0.04)} />)}
      {eyes}
      {brows}
    </g>
  );
}

/** 整只小牛（侧身向右、头转向观众）。size 为渲染宽度（CSS），画布固定 200 × 140 */
export function Mascot({ stage = 1, mood = 'idle', className, title }: { stage?: MascotStage; mood?: MascotMood; className?: string; title?: string }) {
  const p = P[stage];
  const lying = mood === 'sleep';
  const x0 = 100 - p.bl / 2 - p.hs * 0.12;
  const bodyTop = lying ? G - p.bh * 0.98 : G - p.ll - p.bh;
  const hx = x0 + p.bl + p.hs * 0.12, hy = lying ? bodyTop + p.hs * 0.32 : bodyTop - p.hs * (stage >= 2 ? 0.02 : 0.12) + (mood === 'tired' ? p.hs * 0.12 : 0);
  const legTop = bodyTop + p.bh * 0.55, hoof = stage >= 2;
  const leg = (x: number, near: boolean, k: string) => lying ? null : (
    <g key={k}>
      <rect className={near ? s.bone : s.far} x={r1(x)} y={r1(legTop)} width={p.lw} height={r1(G - legTop)} rx={r1(p.lw / 2)} />
      {hoof && <rect className={s.hoof} x={r1(x)} y={r1(G - p.lw * 0.7)} width={p.lw} height={r1(p.lw * 0.7)} rx={r1(p.lw * 0.3)} />}
    </g>
  );
  // 尾：从臀部上沿甩下，末端一撮深灰
  const tx = x0 + p.bh * 0.06, ty = bodyTop + p.bh * 0.22;
  const tailEnd: [number, number] = lying ? [x0 - p.bh * 0.15, G - p.lw * 0.4] : [x0 - p.bh * 0.32, bodyTop + p.bh * 1.05];
  const hump = p.hump * p.bh;
  return (
    <svg className={className ?? s.mascot} viewBox="0 0 200 140" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {/* 远侧两条腿（稍暗） */}
      {leg(x0 + p.bl * 0.2, false, 'hf')}
      {leg(x0 + p.bl * 0.66, false, 'ff')}
      <path className={s.tail} strokeWidth={r1(p.lw * 0.32)} d={`M${r1(tx)},${r1(ty)} C${r1(x0 - p.bh * 0.42)},${r1(ty - p.bh * 0.05)} ${r1(x0 - p.bh * 0.42)},${r1(tailEnd[1] - p.bh * 0.45)} ${r1(tailEnd[0])},${r1(tailEnd[1] - p.lw * 0.6)}`} />
      <path className={stage === 4 ? s.horn : s.hoof} d={`M${r1(tailEnd[0])},${r1(tailEnd[1] - p.lw * 1.2)} q${r1(p.lw * 0.65)},${r1(p.lw * 0.9)} 0,${r1(p.lw * 1.5)} q${r1(-p.lw * 0.65)},${r1(-p.lw * 0.6)} 0,${r1(-p.lw * 1.5)} Z`} />
      {/* 躯干：灰底；肩峰（壮牛起）；臀部骨白圆；胸前骨白 */}
      <rect className={s.grey} x={r1(x0)} y={r1(bodyTop)} width={p.bl} height={p.bh} rx={r1(p.bh * 0.42)} />
      {/* 肩峰：一团圆润的灰从背中段鼓到肩上（不是尖的） */}
      {hump > 0 && <ellipse className={s.grey} cx={r1(x0 + p.bl * 0.68)} cy={r1(bodyTop + p.bh * 0.32)} rx={r1(p.bl * 0.3)} ry={r1(p.bh * (0.3 + p.hump * 0.42))} />}
      {/* 臀：骨白的椭圆，收在躯干里 */}
      <ellipse className={s.bone} cx={r1(x0 + p.bh * 0.46)} cy={r1(bodyTop + p.bh * 0.5)} rx={r1(p.bh * 0.46)} ry={r1(p.bh * 0.5)} />
      <ellipse className={s.bone} cx={r1(x0 + p.bl - p.bh * 0.3)} cy={r1(bodyTop + p.bh * 0.68)} rx={r1(p.bh * 0.26)} ry={r1(p.bh * 0.34)} />
      {lying && [0.2, 0.62].map((k) => <rect key={k} className={s.far} x={r1(x0 + p.bl * k)} y={r1(G - p.lw * 0.85)} width={r1(p.lw * 2.2)} height={r1(p.lw * 0.85)} rx={r1(p.lw * 0.42)} />)}
      {/* 近侧两条腿 */}
      {leg(x0 + p.bl * 0.06, true, 'hn')}
      {leg(x0 + p.bl - p.lw * 1.5, true, 'fn')}
      <Face hx={hx} hy={hy} hs={p.hs} hornLevel={p.horn} brow={p.brow} mood={mood} />
      {mood === 'sleep' && <g className={s.zz}>
        <text x={r1(hx + p.hs * 0.55)} y={r1(hy - p.hs * 0.6)} fontSize={r1(p.hs * 0.38)}>z</text>
        <text x={r1(hx + p.hs * 0.85)} y={r1(hy - p.hs * 0.95)} fontSize={r1(p.hs * 0.28)}>z</text>
      </g>}
      {mood === 'pr' && <g className={s.confetti}>
        {[[-0.95, -0.95, 0.12], [0.9, -1.05, 0.1], [1.15, -0.35, 0.08], [-1.2, -0.3, 0.07], [0.15, -1.45, 0.09]].map(([dx, dy, rr], i) =>
          <path key={i} className={i % 2 ? s.horn : s.boneFx} d={star(hx + dx * p.hs, hy + dy * p.hs, rr * p.hs * 1.4)} />)}
      </g>}
      {mood === 'tired' && <path className={s.sweat} d={`M${r1(hx + p.hs * 0.55)},${r1(hy - p.hs * 0.35)} q${r1(p.hs * 0.09)},${r1(p.hs * 0.14)} 0,${r1(p.hs * 0.2)} q${r1(-p.hs * 0.09)},${r1(-p.hs * 0.06)} 0,${r1(-p.hs * 0.2)} Z`} />}
    </svg>
  );
}

/** 只有头（16–48px 的头像、通知、Toast）：画布 64 × 64 */
export function MascotHead({ stage = 2, mood = 'idle', className, title }: { stage?: MascotStage; mood?: MascotMood; className?: string; title?: string }) {
  const p = P[stage];
  return (
    <svg className={className ?? s.head} viewBox="0 0 64 64" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <Face hx={32} hy={38} hs={36} hornLevel={p.horn} brow={p.brow} mood={mood} />
    </svg>
  );
}
