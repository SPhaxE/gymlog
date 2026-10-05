/** 道具图标（2026-10-05 用户：冻结卡等道具用 LOGO 变体，自己设计）：全部由标志「递增条牛头」变出来，48 画布，骨白 + 荧光两色。
 *  - freeze 冻结卡：牛头冻在一块冰里——圆角冰块（半透明骨白）+ 两道冰面高光 + 角上一颗六角冰晶；条变暗（冻住了），角仍是荧光。
 *    used = 冰块化开一角、荧光漫进来（这周连胜保住了）。
 *  - niujin 牛劲：荧光硬币，牛头压印在币面（深色条），外圈一道齿纹。
 *  - trial Pro 体验：通行证卡片，上半是牛头，下半写 PRO 7。
 *  - shipping 免邮：纸箱正面印着牛头，一条荧光封箱带竖穿过去，左边三道速度线。
 *  - merchant 商家券：吊牌，穿孔 + 牛头，右下角一个荧光折角。
 *  dim = 已用 / 过期：整体降到禁用色。 */
import { MarkBars } from './Logo';
import s from './PropGlyph.module.css';

export type PropKind = 'freeze' | 'niujin' | 'trial' | 'shipping' | 'merchant';
export const PROP_NAME: Record<PropKind, string> = { freeze: '冻结卡', niujin: '牛劲', trial: 'Pro 体验', shipping: '免邮券', merchant: '商家券' };

/** 牛头放进 48 画布里的 (cx, cy) 处，缩放 k */
const Head = ({ cx, cy, k }: { cx: number; cy: number; k: number }) => (
  <g transform={`translate(${cx - 24 * k} ${cy - 23 * k}) scale(${k})`}><MarkBars small={k < 0.6} /></g>
);

export function PropGlyph({ kind, used, dim, className, title }: { kind: PropKind; used?: boolean; dim?: boolean; className?: string; title?: string }) {
  return (
    <svg className={`${className ?? s.glyph} ${s.prop} ${s[kind]} ${used ? s.used : ''} ${dim ? s.dim : ''}`} viewBox="0 0 48 48"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {kind === 'freeze' && <>
        <rect className={s.ice} x="5" y="6" width="38" height="38" rx="9" />
        {used && <path className={s.melt} d="M5 31c5-3 10 2 15-1s9 3 14 0 6-2 9-1v6a9 9 0 0 1-9 9H14a9 9 0 0 1-9-9z" />}
        <g className={s.frozen}><Head cx={24} cy={28} k={0.56} /></g>
        <path className={s.glint} d="M9.5 15l4.5-4.5M9.5 19.5l2-2" />
        <g className={s.crystal} transform="translate(39 9)"><path d="M0-5v10M-4.3-2.5l8.6 5M-4.3 2.5l8.6-5" /></g>
      </>}
      {kind === 'niujin' && <>
        <circle className={s.coin} cx="24" cy="24" r="20" />
        <circle className={s.coinEdge} cx="24" cy="24" r="17" />
        <g className={s.stamp}><Head cx={24} cy={25} k={0.58} /></g>
      </>}
      {kind === 'trial' && <>
        <rect className={s.card} x="9" y="3" width="30" height="42" rx="6" />
        <circle className={s.hole} cx="24" cy="8.5" r="1.6" />
        <Head cx={24} cy={22} k={0.5} />
        <text className={s.pro} x="24" y="40" fontSize="8" textAnchor="middle">PRO 7</text>
      </>}
      {kind === 'shipping' && <>
        <path className={s.speedLines} d="M1 22h6M2 28h5M3 34h4" />
        <path className={s.boxTop} d="M11 14l4-7h22l4 7z" />
        <rect className={s.box} x="11" y="14" width="30" height="28" rx="2.5" />
        <rect className={s.tape} x="23.5" y="7" width="5" height="12" />
        <Head cx={26} cy={30} k={0.42} />
      </>}
      {kind === 'merchant' && <>
        <path className={s.tag} d="M14 4h20a4 4 0 0 1 4 4v28L24 45 10 36V8a4 4 0 0 1 4-4z" />
        <circle className={s.hole} cx="24" cy="10" r="2.2" />
        <Head cx={24} cy={25} k={0.48} />
        <path className={s.corner} d="M30 4h4a4 4 0 0 1 4 4v4z" />
      </>}
    </svg>
  );
}
