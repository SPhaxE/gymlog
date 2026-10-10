# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 06:10_

## 1. Goal
**当前任务：把浅色模式做成真·全局浅色**（用户 2026-10-10：「还没有实现全局浅色，人体容量、钢板等都需要实现全局浅色」「钢板透光等特效，浅色模式下就可以省去」）。
上一轮留了 5 个局部深色岛（容量舞台、钢板、奖励、故事、/demo 外壳），这次全部去掉。**深色模式必须逐像素不变。**
完整方案已经用户批准：**`docs/light-plan.md`**，照着做即可。
完成标准：浅色下没有任何深色块；方案台 `/preview` 有「L 浅色人体」4 格供用户选；门禁 `light` 类反过来查全部通过；深色逐像素回归一致；推 `main`、线上可看；左图右文汇报 + 录屏推给用户，请用户在 L1–L4 里选。
之后才是**作品集**：先读 `docs/portfolio-handoff.md`。

## 2. Current State
- [x] 走查 1 阶段 1–5（`docs/walkthrough-1.md` §6）；阶段 5 用户回应：人体位置、性能（各 Tab 页稳定 60 帧）都已改
- [x] 容量人体：左缘贴页面边距、裁到刚好露出完整腹肌（`BodyFigure fit`，正面腹肌左缘落在左缘渐隐一半处，正反面同比例）
- [x] **浅色模式**（DESIGN §1.5）：tokens.json 每个语义色加 `light`；`src/styles/theme.ts`（`DEFAULT_THEME` 一键、`?theme=`、「我的 → 外观」、/demo 与 /playground 切换、首帧不闪、安卓状态栏）；新语义色 `accent/ink`、`brand/*`、`picker/*`、`fx/*`、`data/spark-*`；局部深色岛（容量观察窗、钢板、奖励、故事、/demo 外壳）；Figma 插件 Light 模式；门禁 `light` 类；深色逐像素回归一致
- [x] 用户看了浅色：不满意深色岛 → 拍板三件事（见 §5），方案写进 `docs/light-plan.md` 并获批准
- [ ] **全局浅色（`docs/light-plan.md`）——一行代码都还没动**，新窗口从「共用基础」开始
- [ ] 用户在小米 15 上复查性能
- [ ] **Stitch 密钥**：这个容器里没有 `secrets/stitch.env`，等用户再贴一次原文（写进去、`.gitignore` 去掉那一行、提交；不打印）
- [ ] 作品集（`docs/portfolio-handoff.md` §8 的问题先问用户）

## 3. Active Files
- **`docs/light-plan.md`**：本轮要执行的方案（每一处要改的文件和行号都在里面，行号是 47f2eb7 时的）
- `design/tokens/tokens.json`（语义色 `ref` / `light`）→ `scripts/build_tokens.py`（两套变量 + 两套对比度）→ `design/tokens/tokens.css`
- `src/styles/theme.ts`（主题开关）、`index.html`（首帧脚本）
- 要去掉的深色岛：`src/pages/BodyPage.tsx:144` + `.module.css:17-21`（观察窗）、`src/components/plate.tsx:290`（`figure data-theme`）、`Reward.tsx:143/197`、`StoryScreens.tsx:58`（`Screen theme`）、`DemoPage.tsx:93`
- 人体浅色：`src/components/BodyFigure.tsx`（金属色带 `:514`、滤镜 `mf` `:522-552`、熔流 `ThemeFx` `:340-370`）、`thermal.ts`（色带写死原色 hex）、`ui.tsx:124` `TierLegend`、`CapsuleRail.module.css`（引线）、`src/pages/OptionsBoard.tsx`（加 L 组）
- 画布取色：`particles.tsx`（`hexVar(name, el)`、`useTheme`）、`atmosphere.tsx`（`BLOBS_LIGHT`）、`plate.tsx`（`palette(el)`）
- `scripts/shoot_6a.py` 的 `light_checks`

