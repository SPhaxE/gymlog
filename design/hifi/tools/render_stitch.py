"""Stitch 结果 → 下载 HTML → 用 Chromium 按 360×800 @2x 截图（比 Stitch 的画布缩略图清楚）。"""
import json, sys, urllib.request, os
from playwright.sync_api import sync_playwright
import ssl
CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
CACHE = {}
def proxy_route(route):
    """外部资源由 Python 代取（用代理的 CA 照常校验证书），再交给页面。"""
    u = route.request.url
    if not u.startswith('http'):
        return route.continue_()
    try:
        if u not in CACHE:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36'})
            r = urllib.request.urlopen(req, timeout=60, context=CTX)
            CACHE[u] = (r.status, r.headers.get('Content-Type', 'application/octet-stream'), r.read())
        st, ct, body = CACHE[u]
        route.fulfill(status=st, headers={'Content-Type': ct, 'Access-Control-Allow-Origin': '*'}, body=body)
    except Exception as e:
        print('  route fail', u[:80], e); route.abort()
S = os.path.dirname(os.path.abspath(__file__))
res = json.load(open(os.path.join(S, sys.argv[1])))
outdir, prefix = sys.argv[2], sys.argv[3]
os.makedirs(outdir, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    for k, r in res.items():
        sc = r['result'].get('structuredContent')
        for comp in sc.get('outputComponents', []):
            for s in comp.get('design', {}).get('screens', []):
                html = urllib.request.urlopen(s['htmlCode']['downloadUrl'], timeout=120).read().decode('utf-8', 'replace')
                hp = os.path.join(S, f'{prefix}-{k}.html'); open(hp, 'w').write(html)
                pg = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
                pg.route('**/*', proxy_route)
                pg.goto('file://' + hp, wait_until='load', timeout=90000)
                try: pg.wait_for_function('window.tailwind !== undefined', timeout=20000)
                except Exception as e: print('  no tailwind', k)
                pg.wait_for_timeout(2500)
                f = os.path.join(outdir, f'{prefix}-{k}.png')
                pg.screenshot(path=f, full_page=False); pg.close()
                print('saved', f)
    b.close()
