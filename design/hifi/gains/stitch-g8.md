# gains · Stitch 阶段 6b 返工（页头 + 摘要首屏 4 种结构）

> 由 `design/hifi/build_stitch_g8.py` 生成。

## g8-A · 配重片背景 + 一句话

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab, answers "am I getting stronger, and how much should I add next time". The page scrolls as ONE piece: the header hero scrolls away with the list (NOT pinned); only the filter chip row sticks under the status bar when scrolled. Draw the screen at scroll position 0.
Every number must carry its unit or noun; no unexplained digits, no invented English labels.
Facts to show (do not change numbers): 15 exercises trained in the last 4 weeks: 4 rising, 8 flat, 2 falling, 1 with only a baseline record (4+8+2+1 = 15); the full list below has 19 exercises in total. 26 personal records (PR) broken in the last 4 weeks. Status line: 无需减量. Filter chips: 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂 · 核心. Below the hero, group 该加重 (3 个动作) with rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6 · 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6 · 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6 · 100.3 kg ▲ +5.9 kg. Each row has a small sparkline in a FIXED-width column: all sparklines start at the same x and share the same vertical band so they line up down the list, vertically centred on the row. The values column is fixed width, right aligned. Then the start of group 保持，次数 +1 (14 个动作). The ONLY lime (#D4FF3A) element on the whole screen is the 该加重 group head. PR chip = solid bone-white with star. Bottom: floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 bone.
HERO: a very low-contrast large concentric weight-plate groove texture (machined rings, ruler ticks around the rim) filling the top ~38% of the screen as the page's hero background, cut by the screen edge. Over it, left aligned: caption 力量有没有在涨, title 增量, then ONE readable sentence in two lines: 近 4 周练了 15 个动作 / 4 个在涨 · 8 个持平 · 2 个在退 · 1 个刚开始记. Then a row: very large condensed number 26 with the words 次破纪录 and caption 近 4 周. No cards.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g8-B · 刻度尺三段

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab, answers "am I getting stronger, and how much should I add next time". The page scrolls as ONE piece: the header hero scrolls away with the list (NOT pinned); only the filter chip row sticks under the status bar when scrolled. Draw the screen at scroll position 0.
Every number must carry its unit or noun; no unexplained digits, no invented English labels.
Facts to show (do not change numbers): 15 exercises trained in the last 4 weeks: 4 rising, 8 flat, 2 falling, 1 with only a baseline record (4+8+2+1 = 15); the full list below has 19 exercises in total. 26 personal records (PR) broken in the last 4 weeks. Status line: 无需减量. Filter chips: 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂 · 核心. Below the hero, group 该加重 (3 个动作) with rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6 · 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6 · 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6 · 100.3 kg ▲ +5.9 kg. Each row has a small sparkline in a FIXED-width column: all sparklines start at the same x and share the same vertical band so they line up down the list, vertically centred on the row. The values column is fixed width, right aligned. Then the start of group 保持，次数 +1 (14 个动作). The ONLY lime (#D4FF3A) element on the whole screen is the 该加重 group head. PR chip = solid bone-white with star. Bottom: floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 bone.
HERO: no card. Title 增量 with caption. Below it a long horizontal tick ruler (fine ticks like a measuring tape) divided into three labelled segments proportional to 4 : 8 : 2 : 1, labelled directly on the ruler 4 个在涨 ▲, 8 个持平 =, 2 个在退 ▼, 1 个刚开始记 (a tiny dashed segment) (words and shapes, not colour alone; the rising segment is bone-white solid, flat is mid grey, falling is dark with hatch). Under the ruler, left: condensed number 26 次破纪录 近 4 周; right: small text 无需减量.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g8-C · 压缩大数字 + 色带

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab, answers "am I getting stronger, and how much should I add next time". The page scrolls as ONE piece: the header hero scrolls away with the list (NOT pinned); only the filter chip row sticks under the status bar when scrolled. Draw the screen at scroll position 0.
Every number must carry its unit or noun; no unexplained digits, no invented English labels.
Facts to show (do not change numbers): 15 exercises trained in the last 4 weeks: 4 rising, 8 flat, 2 falling, 1 with only a baseline record (4+8+2+1 = 15); the full list below has 19 exercises in total. 26 personal records (PR) broken in the last 4 weeks. Status line: 无需减量. Filter chips: 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂 · 核心. Below the hero, group 该加重 (3 个动作) with rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6 · 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6 · 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6 · 100.3 kg ▲ +5.9 kg. Each row has a small sparkline in a FIXED-width column: all sparklines start at the same x and share the same vertical band so they line up down the list, vertically centred on the row. The values column is fixed width, right aligned. Then the start of group 保持，次数 +1 (14 个动作). The ONLY lime (#D4FF3A) element on the whole screen is the 该加重 group head. PR chip = solid bone-white with star. Bottom: floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 bone.
HERO: an editorial layout. Title 增量 at left; at right, a huge condensed bone-white number 26 cropped slightly by the right edge with the label 次破纪录 beside it and caption 近 4 周. Under it one line: 近 4 周练了 15 个动作：4 个在涨 · 8 个持平 · 2 个在退 · 1 个刚开始记, each with its ▲ = ▼ glyph. Group heads below are full-width colour bands: 该加重 is a lime band with black text and an up arrow; 保持，次数 +1 is a grey band; 该减重 a dark grey band. No weight-plate texture.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g8-D · 环形分三段

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 增量 tab, answers "am I getting stronger, and how much should I add next time". The page scrolls as ONE piece: the header hero scrolls away with the list (NOT pinned); only the filter chip row sticks under the status bar when scrolled. Draw the screen at scroll position 0.
Every number must carry its unit or noun; no unexplained digits, no invented English labels.
Facts to show (do not change numbers): 15 exercises trained in the last 4 weeks: 4 rising, 8 flat, 2 falling, 1 with only a baseline record (4+8+2+1 = 15); the full list below has 19 exercises in total. 26 personal records (PR) broken in the last 4 weeks. Status line: 无需减量. Filter chips: 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂 · 核心. Below the hero, group 该加重 (3 个动作) with rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6 · 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6 · 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6 · 100.3 kg ▲ +5.9 kg. Each row has a small sparkline in a FIXED-width column: all sparklines start at the same x and share the same vertical band so they line up down the list, vertically centred on the row. The values column is fixed width, right aligned. Then the start of group 保持，次数 +1 (14 个动作). The ONLY lime (#D4FF3A) element on the whole screen is the 该加重 group head. PR chip = solid bone-white with star. Bottom: floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 bone.
HERO: a large ring (donut) at the left of the hero, split into four arc segments proportional to 4 : 8 : 2 : 1 (rising bone-white, flat mid grey, falling hatched dark, baseline dashed outline), thin tick marks around the outside, in the centre the condensed number 15 with the words 个动作 近 4 周. At the right of the ring a legend with four lines: ▲ 4 个在涨 / = 8 个持平 / ▼ 2 个在退 / 1 个刚开始记; under the legend 26 次破纪录 近 4 周. Title 增量 and caption above. A very faint plate texture behind the ring.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```
