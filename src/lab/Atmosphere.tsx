/** 氛围层候选（ref4 / ref5 / iconref2）：噪点颗粒 + 主题色弥散渐变。垫在 Screen 内容下面（ScreenAtmosphere）。
 *  颗粒用 canvas 生成一块灰度噪声贴图（只生成一次），平铺 + overlay 叠加，不用全屏 feTurbulence（手机上滚动时太贵）。 */
import { useMemo } from 'react';
import s from './lab.module.css';

let tile: string | null = null;
export function grainTile() {
  if (tile !== null || typeof document === 'undefined') return tile ?? '';
  const c = document.createElement('canvas'), n = 160;
  c.width = c.height = n;
  const ctx = c.getContext('2d');
  if (!ctx) return (tile = '');
  const img = ctx.createImageData(n, n);
  // 中灰附近的细颗粒：叠在暗处几乎不见，只在亮处显出质感
  for (let i = 0; i < img.data.length; i += 4) { const v = 64 + Math.random() * 128; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return (tile = c.toDataURL());
}

export type AtmosphereKind = 'none' | 'glow' | 'aurora' | 'ember' | 'hero';
export const ATMOSPHERES: [AtmosphereKind, string, string][] = [
  ['none', 'A0 现行', '纯暖黑，无颗粒'],
  ['glow', 'A1 角落荧光', 'ref4 左屏：左上一团荧光弥散 + 全屏细颗粒'],
  ['aurora', 'A2 双色弥散', 'ref5 卡片：右上荧光、左下骨白两团极淡的光 + 颗粒'],
  ['ember', 'A3 底部余烬', 'iconref2：从底边升起的暖光（主题色改成骨白偏荧光）+ 颗粒'],
  ['hero', 'A4 只给主角卡', 'ref5「Hello, Peter」：页面纯黑，只有主角卡带荧光噪点渐变'],
];

export function Atmosphere({ kind }: { kind: AtmosphereKind }) {
  const g = useMemo(() => grainTile(), []);
  if (kind === 'none' || kind === 'hero') return null;
  return (
    <>
      <div className={s[`atm_${kind}`]} />
      {/* 颗粒只铺在有光的地方（遮罩 = 同一组渐变），暗处保持干净 */}
      <div className={`${s.grain} ${s[`mask_${kind}`]}`} style={{ backgroundImage: g ? `url(${g})` : undefined }} />
    </>
  );
}
