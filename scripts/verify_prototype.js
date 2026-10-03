#!/usr/bin/env node
/* 用原型的简化引擎跑一遍 mock/scenarios.json 的每个场景，核对它们触发的是预期状态。
 * 用法：node scripts/verify_prototype.js            （通过返回 0，有不符返回 1）
 *       node scripts/verify_prototype.js --verbose  （打印每个场景的处方摘要） */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const E = require(path.join(root, 'prototype/engine.js'));
const D = require(path.join(root, 'prototype/data.js'));
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'mock', f), 'utf8'));
const raw = {
  exercises: read('exercises.json'), muscles: read('muscles.json'), history: read('history.json'),
  profile: read('profile.json'), scenarios: read('scenarios.json'),
};
const verbose = process.argv.includes('--verbose');
// 演示在「晚上 20:00」之后最有代表性（今天的训练不会被往前挪），但也要在任意时刻成立：用几个时间点都跑一遍
const NOWS = [new Date(), (() => { const d = new Date(); d.setHours(20, 30, 0, 0); return d; })(), (() => { const d = new Date(); d.setHours(7, 15, 0, 0); return d; })()].map((d) => d.getTime());

const expect = {
  'deload-suggested': (r) => r.rx.kind === 'plan' && r.dv.kind === 'suggest',
  'plain-prescription': (r) => r.rx.kind === 'plan' && r.dv.kind === 'none',
  'deload-adopted': (r) => r.rx.kind === 'plan' && r.dv.kind === 'week' && r.dv.daysLeft === 6 && r.rx.deload,
  'deload-dismissed': (r) => r.rx.kind === 'plan' && r.dv.kind === 'note',
  'rest-day': (r) => r.rx.kind === 'rest',
  'pool-exhausted': (r) => r.rx.kind === 'pool-empty',
  'done-today': (r) => r.todayDone === 1,
  'in-progress': (r) => !!r.state.inProgress && r.state.inProgress.exercises.length >= 2,
  'fresh-install': (r) => r.state.profile === null,
  'cold-start': (r) => r.rx.kind === 'plan' && r.rx.items.every((i) => i.suggestion.weightKg == null),
  'advanced-profile': (r) => r.rx.kind === 'plan' && r.rx.budget.setsPerDay === 21 && r.rx.budget.exercisesPerDay === 9,
  'engine-error': (r) => r.threw,
};

let failed = 0;
for (const now of NOWS) {
  const env = E.makeEnv(raw.exercises, raw.muscles, now);
  const label = new Date(now).toTimeString().slice(0, 5);
  for (const sc of raw.scenarios.scenarios) {
    const state = D.buildState(raw, sc.id, now, env);
    const r = { state, threw: false, rx: null, dv: null, todayDone: 0 };
    const today0 = new Date(now); today0.setHours(0, 0, 0, 0);
    r.todayDone = state.history.filter((s) => s.startMs >= today0.getTime()).length;
    if (state.profile) {
      try {
        const sig = E.deloadSignal(env, state.history);
        r.dv = E.deloadView(sig, state.deload, now);
        r.sig = sig;
        r.rx = E.prescribe(env, state.history, state.profile, {
          now, deload: r.dv.kind === 'week', inject: state.inject.engineError ? 'engine.throw' : null });
      } catch (e) { r.threw = true; }
    }
    const ok = expect[sc.id] ? !!expect[sc.id](r) : false;
    if (!ok) failed++;
    if (verbose || !ok) {
      const items = r.rx && r.rx.items ? r.rx.items.map((i) => `${i.name} ${i.sets}×${i.repRange.join('–')}${i.suggestion.weightKg != null ? ' @' + i.suggestion.weightKg : ''}`) : [];
      console.log(`${ok ? '✓' : '✗'} [${label}] ${sc.id.padEnd(18)} rx=${r.rx ? r.rx.kind : '-'} deload=${r.dv ? r.dv.kind : '-'} today=${r.todayDone}`);
      if (verbose) {
        if (items.length) console.log('    ' + items.join(' | '));
        if (r.rx && r.rx.kind === 'rest') console.log('    blocked:', r.rx.blocked.slice(0, 5).map((h) => `${h.name}${Math.round(h.hoursLeft)}h`).join(' '));
        if (r.sig && r.sig.hits.length) console.log('    signal:', r.sig.hits.map((h) => `${h.name} ${h.series.join('→')}`).join('；'));
      }
    }
  }
}
// 额外：默认场景的 P06 数据（6 个肌头从未练过）与 P05 的 PR 口径
{
  const now = NOWS[1];
  const env = E.makeEnv(raw.exercises, raw.muscles, now);
  const st = D.buildState(raw, 'deload-suggested', now, env);
  const stats = E.headStats(env, st.history, st.profile, now);
  const untrained = [...stats.values()].filter((h) => h.phase === 'untrained').map((h) => h.name);
  console.log(`P06 从未练过 ${untrained.length} 个：${untrained.join('、')}`);
  const pm = E.prMap(st.history);
  const prSessions = [...pm.values()].filter((s) => s.size).length;
  const sum = E.summarize(env, st.history, st.history.find((s) => s.id === 'demo-w0-push'));
  console.log(`PR 会话 ${prSessions}/${st.history.length}；demo-w0-push PR：${sum.prs.map((r) => r.exerciseId).join(',')}`);
  if (sum.prs.length !== 4) { console.log('✗ demo-w0-push 的 PR 数不是 4'); failed++; }
  const base = E.summarize(env, st.history, st.history[0]);
  if (!base.first) { console.log('✗ 首次训练没有被识别为基线'); failed++; }
  const sq = E.exerciseRecords(st.history, 'barbell-squat-8').length;
  const bg = E.exerciseRecords(st.history, 'dumbbell-bulgarian-split-squat-317').length;
  const fp = E.exerciseRecords(st.history, 'machine-face-pulls-22').length;
  console.log(`记录数：深蹲 ${sq}、保加利亚分腿蹲 ${bg}、面拉 ${fp}`);
  if (bg !== 1 || fp !== 2) { console.log('✗ 新动作/2 次记录的动作数量不对'); failed++; }
}
console.log(failed ? `\n${failed} 项不符` : '\n全部场景符合预期');
process.exit(failed ? 1 : 0);
