#!/usr/bin/env python3
"""IP 小牛 PNG 素材（2026-10-05，用户决定 IP 改用 PNG）：从用户用 Nano Banana 出的状态板里切出 5 种牛龄 × 6 种状态，
高清化、抠图、按牛龄统一比例和地面线，导出进 App 的素材。

来源：docs/B1.jpg … B5.jpg（每种牛龄一张 3 × 2 状态板：平常 / 专注 / 开心 | 恢复日 / 破纪录 / 减量周），
      docs/A.jpg（5 种牛龄的平常状态排一排，只用来量各牛龄的相对身高）。

流程：
1. 切图：按颜色和背景的距离找连通块，每格最大的一块是牛身——只要牛本身，z、碎屑、速度线、星光、Milo 的泛光都不要
   （用户 2026-10-05：特效进 App 时由代码生成）；状态板里的英文标签自然也不在里面。
2. 高清化：Real-ESRGAN（RealESRGAN_x4plus_anime_6B，专门给平涂插画用的 4 倍超分）——去掉 JPEG 的块状噪点，边缘变锐。
   CPU 跑，分块推理；结果缓存在 .cache/mascot/，权重第一次运行时自动下载。
3. 抠图（在 4 倍图上做）：
   - 实心区 = 和背景色差够大的像素；被实心区包住的暗色小洞（眼睛、鼻孔、四角星眼）也算实心；
   - 边缘按「像素 = α·前景 + (1−α)·背景」反解 α，前景色取最近的实心像素（去掉黑边）；
   - Milo（2026-10-05 用户：边缘还有没扣干净的泛光）改用 BiRefNet（ZhengPeng7/BiRefNet_HR-matting，2048 输入）直接预测 α：
     只留牛身那一块（四角星丢掉），去掉泛光留下的低 α 雾，边缘颜色取最近的实心像素（不带泛光的色偏）。光晕由 App 叠加。
4. 规整：同一牛龄的 6 张用同一个比例、同一条地面线、同一块画布（换状态不跳）；各牛龄的大小按 A 的相对身高。
5. 导出：public/mascot/<牛龄>-<状态>.webp（App 用）和 design/brand/mascot/<牛龄>-<状态>.png（PNG 母版），
   非 Milo 另出 public/mascot/<牛龄>-<状态>-lime.webp（只有荧光的角，App 用它叠微光），
   以及 src/components/mascotAssets.ts（画布尺寸、地面线、头像裁切框）。
   头像框是逐张标定的「头 + 角」外框（HEAD，画布像素），导出时外扩成正方形、留出圆形裁切的余量。

  python3 scripts/mascot_png.py            # 全流程（第一次要几分钟：超分在 CPU 上跑）
  python3 scripts/mascot_png.py --sheet    # 另出检查图 screenshots/brand/mascot-sheet-*.png
依赖：numpy、opencv-python-headless、torch（CPU 版即可）、Pillow；Milo 另要 transformers、timm（BiRefNet，权重缓存在 .cache/hf/）。"""
import argparse, hashlib, json, os, urllib.request
import numpy as np, cv2

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CACHE = os.path.join(ROOT, '.cache', 'mascot')
WEIGHTS_URL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth'
STAGES = ['newborn', 'young', 'sturdy', 'bull', 'milo']
MOODS = ['idle', 'focused', 'happy', 'rest', 'pr', 'deload']  # 状态板里的顺序：上排 3 个、下排 3 个
SHEET = {s: f'docs/B{i + 1}.jpg' for i, s in enumerate(STAGES)}
SR = 4
OUT_H = {'bull': 560}  # 公牛平常状态的身高（像素）；其余牛龄按 A 的比例换算


