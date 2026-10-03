import { Explore } from './explore/Explore';
import { TokenCheck } from './pages/TokenCheck';

// 阶段 5：/explore/* 是高保真定稿页（身体、首页）；其余路径仍是 M1 的「管线检查」，M3 换成真正的路由与壳
export function App() {
  const { pathname, search } = window.location;
  if (pathname.startsWith('/explore')) return <Explore path={pathname} query={new URLSearchParams(search)} />;
  return <TokenCheck />;
}
