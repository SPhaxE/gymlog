# 慢牛 Milo · 阶段 2 低保真原型

灰阶、无品牌视觉，P01–P12 全部可交互，F1–F4 能从头点到尾。纯静态，零构建。

## 打开

在线：Vercel 部署的 `/prototype/`（根路径 `/` 自阶段 5 起是真实 App）。

本地（要走 HTTP，不能直接双击 html，因为要 fetch `mock/*.json`）：

```bash
cd gymlog && python3 -m http.server 8765
# 浏览器打开 http://localhost:8765/prototype/
```

## 怎么看

- 右侧是控制面板（窄屏时点 ⚙ 按钮展开）：切**场景**（对应 `mock/scenarios.json`）、切**当前页的状态**、从头开始 **F1–F4**、开关「标注」。
- 「标注」打开后，每页用橙色虚线框标出 ① 第一优先信息 / ② 主操作 / ③ 导航。
- 「注入」开关：存储写入失败、引擎出错、素材缺失/加载失败、加载中、减少动画。
- 「系统返回键」按钮模拟 Android 返回键（先关浮层，再回上一级；今日页连按两次退出）。
- 数据只存在这个浏览器的 `localStorage['milo.proto.v1']`；设置 → 演示 → 「清除全部数据」回到首次建档。

## 目录

| 文件 | 内容 |
|---|---|
| `engine.js` | 处方 / 恢复 / 建议重量 / 减量信号的纯函数引擎（**仅原型用**，阶段 5 用 TS 重写并补 ≥ 40 条测试） |
| `data.js` | 场景 → 应用状态；localStorage 读写 |
| `meta.js` | 每页的第一优先信息、主操作、导航、状态列表；F1–F4 的步骤文字 |
| `ui.js` | 路由、返回键语义、浮层、控制面板、标注 |
| `pages-*.js` | 12 个页面 |

## 自检

```bash
node scripts/verify_prototype.js          # 每个场景触发的状态是否符合预期
python3 scripts/walkthrough.py            # F1–F4 真实点击走查，截图到 screenshots/stage2/
```

注：无头 Chromium 没有 H.264 解码器，P04 的示范视频在自动截图里会落到「没加载出来」，真实 Chrome 正常。
