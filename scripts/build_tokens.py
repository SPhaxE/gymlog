#!/usr/bin/env python3
"""慢牛 Milo · 由 design/tokens/tokens.json 生成 Figma 导入插件与 CSS 变量。

    python3 scripts/build_tokens.py           # 校验 + 生成
    python3 scripts/build_tokens.py --check   # 只校验（对比度、引用），不写文件

产物（都由本脚本生成，勿手改）：
    design/figma-plugin/code.js      插件主程序（src/plugin.js + 内嵌的 Token 与纹理）
    design/tokens/tokens.css         给阶段 5 的 CSS 变量
    src/styles/tokens.gen.ts         给 JS 的数值（几何计算用）
校验不过（对比度不达标、引用不存在）时返回 1，不写任何文件。只用标准库。"""
import base64, json, os, random, struct, subprocess, sys, zlib, datetime

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'design', 'tokens', 'tokens.json')
PLUGIN_SRCS = [os.path.join(ROOT, 'design', 'figma-plugin', 'src', f + '.js') for f in ('plugin', 'foundations', 'components', 'benchmark', 'main')]
P06_DATA = os.path.join(ROOT, 'design', 'benchmark', 'p06.json')
# 导航图标（方向 B：实心几何，24×24；挖空用 evenodd，插件里统一重新着色）
ICONS = {
    'today': 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 6.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z',
    'progress': 'M3 20l7-9 4 4 7-10v15z',
    'settings': 'M3 5h18v3H3z M3 10.5h12v3H3z M3 16h15v3H3z',
}
PLUGIN_OUT = os.path.join(ROOT, 'design', 'figma-plugin', 'code.js')
CSS_OUT = os.path.join(ROOT, 'design', 'tokens', 'tokens.css')
TS_OUT = os.path.join(ROOT, 'src', 'styles', 'tokens.gen.ts')
BAD_NAME_CHARS = set('.{}$')


def spring_linear(spec, mass=1.0):
    """弹簧（stiffness k, damping c）→ CSS linear() 缓动与时长。欠阻尼解析解，取到误差 < 0.002 为止。"""
    import math, re
    k, c = (float(x) for x in re.findall(r'[\d.]+', spec)[:2])
    w = math.sqrt(k / mass); z = c / (2 * math.sqrt(k * mass)); wd = w * math.sqrt(max(1e-6, 1 - z * z))
    x = lambda t: 1 - math.exp(-z * w * t) * (math.cos(wd * t) + (z * w / wd) * math.sin(wd * t))
    T = 0.05
    while T < 2 and abs(1 - x(T)) + math.exp(-z * w * T) > 0.002:
        T += 0.01
    n = 32
    pts = ', '.join(f'{x(T * i / n):.4f}'.rstrip('0').rstrip('.') or '0' for i in range(n + 1))
    return f'linear({pts})', round(T * 1000)


def hex_rgba(h):
    h = h.lstrip('#')
    if len(h) not in (6, 8):
        raise ValueError('颜色必须是 #RRGGBB 或 #RRGGBBAA：' + h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return r, g, b, a


def lum(rgb):
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in rgb]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def over(fg, bg):
    """把带透明度的颜色合成到不透明底上。"""
    a = fg[3]
    return tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3)) + (1.0,)


def ratio(a, b):
    la, lb = lum(a[:3]), lum(b[:3])
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


# ---------- 纹理：纯标准库写 PNG ----------
def png(w, h, px):
    raw = b''.join(b'\x00' + bytes(sum((px[y * w + x] for x in range(w)), ())) for y in range(h))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


def to8(rgba):
    return tuple(max(0, min(255, round(v * 255))) for v in rgba)


def textures(col):
    rnd = random.Random(89)  # 与 mock 同一个固定种子，产物可复现
    out = {}
    # 噪点 128×128，灰度随机、全不透明（插件里用 OVERLAY + opacity/grain 叠加）
    px = []
    for _ in range(128 * 128):
        v = rnd.randint(0, 255)
        px.append((v, v, v, 255))
    out['grain'] = png(128, 128, px)
    # 不足：暗荧光底 + 荧光圆点（10×10，@2x）
    bg, dot = to8(col['data/tier-low']), to8(col['data/tier-low-dot'])
    px = []
    for y in range(10):
        for x in range(10):
            d = ((x - 4.5) ** 2 + (y - 4.5) ** 2) ** 0.5
            px.append(dot if d <= 2.0 else bg)
    out['tier-low'] = png(10, 10, px)
    # 超量：白底 + 黑 45° 斜纹（10×10）
    wh, bk = to8(col['data/tier-over']), to8(col['data/tier-over-stripe'])
    out['tier-over'] = png(10, 10, [bk if (x + y) % 10 < 3 else wh for y in range(10) for x in range(10)])
    # 未练胶囊：面色底 + 暗斜纹（12×12）
    a, b = to8(col['bg/raised']), to8(col['data/tier-none'])
    out['untrained'] = png(12, 12, [b if (x - y) % 12 < 4 else a for y in range(12) for x in range(12)])
    return {k: base64.b64encode(v).decode() for k, v in out.items()}


