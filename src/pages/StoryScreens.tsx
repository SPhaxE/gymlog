/** 故事引导 3 屏（ia §1.13）：讲米洛（Milo）扛小牛的故事，IP 小牛第一次出场。右上角始终可以「跳过」。
 *  版式按线框选定方向（阶段 6a 门禁）；减少动态效果时插画静止、只淡入。 */
import { useState } from 'react';
import { Button, Mascot, Screen, type MascotStage } from '../components';
import s from './StoryScreens.module.css';

const STORY: [string, string, MascotStage][] = [
  ['米洛（Milo）每天扛起一头小牛', '古希腊的大力士，每天扛着同一头小牛走一圈。', 'newborn'],
  ['小牛长大，他也变强', '小牛每天只重一点点，他每天也只多扛一点点。', 'sturdy'],
  ['Milo 告诉你：下一组，该加多少', '每次只多一点，慢慢变牛。这就是渐进超负荷。', 'bull'],
];

export function StoryScreens({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [h, b, stage] = STORY[i];
  return (
    <Screen label={`故事 第 ${i + 1} 屏，共 3 屏`}>
      <div className={s.top}><button type="button" className={`milo-focus ${s.skip}`} onClick={onDone}>跳过</button></div>
      <div className={s.stage} key={i}><Mascot stage={stage} mood={i === 2 ? 'happy' : 'idle'} animate /></div>
      <div className={s.text} key={`t${i}`}>
        <h1 className="milo-text-title-l">{h}</h1>
        <p className="milo-text-body">{b}</p>
      </div>
      <div className={s.dots} aria-hidden="true">{STORY.map((_, k) => <i key={k} className={k === i ? s.on : undefined} />)}</div>
      <div className={s.cta}>{i < 2 ? <Button kind="neutral" onClick={() => setI(i + 1)}>下一步</Button> : <Button glow onClick={onDone}>开始建档</Button>}</div>
    </Screen>
  );
}
