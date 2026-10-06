#!/usr/bin/env python3
"""Stitch · 阶段 6b：增量总览页（P09，线框 gains-W2）× 视觉语言 v2 × 三档强度。
PAGES['gains'] = [(键, 名称, 提示词)]，给 tools/run_round.py 用（轮次名 g6）：python3 design/hifi/tools/run_round.py gains g6
数字取自演示数据的真实输出（GainRow 的字段），页面里的荧光只有「该加重」的图标一处。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)

GAINS = ("SCREEN: 增量 tab (P09), answers \"am I getting stronger, and how much should I add next time\". Layout is fixed:\n"
    "- Header: small caption 力量有没有在涨, title 增量 (left); a small decorative concentric weight-plate ornament at the top right (not tappable).\n"
    "- Summary card: caption 近 4 周破纪录 with a very large condensed number 26 and small 次; below, four counters with condensed numbers, each with a direction glyph AND a word (not colour alone): 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线.\n"
    "- A horizontally scrolling filter chip row: 全部 (selected, bone) · 下肢 · 背 · 胸 · 肩 · 手臂 (the last chip cut off by the right edge with a soft fade).\n"
    "- Group 1 head: round icon with an up arrow — THIS ICON IS THE ONLY LIME (#D4FF3A) ELEMENT ON THE WHOLE SCREEN — title 该加重, caption 次数做满了，可以加一档, count 3 个 on the right.\n"
    "  Rows (each: name left, a tiny sparkline in the middle with a filled last point and a diamond on PR points, latest estimate right, delta under it, and under the name a line 下次 + target in condensed numbers):\n"
    "  上斜哑铃卧推 [PR tag] · 下次 27.5 kg × 6 · sparkline rising · 31.4 kg · ▲ +0.9 kg\n"
    "  坐姿哑铃推举 [PR tag] · 下次 25 kg × 6 · 28.2 kg · = 持平\n"
    "  杠铃深蹲 · 下次 85 kg × 6 · 100.3 kg · ▲ +5.9 kg\n"
    "- Group 2 head: round grey icon with an equals sign, title 保持，次数 +1, caption 重量不变，每组多做 1 次, count 14 个. Rows: 杠铃坐姿提踵 [PR tag] · 下次 42.5 kg × 11 · 56.7 kg · = 持平; the next row is cut off by the navigation bar.\n"
    "- The PR tag is a small solid bone-white chip with a star and the letters PR (NOT lime).\n"
    "- Bottom: floating pill navigation bar with 5 items 首页 / 身体 / 增量 / 记录 / 我的; selected 增量 is a bone inner pill with icon + label; the outer pill outline is a thin closed progress ring.\n"
    "- The list scrolls under the navigation bar; rows have no card backgrounds, only generous spacing and hairline dividers.")

PAGES = {'gains': [(k, n, r2.COMMON + "\n\n" + GAINS + "\n\n" + t) for k, n, t in r2.INTENSITY]}


def main():
    os.makedirs(os.path.join(HERE, 'gains'), exist_ok=True)
    out = ["# gains · Stitch 阶段 6b（视觉语言 v2）", "", "> 由 `design/hifi/build_stitch_g6.py` 生成。每个变体单独一个 Stitch 项目，GEMINI_3_8_FLASH，MOBILE。", ""]
    for k, n, p in PAGES['gains']:
        out += [f"## g6-{k} · {n}", "", "```text", p, "```", ""]
    open(os.path.join(HERE, 'gains', 'stitch-g6.md'), 'w', encoding='utf-8').write('\n'.join(out))
    print('wrote gains')


if __name__ == '__main__':
    main()
