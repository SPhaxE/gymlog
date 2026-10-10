# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 23:30_

## 1. Goal
**浅色模式保持高质量：荧光绿在每一页都是焦点点缀色，浅色不是深色的反色，按页面重新判断层级；深色（默认、App 对外口径）一像素不变。** 本轮已做完并推上 `main`。作品集**暂不考虑**（用户 2026-10-10）。

用户这一轮的原话（判断依据）：
1. 「浅色模式不是简单的深色反色，也要对页面做页面各种必要的分析再做决定。你自行决断即可」「你可以对页面做快速走查，保证浅色模式也保持高质量」「作品集暂不考虑」
2. 「要保证的是主题色荧光绿在各页面都是焦点点缀色，所以像动作曲线页那样的处理是错误的，排查所有问题」
3. 上一窗口遗留问题的回答：合 `main` = 现在合（已合）；导航滑块浅色 = **保留浅凹槽**；荧光雾 / 墨黑小块 = 「你来分析」→ 本轮已分析并决定（见 §5）。

## 2. Current State
- [x] 上一窗口浅色分支 `claude/gifted-gauss-sg2xds` 快进合进 `main`
- [x] 浅色走查：17 个页面深浅对照 + 浅色训练全流程截图逐张看过
- [x] **荧光焦点排查**：脚本逐元素比对深 / 浅，深色是荧光、浅色变黑的全部改回荧光（DESIGN §1.5 第 9 条）
- [x] 走查另改：浅色去荧光雾、建档选中卡、Pro 方案分段、增量「持平」段与收起组头（第 10 条）
- [x] 门禁 `light_checks` 新增「荧光焦点」比对（每个浅色页面先开深色收一遍荧光元素）
- [x] 文档：DESIGN §1.5 第 9、10 条，brief 决定记录，`/playground` 说明（Coupon、PlanPicker、PropGlyph、FluidBackdrop、Nav、OptionCard、RewardCard）
- [ ] 用户看浅色新效果（只告诉了改了什么、线上能看）
- [ ] 用户在小米 15 上复查浅色性能（卡片带阴影；浅色流体背景现在不跑循环了，应更省）
- [x] **UIUX-AI 协作工作流**：`docs/UIUX-AI协作工作流.md`（用户 2026-10-10：把 Milo 踩过的坑、优化思路整理进工作流，「这一部分与 App 是并重的」；「存为 UIUX-AI 协作工作流即可，不需要对比，也没有版本之分」）——一份独立完整的工作流，用户最初给的模板原文仍在 `docs/workflow.md` 附录；以后新坑 / 新优化都回写进它
- [x] **性能巡检（2026-10-10）**：4 倍降速逐页量首屏 / 长任务 / 静置帧率与 CPU。修了三处、视效不变：① 钢板（`plate.tsx`）光束静态化 + 浮尘单独一层按光束缩略图上色（记录页深色静置 25 → 59 帧）② 光束先叠加后整张模糊一次（打开记录页长任务 9.4 → 1.4 秒）③ 同心环粒子（`OrbitPlate`）外面有 CSS 模糊 → 1 倍分辨率画（增量页静置 30 → 48 帧、空闲长任务 640 → 0）；粒子跳过量化为全透明的光晕。主包 615 KB 里框架（react-dom、router）占大头，没拆。做法写进 `docs/UIUX-AI协作工作流.md` §5「性能与降级」
- [ ] 作品集（暂不考虑）

## 3. Active Files
- `src/styles/global.css`：浅色配方变量 `--depth-1 / --depth-0 / --depth-sink`（拟真阴影）+ **新 `--fluo-mark`（荧光笔）、`--fluo-edge`（荧光块立体边）、`--fluo-rim`（荧光线 / 点细黑边）**，只在 `[data-theme='light']` 定义
- 各 `*.module.css` 末尾「浅色荧光焦点」块：`gains`（涨幅荧光笔、持平段浅灰、组头白浮起）、`guide`（要领竖条）、`dataviz`（今天圈）、`shop`（新品角带、引导语）、`PropGlyph`（Pro 通行证、速度线、冰块；`.prop:not(.dim)` 限定）、`Nav`（今日进度环）、`growth`（进账、chip、牛龄头像环、票根、可用、Pro 标、方案）、`Reward`（标签、牛劲胶囊、小级、五段路径、当前段）、`charts`（`.tail` 罩层不画点）、`controls`（选中选项卡）、`pro`（方案分段、省 40%）
- `src/components/atmosphere.tsx`：`FluidBackdrop` 浅色直接 return（只留颗粒层），`BLOBS_LIGHT` 删了，旧值记在 brief
- `scripts/shoot_6a.py`：`LIME_SCAN` + `light_checks` 里的荧光焦点比对
- `scripts/regress_dark.py`：深色逐像素回归（用法见文件头和 §8）
- 文档：`docs/DESIGN.md` §1.5 第 9、10 条；`docs/brief.md` 决定记录最后一行

