"""作品集素材：同一页面深 / 浅成对截图（390 × 844，2x）→ screenshots/theme/dark-<页>.png、light-<页>.png，并拼对照长图 theme-pairs.png。
--android：作品集样机用（用户 2026-10-10：PDF、常用安卓机样机、深色主题）——412 × 915 @2.625（导出 1082 × 2402，常见 20:9 安卓屏），
只拍深色，多拍几页，存 screenshots/portfolio/android/<页>.png。
先起服务（npx vite preview --port 4173 --host 127.0.0.1），再 python3 scripts/shoot_theme.py [--android] [--base http://127.0.0.1:4173]。"""
import argparse, os, subprocess, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

PAGES = [('today', '/today'), ('body', '/body'), ('body-detail', None), ('gains', '/gains'), ('trend', '/gains/barbell-bench-press-4'), ('log', '/log'),
         ('me', '/me'), ('level', '/me/level'), ('wallet', '/me/wallet'), ('pro', '/me/pro'), ('shop', '/shop'), ('guide', '/shop/guide/belt')]
OUT = os.path.join(os.path.dirname(__file__), '..', 'screenshots', 'theme')

ap = argparse.ArgumentParser(); ap.add_argument('--base', default='http://127.0.0.1:4173'); ap.add_argument('--android', action='store_true'); args = ap.parse_args()
if args.android:
    PAGES += [('exercise', '/exercise/barbell-bench-press-4'), ('messages', '/me/messages'), ('item', '/shop/item/belt-10')]
    OUT = os.path.join(os.path.dirname(__file__), '..', 'screenshots', 'portfolio', 'android')
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2.625) if args.android else b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    # 无头 Chromium 没有 H.264：动作示范 mp4 当场转成 webm 再喂给页面（真机不需要）
    cache = tempfile.mkdtemp()
    def webm(route):
        src = os.path.join(os.path.dirname(__file__), '..', 'public', route.request.url.split('?')[0].split('/', 3)[3])
        dst = os.path.join(cache, os.path.basename(src) + '.webm')
        if not os.path.exists(dst): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-an', dst], check=True)
        route.fulfill(path=dst, content_type='video/webm')
    pg.route('**/*.mp4*', webm)
    pg.goto(f'{args.base}/body?scenario=plain-prescription'); pg.wait_for_selector('[data-head]'); pg.wait_for_timeout(800)
    head = pg.evaluate("document.querySelector('[data-head]').dataset.head")
    for theme in (('dark',) if args.android else ('dark', 'light')):
        for name, path in PAGES:
            path = path or f'/body?head={head}'
            pg.goto(f'{args.base}{path}{"&" if "?" in path else "?"}scenario=plain-prescription&theme={theme}'); pg.wait_for_selector('main'); pg.wait_for_timeout(2200)
            pg.screenshot(path=os.path.join(OUT, f'{name}.png' if args.android else f'{theme}-{name}.png'))
    b.close()
if args.android:
    print('ok', len(PAGES), '张 →', OUT); raise SystemExit

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
