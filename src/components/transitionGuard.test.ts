import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guardTransitionTaps } from './motion';

/** 转场中点按不丢：Chrome 里 View Transitions 进行时点击落在 <html>；guard 在按下时打断转场，并把那一下点击改投给坐标处的真元素 */
describe('guardTransitionTaps', () => {
  let skip: ReturnType<typeof vi.fn>, finish: () => void, btn: HTMLButtonElement, clicked: number;
  beforeEach(() => {
    skip = vi.fn();
    const d = document as unknown as { startViewTransition?: unknown; elementFromPoint: unknown };
    d.startViewTransition = () => ({ finished: new Promise<void>((r) => { finish = r; }), skipTransition: skip });
    btn = document.body.appendChild(document.createElement('button')); clicked = 0;
    btn.addEventListener('click', () => { clicked++; });
    d.elementFromPoint = () => btn;
    (window as unknown as { __tapGuard?: boolean }).__tapGuard = false;
  });
  afterEach(() => { btn.remove(); delete (document as unknown as { startViewTransition?: unknown }).startViewTransition; });

  const down = (target: EventTarget) => target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 6 }));
  const click = (target: EventTarget) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 5, clientY: 6 }));

  it('转场在跑、按在 <html> 上：打断转场，随后落在 <html> 的 click 改投给真元素', () => {
    guardTransitionTaps();
    (document as unknown as { startViewTransition: () => unknown }).startViewTransition();
    down(document.documentElement);
    expect(skip).toHaveBeenCalledTimes(1);
    click(document.documentElement);
    expect(clicked).toBe(1);
  });
  it('转场没在跑：不插手', () => {
    guardTransitionTaps();
    down(document.documentElement); click(document.documentElement);
    expect(skip).not.toHaveBeenCalled(); expect(clicked).toBe(0);
  });
  it('转场结束后按下：不插手', async () => {
    guardTransitionTaps();
    (document as unknown as { startViewTransition: () => unknown }).startViewTransition();
    finish(); await new Promise((r) => setTimeout(r, 0));
    down(document.documentElement); click(document.documentElement);
    expect(skip).not.toHaveBeenCalled(); expect(clicked).toBe(0);
  });
  it('按在真元素上（转场里页面本来点得到）：不拦', () => {
    guardTransitionTaps();
    (document as unknown as { startViewTransition: () => unknown }).startViewTransition();
    down(btn); click(btn);
    expect(skip).not.toHaveBeenCalled(); expect(clicked).toBe(1);
  });
});
