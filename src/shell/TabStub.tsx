/** 阶段 6 才搭的 Tab 根页：先用规范组件占位，说明这一页回答什么问题、按哪张线框搭。 */
import { Button, Nav, PageHeader, Screen, StateView, type Tab } from '../components';
import { useTrainingNav } from '../data/useTrainingNav';
import s from './Shell.module.css';

const INFO: Record<string, { title: string; q: string; wf: string }> = {
  gains: { title: '增量', q: '力量有没有在涨、下一次加多少、该不该减量', wf: 'gains-W2：按引擎结论分组成「该加重 / 保持 / 该减重」' },
  log: { title: '记录', q: '过去每次练了什么', wf: 'log-W1：按周分组的列表，带每周合计' },
  me: { title: '我的', q: '我的档案和设置', wf: 'me-W2：档案四项大格子 + 分组设置列表' },
};

export function TabStub({ tab, onTab }: { tab: Tab; onTab: (t: Tab, path: string) => void }) {
  const i = INFO[tab], navState = useTrainingNav(undefined, 0);
  return (
    <Screen label={i.title}>
      <PageHeader title={i.title} />
      <div className={s.stub}>
        <StateView kind="empty" title="阶段 6 搭建" detail={`这一页回答：${i.q}。线框 ${i.wf}。`} />
        <a className={s.stubLink} href="/playground"><Button kind="ghost" size="s">看组件与交互态</Button></a>
      </div>
      <Nav selected={tab} {...navState} onSelect={onTab} />
    </Screen>
  );
}
