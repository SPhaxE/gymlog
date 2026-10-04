/** IP 小牛（阶段 5.5b 第二轮，2026-10-05）：按用户指定，尽量逼近意向图 docs/brand-refs/ip2-geo-b-selected.jpg（原 3_27AM）的画法——
 *  四分之三正面、头大且压在身体前上方；躯干一大块灰，臀 + 后腿是一整块骨白（上沿圆、后背直），前肩一块高高的圆角骨白；
 *  远侧两条腿暗一档；腿略带斜度；蹄是灰色半圆帽；骨白细尾 + 灰尾梢；嘴是灰米色宽圆角块、压出头的下沿；叶形耳向两侧伸；
 *  新月角从头后面伸出来，荧光只给角。每个体型的形状都是从意向图上逐块量出来的（坐标系 = 意向图上该角色的裁切框），
 *  k 把各体型换回原图的相对大小，放在一起时大小关系与原图一致。
 *  状态（用户 2026-10-05：每个成长阶段都要有）：每个体型自带眼睛的位置与基础眼型（小牛圆点眼、壮牛 / 公牛斜切怒眼），
 *  状态只换眼睛与点缀；恢复日是同一套趴睡姿态，按阶段换大小、换角；破纪录时小牛抬一条前腿（意向图 Celebrating）。
 *  颜色只用原色 Token（灰与米色的中间色用 color-mix 调出来，见 Mascot.module.css）。 */
import type { ReactNode } from 'react';
import s from './Mascot.module.css';

export type MascotStage = 0 | 1 | 2 | 3 | 4;
export type MascotMood = 'idle' | 'focused' | 'happy' | 'sleep' | 'pr' | 'tired';
export const STAGE_NAME = ['牛犊', '小牛', '壮牛', '公牛', '米洛'] as const;
export const MOOD_NAME: Record<MascotMood, string> = { idle: '平常', focused: '专注', happy: '开心', sleep: '恢复日', pr: '破纪录', tired: '减量周' };

type C = 'bone' | 'grey' | 'far' | 'ear' | 'hoof' | 'nose' | 'ink' | 'horn';
type Shape = [C, string];
/** 眼：[x, y, r, side]；side −1 = 画面左边那只，1 = 右边那只（决定怒眼、眉毛的斜向） */
type Eye = [number, number, number, number];
interface Fig {
  w: number; h: number; k: number; shapes: Shape[]; tail: [string, number];
  eyes: Eye[]; angry: boolean; head: [number, number, number]; extra?: ReactNode;
}

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
const f1 = (n: number) => n.toFixed(1);
const ell = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
  const a = (rot * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  const p = (t: number) => { const x = rx * Math.cos(t), y = ry * Math.sin(t); return `${f1(cx + x * c - y * sn)},${f1(cy + x * sn + y * c)}`; };
  return `M${p(0)}A${rx},${ry} ${rot} 1 1 ${p(Math.PI)}A${rx},${ry} ${rot} 1 1 ${p(0)}Z`;
};
/** 蹄：腿底一顶灰色半圆帽 */
const hoof = (x: number, y: number, w: number, h = 26) => `M${x},${y}H${x + w}C${x + w + 3},${y + h * 0.6} ${x + w - 6},${y + h} ${x + w - 14},${y + h}H${x + 12}C${x + 4},${y + h} ${x - 4},${y + h * 0.6} ${x},${y}Z`;
const star = (cx: number, cy: number, r: number) => { const q = r * 0.3; return `M${f1(cx)},${f1(cy - r)}L${f1(cx + q)},${f1(cy - q)}L${f1(cx + r)},${f1(cy)}L${f1(cx + q)},${f1(cy + q)}L${f1(cx)},${f1(cy + r)}L${f1(cx - q)},${f1(cy + q)}L${f1(cx - r)},${f1(cy)}L${f1(cx - q)},${f1(cy - q)}Z`; };
const tri = (cx: number, cy: number, r: number, rot: number) => {
  const pts = [0, 120, 240].map((d) => { const a = ((d + rot) * Math.PI) / 180; return `${f1(cx + r * Math.sin(a))},${f1(cy - r * Math.cos(a))}`; });
  return `M${pts.join('L')}Z`;
};

