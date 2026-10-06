/** 首页即打卡（2026-10-06 用户：取消独立训练页，首页本身就是打卡载体；线框 design/wireframes ?board=checkin，选 W1 + W2 的组点）。
 *  五层：
 *  - 战略：在器械旁、单手、两组之间的几十秒里，用最少的注意力记下这一组，同时不丢掉「今天整体练到哪」。
 *  - 范围：打卡、改数、加组、跳过、换动作、休息（±15 / 跳过）、结束 → 结算。
 *  - 结构：留在首页（P01），导航始终在：外圈 = 今日进度，选中胶囊 = 休息（ia §1.12）。
 *  - 框架：当前动作做主角卡（组行就地展开）；其余动作是列表，每行一排组点；唯一主操作在拇指区（打卡第 N 组）；
 *    键盘平时不出现，点组行或「填重量」才从底部拉出改数面板（M05）。
 *  - 表现：主角卡与列表行之间换动作用共享元素（M03）；休息胶囊点开流体形变成面板（M02）；组数滚动码表（M04）；列表交错弹入（M07）；按压微缩（M08）。 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { T } from '../styles/tokens.gen';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router';
import { Button, Card, Cascade, Dialog, ExerciseRow, Odometer, PageHeader, RestDock, SectionLabel, SetEditor, SetLine, Sheet, sharedName, sharedTransition, useCountdown, useToast } from '../components';
import { dateLabel, env, REGION_NAME } from '../data/demo';
import { addSet, adjustRest, completeSet, discardSession, finishSession, focusExercise, hasWork, setError, setField, skipRest, toggleSkip, MAX_SETS } from '../data/session';
import type { ActiveSession } from '../data/store';
import { useStore } from '../data/store';
import { regionOfEx } from '../engine';
import s from './HomePage.module.css';

type Edit = { row: number; field: 'weight' | 'reps'; fresh: boolean; checkin: boolean };
const regionName = (id: string) => { const ex = env.ex.get(id); return ex ? REGION_NAME[regionOfEx(env, ex)] : ''; };

export function TrainingView({ a, now }: { a: ActiveSession; now: number }) {
  const st = useStore(), nav = useNavigate(), toast = useToast();
  const [edit, setEdit] = useState<Edit | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [dock, setDock] = useState(false);
  const [swap, setSwap] = useState<string[]>([]);  // 正在换位的两个动作（只给它们起共享名，见 motion.tsx 的遮挡说明）
  const hero = useRef<HTMLDivElement>(null);
  const left = useCountdown(st.rest?.endAt ?? null);
  const [tick, setTick] = useState(now);
  useEffect(() => { const id = window.setInterval(() => setTick(Date.now()), 15e3); return () => clearInterval(id); }, []);
  const mins = Math.max(0, Math.floor((tick - a.startMs) / 60e3));
  useEffect(() => { if (st.rest) setDock(false); }, [st.rest?.endAt]); // eslint-disable-line react-hooks/exhaustive-deps
  // 休息面板是临时的：点面板以外的任何地方就缩回小胶囊（共享元素反向），不挡列表；听 click 而不是 pointerdown：先让这一下点到的东西生效，再开始收起转场（转场中途抬手会丢掉这次点击）
  const dockRef = useRef<HTMLDivElement>(null);
  // 休息胶囊和导航选中滑块一样宽（量导航当前项），切 Tab 时才能「原地」飞进滑块
  const [pillW, setPillW] = useState(0);
  useLayoutEffect(() => {
    const m = () => setPillW(document.querySelector('nav[aria-label="主导航"] [aria-current="page"]')?.getBoundingClientRect().width ?? 0);
    m(); window.addEventListener('resize', m); return () => window.removeEventListener('resize', m);
  }, []);
  useEffect(() => {
    if (!dock) return;
    const away = (e: MouseEvent) => { if (!dockRef.current?.contains(e.target as Node)) sharedTransition(() => setDock(false)); };
    document.addEventListener('click', away, true);
    return () => document.removeEventListener('click', away, true);
  }, [dock]);

  const en = a.entries[a.cur];
  const cur = en.rows.findIndex((r) => !r.done);
  const total = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.length), 0);
  const doneSets = a.entries.reduce((n, x) => n + x.rows.filter((r) => r.done).length, 0);
  const pending = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.filter((r) => !r.done).length), 0);
  const curRow = cur >= 0 && !en.skipped ? en.rows[cur] : null;

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
    if (saved) nav(`/summary/${saved.id}`);
  };
  const primary = (() => {
    if (pending === 0) return { label: hasWork(a) ? '结束并结算' : '放弃这次训练', run: () => (hasWork(a) ? end() : setConfirm(true)) };
    if (!curRow) {
      const next = a.entries.findIndex((x) => !x.skipped && x.rows.some((r) => !r.done));
      return { label: `下一个 · ${a.entries[next].name}`, run: () => switchTo(next) };
    }
    if (!curRow.weight.trim()) return { label: `填重量 · 第 ${cur + 1} 组`, run: () => open(cur, true) };
    // 重量 × 次数就在主角卡高亮的那一行里，按钮只写「打卡 · 第 N 组」（休息时按钮让出左边给休息胶囊，也放得下）
    return { label: `打卡 · 第 ${cur + 1} 组`, run: () => completeSet(a.cur, cur) };
  })();

  return (
    <>
      <PageHeader title="今日处方" eyebrow={`${dateLabel(now)} · 训练中 ${mins} 分钟`}
        trailing={<Button kind="ghost" size="s" onClick={() => (hasWork(a) && pending === 0 ? end() : setConfirm(true))}>结束</Button>} />
      <div className={s.body} data-training>
        <div className={s.progress} aria-label={`已打卡 ${doneSets} / ${total} 组`}>
          <Odometer value={String(doneSets)} size="l" /><span className="milo-text-body">/ {total} 组</span>
          <span className={`milo-text-caption ${s.grow}`}>{[...new Set(a.entries.map((x) => regionName(x.exerciseId)))].join(' · ')}</span>
        </div>

        <div ref={hero} style={sharedName('swap', en.exerciseId)}>
          <Card hero>
            <div className={s.heroTop}><span className="milo-text-caption">第 {a.cur + 1} 个 · {regionName(en.exerciseId)} · {en.rows.filter((r) => r.done).length} / {en.rows.length} 组</span></div>
            <div className={`milo-text-heading ${s.primary}`}>{en.name}</div>
            <div className="milo-text-caption">{en.sets} × {en.repRange.join('–')} · 休息 {Math.round(en.restSec / 60 * 10) / 10} 分钟{en.suggestKg == null ? ` · 首次：选一个能干净做完 ${en.repRange[0]} 次的重量` : ''}</div>
            {en.skipped ? <p className={`milo-text-body ${s.muted}`}>已标为「未做」，不计入统计。</p> : (
              <div className={s.lines}>
                {en.rows.map((r, j) => <SetLine key={j} index={j + 1} weight={r.weight} reps={r.reps} status={r.done ? 'done' : j === cur ? 'current' : 'todo'} onClick={() => open(j, false)} />)}
              </div>
            )}
            <div className={s.heroActions}>
              {!en.skipped && en.rows.length < MAX_SETS && <Button kind="ghost" size="s" icon="plus" onClick={() => addSet(a.cur)}>加一组</Button>}
              <Button kind="ghost" size="s" onClick={() => toggleSkip(a.cur)}>{en.skipped ? '恢复这个动作' : '跳过这个动作'}</Button>
            </div>
          </Card>
        </div>

        <SectionLabel>全部动作 · 点一下换过去</SectionLabel>
        <div className={s.rows}>
          <Cascade>
            {a.entries.map((x, i) => i === a.cur ? null : (
              <div key={x.exerciseId} style={swap.includes(x.exerciseId) ? sharedName('swap', x.exerciseId) : undefined}><ExerciseRow name={x.name} detail={`${regionName(x.exerciseId)} · ${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestKg}
                status={x.skipped ? 'skipped' : x.rows.every((r) => r.done) ? 'done' : 'todo'} sets={[x.rows.filter((r) => r.done).length, x.rows.length]}
                dots={x.skipped ? undefined : [x.rows.filter((r) => r.done).length, x.rows.length]} onClick={() => switchTo(i)} /></div>
            )).filter(Boolean)}
          </Cascade>
        </div>
      </div>

      <div className={s.scrim} aria-hidden="true" />
      {/* 首页训练中唯一的计时器：和导航选中滑块同形（导航上不再显示），切 Tab 时飞进导航滑块（Nav.tsx 的 REST_VT） */}
      {st.rest && <div ref={dockRef} className={`${s.restDock} ${dock ? s.restDockOpen : ''}`}><RestDock remaining={left} total={st.rest.totalMs / 1000} open={dock} onToggle={setDock} onAdjust={adjustRest} onSkip={skipRest}
        ring={pillW ? { width: pillW, endAt: st.rest.endAt } : undefined} /></div>}
      <div className={s.cta} style={st.rest && !dock && pillW ? { left: T['size/gutter'] + pillW + T['space/s'] } : undefined}><Button onClick={primary.run}>{primary.label}</Button></div>

      {edit && er && (
        <Sheet title={`${en.name} · 第 ${edit.row + 1} 组`} meta={er.done ? '已打卡 · 改完点「好了」' : undefined} onClose={() => setEdit(null)}>
          <SetEditor weight={er.weight} reps={er.reps} field={edit.field} onField={(f) => setEdit({ ...edit, field: f, fresh: true })} onKey={key} onStep={stepBy} step={env.cfg.loadStep}
            hint={hint} error={err?.field === edit.field ? err.msg : err?.msg} onDone={editDone} doneLabel={edit.checkin ? '打卡' : '好了'} doneDisabled={!er.weight.trim() || !er.reps.trim() || !!err} />
        </Sheet>
      )}

      <Dialog open={confirm} onClose={() => setConfirm(false)} title={hasWork(a) ? '结束这次训练？' : '还没有打卡任何一组'}
        confirm={hasWork(a) ? '结束并结算' : '放弃这次训练'} tone={hasWork(a) ? 'neutral' : 'danger'}
        onConfirm={hasWork(a) ? end : () => { setConfirm(false); discardSession(); }}>
        {hasWork(a) ? `还有 ${pending} 组没打卡，结束后标为「未做」，不计入统计。` : '没有可保存的记录：放弃后不写入历史。'}
      </Dialog>
    </>
  );
}
