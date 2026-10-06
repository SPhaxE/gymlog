#!/usr/bin/env python3
"""Stitch · 阶段 6b 返工：增量页的页头 + 摘要首屏（用户 2026-10-06 验收：页头没有设计感、摘要数字看不懂、下滑页头贴顶、行内小曲线对不齐）。
4 种结构 × V2 均衡强度。给 tools/run_round.py 用：python3 design/hifi/tools/run_round.py gains g8
数字取自演示数据的真实输出；所有数字都带单位（「个动作」「次」）。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, f'build_stitch_{name}.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
r2 = load('r2')
V2 = {k: t for k, _, t in r2.INTENSITY}['V2']

SHARED = ("SCREEN: 增量 tab, answers \"am I getting stronger, and how much should I add next time\". The page scrolls as ONE piece: the header hero scrolls away with the list (NOT pinned); only the filter chip row sticks under the status bar when scrolled. Draw the screen at scroll position 0.\n"
    "Every number must carry its unit or noun; no unexplained digits, no invented English labels.\n"
    "Facts to show (do not change numbers): 15 exercises trained in the last 4 weeks: 4 rising, 8 flat, 2 falling, 1 with only a baseline record (4+8+2+1 = 15); the full list below has 19 exercises in total. "
    "26 personal records (PR) broken in the last 4 weeks. Status line: 无需减量. Filter chips: 全部 (selected) · 下肢 · 背 · 胸 · 肩 · 手臂 · 核心. "
    "Below the hero, group 该加重 (3 个动作) with rows: 上斜哑铃卧推 [PR] 下次 27.5 kg × 6 · 31.4 kg ▲ +0.9 kg; 坐姿哑铃推举 [PR] 下次 25 kg × 6 · 28.2 kg = 持平; 杠铃深蹲 下次 85 kg × 6 · 100.3 kg ▲ +5.9 kg. "
    "Each row has a small sparkline in a FIXED-width column: all sparklines start at the same x and share the same vertical band so they line up down the list, vertically centred on the row. The values column is fixed width, right aligned. "
    "Then the start of group 保持，次数 +1 (14 个动作). The ONLY lime (#D4FF3A) element on the whole screen is the 该加重 group head. PR chip = solid bone-white with star. Bottom: floating pill navigation 首页 / 身体 / 增量 / 记录 / 我的, selected 增量 bone.")

HERO = [
    ('A', '配重片背景 + 一句话', "HERO: a very low-contrast large concentric weight-plate groove texture (machined rings, ruler ticks around the rim) filling the top ~38% of the screen as the page's hero background, cut by the screen edge. Over it, left aligned: caption 力量有没有在涨, title 增量, then ONE readable sentence in two lines: 近 4 周练了 15 个动作 / 4 个在涨 · 8 个持平 · 2 个在退 · 1 个刚开始记. Then a row: very large condensed number 26 with the words 次破纪录 and caption 近 4 周. No cards."),
    ('B', '刻度尺三段', "HERO: no card. Title 增量 with caption. Below it a long horizontal tick ruler (fine ticks like a measuring tape) divided into three labelled segments proportional to 4 : 8 : 2 : 1, labelled directly on the ruler 4 个在涨 ▲, 8 个持平 =, 2 个在退 ▼, 1 个刚开始记 (a tiny dashed segment) (words and shapes, not colour alone; the rising segment is bone-white solid, flat is mid grey, falling is dark with hatch). Under the ruler, left: condensed number 26 次破纪录 近 4 周; right: small text 无需减量."),
    ('C', '压缩大数字 + 色带', "HERO: an editorial layout. Title 增量 at left; at right, a huge condensed bone-white number 26 cropped slightly by the right edge with the label 次破纪录 beside it and caption 近 4 周. Under it one line: 近 4 周练了 15 个动作：4 个在涨 · 8 个持平 · 2 个在退 · 1 个刚开始记, each with its ▲ = ▼ glyph. Group heads below are full-width colour bands: 该加重 is a lime band with black text and an up arrow; 保持，次数 +1 is a grey band; 该减重 a dark grey band. No weight-plate texture."),
    ('D', '环形分三段', "HERO: a large ring (donut) at the left of the hero, split into four arc segments proportional to 4 : 8 : 2 : 1 (rising bone-white, flat mid grey, falling hatched dark, baseline dashed outline), thin tick marks around the outside, in the centre the condensed number 15 with the words 个动作 近 4 周. At the right of the ring a legend with four lines: ▲ 4 个在涨 / = 8 个持平 / ▼ 2 个在退 / 1 个刚开始记; under the legend 26 次破纪录 近 4 周. Title 增量 and caption above. A very faint plate texture behind the ring."),
]
PAGES = {'gains': [(k, n, r2.COMMON + "\n\n" + SHARED + "\n" + h + "\n\n" + V2) for k, n, h in HERO]}

def main():
    out = ["# gains · Stitch 阶段 6b 返工（页头 + 摘要首屏 4 种结构）", "", "> 由 `design/hifi/build_stitch_g8.py` 生成。", ""]
    for k, n, p in PAGES['gains']:
        out += [f"## g8-{k} · {n}", "", "```text", p, "```", ""]
    open(os.path.join(HERE, 'gains', 'stitch-g8.md'), 'w', encoding='utf-8').write('\n'.join(out)); print('wrote')

if __name__ == '__main__':
    main()
