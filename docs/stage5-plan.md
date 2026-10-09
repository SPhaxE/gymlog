# 走查 1 · 阶段 5 计划：容量页 + 奖励弹窗 + 视频页 + 收尾粒子材质

## Context
阶段 4（转场与动效）用户已认可、无需改；视频页 Stitch 用户让我按建议推进（V1 + 两处收紧）。阶段 5 要把走查 1 剩下的页面级改动一次做完：容量页 #12 #29、奖励弹窗 #23、视频页 #05（W3 关键帧分步，Stitch V1），以及 #10 #18 里还没换掉的配重片同心纹 / 荧光色块。另外用户纠正了交接规矩：**不是做完一轮就换窗口，而是逼近上下文极限时不压缩、写 handoff 再开新窗口**——CLAUDE.md 和交接文档要改成这个说法。

## 0. 先改规矩文字（1 个小提交，随阶段 5 一起推）
- `CLAUDE.md`「换窗口交接」第 ② 条改为：只在判断上下文逼近极限时停下，写 `docs/handoff-session.md` 推 `main` 再告诉用户换窗口；做完一个阶段不需要换窗口（用户 2026-10-09 纠正）。①（每次推 main 顺手更新交接）③（发现已被压缩先交接）保留。
- `docs/handoff-session.md` §7 同步这句。
- **Stitch 密钥（用户 2026-10-09：仓库私密，直接存显眼处，每次交接告知，以后不再问）**：存到仓库根 `secrets/stitch.env`（`STITCH_API_KEY=…`，旁边一个 `secrets/README.md` 写清用途、用户说做完会删）。**不能放 `design/` `mock/` `prototype/` `public/`**——这几处会被 `scripts/copy_static.mjs` 拷进 `dist/` 公开部署到 Vercel；根目录的 `secrets/` 不会。`design/hifi/tools/stitch.py` 的取密钥顺序加第三处：环境变量 → `~/.claude.json` → `secrets/stitch.env`。CLAUDE.md「密钥不进仓库」那条加上这个例外和位置；`docs/handoff-template.md` 与 `docs/handoff-session.md` §9 写明「Stitch 密钥在 `secrets/stitch.env`」。全程不在输出里打印密钥。

## 1. 容量页 #12（`src/pages/BodyPage.tsx`、`src/components/CapsuleRail.tsx` + css、`BodyFigure.tsx`）
- **人体右移到手刚碰到胶囊**：人体卡容器宽 = 胶囊列起点（`ratio/rail-start`），`display:flex; justify-content: safe flex-end` 让人体右缘（手）贴到胶囊列左缘；放不下时退回左对齐（左缘渐隐不被切）。`BodyFigure` 加一个 `width` 依赖让锚点在宽度变化时重量。
- **常态不画引线**：删掉常驻的 `svg.leaders` 全量线。只在放大镜**确认后**（过了 `motion/long-press`）再等 `motion/fast` 才给**焦点胶囊**画一条折线：胶囊左缘中点水平出 `space/l` → 斜折到肌头锚点（荧光线 + 锚点小圆），沿线描出（`motion/base`）；拖到别的胶囊时按新焦点立刻重描；松手后停留 `motion/base` 再淡出（`motion/fast`）。换卡途中照旧不画。
- **放大胶囊背后泛光**：`.focus` 的 box-shadow 加一层 `accent/glow` 大半径泛光（它就是这屏唯一的荧光焦点，守 §1 规则 5）。
- **人体区左右滑切正反**：stage 上接 pointerdown/up（只认起点在胶囊列左边的手势，`touch-action: pan-y`）；横向位移 ≥ `space/3xl` 且明显大于竖向 → 往左 = 背面、往右 = 正面，走现有 `swap({ view })` 换卡动画；滑过的这一下用 `onClickCapture` 拦掉，不误开肌头详情。

## 2. 容量页 #29：胶囊原地长成浮层（M02 流体胶囊形变）
- 新组件 `FluidPanel`（`src/components/motion.tsx` 或单独文件）：遮罩（点外面关）+ 浮在页面上的面板（左右贴页面边距，竖向贴着那颗胶囊的位置、夹在安全区里，放不下才面板内滚动），`role=dialog`、焦点圈定、返回键关闭、右上角「关闭」。复用 `useBackHandler` / `useFocusTrap`（`overlay.tsx`）、`SheetBlock` 内容块。
- 共享名新增部位 `fluid`（`sharedName` 加 `'fluid'`）：胶囊与面板同名、名字与标题同名；CSS：`*.fluid` 组按 `motion/spring-soft`（有一点过冲），image-pair 裁成 `radius/xl`（胶囊很矮时自然是胶囊形，长大后成圆角面板），旧快照快淡出、新快照随后淡入；遮罩自己带一个独立共享名，开时淡入、关时淡出。
- `BodyPage` 的 `HeadSheet` 改用 `FluidPanel`（内容不变：恢复 / 近 7 天容量 / 近 8 周 / 找练这块的动作），`openSheet`/`closeSheet` 的 `sharedTransition` 逻辑保留；`?head=` 直接打开时无转场。
- 规范：DESIGN §5 引线规则改「常态无、长按折线、出现 / 消失有延迟」；§7 / §9.7 M02 落点恢复为「容量页胶囊 ↔ 肌头详情浮层」，M03 表里删掉这一行；BodyPage 文件头五层分析同步。

