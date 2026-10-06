/** 页面级数据态（ia 各页「边界情况」）：/patterns/loading · empty · error。阶段 6 每页都要覆盖这三种。 */
import { Nav, PageHeader, Screen, StateView, type Tab } from '../components';
import s from './Shell.module.css';

export function Pattern({ kind, onTab }: { kind: string; onTab: (t: Tab, path: string) => void }) {
  const k = kind === 'empty' || kind === 'error' ? kind : 'loading';
  return (
    <Screen label="数据态">
      <PageHeader title="记录"><p className="milo-text-caption">数据态：{k === 'loading' ? '加载中' : k === 'empty' ? '空' : '错误'}</p></PageHeader>
      <div className={s.stub}>
        {k === 'loading' && <StateView kind="loading" />}
        {k === 'empty' && <StateView kind="empty" title="还没有训练记录" detail="练完第一次，这里会按时间列出来" action="去看今日处方" onAction={() => onTab('home', '/today')} />}
        {k === 'error' && <StateView kind="error" title="历史没读出来" detail="本地存储读取失败，数据没有被改动" action="重试" />}
      </div>
      <Nav selected="log" progress={null} onSelect={onTab} />
    </Screen>
  );
}
