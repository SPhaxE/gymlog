/** /preview 方案台（2026-10-06 用户：新建一个 /preview 专门用来测试方案）：同一个人、同一份演示数据，把待选的视觉方案并排放，
 *  每格一个真实渲染（不是截图），动效照常跑。选定的方案再定为默认、写进 DESIGN.md，这里留作对照。
 *  原来 /preview 上的基础规范页挪到了 /spec。
 *  当前三组（都是容量页的人体）：描边 O、肌头内部容量 F、S 层动效；2026-10-07 用户选定 O2 + F1 + S9 为默认（DEFAULT_LOOK），
 *  每组的 0 号是第 7 轮的旧默认，留着对照。方案台本身也是作品集要展示的过程（用户 2026-10-07），选定后不删。
 *  最上面是「自由组合」（2026-10-07 用户）：三组各挑一个（浅色主题下再加浅色人体、浅色描边），右边是真实的容量页（带胶囊、可以点、可以切正反男女）；
 *  组合写在地址里（?o=hair&f=metal&s=molten），复制链接就能把这个组合发给别人。
 *  2026-10-10 全局浅色：新增「L 浅色人体」组（4 个浅色方案，每格固定浅色），自由组合加 ?l=（浅色主题下用哪个方案）；
 *  只有默认三层（O2 + F1 + S9）有浅色版，其余人体方案是深色存档——格子固定深色并写明「深色方案」。 */
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { BodyFigure, Card, Chip, ContourFx, DEFAULT_LIGHT_LOOK, DEFAULT_LOOK, FillFx, Icon, LightContour, LightLook, Num, GainLook, GrainGlow, ParticleField, ProductCard, ProductGrid, ScanFx, ShopTagLook, SteelPlate, dotMonths, type ContourFxKind, type GainLookKind, type GrainKind, type LightContourKind, type LightLookKind, type ShopTagLookKind, type FillFxKind, type ParticleKind, type PlateLook, type ScanFxKind } from '../components';
import { IconStyleCtx, type IconStyle } from '../components/iconSets';
import { bodyData } from '../data/demo';
import type { HeadStat } from '../engine';
import { logData } from '../data/log';
import { PRODUCTS } from '../data/growth';
import { GainsPage } from './GainsPage';
import { HomePage } from './HomePage';
import { BodyPage } from './BodyPage';
import { Stage } from '../playground/Stage';
import { useTheme } from '../styles/theme';
import s from './OptionsBoard.module.css';

const noop = () => {};
const CONTOUR: [ContourFxKind, string, string][] = [
  ['glow', 'O0 描出游光', '第 7 轮旧默认：浅荧光实线，挂载时从下往上描出 + 细光沿轮廓游走'],
  ['hair', 'O1 发丝', '极细、很淡的静态线；没有描出和游光'],
  ['soft', 'O2 柔光', '不画清晰的线，只有轮廓位置一圈模糊的淡光'],
  ['dot', 'O3 点线', '细点虚线，淡'],
  ['rim', 'O4 只描外缘', '人体内部的肌肉分界线不画，只在剪影最外圈一道内缘光'],
];
/** 导航图标风格（2026-10-04 用户选定 slant；原来在 /lab 对照，2026-10-07 地址各司其职后落选的放到这里） */
const ICON_STYLES: [IconStyle, string, string][] = [
  ['slant', '倾斜断笔 · 默认', 'iconref2 的断笔线稿 + 倾斜（skewX），选中时笔画从起点画到终点（iconmotionref1）'],
  ['cut', '断笔线性', '2 号圆头描边，故意留缺口、斜切；不倾斜'],
  ['trace', '运动轨迹', '同断笔线稿，描边从透明渐变到实色'],
  ['geo', '实心几何', 'iconref1：只用三角、圆、方拼形，没有描边'],
  ['current', '旧的实心一套', '阶段 5 之前的图标，留着对照'],
];
const ICON_NAMES = ['home', 'body', 'gains', 'log', 'me', 'check', 'timer', 'back'] as const;
const FILL: [FillFxKind, string, string][] = [
  ['thermal', 'F0 热成像', '第 7 轮旧默认：每块肌肉径向渐变 + 扩散 + 荧光渐变映射'],
  ['metal', 'F1 金属渐变', '参考 AE 演示：Gradient Ramp → Turbulent Displace + 模糊 → Colorama → 下缘白热亮边 + 外发光 + 颗粒；静态，配 S9 熔流就会流动'],
  ['topo', 'F2 等高线', '热度量化成几档，只画档与档之间的细线，档内很淡'],
  ['halftone', 'F3 半调点阵', '网格点，热度越高点越大'],
  ['liquid', 'F4 液位', '近 7 天组数 ÷ 最大可恢复量 = 液面高度，液面一道亮线'],
];
const SCAN: [ScanFxKind, string, string][] = [
  ['band', 'S0 扫描光带', '第 7 轮旧默认：一条扫描光带周期从脚扫到头'],
  ['raster', 'S1 逐行显影', '暗栅从脚到头一行行打开，露出热力，再一行行合上'],
  ['slice', 'S2 切片扫描', '亮线一行行跳上去，留余辉'],
  ['wave', 'S3 呼吸波', '一道亮度波逐行往上传'],
  ['iso', 'S4 等温分层', '最热的肌肉先亮，一层层亮到最凉的'],
  ['pump', 'S5 泵感', '练过的肌肉像充血一样「咚-咚」双拍胀亮，越热越亮；节拍是慢牛的静息心率'],
  ['steam', 'S6 蒸腾', '练过的肌肉往上冒热气：细小光点上升、散开、消失，越热冒得越多'],
  ['fiber', 'S7 牛劲', '沿肌肉轮廓跑一段段流光，像力量顺着肌纤维传过去，越热越亮越快'],
  ['beam', 'S8 奥赛台顶光', '呼应记录页钢板的丁达尔光束：一盏顶光跟着光束左右摆，在每块肌肉上打出高光和下沿阴影，强化形体；光里有浮尘'],
  ['molten', 'S9 熔流', '只有「流」这一层：亮带一直往上流，穿过湍流扭曲场被搅成流纹；叠在任何 F 上，配 F1 金属渐变就是流动的熔融金属'],
];
/** 浅色人体 L 组（2026-10-10 全局浅色，用户：在 F1 金属渐变 + S9 熔流的基础上做 4 个浅色方案）：每格是固定浅色的真实容量页（人体 + 胶囊 + 图例）。
 *  2026-10-10 用户选定 L2 的配色，其余三个落选、留作存档；L2 再出 4 个变体（LIGHT_V） */
