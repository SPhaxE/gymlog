#!/usr/bin/env python3
"""阶段 5 门禁（运行时）：/playground 全部组件 × 全部交互态 + App 壳 5 个 Tab。
- 变体数：页面上的 [data-variant] 个数 = 目录总数（data-total），且键不重复
- 交互：记组 → 自动开始休息；导航点「身体」→ 当前页移动；删除训练 → 对话框，Esc 关闭且焦点回到触发按钮
- App：/today /body /gains /log /me 在 360 宽下无横向溢出、无页面错误
- 截图：screenshots/stage5/components/<组件>.png（每个组件一张）、screenshots/stage5/app/<路由>.png、report.json
用法：先 npx vite --port 5199，再 python3 scripts/shoot_playground.py"""
import argparse, json, os, re, sys
from datetime import datetime
from playwright.sync_api import sync_playwright

NOW = int(datetime(2026, 10, 3, 18, 0).timestamp() * 1000)
ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default=os.environ.get('CHROMIUM', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'))
ap.add_argument('--no-shots', action='store_true')
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'screenshots', 'stage5')
errors, report = [], {'now': NOW}

def ok(cond, msg):
    report.setdefault('checks', []).append({'ok': bool(cond), 'check': msg})
    print(('  ✓ ' if cond else '  ✗ ') + msg)
    if not cond: errors.append(msg)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)

    # ---------- Playground ----------
    pg = b.new_page(viewport={'width': 1280, 'height': 900}, device_scale_factor=1.5)
    pg.on('pageerror', lambda e: errors.append(f'playground: {e}'))
    pg.on('console', lambda m: m.type == 'error' and errors.append(f'playground console: {m.text} @ {m.location.get("url", "")}'))
    pg.goto(f'{args.base}/playground?now={NOW}')
    pg.wait_for_selector('[data-total]'); pg.wait_for_timeout(2500)
    total = int(pg.get_attribute('[data-total]', 'data-total'))
    keys = pg.eval_on_selector_all('[data-variant]', 'els => els.map(e => e.dataset.variant)')
    report['variants'] = total; report['components'] = pg.eval_on_selector_all('section[id]', 'els => els.length')
    ok(len(keys) == total, f'变体数：页面 {len(keys)} = 目录 {total}')
    ok(len(set(keys)) == len(keys), '变体键不重复')
    ok(pg.eval_on_selector_all('[data-variant] [data-pressed]', 'e => e.length') > 0 and pg.eval_on_selector_all('[data-variant] [data-focus]', 'e => e.length') > 0, '按下 / 聚焦态已强制显示')

    # 记组：完成第 1 组 → 休息条出现
    demo = pg.locator('[aria-label="记组演示"]')
    demo.get_by_role('button', name='完成').first.click(); pg.wait_for_timeout(400)
    ok(demo.get_by_role('timer').count() == 1, '记组：完成一组后自动开始组间休息')
    before = demo.get_by_role('timer').get_attribute('aria-label')
    demo.get_by_role('button', name='多休息 15 秒').click(); pg.wait_for_timeout(300)
    ok(demo.get_by_role('timer').get_attribute('aria-label') != before, '休息 +15 秒生效')
    # 行内报错：把当前组重量改成 620
    demo.locator('input').first.fill('620'); pg.wait_for_timeout(200)
    ok(demo.get_by_text('最多 500 kg').count() >= 1 and demo.get_by_role('button', name='完成').first.is_disabled(), '记组：超范围行内报错且「完成」禁用')

    # 导航：点「身体」
    nd = pg.locator('[aria-label="导航演示"]')
    nd.get_by_role('link', name='容量').click(); pg.wait_for_timeout(400)
    ok(nd.locator('[aria-current="page"]').get_attribute('href') == '/body', '导航：点「身体」后当前页移到身体')
    nd.get_by_role('button', name='开始休息 2:00').click(); pg.wait_for_timeout(400)
    ok('休息剩余' in (nd.locator('[aria-current="page"]').get_attribute('aria-label') or ''), '导航：休息时选中项读出剩余时间')

    # 对话框：Esc 关闭，焦点回到触发按钮
    fd = pg.locator('[aria-label="反馈演示"]')
    trigger = fd.get_by_role('button', name='删除训练')
    trigger.click(); pg.wait_for_timeout(400)
    ok(fd.get_by_role('alertdialog').count() == 1, '对话框打开')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    ok(fd.get_by_role('alertdialog').count() == 0, '对话框：Esc 关闭')
    ok(pg.evaluate('document.activeElement && document.activeElement.textContent') == '删除训练', '对话框：关闭后焦点回到「删除训练」')

    # 奖励弹窗：升段打开（role=dialog，名字里有「升段」），点一下跳到定格，Esc 关闭；「练到下一个奖励」由引擎算出并弹出
    rd = pg.locator('[aria-label="奖励演示"]')
    rd.scroll_into_view_if_needed()
    rd.get_by_role('button', name='升段', exact=True).click(); pg.wait_for_timeout(400)
    ok(rd.get_by_role('dialog', name=re.compile('升段')).count() == 1, '奖励弹窗：升段打开')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    ok(rd.get_by_role('dialog').count() == 0, '奖励弹窗：Esc 关闭')
    rd.get_by_role('button', name='练到下一个奖励').click(); pg.wait_for_timeout(800)
    ok(rd.get_by_role('dialog').count() == 1, '奖励弹窗：引擎算出下一个奖励并弹出')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)

    if not args.no_shots:
        os.makedirs(os.path.join(OUT, 'components'), exist_ok=True)
        pg.set_viewport_size({'width': 2300, 'height': 1000})  # 矩阵最宽的（导航 5 列 × 360）完整入镜
        pg.goto(f'{args.base}/playground?now={NOW}'); pg.wait_for_timeout(2500)
        for sid in pg.eval_on_selector_all('section[id]', 'els => els.map(e => e.id)'):
            el = pg.locator(f'section[id="{sid}"]')
            el.scroll_into_view_if_needed(); pg.wait_for_timeout(150)
            el.screenshot(path=os.path.join(OUT, 'components', f'{sid}.png'))
        print('saved component shots →', os.path.relpath(os.path.join(OUT, 'components'), ROOT))
    pg.close()

    # ---------- App 壳 ----------
    # 首页、容量页带演示场景（不带时读本机存储，没建档会进故事引导）
    routes = [('today', '/today?scenario=plain-prescription'), ('body', '/body?scenario=done-today'), ('gains', '/gains?scenario=plain-prescription'), ('log', '/log?scenario=plain-prescription'), ('me', '/me?scenario=plain-prescription')]
    os.makedirs(os.path.join(OUT, 'app'), exist_ok=True)
    for name, url in routes:
        ap_ = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
        ap_.on('pageerror', lambda e, n=name: errors.append(f'{n}: {e}'))
        ap_.goto(f'{args.base}{url}{"&" if "?" in url else "?"}now={NOW}'); ap_.wait_for_timeout(1200)
        sw = ap_.evaluate('document.documentElement.scrollWidth')
        ok(sw <= 360, f'{url}：无横向溢出（{sw}）')
        ok(ap_.get_by_role('navigation', name='主导航').count() == 1, f'{url}：有主导航')
        if not args.no_shots: ap_.screenshot(path=os.path.join(OUT, 'app', f'{name}.png'))
        ap_.close()
    # Tab 切换不整页刷新
    ap_ = b.new_page(viewport={'width': 360, 'height': 800}, device_scale_factor=2)
    ap_.goto(f'{args.base}/today?scenario=plain-prescription&now={NOW}'); ap_.wait_for_timeout(800)
    ap_.evaluate('window.__marker = 1')
    ap_.get_by_role('link', name='增量').click(); ap_.wait_for_timeout(400)
    ok(ap_.evaluate('location.pathname') == '/gains' and ap_.evaluate('window.__marker') == 1, 'Tab 切换走路由，不整页刷新')
    ap_.close()
    b.close()

report['errors'] = errors
os.makedirs(OUT, exist_ok=True)
json.dump(report, open(os.path.join(OUT, 'report.json'), 'w'), ensure_ascii=False, indent=2)
if errors:
    print('失败：', *errors, sep='\n  '); sys.exit(1)
print(f'通过：{report["components"]} 个组件、{report["variants"]} 个变体')
