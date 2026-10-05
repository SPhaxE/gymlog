/** IP 小牛（阶段 5.5b 第三轮，2026-10-05）：逼近意向图 docs/brand-refs/ip2-geo-b-selected.jpg（原 3_27AM）的画法——
 *  四分之三正面、头大且压在身体前上方；躯干一大块灰，臀 + 后腿是一整块骨白（上沿圆、后背直），前肩一块高高的圆角骨白；
 *  远侧两条腿暗一档；腿略带斜度；蹄是灰色半圆帽；骨白细尾 + 灰尾梢；嘴是灰米色宽圆角块、压出头的下沿；叶形耳向两侧伸；
 *  新月角从头后面伸出来，荧光只给角。每个体型的形状都是从意向图上逐块量出来的（坐标系 = 意向图上该角色的裁切框），
 *  k 把各体型换回原图的相对大小。
 *  第三轮与原图逐张对比后的修正：牛犊不露尾巴；小牛肚皮下沿是低弧、臀块上沿更圆；专注 = 原图的圆点眼（不加眉）；
 *  开心时头歪一点；破纪录时尾巴翘起、远侧前腿屈膝抬起、彩屑全是灰米色；减量周是实心下垂半月眼（不加眉）；
 *  壮牛 / 公牛臀块右上角是圆角。
 *  状态（每个成长阶段都有）：每个体型自带眼位与基础眼型（牛犊 / 小牛圆眼、壮牛 / 公牛斜切怒眼），状态只换眼、头的姿态与点缀。
 *  恢复日（用户 2026-10-05：要和对应阶段的牛有关系）：不是另画一只，而是把该阶段的身体整体下沉、站立的腿埋到地面以下
 *  （clipPath），换成折起来的腿，头低下来闭眼——所以牛犊趴着还是牛犊，公牛趴着还是公牛。
 *  颜色只用原色 Token（灰与米色的中间色用 color-mix 调出来，见 Mascot.module.css）。 */
import { useId, type ReactNode } from 'react';
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
  w: number; h: number; k: number;
  /** 尾巴 [路径, 粗细]；null = 不露尾巴（牛犊） */
  tail: [string, number] | null;
  shapes: Shape[]; eyes: Eye[]; angry: boolean;
  /** 头的中心与半径（彩屑、z 的位置） */
  head: [number, number, number];
  /** 颈部支点（转头、低头） */
  neck: [number, number];
  /** 地面 y、趴下时身体下沉多少、折起来的腿（趴下后的坐标） */
  ground: number; drop: number; fold: Shape[];
  /** 趴下时头下沉多少（让嘴贴地，意向图 Sleeping） */
  headDrop: number;
  extra?: ReactNode;
}

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
const f1 = (n: number) => n.toFixed(1);
const ell = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
  const a = (rot * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  const p = (t: number) => { const x = rx * Math.cos(t), y = ry * Math.sin(t); return `${f1(cx + x * c - y * sn)},${f1(cy + x * sn + y * c)}`; };
  return `M${p(0)}A${rx},${ry} ${rot} 1 1 ${p(Math.PI)}A${rx},${ry} ${rot} 1 1 ${p(0)}Z`;
};
/** 蹄：腿底一顶灰色半圆帽（上沿略斜，像鞋） */
const hoof = (x: number, y: number, w: number, h = 26) => `M${x},${y + 3}L${x + w},${y - 2}C${x + w + 3},${y + h * 0.6} ${x + w - 6},${y + h} ${x + w - 14},${y + h}H${x + 12}C${x + 4},${y + h} ${x - 4},${y + h * 0.6} ${x},${y + 3}Z`;
const star = (cx: number, cy: number, r: number) => { const q = r * 0.3; return `M${f1(cx)},${f1(cy - r)}L${f1(cx + q)},${f1(cy - q)}L${f1(cx + r)},${f1(cy)}L${f1(cx + q)},${f1(cy + q)}L${f1(cx)},${f1(cy + r)}L${f1(cx - q)},${f1(cy + q)}L${f1(cx - r)},${f1(cy)}L${f1(cx - q)},${f1(cy - q)}Z`; };
const tri = (cx: number, cy: number, r: number, rot: number) => {
  const pts = [0, 120, 240].map((d) => { const a = ((d + rot) * Math.PI) / 180; return `${f1(cx + r * Math.sin(a))},${f1(cy - r * Math.cos(a))}`; });
  return `M${pts.join('L')}Z`;
};

