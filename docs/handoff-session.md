# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-11（作品集 · 搭建窗口：计划、脚手架、15 屏、P01 两版已出，等用户审 P01）_

## 1. Goal
**按规格把慢牛 Milo 作品集做出来**：22 张 1920 × 1080 的 SVG（能导入 Figma 手调）+ 合并 PDF。
规格：**`docs/superpowers/specs/2026-10-11-portfolio-design.md`**（用户已看过结构并同意转搭建；先完整读它，再读 `docs/portfolio-handoff.md` 对接汇报）。
完成标准：`portfolio/out/svg/` 22 张全部通过 `check.py`；PNG 预览与 PDF 生成；用户逐页验收通过。

## 2. Current State
- [x] App 定稿、APK 真机验收通过（用户 2026-10-10 / 10-11）；App 阶段的旧交接在 git 历史里（`git log -- docs/handoff-session.md`）
- [x] 作品集结构定稿：22 页（规格 §2），视觉体系（§1），素材渲染（§3），动效四种静态呈现（§4），AI / 工具少量提及（§5），封面 AIGC（§6），制作与交付（§7）
- [x] Pixel 8 官方样机框已入库：`portfolio/assets/device/pixel_8/`（来源、合成方法见同目录 README）
- [x] 封面 AIGC 提示词已给用户（附录）；**用户会把图直接放进仓库 `docs/`**
- [x] 实施计划 `docs/superpowers/plans/2026-10-11-portfolio.md`（含「审美要求与自我批评」表）
- [x] 脚手架：`portfolio/lib/pf.py`、`shoot/app.py`（15 屏）、`shoot/device.py`、`shoot/aigc.py`（绿幕贴真屏）、`render.py`、`check.py`
- [x] 15 个 App 屏 `portfolio/assets/screens/`（安全区上 48 dp / 下 24 dp + Android 14 状态栏 + 手势条；用户 10-11 确认样机）
- [x] P01 两版用户通过，**PDF 两版都放**（10-11）
- [x] P09 已推给用户 → **等用户审**（M02 帧：`python3 portfolio/shoot/motion.py m02 mag figure`）
- [ ] P21 → 用户审（**一页一页来**，用户 10-11：「过了你自己那关还要过我这关」）
- [ ] 方案台 / 组件库 / 规范截图、动效帧（`shoot/motion.py`）
- [ ] 其余 19 页按页序 → 每页自检 → 推 `main`
- [ ] 合并 PDF、总览图，交用户验收

## 3. Active Files
- `docs/superpowers/specs/2026-10-11-portfolio-design.md` — 作品集规格（唯一依据）
- `docs/portfolio-handoff.md` — 素材清单（§2）、可写进页面的数字（§3.2）、讲点（§4）、过程叙事（§5）、浅色 / Token 要点（§6）
- `docs/brief.md` — 定位、用户、命名、增长层原则、决定记录（时间轴数字从这里取）
- `docs/DESIGN.md` §1（荧光规矩）、§2（字体字阶）、§7（动效、弹簧参数、性能数字）、§9.7（8motions 落点）
- `docs/walkthrough-1.md` — 走查 1：27 项 → 9 组 → 5 阶段
- `design/tokens/tokens.json` — 作品集配色直接取原色（`gray-*`、`bone-*`、`lime-*`、`paper-*`）
- `screenshots/portfolio/android/` — 现成 15 张深色屏（1082 × 2402，**没有状态栏、没让出挖孔**，规格要求重新渲染）
- `screenshots/brand/`、`design/brand/story/M1.png`、`design/brand/app-icon.png`、`screenshots/wireframes/`、`screenshots/hifi/`、`screenshots/stage3/00-compare.png`、`screenshots/theme/`、`screenshots/icon-grid/board.png`、`screenshots/growth/*.gif`
- `scripts/shoot_theme.py --android` — 现成的 Pixel 尺寸截图脚本，可当 `portfolio/shoot/` 的起点

## 4. Changes Made
（搭建窗口 10-11）计划、`portfolio/` 脚手架、15 屏、`out/svg/01_封面*.svg` + PNG、`out/critique.md`（每页自评记录）、`assets/aigc/cover.jpg`（= docs 里 1_42AM 那张）与 `cover-today.jpg`（贴好真屏）。

