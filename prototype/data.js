/* 慢牛 Milo · 原型的数据层：读取 mock/*.json，把 daysAgo 换算成真实时间，按场景构造状态。
 * 浏览器与 Node 通用（scripts/verify_prototype.js 用 Node 核对每个场景）。 */
(function (root) {
  'use strict';
  const E = root.MiloEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);
  const { HOUR, DAY } = E;
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /** daysAgo + startTime → 真实时间戳。今天的训练若落在「现在」之后，往前挪到刚结束 */
  function materialize(rawSessions, now) {
    return rawSessions.map((raw) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - raw.daysAgo);
      const [hh, mm] = raw.startTime.split(':').map(Number);
      let startMs = d.getTime() + hh * HOUR + mm * 60e3;
      const dur = raw.durationMin || 0;
      if (raw.daysAgo === 0 && startMs + dur * 60e3 > now - 5 * 60e3) startMs = now - dur * 60e3 - 5 * 60e3;
      const s = clone(raw);
      s.startMs = startMs;
      delete s.daysAgo; delete s.startTime;
      s.exercises.forEach((e) => e.sets.forEach((x) => { if (x.rpe === undefined) x.rpe = null; }));
      return s;
    }).sort((a, b) => a.startMs - b.startMs);
  }

  const profileFrom = (p) => ({ experience: p.experience, equipment: p.equipment.slice(), minutes: p.sessionMinutes, gender: p.sex });

  /** 把「进行中训练」的场景快照，补成一次完整的、可继续记组的训练 */
  function buildInProgress(env, history, profile, spec, now, deload) {
    const snap = materialize([{ ...spec.session, durationMin: 0 }], now)[0];
    snap.startMs = now - 40 * 60e3;
    const rx = E.prescribe(env, history, profile, { now, deload });
    const exercises = [];
    const mk = (exerciseId, sets) => {
      const ex = env.ex.get(exerciseId);
      const plan = E.planFor(ex, deload);
      return { exerciseId, skipped: false, plan: { ...plan, suggestion: E.suggest(env, history, ex, plan, deload) },
        sets: (sets || []).map((s, i) => ({ id: `${exerciseId}-${i}`, ...s })), draft: null };
    };
    for (const e of snap.exercises) exercises.push(mk(e.exerciseId, e.sets));
    for (const it of rx.items || []) if (!exercises.some((x) => x.exerciseId === it.exerciseId) && exercises.length < profile.exercisesPerDay + 2) exercises.push(mk(it.exerciseId, []));
    return {
      id: spec.session.id, startMs: snap.startMs, exercises, current: spec.currentExerciseIndex || 0,
      rest: spec.restEndsInSeconds ? { endsAt: now + spec.restEndsInSeconds * 1000, totalSec: 180 } : null, restDone: false,
    };
  }

  /** 按场景构造完整状态 */
  function buildState(raw, scenarioId, now, env) {
    const sc = raw.scenarios.scenarios.find((s) => s.id === scenarioId) || raw.scenarios.scenarios[0];
    let hist = clone(raw.history.sessions);
    const h = sc.history || {};
    if (h.replaceWith) hist = clone(h.replaceWith);
    if (h.remove) hist = hist.filter((s) => !h.remove.includes(s.id));
    if (h.append) hist = hist.concat(clone(h.append));
    const history = materialize(hist, now);
    let profile = null;
    if (sc.profile) {
      profile = profileFrom(raw.profile.profiles.find((p) => p.id === sc.profile));
      if (sc.profilePatch) Object.assign(profile, sc.profilePatch);
    }
    const state = {
      v: 1, scenarioId: sc.id, profile, history, inProgress: null, deload: { status: 'none', atMs: 0 },
      onboarding: { step: 1, experience: 'intermediate', equipment: raw.profile.equipmentCatalog.filter((e) => e.default).map((e) => e.id), minutes: 60 },
      pendingProfile: null,
      ui: { practiceAgain: false, changedIds: [], gender: null, filter: 'all', view: 'front', exited: false },
      inject: { storageFail: false, engineError: sc.inject === 'engine.throw', mediaMissing: false, mediaError: false, loading: false, reduceMotion: false },
    };
    const d = sc.appState && sc.appState.deload;
    if (d) {
      if (d.status === 'adopted') state.deload = { status: 'adopted', atMs: now - (6 - d.daysLeft) * DAY };
      if (d.status === 'dismissed') state.deload = { status: 'dismissed', atMs: now - (d.dismissedDaysAgo || 0) * DAY };
    }
    if (sc.inProgress && profile) {
      const b = E.budgetFor(profile.minutes);
      state.inProgress = buildInProgress(env, history, { ...profile, exercisesPerDay: b.exercisesPerDay }, sc.inProgress, now, state.deload.status === 'adopted');
    }
    return state;
  }

  async function loadRaw(base, fetchFn) {
    const get = async (f) => (await fetchFn(base + f)).json();
    const [exercises, muscles, history, profile, scenarios] = await Promise.all(
      ['exercises.json', 'muscles.json', 'history.json', 'profile.json', 'scenarios.json'].map(get));
    return { exercises, muscles, history, profile, scenarios };
  }

  root.MiloData = { materialize, buildState, loadRaw, profileFrom, clone };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MiloData;
})(typeof window !== 'undefined' ? window : globalThis);
