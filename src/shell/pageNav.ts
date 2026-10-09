/** 页面之间怎么走（2026-10-09 走查 1 #01 #02 #06 #08，DESIGN §7 转场表）：
 *  - usePageNav：不是从列表行进来的子页（「我的」→ 牛龄、钱包、消息；钱包 → 商城；商品 → 下单……）进去时从右边推进来，返回时推回去。
 *    back(fallback)：有上一页就回上一页，没有（直接打开的链接）就换到 fallback。
 *  - useSharedList / useSharedDetail：列表 → 详情的共享元素（M03 跨页）：首页处方卡 / 行 → 动作要领、商城商品卡 → 商品详情。
 *    点开时只给被点的那一项起共享名（flushSync 就位后再拍旧快照），详情页按 history state 里的 m03 标记起同名；返回时沿原路缩回去，
 *    列表页这一次让落回的那一项带名、不播入场（转场要拍到完整的那一行），转场放完撤掉。整页的淡出 / 淡入用 M09 钻入同一套（data-vt=drill）。
 *  Tab 之间走横滑（AppShell onTab），都不经过这里。 */
import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate, type NavigateOptions } from 'react-router';
import { pageSwapped, viewTransit } from '../components';
import { T } from '../styles/tokens.gen';

export function usePageNav() {
  const nav = useNavigate();
  return {
    push: (to: string, opts?: NavigateOptions) => viewTransit({ vt: 'push', go: () => nav(to, opts), ready: pageSwapped() }),
    back: (fallback: string) => viewTransit({ vt: 'pop', go: () => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav(fallback, { replace: true })), ready: pageSwapped() }),
  };
}

/** 从详情页缩回来时落回的那一项（模块级：列表页是新挂载的） */
const landing: { id: string | null } = { id: null };

export function useSharedList() {
  const nav = useNavigate();
  const [opening, setOpening] = useState<string | null>(() => landing.id);
  const [landed] = useState(() => !!landing.id);
  useLayoutEffect(() => {
    if (!landed) return;
    landing.id = null;
    const t = window.setTimeout(() => setOpening(null), T['motion/spring-ms'] * 3);
    return () => window.clearTimeout(t);
  }, [landed]);
  const open = (id: string, to: string) => viewTransit({ vt: 'drill', dir: 'in', before: () => flushSync(() => setOpening(id)), go: () => nav(to, { state: { m03: true } }), ready: pageSwapped() });
  return { opening, landed, open };
}

export function useSharedDetail(id: string, fallback: string) {
  const nav = useNavigate(), loc = useLocation(), pn = usePageNav();
  const shared = !!(loc.state as { m03?: boolean } | null)?.m03;
  const back = () => {
    if (!shared || (window.history.state?.idx ?? 0) === 0) { pn.back(fallback); return; }
    landing.id = id;
    viewTransit({ vt: 'drill', dir: 'back', go: () => nav(-1), ready: pageSwapped() });
  };
  return { shared, back };
}
