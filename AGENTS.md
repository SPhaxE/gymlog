# 慢牛 Milo · 给 AI 客户端的入口（AGENTS.md，与 CLAUDE.md 同内容）

**先读 [`HANDOFF.md`](HANDOFF.md)**（现状、架构、命令、素材管线、坑、下一步），再按需读 `docs/workflow.md`（工作流；通用模板 v2 在 `docs/uiux-ai-workflow-v2.md`，新坑 / 新优化要回写进去）→ `docs/brief.md`（决定记录）→ `docs/ia.md`（功能规格）→ `docs/DESIGN.md`（视觉与交互规范）。

## 不许破的规则（摘自 HANDOFF §2 与 DESIGN §9.6）

- 用户写中文、要结论先行；App 文案、文档、提交信息一律中文。跟 Milo 有关的文案写英文「Milo」，只在介绍时写「米洛（Milo）」。
- 密钥不进仓库、不打印；不关 TLS 校验。**例外：Stitch 密钥在仓库根 `secrets/stitch.env`**（用户 2026-10-09：仓库私密，直接存、每次交接告知、以后不再向用户要；做完用户会删）。`design/hifi/tools/stitch.py` 会自己读它；别挪进 `design/` `mock/` `prototype/` `public/`（会被拷进 dist 公开部署）。
- 人体图只用 `public/bodymap/` 的真实 MuscleWiki 素材；演示商家、品牌一律虚构，不仿冒真实品牌。
- 组件 / 页面里不写死 px、ms、十六进制颜色，一律用 Token（`npm run check:hardcoded` 会拦）。
- 交互：命中区 ≥ 48；一屏一个主操作、放拇指区；不给死路按钮；提示不位移；滚动 grid 写 `grid-auto-rows: max-content`；键盘按需出现；临时面板点别处就收；转场不吞点击；同一个东西屏上只出现一次（休息计时：首页胶囊 ↔ 导航滑块是同一个元素）。
- 新页面流程：灰阶线框 → Stitch 多方案 → 代码定稿 → 截图给用户验收；交互五层分析写在页面文件头注释里。

## 动手前后

```bash
npm ci && npm run check                 # 改之前、改之后都要全绿
npx vite --port 5199 --host 127.0.0.1 & python3 scripts/shoot_6a.py   # 演示全流程门禁
```

合并流程：功能分支 → PR → CI 绿 → merge 方式合并 → 等 Vercel 生产部署（https://gymlog-taupe.vercel.app/demo）。
