/** 动作要领（P04，ia §1.4）：要领文案和示范媒体只从动作的 cue / media 字段取（mock/exercises.json），页面不写文件路径；
 *  没有素材的动作返回 null 媒体，页面显示「暂无示范」，不拿相近动作顶替。 */
import raw from '../../mock/exercises.json';

type Clip = { front?: string; side?: string };
interface Raw { id: string; cue?: { summary: string; steps: string[] }; media?: { male?: Clip; female?: Clip } }
const BY = new Map((raw as Raw[]).map((e) => [e.id, e]));

export function guideOf(id: string, gender: 'male' | 'female' = 'male') {
  const e = BY.get(id);
  if (!e) return null;
  const m = e.media?.[gender] ?? e.media?.male ?? {};
  return { cue: e.cue ?? null, media: { front: m.front ?? null, side: m.side ?? null } };
}
