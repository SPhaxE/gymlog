/** 交互态（DESIGN §9.1）：代码里 Pressed / Focused 是 :active / :focus-visible；
 *  Playground 要把它们静态摆出来，所以组件接受 state，转成 data-pressed / data-focus，与伪类共用同一套样式（interactive.css）。 */
export type Forced = 'pressed' | 'focused' | undefined;

export function forced(state: Forced): { 'data-pressed'?: ''; 'data-focus'?: '' } {
  return state === 'pressed' ? { 'data-pressed': '' } : state === 'focused' ? { 'data-focus': '' } : {};
}

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
