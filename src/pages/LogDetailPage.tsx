/** 训练详情（P08，ia §1.8）：某一次训练练了什么、每个动作每一组做了多少。
 *  五层：
 *  - 战略：从记录页点进某一天，回看「那天到底做了什么」，并能顺着动作进它的进步曲线。
 *  - 范围：这次的汇总（动作数 · 组数 · 总负荷）、新纪录一行、每个动作一张卡（每一组：重量 × 次数，热身 / 递减组标出来，有 RPE 就写）；
 *    动作没做 = 「未做」；训练不存在（已被删除、地址写错）= 空状态，出口回记录页。
 *  - 结构：子页（没有 Tab，导航不出现），来自记录页；返回回到记录页原来的滚动位置和展开的周数，直接打开的链接返回去记录页。
 *  - 框架：顶栏（返回 + 「10月3日 周六」+ 部位 · 时长）→ 汇总三格 → 新纪录一行 → 动作卡。整页一个滚动区，没有主操作按钮（浏览页）。
 *  - 表现：整页没有荧光（荧光留给记录页的钢板）；PR 标骨白；热身组灰字 + 虚线「热身」标；点动作卡头进它的曲线页（从曲线页返回回到这里）；
 *    M09 钻入转场：记录页那一行的日期飞成标题、部位飞成副标题。
 *  - 删除训练（ia §1.8 / §5）：右上角溢出 ⋮ → 底部面板「删除这次训练」→ 二次确认对话框（日期 · 部位 · 组数 + 「删除后，近 7 天容量、恢复度、趋势和新纪录都会重新计算，不能撤销」）
 *    → 删除后回记录页 + 轻提示。训练是从历史现算出来的（容量 / 恢复度 / 趋势 / PR / 处方 / 增量），删完各页自动重算，不用逐项失效。
 *  （Stitch l6 D / E 的取舍见 design/hifi/log/decision.md。） */
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Button, Delta, Dialog, Icon, IconButton, Num, Screen, Sheet, StateView, Tag, TopBar, drillName, drillTransition, useToast } from '../components';
import { fmt } from '../data/demo';
import { logDetail } from '../data/log';
import { useSource } from '../data/useSource';
import s from './LogDetailPage.module.css';

export function LogDetailPage({ scenario, now }: { scenario?: string; now: number }) {
  const { id = '' } = useParams();
  const nav = useNavigate(), loc = useLocation();
  const { src, remove } = useSource(scenario, now);
  const toast = useToast();
  const [menu, setMenu] = useState(false), [confirm, setConfirm] = useState(false);
  const d = useMemo(() => logDetail(src, id, now), [src, id, now]);
  // 从记录页来的就退回记录页（回到原来的滚动位置和展开的周数）；直接打开的链接替换成记录页
  const back = () => drillTransition(() => ((window.history.state?.idx ?? 0) > 0 ? nav(-1) : nav('/log' + loc.search, { replace: true })), '[data-drill-ready=log]', 'out');

  if (!d) return (
    <Screen label="训练详情">
      <TopBar title="找不到这次训练" onBack={back} />
      <div className={s.empty}>
        <StateView kind="empty" title="这次训练已经不在了" detail="它可能已被删除，或者地址不对。" action="回到记录" onAction={() => nav('/log' + loc.search, { replace: true })} />
      </div>
    </Screen>
  );

  // 先回记录页、再删（同一次点击里批量更新，详情页不会闪出「已经不在了」），然后轻提示
  const del = () => {
    setConfirm(false);
    nav('/log' + loc.search, { replace: true });
    remove(id);
    toast.show(`已删除 ${d.title} 的训练`);
  };
  const best = d.prs[0];
  return (
    <Screen label={`${d.title} 训练详情`}>
      <TopBar title={d.title} sub={d.sub ? <span className={s.subName} style={drillName('num', id)}>{d.sub}</span> : undefined} onBack={back} titleStyle={drillName('name', id)}
        trailing={<IconButton kind="plain" icon="more" label="更多" onClick={() => setMenu(true)} />} />
      <div className={s.scroll} data-drill-ready="logdetail">
        <div className={s.body}>
          <div className={s.stats} role="group" aria-label="本次汇总">
            <div><span className="milo-text-caption">动作</span><Num size="m" value={d.stats.exercises} unit="个" /></div>
            <div><span className="milo-text-caption">组数</span><Num size="m" value={d.stats.sets} unit="组" /></div>
            <div><span className="milo-text-caption">总负荷</span><Num size="m" value={fmt(d.stats.load)} unit="kg" /></div>
          </div>

          {best && (
            <div className={s.pr}>
              <Tag tone="strong" icon="star">新纪录 {d.prs.length}</Tag>
              <span className={s.prText}>{best.name} 预估 1RM <b>{fmt(best.e1rm)} kg</b></span>
              {best.gain != null && best.gain > 0 && <Delta dir="up" value={`+${fmt(best.gain)} kg`} />}
            </div>
          )}

          {d.exercises.map((ex) => (
            <section key={ex.exerciseId} className={s.card} aria-label={ex.name}>
              <button type="button" className={`milo-press milo-focus ${s.head}`} aria-label={`查看${ex.name}的进步曲线`} onClick={() => nav(`/gains/${ex.exerciseId}${loc.search}`)}>
                <b className="milo-text-heading">{ex.name}</b>{ex.pr && <Tag tone="strong">PR</Tag>}<span className={s.grow} /><Icon name="chevron" small />
              </button>
              {ex.skipped ? <p className={`milo-text-caption ${s.skipped}`}>未做</p> : (
                <ul className={s.sets}>
                  {ex.sets.map((x, k) => {
                    const [w, unit] = x.weight.split(' ');
                    return (
                      <li key={k} className={x.type === 'warmup' ? s.warm : undefined}>
                        <span className={s.setName}>{x.type === 'warmup' ? <Tag tone="outline">热身</Tag> : <>第 {x.n} 组{x.type === 'drop' && <Tag tone="outline">递减</Tag>}</>}</span>
                        <span className={s.rpe}>{x.rpe != null ? `RPE ${x.rpe}` : ''}</span>
                        <span className={s.setVal}>
                          <b className={`milo-text-number-m ${s.wNum}`}>{w}</b><i className={s.unit}>{unit ?? ''}</i><i>×</i><b className={`milo-text-number-m ${s.rNum}`}>{x.reps}</b><i>次</i>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
      {menu && (
        <Sheet title="这次训练" meta={d.title} onClose={() => setMenu(false)}>
          <div className={s.menu}><Button kind="danger" icon="trash" onClick={() => { setMenu(false); setConfirm(true); }}>删除这次训练</Button></div>
        </Sheet>
      )}
      <Dialog open={confirm} onClose={() => setConfirm(false)} tone="danger" icon="trash" title="删除这次训练？" confirm="删除" onConfirm={del}>
        <p className={s.delWho}>{[d.title, d.sub.split(' · ')[0], `${d.stats.sets} 组`].filter(Boolean).join(' · ')}</p>
        <p className={s.delNote}>删除后，近 7 天容量、恢复度、趋势和新纪录都会重新计算，不能撤销。</p>
      </Dialog>
    </Screen>
  );
}
