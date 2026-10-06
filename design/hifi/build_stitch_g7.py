#!/usr/bin/env python3
"""Stitch · 阶段 6b 第 2 轮：增量总览页的 4 种「结构」方案（g6 只换视觉强度，这一轮换信息结构），统一用 V2 均衡强度。
给 tools/run_round.py 用：python3 design/hifi/tools/run_round.py gains g7。数字同 g6（演示数据真实输出）。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, f'build_stitch_{name}.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
r2, g6 = load('r2'), load('g6')
V2 = {k: t for k, _, t in r2.INTENSITY}['V2']

SHARED = ("Content (same data in every variant, do not change numbers): caption 力量有没有在涨, title 增量; 近 4 周破纪录 26 次; counters 4 ▲ 上升 · 8 = 持平 · 2 ▼ 下降 · 1 基线 (direction glyph + word); "
    "filter chips 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂; three groups 该加重 (3 个, caption 次数做满了，可以加一档), 保持，次数 +1 (14 个, caption 重量不变，每组多做 1 次), 该减重 (2 个, caption 有一组没做满，先退一档). "
    "Rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6, latest 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6, 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6, 100.3 kg ▲ +5.9 kg; 杠铃坐姿提踵 [PR] 下次 42.5 kg × 11, 56.7 kg = 持平. "
    "Each row also has a tiny sparkline (filled last point, diamond on PR points). The ONLY lime (#D4FF3A) element on the screen is the icon of the 该加重 group. PR tag = solid bone-white chip with star. "
    "Bottom floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 is a bone inner pill, outer outline is a thin closed progress ring. Rows are NOT tappable yet (no chevrons).")

STRUCT = [
    ('S1', '分组列表', "STRUCTURE: three stacked groups, each with a head (round icon + title + caption + count) followed by flat rows separated by hairlines. Summary card on top, chips below it. This is the baseline."),
    ('S2', '下次目标做主角', "STRUCTURE: target-first. Each row is a compact card where the NEXT target (e.g. 27.5 kg × 6) is the largest condensed number on the left, the exercise name and PR tag above it, and on the right the sparkline with latest value and delta stacked. Group heads are slim section labels. Summary condensed into one thin strip of 4 counters under the title."),
    ('S3', '结论分段', "STRUCTURE: a 3-segment control directly under the chips: 该加重 3 · 保持 14 · 该减重 2 (the active segment 该加重 carries the lime icon); only the active group's rows are shown below as a single list, with its caption as a one-line explanation above the list. Summary is a horizontal row of 4 small stat blocks."),
    ('S4', '摘要带迷你图', "STRUCTURE: the summary card contains a small 4-week bar strip (4 bars labelled 第1周…第4周 with PR counts 5 · 8 · 6 · 7) next to the big number 26 次; below it the 4 counters. Then chips, then groups as in a flat list with group heads. Row layout: name + 下次 line on the left, sparkline center, value + delta right."),
]
PAGES = {'gains': [(k, n, r2.COMMON + "\n\n" + "SCREEN: 增量 tab (P09), answers \"am I getting stronger, and how much should I add next time\".\n" + SHARED + "\n" + s + "\n\n" + V2) for k, n, s in STRUCT]}

def main():
    out = ["# gains · Stitch 阶段 6b 第 2 轮（4 种结构）", "", "> 由 `design/hifi/build_stitch_g7.py` 生成。", ""]
    for k, n, p in PAGES['gains']:
        out += [f"## g7-{k} · {n}", "", "```text", p, "```", ""]
    open(os.path.join(HERE, 'gains', 'stitch-g7.md'), 'w', encoding='utf-8').write('\n'.join(out)); print('wrote')

if __name__ == '__main__':
    main()
