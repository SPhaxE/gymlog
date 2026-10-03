/* Foundations：变量、样式、说明分区 */
// ---------------------------------------------------------------- 变量
async function importVariables() {
  const primColl = await collection(PRIM_COLLECTION, true);
  const prim = await upsertVariables(primColl, Object.keys(T.primitives.color).map((k) => ({
    name: 'color/' + k, type: 'COLOR', value: rgba(T.primitives.color[k].value), desc: T.primitives.color[k].desc || '', scopes: [], css: cssName('prim-', k),
  })));
  const defs = [];
  for (const k of Object.keys(T.semantic.color)) {
    const d = T.semantic.color[k];
    defs.push({ name: 'color/' + k, type: 'COLOR', value: figma.variables.createVariableAlias(prim['color/' + d.ref]), desc: (d.desc ? d.desc + ' · ' : '') + '= ' + d.ref, scopes: d.scopes, css: cssName('color-', k) });
  }
  for (const k of Object.keys(T.number)) {
    const d = T.number[k];
    defs.push({ name: k, type: 'FLOAT', value: d.value, desc: d.desc || '', scopes: d.scopes, css: cssName('', k) });
  }
  for (const k of Object.keys(T.string)) {
    const d = T.string[k];
    defs.push({ name: k, type: 'STRING', value: d.value, desc: d.desc || '', scopes: d.scopes, css: cssName('', k) });
  }
  const tok = await upsertVariables(await collection(TOKEN_COLLECTION, false), defs);
  return { prim, tok };
}

// ---------------------------------------------------------------- 样式
async function importStyles(V) {
  const text = {};
  for (const d of T.textStyles) {
    const fam = T.string[d.family].value;
    const f = await font(fam, d.style);
    const s = await upsertStyle('text', d.name);
    s.description = d.desc || '';
    s.fontName = f;
    s.fontSize = T.number[d.size].value;
    s.lineHeight = { unit: 'PIXELS', value: d.lineHeight };
    s.letterSpacing = { unit: 'PERCENT', value: d.letterSpacing };
    try { s.setBoundVariable('fontSize', V.tok[d.size]); } catch (e) { warn('文字样式 ' + d.name + ' 绑定字号变量失败：' + e.message); }
    if (f.family === fam) { try { s.setBoundVariable('fontFamily', V.tok[d.family]); } catch (e) { /* 旧版本不支持绑定字体族 */ } }
    text[d.name] = s;
  }
  await pruneStyles('text', T.textStyles.map((d) => STYLE_PREFIX + d.name));

  const effect = {};
  for (const d of T.effectStyles) {
    const s = await upsertStyle('effect', d.name);
    s.description = d.desc || '';
    s.effects = d.effects.map((e) => {
      const c = rgba(T.primitives.color[T.semantic.color[e.color].ref].value);
      const fx = { type: e.type, color: c, offset: { x: e.x, y: e.y }, radius: e.radius, spread: e.spread, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false };
      try { return figma.variables.setBoundVariableForEffect(fx, 'color', V.tok['color/' + e.color]); } catch (err) { return fx; }
    });
    effect[d.name] = s;
  }
  await pruneStyles('effect', T.effectStyles.map((d) => STYLE_PREFIX + d.name));

  const paint = {};
  for (const d of T.paintStyles) {
    const s = await upsertStyle('paint', d.name);
    s.description = d.desc || '';
    if (d.type === 'GRADIENT_RADIAL') {
      // 归一化坐标：中心 (cx, cy)、半径 (rx, ry) → Figma 的 gradientTransform（节点空间 → 渐变空间）
      const cx = d.center[0], cy = d.center[1], rx = d.size[0], ry = d.size[1];
      s.paints = [{ type: 'GRADIENT_RADIAL', gradientTransform: [[1 / (2 * rx), 0, 0.5 - cx / (2 * rx)], [0, 1 / (2 * ry), 0.5 - cy / (2 * ry)]],
        gradientStops: d.stops.map((st) => ({ position: st[1], color: rgba(T.primitives.color[st[0]].value) })) }];
    } else {
      const img = figma.createImage(figma.base64Decode(DATA.images[d.image]));
      const p = { type: 'IMAGE', scaleMode: 'TILE', imageHash: img.hash, scalingFactor: 0.5 };
      if (d.opacity) p.opacity = T.number[d.opacity].value / 100;
      if (d.blend) p.blendMode = d.blend;
      s.paints = [p];
    }
    paint[d.name] = s;
  }
  await pruneStyles('paint', T.paintStyles.map((d) => STYLE_PREFIX + d.name));
  return { text, effect, paint };
}

