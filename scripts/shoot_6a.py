#!/usr/bin/env python3
"""阶段 6a 门禁（运行时）：演示里展示的全部交互，一路真点，每一步都查。
流程：故事 8 幕 → 建档 3 步 → 载入演示数据 → 首页处方（含「为什么是这些」）→ 开始训练（就在首页打卡）→ 打卡 → 休息胶囊展开
      → 点组行改数（键盘面板）→ 换动作 → 清空重量 →「填重量」→ 键盘输入 → 打卡 → 身体页（训练中）→ 结束 → 结算 → 今天已练完 → 再练一次；外加 /demo 电脑版。
每一步检查：地址；360 宽无横向溢出；滚动区里没有被压扁的块；命中区（scripts/lib/hit_audit.js，看得见、能点的都 ≥ 48 × 48）；无页面错误。
两种尺寸：360 × 800（设计基准，出截图）和 412 × 915（常见安卓真机，只查不截）。
截图：screenshots/stage6a/<序号>-<步骤>.png（360 × 800 @2x）、story-<幕>.png、demo-desk.png。
用法：先 npx vite --port 5199 --host 127.0.0.1，再 python3 scripts/shoot_6a.py"""
import argparse, os, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
ap.add_argument('--no-shots', action='store_true')
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'screenshots', 'stage6a')
AUDIT = open(os.path.join(ROOT, 'scripts', 'lib', 'hit_audit.js')).read()
# 被压扁：滚动容器的直接子块里，有正常排版（非绝对定位）的子元素伸出了它的上下边（命中区 ::after 这类绝对定位的外扩不算）
CRUSH = '''() => [...document.querySelectorAll('*')].filter((e) => /auto|scroll/.test(getComputedStyle(e).overflowY))
  .flatMap((c) => [...c.children]).filter((k) => { if (getComputedStyle(k).overflow !== 'visible') return false; const r = k.getBoundingClientRect();
    return [...k.children].some((x) => !/absolute|fixed/.test(getComputedStyle(x).position) && (x.getBoundingClientRect().bottom > r.bottom + 1 || x.getBoundingClientRect().top < r.top - 1)); })
  .map((k) => k.className || k.tagName)'''
os.makedirs(OUT, exist_ok=True)
errors = []

def ok(cond, msg):
    print(('  ✓ ' if cond else '  ✗ ') + msg)
    if not cond: errors.append(msg)

def click(pg, loc):
    """底部固定的按钮 Playwright 会判成「在视口外」，按坐标点"""
    loc = loc.first
    loc.wait_for(); bb = loc.bounding_box(); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)