/** 眼睛：按状态画；基础眼型 angry = 斜切怒眼（壮牛、公牛），否则圆点 */
function Eyes({ eyes, angry, mood }: { eyes: Eye[]; angry: boolean; mood: MascotMood }) {
  return (
    <g>
      {eyes.map(([x, y, r, d], i) => {
        const sw = r * 0.62;
        if (mood === 'sleep') return <path key={i} className={s.line} strokeWidth={r * 0.75} d={`M${f1(x - r * 1.3)},${f1(y)}Q${f1(x)},${f1(y + r * 1.5)} ${f1(x + r * 1.3)},${f1(y)}`} />;
        if (mood === 'happy') return <path key={i} className={s.line} strokeWidth={sw} d={`M${f1(x - r * 1.2)},${f1(y + r * 0.5)}Q${f1(x)},${f1(y - r * 1.4)} ${f1(x + r * 1.2)},${f1(y + r * 0.5)}`} />;
        if (mood === 'pr') return <path key={i} className={s.ink} d={star(x, y, r * 1.8)} />;
        // 减量周（意向图 Tired）：实心下垂半月眼——上沿是一条外低内高的直线，下面是半圆
        if (mood === 'tired') {
          const ix = x - d * r * 1.3, ox = x + d * r * 1.3, iy = y - r * 0.35, oy = y + r * 0.25;
          return <path key={i} className={s.ink} d={`M${f1(ix)},${f1(iy)}L${f1(ox)},${f1(oy)}Q${f1(x + d * r * 0.4)},${f1(y + r * 1.5)} ${f1(x - d * r * 0.6)},${f1(y + r * 0.95)}Q${f1(ix - d * r * 0.1)},${f1(y + r * 0.55)} ${f1(ix)},${f1(iy)}Z`} />;
        }
        // 怒眼：上沿从外侧高处斜切到内侧低处（意向图公牛），下半是圆
        if (angry) return <path key={i} className={s.ink} d={`M${f1(x + d * r * 1.25)},${f1(y - r * 1.05)}L${f1(x - d * r * 1.3)},${f1(y + r * 0.35)}Q${f1(x - d * r * 0.85)},${f1(y + r * 1.3)} ${f1(x + d * r * 0.05)},${f1(y + r * 1.2)}Q${f1(x + d * r * 1.25)},${f1(y + r * 0.9)} ${f1(x + d * r * 1.25)},${f1(y - r * 1.05)}Z`} />;
        return <circle key={i} className={s.ink} cx={x} cy={y} r={r} />;
      })}
    </g>
  );
}

/** 破纪录的彩屑：围着头散开，灰米色三角和圆点（意向图 Celebrating） */
function Confetti({ head: [cx, cy, r] }: { head: [number, number, number] }) {
  const tris: Array<[number, number, number, number]> = [[-1.75, -1.35, 0.17, 15], [0.1, -1.95, 0.15, 200], [-1.95, 0.25, 0.17, 40], [1.45, 0.95, 0.16, 100]];
  const dots: Array<[number, number, number]> = [[-1.35, -0.55, 0.14], [-0.7, -1.7, 0.11], [1.75, -0.1, 0.14]];
  return (
    <g>
      {tris.map(([x, y, q, a], i) => <path key={i} className={s.ear} d={tri(cx + x * r, cy + y * r, q * r, a)} />)}
      {dots.map(([x, y, q], i) => <circle key={i} className={s.ear} cx={f1(cx + x * r)} cy={f1(cy + y * r)} r={f1(q * r)} />)}
    </g>
  );
}

