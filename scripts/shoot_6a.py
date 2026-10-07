#!/usr/bin/env python3
"""阶段 6a 门禁（运行时）：演示里展示的全部交互，一路真点，每一步都查。
流程：故事 8 幕 → 建档 3 步 → 载入演示数据 → 首页处方（含「为什么是这些」）→ 开始训练（就在首页打卡）→ 打卡 → 休息胶囊展开
      → 点组行改数（键盘面板）→ 换动作 → 清空重量 →「填重量」→ 键盘输入 → 打卡 → 容量页（训练中）→ 结束 → 结算 → 今天已练完 → 再练一次；外加 /demo 电脑版。
每一步检查：地址；360 宽无横向溢出；滚动区里没有被压扁的块；命中区（scripts/lib/hit_audit.js，看得见、能点的都 ≥ 48 × 48）；无页面错误。
两种尺寸：360 × 800（设计基准，出截图）和 412 × 915（常见安卓真机，只查不截）。
截图：screenshots/stage6a/<序号>-<步骤>.png（360 × 800 @2x）、story-<幕>.png、demo-desk.png。
用法：先 npx vite --port 5199 --host 127.0.0.1，再 python3 scripts/shoot_6a.py
提速（2026-10-06）：
  - 默认两个宽度各开一个进程同时跑（--serial 关掉），总时间约减半；
  - --no-shots 不再等故事 8 幕自己播完（只为截图）；
  - --only 只跑某几类：flow（主流程）、story、deload、gains、log、me、demo，逗号分隔——改哪页只跑哪页，提交前再跑一遍完整的；
  - --width 360|412 只跑一种宽度（并行时内部用）。"""
import argparse, io, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
ap.add_argument('--no-shots', action='store_true')
ap.add_argument('--only', default='', help='flow,story,deload,gains,log,me,demo 逗号分隔；默认全部')
ap.add_argument('--width', type=int, choices=[360, 412], help='只跑一种宽度（并行时内部用）')
ap.add_argument('--serial', action='store_true', help='两个宽度不并行')
args = ap.parse_args()
SIZES = {360: (360, 800), 412: (412, 915)}
ALL = ['flow', 'story', 'deload', 'gains', 'log', 'me', 'demo']
only = [x for x in args.only.split(',') if x] or ALL
if any(x not in ALL for x in only): sys.exit(f'--only 只能是 {",".join(ALL)}')

# 并行：每个宽度一个进程，结果按宽度顺序打印；任一失败则退出码非 0
if args.width is None and not args.serial:
    base = [sys.executable, os.path.abspath(__file__), '--base', args.base, '--chromium', args.chromium, '--only', ','.join(only)] + (['--no-shots'] if args.no_shots else [])
    procs = [(w, subprocess.Popen(base + ['--width', str(w)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)) for w in SIZES]
    code = 0
    for w, pr in procs:
        out, _ = pr.communicate(); print(f'===== {w} 宽 ====='); print(out.rstrip()); code = code or pr.returncode
    print('\n全部通过' if code == 0 else '\n有失败项（见上）')
    sys.exit(code)

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

    if shots and not args.no_shots:
        # 故事 8 幕（只为截图，--no-shots 时不等）：每幕到点自动进下一幕（Stories 式），在快结束前截；互动幕（4b、7）不自动走
        MS = [6500, 6000, 9500, 8000, 0, 9000, 9000, 0]
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
    # 2026-10-06 用户：滑走后不再出小页头（细标题栏整套删了）
    ok(pg.locator('[class*=_slim_]').count() == 0, f'{tag} 首页：没有细标题栏')
    home_h1 = pg.locator('h1').first.bounding_box()['y']
    click(pg, pg.get_by_role('button', name='为什么是这些')); step('why', None, 1200)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name='开始训练')); step('train', '/today', 1200)
    ok(pg.get_by_role('button', name='打卡 · 第 1 组').count() == 1, f'{tag} 开始后留在首页，主按钮是「打卡 · 第 1 组」')
    ok(abs(pg.locator('h1').first.bounding_box()['y'] - home_h1) <= 1, f'{tag} 训练中：大标题和开始前在同一个位置（标题上方不放日期）')
    click(pg, pg.get_by_role('button', name='打卡 · 第 1 组')); step('train-rest', None, 900)
    navlabel = lambda: pg.get_by_role('navigation', name='主导航').locator('[aria-current=page]').get_attribute('aria-label') or ''
    ok('休息剩余' not in navlabel() and pg.locator('[style*="x-rest-timer"]').count() == 1, f'{tag} 首页休息中只有一个计时器（主按钮旁的胶囊，导航不重复）')
    click(pg, pg.get_by_role('button', name='组间休息剩余')); step('train-rest-open', None, 900)
    # 失败时要看得出发生了什么：记下点击、面板出现 / 消失的时间线
    pg.evaluate('''() => { window.__trace = []; const t0 = performance.now(), log = (m) => window.__trace.push(Math.round(performance.now() - t0) + 'ms ' + m);
      document.addEventListener('click', (e) => { const who = e.target.closest('[aria-label]')?.getAttribute('aria-label') || e.target.className || e.target.tagName;
        log('click ' + who + ' 转场中=' + document.documentElement.matches(':active-view-transition') + ' 坐标处=' + document.elementFromPoint(e.clientX, e.clientY)?.tagName); }, true);
      new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach((n) => n.nodeType === 1 && n.matches?.('[role=dialog],[class*=scrim]') && log('出现 ' + n.className)); m.removedNodes.forEach((n) => n.nodeType === 1 && n.matches?.('[role=dialog],[class*=scrim]') && log('消失 ' + n.className)); })).observe(document.body, { childList: true, subtree: true }); }''')
    click(pg, pg.get_by_role('button', name='第 2 组')); step('editor', None, 1000)
    try: kg0 = float(pg.locator('[aria-pressed=true]').get_attribute('aria-label', timeout=5000).split()[1])
    except Exception:
        pg.screenshot(path=f'/tmp/fail-editor-{w}.png'); print('  时间线：', pg.evaluate('window.__trace')); raise
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
    # 切到容量页：计时胶囊借共享元素飞进导航滑块（点导航，不是直接改地址）
    # 转场一就绪就记下转场层里有哪些共享元素（不靠睡眠时间采样，时序抖动也不会漏）
    pg.evaluate('''() => { window.__vt = null; const o = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => { const vt = o(cb); vt.ready.then(() => { window.__vt = [...document.getAnimations()].map((a) => (a.effect && a.effect.pseudoElement) || ''); }, () => {}); return vt; }; }''')
    click(pg, pg.get_by_role('link', name='容量')); pg.wait_for_function('window.__vt !== null', timeout=5000)
    fly = pg.evaluate('window.__vt')
    ok(any('x-rest-ring' in x for x in fly), f'{tag} 切 Tab：只有进度条（x-rest-ring）作为共享元素飞进导航滑块')
    ok(pg.locator('nav [style*="x-rest-timer"]').count() == 0, f'{tag} 切 Tab：导航滑块不带整颗胶囊的共享名（不会盖住图标和文字）')
    step('body-training', '/body', 2500)
    ok('休息剩余' in navlabel() or pg.get_by_role('button', name='组间休息剩余').count() == 0, f'{tag} 容量页：休息计时在导航滑块上')
    pg.goto(args.base + '/today'); pg.wait_for_timeout(1200)
    click(pg, pg.get_by_role('button', name='结束', exact=True)); step('end-confirm')
    click(pg, pg.get_by_role('button', name='结束并结算')); pg.wait_for_selector('text=练完了'); step('summary', '/summary/', 2000)
    pg.keyboard.press('Escape'); pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, 900); step('summary-bottom')
    click(pg, pg.get_by_role('button', name='完成', exact=True)); step('done-today', '/today', 2500)
    ok(pg.get_by_text('今天已练完').count() > 0, f'{tag} 首页显示「今天已练完」')
    again = pg.get_by_role('button', name='再练一次')
    ok(pg.evaluate('(el) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"', again.element_handle()), f'{tag} 悬浮的「再练一次」有实底（滚动内容不会从字后面穿过）')
    ok(pg.evaluate('() => !!document.querySelector("[class*=scrimLow]")'), f'{tag} 「再练一次」下面垫了渐隐层')
    click(pg, pg.get_by_role('button', name='再练一次')); step('again')
    # 增量页（真实数据：这一次刚练完的记录也在里面）
    click(pg, pg.get_by_role('link', name='增量')); step('gains', '/gains', 1500)
    ok(pg.get_by_text('次破纪录').count() == 1, f'{tag} 增量：有近 4 周摘要')
    pg.close()

