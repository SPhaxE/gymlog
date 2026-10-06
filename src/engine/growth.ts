/** 增长层引擎（阶段 5.5c，brief「增长与商业化层」§3–§4，ia §1.14–§1.15）。纯函数：一切都从训练历史重算，不存计数器——
 *  删掉一次训练，牛龄、连胜、牛劲都会跟着变（ia §1.14 边界）。只有用户主动做的事（兑换卡券、开通会员、采纳减量周）作为输入传进来。
 *
 *  双轨：
 *  - 牛龄 = 成长值，只因「变强」上涨：预估 1RM 创新高的相对增幅（按动作分量加权、每动作每周封顶）+ PR + 完成训练周期。
 *    5 段 × 3 小级 = 15 级，门槛由等级曲线模拟定（growth.sim.ts，2026-10-05 用户拍板：按百分比、小牛≈2 月 / 壮牛≈6 月 / 公牛≈12 月 / Milo≈24 月、一律从牛犊起步）。
 *  - 守约周连胜 = 粘性：一周（周一到周日）按处方练够次数，且没在某肌头恢复度 < 50% 时练它；减量周按计划完成也算；断档时有冻结卡自动用一张。
 *  牛劲：完成训练 / PR / 守约周 / 连胜里程碑 / 升级 / 周期完成，会员 ×1.5；兑换卡券时扣除。 */
import type { Env } from './env';
import { startOfDay } from './env';
import { DAY, entryE1rm } from './sets';
import { headStats, sessionHeadSets } from './stats';
import type { Exercise, Profile, Session } from './types';

export interface GrowthConfig {
  /** 每动作每周计入的相对增幅上限（%），防止新手期或换算噪声一次冲太多 */
  weeklyCapPct: number;
  /** 动作分量：大肌群复合 / 中（大肌群孤立、中肌群复合）/ 小（中小肌群孤立） */
  weight: { major: number; mid: number; minor: number };
  prPoints: number;
  cyclePoints: number;
  /** 两个周期之间至少几周正常训练 */
  cycleMinWeeks: number;
  /** 15 级的累计成长值门槛，levels[0] = 0（牛犊 1）…levels[14]（Milo 3） */
  levels: number[];
  /** 牛劲（brief §4） */
  niujin: { session: number; pr: number; week: number; level: number; stage: number; cycle: number; proRate: number; milestones: Record<number, number> };
  /** Pro 每月送的冻结卡 */
  proFreezePerMonth: number;
}

export const GROWTH_CONFIG: GrowthConfig = {
  weeklyCapPct: 3,
  weight: { major: 1, mid: 0.6, minor: 0.3 },
  prPoints: 2,
  cyclePoints: 12,
  cycleMinWeeks: 3,
  // 由 growth.sim.test.ts 的推导模式按目标节奏从「进阶用户」的模拟曲线反推、取整（见 brief §3）
  levels: [0, 10, 36, 52, 74, 104, 164, 212, 256, 302, 360, 412, 516, 612, 690],
  niujin: { session: 10, pr: 30, week: 50, level: 100, stage: 500, cycle: 200, proRate: 1.5, milestones: { 4: 100, 12: 300, 26: 600, 52: 1500 } },
  proFreezePerMonth: 2,
};

export const STAGES = ['newborn', 'young', 'sturdy', 'bull', 'milo'] as const;
export type Stage = (typeof STAGES)[number];

/** 用户主动做的事：兑换卡券（扣牛劲；冻结卡兑换会加卡） */
export interface WalletAction { atMs: number; kind: 'redeem'; label: string; cost: number; freeze?: number }
export interface GrowthInput {
  history: Session[];
  profile: Profile | null;
  now: number;
  /** 采纳减量周的时间（ms），每个代表一周减量 */
  deloads?: number[];
  wallet?: WalletAction[];
  /** 会员有效期 */
  pro?: { fromMs: number; toMs: number } | null;
  cfg?: GrowthConfig;
}

