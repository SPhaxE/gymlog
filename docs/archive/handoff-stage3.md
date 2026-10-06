# 慢牛 Milo · 阶段 3 交接报告

> 日期：2026-10-03 · 仓库 `SPhaxE/gymlog`（main，含本报告的提交即最新）· 工作流模板 v1.4（Project 文档 `claude/UIUX-AI工作流模板.md`）
> 交接对象：Claude Code，从**阶段 3 · 视觉方向**接着做。读完本报告就能开工，不需要翻对话记录。

## 1. 一页结论

- 阶段 1 ✅ 冻结（brief v1.1.1）。阶段 2 ✅ 门禁 7 条全部勾上：功能规格、站点地图、核心流程、`mock/` 数据、**可点击的低保真原型已部署到 Vercel**，F1–F4 自动走查通过。
- 原型里 5 条「规格外」规则已由用户确认收进 `ia.md`；MuscleWiki 素材在本项目内自由使用（项目暂不公开）；8 项视效不存 skill。
- 用户提出了一个新的签名交互「**导航胶囊环**」，已登记在 `docs/signature-nav.md`，**尚未进规格**，要在阶段 3 评审。
- 接下来要做的是阶段 3：选定视觉方向。**不要**在这一步写任何业务页面代码，也不要定具体数值（那是阶段 4 在 Figma 里做的事）。

## 2. 开工前先读（按顺序）

| 文件 | 为什么读 |
|---|---|
| `docs/brief.md` | 产品定位、品牌关键词、「视觉与交互定位」三条约束、决定记录 |
| `docs/references.md` | 8 项视效、页面映射、降级与预算——阶段 3 的现成输入 |
| `docs/signature-nav.md` | 用户新提的导航胶囊环，含待决事项和后续阶段待办 |
| `docs/ia.md` §1.10、§6 | P06（标杆页候选）的规格；每页第一优先信息与主操作 |
| `prototype/README.md` | 怎么打开原型、怎么切场景和状态 |
| Project 文档 `claude/UIUX-AI工作流模板.md` | 阶段 3 的步骤与过关标准（见 §4） |

## 3. 现状快照

### 3.1 仓库

```
docs/        brief.md  ia.md  references.md  signature-nav.md  asset-audit.md  handoff-stage3.md
mock/        exercises.json(154 个动作)  muscles.json  history.json(29 次训练/8 周)  profile.json  scenarios.json  README.md
prototype/   零构建静态原型（P01–P12、F1–F4、48 个页面状态、线框标注）
public/exercises/   MuscleWiki 示范视频 19 MB（正面/侧面 × 男/女）
scripts/     gen_mock.py（固定种子 89，勿手改 mock）  verify_prototype.js  walkthrough.py
screenshots/stage2/  F1–F4 走查截图 37 张
vercel.json  .vercelignore
```

### 3.2 线上与本地

- Vercel 项目：<https://vercel.com/sphaxes-projects/gymlog>（用户的账号）。部署域名为 `gymlog-fqmf37x8q-sphaxes-projects.vercel.app`（对应提交 345f3f4），根路径会跳到 `/prototype/`。
- **该部署开着 Vercel 的访问保护，需登录用户账号才能打开**，我（云端会话）打不开它，所以线上版没有被自动走查；内容与已通过本地走查的 345f3f4 相同。要给别人看，用户需在 Vercel 项目 Settings → Deployment Protection 里关掉 Vercel Authentication。
- 仓库已连 Vercel：**推送 main 会自动触发生产部署**。
- 本地：`python3 -m http.server 8765`，打开 `http://localhost:8765/prototype/`（要走 HTTP，不能双击 html）。
- 自检：`node scripts/verify_prototype.js`；`python3 scripts/walkthrough.py [--base <地址>/prototype/]`（需要 Playwright + Chromium）。

### 3.3 阶段 2 的完成证据

- P01–P12 逐页都有线框，打开原型控制面板的「标注」，橙色虚线框标出 ① 第一优先信息 / ② 主操作 / ③ 导航，与 `ia.md` §6 一致。
- F1–F4 真实点击走通：50 条断言通过、零运行期报错；另外 48 个页面状态逐个切换都能渲染。
- 线框的最终载体是原型，**Figma 里只有 P06 的三个状态和灰阶组件**，其余页面不再补画（用户 2026-10-03 决定「先不管 Figma」）。

## 4. 阶段 3 任务书

**目标**：做规范之前先选定风格方向，避免阶段 4 反复推翻。产出：`docs/references.md`（补全）+ 方向稿截图。

