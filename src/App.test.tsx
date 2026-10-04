import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens/tokens.json';
import { App } from './App';

describe('M1 管线检查页（/check）', () => {
  it('渲染标题、每个语义色和每个文字样式', async () => {
    window.history.pushState({}, '', '/check');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '慢牛 Milo · 管线检查' })).toBeInTheDocument();
    for (const k of Object.keys(tokens.semantic.color)) expect(screen.getByText(k)).toBeInTheDocument();
    for (const t of tokens.textStyles) expect(screen.getByText(t.name)).toBeInTheDocument();
  });
});

describe('App 壳：5 个 Tab', () => {
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
