/** 人体（MuscleWiki 真实路径，public/bodymap，V1 原样）。分层同 V1：中性部位 → 肌肉组 → 轮廓层；腹股沟不着色。
 *  版式规则（DESIGN §4，同 V1 BodyProgressMap）：人体放在内容区里（左缘 = 页面边距），不越过组件最外层；
 *  半身：按包围盒从左裁掉 ratio/figure-crop（露出约 58%），左缘再加 ratio/figure-fade 宽的渐隐，裁切读起来是有意的暗角，不是一刀切。
 *  热成像上面再叠一层「光」（ThermalLight，混合模式 screen）：浅荧光轮廓从下往上描出、一道细光沿轮廓游走、扫描光带周期性从下往上扫过人体——
 *  动的东西都在这一层，下面带滤镜的热像层静止不重画。
 *  量完锚点后通过 onAnchors 交给胶囊列画引线（坐标相对 relativeTo）。
 *  2026-10-10 全局浅色：人体跟随自己所在的主题（不再是深色观察窗），浅色时按 LightLook 方案换色带、把提亮的层改成压暗（见 LIGHT_LOOKS）。 */
import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { HeadStat } from '../engine';
import { useElementTheme } from '../styles/theme';
import { T } from '../styles/tokens.gen';
import { BodyRender, heatOf, primRgb, rampTables, tables, tintMatrix } from './thermal';
import s from './BodyFigure.module.css';

type Path = { d: string; strokeWidth?: number };
type Part = { paths?: Path[]; lines?: { x1: number; y1: number; x2: number; y2: number; strokeWidth?: number }[] };
type BodyMap = { viewBox?: string; front: Record<string, Part>; back: Record<string, Part> };
const NEUTRAL = ['neck', 'feet', 'hands', 'groin'];
const cache = new Map<string, Promise<BodyMap>>();
const load = (g: string) => {
  if (!cache.has(g)) cache.set(g, fetch(`${import.meta.env.BASE_URL}bodymap/bodymap-${g}.json`).then((r) => r.json()));
  return cache.get(g)!;
};
export type Anchors = Record<string, [number, number]>;
/** fit 时裁切量的范围：至少裁掉 25%（仍是半身），最多 70%（窄屏也露得出肩和手臂） */
const FIT_MIN = 0.25, FIT_MAX = 0.7;

/** 热力图扫描线的「逐层扫描」动效方案（2026-10-06 用户要几个方案看；当时在 /lab 里并排比较，选定后定为默认；现在的待选在 /preview 方案台）：
 *  band   扫描光带（第 7 轮的默认，2026-10-07 换下）：一条扫描光带周期性从脚扫到头；
 *  raster 逐行显影：扫描线先是一排暗栅，从脚到头一行行打开、露出底下的热力，停一会儿再从下往上一行行合上；
 *  slice  切片扫描：一条亮线一行一行往上跳（不是平滑滑动），走过的行留一段渐暗的余辉，像 CT 一层层切过去；
 *  wave   呼吸波：所有扫描线常亮很淡，一道亮度波逐行往上传，连续不断；
 *  iso    等温分层：按每块肌肉的热度分层——最热的肌肉里的扫描线先亮，接着次热的，一层层亮到最凉的，再一起暗下去。
 *  第二批（2026-10-07 用户：S 层再来四种呼应主题的，不局限扫描线）——见 ThemeFx：
 *  pump   泵感：练过的肌肉像练完充血一样「咚-咚」双拍胀亮，越热越亮，节拍是慢牛的静息心率；
 *  steam  蒸腾：练过的肌肉往上冒热气（细小光点上升、散开、消失），越热冒得越多越快；
 *  fiber  牛劲：沿肌肉的轮廓线跑一段段流光（像力量顺着肌纤维传过去），越热越亮越快；
 *  beam   奥赛台顶光：呼应记录页钢板的丁达尔光束——斜光慢慢摆过人体、光里有浮尘；跟着光摆的点光源在肌肉上打高光和阴影，强化形体；
 *  molten 熔流（2026-10-07 用户：金属渐变留在 F，流动效果放 S）：只有「流」这一层——一道道亮带一直往上流，
 *         穿过固定的 Turbulent Displace 扭曲场被搅弯，裁在练过的肌肉里、screen 叠在 F 层上；越热越亮、流得越快。配 F1 就是流动的熔融金属。 */
export type ScanFxKind = 'band' | 'raster' | 'slice' | 'wave' | 'iso' | 'pump' | 'steam' | 'fiber' | 'beam' | 'molten';
export const ScanFx = createContext<ScanFxKind | null>(null);

/** 描边方案（2026-10-06 用户：现在的描边太抢眼，要四个方案）：
 *  glow 描出游光（第 7 轮的默认，2026-10-07 换下）：浅荧光实线，挂载时从下往上描出 + 细光沿轮廓游走；
 *  hair 发丝：极细、很淡的静态浅荧光线，没有描出和游光；
 *  soft 柔光：不画清晰的线，只有轮廓位置一圈很淡的模糊光；
 *  dot  点线：细点虚线，淡；
 *  rim  只描外缘：人体内部的肌肉分界线不画，只在剪影最外圈有一道淡淡的内缘光。 */
export type ContourFxKind = 'glow' | 'hair' | 'soft' | 'dot' | 'rim';
export const ContourFx = createContext<ContourFxKind | null>(null);

/** 肌头内部容量的显示方案（2026-10-06 用户要四个，其中一个是 Metallic Gradient）：
 *  thermal  热成像（第 7 轮的默认，2026-10-07 换下）：逐肌径向渐变 + 扩散 + 渐变映射 + 扫描线与颗粒；
 *  metal    Metallic Gradient（按用户给的 AE 参考视频）：Gradient Ramp → Turbulent Displace + 模糊 → Colorama（暗 → 橄榄 → 荧光 → 骨白热）
 *           → 下缘白热亮边 + 细内缘高光 + 外发光 + 颗粒；静态。流动那一层在 S 层（ScanFxKind molten），两层叠起来就是流动的熔融金属；
 *  topo     等高线：热度量化成几档，只画档与档之间的细线（像地形图），档内很淡；
 *  halftone 半调点阵：同样大小的网格点，热度越高点越大（印刷网点）；
 *  liquid   液位：每块肌肉像一个容器，近 7 天组数 ÷ 最大可恢复量 = 液面高度，液面一道亮线。 */
export type FillFxKind = 'thermal' | 'metal' | 'topo' | 'halftone' | 'liquid';
export const FillFx = createContext<FillFxKind | null>(null);
/** 容量人体的默认三层（2026-10-07 用户在 /preview 方案台选定：O2 柔光 + F1 金属渐变 + S9 熔流）。
 *  三个 context 不给值（null）就用这里；原来的默认留成可选项：描边 glow（浅荧光描出 + 游光）、填充 thermal（热成像）、S 层 band（扫描光带）。 */
export const DEFAULT_LOOK = { contour: 'soft', fill: 'metal', scan: 'molten' } as const satisfies { contour: ContourFxKind; fill: FillFxKind; scan: ScanFxKind };

/** 浅色人体 L 组（2026-10-10 全局浅色，用户：在 F1 金属渐变 + S9 熔流的基础上做 4 个浅色方案，放进 /preview 方案台选）。
 *  只在人体所在的主题是浅色时生效（useElementTheme：最近的 [data-theme]，没有就是全局）；深色走原来的代码路径，逐像素不变。
 *  纸白上的「浅色金属 + 熔流」：Colorama 换成「冷 = 纸白、热 = 深色」的色带；唇边 / 内缘从提亮改成压暗（金属下沿的影子，冷肌肉也有形）；
 *  颗粒改墨色低透明；熔流从 screen 改 multiply（渐变反相：冷 = 白，白在 multiply 下不起作用），最深处是 moltenTint；柔光描边按 LIGHT_CONTOURS（multiply 压暗，或 frost 的白线）。
 *  只有默认三层（O2 柔光 + F1 金属 + S9 熔流）有浅色版，其余描边 / 填充 / S 层方案是深色存档。
 *  ramp / moltenTint 是原色名（构建期从 tokens.json 取值，同 thermal.ts）；
 *  胶囊量尺和图例在浅色里用 ramp 的前 5 段（同深色：金属色带前 5 段 = 图例的荧光色板）。 */
