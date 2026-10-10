"""作品集 SVG 工具：颜色（读 tokens.json）、字阶白名单、页头 / 页脚、样机、标注、位图嵌入、烘焙光效。
SVG 规矩（Figma 兼容）：文字一律 <text>；不用 foreignObject、<style>、filter；裁切只用 clipPath；光效烘进位图。"""
import base64, io, json, math, os
from xml.sax.saxutils import escape
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PF = os.path.join(ROOT, 'portfolio')
W, H = 1920, 1080
L, R = 120, 1800            # 页边
TOTAL = 22

_tok = json.load(open(os.path.join(ROOT, 'design', 'tokens', 'tokens.json')))['primitives']['color']
C = {k: v['value'][:7] for k, v in _tok.items()}
BG, FACE, FACE2, BONE, BONE2, LIME = C['gray-0'], C['gray-100'], C['gray-150'], C['bone-100'], C['bone-500'], C['lime-500']

SIZES = {12, 14, 16, 18, 22, 28, 40, 54, 72, 160, 240, 300}
FONT = {'sans': 'Noto Sans SC', 'num': 'Barlow Condensed', 'mono': 'JetBrains Mono'}


def rgb(hex_):
    h = hex_.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---------- 页面 ----------
class Page:
    def __init__(self, n, name):
        self.n, self.name, self.defs, self.body, self._id = n, name, [], [], 0

    def uid(self, p='c'):
        self._id += 1; return f'{p}{self.n:02d}_{self._id}'

    def add(self, *s):
        self.body.extend(s); return self

    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
                f'<defs>{"".join(self.defs)}</defs>\n<rect width="{W}" height="{H}" fill="{BG}"/>\n' + '\n'.join(self.body) + '\n</svg>\n')

    def save(self):
        out = os.path.join(PF, 'out', 'svg'); os.makedirs(out, exist_ok=True)
        path = os.path.join(out, f'{self.n:02d}_{self.name}.svg')
        open(path, 'w', encoding='utf-8').write(self.svg())
        print(f'ok {path}  {os.path.getsize(path) / 1e6:.1f} MB'); return path


# ---------- 文字 ----------
def text(x, y, s, size, weight=500, fam='sans', fill=BONE, anchor='start', ls=0, opacity=1, extra=''):
    assert size in SIZES, f'字号 {size} 不在字阶白名单'
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    o = f' opacity="{opacity}"' if opacity != 1 else ''
    l = f' letter-spacing="{ls}"' if ls else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT[fam]}" font-size="{size}" font-weight="{weight}" fill="{fill}"{a}{l}{o}{extra}>'
            f'{escape(s)}</text>')


def tspans(x, y, parts, size, fam='sans', anchor='start', extra=''):
    """一行里混排：parts = [(文字, 字重, 颜色, 字体?, 字号?)]"""
    sp = []
    for p in parts:
        s, wt, fill = p[0], p[1], p[2]; fm = p[3] if len(p) > 3 else fam; sz = p[4] if len(p) > 4 else size
        assert sz in SIZES
        sp.append(f'<tspan font-family="{FONT[fm]}" font-weight="{wt}" fill="{fill}" font-size="{sz}">{escape(s)}</tspan>')
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT[fam]}" font-size="{size}"{a}{extra}>{"".join(sp)}</text>'


# ---------- 位图 ----------
def embed(im, w, h=None, fmt=None, scale=2):
    """PIL 图或路径 → data URI，按显示尺寸 × scale 缩放；不透明用 JPEG，要透明用 PNG"""
    if isinstance(im, str): im = Image.open(im)
    h = h or w * im.height / im.width
    tw, th = max(1, round(w * scale)), max(1, round(h * scale))
    if (tw, th) != im.size and tw < im.width: im = im.resize((tw, th), Image.LANCZOS)
    has_a = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 255
    fmt = fmt or ('png' if has_a else 'jpeg')
    buf = io.BytesIO()
    if fmt == 'jpeg': im.convert('RGB').save(buf, 'JPEG', quality=88, optimize=True)
    else: im.save(buf, 'PNG', optimize=True)
    return f'data:image/{fmt};base64,' + base64.b64encode(buf.getvalue()).decode()


def image(href, x, y, w, h, extra=''):
    return f'<image x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" preserveAspectRatio="none" xlink:href="{href}"{extra}/>'


def bake(im, x=0, y=0, w=None, h=None, scale=1, fmt=None):
    """烘焙图层（光晕、颗粒）：默认 1 倍嵌入（本来就是模糊的）"""
    w = w or im.width; h = h or im.height
    return image(embed(im, w, h, fmt=fmt, scale=scale), x, y, w, h)


