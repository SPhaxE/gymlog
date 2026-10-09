# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-09 19:10_

## 1. Goal
按**走查 1**（用户 2026-10-08 的 PDF 走查，29 条）把 App 改到位：同源问题归组统一改、写进规范（`docs/DESIGN.md`），按阶段执行、每阶段汇报。计划全文在 `docs/walkthrough-1.md`（§1 逐项、§2 A–J 归组、§3 新规则、§4 阶段、§6 进度 + 用户选定 + 每阶段落地记录）。
「完成」= 六个阶段都落地；每阶段 `npm run check` + 门禁全绿、推 `main`、线上 /demo 是新代码；`/playground`、`/demo` 路线同步；方案台旧方案不删。

## 2. Current State
- [x] 阶段 1：沉浸式全屏、不该滚的不滚、休息计时只留胶囊、删「演示」、找动作人体、故事曲线、排版、分段加载、描线顺序
- [x] 阶段 2：拍板材料（线框 + 方案台 P / S / J / T）
- [x] 阶段 3：七件拍板落地 + H 组、Stitch 视频页 v7
- [x] 主角卡选 **H4**（固定颗粒 + 薄模糊 + 心跳泵动，`Card hero` 默认）；商品不加了、五件够用 → 删掉已下架的镁粉（用户 2026-10-09）
- [x] **阶段 4 转场与动效**（本窗口）：Tab 横滑、子页推入推出、面板 / 对话框 / 轻提示退场、首页卡 → 要领 M03、商品卡 → 详情 M03、曲线钻入对位、出现式图标描线、牛龄页小牛点按；DESIGN §7 转场表、§9.6 第 19 条、§6 出现式描线
- [ ] **等用户看**：阶段 4 录屏 `screenshots/walkthrough-1/stage4-motion.mp4`（点头或提改）
- [ ] **等用户选**：视频页 Stitch V1–V3（`screenshots/hifi/v7/v7-board.png`；Claude 倾向 V1）——阶段 5 搭之前问
- [ ] 阶段 5：容量页 #12 #29 + 奖励弹窗 #23 + 视频页按 Stitch 选定搭建；阶段 6 收尾、作品集（真实 iOS / 安卓样机）

## 3. Active Files
- `docs/walkthrough-1.md` — 计划与进度（§6「阶段 4 落地记录」先读）
- `src/components/motion.tsx` — `viewTransit`（整页转场骨架）、`pageSwapped`、`drillTransition`
- `src/shell/pageNav.ts` — `usePageNav().push / back`、`useSharedList` / `useSharedDetail`（M03 跨页）
- `src/shell/AppShell.tsx` — `onTab`（Tab 横滑 + 休息进度条飞行）、系统返回键的转场
- `src/components/interactive.css` — 所有 View Transitions 的 CSS（tab / push / pop / drill / back、`x-tabnav`、`dline` 拉满）
- `src/components/overlay.tsx` — `useExitGhost`（退场复制品）；`Sheet.tsx`、`feedback.tsx`（Dialog、ToastSlot）接上
- `src/components/charts.tsx` — `TrendChart tail`（曲线对位罩层）、`trendDrawBack`
- `src/components/particles.tsx` — `GrainGlow kind="pulse"`（H4）、`heartbeat()`
- `src/components/growth.tsx` — `StageHero` 小牛点按
- `src/pages/OptionsBoard.tsx` — 方案台 `#grain` H0–H4

## 4. Changes Made（本窗口）
- 主角卡 H4：`GrainGlow pulse` = 固定颗粒遮罩 × 椭圆径向渐变，心跳一大一小两下再歇一拍（1.8 秒；`calm` 2.6 秒、亮度 0.75）；`Card hero` 自带，训练中 / 恢复日 `calm`；外压 `space/xs × 0.25` 模糊；旧的 CSS 渐变移到方案台当 H0
- 删液体镁粉（`PRODUCTS` 五件），门禁改测旧链接「没有这件商品」，ia / demo 文案同步
- 新 Token `motion/ease-accelerate`（退场用）
- 阶段 4 全部（见 `docs/walkthrough-1.md` §6「阶段 4 落地记录」）

