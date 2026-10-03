import json, sys, os, time
sys.path.insert(0, '/home/user/gymlog/design/hifi/body')
import build_stitch_r1 as B
sys.argv = ['x', 'list']
SRC = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stitch.py')).read().split("if sys.argv[1] == 'list':")[0]
out = json.load(open('r1b.json')) if os.path.exists('r1b.json') else {}
for d in B.DIRECTIONS:
    if d[0] not in os.environ.get('ONLY', 'ABCDEF') or d[0] in out: continue
    g = {}; exec(SRC, g)   # 每个方向一个新会话
    rpc, sid = g['rpc'], g['sid']
    pr, _ = rpc('tools/call', {'name': 'create_project', 'arguments': {'title': f'慢牛 Milo · 身体页 r1-{d[0]} {d[1]}'}}, sid=sid, i=5)
    pid = pr['result']['structuredContent']['name'].split('/')[-1]
    t = time.time()
    res, _ = rpc('tools/call', {'name': 'generate_screen_from_text', 'arguments': {'projectId': pid, 'prompt': B.prompt(d), 'deviceType': 'MOBILE', 'modelId': 'GEMINI_3_8_FLASH'}}, sid=sid, i=10)
    sc = res['result'].get('structuredContent') or {}
    n = sum(len(c.get('design', {}).get('screens', [])) for c in sc.get('outputComponents', []))
    print(d[0], pid, round(time.time() - t), 's screens', n, flush=True)
    if n: out[d[0]] = res; out[d[0]]['_project'] = pid
    json.dump(out, open('r1b.json', 'w'), ensure_ascii=False)
