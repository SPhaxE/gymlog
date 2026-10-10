# Handoff

> 新窗口请先完整读完本文件，再开始工作。遇到 Open Questions 里的问题先问我，不要自行决定。

_Updated: 2026-10-10 18:00_

## 1. Goal
**浅色模式做到「白 + 荧光 + 黑」、不脏、不发暗，并且深色模式（默认、App 对外口径）一像素不变。** 这一轮的工作已经全部做完并推到分支，等用户验收浅色；验收通过、没有新意见之后，进入**作品集**（先读 `docs/portfolio-handoff.md`，§8 的问题先问用户）。

用户的浅色诉求按时间顺序（都已实现，原话是判断依据）：
1. 全局浅色，不要深色岛（容量人体、钢板、奖励、故事、/demo 都跟主题走）；
2. 浅色人体：配色用 L2、效果再出 4 个变体 → **选定 L2d 磨砂 + C3 磨砂白线**；描边 / 胶囊边 / 引线 / 刻度不要深色；
3. 荧光不是页面最亮的元素、特效垫灰发黑、点缀（端点 / PR / 进度条）同一个问题 → 荧光治理四期（`docs/light-fluo-plan.md`）；
4. **拟真阴影，尽量不用描边**（深色里原有的描边不动）；
5. 荧光还发暗 → **浅色去墨绿，主视觉只有白、荧光绿、黑**；中性灰白底；特效只用纯荧光；
6. /preview、/playground 最前面加全局深浅开关；
7. 首次引导动画（故事）固定深色（App 默认深色），浅色水墨封存；
8. 用户原话：「深色模式是默认且更推荐（app 对外口径）」「原本没计划浅色，可能冲突，可以随时回改」「深色模式的页面已经是完全固定的」。

## 2. Current State
- [x] 全局浅色（无深色岛）、L2d + C3、故事固定深色、荧光治理四期、拟真阴影、去墨绿 / 纯荧光、ThemeBar
- [x] `npm run check` 全绿（400 项）；`shoot_6a.py` 全套 19 / 19 份通过（含新增的荧光治理检查）；深色 17 个页面（today / body / gains / log / me / me/level / shop / pro / 故事 8 幕）与治理前逐像素一致
- [x] 文档同步：DESIGN §1.5「荧光治理」第 1–8 条、brief 决定记录、`/playground` 说明、`docs/light-fluo-plan.md`
- [ ] **用户验收浅色**（首页 / 容量 / 增量 / 记录 / 我的 / 商城）——看了最后一轮截图还没回复
- [ ] **这一轮的全部提交只在分支 `claude/gifted-gauss-sg2xds` 上，没推 `main`**（本轮的任务设定要求只推这个分支；CLAUDE.md 的常规做法是推 main，Vercel 才会部署）。要不要合 main：问用户
- [ ] 用户在小米 15 上复查浅色性能（卡片现在都带阴影）
- [ ] Stitch 密钥：**这个容器里没有 `secrets/stitch.env`**（约定：Stitch 密钥在仓库根 `secrets/stitch.env`，用户 2026-10-09 说每次交接都告知、不再向用户要；用户 2026-10-10 说先不管）
- [ ] 作品集

## 3. Active Files
- `design/tokens/tokens.json`（改完跑 `python3 scripts/build_tokens.py`，它校验两套主题对比度，生成 `tokens.css` / `tokens.gen.ts` / Figma 插件）：
  - 浅色值：`bg/base` paper-100、`bg/raised-2` paper-150、`accent/default` lime-500、`accent/glow` lime-500-a33、`accent/glow-ring` lime-500-a13、**`accent/ink` ink-900（墨黑）**、`text/on-accent-secondary` ink-600、`brand/mark-lit` lime-500、`nav/progress` ink-900、`fx/spark-0..2`、`fx/glow-mid|hot`、`data/spark-line` ink-900、`plate/steel-top|bottom|hole`、`feedback/danger` red-700
  - 新语义色 **`accent/rim`**（深色 = 荧光、浅色 ink-900；只在 `[data-theme='light']` 规则里用，取 25–70% 透明做「带灰黑的阴影」）；新原色 `paper-150`、`red-700`
  - 原色 `paper-*` / `ink-500|600|900` 改成**中性灰白**（`paper-50` 纯白 `#FFFFFF`、`paper-100` `#E9EAE7`……）；深色不引用这些原色
