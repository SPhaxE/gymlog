# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-09 17:40_

## 1. Goal
按**走查 1**（用户 2026-10-08 的 PDF 走查，29 条）把 App 改到位：同源问题归组统一改、写进规范（`docs/DESIGN.md`），按阶段执行、每阶段汇报。计划全文在 `docs/walkthrough-1.md`（§1 逐项、§2 A–J 归组、§3 新规则、§4 阶段、§6 进度 + 用户选定 + 落地记录）。
「完成」= 六个阶段都落地；每阶段 `npm run check` + 门禁全绿、推 `main`、线上 /demo 是新代码；`/playground`、`/demo` 路线同步；方案台旧方案不删。

## 2. Current State
- [x] 阶段 1：沉浸式全屏、不该滚的不滚、休息计时只留胶囊、删「演示」、找动作人体、故事曲线、排版、分段加载、描线顺序（线上 3fb8f0a）
- [x] 阶段 2：拍板材料（线框 p04v2 / logfold / addex；方案台 P / S / J / T 四组）（线上 106cb09）
- [x] 阶段 3：用户 2026-10-09 选的七件全部落地 + 新一轮方案（H 组、Stitch 视频页 v7）；规范、ia、brief、/demo、/playground 已同步（本文件随阶段 3 的提交推上）
- [x] 主角卡选 H4（固定颗粒 + 模糊 + 脉搏泵动）已落地；镁粉不加了，演示数据删掉（用户 2026-10-09）
- [ ] **等用户选**：视频页 Stitch V1–V3（`screenshots/hifi/v7/v7-board.png`）——阶段 5 搭之前再问
- [ ] 阶段 4 转场与动效：进行中
- [ ] 阶段 4 转场与动效、阶段 5 容量页 + 奖励弹窗 + 视频页搭建 + 主角卡按 H 选定落地、阶段 6 收尾、作品集（真实 iOS / 安卓样机）

## 3. Active Files
- `docs/walkthrough-1.md` — 计划与进度（§6 有每阶段落地记录，先读）
- `docs/DESIGN.md` — §1 荧光规矩第 6–7 条（面积 / 点缀两级）、§5 描边数字、§9.4 钢板 / 商品卡 / 增量行 / 记录行、§9.6 共 18 条
- `src/components/particles.tsx` — `ParticleField`（dust / flow / orbit + inward）、`GrainGlow`（grain / drift / dither）
- `src/components/plate.tsx` — 钢板：灯 portal 到 `main`、关灯渐变、手绘休息圈
- `src/pages/OptionsBoard.tsx` — 方案台 `#particles #grain #plate #gainlook #shoplook`
- `src/pages/LogPage.tsx` + `src/data/log.ts`（`byMonth`）— 记录页按月
- `src/components/gains.tsx`（`GainLook`）、`src/components/shop.tsx`（`ShopTagLook`、`Pic`）
- `design/hifi/build_stitch_v7.py`、`design/hifi/v7/` — Stitch 视频页
- `scripts/shoot_6a.py` — 门禁

## 4. Changes Made（阶段 3）
- 增量 J1：PR 荧光细线、曲线压灰末点荧光、上涨荧光；「下次」数字描边无填充；页头 P3 内收 + 模糊 0.7
- 钢板 S1：灯固定在屏幕层；滚出灯下按 smoothstep 目标 + `motion/slow` 渐变关灯，透光与光束同亮度；休息日手绘暗圈、可选
- 记录页 W2 按月收起（一段 6 个月）；加动作挪到主角卡下（首页、训练中）
- 商城 T2 斜丝带、热销荧光、只用实物图（暗底 → 淡入）
- 新增 `Tag tone="accent"`：记录行、训练详情动作卡、进步曲线记录行的重复 PR 标从骨白实心改荧光细线
- 修复 `src/data/me.ts` `riskOf()`：连胜 0 周不提示「这周快断了」（周五起没有历史的用户会误报；单测 7 天覆盖）
- 方案台 `#grain` H0–H3；Stitch v7 三版 + 对比板
- CLAUDE.md「换窗口交接」补三条可执行做法（用户 2026-10-09：绝不能被自动压缩）

## 5. Decisions & Rationale
- 用户 2026-10-09 七件拍板见 `docs/walkthrough-1.md` §6「用户选定」和 `docs/brief.md` 末尾
- 荧光分两级（面积每屏一处 / 点缀可多处但必须是「得到、变好」）——J1 选定后定成规则，并顺手扫了列表里重复的 PR 实心标
- 灯 portal 到不滚动的屏幕层而不是 `position: fixed`：Screen 外框有 `isolation` / transform 祖先，fixed 会跟着滚
- 视频页 Stitch 建议 V1（V2 有「STEP 02 / 04」编号、V3 有假技术英文，都违反用户要求 / DESIGN §8）
- 主角卡 H 组 Claude 倾向 H2 颗粒流光

