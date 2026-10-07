# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-07 20:40_

## 1. Goal
App 本体与配套规范已打磨完毕（阶段 6 完成，含 6h 触点静态稿）。**现在是用户人工走查最新 demo**；走查有反馈就按反馈改，走查完再拿最新 APK 上真机走查。作品集是下一阶段，等用户开口。
「完成」的口径：线上 https://gymlog-taupe.vercel.app/demo 走得通、`npm run check` + `npm run gate` 全绿、`/playground` 与 `/demo` 路线同步。
用户原则（2026-10-07）：App 被看到的机会远少于作品集，**不是十分必要的 App 工作可以省略**；往作品集里搬东西时要什么数据或页面直接截图。

## 2. Current State
- [x] 6a–6g 全部上线，用户审查通过（6f「视觉过关」、6g「通过」）
- [x] 6g 补：钱包「Pro 体验 7 天」券；Pro 标与冻结卡提示的落点（牛龄页连胜快断 `StreakRisk`、容量页肌头面板「近 8 周」`HeadWeeks`、曲线页动作对比 `TrendChart compare`、`ProLink`）；/demo「连胜快断」「容量页的知识卡」两步
- [x] 地址各司其职：`/playground` 只放组件、`/spec` 只放规则（Token 全量 + 第 6 章品牌 + 第 7 章触点 + 构建信息）、`/preview` 只放方案；`/brand` `/check` `/lab` 转到新家，`/patterns` `/session` `/explore` 撤掉
- [x] /demo 右边手机跟着滚动停在屏幕里（`.page` 的 `overflow: hidden` 改 `clip`）
- [x] 6h 触点静态稿：`/spec` 第 7 章「触点」（`src/pages/TouchSpec.tsx`）——通知 4 种 + 锁屏只露标题、桌面小组件 5 张、图标三种遮罩 / 主题单色 / 深浅壁纸；线框 `?board=touch`、Stitch `t6` 对比板，按 Claude 倾向（通知 V1 + 小组件 V2 + 图标 V2）；**用户还没做第 ④ 步视觉审查**
- [x] 6h 其余：案例页 → 作品集阶段；演示场景切换 → 不做；真机体检 → 用户走查完再打 APK
- [x] 装了第三方 ponytail 技能（只装 6 个 SKILL.md，没装钩子）
- [x] Vercel 改成只构建 `main`（工作分支的同步推送不再多一次预览部署）
- [ ] 用户人工走查最新 demo（进行中，等反馈）
- [ ] 触点静态稿第 ④ 步：用户视觉审查
- [ ] 走查完：拿最新 `apk/milo-debug.apk` 给用户真机走查
- [ ] 作品集阶段：未开始（等用户）

## 3. Active Files
- `HANDOFF.md` — 总交接；§0 第一条 = 阶段 6 完成；§8 路线图 6g / 6h 行写了全部细节；§4 Vercel 规则
- `docs/brief.md` — 决定记录表，末尾 2026-10-07 的二十来条是这一窗口的
- `src/pages/TouchSpec.tsx` + `.module.css` — /spec 第 7 章触点（系统界面用手机框画，Logo 状态 / App 图标 / 小牛是真组件）
- `src/pages/Preview.tsx`（/spec）· `BrandSpec.tsx`（第 6 章）· `OptionsBoard.tsx`（/preview）
- `src/components/pro.tsx`（会员组件 + `ProLink`）· `growth.tsx` 的 `StreakRisk` · `dataviz.tsx` 的 `HeadWeeks` · `charts.tsx` 的 `TrendChart compare`
- `src/data/pro.ts` · `me.ts` 的 `riskOf` · `demo.ts` 的 `headWeeks` · `gains.ts` 的 `compareCandidates` · `store.ts` 的 `demoLegState` / `demoRiskState` / `riskDemoNow`
- `design/wireframes/wf.js`（`?board=touch / proentry`）· `design/wireframes/case.html`（作品集案例页三种结构，留给下一阶段）
- `design/hifi/build_stitch_t6.py` · `screenshots/hifi/touch/t6-board.png`
- `vercel.json` — `ignoreCommand`：非 main 分支、只改 `apk/` 的提交都跳过
- `scripts/shoot_6a.py` — 门禁类别 flow / story / deload / gains / log / me / shop / pro / demo

## 4. Changes Made（本窗口，按时间）
- 6g ②–⑤ 会员三页 + 入口 + Pro 体验券 + 腿练得多的演示用户
- 6g 补：冻结卡提示、高级分析两件、`ProLink`；/demo 两步；门禁 pro / demo 断言
- 路由合并：删 `src/lab/`、`TokenCheck`、`Patterns`、`scripts/shoot_lab.py`；`/brand` 内容并成 `BrandSpec`；`/spec` 列全量 Token + 构建信息；/preview 加导航图标 I 组
- /demo 手机 sticky；门禁里点手机前先滚到视野
- 全局回顾小修：HANDOFF 过时内容、旧版 `Paywall` 标为过程对照、删掉没用到的 zustand
- 装 ponytail（`.claude/skills/ponytail*`、`README-ponytail.md`、`PONYTAIL-LICENSE`；CLAUDE.md 一条）
- 6h 触点静态稿 ①②③（线框、Stitch、/spec 第 7 章）
- `vercel.json` 只构建 main

