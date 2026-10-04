import '@testing-library/jest-dom/vitest';

// jsdom 没有 ResizeObserver：给一个不触发回调的桩（布局在浏览器截图里验）
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
}

// vitest 没开 globals 时 Testing Library 不会自动清理
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(() => cleanup());
