#!/usr/bin/env python3
"""Stitch · 阶段 6d：「我的」P11（并入成长层，线框 me2 W1 / W2 / W3）与牛龄页 P13（线框 level W1 / W2 / W3）× 视觉语言 v2 × 3 个强度，外加两张附属屏。
给 tools/run_round.py 用（页面 = me，两页都放在 design/hifi/me/ 下）：
    ONLY=p11-w2-v1,p11-w2-v2,p11-w2-v3 python3 design/hifi/tools/run_round.py me m6
键 = <屏>-<线框>-<强度>：p11-w2-v2 = 「我的」线框 W2、强度 V2；p13-w1-v3 = 牛龄页线框 W1、强度 V3；sheet = 档案编辑面板；dlg = 清除全部数据确认。
数字沿用线框里的示意值（壮牛 2 级、连胜 9 周……），真实数字做页面时由引擎实算。
小牛（IP）的位置只要求一个中性圆形占位：真实小牛插画做页面时换成 public/mascot 的素材。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, f'build_stitch_{name}.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


r2 = load('r2')
INTENSITY = {k: t for k, _, t in r2.INTENSITY}

AVATAR = "a round avatar PLACEHOLDER (plain dark gray disc with a thin bone outline, no drawing inside; the real mascot art is placed later)"

P11 = (
    "SCREEN: 我的 tab (P11), the profile + growth + settings root page. Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的 with 我的 selected (bone inner pill), outer outline a thin closed progress ring. "
    "Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen besides the navigation ring.\n"
    "Page title 我的 (large). The top part differs per STRUCTURE below; the lower part is the same in every structure, grouped lists (each group has a small caption, rows are at least 48 px tall inside one rounded container, hairline tick dividers, no card-in-card):\n"
    "  Group 钱包与会员: 钱包 · 商城 {wallet} with chevron; 会员 value 未开通 with chevron; 消息 value 3 条新 with chevron.\n"
    "  Group 导航: 显示今日进度环 (switch ON); 显示休息倒计时描边 (switch ON); 休息结束提示 value 描边 + 振动 with chevron.\n"
    "  Group 数据: 载入示例数据 with chevron; 导出 CSV with chevron; 演示：会员状态 with a small two-segment control 非会员 | 会员 (非会员 selected, bone); 清除全部数据 in muted red.\n"
    "  Group 关于: 人体图与动作示范 value MuscleWiki; 版本 value 0.1.0.\n"
    "The page scrolls under the navigation bar, so the lower groups are partly cut off at the bottom of the screen."
)

P11_STRUCT = {
    'w1': (
        "STRUCTURE W1 (growth row on top): directly under the title a slim growth row: " + AVATAR + " 48 px, the text 壮牛 · 2 级 with a thin progress bar at 62% under it and the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级, 连胜 9 周 on the right in condensed numerals, and a chevron (the whole row opens the growth page). "
        "Under it a 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups. 钱包 · 商城 value is 6,060 牛劲.",
        "6,060 牛劲",
    ),
    'w2': (
        "STRUCTURE W2 (growth card is the hero): directly under the title one large dark card (the focal element of the screen): " + AVATAR + " 56 px at the left, 壮牛 · 2 级 in a large heading, a progress bar at 62% (the bar fill is the single LIME element), the caption 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; "
        "a hairline divider; then three stats in condensed numerals: 9 周 连胜, 2 / 4 次 本周, 6,060 牛劲; a chevron at the right (the whole card opens the growth page). "
        "Under the card a small caption 档案 and a 2×2 grid of SHORTER profile tiles (caption on top, condensed value below): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. Then the groups; 钱包 · 商城 has NO value (the balance is already in the card).",
        "",
    ),
    'w3': (
        "STRUCTURE W3 (profile first, growth band): directly under the title the 2×2 grid of profile tiles (each tile: small caption on top, big condensed value below; the whole tile is tappable): 训练经验 进阶; 单次时长 60 分钟; 可用器械 6 类; 体型示意 男 · 72 kg. "
        "Under the grid a single growth band (one row, about 56 px): " + AVATAR + " 36 px, 壮牛 · 2 级 with the caption 连胜 9 周 under it, and at the right 6,060 in condensed numerals with the caption 牛劲, then a chevron (the whole band opens the growth page). Then the groups; 钱包 · 商城 has NO value.",
        "",
    ),
}

P13 = (
    "SCREEN: 牛龄 (P13), a sub-page opened from 我的: task-flow page with NO bottom navigation; top bar = back arrow + title 牛龄. "
    "Every number carries its unit or noun; no invented English labels; do not change numbers; at most ONE lime (#D4FF3A) element on the screen.\n"
    "Data for this page: current form 壮牛 · 2 级 (stages in order: 牛犊 · 小牛 · 壮牛 · 公牛 · Milo, each with 3 sub-levels); progress to the next level 62%, shown as the actionable sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级 and the alternative 或再完成 1 个训练周期; "
    "streak 连胜 9 周, this week 本周 2 / 4 次, freeze cards 冻结卡 1 张; the last 12 weeks as a strip of 12 small squares (solid = kept, gray = deload week, hatched = saved by a freeze card, dashed outline = missed, thick outline = this week) with a one-line legend; "
    "a growth log, newest first: 10/2 升级：壮牛 2 级 +100; 9/28 连胜 8 周 +100; 9/22 PR：杠铃深蹲 142 → 145 kg +30; 9/14 完成第 5 个训练周期 +200 (the +100 etc. are 牛劲, in condensed numerals); "
    "and a small footnote 删除训练后，成长值和连胜会重新计算，可能降级；降级不弹窗，只在这里写明。"
)

P13_STRUCT = {
    'w1': ("STRUCTURE W1 (the mascot is the hero, vertical narrative): a big stage block at the top: " + AVATAR + ", enlarged to about 160×120 px, the heading 壮牛 · 2 级, a progress bar at 62% (lime fill = the single lime element), the sentence and the alternative below it; "
           "then a 3-cell stat row (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡), then the label 最近 12 周 with the strip and legend, then the label 成长记录 with the log rows and the footnote."),
    'w2': ("STRUCTURE W2 (two tracks side by side): two equal cards next to each other at the top: LEFT = 牛龄 (long term): small " + AVATAR + " 64 px, 壮牛 · 2 级, a progress bar at 62%, caption 牛龄 · 长期; "
           "RIGHT = 连胜 (short term): a very large condensed 9 with 周, caption 连胜 · 本周 2 / 4 次, four small dots (2 filled, 2 empty), caption 冻结卡 1 张. "
           "Under them a filled row with 下一级：再涨 3 kg 杠铃卧推的预估 1RM and the alternative; then 成长记录 with a small three-segment filter 全部 | 守约周 | 升级 (全部 selected, bone) and the log rows; the 12-week strip may sit above the log; the footnote at the end."),
    'w3': ("STRUCTURE W3 (stair roadmap): a thin streak strip at the top (9 周 连胜 | 2 / 4 次 本周 | 1 张 冻结卡); then a vertical STAIR of the 5 stages, top to bottom Milo, 公牛, 壮牛, 小牛, 牛犊, each stage a row with 3 small pips for its sub-levels: "
           "stages above the current one are dimmed and empty; the current row 壮牛 is taller, highlighted, shows the " + AVATAR + " 48 px, the pips (2 filled, the 2nd one ringed as current) and the sentence 再涨 3 kg 杠铃卧推的预估 1RM，升 1 小级; "
           "stages below are completed (✓, all pips filled). Then 最近 12 周 strip with legend, then 成长记录 (two newest rows) and the footnote. The ringed current pip may be the single lime element."),
}

SHEET = (
    "SCREEN: a bottom sheet over a dimmed 我的 page: the profile editing sheet for 体型示意 and body weight. NO navigation bar visible (covered by the sheet). Sheet title 体型示意, a small close X at the right. "
    "Content: a two-segment control 男 | 女 (男 selected, bone) with the caption 只影响肌群图和动作示范的体型示意，不影响处方; below it a number field labelled 体重（可选） showing 72 with unit kg, a stepper −/+ at its right, "
    "and the helper line 不填也能用；填了，腰带知识卡和增量页的体重比才有依据; a full-width primary button 保存 at the bottom in the thumb zone (BONE button with black text, not lime). Every row at least 48 px. No invented English."
)

DLG = (
    "SCREEN: a centered confirmation dialog over a dimmed 我的 page. Dialog title 清除全部数据？, body text 档案、训练记录和进行中的训练都会删除，回到首次建档，不能撤销。 "
    "Two buttons: ghost 取消 and a danger button 清除 (danger = muted red outline / text, NOT lime). No navigation bar. Do not invent English. At most one accent element."
)


def build():
    items = []
    for key, (struct, wallet) in P11_STRUCT.items():
        for v in ('v1', 'v2', 'v3'):
            items.append((f'p11-{key}-{v}', f'P11 线框 {key.upper()} · {v.upper()}', r2.COMMON + "\n\n" + P11.replace('{wallet}', 'with value ' + wallet if wallet else '(no value)') + "\n" + struct + "\n\n" + INTENSITY[v.upper()]))
    for key, struct in P13_STRUCT.items():
        for v in ('v1', 'v2', 'v3'):
            items.append((f'p13-{key}-{v}', f'P13 线框 {key.upper()} · {v.upper()}', r2.COMMON + "\n\n" + P13 + "\n" + struct + "\n\n" + INTENSITY[v.upper()]))
    items.append(('sheet', '档案编辑面板（体型 + 体重）', r2.COMMON + "\n\n" + SHEET + "\n\n" + INTENSITY['V2']))
    items.append(('dlg', '清除全部数据确认', r2.COMMON + "\n\n" + DLG + "\n\n" + INTENSITY['V2']))
    return items


PAGES = {'me': build()}

if __name__ == '__main__':
    out = os.path.join(HERE, 'me', 'stitch-m6.md')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('# me · Stitch 阶段 6d（「我的」P11 三种结构 + 牛龄页 P13 三种结构 + 编辑面板 + 清除确认）\n\n> 由 `design/hifi/build_stitch_m6.py` 生成。\n\n')
        for key, name, prompt in PAGES['me']:
            f.write(f'## {key} · {name}\n\n```text\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['me']), '个提示词')
