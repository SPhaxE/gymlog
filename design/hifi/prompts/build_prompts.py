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
    ('home', '首页 · 今日处方（P01）', '有处方、还没开始训练。数字来自演示数据「plain-prescription」。',
     "Screen: the home tab showing today's training prescription. Top: small date \"10月3日 周六\" and title \"今日处方\"; one summary line \"下肢 · 背 · 手臂 — 5 个动作 · 13 组\"; "
     "a small text link \"为什么是这些\". Then the exercise list grouped by body region with small group headers \"下肢\", \"背\", \"手臂\". Each row: exercise name, sets × reps, suggested weight, and a tiny one-line reason: "
     "1) \"杠铃深蹲\" \"3 × 6–8\" \"85 kg\" reason \"上次全部顶到 8 次 → +5 kg\"; 2) \"器械站姿提踵\" \"2 × 10–12\" \"60 kg\" reason \"重量不变，每组 +1 次\"; "
     "3) \"窄握下拉\" \"3 × 6–8\" weight shown as \"首次\"; 4) \"杠铃硬拉\" \"3 × 6–8\" \"首次\"; 5) \"哑铃卧凳手腕伸展\" \"2 × 10–12\" \"首次\". "
     "The suggested weights are the most prominent numbers on the screen. A full-width primary button \"开始训练\" fixed just above the navigation bar — this button is the single focal (lime) element. ",
     '首页', "The outer bar has a thin ring track with no progress yet."),
    ('body', '身体 · 容量与恢复（P06，新标杆）', '放大镜按住「中下胸」。数字来自 `design/benchmark/p06.json`。人体只看构图，最终换成 MuscleWiki 真实素材。',
     "Screen: the body tab, a muscle volume & recovery overview. Header row: title \"身体\" with two compact segmented toggles \"正面 | 背面\" and \"男 | 女\" on the same row (not taking a full row each). "
     "A small summary line: \"近 7 天\" \"13,854 kg\" \"43 组\" \"4 天\". A compact legend with four swatches \"未练\" \"不足\" \"达标\" \"超量\" (differentiated by brightness and texture, not only hue). "
     "Main area: on the LEFT, only HALF of a muscular male anatomy figure (front view), cut exactly at the body's vertical midline so only one side is visible, the cut edge flush against the left edge of the screen, "
     "occupying about one third of the width, subdued and stylized like an anatomy diagram, muscles tinted by volume level; the chest muscle has a lime outline. The figure is a supporting element, NOT the hero. "
     "On the RIGHT, taking about two thirds of the width, a vertical column of pill-shaped capsules, each linked by a thin leader line to its muscle on the figure. Each capsule shows the muscle name, \"sets / target\" and a thin volume bar. "
     "Top to bottom: \"三角肌前束 6.5/13\", \"三角肌中束 7/13\", \"上胸 6/16\", \"中下胸 7.5/16\", \"肱二头肌长头 4.5/13\", \"肱二头肌短头 5.5/13\", \"上腹 0/10\", \"腹斜肌 0/10\", \"股直肌 5/16\", \"股外侧肌 6.5/16\", \"股内侧肌 6.5/16\", \"胫骨前肌 0/10\". "
     "A finger is pressing the \"中下胸\" capsule: it is magnified (dock-like magnification, the neighbours above and below slightly enlarged in a smooth wave) and is the single lime focal element, "
     "showing an extra line \"恢复 5% · 修复期 · 还需 68 小时\". Capsules with 0 sets look dimmed with a faint diagonal hatch. Show the touch as a subtle translucent circle. ",
     '身体', "A thin solid ring stroke runs fully around the outer bar (today's training is complete)."),
    ('gains', '增量 · 增量总览（P09）', '渐进超负荷的全局视图。数字来自演示数据「plain-prescription」。',
     "Screen: the gains tab, a progressive-overload overview. Title \"增量\". A summary block for the last 4 weeks: \"近 4 周\" with \"PR 26 次\" as the hero number and three small counts \"上升 6\" \"持平 11\" \"下降 2\"; "
     "a calm status line \"无需减量\". A row of filter chips \"全部\" (selected) \"下肢\" \"背\" \"胸\" \"肩\" \"手臂\" \"核心\". "
     "Then a list of exercises; each row: name, estimated 1RM, change since last time (with an arrow shape, not only color), a tiny sparkline, and the next target; a small \"PR\" badge where noted: "
     "\"杠铃深蹲\" \"预估 1RM 100.3 kg\" \"↑ 5.9\" \"下次 85 kg × 6\"; \"杠铃卧推\" \"79.1 kg\" \"↑ 2.3\" \"下次 65 kg × 8/8/7\" PR; \"上斜哑铃卧推\" \"31.4 kg\" \"↑ 0.9\" \"下次 27.5 kg × 6\" PR; "
     "\"坐姿哑铃推举\" \"28.2 kg\" \"持平\" \"下次 25 kg × 6\" PR; \"器械下拉\" \"65.9 kg\" \"↓ 3.1\" \"下次 52.5 kg × 6\" PR; \"垂直腿举\" \"147.6 kg\" \"↓ 2.9\" \"下次 115 kg × 6\" PR. "
     "The single lime focal element is the hero number \"PR 26 次\". ",
     '增量', "The outer bar has a thin ring track with no progress yet."),
    ('log', '记录 · 训练记录（P07）', '按时间倒序。数字来自演示数据「plain-prescription」。',
     "Screen: the log tab, training history. Title \"记录\" and a month header \"2026年9月\". A list of past sessions, newest first; each row: date, main regions, counts, total load, and an optional PR badge: "
     "\"9月29日 周二\" \"下肢\" \"5 个动作 · 13 组 · 56 分钟\" \"6,209 kg\"; \"9月28日 周一\" \"背 · 手臂 · 肩\" \"5 个动作 · 12 组 · 52 分钟\" \"3,035 kg\"; "
     "\"9月26日 周六\" \"胸 · 肩 · 手臂\" \"5 个动作 · 13 组 · 54 分钟\" \"3,260 kg\" badge \"PR ×4\"; \"9月22日 周二\" \"下肢\" \"4 个动作 · 10 组 · 68 分钟\" \"6,640 kg\" badge \"PR ×4\"; "
     "\"9月21日 周一\" \"背 · 手臂 · 肩\" \"5 个动作 · 12 组 · 55 分钟\" \"3,553 kg\" badge \"PR ×2\"; \"9月19日 周六\" \"胸 · 肩 · 手臂\" \"5 个动作 · 13 组 · 66 分钟\" \"3,073 kg\" badge \"PR ×2\". "
     "Each row could carry a tiny abstract marker of the trained regions. The single lime focal element is the most recent session row. ",
     '记录', "The outer bar has a thin ring track with no progress yet."),
    ('me', '我的（P11）', '档案与设置。',
     "Screen: the me tab. Title \"我的\". A profile summary card at the top with four facts: \"进阶\" \"60 分钟\" \"6 类器械\" \"男\", and the slogan \"慢慢变牛。\" in small text. "
     "Grouped settings list: group \"档案\": \"训练经验\" value \"进阶\", \"可用器械\" value \"杠铃、哑铃、固定器械、绳索、史密斯机、自重\", \"单次训练时长\" value \"60 分钟\", \"体型示意\" value \"男\"; "
     "group \"导航\": toggle \"显示今日进度环\" on, toggle \"显示休息倒计时描边\" on, \"休息结束提示\" value \"描边 + 振动\"; "
     "group \"数据\": \"载入示例数据\", \"清除全部数据\" (in a muted red); group \"关于\": \"人体图与动作示范：MuscleWiki\", \"版本 0.1.0\". "
     "The single lime focal element is the profile summary card's accent. ",
     '我的', "The outer bar has a thin ring track with no progress yet."),
    ('session', '训练进行中（P03，无导航）', '第 1 个动作做完 1 组，正在休息。',
     "Screen: the in-workout logging screen (no bottom navigation). Top bar: \"1 / 5\" progress, exercise title \"杠铃深蹲\", and a small \"暂停\" button. "
     "Current exercise card: target \"3 × 6–8\"; set rows: set 1 done \"85 kg × 6\" with a check mark; set 2 active with very large prefilled numbers \"85\" \"kg\" and \"6\" \"次\" that look tappable for editing; set 3 pending. "
     "A large primary button \"完成这一组\" (the single lime focal element). A floating rest bar near the bottom: \"休息 2:15\" with a thin countdown stroke and small buttons \"−15 秒\" \"+15 秒\" \"跳过\". "
     "Below, collapsed upcoming exercises: \"器械站姿提踵 2 × 10–12 · 60 kg\", \"窄握下拉 3 × 6–8\", \"杠铃硬拉 3 × 6–8\", \"哑铃卧凳手腕伸展 2 × 10–12\". Designed for one-handed use. ",
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
    out = ["# 慢牛 Milo · Nano Banana 2 提示词包 v1（结构层）",
           "",
           "> 由 `design/hifi/prompts/build_prompts.py` 生成，勿手改。用途：给用户用 Nano Banana 2 出**视觉参考**（以视觉效果为主），和 Stitch 的方案一起对比。框架层的线框选定后会更新 v2，把布局描述换成选定的线框。",
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
