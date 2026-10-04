/** 首页高保真（线框 W2 + Stitch 第 2 轮 V2/V1）：第一个动作做主角；增量尺把「上次 → 这次」画在刻度上。
 *  开始训练是这一屏唯一的荧光；减量、恢复日、动作池不足占用主角卡上方的状态位（ia §1.2）。 */
import { useMemo } from 'react';
import type { RxItem } from '../engine';
import { dateLabel, env, fmt, homeData, REGION_NAME } from './data';
import { Nav, Screen } from './shared';
import s from './explore.module.css';

export function HomePage({ scenario, now }: { scenario: string; now: number }) {
  const d = useMemo(() => homeData(scenario, now), [scenario, now]);
  const { rx, dv } = d;
  const items = rx.kind === 'plan' ? rx.items : [];
  const [first, ...rest] = items;
  const regions = rx.kind === 'plan' ? rx.totals.regions.map((r) => REGION_NAME[r]).join(' · ') : '';
  return (
    <Screen label="首页">
      <header className={s.head}>
        <div className="milo-text-caption">{dateLabel(now)}</div>
        <div className={s.row}>
          <h1 className="milo-text-title-l">今日处方</h1>
          <div className={s.sp} />
          <a className={s.link} href="#why">为什么是这些</a>
        </div>
        {rx.kind === 'plan' && (
          <div className={s.tags}>
            <span>{rx.totals.exercises} 个动作</span><span>{rx.totals.sets} 组</span><span>{regions}</span>
          </div>
        )}
      </header>

      <div className={s.homeBody}>
        {dv.kind === 'suggest' && <div className={s.status}><b>建议本周减量</b><span>{d.hits} 个动作的预估 1RM 连降两次 · 点开看看</span></div>}
        {dv.kind === 'week' && <div className={s.status}><b>减量周 · 还剩 {dv.daysLeft} 天</b><span>组数减半、强度 ×0.9</span></div>}
        {dv.kind === 'note' && <div className={s.statusQuiet}>减量信号仍在 · 你选了这次不减（{dv.daysLeft} 天内不再提示）</div>}

        {rx.kind === 'rest' && <RestDay blocked={rx.blocked.slice(0, 6).map((h) => [h.name, Math.round(h.hoursLeft)] as [string, number])} />}
        {rx.kind === 'pool-empty' && <div className={s.status}><b>当前器械下没有可排的动作</b><span>去「我的」里加器械</span></div>}

        {first && <Hero it={first} last={d.lastWeight(first.exerciseId)} />}
        {rest.length > 0 && (
          <>
            <div className={s.sectionLabel}>接下来</div>
            <ul className={s.list}>
              {rest.map((it) => (
                <li key={it.exerciseId}>
                  <div>
                    <div className="milo-text-body-strong">{it.name}</div>
                    <div className="milo-text-caption">{REGION_NAME[it.region]} · {it.sets} × {it.repRange.join('–')}</div>
                  </div>
                  {it.suggestion.weightKg != null
                    ? <span className={s.kg}><b className="milo-text-number-m">{fmt(it.suggestion.weightKg)}</b><i>kg</i></span>
                    : <span className={s.firstTag}>首次</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {rx.kind === 'plan' && <div className={s.cta}><button type="button" className={s.primary}>开始训练</button></div>}
      <Nav selected="home" progress={rx.kind === 'plan' ? 0 : null} />
    </Screen>
  );
}

function Hero({ it, last }: { it: RxItem; last: number | null }) {
  const w = it.suggestion.weightKg;
  return (
    <section className={s.hero}>
      <div className="milo-text-caption">第 1 个 · {REGION_NAME[it.region]}</div>
      <div className="milo-text-heading">{it.name}</div>
      <div className={s.heroRow}>
        {w != null
          ? <span className={s.kg}><b className="milo-text-number-hero">{fmt(w)}</b><i>kg</i></span>
          : <span className="milo-text-title-l">首次</span>}
        <span className={s.sp} />
        <span className={s.target}><b className="milo-text-number-l">{it.sets} × {it.repRange.join('–')}</b><i>组 × 次</i></span>
      </div>
      <div className={s.reason}>{w != null ? it.suggestion.reason.text : `选一个能干净做完 ${it.repRange[0]} 次的重量`}</div>
      {w != null && last != null && w > 0 && <IncrementRuler last={last} next={w} step={env.cfg.loadStep} />}
    </section>
  );
}

/** 增量尺：刻度上同时标出上次和这次，中间那一段（就是「增量」）用骨白高亮 */
function IncrementRuler({ last, next, step }: { last: number; next: number; step: number }) {
  const lo = Math.floor((Math.min(last, next) - 4 * step) / step) * step, hi = Math.ceil((Math.max(last, next) + 4 * step) / step) * step;
  const n = Math.round((hi - lo) / step), x = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const a = Math.min(last, next), b = Math.max(last, next), diff = next - last;
  return (
    <div className={s.inc} aria-label={`上次 ${fmt(last)} kg，这次 ${fmt(next)} kg`}>
      <div className={s.incTicks}>{Array.from({ length: n + 1 }, (_, i) => <i key={i} className={i % 2 ? undefined : s.major} />)}</div>
      <div className={s.incSpan} style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }} />
      <div className={s.incMark} style={{ left: x(last) }}><span>上次 {fmt(last)}</span></div>
      <div className={`${s.incMark} ${s.incNext}`} style={{ left: x(next) }}><span>{diff > 0 ? '+' : diff < 0 ? '−' : '±'}{fmt(Math.abs(diff))} kg</span></div>
    </div>
  );
}

function RestDay({ blocked }: { blocked: [string, number][] }) {
  return (
    <section className={s.hero}>
      <div className="milo-text-caption">今天</div>
      <div className="milo-text-title-m">恢复日</div>
      <div className={s.reason}>候选肌头都还在修复期，今天适合休息。离恢复还需要：</div>
      <ul className={s.restList}>{blocked.map(([n, h]) => <li key={n}><span>{n}</span><b className="milo-text-number-s">{h}</b><i>小时</i></li>)}</ul>
    </section>
  );
}
