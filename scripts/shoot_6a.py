#!/usr/bin/env python3
"""阶段 6a 门禁（运行时）：演示里展示的全部交互，一路真点，每一步都查。
流程：故事 8 幕 → 建档 3 步 → 载入演示数据 → 首页处方（含「为什么是这些」）→ 开始训练（就在首页打卡）→ 打卡 → 休息胶囊展开
      → 点组行改数（键盘面板）→ 换动作 → 清空重量 →「填重量」→ 键盘输入 → 打卡 → 身体页（训练中）→ 结束 → 结算 → 今天已练完 → 再练一次；外加 /demo 电脑版。
每一步检查：地址；360 宽无横向溢出；滚动区里没有被压扁的块；命中区（scripts/lib/hit_audit.js，看得见、能点的都 ≥ 48 × 48）；无页面错误。
两种尺寸：360 × 800（设计基准，出截图）和 412 × 915（常见安卓真机，只查不截）。
截图：screenshots/stage6a/<序号>-<步骤>.png（360 × 800 @2x）、story-<幕>.png、demo-desk.png。
用法：先 npx vite --port 5199 --host 127.0.0.1，再 python3 scripts/shoot_6a.py
提速（2026-10-06）：
  - 默认两个宽度各开一个进程同时跑（--serial 关掉），总时间约减半；
  - --no-shots 不再等故事 8 幕自己播完（只为截图）；
  - --only 只跑某几类：flow（主流程）、story、deload、gains、demo，逗号分隔——改哪页只跑哪页，提交前再跑一遍完整的；
  - --width 360|412 只跑一种宽度（并行时内部用）。"""
