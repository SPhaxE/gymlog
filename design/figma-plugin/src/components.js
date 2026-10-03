/* 组件：分区「Components · 配重片」。按名字幂等——已有的组件集与变体保留节点 ID、只重建内部，已放出去的实例不会断。
 * 组件只服务标杆页 P06 与导航；P01 等页面的组件到阶段 6 做到那页时再加。 */

// ---------------------------------------------------------------- 小工具
const TOK = (V, k) => V.tok[k];
const COL = (V, k) => V.tok['color/' + k];
const fill = (V, k, opacity) => [boundPaint(COL(V, k), opacity)];
const hexOf = (k) => T.primitives.color[T.semantic.color[k].ref].value;
const r1 = (x) => String(Math.round(x * 10) / 10);
const HEAD_RANGES = { large: [8, 16, 22], medium: [7, 13, 18], small: [5, 10, 14] }; // 最低 / 适宜 / 上限，ia §1.10 按肌头大小缩放
const TIER_CN = { large: '大', medium: '中', small: '小' };

function rect(parent, name, w, h, paints) {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(Math.max(0.01, w), Math.max(0.01, h));
  r.fills = paints || [];
  parent.appendChild(r);
  return r;
}
function ellipse(parent, name, d, paints) {
  const e = figma.createEllipse();
  e.name = name;
  e.resize(d, d);
  e.fills = paints || [];
  parent.appendChild(e);
  return e;
}
// 折线矢量：坐标先归一化到自身原点，再把节点挪到最小点，避免依赖 Figma 对路径偏移的处理方式
function polyline(parent, name, pts, closed) {
  const minX = Math.min.apply(null, pts.map((p) => p[0])), minY = Math.min.apply(null, pts.map((p) => p[1]));
  const f = (n) => (Math.round(n * 100) / 100).toString();
  const data = pts.map((p, i) => (i ? 'L ' : 'M ') + f(p[0] - minX) + ' ' + f(p[1] - minY)).join(' ') + (closed ? ' Z' : '');
  const v = figma.createVector();
  v.name = name;
  v.vectorPaths = [{ windingRule: 'NONE', data: data }];
  v.fills = [];
  parent.appendChild(v);
  v.x = minX;
  v.y = minY;
  return v;
}
function stroke(V, node, colorKey, weightKey, opacity) {
  node.strokes = [boundPaint(COL(V, colorKey), opacity)];
  node.strokeWeight = T.number[weightKey].value;
  try { node.setBoundVariable('strokeWeight', TOK(V, weightKey)); } catch (e) { /* 旧版本不能绑定描边宽度 */ }
}
// 胶囊轮廓上的点：从顶边正中出发、顺时针，走过 frac 比例的周长
function pillPoints(x, y, w, h, frac, n) {
  const r = h / 2, sx = w - 2 * r, L = 2 * sx + 2 * Math.PI * r;
  const at = (s) => {
    if (s <= sx / 2) return [x + w / 2 + s, y];
    s -= sx / 2;
    if (s <= Math.PI * r) { const a = -Math.PI / 2 + s / r; return [x + w - r + r * Math.cos(a), y + r + r * Math.sin(a)]; }
    s -= Math.PI * r;
    if (s <= sx) return [x + w - r - s, y + h];
    s -= sx;
    if (s <= Math.PI * r) { const a = Math.PI / 2 + s / r; return [x + r + r * Math.cos(a), y + r + r * Math.sin(a)]; }
    s -= Math.PI * r;
    return [x + r + s, y];
  };
  const N = Math.max(2, Math.ceil((n || 180) * frac));
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(at((i / N) * frac * L));
  return pts;
}
// 刻度条的已填部分：硬边线性渐变（在实例里覆盖 fills 即可改比例，不用改尺寸）
function hardFill(colorKey, frac, opacity) {
  const c = rgba(hexOf(colorKey));
  const a = opacity == null ? 1 : opacity;
  const f = Math.max(0, Math.min(1, frac));
  return { type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
    { position: 0, color: { r: c.r, g: c.g, b: c.b, a: a } }, { position: f, color: { r: c.r, g: c.g, b: c.b, a: a } },
    { position: Math.min(1, f + 0.0001), color: { r: c.r, g: c.g, b: c.b, a: 0 } }, { position: 1, color: { r: c.r, g: c.g, b: c.b, a: 0 } }] };
}
async function txt(parent, name, chars, styleName, S, V, colorKey, opacity) {
  const t = await label(parent, chars, S.text[styleName], COL(V, colorKey));
  t.name = name;
  if (opacity != null) t.fills = [boundPaint(COL(V, colorKey), opacity)];
  return t;
}
function auto(parent, name, dir, gap, pad) {
  const f = frame(name, dir, gap);
  if (pad) { f.paddingTop = pad[0]; f.paddingRight = pad[1]; f.paddingBottom = pad[2]; f.paddingLeft = pad[3]; }
  if (parent) parent.appendChild(f);
  return f;
}
async function svgNode(parent, name, svg) {
  const n = figma.createNodeFromSvg(svg);
  n.name = name;
  n.fills = [];
  n.clipsContent = false;
  parent.appendChild(n);
  return n;
}
async function resetComponent(c) {
  for (const ch of c.children.slice()) ch.remove();
  c.layoutMode = 'NONE';
  c.fills = [];
  c.strokes = [];
  c.effects = [];
  c.clipsContent = false;
  await c.setEffectStyleIdAsync('');
  await c.setFillStyleIdAsync('');
}

