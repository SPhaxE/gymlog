#!/usr/bin/env python3
"""Stitch · 6h 触点静态稿（线框 ?board=touch，用户 2026-10-07「按你的倾向」= W1 通知 + W2 小组件 A + W3 的 2×2 小牛连胜 + W4 图标与启动）。
    python3 design/hifi/tools/run_round.py touch t6
这些是「App 外面」的系统界面：Android 通知栏、桌面、启动页。只做设计稿；数字是演示示意。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
INTENSITY = {k: t for k, _, t in r2.INTENSITY}
BRAND = ("BRAND: app name 慢牛 Milo, a fitness progressive-overload engine. Palette: warm near-black #0E0E0D surfaces, bone #E9E3D3 for selected / solid neutral, "
  "a single acid lime #D4FF3A used only on the logo's two horn bars (and at most one focal accent). Numbers in a condensed sans (Barlow Condensed), UI text Noto Sans SC. "
  "LOGO: a bull head made of 9 vertical bars getting longer toward the middle (progressive overload), lower edge forming a V-shaped face, the two outer 'horn' bars lime, whole mark slanted 11°. "
  "No English decorative labels, no fake technical tags, no invented numbers beyond those given. Chinese UI text exactly as written.")
NOTI = ("SCREEN: Android notification shade pulled down over a dark wallpaper (system UI, not the app). Status bar 18:00 at top, a row of quick-setting circles (generic, muted), then a stack of 4 notifications from 慢牛 Milo, each a rounded card: "
  "small app glyph (the bar logo, monochrome) + '慢牛 Milo · time' header, bold title, one-line body, optional text action buttons, and a large icon on the right showing the logo in a state.\n"
  "1) header 刚刚; title 休息结束 · 第 3 组; body 杠铃深蹲 85 kg × 6; actions 打卡 and +30 秒; large icon = logo leaning forward with speed lines (training).\n"
  "2) header 周六 18:00; title 这周还差 2 次; body 周日前练够，连胜 21 周保住；手上有 1 张冻结卡。 no actions; large icon = calm logo.\n"
  "3) header 10 分钟前; title 新纪录：杠铃深蹲; body 预估 1RM 102.5 kg，比之前最好 +2.5 kg; action 看看; large icon = logo with bars lighting up from both horns toward the middle (PR).\n"
  "4) header 昨天; title 该减量了; body 三个主项的预估 1RM 连降三次，建议 6 天减量周; action 看看; large icon = logo whose inner bars are half retracted with a faint ghost of their full length (deload).\n"
  "Also a lock-screen inset at the bottom showing the same PR notification collapsed to title only (privacy: no weights).")
WIDGET = ("SCREEN: Android home screen on a dark textured wallpaper (system UI). Status bar 18:00. Widgets from 慢牛 Milo occupy the top half, generic app icons (muted placeholders) the bottom half with the Milo app icon among them.\n"
  "- Widget 2×2 '今日': caption 今日 · 下肢 A, exercise 杠铃深蹲, big condensed 85 × 6, a small progress ring with 0 / 14 组.\n"
  "- Widget 2×2 '休息中' (training state): caption 训练中 · 休息, huge condensed countdown 1:35, a thin bone progress bar shrinking, caption 下一组：第 3 组.\n"
  "- Widget 4×2 '今日处方': header 今日处方 · 下肢 A · 约 55 分钟, three rows (name left, weight × reps right): 杠铃深蹲 85 × 6; 罗马尼亚硬拉 70 × 8; 坐姿腿屈伸 45 × 12; a small bone pill button 开始 bottom right.\n"
  "- Widget 2×2 '小牛': a cute geometric bull mascot PLACEHOLDER (rounded gray shape with lime horns) lying down resting, caption 21 周连胜 with the number large.\n"
  "Widgets: warm near-black, rounded 22 px corners, subtle concentric weight-plate groove texture, no glow, no lime except the logo horns.")
ICON = ("SCREEN: brand touchpoint sheet in a phone frame, light gray wallpaper (system UI). Top: the app icon (the bar bull logo on warm black, two lime horn bars) shown in three Android masks side by side — circle, rounded square, squircle — labeled 圆 / 圆角方 / 方圆, "
  "plus a themed monochrome version (single tint, outline only) labeled 主题图标. Middle: a large splash screen card: centered horizontal lockup '慢牛 Milo' with the logo, bars appearing one by one as a loading state (show 6 of 9 bars lit). "
  "Bottom: a home-screen row of 4 generic app icons with the Milo icon among them at 48 px, and a small-size ladder of the icon at 64 / 48 / 32 / 24 / 16 px.")
SCREENS = [('noti', '通知', NOTI, ('V1', 'V2')), ('widget', '桌面小组件', WIDGET, ('V1', 'V2')), ('icon', '图标与启动', ICON, ('V2',))]
PAGES = {'touch': [(f'{k}-{v.lower()}', f'{n} · {v}', BRAND + "\n\n" + body + "\n\n" + INTENSITY[v]) for k, n, body, vs in SCREENS for v in vs]}

if __name__ == '__main__':
    out = os.path.join(HERE, 'touch', 'stitch-t6.md')
    with open(out, 'w', encoding='utf-8') as f:
        for key, name, prompt in PAGES['touch']:
            f.write(f'## {key} · {name}\n\n```\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['touch']), '个提示词')
