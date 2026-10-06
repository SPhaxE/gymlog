# me · Stitch 阶段 6d（「我的」P11 三种结构 + 牛龄页 P13 三种结构 + 编辑面板 + 清除确认）

> 由 `design/hifi/build_stitch_m6.py` 生成。

## p11-w1-v1 · P11 线框 W1 · V1

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 with value 6,060 牛劲 with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W1 (growth row on top): directly under the title a slim growth row: a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 48 px, the text 壮牛 · 2 级 with a thin progress bar at 62% under it and the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级, 连胜 9 周 on the right in condensed numerals, and a chevron (the whole row opens the growth page). Under it a 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups. 钱包 · 商城 value is 6,060 牛劲.

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## p11-w1-v2 · P11 线框 W1 · V2

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 with value 6,060 牛劲 with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W1 (growth row on top): directly under the title a slim growth row: a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 48 px, the text 壮牛 · 2 级 with a thin progress bar at 62% under it and the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级, 连胜 9 周 on the right in condensed numerals, and a chevron (the whole row opens the growth page). Under it a 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups. 钱包 · 商城 value is 6,060 牛劲.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## p11-w1-v3 · P11 线框 W1 · V3

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 with value 6,060 牛劲 with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W1 (growth row on top): directly under the title a slim growth row: a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 48 px, the text 壮牛 · 2 级 with a thin progress bar at 62% under it and the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级, 连胜 9 周 on the right in condensed numerals, and a chevron (the whole row opens the growth page). Under it a 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups. 钱包 · 商城 value is 6,060 牛劲.

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```

## p11-w2-v1 · P11 线框 W2 · V1

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 (no value) with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W2 (growth card is the hero): directly under the title one large dark card (the focal element of the screen): a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 56 px at the left, 壮牛 · 2 级 in a large heading, a progress bar at 62% (the bar fill is the single LIME element), the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; a hairline divider; then three stats in condensed numerals: 9 周 连胜, 2 / 4 次 本周, 6,060 牛劲; a chevron at the right (the whole card opens the growth page). Under the card a small caption 档案 and a 2×2 grid of SHORTER profile tiles (caption on top, condensed value below): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups; 钱包 · 商城 has NO value (the balance is already in the card).

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## p11-w2-v2 · P11 线框 W2 · V2

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 (no value) with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W2 (growth card is the hero): directly under the title one large dark card (the focal element of the screen): a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 56 px at the left, 壮牛 · 2 级 in a large heading, a progress bar at 62% (the bar fill is the single LIME element), the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; a hairline divider; then three stats in condensed numerals: 9 周 连胜, 2 / 4 次 本周, 6,060 牛劲; a chevron at the right (the whole card opens the growth page). Under the card a small caption 档案 and a 2×2 grid of SHORTER profile tiles (caption on top, condensed value below): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups; 钱包 · 商城 has NO value (the balance is already in the card).

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## p11-w2-v3 · P11 线框 W2 · V3

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 (no value) with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W2 (growth card is the hero): directly under the title one large dark card (the focal element of the screen): a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 56 px at the left, 壮牛 · 2 级 in a large heading, a progress bar at 62% (the bar fill is the single LIME element), the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; a hairline divider; then three stats in condensed numerals: 9 周 连胜, 2 / 4 次 本周, 6,060 牛劲; a chevron at the right (the whole card opens the growth page). Under the card a small caption 档案 and a 2×2 grid of SHORTER profile tiles (caption on top, condensed value below): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups; 钱包 · 商城 has NO value (the balance is already in the card).

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```

