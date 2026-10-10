"""样机合成预览：屏幕（1080 × 2400）叠 mask（圆角与挖孔）→ 放到机身 (49, 55) → 盖上机身，输出 PNG（作品集页里用 SVG 分层，这里只给用户确认）。
python3 portfolio/shoot/device.py body [today ...]  → portfolio/out/check/device-<页>.png"""
import os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEV = os.path.join(ROOT, 'assets', 'device', 'pixel_8')


def compose(screen_png):
    back = Image.open(os.path.join(DEV, 'back.webp')).convert('RGBA')
    mask = Image.open(os.path.join(DEV, 'mask.webp')).convert('RGBA')
    scr = Image.open(screen_png).convert('RGBA')
    scr.alpha_composite(mask)
    out = Image.new('RGBA', back.size, (0, 0, 0, 0))
    out.paste(scr, (49, 55))
    out.alpha_composite(back)
    return out


if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'out', 'check'), exist_ok=True)
    for name in sys.argv[1:] or ['body']:
        im = compose(os.path.join(ROOT, 'assets', 'screens', f'{name}.png'))
        bg = Image.new('RGBA', (im.width + 240, im.height + 240), (10, 10, 11, 255)); bg.alpha_composite(im, (120, 120))
        bg.convert('RGB').save(os.path.join(ROOT, 'out', 'check', f'device-{name}.png'))
        print('ok', name)
