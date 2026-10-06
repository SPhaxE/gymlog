/** 导航单独一个组件：休息倒计时每 200 毫秒刷新一次，只重画导航，不连累整页的长列表（增量页 19 行曲线、记录页几十行训练；
 *  CI 上整页重画会把页面拖到卡死）。5 个 Tab 根页的导航都读 useTrainingNav（训练中切 Tab 也看得到进度与休息）。 */
import { Nav, type Tab } from '../components';
import { useTrainingNav } from '../data/useTrainingNav';

export function TabNav({ selected, scenario, now, onTab }: { selected: Tab; scenario?: string; now: number; onTab?: (tab: Tab, path: string) => void }) {
  const navState = useTrainingNav(scenario, 0, now);
  return <Nav selected={selected} {...navState} onSelect={onTab} />;
}
