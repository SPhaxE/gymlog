# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-07 15:00_

## 1. Goal
慢牛 Milo（作品集用的健身 App，React 19 + TS + Vite + CSS Modules，Token 驱动）按路线图做完 6f 钱包与商城 → 6g 会员 → 6h 收尾。
每一块走 `docs/workflow.md` §A 的五步：① 五层分析 + 手指热区低保真线框 → ② Stitch 视觉参考 → ③ 高保真搭建 → ④ 用户视觉审查微调 → ⑤ 定稿植入；①②④ 要用户选或点头。
「完成」= 线上 https://gymlog-taupe.vercel.app/demo 能走通该块的全部流程，`npm run check` + `npm run gate` 全绿，/playground 与 /demo 路线同步。

## 2. Current State
- [x] 6e 首页补全全部完成并上线：动作要领 P04、找动作（点人体检索）、换一个、热身组、暂停与暂停后的首页、找动作入口图标；DemoPage 路线、DESIGN §9.4 / §9.6 第 14 条已同步
- [x] 容量人体三层视效定为 O2 柔光 + F1 金属渐变 + S9 熔流（`/preview` 方案台保留全部方案，作品集要展示过程）
- [x] 6f 第 ① 步：五层分析 + 热区线框（`design/wireframes/?board=wallet / shop / guide / item / order`，截图 `screenshots/wireframes/<页>/board.png`）
- [x] 用户说「继续」= 按我的倾向：钱包 W2（两个出口在拇指区）、商城 W1（为你推荐 + 两列商品）、知识卡 W2（数据证据在顶）、商品详情 W1 正常 + W2 缺货、下单 W1 + 完成 W2
- [x] 6f 第 ② 步 Stitch：用户说「按 UI/UX 设计方法论来分析决定」→ 取舍记在 `docs/brief.md` 2026-10-07（钱包 V1 + 刻度尺；商城 V2 排法 + V1 缺货变暗；知识卡 V1 + 结论句；详情 V1；缺货 V2；确认订单 V2 灰标；完成 V2 真小牛）
- [x] 到货提醒：本机记录 + 「我的 · 消息」来一条「演示：已到货」（用户选）
- [x] 6f 第 ③ 步：数据层 `data/wallet.ts` + `data/knowledge.ts`、组件 `components/shop.tsx`（进 playground「商城」组）、六页、我的「钱包 · 商城」行、DemoPage 三步、门禁 `--only shop`；已推 main
- [x] 知识卡提示：用户选 W1 + W3，已上线（`pages/TipBanner.tsx`）；增量页 `.body` 加了 min-height: 100%，分组都收起时部位筛选也能贴顶
- [ ] 6f 第 ④ 步：用户视觉审查（6f 已全部上线）
- [x] 6g 第 ① 步：线框 `?board=pro / prohub`，用户「按你的倾向」= 付费墙 W2（用你的数据讲权益）+ 成功 W3，会员中心 W1（记在 brief）
- [x] 6g 数据层：`src/data/pro.ts`（试用 / 月 / 年、切回免费不收回、`proFacts` / `proThisMonth`）、`store.pro`、引擎接多段会员期、各页牛劲按会员期算；`src/data/pro.test.ts`
- [ ] 6g 第 ② 步 Stitch：提示词 `design/hifi/build_stitch_g6.py`（5 张：pro-v1/v2、success-v2、hub-v1/v2），**被密钥卡住**——用户已在环境里加了 `STITCH_API_KEY`，新会话才生效
- [ ] 6g 会员（P20 / P21）、6h 收尾（作品集案例页等）未开始

