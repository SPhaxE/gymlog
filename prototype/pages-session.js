/* P03 训练 · P04 动作要领 · P05 训练结算（F2 主闭环） */
(function () {
  'use strict';
  const App = window.App, E = App.E, esc = App.esc, fmt = App.fmt;
  const A = '③ 导航', I = '① 第一优先信息', M = '② 主操作';
  const uid = () => Math.random().toString(36).slice(2, 8);
  const wd = (e) => e.sets.filter((s) => s.type !== 'warmup').length; // 计划组数只数工作组与递减组，热身组不算

  // ================================================================== 开始、暂停、结束
  Object.assign(App.act, {
    startSession(d, ev, el, silent) {
      const S = App.S, dv = App.derive();
      if (!dv.rx || dv.rx.kind !== 'plan') return;
      S.inProgress = {
        id: 's-' + Date.now().toString(36), startMs: Date.now(), current: 0, rest: null, restDone: false,
        exercises: dv.rx.items.map((it) => ({ exerciseId: it.exerciseId, skipped: false, sets: [], draft: null, plan: { sets: it.sets, repRange: it.repRange, restSec: it.restSec, suggestion: it.suggestion } })),
      }; // 处方固化：此后不再重算
      S.ui.practiceAgain = false; S.ui.changedIds = []; App.rxOpen.clear();
      if (!App.save()) App.toast('没有保存成功：杀掉应用后这次训练可能找不回来');
      if (!silent) App.go('/session', { reset: false });
    },
    pauseAsk() { App.dialog({ title: '暂停训练？', body: '已记的组都会保留，今日顶部会出现「继续训练」。', actions: [{ label: '继续记录', act: 'closeDialog' }, { label: '暂停并回到今日', act: 'pauseDo', primary: true }] }); },
    pauseDo() { App.closeDialog(); App.save(); App.go('/today', { replace: true, reset: true }); },
    finishAsk() {
      const ip = App.S.inProgress;
      const counted = ip.exercises.reduce((n, e) => n + e.sets.filter((s) => s.type !== 'warmup').length, 0);
      if (!counted) return App.dialog({ title: '没有可保存的记录', body: '还没有完成任何一组工作组。你可以继续训练，或者放弃这次训练。', actions: [{ label: '继续训练', act: 'closeDialog', primary: true }, { label: '放弃本次训练', act: 'abandon' }] });
      const undone = ip.exercises.filter((e) => !e.sets.some((s) => s.type !== 'warmup')).length;
      if (undone) return App.dialog({ title: `还有 ${undone} 个动作没做，仍然结束？`, body: '没做的动作会标为「未做」，不计入任何统计。', actions: [{ label: '继续训练', act: 'closeDialog' }, { label: '仍然结束', act: 'exertionOpen', primary: true }] });
      App.act.exertionOpen();
    },
    abandon() { App.S.inProgress = null; App.applyPending && App.applyPending(); App.save(); App.closeDialog(); App.go('/today', { replace: true, reset: true }); },
    exertionOpen() { App.ov.dialog = null; App.sheetErr = false; App.openSheet('exertion', { v: 8 }); },
    exertionSet(d) { App.ov.sheet.data.v = Number(d.v); App.sheetRedraw(); },
    finishSave(d) {
      const S = App.S, ip = S.inProgress, skip = d.skip === '1';
      const sess = {
        id: 's-' + uid(), startMs: ip.startMs, durationMin: Math.max(1, Math.round((Date.now() - ip.startMs) / 60e3)), exertion: skip ? null : App.ov.sheet.data.v,
        exercises: ip.exercises.map((e) => { const did = e.sets.some((s) => s.type !== 'warmup'); return { exerciseId: e.exerciseId, skipped: !did, sets: did ? e.sets.map(({ id, ...r }) => r) : [] }; }),
      };
      const prevHist = S.history;
      S.history = prevHist.concat(sess); S.inProgress = null; S.ui.practiceAgain = false;
      if (!App.save()) { S.history = prevHist; S.inProgress = ip; App.sheetErr = true; return App.sheetRedraw(); } // 保存失败：停留，数据不丢
      App.ov.sheet = null; App.keypad = null; App.editSet = null; App.applyPending && App.applyPending();
      App.go('/summary/' + sess.id, { replace: true, reset: true });
    },
  });
  App.sheets.exertion = (data) => `<h2>这次练到什么程度？</h2><p class="muted" style="margin:0 0 12px">力竭度 1–10：1 = 很轻松，10 = 完全力竭。用来估算各肌头要几小时恢复，可以跳过。</p>
    <div class="rng">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button class="${data.v === n ? 'on' : ''}" data-act="exertionSet" data-v="${n}">${n}</button>`).join('')}</div>
    ${App.sheetErr ? '<div class="err" style="margin-top:12px"><b>保存失败。</b>这次训练的数据还在，没有丢。可以再点一次保存。</div>' : ''}
    <div class="stack" style="margin-top:16px"><button class="btn" data-act="finishSave" data-skip="0">${App.sheetErr ? '重试保存' : '保存并查看结算'}</button><button class="btn ghost" data-act="finishSave" data-skip="1">跳过，直接保存</button></div>`;

  // ================================================================== P03 训练
  const bounds = {
    weight: { t: '重量要在 0–500 kg 之间', ok: (v) => v >= 0 && v <= 500 }, reps: { t: '次数要在 1–100 之间的整数', ok: (v) => Number.isInteger(v) && v >= 1 && v <= 100 },
    rpe: { t: 'RPE 要在 1–10 之间，步进 0.5', ok: (v) => v >= 1 && v <= 10 && Math.round(v * 2) === v * 2 },
  };
  const kind = (t) => (t === 'weightKg' ? 'weight' : t === 'rpe' ? 'rpe' : 'reps');
  const validBuf = (t, buf) => {
    if (t === 'rpe' && buf === '') return { ok: true, v: null };
    if (!/^\d*\.?\d*$/.test(buf) || buf === '' || buf === '.') return { ok: false, v: null, msg: buf === '' ? '还没填' : '请输入数字' };
    const v = Number(buf), b = bounds[kind(t)];
    return b.ok(v) ? { ok: true, v } : { ok: false, v, msg: b.t };
  };
  function ensureDraft(e) {
    if (e.draft) return e.draft;
    const idx = e.sets.length, sg = e.plan.suggestion, ex = App.env.ex.get(e.exerciseId);
    const last = [...e.sets].reverse().find((s) => s.type !== 'warmup');
    const weight = last ? last.weightKg : sg.weightKg;
    const reps = sg.repsPerSet[Math.min(idx, sg.repsPerSet.length - 1)] || e.plan.repRange[0];
    e.draft = { type: 'work', weightKg: weight, reps: ex.unilateral ? null : reps, repsLeft: ex.unilateral ? reps : null, repsRight: ex.unilateral ? reps : null, rpe: null };
    return e.draft;
  }
  const fieldVal = (src, t) => { const v = src[t]; return v == null ? '–' : t === 'weightKg' ? (v === 0 ? '自重' : fmt.r1(v)) : v; };
  function fields(src, e, scope) {
    const uni = App.env.ex.get(e.exerciseId).unilateral;
    const f = (t, label, unit) => {
      const on = App.keypad && App.keypad.scope === scope && App.keypad.target === t;
      const buf = on ? App.keypad.buf : null;
      const bad = on && !validBuf(t, buf).ok && buf !== '';
      return `<button class="field ${on ? 'on' : ''} ${bad ? 'bad' : ''}" data-act="fieldOpen" data-t="${t}" data-scope="${scope}"><small>${label}</small><b>${on ? esc(buf === '' ? '' : buf) || '&nbsp;' : fieldVal(src, t)}</b>${unit && !on && src[t] != null ? `<small style="display:inline;margin-left:3px">${unit}</small>` : ''}</button>`;
    };
    return `<div class="trio ${uni ? 'uni' : ''}">${f('weightKg', '重量', 'kg')}${uni ? f('repsLeft', '左 次数') + f('repsRight', '右 次数') : f('reps', '次数')}${f('rpe', 'RPE（选填）')}</div>`;
  }
  function keypad() {
    const k = App.keypad; if (!k) return '';
    const v = validBuf(k.target, k.buf);
    const step = k.target === 'weightKg' ? 2.5 : k.target === 'rpe' ? 0.5 : 1;
    return `${!v.ok && k.buf !== '' ? `<div class="err">${v.msg}</div>` : ''}<div class="keypad">${['7', '8', '9'].map((n) => `<button data-act="key" data-k="${n}">${n}</button>`).join('')}<button class="sp" data-act="key" data-k="del">⌫</button>
      ${['4', '5', '6'].map((n) => `<button data-act="key" data-k="${n}">${n}</button>`).join('')}<button class="sp" data-act="key" data-k="+">+${step}</button>
      ${['1', '2', '3'].map((n) => `<button data-act="key" data-k="${n}">${n}</button>`).join('')}<button class="sp" data-act="key" data-k="-">−${step}</button>
      <button data-act="key" data-k="0">0</button><button data-act="key" data-k=".">.</button><button class="ok" data-act="key" data-k="ok" style="grid-column:span 2;grid-row:auto" ${v.ok ? '' : 'disabled'}>确定</button></div>`;
  }
  const typeChips = (cur, scope) => `<div class="row" style="gap:6px;margin-bottom:8px">${['warmup', 'work', 'drop'].map((t) => `<button class="chip ${cur === t ? 'on' : ''}" data-act="setType" data-v="${t}" data-scope="${scope}">${App.TYPE_NAME[t]}</button>`).join('')}</div>`;

  App.pages.P03 = ({ S }) => {
    const ip = S.inProgress, exs = ip.exercises, cur = Math.min(ip.current, exs.length - 1);
    const allDone = exs.every((e) => wd(e) >= e.plan.sets);
    const cards = exs.map((e, i) => {
      const ex = App.env.ex.get(e.exerciseId), isCur = i === cur, done = wd(e) >= e.plan.sets;
      const status = done ? `✓ ${wd(e)} / ${e.plan.sets} 组` : isCur ? `进行中 · ${wd(e)} / ${e.plan.sets} 组` : e.sets.length ? `${wd(e)} / ${e.plan.sets} 组` : '未开始';
      let inner = '';
      if (isCur) {
        const sg = e.plan.suggestion;
        inner += `<div class="row sb sm" style="margin-bottom:6px"><span class="muted">目标 ${e.plan.sets} × ${e.plan.repRange.join('–')}${sg.weightKg != null ? ' · 建议 ' + (sg.weightKg > 0 ? fmt.kg(sg.weightKg) : '自重') : ' · 首次：自己选一个能干净做完的重量'}</span><button class="btn link" style="min-height:30px;font-size:13px" data-act="openEx" data-id="${e.exerciseId}">要领 ›</button></div>`;
        e.sets.forEach((s, si) => {
          const ed = App.editSet && App.editSet.ex === i && App.editSet.i === si;
          inner += ed ? `<div class="setrow edit" style="display:block"><div class="row sb" style="margin-bottom:6px"><b class="sm">改第 ${si + 1} 组</b><button class="btn link" style="min-height:28px;font-size:13px" data-act="setDelete" data-i="${si}">删除这一组</button></div>${typeChips(s.type, 'e' + si)}${fields(s, e, 'e' + si)}${App.keypad && App.keypad.scope === 'e' + si ? keypad() : ''}<button class="btn small" style="margin-top:8px;width:100%" data-act="setEditDone">完成修改</button></div>`
            : `<button class="setrow" data-act="setEdit" data-i="${si}"><span class="no">${si + 1}</span><span class="tag ${s.type === 'warmup' ? 'line' : s.type === 'drop' ? 'dark' : ''}">${App.TYPE_NAME[s.type].slice(0, 1)}</span><span class="grow mono">${fmt.sets(s)}</span><span class="sm muted">${s.rpe != null ? 'RPE ' + s.rpe : ''}</span><span class="muted">✎</span></button>`;
        });
        if (wd(e) < e.plan.sets && e.sets.length < 10) {
          const dr = ensureDraft(e);
          inner += `<div class="draft" data-anno="${I}"><div class="row sb" style="margin-bottom:6px"><b>第 ${e.sets.length + 1} 组 <span class="muted sm">· 计划 ${e.plan.sets} 组</span></b></div>${typeChips(dr.type, 'd')}${fields(dr, e, 'd')}${App.keypad && App.keypad.scope === 'd' ? keypad() : ''}</div>`;
        } else if (e.sets.length < 10) {
          inner += `<button class="btn small ghost" style="margin-top:8px;width:100%" data-act="setAdd">＋ 再加一组</button>`;
        } else inner += '<div class="sm muted" style="margin-top:6px">单个动作最多 10 组。</div>';
      }
      return `<div class="ex ${isCur ? 'cur' : ''}"><button class="ex-h" style="display:flex;align-items:center;gap:10px;padding:11px 12px;width:100%;background:none;border:0;text-align:left" data-act="exOpen" data-i="${i}"><span class="n tag ${done ? 'dark' : ''}">${i + 1}</span><span class="grow"><b>${esc(ex.name)}</b>${ex.unilateral ? ' <span class="tag">单侧</span>' : ''}<div class="xs muted">${esc(App.headsText(ex.primaryHeads, 2))}</div></span><span class="sm ${done ? '' : 'muted'}">${status}</span></button>${inner ? `<div class="exbody">${inner}</div>` : ''}</div>`;
    }).join('');
    // 底部主操作
    const e = exs[cur];
    let foot;
    if (allDone) foot = `<button class="btn" data-act="finishAsk" data-anno="${M}">完成训练</button><div class="sm muted" style="text-align:center;margin-top:6px">计划的组都做完了</div>`;
    else {
      const dr = ensureDraft(e), uni = App.env.ex.get(e.exerciseId).unilateral;
      const miss = dr.weightKg == null ? '先填重量' : (uni ? dr.repsLeft == null && dr.repsRight == null : dr.reps == null) ? '先填次数' : null;
      foot = `<button class="btn" data-act="setDone" data-anno="${M}" ${miss ? 'disabled' : ''}>完成这一组</button>${miss ? `<div class="sm" style="text-align:center;margin-top:6px">${miss}，才能完成这一组</div>` : ''}`;
    }
    const rest = ip.rest ? (() => {
      const left = Math.max(0, (ip.rest.endsAt - Date.now()) / 1000);
      return ip.restDone || left <= 0
        ? `<div class="rest done"><div class="row"><div class="grow"><b>休息结束</b><div class="sm">可以做下一组了</div></div><button data-act="restSkip">好</button></div></div>`
        : `<div class="rest"><div class="row"><div class="clock" data-rest-clock>${fmt.clock(Math.ceil(left))}</div><div class="grow sm">组间休息<br><span class="muted">${fmt.clock(ip.rest.totalSec)}</span></div><button data-act="restAdj" data-d="-15">−15</button><button data-act="restAdj" data-d="15">+15</button><button data-act="restSkip">跳过</button></div><div class="bar"><i data-rest-bar style="width:${Math.min(100, (100 * (ip.rest.totalSec - left)) / ip.rest.totalSec)}%"></i></div></div>`;
    })() : '';
    const err = App.saveErr ? `<div class="banner" style="margin-bottom:10px"><span>⚠</span><div><b>${esc(App.saveErr)}</b>数据还在这一页，没有丢。<button class="btn small" style="margin-top:8px" data-act="saveRetry">重试保存</button></div></div>` : '';
    return { html: `<div class="page"><div class="topbar" data-anno="${A}"><button class="iconbtn" data-act="pauseAsk" aria-label="暂停">❚❚</button><div class="grow" style="text-align:center"><b>动作 ${cur + 1} / ${exs.length}</b><span class="sub" data-elapsed>${Math.max(0, Math.round((Date.now() - ip.startMs) / 60e3))} 分钟</span></div><button class="btn link" style="width:auto;min-height:40px" data-act="finishAsk">完成训练</button></div>
      <div class="body">${err}${cards}<div style="height:${rest ? 70 : 8}px"></div></div>${rest}<div class="footbar">${foot}</div></div>` };
  };
  Object.assign(App.act, {
    exOpen(d) { const ip = App.S.inProgress; ip.current = Number(d.i); App.keypad = null; App.editSet = null; App.save(); App.refresh(); },
    fieldOpen(d) {
      const ip = App.S.inProgress, e = ip.exercises[ip.current];
      const src = d.scope === 'd' ? ensureDraft(e) : e.sets[Number(d.scope.slice(1))];
      const cur = src[d.t];
      App.keypad = { scope: d.scope, target: d.t, buf: cur == null ? '' : String(cur), fresh: true };
      App.refresh();
    },
    key(d) {
      const k = App.keypad; if (!k) return;
      const ip = App.S.inProgress, e = ip.exercises[ip.current];
      const src = k.scope === 'd' ? ensureDraft(e) : e.sets[Number(k.scope.slice(1))];
      const step = k.target === 'weightKg' ? 2.5 : k.target === 'rpe' ? 0.5 : 1;
      if (d.k === 'ok') { const v = validBuf(k.target, k.buf); if (!v.ok) return; src[k.target] = v.v; App.keypad = null; App.save(); return App.refresh(); }
      if (d.k === 'del') { k.buf = k.buf.slice(0, -1); k.fresh = false; }
      else if (d.k === '+' || d.k === '-') {
        const base = Number(k.buf) || (k.target === 'rpe' ? 7.5 : 0);
        const nv = Math.round((base + (d.k === '+' ? step : -step)) * 100) / 100;
        k.buf = String(Math.max(0, nv)); k.fresh = false;
      } else { if (k.fresh) { k.buf = ''; k.fresh = false; } if (d.k === '.' && k.buf.includes('.')) return; if (k.buf.length < 6) k.buf += d.k; }
      App.refresh();
    },
    setType(d) { const ip = App.S.inProgress, e = ip.exercises[ip.current]; const src = d.scope === 'd' ? ensureDraft(e) : e.sets[Number(d.scope.slice(1))]; src.type = d.v; App.save(); App.refresh(); },
    setDone() {
      const S = App.S, ip = S.inProgress, e = ip.exercises[ip.current], dr = ensureDraft(e), ex = App.env.ex.get(e.exerciseId);
      if (dr.weightKg == null) return;
      const set = { id: uid(), type: dr.type, weightKg: dr.weightKg, rpe: dr.rpe };
      if (ex.unilateral) { if (dr.repsLeft == null && dr.repsRight == null) return; set.repsLeft = dr.repsLeft; set.repsRight = dr.repsRight; }
      else { if (dr.reps == null) return; set.reps = dr.reps; }
      e.sets.push(set); e.draft = null; App.keypad = null;
      const planDone = wd(e) >= e.plan.sets;
      const othersDone = ip.exercises.every((o, i) => i === ip.current || wd(o) >= o.plan.sets);
      if (planDone && othersDone) { ip.rest = null; } // 最后一个动作的最后一组不休息
      else { ip.rest = { endsAt: Date.now() + e.plan.restSec * 1000, totalSec: e.plan.restSec }; ip.restDone = false; }
      if (planDone) { const nx = ip.exercises.findIndex((o, i) => i > ip.current && wd(o) < o.plan.sets); const any = nx >= 0 ? nx : ip.exercises.findIndex((o) => wd(o) < o.plan.sets); if (any >= 0) ip.current = any; }
      App.saveErr = App.save() ? null : '这一组没有保存成功';
      App.refresh();
    },
    saveRetry() { if (App.save()) { App.saveErr = null; App.toast('已保存'); } App.refresh(); },
    setEdit(d) { App.editSet = { ex: App.S.inProgress.current, i: Number(d.i) }; App.keypad = null; App.refresh(); },
    setEditDone() { App.editSet = null; App.keypad = null; App.saveErr = App.save() ? null : '改动没有保存成功'; App.refresh(); },
    setDelete(d) {
      const ip = App.S.inProgress, e = ip.exercises[ip.current]; e.sets.splice(Number(d.i), 1); App.editSet = null; App.keypad = null;
      App.saveErr = App.save() ? null : '改动没有保存成功'; App.refresh(); App.toast('已删除这一组');
    },
    setAdd() { const ip = App.S.inProgress, e = ip.exercises[ip.current]; if (e.sets.length < 10) e.plan.sets = wd(e) + 1; App.save(); App.refresh(); },
    restSkip() { const ip = App.S.inProgress; ip.rest = null; ip.restDone = false; App.save(); App.refresh(); },
    restAdj(d) { const ip = App.S.inProgress; if (!ip.rest) return; ip.rest.endsAt += Number(d.d) * 1000; ip.rest.totalSec = Math.max(15, ip.rest.totalSec + Number(d.d)); ip.restDone = ip.rest.endsAt <= Date.now(); App.save(); App.refresh(); },
  });

  // ================================================================== P04 动作要领
  App.mview = 'front';
  App.pages.P04 = ({ S, id }) => {
    const ex = App.env.ex.get(id);
    const top = `<div class="topbar">${App.backBtn()}<h1>${ex ? esc(ex.name) : '动作要领'}${ex ? `<span class="sub">${esc(ex.nameEn)} · ${esc(ex.equipment)}</span>` : ''}</h1></div>`;
    if (!ex) return { html: `<div class="page">${top}<div class="body"><div class="empty"><div class="ico">∅</div><h3>找不到这个动作</h3><button class="btn small" data-act="back">返回</button></div></div></div>` };
    const gender = S.profile ? S.profile.gender : 'male';
    const path = ex.media && ex.media[gender] && ex.media[gender][App.mview];
    let media;
    if (S.inject.mediaMissing || !path) media = `<div class="media" data-anno="${I}"><div class="ph"><b>暂无示范</b><div class="sm">这个动作没有对应素材，只有文字要领。<br>不会用相近动作的素材顶替。</div></div></div>`;
    else if (S.inject.mediaError) media = `<div class="media" data-anno="${I}"><div class="ph"><b>示范没有加载出来</b><div class="sm">先看下面的文字要领。</div><button class="btn small ghost" style="margin-top:8px" data-act="mediaRetry">重试</button></div></div>`;
    else media = `<div class="media" data-anno="${I}"><video src="${App.MEDIA_BASE}${path}" autoplay muted loop playsinline preload="metadata"></video></div>`;
    const ip = S.inProgress;
    const restNote = ip && ip.rest && !ip.restDone ? `<div class="banner soft" style="margin-bottom:10px;padding:6px 10px">组间休息还在走：<b class="mono" data-rest-clock>${fmt.clock(Math.ceil(Math.max(0, (ip.rest.endsAt - Date.now()) / 1000)))}</b></div>` : '';
    return { html: `<div class="page">${top}<div class="body">${restNote}${media}
      <div class="row" style="margin:10px 0"><div class="seg sm"><button class="${App.mview === 'front' ? 'on' : ''}" data-act="mview" data-v="front">正面</button><button class="${App.mview === 'side' ? 'on' : ''}" data-act="mview" data-v="side">侧面</button></div><span class="sm muted">按设置里的性别示意体型</span></div>
      <div class="card"><div style="font-size:17px;font-weight:700;margin-bottom:8px" data-anno="${I}">${esc(ex.cue.summary)}</div><ol style="margin:0;padding-left:20px" class="stack">${ex.cue.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
      <div class="h2">练到的肌头</div><div class="row" style="flex-wrap:wrap;gap:6px">${ex.primaryHeads.map((h) => `<span class="chip on">${esc(App.headName(h))}</span>`).join('')}${ex.secondaryHeads.map((h) => `<span class="chip">${esc(App.headName(h))}</span>`).join('')}</div><div class="xs muted" style="margin-top:4px">深色是主练，浅色是协同。</div>
      <div class="sm muted" style="margin-top:16px">示范素材来自 <a href="https://musclewiki.com" target="_blank" rel="noopener">MuscleWiki</a>。</div></div>
      <div class="footbar"><button class="btn ghost" data-act="goCurve" data-id="${ex.id}" data-anno="${M}">查看我的进步</button></div></div>`,
    mount: (root) => { const v = root.querySelector('video'); if (v) { v.addEventListener('error', () => { root.querySelector('.media').innerHTML = '<div class="ph"><b>示范没有加载出来</b><div class="sm">先看下面的文字要领。</div></div>'; }); v.play && v.play().catch(() => {}); } } };
  };
  Object.assign(App.act, {
    mview(d) { App.mview = d.v; App.refresh(); },
    mediaRetry() { App.toast('还是失败了：原型里「素材加载失败」开关还开着'); },
    goCurve(d) { App.go('/progress/exercises/' + d.id); },
  });

  // ================================================================== P05 训练结算
  App.pages.P05 = ({ S, id }) => {
    const sess = S.history.find((s) => s.id === id);
    if (!sess) return { html: `<div class="page"><div class="topbar root"><h1>训练结算</h1></div><div class="body"><div class="empty"><div class="ico">∅</div><h3>找不到这次训练</h3><p>它可能已被删除。</p></div></div><div class="footbar"><button class="btn" data-act="doneSummary" data-anno="${M}">完成</button></div></div>` };
    const sum = E.summarize(App.env, S.history, sess);
    const name = (r) => esc(App.exName(r.exerciseId));
    let head, sub = '';
    if (sum.first) { head = '首次记录，作为基线'; sub = '下一次训练开始，会拿这次来对比。'; }
    else if (sum.prs.length) { head = `<span class="pr" style="font-size:22px;gap:8px">${sum.prs.length} 项 PR</span>`; sub = sum.prs.map((r) => `${name(r)} 预估 1RM ${fmt.kg(r.e1rm)}${r.delta != null ? `（+${fmt.r1(r.delta)} kg）` : ''}`).join('<br>'); }
    else {
      const ups = sum.rows.filter((r) => !r.skipped && r.delta != null && r.delta > 0.05).length, downs = sum.rows.filter((r) => !r.skipped && r.delta != null && r.delta < -0.05).length;
      head = ups > downs ? `${ups} 个动作比上次更强` : ups === downs ? '和上次基本持平' : `${downs} 个动作比上次低`;
      sub = downs > ups ? '没有 PR。可能只是今天状态不好，下次处方会照常给。' : '这次没有创新高，但没有退步。';
    }
    const stats = E.headStats(App.env, S.history, S.profile, Date.now());
    const trained = [...E.sessionHeadSets(App.env, sess).keys()].map((h) => stats.get(h)).filter((h) => h && h.recovery != null);
    const slow = trained.sort((a, b) => b.hoursLeft - a.hoursLeft)[0];
    const row = (r) => {
      if (r.skipped) return `<div class="cmp" style="cursor:default"><div class="grow"><b class="muted">${name(r)}</b></div><span class="tag line">未做</span></div>`;
      const d = r.baseline ? '<span class="muted sm">首次记录</span>' : r.delta == null ? `<span class="sm">次数 ${r.repsDelta >= 0 ? '+' : ''}${r.repsDelta}</span>` : r.delta > 0.05 ? `▲ +${fmt.r1(r.delta)} kg` : r.delta < -0.05 ? `▼ −${fmt.r1(-r.delta)} kg` : '– 持平';
      return `<button class="cmp" data-act="goCurve" data-id="${r.exerciseId}"><div class="grow"><b>${name(r)}</b> ${r.isPR ? '<span class="pr">PR</span>' : ''}<div class="sm muted">${r.e1rm != null ? '预估 1RM ' + fmt.kg(r.e1rm) : '无预估 1RM'}</div></div><span class="delta">${d}</span><span class="muted">›</span></button>`;
    };
    return { html: `<div class="page"><div class="topbar root"><h1>训练结算<span class="sub">${fmt.date(sess.startMs)} · ${fmt.wd(sess.startMs)}</span></h1></div>
      <div class="body"><div class="card" data-anno="${I}"><div class="big" style="margin-bottom:4px">${head}</div><div class="muted">${sub}</div></div>
      <div class="kpis" style="margin-top:12px"><div class="kpi"><b class="mono">${sum.sets}</b><span>总组数</span></div><div class="kpi"><b class="mono">${fmt.n(sum.load)}</b><span>总负荷（kg）</span></div><div class="kpi"><b class="mono">${sess.durationMin}</b><span>时长（分钟）</span></div></div>
      <div class="h2">逐动作对比 <span class="muted">· 预估 1RM 对上次</span></div><div class="card">${sum.rows.map(row).join('')}</div>
      ${slow ? `<div class="sm muted" style="margin-top:12px">下一次：练到的肌头里，恢复最慢的是${esc(slow.name)}，${slow.hoursLeft > 0 ? '还需' + fmt.left(slow.hoursLeft) : '已经恢复'}。</div>` : ''}
      ${sess.exertion != null ? `<div class="sm muted" style="margin-top:4px">你自评的力竭度：${sess.exertion} / 10</div>` : ''}</div>
      <div class="footbar"><button class="btn" data-act="doneSummary" data-anno="${M}">完成</button></div></div>` };
  };
  App.act.doneSummary = () => App.go('/today', { replace: true, reset: true });
})();
