#!/usr/bin/env python3
"""高保真对比板：把一轮方案的截图 + 点评拼成一张图。
用法：python3 design/hifi/board.py body r1   → 读 design/hifi/<页面>/<轮次>-notes.json 与 screenshots/hifi/<页面>/<轮次>-*.png，输出 screenshots/hifi/<页面>/<轮次>-board.png
notes.json：{"title": "...", "sub": "...", "items": [{"key": "A", "name": "...", "pros": "...", "cons": "..."}], "pick": "..."}"""
import html, json, os, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
page, rnd = sys.argv[1], sys.argv[2]
N = json.load(open(os.path.join(ROOT, 'design', 'hifi', page, f'{rnd}-notes.json'), encoding='utf-8'))
shots = os.path.join(ROOT, 'screenshots', 'hifi', page)
e = html.escape
cols = ''.join(f'''<div class="col"><h2><b>{e(it["key"])}</b>{e(it["name"])}</h2><img src="file://{shots}/{rnd}-{it["key"]}.png">
<p><span class="p">好</span>{e(it["pros"])}</p><p><span class="c">问题</span>{e(it["cons"])}</p></div>''' for it in N['items'])
doc = f'''<!doctype html><meta charset="utf-8"><style>
body{{margin:0;background:#E9E9E6;font-family:'Noto Sans SC',system-ui,sans-serif;color:#1d1d1b}}
.board{{display:inline-block;padding:28px 32px}} h1{{font-size:22px;margin:0 0 4px}} .sub{{color:#555;font-size:13px;margin-bottom:18px;max-width:1900px;line-height:1.6}}
.row{{display:flex;gap:22px}} .col{{width:300px}} .col h2{{font-size:15px;margin:0 0 8px}} .col h2 b{{display:inline-block;width:22px}}
img{{width:300px;height:667px;border-radius:14px;display:block;box-shadow:0 0 0 1px #c9c9c5}}
p{{font-size:12.5px;line-height:1.6;margin:8px 0 0}} .p,.c{{display:inline-block;font-size:11px;font-weight:700;padding:0 6px;border-radius:8px;margin-right:6px;color:#fff}}
.p{{background:#2F9E44}} .c{{background:#C92A2A}} .pick{{margin-top:18px;font-size:14px;line-height:1.7;max-width:1900px;background:#fff;border-radius:10px;padding:12px 16px}}
</style><div class="board"><h1>{e(N["title"])}</h1><div class="sub">{e(N["sub"])}</div><div class="row">{cols}</div><div class="pick">{e(N["pick"])}</div></div>'''
tmp = os.path.join(shots, f'.{rnd}-board.html'); open(tmp, 'w', encoding='utf-8').write(doc)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    pg = b.new_page(viewport={'width': 1400, 'height': 1000}, device_scale_factor=1.5)
    pg.goto('file://' + tmp); pg.wait_for_timeout(500)
    out = os.path.join(shots, f'{rnd}-board.png'); pg.locator('.board').screenshot(path=out); b.close()
os.remove(tmp); print('saved', os.path.relpath(out, ROOT))