// ---------------------------------------------------------------- 组件集（幂等）
function combos(axes) {
  let out = [{}];
  for (const [k, vals] of axes) {
    const next = [];
    for (const o of out) for (const v of vals) { const n = Object.assign({}, o); n[k] = v; next.push(n); }
    out = next;
  }
  return out;
}
const variantName = (p) => Object.keys(p).map((k) => k + '=' + p[k]).join(', ');

async function upsertSet(sec, name, desc, axes, build, skip) {
  let set = sec.findChild((n) => n.type === 'COMPONENT_SET' && n.name === name);
  const keep = [], fresh = [];
  for (const props of combos(axes).filter((q) => !(skip && skip(q)))) {
    const vname = variantName(props);
    let comp = set ? set.findChild((c) => c.type === 'COMPONENT' && c.name === vname) : null;
    if (comp) { await resetComponent(comp); report.updated++; }
    else { comp = figma.createComponent(); comp.name = vname; report.created++; if (set) set.appendChild(comp); else fresh.push(comp); }
    await build(comp, props);
    keep.push(comp.id);
  }
  if (!set) { set = figma.combineAsVariants(fresh, sec); set.name = name; }
  else if (fresh.length) warn('不该出现：新变体没有挂到组件集上');
  for (const c of set.children.slice()) if (keep.indexOf(c.id) < 0) { warn('组件 ' + name + ' 的变体「' + c.name + '」仓库里已没有，已移除'); c.remove(); report.removed++; }
  set.description = desc;
  set.fills = [];
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.itemSpacing = 24;
  set.counterAxisSpacing = 24;
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24;
  set.resize(1400, 100);
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  return set;
}
async function upsertComp(sec, name, desc, build) {
  let comp = sec.findChild((n) => n.type === 'COMPONENT' && n.name === name);
  if (comp) { await resetComponent(comp); report.updated++; } else { comp = figma.createComponent(); comp.name = name; sec.appendChild(comp); report.created++; }
  await build(comp);
  comp.description = desc;
  return comp;
}
function variant(set, props) {
  const c = set.findChild((n) => n.type === 'COMPONENT' && n.name === variantName(props));
  if (!c) throw new Error('找不到变体 ' + set.name + ' / ' + variantName(props));
  return c;
}
function findSection(name) {
  return figma.currentPage.findAll((n) => n.type === 'SECTION' && n.name === name)[0] || null;
}
function placeRight() {
  let x = 0;
  for (const n of figma.currentPage.children) x = Math.max(x, n.x + n.width);
  return figma.currentPage.children.length ? x + 400 : 0;
}

