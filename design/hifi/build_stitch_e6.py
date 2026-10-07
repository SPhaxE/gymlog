#!/usr/bin/env python3
"""Stitch · 阶段 6e（首页补全）：按用户 2026-10-07 选定的线框出视觉参考。
  P04 动作要领 = 线框 p04 W3（全屏示范 + 底部要领抽屉）
  检索面板    = 线框 finder W1（人体在右、结果在左，按整块肌肉点选；用户：只是检索器，可读性优先，不用容量页视效）
  替换动作    = 线框 swap W1（底部面板 · 候选列表）
  热身组      = 线框 warm W2（热身折成一条小胶囊）
  暂停确认    = 线框 pause W2（底部面板）
每屏两个强度（视觉语言 v2 的 V1–V3，见 build_stitch_r2.py），每个方案单独一个 Stitch 项目：
    python3 design/hifi/tools/run_round.py e6 e6
键 = <屏>-<强度>。人体只要求中性占位剪影，最终换 MuscleWiki 真实素材；示范视频只要求深色占位。"""
import importlib.util, os

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('r2', os.path.join(HERE, 'build_stitch_r2.py'))
r2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(r2)
INTENSITY = {k: t for k, _, t in r2.INTENSITY}
# 第 7 轮起导航第二项叫「容量」
COMMON = r2.COMMON.replace('首页 / 身体 / 增量 / 记录 / 我的', '首页 / 容量 / 增量 / 记录 / 我的')

HOME_DIM = ("Behind the sheet, the 首页 screen (title 今日处方, a hero card for 杠铃深蹲) is visible but dimmed by a dark scrim; the bottom navigation is covered by the sheet. ")

P04 = (
    "SCREEN: 动作要领 (exercise guide) for 杠铃深蹲, a full-screen sub-page opened during a workout (NO bottom navigation).\n"
    "- The whole screen behind is a looping exercise demonstration VIDEO: render it as a dark neutral placeholder frame with a faint gray human figure in a squat (no real person photo, no face), with a tiny caption © MuscleWiki in the top-right corner of the video.\n"
    "- Top bar over the video: a back arrow on the left, the title 杠铃深蹲, and on the right a small two-segment control 正面 | 侧面 (正面 selected in bone).\n"
    "- Under the top bar a slim translucent pill: 组间休息还在走 on the left and 1:35 on the right in condensed numerals.\n"
    "- A BOTTOM DRAWER (rounded top corners, solid dark surface, a small grabber) covers the lower ~42% of the screen, entirely in the thumb zone: "
    "first a large one-line cue 核心收紧，蹲到大腿平行或略低，膝盖朝脚尖方向 (the single LIME element is a short lime bar or lime numeral accent next to this cue, not the whole text); "
    "then three numbered steps: 1 杠铃放上斜方肌，脚略宽于肩、脚尖外八; 2 吸气屏住，屈髋屈膝同时下蹲; 3 蹲到大腿平行，脚掌全踩发力站起; "
    "then a hint row 往上拉：练到的肌头 · 我的进步 with a small up chevron. Text over video must keep strong contrast; the drawer itself is opaque."
)

FINDER = (
    "SCREEN: 找动作 (exercise finder) bottom sheet, opened from the home tab via ＋ 加一个动作. " + HOME_DIM + "\n"
    "PRIORITY: READABILITY. This is a utility search tool: flat, high-contrast, calm. NO glow, NO gradients on the body, NO scan lines, NO neon effects.\n"
    "- The sheet is almost full height (top at about 8% of the screen), rounded top corners, a small grabber. Header: title 找动作 and a caption 先替你选了本周还差最多的：胸; a close ✕ at the top right.\n"
    "- TWO COLUMNS below the header. RIGHT column (about 48% width, the thumb zone): a large HALF human body silhouette, FRONT view, cut at the vertical midline with the cut edge on the column's LEFT side (the arm extends to the right), "
    "placed low in the sheet so its legs reach the bottom; render it as a flat diagram of muscle regions separated by thin gaps: unselected regions flat warm gray, the CHEST region (both chest heads) solid BONE as the selected state. "
    "Above the figure a tiny caption 点一块肌肉 = 选它 / 左边再细分到肌头. Under the figure, at the bottom right, a two-segment control 正面 | 背面 (正面 selected).\n"
    "- LEFT column (about 48% width): a big heading 胸 with a caption 19 个动作; a row of three small refinement chips 全部 · 上胸 · 中下胸 (全部 selected in bone); a row with the caption 只看我有的器械 and a small chip 器械 ▾; "
    "then a plain list of exercises, each row two lines with a hairline divider: bold name, then a muted line with equipment and last weight: "
    "杠铃卧推 / 杠铃 · 上次 80 kg; 哑铃卧推 / 哑铃 · 上次 30 kg; 哑铃飞鸟 / 哑铃 · 上次 14 kg; 上斜哑铃卧推 / 哑铃 · 上次 26 kg; 坐姿推胸机 / 固定器械 · 上次 55 kg; 杠铃上斜卧推 / 杠铃 · 首次; 下斜哑铃飞鸟 / 哑铃 · 首次; "
    "the list fades out at the bottom. Exactly ONE lime element on the screen: a small lime count badge or the selected chip outline, nothing else."
)

