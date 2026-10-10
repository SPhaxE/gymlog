/** 深浅切换的液态转场（2026-10-10 用户：「深浅模式切换仅保留一个入口，且为切换过程设计一个固定的液态流动切换动画，用来缓和加载时间，强制性的」）。
 *  做法照用户给的 AE 熔流拆解（Gradient Ramp → Colorama → Turbulent Displace + Fast Box Blur → Glow + Noise），拆成两轴、可自由组合：
 *    · 走向 route = 方向场（Gradient Ramp）：每个像素「什么时候被液体淹到」的 0–1 场——晕开 / 漫上 / 垂落 / 交汇；
 *    · 渐变 ramp = 色带映射（Colorama）：液体前沿到落定之间那一段色带——熔流 / 淬火 / 余温 / 墨晕，最后都落到新主题的 bg/base；
 *    · 湍流扭曲（Turbulent Displace）扭方向场、前沿羽化（Box Blur）、热点辉光 + 胶片颗粒（Glow + Noise）四种共用。
 *  时间线固定、每次都放（不看「减少动态」，用户要求强制），总长 motion/theme-in + hold + out：
 *    · 透出模式（有 View Transitions，App 与浏览器都是）：一开始就换主题；旧页面拍成快照压在上面，色带一路扫过、把快照擦掉，
 *      色带后面是透明的，直接露出正在渲染的新页面——动画给新页面多一段渲染时间，但不把页面整个挡住（用户 2026-10-10）；
 *    · 盖满模式（退路）：流入盖满 → 盖住时换主题、等两帧 → 色带倒过来流走。
 *  逐像素用 WebGL 画，两遍：扭曲 + 方向场在 1/3 分辨率算（又软又贵的部分），色带映射、辉光、颗粒在全分辨率算（便宜、要清楚的部分）；
 *  没有 WebGL（测试环境）就直接换。方案台 /preview#swap 对照；App 用 DEFAULT_SWAP，地址栏 ?route= &ramp= 可临时换。
 *  性能（2026-10-10 用户：「/preview 切换很卡」）：擦旧快照不改 <html> 上会继承的变量（3 万节点的页面每帧整页重算样式 240 ms），
 *  改成旧快照伪元素自己身上的注册属性 --swap-e，用浏览器动画驱动、每帧只重算这一个伪元素；着色器读这条动画的进度，两边同步。
 *  遮罩 pointer-events: none——转场不吞点击（DESIGN §9.6）。 */
import { flushSync } from 'react-dom';
import { T } from '../styles/tokens.gen';
import { resolve, setThemePref, type Theme, type ThemePref } from '../styles/theme';
import tokens from '../../design/tokens/tokens.json';
import { primRgb } from './thermal';
import s from './themeSwap.module.css';

export type SwapRoute = 'drop' | 'rise' | 'drip' | 'merge';
export type SwapRamp = 'molten' | 'quench' | 'ember' | 'ink';
export interface SwapKind { route: SwapRoute; ramp: SwapRamp }
export const SWAP_ROUTES: readonly SwapRoute[] = ['drop', 'rise', 'drip', 'merge'];
export const SWAP_RAMPS: readonly SwapRamp[] = ['molten', 'quench', 'ember', 'ink'];
/** App 里用的组合（方案台待选，选定后改这一行） */
export const DEFAULT_SWAP: SwapKind = { route: 'drop', ramp: 'molten' };

export function swapKind(): SwapKind {
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search);
  return {
    route: SWAP_ROUTES.find((k) => k === q?.get('route')) ?? DEFAULT_SWAP.route,
    ramp: SWAP_RAMPS.find((k) => k === q?.get('ramp')) ?? DEFAULT_SWAP.ramp,
  };
}

