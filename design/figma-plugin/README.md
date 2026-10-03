# Milo Foundations Import（Figma 开发插件）

把仓库里的 `design/tokens/tokens.json` 一次性导入 Figma：变量、文字样式、效果样式、填充样式，以及一块说明分区。
**仓库是唯一源头**：在 Figma 里手改的值，下次运行插件会被覆盖；要改就改 `tokens.json`，再重新生成、重新运行。

## 第一次导入

1. 把仓库拉到本地（已有就 `git pull`）：
   ```bash
   git clone https://github.com/SPhaxE/gymlog.git && cd gymlog
   ```
2. 用 **Figma 桌面版**打开「慢牛 Milo Design System」文件（开发插件只能在桌面版里导入）。
3. 菜单 **Plugins → Development → Import plugin from manifest…**，选 `gymlog/design/figma-plugin/manifest.json`。
4. 菜单 **Plugins → Development → Milo Foundations Import** 运行。几秒后右下角提示「新建 / 更新 / 移除」各多少条。

导入后：
- 变量面板里有两个集合：`Milo · Primitives`（原始色，已隐藏，不直接用）和 `Milo · Tokens`（语义色、尺寸、字号、动效等，只用这个）。
- 样式都在 `Milo/` 下：文字 15 个、效果 3 个、填充 5 个。
- 当前页上多一块分区「Foundations · 配重片（插件生成，勿手改）」，放在已有内容的右边。

## 之后改值

```bash
# 1. 改 design/tokens/tokens.json
python3 scripts/build_tokens.py        # 校验对比度并重新生成 code.js 和 tokens.css
node scripts/test_figma_plugin.js      # 用模拟的 Figma API 自检
# 2. 在 Figma 里再运行一次插件（不用重新导入 manifest）
```

再次运行只会更新同名的变量和样式，ID 不变，已经绑定到它们的图层不会断开。说明分区会整块重画。

## 只会动这些东西

- 名为 `Milo · Primitives`、`Milo · Tokens` 的两个变量集合：仓库里删掉的变量会被移除。
- 名字以 `Milo/` 开头的样式：仓库里删掉的样式会被移除。
- 当前页上名为「Foundations · 配重片（插件生成，勿手改）」的分区。

别的图层、页面和样式都不碰。插件不联网（`networkAccess: none`）。

## 字体

需要 Space Grotesk、Noto Sans SC（含 Black）、JetBrains Mono。它们都是 Google Fonts，Figma 一般自带。
如果某个字重不可用，插件会暂用同族的相近字重或 Inter，并在提示里写「N 条提醒」（详情在 Plugins → Development → Show/Hide console）。装好字体后再运行一次即可修正。

## 文件

| 文件 | 说明 |
|---|---|
| `manifest.json` | 插件清单（`documentAccess: dynamic-page`） |
| `src/plugin.js` | 插件源码，`__MILO_DATA__` 是占位 |
| `code.js` | **生成物**：源码 + 内嵌的 Token 与纹理。勿手改 |
