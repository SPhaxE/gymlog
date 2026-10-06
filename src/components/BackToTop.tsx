/** 回到顶端（2026-10-06 用户：全局过长的页面都要一键回到顶端）。
 *  - 传入页面的滚动容器；滚过一屏才出现（不到两屏长的页永远不出现），回到上面就收起；
 *  - 右下角拇指区、导航上方，命中 48；有固定主按钮的页（首页）用 lift 抬到主按钮上面，不挡主操作；
 *  - 出现 / 收起：从下往上弹入 + 微缩放（spring-soft），按下 M08；点了平滑滚回顶（减少动态效果时直接跳）；
 *  - 中性配色（凸起底 + 发丝线 + 骨白箭头），不用荧光——荧光每屏只给一处。 */
import { useEffect, useState, type RefObject } from 'react';
import { Icon } from './Icon';
import { cx } from './state';
import s from './BackToTop.module.css';

/** 滚过「可视高度 × SHOW」才出现 */
export const BACK_TO_TOP_SHOW = 1;

export function BackToTop({ target, lift, forceShown }: { target: RefObject<HTMLElement | null>; /** 抬高：下面有固定主按钮时 */ lift?: boolean; /** 静态展示（playground）：强制出现 */ forceShown?: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const on = () => setShown(el.scrollTop > el.clientHeight * BACK_TO_TOP_SHOW);
    on();
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, [target]);
  const vis = forceShown || shown;
  const top = () => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.current?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };
  return (
    <button type="button" className={cx('milo-press milo-focus', s.btn, vis && s.shown, lift && s.lift)} onClick={top}
      aria-label="回到顶端" aria-hidden={vis ? undefined : true} tabIndex={vis ? 0 : -1}>
      <Icon name="up" />
    </button>
  );
}