# ---------- Real-ESRGAN（RRDBNet，anime 6B）：只需要推理，结构照原论文实现 ----------
def load_sr():
    import torch, torch.nn as nn, torch.nn.functional as F

    class RDB(nn.Module):
        def __init__(s, nf=64, gc=32):
            super().__init__()
            s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
            s.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1); s.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
            s.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1); s.lrelu = nn.LeakyReLU(0.2, True)

        def forward(s, x):
            x1 = s.lrelu(s.conv1(x)); x2 = s.lrelu(s.conv2(torch.cat((x, x1), 1)))
            x3 = s.lrelu(s.conv3(torch.cat((x, x1, x2), 1))); x4 = s.lrelu(s.conv4(torch.cat((x, x1, x2, x3), 1)))
            return s.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x

    class RRDB(nn.Module):
        def __init__(s, nf=64):
            super().__init__(); s.rdb1, s.rdb2, s.rdb3 = RDB(nf), RDB(nf), RDB(nf)

        def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x

    class RRDBNet(nn.Module):
        def __init__(s, nb=6, nf=64):
            super().__init__()
            s.conv_first = nn.Conv2d(3, nf, 3, 1, 1); s.body = nn.Sequential(*[RRDB(nf) for _ in range(nb)])
            s.conv_body = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
            s.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_last = nn.Conv2d(nf, 3, 3, 1, 1); s.lrelu = nn.LeakyReLU(0.2, True)

        def forward(s, x):
            f = s.conv_first(x); f = f + s.conv_body(s.body(f))
            f = s.lrelu(s.conv_up1(F.interpolate(f, scale_factor=2, mode='nearest')))
            f = s.lrelu(s.conv_up2(F.interpolate(f, scale_factor=2, mode='nearest')))
            return s.conv_last(s.lrelu(s.conv_hr(f)))

    os.makedirs(CACHE, exist_ok=True)
    wp = os.path.join(CACHE, 'RealESRGAN_x4plus_anime_6B.pth')
    if not os.path.exists(wp): urllib.request.urlretrieve(WEIGHTS_URL, wp)
    net = RRDBNet(); sd = torch.load(wp, map_location='cpu', weights_only=True)
    net.load_state_dict(sd.get('params_ema', sd.get('params', sd)), strict=True); net.eval()

    def run(img_bgr, tile=160, pad=12):
        """分块 4 倍超分（块之间重叠 pad 像素，拼接时只取中间）"""
        h, w = img_bgr.shape[:2]
        x = torch.from_numpy(img_bgr[:, :, ::-1].astype(np.float32) / 255).permute(2, 0, 1)[None]
        out = np.zeros((h * SR, w * SR, 3), np.float32)
        with torch.no_grad():
            for y0 in range(0, h, tile):
                for x0 in range(0, w, tile):
                    ya, xa, yb, xb = max(0, y0 - pad), max(0, x0 - pad), min(h, y0 + tile + pad), min(w, x0 + tile + pad)
                    o = net(x[:, :, ya:yb, xa:xb]).clamp(0, 1)[0].permute(1, 2, 0).numpy()
                    ty, tx = (y0 - ya) * SR, (x0 - xa) * SR
                    th, tw = (min(h, y0 + tile) - y0) * SR, (min(w, x0 + tile) - x0) * SR
                    out[y0 * SR:y0 * SR + th, x0 * SR:x0 * SR + tw] = o[ty:ty + th, tx:tx + tw]
        return (out[:, :, ::-1] * 255 + 0.5).astype(np.uint8)
    return run


# ---------- 切图 ----------
def bg_color(img):
    b = np.concatenate([img[:8].reshape(-1, 3), img[-8:].reshape(-1, 3), img[:, :8].reshape(-1, 3), img[:, -8:].reshape(-1, 3)])
    return np.median(b, 0)


def dist(img, bg): return np.abs(img.astype(np.float32) - bg).max(-1)


