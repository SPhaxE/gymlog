/** 入口：阶段 5 起由 App 壳接管路由（src/shell/AppShell.tsx）。
 *  /today /body /gains /log /me 是 5 个 Tab；/playground 组件与交互态；/spec 基础规范；/preview 方案台；/check 是 M1 的管线检查。 */
import { AppShell } from './shell/AppShell';

export function App() {
  return <AppShell />;
}
