/** /preview 方案台（2026-10-06 用户：新建一个 /preview 专门用来测试方案）：同一个人、同一份演示数据，把待选的视觉方案并排放，
 *  每格一个真实渲染（不是截图），动效照常跑。选定的方案再定为默认、写进 DESIGN.md，这里留作对照。
 *  原来 /preview 上的基础规范页挪到了 /spec。
 *  当前三组（都是容量页的人体）：描边 O、肌头内部容量 F、S 层动效；2026-10-07 用户选定 O2 + F1 + S9 为默认（DEFAULT_LOOK），
 *  每组的 0 号是第 7 轮的旧默认，留着对照。方案台本身也是作品集要展示的过程（用户 2026-10-07），选定后不删。
 *  最上面是「自由组合」（2026-10-07 用户）：三组各挑一个，右边是真实的容量页（带胶囊、可以点、可以切正反男女）；
 *  组合写在地址里（?o=hair&f=metal&s=molten），复制链接就能把这个组合发给别人。 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { BodyFigure, Card, Chip, ContourFx, DEFAULT_LOOK, FillFx, Icon, Num, GainLook, ParticleField, ProductCard, ProductGrid, ScanFx, ShopTagLook, SteelPlate, dotMonths, type ContourFxKind, type GainLookKind, type ShopTagLookKind, type FillFxKind, type ParticleKind, type PlateLook, type ScanFxKind } from '../components';
import { IconStyleCtx, type IconStyle } from '../components/iconSets';
import { bodyData } from '../data/demo';
import { logData } from '../data/log';
import { PRODUCTS } from '../data/growth';
import { GainsPage } from './GainsPage';
import { BodyPage } from './BodyPage';
import { Stage } from '../playground/Stage';
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

/** 主题色流体粒子（2026-10-08 走查 1 #10 #18）：P0 = 现在的荧光弥散色块 + 配重片同心纹（对照），P1–P3 待选 */
const PARTICLE: [ParticleKind | 'now', string, string][] = [
  ['now', 'P0 现在', '主角卡右上角一团荧光弥散 + 颗粒；页头右上角静态的配重片同心纹'],
  ['dust', 'P1 漂浮光尘', '光源角附近一团细小光点慢慢往上飘、明灭，离光源越近越亮越密；底下一层很淡的底光'],
  ['flow', 'P2 流场丝带', '粒子顺着缓慢变化的流场走、留下拖尾，汇成丝缎一样的流纹，颜色从荧光渐变到暗绿'],
  ['orbit', 'P3 环轨粒子', '粒子沿一圈圈同心轨道转（内圈快、外圈慢）+ 很淡的轨道线：会动的配重片环'],
];
/** 方案台里的两处落点：页头右上角（原同心纹）+ 主角卡（原荧光色块） */
function ParticleDemo({ kind }: { kind: ParticleKind | 'now' }) {
  return (
    <div className={s.pDemo}>
      <div className={s.pHead}>
        {kind === 'now' ? <i className={s.pRing} aria-hidden="true" /> : <ParticleField kind={kind} spread={0.75} />}
        <h3 className="milo-text-title-l">增量</h3><span className="milo-text-caption">近 4 周练了 15 个动作</span>
      </div>
      {kind === 'now'
        ? <Card hero><span className="milo-text-caption">第 1 个 · 下肢</span><span className="milo-text-heading">杠铃深蹲</span><Num size="hero" value="85" unit="kg" /></Card>
        : <div className={s.pCard}><ParticleField kind={kind} spread={0.8} /><span className="milo-text-caption">第 1 个 · 下肢</span><span className="milo-text-heading">杠铃深蹲</span><Num size="hero" value="85" unit="kg" /></div>}
    </div>
  );
}

