/** /spec 第 7 章「触点」（6h，线框 ?board=touch：W1 通知 + W2 小组件 A + W3 的 2×2 小牛 + W4 图标；Stitch t6：通知 V1、小组件 V2、图标 V2，docs/brief.md 2026-10-07）。
 *  五层：
 *  - 战略：证明「品牌不只在 App 里」——通知、桌面、图标是同一套语言；也守住产品的态度：不做每日打卡式提醒（我们不奖励打开 App）。
 *  - 范围：通知 4 种（休息结束 · 连胜快断 · 新纪录 · 减量建议）+ 锁屏只露标题；桌面小组件（今日 2×2、训练中休息 2×2、今日处方 4×2、小牛与连胜 2×2）；
 *    图标在三种系统遮罩、主题单色、深浅壁纸上的样子。只做设计稿：真实本地通知、商店素材 2026-10-06 已划掉；启动页与尺寸阶梯在第 6 章，不重复。
 *  - 结构：规范页里的一章（讲 App 外面怎么用品牌），用真组件实时渲染（状态 Logo、App 图标、小牛），不放截图；每张写出现时机与点了去哪。
 *  - 框架：通知 = 小图标 + 来源时间 → 标题写结论 → 正文写数 → 最多两个动作，右边大图标是 Logo 的状态；小组件一张一件事。
 *  - 表现：暖黑 + 骨白，荧光只在 Logo 的角上和破纪录那条通知的一道边；小组件底是配重片槽纹（同会员卡、推荐卡）；数字窄体。 */
import type { ReactNode } from 'react';
import { AppIcon, LogoGlyph, Mascot, type LogoState } from '../components';
import s from './TouchSpec.module.css';

const NOTIS: { state: LogoState; time: string; title: string; body: string; acts?: string[]; lit?: boolean; when: string }[] = [
  { state: 'training', time: '刚刚', title: '休息结束 · 第 3 组', body: '杠铃深蹲 85 kg × 6', acts: ['打卡', '+30 秒'], when: '训练中、App 不在前台，组间休息走完时' },
  { state: 'idle', time: '周六 18:00', title: '这周还差 2 次', body: '周日前练够，连胜 21 周保住；手上有 1 张冻结卡。', when: '引擎判「快断」的那周，周六傍晚一次（不做每天的打卡提醒）' },
  { state: 'pr', time: '10 分钟前', title: '新纪录：杠铃深蹲', body: '预估 1RM 102.5 kg，比之前最好 +2.5 kg', acts: ['看看'], lit: true, when: '结算出新纪录、但没看结算页就离开了；口径同结算页（比之前最好）' },
  { state: 'deload', time: '昨天', title: '该减量了', body: '三个主项的预估 1RM 连降三次', acts: ['看看'], when: '引擎给出减量建议时；「看看」打开首页的减量面板' },
];

function Phone({ children, light, fit, label }: { children: ReactNode; light?: boolean; /** 高度按内容，不撑满一屏 */ fit?: boolean; label: string }) {
  return (
    <div className={`${s.phone} ${light ? s.phoneLight : ''} ${fit ? s.phoneFit : ''}`} role="img" aria-label={label}>
      <div className={s.status}><b>18:00</b><span className={s.sysIcons} aria-hidden="true"><i /><i /><i /></span></div>
      {children}
    </div>
  );
}

function Noti({ n }: { n: (typeof NOTIS)[number] }) {
  return (
    <div className={`${s.noti} ${n.lit ? s.notiLit : ''}`}>
      <div className={s.notiHead}><LogoGlyph mark="bars" small className={s.notiApp} /><span>慢牛 Milo · {n.time}</span><i className={s.chev} aria-hidden="true" /></div>
      <div className={s.notiBody}>
        <div className={s.notiText}><b>{n.title}</b><span>{n.body}</span></div>
        <span className={s.notiIcon}><LogoGlyph mark="bars" state={n.state} className={s.notiGlyph} /></span>
      </div>
      {n.acts && <div className={s.notiActs}>{n.acts.map((a, i) => <span key={a} className={i === 0 && n.acts!.length > 1 ? s.actMain : s.act}>{a}</span>)}</div>}
    </div>
  );
}

