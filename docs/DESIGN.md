# 慢牛 Milo 视觉规范（DESIGN.md）

> 阶段 4 · Foundations + Components + 标杆页 P06 · 2026-10-03 · 方向 B「配重片」（吸收 A「刻度」），初版只有深色
> **数值的唯一源头是 `design/tokens/tokens.json`。** 本文只写使用规则；数值以 tokens.json 为准，经插件导入 Figma（`design/figma-plugin/README.md`），经 `design/tokens/tokens.css` 给代码用。
> 方向的来由见 `docs/references.md` §8–§12。

## 0. 流程

```
tokens.json ──build_tokens.py──┬─> design/figma-plugin/code.js ──在 Figma 里运行──> 变量 / 样式 / 说明分区
   （改这里）   （校验对比度）  └─> design/tokens/tokens.css ──> 阶段 5 的代码
```

- 改值只改 `tokens.json`。Figma 里手改的值会被下次导入覆盖；确实要改，先回写 tokens.json。
- `build_tokens.py` 校验对比度（`contrast` 里列出的每一对），不达标就不生成。
- 页面和组件里**只用变量和样式**，不写散落的数值（阶段 5 用附录 F 的 grep 检查 `src/pages`、`src/components`）。

## 1. 颜色

只用 `Milo · Tokens` 里的语义变量；`Milo · Primitives` 是原料，不直接用。

| 组 | 用途 |
|---|---|
| `bg/*` | 页面底 `bg/base`、卡片与胶囊 `bg/raised`、选中与按下 `bg/raised-2`、底部面板 `bg/sheet`、遮罩 `bg/scrim` |
| `text/*` | 正文 `primary`、说明与单位 `secondary`、禁用 `disabled`、荧光底上 `on-accent` / `on-accent-secondary` |
| `accent/*` | 荧光黄绿与它的光晕。**用途有限，见 §2** |
| `action/*` | 主按钮：暖白底 + 黑字。不是荧光 |
| `feedback/danger` | 只用于错误、保存失败、删除确认 |
| `data/*` | 刻度条、容量四档、人体图、引线 |
| `nav/*` | 导航胶囊环，见 §6 |

## 2. 荧光色的规矩

1. 荧光（`accent/default`）只给三类东西：
   - **当前主角**：放大镜下的胶囊、P01 今日处方卡、P01 训练中的当前动作行；
   - **导航选中项**（`nav/pill`）；
   - **进度**（`nav/progress`、刻度条上的当前段）。
   正文、图标、分割线、按钮一律不用。
2. **光晕 `Milo/Glow/Focus` 每屏最多一处。** 导航选中项是实心填充、不发光，不占这个预算。
3. 一屏里荧光**面积**最大的只能有一个：P01 有荧光主角卡时，当前动作行只用荧光描边，不填色。
4. 「超量」不用荧光（会被读成「好」），用 `Milo/Data/Tier-Over` 白底黑斜纹。
5. 噪点 `Milo/Texture/Grain` 只叠在主角卡和底部面板上，不叠在列表项和胶囊上。

## 3. 文字

| 样式 | 用在 |
|---|---|
| `Number/Hero` … `Number/XS` | 数字：Space Grotesk。单位（kg、组、%）用同一行里更小的 `Caption` 或 `Micro`，颜色 `text/secondary` |
| `Readout/M`、`Readout/S` | 刻度读数与计时（1:35）：JetBrains Mono，等宽防跳动。**只放数字**，中文标签另起一段用 `Micro` |
| `Title/L`、`Title/M`、`Heading` | 页面标题、卡片与面板标题 |
| `Body/Strong`、`Body`、`Label`、`Caption`、`Micro` | 正文、动作名、按钮、说明、胶囊名称 |

- **字号下限 11**（`font-size/min`，样式 `Micro`）。V1 正文 10 px 是教训，任何文字不得小于它。
- 胶囊静止时也必须显示肌肉名称（ia §1.10），用 `Micro`。

## 4. 形状、间距、尺寸

- 圆角：胶囊、按钮、导航 `radius/pill`；卡片 `radius/l`；底部面板顶角 `radius/xl`；小标签与刻度条 `radius/xs`。
- 间距只用 `space/*`（2–48）；页面左右边距 `space/l`（16）。
- 最小触控区 `size/hit-min`（48）。胶囊的视觉高度 `size/capsule-h`（26）可以小于它，但命中区按轨道均分（ia §1.10）。
- P01 今日处方卡高度不超过 `size/hero-max-h`（160）：首个动作的建议重量必须在首屏（U1）。

## 5. 数据图形

- **容量四档**：同时靠明暗和纹理区分，不只靠色相；P06 上常驻图例（ia §1.10）。
  | 档 | 填充 |
  |---|---|
  | 未练 | `data/tier-none` + 轮廓 `data/tier-none-edge` |
  | 不足 | `Milo/Data/Tier-Low`（暗荧光底 + 荧光点阵） |
  | 达标 | `data/tier-ok`（荧光实色） |
  | 超量 | `Milo/Data/Tier-Over`（白底黑斜纹） |
- 近 7 天 0 组的胶囊用 `Milo/Data/Untrained` 斜纹压暗。
- **刻度条**（借自方向 A）：空槽 `data/track`、已填 `data/fill`、三条地标（最低有效量 / 适宜量 / 最大可恢复量）用 `data/tick`，地标数字用 `Readout/S`。
- 空槽和导航轨道只有约 1.4 : 1，属于装饰性元素：信息靠已填部分或描边的长度传达，不靠空槽本身。