/** 色带：前沿 → 落定的 5 个色标（原色 Token），之后是新主题的 bg/base；glow = 辉光落在色带哪儿（0 前沿 … 1 落定）、多强；grain = 颗粒；band = 色带宽（占整条场） */
interface Ramp { stops: [string, string, string, string, string]; glow: [number, number]; grain: number; band: number }
const RAMPS: Record<SwapRamp, Ramp> = {
  // 熔流：前沿白热，往后冷成浅荧光 → 荧光 → 黄绿 → 橄榄，最后沉进新底色（容量人体 S9 熔流、热成像荧光色板的同一条色带）
  molten: { stops: ['paper-50', 'lime-300', 'lime-500', 'lime-700', 'lime-900'], glow: [0.06, 0.9], grain: 0.05, band: 0.34 },
  // 淬火：钢板 / F1 金属渐变的冷色——两道镜面高光夹一段暗钢，像一块金属板扫过去
  quench: { stops: ['paper-50', 'gray-600', 'bone-800', 'bone-100', 'bone-500'], glow: [0.6, 0.55], grain: 0.035, band: 0.3 },
  // 余温：热成像骨白色板倒过来——只有最前沿一线荧光（荧光只标最热处），后面是骨白慢慢冷成暗骨
  ember: { stops: ['lime-500', 'bone-100', 'bone-200', 'bone-500', 'bone-800'], glow: [0.02, 0.7], grain: 0.045, band: 0.38 },
  // 墨晕：素墨，没有荧光也没有辉光；淡墨先洇开、浓墨跟上、再化开成纸色，颗粒最重（像宣纸）
  ink: { stops: ['ink-500', 'ink-600', 'ink-900', 'ink-600', 'paper-300'], glow: [0, 0], grain: 0.08, band: 0.42 },
};

/** 最近一次按下的位置：「晕开」从手指按下的地方开始（各入口不用自己传坐标） */
let lastDown: { x: number; y: number } | null = null;
if (typeof window !== 'undefined') window.addEventListener('pointerdown', (e) => { lastDown = { x: e.clientX, y: e.clientY }; }, { capture: true, passive: true });

