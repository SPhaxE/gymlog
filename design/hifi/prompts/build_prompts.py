#!/usr/bin/env python3
"""生成 design/hifi/prompts/nanobanana.md：页面块 × 风格块 → 可直接复制的完整提示词。
改提示词请改本文件再运行：python3 design/hifi/prompts/build_prompts.py"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nanobanana.md')

COMMON = (
    "High-fidelity mobile app UI screenshot of a Chinese strength-training app named \"慢牛 Milo\". "
    "Dark theme. Portrait phone screen, 1080×2340 (aspect 9:19.5), flat orthographic front view of the screen only — "
    "no device frame, no hands, no desk, nothing outside the screen. Android status bar at the top showing \"18:00\". "
    "All interface text is Simplified Chinese and must be rendered exactly as written inside the quotes below; "
    "do not add, translate or invent any other text. The only Latin text allowed is \"kg\", \"PR\" and \"Milo\". "
    "Chinese UI text uses a clean modern sans-serif (like Noto Sans SC); minimum text size equivalent to 11 pt. "
)

NAV = (
    "Bottom: a floating pill-shaped navigation bar hovering above the bottom edge with 5 items in this order: "
    "\"首页\", \"身体\", \"增量\", \"记录\", \"我的\". Unselected items show only a simple solid geometric icon (no label); "
    "the selected item \"{sel}\" is a smaller inner pill that shows its icon plus the label. {ring} "
)

NEG = (
    "Avoid: fake English labels or placeholder text, lorem ipsum, extra buttons/icons/tabs not described, changing any number, "
    "device mockup frame, more than ONE glowing element on the screen, rainbow gradients, stock photos, mascots, emoji."
)

STYLES = {
    'A': ('配重片强化版（方向 B 加强）',
          "Visual style \"Weight Plate\": near-black background (#0A0A0B) with very fine film grain; surfaces look like matte black anodized metal "
          "with subtle machined concentric grooves, like calibrated weight plates; engraved tick marks and ruler scales used as dividers and progress bars; "
          "numbers in a geometric grotesk (like Space Grotesk) with monospaced readouts for scales; warm off-white text (#F3F2EE) and warm grays; "
          "a single electric lime accent (#D4FF3A) reserved for the one focal element, with a soft restrained glow. Industrial, precise, premium."),
    'B': ('克制精致',
          "Visual style \"Quiet Precision\": flat near-black background (#0A0A0B), generous negative space, strict Swiss grid, hairline 1 px dividers, "
          "no cards or very subtle ones; large light-weight numerals with tight tracking; editorial hierarchy with clear contrast between one big number and small labels; "
          "warm off-white (#F3F2EE) and muted warm grays; electric lime (#D4FF3A) used sparingly as thin lines, dots and the one focal element only. "
          "Calm, expensive, like a luxury watch interface."),
    'C': ('张力运动',
          "Visual style \"Kinetic Power\": near-black background, bold condensed display numerals (like Bebas Neue / Druk) set very large, some numbers oversized and cropped by the screen edge; "
          "asymmetric, diagonal energy in the layout; strong black/white contrast with warm off-white text; electric lime (#D4FF3A) as one solid accent block on the focal element; "
          "subtle motion streaks or speed lines only as texture. Sporty, confident, poster-like but still a usable app screen."),
}

PAGES = [
    ('home', '首页 · 今日处方（P01，线框 W2：第一个动作做主角）', '有处方、还没开始训练。数字来自演示数据「plain-prescription」。',
     "Screen: the home tab showing today's training prescription. Top: small date \"10月3日 周六\", title \"今日处方\" and a small text link \"为什么是这些\" on the right. "
     "A row of three small tags: \"5 个动作\" \"13 组\" \"下肢 · 背 · 手臂\". A thin status strip placeholder area below the tags (empty today). "
     "HERO: a large card for the FIRST exercise, the clear focal point of the screen: small label \"第 1 个 · 下肢\", exercise name \"杠铃深蹲\", a huge number \"85\" with small \"kg\", the target \"3 × 6–8\" on the right, and a one-line reason \"上次全部顶到 8 次 → +5 kg\". "
     "Below, a small section label \"接下来\" and a compact list of the remaining exercises (one line each, name + region · sets × reps on the left, weight on the right): "
     "\"器械站姿提踵\" \"下肢 · 2 × 10–12\" \"60 kg\"; \"窄握下拉\" \"背 · 3 × 6–8\" \"首次\"; \"杠铃硬拉\" \"背 · 3 × 6–8\" \"首次\"; \"哑铃卧凳手腕伸展\" \"手臂 · 2 × 10–12\" \"首次\". "
     "A full-width primary button \"开始训练\" fixed just above the navigation bar. The lime accent is used on ONE thing only: either the hero weight or the start button (pick one). ",
     '首页', "The outer bar has a thin ring track with no progress yet."),
    ('body', '身体 · 容量与恢复（P06，新标杆，线框 W3：大幅半身作背景）', '放大镜按住「中下胸」。数字来自 `design/benchmark/p06.json`。人体只看构图，最终换成 MuscleWiki 真实素材。',
     "Screen: the body tab, a muscle volume & recovery overview with an atmospheric layout. Header row: title \"身体\" on the left and two compact segmented toggles \"正面 | 背面\" and \"男 | 女\" on the right of the same row. "
     "BACKGROUND: a LARGE, DIMMED half of a muscular male anatomy figure (front view), cut exactly at the body's vertical midline so only one side is visible, the cut edge flush against the LEFT edge of the screen, "
     "spanning almost the full height between the header and the navigation bar and about half the screen width; it is darkened and low-contrast like a backdrop, muscles faintly tinted by volume level, the chest muscle subtly outlined. "
     "Floating over the upper-left of the figure: a small summary \"近 7 天\" with a big number \"43\" + \"组\" and a small line \"13,854 kg · 4 天\". "
     "On the RIGHT half, OVERLAPPING the figure, a vertical column of pill-shaped capsules with solid backgrounds (readable over the figure), each linked by a thin leader line to its muscle on the figure. Each capsule: muscle name, \"sets / target\", a thin volume bar. "
     "Top to bottom: \"上斜方肌 0/13\", \"三角肌前束 6.5/13\", \"上胸 6/16\", \"三角肌中束 7/13\", \"中下胸 7.5/16\", \"肱二头肌长头 4.5/13\", \"肱二头肌短头 5.5/13\", \"上腹 0/10\", \"腹斜肌 0/10\", \"下腹 0/10\", \"大腿内收肌 3/16\", \"股外侧肌 6.5/16\", \"股直肌 5/16\", \"股内侧肌 6.5/16\", \"比目鱼肌 2/10\", \"胫骨前肌 0/10\". "
     "A finger presses the \"中下胸\" capsule: it is magnified like a macOS dock (neighbours above and below slightly enlarged in a smooth wave), grows to the left over the figure, and is the single lime focal element, "
     "showing an extra line \"恢复 5% · 修复期 · 还需 68 小时\". Capsules with 0 sets look dimmed with a faint diagonal hatch. A compact legend \"未练\" \"不足\" \"达标\" \"超量\" sits just above the navigation bar. ",
     '身体', "A thin solid ring stroke runs fully around the outer bar (today's training is complete)."),
    ('gains', '增量 · 增量总览（P09，线框 W2：按引擎结论分组）', '渐进超负荷的全局视图。数字来自演示数据「plain-prescription」。',
     "Screen: the gains tab, a progressive-overload overview grouped by what the engine recommends next. Title \"增量\" and a one-line summary \"近 4 周 PR 26 次 · 上升 6 · 持平 11 · 下降 2\"; a calm status line \"无需减量\". "
     "Three groups with headers and counts: \"该加重 · 3\", \"保持，次数 +1 · 3\", \"该减重 · 2\". Each row: exercise name with an optional small \"PR\" badge, a small line \"预估 1RM … kg · ▲/▼ change\", and on the right the NEXT TARGET as the most prominent number of the row with a tiny label \"下次\". "
     "该加重: \"杠铃深蹲\" \"预估 1RM 100.3 kg · ▲ 5.9\" next \"85 kg × 6\"; \"上斜哑铃卧推\" PR \"31.4 kg · ▲ 0.9\" next \"27.5 kg × 6\"; \"坐姿哑铃推举\" PR \"28.2 kg · 持平\" next \"25 kg × 6\". "
     "保持: \"杠铃卧推\" PR \"79.1 kg · ▲ 2.3\" next \"65 kg × 8/8/7\"; \"哑铃侧平举\" PR \"13.8 kg · ▲ 0.4\" next \"10 kg × 12\"; \"绳索下压\" PR \"40 kg · ▲ 1.0\" next \"30 kg × 11\". "
     "该减重: \"器械下拉\" PR \"65.9 kg · ▼ 3.1\" next \"52.5 kg × 6\"; \"垂直腿举\" PR \"147.6 kg · ▼ 2.9\" next \"115 kg × 6\". "
     "The three groups should be distinguishable by shape/iconography (up arrow, equals, down arrow), not only color. The single lime focal element is the \"该加重\" group header. ",
     '增量', "The outer bar has a thin ring track with no progress yet."),
    ('log', '记录 · 训练记录（P07，线框 W1：按周分组 + 每周合计）', '按时间倒序。数字来自演示数据「plain-prescription」。',
     "Screen: the log tab, training history grouped by week. Title \"记录\". Each week has a header with the range on the left and the week total on the right: "
     "\"本周 · 9月28日–10月4日\" total \"2 次 · 25 组 · 9,244 kg\"; \"9月21日–27日\" total \"3 次 · 35 组 · 13,453 kg\"; \"9月14日–20日\" total \"3 次 · 33 组 · 11,743 kg\". "
     "Rows (date + regions, counts, total load, optional PR badge): \"9月29日 周二\" \"下肢\" \"5 个动作 · 13 组 · 56 分钟\" \"6,209 kg\"; \"9月28日 周一\" \"背 · 手臂 · 肩\" \"5 个动作 · 12 组 · 52 分钟\" \"3,035 kg\"; "
     "\"9月26日 周六\" \"胸 · 肩 · 手臂\" \"5 个动作 · 13 组 · 54 分钟\" \"3,260 kg\" \"PR ×4\"; \"9月22日 周二\" \"下肢\" \"4 个动作 · 10 组 · 68 分钟\" \"6,640 kg\" \"PR ×4\"; \"9月21日 周一\" \"背 · 手臂 · 肩\" \"5 个动作 · 12 组 · 55 分钟\" \"3,553 kg\" \"PR ×2\"; "
     "\"9月19日 周六\" \"胸 · 肩 · 手臂\" \"5 个动作 · 13 组 · 66 分钟\" \"3,073 kg\" \"PR ×2\". The single lime focal element is the current week's total. ",
     '记录', "The outer bar has a thin ring track with no progress yet."),
    ('me', '我的（P11，线框 W2：档案四格 + 列表）', '档案与设置。',
     "Screen: the me tab. Title \"我的\". A 2×2 grid of large tappable profile tiles, each with a small label and a big value: \"训练经验\" \"进阶\"; \"单次时长\" \"60 分钟\"; \"可用器械\" \"6 类\"; \"体型示意\" \"男\". "
     "Below, grouped settings lists: group \"导航\": toggle \"显示今日进度环\" on, toggle \"显示休息倒计时描边\" on, \"休息结束提示\" value \"描边 + 振动\"; group \"数据\": \"载入示例数据\", \"清除全部数据\" (muted red); "
     "group \"关于\": \"人体图与动作示范\" value \"MuscleWiki\", \"版本\" value \"0.1.0\". Small slogan \"慢慢变牛。\" at the very bottom of the content. The single lime focal element is one subtle accent on the tile grid. ",
     '我的', "The outer bar has a thin ring track with no progress yet."),
    ('session', '训练进行中（P03，无导航，线框 W2：组表格 + 行内键盘）', '第 1 个动作做完 1 组，正在休息。',
     "Screen: the in-workout logging screen (no bottom navigation), designed for one hand. Top bar: \"暂停\" on the left, progress \"1 / 5\" in the middle, \"完成训练\" on the right; a thin segmented progress bar of 13 segments with the first filled. "
     "Directly below, a rest timer bar: \"休息\" with a large countdown \"2:15\", a thin countdown stroke, and small buttons \"−15 秒\" \"+15 秒\" \"跳过\". "
     "Exercise title \"杠铃深蹲\" with \"3 × 6–8 · 休息 3:00\" and a small link \"要领\". A set table with columns \"组\" \"重量\" \"次数\" \"完成\": row 1 \"85 kg\" \"6\" checked; row 2 \"85 kg\" \"6\" highlighted as the active row; row 3 \"85 kg\" \"6\" pending. "
     "A large primary button \"完成这一组\" (the single lime focal element). The lower part of the screen is a built-in numeric keypad (digits 0–9, decimal point, \"−2.5\" \"+2.5\" step keys, a confirm key) for editing the active cell without a popup. ",
     None, None),
    ('summary', '完成结算（P05，无导航）', '一次有 4 项 PR 的训练。数字来自演示训练 demo-w0-push。',
     "Screen: the workout summary right after finishing (no bottom navigation). Hero: \"训练完成\" and a big celebratory but tasteful number \"4 项 PR\" (the single lime focal element). "
     "Three stats: \"13 组\" \"3,260 kg\" \"54 分钟\". A per-exercise comparison list, each row: name, estimated 1RM, change vs last time, PR marked by a shape plus the text \"PR\": "
     "\"杠铃卧推\" \"79.1 kg\" \"↑ 2.3\" PR; \"上斜哑铃卧推\" \"31.4 kg\" \"↑ 0.9\" PR; \"坐姿哑铃推举\" \"28.2 kg\" \"持平\"; \"哑铃侧平举\" \"13.8 kg\" \"↑ 0.4\" PR; \"绳索下压\" \"40 kg\" \"↑ 1.0\" PR. "
     "A primary button \"完成\" at the bottom. ",
     None, None),
    ('sheet', '肌头详情面板（身体页的底部面板）', '松手后打开「中下胸」。数字来自 `design/benchmark/p06.json`。',
     "Screen: the body tab dimmed in the background with a bottom sheet open covering the lower 60%. Sheet title \"中下胸\" with a small close handle. "
     "Recovery block: a 4-segment phase bar labelled \"修复期\" \"恢复中\" \"黄金窗\" \"已回落\" with the current segment \"修复期\" highlighted (the single lime focal element), big readout \"恢复 5%\" and \"还需 68 小时\". "
     "Volume block: \"近 7 天 7.5 组\" on a horizontal ruler scale with three labelled tick marks \"最低 8\" \"适宜 16\" \"上限 22\"; a line \"最近一次：约 4 小时前\". ",
     None, None),
]

FAMILY = ("Presentation board: the five main tab screens of the same app shown side by side at equal size on a dark neutral board, in this order: "
          "home \"今日处方\", body \"身体\" (half anatomy figure + capsule column), gains \"增量\", log \"记录\", me \"我的\". "
          "They must share one consistent visual language (same typography, spacing, accent usage, navigation bar). Each screen's bottom navigation highlights its own tab: "
          "\"首页\", \"身体\", \"增量\", \"记录\", \"我的\". Text inside screens may be small but must be Simplified Chinese. ")


def prompt(page, style_key):
    _, _, _, body, sel, ring = page
    nav = NAV.format(sel=sel, ring=ring) if sel else "No bottom navigation on this screen. "
    return COMMON + body + nav + STYLES[style_key][1] + " " + NEG


def main():
    out = ["# 慢牛 Milo · Nano Banana 2 提示词包 v2（按选定线框）",
           "",
           "> 由 `design/hifi/prompts/build_prompts.py` 生成，勿手改。用途：给用户用 Nano Banana 2 出**视觉参考**（以视觉效果为主），和 Stitch 的方案一起对比。v2（2026-10-03）：布局描述已换成用户选定的线框——身体 W3、首页 W2、增量 W2、记录 W1、我的 W2、训练进行中 W2、肌头详情 W1（线框见 `screenshots/wireframes/<页面>/`）。",
           "",
           "## 用法",
           "",
           "- 每段提示词都是完整的，整段复制即可。画幅选**竖屏、最接近 9:19.5**（没有就用 9:16）；每段建议出 2–4 张。",
           "- 界面文字照抄中文原文。出图里的错字、乱码、编造的英文不用管，我们只看构图、层级、字体气质、配色和质感。",
           "- **人体（身体页、全家福）只看构图和氛围**，最终一律换成 MuscleWiki 的真实解剖素材；AI 画的肌肉不当素材，不入库。",
           "- 出图放到 `design/hifi/<页面>/refs/`，文件名 `nb-<页面>-<方向>-<序号>.png`（如 `nb-body-A-1.png`），或直接发到对话里。我会和 Stitch 方案一起做成对比总览，按「人体图与胶囊 / 字体与数字 / 配色与质感 / 排版与密度」四项点评。",
           "- 三个方向：**A 配重片强化版**（金属、刻度、荧光点缀）· **B 克制精致**（大留白、细线、一个强调色）· **C 张力运动**（展示型粗体数字、高对比、动势构图）。觉得哪个方向对，就多出那个方向；也可以自己改风格段。",
           "- 全部数字来自引擎在演示数据上的实算值（2026-10-03 18:00），与 `mock/` 和 `design/benchmark/p06.json` 一致。",
           "",
           "## 目录",
           ""]
    for key, title, *_ in PAGES:
        out.append(f"- [{title}](#{key})")
    out.append("- [全家福：5 个根页并排](#family)")
    out.append("")
    for page in PAGES:
        key, title, note = page[:3]
        out += [f'<a id="{key}"></a>', f"## {title}", "", note, ""]
        for k, (name, _) in STYLES.items():
            out += [f"### {key}-{k} · {name}", "", "```text", prompt(page, k), "```", ""]
    out += ['<a id="family"></a>', "## 全家福：5 个根页并排", "", "用来检查五个 Tab 是否像同一个 App。", ""]
    for k, (name, style) in STYLES.items():
        out += [f"### family-{k} · {name}", "", "```text", COMMON.replace("Portrait phone screen, 1080×2340 (aspect 9:19.5), flat orthographic front view of the screen only — no device frame, no hands, no desk, nothing outside the screen. ", "Landscape image 3:2. ") + FAMILY + style + " " + NEG, "```", ""]
    open(OUT, 'w', encoding='utf-8').write('\n'.join(out))
    print('已生成', os.path.relpath(OUT), f'（{len(PAGES) * 3 + 3} 段提示词）')


if __name__ == '__main__':
    main()
