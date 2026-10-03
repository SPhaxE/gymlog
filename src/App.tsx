import { TokenCheck } from './pages/TokenCheck';

// 阶段 5 · M1：先只有一页「管线检查」，确认 Token、字体在 Web 与 APK 里都对；M3 换成真正的路由与壳
export function App() {
  return <TokenCheck />;
}
