#!/usr/bin/env python3
"""IP 小牛的矢量化（阶段 5.5b 第四轮，2026-10-05）：把用户选定的意向图 docs/brand-refs/ip2-geo-b-selected.jpg 里的
牛犊与公牛一比一描成矢量，生成 src/components/mascotTrace.ts。

做法：裁出角色 → 按原图的平涂色量化（骨白 / 暗米 / 灰米 / 灰 / 荧光 / 深色）→ 众数滤波去掉抗锯齿杂点 →
每个色块交给 potrace 描成平滑曲线 → 按分区多边形切成可动的层（头、眼、尾、身体）。
眼睛单独一层（状态要换眼），头层里把眼睛的位置补成骨白。
检查：python3 scripts/trace_mascot.py --check 会用 Playwright 渲染生成的矢量，与原图做「正负叠片」（原图 + 反相渲染各半）
和差值图，输出到 screenshots/brand/trace-check-*.png，并打印差异像素比例。
依赖：numpy、opencv-python-headless、potrace（命令行）。"""
import argparse, json, os, re, subprocess, sys, tempfile
import numpy as np, cv2

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'docs', 'brand-refs', 'ip2-geo-b-selected.jpg')
OUT_TS = os.path.join(ROOT, 'src', 'components', 'mascotTrace.ts')
K = 2752 / 2000  # 原图像素 / 缩略坐标

# 平涂色（从原图 k-means 取得），顺序 = 叠放顺序（后 → 前）
PAL = {'bg': (14, 14, 15), 'grey': (146, 141, 135), 'mid': (170, 165, 155), 'far': (201, 194, 178),
       'bone': (233, 226, 208), 'lime': (212, 254, 60), 'dark': (60, 58, 48)}
DRAW = ['grey', 'mid', 'far', 'bone', 'lime', 'dark']

# 角色：裁切框（缩略坐标）与分区多边形（裁切后的像素坐标）
FIG = {
    'newborn': {
        'crop': (100, 350, 400, 545),
        'head': [(160, 20), (413, 20), (413, 182), (300, 182), (252, 162), (224, 122), (160, 112)],
        'eyes': [(255, 92, 298, 124)],
        'tail': None,
    },
    'bull': {
        'crop': (1380, 140, 1930, 545),
        'head': [(388, 0), (757, 0), (757, 235), (652, 300), (642, 360), (518, 360), (498, 300), (468, 252), (408, 232), (388, 120)],
        'eyes': [(500, 190, 566, 245), (590, 192, 646, 240)],
        'tail': [(10, 212), (120, 212), (114, 230), (92, 243), (70, 290), (62, 405), (10, 405)],
    },
}


def quantize(img):
    names = list(PAL); P = np.array([PAL[n] for n in names], np.float32)
    f = cv2.bilateralFilter(img.astype(np.float32), 7, 30, 5)
    lab = ((f[:, :, None, :] - P[None, None]) ** 2).sum(-1).argmin(-1).astype(np.uint8)
    # 众数滤波：每个像素取 5×5 邻域里最多的类，去掉抗锯齿形成的杂色细边
    votes = np.stack([cv2.boxFilter((lab == i).astype(np.float32), -1, (5, 5)) for i in range(len(names))], -1)
    lab = votes.argmax(-1).astype(np.uint8)
    return {n: (lab == i) for i, n in enumerate(names)}


def poly_mask(shape, pts):
    m = np.zeros(shape, np.uint8)
    if pts: cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    return m.astype(bool)


def potrace_paths(mask):
    """mask（True = 形状）→ potrace 的 SVG path（坐标已换回像素，y 向下）"""
    if mask.sum() < 30: return ''
    with tempfile.TemporaryDirectory() as d:
        bmp, svg = os.path.join(d, 'm.bmp'), os.path.join(d, 'm.svg')
        cv2.imwrite(bmp, np.where(mask, 0, 255).astype(np.uint8))
        subprocess.run(['potrace', bmp, '-b', 'svg', '-o', svg, '-t', '12', '-a', '1.0', '-O', '0.4', '-u', '10', '--flat'], check=True)
        txt = open(svg).read()
    h = mask.shape[0]
    ds = re.findall(r'<path d="([^"]+)"', txt)
    # potrace 的坐标系：translate(0,H) scale(0.1,-0.1)，单位 0.1 px、y 向上。这里把数字换回像素、y 翻转
    out = []
    for d in ds:
        toks = re.findall(r'[MmLlCcZz]|-?\d+(?:\.\d+)?', d)
        res, cmd, nums, absx, absy = [], None, [], 0.0, 0.0
        i = 0
        while i < len(toks):
            t = toks[i]
            if t.isalpha():
                cmd = t; i += 1
                if cmd in 'Zz': res.append('Z')
                continue
            n = {'M': 2, 'm': 2, 'L': 2, 'l': 2, 'C': 6, 'c': 6}[cmd]
            vals = [float(v) for v in toks[i:i + n]]; i += n
            pts = [(vals[j] / 10, vals[j + 1] / 10) for j in range(0, n, 2)]
            if cmd.islower():
                pts = [(absx + x, absy + y) for x, y in pts]
            absx, absy = pts[-1]
            up = cmd.upper()
            res.append(up + ' '.join(f'{x:.1f},{h - y:.1f}' for x, y in pts))
            if cmd in 'Mm': cmd = 'l' if cmd == 'm' else 'L'
        out.append(''.join(res))
    return ''.join(out)