def run(b, w, h, shots):
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2 if shots else 1, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} pageerror: {e}'))
    n = [0]
    def step(name, path=None, wait=800):
        pg.wait_for_timeout(wait)
        if path: ok(path in pg.url, f'{tag} {name}：地址 {path}')
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} {name}：无横向溢出')
        crushed = pg.evaluate(CRUSH)
        ok(not crushed, f'{tag} {name}：滚动区里没有被压扁的块 {crushed[:3]}')
        small = pg.evaluate(AUDIT)
        ok(not small, f'{tag} {name}：命中区都 ≥ 48 {small[:3]}')
        if shots and not args.no_shots: pg.screenshot(path=os.path.join(OUT, f'{n[0]:02d}-{name}.png'))
        n[0] += 1

    if shots:
        # 故事 8 幕：每幕到点自动进下一幕（Stories 式），在快结束前截；互动幕（4b、7）不自动走
        MS = [6500, 6000, 9500, 8000, 0, 9000, 7000, 0]
        for k in range(8):
            pg.goto(f'{args.base}/onboarding?scene={k + 1}'); pg.evaluate('localStorage.clear()'); pg.goto(f'{args.base}/onboarding?scene={k + 1}')
            pg.wait_for_timeout(MS[k] - 700 if MS[k] else 6000)
            if not args.no_shots: pg.screenshot(path=os.path.join(OUT, f'story-{k + 1}.png'))
    pg.goto(args.base + '/'); pg.evaluate('localStorage.clear()'); pg.goto(args.base + '/'); pg.wait_for_timeout(1500)
    step('story', '/onboarding')
    click(pg, pg.get_by_role('button', name='跳过')); step('setup-1')
    click(pg, pg.get_by_role('button', name='下一步')); step('setup-2')
    click(pg, pg.get_by_role('button', name='下一步')); step('setup-3')
    click(pg, pg.get_by_role('button', name='载入演示数据 · 练了 30 周的进阶用户')); step('today', '/today', 2000)
    click(pg, pg.get_by_role('button', name='为什么是这些')); step('why', None, 1200)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name='开始训练')); step('train', '/today', 1200)
    ok(pg.get_by_role('button', name='打卡 · 第 1 组').count() == 1, f'{tag} 开始后留在首页，主按钮是「打卡 · 第 1 组」')
    click(pg, pg.get_by_role('button', name='打卡 · 第 1 组')); step('train-rest', None, 900)
    ok('休息剩余' in (pg.get_by_role('navigation', name='主导航').locator('[aria-current=page]').get_attribute('aria-label') or ''), f'{tag} 休息时导航选中项写剩余时间')
    click(pg, pg.get_by_role('button', name='组间休息剩余')); step('train-rest-open', None, 900)
    click(pg, pg.get_by_role('button', name='第 2 组')); step('editor', None, 1000)
    kg0 = float(pg.locator('[aria-pressed=true]').get_attribute('aria-label').split()[1])
    click(pg, pg.get_by_role('button', name='加 2.5 kg')); pg.wait_for_timeout(500)
    kg1 = float(pg.locator('[aria-pressed=true]').get_attribute('aria-label').split()[1])
    ok(abs(kg1 - kg0 - 2.5) < 1e-6, f'{tag} 改数面板 +2.5 生效（{kg0} → {kg1}）')
    click(pg, pg.get_by_role('button', name='好了')); step('edited', None, 700)
    # 换到列表里的第一个动作（M03），再把它当前组的重量清空，走「填重量」这条路（首次动作的样子；演示数据保证今天没有首次，所以自己造）
    click(pg, pg.locator('[class*=cascadeItem] button').first); step('switch', None, 1200)
    click(pg, pg.get_by_role('button', name='第 1 组，')); pg.wait_for_timeout(900)
    for _ in range(7): click(pg, pg.get_by_role('button', name='删除')); pg.wait_for_timeout(60)
    ok(pg.get_by_role('button', name='好了').is_disabled(), f'{tag} 重量清空后「好了」不可用、提示行不位移')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    click(pg, pg.get_by_role('button', name='填重量 · 第 1 组')); step('fill', None, 1000)
    for k in ['4', '0']: click(pg, pg.get_by_role('button', name=k, exact=True)); pg.wait_for_timeout(150)
    click(pg, pg.get_by_role('button', name='打卡', exact=True)); step('filled', None, 900)
    pg.goto(args.base + '/body'); step('body-training', '/body', 2500)
    pg.goto(args.base + '/today'); pg.wait_for_timeout(1200)
    click(pg, pg.get_by_role('button', name='结束', exact=True)); step('end-confirm')
    click(pg, pg.get_by_role('button', name='结束并结算')); step('summary', '/summary/', 4500)
    pg.keyboard.press('Escape'); pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, 900); step('summary-bottom')
    click(pg, pg.get_by_role('button', name='完成', exact=True)); step('done-today', '/today', 2500)
    ok(pg.get_by_text('今天已练完').count() > 0, f'{tag} 首页显示「今天已练完」')
    click(pg, pg.get_by_role('button', name='再练一次')); step('again')
    pg.close()

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    run(b, 360, 800, True)
    run(b, 412, 915, False)
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