const LIGHT: [LightLookKind, string, string][] = [
  ['L1', 'L1 深绿热', '纸白 → 浅荧光 → 深绿 → 荧光墨，越深越热（和「荧光字用深一档绿」同一个逻辑）；深绿流纹、深绿柔光描边'],
  ['L2', 'L2 荧光热 · 配色选定', '纸白 → 浅荧光 → 荧光，越饱和越热，最热仍是荧光；墨色柔光描边给形体，流纹是中绿'],
  ['L3', 'L3 银金属', '冷段是银灰金属（纸灰 → 中灰），热段转荧光 → 深绿；上沿高光和下缘墨色细边最强，金属感最重'],
  ['L4', 'L4 墨印', '纸白 → 灰 → 墨，热段混一点深绿，像版画：平涂不反光、墨线更实、颗粒更重；墨色流纹，最克制'],
];
/** L2 的四个变体（2026-10-10 用户：配色选 L2，效果还不满意，再出四个；整体去深色——描边、胶囊边、引线都不用墨）：色带都是 L2 的荧光热，差在亮度 / 质感 / 描边 / 胶囊调 */
const LIGHT_V: [LightLookKind, string, string][] = [
  ['L2a', 'L2a 轻盈', '冷肌肉更白（纸白起步）、暗边几乎不压、外发光更足，整体最亮；中绿细线描边；胶囊是一圈淡荧光细边，引线中绿'],
  ['L2b', 'L2b 金属', '同一条荧光色带，上沿高光拉满、下缘压暗到银金属的强度，金属感最重；灰绿细线；胶囊是最淡的暖灰边'],
  ['L2c', 'L2c 形体靠影', '不画清晰的线，一圈宽而淡的深绿影托出肌肉分界，形体靠阴影；胶囊不描边、只有一点浮起来的影子'],
  ['L2d', 'L2d 磨砂', '纸白的细线 + 下沿一道很淡的绿影，像磨砂玻璃 / 压纹，完全没有深色线；胶囊是纸白细边 + 一点绿影'],
];
const LIGHT_ALL = [...LIGHT_V, ...LIGHT];
/** 浅色描边方案（2026-10-10 用户：浅色下人体描边不想用深色，给方案）。套在所选浅色人体上；「跟随变体」= 用各变体自己的默认描边 */
const LIGHT_CONTOUR: [LightContourKind | 'auto', string, string][] = [
  ['auto', '跟随方案', '各人体方案自己的默认描边（L2a 中绿、L2b 灰绿、L2c 柔影、L2d 磨砂白；L1–L4 是墨线 / 深绿线）'],
  ['ink', 'C0 墨线 · 旧', '现在的做法：墨色细线 45%（对照用，就是用户说「不想用深色」的那种）'],
  ['green', 'C1 中绿线', '深绿掺荧光的中绿细线 70%：荧光家族里的线，不是墨；压在荧光肌肉上是橄榄绿'],
  ['sage', 'C2 灰绿线', '纸的暖灰掺一点深绿 60%：淡、有点烟熏，比墨轻得多；冷肌肉上也不跳'],
  ['frost', 'C3 磨砂白线', '纸白细线 + 下沿一道很淡的绿影，像磨砂玻璃 / 压纹；完全没有深色，白线靠影子托出来'],
  ['shade', 'C4 柔影', '没有清晰的线，只有一圈宽而淡的深绿影；形体靠阴影不靠线'],
  ['none', 'C5 无描边', '什么线都不画，只剩填充自己的唇边 / 内缘；看没有描边时人体还立不立得住'],
];
/** 人体格子：只有默认三层（O2 + F1 + S9）有浅色版，换了任何一层就是深色存档（格子固定深色） */
const archived = (o: ContourFxKind, f: FillFxKind, sc: ScanFxKind) => o !== DEFAULT_LOOK.contour || f !== DEFAULT_LOOK.fill || sc !== DEFAULT_LOOK.scan;

