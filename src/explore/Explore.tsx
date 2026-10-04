/** 高保真探索页（第 3 步 · 代码定稿）：/explore/body、/explore/home。
 *  查询参数：?scenario=<mock/scenarios.json 的场景>；身体页 ?focus=<肌头 id>（默认停在「中下胸」被按住），?focus=none 为静止态。
 *  定稿通过后拆进 src/components 与正式路由（M3），本目录删除。 */
import { BodyPage } from './BodyPage';
import { HomePage } from './HomePage';

export function Explore({ path, query }: { path: string; query: URLSearchParams }) {
  const page = path.replace(/^\/explore\/?/, '').split('/')[0] || 'body';
  const now = Number(query.get('now')) || Date.now();
  if (page === 'home') return <HomePage scenario={query.get('scenario') ?? 'plain-prescription'} now={now} />;
  const focus = query.get('focus');
  return <BodyPage scenario={query.get('scenario') ?? 'done-today'} now={now} initialFocus={focus === 'none' ? null : focus ?? 'mid-lower-pectoralis'} />;
}
