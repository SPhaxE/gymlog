#!/usr/bin/env node
// 构建后把原型、mock 数据和设计稿拷进 dist/，让 Vercel 上 /prototype/、/design/stage3/ 继续可用。
// APK 不需要这些：MILO_TARGET=android 时跳过（public/ 里的动作视频与人体图由 Vite 自己带上）。
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

if (process.env.MILO_TARGET === 'android') {
  console.log('[copy_static] android 构建，跳过原型与设计稿');
  process.exit(0);
}
const root = new URL('..', import.meta.url).pathname;
for (const dir of ['prototype', 'mock', 'design']) {
  const src = join(root, dir);
  if (!existsSync(src)) continue;
  cpSync(src, join(root, 'dist', dir), { recursive: true, filter: (p) => !p.includes('/figma-plugin/') });
  console.log(`[copy_static] ${dir}/ → dist/${dir}/`);
}