## 4. Changes Made
- `main` 上：上一窗口 8 个浅色提交（快进）+ 本轮一个提交「浅色荧光焦点 + 走查」
- 荧光焦点改回荧光的元素：增量列表涨幅、增量详情曲线选中点（被钻入罩层的黑菱形盖住）、导航今日进度环、动作页要领竖条、日历「今天」圈、钱包进账 / 票根 / 「可用」、Pro 标、商城「新品」角带与引导语、知识卡序号、连胜数、牛龄头像环、道具图标（Pro 通行证、速度线、冰块）、奖励弹窗（标签、牛劲、小级、五段路径、当前段）、Pro 方案「省 40%」
- 走查：浅色流体背景不画荧光雾；建档选中项白底 + 墨黑环（原来被阴影盖掉、只剩灰底）；Pro 方案分段 = 凹槽 + 白浮起（原来大黑块）；增量「持平」段浅灰；收起组头白浮起

## 5. Decisions & Rationale
- **荧光 = 焦点点缀色（两套主题都一样）**：浅色里荧光明度不比纸白高，之前的解法是「字和线用 `accent/ink` 墨黑」——用户否了：焦点被换成黑。现在深色是荧光的，浅色仍是荧光，看清靠三种配方：字 → 荧光笔（字墨黑、下半截荧光）；小块 → 荧光底墨字 + 下沿暗边；线 / 点 / 环 → 荧光 + 一圈细黑影。`accent/ink` 仍是墨黑，只给必须是线又不能是荧光的地方。
- **墨黑保留给**：深色骨白实心的对位（选中 / 确认 / 一次性强标）——未读「N 条新」、「对比中」、首页本次加重黑条、牛龄守约周格、力竭度选中、对话框主按钮、知识卡标。黑本来就是浅色三色之一；荧光 = 焦点 / 得到的东西，黑 = 选中 / 确认。
- **荧光雾去掉**：实测页边底色偏色量 3 → 12（黄橄榄），就是之前暖米色底让荧光发暗的老问题；还多铺一片荧光抢焦点。浅色也就不跑这块画布循环了。
- **导航滑块浅色保留浅凹槽**（用户选）。
- **没有上 /preview 方案台**：这一轮是改错（用户说现在的处理是错的、让我自行决断），不是待选方案；旧做法（墨黑字线、浅色荧光雾的旧值）记在 brief 决定记录。若要在方案台展示对比，需给每个模块的浅色规则加「旧」覆盖，成本高，没做。
- 曲线页罩层（`.tail`）：深色里罩层的点和主图同色无所谓；浅色里它的墨黑菱形盖住了荧光选中点 → 浅色隐藏罩层的点（主图里同一位置的点露出来）。

## 6. Failed Attempts / 踩过的坑
- **核对线上别比哈希**：构建时会把提交号打进包里（「我的 → 版本」），线上包的文件名哈希永远不等于本地构建的——核对方法是在线上的 `index-*.js` 里搜这次的短提交号（`curl -s <站点>/assets/index-*.js | grep -o <sha>`）。本轮一度误判「Vercel 没部署」就是比了哈希；实际 `d07ffd0` 推后约 4 分钟就上线了。CI 推的 apk 提交被 `ignoreCommand` 跳过是正常的。
- 审计脚本里 `border*Color` / `outlineColor` 跟 `currentColor`，会重复报；只看 `color / backgroundColor / fill / stroke / boxShadow / backgroundImage / filter`。荧光块里的字（墨黑）会被报成「丢了荧光」，要看往上几层有没有荧光底（门禁里查 4 层）。
- DOM 比对看不见遮挡：曲线选中点在 DOM 里是荧光，但被上面一层罩住——要配合截图看。
- 上一窗口的坑仍有效：`pkill -f` 会杀自己；`/playground` 浅色重绘很重（门禁等待 ≥ 30–60 秒）；回归噪声（休息倒计时弧、钢板光源、/playground 个别格）；`color-mix` 百分比不能 > 100；无头 Chromium 没有 H.264（动作页「示范加载失败」是这个原因）；新容器 `pip install playwright`。

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行；组件 / 页面里不写死 px、ms、十六进制颜色（`npm run check:hardcoded`）；命中区 ≥ 48；`/playground`、`/demo` 同步；方案台旧方案不删；要拍板的图用 `SendUserFile` 推；门禁放后台、做完再跑。
- **深色一像素不许变**：Token 只改 `light`，CSS 只写 `[data-theme='light'] …`，改完跑 `scripts/regress_dark.py`。
- 浅色：不写描边用 `var(--depth-*)`；不用深绿；主视觉只有白 / 荧光 / 黑；**深色是荧光的地方浅色也是荧光**（`var(--fluo-*)`），门禁会查。
- 绝不让对话被自动压缩：每个阶段收尾推送时顺手更新本文件。

