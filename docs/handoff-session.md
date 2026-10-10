# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 09:30_

## 1. Goal
**全局浅色已完成并上线**（`docs/light-plan.md`，用户已批准）：浅色模式下没有任何深色块（容量人体、钢板、奖励弹窗、故事引导、/demo 外壳都跟主题走），深色模式逐像素不变。
现在等用户在方案台 `/preview` 的「浅色人体 · L」里选 **L1–L4** 之一；选定后改 `src/components/BodyFigure.tsx` 的 `DEFAULT_LIGHT_LOOK`，落选的留在方案台。
之后是**作品集**：先读 `docs/portfolio-handoff.md`（§3 已改成「真·全局浅色」的反转故事）。

## 2. Current State
- [x] 走查 1 阶段 1–5；性能（各 Tab 页稳定 60 帧）；容量人体裁到露出完整腹肌
- [x] 浅色模式第一版（语义色浅色映射、`<html data-theme>` 一键切、「我的 → 外观」）
- [x] **真·全局浅色**（本窗口）：5 个局部深色岛全部去掉
  - 人体：4 个浅色方案 L1 深绿热（默认）/ L2 荧光热 / L3 银金属 / L4 墨印，方案台 L 组 4 台手机 + 全热度对照，自由组合 `?l=`
  - 钢板：浅色拉丝铝板、孔里平涂荧光、不打灯
  - 奖励弹窗：纸白卡、荧光闪、深绿细边代替发白
  - 故事：代码处理成浅色水墨（不出新素材）；/demo 整页一起切
  - 小牛墨色细边、按钮光环高光、转场压暗等零碎
  - /playground：人体加 L1–L4 固定浅色格、钢板加浅色格、说明补浅色；DESIGN §1.5、ia、brief、portfolio-handoff 同步
- [ ] **用户选 L1–L4**（问用户，不要自己定）
- [ ] 用户在小米 15 上复查性能
- [ ] Stitch 密钥：这个容器里没有 `secrets/stitch.env`（用户 2026-10-10 说先不管）
- [ ] 作品集（`docs/portfolio-handoff.md` §8 的问题先问用户）

## 3. Active Files
- `src/styles/theme.ts`：`useTheme()` 全局主题；**`useElementTheme(ref)`** 元素最近的 `[data-theme]`（方案台 / Playground 单格强制深浅用）
- `design/tokens/tokens.json`：新增 `plate/steel-top|steel-bottom|hi|lo|label|hole`（深色值 = 原来代码用的原色）
- `src/components/BodyFigure.tsx`：`LightLook` 上下文、`LIGHT_LOOKS`、**`DEFAULT_LIGHT_LOOK`**（用户选定后改这一行）、`useLightLook`；`thermal.ts` 的 `heatCss` 可传原色名数组、`tintMatrix`
- `src/components/plate.tsx`：浅色加 `.light` 类、不挂灯不画画布、`--plate-lo-k`
- `src/components/Reward.module.css`、`Mascot.module.css`、`growth.module.css`、`Button.module.css`（`--glow-hi`）、`interactive.css`（`--vt-dim`）
- `src/pages/StoryScreens.module.css`（浅色水墨）、`DemoPage.*`、`Screen.tsx`（删了 `theme` 属性）
- `src/pages/OptionsBoard.tsx`：L 组（两台一组 `.pairs`：宽屏一排 4 台，否则 2 × 2）、人体存档格与钢板格固定深色标「深色方案」
- `scripts/shoot_6a.py` 的 `light_checks`：反过来查（页里不许有 `data-theme` 局部主题、人体 multiply、钢板无灯无画布且孔心 = 荧光、故事 8 幕、奖励 18 种、/demo）；`CONTRAST` 认得渐变字；`CONTRAST_IN` 只查一个元素里

## 4. Changes Made
**本窗口**（按 light-plan 分 4 区并行，合并后主线收尾）
- 共用基础 `d152adc`：`useElementTheme`、`plate/*` 语义色
- B 钢板 `b53bbd2`、D 故事 + /demo `c057e17`、C 奖励 + Mascot + 零碎 `4f3a114`、A 人体 + 方案台 L 组 `a408616`
- 主线：门禁 `light` 类重写；按钮光环浅色高光；/playground 与方案台同步；文档；L 组排版两台一组
- 验证：`npm run check` 全绿（400 项）；`shoot_6a.py` 全套 19 / 19 份、1184 项通过；深色逐像素回归（见 §8）

