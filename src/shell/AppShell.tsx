/** App 壳（阶段 5）：5 个 Tab 的路由、Android 返回键、悬浮层宿主（Dialog / Toast）。
 *  Tab 根页：/today 首页 · /body 身体 · /gains 增量 · /log 记录 · /me 我的（ia §4）。训练流程等子页在阶段 6 加。
 *  ?scenario= 选演示场景，?now= 固定时间（截图用）。 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { FluidBackdrop, OverlayHost, ScreenAtmosphere, ToastProvider, ToastViewport, handleBack, type Tab } from '../components';
import { BodyPage } from '../pages/BodyPage';
import { HomePage } from '../pages/HomePage';
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
  const q = new URLSearchParams(loc.search);
  const now = Number(q.get('now')) || Date.now();
  const onTab = (_: Tab, path: string) => nav(path + loc.search);
  const focus = q.get('focus');
  // Tab 根页最底层：流体噪点渐变（A4 追加）；训练流程等子页不用
  const tab = (el: React.ReactNode) => <ScreenAtmosphere.Provider value={<FluidBackdrop />}>{el}</ScreenAtmosphere.Provider>;
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<Navigate to={'/today' + loc.search} replace />} />
      <Route path="/today" element={tab(<HomePage scenario={q.get('scenario') ?? 'plain-prescription'} now={now} onTab={onTab} />)} />
      <Route path="/body" element={tab(<BodyPage key={q.get('scenario')} scenario={q.get('scenario') ?? 'done-today'} now={now} onTab={onTab}
        initialFocus={focus && focus !== "none" ? focus : null} />)} />
      <Route path="/gains" element={tab(<TabStub tab="gains" onTab={onTab} />)} />
      <Route path="/log" element={tab(<TabStub tab="log" onTab={onTab} />)} />
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

export function AppShell() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <BrowserRouter>
      <ToastProvider>
        <OverlayHost.Provider value={host}>
          <Routed />
          <div ref={setHost} className={s.layer}><ToastViewport /></div>
        </OverlayHost.Provider>
      </ToastProvider>
    </BrowserRouter>
  );
}
