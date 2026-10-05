# 交接报告 · 慢牛 Milo（2026-10-06，阶段 6a 完成）

> 给接手的人或客户端（Claude Code 本地版、Cursor、Codex……）。先读这一页，再按需看 `docs/`。
> 用户写中文、要结论先行；所有对外文字（App 文案、文档、提交信息）用中文。

## 0. 一句话现状

- **主流程闭环已经能用**：故事引导 → 建档 → 载入演示数据 → 首页处方 → 训练（数字键盘）→ 结算（新纪录 / 成长）→ 首页「今天已练完」。
- **第一版实机演示已上线**：<https://gymlog-taupe.vercel.app/demo>。这是现有 Vercel 域名下的一个路径，不是新域名；要独立域名，需要在 Vercel 项目的 Domains 里加。
- **5 个 Tab 里，首页和身体是真页面**；增量、记录、我的还是占位（阶段 6b 起做）。
- **门禁全绿**：
  - `tsc`
  - vitest 207 项
  - 写死值检查
  - Token 校验
  - Figma 插件 62 项
  - 构建
  - `shots:playground`（70 个组件、524 个变体）
  - `shots:6a`

## 1. 产品与决定

| 读什么 | 为什么 |
|---|---|
| `docs/brief.md` | 产品简报。末尾的**决定记录表**是所有用户拍板的出处，改范围前先查它，新的决定也记在这里。 |
| `docs/ia.md` | 信息架构：§0 任务、§1 功能规格、§3 站点地图、§4 页面与路由（P01–P21）、§5 流程、§6 页面框架。 |
| `docs/DESIGN.md` | 视觉与组件规范：Token、组件、动效、IP、§9 组件矩阵与 App 壳路由。 |
| `design/brand/story/storyboard.md` | 初见引导的分镜。 |
| `docs/signature-nav.md` · `docs/refs-elements.md` · `docs/8motions.md` | 导航胶囊环、参考要素、8 条动效。 |

**定位**（用户原话）：给进阶健身爱好者直接使用的「渐进超负荷 + 超量恢复」增量引擎。

**工作方式**：用户坚持交互设计五层模型（战略 → 范围 → 结构 → 框架 → 表现），**视觉效果优先**（「效果第一」「动效要非常有感觉」）。

一页新页面的标准流程：

1. 灰阶线框 2–3 个方案（`design/wireframes/`），用户选；
2. Stitch 多方案（`design/hifi/`），用户选或混搭；
3. 用代码定稿，截图对比后交用户验收。

有线框的页面可以直接写代码（6a 起用户同意）。

## 2. 硬约束（不要破）

1. **密钥不进仓库，也不打印**。Stitch 密钥只在本机：读环境变量 `STITCH_API_KEY`，或 `~/.claude.json` 里名为 stitch 的 MCP 配置（`design/hifi/tools/stitch.py`）。
2. **不关 TLS 校验**。沙盒 Chromium 不信任代理证书，外部资源由 Python 代取（`render_stitch.py`）。
3. **人体图只用真实的 MuscleWiki 素材**（`public/bodymap/`）。AI 画的肌肉只能当参考，不能当素材。
4. **演示商家、品牌一律虚构**，价格是示例；付费墙和支付只做演示链路。**不仿冒真实品牌**。
5. **文案里跟 Milo 有关的地方一律写英文「Milo」**；只有介绍时（故事引导、品牌命名）写「米洛（Milo）」。
6. **组件、页面、实验页里不写死 px、ms 和十六进制颜色**，一律用 Token（`var(--milo-*)`）。`npm run check:hardcoded` 会拦。
7. **荧光只给每屏唯一的焦点**（主按钮、新纪录、黄金窗）。训练中的页面不用 glow。
8. **`docs/` 不会拷进网页版 dist，`design/` 会**（`scripts/copy_static.mjs`）。所以线框和高保真能在 `/design/...` 在线看。
9. **数据只在本机**：`localStorage` 键 `milo:v1`，无账号、无后端。

