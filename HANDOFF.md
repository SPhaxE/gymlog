# 交接报告 · 慢牛 Milo（2026-10-06 定稿，阶段 6a 完成）

> 给接手的人或客户端（Claude Code 本地版、Cursor、Codex……）。先读这一页，再按需看 `docs/`。
> 用户写中文、要结论先行；所有对外文字（App 文案、文档、提交信息）用中文。
> 本地路径（用户的 Mac）：`/Users/sphax/MILO`。第一次接手照 §9「本地上手」做一遍，再跑一次门禁确认环境没问题。

## 0. 一句话现状

- **主流程闭环已经能用**：故事引导 → 建档 → 载入演示数据 → 首页处方 → **就在首页打卡**（主角卡展开成组行，键盘按需拉出）→ 结算（新纪录 / 成长）→ 首页「今天已练完」。
- **2026-10-06 真机验收后的大改**：独立训练页（P03）取消，训练并入首页——导航胶囊环的今日进度和休息描边全程可见。演示里每一处交互按「交互五层 + 命中区 + 8motions」重新打磨，规则写进 `docs/DESIGN.md` §9.6 / §9.7，并进了截图门禁。
- **第一版实机演示已上线**：<https://gymlog-taupe.vercel.app/demo>。这是现有 Vercel 域名下的一个路径，不是新域名；要独立域名，需要在 Vercel 项目的 Domains 里加。
- **5 个 Tab 里，首页和身体是真页面**；增量、记录、我的还是占位（阶段 6b 起做）。
- **门禁全绿**：
  - `tsc`
  - vitest 215 项
  - 写死值检查
  - Token 校验
  - Figma 插件 62 项
  - 构建
  - `shots:playground`（73 个组件、534 个变体）
  - `shots:6a`（演示全流程，360 与 412 两种宽，每一步查命中区 ≥ 48、被压扁的块、横向溢出、页面错误；不依赖日期）
- **生产环境已验证**：<https://gymlog-taupe.vercel.app/demo> 等路由 200、部署的是合并后的代码；同一份 `main` 的生产构建跑 `shots:6a` 全部通过（沙盒里的 Chromium 不信任代理证书，不关证书校验，所以用本地生产构建代替直连线上跑浏览器门禁）。

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

有线框的页面可以直接写代码（6a 起用户同意）；具体页面设计用户已授权由 Claude 自己选（2026-10-06），但**交互五层分析要写在页面文件头注释里**（例：`src/pages/TrainingView.tsx`），并且必须过 `DESIGN.md` §9.6 的 11 条交互硬规则。

**用户最在意、踩过的坑**（2026-10-06 真机）：
- 组件之间不守规范、错位（提示把输入框顶歪）→ 现在有「提示不位移」规则和「被压扁的块」门禁；
- 键盘常驻挡屏 → 键盘只在改数时从底部拉出；
- 页面结构和已有设计冲突（独立训练页让导航环白做）→ 改结构前先对照 `ia.md` §1.12 / §3；
- 交付前没在真机尺寸、真实状态（首次动作、休息中）下自测 → `shots:6a` 覆盖这些状态，412 × 915 也跑。

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
               useTrainingNav.ts 导航胶囊环的训练状态（今日进度、休息），5 个 Tab 根页共用
               demo.ts    页面数据（homeData / bodyData）：传场景名走 mock，传 Source 走本机存储
               growth.ts  奖励文案、商品表
  components/  组件库（index.ts 统一导出；每个导出都要在 playground/catalog.tsx 有条目，测试会查）
  pages/       Home（+ TrainingView 首页打卡）、Body、Onboarding（+ StoryScreens 故事 8 幕）、Summary、Demo、Playground、Preview、TokenCheck
  shell/       AppShell 路由（没建档 → /onboarding）、Android 返回键 back.ts、TabStub 占位、Patterns 数据态
  playground/  /playground 组件目录（全部组件 × 交互态 + 交互演示）
  lab/         /brand IP 与 Logo 评审、/lab 参考要素实验
