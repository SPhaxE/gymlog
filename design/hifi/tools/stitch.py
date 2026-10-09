#!/usr/bin/env python3
"""Stitch MCP（HTTP JSON-RPC）的最小客户端。密钥不进仓库、不打印。
密钥来源（按顺序）：环境变量 STITCH_API_KEY（+ 可选 STITCH_URL）→ ~/.claude.json 里任意一处名为 stitch 的 MCP 配置（顶层或某个项目下）
→ 仓库根 secrets/stitch.env（用户 2026-10-09 放的，仓库私密；做完用户会删）。
用法：python3 stitch.py list | call <tool> '<json args>'"""
import json, os, sys, urllib.request

def _config():
    if os.environ.get('STITCH_API_KEY'):
        return os.environ.get('STITCH_URL', 'https://stitch.googleapis.com/mcp'), os.environ['STITCH_API_KEY']
    try:
        c = json.load(open(os.path.expanduser('~/.claude.json')))
        for servers in [c.get('mcpServers', {})] + [p.get('mcpServers', {}) for p in c.get('projects', {}).values()]:
            if 'stitch' in servers: return servers['stitch']['url'], servers['stitch']['headers']['X-Goog-Api-Key']
    except (OSError, ValueError, KeyError): pass
    f = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'secrets', 'stitch.env')
    try:
        env = dict(l.strip().split('=', 1) for l in open(f) if '=' in l)
        if env.get('STITCH_API_KEY'): return env.get('STITCH_URL', 'https://stitch.googleapis.com/mcp'), env['STITCH_API_KEY']
    except OSError: pass
    sys.exit('没有 Stitch 密钥：设置环境变量 STITCH_API_KEY、在 Claude Code 里配置名为 stitch 的 MCP，或放在仓库根 secrets/stitch.env')
URL, KEY = _config()
def rpc(method, params=None, sid=None, i=1):
    body = json.dumps({'jsonrpc': '2.0', 'id': i, 'method': method, 'params': params or {}}).encode()
    h = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'X-Goog-Api-Key': KEY}
    if sid: h['Mcp-Session-Id'] = sid
    r = urllib.request.urlopen(urllib.request.Request(URL, body, h), timeout=600)
    txt = r.read().decode()
    sid = r.headers.get('Mcp-Session-Id') or sid
    if txt.startswith('event:') or 'data:' in txt[:20]:
        txt = '\n'.join(l[5:].strip() for l in txt.splitlines() if l.startswith('data:'))
    return json.loads(txt) if txt.strip() else {}, sid
init, sid = rpc('initialize', {'protocolVersion': '2025-06-18', 'capabilities': {}, 'clientInfo': {'name': 'milo', 'version': '1'}})
try: rpc('notifications/initialized', sid=sid)
except Exception: pass
if sys.argv[1] == 'list':
    res, _ = rpc('tools/list', sid=sid, i=2)
    for t in res['result']['tools']: print(t['name'], '-', t.get('description', '')[:120].replace('\n', ' '))
else:
    res, _ = rpc('tools/call', {'name': sys.argv[2], 'arguments': json.loads(sys.argv[3])}, sid=sid, i=3)
    print(json.dumps(res, ensure_ascii=False)[:int(sys.argv[4]) if len(sys.argv) > 4 else 4000])