def story_checks(b, w, h):
    """故事页（2026-10-06 改版）的运行时断言：品牌 Logo 在屏幕中下方；互动幕的「开始训练」在底部拇指区、有脉冲、点早了有反馈；
    产品小样幕里容量页演示在跑、两张卡先后弹入（相隔很短）、卡片和文字不重叠。"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} story pageerror: {e}'))
    def open_scene(k, wait):
        pg.goto(f'{args.base}/onboarding?scene={k}'); pg.evaluate('localStorage.clear()'); pg.goto(f'{args.base}/onboarding?scene={k}'); pg.wait_for_timeout(wait)
    # 第 3 幕：天数走完（约 6.5 秒）后品牌 Logo 在水平正中、下半屏，不压文字
    open_scene(3, 8200)
    br = pg.locator('[class*=brand]').first.bounding_box(); tx = pg.locator('[class*=_text_]').first.bounding_box()
    ok(abs(br['x'] + br['width'] / 2 - w / 2) < w * 0.05 and br['y'] > h * 0.6, f'{tag} 故事第 3 幕：品牌 Logo 在屏幕水平正中、下半屏')
    ok(br['y'] >= tx['y'] + tx['height'], f'{tag} 故事第 3 幕：品牌 Logo 不压文字')
    # 第 5 幕：互动
    open_scene(5, 700)
    btn = pg.get_by_role('button', name='开始训练').bounding_box()
    ok(btn['y'] > h * 0.75 and btn['height'] >= 48, f'{tag} 故事互动幕：「开始训练」在底部拇指区、高 ≥ 48')
    ok(pg.evaluate('getComputedStyle(document.querySelector("[class*=pulse]"), "::before").animationName') != 'none', f'{tag} 故事互动幕：按钮外有脉冲动画')
    pg.mouse.click(btn['x'] + btn['width'] / 2, btn['y'] + btn['height'] / 2); pg.wait_for_timeout(500)
    ok(pg.get_by_text('太早了').count() > 0, f'{tag} 故事互动幕：点早了有反馈（提示不位移，曲线不动）')
    # 第 7 幕：产品小样
    open_scene(7, 3500)
    ok(pg.locator('[role=option]').count() >= 4, f'{tag} 故事第 7 幕：容量页演示的胶囊列在')
    delays = pg.evaluate('[...document.querySelectorAll("[class*=pCard]")].map((e) => parseFloat(getComputedStyle(e).animationDelay) * 1000)')
    ok(len(delays) == 2 and 0 < delays[1] - delays[0] <= 200, f'{tag} 故事第 7 幕：第二张卡紧跟第一张弹入（相隔 {delays[1] - delays[0] if len(delays) == 2 else "?"} 毫秒 ≤ 200）')
    cards = pg.evaluate('[...document.querySelectorAll("[class*=pCard]")].map((e) => { const r = e.getBoundingClientRect(); return [r.top, r.bottom]; })')
    txt = pg.locator('[class*=_text_]').first.bounding_box()
    ok(cards[0][1] <= cards[1][0] and cards[1][1] + 8 <= txt['y'], f'{tag} 故事第 7 幕：两张卡之间、卡和文字之间都不重叠')
    pg.close()

def deload_checks(b, w, h):
    """减量闭环（2026-10-06）：首页「看看」→ 面板（依据 + 两个按钮）→ 采纳变减量周 / 这次不减变一行小字；演示场景里也要能走完，没有点了没反应的按钮"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} deload pageerror: {e}'))
    def open_home():
        pg.goto(f'{args.base}/today?scenario=deload-suggested'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
    open_home()
    ok(pg.get_by_role('button', name='看看').count() == 1, f'{tag} 减量：首页「建议本周减量」有可点的「看看」')
    click(pg, pg.get_by_role('button', name='看看')); pg.wait_for_timeout(900)
    ok(pg.get_by_role('button', name='采纳减量').count() == 1 and pg.get_by_role('button', name='这次不减').count() == 1, f'{tag} 减量：面板里有「采纳」和「这次不减」')
    ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 减量面板：无横向溢出')
    small = pg.evaluate(AUDIT)
    ok(not small, f'{tag} 减量面板：命中区都 ≥ 48 {small[:3]}')
    click(pg, pg.get_by_role('button', name='采纳减量')); pg.wait_for_timeout(900)
    ok(pg.get_by_text('减量周 · 还剩').count() > 0 and pg.get_by_role('button', name='看看').count() == 0, f'{tag} 减量：采纳后首页变「减量周 · 还剩 N 天」')
    open_home()
    click(pg, pg.get_by_role('button', name='看看')); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('button', name='这次不减')); pg.wait_for_timeout(900)
    ok(pg.get_by_text('你选了这次不减').count() > 0, f'{tag} 减量：「这次不减」后只剩一行小字')
    pg.close()