/* ---------------- 小牛（意向图 Focused / Happy / Tired / Celebrating，坐标系 423 × 400） ---------------- */
const CALF_HORNS: Shape[] = [
  ['horn', 'M207,20C190,42 194,78 228,92L250,80C224,70 212,52 207,20Z'],
  ['horn', 'M378,20C395,42 391,78 357,92L335,80C361,70 373,52 378,20Z'],
];
const CALF_HEAD: Shape[] = [
  ['ear', 'M164,114C188,96 212,90 236,94L236,132C210,134 184,128 164,114Z'],
  ['ear', 'M412,114C388,96 364,90 340,94L340,132C366,134 392,128 412,114Z'],
  ['bone', 'M216,116C216,74 248,46 290,46C332,46 362,74 362,116C362,168 336,200 290,206C244,200 216,168 216,116Z'],
  ['ear', rr(244, 160, 100, 62, 31)],
  ['nose', ell(277, 193, 10, 6, 25)],
  ['nose', ell(317, 193, 10, 6, -25)],
];
const calf = (pr: boolean): Fig => ({
  w: 423, h: 400, k: 1.1,
  // 破纪录时尾巴翘起来，尾梢朝上（意向图 Celebrating）
  tail: pr ? ['M64,206C30,204 22,176 34,146', 10] : ['M64,206C32,204 22,232 26,262', 10],
  eyes: [[258, 128, 12, -1], [330, 128, 12, 1]], angry: false, head: [290, 128, 80], neck: [250, 200],
  ground: 392, drop: 78, headDrop: 150,
  fold: [['far', rr(150, 366, 110, 26, 13)], ['bone', rr(36, 364, 128, 28, 14)], ['bone', rr(206, 364, 170, 28, 14)]],
  shapes: [
    ...CALF_HORNS,
    ['far', 'M110,288L150,288L172,368L132,368Z'], ['hoof', hoof(129, 366, 45)],
    // 破纪录：远侧前腿屈膝抬起——大腿向前下，小腿折回向后下，蹄尖朝下
    ...(pr ? [['far', 'M266,236L306,240L322,300L298,340L276,330L290,298Z'], ['hoof', 'M276,330L298,340C298,358 290,368 280,366L266,356C260,348 266,334 276,330Z']] as Shape[]
      : [['far', 'M268,232L310,232L332,368L292,368Z'], ['hoof', hoof(290, 366, 44)]] as Shape[]),
    // 躯干：背从臀上沿缓升到颈，肚皮下沿是一条低弧
    ['grey', 'M96,198C128,178 182,164 248,150L320,206L318,262C306,296 250,322 196,322C160,322 128,312 112,300C100,280 96,240 96,198Z'],
    // 臀 + 近侧后腿：左上大圆角、上沿向右缓升、右缘内凹接后腿
    ['bone', 'M50,226C50,200 62,186 88,184L134,180C148,180 154,190 152,206L148,282C146,298 132,304 116,304L98,306L86,368L40,368L50,300Z'], ['hoof', hoof(38, 366, 49)],
    // 前肩 + 近侧前腿：左上大圆角，腿略向前斜
    ['bone', 'M184,262C184,232 198,218 224,218L240,218C254,218 258,230 256,246L274,368L228,368Z'], ['hoof', hoof(226, 366, 49)],
    ...CALF_HEAD,
  ],
});

/* ---------------- 牛犊（意向图 Newborn Calf，坐标系 620 × 400；侧脸，一只眼，不露尾巴） ---------------- */
const newborn: Fig = {
  w: 620, h: 400, k: 0.62, tail: null,
  eyes: [[420, 153, 17, -1]], angry: false, head: [440, 150, 110], neck: [380, 245],
  ground: 378, drop: 56, headDrop: 100,
  fold: [['far', rr(150, 350, 130, 28, 14)], ['bone', rr(40, 348, 160, 30, 15)], ['bone', rr(300, 348, 200, 30, 15)]],
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
  eyes: [[385, 157, 12, -1]], angry: true, head: [405, 165, 85], neck: [350, 235],
  ground: 394, drop: 80, headDrop: 128,
  fold: [['far', rr(150, 366, 120, 28, 14)], ['bone', rr(48, 364, 150, 30, 15)], ['bone', rr(250, 364, 200, 30, 15)]],
  shapes: [
    ['horn', 'M300,18C268,40 270,98 330,124L362,108C320,92 300,62 300,18Z'],
    ['horn', 'M488,15C522,36 528,92 470,124L440,110C482,94 494,60 488,15Z'],
    ['far', 'M128,282L166,278L176,370L136,372Z'], ['hoof', hoof(134, 368, 44)],
    ['far', 'M346,262L386,254L402,370L362,372Z'], ['hoof', hoof(360, 368, 46)],
    ['grey', 'M148,170C200,140 240,110 300,90C350,74 410,80 432,112C440,130 442,160 440,180C430,250 400,300 350,316C300,322 220,306 165,288L140,250Z'],
    ['bone', 'M55,204C55,172 70,156 96,153L148,150C160,150 166,160 166,172L160,285L140,300L100,330L100,370L60,370Z'], ['hoof', hoof(58, 368, 44)],
    ['bone', 'M236,190C236,178 242,172 254,172L290,172C320,172 330,200 328,230L325,310L345,366L300,370L272,300L246,240Z'], ['hoof', hoof(298, 366, 48)],
    ['ear', 'M288,148C308,128 330,123 352,127L354,162C330,164 304,160 288,148Z'],
    ['ear', 'M505,145C490,130 475,126 462,128L462,158C478,160 494,156 505,145Z'],
    ['bone', 'M340,108L462,92C470,92 472,100 470,110L465,195C460,225 440,240 410,240C375,238 348,210 343,175Z'],
    ['ear', rr(382, 192, 84, 54, 25)],
    ['nose', ell(411, 219, 8, 5, 25)], ['nose', ell(445, 219, 8, 5, -25)],
  ],
};

