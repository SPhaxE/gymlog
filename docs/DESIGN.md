# 慢牛 Milo 视觉规范（DESIGN.md）· v2

> 2026-10-04 · **规范 v2**，取代阶段 4 的 v1。来源：用户选定的线框（`ia.md` §6）、54 张参考图提炼出的视觉语言 v2（`design/hifi/refs-analysis.md`），以及用户确认过视觉的身体页、首页代码定稿。
> **数值的唯一源头是 `design/tokens/tokens.json`。** 本文只写使用规则。
> **规范的实物有两页**：`/preview`（`src/pages/Preview.tsx`）放基础规范——颜色、文字、间距、圆角、版式；`/playground`（`src/pages/Playground.tsx`，目录在 `src/playground/catalog.tsx`）放**全部组件 × 全部交互态**和交互演示。阶段 6 每页开工前先对照这两页。
> 2026-10-04 用户决定：**Figma 暂缓**，组件与交互态以代码和 `/playground` 为准（§11）。

## 0. 流程与门禁

```
tokens.json ─ build_tokens.py ─┬─> design/tokens/tokens.css   → CSS 变量与 .milo-text-* 文字样式
（只改这里）  （校验对比度）     ├─> src/styles/tokens.gen.ts  → JS 几何计算（放大镜、引线）用的数值
                                └─> design/figma-plugin/code.js → Figma 变量与样式
```

- 改值只改 `tokens.json`，再跑 `python3 scripts/build_tokens.py`。`contrast` 里列出的每一对颜色都要达标，否则不生成。
- `src/pages`、`src/components`、`src/playground`、`src/shell` 里**不许出现散落的颜色和尺寸**：不写 `#hex`、`rgb()`、`px`、`ms` 字面量（`npm run check:hardcoded`，CI 必过）。JS 里的尺寸和时长只从 `tokens.gen.ts` 的 `T` 取。唯一例外是 `@media` 断点（CSS 不允许变量），字面量必须等于某个 `size/bp-*`，检查脚本核对。
- 新组件的顺序：写进 `src/components` 并从 `index.ts` 导出 → 在 `catalog.tsx` 登记全部变体轴（`catalog.test` 会拦下漏登记的导出）→ 写进本文 §9 → 才能在页面里用。页面只从 `../components` 取组件，不自造样式。

## 1. 颜色：暖黑 + 骨白 + 荧光

只用语义变量（`--milo-color-*`），原始色（`--milo-prim-*`）不直接用。

| 角色 | 变量 | 用在 |
|---|---|---|
| 底与面 | `bg/base`、`bg/raised`、`bg/raised-2`、`bg/sheet`、`bg/scrim`、`line/*` | 页面底、卡片与胶囊、选中底、底部面板、遮罩、描边与分隔 |
| 文字 | `text/primary`、`text/secondary`、`text/disabled` | 正文；说明与单位；禁用与 0 组 |
| **骨白：选中 / 实心中性** | `control/selected`、`action/primary`、`nav/pill`、`data/gauge`（暗骨） | 分段选中项、导航选中项、中性主按钮（完成、确认）、增量尺的增量段；胶囊量尺填充 |
| **荧光：焦点 + 进度** | `accent/*`、`text/on-accent*`、`nav/progress` | 见下面的荧光规矩 |
| 数据 | `data/*` | 容量四档、人体图、引线、刻度 |
| 反馈 | `feedback/danger` | 只用于错误、清除数据、下降趋势 |

**荧光规矩（v2）**

1. 荧光只给两类东西：
   - **这一屏唯一的焦点或主操作**：首页的「开始训练」、放大镜中心的胶囊（含它的引线和人体上的描边）、详情面板里的当前时相段。
   - **进度**：导航外圈。
