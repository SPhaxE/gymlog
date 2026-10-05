#!/usr/bin/env python3
"""阶段 5.5c 增长层录屏：奖励弹窗的完整编排 → screenshots/growth/reward-*.gif（各组件的静态截图由 shoot_playground.py 出，在 screenshots/stage5/components/）。
录屏用 Playwright 的视频（25 帧 / 秒），再从视频里按真实时间取帧，比逐张截图准。需要 dev server（--base）。"""
import argparse, glob, os, shutil, tempfile
import cv2
from PIL import Image
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:5199')
ap.add_argument('--chromium', default='/opt/pw-browsers/chromium')
args = ap.parse_args()
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'screenshots', 'growth')
os.makedirs(OUT, exist_ok=True)
NOW = 1791050400000
CLIPS = [('升段', 'stage', 3.4), ('升段 · Milo', 'milo', 3.4), ('破纪录', 'pr', 2.6), ('连胜里程碑', 'streak', 2.6), ('升级', 'level', 2.2)]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=args.chromium if os.path.exists(args.chromium) else None)
    for btn, name, secs in CLIPS:
        vd = tempfile.mkdtemp()
        ctx = b.new_context(viewport={'width': 480, 'height': 860}, record_video_dir=vd, record_video_size={'width': 480, 'height': 860})
        pg = ctx.new_page()
        pg.goto(f'{args.base}/playground?now={NOW}'); pg.wait_for_timeout(2500)
        st = pg.locator('[aria-label="奖励演示"]'); st.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
        box = st.bounding_box()
        st.get_by_role('button', name=btn, exact=True).click()
        pg.wait_for_timeout(int(secs * 1000) + 300)
        ctx.close()
        cap = cv2.VideoCapture(glob.glob(os.path.join(vd, '*.webm'))[0])
        frames = []
        while True:
            ok, f = cap.read()
            if not ok: break
            frames.append(f)
        x, y, w, h = [max(0, int(v)) for v in (box['x'], box['y'], box['width'], box['height'])]
        clip = frames[-int((secs + 0.3) * 25):]
        sw, sh = int(w * 0.6), int(h * 0.6)  # 缩到 60%、调色板 96 色，单个 GIF 控制在 1–2 MB
        ims = [Image.fromarray(cv2.cvtColor(cv2.resize(f[y:y + h, x:x + w], (sw, sh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)).quantize(96, method=Image.Quantize.MEDIANCUT) for f in clip[::2]]
        ims += [ims[-1]] * 12  # 定格停一会儿
        ims[0].save(os.path.join(OUT, f'reward-{name}.gif'), save_all=True, append_images=ims[1:], duration=80, loop=0, optimize=True)
        shutil.rmtree(vd, ignore_errors=True)
        print('saved', f'screenshots/growth/reward-{name}.gif')
    b.close()
