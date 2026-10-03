/* 慢牛 Milo · Figma 导入插件（源码，分文件；scripts/build_tokens.py 按 plugin → foundations → components → benchmark → main 的顺序拼成 code.js）
 * 三个命令（manifest 的 menu）：
 *   foundations：变量集合「Milo · Primitives」「Milo · Tokens」、Milo/ 样式、说明分区「Foundations · 配重片」
 *   components ：同上的变量与样式 + 分区「Components · 配重片」里的组件
 *   benchmark  ：同上 + 组件 + 分区「Benchmark · P06」里的标杆页
 * 只动带上述名字的东西；同名的会被更新，仓库里已删除的会被移除。别的图层不碰。
 * 仓库是唯一源头：在 Figma 里手改的值，下次运行会被覆盖。 */
const DATA = __MILO_DATA__;
const T = DATA.tokens;
const PRIM_COLLECTION = 'Milo · Primitives';
const TOKEN_COLLECTION = 'Milo · Tokens';
const SECTION_NAME = 'Foundations · 配重片（插件生成，勿手改）';
const COMPONENTS_SECTION = 'Components · 配重片（插件生成，勿手改）';
const BENCHMARK_SECTION = 'Benchmark · P06（插件生成，勿手改）';
const STYLE_PREFIX = 'Milo/';
const report = { created: 0, updated: 0, removed: 0, warnings: [] };
const warn = (m) => { report.warnings.push(m); console.warn('[milo] ' + m); };

// ---------------------------------------------------------------- 工具
function rgba(hex) {
  const h = hex.replace('#', '');
  const c = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: c(0), g: c(2), b: c(4), a: h.length === 8 ? c(6) : 1 };
}
const cssName = (prefix, name) => 'var(--milo-' + prefix + name.replace(/\//g, '-') + ')';

async function collection(name, hidden) {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  let c = all.find((x) => x.name === name);
  if (!c) c = figma.variables.createVariableCollection(name);
  if (c.modes[0].name !== T.meta.mode) c.renameMode(c.modes[0].modeId, T.meta.mode);
  if (hidden) { try { c.hiddenFromPublishing = true; } catch (e) { /* 旧版本没有这个属性 */ } }
  return c;
}

// defs: [{ name, type, value, desc, scopes, css }]，value 可以是别名
async function upsertVariables(coll, defs) {
  const all = await figma.variables.getLocalVariablesAsync();
  const byName = new Map(all.filter((v) => v.variableCollectionId === coll.id).map((v) => [v.name, v]));
  const modeId = coll.modes[0].modeId;
  const out = {};
  for (const d of defs) {
    let v = byName.get(d.name);
    if (v && v.resolvedType !== d.type) { v.remove(); v = null; }
    if (!v) { v = figma.variables.createVariable(d.name, coll, d.type); report.created++; } else report.updated++;
    byName.delete(d.name);
    v.setValueForMode(modeId, d.value);
    v.description = d.desc || '';
    try { v.scopes = d.scopes; } catch (e) { warn('变量 ' + d.name + ' 的 scopes 设置失败：' + e.message); }
    try { v.setVariableCodeSyntax('WEB', d.css); } catch (e) { /* 可选 */ }
    out[d.name] = v;
  }
  for (const v of byName.values()) { v.remove(); report.removed++; }
  return out;
}

const boundPaint = (v, opacity) => figma.variables.setBoundVariableForPaint(opacity == null ? { type: 'SOLID', color: { r: 0, g: 0, b: 0 } } : { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: opacity }, 'color', v);

// 字体：先试要求的字重，再试同族 Bold / Regular，最后退到 Inter
const fontCache = {};
async function font(family, style) {
  const key = family + '|' + style;
  if (fontCache[key]) return fontCache[key];
  const tries = [[family, style], [family, style === 'Black' ? 'Bold' : 'Regular'], ['Inter', style === 'Regular' ? 'Regular' : 'Bold'], ['Inter', 'Regular']];
  for (const [f, s] of tries) {
    try {
      await figma.loadFontAsync({ family: f, style: s });
      if (f !== family || s !== style) warn('字体 ' + family + ' ' + style + ' 不可用，暂用 ' + f + ' ' + s + '（装上该字体后重新运行插件即可）');
      fontCache[key] = { family: f, style: s };
      return fontCache[key];
    } catch (e) { /* 下一个 */ }
  }
  throw new Error('连 Inter Regular 都加载不了');
}

async function upsertStyle(kind, name) {
  const full = STYLE_PREFIX + name;
  const list = kind === 'text' ? await figma.getLocalTextStylesAsync() : kind === 'effect' ? await figma.getLocalEffectStylesAsync() : await figma.getLocalPaintStylesAsync();
  let s = list.find((x) => x.name === full);
  if (!s) { s = kind === 'text' ? figma.createTextStyle() : kind === 'effect' ? figma.createEffectStyle() : figma.createPaintStyle(); s.name = full; report.created++; } else report.updated++;
  return s;
}

// 仓库里删掉的样式，从 Figma 里也删掉（只删 Milo/ 前缀下的）
async function pruneStyles(kind, keep) {
  const list = kind === 'text' ? await figma.getLocalTextStylesAsync() : kind === 'effect' ? await figma.getLocalEffectStylesAsync() : await figma.getLocalPaintStylesAsync();
  for (const s of list) if (s.name.indexOf(STYLE_PREFIX) === 0 && keep.indexOf(s.name) < 0) { s.remove(); report.removed++; }
}

// ---------------------------------------------------------------- 排版小工具（说明分区、组件、标杆页共用）
function frame(name, dir, gap) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.itemSpacing = gap;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  f.clipsContent = false;
  return f;
}
async function label(parent, chars, style, color, width) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(style.id);
  t.characters = chars;
  t.fills = [boundPaint(color)];
  // 先定宽再设「自动高度」：resize() 会把文字改成固定尺寸
  if (width) { t.resize(width, Math.max(1, t.height)); t.textAutoResize = 'HEIGHT'; }
  parent.appendChild(t);
  return t;
}
function bindRadius(node, v) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, v); }

