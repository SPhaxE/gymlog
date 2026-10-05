/** /brand：阶段 5.5b · IP 小牛与 Logo（2026-10-05）。
 *  IP：用户用 Nano Banana 按意向图 3_27AM 高清重制的 PNG（docs/A.jpg、B1–B5.jpg），scripts/mascot_png.py 切图、超分、抠图后进 public/mascot/；
 *  5 种牛龄 × 6 种状态。Logo 为 B 递增条牛头（3_44AM）。
 *  这一页只给用户评审用：同一组件在不同尺寸、状态下的样子，以及放进启动页和奖励弹窗的样子。 */
import { Fragment } from 'react';
import { AppIcon, Lockup, LogoGlyph, LOGO_STATE_NAME, type LogoState } from '../components/Logo';
import { MASCOT_MOODS, MASCOT_STAGES, Mascot, MascotHead, MOOD_NAME, STAGE_NAME, type MascotMood } from '../components/Mascot';
import s from './brand.module.css';

const STATES: LogoState[] = ['idle', 'loading', 'training', 'pr', 'rest', 'deload'];
const STATE_WHERE: Record<LogoState, string> = {
  idle: '启动页、关于、商店图标',
  loading: '启动加载、下拉刷新、处方重算时',
  training: '训练进行中的顶部、通知栏、桌面小组件',
  pr: '结算页破纪录时，配合奖励弹窗（条从两角往中间点亮，中间最长的条再接一节荧光 = 比纪录多一点）',
  rest: '恢复日的首页标题位',
  deload: '减量周的首页标题位（内侧条收回一半、虚影标出原长度：量减了，余量还在）',
};
const STAGE_RULE = {
  newborn: '荧光角芽 · 圆点单眼 · 矮胖大头',
  young: '小新月角 · 圆点单眼 · 腿变长',
  sturdy: '中新月角 · 坚定单眼 · 肩峰隆起',
  bull: '大新月角 · 浓眉单眼 · 巨大肩峰',
  milo: '最高等级：全身荧光 · 双眼发光 · 泛光与星光',
} as const;

function Section({ id, title, sub, children }: { id: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className={s.section} id={id}>
      <header className={s.secHead}><h2 className="milo-text-title-m">{title}</h2><p className={`milo-text-body ${s.muted}`}>{sub}</p></header>
      {children}
    </section>
  );
}

