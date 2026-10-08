/** 动作要领（P04，ia §1.4，路由 /exercise/:id；线框 ?board=p04 W3，Stitch e6 p04-v2 版式 + v3 的大号步骤编号）。
 *  五层：
 *  - 战略：练到一半不确定动作做没做对，3 秒内看到示范和要点，看完回去接着打卡（T5）；从找动作进来时，看完决定加不加到今天（T19）。
 *  - 范围：示范视频（正 / 侧，按档案体型）· 一句话要点 + 3 步 · 练到的肌头 · 我的进步入口；无示范 / 加载失败只留文字，不拿相近动作顶替；MuscleWiki 署名。
 *  - 结构：子页，无导航；入口 训练中主角卡「要领」· 首页主角卡「要领」· 找动作的结果行 · 进步曲线页；返回来源页（找动作面板原样还在）；训练中顶部保留一行休息。
 *  - 框架：第一优先 = 示范 + 一句话要点（抽屉常态就在拇指区）；没有主操作——从找动作进来时「加到今天」是唯一主操作（抽屉底部，荧光）；返回在左上，系统返回键是主路径。
 *  - 表现：视频是 16:9 实拍，铺满会糊、会裁掉杠铃 → 占上半屏、按 1:1 居中裁；要领抽屉 M05，展开出平涂人体（只亮练到的肌头，和找动作同一套）与预估 1RM 小曲线。 */
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { BodyPicker, Button, GuideDrawer, Icon, MediaFrame, Num, Screen, Segmented, Sparkline, Tag, TopBar, clock, useCountdown, useToast } from '../components';
import { env, homeData, fmt } from '../data/demo';
import { FAMILY_OF, addToToday, useExtras } from '../data/finder';
import { exerciseTrend } from '../data/gains';
import { guideOf } from '../data/guide';
import { useStore } from '../data/store';
import { useSource } from '../data/useSource';
import muscles from '../../mock/muscles.json';
import s from './ExerciseGuidePage.module.css';

const HEAD: Record<string, string> = Object.fromEntries(muscles.heads.map((h) => [h.id, h.name]));
const BACK_ONLY = new Set(['traps', 'lats', 'lowerback', 'glutes', 'hamstrings', 'triceps']);

export function ExerciseGuidePage({ scenario, now }: { scenario?: string; now: number }) {
  const { id = '' } = useParams();
  const nav = useNavigate(), loc = useLocation(), toast = useToast(), st = useStore();
  const q = new URLSearchParams(loc.search), from = q.get('from');
  const { src } = useSource(scenario, now);
  const ex = env.ex.get(id), g = guideOf(id, src.profile?.gender ?? 'male');
  const [view, setView] = useState<'front' | 'side'>('front');
  const [open, setOpen] = useState(false);
  const left = useCountdown(st.rest?.endAt ?? null);
  const trend = useMemo(() => (ex ? exerciseTrend(src, id, now) : null), [ex, src, id, now]);
  const extras = useExtras(scenario, now);
  const inToday = useMemo(() => {
    if (!scenario && st.active) return st.active.entries.some((e) => e.exerciseId === id);
    const rx = homeData(src, now).rx;
    return rx.items.some((it) => it.exerciseId === id) || extras.includes(id);
  }, [scenario, st.active, src, now, id, extras]);
  const back = () => (window.history.length > 1 ? nav(-1) : nav('/today' + loc.search));

  if (!ex || !g) return (
    <Screen label="动作要领">
      <TopBar title="找不到这个动作" onBack={back} />
      <p className={`milo-text-body ${s.missing}`}>这个动作不在动作库里了。</p>
    </Screen>
  );
  const side = ex.primaryHeads.every((h) => BACK_ONLY.has(FAMILY_OF[h] ?? '')) ? 'back' : 'front';
  const add = () => {
    const r = addToToday(id, scenario, src, now, homeData(src, now).rx.items.map((it) => it.exerciseId));
    toast.show(r === 'session' ? `已加到这次训练的最后：${ex.name}` : r === 'plan' ? `已加到今天：${ex.name}` : '已经在今天的训练里了');
    const n = new URLSearchParams(loc.search); ['from', 'find', 'sub', 'side', 'eq', 'own'].forEach((k) => n.delete(k));
    nav('/today' + (n.toString() ? `?${n}` : ''));
  };
  const steps = g.cue?.steps ?? [];
  return (
    <Screen label={`动作要领 · ${ex.name}`}>
      <div className={s.page}>
        <div className={s.video}><MediaFrame fill src={g.media[view]} label={`${ex.name} ${view === 'front' ? '正面' : '侧面'}示范`} /></div>
        <div className={s.top}>
          <TopBar title={ex.name} onBack={back} trailing={<Segmented label="示范角度" items={[['front', '正面'], ['side', '侧面']] as const} value={view} onChange={setView} />} />
          {/* 「在走」以剩余时间为准：休息结束就收起这一行（走查 1 #22） */}
          {st.rest && left > 0 && !scenario && <div className={s.rest} aria-live="polite"><Icon name="timer" small /><span className="milo-text-caption">组间休息还在走</span><Num size="s" value={clock(left)} /></div>}
        </div>
        <GuideDrawer open={open} onOpen={setOpen} cue={g.cue?.summary ?? '要领还没写好，先看示范'} steps={steps}
          more={(
            <>
              <section className={s.block} aria-label="练到的肌头">
                <h2 className="milo-text-label">练到的肌头</h2>
                <div className={s.heads}>
                  <div className={s.fig}><BodyPicker gender={src.profile?.gender ?? 'male'} view={side} height={200} groupOf={(h) => FAMILY_OF[h] ?? null} groupName={(x) => x}
                    lit={ex.primaryHeads} dim={ex.secondaryHeads} /></div>
                  <ul className={s.headList}>
                    {ex.primaryHeads.map((h) => <li key={h}><i className={s.on} /><span className="milo-text-body">{HEAD[h] ?? h}</span><span className="milo-text-caption">主练</span></li>)}
                    {ex.secondaryHeads.map((h) => <li key={h}><i /><span className="milo-text-body">{HEAD[h] ?? h}</span><span className="milo-text-caption">协同</span></li>)}
                  </ul>
                </div>
              </section>
              <section className={s.block} aria-label="我的进步">
                <h2 className="milo-text-label">我的进步</h2>
                {trend ? (
                  <button type="button" className={`milo-press milo-focus ${s.progress}`} onClick={() => nav(`/gains/${id}${loc.search ? `?${new URLSearchParams([...q].filter(([k]) => k === 'scenario' || k === 'now'))}` : ''}`)}>
                    <span><span className="milo-text-caption">预估 1RM · 近 {trend.sessions.length} 次</span><Num value={fmt(trend.sessions.at(-1)!.v)} unit="kg" /></span>
                    <Sparkline points={trend.sessions.map((x) => ({ t: x.t, v: x.v, label: x.label }))} label="预估 1RM 趋势" />
                    <Icon name="chevron" small />
                  </button>
                ) : <p className="milo-text-caption">还没练过这个动作：做完第一次就有曲线。</p>}
              </section>
            </>
          )}
          footer={from === 'finder' ? (inToday ? <p className={`milo-text-caption ${s.already}`}><Tag tone="outline">已在今天的训练里</Tag></p> : <Button onClick={add}>加到今天</Button>) : undefined} />
      </div>
    </Screen>
  );
}