// ---------------------------------------------------------------- 各组件
async function buildScaleBar(c, p, V, S) {
  const panel = p.size === '面板', onAcc = p.tone === '荧光底';
  const W = panel ? 296 : 150, H = panel ? 34 : 4, by = panel ? 4 : 1, bh = panel ? 10 : 2;
  c.resize(W, H);
  const ranges = HEAD_RANGES[{ 大: 'large', 中: 'medium', 小: 'small' }[p.tier]];
  const sc = ranges[2] * (panel ? 1.15 : 1.1);
  const ink = onAcc ? 'text/on-accent' : 'data/fill';
  const track = rect(c, 'track', W, bh, onAcc ? fill(V, 'text/on-accent', 0.2) : fill(V, 'data/track'));
  track.y = by;
  bindRadius(track, TOK(V, 'radius/xs'));
  const fl = rect(c, 'fill', W, bh, [hardFill(ink, 0.45)]);
  fl.y = by;
  bindRadius(fl, TOK(V, 'radius/xs'));
  const names = ['最低', '适宜', '上限'], keys = ['mev', 'mav', 'mrv'];
  for (let i = 0; i < 3; i++) {
    const x = (W * ranges[i]) / sc;
    const t = rect(c, 'tick/' + keys[i], 1.5, panel ? 18 : 4, onAcc ? fill(V, 'text/on-accent') : fill(V, 'data/tick'));
    t.x = x - 0.75;
    t.y = 0;
    if (panel) {
      const l = await txt(c, 'lb/' + keys[i], names[i] + ' ' + ranges[i], 'Micro', S, V, 'text/secondary');
      l.x = Math.min(W - l.width, Math.max(0, x - l.width / 2));
      l.y = 20;
    }
  }
  for (const ch of c.children) ch.constraints = { horizontal: 'SCALE', vertical: 'MIN' };
}

async function buildCapsule(c, p, V, S, K) {
  const st = p.state, center = st === '放大中心', near = st === '邻近放大', dead = st === '未练';
  const W = T.number['size/capsule-w'].value + (center ? T.number['size/capsule-mag-w'].value : near ? 13 : 0);
  c.layoutMode = 'VERTICAL';
  c.itemSpacing = center ? 4 : near ? 2 : 1;
  const pv = center ? 9 : near ? 5 : 3, ph = center ? 14 : near ? 12 : 10;
  c.paddingTop = c.paddingBottom = pv;
  c.paddingLeft = ph;
  c.paddingRight = ph - 2;
  c.resize(W, T.number['size/capsule-h'].value);
  c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisSizingMode = 'AUTO';
  bindRadius(c, TOK(V, 'radius/pill'));
  if (dead) { c.fills = fill(V, 'bg/raised'); await c.setFillStyleIdAsync(S.paint['Data/Untrained'].id); }
  else c.fills = fill(V, center ? 'accent/default' : 'bg/raised');
  if (center) await c.setEffectStyleIdAsync(S.effect['Glow/Focus'].id);
  if (st === '选中') stroke(V, c, 'accent/default', 'stroke/focus');
  const ink = center ? 'text/on-accent' : dead ? 'text/secondary' : 'text/primary';
  const ink2 = center ? 'text/on-accent-secondary' : 'text/secondary';
  const row = auto(c, 'row', 'HORIZONTAL', 6);
  row.layoutSizingHorizontal = 'FILL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.counterAxisAlignItems = 'CENTER';
  await txt(row, 'name', '中下胸', center ? 'Body/Strong' : near ? 'Label' : 'Micro', S, V, ink);
  const nums = auto(row, 'nums', 'HORIZONTAL', 1);
  nums.counterAxisAlignItems = 'MAX';
  await txt(nums, 'num', '7.5', center ? 'Number/M' : near ? 'Number/S' : 'Number/XS', S, V, ink);
  await txt(nums, 'den', '/16', 'Caption', S, V, ink2);
  if (center || near) await txt(c, 'sub', '恢复 3% · 修复期', 'Caption', S, V, ink2);
  const bar = variant(K.ScaleBar, { size: '胶囊', tone: center ? '荧光底' : '默认', tier: '大' }).createInstance();
  bar.name = 'bar';
  c.appendChild(bar);
  bar.layoutSizingHorizontal = 'FILL';
}