def figures(img, n=6, thr=34):
    """状态板 → n 只牛：[(牛身 bbox, 归给它的所有块的 mask)]，按「上排左→右、下排左→右」排序"""
    bg = bg_color(img); d = dist(img, bg)
    m = (cv2.GaussianBlur(d, (0, 0), 1.2) > thr).astype(np.uint8)
    cnt, cc, st, cen = cv2.connectedComponentsWithStats(m, connectivity=8)
    order = np.argsort(-st[1:, cv2.CC_STAT_AREA])[:n] + 1
    mains = sorted(order, key=lambda i: (round(cen[i][1] / img.shape[0] * 2 - 0.5), cen[i][0]))  # 先按行，再按列
    if len(set(round(cen[i][1] / img.shape[0] * 2 - 0.5) for i in mains)) != 2:
        mains = sorted(order, key=lambda i: (cen[i][1] > np.median([cen[j][1] for j in order]), cen[i][0]))
    # 只要牛本身：z、碎屑、速度线、星光、泛光这些特效都不要（用户 2026-10-05：特效进 App 时由代码生成）
    out = []
    for i in mains:
        mk = cc == i
        b = (st[i, 0], st[i, 1], st[i, 0] + st[i, 2], st[i, 1] + st[i, 3])
        out.append((b, mk, b))
    return out, bg


# ---------- 抠图 ----------
def matte(sr, bg, member, hi, lo):
    """sr = 4 倍超分后的裁切图；member = 这只牛（已放大到同尺寸，并外扩过）；
    hi = 实心阈值（和背景的色差）；lo = 牛身外面一圈的底色水平（一般是背景 ≈ 7；Milo 外面是泛光 ≈ 60，把光当底扣掉）"""
    H, W = sr.shape[:2]
    d = dist(sr, bg)
    core = (d > hi) & member
    core = cv2.morphologyEx(core.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    # 被实心区包住的洞：小的（眼睛、鼻孔、星星眼）算实心；大的（腿缝、尾巴圈住的背景）还是背景
    holes = (~core).astype(np.uint8); cv2.floodFill(holes, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 0)
    cnt, cc, st, _ = cv2.connectedComponentsWithStats(holes, connectivity=8)
    fill = np.zeros((H, W), bool)
    ys, xs = np.nonzero(core); fig_area = (ys.max() - ys.min()) * (xs.max() - xs.min())
    for j in range(1, cnt):
        if st[j, cv2.CC_STAT_AREA] < 0.008 * fig_area: fill |= cc == j  # 眼睛最大约 0.5%，尾巴圈住的背景约 1% 以上
    solid = core | fill
    # 边缘：像素 = α·F + (1−α)·底，F 取最近的实心像素颜色（换掉边上混进去的底色，不留黑边 / 绿边）
    _, lab = cv2.distanceTransformWithLabels((~core).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    cy, cx = np.nonzero(core); lut = np.zeros((lab.max() + 1, 3), np.float32); lut[1:len(cy) + 1] = sr[cy, cx]
    Fc = lut[lab]
    dF = np.abs(Fc - bg).max(-1)
    a = np.clip((d - lo) / np.maximum(dF - lo, 1), 0, 1)
    near = cv2.dilate(solid.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))).astype(bool)
    a = np.where(solid, 1.0, np.where(near & member, a, 0.0))
    rgb = np.where(solid[..., None], sr.astype(np.float32), Fc)
    a = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 0.5) * (~solid) + solid
    return np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)


# ---------- Milo：BiRefNet 直接出 α ----------
BIREFNET = 'ZhengPeng7/BiRefNet_HR-matting'
BIREF_SIZE = 2048  # 1024 会把一部分泛光当半透明前景；2048 的边缘贴着牛身


