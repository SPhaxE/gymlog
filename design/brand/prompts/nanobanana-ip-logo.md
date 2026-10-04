# 慢牛 Milo · IP 形象与 Logo 意向图提示词（Nano Banana 2）

> 2026-10-04 · 用途：用户用 Nano Banana 2 出**意向图**，挑感觉、定方向。出图只用来定方向，不当最终素材：定稿后按图标网格规范（`design/icon-grid/index.html`）重画成矢量。
> 范围见 `docs/brief-v1.4-draft.md` §5。

## 用法

- 每段提示词都是完整的，整段复制即可。IP 用**横版 16:9**（设定板），Logo 用**正方形 1:1**（展示板）。每段建议出 2–4 张。
- 出图里的错字、乱码、多出来的英文都不用管，只看造型、气质和配色。
- 出图放到 `design/brand/refs/`，文件名 `nb-<编号>-<序号>.png`（如 `nb-IP3-2.png`），或直接发到对话里。我会做成对比总览，按四项点评：**辨识度（16px 还认不认得出）/ 和现有视觉的契合 / 能不能长出等级与状态变体 / 商用感**。
- 方向之间可以混搭。例如「IP3 的造型 + IP1 的线条」，直接告诉我，我再出混合版的提示词。

## 共同设定（每段已内置，这里只供参考）

- **名字与故事**：慢牛 / Milo，Slogan「慢慢变牛」。古希腊力士米洛每天扛起一头刚出生的小牛，直到它长成公牛，这就是渐进超负荷。
  - IP 就是那头小牛，用户越练越强，它就跟着长大。
  - 成长阶段：牛犊 → 小牛 → 壮牛 → 公牛。
- **品牌色**（只有深色）：
  - 近黑底 `#0A0A0B`；
  - 唯一的强调色是荧光黄绿 `#D4FF3A`；
  - 骨白 `#E9E3D3`，加几级灰。
- **现有视觉语言**：
  - 2u 圆头断笔线稿，整体右倾 11°（I3 图标）；
  - Motion Trace，线条由暗到亮的渐变轨迹；
  - 热成像荧光质感；
  - 刻度与等宽读数。
- **禁忌**：写实的牛、奶牛花纹、斗牛 / 红布、股市 K 线与财经符号、肌肉夸张到恐怖、第二个强调色。

---

## A · IP 形象（6 个方向，感觉各不相同）

每个方向的设定板都是**同一种布局**：

- **上排**：4 个成长阶段，从左到右，同一角色越来越大、越来越壮。
- **下排**：小牛阶段的 5 个表情 / 状态：
  - 专注（在练）；
  - 开心；
  - 睡觉（恢复日）；
  - 庆祝（破纪录）；
  - 累但骄傲（减量周）。

### IP1 · 断笔线条小牛（与 I3 图标同源）

感觉：克制、设计感强、和现有 App 一个血统；最容易落进界面，最容易做成动画（线条由暗到亮画出来）。

```text
Character design sheet for the mascot of a Chinese strength-training app called "慢牛 Milo" (slogan: "slowly become strong"). Backstory: the ancient Greek strongman Milo of Croton carried a newborn calf every day until it grew into a bull — the idea of progressive overload. The mascot IS that calf, and it grows as the user gets stronger.
Style: minimalist monoline character drawn with a single uniform stroke weight, round caps and round joins, deliberately broken strokes with small gaps (the line stops and restarts, like a hand-drawn icon), the whole drawing slanted forward about 11 degrees for a sense of motion. Some strokes fade from transparent at the tail to solid at the head, like a motion trail. No fills, or at most one flat fill. Bone-white lines (#E9E3D3) on near-black (#0A0A0B); electric lime (#D4FF3A) used only for one small accent per figure (horn tips or a highlight line).
Layout: landscape 16:9 presentation sheet, near-black background. Top row: four growth stages left to right — newborn calf, young calf, sturdy young bull, full-grown bull — clearly the same character getting bigger and more muscular, built from the same few strokes. Bottom row: five poses of the young calf — focused (pushing hard), happy, sleeping curled up (rest day), celebrating with arms up and a burst of short lime lines (new personal record), tired but proud sitting down (deload week). Tiny plain sans-serif labels under each.
Must read clearly at icon size. No realistic cow anatomy, no cow spots, no red cape, no stock-market charts, no 3D shading, no gradient backgrounds, no extra text, no watermark.
```

### IP2 · 几何积木牛（iconref1 实心几何）

感觉：硬朗、符号化，像运动品牌的吉祥物标识；小尺寸最稳，也最容易和 Logo 合体。

