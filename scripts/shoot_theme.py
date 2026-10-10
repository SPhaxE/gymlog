"""作品集素材：同一页面深 / 浅成对截图（390 × 844，2x）→ screenshots/theme/dark-<页>.png、light-<页>.png，并拼对照长图 theme-pairs.png。
先起服务（npx vite preview --port 4173 --host 127.0.0.1），再 python3 scripts/shoot_theme.py [--base http://127.0.0.1:4173]。"""
import argparse, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

PAGES = [('today', '/today'), ('body', '/body'), ('body-detail', None), ('gains', '/gains'), ('trend', '/gains/barbell-bench-press-4'), ('log', '/log'),
         ('me', '/me'), ('level', '/me/level'), ('wallet', '/me/wallet'), ('pro', '/me/pro'), ('shop', '/shop'), ('guide', '/shop/guide/belt')]
OUT = os.path.join(os.path.dirname(__file__), '..', 'screenshots', 'theme')

ap = argparse.ArgumentParser(); ap.add_argument('--base', default='http://127.0.0.1:4173'); args = ap.parse_args()
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    pg.goto(f'{args.base}/body?scenario=plain-prescription'); pg.wait_for_selector('[data-head]'); pg.wait_for_timeout(800)
    head = pg.evaluate("document.querySelector('[data-head]').dataset.head")
    for theme in ('dark', 'light'):
        for name, path in PAGES:
            path = path or f'/body?head={head}'
            pg.goto(f'{args.base}{path}{"&" if "?" in path else "?"}scenario=plain-prescription&theme={theme}'); pg.wait_for_selector('main'); pg.wait_for_timeout(2200)
            pg.screenshot(path=os.path.join(OUT, f'{theme}-{name}.png'))
    b.close()

# 对照长图：每行两对（深 | 浅 · 深 | 浅），图下写页名
w, h, gap, cap = 780 // 2, 1688 // 2, 16, 36
cols = 4
rows = (len(PAGES) * 2 + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + gap) + gap, rows * (h + cap + gap) + gap), (24, 24, 26))
dr = ImageDraw.Draw(sheet)
for i, (name, _) in enumerate(PAGES):
    for j, theme in enumerate(('dark', 'light')):
        k = i * 2 + j; x = gap + (k % cols) * (w + gap); y = gap + (k // cols) * (h + cap + gap)
        sheet.paste(Image.open(os.path.join(OUT, f'{theme}-{name}.png')).resize((w, h)), (x, y))
        dr.text((x, y + h + 10), f'{name} · {theme}', fill=(220, 220, 215))
sheet.save(os.path.join(OUT, 'theme-pairs.png'))
print('ok', len(PAGES) * 2, '张 + theme-pairs.png')
