#!/usr/bin/env python3
"""Stitch · 阶段 6a：故事引导（线框 A / B 各第 1、3 屏）、训练进行中（线框 W2）、训练结算（ia §1.7）× 视觉语言 v2。
PAGES[页面] = [(键, 名称, 提示词)]，给 tools/run_round.py 用（轮次名 s6）：python3 design/hifi/tools/run_round.py story s6
小牛插画只留占位（真实素材是 IP 小牛 PNG），数字都是引擎实算的演示值。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
COMMON = r2.COMMON.replace('No photos, no cows, no logos.', 'No photos, no logos. Do NOT draw any animal: where a mascot is needed leave a softly lit empty stage area labelled only by its size (the real mascot PNG is placed later).')
INTENSITY = {k: t for k, _, t in r2.INTENSITY}

STORY_TXT = [('米洛（Milo）每天扛起一头小牛', '古希腊的大力士，每天扛着同一头小牛走一圈。'),
             ('Milo 告诉你：下一组，该加多少', '每次只多一点，慢慢变牛。这就是渐进超负荷。')]
NO_NAV = "No navigation bar on this screen (onboarding / task flow)."

def story(dirn, i):
    h, b = STORY_TXT[i]
    if dirn == 'A':
        stage = ("- Top: a small text link 跳过 at the top right.\n- A large rounded STAGE area taking the upper ~50% of the screen, with a subtle concentric weight-plate groove texture and a soft spotlight; "
                 + ("a mascot placeholder (small, ~1/3 of stage width) stands on a thin ground line." if i == 0 else
                    "a small mascot placeholder at the top of the stage, and in front of it a prescription card: small label 下一组 · 杠铃卧推, a very large condensed number 85 with small kg, on the right a lime chip +2.5, and a caption 上次 82.5 kg × 8 / 8 / 8，全部做到上限.") + "\n"
                 f"- Below the stage: a big headline {h} (2 lines max) and one line of body text {b}.\n- Page dots (3, the {'first' if i == 0 else 'third'} active as a short bone pill).\n"
                 f"- A full-width button at the bottom: {'下一步 (bone, neutral)' if i == 0 else '开始建档 (LIME, the single focal element)'}.")
    else:
        stage = ("- Top: a small text link 跳过 at the top right.\n- One continuous horizontal scene: a ground line across the screen at ~45% height, mascot placeholders walking left to right growing in size "
                 f"(the current one sharp, the previous / next ones faded at the screen edges); under the ground line a calibrated kg ruler with ticks 55 · 57.5 · 60 · 62.5 · 65 · 67.5 · 70, "
                 f"the current value highlighted: {'60 kg' if i == 0 else '65 kg with a lime +2.5 tag (the single focal element)'}.\n"
                 f"- Large left-aligned headline {h} and body text {b} in the lower part.\n- Page dots bottom-left; "
                 + ("a small hint 点任意处继续 → bottom-right, no button." if i == 0 else "a full-width bone button 开始建档 at the bottom."))
    return f"SCREEN: onboarding story, screen {1 if i == 0 else 3} of 3 (direction {dirn}). {NO_NAV}\n{stage}"

SESSION = ("SCREEN: workout in progress (P03), task flow. " + NO_NAV + "\n"
    "- Top bar: back arrow, title 训练中 with elapsed time 12:40 in condensed numbers, a small bone outline button 结束 on the right; under it a progress strip of 13 short segments (3 done).\n"
    "- A floating rest timer pill near the top: 休息 1:35 (condensed), buttons −15 秒 · +15 秒 · 跳过, with a thin lime arc showing remaining time (the single focal element while resting).\n"
    "- Exercise header: 杠铃深蹲, caption 3 × 6–8 · 休息 3:00, a small link 要领.\n"
    "- A set TABLE for this exercise: columns 组 / 重量 / 次数 / 完成. Row 1: 1 · 85 kg · 8 · done check; row 2 (current, highlighted surface): 2 · editable fields 85 kg and 8 次 with a bone button 完成; row 3: 3 · 85 · 8 · empty circle (dimmed).\n"
    "- Below: section label 接下来 with 2 compact rows: 器械站姿提踵 2 × 10–12 60 kg; 窄握下拉 3 × 6–8 首次.\n"
    "- Bottom third: an inline numeric keypad (keys 1–9, ., 0, delete, plus two step keys −2.5 and +2.5) styled as dark rounded keys with condensed digits.")

SUMMARY = ("SCREEN: workout summary (P05), task flow, right after saving. " + NO_NAV + "\n"
    "- Header: small caption 10月6日 周一 · 下肢 · 背, title 练完了.\n"
    "- Hero result (the single LIME focal element): label 新纪录 · 杠铃深蹲, a very large condensed 预估 1RM 101.5 kg and a lime delta +2.3 kg next to it, caption 上次 99.2 kg.\n"
    "- A row of 3 stat tiles with condensed numbers: 时长 52:10 · 组数 13 · 总负荷 6,340 kg, fine tick dividers.\n"
    "- Section 逐个动作 (list rows, delta on the right): 杠铃深蹲 101.5 kg ▲ 2.3; 器械站姿提踵 76.0 kg ▲ 1.0; 窄握下拉 首次记录，作为基线; 杠铃硬拉 首次记录，作为基线; 哑铃卧凳手腕伸展 未做 (dimmed tag).\n"
    "- A growth row: small mascot placeholder (circle avatar), text 成长值 +8 · 壮牛 2 级, a thin progress bar.\n"
    "- A compact rating row 力竭度 with a 1–10 slider set to 8, caption 用来算恢复窗口，可跳过.\n"
    "- Next-time line: 下肢约 52 小时后恢复 · 下次处方已更新.\n"
    "- A full-width bone button 完成 at the bottom.")

PAGES = {
    'story': [('A1', 'A 三幕插画 · 第 1 屏', COMMON + "\n\n" + story('A', 0) + "\n\n" + INTENSITY['V2']),
              ('A3', 'A 三幕插画 · 第 3 屏', COMMON + "\n\n" + story('A', 1) + "\n\n" + INTENSITY['V2']),
              ('B1', 'B 一条成长线 · 第 1 屏', COMMON + "\n\n" + story('B', 0) + "\n\n" + INTENSITY['V2']),
              ('B3', 'B 一条成长线 · 第 3 屏', COMMON + "\n\n" + story('B', 1) + "\n\n" + INTENSITY['V2'])],
    'session': [(k, n, COMMON + "\n\n" + SESSION + "\n\n" + t) for k, n, t in r2.INTENSITY],
    'summary': [(k, n, COMMON + "\n\n" + SUMMARY + "\n\n" + t) for k, n, t in r2.INTENSITY],
}


def main():
    for page, items in PAGES.items():
        os.makedirs(os.path.join(HERE, page), exist_ok=True)
        out = [f"# {page} · Stitch 阶段 6a（视觉语言 v2）", "", "> 由 `design/hifi/build_stitch_s6.py` 生成。每个变体单独一个 Stitch 项目，GEMINI_3_8_FLASH，MOBILE。", ""]
        for k, n, p in items:
            out += [f"## s6-{k} · {n}", "", "```text", p, "```", ""]
        open(os.path.join(HERE, page, 'stitch-s6.md'), 'w', encoding='utf-8').write('\n'.join(out))
        print('wrote', page)


if __name__ == '__main__':
    main()
