#!/usr/bin/env python3
"""IP 小牛的几何构造（阶段 5.5b 第七轮，2026-10-05）：按用户手绘的体块布尔参考（docs/微信图片_20261005145053_193_3.jpg …208）
一块一块搭出来——每个部件都是几个圆的「外切包络」（两三个圆用公切线连起来）加上少量交 / 差：
  公牛：躯干 = 肩圆 + 背圆的外切包络；头 = 三个圆的外切包络；鼻 = 两圆外切包络；角 = 外圆 − 偏右上的内圆 ∪ 圆头；
        臀 = 矩形 ∩ 大圆；后腿、远端前腿 = 大小两圆外切包络（上粗下细）；近端前腿 = 肩部大圆 ∩ 矩形 ∪ 两圆外切包络；
        尾杆 = 圆弧带（两端圆头）；尾梢 = 圆 + 尖的水滴；耳 = 两圆相交的叶形；蹄 = 半圆；眼 = 圆 ∩ 斜切半平面
  牛犊：躯干 = 臀圆 + 肚圆外切包络；头 = 头圆 + 鼻侧圆外切包络；鼻、腿 = 两圆外切包络（胶囊）；臀 = 圆 ∪ 直边腿；角 = 水滴
按远近逐层画（远端腿 → 躯干 → 尾 → 近端腿 → 耳 → 头 → 眼 → 角 → 鼻），每层允许伸进画在它上面的部件底下，层间没有缺口。
参考图是斜拍的，只取构造关系；各圆的位置和大小按原图目测给初值，再用 Powell 法对原图的平涂色块拟合。

输出 src/components/mascotGeo.ts：src = 构造树（保留布尔关系，可读可改）；geo = 同一组构造布尔后拍平的 path
（和设计软件里「布尔后拼合」一样），App 只画拍平的 path。

  python3 scripts/mascot_geo.py           拟合并生成 mascotGeo.ts
  python3 scripts/mascot_geo.py --check   正负叠片 + 品红底缺口检查（需要 dev server，见 --base）
依赖：numpy、opencv-python-headless、scipy、shapely；--check 另需 Playwright。"""
import argparse, json, os
import numpy as np, cv2
from scipy.optimize import minimize
import shapely
from shapely import affinity
from shapely.geometry import Point, Polygon, box
from shapely.geometry.polygon import orient

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'docs', 'brand-refs', 'ip2-geo-b-selected.jpg')
OUT_TS = os.path.join(ROOT, 'src', 'components', 'mascotGeo.ts')
K = 2752 / 2000  # 原图像素 / 缩略坐标
PAL = {'bg': (14, 14, 15), 'grey': (146, 141, 135), 'mid': (170, 165, 155), 'far': (201, 194, 178),
       'bone': (233, 226, 208), 'lime': (212, 254, 60), 'dark': (60, 58, 48)}
SH = 4  # cv2 亚像素位数
BIG = 4000


# ---------- 原图 → 平涂色标签（拟合的目标） ----------
def quantize(img, min_area):
    names = list(PAL); P = np.array([PAL[n] for n in names], np.float32); n = len(names)
    f = cv2.bilateralFilter(img.astype(np.float32), 7, 30, 5)
    lab = ((f[:, :, None, :] - P[None, None]) ** 2).sum(-1).argmin(-1).astype(np.uint8)
    vote = lambda l, k: np.stack([cv2.boxFilter((l == i).astype(np.float32), -1, (k, k)) for i in range(n)], -1)
    lab = vote(lab, 5).argmax(-1).astype(np.uint8)
    for i in range(n):
        cnt, cc, st, _ = cv2.connectedComponentsWithStats((lab == i).astype(np.uint8), connectivity=8)
        for j in range(1, cnt):
            if st[j, cv2.CC_STAT_AREA] < min_area: lab[cc == j] = 255
    while (lab == 255).any():
        v = vote(lab, 9); best = v.argmax(-1).astype(np.uint8); hole = (lab == 255) & (v.max(-1) > 0)
        lab[hole] = best[hole]
    return np.stack([cv2.GaussianBlur((lab == i).astype(np.float32), (0, 0), 1.6) for i in range(n)], -1).argmax(-1).astype(np.uint8)


def comp_at(lab, ci, x, y):
    n, cc = cv2.connectedComponents((lab == ci).astype(np.uint8), connectivity=8)
    if cc[y, x]: return cc == cc[y, x]
    ys, xs = np.nonzero(cc); k = ((ys - y) ** 2 + (xs - x) ** 2).argmin()
    return cc == cc[ys[k], xs[k]]


