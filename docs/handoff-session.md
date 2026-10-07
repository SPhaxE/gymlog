# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-07 17:40_

## 1. Goal
阶段 6（App 本体与配套规范）已完成。下一阶段是**作品集**——用户 2026-10-07 定：「App 相较作品集被观看率低很多，不是十分必要的 App 工作可以省略」，作品集是另一个阶段的事，要等用户开口再开始。
「完成」的口径不变：线上 https://gymlog-taupe.vercel.app/demo 走得通、`npm run check` + `npm run gate` 全绿、/playground 与 /demo 路线同步。

## 2. Current State
- [x] 6a–6f 全部上线并过用户审查（6f 钱包与商城「视觉过关」）
- [x] 6g 会员：付费墙 `/pro`（按你的数据 + 看完整对比 + 一行方案分段 + 开通成功）、会员中心 `/me/pro`、「我的」会员行三态 + 数据里的演示开关；用户「通过」
- [x] 6g 补：钱包「Pro 体验 7 天」券（用过免费试用、现在免费时才出现）；/demo「容量页的知识卡」一步（腿练得多的演示用户 `demoLegState`）
- [x] 6g 补：Pro 标与冻结卡提示的落点（线框 `?board=proentry` 用户通过，Stitch `g6e` 按 Claude 倾向）：牛龄页连胜快断一行 `StreakRisk` + 「我的」成长卡提示 + 钱包 `?redeem=freeze`；容量页肌头面板「近 8 周」`HeadWeeks`；曲线页动作对比 `TrendChart compare`；`ProLink`；/demo「连胜快断」一步
- [x] 地址各司其职：`/playground` 只放组件、`/spec` 只放规则（Token 全量 + 第 6 章品牌 + 构建信息）、`/preview` 只放方案（加导航图标 I 组）；`/brand` `/check` `/lab` 转到新家，`/patterns` `/session` `/explore` 撤掉
- [x] /demo 右边手机跟着滚动停在屏幕里（`.page` 的 `overflow: hidden` 改 `clip`）
- [x] 6h 收掉：案例页 → 下一阶段；触点静态稿 → 作品集阶段需要时再做；演示场景切换 → /demo 各步骤已覆盖；真机体检 → 省略
- [ ] 作品集阶段：未开始（等用户）

## 3. Active Files
- `HANDOFF.md` — 总交接；§0 第一条是阶段 6 完成，§8 路线图 6g / 6h 行写了全部细节
- `docs/brief.md` — 决定记录表（末尾 2026-10-07 的十几条是这一窗口的）
- `design/wireframes/case.html` · `screenshots/wireframes/case/board.png` — 作品集案例页三种结构线框（W1 时间线 / W2 问题→解法 / W3 W2 + 跟着滚动的真手机，Claude 倾向 W3）；W1 要 V1 截图（仓库里没有）
- `src/components/pro.tsx` — 会员组件（PerkLedger、PlanPicker、PerkTable、ProCard + MonthStats、ProWelcome、ProLink）
- `src/pages/ProPage.tsx` · `ProHubPage.tsx` · `BrandSpec.tsx` · `Preview.tsx`（/spec）· `OptionsBoard.tsx`（/preview）
- `src/data/pro.ts`（会员有效期、按你的数据）· `src/data/me.ts` 的 `riskOf` · `src/data/demo.ts` 的 `headWeeks` · `src/data/gains.ts` 的 `compareCandidates` · `src/data/store.ts` 的 `demoLegState` / `demoRiskState` / `riskDemoNow`
- `scripts/shoot_6a.py` — 门禁类别：flow / story / deload / gains / log / me / shop / pro / demo

