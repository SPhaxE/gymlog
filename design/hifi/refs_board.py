#!/usr/bin/env python3
"""Nano Banana 参考图的「元素提取板」：从 design/hifi/*/refs/ 里裁出值得借鉴的局部，配说明，拼成一张图。
用法：python3 design/hifi/refs_board.py → screenshots/hifi/refs-elements.png
裁切用相对坐标（x0, y0, x1, y1 ∈ 0–1），图片尺寸不同也能用。分析结论见 design/hifi/refs-analysis.md。"""
import base64, html, io, os
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REF = lambda page, key: os.path.join(ROOT, 'design', 'hifi', page, 'refs', f'nb-{page}-{key}.jpg')

KEEP = [
    ('1 色彩三角：暖黑 + 骨白 + 荧光', '骨白（暖米白）做「选中 / 实心」状态：导航选中项、分段控件、档案格子、「完成」按钮；荧光只留给唯一焦点。三张图不约而同地这样分工。',
     [('body', 'C1', (0, .86, 1, .975)), ('me', 'B1', (0, .08, 1, .42)), ('summary', 'B1', (0, .86, 1, .97))]),
    ('2 压缩粗体数字', '高瘦的展示型数字（V1 用的就是 Bebas Neue 一类）承担所有关键读数：重量、组数、PR 数。中文仍用黑体。',
     [('body', 'C1', (0, .095, 1, .2)), ('gains', 'C1', (0, .24, 1, .42)), ('summary', 'C2', (0, .07, 1, .34))]),
    ('3 刻度', '方向 A「刻度」的回归：KPI 下的细刻度线、每行下的刻度尺、容量刻度尺（最低 / 适宜 / 上限）。做分隔线和量尺，不做装饰。',
     [('body', 'A3', (0, .095, 1, .185)), ('home', 'A3', (0, .22, 1, .42)), ('sheet', 'A2', (0, .55, 1, .8))]),
    ('4 配重片同心纹', '配重片的同心车削纹 / 刻度盘做「英雄区」背景：结算页、增量页页头。每页最多一处，很淡。',
     [('gains', 'A1', (0, 0, 1, .24)), ('summary', 'A2', (0, 0, 1, .42)), ('sheet', 'A1', (0, .05, 1, .3))]),
    ('5 胶囊：实心荧光焦点 + 自带刻度', '焦点胶囊是实心荧光底 + 黑字（所有身体页参考都这么画）；静止胶囊「名称 · 数值 · 细条」三段；有组数的胶囊底色按比例填充，胶囊本身就是量尺。',
     [('body', 'B1', (.45, .22, 1, .86)), ('body', 'C1', (.48, .22, 1, .62))]),
    ('6 引擎结论分组色带', '增量页「该加重」用荧光色带做组头，「保持」「该减重」用灰色带 + 箭头形状。一眼分出三组，不只靠颜色。',
     [('gains', 'B1', (0, .2, 1, .5)), ('gains', 'C1', (0, .19, 1, .47))]),
    ('7 导航：五项都带名称，选中项骨白圆底', '参考图全都给 5 项加了名称——在 360 dp 宽度下放得下，也比「只有图标」更好认；选中项骨白实心圆底 + 黑图标，外圈荧光细环是今日进度。',
     [('gains', 'C2', (0, .87, 1, .97)), ('log', 'C2', (0, .87, 1, .97)), ('body', 'B1', (0, .87, 1, .97))]),
    ('8 结算的庆祝时刻', '「4 项 PR」压在一条荧光斜带上，是全 App 唯一允许「大声」的一屏；逐动作 PR 用形状 + 文字标。',
     [('summary', 'C1', (0, .05, 1, .5)), ('summary', 'A1', (0, .45, 1, .85))]),
    ('9 训练页：组表格 + 常驻键盘', '休息条在顶、荧光倒计时细线；当前行高亮 + 光标；键盘右列是 −2.5 / +2.5 / 确认，单手可达。',
     [('session', 'B1', (0, .06, 1, .62)), ('session', 'C2', (0, .6, 1, .97))]),
    ('10 详情面板：时相分段 + 容量刻度尺', '四段时相做成分段控件，当前段荧光；容量用刻度尺标三条地标。',
     [('sheet', 'B1', (0, .4, 1, .95))]),
]
DROP = [
    ('AI 画的人体', '解剖细节、全身构图都不能用：人体只用 MuscleWiki 真实路径，只露半边。', [('body', 'A2', (0, .2, 1, .7))]),
    ('编造的英文标签', '「NEXT TARGET」「LEFT / RIGHT」这类假标签一律不要。', [('gains', 'C2', (0, .2, 1, .32))]),
    ('满屏超大数字装饰', '出血的巨型数字（85、6、12）偶尔一次很有张力，到处都用就成了噪音：只留给结算页。', [('home', 'C3', (0, 0, 1, .2))]),
]


def crop(page, key, box, w=300):
    im = Image.open(REF(page, key)).convert('RGB')
    W, H = im.size
    c = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    c.thumbnail((w, 2000))
    b = io.BytesIO(); c.save(b, 'JPEG', quality=88)
    return f'<figure><img src="data:image/jpeg;base64,{base64.b64encode(b.getvalue()).decode()}"><figcaption>{page}-{key}</figcaption></figure>'


def section(items, cls):
    return ''.join(f'<section class="{cls}"><h2>{html.escape(t)}</h2><p>{html.escape(d)}</p><div class="imgs">{"".join(crop(*c) for c in cs)}</div></section>' for t, d, cs in items)


doc = f'''<!doctype html><meta charset="utf-8"><style>
body{{margin:0;background:#E9E9E6;font-family:'Noto Sans SC',system-ui,sans-serif;color:#1d1d1b}}
.board{{display:inline-block;padding:28px 32px;width:1900px}} h1{{font-size:24px;margin:0 0 6px}} .sub{{font-size:13.5px;color:#555;margin-bottom:18px;line-height:1.6}}
.grid{{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}}
section{{background:#fff;border-radius:12px;padding:14px 16px}} section.drop{{background:#fbeaea}}
h2{{font-size:16px;margin:0 0 4px}} p{{font-size:13px;line-height:1.6;margin:0 0 10px;color:#333}}
.imgs{{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}} figure{{margin:0}} img{{display:block;border-radius:6px;max-width:300px}}
figcaption{{font-size:11px;color:#777;margin-top:3px}} h3{{font-size:18px;margin:22px 0 10px}}
</style><div class="board"><h1>Nano Banana 参考图 · 可借鉴的元素</h1>
<div class="sub">从 54 张参考图里提取的 10 个元素（绿）和 3 个不采用的（红）。这些元素合成为「视觉语言 v2」，用于身体页和首页的 Stitch 第 2 轮。图下是来源文件 design/hifi/&lt;页面&gt;/refs/nb-&lt;页面&gt;-&lt;方向&gt;.jpg。</div>
<div class="grid">{section(KEEP, 'keep')}</div><h3>不采用</h3><div class="grid">{section(DROP, 'drop')}</div></div>'''

out = os.path.join(ROOT, 'screenshots', 'hifi', 'refs-elements.png')
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    pg = b.new_page(viewport={'width': 1970, 'height': 1200}, device_scale_factor=1)
    pg.set_content(doc); pg.wait_for_timeout(500)
    pg.locator('.board').screenshot(path=out); b.close()
print('saved', os.path.relpath(out, ROOT))
