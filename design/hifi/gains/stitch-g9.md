# gains · Stitch 阶段 6b 第 3 次交付（动作进步曲线页 P10，3 种结构）

> 由 `design/hifi/build_stitch_g9.py` 生成。

## g9-A · 曲线为主

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 动作进步曲线 (P10), a sub-page of the 增量 tab for ONE exercise: 上斜哑铃卧推 (chest). Task-flow sub-page: NO bottom navigation bar; top bar = back arrow + exercise name 上斜哑铃卧推 with caption 胸 · 共 8 次记录.
Every number carries its unit or noun; no invented English labels; do not change numbers.
Facts: latest estimated 1RM 31.4 kg, change vs previous session ▲ +0.9 kg (word + shape, not colour only). 8 sessions from 8/16 to 10/3, estimated 1RM rising 27.8 → 28.4 → 29.0 → 29.1 → 30.0 → 30.5 → 30.5 → 31.4 kg; sessions on 9/4, 9/18 and 10/3 broke a personal record (PR) and are drawn as DIAMONDS, other points as dots. The selected point is the latest one (10/3) with a halo and a vertical cursor line. Selected-day detail: 10月3日 · PR · 预估 1RM 31.4 kg, three sets listed as rows: 第 1 组 26 kg × 8 次, 第 2 组 26 kg × 8 次, 第 3 组 26 kg × 7 次. Next target block: 下次 27.5 kg × 6 次, with one sentence 次数做满了，可以加一档 (the engine's reason; the same number as on the home screen prescription and the 增量 list). Recent sessions table (last 8, newest first), each row 48 px tall and tappable to select that day: date · best set · estimated 1RM, e.g. 10/3 26 kg × 8 → 31.4 kg [PR]; 9/26 25 kg × 8 → 30.5 kg; 9/18 25 kg × 8 → 30.5 kg [PR]. The curve is a smooth line with a very faint fill below; time runs left to right with first and last date under the axis; value ticks on the right. At most ONE lime (#D4FF3A) element on the whole screen. PR chip = solid bone-white. Rows have no card-in-card nesting.
STRUCTURE: the chart is the hero: right under the top bar a huge condensed bone-white number 31.4 kg with the label 预估 1RM and the ▲ +0.9 kg delta beside it; the curve fills the next ~38% of the screen (full bleed to the gutters). Below the curve the selected-day detail (date, PR chip, three set rows). Then the next-target block, then the recent sessions table. A very faint concentric weight-plate groove texture behind the number.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g9-B · 下次目标为主

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 动作进步曲线 (P10), a sub-page of the 增量 tab for ONE exercise: 上斜哑铃卧推 (chest). Task-flow sub-page: NO bottom navigation bar; top bar = back arrow + exercise name 上斜哑铃卧推 with caption 胸 · 共 8 次记录.
Every number carries its unit or noun; no invented English labels; do not change numbers.
Facts: latest estimated 1RM 31.4 kg, change vs previous session ▲ +0.9 kg (word + shape, not colour only). 8 sessions from 8/16 to 10/3, estimated 1RM rising 27.8 → 28.4 → 29.0 → 29.1 → 30.0 → 30.5 → 30.5 → 31.4 kg; sessions on 9/4, 9/18 and 10/3 broke a personal record (PR) and are drawn as DIAMONDS, other points as dots. The selected point is the latest one (10/3) with a halo and a vertical cursor line. Selected-day detail: 10月3日 · PR · 预估 1RM 31.4 kg, three sets listed as rows: 第 1 组 26 kg × 8 次, 第 2 组 26 kg × 8 次, 第 3 组 26 kg × 7 次. Next target block: 下次 27.5 kg × 6 次, with one sentence 次数做满了，可以加一档 (the engine's reason; the same number as on the home screen prescription and the 增量 list). Recent sessions table (last 8, newest first), each row 48 px tall and tappable to select that day: date · best set · estimated 1RM, e.g. 10/3 26 kg × 8 → 31.4 kg [PR]; 9/26 25 kg × 8 → 30.5 kg; 9/18 25 kg × 8 → 30.5 kg [PR]. The curve is a smooth line with a very faint fill below; time runs left to right with first and last date under the axis; value ticks on the right. At most ONE lime (#D4FF3A) element on the whole screen. PR chip = solid bone-white. Rows have no card-in-card nesting.
STRUCTURE: answer first: at the top, a large block 下次 27.5 kg × 6 次 in huge condensed numerals with its one-sentence reason and a small caption 和首页处方是同一个数; under it a compact curve (~28% of the screen) with latest value 31.4 kg ▲ +0.9 kg as a small readout above the curve; then the selected-day detail; then the recent sessions table. The next-target block carries the single lime accent as a thin lime rule on its left edge.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## g9-C · 时间轴明细

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 动作进步曲线 (P10), a sub-page of the 增量 tab for ONE exercise: 上斜哑铃卧推 (chest). Task-flow sub-page: NO bottom navigation bar; top bar = back arrow + exercise name 上斜哑铃卧推 with caption 胸 · 共 8 次记录.
Every number carries its unit or noun; no invented English labels; do not change numbers.
Facts: latest estimated 1RM 31.4 kg, change vs previous session ▲ +0.9 kg (word + shape, not colour only). 8 sessions from 8/16 to 10/3, estimated 1RM rising 27.8 → 28.4 → 29.0 → 29.1 → 30.0 → 30.5 → 30.5 → 31.4 kg; sessions on 9/4, 9/18 and 10/3 broke a personal record (PR) and are drawn as DIAMONDS, other points as dots. The selected point is the latest one (10/3) with a halo and a vertical cursor line. Selected-day detail: 10月3日 · PR · 预估 1RM 31.4 kg, three sets listed as rows: 第 1 组 26 kg × 8 次, 第 2 组 26 kg × 8 次, 第 3 组 26 kg × 7 次. Next target block: 下次 27.5 kg × 6 次, with one sentence 次数做满了，可以加一档 (the engine's reason; the same number as on the home screen prescription and the 增量 list). Recent sessions table (last 8, newest first), each row 48 px tall and tappable to select that day: date · best set · estimated 1RM, e.g. 10/3 26 kg × 8 → 31.4 kg [PR]; 9/26 25 kg × 8 → 30.5 kg; 9/18 25 kg × 8 → 30.5 kg [PR]. The curve is a smooth line with a very faint fill below; time runs left to right with first and last date under the axis; value ticks on the right. At most ONE lime (#D4FF3A) element on the whole screen. PR chip = solid bone-white. Rows have no card-in-card nesting.
STRUCTURE: a compact curve (~25% of the screen) under a medium readout 31.4 kg ▲ +0.9 kg; then a vertical timeline of the 8 sessions (newest first) as the main body: a thin vertical rule on the left with a diamond or dot per session aligned to the curve's markers, each entry shows the date, PR chip when applicable, best set and estimated 1RM; the selected entry (10/3) is expanded to show its three sets, others collapsed to one line. The next-target block is pinned at the bottom as a solid bar: 下次 27.5 kg × 6 次.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```
