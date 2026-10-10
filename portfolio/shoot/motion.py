"""动效帧与交互态（作品集用，不录屏）：
- View Transitions：包住 document.startViewTransition 记下这一次，ready 后暂停全部动画，逐个时刻设 currentTime 截图（冻结时钟逐帧）。
- 交互态：按住不放（放大镜 + 折线引线）时截图。
python3 portfolio/shoot/motion.py m02 | mag | figure [--base http://127.0.0.1:4173]
→ portfolio/assets/frames/m02/NN_<ms>.png、portfolio/assets/screens/body-mag.png、portfolio/assets/frames/figure.png"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from playwright.sync_api import sync_playwright
import app

PF = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FR = os.path.join(PF, 'assets', 'frames')

HOOK = """(() => {
  const d = document; if (!d.startViewTransition || window.__vtHook) return; window.__vtHook = true;
  const start = d.startViewTransition.bind(d);
  d.startViewTransition = (cb) => { const vt = start(cb); window.__vt = vt; return vt; };
})();"""


def goto_body(pg, base, extra=''):
    pg.goto(f'{base}/body?scenario=plain-prescription&theme=dark{extra}'); pg.wait_for_selector('[data-head]'); pg.wait_for_timeout(2200)
    pg.evaluate(app.SYSBARS); pg.wait_for_timeout(100)


def cap_box(pg, name):
    return pg.locator('[role=listbox] [data-id]', has_text=name).first.bounding_box()


def m02(pg, base, name='三角肌前束', times=(0, 30, 60, 90, 120, 160, 210, 280, 400, 800)):
    out = os.path.join(FR, 'm02'); os.makedirs(out, exist_ok=True)
    for f in os.listdir(out): os.remove(os.path.join(out, f))
    goto_body(pg, base); pg.evaluate(HOOK)
    b = cap_box(pg, name); x, y = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(60); pg.mouse.up()
    end = pg.evaluate("""async () => {
      for (let i = 0; i < 100 && !window.__vt; i++) await new Promise(r => setTimeout(r, 10));
      await window.__vt.ready;
      const as = document.getAnimations(); as.forEach(a => a.pause());
      window.__seek = (t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } };
      return Math.max(...as.filter(a => String(a.effect?.pseudoElement || '').includes('view-transition')).map(a => a.effect.getComputedTiming().endTime));
    }""")
    times = [t for t in times if t <= end]
    # 浮层框（::view-transition-group(x-fluid-…)）每一刻的位置：作品集里画成矢量叠影轨迹
    name_ = pg.evaluate("[...document.getAnimations()].map(a => a.effect.pseudoElement).find(p => p && p.includes('group(x-fluid')) || ''")
    rects = []
    for i, t in enumerate(times):
        pg.evaluate(f'window.__seek({t})'); pg.wait_for_timeout(120)
        rects.append(pg.evaluate("""(pe) => { if (!pe) return null; const cs = getComputedStyle(document.documentElement, pe);
          return { w: parseFloat(cs.width), h: parseFloat(cs.height), transform: cs.transform, r: cs.borderRadius }; }""", name_))
        p = os.path.join(out, f'{i:02d}_{t}.png'); pg.screenshot(path=p); app.finish(p)
    json.dump({'end': end, 'times': times, 'pseudo': name_, 'rects': rects}, open(os.path.join(out, 'times.json'), 'w'), ensure_ascii=False, indent=1)
    print('ok m02', times)


def mag(pg, base, name='三角肌前束'):
    goto_body(pg, base)
    b = cap_box(pg, name); x, y = b['x'] + b['width'] / 2, b['y'] + b['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(1400)
    p = os.path.join(PF, 'assets', 'screens', 'body-mag.png'); pg.screenshot(path=p); app.finish(p)
    pg.mouse.up(); print('ok body-mag')


def figure(p, base, dpr=6):
    """出血大图用的人体：同一页面、更高像素密度，藏起胶囊列与页头，只截人体所在的舞台"""
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
    pg = b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=dpr)
    pg.goto(f'{base}/body?scenario=plain-prescription&theme=dark'); pg.wait_for_selector('[data-head]'); pg.wait_for_timeout(2500)
    box = pg.evaluate("""() => {
      const rail = document.querySelector('[role=listbox]');
      for (const el of [rail, rail.nextElementSibling, ...document.querySelectorAll('nav, header')]) if (el) el.style.visibility = 'hidden';
      const svg = document.querySelector('g[data-head]').ownerSVGElement; const r = svg.getBoundingClientRect();
      return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(412, r.right) - Math.max(0, r.x), height: Math.min(915, r.bottom) - Math.max(0, r.y) };
    }""")
    pg.wait_for_timeout(300)
    os.makedirs(FR, exist_ok=True); pg.screenshot(path=os.path.join(FR, 'figure.png'), clip=box)
    b.close(); print('ok figure', box)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('what', nargs='+'); ap.add_argument('--base', default='http://127.0.0.1:4173'); a = ap.parse_args()
    with sync_playwright() as p:
        b, pg = app.open_page(p, a.base)
        for w in a.what:
            if w == 'm02': m02(pg, a.base)
            elif w == 'mag': mag(pg, a.base)
            elif w == 'figure': figure(p, a.base)
        b.close()
