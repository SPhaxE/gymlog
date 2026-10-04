/** /lab：参考图要素的可选预览（docs/refs-elements.md 的实物）。每块带编号，用户按编号挑「借鉴 / 不借鉴」。
 *  这里的东西都还没进规范；选定后再落 Token、写进 DESIGN.md、登记进 /playground。 */
import { useMemo, useState, type ReactNode } from 'react';
import { Icon, Nav, ScreenAtmosphere, type IconName, type Tab } from '../components';
import { IconStyleCtx, type IconStyle } from '../components/iconSets';
import { BodyRender, PALETTE, type Thermal } from '../components/thermal';
import { BodyPage } from '../pages/BodyPage';
import { HomePage } from '../pages/HomePage';
import { fixtures } from '../playground/fixtures';
import { Stage } from '../playground/Stage';
import { ATMOSPHERES, Atmosphere, grainTile, type AtmosphereKind } from './Atmosphere';
import { CompactNav, CursorChart, DotCalendar, GiantNumber, GlassCard, RingNumber, SquareButtons, WeekBars } from './elements';
import { ConicGlow, FluidMorph, PressOvershoot, RubberSheet, SharedElement, SpringScope, Stagger, TiltGlare } from './motions';
import s from './lab.module.css';

function Block({ id, title, src, note, children }: { id: string; title: string; src: string; note?: string; children: ReactNode }) {
  return (
    <figure className={s.block} id={id}>
      <figcaption><b className="milo-text-heading">{id} · {title}</b><span className="milo-text-caption">{src}</span>{note && <span className={`milo-text-caption ${s.note}`}>{note}</span>}</figcaption>
      {children}
    </figure>
  );
}

const THERMALS: [string, string, Thermal | null, string][] = [
  ['T0', '现行四档', null, '明暗 + 纹理四档（未练 / 不足 / 达标 / 超量）'],
  ['T1', '荧光热 · 辉光', { palette: 'lime', style: 'bloom' }, '暗 → 橄榄 → 黄绿 → 荧光 → 浅荧光；肌肉带一圈热扩散'],
  ['T2', '骨白热 · 辉光', { palette: 'bone', style: 'bloom' }, '暗 → 暗骨 → 骨白；只有超过上限的热点才变荧光'],
  ['T3', '荧光热 · 等温带', { palette: 'lime', style: 'iso' }, '更强的扩散后量化成 5 条等温带，像热像仪的伪彩'],
  ['T4', '骨白热 · 扫描线', { palette: 'bone', style: 'scan' }, '辉光 + 横向扫描线 + 颗粒，最像热像仪画面'],
];
const ICON_SETS: [IconStyle, string, string][] = [
  ['current', 'I0 现行', '通用实心图标'],
  ['geo', 'I1 实心几何', 'iconref1：只用三角、圆、方拼形'],
  ['cut', 'I2 断笔线性', 'iconref2：圆头描边、故意留缺口'],
  ['trace', 'I3 运动轨迹', 'iconmotionref1：描边从透明渐变到实色，选中时画出来'],
];
const ICON_NAMES: IconName[] = ['home', 'body', 'gains', 'log', 'me', 'check', 'timer', 'back', 'plus', 'star'];

