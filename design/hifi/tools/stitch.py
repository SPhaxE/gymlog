#!/usr/bin/env python3
"""Stitch MCP（HTTP JSON-RPC）的最小客户端。密钥从 ~/.claude.json 读，不打印。
用法：python3 stitch.py list | call <tool> '<json args>'"""
import json, sys, urllib.request
cfg = json.load(open('/root/.claude.json'))['projects']['/tmp']['mcpServers']['stitch']
URL, KEY = cfg['url'], cfg['headers']['X-Goog-Api-Key']
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