（规划窗口）
- `docs/superpowers/specs/2026-10-11-portfolio-design.md`：新建，22 页结构与全部约定
- `portfolio/assets/device/pixel_8/`：Pixel 8 机框（`back.webp` 机身 1187 × 2513、`mask.webp` 圆角与挖孔、`layout` 屏幕位置 (49, 55)）+ README
- 本文件：改写为作品集搭建交接

## 5. Decisions & Rationale（用户 2026-10-11）
- **SVG 为载体**：方便导入 Figma 手调；PDF 由 SVG 合成。文字保持 `<text>`，光晕 / 模糊 / 颗粒先烘进 PNG 图层，只用 `clipPath`，不用 `foreignObject`、CSS、滤镜
- **视觉不受 Milo App 规范限制**：以 Milo 配色 / 字体 / 材质为底，版面可以更大胆（荧光可多处，每页一个主焦点）
- **页头**沿用食律「眉题 + 专题名 + 主张句」，允许变体（压图、封面无页头）
- **样机 Pixel 8**（Claude 定）：与截图同为 20:9；Android Studio 官方素材，真实机型框
- **不用真机、不录屏**：所有屏幕和动效帧都在容器里按 Pixel 8 参数渲染
- **动效四种静态呈现**（Claude 定）：刻度帧序列 / 叠影 / 曲线挂帧 / 切片拼合，外加二维码到线上 `/demo`
- **AI 与工具可以少量提及**：用户岗位预期接受 vibe coding，展示工具面有好处；只在 P02、P18、P20
- **命名只讲**：「慢慢变牛。」+ 慢牛 ↔ Milo 谐音 + 健美祖师爷米洛扛小牛的典故；**删掉股市慢牛、力量之牛**
- **22 页原则上没问题**（用户担心偏多，但认为必要就保留）
- 竞品只写品类、不点名具体产品（brief 规定核实前不写进对外文案）
- 封面两版都出：纯样机版 + AIGC 实拍版；**实拍版用 3 号图（1_42AM，A 手持日常版）**（用户 10-11）
- **页面要有审美追求、有设计感，每页先自评改进再给用户**；**一页一页来，每页用户点头才做下一页**（用户 10-11）

## 6. Failed Attempts / 坑
- 现成截图直接套 Pixel 8：**挖孔压住「正面 / 背面」分段控件**（规划窗口试贴确认）→ 渲染时注入 `--safe-area-inset-top`（App 在 `global.css` 收成 `--safe-top`，`Screen.module.css` 的 `.frame` 用它），再叠一条按 Android 14 规格画的状态栏
- Android 官方「Device Art Generator」网页已拿不到机框；可用的是 googlesource 上 Android Studio 的 `device-art-resources/<机型>/`（`?format=TEXT` 返回 base64），容器能访问
- 截转场中间帧：Playwright `clock.install()` 后时间仍在走，要 `pause_at` 再 `run_for`；View Transitions 还要 CDP `Animation.setPlaybackRate 0` 冻住；无头 + SwiftShader 截一张约 1.4 秒（旧 handoff §6）
- 无头 Chromium 没有 H.264：动作要领页的示范视频用 `scripts/shoot_theme.py` 里现成的 webm 路由处理
- 每次推 `main`（哪怕只改文档）CI 都会打 APK 并自动提交一个 `apk: debug 构建` → 推之前先 `git fetch origin main && git rebase origin/main`，否则会被拒
- `pkill -f` 会杀掉自己的 shell → `for p in $(pgrep -f '^node.*vite preview'); do kill $p; done`
- 渲染 SVG 成 PNG / PDF 时，Chromium 要能找到三套字体：用 `node_modules/@fontsource*` 的字体文件写 `@font-face` 包一层 HTML 再渲染；字体没加载上要报错退出（食律踩过）