## 3. 架构

```
src/
  engine/      纯函数引擎：处方 prescribe、恢复 / 容量 headStats、PR 与记录 records、减量 deload、成长 growth（牛龄、连胜、牛劲、奖励事件）
               growth.sim.ts = 三类用户的长期模拟（定门槛、演示数据都用它）；mock/ 场景供引擎测试与 ?scenario=
  data/        store.ts   本机存储（useSyncExternalStore，一个键整份 JSON，写失败可重试）+ demoState（模拟 30 周 + 辅助动作）
               session.ts 训练进行中的全部操作（开始、改格、完成一组、加组、跳过、休息、结束 → 写历史）
               demo.ts    页面数据（homeData / bodyData）：传场景名走 mock，传 Source 走本机存储
               growth.ts  奖励文案、商品表
  components/  组件库（index.ts 统一导出；每个导出都要在 playground/catalog.tsx 有条目，测试会查）
  pages/       Home、Body、Onboarding（+ StoryScreens 故事 8 幕）、Session、Summary、Demo、Playground、Preview、TokenCheck
  shell/       AppShell 路由（没建档 → /onboarding）、Android 返回键 back.ts、TabStub 占位、Patterns 数据态
  playground/  /playground 组件目录（全部组件 × 交互态 + 交互演示）
  lab/         /brand IP 与 Logo 评审、/lab 参考要素实验
```

**路由**（详见 `docs/DESIGN.md` §9.5）：

| 路由 | 页面 |
|---|---|
| `/onboarding` | 故事引导 → 建档 3 步 |
| `/today` | 首页（今日处方） |
| `/body` | 身体 |
| `/session` | 训练进行中 |
| `/summary/:id` | 训练结算 |
| `/gains` · `/log` · `/me` | 增量 · 记录 · 我的（占位） |
| `/demo` | 实机演示 |
| `/playground` · `/preview` · `/brand` · `/lab` | 组件目录 · 基础规范 · IP 与 Logo · 参考要素实验 |

调试参数：

- `?scenario=<名字>`：走 mock 场景，不读本机存储，截图用。场景名见 `mock/scenarios.json`，如 `plain-prescription`、`done-today`。
- `?now=<毫秒>`：固定时间。
- `?scene=N`：故事从第 N 幕开始，N 从 1 起。

**技术栈**：

- React 19、react-router 8、Vite、TypeScript、vitest + jsdom；
- Capacitor 8（Android）；
- 字体：Noto Sans SC、Barlow Condensed（数字）、JetBrains Mono；
- `zustand` 在依赖里但没用到，可以删。

## 4. 命令

```bash
npm ci && npm run dev           # 开发
npm run check                   # = CI 的 web job（typecheck + test + hardcoded + build）
python3 scripts/build_tokens.py [--check]   # 改 design/tokens/tokens.json 后重生成 tokens.css、tokens.gen.ts、Figma 插件
node scripts/test_figma_plugin.cjs
# 截图门禁（先 npx vite --port 5199 --host 127.0.0.1）
python3 scripts/shoot_6a.py         # 闭环 + 故事 8 幕 + /demo → screenshots/stage6a/
python3 scripts/shoot_playground.py # 组件矩阵 + App 壳 → screenshots/stage5/
python3 scripts/shoot_growth.py     # 奖励弹窗 GIF → screenshots/growth/
```

- Python 依赖：`playwright`（截图）、`numpy`、`opencv-python-headless`、`Pillow`（抠图）；`torch` 只在重跑小牛超分时需要。
- Playwright 用系统里的 Chromium，用 `--chromium` 或环境变量 `CHROMIUM` 指定路径。
- 底部固定的按钮，Playwright 会判成「在视口外」，脚本里改用按坐标点击。

**CI**（`.github/workflows/ci.yml`）：

