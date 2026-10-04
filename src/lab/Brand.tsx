/** /brand：阶段 5.5b 第一轮 · IP 小牛与 Logo（2026-10-05）。
 *  第二轮：IP 逼近意向图 docs/brand-refs/ip2-geo-b-selected.jpg（3_27AM）的画法，每个阶段都有全部状态并会动；Logo 定为 B 递增条牛头（3_44AM）。
 *  这一页只给用户评审用：同一组件在不同尺寸、底色、状态下的样子，以及放进启动页和奖励弹窗的样子。 */
import { Fragment } from 'react';
import { AppIcon, Lockup, LogoGlyph, LOGO_STATE_NAME, type LogoState } from '../components/Logo';
import { Mascot, MascotHead, MOOD_NAME, STAGE_NAME, type MascotMood, type MascotStage } from '../components/Mascot';
import s from './brand.module.css';

const STAGES: MascotStage[] = [0, 1, 2, 3, 4];
const MOODS: MascotMood[] = ['idle', 'focused', 'happy', 'sleep', 'pr', 'tired'];
const STATES: LogoState[] = ['idle', 'loading', 'training', 'pr', 'rest', 'deload'];
const STATE_WHERE: Record<LogoState, string> = {
  idle: '启动页、关于、商店图标',
  loading: '启动加载、下拉刷新、处方重算时',
  training: '训练进行中的顶部、通知栏、桌面小组件',
  pr: '结算页破纪录时，配合奖励弹窗',
  rest: '恢复日的首页标题位',
  deload: '减量周的首页标题位（条变短 = 训练量减少）',
};
const STAGE_RULE = ['角芽 · 侧脸 · 圆滚滚', '新月小角 · 正脸圆眼', '大新月角 · 肩峰 · 怒眼', '大角 · 厚肩峰 · 双怒眼', '公牛 + 荧光尾梢'];


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
        <p className={`milo-text-label ${s.muted}`}>阶段 5.5b · 第二轮 · 2026-10-05</p>
        <h1 className="milo-text-title-l">IP 小牛与 Logo</h1>
        <p className={`milo-text-body ${s.muted}`}>第二轮：IP 按意向图 3_27AM 的画法逐块重描（四分之三正面、大头压在身前、骨白臀腿块 + 灰躯干、新月角），每个成长阶段都有全部状态，并按 pet-forge 的 SVG 分层约定动起来；Logo 定为 B 递增条牛头。</p>
      </header>

      <Section id="ip-stages" title="IP · 成长阶段（牛龄 5 段）" sub="同一只牛，随牛龄长大：体型、腿、肩峰、角、眉一起变。只因「变强」长大（brief「增长与商业化层」§3）。">
        <div className={s.stageRow}>
          {STAGES.map((st) => (
            <figure key={st} className={s.stageCell} style={{ flexGrow: 1 + st * 0.18 }}>
              <Mascot stage={st} animate />
              <figcaption><b>{STAGE_NAME[st]}</b><span>{STAGE_RULE[st]}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="ip-moods" title="IP · 每个阶段的状态" sub="行 = 成长阶段，列 = 状态：平常、专注（训练提示）、开心（完成训练）、恢复日（趴睡）、破纪录（PR 弹窗）、减量周。眼型跟着体型走（小牛圆眼、壮牛 / 公牛怒眼），状态只换眼睛与点缀。">
        <div className={s.moodGrid}>
          <span />{MOODS.map((m) => <b key={m} className="milo-text-label">{MOOD_NAME[m]}</b>)}
          {STAGES.map((st) => (
            <Fragment key={st}>
              <b className="milo-text-label">{STAGE_NAME[st]}</b>
              {MOODS.map((m) => <div key={m} className={s.moodCell}><Mascot stage={st} mood={m} animate /></div>)}
            </Fragment>
          ))}
        </div>
      </Section>

      <Section id="ip-small" title="IP · 头像（小尺寸）" sub="通知、Toast、牛龄徽章只用头：16 / 24 / 32 / 48 像素下检查角和表情是否还认得出。">
        <div className={s.smallGrid}>
          {STAGES.map((st) => (
            <div key={st} className={s.smallCol}>
              {[s.h16, s.h24, s.h32, s.h48].map((c, i) => <MascotHead key={i} stage={st} className={c} />)}
              <span className="milo-text-micro">{STAGE_NAME[st]}</span>
            </div>
          ))}
          <div className={s.smallCol}>{(['happy', 'pr', 'sleep', 'tired'] as MascotMood[]).map((m) => <MascotHead key={m} stage={2} mood={m} className={s.h48} />)}<span className="milo-text-micro">壮牛 · 表情</span></div>
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
              <div className={s.rewardArt}><Mascot stage={2} mood="pr" animate /></div>
              <p className={`milo-text-label ${s.lime}`}>升段</p>
              <h3 className="milo-text-title-m">小牛长成壮牛了</h3>
              <p className={`milo-text-body ${s.muted}`}>近 8 周深蹲预估 1RM +12.5 kg。下一段：公牛。</p>
              <p className={s.gain}><b>+500</b> 牛劲</p>
              <span className={s.cta}>收下</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
