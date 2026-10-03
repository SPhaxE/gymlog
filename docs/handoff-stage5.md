# 慢牛 Milo · 阶段 5 交接

> 日期：2026-10-03 · 状态：**定稿**（阶段 4 已过关：用户在 Figma 里运行插件，Foundations、组件与标杆页 P06 均确认无误）
> 交接对象：阶段 5（组件与壳，写代码）。

## 1. 已经有的

| 东西 | 在哪 | 说明 |
|---|---|---|
| 视觉规范的数值 | `design/tokens/tokens.json` | 唯一源头。改了要跑 `python3 scripts/build_tokens.py` |
| 给代码用的变量 | `design/tokens/tokens.css` | 生成物；`--milo-color-*`、`--milo-space-*`、`--milo-radius-*`、`--milo-motion-*`…… |
| 使用规则 | `docs/DESIGN.md` | 荧光的三类用途、光晕预算、字号下限 11、容量四档、导航环线型、禁止项、组件表（§9） |
| Figma | 「慢牛 Milo Design System」文件，三个分区 | 由 `design/figma-plugin` 生成：Foundations、Components（16 个组件）、Benchmark · P06（3 张画板） |
| 人体图 | `public/bodymap/bodymap-{male,female}.json` | MuscleWiki 解剖路径（V1 原样）。**实现时直接读它**，分层：中性部位 → 肌肉组 → 轮廓层（同 V1 `BodyMap.jsx`）；腹股沟不着色 |
| 标杆页数据 | `design/benchmark/p06.json` | 原型引擎在「今天已练完」「冷启动」下的实算值，可做组件预览页的假数据 |

## 2. 组件名与 Figma 一一对应

`NavPill`、`Capsule`、`ScaleBar`、`BodyFigure`、`RecoveryBlock`、`VolumeBlock`、`Segmented`、`Segmented2`、`Button`、`TierLegend`、`KpiRow`、`PageHeader`、`SheetHeader`、`InfoRow`、`InlineNote`。变体与限制见 `DESIGN.md` §9。`TouchPoint` 只用于标杆页示意，不实现。

## 3. 以 Figma 为准 / 以代码为准

- **以 Figma（也就是 tokens.json）为准**：颜色、字号、间距、圆角、描边、阴影、组件的变体和结构。
- **以 ia.md 为准**：数据口径、交互规则（放大镜 150 ms / 8 px、余弦衰减、松手落点、导航环的计算口径）。
- **Figma 画不出、要在代码里做的**：
  - 导航环的连续比例（Figma 里只有 57% 和满环两个示意值）；
  - 刻度条的已填比例（Figma 里用硬边渐变示意）；
  - 放大镜的连续缩放；
  - 「减少动画」降级（`references.md` §9.2）。

## 4. 阶段 5 的待办（摘自各文档）

- 组件预览页：`NavPill` 5 种 ring × 3 个 Tab × 减少动画；`Capsule` 5 态；`BodyFigure` 男 / 女 × 正 / 背（`signature-nav.md` §4.5）。
- `settings.navRing`（ia §1.11 / §1.12）；store 暴露「今日进度」「休息剩余比例」两个只读值。
- 引擎用 TS 重写，≥ 40 条测试，含原型新增的 5 条规则（`ia.md` §7）。
- 附录 F：`src/pages`、`src/components` 里不出现散落的颜色和尺寸数值。