# ---------- 基本形与布尔：每个返回 (mask, 构造树) ----------
class G:
    """m = 栅格（拟合用），g = 构造树（源），s = 精确几何（只在最后一遍算：并 / 交 / 差拍平成一条 path 给 App 画）"""
    shape = (0, 0)
    exact = False

    def __init__(self, m, g, s=None): self.m, self.g, self.s = m, g, s


def _blank(): return np.zeros(G.shape, np.uint8)
def _q(v): return int(round(v * (1 << SH)))
def r1(v): return round(float(v), 1)


def C(cx, cy, r):
    m = _blank(); cv2.circle(m, (_q(cx), _q(cy)), _q(max(r, 0.5)), 1, -1, cv2.LINE_8, SH)
    return G(m.astype(bool), ['c', r1(cx), r1(cy), r1(r)], Point(cx, cy).buffer(max(r, 0.5), quad_segs=24) if G.exact else None)


def E(cx, cy, rx, ry, deg):
    m = _blank(); cv2.ellipse(m, ((float(cx), float(cy)), (float(2 * abs(rx)), float(2 * abs(ry))), float(deg)), 1, -1)
    s = affinity.rotate(affinity.scale(Point(cx, cy).buffer(1, quad_segs=24), abs(rx), abs(ry)), deg, origin=(cx, cy)) if G.exact else None
    return G(m.astype(bool), ['e', r1(cx), r1(cy), r1(abs(rx)), r1(abs(ry)), r1(deg)], s)


def P(pts):
    m = _blank(); cv2.fillPoly(m, [np.array([[_q(x), _q(y)] for x, y in pts], np.int64)], 1, cv2.LINE_8, SH)
    return G(m.astype(bool), ['p', [r1(v) for xy in pts for v in xy]], Polygon(pts).buffer(0) if G.exact else None)


def R(x, y, w, h, rx):
    w, h = abs(w), abs(h); rx = max(0, min(rx, w / 2, h / 2))
    m = _blank()
    cv2.rectangle(m, (_q(x + rx), _q(y)), (_q(x + w - rx), _q(y + h)), 1, -1, cv2.LINE_8, SH)
    cv2.rectangle(m, (_q(x), _q(y + rx)), (_q(x + w), _q(y + h - rx)), 1, -1, cv2.LINE_8, SH)
    for cx, cy in ((x + rx, y + rx), (x + w - rx, y + rx), (x + rx, y + h - rx), (x + w - rx, y + h - rx)):
        cv2.circle(m, (_q(cx), _q(cy)), _q(rx), 1, -1, cv2.LINE_8, SH)
    s = (box(x + rx, y + rx, x + w - rx, y + h - rx).buffer(rx, quad_segs=24) if rx > 0.05 else box(x, y, x + w, y + h)) if G.exact else None
    return G(m.astype(bool), ['r', r1(x), r1(y), r1(w), r1(h), r1(rx)], s)


def RR(x, y, w, h, rtl, rtr, rbr, rbl):
    """四角各自圆角的矩形（只圆一个角的腿、臀），输出成 path"""
    w, h = abs(w), abs(h)
    rs = [max(0.0, min(float(r), w, h)) for r in (rtl, rtr, rbr, rbl)]
    for a, b, lim in ((0, 1, w), (3, 2, w), (0, 3, h), (1, 2, h)):  # 相邻两角的半径之和不超过边长
        if rs[a] + rs[b] > lim: k = lim / (rs[a] + rs[b]); rs[a] *= k; rs[b] *= k
    tl, tr, br, bl = rs
    pts_, n = [], 16
    for (cx, cy, r, a0) in ((x + w - tr, y + tr, tr, -90), (x + w - br, y + h - br, br, 0), (x + bl, y + h - bl, bl, 90), (x + tl, y + tl, tl, 180)):
        for k in range(n + 1):
            a = np.radians(a0 + 90 * k / n); pts_.append((cx + r * np.cos(a), cy + r * np.sin(a)))
    m = _blank(); cv2.fillPoly(m, [np.array([[_q(px), _q(py)] for px, py in pts_], np.int64)], 1, cv2.LINE_8, SH)
    arc = lambda r, ex, ey: f'A{r1(r)},{r1(r)} 0 0 1 {r1(ex)},{r1(ey)}' if r > 0.05 else ''
    d = (f'M{r1(x + tl)},{r1(y)}H{r1(x + w - tr)}' + arc(tr, x + w, y + tr) + f'V{r1(y + h - br)}' + arc(br, x + w - br, y + h)
         + f'H{r1(x + bl)}' + arc(bl, x, y + h - bl) + f'V{r1(y + tl)}' + arc(tl, x + tl, y) + 'Z')
    return G(m.astype(bool), ['d', d], Polygon(pts_).buffer(0) if G.exact else None)