/* ---------------- 公牛（意向图 Full-grown Bull，坐标系 543 × 400；两只怒眼） ---------------- */
const bull = (legend: boolean): Fig => ({
  w: 543, h: 400, k: 1.34, tail: ['M70,170C35,168 18,200 20,240', 12],
  eyes: [[383, 154, 13, -1], [449, 154, 13, 1]], angry: true, head: [410, 165, 90], neck: [355, 240],
  ground: 404, drop: 82, headDrop: 132,
  fold: [['far', rr(150, 376, 130, 28, 14)], ['bone', rr(34, 374, 160, 30, 15)], ['bone', rr(262, 374, 210, 30, 15)]],
  shapes: [
    ['horn', 'M300,10C270,30 272,100 335,125L370,112C322,92 300,55 300,10Z'],
    ['horn', 'M490,10C528,30 534,95 470,120L440,108C484,92 498,55 490,10Z'],
    ['far', 'M125,290L160,285L190,380L150,382Z'], ['hoof', hoof(148, 378, 46)],
    ['far', 'M386,298L430,290L438,380L396,382Z'], ['hoof', hoof(394, 378, 48)],
    ['grey', 'M140,160C190,120 240,80 300,62C350,46 420,56 452,96C462,110 462,122 460,130L455,230C440,290 390,318 330,322C270,320 210,304 160,292L130,250Z'],
    ['bone', 'M40,206C40,172 55,150 85,148L152,142C164,142 168,152 168,165L162,290L135,310L85,330L85,380L42,380Z'], ['hoof', hoof(40, 378, 47)],
    ['bone', 'M256,180C256,174 262,172 270,172L300,172C325,172 338,195 336,230L330,320L350,380L305,382L285,320L258,250Z'], ['hoof', hoof(303, 378, 49)],
    ['ear', 'M298,142C324,122 350,119 370,124L372,160C346,164 316,158 298,142Z'],
    ['ear', 'M510,145C495,128 478,124 462,126L462,160C480,162 498,158 510,145Z'],
    ['bone', 'M348,98L462,88C470,88 474,95 472,105L462,200C455,232 435,248 408,248C375,245 352,215 350,180Z'],
    ['ear', rr(380, 196, 86, 55, 26)],
    ['nose', ell(411, 223, 8, 5, 25)], ['nose', ell(446, 223, 8, 5, -25)],
  ],
  extra: legend ? <path className={s.horn} d={ell(18, 262, 13, 24, 15)} /> : undefined,
});

function figure(stage: MascotStage, mood: MascotMood): Fig {
  if (stage === 0) return newborn;
  if (stage === 2) return sturdy;
  if (stage >= 3) return bull(stage === 4);
  return calf(mood === 'pr');
}

/** 尾梢：在尾巴末端挂一撮灰（水滴形，沿尾巴走向） */
function tuft(tail: string, w: number) {
  const m = tail.match(/(-?[\d.]+),(-?[\d.]+) (-?[\d.]+),(-?[\d.]+)$/)!; // 最后一个控制点与终点
  const [cx, cy, x, y] = m.slice(1).map(Number), ang = Math.atan2(y - cy, x - cx);
  const L = w * 1.9;
  return ell(x + Math.cos(ang) * L * 0.8, y + Math.sin(ang) * L * 0.8, w * 1.15, L, (ang * 180) / Math.PI - 90);
}

/** 整只小牛。渲染宽度 = --fig-w（各体型在原图里的相对宽度）× --mascot-unit（默认 0.1em）；也可以直接用 className 设宽。
 *  animate：按 pet-forge 的 SVG 分层约定动起来——身体 / 头 / 眼 / 尾四层各有显式支点（尾根、颈、落地线中点），
 *  各自循环、周期故意错开（呼吸、甩尾、眨眼不同步才像活物）；循环关键帧首尾相同，见 Mascot.module.css。 */