| 步 | 做什么 | 说明 |
|---|---|---|
| 1 | 收集参考：同品类 3 个 + 跨品类 2–3 个 | 同品类：brief 里已列 Strong / Hevy（记录型）、Fitbod（生成型）。跨品类建议往「器械感」靠：硬件控制面板、机械刻度与仪表、音频设备界面、可穿戴的恢复/数据环这类；具体看什么、借鉴什么，**由看过实物后写入**。brief 提醒：竞品的具体功能与定价是公开印象，核实前不写进作品集对外文案 |
| 2 | 每个参考标注「借鉴什么」 | 配色、信息密度、卡片样式、图标、动效…… |
| 3 | 标杆页 | 建议 **P06 容量与恢复**（用户最满意的设计，且是视觉主秀）。每个方向稿都要带上底部导航（见下文「导航胶囊环」） |
| 4 | 在同一套 P06 布局上做 2–3 个方向 | 用品牌关键词作输入：**笃定、透明、扎实、有张力、器械感**。方向稿只是参考图，不是规范 |
| 5 | 选定一个方向，记录选择理由 | 写进 `references.md` |

**每个方向稿至少画出**：P06 默认态（含放大镜按住中的一个胶囊放大）、松手后的详情面板、导航胶囊环的 3 种状态（没在训练 / 训练中有进度环 / 休息中进度环 + 小胶囊描边）。有余力再加 P01 顶部「今日处方」总述卡。

**候选方向（建议，非决定）**——从品牌关键词推出来的三条路，供评审时对照，也可以推翻重来：
- **刻度**：浅暖灰底、粗体等宽数字、细刻度线与游标，信息密度高、克制，偏「笃定、透明」。
- **配重片**：近黑底、一个高对比强调色、大圆角胶囊像配重片，发光只给核心模块，偏「有张力」。
- **铭牌**：拉丝金属与蚀刻字的质感转译成扁平界面，偏「扎实、器械感」。

**过关标准**（模板阶段 3）
- [ ] 能用一句话说清与同类竞品的视觉差异
- [ ] 选定方向的理由已记录
- 另（本项目约束）：每个入选视效都有「减少动画」降级；方向稿里没有拖慢 P0 路径（U1、U2）的东西。

**导航胶囊环的评审项**（详见 `docs/signature-nav.md` §4–5）：① 先和用户确认「大胶囊 / 小胶囊」的对应关系（我的理解：大胶囊 = 整条导航，描边显示今日训练进度；小胶囊 = 选中项滑块，描边显示组间休息倒计时，所以不论在哪个 Tab 都看得到休息；设置里可开关）；② 回答 P03 / P04 无 Tab 怎么办；③ 评审结论：收进 P1 还是不做；通过后回写 `ia.md` §1.6 / §1.11 / §6，并决定是否升 brief v1.2。

**Logo**：brief 说方向待阶段 3 定稿——几何化的牛角，或一条缓升的曲线；只用几何图形，不画人体，不画写实的牛。方向选定之后顺带出 Logo 草案。

## 5. 已冻结 / 已决定（不要再问用户）

| 事项 | 结论 |
|---|---|
| 产品 | 慢牛 Milo，slogan「慢慢变牛。」，功能说明句「下一组，该加多少，它告诉你。」；V1（`SPhaxE/GYMLOGrepo`）不动，只当提炼来源 |
| 平台 | Android APK（Capacitor），GitHub Actions 构建，真机验证 |
| 主线 | 自适应训练处方；目标用户：刚过新手期想进阶的爱好者，不分性别 |
| 范围 | brief v1.1.1 冻结；改动要在 brief 变更记录里记一条，并同步检查 `ia.md` |
| 素材 | MuscleWiki 示范素材直接使用；项目**暂不公开**，公开或对外发布前才复核条款 |
| 视效 | 8 项视效参考只在本项目使用，不存成 skill |
| 标志性交互 | P06 放大镜胶囊轨道保留，静止时必须看得到肌肉名称；「这次不减」提示 6 天内不再出现 |
| 放大镜细节 | 150 ms 长按进入；进入前移动 > 8 px 视为滚动；余弦衰减；轻点是替代；减少动画时只剩轻点；松手选中最近的肌头并开详情面板 |
| 语气 | 名字和 slogan 俏皮，只出现在品牌位置；功能界面文案中性克制 |
| 原型新增规则（已收进 ia） | 熟悉动作优先；7 天不重复按日历天；每肌头先排 1 个再补第 2 个；PR 门槛 0.05 kg；放大镜松手落点。阶段 5 写引擎测试时各要有用例 |
| 与食律的区别 | 食律是克制的工具型界面；慢牛是作品集里的视觉主秀，要更有个性、更有视觉辨识度 |

## 6. 工具与限制