def HP(x1, y1, x2, y2):
    """半平面：沿 p1→p2 方向看，右手边（屏幕坐标、y 向下时的顺时针一侧）"""
    d = np.array([x2 - x1, y2 - y1], float); d /= np.linalg.norm(d) + 1e-9
    nrm = np.array([-d[1], d[0]])
    a, b = np.array([x1, y1]) - d * BIG, np.array([x2, y2]) + d * BIG
    return P([tuple(a), tuple(b), tuple(b + nrm * BIG), tuple(a + nrm * BIG)])


def HULL(cx, cy, r, pts):
    """圆与若干点的凸包：两条切线 + 一段圆弧，输出成 path（直线 + 一个 A 命令）"""
    n = 720
    ang = np.linspace(0, 2 * np.pi, n, endpoint=False)
    circ = np.stack([cx + r * np.cos(ang), cy + r * np.sin(ang)], 1)
    allp = np.concatenate([circ, np.array(pts, float)])
    hull = cv2.convexHull(allp.astype(np.float32), returnPoints=False)[:, 0]
    m = _blank(); cv2.fillPoly(m, [np.array([[_q(x), _q(y)] for x, y in allp[hull]], np.int64)], 1, cv2.LINE_8, SH)
    # 构造 path：外点之间直线、连续的圆上点合并成一段弧
    seq = list(hull)
    while seq[0] < n and seq[-1] < n: seq = seq[1:] + seq[:1]  # 让序列从一个外点开始（凸包里至少有一个外点）
    while seq[0] < n: seq = seq[1:] + seq[:1]
    pts_ = allp[np.array(seq)]
    area = sum(pts_[i][0] * pts_[(i + 1) % len(pts_)][1] - pts_[(i + 1) % len(pts_)][0] * pts_[i][1] for i in range(len(pts_)))
    sweep = 1 if area > 0 else 0
    d, i = f'M{r1(pts_[0][0])},{r1(pts_[0][1])}', 1
    while i < len(seq):
        if seq[i] >= n:
            d += f'L{r1(allp[seq[i]][0])},{r1(allp[seq[i]][1])}'; i += 1; continue
        j = i
        while j + 1 < len(seq) and seq[j + 1] < n: j += 1
        a0, a1 = allp[seq[i]], allp[seq[j]]
        span = (len(range(i, j + 1)) - 1) * 360 / n
        d += f'L{r1(a0[0])},{r1(a0[1])}A{r1(r)},{r1(r)} 0 {1 if span > 180 else 0} {sweep} {r1(a1[0])},{r1(a1[1])}'
        i = j + 1
    return G(m.astype(bool), ['d', d + 'Z'], Polygon(allp[hull]).buffer(0) if G.exact else None)


def HULLC(*cs):
    """若干圆（r = 0 即一个点）的外切包络 = 它们的凸包：两圆就是公切线连起来的胶囊 / 锥形，三圆就是圆角三角"""
    pts_ = []
    for cx, cy, r in cs:
        r = max(r, 0.0)
        if r < 0.3: pts_.append((cx, cy)); continue
        a = np.linspace(0, 2 * np.pi, 96, endpoint=False); pts_ += list(zip(cx + r * np.cos(a), cy + r * np.sin(a)))
    P_ = np.array(pts_, np.float32); hull = cv2.convexHull(P_)[:, 0]
    m = _blank(); cv2.fillPoly(m, [np.array([[_q(x), _q(y)] for x, y in hull], np.int64)], 1, cv2.LINE_8, SH)
    s = shapely.union_all([Point(cx, cy).buffer(max(r, 0.01), quad_segs=24) for cx, cy, r in cs]).convex_hull if G.exact else None
    return G(m.astype(bool), ['h', [[r1(cx), r1(cy), r1(max(r, 0))] for cx, cy, r in cs]], s)


def ARC(cx, cy, R_, w, a0, a1):
    """圆弧带（尾杆）：圆心、半径、带宽、起止角（度，屏幕坐标），两端圆头"""
    a = np.radians(np.linspace(a0, a1, 64)); line = np.stack([cx + R_ * np.cos(a), cy + R_ * np.sin(a)], 1)
    m = _blank(); w = max(w, 1.0)
    cv2.polylines(m, [np.array([[_q(x), _q(y)] for x, y in line], np.int64)], False, 1, max(1, int(round(w))), cv2.LINE_8, SH)
    for x, y in (line[0], line[-1]): cv2.circle(m, (_q(x), _q(y)), _q(w / 2), 1, -1, cv2.LINE_8, SH)
    s = shapely.LineString(line).buffer(w / 2, cap_style='round', quad_segs=16) if G.exact else None
    return G(m.astype(bool), ['a', r1(cx), r1(cy), r1(R_), r1(w), r1(a0), r1(a1)], s)


