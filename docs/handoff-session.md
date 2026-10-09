# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 01:00_

## 1. Goal
按**走查 1**（用户 2026-10-08 的 PDF 走查，29 条）把 App 改到位：同源问题归组统一改、写进规范（`docs/DESIGN.md`），按阶段执行、每阶段汇报。计划全文在 `docs/walkthrough-1.md`（§1 逐项、§2 A–J 归组、§3 新规则、§4 阶段、§6 进度 + 用户选定 + 每阶段落地记录）。
「完成」= 六个阶段都落地；每阶段 `npm run check` + 门禁全绿、推 `main`、线上 /demo 是新代码；`/playground`、`/demo` 路线同步；方案台旧方案不删。

## 2. Current State
- [x] 阶段 1–4（见 `docs/walkthrough-1.md` §6）
- [x] **阶段 5**（本窗口）：容量页 #12 #29（人体右移、常态无引线 / 长按折线、泛光、左右滑切正反、胶囊 → `FluidPanel` M02 浮层）、奖励弹窗 #23、视频页 #05（Stitch V1：`GuideVideo` / `GuideSteps`）、同心纹全换 `OrbitPlate`、今天已练完换 `GrainGlow pulse calm`；规范 / playground / demo / 门禁同步。落地记录 `docs/walkthrough-1.md` §6「阶段 5 落地记录」
- [x] 用户看过阶段 5：人体左缘没贴规范 → 改成按可用宽度裁（左贴边距、右贴胶囊）；小米 15 略卡 → 不降视效的性能优化（DESIGN §7「性能」，各 Tab 页稳定 60 帧）
- [ ] **Stitch 密钥**：用户说已在 GitHub 放行、让把 `secrets/stitch.env` 提交上去，但新容器里没有这个文件、对话里也没有密钥原文（上一窗口的消息看不到）→ 等用户把 `STITCH_API_KEY=…` 再贴一次，写进 `secrets/stitch.env`、从 `.gitignore` 去掉那一行、提交推 main（不打印密钥）
- [ ] 阶段 6 收尾、作品集（真实 iOS / 安卓样机）

## 3. Active Files
- `src/pages/BodyPage.tsx` + `src/components/CapsuleRail.tsx`（`useLeader`）+ `src/components/FluidPanel.tsx`（M02 浮层）+ `interactive.css`（`.fluid` / `.fscrim`）
- `src/components/guide.tsx`（`useGuidePlayer` / `GuideVideo` / `GuideSteps` / `GuideCue`）+ `src/pages/ExerciseGuidePage.tsx`
- `src/components/Reward.tsx`（pr 分支层级）、`src/components/particles.tsx`（`OrbitPlate`）
- `scripts/shoot_6a.py`（gains 类里的容量页检查、me 类里的要领页检查）

## 4. Changes Made（本窗口）
- 阶段 5 全部，见 `docs/walkthrough-1.md` §6「阶段 5 落地记录」；删掉 `GuideDrawer`、`MediaFrame fill`、`Sheet sharedId`（都没人用了）
- 门禁：曲线页返回那条改成等转场就绪（这台容器转场就绪要 360–600ms，原来固定只等 300ms）；长按引线那条改成等线出现

## 5. Decisions & Rationale
- 胶囊 → 详情用独立的 `FluidPanel`（不改 `Sheet`）：浮层定位、裁圆角的转场和底部抽屉的拖拽档位是两回事
- M02 快照交叉淡化放在前半程（旧 0–50%、新 25–65%）：最初旧的 150ms 就淡完，缩回时有一段空框在缩
- 遮罩单独起共享名并用 z-index 排在整页之上、面板之下：只有新状态才有的组默认排在最后，会盖住正在长大的面板
- 视频进度逐帧写 CSS 变量，不走 React 状态：只有「当前一步」变了才重渲染
- 关键帧缩略图直接用同一个视频 `#t=段中点` 定格（mp4 只有约 40 KB），不另做图

## 6. Failed Attempts
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
npm ci && npm run check                                   # tsc · vitest 400 项 · 写死值 · 构建
npx vite preview --port 4173 --host 127.0.0.1 &           # 构建之后再起
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173   # 全套门禁；失败只重跑 --failed
```
- 线上核对：`https://gymlog-taupe.vercel.app/demo` 的 `assets/index-*.js` 里 `0.1.0 · ` 后面的 7 位提交号
- 测试状态：阶段 5 收尾 `npm run check` 全绿（400 项）；全套门禁结果见下一行
- 门禁：见本次提交说明（阶段 5 收尾全套跑过）

## 9. Environment State
- Branch: 工作分支 `claude/charming-volta-6ap863`，发布推 `main`（两边同步推）
- Uncommitted changes: 无（本文件随阶段 5 提交推上）
- Running services: vite 5199（dev）、vite preview 4173（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium `/opt/pw-browsers/chromium`；Python Playwright 要先 `pip install playwright`；**Stitch 密钥应在 `secrets/stitch.env`——这个容器里还没有，等用户贴原文**

## 10. Open Questions
- Stitch 密钥原文：请用户再贴一次（新窗口看不到上一窗口的消息）

## 11. Specific Next Steps
1. 拿到 Stitch 密钥原文 → 写 `secrets/stitch.env`（`STITCH_API_KEY=…`）、`.gitignore` 去掉 `secrets/stitch.env`、提交推 main；全程不打印。
2. 用户在真机上复查这次的性能（新 APK）。
3. 阶段 6 收尾（`docs/walkthrough-1.md` §4）：`HANDOFF.md`、`brief.md` 决定记录、`/demo` 路线文案、`/playground` 全量核对；打 APK 给用户真机走查 2；之后作品集（真实 iOS / 安卓样机）。
- 性能测法：`scratchpad` 里的 perf 脚本思路——每页静置 4 秒，CDP `Performance.getMetrics` 的 TaskDuration + rAF 间隔 > 20ms 计慢帧 + trace 里 DrawFrame / RasterTask；逐个用注入 CSS 关掉嫌疑元素对比。
