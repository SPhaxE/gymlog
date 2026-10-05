# 慢牛 Milo · IP 高清重制提示词（Nano Banana 2，PNG）

> 2026-10-05 · 用户决定：IP 改用 PNG，以意向图 `docs/sources/brand-refs/ip2-geo-b-selected.jpg`（3_27AM）为准高清重制。
> 范围：**5 种牛龄 × 6 种状态 = 30 张**。牛犊、小牛、壮牛、公牛都是**单眼**（头三分之四侧转，远侧眼被脸挡住）；Milo 是**双眼且泛光**（正脸朝向观者，双眼与轮廓发荧光）。

## 用法

1. **每次出图都把参考图一起传上去**：`docs/sources/brand-refs/ip2-geo-b-selected.jpg`，并在提示词前加一句 `Use the attached image as the exact style and character reference.`（下面每段已写好）。
2. **按顺序出，先锁定角色再出状态**：
   - **第一步 · 总览（A）**：5 种牛龄平常状态排一排，挑一张最满意的当「定妆照」。
   - **第二步 · 每种牛龄一张状态板（B1–B5）**：上传参考图 + 第一步选中的定妆照，各出 6 个状态。
   - **第三步 · 单张资产（C，30 段）**：要正式进 App 的图逐张出，每张一个角色、一个状态。上传参考图 + 定妆照 + 该牛龄的状态板。
3. **背景**：A、B 用近黑 `#0A0A0B`，方便看效果；C 用纯品红 `#FF00FF` 当抠图底（调色板里没有品红，抠得干净）。出来后我负责抠图、对齐地面线、统一尺寸，导出 1x / 2x / 3x 的 PNG 和 WebP。
   - **Milo 的单张资产不画光**：泛光、轮廓光、四角星在品红底上抠不干净，所以 C 里的 Milo 是平涂的（双眼用最亮的白荧光色），光晕、扫光、星光由 App 叠加，还能动（`/brand` 里已经实现）。A、B 两步的 Milo 照常泛光，用来看整体效果。
4. **尺寸**：A、B 选 16:9 最高分辨率（4K）；C 选 1:1 最高分辨率（2048 × 2048 或以上），角色占画面宽度约 70%，脚踩在画面下方约 15% 处的同一条地面线上（Milo 同样）。
5. **命名与回收**：C 的文件名按表里的 `mascot-<牛龄>-<状态>.png`，放到 `docs/sources/brand-refs/hd/` 或直接发到对话里。我会逐张对照定妆照检查比例、颜色、眼睛数量和状态是否对。
6. 某一张不对，只重出那一张；同一牛龄的 6 张必须是同一只牛（角的大小、身体比例、颜色一致）。

## 设定速查

| 牛龄 | 英文 | 相对身高 | 角 | 眼（平常） | 身体 |
|---|---|---|---|---|---|
| 牛犊 | Newborn Calf | 45% | 荧光小芽 | 单眼 · 圆点 | 矮胖、大头、短直腿、无蹄无尾 |
| 小牛 | Young Calf | 62% | 荧光小新月 | 单眼 · 圆点 | 腿变长、背平、细尾、灰蹄 |
| 壮牛 | Sturdy Young Bull | 82% | 荧光中新月 | 单眼 · 斜切半月（坚定） | 肩峰隆起、方臀 |
| 公牛 | Full-grown Bull | 100% | 荧光大新月 | 单眼 · 斜切半月（浓眉） | 巨大肩峰、头低前伸 |
| Milo（米洛） | Milo | 105% | 大新月，全图最亮的荧光（2026-10-05 起，见 §D；原为骨白 + 荧光描边光） | **双眼 · 发光**（正脸） | 公牛体型、全身荧光色系、轮廓泛光、四角星 |

| 状态 | 英文 | 单眼牛龄的眼 | Milo 的眼 | 姿态与点缀 |
|---|---|---|---|---|
| 平常 | Idle | 该牛龄的平常眼 | 两只发光平常眼 | 四脚站稳、尾巴自然垂 |
| 专注 | Focused | 眯成更扁的斜切半月 | 两只更扁、更亮 | 前倾、前腿撑地、低头角朝前、身后 2–3 道短速度线 |
| 开心 | Happy | 闭眼笑弧（^） | 两道发光笑弧（^ ^） | 小跳、前蹄离地、抬头、尾巴翘起 |
| 恢复日 | Rest Day | 闭眼下弧 | 两道下弧、光变暗 | 同一只牛趴下：腿折在身下、头搁在前腿上、尾巴绕臀、两个小 z |
| 破纪录 | New PR | 黑色四角星（✦） | 两颗发光四角星 | 人立、一条前腿高抬、头抬起、碎纸屑（Milo 的屑是荧光色，光晕最亮） |
| 减量周 | Deload Week | 半闭眼（厚眼皮压住上半） | 两只半闭、光减半 | 重心后移、背微塌、头略低、尾巴低垂，累但骄傲 |

