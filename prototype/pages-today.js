/* P12 建档 · P01 今日处方 · P02 处方依据 */
(function () {
  'use strict';
  const App = window.App, E = App.E, esc = App.esc, fmt = App.fmt;
  const A = '③ 导航', I = '① 第一优先信息', M = '② 主操作';

  /** 近 7 天组数条：三条地标（最低有效量 / 适宜量 / 最大可恢复量） */
  App.volBar = (st, labels = true) => {
    const max = st.mrv * 1.15, p = (v) => Math.min(100, (100 * v) / max);
    return `<div class="vol" style="${labels ? '' : 'margin:8px 0 6px'}"><i class="f" style="width:${p(st.sets7d)}%"></i>${[['mev', st.mev], ['mav', st.mav], ['mrv', st.mrv]].map(([k, v]) => `<i class="t" style="left:${p(v)}%">${labels ? `<em>${{ mev: '最低', mav: '适宜', mrv: '上限' }[k]} ${v}</em>` : ''}</i>`).join('')}</div>`;
  };
  App.headsText = (ids, n = 3) => ids.slice(0, n).map(App.headName).join('、') + (ids.length > n ? '…' : '');
  App.regionsText = (regions) => regions.map((r) => App.REGION_NAME[r]).join('、');
  const phaseTag = (st) => `<span class="tag ${st.phase === 'repair' ? 'dark' : 'line'}">${App.PHASE_NAME[st.phase]}</span>`;

  // ================================================================== P12 建档
  const EXP = ['novice', 'intermediate', 'advanced'];
  App.pages.P12 = ({ S, q }) => {
    const ob = S.onboarding;
    const step = Math.min(3, Math.max(1, +(q.step || ob.step)));
    ob.step = step;
    const err = App.obErr ? `<div class="banner" style="margin-top:12px"><span>⚠</span><div><b>没有保存成功</b>你的选择还在这一页，可以重试。<button class="btn small" style="margin-top:8px" data-act="obRetry">重试</button></div></div>` : '';
    let title, sub, body, next = '下一步', disabled = false;
    if (step === 1) {
      title = '你的训练经验？'; sub = '不确定就用默认，之后可以在设置里改。';
      body = `<div class="stack" data-anno="${I}">${EXP.map((k) => `<button class="opt ${ob.experience === k ? 'on' : ''}" data-act="obExp" data-v="${k}"><span class="mark"></span><span><b>${App.EXP_NAME[k]}</b><br><span class="sm muted">${App.EXP_DESC[k]}</span></span></button>`).join('')}</div>`;
    } else if (step === 2) {
      title = '你能用到哪些器械？'; sub = '至少选一类。处方只会排你选了的器械里的动作。';
      const cat = App.raw.profile.equipmentCatalog;
      const row = (e) => `<button class="opt check ${ob.equipment.includes(e.id) ? 'on' : ''}" data-act="obEquip" data-v="${e.id}"><span class="mark"></span><span class="grow">${esc(e.name)}</span>${e.inPool ? '' : '<span class="tag">暂无对应动作</span>'}</button>`;
      body = `<div class="stack" data-anno="${I}">${cat.filter((e) => e.inPool).map(row).join('')}</div><div class="h2">其他器械</div><div class="stack">${cat.filter((e) => !e.inPool).map(row).join('')}</div>`;
      disabled = ob.equipment.length === 0;
      if (disabled) body += `<div class="err">至少选一类器械。</div>`;
    } else {
      title = '单次训练多久？'; sub = '用来决定一次排几个动作、几组。30–150 分钟。';
      const b = E.budgetFor(ob.minutes);
      body = `<div data-anno="${I}"><div class="stepper" style="justify-content:center;margin:18px 0 10px"><button data-act="obMin" data-d="-15" aria-label="减 15 分钟">−</button>
        <div style="text-align:center"><input id="minutes" class="mono" inputmode="numeric" value="${ob.minutes}" style="width:96px;font-size:40px;font-weight:800;text-align:center;border:0;border-bottom:2px solid var(--ink);background:none;padding:0"><div class="sm muted">分钟</div></div>
        <button data-act="obMin" data-d="15" aria-label="加 15 分钟">+</button></div>
        <div id="minerr"></div>
        <div class="card" style="text-align:center" id="derived">约 <b>${b.exercisesPerDay}</b> 个动作 · <b>${b.setsPerDay}</b> 组</div></div>
        <div class="row" style="justify-content:center;margin-top:12px;gap:6px">${[30, 45, 60, 90, 120].map((m) => `<button class="chip ${ob.minutes === m ? 'on' : ''}" data-act="obMinSet" data-m="${m}">${m}</button>`).join('')}</div>`;
      next = '生成第一份处方';
    }
    return {
      html: `<div class="page"><div class="topbar" data-anno="${A}">${step > 1 ? `<button class="iconbtn" data-act="back" aria-label="上一步">‹</button>` : '<span style="width:8px"></span>'}<div class="grow sm muted">${step} / 3</div><span class="brand sm">慢牛<small>Milo</small></span></div>
        <div class="steps">${[1, 2, 3].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
        <div class="body"><h1 style="font-size:24px;margin:22px 0 4px">${title}</h1><p class="muted" style="margin:0 0 16px">${sub}</p>${body}${err}</div>
        <div class="footbar"><button class="btn" id="obNext" data-act="${step === 3 ? 'obFinish' : 'obNext'}" data-anno="${M}" ${disabled ? 'disabled' : ''}>${next}</button></div></div>`,
      mount: (root) => {
        const inp = root.querySelector('#minutes');
        if (inp) inp.addEventListener('input', () => {
          const v = inp.value.trim(), n = Number(v), ok = /^\d+$/.test(v) && n >= 30 && n <= 150;
          root.querySelector('#minerr').innerHTML = ok ? '' : '<div class="err">请输入 30–150 之间的整数分钟数。</div>';
          root.querySelector('#obNext').disabled = !ok;
          if (ok) { ob.minutes = n; const b = E.budgetFor(n); root.querySelector('#derived').innerHTML = `约 <b>${b.exercisesPerDay}</b> 个动作 · <b>${b.setsPerDay}</b> 组`; App.save(); }
        });
      },
    };
  };
  const obSave = () => { App.obErr = !App.save(); };
  Object.assign(App.act, {
    obExp(d) { App.S.onboarding.experience = d.v; obSave(); App.refresh(); },
    obEquip(d) { const e = App.S.onboarding.equipment, i = e.indexOf(d.v); i >= 0 ? e.splice(i, 1) : e.push(d.v); obSave(); App.refresh(); },
    obMin(d) { const o = App.S.onboarding; o.minutes = Math.min(150, Math.max(30, Math.round(o.minutes / 15) * 15 + Number(d.d))); obSave(); App.refresh(); },
    obMinSet(d) { App.S.onboarding.minutes = Number(d.m); obSave(); App.refresh(); },
    obNext() { const o = App.S.onboarding; o.step = Math.min(3, o.step + 1); obSave(); App.go('/onboarding?step=' + o.step, { replace: true }); },
    obRetry() { App.obErr = false; App.act.obFinish(); },
    obFinish() {
      const S = App.S, o = S.onboarding;
      if (!(o.minutes >= 30 && o.minutes <= 150) || !o.equipment.length) return;
      S.profile = { experience: o.experience, equipment: o.equipment.slice(), minutes: o.minutes, gender: 'male' };
      if (!App.save()) { S.profile = null; App.obErr = true; return App.refresh(); } // 停在本步，可见错误
      App.obErr = false;
      App.go('/today', { replace: true, reset: true });
    },
  });

  // ================================================================== P01 今日处方
  const skeleton = () => `<div class="stack"><div class="skel" style="height:72px"></div>${[0, 1, 2, 3, 4].map(() => '<div class="skel" style="height:62px"></div>').join('')}</div>`;
  const deloadBanner = (dv, signal) => {
    if (dv.kind === 'suggest') return `<button class="banner" style="width:100%;text-align:left;margin-bottom:12px" data-act="deloadOpen" data-anno="${I}"><span style="font-size:18px">↘</span><div class="grow"><b>建议本周减量</b><span class="sm">${signal.hits.map((h) => h.name).join('、')}的预估 1RM 连续两次下降。看依据并决定 ›</span></div></button>`;
    if (dv.kind === 'week') return `<div class="banner soft" style="margin-bottom:12px"><span style="font-size:18px">↘</span><div><b>减量周 · 还剩 ${dv.daysLeft} 天</b><span class="sm">容量 ×0.5、强度 ×0.9。到期后恢复正常处方。</span></div></div>`;
    if (dv.kind === 'note') return `<div class="sm muted" style="margin-bottom:10px">减量信号仍在（${signal.hits.map((h) => h.name).join('、')}）。你选了「这次不减」，还剩 ${dv.daysLeft} 天不再提示。</div>`;
    return '';
  };
  const hoursList = (stats, n = 8) => `<div class="list">${stats.slice(0, n).map((h) => `<div class="li" style="cursor:default"><div class="grow"><b>${esc(h.name)}</b> ${h.recovery != null ? `<span class="muted sm">恢复度 ${fmt.pct(h.recovery)}</span>` : ''}</div><span class="sm">还需${fmt.left(h.hoursLeft)}</span></div>`).join('')}</div>`;

  App.pages.P01 = ({ S }) => {
    const now = Date.now();
    const top = `<div class="topbar root" data-anno="${A}"><h1>今日处方<span class="sub">${fmt.date(now)} · ${fmt.wd(now)}</span></h1></div>`;
    if (S.inject.loading) return { tab: true, html: `<div class="page">${top}<div class="body">${skeleton()}</div></div>` };
    const d = App.derive();
    const ip = S.inProgress;
    let body = '', foot = '';
    if (d.err) {
      body = `<div class="card" data-anno="${I}"><h3 style="margin:0 0 6px">⚠ 处方没有算出来</h3><p class="muted" style="margin:0 0 6px">引擎出错了，这里不会显示空的处方。</p><div class="mono xs muted">${esc(d.err.message)}</div></div>`;
      foot = `<button class="btn" data-act="rxRetry" data-anno="${M}">重试</button>${S.inject.engineError ? '<div class="sm muted" style="text-align:center;margin-top:6px">原型提示：右侧关掉「引擎抛错」后再点重试</div>' : ''}`;
    } else if (ip) {
      const done = ip.exercises.reduce((n, e) => n + e.sets.filter((s) => s.type !== 'warmup').length, 0);
      body = `<div class="banner soft" style="margin-bottom:12px"><span>▶</span><div><b>有一次没做完的训练</b><span class="sm">${fmt.when(ip.startMs)} 开始 · 已记 ${done} 组。已记的组都还在。</span></div></div>
        <div class="card" data-anno="${I}"><b>这次训练的内容</b><span class="muted sm">（开始时已固化，不会再变）</span><div class="list">${ip.exercises.map((e, i) => `<div class="li" style="cursor:default"><span class="n tag dark">${i + 1}</span><div class="grow"><b>${esc(App.exName(e.exerciseId))}</b><div class="sm muted">${e.sets.filter((s) => s.type !== 'warmup').length} / ${e.plan.sets} 组</div></div></div>`).join('')}</div></div>`;
      foot = `<button class="btn" data-act="goSession" data-anno="${M}">继续训练</button>`;
    } else if (d.doneToday && !S.ui.practiceAgain && d.rx && d.rx.kind !== undefined) {
      const st = E.sessionStats(d.doneToday);
      const rec = [...d.rx.stats.values()].filter((h) => h.recovery != null && h.hoursLeft > 0).sort((a, b) => b.hoursLeft - a.hoursLeft);
      body = `${deloadBanner(d.dv, d.signal)}<div class="card" data-anno="${I}"><div class="big">今天已练完 ✓</div><div class="muted" style="margin:4px 0 10px">${fmt.time(d.doneToday.startMs)} 开始 · ${d.doneToday.durationMin} 分钟 · ${st.sets} 组 · 总负荷 ${fmt.n(st.load)} kg</div><button class="btn small ghost" data-act="goSummary" data-id="${d.doneToday.id}">查看本次总结</button></div>
        <div class="h2">各肌头还需几小时恢复</div><div class="card">${rec.length ? hoursList(rec, 6) : '<span class="muted">都已恢复。</span>'}</div>`;
      foot = `<button class="btn ghost" data-act="again" data-anno="${M}">再练一次</button><div class="sm muted" style="text-align:center;margin-top:6px">按最新历史重新算一份处方</div>`;
    } else if (d.rx.kind === 'rest') {
      const list = d.rx.blocked.filter((h) => h.hoursLeft > 0).sort((a, b) => a.hoursLeft - b.hoursLeft);
      body = `${deloadBanner(d.dv, d.signal)}<div class="card" data-anno="${I}"><div class="big">今天适合休息</div><p class="muted" style="margin:6px 0 0">练过的肌头都还在修复期，现在再练效果有限。下面是各肌头预计恢复的时间。</p></div>
        <div class="h2">预计恢复</div><div class="card">${hoursList(list, 8)}</div>`;
      foot = `<button class="btn ghost" data-act="tab" data-t="progress" data-anno="${M}">去看容量与恢复</button>`;
    } else if (d.rx.kind === 'pool-empty') {
      body = `${deloadBanner(d.dv, d.signal)}<div class="card" data-anno="${I}"><div class="big">当前器械下没有可排的动作</div><p class="muted" style="margin:6px 0 0">有肌头需要练，但你选的器械里没有可排的动作（或这些动作 7 天内已经练过）。到设置里加上你能用的器械，处方会立刻重算。</p></div>`;
      foot = `<button class="btn" data-act="tab" data-t="settings" data-anno="${M}">去设置里加器械</button>`;
    } else {
      const rx = d.rx, t = rx.totals, cold = S.history.length === 0;
      const changed = new Set(S.ui.changedIds || []);
      body = `${deloadBanner(d.dv, d.signal)}${changed.size ? '<div class="banner soft" style="margin-bottom:12px"><span>↻</span><div><b>处方已按新档案重算</b><span class="sm">变了的动作标了「有变化」。</span></div></div>' : ''}
        <div class="card" data-anno="${I}"><div class="sumline"><span class="big">今天练 ${t.heads.length} 块肌肉 · ${t.sets} 组</span></div>
        <div class="muted" style="margin-top:2px">${App.regionsText(t.regions)} · ${t.exercises} 个动作 · 约 ${S.profile.minutes} 分钟${d.dv.kind === 'week' ? ' · 减量周' : ''}</div>
        <div class="list" style="margin-top:6px">${rx.items.map((it, i) => rxRow(it, i, changed)).join('')}</div></div>
        <button class="li" data-act="goWhy" style="margin-top:8px"><span class="grow"><b>为什么是这些</b><span class="muted sm"> · 肌头恢复度与近 7 天组数</span></span><span>›</span></button>
        ${cold ? '<div class="sm muted" style="margin-top:6px">还没有训练记录，所以动作旁没有建议重量。练完第一次，下一次就会有。</div>' : ''}`;
      foot = `<button class="btn" data-act="startSession" data-anno="${M}">开始训练</button>`;
    }
    return { tab: true, html: `<div class="page">${top}<div class="body">${body}</div>${foot ? `<div class="footbar">${foot}</div>` : ''}</div>` };
  };
  function rxRow(it, i, changed) {
    const sg = it.suggestion, open = App.rxOpen && App.rxOpen.has(it.exerciseId);
    const w = sg.weightKg != null ? `<div class="w">${sg.weightKg > 0 ? fmt.kg(sg.weightKg) : '自重'}</div><div class="xs muted">目标 ${sg.repsPerSet[0]} 次</div>` : `<div class="first">首次：选一个能干净做完 ${sg.reason.first} 次的重量</div>`;
    return `<div class="rx"><div class="row" style="align-items:flex-start"><div class="n">${i + 1}</div><div class="grow"><b>${esc(it.name)}</b> ${changed.has(it.exerciseId) ? '<span class="tag dark">有变化</span>' : ''}${it.unilateral ? ' <span class="tag">单侧</span>' : ''}
      <div class="sm muted">${it.sets} × ${it.repRange.join('–')} · 休息 ${fmt.clock(it.restSec)} · ${esc(App.headsText(it.primaryHeads, 2))}</div></div><div>${w}</div></div>
      <div class="row sb sm" style="margin-top:4px"><button class="btn link" style="min-height:32px;font-size:13px" data-act="rxWhy" data-id="${it.exerciseId}">理由 ${open ? '⌃' : '⌄'}</button><button class="btn link" style="min-height:32px;font-size:13px" data-act="openEx" data-id="${it.exerciseId}">要领 ›</button></div>
      ${open ? `<div class="why">${esc(sg.reason.text)}</div>` : ''}</div>`;
  }
  App.rxOpen = new Set();
  Object.assign(App.act, {
    rxWhy(d) { const s = App.rxOpen; s.has(d.id) ? s.delete(d.id) : s.add(d.id); App.refresh(); },
    rxRetry() { App.refresh(); if (App.S.inject.engineError) App.toast('还是失败了：引擎仍在报错'); },
    openEx(d) { App.go('/exercise/' + d.id); },
    goWhy() { App.go('/today/why'); },
    goSession() { App.go('/session'); },
    goSummary(d) { App.go('/summary/' + d.id); },
    again() { App.S.ui.practiceAgain = true; App.save(); App.refresh(); },
    deloadOpen() { App.openSheet('deload'); },
    deloadAdopt() {
      App.S.deload = { status: 'adopted', atMs: Date.now() }; App.S.ui.changedIds = [];
      if (!App.save()) App.toast('没有保存成功，请重试');
      App.ov.sheet = null; App.refresh(); App.toast('已采纳：减量周 · 还剩 6 天');
    },
    deloadDismiss() {
      App.S.deload = { status: 'dismissed', atMs: Date.now() };
      if (!App.save()) App.toast('没有保存成功，请重试');
      App.ov.sheet = null; App.refresh(); App.toast('好的，6 天内不再提示');
    },
  });
  App.sheets.deload = () => {
    const d = App.derive();
    return `<h2>建议本周减量</h2><p class="muted" style="margin:0 0 10px">这几个动作的预估 1RM 连续两次下降，每次降幅都超过 1%：</p>
      <div class="card">${d.signal.hits.map((h) => `<div class="row sb" style="padding:6px 0"><b>${esc(h.name)}</b><span class="mono sm">${h.series.join(' → ')} kg <span class="muted">（−${h.dropPct}%）</span></span></div>`).join('')}</div>
      <p class="sm muted" style="margin:10px 0 14px">采纳后：容量 ×0.5、强度 ×0.9，持续 6 天，今日处方立即按减量重算。</p>
      <div class="stack"><button class="btn" data-act="deloadAdopt">采纳</button><button class="btn ghost" data-act="deloadDismiss">这次不减</button></div>
      <div class="sm muted" style="text-align:center;margin-top:8px">「这次不减」：6 天内不再提示。直接关闭面板的话，建议会继续显示。</div>`;
  };
  App.onSheetClose = (s) => { if (s.type === 'deload') App.toast('减量建议会继续显示在今日顶部'); };

  // ================================================================== P02 处方依据
  App.pages.P02 = ({ S }) => {
    const top = `<div class="topbar">${App.backBtn()}<h1>为什么是这些</h1></div>`;
    const d = App.derive();
    if (!d.rx) return { html: `<div class="page">${top}<div class="body"><div class="err">处方没有算出来，这里没有可显示的依据。</div></div></div>` };
    if (S.history.length === 0)
      return { html: `<div class="page">${top}<div class="body"><div class="card" data-anno="${I}"><h3 style="margin:0 0 6px">首次记录</h3><p class="muted" style="margin:0">还没有训练历史，这份处方没有依据可以展开。练完第一次训练后，这里会列出每个肌头的恢复度、近 7 天组数，以及每个动作的建议理由。</p></div></div></div>` };
    const rx = d.rx;
    const deload = d.dv.kind === 'week' ? `<div class="banner soft" style="margin-bottom:12px"><span>↘</span><div><b>减量周：强度 ×0.9</b><span class="sm">容量 ×0.5，还剩 ${d.dv.daysLeft} 天。</span></div></div>` : '';
    if (rx.kind !== 'plan') {
      const list = rx.blocked.filter((h) => h.hoursLeft > 0).sort((a, b) => a.hoursLeft - b.hoursLeft);
      return { html: `<div class="page">${top}<div class="body">${deload}<div class="card" data-anno="${I}"><h3 style="margin:0 0 6px">${rx.kind === 'rest' ? '为什么今天没有处方' : '为什么排不出动作'}</h3><p class="muted" style="margin:0">${rx.kind === 'rest' ? '可以练的肌头都还在修复期（恢复度低于 50%），或者近 7 天已经练到最大可恢复量。' : '有肌头需要练，但当前器械里没有可排的动作，或这些动作 7 天内已经练过。'}</p></div><div class="h2">还没恢复的肌头</div><div class="card">${hoursList(list, 10)}</div></div></div>` };
    }
    const picked = rx.totals.heads.map((id) => rx.stats.get(id)).filter(Boolean);
    const headRow = (st) => {
      const why = st.sets7d < st.mev ? `近 7 天只有 ${fmt.r1(st.sets7d)} 组，低于最低有效量 ${st.mev}` : st.phase === 'golden' ? '恢复已过窗口，正处在黄金窗' : st.recovery == null ? '还没练过' : st.sets7d < st.mav ? `近 7 天 ${fmt.r1(st.sets7d)} 组，离适宜量 ${st.mav} 还有空间` : '恢复完成';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row sb"><b>${esc(st.name)}</b><span class="sm">${st.recovery != null ? `恢复度 ${fmt.pct(st.recovery)} ` : ''}${phaseTag(st)}</span></div>
        ${App.volBar(st)}<div class="sm muted" style="margin-top:-6px">${esc(why)} · 近 7 天 ${fmt.r1(st.sets7d)} 组</div></div>`;
    };
    const notReady = [...rx.stats.values()].filter((h) => h.exerciseCount > 0 && h.recovery != null && h.hoursLeft > 0 && !rx.totals.heads.includes(h.id)).sort((a, b) => a.hoursLeft - b.hoursLeft).slice(0, 6);
    return { html: `<div class="page">${top}<div class="body">${deload}
      <div class="h2" style="margin-top:6px">今日 · 为什么是这几块肌肉</div><div class="card" data-anno="${I}">${picked.map(headRow).join('')}</div>
      <div class="h2">还没恢复的肌头</div><div class="card">${notReady.length ? hoursList(notReady, 6) : '<span class="muted">其余肌头都已恢复。</span>'}</div>
      <div class="h2">每个动作的理由</div><div class="card">${rx.items.map((it) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(it.name)}</b><div class="sm muted">${esc(it.suggestion.reason.text)}</div></div>`).join('')}</div>
      <div class="sm muted" style="margin-top:12px">恢复窗口 = 肌群基础窗口（大 72 小时 / 中 48 / 小 24）× 训练量 × 力竭度 × 经验。近 7 天指滚动 7 天，不是自然周。</div></div></div>` };
  };
})();
