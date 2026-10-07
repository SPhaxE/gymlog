#!/usr/bin/env python3
"""框架层线框截图：design/wireframes/ → screenshots/wireframes/<页面>/<方案>.png 与 board.png。

用法（仓库根目录）：
    python3 -m http.server 8765 &
    python3 scripts/shoot_wireframes.py            # 默认 http://localhost:8765/design/wireframes/
单张 360×800 @2x（不带标注、带标注各一张），对比板 @1.5x。"""
import argparse, os, sys
from playwright.sync_api import sync_playwright

PAGES = {'body': 3, 'home': 3, 'gains': 3, 'log': 2, 'me': 2, 'me2': 3, 'level': 3, 'session': 2, 'sheet': 2, 'story': 6, 'checkin': 3, 'p04': 3, 'swap': 2, 'warm': 2, 'pause': 3, 'find': 3}
ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://localhost:8765/design/wireframes/')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
ap.add_argument('--only', default='')
args = ap.parse_args()
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'screenshots', 'wireframes')
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    for page, n in PAGES.items():
        if args.only and page not in args.only.split(','):
            continue
        os.makedirs(os.path.join(OUT, page), exist_ok=True)
        pg = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
        pg.on('pageerror', lambda e: errors.append(str(e)))
        for i in range(1, n + 1):
            pg.goto(f'{args.base}?page={page}&v=W{i}&anno=0&hit=0')
            pg.wait_for_selector('body[data-ready]', timeout=20000)
            pg.wait_for_timeout(200)
            f = os.path.join(OUT, page, f'W{i}.png')
            pg.locator('.screen').screenshot(path=f)
            print('saved', os.path.relpath(f))
        pg.close()
        pg = b.new_page(viewport={'width': 1300, 'height': 1000}, device_scale_factor=1.5)
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto(f'{args.base}?board={page}')
        pg.wait_for_selector('body[data-ready]', timeout=20000)
        pg.wait_for_timeout(300)
        if pg.evaluate('document.body.dataset.ready') != '1':
            errors.append(page + ': ' + pg.inner_text('body')[:500])
        f = os.path.join(OUT, page, 'board.png')
        pg.locator('section.board').screenshot(path=f)
        print('saved', os.path.relpath(f))
        pg.close()
    b.close()
if errors:
    print('page errors:', *errors, sep='\n  ')
    sys.exit(1)