```

**路由**（详见 `docs/DESIGN.md` §9.5）：

| 路由 | 页面 |
|---|---|
| `/onboarding` | 故事引导 → 建档 3 步 |
| `/today` | 首页：今日处方 / 训练中（打卡）/ 今天已练完 |
| `/body` | 身体 |
| `/session` | 旧地址，重定向到 `/today` |
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
python3 scripts/shoot_6a.py         # 演示全流程 + 故事 8 幕 + /demo → screenshots/stage6a/（命中区审计在 scripts/lib/hit_audit.js）
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
| 初见引导 P12 | 8 幕 Stories 式动画：两千五百年前 → 每天扛小牛（kg 刻度尺）→ 渐进超负荷（第 1 → 1460 天，30 → 450 kg，走完后屏幕中下方长出品牌 Logo「慢牛 Milo」）→ 超量恢复曲线 → **黄金窗互动**（光点进荧光段时点底部拇指区的「开始训练」——和首页同一个按钮，外加脉冲；早 / 晚 / 对三种结果）→ 阶梯走进奥林匹亚拱门 → Milo 替你算（身体页自动演示：手指滑过胶囊列、胶囊逐个展开；加处方卡，两张先后弹入）→ 你的小牛出生。三层视差，按住暂停，可跳过，减少动态效果时降级 | `pages/StoryScreens.*` |
| 建档 | 3 步，草稿实时保存；最后可选「载入演示数据」（进阶用户 30 周） | `pages/OnboardingPage.*` |
| 首页 P01 | 处方主角卡 + 增量尺；「为什么是这些」面板（每个动作练到哪些肌头、时相、近 7 天组数、重量理由）；**今天已练完**：睡着的小牛 + 摘要 + 恢复进度，「再练一次」才展开处方 | `pages/HomePage.*` |
| 首页训练中（原 P03） | 开始训练 → 主角卡原地展开成组行（M03）；拇指区唯一主操作「打卡 · 第 N 组」（首次动作变「填重量」，直接拉出键盘）；点组行拉出改数面板（`Sheet` + `SetEditor`，M05 + M04 码表）；休息：导航选中胶囊 + 主按钮左边的休息胶囊（M02，点别处缩回）；换动作：列表行长成主角卡（M03 `.swap`）；列表每行一排组点；导航外圈今日进度，切到身体页也在 | `pages/TrainingView.tsx`、`components/training.tsx`（SetLine、SetEditor、NumPad）、`data/useTrainingNav.ts` |
| 休息计时（最后一项，2026-10-06） | 同一时刻屏上只有一个计时器：首页训练中是主按钮左边一颗页面配色的胶囊（凹底 + 细线、图标在上时间在下，里面一道骨白实线按剩余比例收短），首页导航不显示休息；切到别的 Tab，**胶囊自己往下滑着淡出，只有进度条**（`REST_RING_VT`，`.ring`）借 View Transitions 飞进被点的导航滑块，到位后才换成滑块上的深色，切回首页反过来（`Nav.tsx` 的 `REST_VT` / `REST_RING_VT` / `navHandoff`，`AppShell.tsx` 的 `onTab` 等路由提交后再拍新快照并设 `html[data-rest-fly]`，`interactive.css` 里 `.rest:only-child` 与 `.ring`）；别的 Tab 之间互切不走转场；胶囊 ↔ 休息面板仍是同一个共享元素 | `components/motion.tsx`（`RestDock ring`）、`components/Nav.tsx`、`shell/AppShell.tsx` |
| 结算 P05 | 新纪录整块荧光卡（进场弹起 + 扫光 + 按住微倾 M01）；增幅按「之前最好」算（与奖励弹窗一致）；总负荷码表；逐个动作（与上次比）；牛龄成长；力竭度两排五格（每格 ≥ 48）；奖励弹窗（每条记录只弹一次） | `pages/SummaryPage.*` |
| 实机演示 | 电脑上：讲解 + 演示路线，跟随手机当前步骤，每步可直接跳转；右侧手机壳里是 App 本体（同源 iframe）。手机上：清空后全屏进故事 | `pages/DemoPage.*` |

截图在 `screenshots/stage6a/`：`flow-board.png` 主流程总览，`story-board.png` 故事 8 幕总览，`demo-desk.png` 演示页；线框 `screenshots/wireframes/checkin/`（首页即打卡 W1 / W2 / 键盘 W3）。

**这一轮回改的规范（组件层，别的页面也受益）**：小按钮命中区上下外扩到 48；分段控件每项 ≥ 48 宽、命中区算上内边距；`Sheet` 标题和说明上下叠、滚动行高修复；`RestDock` 胶囊 48 高、「收起」48 高；`SetRow` 提示不再挤动第一行对齐；`Odometer` 按位配对滚动（97.5 → 100 不错位）；`NumPad` 步进键有读屏名；新组件 `SetLine`、`SetEditor`、`Tilt`（都在 `/playground`）。

## 7. 已知问题与待验证

- **演示数据的「首次」**：处方引擎会轮换动作。`store.ts` 的 `backfill` 会把当天处方里没有记录的动作补进 2–4 周前的训练，保证演示第一眼都有建议重量（`src/data/store.test.ts` 连续 7 天检查）；列表里偶尔仍可能有「首次」，那是真实状态。真实用户数据不走这里。
- **新纪录在演示里不一定出现**：按建议重量打卡通常不破纪录。要演示新纪录：点第 1 组整行，把重量改大（例如 120），再打卡、结束。
- **真机验证还没全做**：命中区、对齐、溢出已在 360 / 412 两种宽自动检查；还没验的是放大镜跟手的帧率、Android 返回键在训练中 / 改数面板里的行为、360 × 640 这类矮屏上训练中的一屏能放下几组。
- **P04 动作要领**还没做，主角卡上暂时没有「要领」入口。
- **`/demo` 的「重新开始」**：父页清空存储后刷新手机里的 iframe。如果手机里正在休息倒计时，极小概率会在刷新前写回一次，再点一次即可。
- **故事动画**只在 Chromium 上做过逐帧检查；Safari 和 Android WebView 上的 `text-wrap: balance`、`color-mix` 需要看一眼。Capacitor 8 默认的 WebView 足够新。

## 8. 下一步（2026-10-06 重排：目标是作品集展示，不是上线）

**取舍原则**：以展示为准。做就做完整（数据态、空态、动效都齐），不值得展示的功能直接划掉。每步都走「线框（有就直接写）→ 代码定稿 → 截图验收」，改完走完 PR → CI → 合并 → 核对线上 /demo（不用再问，见 `CLAUDE.md`）。

| 阶段 | 内容 | 补的闭环缺口 |
|---|---|---|
| **6b 增量** | P09 总览（线框 W2：按引擎结论分成「该加重 / 保持 / 该减重」；状态行、近 4 周摘要、部位筛选、空态与「基线」态）+ **减量面板**（采纳 / 这次不减，首页「看看」与增量状态行共用，补上 `store.deload` 的动作）+ P10 进步曲线（`/gains/:exerciseId`，e1RM 正序、PR 形状标记、点数据点看当次各组）。下次目标与首页处方同一函数、同一个 `now`，加一致性测试 | 回看一半；减量死路 |
| **6c 记录** | P07（顶部**出勤点阵日历** `DotCalendar` + 按周分组列表 + 每周合计，线框 W1）+ P08 详情（复用结算页逐个动作）+ **删除训练**（确认对话框 → 成长重算，牛龄页注明可能降级） | 回看；删除 |
| **6d 我的** | P11 档案四格 + 分组列表（线框 W2）：档案编辑面板（含**可选体重**）、数据（载入演示 / 清除 / **导出 CSV** / 会员与非会员切换）、**消息**（同时达成的其余奖励）、关于；P13 牛龄页 | 设置（P0）；商城枢纽 |
| **6e 首页补全** | **P04 动作要领**（示范视频、要领文案、目标肌头高亮；入口：主角卡、处方行、记录详情、进步曲线）+ **替换动作**（同肌群同器械）+ **热身组** + 暂停训练确认（返回键）。P02 保持底部面板，不做整页 | 动作要领（P0）；训练流程更可信 |
| **6f 钱包与商城** | 先做**数据层**：存储加钱包（引擎 `growth` 已能接 `wallet`）、订单、卡券、已关闭的知识卡；知识卡触发规则；**商品状态**（见下）。再做 P14 钱包、P15–P19 商城五页 | 增长闭环后半段 |
| **6g 会员** | P20 权益 / 付费墙、P21 会员中心；演示不拦截 | — |
| **6h 收尾** | **作品集案例页**（从 V1 到 Milo 的过程、决定记录、引擎、设计系统）+ 触点静态稿（通知、桌面小组件、图标）+ 演示路线与场景切换（会员 / 非会员、减量周、新纪录……）+ 一次真机体检 | 展示载体 |

**商城的安排**（不新增 Tab）：入口三条——身体页、增量页顶部的知识卡提示（引擎数据触发，一屏一条，可关闭）→ 知识卡详情 → 商品详情 → 下单确认 → 订单完成；「我的 → 钱包 · 商城」；结算页奖励弹窗的「去钱包」。牛劲抵扣 ≤ 20%（100 牛劲 = 1 元）、兑换卡券；会员价与牛劲 ×1.5。训练流程里不出现。全部演示：商家虚构、支付假成功。
- **知识卡**：首批 4 张按数据触发（腰带：深蹲 / 硬拉预估 1RM ≥ 体重 1.5 倍，需要档案里的可选体重；蛋白质与睡眠：恢复慢于预期；肌酸：近 4 周训练量上升；护膝：深蹲量高）。**助力带不做数据触发**（没有「握力先力竭」的数据，也不为它加输入），作为通用卡留在商城里；健身常识不需要学术级数据。
- **商品 5 款够用，重点展示商品状态**：热销、折扣、新品、缺货（到货提醒）、已下架，加上会员价、牛劲可抵 / 不足。建议分配：蛋白粉热销、腰带折扣、肌酸新品、护膝缺货、助力带常规（会员价 / 牛劲抵扣在详情里展示）。现有 `ProductCard` 只有 normal / member / niujin / off 四态，6f 要扩。
- **商城级的状态**：有推荐、无推荐（通用入门卡）、加载失败、下架。

**划掉的**（对展示没增量，或现有的已够）：杠铃片计算、围度记录、PR 名人堂、kg / lb 切换、休息结束的真实本地通知、商店上架素材 / APK 签名、P02 处方依据整页、开屏动画、战报分享。

**还欠一次真机验证**（你有空时看）：放大镜跟手帧率、Android 返回键在训练中 / 改数面板里、360 × 640 矮屏上训练中一屏放几组、故事动画在 Safari 与 Android WebView 上的 `text-wrap: balance` / `color-mix`。

## 9. 本地上手（Mac，`/Users/sphax/MILO`）

```bash
git clone https://github.com/SPhaxE/gymlog.git /Users/sphax/MILO && cd /Users/sphax/MILO
# Node 22（CI 同版本）；Python 3.11+
npm ci
npm run check                       # 类型检查 + 215 个测试 + 写死值 + 构建，全绿再动手
# 截图门禁要用的 Python 依赖（一次）
python3 -m pip install playwright numpy opencv-python-headless Pillow
python3 -m playwright install chromium   # 本地没有 /opt/pw-browsers，脚本会自动用 Playwright 自带的 Chromium
npx vite --port 5199 --host 127.0.0.1 &  # 截图门禁默认连这个端口
python3 scripts/shoot_6a.py         # 演示全流程门禁（约 3 分钟），应输出「全部通过」
python3 scripts/shoot_playground.py # 组件矩阵门禁
```

- **Stitch**（可选）：`export STITCH_API_KEY=…`，或在本地 Claude Code 里配置名为 stitch 的 MCP；密钥不进仓库。
- **APK**：本地有 Android SDK（JDK 21）时 `npm run android:apk`；没有就用 CI 产物或 `apk/milo-debug.apk`。
- **给 AI 客户端**：根目录 `CLAUDE.md`（Claude Code 自动读）和 `AGENTS.md`（Codex / Cursor 等读）都指向本文件，并列了不许破的规则。
- **提交与合并**：在功能分支上开发 → 开 PR → CI 绿 → merge 方式合并 → 等 Vercel 生产部署。`main` 上的 APK 由 CI 自动提交，本地 `git pull` 会拿到。

## 10. 目录速查

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
