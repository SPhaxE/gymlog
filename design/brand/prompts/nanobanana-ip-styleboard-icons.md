# Nano Banana 提示词 · IP 风格板 + 找动作入口图标

> 2026-10-07 · 用户给了两张姿势剪影（`docs/sources/brand-refs/pose-male-back-double-biceps.svg`、`pose-female-back-lat-spread.svg`），要做「找动作」入口图标，并要一张**风格板**把 IP 的画法固定下来。
> 先出风格板（第一步），以后所有 IP 相关的图（小牛、米洛、图标、商城插画）都把它和原参考图一起上传。

## 用法

1. **上传参考图**（每段提示词前面已写好对应的话）：
   - 风格：`docs/sources/brand-refs/ip2-geo-b-selected.jpg`（小牛定稿的画法）；
   - 角色：`docs/sources/mascot/A.jpg`（五种牛龄定妆照）；
   - 人物：第一步出风格板时，再加米洛（Milo）定妆 `docs/sources/story/M1.jpg`；
   - 图标：第二步再加对应的姿势剪影 PNG（`pose-male-back-double-biceps.png` / `pose-female-back-lat-spread.png`，白底黑剪影）。
2. **顺序**：先出 **第一步 · 风格板**，挑一张满意的存为 `docs/sources/brand-refs/ip-styleboard.png` 发我；再出 **第二步 · 图标**（每个姿势出 2–3 张挑）。
3. **尺寸**：风格板 16:9 最高分辨率；图标 1:1 最高分辨率（≥ 2048），品红纯色底 `#FF00FF` 方便抠图。我负责抠图、对齐、导出 1x / 2x / 3x 和深色底预览，并在 24 / 32 / 48 px 下检查能不能认。
4. **哪里用**：找动作入口（首页处方末尾「＋ 加一个动作」、容量页肌头面板「找动作」）。男 / 女版本跟档案里的「体型示意」走，和人体图、动作示范同一个规则。

## 设定速查（和小牛、米洛完全同一套）

- 平涂几何，像现代体育图标：每个部位由圆、半圆、新月、胶囊（两个圆加切线）拼成；四肢是上粗下细的胶囊。
- 无描边、无渐变、无纹理、无阴影；前后层次只靠深浅不同的平涂色叠出来。
- 颜色只用这几种：

| 用途 | 颜色 |
|---|---|
| 近侧（皮肤 / 牛身亮面） | 骨白 `#E9E2D0` |
| 远侧（远侧手臂、腿） | 浅米 `#C9C2B2` |
| 次要块面（头发、短布、蹄） | 暖中灰 `#AAA59B` / 暖灰 `#928D87` |
| 眼睛、鼻孔 | 近黑 `#1E1D1A` |
| 唯一的重点（牛角、米洛的桂冠、图标里被选中的那块肌肉） | 荧光 `#D4FF3A` |

- **一张图只有一处荧光**。人物和牛的脸：侧身朝右、头转四分之三，只看得到一只眼（Milo 终形除外）。图标是**背面**，看不到脸。

---

## 第一步 · 风格板（固定 IP，16:9，深色底）

```text
Use the attached images as the exact style and character reference: the first image defines the drawing language, the second shows the bull mascot at five growth stages (and, if attached, the third shows the human character Milo of Croton drawn in the same language).

Create a STYLE BOARD (brand illustration style guide sheet) for the mascot system of the strength-training app "慢牛 Milo". Its purpose is to lock the drawing language so every future illustration matches. Same characters, same shapes, same colors as the references — do not restyle them.

STYLE (identical to the reference):
- Flat solid geometric vector illustration, like a modernist sports pictogram. Every body part is built from a few simple primitives: circles, half-circles, crescents and capsules (two circles joined by straight tangent lines); limbs are tapered capsules, thick at the top and thin at the bottom.
- Pure flat fills, perfectly crisp smooth edges. NO outlines, NO strokes, NO gradients, NO texture, NO shading, NO drop shadows. Depth only by layering flat shapes of different tones (far side darker, near side lighter).
- Palette, use ONLY: bone white #E9E2D0, light beige #C9C2B2, warm mid grey #AAA59B, warm grey #928D87, near-black #1E1D1A, electric lime #D4FF3A. Exactly one lime accent per character (bull: horns; Milo the wrestler: laurel wreath).

LAYOUT of the board (clean grid, generous spacing, everything aligned; no paragraphs of text — only the short labels listed below, in a plain sans-serif in warm grey):
1. TOP LEFT — "PALETTE": six large flat circular swatches in a row in the order above, each with its hex code under it.
2. TOP RIGHT — "SHAPES": the five primitives drawn flat in bone white: circle, half-circle, crescent, capsule, tapered capsule; next to them one "construction" example: the near foreleg of the full-grown bull exploded into its primitives (tapered capsule + half-disc hoof) and then assembled.
3. MIDDLE (largest area) — "CAST": the five bull growth stages (newborn calf, young calf, sturdy young bull, full-grown bull, and Milo the final form) standing on one shared ground line, facing right, idle, exactly as in the reference, single visible eye for the first four; to their right Milo of Croton the wrestler (only if he is in the references) standing proud, about 1.6 times the full-grown bull's height.
4. BOTTOM LEFT — "LAYERING": the sturdy young bull shown twice side by side: once normal, once with its far-side legs, far ear and torso tinted to make the three depth layers obvious (near = bone white, middle = warm grey, far = light beige).
5. BOTTOM MIDDLE — "PICTOGRAM SCALE": the full-grown bull head and a simple back-view flexing human pictogram (same language, bone white with ONE lime muscle) each shown at three sizes, large, medium and tiny (like 96, 48 and 24 px), to prove the shapes stay readable when small.
6. BOTTOM RIGHT — "DO / DON'T": two small tiles. DO: the newborn calf exactly in style. DON'T: the same calf with a black outline, a gradient and a drop shadow, crossed out with one thin warm-grey diagonal line.

Labels allowed (exact text, small, warm grey): PALETTE, SHAPES, CAST, LAYERING, PICTOGRAM SCALE, DO, DON'T, and the six hex codes. No other text, no logo, no watermark.
Wide landscape 16:9, 4K resolution.
BACKGROUND: perfectly flat solid near-black #0A0A0B, no vignette, no gradient, no texture.
AVOID: realistic anatomy, line art, sketch lines, outlines, gradients, glow, bloom, 3D, clay, plush, glossy highlights, photo textures, extra characters, a second visible eye on the first four bull stages, colors outside the palette.
```

