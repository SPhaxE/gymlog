# gains · Stitch 阶段 6b 第 2 轮（4 种结构）

> 由 `design/hifi/build_stitch_g7.py` 生成。

## g7-S1 · 分组列表

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time".
Content (same data in every variant, do not change numbers): caption 力量有没有在涨, title 增量; 近 4 周破纪录 26 次; counters 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线 (direction glyph + word); filter chips 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂; three groups 该加重 (3 个, caption 次数做满了，可以加一档), 保持，次数 +1 (14 个, caption 重量不变，每组多做 1 次), 该减重 (2 个, caption 有一组没做满，先退一档). Rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6, latest 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6, 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6, 100.3 kg ▲ +5.9 kg; 杠铃坐姿提踵 [PR] 下次 42.5 kg × 11, 56.7 kg = 持平. Each row also has a tiny sparkline (filled last point, diamond on PR points). The ONLY lime (#D4FF3A) element on the screen is the icon of the 该加重 group. PR tag = solid bone-white chip with star. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 is a bone inner pill, outer outline is a thin closed progress ring. Rows are NOT tappable yet (no chevrons).
STRUCTURE: three stacked groups, each with a head (round icon + title + caption + count) followed by flat rows separated by hairlines. Summary card on top, chips below it. This is the baseline.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g7-S2 · 下次目标做主角

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time".
Content (same data in every variant, do not change numbers): caption 力量有没有在涨, title 增量; 近 4 周破纪录 26 次; counters 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线 (direction glyph + word); filter chips 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂; three groups 该加重 (3 个, caption 次数做满了，可以加一档), 保持，次数 +1 (14 个, caption 重量不变，每组多做 1 次), 该减重 (2 个, caption 有一组没做满，先退一档). Rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6, latest 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6, 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6, 100.3 kg ▲ +5.9 kg; 杠铃坐姿提踵 [PR] 下次 42.5 kg × 11, 56.7 kg = 持平. Each row also has a tiny sparkline (filled last point, diamond on PR points). The ONLY lime (#D4FF3A) element on the screen is the icon of the 该加重 group. PR tag = solid bone-white chip with star. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 is a bone inner pill, outer outline is a thin closed progress ring. Rows are NOT tappable yet (no chevrons).
STRUCTURE: target-first. Each row is a compact card where the NEXT target (e.g. 27.5 kg × 6) is the largest condensed number on the left, the exercise name and PR tag above it, and on the right the sparkline with latest value and delta stacked. Group heads are slim section labels. Summary condensed into one thin strip of 4 counters under the title.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g7-S3 · 结论分段

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time".
Content (same data in every variant, do not change numbers): caption 力量有没有在涨, title 增量; 近 4 周破纪录 26 次; counters 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线 (direction glyph + word); filter chips 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂; three groups 该加重 (3 个, caption 次数做满了，可以加一档), 保持，次数 +1 (14 个, caption 重量不变，每组多做 1 次), 该减重 (2 个, caption 有一组没做满，先退一档). Rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6, latest 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6, 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6, 100.3 kg ▲ +5.9 kg; 杠铃坐姿提踵 [PR] 下次 42.5 kg × 11, 56.7 kg = 持平. Each row also has a tiny sparkline (filled last point, diamond on PR points). The ONLY lime (#D4FF3A) element on the screen is the icon of the 该加重 group. PR tag = solid bone-white chip with star. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 is a bone inner pill, outer outline is a thin closed progress ring. Rows are NOT tappable yet (no chevrons).
STRUCTURE: a 3-segment control directly under the chips: 该加重 3 · 保持 14 · 该减重 2 (the active segment 该加重 carries the lime icon); only the active group's rows are shown below as a single list, with its caption as a one-line explanation above the list. Summary is a horizontal row of 4 small stat blocks.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g7-S4 · 摘要带迷你图

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab (P09), answers "am I getting stronger, and how much should I add next time".
Content (same data in every variant, do not change numbers): caption 力量有没有在涨, title 增量; 近 4 周破纪录 26 次; counters 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线 (direction glyph + word); filter chips 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂; three groups 该加重 (3 个, caption 次数做满了，可以加一档), 保持，次数 +1 (14 个, caption 重量不变，每组多做 1 次), 该减重 (2 个, caption 有一组没做满，先退一档). Rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6, latest 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6, 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6, 100.3 kg ▲ +5.9 kg; 杠铃坐姿提踵 [PR] 下次 42.5 kg × 11, 56.7 kg = 持平. Each row also has a tiny sparkline (filled last point, diamond on PR points). The ONLY lime (#D4FF3A) element on the screen is the icon of the 该加重 group. PR tag = solid bone-white chip with star. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 is a bone inner pill, outer outline is a thin closed progress ring. Rows are NOT tappable yet (no chevrons).
STRUCTURE: the summary card contains a small 4-week bar strip (4 bars labelled 第1周…第4周 with PR counts 5 · 8 · 6 · 7) next to the big number 26 次; below it the 4 counters. Then chips, then groups as in a flat list with group heads. Row layout: name + 下次 line on the left, sparkline center, value + delta right.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```