## 7. Constraints
- 中文、结论先行、只报结果；对外文案写「Milo」，只在介绍时写「米洛（Milo）」
- **页上数字只从仓库取**（handoff §3.2、brief、DESIGN、walkthrough-1），不手写新数字；性能数字要带测量条件的脚注
- 界面一律是 App 真渲染，不画假界面；MuscleWiki 素材保留署名与水印；演示商家、品牌全是虚构
- AIGC 图只取光影和构图，图里的文字不可信；屏幕绿幕抠掉换真屏
- 需要用户拍板的图（定调页、样机、每页成品）一律用 `SendUserFile` 推到窗口
- 需要用户手动测的地方给可直接复制的命令
- 推 `main` 直接推、不开 PR；推完顺手更新本文件
- 不动 App 本体（`src/`）；作品集只往 `portfolio/` 和 `docs/` 写。若为渲染需要加地址参数，只加不改行为，并跑 `npm run check`

## 8. How to Verify
```bash
npm ci && npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
pip install playwright pillow qrcode pypdf --break-system-packages   # Chromium 已在 /opt/pw-browsers，不要 playwright install
python3 portfolio/shoot/app.py --base http://127.0.0.1:4173           # 渲染 App 屏（待建）
python3 portfolio/pages/gen01.py                                      # 出一页 SVG（待建）
python3 portfolio/check.py portfolio/out/svg                          # 自检（待建）
python3 portfolio/render.py --png --pdf                               # 预览与合并 PDF（待建）
```
- 当前状态：脚手架可用；`python3 portfolio/pages/gen01.py && python3 portfolio/check.py && python3 portfolio/render.py --png --only 01`

## 9. Environment State
- **Stitch 密钥：仓库根 `secrets/stitch.env`（.gitignore，不进提交）；新容器里没有——用户 2026-10-10 给过原文，以后不再向用户要；作品集阶段一般用不到**
- Branch：`main`（规划窗口直接在 main 上提交）
- Uncommitted changes：无
- Running services：无，自己起 `vite preview`
- 线上演示：https://gymlog-taupe.vercel.app/demo （二维码指向这里）
- Env：Chromium `/opt/pw-browsers/chromium`；容器网络能访问 npm、googlesource；Google Fonts 访问不了（字体用 `node_modules/@fontsource*`）

## 10. Open Questions
- P09 是否通过（已推给用户）
- P21 出来后整体风格是否通过

## 11. Specific Next Steps
1–4. ✓（计划、脚手架、15 屏、渲染与自检）
5. 定调页一页一页：P01 ✓ 已推、等审 → P09（先建 `shoot/motion.py` 截 M02 帧做叠影；`pf.py` 补 `filmstrip / onion / curve_frames / slit_scan`）→ P21；每页自评记进 `portfolio/out/critique.md`
6. 定调后按页序做其余 19 页；动效页前先建 `portfolio/shoot/motion.py`（冻结时钟逐帧），截方案台 `/preview` 各组、`/playground`、`/spec`
7. 全部完成：合并 PDF + 22 页总览图，推给用户验收

---

## 附录：封面 AIGC 提示词（已发给用户）

屏幕必须纯 #00FF00（抠掉贴真屏），16:9，最高清；图里的文字一律不用。

（2026-10-11 用户：第一版「太硬核」→ 改成精品健身房 / 日常感，原版作废）

```
A: Photorealistic lifestyle shot, a relaxed hand holding a Google Pixel 8 smartphone (Obsidian black) in portrait orientation, screen facing the camera, resting on the knee of someone sitting on a padded bench between sets, wearing clean minimal athleisure. The screen is a perfectly flat, uniform pure #00FF00 green, no reflections, no glare, no UI, no text. Background: a calm, modern boutique gym at dusk, warm wood and soft fabric textures, a neat rack of light dumbbells softly out of focus, large window with fading evening light, warm dim interior with one subtle lime-yellow accent light. Soft, natural, premium mood, gentle film grain, shallow depth of field. 16:9 landscape; phone on the right third, large calm dark area on the left for typography. No logos, no text, no watermarks.
```

```
B: Photorealistic minimal still life, a Google Pixel 8 smartphone (Obsidian black) lying face-up at a slight 3/4 angle on a light oak bench, next to a folded towel, a reusable water bottle and one small rubber-coated dumbbell. The screen is a perfectly flat, uniform pure #00FF00 green, no reflections, no UI, no text. Calm modern gym interior in warm dark tones, soft window light grazing the scene from the upper right, a faint lime-yellow glow in the background bokeh, gentle film grain, shallow depth of field, editorial product-photo feel. 16:9 landscape; subject on the right half, empty dark negative space on the left for typography. No logos, no text, no watermarks.
```
