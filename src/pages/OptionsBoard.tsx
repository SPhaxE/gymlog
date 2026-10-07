/** /preview 方案台（2026-10-06 用户：新建一个 /preview 专门用来测试方案）：同一个人、同一份演示数据，把待选的视觉方案并排放，
 *  每格一个真实渲染（不是截图），动效照常跑。选定的方案再定为默认、写进 DESIGN.md，这里留作对照。
 *  原来 /preview 上的基础规范页挪到了 /spec。
 *  当前三组（都是容量页的人体）：描边 O、肌头内部容量 F、热力图扫描线 S；每组第一格是现行做法。
 *  最上面是「自由组合」（2026-10-07 用户）：三组各挑一个，右边是真实的容量页（带胶囊、可以点、可以切正反男女）；
 *  组合写在地址里（?o=hair&f=metal&s=molten），复制链接就能把这个组合发给别人。 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { BodyFigure, Chip, ContourFx, FillFx, ScanFx, type ContourFxKind, type FillFxKind, type ScanFxKind } from '../components';
import { bodyData } from '../data/demo';
import { BodyPage } from './BodyPage';
import { Stage } from '../playground/Stage';
import s from './OptionsBoard.module.css';

const noop = () => {};
const CONTOUR: [ContourFxKind | null, string, string][] = [
  [null, 'O0 现行', '浅荧光实线，挂载时从下往上描出 + 细光沿轮廓游走'],
  ['hair', 'O1 发丝', '极细、很淡的静态线；没有描出和游光'],
  ['soft', 'O2 柔光', '不画清晰的线，只有轮廓位置一圈模糊的淡光'],
  ['dot', 'O3 点线', '细点虚线，淡'],
  ['rim', 'O4 只描外缘', '人体内部的肌肉分界线不画，只在剪影最外圈一道内缘光'],
];
const FILL: [FillFxKind | null, string, string][] = [
  [null, 'F0 现行', '热成像：每块肌肉径向渐变 + 扩散 + 荧光渐变映射'],
  ['metal', 'F1 金属渐变', '参考 AE 演示：Gradient Ramp → Turbulent Displace + 模糊 → Colorama → 下缘白热亮边 + 外发光 + 颗粒；静态，配 S9 熔流就会流动'],
  ['topo', 'F2 等高线', '热度量化成几档，只画档与档之间的细线，档内很淡'],
  ['halftone', 'F3 半调点阵', '网格点，热度越高点越大'],
  ['liquid', 'F4 液位', '近 7 天组数 ÷ 最大可恢复量 = 液面高度，液面一道亮线'],
];
const SCAN: [ScanFxKind, string, string][] = [
  ['raster', 'S1 逐行显影', '暗栅从脚到头一行行打开，露出热力，再一行行合上'],
  ['slice', 'S2 切片扫描', '亮线一行行跳上去，留余辉'],
  ['wave', 'S3 呼吸波', '一道亮度波逐行往上传'],
  ['iso', 'S4 等温分层', '最热的肌肉先亮，一层层亮到最凉的'],
  ['pump', 'S5 泵感', '练过的肌肉像充血一样「咚-咚」双拍胀亮，越热越亮；节拍是慢牛的静息心率'],
  ['steam', 'S6 蒸腾', '练过的肌肉往上冒热气：细小光点上升、散开、消失，越热冒得越多'],
  ['fiber', 'S7 牛劲', '沿肌肉轮廓跑一段段流光，像力量顺着肌纤维传过去，越热越亮越快'],
  ['beam', 'S8 丁达尔', '呼应记录页钢板：一束斜光慢慢扫过人体，光里有浮尘，照到的肌肉提亮'],
  ['molten', 'S9 熔流', '只有「流」这一层：亮带一直往上流，穿过湍流扭曲场被搅成流纹；叠在任何 F 上，配 F1 金属渐变就是流动的熔融金属（这一格叠的是 F1）'],
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
  const pickOf = <K extends string>(key: string, list: readonly (readonly [K | null, string, string])[]) => {
    const v = q.get(key); return list.find(([k]) => (k ?? 'now') === (v ?? 'now')) ?? list[0];
  };
  const set = (key: string, v: string | null) => { const n = new URLSearchParams(q); if (v == null || v === 'now') n.delete(key); else n.set(key, v); setQ(n, { replace: true }); };
  const scanList: (readonly [ScanFxKind | null, string, string])[] = [[null, 'S0 现行', '一条扫描光带周期从脚扫到头'], ...SCAN];
  const o = pickOf('o', CONTOUR), f = pickOf('f', FILL), sc = pickOf('s', scanList);
  const row = <K extends string>(key: string, label: string, list: readonly (readonly [K | null, string, string])[], cur: readonly [K | null, string, string]) => (
    <div className={s.ctlRow} role="group" aria-label={label}>
      <span className="milo-text-label">{label}</span>
      <div className={s.chips}>{list.map(([k, t]) => <Chip key={t} selected={cur[1] === t} onClick={() => set(key, k)}>{t}</Chip>)}</div>
      <span className={`milo-text-caption ${s.ctlNote}`}>{cur[2]}</span>
    </div>
  );
  return (
    <section className={s.composer} aria-label="自由组合">
      <div className={s.ctl}>
        <h2 className="milo-text-heading">自由组合</h2>
        <p className="milo-text-caption">三组各挑一个，右边是真实的容量页（胶囊可按、正反男女可切）。组合写在地址栏里，复制链接就能分享这个组合。</p>
        {row('o', '描边', CONTOUR, o)}
        {row('f', '肌头内部容量', FILL, f)}
        {row('s', '热力图扫描线', scanList, sc)}
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
        <p className="milo-text-caption">同一个人、同一份演示数据，待选方案并排实时渲染。选定后定为默认；基础规范在 /spec，组件在 /playground。</p>
      </header>
      <Composer now={now} />
      <h2 className={`milo-text-heading ${s.sub}`}>逐组对照</h2>
      <section className={s.group} aria-label="描边">
        <h2 className="milo-text-heading">描边 · O</h2>
        <div className={s.grid}>{CONTOUR.map(([k, t, n]) => <Cell key={t} id={`contour-${k ?? 'now'}`} title={t} note={n}><ContourFx.Provider value={k}><Figure now={now} /></ContourFx.Provider></Cell>)}</div>
      </section>
      <section className={s.group} aria-label="肌头内部容量">
        <h2 className="milo-text-heading">肌头内部容量 · F</h2>
        <div className={s.grid}>{FILL.map(([k, t, n]) => <Cell key={t} id={`fill-${k ?? 'now'}`} title={t} note={n}><FillFx.Provider value={k}><ContourFx.Provider value="hair"><Figure now={now} /></ContourFx.Provider></FillFx.Provider></Cell>)}</div>
        <p className="milo-text-caption">（这一组统一用 O1 发丝描边，只比较内部填充。）</p>
      </section>
      <section className={s.group} aria-label="热力图扫描线">
        <h2 className="milo-text-heading">热力图扫描线 · S</h2>
        <div className={s.grid}>{SCAN.map(([k, t, n]) => <Cell key={t} id={`scan-${k}`} title={t} note={n}><ScanFx.Provider value={k}><FillFx.Provider value={k === 'molten' ? 'metal' : null}><Figure now={now} /></FillFx.Provider></ScanFx.Provider></Cell>)}</div>
      </section>
    </div>
  );
}