export function Mascot({ stage = 1, mood = 'idle', animate, className, title }: { stage?: MascotStage; mood?: MascotMood; animate?: boolean; className?: string; title?: string }) {
  const f = figure(stage, mood);
  const clip = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const sleeping = mood === 'sleep';
  // 分层：角 + 第一只耳朵之后的部件（耳、头、口鼻、鼻孔）= 头；其余 = 身体
  const firstEar = f.shapes.findIndex(([c]) => c === 'ear');
  const head = f.shapes.filter(([c], i) => c === 'horn' || i >= firstEar);
  const standing = f.shapes.filter(([c], i) => c !== 'horn' && i < firstEar);
  // 趴下：远侧腿、蹄、近侧前腿（身体里最后一块骨白）都收起来，换成 fold；臀块里的后腿被地面裁掉
  const frontLeg = standing.map(([c]) => c).lastIndexOf('bone');
  const body = sleeping ? standing.filter(([c], i) => c !== 'far' && c !== 'hoof' && i !== frontLeg) : standing;
  const at = (x: number | string, y: number | string) => ({ transformOrigin: `${x}px ${y}px` });
  const [hx, hy, hr] = f.head;
  const dy = sleeping ? f.drop : 0;
  // 趴下：头比身体少沉一点并低头；开心时头歪一点（意向图 Happy）
  const headPose = sleeping ? `translate(${f1(hr * 0.08)} ${f.headDrop}) rotate(4 ${f.neck[0]} ${f.neck[1]})`
    : mood === 'happy' ? `rotate(-7 ${f.neck[0]} ${f.neck[1]})` : undefined;
  const tailRoot = f.tail && f.tail[0].match(/^M(-?[\d.]+),(-?[\d.]+)/)!;
  return (
    <svg className={`${className ?? s.mascot} ${animate ? `${s.alive} ${s[`m_${mood}`]}` : ''}`} viewBox={`0 0 ${f.w} ${f.h}`} style={{ ['--fig-w' as string]: f.w * f.k }}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {sleeping && <defs><clipPath id={clip}><rect x="-50" y="-200" width={f.w + 100} height={f.ground + 200 - 2} /></clipPath></defs>}
      <g className={s.whole} style={at(f.w / 2, f.ground)}>
        <g clipPath={sleeping ? `url(#${clip})` : undefined}>
          <g transform={dy ? `translate(0 ${dy})` : undefined}>
            {f.tail && tailRoot && (
              <g className={s.tailG} style={at(tailRoot[1], tailRoot[2])}>
                <path className={s.tail} strokeWidth={f.tail[1]} d={f.tail[0]} />
                <path className={stage === 4 ? s.horn : s.hoof} d={tuft(f.tail[0], f.tail[1])} />
              </g>
            )}
            <g className={s.bodyG} style={at(f.w / 2, f.ground)}>{body.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}</g>
          </g>
        </g>
        {/* 趴下：站着的腿埋进地面以下，换成折起来的腿 */}
        {sleeping && f.fold.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}
        <g transform={headPose}>
          <g className={s.headG} style={at(f.neck[0], f.neck[1])}>
            {head.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}
            <g className={s.eyesG}><Eyes eyes={f.eyes} angry={f.angry} mood={mood} /></g>
          </g>
        </g>
        {sleeping && <g className={s.zz}>
          <text x={f1(hx + hr * 0.95)} y={f1(hy + f.headDrop - hr * 0.75)} fontSize={f1(hr * 0.45)}>z</text>
          <text x={f1(hx + hr * 1.3)} y={f1(hy + f.headDrop - hr * 1.15)} fontSize={f1(hr * 0.32)}>z</text>
        </g>}
        {mood === 'pr' && <g className={s.confetti} style={at(hx, hy)}><Confetti head={f.head} /></g>}
      </g>
    </svg>
  );
}

/** 只有头（16–48px 的头像、通知、Toast）：小牛的正脸，角按阶段长；壮牛 / 公牛段换成怒眼 */
export function MascotHead({ stage = 1, mood = 'idle', className, title }: { stage?: MascotStage; mood?: MascotMood; className?: string; title?: string }) {
  const k = [0, 0.75, 1, 1.25, 1.35][stage];
  return (
    <svg className={className ?? s.head} viewBox="160 0 260 225" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {stage === 0 ? <g><path className={s.horn} d={ell(232, 70, 9, 15, -30)} /><path className={s.horn} d={ell(348, 70, 9, 15, 30)} /></g>
        : <g transform={`translate(290 92) scale(${k}) translate(-290 -92)`}>{CALF_HORNS.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}</g>}
      {CALF_HEAD.map(([c, d], i) => <path key={i} className={s[c]} d={d} />)}
      <Eyes eyes={[[258, 128, 12, -1], [330, 128, 12, 1]]} angry={stage >= 2} mood={mood} />
    </svg>
  );
}