## 6. 导航胶囊环（ia §1.12）

| 元素 | Token |
|---|---|
| 导航底 | `nav/bg` + `Milo/Elevation/Float`，尺寸 `size/nav-w` × `size/nav-h`，离底 `size/nav-bottom` |
| 外圈轨道 | `nav/track`，`stroke/ring-track` |
| 外圈进度（今日组数） | `nav/progress`，**实线**，`stroke/ring-progress`；从顶边正中顺时针 |
| 选中项 | `nav/pill` 填充，文字与图标 `nav/pill-ink`，高 `size/nav-pill-h` |
| 休息倒计时 | `nav/rest`，**虚线**（`stroke/ring-rest-dash` / `stroke/ring-rest-gapdash`）+ 端点圆点，`stroke/ring-rest` |
| 描边与小胶囊的缝 | `stroke/ring-gap`：白描边贴着荧光胶囊时对比只有 1.03 : 1，必须留缝 |

## 7. 动效

参数都在 `motion/*`。预算：按下反馈 ≤ `motion/press`，单次转场 ≤ `motion/slow`，P03 记组页上的形变 ≤ `motion/base`，列表入场总时长 ≤ `motion/list-max`。
每个视效都要有「减少动画」降级，对照表在 `references.md` §9.2。P03 不放持续动画、光晕和噪点。

## 8. 禁止项（来自 Stitch 反例，references §12.3）

- 编造的英文或中文「技术标签」：CALIB-24、SYS.LOCKED、RX //、处方负荷校准……功能界面文案保持中性、克制。
- 一屏多处荧光；荧光按钮。
- 信号红或任何颜色的整条主按钮（主按钮只有暖白一种）。
- **任何不是 MuscleWiki 素材的人体图**：几何拼的、手画的、Stitch 或其他工具生成的都不行。人体图只用 `public/bodymap/`（V1 的 MuscleWiki 解剖路径，见 `asset-audit.md` §5），出现的页面要有「人体图：MuscleWiki」署名。
- 照抄参考图或生成图里的数字。口径只看 brief / ia。

## 9. 组件（Figma「Components · 配重片」分区，由插件生成）

| 组件 | 变体 | 用法与限制 |
|---|---|---|
| `NavPill` | ring 无环 / 进度 / 休息 / 进度+休息 / 满环 × selected 今日 / 进度 / 设置 × state 默认 / 按下（30） | 有 Tab 的页面都用它（ia §1.12）。外圈实线 = 今日进度，满环 = 今天已练完；恢复日、动作池不足、空态用「无环」。休息时选中项写「Tab 名 + 剩余时间」 |
| `Capsule` | 静止 / 邻近放大 / 放大中心 / 选中 / 未练 | **放大中心每屏只能有一个**（荧光 + 光晕）。放大镜按余弦衰减：中心上下各一个「邻近放大」。松手后被选中的是「选中」（荧光描边，不填色）。近 7 天 0 组用「未练」 |
| `ScaleBar` | size 胶囊 / 面板 × tone 默认 / 荧光底 × tier 大 / 中 / 小（面板没有荧光底，共 9） | 三条地标按肌头大小定位，不要手挪。已填比例 = 组数 ÷（上限 × 1.1，面板 × 1.15）：在实例里改 `fill` 图层的硬边渐变，不改尺寸 |
| `BodyFigure` | gender 男 / 女 × view 正面 / 背面 | MuscleWiki 素材，每个肌头一组 `muscle/<id>`；在实例里给组内矢量换填充表示容量档位（§5），选中的肌头加荧光描边。腹股沟是中性部位，不着色 |
| `RecoveryBlock` / `VolumeBlock` | 时相 4 档 / 肌头大小 3 档 | 详情面板的两块；时相条当前段是荧光，属于「进度」类用途 |
| `Segmented` / `Segmented2` | 选中项 | 选中项用 `control/selected`（暖白），不是荧光 |
| `Button` | 主 / 次 × L / S | 一屏最多一个主按钮 |
| `TierLegend`、`KpiRow`、`PageHeader`、`SheetHeader`、`InfoRow`、`InlineNote` | — | 文字都在实例里改，不要拆开 |
| `TouchPoint` | — | 只在标杆页示意手指位置，产品里不出现 |

标杆页 P06（「Benchmark · P06」分区）由这些组件拼成：① 放大镜按住「中下胸」② 松手后的详情面板 ③ 空态。除引线外没有散落的图形；数据来自 `design/benchmark/p06.json`（原型引擎的实算结果）。正面 19 个肌头的胶囊轨道比 800 高的屏幕长约 60 px，页面本来就可滚动（ia §1.10），这是预期的。

## 10. 自检

```bash
python3 scripts/build_tokens.py --check   # 对比度与引用
python3 scripts/build_tokens.py           # 生成插件与 CSS
node scripts/test_figma_plugin.js         # 模拟 Figma API 跑三个命令（62 项：幂等、组件 ID 不变、只用变量、只用实例、MuscleWiki 署名……）
node scripts/test_figma_plugin.js --render out.html   # 顺带把标杆页的模拟结果粗略画成 HTML（文字宽度是估的）
```