def U(*gs): return G(np.logical_or.reduce([g.m for g in gs]), ['u', *[g.g for g in gs]], shapely.union_all([g.s for g in gs]) if G.exact else None)
def I(a, b): return G(a.m & b.m, ['i', a.g, b.g], a.s.intersection(b.s) if G.exact else None)
def X(a, b): return G(a.m & ~b.m, ['x', a.g, b.g], a.s.difference(b.s) if G.exact else None)


def flat(s):
    """精确几何 → 一条 path（外轮廓逆时针、洞顺时针，nonzero 填充即可）"""
    s = s.simplify(0.12)
    polys = [s] if s.geom_type == 'Polygon' else [g for g in getattr(s, 'geoms', []) if g.geom_type == 'Polygon']
    d = ''
    for pg in polys:
        if pg.area < 1: continue
        pg = orient(pg, 1.0)
        for ring in [pg.exterior, *pg.interiors]:
            c = list(ring.coords)[:-1]
            d += 'M' + 'L'.join(f'{r1(x)},{r1(y)}' for x, y in c) + 'Z'
    return d
def LENS(cx1, cy1, r1_, cx2, cy2, r2): return I(C(cx1, cy1, r1_), C(cx2, cy2, r2))


def pts(v): return [(v[i], v[i + 1]) for i in range(0, len(v), 2)]


# ---------- 两只牛的构造（对照用户的体块参考；初值按原图目测，单位 = 裁切后的像素） ----------
# 每个部件：(部件, 颜色, 种子 [(色, x, y)], 构造函数, 初值)
FACE_TOP = 133  # 公牛脸的上沿（原图里是一条水平线，两只角的内缘都在这条线上收平）


def bull_parts(ground):
    hoof = lambda p: I(C(p[0], p[1], p[2]), P([(-BIG, -BIG), (BIG, -BIG), (BIG, ground), (-BIG, ground)]))
    return [
        # 202：远端后腿 = 大腿圆 ∪ 膝盖圆 + 蹄上小圆的外切包络（膝盖处是凹的，所以大腿单独一个圆）
        ('farLegs', 'far', [('far', 240, 440)], lambda p: U(C(*p[0:3]), HULLC(p[3:6], p[6:9])), [250, 375, 60, 222, 440, 32, 249, 520, 18]),
        ('farLegs', 'far', [('farLeg', 0, 0)], lambda p: HULLC(p[0:3], p[3:6]), [570, 378, 38, 590, 520, 18]),
        ('farLegs', 'mid', [('mid', 254, 521)], hoof, [254, 540, 30]),
        ('farLegs', 'mid', [('mid', 597, 518)], hoof, [597, 540, 30]),
        # 193：躯干 = 肩部大圆 + 背后小圆的外切包络
        ('torso', 'grey', [('grey', 400, 250), ('grey', 485, 100)], lambda p: HULLC(p[0:3], p[3:6]), [437, 258, 181, 285, 300, 90]),
        # 200：尾杆 = 圆弧带，两端圆头；201：尾梢 = 圆 + 尖的水滴
        ('tail', 'bone', [('tailStem', 0, 0)], lambda p: ARC(*p), [145, 335, 98, 13, -178, -90]),
        ('tail', 'grey', [('grey', 40, 360)], lambda p: HULLC(p[0:3], [p[3], p[4], 0]), [46, 350, 19, 26, 392]),
        # 202：近端后腿 = 大小两圆外切包络；199：臀 = 矩形 ∩（左上圆 ∪ 右下圆 ∪ 右上的方块）——矩形左边、上边与左上圆相切，右上是直角
        ('nearLegs', 'bone', [('nearLeg', 0, 0)], lambda p: HULLC(p[0:3], p[3:6]), [103, 445, 35, 90, 520, 22]),
        ('nearLegs', 'bone', [('haunch', 0, 0)],
         lambda p: I(R(p[0] - p[2], p[1] - p[2], p[3], p[4], 0), U(C(*p[0:3]), C(*p[5:8]), R(p[0], p[1] - p[2] - 10, BIG, p[6] - p[1] + p[2] + 10, 0))),
         [190, 295, 90, 128, 215, 145, 345, 85]),
        # 194：近端前腿 = 肩部大圆 ∩ 矩形（左边、上边是直的）∪ 中圆（贴着左边那条竖线）+ 蹄上小圆的外切包络
        ('nearLegs', 'bone', [('bone', 410, 360)], lambda p: U(I(C(*p[0:3]), R(p[3], p[4], BIG, p[5] - p[4], 0)), HULLC([p[3] + p[7], p[6], p[7]], p[8:11])),
         [380, 335, 90, 355, 245, 340, 320, 55, 448, 520, 19]),
        ('nearLegs', 'mid', [('mid', 98, 521)], hoof, [99, 540, 32]),
        ('nearLegs', 'mid', [('mid', 457, 518)], hoof, [457, 540, 31]),
        # 199：耳 = 两圆相交的叶形
        ('ears', 'far', [('far', 460, 206)], lambda p: LENS(*p), [470, 255, 60, 450, 165, 60]),
        ('ears', 'mid', [('mid', 671, 207)], lambda p: LENS(*p), [665, 250, 45, 680, 170, 45]),
        # 右角 = 外圆 − (内圆 ∪ 脸上沿以上、左边那一块)；角根压在脸的右上角底下，所以画在头之前
        ('horns', 'lime', [('lime', 690, 120)], lambda p: X(C(*p[0:3]), U(C(*p[3:6]), R(p[6] - BIG, -BIG, BIG, BIG + FACE_TOP, 0))),
         [656, 105, 73, 639, 87, 57, 640]),
        # 196：头 = 上面两个圆 + 下巴一个圆的外切包络；左边先直后斜（耳朵下面拐一下），左侧中段补一个圆
        ('head', 'bone', [('bone', 566, 200)], lambda p: HULLC(p[0:3], p[3:6], p[6:9], p[9:12]),
         [515, 165, 32, 613, 165, 32, 565, 292, 42, 510, 235, 25]),
        ('eyes', 'dark', [('eyeL', 0, 0)], lambda p: I(C(*p[0:3]), HP(*p[3:7])), [527, 220, 24, 505, 196, 550, 234]),
        ('eyes', 'dark', [('eyeR', 0, 0)], lambda p: I(C(*p[0:3]), HP(*p[3:7])), [620, 220, 22, 600, 232, 640, 200]),
        # 195：左角 = ((外圆 − 圆头中线以右) ∪ 圆头) − (内圆 ∪ 脸上沿以上的右边)——新月的粗端收进圆头，内缘到脸上沿变成一条平线，圆头压在脸的左上角上
        ('horns', 'lime', [('lime', 440, 130)], lambda p: X(U(X(C(*p[0:3]), R(p[6], -BIG, BIG, 2 * BIG, 0)), C(*p[6:9])), U(C(*p[3:6]), R(p[9], -BIG, BIG, BIG + FACE_TOP, 0))),
         [460, 106, 74, 476, 78, 56, 482, 158, 24, 470]),
        # 197：鼻 = 两圆外切包络
        ('nose', 'far', [('snout', 0, 0)], lambda p: HULLC(p[0:3], p[3:6]), [558, 314, 33, 598, 314, 33]),
        ('nose', 'dark', [('dark', 557, 316)], lambda p: E(*p), [557, 316, 10, 7, 40]),
        ('nose', 'dark', [('dark', 608, 316)], lambda p: E(*p), [608, 316, 10, 7, -40]),
    ]


