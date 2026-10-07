# 慢牛 Milo · 给 AI 客户端的入口

**先读 [`HANDOFF.md`](HANDOFF.md)**（现状、架构、命令、素材管线、坑、下一步），再按需读 `docs/workflow.md`（工作流：本项目版 + 用户最初的模板原文）→ `docs/brief.md`（决定记录）→ `docs/ia.md`（功能规格）→ `docs/DESIGN.md`（视觉与交互规范）。

## 不许破的规则（摘自 HANDOFF §2 与 DESIGN §9.6）

- 用户写中文、要结论先行；App 文案、文档、提交信息一律中文。跟 Milo 有关的文案写英文「Milo」，只在介绍时写「米洛（Milo）」。
- 密钥不进仓库、不打印（Stitch 用环境变量 `STITCH_API_KEY`）；不关 TLS 校验。
- 人体图只用 `public/bodymap/` 的真实 MuscleWiki 素材；演示商家、品牌一律虚构，不仿冒真实品牌。
- 组件 / 页面里不写死 px、ms、十六进制颜色，一律用 Token（`npm run check:hardcoded` 会拦）。
- 交互：命中区 ≥ 48；一屏一个主操作、放拇指区；不给死路按钮；提示不位移；滚动 grid 写 `grid-auto-rows: max-content`；键盘按需出现；临时面板点别处就收；转场不吞点击；同一个东西屏上只出现一次（休息计时：首页胶囊 ↔ 导航滑块是同一个元素）。
- 组件或规范有更新，`/playground`（`src/playground/catalog.tsx`）和 `/demo`（`DemoPage` 路线）必须同步改；不要把密钥建议「作废」挂在嘴边——后面还要继续用 Stitch（用户 2026-10-06）。
- `.claude/skills/` 里装了第三方 taste-skill（反模板化设计指南，面向着陆页）：当参考用，**与 `docs/DESIGN.md` 冲突时以 DESIGN.md 为准**，详见 `.claude/skills/README-taste-skill.md`。
- 需要用户拍板的图像、方案、对比图，一律用 `SendUserFile` 直接推到窗口，不要只写文件路径（用户 2026-10-06）。
- 每页 / 每块新功能五步（用户 2026-10-07，详见 `docs/workflow.md` §A）：**① 五层分析 + 手指热区低保真线框 → ② Stitch 视觉参考 → ③ 高保真搭建 → ④ 用户视觉审查微调 → ⑤ 定稿植入**；①②④ 都要用户选或点头，五层分析写在页面文件头注释里。
- 视效 / 组件的待选方案一律上 `/preview` 方案台（`src/pages/OptionsBoard.tsx`）：逐组对照 + 自由组合（组合写进地址栏），实时渲染不放截图；用户选定后定为默认，**旧默认和落选方案留在方案台不删**——作品集要展示这个过程（用户 2026-10-07）。

- **换窗口交接**（用户 2026-10-07）：判断上下文快到极限时，不等自动压缩，按 `docs/handoff-template.md` 的模板写一份 `docs/handoff-session.md`（11 节写全，推上 `main`），然后告诉用户换窗口继续；新窗口先完整读它，Open Questions 先问用户。

## 动手前后

```bash
npm ci && npm run check                 # 改之前、改之后都要全绿
npx vite --port 5199 --host 127.0.0.1 & python3 scripts/shoot_6a.py   # 演示全流程门禁（两个宽度并行，约 1 分钟；加 --no-shots 不截图更快）
```

**门禁一律放后台跑（`run_in_background`），主线不等它**（用户 2026-10-07：「可以放后台的全放后台」）。门禁按「类别 × 宽度」并行、卡住 8 秒就报错并写明卡在哪一行；失败了只重跑失败项 `python3 scripts/shoot_6a.py --no-shots --failed`，不要整套连跑几遍。更快：先 `npm run build`，再 `npx vite preview --port 4173 --host 127.0.0.1 &` + `--base http://127.0.0.1:4173`（约 1.5 分钟）。日常迭代别每次跑全套：`npm run test:changed`（只跑改到的测试）、`python3 scripts/shoot_6a.py --no-shots --only gains`（只跑某类：flow / story / deload / gains / demo）；提交前再跑一遍完整的 `npm run check` 和 `npm run gate`。

上线流程（用户 2026-10-06 改：PR / CI 来回太拖开发）：本机 `npm run check` + 相关 `gate` 过了，**直接推 `main`，不开 PR**；Vercel 自动部署（https://gymlog-taupe.vercel.app/demo），CI 在后台跑，红了马上补一个修复提交推上去。

**改完默认走完这条流程，不用再问用户**：推 `main` → 核对线上 /demo 已是新代码。**跟用户说话只讲改了什么、线上能看了，不汇报 PR、CI、命令这些过程**（用户 2026-10-06：经常看到这些，拖慢开发）。只有改动范围不清楚、或 CI 红且不是这次改动造成时才停下来问。
