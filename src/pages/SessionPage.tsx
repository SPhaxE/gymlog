/** 训练进行中（P03，线框 W2「组表格」+ Stitch s6 V2，ia §1.5 / §1.6，阶段 6a）：任务流，没有导航。
 *  - 自带数字键盘（不弹系统键盘）：点一格选中它，第一下数字覆盖原值、之后追加；±2.5 kg / ±1 次步进；「下一组」= 完成当前组。
 *  - 组间休息在顶部（小胶囊，点开是完整的休息条）。
 *  - 当前动作的组排成一列（SetRow），当前组预填建议值，「完成」一次点击记完一组；完成后休息条从底部浮出（结束时间戳，切后台回来仍然准）。
 *  - 其余动作在下面，点一下切过去；可以加组（上限 10）、跳过这个动作。
 *  - 「结束」：有没做的组先确认；没有已完成的工作组 → 不保存，提示「没有可保存的记录」。结束后进结算页（替换历史，不能返回到训练）。
 *  - 每一下改动都立即写进本地存储；返回键回首页，训练不会丢，首页按钮变「继续训练」。 */
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button, Dialog, ExerciseRow, Num, NumPad, RestDock, Screen, SectionLabel, SetRow, TopBar, clock, useCountdown, useToast } from '../components';
import { env } from '../data/demo';
import { addSet, adjustRest, completeSet, discardSession, editSet, finishSession, focusExercise, hasWork, setError, setField, skipRest, toggleSkip, MAX_SETS } from '../data/session';
import { useStore } from '../data/store';
import s from './SessionPage.module.css';

