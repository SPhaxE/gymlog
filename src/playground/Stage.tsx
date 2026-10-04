/** 迷你屏幕：360 宽的一块手机屏，自带悬浮层宿主与 Toast 队列。
 *  用 transform 建立包含块，页面里 position: fixed 的 Screen / 导航就停在这块屏幕里，所以整页也能放进来演示。 */
import { useState, type ReactNode } from 'react';
import { OverlayHost, ToastProvider, ToastViewport } from '../components';
import s from './Playground.module.css';

export function Stage({ children, tall, short, label }: { children: ReactNode; tall?: boolean; short?: boolean; label?: string }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <ToastProvider>
      <OverlayHost.Provider value={host}>
        <div className={tall ? s.stageTall : short ? s.stageShort : s.stage} aria-label={label}>
          <div className={s.stageBody}>{children}</div>
          <div ref={setHost} className={s.stageLayer}><ToastViewport /></div>
        </div>
      </OverlayHost.Provider>
    </ToastProvider>
  );
}