## p11-w3-v1 · P11 线框 W3 · V1

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 (no value) with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W3 (profile first, growth band): directly under the title the 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Under the grid a single growth band (one row, about 56 px): a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 36 px, 壮牛 · 2 级 with the caption 连胜 9 周 under it, and at the right 6,060 in condensed numerals with the caption 牛劲, then a chevron (the whole band opens the growth page). Then the groups; 钱包 · 商城 has NO value.

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## p11-w3-v2 · P11 线框 W3 · V2

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 (no value) with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W3 (profile first, growth band): directly under the title the 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Under the grid a single growth band (one row, about 56 px): a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 36 px, 壮牛 · 2 级 with the caption 连胜 9 周 under it, and at the right 6,060 in condensed numerals with the caption 牛劲, then a chevron (the whole band opens the growth page). Then the groups; 钱包 · 商城 has NO value.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## p11-w3-v3 · P11 线框 W3 · V3

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.
Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):
  Group 钱包与会员: 钱包 · 商城 (no value) with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.
  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.
  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.
  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.
The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen.
STRUCTURE W3 (profile first, growth band): directly under the title the 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Under the grid a single growth band (one row, about 56 px): a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 36 px, 壮牛 · 2 级 with the caption 连胜 9 周 under it, and at the right 6,060 in condensed numerals with the caption 牛劲, then a chevron (the whole band opens the growth page). Then the groups; 钱包 · 商城 has NO value.

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```

## p13-w1-v1 · P13 线框 W1 · V1

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W1 (the mascot is the hero, vertical narrative): a big stage block at the top: a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later), enlarged to about 160×120 px, the heading 壮牛 · 2 级, a progress bar at 62% (lime fill = the single lime element), the sentence and the alternative below it; then a 3-cell stat row (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡), then the label 最近 12 周 with the strip and legend, then the label 成长记录 with the log rows and the footnote.

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## p13-w1-v2 · P13 线框 W1 · V2

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W1 (the mascot is the hero, vertical narrative): a big stage block at the top: a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later), enlarged to about 160×120 px, the heading 壮牛 · 2 级, a progress bar at 62% (lime fill = the single lime element), the sentence and the alternative below it; then a 3-cell stat row (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡), then the label 最近 12 周 with the strip and legend, then the label 成长记录 with the log rows and the footnote.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## p13-w1-v3 · P13 线框 W1 · V3

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W1 (the mascot is the hero, vertical narrative): a big stage block at the top: a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later), enlarged to about 160×120 px, the heading 壮牛 · 2 级, a progress bar at 62% (lime fill = the single lime element), the sentence and the alternative below it; then a 3-cell stat row (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡), then the label 最近 12 周 with the strip and legend, then the label 成长记录 with the log rows and the footnote.

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```

## p13-w2-v1 · P13 线框 W2 · V1

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W2 (two tracks side by side): two equal cards next to each other at the top: LEFT = 牛龄 (long term): small a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 64 px, 壮牛 · 2 级, a progress bar at 62%, caption 牛龄 · 长期; RIGHT = 连胜 (short term): a very large condensed 9 with 周, caption 连胜 · 本周 2 / 4 次, four small dots (2 filled, 2 empty), caption 冻结卡 1 张. Under them a filled row with 下一级：再涨 3 kg 杠铃卧推的预估 1RM and the alternative; then 成长记录 with a small three-segment filter 全部 | 守约周 | 升级 (全部 selected, bone) and the log rows; the 12-week strip may sit above the log; the footnote at the end.

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## p13-w2-v2 · P13 线框 W2 · V2

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W2 (two tracks side by side): two equal cards next to each other at the top: LEFT = 牛龄 (long term): small a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 64 px, 壮牛 · 2 级, a progress bar at 62%, caption 牛龄 · 长期; RIGHT = 连胜 (short term): a very large condensed 9 with 周, caption 连胜 · 本周 2 / 4 次, four small dots (2 filled, 2 empty), caption 冻结卡 1 张. Under them a filled row with 下一级：再涨 3 kg 杠铃卧推的预估 1RM and the alternative; then 成长记录 with a small three-segment filter 全部 | 守约周 | 升级 (全部 selected, bone) and the log rows; the 12-week strip may sit above the log; the footnote at the end.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## p13-w2-v3 · P13 线框 W2 · V3

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W2 (two tracks side by side): two equal cards next to each other at the top: LEFT = 牛龄 (long term): small a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 64 px, 壮牛 · 2 级, a progress bar at 62%, caption 牛龄 · 长期; RIGHT = 连胜 (short term): a very large condensed 9 with 周, caption 连胜 · 本周 2 / 4 次, four small dots (2 filled, 2 empty), caption 冻结卡 1 张. Under them a filled row with 下一级：再涨 3 kg 杠铃卧推的预估 1RM and the alternative; then 成长记录 with a small three-segment filter 全部 | 守约周 | 升级 (全部 selected, bone) and the log rows; the 12-week strip may sit above the log; the footnote at the end.

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```

## p13-w3-v1 · P13 线框 W3 · V1

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W3 (stair roadmap): a thin streak strip at the top (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡); then a vertical STAIR of the 5 stages, top to bottom Milo, 公牛, 壮牛, 小牛, 牛犊, each stage a row with 3 small pips for its sub-levels: stages above the current one are dimmed and empty; the current row 壮牛 is taller, highlighted, shows the a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 48 px, the pips (2 filled, the 2nd one ringed as current) and the sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; stages below are completed (✓, all pips filled). Then 最近 12 周 strip with legend, then 成长记录 (two newest rows) and the footnote. The ringed current pip may be the single lime element.

INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument.
```