2. **每屏只能有一处荧光面积**。有荧光按钮时，主角卡不再用荧光，改用骨白点缀（例如增量尺）。
3. 导航选中项、分段控件选中项、中性按钮一律用骨白，不用荧光。
4. 容量四档不用荧光：「达标」用中骨，「超量」用骨白底加黑斜纹，免得被读成「好」。
5. 光晕（`accent/glow`）只跟着那一处荧光走，每屏最多一处。

## 2. 文字

| 字体 | 变量 | 用在 |
|---|---|---|
| Barlow Condensed（压缩粗体） | `font/number` | 所有关键数字：重量、组数、恢复 %、PR 数 |
| Noto Sans SC | `font/ui` | 中文和界面文字 |
| JetBrains Mono | `font/mono` | 计时与刻度读数（1:35），等宽防跳动 |

| 文字样式（`.milo-text-*`） | 字号 | 用在 |
|---|---|---|
| `Number/Hero` | 64 | 首页建议重量、详情面板的恢复 % |
| `Number/XL` / `L` / `M` | 40 / 30 / 22 | 面板里的组数；目标「3 × 6–8」；摘要读数、列表重量 |
| `Number/S` / `XS` | 15 / 12 | 胶囊里的组数；小读数 |
| `Title/L` / `Title/M` | 26 / 22 | 页面标题；面板标题、恢复日 |
| `Heading` | 17 | 卡片里的动作名、放大中心的肌头名 |
| `Body/Strong` / `Body` | 15 | 列表行名称；正文 |
| `Label` | 13 | 区块标题（接下来、恢复、近 7 天容量） |
| `Caption` | 12 | 说明、理由、单位、标签 |
| `Micro` | 11 | 图例、导航名称、刻度地标 |

- **字号下限 11**（`font-size/min`）。
- **数字 + 单位**：数字用 `Number/*`，单位（kg、组、%、小时）跟一个 `Caption`，颜色 `text/secondary`，中间留 `space/2xs`。统一用组件 `Num`。
- 放大镜的胶囊字号在 `Caption` 和 `Heading` 之间按权重插值；放大中心固定用 `Heading`。不要另造字号。

## 3. 间距、圆角

- 间距只用 `space/*`，全部是 4 的倍数：2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48。
- 常用节奏：
  - 页头上边距 `space/l`，页头内块间 `space/s`，页头到内容 `space/m`；
  - 卡片内边距 `space/l`，卡片内块间 `space/xs`；
  - 内容区块之间 `space/m`；
  - 列表行最小高 `size/hit-min`（48），行间用刻度分隔线。
- 圆角：
  - `radius/pill`：胶囊、按钮、导航、分段控件；
  - `radius/l`：卡片、放大中心的胶囊；
  - `radius/m`：面板里的块、状态条；
  - `radius/s`：时相段底；
  - `radius/xs`：标签、刻度条；
  - `radius/xl`：底部面板顶角。

## 4. 版式

- **屏幕框**（组件 `Screen`）：
  - 背景全出血，宽屏时内容最宽 `size/content-max-w`（448）并居中；
  - 上下避开系统栏，Android 由 Capacitor 注入 `--safe-area-inset-*`。
- **出血规则**：一切内容都在左右 `size/gutter`（16）之内，人体图、胶囊、导航、按钮都不例外。只有背景色可以出血。
- **人体半身**（组件 `BodyFigure`，同 V1 `BodyProgressMap` 的做法）：
  - 人体放在左右各留页面边距的裁切框里，越界部分剪掉，不越过组件最外层；
  - 按包围盒从左裁掉 `ratio/figure-crop`（42%），露出约 58%；
  - 左缘再加 `ratio/figure-fade`（8%）宽的渐隐，让裁切读起来是有意的暗角，而不是一刀切；
  - 整体不透明度 `opacity/figure`，右侧再淡一些，让胶囊更清楚；
  - 胶囊列从内容区宽度的 `ratio/rail-start`（43%）开始，到内容区右缘结束。
- **底部留白**：
  - 有导航的页面，内容底部留 `nav-bar-h + nav-bottom + space/s`（CSS 变量 `--nav-clear`）；
  - 有固定主按钮时再加 `button-h + space/2xl`；
  - 主按钮浮在导航上方 `space/s` 处。