def build():
    img = cv2.imread(SRC)[:, :, ::-1]
    data = {}
    for name, f in FIG.items():
        x0, y0, x1, y1 = [int(v * K) for v in f['crop']]
        crop = img[y0:y1, x0:x1]
        H, W = crop.shape[:2]
        m = quantize(crop)
        # 剪影 = 去掉与画面外缘连通的背景（眼睛这种被包住的近黑色不算背景）
        bgc = m['bg'].astype(np.uint8)
        ff = np.zeros((H + 2, W + 2), np.uint8)
        cv2.floodFill(bgc, ff, (0, 0), 2)
        sil = bgc != 2
        head = poly_mask((H, W), f['head'])
        tail = poly_mask((H, W), f['tail']) if f['tail'] else np.zeros((H, W), bool)
        eyesBox = np.zeros((H, W), bool)
        for (ex0, ey0, ex1, ey1) in f['eyes']: eyesBox[ey0:ey1, ex0:ex1] = True
        eye = (m['dark'] | m['bg']) & eyesBox & sil
        eyeFill = cv2.dilate(eye.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & sil
        k3 = np.ones((3, 3), np.uint8)
        # 内部色块外扩 1px 防止叠放时露缝，但限制在剪影以内——外轮廓不变大
        grow = lambda a: cv2.dilate(a.astype(np.uint8), k3).astype(bool) & sil
        layers = []
        # 身体：整个剪影先铺一层灰（头转动、腿收起时不露洞），再按色叠
        # 身体底层：剪影去掉头（头底下只留灰色的肩峰），头转动、低下时原位置不露「头影」
        # 肩峰被角挡住的那块原图里没有：对头范围内的灰做闭运算把它补完整（只用在底层，头动起来时不露缺口）
        ell = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(W * 0.09) | 1, int(W * 0.09) | 1))
        hump = cv2.morphologyEx((m['grey'] & head).astype(np.uint8), cv2.MORPH_CLOSE, ell).astype(bool) & head
        layers.append(('body', 'grey', potrace_paths((sil & ~tail & ~head) | hump)))
        for c in DRAW:
            body = m[c] & ~head & ~tail
            if c == 'grey': body = m[c] & ~tail  # 头底下的灰属于身体（肩峰）
            if c == 'dark': body = body & ~eyesBox
            layers.append(('body', c, potrace_paths(grow(body))))
        # 头底层：头范围内除灰以外的部分合成一块骨白，防止头内部色块之间露缝
        layers.append(('head', 'bone', potrace_paths(head & sil & ~m['grey'])))
        for c in DRAW:
            if c == 'grey': continue
            hm = m[c] & head
            if c == 'bone': hm = hm | (eyeFill & head)
            if c == 'dark': hm = hm & ~eyesBox
            layers.append(('head', c, potrace_paths(grow(hm))))
        if f['tail']:
            for c in DRAW:
                layers.append(('tail', c, potrace_paths(grow(m[c] & tail))))
        layers.append(('eyes', 'dark', potrace_paths(eye)))
        layers = [l for l in layers if l[2]]
        ys, xs = np.nonzero(sil)
        greyRows = np.nonzero(m['grey'].sum(1) > 0.12 * W)[0]  # 躯干的灰（蹄子窄，不算）
        eyesC = []
        for (ex0, ey0, ex1, ey1) in f['eyes']:
            yy, xx = np.nonzero(eye[ey0:ey1, ex0:ex1])
            eyesC.append([round(float(xx.mean() + ex0), 1), round(float(yy.mean() + ey0), 1), round(float(max(np.ptp(xx), np.ptp(yy)) / 2 + 1), 1)])
        hy, hx = np.nonzero(head & sil)
        data[name] = {
            'w': W, 'h': H, 'layers': layers, 'eyes': eyesC,
            'ground': int(ys.max()), 'belly': int(greyRows.max()),
            'head': [round(float(hx.mean()), 1), round(float(hy.mean()), 1), round(float((np.ptp(hx) + np.ptp(hy)) / 4), 1)],
            'neck': [round(float(hx.min() + np.ptp(hx) * 0.25), 1), round(float(hy.max()), 1)],
            'headBox': [int(hx.min()), int(hy.min()), int(hx.max()), int(hy.max())],
            'tailRoot': [f['tail'][1][0] - 10, f['tail'][1][1] + 20] if f['tail'] else None,
        }
        print(name, W, H, {c: sum(len(l[2]) for l in layers if l[1] == c) for c in DRAW})
    ts = ['/** 由 scripts/trace_mascot.py 从 docs/brand-refs/ip2-geo-b-selected.jpg 生成，勿手改。',
          ' *  每个角色：画布宽高（= 原图裁切像素）、按层（body / head / tail / eyes）与色（grey / mid / far / bone / lime / dark）分开的 path，',
          ' *  眼睛中心与半径、地面 y、肚皮最低点、头中心、颈部支点、尾根。 */',
          'export type TraceColor = \'grey\' | \'mid\' | \'far\' | \'bone\' | \'lime\' | \'dark\';',
          'export type TracePart = \'body\' | \'head\' | \'tail\' | \'eyes\';',
          'export interface TraceFig { w: number; h: number; layers: Array<[TracePart, TraceColor, string]>; eyes: Array<[number, number, number]>;',
          '  ground: number; belly: number; head: [number, number, number]; neck: [number, number]; headBox: [number, number, number, number]; tailRoot: [number, number] | null }',
          f'export const TRACE: Record<\'newborn\' | \'bull\', TraceFig> = {json.dumps(data, separators=(",", ":"))};', '']
    open(OUT_TS, 'w').write('\n'.join(ts))
    print('wrote', os.path.relpath(OUT_TS, ROOT), os.path.getsize(OUT_TS) // 1024, 'KB')


def regions():
    """调分区用：把头 / 尾 / 眼的多边形画在量化图上"""
    img = cv2.imread(SRC)[:, :, ::-1]
    out = os.path.join(ROOT, 'screenshots', 'brand'); os.makedirs(out, exist_ok=True)
    for name, f in FIG.items():
        x0, y0, x1, y1 = [int(v * K) for v in f['crop']]
        m = quantize(img[y0:y1, x0:x1])
        vis = np.zeros((*m['bg'].shape, 3), np.uint8)
        for c, v in PAL.items(): vis[m[c]] = v
        vis = vis[:, :, ::-1].copy()
        cv2.polylines(vis, [np.array(f['head'], np.int32)], True, (0, 0, 255), 2)
        if f['tail']: cv2.polylines(vis, [np.array(f['tail'], np.int32)], True, (255, 0, 0), 2)
        for (a, b, c, d) in f['eyes']: cv2.rectangle(vis, (a, b), (c, d), (0, 255, 255), 2)
        cv2.imwrite(os.path.join(out, f'trace-regions-{name}.png'), vis)


def check(base):
    """正负叠片：原图 + 反相渲染各取一半——两者完全重合处是均匀的中灰；差值图里越亮差异越大"""
    from playwright.sync_api import sync_playwright
    img = cv2.imread(SRC)
    out = os.path.join(ROOT, 'screenshots', 'brand'); os.makedirs(out, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        pg = b.new_page(viewport={'width': 900, 'height': 700})
        for name, f in FIG.items():
            x0, y0, x1, y1 = [int(v * K) for v in f['crop']]
            ref = img[y0:y1, x0:x1]
            pg.goto(f'{base}/brand?trace={name}'); pg.wait_for_timeout(1500)
            el = pg.locator(f'[data-trace="{name}"] svg')
            png = el.screenshot()
            mine = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR)
            mine = cv2.resize(mine, (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_AREA)
            overlay = cv2.addWeighted(ref, 0.5, 255 - mine, 0.5, 0)
            diff = cv2.absdiff(ref, mine).max(-1)
            bad = (diff > 48)
            # 只统计角色内部：原图或渲染里任一方不是背景
            fg = (ref.max(-1) > 40) | (mine.max(-1) > 40)
            pct = bad[fg].mean() * 100
            heat = cv2.applyColorMap(np.clip(diff * 2, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
            board = np.concatenate([ref, mine, overlay, heat], 1)
            cv2.imwrite(os.path.join(out, f'trace-check-{name}.png'), board)
            # 叠片图含意向图裁片（AI 参考图不是素材），只放 screenshots/，不进 design/（design/ 会被拷进网页包）
            print(f'{name}: 差异像素 {pct:.2f}%（阈值 48/255，角色区域内）')
        b.close()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--regions', action='store_true')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--base', default='http://127.0.0.1:5199')
    a = ap.parse_args()
    if a.regions: regions()
    elif a.check: check(a.base)
    else: build()