## 4. Changes Made
**本窗口（被自动压缩过）**：只出了 `docs/light-plan.md` 和本文件，代码没动。

**上一窗口（阶段 5 之后，已在 47f2eb7）**
- 性能（DESIGN §7「性能」）：流体背景模糊挪进小画布；主角卡心跳光 = 画一次 + 颗粒 mask + Web Animations；熔流自成一层；粒子颜色查表
- 人体裁切两次修正（先贴两边，再按用户「露出完整腹肌」）
- 浅色模式全套（见 §2）；商城缺货卡改成只压暗图、字退次要色（门禁查出整卡 45% 时「缺货」读不清）；要领页 MuscleWiki 署名挪到示范卡下（命中区 48）；容量页舞台挪进页面边距、观察窗底色画在舞台本身
- 作品集交接 `docs/portfolio-handoff.md`；深 / 浅成对截图 `screenshots/theme/`

## 5. Decisions & Rationale
- 主题靠 `<html data-theme>` + 语义色，不靠 JS 换色：组件一行不改，这正是要验证的
- 荧光拆成两个语义色（面 `accent/default`、字和线 `accent/ink`）：深色里同一个颜色，浅色里必须分开
- ~~容量人体、钢板、奖励、故事保留深色（局部深色岛）~~ → **用户否决（2026-10-10）**，要真·全局浅色。三件事已拍板：
  - **人体**：保留金属渐变（F1）+ 熔流（S9），做 **4 个浅色方案 L1–L4** 放 `/preview` 让用户选（L1 深绿热、L2 荧光热、L3 银金属、L4 墨印；选定前默认 L1；选定后落选的留在方案台）
  - **钢板**：浅色钢面，**孔里露平涂荧光底板**（新语义色 `plate/hole` 浅色 = `lime-550`），淡内阴影；浅色下不画灯、光束、浮尘、光晕
  - **故事引导**：**代码处理成浅色水墨**，不出新素材（夜空换纸白渐变天空；远景反相成淡墨剪影；人物加细墨边）
- 浅色下混合模式整体从「提亮」换成「压暗」：`screen` / `lighter` → `multiply` / `source-over`
- 原色换语义色时只选深色值完全相同的语义色（`lime-500` 字线 → `accent-ink` 等，换法表在 `docs/light-plan.md`「共用基础」），所以深色不变
- 画布从元素自己身上读颜色：深色岛里的画布也取到深色值
- 深色模式不许变：每次改完和线上逐像素比对

## 6. Failed Attempts
- 流体背景「每团光斑画一次 + 合成器漂移」：主线程省了，但合成器每帧叠四层大光斑，掉帧反而更多 → 回到小画布里先模糊
- 观察窗底色画在 `::before`：对比度审计按祖先背景算，以为胶囊字在纸白上 → 底色画在舞台本身
- 腹肌素材路径比看到的腹肌列宽：按路径左缘裁会露腹斜肌 → 腹肌左缘落在渐隐一半处
- **推 main 别让最后一个提交只差 apk**：`vercel.json` 的 `ignoreCommand` 只比 `HEAD^ HEAD`（第一个父提交）且排除 `apk/`。把 `origin/main`（最新是 CI 的 apk 提交）合并进工作分支再推，合并提交对第一个父提交只差 apk → Vercel 跳过部署（2026-10-10 踩过）。做法：先 `git merge --ff-only origin/main` 或 rebase，再让有内容的提交排在最上面
- 无头 Chromium 没有 H.264：要领页在门禁 / 截图里走「示范加载失败」分支；要看真播放，用 ffmpeg 转一份 webm，`page.route('**/*.mp4*')` 换掉（录屏就是这么录的）
- 同一父元素下两个兄弟用同一个 key（`GuideVideo` / `GuideSteps` 都用 `media`）会渲染出两份示范 → key 加前缀
- 无头截图在转场进行中拍不到中间帧 → 录屏 + ffmpeg 抽帧
- 新容器没有 Python Playwright → `pip install playwright`，`executable_path='/opt/pw-browsers/chromium'`

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行；无写死 px / ms / hex（`rgba(` 也算，画布里用 hex8 字符串拼）；命中区 ≥ 48；`/playground` `/demo` 同步；方案台旧方案不删；五步流程；要拍板的图用 `SendUserFile` 推；改完直接推 `main`、只说改了什么
- 密钥不打印；**Stitch 密钥在仓库根 `secrets/stitch.env`**（用户 2026-10-09 让存，`stitch.py` 自动读；不再向用户要）
- 汇报材料：一张连续长图、左图右文；超 8000px 存单页 PDF
- 绝不让对话被自动压缩：每次推 main 顺手更新本文件；只在上下文逼近极限时才停下交接、请用户换窗口——做完一个阶段不用换（用户 2026-10-09 纠正）

