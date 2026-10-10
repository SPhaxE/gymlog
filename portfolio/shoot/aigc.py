"""AIGC 封面贴真屏：找绿幕 → 拟合屏幕四边（含被拇指挡住的边，用凸包）→ 透视变换贴 App 屏 → 只替换绿色像素（拇指留在屏前）→ 去绿溢色。
python3 portfolio/shoot/aigc.py [屏名，默认 today] → portfolio/assets/aigc/cover-<屏>.jpg"""
import os, sys
import cv2, numpy as np
from PIL import Image

PF = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(PF, 'assets', 'aigc', 'cover.jpg')


def greenness(a):
    a = a.astype(np.float32); return a[..., 1] - np.maximum(a[..., 0], a[..., 2])


def corners(mask):
    """绿幕最大连通块 → 凸包 → 四边各自拟合直线 → 相邻两边求交 = 屏幕四角（圆角之外的虚角）"""
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8))
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); m = (lab == k).astype(np.uint8)
    cnt = max(cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)
    hull = cv2.convexHull(cnt)
    eps = 0.01 * cv2.arcLength(hull, True)
    while True:
        q = cv2.approxPolyDP(hull, eps, True)
        if len(q) <= 4: break
        eps *= 1.15
    q = q.reshape(-1, 2).astype(np.float32)
    pts = cnt.reshape(-1, 2).astype(np.float32)   # 轮廓上的稠密点；被拇指挡住的凹处离直线远，自动排除
    lines = []
    for i in range(4):
        a, b = q[i], q[(i + 1) % 4]; d = b - a; L = np.linalg.norm(d); u = d / L; nrm = np.array([-u[1], u[0]])
        t = (pts - a) @ u; dist = np.abs((pts - a) @ nrm)
        sel = pts[(dist < 6) & (t > 0.15 * L) & (t < 0.85 * L)]   # 避开圆角
        vx, vy, x0, y0 = cv2.fitLine(sel, cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        lines.append((np.array([x0, y0]), np.array([vx, vy])))
    out = []
    for i in range(4):
        (p1, d1), (p2, d2) = lines[i - 1], lines[i]
        t = np.linalg.solve(np.array([d1, -d2]).T, p2 - p1); out.append(p1 + t[0] * d1)
    out = np.array(out, np.float32)
    # 排序：长边是竖边；挖孔一侧（上边）由图里黑点位置决定——这里按 y 最小的短边为上
    c = out.mean(0); ang = np.arctan2(out[:, 1] - c[1], out[:, 0] - c[0]); out = out[np.argsort(ang)]   # 顺时针：从左上方向开始
    i0 = np.argmin(out[:, 0] + out[:, 1]); out = np.roll(out, -i0, axis=0)   # tl, tr, br, bl
    return out


def main(name='today'):
    im = np.array(Image.open(SRC).convert('RGB'))
    g = greenness(im)
    hard = g > 60
    tl, tr, br, bl = corners(hard)
    scr = np.array(Image.open(os.path.join(PF, 'assets', 'screens', f'{name}.png')).convert('RGB'))
    h, w = scr.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32([tl, tr, br, bl]))
    warped = cv2.warpPerspective(scr, M, (im.shape[1], im.shape[0]), flags=cv2.INTER_AREA)
    # 屏幕自己的圆角：同一变换下的屏幕范围
    sm = cv2.warpPerspective(np.full((h, w), 255, np.uint8), M, (im.shape[1], im.shape[0]))
    # 软抠：绿度 20 → 90 线性过渡
    alpha = np.clip((g - 20) / 70, 0, 1)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8) * (sm / 255)
    # 屏幕略暗于纯白发光、带一点环境色，免得像贴纸
    warped = cv2.GaussianBlur(warped, (0, 0), 0.7).astype(np.float32) * 0.94
    warped += np.random.default_rng(3).normal(0, 5, warped.shape[:2])[..., None]   # 跟照片的胶片颗粒对齐
    out = im.astype(np.float32) * (1 - alpha[..., None]) + warped * alpha[..., None]
    # 去绿溢色：残留偏绿的像素把 G 压到 max(R, B)
    spill = (g > 8) & (alpha < 0.98)
    o = out[spill]; o[:, 1] = np.minimum(o[:, 1], np.maximum(o[:, 0], o[:, 2]) + 6); out[spill] = o
    dst = os.path.join(PF, 'assets', 'aigc', f'cover-{name}.jpg')
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(dst, quality=93)
    print('ok', dst, 'corners', [tuple(map(int, p)) for p in (tl, tr, br, bl)])


if __name__ == '__main__':
    main(*(sys.argv[1:2] or []))
