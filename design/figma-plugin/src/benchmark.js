/* 标杆页 P06：分区「Benchmark · P06」，每次整块重画。
 * 只用组件实例、变量和样式；画板里的散图形只有引线（leader/*）。数据来自 design/benchmark/p06.json。 */
const PHASE_CN = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '从未练过' };
const LEVEL_CN = { none: '未练', low: '低于最低有效量', ok: '达标', over: '超过最大可恢复量' };
const BASE_H = { large: 72, medium: 48, small: 24 };
const TIER_OF = { large: '大', medium: '中', small: '小' };

function setText(node, name, chars) {
  const t = node.findOne((n) => n.type === 'TEXT' && n.name === name);
  if (!t) throw new Error('实例 ' + node.name + ' 里没有文字图层 ' + name);
  t.characters = chars;
  return t;
}
function inst(parent, comp, x, y, name) {
  const i = comp.createInstance();
  if (name) i.name = name;
  parent.appendChild(i);
  i.x = x;
  i.y = y;
  return i;
}
function setBarFill(barInst, frac, onAccent) {
  const f = barInst.findOne((n) => n.name === 'fill');
  f.fills = [hardFill(onAccent ? 'text/on-accent' : 'data/fill', frac)];
}
function recText(h) {
  if (h.rec == null) return '从未练过';
  return '恢复 ' + Math.round(h.rec * 100) + '% · ' + PHASE_CN[h.phase];
}

async function paintMuscles(body, heads, focus, V, S) {
  for (const grp of body.findAll((n) => n.name.indexOf('muscle/') === 0)) {
    const id = grp.name.slice(7), h = heads[id];
    if (!h) continue;
    for (const v of grp.findAll((n) => n.type === 'VECTOR')) {
      if (h.level === 'low') { v.fills = fill(V, 'data/tier-low'); await v.setFillStyleIdAsync(S.paint['Data/Tier-Low'].id); }
      else if (h.level === 'over') { v.fills = fill(V, 'data/tier-over'); await v.setFillStyleIdAsync(S.paint['Data/Tier-Over'].id); }
      else v.fills = fill(V, h.level === 'ok' ? 'data/tier-ok' : 'data/tier-none');
      if (id === focus) { v.strokes = fill(V, 'accent/default'); v.strokeWeight = 1.6; }
    }
  }
}
// 锚点：每个肌头里最靠右的那一块（离胶囊轨道近），取包围盒中心；坐标换算到画板
function anchors(body, frameNode) {
  const fb = frameNode.absoluteBoundingBox, out = {};
  for (const grp of body.findAll((n) => n.name.indexOf('muscle/') === 0)) {
    let best = null;
    for (const v of grp.findAll((n) => n.type === 'VECTOR')) {
      const b = v.absoluteBoundingBox, cx = b.x + b.width / 2;
      if (!best || cx > best.cx) best = { cx: cx, cy: b.y + b.height / 2 };
    }
    if (best) out[grp.name.slice(7)] = [best.cx - fb.x, best.cy - fb.y];
  }
  return out;
}