## 8. How to Verify
```bash
npm ci && npm run check                                   # tsc · vitest 400 项 · 写死值 · 构建（含两套主题对比度校验）
npx vite preview --port 4173 --host 127.0.0.1 &           # 构建之后再起
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173   # 全套门禁（含 light 类）；失败只重跑 --failed
node scripts/test_figma_plugin.cjs                        # Figma 插件（含 Light 模式）
```
- 线上核对：`https://gymlog-taupe.vercel.app/demo` 的 `assets/index-*.js` 里 `0.1.0 · ` 后面的 7 位提交号
- 浅色：任何页面加 `?theme=light`

## 9. Environment State
- Branch: 工作分支 `claude/charming-volta-6ap863`，发布推 `main`（两边同步推）；本交接基于 d365f83（47f2eb7 + CI apk）
- Uncommitted changes: 无（本文件和 `docs/light-plan.md` 已推上）
- Running services: 无（新窗口要 `npm ci`，构建后自己起 vite preview 4173）
- 深色回归：上一窗口的比对脚本在临时目录里，新窗口要重写——思路：同一组路由，线上（47f2eb7）和本地各截一张、隐藏 canvas、逐像素比
- Env vars / 依赖注意事项: Chromium `/opt/pw-browsers/chromium`；Python Playwright 要先 `pip install playwright`；**Stitch 密钥应在 `secrets/stitch.env`——这个容器里还没有，等用户贴原文**

## 10. Open Questions
- Stitch 密钥原文（新窗口看不到上一窗口的消息）——不挡浅色任务，可先问一句、边做边等
- 浅色人体选 L1–L4 哪个：**等做完、推到 `/preview` 再问**，不要先问
- 作品集：载体、样机机型、封面深 / 浅、要不要单独讲 AI 协作（`docs/portfolio-handoff.md` §8）

## 11. Specific Next Steps
1. 完整读 `docs/light-plan.md`；`npm ci && npm run check` 确认基线全绿。
2. 主线先做共用部分：`src/styles/theme.ts` 加 `useElementTheme(ref)`；tokens.json 加 `plate/*` 语义色 → `python3 scripts/build_tokens.py`。
3. 按方案分 4 区并行（A 人体 + 方案台 L 组、B 钢板、C 奖励 + Mascot + 小修、D 故事 + /demo），合并后改门禁 `light_checks`（反过来查）、`/playground`、DESIGN §1.5 等文档。
4. 完整 `npm run check` + 门禁 + 深色逐像素回归 + 浅色全页截图审查。
5. 推 `main`（先 `git merge --ff-only origin/main`），核对线上；左图右文汇报 + `/preview` L 组链接 + 录屏用 `SendUserFile` 推给用户，请用户选 L1–L4。
6. 之后：Stitch 密钥（拿到就写进 `secrets/stitch.env` 提交）→ 作品集（`docs/portfolio-handoff.md` §8 的问题先问用户）。
