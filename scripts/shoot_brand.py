#!/usr/bin/env python3
"""阶段 5.5b 品牌评审截图：/spec 第 6 章（原 /brand）各节 → screenshots/brand/，状态 Logo 录成 GIF
用法：先 npx vite --port 5199，再 python3 scripts/shoot_brand.py"""
import argparse, io, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
args = ap.parse_args()
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'screenshots', 'brand')
os.makedirs(OUT, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    pg = b.new_page(viewport={'width': 1280, 'height': 900}, device_scale_factor=1.5)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(f'{args.base}/spec'); pg.wait_for_timeout(2500)
    for sec in ['ip-stages', 'ip-moods', 'ip-small', 'logo', 'states', 'inuse']:
        el = pg.locator(f'#{sec}'); el.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        el.screenshot(path=os.path.join(OUT, f'{sec}.png')); print('saved', f'screenshots/brand/{sec}.png')
    # 动图：状态 Logo（约 4 秒）与 IP 每个阶段的状态（约 5 秒），每帧 100 ms
    for sec, n, shrink in [('states', 40, 2), ('ip-moods', 50, 3)]:
        el = pg.locator(f'#{sec}'); el.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
        frames = []
        for _ in range(n):
            im = Image.open(io.BytesIO(el.screenshot())).convert('RGB')
            frames.append(im.resize((im.width // shrink, im.height // shrink)))
            pg.wait_for_timeout(60)
        frames[0].save(os.path.join(OUT, f'{sec}.gif'), save_all=True, append_images=frames[1:], duration=100, loop=0, optimize=True)
        print(f'saved screenshots/brand/{sec}.gif')
    b.close()
if errors:
    print('页面错误：', *errors, sep='\n  '); sys.exit(1)
