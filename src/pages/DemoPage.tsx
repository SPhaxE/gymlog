/** /demo：第一版实机演示（阶段 6a 收尾）。
 *  - 宽屏（电脑）：左边是讲解和演示路线，右边一台「手机」——iframe 里就是 App 本体（同源，共用本机存储）。
 *    路线上每一步可以直接跳过去（清空 / 载入演示数据后刷新手机）；手机当前在哪一步，路线上就亮哪一步。
 *  - 窄屏（手机）：不套壳，清空数据后全屏进 App，从故事开始。
 *  数据只在这个浏览器的本机存储里（milo:v1），没有后端。 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Lockup } from '../components';
import { DEFAULT_PROFILE, demoState, store, STORE_KEY } from '../data/store';
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
    const fit = () => { const h = phone.current?.offsetHeight ?? 1; setScale(Math.min(1, (window.innerHeight * 0.92) / h)); };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [desk]);
  // 跟踪手机当前在哪一步（同源 iframe，直接读地址）
  useEffect(() => {
    if (!desk) return;
    const id = window.setInterval(() => { try { setAt(stepOf(frame.current?.contentWindow?.location.pathname ?? '')); } catch { /* 跨源时读不到，不亮 */ } }, 400);
    return () => clearInterval(id);
  }, [desk]);

  const open = (path: string) => { const w = frame.current?.contentWindow; if (w) w.location.replace(path); };
  const reset = () => { store.clear(); return '/onboarding'; };
  const withDemo = (path: string) => () => { store.clear(); store.update((x) => ({ ...x, ...demoState(Date.now()), draft: null })); return path; };

  const steps: Step[] = [
    { id: 'story', t: '初见引导 · 米洛（Milo）的故事', d: '8 幕动画讲清渐进超负荷与超量恢复；第 5 幕光点进荧光段时点「练」。', go: { label: '从头开始', run: reset } },
    { id: 'setup', t: '建档 · 三步', d: '最后一步选「载入演示数据」：一个练了 30 周的进阶用户。', go: { label: '跳过故事', run: () => { store.clear(); store.update((x) => ({ ...x, draft: { step: 1, profile: { ...DEFAULT_PROFILE } } })); return '/onboarding'; } } },
    { id: 'today', t: '今日处方', d: '引擎现算：练哪几个动作、每个加多少；增量尺画出「上次 → 这次」，「为什么是这些」看依据。', go: { label: '载入演示数据', run: withDemo('/today') } },
    { id: 'session', t: '就在首页打卡', d: '点「开始训练」，主角卡原地展开成组行；拇指区一个「打卡」，休息在导航里走；点组行才拉出键盘改数。' },
    { id: 'summary', t: '结算 → 今天已练完', d: '破纪录卡、力竭度、牛龄成长；回到首页是「今天已练完」和恢复进度。' },
    { id: 'body', t: '身体', d: '半身肌肉图 + 容量胶囊，长按胶囊放大，看哪块进了黄金窗。', go: { label: '打开身体页', run: withDemo('/body') } },
    { id: 'gains', t: '增量', d: '页头一个配重片环：近 4 周练的动作里几个在涨、几个持平、几个在退；下面按「该加重 / 保持 / 该减重」色带分组，每行最大的数「下次」就是首页处方里的重量。页头跟着滑走，大标题滑出后顶上收成一条细标题栏（身体、首页同样），部位筛选贴在它下面。', go: { label: '打开增量页', run: withDemo('/gains') } },
    { id: 'trend', t: '动作进步曲线', d: '点增量页的任意一行：大数字是选中那天的预估力量，曲线按住横向拖或点明细的一行切换日期，下面是那天每一组和「下次目标」（和首页、增量页同一个数）；返回回到原来的筛选和滚动位置。', go: { label: '从增量页进一个动作', run: withDemo('/gains') } },
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
          手机打开本页会全屏进入 App（每次从故事开始）。规范与组件：<a href="/playground">组件库</a> · <a href="/brand">品牌</a> · <a href="/lab">实验室</a>
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