export type EventKind = 'stage' | 'pr' | 'streak' | 'level' | 'cycle' | 'week' | 'freeze';
export interface GrowthEvent {
  kind: EventKind;
  atMs: number;
  /** 触发它的那次训练（周结算类事件没有） */
  sessionId?: string;
  /** 本事件发的牛劲（已乘会员倍率） */
  niujin: number;
  /** stage / level：新等级；streak：连胜周数；pr：动作与新旧预估 1RM；cycle：第几个周期 */
  level?: number;
  weeks?: number;
  exerciseId?: string;
  exerciseName?: string;
  fromKg?: number;
  toKg?: number;
}
export interface LedgerRow { atMs: number; amount: number; label: string; pro: boolean }
export type WeekStatus = 'kept' | 'deload' | 'frozen' | 'missed' | 'open' | 'risk';
export interface WeekRecord { start: number; done: number; target: number; status: WeekStatus; violation: boolean; deload: boolean }
export interface NextLevel {
  /** 还差的成长值与本级进度 0–1 */
  need: number;
  progress: number;
  /** 可行动的说法：主项再涨多少 kg 预估 1RM、或再完成几个周期 */
  lift: { exerciseId: string; name: string; kg: number } | null;
  cycles: number;
}
export interface GrowthState {
  points: number;
  level: number;
  stage: Stage;
  sub: 1 | 2 | 3;
  next: NextLevel | null;
  streak: { weeks: number; best: number; freezeCards: number; current: WeekRecord | null; history: WeekRecord[] };
  niujin: { balance: number; ledger: LedgerRow[] };
  events: GrowthEvent[];
}

export const levelInfo = (level: number) => ({ stage: STAGES[Math.floor(level / 3)], sub: ((level % 3) + 1) as 1 | 2 | 3 });

