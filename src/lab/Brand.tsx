/** /brand：阶段 5.5b · IP 小牛与 Logo（2026-10-05，第四轮）。
 *  IP：牛犊与公牛由 scripts/trace_mascot.py 从意向图 docs/brand-refs/ip2-geo-b-selected.jpg 一比一矢量化，米洛 = 公牛换荧光色；
 *  ?trace=newborn|bull 只按原图像素大小渲染一只（给 trace_mascot.py --check 做正负叠片用）。Logo 为 B 递增条牛头（3_44AM）。
 *  这一页只给用户评审用：同一组件在不同尺寸、底色、状态下的样子，以及放进启动页和奖励弹窗的样子。 */
import { Fragment } from 'react';
import { TRACE } from '../components/mascotTrace';
import { AppIcon, Lockup, LogoGlyph, LOGO_STATE_NAME, type LogoState } from '../components/Logo';
import { MASCOT_STAGES, Mascot, MascotHead, MOOD_NAME, STAGE_NAME, type MascotMood } from '../components/Mascot';
import s from './brand.module.css';

const MOODS: MascotMood[] = ['idle', 'focused', 'happy', 'sleep', 'pr', 'tired'];
const STATES: LogoState[] = ['idle', 'loading', 'training', 'pr', 'rest', 'deload'];
const STATE_WHERE: Record<LogoState, string> = {
  idle: '启动页、关于、商店图标',
  loading: '启动加载、下拉刷新、处方重算时',
  training: '训练进行中的顶部、通知栏、桌面小组件',
  pr: '结算页破纪录时，配合奖励弹窗（条从两角往中间点亮，中间最长的条再接一节荧光 = 比纪录多一点）',
  rest: '恢复日的首页标题位',
  deload: '减量周的首页标题位（内侧条收回一半、虚影标出原长度：量减了，余量还在）',
};
const STAGE_RULE = { newborn: '意向图 Newborn Calf 一比一矢量化 · 角芽 · 侧脸', bull: '意向图 Full-grown Bull 一比一矢量化 · 大角 · 肩峰 · 怒眼', milo: '公牛整只换成荧光色，角反过来用骨白' } as const;


function Section({ id, title, sub, children }: { id: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className={s.section} id={id}>
      <header className={s.secHead}><h2 className="milo-text-title-m">{title}</h2><p className={`milo-text-body ${s.muted}`}>{sub}</p></header>
      {children}
    </section>
  );
}

export function Brand() {
  const trace = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('trace') : null;
  if (trace === 'newborn' || trace === 'bull') {
    return <div className={s.traceOnly} data-trace={trace} style={{ width: TRACE[trace].w }}><Mascot stage={trace} className={s.traceSvg} /></div>;
  }
  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={`milo-text-label ${s.muted}`}>阶段 5.5b · 第四轮 · 2026-10-05</p>
        <h1 className="milo-text-title-l">IP 小牛与 Logo</h1>
        <p className={`milo-text-body ${s.muted}`}>第四轮：少做一些、做精一点。牛犊与公牛直接从意向图 3_27AM 一比一矢量化（按平涂色分层、potrace 描线），用正负叠片逐像素检查；米洛是公牛换成荧光色。Logo 的破纪录与减量周状态重新设计。</p>
      </header>

      <Section id="ip-stages" title="IP · 三个形态" sub="牛犊 → 公牛 → 米洛。形状直接来自意向图（不是手描），所以和原图一比一；颜色换成原色 Token。">
        <div className={s.stageRow}>
          {MASCOT_STAGES.map((st) => (
            <figure key={st} className={s.stageCell}>
              <Mascot stage={st} animate />
              <figcaption><b>{STAGE_NAME[st]}</b><span>{STAGE_RULE[st]}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="ip-check" title="正负叠片检查" sub="scripts/trace_mascot.py --check：把矢量按原图像素大小渲染，与原图做正负叠片（原图 + 反相渲染各一半，完全重合处是均匀中灰）和逐像素差值。叠片图含意向图裁片，不随网页发布，存在仓库 screenshots/brand/trace-check-*.png。">
        <div className={s.checkCol}>
          <p className="milo-text-body"><b>牛犊</b> 角色区域内差异像素 2.91%　·　<b>公牛</b> 2.07%（阈值 48/255）。剩下的差异只在 1 像素宽的抗锯齿边缘上，形状、分色、眼与角的位置全部重合。</p>
        </div>
      </Section>

      <Section id="ip-moods" title="IP · 状态" sub="行 = 形态，列 = 状态：平常、专注（训练提示）、开心（完成训练）、恢复日（趴下）、破纪录（PR 弹窗）、减量周。平常 / 专注用原图的眼，其余状态只换眼睛、头的姿态与点缀。">
        <div className={s.moodGrid}>
          <span />{MOODS.map((m) => <b key={m} className="milo-text-label">{MOOD_NAME[m]}</b>)}
          {MASCOT_STAGES.map((st) => (
            <Fragment key={st}>
              <b className="milo-text-label">{STAGE_NAME[st]}</b>
              {MOODS.map((m) => <div key={m} className={s.moodCell}><Mascot stage={st} mood={m} animate /></div>)}
            </Fragment>
          ))}
        </div>
      </Section>

      <Section id="ip-small" title="IP · 头像（小尺寸）" sub="通知、Toast、牛龄徽章只用头：16 / 24 / 32 / 48 像素下检查角和表情是否还认得出。">
        <div className={s.smallGrid}>
          {MASCOT_STAGES.map((st) => (
            <div key={st} className={s.smallCol}>
              {[s.h16, s.h24, s.h32, s.h48].map((c, i) => <MascotHead key={i} stage={st} className={c} />)}
              <span className="milo-text-micro">{STAGE_NAME[st]}</span>
            </div>
          ))}
          <div className={s.smallCol}>{(['happy', 'pr', 'sleep', 'tired'] as MascotMood[]).map((m) => <MascotHead key={m} stage="bull" mood={m} className={s.h48} />)}<span className="milo-text-micro">公牛 · 表情</span></div>
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
              <h3 className="milo-text-title-m">牛犊长成公牛了</h3>
              <p className={`milo-text-body ${s.muted}`}>近 8 周深蹲预估 1RM +12.5 kg。下一段：米洛。</p>
              <p className={s.gain}><b>+500</b> 牛劲</p>
              <span className={s.cta}>收下</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