## 3. Active Files
- `HANDOFF.md` — 项目总交接（§8 路线图，6f 行写了进度）
- `docs/workflow.md` — 工作流（本项目版 + 用户原始模板）
- `docs/ia.md` §1.15 / §1.16 / F6 — 钱包与商城规格、触发表、商品状态
- `src/data/growth.ts` — `KNOWLEDGE`（5 张知识卡）、`PRODUCTS`（5 款商品）、`COUPONS`、`niujinOff`（100 牛劲 = 1 元，单笔 ≤ 20%）
- `src/engine/growth.ts` — `WalletAction`（兑换扣牛劲、冻结卡加卡）、`GrowthInput.wallet`；`growth()` 出牛劲余额与流水
- `src/data/me.ts` `growthOf()` — 目前**没传 wallet**（6f 要接 store 里的钱包动作）
- `src/data/store.ts` — `AppState`（6f 要加 wallet 动作、orders、restock 提醒）
- `src/components/growth.tsx` — 已有 `NiujinBalance`、`LedgerRow`、`Coupon`、`ProductCard`（只有 normal / member / niujin / off 四态，6f 要扩：热销 / 折扣 / 新品 / 缺货 / 已下架）、`KnowledgeTip`、`Paywall`
- `src/pages/MePage.tsx` — 「钱包 · 商城」「会员」两行等页面有了再出现（不放死路）
- `design/wireframes/wf.js` — 线框引擎（热区标注、五层分析块、命中区验证）
- `design/hifi/build_stitch_f6.py`、`design/hifi/f6/` — 6f Stitch 提示词与结果

## 4. Changes Made（本窗口）
- 6e 全部：`src/data/finder.ts`、`session.ts`（热身 / 换一个 / 加动作 / 暂停）、`components/BodyPicker.tsx`、`finder.tsx`、`guide.tsx`、`training.tsx`（WarmupStrip、MediaFrame fill）、`pages/ExerciseGuidePage.tsx`、`FinderSheet.tsx`、`HomePage.tsx`、`TrainingView.tsx`、`BodyPage.tsx`、`TrendPage.tsx`、`shell/AppShell.tsx`（/exercise/:id）、`engine/prescribe.ts`（`rxItemFor`）、playground 6 个新条目、`public/icons/finder-*`
- 线框工具：手指热区（拇指可达区 + 命中区 ≥ 48 + 重叠 / 主按钮在难区标红；「难区」只查单个主按钮）、五层分析块、真实路径命中区验证（`hitCells`）
- 文档：`docs/workflow.md`、`CLAUDE.md`（五步流程、方案台、换窗口交接规则）、`DESIGN.md` §9.4 / §9.6、`brief.md` 决定记录、`ia.md` T19
- 6f：`design/wireframes/wf.js`（WALLET / SHOP / GUIDE / ITEM / ORDER）、`design/hifi/build_stitch_f6.py`

## 5. Decisions & Rationale
- 找动作按**整块肌肉**点、左栏细分到肌头：真实路径算过，逐个肌头点正背各 9 块命中区 < 48
- 动作要领视频占上半屏、1:1 居中裁，不全屏：素材是 480×270 实拍，铺满会糊、会裁掉杠铃
- 可撤销的走底部面板、不可撤销的走居中对话框（DESIGN §9.6 第 14 条）
- 6f 牛劲抵扣按**会员价**的 20% 封顶（腰带 ¥296 → 最多抵 ¥59、5,900 牛劲，实付 ¥207），各页统一
- 钱包 W2 的两个出口放底部拇指区（线框工具抓到原来在难区）

## 6. Failed Attempts
- Stitch 长请求偶尔被代理断开（ConnectionResetError）→ `run_round.py` 可断点续跑，重跑即可（已写成 4 次重试循环）
- 门禁 `[class*=_label_]` 会误中 Button 的类名 → 页头小链接不要用 `Button`，用页面自己的 class
- 无头 Chromium 没有 H.264：动作要领截图 / 录屏里示范显示「加载失败」，真浏览器正常