- **Figma MCP**：用户是 Starter 计划，每月 20 次调用，**本月已用完**（只有 `create_new_file`、`whoami` 不计）。阶段 3 的方向稿不必在 Figma 里做——可以用 HTML 截图、Claude 出图或 Stitch。阶段 4 必须回 Figma（「Figma 是视觉规范唯一源头」），到时需要升级到 Professional 并给 Full / Dev 席位（200 次/天），或等下月额度重置。
- **Figma 文件**「慢牛 Milo Design System」：<https://www.figma.com/design/UmZoFoR8Vlem0J1TaVdBcr>。按用户要求整个设计系统放在**一页**里，用分区区分（对模板 §2.2 的有意偏离）。里面有灰阶线框组件、P06 默认态 `6:66`、详情面板 `9:66`、空态 `9:280`（后两个**未截图复核**）。
- **Stitch**：用户说「若低保真需要视觉参考，也可调用 stitch 给 Milo 开一个项目」。低保真已经完成，不需要；阶段 3 做方向稿时可以用。**云端会话里没有 Stitch 连接器**，要么用户自己在 Stitch 里开项目（附录 A 有可直接粘贴的提示词），要么在 Code 里确认有没有可用的连接。
- **沙盒浏览器**：无头 Chromium 没有 H.264 解码器，P04 的示范视频在自动截图里会落到「没加载出来」分支，真实 Chrome 正常。
- **沙盒网络**：打不开 `*.vercel.app`（代理 403），查部署地址用 `gh api repos/SPhaxE/gymlog/deployments`。

## 7. 开放问题与已知风险

| # | 问题 | 谁来定 / 何时 |
|---|---|---|
| 1 | 导航胶囊环的大小胶囊对应关系 | 用户，阶段 3 开始时 |
| 2 | 导航胶囊环收进 P1 还是不做；P03 / P04 无 Tab 怎么处理 | 阶段 3 评审 |
| 3 | 原型从没在真机上被人点过——放大镜手感（150 ms 长按、松手落点）只在桌面浏览器里验证过 | 用户拿手机打开线上版试，或阶段 6 真机 |
| 4 | Figma `9:66`、`9:280` 未截图复核 | 额度恢复后 |
| 5 | Logo 方向 | 阶段 3 定稿 |
| 6 | 竞品的功能与定价为公开印象，未逐一核实 | 阶段 3 收集参考时 |
| 7 | 原型引擎只是演示用的简化版，阶段 5 要用 TS 重写并补 ≥ 40 条测试（其中含上面 5 条规则） | 阶段 5 |

## 8. 工作约定（用户的偏好，沿用）

- GitHub、Vercel 同步（commit + push）直接做，不用每次问；提交信息结尾带 `Co-Authored-By: Claude …` 与会话行。
- 读写简单文件用直接文件访问，不要用 computer-use 去操作界面。
- 需要用户手动测试时，直接给**可复制的命令**。
- 作品集页面里对「AI 执行」只做最少提及（模板附录 G 的原则同理：只看产出，不分人与 AI 的角色）。
- 阶段门禁不过不进下一步；视觉规范冻结前不生成业务页面；一次只做一页。
- 沟通用中文，先给结论，再给细节。

## 附录 A · Stitch 提示词（P06 标杆页，可直接粘贴）

```text
Design a mobile app screen (Android, portrait 360×800) for a strength-training app called "Milo".
Screen: "Volume & Recovery". A front-view human body figure in clean line art on the left, with
muscle groups shown as hatched or shaded regions that darken with weekly volume. On the right, a
vertical rail of pill-shaped capsules, one per muscle head, each connected to its spot on the body
by a thin leader line. Each capsule shows the muscle name and "sets / target" with a thin volume bar.
One capsule near the user's finger is magnified like a dock icon, showing extra info: recovery
percentage and phase. Above the body: three summary numbers (total load, sets, training days).
Bottom: a floating pill-shaped navigation bar with three items (Today, Progress, Settings) and a
sliding selected pill; the outer pill's outline is a thin progress ring, the inner selected pill has
its own thin countdown outline.
Mood keywords: assured, transparent, solid, tense, equipment-like. Think machined metal, tick marks,
weight plates, pins and gauges translated into flat UI. Dense but legible; bold monospaced numerals.
Provide 3 distinct visual directions: (1) "scale" – light warm grey, hairline ticks, black numerals;
(2) "plate" – near-black, one high-contrast accent colour, big rounded capsules; (3) "nameplate" –
brushed-metal feel as flat UI, etched type. No illustrations of people or cows, no stock photography,
no brand logos.
```

## 附录 B · 阶段 3 → 4 之间不要忘的事

- 方向选定后，把导航胶囊环的评审结论回写 `ia.md`（§1.6、§1.11、§6），必要时升 brief v1.2。
- 进入阶段 4 前：Figma 额度或套餐问题要先解决；在 Figma 里补完 Foundations（含导航环的描边 token）、Components（含 `NavPill`）。
- 阶段 2 的低保真原型保留在 `prototype/`，当作行为参照；阶段 5 的真实实现不要复用它的引擎代码，只复用它的测试思路。