export type LightLookKind = 'L1' | 'L2' | 'L3' | 'L4' | 'L2a' | 'L2b' | 'L2c' | 'L2d';
/** 浅色柔光描边的做法（2026-10-10 用户：浅色下人体描边不想用深色，要方案）。每个方案是一整套：线色 + 透明度 + 模糊 + 线宽 + 混合模式（multiply = 压暗、normal = 白线），可选一道下沿的影子。
 *  前四个（ink / ink-soft / ink-heavy / deep）是 L1–L4 原来的墨线 / 深绿线，留着对照；用户要的非深色方案是 green / sage / frost / shade / none。 */
export type LightContourKind = 'ink' | 'ink-soft' | 'ink-heavy' | 'deep' | 'green' | 'sage' | 'frost' | 'shade' | 'none';
export interface LightContourSpec {
  /** 线色（CSS 颜色，只用 Token） */ color: string; alpha: number;
  /** 模糊半径（× 人体高的 1%） */ blur: number;
  /** 线宽（× hairline） */ width: number;
  blend: 'multiply' | 'normal';
  /** 线下沿的一道影子（白线要靠它托出来） */ shadow?: { color: string; alpha: number; dy: number };
}
const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, var(--milo-prim-${a}) ${pct}%, var(--milo-prim-${b}))`;
export const LIGHT_CONTOURS: Record<LightContourKind, LightContourSpec> = {
  ink: { color: 'var(--milo-color-brand-mark)', alpha: 0.45, blur: 0.1, width: 1.1, blend: 'multiply' },
  'ink-soft': { color: 'var(--milo-color-brand-mark)', alpha: 0.35, blur: 0.1, width: 1.1, blend: 'multiply' },
  'ink-heavy': { color: 'var(--milo-color-brand-mark)', alpha: 0.8, blur: 0.1, width: 1.1, blend: 'multiply' },
  deep: { color: 'var(--milo-color-accent-ink)', alpha: 0.45, blur: 0.1, width: 1.1, blend: 'multiply' },
  // 中绿线：深绿掺荧光，是荧光家族里的线，不是墨
  green: { color: 'var(--milo-prim-lime-600)', alpha: 0.9, blur: 0.1, width: 1.1, blend: 'multiply' },
  // 灰绿线：纸的暖灰掺一点深绿，淡、有点烟熏，比墨轻得多
  sage: { color: mix('paper-300', 55, 'ink-500'), alpha: 0.6, blur: 0.12, width: 1.1, blend: 'multiply' },
  // 磨砂白线：纸白的细线 + 下沿一道很淡的绿影，像磨砂玻璃 / 压纹
  frost: { color: 'var(--milo-prim-paper-50)', alpha: 0.95, blur: 0.08, width: 1.3, blend: 'normal', shadow: { color: 'var(--milo-prim-ink-900)', alpha: 0.22, dy: 0.5 } },
  // 柔影：没有清晰的线，只有一圈宽而淡的深绿影，形体靠阴影不靠线
  shade: { color: 'var(--milo-prim-ink-900)', alpha: 0.16, blur: 0.4, width: 2, blend: 'multiply' },
  // 无描边：只剩填充自己的唇边 / 内缘
  none: { color: 'transparent', alpha: 0, blur: 0, width: 1, blend: 'multiply' },
};
/** 方案台 / 自由组合里供挑的非深色描边（前面的墨线 / 深绿线是 L1–L4 原来的，留着对照） */
export const LIGHT_CONTOUR_PICKS: LightContourKind[] = ['ink', 'green', 'sage', 'frost', 'shade', 'none'];
export const LightContour = createContext<LightContourKind | null>(null);

/** 浅色里胶囊 / 引线 / 刻度的色调（2026-10-10 用户：整体深色太多，引导线、胶囊描边也是）：
 *  胶囊描边 line（浅色一律透明，改用 --depth-1 阴影）、焦点引线 leader（带一圈纸白光边，压在荧光肌肉上也读得出）、量尺刻度 tick、胶囊额外的影子 fx。深色不走这里，保持语义色原样。 */
export interface LightTone { line: string; leader: string; tick: string; fx?: string }
const TONES = {
  // 偏荧光：引线中绿、刻度深绿（胶囊都不描边，靠阴影 --depth-1 浮起来，2026-10-10 用户：尽量不用描边）
  lime: { line: 'transparent', leader: 'color-mix(in srgb, var(--milo-prim-ink-900) 85%, transparent)', tick: 'var(--milo-prim-ink-500)', fx: 'var(--depth-1)' },
  // 偏纸色：引线深一点的绿、刻度暖灰
  paper: { line: 'transparent', leader: 'color-mix(in srgb, var(--milo-prim-ink-900) 85%, transparent)', tick: 'var(--milo-prim-ink-500)', fx: 'var(--depth-1)' },
  // 偏绿影：引线、刻度同一个中绿
  quiet: { line: 'transparent', leader: 'color-mix(in srgb, var(--milo-prim-ink-900) 85%, transparent)', tick: 'var(--milo-prim-ink-500)',
    fx: 'var(--depth-1)' },
  // 磨砂（L2d，旧默认）：引线、刻度中绿
  frost: { line: 'transparent', leader: 'color-mix(in srgb, var(--milo-prim-ink-900) 85%, transparent)', tick: 'var(--milo-prim-ink-500)',
    fx: 'var(--depth-1)' },
} satisfies Record<string, LightTone>;

export interface LightLookSpec {
  /** Colorama 色带：冷 → 热，6 个原色 */ ramp: string[];
  /** 唇边（下缘月牙）/ 整圈内缘的 slope：< 1 是压暗 */ lip: number; edge: number;
  /** 墨色颗粒透明度 */ grain: number;
  /** 外发光透明度（乘在深色的 0.9 / 0.7 上） */ glow: number;
  /** 上沿纸白高光的透明度（金属受光面） */ sheen: number;
  /** 熔流：最深处的颜色（原色名）与强度（0–1） */ moltenTint: string; molten: number;
  /** 默认的柔光描边（方案台自由组合可以换，见 LightContour） */ contour: LightContourKind;
  /** 胶囊 / 引线 / 刻度的色调 */ tone: LightTone;
  /** 图例读法（读屏） */ legend: string;
}
const L2_RAMP = ['paper-100', 'lime-300', 'lime-500', 'lime-550', 'lime-600', 'lime-700'];
export const LIGHT_LOOKS: Record<LightLookKind, LightLookSpec> = {
  // 深绿热：中段就进深绿（和荧光热一眼分开），最热到荧光墨；深绿流纹、深绿描边
  L1: { ramp: ['paper-100', 'lime-600', 'lime-750', 'lime-ink', 'lime-ink', 'ink-900'], lip: 0.62, edge: 0.78, grain: 0.07, glow: 0.22, sheen: 0.8, moltenTint: 'lime-750', molten: 0.9, contour: 'deep', tone: TONES.paper, legend: '越深越热' },
  // 荧光热（2026-10-10 用户选定这套配色）：越饱和越热，最热仍是荧光；荧光撑不起形体，墨色描边给轮廓
  L2: { ramp: L2_RAMP, lip: 0.7, edge: 0.82, grain: 0.06, glow: 0.35, sheen: 0.7, moltenTint: 'lime-600', molten: 1, contour: 'ink', tone: TONES.paper, legend: '越绿越热' },
  // 银金属：冷段银灰、热段转绿；高光和下缘影子都最强，金属感最重
  L3: { ramp: ['paper-200', 'paper-300', 'ink-500', 'lime-550', 'lime-750', 'lime-ink'], lip: 0.42, edge: 0.62, grain: 0.08, glow: 0.25, sheen: 1, moltenTint: 'ink-600', molten: 0.85, contour: 'ink-soft', tone: TONES.paper, legend: '越绿越热' },
  // 墨印：版画——平涂、不反光（没有高光、下缘几乎不压暗），墨线更实、颗粒更重
  L4: { ramp: ['paper-50', 'ink-500', 'ink-600', 'lime-750', 'ink-900', 'ink-900'], lip: 0.85, edge: 0.6, grain: 0.18, glow: 0, sheen: 0, moltenTint: 'ink-900', molten: 0.75, contour: 'ink-heavy', tone: TONES.paper, legend: '越深越热' },
  // —— L2 的四个变体（2026-10-10 用户：配色定 L2，效果还不满意，再出四个；整体去深色：描边、胶囊边、引线都不用墨）——
  // 轻盈：冷肌肉更白、最热也不压深；暗边几乎不压；中绿细线 + 荧光细边的胶囊
  L2a: { ramp: ['paper-50', 'lime-300', 'lime-500', 'lime-500', 'lime-550', 'lime-600'], lip: 0.88, edge: 0.94, grain: 0.04, glow: 0.45, sheen: 0.9, moltenTint: 'lime-600', molten: 0.85, contour: 'green', tone: TONES.lime, legend: '越绿越热' },
  // 金属：同一条荧光色带，高光和下缘压暗拉到 L3 的强度，灰绿的线；金属感最重
  L2b: { ramp: L2_RAMP, lip: 0.5, edge: 0.7, grain: 0.08, glow: 0.25, sheen: 1, moltenTint: 'lime-700', molten: 1, contour: 'sage', tone: TONES.paper, legend: '越绿越热' },
  // 形体靠影：不画清晰的线，一圈宽而淡的深绿影托出肌肉分界；胶囊没有描边，只有一点影子
  L2c: { ramp: ['paper-50', 'lime-300', 'lime-500', 'lime-550', 'lime-600', 'lime-700'], lip: 0.72, edge: 0.86, grain: 0.06, glow: 0.3, sheen: 0.5, moltenTint: 'lime-600', molten: 1, contour: 'shade', tone: TONES.quiet, legend: '越绿越热' },
  // 磨砂：纸白细线 + 下沿绿影，像磨砂玻璃 / 压纹；胶囊是纸白细边
  L2d: { ramp: ['paper-50', 'lime-300', 'lime-500', 'lime-500', 'lime-500', 'lime-500'], lip: 0.8, edge: 0.9, grain: 0.05, glow: 0.4, sheen: 1, moltenTint: 'lime-500', molten: 0.5, contour: 'frost', tone: TONES.frost, legend: '越绿越热' },
};
export const LightLook = createContext<LightLookKind | null>(null);
/** 浅色人体的默认方案（2026-10-10 用户最后定为 L2a 轻盈 + 它自己的中绿细线描边；之前的 L2d 磨砂 + C3 磨砂白线和 L1–L4、L2b–c 留在方案台） */
export const DEFAULT_LIGHT_LOOK: LightLookKind = 'L2a';
/** 元素在浅色里：返回所选浅色方案（LightLook 上下文没给就是 DEFAULT_LIGHT_LOOK）；在深色里返回 null。胶囊量尺、图例也用它跟着换色带 */
export function useLightLook(ref: RefObject<Element | null>): LightLookSpec | null {
  const look = useContext(LightLook) ?? DEFAULT_LIGHT_LOOK;
  return useElementTheme(ref) === 'light' ? LIGHT_LOOKS[look] : null;
}
/** 胶囊 / 引线 / 刻度的色调变量（--cap-line / --cap-fx / --leader / --tick）；深色返回 undefined，样式落回语义色 */
export function lightToneVars(look: LightLookSpec | null): CSSProperties | undefined {
  if (!look) return undefined;
  const { line, leader, tick, fx } = look.tone;
  return { '--cap-line': line, '--leader': leader, '--tick': tick, ...(fx ? { '--cap-fx': fx } : {}) } as CSSProperties;
}

export function BodyFigure({ gender, view, stats, focus, height, width, fit, onAnchors, relativeTo, onPick }: {
  gender: 'male' | 'female'; view: 'front' | 'back'; stats: Map<string, HeadStat>; focus: string | null; height: number;
  /** 外框宽：变了要重量锚点（不参与绘制） */ width?: number;
  /** 可用宽度（容量页，2026-10-10 用户）：给了就不用固定的 ratio/figure-crop，改成**裁到刚好露出完整腹肌**——
   *  裁切线 = 正面腹肌左边缘再让出半个左缘渐隐（正反面同一个比例，切换不跳）；人体左对齐贴页面边距。
   *  屏幕窄、这样露出的宽度超过 fit 时，再多裁一点让手刚好碰到胶囊列；裁切量夹在 [FIT_MIN, FIT_MAX] 里 */ fit?: number;
  onAnchors: (a: Anchors) => void; relativeTo: React.RefObject<HTMLElement | null>;
  /** 轻点某块肌肉（只有带 data-head 的肌头可点；其余部分不接触摸，页面照常滚动） */
  onPick?: (id: string) => void;
}) {
  const [data, setData] = useState<BodyMap | null>(null);
  const [bb, setBb] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [absAt, setAbsAt] = useState<number | null>(null);   // 正面腹肌左边缘在包围盒里的位置（0–1）
  const svg = useRef<SVGSVGElement>(null);
  const thermal = useContext(BodyRender), fid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  useEffect(() => { let on = true; setBb(null); load(gender).then((d) => on && setData(d)); return () => { on = false; }; }, [gender, view]);

  // 第一次渲染整张图量包围盒，再从左裁：固定 ratio/figure-crop，或按可用宽度反算（fit）
  useLayoutEffect(() => {
    if (!data || bb || !svg.current) return;
    const b = svg.current.getBBox();
    setBb({ x: b.x, y: b.y, width: b.width, height: b.height });
  }, [data, bb]);
  // 腹肌位置：用正面的路径量（背面没有腹肌，用同一个比例）；临时挂一张看不见的 svg 量完就删
  useLayoutEffect(() => {
    if (!data || !fit || absAt != null) return;
    const ns = 'http://www.w3.org/2000/svg', tmp = document.createElementNS(ns, 'svg');
    tmp.setAttribute('style', 'position:absolute;visibility:hidden;width:0;height:0');
    const add = (keys: string[]) => { const g = document.createElementNS(ns, 'g'); keys.forEach((k) => (data.front[k]?.paths ?? []).forEach((p) => { const e = document.createElementNS(ns, 'path'); e.setAttribute('d', p.d); g.appendChild(e); })); tmp.appendChild(g); return g; };
    const all = add(Object.keys(data.front)), abs = add(['upper-abdominals', 'lower-abdominals']);
    document.body.appendChild(tmp);
    try { const a = all.getBBox(), m = abs.getBBox(); if (a.width && m.width) setAbsAt((m.x - a.x) / a.width); } catch { /* jsdom 没有 getBBox */ }
    tmp.remove();
  }, [data, fit, absAt]);
  const vb = useMemo(() => {
    if (!bb) return null;
    const pad = bb.height * 0.004, h = bb.height + pad * 2;
    let crop: number = T['ratio/figure-crop'];
    if (fit) {
      const right = bb.x + bb.width + pad, fade = T['ratio/figure-fade'] / 2;
      // 腹肌左边缘落在左缘渐隐的一半处（再往外就露出腹斜肌，再往里腹肌被渐隐吃掉）：x0 + fade·(right − x0) = 腹肌左缘
      const abs = absAt == null ? crop : ((bb.x + bb.width * absAt - fade * right) / (1 - fade) - bb.x) / bb.width;
      const tight = 1 - ((fit / height) * h - pad) / bb.width;   // 手刚碰到胶囊的裁切量
      crop = Math.min(FIT_MAX, Math.max(FIT_MIN, abs, tight));
    }
    const x0 = bb.x + bb.width * crop;
    return [x0, bb.y - pad, bb.x + bb.width - x0 + pad, h];
  }, [bb, fit, height, absAt]);

  // 锚点：每个肌头在可见部分里面积最大的一块的中心
  useLayoutEffect(() => {
    if (!vb || !svg.current || !relativeTo.current) return;
    const el = svg.current, ctm = el.getScreenCTM(), base = relativeTo.current.getBoundingClientRect(), x0 = vb[0];
    if (!ctm) return;
    const minVisible = vb[2] * T['ratio/figure-fade'];
    const out: Anchors = {};
    for (const g of el.querySelectorAll<SVGGElement>('g[data-head]')) {
      let best: { a: number; x: number; y: number } | null = null;
      for (const p of g.querySelectorAll('path')) {
        const b = p.getBBox(), l = Math.max(b.x, x0 + minVisible), r = b.x + b.width;
        if (r <= l) continue; // 落在裁掉或渐隐的部分里
        const a = (r - l) * b.height;
        if (!best || a > best.a) best = { a, x: (l + r) / 2, y: b.y + b.height / 2 };
      }
      if (!best) continue;
      const pt = new DOMPoint(best.x, best.y).matrixTransform(ctm);
      out[g.dataset.head!] = [pt.x - base.left, pt.y - base.top];
    }
    onAnchors(out);
  }, [vb, height, width, stats, onAnchors, relativeTo]);

  if (!data) return null;
  const v = data[view];
  const pick = onPick && ((e: React.MouseEvent) => { const id = (e.target as Element).closest?.('g[data-head]')?.getAttribute('data-head'); if (id) onPick(id); });
  const box = vb ?? (data.viewBox ?? '0 0 676.49 1203.49').split(' ').map(Number);
  const tier = (id: string) => {
    const h = stats.get(id);
    if (!h || !(h.sets7d > 0)) return s.tNone;
    return h.level === 'over' ? s.tOver : h.level === 'ok' ? s.tOk : s.tLow;
  };
  if (thermal) return <ThermalSvg {...{ svgRef: svg, vb, box, height, v, stats, focus, fid, thermal, pick }} />;
  return (
    <svg ref={svg} className={`${vb ? s.figure : s.measuring} ${pick ? s.pickable : ''}`} onClick={pick} viewBox={box.join(' ')} height={height} width={(height * box[2]) / box[3]} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <g className={s.neutral}>{NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
      {Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body').map((k) => (
        <g key={k} data-head={k} className={`${tier(k)} ${k === focus ? s.tFocus : ''}`}>
          {(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}
        </g>
      ))}
      <g className={s.contour}>
        {(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}
        {(v.body?.lines ?? []).map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />)}
      </g>
    </svg>
  );
}

/** 热成像：每块肌肉先按热度画成灰阶，再整体做一次「扩散（模糊）+ 渐变映射」。
 *  bloom：清晰的肌肉叠在自己的辉光上；iso：更强的扩散后量化成等温带，裁回人体轮廓；scan：bloom + 横向扫描线与颗粒，像热像仪画面。 */
function ThermalSvg({ svgRef, vb, box, height, v, stats, focus, fid, thermal, pick }: {
  svgRef: React.RefObject<SVGSVGElement | null>; vb: number[] | null; box: number[]; height: number; v: Record<string, Part>; stats: Map<string, HeadStat>;
  focus: string | null; fid: string; thermal: { palette: 'lime' | 'bone'; style: 'bloom' | 'iso' | 'scan' }; pick?: (e: React.MouseEvent) => void;
}) {
  const [r, g, b] = tables(thermal.palette), iso = thermal.style === 'iso', unit = box[3] / 100;
  const gray = (t: number) => `color-mix(in srgb, white ${Math.round(t * 100)}%, black)`;
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const fn = iso ? 'discrete' : 'table';
  // 三层视效：context 没给就用默认（DEFAULT_LOOK）；旧默认（glow / thermal / band）在下面的渲染里就是「不套方案」的那条路
  const scanK = useContext(ScanFx) ?? DEFAULT_LOOK.scan, contourK = useContext(ContourFx) ?? DEFAULT_LOOK.contour, fillK = useContext(FillFx) ?? DEFAULT_LOOK.fill;
  const fx = scanK === 'band' ? null : scanK, contourFx = contourK === 'glow' ? null : contourK, fill = fillK === 'thermal' ? null : fillK;
  const w = (height * box[2]) / box[3];
  // 浅色（2026-10-10 全局浅色）：只有默认三层（O2 / F1 / S9）有浅色版，各层自己判断；切主题、换方案都会重画（look 进渲染）
  const stack = useRef<HTMLSpanElement>(null), look = useLightLook(stack);
  return (
    <span ref={stack} className={s.stack} style={{ width: w, height }}>
    <svg ref={svgRef} className={`${vb ? s.thermal : s.measuring} ${pick ? s.pickable : ''}`} onClick={pick} viewBox={box.join(' ')} height={height} width={w} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs>
        {/* 每块肌肉一个径向渐变：中心是它的热度，边缘降到 55%，看起来是一团热而不是一块颜色 */}
        {heads.map((k) => { const h = heatOf(stats.get(k)); return (
          <radialGradient key={k} id={`g${fid}${k}`} cx="0.5" cy="0.45" r="0.62">
            <stop offset="0" style={{ stopColor: gray(Math.min(1, h * 1.08)) }} /><stop offset="1" style={{ stopColor: gray(h * 0.55) }} />
          </radialGradient>); })}
        <filter id={`h${fid}`} colorInterpolationFilters="sRGB" x="-15%" y="-8%" width="130%" height="116%">
          {/* 内部：小半径扩散后裁回肌肉轮廓 → 中心热、边缘凉；外部：大半径扩散做热晕；iso 把内部量化成等温带 */}
          <feGaussianBlur in="SourceGraphic" stdDeviation={unit * (iso ? 1.5 : 0.7)} result="soft" />
          <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={unit * 2.6} result="halo" />
          <feComponentTransfer in="halo" result="haloDim"><feFuncA type="linear" slope={iso ? 0 : 0.7} /></feComponentTransfer>
          <feMerge result="heat"><feMergeNode in="haloDim" /><feMergeNode in="inner" /></feMerge>
          <feComponentTransfer in="heat"><feFuncR type={fn} tableValues={r} /><feFuncG type={fn} tableValues={g} /><feFuncB type={fn} tableValues={b} /></feComponentTransfer>
        </filter>
        {thermal.style === 'scan' && <>
          <pattern id={`s${fid}`} width={unit} height={unit * 0.9} patternUnits="userSpaceOnUse"><rect width={unit} height={unit * 0.3} className={s.scanLine} /></pattern>
          <filter id={`n${fid}`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /><feComposite in2="SourceAlpha" operator="in" /></filter>
        </>}
      </defs>
      {fill ? <FillLayer kind={fill} v={v} heads={heads} stats={stats} fid={fid} unit={unit} gray={gray} look={look} /> : (
      <g filter={`url(#h${fid})`}>
        {NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} style={{ fill: gray(0.04) }} />))}
        {heads.map((k) => (
          <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#g${fid}${k})`} />)}</g>
        ))}
      </g>)}
      {thermal.style === 'scan' && !fill && (
        <g className={s.scan}>
          {Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} fill={`url(#s${fid})`} />))}
          <g filter={`url(#n${fid})`} className={s.grain}>{Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />))}</g>
        </g>
      )}
      {focus && v[focus] && <g className={s.thermalFocus}>{(v[focus].paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>}
      {/* 轮廓画在上面的光层里；这里留一份不上色的，只为量包围盒（头部只有轮廓，没有肌肉路径，不量它头会被裁掉） */}
      <g className={s.measureOnly}>{(v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />)}</g>
    </svg>
    {vb && <ThermalLight box={box} height={height} width={w} v={v} fid={fid} noBeam={!!fx} contour={contourFx} look={look} />}
    {vb && fx && <ScanLines kind={fx} box={box} height={height} width={w} v={v} fid={fid} heat={(k) => heatOf(stats.get(k))} look={look} />}
    </span>
  );
}