async function buildP06(sec, x0, mode, V, S, K) {
  const P = DATA.p06, src = mode === 'empty' ? P.empty : P.done, heads = src.heads, focus = P.focus;
  const f = frame('P06 · ' + { mag: '① 放大镜按住「中下胸」', sheet: '② 松手后：详情面板', empty: '③ 空态（没有训练记录）' }[mode], 'NONE', 0);
  f.layoutMode = 'NONE';
  f.resize(T.number['size/screen-w'].value, T.number['size/screen-h'].value);
  f.fills = fill(V, 'bg/base');
  f.clipsContent = true;
  sec.appendChild(f);
  f.x = x0;
  f.y = 80;
  const G = T.number['space/l'].value; // 页面左右边距 16
  inst(f, K.PageHeader, G, 14, 'header');
  inst(f, variant(K.Segmented, { selected: '1' }), G, 60, 'tabs');
  const kpi = inst(f, K.KpiRow, G, 110, 'kpi');
  setText(kpi, 'v1', src.kpi[0]); setText(kpi, 'v2', src.kpi[1]); setText(kpi, 'v3', src.kpi[2]);
  const view = inst(f, variant(K.Segmented2, { selected: '1' }), G, 172, 'view');
  const sex = inst(f, variant(K.Segmented2, { selected: '1' }), 0, 172, 'gender');
  setText(sex.findOne((n) => n.name === 'item/1'), 'label', '男');
  setText(sex.findOne((n) => n.name === 'item/2'), 'label', '女');
  sex.x = 360 - G - sex.width;
  const hint = await label(f, '示意体型（不保存）', S.text['Micro'], COL(V, 'text/secondary'));
  hint.name = 'hint';
  hint.x = sex.x - hint.width - 8;
  hint.y = 172 + (view.height - hint.height) / 2;
  let top = 172 + view.height + 10;
  inst(f, K.TierLegend, G, top, 'legend');
  top += 22;
  if (mode === 'empty') { inst(f, K.InlineNote, G, top, 'empty-note'); top += 26; }

  // 人体图（MuscleWiki）+ 署名
  const body = inst(f, variant(K.BodyFigure, { gender: '男', view: '正面' }), 4, top + 6, 'body');
  await paintMuscles(body, heads, mode === 'empty' ? null : focus, V, S);
  const credit = await label(f, '人体图：MuscleWiki', S.text['Micro'], COL(V, 'text/secondary'));
  credit.name = 'credit';
  credit.x = 12;
  credit.y = body.y + body.height + 6;

  // 胶囊轨道：按锚点 y 排序；放大镜按余弦衰减（R=3）选变体
  const A = anchors(body, f);
  const ids = DATA.bodymapMuscles.front.filter((id) => A[id] && heads[id]).sort((a, b) => A[a][1] - A[b][1] || A[a][0] - A[b][0]);
  const fi = ids.indexOf(focus), R = T.number['motion/magnifier-radius'].value;
  let y = top;
  const caps = [];
  ids.forEach((id, i) => {
    const h = heads[id], d = Math.abs(i - fi);
    const w = mode === 'mag' && d < R ? 0.5 * (1 + Math.cos((Math.PI * d) / R)) : 0;
    let state = w > 0.99 ? '放大中心' : w > 0.5 ? '邻近放大' : '静止';
    if (mode === 'sheet' && id === focus) state = '选中';
    if (state === '静止' && !(h.sets > 0)) state = '未练';
    caps.push({ id: id, h: h, state: state });
  });
  for (const c of caps) {
    const node = inst(f, variant(K.Capsule, { state: c.state }), 0, y, 'capsule/' + c.id);
    node.x = 360 - 12 - node.width;
    setText(node, 'name', c.h.name);
    setText(node, 'num', r1(c.h.sets));
    setText(node, 'den', '/' + c.h.mav);
    if (c.state === '放大中心' || c.state === '邻近放大') setText(node, 'sub', recText(c.h));
    const bar = node.findOne((n) => n.type === 'INSTANCE' && n.name === 'bar');
    bar.swapComponent(variant(K.ScaleBar, { size: '胶囊', tone: c.state === '放大中心' ? '荧光底' : '默认', tier: TIER_OF[c.h.tier] }));
    setBarFill(bar, c.h.sets / (c.h.mrv * 1.1), c.state === '放大中心');
    c.node = node;
    y += node.height + T.number['space/2xs'].value;
  }
  // 引线：锚点 → 胶囊左缘中点，一条直线（2026-10-05 用户：折线的竖段在胶囊左边挤成一束）
  caps.forEach((c) => {
    const a = A[c.id], cy = c.node.y + c.node.height / 2, cx = c.node.x;
    const on = (mode === 'mag' || mode === 'sheet') && c.id === focus;
    const ln = polyline(f, 'leader/' + c.id, [[a[0], a[1]], [cx, cy]], false);
    ln.strokes = fill(V, on ? 'accent/default' : 'data/leader');
    ln.strokeWeight = on ? 1.3 : 0.8;
    const dot = ellipse(f, 'leader/' + c.id + '/dot', on ? 5 : 3, fill(V, on ? 'accent/default' : 'line/strong'));
    dot.x = a[0] - dot.width / 2;
    dot.y = a[1] - dot.height / 2;
  });
  for (const c of caps) f.appendChild(c.node); // 胶囊压在引线上面
  if (mode === 'mag') {
    const fc = caps[fi].node;
    inst(f, K.TouchPoint, 360 - 12 - 46 + 6, fc.y + fc.height / 2 - 23, 'touch');
  }

  // 导航上方的渐隐（内容滚到导航下面）+ 导航
  const fade = frame('fade', 'NONE', 0);
  fade.layoutMode = 'NONE';
  fade.resize(360, 120);
  const bg = rgba(hexOf('bg/base'));
  fade.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [{ position: 0, color: { r: bg.r, g: bg.g, b: bg.b, a: 0 } }, { position: 0.7, color: { r: bg.r, g: bg.g, b: bg.b, a: 1 } }, { position: 1, color: { r: bg.r, g: bg.g, b: bg.b, a: 1 } }] }];
  f.appendChild(fade);
  fade.x = 0;
  fade.y = 680;
  const nav = inst(f, variant(K.NavPill, { ring: mode === 'empty' ? '无环' : '满环', selected: '进度', state: '默认' }), 0, 0, 'nav');
  nav.x = (360 - nav.width) / 2;
  nav.y = 800 - T.number['size/nav-bottom'].value - nav.height + 3;

  if (mode === 'sheet') await buildSheet(f, heads[focus], V, S, K);
  return f;
}

