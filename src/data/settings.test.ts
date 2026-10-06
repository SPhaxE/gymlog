import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prescribe } from '../engine';
import { env } from './demo';
import { completeSet, setField, startSession } from './session';
import { setSettings } from './settings';
import { DEFAULT_SETTINGS, demoState, STORE_KEY, store } from './store';
import { useRestEndBuzz } from './useRestEndBuzz';
import { useTrainingNav } from './useTrainingNav';

const NOW = new Date(2026, 9, 6, 18, 0).getTime();

describe('导航设置（ia §1.11）：存储', () => {
  beforeEach(() => { localStorage.clear(); store.clear(); });

  it('默认全开，休息结束 = 结束态 + 振动', () => {
    expect(store.get().settings).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ ring: true, restOutline: true, restEnd: 'vibrate' });
  });
  it('改一项就写入，别的项不动；重新读也在', () => {
    setSettings({ ring: false });
    expect(store.get().settings).toEqual({ ...DEFAULT_SETTINGS, ring: false });
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!).settings.ring).toBe(false);
    store.reload();
    expect(store.get().settings.ring).toBe(false);
  });
  it('旧存档没有 settings、或只有一部分：缺的项补默认，不用迁移', () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, profile: null, draft: null, history: [], deload: { status: 'none', atMs: 0 }, active: null, rest: null, demo: false }));
    store.reload();
    expect(store.get().settings).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, history: [], settings: { restEnd: 'outline' } }));
    store.reload();
    expect(store.get().settings).toEqual({ ...DEFAULT_SETTINGS, restEnd: 'outline' });
    expect(store.get().deloads).toEqual([]);
  });
  it('旧存档没有「看过消息的时刻」：从读出来这一刻起算，不把历史消息全算成新的；有的原样；空存档是 0', () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, history: [] }));
    store.reload();
    expect(store.get().messagesSeenAt).toBeGreaterThan(Date.now() - 60e3);
    localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, history: [], messagesSeenAt: 5 }));
    store.reload();
    expect(store.get().messagesSeenAt).toBe(5);
    store.clear();
    expect(store.get().messagesSeenAt).toBe(0);
  });
  it('清除全部数据：设置也回到默认', () => {
    setSettings({ ring: false, restEnd: 'outline' });
    store.clear();
    expect(store.get().settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('导航设置：导航读到的状态', () => {
  /** 训练进行中、刚完成第 1 组、休息还剩 60 秒 */
  function training() {
    localStorage.clear(); store.clear();
    store.update((s) => ({ ...s, ...demoState(NOW) }));
    const st = store.get(), rx = prescribe(env, st.history, st.profile!, { now: NOW });
    if (rx.kind !== 'plan') throw new Error('演示用户今天应当有处方');
    startSession(rx, Date.now());
    setField(0, 0, 'weight', '80');
    completeSet(0, 0, Date.now());
    store.update((s) => ({ ...s, rest: { endAt: Date.now() + 60e3, totalMs: 90e3 } }));
  }
  const nav = () => renderHook(() => useTrainingNav(undefined, 0)).result.current;

  it('默认：外圈有进度，休息中写剩余时间并带描边所需的结束时间', () => {
    training();
    const n = nav();
    expect(n.progress).toBeGreaterThan(0);
    expect(n.started).toBe(true);
    expect(n.rest).toMatch(/^\d+:\d\d$/);
    expect(n.restEndAt).toBeGreaterThan(Date.now());
    expect(n.restTotalMs).toBe(90e3);
  });
  it('关掉今日进度环：不画外圈（progress 为空），休息照样走', () => {
    training(); setSettings({ ring: false });
    const n = nav();
    expect(n.progress).toBeNull();
    expect(n.started).toBeUndefined();
    expect(n.rest).toMatch(/^\d+:\d\d$/);
    expect(n.restEndAt).toBeGreaterThan(0);
  });
  it('关掉休息倒计时描边：选中项仍写剩余时间，但没有描边要的结束时间；外圈照常', () => {
    training(); setSettings({ restOutline: false });
    const n = nav();
    expect(n.rest).toMatch(/^\d+:\d\d$/);
    expect(n.restEndAt).toBeUndefined();
    expect(n.restTotalMs).toBeUndefined();
    expect(n.progress).toBeGreaterThan(0);
  });
  it('演示场景（?scenario=）不读存储，也不受设置影响', () => {
    setSettings({ ring: false });
    expect(renderHook(() => useTrainingNav('plain-prescription', 0)).result.current).toEqual({ progress: 0 });
  });
});

describe('休息结束提示：振动（挂在外壳上，哪一页都振）', () => {
  const buzz = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers(); localStorage.clear(); store.clear(); buzz.mockClear();
    Object.defineProperty(navigator, 'vibrate', { value: buzz, configurable: true });
  });
  afterEach(() => { vi.useRealTimers(); });
  const run = (endInMs: number) => {
    store.update((s) => ({ ...s, rest: { endAt: Date.now() + endInMs, totalMs: 90e3 } }));
    renderHook(() => useRestEndBuzz());
    act(() => { vi.advanceTimersByTime(3e3); });
  };

  it('默认（描边 + 振动）：倒计时走完振一次', () => {
    run(1e3);
    expect(buzz).toHaveBeenCalledTimes(1);
  });
  it('选「仅描边」：不振', () => {
    setSettings({ restEnd: 'outline' });
    run(1e3);
    expect(buzz).not.toHaveBeenCalled();
  });
  it('切后台回来才发现早就结束了：不补振', () => {
    run(-60e3);
    expect(buzz).not.toHaveBeenCalled();
  });
});