## 3. 奖励弹窗 #23（`src/components/Reward.tsx` + css）
- 破纪录重排层级：标签「破纪录 · 预估 1RM」→ **大数字 kg + 涨幅胶囊同一行**（主角）→ 动作名（Heading，单独一行、`text-wrap: balance`，最多两行）→ 一句短话「慢慢变牛，就是这样。」（不再重复「比上次最好多了 X kg」，涨幅已在胶囊里）→ 牛劲 → 收下。
- 其他四种：标题 `balance`、正文 `pretty` + 最大行宽按字数限（避免孤字），说明句收短到一行半以内。
- /playground `RewardCard` 矩阵自动覆盖五种；出图放进汇报（用户第 ④ 步看）。

## 4. 视频页 #05：W3 关键帧分步，按 Stitch V1 搭（`src/pages/ExerciseGuidePage.tsx` + css，`src/components/guide.tsx`）
- 版式（V1）：顶栏（返回 + 动作名）→ 休息还在走一行（原逻辑）→ **16:9 完整示范卡**（内容宽、圆角、`object-fit: contain` 不裁头，署名右下，底边 2 号段落进度线）→ 一行「正面 | 侧面」+「点一步，看那一段」→ 一句话要点（前面荧光短竖 = 全屏唯一荧光）→ **四步**：每行左边 16:9 关键帧缩略图（同一段视频，`<video src="…#t=段中点" preload="auto">` 定格，不写编号）+ 右边正常文字说明，行高 ≥ 56、刻度细线分隔；当前一步缩略图骨白描边、文字主色加粗，缩略图下同步走一条细进度线 → 练到的肌头（原 BodyPicker + 列表）→ 我的进步（原卡）→ 从找动作来时拇指区「加到今天」。整页一个滚动区，不再用抽屉。
- 播放逻辑：每步 = 视频时长 ÷ 步数的一段；没点时整段循环、当前步跟着播放走；点一步 = 循环那一段（再点同一步取消）；进度线 rAF 更新，离开视野 / 减少动态效果时停在段首。
- 新组件 `GuideVideo`、`GuideSteps` 取代 `GuideDrawer`（删掉旧抽屉和它的 playground 条目 / finderDemos 用法，换成新条目）；M03 共享名仍挂在页面容器上。
- ia P04、DESIGN 组件目录、/demo「动作要领」一步的文案同步。

## 5. 剩下的同心纹 / 色块换材质（#10 #18 收尾）
- 新封装 `OrbitPlate`（`particles.tsx`）= `ParticleField kind="orbit" inward` + 统一的模糊 / 七成透明（从 `GainsPage` 的 `.plateFx` 挪过来），增量页头改用它。
- 替换：曲线页页头 `.plate`（#10 原话那一处）、牛龄页 `StageHero .rings`（光点在小牛背后正中）、「我的」成长卡 `.gcard::before`、会员卡 / 开通成功 `.grooves`、商城推荐卡 `.rec::before`。旧 CSS 留在方案台 P0 对照（已有）。
- 「今天已练完」卡的 `.doneGlow` 荧光色块 → `GrainGlow kind="pulse" calm`（和主角卡同材质）。

## 6. /playground、/demo、规范
- catalog：`CapsuleRail`（引线新规则）、新 `FluidPanel`、`GuideVideo` / `GuideSteps`、`OrbitPlate`、`RewardCard` 说明更新；`catalog.test` 覆盖新导出。
- /demo：容量、动作要领、牛龄三步文案。
- DESIGN：§5 引线、§7 转场表加 M02 行、§9.4 组件目录、§9.7 落点；`docs/walkthrough-1.md` §6 阶段 5 落地记录；`docs/brief.md` 一行决定记录。

## 验证
- 本机：`npm run check`（tsc · vitest · 写死值 · 构建）。
- 门禁改 / 加（`scripts/shoot_6a.py`）：
  - flow：人体右缘贴胶囊列左缘（替换「从内容区左缘起」那条）；常态没有引线，按住胶囊（鼠标按住 > long-press + fast）出现一条折线、松手后消失；横向拖人体区 → 背面；胶囊点开的转场名是 `x-fluid-*`、面板不是贴底的抽屉（底边离屏幕底有距离）、关闭后缩回不留共享名。
  - 新加动作要领检查：示范框宽高比 16:9 且在内容宽内、四步每行 ≥ 56、点第 3 步后它 `aria-current`、页面文字里没有「第几帧 / STEP」。
  - 跑完整 `npm run gate`（后台），失败只重跑 `--failed`。
- 录屏 + 左图右文汇报（`screenshots/walkthrough-1/stage5-*`），`SendUserFile` 推给用户看（第 ④ 步）。
- 推 `main` 和工作分支 → 核对线上 `/demo` 的 `assets/index-*.js` 带新提交号 → 同一提交更新 `docs/handoff-session.md`。
