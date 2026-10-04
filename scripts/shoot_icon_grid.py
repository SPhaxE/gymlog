#!/usr/bin/env python3
"""图标网格规范板截图：design/icon-grid/index.html → screenshots/icon-grid/
用法：python3 scripts/shoot_icon_grid.py（直接读本地文件，不用起 vite；字体走 Google Fonts，离线时会退回系统字体）"""
import argparse, os, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'screenshots', 'icon-grid')
os.makedirs(OUT, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    for name, w, scale in [('board', 1280, 1.5), ('board-phone', 390, 2)]:
        pg = b.new_page(viewport={'width': w, 'height': 900}, device_scale_factor=scale)
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.goto('file://' + os.path.abspath(os.path.join(ROOT, 'design', 'icon-grid', 'index.html')))
        pg.wait_for_timeout(1500)
        if pg.evaluate('document.documentElement.scrollWidth > innerWidth'): errors.append(f'{name}: 横向溢出')
        pg.screenshot(path=os.path.join(OUT, f'{name}.png'), full_page=True)
        print('saved', f'screenshots/icon-grid/{name}.png')
        pg.close()
    b.close()
if errors:
    print('页面错误：', *errors, sep='\n  '); sys.exit(1)
