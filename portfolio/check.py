"""作品集 SVG 自检：XML 可解析、以 </svg> 结尾、没有 Figma 不认的东西（foreignObject / style / filter）、
字阶白名单、文字不越出画布、页上数字都在仓库文档里出现过（防止手写新数字）、单页 ≤ 15 MB。
python3 portfolio/check.py [portfolio/out/svg] [--only 01]"""
import glob, os, re, sys
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SIZES = {12, 14, 16, 18, 22, 28, 40, 54, 72, 160, 240, 300}
DOCS = ['docs/portfolio-handoff.md', 'docs/brief.md', 'docs/DESIGN.md', 'docs/walkthrough-1.md',
        'docs/superpowers/specs/2026-10-11-portfolio-design.md', 'docs/ia.md']
NS = '{http://www.w3.org/2000/svg}'


def allowed_numbers():
    s = set()
    for d in DOCS:
        p = os.path.join(ROOT, d)
        if os.path.exists(p): s |= set(re.findall(r'\d+(?:[.,]\d+)*', open(p, encoding='utf-8').read()))
    return s | {str(i) for i in range(0, 23)} | {f'{i:02d}' for i in range(0, 23)}


def check(path, nums):
    errs = []; raw = open(path, encoding='utf-8').read()
    if not raw.rstrip().endswith('</svg>'): errs.append('不是以 </svg> 结尾')
    if os.path.getsize(path) > 15e6: errs.append(f'超过 15 MB（{os.path.getsize(path) / 1e6:.1f}）')
    try: root = ET.fromstring(raw)
    except ET.ParseError as e: return [f'XML 解析失败：{e}']
    for el in root.iter():
        tag = el.tag.replace(NS, '')
        if tag in ('foreignObject', 'style', 'filter', 'script'): errs.append(f'不许用 <{tag}>')
        if 'style' in el.attrib or 'filter' in el.attrib: errs.append(f'<{tag}> 带 style / filter 属性')
        fs = el.get('font-size')
        if fs and int(float(fs)) not in SIZES: errs.append(f'字号 {fs} 不在字阶')
        if tag == 'text':
            x, y = float(el.get('x', 0)), float(el.get('y', 0))
            if not (0 <= x <= 1920 and 0 <= y <= 1080) and not el.get('data-bleed'): errs.append(f'文字越界 ({x:.0f}, {y:.0f})：{"".join(el.itertext())[:20]}')
            for n in re.findall(r'\d+(?:[.,]\d+)*', ''.join(el.itertext())):
                if n not in nums and not el.get('data-num-ok'): errs.append(f'数字「{n}」在仓库文档里找不到：{"".join(el.itertext())[:30]}')
    return errs


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    only = sys.argv[sys.argv.index('--only') + 1].split(',') if '--only' in sys.argv else []
    d = args[0] if args and os.path.isdir(args[0]) else os.path.join(ROOT, 'portfolio', 'out', 'svg')
    nums = allowed_numbers(); bad = 0
    for f in sorted(glob.glob(os.path.join(d, '*.svg'))):
        if only and os.path.basename(f)[:2] not in only: continue
        e = check(f, nums); bad += bool(e)
        print(('✗ ' if e else '✓ ') + os.path.basename(f) + ''.join(f'\n    {x}' for x in e))
    sys.exit(1 if bad else 0)