---

## A · 总览：5 种牛龄（平常）

```text
Use the attached image as the exact style and character reference.
Character lineup of the mascot of a Chinese strength-training app called "慢牛 Milo". The mascot is a calf that grows into a bull as the user gets stronger (progressive overload, inspired by Milo of Croton who carried a calf every day until it became a bull).

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

LAYOUT: one row of FIVE growth stages from left to right, all IDLE, all facing right, all standing on the same flat ground line, evenly spaced, increasing in size exactly by these heights: newborn calf 45%, young calf 62%, sturdy young bull 82%, full-grown bull 100%, Milo 105%. The first four stages have ONE visible eye each; the fifth, Milo, faces the viewer with TWO glowing eyes and is recolored in the lime palette with a soft neon glow (described below). It must be obvious that all five are the same character growing up.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette with a soft neon glow.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0 with a faint lime rim glow.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO glowing eyes, each a half-moon with a slanted straight top edge, glowing white-lime core with soft lime bloom — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MILO-ONLY RENDERING:
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: glowing white-lime core #F7FFD6.
- GLOW (the only non-flat element, and only on Milo): both eyes emit a soft lime bloom (#D4FF3A, radius about one eye-width, fading smoothly to transparent); the whole silhouette has a thin soft lime rim glow and a faint outer aura (#D4FF3A at low opacity), like neon light on a dark stage. Four or five small four-point sparkles (#EFFF9A) float near the horns and the back. The glow must stay subtle and clean — no lens flares, no light rays, no smoke, no glitter, no rainbow colors.

Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture, no frame.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

---

## B · 状态板：每种牛龄 6 个状态

布局都一样：3 列 × 2 行，第一行 平常 / 专注 / 开心，第二行 恢复日 / 破纪录 / 减量周；每格同一只牛、同样大小、同一条地面线。

### B1 · 牛犊（Newborn Calf）

```text
Use the attached images as the exact style and character reference (the first is the style reference, the second is the approved lineup — keep this stage identical to it).
Expression sheet of ONE character: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo". Six poses of the SAME character, identical proportions, horns and colors in every pose.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

LAYOUT: a 3 × 2 grid, evenly spaced, every figure the same size and standing on the same ground line within its row. Top row left to right: IDLE, FOCUSED, HAPPY. Bottom row left to right: REST DAY, NEW PR, DELOAD WEEK. No labels.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.
MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.
MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.
MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.
MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.
MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture, no frame.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### B2 · 小牛（Young Calf）

```text
Use the attached images as the exact style and character reference (the first is the style reference, the second is the approved lineup — keep this stage identical to it).
Expression sheet of ONE character: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo". Six poses of the SAME character, identical proportions, horns and colors in every pose.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

LAYOUT: a 3 × 2 grid, evenly spaced, every figure the same size and standing on the same ground line within its row. Top row left to right: IDLE, FOCUSED, HAPPY. Bottom row left to right: REST DAY, NEW PR, DELOAD WEEK. No labels.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.
MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.
MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.
MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.
MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.
MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture, no frame.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### B3 · 壮牛（Sturdy Young Bull）

```text
Use the attached images as the exact style and character reference (the first is the style reference, the second is the approved lineup — keep this stage identical to it).
Expression sheet of ONE character: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo". Six poses of the SAME character, identical proportions, horns and colors in every pose.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

LAYOUT: a 3 × 2 grid, evenly spaced, every figure the same size and standing on the same ground line within its row. Top row left to right: IDLE, FOCUSED, HAPPY. Bottom row left to right: REST DAY, NEW PR, DELOAD WEEK. No labels.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.
MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.
MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.
MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.
MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.
MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture, no frame.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### B4 · 公牛（Full-grown Bull）