def main():
    check_only = '--check' in sys.argv
    T = json.load(open(SRC, encoding='utf-8'))
    errs, notes = [], []
    prim = {k: v['value'] for k, v in T['primitives']['color'].items()}
    for k, v in prim.items():
        hex_rgba(v)
    sem = T['semantic']['color']
    # 两套主题：ref = 深色，light = 浅色（2026-10-10）；每个语义色两边都要有
    MODES = {'dark': 'ref', 'light': 'light'}
    cols = {m: {} for m in MODES}
    for k, v in sem.items():
        for m, key in MODES.items():
            if key not in v:
                errs.append(f'语义色 {k} 缺少 {m} 主题的映射（{key}）')
            elif v[key] not in prim:
                errs.append(f'语义色 {k} 的 {m} 引用了不存在的原始色 {v[key]}')
            else:
                cols[m][k] = hex_rgba(prim[v[key]])
    col = cols['dark']
    names = list(prim) + list(sem) + list(T['number']) + list(T['string'])
    for n in names:
        if BAD_NAME_CHARS & set(n):
            errs.append(f'变量名 {n} 含 Figma 不接受的字符（. {{ }} $）')
    # 对比度：带透明度的颜色先合成到 bg/base 上再算；两套主题都查（第 5 项写了主题名的只查那一套）
    rows, rows_all = [], []
    for m in MODES:
        c, base = cols[m], cols[m].get('bg/base')
        for fg, bg, need, note, *only in T['contrast']:
            if only and only[0] != m:
                continue
            if fg not in c or bg not in c:
                errs.append(f'对比度检查引用了不存在的语义色：{fg} / {bg}')
                continue
            b = over(c[bg], base) if c[bg][3] < 1 else c[bg]
            f = over(c[fg], b) if c[fg][3] < 1 else c[fg]
            r = ratio(f, b)
            rows_all.append((m, fg, bg, r, need, note))
            if m == 'dark':
                rows.append((fg, bg, r, need, note))
            if r + 1e-9 < need:
                errs.append(f'对比度不达标（{m}）：{fg} on {bg} = {r:.2f}:1 < {need}:1（{note}）')
    nums = T['number']
    for s in T['textStyles']:
        for key in ('family', 'size'):
            ref = s[key]
            if ref not in (T['string'] if key == 'family' else nums):
                errs.append(f'文字样式 {s["name"]} 的 {key} 引用了不存在的变量 {ref}')
        if s['size'] in nums and nums[s['size']]['value'] < nums['font-size/min']['value']:
            errs.append(f'文字样式 {s["name"]} 小于字号下限 font-size/min')
    for s in T['effectStyles']:
        for e in s['effects']:
            if e['color'] not in col:
                errs.append(f'效果样式 {s["name"]} 引用了不存在的颜色 {e["color"]}')
    for s in T['paintStyles']:
        for ref, _ in s.get('stops', []):
            if ref not in prim:
                errs.append(f'填充样式 {s["name"]} 的渐变引用了不存在的原始色 {ref}')
    print('对比度：')
    for m, fg, bg, r, need, note in rows_all:
        print(f'  {"✓" if r + 1e-9 >= need else "✗"} [{m:5s}] {r:5.2f}:1 ≥ {need:<3}  {fg} on {bg}  · {note}')
    if errs:
        print('\n校验失败：', *errs, sep='\n  ✗ ')
        return 1
    if check_only:
        print('\n校验通过（--check，未写文件）')
        return 0

    try:
        commit = subprocess.run(['git', '-C', ROOT, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip() or '未提交'
    except OSError:
        commit = '未知'
    build = {'commit': commit, 'date': datetime.date.today().isoformat()}
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import bodymap
    bm, lists = {}, {}
    for g in ('male', 'female'):
        d = bodymap.load(g)
        bm[g] = {v: bodymap.svg(d, v) for v in ('front', 'back')}
        if g == 'male':
            lists = {v: bodymap.muscles(d, v) for v in ('front', 'back')}
    icons = {k: f'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="{d}" fill="#000" fill-rule="evenodd"/></svg>' for k, d in ICONS.items()}
    data = {'tokens': T, 'contrast': [[fg, bg, round(r, 2), need, note] for fg, bg, r, need, note in rows],
            'contrastLight': [[fg, bg, round(r, 2), need, note] for m, fg, bg, r, need, note in rows_all if m == 'light'], 'images': textures(col), 'build': build,
            'bodymap': bm, 'bodymapMuscles': lists, 'icons': icons, 'p06': json.load(open(P06_DATA, encoding='utf-8'))}
    src = '\n'.join(open(p, encoding='utf-8').read() for p in PLUGIN_SRCS)
    if '__MILO_DATA__' not in src:
        print('src/plugin.js 里找不到 __MILO_DATA__ 占位')
        return 1
    banner = '// 由 scripts/build_tokens.py 从 design/tokens/tokens.json 生成，勿手改。改值请改 tokens.json 再重新生成。\n'
    open(PLUGIN_OUT, 'w', encoding='utf-8').write(banner + src.replace('__MILO_DATA__', json.dumps(data, ensure_ascii=False)))

    css = ['/* 由 scripts/build_tokens.py 从 design/tokens/tokens.json 生成，勿手改。',
           '   两套主题：:root 默认深色；<html data-theme="light"> 切浅色。任意元素加 data-theme="dark|light" 就是一块局部主题（如容量页人体的深色观察窗）。 */', ':root {']
    for k, v in prim.items():
        css.append(f'  --milo-prim-{k}: {v};')
    def semantic(key):
        return [f'  --milo-color-{k.replace("/", "-")}: var(--milo-prim-{v[key]});' for k, v in sem.items()]
    css += semantic('ref')
    for k, v in nums.items():
        val = v['value']
        if k.startswith('opacity/') or k.startswith('ratio/'):
            out = f'{val / 100:g}'
        elif k.startswith('motion/'):
            unit = 'ms' if k in ('motion/press', 'motion/fast', 'motion/base', 'motion/slow', 'motion/stagger', 'motion/list-max', 'motion/long-press', 'motion/toast-hold') else ''
            out = f'{val / 100:g}' if k.startswith('motion/press-') else f'{val:g}{unit}'
        else:
            out = f'{val:g}px'
        css.append(f'  --milo-{k.replace("/", "-")}: {out};')
    fallbacks = {'font/number': ", 'Noto Sans SC', system-ui, sans-serif", 'font/ui': ', system-ui, sans-serif', 'font/mono': ', ui-monospace, monospace'}
    for k, v in T['string'].items():
        val = f"'{v['value']}'{fallbacks[k]}" if k in fallbacks else v['value']
        css.append(f'  --milo-{k.replace("/", "-")}: {val};')
        if k.startswith('motion/spring'):
            ease, ms = spring_linear(v['value'])
            name = k.replace('motion/', '')
            css.append(f'  --milo-motion-ease-{name}: {ease};')
            css.append(f'  --milo-motion-{name}-ms: {ms}ms;')
    css.append('}')
    css += [":root, [data-theme='dark'] { color-scheme: dark; }", "[data-theme='dark'] {", *semantic('ref'), '}']
    css += ["[data-theme='light'] {", '  color-scheme: light;', *semantic('light'), '}']
    # 文字样式 → 类名（与 Figma 的 Milo/ 文字样式一一对应）：.milo-text-number-hero 等
    weight = {'Regular': 400, 'Medium': 500, 'SemiBold': 600, 'Bold': 700, 'ExtraBold': 800, 'Black': 900}
    for d in T['textStyles']:
        cls = 'milo-text-' + d['name'].lower().replace('/', '-')
        css.append(f".{cls} {{ font-family: var(--milo-{d['family'].replace('/', '-')}); font-weight: {weight[d['style']]}; "
                   f"font-size: var(--milo-{d['size'].replace('/', '-')}); line-height: {d['lineHeight']}px; letter-spacing: {d['letterSpacing'] / 100:g}em; }}")
    open(CSS_OUT, 'w', encoding='utf-8').write('\n'.join(css) + '\n')
    # 给 JS 用的数值（放大镜、引线等几何计算）：只有 number 部分；opacity/ratio 已换算成 0–1
    ts = ['// 由 scripts/build_tokens.py 从 design/tokens/tokens.json 生成，勿手改。JS 里的尺寸、时长只从这里取。', 'export const T = {']
    for k, v in nums.items():
        val = v['value'] / 100 if k.startswith(('opacity/', 'ratio/')) else v['value']
        ts.append(f"  '{k}': {val:g},")
    for k, v in T['string'].items():
        if k.startswith('motion/spring'):
            ts.append(f"  '{k}-ms': {spring_linear(v['value'])[1]},")
    ts.append('} as const;')
    ts.append('export type TokenKey = keyof typeof T;')
    open(TS_OUT, 'w', encoding='utf-8').write('\n'.join(ts) + '\n')
    print(f'\n已生成 {os.path.relpath(PLUGIN_OUT, ROOT)}（{os.path.getsize(PLUGIN_OUT) // 1024} KB）与 {os.path.relpath(CSS_OUT, ROOT)}；build {build}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
