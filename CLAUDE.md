# 慢牛 Milo · 给 AI 客户端的入口

**先读 [`HANDOFF.md`](HANDOFF.md)**（现状、架构、命令、素材管线、坑、下一步），再按需读 `docs/brief.md`（决定记录）→ `docs/ia.md`（功能规格）→ `docs/DESIGN.md`（视觉与交互规范）。

## 不许破的规则（摘自 HANDOFF §2 与 DESIGN §9.6）

- 用户写中文、要结论先行；App 文案、文档、提交信息一律中文。跟 Milo 有关的文案写英文「Milo」，只在介绍时写「米洛（Milo）」。
- 密钥不进仓库、不打印（Stitch 用环境变量 `STITCH_API_KEY`）；不关 TLS 校验。
- 人体图只用 `public/bodymap/` 的真实 MuscleWiki 素材；演示商家、品牌一律虚构，不仿冒真实品牌。
- 组件 / 页面里不写死 px、ms、十六进制颜色，一律用 Token（`npm run check:hardcoded` 会拦）。
- 交互：命中区 ≥ 48；一屏一个主操作、放拇指区；不给死路按钮；提示不位移；滚动 grid 写 `grid-auto-rows: max-content`；键盘按需出现；临时面板点别处就收；转场不吞点击；同一个东西屏上只出现一次（休息计时：首页胶囊 ↔ 导航滑块是同一个元素）。
- 组件或规范有更新，`/playground`（`src/playground/catalog.tsx`）和 `/demo`（`DemoPage` 路线）必须同步改；不要把密钥建议「作废」挂在嘴边——后面还要继续用 Stitch（用户 2026-10-06）。
- `.claude/skills/` 里装了第三方 taste-skill（反模板化设计指南，面向着陆页）：当参考用，**与 `docs/DESIGN.md` 冲突时以 DESIGN.md 为准**，详见 `.claude/skills/README-taste-skill.md`。
- 新页面流程：灰阶线框 → Stitch 多方案 → 代码定稿 → 截图给用户验收；交互五层分析写在页面文件头注释里。

## 动手前后

```bash
npm ci && npm run check                 # 改之前、改之后都要全绿
npx vite --port 5199 --host 127.0.0.1 & python3 scripts/shoot_6a.py   # 演示全流程门禁
```

合并流程：功能分支 → PR → CI 绿 → merge 方式合并 → 等 Vercel 生产部署（https://gymlog-taupe.vercel.app/demo）。

**改完默认走完这条流程，不用再问用户**（用户 2026-10-06 定的标准操作）：开 PR、等 CI 绿、merge 合并、核对线上 /demo 已是新代码，最后一并汇报。只有改动范围不清楚、或 CI 红且不是这次改动造成时才停下来问。
