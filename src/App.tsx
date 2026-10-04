import { BodyPage } from './pages/BodyPage';
import { HomePage } from './pages/HomePage';
import { Preview } from './pages/Preview';
import { TokenCheck } from './pages/TokenCheck';

// 阶段 5：/explore/home、/explore/body 是高保真定稿页；/preview 是活的规范（组件与 Token 一览）；
// 其余路径仍是 M1 的「管线检查」。M3 换成正式路由与壳（/today、/body…）。
export function App() {
  const { pathname, search } = window.location;
  const q = new URLSearchParams(search);
  const now = Number(q.get('now')) || Date.now();
  if (pathname.startsWith('/preview')) return <Preview now={now} />;
  if (pathname.startsWith('/explore/home')) return <HomePage scenario={q.get('scenario') ?? 'plain-prescription'} now={now} />;
  if (pathname.startsWith('/explore')) {
    const focus = q.get('focus');
    return <BodyPage scenario={q.get('scenario') ?? 'done-today'} now={now} initialFocus={focus === 'none' ? null : focus ?? 'mid-lower-pectoralis'} />;
  }
  return <TokenCheck />;
}
