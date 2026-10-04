/** 刻度分隔线（视觉语言 v2）：做分隔和量尺用，不做装饰。向右渐隐。 */
import s from './Ticks.module.css';

export function Ticks() {
  return <div className={s.ticks} aria-hidden="true" />;
}
