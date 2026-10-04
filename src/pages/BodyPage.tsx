/** 身体页（P06，线框 W3 + 视觉语言 v2）：压暗的 MuscleWiki 半身作背景（在内容区内，左缘渐隐），右侧胶囊列叠在上面。
 *  正面 / 背面、男 / 女切换是「抽卡」（2026-10-04 用户第二轮反馈）：当前人体像最上面一张卡被抽走（往一侧滑出、微转、变淡），
 *  下一张从后面浮上来；方向跟分段选择器的方向一致。新的一张量完锚点再开始浮上来，胶囊引线才对得上。 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Banner, BodyFigure, CapsuleRail, LandmarkRuler, Nav, Num, PageHeader, PhaseSegments, Screen, Segmented, Sheet, SheetBlock, Ticks, TierLegend, type Anchors, type Tab } from '../components';
import { ago, bodyData, fmt, REGION_NAME } from '../data/demo';
import type { HeadStat } from '../engine';
import { T } from '../styles/tokens.gen';
import s from './BodyPage.module.css';

const TIER_NAME = { large: '大肌群', medium: '中肌群', small: '小肌群' } as const;
type View = 'front' | 'back';
type Gender = 'male' | 'female';
/** 一张人体卡：still 静止；wait 刚换上、量锚点中（透明、不变形）；in 从后面浮上来；out 被抽走 */
type Card = { key: number; view: View; gender: Gender; st: 'still' | 'wait' | 'in' | 'out'; dir: number };
const noop = () => {};
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function BodyPage({ scenario, now, initialFocus, onTab }: { scenario: string; now: number; initialFocus: string | null; onTab?: (tab: Tab, path: string) => void }) {
  const data = useMemo(() => bodyData(scenario, now), [scenario, now]);
  const [cards, setCards] = useState<Card[]>(() => [{ key: 0, view: 'front', gender: data.gender, st: 'still', dir: 0 }]);
  const cur = cards[cards.length - 1], view = cur.view, gender = cur.gender;
  const [anchors, setAnchors] = useState<Anchors>({});
  const [mag, setMag] = useState<number | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
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
  // 截图 / 首次打开停在指定肌头被按住的状态，方便和设计稿对照
  useEffect(() => {
    if (initialFocus && ids.length && mag == null) { const i = ids.indexOf(initialFocus); if (i >= 0) setMag(i); }
  }, [ids, initialFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  const g = T['size/gutter'], contentW = box.w - 2 * g;
  const k = data.kpi;
  const reset = () => { setMag(null); setSheet(null); };
  const swap = (next: Partial<Pick<Card, 'view' | 'gender'>>, dir: number) => {
    reset();
    setCards((cs) => {
      const last = cs[cs.length - 1], rm = reducedMotion();
      const outs = rm ? [] : [...cs.slice(0, -1).filter((c) => c.st === 'out'), { ...last, st: 'out' as const, dir }];
      return [...outs, { key: last.key + 1, view: next.view ?? last.view, gender: next.gender ?? last.gender, st: rm ? 'still' : 'wait', dir }];
    });
  };
  const settle = (key: number) => (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    setCards((cs) => cs.flatMap((c) => (c.key !== key ? [c] : c.st === 'out' ? [] : [{ ...c, st: 'still' as const }])));
  };
  const cardCls = { still: s.card, wait: s.cardWait, in: s.cardIn, out: s.cardOut };
  return (
    <Screen label="身体">
      <PageHeader title="身体" trailing={<>
        <Segmented label="视图" items={[['front', '正面'], ['back', '背面']]} value={view} onChange={(v) => v !== view && swap({ view: v }, v === 'back' ? 1 : -1)} />
        <Segmented label="体型示意" items={[['male', '男'], ['female', '女']]} value={gender} onChange={(v) => v !== gender && swap({ gender: v }, v === 'female' ? 1 : -1)} />
      </>}>
        <div className={s.kpi}>
          <span className="milo-text-caption">近 7 天</span>
          <Num value={fmt(k.load)} unit="kg" /><Num value={k.sets} unit="组" /><Num value={k.days} unit="天" />
        </div>
        <Ticks />
        {k.sets === 0 && <Banner quiet detail="练完第一次训练后，这里会显示每块肌肉近 7 天的容量和恢复。" />}
        <TierLegend />
      </PageHeader>

      <div ref={stage} className={s.stage}>
        {/* 人体只在内容区里（左缘 = 页面边距），不越过组件最外层 */}
        <div className={s.figureClip}>
          {cards.map((c) => {
            const live = c === cur;
            return (
              <div key={c.key} className={cardCls[c.st]} style={{ '--dir': c.dir } as CSSProperties} onAnimationEnd={settle(c.key)}>
                <BodyFigure gender={c.gender} view={c.view} stats={data.stats} focus={live ? (mag != null ? ids[Math.round(mag)] ?? null : sheet) : null}
                  height={box.h} onAnchors={live ? onAnchors : noop} relativeTo={stage} />
              </div>
            );
          })}
        </div>
        <CapsuleRail ids={ids} stats={data.stats} anchors={anchors} width={box.w} height={box.h} readoutLeft={g}
          left={g + contentW * T['ratio/rail-start']} right={g + contentW} mag={mag} onMag={setMag} onSelect={setSheet} />
      </div>

      {sheet && <HeadSheet h={data.stats.get(sheet)!} onClose={reset} />}
      <Nav selected="body" progress={data.trainedToday ? 1 : 0} onSelect={onTab} />
    </Screen>
  );
}

/** 肌头详情（线框 sheet W1：恢复在上、容量在下，阅读顺序同处方逻辑） */
function HeadSheet({ h, onClose }: { h: HeadStat; onClose: () => void }) {
  return (
    <Sheet title={h.name} meta={`${REGION_NAME[h.region]} · ${TIER_NAME[h.tier]}`} onClose={onClose}>
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
    </Sheet>
  );
}
