/** Playground 里 6e 组件的可交互演示（找动作检索面板、动作要领的示范 + 分步）：用演示用户的真实数据。 */
import { useMemo, useState } from 'react';
import { BodyPicker, FinderBody, GuideCue, GuideSteps, GuideVideo, PickRow, useGuidePlayer, type EquipFilter } from '../components';
import { demoState } from '../data/store';
import { EQUIP_NAME, FAMILY_OF, PICK_SKIP, familyById, finderRows } from '../data/finder';
import muscles from '../../mock/muscles.json';
import s from './Playground.module.css';

const HEAD: Record<string, string> = Object.fromEntries(muscles.heads.map((h) => [h.id, h.name]));

const NOW = new Date(2026, 9, 6, 18, 0).getTime();
const demo = demoState(NOW);
const src = { history: demo.history, profile: { ...demo.profile!, equipment: demo.profile!.equipment.filter((e) => e !== 'cable' && e !== 'smith') } };
export const famName = (g: string) => familyById(g)?.name ?? g;
export const groupOf = (h: string) => FAMILY_OF[h] ?? null;

export function FinderDemo({ start = 'chest', sub: sub0 = null }: { start?: string; sub?: string | null }) {
  const [fam, setFam] = useState(start), [sub, setSub] = useState<string | null>(sub0), [side, setSide] = useState<'front' | 'back'>('front');
  const [equip, setEquip] = useState<EquipFilter>({ value: 'all', ownedOnly: false });
  const f = familyById(fam)!;
  const rows = useMemo(() => finderRows(sub ? [sub] : f.heads, src).filter((r) => (equip.value === 'all' || r.ex.equipmentType === equip.value) && (!equip.ownedOnly || r.owned)), [f, sub, equip]);
  const opts = [...new Set(finderRows(f.heads, src).map((r) => r.ex.equipmentType))].map((id) => ({ id, name: EQUIP_NAME[id] }));
  return (
    <div className={s.finderBox}>
      <FinderBody title={f.name} count={rows.length}
        subs={f.heads.map((h) => ({ id: h, name: HEAD[h] ?? h }))} sub={sub} onSub={setSub} equipOptions={opts} equip={equip} onEquip={setEquip} side={side} onSide={setSide}
        picker={<BodyPicker gender="male" view={side} height={300} groupOf={groupOf} groupName={famName} skip={PICK_SKIP[side]}
          lit={sub ? [sub] : f.heads} dim={sub ? f.heads.filter((h) => h !== sub) : []} onPick={(g) => { setFam(g); setSub(null); }} />}>
        {rows.slice(0, 12).map((r) => <PickRow key={r.ex.id} name={r.ex.name} equipment={EQUIP_NAME[r.ex.equipmentType]} last={r.last} owned={r.owned} secondary={!r.primary} />)}
      </FinderBody>
    </div>
  );
}

/** 动作要领的示范 + 分步（走查 1 #05，Stitch V1）：真视频，点一步循环那一段、再点取消 */
export function GuideDemo({ src: media, cue, steps }: { src: string | null; cue: string; steps: string[] }) {
  const player = useGuidePlayer(steps.length);
  return (
    <div ref={player.root} className={s.guideBox}>
      <GuideVideo player={player} src={media} label="示范" />
      <GuideCue>{cue}</GuideCue>
      <GuideSteps player={player} src={media} steps={steps} />
    </div>
  );
}
