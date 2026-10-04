/** 把 Token 里的弹簧（motion/spring：stiffness 420, damping 32）换算成 CSS linear() 缓动 + 时长。
 *  欠阻尼解析解：x(t) = 1 − e^(−ζωt)(cos ω_d t + ζω/ω_d · sin ω_d t)；取到误差 < 0.002 为止。 */
import tokens from '../../design/tokens/tokens.json';

const spec = (tokens as unknown as { string: Record<string, { value: string }> }).string['motion/spring'].value;
const [k, c] = (spec.match(/[\d.]+/g) ?? ['420', '32']).map(Number);

export function springEasing(stiffness = k, damping = c, mass = 1) {
  const w = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass)), wd = w * Math.sqrt(Math.max(1e-6, 1 - z * z));
  const x = (t: number) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  let T = 0.05;
  while (T < 2 && Math.abs(1 - x(T)) + Math.exp(-z * w * T) > 0.002) T += 0.01;
  const n = 32, pts = Array.from({ length: n + 1 }, (_, i) => x((T * i) / n).toFixed(4));
  return { easing: `linear(${pts.join(', ')})`, ms: Math.round(T * 1000) };
}
export const SPRING = springEasing();
/** 更软的弹簧（交错入场、流体形变用）：同样从 Token 的刚度出发，阻尼减半，多一点过冲 */
export const SPRING_SOFT = springEasing(k * 0.6, c * 0.55);
