# 记录页（6c）· Nano Banana 参考提示词：情绪板 + 排版参考

> 2026-10-06。用途：你出**视觉与排版参考**，我和 Stitch 的 l6 五个方案（`stitch-l6.md`）放在一起对比，挑元素定稿。
> 画幅：竖屏、最接近 9:19.5（没有就 9:16）；每段出 2–4 张。界面里的错字、编造的英文标签不用管，只看构图、层级、质感、数字怎么摆。
> 出图放进 `design/hifi/log/refs/`（文件名 `nb-6c-<编号>.jpg`），推到分支 `claude/gallant-gauss-5ha5tr`，或直接发到对话里。
> 页面要放什么：**顶部出勤点阵日历**（近 3 个月，一天一个点）+ **按周分组的训练列表**（每周一条合计）+ 点进去的**训练详情**（每个动作每一组）+ **删除训练**（溢出菜单 → 二次确认）。

## M2 · 情绪板（质感与气质，不是界面）

```text
A moodboard collage, 4:5, for a premium dark strength-training app's TRAINING LOG page. Warm near-black background (#0A0A0B) with fine film grain. Arranged like a designer's board with generous negative space: (1) a macro photo of a machined steel barbell plate edge with engraved ruler ticks, lit from the side, mostly in shadow; (2) a close-up of a dot-matrix calendar / dot grid printed on dark paper — tiny dots in neat columns, some solid bone-white (trained days), most dim — like a perforated punch card or a Braille ledger; (3) a ticket stub or torn receipt strip on dark card with a large condensed date numeral and thin perforation line; (4) swatches: bone-white #E9E3D3, warm graphite #17171A, ONE tiny electric lime #D4FF3A swatch; (5) typography samples: tall condensed bold numerals (Barlow Condensed / Oswald feeling) next to clean humanist sans for Chinese text, week-total numerals like 14 组 · 6,358 kg; (6) a hairline ruler with week ticks. Mood: precise, ledger-like, quiet, expensive, like an engineer's training logbook. No people, no logos, no neon glow, no gradients except subtle shadow.
```

## L1 · 排版参考 · 点阵日历做主角

```text
Android phone screen, portrait, dark UI for a strength-training app. Page title 记录 with small caption 过去每一次练了什么. Directly under it a large ATTENDANCE DOT CALENDAR (about 30% of the screen): caption 近 3 个月练了 38 天; three months 8月 · 9月 · 10月 side by side as a dot matrix — one dot per day, columns are weeks, rows Monday to Sunday; trained days are solid bone-white dots, rest days tiny dim dots, today (10月6日) has a thin ring, future days faint; month labels in small caps-free Chinese. Under the calendar, the list grouped by week: a week header 本周 · 10月5日–10月11日 with totals in condensed numerals 1 次 · 14 组 · 6,358 kg; one session row: 10月6日 周二 / 下肢 · 背 · 手臂 · 核心 / 6 个动作 · 14 组 · 52 分钟 with a bone-white PR chip (star + 2); next week header 上周 · 9月28日–10月4日 4 次 · 62 組 18,320 kg and three rows (10月3日 周六 胸 · 肩 18 组 61 分钟 PR 1; 10月1日 周四 下肢 15 组 58 分钟; 9月30日 周三 背 · 手臂 16 组 55 分钟 PR 1). Rows are 64–72 px tall, hairline dividers, no cards inside cards. Bottom: floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 记录 selected as a bone inner pill. At most ONE lime element on the whole screen. Text exactly as given.
```

## L2 · 排版参考 · 小日历 + 周条