```text
Character design sheet for the mascot of a Chinese strength-training app called "慢牛 Milo" (slogan: "slowly become strong"). Backstory: the strongman Milo of Croton carried a newborn calf every day until it became a bull — progressive overload. The mascot is that calf, growing as the user gets stronger.
Style: flat solid geometric character constructed only from basic shapes — circles, half-circles, triangles, rounded rectangles and crescents — like a modernist sports pictogram. Two-tone: bone white (#E9E3D3) shapes and mid grey shapes on near-black (#0A0A0B), with electric lime (#D4FF3A) reserved for the horns only. Crisp vector edges, generous negative space, no outlines, no gradients.
Layout: landscape 16:9 presentation sheet. Top row: four growth stages left to right — newborn calf, young calf, sturdy young bull, full-grown bull — same shape vocabulary, the shapes get larger and more angular as it grows, horns grow from tiny dots to strong crescents. Bottom row: five states of the young calf — focused, happy, sleeping (rest day), celebrating (new personal record, small geometric confetti), tired but proud (deload week) — expressed with minimal changes to eyes and posture. Tiny plain sans-serif labels.
Should work as a 24px app icon. No realistic cow, no cow spots, no red cape, no finance symbols, no 3D, no extra text, no watermark.
```

### IP3 · 潮玩软胶小牛（商用吉祥物感）

感觉：最有「商用 App 吉祥物」的亲和力和周边感，最适合奖励弹窗、商城、会员页；风险是和克制的深色界面有反差，需要控制出场位置。

```text
Character design sheet for the mascot of a Chinese strength-training app called "慢牛 Milo" (slogan: "slowly become strong"). The mascot is a bull calf that grows stronger as the user trains — inspired by the legend of Milo of Croton carrying a calf every day until it became a bull.
Style: premium designer-toy / vinyl figure look, soft matte surfaces, chunky proportions with a big head and small body when young, subtle studio lighting on a near-black (#0A0A0B) backdrop. Body in warm bone white (#E9E3D3) with charcoal details; electric lime (#D4FF3A) only on the horns and on a small sweatband. Friendly, determined expression — cute but not babyish; this is a gym character.
Layout: landscape 16:9 presentation sheet. Top row: four growth stages — newborn calf, young calf, sturdy young bull, full-grown bull — same character, proportions shift from chibi to athletic. Bottom row: five states of the young calf — focused lifting a tiny barbell, happy thumbs-up, sleeping on a rolled towel (rest day), celebrating with lime confetti (new personal record), sitting tired but proud with a water bottle (deload week). Small plain labels.
No realistic cow anatomy, no cow spots, no red cape, no stock charts, no extra text, no watermark, no busy background.
```

### IP4 · 带护具的健身房小牛（贴商城主线）

感觉：一眼就是「进阶训练者」，护具、补给可以自然成为它的装备，和商城、积分兑换天然衔接；风格是扁平插画。

```text
Character design sheet for the mascot of a Chinese strength-training app called "慢牛 Milo" (slogan: "slowly become strong"). The mascot is a bull calf that grows into a bull as the user progresses (legend of Milo of Croton).
Style: bold flat vector illustration with clean outlines, limited palette — near-black background (#0A0A0B), bone white (#E9E3D3) body, two greys, electric lime (#D4FF3A) as the single accent. The calf is a serious lifter: it wears training gear that changes with its growth stage — wrist wraps as a young calf, then a lifting belt, then knee sleeves, and the full-grown bull wears a weightlifting belt and chalk on its hooves. Gear is part of the identity, drawn simply.
Layout: landscape 16:9 presentation sheet. Top row: four growth stages with gear progression — newborn calf (no gear, tiny towel), young calf (wrist wraps), sturdy young bull (wraps + belt), full-grown bull (belt + knee sleeves). Bottom row: five states of the young calf — focused chalking up, happy, sleeping (rest day), celebrating a new personal record, tired but proud (deload week). Small plain labels.
No real brand logos on the gear, no realistic cow, no cow spots, no red cape, no finance symbols, no extra text, no watermark.
```

### IP5 · 复古运动俱乐部吉祥物

感觉：像美式大学球队或老派举重俱乐部的徽章吉祥物，故事感和「传承」感最强（米洛典故）；适合做徽章、等级勋章、周边。

```text
Character design sheet for the mascot of a Chinese strength-training app called "慢牛 Milo" (slogan: "slowly become strong"). The mascot is the calf from the legend of Milo of Croton — he carried it every day until it became a bull. The character should feel like a classic athletic-club mascot with a bit of ancient Greek heritage.
Style: retro athletic mascot illustration, confident thick strokes, limited screen-print palette — bone white (#E9E3D3), charcoal, near-black (#0A0A0B) and electric lime (#D4FF3A) as the single bright accent; subtle print grain. Small Greek-key border details are allowed, nothing else ornamental.
Layout: landscape 16:9 presentation sheet. Top row: four growth stages as circular badges — newborn calf, young calf, sturdy young bull, full-grown bull — each badge a level emblem, the bull getting stronger and the badge frame getting richer (plain ring → double ring → laurel → laurel with lime star). Bottom row: five expressions of the young calf in the same retro style — focused, happy, sleeping (rest day), celebrating (new personal record), tired but proud (deload week). Small plain labels.
No realistic cow, no cow spots, no red cape, no finance symbols, no extra text inside badges except tiny labels, no watermark.
```