/** 热像上面的「光」（2026-10-06 用户：黑色勾线让轮廓不清楚，改浅荧光并给好看的动效；热力图也要扫描线动效）：
 *  - 轮廓：浅荧光细线，挂载时从下往上描出（遮罩矩形从脚到头长出来）；
 *  - 游光：同一组轮廓的更亮一份，被一条横向光带遮着，光带每隔一阵从下往上扫过一次（像光沿着轮廓爬上去）；
 *  - 扫描光带：裁在人体剪影里的一条荧光带（带细扫描线），周期性从下往上扫过热力图；
 *  整层 mix-blend-mode: screen（只提亮、不盖住热像）、不接触摸；减少动态效果时只留静止的轮廓。 */
function ThermalLight({ box, height, width, v, fid, noBeam, contour: kind, look }: { box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; noBeam?: boolean; contour?: Exclude<ContourFxKind, 'glow'> | null; look: LightLookSpec | null }) {
  const [x, y, bw, bh] = box, unit = bh / 100;
  // 浅色：只有柔光描边有浅色版——线色、混合模式按所选描边方案（LightContour；没选就是人体方案自己的）：multiply 只压暗，frost 是普通叠放的白线
  const pick = useContext(LightContour);
  const ink = look && kind === 'soft' ? LIGHT_CONTOURS[pick ?? look.contour] : null;
  const silhouette = Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />));
  const contour = (v.body?.paths ?? []).map((p, i) => <path key={i} d={p.d} />);
  return (
    <svg className={`${s.light} ${s.lightHalf}${ink?.blend === 'multiply' ? ` ${s.lightInk}` : ''}`} viewBox={box.join(' ')} width={width} height={height} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs>
        <clipPath id={`c${fid}`}>{silhouette}</clipPath>
        <mask id={`r${fid}`} maskUnits="userSpaceOnUse" x={x} y={y} width={bw} height={bh}><rect className={s.reveal} x={x} y={y} width={bw} height={bh} fill="white" /></mask>
        <linearGradient id={`gb${fid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0" /><stop offset="0.5" stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={`m${fid}`} maskUnits="userSpaceOnUse" x={x} y={y} width={bw} height={bh}><rect className={s.glintBand} x={x} y={y} width={bw} height={bh * 0.22} fill={`url(#gb${fid})`} /></mask>
        {/* 扫描光带：往上走，所以最亮的一道边在顶上，往下渐淡；带里一排细扫描线（同样往下渐淡） */}
        <linearGradient id={`sb${fid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s.beamStop0} /><stop offset="0.04" className={s.beamStop2} /><stop offset="0.3" className={s.beamStop1} /><stop offset="1" className={s.beamStop0} />
        </linearGradient>
        <pattern id={`sl${fid}`} width={unit} height={unit * 0.8} patternUnits="userSpaceOnUse"><rect width={unit} height={unit * 0.25} className={s.beamLine} /></pattern>
        <mask id={`bm${fid}`} maskUnits="userSpaceOnUse" x={x} y={y} width={bw} height={bh * 0.14}><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sb${fid})`} /></mask>
      </defs>
      {kind ? <ContourVariant kind={kind} contour={contour} silhouette={silhouette} fid={fid} unit={unit} ink={ink} /> : (
      <g mask={`url(#r${fid})`}>
        <g className={s.contourLime}>{contour}</g>
        <g className={s.glint} mask={`url(#m${fid})`}>{contour}</g>
      </g>)}
      {!noBeam && <g clipPath={`url(#c${fid})`} className={s.beamWrap}>
        <g className={s.beam}><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sb${fid})`} /><rect x={x} y={y} width={bw} height={bh * 0.14} fill={`url(#sl${fid})`} mask={`url(#bm${fid})`} /></g>
      </g>}
    </svg>
  );
}

/** 扫描线逐层动效（方案见上面 ScanFxKind）：扫描线一行一个矩形（约 110 行，间距 0.9% 人体高），裁在人体剪影里；
 *  每行的动画一样、只差起始时间（从脚往头按行错开），所以看起来是一层层推上去的；只动 opacity。
 *  raster 用 multiply（暗栅盖在热力上，打开才露出来），其余用 screen（只提亮）；iso 不按行、按肌肉热度排先后。 */
function ScanLines({ kind, box, height, width, v, fid, heat, look }: { kind: Exclude<ScanFxKind, 'band'>; box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; heat: (k: string) => number; look: LightLookSpec | null }) {
  if (kind === 'pump' || kind === 'steam' || kind === 'fiber' || kind === 'beam' || kind === 'molten') return <ThemeFx kind={kind} box={box} height={height} width={width} v={v} fid={fid} heat={heat} look={kind === 'molten' ? look : null} />;
  const [x, y, bw, bh] = box, unit = bh / 100, pitch = unit * 0.9, n = Math.floor(bh / pitch);
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const silhouette = Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />));
  const sweep = T['motion/slow'] * (kind === 'wave' ? 7 : 5);   // 从脚扫到头用多久
  if (kind === 'iso') {
    // 按热度从高到低排名，名次决定先后；没练过（热度 0）的不亮
    const rank = heads.map((k) => [k, heat(k)] as const).filter(([, h]) => h > 0.05).sort((a, b) => b[1] - a[1]);
    return (
      <svg className={`${s.fx} ${s.fxScreen} ${s.lightHalf}`} viewBox={box.join(' ')} width={width} height={height} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
        <defs><pattern id={`ip${fid}`} width={unit} height={pitch} patternUnits="userSpaceOnUse"><rect width={unit} height={unit * 0.3} className={s.fxLine} /></pattern></defs>
        {rank.map(([k], i) => (
          <g key={k} className={s.isoLayer} style={{ animationDelay: `${Math.round((i / Math.max(1, rank.length - 1)) * sweep)}ms` }}>
            {(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} fill={`url(#ip${fid})`} />)}
          </g>
        ))}
      </svg>
    );
  }
  const cls = { raster: s.rasterLine, slice: s.sliceLine, wave: s.waveLine }[kind];
  return (
    <svg className={`${s.fx} ${kind === 'raster' ? s.fxMul : s.fxScreen} ${s.lightHalf}`} viewBox={box.join(' ')} width={width} height={height} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
      <defs><clipPath id={`sc${fid}`}>{silhouette}</clipPath></defs>
      <g clipPath={`url(#sc${fid})`}>
        {Array.from({ length: n }, (_, i) => {
          const j = n - 1 - i;   // 从下往上数第几行
          const delay = kind === 'wave' ? (j % 24) * (sweep / 24) : (j / n) * sweep;
          return <rect key={i} className={cls} x={x} y={y + i * pitch} width={bw} height={kind === 'raster' ? pitch * 0.62 : unit * 0.3} style={{ animationDelay: `${Math.round(delay)}ms` }} />;
        })}
      </g>
    </svg>
  );
}

