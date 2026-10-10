# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 23:59_

## 1. Goal
**把「进入作品集之前」剩下的事做完**，然后开作品集。用户 2026-10-10：「进入作品集之前，我们还有哪些要做的，交给下个窗口。」
完成标准：§2 的待办全部打勾（或用户明确划掉）；`HANDOFF.md`、`docs/portfolio-handoff.md` 与现状一致；作品集要用的截图 / 录屏是最新的。

## 2. Current State
已完成（全部在 `main`，线上 /demo 已是 `baa6397`）：
- [x] 浅色分支合进 main；**浅色荧光焦点**（深色是荧光的焦点，浅色仍是荧光：荧光笔 / 荧光块 / 荧光 + 细黑边，`global.css` 的 `--fluo-*`）+ **浅色走查**（去荧光雾、建档选中卡、Pro 方案分段、增量持平段与组头）；门禁加跨主题荧光焦点比对（`shoot_6a.py` 的 `LIME_SCAN`）。DESIGN §1.5 第 9、10 条
- [x] **性能巡检**：钢板光束静态化 + 浮尘单独一层、光束先叠加后整张模糊一次（打开记录页长任务 9.4 → 1.4 秒 @4×降速，静置 25 → 59 帧）；同心环粒子 1 倍分辨率（增量页静置 30 → 48 帧）。视效不变
- [x] **`docs/UIUX-AI协作工作流.md`**：通用、精简、无项目举例、无版本之分（用户要求）；以后新坑 / 新优化都按普适写法回写进去

**进入作品集之前还要做的（按建议顺序）**：
- [ ] **A. 用户验收浅色最新效果**（荧光焦点 + 走查；改前改后对照图已推给用户，用户还没回）——有意见先改
- [ ] **B. 用户最后审查一遍 → 打 APK 真机走查**（用户 2026-10-07 定：真机体检改为「用户最后审查一遍后打包 APK 走查」）。APK 由 CI 自动打在 `main` 的 `apk/milo-debug.apk`。顺带看一直没验的：放大镜跟手帧率、Android 返回键在训练中 / 改数面板、360 × 640 矮屏训练中一屏几组、小米 15 上浅色阴影 / 模糊的性能。用户若出批注 → 按协作工作流 §3.3（参考 `docs/walkthrough-1.md`）
- [ ] **C.（可选）性能第二轮**：首页、容量页静置 CPU 仍约 60%（4×降速、无 GPU 的相对值），来自流体背景 + 主角卡心跳光 + 容量人体熔流等持续动效；只做不降视效的优化（协作工作流 §5「性能与降级」）。用户没要求，先问做不做
- [ ] **D. 文档对齐现状**：`HANDOFF.md` 还写着「2026-10-09 走查 1 进行中」「浅色人体默认 L1」等过时内容 → 改成现状（走查 1 完成、浅色 L2d + C3、荧光焦点、性能巡检、协作工作流）；`docs/portfolio-handoff.md` 的数字与浅色段落更新（门禁 1262 项；浅色经历的几轮与最终规则；「AI 协作」一段可用协作工作流当底稿）
- [ ] **E. 重拍作品集素材**：`screenshots/theme/`（深浅成对图）是浅色治理前拍的 → 按最新代码重拍并推给用户；视需要补浅色录屏（MP4）；核对 `screenshots/walkthrough-1/stage4-motion.mp4`、`stage5-*` 是否仍与现状一致
- [ ] **F. 作品集开工前问用户 4 件事**（`docs/portfolio-handoff.md` §8）：载体（网站 / Behance / PDF，尺寸篇幅）、iOS 样机用哪代 iPhone（安卓用小米 15 真机框）、封面深 / 浅 / 并排、要不要单讲 AI 协作

## 3. Active Files
- `docs/UIUX-AI协作工作流.md` — 通用工作流（§3 逐页、§3.3 真机走查、§5 性能、§6 门禁、§8 会话）
- `docs/portfolio-handoff.md` — 作品集交接（§1 九段叙事、§8 开工前问题）
- `HANDOFF.md` — 项目级交接（待更新，见 D）
- `docs/DESIGN.md` §1.5 — 主题与浅色规则
- `src/styles/global.css` — 浅色 `--depth-*`、`--fluo-*`
- `src/components/plate.tsx` — 钢板：光束静态层 `front` + 浮尘层 `motesRef`；光束先画进 `raw` 再整张模糊进 `beams`
- `src/components/particles.tsx` — `ParticleField soft`（OrbitPlate 用 1 倍分辨率）
- `scripts/shoot_6a.py`（门禁，含 `LIME_SCAN`）、`scripts/regress_dark.py`（深色逐像素回归）