# ---------- 光效（烘焙） ----------
def glow(w, h, spots, grain=0.06, seed=7, base=BG):
    """颗粒光：spots = [(cx, cy, rx, ry, 颜色, 强度)]，椭圆高斯叠加 + 胶片颗粒；返回 RGB 图"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    img = np.zeros((h, w, 3), np.float32) + np.array(rgb(base), np.float32)
    for cx, cy, rx, ry, col, k in spots:
        g = np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2))
        img += g[..., None] * np.array(rgb(col), np.float32) * k
    rng = np.random.default_rng(seed)
    lum = img.mean(axis=2, keepdims=True) / 255
    img += rng.normal(0, 255 * grain, (h, w, 1)).astype(np.float32) * (0.25 + lum)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def haze(w, h, spots, grain=0.05, seed=11):
    """半透明光雾（RGBA）：叠在后景之上、前景之下，做出空气里的光；spots = [(cx, cy, rx, ry, 颜色, 不透明度)]"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    col = np.zeros((h, w, 3), np.float32); al = np.zeros((h, w), np.float32)
    for cx, cy, rx, ry, c, k in spots:
        g = np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)) * k
        col += g[..., None] * np.array(rgb(c), np.float32); al += g
    col /= np.maximum(al, 1e-6)[..., None]
    al = al * (1 + np.random.default_rng(seed).normal(0, grain * 4, (h, w)).astype(np.float32))
    return Image.fromarray(np.dstack([np.clip(col, 0, 255), np.clip(al * 255, 0, 255)]).astype(np.uint8), 'RGBA')


# ---------- 样机（Pixel 8） ----------
DEV = os.path.join(PF, 'assets', 'device', 'pixel_8')
FW, FH, SX, SY, SW, SH = 1187, 2513, 49, 55, 1080, 2400
SCREEN_R = 80   # 屏幕圆角（px，量自 mask.webp 第 0 行；mask 本身还会再盖一层圆角）
_frame = {}


def _frame_img():
    if 'f' not in _frame:
        back = Image.open(os.path.join(DEV, 'back.webp')).convert('RGBA')
        mask = Image.open(os.path.join(DEV, 'mask.webp')).convert('RGBA')
        lay = Image.new('RGBA', back.size, (0, 0, 0, 0)); lay.paste(mask, (SX, SY), mask)
        lay.alpha_composite(back); _frame['f'] = lay
        a = np.array(back.getchannel('A'))   # 机身轮廓（含屏幕区）→ 投影
        sil = Image.fromarray(((a > 0) * 255).astype(np.uint8)); sil.paste(255, (SX, SY, SX + SW, SY + SH))
        _frame['sil'] = sil
    return _frame['f']


def screen(name):
    return os.path.join(PF, 'assets', 'screens', f'{name}.png')


def phone(pg, scr, x, y, w, rot=0, shadow=0.55, label=None):
    """样机：x, y 为机身左上角（未旋转），w 为机身宽；rot 绕机身中心旋转（度）。
    分层：投影 PNG → 屏幕 <image>（clipPath 圆角，可在 Figma 单独换屏）→ 机身 PNG（含挖孔与圆角遮罩）"""
    f = _frame_img(); s = w / FW; h = FH * s
    cid = pg.uid('scr')
    pg.defs.append(f'<clipPath id="{cid}"><rect x="{x + SX * s:.1f}" y="{y + SY * s:.1f}" width="{SW * s:.1f}" height="{SH * s:.1f}" rx="{SCREEN_R * s:.1f}"/></clipPath>')
    cx, cy = x + w / 2, y + h / 2
    g = [f'<g data-name="{label or "Pixel 8"}" transform="rotate({rot} {cx:.1f} {cy:.1f})">']
    if shadow:
        pad = 0.12; sw, sh = int(FW * 0.25), int(FH * 0.25)
        sil = _frame['sil'].resize((sw, sh))
        canvas = Image.new('L', (int(sw * (1 + 2 * pad)), int(sh * (1 + 2 * pad))), 0)
        canvas.paste(sil, (int(sw * pad), int(sh * pad)))
        canvas = canvas.filter(ImageFilter.GaussianBlur(sw * 0.07))
        sh_im = Image.new('RGBA', canvas.size, (0, 0, 0, 0)); sh_im.putalpha(canvas.point(lambda v: int(v * shadow)))
        dw, dh = w * (1 + 2 * pad), h * (1 + 2 * pad)
        g.append(image(embed(sh_im, dw, dh, scale=sh_im.width / dw), x - w * pad + w * 0.04, y - h * pad + h * 0.03, dw, dh))
    g.append(f'<g clip-path="url(#{cid})">' + image(embed(scr if isinstance(scr, Image.Image) else Image.open(scr), SW * s, SH * s), x + SX * s, y + SY * s, SW * s, SH * s) + '</g>')
    g.append(image(embed(f, w, h, fmt='png'), x, y, w, h))
    g.append('</g>')
    pg.add('\n'.join(g))
    return (x, y, w, h)


