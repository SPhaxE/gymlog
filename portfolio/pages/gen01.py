"""P01 封面（两版）：
A 样机版 01_封面.svg：左三分之一大字「慢慢 / 变牛。」；右侧三台 Pixel 8 同向倾斜 11°（= Logo 的倾斜）叠放，today 在前、body 与 gains 在后，背后颗粒荧光。
B 实拍版 01_封面_实拍.svg：AIGC 3 号图（贴好真屏，见 portfolio/shoot/aigc.py）出血铺满，左侧压暗放同一套字。
标题下一排 9 根刻度一根比一根长（Logo 递增条的同一个意思：每次只多一点）。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from pf import *
from PIL import Image

TILT = 11


def type_block(pg, dark_photo=False):
    x = L
    pg.add(logo(x - 6, 104, 56),
           text(x + 66, 146, '慢牛 Milo', 28, 800, extra=' transform="translate(0 146) skewX(-11) translate(0 -146)"'),
           text(x, 300, '作品集 · 个人项目 · 2026.10', 14, 500, 'mono', LIME, ls=2))
    # 主标题：240 / 900，两行；句号是这一页唯一的荧光字
    pg.add(text(x - 12, 520, '慢慢', 240, 900, ls=-6),
           tspans(x - 12, 770, [('变牛', 900, BONE), ('。', 900, LIME)], 240, extra=' letter-spacing="-6"'))
    # 递增刻度：9 根，一根比一根长
    y0 = 830
    for i in range(9):
        h = 10 + i * 3.2
        pg.add(f'<rect x="{x + i * 18:.1f}" y="{y0 + 40 - h:.1f}" width="3" height="{h:.1f}" rx="1.5" fill="{LIME if i == 8 else BONE}" fill-opacity="{1 if i == 8 else 0.35 + i * 0.06:.2f}"/>')
    pg.add(text(x + 190, y0 + 40, '下一组，该加多少，它告诉你。', 28, 700),
           text(x, y0 + 100, '给刚过新手期的健身爱好者的 Android 训练 App', 18, 500, fill=BONE2),
           text(x, 1050, '产品 · 交互 · 视觉 · 前端', 14, 500, 'mono', BONE2, ls=1),
           )


def mockup():
    pg = Page(1, '封面')
    # 光：一个亮核心在前台样机身后偏上（主角卡的位置），一道低平的余光贴着底边；其余保持暖黑
    bg = glow(W // 2, H // 2, [(715, 210, 170, 150, LIME, 0.42), (740, 250, 330, 260, LIME, 0.12), (820, 520, 380, 70, LIME, 0.08)], grain=0.045)
    pg.add(bake(bg.resize((W, H), Image.BICUBIC), 0, 0, W, H))
    # 后两台错开高度（body 偏上、gains 偏下），压暗推远；前台 today 放大、出血到底边
    phone(pg, screen('body'), 905, -70, 410, TILT, label='body')
    phone(pg, screen('gains'), 1560, 250, 410, TILT, label='gains')
    pg.add(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BG}" fill-opacity="0.42"/>')   # 压后景
    # 光雾：夹在后景与前台之间，前台样机像是从光里走出来
    pg.add(bake(haze(W // 2, H // 2, [(700, 170, 150, 170, LIME, 0.30), (720, 260, 300, 260, LIME, 0.08)], grain=0.012), 0, 0, W, H, fmt='png', scale=0.5))
    phone(pg, screen('today'), 1160, 120, 510, TILT, shadow=0.85, label='today')
    type_block(pg)
    return pg.save()


def photo():
    pg = Page(1, '封面_实拍')
    im = Image.open(os.path.join(PF, 'assets', 'aigc', 'cover-today.jpg'))
    pg.add(image(embed(im, W, H, scale=im.width / W), 0, 0, W, H, ' data-name="AIGC 实拍（屏幕为 App 真渲染）"'))
    # 左侧压暗留给字：横向渐变 + 底部一道压暗
    pg.defs.append(f'<linearGradient id="shadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{BG}" stop-opacity="0.94"/>'
                   f'<stop offset="0.36" stop-color="{BG}" stop-opacity="0.82"/><stop offset="0.6" stop-color="{BG}" stop-opacity="0.2"/><stop offset="0.75" stop-color="{BG}" stop-opacity="0"/></linearGradient>'
                   f'<linearGradient id="shadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stop-color="{BG}" stop-opacity="0"/><stop offset="1" stop-color="{BG}" stop-opacity="0.7"/></linearGradient>')
    pg.add(f'<rect width="{W}" height="{H}" fill="url(#shadeL)"/>', f'<rect width="{W}" height="{H}" fill="url(#shadeB)"/>')
    type_block(pg)
    return pg.save()


if __name__ == '__main__':
    mockup(); photo()
