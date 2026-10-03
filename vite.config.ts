import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// fontsource 的可变字体族名带「 Variable」后缀；构建时去掉，让 tokens.css 里的字体名（唯一源头）直接生效
const fontAlias = (): Plugin => ({
  name: 'milo-font-alias',
  enforce: 'pre',
  transform(code, id) {
    if (!/@fontsource-variable[\\/].+\.css/.test(id)) return null;
    return code.replace(/font-family: '([^']+) Variable'/g, "font-family: '$1'");
  },
});

const commit = (() => {
  const env = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (env) return env.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; }
})();

export default defineConfig({
  plugins: [react(), fontAlias()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: { target: 'es2022', assetsInlineLimit: 0 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
