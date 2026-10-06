import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deloadInfo, sourceOf } from './demo';
import { adoptDeload, skipDeload } from './deload';
import { store } from './store';
import { useSource } from './useSource';
import { DAY } from '../engine';

// 同 scenarios.test.ts：一天里三个时刻都要成立；这里取傍晚
const NOW = new Date(2026, 9, 3, 20.5).getTime();

/** 把「建议减量」场景的历史灌进存储，模拟一个真实用户 */
function seed() {
  const sc = sourceOf('deload-suggested', NOW);
  store.update((s) => ({ ...s, history: sc.history, profile: sc.profile, deload: { status: 'none', atMs: 0 } }));
}
const view = (now = NOW) => { const s = store.get(); return deloadInfo({ history: s.history, deload: s.deload }, now).dv; };

beforeEach(() => { localStorage.clear(); store.clear(); seed(); });
afterEach(() => vi.restoreAllMocks());

describe('减量：采纳 / 这次不减（ia §1.2 规则 8）', () => {
  it('一开始是「建议减量」', () => expect(view().kind).toBe('suggest'));
  it('采纳 → 减量周，还剩 6 天；过 6 天回到建议', () => {
    adoptDeload(NOW);
    expect(view()).toEqual({ kind: 'week', daysLeft: 6 });
    expect(view(NOW + 3 * DAY)).toEqual({ kind: 'week', daysLeft: 3 });
    expect(view(NOW + 7 * DAY).kind).toBe('suggest');
  });
  it('这次不减 → 6 天内只剩一行小字，之后重新建议', () => {
    skipDeload(NOW);
    expect(view()).toEqual({ kind: 'note', daysLeft: 6 });
    expect(view(NOW + 5 * DAY).kind).toBe('note');
    expect(view(NOW + 7 * DAY).kind).toBe('suggest');
  });
  it('写入失败不静默：saveError 有值，内存里的状态照样更新', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('配额满了'); });
    adoptDeload(NOW);
    expect(store.get().saveError).toContain('配额');
    expect(store.get().deload.status).toBe('adopted');
  });
});

describe('useSource：演示场景里减量操作只改本页内存，不写存储', () => {
  it('场景里点采纳 → 减量周，存储不变', () => {
    const { result } = renderHook(() => useSource('deload-suggested', NOW));
    expect(deloadInfo(result.current.src, NOW).dv.kind).toBe('suggest');
    act(() => result.current.adopt());
    expect(deloadInfo(result.current.src, NOW).dv).toEqual({ kind: 'week', daysLeft: 6 });
    expect(store.get().deload.status).toBe('none');
  });
  it('场景里点这次不减 → 小字，存储不变', () => {
    const { result } = renderHook(() => useSource('deload-suggested', NOW));
    act(() => result.current.skip());
    expect(deloadInfo(result.current.src, NOW).dv.kind).toBe('note');
    expect(store.get().deload.status).toBe('none');
  });
  it('真用户：采纳写进存储，页面数据跟着变', () => {
    const { result } = renderHook(() => useSource(undefined, Date.now()));
    act(() => result.current.adopt());
    expect(store.get().deload.status).toBe('adopted');
    expect(result.current.src.deload.status).toBe('adopted');
  });
});
