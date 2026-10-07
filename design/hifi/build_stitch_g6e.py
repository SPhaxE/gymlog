#!/usr/bin/env python3
"""Stitch · 6g 补：Pro 标与冻结卡提示的落点（线框 ?board=proentry W1–W4，用户 2026-10-07「通过」）。
  W1 容量页肌头面板「近 8 周 · 每周组数」+ Pro 标；W2 进步曲线页「对比另一个动作」+ Pro 标；W3/W4 牛龄页「这周快断了」一行。
    python3 design/hifi/tools/run_round.py g6 g6e
数字是演示示意，搭的时候换成引擎算出来的。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
INTENSITY = {k: t for k, _, t in r2.INTENSITY}
COMMON = r2.COMMON.replace('首页 / 身体 / 增量 / 记录 / 我的', '首页 / 容量 / 增量 / 记录 / 我的')
SUB = "This is a sub-page with NO bottom navigation; top bar = back arrow + title. "
PRO = "The Pro tag is a small outlined pill reading 'Pro ›' (bone hairline outline, NOT lime) placed at the right end of a block title; it is a link, not a button."

TREND = ("SCREEN: 容量页 with a bottom sheet open (肌头详情面板). The page behind (a half-body muscle figure and a column of small capsules) is dimmed by a dark scrim. " + PRO + "\n"
  "- Sheet top: drag handle; title 股四头肌 · 外侧头, right side caption 下肢 · 达标.\n"
  "- Block 恢复: a thin progress bar at 72% with caption 再过 18 小时到黄金窗.\n"
  "- Block 近 7 天容量: condensed number 11 组 with caption 有效区间 8–16.\n"
  "- NEW block (the focal element of this sheet): title 近 8 周 · 每周组数 with the 'Pro ›' tag at the right; below it a bar chart of 8 weekly bars (values 7, 10, 12, 9, 13, 14, 5, 11; the 7th is a deload week, lower and hatched), a soft horizontal band behind the bars marking the effective range 8–16, the current week bar is solid bone, earlier bars are muted gray; x labels 8 周前 … 本周.\n"
  "- Bottom of sheet (thumb zone): an outlined full-width button 找练这块的动作. NO lime anywhere except at most one tiny accent.")
COMPARE = ("SCREEN: 进步曲线 (exercise progress curve, P10). " + SUB + PRO + "\n"
  "- Title 杠铃深蹲; hero condensed number 142.5 with unit kg 预估 1RM and a small delta +2.5.\n"
  "- A row under the number: an outlined chip 对比 · 杠铃前蹲 ✕ (selected state) and the 'Pro ›' tag at the right end.\n"
  "- A line chart (the focal element): solid bone line for 杠铃深蹲 rising over 12 sessions, a dashed muted gray line for 杠铃前蹲 rising more slowly, PR points as small diamonds on the solid line, a draggable vertical cursor on the last session with a two-line readout (杠铃深蹲 142.5 · 杠铃前蹲 112.5).\n"
  "- Legend under the chart: ━ 杠铃深蹲  ┅ 杠铃前蹲.\n"
  "- Section 最近 8 次 with 3 compact rows (date, 重量 × 次数, e1RM).\n"
  "- No lime button on this screen; lime only as the single cursor dot.")
RISK = ("SCREEN: 牛龄 (growth level page, P13). " + SUB + "\n"
  "- Top: a stage hero — mascot PLACEHOLDER (plain dark-gray rounded shape) standing in concentric weight-plate rings, caption 公牛 · 2 级 and a thin progress bar.\n"
  "- A stats card with three equal stats: 21 周 连胜 · 1 / 3 次 本周 · 0 张 冻结卡.\n"
  "- Directly under it, the NEW row (the focal element): a dark-gray card with a small round '!' mark and bold text 这周快断了：还差 2 次，只剩 1 天; caption 断了连胜从 0 开始。冻结卡会在没练够的那周自动用掉一张。; an outlined full-width button 兑一张冻结卡 · 800 牛劲; under it a quiet centered text link Pro 每月送 2 张 ›. NOT red (it is not an error); no lime.\n"
  "- Below: section 最近 12 周 with a row of 12 small rounded squares (solid = kept, gray = deload, hatched = freeze card used, dashed = missed, the last one outlined = this week).")

SCREENS = [('trend', '肌头面板 · 近 8 周', TREND, ('V2',)), ('compare', '曲线 · 动作对比', COMPARE, ('V2',)), ('risk', '牛龄 · 快断一行', RISK, ('V1', 'V2'))]
PAGES = {'g6': [(f'{k}-{v.lower()}', f'{n} · {v}', COMMON + "\n\n" + body + "\n\n" + INTENSITY[v]) for k, n, body, vs in SCREENS for v in vs]}

if __name__ == '__main__':
    out = os.path.join(HERE, 'g6', 'stitch-g6e.md')
    with open(out, 'w', encoding='utf-8') as f:
        for key, name, prompt in PAGES['g6']:
            f.write(f'## {key} · {name}\n\n```\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['g6']), '个提示词')