async function buildNavPill(c, p, V, S) {
  const O = 3, W = T.number['size/nav-w'].value, H = T.number['size/nav-h'].value;
  const PW = T.number['size/nav-pill-w'].value, SW = (W - 12 - PW) / 2, PH = T.number['size/nav-pill-h'].value, PAD = 6;
  const sel = ['今日', '进度', '设置'].indexOf(p.selected);
  const prog = { 无环: null, 进度: 0.57, 休息: null, '进度+休息': 0.57, 满环: 1 }[p.ring];
  const rest = p.ring === '休息' || p.ring === '进度+休息' ? 0.53 : null;
  c.resize(W + 2 * O, H + 2 * O);
  const shell = rect(c, 'shell', W, H, fill(V, 'nav/bg'));
  shell.x = O; shell.y = O;
  bindRadius(shell, TOK(V, 'radius/pill'));
  await shell.setEffectStyleIdAsync(S.effect['Elevation/Float'].id);
  const xs = [], ws = [];
  let x = PAD;
  for (let i = 0; i < 3; i++) { const w = i === sel ? PW : SW; xs.push(x); ws.push(w); x += w; }
  const k = p.state === '按下' ? 0.96 : 1;
  const pill = rect(c, 'pill', ws[sel] * k, PH * k, fill(V, 'nav/pill'));
  pill.x = O + xs[sel] + (ws[sel] * (1 - k)) / 2;
  pill.y = O + PAD + (PH * (1 - k)) / 2;
  bindRadius(pill, TOK(V, 'radius/pill'));
  const names = ['今日', '进度', '设置'], icons = ['today', 'progress', 'settings'];
  for (let i = 0; i < 3; i++) {
    const on = i === sel;
    const item = auto(c, 'item/' + names[i], 'HORIZONTAL', 6);
    item.primaryAxisAlignItems = 'CENTER';
    item.counterAxisAlignItems = 'CENTER';
    item.resize(ws[i], PH);
    item.primaryAxisSizingMode = 'FIXED';
    item.counterAxisSizingMode = 'FIXED';
    item.x = O + xs[i];
    item.y = O + PAD;
    const ic = await svgNode(item, 'icon', DATA.icons[icons[i]]);
    ic.rescale(20 / ic.width);
    for (const v of ic.findAll((n) => n.type === 'VECTOR')) { v.fills = fill(V, on ? 'nav/pill-ink' : 'nav/ink'); v.strokes = []; }
    if (on) {
      await txt(item, 'label', names[i], 'Label', S, V, 'nav/pill-ink');
      if (rest != null) await txt(item, 'time', '1:35', 'Readout/M', S, V, 'nav/pill-ink');
    }
  }
  // 外圈：今日进度（实线，从顶边正中顺时针）
  if (prog != null) {
    const track = polyline(c, 'ring/track', pillPoints(O - 1.5, O - 1.5, W + 3, H + 3, 1, 180), true);
    stroke(V, track, 'nav/track', 'stroke/ring-track');
    if (prog > 0) {
      const pr = polyline(c, 'ring/progress', pillPoints(O - 1.5, O - 1.5, W + 3, H + 3, prog, 180), prog >= 1);
      stroke(V, pr, 'nav/progress', 'stroke/ring-progress');
      pr.strokeCap = 'ROUND';
    }
  }
  // 小胶囊：休息倒计时（虚线 + 端点圆点，与胶囊之间留缝）
  if (rest != null) {
    const G = T.number['stroke/ring-gap'].value;
    const pts = pillPoints(O + xs[sel] - G, O + PAD - G, ws[sel] + 2 * G, PH + 2 * G, rest, 140);
    const rs = polyline(c, 'ring/rest', pts, false);
    stroke(V, rs, 'nav/rest', 'stroke/ring-rest');
    rs.dashPattern = [T.number['stroke/ring-rest-dash'].value, T.number['stroke/ring-rest-gapdash'].value];
    rs.strokeCap = 'ROUND';
    const d = 2 * (T.number['stroke/ring-rest'].value + 1.3);
    const dot = ellipse(c, 'ring/rest-dot', d, fill(V, 'nav/rest'));
    dot.x = pts[pts.length - 1][0] - d / 2;
    dot.y = pts[pts.length - 1][1] - d / 2;
  }
}

