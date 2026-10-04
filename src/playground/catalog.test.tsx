/** 阶段 5 门禁：组件预览页覆盖全部组件 × 全部交互态。
 *  1. components/index.ts 的每个可见组件都在目录里（或在 NOT_IN_MATRIX 写明原因）；
 *  2. 每个变体都能渲染，不报错；
 *  3. 有 state 轴的组件，按下 / 聚焦 / 禁用真的落到 DOM 上（data-pressed / data-focus / disabled）。 */
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import * as lib from '../components';
import { CATALOG, NOT_IN_MATRIX, TOTAL, variants } from './catalog';
import { fixtures } from './fixtures';

const NOW = Date.UTC(2026, 9, 3, 10);
// 人体图在 jsdom 里从 public/ 读
vi.stubGlobal('fetch', async (url: string) => ({ json: async () => JSON.parse(readFileSync(resolve(process.cwd(), 'public', String(url).replace(/^\//, '')), 'utf8')) }));

const NOT_COMPONENTS = new Set(['ScreenAtmosphere', 'BodyRender', 'heatCss', 'heatOf', 'grainTile', 'installGrain', 'dotMonths', 'ICONS', 'TABS', 'OverlayHost', 'Portal', 'ToastProvider', 'handleBack', 'useBackHandler', 'useToast', 'useCountdown', 'forced', 'clock']);

describe('Playground 目录', () => {
  it('覆盖 components/index.ts 的每个组件', () => {
    const covered = new Set(CATALOG.flatMap((e) => [e.name, ...(e.covers ?? [])]));
    const missing = Object.keys(lib).filter((k) => !NOT_COMPONENTS.has(k) && !covered.has(k) && !(k in NOT_IN_MATRIX));
    expect(missing).toEqual([]);
  });
  it('名字不重复，变体键不重复', () => {
    const names = CATALOG.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    const keys = CATALOG.flatMap((e) => variants(e).map((v) => v.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(TOTAL()).toBe(keys.length);
  });
  const f = fixtures(NOW);
  for (const e of CATALOG) {
    it(`${e.name}：${variants(e).length} 个变体都能渲染`, () => {
      for (const v of variants(e)) {
        const { container, unmount } = render(<>{e.render(v.props, f)}</>);
        expect(container.childElementCount, v.key).toBeGreaterThan(0);
        const state = v.props.state ?? v.props.item;
        if (state === 'pressed') expect(container.querySelector('[data-pressed]'), v.key).not.toBeNull();
        if (state === 'focused') expect(container.querySelector('[data-focus]'), v.key).not.toBeNull();
        if (state === 'disabled') expect(container.querySelector(':disabled, .milo-disabled, [aria-disabled="true"]'), v.key).not.toBeNull();
        if (state === 'loading') expect(container.querySelector('[aria-busy="true"]'), v.key).not.toBeNull();
        unmount();
      }
    });
  }
});