def newborn_parts(ground):
    leg = lambda p: HULLC([p[0], p[1], p[3]], [p[0], p[2], p[3]])  # 胶囊腿：x, 上圆心 y, 下圆心 y, 半径
    return [
        ('farLegs', 'far', [('far', 125, 226)], leg, [125.5, 200, 223, 24.5]),
        ('farLegs', 'far', [('far', 275, 210)], leg, [275, 190, 223, 24]),
        # 203：躯干 = 臀圆 + 肚圆外切包络
        ('torso', 'grey', [('grey', 200, 150)], lambda p: HULLC(p[0:3], p[3:6]), [100, 145, 52, 220, 140, 75]),
        # 207：臀 = 圆 ∪ 胶囊腿（腿的左边与圆的最左点相切，所以左边是一条直线）
        ('nearLegs', 'bone', [('bone', 96, 170)], lambda p: U(C(*p[0:3]), HULLC([p[0] - p[2] + p[3], p[1], p[3]], [p[0] - p[2] + p[3], p[4], p[3]])),
         [97, 150, 55, 23, 224]),
        ('nearLegs', 'bone', [('bone', 214, 200)], leg, [214, 180, 223, 24]),
        ('ears', 'far', [('far', 200, 92)], lambda p: LENS(*p), [205, 125, 45, 200, 65, 45]),
        ('ears', 'mid', [('mid', 360, 88)], lambda p: LENS(*p), [350, 100, 32, 372, 72, 32]),
        # 204：头 = 头圆 + 鼻侧小圆的外切包络（下巴那条公切线）
        ('head', 'bone', [('bone', 300, 110)], lambda p: HULLC(p[0:3], p[3:6]), [283, 108, 70, 322, 148, 26]),
        ('eyes', 'dark', [('eyeN', 0, 0)], lambda p: C(*p), [274, 109, 11]),
        # 208：角 = 角根圆 + 角尖小圆的外切包络（圆头的水滴）
        ('horns', 'lime', [('lime', 235, 58)], lambda p: HULLC(p[0:3], p[3:6]), [240, 64, 11, 225, 45, 5]),
        ('horns', 'lime', [('lime', 331, 50)], lambda p: HULLC(p[0:3], p[3:6]), [333, 56, 8, 333, 42, 4]),
        # 205：鼻 = 两圆外切包络
        ('nose', 'far', [('far', 332, 147)], lambda p: HULLC(p[0:3], p[3:6]), [322, 147, 26, 342, 147, 26]),
    ]


