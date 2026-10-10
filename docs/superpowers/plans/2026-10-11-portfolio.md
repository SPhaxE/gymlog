# 慢牛 Milo 作品集 · 实施计划

> 2026-10-11 · 搭建窗口。依据：`docs/superpowers/specs/2026-10-11-portfolio-design.md`（唯一依据）、`docs/portfolio-handoff.md`（素材 / 数字）。
> 目标：22 张 1920 × 1080 SVG（能导入 Figma）+ PNG 预览 + 合并 PDF。不动 `src/`，只写 `portfolio/` 与 `docs/`。

## 已定（本窗口开头）

- 封面 AIGC 实拍版用 **3 号图**（`docs/Generated Image October 11, 2026 - 1_42AM.jpg`，A 手持日常版）→ 复制到 `portfolio/assets/aigc/cover.jpg`；另一版纯样机，两版都出。

## 目录

```
portfolio/
  lib/pf.py            颜色（读 tokens.json）、字阶白名单、header / footer / phone / callout / 四种动效呈现 / embed
  lib/fonts.py         三套字体的 @font-face（取 node_modules/@fontsource*，族名改成 Figma 的 Google Fonts 名）
  shoot/app.py         App 屏：412 × 915 @2.625、深色、注入安全区、叠状态栏 + 手势条 → assets/screens/<页>.png（1080 × 2400）
  shoot/device.py      样机合成预览（body 套 Pixel 8）→ out/check/device-body.png
  shoot/motion.py      动效帧：冻结时钟逐帧（M02 叠影等）→ assets/frames/<动效>/NN.png
  pages/genNN.py       每页一个脚本 → out/svg/NN_专题名.svg
  render.py            SVG → PNG（out/png/）、合并 PDF（out/Milo-作品集.pdf）、总览图
  check.py             自检
  assets/              device/ screens/ frames/ aigc/ brand/（只放生成或复制来的素材）
  out/                 svg/ png/ check/（成品，入库）
```

## 关键约定

- **SVG 规矩**（Figma 兼容）：文字一律 `<text>`，`font-family` 写 Figma 名（`Noto Sans SC` / `Barlow Condensed` / `JetBrains Mono`）；不用 `foreignObject`、`<style>`、`filter`；裁切只用 `clipPath`；光晕 / 颗粒 / 模糊烘进 PNG 图层。
- **位图**：显示尺寸 × 2 嵌入；不透明用 JPEG（q 88），要透明的用 PNG；单页 ≤ 15 MB。
- **样机**：`phone(screen, x, y, w, rot)` = 屏幕 `<image>`（`clipPath` 圆角，单独一层，Figma 里可换屏）+ 挖孔黑圆 + 机身 PNG 层（`back.webp` 转 PNG）。屏幕在机身 (49, 55)，1080 × 2400。
- **状态栏**：Android 14 样式（左时间、右信号 / Wi-Fi / 电池），顶部安全区 48 dp、底部 24 dp（手势条），由截图时注入 `--safe-area-inset-top / bottom`；挖孔圆心在屏幕 (540, 65) px。
- **数字**：只用 `portfolio-handoff.md` §3.2 / §5、`brief.md`、`DESIGN.md`、`walkthrough-1.md` 里出现过的；`check.py` 用白名单拦。
- **字阶白名单**：12 14 16 18 22 28 40 54 72 160 240 300。

## 步骤

| # | 做什么 | 产出 | 验收 |
|---|---|---|---|
| 1 | 本计划 | 本文件 | 推 `main` |
| 2 | `shoot/app.py` + `shoot/device.py`：先出 body 套 Pixel 8 | `out/check/device-body.png` | **用户确认挖孔与状态栏** |
| 3 | 出全部 15 屏 | `assets/screens/*.png` | 目检：无内容被挖孔压住 |
| 4 | `lib/pf.py`、`lib/fonts.py`、`render.py`、`check.py` | — | 字体没加载上就报错退出 |
| 5 | 定调页**一页一页来**：P01（两版）→ P09（M02 叠影先建 `shoot/motion.py`）→ P21；每页先过自评、再推给用户，用户点头才做下一页 | `out/svg/01*`、`09*`、`21*` + PNG | **每页用户点头** |
| 6 | 按页序做其余 19 页；动效页前补 `motion.py` 各动效、截 `/preview` `/playground` `/spec` | 每页 SVG + PNG | 每页 `check.py` + 看 PNG，推给用户 |
| 7 | 合并 PDF + 22 页总览图 | `out/Milo-作品集.pdf`、`out/png/00-overview.png` | 用户验收 |

每一步收尾推 `main` 时同步更新 `docs/handoff-session.md`。

## 审美要求与自我批评（用户 2026-10-11：「不要太平庸，要有审美追求、有设计感，有自主批评和改进」）

每页至少两轮：出 PNG → 按下表自评、写下最弱的三处 → 改 → 再出 PNG，才推给用户。自评记在 `portfolio/out/critique.md`（每页一段：问题 → 改法）。

| 查什么 | 平庸的样子 | 要的样子 |
|---|---|---|
| 主焦点 | 每样东西一样大，眼睛没落点 | 一页一个主角，占面积或亮度绝对优势；荧光只给它 |
| 尺度对比 | 字号都在 18–40 之间 | 大数字 / 大字与 14 号注释同框，至少差 6 倍 |
| 构图 | 左文右图、居中对称、卡片网格 | 出血、斜置、压图、留大片负空间；元素对齐到同一组隐形线 |
| 纵深 | 平铺贴图 | 前后景分层：颗粒光 / 模糊远景 / 清晰前景，样机有投影 |
| 细节 | 只有图和标题 | 刻度、Mono 编号、引线、配重片孔阵这类「Milo 语言」的小件，但每页只挑一两种 |
| 文字 | 段落说明 | 主张句一句话说完；说明 ≤ 2 行；标注一行 |
| 真实 | 假界面、手写数字 | App 真渲染、仓库里的数字 |

## 风险与对策

- 无头浏览器无 GPU：动效帧冻结时钟逐帧截；WebGL 熔流用 SwiftShader 慢截。
- Figma 导入大位图慢：背景出血图单独一层，必要时另附外链文件。
- AIGC 绿幕贴真屏：自动找绿区四角 → 透视变换贴屏 → 边缘去绿溢色；烘进照片层（SVG 只能仿射变换）。