```text
Android phone screen, portrait, dark UI. Title 记录. A COMPACT calendar strip (about 16% of the screen): the three months as a very small dot matrix on the left and, beside it, the sentence 近 3 个月练了 38 天 in a medium weight with the number 38 in tall condensed numerals. Below, the training list is the main body, grouped by week; each week header has a thin horizontal bar showing that week's total sets relative to the busiest week (bone-white fill on a dark track) and the totals 4 次 · 62 组 · 18,320 kg in condensed numerals. Session rows: date 10月3日 周六, muscle groups 胸 · 肩, counts 7 个动作 · 18 组 · 61 分钟, PR chip. Same navigation and rules as before; one lime element at most.
```

## L3 · 排版参考 · 票根账本

```text
Android phone screen, portrait, dark UI, ledger / ticket-stub style. Title 记录. A thin one-line calendar at the top: each week is a column of 7 tiny dots, 13 columns for 3 months. Below, week headers as full-width hairline bands with totals (本周 · 1 次 · 14 组 · 6,358 kg). Each session row looks like a ticket stub: on the left a large condensed date numeral 10/6 with 周二 beneath it, then a thin perforation line (dotted vertical), then muscle groups 下肢 · 背 · 手臂 · 核心 and counts 6 个动作 · 14 组 · 52 分钟, and on the right a bone-white PR chip. Dark graphite stubs on near-black, no gradients, one lime element at most. Floating pill navigation with 记录 selected.
```

## D1 · 排版参考 · 训练详情（P08）

```text
Android phone screen, portrait, dark UI sub-page (no bottom navigation). Top bar: back arrow, title 10月3日 周六 with caption 胸 · 肩 · 61 分钟, and a three-dot overflow icon at the right. A three-stat strip in condensed numerals: 7 个动作 · 18 组 · 总负荷 7,940 kg. A bone-white PR line: 新纪录 1 · 上斜哑铃卧推 预估 1RM 31.4 kg ▲ +0.9 kg. Then one block per exercise (name, small PR chip where applicable, a small chevron meaning "see this exercise's progress curve") listing each set as a row: 第 1 组 26 kg × 8 次 / 第 2 组 26 kg × 8 次 / 第 3 组 26 kg × 7 次; second block 杠铃卧推 65 kg × 8 次, 8 次, 7 次; third block 坐姿哑铃推举 25 kg × 8 次 ×2. A warm-up set is dimmed with a small tag 热身; a skipped exercise has a dashed tag 未做. Hairline dividers, generous spacing, at most one lime element.
```

## D2 · 排版参考 · 溢出菜单 + 删除确认

```text
Two phone screens side by side, same dark UI. Left: the 训练详情 page with a small popup menu anchored under the top-right three-dot icon, containing one item 删除这次训练 with a trash glyph in a muted red (not lime). Right: a centered confirmation dialog over the dimmed page: title 删除这次训练？, body 10月3日 周六 · 胸 · 肩 · 18 组。删除后，近 7 天容量、恢复度、趋势和新纪录都会重新计算，不能撤销。 Two buttons: ghost 取消, danger 删除. Calm, serious, not alarming; no animations hinted, no illustrations.
```

## E1 · 排版参考 · 空态（还没有训练记录）

```text
Android phone screen, portrait, dark UI. Title 记录. The dot calendar is shown EMPTY: three months of tiny dim dots only, caption 近 3 个月还没练过. Below it, an empty state centered in the remaining space: a calm sleeping young bull (a cute simple mascot placeholder, line-art, bone-white on dark, no brand) lying down, headline 还没有训练记录, body 练完第一次，这里就会按周记下每一次。, and one primary button 去今日处方 (lime button is allowed here since it is the only accent). Floating pill navigation with 记录 selected.
```

## 用完告诉我

- 哪几张的**日历 / 周头 / 行**更对味（L1 / L2 / L3），喜欢的是点阵的疏密、周合计的数字、票根的形态、还是别的；
- 详情和删除确认有没有想要的样子（D1 / D2）；
- 我会把你的图和 Stitch l6 的五个方案放一起对比，按「一眼看结论、数字带单位、荧光唯一、命中区、拇指区」挑元素，取舍写进 `design/hifi/log/decision.md`。
