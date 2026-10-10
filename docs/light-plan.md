# 全局浅色：去掉所有深色岛

> 2026-10-10 拟定、用户已批准。上一窗口被自动压缩，按 CLAUDE.md 规则先交接（`docs/handoff-session.md`），本计划由新窗口执行。
> 行号是 47f2eb7 时的，动手前先核对。

## Context
用户看过上一轮浅色模式后说：「还没有实现全局浅色，人体容量、钢板等都需要实现全局浅色」，又补充「钢板透光等特效，浅色模式下就可以省去」。
上一轮把 5 处做成了局部深色岛（`data-theme="dark"`）：
- 容量页舞台 `BodyPage.tsx:144`
- 钢板 `<figure>`（`plate.tsx:290`）
- 奖励弹窗 `Reward.tsx:143/197`
- 故事引导（`StoryScreens.tsx:58` 给 `Screen` 传 `theme="dark"`）
- /demo 外壳 `DemoPage.tsx:93`

这次全部去掉：浅色模式下每一处都是真浅色。**深色模式必须逐像素不变。**

用户已拍板（AskUserQuestion）：
1. **人体**：在保留金属渐变（F1）+ 熔流（S9）的基础上做 **4 个浅色方案**，放进 `/preview` 让用户选。选定后定为默认，落选的留在方案台。
2. **钢板**：浅色钢面，**孔里露出平涂的荧光底板**，加一圈很淡的内阴影。浅色下不画灯、光束、浮尘、光晕。
3. **故事引导**：**用代码处理成浅色水墨**，不出新素材。

## 共用基础
- **局部主题 hook**：`src/styles/theme.ts` 加 `useElementTheme(ref)`。
  - 读元素最近的 `[data-theme]`，没有就读 `<html>`。
  - 以 `useTheme()` 为依赖，主题一变就重算。
  - 这样方案台 / Playground 里的单格可以用 `data-theme="light"` 强制浅色，和全局主题无关。
  - 画布与 SVG 按这个值选色带、选混合模式。
- **重画**：现在 BodyFigure、thermal、plate 都不监听主题。把 `useElementTheme` 的结果放进它们的 effect / useMemo 依赖。参照 `particles.tsx:37,46` 和 `atmosphere.tsx:54,67` 的写法。
- **语义色换法**（深色值完全相同，所以深色不变）：
  | 原色 | 用途 | 换成 |
  |---|---|---|
  | `lime-500` | 当字 / 线 | `accent-ink` |
  | `lime-500` | 当面 | `accent-default` |
  | `lime-500-a33` | 光晕 | `accent-glow` |
  | `lime-500-a13` | 淡底 | `accent-glow-ring` |
  | `lime-300` | | `fx-spark-0` / `fx-glow-hot` |
  | `lime-700` | | `fx-spark-2` |
  | `lime-900` | | `fx-glow-deep` |
  | `bone-100` | 当墨 / 线 | `brand-mark` |
  | `bone-500` | | `data-tier-ok` |

  例外：骨白作「荧光面上的高光」时（Reward `.pro`、`.border` 高光、growth `.pro`、Summary 光泽），保持固定的浅色原色。
- **混合模式和滤镜**换不了 Token，用已有写法 `:root[data-theme='light'] .x {…}`；要支持局部浅色的地方，用 `[data-theme='light'] .x`。

## 1. 容量人体：4 个浅色方案（方案台 L 组）

### 现状
`thermal.ts:7,22-35` 的色带是从 tokens.json 原色 hex 写死的，深色的金属色带是 `gray-50 → lime-900 → lime-700 → lime-500 → lime-300 → gray-900`（`BodyFigure.tsx:514`）。在纸白上：
- 冷肌肉成黑块，最热的肌肉和纸融在一起；
- 熔流和柔光描边是 `screen` 混合（`BodyFigure.module.css:26,57`），只会提亮；
- 唇边 / 内缘的亮化 slope（`:532-541`）和白颗粒（`:548`）也不能用。

### 做法
新增一个上下文 `LightLook`（同 `ScanFx/FillFx`，`BodyFigure.tsx` 顶部）和一份 `LIGHT_LOOKS` 配置表：

```
{ ramp: 原色名[6], lip / edge slope, grain: ink 透明度, glow 透明度,
  moltenTint: 原色名, contourInk: 语义色, contourAlpha }
```

浅色时（`useElementTheme`）：
- **FillLayer**：用 `rampTables(look.ramp)`；slope 改成压暗（< 1）；颗粒改成墨色低透明。
- **ThemeFx molten**：
  - 改 `multiply` 混合；
  - 渐变反相，冷 = 白，白在 multiply 下不起作用；
  - `feColorMatrix` 按 `moltenTint` 算 `out = a·g + b`，让白不变、黑变成该色。
- **ThermalLight 柔光描边**：改 `multiply`，`.cSoft` 用 `contourInk` 低透明。

4 个方案：

