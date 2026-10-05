/** IP 小牛（2026-10-05 起用 PNG）：用户用 Nano Banana 按意向图 3_27AM 高清重制的状态板（docs/sources/mascot/A.jpg、B1–B5.jpg），
 *  由 scripts/mascot_png.py 切图、Real-ESRGAN 4 倍超分、抠图（边缘反解 α，去黑边；只留牛本身，Milo 的泛光也扣掉），按牛龄统一比例和地面线，
 *  导出到 public/mascot/<牛龄>-<状态>.webp（PNG 母版在 design/brand/mascot/），尺寸与头像框在 mascotAssets.ts。
 *  - 5 种牛龄：牛犊 → 小牛 → 壮牛 → 公牛 → Milo（最高等级：全身荧光、双眼发光）。
 *    前四种单眼（头三分之四侧转），Milo 双眼正脸。
 *  - 6 种状态：平常 / 专注 / 开心 / 恢复日 / 破纪录 / 减量周。图里只有牛本身；特效由代码生成（用户 2026-10-05）：
 *    专注 = 身后速度线，恢复日 = 头顶飘 z，破纪录 = 头边一圈碎屑，Milo = 泛光 + 四角星 + 扫光。位置按 mascotAssets 里的头像框和牛身外框算。
 *  - 荧光微光（用户 2026-10-05）：非 Milo 的荧光只在角上，脚本另出一张只有角的 -lime.webp，模糊后垫在图下面当微光；Milo 是全身泛光。
 *  - animate：整只按状态做呼吸、前压、小跳、深呼吸、欢呼、叹气（以地面线为支点）；系统开启「减少动态效果」时静止。
 *    只有牛身（.body）在动；速度线、z、碎屑、四角星挂在不动的那一层（.fig），自己的动画不跟牛的动画叠在一起
 *    （用户 2026-10-05：粒子绑在牛身上，跳的时候碎屑跟着一起跳，不自然）。扫光贴在牛身表面，跟牛走。 */
import type { CSSProperties } from 'react';
import { MASCOT_ASSETS, type MascotMood, type MascotStage } from './mascotAssets';
import s from './Mascot.module.css';

export type { MascotMood, MascotStage };
export const MASCOT_STAGES: MascotStage[] = ['newborn', 'young', 'sturdy', 'bull', 'milo'];
export const MASCOT_MOODS: MascotMood[] = ['idle', 'focused', 'happy', 'rest', 'pr', 'deload'];
export const STAGE_NAME: Record<MascotStage, string> = { newborn: '牛犊', young: '小牛', sturdy: '壮牛', bull: '公牛', milo: 'Milo' };
export const MOOD_NAME: Record<MascotMood, string> = { idle: '平常', focused: '专注', happy: '开心', rest: '恢复日', pr: '破纪录', deload: '减量周' };

const src = (stage: MascotStage, mood: MascotMood, layer = '') => `${import.meta.env.BASE_URL}mascot/${stage}-${mood}${layer}.webp`;

/** 碎屑：[角度°, 离头中心的距离（头宽的倍数）, 大小（头宽的倍数）, 形状 t = 三角 / d = 圆点, 是否荧光] */
const CONFETTI: Array<[number, number, number, 't' | 'd', boolean]> = [
  [-175, 0.62, 0.1, 't', false], [-150, 0.7, 0.07, 'd', false], [-125, 0.66, 0.09, 't', true], [-100, 0.72, 0.07, 'd', false],
  [-75, 0.68, 0.1, 't', false], [-50, 0.72, 0.07, 'd', true], [-25, 0.66, 0.09, 't', false], [0, 0.7, 0.07, 'd', false],
];
/** Milo 的四角星：[x, y]（牛身外框的比例）, 大小（牛身宽的比例） */
const SPARKS: Array<[number, number, number]> = [[0.12, 0.08, 0.05], [0.95, -0.02, 0.04], [0.38, -0.06, 0.03], [-0.04, 0.4, 0.035], [1.02, 0.42, 0.03]];

/** 整只小牛。宽度 = 画布宽 × --mascot-unit（默认 0.04em；同一个 unit 下 5 种牛龄保持相对大小），也可以直接用 className 设宽。
 *  容器可以设 --mascot-max-h：画布高超过它时整只等比缩小（Milo 最高，加上四角星和泛光，固定高度的舞台要靠它才不出格） */
