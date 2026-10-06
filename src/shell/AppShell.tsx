/** App 壳（阶段 5）：5 个 Tab 的路由、Android 返回键、悬浮层宿主（Dialog / Toast）。
 *  Tab 根页：/today 首页 · /body 身体 · /gains 增量 · /log 记录 · /me 我的（ia §4）。训练流程等子页在阶段 6 加。
 *  ?scenario= 选演示场景，?now= 固定时间（截图用）。 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Banner, Button, FluidBackdrop, OverlayHost, ScreenAtmosphere, ToastProvider, ToastViewport, guardTransitionTaps, handleBack, navHandoff, type Tab } from '../components';
import { T } from '../styles/tokens.gen';
import { BodyPage } from '../pages/BodyPage';
import { DemoPage } from '../pages/DemoPage';
import { GainsPage } from '../pages/GainsPage';
import { TrendPage } from '../pages/TrendPage';
import { HomePage } from '../pages/HomePage';
import { LogDetailPage } from '../pages/LogDetailPage';
import { LogPage } from '../pages/LogPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { SummaryPage } from '../pages/SummaryPage';
import { store, useStore } from '../data/store';
import { backAction } from './back';
import { Pattern } from './Patterns';
import { TabStub } from './TabStub';
import s from './Shell.module.css';

// 规范页与检查页按需加载，不进 App 主包
const Playground = lazy(() => import('../pages/Playground').then((m) => ({ default: m.Playground })));
const Preview = lazy(() => import('../pages/Preview').then((m) => ({ default: m.Preview })));
const Lab = lazy(() => import('../lab/Lab').then((m) => ({ default: m.Lab })));
const Brand = lazy(() => import('../lab/Brand').then((m) => ({ default: m.Brand })));
const TokenCheck = lazy(() => import('../pages/TokenCheck').then((m) => ({ default: m.TokenCheck })));

function useBackButton() {
  const nav = useNavigate(), loc = useLocation();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const sub = CapApp.addListener('backButton', () => {
      const a = backAction(loc.pathname, false);
      if (handleBack()) return;
      if (a === 'home') nav('/today' + loc.search, { replace: true });
      else if (a === 'exit') void CapApp.exitApp();
      else nav(-1);
    });
    return () => { void sub.then((h) => h.remove()); };
  }, [nav, loc]);
}

function Routed() {
  const nav = useNavigate(), loc = useLocation();
  useBackButton();
  useEffect(() => { guardTransitionTaps(); }, []);  // 转场进行中点按会落在 <html> 上：改成点坐标处的真元素（motion.tsx）
  const q = new URLSearchParams(loc.search);
  const now = Number(q.get('now')) || Date.now();
  // 切 Tab：休息计时在走时，首页的计时胶囊下滑消失，只有里面的进度条借 View Transitions 飞进被点的导航滑块（反过来亦然，Nav.tsx 的 REST_RING_VT）。
  // 只有首页这一头有胶囊：别的 Tab 之间互切照旧，进度条在滑块里跟着滑，不走转场
  const onTab = (_: Tab, path: string) => {
    const go = () => nav(path + loc.search);
    const leaving = loc.pathname === '/today' && !!document.querySelector('[style*="x-rest-timer"]');
    const returning = path === '/today' && loc.pathname !== '/today' && !!document.querySelector('[style*="x-rest-ring"]');
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<unknown> } };
    if (!(leaving || returning) || !doc.startViewTransition || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    if (leaving) navHandoff.skipSlide = true;  // 目标页的滑块直接停好，进度条才飞得到准确的落点
    const html = document.documentElement;
    html.dataset.restFly = leaving ? 'out' : 'in';
    // 路由更新不是同步提交的：等目标页的导航选中项出现了再拍「新」快照（最多等 motion/slow）；转场回调期间页面暂停渲染、rAF 不跑，所以用 setTimeout 轮询
    const vt = doc.startViewTransition(() => new Promise<void>((done) => {
      go();
      const t0 = performance.now();
      const ready = () => (document.querySelector(`nav [aria-current="page"][href="${path}"]`) || performance.now() - t0 > T['motion/slow'] ? done() : window.setTimeout(ready, 16));
      ready();
    }));
    void vt.finished.finally(() => { delete html.dataset.restFly; });
  };
  const focus = q.get('focus');
  // 数据源：?scenario= 走演示场景（截图、回归）；否则读本机存储，没建档先去故事引导 + 建档（ia §4 P12）
  const st = useStore();
  const scenario = q.get('scenario') ?? undefined;
  const needProfile = !scenario && !st.profile ? <Navigate to="/onboarding" replace /> : null;
  // Tab 根页最底层：流体噪点渐变（A4 追加）；训练流程等子页不用
  const tab = (el: React.ReactNode) => <ScreenAtmosphere.Provider value={<FluidBackdrop />}>{el}</ScreenAtmosphere.Provider>;
  return (
    <Suspense fallback={null}>
    {/* 本机存储写入失败：不静默（ia §1.1 / §1.5），数据还在内存里，可以重试 */}
    {st.saveError && <div className={s.saveError}><Banner tone="error" title="没能保存到本机" detail="刚才的改动还在，重试一次；一直失败请检查是否开了无痕模式或存储已满"
      actions={<Button kind="ghost" size="s" onClick={() => store.retry()}>重试</Button>} /></div>}
    <Routes>
      <Route path="/" element={<Navigate to={'/today' + loc.search} replace />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/onboarding" element={st.profile ? <Navigate to="/today" replace /> : <OnboardingPage now={now} />} />
      {/* 训练在首页打卡（2026-10-06 取消独立训练页）；旧地址回首页 */}
      <Route path="/session" element={<Navigate to="/today" replace />} />
      <Route path="/summary/:id" element={<SummaryPage />} />
      <Route path="/today" element={needProfile ?? tab(<HomePage scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/body" element={needProfile ?? tab(<BodyPage key={scenario} scenario={scenario} now={now} onTab={onTab}
        initialFocus={focus && focus !== "none" ? focus : null} />)} />
      <Route path="/gains" element={needProfile ?? tab(<GainsPage key={scenario} scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/gains/:exerciseId" element={needProfile ?? <TrendPage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/log" element={needProfile ?? tab(<LogPage key={scenario} scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/log/:id" element={needProfile ?? <LogDetailPage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/me" element={tab(<TabStub tab="me" onTab={onTab} />)} />
      <Route path="/patterns/:kind" element={tab(<PatternRoute onTab={onTab} />)} />
      <Route path="/playground" element={<Playground now={now} />} />
      <Route path="/preview" element={<Preview />} />
      <Route path="/lab" element={<Lab now={now} />} />
      <Route path="/brand" element={<Brand />} />
      <Route path="/check" element={<TokenCheck />} />
      {/* 旧地址（阶段 3 的高保真探索）：/explore/home → /today，其余 → /body；保留 focus 默认值以便对照旧截图 */}
      <Route path="/explore/home" element={<Navigate to={'/today' + loc.search} replace />} />
      <Route path="/explore/*" element={<Navigate to={'/body' + (loc.search || '?focus=mid-lower-pectoralis')} replace />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
    </Suspense>
  );
}

function PatternRoute({ onTab }: { onTab: (t: Tab, path: string) => void }) {
  const kind = useLocation().pathname.split('/').pop() ?? 'loading';
  return <Pattern kind={kind} onTab={onTab} />;
}

/** 路由更新不走 transition（BrowserRouter useTransitions={false}）：休息倒计时每 200 毫秒刷一次，页面重时 transition 渲染会被一次次打断重来，点了 Tab 迟迟不切（CI 与整套测试里出现过）；同步提交也让切 Tab 的共享元素转场更可预期 */
export function AppShell() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <BrowserRouter useTransitions={false}>
      <ToastProvider>
        <OverlayHost.Provider value={host}>
          <Routed />
          <div ref={setHost} className={s.layer}><ToastViewport /></div>
        </OverlayHost.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
}