## 5. Decisions & Rationale
- 用户否决局部深色岛（2026-10-10）：「还没有实现全局浅色，人体容量、钢板等都需要实现全局浅色」「钢板透光等特效，浅色模式下就可以省去」
- 原则「提亮 → 压暗」：`screen` / `lighter` → `multiply` / 普通叠放；`brightness` 发白 → `accent-ink` 细边 + `accent-glow`
- 原色换语义色只选深色值完全相同的那个 → 深色不变
- 钢板用 `.light` 类而不是 `[data-theme='light'] .x`：浅色页里嵌深色格时选择器会误判
- A 调过 L1 / L4 的色带（演示数据热度大多 ~0.3，按计划的色带 L1 和 L2、L3 和 L4 分不开）：L1 中段提前进深绿、最热到 ink-900；L4 更快变深
- 方案台人体存档方案（只有 O2 + F1 + S9 有浅色版）和钢板三格固定深色

## 6. Failed Attempts
- 4 个并行分区中途撞上 API 额度上限，SendMessage 让它们从断点续上即可（改动都在各自 worktree 里）
- 深色回归整页 / 整节截图：上面多一格，下面的节就挪零点几像素、抗锯齿变 → 改成「只留一节、隐藏节头、行标签列定宽、按格子 key 逐格比」（`regress_cells.py`）
- 回归噪声来源：背景颗粒用 `Math.random`（固定种子）、计时器（Playwright 假时钟）、钢板固定光源跟位置走、休息倒计时弧
- `pkill -f "vite preview --port 4173"` 会把自己的 shell 也杀掉（命令行里含同一串）
- 之前窗口的坑仍有效：推 main 别让最后一个提交只差 apk（`vercel.json` 的 `ignoreCommand`）；无头 Chromium 没有 H.264；新容器 `pip install playwright`

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行；无写死 px / ms / hex；命中区 ≥ 48；`/playground` `/demo` 同步；方案台旧方案不删；要拍板的图用 `SendUserFile` 推；改完直接推 `main`、只说改了什么
- 深色模式不许变：改主题相关的东西都要跑深色回归
- 绝不让对话被自动压缩：每次推 main 顺手更新本文件

## 8. How to Verify
```bash
npm ci && npm run check
npx vite preview --port 4173 --host 127.0.0.1 &
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173          # 含 light 类
```
- 深色逐像素回归（脚本在本窗口 scratchpad，新窗口要重写）：基线 = 改之前的构建（`git stash` / 旧提交 `npm run build` 后 `vite preview --outDir`），候选 = 当前；同一组路由冻结动画、隐藏画布、固定 `Math.random` 种子、Playwright 假时钟，逐像素比；/playground、/preview 按格子 key 逐格比（只留一节、隐藏节头、行标签列定宽）
- 本窗口结果：所有 App 页面、故事 8 幕、/demo 一致；/playground 714 格、/preview 45 格对齐后一致；只剩休息倒计时、钢板固定光源（位置相关）这类噪声
- 浅色：任何页面加 `?theme=light`；方案台 L 组 `/preview#light-body`

## 9. Environment State
- Branch: 工作分支 `claude/clever-clarke-ibqpiz`，发布推 `main`（两边同步）
- Uncommitted changes: 无
- Running services: 无（新窗口要 `npm ci`、构建后自己起 vite preview）
- Env: Chromium `/opt/pw-browsers/chromium`；Python Playwright 先 `pip install playwright`；`ffmpeg` 在（录屏转 mp4）

## 10. Open Questions
- **浅色人体选 L1–L4 哪个？**（已推到方案台、汇报已发；用户没回复前默认 L1）
- 作品集：载体、样机机型、封面深 / 浅、要不要单独讲 AI 协作（`docs/portfolio-handoff.md` §8）
- Stitch 密钥（用户说先不管）

## 11. Specific Next Steps
1. 等用户选 L1–L4 → 改 `BodyFigure.tsx` 的 `DEFAULT_LIGHT_LOOK`、方案台标「选定」、DESIGN §1.5 记一笔、brief 决定记录加一行；落选的留在方案台。
2. 用户若对某个浅色细节有意见（钢板休息圈深浅、奖励弹窗、故事水墨透明度等），改完照样跑深色回归。
3. 之后作品集：先问 `docs/portfolio-handoff.md` §8 的问题。
