#!/usr/bin/env python3
"""线框用的人体图：MuscleWiki 真实路径（scripts/bodymap.py），灰阶。
半身裁切在 wf.js 里按包围盒中线做（不同性别 / 正背的中线不完全一样）。
用法：python3 design/wireframes/build_assets.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'scripts'))
import bodymap

for g in ('male', 'female'):
    d = bodymap.load(g)
    for v in ('front', 'back'):
        s = bodymap.svg(d, v, neutral='#E4E4E1', edge='#B9B9B5', contour='#8E8E8A', default_fill='#D3D3CF')
        p = os.path.join(HERE, f'body-{g}-{v}.svg')
        open(p, 'w', encoding='utf-8').write(s)
        print('wrote', os.path.relpath(p), len(s) // 1024, 'KB')