### IP6 · 极简符号脸（能活在 16px 的表情角色）

感觉：几乎是一个符号，表情靠两三笔，能直接塞进胶囊、通知、Toast；最省事，商用感中等，胜在任何尺寸都能用。

```text
Character design sheet for a tiny symbol-like mascot of a Chinese strength-training app called "慢牛 Milo" (slogan: "slowly become strong"). The mascot is a bull calf reduced to an icon: a rounded head shape with two small horns, expressions made with two or three marks only. It grows as the user gets stronger (legend of Milo of Croton carrying a calf until it became a bull).
Style: ultra-minimal flat symbol, like an emoji set designed by a Swiss designer. Bone white (#E9E3D3) on near-black (#0A0A0B), horns in electric lime (#D4FF3A). Same stroke weight everywhere, round caps. Must stay readable at 16px.
Layout: landscape 16:9 presentation sheet. Top row: four growth stages — the head grows from a small circle with dot horns to a broad shield shape with strong curved horns. Bottom row: a grid of the young calf's expressions — focused, happy, sleeping with "z" (rest day), celebrating with sparkle lines (new personal record), tired but proud (deload week), plus the same five shown at real 16px and 24px size in a strip at the bottom. Tiny plain labels.
No body, no realistic features, no cow spots, no extra text, no watermark.
```

---

## B · Logo（6 个方向）

每个方向的展示板都是**同一种布局**（正方形 1:1，近黑底）：

- 左上：App 图标（圆角方形）；
- 右上：横排组合，图形 + 「慢牛 Milo」；
- 左下：单色反白版；
- 右下：16px / 24px / 48px 三档小样。

### LA · 升线成角（阶段 3 的 L3 精修）

一笔画：先平、再缓升、到顶回勾成牛角。讲「慢慢涨」和「牛」两件事。

```text
Logo design presentation board for a Chinese strength-training app called "慢牛 Milo" (slogan "slowly become strong"; the name means "slow bull" — a slow but steady bull market, and the strength of a bull).
Concept: a single continuous stroke that starts flat, rises slowly and steadily, and at the top hooks back sharply to form a bull's horn — progress that is slow but always rising. Uniform stroke weight, round caps, slanted forward about 11 degrees. The stroke may fade from transparent at the start to solid at the end like a motion trail.
Colors: near-black background (#0A0A0B), bone white (#E9E3D3) mark, electric lime (#D4FF3A) only at the horn tip.
Board layout, square 1:1: top-left the app icon (mark centered on a near-black rounded square), top-right the horizontal lockup of the mark with the wordmark "慢牛 Milo" in a clean geometric sans, bottom-left a one-color reversed version, bottom-right the mark at 16px, 24px and 48px.
No stock-market candlesticks, no arrows, no realistic bull, no red, no gradients other than the stroke fade, no mockup devices, no extra text, no watermark.
```

### LB · 杠铃片里的牛角

杠铃片（配重片）的圆环加中孔，用负形切出牛角。器械感最强，接上「配重片」这个视觉方向。

```text
Logo design presentation board for a Chinese strength-training app called "慢牛 Milo" ("slow bull"; slogan "slowly become strong").
Concept: a weight plate seen front-on — a thick ring with a center hole — where the negative space of the ring forms a pair of bull horns rising from the center hole. Bold, geometric, symmetrical but with a slight forward slant. Solid shapes, no outlines.
Colors: near-black background (#0A0A0B), bone white (#E9E3D3) plate, electric lime (#D4FF3A) only inside the center hole or on the horns.
Board layout, square 1:1: top-left the app icon on a near-black rounded square, top-right the horizontal lockup with the wordmark "慢牛 Milo" in a condensed athletic sans, bottom-left a one-color reversed version, bottom-right the mark at 16px, 24px and 48px.
No realistic bull, no red, no finance symbols, no 3D metal rendering, no mockup devices, no extra text, no watermark.
```

### LC · 字标优先（Milo 的 M 是牛角 / 升线）

不另做图形，字本身就是 Logo：「M」的两峰做成牛角，或右半笔做成缓升线。最商用、最好排版。

