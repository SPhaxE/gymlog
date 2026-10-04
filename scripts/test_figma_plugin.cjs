#!/usr/bin/env node
/* 用一个「严格的」假 figma 对象把 design/figma-plugin/code.js 跑一遍（云端没有 Figma，只能这样自检）。
 * 假对象按官方 Plugin API 的约束报错：变量 scopes 与类型、别名、documentAccess: dynamic-page 下禁止同步设样式 ID、
 * 改文字前必须先加载字体、只能绑定允许的字段、resize() 会把自动布局改成固定尺寸、实例里不能改尺寸或增删子节点、
 * 矢量路径语法等。它证明不了 Figma 里一定能跑，但能挡住大部分低级错误。
 *   node scripts/test_figma_plugin.cjs
 * 场景：① Foundations 首次导入 ② 重跑（幂等）③ 缺字体回退 ④ 仓库删掉的变量会被移除
 *       ⑤ 导入组件 ⑥ 组件重跑（ID 不变）⑦ 生成标杆页 P06 ⑧ 标杆页重跑 */
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
  'Barlow Condensed': ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'],
  'Noto Sans SC': ['Thin', 'Light', 'Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold', 'Black'],
  'JetBrains Mono': ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold'],
};
const ENUMS = {
  primaryAxisAlignItems: ['MIN', 'MAX', 'CENTER', 'SPACE_BETWEEN'],
  counterAxisAlignItems: ['MIN', 'MAX', 'CENTER', 'BASELINE'],
  layoutMode: ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'],
  strokeCap: ['NONE', 'ROUND', 'SQUARE', 'ARROW_LINES', 'ARROW_EQUILATERAL'],
  layoutWrap: ['NO_WRAP', 'WRAP'],
  textAutoResize: ['NONE', 'WIDTH_AND_HEIGHT', 'HEIGHT', 'TRUNCATE'],
};
const CONTAINERS = ['FRAME', 'SECTION', 'PAGE', 'COMPONENT', 'COMPONENT_SET', 'GROUP', 'INSTANCE'];

// ---------- 极简 SVG 路径包围盒（M L H V C S Q T A Z，绝对与相对）
function pathBBox(d) {
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cmd = null, x = 0, y = 0, sx = 0, sy = 0;
  const xs = [], ys = [];
  const num = () => parseFloat(tok[i++]);
  const add = (a, b) => { xs.push(a); ys.push(b); };
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const bx = rel ? x : 0, by = rel ? y : 0;
    if (C === 'Z') { x = sx; y = sy; continue; }
    if (C === 'M') { x = bx + num(); y = by + num(); sx = x; sy = y; add(x, y); cmd = rel ? 'l' : 'L'; continue; }
    if (C === 'L' || C === 'T') { x = bx + num(); y = by + num(); add(x, y); continue; }
    if (C === 'H') { x = bx + num(); add(x, y); continue; }
    if (C === 'V') { y = (rel ? y : 0) + num(); add(x, y); continue; }
    if (C === 'C') { add(bx + num(), by + num()); add(bx + num(), by + num()); x = bx + num(); y = by + num(); add(x, y); continue; }
    if (C === 'S' || C === 'Q') { add(bx + num(), by + num()); x = bx + num(); y = by + num(); add(x, y); continue; }
    if (C === 'A') { num(); num(); num(); num(); num(); x = bx + num(); y = by + num(); add(x, y); continue; }
    throw new Error('[mock] 不认识的路径命令 ' + cmd);
  }
  const x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
  return { x: x0, y: y0, w: Math.max(0.01, Math.max.apply(null, xs) - x0), h: Math.max(0.01, Math.max.apply(null, ys) - y0) };
}

