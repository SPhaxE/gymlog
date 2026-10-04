/** Android 返回键（ia §3）：先关最上面的悬浮层；非首页的 Tab 根页回首页；首页退出 App；其余子页返回上一页。 */
import { TABS } from '../components';

export type BackAction = 'overlay' | 'home' | 'exit' | 'pop';
const ROOTS: string[] = TABS.map(([, , path]) => path);

export function backAction(pathname: string, overlayOpen: boolean): BackAction {
  if (overlayOpen) return 'overlay';
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/today' || p === '/') return 'exit';
  if (ROOTS.includes(p)) return 'home';
  return 'pop';
}
