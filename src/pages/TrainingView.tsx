/** 首页即打卡（2026-10-06 用户：取消独立训练页，首页本身就是打卡载体；线框 design/wireframes ?board=checkin，选 W1 + W2 的组点）。
 *  五层：
 *  - 战略：在器械旁、单手、两组之间的几十秒里，用最少的注意力记下这一组，同时不丢掉「今天整体练到哪」。
 *  - 范围：打卡、改数、加组、跳过、换动作、休息（只显示倒计时；2026-10-08 走查 1 去掉 ±15 / 跳过，打下一组就是结束休息）、结束 → 结算。
 *  - 结构：留在首页（P01），导航始终在：外圈 = 今日进度，选中胶囊 = 休息（ia §1.12）；页头随内容滚走（2026-10-08 走查 1：训练中也不贴顶）。
 *  - 框架：当前动作做主角卡（组行就地展开）；其余动作是列表，每行一排组点；唯一主操作在拇指区（打卡第 N 组）；
 *    键盘平时不出现，点组行或「填重量」才从底部拉出改数面板（M05）。
 *  - 表现：主角卡与列表行之间换动作用共享元素（M03）；休息只是主按钮旁一颗不可点的计时小胶囊；组数滚动码表（M04）；列表交错弹入（M07）；按压微缩（M08）。 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import { flushSync } from 'react-dom';
import { BackToTop, Button, Card, Cascade, Dialog, ExerciseRow, Odometer, PageHeader, RestDock, SectionLabel, SetEditor, SetLine, Sheet, SwapRow, WarmupStrip, sharedName, sharedTransition, useBackHandler, useCountdown, useToast } from '../components';
import { dateLabel, env, REGION_NAME } from '../data/demo';
import { addSet, completeSet, discardSession, finishSession, focusExercise, hasWork, isWork, pauseSession, setError, setField, toggleSkip, toggleWarmup, workDone, MAX_SETS } from '../data/session';
import { EQUIP_NAME, swapCandidates, swapTo } from '../data/finder';
import muscles from '../../mock/muscles.json';
import { FinderGlyph } from './FinderSheet';
import type { ActiveSession } from '../data/store';
import { useStore } from '../data/store';
import { regionOfEx } from '../engine';
import s from './HomePage.module.css';
import { usePageNav } from '../shell/pageNav';

type Edit = { row: number; field: 'weight' | 'reps'; fresh: boolean; checkin: boolean };
const regionName = (id: string) => { const ex = env.ex.get(id); return ex ? REGION_NAME[regionOfEx(env, ex)] : ''; };
const HEAD: Record<string, string> = Object.fromEntries(muscles.heads.map((h) => [h.id, h.name]));

export function TrainingView({ a, now, onFind, onGuide }: { a: ActiveSession; now: number;
  /** 6e：列表末尾「＋ 加一个动作」打开找动作；主角卡「要领」进动作要领页 */
  onFind?: () => void; onGuide?: (exerciseId: string) => void }) {
  const st = useStore(), toast = useToast();
  const pn = usePageNav();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [confirm, setConfirm] = useState(false);
  // 暂停面板（6e，线框 pause W2）：页头「暂停」和系统返回键都打开它；换一个面板（线框 swap W1）
  const [pause, setPause] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  useBackHandler(true, () => setPause(true));
  const [swap, setSwap] = useState<string[]>([]);  // 正在换位的两个动作（只给它们起共享名，见 motion.tsx 的遮挡说明）
  const hero = useRef<HTMLDivElement>(null), topRef = useRef<HTMLDivElement>(null);
  const left = useCountdown(st.rest?.endAt ?? null);
  const [tick, setTick] = useState(now);
  useEffect(() => { const id = window.setInterval(() => setTick(Date.now()), 15e3); return () => clearInterval(id); }, []);
  const mins = Math.max(0, Math.floor((tick - a.startMs) / 60e3));
  // 休息胶囊和导航选中滑块一样宽（量导航当前项），切 Tab 时才能「原地」飞进滑块
  const [pillW, setPillW] = useState(0);
  // 刚挂载时胶囊宽度还没量到：主按钮的 left 过渡先关着，否则从别的 Tab 回来时按钮会从整宽「挤」到胶囊右边（2026-10-06 逐帧看到）
  const [armed, setArmed] = useState(false);
  useEffect(() => { let r = requestAnimationFrame(() => { r = requestAnimationFrame(() => setArmed(true)); }); return () => cancelAnimationFrame(r); }, []);
  useLayoutEffect(() => {
    const m = () => setPillW(document.querySelector('nav[aria-label="主导航"] [aria-current="page"]')?.getBoundingClientRect().width ?? 0);
    m(); window.addEventListener('resize', m); return () => window.removeEventListener('resize', m);
  }, []);

  const en = a.entries[a.cur];
  // 热身组（6e）不计数、不占序号：下面的数都只数正式组；cur 是 rows 里的下标
  const cur = en.rows.findIndex((r) => !r.done && isWork(r));
  const warm = en.rows.map((r, j) => [r, j] as const).filter(([r]) => !isWork(r));
  const work = en.rows.map((r, j) => [r, j] as const).filter(([r]) => isWork(r));
  const total = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.filter(isWork).length), 0);
  const doneSets = a.entries.reduce((n, x) => n + x.rows.filter((r) => r.done && isWork(r)).length, 0);
  const pending = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.filter((r) => !r.done && isWork(r)).length), 0);
  const curRow = cur >= 0 && !en.skipped ? en.rows[cur] : null;
  const curNo = work.findIndex(([, j]) => j === cur) + 1;   // 第几组（正式组序号）
  // 热身条：还没打正式组时才显示，打完第 1 组正式组就收起
  const showWarm = warm.length > 0 && !en.skipped && !work.some(([r]) => r.done);

  // ---- 换动作：点列表行 → 它原地长成主角卡，原主角缩回列表（M03） ----
  const switchTo = (i: number) => {
    if (i === a.cur) return;
    flushSync(() => setSwap([en.exerciseId, a.entries[i].exerciseId]));
    sharedTransition(() => focusExercise(i));
    window.setTimeout(() => setSwap([]), 600);
    hero.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  // ---- 改数面板 ----
  const er = edit ? en.rows[edit.row] : null;
  const err = er ? setError(er) : undefined;
  const key = (k: string) => {
    if (!edit || !er) return;
    if (edit.field === 'reps' && k === '.') return;
    let v = k === 'del' ? er[edit.field].slice(0, -1) : edit.fresh ? (k === '.' ? '0.' : k) : er[edit.field] + k;
    if (v.length > 6) return;
    if (/^0\d/.test(v)) v = v.slice(1);
    setField(a.cur, edit.row, edit.field, v);
    setEdit({ ...edit, fresh: false });
  };
  const stepBy = (d: number) => {
    if (!edit || !er) return;
    const n = Number(er[edit.field]) || 0, step = edit.field === 'weight' ? d : Math.sign(d);
    setField(a.cur, edit.row, edit.field, String(Math.max(edit.field === 'weight' ? 0 : 1, Math.round((n + step) * 100) / 100)));
    setEdit({ ...edit, fresh: false });
  };
  const editDone = () => {
    if (!edit || !er || !er.weight.trim() || !er.reps.trim() || err) return;
    // 改数面板里「打卡」= 填完直接记这一组；「好了」只保存（改已打卡的组时，它保持已打卡）
    if (edit.checkin) completeSet(a.cur, edit.row);
    setEdit(null);
  };
  const open = (row: number, checkin = false) => setEdit({ row, field: 'weight', fresh: true, checkin });
  const hint = !edit || !er ? undefined
    : edit.field === 'weight' ? (en.suggestKg == null ? `首次：选一个能干净做完 ${en.repRange[0]} 次的重量` : `建议 ${en.suggestKg} kg · 步进 ±${env.cfg.loadStep}`)
    : `目标 ${en.repRange.join('–')} 次`;

  // ---- 主操作（拇指区，唯一）：打卡第 N 组 / 填重量 / 结束并结算 ----
  const end = () => {
    setConfirm(false);
    if (!hasWork(a)) { toast.show('没有可保存的记录', { kind: 'error' }); return; }
    const saved = finishSession();
    if (saved) pn.push(`/summary/${saved.id}`);
  };
  const primary = (() => {
    if (pending === 0) return { label: hasWork(a) ? '结束并结算' : '放弃这次训练', run: () => (hasWork(a) ? end() : setConfirm(true)) };
    if (!curRow) {
      const next = a.entries.findIndex((x) => !x.skipped && !workDone(x));
      return { label: `下一个 · ${a.entries[next].name}`, run: () => switchTo(next) };
    }
    if (!curRow.weight.trim()) return { label: `填重量 · 第 ${curNo} 组`, run: () => open(cur, true) };
    // 重量 × 次数就在主角卡高亮的那一行里，按钮只写「打卡 · 第 N 组」（休息时按钮让出左边给休息胶囊，也放得下）
    return { label: `打卡 · 第 ${curNo} 组`, run: () => completeSet(a.cur, cur) };
  })();

  return (
    <>
      {/* 页头和内容在同一个滚动区里，随内容滚走（走查 1 #20：训练中也不贴顶；固定的只有导航和拇指区主按钮） */}
      <div ref={topRef} className={s.scroll}>
      <PageHeader title="今日处方"
        trailing={<Button kind="ghost" size="s" onClick={() => (hasWork(a) && pending === 0 ? end() : setPause(true))}>{hasWork(a) && pending === 0 ? '结束' : '暂停'}</Button>}>
        <p className={`milo-text-caption ${s.date}`}>{dateLabel(now)} · 训练中 {mins} 分钟</p>
      </PageHeader>
      <div className={s.body} data-training>
        <div className={s.progress} aria-label={`已打卡 ${doneSets} / ${total} 组`}>
          <Odometer value={String(doneSets)} size="l" /><span className="milo-text-body">/ {total} 组</span>
          <span className={`milo-text-caption ${s.grow}`}>{[...new Set(a.entries.map((x) => regionName(x.exerciseId)))].join(' · ')}</span>
        </div>

        <div ref={hero} style={sharedName('swap', en.exerciseId)}>
          <Card hero calm>
            <div className={s.heroTop}><span className="milo-text-caption">第 {a.cur + 1} 个 · {regionName(en.exerciseId)} · {work.filter(([r]) => r.done).length} / {work.length} 组</span>
              <span className={s.heroLinks}>
                {onGuide && <button type="button" className={`milo-press milo-focus ${s.link}`} onClick={() => onGuide(en.exerciseId)}>要领</button>}
                {!work.some(([r]) => r.done) || !workDone(en) ? <button type="button" className={`milo-press milo-focus ${s.link}`} onClick={() => { setPick(null); setSwapOpen(true); }}>换一个</button> : null}
              </span></div>
            <div className={`milo-text-heading ${s.primary}`}>{en.name}</div>
            <div className="milo-text-caption">{en.sets} × {en.repRange.join('–')} · 休息 {Math.round(en.restSec / 60 * 10) / 10} 分钟{en.suggestKg == null ? ` · 首次：选一个能干净做完 ${en.repRange[0]} 次的重量` : ''}</div>
            {en.skipped ? <p className={`milo-text-body ${s.muted}`}>已标为「未做」，不计入统计。</p> : (
              <>
                {showWarm && <WarmupStrip sets={warm.map(([r]) => r)} onToggle={(i) => toggleWarmup(a.cur, warm[i][1])} />}
                <div className={s.lines}>
                  {work.map(([r, j], k) => <SetLine key={j} index={k + 1} weight={r.weight} reps={r.reps} status={r.done ? 'done' : j === cur ? 'current' : 'todo'} onClick={() => open(j, false)} />)}
                </div>
              </>
            )}
            <div className={s.heroActions}>
              {!en.skipped && work.length < MAX_SETS && <Button kind="ghost" size="s" icon="plus" onClick={() => addSet(a.cur)}>加一组</Button>}
              <Button kind="ghost" size="s" onClick={() => toggleSkip(a.cur)}>{en.skipped ? '恢复这个动作' : '跳过这个动作'}</Button>
            </div>
          </Card>
        </div>

        {/* 加一个动作（走查 1 W2）：主角卡和「全部动作」之间 */}
        {onFind && <button type="button" className={`milo-press milo-focus ${s.addEx}`} onClick={onFind}><FinderGlyph gender={st.profile?.gender ?? 'male'} className={s.addGlyph} />加一个动作<span className={s.addHint}>· 按肌肉找</span></button>}
        <SectionLabel>全部动作 · 点一下换过去</SectionLabel>
        <div className={s.rows}>
          <Cascade>
            {a.entries.map((x, i) => i === a.cur ? null : (
              <div key={x.exerciseId} style={swap.includes(x.exerciseId) ? sharedName('swap', x.exerciseId) : undefined}><ExerciseRow name={x.name} detail={`${regionName(x.exerciseId)} · ${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestKg}
                status={x.skipped ? 'skipped' : workDone(x) ? 'done' : 'todo'} sets={[x.rows.filter((r) => r.done && isWork(r)).length, x.rows.filter(isWork).length]}
                dots={x.skipped ? undefined : [x.rows.filter((r) => r.done && isWork(r)).length, x.rows.filter(isWork).length]} onClick={() => switchTo(i)} /></div>
            )).filter(Boolean)}
          </Cascade>
        </div>
      </div>
      </div>

      <div className={s.scrim} aria-hidden="true" />
      {/* 首页训练中唯一的计时器：和导航选中滑块同形（导航上不再显示），切 Tab 时胶囊下滑消失、里面的进度条飞进导航滑块（Nav.tsx 的 REST_RING_VT） */}
      {st.rest && <div className={s.restDock}><RestDock remaining={left} total={st.rest.totalMs / 1000} endAt={st.rest.endAt} width={pillW || undefined} /></div>}
      <div className={s.cta} style={{ ...(st.rest && pillW ? { left: T['size/gutter'] + pillW + T['space/s'] } : {}), ...(armed ? {} : { transition: 'none' }) }}><Button onClick={primary.run}>{primary.label}</Button></div>

      {edit && er && (
        // 标题只放动作名，「第 N 组」放说明行：长动作名不会在「第」字后面断行（走查 1 #19）
        <Sheet title={en.name} meta={`${isWork(en.rows[edit.row]) ? `第 ${work.findIndex(([, j]) => j === edit.row) + 1} 组` : '热身'}${er.done ? ' · 已打卡，改完点「好了」' : ''}`} onClose={() => setEdit(null)}>
          <SetEditor weight={er.weight} reps={er.reps} field={edit.field} onField={(f) => setEdit({ ...edit, field: f, fresh: true })} onKey={key} onStep={stepBy} step={env.cfg.loadStep}
            hint={hint} error={err?.field === edit.field ? err.msg : err?.msg} onDone={editDone} doneLabel={edit.checkin ? '打卡' : '好了'} doneDisabled={!er.weight.trim() || !er.reps.trim() || !!err} />
        </Sheet>
      )}

      {pause && <PauseSheet a={a} onClose={() => setPause(false)} onPause={() => { setPause(false); sharedTransition(() => pauseSession()); }}
        onEnd={() => { setPause(false); if (hasWork(a) && pending === 0) end(); else setConfirm(true); }} />}
      {swapOpen && <SwapSheet a={a} e={a.cur} pick={pick} onPick={setPick} onClose={() => setSwapOpen(false)}
        onSwap={(id) => { setSwapOpen(false); sharedTransition(() => swapTo(a.cur, id, st.history)); toast.show('已换：只换今天，下次处方照常排'); }} />}
      <Dialog open={confirm} onClose={() => setConfirm(false)} title={hasWork(a) ? '结束这次训练？' : '还没有打卡任何一组'}
        confirm={hasWork(a) ? '结束并结算' : '放弃这次训练'} tone={hasWork(a) ? 'neutral' : 'danger'}
        onConfirm={hasWork(a) ? end : () => { setConfirm(false); discardSession(); }}>
        {hasWork(a) ? `还有 ${pending} 组没打卡，结束后标为「未做」，不计入统计。` : '没有可保存的记录：放弃后不写入历史。'}
      </Dialog>
      <BackToTop target={topRef} lift />
    </>
  );
}

/** 暂停训练？（6e，线框 pause W2 + Stitch pause-v2）：底部面板，按钮全在拇指区；面板外点一下 = 继续练。
 *  可撤销的走底部面板、不可撤销的（删除训练）走居中对话框（DESIGN §9.6 补）。 */
function PauseSheet({ a, onPause, onEnd, onClose }: { a: ActiveSession; onPause: () => void; onEnd: () => void; onClose: () => void }) {
  const done = a.entries.reduce((n, x) => n + x.rows.filter((r) => r.done && isWork(r)).length, 0);
  const ni = a.entries.findIndex((x) => !x.skipped && !workDone(x));
  const next = ni >= 0 ? a.entries[ni] : null;
  const k = next ? next.rows.filter(isWork).findIndex((r) => !r.done) + 1 : 0;
  return (
    <Sheet title="暂停训练？" meta="点面板外面 = 继续练" onClose={onClose}>
      <div className={s.pause}>
        <dl className={s.pauseSum}>
          <div><dt className="milo-text-caption">已记录</dt><dd className="milo-text-body-strong">{done} 组</dd></div>
          <div><dt className="milo-text-caption">下一组</dt><dd className="milo-text-body-strong">{next ? `${next.name} 第 ${k} 组` : '都打完了'}</dd></div>
        </dl>
        <p className="milo-text-body">已记的组都在，回来接着练；休息计时也会停。</p>
        <Button kind="neutral" onClick={onPause}>暂停</Button>
        <Button kind="ghost" onClick={onEnd}>结束并结算</Button>
      </div>
    </Sheet>
  );
}

/** 换一个（6e，线框 swap W1 + Stitch swap-v1，借 v2 的「推荐」）：同练主练肌头、我有的器械；第一个推荐并默认选中；底部「换成 X」是唯一主操作。只换今天。 */
function SwapSheet({ a, e, pick, onPick, onSwap, onClose }: { a: ActiveSession; e: number; pick: string | null; onPick: (id: string) => void; onSwap: (id: string) => void; onClose: () => void }) {
  const st = useStore();
  const en = a.entries[e], ex = env.ex.get(en.exerciseId);
  const list = swapCandidates(en.exerciseId, { history: st.history, profile: st.profile }, a.entries.map((x) => x.exerciseId));
  const sel = pick ?? list[0]?.ex.id ?? null, selName = list.find((r) => r.ex.id === sel)?.ex.name;
  const heads = (ex?.primaryHeads ?? []).map((h) => HEAD[h] ?? h).join('、');
  const done = en.rows.some((r) => r.done && isWork(r));
  return (
    <Sheet title={`换掉 ${en.name}`} meta={`同练${heads} · 同器械优先 · 只换今天${done ? ' · 已打的组留在原动作下' : ''}`} onClose={onClose}>
      <div className={s.swap} role="radiogroup" aria-label="换成哪个动作">
        {list.length ? list.map((r, i) => <SwapRow key={r.ex.id} name={r.ex.name} detail={`${EQUIP_NAME[r.ex.equipmentType] ?? r.ex.equipment} · ${r.ex.primaryHeads.map((h) => HEAD[h] ?? h).join(' · ')}`}
          last={r.last} selected={sel === r.ex.id} recommended={i === 0} onClick={() => onPick(r.ex.id)} />)
          : <p className="milo-text-body">你现有的器械里没有能替换它的动作。</p>}
        {sel && selName && <Button onClick={() => onSwap(sel)}>换成 {selName}</Button>}
      </div>
    </Sheet>
  );
}
