/** Playground 的示例数据：全部来自 TS 引擎在演示场景（mock/）上的实算值，不手填数字（mock/scenarios.json pageStates 指定了用哪几个动作）。 */
import type { DayProps, Point } from '../components';
import { DAY, exerciseRecords, mainRegions, prMap, sessionStats, startOfDay } from '../engine';
import type { HeadStat } from '../engine';
import { buildScenario } from '../engine/demo';
import exercisesJson from '../../mock/exercises.json';
import { bodyData, env, homeData, REGION_NAME } from '../data/demo';

const md = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}月${d.getDate()}日`; };
const WD = '日一二三四五六';

export function fixtures(now: number) {
  const { history } = buildScenario('plain-prescription', now);
  const home = homeData('plain-prescription', now);
  const body = bodyData('done-today', now);
  const items = home.rx.kind === 'plan' ? home.rx.items : [];

  const trend = (id: string): Point[] => exerciseRecords(env, history, id).filter((r) => r.e1rm != null)
    .map((r) => ({ t: r.session.startMs, v: r.e1rm!, pr: r.isPR, label: md(r.session.startMs) }));

  const prs = prMap(env, history);
  const sessions = [...history].sort((a, b) => b.startMs - a.startMs).slice(0, 4).map((s) => {
    const st = sessionStats(s), d = new Date(s.startMs);
    return {
      date: d.getDate(), weekday: WD[d.getDay()], title: mainRegions(env, s).map((r) => REGION_NAME[r]).join(' · '),
      meta: `${s.exercises.filter((e) => !e.skipped).length} 个动作 · ${st.sets} 组${s.durationMin ? ` · ${s.durationMin} 分钟` : ''}`, prs: prs.get(s.id)?.size ?? 0,
    };
  });

  const today = startOfDay(now), monday = today - ((new Date(now).getDay() + 6) % 7) * DAY;
  const week: DayProps[] = Array.from({ length: 7 }, (_, i) => {
    const t = monday + i * DAY, d = new Date(t);
    const done = history.filter((s) => s.startMs >= t && s.startMs < t + DAY);
    const status = t > today ? 'future' : done.length ? 'trained' : t === today ? 'today' : 'rest';
    return { weekday: WD[d.getDay()], day: d.getDate(), status, pr: done.some((s) => (prs.get(s.id)?.size ?? 0) > 0) };
  });

  // 点阵日历与近 8 周组数（E1 / E3）
  const trainedDays = new Set(history.map((x) => startOfDay(x.startMs)));
  const end = startOfDay(now) + DAY;
  const weekBars = Array.from({ length: 8 }, (_, i) => ({ label: i === 7 ? '本周' : `−${7 - i}`, value: 0, current: i === 7 }));
  for (const x of history) { const k = Math.floor((end - x.startMs) / (7 * DAY)); if (k >= 0 && k < 8) weekBars[7 - k].value += sessionStats(x).sets; }

  // 胶囊四档：从「今天已练完」场景里各挑一个真实肌头
  const heads = [...body.stats.values()];
  const pick = (f: (h: HeadStat) => boolean) => heads.find(f);
  const ok = pick((h) => h.level === 'ok') ?? heads[0];
  // 演示场景里没有某一档时，用达标那块肌头按引擎的分档规则推出来（只改组数与档位，地标不变）
  const derive = (sets7d: number, level: HeadStat['level']): HeadStat => ({ ...ok, sets7d, level });
  const tiers = {
    none: pick((h) => !(h.sets7d > 0)) ?? derive(0, 'none'),
    low: pick((h) => h.sets7d > 0 && h.level === 'low') ?? derive(Math.max(1, ok.mev - 2), 'low'),
    ok,
    over: pick((h) => h.level === 'over') ?? derive(ok.mrv + 2, 'over'),
  };

  // 示范素材只经动作的 media 字段引用（ia §1.4）
  type Media = { id: string; name: string; media?: { male?: { front?: string } }; cue?: { summary: string; steps: string[] } };
  const bench = (exercisesJson as Media[]).find((e) => e.id === 'barbell-bench-press-4')!;
  return {
    now, home, body, items, history, sessions, week, tiers, trainedDays, weekBars,
    trends: { normal: trend('barbell-bench-press-4'), falling: trend('barbell-squat-8'), two: trend('machine-face-pulls-22'), one: trend('dumbbell-bulgarian-split-squat-317') },
    media: { src: bench.media?.male?.front ?? null, name: bench.name, cue: bench.cue },
    step: env.cfg.loadStep,
  };
}
export type Fixtures = ReturnType<typeof fixtures>;