## 6. Failed Attempts
- `pkill -f "<模式>"` 写在同一条命令里会把执行它的 bash 自己杀掉（exit 144）→ 用 `/proc/*/cmdline` 找 pid 再 `kill`
- `vite preview` 是在旧 `dist` 上起的话，重新构建后它不认新文件名 → 构建后要重启 preview
- `SendUserFile` 图片高过 8000px 被拒 → 存成单页 PDF
- 钢板灯第一版仍跟页面走（画在板的滚动层里）→ 改 portal
- 增量页头 P3 第一版太实、抢焦点 → 加模糊、降透明（用户）
- 本窗口**被自动压缩过一次**（用户很不满）→ 下个窗口按 CLAUDE.md 新三条做

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行；无写死 px / ms / hex；命中区 ≥ 48；`/playground` `/demo` 同步；方案台旧方案不删；五步流程；要拍板的图用 `SendUserFile` 推；改完直接推 `main`、只说改了什么
- 密钥不进仓库、不打印；Stitch 用 `STITCH_API_KEY` 环境变量（新窗口没有密钥，需要时问用户）
- 汇报材料：一张连续长图、左图右文；超 8000px 存单页 PDF
- 绝不让对话被自动压缩：每阶段收尾更新本文件；一个窗口做完一个阶段就主动交接

## 8. How to Verify
```bash
npm ci && npm run check                                   # tsc · vitest 397 项 · 写死值 · 构建
npx vite preview --port 4173 --host 127.0.0.1 &           # 构建之后再起
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173   # 全套门禁；失败只重跑 --failed
```
- 线上核对：`https://gymlog-taupe.vercel.app/demo` 的 `assets/index-*.js` 里 `0.1.0 · ` 后面的 7 位提交号
- 测试状态：阶段 3 收尾 `npm run check` 全绿（397 项）；全套门禁结果见本节末行
- 门禁：阶段 3 收尾全套 17 份全绿（首跑 11 份过；商城、记录按新设计改了断言——T2 丝带、S1 灯固定 + 关灯渐变 + 光束同暗、休息日可选无「查看」、按月收起后先展开一个月再测滚动还原；增量两份是已知的高负载动画取样偶发，`--failed` 重跑通过）

## 9. Environment State
- Branch: 工作分支 `ccr-da64a76c-su49t3`，发布推 `main`（两边同步推）
- Uncommitted changes: 无（本文件随阶段 3 提交推上）
- Running services: vite 5199（dev）、vite preview 4173（容器重启后要重开）
- Env vars / 依赖注意事项: Chromium `/opt/pw-browsers/chromium`；Stitch 密钥只在上个窗口的 scratchpad，**新窗口没有**

## 10. Open Questions
- 主角卡颗粒渐变选哪个：H0 现在 / H1 高清动态颗粒 / H2 颗粒流光（Claude 倾向）/ H3 点阵渐变
- 视频页 Stitch 选哪版：V1（Claude 倾向，收紧步骤行 + 加粗段落进度）/ V2 / V3，或混搭
- 液体镁粉的实物图（按 `design/brand/prompts/nanobanana-shop.md` 出）
- 下次跑 Stitch 的密钥：请用户把 `STITCH_API_KEY` 加进环境变量，或再给一次

## 11. Specific Next Steps
1. 先问用户第 10 节前两条（H、视频页），给出 `screenshots/walkthrough-1/stage3-report.pdf`
2. 选定后：主角卡把 H 选定的 `GrainGlow kind` 接到 `Card` 主角态（`src/components/ui.tsx` / A4 氛围），H0 留在方案台
3. 进阶段 4（转场与动效，见 `docs/walkthrough-1.md` §4 / §6「阶段重排」）：Tab 横滑、子页推入、面板 / 对话框 / Toast 退场、首页动作行 → 要领页 M03、商品卡 → 详情 M03、增量小曲线对位大曲线、出现式图标描线、牛龄页小牛点按
4. 阶段 5：容量页 #12（人体右移、长按才出折线引线、放大胶囊背后光晕、左右滑翻正背）、#29 胶囊 M02 流体形变、#23 奖励弹窗排版、视频页按 Stitch 选定搭建
5. 每阶段收尾：check + 门禁 → 更新本文件 → 推 main → 核对线上 → 汇报（左图右文 PDF）