```text
Wordmark logo design presentation board for a Chinese strength-training app called "慢牛 Milo" (slogan "slowly become strong").
Concept: a custom wordmark "Milo" where the letter M is drawn so its two peaks become a pair of bull horns (or its last stroke rises gently like a slow upward line), paired with custom Chinese lettering "慢牛" that shares the same stroke logic. Condensed, confident, athletic letterforms, slightly slanted forward. The M alone also works as the app icon.
Colors: near-black background (#0A0A0B), bone white (#E9E3D3) letters, electric lime (#D4FF3A) only on the horn tips of the M.
Board layout, square 1:1: top-left the app icon (just the M on a near-black rounded square), top-right the full lockup "慢牛 Milo", bottom-left a one-color reversed version, bottom-right the M icon at 16px, 24px and 48px.
No illustration, no realistic bull, no red, no finance symbols, no mockup devices, no extra text, no watermark.
```

### LD · 递增条组成牛头（渐进超负荷）

几根由短到长的竖条（每次多一点）拼出牛头和角的剪影。最「讲道理」，直接讲渐进超负荷。

```text
Logo design presentation board for a Chinese strength-training app called "慢牛 Milo" ("slow bull"; the app tells users how much weight to add next — progressive overload).
Concept: a set of vertical rounded bars that grow a little taller one by one (each only slightly longer than the last), arranged so that together they form the silhouette of a bull's head with two horns. Clean, geometric, rhythmic. Uniform corner radius.
Colors: near-black background (#0A0A0B), bone white (#E9E3D3) bars, the last and tallest bar in electric lime (#D4FF3A).
Board layout, square 1:1: top-left the app icon on a near-black rounded square, top-right the horizontal lockup with wordmark "慢牛 Milo", bottom-left a one-color reversed version, bottom-right the mark at 16px, 24px and 48px.
No bar-chart axes, no arrows, no stock-market look, no realistic bull, no red, no mockup devices, no extra text, no watermark.
```

### LE · 负形牛头（几何极简）

正方形或盾形里，用一两处切口留出牛头和角的负形。安静、高级、可以做得很小。

```text
Logo design presentation board for a Chinese strength-training app called "慢牛 Milo" ("slow bull"; slogan "slowly become strong").
Concept: an ultra-minimal geometric mark — a solid rounded square (or soft shield) with one or two precise cuts whose negative space reveals a bull's head with horns. Swiss modernist, calm, premium. Works at 16px.
Colors: near-black background (#0A0A0B), bone white (#E9E3D3) solid shape, electric lime (#D4FF3A) as a tiny dot or sliver accent only.
Board layout, square 1:1: top-left the app icon on a near-black rounded square, top-right the horizontal lockup with wordmark "慢牛 Milo" in a neutral grotesque, bottom-left a one-color reversed version, bottom-right the mark at 16px, 24px and 48px.
No realistic bull, no outlines-only, no red, no finance symbols, no mockup devices, no extra text, no watermark.
```

### LF · IP 头像即 Logo（Logo 与 IP 合一）

Logo 直接用小牛的头（按选中的 IP 方向）。最省事、最有记忆点，Logo 的状态变体等于 IP 的表情。

```text
Logo design presentation board for a Chinese strength-training app called "慢牛 Milo" ("slow bull"; slogan "slowly become strong"). The app's mascot is a bull calf that grows stronger with the user (legend of Milo of Croton).
Concept: the logo IS the mascot's head — a simplified, front-facing bull calf head with two short horns and a determined look, reduced to bold flat shapes so it works as an app icon. Friendly but strong, slightly slanted forward.
Colors: near-black background (#0A0A0B), bone white (#E9E3D3) head, electric lime (#D4FF3A) horns.
Board layout, square 1:1: top-left the app icon on a near-black rounded square, top-right the horizontal lockup with wordmark "慢牛 Milo", bottom-left a one-color reversed version, bottom-right the head at 16px, 24px and 48px.
No realistic cow anatomy, no cow spots, no red, no finance symbols, no mockup devices, no extra text, no watermark.
```

---

## C · 定方向以后：状态 Logo 意向图（模板）

先选出一个 Logo 方向，把 `<LOGO>` 换成那个方向「Concept」一句的内容再出图。这一步只看「同一个标志能不能自然长出这些状态」；动效最终由代码实现，比如线条由暗到亮画出、弹簧动画。

```text
Animated-logo state sheet for the app "慢牛 Milo". The base logo: <LOGO>. Show the same logo in six states as six frames on a near-black (#0A0A0B) landscape 16:9 sheet, each with a tiny plain label: 1) idle; 2) loading — the stroke is half drawn, fading from transparent to solid along the line; 3) training in progress — the mark leans further forward with short speed lines; 4) new personal record — the horn tip glows electric lime (#D4FF3A) with a small burst; 5) rest day — the mark settles lower, softer, with a small "z"; 6) deload week — the mark slightly smaller, calm, a thin lime ring around it. Bone white (#E9E3D3) and lime only. Same geometry in every frame — states change pose, glow and accents, never the identity. No extra text, no watermark.
```