export function Mascot({ stage = 'newborn', mood = 'idle', animate, className, title }: { stage?: MascotStage; mood?: MascotMood; animate?: boolean; className?: string; title?: string }) {
  const a = MASCOT_ASSETS[stage];
  const url = src(stage, mood);
  const { head: [hx, hy, hs], body: [bx0, by0, bx1, by1] } = a.moods[mood];
  const X = (v: number) => `${((v / a.w) * 100).toFixed(2)}%`, Y = (v: number) => `${((v / a.h) * 100).toFixed(2)}%`;
  const style = { '--fig-w': a.w, '--fig-h': a.h, '--fig-ratio': `${a.w} / ${a.h}`, '--ground': `${((a.ground / a.h) * 100).toFixed(2)}%`, '--src': `url("${url}")` } as CSSProperties;
  const milo = stage === 'milo';
  const bw = bx1 - bx0, bh = by1 - by0, hcx = hx + hs / 2, hcy = hy + hs / 2;
  return (
    <span className={`${s.root} ${className ?? s.mascot} ${milo ? s.milo : ''} ${animate ? `${s.alive} ${s[`m_${mood}`]}` : ''}`} style={style}
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <span className={s.fig}>
        <span className={s.body}>
          {!milo && <img className={s.lime} src={src(stage, mood, '-lime')} alt="" draggable={false} />}
          <img className={s.img} src={url} alt="" width={a.w} height={a.h} draggable={false} />
          {milo && <span className={s.sheen} />}
        </span>
        {/* 代码生成的特效：只在图之上叠，位置都是画布的百分比 */}
        {mood === 'focused' && [0.12, 0.26, 0.4].map((f, i) => (
          <span key={i} className={s.speed} style={{ left: X(bx0 + bw * (0.02 + i * 0.03)), top: Y(by0 + bh * f), width: X(bw * (0.12 - i * 0.02)), height: Y(bh * 0.035), '--k': i } as CSSProperties} />
        ))}
        {mood === 'rest' && [[0.5, -0.32, 0.22], [0.72, -0.56, 0.16]].map(([fx, fy, fz], i) => (
          <svg key={i} className={s.z} viewBox="0 0 10 10" style={{ left: X(hx + hs * fx), top: Y(hy + hs * fy), width: X(hs * fz), '--k': i } as CSSProperties}><text x="1" y="9" fontSize="11">z</text></svg>
        ))}
        {mood === 'pr' && CONFETTI.map(([deg, r, z, shape, lime], i) => {
          const rad = (deg * Math.PI) / 180, size = hs * z;
          return <span key={i} className={`${s.confetti} ${shape === 't' ? s.tri : s.dot} ${lime ? s.lit : ''}`}
            style={{ left: X(hcx + Math.cos(rad) * hs * r - size / 2), top: Y(hcy + Math.sin(rad) * hs * r - size / 2), width: X(size), '--k': i, '--rot': `${deg * 2}deg` } as CSSProperties} />;
        })}
        {milo && SPARKS.map(([fx, fy, fz], i) => (
          <span key={i} className={s.spark} style={{ left: X(bx0 + bw * fx), top: Y(by0 + bh * fy), width: X(bw * fz), '--k': i } as CSSProperties} />
        ))}
      </span>
    </span>
  );
}

/** 只有头（16–48px 的头像、通知、Toast、牛龄徽章）：同一张图按头像框（逐张标定的头 + 角）裁成圆形 */
export function MascotHead({ stage = 'bull', mood = 'idle', className, title }: { stage?: MascotStage; mood?: MascotMood; className?: string; title?: string }) {
  const a = MASCOT_ASSETS[stage];
  const [x, y, side] = a.moods[mood].head;
  const pct = (v: number) => `${((v / side) * 100).toFixed(2)}%`;
  const box = { width: pct(a.w), left: pct(-x), top: pct(-y) };
  const milo = stage === 'milo';
  return (
    <span className={`${className ?? s.head} ${milo ? s.headMilo : ''}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <span className={s.headClip}>
        {!milo && <img className={`${s.headImg} ${s.headLime}`} src={src(stage, mood, '-lime')} alt="" draggable={false} style={box} />}
        <img className={s.headImg} src={src(stage, mood)} alt="" draggable={false} style={box} />
      </span>
    </span>
  );
}