- **层级**（从下到上）：内容 → 人体 → 引线 → 胶囊 → 固定主按钮 → 导航 → 底部面板（含遮罩）。
- **触控**：目标不小于 `size/hit-min`（48）。视觉更小的件要把命中区外扩：分段控件高 32，用伪元素补到 48；静止胶囊的命中区按轨道均分。

## 5. 数据图形

- **容量四档**：同时靠明暗和纹理区分，不只靠色相；身体页常驻图例（组件 `TierLegend`）。

  | 档 | 人体与图例 |
  |---|---|
  | 未练 | `data/tier-none` + 斜纹 |
  | 不足 | `data/tier-low`（暗灰） |
  | 达标 | `data/tier-ok`（中骨） |
  | 超量 | `data/tier-over`（骨白）+ 黑斜纹 |

- **胶囊**本身就是量尺：底色按「组数 ÷ 最大可恢复量」从左填充 `data/gauge`；0 组用斜纹并压暗文字。
- **刻度**只做分隔线和量尺，不做装饰：
  - 刻度间距 `size/tick-pitch`，小刻度高 `size/tick-minor`，大刻度 / 地标高 `size/tick-major`；
  - 分隔线（`Ticks`）向右渐隐。
- **地标尺**（`LandmarkRuler`）：已填段 `data/fill`，最低 / 适宜 / 上限三条地标 `data/tick`，位置 = 值 ÷（上限 × 1.1）。
- **增量尺**（`IncrementRuler`）：同一把刻度上标出上次和这次，中间那段（就是增量）用骨白高亮；减重时方向相反（−5 kg）。刻度步进 = 引擎的 `loadStep`（2.5 kg），两侧各留 4 步。
- **时相段**（`PhaseSegments`）：修复期 / 恢复中 / 黄金窗 / 已回落，当前段荧光（属于进度类用途）。

## 6. 导航（ia §1.12，组件 `Nav`）

| 元素 | 规则 |
|---|---|
| 位置与尺寸 | 左右贴页面边距，离底 `size/nav-bottom`，高 `size/nav-bar-h`；`nav/bg` + 模糊 + `shadow/float` |
| 五项 | 首页 · 身体 · 增量 · 记录 · 我的，都是「图标（`size/nav-icon`）+ 名称（`Micro`）」 |
| 选中项 | `nav/pill` 骨白实心，图标与文字 `nav/pill-ink`，高 `size/nav-item-h` |
| 外圈：今日进度 | `nav/progress` **实线** `stroke/ring-progress`，**从顶边正中顺时针**。null：不画（恢复日、动作池不足、空态）；0：只画轨道 `nav/track`；1：满环（今天已练完） |
| 休息倒计时 | 选中项的名称换成剩余时间（1:35）；小胶囊**里面**一道 `nav/rest`（暗骨）**内描边虚线**（`stroke/ring-rest-dash` / `-gapdash`）+ 端点圆点，只走剩余比例那一段；向内缩半个线宽 + `space/2xs`，不碰外圈（2026-10-04 用户要求，原先画在胶囊外会和外圈重叠） |

## 7. 动效

参数都在 `motion/*`：
- 按下反馈 ≤ `motion/press`，缩放 `motion/press-scale`；
- 胶囊放大与位移 `motion/fast`；
- 底部面板滑入 `motion/base`；
- 单次转场 ≤ `motion/slow`；
- 列表入场总时长 ≤ `motion/list-max`。

放大镜的阈值：
- 按住 `motion/long-press` 进入；
- 进入前移动超过 `motion/drag-slop` 算滚动；
- 余弦衰减半径 `motion/magnifier-radius`（3 个胶囊）。

每个视效都要有「减少动画」降级（`references.md` §9.2）。训练页不放持续动画、光晕和噪点。