export function Brand() {
  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={`milo-text-label ${s.muted}`}>阶段 5.5b · 2026-10-05</p>
        <h1 className="milo-text-title-l">IP 小牛与 Logo</h1>
        <p className={`milo-text-body ${s.muted}`}>IP 改用 PNG：用户按意向图 3_27AM 用 Nano Banana 高清重制了 5 种牛龄 × 6 种状态，这里是切图、4 倍超分、抠图之后的素材，图里只有牛本身，特效由代码生成。前四种牛龄单眼，Milo 双眼发光。Logo 为 B 递增条牛头，破纪录与减量周状态已重做。</p>
      </header>

      <Section id="ip-stages" title="IP · 五种牛龄" sub="牛犊 → 小牛 → 壮牛 → 公牛 → 米洛（Milo），大小按总览图 A 的相对身高。Milo 是最高等级：全身荧光、双眼发光；泛光、四角星和扫光由代码生成。">
        <div className={s.stageRow}>
          {MASCOT_STAGES.map((st) => (
            <figure key={st} className={s.stageCell}>
              <Mascot stage={st} animate />
              <figcaption><b>{STAGE_NAME[st]}</b><span>{STAGE_RULE[st]}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="ip-hd" title="高清化与抠图" sub="scripts/mascot_png.py：①从状态板切出每只牛，只留牛本身（碎屑、z、速度线、星光、泛光都不要，进 App 时由代码生成）；②Real-ESRGAN anime 模型 4 倍超分，去掉 JPEG 块状噪点、边缘变锐；③在 4 倍图上抠图：边缘按「像素 = α·前景 + (1−α)·背景」反解透明度并换成最近的实心色，不留黑边；被脸包住的眼睛、鼻孔保持实心；Milo 的源图换成用户重出的无泛光、品红底版本（角和眼改成最亮的荧光），用绿色通道抠，泛光全由代码生成；④同一牛龄 6 张同比例、同地面线、同画布，换状态不跳。">
        <div className={s.checkCol}>
          <p className="milo-text-body">素材在 public/mascot/&lt;牛龄&gt;-&lt;状态&gt;.webp（App 用），PNG 母版在 design/brand/mascot/；检查图 screenshots/brand/mascot-sheet-checker.png（棋盘格 = 透明，红框 = 头像裁切，蓝线 = 地面线）。</p>
        </div>
      </Section>

      <Section id="ip-moods" title="IP · 状态" sub="行 = 牛龄，列 = 状态：平常、专注（训练中）、开心（完成训练）、恢复日（趴下）、破纪录（PR 弹窗）、减量周。">
        <div className={s.moodGrid}>
          <span />{MASCOT_MOODS.map((m) => <b key={m} className="milo-text-label">{MOOD_NAME[m]}</b>)}
          {MASCOT_STAGES.map((st) => (
            <Fragment key={st}>
              <b className="milo-text-label">{STAGE_NAME[st]}</b>
              {MASCOT_MOODS.map((m) => <div key={m} className={s.moodCell}><Mascot stage={st} mood={m} animate /></div>)}
            </Fragment>
          ))}
        </div>
      </Section>

      <Section id="ip-small" title="IP · 头像（小尺寸）" sub="通知、Toast、牛龄徽章只用头（同一张图按头像框裁成正方形）：16 / 24 / 32 / 48 像素下检查角和表情是否还认得出。">
        <div className={s.smallGrid}>
          {MASCOT_STAGES.map((st) => (
            <div key={st} className={s.smallCol}>
              {[s.h16, s.h24, s.h32, s.h48].map((c, i) => <MascotHead key={i} stage={st} className={c} />)}
              <span className="milo-text-micro">{STAGE_NAME[st]}</span>
            </div>
          ))}
          <div className={s.smallCol}>{(['happy', 'pr', 'rest', 'deload'] as MascotMood[]).map((m) => <MascotHead key={m} stage="bull" mood={m} className={s.h48} />)}<span className="milo-text-micro">公牛 · 表情</span></div>
          <div className={s.smallCol}>{(['happy', 'pr', 'rest', 'deload'] as MascotMood[]).map((m) => <MascotHead key={m} stage="milo" mood={m} className={s.h48} />)}<span className="milo-text-micro">Milo · 表情</span></div>
        </div>
      </Section>

      <Section id="logo" title="Logo · B 递增条牛头（已选定）" sub="9 根竖条从角往中间一根比一根长——每次只多一点，就是渐进超负荷；下缘收成 V 形牛脸，两根角条荧光，整体倾斜 11° 与 I3 图标一致。≤ 24 像素用 7 根宽条的简化版。">
        <div className={s.logoGrid}>
          <article className={s.logoCard} id="LB">
            <h3 className="milo-text-heading">App 图标</h3>
            <div className={s.logoRow}>
              <AppIcon mark="bars" className={s.icon96} />
              <AppIcon mark="bars" light className={s.icon96} />
            </div>
            <h3 className="milo-text-heading">尺寸阶梯</h3>
            <div className={s.sizes}>
              <LogoGlyph mark="bars" small className={s.g16} /><LogoGlyph mark="bars" small className={s.g24} />
              <LogoGlyph mark="bars" className={s.g48} /><LogoGlyph mark="bars" className={s.g64} />
            </div>
            <p className={`milo-text-caption ${s.muted}`}>16 · 24 像素（7 根简化版）· 48 · 64 像素（完整 9 根）</p>
          </article>
          <article className={s.logoCard}>
            <h3 className="milo-text-heading">横排组合</h3>
            <div className={s.lockRow}><Lockup mark="bars" className={s.lockBig} /></div>
            <div className={s.lockRow}><Lockup mark="bars" className={s.lockSmall} /><span className="milo-text-micro">小号</span></div>
            <div className={s.lockRow}><Lockup mark="bars" mono className={s.lockSmall} /><span className="milo-text-micro">单色</span></div>
            <p className={`milo-text-caption ${s.muted}`}>意向图 3_44AM。字标「慢牛 Milo」同样倾斜 11°；角条是唯一的荧光，单色版连角条也是骨白。</p>
          </article>
        </div>
      </Section>

      <Section id="states" title="状态 Logo（动态）" sub="同一个标志在 App 里的 6 种状态：不改标志，只改姿态、发光、点缀和条的长短。下面是真动画；右列写出现在哪里。">
        <div className={s.stateTable}>
          <div className={`${s.stateHead} milo-text-label`}><span>状态</span><span>Logo</span><span>App 图标</span><span>出现在哪里</span></div>
          {STATES.map((st) => (
            <div key={st} className={s.stateRowItem}>
              <b className="milo-text-heading">{LOGO_STATE_NAME[st]}</b>
              <LogoGlyph mark="bars" state={st} className={s.g64} />
              <AppIcon mark="bars" state={st} className={s.icon64} />
              <span className={`milo-text-caption ${s.muted}`}>{STATE_WHERE[st]}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="inuse" title="放进 App 里" sub="启动页（组合 Logo + 加载态）与升段奖励弹窗（小牛长大）——看 IP 和 Logo 放在一起是否是一家人。">
        <div className={s.phones}>
          <div className={s.phone}>
            <div className={s.splash}>
              <AppIcon mark="bars" state="loading" className={s.icon96} />
              <Lockup className={s.lockBig} />
              <p className={`milo-text-body ${s.muted}`}>慢慢变牛。</p>
            </div>
          </div>
          <div className={s.phone}>
            <div className={s.scrim} />
            <div className={s.reward}>
              <div className={s.rewardArt}><Mascot stage="bull" mood="pr" animate /></div>
              <p className={`milo-text-label ${s.lime}`}>升段</p>
              <h3 className="milo-text-title-m">壮牛长成公牛了</h3>
              <p className={`milo-text-body ${s.muted}`}>近 8 周深蹲预估 1RM +12.5 kg。下一段：Milo。</p>
              <p className={s.gain}><b>+500</b> 牛劲</p>
              <span className={s.cta}>收下</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