export function Lab({ now }: { now: number }) {
  const f = useMemo(() => fixtures(now), [now]);
  const g = grainTile();
  return (
    <SpringScope>
      <div className={s.page}>
        <header className={s.hero}>
          <h1 className="milo-text-title-l">参考要素实验室</h1>
          <p className={`milo-text-body ${s.muted}`}>docs 里 5 张页面参考、2 张图标参考、1 张图标动效参考和 8motions.md 的要素，按 Milo 的 Token 做成可以上手的预览。
            每块有编号，对照 docs/refs-elements.md 的说明，告诉我哪些借鉴、哪些不要。这里的东西都还没进规范。</p>
        </header>

        <section className={s.section}>
          <h2 className="milo-text-title-m">A · 噪点渐变氛围</h2>
          <div className={s.row}>
            {ATMOSPHERES.map(([k, title, src]) => (
              <Block key={k} id={title.split(' ')[0]} title={title.split(' ').slice(1).join(' ')} src={src}>
                <div className={k === 'hero' ? s.heroMode : undefined} style={{ ['--grain' as string]: g ? `url(${g})` : 'none' }}>
                  <ScreenAtmosphere.Provider value={<Atmosphere kind={k as AtmosphereKind} />}>
                    <Stage tall label={title}><HomePage scenario="plain-prescription" now={now} /></Stage>
                  </ScreenAtmosphere.Provider>
                </div>
              </Block>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h2 className="milo-text-title-m">T · 热成像肌群容量</h2>
          <p className={`milo-text-caption ${s.muted}`}>热度 = 近 7 天组数对照三条地标：没练 → 最低有效量 → 适宜量 → 最大可恢复量 → 超量，明度单调上升（不靠色相也分得出冷热）。胶囊量尺同步用同一条色带。按住胶囊列仍可放大。
            演示用「恢复日」场景（容量分布最宽）；演示数据里没有超过上限的肌头，色带最热的一端见每张图下方的色条。</p>
          <div className={s.row}>
            {THERMALS.map(([id, title, th, note]) => (
              <Block key={id} id={id} title={title} src={note}>
                <BodyRender.Provider value={th}>
                  <Stage tall label={title}><BodyPage scenario="rest-day" now={now} initialFocus={null} /></Stage>
                </BodyRender.Provider>
                {th && <Ramp palette={th.palette} />}
              </Block>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h2 className="milo-text-title-m">I · 图标风格</h2>
          <div className={s.iconTable}>
            {ICON_SETS.map(([st, title, src]) => (
              <IconStyleCtx.Provider key={st} value={st}>
                <div className={s.iconRow} id={title.split(" ")[0]}>
                  <div className={s.iconHead}><b className="milo-text-body-strong">{title}</b><span className="milo-text-caption">{src}</span></div>
                  <div className={s.icons}>{ICON_NAMES.map((n) => <span key={n} className={s.iconCell}><Icon name={n} /><i>{n}</i></span>)}</div>
                  <div className={s.navBox}><NavPick /></div>
                </div>
              </IconStyleCtx.Provider>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h2 className="milo-text-title-m">R · 进度环轨迹（iconmotionref1）</h2>
          <div className={s.row}>
            <Block id="R0" title="现行实线" src="外圈实线，端点平"><div className={s.navBox}><Nav selected="home" progress={8 / 14} /></div></Block>
            <Block id="R1" title="轨迹尾渐隐" src="尾部从 opacity/trace-min 渐到实色，头部一个圆点：不用动画也有「在走」的感觉"><div className={s.navBox}><Nav selected="home" progress={8 / 14} trace /></div></Block>
            <Block id="R2" title="轨迹 + 休息" src="与休息虚线同时出现时"><div className={s.navBox}><Nav selected="home" progress={8 / 14} trace rest="1:35" restRatio={0.53} /></div></Block>
          </div>
        </section>

        <section className={s.section}>
          <h2 className="milo-text-title-m">E · 版式元素</h2>
          <div className={s.row}>
            <Block id="E1" title="点阵日历" src="ref1：每天一个点，练过的点亮——记录页顶部 / P1 出勤热力图"><div className={s.card}><DotCalendar f={f} /></div></Block>
            <Block id="E2" title="环中数字" src="ref1「1」「2」：第几个动作 + 组数进度"><div className={s.card}>
              <RingNumber n={2} p={1 / 3} title={f.items[1]?.name ?? '窄握下拉'} sub="第 1 / 3 组" /><RingNumber n={3} p={0} title={f.items[2]?.name ?? '杠铃硬拉'} sub="待做" /></div></Block>
            <Block id="E3" title="竖向胶囊量表" src="ref3 Active Cards：近 8 周每周完成组数"><div className={s.card}><WeekBars f={f} /></div></Block>
            <Block id="E4" title="超大渐变数字" src="ref5「60%」：结算页唯一一次「大声」，数字从骨白渐隐 + 颗粒"><div className={s.card}><GiantNumber value="+5" unit="kg" caption="杠铃深蹲 · 预估 1RM 新高" /></div></Block>
            <Block id="E5" title="游标气泡 + 渐变面积" src="ref2 / ref4 / ref5：圆滑曲线、竖向游标、面积渐隐（和 M04 合并）"><div className={s.card}><CursorChart f={f} /></div></Block>
            <Block id="E6" title="磨砂玻璃浮层" src="ref3：卡片浮在内容上，背后模糊"><div className={s.card}><GlassCard f={f} /></div></Block>
            <Block id="E7" title="只有选中项写名称" src="ref2 Cardy Pay 的导航：其余只留图标"><CompactNav /></Block>
            <Block id="E8" title="圆角方形图标按钮" src="ref4 / ref5 的返回、更多（对照右边现行圆形）"><div className={s.card}><SquareButtons /></div></Block>
          </div>
        </section>

        <section className={s.section}>
          <h2 className="milo-text-title-m">M · 动效（8motions.md，数值改用 Token 的弹簧）</h2>
          <div className={s.row}>
            <Block id="M01" title="3D 倾斜光影" src="按住主角卡移动手指：±5° 微倾 + 高光跟手，松手弹簧回正"><div className={s.card}><TiltGlare f={f} /></div></Block>
            <Block id="M02" title="流体胶囊形变" src="点「休息」小胶囊：原地长成休息面板"><FluidMorph /></Block>
            <Block id="M03" title="共享元素展开" src="点一个动作：行原地长成详情，返回缩回"><SharedElement f={f} /></Block>
            <Block id="M04" title="磁吸游标 + 滚动码表" src="在曲线上横向拖：吸到最近一次，数字按位翻滚"><div className={s.card}><CursorChart f={f} /></div></Block>
            <Block id="M05" title="阻尼底部面板" src="拖抓手：两档吸附、拉过头有阻尼、下甩关闭"><RubberSheet /></Block>
            <Block id="M06" title="弥散光晕边框" src="只给每屏唯一的行动焦点：细圆锥渐变描边慢转 + 呼吸光晕"><div className={s.card}><ConicGlow /></div></Block>
            <Block id="M07" title="弹簧交错流" src="列表按 motion/stagger 依次弹入"><div className={s.card}><Stagger f={f} /></div></Block>
            <Block id="M08" title="微缩 + 内阴影 + 过冲" src="按住再松手对比"><div className={s.card}><PressOvershoot /></div></Block>
          </div>
        </section>
      </div>
    </SpringScope>
  );
}

/** 色带：热度 0 → 1，下面标三条地标的位置 */
function Ramp({ palette }: { palette: 'lime' | 'bone' }) {
  const stops = PALETTE[palette].map((k, i, a) => `var(--milo-prim-${k}) ${(i / (a.length - 1)) * 100}%`).join(', ');
  return (
    <div className={s.ramp}>
      <i style={{ background: `linear-gradient(90deg, ${stops})` }} />
      <span className="milo-text-micro"><b>未练</b><b>最低</b><b>适宜</b><b>上限</b><b>超量</b></span>
    </div>
  );
}

/** 点导航切换：trace 风格的图标在选中时沿路径画出来 */
function NavPick() {
  const [tab, setTab] = useState<Tab>('home');
  return <Nav selected={tab} progress={8 / 14} onSelect={(x) => setTab(x)} />;
}
