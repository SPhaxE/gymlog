"""深色逐像素回归（2026-10-10 从 scratchpad 收进仓库，之前每个窗口都要重写）：
  python3 scripts/regress_dark.py shoot <base_url> <out_dir>  |  python3 scripts/regress_dark.py compare <dirA> <dirB>
  基线 = 改动前提交的构建（`git stash` / 旧提交 `npm run build` 后 `cp -r dist /tmp/base_dist`，`npx vite preview --outDir /tmp/base_dist --port 4174`），候选 = 当前构建（拷一份到别的目录，边改边构建不影响回归）。
  环境变量：ROUTES_ONLY=1 只拍页面；PG_ONLY=1 只拍 /playground；ONLY_DARK_CELLS=1 隐藏浅色格和说明文字。
  compare 默认容差 6（差 > 6 的像素才算），可加第 4 个参数改。已知噪声：RestDock（休息倒计时弧）、钢板固定光源、/playground 个别格 1–80 个像素的动画 / 懒加载抖动；页面（today / body / gains / log / me / shop / pro / 故事）必须 0 差异。
冻结动画 / 过渡、隐藏 canvas、固定 Math.random 种子、Playwright 假时钟；/preview 按 data-option 逐格、/playground 按 section#id 逐段截。"""
import sys, os, json, asyncio, io
from playwright.async_api import async_playwright

ROUTES = [] if os.environ.get('PG_ONLY') else ['/onboarding?scene=4'] if os.environ.get('ONLY_DARK_CELLS') else ['/today', '/body', '/gains', '/log', '/me', '/me/level', '/shop', '/pro', '/summary/demo'] + [f'/onboarding?scene={k}' for k in range(1, 9)]
SC = 'scenario=plain-prescription'
FREEZE = """*, *::before, *::after { animation-play-state: paused !important; animation-delay: -0.0001s !important; animation-duration: 0.0001s !important; animation-iteration-count: 1 !important; transition: none !important; caret-color: transparent !important; }
canvas { visibility: hidden !important; }"""
HIDE = "[data-theme='light'], section > p, section > header p, figcaption span { visibility: hidden !important; }"
SEED = """(() => { let a = 12345; Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; })();"""

async def prep(pg, url, wait=2500, clear=False):
    await pg.goto(url)
    if clear:
        await pg.evaluate('localStorage.clear()'); await pg.goto(url)
    await pg.wait_for_timeout(wait)
    await pg.add_style_tag(content=FREEZE + (HIDE if os.environ.get('ONLY_DARK_CELLS') else ''))
    await pg.evaluate("document.querySelectorAll('svg').forEach((s) => { try { s.pauseAnimations(); s.setCurrentTime(0); } catch (e) {} })")
    await pg.wait_for_timeout(300)

async def shoot(base, out):
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium', args=['--no-sandbox', '--disable-gpu-vsync'])
        async def page(w=390, h=844):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, reduced_motion='reduce')
            await ctx.add_init_script(SEED)
            pg = await ctx.new_page(); await pg.clock.install(time=1760000000000); return pg
        for r in ROUTES:
            pg = await page()
            url = base + r + ('&' if '?' in r else '?') + SC
            await prep(pg, url, clear=r.startswith('/onboarding'), wait=3500 if r.startswith('/onboarding') else 2500)
            await pg.screenshot(path=f'{out}/{r.strip("/").replace("/", "_").replace("?", "_").replace("=", "")}.png'); await pg.context.close()
        if os.environ.get('ROUTES_ONLY'):
            await b.close(); print('shot', len(os.listdir(out))); return
        if os.environ.get('PG_ONLY'): keys = []
        else:
          pass
        # /preview：每个 data-option 一格
        pg = await page(1500, 1000); await prep(pg, base + '/preview', wait=6000 if not os.environ.get('PG_ONLY') else 500)
        keys = await pg.evaluate("[...document.querySelectorAll('[data-option]')].map((e) => e.dataset.option)")
        for k in ([] if os.environ.get('PG_ONLY') else dict.fromkeys(keys)):
            el = pg.locator(f'[data-option="{k}"]').first
            try: await el.scroll_into_view_if_needed(); await el.screenshot(path=f'{out}/preview__{k}.png')
            except Exception as e: print('skip', k, str(e)[:60])
        await pg.context.close()
        # /playground：每个 section 一段
        pg = await page(900, 1000); await prep(pg, base + '/playground', wait=9000)
        ids = await pg.evaluate("[...document.querySelectorAll('section[id]')].map((e) => e.id)")
        for k in dict.fromkeys(ids):
            el = pg.locator(f'section[id="{k}"]').first
            try: await el.scroll_into_view_if_needed(); await el.screenshot(path=f'{out}/pg__{k}.png')
            except Exception as e: print('skip', k, str(e)[:60])
        await pg.context.close(); await b.close()
    print('shot', len(os.listdir(out)))

def compare(a, b, tol=6):
    """逐文件比：差 > tol 的像素数（默认 6，滤掉抗锯齿 / 动画抖动）；尺寸不同直接报"""
    import numpy as np
    from PIL import Image
    fa, fb = set(os.listdir(a)), set(os.listdir(b)); same = 0; bad = []
    for f in sorted(fa & fb):
        A, B = Image.open(f'{a}/{f}').convert('RGB'), Image.open(f'{b}/{f}').convert('RGB')
        if A.size != B.size: bad.append((f, 'size', A.size, B.size)); continue
        d = np.abs(np.asarray(A, dtype=int) - np.asarray(B, dtype=int)).max(axis=2); n = int((d > tol).sum())
        if n: bad.append((f, n, int(d.max())))
        else: same += 1
    print(f'一致 {same}  不一致 {len(bad)}  只在基线 {sorted(fa - fb)[:6]}  只在候选 {len(fb - fa)} 个')
    for x in bad: print('  ✗', *x)

if __name__ == '__main__':
    if sys.argv[1] == 'shoot': asyncio.run(shoot(sys.argv[2], sys.argv[3]))
    else: compare(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 6)
