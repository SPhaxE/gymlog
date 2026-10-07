/** 入口：阶段 5 起由 App 壳接管路由（src/shell/AppShell.tsx）。
 *  /today /body /gains /log /me 是 5 个 Tab；/playground 组件库（全部组件 × 交互态 + 动效演示）；/spec 规范（Token、版式、品牌、构建信息）；/preview 方案台（待选与落选方案）；/demo 实机演示。 */
import { AppShell } from './shell/AppShell';

export function App() {
  return <AppShell />;
}