- `src/styles/global.css`：浅色阴影变量 **`--depth-1`**（卡片 / Chip / 胶囊：接触影 + 环境影）、**`--depth-0`**（小标）、**`--depth-sink`**（凹槽 / 输入框 / 导航滑块，内阴影）
- 各 `*.module.css` 末尾的「浅色：发丝描边 → 拟真阴影」块（`[data-theme='light'] .xxx { box-shadow: var(--depth-*) }`）：把深色里 `inset 0 0 0 hairline line-default|line-strong` 的卡片、Chip、胶囊、标签、档案格、记录卡、圆按钮等换成阴影；荧光面（`Button .primary`、`CapsuleRail .focus`、`gains .headLit`）= 下沿 2px 厚度 + 带灰黑的投影 + 光晕；点缀配方块（`charts` `gains` `growth` `ui`）= 荧光芯 + 小阴影；选中态块（`Segmented` `controls` `Nav` `gains`）
- `src/components/BodyFigure.tsx`：`LIGHT_LOOKS`（L1–L4 落选、L2a–c 落选、**L2d 默认**）、`LIGHT_CONTOURS`（C0 墨 / C1 绿 / C2 灰绿 / **C3 frost 默认** / C4 柔影 / C5 无）、`TONES`（胶囊 / 引线 / 刻度，浅色引线黑、刻度灰、胶囊无描边靠 `--depth-1`）、`lightToneVars`、`DEFAULT_LIGHT_LOOK`
- `src/components/atmosphere.tsx`：`BLOBS_LIGHT`（流体背景浅色光斑，只有荧光）
- `src/components/ThemeBar.tsx(+.module.css)`：/preview、/playground 右上角固定的全局深浅开关（`setThemePref`，会记住）
- `src/pages/OptionsBoard.tsx`：方案台，新增 L2 变体（`#light-v`）、描边 C（`#light-contour`）、底色 B（`#light-base`）、选中态 S（`#light-sel`）；B / S 的格子用覆盖值还原旧状态（`[data-fluo='off']`、`[data-sel='old']`）
- `src/pages/StoryScreens.tsx`：`<Screen theme="dark">`；浅色水墨 CSS 选择器改成 `[data-story-ink]`（封存，没有元素带它）
- `scripts/shoot_6a.py` 的 `light_checks`：页面底亮度 0.7–0.85、荧光主按钮不描边且 ≥ 3 层阴影、涨段 / Chip / Segmented 不是墨黑块、PR 角标荧光底、曲线端点芯 + 阴影、/preview /playground 的 ThemeBar（桌面视口，给 60 秒重绘）、故事 8 幕「整屏唯一深色岛」
- **`scripts/regress_dark.py`**（本轮新收进仓库）：深色逐像素回归，用法见文件头和 §8
- 文档：`docs/DESIGN.md` §1.5、`docs/light-fluo-plan.md`（分析 + 四期方案，含追加说明）、`docs/brief.md`、`docs/portfolio-handoff.md`

## 4. Changes Made
按提交（都在 `claude/gifted-gauss-sg2xds`）：
- `eb473de` L2 配色选定；L2a–d 四个变体 + 6 种描边 + 胶囊 / 引线 / 刻度调子；故事固定深色
- `a7656fe` 选定 L2d + C3 为默认
- `f4415ff` 荧光治理方案文档
- `a59ff68` 方案台底色 B 组
- `ef9a927` 荧光治理四期 + 拟真阴影
- `7544cb1` 门禁修正
- `b4bdaed` 去墨绿 / 纯荧光、line-strong 描边换阴影、ThemeBar
- 本提交：`scripts/regress_dark.py` + 本文件

