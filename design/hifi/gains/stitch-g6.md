# gains · Stitch 阶段 6b（视觉语言 v2）

> 由 `design/hifi/build_stitch_g6.py` 生成。每个变体单独一个 Stitch 项目，GEMINI_3_8_FLASH，MOBILE。

## g6-V1 · 克制

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time". Layout is fixed:
- Header: small caption 力量有没有在涨, title 增量 (left); a small decorative concentric weight-plate ornament at the top right (not tappable).
- Summary card: caption 近 4 周破纪录 with a very large condensed number 26 and small 次; below, four counters with condensed numbers, each with a direction glyph AND a word (not colour alone): 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线.
- A horizontally scrolling filter chip row: 全部 (selected, bone) · 下肢 · 背 · 胸 · 肩 · 手臂 (the last chip cut off by the right edge with a soft fade).
- Group 1 head: round icon with an up arrow — THIS ICON IS THE ONLY LIME (#D4FF3A) ELEMENT ON THE WHOLE SCREEN — title 该加重, caption 次数做满了，可以加一档, count 3 个 on the right.
  Rows (each: name left, a tiny sparkline in the middle with a filled last point and a diamond on PR points, latest estimate right, delta under it, and under the name a line 下次 + target in condensed numbers):
  上斜哑铃卧推 [PR tag] · 下次 27.5 kg × 6 · sparkline rising · 31.4 kg · ▲ +0.9 kg
  坐姿哑铃推举 [PR tag] · 下次 25 kg × 6 · 28.2 kg · = 持平
  杠铃深蹲 · 下次 85 kg × 6 · 100.3 kg · ▲ +5.9 kg
- Group 2 head: round grey icon with an equals sign, title 保持，次数 +1, caption 重量不变，每组多做 1 次, count 14 个. Rows: 杠铃坐姿提踵 [PR tag] · 下次 42.5 kg × 11 · 56.7 kg · = 持平; the next row is cut off by the navigation bar.
- The PR tag is a small solid bone-white chip with a star and the letters PR (NOT lime).
- Bottom: floating pill navigation bar with 5 items 首页 / 身体 / 增量 / 记录 / 我的; selected 增量 is a bone inner pill with icon + label; the outer pill outline is a thin closed progress ring.
- The list scrolls under the navigation bar; rows have no card backgrounds, only generous spacing and hairline dividers.

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## g6-V2 · 均衡

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time". Layout is fixed:
- Header: small caption 力量有没有在涨, title 增量 (left); a small decorative concentric weight-plate ornament at the top right (not tappable).
- Summary card: caption 近 4 周破纪录 with a very large condensed number 26 and small 次; below, four counters with condensed numbers, each with a direction glyph AND a word (not colour alone): 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线.
- A horizontally scrolling filter chip row: 全部 (selected, bone) · 下肢 · 背 · 胸 · 肩 · 手臂 (the last chip cut off by the right edge with a soft fade).
- Group 1 head: round icon with an up arrow — THIS ICON IS THE ONLY LIME (#D4FF3A) ELEMENT ON THE WHOLE SCREEN — title 该加重, caption 次数做满了，可以加一档, count 3 个 on the right.
  Rows (each: name left, a tiny sparkline in the middle with a filled last point and a diamond on PR points, latest estimate right, delta under it, and under the name a line 下次 + target in condensed numbers):
  上斜哑铃卧推 [PR tag] · 下次 27.5 kg × 6 · sparkline rising · 31.4 kg · ▲ +0.9 kg
  坐姿哑铃推举 [PR tag] · 下次 25 kg × 6 · 28.2 kg · = 持平
  杠铃深蹲 · 下次 85 kg × 6 · 100.3 kg · ▲ +5.9 kg
- Group 2 head: round grey icon with an equals sign, title 保持，次数 +1, caption 重量不变，每组多做 1 次, count 14 个. Rows: 杠铃坐姿提踵 [PR tag] · 下次 42.5 kg × 11 · 56.7 kg · = 持平; the next row is cut off by the navigation bar.
- The PR tag is a small solid bone-white chip with a star and the letters PR (NOT lime).
- Bottom: floating pill navigation bar with 5 items 首页 / 身体 / 增量 / 记录 / 我的; selected 增量 is a bone inner pill with icon + label; the outer pill outline is a thin closed progress ring.
- The list scrolls under the navigation bar; rows have no card backgrounds, only generous spacing and hairline dividers.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g6-V3 · 张力

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time". Layout is fixed:
- Header: small caption 力量有没有在涨, title 增量 (left); a small decorative concentric weight-plate ornament at the top right (not tappable).
- Summary card: caption 近 4 周破纪录 with a very large condensed number 26 and small 次; below, four counters with condensed numbers, each with a direction glyph AND a word (not colour alone): 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线.
- A horizontally scrolling filter chip row: 全部 (selected, bone) · 下肢 · 背 · 胸 · 肩 · 手臂 (the last chip cut off by the right edge with a soft fade).
- Group 1 head: round icon with an up arrow — THIS ICON IS THE ONLY LIME (#D4FF3A) ELEMENT ON THE WHOLE SCREEN — title 该加重, caption 次数做满了，可以加一档, count 3 个 on the right.
  Rows (each: name left, a tiny sparkline in the middle with a filled last point and a diamond on PR points, latest estimate right, delta under it, and under the name a line 下次 + target in condensed numbers):
  上斜哑铃卧推 [PR tag] · 下次 27.5 kg × 6 · sparkline rising · 31.4 kg · ▲ +0.9 kg
  坐姿哑铃推举 [PR tag] · 下次 25 kg × 6 · 28.2 kg · = 持平
  杠铃深蹲 · 下次 85 kg × 6 · 100.3 kg · ▲ +5.9 kg
- Group 2 head: round grey icon with an equals sign, title 保持，次数 +1, caption 重量不变，每组多做 1 次, count 14 个. Rows: 杠铃坐姿提踵 [PR tag] · 下次 42.5 kg × 11 · 56.7 kg · = 持平; the next row is cut off by the navigation bar.
- The PR tag is a small solid bone-white chip with a star and the letters PR (NOT lime).
- Bottom: floating pill navigation bar with 5 items 首页 / 身体 / 增量 / 记录 / 我的; selected 增量 is a bone inner pill with icon + label; the outer pill outline is a thin closed progress ring.
- The list scrolls under the navigation bar; rows have no card backgrounds, only generous spacing and hairline dividers.

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```
