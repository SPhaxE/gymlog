/* P06 容量与恢复（放大镜胶囊）· P07 训练记录 · P08 训练记录详情 · P09 动作进步 · P10 动作进步曲线（F3） */
(function () {
  'use strict';
  const App = window.App, E = App.E, esc = App.esc, fmt = App.fmt;
  const A = '③ 导航', I = '① 第一优先信息', M = '② 主操作';
  const DAY = E.DAY;
  const topRoot = (seg) => `<div class="topbar root" data-anno="${A}"><h1>进度</h1></div><div style="padding:0 var(--gutter) 8px">${App.segHtml(seg)}</div>`;
  const skel = (n) => `<div class="stack">${Array.from({ length: n }, () => '<div class="skel" style="height:58px"></div>').join('')}</div>`;
  const emptyBox = (ico, h, p, btn) => `<div class="empty"><div class="ico">${ico}</div><h3>${h}</h3><p>${p}</p>${btn || ''}</div>`;

  // ================================================================== P06 人体示意图（低保真：几何形状，不是 MuscleWiki 的矢量图）
  // [肌头, 形状（e = 椭圆 cx cy rx ry；r = 圆角矩形 x y w h）, 是否左右对称]
  const FRONT = [
    ['upper-pectoralis', ['e', 66, 76, 14, 7], 1], ['mid-lower-pectoralis', ['e', 67, 93, 14, 11], 1], ['anterior-deltoid', ['e', 49, 72, 10, 12], 1], ['lateral-deltoid', ['e', 38, 83, 7, 11], 1],
    ['long-head-bicep', ['e', 28, 108, 5.5, 17], 1], ['short-head-bicep', ['e', 37, 108, 5, 17], 1], ['wrist-flexors', ['e', 26, 148, 6.5, 20], 1],
    ['upper-abdominals', ['r', 71, 108, 18, 24], 0], ['lower-abdominals', ['r', 71, 134, 18, 28], 0], ['obliques', ['e', 61, 128, 7, 20], 1],
    ['inner-thigh', ['e', 78, 218, 4.5, 18], 1], ['rectus-femoris', ['e', 68, 238, 6, 38], 1], ['outer-quadricep', ['e', 57, 240, 5.5, 36], 1], ['inner-quadricep', ['e', 77, 262, 4.5, 22], 1], ['tibialis', ['e', 66, 342, 6, 28], 1],
  ];
  const BACK = [
    ['upper-trapezius', ['e', 80, 62, 24, 9], 0], ['traps-middle', ['e', 80, 84, 15, 11], 0], ['lower-trapezius', ['e', 80, 108, 10, 12], 0], ['lats', ['e', 62, 114, 11, 24], 1], ['lowerback', ['e', 80, 154, 14, 12], 0],
    ['posterior-deltoid', ['e', 49, 72, 10, 12], 1], ['lateral-head-triceps', ['e', 27, 106, 5, 16], 1], ['long-head-triceps', ['e', 35, 106, 5.5, 17], 1], ['medial-head-triceps', ['e', 43, 119, 4.5, 10], 1], ['wrist-extensors', ['e', 26, 148, 6.5, 20], 1],
    ['gluteus-medius', ['e', 60, 184, 8, 8], 1], ['gluteus-maximus', ['e', 67, 201, 13, 13], 1], ['lateral-hamstrings', ['e', 60, 252, 6, 34], 1], ['medial-hamstrings', ['e', 74, 252, 5.5, 34], 1], ['gastrocnemius', ['e', 64, 332, 8, 22], 1], ['soleus', ['e', 64, 368, 6, 15], 1],
  ];
  const FILL = { none: '#fff', low: 'url(#pLow)', ok: '#a8a8a3', over: 'url(#pOver)' };
  const SVG_W = 166, SVG_L = 6, SVG_T = 10, SC = SVG_W / 160, RAIL_L = 200, RAIL_H = 522;
  const shapeSvg = (sh, mirror, attrs) => {
    const one = (m) => (sh[0] === 'e'
      ? `<ellipse cx="${m ? 160 - sh[1] : sh[1]}" cy="${sh[2]}" rx="${sh[3]}" ry="${sh[4]}" ${attrs}/>`
      : `<rect x="${sh[1]}" y="${sh[2]}" width="${sh[3]}" height="${sh[4]}" rx="6" ${attrs}/>`);
    return one(false) + (mirror ? one(true) : '');
  };
  const anchorOf = (sh, mirror) => (sh[0] === 'e' ? [mirror ? 160 - sh[1] : sh[1], sh[2]] : [sh[1] + sh[3] / 2, sh[2] + sh[4] / 2]);
  function silhouette(view, fem) {
    const tw = fem ? [52, 56] : [48, 64];
    const hip = fem ? `<rect x="49" y="186" width="62" height="30" rx="14" class="sil"/>` : '';
    return `<circle cx="80" cy="26" r="17" class="sil"/><rect x="73" y="42" width="14" height="16" class="sil"/><rect x="${tw[0]}" y="58" width="${tw[1]}" height="150" rx="20" class="sil"/>${hip}
      <rect x="22" y="62" width="25" height="66" rx="11" class="sil"/><rect x="113" y="62" width="25" height="66" rx="11" class="sil"/><rect x="18" y="124" width="21" height="62" rx="9" class="sil"/><rect x="121" y="124" width="21" height="62" rx="9" class="sil"/>
      <rect x="51" y="200" width="29" height="108" rx="14" class="sil"/><rect x="80" y="200" width="29" height="108" rx="14" class="sil"/><rect x="55" y="306" width="21" height="96" rx="10" class="sil"/><rect x="84" y="306" width="21" height="96" rx="10" class="sil"/>`;
  }
  const monthDay = (ms) => { const d = new Date(ms); return d.getMonth() + 1 + '/' + d.getDate(); };

  App.pages.P06 = ({ S }) => {
    const top = topRoot('/progress');
    if (S.inject.loading) return { tab: true, html: `<div class="page">${top}<div class="body">${skel(6)}</div></div>` };
    const now = Date.now(), stats = E.headStats(App.env, S.history, S.profile, now);
    const view = S.ui.view || 'front', gender = S.ui.gender || S.profile.gender, fem = gender === 'female';
    const defs = view === 'front' ? FRONT : BACK;
    const items = defs.map(([id, sh, mir]) => ({ id, sh, mir, a: anchorOf(sh, mir), st: stats.get(id) })).sort((a, b) => a.a[1] - b.a[1] || a.a[0] - b.a[0]);
    App.p6 = { items, n: items.length };
    const win = S.history.filter((s) => s.startMs >= now - 7 * DAY && s.startMs <= now);
    const sets = win.reduce((n, s) => n + E.sessionStats(s).sets, 0), load = win.reduce((n, s) => n + E.sessionStats(s).load, 0);
    const days = new Set(win.map((s) => new Date(s.startMs).toDateString())).size;
    const empty = S.history.length === 0;
    const reduce = S.inject.reduceMotion || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const caps = items.map((it, i) => {
      const st = it.st, sel = S.ui.selectedHead === it.id;
      return `<div class="cap ${sel ? 'sel' : ''}" data-i="${i}" data-id="${it.id}"><div class="l1"><b>${esc(st.name)}</b><span>${fmt.r1(st.sets7d)} / ${st.mav}</span></div><div class="l2">${st.recovery == null ? '从未练过' : `恢复 ${fmt.pct(st.recovery)} · ${App.PHASE_NAME[st.phase]}`}</div><div class="cb"><i style="width:${Math.min(100, (100 * st.sets7d) / st.mav)}%"></i></div></div>`;
    }).join('');
    const shapes = items.map((it) => `<g data-act="selHead" data-id="${it.id}" style="cursor:pointer">${shapeSvg(it.sh, it.mir, `class="m ${S.ui.selectedHead === it.id ? 'sel' : ''}" data-h="${it.id}" fill="${FILL[it.st.level]}"`)}</g>`).join('');
    return {
      tab: true,
      html: `<div class="page">${top}<div class="body">
        <div class="kpis" data-anno="${I}"><div class="kpi"><b class="mono">${fmt.n(load)}</b><span>近 7 天总负荷（kg）</span></div><div class="kpi"><b class="mono">${sets}</b><span>完成组数</span></div><div class="kpi"><b class="mono">${days}</b><span>训练天数</span></div></div>
        ${empty ? `<div class="banner soft" style="margin-top:10px"><span>ⓘ</span><div><b>练完第一次训练后，这里会有数据</b><span class="sm">现在人体图都是「未练」，胶囊都是 0。</span></div></div>` : ''}
        <div class="row sb" style="margin:12px 0 6px"><div class="seg sm"><button class="${view === 'front' ? 'on' : ''}" data-act="p6view" data-v="front">正面</button><button class="${view === 'back' ? 'on' : ''}" data-act="p6view" data-v="back">背面</button></div>
          <div class="row"><span class="xs muted">示意体型（不保存）</span><div class="seg sm"><button class="${!fem ? 'on' : ''}" data-act="p6gender" data-v="male">男</button><button class="${fem ? 'on' : ''}" data-act="p6gender" data-v="female">女</button></div></div></div>
        <div class="mapwrap" id="mapwrap">
          <svg class="body-svg" viewBox="0 0 160 440" role="img" aria-label="人体示意图（${view === 'front' ? '正面' : '背面'}），按近 7 天组数着色"><defs><pattern id="pLow" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#fff"/><line x1="0" y1="0" x2="0" y2="5" stroke="#9c9c96" stroke-width="1.6"/></pattern><pattern id="pOver" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#3a3a3a"/><path d="M0 0L5 5M5 0L0 5" stroke="#8a8a8a" stroke-width=".8"/></pattern></defs>${silhouette(view, fem)}${shapes}</svg>
          <svg class="leaders" id="leaders"></svg>
          <div class="rail" id="rail" data-anno="${M}">${caps}</div></div>
        <div class="legend" style="margin-top:8px"><span><i class="l-none"></i>未练</span><span><i class="l-low"></i>低于最低有效量</span><span><i class="l-ok"></i>达标</span><span><i class="l-over"></i>超过最大可恢复量</span></div>
        <div class="xs muted" style="margin-top:6px">${reduce ? '已降级（减少动画）：轻点胶囊或人体上的肌肉看详情。' : '按住右侧胶囊，上下滑动放大；松手打开详情。也可以直接轻点。'} 统计窗口是滚动 7 天。人体图是低保真示意，不是最终素材。</div>
        ${App.p6.n ? '' : ''}</div>${empty ? `<div class="footbar"><button class="btn" data-act="tab" data-t="today">去今日处方</button></div>` : ''}</div>`,
      mount: (root) => mountRail(root, items, stats, reduce),
    };
  };
  Object.assign(App.act, {
    p6view(d) { App.S.ui.view = d.v; App.S.ui.selectedHead = null; App.save(); App.refresh(); },
    p6gender(d) { App.S.ui.gender = d.v; App.refresh(); },
    selHead(d) { selectHead(d.id); },
  });
  function selectHead(id) {
    App.S.ui.selectedHead = id; App.save();
    $$sel('.cap').forEach((c) => c.classList.toggle('sel', c.dataset.id === id));
    $$sel('.body-svg .m').forEach((m) => m.classList.toggle('sel', m.dataset.h === id));
    App.openSheet('head', { id });
  }
  const $$sel = (s) => [...document.querySelectorAll(s)];

  /** 放大镜手势（规则见 ia §1.10）：
   *  触点在轨道上按住 150 ms 进入；进入前移动超过 8 px 视为页面滚动；放大镜期间锁住滚动；
   *  余弦衰减放大；命中按轨道高度均分的「最近胶囊」；轻点是不要长按的替代；减少动画时只剩轻点。 */
  function mountRail(root, items, stats, reduce) {
    const rail = root.querySelector('#rail'), wrap = root.querySelector('#mapwrap'), leaders = root.querySelector('#leaders');
    const caps = [...rail.querySelectorAll('.cap')], n = caps.length, pitch = RAIL_H / n, body = root.querySelector('.body');
    const A_MAX = 2.6, R = 3;
    let activeIdx = null;
    function layout(f) {
      const w = caps.map((_, i) => (f == null ? 1 : 1 + (A_MAX - 1) * Math.pow(Math.cos((Math.PI / 2) * Math.min(1, Math.abs(i - f) / R)), 2)));
      const sum = w.reduce((a, b) => a + b, 0); let y = 0; const near = f == null ? -1 : Math.round(f);
      const pos = caps.map((c, i) => {
        const h = (RAIL_H * w[i]) / sum; c.style.top = y + 1 + 'px'; c.style.height = h - 3 + 'px';
        c.classList.toggle('big', f != null && h > 50); c.classList.toggle('tiny', h - 3 < 27); c.classList.toggle('near', i === near); c.classList.toggle('top', i === near && f != null);
        const cy = y + h / 2; y += h; return cy;
      });
      drawLeaders(pos, near);
      $$sel('.body-svg .m').forEach((m) => m.classList.toggle('act', f != null && m.dataset.h === items[near].id));
    }
    function drawLeaders(pos, near) {
      let g = '';
      items.forEach((it, i) => {
        const ax = SVG_L + it.a[0] * SC, ay = SVG_T + it.a[1] * SC, xm = 176 + (14 * i) / Math.max(1, n - 1);
        g += `<g class="${i === near ? 'on' : ''}"><path d="M${ax.toFixed(1)} ${ay.toFixed(1)}H${xm.toFixed(1)}V${pos[i].toFixed(1)}H${RAIL_L}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.4"/></g>`;
      });
      leaders.innerHTML = g;
    }
    const idxAt = (y) => Math.min(n - 1, Math.max(0, Math.floor(y / pitch)));        // 命中：轨道高度均分，没有死区
    const fracAt = (y) => Math.min(n - 1, Math.max(0, y / pitch - 0.5));
    const localY = (e) => e.clientY - rail.getBoundingClientRect().top;
    layout(null);
    let st = null;
    const lock = (on) => { body.style.overflowY = on ? 'hidden' : ''; rail.classList.toggle('mag', on); wrap.classList.toggle('mag', on); };
    rail.addEventListener('touchmove', (ev) => { if (st && st.active) ev.preventDefault(); }, { passive: false });
    rail.addEventListener('pointerdown', (e) => {
      st = { x0: e.clientX, y0: e.clientY, active: false, moved: false, id: e.pointerId };
      if (!reduce) st.timer = setTimeout(() => { if (st && !st.moved) { st.active = true; lock(true); try { rail.setPointerCapture(st.id); } catch (_) { /* 没有也行 */ } layout(fracAt(localY(e))); activeIdx = idxAt(localY(e)); } }, 150);
    });
    rail.addEventListener('pointermove', (e) => {
      if (!st) return;
      if (!st.active) { if (Math.hypot(e.clientX - st.x0, e.clientY - st.y0) > 8) { st.moved = true; clearTimeout(st.timer); } return; }
      const y = localY(e); layout(fracAt(y)); activeIdx = idxAt(y);
    });
    const end = (e, cancel) => {
      if (!st) return; clearTimeout(st.timer);
      const was = st; st = null;
      if (was.active) { lock(false); layout(null); if (!cancel) selectHead(items[idxAt(localY(e))].id); return; }
      if (!was.moved && !cancel) selectHead(items[idxAt(localY(e))].id); // 轻点：不要求长按
    };
    rail.addEventListener('pointerup', (e) => end(e, false));
    rail.addEventListener('pointercancel', (e) => end(e, true));
    rail.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  App.sheets.head = (data) => {
    const stats = E.headStats(App.env, App.S.history, App.S.profile, Date.now()), st = stats.get(data.id);
    if (!st) return '<p>没有这个肌头。</p>';
    const last = st.lastSession;
    const tier = App.env.tiers[st.tier];
    const contrib = App.S.history.filter((s) => s.startMs >= Date.now() - 7 * DAY && (E.sessionHeadSets(App.env, s).get(st.id) || 0) > 0).reverse();
    return `<h2>${esc(st.name)} <span class="tag">${tier.name} · 基础窗口 ${tier.baseWindowHours} 小时</span></h2>
      <div class="card" style="margin-top:8px"><div class="row sb"><b>恢复度</b>${st.recovery == null ? '<span class="muted">从未练过 · 不显示恢复度</span>' : `<span><b class="mono">${fmt.pct(st.recovery)}</b> <span class="tag ${st.phase === 'repair' ? 'dark' : 'line'}">${App.PHASE_NAME[st.phase]}</span></span>`}</div>
        ${st.recovery != null ? `<div class="bar" style="margin-top:8px"><i style="width:${st.recovery * 100}%"></i></div><div class="sm muted" style="margin-top:6px">${st.hoursLeft > 0 ? `还需${fmt.left(st.hoursLeft)}恢复` : '已经恢复'}</div>` : ''}</div>
      <div class="card" style="margin-top:10px"><div class="row sb"><b>近 7 天</b><span class="mono">${fmt.r1(st.sets7d)} 组</span></div>${App.volBar(st)}</div>
      <div class="card" style="margin-top:10px"><div class="row sb"><b>最近一次练</b><span>${last ? `${fmt.when(E.endMs(last))} · ${fmt.r1(st.lastSets)} 组` : '—'}</span></div>${last ? `<div class="sm muted">${esc(App.regionsText(E.mainRegions(App.env, last)))}那次训练</div>` : ''}</div>
      ${data.full && contrib.length ? `<div class="h2">近 7 天来自</div><div class="card">${contrib.map((s) => `<div class="row sb" style="padding:5px 0"><span>${fmt.date(s.startMs)} ${fmt.wd(s.startMs)}</span><span class="mono">${fmt.r1(E.sessionHeadSets(App.env, s).get(st.id))} 组</span></div>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn small ghost grow" data-act="sheetFull">${data.full ? '收起' : '展开更多'}</button><button class="btn small grow" data-act="closeSheet">关闭</button></div>`;
  };
  App.act.sheetFull = () => { const d = App.ov.sheet.data; d.full = !d.full; App.sheetRedraw(); };

  // ================================================================== P07 训练记录
  App.histShown = 20;
  App.pages.P07 = ({ S }) => {
    const top = topRoot('/progress/history');
    if (S.inject.loading) return { tab: true, html: `<div class="page">${top}<div class="body">${skel(7)}</div></div>` };
    if (!S.history.length) return { tab: true, html: `<div class="page">${top}<div class="body">${emptyBox('▤', '还没有训练记录', '练完第一次训练，这里会按时间倒序列出来。', '<button class="btn small" data-act="tab" data-t="today">去今日处方</button>')}</div></div>` };
    const list = S.history.slice().reverse(), shown = list.slice(0, App.histShown), pr = E.prMap(S.history);
    const row = (s, i) => {
      const st = E.sessionStats(s), has = (pr.get(s.id) || new Set()).size;
      return `<button class="hrow ${i === 0 ? 'first-item' : ''}" data-act="openSession" data-id="${s.id}" ${i === 0 ? `data-anno="${I}"` : ''}><div class="row sb"><b>${fmt.date(s.startMs)} · ${fmt.wd(s.startMs)} ${fmt.time(s.startMs)}</b>${has ? '<span class="pr">PR</span>' : ''}</div>
        <div class="sm" style="margin-top:2px">${esc(App.regionsText(E.mainRegions(App.env, s)))}</div><div class="sm muted">${s.exercises.filter((e) => !e.skipped).length} 个动作 · ${st.sets} 组 · ${s.durationMin} 分钟</div></button>`;
    };
    return { tab: true, html: `<div class="page">${top}<div class="body">${shown.map(row).join('')}${shown.length < list.length ? '<div id="more" class="empty" style="padding:16px"><span class="sm">正在加载更多…</span></div>' : `<div class="empty sm" style="padding:16px">共 ${list.length} 条，已经到底了</div>`}</div></div>`,
      mount: (root) => { const m = root.querySelector('#more'); if (!m) return; new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); setTimeout(() => { App.histShown += 20; App.refresh(); }, 300); } }, { root: root.querySelector('.body') }).observe(m); } };
  };
  App.act.openSession = (d) => App.go('/progress/history/' + d.id);

  // ================================================================== P08 训练记录详情
  App.pages.P08 = ({ S, id }) => {
    const s = S.history.find((x) => x.id === id);
    if (!s) return { html: `<div class="page"><div class="topbar">${App.backBtn()}<h1>训练记录</h1></div><div class="body">${emptyBox('∅', '这次训练已被删除', '正在回到训练记录…')}</div></div>`, mount: () => setTimeout(() => { if (App.route.page === 'P08') { App.go('/progress/history', { replace: true }); App.toast('这次训练已被删除'); } }, 900) };
    const st = E.sessionStats(s), prs = E.prMap(S.history).get(s.id) || new Set();
    const ex = (e) => {
      const name = App.exName(e.exerciseId);
      if (e.skipped) return `<div class="card" style="margin-bottom:10px"><div class="row sb"><b class="muted">${esc(name)}</b><span class="tag line">未做</span></div></div>`;
      return `<div class="card" style="margin-bottom:10px"><div class="row sb"><button class="btn link" style="min-height:28px;padding:0;font-weight:700;font-size:15px;text-decoration:none" data-act="goCurve" data-id="${e.exerciseId}">${esc(name)} ›</button><span class="row">${prs.has(e.exerciseId) ? '<span class="pr">PR</span>' : ''}<button class="btn link" style="min-height:28px;font-size:13px" data-act="openEx" data-id="${e.exerciseId}">要领</button></span></div>
        <table class="tbl"><tbody>${e.sets.map((x, i) => `<tr><td class="muted" style="width:22px">${i + 1}</td><td style="width:56px"><span class="tag ${x.type === 'warmup' ? 'line' : x.type === 'drop' ? 'dark' : ''}">${App.TYPE_NAME[x.type]}</span></td><td class="mono">${fmt.sets(x)}</td><td class="mono muted" style="text-align:right">${x.rpe != null ? 'RPE ' + x.rpe : ''}</td></tr>`).join('')}</tbody></table></div>`;
    };
    return { html: `<div class="page"><div class="topbar">${App.backBtn()}<h1>${fmt.date(s.startMs)} 训练<span class="sub">${fmt.wd(s.startMs)} ${fmt.time(s.startMs)} · ${s.durationMin} 分钟${s.exertion != null ? ' · 力竭度 ' + s.exertion : ''}</span></h1><button class="iconbtn" data-act="menu8" data-id="${s.id}" aria-label="更多">⋯</button></div>
      <div class="body"><div class="kpis" style="margin-bottom:12px"><div class="kpi"><b class="mono">${st.sets}</b><span>总组数</span></div><div class="kpi"><b class="mono">${fmt.n(st.load)}</b><span>总负荷（kg）</span></div><div class="kpi"><b class="mono">${prs.size}</b><span>PR</span></div></div>
      <div data-anno="${I}">${s.exercises.map(ex).join('')}</div></div></div>` };
  };
  Object.assign(App.act, {
    menu8(d) { App.ov.menu = { items: [{ label: '删除这次训练', act: 'delAsk', args: `data-id="${d.id}"` }] }; App.sheetRedraw(); },
    delAsk(d) { App.ov.menu = null; App.dialog({ title: '删除这次训练？', body: '删除后，近 7 天容量、恢复度、趋势和 PR 都会重新计算。', actions: [{ label: '取消', act: 'closeDialog' }, { label: '删除', act: 'delDo', args: `data-id="${d.id}"`, primary: true }] }); },
    delDo(d) {
      const S = App.S, prev = S.history; S.history = prev.filter((s) => s.id !== d.id);
      if (!App.save()) { S.history = prev; App.closeDialog(); return App.toast('没有删除成功：存储写入失败'); }
      App.closeDialog(); App.go('/progress/history', { replace: true }); App.toast('已删除。容量、恢复度、趋势和 PR 已重新计算');
    },
  });

  // ================================================================== P09 动作进步
  const spark = (v) => {
    if (v.length < 2) return '<svg width="64" height="22"></svg>';
    const mn = Math.min(...v), mx = Math.max(...v), w = 64, h = 22;
    const pts = v.map((y, i) => `${(i / (v.length - 1)) * (w - 4) + 2},${h - 3 - (mx === mn ? 0.5 : (y - mn) / (mx - mn)) * (h - 6)}`).join(' ');
    return `<svg width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#2a2a2a" stroke-width="1.6"/></svg>`;
  };
  App.pages.P09 = ({ S }) => {
    const top = topRoot('/progress/exercises');
    const ids = new Set(); S.history.forEach((s) => s.exercises.forEach((e) => { if (!e.skipped) ids.add(e.exerciseId); }));
    const rows = [...ids].map((id) => {
      const ex = App.env.ex.get(id), recs = E.exerciseRecords(S.history, id).filter((r) => r.e1rm != null), last = recs[recs.length - 1];
      return ex && last ? { id, ex, recs, last, prev: recs[recs.length - 2], region: E.regionOfEx(App.env, ex) } : null;
    }).filter(Boolean).sort((a, b) => b.last.session.startMs - a.last.session.startMs);
    if (!rows.length) return { tab: true, html: `<div class="page">${top}<div class="body">${emptyBox('↗', '还没有训练过的动作', '练完之后，这里会列出每个动作的预估 1RM 和趋势。', '<button class="btn small" data-act="tab" data-t="today">去今日处方</button>')}</div></div>` };
    const f = S.ui.filter || 'all', shown = rows.filter((r) => f === 'all' || r.region === f);
    const chips = [['all', '全部'], ...App.raw.muscles.regions.map((r) => [r.id, r.name])].map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="p9filter" data-v="${k}">${n}</button>`).join('');
    const trend = (r) => { if (!r.prev) return '<span class="muted sm">新</span>'; const d = r.last.e1rm - r.prev.e1rm; return d > 0.05 ? `▲ +${fmt.r1(d)}` : d < -0.05 ? `▼ −${fmt.r1(-d)}` : '– 持平'; };
    return { tab: true, html: `<div class="page">${top}<div class="body"><div class="row" style="flex-wrap:wrap;gap:6px;margin-bottom:6px">${chips}</div>
      <div data-anno="${I}">${shown.length ? shown.map((r) => `<button class="hrow" data-act="goCurve" data-id="${r.id}"><div class="row"><div class="grow"><b>${esc(r.ex.name)}</b><div class="sm muted">${r.recs.length} 次记录 · 最近 ${fmt.date(r.last.session.startMs)}</div></div>${spark(r.recs.map((x) => x.e1rm))}<div style="text-align:right;min-width:84px"><b class="mono">${fmt.kg(r.last.e1rm)}</b><div class="sm mono">${trend(r)}</div></div></div></button>`).join('') : emptyBox('∅', '这个分类下没有记录', '换一个分类看看。')}</div></div></div>` };
  };
  App.act.p9filter = (d) => { App.S.ui.filter = d.v; App.save(); App.refresh(); };

  // ================================================================== P10 动作进步曲线
  App.pages.P10 = ({ S, id }) => {
    const ex = App.env.ex.get(id);
    if (!ex) return { html: `<div class="page"><div class="topbar">${App.backBtn()}<h1>动作进步</h1></div><div class="body">${emptyBox('∅', '这个动作已不存在', '它可能被改名或移除了。', '<button class="btn small" data-act="p10list">回到动作列表</button>')}</div></div>` };
    const all = E.exerciseRecords(S.history, id), recs = all.filter((r) => r.e1rm != null);
    const top = `<div class="topbar">${App.backBtn()}<h1>${esc(ex.name)}<span class="sub">预估 1RM · 时间从左到右</span></h1></div>`;
    if (!recs.length) return { html: `<div class="page">${top}<div class="body">${emptyBox('↗', '还没有这个动作的记录', '练一次就会有第一个点。', `<button class="btn small ghost" data-act="openEx" data-id="${id}">看要领</button>`)}</div></div>` };
    const sel = Math.min(recs.length - 1, Math.max(0, (S.ui.pick && S.ui.pick[id] != null) ? S.ui.pick[id] : recs.length - 1));
    const last = recs[recs.length - 1], prev = recs[recs.length - 2];
    const d = prev ? last.e1rm - prev.e1rm : null;
    // 图：时间正序、PR 用菱形（形状区分，不只靠颜色）
    const W = 340, H = 190, ml = 38, mr = 14, mt = 16, mb = 28;
    const t0 = recs[0].session.startMs, t1 = recs[recs.length - 1].session.startMs, vals = recs.map((r) => r.e1rm);
    let lo = Math.min(...vals), hi = Math.max(...vals); const pad = Math.max(2, (hi - lo) * 0.2); lo = Math.floor((lo - pad) / 5) * 5; hi = Math.ceil((hi + pad) / 5) * 5;
    const X = (r, i) => (recs.length === 1 ? ml + (W - ml - mr) / 2 : ml + ((r.session.startMs - t0) / (t1 - t0 || 1)) * (W - ml - mr)), Y = (v) => mt + (1 - (v - lo) / (hi - lo)) * (H - mt - mb);
    const grid = [0, 1, 2, 3].map((k) => { const v = lo + ((hi - lo) * k) / 3; return `<line class="grid" x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${ml - 5}" y="${Y(v) + 3}" text-anchor="end">${Math.round(v)}</text>`; }).join('');
    const line = recs.length > 1 ? `<polyline class="ln" points="${recs.map((r, i) => X(r, i) + ',' + Y(r.e1rm)).join(' ')}"/>` : '';
    const pts = recs.map((r, i) => { const x = X(r, i), y = Y(r.e1rm); return `<g class="pt">${r.isPR ? `<path d="M${x} ${y - 7}L${x + 7} ${y}L${x} ${y + 7}L${x - 7} ${y}Z" fill="#1c1c1c"/>` : `<circle cx="${x}" cy="${y}" r="4.2" fill="#fff" stroke="#1c1c1c" stroke-width="2"/>`}${i === sel ? `<circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#1c1c1c" stroke-dasharray="3 2"/>` : ''}<circle class="hit" cx="${x}" cy="${y}" r="15" data-act="pickPt" data-i="${i}" data-id="${id}"/></g>`; }).join('');
    const s = recs[sel];
    const rowsT = recs.slice(-5).reverse().map((r) => { const best = r.entry.sets.filter(E.isCounted).reduce((b, x) => (E.e1rm(x.weightKg, E.bestReps(x)) > (b ? E.e1rm(b.weightKg, E.bestReps(b)) : -1) ? x : b), null); return `<tr><td>${fmt.date(r.session.startMs)}</td><td class="mono">${best ? fmt.sets(best) : '—'}</td><td class="mono">${fmt.kg(r.e1rm)}</td><td>${r.isPR ? '<span class="pr">PR</span>' : r.baseline ? '<span class="muted xs">基线</span>' : ''}</td></tr>`; }).join('');
    return { html: `<div class="page">${top}<div class="body">
      <div class="card" data-anno="${I}"><div class="row sb"><div><div class="big mono">${fmt.kg(last.e1rm)}</div><div class="sm muted">最新预估 1RM · ${fmt.date(last.session.startMs)}</div></div><div style="text-align:right">${d == null ? '<span class="muted sm">只有 1 次记录</span>' : `<b class="mono">${d > 0.05 ? '▲ +' + fmt.r1(d) : d < -0.05 ? '▼ −' + fmt.r1(-d) : '– 持平'} kg</b><div class="sm muted">对比上一次</div>`}</div></div>
        <svg class="chart" viewBox="0 0 ${W} ${H}" style="margin-top:8px" role="img" aria-label="预估 1RM 折线，旧到新">${grid}<text x="${ml}" y="${H - 8}">${monthDay(t0)}</text><text x="${W - mr}" y="${H - 8}" text-anchor="end">${monthDay(t1)}</text>${line}${pts}</svg>
        <div class="legend"><span><i style="width:9px;height:9px;background:#1c1c1c;transform:rotate(45deg);border:0"></i> PR</span><span><i style="border-radius:50%;width:9px;height:9px;background:#fff;border:2px solid #1c1c1c"></i> 普通</span><span class="muted">点一个点看当次</span></div>
        ${recs.length < 2 ? '<div class="banner soft" style="margin-top:10px"><span>ⓘ</span><div><b>再练一次就能看到趋势</b><span class="sm">现在只有 1 个点，还画不出线。</span></div></div>' : ''}</div>
      <div class="h2">${fmt.date(s.session.startMs)} 那次</div><div class="card"><table class="tbl"><tbody>${s.entry.sets.map((x, i) => `<tr><td class="muted" style="width:22px">${i + 1}</td><td style="width:56px"><span class="tag ${x.type === 'warmup' ? 'line' : x.type === 'drop' ? 'dark' : ''}">${App.TYPE_NAME[x.type]}</span></td><td class="mono">${fmt.sets(x)}</td><td class="mono muted" style="text-align:right">${x.rpe != null ? 'RPE ' + x.rpe : ''}</td></tr>`).join('')}</tbody></table>${s.isPR ? '<div class="pr" style="margin-top:6px">这次创了预估 1RM 新高</div>' : ''}</div>
      <div class="h2">最近记录</div><div class="card"><table class="tbl"><thead><tr><th>日期</th><th>最佳组</th><th>预估 1RM</th><th></th></tr></thead><tbody>${rowsT}</tbody></table></div>
      <div class="row" style="margin-top:12px"><button class="btn small ghost" data-act="openEx" data-id="${id}">看要领</button></div></div></div>` };
  };
  Object.assign(App.act, {
    pickPt(d) { const S = App.S; S.ui.pick = S.ui.pick || {}; S.ui.pick[d.id] = Number(d.i); App.save(); App.refresh(); },
    p10list() { App.go('/progress/exercises', { replace: true }); },
  });
})();
