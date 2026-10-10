/** 深浅切换的液态转场（2026-10-10 用户：「深浅模式切换仅保留一个入口，且为切换过程设计一个固定的液态流动切换动画，用来缓和加载时间，强制性的」）。
 *  做法照用户给的 AE 熔流拆解（Gradient Ramp → Colorama → Turbulent Displace + Fast Box Blur → Glow + Noise），拆成两轴、可自由组合：
 *    · 走向 route = 方向场（Gradient Ramp）：每个像素「什么时候被液体淹到」的 0–1 场——晕开 / 漫上 / 垂落 / 交汇；
 *    · 渐变 ramp = 色带映射（Colorama）：液体前沿到落定之间那一段色带——熔流 / 淬火 / 余温 / 墨晕，最后都落到新主题的 bg/base；
 *    · 湍流扭曲（Turbulent Displace）扭方向场、前沿羽化（Box Blur）、热点辉光 + 胶片颗粒（Glow + Noise）四种共用。
 *  时间线固定、每次都放（不看「减少动态」，用户要求强制），总长 motion/theme-in + hold + out：
 *    · 透出模式（有 View Transitions，App 与浏览器都是）：一开始就换主题；旧页面拍成快照压在上面，色带一路扫过、把快照擦掉，
 *      色带后面是透明的，直接露出正在渲染的新页面——动画给新页面多一段渲染时间，但不把页面整个挡住（用户 2026-10-10）；
 *    · 盖满模式（退路）：流入盖满 → 盖住时换主题、等两帧 → 色带倒过来流走。
 *  逐像素用 WebGL 画（片元着色器）；没有 WebGL（测试环境）就直接换。方案台 /preview#swap 对照；App 用 DEFAULT_SWAP，地址栏 ?route= &ramp= 可临时换。
 *  遮罩 pointer-events: none——转场不吞点击（DESIGN §9.6）。 */
import { T } from '../styles/tokens.gen';
import { resolve, setThemePref, type Theme, type ThemePref } from '../styles/theme';
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

const VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
const FRAG = `precision highp float;
uniform vec2 res; uniform vec2 org; uniform float t, front, tail, band, grain, reveal; uniform int route;
uniform vec3 c0, c1, c2, c3, c4, bg; uniform vec2 glow;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; } return v; }
vec3 ramp(float x) {
  x = clamp(x, 0.0, 1.0) * 5.0;
  if (x < 1.0) return mix(c0, c1, x);
  if (x < 2.0) return mix(c1, c2, x - 1.0);
  if (x < 3.0) return mix(c2, c3, x - 2.0);
  if (x < 4.0) return mix(c3, c4, x - 3.0);
  return mix(c4, bg, smoothstep(0.0, 1.0, x - 4.0));
}
float drip(float x, float c, float k) { return k * exp(-pow((x - c) / 0.07, 2.0)); }
void main() {
  vec2 uv = vec2(gl_FragCoord.x / res.x, 1.0 - gl_FragCoord.y / res.y), asp = vec2(res.x / res.y, 1.0);
  // Turbulent Displace：先扭空间，再算方向场
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
  // Colorama：前沿扫过的位置 → 色带上的位置；m 是扭曲留的余量，保证 0 时一点不盖、1 时全盖
  float m = 0.14, span = 1.0 + band + 2.0 * m;
  float sIn = (front * span - m - d) / band, sOut = (tail * span - m - d) / band;
  float x, a;
  if (reveal > 0.5) { x = sIn; a = smoothstep(0.0, 0.14, sIn) * (1.0 - smoothstep(0.62, 1.0, sIn)); }   // 透出模式：色带后面透明，露出底下正在渲染的新页面
  else if (tail <= 0.0) { x = sIn; a = smoothstep(0.0, 0.14, sIn); }
  else { x = 1.0 - sOut; a = 1.0 - smoothstep(0.86, 1.0, sOut); }
  vec3 col = ramp(x);
  // 落定的底色不加辉光和颗粒：揭开时和页面底色严丝合缝
  float live = 1.0 - smoothstep(0.92, 1.0, x);
  col += glow.y * 0.35 * exp(-pow((x - glow.x) / 0.09, 2.0)) * live;
  col += (hash(gl_FragCoord.xy + fract(t * 7.0) * 91.0) - 0.5) * grain * live;
  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`;

