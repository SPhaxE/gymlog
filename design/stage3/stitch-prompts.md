# Stitch 提示词（阶段 3 方向稿）

> 项目：Stitch「慢牛 Milo · 阶段 3 方向稿（深色）」（projects/6521973591904798142，私有）。模型 GEMINI_3_8_FLASH，设备 MOBILE。
> 每张图 = 公共段 + 页面段（P06 或 P01）+ 方向段。截图与逐张点评见 `docs/references.md` §12。API key 不入库。

## 公共段

```text
Android phone screen, 360x800 dp portrait. DARK THEME ONLY. Strength-training app "Milo" (Chinese name 慢牛). All UI text must be Simplified Chinese exactly as given below; no lorem ipsum, no English UI labels. No photos, no illustrations of people, no cows, no brand logos. Brand keywords: assured, transparent, solid, tense, equipment-like (machined metal, tick marks, weight plates, pins and gauges translated into flat UI).
```

## 页面段 · P06

```text
Screen: 进度 / 容量与恢复 (weekly volume & recovery).
- Header: title 进度, small caption 近 7 天 · 滚动统计. Segmented control: 容量与恢复 (selected) / 训练记录 / 动作进步.
- Three readouts in one row: 13,854 kg 总负荷 · 43 完成组数 · 4 训练天数.
- Small toggles: 正面 / 背面 and 男 / 女.
- Main area: on the left a front-view human body figure built from simple geometric shapes (rounded rects and ellipses, not realistic anatomy). Muscles are shaded by weekly volume in 4 levels that differ by brightness AND texture, not hue alone: 未练 / 不足 / 达标 / 超量.
- On the right a vertical rail of 15 small pill capsules, each linked by a thin elbow leader line to its muscle on the body. Each capsule shows muscle name, "sets/target" and a thin bar: 三角肌前束 6.5/13, 上胸 6/16, 三角肌中束 7/13, 中下胸 7.5/16, 肱二头肌短头 5.5/13, 肱二头肌长头 4.5/13, 上腹 0/10, 腹斜肌 0/10, 下腹 0/10, 腕屈肌 0/10, 大腿内收肌 3/16, 股直肌 5/16, 股外侧肌 6.5/16, 股内侧肌 6.5/16, 胫骨前肌 0/10.
- Magnifier state: a finger is pressing the rail at 中下胸. That capsule is magnified like a macOS dock icon (about 3x taller) and shows 中下胸 7.5/16, 恢复 3% · 修复期, and a tick scale with three marks 最低 8 / 适宜 16 / 上限 22. The neighbours just above and below are slightly enlarged (cosine falloff); the rest stay small but still show their names.
- Bottom: a floating pill-shaped navigation bar (not full width, centered) with 3 items 今日 / 进度 / 设置. The selected item 进度 is a smaller solid pill with icon + label; the others are icon only. The outer pill's outline is a thin closed progress ring (today's workout is done).
```

## 页面段 · P01

```text
Screen: 今日处方 (today's prescription), workout in progress, user is resting between sets.
- Header: 今日处方, date 10 月 3 日 · 周六.
- Hero summary card (the single most important element on the screen): 今天练 7 块肌肉 · 14 组; sub line 下肢、背、胸 · 5 个动作; progress 已完成 8 / 14 组; 约 60 分钟.
- Exercise list, each row: index, name, scheme, suggested weight on the right:
  01 杠铃深蹲 3 × 6–8 · 休息 3:00, 85 kg, ✓ 已完成 (dimmed)
  02 器械站姿提踵 2 × 10–12 · 休息 2:00, 60 kg, ✓ 已完成 (dimmed)
  03 窄握下拉 3 × 6–8 · 休息 3:00, 50 kg, ✓ 已完成 (dimmed)
  04 杠铃卧推 3 × 6–8 · 休息 3:00, 65 kg, 目标 8 次 (current, highlighted)
  05 上斜哑铃卧推 3 × 6–8 · 休息 3:00, 27.5 kg, 目标 6 次
- Full-width primary button: 继续训练.
- Bottom: floating pill navigation 今日 / 进度 / 设置 with 今日 selected. The OUTER pill outline is a progress ring drawn 57% of the way round (8 of 14 sets). The selected small pill has its OWN separate outline stroke that counts down the rest timer (about half left) with a small dot at the stroke end, and its label shows the remaining time 1:35 instead of 今日. The two rings must be distinguishable by line style, not only colour.
```

## 方向段 · A

```text
Visual direction "刻度 Gauge": graphite background #111214, surfaces #17181B, 1px hairline dividers #2B2D31, off-white text #ECE8DF, vernier-caliper tick marks under numbers and bars, bold MONOSPACED numerals (JetBrains Mono), a single amber accent #FF8A1F used like an instrument needle, small corner radii (4–6 px), no glow, no gradients, dense and precise.
```

## 方向段 · B

```text
Visual direction "配重片 Plate": near-black background #0A0A0B, surfaces #161618, warm white text #F3F2EE, ONE acid lime accent #D4FF3A used only for the current focus (the magnified capsule / the hero card) and the selected nav pill, with one soft glow per screen at most; fully rounded chunky capsules like weight plates; subtle film-grain noise on large surfaces; bold geometric grotesk numerals (Space Grotesk), large and confident; everything else muted grey.
```

## 方向段 · C

```text
Visual direction "铭牌 Nameplate": dark gunmetal #0F1012 with subtle brushed-metal texture translated into flat UI, raised steel plates with tiny rivet dots at capsule ends, etched condensed numerals (Barlow Condensed), letter-spaced labels, signal red #FF453A used only as a small indicator, restrained bevels and inner shadows.
```

## 方向段 · D

```text
Visual direction: your own proposal. Derive a distinctive dark visual language from the brand keywords (assured, transparent, solid, tense, equipment-like) that is clearly different from generic fitness apps (not system blue, not red/green heat maps). Use at most one accent colour.
```

## 变体轮（generate_variants，以 run2 的 B-P06 / B-P01 为底，各 3 个，EXPLORE，变化 LAYOUT / TEXT_FONT / IMAGES）

```text
Keep direction "配重片 Plate": near-black #0A0A0B, warm white text, ONE acid lime accent #D4FF3A. Strict rules for every variant:
1) Lime is allowed ONLY on (a) the single current focus element and (b) the selected nav pill. Buttons, list highlights, labels and icons must NOT be lime; the primary button is warm white with black text.
2) At most one soft glow per screen.
3) NO decorative fake technical English labels (no "CALIB", "SYS", "REV", "SPEC", "RX //", serial numbers). All UI text Simplified Chinese, neutral and restrained.
4) Keep every data value exactly as in the original screen.
5) Volume levels on the body must differ by brightness AND texture, not hue alone; "over max" must NOT be lime.
Explore different capsule shapes (weight-plate discs, chunky pills, plate-loaded bar), different body-figure stylisation (geometric blocks, contour lines, dot matrix), and different number typography.
```

P01 额外加一句：

```text
For the bottom navigation: outer pill outline = today progress 57% (solid line); selected small pill = rest countdown 1:35 with its own stroke that is clearly a different line style (dashed or with an end dot). Show both clearly.
```