export function SessionPage() {
  const st = useStore(), nav = useNavigate(), toast = useToast();
  const a = st.active;
  const [confirm, setConfirm] = useState(false);
  const leaving = useRef(false);
  const [dock, setDock] = useState(false);
  // 键盘正在改哪一格：{ 第几组, 重量 / 次数, 是否刚选中（刚选中时第一下数字覆盖原值）}
  const [focus, setFocus] = useState<{ row: number; field: 'weight' | 'reps'; fresh: boolean } | null>(null);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => { const id = window.setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = useCountdown(st.rest?.endAt ?? null);
  useEffect(() => { if (st.rest) setDock(false); }, [st.rest?.endAt]); // eslint-disable-line react-hooks/exhaustive-deps
  // 换动作 / 完成一组后，键盘默认跟着当前组的重量
  const curKey = a ? `${a.cur}:${a.entries[a.cur].rows.findIndex((r) => !r.done)}` : '';
  useEffect(() => { setFocus(null); }, [curKey]);
  if (!a) return leaving.current ? null : <Navigate to="/today" replace />;

  const en = a.entries[a.cur];
  const doneSets = a.entries.reduce((n, x) => n + x.rows.filter((r) => r.done).length, 0);
  const totalSets = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.length), 0);
  const pending = a.entries.reduce((n, x) => n + (x.skipped ? 0 : x.rows.filter((r) => !r.done).length), 0);
  const curRow = en.rows.findIndex((r) => !r.done);
  const editing = en.rows.findIndex((r, j) => !r.done && j === curRow);
  const fx = focus ?? (editing >= 0 ? { row: editing, field: 'weight' as const, fresh: true } : null);
  const row = fx ? en.rows[fx.row] : null;
  const rowErr = row ? setError(row) : undefined;
  const key = (k: string) => {
    if (!fx || !row) return;
    const cur = row[fx.field];
    let v = k === 'del' ? cur.slice(0, -1) : fx.fresh ? (k === '.' ? '0.' : k) : cur + k;
    if (fx.field === 'reps' && k === '.') return;
    if (v.length > 6) return;
    if (/^0\d/.test(v)) v = v.slice(1);
    setField(a.cur, fx.row, fx.field, v);
    setFocus({ ...fx, fresh: false });
  };
  const stepBy = (d: number) => {
    if (!fx || !row) return;
    const n = Number(row[fx.field]) || 0, step = fx.field === 'weight' ? d : Math.sign(d);
    const v = Math.max(fx.field === 'weight' ? 0 : 1, Math.round((n + step) * 100) / 100);
    setField(a.cur, fx.row, fx.field, String(v));
    setFocus({ ...fx, fresh: false });
  };

  const end = () => {
    setConfirm(false);
    if (!hasWork(a)) { toast.show('没有可保存的记录', { kind: 'error' }); return; }
    // 保存会清掉进行中的训练：先标记「正在离开」，这一页就不会把自己重定向回首页，保存完再进结算页
    leaving.current = true;
    const saved = finishSession();
    if (saved) nav(`/summary/${saved.id}`, { replace: true });
  };

  return (
    <Screen label="训练中">
      <TopBar title="训练中" sub={<Num size="s" value={clock((tick - a.startMs) / 1000)} />} onBack={() => nav('/today')}
        trailing={<Button kind="ghost" size="s" onClick={() => (hasWork(a) && pending === 0 ? end() : setConfirm(true))}>结束</Button>} />
      <div className={s.strip} aria-label={`已完成 ${doneSets} / ${totalSets} 组`}>{Array.from({ length: totalSets }, (_, i) => <i key={i} className={i < doneSets ? s.on : undefined} />)}</div>

      <div className={s.body}>
        <div className={s.head}>
          <h2 className="milo-text-title-m">{en.name}</h2>
          <span className="milo-text-caption">{en.sets} × {en.repRange.join('–')} · 休息 {clock(en.restSec)}{en.suggestKg == null ? ' · 首次：选一个能干净做完下限次数的重量' : ''}</span>
        </div>
        {en.skipped ? <p className={`milo-text-body ${s.muted}`}>这个动作已标为「未做」，不计入任何统计。</p> : en.rows.map((r, j) => {
          const err = setError(r);
          return (
            <SetRow key={j} index={j + 1} type={r.type} weight={r.weight} reps={r.reps} error={err?.msg} errorField={err?.field}
              status={r.done ? 'done' : j === curRow ? 'current' : 'todo'}
              keypad={{ field: fx?.row === j ? fx.field : null, onFocus: (f) => setFocus({ row: j, field: f, fresh: true }) }}
              onChange={(f, v) => setField(a.cur, j, f, v)} onDone={() => completeSet(a.cur, j)} onEdit={() => { editSet(a.cur, j); setFocus({ row: j, field: 'weight', fresh: true }); }} />
          );
        })}
        <div className={s.actions}>
          {!en.skipped && en.rows.length < MAX_SETS && <Button kind="ghost" size="s" onClick={() => addSet(a.cur)}>加一组</Button>}
          <Button kind="ghost" size="s" onClick={() => toggleSkip(a.cur)}>{en.skipped ? '恢复这个动作' : '跳过这个动作'}</Button>
        </div>

        <SectionLabel>全部动作</SectionLabel>
        <div className={s.rows}>
          {a.entries.map((x, i) => {
            const d = x.rows.filter((r) => r.done).length;
            return <ExerciseRow key={x.exerciseId} name={x.name} detail={`${x.sets} × ${x.repRange.join('–')}`} weight={x.suggestKg} sets={[d, x.rows.length]}
              status={x.skipped ? 'skipped' : i === a.cur ? 'current' : d === x.rows.length ? 'done' : 'todo'} onClick={() => focusExercise(i)} />;
          })}
        </div>
      </div>

      {st.rest && <div className={s.dock}><RestDock remaining={left} total={st.rest.totalMs / 1000} open={dock} onToggle={setDock} onAdjust={adjustRest} onSkip={skipRest} /></div>}
      {!en.skipped && fx && row && (
        <NumPad onKey={key} onStep={stepBy} step={fx.field === 'weight' ? env.cfg.loadStep : 1} unit={fx.field === 'weight' ? 'kg' : '次'}
          onNext={() => completeSet(a.cur, fx.row)} nextDisabled={!row.weight.trim() || !row.reps.trim() || !!rowErr} nextLabel={row.done ? '保存' : '下一组'} />
      )}

      <Dialog open={confirm} onClose={() => setConfirm(false)} title={hasWork(a) ? '结束这次训练？' : '还没有完成任何一组'}
        confirm={hasWork(a) ? '结束并结算' : '放弃这次训练'} tone={hasWork(a) ? 'neutral' : 'danger'}
        onConfirm={hasWork(a) ? end : () => { setConfirm(false); discardSession(); nav('/today', { replace: true }); }}>
        {hasWork(a) ? `还有 ${pending} 组没做，结束后标为「未做」，不计入统计。` : '没有可保存的记录：放弃后不写入历史。'}
      </Dialog>
    </Screen>
  );
}
