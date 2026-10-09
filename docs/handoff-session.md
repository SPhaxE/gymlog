# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 03:30_

## 1. Goal
走查 1 的六个阶段收尾后，进入**作品集**。作品集之前先做了两件（用户 2026-10-10）：容量人体裁到刚好露出完整腹肌；**全局浅色模式**（代码级一键切换，验证 Token）。
作品集怎么做、讲什么、素材在哪：**先读 `docs/portfolio-handoff.md`**（这次写的作品集交接，8 节）。

## 2. Current State
- [x] 走查 1 阶段 1–5（`docs/walkthrough-1.md` §6）；阶段 5 用户回应：人体位置、性能（各 Tab 页稳定 60 帧）都已改
- [x] 容量人体：左缘贴页面边距、裁到刚好露出完整腹肌（`BodyFigure fit`，正面腹肌左缘落在左缘渐隐一半处，正反面同比例）
- [x] **浅色模式**（DESIGN §1.5）：tokens.json 每个语义色加 `light`；`src/styles/theme.ts`（`DEFAULT_THEME` 一键、`?theme=`、「我的 → 外观」、/demo 与 /playground 切换、首帧不闪、安卓状态栏）；新语义色 `accent/ink`、`brand/*`、`picker/*`、`fx/*`、`data/spark-*`；局部深色岛（容量观察窗、钢板、奖励、故事、/demo 外壳）；Figma 插件 Light 模式；门禁 `light` 类；深色逐像素回归一致
- [ ] 用户在小米 15 上复查性能 + 看浅色
- [ ] **Stitch 密钥**：这个容器里没有 `secrets/stitch.env`，等用户再贴一次原文（写进去、`.gitignore` 去掉那一行、提交；不打印）
- [ ] 作品集（`docs/portfolio-handoff.md` §8 的问题先问用户）

## 3. Active Files
- `design/tokens/tokens.json`（语义色 `ref` / `light`）→ `scripts/build_tokens.py`（两套变量 + 两套对比度）→ `design/tokens/tokens.css`
- `src/styles/theme.ts`（主题开关）、`index.html`（首帧脚本）
- 深色岛：`src/pages/BodyPage.*`（`.stage` 观察窗）、`src/components/plate.tsx`（`figure data-theme`）、`Reward.tsx`、`Screen theme`、`DemoPage`
- 画布取色：`particles.tsx`（`hexVar(name, el)`、`useTheme`）、`atmosphere.tsx`（`BLOBS_LIGHT`）、`plate.tsx`（`palette(el)`）
- `scripts/shoot_6a.py` 的 `light_checks`

## 4. Changes Made（本窗口，阶段 5 之后）
- 性能（DESIGN §7「性能」）：流体背景模糊挪进小画布；主角卡心跳光 = 画一次 + 颗粒 mask + Web Animations；熔流自成一层；粒子颜色查表
- 人体裁切两次修正（先贴两边，再按用户「露出完整腹肌」）
- 浅色模式全套（见 §2）；商城缺货卡改成只压暗图、字退次要色（门禁查出整卡 45% 时「缺货」读不清）；要领页 MuscleWiki 署名挪到示范卡下（命中区 48）；容量页舞台挪进页面边距、观察窗底色画在舞台本身
- 作品集交接 `docs/portfolio-handoff.md`；深 / 浅成对截图 `screenshots/theme/`

## 5. Decisions & Rationale
- 主题靠 `<html data-theme>` + 语义色，不靠 JS 换色：组件一行不改，这正是要验证的
- 荧光拆成两个语义色（面 `accent/default`、字和线 `accent/ink`）：深色里同一个颜色，浅色里必须分开
- 容量人体、钢板、奖励、故事保留深色（局部深色岛）：材质和舞台感比机械翻转重要
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
- Branch: 工作分支 `claude/charming-volta-6ap863`，发布推 `main`（两边同步推）
- Uncommitted changes: 无（本文件随阶段 5 提交推上）
- Running services: vite 5199（dev）、vite preview 4173（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium `/opt/pw-browsers/chromium`；Python Playwright 要先 `pip install playwright`；**Stitch 密钥应在 `secrets/stitch.env`——这个容器里还没有，等用户贴原文**

## 10. Open Questions
- Stitch 密钥原文（新窗口看不到上一窗口的消息）
- 作品集：载体、样机机型、封面深 / 浅、要不要单独讲 AI 协作（`docs/portfolio-handoff.md` §8）

## 11. Specific Next Steps
1. 问用户 §10 的问题；拿到 Stitch 密钥就写进 `secrets/stitch.env` 提交。
2. 用户真机复查性能与浅色，按反馈微调。
3. 按 `docs/portfolio-handoff.md` 开工作品集：真机录屏 / 截图 → 套真实 iOS / 安卓样机 → 9 段叙事。