/** 眼睛与眉：按状态画；基础眼型 angry = 斜切怒眼（壮牛、公牛），否则圆点 */
function Eyes({ eyes, angry, mood }: { eyes: Eye[]; angry: boolean; mood: MascotMood }) {
  return (
    <g>
      {eyes.map(([x, y, r, d], i) => {
        const sw = r * 0.62;
        // 眉：内端 = 靠鼻梁那头。坚定（专注）内低外高；累（减量周）内高外低
        const brow = (worried: boolean) => <path className={s.line} strokeWidth={sw} d={`M${f1(x - d * r * 1.3)},${f1(y - r * (worried ? 2.4 : 1.5))}L${f1(x + d * r * 1.2)},${f1(y - r * (worried ? 1.7 : 2.3))}`} />;
        if (mood === 'happy') return <path key={i} className={s.line} strokeWidth={sw} d={`M${f1(x - r * 1.2)},${f1(y + r * 0.5)}Q${f1(x)},${f1(y - r * 1.4)} ${f1(x + r * 1.2)},${f1(y + r * 0.5)}`} />;
        if (mood === 'pr') return <path key={i} className={s.ink} d={star(x, y, r * 1.8)} />;
        if (mood === 'tired') return <g key={i}>
          <path className={s.line} strokeWidth={sw} d={`M${f1(x - r * 1.2)},${f1(y - r * 0.1)}Q${f1(x)},${f1(y + r * 1.3)} ${f1(x + r * 1.2)},${f1(y - r * 0.1)}`} />{brow(true)}</g>;
        const base = angry
          // 怒眼：上沿从外侧高处斜切到内侧低处（意向图公牛），下半是圆
          ? <path className={s.ink} d={`M${f1(x + d * r * 1.25)},${f1(y - r * 1.05)}L${f1(x - d * r * 1.3)},${f1(y + r * 0.35)}Q${f1(x - d * r * 0.85)},${f1(y + r * 1.3)} ${f1(x + d * r * 0.05)},${f1(y + r * 1.2)}Q${f1(x + d * r * 1.25)},${f1(y + r * 0.9)} ${f1(x + d * r * 1.25)},${f1(y - r * 1.05)}Z`} />
          : <circle className={s.ink} cx={x} cy={y} r={r} />;
        return <g key={i}>{base}{mood === 'focused' && !angry && brow(false)}</g>;
      })}
    </g>
  );
}

/** 破纪录的彩屑：围着头散开，灰米色为主，两颗荧光星 */
function Confetti({ head: [cx, cy, r] }: { head: [number, number, number] }) {
  const tris: Array<[number, number, number, number]> = [[-1.75, -1.35, 0.17, 15], [0.1, -1.95, 0.15, 200], [-1.95, 0.25, 0.17, 40], [1.45, 0.95, 0.16, 100]];
  const dots: Array<[number, number, number]> = [[-1.35, -0.55, 0.14], [-0.7, -1.7, 0.11], [1.75, -0.1, 0.14]];
  return (
    <g>
      {tris.map(([x, y, q, a], i) => <path key={i} className={s.ear} d={tri(cx + x * r, cy + y * r, q * r, a)} />)}
      {dots.map(([x, y, q], i) => <circle key={i} className={s.ear} cx={f1(cx + x * r)} cy={f1(cy + y * r)} r={f1(q * r)} />)}
      <path className={s.horn} d={star(cx - 1.05 * r, cy - 1.5 * r, 0.16 * r)} /><path className={s.horn} d={star(cx + 1.4 * r, cy - 1.25 * r, 0.12 * r)} />
    </g>
  );
}

/* ---------------- 小牛（意向图 Focused / Happy / Tired / Celebrating，坐标系 423 × 400） ---------------- */
const CALF_HORNS: Shape[] = [
  ['horn', 'M207,20C190,42 194,78 228,92L250,80C224,70 212,52 207,20Z'],
  ['horn', 'M378,20C395,42 391,78 357,92L335,80C361,70 373,52 378,20Z'],
];
const CALF_HEAD: Shape[] = [
  ['ear', 'M166,112C190,96 212,92 234,96L234,130C210,132 186,126 166,112Z'],
  ['ear', 'M410,112C386,96 364,92 342,96L342,130C366,132 390,126 410,112Z'],
  ['bone', 'M218,118C218,78 248,48 290,48C332,48 360,78 360,118C360,168 335,200 290,206C246,200 218,168 218,118Z'],
  ['ear', rr(247, 160, 96, 60, 30)],
  ['nose', ell(277, 192, 10, 6, 25)],
  ['nose', ell(316, 192, 10, 6, -25)],
];
const calf = (pr: boolean): Fig => ({
  w: 423, h: 400, k: 1.1, tail: ['M66,208C32,204 22,232 26,262', 10],
  eyes: [[258, 128, 12, -1], [330, 128, 12, 1]], angry: false, head: [290, 128, 80],
  shapes: [
    ...CALF_HORNS,
    ['far', 'M112,290L150,290L158,368L118,368Z'], ['hoof', hoof(115, 366, 45)],
    // 破纪录：远侧前腿抬起来（意向图 Celebrating）
    ...(pr ? [['far', 'M262,232L304,236L318,292L292,342L268,330L286,292Z'], ['hoof', 'M268,330L292,342C290,360 280,368 270,362L258,352C254,344 260,334 268,330Z']] as Shape[]
      : [['far', 'M270,230L312,230L318,368L278,368Z'], ['hoof', hoof(276, 366, 44)]] as Shape[]),
    ['grey', 'M100,196C130,178 180,165 246,150L318,205L318,262C300,285 230,298 190,302L140,302C110,300 98,260 100,196Z'],
    ['bone', 'M50,215C50,195 60,186 80,185L132,180C145,182 152,192 150,210L148,285C146,298 135,302 120,302L97,302L97,368L55,368Z'], ['hoof', hoof(54, 366, 45)],
    ['bone', 'M186,258C186,232 200,220 222,220L240,220C252,222 254,232 252,245L262,368L218,368Z'], ['hoof', hoof(216, 366, 47)],
    ...CALF_HEAD,
  ],
});

