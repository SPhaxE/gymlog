import { describe, expect, it } from 'vitest';
import { backAction } from './back';

describe('Android 返回键（ia §3）', () => {
  it('悬浮层优先', () => expect(backAction('/body', true)).toBe('overlay'));
  it('训练中、结算回首页', () => { expect(backAction('/session', false)).toBe('home'); expect(backAction('/summary/s-1', false)).toBe('home'); });
  it('首页退出 App', () => { expect(backAction('/today', false)).toBe('exit'); expect(backAction('/', false)).toBe('exit'); });
  it('其余 4 个 Tab 根页回首页', () => { for (const p of ['/body', '/gains', '/log', '/me', '/log/']) expect(backAction(p, false)).toBe('home'); });
  it('子页返回上一页', () => { expect(backAction('/gains/barbell-bench-press-4', false)).toBe('pop'); });
});
