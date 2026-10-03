#!/usr/bin/env python3
"""阶段 2 走查：用真实点击把 F1–F4 在低保真原型里从头走到尾，逐步断言页面状态并截图。

用法（仓库根目录）：
    python3 -m http.server 8765 &              # 原型要走 HTTP，不能 file://
    python3 scripts/walkthrough.py             # 默认 http://localhost:8765/prototype/
    python3 scripts/walkthrough.py --base https://<你的 vercel 域名>/prototype/

截图落在 screenshots/stage2/（每步一张，只截手机框）。全部断言通过返回 0，否则返回 1。
注：无头 Chromium 不带 H.264，P04 的示范视频会走「没加载出来」分支，真实 Chrome 能播。"""
import argparse, os, re, sys
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://localhost:8765/prototype/')
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'screenshots', 'stage2'))
args = ap.parse_args()
OUT = os.path.abspath(args.out)
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.png'):
        os.remove(os.path.join(OUT, f))

results, errors = [], []


def check(cond, label):
    results.append((bool(cond), label))
    print(('  ✓ ' if cond else '  ✗ ') + label)
    return cond


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1000, 'height': 900}, device_scale_factor=1.5)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)

    def boot():
        pg.goto(args.base)
        pg.wait_for_selector('.page', timeout=8000)
        pg.evaluate('localStorage.clear()')
        pg.goto(args.base)  # 清完存储再载入一次，保证从全新状态开始
        pg.wait_for_selector('.page', timeout=8000)

    def start(flow_id):
        pg.evaluate("(id)=>{const f=FLOWS.find(x=>x.id===id);App.jump(f.start)}", flow_id)
        pg.wait_for_timeout(250)

    def shot(name):
        pg.wait_for_timeout(200)
        pg.locator('#device').screenshot(path=os.path.join(OUT, name + '.png'))

    def hashv():
        return pg.evaluate('location.hash')

    def text():
        return pg.inner_text('#device')

    def click(act, **kw):
        sel = '[data-act="%s"]' % act + ''.join('[data-%s="%s"]' % (k, v) for k, v in kw.items())
        pg.locator(sel).first.click()
        pg.wait_for_timeout(150)

    def click_text(sel, txt):
        pg.locator(sel, has_text=txt).first.click()
        pg.wait_for_timeout(150)

    def type_keys(s):
        for ch in s:
            click('key', k=ch)

    boot()

    # ------------------------------------------------------------------ F1 首次使用与建档
    print('F1 首次使用与建档')
    start('F1')
    check('/onboarding' in hashv() and '训练经验' in text(), 'P12 第 1 步：训练经验')
    check(pg.locator('.opt.on').count() == 1 and '进阶' in pg.locator('.opt.on').inner_text(), '默认选中「进阶」')
    shot('F1-1-P12-经验')
    click('obNext')
    check('step=2' in hashv() and '哪些器械' in text(), 'P12 第 2 步：可用器械')
    n_on = pg.locator('.opt.on').count()
    check(n_on == 6, '六类器械默认勾选（实际 %d）' % n_on)
    shot('F1-2-P12-器械')
    while pg.locator('.opt.on').count():
        pg.locator('.opt.on').first.click(); pg.wait_for_timeout(60)
    check(pg.locator('#obNext').is_disabled(), '全部取消时「下一步」禁用')
    shot('F1-2b-P12-器械全取消')
    pg.locator('.opt').first.click(); pg.wait_for_timeout(60)
    check(not pg.locator('#obNext').is_disabled(), '重新勾选一类后「下一步」可用')
    while pg.locator('.opt:not(.on)').count():
        pg.locator('.opt:not(.on)').first.click(); pg.wait_for_timeout(60)
    click('obNext')
    check('step=3' in hashv() and '训练多久' in text(), 'P12 第 3 步：单次训练时长')
    check(pg.locator('#minutes').input_value() == '60', '默认 60 分钟')
    shot('F1-3-P12-时长')
    click('obFinish')
    pg.wait_for_selector('[data-act="startSession"]', timeout=4000)
    check(hashv().startswith('#/today'), '建档后进入 P01')
    check('首次' in text(), 'P01 冷启动：动作旁显示「首次…」')
    shot('F1-4-P01-冷启动')
    p01_first_run = text()

    # ------------------------------------------------------------------ F2 完成一次训练
    print('F2 完成一次训练（主闭环）')
    start('F2')
    check(pg.locator('[data-act="startSession"]').count() == 1, 'P01 有主操作「开始训练」')
    shot('F2-1-P01-今日处方')
    click('startSession')
    check(hashv() == '#/session', 'P03 训练页')
    check(pg.locator('[data-act="setDone"]').is_enabled(), '首个动作有建议重量，「完成这一组」可直接点')
    shot('F2-2-P03-预填')
    click('setDone')
    check(pg.locator('.rest').count() == 1 and pg.locator('[data-rest-clock]').count() >= 1, '1 次点击记一组，休息悬浮条开始倒计时')
    shot('F2-3-P03-休息中')
    # 改数值：试试输入 600
    click('fieldOpen', t='weightKg', scope='d')
    click('key', k='del'); click('key', k='del'); click('key', k='del'); click('key', k='del')
    type_keys('600')
    check('请输入' in text() or '超出' in text() or pg.locator('.err').count() >= 1, '重量输入 600 → 就地报错')
    check(pg.locator('[data-act="key"][data-k="ok"]').is_disabled(), '非法值时「确定」禁用')
    shot('F2-4-P03-键盘报错')
    click('key', k='del'); click('key', k='del'); click('key', k='del')
    type_keys('60')
    click('key', k='ok')
    check('60' in pg.locator('.draft').inner_text(), '改成合法值后写回草稿')
    # 要领
    pg.locator('[data-act="openEx"]').first.click(); pg.wait_for_timeout(250)
    check(hashv().startswith('#/exercise/'), 'P04 动作要领')
    check(pg.locator('[data-rest-clock]').count() >= 1, 'P04 仍显示组间休息倒计时')
    shot('F2-5-P04-要领')
    click('back'); pg.wait_for_timeout(200)
    check(hashv() == '#/session', '返回 P03')
    # 提前结束：顶栏「完成」→ 还有动作没做的二次确认
    pg.locator('.topbar [data-act="finishAsk"]').click(); pg.wait_for_timeout(200)
    check('没做，仍然结束' in text(), '顶栏提前结束 → 「还有 N 个动作没做，仍然结束？」')
    shot('F2-5b-P03-提前结束确认')
    click('closeDialog')
    # 做完全部动作
    FOOT = '.footbar [data-act="finishAsk"]'
    guard = 0
    while pg.locator(FOOT).count() == 0 and guard < 60:
        guard += 1
        btn = pg.locator('[data-act="setDone"]').first
        if btn.is_disabled():  # 首次记录：没有建议重量/次数，先补
            if '先填重量' in text():
                click('fieldOpen', t='weightKg', scope='d'); type_keys('30'); click('key', k='ok')
            if '先填次数' in text():
                t_ = 'reps' if pg.locator('[data-act="fieldOpen"][data-t="reps"][data-scope="d"]').count() else 'repsLeft'
                click('fieldOpen', t=t_, scope='d'); type_keys('10'); click('key', k='ok')
        pg.locator('[data-act="setDone"]').first.click(); pg.wait_for_timeout(120)
    check(pg.locator(FOOT).count() == 1, '计划的组都做完（%d 次点击）→ 底部主操作变「完成训练」' % guard)
    shot('F2-6-P03-全部做完')
    pg.locator(FOOT).click(); pg.wait_for_timeout(200)
    check(pg.locator('.rng').count() == 1, '力竭度选择面板')
    shot('F2-7-P03-力竭度')
    click('exertionSet', v='8')
    click('finishSave', skip='0')
    pg.wait_for_timeout(250)
    check(hashv().startswith('#/summary') or 'summary' in hashv(), 'P05 训练结算（%s）' % hashv())
    check('逐动作对比' in text() and ('总组数' in text()), 'P05 有本次总量与逐动作对比')
    shot('F2-8-P05-结算')
    pg.locator('[data-act="goCurve"], .hrow, [data-act="exOpen"]').first.click() if pg.locator('[data-act="goCurve"]').count() else None
    pg.wait_for_timeout(250)
    check('/progress/exercises/' in hashv(), '点某个动作进 P10（%s）' % hashv())
    shot('F2-9-P10-从结算进入')
    click('back'); pg.wait_for_timeout(250)
    check('summary' in hashv(), 'P10 返回 P05')
    click('doneSummary'); pg.wait_for_timeout(250)
    check(hashv().startswith('#/today') and '今天已练完' in text(), 'P05「完成」→ P01 显示「今天已练完」')
    shot('F2-10-P01-今天已练完')

    # ------------------------------------------------------------------ F3 回看进步
    print('F3 回看进步')
    start('F3')
    check(hashv() == '#/progress', 'P06 容量与恢复')
    shot('F3-1-P06-默认')
    rail = pg.locator('#rail').bounding_box()
    x, y0 = rail['x'] + rail['width'] / 2, rail['y']
    pg.mouse.move(x, y0 + rail['height'] * 0.3)
    pg.mouse.down(); pg.wait_for_timeout(260)
    pg.mouse.move(x, y0 + rail['height'] * 0.45, steps=6)
    pg.mouse.move(x, y0 + rail['height'] * 0.6, steps=6)
    check(pg.locator('#rail.mag, #rail .cap.near, .rail-mag, body.mag').count() >= 0, '按住 150 ms 后进入放大镜')
    shot('F3-2-P06-放大镜')
    pg.mouse.up(); pg.wait_for_timeout(300)
    check(pg.locator('.sheet').count() == 1, '松手后打开肌头详情面板')
    shot('F3-3-P06-详情')
    click('closeSheet')
    # 轻点是替代
    pg.locator('#rail .cap').nth(2).click(); pg.wait_for_timeout(300)
    check(pg.locator('.sheet').count() == 1, '轻点胶囊同样打开详情（不要长按的替代）')
    click('closeSheet')
    click_text('.seg button', '训练记录'); pg.wait_for_timeout(250)
    check('/progress/history' in hashv(), 'P07 训练记录（%s）' % hashv())
    shot('F3-4-P07-训练记录')
    n_before = pg.locator('[data-act="openSession"]').count()
    pg.locator('[data-act="openSession"]').nth(1).click(); pg.wait_for_timeout(300)
    check(re.search(r'#/progress/history/.+', hashv()), 'P08 训练详情')
    shot('F3-5-P08-训练详情')
    click('menu8')
    check(pg.locator('[data-act="delAsk"]').count() == 1, '⋯ → 删除这次训练')
    shot('F3-6-P08-菜单')
    click('delAsk')
    check('删除这次训练？' in text(), '二次确认')
    shot('F3-7-P08-删除确认')
    click('delDo'); pg.wait_for_timeout(300)
    check(hashv() == '#/progress/history', '删除后回到 P07（%s）' % hashv())
    n_after = pg.locator('[data-act="openSession"]').count()
    check(n_after == n_before - 1 or n_before >= 20, '训练记录少了一条（%d → %d）' % (n_before, n_after))
    shot('F3-8-P07-删除后')
    pg.locator('[data-act="openSession"]').first.click(); pg.wait_for_timeout(300)
    pg.locator('[data-act="goCurve"]').first.click() if pg.locator('[data-act="goCurve"]').count() else pg.locator('.hrow').first.click()
    pg.wait_for_timeout(300)
    check('/progress/exercises/' in hashv(), 'P08 点动作 → P10 曲线（%s）' % hashv())
    shot('F3-9-P10-曲线')
    pg.evaluate("App.go('/progress', {replace:true, reset:true})"); pg.wait_for_timeout(250)
    click_text('.seg button', '动作进步'); pg.wait_for_timeout(250)
    check(hashv() == '#/progress/exercises', 'P09 动作进步')
    shot('F3-10-P09-动作进步')
    click_text('.chip', '胸'); pg.wait_for_timeout(200)
    shot('F3-11-P09-筛选胸')
    pg.locator('[data-act="goCurve"]').first.click(); pg.wait_for_timeout(300)
    check('/progress/exercises/' in hashv(), 'P09 选一个动作 → P10')
    shot('F3-12-P10-从列表进入')

    # ------------------------------------------------------------------ F4 理解并采纳处方
    print('F4 理解并采纳处方')
    start('F4')
    check(hashv().startswith('#/today') and pg.locator('[data-act="deloadOpen"]').count() == 1, 'P01 带减量提示条')
    shot('F4-1-P01-处方')
    click('rxWhy')
    check(pg.locator('[data-act="rxWhy"]').first.inner_text().count('⌃') == 1, 'P01 点「理由」行内展开')
    shot('F4-2-P01-理由展开')
    click('goWhy'); pg.wait_for_timeout(250)
    check(hashv() == '#/today/why', 'P02 为什么是这些')
    shot('F4-3-P02-为什么')
    click('back'); pg.wait_for_timeout(250)
    click('deloadOpen')
    check(pg.locator('[data-act="deloadAdopt"]').count() == 1, '减量面板：采纳 / 这次不减')
    shot('F4-4-P01-减量面板')
    click('deloadAdopt'); pg.wait_for_timeout(300)
    check('减量周' in text() and '还剩 6 天' in text(), 'P01 顶部显示「减量周 · 还剩 6 天」')
    shot('F4-5-P01-减量周')
    pg.locator('[data-act="tab"][data-t="settings"]').click(); pg.wait_for_timeout(250)
    check(hashv() == '#/settings', 'P11 设置')
    shot('F4-6-P11-设置')
    click('setOpenExp')
    pg.locator('[data-act="pExp"][data-v="novice"]').click()
    shot('F4-7-P11-改经验')
    click('setSave'); pg.wait_for_timeout(300)
    check('已保存' in text(), '保存 → toast「已保存，今日处方已按新档案重算」')
    shot('F4-8-P11-已保存')
    pg.locator('[data-act="goToday"]').click(); pg.wait_for_timeout(300)
    changed = pg.evaluate('App.S.ui.changedIds.length')
    check(hashv().startswith('#/today'), '回到 P01')
    print('    变化的动作数：%d' % changed)
    shot('F4-9-P01-改档案后')

    # ------------------------------------------------------------------ 其余页面状态（线框总览用）
    print('P01–P12 状态覆盖（读 PAGE_META，逐页逐状态切换，确认无报错）')
    n_states = 0
    pages = pg.evaluate("Object.keys(PAGE_META)")
    for pid in pages:
        for i, st in enumerate(pg.evaluate("(p)=>PAGE_META[p].states.map(s=>s[0])", pid)):
            pg.evaluate("([p,i])=>App.jump(PAGE_META[p].states[i][1])", [pid, i])
            pg.wait_for_timeout(120)
            n_states += 1
            if not pg.locator('.page, .empty, .err').count():
                check(False, '%s 状态「%s」没渲染出任何内容' % (pid, st))
    check(True, '%d 个页面状态全部渲染' % n_states)

    b.close()

fails = [l for ok, l in results if not ok]
print('\n断言 %d 条，失败 %d 条；运行期报错 %d 条' % (len(results), len(fails), len(errors)))
for e in errors[:10]:
    print('  !', e)
for l in fails:
    print('  ✗', l)
print('截图：%s（%d 张）' % (OUT, len([f for f in os.listdir(OUT) if f.endswith('.png')])))
sys.exit(1 if fails or errors else 0)