/* ---------------- 牛犊（意向图 Newborn Calf，坐标系 620 × 400；侧脸，一只眼） ---------------- */
const newborn: Fig = {
  w: 620, h: 400, k: 0.62, tail: ['M70,175C40,178 30,205 34,232', 14],
  eyes: [[420, 153, 17, -1]], angry: false, head: [440, 150, 110],
  shapes: [
    ['horn', 'M335,45C346,38 362,54 374,72L350,96C340,80 330,60 335,45Z'],
    ['horn', 'M512,40C524,48 527,64 518,80L494,70C500,58 505,45 512,40Z'],
    ['far', rr(140, 290, 76, 88, 38)],
    ['far', rr(384, 240, 76, 138, 38)],
    ['grey', 'M100,140C200,110 300,85 390,80L440,90L450,250C420,300 330,320 280,326L130,312Z'],
    ['bone', 'M45,215C45,165 80,128 135,128C185,128 220,165 220,215C220,260 195,295 160,305L120,310L120,340C120,362 103,378 82,378C60,378 45,362 45,340Z'],
    ['bone', rr(284, 225, 76, 153, 38)],
    ['ear', 'M250,125C270,100 320,95 352,112L350,150C310,158 268,150 250,125Z'],
    ['ear', 'M580,120C565,98 540,92 520,95L520,140C545,142 568,135 580,120Z'],
    ['bone', 'M330,150C330,85 375,40 435,40C495,40 540,85 540,150C540,210 495,255 435,255C375,255 330,210 330,150Z'],
    ['ear', 'M455,215C455,185 470,172 495,172L535,172C558,172 572,190 572,215C572,240 558,258 535,258L495,258C470,258 455,240 455,215Z'],
  ],
};

/* ---------------- 壮牛（意向图 Sturdy Young Bull，坐标系 541 × 400；头侧转，一只怒眼） ---------------- */
const sturdy: Fig = {
  w: 541, h: 400, k: 1.17, tail: ['M60,176C28,170 18,200 22,236', 11],
  eyes: [[385, 157, 12, -1]], angry: true, head: [405, 165, 85],
  shapes: [
    ['horn', 'M300,18C268,40 270,98 330,124L362,108C320,92 300,62 300,18Z'],
    ['horn', 'M488,15C522,36 528,92 470,124L440,110C482,94 494,60 488,15Z'],
    ['far', 'M128,282L166,278L176,370L136,372Z'], ['hoof', hoof(134, 368, 44)],
    ['far', 'M346,262L386,254L402,370L362,372Z'], ['hoof', hoof(360, 368, 46)],
    ['grey', 'M148,170C200,140 240,110 300,88L420,90L440,180C430,250 400,300 350,315C300,318 220,300 165,286L140,250Z'],
    ['bone', 'M55,202C55,170 70,155 95,152L158,150L165,170L160,285L140,300L100,330L100,370L60,370Z'], ['hoof', hoof(58, 368, 44)],
    ['bone', 'M236,186C236,178 241,172 250,172L290,172C320,172 330,200 328,230L325,310L345,366L300,370L272,300L246,240Z'], ['hoof', hoof(298, 366, 48)],
    ['ear', 'M290,146C310,128 330,124 350,128L352,160C330,162 306,158 290,146Z'],
    ['ear', 'M505,145C490,130 475,126 462,128L462,158C478,160 494,156 505,145Z'],
    ['bone', 'M340,108L462,92C470,92 472,100 470,110L465,195C460,225 440,240 410,240C375,238 348,210 343,175Z'],
    ['ear', rr(382, 192, 82, 52, 24)],
    ['nose', ell(410, 218, 8, 5, 25)], ['nose', ell(444, 218, 8, 5, -25)],
  ],
};

