/* 慢牛 Milo · 低保真原型用的简化引擎
 *
 * 只为原型服务：规则取自 docs/ia.md §1.2、§1.7、§1.10 与 brief 口径表，数字与 V1 引擎对齐；
 * 阶段 5 会用 TypeScript 重写并配 ≥ 40 项测试，这里的代码不会被复用。
 * 纯函数，不碰 DOM，浏览器和 Node 都能加载（scripts/verify_prototype.js 用 Node 跑场景核对）。
 */
(function (root) {
  'use strict';

  const HOUR = 3600e3;
  const DAY = 24 * HOUR;
  const REGION_ORDER = ['lower', 'back', 'chest', 'shoulders', 'arms', 'core'];
  const LOAD_STEP = 2.5;
  const MEV = 7, MAV = 13, MRV = 18; // 中肌群基准，再按肌群大小缩放
  const EQUIP_RANK = { barbell: 0, dumbbell: 1, machine: 2, cable: 3, smith: 4, bodyweight: 5 };
  const PHASE_NAME = { repair: '修复期', recovering: '恢复中', golden: '黄金窗', decayed: '已回落', untrained: '从未练过' };

  const halfUp = (x) => Math.floor(x + 0.5);
  const roundStep = (x, step = LOAD_STEP) => Math.round(x / step) * step;
  const r1 = (x) => Math.round(x * 10) / 10;

  // ------------------------------------------------------------------ 组与预估 1RM
  const isCounted = (s) => s.type !== 'warmup';
  /** 单侧动作取左右较大的一侧（用于 e1RM 与趋势） */
  function bestReps(s) {
    if (s.reps != null) return s.reps;
    const l = s.repsLeft, r = s.repsRight;
    if (l == null && r == null) return 0;
    return Math.max(l || 0, r || 0);
  }
  /** 总次数：只在这一个函数里算（ia §1.5）。单侧：左 + 右；只填一侧按 ×2 */
  function totalReps(s) {
    if (s.reps != null) return s.reps;
    const l = s.repsLeft, r = s.repsRight;
    if (l != null && r != null) return l + r;
    return 2 * (l != null ? l : (r || 0));
  }
  const setLoad = (s) => (s.weightKg || 0) * totalReps(s);

  function e1rm(w, reps) {
    if (!(w > 0) || !(reps >= 1) || reps >= 37) return null;
    const epley = w * (1 + reps / 30);
    const brzycki = (w * 36) / (37 - reps);
    return (epley + brzycki) / 2;
  }
  /** 一次训练里某动作的 e1RM = 所有工作组（含递减组）的最大值 */
  function entryE1rm(entry) {
    if (!entry || entry.skipped) return null;
    let best = null;
    for (const s of entry.sets) {
      if (!isCounted(s)) continue;
      const v = e1rm(s.weightKg, bestReps(s));
      if (v != null && (best == null || v > best)) best = v;
    }
    return best;
  }
  const countedSets = (entry) => (entry && !entry.skipped ? entry.sets.filter(isCounted) : []);

  // ------------------------------------------------------------------ 环境
  /** env = { ex: Map(id→动作), exList, heads: Map(id→肌头), tiers, now } */
  function makeEnv(exercises, muscles, now) {
    const ex = new Map(exercises.map((e) => [e.id, e]));
    const heads = new Map(muscles.heads.map((h) => [h.id, h]));
    return { ex, exList: exercises, heads, headList: muscles.heads, tiers: muscles.tiers, regions: muscles.regions, now };
  }
  const regionOfEx = (env, ex) => {
    const h = env.heads.get(ex.primaryHeads[0]);
    return h ? h.region : 'core';
  };
  function landmarks(env, head) {
    const k = env.tiers[head.tier].volumeScale;
    return { mev: halfUp(MEV * k), mav: halfUp(MAV * k), mrv: halfUp(MRV * k) };
  }

  // ------------------------------------------------------------------ 近 7 天容量与恢复
  /** 一次训练里各肌头的有效组数：主练 1，协同 0.5；跳过的动作、热身组不计 */
  const _sessHead = new WeakMap();
  function sessionHeadSets(env, session) {
    if (_sessHead.has(session)) return _sessHead.get(session);
    const m = new Map();
    for (const entry of session.exercises) {
      const ex = env.ex.get(entry.exerciseId);
      if (!ex || entry.skipped) continue;
      const n = countedSets(entry).length;
      if (!n) continue;
      for (const h of ex.primaryHeads) m.set(h, (m.get(h) || 0) + n);
      for (const h of ex.secondaryHeads) m.set(h, (m.get(h) || 0) + n * 0.5);
    }
    _sessHead.set(session, m);
    return m;
  }
  const expFactor = (exp) => (exp === 'novice' ? 1.15 : exp === 'advanced' ? 0.9 : 1.0);
  const exertionFactor = (x) => (x == null ? 1.0 : x <= 6 ? 0.85 : x <= 8 ? 1.0 : x <= 9 ? 1.15 : 1.3);
  const volumeFactor = (n) => (n <= 2 ? 0.85 : n <= 4 ? 1.0 : n <= 6 ? 1.15 : 1.3);
  const endMs = (s) => s.startMs + (s.durationMin || 0) * 60e3;

  function headStats(env, history, profile, now = env.now) {
    const out = new Map();
    const exp = profile ? profile.experience : 'intermediate';
    for (const head of env.headList) {
      const lm = landmarks(env, head);
      let sets7d = 0, last = null, lastSets = 0;
      for (const s of history) {
        const v = sessionHeadSets(env, s).get(head.id);
        if (!v) continue;
        if (s.startMs >= now - 7 * DAY && s.startMs <= now) sets7d += v;
        if (!last || endMs(s) > endMs(last)) { last = s; lastSets = v; }
      }
      const base = env.tiers[head.tier].baseWindowHours;
      let windowHours = null, hoursSince = null, ratio = null, recovery = null, phase = 'untrained', hoursLeft = 0;
      if (last) {
        windowHours = base * volumeFactor(lastSets) * exertionFactor(last.exertion) * expFactor(exp);
        hoursSince = Math.max(0, (now - endMs(last)) / HOUR);
        ratio = hoursSince / windowHours;
        recovery = Math.min(1, ratio);
        phase = ratio < 0.5 ? 'repair' : ratio < 1 ? 'recovering' : ratio < 2 ? 'golden' : 'decayed';
        hoursLeft = Math.max(0, windowHours - hoursSince);
      }
      const gap = Math.max(0, lm.mav - sets7d) / lm.mav + (sets7d < lm.mev ? 0.5 : 0);
      const phaseCoef = phase === 'golden' ? 1.25 : (recovery == null || recovery >= 0.85) ? 1.0 : 0.6;
      const level = sets7d <= 0 ? 'none' : sets7d < lm.mev ? 'low' : sets7d <= lm.mrv ? 'ok' : 'over';
      out.set(head.id, {
        id: head.id, name: head.name, region: head.region, tier: head.tier, exerciseCount: head.exerciseCount,
        sets7d, ...lm, lastSession: last, lastEndMs: last ? endMs(last) : null, lastSets,
        windowHours, hoursSince, ratio, recovery, phase, hoursLeft, gap, phaseCoef,
        priority: phaseCoef * (0.4 + gap), level,
      });
    }
    return out;
  }

  // ------------------------------------------------------------------ 历史派生：记录、PR
  /** PR 门槛：预估 1RM 比此前最好成绩至少高 0.05 kg（界面显示到 0.1 kg，避免「标了 PR 却显示 +0.0」）。原型新增规则，阶段 5 复核。 */
  const PR_MIN = 0.05;
  /** 某动作的全部记录（时间正序）。每项带 e1RM 与是否 PR（第一次是基线，不算 PR） */
  function exerciseRecords(history, exId) {
    const recs = [];
    let best = -1;
    for (const s of history) {
      const entry = s.exercises.find((e) => e.exerciseId === exId && !e.skipped && countedSets(e).length);
      if (!entry) continue;
      const v = entryE1rm(entry);
      const first = recs.length === 0;
      const isPR = !first && v != null && v - best >= PR_MIN;
      if (v != null && v > best) best = v;
      recs.push({ session: s, entry, e1rm: v, isPR, baseline: first });
    }
    return recs;
  }
  /** 一遍扫完所有训练，得到 sessionId → 创 PR 的动作 id 集合（历史变化后重算） */
  function prMap(history) {
    const best = new Map();
    const seen = new Set();
    const out = new Map();
    for (const s of history) {
      const prs = new Set();
      for (const entry of s.exercises) {
        const v = entryE1rm(entry);
        if (v == null) continue;
        if (seen.has(entry.exerciseId) && v - (best.get(entry.exerciseId) ?? -1) >= PR_MIN) prs.add(entry.exerciseId);
        seen.add(entry.exerciseId);
        if (v > (best.get(entry.exerciseId) ?? -1)) best.set(entry.exerciseId, v);
      }
      out.set(s.id, prs);
    }
    return out;
  }
  const sessionStats = (session) => {
    let sets = 0, load = 0;
    for (const e of session.exercises) {
      if (e.skipped) continue;
      for (const s of countedSets(e)) { sets += 1; load += setLoad(s); }
    }
    return { sets, load };
  };
  /** 一次训练的主要肌群（按有效组数排序，最多 3 个） */
  function mainRegions(env, session) {
    const m = new Map();
    for (const [hid, v] of sessionHeadSets(env, session)) {
      const h = env.heads.get(hid);
      if (h) m.set(h.region, (m.get(h.region) || 0) + v);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => r);
  }

  // ------------------------------------------------------------------ 建议重量（双进阶）
  function planFor(ex, deload) {
    const compound = ex.mechanic === 'compound';
    let sets = compound ? 3 : 2;
    if (deload) sets = Math.max(1, halfUp(sets * 0.5));
    return { sets, repRange: compound ? [6, 8] : [10, 12], restSec: compound ? 180 : 120 };
  }

  function suggest(env, history, ex, plan, deload) {
    const [lower, upper] = plan.repRange;
    const recs = exerciseRecords(history, ex.id);
    const last = recs[recs.length - 1];
    const none = { weightKg: null, repsPerSet: Array(plan.sets).fill(lower), reason: { kind: 'first', text: '首次记录', first: upper } };
    if (!last) return none;
    const work = last.entry.sets.filter((s) => s.type === 'work');
    if (!work.length) return none;
    const reps = work.map(bestReps);
    const W = Math.max(...work.map((s) => s.weightKg || 0));
    const lastTxt = `${W > 0 ? r1(W) + ' kg × ' : ''}${reps.join('/')}`;
    const prev = recs[recs.length - 2];
    const trendDown = prev && last.e1rm != null && prev.e1rm != null && last.e1rm < prev.e1rm * 0.99;
    const isLowerBody = regionOfEx(env, ex) === 'lower';
    let weightKg = W, kind, text, repsPerSet;
    const allTop = reps.every((r) => r >= upper);
    const anyLow = reps.some((r) => r < lower);
    if (anyLow) {
      weightKg = W > 0 ? Math.min(W - LOAD_STEP, roundStep(W * 0.925)) : 0;
      kind = 'cut';
      text = `上次 ${reps.join('/')}，有一组掉到下限 ${lower} 次以下 → 减 7.5%`;
      repsPerSet = Array(plan.sets).fill(lower);
    } else if (allTop && !trendDown) {
      if (W > 0) {
        const raised = roundStep(W * (1 + (isLowerBody ? 0.05 : 0.025)));
        weightKg = Math.max(raised, W + LOAD_STEP);
        kind = 'add';
        text = `上次 ${reps.join('/')} 全部顶到 ${upper} 次上限 → +${r1(weightKg - W)} kg`;
      } else {
        kind = 'hold';
        text = `上次 ${reps.join('/')} 全部顶到 ${upper} 次上限，自重动作先多做 1 次`;
      }
      repsPerSet = Array(plan.sets).fill(W > 0 ? lower : upper + 1);
    } else {
      kind = 'hold';
      text = allTop && trendDown
        ? `上次 ${reps.join('/')} 已到上限，但预估 1RM 比前一次低 ${r1((1 - last.e1rm / prev.e1rm) * 100)}%，先不加重`
        : `上次 ${reps.join('/')}，还没全部做到 ${upper} 次 → 重量不变，每组多做 1 次`;
      repsPerSet = Array.from({ length: plan.sets }, (_, i) =>
        Math.max(lower, Math.min(upper, (reps[Math.min(i, reps.length - 1)] || lower) + 1)));
    }
    if (deload && weightKg > 0) {
      weightKg = Math.max(0, roundStep(weightKg * 0.9));
      text += '；减量周强度 ×0.9';
    }
    return { weightKg, repsPerSet, reason: { kind, text, last: lastTxt } };
  }

  // ------------------------------------------------------------------ 减量信号
  /** 至少 2 个动作的预估 1RM 连续两次下降（每次 > 1%） */
  function deloadSignal(env, history) {
    const ids = new Set();
    for (const s of history) for (const e of s.exercises) if (!e.skipped) ids.add(e.exerciseId);
    const hits = [];
    for (const id of ids) {
      const v = exerciseRecords(history, id).map((r) => r.e1rm).filter((x) => x != null);
      if (v.length < 3) continue;
      const [a, b, c] = v.slice(-3);
      if (b < a * 0.99 && c < b * 0.99) {
        const ex = env.ex.get(id);
        hits.push({ exerciseId: id, name: ex ? ex.name : id, series: [a, b, c].map(r1), dropPct: r1((1 - c / a) * 100) });
      }
    }
    return { active: hits.length >= 2, hits };
  }
  /** 把「信号 + 用户是否采纳 / 忽略」合成 P01 要显示的状态 */
  function deloadView(signal, deload, now) {
    const d = deload || { status: 'none' };
    if (d.status === 'adopted') {
      const left = Math.ceil(6 - (now - d.atMs) / DAY);
      if (left > 0) return { kind: 'week', daysLeft: left };
    }
    if (d.status === 'dismissed' && now - d.atMs < 6 * DAY) {
      return signal.active ? { kind: 'note', daysLeft: Math.ceil(6 - (now - d.atMs) / DAY) } : { kind: 'none' };
    }
    return signal.active ? { kind: 'suggest' } : { kind: 'none' };
  }

  // ------------------------------------------------------------------ 处方
  const budgetFor = (minutes) => {
    const setsPerDay = Math.round((minutes * 14) / 60);
    return { setsPerDay, exercisesPerDay: Math.max(3, Math.round(setsPerDay / 2.3)) };
  };

  function prescribe(env, history, profile, opts = {}) {
    const now = opts.now || env.now;
    if (opts.inject === 'engine.throw') throw new Error('engine.throw（测试注入）');
    const deload = !!opts.deload;
    const budget = budgetFor(profile.minutes);
    if (deload) budget.setsPerDay = Math.max(2, halfUp(budget.setsPerDay * 0.5));
    const stats = headStats(env, history, profile, now);
    const equip = new Set(profile.equipment);

    const cands = [...stats.values()].filter((h) => h.exerciseCount > 0 && h.sets7d < h.mrv && (h.recovery == null || h.recovery >= 0.5));
    const blocked = [...stats.values()]
      .filter((h) => h.exerciseCount > 0 && !cands.includes(h))
      .sort((a, b) => b.hoursLeft - a.hoursLeft);
    const base = { budget, stats, blocked, deload };
    if (!cands.length) return { kind: 'rest', items: [], ...base };

    // 同一动作 7 天内不重复。按日历日算：今天往前数 6 天（含今天）；这样结果不随一天里的钟点漂移
    const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
    const cutoff = d0.getTime() - 6 * DAY;
    const used7 = new Set();
    for (const s of history) if (s.startMs >= cutoff) for (const e of s.exercises) if (!e.skipped) used7.add(e.exerciseId);
    const pool = env.exList.filter((e) => equip.has(e.equipmentType) && !used7.has(e.id));
    // 做过的动作优先：有历史才能给建议重量、才谈得上渐进（原型新增的候选规则，待阶段 5 评审）
    const familiar = new Set();
    for (const s of history) for (const e of s.exercises) if (!e.skipped && countedSets(e).length) familiar.add(e.exerciseId);

    const virtual = new Map(cands.map((h) => [h.id, h.sets7d]));
    const chosen = [];
    const regionCount = new Map(), headCount = new Map();
    let setsLeft = budget.setsPerDay;
    const prio = (h) => {
      const v = virtual.get(h.id);
      const gap = Math.max(0, h.mav - v) / h.mav + (v < h.mev ? 0.5 : 0);
      return h.phaseCoef * (0.4 + gap);
    };
    const skipHead = new Set();
    let perHead = 1; // 先让每个肌头最多 1 个动作，排不满再放宽到 2（避免一天两个耸肩）
    for (let guard = 0; guard < 80 && chosen.length < budget.exercisesPerDay && setsLeft > 0; guard++) {
      const ranked = cands.filter((h) => !skipHead.has(h.id) && virtual.get(h.id) < h.mrv).sort((a, b) => prio(b) - prio(a) || REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
      let picked = null;
      for (const head of ranked) {
        if ((headCount.get(head.id) || 0) >= perHead || (regionCount.get(head.region) || 0) >= 2) { skipHead.add(head.id); continue; }
        const opts2 = pool
          .filter((e) => e.primaryHeads.includes(head.id) && !chosen.some((c) => c.ex.id === e.id))
          .filter((e) => planFor(e, deload).sets <= setsLeft)
          .sort((a, b) => (b.mechanic === 'compound') - (a.mechanic === 'compound')
            || (familiar.has(b.id) - familiar.has(a.id))
            || (EQUIP_RANK[a.equipmentType] - EQUIP_RANK[b.equipmentType]) || (a.id < b.id ? -1 : 1));
        if (opts2.length) { picked = { head, ex: opts2[0] }; break; }
        skipHead.add(head.id);
      }
      if (!picked) {
        if (perHead < 2) { perHead = 2; skipHead.clear(); continue; }
        break;
      }
      const { head, ex } = picked;
      const plan = planFor(ex, deload);
      chosen.push({ ex, plan, why: { head: head.id, priority: prio(head) } });
      setsLeft -= plan.sets;
      regionCount.set(head.region, (regionCount.get(head.region) || 0) + 1);
      for (const h of ex.primaryHeads) { headCount.set(h, (headCount.get(h) || 0) + 1); if (virtual.has(h)) virtual.set(h, virtual.get(h) + plan.sets); }
      for (const h of ex.secondaryHeads) if (virtual.has(h)) virtual.set(h, virtual.get(h) + plan.sets * 0.5);
    }
    if (!chosen.length) return { kind: 'pool-empty', items: [], cands, ...base };

    chosen.sort((a, b) => REGION_ORDER.indexOf(regionOfEx(env, a.ex)) - REGION_ORDER.indexOf(regionOfEx(env, b.ex))
      || (b.ex.mechanic === 'compound') - (a.ex.mechanic === 'compound'));
    const items = chosen.map(({ ex, plan, why }) => ({
      exerciseId: ex.id, name: ex.name, equipment: ex.equipment, mechanic: ex.mechanic, unilateral: ex.unilateral,
      region: regionOfEx(env, ex), primaryHeads: ex.primaryHeads, secondaryHeads: ex.secondaryHeads,
      sets: plan.sets, repRange: plan.repRange, restSec: plan.restSec, why,
      suggestion: suggest(env, history, ex, plan, deload),
    }));
    const regions = [...new Set(items.map((i) => i.region))];
    const heads = [...new Set(items.flatMap((i) => i.primaryHeads))];
    return {
      kind: 'plan', items, ...base, cands,
      totals: { sets: items.reduce((n, i) => n + i.sets, 0), exercises: items.length, regions, heads },
    };
  }

  // ------------------------------------------------------------------ 结算
  function summarize(env, history, session) {
    const idx = history.findIndex((s) => s.id === session.id);
    const before = idx >= 0 ? history.slice(0, idx) : history.filter((s) => s.startMs < session.startMs);
    const prs = prMap(history).get(session.id) || new Set();
    const { sets, load } = sessionStats(session);
    const rows = session.exercises.map((entry) => {
      if (entry.skipped || !countedSets(entry).length) return { exerciseId: entry.exerciseId, skipped: true };
      const cur = entryE1rm(entry);
      const prevRecs = exerciseRecords(before, entry.exerciseId);
      const prev = prevRecs[prevRecs.length - 1];
      const row = { exerciseId: entry.exerciseId, skipped: false, e1rm: cur, isPR: prs.has(entry.exerciseId), baseline: !prev };
      if (prev) {
        row.prevE1rm = prev.e1rm;
        row.delta = cur != null && prev.e1rm != null ? cur - prev.e1rm : null;
        const sum = (en) => countedSets(en).reduce((n, s) => n + totalReps(s), 0);
        row.repsDelta = sum(entry) - sum(prev.entry);
      }
      return row;
    });
    return { sets, load, rows, prs: rows.filter((r) => r.isPR), first: before.length === 0 };
  }

  root.MiloEngine = {
    HOUR, DAY, REGION_ORDER, PHASE_NAME, LOAD_STEP,
    makeEnv, landmarks, headStats, exerciseRecords, prMap, sessionStats, sessionHeadSets, mainRegions,
    planFor, suggest, deloadSignal, deloadView, budgetFor, prescribe, summarize,
    e1rm, entryE1rm, bestReps, totalReps, setLoad, countedSets, isCounted, endMs, regionOfEx, roundStep,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MiloEngine;
})(typeof window !== 'undefined' ? window : globalThis);
