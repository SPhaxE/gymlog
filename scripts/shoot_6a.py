#!/usr/bin/env python3
"""阶段 6a 门禁（运行时）：核心闭环 故事 → 建档 → 载入演示数据 → 首页 → 训练 → 结算 → 今天已练完，外加 /demo。
- 一路真点（数字键盘「下一组」、结束并结算、完成），检查每一步的地址、无页面错误、360 宽下无横向溢出
- 截图：screenshots/stage6a/<序号>-<步骤>.png（360 × 800 @2x）、story-<幕>.png（故事 8 幕，?scene=N）、demo-desk.png（/demo 电脑版）
用法：先 npx vite --port 5199，再 python3 scripts/shoot_6a.py"""
import argparse, os, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
ap.add_argument('--no-shots', action='store_true')
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'screenshots', 'stage6a')
os.makedirs(OUT, exist_ok=True)
errors = []

def ok(cond, msg):
    print(('  ✓ ' if cond else '  ✗ ') + msg)
    if not cond: errors.append(msg)

def click(pg, loc):
    """底部固定的按钮 Playwright 会判成「在视口外」，按坐标点"""
    loc.wait_for(); bb = loc.bounding_box(); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    pg = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
    pg.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    n = [0]
    def step(name, path=None, wait=800):
        pg.wait_for_timeout(wait)
        if path: ok(pg.url.split('?')[0].endswith(path) or path in pg.url, f'{name}：地址 {path}')
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{name}：无横向溢出')
        if not args.no_shots: pg.screenshot(path=os.path.join(OUT, f'{n[0]:02d}-{name}.png'))
        n[0] += 1

    # 故事 8 幕：每幕到点自动进下一幕（Stories 式），在快结束前截；互动幕（4b、7）不自动走
    MS = [6500, 6000, 9500, 8000, 0, 9000, 7000, 0]
    for k in range(8):
        pg.goto(f'{args.base}/onboarding?scene={k + 1}'); pg.evaluate('localStorage.clear()'); pg.goto(f'{args.base}/onboarding?scene={k + 1}')
        pg.wait_for_timeout(MS[k] - 700 if MS[k] else 6000)
        if not args.no_shots: pg.screenshot(path=os.path.join(OUT, f'story-{k + 1}.png'))
    # 闭环
    pg.goto(args.base + '/'); pg.evaluate('localStorage.clear()'); pg.goto(args.base + '/'); pg.wait_for_timeout(1500)
    step('story', '/onboarding')
    click(pg, pg.get_by_role('button', name='跳过')); step('setup-1')
    click(pg, pg.get_by_role('button', name='下一步')); step('setup-2')
    click(pg, pg.get_by_role('button', name='下一步')); step('setup-3')
    click(pg, pg.get_by_role('button', name='载入演示数据 · 练了 30 周的进阶用户')); step('today', '/today', 2000)
    click(pg, pg.get_by_role('button', name='开始训练')); step('session', '/session')
    for _ in range(2): click(pg, pg.get_by_role('button', name='下一组')); pg.wait_for_timeout(400)
    step('session-rest')
    click(pg, pg.get_by_role('button', name='结束', exact=True)); step('session-end')
    click(pg, pg.get_by_role('button', name='结束并结算')); step('summary', '/summary/', 4500)
    pg.keyboard.press('Escape'); pg.mouse.move(180, 400); pg.mouse.wheel(0, 900); step('summary-bottom')
    click(pg, pg.get_by_role('button', name='完成', exact=True)); step('done-today', '/today', 2500)
    ok(pg.get_by_text('今天已练完').count() > 0, '首页显示「今天已练完」')
    click(pg, pg.get_by_role('button', name='再练一次')); step('again')
    pg.goto(args.base + '/body'); step('body', '/body', 2500)

    # /demo 电脑版
    d = b.new_page(viewport={'width': 1440, 'height': 900})
    d.on('pageerror', lambda e: errors.append(f'demo pageerror: {e}'))
    d.goto(args.base + '/demo'); d.wait_for_timeout(5000)
    ok(d.locator('iframe').count() == 1, '/demo 电脑版：手机里是 App')
    if not args.no_shots: d.screenshot(path=os.path.join(OUT, 'demo-desk.png'))
    b.close()

print(f'\n{"失败 " + str(len(errors)) + " 项" if errors else "全部通过"}')
for e in errors: print('  - ' + e)
sys.exit(1 if errors else 0)
