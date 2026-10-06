import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import tokens from '../design/tokens/tokens.json';
import { App } from './App';
import { DEFAULT_PROFILE, demoState, store } from './data/store';

describe('M1 管线检查页（/check）', () => {
  it('渲染标题、每个语义色和每个文字样式', async () => {
    window.history.pushState({}, '', '/check');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '慢牛 Milo · 管线检查' })).toBeInTheDocument();
    for (const k of Object.keys(tokens.semantic.color)) expect(screen.getByText(k)).toBeInTheDocument();
    for (const t of tokens.textStyles) expect(screen.getByText(t.name)).toBeInTheDocument();
  });
});

describe('首次打开（阶段 6a）', () => {
  it('没建档：进故事引导，「跳过」进建档第 1 步，一路默认到「生成第一份处方」进首页', async () => {
    store.clear();
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByText('两千五百年前，有个扛牛的人')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/onboarding');
    screen.getByRole('button', { name: '跳过' }).click();
    expect(await screen.findByText('你练了多久？')).toBeInTheDocument();
    expect(store.get().draft?.step).toBe(1);
    screen.getByRole('button', { name: '下一步' }).click();
    expect(await screen.findByText('能用到哪些器械？')).toBeInTheDocument();
    screen.getByRole('button', { name: '下一步' }).click();
    expect(await screen.findByText('一次练多久？')).toBeInTheDocument();
    screen.getByRole('button', { name: '生成第一份处方' }).click();
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/today');
    expect(store.get().profile).toEqual(DEFAULT_PROFILE);
    expect(store.get().draft).toBeNull();
  });
});

describe('首页即打卡（2026-10-06：取消独立训练页）', () => {
  it('开始训练留在首页；打卡一组 → 休息开始：首页计时在主按钮旁（导航不重复），切到别的 Tab 计时在导航滑块；结束 → 结算页', async () => {
    store.clear();
    store.update((x) => ({ ...x, ...demoState(Date.now()), draft: null }));
    window.history.pushState({}, '', '/today');
    render(<App />);
    (await screen.findByRole('button', { name: '开始训练' })).click();
    const check = await screen.findByRole('button', { name: /^打卡 · 第 1 组/ });
    expect(window.location.pathname).toBe('/today');
    check.click();
    await screen.findByRole('button', { name: /^打卡 · 第 2 组/ });
    expect(store.get().active?.entries[0].rows[0].done).toBe(true);
    expect(store.get().rest).not.toBeNull();
    // 首页只有一个计时器：主按钮旁的胶囊；导航上不重复显示
    expect(screen.getByRole('button', { name: /组间休息剩余/ })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '主导航' }).querySelector('[aria-current="page"]')?.getAttribute('aria-label') ?? '').not.toMatch(/休息剩余/);
    // 切到增量页：计时到了导航滑块上
    screen.getByRole('link', { name: /增量/ }).click();
    // 换 Tab 要重新渲染整页（CI 机器上可能超过默认 1 秒），放宽等待
    await screen.findByRole('link', { name: /增量，休息剩余/ }, { timeout: 5000 });
    screen.getByRole('link', { name: /首页/ }).click();
    await screen.findByRole('button', { name: /组间休息剩余/ }, { timeout: 5000 });
    screen.getByRole('button', { name: '结束' }).click();
    (await screen.findByRole('button', { name: '结束并结算' })).click();
    await screen.findByText('练完了');
    expect(window.location.pathname).toMatch(/^\/summary\//);
    expect(store.get().active).toBeNull();
  });
  it('旧地址 /session 回首页', async () => {
    store.update((x) => ({ ...x, profile: DEFAULT_PROFILE, draft: null }));
    window.history.pushState({}, '', '/session');
    render(<App />);
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/today');
  });
});

describe('/demo（第一版实机演示）', () => {
  it('窄屏：清空数据后全屏进故事引导', async () => {
    store.update((x) => ({ ...x, profile: DEFAULT_PROFILE }));
    window.history.pushState({}, '', '/demo');
    render(<App />);
    expect(await screen.findByText('两千五百年前，有个扛牛的人')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/onboarding');
    expect(store.get().profile).toBeNull();
  });
});

describe('App 壳：5 个 Tab', () => {
  beforeEach(() => store.update((s) => ({ ...s, profile: DEFAULT_PROFILE, draft: null })));
  it('根路径进首页，导航有 5 项且首页为当前页', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const nav = await screen.findByRole('navigation', { name: '主导航' });
    const links = nav.querySelectorAll('a');
    expect([...links].map((a) => a.getAttribute('href'))).toEqual(['/today', '/body', '/gains', '/log', '/me']);
    expect(nav.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe('/today');
    expect(window.location.pathname).toBe('/today');
  });
  it('旧地址 /explore/home 重定向到 /today', async () => {
    window.history.pushState({}, '', '/explore/home');
    render(<App />);
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/today');
  });
});

describe('动作进步曲线页（/gains/:exerciseId）', () => {
  it('演示场景：显示动作名、大数字、下次目标和最近几次；点明细的一行换成那一天', async () => {
    window.history.pushState({}, '', '/gains/dumbbell-incline-bench-press-398?scenario=plain-prescription');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '上斜哑铃卧推' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '下次目标' })).toBeInTheDocument();
    const rows = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.getAttribute('aria-pressed') != null);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].getAttribute('aria-pressed')).toBe('true');
    rows[1].click();
    await waitFor(() => expect(rows[1].getAttribute('aria-pressed')).toBe('true'));
    expect(rows[0].getAttribute('aria-pressed')).toBe('false');
  });
  it('动作不存在：提示找不到，给回增量页的按钮', async () => {
    window.history.pushState({}, '', '/gains/not-an-exercise?scenario=plain-prescription');
    render(<App />);
    expect(await screen.findByText('找不到这个动作')).toBeInTheDocument();
    screen.getByRole('button', { name: '回增量页' }).click();
    await waitFor(() => expect(window.location.pathname).toBe('/gains'));
  });
});
