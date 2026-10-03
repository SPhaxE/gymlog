/* P11 设置 */
(function () {
  'use strict';
  const App = window.App, E = App.E, esc = App.esc, fmt = App.fmt;
  const A = '③ 导航', I = '① 第一优先信息', M = '② 主操作';
  const equipNames = (ids) => App.raw.profile.equipmentCatalog.filter((e) => ids.includes(e.id)).map((e) => e.name).join('、') || '（未选）';

  App.pages.P11 = ({ S }) => {
    const p = S.profile, b = E.budgetFor(p.minutes), pend = S.pendingProfile, ip = S.inProgress;
    const row = (label, val, act) => `<button class="li" data-act="${act}"><span class="grow"><b>${label}</b><div class="sm muted">${esc(val)}</div></span><span class="muted">›</span></button>`;
    return { tab: true, html: `<div class="page"><div class="topbar root" data-anno="${A}"><h1>设置</h1></div><div class="body">
      ${ip ? `<div class="banner soft" style="margin-bottom:12px"><span>▶</span><div><b>训练进行中</b><span class="sm">现在改的设置，会在本次训练结束后生效。</span></div></div>` : ''}
      ${pend ? `<div class="banner" style="margin-bottom:12px"><span>⏳</span><div><b>有改动等着生效</b><span class="sm">${esc(pendText(pend))}</span></div></div>` : ''}
      <div class="card" data-anno="${I}"><div class="big">${App.EXP_NAME[p.experience]} · ${p.minutes} 分钟</div><div class="muted" style="margin-top:2px">${esc(equipNames(p.equipment))}</div><div class="sm muted" style="margin-top:4px">每次约 ${b.exercisesPerDay} 个动作 · ${b.setsPerDay} 组</div></div>
      <div class="h2">档案 <span class="muted">· 改了，今日处方立刻重算</span></div>
      <div class="card" style="padding:0 14px" data-anno="${M}">${row('训练经验', App.EXP_NAME[p.experience], 'setOpenExp')}${row('可用器械', equipNames(p.equipment), 'setOpenEquip')}${row('单次训练时长', p.minutes + ' 分钟', 'setOpenMin')}
        <div class="li" style="cursor:default"><span class="grow"><b>性别</b><div class="sm muted">只影响肌群图和示范的体型示意，不影响处方</div></span><div class="seg sm"><button class="${p.gender === 'male' ? 'on' : ''}" data-act="setGender" data-v="male">男</button><button class="${p.gender === 'female' ? 'on' : ''}" data-act="setGender" data-v="female">女</button></div></div>
        <div class="li" style="cursor:default;border-bottom:0"><span class="grow"><b>重量单位</b><div class="sm muted">kg（暂不支持 lb）</div></span></div></div>
      <div class="h2">关于</div><div class="card"><b class="brand">慢牛 <small>Milo</small></b><div class="sm muted">慢慢变牛。 · 低保真原型，数据只存在这个浏览器里。</div><div class="sm muted" style="margin-top:6px">示范素材来自 <a href="https://musclewiki.com" target="_blank" rel="noopener">MuscleWiki</a>。</div></div>
      <div class="h2">演示</div><div class="card" style="padding:0 14px"><button class="li" data-act="demoLoadAsk"><span class="grow"><b>载入示例数据</b><div class="sm muted">8 周、29 次训练。会覆盖现有历史。</div></span><span class="muted">›</span></button><button class="li" style="border-bottom:0" data-act="demoClearAsk"><span class="grow"><b>清除全部数据</b><div class="sm muted">回到首次建档。</div></span><span class="muted">›</span></button></div></div></div>` };
  };
  const pendText = (p) => [p.experience && '经验 → ' + App.EXP_NAME[p.experience], p.equipment && '器械 → ' + equipNames(p.equipment), p.minutes && '时长 → ' + p.minutes + ' 分钟'].filter(Boolean).join('；');

  // ---- 编辑面板（经验 / 器械 / 时长）：本地草稿，点「保存」才生效
  const open = (type, init) => { App.sheetErr = null; App.openSheet(type, init); };
  Object.assign(App.act, {
    setOpenExp() { open('setExp', { v: App.S.profile.experience }); },
    setOpenEquip() { open('setEquip', { v: App.S.profile.equipment.slice() }); },
    setOpenMin() { open('setMin', { v: App.S.profile.minutes, buf: String(App.S.profile.minutes) }); },
    setGender(d) { const S = App.S; const prev = S.profile.gender; S.profile.gender = d.v; if (!App.save()) { S.profile.gender = prev; App.toast('没有保存成功，性别没有改'); } App.refresh(); },
    pExp(d) { App.ov.sheet.data.v = d.v; App.sheetRedraw(); },
    pEquip(d) { const a = App.ov.sheet.data.v, i = a.indexOf(d.v); i >= 0 ? a.splice(i, 1) : a.push(d.v); App.sheetErr = null; App.sheetRedraw(); },
    pMin(d) { const s = App.ov.sheet.data; s.v = Math.min(150, Math.max(30, Math.round(s.v / 15) * 15 + Number(d.d))); s.buf = String(s.v); App.sheetErr = null; App.sheetRedraw(); },
    pMinSet(d) { const s = App.ov.sheet.data; s.v = Number(d.m); s.buf = String(s.v); App.sheetErr = null; App.sheetRedraw(); },
    setSave() {
      const S = App.S, sh = App.ov.sheet, type = sh.type, d = sh.data;
      let patch;
      if (type === 'setExp') patch = { experience: d.v };
      if (type === 'setEquip') { if (!d.v.length) { App.sheetErr = '至少保留一类器械，否则排不出处方。'; return App.sheetRedraw(); } patch = { equipment: d.v.slice() }; }
      if (type === 'setMin') { const n = Number(d.buf); if (!/^\d+$/.test(d.buf) || n < 30 || n > 150) { App.sheetErr = '请输入 30–150 之间的整数分钟数。'; return App.sheetRedraw(); } patch = { minutes: n }; }
      if (S.inProgress) { // 训练进行中：延后到本次训练结束后生效
        S.pendingProfile = { ...(S.pendingProfile || {}), ...patch };
        if (!App.save()) { App.sheetErr = '保存失败，改动还在这里，可以重试。'; return App.sheetRedraw(); }
        App.ov.sheet = null; App.refresh(); return App.toast('已保存。改动将在本次训练结束后生效');
      }
      const before = App.derive().rx, ids0 = new Set(before && before.items ? before.items.map((i) => i.exerciseId) : []);
      const prev = S.profile; S.profile = { ...prev, ...patch };
      if (!App.save()) { S.profile = prev; App.sheetErr = '保存失败，改动还在这里，可以重试。'; return App.sheetRedraw(); } // 不静默回退
      const after = App.derive().rx;
      S.ui.changedIds = after && after.items ? after.items.map((i) => i.exerciseId).filter((id) => !ids0.has(id)) : [];
      S.ui.practiceAgain = S.ui.practiceAgain && !!S.inProgress;
      App.save(); App.ov.sheet = null; App.refresh();
      App.toast('已保存，今日处方已按新档案重算', { action: { label: '看今日处方', act: 'goToday' }, ms: 4500 });
    },
    goToday() { App.go('/today', { replace: true, reset: true }); },
    demoLoadAsk() { App.dialog({ title: '载入示例数据？', body: '会覆盖现有的全部训练历史，换成 8 周、29 次训练的示例。档案不变。', actions: [{ label: '取消', act: 'closeDialog' }, { label: '载入', act: 'demoLoad', primary: true }] }); },
    demoLoad() {
      const S = App.S; const prev = S.history;
      S.history = App.D.materialize(App.raw.history.sessions, Date.now()); S.inProgress = null; S.deload = { status: 'none', atMs: 0 }; S.ui.practiceAgain = false; S.ui.selectedHead = null;
      if (!App.save()) { S.history = prev; App.closeDialog(); return App.toast('没有载入成功：存储写入失败'); }
      App.closeDialog(); App.refresh(); App.toast('已载入示例数据（29 次训练）');
    },
    demoClearAsk() { App.dialog({ title: '清除全部数据？', body: '训练历史、档案、进行中的训练都会删除，回到首次建档。这个操作没法撤销。', actions: [{ label: '取消', act: 'closeDialog' }, { label: '清除', act: 'demoClear', primary: true }] }); },
    demoClear() {
      const keep = { ...App.S.inject };
      App.S = App.D.buildState(App.raw, 'fresh-install', Date.now(), App.env); Object.assign(App.S.inject, keep);
      if (!App.save()) App.toast('清除时存储写入失败');
      App.closeDialog(); App.stack = []; App.go('/onboarding?step=1', { replace: true, reset: true });
    },
  });
  /** 训练结束 / 放弃后，把训练期间保存的档案改动生效 */
  App.applyPending = () => {
    const S = App.S; if (!S.pendingProfile) return;
    S.profile = { ...S.profile, ...S.pendingProfile }; S.pendingProfile = null; App.save();
  };

  const saveBar = (extra = '') => `${App.sheetErr ? `<div class="err" style="margin-top:12px"><b>${esc(App.sheetErr)}</b></div>` : ''}${extra}<div class="row" style="margin-top:14px"><button class="btn ghost grow" data-act="closeSheet">取消</button><button class="btn grow" data-act="setSave">保存</button></div>`;
  App.sheets.setExp = (d) => `<h2>训练经验</h2><div class="stack" style="margin-top:8px">${['novice', 'intermediate', 'advanced'].map((k) => `<button class="opt ${d.v === k ? 'on' : ''}" data-act="pExp" data-v="${k}"><span class="mark"></span><span><b>${App.EXP_NAME[k]}</b><br><span class="sm muted">${App.EXP_DESC[k]}</span></span></button>`).join('')}</div>${saveBar()}`;
  App.sheets.setEquip = (d) => `<h2>可用器械</h2><p class="sm muted" style="margin:0 0 8px">处方只会排你选了的器械里的动作。至少留一类。</p><div class="stack">${App.raw.profile.equipmentCatalog.map((e) => `<button class="opt check ${d.v.includes(e.id) ? 'on' : ''}" data-act="pEquip" data-v="${e.id}"><span class="mark"></span><span class="grow">${esc(e.name)}</span>${e.inPool ? '' : '<span class="tag">暂无对应动作</span>'}</button>`).join('')}</div>${saveBar()}`;
  App.sheets.setMin = (d) => { const b = E.budgetFor(Number(d.buf) || d.v); return `<h2>单次训练时长</h2><div class="stepper" style="justify-content:center;margin:14px 0 6px"><button data-act="pMin" data-d="-15" aria-label="减 15 分钟">−</button><div style="text-align:center"><b class="mono" style="font-size:36px">${esc(d.buf)}</b><div class="sm muted">分钟 · 30–150</div></div><button data-act="pMin" data-d="15" aria-label="加 15 分钟">+</button></div>
    <div class="row" style="justify-content:center;gap:6px">${[30, 45, 60, 90, 120].map((m) => `<button class="chip ${Number(d.buf) === m ? 'on' : ''}" data-act="pMinSet" data-m="${m}">${m}</button>`).join('')}</div><div class="card" style="text-align:center;margin-top:12px">约 <b>${b.exercisesPerDay}</b> 个动作 · <b>${b.setsPerDay}</b> 组</div>${saveBar()}`; };
})();
