# 慢牛 Milo

给进阶健身者的增量引擎：**渐进超负荷 × 超量恢复**。React + TypeScript + Vite 网页 App，用 Capacitor 打包成 Android APK，网页版部署在 Vercel。

- **实机演示**：<https://gymlog-taupe.vercel.app/demo>（电脑上是带讲解的手机壳，手机上全屏进入）
- **接手先读**：[`HANDOFF.md`](HANDOFF.md)（现状、架构、命令、管线、约束、下一步）
- **产品与规范**：`docs/brief.md`（产品简报与决定记录）→ `docs/ia.md`（信息架构与功能规格）→ `docs/DESIGN.md`（视觉与组件规范）

## 目录

| 路径 | 内容 |
|---|---|
| `src/` | App：`engine/` 引擎（纯函数，处方、恢复、成长）· `data/` 本机存储与演示数据 · `components/` 组件库 · `pages/` 页面 · `shell/` 路由与返回键 · `playground/` 组件目录 · `lab/` 品牌与实验页 |
| `public/` | 静态素材：动作视频 `exercises/`、MuscleWiki 人体图 `bodymap/`、IP 小牛 `mascot/`、故事素材 `story/`、商品图 `shop/`（后三者由 `scripts/*_png.py` 生成） |
| `design/` | `tokens/` 规范唯一源头（`tokens.json` → `tokens.css` 与 Figma 插件）· `figma-plugin/` · `brand/` IP 母版、出图提示词、故事分镜 · `wireframes/` 线框 · `hifi/` 高保真（Stitch 工具与各轮方案）· `benchmark/` `stage3/` 历史 |
| `docs/` | 文字文档；`sources/` 原始素材（AI 出图源文件、参考图、用户反馈图）；`archive/` 旧阶段交接 |
| `scripts/` | Token 生成、写死值检查、素材管线（抠图）、截图门禁 |
| `screenshots/` | 各阶段截图（`stage6a/` 是当前闭环） |
| `mock/` · `prototype/` | 阶段 2 的演示场景数据（引擎测试仍在用）与低保真原型（只读历史，网页版 `/prototype/`） |
| `android/` · `apk/` | Capacitor 工程；`main` 每次更新后 CI 自动提交的最新 debug APK |

## 命令

```bash
npm ci
npm run dev                  # 本地开发（http://localhost:5173）
npm run check                # 类型检查 + 测试 + 写死值检查 + 构建（CI 同款）
python3 scripts/build_tokens.py          # 改了 design/tokens/tokens.json 之后
python3 scripts/build_tokens.py --check  # CI：对比度与引用
node scripts/test_figma_plugin.cjs       # CI：Figma 插件 mock 测试
npm run shots:6a             # 先 npx vite --port 5199；核心闭环 + 故事 8 幕 + /demo 截图门禁
npm run shots:playground     # 全部组件 × 交互态门禁
```

APK：最新版在 [`apk/milo-debug.apk`](apk/)（见 `apk/BUILD.md`）；PR 上的构建在工作流 Artifacts（`milo-debug-apk`）。本地有 Android SDK 时 `npm run android:apk`。
