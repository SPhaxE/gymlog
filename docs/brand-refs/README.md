# 品牌意向图（Nano Banana 2，2026-10-05）

用户按 `design/brand/prompts/nanobanana-ip-logo.md` 出图后上传；文件按方向重命名。这些图只用来定方向，**不是素材**，不进网页包和 APK（`docs/` 不在 `copy_static` 里）。

| 文件 | 方向 | 用户选择 |
|---|---|---|
| `ip2-geo-a-selected.jpg` | IP2 几何积木（侧身、角从无到芽到新月） | ✅ 最看重，与 b 各取其长 |
| `ip2-geo-b-selected.jpg` | IP2 几何积木（成长幅度大、正脸表情） | ✅ 最看重 |
| `ip1-line.jpg` | IP1 断笔线条 | — |
| `logo-m-horn-selected.jpg` | LC 字标：M 的两峰是牛角 | ✅ 有感觉 |
| `logo-bars-vhead-selected.jpg` | LD 递增条拼出牛头 | ✅ 有感觉 |
| `logo-m-variants.jpg` / `logo-bars-horn.jpg` / `logo-head.jpg` | 其他 Logo 尝试 | — |
| `state-*.jpg` | 状态 Logo 模板的尝试 | 用户「没太看懂」，由 Claude 定 |

第二轮（2026-10-05）：IP 按 `ip2-geo-b-selected.jpg` 的画法逐块重描，每个成长阶段都有全部状态，动效分层参考 [pet-forge](https://github.com/rullerzhou-afk/pet-forge) 的 SVG 约定（分层母版、显式支点、循环首尾帧相同、多层异步周期）；Logo 定为 `logo-bars-vhead-selected.jpg`（B 递增条牛头）。

矢量实现在 `/brand`（`src/components/Mascot.tsx`、`src/components/Logo.tsx`），截图在 `screenshots/brand/`。

第七轮之后（2026-10-05）：用户决定 IP 改用 PNG，按 `ip2-geo-b-selected.jpg` 高清重制 5 种牛龄 × 6 种状态（提示词 `design/brand/prompts/nanobanana-ip-hd.md`）。重制出来的单张资产（`mascot-<牛龄>-<状态>.png`）会抠图、统一尺寸后进 `public/`，作为正式素材；这里的意向图仍只作参考。