/** 可复现的伪随机（mulberry32）：同一个种子每次渲染出一样的粒子 */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

/** S 层第二批：呼应主题的四个动效（说明见 ScanFxKind）。只动 transform / opacity / stroke-dashoffset，减少动态效果时全静止 */
function ThemeFx({ kind, box, height, width, v, fid, heat, look }: { kind: 'pump' | 'steam' | 'fiber' | 'beam' | 'molten'; box: number[]; height: number; width: number; v: Record<string, Part>; fid: string; heat: (k: string) => number;
  /** 浅色人体方案（只有熔流用）：null = 深色原样 */ look?: LightLookSpec | null }) {
  const [x, y, bw, bh] = box, unit = bh / 100, slow = T['motion/slow'];
  const gray = (t: number) => `color-mix(in srgb, white ${Math.round(t * 100)}%, black)`;
  const heads = Object.keys(v).filter((k) => !NEUTRAL.includes(k) && k !== 'body');
  const hot = heads.map((k) => [k, heat(k)] as const).filter(([, h]) => h > 0.12);
  const silhouette = Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} />));
  // 蒸腾要知道每块肌肉的上沿在哪：先画一份看不见的量包围盒
  const meas = useRef<SVGGElement>(null);
  const [boxes, setBoxes] = useState<Record<string, [number, number, number, number]>>({});
  useLayoutEffect(() => {
    if (kind !== 'steam' || !meas.current) return;
    const out: Record<string, [number, number, number, number]> = {};
    meas.current.querySelectorAll<SVGGElement>('g[data-m]').forEach((g) => {
      try { const b = g.getBBox(); if (b.width) out[g.dataset.m!] = [b.x, b.y, b.width, b.height]; } catch { /* jsdom 没有 getBBox */ }
    });
    setBoxes(out);
  }, [kind, v]);
  // 熔流每帧都要重算整条滤镜（湍流 + 置换 + 模糊），而它流得很慢：SMIL 不让它自己跑，改成每秒约 15 次手动步进
  // （setCurrentTime），整页帧率不被拖累；滚出屏幕、页面切到后台时停步进（省电，手机上不白跑）
  const flowSvg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = flowSvg.current;
    if (kind !== 'molten' || !el || typeof el.pauseAnimations !== 'function') return;
    el.pauseAnimations();
    let seen = true, t = el.getCurrentTime(), last = performance.now();
    const step = T['motion/slow'] / 5;   // 70：约 14 帧 / 秒
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (seen && !document.hidden) { t += (now - last) / 1000; el.setCurrentTime(t); }
      last = now;
    }, step);
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([e]) => { seen = e.isIntersecting; }) : null;
    io?.observe(el);
    return () => { window.clearInterval(timer); io?.disconnect(); };
  }, [kind]);
  const svgProps = { className: `${s.fx} ${s.fxScreen} ${s.lightHalf}`, viewBox: box.join(' '), width, height, preserveAspectRatio: 'xMinYMin meet', 'aria-hidden': true } as const;

  if (kind === 'molten') {
    // 亮带 = spreadMethod reflect 的竖向渐变（暗 → 亮 → 暗），一直往上平移；扭曲场不动，亮带流过它就被搅成熔体的流纹。
    // 滤镜和渐变的属性 CSS 动不了，用 SMIL；减少动态效果时不挂动画（只剩静止的一层淡流纹）
    // 浅色（2026-10-10）：整层 multiply，渐变反相（冷 = 白、不起作用），最后的矩阵把黑映射成方案的 moltenTint、白不变——流纹是压暗的深色，不是提亮
    const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tone = look ? (t: number) => gray(1 - t * look.molten) : gray;
    return (
      // 单独一层（will-change）：熔流每步重算滤镜时，只重画它自己，不连带下面静止的金属层一起重新栅格化（2026-10-10 性能，容量页栅格耗时降到约 1/8）
      <svg {...svgProps} className={`${look ? `${s.fx} ${s.fxMul} ${s.lightHalf}` : svgProps.className} ${s.ownLayer}`} ref={flowSvg} data-flow="molten">
        <defs>
          {hot.map(([k, h]) => (
            <linearGradient key={k} id={`mo${fid}${k}`} x1="0" y1="0" x2="0" y2="0.45" spreadMethod="reflect">
              <stop offset="0" style={{ stopColor: tone(0) }} /><stop offset="0.7" style={{ stopColor: tone(h * 0.25) }} /><stop offset="1" style={{ stopColor: tone(Math.min(1, h * 0.95)) }} />
              {!still && <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 -0.9" dur={`${Math.round(slow * (34 - h * 18))}ms`} repeatCount="indefinite" />}
            </linearGradient>
          ))}
          <filter id={`mo${fid}`} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={2} seed={5} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={unit * 7} xChannelSelector="R" yChannelSelector="G" result="disp">
              {!still && <animate attributeName="scale" values={`${unit * 5};${unit * 9};${unit * 5}`} dur={`${slow * 24}ms`} repeatCount="indefinite" />}
            </feDisplacementMap>
            <feGaussianBlur in="disp" stdDeviation={unit * 0.35} result="soft" />
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
            {/* 灰阶 → 荧光到骨白（只提亮，screen 叠上去不会压暗 F 层）；浅色：白 → 白、黑 → moltenTint（只压暗） */}
            <feColorMatrix in="inner" type="matrix" values={look ? tintMatrix(look.moltenTint) : '0.85 0 0 0 0  0 1 0 0 0  0.55 0 0 0 0  0 0 0 1 0'} />
          </filter>
        </defs>
        <g filter={`url(#mo${fid})`}>
          {hot.map(([k]) => <g key={k}>{(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} fill={`url(#mo${fid}${k})`} />)}</g>)}
        </g>
      </svg>
    );
  }

  if (kind === 'pump') return (
    <svg {...svgProps}>
      <defs><filter id={`pp${fid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={unit * 0.8} /></filter></defs>
      {hot.map(([k, h]) => (
        <g key={k} className={s.pumpHead} style={{ '--h': h.toFixed(2), animationDuration: `${Math.round(slow * (6 - h * 2))}ms` } as React.CSSProperties} filter={`url(#pp${fid})`}>
          {(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} />)}
        </g>
      ))}
    </svg>
  );

  if (kind === 'fiber') return (
    <svg {...svgProps}>
      <defs><filter id={`fb${fid}`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={unit * 0.25} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
      <g filter={`url(#fb${fid})`}>
        {hot.map(([k, h], i) => (v[k].paths ?? []).map((p, j) => (
          <path key={k + j} d={p.d} pathLength={100} className={s.fiberRun} strokeWidth={unit * (0.22 + h * 0.3)}
            style={{ '--h': h.toFixed(2), animationDuration: `${Math.round(slow * (12 - h * 6))}ms`, animationDelay: `${-Math.round((i * 7 + j * 3) * slow / 5)}ms` } as React.CSSProperties} />
        )))}
      </g>
    </svg>
  );

  if (kind === 'steam') {
    const parts: ReactNode[] = [];
    hot.forEach(([k, h], i) => {
      const b = boxes[k]; if (!b) return;
      const r = rng(i * 97 + 13), n = Math.round(4 + h * 10);
      for (let j = 0; j < n; j++) {
        const px = b[0] + b[2] * (0.15 + r() * 0.7), py = b[1] + b[3] * (0.1 + r() * 0.4);
        const dur = slow * (9 - h * 4) * (0.8 + r() * 0.4);
        parts.push(<circle key={k + j} className={s.steamDot} cx={px} cy={py} r={unit * (0.3 + r() * 0.45)}
          style={{ '--rise': `${-(unit * (6 + r() * 6)).toFixed(1)}px`, '--drift': `${((r() - 0.5) * unit * 3).toFixed(1)}px`, '--h': h.toFixed(2), animationDuration: `${Math.round(dur)}ms`, animationDelay: `${-Math.round(r() * dur)}ms` } as React.CSSProperties} />);
      }
    });
    return (
      <svg {...svgProps}>
        <g ref={meas} className={s.measureOnly}>{hot.map(([k]) => <g key={k} data-m={k}>{(v[k].paths ?? []).map((p, j) => <path key={j} d={p.d} />)}</g>)}</g>
        <defs><filter id={`st${fid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={unit * 0.12} /></filter></defs>
        <g filter={`url(#st${fid})`}>{parts}</g>
      </svg>
    );
  }

  // beam：奥赛台顶光（2026-10-07 用户：光束要能在肌肉上打出高光和阴影，像站上奥赛台，强化形体）。
  // 斜光从左上打下来、整束左右慢慢摆，光里浮尘漂；同时把每块肌肉当成一个鼓起的枕头（白色肌肉 + 黑色缝 → 模糊 = 高度图），
  // 用一盏跟着光束摆的点光源做 SVG 光照：镜面高光走 screen 层（只提亮），漫反射的暗面走 multiply 层（只压暗），都裁在剪影里。
  const r = rng(7), dust = Array.from({ length: 34 }, (_, i) => {
    const dur = slow * (14 + r() * 10);
    return <circle key={i} className={s.beamDust} cx={x + bw * (0.1 + r() * 0.8)} cy={y + bh * (0.05 + r() * 0.9)} r={unit * (0.15 + r() * 0.3)}
      style={{ '--dx': `${((r() - 0.5) * unit * 5).toFixed(1)}px`, '--dy': `${((r() - 0.3) * unit * 5).toFixed(1)}px`, animationDuration: `${Math.round(dur)}ms`, animationDelay: `${-Math.round(r() * dur)}ms` } as React.CSSProperties} />;
  });
  const cone = `M${x + bw * 0.2} ${y - bh * 0.05} L${x + bw * 0.36} ${y - bh * 0.05} L${x + bw * 0.88} ${y + bh * 1.05} L${x + bw * 0.42} ${y + bh * 1.05} Z`;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 光源：人体左上方高处，和光束同周期左右摆（光束 CSS 摆 30 个 slow 来回，这里一来一回 60 个 slow）
  const lx = x + bw * 0.4, ly = y - bh * 0.12, lz = bh * 0.32, swing = bw * 0.3;
  const light = (
    <fePointLight x={lx} y={ly} z={lz}>
      {!still && <animate attributeName="x" values={`${lx + swing};${lx - swing};${lx + swing}`} dur={`${slow * 60}ms`} repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />}
    </fePointLight>
  );
  // 高度图：黑底 + 白色肌肉，肌肉之间描一道黑缝，模糊后每块肌肉都是中间高、边上低
  const relief = (
    <>
      <rect x={x} y={y} width={bw} height={bh} className={s.reliefBase} />
      {Object.keys(v).filter((k) => k !== 'body').flatMap((k) => (v[k].paths ?? []).map((p, i) => <path key={k + i} d={p.d} className={s.reliefMuscle} strokeWidth={unit * 0.4} />))}
    </>
  );
  const heightMap = <><feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="h0" /><feGaussianBlur in="h0" stdDeviation={unit * 0.9} result="h" /></>;
  return (
    <>
      <svg {...svgProps} className={`${s.fx} ${s.fxMul} ${s.lightHalf}`}>
        <defs>
          <clipPath id={`bsc${fid}`}>{silhouette}</clipPath>
          <filter id={`bd${fid}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {heightMap}
            <feDiffuseLighting in="h" surfaceScale={unit * 3} diffuseConstant={1.25} className={s.stageLight}>{light}</feDiffuseLighting>
            {/* 暗面压得更深一点（gamma），亮面接近白 = multiply 后不变 */}
            <feComponentTransfer><feFuncR type="gamma" exponent="1.35" amplitude="1.08" /><feFuncG type="gamma" exponent="1.35" amplitude="1.08" /><feFuncB type="gamma" exponent="1.35" amplitude="1.08" /></feComponentTransfer>
          </filter>
        </defs>
        <g clipPath={`url(#bsc${fid})`} className={s.stageShade}><g filter={`url(#bd${fid})`}>{relief}</g></g>
      </svg>
      <svg {...svgProps}>
        <defs>
          <linearGradient id={`bg${fid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className={s.beamStop0} /><stop offset="1" className={s.beamStop1} /></linearGradient>
          <filter id={`bf${fid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={unit * 2.4} /></filter>
          <clipPath id={`bc${fid}`}>{silhouette}</clipPath>
          <mask id={`bm${fid}`} maskUnits="userSpaceOnUse" x={x - bw} y={y - bh * 0.1} width={bw * 3} height={bh * 1.2}><g className={s.beamSway}><path d={cone} fill="white" filter={`url(#bf${fid})`} /></g></mask>
          <filter id={`bs${fid}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {heightMap}
            <feSpecularLighting in="h" surfaceScale={unit * 3} specularConstant={1.1} specularExponent={22} className={s.stageLight} result="spec">{light}</feSpecularLighting>
            {/* 镜面光的 alpha 就是亮度：只留高光本身，暗处全透明 */}
            <feComposite in="spec" in2="spec" operator="arithmetic" k1={0} k2={1} k3={0} k4={0} />
          </filter>
        </defs>
        <g className={s.beamSway}><path d={cone} fill={`url(#bg${fid})`} filter={`url(#bf${fid})`} /></g>
        <g clipPath={`url(#bc${fid})`} mask={`url(#bm${fid})`}><rect x={x} y={y} width={bw} height={bh} className={s.beamLit} /></g>
        <g clipPath={`url(#bc${fid})`} className={s.stageSpec}><g filter={`url(#bs${fid})`}>{relief}</g></g>
        <g mask={`url(#bm${fid})`}>{dust}</g>
      </svg>
    </>
  );
}

/** 描边的四个方案（ContourFxKind）：都是静态的，只换线的样子，不再描出 / 游光 */
function ContourVariant({ kind, contour, silhouette, fid, unit, ink }: { kind: Exclude<ContourFxKind, 'glow'>; contour: ReactNode; silhouette: ReactNode; fid: string; unit: number;
  /** 浅色柔光描边：线色 / 透明度 / 模糊 / 线宽 / 影子，见 LIGHT_CONTOURS */ ink?: LightContourSpec | null }) {
  if (kind === 'hair') return <g className={s.cHair}>{contour}</g>;
  if (kind === 'dot') return <g className={s.cDot}>{contour}</g>;
  if (kind === 'soft') return (
    <>
      {/* 浅色：深色线一模糊就像失焦（深色里的模糊亮线读起来是光），所以只留一点点柔 */}
      <defs><filter id={`cs${fid}`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={unit * (ink ? ink.blur : 0.35)} /></filter></defs>
      {ink
        ? ink.alpha > 0 && <>
          {ink.shadow && <g className={s.cSoftInk} filter={`url(#cs${fid})`} transform={`translate(0 ${unit * ink.shadow.dy})`} style={{ '--ink': ink.shadow.color, '--ink-a': ink.shadow.alpha, '--w': ink.width } as CSSProperties}>{contour}</g>}
          <g className={s.cSoftInk} filter={`url(#cs${fid})`} style={{ '--ink': ink.color, '--ink-a': ink.alpha, '--w': ink.width } as CSSProperties}>{contour}</g>
        </>
        : <g className={s.cSoft} filter={`url(#cs${fid})`}>{contour}</g>}
    </>
  );
  // rim：剪影收缩一点再和原剪影相减，只剩最外一圈边，模糊成内缘光；内部肌肉分界线不画
  return (
    <>
      <defs>
        <filter id={`cr${fid}`} x="-5%" y="-5%" width="110%" height="110%">
          {/* 先膨胀再收缩（闭运算）把肌肉之间的缝合上，得到整个人的剪影；再收缩一圈和剪影相减，只剩最外一圈 */}
          <feMorphology in="SourceAlpha" operator="dilate" radius={unit * 0.6} result="grow" />
          <feMorphology in="grow" operator="erode" radius={unit * 0.6} result="solid" />
          <feMorphology in="solid" operator="erode" radius={unit * 0.35} result="in" />
          <feComposite in="solid" in2="in" operator="out" result="edge" />
          <feGaussianBlur in="edge" stdDeviation={unit * 0.35} result="soft" />
          <feFlood className={s.cRimFlood} result="c" />
          <feComposite in="c" in2="soft" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#cr${fid})`}>{silhouette}<g className={s.cRimFill}>{contour}</g></g>
    </>
  );
}

/** 肌头内部容量的四个方案（FillFxKind）。每块肌肉仍是 g[data-head]（锚点、轻点要用） */
function FillLayer({ kind, v, heads, stats, fid, unit, gray, look }: { kind: Exclude<FillFxKind, 'thermal'>; v: Record<string, Part>; heads: string[]; stats: Map<string, HeadStat>; fid: string; unit: number; gray: (t: number) => string;
  /** 浅色人体方案（只有金属渐变用）：null = 深色原样 */ look: LightLookSpec | null }) {
  const neutral = NEUTRAL.flatMap((k) => (v[k]?.paths ?? []).map((p, i) => <path key={k + i} d={p.d} style={{ fill: gray(0.06) }} />));
  const H = (k: string) => heatOf(stats.get(k));
  if (kind === 'metal') {
    // 照用户给的 AE 参考（2026-10-07）：Gradient Ramp（每块肌肉自下而上的灰阶，热度越高越亮）→ Turbulent Displace（大尺度湍流扭曲）
    // + Fast Box Blur（强模糊，像熔化的流体）→ Colorama（暗 → 橄榄 → 荧光 → 浅荧光 → 骨白热）→ 形状边缘一圈亮的内缘光 + 外发光 + 一点颗粒
    // 浅色（2026-10-10）：色带换方案的（冷 = 纸白、热 = 深色），唇边 / 内缘压暗、外发光减淡、颗粒改墨色——其余滤镜链和深色一样
    const [r, g, b] = rampTables(look ? look.ramp : ['gray-50', 'lime-900', 'lime-700', 'lime-500', 'lime-300', 'gray-900']);
    const lip = look ? look.lip : '2.4', edge = look ? look.edge : '1.5';
    const grainM = look ? `${primRgb('ink-900').map((c) => `0 0 0 0 ${c.toFixed(3)}`).join('  ')}  ${look.grain} 0 0 0 0` : '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.12 0 0 0 0';
    return (
      <>
        <defs>
          {heads.map((k) => { const h = H(k); return (
            <linearGradient key={k} id={`mg${fid}${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: gray(h * 0.62) }} /><stop offset="0.55" style={{ stopColor: gray(Math.min(1, h * 0.9)) }} /><stop offset="1" style={{ stopColor: gray(Math.min(1, h * 1.12)) }} />
            </linearGradient>); })}
          <filter id={`mf${fid}`} colorInterpolationFilters="sRGB" x="-20%" y="-10%" width="140%" height="120%">
            {/* Turbulent Displace：只在形状内部把渐变搅成熔融的流动，形状本身的边不动（再裁回原形） */}
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={3} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={unit * 5} xChannelSelector="R" yChannelSelector="G" result="disp" />
            {/* Fast Box Blur：SVG 没有盒式模糊，用高斯模糊代替 */}
            <feGaussianBlur in="disp" stdDeviation={unit * 0.9} result="soft" />
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
            {/* Colorama：暗 → 橄榄 → 荧光 → 浅荧光 → 骨白热 */}
            <feComponentTransfer in="inner" result="col"><feFuncR type="table" tableValues={r} /><feFuncG type="table" tableValues={g} /><feFuncB type="table" tableValues={b} /></feComponentTransfer>
            {/* 底缘白热亮边：形状减去上移一点的自己 = 只剩下沿一道月牙；亮度跟着那里的颜色走（凉的肌肉不发亮） */}
            <feOffset in="SourceAlpha" dy={unit * -0.5} result="up" />
            <feComposite in="SourceAlpha" in2="up" operator="out" result="lip" />
            <feGaussianBlur in="lip" stdDeviation={unit * 0.12} result="lipS" />
            <feComposite in="col" in2="lipS" operator="in" result="rimBase" />
            <feComponentTransfer in="rimBase" result="rim"><feFuncR type="linear" slope={lip} /><feFuncG type="linear" slope={lip} /><feFuncB type="linear" slope={lip} /></feComponentTransfer>
            {/* 整圈极细的内缘高光（参考里形状四周那道亮线） */}
            <feMorphology in="SourceAlpha" operator="erode" radius={unit * 0.18} result="er" />
            <feComposite in="SourceAlpha" in2="er" operator="out" result="edge" />
            <feComposite in="col" in2="edge" operator="in" result="edgeCol" />
            <feComponentTransfer in="edgeCol" result="edgeHi"><feFuncR type="linear" slope={edge} /><feFuncG type="linear" slope={edge} /><feFuncB type="linear" slope={edge} /><feFuncA type="linear" slope="0.8" /></feComponentTransfer>
            {/* 外发光：大半径 + 小半径两层 */}
            <feGaussianBlur in="col" stdDeviation={unit * 3} result="glowL" />
            <feComponentTransfer in="glowL" result="glowLD"><feFuncA type="linear" slope={look ? 0.9 * look.glow : '0.9'} /></feComponentTransfer>
            <feGaussianBlur in="col" stdDeviation={unit * 0.9} result="glowS" />
            <feComponentTransfer in="glowS" result="glowSD"><feFuncA type="linear" slope={look ? 0.7 * look.glow : '0.7'} /></feComponentTransfer>
            {/* 颗粒（Noise） */}
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={11} result="grain" />
            <feColorMatrix in="grain" type="matrix" values={grainM} result="grainW" />
            <feComposite in="grainW" in2="inner" operator="in" result="grainIn" />
            {/* 浅色：上沿一道纸白高光（形状减去下移一点的自己 = 上沿月牙），和压暗的下缘一起读成金属的受光面 */}
            {look && <>
              <feOffset in="SourceAlpha" dy={unit * 0.6} result="dn" />
              <feComposite in="SourceAlpha" in2="dn" operator="out" result="top" />
              <feGaussianBlur in="top" stdDeviation={unit * 0.2} result="topS" />
              <feFlood className={s.sheen} floodOpacity={look.sheen} result="sheenC" />
              <feComposite in="sheenC" in2="topS" operator="in" result="sheen" />
            </>}
            <feMerge><feMergeNode in="glowLD" /><feMergeNode in="glowSD" /><feMergeNode in="col" /><feMergeNode in="grainIn" />{look && <feMergeNode in="sheen" />}<feMergeNode in="edgeHi" /><feMergeNode in="rim" /></feMerge>
          </filter>
        </defs>
        <g filter={`url(#mf${fid})`}>
          {neutral}
          {heads.map((k) => <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#mg${fid}${k})`} />)}</g>)}
        </g>
      </>
    );
  }
  if (kind === 'topo') {
    const [r, g, b] = rampTables(['gray-50', 'lime-900', 'lime-700', 'lime-500', 'lime-300']);
    return (
      <>
        <defs>
          {heads.map((k) => { const h = H(k); return (
            <radialGradient key={k} id={`tg${fid}${k}`} cx="0.5" cy="0.45" r="0.7"><stop offset="0" style={{ stopColor: gray(Math.min(1, h * 1.15)) }} /><stop offset="1" style={{ stopColor: gray(h * 0.1) }} /></radialGradient>); })}
          <filter id={`tf${fid}`} colorInterpolationFilters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={unit * 1.2} result="soft" />
            <feComposite in="soft" in2="SourceAlpha" operator="in" result="inner" />
            <feComponentTransfer in="inner" result="bands"><feFuncR type="discrete" tableValues="0 0.12 0.25 0.38 0.5 0.62 0.75 0.88 1" /><feFuncG type="discrete" tableValues="0 0.12 0.25 0.38 0.5 0.62 0.75 0.88 1" /><feFuncB type="discrete" tableValues="0 0.12 0.25 0.38 0.5 0.62 0.75 0.88 1" /></feComponentTransfer>
            <feConvolveMatrix in="bands" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="edges" />
            <feComponentTransfer in="edges" result="lines"><feFuncR type="linear" slope="4" /><feFuncG type="linear" slope="4" /><feFuncB type="linear" slope="4" /></feComponentTransfer>
            <feComponentTransfer in="bands" result="dim"><feFuncR type="linear" slope="0.35" /><feFuncG type="linear" slope="0.35" /><feFuncB type="linear" slope="0.35" /></feComponentTransfer>
            <feComposite in="lines" in2="dim" operator="arithmetic" k2="1" k3="1" result="sum" />
            <feComponentTransfer in="sum"><feFuncR type="table" tableValues={r} /><feFuncG type="table" tableValues={g} /><feFuncB type="table" tableValues={b} /></feComponentTransfer>
          </filter>
        </defs>
        <g filter={`url(#tf${fid})`}>
          {neutral}
          {heads.map((k) => <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#tg${fid}${k})`} />)}</g>)}
        </g>
      </>
    );
  }
  if (kind === 'halftone') {
    const cell = unit * 1.5;
    return (
      <>
        <defs>{heads.map((k) => { const h = H(k), rr = cell * 0.5 * Math.sqrt(Math.max(0.04, h)); return (
          <pattern key={k} id={`hp${fid}${k}`} width={cell} height={cell} patternUnits="userSpaceOnUse"><rect width={cell} height={cell} className={s.htBase} /><circle cx={cell / 2} cy={cell / 2} r={rr} className={h > 0.05 ? s.htDot : s.htDotOff} /></pattern>); })}</defs>
        {neutral}
        {heads.map((k) => <g key={k} data-head={k}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#hp${fid}${k})`} />)}</g>)}
      </>
    );
  }
  // liquid：每块肌肉自己的包围盒里，从下往上灌到 组数 ÷ 最大可恢复量
  return (
    <>
      <defs>{heads.map((k) => { const st = stats.get(k), lv = st && st.sets7d > 0 ? Math.min(1, st.sets7d / st.mrv) : 0; return (
        <linearGradient key={k} id={`lq${fid}${k}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" className={s.lqDeep} /><stop offset={Math.max(0, lv - 0.04)} className={s.lqFill} /><stop offset={lv} className={s.lqSurface} /><stop offset={Math.min(1, lv + 0.001)} className={s.lqEmpty} /><stop offset="1" className={s.lqEmpty} />
        </linearGradient>); })}</defs>
      {neutral}
      {heads.map((k) => <g key={k} data-head={k} className={s.lqHead}>{(v[k].paths ?? []).map((p, i) => <path key={i} d={p.d} fill={`url(#lq${fid}${k})`} />)}</g>)}
    </>
  );
}