/** 主题色流体粒子（2026-10-08 走查 1 #10 #18）：P0 = 现在的荧光弥散色块 + 配重片同心纹（对照），P1–P3 待选 */
const PARTICLE: [ParticleKind | 'now', string, string][] = [
  ['now', 'P0 现在', '主角卡右上角一团荧光弥散 + 颗粒；页头右上角静态的配重片同心纹'],
  ['dust', 'P1 漂浮光尘', '光源角附近一团细小光点慢慢往上飘、明灭，离光源越近越亮越密；底下一层很淡的底光'],
  ['flow', 'P2 流场丝带', '粒子顺着缓慢变化的流场走、留下拖尾，汇成丝缎一样的流纹，颜色从荧光渐变到暗绿'],
  ['orbit', 'P3 环轨粒子 · 增量页头选定', '粒子沿一圈圈同心轨道转（内圈快、外圈慢）；2026-10-09 增量页头选它，并加「向内收缩到右上角光点」、再加一层模糊'],
];
/** 主角卡的颗粒渐变（2026-10-09 用户：P0 的形是对的，但清晰度太低、没有噪点粒子渐变的动态 → 再出几个）。
 *  2026-10-09 用户看完：「H2 和 H1 看起来一样，噪点变换太快；固定噪点，加一层模糊，动效改成脉搏式泵动，就这样定了」→ H4 定为默认（`Card hero`），H0–H3 留作过程 */
const GRAIN: [GrainKind | 'now', string, string][] = [
  ['now', 'H0 旧默认', 'CSS 径向渐变 + 一张放大的颗粒贴图（贴图被拉大，所以糊、而且不动）'],
  ['grain', 'H1 高清动态颗粒', '同一个形，按设备像素画；每个像素的亮度随机抖（胶片颗粒），约 12 帧刷新，颗粒只在光里'],
  ['drift', 'H2 颗粒流光', 'H1 的颗粒 + 光团中心沿小椭圆慢慢漂、半径慢慢呼吸——光是活的'],
  ['dither', 'H3 点阵渐变', '光由一颗颗 1 像素的亮点组成（越亮越密），点慢慢闪烁换位；最「粒子」，最硬朗'],
  ['pulse', 'H4 固定颗粒 · 脉搏泵动 · 选定', '颗粒固定不动，外面压一层很薄的模糊；光团按心跳泵——一大一小两下（扩张快、回落慢）再歇一拍。训练中更慢、更淡'],
];
function GrainDemo({ kind }: { kind: GrainKind | 'now' }) {
  const body = <><span className="milo-text-caption">第 1 个 · 下肢</span><span className="milo-text-heading">杠铃深蹲</span><Num size="hero" value="85" unit="kg" /><span className="milo-text-caption">上次 8/8/8 全部顶到 8 次上限 → +5 kg</span></>;
  if (kind === 'pulse') return <div className={s.pDemo}><Card hero>{body}</Card></div>;
  return <div className={s.pDemo}>{kind === 'now' ? <div className={`${s.pCard} ${s.h0}`}>{body}</div> : <div className={`${s.pCard} ${s.gCard}`}><GrainGlow kind={kind} />{body}</div>}</div>;
}

/** 方案台里的两处落点：页头右上角（原同心纹）+ 主角卡（原荧光色块） */
function ParticleDemo({ kind }: { kind: ParticleKind | 'now' }) {
  return (
    <div className={s.pDemo}>
      <div className={s.pHead}>
        {kind === 'now' ? <i className={s.pRing} aria-hidden="true" /> : <ParticleField kind={kind} spread={0.75} />}
        <h3 className="milo-text-title-l">增量</h3><span className="milo-text-caption">近 4 周练了 15 个动作</span>
      </div>
      {kind === 'now'
        ? <div className={`${s.pCard} ${s.h0}`}><span className="milo-text-caption">第 1 个 · 下肢</span><span className="milo-text-heading">杠铃深蹲</span><Num size="hero" value="85" unit="kg" /></div>
        : <div className={s.pCard}><ParticleField kind={kind} spread={0.8} /><span className="milo-text-caption">第 1 个 · 下肢</span><span className="milo-text-heading">杠铃深蹲</span><Num size="hero" value="85" unit="kg" /></div>}
    </div>
  );
}

