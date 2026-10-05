/** IP 小牛（阶段 5.5b 第四轮，2026-10-05）：用户要求「务必一比一复刻原图」，少做一些、做精一点。
 *  - 形状不再手描：scripts/trace_mascot.py 把意向图 docs/brand-refs/ip2-geo-b-selected.jpg 里的牛犊与公牛按平涂色分层、
 *    用 potrace 描成矢量（mascotTrace.ts），再用「正负叠片」逐像素比对（screenshots/brand/trace-check-*.png）。
 *  - 只做三个形态：牛犊（newborn）、公牛（bull）、米洛（milo = 公牛整只换成荧光色，角反过来用骨白）。
 *  - 分层：身体 / 尾 / 头 / 眼四层，各有支点，供动效使用（pet-forge 的 SVG 约定，见 Mascot.module.css）。
 *  - 状态：平常 / 专注用原图的眼；开心、破纪录、减量周、恢复日换成画的眼（位置与大小取自原图的眼）；
 *    恢复日 = 同一只牛把肚皮线以下的腿裁掉、整只落地、换上折起的腿、头低到嘴贴地。
 *  颜色只用原色 Token（原图的灰与米色用 color-mix 从原色调出，见 Mascot.module.css）。 */
import { useId, type ReactNode } from 'react';
import { TRACE, type TraceColor, type TraceFig } from './mascotTrace';
import s from './Mascot.module.css';

export type MascotStage = 'newborn' | 'bull' | 'milo';
export type MascotMood = 'idle' | 'focused' | 'happy' | 'sleep' | 'pr' | 'tired';
export const MASCOT_STAGES: MascotStage[] = ['newborn', 'bull', 'milo'];
export const STAGE_NAME: Record<MascotStage, string> = { newborn: '牛犊', bull: '公牛', milo: '米洛' };
export const MOOD_NAME: Record<MascotMood, string> = { idle: '平常', focused: '专注', happy: '开心', sleep: '恢复日', pr: '破纪录', tired: '减量周' };

const f1 = (n: number) => n.toFixed(1);
const COLOR: Record<TraceColor, string> = { grey: s.grey, mid: s.mid, far: s.far, bone: s.bone, lime: s.horn, dark: s.ink };
const star = (cx: number, cy: number, r: number) => { const q = r * 0.3; return `M${f1(cx)},${f1(cy - r)}L${f1(cx + q)},${f1(cy - q)}L${f1(cx + r)},${f1(cy)}L${f1(cx + q)},${f1(cy + q)}L${f1(cx)},${f1(cy + r)}L${f1(cx - q)},${f1(cy + q)}L${f1(cx - r)},${f1(cy)}L${f1(cx - q)},${f1(cy - q)}Z`; };
const tri = (cx: number, cy: number, r: number, rot: number) => {
  const pts = [0, 120, 240].map((d) => { const a = ((d + rot) * Math.PI) / 180; return `${f1(cx + r * Math.sin(a))},${f1(cy - r * Math.cos(a))}`; });
  return `M${pts.join('L')}Z`;
};

/** 画的眼（状态用）：位置与大小取自原图的眼 */
function MoodEyes({ eyes, mood }: { eyes: Array<[number, number, number]>; mood: MascotMood }) {
  return (
    <g>
      {eyes.map(([x, y, r], i) => {
        const d = i === 0 ? -1 : 1, sw = r * 0.55;
        if (mood === 'sleep') return <path key={i} className={s.line} strokeWidth={r * 0.6} d={`M${f1(x - r * 1.1)},${f1(y - r * 0.2)}Q${f1(x)},${f1(y + r * 1.1)} ${f1(x + r * 1.1)},${f1(y - r * 0.2)}`} />;
        if (mood === 'happy') return <path key={i} className={s.line} strokeWidth={sw} d={`M${f1(x - r)},${f1(y + r * 0.45)}Q${f1(x)},${f1(y - r * 1.15)} ${f1(x + r)},${f1(y + r * 0.45)}`} />;
        if (mood === 'pr') return <path key={i} className={s.ink} d={star(x, y, r * 1.35)} />;
        // 减量周（意向图 Tired）：实心下垂半月眼，上沿外低内高
        const ix = x - d * r * 1.05, ox = x + d * r * 1.05;
        return <path key={i} className={s.ink} d={`M${f1(ix)},${f1(y - r * 0.35)}L${f1(ox)},${f1(y + r * 0.2)}Q${f1(x + d * r * 0.35)},${f1(y + r * 1.2)} ${f1(x - d * r * 0.5)},${f1(y + r * 0.8)}Q${f1(ix - d * r * 0.1)},${f1(y + r * 0.45)} ${f1(ix)},${f1(y - r * 0.35)}Z`} />;
      })}
    </g>
  );
}

/** 破纪录的彩屑：围着头散开的灰米色三角与圆点（意向图 Celebrating） */
function Confetti({ head: [cx, cy, r] }: { head: [number, number, number] }) {
  const tris: Array<[number, number, number, number]> = [[-1.2, -0.95, 0.12, 15], [0.15, -1.25, 0.1, 200], [-1.35, 0.15, 0.12, 40], [1.15, 0.7, 0.11, 100]];
  const dots: Array<[number, number, number]> = [[-0.95, -0.35, 0.09], [-0.45, -1.15, 0.07], [1.25, -0.1, 0.09]];
  return (
    <g>
      {tris.map(([x, y, q, a], i) => <path key={i} className={s.far} d={tri(cx + x * r, cy + y * r, q * r, a)} />)}
      {dots.map(([x, y, q], i) => <circle key={i} className={s.far} cx={f1(cx + x * r)} cy={f1(cy + y * r)} r={f1(q * r)} />)}
    </g>
  );
}

