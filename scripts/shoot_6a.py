#!/usr/bin/env python3
"""阶段 6a 门禁（运行时）：演示里展示的全部交互，一路真点，每一步都查。
流程：故事 8 幕 → 建档 3 步 → 载入演示数据 → 首页处方（含「为什么是这些」）→ 开始训练（就在首页打卡）→ 打卡 → 休息胶囊（只是计时）
      → 点组行改数（键盘面板）→ 换动作 → 清空重量 →「填重量」→ 键盘输入 → 打卡 → 容量页（训练中）→ 结束 → 结算 → 今天已练完 → 再练一次；外加 /demo 电脑版。
每一步检查：地址；360 宽无横向溢出；滚动区里没有被压扁的块；命中区（scripts/lib/hit_audit.js，看得见、能点的都 ≥ 48 × 48）；无页面错误。
两种尺寸：360 × 800（设计基准，出截图）和 412 × 915（常见安卓真机，只查不截）。
截图：screenshots/stage6a/<序号>-<步骤>.png（360 × 800 @2x）、story-<幕>.png、demo-desk.png。
用法：先 npx vite --port 5199 --host 127.0.0.1，再 python3 scripts/shoot_6a.py
提速（2026-10-06）：
  - 默认两个宽度各开一个进程同时跑（--serial 关掉），总时间约减半；
  - --no-shots 不再等故事 8 幕自己播完（只为截图）；
  - --only 只跑某几类：flow（主流程）、story、deload、gains、log、me、shop（钱包与商城）、demo，逗号分隔——改哪页只跑哪页，提交前再跑一遍完整的；
  - --width 360|412 只跑一种宽度（并行时内部用）。"""
import argparse, json, io, os, re, subprocess, sys, tempfile, time, traceback, urllib.request
from concurrent.futures import ThreadPoolExecutor
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium'))
ap.add_argument('--no-shots', action='store_true')
ap.add_argument('--only', default='', help='flow,story,deload,gains,log,me,shop,demo 逗号分隔；默认全部')
ap.add_argument('--width', type=int, choices=[360, 412], help='只跑一种宽度（并行时内部用）')
ap.add_argument('--serial', action='store_true', help='不并行，在一个进程里按顺序跑（调试用）')
ap.add_argument('--worker', action='store_true', help='并行时的子进程（内部用）')
ap.add_argument('--failed', action='store_true', help='只重跑上一次失败的「类别 × 宽度」')
ap.add_argument('--pace', type=float, default=float(os.environ.get('GATE_PACE', '1')), help='固定等待（动画落定、页面加载）的倍数；生产构建上 0.5 够用')
ap.add_argument('--timeout', type=int, default=8000, help='单步等待上限（毫秒）；卡住的步骤 8 秒就报错，不再等 30 秒')
args = ap.parse_args()
SIZES = {360: (360, 800), 412: (412, 915)}
ALL = ['flow', 'story', 'deload', 'gains', 'log', 'me', 'shop', 'pro', 'light', 'demo']
only = [x for x in args.only.split(',') if x] or ALL
if any(x not in ALL for x in only): sys.exit(f'--only 只能是 {",".join(ALL)}')

# 并行（2026-10-07 提速）：每个「类别 × 宽度」一个进程（各自的浏览器、各自的本机存储，互不干扰），按 CPU 数并发；
# 只打印失败的那几份完整输出，最后给出只重跑失败项的命令（也可以直接 --failed）。
FAILED_FILE = os.path.join(tempfile.gettempdir(), 'milo-gate-failed.json')
if args.failed:
    try: jobs = [tuple(j) for j in json.load(open(FAILED_FILE))]
    except Exception: sys.exit('没有上一次的失败记录')
    if not jobs: sys.exit('上一次全部通过，没有要重跑的')
else:
    jobs = [(c, w) for w in ([args.width] if args.width else SIZES) for c in only if not (c == 'demo' and w != 360)]
def server_up():
    try: urllib.request.urlopen(args.base, timeout=2); return True
    except Exception: return False
