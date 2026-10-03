#!/usr/bin/env node
// 附录 F：页面与组件里不许出现散落的颜色和尺寸，一律用 tokens.css 的变量与 .milo-text-* 类。
// 检查 src/pages、src/components 下的 .ts / .tsx / .css：#hex、rgb()/hsl()、px 字面量、ms 字面量。
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dirs = (process.argv.slice(2).length ? process.argv.slice(2) : ['src/pages', 'src/components']).map((d) => join(root, d));
const rules = [
  [/#[0-9a-fA-F]{3,8}\b/, '颜色字面量（用 var(--milo-color-*)）'],
  [/\b(?:rgba?|hsla?)\s*\(/, '颜色函数（用 var(--milo-color-*)）'],
  [/(?<![\w-])\d*\.?\d+px\b/, 'px 字面量（用 var(--milo-space-*) / var(--milo-size-*) 等）'],
  [/(?<![\w-])\d*\.?\d+ms\b/, '时长字面量（用 var(--milo-motion-*)）'],
];
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|css)$/.test(f) && !/\.test\.tsx?$/.test(f)) files.push(p); } };
dirs.filter(existsSync).forEach(walk);
const hits = [];
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, '');
    for (const [re, why] of rules) if (re.test(code)) hits.push(`${relative(root, f)}:${i + 1}  ${why}\n    ${line.trim()}`);
  });
}
if (hits.length) { console.error(`写死值检查：${hits.length} 处\n` + hits.join('\n')); process.exit(1); }
console.log(`写死值检查通过（${files.length} 个文件）`);
