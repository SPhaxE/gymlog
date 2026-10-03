#!/usr/bin/env node
/* 用一个「严格的」假 figma 对象把 design/figma-plugin/code.js 跑一遍（云端没有 Figma，只能这样自检）。
 * 假对象按官方 Plugin API 的约束报错：变量 scopes 与类型、别名、documentAccess: dynamic-page 下禁止同步设样式 ID、
 * 改文字前必须先加载字体、只能绑定允许的字段等。它证明不了 Figma 里一定能跑，但能挡住大部分低级错误。
 *   node scripts/test_figma_plugin.js
 * 场景：① 空文件首次导入 ② 再跑一次（应只更新、不新建不删除）③ 缺字体时走回退并给提醒 ④ 仓库删掉一个变量后重跑会移除它 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const CODE = fs.readFileSync(path.join(__dirname, '..', 'design', 'figma-plugin', 'code.js'), 'utf8');

const SCOPES = {
  COLOR: ['ALL_SCOPES', 'ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR'],
  FLOAT: ['ALL_SCOPES', 'TEXT_CONTENT', 'CORNER_RADIUS', 'WIDTH_HEIGHT', 'GAP', 'OPACITY', 'STROKE_FLOAT', 'EFFECT_FLOAT', 'FONT_WEIGHT', 'FONT_SIZE', 'LINE_HEIGHT', 'LETTER_SPACING', 'PARAGRAPH_SPACING', 'PARAGRAPH_INDENT'],
  STRING: ['ALL_SCOPES', 'TEXT_CONTENT', 'FONT_FAMILY', 'FONT_STYLE'],
};
const NODE_FIELDS = ['width', 'height', 'itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius', 'strokeWeight', 'opacity', 'visible', 'counterAxisSpacing'];
const TEXTSTYLE_FIELDS = ['fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'paragraphIndent'];
const FONTS = {
  'Inter': ['Regular', 'Medium', 'SemiBold', 'Bold'],
  'Space Grotesk': ['Light', 'Regular', 'Medium', 'SemiBold', 'Bold'],
  'Noto Sans SC': ['Thin', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'],
  'JetBrains Mono': ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold'],
};

function makeFigma(state, opts) {
  opts = opts || {};
  let seq = 0;
  const id = (p) => p + ':' + (++seq) + ':' + Math.random().toString(36).slice(2, 6);
  const loaded = new Set();
  const fail = (m) => { throw new Error('[mock] ' + m); };
  const isColor = (c) => c && typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number' && [c.r, c.g, c.b, c.a === undefined ? 1 : c.a].every((x) => x >= 0 && x <= 1);
  const findVar = (vid) => state.variables.find((v) => v.id === vid);

  function Variable(name, coll, type) {
    if (/[.{}$]/.test(name)) fail('变量名含非法字符：' + name);
    if (state.variables.some((v) => v.variableCollectionId === coll.id && v.name === name)) fail('同一集合里变量重名：' + name);
    const v = { id: id('VariableID'), name, resolvedType: type, variableCollectionId: coll.id, valuesByMode: {}, description: '', _scopes: ['ALL_SCOPES'], codeSyntax: {} };
    Object.defineProperty(v, 'scopes', {
      get() { return v._scopes; },
      set(s) {
        if (!Array.isArray(s)) fail('scopes 必须是数组');
        s.forEach((x) => { if (SCOPES[type].indexOf(x) < 0) fail(type + ' 变量不能用 scope ' + x + '（' + name + '）'); });
        if (s.indexOf('ALL_FILLS') >= 0 && s.some((x) => ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL'].indexOf(x) >= 0)) fail('ALL_FILLS 不能和具体填充 scope 并用（' + name + '）');
        if (s.indexOf('ALL_SCOPES') >= 0 && s.length > 1) fail('ALL_SCOPES 不能和别的 scope 并用');
        v._scopes = s.slice();
      },
    });
    v.setValueForMode = (modeId, val) => {
      if (!coll.modes.some((m) => m.modeId === modeId)) fail('模式不存在');
      if (val && val.type === 'VARIABLE_ALIAS') {
        const t = findVar(val.id); if (!t) fail('别名指向不存在的变量');
        if (t.resolvedType !== type) fail('别名类型不一致：' + name);
      } else if (type === 'COLOR' && !isColor(val)) fail('颜色值不合法：' + name);
      else if (type === 'FLOAT' && typeof val !== 'number') fail('数值不合法：' + name);
      else if (type === 'STRING' && typeof val !== 'string') fail('字符串不合法：' + name);
      v.valuesByMode[modeId] = val;
    };
    v.setVariableCodeSyntax = (platform, s) => { if (['WEB', 'ANDROID', 'iOS'].indexOf(platform) < 0) fail('平台不对'); v.codeSyntax[platform] = s; };
    v.remove = () => { state.variables = state.variables.filter((x) => x !== v); };
    state.variables.push(v);
    return v;
  }
  function Collection(name) {
    const c = { id: id('VariableCollectionId'), name, modes: [{ modeId: id('mode'), name: 'Mode 1' }], hiddenFromPublishing: false };
    c.renameMode = (mid, n) => { const m = c.modes.find((x) => x.modeId === mid); if (!m) fail('renameMode：模式不存在'); m.name = n; };
    state.collections.push(c);
    return c;
  }
  function Style(kind) {
    const s = { id: 'S:' + id(kind), kind, name: '', description: '', boundVariables: {} };
    s.remove = () => { state.styles = state.styles.filter((x) => x !== s); };
    if (kind === 'text') {
      let fn = { family: 'Inter', style: 'Regular' };
      Object.defineProperty(s, 'fontName', { get: () => fn, set(f) { if (!loaded.has(f.family + '|' + f.style)) fail('文字样式设字体前没加载：' + f.family + ' ' + f.style); fn = f; } });
      s.setBoundVariable = (field, v) => {
        if (TEXTSTYLE_FIELDS.indexOf(field) < 0) fail('文字样式不能绑定 ' + field);
        if (field === 'fontFamily' ? v.resolvedType !== 'STRING' : v.resolvedType !== 'FLOAT') fail('文字样式 ' + field + ' 绑定类型不对');
        s.boundVariables[field] = v.id;
      };
    }
    if (kind === 'effect') {
      let fx = [];
      Object.defineProperty(s, 'effects', { get: () => fx, set(arr) { arr.forEach((e) => { if (e.type === 'DROP_SHADOW' && (!isColor(e.color) || !e.offset || typeof e.radius !== 'number' || typeof e.visible !== 'boolean' || !e.blendMode)) fail('阴影效果字段不全'); }); fx = arr; } });
    }
    if (kind === 'paint') {
      let ps = [];
      Object.defineProperty(s, 'paints', { get: () => ps, set(arr) { arr.forEach(checkPaint); ps = arr; } });
    }
    state.styles.push(s);
    return s;
  }
  function checkPaint(p) {
    if (p.type === 'SOLID') { if (!isColor(p.color)) fail('SOLID 颜色不合法'); }
    else if (p.type === 'IMAGE') { if (!state.images[p.imageHash]) fail('IMAGE 引用了不存在的图片'); if (['FILL', 'FIT', 'CROP', 'TILE'].indexOf(p.scaleMode) < 0) fail('scaleMode 不对'); }
    else if (p.type === 'GRADIENT_RADIAL') { if (!Array.isArray(p.gradientTransform) || p.gradientTransform.length !== 2 || p.gradientTransform.some((r) => r.length !== 3 || r.some((x) => !isFinite(x)))) fail('gradientTransform 不对'); p.gradientStops.forEach((st) => { if (!isColor(st.color) || st.color.a === undefined) fail('渐变色标要有 r g b a'); }); }
    else fail('未知 paint 类型 ' + p.type);
  }

  function Node(type) {
    const n = { id: id(type), type, name: type, x: 0, y: 0, width: 100, height: 100, children: [], parent: null, fills: [], strokes: [], boundVariables: {} };
    n.appendChild = (c) => { if (['FRAME', 'SECTION', 'PAGE'].indexOf(n.type) < 0) fail(n.type + ' 不能有子节点'); if (c.parent) c.parent.children = c.parent.children.filter((x) => x !== c); c.parent = n; n.children.push(c); layout(n); };
    n.remove = () => { if (n.parent) n.parent.children = n.parent.children.filter((x) => x !== n); n.parent = null; };
    n.resize = (w, h) => { if (!(w > 0 && h > 0)) fail('resize 尺寸必须 > 0'); n.width = w; n.height = h; };
    n.resizeWithoutConstraints = n.resize;
    n.setBoundVariable = (field, v) => { if (NODE_FIELDS.indexOf(field) < 0) fail('节点不能绑定 ' + field); if (v.resolvedType !== 'FLOAT') fail(field + ' 只能绑 FLOAT 变量'); n.boundVariables[field] = v.id; };
    for (const k of ['textStyleId', 'fillStyleId', 'effectStyleId']) Object.defineProperty(n, k, { set() { fail('dynamic-page 下不能直接设 ' + k + '，要用 set' + k[0].toUpperCase() + k.slice(1) + 'Async'); }, get() { return n['_' + k] || ''; } });
    n.setFillStyleIdAsync = async (sid) => { if (!state.styles.some((s) => s.id === sid && s.kind === 'paint')) fail('填充样式不存在'); n._fillStyleId = sid; };
    n.setEffectStyleIdAsync = async (sid) => { if (!state.styles.some((s) => s.id === sid && s.kind === 'effect')) fail('效果样式不存在'); n._effectStyleId = sid; };
    let lsh;
    Object.defineProperty(n, 'layoutSizingHorizontal', { get: () => lsh, set(v) { if (v === 'FILL' && !(n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE')) fail('只有自动布局父级里的子节点才能 FILL'); lsh = v; } });
    let fl = [];
    Object.defineProperty(n, 'fills', { get: () => fl, set(arr) { arr.forEach(checkPaint); fl = arr; } });
    if (type === 'TEXT') {
      let fn = { family: 'Inter', style: 'Regular' }, chars = '';
      Object.defineProperty(n, 'fontName', { get: () => fn, set(f) { if (!loaded.has(f.family + '|' + f.style)) fail('文字节点设字体前没加载'); fn = f; } });
      Object.defineProperty(n, 'characters', { get: () => chars, set(c) { if (!loaded.has(fn.family + '|' + fn.style)) fail('改文字前要先加载字体 ' + fn.family + ' ' + fn.style); chars = c; n.height = 18 * (c.split('\n').length); n.width = Math.min(1200, c.length * 8); } });
      n.setTextStyleIdAsync = async (sid) => { const s = state.styles.find((x) => x.id === sid && x.kind === 'text'); if (!s) fail('文字样式不存在'); if (!loaded.has(s.fontName.family + '|' + s.fontName.style)) fail('应用文字样式前要加载它的字体'); fn = s.fontName; n._textStyleId = sid; };
    }
    return n;
  }
  function layout(f) { // 粗略的自动布局尺寸，够 resizeWithoutConstraints 用
    if (!f.layoutMode || f.layoutMode === 'NONE') return;
    const ch = f.children, gap = f.itemSpacing || 0;
    const sum = (k) => ch.reduce((a, c) => a + c[k], 0) + gap * Math.max(0, ch.length - 1);
    const max = (k) => ch.reduce((a, c) => Math.max(a, c[k]), 0);
    if (f.layoutMode === 'VERTICAL') { f.height = sum('height') + (f.paddingTop || 0) + (f.paddingBottom || 0); if (f.counterAxisSizingMode !== 'FIXED') f.width = max('width'); }
    else { if (f.primaryAxisSizingMode !== 'FIXED' && f.layoutWrap !== 'WRAP') f.width = sum('width'); f.height = max('height'); }
    if (f.parent) layout(f.parent);
  }

  const page = Node('PAGE');
  page.children = state.pageChildren;
  page.children.forEach((c) => { c.parent = page; });
  page.findAll = (fn) => { const out = []; (function walk(n) { n.children.forEach((c) => { if (fn(c)) out.push(c); walk(c); }); })(page); return out; };
  let closed;
  const done = new Promise((r) => { closed = r; });
  const figma = {
    variables: {
      getLocalVariableCollectionsAsync: async () => state.collections.slice(),
      getLocalVariablesAsync: async () => state.variables.slice(),
      createVariableCollection: Collection,
      createVariable: (name, coll, type) => { if (typeof coll !== 'object' || !coll.id) fail('createVariable 第二个参数要传集合对象'); if (!SCOPES[type]) fail('类型不对 ' + type); return Variable(name, coll, type); },
      createVariableAlias: (v) => ({ type: 'VARIABLE_ALIAS', id: v.id }),
      setBoundVariableForPaint: (p, field, v) => { if (p.type !== 'SOLID' || field !== 'color' || v.resolvedType !== 'COLOR') fail('setBoundVariableForPaint 参数不对'); return Object.assign({}, p, { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } }); },
      setBoundVariableForEffect: (e, field, v) => { if (field !== 'color' || v.resolvedType !== 'COLOR') fail('setBoundVariableForEffect 参数不对'); return Object.assign({}, e, { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } }); },
    },
    loadFontAsync: async (f) => { const ok = FONTS[f.family] && FONTS[f.family].indexOf(f.style) >= 0 && !(opts.missing || []).some((m) => m === f.family + '|' + f.style || m === f.family); if (!ok) throw new Error('font not found'); loaded.add(f.family + '|' + f.style); },
    getLocalTextStylesAsync: async () => state.styles.filter((s) => s.kind === 'text'),
    getLocalEffectStylesAsync: async () => state.styles.filter((s) => s.kind === 'effect'),
    getLocalPaintStylesAsync: async () => state.styles.filter((s) => s.kind === 'paint'),
    createTextStyle: () => Style('text'), createEffectStyle: () => Style('effect'), createPaintStyle: () => Style('paint'),
    createImage: (bytes) => { if (!(bytes instanceof Uint8Array) || bytes[1] !== 0x50) fail('createImage 要 PNG 字节'); const h = 'img' + (++seq); state.images[h] = bytes.length; return { hash: h }; },
    base64Decode: (s) => new Uint8Array(Buffer.from(s, 'base64')),
    createFrame: () => { const n = Node('FRAME'); page.appendChild(n); return n; },
    createRectangle: () => { const n = Node('RECTANGLE'); page.appendChild(n); return n; },
    createText: () => { const n = Node('TEXT'); page.appendChild(n); return n; },
    createSection: () => { const n = Node('SECTION'); page.appendChild(n); return n; },
    currentPage: page,
    viewport: { scrollAndZoomIntoView: () => {} },
    notify: () => {},
    closePlugin: (m) => closed(m),
  };
  return { figma, done, page };
}

async function run(state, opts) {
  const { figma, done, page } = makeFigma(state, opts);
  const logs = [];
  const ctx = vm.createContext({ figma, console: { warn: (m) => logs.push(m), error: (e) => logs.push('ERROR ' + (e && e.stack || e)), log: () => {} }, Map, Set, Promise, Math, JSON, String, Object, Array, parseInt });
  vm.runInContext(CODE, ctx, { filename: 'code.js' });
  const msg = await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('插件 5 秒内没有 closePlugin')), 5000))]);
  state.pageChildren = page.children;
  return { msg, logs };
}

(async () => {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'tokens', 'tokens.json'), 'utf8'));
  const nVars = Object.keys(T.primitives.color).length + Object.keys(T.semantic.color).length + Object.keys(T.number).length + Object.keys(T.string).length;
  const nStyles = T.textStyles.length + T.effectStyles.length + T.paintStyles.length;
  const results = [];
  const check = (c, m) => { results.push([!!c, m]); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
  const existing = { id: 'user:1', type: 'FRAME', name: '用户已有的线框 P06', x: 0, y: 0, width: 400, height: 800, children: [] };

  console.log('① 空文件首次导入（文件里已有一个用户画板）');
  const st = { collections: [], variables: [], styles: [], images: {}, pageChildren: [existing] };
  let r = await run(st);
  check(/^慢牛 Milo Foundations 已导入/.test(r.msg), '插件正常结束：' + r.msg);
  check(st.collections.length === 2 && st.collections.every((c) => c.modes[0].name === 'Dark'), '两个变量集合，模式名 Dark');
  check(st.variables.length === nVars, '变量数 = tokens.json 里的条目数（' + nVars + '）');
  check(st.variables.filter((v) => v.name.indexOf('color/') === 0 && v.variableCollectionId === st.collections[1].id).every((v) => Object.values(v.valuesByMode)[0].type === 'VARIABLE_ALIAS'), '语义色全部是原始色的别名');
  check(st.styles.length === nStyles && st.styles.every((s) => s.name.indexOf('Milo/') === 0), '样式数 = ' + nStyles + '，都带 Milo/ 前缀');
  check(st.styles.filter((s) => s.kind === 'text').every((s) => s.boundVariables.fontSize), '每个文字样式的字号都绑定了变量');
  const sec = st.pageChildren.filter((n) => n.type === 'SECTION');
  check(sec.length === 1 && sec[0].x >= 400, '生成 1 个说明分区，放在已有画板右边');
  check(st.pageChildren.indexOf(existing) >= 0 && st.pageChildren.filter((n) => n.type !== 'SECTION').length === 1, '没动用户已有的画板，也没在页面上留下散落的节点');
  check(r.logs.filter((l) => /^ERROR/.test(l)).length === 0, '没有运行期报错');
  check(r.logs.filter((l) => /^\[milo\]/.test(l)).length === 0, '字体齐全时没有任何提醒（scopes、绑定都成功）' + (r.logs.length ? '：' + r.logs[0] : ''));

  console.log('② 再跑一次（幂等）');
  const ids = st.variables.map((v) => v.id).sort().join();
  r = await run(st);
  check(/新建 0、更新 \d+、移除 0/.test(r.msg), '只更新，不新建不删除：' + r.msg);
  check(st.variables.map((v) => v.id).sort().join() === ids, '变量 ID 不变（已有绑定不会断）');
  check(st.pageChildren.filter((n) => n.type === 'SECTION').length === 1, '说明分区被替换，而不是叠加');

  console.log('③ 缺字体：Noto Sans SC Black 不可用');
  const st3 = { collections: [], variables: [], styles: [], images: {}, pageChildren: [] };
  r = await run(st3, { missing: ['Noto Sans SC|Black'] });
  check(/条提醒/.test(r.msg) && r.logs.some((l) => /Noto Sans SC Black 不可用，暂用 Noto Sans SC Bold/.test(l)), '回退到 Bold 并提醒：' + r.msg);
  check(st3.styles.find((s) => s.name === 'Milo/Title/L').fontName.style === 'Bold', 'Title/L 暂用 Bold');

  console.log('④ 仓库里删掉的变量会被移除');
  const extra = st.collections[1];
  const stale = makeFigma(st).figma.variables.createVariable('color/legacy-unused', extra, 'COLOR');
  stale.setValueForMode(extra.modes[0].modeId, { r: 1, g: 0, b: 0 });
  r = await run(st);
  check(/移除 1/.test(r.msg) && !st.variables.some((v) => v.name === 'color/legacy-unused'), '多出来的 color/legacy-unused 被移除：' + r.msg);

  const bad = results.filter((x) => !x[0]).length;
  console.log(bad ? `\n${bad} 项失败` : `\n全部 ${results.length} 项通过`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
