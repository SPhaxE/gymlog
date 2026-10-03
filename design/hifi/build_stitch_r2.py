#!/usr/bin/env python3
"""Stitch 第 2 轮：视觉语言 v2（design/hifi/refs-analysis.md）× 3 个强度，身体页（线框 W3）+ 首页（线框 W2）。
输出 design/hifi/<页面>/stitch-r2.md；PAGES[页面] 是 [(键, 名称, 提示词)]，给 tools/run_round.py 用。
人体区域只要求中性剪影占位，最终换成 MuscleWiki 真实素材。"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

COMMON = (
    "Android phone screen, 360x800 dp portrait, DARK THEME ONLY. High-fidelity UI for \"Milo\" (Chinese name 慢牛), an adaptive strength-training engine for progressive overload and supercompensation. "
    "All UI text must be Simplified Chinese exactly as given; no invented English labels or taglines anywhere; do not change any number. No photos, no cows, no logos.\n\n"
    "VISUAL LANGUAGE (fixed for all variants):\n"
    "- Colors: warm near-black background (#0B0B0A) with warm dark-gray surfaces (#171615, #201F1D); BONE (warm off-white #E9E3D3) for selected / solid neutral states "
    "(selected nav item, selected segmented control, neutral solid buttons) and primary text; muted warm grays for secondary text; ELECTRIC LIME (#D4FF3A) for exactly ONE focal element per screen "
    "plus the thin progress ring around the navigation bar. A muted red (#FF6B5E) only for downward trends.\n"
    "- Typography: key numbers (weights, sets, percentages) in a tall CONDENSED bold display face (Barlow Condensed / Oswald style); units like kg, 组 small in a regular sans; "
    "Chinese text in Noto Sans SC.\n"
    "- Tick marks: fine ruler ticks used as dividers and as measurement scales (like a calibrated weight plate or a gauge), never as random decoration.\n"
    "- Navigation: a floating pill-shaped bar (not full width) with 5 items, EACH with a small solid icon and its label under it: 首页 / 身体 / 增量 / 记录 / 我的. "
    "The selected item sits in a BONE solid circle-pill with a black icon and label. A thin lime ring runs around the outer pill as today's progress."
)

INTENSITY = [
    ('V1', '克制', "INTENSITY: restrained. Generous spacing, hairline strokes, numbers large but not oversized, very little texture, bone used only where required. Calm and precise like a luxury instrument."),
    ('V2', '均衡', "INTENSITY: balanced. Condensed numbers clearly dominant, fine tick rulers as dividers, surfaces with subtle depth, a barely visible concentric weight-plate groove texture only behind the hero area."),
    ('V3', '张力', "INTENSITY: bold. Condensed numbers very large with tight leading, strong contrast, the focal element is a solid lime block with black text, slight angled cut on one header element; still clean and usable, no decorative giant numbers."),
]

BODY = (
    "SCREEN: 身体 tab (muscle volume & recovery). Layout fixed:\n"
    "- Header row: title 身体 left; right side two small segmented toggles 正面 | 背面 and 男 | 女 (selected segments in bone).\n"
    "- One summary row under the header: 近 7 天 · 13,854 kg · 43 组 · 4 天 (numbers condensed), with a fine tick-ruler line under it. Then a compact legend 未练 / 不足 / 达标 / 超量 (differ by brightness and hatch texture, not only hue).\n"
    "- BACKGROUND: a large HALF human body silhouette (front view) cut exactly at the vertical midline, the cut edge flush against the LEFT screen edge, about half the screen width and almost full height; "
    "render it as a NEUTRAL DIMMED PLACEHOLDER SILHOUETTE with a faint outline only, NO muscle detail (real anatomy artwork is placed later). Only the chest area has a soft outline highlight.\n"
    "- RIGHT half, overlapping the silhouette: a vertical column of 16 rounded capsules with solid dark backgrounds, each linked by a thin elbow leader line to a dot on the silhouette. "
    "Each capsule: name left, sets/target right (condensed numbers), and the capsule background is filled from the left in a dark bone tint proportional to the sets, so each capsule is its own gauge. "
    "Top to bottom: 上斜方肌 0/13, 三角肌前束 6.5/13, 上胸 6/16, 三角肌中束 7/13, 中下胸 7.5/16, 肱二头肌长头 4.5/13, 肱二头肌短头 5.5/13, 上腹 0/10, 腹斜肌 0/10, 下腹 0/10, 大腿内收肌 3/16, 股外侧肌 6.5/16, 股直肌 5/16, 股内侧肌 6.5/16, 比目鱼肌 2/10, 胫骨前肌 0/10. "
    "Capsules with 0 sets are dimmed with a diagonal hatch.\n"
    "- Magnifier: a finger presses 中下胸. That capsule is magnified like a macOS dock icon (about 2.5x taller, grows leftwards over the silhouette) and is the single LIME focal element with BLACK text: "
    "中下胸 7.5/16 and a second line 恢复 5% · 修复期 · 还需 68 小时. Neighbours above and below slightly enlarged (cosine falloff).\n"
    "- Navigation as described, 身体 selected; the outer lime ring is complete (today's workout is done)."
)

HOME = (
    "SCREEN: 首页 tab (today's prescription). Layout fixed:\n"
    "- Header: small date 10月3日 周六, title 今日处方, and a small link 为什么是这些 on the right.\n"
    "- A row of three small tags: 5 个动作 · 13 组 · 下肢 · 背 · 手臂.\n"
    "- HERO CARD for the first exercise (the focal point): small label 第 1 个 · 下肢, exercise name 杠铃深蹲, a very large condensed number 85 with small kg, target 3 × 6–8 on the right, "
    "and a one-line reason 上次全部顶到 8 次 → +5 kg; a fine tick ruler runs along the bottom edge of the card.\n"
    "- Section label 接下来, then a compact list (one row each, name and region · sets × reps on the left, weight on the right in condensed numbers, fine tick dividers between rows): "
    "器械站姿提踵 下肢 · 2 × 10–12 60 kg; 窄握下拉 背 · 3 × 6–8 首次; 杠铃硬拉 背 · 3 × 6–8 首次; 哑铃卧凳手腕伸展 手臂 · 2 × 10–12 首次.\n"
    "- A full-width primary button 开始训练 fixed just above the navigation bar: this LIME button is the single focal element (so the hero card itself uses bone/neutral accents, not lime).\n"
    "- Navigation as described, 首页 selected; the outer lime ring shows only an empty track (today's workout not started)."
)

PAGES = {
    'body': [(k, n, COMMON + "\n\n" + BODY + "\n\n" + t) for k, n, t in INTENSITY],
    'home': [(k, n, COMMON + "\n\n" + HOME + "\n\n" + t) for k, n, t in INTENSITY],
}


def main():
    for page, items in PAGES.items():
        out = [f"# {page} · Stitch 第 2 轮（视觉语言 v2 × 3 个强度）", "",
               "> 由 `design/hifi/build_stitch_r2.py` 生成。视觉语言 v2 见 `design/hifi/refs-analysis.md`。每个变体单独一个 Stitch 项目，GEMINI_3_8_FLASH，MOBILE。", ""]
        for k, n, p in items:
            out += [f"## r2-{k} · {n}", "", "```text", p, "```", ""]
        path = os.path.join(HERE, page, 'stitch-r2.md')
        open(path, 'w', encoding='utf-8').write('\n'.join(out))
        print('wrote', os.path.relpath(path, os.path.join(HERE, '..', '..')))


if __name__ == '__main__':
    main()