```text
Use the attached images as the exact style and character reference (the first is the style reference, the second is the approved lineup — keep this stage identical to it).
Expression sheet of ONE character: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo". Six poses of the SAME character, identical proportions, horns and colors in every pose.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

LAYOUT: a 3 × 2 grid, evenly spaced, every figure the same size and standing on the same ground line within its row. Top row left to right: IDLE, FOCUSED, HAPPY. Bottom row left to right: REST DAY, NEW PR, DELOAD WEEK. No labels.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.
MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.
MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.
MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.
MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.
MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture, no frame.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### B5 · Milo（MILO (final form)）

```text
Use the attached images as the exact style and character reference (the first is the style reference, the second is the approved lineup — keep this stage identical to it).
Expression sheet of ONE character: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo". Six poses of the SAME character, identical proportions, horns and colors in every pose.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: glowing white-lime core #F7FFD6.
- GLOW (the only non-flat element, and only on Milo): both eyes emit a soft lime bloom (#D4FF3A, radius about one eye-width, fading smoothly to transparent); the whole silhouette has a thin soft lime rim glow and a faint outer aura (#D4FF3A at low opacity), like neon light on a dark stage. Four or five small four-point sparkles (#EFFF9A) float near the horns and the back. The glow must stay subtle and clean — no lens flares, no light rays, no smoke, no glitter, no rainbow colors.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette with a soft neon glow.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0 with a faint lime rim glow.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO glowing eyes, each a half-moon with a slanted straight top edge, glowing white-lime core with soft lime bloom — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

LAYOUT: a 3 × 2 grid, evenly spaced, every figure the same size and standing on the same ground line within its row. Top row left to right: IDLE, FOCUSED, HAPPY. Bottom row left to right: REST DAY, NEW PR, DELOAD WEEK. No labels.

MOOD — IDLE: standing calmly and proudly on all four legs, head facing the viewer, tail relaxed. Both eyes glowing as described (idle eyes). Sparkles floating gently near horns and back.
MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward, front legs braced, head lowered toward the viewer with horns pointing forward, tail straight out. Both eyes narrow into flatter, wider glowing half-moons with firm slanted top edges; the glow gets slightly brighter. Two or three short lime speed dashes behind the haunch.
MOOD — HAPPY (workout complete): a small joyful hop with front hooves just off the ground, head tilted up toward the viewer, tail flicked up high. Both eyes become closed smiling eyes — two thick glowing upward arches (^ ^). A few extra sparkles around the head.
MOOD — REST DAY (sleeping): Milo lying down, legs folded under the body as short rounded capsules along the ground, belly on the ground, head lowered and resting on the folded front legs but still facing the viewer, tail curled around the haunch. Both eyes closed as thin downward arcs with a dimmed, softer glow (like breathing light). Two small "z" letters in pale lime #EFFF9A float above the head (the only allowed letters). The rim glow is softer and dimmer than in the other moods.
MOOD — NEW PERSONAL RECORD (celebrating): Milo rears up proudly, chest lifted, one front leg raised high, head up facing the viewer, tail swishing high. Both eyes become glowing four-point sparkle stars (✦ ✦) with stronger bloom. A burst of flat confetti around the head — small triangles and dots in pale lime #EFFF9A, bone white #E9E2D0 and electric lime #D4FF3A — and the outer aura is at its brightest.
MOOD — DELOAD WEEK (tired but proud): Milo standing relaxed, weight shifted back, head lowered slightly but still facing the viewer, tail hanging low. Both eyes half-closed: glowing half-moons cut by heavy flat eyelid lines, drooping toward the outer corners; the glow is dimmed to about half — resting, proud, not sad. Fewer sparkles (two at most).

Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture, no frame.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

---

## C · 单张资产（30 段，进 App 用）

每段 = 共同设定 + 该牛龄 + 该状态，已拼好，整段复制即可。上传：参考图 + 定妆照 + 该牛龄的状态板。

| 文件名 | 牛龄 | 状态 |
|---|---|---|
| `mascot-newborn-idle.png` | 牛犊 | 平常 |
| `mascot-newborn-focused.png` | 牛犊 | 专注 |
| `mascot-newborn-happy.png` | 牛犊 | 开心 |
| `mascot-newborn-rest.png` | 牛犊 | 恢复日 |
| `mascot-newborn-pr.png` | 牛犊 | 破纪录 |
| `mascot-newborn-deload.png` | 牛犊 | 减量周 |
| `mascot-young-idle.png` | 小牛 | 平常 |
| `mascot-young-focused.png` | 小牛 | 专注 |
| `mascot-young-happy.png` | 小牛 | 开心 |
| `mascot-young-rest.png` | 小牛 | 恢复日 |
| `mascot-young-pr.png` | 小牛 | 破纪录 |
| `mascot-young-deload.png` | 小牛 | 减量周 |
| `mascot-sturdy-idle.png` | 壮牛 | 平常 |
| `mascot-sturdy-focused.png` | 壮牛 | 专注 |
| `mascot-sturdy-happy.png` | 壮牛 | 开心 |
| `mascot-sturdy-rest.png` | 壮牛 | 恢复日 |
| `mascot-sturdy-pr.png` | 壮牛 | 破纪录 |
| `mascot-sturdy-deload.png` | 壮牛 | 减量周 |
| `mascot-bull-idle.png` | 公牛 | 平常 |
| `mascot-bull-focused.png` | 公牛 | 专注 |
| `mascot-bull-happy.png` | 公牛 | 开心 |
| `mascot-bull-rest.png` | 公牛 | 恢复日 |
| `mascot-bull-pr.png` | 公牛 | 破纪录 |
| `mascot-bull-deload.png` | 公牛 | 减量周 |
| `mascot-milo-idle.png` | Milo | 平常 |
| `mascot-milo-focused.png` | Milo | 专注 |
| `mascot-milo-happy.png` | Milo | 开心 |
| `mascot-milo-rest.png` | Milo | 恢复日 |
| `mascot-milo-pr.png` | Milo | 破纪录 |
| `mascot-milo-deload.png` | Milo | 减量周 |

### C · 牛犊（Newborn Calf）

#### `mascot-newborn-idle.png` · 牛犊 · 平常

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Idle mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-newborn-focused.png` · 牛犊 · 专注

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Focused (training) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-newborn-happy.png` · 牛犊 · 开心

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Happy (workout complete) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-newborn-rest.png` · 牛犊 · 恢复日

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Rest Day (sleeping) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-newborn-pr.png` · 牛犊 · 破纪录

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo", in the New PR (celebrating) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-newborn-deload.png` · 牛犊 · 减量周

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Newborn Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Deload Week (tired but proud) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — NEWBORN CALF (smallest, about 45% of the full-grown bull's height):
- Tiny, low, chubby horizontal body like a soft loaf: a round bone-white haunch circle at the back, a short grey belly band in the middle, an oversized round bone-white head at the front (the head is about 45% of the body length).
- Horns: two tiny rounded electric-lime nubs (teardrop buds) on top of the head, barely sticking out.
- Face: a big wide rounded-rectangle muzzle in mid grey, one small leaf-shaped ear (light beige) lying back on the neck, a second tiny grey ear peeking out on the far side.
- Eye (idle): ONE simple round near-black dot, large relative to the head — innocent and curious.
- Legs: four short, straight, equally thick capsule legs with fully rounded bottoms (no separate hooves yet); far legs light beige, near legs bone white.
- No hump, no visible tail.

MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### C · 小牛（Young Calf）

#### `mascot-young-idle.png` · 小牛 · 平常

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Idle mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-young-focused.png` · 小牛 · 专注

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Focused (training) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-young-happy.png` · 小牛 · 开心

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Happy (workout complete) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-young-rest.png` · 小牛 · 恢复日

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Rest Day (sleeping) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-young-pr.png` · 小牛 · 破纪录

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo", in the New PR (celebrating) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-young-deload.png` · 小牛 · 减量周

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Young Calf stage of the mascot of the strength-training app "慢牛 Milo", in the Deload Week (tired but proud) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — YOUNG CALF (about 62% of the full-grown bull's height):
- Taller and leaner than the newborn, legs now longer than the body is deep; level back, no hump yet; grey torso, bone-white haunch block and bone-white near shoulder.
- Horns: small electric-lime crescents curving upward, clearly horns now.
- Head: rounded, held high on a short neck, three-quarter view; mid-grey muzzle with two dark nostrils; leaf ears sticking out sideways.
- Eye (idle): ONE round near-black dot, a little smaller than the newborn's — alert and curious.
- Legs: slim tapered capsules ending in small grey half-disc hooves.
- Tail: thin bone-white arc curling up behind the haunch, ending in a small grey teardrop tuft.

MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### C · 壮牛（Sturdy Young Bull）

#### `mascot-sturdy-idle.png` · 壮牛 · 平常

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Idle mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-sturdy-focused.png` · 壮牛 · 专注

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Focused (training) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-sturdy-happy.png` · 壮牛 · 开心

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Happy (workout complete) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-sturdy-rest.png` · 壮牛 · 恢复日

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Rest Day (sleeping) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-sturdy-pr.png` · 壮牛 · 破纪录

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo", in the New PR (celebrating) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-sturdy-deload.png` · 壮牛 · 减量周

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Sturdy Young Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Deload Week (tired but proud) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — STURDY YOUNG BULL (about 82% of the full-grown bull's height):
- Clearly muscular now: a grey shoulder hump begins to rise above the back line (the torso is a big shoulder circle joined to a smaller back circle); a square bone-white haunch block with rounded top-left corner; a bone-white near foreleg with a rounded top-right shoulder corner.
- Horns: medium electric-lime crescents curving up and slightly inward.
- Head: a rounded trapezoid, slightly lowered, three-quarter view; wide grey capsule muzzle with two dark nostrils; leaf ears sideways.
- Eye (idle): ONE determined eye — a dark half-moon with a straight slanted top edge (like a lowered eyebrow), not angry, just confident.
- Legs: strong tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### C · 公牛（Full-grown Bull）

#### `mascot-bull-idle.png` · 公牛 · 平常

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Idle mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — IDLE: standing calmly on all four legs, weight even, head at its natural height, tail hanging relaxed. Eye exactly as described for this stage (idle eye). No extra elements.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-bull-focused.png` · 公牛 · 专注

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Focused (training) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward with the weight on the front legs, front legs braced and slightly splayed, head lowered and pushed forward (horns pointing forward), tail straight out behind. The single eye narrows: the eye shape becomes a flatter, wider half-moon with a firmer slanted top edge — intense concentration. Two or three very short horizontal speed dashes in warm grey #928D87 behind the haunch. No sweat drops.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-bull-happy.png` · 公牛 · 开心

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Happy (workout complete) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — HAPPY (workout complete): a small joyful hop — front hooves just lifted off the ground, head tilted up, tail flicked up in a high curl. The single eye becomes a closed smiling eye: a thick near-black upward arch (∩ shape, like ^). Ears perked up. No other decoration.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-bull-rest.png` · 公牛 · 恢复日

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Rest Day (sleeping) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — REST DAY (sleeping): THE SAME CHARACTER of this stage, lying down — legs folded neatly under the body (folded legs shown as short rounded capsules along the ground), belly on the ground, body low and relaxed, back line soft; the head is lowered and resting on the folded front legs with the muzzle near the ground; tail curled around the haunch on the ground. The single eye is closed: a thin near-black downward arc (like a "u" turned into a gentle smile line). Two small "z" letters in warm grey #928D87 floating above the head, the second smaller and higher (these two z's are the only allowed letters). Keep the stage's proportions, horns and colors — do not turn it into a different animal or a generic blob.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-bull-pr.png` · 公牛 · 破纪录

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo", in the New PR (celebrating) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — NEW PERSONAL RECORD (celebrating): rearing up proudly — chest lifted, one front leg raised high and bent at the knee, head up, tail swishing high. The single eye becomes a near-black four-point sparkle star (✦). A small burst of flat confetti around the head: 6–8 small triangles and dots in bone white #E9E2D0 and warm grey #928D87, plus exactly two tiny confetti triangles in electric lime #D4FF3A. Horns unchanged.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-bull-deload.png` · 公牛 · 减量周

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the Full-grown Bull stage of the mascot of the strength-training app "慢牛 Milo", in the Deload Week (tired but proud) mood.

STYLE (match the attached reference image exactly — same character, same drawing language):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple shapes: circles, half-circles, crescents, and capsules (two circles joined by straight tangent lines). Torso = a large shoulder circle joined to a smaller back circle; head = a rounded trapezoid made of three circles; muzzle = a wide capsule; legs = tapered capsules (thick at the top, thin at the bottom); hooves = flat-bottomed half-discs; ears = pointed leaf shapes; tail = a thin arc ending in a teardrop tuft.
- Pure flat fills with perfectly crisp, smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO noise, NO grain, NO shading, NO drop shadows, NO ground shadow. Overlaps are shown only by layering flat shapes of different tones (far-side legs and far ear a slightly darker beige, near-side legs and haunch the lightest bone white).
- Palette (use only these): bone white #E9E2D0 (near haunch, near legs, face), light beige #C9C2B2 (far-side legs, far ear), warm mid grey #AAA59B (hooves, muzzle, near ear), warm grey #928D87 (torso / shoulder hump, tail tuft), near-black #1E1D1A (eyes, nostrils), electric lime #D4FF3A (horns only).
- Pose language: body in side profile facing RIGHT, standing on one flat invisible ground line; the head is turned three-quarters toward the viewer so the face reads clearly, but ONLY ONE EYE is visible (the far eye is hidden behind the curve of the face). Calm, sturdy, slightly stubborn personality — cute but not babyish, strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges with no jaggies, consistent proportions, generous empty space around the figure.

STAGE — FULL-GROWN BULL (the biggest, reference size 100%):
- Massive and powerful: a huge grey shoulder hump (a big circle) dominates the silhouette, sloping down in a straight tangent line to the back; square bone-white haunch block; thick bone-white near foreleg with a rounded top-right corner; deep chest.
- Horns: LARGE electric-lime crescents sweeping up and inward, thick at the base, sharp tips — the most striking element. The near horn ends in a round knob that overlaps the top corner of the face; the far horn tucks behind the face.
- Head: a broad flat-topped rounded trapezoid, carried low and forward in front of the hump, three-quarter view; very wide grey capsule muzzle with two dark nostrils; leaf ears sideways under the horns.
- Eye (idle): ONE fierce eye — a dark half-moon with a strongly slanted straight top edge (heavy brow), calm power.
- Legs: thick tapered capsules, grey half-disc hooves; tail thin arc with grey teardrop tuft.

MOOD — DELOAD WEEK (tired but proud): standing on all four legs but relaxed, weight shifted back, back line softly sagging, head lowered a little below its normal height, tail hanging low and still. The single eye is half-closed: a near-black half-moon whose upper part is cut off by a heavy flat eyelid line, slightly drooping toward the outer corner — tired, but the mouth area stays calm and content (proud, not sad). No sweat, no tears.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

### C · Milo（MILO (final form)）

#### `mascot-milo-idle.png` · Milo · 平常

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo", in the Idle mood.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: flat bright white-lime #F7FFD6.
- NO GLOW IN THIS ASSET: render Milo completely flat — no eye bloom, no rim glow, no aura, no sparkles. The eyes are crisp flat shapes in bright white-lime #F7FFD6 (the brightest color in the image). The glow, sparkles and light sweep are added later in the app as separate animated layers, so this image must have clean hard edges against the background.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO eyes, each a half-moon with a slanted straight top edge, flat bright white-lime #F7FFD6 — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MOOD — IDLE: standing calmly and proudly on all four legs, head facing the viewer, tail relaxed. Both eyes as described (idle eyes), flat bright white-lime.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-milo-focused.png` · Milo · 专注

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo", in the Focused (training) mood.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: flat bright white-lime #F7FFD6.
- NO GLOW IN THIS ASSET: render Milo completely flat — no eye bloom, no rim glow, no aura, no sparkles. The eyes are crisp flat shapes in bright white-lime #F7FFD6 (the brightest color in the image). The glow, sparkles and light sweep are added later in the app as separate animated layers, so this image must have clean hard edges against the background.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO eyes, each a half-moon with a slanted straight top edge, flat bright white-lime #F7FFD6 — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MOOD — FOCUSED (mid-workout, pushing hard): body leaning forward, front legs braced, head lowered toward the viewer with horns pointing forward, tail straight out. Both eyes narrow into flatter, wider half-moons with firm slanted top edges. Two or three short flat lime #D4FF3A speed dashes behind the haunch.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-milo-happy.png` · Milo · 开心

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo", in the Happy (workout complete) mood.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: flat bright white-lime #F7FFD6.
- NO GLOW IN THIS ASSET: render Milo completely flat — no eye bloom, no rim glow, no aura, no sparkles. The eyes are crisp flat shapes in bright white-lime #F7FFD6 (the brightest color in the image). The glow, sparkles and light sweep are added later in the app as separate animated layers, so this image must have clean hard edges against the background.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO eyes, each a half-moon with a slanted straight top edge, flat bright white-lime #F7FFD6 — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MOOD — HAPPY (workout complete): a small joyful hop with front hooves just off the ground, head tilted up toward the viewer, tail flicked up high. Both eyes become closed smiling eyes — two thick upward arches (^ ^) in bright white-lime.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-milo-rest.png` · Milo · 恢复日

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo", in the Rest Day (sleeping) mood.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: flat bright white-lime #F7FFD6.
- NO GLOW IN THIS ASSET: render Milo completely flat — no eye bloom, no rim glow, no aura, no sparkles. The eyes are crisp flat shapes in bright white-lime #F7FFD6 (the brightest color in the image). The glow, sparkles and light sweep are added later in the app as separate animated layers, so this image must have clean hard edges against the background.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO eyes, each a half-moon with a slanted straight top edge, flat bright white-lime #F7FFD6 — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MOOD — REST DAY (sleeping): Milo lying down, legs folded under the body as short rounded capsules along the ground, belly on the ground, head lowered and resting on the folded front legs but still facing the viewer, tail curled around the haunch. Both eyes closed as thin downward arcs in dark olive lime #5E7A10. Two small "z" letters in pale lime #EFFF9A float above the head (the only allowed letters).

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-milo-pr.png` · Milo · 破纪录

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo", in the New PR (celebrating) mood.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: flat bright white-lime #F7FFD6.
- NO GLOW IN THIS ASSET: render Milo completely flat — no eye bloom, no rim glow, no aura, no sparkles. The eyes are crisp flat shapes in bright white-lime #F7FFD6 (the brightest color in the image). The glow, sparkles and light sweep are added later in the app as separate animated layers, so this image must have clean hard edges against the background.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO eyes, each a half-moon with a slanted straight top edge, flat bright white-lime #F7FFD6 — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MOOD — NEW PERSONAL RECORD (celebrating): Milo rears up proudly, chest lifted, one front leg raised high, head up facing the viewer, tail swishing high. Both eyes become four-point sparkle stars (✦ ✦) in bright white-lime. A burst of flat confetti around the head — small triangles and dots in pale lime #EFFF9A, bone white #E9E2D0 and electric lime #D4FF3A.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

#### `mascot-milo-deload.png` · Milo · 减量周

```text
Use the attached images as the exact style and character reference (style reference, approved lineup, and this stage's expression sheet). Reproduce this exact character and pose as a single clean high-resolution asset.
Single character illustration: the MILO (final form) stage of the mascot of the strength-training app "慢牛 Milo", in the Deload Week (tired but proud) mood.

STYLE (same character and drawing language as the attached reference image; this is the final, highest-tier form called MILO):
- Flat solid geometric vector illustration built from simple shapes exactly like the reference: circles, half-circles, crescents and capsules joined by tangent lines (shoulder circle + back circle torso, three-circle rounded-trapezoid head, capsule muzzle, tapered capsule legs, half-disc hooves, leaf ears, thin arc tail with teardrop tuft). Crisp smooth edges, NO outlines, NO texture, NO grain, NO shading inside the shapes.
- Palette — the whole bull is recolored in the electric-lime family, layered by tone: pale lime #EFFF9A (near haunch, near legs, face), electric lime #D4FF3A (far-side legs, far ear, muzzle), deep lime #9FD11A (shoulder hump / torso, tail tuft), dark olive lime #5E7A10 (hooves, nostrils). Horns are the reverse: bone white #E9E2D0. Eyes: flat bright white-lime #F7FFD6.
- NO GLOW IN THIS ASSET: render Milo completely flat — no eye bloom, no rim glow, no aura, no sparkles. The eyes are crisp flat shapes in bright white-lime #F7FFD6 (the brightest color in the image). The glow, sparkles and light sweep are added later in the app as separate animated layers, so this image must have clean hard edges against the background.
- Pose language: body in side profile facing RIGHT on one flat invisible ground line, but the head is turned FULLY TO FACE THE VIEWER so BOTH EYES are visible — Milo looks straight at you. Proud, calm, powerful, heroic; strong but never scary.
- Rendering quality: ultra-clean, high resolution, vector-sharp edges, consistent proportions, generous empty space around the figure.

STAGE — MILO, THE FINAL FORM (same build as the full-grown bull, about 105% of its size, the most heroic silhouette):
- Same massive construction as the full-grown bull: huge shoulder-hump circle, square haunch block, thick forelegs with rounded top-right corners, deep chest, thin arc tail with teardrop tuft — but the entire body is in the electric-lime palette.
- Horns: LARGE crescents like the full-grown bull's, in bone white #E9E2D0.
- Head: broad flat-topped rounded trapezoid turned FULLY TOWARD THE VIEWER (frontal face), wide capsule muzzle with two dark-olive nostrils, leaf ears on both sides under the horns, symmetric.
- Eyes (idle): TWO eyes, each a half-moon with a slanted straight top edge, flat bright white-lime #F7FFD6 — calm, confident, superhuman.
- Legs: thick tapered capsules, dark-olive half-disc hooves.

MOOD — DELOAD WEEK (tired but proud): Milo standing relaxed, weight shifted back, head lowered slightly but still facing the viewer, tail hanging low. Both eyes half-closed: half-moons cut by heavy flat eyelid lines, drooping toward the outer corners, in a softer pale lime #EFFF9A instead of the brightest white-lime — resting, proud, not sad.

FRAMING: square 1:1, at least 2048 × 2048. Exactly one character, centered horizontally, occupying about 70% of the image width, feet (or folded legs / belly when lying down) resting on a flat ground line at about 85% of the image height. Nothing cropped — horns, tail and confetti fully inside the frame with comfortable margins.
BACKGROUND: perfectly flat solid pure magenta #FF00FF (chroma-key background for cutting out), completely uniform, no vignette, no gradient, no shadow, and NO magenta tint or spill on the character's edges.
AVOID: realistic cow anatomy, fur, cow spots, udders, red cape, bullfighting, stock-market charts or arrows, money symbols, 3D render, clay, plush, glossy highlights, outlines, sketch lines, extra limbs, extra horns, a second eye on non-Milo stages, any text, letters, numbers, labels, logos, watermark, signature, frame, border.
```

---

## 检查清单（出图后逐张对）

- **眼睛数量**：牛犊 / 小牛 / 壮牛 / 公牛只能看到一只眼；Milo 两只眼且发光。
- **同一只牛**：同一牛龄的 6 张，角的大小、身体比例、颜色完全一致；5 种牛龄放在一起是同一个角色在长大。
- **画法**：平涂、无描边、无渐变、无纹理、无阴影（Milo 的光是唯一例外）；边缘干净。
- **颜色**：只用设定里的色值；荧光只在角上（Milo 除外）；破纪录的荧光碎屑最多两片（Milo 除外）。
- **没有任何文字**（恢复日的两个 z 除外）。
- **单张资产**：品红底均匀、角色边缘没有品红溢色，地面线位置一致。

## D · Milo 重出（2026-10-05）：去辉光 + 角和眼改成最亮的荧光

为什么重出：原图 B5 的辉光贴着牛身，越靠近越亮，和牛身颜色几乎一样，BiRefNet 和颜色阈值都分不干净（破纪录那张两角之间留一团暗光）。
所以从源头把辉光去掉，光晕、扫光、四角星全由 App 代码生成。同时按用户 2026-10-05 的要求，**Milo 的角和眼改成画面里最亮的荧光**（原来是骨白角、白眼）。

用法：在 Nano Banana 里上传两张图，图 1 是 `docs/sources/mascot/B5.jpg`（要改的状态板），图 2 是 Milo 平常状态的单张参考（用户提供，同款角色）。16:9 最高分辨率。
出图存 `docs/B5-noglow.png`。

```
Edit image 1. It is a 3×2 character sheet of the same lime-green bull mascot "Milo" in six poses. Image 2 is a close-up reference of the same character (same body shapes and colors).

Keep EVERYTHING about the six bulls exactly the same: pose, silhouette, proportions, position on the canvas, size, flat body colors, shading shapes, ears, nose, tail, hooves. Do not redraw, restyle, move or resize anything. Keep the 3×2 layout and the text labels under each bull unchanged.

Change only these things:
1. HORNS: recolor both horns from bone-white to the brightest neon lime in the whole image, hex #EEFF6A — a pure, saturated, luminous fluorescent yellow-green, clearly lighter and more vivid than every lime body panel, but still lime (not white, not cream, not yellow). One flat fill, crisp hard edges, no gradient.
2. EYES: recolor the two eyes to the same brightest neon lime #EEFF6A (not white). Keep their exact shape for each pose (angry slants, closed arcs, four-point star eyes, half-closed lids). If they blend into the face, give each eye a very thin dark olive outline #3A4614 so the shape stays readable.
3. Remove the outer glow / bloom / halo around every bull completely. The outline must be a crisp, hard vector edge directly against the background: no light spilling outward, no rim light, no blur. The horns and eyes look bright because of their flat color only, not because of any glow.
4. Remove all sparkles, four-point stars, confetti, triangles, dots, speed lines and "z" letters around the bulls.

Background: one perfectly flat, uniform solid color, pure magenta #FF00FF, edge to edge, with no gradient, vignette, texture, noise, shadow or glow. No ground shadow.

Style: flat vector illustration with clean hard edges, like an SVG export. No glow effects anywhere.
```

要点：
- **角和眼 = `#EEFF6A`**：比牛身每一块荧光都更亮的纯荧光绿（App 色板：强调色 lime-500 `#D4FF3A`、亮荧光 lime-300 `#EFFF9A`）。出图太白就把色值往 `#E4FF2E` 调，太暗往 `#F2FF8C` 调。
- **眼睛**：荧光眼在荧光脸上可能糊在一起，所以允许加一圈极细的深橄榄描边（`#3A4614`）保住形状。
- **不要任何光效**：角和眼靠颜色本身亮，不靠辉光；辉光进 App 时由代码按全身加。
- **品红纯色底**：和荧光绿、橄榄色差得最远，边缘反解不串色。