## p13-w3-v2 · P13 线框 W3 · V2

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W3 (stair roadmap): a thin streak strip at the top (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡); then a vertical STAIR of the 5 stages, top to bottom Milo, 公牛, 壮牛, 小牛, 牛犊, each stage a row with 3 small pips for its sub-levels: stages above the current one are dimmed and empty; the current row 壮牛 is taller, highlighted, shows the a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 48 px, the pips (2 filled, the 2nd one ringed as current) and the sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; stages below are completed (✓, all pips filled). Then 最近 12 周 strip with legend, then 成长记录 (two newest rows) and the footnote. The ringed current pip may be the single lime element.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## p13-w3-v3 · P13 线框 W3 · V3

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.
Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。
STRUCTURE W3 (stair roadmap): a thin streak strip at the top (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡); then a vertical STAIR of the 5 stages, top to bottom Milo, 公牛, 壮牛, 小牛, 牛犊, each stage a row with 3 small pips for its sub-levels: stages above the current one are dimmed and empty; the current row 壮牛 is taller, highlighted, shows the a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later) 48 px, the pips (2 filled, the 2nd one ringed as current) and the sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; stages below are completed (✓, all pips filled). Then 最近 12 周 strip with legend, then 成长记录 (two newest rows) and the footnote. The ringed current pip may be the single lime element.

INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers.
```

## sheet · 档案编辑面板（体型 + 体重）

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: a bottom sheet over a dimmed 我的 page: the profile editing sheet for 体型示意 and body weight. NO navigation bar visible (covered by the sheet). Sheet title 体型示意, a small close X at the right. Content: a two-segment control 男 | 女 (男 selected, bone) with the caption 只影响肌群图和动作示范的体型示意，不影响处方; below it a number field labelled 体重（可选） showing 72 with unit kg, a stepper −/+ at its right, and the helper line 不填也能用；填了，腰带知识卡和增量页的体重比才有依据; a full-width primary button 保存 at the bottom in the thumb zone (BONE button with black text, not lime). Every row at least 48 px. No invented English.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

## dlg · 清除全部数据确认

```text
Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for "Milo" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.

VISUAL LANGUAGE (fixed for all variants):
- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states (selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.
- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; Chinese text in Noto Sans SC.
- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.
- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress.

SCREEN: a centered confirmation dialog over a dimmed 我的 page. Dialog title 清除全部数据？, body text 档案、训练记录和进行中的训练都会删除，回到首次建档，不能撤销。 Two buttons: ghost 取消 and a danger button 清除 (danger = muted red outline / text, NOT lime). No navigation bar. Do not invent English. At most one accent element.

INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area.
```