/** 钢板（2026-10-08 走查 1 #09 #14）：S0 = 现在；S1 / S2 主题黑钢板 + 白色手绘休息圈（可选中）+ 看得见的光源。每格是一块能滚的小屏：滚一滚看光怎么变 */
const PLATE: [PlateLook, string, string][] = [
  ['steel', 'S0 现在', '中性冷灰钢板；光源只是算光束用的一个点，画面上看不见；休息日是很淡的样冲点'],
  ['lamp', 'S1 屏幕左上一盏灯 · 选定', '2026-10-09 选定：灯固定在屏幕左上（不跟内容滚）；板往上滚、中线接近灯时慢慢关灯，孔和光束一起暗下去；休息日白圈压暗'],
  ['center', 'S2 板后正中一盏灯', '主题黑钢板；光源在板后正中、跟着板走，光晕从板四周漏出来，光束从中心往外放射，滚动时不再变角度'],
];
function PlateDemo({ look, now }: { look: PlateLook; now: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const d = useMemo(() => logData('plain-prescription', now), [now]);
  const months = useMemo(() => dotMonths(d.trained, now, 3), [d, now]);
  const [sel, setSel] = useState<number | null>(null);
  // frame = 这块小屏本身（不滚）：灯挂在它上面；里面的 plDemo 才滚
  return (
    <div ref={frame} className={s.plStage}><div className={s.plDemo}>
      <h3 className="milo-text-title-l">记录</h3>
      <span className="milo-text-caption">近 3 个月练了 {d.trained.size} 天 · 往下滚看光怎么变{look !== 'steel' ? ' · 点一个白圈 = 休息日也能选' : ''}</span>
      <SteelPlate look={look} frame={frame} months={months} selected={sel} onSelect={setSel} />
      <div className={s.plFill} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
    </div></div>
  );
}

/** 增量页配色（走查 1 #28）：同一份数据、真实的增量页，只换列表行的配色 */
const GAINLOOK: [GainLookKind, string, string][] = [
  ['now', 'J0 现在', '每行一个骨白实心 PR 标、骨白曲线和末点；上涨也是骨白——一屏全是白块'],
  ['accent', 'J1 点缀替代白块', 'PR 改成荧光细线小标；曲线压灰、末点荧光；上涨箭头和数荧光'],
  ['curve', 'J2 PR 进曲线', '名字旁不挂标：PR 那几次在小曲线上是荧光点；末点荧光；上涨荧光'],
  ['star', 'J3 一颗星 + 暗荧光曲线', 'PR 是名字前一颗荧光小星；整条小曲线用暗荧光、面积暗绿；上涨荧光'],
];
/** 商城状态标（走查 1 #08）：同 5 件商品（折扣 · 热销 · 新品 · 缺货 · 普通） */
const SHOPLOOK: [ShopTagLookKind, string, string][] = [
  ['now', 'T0 现在', '热销 / 折扣 / 新品 一样的骨白实心小块，一眼分不出；缺货是虚线框'],
  ['shape', 'T1 各有各的形', '折扣 = 荧光价签「−18%」（带打孔的形）；热销 = 骨白描边 + 上升箭头；新品 = 荧光描边 + 小星；缺货 = 图底一条「缺货 · 可提醒」'],
  ['ribbon', 'T2 角带', '图片左上角一条斜角带：折扣荧光写折扣率、热销骨白、新品深底荧光字；缺货一条横带贯穿图片'],
  ['price', 'T3 放进价格区', '图上不挂标：折扣在价格后跟荧光「−18%」；热销 / 新品写在商家前面（荧光小字 + 图形）；缺货把价格换成「缺货 · 到货提醒」'],
];

/** 浅色底色 B（2026-10-10 荧光治理第 1 期，docs/light-fluo-plan.md）：浅色里荧光明度（0.76–0.86）不比卡片（0.965）、页面底（0.871）高，视觉重点塌了。
 *  这里只在浅色单格里覆盖语义色（不改全局 Token），并排看「把底降一档 / 荧光加阴影」哪个能让荧光重新成为最亮的东西；选定后再改 tokens.json 的 light 值。
 *  rim = 荧光面加一圈深绿细边 + 下沿一道深一档的绿（OptionsBoard.module.css 的 [data-fluo='rim']，作用在主按钮、焦点胶囊、该加重条）。 */
const BASE: [string, string, string, Record<string, string>, boolean][] = [
  ['B0', 'B0 原来', '页面底 paper-0、卡 paper-50、荧光面 lime-550——荧光治理之前的浅色（用覆盖值还原，对照用）', { '--milo-color-bg-base': 'var(--milo-prim-paper-0)', '--milo-color-bg-raised-2': 'var(--milo-prim-paper-100)', '--milo-color-accent-default': 'var(--milo-prim-lime-550)' }, false],
  ['B1', 'B1 底降一档', '页面底 paper-100，卡仍是纸白（浮起来），荧光面换成深色用的更亮的 lime-500', { '--milo-color-bg-base': 'var(--milo-prim-paper-100)', '--milo-color-bg-raised-2': 'var(--milo-prim-paper-200)', '--milo-color-accent-default': 'var(--milo-prim-lime-500)' }, false],
  ['B2', 'B2 底降两档', '页面底 paper-200，对比最足，但整体偏暗，和「深色太多」冲突——极限对照', { '--milo-color-bg-base': 'var(--milo-prim-paper-200)', '--milo-color-bg-raised-2': 'var(--milo-prim-paper-100)', '--milo-color-accent-default': 'var(--milo-prim-lime-500)' }, false],
  ['B3', 'B3 底不动 · 荧光加阴影', '页面底不变；荧光面换 lime-500，外加真实阴影（下沿一道深绿的厚度 + 带绿的投影），荧光有了「容器」，不描边', { '--milo-color-accent-default': 'var(--milo-prim-lime-500)' }, true],
  ['B4', 'B4 底降一档 + 加框', 'B1 的底 + B3 的阴影——**按「照你的想法推进」定为默认，已并入全局浅色**（tokens.json 的 bg/base、bg/raised-2、accent/default 的 light 值 + 荧光面加阴影）', { '--milo-color-bg-base': 'var(--milo-prim-paper-100)', '--milo-color-bg-raised-2': 'var(--milo-prim-paper-200)', '--milo-color-accent-default': 'var(--milo-prim-lime-500)' }, true],
];
function BaseBoard({ now }: { now: number }) {
  const [page, setPage] = useState<'home' | 'body' | 'gains'>('home');
  const pages: [typeof page, string][] = [['home', '首页'], ['body', '容量'], ['gains', '增量']];
  const node = page === 'home' ? <HomePage scenario="plain-prescription" now={now} /> : page === 'body' ? <BodyPage scenario="plain-prescription" now={now} initialFocus={null} /> : <GainsPage scenario="plain-prescription" now={now} />;
  return (
    <section className={s.group} aria-label="浅色底色" id="light-base">
      <h2 className="milo-text-heading">浅色底色 · B（2026-10-10 荧光治理第 1 期，已选 B4）</h2>
      <p className="milo-text-caption">用户：浅色背景太白，荧光不再是页面最亮的元素。实测：荧光明度 0.76–0.86，低于卡片 0.965、和页面底 0.871 相当，对比度只有 1.0–1.25。这里并排看「把底降一档」「荧光加阴影」哪个能让荧光重新跳出来；每格固定浅色、是真实页面，切下面的页面看三屏。评判：荧光面比相邻底醒目，整页不变灰变脏。</p>
      <div className={s.chips} role="group" aria-label="页面">{pages.map(([k, t]) => <Chip key={k} selected={page === k} onClick={() => setPage(k)}>{t}</Chip>)}</div>
      <div className={s.pairs}>{[BASE.slice(0, 2), BASE.slice(2, 4), BASE.slice(4)].map((pair) => (
        <div key={pair[0][0]} className={`${s.phones} ${s.phonesWide}`}>{pair.map(([k, t, n, vars, rim]) => (
          <figure key={k} className={s.cell} data-option={`base-${k}-${page}`}>
            <div className={s.phone} data-theme="light" data-fluo={rim ? 'rim' : 'off'} style={vars as CSSProperties}><Stage tall label={`${pages.find(([p]) => p === page)![1]} · ${t}`}>{node}</Stage></div>
            <figcaption><b className="milo-text-body-strong">{t}</b><span className="milo-text-caption">{n}</span></figcaption>
          </figure>
        ))}</div>
      ))}</div>
    </section>
  );
}

/** 浅色选中态 S（2026-10-10 荧光治理第 4 期）：Segmented / Chip / 开关 / 导航滑块 / 增量汇总条的「涨」段原来是大块墨黑，浅色里整页的深色主要来自它们。
 *  S0 = 原来（黑）；S3 = 白浮起（Segmented）+ 淡荧光 + 深绿细边（Chip、涨段、开关）+ 浅凹槽（导航滑块）。「全局荧光面每屏一处」所以没有把选中态做成荧光面（那个方案 S2 违反规则，没做）；
 *  整个 App 深色里的骨白选中态不变。S3 已并入全局浅色；S0 用 [data-sel='old'] 覆盖还原。 */
const SEL: [string, string, string][] = [
  ['S0', 'S0 原来', '选中 = 墨黑实心（Segmented、Chip、导航滑块、「涨」段、开关）——整页深色的主要来源'],
  ['S3', 'S3 白浮起 + 淡荧光 · 默认', 'Segmented 选中 = 白色浮起（阴影）；Chip / 涨段 = 淡荧光底 + 带绿阴影；开关 = 荧光；导航滑块 = 浅凹槽（内阴影）'],
];
function SelBoard({ now }: { now: number }) {
  const [page, setPage] = useState<'body' | 'gains' | 'home'>('body');
  const pages: [typeof page, string][] = [['body', '容量'], ['gains', '增量'], ['home', '首页']];
  const node = page === 'home' ? <HomePage scenario="plain-prescription" now={now} /> : page === 'body' ? <BodyPage scenario="plain-prescription" now={now} initialFocus={null} /> : <GainsPage scenario="plain-prescription" now={now} />;
  return (
    <section className={s.group} aria-label="浅色选中态" id="light-sel">
      <h2 className="milo-text-heading">浅色选中态 · S（2026-10-10 荧光治理第 4 期，已选 S3）</h2>
      <p className="milo-text-caption">用户：整体深色太多。浅色里大块墨黑主要是选中态。S3 并入全局浅色；S0 留作对照。每格固定浅色、是真实页面。</p>
      <div className={s.chips} role="group" aria-label="页面">{pages.map(([k, t]) => <Chip key={k} selected={page === k} onClick={() => setPage(k)}>{t}</Chip>)}</div>
      <div className={`${s.phones} ${s.phonesWide}`}>{SEL.map(([k, t, n]) => (
        <figure key={k} className={s.cell} data-option={`sel-${k}-${page}`}>
          <div className={s.phone} data-theme="light" data-sel={k === 'S0' ? 'old' : undefined}><Stage tall label={`${pages.find(([p]) => p === page)![1]} · ${t}`}>{node}</Stage></div>
          <figcaption><b className="milo-text-body-strong">{t}</b><span className="milo-text-caption">{n}</span></figcaption>
        </figure>
      ))}</div>
    </section>
  );
}

function Figure({ now, children, spread }: { now: number; children?: (fig: ReactNode) => ReactNode;
  /** 全热度对照（L 组）：演示数据只到中等热度，这里把肌肉按顺序从未练排到超量（热度 0 → 1 均匀铺开），一眼看全整条色带 */ spread?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => {
    const st = bodyData('plain-prescription', now).stats;
    if (!spread) return st;
    // 热度均匀铺开：第 i 块肌肉的目标热度 = i / (n − 1)，按 thermal.heatOf 的三条地标反推组数
    const hs = [...st.values()], n = hs.length;
    const setsFor = (t: number, h: HeadStat) => t < 0.12 ? 0 : t <= 0.4 ? ((t - 0.12) / 0.28) * h.mev : t <= 0.7 ? h.mev + ((t - 0.4) / 0.3) * (h.mav - h.mev)
      : t <= 0.88 ? h.mav + ((t - 0.7) / 0.18) * (h.mrv - h.mav) : h.mrv * (1 + ((t - 0.88) / 0.12) * 0.5);
    return new Map(hs.map((h, i) => [h.id, { ...h, sets7d: setsFor(i / (n - 1), h) }]));
  }, [now, spread]);
  const fig = <div ref={ref} className={s.fig}><BodyFigure gender="male" view="front" stats={stats} focus={null} height={400} onAnchors={noop} relativeTo={ref} /></div>;
  return <>{children ? children(fig) : fig}</>;
}

function Cell({ id, title, note, children, dark, light }: { id: string; title: string; note: string; children: ReactNode;
  /** 深色存档：格子固定深色（浅色主题下也是）；light：固定浅色（L 组） */ dark?: boolean; light?: boolean }) {
  return (
    <figure className={s.cell} data-option={id}>
      <div className={s.stage} data-theme={dark ? 'dark' : light ? 'light' : undefined}>{children}</div>
      <figcaption><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{note}</span></figcaption>
    </figure>
  );
}

/** 自由组合：三组各挑一个，套在真实的容量页上 */
function Composer({ now }: { now: number }) {
  const [q, setQ] = useSearchParams();
  // 地址里没写的那组 = 默认（DEFAULT_LOOK）；点回默认就从地址里删掉
  const pickOf = <K extends string>(key: string, list: readonly (readonly [K, string, string])[], def: K) => {
    const v = q.get(key) ?? def; return list.find(([k]) => k === v) ?? list.find(([k]) => k === def)!;
  };
  const set = (key: string, v: string, def: string) => { const n = new URLSearchParams(q); if (v === def) n.delete(key); else n.set(key, v); setQ(n, { replace: true }); };
  const o = pickOf('o', CONTOUR, DEFAULT_LOOK.contour), f = pickOf('f', FILL, DEFAULT_LOOK.fill), sc = pickOf('s', SCAN, DEFAULT_LOOK.scan), l = pickOf('l', LIGHT_ALL, DEFAULT_LIGHT_LOOK), c = pickOf('c', LIGHT_CONTOUR, 'auto');
  const dark = archived(o[0], f[0], sc[0]), theme = useTheme();
  const row = <K extends string>(key: string, label: string, list: readonly (readonly [K, string, string])[], cur: readonly [K, string, string], def: K) => (
    <div className={s.ctlRow} role="group" aria-label={label}>
      <span className="milo-text-label">{label}</span>
      <div className={s.chips}>{list.map(([k, t]) => <Chip key={t} selected={cur[1] === t} onClick={() => set(key, k, def)}>{k === def ? `${t} · 默认` : t}</Chip>)}</div>
      <span className={`milo-text-caption ${s.ctlNote}`}>{cur[2]}</span>
    </div>
  );
  return (
    <section className={s.composer} aria-label="自由组合">
      <div className={s.ctl}>
        <h2 className="milo-text-heading">自由组合</h2>
        <p className="milo-text-caption">三组各挑一个（浅色主题下再加浅色人体、浅色描边），右边是真实的容量页（胶囊可按、正反男女可切）。标「默认」的是线上容量页现在用的（O2 + F1 + S9）；组合写在地址栏里，复制链接就能分享。</p>
        {row('o', '描边', CONTOUR, o, DEFAULT_LOOK.contour)}
        {row('f', '肌头内部容量', FILL, f, DEFAULT_LOOK.fill)}
        {row('s', 'S 层动效', SCAN, sc, DEFAULT_LOOK.scan)}
        {row('l', '浅色人体', LIGHT_ALL, l, DEFAULT_LIGHT_LOOK)}
        {row('c', '浅色描边', LIGHT_CONTOUR, c, 'auto')}
        <p className={`milo-text-caption ${s.ctlNote}`}>{dark ? '换了描边 / 填充 / S 层就是深色方案（只有 O2 + F1 + S9 有浅色版），右边固定深色。' : theme === 'light' ? '现在是浅色主题：右边按所选浅色方案画。' : '浅色人体在浅色主题下生效：地址加 ?theme=light，或在「我的 → 外观」切浅色。'}</p>
      </div>
      <ContourFx.Provider value={o[0]}><FillFx.Provider value={f[0]}><ScanFx.Provider value={sc[0]}><LightLook.Provider value={l[0]}><LightContour.Provider value={c[0] === 'auto' ? null : c[0]}>
        <div className={s.phone} data-theme={dark ? 'dark' : undefined}><Stage tall label="容量页 · 组合预览"><BodyPage key={`${o[1]}${f[1]}${sc[1]}${l[1]}${c[1]}`} scenario="plain-prescription" now={now} initialFocus={null} /></Stage></div>
      </LightContour.Provider></LightLook.Provider></ScanFx.Provider></FillFx.Provider></ContourFx.Provider>
    </section>
  );
}

export function OptionsBoard({ now }: { now: number }) {
  return (
    <div className={s.page}>
      <header className={s.head}>
        <h1 className="milo-text-title-l">方案台</h1>
        <p className="milo-text-caption">同一个人、同一份演示数据，待选方案并排实时渲染。选定后定为默认，旧默认和落选的留在这里；规范在 /spec，组件在 /playground。</p>
      </header>
      <Composer now={now} />
      <BaseBoard now={now} />
      <SelBoard now={now} />
      <section className={s.group} aria-label="L2 变体" id="light-v">
        <h2 className="milo-text-heading">浅色人体 · L2 变体（2026-10-10，待选）</h2>
        <p className="milo-text-caption">用户：配色选 L2，但效果还不满意、整体深色太多（人体描边、胶囊描边、量尺刻度、引导线）。四个变体色带都是 L2 的荧光热，差在亮度、金属质感、描边和胶囊 / 引线的调子——<b>浅色里描边、胶囊边、引线都不再用墨</b>。每格固定浅色，是真实的容量页：可以按住胶囊看引线。四个都不合适就用最上面的「自由组合」混：浅色人体 × 浅色描边。</p>
        <div className={s.pairs}>{[LIGHT_V.slice(0, 2), LIGHT_V.slice(2)].map((pair) => (
          <div key={pair[0][0]} className={`${s.phones} ${s.phonesWide}`}>{pair.map(([k, t, n]) => (
            <figure key={k} className={s.cell} data-option={`light-${k}`}>
              <LightLook.Provider value={k}><div className={s.phone} data-theme="light"><Stage tall label={`容量页 · ${t}`}><BodyPage scenario="plain-prescription" now={now} initialFocus={null} /></Stage></div></LightLook.Provider>
              <figcaption><b className="milo-text-body-strong">{k === DEFAULT_LIGHT_LOOK ? `${t} · 默认` : t}</b><span className="milo-text-caption">{n}</span></figcaption>
            </figure>
          ))}</div>
        ))}</div>
        <p className="milo-text-caption">全热度对照：同一个人体把肌肉从未练排到超量，看整条色带。</p>
        <div className={s.grid}>{LIGHT_V.map(([k, t]) => <Cell key={k} id={`light-spread-${k}`} title={`${t} · 全热度`} note="肌肉按顺序从未练排到 1.5 × 最大可恢复量，热度均匀铺开" light><LightLook.Provider value={k}><Figure now={now} spread /></LightLook.Provider></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="浅色描边" id="light-contour">
        <h2 className="milo-text-heading">浅色人体描边 · C（2026-10-10，待选）</h2>
        <p className="milo-text-caption">用户：浅色下人体描边不想用深色。同一个人体（L2 配色），只换描边——C0 是现在的墨线，对照用；C1–C5 都不是深色。选定后可以套在任一变体上（自由组合「浅色描边」），或直接并进某个变体的默认。</p>
        <div className={s.grid}>{LIGHT_CONTOUR.filter(([k]) => k !== 'auto').map(([k, t, n]) => <Cell key={k} id={`light-contour-${k}`} title={t} note={n} light><LightLook.Provider value="L2"><LightContour.Provider value={k as LightContourKind}><Figure now={now} /></LightContour.Provider></LightLook.Provider></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="浅色人体" id="light-body">
        <h2 className="milo-text-heading">浅色人体 · L（2026-10-10 全局浅色，已选 L2 配色）</h2>
        <p className="milo-text-caption">纸白底上的容量页：在选定的 O2 柔光 + F1 金属渐变 + S9 熔流上做浅色版——色带「冷 = 纸白、热 = 深色」，唇边和内缘从提亮改成压暗，熔流和柔光描边从 screen 改 multiply；胶囊量尺和图例跟着换色带。每格固定浅色（不跟页面主题）。2026-10-10 用户选定 L2 的配色（变体见上），L1 / L3 / L4 落选，留在这里。</p>
        <div className={s.pairs}>{[LIGHT.slice(0, 2), LIGHT.slice(2)].map((pair) => (
          <div key={pair[0][0]} className={`${s.phones} ${s.phonesWide}`}>{pair.map(([k, t, n]) => (
            <figure key={k} className={s.cell} data-option={`light-${k}`}>
              <LightLook.Provider value={k}><div className={s.phone} data-theme="light"><Stage tall label={`容量页 · ${t}`}><BodyPage scenario="plain-prescription" now={now} initialFocus={null} /></Stage></div></LightLook.Provider>
              <figcaption><b className="milo-text-body-strong">{k === DEFAULT_LIGHT_LOOK ? `${t} · 默认` : t}</b><span className="milo-text-caption">{n}</span></figcaption>
            </figure>
          ))}</div>
        ))}</div>
        <p className="milo-text-caption">全热度对照：演示数据只练到中等热度，下面同一个人体把肌肉从未练排到超量，看整条色带——最热的不能和纸融在一起，冷的不能成黑块。</p>
        <div className={s.grid}>{LIGHT.map(([k, t]) => <Cell key={k} id={`light-spread-${k}`} title={`${t} · 全热度`} note="肌肉按顺序从未练排到 1.5 × 最大可恢复量，热度均匀铺开" light><LightLook.Provider value={k}><Figure now={now} spread /></LightLook.Provider></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="主题色流体粒子" id="particles">
        <h2 className="milo-text-heading">主题色流体粒子 · P（走查 1，待选）</h2>
        <p className="milo-text-caption">替换两处：主角卡右上角的荧光色块、页头右上角的配重片同心纹（增量、曲线、成长卡、牛龄、知识卡、开通成功共 6 处）。选定后全局换，P0 留作对照。</p>
        <div className={s.grid}>{PARTICLE.map(([k, t, n]) => <Cell key={t} id={`particle-${k}`} title={t} note={n}><ParticleDemo kind={k} /></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="主角卡颗粒渐变" id="grain">
        <h2 className="milo-text-heading">主角卡颗粒渐变 · H（2026-10-09，已选 H4）</h2>
        <p className="milo-text-caption">用户：主角卡 P0 的形是对的，但清晰度太低、没有噪点粒子渐变的动态。都保留 P0 的形，只换颗粒的做法。看完 H1–H3：「H2 和 H1 看起来一样，噪点变换太快」→ 固定颗粒、加一层模糊、改成脉搏式泵动（H4），定为主角卡默认。</p>
        <div className={s.grid}>{GRAIN.map(([k, t, n]) => <Cell key={t} id={`grain-${k}`} title={t} note={n}><GrainDemo kind={k} /></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="钢板" id="plate">
        <h2 className="milo-text-heading">记录页钢板 · S（走查 1，待选）</h2>
        <p className="milo-text-caption">钢板改成主题黑、休息日改白色手绘圈（4 种笔触轮换、可以选中）；要选的是光源怎么「看得见」。S0 留作对照。</p>
        <div className={s.grid}>{PLATE.map(([k, t, n]) => <Cell key={t} id={`plate-${k}`} title={`${t} · 深色方案`} note={n} dark><PlateDemo look={k} now={now} /></Cell>)}</div>
        <p className="milo-text-caption">灯光只在深色下有，三格固定深色。浅色钢板（2026-10-10 全局浅色，用户：「钢板透光等特效，浅色模式下就可以省去」）不点灯：浅色拉丝铝板，孔里露出平涂荧光底板——看记录页或 /playground。</p>
      </section>
      <section className={s.group} aria-label="增量页配色" id="gainlook">
        <h2 className="milo-text-heading">增量页配色 · J（走查 1，待选）</h2>
        <p className="milo-text-caption">用户：白色占比过多、PR 标重复度太高、没有主题色点缀。荧光分两级：荧光面积（主按钮、「该加重」色带）每屏仍只一处，荧光点缀（PR、曲线末点、上涨）可以多处。选定后全局扫一遍白块多的页。</p>
        <div className={s.phones}>{GAINLOOK.map(([k, t, n]) => (
          <figure key={k} className={s.cell} data-option={`gain-${k}`}>
            <GainLook.Provider value={k}><div className={s.phone}><Stage tall label={`增量页 · ${t}`}><GainsPage scenario="plain-prescription" now={now} /></Stage></div></GainLook.Provider>
            <figcaption><b className="milo-text-body-strong">{t}</b><span className="milo-text-caption">{n}</span></figcaption>
          </figure>
        ))}</div>
      </section>
      <section className={s.group} aria-label="商城状态标" id="shoplook">
        <h2 className="milo-text-heading">商城状态标 · T（走查 1，待选）</h2>
        <div className={s.grid}>{SHOPLOOK.map(([k, t, n]) => (
          <Cell key={t} id={`shop-${k}`} title={t} note={n}>
            <ShopTagLook.Provider value={k}><div className={s.shopDemo}><ProductGrid>{PRODUCTS.filter((p) => p.status !== 'normal').map((p) => <ProductCard key={p.id} {...p} off={Math.round(p.member * 0.2)} onClick={noop} />)}</ProductGrid></div></ShopTagLook.Provider>
          </Cell>
        ))}</div>
      </section>
      <h2 className={`milo-text-heading ${s.sub}`}>逐组对照</h2>
      <p className="milo-text-caption">人体三组里，只有默认的 O2 / F1 / S9 有浅色版（浅色主题下按 L 组的方案画）；标「深色方案」的是深色存档，格子固定深色。</p>
      <section className={s.group} aria-label="描边">
        <h2 className="milo-text-heading">描边 · O</h2>
        <div className={s.grid}>{CONTOUR.map(([k, t, n]) => { const dk = archived(k, DEFAULT_LOOK.fill, DEFAULT_LOOK.scan); return <Cell key={t} id={`contour-${k}`} title={dk ? `${t} · 深色方案` : t} note={n} dark={dk}><ContourFx.Provider value={k}><Figure now={now} /></ContourFx.Provider></Cell>; })}</div>
      </section>
      <section className={s.group} aria-label="肌头内部容量">
        <h2 className="milo-text-heading">肌头内部容量 · F</h2>
        <div className={s.grid}>{FILL.map(([k, t, n]) => { const dk = archived(DEFAULT_LOOK.contour, k, DEFAULT_LOOK.scan); return <Cell key={t} id={`fill-${k}`} title={dk ? `${t} · 深色方案` : t} note={n} dark={dk}><FillFx.Provider value={k}><Figure now={now} /></FillFx.Provider></Cell>; })}</div>
        <p className="milo-text-caption">（每组只换这一层，另外两层都是默认。）</p>
      </section>
      <section className={s.group} aria-label="S 层动效">
        <h2 className="milo-text-heading">S 层动效 · S</h2>
        <div className={s.grid}>{SCAN.map(([k, t, n]) => { const dk = archived(DEFAULT_LOOK.contour, DEFAULT_LOOK.fill, k); return <Cell key={t} id={`scan-${k}`} title={dk ? `${t} · 深色方案` : t} note={n} dark={dk}><ScanFx.Provider value={k}><Figure now={now} /></ScanFx.Provider></Cell>; })}</div>
      </section>
      <section className={s.group} aria-label="导航图标">
        <h2 className="milo-text-heading">导航图标 · I（2026-10-04 选定倾斜断笔）</h2>
        <div className={s.iconGrid}>{ICON_STYLES.map(([k, title, note]) => (
          <figure key={k} className={s.cell} data-option={`icon-${k}`}>
            <IconStyleCtx.Provider value={k}><div className={s.icons}>{ICON_NAMES.map((n) => <Icon key={n} name={n} />)}</div></IconStyleCtx.Provider>
            <figcaption><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{note}</span></figcaption>
          </figure>
        ))}</div>
      </section>
    </div>
  );
}
