#!/usr/bin/env python3
"""身体页 · Stitch 第 1 轮提示词（6 个视觉方向）→ design/hifi/body/stitch-r1.md。
线框：用户选定的 W3「大幅半身作背景」（screenshots/wireframes/body/W3.png）。
数字来自 design/benchmark/p06.json。人体区域只写成中性剪影占位，不让 Stitch 画肌肉（用户要求：人体只用 MuscleWiki 真实素材）。
每个方向单独一个 Stitch 项目（同一项目里后生成的会套用第一张的设计系统，方向会趋同），模型 GEMINI_3_8_FLASH，设备 MOBILE。"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stitch-r1.md')

COMMON = (
    "Android phone screen, 360x800 dp portrait. DARK THEME ONLY. High-fidelity UI for a strength-training app \"Milo\" (Chinese name 慢牛), "
    "the core idea is an adaptive engine for progressive overload and supercompensation. All UI text must be Simplified Chinese exactly as given below; "
    "no lorem ipsum, no invented English labels, do not change any number. No photos, no cows, no brand logos. "
    "Only ONE glowing / accent-colored focal element on the whole screen."
)

LAYOUT = (
    "Screen: 身体 tab (muscle volume & recovery overview). Layout is fixed:\n"
    "- Header row: title 身体 on the left; on the right of the same row two small segmented toggles 正面 | 背面 and 男 | 女.\n"
    "- BACKGROUND: a large HALF human body silhouette (front view) cut exactly at the vertical midline, the cut edge flush against the LEFT screen edge, "
    "spanning from below the header to above the navigation bar and about half the screen width. Render it as a NEUTRAL, DIMMED PLACEHOLDER SILHOUETTE: "
    "one flat dark shape with a faint outline, NO muscle detail, NO anatomy drawing (real anatomy artwork will be placed here later). "
    "Only the chest area of the silhouette carries a soft highlight to show the focused muscle.\n"
    "- Floating over the upper-left of the silhouette: small label 近 7 天, a big number 43 with unit 组, and a small line 13,854 kg · 4 天.\n"
    "- On the RIGHT half, overlapping the silhouette, a vertical column of 16 pill capsules with solid backgrounds, each linked by a thin elbow leader line to a dot on the silhouette. "
    "Each capsule shows muscle name, sets/target and a thin volume bar, top to bottom: 上斜方肌 0/13, 三角肌前束 6.5/13, 上胸 6/16, 三角肌中束 7/13, 中下胸 7.5/16, "
    "肱二头肌长头 4.5/13, 肱二头肌短头 5.5/13, 上腹 0/10, 腹斜肌 0/10, 下腹 0/10, 大腿内收肌 3/16, 股外侧肌 6.5/16, 股直肌 5/16, 股内侧肌 6.5/16, 比目鱼肌 2/10, 胫骨前肌 0/10. "
    "Capsules with 0 sets are dimmed with a faint diagonal hatch.\n"
    "- Magnifier state: a finger presses 中下胸. That capsule is magnified like a macOS dock icon (about 2.5x taller, grows leftwards over the silhouette) and is the single focal element: "
    "中下胸 7.5/16 and a second line 恢复 5% · 修复期 · 还需 68 小时. Its neighbours above and below are slightly enlarged (smooth cosine falloff); the rest stay small but keep their names readable.\n"
    "- Just above the navigation: a compact legend 未练 / 不足 / 达标 / 超量 (differ by brightness AND texture, not hue alone).\n"
    "- Bottom: a floating pill-shaped navigation bar (not full width, centered) with 5 items 首页 / 身体 / 增量 / 记录 / 我的. The selected item 身体 is a smaller inner pill with icon + label; "
    "the other four are icon only. The outer pill's outline is a thin closed progress ring (today's workout is done)."
)

DIRECTIONS = [
    ('A', '配重片强化', "Visual direction: \"Weight Plate\". Near-black (#0A0A0B) with fine grain; capsules and cards look like matte black anodized metal with subtle machined concentric grooves; "
          "engraved tick marks as dividers and on the volume bars; numbers in a geometric grotesk (Space Grotesk-like), scale readouts monospaced; warm off-white text (#F3F2EE); "
          "electric lime (#D4FF3A) only on the magnified capsule with a restrained glow. Industrial, precise, premium."),
    ('B', '克制精致', "Visual direction: \"Quiet Precision\". Flat near-black, generous spacing, hairline 1px strokes instead of fills, capsules are thin outlined pills; large light-weight numerals with tight tracking; "
          "warm off-white and muted warm grays; lime (#D4FF3A) used as a thin line and the magnified capsule only. Calm and expensive, like a luxury watch face."),
    ('C', '张力运动', "Visual direction: \"Kinetic Power\". Bold condensed display numerals (Bebas Neue / Druk-like) set very large — the 43 is huge and partly cropped; asymmetric energy, slight diagonal cuts on cards; "
          "strong contrast; the magnified capsule is a solid lime block with black text. Sporty, confident, poster-like but still a usable app."),
    ('D', '玻璃景深', "Visual direction: \"Glass Depth\". The dimmed silhouette sits in a deep, softly lit dark space; capsules are frosted dark glass with subtle blur and a 1px inner highlight, gentle depth and soft shadows; "
          "SF-like clean numerals; the magnified capsule floats highest with a soft lime rim light. Premium, tactile, modern."),
    ('E', '杂志排版', "Visual direction: \"Editorial\". Magazine-like typographic hierarchy: the title 身体 and the 43 set in a refined high-contrast serif for Chinese and numerals (Noto Serif SC-like), "
          "everything else in a clean sans; strict baseline grid, thin rules, asymmetric whitespace; restrained palette of warm blacks and bone white; lime only on the magnified capsule."),
    ('F', '自由发挥', "Visual direction: derive your own from the brand keywords — assured, transparent, solid, tense, equipment-like (machined metal, tick marks, weight plates, pins and gauges translated into flat UI). "
          "Keep the dark theme, the layout above and the single focal element; surprise us with typography, shape language and texture."),
]


def prompt(d):
    return COMMON + "\n\n" + LAYOUT + "\n\n" + d[2]


def main():
    out = ["# 身体页 · Stitch 第 1 轮（6 个视觉方向）", "",
           "> 由 `build_stitch_r1.py` 生成。线框：用户选定的 W3「大幅半身作背景」。每个方向单独一个私有项目（同一项目里会趋同），GEMINI_3_8_FLASH，MOBILE；逐个发请求。",
           "> 人体区域只要求中性剪影占位；最终用 MuscleWiki 真实素材。Stitch 图里的数字一律不当口径。", ""]
    for d in DIRECTIONS:
        out += [f"## r1-{d[0]} · {d[1]}", "", "```text", prompt(d), "```", ""]
    open(OUT, 'w', encoding='utf-8').write('\n'.join(out))
    print('wrote', os.path.relpath(OUT))


if __name__ == '__main__':
    main()
