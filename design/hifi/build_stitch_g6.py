#!/usr/bin/env python3
"""Stitch · 阶段 6g（会员）：按 2026-10-07 线框（用户「按你的倾向」）出视觉参考。
  付费墙 P20 = 线框 pro W2（用你的数据讲权益，方案分段 + 主按钮在拇指区）；开通成功 = pro W3；会员中心 P21 = prohub W1。
    python3 design/hifi/tools/run_round.py g6 g6
不收集任何支付信息，全程标「演示模式」；小牛是占位圆。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
INTENSITY = {k: t for k, _, t in r2.INTENSITY}
COMMON = r2.COMMON.replace('首页 / 身体 / 增量 / 记录 / 我的', '首页 / 容量 / 增量 / 记录 / 我的')
SUB = "This is a sub-page with NO bottom navigation; top bar = back arrow + title. "
DEMO = "A slim muted banner near the top: 演示模式 · 不收集支付信息，不扣费. NO payment fields, no card numbers anywhere."

PAYWALL = ("SCREEN: Milo Pro 付费墙 (paywall, P20). " + SUB + DEMO + "\n"
  "- Heading 这 30 天，Pro 会多给你 (the focal element), caption 按你的训练数据算.\n"
  "- Four benefit rows, each 64 px tall: a big condensed value on the left and a one-line reason on the right: +525 牛劲 / 你这 30 天拿了 1,050，Pro ×1.5; 2 张冻结卡 / 月 / 断档那周自动用，连胜 21 周不会断; 会员价省 ¥33 / 杠铃腰带 ¥329 → ¥296; 周期自动编排 / 减量周到点自动插进处方.\n"
  "- A centered text link 看完整对比 ›.\n"
  "- BOTTOM (thumb zone): a three-segment control 月 ¥18 | 年 ¥128 | 试用 7 天 (年 selected, bone) with a small bone tag 省 40% above 年; under it the primary button 开通年度（演示，不扣费）(the single LIME element).")
SUCCESS = ("SCREEN: 开通成功 (Pro activated). NO bottom navigation, no back arrow. " + DEMO + "\n"
  "- Centered large round mascot PLACEHOLDER (plain dark-gray disc with a thin bone outline) with a soft celebratory glow behind it; heading 欢迎加入 Milo Pro; caption 年度会员 · 2027 年 10 月 7 日到期.\n"
  "- Three rows of what you just got: 冻结卡 ×2 / 已放进钱包; 牛劲 ×1.5 / 从下一次训练起; 会员价 / 商城已生效.\n"
  "- Bottom primary button 开始用 (the single LIME element).")
HUB = ("SCREEN: 会员中心 (member hub, P21). " + SUB + DEMO + "\n"
  "- A member card at the top (the focal element): Milo Pro · 年度 with a small tag 已开通; caption 2027 年 10 月 7 日到期.\n"
  "- Caption 这个月 Pro 给了你, then three equal stat tiles with condensed numerals: +525 牛劲; 2 / 0 冻结卡 领 / 用; ¥33 会员价省.\n"
  "- A list of benefit rows with chevrons (48 px each): 周期计划自动编排; 高级分析; 钱包（冻结卡）; 商城（会员价）.\n"
  "- At the very bottom a quiet underlined text 管理订阅（演示：切回免费）. NO lime button on this screen (no pressure to buy more); lime appears only as tiny accents if at all.")

SCREENS = [('pro', '付费墙 P20', PAYWALL, ('V1', 'V2')), ('success', '开通成功', SUCCESS, ('V2',)), ('hub', '会员中心 P21', HUB, ('V1', 'V2'))]
PAGES = {'g6': [(f'{k}-{v.lower()}', f'{n} · {v}', COMMON + "\n\n" + body + "\n\n" + INTENSITY[v]) for k, n, body, vs in SCREENS for v in vs]}

if __name__ == '__main__':
    os.makedirs(os.path.join(HERE, 'g6'), exist_ok=True)
    out = os.path.join(HERE, 'g6', 'stitch-g6.md')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('# 6g · Stitch（付费墙 / 开通成功 / 会员中心）\n\n> 由 `design/hifi/build_stitch_g6.py` 生成。\n\n')
        for key, name, prompt in PAGES['g6']:
            f.write(f'## {key} · {name}\n\n```text\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['g6']), '个提示词')
