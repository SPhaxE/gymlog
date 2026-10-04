#!/usr/bin/env python3
"""/lab 参考要素预览截图：每个编号一张 + 每组一张对照板 → screenshots/lab/
用法：先 npx vite --port 5199，再 python3 scripts/shoot_lab.py"""
import argparse, os, sys
from datetime import datetime
from playwright.sync_api import sync_playwright
from PIL import Image

NOW = int(datetime(2026, 10, 3, 18, 0).timestamp() * 1000)
GROUPS = {'A': (['A4', 'T4'], 2), 'I': (['I3', 'R1'], 2), 'E': ([f'E{i}' for i in range(1, 6)], 3), 'M': (['M02', 'M05', 'M06', 'M07', 'M08'], 3)}
ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
args = ap.parse_args()
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'screenshots', 'lab')
os.makedirs(os.path.join(OUT, 'items'), exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    pg = b.new_page(viewport={'width': 2000, 'height': 1000}, device_scale_factor=1.5)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.goto(f'{args.base}/lab?now={NOW}'); pg.wait_for_timeout(3000)
    for ids, _ in GROUPS.values():
        for i in ids:
            el = pg.locator(f'[id="{i}"]'); el.scroll_into_view_if_needed(); pg.wait_for_timeout(250)
            el.screenshot(path=os.path.join(OUT, 'items', f'{i}.png'))
    b.close()
for g, (ids, cols) in GROUPS.items():
    ims = [Image.open(os.path.join(OUT, 'items', f'{i}.png')) for i in ids]
    rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
    gap = 30
    W = max(sum(i.width for i in r) + gap * (len(r) - 1) for r in rows); H = sum(max(i.height for i in r) + gap for r in rows)
    c = Image.new('RGB', (W, H), (10, 10, 11)); y = 0
    for r in rows:
        x = 0
        for i in r: c.paste(i, (x, y)); x += i.width + gap
        y += max(i.height for i in r) + gap
    c.save(os.path.join(OUT, f'board-{g}.png')); print('saved', f'screenshots/lab/board-{g}.png')
if errors:
    print('页面错误：', *errors, sep='\n  '); sys.exit(1)