## 5. Decisions & Rationale
- **根因分析（数据）**：浅色里荧光明度 lime-500 0.858 / lime-550 0.762，低于卡片 0.965、和页面底 0.871 相当（对比度 1.0–1.25）→「荧光是最亮元素」在浅色塌了；点缀被换成近黑深绿 → 读成「深色点」；特效垫灰 / 暖米色底把荧光黄绿拉成橄榄 → 读成「暗」。治法：页面底降一档让卡片浮起、荧光面加真实阴影、点缀用荧光芯、特效去灰、纸色改中性灰白、深绿全部换黑。
- **浅色里「亮」不靠明度，靠「荧光芯 + 阴影 + 光晕」**；荧光字和线用 `accent/ink`（现在是墨黑），荧光只做面 / 点 / 光晕。
- **「荧光面积每屏一处」仍成立**：选中态用淡荧光（点缀级），没有做成荧光面（方案 S2 违反规则，没做）。
- **阴影代替描边只在浅色**：深色里发丝描边是它的立体手段，一条没动；所有新规则都写在 `[data-theme='light']` 下，Token 只改 `light` 值。保留的描边：虚线占位（「加一个动作」「首次」）、选中 / 聚焦环（功能性）、复选框 / 单选 / 状态点。
- **导航选中滑块浅色也换成浅凹槽**——对「导航滑块 = App 签名」的一次让步，**用户可否决**（见 Open Questions）。
- **故事引导固定深色**：用户判断 App 默认深色、首次引导永远先是深色，浅色动画没人看到——先砍没人会看到的工作。
- L2d 柔光描边层的混合模式是 screen（白线），门禁因此不再要求 multiply，只要求熔流 multiply。
- 没有出 Stitch 参考：容器里没有密钥，用户也说先不管；直接在方案台用真实组件对比。

## 6. Failed Attempts / 踩过的坑
- `pkill -f "<串>"` 会把自己的 shell 杀掉（命令行里含同一串）→ 用 `kill $(pgrep -f '^python3 xxx')`，或按 PID 杀。
- `npm run check` 里 `App.test.tsx` 的「规范页」偶发失败：和回归脚本抢 CPU 导致懒加载超时，单独重跑通过。
- `/playground` 切浅色整页重绘很重（几百格，要几秒甚至十几秒）；门禁里的等待要给足（≥ 30–60 秒），原来的 8 秒在这个容器里本来就超。
- 回归噪声：休息倒计时弧、钢板固定光源（位置相关）、/playground 个别格 1–80 个像素的动画 / 懒加载抖动（每次跑的集合不同）、说明文字变长导致后面各节整体下移（高度变化，不是视觉变化）。**页面必须 0 差异**。
- `box-shadow: ... color-mix(... 140% ...)` 无效（百分比不能 > 100）。
- 暖米色（paper 旧值）作浅色底会让荧光发暗；L2 变体里 L2c 的柔影叠在灰米冷肌肉上发脏 → 冷肌肉底改纸白。
- 之前窗口的坑仍有效：推 main 别让最后一个提交只差 apk（`vercel.json` 的 `ignoreCommand`，推前先 `git merge --ff-only origin/main`）；无头 Chromium 没有 H.264；新容器 `pip install playwright`；4 个并行 agent 撞 API 额度上限时 SendMessage 让它们续上。

## 7. Constraints
- 见 `CLAUDE.md`：中文、结论先行；组件 / 页面里不写死 px、ms、十六进制颜色（`npm run check:hardcoded` 拦，**tsx 里也不许写 hex**）；命中区 ≥ 48；`/playground`、`/demo` 同步；方案台旧方案不删；要拍板的图用 `SendUserFile` 推；门禁放后台跑，**用户 2026-10-10 说：工作都做完再最后跑，不用中途跑**。
- **深色模式一像素不许变**（用户：「深色模式原本有描边的不用改，深色模式的页面已经是完全固定的」）。任何主题相关的改动：Token 只改 `light`，CSS 只写 `[data-theme='light'] …`，改完跑 `scripts/regress_dark.py`。
- 浅色：不写描边，用 `var(--depth-*)`；不用深绿（`lime-600/700/750` 不要出现在浅色可见元素里）；主视觉只有白 / 荧光 / 黑。
- 绝不让对话被自动压缩：每个阶段收尾推送时顺手更新本文件（CLAUDE.md）。