阶段 5 补充：
- 导航选中滑块切换 `motion/base`；对话框淡入 + 由 `motion/press-scale` 放大到 1，`motion/base`；轻提示从下方 `space/l` 滑入，停留 `motion/toast-hold`（带「撤销」的加倍）。
- 组间休息倒计时按**结束时间戳**每 `motion/base` 刷新一次，不累加定时器。
- 减少动态效果时：按下不缩放、导航滑块直接到位、骨架与示范占位不闪、对话框与轻提示不做入场动画。

## 8. 禁止项

- 编造的英文或中文「技术标签」：OVERLOAD ENG.、NEXT TARGET、SEQ // 01、CALIB-24 之类。界面文案保持中性、克制。
- 一屏多处荧光；荧光的整片背景；荧光的容量档位。
- 满屏的出血巨型数字。只有结算页允许一次「大声」（荧光斜带上的「4 项 PR」）。
- **任何不是 MuscleWiki 素材的人体图**：几何拼的、手画的、AI 生成的都不行。人体只用 `public/bodymap/`，出现的页面要有署名。
- 人体越过页面边距（§4）。
- 照抄参考图或生成图里的数字，口径只看 brief / ia；页面上的数字只来自引擎。

## 9. 组件与交互态（`src/components` → `/playground`）

`/playground` 是这一节的实物：43 个组件、311 个变体，每个变体是 `catalog.tsx` 里各轴取值的组合。下面的表只写用法；尺寸都在 Token 里，状态在 Playground 里看。

### 9.1 交互态（所有可点的件共用 `interactive.css`）

| 状态 | 代码里 | 样式 | Playground |
|---|---|---|---|
| 默认 | — | — | 默认 |
| 按下 | `:active` | 缩放 `motion/press-scale` + 当前文字色叠一层 `opacity/press` | `state="pressed"` → `data-pressed` |
| 聚焦 | `:focus-visible` | 骨白描边环 `stroke/focus`，外移 `space/2xs`（键盘、读屏、外接键盘时才出现） | `state="focused"` → `data-focus` |
| 禁用 | `disabled` / `aria-disabled` | 整体 `opacity/disabled`，不响应按下；要在旁边说明为什么不能点 | 禁用 |
| 加载 | `aria-busy` | 文字隐去、三点依次亮起（`motion/stagger`），宽度不变，不能重复点 | 加载中 |
| 错误 | `aria-invalid` | 描边与提示 `feedback/danger` + 警示图标（不只靠颜色），提示经 `aria-describedby` 读出 | 错误 |

- 触屏优先，**没有悬停态**。
- 命中区不小于 `size/hit-min`：视觉更小的件（分段、Chip、开关、图标按钮、周历）用 `::after` 把命中区外扩。
- 选中一律骨白（`control/selected`），**荧光只给每屏唯一的行动焦点和进度**（主按钮、焦点胶囊、时相当前段、导航外圈）。

### 9.2 数据态（每个页面都要覆盖，ia 各页「边界情况」）

| 数据态 | 组件 | 规则 | 示例 |
|---|---|---|---|
| 加载中 | `StateView kind="loading"` / `Skeleton` | 骨架与真实内容同尺寸，不跳动 | `/patterns/loading` |
| 空 | `StateView kind="empty"` | 说明为什么空 + 一个去下一步的主按钮 | `/patterns/empty`；身体页空态是一行小字 |
| 错误 | `StateView kind="error"` / `Banner tone="error"` / `Toast kind="error"` | 说清楚数据有没有丢，给「重试」；保存失败必须可见，不静默回退 | `/patterns/error` |
| 部分数据 | 页面就地处理 | 缺的行隐藏，不显示 0；只有 1 次记录写「基线」，少于 2 次不画线 | `TrendChart`、`Delta` |

### 9.3 悬浮层与返回键

