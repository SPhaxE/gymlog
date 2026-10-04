#!/usr/bin/env python3
"""高保真代码定稿截图：/today、/body → screenshots/hifi/<页面>/final-<状态>.png（360×800 @2x）。
用法：先 npx vite --port 5199，再 python3 scripts/shoot_hifi.py [--base http://127.0.0.1:5199]
now 固定为 2026-10-03 18:00（与提示词包、线框同一时刻），截图可复现。"""
import argparse, os, sys
from datetime import datetime
from playwright.sync_api import sync_playwright

NOW = int(datetime(2026, 10, 3, 18, 0).timestamp() * 1000)
SHOTS = [
    ('body', 'final-mag', '/body?focus=mid-lower-pectoralis'),
    ('body', 'final-rest', '/body'),
    ('body', 'final-sheet', '/body?tap=mid-lower-pectoralis'),
    ('body', 'final-empty', '/body?scenario=cold-start'),
    ('home', 'final-plan', '/today'),
    ('home', 'final-deload', '/today?scenario=deload-suggested'),
    ('home', 'final-rest', '/today?scenario=rest-day'),
    ('home', 'final-cold', '/today?scenario=cold-start'),
]
FULL = [('spec', 'preview', '/preview')]  # 整页长图
ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    for page, name, url in SHOTS:
        pg = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
        pg.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
        sep = '&' if '?' in url else '?'
        pg.goto(f'{args.base}{url}{sep}now={NOW}')
        pg.wait_for_timeout(1200)
        if 'tap=' in url:  # 轻点胶囊打开详情面板
            target = url.split('tap=')[1].split('&')[0]
            pg.locator(f'[data-id="{target}"]').click()
            pg.wait_for_timeout(400)
        out = os.path.join(ROOT, 'screenshots', 'hifi', page, f'{name}.png')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        pg.screenshot(path=out)
        print('saved', os.path.relpath(out, ROOT))
        pg.close()
    for page, name, url in FULL:
        pg = b.new_page(viewport={'width': 1100, 'height': 900}, device_scale_factor=1.5)
        pg.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
        pg.goto(f'{args.base}{url}?now={NOW}'); pg.wait_for_timeout(1500)
        out = os.path.join(ROOT, 'screenshots', 'hifi', page, f'{name}.png')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        pg.screenshot(path=out, full_page=True); print('saved', os.path.relpath(out, ROOT)); pg.close()
    b.close()
if errors:
    print('页面错误：', *errors, sep='\n  '); sys.exit(1)