SWAP = (
    "SCREEN: 换掉 杠铃深蹲 (swap exercise) bottom sheet during a workout. " + HOME_DIM + "\n"
    "- Sheet header: title 换掉 杠铃深蹲 and caption 同练股四头 · 同器械优先 · 只换今天.\n"
    "- A list of four candidate rows (each at least 60 px tall, radio circle on the left, hairline dividers): 器械站姿深蹲 / 固定器械 · 股四头肌 · 臀大肌 / right: 70 kg (selected radio, bone); "
    "哑铃高脚杯深蹲 / 哑铃 · 股四头肌 · 臀大肌 / 首次; 杠铃前蹲 / 杠铃 · 股四头肌 / 首次; 腿举 / 固定器械 · 股四头肌 · 臀大肌 / 120 kg.\n"
    "- A full-width primary button at the bottom of the sheet: 换成 器械站姿深蹲 — the single LIME element."
)

WARM = (
    "SCREEN: 首页 tab DURING a workout (training is done on the home page). Layout:\n"
    "- Small caption 10月3日 周六 · 训练中 18 分钟, title 今日处方, a small text link 结束训练 on the right.\n"
    "- The HERO CARD of the current exercise: small label 第 1 个 · 下肢 · 0 / 3 组, exercise name 杠铃深蹲, two small text links on the right 要领 and 换一个. "
    "Inside the card, near the top, a WARM-UP strip: the caption 热身 then three small pill chips 35×8 (done, with a check, bone filled), 50×5, 67.5×3 (outlined), and a muted caption 不计入容量和新纪录 · 点一颗算做完一组. "
    "Then a hairline divider and three working-set rows with big condensed numbers: row 1 85 kg × 7 highlighted as the current set with a small 打卡 button; rows 2 and 3 85 kg × 7 muted with empty circles.\n"
    "- Below the card a short list 接下来 with 器械站姿提踵 / 窄握下拉.\n"
    "- Bottom: a small REST-TIMER capsule (bone outline, 1:35) on the left of a wide primary button 打卡第 1 组 · 85 kg × 7 (the single LIME element), just above the navigation bar.\n"
    "- Navigation as described, 首页 selected; the outer lime ring shows 2 of 13 sets done (a short lime arc)."
)

PAUSE = (
    "SCREEN: 暂停训练？ (pause workout) bottom sheet, triggered by the system back gesture during a workout on the home tab. " + HOME_DIM + "\n"
    "- Sheet content: title 暂停训练？; body text 已记的 6 组都在。回来从「杠铃硬拉 第 1 组」接着练，休息计时也会停。点面板外面 = 继续练。\n"
    "- Two full-width buttons stacked at the bottom (thumb zone): primary 暂停 (BONE solid with black text), secondary 结束并结算 (outlined). No lime on this screen except the dimmed navigation ring behind."
)

SCREENS = [('p04', '动作要领 P04', P04, ('V2', 'V3')), ('finder', '找动作 检索面板', FINDER, ('V1', 'V2')), ('swap', '替换动作', SWAP, ('V1', 'V2')),
           ('warm', '热身组（训练中首页）', WARM, ('V1', 'V2')), ('pause', '暂停训练确认', PAUSE, ('V1', 'V2'))]
PAGES = {'e6': [(f'{k}-{v.lower()}', f'{n} · {v}', COMMON + "\n\n" + body + "\n\n" + INTENSITY[v]) for k, n, body, vs in SCREENS for v in vs]}

if __name__ == '__main__':
    out = os.path.join(HERE, 'e6', 'stitch-e6.md')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('# 6e · Stitch（动作要领 / 检索面板 / 替换 / 热身 / 暂停）\n\n> 由 `design/hifi/build_stitch_e6.py` 生成。\n\n')
        for key, name, prompt in PAGES['e6']:
            f.write(f'## {key} · {name}\n\n```text\n{prompt}\n```\n\n')
    print('写入', os.path.relpath(out), len(PAGES['e6']), '个提示词')