## 4. Changes Made（本窗口）
- 6g ②–⑤：Stitch g6（5 张）与 g6e（4 张）、对比板、会员三页与入口、组件进 playground「会员」组、DemoPage「会员 Milo Pro」「连胜快断」「容量页的知识卡」三步
- `src/pages/WalletPage.tsx`：Pro 体验券、`?redeem=freeze`
- `src/pages/LevelPage.tsx` / `MePage.tsx`：连胜快断
- `src/pages/BodyPage.tsx`：肌头面板「近 8 周」+ `?head=` 直接开面板；`src/pages/TrendPage.tsx`：动作对比
- `src/shell/AppShell.tsx`：路由合并；删 `src/lab/`、`TokenCheck`、`Patterns`、`scripts/shoot_lab.py`
- `design/wireframes/wf.js`：`?board=proentry`；`scripts/shoot_wireframes.py` 登记 proentry
- 文档：DESIGN §9.4 / §9.5、HANDOFF §0 / §3 / §8、brief 决定记录、CLAUDE.md 门禁类别

## 5. Decisions & Rationale
- 会员 / Pro 入口一律落在真内容上：标在哪，那项权益就在哪看得见；演示不拦截，Pro 标只表明「这是 Pro 的」
- 冻结卡提示不用危险红（不是错误）、不用荧光；有卡就不放按钮
- 动作对比的读数不放浮框（会盖住曲线），改成图下图例
- 不动主演示数据：处方、增量、结算、下单的演示数字和门禁都靠它；需要特殊状态就单独做一个演示用户（腿练得多、连胜快断），/demo 单独一步载入
- Pro 体验券只在用过免费试用后出现：付费墙本来就有免费试用，否则这张券没意义

## 6. Failed Attempts
- /demo 手机用 `position: sticky` + `translateY(-50%)` 居中 → 滚到页面底部被顶出屏幕 → sticky 按未平移的盒子算边界；改成按视口高度算的固定 top
- 门禁「容量 · 换卡」「增量 · 分组展开」偶尔在整套并行跑时失败 → 机器负载高时动画取样落点不准；单独重跑通过，与改动无关
- Stitch 密钥：这台云环境的「Network secrets」注入在 `stitch.withgoogle.com`，而接口在 `stitch.googleapis.com`，注入不生效；这次是用户在聊天里给了密钥，只存在会话的 scratchpad，不进仓库

## 7. Constraints
- 见 `CLAUDE.md`（必须遵守）：中文文案、无写死 px / ms / hex、命中区 ≥ 48、一屏一个主操作、不给死路、组件先进 /playground、/demo 路线同步、方案台旧方案不删
- 改完直接推 `main`（先 `git fetch origin main && git rebase origin/main`），不开 PR；跟用户只说改了什么、线上能看了
- 需要用户拍板的图用 `SendUserFile` 推
- 用户 2026-10-07：App 观看率低于作品集，不是十分必要的 App 工作省略

## 8. How to Verify
```bash
npm ci && npm run check                         # tsc · vitest 391 项 · 写死值 · 构建
(setsid npx vite --port 5199 --host 127.0.0.1 >/tmp/vite.log 2>&1 &)
python3 scripts/shoot_6a.py --no-shots          # 全套门禁（17 份 · 约 850 项检查）；失败只重跑 --failed
```
- 测试状态：本窗口最后一次 check 全绿；全套门禁全绿（「容量 · 换卡」负载高时偶发，单独重跑通过）

## 9. Environment State
- Branch: 工作分支 `claude/gallant-wright-26vgyy`，发布推 `main`（两者同步推）
- Uncommitted changes: 无（本文件随最后一次提交推上）
- Running services: vite 5199（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium 在 `/opt/pw-browsers/chromium`；Python 的 playwright 要 `pip install playwright`；环境变量里没有 `STITCH_API_KEY`（见 §6）

## 10. Open Questions
- 作品集阶段什么时候开始、从哪开始（案例页三种结构线框已画好，Claude 倾向 W3；W1 需要 V1 截图）

## 11. Specific Next Steps
1. 等用户开口开始作品集阶段；开始时先把 `screenshots/wireframes/case/board.png` 推给用户选结构
2. 如果选 W1 或要放 V1 对比：请用户提供 V1 截图（放进 `docs/sources/`）
3. 作品集阶段若需要通知 / 小组件 / 图标的静态稿，再按五步流程做（`docs/workflow.md` §A）
