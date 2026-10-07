# ponytail（第三方，已安装）

来源：<https://github.com/DietrichGebert/ponytail>，提交 `552acd5`（2026-10-07 安装），MIT 协议（见 `PONYTAIL-LICENSE`）。只拷了仓库 `skills/` 下的 6 个技能（原样，未改动）：

| 技能 | 作用 |
|---|---|
| `ponytail` | 写代码前按顺序问：这东西要不要做 → 仓库里有没有现成的 → 标准库 / 平台自带能不能做 → 已装的依赖能不能做 → 能不能一行 → 最后才写最少的新代码。分 lite / full / ultra 三档 |
| `ponytail-review` | 只看「过度设计」的代码审查：一条一行，写删什么、换成什么 |
| `ponytail-audit` | 整个仓库的过度设计审计，按能删多少排序；只列不改 |
| `ponytail-debt` | 收集代码里 `ponytail:` 注释（故意偷懒的地方 + 什么时候该补）成一张账 |
| `ponytail-gain` | 显示作者公布的基准测试成绩（不是本仓库的数） |
| `ponytail-help` | 命令速查 |

**没装的**：仓库里的钩子（`hooks/`，每轮对话自动执行 JS 脚本、改状态栏、需要改项目设置），以及给 Cursor / Codex / Gemini 等其它工具的配置。所以 `ponytail-help` 里说的「每次会话自动开启」「环境变量 / 配置文件改默认档位」在这里不生效：要用时说 `/ponytail`（或 `/ponytail lite|ultra`），说「stop ponytail」关掉。

**与本项目规则冲突时以本项目为准**（`CLAUDE.md`、`docs/DESIGN.md`、`HANDOFF.md`）。具体几处：
- 它要求「先给代码、最多三行说明」：本项目跟用户说话用中文、结论先行，只讲改了什么、线上能看了——说明的格式照本项目。
- 它说「非简单逻辑只留一个最小检查」：本项目的 `npm run check` / `npm run gate` 门禁、`/playground` 每个组件都要有条目、`/demo` 路线同步，这些都不是「多余的代码」，照做。
- 它的「最少文件、不做抽象」用于代码层面；视觉与动效的完整度（方案台、交互态、数据态）按 DESIGN.md，不因「偷懒」省掉。
- 新会话启动后这些技能才会出现在技能列表里。
