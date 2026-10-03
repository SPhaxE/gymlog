#!/usr/bin/env python3
"""阶段 3 方向稿截图：把 design/stage3/index.html 的每块板截成一张 PNG，放到 screenshots/stage3/。

用法（仓库根目录）：
    python3 -m http.server 8765 &
    python3 scripts/shoot_stage3.py            # 默认 http://localhost:8765/design/stage3/
需要网络加载 Google Fonts；字体没到时会退回系统字体，截图前会等 document.fonts.ready。"""
import argparse, os, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://localhost:8765/design/stage3/')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
args = ap.parse_args()
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'screenshots', 'stage3')
os.makedirs(OUT, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    pg = b.new_page(viewport={'width': 1320, 'height': 900}, device_scale_factor=2)
    pg.on('pageerror', lambda e: errors.append(str(e)))
    for name in ['compare', 'A', 'B', 'C', 'logo']:
        pg.goto(args.base + '?board=' + name)
        pg.wait_for_selector('body[data-ready="1"]', timeout=20000)
        pg.wait_for_timeout(300)
        f = os.path.join(OUT, {'compare': '00-compare', 'A': '01-A-gauge', 'B': '02-B-plate', 'C': '03-C-nameplate', 'logo': '04-logo'}[name] + '.png')
        pg.locator('section.board').screenshot(path=f)
        print('saved', os.path.relpath(f))
    b.close()
if errors:
    print('page errors:', *errors, sep='\n  ')
    sys.exit(1)
