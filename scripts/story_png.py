#!/usr/bin/env python3
"""初见引导素材（2026-10-06）：用户按 design/brand/prompts/nanobanana-milo-story.md 用 Nano Banana 出图，这里挑图、清理、抠图、导出。

来源（docs/story/，由用户上传的 12 张整理而来；备选放在 docs/story/alt/）：
  M1–M6.jpg   米洛（Milo）6 个姿势（品红底）
  S1-far.jpg  远景（铺满，不抠）· S1-mid.jpg 中景（品红底）· S1-near.jpg 近景（品红底，上方一团烟雾要先裁掉）· S2.jpg 奥林匹亚拱门（品红底）
流程：
  - 人物：品红键（min(R, B) − G，同商城图）反解边缘，只留最大的一块（扛公牛那张左边有一团粉光，和人物不连，自动去掉；扛小牛那张脚下的淡紫影子按品红键也会扣掉），
    裁到人物外框，6 张按同一个比例缩放（原图里米洛画得一样大，逐张量比例反而不稳），导出 public/story/<编号>.webp（App 用）+ design/brand/story/<编号>.png（母版）。
  - 场景：远景只缩放；中景、近景、拱门同样品红键抠图；近景只保留地面那一条（上方的烟雾带整段裁掉）。
  - 导出 src/pages/storyAssets.ts：每张的宽高、人物的地面线。

  python3 scripts/story_png.py
依赖：numpy、opencv-python-headless、Pillow。"""
import json, os, sys
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mascot_png import bg_color, dist, feather, matte  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'docs', 'story')
PUB = os.path.join(ROOT, 'public', 'story')
MASTER = os.path.join(ROOT, 'design', 'brand', 'story')
FIG_H = 720          # 米洛站直（M1）导出后的身高（像素）；其余姿势按同一个比例
SCENE_W = 2400       # 场景层导出宽度


def key_cutout(img, keep_largest=True, crop_top=0.0, top_bg=False):
    """品红底抠图；crop_top：从上往下这一段整段丢掉（近景的烟雾带）；top_bg：底色只从顶边取（场景层下边是地面）"""
    img = img.copy()
    bg = np.median(img[:8].reshape(-1, 3), 0) if top_bg else bg_color(img)
    if crop_top:
        y = int(img.shape[0] * crop_top); img[:y] = bg.astype(np.uint8)
    d = dist(img, bg)
    m = (cv2.GaussianBlur(d, (0, 0), 1.5) > 40).astype(np.uint8)
    if keep_largest:
        cnt, cc, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
        k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        m = (cc == k).astype(np.uint8)
    mem = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))).astype(bool)
    return matte(img, bg, mem, hi=200, lo=12, key='magenta', shrink=1, open_bg_holes=True)


def trim(rgba, pad=8):
    ys, xs = np.nonzero(rgba[:, :, 3] > 8)
    return rgba[max(0, ys.min() - pad):ys.max() + pad + 1, max(0, xs.min() - pad):xs.max() + pad + 1]


def save(rgba, name, w=None):
    if w: rgba = cv2.resize(rgba, (w, int(round(rgba.shape[0] * w / rgba.shape[1]))), interpolation=cv2.INTER_AREA)
    rgba = feather(rgba) if rgba.shape[2] == 4 else rgba
    mode = cv2.COLOR_BGRA2RGBA if rgba.shape[2] == 4 else cv2.COLOR_BGR2RGB
    pil = Image.fromarray(cv2.cvtColor(rgba, mode))
    pil.save(os.path.join(PUB, name + '.webp'), quality=88, method=6)
    pil.save(os.path.join(MASTER, name + '.png'), optimize=True)
    return pil.size


def main():
    os.makedirs(PUB, exist_ok=True); os.makedirs(MASTER, exist_ok=True)
    meta = {}
    figs = {k: trim(key_cutout(cv2.imread(os.path.join(SRC, k + '.jpg')))) for k in ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']}
    s = FIG_H / figs['M1'].shape[0]
    for k, rgba in figs.items():
        size = save(rgba, k, int(round(rgba.shape[1] * s)))
        meta[k] = {'w': size[0], 'h': size[1]}
        print(k, size)
    far = cv2.imread(os.path.join(SRC, 'S1-far.jpg'))
    meta['S1-far'] = dict(zip(('w', 'h'), save(far, 'S1-far', SCENE_W)))
    for k, crop in (('S1-mid', 0.0), ('S1-near', 0.69)):
        rgba = key_cutout(cv2.imread(os.path.join(SRC, k + '.jpg')), keep_largest=False, crop_top=crop, top_bg=True)
        meta[k] = dict(zip(('w', 'h'), save(rgba, k, SCENE_W)))
    arch = trim(key_cutout(cv2.imread(os.path.join(SRC, 'S2.jpg'))))
    meta['S2'] = dict(zip(('w', 'h'), save(arch, 'S2', 1200)))
    ts = ['/** 由 scripts/story_png.py 生成，勿手改：初见引导素材（public/story/<编号>.webp）的像素尺寸。M = 米洛（Milo）的 6 个姿势（同一比例），S = 场景层。 */',
          f'export const STORY_ASSETS = {json.dumps(meta, separators=(",", ":"))} as const;',
          'export type StoryAsset = keyof typeof STORY_ASSETS;', '']
    open(os.path.join(ROOT, 'src', 'pages', 'storyAssets.ts'), 'w').write('\n'.join(ts))
    print(json.dumps(meta))


if __name__ == '__main__':
    main()