async function buildSheet(f, h, V, S, K) {
  const scrim = frame('scrim', 'NONE', 0);
  scrim.layoutMode = 'NONE';
  scrim.resize(360, 800);
  scrim.fills = fill(V, 'bg/scrim');
  f.appendChild(scrim);
  const sh = auto(f, 'sheet', 'VERTICAL', 12, [10, 16, 18, 16]);
  sh.resize(360, 100);
  sh.counterAxisSizingMode = 'FIXED';
  sh.primaryAxisSizingMode = 'AUTO';
  sh.fills = fill(V, 'bg/sheet').concat(DATA_GRAIN_PAINTS(S));
  for (const k of ['topLeftRadius', 'topRightRadius']) sh.setBoundVariable(k, TOK(V, 'radius/xl'));
  await sh.setEffectStyleIdAsync(S.effect['Elevation/Sheet'].id);
  const grabRow = auto(sh, 'grab-row', 'HORIZONTAL', 0);
  grabRow.layoutSizingHorizontal = 'FILL';
  grabRow.primaryAxisAlignItems = 'CENTER';
  const grab = frame('grab', 'NONE', 0);
  grab.layoutMode = 'NONE';
  grab.resize(36, 4);
  grab.fills = fill(V, 'line/default');
  bindRadius(grab, TOK(V, 'radius/pill'));
  grabRow.appendChild(grab);
  const head = inst(sh, K.SheetHeader, 0, 0, 'head');
  setText(head, 'title', h.name);
  setText(head, 'tag', { large: '大肌群', medium: '中肌群', small: '小肌群' }[h.tier] + ' · 基础窗口 ' + BASE_H[h.tier] + ' 小时');
  const rec = inst(sh, variant(K.RecoveryBlock, { phase: PHASE_CN[h.phase] || '已回落' }), 0, 0, 'recovery');
  if (h.rec == null) { setText(rec, 'big', '—'); setText(rec, 'ph', '从未练过'); setText(rec, 'sub', '不显示恢复度'); }
  else {
    setText(rec, 'big', String(Math.round(h.rec * 100)));
    setText(rec, 'ph', PHASE_CN[h.phase]);
    setText(rec, 'sub', (h.left > 0.5 ? '还需约 ' + Math.round(h.left) + ' 小时 · ' : '已恢复 · ') + '本次窗口 ' + Math.round(h.win) + ' 小时');
  }
  const vol = inst(sh, variant(K.VolumeBlock, { tier: TIER_OF[h.tier] }), 0, 0, 'volume');
  setText(vol, 'big', r1(h.sets));
  setText(vol, 'ph', LEVEL_CN[h.level]);
  setText(vol, 'sub', h.level === 'low' ? '还差 ' + r1(h.mev - h.sets) + ' 组到最低有效量' : h.level === 'ok' ? '在最低有效量与上限之间' : h.level === 'over' ? '超过上限 ' + r1(h.sets - h.mrv) + ' 组' : '近 7 天没有练');
  setBarFill(vol.findOne((n) => n.type === 'INSTANCE' && n.name === 'bar'), h.sets / (h.mrv * 1.15), false);
  const last = inst(sh, K.InfoRow, 0, 0, 'last');
  setText(last, 'value', h.since == null ? '—' : Math.round(h.since) + ' 小时前 · ' + r1(h.lastSets) + ' 组');
  const btns = auto(sh, 'buttons', 'HORIZONTAL', 10);
  btns.layoutSizingHorizontal = 'FILL';
  for (const k of ['次', '主']) { const b = variant(K.Button, { kind: k, size: 'L' }).createInstance(); btns.appendChild(b); b.layoutGrow = 1; }
  sh.x = 0;
  sh.y = 800 - sh.height;
}
const DATA_GRAIN_PAINTS = (S) => S.paint['Texture/Grain'].paints.slice();

async function buildBenchmark(V, S, K) {
  const old = findSection(BENCHMARK_SECTION);
  let x = null, y = 0;
  if (old) { x = old.x; y = old.y; old.remove(); }
  const sec = figma.createSection();
  sec.name = BENCHMARK_SECTION;
  sec.x = x == null ? placeRight() : x;
  sec.y = y;
  sec.fills = fill(V, 'bg/base');
  const title = await label(sec, '标杆页 P06 · 容量与恢复（方向 B 配重片；人体图为 MuscleWiki 素材；数据：低保真原型「今天已练完」与「冷启动」场景）', S.text['Heading'], COL(V, 'text/primary'), 1200);
  title.x = 40; title.y = 32;
  const frames = [];
  let fx = 40;
  for (const m of ['mag', 'sheet', 'empty']) { frames.push(await buildP06(sec, fx, m, V, S, K)); fx += 360 + 60; }
  for (const f of frames) { const t = await label(sec, f.name, S.text['Label'], COL(V, 'text/secondary')); t.x = f.x; t.y = 56; }
  sec.resizeWithoutConstraints(fx + 20, 80 + 800 + 60);
  figma.viewport.scrollAndZoomIntoView([sec]);
  return sec;
}