export function TouchSpec() {
  return (
    <div className={s.page}>
      <p className={`milo-text-body ${s.lead}`}>App 外面的三个地方：系统通知、桌面小组件、桌面上的图标。只是设计稿——真实本地通知和商店素材不做（2026-10-06 已划掉）；启动页与图标的尺寸阶梯在第 6 章，这里不重复。</p>

      <div className={s.grid}>
        <figure className={s.fig} id="touch-noti">
          <Phone label="通知栏里的 4 种慢牛 Milo 通知">
            <div className={s.shadeTitle}><span>通知</span><span>清除</span></div>
            <div className={s.stack}>{NOTIS.map((n) => <Noti key={n.title} n={n} />)}</div>
          </Phone>
          <figcaption>
            <b className="milo-text-heading">通知 · 4 种</b>
            <ul className={`milo-text-caption ${s.notes}`}>
              {NOTIS.map((n) => <li key={n.title}><b>{n.title}</b>：{n.when}</li>)}
              <li>右边大图标是 Logo 的状态（训练中前压、破纪录点亮、减量周内侧条收回、平常）；标题写结论、正文写数；最多两个动作，第一个骨白实底。</li>
              <li>不做「今天还没练」这类每天来一条的提醒——我们不奖励打开 App。</li>
            </ul>
          </figcaption>
        </figure>

        <figure className={s.fig} id="touch-lock">
          <Phone label="锁屏：通知只露标题">
            <div className={s.lock}>
              <span className={s.clock}>18:00</span><span className={s.date}>10 月 10 日 周六</span>
              <div className={s.lockNoti}><LogoGlyph mark="bars" small className={s.notiApp} /><span><b>慢牛 Milo</b> · 新纪录：杠铃深蹲</span></div>
              <div className={s.lockNoti}><LogoGlyph mark="bars" small className={s.notiApp} /><span><b>慢牛 Milo</b> · 这周还差 2 次</span></div>
            </div>
          </Phone>
          <figcaption>
            <b className="milo-text-heading">锁屏 · 只露标题</b>
            <ul className={`milo-text-caption ${s.notes}`}>
              <li>重量、次数、预估 1RM 不上锁屏（训练数据是私事）；解锁后才展开正文。</li>
            </ul>
          </figcaption>
        </figure>

        <figure className={s.fig} id="touch-widget">
          <Phone label="桌面上的 4 个慢牛 Milo 小组件">
            <div className={s.widgets}>
              <div className={s.w}>
                <span className={s.wCap}>今日 · 下肢 A</span>
                <b className={s.wName}>杠铃深蹲</b>
                <span className={s.wBig}>85 × 6</span>
                <span className={s.wFoot}><svg className={s.ring} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /></svg>0 / 14 组</span>
              </div>
              <div className={s.w}>
                <span className={s.wCap}>训练中 · 休息</span>
                <span className={`${s.wBig} ${s.wHuge}`}>1:35</span>
                <i className={s.wBar} aria-hidden="true"><i /></i>
                <span className={s.wFoot}>下一组：第 3 组</span>
              </div>
              <div className={`${s.w} ${s.wWide}`}>
                <span className={s.wCap}>今日处方 · 下肢 A · 约 55 分钟</span>
                {[['杠铃深蹲', '85 × 6'], ['罗马尼亚硬拉', '70 × 8'], ['坐姿腿屈伸', '45 × 12']].map(([a, b]) => <span key={a} className={s.wRow}><span>{a}</span><b>{b}</b></span>)}
                <span className={s.wGo}>开始</span>
              </div>
              <div className={s.w}>
                <span className={s.wCap}>今日 · 已练完</span>
                <span className={s.wBig}>14 / 14</span>
                <span className={s.wFoot}>明天 胸 + 三头</span>
              </div>
              <div className={`${s.w} ${s.wMascot}`}>
                <span className={s.wArt}><Mascot stage="bull" mood="rest" animate title="恢复日趴着的小牛" /></span>
                <span className={s.wStreak}><b>21</b> 周连胜</span>
              </div>
            </div>
            <div className={s.dock}><AppIcon mark="bars" className={s.dockIcon} /><i /><i /><i /></div>
          </Phone>
          <figcaption>
            <b className="milo-text-heading">桌面小组件</b>
            <ul className={`milo-text-caption ${s.notes}`}>
              <li><b>今日 2×2</b>：今日部位 + 第一个动作的重量 × 次数 + 今日组数小环；练完换成「已练完 14 / 14 · 明天 胸 + 三头」。</li>
              <li><b>训练中 2×2</b>：休息倒计时 + 骨白进度条（同一个计时，只是到了桌面上）。</li>
              <li><b>今日处方 4×2</b>：前 3 个动作 + 骨白「开始」；点哪里都进首页（小组件不能直接打卡）。</li>
              <li><b>小牛 2×2</b>：当前牛龄 · 当前状态（恢复日趴着、减量周叹气……）+ 连胜周数。今日是工具、小牛是陪伴。</li>
              <li>系统不让小组件做动画：状态靠换图，不靠动效。</li>
            </ul>
          </figcaption>
        </figure>

        <figure className={s.fig} id="touch-icon">
          <Phone light fit label="图标：三种系统遮罩、主题单色、深浅壁纸">
            <div className={s.masks}>
              {(['圆', '圆角方', '方圆'] as const).map((m, i) => <span key={m} className={s.maskCell}><span className={`${s.mask} ${s[`mask${i}`]}`}><AppIcon mark="bars" className={s.maskIcon} /></span>{m}</span>)}
              <span className={s.maskCell}><span className={`${s.mask} ${s.mask0} ${s.themed}`}><LogoGlyph mark="bars" className={s.themedGlyph} /></span>主题图标</span>
            </div>
            <div className={s.walls}>
              <div className={s.wallDark}>{[0, 1, 2].map((i) => <i key={i} />)}<span className={s.launch}><AppIcon mark="bars" className={s.launchIcon} />慢牛</span></div>
              <div className={s.wallLight}><span className={s.launch}><AppIcon mark="bars" className={s.launchIcon} />慢牛</span>{[0, 1, 2].map((i) => <i key={i} />)}</div>
            </div>
          </Phone>
          <figcaption>
            <b className="milo-text-heading">图标 · 在别人的桌面上</b>
            <ul className={`milo-text-caption ${s.notes}`}>
              <li>三种系统遮罩（圆、圆角方、方圆）下两根荧光角都不被切：标志只占安全区 72%。</li>
              <li>安卓 13 的主题图标：系统按壁纸上色，只留单色轮廓，连角条也同色。</li>
              <li>深色、浅色壁纸上都认得出：暖黑底板 + 骨白条 + 荧光角。启动页与 16–64 尺寸阶梯见第 6 章。</li>
            </ul>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
