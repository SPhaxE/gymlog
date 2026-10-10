"""SVG → PNG 预览 / 合并 PDF。三套字体取 node_modules/@fontsource*，族名改成 Figma 的 Google Fonts 名；字体没加载上就报错退出。
python3 portfolio/render.py [--png] [--pdf] [--only 01,09] [--overview]
→ portfolio/out/png/NN_*.png、portfolio/out/Milo-作品集.pdf、portfolio/out/png/00-overview.png"""
import argparse, glob, os, re, sys, tempfile
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PF = os.path.join(ROOT, 'portfolio')
NM = os.path.join(ROOT, 'node_modules')
FACES = [('@fontsource-variable/noto-sans-sc/wght.css', 'Noto Sans SC Variable', 'Noto Sans SC'),
         ('@fontsource-variable/jetbrains-mono/wght.css', 'JetBrains Mono Variable', 'JetBrains Mono')] + \
        [(f'@fontsource/barlow-condensed/{w}.css', 'Barlow Condensed', 'Barlow Condensed') for w in (400, 500, 600, 700, 800, 900)]


def font_css():
    css = []
    for rel, old, new in FACES:
        path = os.path.join(NM, rel); d = os.path.dirname(path)
        s = open(path, encoding='utf-8').read().replace(f"'{old}'", f"'{new}'")
        css.append(re.sub(r'url\(\./', f'url(file://{d}/', s))
    return '\n'.join(css)


CHECK = """async () => {
  const want = [['900 160px "Noto Sans SC"', '慢'], ['800 160px "Barlow Condensed"', '85'], ['500 14px "JetBrains Mono"', '01']];
  const bad = [];
  for (const [f, s] of want) { const got = await document.fonts.load(f, s); if (!got.length) bad.push(f); }
  await document.fonts.ready; return bad;
}"""


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--png', action='store_true'); ap.add_argument('--pdf', action='store_true')
    ap.add_argument('--only', default=''); ap.add_argument('--overview', action='store_true'); a = ap.parse_args()
    if not (a.png or a.pdf or a.overview): a.png = True
    only = set(filter(None, a.only.split(',')))
    svgs = sorted(f for f in glob.glob(os.path.join(PF, 'out', 'svg', '*.svg')) if not only or os.path.basename(f)[:2] in only)
    if not svgs: sys.exit('没有 SVG')
    css = font_css(); tmp = tempfile.mkdtemp(); pdfs = []
    os.makedirs(os.path.join(PF, 'out', 'png'), exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--allow-file-access-from-files'])
        pg = b.new_page(viewport={'width': 1920, 'height': 1080})
        for f in svgs:
            html = os.path.join(tmp, 'page.html')
            open(html, 'w', encoding='utf-8').write(f'<!doctype html><meta charset="utf-8"><style>{css}\nhtml,body{{margin:0;background:#0A0A0B}}svg{{display:block}}</style>'
                                                    + open(f, encoding='utf-8').read())
            pg.goto(f'file://{html}'); bad = pg.evaluate(CHECK)
            if bad: sys.exit(f'字体没加载上：{bad}')
            pg.wait_for_timeout(150)
            stem = os.path.splitext(os.path.basename(f))[0]
            if a.png or a.overview: pg.screenshot(path=os.path.join(PF, 'out', 'png', f'{stem}.png'))
            if a.pdf:
                out = os.path.join(tmp, f'{stem}.pdf'); pg.pdf(path=out, width='1920px', height='1080px', print_background=True, page_ranges='1'); pdfs.append(out)
            print('ok', stem)
        b.close()
    if a.pdf:
        from pypdf import PdfWriter
        w = PdfWriter()
        for f in pdfs: w.append(f)
        w.write(os.path.join(PF, 'out', 'Milo-作品集.pdf')); print('ok pdf', len(pdfs), '页')
    if a.overview:
        from PIL import Image
        pngs = sorted(glob.glob(os.path.join(PF, 'out', 'png', '[0-9][0-9]_*.png'))); cols = 4; tw, th, g = 480, 270, 16
        rows = (len(pngs) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * (tw + g) + g, rows * (th + g) + g), (24, 24, 26))
        for i, f in enumerate(pngs): sheet.paste(Image.open(f).resize((tw, th)), (g + i % cols * (tw + g), g + i // cols * (th + g)))
        sheet.save(os.path.join(PF, 'out', 'png', '00-overview.png')); print('ok overview')


if __name__ == '__main__':
    main()
