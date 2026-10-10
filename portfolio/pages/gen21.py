"""P21 成果一览：15 屏。
15 台 Pixel 8 整组倾斜 11°（与封面、Logo 同一个角度）斜铺出血，奇偶列错开半格；上、下、左三边渐隐进页面底；
越靠中间越是标志性的屏（容量、首页、记录、增量…）。页头压图小号在左上，左下大数字。"""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from pf import *

TILT = 11
# 按「显眼程度」排：越靠前越放在中间
ORDER = ['body', 'today', 'log', 'gains', 'trend', 'body-detail', 'exercise', 'level', 'shop', 'pro', 'me', 'wallet', 'item', 'guide', 'messages']
NAME = {'today': '首页 · 今日处方', 'body': '容量', 'body-detail': '容量 · 肌头浮层', 'gains': '增量', 'trend': '进步曲线', 'log': '记录 · 钢板',
        'exercise': '动作要领', 'me': '我的', 'level': '牛龄', 'messages': '消息', 'wallet': '钱包', 'pro': '会员中心', 'shop': '商城',
        'item': '商品', 'guide': '知识卡'}


def main():
    pg = Page(21, '成果一览')
    pw = 262; ph = FH * pw / FW; gx, gy = 300, 600          # 机身宽、列距、行距
    cx, cy = 1250, 520                                       # 整组中心（旋转中心）
    cols, rows = 5, 3
    slots = []
    for c in range(cols):
        for r in range(rows):
            x = cx + (c - (cols - 1) / 2) * gx - pw / 2
            y = cy + (r - (rows - 1) / 2) * gy - ph / 2 + (gy / 2 if c % 2 else 0) - gy / 4
            # 旋转后的真实中心：离「可见区中心」(1260, 540) 越近越显眼；左侧要压字，往右偏
            mx, my = x + pw / 2 - cx, y + ph / 2 - cy; a = math.radians(TILT)
            rx_, ry_ = cx + mx * math.cos(a) - my * math.sin(a), cy + mx * math.sin(a) + my * math.cos(a)
            slots.append((abs(ry_ - 540) * 1.6 + abs(rx_ - 1260) * 0.7, x, y))
    slots.sort()
    pg.add(f'<g data-name="15 屏" transform="rotate({TILT} {cx} {cy})">')
    for (_, x, y), name in zip(slots, ORDER):
        phone(pg, screen(name), x, y, pw, shadow=0.6, label=name)
        pg.add(text(x + 18, y + ph + 26, NAME[name], 14, 500, 'sans', BONE2, extra=f' data-name="{name}" data-bleed="1"'))
    pg.add('</g>')
    # 三边渐隐
    pg.defs.append(f'<linearGradient id="fT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BG}"/><stop offset="1" stop-color="{BG}" stop-opacity="0"/></linearGradient>'
                   f'<linearGradient id="fB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BG}" stop-opacity="0"/><stop offset="1" stop-color="{BG}"/></linearGradient>'
                   f'<linearGradient id="fL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{BG}"/><stop offset="0.5" stop-color="{BG}" stop-opacity="0.97"/><stop offset="0.78" stop-color="{BG}" stop-opacity="0.7"/><stop offset="1" stop-color="{BG}" stop-opacity="0"/></linearGradient>')
    pg.add(f'<rect x="0" y="0" width="{W}" height="300" fill="url(#fT)"/>',
           f'<rect x="0" y="{H - 360}" width="{W}" height="360" fill="url(#fB)"/>',
           f'<rect x="0" y="0" width="860" height="{H}" fill="url(#fL)"/>')

    header(pg, '成果一览', '每一屏都是 App 真渲染，不是效果图。', ['Pixel 8 参数（412 × 915 @2.625）· 深色 · 演示数据'], y=110, small=True)
    # 左下大数字
    pg.add(text(L - 10, 900, '15', 300, 800, 'num', BONE, ls=-6),
           text(L + 300, 760, '屏', 40, 800),
           text(L + 300, 800, '5 个 Tab + 子页面', 18, 500, fill=BONE2),
           f'<rect x="{L + 300}" y="830" width="40" height="4" rx="2" fill="{LIME}"/>')
    footer(pg)
    return pg.save()


if __name__ == '__main__':
    main()
