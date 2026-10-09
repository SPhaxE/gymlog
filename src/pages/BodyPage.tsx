/** 容量页（P06，原「身体」，2026-10-06 用户改名）：MuscleWiki 半身（热成像，版式不变）在左，右侧胶囊列叠在上面。
 *  五层：
 *  - 战略：一眼看到每块肌肉近 7 天练了多少、哪块还在恢复；人体是读图的底，胶囊是读数的尺。
 *  - 范围：近 7 天合计 + 热力人体（正面 / 背面、男 / 女）+ 容量胶囊（长按放大、轻点看肌头详情）。
 *  - 结构：Tab 根页；肌头详情是浮在页面上的面板（FluidPanel），由被点的胶囊原地长出来（M02 流体胶囊形变，2026-10-09 走查 1 #29）。
 *  - 框架：页头（切换器在右）→ 合计与图例 → 舞台（人体 + 胶囊列；按住放大时才有一条引线）；没有主按钮。
 *  - 表现：半身人体（从左裁掉 ratio/figure-crop、左缘渐隐，高度撑满舞台）左缘贴页面边距、裁到刚好露出完整腹肌（2026-10-10 用户；窄屏再多裁一点，手不越过胶囊列）；
 *    常态胶囊缩小 1/3（少挡人体）、不画引线；放大的那颗背后泛光，确认放大后才从它折一条线到肌头；人体区左右滑 = 切正反面（往左背面、往右正面）。
 *  切换人体是「换卡」（2026-10-06 用户：所有更换都从左往右）：新卡从左边滑进来盖在上面，旧卡往右退、淡出；
 *  新卡量完锚点才滑进来，引线先收、到位后从人体往胶囊（左 → 右）重新描出。全程都在人体自己那一层里（figureClip 隔离层叠），
 *  引线和胶囊永远在两张卡之上。轻点人体上的肌肉 = 轻点那颗胶囊；人体与胶囊列的命中区左右分开，不重叠。
 *  页面可以竖向滚动：胶囊列至少保留每颗 capsule-rest-max-h 的高度，放不下就滚；胶囊列上竖向短滑也是滚动，按住才进放大镜。 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router';
import { BackToTop, Banner, BodyFigure, Button, CapsuleRail, FluidPanel, HeadWeeks, LandmarkRuler, Nav, Num, PageHeader, PhaseSegments, ProLink, Screen, Segmented, SheetBlock, Ticks, TierLegend, sharedTransition, type Anchors, type Tab } from '../components';
import { ago, bodyData, fmt, headWeeks, REGION_NAME } from '../data/demo';
import { deloadsOf } from '../data/me';
import { proStatus, usePro } from '../data/pro';
import { useStore } from '../data/store';
import { useTrainingNav } from '../data/useTrainingNav';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import { FAMILY_OF } from '../data/finder';
import { TipBanner } from './TipBanner';
import { useSource } from '../data/useSource';
import { FinderSheet, useFinderParam } from './FinderSheet';
import s from './BodyPage.module.css';
import { usePageNav } from '../shell/pageNav';

const TIER_NAME = { large: '大肌群', medium: '中肌群', small: '小肌群' } as const;
type View = 'front' | 'back';
type Gender = 'male' | 'female';
/** 一张人体卡：still 静止；wait 刚换上、量锚点中（透明、不变形）；in 从后面浮上来；out 被抽走 */
type Card = { key: number; view: View; gender: Gender; st: 'still' | 'wait' | 'in' | 'out' };
const noop = () => {};
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function BodyPage({ scenario, now, initialFocus, onTab }: { scenario?: string; now: number; initialFocus: string | null; onTab?: (tab: Tab, path: string) => void }) {
  const st = useStore();
  const topRef = useRef<HTMLDivElement>(null);
  const { src } = useSource(scenario, now);
  const finder = useFinderParam();
  const loc = useLocation();
  const pn = usePageNav();
  const [pro] = usePro(scenario);
  const proOn = proStatus(pro, now).kind !== 'free';
  const data = useMemo(() => bodyData(scenario ?? st, now), [scenario, st.history, st.profile, now]); // eslint-disable-line react-hooks/exhaustive-deps
  // 训练中切过来也看得到今日进度和休息（ia §1.12）
  const navState = useTrainingNav(scenario, data.trainedToday ? 1 : 0, now);
  const [cards, setCards] = useState<Card[]>(() => [{ key: 0, view: 'front', gender: data.gender, st: 'still' }]);
  const cur = cards[cards.length - 1], view = cur.view, gender = cur.gender;
  const [anchors, setAnchors] = useState<Anchors>({});
  const [mag, setMag] = useState<number | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [anchorY, setAnchorY] = useState<number | undefined>();
  // M02：正在长成详情 / 从详情缩回的那颗胶囊（只有它带共享名；转场放完撤掉）
  const [shared, setShared] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: T['size/screen-w'], h: T['size/screen-h'] / 2 });
  useEffect(() => {
    const el = stage.current!;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const onAnchors = useCallback((a: Anchors) => {
    setAnchors(a);
    setCards((cs) => cs.map((c, i) => (i === cs.length - 1 && c.st === 'wait' ? { ...c, st: 'in' } : c)));
  }, []);
  const ids = useMemo(() => Object.keys(anchors).filter((id) => data.stats.has(id)).sort((a, b) => anchors[a][1] - anchors[b][1] || anchors[a][0] - anchors[b][0]), [anchors, data]);
  // ?head=<肌头>：直接打开这块的详情面板（会员中心「高级分析」进来，6g 补）
  useEffect(() => { const id = new URLSearchParams(loc.search).get('head'); if (id && data.stats.has(id)) setSheet(id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // 截图 / 首次打开停在指定肌头被按住的状态，方便和设计稿对照
  useEffect(() => {
    if (initialFocus && ids.length && mag == null) { const i = ids.indexOf(initialFocus); if (i >= 0) setMag(i); }
  }, [ids, initialFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  // 舞台自己就在页面边距里（左右各留 size/gutter），坐标从舞台左缘算起
  const g = 0, contentW = box.w;
  // 胶囊列的最小高度：每颗都按静止上限排开（再矮就挤得看不清），屏幕放不下时页面滚动
  const railMin = ids.length ? ids.length * T['size/capsule-rest-max-h'] + (ids.length - 1) * T['size/capsule-gap'] : 0;
  const openSheet = useCallback((id: string) => {
    if (!data.stats.has(id)) return;
    setMag(null);
    setAnchorY(document.querySelector(`[role=option][data-id="${id}"]`)?.getBoundingClientRect().top);
    flushSync(() => setShared(id));              // 先让那颗胶囊带上共享名，再拍旧快照
    sharedTransition(() => setSheet(id));        // 新状态里名字在浮层上：胶囊原地长成浮层
  }, [data]);
  const k = data.kpi;
  const closeSheet = () => {
    sharedTransition(() => setSheet(null));      // 面板缩回那颗胶囊
    window.setTimeout(() => setShared(null), T['motion/spring-ms'] * 2);
  };
  const reset = () => { setMag(null); setSheet(null); setShared(null); };
  const swap = (next: Partial<Pick<Card, 'view' | 'gender'>>) => {
    reset();
    setCards((cs) => {
      const last = cs[cs.length - 1], rm = reducedMotion();
      const outs = rm ? [] : [...cs.slice(0, -1).filter((c) => c.st === 'out'), { ...last, st: 'out' as const }];
      return [...outs, { key: last.key + 1, view: next.view ?? last.view, gender: next.gender ?? last.gender, st: rm ? 'still' : 'wait' }];
    });
  };
  const settle = (key: number) => (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    setCards((cs) => cs.flatMap((c) => (c.key !== key ? [c] : c.st === 'out' ? [] : [{ ...c, st: 'still' as const }])));
  };
  const cardCls = { still: s.card, wait: s.cardWait, in: s.cardIn, out: s.cardOut };
  const railLeft = g + contentW * T['ratio/rail-start'];
  // 人体区左右滑切正反（走查 1 #12）：只认起点在胶囊列左边的手势；横向 ≥ space/3xl 且明显大于竖向才算，这一下的点按拦掉（不误开肌头详情）
  const swipe = useRef<{ x: number; y: number } | null>(null), swiped = useRef(false);
  const swipeDown = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    swipe.current = e.clientX - r.left < railLeft ? { x: e.clientX, y: e.clientY } : null;
    swiped.current = false;
  };
  const swipeUp = (e: React.PointerEvent) => {
    const st = swipe.current; swipe.current = null;
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (Math.abs(dx) < T['space/3xl'] || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    swiped.current = true;
    const next: View = dx < 0 ? 'back' : 'front';
    if (next !== view) swap({ view: next });
  };
  return (
    <Screen label="容量">
      <div ref={topRef} className={s.scroll}>
      <PageHeader title="容量" trailing={<>
        <Segmented label="视图" items={[['front', '正面'], ['back', '背面']]} value={view} onChange={(v) => v !== view && swap({ view: v })} />
        <Segmented label="体型示意" items={[['male', '男'], ['female', '女']]} value={gender} onChange={(v) => v !== gender && swap({ gender: v })} />
      </>}>
        <div className={s.kpi}>
          <span className="milo-text-caption">近 7 天</span>
          <Num value={fmt(k.load)} unit="kg" /><Num value={k.sets} unit="组" /><Num value={k.days} unit="天" />
        </div>
        <Ticks />
        <TipBanner page="body" src={src} scenario={scenario} now={now} />
        {k.sets === 0 && <Banner quiet detail="练完第一次训练后，这里会显示每块肌肉近 7 天的容量和恢复。" />}
        <TierLegend />
      </PageHeader>

      {/* 热成像观察窗：人体、胶囊、引线永远在深色里（浅色模式下是一块深色面板，BodyPage.module.css） */}
      <div ref={stage} className={s.stage} data-theme="dark" style={{ minHeight: railMin }} onPointerDown={swipeDown} onPointerUp={swipeUp} onPointerCancel={() => { swipe.current = null; }}
        onClickCapture={(e) => { if (swiped.current) { swiped.current = false; e.stopPropagation(); } }}>
        {/* 人体只在内容区里（左缘 = 页面边距），不越过组件最外层；卡宽到胶囊列起点为止 */}
        <div className={s.figureClip}>
          {cards.map((c) => {
            const live = c === cur;
            return (
              <div key={c.key} className={cardCls[c.st]} style={{ right: contentW * (1 - T['ratio/rail-start']) }} onAnimationEnd={settle(c.key)}>
                <BodyFigure gender={c.gender} view={c.view} stats={data.stats} focus={live ? (mag != null ? ids[Math.round(mag)] ?? null : sheet) : null}
                  height={box.h} width={box.w} fit={contentW * T['ratio/rail-start']} onAnchors={live ? onAnchors : noop} relativeTo={stage} onPick={live && c.st === 'still' ? openSheet : undefined} />
              </div>
            );
          })}
        </div>
        <CapsuleRail ids={ids} stats={data.stats} anchors={anchors} width={box.w} height={box.h}
          left={railLeft} right={g + contentW} mag={mag} onMag={setMag} onSelect={openSheet}
          leaders={cur.st === 'still'} sharedId={shared && sheet !== shared ? shared : undefined} />
      </div>
      </div>

      {sheet && <HeadSheet h={data.stats.get(sheet)!} shared={shared === sheet} anchorY={anchorY} onClose={closeSheet}
        weeks={headWeeks(src.history, sheet, now, src.deloads ?? deloadsOf(src.deload))} proActive={proOn} onPro={() => pn.push((proOn ? '/me/pro' : '/pro') + loc.search)}
        onFind={FAMILY_OF[sheet] ? () => { const id = sheet; setSheet(null); setShared(null); finder.open(FAMILY_OF[id], id); } : undefined} />}
      {finder.find && <FinderSheet src={src} caption="加的动作排在今天处方后面" onClose={finder.close} />}
      <Nav selected="body" {...navState} onSelect={onTab} />
      <BackToTop target={topRef} />
    </Screen>
  );
}

/** 肌头详情（线框 sheet W1：恢复在上、容量在下，阅读顺序同处方逻辑）；浮层由胶囊原地长出来（M02） */
function HeadSheet({ h, shared, anchorY, onClose, onFind, weeks, proActive, onPro }: { h: HeadStat; shared: boolean; anchorY?: number; onClose: () => void;
  /** 6e：找练这块的动作（打开找动作面板，选中这块肌肉、细分落在这个肌头） */ onFind?: () => void;
  /** 6g 补「高级分析 · 肌群容量趋势」：近 8 周每周组数（Pro 的权益，演示不拦截，块标题旁挂「Pro ›」） */ weeks: { value: number; deload: boolean }[]; proActive: boolean; onPro: () => void }) {
  return (
    <FluidPanel title={h.name} meta={`${REGION_NAME[h.region]} · ${TIER_NAME[h.tier]}`} onClose={onClose} sharedId={shared ? h.id : undefined} anchorY={anchorY}>
      <SheetBlock label="恢复">
        <div className={s.big}>
          <Num size="hero" value={h.recovery == null ? '—' : Math.round(h.recovery * 100)} unit="%" />
          <span className="milo-text-body">{h.recovery == null ? '从未练过' : h.hoursLeft > 0.5 ? `还需 ${Math.round(h.hoursLeft)} 小时` : '已恢复'}</span>
        </div>
        <PhaseSegments phase={h.phase} />
      </SheetBlock>
      <SheetBlock label="近 7 天容量">
        <Num size="xl" value={fmt(h.sets7d)} unit="组" />
        <LandmarkRuler value={h.sets7d} mev={h.mev} mav={h.mav} mrv={h.mrv} />
        {h.hoursSince != null && <div className="milo-text-caption">最近一次：{ago(h.hoursSince)} · {fmt(h.lastSets)} 组</div>}
      </SheetBlock>
      <SheetBlock label="近 8 周 · 每周组数" trailing={<ProLink active={proActive} onClick={onPro} />}>
        <HeadWeeks weeks={weeks} mev={h.mev} mrv={h.mrv} />
      </SheetBlock>
      {onFind && <Button kind="ghost" icon="plus" onClick={onFind}>找练这块的动作</Button>}
    </FluidPanel>
  );
}
