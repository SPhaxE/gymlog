# 慢牛 Milo

自适应训练处方 App（Android，Capacitor 打包；网页版部署在 Vercel）。产品与规范文档在 `docs/`，从 `docs/brief.md` 读起。

| 路径 | 内容 |
|---|---|
| `src/` | App（React 19 + TypeScript + Vite） |
| `android/` | Capacitor Android 工程 |
| `design/tokens/` | 视觉规范唯一源头 `tokens.json` → 生成 `tokens.css` 与 Figma 插件 |
| `design/figma-plugin/` | Figma 导入插件（见其中的 README） |
| `prototype/` · `mock/` | 阶段 2 的低保真原型与演示数据（网页版 `/prototype/`） |
| `public/` | 动作示范视频、MuscleWiki 人体图 |

```bash
npm ci
npm run dev                 # 本地开发
npm run check               # 类型检查 + 测试 + 写死值检查 + 构建（CI 同款）
python3 scripts/build_tokens.py   # 改了 tokens.json 之后
```

APK：推到 `main` 或开 PR 后，GitHub Actions 的 CI 会构建 debug APK（Artifacts 里的 `milo-debug-apk`）。本地有 Android SDK 时也可以 `npm run android:apk`。