FIG = {
    'newborn': {'crop': (100, 350, 400, 545), 'parts': newborn_parts, 'eyes': [(255, 92, 298, 124)], 'tail': None},
    'bull': {'crop': (1380, 140, 1930, 545), 'parts': bull_parts, 'eyes': [(500, 190, 566, 245), (590, 192, 646, 240)],
             'tail': [(10, 212), (120, 212), (114, 230), (92, 243), (70, 290), (62, 405), (10, 405)]},
}


def targets(name, f, lab, H, W, ground):
    """每个部件要盖住的原图色块（目标）"""
    idx = {c: i for i, c in enumerate(PAL)}
    bgc = (lab == idx['bg']).astype(np.uint8); cv2.floodFill(bgc, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 2)
    sil = bgc != 2
    tail = np.zeros((H, W), bool)
    if f['tail']: cv2.fillPoly(tail.view(np.uint8), [np.array(f['tail'], np.int32)], 1); tail &= sil
    eyes = [np.zeros((H, W), bool) for _ in f['eyes']]
    for e, (a, b, c, d) in zip(eyes, f['eyes']): e[b:d, a:c] = ((lab == idx['dark']) | (lab == idx['bg']))[b:d, a:c] & sil[b:d, a:c]
    special = {}
    if name == 'bull':
        blob = comp_at(lab, idx['far'], 580, 300); top = blob.copy(); top[350:] = False
        hole = (~top).astype(np.uint8); cv2.floodFill(hole, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 0); top |= hole.astype(bool)
        snout = cv2.morphologyEx(top.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (33, 33))).astype(bool)
        # 尾巴杆 = 尾框里的骨白 + 尾环那一圈带子（杆一直伸到臀上沿，不算臀的）
        yy, xx = np.mgrid[0:H, 0:W]; rr = np.hypot(xx - 145, yy - 335)
        stem = (lab == idx['bone']) & (tail | ((rr > 84) & (rr < 110) & (yy < 240) & (xx < 138)))
        special = {'snout': snout | (hole.astype(bool) & top), 'farLeg': blob & ~snout,
                   'tailStem': stem,
                   # 臀与近端后腿在原图里是同一块骨白：按膝盖高度分开（同色同部件，拟合时互相允许重叠）
                   'haunch': comp_at(lab, idx['bone'], 150, 340) & ~stem & ~((yy >= 400) & (xx < 145)),
                   'nearLeg': comp_at(lab, idx['bone'], 150, 340) & ~stem & (yy >= 400) & (xx < 145),
                   'eyeL': eyes[0], 'eyeR': eyes[1]}
    else:
        special = {'eyeN': eyes[0]}
    out = []
    for part, color, seeds, fn, init in f['parts'](ground):
        t = np.zeros((H, W), bool)
        for c, x, y in seeds: t |= special[c] if c in special else comp_at(lab, idx[c], x, y)
        out.append(t)
    return out, sil