- `web` job 跑上面的检查；
- `android` job 打 debug APK；
- `main` 上的 APK 会自动提交到 `apk/milo-debug.apk`，带 `[skip ci]`。

**Vercel**：

- `main` 自动部署生产；PR 有预览部署；
- SPA 改写规则见 `vercel.json`，静态文件优先；
- 只改了 `apk/` 的提交不触发构建（`ignoreCommand`）。

**合并流程**（用户约定）：

1. 开 PR；
2. 等 CI 绿；
3. 用 merge 方式合并（不用 squash）；
4. 等 Vercel 生产部署完成。

提交信息末尾带协作者署名（见 git log）。

## 5. 素材管线

| 素材 | 源文件（用户用 Nano Banana 出图） | 提示词 | 脚本 | 产物 |
|---|---|---|---|---|
| IP 小牛：5 种牛龄 × 6 种状态 | `docs/sources/mascot/A.jpg`、`B1–B5.jpg`、`B5-noglow.jpg`（Milo） | `design/brand/prompts/nanobanana-ip-hd.md` | `scripts/mascot_png.py` | `public/mascot/`、`src/components/mascotAssets.ts` |
| 故事人物与场景 | `docs/sources/story/`：M1–M6、S1-far、S1-mid、S1-near、S2；备选在 `alt/` | `nanobanana-milo-story.md` | `scripts/story_png.py` | `public/story/`、`design/brand/story/`、`src/pages/storyAssets.ts` |
| 商城商品 | `docs/sources/shop/<id>.jpg` | `nanobanana-shop.md` | `scripts/shop_png.py` | `public/shop/`、`design/brand/shop/` |

**抠图做法**（`mascot_png.matte`）：

- 出图一律用品红纯色底，从边缘反解透明度；
- `key=1` 用绿色通道当键，`key='magenta'` 用 min(R,B)−G 当键；
- `shrink`：实心区往里收，防粉边；
- `open_bg_holes`：被包住的底色洞也挖空，**小牛不能用**，它的眼睛和底色一样暗；
- 成品尺寸上羽化，σ = 0.7。

**Stitch**：

- 工具在 `design/hifi/tools/`，用法见那里的 README；
- 每个方案单独建一个 Stitch 项目，否则会趋同；
- Stitch 有时生成卡住，等一会儿或重跑 `run_round.py`（可断点续跑）。

## 6. 阶段 6a 交付了什么

| 页面 | 要点 | 文件 |
|---|---|---|
| 初见引导 P12 | 8 幕 Stories 式动画：两千五百年前 → 每天扛小牛（kg 刻度尺）→ 渐进超负荷（第 1 → 1460 天，30 → 450 kg）→ 超量恢复曲线 → **黄金窗互动**（光点进荧光段时点「练」，早 / 晚 / 对三种结果）→ 阶梯走进奥林匹亚拱门 → Milo 替你算（真组件小样）→ 你的小牛出生。三层视差，按住暂停，可跳过，减少动态效果时降级 | `pages/StoryScreens.*` |
| 建档 | 3 步，草稿实时保存；最后可选「载入演示数据」（进阶用户 30 周） | `pages/OnboardingPage.*` |
| 首页 P01 | 处方主角卡 + 增量尺；「继续训练」中断恢复；**今天已练完**：睡着的小牛 + 摘要 + 恢复进度，「再练一次」才展开处方 | `pages/HomePage.*` |
| 训练 P03 | 组表格；**自带数字键盘**（第一下覆盖、±2.5 kg、「下一组」= 完成当前组）；休息在顶部（结束时间戳，切后台回来仍然准）；加组、跳过；结束确认 | `pages/SessionPage.*`、`components/training.tsx`（SetRow、NumPad） |
| 结算 P05 | 新纪录整块荧光卡（进场弹起 + 扫光）；三格统计；逐个动作；牛龄成长；十格力竭度；奖励弹窗（每条记录只弹一次） | `pages/SummaryPage.*` |
| 实机演示 | 电脑上：讲解 + 演示路线，跟随手机当前步骤，每步可直接跳转；右侧手机壳里是 App 本体（同源 iframe）。手机上：清空后全屏进故事 | `pages/DemoPage.*` |