if not args.worker and not server_up():
    # 本机开发服务器没开（或容器重启后没了）：自动起一个，最多等 30 秒
    if '127.0.0.1:5199' in args.base or 'localhost:5199' in args.base:
        print('开发服务器没开，自动启动 vite :5199 …')
        subprocess.Popen(['npx', 'vite', '--port', '5199', '--host', '127.0.0.1'], cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'),
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
        for _ in range(60):
            if server_up(): break
            time.sleep(0.5)
    if not server_up(): sys.exit(f'连不上 {args.base}：先 npx vite --port 5199 --host 127.0.0.1')
if not args.worker and not args.serial:
    t0 = time.time()
    base = [sys.executable, os.path.abspath(__file__), '--base', args.base, '--chromium', args.chromium, '--worker', '--pace', str(args.pace), '--timeout', str(args.timeout)] + (['--no-shots'] if args.no_shots else [])
    def one(job):
        c, w = job; t = time.time()
        pr = subprocess.run(base + ['--only', c, '--width', str(w)], capture_output=True, text=True)
        took[job] = time.time() - t
        return job, pr.returncode, pr.stdout + pr.stderr
    took = {}
    # 最慢的先跑，墙钟时间 ≈ 最慢那一份
    slow = ['flow', 'gains', 'log', 'shop', 'me', 'pro', 'light', 'story', 'deload', 'demo']
    jobs = sorted(jobs, key=lambda j: slow.index(j[0]) if j[0] in slow else 99)
    with ThreadPoolExecutor(max_workers=max(2, os.cpu_count() or 2)) as ex:
        results = list(ex.map(one, jobs))
    bad = [(job, out) for job, code, out in results if code]
    passed = sum(out.count('  ✓ ') for _, _, out in results)
    for (c, w), out in bad:
        print(f'===== ✗ {c} · {w} 宽 =====')
        print('\n'.join(l for l in out.splitlines() if '  ✓ ' not in l).strip())
    json.dump([list(j) for j, _ in bad], open(FAILED_FILE, 'w'))
    print('各份用时：' + ' · '.join(f'{c}{w} {t:.0f}s' for (c, w), t in sorted(took.items(), key=lambda x: -x[1])))
    print(f'\n{len(jobs) - len(bad)} / {len(jobs)} 份通过 · {passed} 项检查 · 用时 {time.time() - t0:.0f} 秒')
    if bad:
        print('只重跑失败项：python3 scripts/shoot_6a.py --no-shots --failed')
        print('有失败项（见上）')
    else:
        print('全部通过')
    sys.exit(1 if bad else 0)

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

def until(pg, js, ms=4000):
    """等到条件成立（动画放完、元素卸掉）就往下走，不睡固定时长；超时返回 False，交给 ok() 报错"""
    try: pg.wait_for_function(js, timeout=ms); return True
    except Exception: return False

SETTLED = "() => document.getAnimations().every((a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity)"
def settle(pg, ms=3000):
    """等页面上有限次的动画都放完（无限循环的呼吸光、扫光不算），再量命中区 / 位置"""
    return until(pg, SETTLED, ms)

def audit(pg):
    settle(pg); return pg.evaluate(AUDIT)

def click(pg, loc):
    """底部固定的按钮 Playwright 会判成「在视口外」，按坐标点"""
    loc = loc.first
    loc.wait_for()
    # 先滚到屏幕中间：贴着屏幕底的元素会被悬浮导航 / 固定按钮盖住（2026-10-07 连着踩了三次）；固定在屏幕上的元素滚不动，原地不变
    loc.evaluate('e => { const r = e.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight * 0.8) e.scrollIntoView({ block: "center" }); }')
    pg.wait_for_timeout(60)
    bb = loc.bounding_box(); pg.mouse.click(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)

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
        small = audit(pg)
        ok(not small, f'{tag} {name}：命中区都 ≥ 48 {small[:3]}')
        # 走查 1（2026-10-08，DESIGN §9.6 第 17 条）：App 里不出现「演示」
        ok(not pg.evaluate('document.body.innerText.includes("演示")'), f'{tag} {name}：页面上没有「演示」字样')
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
    click(pg, pg.get_by_role('button', name='载入示例数据 · 练了 30 周的进阶用户')); step('today', '/today', 2000)
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
    # 走查 1（2026-10-08）：休息只保留小胶囊——是计时状态（role=timer），不是按钮，点它不展开面板
    ok(pg.get_by_role('timer', name=re.compile('^组间休息剩余')).count() == 1 and pg.get_by_role('button', name=re.compile('^组间休息剩余')).count() == 0, f'{tag} 休息胶囊只是计时状态，不可点、不展开')
    # 失败时要看得出发生了什么：记下点击、面板出现 / 消失的时间线
    pg.evaluate('''() => { window.__trace = []; const t0 = performance.now(), log = (m) => window.__trace.push(Math.round(performance.now() - t0) + 'ms ' + m);
      document.addEventListener('click', (e) => { const who = e.target.closest('[aria-label]')?.getAttribute('aria-label') || e.target.className || e.target.tagName;
        log('click ' + who + ' 转场中=' + document.documentElement.matches(':active-view-transition') + ' 坐标处=' + document.elementFromPoint(e.clientX, e.clientY)?.tagName); }, true);
      new MutationObserver((ms) => ms.forEach((m) => { m.addedNodes.forEach((n) => n.nodeType === 1 && n.matches?.('[role=dialog],[class*=scrim]') && log('出现 ' + n.className)); m.removedNodes.forEach((n) => n.nodeType === 1 && n.matches?.('[role=dialog],[class*=scrim]') && log('消失 ' + n.className)); })).observe(document.body, { childList: true, subtree: true }); }''')
    click(pg, pg.get_by_role('button', name='第 2 组')); step('editor', None, 1000)
    # 走查 1（DESIGN §9.6 第 15 条）：键盘面板按内容高打开，面板里不出滚动；标题只放动作名，「第 N 组」在说明行
    sc = pg.evaluate('(() => { const d = document.querySelector("section[role=dialog]"); return [d.scrollHeight, d.clientHeight]; })()')
    ok(sc[0] <= sc[1] + 1, f'{tag} 改数面板：不出滚动（{sc[0]} / {sc[1]}）')
    ok('组' not in pg.locator('section[role=dialog] h2').inner_text(), f'{tag} 改数面板：标题只放动作名')
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
    ok('休息剩余' in navlabel() or pg.get_by_role('timer', name=re.compile('^组间休息剩余')).count() == 0, f'{tag} 容量页：休息计时在导航滑块上')
    pg.goto(args.base + '/today'); pg.wait_for_timeout(1200)
    # 6e：页头「暂停」→ 暂停面板（暂停 / 结束并结算）→ 还有没打的组再确认一次
    click(pg, pg.get_by_role('button', name='暂停', exact=True)); pg.wait_for_selector('[role=dialog][aria-label="暂停训练？"]'); step('pause-sheet')
    click(pg, pg.get_by_role('dialog', name='暂停训练？').get_by_role('button', name='结束并结算')); pg.wait_for_selector('[role=alertdialog]'); step('end-confirm')
    click(pg, pg.locator('[role=alertdialog]').get_by_role('button', name='结束并结算')); pg.wait_for_selector('text=练完了'); step('summary', '/summary/', 2000)
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
    small = audit(pg)
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
        small = audit(pg)
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
    heads.nth(1).evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(300)
    click(pg, heads.nth(1)); pg.wait_for_timeout(120)
    mid = body_h(1); pg.wait_for_timeout(900)
    ok(heads.nth(1).get_attribute('aria-expanded') == 'true' and 0 < mid < body_h(1), f'{tag} 增量·分组：点组头展开，高度是过渡过去的（{mid:.0f} → {body_h(1):.0f}）')
    heads.nth(0).evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(300)
    click(pg, heads.nth(0)); pg.wait_for_timeout(900)
    ok(heads.nth(0).get_attribute('aria-expanded') == 'false' and body_h(0) < 1, f'{tag} 增量·分组：再点组头收起')
    # 走查 1（DESIGN §9.6 第 15 条）：分组都收起、内容不足一屏时页面不能滚（不为了贴顶把滚动区撑高）
    click(pg, heads.nth(1)); pg.wait_for_timeout(900)
    roll = pg.locator('[class*=_scroll_]').first.evaluate('e => { e.scrollTo(0, 0); const c = e.firstElementChild ? [...e.children].reduce((m, x) => Math.max(m, x.getBoundingClientRect().bottom), 0) - e.getBoundingClientRect().top : 0; return [e.scrollHeight, e.clientHeight, Math.round(c)]; }')
    ok(roll[2] > roll[1] or roll[0] <= roll[1] + 1, f'{tag} 增量·分组全收起：内容不足一屏就不能滚（滚动高 {roll[0]} / 可见 {roll[1]} / 内容 {roll[2]}）')
    click(pg, heads.nth(1)); pg.wait_for_timeout(900)   # 还原：第 2 组展开，后面的断言照旧
    click(pg, heads.nth(0)); pg.wait_for_timeout(900)
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, 0)'); pg.wait_for_timeout(400)
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
    # 容量页（2026-10-06 用户）：半身人体头到脚完整、常态胶囊缩 1/3、换卡一律从左往右；走查 1 #12 #29（2026-10-09）：人体右移到手碰到胶囊、常态无引线、胶囊长成浮层（M02）
    pg.goto(f'{args.base}/body?scenario=plain-prescription'); pg.wait_for_selector('[role=option]'); pg.wait_for_timeout(1500)
    fig = pg.evaluate("""() => { const f = document.querySelector('svg[class*=_thermal_]').getBoundingClientRect(), st = f && document.querySelector('[class*=_figureClip_]').getBoundingClientRect();
      const cap = Math.min(...[...document.querySelectorAll('[role=option]')].map((e) => e.getBoundingClientRect().left));
      return { f: [f.left, f.top, f.right, f.bottom].map(Math.round), st: [st.left, st.top, st.right, st.bottom].map(Math.round), cap: Math.round(cap) }; }""")
    ok(fig['f'][1] >= fig['st'][1] - 1 and fig['f'][3] <= fig['st'][3] + 1 and abs(fig['f'][0] - fig['st'][0]) <= 1 and fig['f'][2] <= fig['cap'] + 2, f'{tag} 容量：人体左缘贴页面边距、裁到露出完整腹肌、手不越过胶囊列、头到脚都在舞台里 {fig}')
    ok(pg.locator('svg[class*=_leaders_]').count() == 0, f'{tag} 容量：常态不画引线')
    cb = pg.locator('[role=option]').nth(3).bounding_box(); pg.mouse.move(cb['x'] + cb['width'] / 2, cb['y'] + cb['height'] / 2); pg.mouse.down()
    until(pg, "() => document.querySelectorAll('svg[class*=_leaders_] polyline').length > 0", 2500); pg.wait_for_timeout(200)
    held = pg.evaluate("document.querySelectorAll('svg[class*=_leaders_] polyline').length")
    glow = pg.evaluate("getComputedStyle(document.querySelector('[role=option][aria-selected=true]')).boxShadow")
    pg.mouse.up(); pg.wait_for_timeout(1200)
    ok(held == 1 and pg.locator('svg[class*=_leaders_]').count() == 0, f'{tag} 容量：按住胶囊才出一条折线引线、松手后消失（按住时 {held} 条）')
    ok(glow.count('rgb') >= 3, f'{tag} 容量：放大的胶囊背后有泛光 {glow[:60]}')
    fb = pg.locator('svg[class*=_thermal_]').bounding_box()
    pg.mouse.move(fb['x'] + fb['width'] * 0.7, fb['y'] + fb['height'] * 0.75); pg.mouse.down(); pg.mouse.move(fb['x'] + fb['width'] * 0.1, fb['y'] + fb['height'] * 0.76, steps=6); pg.mouse.up(); pg.wait_for_timeout(300)
    ok(pg.get_by_role('radio', name='背面').get_attribute('aria-checked') == 'true' and pg.locator('[role=dialog]').count() == 0, f'{tag} 容量：人体上往左滑切到背面（不误开详情）')
    pg.wait_for_timeout(1200); pg.get_by_role('radio', name='正面').click(); pg.wait_for_timeout(1500)
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
    ok(any('x-fluid-' in x for x in vt) and any('x-title-' in x for x in vt) and any('x-fscrim' in x for x in vt), f'{tag} 容量·M02：胶囊原地长成肌头详情浮层（胶囊、名称、遮罩各自是共享元素）')
    pg.wait_for_timeout(900)
    ok(pg.locator('[role=option][style*="view-transition-name"]').count() == 0, f'{tag} 容量·M02：浮层开着时胶囊不带共享名（同名不能有两份）')
    pb = pg.locator('[role=dialog]').bounding_box()
    ok(pb['y'] + pb['height'] <= h - 8 and pb['y'] >= 8, f'{tag} 容量·M02：详情是浮层，不是贴底的抽屉 {pb}')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'volume-sheet.png'))
    click(pg, pg.get_by_role('button', name='关闭'))
    ok(until(pg, '() => !document.querySelector(\'[role=dialog]\') && !document.querySelector(\'[style*="view-transition-name"]\')'), f'{tag} 容量·M02：关闭后缩回胶囊，转场放完不留共享名')
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
    # 记录页按月收起（2026-10-09）后默认一屏多一点：先展开上一个月，页面才够长
    click(pg, pg.get_by_role('button', name=re.compile(r'^\d+ 月')).nth(1)); pg.wait_for_timeout(700)
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, e.scrollHeight)'); pg.wait_for_timeout(700)
    ok(btt.count() == 1 and float(btt.evaluate('e => getComputedStyle(e).opacity')) > 0.95, f'{tag} 回到顶端：滚过一屏出现')
    settle(pg); bb = btt.bounding_box(); nav_top = pg.get_by_role('navigation', name='主导航').bounding_box()['y']
    ok(round(bb['width']) >= 48 and round(bb['height']) >= 48 and bb['y'] + bb['height'] <= nav_top, f'{tag} 回到顶端：命中 48、在导航上方 {bb}')
    if not args.no_shots: pg.screenshot(path=os.path.join(OUT, 'back-to-top.png'))
    click(pg, btt)
    ok(until(pg, '() => document.querySelector(\'[class*=_scroll_]\').scrollTop < 2'), f'{tag} 回到顶端：点了滚回顶')
    ok(pg.get_by_role('button', name='回到顶端').count() == 0, f'{tag} 回到顶端：回到顶后收起')
    # 曲线页（P10）：点一行进去，大数字和增量页那一行是同一个数；点明细的一行换成那天；返回后筛选和滚动位置还在
    pg.goto(f'{args.base}/gains?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(700)
    for i in range(pg.locator('button[aria-expanded=false]').count()):   # 展开全部组，进最后一行
        hd = pg.locator('button[aria-expanded=false]').first; hd.evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(300); click(pg, hd); pg.wait_for_timeout(700)
    rows_all = pg.get_by_role('button', name=re.compile(r'^查看.+的进步曲线$'))
    rows_all.last.evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(500)   # 滚到屏幕中间：贴底会被悬浮导航盖住
    top_before = pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTop')
    row = rows_all.last
    row_name = row.get_attribute('aria-label')[2:-5]
    click(pg, row); pg.wait_for_selector('text=下次目标'); pg.wait_for_timeout(900)
    ok('/gains/' in pg.url and pg.get_by_role('heading', name=row_name).count() == 1, f'{tag} 曲线页：点增量页的一行进到这个动作（{row_name}）')
    ok(pg.get_by_text('和首页处方、增量页是同一个数').count() == 1 and pg.locator('[class*=_next_]').count() == 1, f'{tag} 曲线页：有下次目标')
    ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 曲线页：无横向溢出')
    small = audit(pg)
    ok(not small, f'{tag} 曲线页：命中区都 ≥ 48 {small[:3]}')
    recs = pg.locator('[class*=_rec_]')
    # 钻入转场：返回时名称 / 最新值 / 小曲线作为共享元素飞回那一行，转场放完后列表里不留共享名
    pg.evaluate('''() => { window.__vt = null; const o = document.startViewTransition.bind(document);
      document.startViewTransition = (cb) => { const vt = o(cb); vt.ready.then(() => { window.__vt = [...document.getAnimations()].map((a) => (a.effect && a.effect.pseudoElement) || ''); }, () => {}); return vt; }; }''')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_selector('h1')
    until(pg, '() => window.__vt !== null')   # 等转场就绪（目标页挂好才拍新快照，慢机器上要三四百毫秒）
    vt = pg.evaluate('window.__vt') or []
    ok(all(any(k in x for x in vt) for k in ('x-drill-name', 'x-drill-num', 'x-drill-line')), f'{tag} 曲线页：返回时名称、最新值、小曲线作为共享元素飞回那一行')
    ok(until(pg, '() => !document.querySelector(\'[style*="x-drill"]\')'), f'{tag} 曲线页：转场放完后列表里不留共享名（同名不能有两份）')
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
    if (el.closest('svg') || el.closest('[aria-hidden=true]') || el.closest('nav') || el.closest('[data-on-thumb]')) continue;  // [data-on-thumb]：同导航，选中项的字在兄弟元素「滑块」上（会员方案选择）  // 导航选中项的字在骨白滑块上（滑块是兄弟元素，不是祖先），这里算不准，另有截图核对
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    let fg = parse(cs.color); if (!fg) continue;
    // 描边无填充的字（增量页「下次」的数，2026-10-09）：按描边的颜色算
    if (fg[3] === 0 && parseFloat(cs.webkitTextStrokeWidth) > 0) { fg = parse(cs.webkitTextStrokeColor); if (!fg) continue; }
    // 渐变字（color 透明 + background-clip: text，奖励弹窗的升段大字，2026-10-10）：按渐变里每个不透明色标算，取最差的
    let stops = [fg];
    if (fg[3] === 0) for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (((s.backgroundClip || '') + (s.webkitBackgroundClip || '')).includes('text') && s.backgroundImage.includes('gradient')) { stops = [...s.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])).filter((c) => c[3] >= 0.9); break; } }
    if (!stops.length) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const bg = bgOf(el);
    const ratio = Math.min(...stops.map((c) => { const f = blend([c[0], c[1], c[2], c[3] * op], bg), L1 = lum(f), L2 = lum(bg); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); }));
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 600, large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.push([+ratio.toFixed(2), need, size, t.textContent.trim().slice(0, 24), el.className.toString().slice(0, 40)]);
  }
  return out;
}"""

# 元素实际看到的底色亮度（往上叠到第一层不透明的背景；0 黑 – 1 白）
BG_LUM = r"""(sel) => {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!el) return null;
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.99) break; } }
  let bg = [255, 255, 255]; for (let i = layers.length - 1; i >= 0; i--) { const a = layers[i][3]; bg = [0, 1, 2].map((k) => layers[i][k] * a + bg[k] * (1 - a)); }
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return +(0.2126 * f(bg[0]) + 0.7152 * f(bg[1]) + 0.0722 * f(bg[2])).toFixed(3);
}"""
# 页里有没有局部主题（2026-10-10 用户：要真·全局浅色，App 里不许再有深色岛）
# 荧光焦点（2026-10-10 用户：荧光绿在各页都是焦点点缀色，浅色不能换成黑；DESIGN §1.5 第 9 条）：同一页深 / 浅各收一遍，
# 深色里是荧光（字 / 底 / 描边 / 填充 / 阴影 / 渐变 / filter）的元素，浅色里它自己或往上 4 层得还有荧光（荧光笔、荧光块里的字算有）
LIME_SCAN = r"""() => {
  const isLime = (s) => [...(s || '').matchAll(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/g)].some((m) => {
    const [r, g, b] = [m[1], m[2], m[3]].map((x) => x / 255), a = m[4] == null ? 1 : +m[4]; if (a < 0.25) return false;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d || l <= 0.45) return false;
    const sat = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = ((h * 60) + 360) % 360;
    return sat > 0.6 && h >= 61 && h <= 94; });
  // 字色只算有自己文字的元素；左边框色只算真有左边框的（否则它跟着 currentColor，是假荧光）
  const own = (el) => { const c = getComputedStyle(el); return ['color', 'backgroundColor', 'fill', 'stroke', 'boxShadow', 'backgroundImage', 'filter', 'borderLeftColor'].some((k) =>
    (k !== 'color' || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) && (k !== 'borderLeftColor' || parseFloat(c.borderLeftWidth) > 0) && isLime(c[k])); };
  const out = {};
  for (const el of document.querySelectorAll('#root main *')) {
    const b = el.getBoundingClientRect(); if (!b.width || !b.height || el.getAnimations().length) continue;   // 在跑动画的（Logo 条闪亮等）颜色随相位变，不比
    let k = [], e = el; for (; e && e.id !== 'root'; e = e.parentElement) k.unshift(e.tagName + [...(e.parentElement?.children || [])].indexOf(e));
    let lit = false, a = el; for (let i = 0; a && i < 5; i++, a = a.parentElement) if (own(a)) { lit = true; break; }
    out[k.join('>')] = { own: own(el), lit, cls: String(el.className?.baseVal ?? el.className).slice(0, 40), txt: (el.textContent || '').trim().slice(0, 12) };
  }
  return out; }"""
ISLANDS = "[...document.querySelectorAll('body [data-theme]')].map((e) => e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 30))"

def light_checks(b, w, h):
    """浅色主题（2026-10-10，DESIGN §1.5）：真·全局浅色——各页 ?theme=light 下 html 是浅色、页里没有任何局部深色岛、文字对比度达标、无横向溢出、命中区 ≥ 48；
    容量人体用压暗混合（multiply，不是提亮的 screen）、舞台底是浅色；钢板不打灯（没有灯、光束画布）、孔里露出荧光底板；
    故事 8 幕是浅色水墨、字对比度达标；奖励弹窗浅色；「我的 → 外观」切换立即生效、刷新后还在、切回深色。"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} light pageerror: {e}'))
    for path in ('/today', '/body', '/gains', '/gains/barbell-bench-press-4', '/log', '/me', '/me/level', '/me/messages', '/me/wallet', '/me/pro', '/pro', '/shop', '/shop/item/belt-10', '/shop/guide/belt', '/exercise/barbell-bench-press-4'):
        pg.goto(f'{args.base}{path}?scenario=plain-prescription&theme=dark'); pg.wait_for_selector('main'); pg.wait_for_timeout(1100)
        dark = pg.evaluate(LIME_SCAN)   # 先收深色的荧光焦点，下面浅色比对
        pg.goto(f'{args.base}{path}?scenario=plain-prescription&theme=light'); pg.wait_for_selector('main'); pg.wait_for_timeout(1100)
        ok(pg.evaluate('document.documentElement.dataset.theme') == 'light', f'{tag} 浅色·{path}：html 是浅色')
        isl = pg.evaluate(ISLANDS); ok(not isl, f'{tag} 浅色·{path}：页里没有局部深色岛 {isl[:3]}')
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 浅色·{path}：无横向溢出')
        low = pg.evaluate(CONTRAST)
        ok(not low, f'{tag} 浅色·{path}：文字对比度都达标 {low[:3]}')
        small = audit(pg); ok(not small, f'{tag} 浅色·{path}：命中区都 ≥ 48 {small[:3]}')
        # 荧光治理（2026-10-10，docs/light-fluo-plan.md）：页面底降一档（paper-100 ≈ 0.78）、荧光面有深绿细边、点缀是荧光芯、选中态不是大块墨黑
        pl = pg.evaluate(BG_LUM, 'main'); ok(pl is not None and 0.7 < pl < 0.85, f'{tag} 浅色·{path}：页面底是降一档的纸色（亮度 {pl}）')
        lit = pg.evaluate(LIME_SCAN)
        lost = [f"{d['cls']}「{d['txt']}」" for k, d in dark.items() if d['own'] and k in lit and not lit[k]['lit']]
        ok(not lost, f'{tag} 浅色·{path}：深色里的荧光焦点浅色里还是荧光（不换成黑）{lost[:3]}')
        if path == '/today':
            rim = pg.evaluate("() => { const b = [...document.querySelectorAll('button')].find((x) => /开始训练/.test(x.textContent)); if (!b) return null; const c = getComputedStyle(b); return { outline: c.outlineStyle, shadow: (() => { let d = 0, n = c.boxShadow === 'none' ? 0 : 1; for (const ch of c.boxShadow) { if (ch === '(') d++; else if (ch === ')') d--; else if (ch === ',' && d === 0) n++; } return n; })() }; }")
            ok(rim and rim['outline'] == 'none' and rim['shadow'] >= 3, f'{tag} 浅色·首页：荧光主按钮靠阴影托起（≥ 3 层）、不描边 {rim}')
        if path == '/gains':
            seg = pg.evaluate(BG_LUM, "[class*=_seg_up_]"); ok(seg is not None and seg > 0.6, f'{tag} 浅色·增量：汇总条「涨」段不是墨黑块（亮度 {seg}）')
            chip = pg.evaluate(BG_LUM, "[class*=_chipOn_]"); ok(chip is not None and chip > 0.6, f'{tag} 浅色·增量：选中的 Chip 不是墨黑块（亮度 {chip}）')
            pr = pg.evaluate(BG_LUM, "[class*=_prLine_]"); ok(pr is not None and pr > 0.7, f'{tag} 浅色·增量：PR 角标是荧光底（亮度 {pr}）')
            dot = pg.evaluate("() => { const e = document.querySelector('svg[data-tone=accent] [class*=_last_]'); if (!e) return null; const c = getComputedStyle(e); return { fill: c.fill, filter: c.filter.slice(0, 40) }; }")
            ok(dot and dot['fill'] != 'none' and 'drop-shadow' in dot['filter'], f'{tag} 浅色·增量：曲线端点是荧光芯 + 阴影 {dot}')
        if path == '/body':
            lum = pg.evaluate(BG_LUM, '[class*=_stage_]'); ok(lum is not None and lum > 0.7, f'{tag} 浅色·容量：人体舞台是浅色底（亮度 {lum}）')
            look = pg.evaluate("""() => { const l = document.querySelector('svg[class*=_light_]'), fl = document.querySelector('svg[data-flow=molten]');
              return { light: l && getComputedStyle(l).mixBlendMode, flow: fl && getComputedStyle(fl).mixBlendMode }; }""")
            # 熔流是压暗混合（multiply）；柔光描边按浅色描边方案：墨 / 绿线 multiply，默认 L2d 的磨砂白线是普通叠放（normal），都不许是提亮的 screen
            ok(look['flow'] == 'multiply' and look['light'] is not None, f'{tag} 浅色·容量：熔流是压暗混合（multiply） {look}')   # 柔光描边层的混合模式随描边方案（墨 / 绿线 multiply，L2d 磨砂白线是 screen 的白线）
            seg = pg.evaluate(BG_LUM, "[role=radio][aria-checked=true]"); ok(seg is not None and seg > 0.8, f'{tag} 浅色·容量：Segmented 选中不是墨黑块（白浮起，亮度 {seg}）')
        if path == '/log':
            lum = pg.evaluate(BG_LUM, '[data-plate]'); ok(lum is not None and lum > 0.5, f'{tag} 浅色·记录：钢板是浅色钢面（亮度 {lum}）')
            fx = pg.evaluate("""() => ({ lamp: document.querySelectorAll('[class*=_lamp_], [data-plate] [class*=_halo_]').length, canvas: document.querySelectorAll('[data-plate] canvas').length,
              back: getComputedStyle(document.querySelector('[data-plate] [class*=_back_]')).backgroundColor })""")
            ok(fx['lamp'] == 0 and fx['canvas'] == 0, f'{tag} 浅色·记录：浅色不打灯（没有灯、光晕、光束 / 背板画布）{fx}')
            from PIL import Image
            lime = tuple(int(v) for v in re.findall(r'\d+', fx['back'])[:3])
            pts = pg.evaluate(PLATE_HOLES)
            im = Image.open(io.BytesIO(pg.screenshot())).convert('RGB'); sx = im.width / w
            px = [im.getpixel((int(x * sx), int(y * sx))) for x, y in pts if 2 < y < h - 2]
            ok(px and all(max(abs(a - b) for a, b in zip(c, lime)) <= 3 for c in px), f'{tag} 浅色·记录：孔里露出平涂荧光底板 {lime}（{len(px)} 个孔 {px[:2]}）')
    if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, 'light-last.png'))
    # 故事 8 幕：浅色下也是深色（2026-10-10 用户：App 默认深色、首次引导永远先是深色，浅色水墨封存）——整屏是唯一允许的深色岛，底是深色，字对比度达标
    for k, wait in ((1, 4200), (2, 2600), (3, 8800), (4, 4300), (5, 1800), (6, 6900), (7, 6200), (8, 3800)):
        pg.goto(f'{args.base}/'); pg.evaluate('localStorage.clear()'); pg.goto(f'{args.base}/onboarding?scene={k}&theme=light'); pg.wait_for_selector('main'); pg.wait_for_timeout(wait)
        isl = pg.evaluate(ISLANDS); ok(len(isl) == 1 and 'main' in str(isl[0]).lower(), f'{tag} 浅色·故事第 {k} 幕：只有整屏一块深色岛（封存浅色水墨）{isl[:3]}')
        lum = pg.evaluate(BG_LUM, '[class*=_story_]'); ok(lum is not None and lum < 0.2, f'{tag} 浅色·故事第 {k} 幕：底是深色（亮度 {lum}）')
        low = pg.evaluate(CONTRAST); ok(not low, f'{tag} 浅色·故事第 {k} 幕：文字对比度都达标 {low[:3]}')
    # /preview、/playground 最前面有全局深浅开关（2026-10-10 用户）：点「浅色」整页变浅色、点「深色」变回，开关一直在视口里
    if w == 360:
        dk = b.new_page(viewport={'width': 1280, 'height': 800})   # 这两页是桌面上看的内部页，用桌面视口
        dk.on('pageerror', lambda e: errors.append(f'/preview|/playground pageerror: {e}'))
        for path in ('/preview', '/playground'):
            dk.goto(f'{args.base}{path}'); dk.evaluate('localStorage.clear()'); dk.goto(f'{args.base}{path}'); dk.wait_for_selector('[role=radiogroup][aria-label=全局主题]', timeout=30000)
            bar = dk.locator('[role=radiogroup][aria-label=全局主题]'); box = bar.bounding_box()
            ok(box and 0 <= box['y'] < 100, f'浅色·{path}：全局主题开关在页面最前（右上角）{box}')
            bar.get_by_role('radio', name='浅色').click(timeout=60000); dk.wait_for_function("document.documentElement.dataset.theme === 'light'", timeout=60000)   # playground 整页重绘很重（几百格），给足时间
            ok(dk.evaluate('document.documentElement.dataset.theme') == 'light', f'浅色·{path}：点「浅色」整页变浅色')
            dk.evaluate('window.scrollTo(0, document.body.scrollHeight / 3)'); dk.wait_for_timeout(300)
            box = bar.bounding_box(); ok(box and 0 <= box['y'] < 100, f'浅色·{path}：滚动后开关还在视口里 {box}')
            bar.get_by_role('radio', name='深色').click(timeout=60000); dk.wait_for_function("document.documentElement.dataset.theme === 'dark'", timeout=60000)
            ok(dk.evaluate('document.documentElement.dataset.theme') == 'dark', f'浅色·{path}：点「深色」变回深色')
        dk.close()
    # 奖励弹窗（只在 360 那一份跑）：结算流程门禁里只打 1 组、不出奖励，所以用 /playground 的定格卡和「奖励演示」里真弹出来的弹窗；对比度只算卡里的字、不按视口裁
    if w == 360:
        pg.goto(f'{args.base}/playground?theme=light'); pg.wait_for_selector('section#RewardCard', timeout=30000); pg.wait_for_timeout(1500)
        cards = pg.locator('section#RewardCard [role=dialog][data-kind]')
        n_cards = cards.count(); ok(n_cards == 12, f'{tag} 浅色·奖励：定格卡 12 张（{n_cards}）')
        for i in range(n_cards):
            c = cards.nth(i); c.scroll_into_view_if_needed(); pg.wait_for_timeout(120)
            ok(c.evaluate("(e) => !e.closest('[data-theme]:not(html)')"), f'{tag} 浅色·奖励定格 #{i}：不是深色岛')
            low = c.evaluate(CONTRAST_IN); ok(not low, f'{tag} 浅色·奖励定格 #{i} {c.get_attribute("data-kind")}：文字对比度都达标 {low[:3]}')
        demo = pg.locator('[aria-label="奖励演示"]')
        for name in ('升段', '升段 · Milo', '破纪录', '连胜里程碑', '升级', '周期完成'):
            demo.scroll_into_view_if_needed(); demo.get_by_role('button', name=name, exact=True).click(); pg.wait_for_timeout(400)
            layer = pg.locator('[class*=_layer_][data-tier]'); layer.click(position={'x': 5, 'y': 5}); pg.wait_for_timeout(900)   # 点一下跳到定格
            low = layer.evaluate(CONTRAST_IN); ok(not low, f'{tag} 浅色·奖励弹窗「{name}」：文字对比度都达标 {low[:3]}')
            layer.get_by_role('button', name='收下').click(); pg.wait_for_timeout(500)
    # /demo 外壳（电脑版，只在 360 那一份跑）：手机下面的「浅色」整页一起切，手机里也是浅色
    if w == 360:
        d = b.new_page(viewport={'width': 1440, 'height': 900})
        d.on('pageerror', lambda e: errors.append(f'light demo pageerror: {e}'))
        d.goto(args.base + '/demo'); d.wait_for_selector('iframe'); d.wait_for_timeout(1500)
        d.get_by_role('group', name='主题').get_by_role('button', name='浅色').click(); d.wait_for_timeout(1500)
        inner = d.frames[1].evaluate('document.documentElement.dataset.theme') if len(d.frames) > 1 else None
        ok(d.evaluate('document.documentElement.dataset.theme') == 'light' and inner == 'light', f'/demo 浅色：外壳和手机里一起切到浅色（手机里 {inner}）')
        isl = d.evaluate(ISLANDS); ok(not isl, f'/demo 浅色：外壳没有局部深色岛 {isl[:3]}')
        lum = d.evaluate(BG_LUM, 'main'); ok(lum is not None and lum > 0.7, f'/demo 浅色：外壳是浅色底（亮度 {lum}）')
        low = d.evaluate(CONTRAST); ok(not low, f'/demo 浅色：外壳文字对比度都达标 {low[:3]}')
        d.close()
    # 「我的 → 外观」：选浅色立即生效、刷新还在；选回深色
    pg.goto(f'{args.base}/me?scenario=plain-prescription'); pg.wait_for_selector('h1'); pg.wait_for_timeout(800)
    ok(pg.evaluate('document.documentElement.dataset.theme') == 'dark', f'{tag} 外观：默认深色')
    pg.get_by_role('button', name=re.compile('^主题')).click(); pg.wait_for_timeout(600)
    pg.get_by_role('dialog', name='主题').get_by_role('radio', name=re.compile('^浅色')).click(); pg.wait_for_timeout(700)
    ok(pg.evaluate('document.documentElement.dataset.theme') == 'light' and pg.evaluate("localStorage.getItem('milo-theme')") == 'light', f'{tag} 外观：选浅色立即生效并记住')
    pg.reload(); pg.wait_for_selector('h1'); pg.wait_for_timeout(600)
    ok(pg.evaluate('document.documentElement.dataset.theme') == 'light', f'{tag} 外观：刷新后还是浅色')
    pg.get_by_role('button', name=re.compile('^主题')).click(); pg.wait_for_timeout(600)
    pg.get_by_role('dialog', name='主题').get_by_role('radio', name=re.compile('^深色')).click(); pg.wait_for_timeout(700)
    ok(pg.evaluate('document.documentElement.dataset.theme') == 'dark' and pg.evaluate("localStorage.getItem('milo-theme')") is None, f'{tag} 外观：切回深色（默认值不另存）')
    pg.close()