function makeFigma(state, opts) {
  opts = opts || {};
  let seq = state.seq || 0;
  const id = (p) => p + ':' + (++seq);
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
    if (p.type === 'SOLID') { if (!isColor(p.color)) fail('SOLID 颜色不合法'); if (p.opacity != null && !(p.opacity >= 0 && p.opacity <= 1)) fail('paint opacity 要在 0–1'); }
    else if (p.type === 'IMAGE') { if (!state.images[p.imageHash]) fail('IMAGE 引用了不存在的图片'); if (['FILL', 'FIT', 'CROP', 'TILE'].indexOf(p.scaleMode) < 0) fail('scaleMode 不对'); }
    else if (p.type === 'GRADIENT_RADIAL' || p.type === 'GRADIENT_LINEAR') {
      if (!Array.isArray(p.gradientTransform) || p.gradientTransform.length !== 2 || p.gradientTransform.some((r) => r.length !== 3 || r.some((x) => !isFinite(x)))) fail('gradientTransform 不对');
      let last = -1;
      p.gradientStops.forEach((st) => { if (!isColor(st.color) || st.color.a === undefined) fail('渐变色标要有 r g b a'); if (!(st.position >= 0 && st.position <= 1) || st.position < last) fail('渐变色标位置要在 0–1 且递增'); last = st.position; });
    } else fail('未知 paint 类型 ' + p.type);
  }

  const inInst = (n) => { for (let p = n; p; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
  const insideInst = (n) => !!n.parent && inInst(n.parent); // 节点是某个实例的后代（不含实例自身）
  function Node(type) {
    const n = { id: id(type), type, name: type, x: 0, y: 0, width: 100, height: 100, children: [], parent: null, strokes: [], effects: [], boundVariables: {}, description: '', opacity: 1, strokeWeight: 1 };
    const guardSize = () => { if (insideInst(n)) fail('实例里的图层不能改尺寸（' + n.name + '）'); };
    n.appendChild = (c) => {
      if (CONTAINERS.indexOf(n.type) < 0) fail(n.type + ' 不能有子节点');
      if (inInst(n) && !n._cloning) fail('不能往实例里加子节点（' + n.name + '）');
      if (c.parent && insideInst(c)) fail('不能把实例里的图层挪出来');
      if (c.parent) c.parent.children = c.parent.children.filter((x) => x !== c);
      c.parent = n; n.children.push(c); layout(n);
    };
    n.remove = () => { if (insideInst(n)) fail('实例里的图层不能删除（' + n.name + '）'); if (n.parent) n.parent.children = n.parent.children.filter((x) => x !== n); n.parent = null; };
    n.resize = (w, h) => { guardSize(); if (!(w > 0 && h > 0)) fail('resize 尺寸必须 > 0：' + n.name + ' ' + w + '×' + h); n.width = w; n.height = h; if (n.layoutMode && n.layoutMode !== 'NONE') { n.primaryAxisSizingMode = 'FIXED'; n.counterAxisSizingMode = 'FIXED'; } if (n.type === 'TEXT') n.textAutoResize = 'NONE'; if (n.parent) layout(n.parent); };
    n.resizeWithoutConstraints = (w, h) => { guardSize(); if (!(w > 0 && h > 0)) fail('resize 尺寸必须 > 0'); n.width = w; n.height = h; };
    n.rescale = (s) => { guardSize(); if (!(s > 0)) fail('rescale 必须 > 0'); (function sc(m, root) { if (!root) { m.x *= s; m.y *= s; } m.width *= s; m.height *= s; m.children.forEach((c) => sc(c, false)); })(n, true); };
    n.findAll = (fn) => { const out = []; (function walk(m) { m.children.forEach((c) => { if (!fn || fn(c)) out.push(c); walk(c); }); })(n); return out; };
    n.findOne = (fn) => n.findAll(fn)[0] || null;
    n.findChild = (fn) => n.children.find(fn) || null;
    n.setBoundVariable = (field, v) => { if (NODE_FIELDS.indexOf(field) < 0) fail('节点不能绑定 ' + field); if (v.resolvedType !== 'FLOAT') fail(field + ' 只能绑 FLOAT 变量'); n.boundVariables[field] = v.id; };
    for (const k of ['textStyleId', 'fillStyleId', 'effectStyleId']) Object.defineProperty(n, k, { set() { fail('dynamic-page 下不能直接设 ' + k + '，要用 set' + k[0].toUpperCase() + k.slice(1) + 'Async'); }, get() { return n['_' + k] || ''; } });
    n.setFillStyleIdAsync = async (sid) => { if (sid !== '' && !state.styles.some((s) => s.id === sid && s.kind === 'paint')) fail('填充样式不存在'); n._fillStyleId = sid; };
    n.setEffectStyleIdAsync = async (sid) => { if (sid !== '' && !state.styles.some((s) => s.id === sid && s.kind === 'effect')) fail('效果样式不存在'); n._effectStyleId = sid; };
    Object.defineProperty(n, 'absoluteBoundingBox', { get() { let x = 0, y = 0; for (let p = n; p && p.type !== 'PAGE'; p = p.parent) { x += p.x; y += p.y; } return { x, y, width: n.width, height: n.height }; } });
    let lsh;
    Object.defineProperty(n, 'layoutSizingHorizontal', { get: () => lsh, set(v) { if (v === 'FILL' && !(n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE')) fail('只有自动布局父级里的子节点才能 FILL（' + n.name + '）'); lsh = v; } });
    let fl = [];
    Object.defineProperty(n, 'fills', { get: () => fl, set(arr) { if (!Array.isArray(arr)) fail('fills 要数组'); arr.forEach(checkPaint); fl = arr; } });
    for (const k of Object.keys(ENUMS)) { let v = k === 'layoutMode' ? 'NONE' : undefined; Object.defineProperty(n, k, { enumerable: true, get: () => v, set(x) { if (ENUMS[k].indexOf(x) < 0) fail(k + ' 不能是 ' + x); v = x; } }); }
    let dash = [];
    Object.defineProperty(n, 'dashPattern', { get: () => dash, set(a) { if (!Array.isArray(a) || a.some((x) => !(x >= 0))) fail('dashPattern 要非负数组'); dash = a; } });
    let vp = [];
    Object.defineProperty(n, 'vectorPaths', { get: () => vp, set(a) {
      if (n.type !== 'VECTOR') fail('只有矢量能设 vectorPaths');
      a.forEach((p) => {
        if (['NONZERO', 'EVENODD', 'NONE'].indexOf(p.windingRule) < 0) fail('windingRule 不对');
        if (!/^M -?[\d.]+ -?[\d.]+( (L -?[\d.]+ -?[\d.]+|Q( -?[\d.]+){4}|C( -?[\d.]+){6}|Z))*$/.test(p.data)) fail('矢量路径语法不对（只能用空格分隔的 M L Q C Z）：' + p.data.slice(0, 60));
      });
      vp = a; const b = pathBBox(a.map((p) => p.data).join(' ')); n.width = b.w; n.height = b.h;
    } });
    if (type === 'TEXT') {
      let fn = { family: 'Inter', style: 'Regular' }, chars = '';
      Object.defineProperty(n, 'fontName', { get: () => fn, set(f) { if (!loaded.has(f.family + '|' + f.style)) fail('文字节点设字体前没加载'); fn = f; } });
      Object.defineProperty(n, 'characters', { get: () => chars, set(c) { if (typeof c !== 'string') fail('characters 要字符串'); if (!loaded.has(fn.family + '|' + fn.style)) fail('改文字前要先加载字体 ' + fn.family + ' ' + fn.style); chars = c; if (n.textAutoResize !== 'NONE' && n.textAutoResize !== 'HEIGHT') n.width = Math.min(1200, c.length * 8); n.height = 18 * c.split('\n').length; if (n.parent) layout(n.parent); } });
      n.setTextStyleIdAsync = async (sid) => { const s = state.styles.find((x) => x.id === sid && x.kind === 'text'); if (!s) fail('文字样式不存在'); if (!loaded.has(s.fontName.family + '|' + s.fontName.style)) fail('应用文字样式前要加载它的字体'); fn = s.fontName; n._textStyleId = sid; };
    }
    if (type === 'COMPONENT') n.createInstance = () => { const i = clone(n, true); i.mainComponent = n; page.appendChild(i); return i; };
    if (type === 'INSTANCE') n.swapComponent = (c) => {
      if (!c || c.type !== 'COMPONENT') fail('swapComponent 要传组件');
      n.children.slice().forEach((ch) => { ch.parent = null; });
      n.children = [];
      n._cloning = true; c.children.forEach((ch) => n.appendChild(clone(ch, false))); n._cloning = false;
      n.mainComponent = c;
      if (!(n.parent && n.parent.layoutMode && n.parent.layoutMode !== 'NONE' && n.layoutSizingHorizontal === 'FILL')) n.width = c.width;
      n.height = c.height;
    };
    return n;
  }
  const COPY = ['name', 'x', 'y', 'width', 'height', 'layoutMode', 'primaryAxisSizingMode', 'counterAxisSizingMode', 'itemSpacing', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'primaryAxisAlignItems', 'counterAxisAlignItems', 'layoutWrap', 'layoutGrow', 'strokes', 'strokeWeight', 'effects', 'opacity', 'clipsContent', 'strokeCap', 'textAutoResize', 'constraints', 'description'];
  function clone(src, asInstance) {
    const n = Node(asInstance ? 'INSTANCE' : src.type);
    if (src.type === 'INSTANCE') n.mainComponent = src.mainComponent;
    if (asInstance) n.mainComponent = src;
    for (const k of COPY) if (src[k] !== undefined) { try { n[k] = src[k]; } catch (e) { /* 只读字段 */ } }
    n.fills = src.fills;
    n._fillStyleId = src._fillStyleId; n._effectStyleId = src._effectStyleId; n._textStyleId = src._textStyleId;
    n.boundVariables = Object.assign({}, src.boundVariables);
    if (src.type === 'VECTOR') { n.vectorPaths = src.vectorPaths; n.width = src.width; n.height = src.height; n.dashPattern = src.dashPattern; }
    if (src.type === 'TEXT') { n.fontName = src.fontName; n.characters = src.characters; n.width = src.width; n.height = src.height; }
    n._cloning = true; src.children.forEach((c) => n.appendChild(clone(c, false))); n._cloning = false;
    n.width = src.width; n.height = src.height;
    return n;
  }
  function layout(f) { // 粗略的自动布局尺寸
    if (!f.layoutMode || f.layoutMode === 'NONE') return;
    const ch = f.children, gap = f.itemSpacing || 0;
    const sum = (k) => ch.reduce((a, c) => a + c[k], 0) + gap * Math.max(0, ch.length - 1);
    const max = (k) => ch.reduce((a, c) => Math.max(a, c[k]), 0);
    const pv = (f.paddingTop || 0) + (f.paddingBottom || 0), ph = (f.paddingLeft || 0) + (f.paddingRight || 0);
    if (f.layoutMode === 'VERTICAL') { f._contentH = sum('height') + pv; if (f.primaryAxisSizingMode !== 'FIXED') f.height = f._contentH; if (f.counterAxisSizingMode !== 'FIXED') f.width = max('width') + ph; }
    else { if (f.primaryAxisSizingMode !== 'FIXED' && f.layoutWrap !== 'WRAP') f.width = sum('width') + ph; f._contentH = max('height') + pv; if (f.counterAxisSizingMode !== 'FIXED') f.height = f._contentH; }
    let y = f.paddingTop || 0, x = f.paddingLeft || 0;
    for (const c of ch) { if (f.layoutMode === 'VERTICAL') { c.x = x; c.y = y; y += c.height + gap; } else { c.x = x; c.y = y; x += c.width + gap; } }
    if (f.parent) layout(f.parent);
  }
  function fromSvg(svg) {
    if (typeof svg !== 'string' || svg.indexOf('<svg') < 0) fail('createNodeFromSvg 要 SVG 字符串');
    const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
    const [, , vw, vh] = vb ? vb.split(/\s+/).map(Number) : [0, 0, 24, 24];
    const root = Node('FRAME'); root.name = 'svg'; root.width = vw; root.height = vh;
    const mkVec = (d, parent) => { const v = Node('VECTOR'); const b = pathBBox(d); v.x = b.x; v.y = b.y; v.width = b.w; v.height = b.h; v.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; parent.appendChild(v); return v; };
    const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const re = /<g id="([^"]+)"([^>]*)>([\s\S]*?)<\/g>|<path d="([^"]+)"[^>]*\/>|<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*\/>/g;
    let m;
    while ((m = re.exec(body))) {
      if (m[1]) {
        const g = Node('GROUP'); g.name = m[1]; root.appendChild(g);
        const op = (m[2].match(/opacity="([\d.]+)"/) || [])[1]; if (op) g.opacity = Number(op);
        const inner = /<path d="([^"]+)"[^>]*\/>|<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*\/>/g;
        let k;
        while ((k = inner.exec(m[3]))) { if (k[1]) mkVec(k[1], g); else mkVec('M' + k[2] + ',' + k[3] + 'L' + k[4] + ',' + k[5], g); }
        g.x = 0; g.y = 0;
      } else if (m[4]) mkVec(m[4], root);
    }
    page.appendChild(root);
    return root;
  }

  const page = Node('PAGE');
  page.children = state.pageChildren;
  page.children.forEach((c) => { c.parent = page; });
  let closed;
  const done = new Promise((r) => { closed = r; });
  const mk = (t) => () => { const n = Node(t); page.appendChild(n); return n; };
  const figma = {
    command: opts.command,
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
    createFrame: mk('FRAME'), createRectangle: mk('RECTANGLE'), createEllipse: mk('ELLIPSE'), createVector: mk('VECTOR'), createText: mk('TEXT'), createSection: mk('SECTION'), createComponent: mk('COMPONENT'),
    createNodeFromSvg: fromSvg,
    combineAsVariants: (nodes, parent) => {
      if (!nodes.length || nodes.some((c) => c.type !== 'COMPONENT')) fail('combineAsVariants 只能合并组件');
      const keys = nodes.map((c) => c.name.split(', ').map((kv) => { if (kv.indexOf('=') < 0) fail('变体名要是 key=value：' + c.name); return kv.split('=')[0]; }).join('|'));
      if (keys.some((k) => k !== keys[0])) fail('同一组件集的变体属性不一致');
      if (new Set(nodes.map((c) => c.name)).size !== nodes.length) fail('变体重名');
      const set = Node('COMPONENT_SET'); parent.appendChild(set); nodes.forEach((c) => set.appendChild(c)); return set;
    },
    currentPage: page,
    viewport: { scrollAndZoomIntoView: () => {} },
    notify: () => {},
    closePlugin: (m) => closed(m),
  };
  return { figma, done, page, save: () => { state.seq = seq; } };
}

async function run(state, opts) {
  const { figma, done, page, save } = makeFigma(state, opts);
  const logs = [];
  const ctx = vm.createContext({ figma, console: { warn: (m) => logs.push(m), error: (e) => logs.push('ERROR ' + (e && e.stack || e)), log: () => {} }, Map, Set, Promise, Math, JSON, String, Number, Object, Array, parseInt });
  vm.runInContext(CODE, ctx, { filename: 'code.js' });
  const msg = await Promise.race([done, new Promise((_, rej) => setTimeout(() => rej(new Error('插件 10 秒内没有 closePlugin')), 10000))]);
  state.pageChildren = page.children;
  save();
  return { msg, logs };
}

// ---------- 检查用的小工具
const walk = (n, fn, inInstance) => { (n.children || []).forEach((c) => { fn(c, inInstance); walk(c, fn, inInstance || c.type === 'INSTANCE'); }); };
function unboundSolids(root) {
  const bad = [];
  if (!root) return ['（分区不存在）'];
  walk(root, (n) => { for (const k of ['fills', 'strokes']) (n[k] || []).forEach((p) => { if (p.type === 'SOLID' && !(p.boundVariables && p.boundVariables.color)) bad.push(n.name + '.' + k); }); });
  return bad;
}
// ---------- 粗略渲染（--render out.html）：把模拟出来的节点树画成 HTML，方便看版式；文字宽度是估的，只看结构
function renderHTML(phones, st, DATA) {
  const vars = {}; st.variables.forEach((v) => { vars[v.id] = v; });
  const col = (vid) => { let v = vars[vid]; for (let i = 0; i < 5 && v; i++) { const val = Object.values(v.valuesByMode)[0]; if (val.type === 'VARIABLE_ALIAS') v = vars[val.id]; else return 'rgba(' + [val.r, val.g, val.b].map((x) => Math.round(x * 255)).join(',') + ',' + (val.a == null ? 1 : val.a) + ')'; } return 'magenta'; };
  const paint = (p) => { if (!p) return 'transparent'; if (p.type === 'SOLID') { const c = p.boundVariables ? col(p.boundVariables.color.id) : 'rgb(' + [p.color.r, p.color.g, p.color.b].map((x) => Math.round(x * 255)) + ')'; return p.opacity != null && p.opacity < 1 ? c.replace(/,([\d.]+)\)$/, ',' + p.opacity + ')') : c; } if (p.type && p.type.indexOf('GRADIENT') === 0) { const s = p.gradientStops; return 'linear-gradient(90deg,' + s.map((x) => 'rgba(' + [x.color.r, x.color.g, x.color.b].map((y) => Math.round(y * 255)) + ',' + x.color.a + ') ' + (x.position * 100) + '%').join(',') + ')'; } return '#555'; };
  const sty = {}; st.styles.forEach((x) => { sty[x.id] = x; });
  const T2 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'tokens', 'tokens.json'), 'utf8'));
  const sizeOf = (n) => { const s = sty[n._textStyleId]; if (!s) return 12; const d = T2.textStyles.find((x) => 'Milo/' + x.name === s.name); return d ? T2.number[d.size].value : 12; };
  const out = [];
  const draw = (n, ox, oy) => {
    const x = ox + n.x, y = oy + n.y;
    if (n.name === 'body' && n.type === 'INSTANCE') {
      const fills = {}; n.findAll((g) => g.name.indexOf('muscle/') === 0).forEach((g) => { const v = g.children[0]; fills[g.name.slice(7)] = v && v._fillStyleId ? (sty[v._fillStyleId].name.indexOf('Low') > 0 ? '#3A4614' : '#F3F2EE') : paint(v && v.fills[0]); });
      out.push('<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + n.width + 'px;height:' + n.height + 'px">' + DATA.bodymap.male.front.replace('<svg ', '<svg width="' + n.width + '" ').replace(/<g id="muscle--([^"]+)">([\s\S]*?)<\/g>/g, (m, id, inner) => '<g>' + inner.replace(/fill="[^"]+"/g, 'fill="' + (fills[id] || '#232326') + '"') + '</g>') + '</div>');
      return;
    }
    const bg = (n.fills || [])[0], bd = (n.strokes || [])[0];
    if (n.type === 'TEXT') out.push('<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;white-space:pre;font:' + sizeOf(n) + 'px/1.2 sans-serif;color:' + paint(bg) + '">' + n.characters + '</div>');
    else if (n.type === 'VECTOR' && n.vectorPaths.length) out.push('<svg style="position:absolute;left:' + x + 'px;top:' + y + 'px;overflow:visible" width="1" height="1"><path d="' + n.vectorPaths[0].data + '" fill="none" stroke="' + paint(bd) + '" stroke-width="' + n.strokeWeight + '" ' + (n.dashPattern.length ? 'stroke-dasharray="' + n.dashPattern.join(' ') + '"' : '') + '/></svg>');
    else if (n.type !== 'GROUP' && n.type !== 'VECTOR') out.push('<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + n.width + 'px;height:' + n.height + 'px;background:' + paint(bg) + ';' + (bd ? 'box-shadow:inset 0 0 0 ' + n.strokeWeight + 'px ' + paint(bd) + ';' : '') + (n.type === 'ELLIPSE' || (n.boundVariables && n.boundVariables.topLeftRadius) ? 'border-radius:' + (n.type === 'ELLIPSE' ? '50%' : Math.min(n.height / 2, 22) + 'px') + ';' : '') + '"></div>');
    (n.children || []).forEach((c) => draw(c, x, y));
  };
  phones.forEach((f, i) => { out.push('<div style="position:absolute;left:' + (20 + i * 400) + 'px;top:20px;width:360px;height:800px;overflow:hidden;outline:1px solid #333">'); f.children.forEach((c) => draw(c, 0, 0)); out.push('</div>'); });
  return '<!doctype html><meta charset=utf-8><body style="margin:0;background:#1a1a1a;width:1240px;height:840px;position:relative">' + out.join('') + '</body>';
}
const sectionOf = (st, name) => st.pageChildren.filter((n) => n.type === 'SECTION' && n.name.indexOf(name) === 0);

(async () => {
  const T = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'design', 'tokens', 'tokens.json'), 'utf8'));
  const nVars = Object.keys(T.primitives.color).length + Object.keys(T.semantic.color).length + Object.keys(T.number).length + Object.keys(T.string).length;
  const nStyles = T.textStyles.length + T.effectStyles.length + T.paintStyles.length;
  const results = [];
  const check = (c, m) => { results.push([!!c, m]); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
  const existing = { id: 'user:1', type: 'FRAME', name: '用户已有的线框 P06', x: 0, y: 0, width: 400, height: 800, children: [] };

  console.log('① Foundations 首次导入（文件里已有一个用户画板）');
  const st = { collections: [], variables: [], styles: [], images: {}, pageChildren: [existing] };
  let r = await run(st, { command: 'foundations' });
  check(/^慢牛 Milo Foundations 已导入/.test(r.msg), '插件正常结束：' + r.msg);
  check(st.collections.length === 2 && st.collections.every((c) => c.modes[0].name === 'Dark'), '两个变量集合，模式名 Dark');
  check(st.variables.length === nVars, '变量数 = tokens.json 里的条目数（' + nVars + '）');
  check(st.variables.filter((v) => v.name.indexOf('color/') === 0 && v.variableCollectionId === st.collections[1].id).every((v) => Object.values(v.valuesByMode)[0].type === 'VARIABLE_ALIAS'), '语义色全部是原始色的别名');
  check(st.styles.length === nStyles && st.styles.every((s) => s.name.indexOf('Milo/') === 0), '样式数 = ' + nStyles + '，都带 Milo/ 前缀');
  check(st.styles.filter((s) => s.kind === 'text').every((s) => s.boundVariables.fontSize), '每个文字样式的字号都绑定了变量');
  const sec = sectionOf(st, 'Foundations');
  check(sec.length === 1 && sec[0].x >= 400, '生成 1 个说明分区，放在已有画板右边');
  check(st.pageChildren.indexOf(existing) >= 0 && st.pageChildren.filter((n) => n.type !== 'SECTION').length === 1, '没动用户已有的画板，也没在页面上留下散落的节点');
  check(r.logs.filter((l) => /^ERROR/.test(l)).length === 0, '没有运行期报错' + (r.logs.length ? '：' + r.logs[0].slice(0, 300) : ''));
  const frames = []; walk(sec[0], (n) => { if (n.type === 'FRAME') frames.push(n); });
  const cut = frames.filter((f) => f.clipsContent && f._contentH > f.height + 0.5);
  check(frames.length > 0 && cut.length === 0, '没有会裁掉内容的框' + (cut.length ? '：' + cut.map((f) => f.name + ' ' + f.height + '<' + f._contentH).join('，') : ''));
  check(sec[0].height >= frames[0].height + 80 - 0.5, '分区高度装得下整个说明框');
  const texts = []; walk(sec[0], (n) => { if (n.type === 'TEXT') texts.push(n); });
  check(texts.every((t) => t.textAutoResize !== 'NONE'), '定宽文字都是「自动高度」，不会被截断');
  check(r.logs.filter((l) => /^\[milo\]/.test(l)).length === 0, '字体齐全时没有任何提醒' + (r.logs.length ? '：' + r.logs[0] : ''));

  console.log('② Foundations 重跑（幂等）');
  const ids = st.variables.map((v) => v.id).sort().join();
  r = await run(st, { command: 'foundations' });
  check(/新建 0、更新 \d+、移除 0/.test(r.msg), '只更新，不新建不删除：' + r.msg);
  check(st.variables.map((v) => v.id).sort().join() === ids, '变量 ID 不变（已有绑定不会断）');
  check(sectionOf(st, 'Foundations').length === 1, '说明分区被替换，而不是叠加');

  console.log('③ 缺字体：Noto Sans SC Black 不可用');
  const st3 = { collections: [], variables: [], styles: [], images: {}, pageChildren: [] };
  r = await run(st3, { command: 'foundations', missing: ['Noto Sans SC|Black'] });
  check(/条提醒/.test(r.msg) && r.logs.some((l) => /Noto Sans SC Black 不可用，暂用 Noto Sans SC Bold/.test(l)), '回退到 Bold 并提醒：' + r.msg);
  check(st3.styles.find((s) => s.name === 'Milo/Title/L').fontName.style === 'Bold', 'Title/L 暂用 Bold');

  console.log('④ 仓库里删掉的变量会被移除');
  const extra = st.collections[1];
  const stale = makeFigma(st).figma.variables.createVariable('color/legacy-unused', extra, 'COLOR');
  stale.setValueForMode(extra.modes[0].modeId, { r: 1, g: 0, b: 0 });
  r = await run(st, { command: 'foundations' });
  check(/移除 1/.test(r.msg) && !st.variables.some((v) => v.name === 'color/legacy-unused'), '多出来的 color/legacy-unused 被移除：' + r.msg);

  console.log('⑤ 导入组件');
  r = await run(st, { command: 'components' });
  check(/^慢牛 Milo 组件 已导入/.test(r.msg), '插件正常结束：' + r.msg);
  check(r.logs.length === 0, '没有提醒和报错' + (r.logs.length ? '：' + r.logs[0].slice(0, 400) : ''));
  const csec = sectionOf(st, 'Components')[0];
  const sets = {}; (csec ? csec.children : []).forEach((n) => { if (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') sets[n.name] = n; });
  const expect = { NavPill: 30, Capsule: 5, ScaleBar: 9, Segmented: 3, Segmented2: 2, Button: 4, RecoveryBlock: 4, VolumeBlock: 3, BodyFigure: 4 };
  for (const k of Object.keys(expect)) check(sets[k] && sets[k].type === 'COMPONENT_SET' && sets[k].children.length === expect[k], k + ' 有 ' + expect[k] + ' 个变体' + (sets[k] ? '（实际 ' + sets[k].children.length + '）' : '（缺）'));
  for (const k of ['TierLegend', 'KpiRow', 'PageHeader', 'SheetHeader', 'InfoRow', 'InlineNote', 'TouchPoint']) check(sets[k] && sets[k].type === 'COMPONENT', '单个组件 ' + k);
  check(unboundSolids(csec).length === 0, '组件里每个纯色填充 / 描边都绑定了变量' + (unboundSolids(csec).length ? '：' + unboundSolids(csec).slice(0, 5).join('，') : ''));
  const DATA = JSON.parse(CODE.slice(CODE.indexOf('const DATA = ') + 13, CODE.indexOf(';\nconst T = DATA.tokens')));
  const bodyM = sets.BodyFigure && sets.BodyFigure.findChild((c) => c.name === 'gender=男, view=正面');
  const groups = bodyM ? bodyM.findAll((n) => n.name.indexOf('muscle/') === 0).map((n) => n.name.slice(7)) : [];
  check(DATA.bodymapMuscles.front.every((m) => groups.indexOf(m) >= 0) && groups.length === DATA.bodymapMuscles.front.length, '男 · 正面人体图有全部 ' + DATA.bodymapMuscles.front.length + ' 个肌头组（MuscleWiki）');
  check(groups.indexOf('groin') < 0, '腹股沟不是肌头组（不着色、不设胶囊）');
  const nav = (n) => sets.NavPill && sets.NavPill.findChild((c) => c.name === n);
  const restRing = nav('ring=进度+休息, selected=今日, state=默认') && nav('ring=进度+休息, selected=今日, state=默认').findOne((n) => n.name === 'ring/rest');
  check(restRing && restRing.dashPattern.length === 2, 'NavPill 休息描边是虚线');
  check(nav('ring=无环, selected=进度, state=默认') && !nav('ring=无环, selected=进度, state=默认').findOne((n) => n.name.indexOf('ring/') === 0), '「无环」变体没有任何环');
  const cid = {}; for (const k of Object.keys(sets)) { cid[k] = sets[k].id; (sets[k].children || []).forEach((c) => { if (c.type === 'COMPONENT') cid[k + '/' + c.name] = c.id; }); }

  console.log('⑥ 组件重跑（幂等，ID 不变）');
  r = await run(st, { command: 'components' });
  const csec2 = sectionOf(st, 'Components');
  const now = {}; (csec2[0] ? csec2[0].children : []).forEach((n) => { if (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') { now[n.name] = n.id; (n.children || []).forEach((c) => { if (c.type === 'COMPONENT') now[n.name + '/' + c.name] = c.id; }); } });
  check(csec2.length === 1 && Object.keys(cid).length > 0 && Object.keys(cid).every((k) => now[k] === cid[k]) && Object.keys(now).length === Object.keys(cid).length, '组件集与每个变体的 ID 都没变（' + Object.keys(cid).length + ' 个）');
  check(/新建 0、/.test(r.msg) && /移除 0/.test(r.msg), '没有新建或移除：' + r.msg);

  console.log('⑦ 生成标杆页 P06');
  r = await run(st, { command: 'benchmark' });
  check(/^慢牛 Milo 标杆页 P06 已导入/.test(r.msg), '插件正常结束：' + r.msg);
  check(r.logs.length === 0, '没有提醒和报错' + (r.logs.length ? '：' + r.logs[0].slice(0, 400) : ''));
  const bsec = sectionOf(st, 'Benchmark')[0];
  const phones = bsec ? bsec.children.filter((n) => n.type === 'FRAME' && n.name.indexOf('P06') === 0) : [];
  check(phones.length === 3 && phones.every((f) => f.width === 360 && f.height === 800), '3 个 360×800 画板');
  check(unboundSolids(bsec).length === 0, '标杆页每个纯色填充 / 描边都绑定了变量' + (unboundSolids(bsec).length ? '：' + unboundSolids(bsec).slice(0, 5).join('，') : ''));
  const loose = []; phones.forEach((f) => walk(f, (n, inI) => { if (!inI && ['RECTANGLE', 'ELLIPSE', 'VECTOR', 'LINE', 'POLYGON', 'STAR'].indexOf(n.type) >= 0 && n.name.indexOf('leader/') !== 0) loose.push(f.name + '/' + n.name); }));
  check(phones.length && loose.length === 0, '画板里除引线外没有散落的图形（全是实例或容器）' + (loose.length ? '：' + loose.slice(0, 5).join('，') : ''));
  const unstyled = []; phones.forEach((f) => walk(f, (n) => { if (n.type === 'TEXT' && !n._textStyleId) unstyled.push(n.name); }));
  check(phones.length && unstyled.length === 0, '所有文字都套用了 Milo/ 文字样式（字号下限由样式保证）' + (unstyled.length ? '：' + unstyled.join('，') : ''));
  const capsIn = (f) => f.children.filter((n) => n.type === 'INSTANCE' && n.name.indexOf('capsule/') === 0);
  const stateOf = (i) => i.mainComponent && i.mainComponent.name;
  const [pm, ps, pe] = phones;
  check(pm && capsIn(pm).length === DATA.bodymapMuscles.front.length, '正面 ' + DATA.bodymapMuscles.front.length + ' 个肌头都有胶囊');
  check(pm && capsIn(pm).filter((i) => stateOf(i) === 'state=放大中心').length === 1 && capsIn(pm).find((i) => stateOf(i) === 'state=放大中心').name === 'capsule/' + DATA.p06.focus, '① 只有一个放大中心，且是「中下胸」');
  check(pm && capsIn(pm).filter((i) => stateOf(i) === 'state=邻近放大').length === 2, '① 中心上下各一个邻近放大（余弦衰减 R=3）');
  const ys = pm ? capsIn(pm).map((i) => [i.y, i.height]) : [];
  check(ys.length && ys.every((y, i) => !i || y[0] >= ys[i - 1][0] + ys[i - 1][1]), '① 胶囊自上而下排列，没有重叠');
  check(ps && capsIn(ps).filter((i) => stateOf(i) === 'state=选中').length === 1 && ps.findOne((n) => n.name === 'sheet'), '② 一个选中的胶囊 + 底部详情面板');
  check(pe && capsIn(pe).every((i) => stateOf(i) === 'state=未练') && pe.findOne((n) => n.name === 'empty-note'), '③ 空态：全部「未练」，有空态提示');
  check(phones.length && phones.every((f) => f.findAll((n) => n.type === 'TEXT' && /MuscleWiki/.test(n.characters)).length === 1), '每个画板都有「人体图：MuscleWiki」署名');
  check(phones.length && phones.every((f) => f.findAll((n) => n.name.indexOf('leader/') === 0 && n.type === 'VECTOR').length === capsIn(f).length), '每个胶囊一条引线');
  const lead = pm && pm.findOne((n) => n.name === 'leader/' + DATA.p06.focus);
  const body = pm && pm.findOne((n) => n.name === 'body');
  check(lead && body && lead.x >= body.x && lead.x <= body.x + body.width && lead.y >= body.y && lead.y <= body.y + body.height, '「中下胸」引线的起点落在人体图范围内');
  const tooBig = []; phones.forEach((f) => walk(f, (n) => { if (n.type === 'FRAME' && n.clipsContent && n._contentH > n.height + 0.5) tooBig.push(n.name); }));
  check(tooBig.length === 0, '画板内没有会裁掉内容的自动布局框' + (tooBig.length ? '：' + tooBig.join('，') : ''));

  if (process.argv.indexOf('--render') > 0) { fs.writeFileSync(process.argv[process.argv.indexOf('--render') + 1], renderHTML(phones, st, DATA)); console.log('  · 已把标杆页的模拟结果画到 ' + process.argv[process.argv.indexOf('--render') + 1] + '（粗略：文字宽度是估的）'); }

  console.log('⑧ 标杆页重跑');
  r = await run(st, { command: 'benchmark' });
  check(sectionOf(st, 'Benchmark').length === 1 && sectionOf(st, 'Components').length === 1 && sectionOf(st, 'Foundations').length === 1, '三个分区各只有一个');
  check(r.logs.length === 0 && /新建 0、/.test(r.msg), '重跑不新建变量 / 样式 / 组件：' + r.msg);

  const bad = results.filter((x) => !x[0]).length;
  console.log(bad ? `\n${bad} 项失败` : `\n全部 ${results.length} 项通过`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
