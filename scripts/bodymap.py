"""人体图（MuscleWiki 解剖素材，来自 V1 的 advanced_bodymap*.json）→ SVG 字符串。

构建插件与生成预览共用。分层与 V1 BodyMap.jsx 一致：中性部位 → 肌肉组 → 轮廓层。
每个肌头是 <g id="muscle--<id>">（Figma 用 SVG 的 id 命名图层，插件导入后改名为 muscle/<id>）；腹股沟（groin）没有胶囊，按中性部位处理（asset-audit §4）。"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
NEUTRAL = ('neck', 'feet', 'hands', 'groin')


def load(gender):
    return json.load(open(os.path.join(ROOT, 'public', 'bodymap', f'bodymap-{gender}.json'), encoding='utf-8'))


def muscles(data, view):
    return [k for k in data[view] if k not in NEUTRAL and k != 'body']


def svg(data, view, fills=None, neutral='#1B1B1E', edge='#3A3A3F', contour='#3A3A3F', default_fill='#232326', extra=''):
    """fills: {肌头 id: (fill, stroke)}；不给就用 default_fill。返回完整 <svg>。"""
    v = data[view]
    vb = data.get('viewBox', '0 0 676.49 1203.49')
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">']
    out.append('<g id="neutral">')
    for k in NEUTRAL:
        for p in v.get(k, {}).get('paths', []):
            out.append(f'<path d="{p["d"]}" fill="{neutral}" stroke="{edge}" stroke-width="1"/>')
    out.append('</g>')
    for k in muscles(data, view):
        f, s = (fills or {}).get(k, (default_fill, edge))
        out.append(f'<g id="muscle--{k}">' + ''.join(f'<path d="{p["d"]}" fill="{f}" stroke="{s}" stroke-width="1"/>' for p in v[k]['paths']) + '</g>')
    b = v.get('body', {})
    out.append('<g id="contour" opacity="0.5">')
    for p in b.get('paths', []):
        out.append(f'<path d="{p["d"]}" fill="none" stroke="{contour}" stroke-width="{p.get("strokeWidth") or 3.49}" stroke-linecap="round" stroke-linejoin="round"/>')
    for l in b.get('lines', []):
        out.append(f'<line x1="{l["x1"]}" y1="{l["y1"]}" x2="{l["x2"]}" y2="{l["y2"]}" stroke="{contour}" stroke-width="{l.get("strokeWidth") or 3.49}" stroke-linecap="round"/>')
    out.append('</g>' + extra + '</svg>')
    return ''.join(out)