## 8. How to Verify
```bash
npm ci && npm run check                                   # tsc + 400 单测 + 写死值 + 构建（含两套主题对比度）
npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
python3 scripts/shoot_6a.py --no-shots --base http://127.0.0.1:4173            # 全套门禁（后台跑，约 5 分钟）
python3 scripts/shoot_6a.py --no-shots --only light --base http://127.0.0.1:4173   # 只跑浅色
# 深色回归（基线 = 改动前提交的构建）
git stash / git checkout <旧提交> && npm run build && cp -r dist /tmp/base_dist && npx vite preview --outDir /tmp/base_dist --port 4174 --host 127.0.0.1 &
cp -r dist /tmp/cand_dist && npx vite preview --outDir /tmp/cand_dist --port 4175 --host 127.0.0.1 &
ROUTES_ONLY=1 python3 scripts/regress_dark.py shoot http://127.0.0.1:4174 /tmp/r_base
ROUTES_ONLY=1 python3 scripts/regress_dark.py shoot http://127.0.0.1:4175 /tmp/r_cand
python3 scripts/regress_dark.py compare /tmp/r_base /tmp/r_cand        # 页面必须全部一致
```
- 测试状态：`check` 全绿；门禁全套 19 / 19；深色页面 17 / 17 一致。
- 浅色看法：任何页面加 `?theme=light`（例：`/today?scenario=plain-prescription&theme=light`）；方案台 `/preview#light-v`、`#light-contour`、`#light-base`、`#light-sel`；`/playground` 右上角切全局主题。
- 截图小工具（本窗口 scratchpad，丢了就按这个写）：playwright chromium `executable_path='/opt/pw-browsers/chromium'`，`args=['--no-sandbox']`，视口 390×844，`device_scale_factor=2`。

## 9. Environment State
- **Stitch 密钥：约定在仓库根 `secrets/stitch.env`（每次交接都告知，不再向用户要）；这个容器里没有这个文件**（用户说先不管）。
- Branch: **`claude/gifted-gauss-sg2xds`**（已全部推送，远端同步）；`main` 没有这一轮的任何提交
- Uncommitted changes: 无（本文件和 `scripts/regress_dark.py` 随下一个提交推送）
- Running services: 可能还有 `vite preview` 在 4173 / 4174 / 4175 / 4176（旧容器的话已没有）；新窗口先 `npm ci`、构建、自己起
- Env: Chromium `/opt/pw-browsers/chromium`；Python Playwright 先 `pip install playwright`（1.63）；`ffmpeg` 在；Pillow、numpy 在；GitHub 只能用 `mcp__github__*`，没有 `gh`

## 10. Open Questions
- **要不要把这条分支合进 `main`**（让 Vercel 部署、线上 /demo 能看到）？
- **导航选中滑块浅色保留「浅凹槽」吗？**（墨黑滑块是 App 签名，浅色里改了；可只把导航改回墨黑）
- 流体背景在浅色里仍有一层淡荧光雾，要不要更淡 / 去掉
- 还剩的墨黑小块（`tag_strong`、商城角标、`control/selected` 作数据填充处）要不要也治
- 作品集：载体、样机机型、封面深 / 浅、要不要单独讲 AI 协作（`docs/portfolio-handoff.md` §8）
- Stitch 密钥（用户说先不管）

## 11. Specific Next Steps
1. **先问用户**：浅色验收意见；要不要合 `main`；导航滑块保留与否（Open Questions）。
2. 按反馈微调浅色：只改 `light` Token / `[data-theme='light']` 规则；改完跑 `npm run check`，用 `regress_dark.py` 重截深色页面比对，最后（所有改动做完后）一次性跑门禁全套。
3. 合 `main`（若用户同意）：`git fetch origin main && git merge --ff-only origin/main`（让有内容的提交在最上面），推 `main`，核对线上 `https://gymlog-taupe.vercel.app/demo` 的提交号；只告诉用户「改了什么、线上能看了」。
4. 之后作品集：先读 `docs/portfolio-handoff.md`，§8 的问题先问用户（不要自行决定）。
