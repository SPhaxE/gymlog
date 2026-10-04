#!/usr/bin/env python3
"""逐个生成一轮 Stitch 方案：每个方案单独一个 Stitch 项目（同一项目里后生成的会套用第一张的设计系统，方向会趋同）。
用法：python3 design/hifi/tools/run_round.py <页面> <轮次>   例：body r2
  r1 读 design/hifi/<页面>/build_stitch_r1.py 的 DIRECTIONS；r2 起读 design/hifi/build_stitch_<轮次>.py 的 PAGES[<页面>]。
结果累积写入 design/hifi/<页面>/.<轮次>-results.json（不入库），已有的键跳过，可以断点续跑。"""
import importlib.util, json, os, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
HIFI = os.path.dirname(HERE)
page, rnd = sys.argv[1], sys.argv[2]


def load(path):
    spec = importlib.util.spec_from_file_location('m', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m


if rnd == 'r1':
    m = load(os.path.join(HIFI, page, 'build_stitch_r1.py'))
    items = [(d[0], d[1], m.prompt(d)) for d in m.DIRECTIONS]
else:
    items = load(os.path.join(HIFI, f'build_stitch_{rnd}.py')).PAGES[page]

SRC = open(os.path.join(HERE, 'stitch.py'), encoding='utf-8').read().split("if sys.argv[1] == 'list':")[0]
OUT = os.path.join(HIFI, page, f'.{rnd}-results.json')
out = json.load(open(OUT)) if os.path.exists(OUT) else {}
only = os.environ.get('ONLY')
for key, name, prompt in items:
    if key in out or (only and key not in only.split(',')):
        continue
    g = {'__name__': 'stitch'}; sys.argv = ['stitch', 'init']; exec(SRC, g)  # 每个方案一个新会话
    rpc, sid = g['rpc'], g['sid']
    pr, _ = rpc('tools/call', {'name': 'create_project', 'arguments': {'title': f'慢牛 Milo · {page} {rnd}-{key} {name}'}}, sid=sid, i=5)
    pid = pr['result']['structuredContent']['name'].split('/')[-1]
    t = time.time()
    res, _ = rpc('tools/call', {'name': 'generate_screen_from_text', 'arguments': {'projectId': pid, 'prompt': prompt, 'deviceType': 'MOBILE', 'modelId': 'GEMINI_3_8_FLASH'}}, sid=sid, i=10)
    sc = res.get('result', {}).get('structuredContent') or {}
    n = sum(len(c.get('design', {}).get('screens', [])) for c in sc.get('outputComponents', []))
    print(page, rnd, key, pid, f'{time.time() - t:.0f}s', 'screens', n, flush=True)
    if n:
        res['_project'] = pid; out[key] = res
        json.dump(out, open(OUT, 'w'), ensure_ascii=False)
