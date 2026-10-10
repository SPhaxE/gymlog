"""P09 容量页（标志性页面）：
主角 = 出血的半身热成像人体（同一页面 6 倍像素密度渲染的局部），三层视效直接在人体上标注；
右侧两台：A 按住 = 放大镜 + 折线引线；B 轻点 = M02 胶囊长成浮层（浮层框每一刻的真实位置画成矢量叠影，过冲那一帧用荧光）。
页头用压图变体（小号，叠在人体上方的暗部）。"""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from pf import *
from PIL import Image

DPR = 2.625


def figure_layer(pg):
    fig = Image.open(os.path.join(PF, 'assets', 'frames', 'figure.png')).convert('RGB')
    y0 = 560                                   # 从肩上开始
    sc = 0.6; fy = 290                         # 显示比例、人体顶在页面上的位置
    crop = fig.crop((0, y0, fig.width, min(fig.height, y0 + int((H - fy) / sc) + 2)))
    w, h = crop.width * sc, crop.height * sc
    pg.add(image(embed(crop, w, h, scale=crop.width / w), 0, fy, w, h, ' data-name="人体（App 真渲染 · 6 倍）"'))
    # 右缘、上缘融进页面底
    pg.defs.append(f'<linearGradient id="figR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{BG}" stop-opacity="0"/><stop offset="1" stop-color="{BG}" stop-opacity="1"/></linearGradient>'
                   f'<linearGradient id="figT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{BG}" stop-opacity="1"/><stop offset="1" stop-color="{BG}" stop-opacity="0"/></linearGradient>')
    pg.add(f'<rect x="{w - 160:.0f}" y="{fy}" width="160" height="{H - fy}" fill="url(#figR)"/>',
           f'<rect x="0" y="{fy - 2}" width="{w:.0f}" height="90" fill="url(#figT)"/>')
    return lambda px, py: (px * sc, fy + (py - y0) * sc)


def main():
    pg = Page(9, '容量页')
    at = figure_layer(pg)
    header(pg, '容量页', '人体是读图的底，胶囊是读数的尺。', ['近 7 天每块肌肉练了多少、哪块还在恢复，一眼看完。'], y=110, small=True)

    # 人体上的三层视效（坐标是 figure.png 的像素）
    callout(pg, at(770, 800), (650, 430), '01', 'O2 柔光描边', sub='轮廓一圈淡光，不画硬线')
    callout(pg, at(860, 1180), (650, 560), '02', 'F1 金属渐变', sub='自下而上，越热越亮')
    callout(pg, at(1130, 1560), (650, 690), '03', 'S9 熔流', sub='亮带往上流，越热越快')
    pg.add(text(L, 980, '三层在方案台自由组合里选定 · 照 AE 熔流参考写成代码 · 人体素材 MuscleWiki', 14, 500, 'mono', BONE2))

    # A：按住 = 放大镜 + 折线引线
    pw = 352; ph = FH * pw / FW; py = 222
    ax, bx = 920, 1390
    pg.add(text(ax, 150, 'A — 按住', 14, 600, 'mono', LIME, ls=1),
           text(ax, 182, '放大镜：焦点胶囊放大，确认后折一条线到肌头', 18, 500, fill=BONE))
    phone(pg, screen('body-mag'), ax, py, pw, label='body · 放大镜')

    # B：轻点 = M02，浮层框每一刻的位置叠成轨迹
    d = json.load(open(os.path.join(PF, 'assets', 'frames', 'm02', 'times.json')))
    box = (bx, py, pw, ph); s = pw / FW
    over = []; peak = max(range(len(d['rects'])), key=lambda i: d['rects'][i]['w'])
    mid = d['times'].index(90)
    for i, (t, r) in enumerate(zip(d['times'], d['rects'])):
        tx, ty = map(float, re.findall(r'[-\d.]+', r['transform'])[4:6])
        x0, y0 = screen_xy(box, tx * DPR - 1, ty * DPR - 1)
        w, h = r['w'] * DPR * s, r['h'] * DPR * s
        rx = min(26 * DPR * s, h / 2)
        last = i == len(d['times']) - 1
        if i < mid:     # 已经走过的：实线，越早越淡；起点那颗胶囊用荧光
            k = 0.2 + 0.5 * i / mid
            col = LIME if i == 0 else BONE
            over.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="{col}" fill-opacity="{0.18 if i == 0 else 0.03}" stroke="{col}" stroke-opacity="{1 if i == 0 else k:.2f}" stroke-width="{1.5 if i == 0 else 1}"/>')
        elif i > mid and (i == peak or last):   # 还没到的：虚线；过冲那一圈荧光
            col = LIME if i == peak else BONE
            over.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx:.1f}" fill="none" stroke="{col}" stroke-opacity="{1 if i == peak else 0.5}" stroke-width="{1.5 if i == peak else 1}" stroke-dasharray="5 5"/>')
    base = Image.open(os.path.join(PF, 'assets', 'frames', 'm02', f'{mid:02d}_90.png'))
    pg.add(text(bx, 150, 'B — 轻点', 14, 600, 'mono', LIME, ls=1),
           text(bx, 182, '胶囊原地长成浮层（M02）：实线走过、虚线将到', 18, 500, fill=BONE))
    phone(pg, base, bx, py, pw, label='body-detail · M02 叠影', over='\n'.join(over))

    # B 下面的时间刻度：叠影里每一圈的时刻
    ty_ = py + ph + 20
    t_end = d['times'][-1]; x_ = lambda t: bx + 10 + (pw - 20) * t / t_end
    pg.add(f'<line x1="{bx + 10}" y1="{ty_}" x2="{bx + pw - 10}" y2="{ty_}" stroke="{BONE2}" stroke-opacity="0.5"/>')
    for i, t in enumerate(d['times']):
        hi = i == peak or t == 90
        pg.add(f'<line x1="{x_(t):.1f}" y1="{ty_ - (10 if hi else 6)}" x2="{x_(t):.1f}" y2="{ty_}" stroke="{LIME if hi else BONE}" stroke-opacity="{1 if hi else 0.6}"/>')
    pg.add(text(x_(90) - 4, ty_ + 20, '90 这一帧', 12, 500, 'mono', BONE, extra=' data-num-ok="1"'),
           text(x_(d['times'][peak]) + 18, ty_ + 20, f'{d["times"][peak]} 过冲', 12, 600, 'mono', LIME, extra=' data-num-ok="1"'),
           text(bx + pw - 10, ty_ + 20, f'{t_end} ms', 12, 500, 'mono', BONE2, anchor='end', extra=' data-num-ok="1"'))
    footer(pg)
    return pg.save()


if __name__ == '__main__':
    main()