def load_birefnet():
    import torch
    os.environ.setdefault('HF_HOME', os.path.join(ROOT, '.cache', 'hf'))
    from transformers import AutoModelForImageSegmentation
    net = AutoModelForImageSegmentation.from_pretrained(BIREFNET, trust_remote_code=True).eval().float()

    def run(img_bgr):
        h, w = img_bgr.shape[:2]
        x = cv2.resize(img_bgr, (BIREF_SIZE, BIREF_SIZE), interpolation=cv2.INTER_AREA)[:, :, ::-1].astype(np.float32) / 255
        x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        with torch.no_grad(): a = net(torch.from_numpy(x.transpose(2, 0, 1)).float()[None])[-1].sigmoid()[0, 0].numpy()
        return np.clip(cv2.resize(a, (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)
    return run


def matte_alpha(sr, bg, a, member, edge=8):
    """BiRefNet 的 α → RGBA。BiRefNet 大多数地方边缘贴着牛身，但会把「两角之间、腿缝里被泛光填满的地方」整块判成前景
    （破纪录那张最明显）。泛光是缓慢渐变，牛身边缘是一步到位的硬边——所以再用硬边圈一次：
    从画面边缘往里灌，碰到硬边停，灌到的是外面；被硬边围住、但里面掺着底色（10% 分位和底色差 < 40）的块也是外面。
    牛身 = 硬边圈出来的区域，加上外面里「平的、和底色差够大」的大块（蹄子的边偏软，灌水会漏进去）；α 取 BiRefNet 和颜色（差 50 → 0、差 85 → 1）里较大的那个（BiRefNet 偶尔漏掉蹄子），
    只留牛身那一块（四角星丢掉），半透明的边缘颜色换成最近的实心像素（不带泛光、底色的色偏）。"""
    d = dist(sr, bg).astype(np.float32)
    g = cv2.GaussianBlur(d, (0, 0), 1.0)
    grad = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)) / 8
    hard = cv2.dilate((grad > edge).astype(np.uint8), np.ones((3, 3), np.uint8))
    H, W = d.shape
    ff = 1 - hard; cv2.floodFill(ff, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 2)
    cnt, cc, st, _ = cv2.connectedComponentsWithStats((ff == 1).astype(np.uint8), connectivity=4)
    out = np.zeros(cnt, bool)
    for k in range(1, cnt):
        if np.percentile(d[cc == k], 10) < 40: out[k] = True
    body = (ff != 2) & ~out[cc]
    # 蹄子和底色之间的边偏软，灌水会漏进蹄子：外面里「平的、和底色差够大」的大块（蹄子）捞回来——泛光是渐变，不平
    flat = ((grad < 0.7) & (d > 75) & (ff == 2)).astype(np.uint8)
    cnt, cc, st, _ = cv2.connectedComponentsWithStats(flat, connectivity=4)
    big = np.zeros(cnt, bool); big[1:] = st[1:, cv2.CC_STAT_AREA] > 300
    body |= cv2.dilate(big[cc].astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    body = cv2.GaussianBlur(cv2.dilate(body.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1)
    ac = np.clip((d - 50) / 35, 0, 1)
    a = np.maximum(np.clip((a - 0.12) / 0.76, 0, 1), ac) * body * cv2.GaussianBlur(member.astype(np.float32), (0, 0), 3)
    cnt, cc, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), connectivity=8)
    body = cc == (np.argmax(st[1:, cv2.CC_STAT_AREA]) + 1)
    near = cv2.dilate(body.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))).astype(bool)
    a = a * near
    core = cv2.erode((a > 0.97).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    _, lab = cv2.distanceTransformWithLabels((~core).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    cy, cx = np.nonzero(core); lut = np.zeros((lab.max() + 1, 3), np.float32); lut[1:len(cy) + 1] = sr[cy, cx]
    rgb = np.where(core[..., None], sr.astype(np.float32), lut[lab])
    return np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)


def heights_from_A():
    """A 里 5 种牛龄（平常）的身高，返回相对公牛的比例"""
    img = cv2.imread(os.path.join(ROOT, 'docs', 'A.jpg'))
    bg = bg_color(img); d = dist(img, bg)
    m = (cv2.GaussianBlur(d, (0, 0), 1.2) > 34).astype(np.uint8)
    cnt, cc, st, cen = cv2.connectedComponentsWithStats(m, connectivity=8)
    big = sorted(np.argsort(-st[1:, cv2.CC_STAT_AREA])[:5] + 1, key=lambda i: cen[i][0])
    h = {s: float(st[i, cv2.CC_STAT_HEIGHT]) for s, i in zip(STAGES, big)}
    return {s: h[s] / h['bull'] for s in STAGES}


# 头像框：逐张标定的「头 + 角」外框 [x, y, 边长]（画布像素，2026-10-05 按 --sheet 检查图量的）。
# 旧算法以角为锚往下取正方形，侧身的小牛会把肩、腿框进来（用户：头像蒙版出错），所以改成人工标定。
# Milo 的画布随 BiRefNet 抠图变，所以 Milo 用牛身外框的比例 [cx, cy, 边长]（cx、边长按牛身宽，cy 按牛身高）。
HEAD = {
    'newborn': {'idle': [212, 38, 180], 'focused': [222, 60, 180], 'happy': [192, 8, 185], 'rest': [215, 95, 180], 'pr': [195, 8, 175], 'deload': [210, 48, 180]},
    'young': {'idle': [300, 37, 230], 'focused': [380, 98, 240], 'happy': [300, 0, 230], 'rest': [352, 185, 225], 'pr': [312, 24, 235], 'deload': [330, 97, 230]},
    'sturdy': {'idle': [407, 65, 320], 'focused': [510, 138, 320], 'happy': [395, 13, 310], 'rest': [441, 249, 310], 'pr': [395, 0, 300], 'deload': [413, 109, 310]},
    'bull': {'idle': [365, 26, 360], 'focused': [496, 145, 340], 'happy': [365, 5, 340], 'rest': [430, 270, 335], 'pr': [392, 26, 290], 'deload': [405, 137, 320]},
}
MILO_HEAD = {'idle': [0.66, 0.24, 0.42], 'focused': [0.7, 0.33, 0.4], 'happy': [0.62, 0.22, 0.42], 'rest': [0.66, 0.4, 0.42], 'pr': [0.62, 0.22, 0.42], 'deload': [0.66, 0.3, 0.42]}
HEAD_PAD = 1.12  # 圆形裁切：正方形的内切圆要装下头和角，外扩一点


def head_box(stage, mood, body):
    if stage == 'milo':
        bx0, by0, bx1, by1 = body; fx, fy, fs = MILO_HEAD[mood]
        cx, cy, side = bx0 + fx * (bx1 - bx0), by0 + fy * (by1 - by0), fs * (bx1 - bx0)
    else:
        x, y, side = HEAD[stage][mood]; cx, cy = x + side / 2, y + side / 2
    side *= HEAD_PAD
    return [int(round(cx - side / 2)), int(round(cy - side / 2)), int(round(side)), int(round(side))]


def lime_layer(rgba):
    """只留荧光（非 Milo 的角）：荧光度按 G − B 算，乘原图 α；App 把它模糊后垫在图下面，当微光"""
    rgb = rgba[:, :, :3].astype(np.float32); b, g, r = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lime = np.clip((g - b - 70) / 50, 0, 1) * np.clip((g - 150) / 40, 0, 1) * (rgba[:, :, 3] / 255.0)
    out = np.zeros_like(rgba); out[:, :, :3] = rgba[:, :, :3]; out[:, :, 3] = np.clip(lime * 255, 0, 255).astype(np.uint8)
    return out


def main(sheet):
    from PIL import Image
    sr_run = biref = None
    ratio = heights_from_A()
    out_pub = os.path.join(ROOT, 'public', 'mascot'); out_png = os.path.join(ROOT, 'design', 'brand', 'mascot')
    os.makedirs(out_pub, exist_ok=True); os.makedirs(out_png, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
    meta = {}
    for stage in STAGES:
        img = cv2.imread(os.path.join(ROOT, SHEET[stage]))
        milo = stage == 'milo'
        figs, bg = figures(img, thr=85 if milo else 34)  # Milo 外面有泛光：阈值抬高，只取牛身
        mats = []
        for k, ((x0, y0, x1, y1), member, body) in enumerate(figs):
            m = 40 if milo else 14  # Milo 留宽一点：BiRefNet 要看到牛身外面的泛光和底，才分得清
            X0, Y0, X1, Y1 = max(0, x0 - m), max(0, y0 - m), min(img.shape[1], x1 + m), min(img.shape[0], y1 + m)
            crop = img[Y0:Y1, X0:X1]
            key = hashlib.md5(crop.tobytes()).hexdigest()[:12]
            cp = os.path.join(CACHE, f'{stage}-{MOODS[k]}-{key}.png')
            if os.path.exists(cp): sr = cv2.imread(cp)
            else:
                if sr_run is None: sr_run = load_sr()
                print('  超分', stage, MOODS[k], crop.shape[1], '×', crop.shape[0]); sr = sr_run(crop); cv2.imwrite(cp, sr)
            mem = member[Y0:Y1, X0:X1].astype(np.uint8)
            mem = cv2.dilate(mem, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
            mem = cv2.resize(mem, (sr.shape[1], sr.shape[0]), interpolation=cv2.INTER_NEAREST).astype(bool)
            if milo:
                ap = os.path.join(CACHE, f'{stage}-{MOODS[k]}-{key}-alpha{BIREF_SIZE}.png')
                if os.path.exists(ap): a = cv2.imread(ap, cv2.IMREAD_GRAYSCALE) / 255.0
                else:
                    if biref is None: biref = load_birefnet()
                    print('  BiRefNet', stage, MOODS[k]); a = biref(sr); cv2.imwrite(ap, (a * 255 + 0.5).astype(np.uint8))
                rgba = matte_alpha(sr, bg, a, mem)
            else: rgba = matte(sr, bg, mem, hi=58, lo=7)
            bx0, by0, bx1, by1 = body
            ground = (by1 - Y0) * SR                       # 牛身最低点 = 地面线
            cxb = ((bx0 + bx1) / 2 - X0) * SR               # 牛身横向中心
            hb = (by1 - by0) * SR
            mats.append((rgba, ground, cxb, hb))
        # 同一牛龄：同比例（按平常状态的身高）、同地面线、同画布
        s = OUT_H['bull'] * ratio[stage] / mats[0][3]
        scaled = []
        for rgba, ground, cxb, hb in mats:
            im = cv2.resize(rgba, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
            ys, xs = np.nonzero(im[:, :, 3] > 3)
            scaled.append((im, ground * s, cxb * s, ys.min(), ys.max(), xs.min(), xs.max()))
        up = max(g - y0 for im, g, c, y0, y1, x0, x1 in scaled); down = max(y1 - g for im, g, c, y0, y1, x0, x1 in scaled)
        left = max(c - x0 for im, g, c, y0, y1, x0, x1 in scaled); right = max(x1 - c for im, g, c, y0, y1, x0, x1 in scaled)
        pad = 6
        CW, CH = int(np.ceil(left + right)) + 2 * pad, int(np.ceil(up + down)) + 2 * pad
        gy, gx = pad + up, pad + left
        meta[stage] = {'w': CW, 'h': CH, 'ground': round(float(gy), 1), 'moods': {}}
        for k, (im, g, c, *_) in enumerate(scaled):
            canvas = np.zeros((CH, CW, 4), np.uint8)
            M = np.float32([[1, 0, gx - c], [0, 1, gy - g]])
            canvas = cv2.warpAffine(im, M, (CW, CH), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
            name = f'{stage}-{MOODS[k]}'
            pil = Image.fromarray(cv2.cvtColor(canvas, cv2.COLOR_BGRA2RGBA))
            pil.save(os.path.join(out_png, name + '.png'), optimize=True)
            pil.save(os.path.join(out_pub, name + '.webp'), quality=92, method=6)
            if not milo:
                Image.fromarray(cv2.cvtColor(lime_layer(canvas), cv2.COLOR_BGRA2RGBA)).save(os.path.join(out_pub, name + '-lime.webp'), quality=80, method=6)
            ys, xs = np.nonzero(canvas[:, :, 3] > 128)
            body = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
            meta[stage]['moods'][MOODS[k]] = {'head': head_box(stage, MOODS[k], body), 'body': body}
        print(stage, CW, '×', CH, 'ground', round(gy), 'scale', round(s, 3))
    ts = ['/** 由 scripts/mascot_png.py 生成，勿手改：IP 小牛 PNG 素材的画布尺寸（像素）、地面线 y、各状态的头像裁切框 [x, y, 边长]。',
          ' *  头像框是逐张标定的「头 + 角」，已外扩成能放进圆形的正方形。非 Milo 另有 <牛龄>-<状态>-lime.webp（只有荧光的角，叠微光用）。',
          ' *  body = 牛身外框 [x0, y0, x1, y1]（App 按它和头像框摆放代码生成的特效）。图片在 public/mascot/<牛龄>-<状态>.webp（PNG 母版在 design/brand/mascot/）。同一牛龄 6 张同画布、同比例、同地面线。 */',
          "export type MascotStage = 'newborn' | 'young' | 'sturdy' | 'bull' | 'milo';",
          "export type MascotMood = 'idle' | 'focused' | 'happy' | 'rest' | 'pr' | 'deload';",
          'export interface MascotAsset { w: number; h: number; ground: number; moods: Record<MascotMood, { head: [number, number, number, number]; body: [number, number, number, number] }> }',
          f'export const MASCOT_ASSETS: Record<MascotStage, MascotAsset> = {json.dumps(meta, separators=(",", ":"))};', '']
    open(os.path.join(ROOT, 'src', 'components', 'mascotAssets.ts'), 'w').write('\n'.join(ts))
    if sheet: contact(meta)


def contact(meta):
    """检查图：每种牛龄 6 张贴在棋盘格（透明）和深色底上，头像（圆形裁切）画红圈"""
    out = os.path.join(ROOT, 'screenshots', 'brand'); os.makedirs(out, exist_ok=True)
    for bgname, bgc in (('dark', (11, 10, 10)), ('checker', None)):
        rows = []
        for stage in STAGES:
            tiles = []
            for mood in MOODS:
                im = cv2.imread(os.path.join(ROOT, 'design', 'brand', 'mascot', f'{stage}-{mood}.png'), cv2.IMREAD_UNCHANGED)
                h, w = im.shape[:2]
                if bgc is None:
                    yy, xx = np.mgrid[0:h, 0:w]; base = np.where(((yy // 16 + xx // 16) % 2)[..., None] == 0, 205, 245).astype(np.float32).repeat(3, -1)
                else: base = np.full((h, w, 3), bgc, np.float32)
                a = im[:, :, 3:4] / 255.0; t = (im[:, :, :3] * a + base * (1 - a)).astype(np.uint8)
                x, y, sd, _ = meta[stage]['moods'][mood]['head']; cv2.circle(t, (x + sd // 2, y + sd // 2), sd // 2, (60, 60, 255), 2)
                cv2.line(t, (0, int(meta[stage]['ground'])), (w, int(meta[stage]['ground'])), (255, 120, 0), 1)
                tiles.append(cv2.resize(t, (int(w * 260 / h), 260)))
            rows.append(np.concatenate(tiles, 1))
        W = max(r.shape[1] for r in rows)
        rows = [cv2.copyMakeBorder(r, 4, 4, 0, W - r.shape[1], cv2.BORDER_CONSTANT, value=(40, 40, 40)) for r in rows]
        cv2.imwrite(os.path.join(out, f'mascot-sheet-{bgname}.png'), np.concatenate(rows, 0))


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--sheet', action='store_true')
    main(ap.parse_args().sheet)
