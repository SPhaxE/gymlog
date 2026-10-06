import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveTextFile } from './exportFile';

describe('保存文件（网页）', () => {
  afterEach(() => vi.restoreAllMocks());
  it('用 a[download] 触发下载，内容和文件名原样（带 BOM 的中文 CSV）', async () => {
    let blob: Blob | null = null;
    Object.assign(URL, { createObjectURL: vi.fn((b: Blob) => { blob = b; return 'blob:milo'; }), revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { expect(this.download).toBe('milo-训练记录-2026-10-06.csv'); expect(this.href).toBe('blob:milo'); });
    const r = await saveTextFile('milo-训练记录-2026-10-06.csv', '﻿日期,动作\r\n');
    expect(r).toBe('saved');
    expect(click).toHaveBeenCalledOnce();
    expect(blob!.type).toBe('text/csv;charset=utf-8');
    const bytes = await new Promise<ArrayBuffer>((ok) => { const r = new FileReader(); r.onload = () => ok(r.result as ArrayBuffer); r.readAsArrayBuffer(blob!); });
    expect(new Uint8Array(bytes).slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));   // UTF-8 BOM：Excel 才认得中文
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes)).toBe('\uFEFF日期,动作\r\n');
    expect(document.querySelector('a[download]')).toBeNull();   // 不留隐藏链接
  });
});
