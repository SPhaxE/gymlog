import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import tokens from '../design/tokens/tokens.json';
import { App } from './App';
import { DEFAULT_PROFILE, store } from './data/store';

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
    expect(await screen.findByText('米洛（Milo）每天扛起一头小牛')).toBeInTheDocument();
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
