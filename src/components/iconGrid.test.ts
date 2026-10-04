/** 图标网格规范页（design/icon-grid/index.html）里导航五个图标的 d 必须和 App 用的 CUT 一模一样：规范页就是这几枚图标的出处 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CUT } from './iconSets';

const html = readFileSync(resolve(process.cwd(), 'design/icon-grid/index.html'), 'utf8');

describe('图标网格规范页', () => {
  for (const key of ['home', 'body', 'gains', 'log', 'me']) {
    it(`${key} 与 iconSets 一致`, () => {
      const m = html.match(new RegExp(`key: '${key}'[^]*?\\n\\s*d: '([^']+)'`));
      expect(m?.[1]).toBe(CUT[key]);
    });
  }
});
