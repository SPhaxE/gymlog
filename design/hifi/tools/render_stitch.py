#!/usr/bin/env python3
"""把一轮 Stitch 结果的 HTML 下载下来，用 Chromium 按 360×800 @2x 截图（比 Stitch 画布缩略图清楚）。
用法：python3 design/hifi/tools/render_stitch.py <页面> <轮次>
  读 design/hifi/<页面>/.<轮次>-results.json，输出 screenshots/hifi/<页面>/<轮次>-<键>.png
外部资源（Tailwind、Google Fonts）由 Python 代取并照常校验证书：沙盒里的 Chromium 不信任代理证书。"""
import json, os, ssl, sys, urllib.request
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
page, rnd = sys.argv[1], sys.argv[2]
res = json.load(open(os.path.join(ROOT, 'design', 'hifi', page, f'.{rnd}-results.json')))
outdir = os.path.join(ROOT, 'screenshots', 'hifi', page)
os.makedirs(outdir, exist_ok=True)
CA = os.environ.get('SSL_CERT_FILE') or ('/root/.ccr/ca-bundle.crt' if os.path.exists('/root/.ccr/ca-bundle.crt') else None)
CTX = ssl.create_default_context(cafile=CA)
CACHE = {}


def proxy_route(route):
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
        print('  资源取不到', u[:80], e); route.abort()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
    for key, r in res.items():
        sc = r['result'].get('structuredContent') or {}
        for comp in sc.get('outputComponents', []):
            for s in comp.get('design', {}).get('screens', []):
                html = urllib.request.urlopen(s['htmlCode']['downloadUrl'], timeout=120, context=CTX).read().decode('utf-8', 'replace')
                pg = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
                pg.route('**/*', proxy_route)
                pg.set_content(html, wait_until='load', timeout=90000)
                try:
                    pg.wait_for_function('window.tailwind !== undefined', timeout=20000)
                except Exception:
                    print('  没有 Tailwind', key)
                pg.wait_for_timeout(2500)
                f = os.path.join(outdir, f'{rnd}-{key}.png')
                pg.screenshot(path=f); pg.close()
                print('saved', os.path.relpath(f, ROOT))
    b.close()
