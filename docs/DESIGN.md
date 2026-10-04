# 慢牛 Milo 视觉规范（DESIGN.md）· v2

> 2026-10-04 · **规范 v2**，取代阶段 4 的 v1。来源：用户选定的线框（`ia.md` §6）、54 张参考图提炼出的视觉语言 v2（`design/hifi/refs-analysis.md`），以及用户确认过视觉的身体页、首页代码定稿。
> **数值的唯一源头是 `design/tokens/tokens.json`。** 本文只写使用规则。
> **规范的实物是 `/preview`**（`src/pages/Preview.tsx`）：每个 Token、文字样式和组件状态都在那一页渲染。阶段 6 每页开工前先对照它。

## 0. 流程与门禁

```
tokens.json ─ build_tokens.py ─┬─> design/tokens/tokens.css   → CSS 变量与 .milo-text-* 文字样式
（只改这里）  （校验对比度）     ├─> src/styles/tokens.gen.ts  → JS 几何计算（放大镜、引线）用的数值
                                └─> design/figma-plugin/code.js → Figma 变量与样式
```

- 改值只改 `tokens.json`，再跑 `python3 scripts/build_tokens.py`。`contrast` 里列出的每一对颜色都要达标，否则不生成。
- `src/pages`、`src/components` 里**不许出现散落的颜色和尺寸**：不写 `#hex`、`rgb()`、`px`、`ms` 字面量（`npm run check:hardcoded`，CI 必过）。JS 里的尺寸和时长只从 `tokens.gen.ts` 的 `T` 取。
- 新组件先进 `src/components` 和 `/preview`，再写进本文 §9，最后才能在页面里用。页面只拼组件，不自造样式。

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
| 休息倒计时 | 选中项的名称换成剩余时间（1:35）；小胶囊外加 `nav/rest` **虚线**（`stroke/ring-rest-dash` / `-gapdash`）+ 端点圆点，只走剩余比例那一段；与胶囊之间留 `stroke/ring-gap` 的缝 |

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

## 8. 禁止项

- 编造的英文或中文「技术标签」：OVERLOAD ENG.、NEXT TARGET、SEQ // 01、CALIB-24 之类。界面文案保持中性、克制。
- 一屏多处荧光；荧光的整片背景；荧光的容量档位。
- 满屏的出血巨型数字。只有结算页允许一次「大声」（荧光斜带上的「4 项 PR」）。
- **任何不是 MuscleWiki 素材的人体图**：几何拼的、手画的、AI 生成的都不行。人体只用 `public/bodymap/`，出现的页面要有署名。
- 人体越过页面边距（§4）。
- 照抄参考图或生成图里的数字，口径只看 brief / ia；页面上的数字只来自引擎。

## 9. 组件目录（`src/components`，`/preview` 里有每个组件的状态）

| 组件 | 结构与尺寸 | 状态 / 用法 |
|---|---|---|
| `Screen` | 屏幕框：全出血背景、`content-max-w`、安全区、`--nav-clear` | 每个页面最外层 |
| `PageHeader` | eyebrow（Caption）+ 标题（Title/L）+ 右侧附件 + 下方插槽 | Tab 根页的页头；子页用返回栏（M3 补） |
| `Nav` | §6 | progress：null / 0 / 0–1 / 1；rest + restRatio |
| `Segmented` | 高 `segment-h`，命中区外扩到 `hit-min`；选中项骨白 | 正面 / 背面、男 / 女 |
| `Button` | 高 `button-h`，`radius/pill`；`primary` 荧光 / `neutral` 骨白 / `ghost` 描边 | 每屏最多一个 primary |
| `Tag` | Caption，`radius/xs`，`bg/raised` 描边 | 摘要标签、「首次」 |
| `StatusStrip` | 左侧骨白竖条，标题 Body/Strong + 说明 Caption；`quiet` 为一行小字 | 减量建议、减量周、动作池不足、空态说明 |
| `Card` | `radius/l`，内边距 `space/l`；`hero` 带径向渐变深度 | 首页主角卡、恢复日 |
| `List` / `ListRow` | 行高 ≥ `hit-min`，行间刻度分隔线；右侧放 `Num` 或 `Tag` | 「接下来」、记录、设置 |
| `SectionLabel` | Label，`text/secondary` | 区块标题 |
| `Num` | §2「数字 + 单位」 | 所有数字 |
| `Ticks` | §5 | 页头 KPI 下的分隔线 |
| `TierLegend` | §5 | 身体页 |
| `BodyFigure` | §4 人体半身 | gender 男 / 女 × view 正面 / 背面；焦点肌头荧光描边 |
| `CapsuleRail` | 胶囊高：静止 ≤ `capsule-rest-max-h`（均分轨道）、邻居 → `capsule-near-h`、中心 `capsule-focus-h`；中心向左伸出 `capsule-focus-grow`、邻居 `capsule-near-grow`；间距 `capsule-gap`；引线拐点 `leader-elbow` + 错开 `leader-stagger` | 静止 / 0 组 / 邻居 / 中心；按住、滑动、松手打开详情；几何在 `capsuleLayout.ts`（有单测） |
| `Sheet` / `SheetBlock` | `bg/sheet`，顶角 `radius/xl`，抓手，关闭钮 `button-h-s`；块 `radius/m` | 肌头详情（恢复在上、容量在下）、减量面板 |
| `PhaseSegments`、`LandmarkRuler`、`IncrementRuler` | §5 | 详情面板、首页主角卡 |

**页面骨架**：
- Tab 根页：`Screen` → `PageHeader` → 内容（左右 gutter、可滚动）→（固定主按钮）→ `Nav`。
- 训练、结算等任务流页面没有 `Nav`。
- 底部面板盖在最上层。

## 10. 自检

```bash
python3 scripts/build_tokens.py --check   # 对比度与引用
python3 scripts/build_tokens.py           # 生成 CSS、TS 常量与 Figma 插件
npm run check:hardcoded                   # src/pages、src/components 里没有散落的颜色与尺寸
npm test                                  # 含胶囊列几何的单测
npx vite --port 5199 & python3 scripts/shoot_hifi.py   # 身体页、首页 8 个状态 + /preview 整页截图
node scripts/test_figma_plugin.cjs        # Figma 插件 mock 测试（62 项）
```

## 11. Figma 的同步状态

- **Foundations**（变量、文字样式、效果）：由 `tokens.json` 自动生成，已经是 v2：骨白、Barlow Condensed、新增的版式与组件尺寸。
- **Components 与标杆页**：插件里仍是 v1（3 项 `NavPill`、旧胶囊）。标【旧版，仅 Figma 旧组件用】的 Token 只给它们用。下一步按本文 §9 和 `/preview` 重画 Figma 组件，完成后删掉这些旧 Token。在那之前，组件以代码和 `/preview` 为准。