async function buildSegmented(c, p, V, S) {
  const n = Number(p.items), sel = Number(p.selected) - 1;
  const labels = n === 3 ? ['容量与恢复', '训练记录', '动作进步'] : ['正面', '背面'];
  c.layoutMode = 'HORIZONTAL';
  c.itemSpacing = 0;
  c.paddingLeft = c.paddingRight = c.paddingTop = c.paddingBottom = 3;
  c.fills = fill(V, 'bg/raised');
  bindRadius(c, TOK(V, 'radius/pill'));
  if (n === 3) { c.resize(328, 40); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO'; }
  for (let i = 0; i < n; i++) {
    const it = auto(c, 'item/' + (i + 1), 'HORIZONTAL', 0, n === 3 ? [8, 10, 8, 10] : [5, 12, 5, 12]);
    it.primaryAxisAlignItems = 'CENTER';
    bindRadius(it, TOK(V, 'radius/pill'));
    if (i === sel) it.fills = fill(V, 'control/selected');
    if (n === 3) it.layoutGrow = 1;
    await txt(it, 'label', labels[i], n === 3 ? 'Label' : 'Caption', S, V, i === sel ? 'control/selected-ink' : 'text/secondary');
  }
}

async function buildButton(c, p, V, S) {
  const main = p.kind === '主';
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisAlignItems = 'CENTER';
  c.counterAxisAlignItems = 'CENTER';
  c.paddingLeft = c.paddingRight = 24;
  c.resize(160, T.number[p.size === 'L' ? 'size/button-h' : 'size/button-h-s'].value);
  c.primaryAxisSizingMode = 'FIXED';
  c.counterAxisSizingMode = 'FIXED';
  try { c.setBoundVariable('height', TOK(V, p.size === 'L' ? 'size/button-h' : 'size/button-h-s')); } catch (e) { /* 可选 */ }
  bindRadius(c, TOK(V, 'radius/pill'));
  if (main) c.fills = fill(V, 'action/primary'); else stroke(V, c, 'line/default', 'stroke/hairline');
  await txt(c, 'label', main ? '关闭' : '展开更多', 'Body/Strong', S, V, main ? 'action/primary-ink' : 'text/primary');
}

async function buildRecovery(c, p, V, S) {
  await blockFrame(c, V);
  const top = await blockTop(c, V, S, '恢复度', '3', '%', p.phase, '还需约 70 小时 · 本次窗口 61 小时');
  const segs = [['修复期', 0.5], ['恢复中', 0.5], ['黄金窗', 1], ['已回落', 0.6]], total = 2.6, W = 300 - 9;
  const bar = auto(c, 'phases', 'HORIZONTAL', 3);
  const lbs = auto(c, 'phase-labels', 'HORIZONTAL', 3);
  for (const s of segs) {
    const w = (W * s[1]) / total, on = s[0] === p.phase;
    const r = rect(bar, 'phase/' + s[0], w, 8, fill(V, on ? 'accent/default' : 'data/track'));
    bindRadius(r, TOK(V, 'radius/xs'));
    const l = await txt(lbs, 'lb/' + s[0], s[0], 'Micro', S, V, on ? 'text/primary' : 'text/secondary');
    l.textAutoResize = 'HEIGHT';
    l.resize(w, l.height);
    l.textAutoResize = 'HEIGHT';
  }
  return top;
}
async function buildVolume(c, p, V, S, K) {
  await blockFrame(c, V);
  await blockTop(c, V, S, '近 7 天', '7.5', '组', '低于最低有效量', '还差 0.5 组到最低有效量');
  const bar = variant(K.ScaleBar, { size: '面板', tone: '默认', tier: p.tier }).createInstance();
  bar.name = 'bar';
  c.appendChild(bar);
}
async function blockFrame(c, V) {
  c.layoutMode = 'VERTICAL';
  c.itemSpacing = 10;
  c.paddingLeft = c.paddingRight = c.paddingTop = c.paddingBottom = 14;
  c.resize(328, 100);
  c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisSizingMode = 'AUTO';
  c.fills = fill(V, 'bg/raised');
  bindRadius(c, TOK(V, 'radius/l'));
}
async function blockTop(c, V, S, k, big, unit, ph, sub) {
  const row = auto(c, 'top', 'HORIZONTAL', 8);
  row.layoutSizingHorizontal = 'FILL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.counterAxisAlignItems = 'MAX';
  const left = auto(row, 'left', 'VERTICAL', 2);
  await txt(left, 'k', k, 'Caption', S, V, 'text/secondary');
  const nums = auto(left, 'nums', 'HORIZONTAL', 3);
  nums.counterAxisAlignItems = 'MAX';
  await txt(nums, 'big', big, 'Number/XL', S, V, 'text/primary');
  await txt(nums, 'unit', unit, 'Body/Strong', S, V, 'text/secondary');
  const right = auto(row, 'right', 'VERTICAL', 2);
  right.counterAxisAlignItems = 'MAX';
  await txt(right, 'ph', ph, 'Body/Strong', S, V, 'text/primary');
  await txt(right, 'sub', sub, 'Caption', S, V, 'text/secondary');
  return row;
}

async function buildBody(c, p, V, S) {
  const g = p.gender === '男' ? 'male' : 'female', view = p.view === '正面' ? 'front' : 'back';
  const art = await svgNode(c, 'art', DATA.bodymap[g][view]);
  art.rescale(176 / art.width);
  c.resize(art.width, art.height);
  art.x = 0; art.y = 0;
  for (const grp of art.children) {
    const vecs = grp.findAll((n) => n.type === 'VECTOR' || n.type === 'LINE');
    if (grp.name === 'neutral') vecs.forEach((v) => { v.fills = fill(V, 'data/body'); stroke(V, v, 'line/strong', 'stroke/hairline'); v.strokeWeight = 0.6; });
    else if (grp.name === 'contour') { grp.opacity = 0.5; vecs.forEach((v) => { if (v.type === 'VECTOR') v.fills = []; stroke(V, v, 'line/strong', 'stroke/hairline'); }); }
    else if (grp.name.indexOf('muscle--') === 0) {
      grp.name = 'muscle/' + grp.name.slice(8);
      vecs.forEach((v) => { v.fills = fill(V, 'data/tier-none'); stroke(V, v, 'data/tier-none-edge', 'stroke/hairline'); v.strokeWeight = 0.6; });
    }
  }
  if (!art.findAll((n) => n.name.indexOf('muscle/') === 0).length) warn('人体图导入后没找到任何 muscle/ 图层：Figma 没有用 SVG 的 id 命名图层，肌肉着色会失效');
}

async function buildLegend(c, V, S) {
  c.layoutMode = 'HORIZONTAL';
  c.itemSpacing = 10;
  c.counterAxisAlignItems = 'CENTER';
  const tiers = [['未练', 'none'], ['不足', 'low'], ['达标', 'ok'], ['超量', 'over']];
  for (const t of tiers) {
    const it = auto(c, 'tier/' + t[1], 'HORIZONTAL', 4);
    it.counterAxisAlignItems = 'CENTER';
    const chip = rect(it, 'chip', 16, 8, fill(V, 'data/tier-none'));
    bindRadius(chip, TOK(V, 'radius/pill'));
    if (t[1] === 'none') stroke(V, chip, 'data/tier-none-edge', 'stroke/hairline');
    if (t[1] === 'low') await chip.setFillStyleIdAsync(S.paint['Data/Tier-Low'].id);
    if (t[1] === 'ok') chip.fills = fill(V, 'data/tier-ok');
    if (t[1] === 'over') await chip.setFillStyleIdAsync(S.paint['Data/Tier-Over'].id);
    await txt(it, 'label', t[0], 'Micro', S, V, 'text/secondary');
  }
}

// ---------------------------------------------------------------- 入口
async function importComponents(V, S) {
  let sec = findSection(COMPONENTS_SECTION);
  if (!sec) { sec = figma.createSection(); sec.name = COMPONENTS_SECTION; sec.x = placeRight(); sec.y = 0; }
  sec.fills = fill(V, 'bg/base');
  for (const n of sec.children.slice()) if (n.type === 'TEXT') n.remove(); // 说明文字每次重画；组件保留
  const K = {};
  const ctx = [V, S];
  K.ScaleBar = await upsertSet(sec, 'ScaleBar', '刻度条：空槽、已填、三条地标（最低有效量 / 适宜量 / 上限）。已填比例在实例里改 fill 图层的渐变，不改尺寸。',
    [['size', ['胶囊', '面板']], ['tone', ['默认', '荧光底']], ['tier', ['大', '中', '小']]], (c, p) => buildScaleBar(c, p, ...ctx),
    (q) => q.size === '面板' && q.tone === '荧光底'); // 面板只有默认底色
  K.Capsule = await upsertSet(sec, 'Capsule', 'P06 肌头胶囊。放大中心态是荧光主角，每屏只能有一个；近 7 天 0 组用「未练」态。',
    [['state', ['静止', '邻近放大', '放大中心', '选中', '未练']]], (c, p) => buildCapsule(c, p, V, S, K));
  K.NavPill = await upsertSet(sec, 'NavPill', '导航胶囊环（ia §1.12）：外圈实线 = 今日进度；小胶囊虚线 + 端点圆点 = 休息倒计时。示意值：进度 57%、休息剩 53%。',
    [['ring', ['无环', '进度', '休息', '进度+休息', '满环']], ['selected', ['今日', '进度', '设置']], ['state', ['默认', '按下']]], (c, p) => buildNavPill(c, p, ...ctx));
  K.Segmented = await upsertSet(sec, 'Segmented', '三项分段控件：P06 顶部「容量与恢复 / 训练记录 / 动作进步」。',
    [['selected', ['1', '2', '3']]], (c, p) => buildSegmented(c, { items: '3', selected: p.selected }, ...ctx));
  K.Segmented2 = await upsertSet(sec, 'Segmented2', '两项分段控件：正面 / 背面、男 / 女（实例里改文字）。',
    [['selected', ['1', '2']]], (c, p) => buildSegmented(c, { items: '2', selected: p.selected }, ...ctx));
  K.Button = await upsertSet(sec, 'Button', '按钮：主按钮暖白（不是荧光），次按钮只有描边。',
    [['kind', ['主', '次']], ['size', ['L', 'S']]], (c, p) => buildButton(c, p, ...ctx));
  K.RecoveryBlock = await upsertSet(sec, 'RecoveryBlock', '详情面板 · 恢复度：大数字 + 时相 + 四段时相条（当前段荧光）。',
    [['phase', ['修复期', '恢复中', '黄金窗', '已回落']]], (c, p) => buildRecovery(c, p, ...ctx));
  K.VolumeBlock = await upsertSet(sec, 'VolumeBlock', '详情面板 · 近 7 天组数：大数字 + 档位 + 刻度条（面板档）。',
    [['tier', ['大', '中', '小']]], (c, p) => buildVolume(c, p, V, S, K));
  K.BodyFigure = await upsertSet(sec, 'BodyFigure', '人体图：MuscleWiki 解剖素材（public/bodymap，V1 原样）。每个肌头一组 muscle/<id>，实例里改填充表示容量档位。不要用其他人体。',
    [['gender', ['男', '女']], ['view', ['正面', '背面']]], (c, p) => buildBody(c, p, ...ctx));
  K.TierLegend = await upsertComp(sec, 'TierLegend', '容量四档图例（ia §1.10）。', (c) => buildLegend(c, ...ctx));
  K.KpiRow = await upsertComp(sec, 'KpiRow', 'P06 摘要三项：近 7 天总负荷 / 完成组数 / 训练天数。', async (c) => {
    c.layoutMode = 'HORIZONTAL'; c.itemSpacing = 12; c.resize(328, 50); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
    const cols = [['13,854', 'kg', '总负荷', 'Number/L'], ['43', '', '完成组数', 'Number/M'], ['4', '', '训练天数', 'Number/M']];
    for (let i = 0; i < 3; i++) {
      const col = auto(c, 'col' + (i + 1), 'VERTICAL', 0);
      col.layoutGrow = 1;
      const row = auto(col, 'value', 'HORIZONTAL', 3);
      row.counterAxisAlignItems = 'MAX';
      await txt(row, 'v' + (i + 1), cols[i][0], cols[i][3], S, V, 'text/primary');
      if (cols[i][1]) await txt(row, 'u' + (i + 1), cols[i][1], 'Caption', S, V, 'text/secondary');
      await txt(col, 'l' + (i + 1), cols[i][2], 'Caption', S, V, 'text/secondary');
    }
  });
  K.PageHeader = await upsertComp(sec, 'PageHeader', '页面标题 + 右侧说明。', async (c) => {
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.counterAxisAlignItems = 'CENTER';
    c.resize(328, 40); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
    await txt(c, 'title', '进度', 'Title/L', S, V, 'text/primary');
    await txt(c, 'caption', '近 7 天 · 滚动统计', 'Caption', S, V, 'text/secondary');
  });
  K.SheetHeader = await upsertComp(sec, 'SheetHeader', '底部面板标题行：肌头名 + 肌群大小与基础窗口。', async (c) => {
    c.layoutMode = 'HORIZONTAL'; c.itemSpacing = 8; c.counterAxisAlignItems = 'CENTER';
    await txt(c, 'title', '中下胸', 'Title/M', S, V, 'text/primary');
    const tag = auto(c, 'tag-box', 'HORIZONTAL', 0, [3, 7, 3, 7]);
    stroke(V, tag, 'line/default', 'stroke/hairline');
    bindRadius(tag, TOK(V, 'radius/xs'));
    await txt(tag, 'tag', '大肌群 · 基础窗口 72 小时', 'Micro', S, V, 'text/secondary');
  });
  K.InfoRow = await upsertComp(sec, 'InfoRow', '面板里的一行：左标签、右数值。', async (c) => {
    c.layoutMode = 'HORIZONTAL'; c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.counterAxisAlignItems = 'CENTER';
    c.paddingLeft = c.paddingRight = c.paddingTop = c.paddingBottom = 14;
    c.resize(328, 50); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'AUTO';
    c.fills = fill(V, 'bg/raised'); bindRadius(c, TOK(V, 'radius/l'));
    await txt(c, 'label', '最近一次练', 'Body/Strong', S, V, 'text/primary');
    await txt(c, 'value', '2 小时前 · 3 组', 'Body', S, V, 'text/primary');
  });
  K.InlineNote = await upsertComp(sec, 'InlineNote', '一行提示（如空态）。', async (c) => {
    c.layoutMode = 'HORIZONTAL'; c.itemSpacing = 6; c.counterAxisAlignItems = 'CENTER';
    ellipse(c, 'dot', 6, fill(V, 'text/secondary'));
    await txt(c, 'text', '练完第一次训练后这里会有数据', 'Caption', S, V, 'text/secondary');
  });
  K.TouchPoint = await upsertComp(sec, 'TouchPoint', '放大镜的手指位置示意（只在标杆页里用，不进产品）。', async (c) => {
    c.resize(46, 46);
    const e = ellipse(c, 'touch', 46, [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 1, g: 1, b: 1, a: 0.35 } }, { position: 1, color: { r: 1, g: 1, b: 1, a: 0 } }] }]);
    e.strokes = [boundPaint(COL(V, 'text/primary'), 0.25)];
    e.strokeWeight = 1.5;
  });

  // 排版：说明文字 + 组件，自上而下
  let y = 40;
  const order = ['NavPill', 'Capsule', 'ScaleBar', 'BodyFigure', 'RecoveryBlock', 'VolumeBlock', 'Segmented', 'Segmented2', 'Button', 'TierLegend', 'KpiRow', 'PageHeader', 'SheetHeader', 'InfoRow', 'InlineNote', 'TouchPoint'];
  for (const k of order) {
    const n = K[k];
    const cap = await label(sec, n.name + ' — ' + n.description, S.text['Body'], COL(V, 'text/secondary'), 1400);
    cap.x = 40; cap.y = y;
    y += cap.height + 12;
    n.x = 40; n.y = y;
    y += n.height + 56;
  }
  sec.resizeWithoutConstraints(1480, y + 40);
  return K;
}