## 7. Constraints
- 见 `CLAUDE.md`（必须遵守）：中文文案、无写死 px/ms/hex（`npm run check:hardcoded`）、命中区 ≥ 48、一屏一个主操作在拇指区、无死路按钮、组件先进 /playground 再进页面、/demo 路线同步
- 改完直接推 `main`（先 `git fetch origin main && git rebase origin/main`，不要 merge commit），**不开 PR**；跟用户只说改了什么、线上能看了，不汇报 PR / CI / 命令
- 需要用户拍板的图用 `SendUserFile` 推；MP4 不用 GIF
- 商家品牌全部虚构；人体只用 MuscleWiki 素材；Stitch 密钥不进仓库、不打印
- 方案台的旧方案、落选方案不删

## 8. How to Verify
```bash
npm ci && npm run check                       # tsc · vitest 361 项 · 写死值 · Token · 构建
(setsid npx vite --port 5199 --host 127.0.0.1 >/tmp/vite.log 2>&1 &)
python3 scripts/shoot_6a.py --no-shots        # 演示全流程门禁（360 / 412）
python3 scripts/shoot_playground.py           # 组件目录
python3 -m http.server 8765 &                 # 线框：http://localhost:8765/design/wireframes/?board=wallet
python3 scripts/shoot_wireframes.py --base http://localhost:8765/design/wireframes/ --chromium /opt/pw-browsers/chromium --only wallet
```
- 测试状态：全部通过（本窗口最后一次 check + gate 全绿）

## 9. Environment State
- Branch: 工作分支 `claude/gallant-gauss-5ha5tr`，实际发布推 `main`（两者同步推）
- Uncommitted changes: 无（交接文件随最后一次提交推上）
- Running services: vite 5199、http.server 8765（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium 在 `/opt/pw-browsers/chromium`；Stitch 走 `design/hifi/tools/stitch.py`（读本机 MCP 配置）；ffmpeg 可用

## 10. Open Questions
- （无需先问）新会话第一件事：后台跑 `cd design/hifi && python3 tools/run_round.py g6 g6`（读环境变量 STITCH_API_KEY），出完做对比板（同 f6 的 `f6a-board.png` 做法）推给用户选；**用户说过不跳过 Stitch**
- 演示用户只触发腰带（增量页）；容量页的两类（恢复慢 → 蛋白质、深蹲量大 → 护膝）按真实阈值演示数据不触发。要不要给演示数据加一点腿部量让护膝也出现（会改动处方 / 增量页的演示数字）

## 11. Specific Next Steps
1. 跑 6g Stitch（见 §10），推对比板等用户选；同时可以先做不依赖视觉的：路由 `/pro`、`/me/pro`，「我的」会员行三态，「数据」里会员 / 非会员切换，会员价旁 Pro 小标。
2. 等用户第 ④ 步视觉审查 6f；回答「容量页提示要不要在演示里出现」后按需调演示数据
2. 数据层（`src/data/wallet.ts` 新建 + `store.ts`）：store 加 `wallet: WalletAction[]`、`orders`、`restock: string[]`；`growthOf()` 传 wallet；兑换卡券（扣牛劲、冻结卡 +1）、下单（扣牛劲 / 卡券、生成演示订单号）、到货提醒；演示场景走模块内存（同 `finder.ts` 的 `useExtras` 做法）；写单测
3. 知识卡触发函数（腰带 e1RM ≥ 1.5 × 体重、恢复慢、近 4 周训练量上升、深蹲量高；助力带不触发）+ 单测
4. 组件：扩 `ProductCard` 状态；新增钱包出口按钮 / 优惠券行等（先进 `src/playground/catalog.tsx`）
5. 页面：`/me/wallet`、`/shop`、`/shop/guide/:id`、`/shop/item/:id`、`/shop/checkout`、`/shop/order/:id`（订单完成替换历史回商城）；MePage 加「钱包 · 商城」行
6. DemoPage 路线、DESIGN §9.4、HANDOFF §8、`shoot_6a.py` 断言；`npm run check` + gate；推 main；截图 + 录屏给用户审查（第 ④ 步）
