/* 慢牛 Milo · 原型外壳：状态、路由（含 Android 返回键语义）、浮层、控制面板、标注 */
(function () {
  'use strict';
  const E = MiloEngine, D = MiloData;
  const App = (window.App = { pages: {}, act: {}, sheets: {}, ov: { sheet: null, dialog: null, toast: null, menu: null }, stack: [], scrollMem: {}, exited: false });
  const KEY = 'milo.proto.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Object.assign(App, { $, $$, esc, E, D });

  // ------------------------------------------------------------------ 文案格式（口径取自 brief 统一口径表）
  const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const r1 = (x) => Math.round(x * 10) / 10;
  const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const fmt = (App.fmt = {
    date: (ms) => { const d = new Date(ms); return (d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + ' 年 ' : '') + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日'; },
    wd: (ms) => WD[new Date(ms).getDay()],
    time: (ms) => { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
    when: (ms) => {
      const days = Math.round((startOfDay(Date.now()) - startOfDay(ms)) / 864e5);
      return days <= 0 ? '今天 ' + fmt.time(ms) : days === 1 ? '昨天 ' + fmt.time(ms) : days + ' 天前';
    },
    kg: (w) => (w == null ? '—' : r1(w) + ' kg'),
    n: (x) => Math.round(x).toLocaleString('en-US'),
    clock: (sec) => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); },
    left: (h) => (h < 1 ? '不到 1 小时' : h < 48 ? '约 ' + Math.round(h) + ' 小时' : '约 ' + Math.round(h / 24) + ' 天'),
    pct: (r) => Math.round(r * 100) + '%',
    sets: (s) => {
      const w = s.weightKg > 0 ? r1(s.weightKg) + ' kg × ' : s.weightKg === 0 ? '自重 × ' : '';
      return w + (s.reps != null ? s.reps : (s.repsLeft != null ? '左 ' + s.repsLeft : '') + (s.repsRight != null ? ' · 右 ' + s.repsRight : ''));
    },
    r1,
  });
  const REGION_NAME = {}; // 在 boot 里按 muscles.json 填
  App.REGION_NAME = REGION_NAME;
  App.TYPE_NAME = { warmup: '热身组', work: '工作组', drop: '递减组' };
  App.PHASE_NAME = E.PHASE_NAME;
  App.EXP_NAME = { novice: '新手', intermediate: '进阶', advanced: '高阶' };
  App.EXP_DESC = { novice: '训练不满 6 个月，动作还在学', intermediate: '6–24 个月，线性加重开始卡住', advanced: '两年以上，每次多加一点都很难' };
  App.DEFAULT_INJECT = { storageFail: false, engineError: false, mediaMissing: false, mediaError: false, loading: false };

  // ------------------------------------------------------------------ 状态与存储
  App.load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
  App.save = () => {
    if (App.S.inject.storageFail) return false; // 测试注入：写入失败
    try { localStorage.setItem(KEY, JSON.stringify(App.S)); return true; } catch (e) { return false; }
  };
  App.loadScenario = (id) => {
    const keepMotion = App.S ? App.S.inject.reduceMotion : false;
    App.S = D.buildState(App.raw, id, Date.now(), App.env);
    App.S.inject.reduceMotion = keepMotion;
    App.exited = false; App.stack = []; App.scrollMem = {}; App.ov = { sheet: null, dialog: null, toast: null, menu: null };
    App.save();
  };
  /** 当前时刻的派生数据：处方、减量状态、今天是否已练 */
  App.derive = () => {
    const S = App.S, now = Date.now();
    App.env.now = now;
    const signal = E.deloadSignal(App.env, S.history);
    const dv = E.deloadView(signal, S.deload, now);
    let rx = null, err = null;
    if (S.profile) {
      try { rx = E.prescribe(App.env, S.history, S.profile, { now, deload: dv.kind === 'week', inject: S.inject.engineError ? 'engine.throw' : null }); } catch (e) { err = e; }
    }
    const today0 = startOfDay(now);
    const todays = S.history.filter((s) => s.startMs >= today0);
    return { now, signal, dv, rx, err, doneToday: todays.length ? todays[todays.length - 1] : null, pr: E.prMap(S.history) };
  };
  App.exName = (id) => { const e = App.env.ex.get(id); return e ? e.name : '（动作已不存在）'; };
  App.headName = (id) => { const h = App.env.heads.get(id); return h ? h.name : id; };

  // ------------------------------------------------------------------ 路由
  const ROUTES = [
    [/^\/onboarding$/, 'P12'], [/^\/today$/, 'P01'], [/^\/today\/why$/, 'P02'], [/^\/session$/, 'P03'], [/^\/exercise\/([^/]+)$/, 'P04'],
    [/^\/summary\/([^/]+)$/, 'P05'], [/^\/progress$/, 'P06'], [/^\/progress\/history$/, 'P07'], [/^\/progress\/history\/([^/]+)$/, 'P08'],
    [/^\/progress\/exercises$/, 'P09'], [/^\/progress\/exercises\/([^/]+)$/, 'P10'], [/^\/settings$/, 'P11'],
  ];
  const PARENT = { P02: '/today', P04: '/today', P05: '/today', P06: '/today', P07: '/progress', P08: '/progress/history', P09: '/progress', P10: '/progress/exercises', P11: '/today' };
  const TAB_OF = { P01: 'today', P06: 'progress', P07: 'progress', P09: 'progress', P11: 'settings' };
  App.TAB_OF = TAB_OF;
  const parse = (hash) => {
    const [path, qs] = (hash || '').replace(/^#/, '').split('?');
    const p = '/' + (path || 'today').split('/').filter(Boolean).join('/');
    for (const [re, page] of ROUTES) { const m = re.exec(p); if (m) return { path: p, page, params: m.slice(1).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')), full: p + (qs ? '?' + qs : '') }; }
    return { path: '/today', page: 'P01', params: [], q: {}, full: '/today' };
  };
  const guard = (r) => {
    const S = App.S;
    if (!S.profile) return r.page === 'P12' ? r : parse('#/onboarding?step=' + S.onboarding.step);
    if (r.page === 'P12') return parse('#/today');
    if (r.page === 'P03' && !S.inProgress) return parse('#/today');
    return r;
  };
  App.route = parse(location.hash);
  App.go = (path, o = {}) => {
    saveScroll();
    if (!o.replace && App.route.full !== path) App.stack.push(App.route.full);
    if (o.reset) App.stack = [];
    if (App.stack.length > 40) App.stack.shift();
    history[o.replace ? 'replaceState' : 'pushState'](null, '', '#' + path);
    App.closeOverlays();
    App.render();
  };
  App.back = () => {
    const o = App.ov;
    if (App.exited) return;
    if (o.dialog) { o.dialog = null; return drawOverlay(); }
    if (o.menu) { o.menu = null; return drawOverlay(); }
    if (o.sheet) { App.closeSheet(); return; }
    const r = App.route;
    if (r.page === 'P12') { const st = App.S.onboarding.step; if (st > 1) { App.S.onboarding.step = st - 1; App.save(); return App.go('/onboarding?step=' + (st - 1), { replace: true }); } return App.exit(); }
    if (r.page === 'P03') return App.act.pauseAsk();
    if (r.page === 'P05') return App.go('/today', { replace: true, reset: true });
    if (r.page === 'P01') {
      if (App.exitArmed) return App.exit();
      App.exitArmed = true; App.toast('再按一次返回键退出应用'); setTimeout(() => (App.exitArmed = false), 2000); return;
    }
    if (r.page === 'P11' || r.page === 'P06') return App.go('/today', { replace: true, reset: true });
    const prev = App.stack.pop();
    if (prev) { history.pushState(null, '', '#' + prev); return App.render(); }
    App.go(PARENT[r.page] || '/today', { replace: true });
  };
  App.exit = () => { App.exited = true; App.ov = { sheet: null, dialog: null, toast: null, menu: null }; drawOverlay(); };
  App.reopen = () => {
    App.exited = false; App.exitArmed = false;
    App.S = App.load() || App.S; // 像杀进程后重新打开：只认已写入存储的内容
    App.stack = [];
    history.replaceState(null, '', '#/today'); App.render();
  };

  function saveScroll() { const b = $('.body', $('#screen')); if (b) App.scrollMem[App.route.full] = b.scrollTop; }
  App.render = () => {
    let r = parse(location.hash);
    const g = guard(r);
    if (g !== r) { history.replaceState(null, '', '#' + g.full); r = g; }
    App.route = r; draw();
    const b = $('.body', $('#screen'));
    if (b) b.scrollTop = App.scrollMem[r.full] || 0;
  };
  /** 状态变了，原地重绘（保留滚动位置和浮层） */
  App.refresh = () => {
    const b = $('.body', $('#screen')); const top = b ? b.scrollTop : 0;
    draw(); const b2 = $('.body', $('#screen')); if (b2) b2.scrollTop = top;
  };
  function draw() {
    const S = App.S, r = App.route;
    App.env.now = Date.now();
    document.body.classList.toggle('anno-on', App.anno);
    $('#device').classList.toggle('reduce-motion', !!S.inject.reduceMotion);
    let view;
    try { view = App.pages[r.page]({ S, env: App.env, r, id: r.params[0] || '', q: r.q }); }
    catch (e) { console.error(e); view = { html: `<div class="page"><div class="body"><div class="err">页面渲染出错：${esc(e.message)}</div></div></div>` }; }
    $('#screen').innerHTML = view.html;
    const tab = view.tab ? TAB_OF[r.page] : null;
    $('#device').classList.toggle('has-tab', !!tab);
    $('#tabbar').innerHTML = tab ? [['today', '今日', '◉'], ['progress', '进度', '▥'], ['settings', '设置', '⚙']].map(([k, n, ic]) => `<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}"><b>${ic}</b>${n}</button>`).join('') : '';
    if (view.mount) view.mount($('#screen'), { S, env: App.env, r, id: r.params[0] || '' });
    drawOverlay(); drawPanel(); drawAnno();
  }
  App.segHtml = (active) => `<div class="seg" data-anno="③ 导航">${[['/progress', '容量与恢复'], ['/progress/history', '训练记录'], ['/progress/exercises', '动作进步']].map(([p, n]) => `<button class="${active === p ? 'on' : ''}" data-act="seg" data-to="${p}">${n}</button>`).join('')}</div>`;
  App.backBtn = (label = '返回') => `<button class="iconbtn" data-act="back" aria-label="${label}" data-anno="③ 导航">‹</button>`;

  // ------------------------------------------------------------------ 浮层：面板、对话框、提示
  App.closeOverlays = () => { App.ov.sheet = null; App.ov.dialog = null; App.ov.menu = null; };
  App.openSheet = (type, data) => { App.ov.sheet = { type, data: data || {} }; App.ov.menu = null; drawOverlay(); };
  App.closeSheet = () => { const s = App.ov.sheet; App.ov.sheet = null; if (s && App.onSheetClose) App.onSheetClose(s); drawOverlay(); };
  App.dialog = (d) => { App.ov.dialog = d; drawOverlay(); };
  App.closeDialog = () => { App.ov.dialog = null; drawOverlay(); };
  let toastTimer;
  App.toast = (msg, o = {}) => {
    App.ov.toast = { msg, action: o.action };
    drawOverlay(); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { App.ov.toast = null; drawOverlay(); }, o.ms || 2600);
  };
  App.sheetRedraw = () => drawOverlay();
  function drawOverlay() {
    const o = App.ov; let h = '';
    if (App.exited) {
      h = `<div class="exited"><div style="font-size:15px">应用已退出</div><div class="sm">像从系统里划掉了一样：下面「重新打开」只认已写入存储的内容。<br>训练进行中的话，回来时今日顶部会有「继续训练」。</div><button class="btn" data-act="reopen">重新打开应用</button></div>`;
    } else {
      if (o.sheet) h += `<div class="scrim" data-act="closeSheet"></div><div class="sheet" data-sheet="${o.sheet.type}"><div class="grab" data-act="closeSheet"></div>${App.sheets[o.sheet.type](o.sheet.data)}</div>`;
      if (o.menu) h += `<div class="scrim" style="background:transparent" data-act="closeMenu"></div><div class="menu">${o.menu.items.map((i) => `<button data-act="${i.act}" ${i.args || ''}>${esc(i.label)}</button>`).join('')}</div>`;
      if (o.dialog) {
        const d = o.dialog;
        h += `<div class="scrim" data-act="noop"></div><div class="dialog" role="alertdialog"><h2>${esc(d.title)}</h2><p>${d.body}</p><div class="acts">${d.actions.map((a) => `<button class="btn ${a.primary ? '' : 'ghost'}" data-act="${a.act}" ${a.args || ''}>${esc(a.label)}</button>`).join('')}</div></div>`;
      }
      if (o.toast) h += `<div class="toast">${esc(o.toast.msg)}${o.toast.action ? `<button data-act="${o.toast.action.act}">${esc(o.toast.action.label)}</button>` : ''}</div>`;
    }
    $('#overlay').innerHTML = h;
    if (o.sheet && App.onSheetMount) App.onSheetMount(o.sheet);
  }

  // ------------------------------------------------------------------ 事件
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    const fn = App.act[t.dataset.act];
    if (fn) { ev.preventDefault(); fn(t.dataset, ev, t); }
  });
  Object.assign(App.act, {
    noop() {},
    back() { App.back(); },
    closeSheet() { App.closeSheet(); },
    closeDialog() { App.closeDialog(); },
    closeMenu() { App.ov.menu = null; drawOverlay(); },
    reopen() { App.reopen(); },
    tab(d) { App.go({ today: '/today', progress: '/progress', settings: '/settings' }[d.t], { replace: true, reset: true }); },
    seg(d) { App.go(d.to, { replace: true }); },
    go(d) { App.go(d.to, d.replace ? { replace: true } : {}); },
  });
  window.addEventListener('popstate', () => { const prev = App.stack[App.stack.length - 1]; if (prev === parse(location.hash).full) App.stack.pop(); App.closeOverlays(); App.render(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') App.back(); });

  // ------------------------------------------------------------------ 计时（休息、训练时长、状态栏）
  setInterval(() => {
    const now = Date.now();
    const c = $('#clock'); if (c) c.textContent = fmt.time(now);
    const S = App.S; if (!S || !S.inProgress) return;
    const rest = S.inProgress.rest;
    if (rest) {
      const left = Math.max(0, (rest.endsAt - now) / 1000);
      $$('[data-rest-clock]').forEach((el) => (el.textContent = fmt.clock(Math.ceil(left))));
      $$('[data-rest-bar]').forEach((el) => (el.style.width = Math.min(100, (100 * (rest.totalSec - left)) / rest.totalSec) + '%'));
      if (left <= 0 && !S.inProgress.restDone) {
        S.inProgress.restDone = true; App.save();
        try { navigator.vibrate && navigator.vibrate(200); } catch (e) { /* 不支持就算了 */ }
        if (App.route.page === 'P03') App.refresh();
      }
    }
    $$('[data-elapsed]').forEach((el) => (el.textContent = Math.max(0, Math.round((now - S.inProgress.startMs) / 60e3)) + ' 分钟'));
  }, 250);

  // ------------------------------------------------------------------ 线框标注
  App.anno = (() => { try { return localStorage.getItem('milo.anno') === '1'; } catch (e) { return false; } })();
  function drawAnno() {
    const m = window.PAGE_META[App.route.page];
    $('#annocard').innerHTML = m ? `<b>${App.route.page} ${esc(m.name)}</b><br><b>①</b> ${esc(m.first)}<br><b>②</b> ${esc(m.action)}<br><b>③</b> ${esc(m.nav)}` : '';
  }
  App.setAnno = (on) => { App.anno = on; try { localStorage.setItem('milo.anno', on ? '1' : '0'); } catch (e) { /* 忽略 */ } document.body.classList.toggle('anno-on', on); };

  // ------------------------------------------------------------------ 控制面板
  App.jump = (j) => {
    if (j.scenario) App.loadScenario(j.scenario);
    else { Object.assign(App.S.inject, App.DEFAULT_INJECT); }
    if (j.inject) Object.assign(App.S.inject, j.inject);
    if (j.then === 'startSession') App.act.startSession({}, null, null, true);
    App.save();
    App.closeOverlays();
    App.go(j.route || '/today', { replace: true, reset: true });
  };
  function drawPanel() {
    const S = App.S, page = App.route.page, m = window.PAGE_META[page];
    const sc = App.raw.scenarios.scenarios;
    const inj = S.inject;
    const tg = (k, label) => `<label class="tg"><input type="checkbox" data-p="inject" data-k="${k}" ${inj[k] ? 'checked' : ''}>${label}</label>`;
    const flows = window.FLOWS.map((f) => `<details><summary>${f.id} ${f.title}</summary><ol>${f.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><button class="pbtn" data-p="flow" data-id="${f.id}">从头开始 ${f.id}</button></details>`).join('');
    $('#panel').innerHTML = `
      <h1>慢牛 Milo · 低保真原型</h1>
      <div class="note">阶段 2：P01–P12 线框 + F1–F4 可点通。灰阶、无品牌视觉。数据来自 <span class="mono">mock/</span>，改动只存在你的浏览器里。</div>
      <h3>场景（对应 mock/scenarios.json）</h3>
      <select data-p="scenario">${sc.map((s) => `<option value="${s.id}" ${S.scenarioId === s.id ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select>
      <div class="grid2" style="margin-top:6px"><button class="pbtn" data-p="reset">重置当前场景</button><button class="pbtn" data-p="back">◁ 系统返回键</button></div>
      <h3>当前页：${page} ${m ? esc(m.name) : ''}</h3>
      ${m ? `<div class="meta"><b>①</b> 第一优先信息：${esc(m.first)}<br><b>②</b> 主操作：${esc(m.action)}<br><b>③</b> 导航：${esc(m.nav)}</div>
      <div class="note" style="margin-top:8px">需覆盖的数据态（点一下跳过去）：</div>
      <div class="states">${m.states.map((s, i) => `<button data-p="state" data-i="${i}">${esc(s[0])}</button>`).join('')}</div>` : ''}
      <h3>显示与测试注入</h3>
      <label class="tg"><input type="checkbox" data-p="anno" ${App.anno ? 'checked' : ''}>显示线框标注（① 第一优先信息 ② 主操作 ③ 导航）</label>
      ${tg('reduceMotion', '减少动画（P06 只剩轻点，无放大镜）')}
      ${tg('storageFail', '存储写入失败（建档 / 记组 / 保存时可见）')}
      ${tg('engineError', '引擎抛错（P01 错误态）')}
      ${tg('loading', '页面停在加载态（P01 / P06 / P07）')}
      ${tg('mediaMissing', '示范缺失（P04「暂无示范」）')}
      ${tg('mediaError', '素材加载失败（P04）')}
      <h3>页面直达</h3>
      <div class="pages">${Object.entries(window.PAGE_META).map(([id, v]) => `<button class="${id === page ? 'on' : ''}" data-p="page" data-id="${id}" title="${esc(v.name)}">${id}</button>`).join('')}</div>
      <h3>核心流程走查</h3>${flows}
      <div class="note" style="margin-top:12px">说明：地标、恢复窗口等数值由原型里的简化引擎算出，规则与 V1 对齐；阶段 5 会用 TS 重写并配 ≥ 40 项测试。示范素材来自 MuscleWiki。</div>`;
  }
  App.drawPanel = drawPanel;
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-p]'); if (!t) return;
    const p = t.dataset.p;
    if (p === 'scenario') { App.loadScenario(t.value); App.go(t.value === 'fresh-install' ? '/onboarding?step=1' : t.value === 'in-progress' ? '/today' : '/today', { replace: true, reset: true }); }
    if (p === 'inject') { App.S.inject[t.dataset.k] = t.checked; App.save(); App.refresh(); }
    if (p === 'anno') App.setAnno(t.checked);
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button[data-p]'); if (!t) return;
    const p = t.dataset.p;
    if (p === 'reset') { App.loadScenario(App.S.scenarioId); App.go(App.S.profile ? '/today' : '/onboarding?step=1', { replace: true, reset: true }); }
    if (p === 'back') App.back();
    if (p === 'page') { const m = window.PAGE_META[t.dataset.id]; App.closeOverlays(); App.go(m.route, { replace: true, reset: true }); }
    if (p === 'state') App.jump(window.PAGE_META[App.route.page].states[+t.dataset.i][1]);
    if (p === 'flow') { const f = window.FLOWS.find((x) => x.id === t.dataset.id); App.jump(f.start); document.getElementById('panel').classList.remove('open'); }
  });
  $('#fab').addEventListener('click', () => $('#panel').classList.toggle('open'));
  App.draw = draw;
})();
