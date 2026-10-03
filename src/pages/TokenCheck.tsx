import { Capacitor } from '@capacitor/core';
import tokens from '../../design/tokens/tokens.json';
import s from './TokenCheck.module.css';

const cssVar = (name: string) => `var(--milo-color-${name.replace('/', '-')})`;
const textClass = (name: string) => `milo-text-${name.toLowerCase().replace('/', '-')}`;
const SAMPLE: Record<string, string> = { Number: '13,854', Readout: '8 · 16 · 22 · 1:35' };

/** 管线检查页：语义色、文字样式、三种字体。只用 tokens.css 的变量与类名，不写任何数值。 */
export function TokenCheck() {
  const native = Capacitor.isNativePlatform();
  return (
    <main className={s.page}>
      <header>
        <h1 className="milo-text-title-l">慢牛 Milo · 管线检查</h1>
        <p className={`milo-text-caption ${s.meta}`}>
          {native ? 'Android 应用' : '网页'} · 提交 {__BUILD_COMMIT__} · 构建于 {__BUILD_TIME__.slice(0, 16).replace('T', ' ')} UTC
        </p>
      </header>

      <section className={s.accent}>
        <p className="milo-text-title-m">今天练 7 块肌肉 · 14 组</p>
        <p className="milo-text-number-hero">8/14</p>
      </section>

      <section className={s.type}>
        <h2 className="milo-text-heading">文字样式</h2>
        {tokens.textStyles.map((t) => (
          <div key={t.name} className={s.row}>
            <span className={`milo-text-micro ${s.tag}`}>{t.name}</span>
            <span className={textClass(t.name)}>{SAMPLE[t.name.split('/')[0]] ?? '中下胸 恢复 3% · 修复期'}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="milo-text-heading">语义色</h2>
        <div className={s.grid}>
          {Object.keys(tokens.semantic.color).map((k) => (
            <div key={k} className={s.swatch}>
              <div className={s.chip} style={{ background: cssVar(k) }} />
              <span className={`milo-text-micro ${s.name}`}>{k}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
