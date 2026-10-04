/** /brand：阶段 5.5b 第一轮 · IP 小牛与 Logo（2026-10-05）。
 *  意向图：IP 取 docs/Generated Image … 3_13AM (1) 与 3_27AM 之长；Logo 取 3_40AM（牛角 M）与 3_44AM (1)（递增条牛头）。
 *  这一页只给用户评审用：同一组件在不同尺寸、底色、状态下的样子，以及放进启动页和奖励弹窗的样子。 */
import { AppIcon, Lockup, LogoGlyph, LOGO_STATE_NAME, type LogoMark, type LogoState } from '../components/Logo';
import { Mascot, MascotHead, MOOD_NAME, STAGE_NAME, type MascotMood, type MascotStage } from '../components/Mascot';
import s from './brand.module.css';

const STAGES: MascotStage[] = [0, 1, 2, 3, 4];
const MOODS: MascotMood[] = ['focused', 'happy', 'sleep', 'pr', 'tired'];
const STATES: LogoState[] = ['idle', 'loading', 'training', 'pr', 'rest', 'deload'];
const STATE_WHERE: Record<LogoState, string> = {
  idle: '启动页、关于、商店图标',
  loading: '启动加载、下拉刷新、处方重算时',
  training: '训练进行中的顶部、通知栏、桌面小组件',
  pr: '结算页破纪录时，配合奖励弹窗',
  rest: '恢复日的首页标题位',
  deload: '减量周的首页标题位（条变短 = 训练量减少）',
};
const STAGE_RULE = ['无角 · 圆滚滚', '角芽（两个荧光点）', '新月小角 · 起肩峰 · 坚定眉', '大角 · 肩峰 · 压眉', '最大角 · 荧光尾梢'];

const OPTIONS: Array<{ id: string; title: string; mark: LogoMark; hornM: boolean; note: string }> = [
  { id: 'LM', title: 'M · 牛角 M', mark: 'm', hornM: true, note: '意向图 3_40AM。字母本身就是牛：两侧外缘顶出荧光新月角，倾斜 11° 与 I3 图标一致。字标、图标同一个形，最好认、最商用；16 像素下角仍然清楚。' },
  { id: 'LB', title: 'B · 递增条牛头', mark: 'bars', hornM: false, note: '意向图 3_44AM。9 根竖条从角往中间一根比一根长——每次只多一点，就是渐进超负荷；下缘收成 V 形牛脸，两根角条荧光。最会讲故事，状态变体最自然（加载 = 一根根长出来，减量 = 条变短）。' },
  { id: 'LC', title: 'C · 组合（推荐）', mark: 'bars', hornM: true, note: '图标用递增条（讲原理、做状态），字标里的 M 用牛角 M（讲「牛」、好认）。两个意向各取所长：图标位放条，品牌位放字标。' },
];

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
        <p className={`milo-text-label ${s.muted}`}>阶段 5.5b · 第一轮 · 2026-10-05</p>
        <h1 className="milo-text-title-l">IP 小牛与 Logo</h1>
        <p className={`milo-text-body ${s.muted}`}>全部是代码画的矢量（可缩放、可做动效、颜色只用 Token）。IP 取 3_13AM 的几何构成和「角从无到芽到新月」，取 3_27AM 的成长幅度和正脸表情；Logo 两个方向各自精修，再给一个组合。</p>
      </header>

      <Section id="ip-stages" title="IP · 成长阶段（牛龄 5 段）" sub="同一只牛，随牛龄长大：体型、腿、肩峰、角、眉一起变。只因「变强」长大（brief「增长与商业化层」§3）。">
        <div className={s.stageRow}>
          {STAGES.map((st) => (
            <figure key={st} className={s.stageCell} style={{ flexGrow: 1 + st * 0.18 }}>
              <Mascot stage={st} />
              <figcaption><b>{STAGE_NAME[st]}</b><span>{STAGE_RULE[st]}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="ip-moods" title="IP · 状态" sub="小牛与公牛各一排；对应出场位置：专注（训练提示）、开心（完成训练）、恢复日（休息）、破纪录（PR 弹窗）、减量周。">
        {([1, 3] as MascotStage[]).map((st) => (
          <div key={st} className={s.moodRow}>
            {MOODS.map((m) => (
              <figure key={m} className={s.moodCell}><Mascot stage={st} mood={m} /><figcaption><b>{MOOD_NAME[m]}</b><span>{STAGE_NAME[st]}</span></figcaption></figure>
            ))}
          </div>
        ))}
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

      <Section id="logo" title="Logo · 三个选项" sub="每个选项：App 图标（深 / 浅底）、横排组合、单色版、16 / 24 / 48 像素。">
        <div className={s.logoGrid}>
          {OPTIONS.map((o) => (
            <article key={o.id} className={s.logoCard} id={o.id}>
              <h3 className="milo-text-heading">{o.title}</h3>
              <div className={s.logoRow}>
                <AppIcon mark={o.mark} className={s.icon96} />
                <AppIcon mark={o.mark} light className={s.icon96} />
                <div className={s.sizes}>{[s.g16, s.g24, s.g48].map((c, i) => <LogoGlyph key={i} mark={o.mark} className={c} />)}</div>
              </div>
              <div className={s.lockRow}><Lockup mark={o.id === 'LM' ? undefined : o.mark} hornM={o.hornM} className={s.lockBig} /></div>
              <div className={s.lockRow}><Lockup mark={o.id === 'LM' ? undefined : o.mark} hornM={o.hornM} mono className={s.lockSmall} /><span className="milo-text-micro">单色</span></div>
              <p className={`milo-text-caption ${s.muted}`}>{o.note}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section id="states" title="状态 Logo（动态）" sub="同一个标志在 App 里的 6 种状态：不改标志，只改姿态、发光、点缀和条的长短。下面是真动画；右列写出现在哪里。">
        <div className={s.stateTable}>
          <div className={`${s.stateHead} milo-text-label`}><span>状态</span><span>牛角 M</span><span>递增条</span><span>出现在哪里</span></div>
          {STATES.map((st) => (
            <div key={st} className={s.stateRowItem}>
              <b className="milo-text-heading">{LOGO_STATE_NAME[st]}</b>
              <LogoGlyph mark="m" state={st} className={s.g64} />
              <LogoGlyph mark="bars" state={st} className={s.g64} />
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
              <Lockup hornM className={s.lockBig} />
              <p className={`milo-text-body ${s.muted}`}>慢慢变牛。</p>
            </div>
          </div>
          <div className={s.phone}>
            <div className={s.scrim} />
            <div className={s.reward}>
              <div className={s.rewardArt}><Mascot stage={2} mood="pr" /></div>
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