# ---------- 页头 / 页脚 / 标注 ----------
STAGES = {**{n: '总览' for n in (1, 2)}, **{n: '定义' for n in (3, 4, 5)}, **{n: '结构与视觉' for n in (6, 7)},
          **{n: '标志性页面' for n in range(8, 13)}, **{n: '增长' for n in (13, 14)}, **{n: '动效与主题' for n in (15, 16, 17)},
          **{n: '体系与过程' for n in (18, 19, 20)}, **{n: '收尾' for n in (21, 22)}}


def header(pg, title, claim, desc=None, x=L, y=150, small=False):
    """页头：眉题 Mono 14「NN — 阶段」· 专题名 54/800 · 主张句 28/700 · 说明 18/500；small = 压图变体（专题名 40）"""
    t = 40 if small else 54
    out = [text(x, y, f'{pg.n:02d} — {STAGES[pg.n]}', 14, 500, 'mono', LIME, ls=1.5),
           text(x, y + 22 + t, title, t, 800),
           text(x, y + 22 + t + 50, claim, 28, 700, fill=BONE)]
    if desc:
        for i, line in enumerate(desc if isinstance(desc, list) else [desc]):
            out.append(text(x, y + 22 + t + 50 + 40 + i * 30, line, 18, 500, fill=BONE2))
    pg.add(*out)


def footer(pg, light=False):
    ink = BONE2
    pg.add(f'<line x1="{L}" y1="1020" x2="{R}" y2="1020" stroke="{ink}" stroke-opacity="0.25" stroke-width="1"/>',
           text(L, 1050, '慢牛 Milo · 产品与交互设计', 14, 500, fill=ink),
           text(R, 1050, f'{pg.n:02d} / {TOTAL}', 14, 500, 'mono', ink, anchor='end'))


def callout(pg, dot, end, num, label, side='right'):
    """标注：荧光小点 → 细引线（可折一次）→ Mono 编号 + 一行说明"""
    (dx, dy), (ex, ey) = dot, end
    a = 'start' if side == 'right' else 'end'; sgn = 1 if side == 'right' else -1
    pg.add(f'<polyline points="{dx:.1f},{dy:.1f} {ex:.1f},{ey:.1f} {ex + sgn * 24:.1f},{ey:.1f}" fill="none" stroke="{BONE}" stroke-opacity="0.55" stroke-width="1"/>',
           f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="5" fill="{LIME}"/>',
           f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="11" fill="none" stroke="{LIME}" stroke-opacity="0.4"/>',
           text(ex + sgn * 34, ey + 5, num, 14, 600, 'mono', LIME, anchor=a),
           text(ex + sgn * 66, ey + 6, label, 18, 500, fill=BONE, anchor=a))


# ---------- 品牌：递增条牛头（矢量，几何取自 src/components/Logo.tsx） ----------
BARS = [(5, 18), (12, 25.5), (14.5, 30.5), (16, 35.5), (16.5, 41), (16, 35.5), (14.5, 30.5), (12, 25.5), (5, 18)]
BAR_W, BAR_GAP = 3.4, 1.3


def logo(x, y, size, horn=LIME, bar=BONE):
    """48 × 48 画布的递增条牛头，倾斜 11°；x, y 为画布左上角，size 为画布边长"""
    x0 = 24 - (9 * BAR_W + 8 * BAR_GAP) / 2
    rects = []
    for i, (t, b) in enumerate(BARS):
        fill = horn if i in (0, 8) else bar
        rects.append(f'<rect x="{x0 + i * (BAR_W + BAR_GAP):.2f}" y="{t}" width="{BAR_W}" height="{b - t}" rx="{BAR_W / 2}" fill="{fill}"/>')
    return f'<g data-name="Logo" transform="translate({x:.1f} {y:.1f}) scale({size / 48:.4f}) translate(4.67 0) skewX(-11)">{"".join(rects)}</g>'