---

## 第二步 · 找动作入口图标（1:1，品红底）

两张各出 2–3 张挑一张。**画的是人（背面），不是牛**，但要和小牛、米洛一眼看出是同一套画法。

### I1 · 男 · 背面双肱二头（`icon-finder-male.png`）

```text
Use the attached images as references: image 1 defines the exact drawing style (flat geometric bull mascot), image 2 is the IP style board, image 3 is a black silhouette that defines the exact POSE.

Draw ONE app icon illustration: a muscular man seen from BEHIND, in the exact pose of image 3 — the "back double biceps" bodybuilding pose: both upper arms raised out to the sides at shoulder height, forearms vertical, fists up by the head, elbows level, a very wide V-shaped back narrowing to the waist; framed from the head down to just below the hips, like the silhouette.

STYLE (identical to the mascot reference): flat solid geometric vector pictogram built from circles, half-circles, crescents and tapered capsules. Head = a simple rounded shape with short hair in warm mid grey #AAA59B (no face visible, seen from behind). Shoulders, arms and back = a few big bold shapes: the near-side (viewer's left) shapes bone white #E9E2D0, the far-side arm and the deltoid caps light beige #C9C2B2, a thin waistband / shorts in warm grey #928D87. The muscle masses are separated ONLY by layering flat tones and tiny gaps, never by lines.
LIME ACCENT: exactly one muscle group in electric lime #D4FF3A — BOTH latissimus dorsi wings of the back (the V shape under the shoulder blades), as if that muscle were "selected" in a muscle map. Everything else stays in the neutral palette.
ICON RULES: bold, simple, symmetrical; at most about 12 shapes in total; must stay readable at 24 px; no thin details (no fingers, no hair strands, no muscle striations).
COMPOSITION: square 1:1, highest resolution; the figure centered and filling about 80% of the width; nothing touching the edges.
BACKGROUND: one perfectly flat uniform solid magenta #FF00FF, edge to edge; no gradient, no shadow, no ground, no glow.
AVOID: realistic anatomy, line art, outlines, strokes, gradients, shading, glossy highlights, 3D, a face, skin tones outside the palette, gym equipment, text, logo, watermark, frame.
```

### I2 · 女 · 背面叉腰展背（`icon-finder-female.png`）

```text
Use the attached images as references: image 1 defines the exact drawing style (flat geometric bull mascot), image 2 is the IP style board, image 3 is a black silhouette that defines the exact POSE.

Draw ONE app icon illustration: an athletic, muscular woman seen from BEHIND, in the exact pose of image 3 — the "rear lat spread": hands on the hips, elbows pushed out wide to the sides, shoulders broad, the back flared into a wide V; long hair falling down the back to the shoulder blades; framed from the head down to the hips, like the silhouette.

STYLE (identical to the mascot reference): flat solid geometric vector pictogram built from circles, half-circles, crescents and tapered capsules. Long hair = one big rounded shape in warm mid grey #AAA59B covering the upper back center (no face visible). Shoulders and arms = bold shapes, the near-side (viewer's left) bone white #E9E2D0, the far side light beige #C9C2B2; a simple sports top band and waistband in warm grey #928D87. Muscle masses separated ONLY by layering flat tones and tiny gaps, never by lines.
LIME ACCENT: exactly one muscle group in electric lime #D4FF3A — the latissimus dorsi wings flaring out on both sides below the hair, as if that muscle were "selected" in a muscle map. Everything else stays in the neutral palette.
ICON RULES: bold, simple, symmetrical; at most about 12 shapes in total; must stay readable at 24 px; no thin details (no fingers, no individual hair strands, no muscle striations).
COMPOSITION: square 1:1, highest resolution; the figure centered and filling about 80% of the height; nothing touching the edges.
BACKGROUND: one perfectly flat uniform solid magenta #FF00FF, edge to edge; no gradient, no shadow, no ground, no glow.
AVOID: realistic anatomy, line art, outlines, strokes, gradients, shading, glossy highlights, 3D, a face, sexualised rendering, skin tones outside the palette, gym equipment, text, logo, watermark, frame.
```

## 检查清单（出图后我逐张对）

- [ ] 只用 6 个色，一处荧光（风格板里每个角色各一处）；
- [ ] 无描边、无渐变、无阴影、无发光；
- [ ] 图标：背面、看不到脸；姿势和剪影一致；24 px 下还能认出「背面展肌肉的人」和荧光那块；
- [ ] 风格板：小牛五种牛龄和定妆照是同一只（角大小、比例、单眼）；
- [ ] 品红底纯色、边缘干净。