| 方案 | 名字 | 冷 → 热 | 熔流 / 描边 |
|---|---|---|---|
| **L1** | 深绿热 | `paper-100 → lime-300 → lime-550 → lime-600 → lime-750 → lime-ink`，越深越热（推荐，与「荧光字用深一档绿」同逻辑） | 深绿流纹、深绿描边 |
| **L2** | 荧光热 | `paper-100 → lime-300 → lime-500 → lime-550 → lime-600 → lime-700`，越饱和越热，最热仍是荧光 | 墨色描边给形体，熔流 `lime-600` |
| **L3** | 银金属 | 冷 = 银灰金属（`paper-200 → paper-300 → ink-500`），热段转 `lime-550 → lime-750`，金属感最强 | 白色唇边换成墨色细边 |
| **L4** | 墨印 | `paper-50 → paper-200 → ink-500 → ink-600 → ink-900`，热段混 `lime-750`，像版画，最克制 | 墨色流纹、墨色描边 |

随方案一起变的：
- **胶囊量尺** `heatCss`（`thermal.ts:38`）和**图例** `TierLegend`（`ui.tsx:124`）：浅色时用所选方案色带的前 5 段。图例现在在浅色下已经是错的。
- **引线**：`CapsuleRail.module.css:10-11` 从 `accent-default` 换成 `accent-ink`（深色值相同）。

去掉的东西：
- `BodyPage.tsx:144` 的 `data-theme="dark"`；
- `BodyPage.module.css:17-21` 的观察窗面板（舞台留在页面边距里，坐标不变）。

**方案台** `src/pages/OptionsBoard.tsx`：
- 新增「L 浅色人体」组：4 格，每格包 `data-theme="light"` + `LightLook.Provider`，放真实人体 + 胶囊。
- 自由组合加 `?l=` 参数。
- 用户选定前默认 **L1**；选定后改 `DEFAULT_LIGHT_LOOK`。

**故事第 7 幕**的 BodyDemo（`StoryScreens.tsx:302-358`）不经过 BodyPage，同样跟随主题。

**其余备选方案**（hair、dot、rim、raster、slice、pump、steam、fiber、beam、topo、halftone、liquid、F0）：
- 它们只是方案台上的存档，不属于本次范围；
- 方案台里这些格子包 `data-theme="dark"`，并写明「深色方案」。

## 2. 钢板（`src/components/plate.tsx` + `.module.css`）
- 去掉 `<figure data-theme="dark">`。
- 新增 tokens.json 语义色（深色值和现在完全一样）：

  | 语义色 | 深色 | 浅色 | 用途 |
  |---|---|---|---|
  | `plate/steel-top` | `bg-raised-2` 的原色 | `paper-200` | 钢面渐变（拉丝铝） |
  | `plate/steel-bottom` | `bg-raised` 的原色 | `paper-100` | 钢面渐变 |
  | `plate/hi` | `gray-900` | `paper-50` | 高光 |
  | `plate/lo` | `gray-0` | `ink-900` | 阴影 |
  | `plate/label` | `gray-900` | `ink-600` | 月份字 |
  | `plate/hole` | `gray-0` | `lime-550` | 浅色孔底：荧光底板 |

- `hi()` / `lo()` 改用 `plate/hi` / `plate/lo`。浅色下阴影用 `--plate-lo-k`（约 0.45）乘透明度，避免脏黑边。
- 月份字：浅色是墨字 + 纸白浮雕阴影。
- `REST_INK` 换 `brand-mark`；S0 `steel` 也走钢面语义色。
- **浅色时整段跳过灯光**：
  - 不挂灯（`.lamp` portal）、光晕 `.halo`、光束画布 `.beams`、浮尘循环；
  - 背板画布 `.back` 只填 `plate/hole` 平涂，加一圈淡内阴影（沿用孔壁 `lo()`）；
  - 选中孔的 `.focus` 外发光换 `accent-glow`。
- effect 依赖加主题；`palette(el)` 改读语义色。

## 3. 奖励弹窗（`Reward.tsx` + `Reward.module.css`）
- 去掉两处 `data-theme`，按上面的换法替换 27 处原色。
- **卡片**：加 `line-default` 内描边 + `shadow-float` 阴影。`.stats` 底改 `bg-raised-2`（浅色下 `bg-raised` 和 `bg-sheet` 同色）。
- **闪屏 `.flash`**：浅色改成 `fx-glow-hot → accent-glow`。
- **升段蓄力**：`brightness(4–6)` 发白（`:179-188`）在浅色下改成加 `accent-ink` 外发光。
- **大字 `.headline`**（升段）：浅色改成 `accent-ink → text-primary` 渐变。
- **字和线**：`.label`、`.gain`、`.pip`、`.node` 换 `accent-ink`。

## 4. 故事引导（`StoryScreens.tsx` / `.module.css` / `Screen.tsx`）
去掉 `Screen theme` 属性；它只有这一个调用方，属性删掉。