## 5. Decisions & Rationale
- 页面转场全用 View Transitions 整页快照（不搞双页同时挂载）：改动最小、和已有 M03 / M09 同一套；/demo 是 iframe 里跑 App，整页滑不会带走讲解栏
- 子页推入没做「全局自动判断方向」，而是显式 `push / back`：按路由深度猜方向会错（商品详情 → 会员页其实是推入）
- 退场用「卸载时留复制品」而不是每个调用处改成先播再卸：父组件选完直接不渲染的情况（换一个、找动作）也有退场，调用处不用改
- M03 跨页的「是不是从列表行长出来的」放在 history state（`m03`），不放模块变量：从别处推入同一页时不会误起共享名（误起名会让内容不跟着页面滑）
- 训练中从主角卡「要领」进要领页是推入，不是 M03（那是一个小链接，不是卡片）

## 6. Failed Attempts
- 无头截图在转场进行中会拍到黑帧 → 看动效一律用录屏（`record_video_dir`）+ ffmpeg 抽帧
- 在 `cd` 后用相对路径 `rm` 会被安全检查拦 → 临时文件放 scratchpad、用新目录名，不删
- 新窗口容器里没有 Python Playwright → `pip install playwright`，启动时 `executable_path='/opt/pw-browsers/chromium'`

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行；无写死 px / ms / hex（`rgba(` 也算，画布里用 hex8 字符串拼）；命中区 ≥ 48；`/playground` `/demo` 同步；方案台旧方案不删；五步流程；要拍板的图用 `SendUserFile` 推；改完直接推 `main`、只说改了什么
- 密钥不进仓库、不打印；Stitch 用 `STITCH_API_KEY` 环境变量（新窗口没有密钥，需要时问用户）
- 汇报材料：一张连续长图、左图右文；超 8000px 存单页 PDF
- 绝不让对话被自动压缩：每阶段收尾更新本文件；一个窗口做完一个阶段就主动交接

## 8. How to Verify
```bash
npm ci && npm run check                                   # tsc · vitest 398 项 · 写死值 · 构建
npx vite preview --port 4173 --host 127.0.0.1 &           # 构建之后再起
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173   # 全套门禁；失败只重跑 --failed
```
- 线上核对：`https://gymlog-taupe.vercel.app/demo` 的 `assets/index-*.js` 里 `0.1.0 · ` 后面的 7 位提交号
- 测试状态：阶段 4 收尾 `npm run check` 全绿（398 项）；全套门禁结果见下一行
- 门禁：阶段 4 收尾全套 17 份全绿（905 项）；新加的转场断言（me：推入 / 推出 / Tab 往左往右 / 处方卡 ↔ 要领 / 面板退场复制品；shop：商品卡 M03）单跑也全绿

## 9. Environment State
- Branch: 工作分支 `claude/trusting-goldberg-5cmk1f`，发布推 `main`（两边同步推）
- Uncommitted changes: 无（本文件随阶段 4 提交推上）
- Running services: vite 5199（dev）、vite preview 4173（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium `/opt/pw-browsers/chromium`；Python Playwright 要先 `pip install playwright`；Stitch 密钥**新窗口没有**

## 10. Open Questions
- 阶段 4 录屏看完有没有要改的（Tab 横滑是整页跟着滑、旧页压暗；子页推入旧页让三成；M03 返回时列表立刻淡入）
- 视频页 Stitch 选哪版：V1（Claude 倾向）/ V2 / V3，或混搭
- 下次跑 Stitch 的密钥：请用户把 `STITCH_API_KEY` 加进环境变量，或再给一次

## 11. Specific Next Steps
1. 先问第 10 节前两条，给出 `screenshots/walkthrough-1/stage4-motion.mp4`
2. 阶段 5：容量页 #12（人体右移到手刚碰到胶囊、常态无引线、长按才出折线引线且出现 / 消失有延迟、放大胶囊背后泛光、人体区左右滑翻正背）、#29 胶囊点开 = M02 流体胶囊形变（原地膨胀成浮层，不是底部抽屉）、#23 奖励弹窗排版（先出图给用户看）、视频页按 Stitch 选定搭建（五步流程：要 Stitch 密钥）
3. 阶段 5 还有 #10 #18 的「配重片同心环纹」6 处换粒子材质（增量页头已换 P3；成长卡、牛龄页、知识卡、开通成功、曲线页头还没换）——先确认范围
4. 每阶段收尾：check + 门禁 → 更新本文件 → 推 main → 核对线上 → 汇报（左图右文 PDF + 录屏）