## 4. Changes Made（本窗口）
- `d07ffd0` 浅色荧光焦点 + 走查；门禁跨主题比对
- `baa6397` 性能巡检（钢板、粒子）；`docs/UIUX-AI协作工作流.md` 通用精简版
- 本提交：本交接

## 5. Decisions & Rationale
- 荧光 = 各页焦点点缀色（用户）；浅色墨黑只对位深色的骨白实心（选中 / 确认 / 一次性强标）
- 浅色流体背景去掉荧光雾（实测页边偏色 3 → 12）；导航滑块浅色保留浅凹槽（用户选）
- 性能只做视效不变的优化；主包大头是 react-dom / router，没拆
- 协作工作流：用户要求不对比、无版本、不举项目例子、普适简洁（给 AI 读省上下文）；用户最初的模板原文留在 `docs/workflow.md` 附录作出处

## 6. Failed Attempts / 坑
- **核对线上不要比文件名哈希**（构建把提交号打进包里，本地哈希必然 ≠ 线上）：`js=$(curl -s https://gymlog-taupe.vercel.app/demo | grep -o 'assets/index-[^"]*\.js' | head -1); curl -s https://gymlog-taupe.vercel.app/$js | grep -c <短提交号>`
- 门禁跨主题比对的误报（动画相位、`currentColor` 边框、荧光底里的墨字）已在 `LIME_SCAN` 处理；「浮尘在飘」要对钢板两张画布一起取哈希
- `pkill -f` 会杀掉自己的 shell → `for p in $(pgrep -f '^node.*vite preview'); do kill $p; done`
- 读其他窗口记录（`list_events`）很费上下文，只挑关键窗口读
- 无头 Chromium 没有 H.264；容器无 GPU，性能绝对值偏高，只看相对值

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行、只报结果；不写死 px / ms / hex；命中区 ≥ 48；`/playground`、`/demo` 同步；方案台旧方案不删；要拍板的图用 `SendUserFile` 推；门禁后台跑、做完再跑
- **深色一像素不许变**：Token 只改 `light`，CSS 只写 `[data-theme='light'] …`，改完跑 `scripts/regress_dark.py`
- 浅色：不写描边用 `--depth-*`；深色是荧光的浅色也是荧光（`--fluo-*`）；主视觉只有白 / 荧光 / 黑
- 作品集：真实 iOS / 安卓样机；展示过程；动效录屏
- 每次推 main 顺手更新本文件；逼近上下文极限才换窗口

## 8. How to Verify
```bash
npm ci && npm run check                         # tsc + 400 单测 + 写死值 + 构建
npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173     # 全套门禁（后台，约 5 分钟，19 份 / 1262 项）
# 深色回归：git worktree 出改动前提交 → 软链 node_modules → build → 两个 vite preview --outDir → regress_dark.py shoot ×2 → compare
```
- 当前状态：check 全绿；门禁 19 / 19；深色 17 页逐像素一致；线上 /demo = `baa6397`
- 性能测量（脚本没进仓库）：Playwright + CDP `Emulation.setCPUThrottlingRate 4`，每页量 FCP、加载长任务、静置 4 秒帧率 / 长任务 / `Performance.getMetrics` TaskDuration；热点用 `Profiler` 采样

## 9. Environment State
- **Stitch 密钥：仓库根 `secrets/stitch.env`（.gitignore，不进提交）；新容器里没有——用户 2026-10-10 给过原文，以后不再向用户要；可建议用户配成云环境密钥**
- Branch：工作分支 `claude/friendly-gauss-m528ns`，内容 = `main`；发布推 `main`
- Uncommitted changes：无
- Running services：新容器没有，自己起 `vite preview`
- Env：Chromium `/opt/pw-browsers/chromium`；Python Playwright 先 `pip install playwright`；GitHub 只能用 `mcp__github__*`

## 10. Open Questions
- 浅色最新效果（荧光焦点 + 走查）通过了吗？（A）
- 什么时候做最后审查 + APK 真机走查？（B）
- 性能第二轮要不要做？（C）
- 作品集 4 问（F），作品集开工时再问

## 11. Specific Next Steps
1. 先问 §10 前三条。
2. 不用等用户就能做的：D（更新 `HANDOFF.md`、`portfolio-handoff.md`）→ E（重拍 `screenshots/theme/` 深浅成对图，推给用户）。
3. 按用户对 A / B / C 的回答做；B 若出批注按协作工作流 §3.3。
4. 都完了问 F，开作品集（先读 `docs/portfolio-handoff.md`）。
5. 每次推 main 顺手更新本文件；推后在线上包里搜提交号确认上线。