const paths = (f: TraceFig, part: string) => f.layers.filter(([p]) => p === part).map(([, c, d], i) => <path key={i} className={COLOR[c]} d={d} />);

/** 整只小牛。渲染宽度 = 画布宽 × --mascot-unit（默认 0.06em；牛犊与公牛保持原图里的相对大小），也可以直接用 className 设宽。
 *  animate：身体 / 尾 / 头 / 眼四层按 Mascot.module.css 的循环动效动起来；系统开启「减少动态效果」时静止。 */
export function Mascot({ stage = 'newborn', mood = 'idle', animate, className, title }: { stage?: MascotStage; mood?: MascotMood; animate?: boolean; className?: string; title?: string }) {
  const f = TRACE[stage === 'newborn' ? 'newborn' : 'bull'];
  const clip = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const sleeping = mood === 'sleep';
  const at = (x: number, y: number) => ({ transformOrigin: `${x}px ${y}px` });
  const [hx, hy, hr] = f.head;
  // 趴下：肚皮线以下的腿裁掉，整只下沉到地面；头再多沉一点，让嘴贴地
  const drop = f.ground - f.belly - f.h * 0.04;
  const headDrop = f.ground - f.headBox[3] - f.h * 0.01;
  const headPose = sleeping ? `translate(${f1(f.w * 0.01)} ${f1(headDrop)}) rotate(5 ${f.neck[0]} ${f.neck[1]})`
    : mood === 'happy' ? `rotate(-6 ${f.neck[0]} ${f.neck[1]})` : undefined;
  const fold = f.h * 0.075;
  const folds: ReactNode = sleeping && <g>
    <rect className={s.far} x={f1(f.w * 0.2)} y={f1(f.ground - fold)} width={f1(f.w * 0.3)} height={f1(fold)} rx={f1(fold / 2)} />
    <rect className={s.bone} x={f1(f.w * 0.06)} y={f1(f.ground - fold)} width={f1(f.w * 0.3)} height={f1(fold)} rx={f1(fold / 2)} />
    <rect className={s.bone} x={f1(f.headBox[0] - f.w * 0.12)} y={f1(f.ground - fold)} width={f1(f.w * 0.36)} height={f1(fold)} rx={f1(fold / 2)} />
  </g>;
  const ownEyes = mood === 'idle' || mood === 'focused';
  return (
    <svg className={`${className ?? s.mascot} ${stage === 'milo' ? s.milo : ''} ${animate ? `${s.alive} ${s[`m_${mood}`]}` : ''}`}
      viewBox={`0 0 ${f.w} ${f.h}`} style={{ ['--fig-w' as string]: f.w }}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {sleeping && <defs><clipPath id={clip}><rect x="-50" y="-50" width={f.w + 100} height={f.belly + 50} /></clipPath></defs>}
      <g className={s.whole} style={at(f.w / 2, f.ground)}>
        <g transform={sleeping ? `translate(0 ${f1(drop)})` : undefined}>
          <g clipPath={sleeping ? `url(#${clip})` : undefined}>
            {f.tailRoot && <g className={s.tailG} style={at(f.tailRoot[0], f.tailRoot[1])}>{paths(f, 'tail')}</g>}
            <g className={s.bodyG} style={at(f.w / 2, f.ground)}>{paths(f, 'body')}</g>
          </g>
        </g>
        {folds}
        <g transform={headPose}>
          <g className={s.headG} style={at(f.neck[0], f.neck[1])}>
            {paths(f, 'head')}
            <g className={s.eyesG}>{ownEyes ? paths(f, 'eyes') : <MoodEyes eyes={f.eyes} mood={mood} />}</g>
          </g>
        </g>
        {sleeping && <g className={s.zz}>
          <text x={f1(hx + hr * 0.75)} y={f1(hy + headDrop - hr * 0.55)} fontSize={f1(hr * 0.3)}>z</text>
          <text x={f1(hx + hr * 0.98)} y={f1(hy + headDrop - hr * 0.82)} fontSize={f1(hr * 0.22)}>z</text>
        </g>}
        {mood === 'pr' && <g className={s.confetti} style={at(hx, hy)}><Confetti head={f.head} /></g>}
      </g>
    </svg>
  );
}

/** 只有头（16–48px 的头像、通知、Toast）：取描出来的头层，画布裁到头的外框 */
export function MascotHead({ stage = 'bull', mood = 'idle', className, title }: { stage?: MascotStage; mood?: MascotMood; className?: string; title?: string }) {
  const f = TRACE[stage === 'newborn' ? 'newborn' : 'bull'];
  const [x0, y0, x1, y1] = f.headBox, pad = (x1 - x0) * 0.04;
  const ownEyes = mood === 'idle' || mood === 'focused';
  return (
    <svg className={`${className ?? s.head} ${stage === 'milo' ? s.milo : ''}`} viewBox={`${f1(x0 - pad)} ${f1(y0 - pad)} ${f1(x1 - x0 + pad * 2)} ${f1(y1 - y0 + pad * 2)}`}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {paths(f, 'head')}
      {ownEyes ? paths(f, 'eyes') : <MoodEyes eyes={f.eyes} mood={mood} />}
    </svg>
  );
}