/* ---------------- 公牛（意向图 Full-grown Bull，坐标系 543 × 400；两只怒眼） ---------------- */
const bull = (legend: boolean): Fig => ({
  w: 543, h: 400, k: 1.34, tail: ['M70,170C35,168 18,200 20,240', 12],
  eyes: [[383, 154, 13, -1], [449, 154, 13, 1]], angry: true, head: [410, 165, 90],
  shapes: [
    ['horn', 'M300,10C270,30 272,100 335,125L370,112C322,92 300,55 300,10Z'],
    ['horn', 'M490,10C528,30 534,95 470,120L440,108C484,92 498,55 490,10Z'],
    ['far', 'M125,290L160,285L190,380L150,382Z'], ['hoof', hoof(148, 378, 46)],
    ['far', 'M386,298L430,290L438,380L396,382Z'], ['hoof', hoof(394, 378, 48)],
    ['grey', 'M140,160C190,120 240,80 300,60L380,60C420,62 450,85 460,130L455,230C440,290 390,315 330,318C270,316 210,300 160,290L130,250Z'],
    ['bone', 'M40,205C40,172 55,150 85,148L160,142L168,165L162,290L135,310L85,330L85,380L42,380Z'], ['hoof', hoof(40, 378, 47)],
    ['bone', 'M256,176L300,172C325,172 338,195 336,230L330,320L350,380L305,382L285,320L258,250Z'], ['hoof', hoof(303, 378, 49)],
    ['ear', 'M300,140C325,122 350,120 368,125L370,158C345,162 318,156 300,140Z'],
    ['ear', 'M510,145C495,128 478,124 462,126L462,160C480,162 498,158 510,145Z'],
    ['bone', 'M348,98L462,88C470,88 474,95 472,105L462,200C455,232 435,248 408,248C375,245 352,215 350,180Z'],
    ['ear', rr(380, 196, 84, 54, 26)],
    ['nose', ell(410, 222, 8, 5, 25)], ['nose', ell(445, 222, 8, 5, -25)],
  ],
  extra: legend ? <path className={s.horn} d={ell(18, 262, 13, 24, 15)} /> : undefined,
});

/* ---------------- 趴睡（意向图 Sleeping (Rest Day)，坐标系 895 × 400）：各阶段同一姿态，按阶段换大小与角 ---------------- */
const SLEEP_K = [0.42, 0.62, 0.8, 0.95, 0.98];
const sleep = (stage: MascotStage): Fig => {
  // 角：小牛的新月角放大到睡姿头上（头中心 648,190）；牛犊是两个角芽；越往后越大
  const hk = [0, 1.75, 2.15, 2.5, 2.6][stage];
  const horns: ReactNode = stage === 0
    ? <g><path className={s.horn} d={ell(560, 60, 16, 26, -30)} /><path className={s.horn} d={ell(736, 60, 16, 26, 30)} /></g>
    : <g transform={`translate(648 ${120 - 30 * (stage - 1)}) scale(${hk}) translate(-292 -78)`}>{CALF_HORNS.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}</g>;
  return {
    w: 895, h: 400, k: SLEEP_K[stage], tail: ['M66,242C14,252 20,346 110,356', 22],
    eyes: [], angry: false, head: [648, 190, 140],
    shapes: [
      ['grey', 'M150,130C250,95 370,45 430,40C520,38 570,80 580,120L560,300L300,305L230,300Z'],
      ['bone', rr(60, 302, 700, 82, 41)],
      ['far', 'M300,302H430V384H300Z'],
      ['bone', ell(170, 238, 110, 110)],
      ['ear', 'M410,175C450,150 500,140 530,145L520,210C470,215 430,200 410,175Z'],
      ['ear', 'M885,170C850,145 815,138 780,140L790,205C830,212 865,198 885,170Z'],
    ],
    extra: <>
      {horns}
      <path className={s.bone} d={ell(648, 190, 140, 142)} />
      <path className={s.ear} d={rr(565, 266, 190, 114, 55)} />
      <path className={s.nose} d={ell(622, 330, 22, 7, 25)} /><path className={s.nose} d={ell(704, 330, 22, 7, -25)} />
      <g className={s.thick}><path d="M548,190Q588,236 628,190" /><path d="M678,190Q718,236 758,190" /></g>
      <g className={s.zz}><text x="790" y="96" fontSize="64">z</text><text x="842" y="44" fontSize="46">z</text></g>
    </>,
  };
};