/** 颜色变量 → 0–1 的 RGB：在宿主里放一块 data-theme={to} 的探针读（局部主题也算数） */
function colorsOf(host: Element, to: Theme, names: string[]) {
  const probe = document.createElement('i');
  probe.dataset.theme = to; probe.hidden = true; host.appendChild(probe);
  const cs = getComputedStyle(probe);
  const out = names.map((n) => { const h = cs.getPropertyValue(n).trim().replace('#', ''); return [0, 2, 4].map((i) => (parseInt(h.slice(i, i + 2), 16) || 0) / 255); });
  probe.remove();
  return out;
}

function program(gl: WebGLRenderingContext) {
  const sh = (type: number, src: string) => { const x = gl.createShader(type)!; gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const p = gl.createProgram()!;
  gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  gl.useProgram(p);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return p;
}

const busy = new WeakSet<Element>();
/** 和着色器里同一套常数：扭曲余量 m、透出模式把色带放宽一点（快照的擦除边落在色带中段，扭曲偏出去也还在色带里） */
const M = 0.14, REVEAL_BAND = 1.25;

interface Job { to: Theme; apply: () => void; host?: HTMLElement; kind?: SwapKind }
interface Veil { cv: HTMLCanvasElement; root: HTMLElement; box: { left: number; top: number; width: number; height: number }; o: [number, number]; band: number; route: SwapRoute; paint: (front: number, tail: number, now: number) => void; drop: () => void }

/** 准备一块遮罩画布（还没挂上去）：没有 WebGL 返回 null */
function veilOf({ to, host, kind = swapKind() }: Job, reveal: boolean): Veil | null {
  const root = host ?? document.body;
  const cv = document.createElement('canvas');
  let gl: WebGLRenderingContext | null = null;
  try { gl = typeof requestAnimationFrame === 'function' ? cv.getContext('webgl', { premultipliedAlpha: true, antialias: false }) : null; } catch { gl = null; }
  const prog = gl && program(gl);
  if (!gl || !prog) return null;
  cv.className = s.veil; cv.setAttribute('aria-hidden', 'true');
  if (host) cv.dataset.local = '';
  const box = host ? host.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  // 1.5 倍封顶：色带本来就是软的，颗粒在 1.5 倍下也看得清；像素少一半多
  const dpr = Math.min(1.5, devicePixelRatio || 1), w = box.width, h = box.height;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  gl.viewport(0, 0, cv.width, cv.height);
  const o: [number, number] = lastDown && lastDown.x >= box.left && lastDown.x <= box.left + w && lastDown.y >= box.top && lastDown.y <= box.top + h
    ? [(lastDown.x - box.left) / w, (lastDown.y - box.top) / h] : [0.5, 0.7];
  const r = RAMPS[kind.ramp], band = r.band * (reveal ? REVEAL_BAND : 1);
  const cols = colorsOf(root, to, [...r.stops.map((k) => `--milo-prim-${k}`), '--milo-color-bg-base']);
  const g = gl, u = (n: string) => g.getUniformLocation(prog, n);
  g.uniform2f(u('res'), cv.width, cv.height); g.uniform2f(u('org'), o[0], o[1]);
  g.uniform1i(u('route'), SWAP_ROUTES.indexOf(kind.route)); g.uniform1f(u('band'), band); g.uniform1f(u('grain'), r.grain);
  g.uniform1f(u('reveal'), reveal ? 1 : 0); g.uniform2f(u('glow'), r.glow[0], r.glow[1]);
  ['c0', 'c1', 'c2', 'c3', 'c4', 'bg'].forEach((n, i) => g.uniform3fv(u(n), cols[i]));
  const uT = u('t'), uF = u('front'), uTail = u('tail'), t0 = performance.now();
  return {
    cv, root, box, o, band, route: kind.route,
    paint: (front, tail, now) => { g.uniform1f(uT, (now - t0) / 1000); g.uniform1f(uF, front); g.uniform1f(uTail, tail); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); },
    drop: () => { cv.remove(); g.getExtension('WEBGL_lose_context')?.loseContext(); },
  };
}

/** 旧快照的擦除边：和着色器同一条方向场（不含扭曲），擦除边放在色带中段；返回 CSS mask-image（旧快照上「还留着」的部分是黑） */
function maskOf(v: Veil, front: number) {
  const { width: w, height: h } = v.box, f = h * 0.06, de = front * (1 + v.band + 2 * M) - M - 0.5 * v.band;
  if (v.route === 'drop') {
    const ox = v.o[0] * w, oy = v.o[1] * h, far = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)), r = Math.max(0, de * far);
    return `radial-gradient(circle at ${ox}px ${oy}px, transparent ${r}px, black ${r + f}px)`;
  }
  if (v.route === 'rise') { const y = (1 - de) * h; return `linear-gradient(to bottom, black ${y - f}px, transparent ${y}px)`; }
  if (v.route === 'drip') { const y = (1.25 * de - 0.25) * h; return `linear-gradient(to bottom, transparent ${y}px, black ${y + f}px)`; }
  const l = Math.max(0, de) * w / 2, rr = w - l;
  return l + f >= rr - f ? 'linear-gradient(transparent, transparent)' : `linear-gradient(to right, transparent ${l}px, black ${l + f}px, black ${rr - f}px, transparent ${rr}px)`;
}

