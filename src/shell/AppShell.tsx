/** App 壳（阶段 5）：5 个 Tab 的路由、Android 返回键、悬浮层宿主（Dialog / Toast）。
 *  Tab 根页：/today 首页 · /body 容量（路由沿用 /body） · /gains 增量 · /log 记录 · /me 我的（ia §4）；「我的」的子页：/me/level 牛龄、/me/messages 消息。训练流程等子页在阶段 6 加。
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
import { ExerciseGuidePage } from '../pages/ExerciseGuidePage';
import { HomePage } from '../pages/HomePage';
import { LogDetailPage } from '../pages/LogDetailPage';
import { LevelPage } from '../pages/LevelPage';
import { LogPage } from '../pages/LogPage';
import { MePage } from '../pages/MePage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { GuidePage } from '../pages/GuidePage';
import { ItemPage } from '../pages/ItemPage';
import { OrderPage } from '../pages/OrderPage';
import { ShopPage } from '../pages/ShopPage';
import { WalletPage } from '../pages/WalletPage';
import { ProPage } from '../pages/ProPage';
import { ProHubPage } from '../pages/ProHubPage';
import { MessagesPage } from '../pages/MessagesPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { SummaryPage } from '../pages/SummaryPage';
import { store, useStore } from '../data/store';
import { useRestEndBuzz } from '../data/useRestEndBuzz';
import { backAction } from './back';
import s from './Shell.module.css';

// 规范页与检查页按需加载，不进 App 主包
const Playground = lazy(() => import('../pages/Playground').then((m) => ({ default: m.Playground })));
const Preview = lazy(() => import('../pages/Preview').then((m) => ({ default: m.Preview })));
const OptionsBoard = lazy(() => import('../pages/OptionsBoard').then((m) => ({ default: m.OptionsBoard })));

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
      <Route path="/summary/:id" element={<SummaryPage />} />
      <Route path="/today" element={needProfile ?? tab(<HomePage scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/body" element={needProfile ?? tab(<BodyPage key={scenario} scenario={scenario} now={now} onTab={onTab}
        initialFocus={focus && focus !== "none" ? focus : null} />)} />
      <Route path="/gains" element={needProfile ?? tab(<GainsPage key={scenario} scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/gains/:exerciseId" element={needProfile ?? <TrendPage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/exercise/:id" element={needProfile ?? <ExerciseGuidePage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/log" element={needProfile ?? tab(<LogPage key={scenario} scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/log/:id" element={needProfile ?? <LogDetailPage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/me" element={needProfile ?? tab(<MePage key={scenario} scenario={scenario} now={now} onTab={onTab} />)} />
      <Route path="/me/level" element={needProfile ?? <LevelPage key={scenario} scenario={scenario} now={now} />} />
      <Route path="/me/messages" element={needProfile ?? <MessagesPage key={scenario} scenario={scenario} now={now} />} />
      <Route path="/me/wallet" element={needProfile ?? <WalletPage key={scenario} scenario={scenario} now={now} />} />
      <Route path="/me/pro" element={needProfile ?? <ProHubPage key={scenario} scenario={scenario} now={now} />} />
      <Route path="/pro" element={needProfile ?? <ProPage key={scenario} scenario={scenario} now={now} />} />
      <Route path="/shop" element={needProfile ?? <ShopPage key={scenario} scenario={scenario} now={now} />} />
      <Route path="/shop/guide/:id" element={needProfile ?? <GuidePage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/shop/item/:id" element={needProfile ?? <ItemPage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/shop/checkout" element={needProfile ?? <CheckoutPage key={loc.search} scenario={scenario} now={now} />} />
      <Route path="/shop/order/:id" element={needProfile ?? <OrderPage key={loc.pathname} scenario={scenario} now={now} />} />
      <Route path="/playground" element={<Playground now={now} />} />
      {/* /preview = 方案台（2026-10-06 用户）；原来的基础规范页挪到 /spec */}
      <Route path="/preview" element={<OptionsBoard now={now} />} />
      <Route path="/spec" element={<Preview />} />
      {/* 2026-10-07 地址各司其职：/brand 并进 /spec 第 6 章；/check 的构建信息在 /spec 页头；/lab 的内容全在 /playground 与 App 里 */}
      <Route path="/brand" element={<Navigate to="/spec#brand" replace />} />
      <Route path="/check" element={<Navigate to="/spec" replace />} />
      <Route path="/lab" element={<Navigate to="/playground" replace />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
    </Suspense>
  );
}

/** 休息结束振动：单独一个空组件，倒计时每次刷新只重渲染它，不牵动整个路由树 */
function RestEndBuzz() { useRestEndBuzz(); return null; }

/** 路由更新不走 transition（BrowserRouter useTransitions={false}）：休息倒计时每 200 毫秒刷一次，页面重时 transition 渲染会被一次次打断重来，点了 Tab 迟迟不切（CI 与整套测试里出现过）；同步提交也让切 Tab 的共享元素转场更可预期 */
export function AppShell() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <BrowserRouter useTransitions={false}>
      <ToastProvider>
        <OverlayHost.Provider value={host}>
          <Routed />
          <RestEndBuzz />
          <div ref={setHost} className={s.layer}><ToastViewport /></div>
        </OverlayHost.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
}
