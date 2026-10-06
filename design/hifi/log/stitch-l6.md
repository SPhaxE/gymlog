# log · Stitch 阶段 6c（记录页 P07 三种结构 + 详情 P08 + 删除确认）

> 由 `design/hifi/build_stitch_l6.py` 生成。

## l6-A · P07 点阵日历为主角

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 记录 tab (P07), the training history. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 记录 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen (use it for the PR chip of the most recent session only, or leave it out).
Content: small caption 过去每一次练了什么, title 记录. ATTENDANCE DOT CALENDAR: caption 近 3 个月练了 38 天; three months 8月 / 9月 / 10月 drawn as a dot matrix (one dot per day, columns = weeks, rows = Monday to Sunday): trained days are solid bone-white dots, rest days are tiny dim dots, today (10月6日) has a thin ring, future days are faint; clear month labels. Below it, the list grouped by week with a week header and a weekly total, newest first:
  Week header 本周 · 10月5日–10月11日 — totals 1 次 · 14 组 · 6,358 kg
    Row: 10月6日 周二 — 下肢 · 背 · 手臂 · 核心 — 6 个动作 · 14 组 · 52 分钟, with a bone-white PR chip with a star and the number 2 (2 PR)
  Week header 上周 · 9月28日–10月4日 — totals 4 次 · 62 组 · 18,320 kg
    Row: 10月3日 周六 — 胸 · 肩 — 7 个动作 · 18 组 · 61 分钟, PR 1
    Row: 10月1日 周四 — 下肢 — 5 个动作 · 15 组 · 58 分钟
    Row: 9月30日 周三 — 背 · 手臂 — 6 个动作 · 16 组 · 55 分钟, PR 1
Each session row is 64–72 px tall, fully tappable, no card-in-card, hairline dividers; a small chevron is optional. The list continues below (scrolls under the navigation bar).
STRUCTURE A: the dot calendar is the hero: a large dot matrix card spanning the full width (about 30% of the screen) right under the title, then the week-grouped list with sticky-looking week headers carrying the weekly totals as condensed numerals.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## l6-B · P07 小日历 + 周条

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 记录 tab (P07), the training history. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 记录 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen (use it for the PR chip of the most recent session only, or leave it out).
Content: small caption 过去每一次练了什么, title 记录. ATTENDANCE DOT CALENDAR: caption 近 3 个月练了 38 天; three months 8月 / 9月 / 10月 drawn as a dot matrix (one dot per day, columns = weeks, rows = Monday to Sunday): trained days are solid bone-white dots, rest days are tiny dim dots, today (10月6日) has a thin ring, future days are faint; clear month labels. Below it, the list grouped by week with a week header and a weekly total, newest first:
  Week header 本周 · 10月5日–10月11日 — totals 1 次 · 14 组 · 6,358 kg
    Row: 10月6日 周二 — 下肢 · 背 · 手臂 · 核心 — 6 个动作 · 14 组 · 52 分钟, with a bone-white PR chip with a star and the number 2 (2 PR)
  Week header 上周 · 9月28日–10月4日 — totals 4 次 · 62 组 · 18,320 kg
    Row: 10月3日 周六 — 胸 · 肩 — 7 个动作 · 18 组 · 61 分钟, PR 1
    Row: 10月1日 周四 — 下肢 — 5 个动作 · 15 组 · 58 分钟
    Row: 9月30日 周三 — 背 · 手臂 — 6 个动作 · 16 组 · 55 分钟, PR 1
Each session row is 64–72 px tall, fully tappable, no card-in-card, hairline dividers; a small chevron is optional. The list continues below (scrolls under the navigation bar).
STRUCTURE B: a compact calendar: three months side by side as a very small dot matrix strip (about 16% of the screen) with the sentence 近 3 个月练了 38 天 beside it; the list is the main body, each week header has a thin bar showing that week's total sets relative to the busiest week.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## l6-C · P07 票根账本

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 记录 tab (P07), the training history. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 记录 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen (use it for the PR chip of the most recent session only, or leave it out).
Content: small caption 过去每一次练了什么, title 记录. ATTENDANCE DOT CALENDAR: caption 近 3 个月练了 38 天; three months 8月 / 9月 / 10月 drawn as a dot matrix (one dot per day, columns = weeks, rows = Monday to Sunday): trained days are solid bone-white dots, rest days are tiny dim dots, today (10月6日) has a thin ring, future days are faint; clear month labels. Below it, the list grouped by week with a week header and a weekly total, newest first:
  Week header 本周 · 10月5日–10月11日 — totals 1 次 · 14 组 · 6,358 kg
    Row: 10月6日 周二 — 下肢 · 背 · 手臂 · 核心 — 6 个动作 · 14 组 · 52 分钟, with a bone-white PR chip with a star and the number 2 (2 PR)
  Week header 上周 · 9月28日–10月4日 — totals 4 次 · 62 组 · 18,320 kg
    Row: 10月3日 周六 — 胸 · 肩 — 7 个动作 · 18 组 · 61 分钟, PR 1
    Row: 10月1日 周四 — 下肢 — 5 个动作 · 15 组 · 58 分钟
    Row: 9月30日 周三 — 背 · 手臂 — 6 个动作 · 16 组 · 55 分钟, PR 1
Each session row is 64–72 px tall, fully tappable, no card-in-card, hairline dividers; a small chevron is optional. The list continues below (scrolls under the navigation bar).
STRUCTURE C: a ledger / ticket-stub style: each session row looks like a ticket stub with the date as a large condensed numeral on the left (10/6 with 周二 under it), the muscle groups and counts in the middle, PR chip on the right; week headers are full-width hairline bands with totals; the dot calendar is a thin one-line strip (one row of dots per week as columns) at the top.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## l6-D · P08 详情

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 训练详情 (P08), a sub-page of 记录 for ONE session. Task-flow sub-page: NO bottom navigation; top bar = back arrow + title 10月3日 周六 with caption 胸 · 肩 · 61 分钟 and an overflow menu (three dots) at the right whose menu contains a single destructive item 删除这次训练. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime element.
Content: summary strip with three stats: 7 个动作 · 18 组 · 总负荷 7,940 kg; a bone-white PR chip row 新纪录 1：上斜哑铃卧推 预估 1RM 31.4 kg ▲ +0.9 kg. Then one block per exercise, in order, each tappable to see that exercise's progress curve (small chevron), listing every set as a row:
  上斜哑铃卧推 [PR] — 第 1 组 26 kg × 8 次 · 第 2 组 26 kg × 8 次 · 第 3 组 26 kg × 7 次
  杠铃卧推 — 第 1 组 65 kg × 8 次 · 第 2 组 65 kg × 8 次 · 第 3 组 65 kg × 7 次
  坐姿哑铃推举 — 第 1 组 25 kg × 8 次 · 第 2 组 25 kg × 8 次
Warm-up sets are marked with a small tag 热身 and dimmed; a skipped exercise shows a dashed tag 未做.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## l6-E · 删除确认

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: a centered confirmation dialog over a dimmed 训练详情 page (P08). Dialog title 删除这次训练？, body text 10月3日 周六 · 胸 · 肩 · 18 组。删除后，近 7 天容量、恢复度、趋势和新纪录都会重新计算，不能撤销。 Two buttons: ghost 取消 and a danger button 删除 (danger = red outline / text, NOT lime). No navigation bar. Do not invent English. At most one accent element.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```