function figure(stage: MascotStage, mood: MascotMood): Fig {
  if (mood === 'sleep') return sleep(stage);
  if (stage === 0) return newborn;
  if (stage === 2) return sturdy;
  if (stage >= 3) return bull(stage === 4);
  return calf(mood === 'pr');
}

/** 尾梢：在尾巴末端挂一撮灰（水滴形，略斜） */
function tuft(tail: string, w: number) {
  const m = tail.match(/(-?[\d.]+),(-?[\d.]+)$/)!;
  return ell(Number(m[1]) - w * 0.2, Number(m[2]) + w * 1.7, w * 1.15, w * 2, 15);
}

/** 整只小牛。渲染宽度 = --fig-w（各体型在原图里的相对宽度）× --mascot-unit（默认 0.1em）；也可以直接用 className 设宽。
 *  animate：按 pet-forge 的 SVG 分层约定动起来——身体 / 头 / 眼 / 尾四层各有显式支点（尾根、颈、落地线中点），
 *  各自循环、周期故意错开（呼吸、甩尾、眨眼不同步才像活物）；循环关键帧首尾相同，见 Mascot.module.css。 */
export function Mascot({ stage = 1, mood = 'idle', animate, className, title }: { stage?: MascotStage; mood?: MascotMood; animate?: boolean; className?: string; title?: string }) {
  const f = figure(stage, mood);
  const sleeping = mood === 'sleep';
  // 分层：角 + 第一只耳朵之后的部件（耳、头、口鼻、鼻孔）= 头；其余 = 身体
  const firstEar = f.shapes.findIndex(([c]) => c === 'ear');
  const head = f.shapes.filter(([c], i) => c === 'horn' || i >= firstEar);
  const body = f.shapes.filter(([c], i) => c !== 'horn' && i < firstEar);
  const tailRoot = f.tail[0].match(/^M(-?[\d.]+),(-?[\d.]+)/)!;
  const at = (x: number | string, y: number | string) => ({ transformOrigin: `${x}px ${y}px` });
  const [hx, hy, hr] = f.head;
  return (
    <svg className={`${className ?? s.mascot} ${animate ? `${s.alive} ${s[`m_${mood}`]}` : ''}`} viewBox={`0 0 ${f.w} ${f.h}`} style={{ ['--fig-w' as string]: f.w * f.k }}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <g className={s.whole} style={at(f.w / 2, f.h - 12)}>
        <g className={s.tailG} style={at(tailRoot[1], tailRoot[2])}>
          <path className={s.tail} strokeWidth={f.tail[1]} d={f.tail[0]} />
          {sleeping ? <path className={stage === 4 ? s.horn : s.hoof} d={ell(150, 356, 44, 27, -10)} />
            : stage !== 4 && <path className={s.hoof} d={tuft(f.tail[0], f.tail[1])} />}
          {!sleeping && stage === 4 && f.extra}
        </g>
        <g className={s.bodyG} style={at(f.w / 2, f.h - 12)}>{body.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}</g>
        <g className={s.headG} style={at(hx - hr * 0.55, hy + hr * 0.85)}>
          {head.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}
          {sleeping && f.extra}
          {!sleeping && <g className={s.eyesG}><Eyes eyes={f.eyes} angry={f.angry} mood={mood} /></g>}
        </g>
        {mood === 'pr' && <g className={s.confetti} style={at(hx, hy)}><Confetti head={f.head} /></g>}
      </g>
    </svg>
  );
}

/** 只有头（16–48px 的头像、通知、Toast）：小牛的正脸，角按阶段长；公牛段换成怒眼 */
export function MascotHead({ stage = 1, mood = 'idle', className, title }: { stage?: MascotStage; mood?: MascotMood; className?: string; title?: string }) {
  const k = [0, 0.75, 1, 1.25, 1.35][stage];
  return (
    <svg className={className ?? s.head} viewBox="160 0 260 225" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {stage === 0 ? <g><path className={s.horn} d={ell(232, 70, 9, 15, -30)} /><path className={s.horn} d={ell(348, 70, 9, 15, 30)} /></g>
        : <g transform={`translate(290 92) scale(${k}) translate(-290 -92)`}>{CALF_HORNS.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}</g>}
      {CALF_HEAD.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}
      {mood === 'sleep' ? <g className={s.thinLine}><path d="M244,126Q258,144 272,126" /><path d="M316,126Q330,144 344,126" /></g>
        : <Eyes eyes={[[258, 128, 12, -1], [330, 128, 12, 1]]} angry={stage >= 3} mood={mood} />}
    </svg>
  );
}