type VTDoc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<unknown>; finished: Promise<unknown>; skipTransition: () => void } };

/** 透出模式（有 View Transitions 时）：一开始就换主题；旧页面拍成快照压在最上面，随色带一路擦掉，色带后面直接露出正在渲染的新页面——
 *  动画给新页面多一段渲染时间，但不把页面整个挡住（2026-10-10 用户：「透过白色区域要看到后方的页面」）。几块一起播时共用一次转场。 */
async function revealSwap(jobs: Job[]) {
  const doc = document as VTDoc, html = document.documentElement;
  const veils = jobs.map((j) => veilOf(j, true));
  if (veils.some((v) => !v)) { veils.forEach((v) => v?.drop()); jobs.forEach((j) => j.apply()); return; }
  const vs = veils as Veil[], tag = (i: number, v: Veil) => (v.root === document.body ? 'root' : `x-swap-host-${i}`);
  const total = T['motion/theme-in'] + T['motion/theme-hold'] + T['motion/theme-out'];
  const css = document.createElement('style');
  css.textContent = [
    // 这次转场只有宿主和遮罩两种元素有名字，页面里平时带共享名的卡片、导航都跟着整页一起擦
    "html[data-vt='theme'] *:not([data-swap-vt]) { view-transition-name: none !important; }",
    "html[data-vt='theme']::view-transition-group(*), html[data-vt='theme']::view-transition-new(*) { animation: none; }",
    "html[data-vt='theme']::view-transition-old(*), html[data-vt='theme']::view-transition-new(*) { mix-blend-mode: normal; }",
    "@keyframes miloSwapHold { from { opacity: 1; } to { opacity: 1; } }",
    ...vs.map((v, i) => `html[data-vt='theme']::view-transition-old(${tag(i, v)}) { z-index: 1; animation: miloSwapHold ${total}ms linear both; -webkit-mask-image: var(--swap-mask-${i}); mask-image: var(--swap-mask-${i}); }`),
    ...vs.map((_, i) => `html[data-vt='theme']::view-transition-group(x-swap-veil-${i}) { z-index: 9; }`),
    // 只播局部（方案台的格子）时，整页其余部分保持实时、不叠旧快照
    ...(vs.some((v) => v.root === document.body) ? [] : ["html[data-vt='theme']::view-transition-old(root) { display: none; }"]),
  ].join('\n');
  document.head.appendChild(css);
  vs.forEach((v, i) => {
    html.style.setProperty(`--swap-mask-${i}`, maskOf(v, 0));
    v.cv.style.viewTransitionName = `x-swap-veil-${i}`; v.cv.dataset.swapVt = '';
    if (v.root !== document.body) { v.root.style.viewTransitionName = tag(i, v); v.root.dataset.swapVt = ''; }
    busy.add(v.root);
  });
  html.dataset.vt = 'theme';
  let done = false;
  const vt = doc.startViewTransition!(() => { vs.forEach((v, i) => { v.root.appendChild(v.cv); v.paint(0, 0, performance.now()); jobs[i].apply(); }); });
  void vt.finished.catch(() => undefined).finally(() => { done = true; });   // 用户按了一下（tap guard 跳过转场）：立刻结束，点按照常生效
  try {
    await vt.ready;
    const start = performance.now();
    for (;;) {
      const now = await frame(), p = Math.min(1, (now - start) / total);
      if (done) break;
      vs.forEach((v, i) => { v.paint(ease(p), 0, now); html.style.setProperty(`--swap-mask-${i}`, maskOf(v, ease(p))); });
      if (p >= 1) break;
    }
  } catch { /* 转场没起来：DOM 已是终态 */ } finally {
    if (!done) vt.skipTransition();
    vs.forEach((v, i) => {
      v.drop(); html.style.removeProperty(`--swap-mask-${i}`); busy.delete(v.root);
      if (v.root !== document.body) { v.root.style.viewTransitionName = ''; delete v.root.dataset.swapVt; }
    });
    css.remove(); delete html.dataset.vt;
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