浅色水墨处理（只在浅色生效）：
- **S1-far 夜空**（不透明）：隐藏，换纸白 → `paper-100` 渐变天空。
- **S1-mid / S1-near / S2**：`grayscale(1) invert(1)` + `multiply` + 低透明，成淡墨剪影；S2 加羽化遮罩。
- **人物 M1–M6**：加一圈很细的墨边 drop-shadow。
- **入场动画**：`walkIn` 的 `brightness(0.2)` 改成透明度入场；`.ageOff` 浅色反相。
- **混合模式**：`.archLight` / `.sweep` 的 `screen` 改普通叠放 `accent-glow`。
- **颜色**：42 处原色按换法替换。
  - 进度条 `.bars` 换 `brand-mark`；
  - 曲线 `.curvePath` 换 `brand-mark`；
  - `.brandWord` 去掉强制骨白；
  - `.pCard` / `.finger` 加 `line-default` / `brand-mark`。

## 5. 其余
- **/demo**：去掉外壳的 `data-theme`。
  - `.aura` 换 `fx-glow-deep` / `accent-glow`；`.title em` 和 `.on .n` 换 `accent-ink`；`.phone` 阴影换 `shadow-float`；`.milo` 浅色下改透明度。
  - 主题按钮改成整页一起切。
  - 改文案：`DemoPage.tsx:81`、`:121`。
- **Mascot**：
  - `.sheen` 改固定浅色（现在用 `brand-mark` + `screen`，浅色下消失）；
  - Milo 的发光换 `accent-glow`；`.z`、`.confetti`、`.spark` 换 `fx-spark-*`；
  - 浅色下 `.img` 加墨色细边。
- **growth.module.css**：`:99` 冻结周、`:160-166` 占位图形换 `brand-mark` / `data-tier-over`；`:28` 换 `accent-ink` / `accent-glow`；其余淡色光晕换 `accent-glow*`。
- **BrandSpec** `:33-34` 去掉强制骨白；**Playground** `:89,104,107` 换 `brand-mark`。
- **转场压暗**（`interactive.css:127-135`）：浅色下 `brightness(0.4)` 改成 0.85，避免灰闪。

## 6. 同步、门禁、文档
- **`/playground`**：
  - BodyFigure、SteelPlate、RewardCard、Mascot 的说明加浅色；
  - 人体条目加 `LightLook` 轴；
  - 钢板浅色格（新增）。
- **`/demo`** 文案；**DESIGN** §1.5 改写：删掉「局部深色岛」一节，改成「浅色人体 L 组 / 浅色钢板 / 故事水墨」规则，并修正 `lime-750` 的值。
- **ia、brief** 加决定记录；**handoff-session**、**portfolio-handoff** §3 更新。
- **门禁** `scripts/shoot_6a.py`：
  - **`light_checks` 反过来查**：
    - 舞台、钢板、故事都不带 `data-theme`，计算背景亮度 > 0.8；
    - 浅色钢板：采样孔中心是荧光色，没有灯、没有光束画布；
    - 故事第 1–8 幕各跑一次对比度；
    - 奖励弹窗浅色对比度（通过结算流程或 playground 的 `RewardCard`）；
    - `/demo` 外壳浅色。
  - **`gains_checks`**（`:353-356`）的 `blend == 'screen'` 只在深色查；浅色查 `multiply`。
  - **深色的 `log_checks`** 不变。
- **深色回归**：用 `scratchpad/regress.py` 的方法，和线上（47f2eb7）逐像素比对 /today、/body、/log、/me、/me/level、/shop、/pro、/onboarding?scene=1..8，**必须一致**。

## 执行方式（ultracode workflow）
按区域并行，文件基本不重叠：
- A：人体 + thermal + 胶囊 / 图例 + 方案台 L 组
- B：钢板
- C：奖励 + Mascot + growth / BrandSpec / Playground 小修
- D：故事 + /demo

步骤：
1. **先由主线完成共用部分**：`useElementTheme`、tokens.json 新语义色（`plate/*`）、`build_tokens`。
2. **4 个区域各派一个实现 agent**（worktree 隔离），各自跑 `npm run check` 和对应的门禁类。
3. **主线合并**，再改门禁 / 文档 / playground。
4. **验收**：完整的 `check` + `gate`，深色逐像素回归，浅色全页截图。再派 2–3 个对抗式视觉审查 agent，各看一部分截图找「浅色下看不清 / 发脏 / 深色残留」，修完再跑一遍。

## 验证
- `npm run check`：tsc、400 项单测、写死值、构建、两套主题对比度。
- `python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173`：全套门禁，含改写后的 `light` 类。
- `node scripts/test_figma_plugin.cjs`。
- 深色逐像素回归脚本（见上）。
- 浅色截图：全部页面、故事 8 幕、奖励弹窗、方案台 L 组 4 格、钢板选中态。
- 推 `main`：先 `git merge --ff-only origin/main`，让有内容的提交在最上面（`vercel.json` 的 `ignoreCommand` 坑），然后核对线上 `/demo` 的提交号。
- **交付**：左图右文汇报 + 方案台 L 组链接 + 录屏（浅色熔流在动），用 `SendUserFile` 推给用户，请用户在 L1–L4 里选一个。
