"""把演示数据（trained.json：真实的练过日子）注入 plate.tpl.html，生成可直接打开的 plate.html（一次性原型，不进 App）。"""
import json, pathlib
D = pathlib.Path(__file__).parent
tpl = (D / 'plate.tpl.html').read_text()
(D / 'plate.html').write_text(tpl.replace('__DATA__', json.dumps(json.loads((D / 'trained.json').read_text()))))
print('ok')
