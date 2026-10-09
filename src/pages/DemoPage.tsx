/** /demo：第一版实机演示（阶段 6a 收尾）。
 *  - 宽屏（电脑）：左边是讲解和演示路线，右边一台「手机」——iframe 里就是 App 本体（同源，共用本机存储）。
 *    路线上每一步可以直接跳过去（清空 / 载入演示数据后刷新手机）；手机当前在哪一步，路线上就亮哪一步。
 *  - 窄屏（手机）：不套壳，清空数据后全屏进 App，从故事开始。
 *  数据只在这个浏览器的本机存储里（milo:v1），没有后端。 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Lockup } from '../components';
import { DEFAULT_PROFILE, demoLegState, demoRiskState, demoState, riskDemoNow, store, STORE_KEY } from '../data/store';
import s from './DemoPage.module.css';

type Step = { id: string; t: string; d: string; go?: { label: string; run: () => string } };

/** 手机里的地址 → 路线上的第几步 */
function stepOf(path: string): string {
  let st: { draft?: unknown; active?: unknown } = {};
  try { st = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}'); } catch { /* 读不到当没有 */ }
  if (path.startsWith('/onboarding')) return st.draft ? 'setup' : 'story';
  if (path.startsWith('/summary')) return 'summary';
  if (path.startsWith('/body')) return 'body';
  if (path.startsWith('/gains/')) return 'trend';
  if (path.startsWith('/gains')) return 'gains';
  if (path.startsWith('/log/')) return 'logdetail';
  if (path.startsWith('/log')) return 'log';
  if (path.startsWith('/me/level')) return path.includes('now=') ? 'risk' : 'level';
  if (path.startsWith('/me/wallet')) return 'wallet';
  if (path.startsWith('/pro') || path.startsWith('/me/pro')) return 'pro';
  if (path.startsWith('/shop/checkout') || path.startsWith('/shop/order')) return 'order';
  if (path.startsWith('/shop')) return 'shop';
  if (path.startsWith('/me')) return 'me';
  if (path.startsWith('/today')) return st.active ? 'session' : 'today';
  return '';
}

const wide = () => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 56rem)').matches;