def fit(name, f):
    img = cv2.imread(SRC)[:, :, ::-1]
    x0, y0, x1, y1 = [int(v * K) for v in f['crop']]
    crop = img[y0:y1, x0:x1]; H, W = crop.shape[:2]; G.shape = (H, W)
    lab = quantize(crop, max(40, int(W * H * 0.0004)))
    idx = {c: i for i, c in enumerate(PAL)}
    ground = int(np.nonzero(lab != idx['bg'])[0].max()) + 1
    hoofZone = np.zeros((H, W), bool); hoofZone[int(ground - H * 0.085):] = True
    lab[hoofZone & (lab == idx['grey'])] = idx['mid']  # 蹄缘抗锯齿常被量化成灰
    parts = f['parts'](ground)
    T, sil = targets(name, f, lab, H, W, ground)
    band = lambda t: cv2.dilate(t.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
    res = []
    for i, (part, color, seeds, fn, init) in enumerate(parts):
        upper = np.logical_or.reduce(T[i + 1:]) if i + 1 < len(T) else np.zeros((H, W), bool)
        same = [T[j] for j, q in enumerate(parts) if j != i and q[0] == part and q[1] == color]
        allowed = T[i] | upper | (np.logical_or.reduce(same) if same else False)
        under = band(T[i]) & upper & ~T[i]  # 伸进上层底下一点点（防缝），给一点奖励
        t = T[i]
        overW = 3.0 if part == 'horns' else 1.5  # 角越界就是盖到脸上的荧光，罚重一点

        def loss(p):
            m = fn(p).m
            return (t & ~m).sum() + overW * (m & ~allowed).sum() - 0.3 * (m & under).sum()
        p0 = np.array(init, float)
        l0 = loss(p0)
        best = minimize(loss, p0, method='Powell', options={'xtol': 0.2, 'ftol': 0.5, 'maxfev': 4000})
        rng = np.random.default_rng(i)
        for k in range(10):  # 卡在局部最优时：在当前最好的解附近抖一抖再拟合（抖动从大到小）
            if best.fun < 0.01 * t.sum(): break
            r = minimize(loss, best.x + rng.normal(0, 8 if k < 5 else 3, len(p0)), method='Powell', options={'xtol': 0.2, 'ftol': 0.5, 'maxfev': 4000})
            if r.fun < best.fun: best = r
        r = best
        G.exact = True; g = fn(r.x); G.exact = False
        miss, over = int((t & ~g.m).sum()), int((g.m & ~allowed).sum())
        print(f'  {name} {i:2d} {part:8s} {color:5s} loss {l0:8.0f} → {r.fun:8.0f}   漏 {miss:5d}  越界 {over:5d}  目标 {int(t.sum())}')
        if os.environ.get('GEO_DEBUG'):  # 调构造用：绿 = 漏掉的目标，红 = 越界，黄 = 盖对了
            vis = np.zeros((H, W, 3), np.uint8); vis[t & g.m] = (0, 200, 200); vis[t & ~g.m] = (0, 255, 0); vis[g.m & ~allowed] = (0, 0, 255)
            vis[(g.m & allowed & ~t)] = (80, 80, 80)
            cv2.imwrite(os.path.join(os.environ['GEO_DEBUG'], f'{name}-{i:02d}-{part}.png'), vis)
        res.append((part, color, g))
    return res, T, sil, ground, H, W, lab


def build():
    data = {}
    for name, f in FIG.items():
        res, T, sil, ground, H, W, lab = fit(name, f)
        geo = [[p, c, flat(g.s)] for p, c, g in res]
        src = [[p, c, g.g] for p, c, g in res]
        mask = lambda parts: np.logical_or.reduce([g.m for p, c, g in res if p in parts])
        headAll = mask({'ears', 'head', 'horns', 'nose'})
        torso = mask({'torso'})
        eyesC = []
        for p, c, g in res:
            if p != 'eyes': continue
            ys, xs = np.nonzero(g.m)
            eyesC.append([r1(xs.mean()), r1(ys.mean()), r1(max(np.ptp(xs), np.ptp(ys)) / 2 + 1)])
        hy, hx = np.nonzero(headAll)
        greyRows = np.nonzero((torso & sil).sum(1) > 0.12 * W)[0]
        tailRoot = None
        if f['tail']:
            ty, tx = np.nonzero(mask({'tail'}) & mask({'nearLegs'}))
            tailRoot = [r1(tx.mean()), r1(ty.mean())] if len(tx) else [f['tail'][1][0], f['tail'][1][1]]
        data[name] = {
            'w': W, 'h': H, 'geo': geo, 'src': src, 'eyes': eyesC, 'ground': ground, 'belly': int(greyRows.max()),
            'head': [r1(hx.mean()), r1(hy.mean()), r1((np.ptp(hx) + np.ptp(hy)) / 4)],
            'neck': [r1(hx.min() + np.ptp(hx) * 0.25), r1(hy.max())],
            'headBox': [int(hx.min()), int(hy.min()), int(hx.max()), int(hy.max())],
            'tailRoot': tailRoot,
        }
    ts = ['/** 由 scripts/mascot_geo.py 生成，勿手改：牛犊与公牛的几何构造（基本形 + 布尔），参数对意向图 docs/brand-refs/ip2-geo-b-selected.jpg 拟合。',
          ' *  src = 构造树（源，可读可改）：c 圆 [cx, cy, r] · h 若干圆的外切包络 [[cx, cy, r], …] · a 圆弧带 [cx, cy, R, 宽, 起角, 止角]',
          ' *        · e 椭圆 [cx, cy, rx, ry, 旋转°] · p 多边形 [x, y, …] · r 矩形 [x, y, w, h, 圆角] · u 并 · i 交 · x 差（前减后）。',
          ' *  geo = 同一组构造做完布尔后拍平的 path（App 只画这个，不用 clipPath / mask，省性能）。两者都按远近排好：先画的在下面。 */',
          "export type GeoColor = 'grey' | 'mid' | 'far' | 'bone' | 'lime' | 'dark';",
          "export type GeoPart = 'farLegs' | 'torso' | 'tail' | 'nearLegs' | 'ears' | 'head' | 'eyes' | 'horns' | 'nose';",
          "export type Geo = ['c', number, number, number] | ['e', number, number, number, number, number] | ['p', number[]]",
          "  | ['r', number, number, number, number, number] | ['d', string] | ['h', number[][]] | ['a', number, number, number, number, number, number]",
          "  | ['u', ...Geo[]] | ['i', Geo, Geo] | ['x', Geo, Geo];",
          'export interface GeoFig { w: number; h: number; geo: Array<[GeoPart, GeoColor, string]>; src: Array<[GeoPart, GeoColor, Geo]>; eyes: Array<[number, number, number]>;',
          '  ground: number; belly: number; head: [number, number, number]; neck: [number, number]; headBox: [number, number, number, number]; tailRoot: [number, number] | null }',
          f"export const GEO: Record<'newborn' | 'bull', GeoFig> = {json.dumps(data, separators=(',', ':'), ensure_ascii=False)};", '']
    open(OUT_TS, 'w').write('\n'.join(ts))
    print('wrote', os.path.relpath(OUT_TS, ROOT), os.path.getsize(OUT_TS) // 1024, 'KB')


def check(base):
    """① 正负叠片：原图 + 反相渲染各取一半（重合处是均匀中灰）+ 差值热图；② 缺口：品红底 3 倍放大渲染每种状态，数被角色包住的品红"""
    from playwright.sync_api import sync_playwright
    img = cv2.imread(SRC)
    out = os.path.join(ROOT, 'screenshots', 'brand'); os.makedirs(out, exist_ok=True)
    exe = '/opt/pw-browsers/chromium'
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe if os.path.exists(exe) else None)
        pg = b.new_page(viewport={'width': 900, 'height': 700})
        for name, f in FIG.items():
            x0, y0, x1, y1 = [int(v * K) for v in f['crop']]
            ref = img[y0:y1, x0:x1]
            pg.goto(f'{base}/brand?trace={name}'); pg.wait_for_timeout(1200)
            png = pg.locator(f'[data-trace="{name}"] svg').screenshot()
            mine = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
            mine = cv2.resize(mine, (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_AREA)
            overlay = cv2.addWeighted(ref, 0.5, 255 - mine, 0.5, 0)
            diff = cv2.absdiff(ref, mine).max(-1)
            fg = (ref.max(-1) > 40) | (mine.max(-1) > 40)
            pct = (diff > 48)[fg].mean() * 100
            heat = cv2.applyColorMap(np.clip(diff * 2, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
            # 叠片图含意向图裁片（AI 参考图不是素材），只放 screenshots/，不进 design/（design/ 会被拷进网页包）
            cv2.imwrite(os.path.join(out, f'trace-check-{name}.png'), np.concatenate([ref, mine, overlay, heat], 1))
            print(f'{name}: 差异像素 {pct:.2f}%（阈值 48/255，角色区域内）')
        pg3 = b.new_page(viewport={'width': 900, 'height': 700}, device_scale_factor=3)
        for name in FIG:
            for mood in ['idle', 'focused', 'happy', 'sleep', 'pr', 'tired']:
                pg3.goto(f'{base}/brand?trace={name}&mood={mood}'); pg3.wait_for_timeout(500)
                pg3.evaluate("document.querySelector('[data-trace]').style.background = 'rgb(255,0,255)'")
                im = cv2.imdecode(np.frombuffer(pg3.locator(f'[data-trace="{name}"]').screenshot(), np.uint8), cv2.IMREAD_COLOR).astype(int)
                bb, gg, rr = im[:, :, 0], im[:, :, 1], im[:, :, 2]
                pink = ((rr - gg) > 40) & ((bb - gg) > 40) & (np.abs(rr - bb) < 60)
                ff = pink.astype(np.uint8).copy(); cv2.floodFill(ff, np.zeros((ff.shape[0] + 2, ff.shape[1] + 2), np.uint8), (0, 0), 2)
                gaps = (ff == 1) & ~cv2.dilate((ff == 2).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
                print(f'  缺口 {name}/{mood}: {int(gaps.sum())} px')
                if gaps.sum():
                    vis = im.astype(np.uint8).copy(); ys, xs = np.nonzero(gaps)
                    for y, x in zip(ys[::7], xs[::7]): cv2.circle(vis, (int(x), int(y)), 12, (0, 255, 0), 2)
                    cv2.imwrite(os.path.join(out, f'trace-gaps-{name}-{mood}.png'), vis)
        b.close()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--base', default='http://127.0.0.1:5199')
    a = ap.parse_args()
    check(a.base) if a.check else build()