def gains_checks(b, w, h):
    """增量页（P09）：演示数据三组都有、荧光只一处、下次目标与首页同一个数、减量周合成一组、没练过是空状态"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} gains pageerror: {e}'))
    def at(sc, shot=None):
        pg.goto(f'{args.base}/gains?scenario={sc}'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 增量·{sc}：无横向溢出')
        small = pg.evaluate(AUDIT)
        ok(not small, f'{tag} 增量·{sc}：命中区都 ≥ 48 {small[:3]}')
        if shot and not args.no_shots: pg.screenshot(path=os.path.join(OUT, f'gains-{shot}.png'))
    at('plain-prescription', 'plain')
    ok(pg.get_by_role('heading', name='该加重').count() == 1, f'{tag} 增量：有「该加重」组')
    ok(pg.get_by_role('heading', name='该减重').count() == 1, f'{tag} 增量：有「该减重」组')
    ok(pg.get_by_role('heading', name='保持，次数 +1').count() == 1, f'{tag} 增量：有「保持」组')
    ok(pg.locator('[class*=headLit]').count() == 1, f'{tag} 增量：荧光只有「该加重」一处')
    # 分组可收起（2026-10-06 用户）：默认只展开第一组；点组头收起 / 展开，高度按弹簧走、展开时行依次弹入
    heads = pg.locator('button[aria-expanded]')
    ok([heads.nth(i).get_attribute('aria-expanded') for i in range(heads.count())] == ['true'] + ['false'] * (heads.count() - 1), f'{tag} 增量·分组：默认只展开第一组（{heads.count()} 组）')
    body_h = lambda i: pg.evaluate(f"document.getElementById(document.querySelectorAll('button[aria-expanded]')[{i}].getAttribute('aria-controls')).getBoundingClientRect().height")
    ok(body_h(1) < 1 and body_h(0) > 100, f'{tag} 增量·分组：收起的组只剩组头（{body_h(1):.0f}），展开的有内容（{body_h(0):.0f}）')
    click(pg, heads.nth(1)); pg.wait_for_timeout(120)
    mid = body_h(1); pg.wait_for_timeout(900)
    ok(heads.nth(1).get_attribute('aria-expanded') == 'true' and 0 < mid < body_h(1), f'{tag} 增量·分组：点组头展开，高度是过渡过去的（{mid:.0f} → {body_h(1):.0f}）')
    click(pg, heads.nth(0)); pg.wait_for_timeout(900)
    ok(heads.nth(0).get_attribute('aria-expanded') == 'false' and body_h(0) < 1, f'{tag} 增量·分组：再点组头收起')
    click(pg, heads.nth(0)); pg.wait_for_timeout(900)
    ok(pg.get_by_text('近 4 周练了').count() == 1 and pg.get_by_text('个在涨').count() == 1 and pg.get_by_text('次破纪录').count() == 1, f'{tag} 增量：摘要每个数都带单位（个动作 / 个在涨 / 次破纪录）')
    sparks = pg.evaluate('''() => [...document.querySelectorAll('svg[class*=spark]')].filter((e) => { const r = e.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }).map((e) => Math.round(e.getBoundingClientRect().left))''')
    ok(len(sparks) >= 3 and max(sparks) - min(sparks) <= 1, f'{tag} 增量：每行的小曲线从同一条竖线开始 {sparks}')
    top0 = pg.locator('h1').first.bounding_box()['y']
    pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, 700); pg.wait_for_timeout(600)
    top1 = pg.locator('h1').first.bounding_box()['y']
    ok(top0 > 0 and top1 < 0, f'{tag} 增量：下滑后页头跟着滑走，不钉在顶上（{top0:.0f} → {top1:.0f}）')
    ok(pg.locator('[class*=_slim_]').count() == 0, f'{tag} 增量：滑走后没有细标题栏')
    chip_y = pg.get_by_role('button', name='全部').first.bounding_box()['y']
    ok(0 <= chip_y < 60, f'{tag} 增量：部位筛选滑到顶后贴顶（y={chip_y:.0f}）')
    pg.mouse.wheel(0, -3000); pg.wait_for_timeout(600)
    chips = pg.get_by_role('button', name='胸')
    ok(chips.count() == 1, f'{tag} 增量：有部位筛选')
    click(pg, chips); pg.wait_for_timeout(700)
    ok(chips.first.get_attribute('aria-pressed') == 'true', f'{tag} 增量：选中「胸」')
    ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 增量·筛选后：无横向溢出')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'gains-chest.png'))
    # 五个 Tab 的大标题在同一个位置（2026-10-06 用户：标题上方的小字让跨页时大标题位置不稳定）
    ys = {}
    for path in ('/today', '/body', '/gains', '/log', '/me'):
        pg.goto(f'{args.base}{path}?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(500)
        ys[path] = round(pg.locator('h1').first.bounding_box()['y'], 1)
    ok(max(ys.values()) - min(ys.values()) <= 1, f'{tag} 五个 Tab 的大标题 y 相同 {ys}')
    # 容量页（2026-10-06 用户）：半身人体（版式不变）头到脚完整、常态胶囊缩 1/3、换卡一律从左往右、胶囊 → 详情是共享元素（M03）
    pg.goto(f'{args.base}/body?scenario=plain-prescription'); pg.wait_for_selector('[role=option]'); pg.wait_for_timeout(1500)
    fig = pg.evaluate("""() => { const f = document.querySelector('svg[class*=_thermal_]').getBoundingClientRect(), st = f && document.querySelector('[class*=_figureClip_]').getBoundingClientRect();
      return { f: [f.left, f.top, f.right, f.bottom].map(Math.round), st: [st.left, st.top, st.right, st.bottom].map(Math.round) }; }""")
    ok(fig['f'][1] >= fig['st'][1] - 1 and fig['f'][3] <= fig['st'][3] + 1 and abs(fig['f'][0] - fig['st'][0]) <= 1, f'{tag} 容量：半身人体从内容区左缘起、头到脚都在舞台里（版式同原来）{fig}')
    caps_h = pg.evaluate("[...document.querySelectorAll('[role=option]')].map((e) => e.getBoundingClientRect().height)")
    ok(max(caps_h) <= 20.5, f'{tag} 容量：常态胶囊高 ≤ 20（缩了 1/3）{max(caps_h):.1f}')
    ok(pg.get_by_role('heading', level=1, name='容量').count() == 1 and pg.get_by_role('link', name='容量').count() == 1, f'{tag} 容量：页标题和导航都叫「容量」')
    # 三层视效（2026-10-07 方案台选定）：O2 柔光描边（screen 光层里）+ F1 金属渐变滤镜 + S9 熔流（SMIL 在跑、没被暂停）
    look = pg.evaluate("""() => { const l = document.querySelector('svg[class*=_light_]'), fl = document.querySelector('svg[data-flow=molten]');
      return { blend: l && getComputedStyle(l).mixBlendMode, soft: l ? l.querySelectorAll('[class*=_cSoft_] path').length : 0,
        metal: !!document.querySelector('svg[class*=_thermal_] filter[id^=mf] feDisplacementMap'),
        flow: fl ? fl.querySelectorAll('animate, animateTransform').length : 0, t0: fl ? fl.getCurrentTime() : null }; }""")
    pg.wait_for_timeout(400); look['t1'] = pg.evaluate("() => document.querySelector('svg[data-flow=molten]')?.getCurrentTime() ?? null")
    ok(look['blend'] == 'screen' and look['soft'] > 20 and look['metal'] and look['flow'] > 3 and look['t1'] is not None and look['t1'] > look['t0'], f'{tag} 容量：O2 柔光描边 + F1 金属渐变 + S9 熔流在流（步进时钟在走）{look}')
    cdp = pg.context.new_cdp_session(pg); cdp.send('Animation.enable'); cdp.send('Animation.setPlaybackRate', {'playbackRate': 0.2})
    pg.get_by_role('radio', name='背面').click(); pg.wait_for_timeout(250)
    xs = pg.evaluate("""() => Object.fromEntries([...document.querySelectorAll('[class*=_cardIn_],[class*=_cardOut_]')].map((e) => [e.className.includes('cardIn') ? 'in' : 'out', new DOMMatrix(getComputedStyle(e).transform).e]))""")
    ok(xs.get('in', 0) < 0 and xs.get('out', 0) > 0, f'{tag} 容量·换卡：新卡从左边进、旧卡往右退 {xs}')
    zi = pg.evaluate("""() => [...document.querySelectorAll('[class*=_cardIn_],[class*=_cardOut_]')].map((e) => [e.className.includes('cardIn') ? 'in' : 'out', +getComputedStyle(e).zIndex])""")
    ok(dict(zi).get('in', 0) > dict(zi).get('out', 0), f'{tag} 容量·换卡：新卡盖在旧卡上面，胶囊与引线在两张卡之上 {zi}')
    cdp.send('Animation.setPlaybackRate', {'playbackRate': 1}); pg.wait_for_timeout(1500)
    pg.evaluate("""() => { window.__vt = null; const o = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => { const vt = o(cb); vt.ready.then(() => { window.__vt = [...document.getAnimations()].map((a) => (a.effect && a.effect.pseudoElement) || ''); }, () => {}); return vt; }; }""")
    cap = pg.locator('[role=option]').nth(2); cb = cap.bounding_box(); pg.mouse.click(cb['x'] + cb['width'] / 2, cb['y'] + cb['height'] / 2)
    pg.wait_for_selector('[role=dialog]'); pg.wait_for_timeout(300)
    vt = pg.evaluate('window.__vt') or []
    ok(any('x-card-' in x for x in vt) and any('x-title-' in x for x in vt), f'{tag} 容量·M03：胶囊原地长成肌头详情（卡片与名称是共享元素）')
    pg.wait_for_timeout(900)
    ok(pg.locator('[role=option][style*="view-transition-name"]').count() == 0, f'{tag} 容量·M03：面板开着时胶囊不带共享名（同名不能有两份）')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'volume-sheet.png'))
    click(pg, pg.get_by_role('button', name='关闭')); pg.wait_for_timeout(1200)
    ok(pg.locator('[role=dialog]').count() == 0 and pg.locator('[style*="view-transition-name"]').count() == 0, f'{tag} 容量·M03：关闭后缩回胶囊，转场放完不留共享名')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'volume.png'))
    # 对比度审查（2026-10-06 用户）：各页可见文字对它实际的底色，正文 ≥ 4.5、大字 ≥ 3（WCAG AA；画在 SVG / 画布里的字另有截图核对）
    for path in ('/today', '/body', '/gains', '/gains/barbell-bench-press-4', '/log', '/me', '/me/level', '/me/messages'):
        pg.goto(f'{args.base}{path}?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
        low = pg.evaluate(CONTRAST)
        ok(not low, f'{tag} 对比度·{path}：文字都达标 {low[:3]}')
    # 回到顶端：短的时候没有；滚过一屏出现，点了滚回顶、按钮收起
    pg.goto(f'{args.base}/log?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(700)
    btt = pg.get_by_role('button', name='回到顶端')
    ok(btt.count() == 0, f'{tag} 回到顶端：在顶部时不出现（读屏也读不到）')
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, e.scrollHeight)'); pg.wait_for_timeout(700)
    ok(btt.count() == 1 and float(btt.evaluate('e => getComputedStyle(e).opacity')) > 0.95, f'{tag} 回到顶端：滚过一屏出现')
    bb = btt.bounding_box(); nav_top = pg.get_by_role('navigation', name='主导航').bounding_box()['y']
    ok(round(bb['width']) >= 48 and round(bb['height']) >= 48 and bb['y'] + bb['height'] <= nav_top, f'{tag} 回到顶端：命中 48、在导航上方 {bb}')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'back-to-top.png'))
    click(pg, btt); pg.wait_for_timeout(1500)
    ok(pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTop') < 2, f'{tag} 回到顶端：点了滚回顶')
    ok(pg.get_by_role('button', name='回到顶端').count() == 0, f'{tag} 回到顶端：回到顶后收起')
    # 曲线页（P10）：点一行进去，大数字和增量页那一行是同一个数；点明细的一行换成那天；返回后筛选和滚动位置还在
    pg.goto(f'{args.base}/gains?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(700)
    for i in range(pg.locator('button[aria-expanded=false]').count()):   # 展开全部组，进最后一行
        hd = pg.locator('button[aria-expanded=false]').first; hd.scroll_into_view_if_needed(); click(pg, hd); pg.wait_for_timeout(700)
    rows_all = pg.get_by_role('button', name=re.compile(r'^查看.+的进步曲线$'))
    rows_all.last.scroll_into_view_if_needed(); pg.wait_for_timeout(500)
    top_before = pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTop')
    row = rows_all.last
    row_name = row.get_attribute('aria-label')[2:-5]
    click(pg, row); pg.wait_for_selector('text=下次目标'); pg.wait_for_timeout(900)
    ok('/gains/' in pg.url and pg.get_by_role('heading', name=row_name).count() == 1, f'{tag} 曲线页：点增量页的一行进到这个动作（{row_name}）')
    ok(pg.get_by_text('和首页处方、增量页是同一个数').count() == 1 and pg.locator('[class*=_next_]').count() == 1, f'{tag} 曲线页：有下次目标')
    ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 曲线页：无横向溢出')
    small = pg.evaluate(AUDIT)
    ok(not small, f'{tag} 曲线页：命中区都 ≥ 48 {small[:3]}')
    recs = pg.locator('[class*=_rec_]')
    # 钻入转场：返回时名称 / 最新值 / 小曲线作为共享元素飞回那一行，转场放完后列表里不留共享名
    pg.evaluate('''() => { window.__vt = null; const o = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => { const vt = o(cb); vt.ready.then(() => { window.__vt = [...document.getAnimations()].map((a) => (a.effect && a.effect.pseudoElement) || ''); }, () => {}); return vt; }; }''')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_selector('h1'); pg.wait_for_timeout(300)
    vt = pg.evaluate('window.__vt') or []
    ok(all(any(k in x for x in vt) for k in ('x-drill-name', 'x-drill-num', 'x-drill-line')), f'{tag} 曲线页：返回时名称、最新值、小曲线作为共享元素飞回那一行')
    pg.wait_for_timeout(1800)
    ok(pg.locator('[style*="x-drill"]').count() == 0, f'{tag} 曲线页：转场放完后列表里不留共享名（同名不能有两份）')
    click(pg, row); pg.wait_for_selector('text=下次目标'); pg.wait_for_timeout(900)
    recs = pg.locator('[class*=_rec_]')
    ok(recs.count() >= 2, f'{tag} 曲线页：最近几次明细可点（{recs.count()} 行）')
    day0 = pg.locator('[class*=_label_]').first.inner_text()
    # 拖曲线换日子时整页不跳（2026-10-06 用户）：从左拖到右，每吸到一次都量「下次目标」的位置、滚动位置和单位的横坐标
    pg.locator('[class*=_scroll_]').first.evaluate('(e) => e.scrollTo(0, 80)'); pg.wait_for_timeout(300)
    plot = pg.locator('svg[class*=_plot_]').first.bounding_box()
    probe = '''() => { const sc = document.querySelector('[class*=_scroll_]'), nx = document.querySelector('[class*=_next_]').getBoundingClientRect();
      const u = document.querySelector('[class*=_big_] > .milo-text-heading').getBoundingClientRect(); return [Math.round(sc.scrollTop), Math.round(nx.top), Math.round(u.left), document.querySelector('[class*=_label_]').textContent]; }'''
    pg.mouse.move(plot['x'] + 4, plot['y'] + plot['height'] / 2); pg.mouse.down()
    marks = []
    for k in range(13):
        pg.mouse.move(plot['x'] + 4 + (plot['width'] - 8) * k / 12, plot['y'] + plot['height'] / 2, steps=3); pg.wait_for_timeout(120); marks.append(pg.evaluate(probe))
    pg.mouse.up(); pg.wait_for_timeout(300)
    ok(len({m[3] for m in marks}) >= 3, f'{tag} 曲线页·拖动：吸到了多个日子（{len({m[3] for m in marks})} 个）')
    ok(len({m[0] for m in marks}) == 1 and max(m[1] for m in marks) - min(m[1] for m in marks) <= 1, f'{tag} 曲线页·拖动：滚动位置和下面的内容不跳 {sorted({(m[0], m[1]) for m in marks})}')
    ok(max(m[2] for m in marks) - min(m[2] for m in marks) <= 1, f'{tag} 曲线页·拖动：大数字的单位不左右跳 {sorted({m[2] for m in marks})}')
    pg.locator('[class*=_scroll_]').first.evaluate('(e) => e.scrollTo(0, e.scrollHeight)'); pg.wait_for_timeout(400)
    click(pg, recs.nth(1)); pg.wait_for_timeout(600)
    pg.locator('[class*=_scroll_]').first.evaluate('(e) => e.scrollTo(0, 0)'); pg.wait_for_timeout(400)
    ok(pg.locator('[class*=_label_]').first.inner_text() != day0 and recs.nth(1).get_attribute('aria-pressed') == 'true', f'{tag} 曲线页：点明细的一行，大数字换成那一天')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
    top_after = pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTop')
    ok(abs(top_after - top_before) <= 2 and top_before > 0, f'{tag} 曲线页：返回后滚动位置还在（{top_before:.0f} → {top_after:.0f}）')
    click(pg, pg.get_by_role('button', name='背')); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name=re.compile(r'^查看.+的进步曲线$')).first); pg.wait_for_selector('text=下次目标'); pg.wait_for_timeout(600)
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_selector('h1'); pg.wait_for_timeout(700)
    ok(pg.get_by_role('button', name='背').first.get_attribute('aria-pressed') == 'true', f'{tag} 曲线页：返回后部位筛选还在（背）')
    pg.goto(f'{args.base}/gains/not-an-exercise?scenario=plain-prescription'); pg.wait_for_timeout(700)
    ok(pg.get_by_role('button', name='回增量页').count() == 1, f'{tag} 曲线页：动作不存在时有回增量页的出口')
    at('deload-suggested', 'deload-suggested')
    ok(pg.get_by_role('button', name='看看').count() == 1, f'{tag} 增量：建议减量时状态行有「看看」')
    click(pg, pg.get_by_role('button', name='看看')); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('button', name='采纳减量')); pg.wait_for_timeout(1200)
    ok(pg.get_by_text('减量周 · 还剩').count() > 0 and pg.get_by_role('heading', name='本周目标 · 减量').count() == 1, f'{tag} 增量：采纳后合成一组「本周目标 · 减量」')
    ok(pg.get_by_role('heading', name='该加重').count() == 0, f'{tag} 增量：减量周没有「该加重」')
    at('deload-adopted', 'deload-adopted')
    ok(pg.get_by_role('heading', name='本周目标 · 减量').count() == 1, f'{tag} 增量：减量周场景是一组')
    at('cold-start', 'cold-start')
    ok(pg.get_by_role('button', name='去今日处方').count() == 1, f'{tag} 增量：没练过 = 空状态，有回首页的出口')
    pg.close()

# ---- 记录页（P07）：钢板日历 + 周列表 ----
# 孔心（用 <use> 的包围盒中心：<mask> 里的圆不在渲染树里，量不到）
PLATE_HOLES = """() => [...document.querySelectorAll('[data-plate] svg use')].filter((u) => (u.getAttribute('href') || '').endsWith('-hole')).map((u) => { const r = u.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })"""
PLATE_BOX = """() => { const r = document.querySelector('[data-plate]').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""

def hole_lums(pg):
    """每个孔心的亮度（绿通道，3×3 平均，截图里采样）；返回 [(相对板左边的 x 比例, 亮度)]"""
    from PIL import Image
    box, pts = pg.evaluate(PLATE_BOX), pg.evaluate(PLATE_HOLES)
    im = Image.open(io.BytesIO(pg.screenshot())).convert('RGB'); sx, sy = im.width / pg.evaluate('innerWidth'), im.height / pg.evaluate('innerHeight')
    out = []
    for x, y in pts:
        px = [im.getpixel((int(x * sx) + dx, int(y * sy) + dy))[1] for dx in (-1, 0, 1) for dy in (-1, 0, 1)]
        out.append(((x - box['x']) / box['w'], sum(px) / len(px)))
    return out

CONTRAST = r"""() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const bgOf = (el) => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.99) break; } } let bg = [10, 10, 11, 1]; for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg); return bg; };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('svg') || el.closest('[aria-hidden=true]') || el.closest('nav')) continue;  // 导航选中项的字在骨白滑块上（滑块是兄弟元素，不是祖先），这里算不准，另有截图核对
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    let fg = parse(cs.color); if (!fg) continue; let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const bg = bgOf(el); fg = blend([fg[0], fg[1], fg[2], fg[3] * op], bg);
    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 600, large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.push([+ratio.toFixed(2), need, size, t.textContent.trim().slice(0, 24), el.className.toString().slice(0, 40)]);
  }
  return out;
}"""

def log_checks(b, w, h):
    """记录页（P07）：钢板上的孔数 = 练过的天数、板的节点数、固定光源下的亮暗与光束、拖动吸附与读数、减少动态效果下静止、周合计自洽、更早的训练、空态；"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} log pageerror: {e}'))
    def open_log(sc, shot=None):
        pg.goto(f'{args.base}/log?scenario={sc}'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 记录·{sc}：无横向溢出')
        ok(pg.evaluate('(() => { const e = document.querySelector("[class*=_scroll_]"); return e.scrollWidth <= e.clientWidth; })()'), f'{tag} 记录·{sc}：滚动区里也没有横向滚动（漏光不能把它撑宽）')
        small = pg.evaluate(AUDIT); ok(not small, f'{tag} 记录·{sc}：命中区都 ≥ 48 {small[:3]}')
        ok(not pg.evaluate(CRUSH), f'{tag} 记录·{sc}：滚动区里没有被压扁的块')
        if shot and not args.no_shots: pg.screenshot(path=os.path.join(OUT, f'log-{shot}.png'))
    open_log('plain-prescription', 'plain')
    n_days = int(re.search(r'练了\s*(\d+)\s*天', pg.locator('p', has_text='近 3 个月练了').first.inner_text()).group(1))
    holes = pg.evaluate(PLATE_HOLES)
    ok(len(holes) == n_days and n_days > 0, f'{tag} 记录：钢板上的孔数 = 一句话里的练过天数（{len(holes)} / {n_days}）')
    ok(pg.evaluate('document.querySelectorAll("[data-plate] *").length') < 400, f'{tag} 记录：整块板 < 400 个节点（{pg.evaluate("document.querySelectorAll(\"[data-plate] *\").length")}）')
    ok(pg.get_by_role('slider', name=re.compile(r'练了 \d+ 天')).count() == 1, f'{tag} 记录：钢板对读屏是一个滑块「近 3 个月练了 N 天」（左右键换日子）')
    # 周头合计自洽：每个周头的「组」= 这一周各行写的组数之和
    heads = pg.evaluate("""() => [...document.querySelectorAll('section[class*=_week_]')].map((sec) => ({
        sets: +([...sec.querySelectorAll('[class*=_totals_] b')][1]?.textContent || 0),
        rows: [...sec.querySelectorAll('[class*=_session_] [class*=_meta_]')].map((e) => +((e.textContent.match(/(\\d+) 组/) || [0, 0])[1])),
        txt: sec.querySelector('[class*=_totals_]').getAttribute('aria-label') }))""")
    ok(len(heads) >= 2 and all(hd['sets'] == sum(hd['rows']) for hd in heads), f'{tag} 记录：每周合计的组数 = 这一周各行组数之和 {[(hd["sets"], sum(hd["rows"])) for hd in heads[:3]]}')
    ok(all(re.fullmatch(r'\d+ 次 · \d+ 组 · [\d,.]+ kg', hd['txt']) for hd in heads), f'{tag} 记录：周合计三个数都带单位 {heads[0]["txt"]}')
    ok(pg.locator('button[class*=_session_]').count() == sum(len(x) for x in [pg.locator('[class*=_session_]').all()]), f'{tag} 记录：每一行都是可点的按钮（点进训练详情，不给死路）')
    # 光（2026-10-06 第 7 轮）：光源固定在屏幕左上角——离光越近的孔越亮；板随滚动移动，孔的亮暗跟着变；孔向右下射出光束；浮尘只在光束里、会动
    pg.evaluate('document.querySelector("[class*=_body_]").style.paddingTop = "300px"'); pg.wait_for_timeout(500)
    s0 = hole_lums(pg)
    left = [bb for x, bb in s0 if x < 0.4]; right = [bb for x, bb in s0 if x > 0.6]
    ok(left and right and sum(left) / len(left) > sum(right) / len(right) + 4, f'{tag} 记录·钢板：离光源近的（左边）孔更亮（左 {sum(left) / max(1, len(left)):.0f} / 右 {sum(right) / max(1, len(right)):.0f}）')
    ok(min(bb for _, bb in s0) > 12, f'{tag} 记录·钢板：最远的孔也有底光，不是黑洞（{min(bb for _, bb in s0):.0f}）')
    cen = """() => { const c = document.querySelector('[data-plate] canvas[class*=_beams_]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let lo = 0, s = 0;
      for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) { const a = d[(y * c.width + x) * 4 + 3]; s += a; if (y > c.height * 0.62) lo += a; } return [lo / s, 0]; }"""
    c0 = pg.evaluate(cen); pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 400)'); pg.wait_for_timeout(600); c1 = pg.evaluate(cen)
    ok(c0[0] - c1[0] > 0.004, f'{tag} 记录·钢板：光源固定、板滚上去后光束转平，落到板下面的光变少（{c0[0]:.3f} → {c1[0]:.3f}）')
    beam = pg.evaluate("""() => { const c = document.querySelector('[data-plate] canvas[class*=_beams_]'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 12) n++; return n / (d.length / 16); }""")
    ok(beam is not None and beam > 0.08, f'{tag} 记录·钢板：孔前有光束（光束画布 {0 if beam is None else beam * 100:.0f}% 有光）')
    snap = "() => { const c = document.querySelector('[data-plate] canvas[class*=_beams_]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; }"
    f0 = pg.evaluate(snap); pg.wait_for_timeout(400); f1 = pg.evaluate(snap)
    ok(f0 != f1, f'{tag} 记录·钢板：光束里的浮尘在飘')
    pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 0)'); pg.evaluate('document.querySelector("[class*=_body_]").style.paddingTop = ""'); pg.wait_for_timeout(500)
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'log-plate-rest.png'))
    # 交互（M04）：默认选中最近练过的一天；按住横向拖吸到别的日子（读数行跟着换、孔口有光晕）；左右键换日子；「查看」进那天的训练
    rd = lambda: pg.locator('[data-plate] [class*=_rdText_] b').first.inner_text()
    first_row = pg.locator('button[class*=_session_]').first.inner_text().split('\n')
    d0 = rd()
    ok(d0.startswith(f"{first_row[0].split('/')[0]}月{first_row[0].split('/')[1]}日"), f'{tag} 记录·钢板：默认选中最近练过的一天，读数行写那天（{d0} / {first_row[0]}）')
    ok(pg.locator('[data-plate] [class*=_focus_]').count() == 1, f'{tag} 记录·钢板：选中的孔有一圈光晕')
    fb = pg.locator('[data-plate] figure').bounding_box(); seen = set()
    pg.mouse.move(fb['x'] + fb['width'] * 0.9, fb['y'] + fb['height'] * 0.55); pg.mouse.down()
    for k in range(12):
        pg.mouse.move(fb['x'] + fb['width'] * (0.9 - 0.07 * k), fb['y'] + fb['height'] * 0.55, steps=2); pg.wait_for_timeout(60); seen.add(rd())
    pg.mouse.up(); pg.wait_for_timeout(300)
    ok(len(seen) >= 3 and rd() != d0, f'{tag} 记录·钢板：横向拖吸到一个个练过的日子（{len(seen)} 个），读数行跟着换')
    pg.locator('[data-plate] figure').focus(); before = rd(); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(200)
    ok(rd() != before, f'{tag} 记录·钢板：右键换到下一个练过的日子（{before} → {rd()}）')
    picked = rd(); click(pg, pg.get_by_role('button', name=re.compile(r'^查看.+的训练$'))); pg.wait_for_selector('[data-drill-ready=logdetail]'); pg.wait_for_timeout(1000)
    m = re.match(r'(\d+)月(\d+)日', picked)
    ok('/log/' in pg.url and pg.get_by_role('heading', name=re.compile(f'^{m.group(1)}月{m.group(2)}日')).count() >= 1, f'{tag} 记录·钢板：「查看」进到选中那天的训练（{picked}）')
    # 减少动态效果：浮尘不动（光束是静止的一张图），呼吸光晕不动
    ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True, reduced_motion='reduce'); rp = ctx.new_page()
    rp.goto(f'{args.base}/log?scenario=plain-prescription'); rp.wait_for_selector('h1'); rp.wait_for_timeout(900)
    g0 = rp.evaluate(snap); rp.wait_for_timeout(400); g1 = rp.evaluate(snap)
    ok(g0 == g1, f'{tag} 记录·钢板：减少动态效果时浮尘不动')
    ok(rp.evaluate('[...document.querySelectorAll("[data-plate] *")].flatMap((e) => e.getAnimations()).length') == 0, f'{tag} 记录·钢板：减少动态效果时没有 CSS 动画（光晕不呼吸）')
    ctx.close()
    # 训练详情（P08）：点一行进去，标题 / 汇总 / 动作卡与那一行一致；点动作卡头进曲线页再返回；返回记录页还原滚动位置；共享名飞进飞出
    pg.goto(f'{args.base}/log?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
    pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 420)'); pg.wait_for_timeout(400)
    row = pg.locator('button[class*=_session_]').nth(2)
    rt = row.inner_text().split('\n'); r_date, r_wd = rt[0], rt[1]; r_sets = int(re.search(r'(\d+) 组', row.inner_text()).group(1)); r_pr = 'PR' in row.inner_text()
    pg.evaluate('''() => { window.__vt = []; const o = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => { const vt = o(cb); vt.ready.then(() => { window.__vt.push([...document.getAnimations()].map((a) => (a.effect && a.effect.pseudoElement) || '')); }, () => {}); return vt; }; }''')
    click(pg, row); pg.wait_for_selector('[data-drill-ready=logdetail]'); pg.wait_for_timeout(1200)
    ok('/log/' in pg.url, f'{tag} 详情：点一行进 /log/:id')
    vts = pg.evaluate('window.__vt') or []
    ok(any(all(any(k in x for x in v) for k in ('x-drill-name', 'x-drill-num')) for v in vts), f'{tag} 详情：进入时日期、部位作为共享元素飞成标题、副标题')
    mon, day = r_date.split('/')
    ok(pg.locator('h1').first.inner_text().startswith(f'{mon}月{day}日') and r_wd in pg.locator('h1').first.inner_text(), f'{tag} 详情：标题是那一天（{pg.locator("h1").first.inner_text()}）')
    ok(pg.get_by_role('group', name='本次汇总').inner_text().replace('\n', ' ').count(str(r_sets)) >= 1 and f'{r_sets}' in pg.get_by_role('group', name='本次汇总').inner_text(), f'{tag} 详情：汇总里的组数 = 记录页那一行的组数（{r_sets}）')
    ok(pg.locator('section[aria-label]').count() >= 3 and pg.get_by_role('button', name=re.compile(r'^查看.+的进步曲线$')).count() >= 3, f'{tag} 详情：每个动作一张卡，卡头可进曲线页')
    ok((pg.get_by_text('新纪录').count() == 1) == r_pr, f'{tag} 详情：有 PR 才有「新纪录」一行（行上{"有" if r_pr else "没有"} PR 标）')
    ok(pg.get_by_text('热身').count() >= 1 and pg.get_by_text('第 1 组').count() >= 1, f'{tag} 详情：热身组和工作组分开写')
    ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 详情：无横向溢出')
    small = pg.evaluate(AUDIT); ok(not small, f'{tag} 详情：命中区都 ≥ 48 {small[:3]}')
    ok(pg.get_by_role('navigation', name='主导航').count() == 0, f'{tag} 详情：子页没有 Tab 导航')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'log-detail.png'))
    # 点动作卡头 → 曲线页 → 返回回到这次训练（不是增量页）
    first_url = pg.url
    click(pg, pg.get_by_role('button', name=re.compile(r'^查看.+的进步曲线$')).first); pg.wait_for_selector('text=下次目标'); pg.wait_for_timeout(900)
    ok('/gains/' in pg.url, f'{tag} 详情：点动作卡头进它的曲线页')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_selector('[data-drill-ready=logdetail]'); pg.wait_for_timeout(700)
    ok(pg.url == first_url, f'{tag} 详情：从曲线页返回回到这次训练')
    # 返回记录页：滚动位置还在，日期 / 部位作为共享元素飞回那一行，放完后不留共享名
    pg.evaluate('window.__vt = []')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_selector('[data-drill-ready=log]'); pg.wait_for_timeout(500)
    ok(any(all(any(k in x for x in v) for k in ('x-drill-name', 'x-drill-num')) for v in (pg.evaluate('window.__vt') or [])), f'{tag} 详情：返回时日期、部位作为共享元素飞回那一行')
    pg.wait_for_timeout(1800)
    top_back = pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTop')
    ok(abs(top_back - 420) <= 2, f'{tag} 详情：返回记录页后滚动位置还在（420 → {top_back:.0f}）')
    ok(pg.locator('[style*="x-drill"]').count() == 0, f'{tag} 详情：转场放完后记录页里不留共享名（同名不能有两份）')
    # 删除训练（场景里：删掉的记在内存里，所有页面共用）：⋮ → 删除这次训练 → 二次确认；取消不变；确认后回记录页，行没了、周合计和钢板孔数同步变
    pg.goto(f'{args.base}/log?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
    wk0 = pg.evaluate("[...document.querySelectorAll('section[class*=_week_]')].slice(0, 2).map((s) => s.querySelector('[class*=_totals_]').getAttribute('aria-label'))")
    n_rows0 = pg.locator('button[class*=_session_]').count(); holes0 = len(pg.evaluate(PLATE_HOLES))
    first = pg.locator('button[class*=_session_]').first; f_text = first.inner_text(); f_sets = int(re.search(r'(\d+) 组', f_text).group(1))
    click(pg, first); pg.wait_for_selector('[data-drill-ready=logdetail]'); pg.wait_for_timeout(800)
    ok(pg.get_by_role('button', name='更多').count() == 1, f'{tag} 删除：详情右上角有溢出菜单 ⋮')
    click(pg, pg.get_by_role('button', name='更多')); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name='删除这次训练')); pg.wait_for_timeout(500)
    dlg = pg.get_by_role('alertdialog', name='删除这次训练？')
    ok(dlg.count() == 1 and '不能撤销' in dlg.inner_text(), f'{tag} 删除：二次确认对话框，写明重算和「不能撤销」')
    small = pg.evaluate(AUDIT); ok(not small, f'{tag} 删除：对话框里命中区都 ≥ 48 {small[:3]}')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'log-delete-confirm.png'))
    click(pg, dlg.get_by_role('button', name='取消')); pg.wait_for_timeout(500)
    ok(pg.get_by_role('alertdialog').count() == 0 and '/log/' in pg.url, f'{tag} 删除：取消 = 什么都不变，留在详情')
    click(pg, pg.get_by_role('button', name='更多')); pg.wait_for_timeout(400)
    click(pg, pg.get_by_role('button', name='删除这次训练')); pg.wait_for_timeout(400)
    click(pg, pg.get_by_role('alertdialog').get_by_role('button', name='删除', exact=True)); pg.wait_for_selector('[data-drill-ready=log]'); pg.wait_for_timeout(900)
    ok(pg.url.split('?')[0].endswith('/log') and pg.get_by_role('status').filter(has_text='已删除').count() >= 1, f'{tag} 删除：回记录页并有轻提示')
    wk1 = pg.evaluate("[...document.querySelectorAll('section[class*=_week_]')].slice(0, 2).map((s) => s.querySelector('[class*=_totals_]').getAttribute('aria-label'))")
    ok(pg.locator('button[class*=_session_]').count() == n_rows0 - 1, f'{tag} 删除：记录页少一行（{n_rows0} → {pg.locator("button[class*=_session_]").count()}）')
    ok(wk1[0] != wk0[0], f'{tag} 删除：周合计跟着重算（{wk0[0]} → {wk1[0]}）')
    ok(len(pg.evaluate(PLATE_HOLES)) <= holes0, f'{tag} 删除：钢板的孔数不增（{holes0} → {len(pg.evaluate(PLATE_HOLES))}）')
    # 别的页也已重算：增量页的「该加重 / 保持 / 该减重」都还算得出来，不报错
    click(pg, pg.get_by_role('link', name='增量')); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
    ok(pg.get_by_role('heading', name='该加重').count() == 1, f'{tag} 删除：增量页照常重算')
    # 删光：场景里逐个删掉，最后一行删完是空态（钢板没有孔）
    # 训练不存在：有回记录页的出口
    pg.goto(f'{args.base}/log/not-a-session?scenario=plain-prescription'); pg.wait_for_timeout(800)
    ok(pg.get_by_text('这次训练已经不在了').count() == 1 and pg.get_by_role('button', name='回到记录').count() == 1, f'{tag} 详情：训练不存在时有回记录的出口')
    click(pg, pg.get_by_role('button', name='回到记录')); pg.wait_for_timeout(700)
    ok(pg.url.split('?')[0].endswith('/log'), f'{tag} 详情：出口回到记录页（{pg.url.split("5199")[-1]}）')
    # 更早的训练：用「载入演示数据」的真用户（30 周）走真实存储——一次渲染 8 周，点了再展开 8 周
    lp = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    lp.on('pageerror', lambda e: errors.append(f'{tag} log(live) pageerror: {e}'))
    lp.goto(args.base + '/onboarding'); lp.wait_for_selector('button:has-text("跳过")'); lp.wait_for_timeout(600)
    click(lp, lp.get_by_role('button', name='跳过')); click(lp, lp.get_by_role('button', name='下一步')); click(lp, lp.get_by_role('button', name='下一步'))
    click(lp, lp.get_by_role('button', name='载入演示数据 · 练了 30 周的进阶用户')); lp.wait_for_url('**/today**'); lp.wait_for_timeout(900)
    click(lp, lp.get_by_role('link', name='记录')); lp.wait_for_url('**/log**'); lp.wait_for_selector('section[class*=_week_]'); lp.wait_for_timeout(700)
    n0 = lp.locator('section[class*=_week_]').count(); more = lp.get_by_role('button', name=re.compile(r'^更早的训练'))
    ok(n0 == 8 and more.count() == 1, f'{tag} 记录（真存储，30 周）：一次渲染 8 周，底部有「更早的训练」（{n0} 周）')
    lp.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 1e6)'); lp.wait_for_timeout(400)  # 到底：按钮在底部留白里、导航上面
    click(lp, more.first); lp.wait_for_timeout(500)
    n1 = lp.locator('section[class*=_week_]').count()
    ok(n1 == 16, f'{tag} 记录：点「更早的训练」再展开 8 周（{n0} → {n1}）')
    ok(lp.get_by_role('slider', name=re.compile(r'练了 \d+ 天')).count() == 1 and len(lp.evaluate(PLATE_HOLES)) > 0, f'{tag} 记录（真存储）：钢板有孔')
    lp.close()
    # 空态：钢板没有孔、板后不点灯，唯一出路是回今日处方
    open_log('cold-start', 'empty')
    ok(pg.get_by_text('还没有训练记录').count() == 1 and pg.get_by_role('button', name='去今日处方').count() == 1, f'{tag} 记录：没练过 = 空状态，有「去今日处方」')
    ok(pg.evaluate(PLATE_HOLES) == [] and pg.evaluate('document.querySelectorAll("[data-plate] canvas").length') == 0, f'{tag} 记录：空板没有孔、板后不点灯（页面唯一的荧光是「去今日处方」）')
    click(pg, pg.get_by_role('button', name='去今日处方')); pg.wait_for_timeout(700)
    ok('/today' in pg.url, f'{tag} 记录：空态的出口回到今日处方（{pg.url.split("5199")[-1]}）')
    pg.close()


def me_checks(b, w, h):
    """我的（P11）+ 牛龄（P13）+ 消息：成长卡 / 档案四格 / 面板保存 / 导航设置 / 数据确认 / 导出 CSV / 子页往返；真存储（演示数据）里连胜不是 0、未读数、降级说明。"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True, accept_downloads=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} me pageerror: {e}'))
    def page_ok(name):
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} {name}：无横向溢出')
        small = pg.evaluate(AUDIT); ok(not small, f'{tag} {name}：命中区都 ≥ 48 {small[:3]}')
        ok(not pg.evaluate(CRUSH), f'{tag} {name}：滚动区里没有被压扁的块')
    def open_me(path='/me?scenario=plain-prescription'):
        pg.goto(args.base + path); pg.wait_for_selector('h1, [class*=_scroll_]'); pg.wait_for_timeout(900)
    def sheet_of(title):
        return pg.get_by_role('dialog', name=title)
    def tap(loc):
        """页面下半的行会被悬浮导航盖住：先滚到屏幕中间再点"""
        loc.first.evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(250); click(pg, loc)
    # ---- 我的（演示场景）
    pg.goto(args.base + '/me?scenario=plain-prescription'); pg.evaluate('localStorage.clear()'); open_me()
    page_ok('我的')
    ok(pg.get_by_role('heading', level=1, name='我的').count() == 1, f'{tag} 我的：页头是「我的」')
    ok(pg.get_by_role('navigation', name='主导航').count() == 1, f'{tag} 我的：是 Tab 根页，导航在')
    for t in ('训练经验', '单次时长', '可用器械', '体型示意'):
        ok(pg.get_by_role('button', name=re.compile(f'^{t}：')).count() == 1, f'{tag} 我的：档案格「{t}」是一个按钮')
    ok(pg.get_by_role('button', name=re.compile(r'^牛龄 .+，连胜 \d+ 周，本周已练')).count() == 1, f'{tag} 我的：第一屏是成长卡（整张卡是按钮）')
    ok(pg.get_by_role('listitem').filter(has_text='钱包').count() == 0 and pg.get_by_text('会员', exact=True).count() == 0, f'{tag} 我的：钱包 · 商城 / 会员两行还没有页面，不放死路按钮')
    # 页头跟着内容滑走
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, 600)'); pg.wait_for_timeout(500)
    ok(pg.evaluate('document.querySelector("h1").getBoundingClientRect().bottom < 0'), f'{tag} 我的：大标题滑出了屏幕')
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, 0)'); pg.wait_for_timeout(300)
    if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, 'me-plain.png'))
    # 档案面板：时长 +15 → 保存 → 格子上写 75
    click(pg, pg.get_by_role('button', name=re.compile('^单次时长：'))); pg.wait_for_timeout(500)
    ok(sheet_of('单次训练时长').count() == 1, f'{tag} 面板：点档案格弹出对应的底部面板')
    click(pg, pg.get_by_role('button', name='加 15分钟')); click(pg, sheet_of('单次训练时长').get_by_role('button', name='保存')); pg.wait_for_timeout(500)
    ok(sheet_of('单次训练时长').count() == 0 and pg.get_by_role('button', name=re.compile('^单次时长：75')).count() == 1, f'{tag} 面板：保存后面板收起，格子上是 75 分钟')
    # 器械全取消：保存不了 + 行内提示
    click(pg, pg.get_by_role('button', name=re.compile('^可用器械：'))); pg.wait_for_timeout(500)
    for k in range(6): pg.locator('[role=dialog] [role=checkbox][aria-checked=true]').first.click()
    ok(pg.get_by_text('器械至少选一类').count() >= 1 and not sheet_of('可用器械').get_by_role('button', name='保存').is_enabled(), f'{tag} 面板：器械全取消 = 行内提示 + 保存不可用')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    ok(sheet_of('可用器械').count() == 0, f'{tag} 面板：Esc 关闭，什么都没改')
    # 体型 + 体重：写错拒绝，填对保存
    click(pg, pg.get_by_role('button', name=re.compile('^体型示意：'))); pg.wait_for_timeout(500)
    wt = pg.get_by_label('体重（可选）'); wt.fill('7a'); pg.wait_for_timeout(200)
    ok(pg.get_by_text('写成数字，最多一位小数').count() >= 1 and not sheet_of('体型示意').get_by_role('button', name='保存').is_enabled(), f'{tag} 面板：体重写错 = 行内提示 + 保存不可用')
    wt.fill('72'); click(pg, sheet_of('体型示意').get_by_role('button', name='保存')); pg.wait_for_timeout(500)
    ok(pg.get_by_role('button', name=re.compile('^体型示意：男 · 72')).count() == 1, f'{tag} 面板：体重填了，体型格写「男 · 72 kg」')
    # 导航设置立即生效（写进存储）
    sw = pg.get_by_role('switch', name='显示今日进度环')
    ok(sw.get_attribute('aria-checked') == 'true', f'{tag} 设置：今日进度环默认开')
    sw.click(); pg.wait_for_timeout(300)
    ok(sw.get_attribute('aria-checked') == 'false' and pg.evaluate('JSON.parse(localStorage.getItem("milo:v1")).settings.ring') is False, f'{tag} 设置：关掉立即生效并写进存储')
    sw.click(); pg.wait_for_timeout(200)
    tap(pg.get_by_role('button', name=re.compile('^休息结束提示'))); pg.wait_for_timeout(500)
    click(pg, sheet_of('休息结束提示').get_by_role('radio', name=re.compile('^仅描边'))); pg.wait_for_timeout(500)
    ok(sheet_of('休息结束提示').count() == 0 and pg.get_by_role('button', name=re.compile('^休息结束提示')).inner_text().find('仅描边') >= 0, f'{tag} 设置：休息结束提示选「仅描边」→ 面板收起、行上写「仅描边」')
    # 数据：载入 / 清除都先确认，取消什么都不变；导出 CSV 真下载
    tap(pg.get_by_role('button', name=re.compile('^载入示例数据'))); pg.wait_for_timeout(400)
    ok(pg.get_by_role('alertdialog', name='载入示例数据？').count() == 1 and pg.get_by_text('会覆盖现有的训练记录').count() == 1, f'{tag} 数据：载入先二次确认，写明会覆盖')
    click(pg, pg.get_by_role('button', name='取消')); pg.wait_for_timeout(300)
    tap(pg.get_by_role('button', name=re.compile('^清除全部数据'))); pg.wait_for_timeout(400)
    ok(pg.get_by_role('alertdialog', name='清除全部数据？').count() == 1 and pg.get_by_text('不能撤销').count() == 1, f'{tag} 数据：清除先二次确认，写明不能撤销')
    small = pg.evaluate(AUDIT); ok(not small, f'{tag} 数据：确认对话框里命中区都 ≥ 48 {small[:3]}')
    click(pg, pg.get_by_role('button', name='取消')); pg.wait_for_timeout(300)
    ok('/me' in pg.url, f'{tag} 数据：取消 = 留在「我的」')
    with pg.expect_download() as dl:
        tap(pg.get_by_role('button', name=re.compile('^导出 CSV')))
    d = dl.value; path = d.path(); head = open(path, 'rb').read(200)
    ok(d.suggested_filename.startswith('milo-训练记录-') and d.suggested_filename.endswith('.csv'), f'{tag} 导出：下载的文件名 {d.suggested_filename}')
    ok(head.startswith(b'\xef\xbb\xbf') and '日期,开始时间,动作,第几组'.encode() in head, f'{tag} 导出：UTF-8 带 BOM，第一行是表头')
    pg.wait_for_timeout(400); ok(pg.get_by_text(re.compile(r'已导出 \d+ 组训练记录')).count() == 1, f'{tag} 导出：有「已导出 N 组」提示')
    # 子页：成长卡 → 牛龄 → 返回；消息 → 返回（场景里不出未读小点）
    tap(pg.get_by_role('button', name=re.compile('^牛龄 '))); pg.wait_for_url('**/me/level**'); pg.wait_for_timeout(1200)
    ok('scenario=plain-prescription' in pg.url, f'{tag} 牛龄：场景参数带过去了')
    page_ok('牛龄')
    ok(pg.get_by_role('navigation', name='主导航').count() == 0, f'{tag} 牛龄：子页没有 Tab 导航')
    ok(pg.get_by_role('list', name='牛龄五段').locator('li').count() == 5 and pg.locator('[aria-current=step]').count() == 1, f'{tag} 牛龄：5 段名字，当前一段有标记')
    ok(pg.get_by_role('img', name=re.compile(r'^最近 \d+ 周：守约')).count() == 1, f'{tag} 牛龄：最近 N 周点阵是一张图，读屏读汇总')
    for t in ('离下一级', '连胜', '本周', '冻结卡', '成长记录'): ok(pg.get_by_text(t, exact=True).count() >= 1, f'{tag} 牛龄：有「{t}」')
    ok(pg.get_by_text('降级不弹窗，只在这里写明').count() == 1, f'{tag} 牛龄：写明删训练后可能降级')
    if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, 'me-level-plain.png'))
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_url('**/me?**'); pg.wait_for_timeout(600)
    tap(pg.get_by_role('button', name=re.compile('^消息'))); pg.wait_for_url('**/me/messages**'); pg.wait_for_timeout(800)
    page_ok('消息')
    ok(pg.get_by_role('navigation', name='主导航').count() == 0 and pg.locator('[aria-label=未读]').count() == 0, f'{tag} 消息：子页没有 Tab 导航；场景里不画未读小点')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_url('**/me?**'); pg.wait_for_timeout(500)
    # ---- 真存储（载入演示数据）：连胜不是 0、有未读、打开消息后清零、降级说明写进成长记录
    pg.evaluate('localStorage.clear()'); pg.goto(args.base + '/onboarding'); pg.wait_for_selector('button:has-text("跳过")'); pg.wait_for_timeout(600)
    click(pg, pg.get_by_role('button', name='跳过')); click(pg, pg.get_by_role('button', name='下一步')); click(pg, pg.get_by_role('button', name='下一步'))
    click(pg, pg.get_by_role('button', name='载入演示数据 · 练了 30 周的进阶用户')); pg.wait_for_url('**/today**'); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('link', name='我的')); pg.wait_for_url('**/me'); pg.wait_for_timeout(1000)
    page_ok('我的·真存储')
    card = pg.get_by_role('button', name=re.compile('^牛龄 ')).get_attribute('aria-label')
    weeks = int(re.search(r'连胜 (\d+) 周', card).group(1))
    ok(weeks >= 15 and '公牛' in card, f'{tag} 我的·真存储：演示用户不是「连胜 0」：{card.split("，查看")[0]}')
    badge = pg.get_by_role('button', name=re.compile('^消息')).inner_text()
    ok(re.search(r'\d+ 条新', badge) is not None, f'{tag} 我的·真存储：消息行有未读数（{badge.split(chr(10))[-1]}）')
    if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, 'me-live.png'))
    tap(pg.get_by_role('button', name=re.compile('^消息'))); pg.wait_for_url('**/me/messages'); pg.wait_for_timeout(800)
    ok(pg.locator('[aria-label=未读]').count() >= 1, f'{tag} 消息·真存储：这次进来的未读小点照常显示')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_url('**/me'); pg.wait_for_timeout(600)
    ok(re.search(r'\d+ 条新', pg.get_by_role('button', name=re.compile('^消息')).inner_text()) is None, f'{tag} 我的·真存储：看过消息后，未读数没了')
    # 降级说明：存一条，成长记录里有
    pg.evaluate('(() => { const s = JSON.parse(localStorage.getItem("milo:v1")); s.notes = [{ atMs: Date.now(), kind: "demote", text: "连胜 21 周 → 0 周" }]; localStorage.setItem("milo:v1", JSON.stringify(s)); })()')
    pg.goto(args.base + '/me/level'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    ok(pg.get_by_text('删除训练后重新计算').count() == 1 and pg.get_by_text('连胜 21 周 → 0 周').count() == 1, f'{tag} 牛龄·真存储：降级说明写在成长记录里')
    more = pg.get_by_role('button', name=re.compile('^更早的记录'))
    n0 = pg.locator('[class*=_ledger_]').count()
    if more.count(): tap(more); pg.wait_for_timeout(300); ok(pg.locator('[class*=_ledger_]').count() > n0, f'{tag} 牛龄·真存储：点「更早的记录」再展开一批（{n0} → {pg.locator("[class*=_ledger_]").count()}）')
    # 没有历史：牛犊 1 级、「完成第一次训练开始长大」
    pg.goto(args.base + '/me/level?scenario=cold-start'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    ok(pg.get_by_text('完成第一次训练开始长大').count() == 1 and pg.get_by_text('牛犊 · 1 级').count() == 1, f'{tag} 牛龄·没有历史：牛犊 1 级 + 「完成第一次训练开始长大」')
    ok(pg.get_by_text('练完第一次训练，这里会开始记录').count() == 1, f'{tag} 牛龄·没有历史：成长记录是空态')
    pg.goto(args.base + '/me?scenario=cold-start'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    ok(pg.get_by_role('button', name=re.compile('^导出 CSV')).is_disabled(), f'{tag} 我的·没有历史：导出 CSV 不可用，写明「还没有训练记录」')
    pg.close()

widths = [args.width] if args.width else list(SIZES)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    for w in widths:
        W, H = SIZES[w]
        if 'flow' in only: run(b, W, H, w == 360)
        if 'story' in only: story_checks(b, W, H)
        if 'deload' in only: deload_checks(b, W, H)
        if 'gains' in only: gains_checks(b, W, H)
        if 'log' in only: log_checks(b, W, H)
        if 'me' in only: me_checks(b, W, H)
    # /demo 电脑版（只和 360 宽的那一份一起跑，不分宽度）
    if 'demo' in only and 360 in widths:
        d = b.new_page(viewport={'width': 1440, 'height': 900})
        d.on('pageerror', lambda e: errors.append(f'demo pageerror: {e}'))
        d.goto(args.base + '/demo'); d.wait_for_selector('iframe'); d.wait_for_timeout(1500)
        ok(d.locator('iframe').count() == 1, '/demo 电脑版：手机里是 App')
        if not args.no_shots: d.screenshot(path=os.path.join(OUT, 'demo-desk.png'))
    b.close()

print(f'\n{"失败 " + str(len(errors)) + " 项" if errors else "全部通过"}')
for e in errors: print('  - ' + e)
sys.exit(1 if errors else 0)
