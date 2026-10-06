/** Android 返回键（ia §3）：先关最上面的悬浮层；非首页的 Tab 根页回首页；首页退出 App；其余子页返回上一页。
 *  训练中（P03）回首页、训练不丢（首页变「继续训练」）；结算（P05）回首页（不能退回到训练）。建档的「上一步」由页面自己接（useBackHandler）。 */
import { TABS } from '../components';

export type BackAction = 'overlay' | 'home' | 'exit' | 'pop';
const ROOTS: string[] = TABS.map(([, , path]) => path);

export function backAction(pathname: string, overlayOpen: boolean): BackAction {
  if (overlayOpen) return 'overlay';
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/today' || p === '/') return 'exit';
  if (ROOTS.includes(p) || p === '/session' || p.startsWith('/summary/')) return 'home';
  return 'pop';
}
