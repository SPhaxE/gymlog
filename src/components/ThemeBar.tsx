/** 全局主题开关（2026-10-10 用户：把 /preview 与 /playground 的深浅切换改成最前面的全局设置）：固定在页面右上角，永远在最前；
 *  切的是整页的全局主题（<html data-theme>，同「我的 → 外观」，会记住），各格里固定深 / 浅的格子（标了「深色方案」「固定浅色」）不跟着变。只给 /preview、/playground 这类内部页用。
 *  切换和 App 里一样放液态转场（themeSwap，地址栏 ?route= &ramp= 可换组合）；App 里深浅切换只有「我的 → 主题」一个入口。 */
import { useTheme } from '../styles/theme';
import { switchTheme } from './themeSwap';
import { Segmented } from './Segmented';
import s from './ThemeBar.module.css';

export function ThemeBar() {
  const theme = useTheme();
  return (
    <div className={s.bar} role="group" aria-label="全局主题">
      <span className="milo-text-label">全局主题</span>
      <Segmented label="全局主题" items={[['dark', '深色'], ['light', '浅色']] as const} value={theme} onChange={(v) => switchTheme(v)} />
    </div>
  );
}