import argparse, os, re, subprocess, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
ap.add_argument('--no-shots', action='store_true')
ap.add_argument('--only', default='', help='flow,story,deload,gains,demo 逗号分隔；默认全部')
ap.add_argument('--width', type=int, choices=[360, 412], help='只跑一种宽度（并行时内部用）')
ap.add_argument('--serial', action='store_true', help='两个宽度不并行')
args = ap.parse_args()
SIZES = {360: (360, 800), 412: (412, 915)}
ALL = ['flow', 'story', 'deload', 'gains', 'demo']
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
    # 页头 C：首页（非训练态）页头在滚动区里；滑走大标题时细栏出现（内容不够长就滚不到，所以只核对「大标题走了 ⇔ 细栏在」的一致性）
    ok(pg.evaluate(SLIM) is not None and pg.evaluate(SLIM)['op'] == 0, f'{tag} 页头 C·首页：在顶部时细栏不可见')
    pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, 500); pg.wait_for_timeout(600)
    hb, sl = pg.evaluate("document.querySelector('h1').getBoundingClientRect().bottom"), pg.evaluate(SLIM)
    ok(sl is not None and ((sl['op'] > 0.95 and sl['txt'] in ('今日处方', '今天')) if hb <= 0 else sl['op'] < 1), f'{tag} 页头 C·首页：大标题滑走（下沿 {hb:.0f}）⇔ 细栏出现 {sl}')
    pg.mouse.wheel(0, -1000); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name='为什么是这些')); step('why', None, 1200)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name='开始训练')); step('train', '/today', 1200)
    ok(pg.get_by_role('button', name='打卡 · 第 1 组').count() == 1, f'{tag} 开始后留在首页，主按钮是「打卡 · 第 1 组」')
    ok(pg.locator('[class*=_slim_]').count() == 0, f'{tag} 页头 C：训练中不收缩（有「结束」和进度，页头钉在顶上）')
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
    # 切到身体页：计时胶囊借共享元素飞进导航滑块（点导航，不是直接改地址）
    # 转场一就绪就记下转场层里有哪些共享元素（不靠睡眠时间采样，时序抖动也不会漏）
    pg.evaluate('''() => { window.__vt = null; const o = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => { const vt = o(cb); vt.ready.then(() => { window.__vt = [...document.getAnimations()].map((a) => (a.effect && a.effect.pseudoElement) || ''); }, () => {}); return vt; }; }''')
    click(pg, pg.get_by_role('link', name='身体')); pg.wait_for_function('window.__vt !== null', timeout=5000)
    fly = pg.evaluate('window.__vt')
    ok(any('x-rest-ring' in x for x in fly), f'{tag} 切 Tab：只有进度条（x-rest-ring）作为共享元素飞进导航滑块')
    ok(pg.locator('nav [style*="x-rest-timer"]').count() == 0, f'{tag} 切 Tab：导航滑块不带整颗胶囊的共享名（不会盖住图标和文字）')
    step('body-training', '/body', 2500)
    ok('休息剩余' in navlabel() or pg.get_by_role('button', name='组间休息剩余').count() == 0, f'{tag} 身体页：休息计时在导航滑块上')
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
    产品小样幕里身体页演示在跑、两张卡先后弹入（相隔很短）、卡片和文字不重叠。"""
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
    ok(pg.locator('[role=option]').count() >= 4, f'{tag} 故事第 7 幕：身体页演示的胶囊列在')
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

SLIM = """() => { const e = document.querySelector('[class*=_slim_]'); if (!e) return null; const r = e.getBoundingClientRect();
  return { op: +(+getComputedStyle(e).opacity).toFixed(2), top: Math.round(r.top), h: Math.round(r.height), txt: e.textContent }; }"""


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
    ok(pg.get_by_text('近 4 周练了').count() == 1 and pg.get_by_text('个在涨').count() == 1 and pg.get_by_text('次破纪录').count() == 1, f'{tag} 增量：摘要每个数都带单位（个动作 / 个在涨 / 次破纪录）')
    sparks = pg.evaluate('''() => [...document.querySelectorAll('svg[class*=spark]')].filter((e) => { const r = e.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }).map((e) => Math.round(e.getBoundingClientRect().left))''')
    ok(len(sparks) >= 3 and max(sparks) - min(sparks) <= 1, f'{tag} 增量：每行的小曲线从同一条竖线开始 {sparks}')
    top0 = pg.locator('h1').first.bounding_box()['y']
    slim0 = pg.evaluate(SLIM)
    ok(slim0 is not None and slim0['op'] == 0, f'{tag} 页头 C·增量：在顶部时细栏不可见 {slim0}')
    pg.mouse.move(w / 2, h / 2); pg.mouse.wheel(0, 700); pg.wait_for_timeout(600)
    top1 = pg.locator('h1').first.bounding_box()['y']
    ok(top0 > 0 and top1 < 0, f'{tag} 增量：下滑后页头跟着滑走，不钉在顶上（{top0:.0f} → {top1:.0f}）')
    slim1 = pg.evaluate(SLIM)
    ok(slim1 is not None and slim1['op'] > 0.95 and slim1['h'] == 44 and slim1['top'] == 0 and slim1['txt'] == '增量', f'{tag} 页头 C·增量：大标题滑走后顶上出现 44 高的细标题栏 {slim1}')
    chip_y = pg.get_by_role('button', name='全部').first.bounding_box()['y']
    ok(0 <= chip_y < 120 and chip_y >= 44, f'{tag} 增量：部位筛选滑到顶后贴在细栏下面（y={chip_y:.0f}）')
    pg.mouse.wheel(0, -3000); pg.wait_for_timeout(600)
    chips = pg.get_by_role('button', name='胸')
    ok(chips.count() == 1, f'{tag} 增量：有部位筛选')
    click(pg, chips); pg.wait_for_timeout(700)
    ok(chips.first.get_attribute('aria-pressed') == 'true', f'{tag} 增量：选中「胸」')
    ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 增量·筛选后：无横向溢出')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'gains-chest.png'))
    # 页头 C：身体页同样（页头在滚动区里，大标题滑走后细栏出现）。屏高 915 时身体页几乎不用滚，所以这一段用矮屏（640）保证有得滚
    pg.set_viewport_size({'width': w, 'height': 640})
    pg.goto(f'{args.base}/body?scenario=done-today'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
    b0 = pg.evaluate(SLIM)
    ok(b0 is not None and b0['op'] == 0, f'{tag} 页头 C·身体：在顶部时细栏不可见 {b0}')
    pg.mouse.move(w / 2, 320); pg.mouse.wheel(0, 400); pg.wait_for_timeout(600)
    b1 = pg.evaluate(SLIM)
    ok(b1 is not None and b1['op'] > 0.95 and b1['h'] == 44 and b1['txt'] == '身体', f'{tag} 页头 C·身体：大标题滑走后出现细栏 {b1}')
    pg.set_viewport_size({'width': w, 'height': h})
    # 曲线页（P10）：点一行进去，大数字和增量页那一行是同一个数；点明细的一行换成那天；返回后筛选和滚动位置还在
    pg.goto(f'{args.base}/gains?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(700)
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

widths = [args.width] if args.width else list(SIZES)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    for w in widths:
        W, H = SIZES[w]
        if 'flow' in only: run(b, W, H, w == 360)
        if 'story' in only: story_checks(b, W, H)
        if 'deload' in only: deload_checks(b, W, H)
        if 'gains' in only: gains_checks(b, W, H)
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
