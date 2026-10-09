#!/usr/bin/env python3
"""Stitch · 走查 1（2026-10-09）：动作要领视频页重做，用户选定线框 p04v2 W3（关键帧分步），步骤文字照常写、不写「第几帧」。
每个强度单独一个 Stitch 项目：python3 design/hifi/tools/run_round.py v7 v7
示范视频只要求深色占位（16:9 完整画面，不裁）；人体只要求中性占位剪影，最终换 MuscleWiki 真实素材。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
INTENSITY = {k: t for k, _, t in r2.INTENSITY}
COMMON = r2.COMMON.replace('首页 / 身体 / 增量 / 记录 / 我的', '首页 / 容量 / 增量 / 记录 / 我的')

GUIDE = (
    "SCREEN: 动作要领 (exercise guide) for 史密斯机罗马尼亚硬拉, a sub-page opened during a workout (NO bottom navigation). "
    "Problem we are fixing: the demo video used to be cropped into a tall strip (head cut off, blurry, cheap). Now the demo is shown COMPLETE, never cropped.\n"
    "- Top bar: a back arrow on the left and the title 史密斯机罗马尼亚硬拉. Under it a slim translucent pill: 组间休息还在走 on the left and 1:35 on the right in condensed numerals.\n"
    "- A full-width 16:9 VIDEO card (rounded corners, content width) right under the top bar: a dark neutral studio frame with a faint gray human figure performing a Romanian deadlift holding a Smith machine bar, "
    "the whole body visible with headroom (NOT cropped, no real person photo, no face detail); a tiny © MuscleWiki caption bottom-right; a thin progress line along the bottom edge shows the short looping segment of the CURRENT step.\n"
    "- Under the video one row: a two-segment control 正面 | 侧面 (正面 selected in bone) on the left, a small caption 点一步，看那一段 on the right.\n"
    "- A large one-line cue: 髋部后推，杠贴腿下滑，背部始终平直 (the single LIME accent of the screen is a short lime bar before this cue).\n"
    "- FOUR STEPS, each a full-width row with a small 16:9 KEYFRAME thumbnail on the left (a still of the same video at that pose: gray figure standing / hinging / at the bottom / standing up) and the step text on the right; "
    "NO frame numbers or labels on the thumbnails. Step texts: 双脚略前于杠，与髋同宽，握杠站直 / 膝微屈，髋向后推，杠沿大腿下放 / 腘绳肌明显拉伸时停下，背保持平直 / 髋向前顶起站直，不过度挺腰. "
    "The SECOND step is the current one: its thumbnail has a bone outline and its text is primary and bolder; the other rows are secondary. Rows are separated by hairline ticks, each at least 56 tall.\n"
    "- Below, partly visible: a section 练到的肌头 with a small half human silhouette (back view) highlighting the hamstrings, and a short list 腘绳肌 主练 · 臀大肌 主练 · 竖脊肌 协同."
)

PAGES = {'v7': [(f'guide-{v.lower()}', f'动作要领 W3 · {v}', COMMON + "\n\n" + GUIDE + "\n\n" + INTENSITY[v]) for v in ('V1', 'V2', 'V3')]}

if __name__ == '__main__':
    out = os.path.join(HERE, 'v7', 'stitch-v7.md'); os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('# 走查 1 · Stitch（动作要领视频页 W3 关键帧分步）\n\n> 由 `design/hifi/build_stitch_v7.py` 生成。\n\n')
        for key, name, prompt in PAGES['v7']:
            f.write(f'## {key} · {name}\n\n```text\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['v7']), '个提示词')