## 8. How to Verify
```bash
npm ci && npm run check                                   # tsc + 400 单测 + 写死值 + 构建（含两套主题对比度）
npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173                 # 全套门禁（后台跑）
python3 scripts/shoot_6a.py --no-shots --only light --base http://127.0.0.1:4173    # 只跑浅色（含荧光焦点比对）
# 深色回归：基线 = 改动前提交的构建（git worktree 出旧提交、软链 node_modules、build）
npx vite preview --outDir <base_dist> --port 4174 --host 127.0.0.1 &  ;  npx vite preview --outDir <cand_dist> --port 4175 --host 127.0.0.1 &
ROUTES_ONLY=1 python3 scripts/regress_dark.py shoot http://127.0.0.1:4174 /tmp/r_base
ROUTES_ONLY=1 python3 scripts/regress_dark.py shoot http://127.0.0.1:4175 /tmp/r_cand
python3 scripts/regress_dark.py compare /tmp/r_base /tmp/r_cand        # 页面必须全部一致
```
- 测试状态：`check` 全绿（400 项）；门禁全套 19 / 19（含新增浅色荧光焦点比对）；深色逐像素 23 个页面全部一致（17 个常规 + 钱包、增量详情、动作页、会员中心、商品、知识卡）。
- 浅色看法：任何页面加 `?theme=light`；`/playground` 右上角切全局主题。
- 荧光审计思路（这一轮在 scratchpad 写的，丢了照这个写）：Playwright 同一地址 `&theme=dark` / `&theme=light` 各开一次，`#root *` 逐元素收 computedStyle（color、backgroundColor、fill、stroke、boxShadow、backgroundImage、filter），按 DOM 路径配对，HSL 色相 61–94°、饱和 > 0.6、亮度 > 0.45 算荧光；训练流程也深浅各走一遍逐步比对。门禁里的 `LIME_SCAN` 就是它的精简版。

## 9. Environment State
- **Stitch 密钥：在仓库根 `secrets/stitch.env`（已被 `.gitignore`，不进提交；用户 2026-10-10 又给了一次，这个容器里已写好并验证 `stitch.py list` 可用）。每次交接告知，以后不再向用户要。**
- Branch：工作分支 `claude/friendly-gauss-m528ns`，内容同 `main`（推 `main` 时同步推它）
- Uncommitted changes：无
- Running services：可能还有 `vite preview` 在 4173 / 4174 / 4175（新容器没有）
- Env：Chromium `/opt/pw-browsers/chromium`；Python Playwright 先 `pip install playwright`；Pillow、numpy 在；GitHub 只能用 `mcp__github__*`

## 10. Open Questions
- 协作工作流有没有要补的
- 浅色新效果用户还没看（荧光焦点 + 走查）；有意见再按 §7 的规矩改
- 作品集：用户说暂不考虑（`docs/portfolio-handoff.md` §8 的问题等用户重提再问）

## 11. Specific Next Steps
1. 等用户对浅色的反馈；改动只写 `light` Token / `[data-theme='light']` 规则，深色是荧光的浅色也要荧光（`--fluo-*`）。
2. 改完：`npm run check` → `regress_dark.py` 深色回归 → 最后一次性跑门禁全套（含浅色荧光焦点比对）。
3. 推 `main` 前先 `git merge --ff-only origin/main`，推完在线上 `index-*.js` 里搜这次的短提交号确认已部署；只告诉用户「改了什么、线上能看了」。