// 一律用 performance.now()：rAF 给的时间戳在部分环境（虚拟时钟、旧 WebView）和它不是一个基准
const frame = () => new Promise<number>((r) => requestAnimationFrame(() => r(performance.now())));
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/** 和着色器里同一套常数：扭曲余量 M；透出模式把色带放宽一点（快照的擦除边落在色带中段，扭曲偏出去也还在色带里）；方向场按 1/3 分辨率算 */
const M = 0.14, REVEAL_BAND = 1.25, FIELD_SCALE = 1 / 3;

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
// 便宜的哈希（不用 sin：移动端 GPU 上 sin 慢、大参数时精度也差）
const HASH = 'float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }';
/** 第一遍（1/3 分辨率）：Turbulent Displace 扭空间 → Gradient Ramp 方向场 d，编码进 R 通道 */
const FIELD = `precision highp float;
uniform vec2 res; uniform vec2 org; uniform float t; uniform int route;
${HASH}
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
float drip(float x, float c, float k) { return k * exp(-pow((x - c) / 0.07, 2.0)); }
void main() {
  vec2 uv = vec2(gl_FragCoord.x / res.x, 1.0 - gl_FragCoord.y / res.y), asp = vec2(res.x / res.y, 1.0);
  vec2 q = uv * asp * 2.6;
  vec2 w = uv + (vec2(fbm(q + vec2(0.0, t * 0.45)), fbm(q + vec2(5.2, -t * 0.4))) - 0.5) * 0.16;
  float d;
  if (route == 0) { float far = length(max(org, 1.0 - org) * asp); d = length((w - org) * asp) / far; }
  else if (route == 1) d = 1.0 - w.y;
  else if (route == 2) {
    float b = drip(w.x, 0.05, 0.8) + drip(w.x, 0.2, 1.15) + drip(w.x, 0.34, 0.9) + drip(w.x, 0.49, 1.25) + drip(w.x, 0.63, 0.85) + drip(w.x, 0.78, 1.1) + drip(w.x, 0.92, 0.95);
    d = (w.y - 0.2 * b + 0.25) / 1.25;
  } else d = 1.0 - 2.0 * abs(w.x - 0.5);
  d += (fbm(uv * asp * 7.0 + vec2(t * 0.6, 0.0)) - 0.5) * 0.08;
  // 16 位编码进 R / G 两个通道（8 位一个通道会在色带边缘量化出一圈圈台阶）
  float v = clamp((d + 0.4) / 2.0, 0.0, 1.0) * 255.0;
  gl_FragColor = vec4(floor(v) / 255.0, fract(v), 0.0, 1.0);
}`;
/** 第二遍（全分辨率）：取方向场（双线性放大，本来就是软的）→ Colorama 色带 → 辉光 + 颗粒 */
const COLOR = `precision highp float;
uniform sampler2D field; uniform vec2 res, fres; uniform float t, front, tail, band, grain, reveal;
uniform vec3 c0, c1, c2, c3, c4, bg; uniform vec2 glow;
${HASH}
vec3 ramp(float x) {
  x = clamp(x, 0.0, 1.0) * 5.0;
  if (x < 1.0) return mix(c0, c1, x);
  if (x < 2.0) return mix(c1, c2, x - 1.0);
  if (x < 3.0) return mix(c2, c3, x - 2.0);
  if (x < 4.0) return mix(c3, c4, x - 3.0);
  return mix(c4, bg, smoothstep(0.0, 1.0, x - 4.0));
}
// 编码过的值不能交给硬件插值（会在字节交界处出错）：取四个最近的纹素自己解码、双线性插值
float fieldAt(vec2 uv) {
  vec2 p = uv * fres - 0.5, i = floor(p), f = p - i;
  vec2 a = (i + 0.5) / fres, b = (i + 1.5) / fres;
  vec2 t00 = texture2D(field, a).rg, t10 = texture2D(field, vec2(b.x, a.y)).rg, t01 = texture2D(field, vec2(a.x, b.y)).rg, t11 = texture2D(field, b).rg;
  vec4 v = vec4(t00.x + t00.y / 255.0, t10.x + t10.y / 255.0, t01.x + t01.y / 255.0, t11.x + t11.y / 255.0);
  return mix(mix(v.x, v.y, f.x), mix(v.z, v.w, f.x), f.y);
}
void main() {
  float d = fieldAt(gl_FragCoord.xy / res) * 2.0 - 0.4;
  // Colorama：前沿扫过的位置 → 色带上的位置；m 是扭曲留的余量，保证 0 时一点不盖、1 时全盖
  float m = ${M.toFixed(2)}, span = 1.0 + band + 2.0 * m;
  float sIn = (front * span - m - d) / band, sOut = (tail * span - m - d) / band;
  float x, a;
  if (reveal > 0.5) { x = sIn; a = smoothstep(0.0, 0.14, sIn) * (1.0 - smoothstep(0.62, 1.0, sIn)); }   // 透出模式：色带后面透明，露出底下正在渲染的新页面
  else if (tail <= 0.0) { x = sIn; a = smoothstep(0.0, 0.14, sIn); }
  else { x = 1.0 - sOut; a = 1.0 - smoothstep(0.86, 1.0, sOut); }
  if (a <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec3 col = ramp(x);
  // 落定的底色不加辉光和颗粒：揭开时和页面底色严丝合缝
  float live = 1.0 - smoothstep(0.92, 1.0, x);
  col += glow.y * 0.35 * exp(-pow((x - glow.x) / 0.09, 2.0)) * live;
  col += (hash(gl_FragCoord.xy + fract(t * 7.0) * 91.0) - 0.5) * grain * live;
  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;

/** 颜色：直接从 Token 表取（原色 + bg/base 在两套主题下的映射），不往页面里插探针、不强制算样式 */
const SEM = (tokens as unknown as { semantic: { color: Record<string, { ref: string; light?: string }> } }).semantic.color;
const bgOf = (to: Theme) => primRgb(to === 'light' ? SEM['bg/base'].light ?? SEM['bg/base'].ref : SEM['bg/base'].ref);

function program(gl: WebGLRenderingContext, frag: string) {
  const sh = (type: number, src: string) => { const x = gl.createShader(type)!; gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

/** 一套 WebGL：画布、两遍着色器、方向场的离屏纹理。建一次放进池子反复用——建上下文、编译着色器是点下去到开始转场之间最慢的一步 */
interface Gl { cv: HTMLCanvasElement; g: WebGLRenderingContext; pf: WebGLProgram; pc: WebGLProgram; fb: WebGLFramebuffer; tex: WebGLTexture; uf: (n: string) => WebGLUniformLocation | null; uc: (n: string) => WebGLUniformLocation | null }
const pool: Gl[] = [];
function makeGl(): Gl | null {
  if (typeof requestAnimationFrame !== 'function') return null;
  const cv = document.createElement('canvas');
  let g: WebGLRenderingContext | null = null;
  try { g = cv.getContext('webgl', { premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' }); } catch { g = null; }
  const pf = g && program(g, FIELD), pc = g && program(g, COLOR);
  if (!g || !pf || !pc) return null;
  const tex = g.createTexture()!, fb = g.createFramebuffer()!;
  g.bindTexture(g.TEXTURE_2D, tex);
  [[g.TEXTURE_MIN_FILTER, g.NEAREST], [g.TEXTURE_MAG_FILTER, g.NEAREST], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]].forEach(([k, v]) => g.texParameteri(g.TEXTURE_2D, k, v));
  g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer()); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  cv.className = s.veil; cv.setAttribute('aria-hidden', 'true');
  const cache = new Map<string, WebGLUniformLocation | null>(), loc = (pr: WebGLProgram, k: string) => (n: string) => { const key = k + n; if (!cache.has(key)) cache.set(key, g.getUniformLocation(pr, n)); return cache.get(key)!; };
  return { cv, g, pf, pc, fb, tex, uf: loc(pf, 'f'), uc: loc(pc, 'c') };
}
const takeGl = () => { while (pool.length) { const x = pool.pop()!; if (!x.g.isContextLost()) return x; } return makeGl(); };
function giveGl(x: Gl) {
  x.cv.remove(); x.cv.style.viewTransitionName = ''; x.cv.style.removeProperty('view-transition-class'); delete x.cv.dataset.swapVt; delete x.cv.dataset.local;
  if (pool.length < 4) pool.push(x); else x.g.getExtension('WEBGL_lose_context')?.loseContext();
}

const busy = new WeakSet<Element>();

interface Job { to: Theme; apply: () => void; host?: HTMLElement; kind?: SwapKind }
interface Veil { cv: HTMLCanvasElement; root: HTMLElement; box: { left: number; top: number; width: number; height: number }; o: [number, number]; band: number; route: SwapRoute; paint: (front: number, tail: number, now: number) => void; drop: () => void }

/** 准备一块遮罩（还没挂上去）：从池子里拿一套 WebGL，按这次的尺寸、组合设好；没有 WebGL 返回 null */
function veilOf({ to, host, kind = swapKind() }: Job, reveal: boolean): Veil | null {
  const x = takeGl();
  if (!x) return null;
  const { cv, g, pf, pc, fb, tex, uf, uc } = x, root = host ?? document.body;
  if (host) cv.dataset.local = '';
  const box = host ? host.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  // 1.5 倍封顶：第二遍很便宜，颗粒在 1.5 倍下看得清
  const dpr = Math.min(1.5, devicePixelRatio || 1), w = box.width, h = box.height;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const fw = Math.max(2, Math.round(w * FIELD_SCALE)), fh = Math.max(2, Math.round(h * FIELD_SCALE));
  g.bindTexture(g.TEXTURE_2D, tex); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, fw, fh, 0, g.RGBA, g.UNSIGNED_BYTE, null);
  g.bindFramebuffer(g.FRAMEBUFFER, fb); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, tex, 0); g.bindFramebuffer(g.FRAMEBUFFER, null);
  const o: [number, number] = lastDown && lastDown.x >= box.left && lastDown.x <= box.left + w && lastDown.y >= box.top && lastDown.y <= box.top + h
    ? [(lastDown.x - box.left) / w, (lastDown.y - box.top) / h] : [0.5, 0.7];
  const r = RAMPS[kind.ramp], band = r.band * (reveal ? REVEAL_BAND : 1);
  const cols = [...r.stops.map(primRgb), bgOf(to)];
  g.useProgram(pf);
  g.uniform2f(uf('res'), fw, fh); g.uniform2f(uf('org'), o[0], o[1]); g.uniform1i(uf('route'), SWAP_ROUTES.indexOf(kind.route));
  g.useProgram(pc);
  g.uniform1i(uc('field'), 0); g.uniform2f(uc('res'), cv.width, cv.height); g.uniform2f(uc('fres'), fw, fh);
  g.uniform1f(uc('band'), band); g.uniform1f(uc('grain'), r.grain); g.uniform1f(uc('reveal'), reveal ? 1 : 0); g.uniform2f(uc('glow'), r.glow[0], r.glow[1]);
  ['c0', 'c1', 'c2', 'c3', 'c4', 'bg'].forEach((n, i) => g.uniform3fv(uc(n), cols[i]));
  const t0 = performance.now();
  return {
    cv, root, box, o, band, route: kind.route,
    paint: (front, tail, now) => {
      const t = (now - t0) / 1000;
      g.bindFramebuffer(g.FRAMEBUFFER, fb); g.viewport(0, 0, fw, fh); g.useProgram(pf); g.uniform1f(uf('t'), t); g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, cv.width, cv.height); g.useProgram(pc);
      g.bindTexture(g.TEXTURE_2D, tex); g.uniform1f(uc('t'), t); g.uniform1f(uc('front'), front); g.uniform1f(uc('tail'), tail); g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    },
    drop: () => giveGl(x),
  };
}

/** 旧快照擦除动画的两帧关键帧（interactive.css 按走向画遮罩，这里只给数）：擦除边 --swap-e 和着色器同一条方向场（不含扭曲）、放在色带中段；
 *  --swap-e 对 front 是线性的，所以两帧 + 同一条缓动就和着色器对得上。圆心、羽化宽度是常数，也写进关键帧——只落在这个伪元素上 */
function edgeFrames(v: Veil): Keyframe[] {
  const { width: w, height: h } = v.box, de = (front: number) => front * (1 + v.band + 2 * M) - M - 0.5 * v.band;
  const e = v.route === 'drop' ? (x: number) => x * Math.hypot(Math.max(v.o[0], 1 - v.o[0]) * w, Math.max(v.o[1], 1 - v.o[1]) * h)
    : v.route === 'rise' ? (x: number) => (1 - x) * h : v.route === 'drip' ? (x: number) => (1.25 * x - 0.25) * h : (x: number) => (x * w) / 2;
  const fixed = { '--swap-ox': `${v.o[0] * w}px`, '--swap-oy': `${v.o[1] * h}px`, '--swap-f': `${h * 0.06}px` };
  return [{ ...fixed, '--swap-e': `${e(de(0))}px` }, { ...fixed, '--swap-e': `${e(de(1))}px` }];
}

/** 空闲时预热：注册 --swap-e（注册会让整页重算一次样式，挪到空闲时做）、建好一套 WebGL 并画一帧（编译着色器） */
let warmed = false;
export function prewarmSwap() {
  if (warmed || typeof window === 'undefined') return;
  warmed = true;
  try { CSS.registerProperty({ name: '--swap-e', syntax: '<length>', inherits: false, initialValue: '0' }); } catch { /* 已注册 */ }
  const x = takeGl();
  if (!x) return;
  x.cv.width = x.cv.height = 2;
  x.g.bindTexture(x.g.TEXTURE_2D, x.tex); x.g.texImage2D(x.g.TEXTURE_2D, 0, x.g.RGBA, 2, 2, 0, x.g.RGBA, x.g.UNSIGNED_BYTE, null);
  x.g.bindFramebuffer(x.g.FRAMEBUFFER, x.fb); x.g.framebufferTexture2D(x.g.FRAMEBUFFER, x.g.COLOR_ATTACHMENT0, x.g.TEXTURE_2D, x.tex, 0);
  x.g.useProgram(x.pf); x.g.drawArrays(x.g.TRIANGLE_STRIP, 0, 4);
  x.g.bindFramebuffer(x.g.FRAMEBUFFER, null); x.g.useProgram(x.pc); x.g.drawArrays(x.g.TRIANGLE_STRIP, 0, 4);
  giveGl(x);
}
if (typeof window !== 'undefined') {
  const ric = (window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(prewarmSwap, { timeout: T['motion/toast-hold'] });
}

/** 换完主题等页面安静下来（同步渲染、副作用跑完），最多等 max：再开始扫，扫的时候不和新页面的渲染抢帧 */
const settle = (max: number) => new Promise<void>((done) => {
  const t0 = performance.now(); let last = t0, calm = 0;
  const tick = () => { const now = performance.now(); calm = now - last < 20 ? calm + 1 : 0; last = now; if (calm >= 2 || now - t0 >= max) done(); else window.setTimeout(tick, 0); };
  window.setTimeout(tick, 0);
});

/** 临时摘掉页面里平时带共享名的元素的名字（记下原值，转场后还回去）：它们跟整页一起擦，不单独成组、不压在旧快照上面 */
function unname(saved: Map<HTMLElement, string>) {
  document.querySelectorAll<HTMLElement>("[style*='view-transition-name']:not([data-swap-vt])").forEach((el) => {
    const n = el.style.getPropertyValue('view-transition-name');
    if (saved.has(el) || !n || n === 'none') return;
    saved.set(el, n); el.style.setProperty('view-transition-name', 'none');
  });
}

type VTDoc = Document & { startViewTransition?: (cb: () => unknown) => { ready: Promise<unknown>; finished: Promise<unknown>; skipTransition: () => void } };

/** 透出模式（有 View Transitions 时）：一开始就换主题；旧页面拍成快照压在最上面，随色带一路擦掉，色带后面直接露出正在渲染的新页面——
 *  动画给新页面多一段渲染时间，但不把页面整个挡住（2026-10-10 用户：「透过白色区域要看到后方的页面」）。几块一起播时共用一次转场。
 *  样式规则都常驻在 interactive.css（只有伪元素规则），这里只挂名字和类、跑动画。 */
async function revealSwap(jobs: Job[]) {
  const doc = document as VTDoc, html = document.documentElement;
  prewarmSwap();
  const veils = jobs.map((j) => veilOf(j, true));
  if (veils.some((v) => !v)) { veils.forEach((v) => v?.drop()); jobs.forEach((j) => j.apply()); return; }
  const vs = veils as Veil[], global = vs.some((v) => v.root === document.body);
  const name = (i: number, v: Veil) => (v.root === document.body ? 'root' : `x-swap-host-${i}`);
  const sweep = T['motion/theme-in'] + T['motion/theme-out'];
  vs.forEach((v, i) => {
    v.cv.style.viewTransitionName = `x-swap-veil-${i}`; v.cv.style.setProperty('view-transition-class', 'swapveil'); v.cv.dataset.swapVt = '';
    const el = v.root === document.body ? html : v.root;
    if (el !== html) { el.style.viewTransitionName = name(i, v); el.dataset.swapVt = ''; }
    el.style.setProperty('view-transition-class', `swaphost r-${v.route}`);
    busy.add(v.root);
  });
  if (!global) html.style.viewTransitionName = 'none';
  const named = new Map<HTMLElement, string>();
  unname(named);
  html.dataset.vt = 'theme';
  let done = false;
  const vt = doc.startViewTransition!(() => {
    vs.forEach((v) => { v.root.appendChild(v.cv); v.paint(0, 0, performance.now()); });
    flushSync(() => jobs.forEach((j) => j.apply()));
    unname(named);   // 换主题时新挂上的元素（方案台格子整块重挂）也摘掉
    return settle(T['motion/theme-hold']);
  });
  void vt.finished.catch(() => undefined).finally(() => { done = true; });   // 用户按了一下（tap guard 跳过转场）：立刻结束，点按照常生效
  try {
    await vt.ready;
    const easing = getComputedStyle(html).getPropertyValue('--milo-motion-ease-sweep').trim() || 'ease-in-out';
    // 擦除边交给浏览器动画（只动这一个伪元素的样式）；着色器每帧读它的进度
    const anims = vs.map((v, i) => html.animate(edgeFrames(v), { duration: sweep, easing, fill: 'both', pseudoElement: `::view-transition-old(${name(i, v)})` }));
    // 先暂停在起点（转场靠这条动画撑着，不会提前结束）：新页面的画布特效在转场开始后的头几帧集中重建，
    // 等帧间隔恢复正常（连续两帧 < 1.5 帧）或最多一个 hold 再开扫，色带起步不和它们抢帧；这期间旧快照原样留在屏上
    anims.forEach((a) => a.pause());
    const t1 = performance.now(); let prev = await frame(), calm = 0;
    while (!done && calm < 2 && prev - t1 < T['motion/theme-hold']) { const now = await frame(); calm = now - prev < 25 ? calm + 1 : 0; prev = now; }
    anims.forEach((a) => a.play());
    for (;;) {
      const now = await frame();
      if (done) break;
      const p = anims[0].effect?.getComputedTiming().progress ?? 1;
      vs.forEach((v) => v.paint(p, 0, now));
      if (anims[0].playState === 'finished') break;
    }
  } catch { /* 转场没起来：DOM 已是终态 */ } finally {
    if (!done) vt.skipTransition();
    vs.forEach((v) => {
      const el = v.root === document.body ? html : v.root;
      v.drop(); busy.delete(v.root); el.style.removeProperty('view-transition-class');
      if (el !== html) { el.style.viewTransitionName = ''; delete el.dataset.swapVt; }
    });
    named.forEach((n, el) => el.style.setProperty('view-transition-name', n));
    if (!global) html.style.viewTransitionName = '';
    delete html.dataset.vt;
  }
}

/** 盖满模式（没有 View Transitions 时的退路）：流入盖满 → 盖住时换主题、等两帧 → 流走 */
async function coverSwap(job: Job) {
  const v = veilOf(job, false);
  if (!v) { job.apply(); return; }
  busy.add(v.root); v.root.appendChild(v.cv);
  try {
    const phase = async (ms: number, draw: (p: number, now: number) => void) => {
      const start = performance.now();
      for (;;) { const now = await frame(), p = Math.min(1, (now - start) / ms); draw(ease(p), now); if (p >= 1) return; }
    };
    await phase(T['motion/theme-in'], (p, now) => v.paint(p, 0, now));
    v.paint(1, 0, performance.now());
    job.apply();
    const held = performance.now(); await frame(); await frame();
    while (performance.now() - held < T['motion/theme-hold']) v.paint(1, 0, await frame());
    await phase(T['motion/theme-out'], (p, now) => v.paint(1, Math.max(1e-4, p), now));
  } finally { v.drop(); busy.delete(v.root); }
}

async function run(jobs: Job[]) {
  const live = jobs.filter((j) => !busy.has(j.host ?? document.body));
  if (!live.length) return;
  const doc = document as VTDoc;
  if (typeof doc.startViewTransition === 'function' && !document.documentElement.dataset.vt && typeof requestAnimationFrame === 'function') return revealSwap(live);
  await Promise.all(live.map(coverSwap));
}

/** 放一遍液态转场：host 不给就是整个窗口；apply 换主题（透出模式一开始就换，盖满模式盖满时换）。
 *  同一时刻的几次调用（方案台「四格一起播」）攒到一起、共用一次转场 */
let batch: { jobs: Job[]; done: Promise<void> } | null = null;
export function liquidSwap(...jobs: Job[]): Promise<void> {
  if (!batch) {
    const b: { jobs: Job[]; done: Promise<void> } = { jobs: [], done: Promise.resolve() };
    b.done = Promise.resolve().then(() => { batch = null; return run(b.jobs); });
    batch = b;
  }
  batch.jobs.push(...jobs);
  return batch.done;
}

let running = false, queued: ThemePref | null = null;
/** 全局换主题的唯一入口（「我的 → 主题」、内部页的全局主题条）：主题真的变了才放转场 */
export function switchTheme(p: ThemePref) {
  // 转场放到一半又点了：不丢（不给死路），放完接着按最后一次点的换
  if (running) { queued = p; return; }
  const to = resolve(p), from = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  if (to === from) { setThemePref(p); return; }
  running = true;
  void liquidSwap({ to, apply: () => setThemePref(p) }).finally(() => {
    running = false;
    const q = queued; queued = null;
    if (q != null) switchTheme(q);
  });
}
