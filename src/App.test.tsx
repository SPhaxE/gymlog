import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens/tokens.json';
import { App } from './App';

describe('M1 管线检查页', () => {
  it('渲染标题、每个语义色和每个文字样式', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '慢牛 Milo · 管线检查' })).toBeInTheDocument();
    for (const k of Object.keys(tokens.semantic.color)) expect(screen.getByText(k)).toBeInTheDocument();
    for (const t of tokens.textStyles) expect(screen.getByText(t.name)).toBeInTheDocument();
  });
});
