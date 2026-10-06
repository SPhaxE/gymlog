"""钢板原型出图（一次性）：python3 shoot_plate.py <输出目录> [holes|real|k|gif|all]
  holes：四种孔矢量放大 7 倍（看设计意图）；real：真机大小（3 倍屏）三个滚动位置；k：光强三档；gif：滚动动图帧。"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/plate-out'); OUT.mkdir(parents=True, exist_ok=True)
WHAT = sys.argv[2] if len(sys.argv) > 2 else 'all'
URL = f'file://{HERE}/plate.html'
CHROMIUM = os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium')

def plate_shot(p, name, k=1, scroll=0, scale=3, pad=26, lead=200):
    b = p.chromium.launch(executable_path=CHROMIUM if os.path.exists(CHROMIUM) else None)
    pg = b.new_page(viewport={'width': 360, 'height': 720}, device_scale_factor=scale)
    pg.goto(f'{URL}?k={k}&lead={lead}')
    pg.wait_for_timeout(300)
    pg.evaluate(f"document.getElementById('sc').scrollTop={scroll}")
    pg.wait_for_timeout(250)
    box = pg.locator('#wrap').bounding_box()
    clip = {'x': max(0, box['x'] - pad), 'y': max(0, box['y'] - 8), 'width': box['width'] + 2 * pad, 'height': box['height'] + 16}
    pg.screenshot(path=str(OUT / name), clip=clip)
    b.close()

with sync_playwright() as p:
    if WHAT in ('holes', 'all'):
        b = p.chromium.launch(executable_path=CHROMIUM if os.path.exists(CHROMIUM) else None); pg = b.new_page(viewport={'width': 855, 'height': 520}, device_scale_factor=2)
        pg.goto(f'{URL}?mode=holes'); pg.wait_for_timeout(300); pg.screenshot(path=str(OUT / 'holes-vector.png')); b.close()
    if WHAT in ('real', 'all'):
        for name, y in (('right', 0), ('mid', 100), ('left', 200)):
            plate_shot(p, f'real-{name}.png', 1, y)
    if WHAT in ('k', 'all'):
        for name, k in (('weak', .6), ('mid', 1), ('strong', 1.45)):
            plate_shot(p, f'k-{name}.png', k, 0)
    if WHAT == 'gif':
        for i, y in enumerate(list(range(0, 201, 12)) + [200]):
            plate_shot(p, f'gif-{i:02d}.png', 1, y, scale=2)
print('done')
