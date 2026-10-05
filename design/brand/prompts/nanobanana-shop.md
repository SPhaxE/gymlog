# Nano Banana 提示词 · 商城实物（护具 / 补给）

> 2026-10-05 · 用户：护具、补剂这类实物给提示词，用户生成好抠图的图像；冻结卡等道具用 Logo 变体（已做成 `PropGlyph`，不用出图）。
> 范围是 `src/data/growth.ts` 里的 5 件商品（商家、品牌全部虚构，价格是示例）。

> **2026-10-06 已出图**：用户每件出了 2 张（512 × 512），选用的放在 `docs/shop/<id>.jpg`，另一张留在 `docs/shop/alt/`；已抠图导出 `public/shop/`。

## 怎么用

1. 每件商品**单独出一张**（一张图只放一件，抠图最干净）：1:1，最高分辨率（2048 × 2048 或以上）。
2. 先贴「通用前缀」，再接这件商品的「商品描述」，两段之间空一行。
3. 出图后存成 `docs/shop/<id>.png`（或 .jpg），id 见下表，然后运行 `python3 scripts/shop_png.py`：
   - 抠图后导出 `public/shop/<id>.webp`（App 用）和 `design/brand/shop/<id>.png`（母版）；
   - 商品卡 `ProductCard` 有图就显示，没有图就显示占位。
4. 出图后逐张对一下文末的检查清单。

| id | 商品 | 商家（虚构） | 类别 |
|---|---|---|---|
| `belt-10` | 杠铃腰带 10 毫米 | 铁砧运动 | 护具 |
| `straps` | 8 字助力带 | 铁砧运动 | 护具 |
| `whey` | 乳清蛋白 2 磅 | 慢火补给 | 补给 |
| `creatine` | 一水肌酸 300 克 | 慢火补给 | 补给 |
| `knee` | 7 毫米护膝 | 山羊护具 | 护具 |

## 设计约定（为什么这样写）

- **品红纯色底 `#FF00FF`**：商品配色里没有粉紫，和黑、骨白、荧光绿都差得最远，抠图不串色。底上不要阴影、倒影、渐变，阴影由 App 统一加。
- **配色贴着 App**：哑光黑或炭灰为主，骨白做标签，**一处**荧光绿 `#D4FF3A` 点缀（车线、瓶盖或一条色带）。放进深色商城，5 件像一套。
- **不画任何真实品牌**：只写通用品名（WHEY PROTEIN 这类），不写商家名，不出现任何现有品牌的标志、配色组合或包装造型。
- **同一机位、同一光**：正面偏 3/4 视角，略俯视约 10°；左上方柔光主灯，加一道淡淡的轮廓光；哑光材质，干净真实，像高端电商主图。
- **构图**：商品居中，占画面约 70%，四周至少留 10% 空白；边缘清晰锐利，不做景深虚化、不加动态模糊，不要截断。

## 通用前缀（每张都先贴这段）

```
Studio product photograph for an e-commerce catalog, a single product, centered, occupying about 70% of a square 1:1 frame, at least 10% empty margin on every side, nothing cropped.
Camera: front three-quarter view, slightly above eye level (about 10 degrees down), 85mm lens look, everything in sharp focus, no depth-of-field blur, no motion blur.
Lighting: soft key light from the upper left, a faint rim light on the right edge, matte materials, realistic and clean, premium but understated.
Color scheme: matte black / charcoal with bone-white (#E9E3D3) details and exactly ONE small accent in neon lime green #D4FF3A. No pink, purple or magenta anywhere on the product.
Background: one perfectly flat, uniform solid color, pure magenta #FF00FF, edge to edge. No shadow, no reflection, no floor, no gradient, no vignette, no texture, no props, no hands, no people.
Text: only the exact words given below, printed small and clean; no brand names, no logos of existing companies, no extra text, no watermarks.
```

## 商品描述

### belt-10 · 杠铃腰带 10 毫米（铁砧运动 · 护具）

要点：10 毫米厚的牛皮力量举腰带，单齿钢扣；黑色皮面，荧光绿车线沿两边走；卷成一个松松的环立着，扣子朝前。

```
Product: a 10 mm thick genuine leather powerlifting belt with a single-prong brushed steel buckle. Matte black leather, uniform 10 cm width, neat double row of neon lime green #D4FF3A stitching along both edges (the only accent). The belt is loosely rolled into an upright loop standing on its edge, buckle facing the camera, the tongue end tucked through the loop. A small debossed size mark "M" near the holes. No other text.
```

### straps · 8 字助力带（铁砧运动 · 护具）

要点：一对 8 字形助力带，黑色棉织带，内侧硅胶防滑纹，缝合处一小块荧光绿加固线；两只交叠摆放，看得出 8 字形。

```
Product: a pair of figure-8 weightlifting straps made of thick black cotton webbing, each strap folded into a clear figure-eight shape, the inner grip surface showing a fine charcoal silicone anti-slip pattern. The stitched joint of each strap has a small neon lime green #D4FF3A bar-tack stitch (the only accent). The two straps lie overlapping slightly, one in front of the other, both figure-eight shapes clearly readable. No text.
```

### whey · 乳清蛋白 2 磅（慢火补给 · 补给）

要点：哑光黑圆罐，骨白旋盖；罐身一圈骨白标签，大字 WHEY PROTEIN，小字 ORIGINAL · 2 LB，标签上一条细荧光绿色带。

```
Product: a cylindrical supplement tub, matte black, with a bone-white (#E9E3D3) screw lid. A wide bone-white label band wraps the tub, printed in clean black sans-serif: large "WHEY PROTEIN", below it small "ORIGINAL · 2 LB". One thin neon lime green #D4FF3A horizontal stripe runs across the label under the text (the only accent). Simple, modern, minimal packaging. No other text or graphics.
```

### creatine · 一水肌酸 300 克（慢火补给 · 补给）

要点：比乳清罐小一号的哑光黑方圆罐（同一个系列），荧光绿旋盖；骨白标签，CREATINE MONOHYDRATE，小字 UNFLAVORED · 300 G。

```
Product: a small squat supplement jar from the same minimal product line as a matte black protein tub: matte black body, screw lid in neon lime green #D4FF3A (the only accent). A bone-white (#E9E3D3) label printed in clean black sans-serif: "CREATINE MONOHYDRATE", below it small "UNFLAVORED · 300 G". Simple, modern, minimal packaging. No other text or graphics.
```

### knee · 7 毫米护膝（山羊护具 · 护具）

要点：一对 7 毫米氯丁橡胶护膝，黑色筒状、立着并排，接缝处骨白平缝线；顶边各一小块荧光绿织标（无字）。

```
Product: a pair of 7 mm neoprene knee sleeves, matte black, tube-shaped, standing upright side by side and slightly overlapping, the near one turned a little toward the camera. Flat bone-white (#E9E3D3) seam stitching runs down the back seam. Each sleeve has a small blank neon lime green #D4FF3A woven tab at the top edge (the only accent). The neoprene thickness is visible at the top opening. No text.
```

## 检查清单（出图后逐张对）

- 底是均匀的纯品红：没有阴影、地面、渐变、噪点，商品四周留白够、没被裁掉。
- 商品上没有粉紫色，只有一处荧光绿点缀；没有商家名、没有任何真实品牌的标志。
- 文字只有规定的那几个字，拼写正确（AI 常把字母写错：错了就重出，或让 Nano Banana 只改文字）。
- 机位、光线和其余几张一致（放在一起像一套）。
- 边缘清晰，没有景深虚化、没有轮廓光晕溢到底上。