def log_checks(b, w, h):
    """记录页（P07）：钢板上的孔数 = 练过的天数、板的节点数、固定光源下的亮暗与光束、拖动吸附与读数、减少动态效果下静止、周合计自洽、更早的训练、空态；"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} log pageerror: {e}'))
    def open_log(sc, shot=None):
        pg.goto(f'{args.base}/log?scenario={sc}'); pg.wait_for_selector('h1'); pg.wait_for_timeout(900)
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} 记录·{sc}：无横向溢出')
        ok(pg.evaluate('(() => { const e = document.querySelector("[class*=_scroll_]"); return e.scrollWidth <= e.clientWidth; })()'), f'{tag} 记录·{sc}：滚动区里也没有横向滚动（漏光不能把它撑宽）')
        small = audit(pg); ok(not small, f'{tag} 记录·{sc}：命中区都 ≥ 48 {small[:3]}')
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
    beam = pg.evaluate("""() => { const c = document.querySelector('[data-plate] canvas[class*=_beams_]'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 12) n++; return n / (d.length / 16); }""")
    ok(beam is not None and beam > 0.08, f'{tag} 记录·钢板：孔前有光束（光束画布 {0 if beam is None else beam * 100:.0f}% 有光）')
    # 光束是静态层、浮尘在它上面单独一层（2026-10-10 性能巡检），两张一起取哈希
    snap = "() => { let h = 0; for (const c of document.querySelectorAll('[data-plate] canvas[class*=_beams_]')) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; } return h; }"
    f0 = pg.evaluate(snap); pg.wait_for_timeout(400); f1 = pg.evaluate(snap)
    ok(f0 != f1, f'{tag} 记录·钢板：光束里的浮尘在飘')
    pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 0)'); pg.evaluate('document.querySelector("[class*=_body_]").style.paddingTop = ""'); pg.wait_for_timeout(500)
    # S1（2026-10-09 用户）：灯挂在不滚动的屏幕层、不跟页面走；板滚出灯下时慢慢关灯（中途有半亮的帧，不是一下子灭），透光和光束跟着一起暗；滚回来再亮
    lamp = pg.evaluate("""async () => {
      const L = document.querySelector('main [class*=_lamp_]'), sc = document.querySelector('[class*=_scroll_]'), body = document.querySelector('[class*=_body_]'), plate = document.querySelector('[data-plate]');
      if (!L || !plate) return null;
      const beams = () => { const c = plate.querySelector('canvas[class*=_beams_]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 3; i < d.length; i += 16) s += d[i]; return s; };
      const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
      body.style.paddingBottom = '2000px'; await frame(); await frame();
      const y0 = L.getBoundingClientRect().top, ly0 = getComputedStyle(L).getPropertyValue('--ly'), op0 = +getComputedStyle(L).opacity, b0 = beams();
      sc.scrollTo(0, sc.scrollTop + plate.getBoundingClientRect().bottom - sc.getBoundingClientRect().top + 40);
      const seq = []; const t0 = performance.now(); while (performance.now() - t0 < 1800) { await frame(); seq.push(+getComputedStyle(L).opacity); }
      const y1 = L.getBoundingClientRect().top, ly1 = getComputedStyle(L).getPropertyValue('--ly'), b1 = beams();
      sc.scrollTo(0, 0); const t1 = performance.now(); while (performance.now() - t1 < 1800) await frame();
      const op2 = +getComputedStyle(L).opacity; body.style.paddingBottom = ''; await frame();
      return { y0, y1, ly0, ly1, op0, seq, b0, b1, op2 }; }""")
    ok(lamp is not None, f'{tag} 记录·钢板：有灯（挂在屏幕层 main 里）')
    if lamp:
        mid = [o for o in lamp['seq'] if 0.1 < o < 0.9]
        ok(abs(lamp['y0'] - lamp['y1']) < 1 and lamp['ly0'] == lamp['ly1'], f'{tag} 记录·钢板：滚动时灯不动（{lamp["y0"]:.0f} → {lamp["y1"]:.0f}，光心 {lamp["ly0"]} → {lamp["ly1"]}）')
        ok(lamp['op0'] > 0.95 and lamp['seq'][-1] < 0.05 and len(mid) >= 3, f'{tag} 记录·钢板：板滚出灯下慢慢关灯（{lamp["op0"]:.2f} → 中途 {len(mid)} 帧半亮 → {lamp["seq"][-1]:.2f}）')
        ok(lamp['b1'] < lamp['b0'] * 0.2, f'{tag} 记录·钢板：关灯时光束一起暗（{lamp["b0"]:.0f} → {lamp["b1"]:.0f}）')
        ok(lamp['op2'] > 0.95, f'{tag} 记录·钢板：滚回来灯重新亮（{lamp["op2"]:.2f}）')
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
    ok(len(seen) >= 3 and rd() != d0, f'{tag} 记录·钢板：横向拖吸到一个个日子（{len(seen)} 个），读数行跟着换')
    pg.locator('[data-plate] figure').focus(); before = rd(); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(200)
    ok(rd() != before, f'{tag} 记录·钢板：右键换到下一天（{before} → {rd()}）')
    # 休息日也能选（S1，2026-10-09）：读数行写「休息日」、没有「查看」（不给死路）；再换回练过的一天去「查看」
    go = pg.get_by_role('button', name=re.compile(r'^查看.+的训练$'))
    readout = lambda: pg.locator('[data-plate] [class*=_readout_]').first.inner_text()
    for _ in range(20):
        if '休息日' in readout(): break
        pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(120)
    ok('休息日' in readout() and go.count() == 0, f'{tag} 记录·钢板：选中休息日，读数写「休息日」、没有「查看」（{rd()}）')
    for _ in range(20):   # 往后找（往前可能已经顶到三个月的第一天、是个休息日）
        if go.count(): break
        pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(120)
    picked = rd(); click(pg, go); pg.wait_for_selector('[data-drill-ready=logdetail]'); pg.wait_for_timeout(1000)
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
    # 按月收起（2026-10-09）后默认页面不够长：先展开上一个月，返回时展开的月份也要还在
    months = pg.get_by_role('button', name=re.compile(r'^\d+ 月'))
    click(pg, months.nth(1)); pg.wait_for_timeout(700)
    open0 = pg.evaluate("[...document.querySelectorAll('button[aria-expanded=true]')].map((e) => e.getAttribute('aria-label') || e.textContent).length")
    pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 420)'); pg.wait_for_timeout(400)
    top0 = pg.evaluate('document.querySelector("[class*=_scroll_]").scrollTop')
    ok(top0 > 380, f'{tag} 详情：展开一个月后页面够长、能滚到 420（{top0:.0f}）')
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
    small = audit(pg); ok(not small, f'{tag} 详情：命中区都 ≥ 48 {small[:3]}')
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
    ok(abs(top_back - top0) <= 2, f'{tag} 详情：返回记录页后滚动位置还在（{top0:.0f} → {top_back:.0f}）')
    ok(pg.evaluate("document.querySelectorAll('button[aria-expanded=true]').length") == open0, f'{tag} 详情：返回记录页后展开的月份还展开着（{open0} 个）')
    ok(until(pg, '() => !document.querySelector(\'[style*="x-drill"]\')'), f'{tag} 详情：转场放完后记录页里不留共享名（同名不能有两份）')
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
    small = audit(pg); ok(not small, f'{tag} 删除：对话框里命中区都 ≥ 48 {small[:3]}')
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
    # 分段加载 + 按月分组：用「载入示例数据」的真用户（30 周）走真实存储
    lp = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    lp.on('pageerror', lambda e: errors.append(f'{tag} log(live) pageerror: {e}'))
    lp.goto(args.base + '/onboarding'); lp.wait_for_selector('button:has-text("跳过")'); lp.wait_for_timeout(600)
    click(lp, lp.get_by_role('button', name='跳过')); click(lp, lp.get_by_role('button', name='下一步')); click(lp, lp.get_by_role('button', name='下一步'))
    click(lp, lp.get_by_role('button', name='载入示例数据 · 练了 30 周的进阶用户')); lp.wait_for_url('**/today**'); lp.wait_for_timeout(900)
    click(lp, lp.get_by_role('link', name='记录')); lp.wait_for_url('**/log**'); lp.wait_for_selector('section[class*=_month_]'); lp.wait_for_timeout(700)
    # 按月分组（走查 1 选定 W2）：这个月展开、过去的月份折成一行；30 周 ≈ 7 个月，一次 6 个月，滑到底自动接上，最后写「到底了」
    heads_m = lp.locator('section[class*=_month_] > button[aria-expanded]')
    ok(heads_m.count() >= 5 and [heads_m.nth(i).get_attribute('aria-expanded') for i in range(heads_m.count())].count('true') == 1 and heads_m.first.get_attribute('aria-expanded') == 'true',
       f'{tag} 记录（真存储，30 周）：按月分组，只有最近一个月展开（{heads_m.count()} 个月）')
    lp.evaluate('document.querySelector("[class*=_scroll_]").scrollTo(0, 1e6)'); lp.wait_for_timeout(1500)
    ok(lp.get_by_text('到底了').count() == 1 and lp.get_by_text(re.compile('^更早的训练')).count() == 0, f'{tag} 记录：滑到底自动加载完，写「到底了」（{lp.locator("section[class*=_month_]").count()} 个月）')
    click(lp, heads_m.nth(1)); lp.wait_for_timeout(900)
    ok(heads_m.nth(1).get_attribute('aria-expanded') == 'true' and lp.evaluate("document.getElementById(document.querySelectorAll('section[class*=_month_] > button')[1].getAttribute('aria-controls')).getBoundingClientRect().height") > 100,
       f'{tag} 记录：点月头展开那个月')
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
        small = audit(pg); ok(not small, f'{tag} {name}：命中区都 ≥ 48 {small[:3]}')
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
    ok(pg.get_by_role('button', name=re.compile('^钱包 · 商城')).count() == 1, f'{tag} 我的：有「钱包 · 商城」一行（6f）')
    ok(pg.get_by_role('button', name=re.compile('^Milo Pro')).count() == 1, f'{tag} 我的：有「Milo Pro」一行（6g）')
    # 页头跟着内容滑走
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, 600)'); pg.wait_for_timeout(500)
    ok(pg.evaluate('document.querySelector("h1").getBoundingClientRect().bottom < 0'), f'{tag} 我的：大标题滑出了屏幕')
    pg.locator('[class*=_scroll_]').first.evaluate('e => e.scrollTo(0, 0)'); pg.wait_for_timeout(300)
    if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, 'me-plain.png'))
    # ---- 转场（2026-10-09 走查 1 #01 #02 #06，DESIGN §7 转场表）：记下每次 <html data-vt> 的值，和退场复制品出现过没有
    pg.evaluate("""() => { window.__vts = []; window.__ghost = false; const h = document.documentElement;
      new MutationObserver(() => { if (h.dataset.vt) window.__vts.push(h.dataset.vt + ':' + (h.dataset.vtDir || '')); }).observe(h, { attributes: true, attributeFilter: ['data-vt'] });
      new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes].some((n) => n.dataset && 'ghost' in n.dataset))) window.__ghost = true; }).observe(document.body, { childList: true, subtree: true }); }""")
    tap(pg.get_by_role('button', name=re.compile('^消息'))); pg.wait_for_url(re.compile(r'/me/messages')); pg.wait_for_timeout(700)
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_url(re.compile(r'/me\?')); pg.wait_for_timeout(700)
    click(pg, pg.get_by_role('link', name='首页')); pg.wait_for_url(re.compile(r'/today')); pg.wait_for_timeout(900)
    click(pg, pg.locator('[data-hero]').first); pg.wait_for_url(re.compile(r'/exercise/')); pg.wait_for_timeout(700)
    ok(pg.evaluate('!!document.querySelector(\'[style*="view-transition-name: x-card"]\')'), f'{tag} 转场：从首页处方卡进来的要领页整页和那张卡同名（M03 卡片长成整页）')
    # 动作要领（走查 1 #05，W3 关键帧分步 · Stitch V1）：16:9 示范在内容宽内；每步一行 ≥ 56；点第 3 步它成为当前一步；不写「第几帧 / STEP」
    gd = pg.evaluate("""() => { const f = document.querySelector('figure [class*=_frame_]').getBoundingClientRect(), rows = [...document.querySelectorAll('ol[aria-label^="分步"] button')];
      return { r: f.width / f.height, l: f.left, rt: innerWidth - f.right, rows: rows.map((b) => Math.round(b.getBoundingClientRect().height)), txt: document.body.innerText }; }""")
    ok(abs(gd['r'] - 16 / 9) < 0.02 and gd['l'] >= 12 and gd['rt'] >= 12, f'{tag} 要领：示范 16:9、在内容宽内 {gd["r"]:.3f} {gd["l"]} {gd["rt"]}')
    ok(len(gd['rows']) >= 3 and min(gd['rows']) >= 56, f'{tag} 要领：每步一行、行高 ≥ 56 {gd["rows"]}')
    ok(not re.search(r'第\s*\S\s*帧|STEP', gd['txt'], re.I), f'{tag} 要领：不写「第几帧 / STEP」')
    steps = pg.locator('ol[aria-label^="分步"] button'); click(pg, steps.nth(2)); pg.wait_for_timeout(300)
    ok(steps.nth(2).get_attribute('aria-current') == 'step' and steps.nth(2).get_attribute('aria-pressed') == 'true', f'{tag} 要领：点第 3 步，它成为当前一步（循环那一段）')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_url(re.compile(r'/today')); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('link', name='我的')); pg.wait_for_url(re.compile(r'/me\?')); pg.wait_for_timeout(900)
    vts = pg.evaluate('window.__vts')
    ok(vts == ['push:', 'pop:', 'tab:back', 'drill:in', 'drill:back', 'tab:fwd'], f'{tag} 转场：子页推入 / 推出、Tab 往左 / 往右横滑、处方卡 ↔ 要领共享元素 {vts}')
    click(pg, pg.get_by_role('button', name=re.compile('^单次时长：'))); pg.wait_for_timeout(600)
    click(pg, pg.get_by_role('dialog').get_by_role('button', name='关闭')); pg.wait_for_timeout(100)
    ok(pg.evaluate('window.__ghost'), f'{tag} 转场：面板关掉时留了一份退场复制品（每个出现都有退场）')
    pg.wait_for_timeout(1200)
    ok(pg.locator('[data-ghost]').count() == 0 and pg.get_by_role('dialog').count() == 0, f'{tag} 转场：退场播完复制品删掉，不留东西')
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
    small = audit(pg); ok(not small, f'{tag} 数据：确认对话框里命中区都 ≥ 48 {small[:3]}')
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
    click(pg, pg.get_by_role('button', name='载入示例数据 · 练了 30 周的进阶用户')); pg.wait_for_url('**/today**'); pg.wait_for_timeout(900)
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

def shop_checks(b, w, h):
    """钱包与商城（6f，P14–P19）：真存储（演示数据）走一遍 钱包 → 商城 → 知识卡 → 详情 → 下单 → 订单完成 → 钱包；兑换卡券；缺货到货提醒 → 消息；旧链接；演示场景不写存储。"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} shop pageerror: {e}'))
    def page_ok(name):
        pg.wait_for_timeout(300)
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} {name}：无横向溢出')
        small = audit(pg); ok(not small, f'{tag} {name}：命中区都 ≥ 48 {small[:3]}')
        ok(not pg.evaluate(CRUSH), f'{tag} {name}：滚动区里没有被压扁的块')
        ok(pg.get_by_role('navigation', name='主导航').count() == 0, f'{tag} {name}：子页没有 Tab 导航')
        if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, f'shop-{name}.png'))
    def tap(loc):
        loc.first.evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(250); click(pg, loc)
    def store():
        return pg.evaluate('JSON.parse(localStorage.getItem("milo:v1"))')
    def niujin():
        return int(pg.get_by_role('button', name=re.compile('^钱包 · 商城')).inner_text().split('牛劲 ')[1].split(' ')[0].replace(',', ''))
    # 真存储：建档最后一步载入演示数据
    pg.goto(args.base + '/onboarding'); pg.evaluate('localStorage.clear()'); pg.goto(args.base + '/onboarding'); pg.wait_for_selector('button:has-text("跳过")'); pg.wait_for_timeout(600)
    click(pg, pg.get_by_role('button', name='跳过')); click(pg, pg.get_by_role('button', name='下一步')); click(pg, pg.get_by_role('button', name='下一步'))
    click(pg, pg.get_by_role('button', name='载入示例数据 · 练了 30 周的进阶用户')); pg.wait_for_url('**/today**'); pg.wait_for_timeout(900)
    # 增量页的知识卡横幅（线框 tips W3）：页头下、筛选上；✕ 这次收起；静音后不再出现；容量页一屏最多一条
    pg.goto(args.base + '/gains'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(1200)
    tip = pg.get_by_role('button', name=re.compile('腰带：什么时候该系'))
    ok(tip.count() == 1, f'{tag} 增量：有一条腰带知识卡横幅')
    if tip.count():
        ty = tip.bounding_box()['y'] if tip.bounding_box() else 0
        chips = pg.get_by_role('group', name='按部位筛选').bounding_box()
        ok(chips is not None and ty < chips['y'], f'{tag} 增量：横幅在部位筛选上面')
    small = audit(pg); ok(not small, f'{tag} 增量·横幅：命中区都 ≥ 48 {small[:3]}')
    if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, 'shop-tip-gains.png'))
    click(pg, pg.get_by_role('button', name='收起这条提示'))
    ok(until(pg, '() => !document.querySelector(\'[aria-label="收起这条提示"]\')'), f'{tag} 增量：✕ 收起后横幅没了')
    pg.goto(args.base + '/body'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(1000)
    ok(pg.get_by_role('button', name='收起这条提示').count() <= 1, f'{tag} 容量：知识卡提示一屏最多一条')
    pg.goto(args.base + '/me'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    before = niujin()
    ok(before >= 6000, f'{tag} 我的：「钱包 · 商城」行写牛劲余额（{before}）')
    tap(pg.get_by_role('button', name=re.compile('^钱包 · 商城'))); pg.wait_for_url('**/me/wallet'); pg.wait_for_timeout(900)
    page_ok('wallet')
    ok(pg.get_by_text('牛劲余额', exact=True).count() == 1 and pg.get_by_text(re.compile(r'^我的卡券 · \d+ 张可用$')).count() == 1, f'{tag} 钱包：余额 + 我的卡券')
    ok(pg.get_by_role('button', name=re.compile('^去用')).count() == 2, f'{tag} 钱包：两张演示券都能「去用」')
    # 兑换：面板 → 免邮券 → 提示，余额少 300
    click(pg, pg.get_by_role('button', name=re.compile('^兑换卡券'))); pg.wait_for_timeout(500)
    sheet = pg.get_by_role('dialog', name='兑换卡券')
    ok(sheet.count() == 1 and sheet.get_by_role('button', name='兑换').count() == 3, f'{tag} 钱包：兑换走底部面板，三种券')
    page_ok('wallet-redeem')
    click(pg, sheet.get_by_role('button', name='兑换').nth(1)); pg.wait_for_timeout(600)
    ok(sheet.count() == 0 and pg.get_by_text('已兑换：免邮券').count() == 1, f'{tag} 钱包：兑换后面板收起、有提示')
    ok(any(a['label'] == '免邮券' and a['cost'] == 300 for a in store()['wallet']['actions'][-1:]), f'{tag} 钱包：兑换写进存储')
    # 去商城
    click(pg, pg.get_by_role('button', name=re.compile('^去商城抵扣'))); pg.wait_for_url('**/shop'); pg.wait_for_timeout(900)
    page_ok('shop')
    ok(pg.get_by_text('知识卡 · 按你的训练数据').count() == 1 and pg.get_by_text(re.compile('硬拉预估 1RM 已到体重的 1\\.\\d+ 倍')).count() >= 1, f'{tag} 商城：为你推荐是数据触发的腰带知识卡')
    for t in ('折扣', '热销', '新品', '缺货'): ok(pg.get_by_role('button', name=re.compile(f'，{t}$')).count() >= 1, f'{tag} 商城：有「{t}」的商品（读屏念得到状态）')
    # T2（2026-10-09 用户选定）：折扣 / 热销 / 新品是图左上角的荧光斜丝带，折扣写百分比；缺货写在卡上、整卡压暗
    ok(pg.locator('[class*=_rb_sale_]').filter(has_text=re.compile(r'^[−-]\d+%$')).count() >= 1 and pg.locator('[class*=_rb_hot_]').count() >= 1 and pg.locator('[class*=_rb_new_]').count() >= 1 and pg.get_by_text('缺货', exact=True).count() >= 1,
       f'{tag} 商城：折扣 / 热销 / 新品是斜丝带（折扣写百分比），缺货写在卡上')
    ok(pg.locator('[class*=_pic_]').count() >= 5, f'{tag} 商城：五件商品都在（已下架的不在列表里）')
    # M03（走查 1 #08）：商品卡 → 详情，商品图和名字飞过去（详情页的大图、标题和那张卡同名）；返回飞回去
    click(pg, pg.get_by_role('button', name=re.compile('^乳清蛋白'))); pg.wait_for_url(re.compile(r'/shop/item/whey')); pg.wait_for_timeout(800)
    ok(pg.evaluate('!!document.querySelector(\'[style*="view-transition-name: x-pic-whey"]\') && !!document.querySelector(\'[style*="view-transition-name: x-title-whey"]\')'), f'{tag} 商城：从商品卡进来的详情页，大图和标题和那张卡同名（M03）')
    click(pg, pg.get_by_role('button', name='返回')); pg.wait_for_url(re.compile(r'/shop(\?|$)')); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('radio', name='补剂')); pg.wait_for_timeout(400)
    ok(pg.get_by_role('button', name=re.compile('^杠铃腰带 10 毫米，')).count() == 0 and pg.get_by_role('button', name=re.compile('^乳清蛋白')).count() == 1, f'{tag} 商城：品类「补剂」只剩补剂')
    click(pg, pg.get_by_role('radio', name='全部')); pg.wait_for_timeout(300)
    # 知识卡
    click(pg, pg.get_by_role('button', name=re.compile('^知识卡 · 按你的训练数据'))); pg.wait_for_url('**/shop/guide/belt'); pg.wait_for_timeout(900)
    page_ok('guide')
    ok(pg.get_by_role('figure', name=re.compile('已越过推荐门槛')).count() == 1, f'{tag} 知识卡：证据面板写「已越过推荐门槛」')
    ok(pg.get_by_text(re.compile('不构成医疗建议')).count() == 1 and pg.get_by_text(re.compile(r'\+\d+%')).count() == 0, f'{tag} 知识卡：写「不构成医疗建议」，没有功效百分比')
    tap(pg.get_by_role('button', name='不再提示这一类')); pg.wait_for_timeout(400)
    ok('belt' in store()['wallet']['muted'], f'{tag} 知识卡：「不再提示这一类」记进存储')
    pg.goto(args.base + '/gains'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(1000)
    ok(pg.get_by_role('button', name=re.compile('腰带：什么时候该系')).count() == 0, f'{tag} 增量：「不再提示这一类」后，刷新也不再出现')
    pg.go_back(); pg.wait_for_url('**/shop/guide/belt'); pg.wait_for_timeout(900)
    tap(pg.get_by_role('button', name=re.compile('恢复提示'))); pg.wait_for_timeout(300)
    ok('belt' not in store()['wallet']['muted'], f'{tag} 知识卡：恢复提示')
    click(pg, pg.get_by_role('button', name='看杠铃腰带 10 毫米')); pg.wait_for_url('**/shop/item/belt-10'); pg.wait_for_timeout(900)
    page_ok('item')
    ok(pg.get_by_text('¥399').count() >= 1 and pg.get_by_text('会员 ¥296').count() == 1 and pg.get_by_text('牛劲可抵 ¥59').count() == 1, f'{tag} 详情：划线价、会员价、牛劲可抵 ¥59')
    ok(pg.get_by_role('radio', name='M').get_attribute('aria-checked') == 'true', f'{tag} 详情：规格默认选中间一档 M')
    click(pg, pg.get_by_role('button', name='购买 · 会员价 ¥296')); pg.wait_for_url('**/shop/checkout**'); pg.wait_for_timeout(900)
    page_ok('checkout')
    ok(pg.get_by_text(re.compile('演示')).count() == 0 and pg.locator('input').count() == 0, f'{tag} 确认订单：没有任何输入框，也不写「演示」（走查 1）')
    ok(pg.get_by_role('button', name='提交订单 · ¥207').count() == 1, f'{tag} 确认订单：满减券 + 牛劲 = ¥207')
    sw = pg.get_by_role('switch', name='牛劲抵扣'); sw.click(); pg.wait_for_timeout(300)
    ok(pg.get_by_role('button', name='提交订单 · ¥266').count() == 1, f'{tag} 确认订单：关掉牛劲抵扣 = ¥266')
    sw.click(); pg.wait_for_timeout(300)
    btn = pg.get_by_role('button', name='提交订单 · ¥207'); click(pg, btn); pg.wait_for_timeout(150)
    ok(pg.locator('button[aria-busy=true]').count() == 1, f'{tag} 确认订单：提交中按钮禁用（不会重复下单）')
    pg.wait_for_url('**/shop/order/**'); pg.wait_for_timeout(1000)
    page_ok('order')
    ok(pg.get_by_text('下单成功').count() == 1 and pg.get_by_text(re.compile(r'订单号 MILO-\d{8}-\d{4}')).count() == 1, f'{tag} 订单完成：下单成功 + 订单号')
    ok(len(store()['wallet']['orders']) == 1, f'{tag} 订单完成：只下了一单')
    pg.go_back(); pg.wait_for_timeout(800)
    ok('/shop/checkout' not in pg.url, f'{tag} 订单完成：浏览器返回不回到确认订单（{pg.url.split("5199")[-1]}）')
    pg.goto(args.base + '/me'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    ok(niujin() == before - 300 - 5900, f'{tag} 我的：牛劲余额扣了兑换 300 + 抵扣 5,900（{before} → {niujin()}）')
    # 缺货：到货提醒 → 消息
    pg.goto(args.base + '/shop/item/knee'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    page_ok('item-oos')
    ok(pg.get_by_role('button', name=re.compile('^购买')).count() == 0 and pg.get_by_text(re.compile('预计')).count() == 1, f'{tag} 缺货：没有购买键，写预计到货')
    click(pg, pg.get_by_role('button', name='到货提醒')); pg.wait_for_timeout(500)
    click(pg, pg.get_by_role('button', name='已设到货提醒 · 看消息')); pg.wait_for_url('**/me/messages'); pg.wait_for_timeout(900)
    ok(pg.get_by_text('7 毫米护膝 已到货').count() == 1, f'{tag} 缺货：消息里来一条「已到货」')
    # 旧链接（2026-10-09 演示数据去掉了已下架的镁粉）：提示没有这件商品，回商城
    pg.goto(args.base + '/shop/item/chalk'); pg.wait_for_timeout(900)
    ok(pg.get_by_text('没有这件商品').count() == 1, f'{tag} 旧链接：详情页提示没有这件商品')
    click(pg, pg.get_by_role('button', name='回商城')); pg.wait_for_url('**/shop'); pg.wait_for_timeout(500)
    # 演示场景：不写存储
    snap = json.dumps(store()['wallet'], sort_keys=True)
    pg.goto(args.base + '/shop/item/straps?scenario=plain-prescription'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('button', name=re.compile('^购买'))); pg.wait_for_url('**/shop/checkout**'); pg.wait_for_timeout(800)
    ok(pg.get_by_text('免邮券 −¥10').count() == 1, f'{tag} 场景·确认订单：助力带不到 ¥99，自动用免邮券抵运费')
    click(pg, pg.get_by_role('button', name=re.compile('^提交订单'))); pg.wait_for_url('**/shop/order/**'); pg.wait_for_timeout(900)
    ok('scenario=plain-prescription' in pg.url and json.dumps(store()['wallet'], sort_keys=True) == snap, f'{tag} 场景：下单走完、带着场景参数，不写本机存储')
    pg.close()

def pro_checks(b, w, h):
    """会员（6g，P20 付费墙 / 开通成功 / P21 会员中心）：真存储走一遍 我的 → 付费墙（按你的数据、看完整对比、选方案）→ 开通成功 → 会员中心 → 切回免费；
    试用 → 会员中心试用态 → 只剩月 / 年；数据里的演示开关；商品详情会员价旁的 Pro；演示场景不写存储；没有进账的新用户退回通用对比表。"""
    tag = f'{w}×{h}'
    pg = b.new_page(viewport={'width': w, 'height': h}, is_mobile=True, has_touch=True)
    pg.on('pageerror', lambda e: errors.append(f'{tag} pro pageerror: {e}'))
    def page_ok(name):
        pg.wait_for_timeout(300)
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{tag} {name}：无横向溢出')
        small = audit(pg); ok(not small, f'{tag} {name}：命中区都 ≥ 48 {small[:3]}')
        ok(not pg.evaluate(CRUSH), f'{tag} {name}：滚动区里没有被压扁的块')
        ok(pg.get_by_role('navigation', name='主导航').count() == 0, f'{tag} {name}：子页没有 Tab 导航')
        if not args.no_shots and w == 360: pg.screenshot(path=os.path.join(OUT, f'pro-{name}.png'))
    def store():
        return pg.evaluate('JSON.parse(localStorage.getItem("milo:v1"))')
    def row():
        return pg.get_by_role('button', name=re.compile('^Milo Pro'))
    def open_me():
        pg.goto(args.base + '/me'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    pg.goto(args.base + '/onboarding'); pg.evaluate('localStorage.clear()'); pg.goto(args.base + '/onboarding'); pg.wait_for_selector('button:has-text("跳过")'); pg.wait_for_timeout(600)
    click(pg, pg.get_by_role('button', name='跳过')); click(pg, pg.get_by_role('button', name='下一步')); click(pg, pg.get_by_role('button', name='下一步'))
    click(pg, pg.get_by_role('button', name='载入示例数据 · 练了 30 周的进阶用户')); pg.wait_for_url('**/today**'); pg.wait_for_timeout(900)
    open_me()
    ok(row().count() == 1 and '7 天免费试用' in row().inner_text(), f'{tag} 我的：未开通的会员行写「7 天免费试用」')
    click(pg, row()); pg.wait_for_url('**/pro'); pg.wait_for_timeout(1600)
    page_ok('paywall')
    ok(pg.get_by_role('heading', name='这 30 天，Pro 会多给你').count() == 1 and pg.get_by_role('list', name='Pro 会多给你').get_by_role('listitem').count() == 4, f'{tag} 付费墙：按你的数据，四条权益')
    ok(pg.get_by_text(re.compile(r'^你这 30 天拿了 [\d,]+，Pro ×1\.5$')).count() == 1 and pg.get_by_text('杠铃腰带 10 毫米 ¥329 → ¥296').count() == 1, f'{tag} 付费墙：牛劲按近 30 天进账算、会员价举被触发的腰带')
    ok(pg.get_by_text(re.compile('演示')).count() == 0 and pg.locator('input').count() == 0, f'{tag} 付费墙：没有任何输入框，也不写「演示」（走查 1）')
    ok(pg.get_by_role('radio').count() == 3 and pg.get_by_role('radio', name=re.compile('^年度')).get_attribute('aria-checked') == 'true', f'{tag} 付费墙：三个方案，默认年度')
    cta = pg.get_by_role('button', name='开通年度', exact=True)
    bb = cta.bounding_box()
    ok(bb is not None and bb['y'] > h * 0.75, f'{tag} 付费墙：主按钮在拇指区')
    click(pg, pg.get_by_role('button', name='看完整对比')); pg.wait_for_timeout(1300)
    tb = pg.get_by_role('table', name='免费与 Pro 对比').bounding_box()
    ok(tb is not None and tb['y'] < h * 0.7, f'{tag} 付费墙：看完整对比 → 表就地展开并滚进视野')
    page_ok('paywall-table')
    click(pg, pg.get_by_role('radio', name=re.compile('^月度'))); pg.wait_for_timeout(300)
    ok(pg.get_by_role('button', name='开通月度', exact=True).count() == 1, f'{tag} 付费墙：选月度，主按钮跟着改')
    click(pg, pg.get_by_role('radio', name=re.compile('^年度'))); pg.wait_for_timeout(300)
    click(pg, pg.get_by_role('button', name='开通年度', exact=True)); pg.wait_for_timeout(1800)
    ok(pg.get_by_role('heading', name='欢迎加入 Milo Pro').count() == 1 and pg.get_by_text(re.compile(r'^年度会员 · \d{4} 年')).count() == 1, f'{tag} 开通成功：欢迎 + 到期日')
    pro = store()['pro']
    ok(len(pro) == 1 and pro[0]['plan'] == 'year', f'{tag} 开通成功：年度写进存储')
    page_ok('welcome')
    click(pg, pg.get_by_role('button', name='开始用')); pg.wait_for_url('**/me'); pg.wait_for_timeout(900)
    ok('到期' in row().inner_text(), f'{tag} 开通成功：「开始用」回到来源页，会员行写到期日')
    click(pg, row()); pg.wait_for_url('**/me/pro'); pg.wait_for_timeout(1600)
    page_ok('hub')
    ok(pg.get_by_role('region', name=re.compile('^Milo Pro 年度，已开通')).count() == 1, f'{tag} 会员中心：会员卡 已开通 + 到期')
    ok(pg.get_by_role('list', name='权益').get_by_role('button').count() == 4, f'{tag} 会员中心：四个权益入口都能点')
    ok(pg.locator('[class*=_glow_]').count() == 0, f'{tag} 会员中心：没有荧光主按钮（不制造再买点的压力）')
    # 高级分析 → 容量页直接打开练得最多那块的面板，「近 8 周 · 每周组数」块标题旁的 Pro（已开通 → 会员中心）
    click(pg, pg.get_by_role('button', name=re.compile('^高级分析'))); pg.wait_for_url('**/body?head=**'); pg.wait_for_timeout(1500)
    dlg = pg.get_by_role('dialog')
    ok(dlg.count() == 1 and dlg.get_by_text('近 8 周 · 每周组数').count() == 1 and dlg.get_by_role('img', name=re.compile('^近 8 周每周组数')).count() == 1, f'{tag} 高级分析：容量页打开肌头面板，有「近 8 周」')
    pg.go_back(); pg.wait_for_url('**/me/pro'); pg.wait_for_timeout(1200)
    click(pg, pg.get_by_role('button', name='管理订阅', exact=True)); pg.wait_for_timeout(500)
    ok(pg.get_by_role('alertdialog', name='切回免费？').count() == 1 and pg.get_by_text(re.compile('不收回')).count() == 1, f'{tag} 会员中心：切回免费先确认，写明已得的不收回')
    click(pg, pg.get_by_role('alertdialog').get_by_role('button', name='切回免费')); pg.wait_for_url('**/me'); pg.wait_for_timeout(700)
    ok(pg.get_by_text(re.compile('已切回免费')).count() == 1 and '7 天免费试用' in row().inner_text(), f'{tag} 切回免费：回我的 + 提示，会员行回到未开通')
    # 试用（先等「已切回免费」的轻提示走掉，它盖在拇指区）
    pg.wait_for_timeout(3200)
    click(pg, row()); pg.wait_for_url('**/pro'); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('radio', name=re.compile('^试用'))); pg.wait_for_timeout(300)
    click(pg, pg.get_by_role('button', name='开始 7 天试用', exact=True)); pg.wait_for_timeout(1200)
    ok(pg.get_by_text(re.compile('试用会员 · .+不自动扣费')).count() == 1, f'{tag} 试用：开通成功写不自动扣费')
    click(pg, pg.get_by_role('button', name='开始用')); pg.wait_for_url('**/me'); pg.wait_for_timeout(800)
    ok('试用中 · 还剩 7 天' in row().inner_text(), f'{tag} 试用：会员行写「试用中 · 还剩 7 天」')
    click(pg, row()); pg.wait_for_url('**/me/pro'); pg.wait_for_timeout(1200)
    page_ok('hub-trial')
    click(pg, pg.get_by_role('button', name='开通正式会员')); pg.wait_for_url('**/pro'); pg.wait_for_timeout(900)
    ok(pg.get_by_role('radio').count() == 2 and pg.get_by_text(re.compile('^试用还剩 \\d+ 天')).count() == 1, f'{tag} 试用中的付费墙：只剩月 / 年，写试用还剩几天')
    # 数据里的演示开关
    open_me()
    sw = pg.get_by_role('switch', name='会员状态')
    ok(sw.get_attribute('aria-checked') == 'true', f'{tag} 数据：试用中，会员开关是开的')
    sw.evaluate('e => e.scrollIntoView({ block: "center" })'); pg.wait_for_timeout(200); click(pg, sw); pg.wait_for_timeout(500)
    ok('月 ¥18 · 年 ¥128' in row().inner_text(), f'{tag} 数据：关掉 = 免费；用过试用，会员行写价格')
    # 钱包：用过免费试用、现在免费 → 兑换列表多一张「Pro 体验 7 天」，兑换即开通体验
    pg.wait_for_timeout(3000)
    click(pg, pg.get_by_role('button', name=re.compile('^钱包 · 商城'))); pg.wait_for_url('**/me/wallet'); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('button', name=re.compile('^兑换卡券'))); pg.wait_for_timeout(500)
    sheet = pg.get_by_role('dialog', name='兑换卡券')
    ok(sheet.get_by_role('button', name='兑换').count() == 4 and sheet.get_by_text('Milo Pro 体验 7 天').count() == 1, f'{tag} 钱包：用过试用后多一张 Pro 体验 7 天')
    page_ok('wallet-trial')
    click(pg, sheet.get_by_role('button', name='兑换').nth(3)); pg.wait_for_timeout(600)
    ok(pg.get_by_text(re.compile('已兑换：Milo Pro 体验 7 天')).count() == 1 and pg.get_by_text(re.compile('^已开通体验 · ')).count() == 1, f'{tag} 钱包：兑换 Pro 体验 → 提示 + 卡券记已用')
    ok(store()['pro'][-1]['plan'] == 'trial', f'{tag} 钱包：兑换 Pro 体验即开通 7 天体验')
    # 商品详情会员价旁的 Pro
    pg.goto(args.base + '/shop/item/belt-10'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('button', name=re.compile('查看会员中心'))); pg.wait_for_url('**/me/pro'); pg.wait_for_timeout(500)
    ok(pg.get_by_role('region', name=re.compile('^Milo Pro 试用，试用中')).count() == 1, f'{tag} 详情：体验中，会员价旁的 Pro 进会员中心')
    # 演示场景不写存储
    snap = json.dumps(store()['pro'])
    pg.goto(args.base + '/pro?scenario=plain-prescription'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    click(pg, pg.get_by_role('button', name='开通年度', exact=True)); pg.wait_for_timeout(900)
    ok(pg.get_by_role('heading', name='欢迎加入 Milo Pro').count() == 1 and json.dumps(store()['pro']) == snap, f'{tag} 场景：开通走完，不写本机存储')
    # 高级分析 · 动作对比：曲线页「对比 ＋ 选一个动作」→ 面板选同部位的动作 → 虚线叠上来、图下图例读两条；✕ 取消
    pg.goto(args.base + '/gains/barbell-squat-8?scenario=plain-prescription'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(1200)
    ok(pg.get_by_role('button', name=re.compile('Pro 的权益')).count() == 1, f'{tag} 动作对比：对比那一行右边有 Pro 标')
    click(pg, pg.get_by_role('button', name='对比 ＋ 选一个动作')); pg.wait_for_timeout(700)
    cmp_sheet = pg.get_by_role('dialog', name='对比另一个动作')
    ok(cmp_sheet.get_by_role('list', name='可以对比的动作').get_by_role('button').count() >= 1, f'{tag} 动作对比：面板列出同部位练过 2 次以上的动作')
    page_ok('compare-sheet')
    click(pg, cmp_sheet.get_by_role('list', name='可以对比的动作').get_by_role('button').first); pg.wait_for_timeout(900)
    ok(pg.get_by_role('img', name=re.compile('；对比.+（虚线）')).count() == 1 and pg.get_by_role('button', name='取消对比').count() == 1, f'{tag} 动作对比：选了以后虚线叠上来，图例读两条，能取消')
    page_ok('compare')
    click(pg, pg.get_by_role('button', name='取消对比')); pg.wait_for_timeout(400)
    ok(pg.get_by_role('button', name='对比 ＋ 选一个动作').count() == 1, f'{tag} 动作对比：✕ 取消后回到「选一个动作」')
    # 没有进账的新用户：通用对比表
    pg.goto(args.base + '/pro?scenario=cold-start'); pg.wait_for_selector('[class*=_scroll_]'); pg.wait_for_timeout(900)
    ok(pg.get_by_role('heading', name='练得更聪明一点').count() == 1 and pg.get_by_role('table', name='免费与 Pro 对比').count() == 1, f'{tag} 新用户：讲不出「你的」，退回通用对比表')
    page_ok('paywall-new')
    pg.close()

# 同 CONTRAST，但范围收到一个元素里（奖励卡）、不按视口裁
CONTRAST_IN = CONTRAST.replace("() => {", "(root) => {", 1).replace("document.createTreeWalker(document.body,", "document.createTreeWalker(root,").replace("if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;", "if (r.width === 0) continue;")

def guarded(name, fn, *a):
    """一个类别中途抛错（等不到元素、超时）不拖垮后面的：记一条，写明卡在这个脚本的哪一行"""
    try: fn(*a)
    except Exception as e:
        here = [f for f in traceback.extract_tb(e.__traceback__) if f.filename.endswith('shoot_6a.py')]
        at = f'第 {here[-1].lineno} 行 {here[-1].line}' if here else ''
        if len(here) > 1 and here[-1].name in ('click', 'tap', 'until', 'settle', 'audit'): at += f' ← 第 {here[-2].lineno} 行 {here[-2].line}'   # 卡在公用的点按 / 等待里时，写明是哪一步调的
        errors.append(f'{name} 中途出错：{str(e).splitlines()[0]}  @ {at}')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    _new_page = b.new_page
    def new_page(**kw):
        pg = _new_page(**kw); pg.set_default_timeout(args.timeout)
        if args.pace != 1:
            _wait = pg.wait_for_timeout
            pg.wait_for_timeout = lambda ms: _wait(ms if ms < 200 else ms * args.pace)   # 短等待（按压、过渡中途取样）不缩
        return pg
    b.new_page = new_page
    CHECKS = {'flow': lambda W, H, w: run(b, W, H, w == 360), 'story': lambda W, H, w: story_checks(b, W, H), 'deload': lambda W, H, w: deload_checks(b, W, H),
              'gains': lambda W, H, w: gains_checks(b, W, H), 'log': lambda W, H, w: log_checks(b, W, H), 'me': lambda W, H, w: me_checks(b, W, H),
              'shop': lambda W, H, w: shop_checks(b, W, H), 'pro': lambda W, H, w: pro_checks(b, W, H), 'light': lambda W, H, w: light_checks(b, W, H)}
    for c, w in jobs:
        W, H = SIZES[w]
        if c in CHECKS: guarded(f'{c} · {w}', CHECKS[c], W, H, w)
    # /demo 电脑版（只和 360 宽的那一份一起跑，不分宽度）
    if ('demo', 360) in jobs:
        def demo_desk():
            d = b.new_page(viewport={'width': 1440, 'height': 900})
            d.on('pageerror', lambda e: errors.append(f'demo pageerror: {e}'))
            d.goto(args.base + '/demo'); d.wait_for_selector('iframe'); d.wait_for_timeout(1500)
            ok(d.locator('iframe').count() == 1, '/demo 电脑版：手机里是 App')
            if not args.no_shots: d.screenshot(path=os.path.join(OUT, 'demo-desk.png'))
            # 「容量页的知识卡」一步：换一位腿练得多的用户 → 手机里容量页出护膝提示（主演示用户不触发）
            d.get_by_role('button', name='换一位腿练得多的用户').click(); d.wait_for_timeout(2500)
            f = d.frame_locator('iframe')
            ok(f.get_by_role('button', name=re.compile('护膝')).count() == 1, '/demo 电脑版：换一位腿练得多的用户 → 容量页出护膝知识卡')
            # 「连胜快断」一步：牛龄页出快断一行（没卡 → 兑一张 + Pro 每月送 2 张）；兑一张 → 钱包面板只放冻结卡 → 兑完回牛龄页，变成「有 1 张冻结卡」
            d.get_by_role('button', name='看连胜快断').click(); d.wait_for_timeout(2500)
            ok(f.get_by_role('region', name='连胜快断了').count() == 1 and f.get_by_role('button', name=re.compile('^Pro 每月送 2 张')).count() == 1, '/demo 电脑版：连胜快断 → 牛龄页出快断一行，两个出口')
            # 把手机里的按钮滚到手机屏幕中间再点（手机本身跟着页面滚动、停在屏幕里）
            d.evaluate('scrollTo(0, 0)'); f.get_by_role('button', name='兑一张冻结卡 · 800 牛劲').evaluate('e => e.scrollIntoView({ block: "center" })'); d.wait_for_timeout(300)
            f.get_by_role('button', name='兑一张冻结卡 · 800 牛劲').click(); d.wait_for_timeout(1000)
            ok(f.get_by_role('dialog', name='兑一张冻结卡').get_by_role('button', name='兑换').count() == 1, '/demo 电脑版：兑一张 → 钱包兑换面板只放冻结卡')
            d.evaluate('scrollTo(0, 0)'); f.get_by_role('dialog').get_by_role('button', name='兑换').click(); d.wait_for_timeout(1500)
            ok(f.get_by_text(re.compile('^有 1 张冻结卡')).count() == 1, '/demo 电脑版：兑完回牛龄页，快断一行变成「有 1 张冻结卡，连胜保住」')
        guarded('demo', demo_desk)
    b.close()

print(f'\n{"失败 " + str(len(errors)) + " 项" if errors else "全部通过"}')
for e in errors: print('  - ' + e)
sys.exit(1 if errors else 0)
