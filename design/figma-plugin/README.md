# Milo Design System Import（Figma 开发插件）

把仓库里的规范导入 Figma。**仓库是唯一源头**：在 Figma 里手改的值，下次运行插件会被覆盖；要改就改仓库，重新生成，再运行。

## 三个命令（Plugins → Development → Milo Design System Import）

| 命令 | 做什么 |
|---|---|
| 1 · 导入 Foundations | 变量集合 `Milo · Primitives` / `Milo · Tokens`、`Milo/` 样式、说明分区「Foundations · 配重片」 |
| 2 · 导入组件 | 同步变量与样式，再生成 / 更新分区「Components · 配重片」里的 16 个组件（NavPill、Capsule、BodyFigure……） |
| 3 · 生成标杆页 P06 | 同步变量、样式、组件，再重画分区「Benchmark · P06」：放大镜、详情面板、空态三张 360×800 画板 |

每个命令都会先把变量和样式按仓库同步一遍，所以只运行 3 也能得到全部内容。

## 第一次导入 / 更新

1. 拉代码（已有就在仓库目录里 `git pull`）：
   ```bash
   cd ~ && git clone https://github.com/SPhaxE/gymlog.git && cd gymlog
   ```
2. 用 **Figma 桌面版**打开「慢牛 Milo Design System」。
3. 第一次：菜单 **Plugins → Development → Import plugin from manifest…**，选 `gymlog/design/figma-plugin/manifest.json`。仓库位置没变的话，以后不用再导入。
4. 菜单 **Plugins → Development → Milo Design System Import →** 选命令运行。

## 只会动这些东西

- 名为 `Milo · Primitives`、`Milo · Tokens` 的变量集合；名字以 `Milo/` 开头的样式；仓库里删掉的会被移除。
- 当前页上的三个分区：「Foundations · 配重片」「Components · 配重片」「Benchmark · P06」（都带「插件生成，勿手改」）。
  - 组件分区里的组件和变体**保留节点 ID**，只重建内部，已经放出去的实例不会断。
  - 说明分区和标杆页每次整块重画。

别的图层、页面和样式都不碰。插件不联网（`networkAccess: none`）。

## 改值之后

```bash
python3 scripts/build_tokens.py        # 校验对比度并重新生成 code.js 和 tokens.css
node scripts/test_figma_plugin.cjs      # 用模拟的 Figma API 自检（62 项）
```

## 字体

Space Grotesk、Noto Sans SC（含 Black）、JetBrains Mono，都是 Google Fonts，Figma 一般自带。某个字重不可用时，插件暂用相近字重或 Inter，提示里会写「N 条提醒」（详情在 Plugins → Development → Show/Hide console）。

## 文件

| 文件 | 说明 |
|---|---|
| `manifest.json` | 插件清单（`documentAccess: dynamic-page`，三个菜单命令） |
| `src/plugin.js` | 公共工具与常量（`__MILO_DATA__` 是占位） |
| `src/foundations.js` · `src/components.js` · `src/benchmark.js` · `src/main.js` | 三个命令的实现与入口 |
| `code.js` | **生成物**：按上面的顺序拼接，内嵌 Token、纹理、人体图（`public/bodymap/`）与标杆页数据（`design/benchmark/p06.json`）。勿手改 |