截图在 `screenshots/stage6a/`（`story-board.png` 是故事 8 幕总览，`demo-desk.png` 是演示页）。

## 7. 已知问题与待验证

- **「首次」仍会出现**：处方引擎会轮换动作（同一肌头换个动作练），演示数据里没练过的动作显示「首次」，配有引导文案。要彻底消掉，可以在 `store.ts` 的 `ACCESSORY` 里加动作，或者让引擎优先选练过的动作（这是产品决定，先问用户）。
- **新纪录在演示里不一定出现**：首页建议的深蹲是减量后的 80 kg。要演示新纪录，在训练页把重量加上去（例如提踵 +2.5 kg）。
- **真机验证还没做**（`ia.md` §1.10 标了「阶段 6 真机验证」）：放大镜跟手的帧率、胶囊命中区、Android 返回键在各页的行为、数字键盘在小屏（360 × 640）上会不会挤。
- **`/demo` 的「重新开始」**：父页清空存储后刷新手机里的 iframe。如果手机里正在休息倒计时，极小概率会在刷新前写回一次，再点一次即可。
- **故事动画**只在 Chromium 上做过逐帧检查；Safari 和 Android WebView 上的 `text-wrap: balance`、`color-mix` 需要看一眼。Capacitor 8 默认的 WebView 足够新。

## 8. 下一步（建议顺序，每步都走「线框 → Stitch → 代码定稿 → 用户验收」）

- **6b 增量 Tab**：P09 增量总览（按引擎结论分成「该加重 / 保持 / 该减重」，线框 W2 已选）→ P10 动作进步曲线。数据现成：`exerciseRecords`、`suggest`、`deloadSignal`。
- **6c 记录 Tab**：P07 按周分组的列表 + 每周合计（线框 W1 已选）→ P08 训练详情（复用结算页的逐个动作）。
- **6d 我的 Tab**：
  - P11：档案四格 + 分组列表（线框 W2 已选），含设置和数据（清除 / 重新载入演示数据）；
  - P13：牛龄；
  - P14：钱包（牛劲、卡券）。
- **6e 首页补全与商城**：
  - 首页：P02 处方依据、P04 动作要领（`public/exercises/` 里有视频）、减量面板；
  - 商城与会员：P15–P21，只做演示链路。
- **打磨**：开屏动画、真机性能、APK 上架素材（`brief.md` 增长层的「打磨」条目）。

## 9. 目录速查

```
HANDOFF.md        本文件
README.md         概览与命令
docs/             文字文档：brief · ia · DESIGN · references · refs-elements · signature-nav · asset-audit · 8motions
docs/sources/     原始素材：mascot/ story/ shop/ refs/ brand-refs/ feedback/（用户上传的源图都放这里）
docs/archive/     旧阶段交接（stage3、stage5）
design/           tokens/（规范源头）· figma-plugin/ · brand/（IP 母版、提示词、分镜）· wireframes/ · hifi/（Stitch）· benchmark/ stage3/ icon-grid/（历史）
scripts/          build_tokens · check_hardcoded · copy_static · *_png.py（素材管线）· shoot_*.py（截图门禁）· gen_mock · bodymap
screenshots/      stage2…stage6a、hifi、brand、growth、lab、wireframes
public/           exercises/ bodymap/ mascot/ story/ shop/
mock/ prototype/  阶段 2 的场景数据（仍被测试和 ?scenario= 使用）与低保真原型（只读）
android/ apk/     Capacitor 工程 · 最新 debug APK
```

**用户上传素材的约定**：

- 用户习惯直接传到 `main` 的 `docs/` 下；
- 收到后挑选、重命名，移进 `docs/sources/<类别>/`，备选放进 `alt/`；
- 然后跑对应的 `*_png.py`。