// ---------------------------------------------------------------- 说明分区
async function buildDocs(V, S) {
  const page = figma.currentPage;
  const old = page.findAll((n) => n.type === 'SECTION' && n.name === SECTION_NAME);
  let x0 = 0, y0 = 0;
  if (old.length) { x0 = old[0].x; y0 = old[0].y; old.forEach((n) => n.remove()); }
  else {
    for (const n of page.children) x0 = Math.max(x0, n.x + n.width);
    if (page.children.length) x0 += 400;
  }
  const C = (k) => V.tok['color/' + k];
  const ts = S.text;

  const root = frame('Foundations', 'VERTICAL', 56);
  root.paddingLeft = root.paddingRight = root.paddingTop = root.paddingBottom = 56;
  root.fills = [boundPaint(C('bg/base'))];
  // resize() 会把自动布局的两个方向都改成固定尺寸，所以要在 resize 之后再把高度设回「随内容」
  root.resize(1440, 100);
  root.counterAxisSizingMode = 'FIXED';
  root.primaryAxisSizingMode = 'AUTO';

  await label(root, T.meta.name, ts['Title/L'], C('text/primary'));
  await label(root, '方向：' + T.meta.direction + '。\n' + T.meta.source + '\n生成自仓库提交 ' + DATA.build.commit + ' · ' + DATA.build.date, ts['Body'], C('text/secondary'), 1100);

  // 颜色
  await label(root, '颜色 · 语义变量（集合「' + TOKEN_COLLECTION + '」；原始色在「' + PRIM_COLLECTION + '」，不直接用）', ts['Heading'], C('text/primary'));
  const grid = frame('Colors', 'HORIZONTAL', 16);
  grid.layoutWrap = 'WRAP';
  grid.counterAxisSpacing = 20;
  root.appendChild(grid);
  grid.layoutSizingHorizontal = 'FILL';
  for (const k of Object.keys(T.semantic.color)) {
    const d = T.semantic.color[k];
    const card = frame(k, 'VERTICAL', 4);
    grid.appendChild(card);
    const sw = figma.createRectangle();
    sw.resize(152, 56);
    sw.fills = [boundPaint(C(k))];
    sw.strokes = [boundPaint(C('line/default'))];
    sw.strokeWeight = 1;
    bindRadius(sw, V.tok['radius/s']);
    card.appendChild(sw);
    await label(card, k, ts['Label'], C('text/primary'), 152);
    await label(card, d.ref + ' · ' + T.primitives.color[d.ref].value, ts['Readout/S'], C('text/secondary'), 152);
    if (d.desc) await label(card, d.desc, ts['Micro'], C('text/secondary'), 152);
  }

  // 对比度
  await label(root, '对比度（构建时校验，不达标就不出插件）', ts['Heading'], C('text/primary'));
  const ctab = frame('Contrast', 'VERTICAL', 6);
  root.appendChild(ctab);
  for (const r of DATA.contrast) await label(ctab, (r[2] >= r[3] ? '✓ ' : '✗ ') + r[2].toFixed(2) + ':1 ≥ ' + r[3] + '   ' + r[0] + ' on ' + r[1] + '   · ' + r[4], ts['Caption'], C(r[2] >= r[3] ? 'text/primary' : 'feedback/danger'));

  // 文字
  await label(root, '文字样式（数字 Barlow Condensed · 中文 Noto Sans SC · 刻度读数 JetBrains Mono；字号下限 ' + T.number['font-size/min'].value + '）', ts['Heading'], C('text/primary'));
  const sample = { Number: '13,854', Readout: '8 · 16 · 22 · 1:35' }; // JetBrains Mono 没有中文字形，样例只放数字
  for (const d of T.textStyles) {
    const row = frame(d.name, 'HORIZONTAL', 24);
    row.counterAxisAlignItems = 'CENTER';
    root.appendChild(row);
    await label(row, d.name + '\n' + T.string[d.family].value + ' ' + d.style + ' ' + T.number[d.size].value + '/' + d.lineHeight, ts['Readout/S'], C('text/secondary'), 220);
    await label(row, sample[d.name.split('/')[0]] || '今天练 7 块肌肉 · 14 组 · 中下胸 恢复 3%', ts[d.name], C('text/primary'));
  }

  // 圆角、间距、描边
  await label(root, '圆角 · 间距 · 描边', ts['Heading'], C('text/primary'));
  const shapes = frame('Radius', 'HORIZONTAL', 24);
  root.appendChild(shapes);
  for (const k of Object.keys(T.number).filter((n) => n.indexOf('radius/') === 0)) {
    const cell = frame(k, 'VERTICAL', 6);
    shapes.appendChild(cell);
    const r = figma.createRectangle();
    r.resize(96, 56);
    r.fills = [boundPaint(C('bg/raised'))];
    r.strokes = [boundPaint(C('line/strong'))];
    r.strokeWeight = 1;
    bindRadius(r, V.tok[k]);
    cell.appendChild(r);
    await label(cell, k + ' · ' + T.number[k].value, ts['Readout/S'], C('text/secondary'));
  }
  const spaces = frame('Spacing', 'VERTICAL', 8);
  root.appendChild(spaces);
  for (const k of Object.keys(T.number).filter((n) => n.indexOf('space/') === 0)) {
    const row = frame(k, 'HORIZONTAL', 12);
    row.counterAxisAlignItems = 'CENTER';
    spaces.appendChild(row);
    await label(row, k, ts['Readout/S'], C('text/secondary'), 90);
    const bar = figma.createRectangle();
    bar.resize(T.number[k].value, 12);
    bar.setBoundVariable('width', V.tok[k]);
    bar.fills = [boundPaint(C('accent/default'))];
    row.appendChild(bar);
    await label(row, String(T.number[k].value), ts['Readout/S'], C('text/secondary'));
  }

  // 效果、填充、容量四档
  await label(root, '效果与填充样式 · 容量四档（明暗 + 纹理，不只靠色相）', ts['Heading'], C('text/primary'));
  const fx = frame('Effects', 'HORIZONTAL', 32);
  fx.paddingTop = fx.paddingBottom = 24;
  root.appendChild(fx);
  async function chip(name, w, h, apply) {
    const cell = frame(name, 'VERTICAL', 10);
    fx.appendChild(cell);
    const r = figma.createRectangle();
    r.resize(w, h);
    bindRadius(r, V.tok['radius/l']);
    r.fills = [boundPaint(C('bg/raised'))];
    await apply(r);
    cell.appendChild(r);
    await label(cell, name, ts['Micro'], C('text/secondary'), Math.max(w, 120));
  }
  for (const d of T.effectStyles) await chip('Milo/' + d.name, 140, 72, (r) => r.setEffectStyleIdAsync(S.effect[d.name].id));
  for (const d of T.paintStyles) await chip('Milo/' + d.name, d.name === 'Hero/Lime' ? 200 : 120, 72, async (r) => {
    if (d.name === 'Texture/Grain') r.fills = [boundPaint(C('accent/default'))].concat(S.paint[d.name].paints);
    else await r.setFillStyleIdAsync(S.paint[d.name].id);
  });
  const tiers = [['未练', (r) => { r.fills = [boundPaint(C('data/tier-none'))]; r.strokes = [boundPaint(C('data/tier-none-edge'))]; r.strokeWeight = 1; }],
    ['不足', (r) => r.setFillStyleIdAsync(S.paint['Data/Tier-Low'].id)],
    ['达标', (r) => { r.fills = [boundPaint(C('data/tier-ok'))]; }],
    ['超量', (r) => r.setFillStyleIdAsync(S.paint['Data/Tier-Over'].id)]];
  for (const t of tiers) await chip('容量 · ' + t[0], 72, 40, async (r) => { bindRadius(r, V.tok['radius/pill']); await t[1](r); });

  // 规则摘要
  await label(root, '使用规则（全文见仓库 docs/DESIGN.md）', ts['Heading'], C('text/primary'));
  await label(root, [
    '1. 荧光色只给三类：当前主角（放大的胶囊、今日处方卡）、导航选中项、进度。正文、图标、分割线、按钮一律不用。',
    '2. 光晕（Glow/Focus）每屏最多一处；导航选中项是实心填充，不发光。',
    '3. 「超量」用白底黑斜纹，绝不用荧光；错误只用 feedback/danger。',
    '4. 主按钮是暖白（action/primary），不是荧光。',
    '5. 页面里只用变量和样式，不写散落的数值；改值改仓库 tokens.json 再重跑插件。',
  ].join('\n'), ts['Body'], C('text/secondary'), 1200);

  const section = figma.createSection();
  section.name = SECTION_NAME;
  section.x = x0;
  section.y = y0;
  section.appendChild(root);
  root.x = 40;
  root.y = 40;
  section.resizeWithoutConstraints(root.width + 80, root.height + 80);
  figma.viewport.scrollAndZoomIntoView([section]);
  return section;
}