- `Dialog`、`Toast` 渲染到壳的悬浮层宿主（`OverlayHost`），和 `Screen` 同一个框；Playground 的每块迷你屏幕各有自己的宿主。
- `Dialog`、`Sheet` 打开时焦点进入、Tab 在层内循环、Esc 关闭、关闭后焦点回到打开前的位置。
- Android 返回键（`src/shell/back.ts`，有单测）：先关最上面的悬浮层 → 非首页的 Tab 根页回首页 → 首页退出 App → 其余子页返回上一页。

### 9.4 组件目录

| 组 | 组件 | 变体轴（`/playground`） | 用法 |
|---|---|---|---|
| 基础 | `Icon` | 26 个图标 | 24×24 实心几何，`size/icon` / `size/icon-s`；装饰性 |
| | `Button` | kind 主操作 / 中性 / 描边 / 危险 × size 大 / 小 × 5 种交互态 | 每屏最多一个 primary；危险只用于删除、清除 |
| | `IconButton` | 实底 / 无底 × 4 种交互态 | 必须有 `label` |
| | `Tag` | 信息 / 强调（只给 PR）/ 虚线（首次、基线、未做）/ 错误 | |
| | `Num`、`Delta` | 6 档字号；上升 / 下降 / 持平 / 基线 | 方向用形状 + 文字 |
| 表单 | `Segmented` | 2 / 3 项 × 4 种交互态 | 方向键切换 |
| | `Chip` | 选中 × 4 种交互态 | 增量页按部位筛选 |
| | `Switch` | 开关 × 4 种交互态 | 设置里即时生效的开关 |
| | `OptionCard`（+ `OptionGroup`） | 单选 / 多选 × 选中 × 4 种交互态 | 建档、设置 |
| | `Stepper` | 默认 / 到下限 / 到上限 / 聚焦 / 禁用 | 重量、时长、休息 |
| | `NumberField` | 空 / 聚焦 / 已填 / 错误 / 禁用 | 超范围行内报错，不截断 |
| | `ProgressSteps` | 第 1–3 步 | 建档 |
| 反馈与悬浮层 | `Banner` | 建议减量 / 减量周 / 一行小字 / 动作池不足 / 继续上次训练 / 错误 | 页面顶部状态位 |
| | `Toast`（+ `ToastViewport`） | 成功 / 错误 / 可撤销 | 一次一条，停在导航上方 |
| | `DialogCard`（+ `Dialog`） | 中性 / 危险 | 只用于二次确认 |
| | `Sheet` / `SheetBlock` | — | 肌头详情、减量面板；盖住导航 |
| | `Skeleton`、`StateView` | 5 种形状；加载 / 空 / 错误 | §9.2 |
| 列表与页头 | `ListRow`（+ `List`） | 只读 / 可进入 / 开关 / 危险 × 4 种交互态 | 开关行整行是 label |
| | `Card` | 普通 / 主角 × 默认 / 按下 / 聚焦 | 主角卡每屏一张 |
| | `SectionLabel`、`PageHeader`、`TopBar` | —；普通 / 带日期与附件；子页 / 训练中 | Tab 根页用 `PageHeader`，没有 Tab 的子页用 `TopBar` |
| 训练与记录 | `PrescriptionHero` | 加重 / 保持 / 减重 / 首次 / 减量周 | 首页第一个动作 |
| | `ExerciseRow` | 待做 / 首次 / 进行中 / 已完成 / 未做 × 3 种交互态 | 处方、训练中 |
| | `SetRow` | 待做 / 进行中 / 缺值 / 已完成 / 修改中 / 错误 / 热身组 / 递减组 | 「完成」是唯一入口 |
| | `RestBar` | 计时中 / 即将结束 / 结束 | 结束时间戳；±15、跳过 |
| | `SessionRow` | 普通 / 有 PR / 减量周 × 3 种交互态 | 记录列表 |
| | `DayCell`、`WeekStrip` | 已练 / 已练 · PR / 休息 / 今天 / 未来 × 默认 / 选中 / 按下 / 聚焦 | 记录页顶部 |
| | `MediaFrame` | 加载中 / 已加载 / 缺素材 / 加载失败 | 只经 `media` 字段引用，保留署名 |
| 数据图形 | `Sparkline`、`TrendChart` | 上升 / 下降 / 只有 1 次；多次 / 选中一次 / 只有 1 次 / 没有记录 | 时间按正序画（有单测）；PR 用菱形 |
| | `IncrementRuler`、`LandmarkRuler`、`PhaseSegments`、`Ticks`、`TierLegend` | 加重 / 保持 / 减重；未练 / 不足 / 达标 / 超量；四个时相 | §5 |
| 身体 | `Capsule` | 未练 / 不足 / 达标 / 超量 × 静止 / 邻近 / 焦点 | 胶囊即量尺；超量加斜纹 |
| | `CapsuleRail` | 静止 / 焦点；交互演示里是整张身体页 | 几何在 `capsuleLayout.ts`（有单测） |
| | `BodyFigure` | 正面 / 背面 × 男 / 女 | §4 半身 |
| 导航 | `Nav` | 选中 5 项 × 外圈（不画环 / 只有轨道 / 进行中 / 满环 / 休息）+ 未选中项的按下 / 聚焦 | §6；选中滑块切换时滑动 |

