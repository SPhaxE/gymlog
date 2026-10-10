"""安卓启动器图标 + 旧式启动图：「递增条牛头」标志（src/components/Logo.tsx 的 MarkBars，2026-10-05 用户选定），深底版 AppIcon 的配色。
几何照 Logo.tsx（48 画布、9 根条、skewX −11°），颜色取 design/tokens/tokens.json 原色。
输出：android/app/src/main/res/mipmap-*/ic_launcher{,_round,_foreground}.png、values/ic_launcher_background.xml、drawable*/splash.png，
以及作品集用的 design/brand/app-icon.png（1024，圆角方形）。用法：python3 scripts/app_icon.py"""
import json, os
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
RES = os.path.join(ROOT, 'android/app/src/main/res')
P = {k: v['value'][:7] for k, v in json.load(open(os.path.join(ROOT, 'design/tokens/tokens.json')))['primitives']['color'].items()}
TILE, BASE, LIT, PAGE = P['gray-150'], P['bone-100'], P['lime-500'], P['gray-0']   # 图标底 / 骨白条 / 荧光角条 / bg/base（启动图底）

BARS = [(5, 18), (12, 25.5), (14.5, 30.5), (16, 35.5), (16.5, 41), (16, 35.5), (14.5, 30.5), (12, 25.5), (5, 18)]
W, GAP = 3.4, 1.3
X0 = 24 - (9 * W + 8 * GAP) / 2

def glyph():
    rects = ''.join(f'<rect x="{X0 + i * (W + GAP):.3f}" y="{t}" width="{W}" height="{b - t}" rx="{W / 2}" fill="{LIT if i in (0, 8) else BASE}"/>' for i, (t, b) in enumerate(BARS))
    # 倾斜后的外框是 x 4.7–48.2、y 5–41：平移到 48 画布正中（Logo.tsx 里按网格对齐，单独做图标要按外框居中）
    return f'<g transform="translate(-2.43 1)"><g transform="translate(4.67 0) skewX(-11)">{rects}</g></g>'

def svg(px, bg=None, shape='none', scale=1.0, w=None, h=None):
    """px：正方形边长；scale：标志 48 画布占边长的比例；shape：none 透明 / square 圆角方形 / circle 圆 / fill 整幅底色"""
    w, h = w or px, h or px
    g = min(w, h) * scale
    back = {'square': f'<rect width="{w}" height="{h}" rx="{w * 0.22}" fill="{bg}"/>', 'circle': f'<circle cx="{w / 2}" cy="{h / 2}" r="{w / 2}" fill="{bg}"/>',
            'fill': f'<rect width="{w}" height="{h}" fill="{bg}"/>', 'none': ''}[shape]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{back}'
            f'<g transform="translate({(w - g) / 2} {(h - g) / 2}) scale({g / 48})">{glyph()}</g></svg>')

DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page()
    def shot(markup, w, h, path):
        pg.set_viewport_size({'width': int(w), 'height': int(h)})
        pg.set_content(f'<html><body style="margin:0;background:transparent">{markup}</body></html>')
        pg.locator('svg').screenshot(path=path, omit_background=True)
    for d, k in DENS.items():
        folder = os.path.join(RES, f'mipmap-{d}')
        # 自适应图标前景：108dp 画布，标志 48 画布映射到 52dp——V 的两个上角离中心约 31dp，落在 66dp 直径安全区里（圆形、方圆遮罩都不切角）
        fg = round(108 * k); shot(svg(fg, scale=52 / 108), fg, fg, os.path.join(folder, 'ic_launcher_foreground.png'))
        # 旧式图标：48dp，圆角方形 / 圆，标志占 72%（同 AppIcon）
        lg = round(48 * k)
        shot(svg(lg, TILE, 'square', 0.72), lg, lg, os.path.join(folder, 'ic_launcher.png'))
        shot(svg(lg, TILE, 'circle', 0.66), lg, lg, os.path.join(folder, 'ic_launcher_round.png'))
    # 旧式启动图（Android 12 起系统启动画面直接用启动器图标）：bg/base 底 + 标志
    for root, _, files in os.walk(RES):
        if 'splash.png' in files:
            f = os.path.join(root, 'splash.png'); w, h = Image.open(f).size
            shot(svg(0, PAGE, 'fill', 0.28, w, h), w, h, f)
    shot(svg(1024, TILE, 'square', 0.72), 1024, 1024, os.path.join(ROOT, 'design/brand/app-icon.png'))
    b.close()
open(os.path.join(RES, 'values/ic_launcher_background.xml'), 'w').write(
    f'<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <!-- 慢牛：图标底 = 原色 gray-150（同 AppIcon 深底版），scripts/app_icon.py 生成 -->\n    <color name="ic_launcher_background">{TILE}</color>\n</resources>\n')
print('ok')