/** 周一 0 点（本地时间） */
export function weekStart(ms: number): number {
  const d = new Date(startOfDay(ms));
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

/** 每周目标次数：新手 3 次；进阶、高阶单次 ≤ 45 分钟 4 次，否则 3 次（brief §3「次数由单次时长和经验推出」） */
export const weeklyTarget = (p: Profile | null) => (!p || p.experience === 'novice' ? 3 : p.minutes <= 45 ? 4 : 3);

/** 动作分量：大肌群复合 1 / 大肌群孤立或中肌群复合 0.6 / 其余 0.3 */
export function exerciseWeight(env: Env, ex: Exercise, cfg: GrowthConfig = GROWTH_CONFIG): number {
  const tiers = ex.primaryHeads.map((h) => env.heads.get(h)?.tier);
  const large = tiers.includes('large'), medium = tiers.includes('medium');
  if (ex.mechanic === 'compound' && large) return cfg.weight.major;
  if (large || (ex.mechanic === 'compound' && medium)) return cfg.weight.mid;
  return cfg.weight.minor;
}

const levelOf = (points: number, levels: number[]) => { let l = 0; while (l + 1 < levels.length && points >= levels[l + 1]) l++; return l; };

/** 第 i 次训练（history 按时间正序）练到了哪些恢复度 < 50% 的肌头（只看主要肌头；只看前 21 天的训练，够算恢复窗口）。
 *  守约周的「违规」就是这个；演示数据也用它检查自己（data/store.ts）。 */
export function blockedHeads(env: Env, history: Session[], i: number, profile: Profile | null): string[] {
  const s = history[i];
  const prior = history.slice(0, i).filter((h) => h.startMs > s.startMs - 21 * DAY);
  if (!prior.length) return [];
  const stats = headStats(env, prior, profile, s.startMs);
  return [...sessionHeadSets(env, s, true).keys()].filter((h) => {
    const r = stats.get(h)?.recovery;
    return r != null && r < env.cfg.readiness.block;
  });
}
const violates = (env: Env, history: Session[], i: number, profile: Profile | null) => blockedHeads(env, history, i, profile).length > 0;

/** 从历史算出完整的成长状态与事件时间线 */
export function growth(env: Env, input: GrowthInput): GrowthState {
  const cfg = input.cfg ?? GROWTH_CONFIG;
  const { profile, now } = input;
  const history = input.history.filter((s) => s.startMs <= now).sort((a, b) => a.startMs - b.startMs);
  const isPro = (ms: number) => !!input.pro && ms >= input.pro.fromMs && ms <= input.pro.toMs;
  const rate = (ms: number) => (isPro(ms) ? cfg.niujin.proRate : 1);
  const events: GrowthEvent[] = [];
  const ledger: LedgerRow[] = [];
  const earn = (atMs: number, amount: number, label: string) => { const v = Math.round(amount * rate(atMs)); ledger.push({ atMs, amount: v, label, pro: isPro(atMs) }); return v; };

  let points = 0, level = 0;
  const raise = (atMs: number, sessionId?: string) => {
    const l = levelOf(points, cfg.levels);
    for (let k = level + 1; k <= l; k++) {
      const stageUp = k % 3 === 0;
      const { stage, sub } = levelInfo(k);
      const label = stageUp ? `升段：${STAGE_LABEL[stage]}` : `升级：${STAGE_LABEL[stage]} ${sub} 级`;
      events.push({ kind: stageUp ? 'stage' : 'level', atMs, sessionId, level: k, niujin: earn(atMs, stageUp ? cfg.niujin.stage : cfg.niujin.level, label) });
    }
    level = Math.max(level, l);
  };

  // ---- 成长值：逐次训练 ----
  const best = new Map<string, number>();
  const weekGain = new Map<string, number>(); // `${周}|${动作}` → 本周已计入的 %
  const weekPR = new Set<string>();
  const sessionDays = new Set<number>();
  const target = weeklyTarget(profile);
  const deloadWeeks = new Set((input.deloads ?? []).map(weekStart));
  const violation = new Map<string, boolean>();

  // 周结算（守约周、周期）按时间穿插在训练之间：先把所有周列出来
  const firstWeek = history.length ? weekStart(history[0].startMs) : weekStart(now);
  const curWeek = weekStart(now);
  const weeks: number[] = [];
  for (let w = firstWeek; w <= curWeek; w = weekStart(w + 8 * DAY)) weeks.push(w);
  const weekEnd = (w: number) => weekStart(w + 8 * DAY) - 1;

  let si = 0, streak = 0, bestStreak = 0, freeze = 0, lastCycleWeekIdx = -1, cycles = 0, normalWeeksSinceCycle = 0;
  const weekRecords: WeekRecord[] = [];
  const grantedMonths = new Set<string>();
  const wallet = [...(input.wallet ?? [])].sort((a, b) => a.atMs - b.atMs);
  let wi = 0;
  const applyWallet = (until: number) => {
    while (wi < wallet.length && wallet[wi].atMs <= until) {
      const a = wallet[wi++];
      ledger.push({ atMs: a.atMs, amount: -a.cost, label: `兑换：${a.label}`, pro: false });
      freeze += a.freeze ?? 0;
    }
  };
  const grantPro = (atMs: number) => {
    if (!isPro(atMs)) return;
    const d = new Date(atMs), key = `${d.getFullYear()}-${d.getMonth()}`;
    if (grantedMonths.has(key)) return;
    grantedMonths.add(key); freeze += cfg.proFreezePerMonth;
  };

  for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
    const w = weeks[wIdx], end = weekEnd(w);
    let done = 0, viol = false;
    const days = new Set<number>();
    while (si < history.length && history[si].startMs <= end) {
      const s = history[si];
      applyWallet(s.startMs); grantPro(s.startMs);
      // 完成训练：一天只算一次
      const day = startOfDay(s.startMs);
      if (!sessionDays.has(day)) { sessionDays.add(day); earn(s.startMs, cfg.niujin.session, '完成训练'); }
      if (!days.has(day)) { days.add(day); done++; }
      const v = violates(env, history, si, profile);
      violation.set(s.id, v); if (v) viol = true;
      for (const entry of s.exercises) {
        const ex = env.ex.get(entry.exerciseId); const val = entryE1rm(entry);
        if (!ex || val == null) continue;
        const prev = best.get(ex.id);
        if (prev == null) { best.set(ex.id, val); continue; }
        if (val - prev < env.cfg.prMinKg) continue;
        best.set(ex.id, val);
        const wt = exerciseWeight(env, ex, cfg), key = `${w}|${ex.id}`;
        const used = weekGain.get(key) ?? 0;
        const pct = Math.min(((val / prev) - 1) * 100, cfg.weeklyCapPct - used);
        if (pct > 0) { weekGain.set(key, used + pct); points += pct * wt; }
        if (!weekPR.has(key)) {
          weekPR.add(key); points += cfg.prPoints;
          events.push({ kind: 'pr', atMs: s.startMs, sessionId: s.id, exerciseId: ex.id, exerciseName: ex.name, fromKg: Math.round(prev * 10) / 10, toKg: Math.round(val * 10) / 10,
            niujin: earn(s.startMs, cfg.niujin.pr, `PR：${ex.name}`) });
        }
      }
      raise(s.startMs, s.id);
      si++;
    }
    // ---- 周结算 ----
    const deload = deloadWeeks.has(w);
    const need = deload ? Math.max(1, target - 1) : target;
    const closed = end < now;
    let status: WeekStatus;
    if (!closed) {
      const left = Math.floor((end - now) / DAY) + 1; // 含今天，还剩几天
      status = done >= need && !viol ? (deload ? 'deload' : 'kept') : need - done > left ? 'risk' : 'open';
    } else if (done >= need && !viol) status = deload ? 'deload' : 'kept';
    else {
      applyWallet(end); grantPro(end);
      status = freeze > 0 ? 'frozen' : 'missed';
    }
    weekRecords.push({ start: w, done, target: need, status, violation: viol, deload });
    if (!closed) { if (status === 'kept' || status === 'deload') { streak++; } break; }
    applyWallet(end); grantPro(end);
    if (status === 'kept' || status === 'deload') {
      streak++;
      earn(end, cfg.niujin.week, deload ? '守约周（减量周）' : '守约周');
      events.push({ kind: 'week', atMs: end, weeks: streak, niujin: 0 });
      const bonus = cfg.niujin.milestones[streak];
      if (bonus) events.push({ kind: 'streak', atMs: end, weeks: streak, niujin: earn(end, bonus, `连胜 ${streak} 周`) });
    } else if (status === 'frozen') {
      freeze--; events.push({ kind: 'freeze', atMs: end, weeks: streak, niujin: 0 });
    } else streak = 0;
    bestStreak = Math.max(bestStreak, streak);
    // ---- 训练周期：按计划完成减量周，且距上个周期至少 cycleMinWeeks 周正常训练 ----
    if (deload && status === 'deload' && normalWeeksSinceCycle >= cfg.cycleMinWeeks && wIdx !== lastCycleWeekIdx) {
      cycles++; lastCycleWeekIdx = wIdx; normalWeeksSinceCycle = 0;
      points += cfg.cyclePoints;
      events.push({ kind: 'cycle', atMs: end, weeks: cycles, niujin: earn(end, cfg.niujin.cycle, `完成第 ${cycles} 个训练周期`) });
      raise(end);
    } else if (!deload && done > 0) normalWeeksSinceCycle++;
  }
  applyWallet(now); grantPro(now);
  bestStreak = Math.max(bestStreak, streak);
  points = Math.round(points * 10) / 10;
  level = levelOf(points, cfg.levels);

  // ---- 下一级：可行动的说法 ----
  let next: NextLevel | null = null;
  if (level + 1 < cfg.levels.length) {
    const lo = cfg.levels[level], hi = cfg.levels[level + 1], need = Math.max(0.1, hi - points);
    // 主项：近 8 周练得最多的大肌群复合动作
    const freq = new Map<string, number>();
    for (const s of history) if (s.startMs > now - 56 * DAY) for (const e of s.exercises) {
      const ex = env.ex.get(e.exerciseId);
      if (ex && exerciseWeight(env, ex, cfg) === cfg.weight.major && best.has(ex.id)) freq.set(ex.id, (freq.get(ex.id) ?? 0) + 1);
    }
    const main = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const lift = main ? { exerciseId: main, name: env.ex.get(main)!.name, kg: Math.max(0.5, Math.ceil(((best.get(main)! * need) / 100) * 2) / 2) } : null;
    next = { need: Math.round(need * 10) / 10, progress: Math.min(1, Math.max(0, (points - lo) / (hi - lo))), lift, cycles: Math.ceil(need / cfg.cyclePoints) };
  }
  ledger.sort((a, b) => a.atMs - b.atMs);
  const balance = ledger.reduce((s, r) => s + r.amount, 0);
  const cur = weekRecords.at(-1);
  const { stage, sub } = levelInfo(level);
  return {
    points, level, stage, sub, next,
    streak: { weeks: streak, best: bestStreak, freezeCards: freeze, current: cur && cur.start === curWeek ? cur : null, history: weekRecords },
    niujin: { balance, ledger },
    events: events.sort((a, b) => a.atMs - b.atMs),
  };
}

export const STAGE_LABEL: Record<Stage, string> = { newborn: '牛犊', young: '小牛', sturdy: '壮牛', bull: '公牛', milo: 'Milo' };

/** 奖励弹窗优先级（brief §4）：升段 > PR > 连胜里程碑 > 升小级 > 周期完成；守约周、冻结卡、降级只进消息 */
export const REWARD_PRIORITY: EventKind[] = ['stage', 'pr', 'streak', 'level', 'cycle'];

/** 某时刻之后新达成的奖励：只弹一个（优先级最高、同级取最早），其余进消息。训练进行中不调用它（ia §1.15） */
export function pickRewards(events: GrowthEvent[], sinceMs: number): { popup: GrowthEvent | null; messages: GrowthEvent[] } {
  const fresh = events.filter((e) => e.atMs > sinceMs);
  const popable = fresh.filter((e) => REWARD_PRIORITY.includes(e.kind))
    .sort((a, b) => REWARD_PRIORITY.indexOf(a.kind) - REWARD_PRIORITY.indexOf(b.kind) || a.atMs - b.atMs);
  const popup = popable[0] ?? null;
  return { popup, messages: fresh.filter((e) => e !== popup) };
}
