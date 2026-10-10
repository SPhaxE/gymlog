"""作品集 App 屏：按 Pixel 8 参数（412 × 915 @2.625）渲染深色 App，注入系统栏安全区，叠 Android 14 状态栏与手势条，
裁成 1080 × 2400（Pixel 8 屏幕）→ portfolio/assets/screens/<页>.png。

先起服务：npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
python3 portfolio/shoot/app.py [--base http://127.0.0.1:4173] [--only body,today]
页面清单与 scripts/shoot_theme.py --android 相同；示范视频的 H.264 问题照它的办法当场转 webm。"""
import argparse, os, subprocess, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'portfolio', 'assets', 'screens')
PAGES = [('today', '/today'), ('body', '/body'), ('body-detail', None), ('gains', '/gains'), ('trend', '/gains/barbell-bench-press-4'),
         ('log', '/log'), ('exercise', '/exercise/barbell-bench-press-4'), ('me', '/me'), ('level', '/me/level'), ('messages', '/me/messages'),
         ('wallet', '/me/wallet'), ('pro', '/me/pro'), ('shop', '/shop'), ('item', '/shop/item/belt-10'), ('guide', '/shop/guide/belt')]
SAFE_TOP, SAFE_BOTTOM = 48, 24   # dp：Pixel 8 状态栏（盖住挖孔，挖孔圆心约 25 dp）/ 手势导航条

# 系统栏：状态栏（时间左、信号 / Wi-Fi / 电池右）+ 手势条。只在截图里叠，不进 App。
SYSBARS = """
(() => {
  const ink = '#E9E3D3';
  const bar = document.createElement('div');
  bar.setAttribute('data-pf-sysbar', '');
  bar.style.cssText = `position:fixed;z-index:2147483647;left:0;right:0;top:0;height:${SAFE_TOP}px;display:flex;align-items:center;justify-content:space-between;padding:0 22px 0 26px;pointer-events:none;color:${ink};font:500 15px/1 var(--milo-font-ui);letter-spacing:.2px;box-sizing:border-box`;
  bar.innerHTML = `<span style="font-variant-numeric:tabular-nums">9:30</span>
  <span style="display:flex;gap:7px;align-items:center">
    <svg width="17" height="13" viewBox="0 0 17 13"><path d="M8.5 13 0 3.4A12.6 12.6 0 0 1 8.5 0 12.6 12.6 0 0 1 17 3.4Z" fill="${ink}"/></svg>
    <svg width="14" height="14" viewBox="0 0 14 14"><path d="M14 0v14H0Z" fill="${ink}"/></svg>
    <svg width="9" height="15" viewBox="0 0 9 15"><rect x="2.5" y="0" width="4" height="1.6" rx=".5" fill="${ink}"/><rect x=".6" y="1.4" width="7.8" height="13" rx="1.4" fill="none" stroke="${ink}" stroke-width="1.2"/><rect x="1.8" y="4.2" width="5.4" height="9" rx=".6" fill="${ink}"/></svg>
  </span>`;
  const pill = document.createElement('div');
  pill.setAttribute('data-pf-sysbar', '');
  pill.style.cssText = `position:fixed;z-index:2147483647;left:50%;bottom:${(SAFE_BOTTOM - 4) / 2}px;width:108px;height:4px;margin-left:-54px;border-radius:2px;background:${ink};opacity:.82;pointer-events:none`;
  document.body.append(bar, pill);
})();
""".replace('${SAFE_TOP}', str(SAFE_TOP)).replace('${(SAFE_BOTTOM - 4) / 2}', str((SAFE_BOTTOM - 4) / 2))
SAFE = f"document.documentElement.style.setProperty('--safe-area-inset-top','{SAFE_TOP}px');document.documentElement.style.setProperty('--safe-area-inset-bottom','{SAFE_BOTTOM}px');"


def open_page(p, base):
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2.625)
    pg.add_init_script(f"document.addEventListener('DOMContentLoaded',()=>{{{SAFE}}});{SAFE}")
    cache = tempfile.mkdtemp()
    def webm(route):   # 无头 Chromium 没有 H.264：示范 mp4 当场转 webm
        src = os.path.join(ROOT, 'public', route.request.url.split('?')[0].split('/', 3)[3])
        dst = os.path.join(cache, os.path.basename(src) + '.webm')
        if not os.path.exists(dst): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-an', dst], check=True)
        route.fulfill(path=dst, content_type='video/webm')
    pg.route('**/*.mp4*', webm)
    return b, pg


def finish(path):
    """1082 × 2402 → 裁成 Pixel 8 屏幕 1080 × 2400"""
    im = Image.open(path); w, h = im.size
    im.crop(((w - 1080) // 2, (h - 2400) // 2, (w - 1080) // 2 + 1080, (h - 2400) // 2 + 2400)).save(path)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--base', default='http://127.0.0.1:4173'); ap.add_argument('--only', default='')
    args = ap.parse_args()
    only = set(filter(None, args.only.split(',')))
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        b, pg = open_page(p, args.base)
        pg.goto(f'{args.base}/body?scenario=plain-prescription&theme=dark'); pg.wait_for_selector('[data-head]'); pg.wait_for_timeout(800)
        head = pg.evaluate("document.querySelector('[data-head]').dataset.head")
        n = 0
        for name, path in PAGES:
            if only and name not in only: continue
            path = path or f'/body?head={head}'
            pg.goto(f'{args.base}{path}{"&" if "?" in path else "?"}scenario=plain-prescription&theme=dark'); pg.wait_for_selector('main'); pg.wait_for_timeout(2200)
            pg.evaluate(SYSBARS); pg.wait_for_timeout(100)
            out = os.path.join(OUT, f'{name}.png'); pg.screenshot(path=out); finish(out); n += 1
        b.close()
    print('ok', n, '屏 →', OUT)