/** 钢板（2026-10-08 走查 1 #09 #14）：S0 = 现在；S1 / S2 主题黑钢板 + 白色手绘休息圈（可选中）+ 看得见的光源。每格是一块能滚的小屏：滚一滚看光怎么变 */
const PLATE: [PlateLook, string, string][] = [
  ['steel', 'S0 现在', '中性冷灰钢板；光源只是算光束用的一个点，画面上看不见；休息日是很淡的样冲点'],
  ['lamp', 'S1 屏幕左上一盏灯', '主题黑钢板；光源固定在屏幕左上（不跟板走），板后一团光晕从板边漏出来——滚动时光晕沿板边滑、光束跟着转角度，两者对得上'],
  ['center', 'S2 板后正中一盏灯', '主题黑钢板；光源在板后正中、跟着板走，光晕从板四周漏出来，光束从中心往外放射，滚动时不再变角度'],
];
function PlateDemo({ look, now }: { look: PlateLook; now: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const d = useMemo(() => logData('plain-prescription', now), [now]);
  const months = useMemo(() => dotMonths(d.trained, now, 3), [d, now]);
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div ref={frame} className={s.plDemo}>
      <h3 className="milo-text-title-l">记录</h3>
      <span className="milo-text-caption">近 3 个月练了 {d.trained.size} 天 · 往下滚看光怎么变{look !== 'steel' ? ' · 点一个白圈 = 休息日也能选' : ''}</span>
      <SteelPlate look={look} frame={frame} months={months} selected={sel} onSelect={setSel} />
      <div className={s.plFill} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
    </div>
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

function Figure({ now, children }: { now: number; children?: (fig: ReactNode) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const stats = useMemo(() => bodyData('plain-prescription', now).stats, [now]);
  const fig = <div ref={ref} className={s.fig}><BodyFigure gender="male" view="front" stats={stats} focus={null} height={400} onAnchors={noop} relativeTo={ref} /></div>;
  return <>{children ? children(fig) : fig}</>;
}

function Cell({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <figure className={s.cell} data-option={id}>
      <div className={s.stage}>{children}</div>
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
  const o = pickOf('o', CONTOUR, DEFAULT_LOOK.contour), f = pickOf('f', FILL, DEFAULT_LOOK.fill), sc = pickOf('s', SCAN, DEFAULT_LOOK.scan);
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
        <p className="milo-text-caption">三组各挑一个，右边是真实的容量页（胶囊可按、正反男女可切）。标「默认」的是线上容量页现在用的（O2 + F1 + S9）；组合写在地址栏里，复制链接就能分享。</p>
        {row('o', '描边', CONTOUR, o, DEFAULT_LOOK.contour)}
        {row('f', '肌头内部容量', FILL, f, DEFAULT_LOOK.fill)}
        {row('s', 'S 层动效', SCAN, sc, DEFAULT_LOOK.scan)}
      </div>
      <ContourFx.Provider value={o[0]}><FillFx.Provider value={f[0]}><ScanFx.Provider value={sc[0]}>
        <div className={s.phone}><Stage tall label="容量页 · 组合预览"><BodyPage key={`${o[1]}${f[1]}${sc[1]}`} scenario="plain-prescription" now={now} initialFocus={null} /></Stage></div>
      </ScanFx.Provider></FillFx.Provider></ContourFx.Provider>
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
      <section className={s.group} aria-label="主题色流体粒子" id="particles">
        <h2 className="milo-text-heading">主题色流体粒子 · P（走查 1，待选）</h2>
        <p className="milo-text-caption">替换两处：主角卡右上角的荧光色块、页头右上角的配重片同心纹（增量、曲线、成长卡、牛龄、知识卡、开通成功共 6 处）。选定后全局换，P0 留作对照。</p>
        <div className={s.grid}>{PARTICLE.map(([k, t, n]) => <Cell key={t} id={`particle-${k}`} title={t} note={n}><ParticleDemo kind={k} /></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="钢板" id="plate">
        <h2 className="milo-text-heading">记录页钢板 · S（走查 1，待选）</h2>
        <p className="milo-text-caption">钢板改成主题黑、休息日改白色手绘圈（4 种笔触轮换、可以选中）；要选的是光源怎么「看得见」。S0 留作对照。</p>
        <div className={s.grid}>{PLATE.map(([k, t, n]) => <Cell key={t} id={`plate-${k}`} title={t} note={n}><PlateDemo look={k} now={now} /></Cell>)}</div>
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
      <section className={s.group} aria-label="描边">
        <h2 className="milo-text-heading">描边 · O</h2>
        <div className={s.grid}>{CONTOUR.map(([k, t, n]) => <Cell key={t} id={`contour-${k}`} title={t} note={n}><ContourFx.Provider value={k}><Figure now={now} /></ContourFx.Provider></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="肌头内部容量">
        <h2 className="milo-text-heading">肌头内部容量 · F</h2>
        <div className={s.grid}>{FILL.map(([k, t, n]) => <Cell key={t} id={`fill-${k}`} title={t} note={n}><FillFx.Provider value={k}><Figure now={now} /></FillFx.Provider></Cell>)}</div>
        <p className="milo-text-caption">（每组只换这一层，另外两层都是默认。）</p>
      </section>
      <section className={s.group} aria-label="S 层动效">
        <h2 className="milo-text-heading">S 层动效 · S</h2>
        <div className={s.grid}>{SCAN.map(([k, t, n]) => <Cell key={t} id={`scan-${k}`} title={t} note={n}><ScanFx.Provider value={k}><Figure now={now} /></ScanFx.Provider></Cell>)}</div>
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
