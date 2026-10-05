#!/usr/bin/env python3
"""商城商品图（2026-10-05）：用户按 design/brand/prompts/nanobanana-shop.md 用 Nano Banana 出图（品红纯色底、无阴影），这里抠图、裁成正方形导出。

来源：docs/sources/shop/<商品 id>.png 或 .jpg（id 与 src/data/growth.ts 的 PRODUCTS 一致：belt-10 / straps / whey / creatine / knee）。
流程：找最大的一块（商品本身）→ 和小牛同一套抠图（scripts/mascot_png.py 的 matte：边缘按「像素 = α·前景 + (1−α)·底」反解 α），
      用品红键（min(R, B) − G，像绿幕：黑、骨白、荧光的边缘都能准确反解），实心区往里收 1 像素防品红边→ 等比放进正方形、四周留 6% → 成品尺寸上轻微羽化。
导出：public/shop/<id>.webp（App 用，512 × 512）、design/brand/shop/<id>.png（母版，1024 × 1024）。ProductCard 有图就显示，没有就显示占位。

  python3 scripts/shop_png.py            # 处理 docs/sources/shop/ 里所有的图
依赖：numpy、opencv-python-headless、Pillow。"""
import glob, os, sys
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mascot_png import bg_color, dist, feather, matte  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SIZES = {'public': 512, 'master': 1024}
PAD = 0.06


def cutout(path):
    img = cv2.imread(path)
    bg = bg_color(img); d = dist(img, bg)
    m = (cv2.GaussianBlur(d, (0, 0), 1.5) > 40).astype(np.uint8)
    cnt, cc, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = st[k, 0], st[k, 1], st[k, 2], st[k, 3]
    mem = cv2.dilate((cc == k).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(bool)
    rgba = matte(img, bg, mem, hi=200, lo=12, key='magenta', shrink=1, open_bg_holes=True)  # 品红键量程 ≈ 240：实心要 200 以上，半混的边缘像素不算实心
    m2 = 16
    return rgba[max(0, y - m2):y + h + m2, max(0, x - m2):x + w + m2]


def square(rgba, size):
    h, w = rgba.shape[:2]; s = size * (1 - 2 * PAD) / max(w, h)
    im = cv2.resize(rgba, (max(1, round(w * s)), max(1, round(h * s))), interpolation=cv2.INTER_AREA)
    out = np.zeros((size, size, 4), np.uint8)
    oy, ox = (size - im.shape[0]) // 2, (size - im.shape[1]) // 2
    out[oy:oy + im.shape[0], ox:ox + im.shape[1]] = im
    return feather(out)


def main():
    src = sorted(glob.glob(os.path.join(ROOT, 'docs', 'sources', 'shop', '*.png')) + glob.glob(os.path.join(ROOT, 'docs', 'sources', 'shop', '*.jpg')))
    if not src: print('docs/sources/shop/ 里还没有图'); return
    pub = os.path.join(ROOT, 'public', 'shop'); master = os.path.join(ROOT, 'design', 'brand', 'shop')
    os.makedirs(pub, exist_ok=True); os.makedirs(master, exist_ok=True)
    for p in src:
        pid = os.path.splitext(os.path.basename(p))[0]
        rgba = cutout(p)
        Image.fromarray(cv2.cvtColor(square(rgba, SIZES['public']), cv2.COLOR_BGRA2RGBA)).save(os.path.join(pub, pid + '.webp'), quality=90, method=6)
        Image.fromarray(cv2.cvtColor(square(rgba, SIZES['master']), cv2.COLOR_BGRA2RGBA)).save(os.path.join(master, pid + '.png'), optimize=True)
        print('saved', pid)


if __name__ == '__main__':
    main()