不进矩阵的导出：`Screen`（页面框，见 `/preview` §4）、`OptionGroup`、`ToastViewport`、`Dialog`（都在交互演示里）、`StatusStrip`（`Banner` 的旧名，已弃用）。

**页面骨架**：
- Tab 根页：`Screen` → `PageHeader` → 内容（左右 gutter、可滚动）→（固定主按钮）→ `Nav`。
- 训练、结算等任务流页面：`Screen` → `TopBar` → 内容，没有 `Nav`；组间休息条悬浮在底部。
- 底部面板与对话框盖在最上层。

### 9.5 App 壳（`src/shell`）

| 路由 | 页面 |
|---|---|
| `/today` · `/body` · `/gains` · `/log` · `/me` | 5 个 Tab 根页；增量、记录、我的在阶段 6 搭，现在是说明占位 |
| `/patterns/loading` · `empty` · `error` | 页面级数据态示例 |
| `/playground` · `/preview` | 组件与交互态；基础规范 |
| `/check` | M1 的管线检查 |
| `/explore/*` | 旧地址，重定向到 `/today`、`/body` |

Tab 之间切换走路由，不整页刷新；`?scenario=` 选演示场景，`?now=` 固定时间（截图用）。

## 10. 自检

```bash
python3 scripts/build_tokens.py --check   # 对比度与引用
python3 scripts/build_tokens.py           # 生成 CSS、TS 常量与 Figma 插件
npm run check:hardcoded                   # src/pages、components、playground、shell 里没有散落的颜色与尺寸
npm test                                  # 含目录覆盖（每个导出 × 每个变体能渲染、交互态落到 DOM）、胶囊几何、曲线正序、返回键
npx vite --port 5199 &
python3 scripts/shoot_playground.py       # 阶段 5 运行时门禁：变体数一致、记组 / 导航 / 对话框交互、5 个 Tab 无横向溢出 + 截图
python3 scripts/shoot_hifi.py             # 身体页、首页 8 个状态 + /preview 整页截图
node scripts/test_figma_plugin.cjs        # Figma 插件 mock 测试（62 项）
```

## 11. Figma 的同步状态

- **2026-10-04 用户决定：Figma 暂缓。** 组件与交互态以代码和 `/playground` 为准，不再要求 Figma 组件与代码一一对应后才能进阶段 6。
- **Foundations**（变量、文字样式、效果）：仍由 `tokens.json` 自动生成插件，已经是 v2。
- **Components 与标杆页**：插件里停在 v1（3 项 `NavPill`、旧胶囊），不再维护。标【旧版，仅 Figma 旧组件用】的 Token 先保留（插件测试还在用），以后恢复 Figma 时按 §9 重画并删掉它们。