## 5. Decisions & Rationale
- 入口落在真内容上：Pro 标挂在真能看到的权益旁（演示不拦截，Pro 标只表明「这是 Pro 的」）
- 不动主演示数据：处方 / 增量 / 结算 / 下单的演示数字和门禁都靠它；特殊状态单独做演示用户（腿练得多、连胜快断），/demo 单独一步载入
- 冻结卡提示不用危险红、不用荧光；有卡不放按钮
- 动作对比读数放图下图例，不放浮框（会盖住曲线）
- 触点静态稿放 `/spec` 第 7 章、真组件实时渲染；启动页与图标尺寸阶梯第 6 章已有，第 7 章不重复；不做每日打卡式通知（「我们不奖励打开 App」），锁屏不露训练数字
- ponytail 只装技能不装钩子（钩子每轮跑第三方脚本、要改项目设置）；与项目规则冲突以项目为准

## 6. Failed Attempts
- /demo 手机用 `sticky` + `translateY(-50%)` 居中 → 滚到底被顶出屏幕 → sticky 按未平移的盒子算；改按视口高度算的固定 top
- Vercel 两次提交（`8dc25e2`、`a09ac88`）一直没部署 → 推测撞了 Vercel 免费版每天部署上限（今天 main 推了约 80 个提交，工作分支同步推送再各多一次预览部署）；改 `ignoreCommand` 只构建 main 后，下一次推送部署成功（`0113d57`）。未能进 Vercel 后台确认真因
- 门禁「容量 · 换卡」「增量 · 分组展开」整套并行跑时偶发失败 → 机器负载高时动画取样落点不准；单独 `--failed` 重跑通过，与改动无关
- Stitch 密钥：云环境 Network secrets 注入在 `stitch.withgoogle.com`，接口在 `stitch.googleapis.com`，注入不生效；这次用的是用户在聊天里给的密钥，只存在当时会话的 scratchpad，**不在仓库、新窗口没有**

## 7. Constraints
- 见 `CLAUDE.md`（必须遵守）：中文、结论先行；无写死 px / ms / hex；命中区 ≥ 48；一屏一个主操作；不给死路；组件先进 /playground；/demo 路线同步；方案台旧方案不删；五步流程（①②④ 要用户点头）
- 改完直接推 `main`（先 `git fetch origin main && git rebase origin/main`），不开 PR；跟用户只说改了什么、线上能看了
- 要用户拍板的图用 `SendUserFile` 推
- 用户 2026-10-07：不是十分必要的 App 工作省略；不要动不动跑费事的全套检查（日常用 `test:changed`、`--only`）

## 8. How to Verify
```bash
npm ci && npm run check                         # tsc · vitest 391 项 · 写死值 · 构建
(setsid npx vite --port 5199 --host 127.0.0.1 >/tmp/vite.log 2>&1 &)
python3 scripts/shoot_6a.py --no-shots          # 全套门禁（17 份 · 约 850 项）；失败只重跑 --failed
pip install playwright                          # Python 截图脚本要它（容器重启后要重装）
```
- 线上核对：取 `https://gymlog-taupe.vercel.app/demo` 的 `assets/index-*.js`，搜 `0.1.0 · ` 后面的 7 位提交号；/spec 的内容在 `assets/Preview-*.js`（懒加载）
- 测试状态：最后一次完整 `npm run check` 全绿；触点那次只跑了 tsc、写死值、App.test 和构建（都过）；全套门禁上一次全绿（触点只动了 /spec，没加门禁断言）

## 9. Environment State
- Branch: 工作分支 `claude/gallant-wright-26vgyy`，发布推 `main`（两者同步推；Vercel 现在只构建 main）
- Uncommitted changes: 无（本文件随最后一次提交推上）
- Running services: vite 5199（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium `/opt/pw-browsers/chromium`；环境变量里没有 `STITCH_API_KEY`（见 §6）；线上最新 `0113d57`

## 10. Open Questions
- 用户走查 demo 的反馈（等用户说）
- 触点静态稿（/spec#touch）第 ④ 步视觉审查是否通过
- 作品集阶段什么时候开始（案例页三种结构线框 `design/wireframes/case.html` 已画好，Claude 倾向 W3；W1 需要 V1 截图，仓库里没有）
- 下次要用 Stitch 时的密钥：请用户把 Network secret 的域名改成 `stitch.googleapis.com`，或加环境变量 `STITCH_API_KEY`

## 11. Specific Next Steps
1. 先问用户：demo 走查有没有反馈、触点静态稿看过没有
2. 有反馈 → 按反馈改，改完推 main、核对线上（只跑相关测试和 `--only` 门禁，提交前再完整 check）
3. 走查完 → 确认 `apk/milo-debug.apk` 是最新提交打的（CI 在每次推 main 后自动提交「apk: debug 构建（源提交 xxx）」），推给用户真机走查
4. 真机走查的反馈照上面第 2 条处理
5. 用户开口开始作品集阶段时：先推 `screenshots/wireframes/case/board.png` 让用户选结构