export function DemoPage() {
  const nav = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const [desk] = useState(wide);
  const [at, setAt] = useState('');
  const [scale, setScale] = useState(1);

  // 手机上：清空后全屏进 App，从故事开始
  useEffect(() => { if (!desk) { store.clear(); nav('/onboarding', { replace: true }); } }, [desk, nav]);
  // 手机按窗口高度缩放
  useEffect(() => {
    if (!desk) return;
    // 手机 + 下面的「重新开始」一起放进一屏（手机跟着滚动、停在屏幕中间）
    const fit = () => { const h = phone.current?.offsetHeight ?? 1; setScale(Math.min(1, (window.innerHeight * 0.84) / h)); };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [desk]);
  // 跟踪手机当前在哪一步（同源 iframe，直接读地址）
  useEffect(() => {
    if (!desk) return;
    const id = window.setInterval(() => { try { setAt(stepOf((frame.current?.contentWindow?.location.pathname ?? '') + (frame.current?.contentWindow?.location.search ?? ''))); } catch { /* 跨源时读不到，不亮 */ } }, 400);
    return () => clearInterval(id);
  }, [desk]);

  const open = (path: string) => { const w = frame.current?.contentWindow; if (w) w.location.replace(path); };
  const reset = () => { store.clear(); return '/onboarding'; };
  const withDemo = (path: string, make = demoState) => () => { store.clear(); store.update((x) => ({ ...x, ...make(Date.now()), draft: null })); return path; };

  const steps: Step[] = [
    { id: 'story', t: '初见引导 · 米洛（Milo）的故事', d: '8 幕动画讲清渐进超负荷与超量恢复；第 5 幕光点进荧光段时点「练」。', go: { label: '从头开始', run: reset } },
    { id: 'setup', t: '建档 · 三步', d: '最后一步选「载入示例数据」：一个练了 30 周的进阶用户。', go: { label: '跳过故事', run: () => { store.clear(); store.update((x) => ({ ...x, draft: { step: 1, profile: { ...DEFAULT_PROFILE } } })); return '/onboarding'; } } },
    { id: 'today', t: '今日处方', d: '引擎现算：练哪几个动作、每个加多少；增量尺画出「上次 → 这次」，「为什么是这些」看依据。', go: { label: '载入演示数据', run: withDemo('/today') } },
    { id: 'session', t: '就在首页打卡', d: '点「开始训练」，主角卡原地展开成组行；大重量复合动作先给 3 颗热身胶囊（点一颗算做完，不计入容量）；拇指区一个「打卡」，休息倒计时是主按钮旁一颗小胶囊（只显示，不展开；打下一组就是结束休息）；页头随内容滚走；点组行才拉出键盘改数（按内容高打开，不滚）。主角卡右上「要领」看示范、「换一个」只换今天；页头「暂停」（或手机返回键）暂停，已记的组都在，首页点「继续训练」接着练。' },
    { id: 'finder', t: '找动作', d: '首页主角卡正下方「＋ 加一个动作 · 按肌肉找」（训练中在主角卡和「全部动作」之间）：先替你选好本周还差最多的那块肌肉。右边点人体选肌肉（按整块肌肉点、左边再细分到肌头），左边是能练它的动作、器械和上次重量；点一行看要领，再「加到今天」。容量页肌头面板里的「找练这块的动作」也进这里。', go: { label: '打开首页', run: withDemo('/today') } },
    { id: 'guide', t: '动作要领', d: '上半屏是 MuscleWiki 示范（正面 / 侧面），下面的抽屉常态露出一句话要点和 3 步，往上拉看练到的肌头和这个动作的预估 1RM 曲线；从找动作进来时底部是「加到今天」。', go: { label: '打开一个动作', run: withDemo('/exercise/barbell-bench-press-4?from=finder') } },
    { id: 'summary', t: '结算 → 今天已练完', d: '破纪录卡、力竭度、牛龄成长；回到首页是「今天已练完」和恢复进度。' },
    { id: 'body', t: '容量', d: '半身人体三层视效（在 /preview 方案台选定：柔光描边 + 金属渐变 + 熔流，越热越亮、流得越快）+ 右侧容量胶囊（常态小了三分之一，少挡人体）；长按胶囊放大，轻点胶囊原地长成肌头详情（M03）；正面 / 背面、男 / 女切换一律从左往右换卡。点一颗胶囊打开肌头面板，最下面「近 8 周 · 每周组数」是会员的高级分析（演示不拦截，块标题旁的「Pro ›」进付费墙）。', go: { label: '打开容量页', run: withDemo('/body') } },
    { id: 'gains', t: '增量', d: '页头一个配重片环：近 4 周练的动作里几个在涨、几个持平、几个在退，右上角的粒子一圈圈向内收到光点（模糊过，只当氛围）；下面按「该加重 / 保持 / 该减重」色带分组，每行「下次 重量 × 次数」（描边字）就是首页处方里的重量，新纪录是荧光细线小标、上涨荧光；组头点一下收起 / 展开（默认只展开第一组，展开时一行行弹入）。页头跟着滑走，部位筛选滑到顶后贴顶；五个 Tab 的大标题在同一个位置，长页往下滑过一屏右下角出现「回到顶端」。', go: { label: '打开增量页', run: withDemo('/gains') } },
    { id: 'trend', t: '动作进步曲线', d: '点增量页的任意一行：大数字是选中那天的预估力量，曲线按住横向拖或点明细的一行切换日期（拖的时候整页不跳：组列表按最多的那次预留高度），下面是那天每一组和「下次目标」（和首页、增量页同一个数）；返回回到原来的筛选和滚动位置。曲线上方「对比 ＋ 选一个动作」：选一个同部位练过的动作，它的曲线以虚线叠上来，图下同时读两条（会员的高级分析，旁边挂「Pro ›」）。', go: { label: '从增量页进一个动作', run: withDemo('/gains') } },
    { id: 'log', t: '记录', d: '页头下面是一块钢板日历：近 3 个月练过的日子是冲出来的孔；灯固定在屏幕上、不跟页面走，每个孔射出一束体积光（丁达尔），往下滑时亮暗和光束角度跟着变，钢板滑出灯下时慢慢关灯（透光和光束一起暗）；休息日是暗的手绘细圈，也能选；按住钢板横向拖，吸到某一天、上面读数行按位滚，点「查看」进那天的训练；下面按月收起：月头写次数 · 组数 · 总量和每周小柱，点开是按周分组的一行一次训练；默认只展开最近一个月，滑到底自动再载 6 个月，全部加载完写「到底了」。', go: { label: '打开记录页', run: withDemo('/log') } },
    { id: 'logdetail', t: '训练详情', d: '点记录页的一行：日期飞成标题、部位飞成副标题；汇总三格、新纪录一行，每个动作一张卡，每一组「重量 × 次数」（热身灰字、递减组标出）；点动作卡头进它的进步曲线，返回回到这里；右上角「更多」可以删除这次训练（二次确认、不能撤销），删完回记录页，各页的容量、趋势、新纪录、处方都按新历史重算；返回记录页还原滚动位置和展开的周数。', go: { label: '从记录页进一次训练', run: withDemo('/log') } },
    { id: 'me', t: '我的', d: '第一屏是成长卡：小牛、牛龄、离下一级还差什么、连胜 · 本周 · 牛劲，点它进牛龄页；下面档案四格（点哪格改哪项，体重可选），消息、导航三项设置（进度环 · 休息描边 · 结束提示，立即生效）、数据（载入示例 · 导出 CSV · 清除，都先确认）、关于。', go: { label: '打开我的', run: withDemo('/me') } },
    { id: 'level', t: '牛龄', d: '5 段名字里当前一段加下划线，小牛站在一圈圈配重片里；离下一级用能照着做的说法（涨幅太大就写「再完成 N 个训练周期」）；连胜、本周、冻结卡三格，最近 12 周守约点阵，成长记录（连着破的几个 PR 合成一行）。删训练后牛龄或连胜回退，会在记录里写一行说明。', go: { label: '打开牛龄', run: withDemo('/me/level') } },
    { id: 'risk', t: '连胜快断', d: '时间拨到这周日、这周只练了 1 次：牛龄页三格下面出来一行「这周快断了：还差几次，只剩 1 天」。手上没有冻结卡，给两个出口——「兑一张冻结卡 · 800 牛劲」直接打开钱包的兑换面板（只放冻结卡），兑完回到牛龄页，这一行变成「有 1 张冻结卡，连胜保住」；「Pro 每月送 2 张」进付费墙。「我的」成长卡那句话这周也换成「这周快断了」。', go: { label: '看连胜快断', run: () => `${withDemo('/me/level', demoRiskState)()}?now=${riskDemoNow(Date.now())}` } },
    { id: 'wallet', t: '钱包', d: '「我的 → 钱包 · 商城」：牛劲余额（≈ 多少元、本月进账）、我的卡券（可用的能「去用」）、最近明细；底部拇指区两个出口——「去商城抵扣」和「兑换卡券」（底部面板，牛劲不够的写还差多少）。', go: { label: '打开钱包', run: withDemo('/me/wallet') } },
    { id: 'shop', t: '商城与知识卡', d: '顶上「为你推荐」是被你的训练数据触发的知识卡（演示用户：硬拉预估 1RM 已到体重 1.62 倍 → 腰带）；点进去先看证据和怎么用，再看商品。商品五种状态：折扣、热销、新品是左上角荧光斜丝带，缺货（整卡变暗，详情页「到货提醒」，消息里来一条）、已下架（从助力带知识卡里的镁粉进）。', go: { label: '打开商城', run: withDemo('/shop') } },
    { id: 'tipbody', t: '容量页的知识卡', d: '换一位近 4 周深蹲类练得多的用户（每周约 13 组）：容量页「近 7 天」下面出来一条护膝知识卡——点进去先看为什么、怎么用；对应的护膝正好缺货，可以「到货提醒」。✕ 只收起这一次，「不再提示这一类」在知识卡页底。主演示用户不会触发这一条。', go: { label: '换一位腿练得多的用户', run: withDemo('/body', demoLegState) } },
    { id: 'order', t: '演示下单', d: '腰带详情点「购买」：自动选好能用的满减券，牛劲按会员价的 20% 封顶抵扣（296 − 30 − 59 = ¥207）；不收集任何支付信息，提交即成功（App 里不写「演示」，说明只在这一栏）；订单完成页显示订单号和牛劲余额变化，返回回到商城。', go: { label: '打开腰带', run: withDemo('/shop/item/belt-10') } },
    { id: 'pro', t: '会员 Milo Pro', d: '「我的 → Milo Pro」：权益用你的账单讲——这 30 天会多拿多少牛劲、每月 2 张冻结卡保住你的连胜、你最该买的那件会员价省多少；「看完整对比」就地展开。选月度 / 年度 / 试用，不收集支付信息，开通即成功：小牛在同心环纹里庆祝。会员中心看有效期走到哪了（荧光刻度 = 今天）、这个月 Pro 给了你什么；「管理订阅」能切回免费，已得的不收回。付费墙的另外三个入口：容量页肌头面板「近 8 周」和曲线页「对比」旁的「Pro ›」、商品详情会员价旁的「Pro ›」；连胜快断时牛龄页的「Pro 每月送 2 张」。', go: { label: '打开会员', run: withDemo('/pro') } },
  ];

  if (!desk) return null;
  return (
    <main className={s.page}>
      <div className={s.aura} aria-hidden="true" />
      <section className={s.copy}>
        <Lockup mark="bars" className={s.lockup} />
        <span className={s.eyebrow}><i />第一版实机演示 · 阶段 6a</span>
        <h1 className={s.title}>每次只多一点，<br />在恢复的最高点<em>再练</em>。</h1>
        <p className={s.lead}>慢牛 Milo 是给进阶健身者的增量引擎：<b>渐进超负荷 × 超量恢复</b>。右边就是 App 本体——点、滑、长按都是真的；数据只存在这个浏览器里。</p>
        <ol className={s.route}>
          {steps.map((x, i) => (
            <li key={x.id} className={at === x.id ? s.on : undefined} style={{ '--i': i } as CSSProperties}>
              <span className={s.n}>{String(i + 1).padStart(2, '0')}</span>
              <div><b>{x.t}</b><span>{x.d}</span></div>
              {x.go && <button type="button" onClick={() => open(x.go!.run())}>{x.go.label}</button>}
            </li>
          ))}
        </ol>
        <p className={s.foot}>
          手机打开本页会全屏进入 App（每次从故事开始）。规范与组件：<a href="/spec">规范</a> · <a href="/playground">组件库</a> · <a href="/preview">方案台</a>
        </p>
      </section>
      <section className={s.stage}>
        <div className={s.milo} aria-hidden="true"><img src="/story/M5.webp" alt="" draggable={false} /></div>
        <div className={s.phoneWrap} style={{ '--k': scale } as CSSProperties}>
          <div ref={phone} className={s.phone}>
            <iframe ref={frame} className={s.screen} src="/" title="慢牛 Milo App" />
          </div>
        </div>
        <button type="button" className={s.reset} onClick={() => open(reset())}>重新开始</button>
      </section>
    </main>
  );
}
