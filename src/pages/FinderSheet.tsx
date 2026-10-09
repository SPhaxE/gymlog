/** 找动作（6e，ia T19）：容量页肌头面板「找动作」、首页「＋ 加一个动作」、训练中列表末尾「＋ 加一个动作」都打开它。
 *  五层：
 *  - 战略：想加练或换练某块肌肉时，按肌肉找到能练它、我又有器械的动作，加到今天（也是初版最熟的「点人体找动作」）。
 *  - 范围：点人体按整块肌肉选、左栏细分到肌头；器械菜单（只看我有的）；结果三样（名字 / 器械 / 上次重量）；点一行进要领，在要领页「加到今天」。自定义动作不做。
 *  - 结构：底部面板（一打开就近全屏）；状态写在地址栏（?find=肌肉&sub=肌头&side=），点进要领再返回，面板原样还在。
 *  - 框架：输入在下、结果在上——右栏人体（拇指点，往下放）、正 / 背在人体下面；左栏结果（眼睛看）；关闭：右上 ×、下拉、点面板外。
 *  - 表现：平涂高对比，不用容量页视效（用户 2026-10-07）；全屏唯一的荧光是动作数；面板 M05。 */
import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { BodyPicker, FinderBody, PickRow, Sheet, type EquipFilter } from '../components';
import type { Source } from '../data/demo';
import { EQUIP_NAME, FAMILY_OF, PICK_SKIP, familyById, finderRows, sideOf } from '../data/finder';
import muscles from '../../mock/muscles.json';
import { usePageNav } from '../shell/pageNav';

const HEAD: Record<string, string> = Object.fromEntries(muscles.heads.map((h) => [h.id, h.name]));
const groupOf = (h: string) => FAMILY_OF[h] ?? null;
const famName = (g: string) => familyById(g)?.name ?? g;

/** 找动作入口图标（IP 画法的背面展肌人，荧光只点背阔肌 = 「选中的那块肌肉」；男 / 女跟档案的体型示意走）。
 *  原图 docs/sources/brand-refs/icon-finder-*.jpg（Nano Banana，品红底），抠图后导出 public/icons/finder-*@1x/2x/3x.webp */
export function FinderGlyph({ gender = 'male', className }: { gender?: 'male' | 'female'; className?: string }) {
  const b = `${import.meta.env.BASE_URL}icons/finder-${gender}`;
  return <img className={className} src={`${b}@2x.webp`} srcSet={`${b}@1x.webp 1x, ${b}@2x.webp 2x, ${b}@3x.webp 3x`} alt="" aria-hidden="true" />;
}

/** 进动作要领页的地址参数：保留场景 / 时间，去掉面板自己的参数，带上从哪来 */
export function guideQuery(search: string, from: 'finder' | 'training' | 'today' | 'trend') {
  const n = new URLSearchParams(search);
  ['find', 'sub', 'side', 'eq', 'own'].forEach((k) => n.delete(k));
  n.set('from', from);
  return n.toString();
}

/** 地址里带不带找动作面板：?find=<肌肉>（sub、side、eq、own 可选） */
export function useFinderParam() {
  const [q, setQ] = useSearchParams();
  const open = (fam: string, sub?: string | null) => {
    const n = new URLSearchParams(q);
    n.set('find', fam); if (sub) n.set('sub', sub); else n.delete('sub'); n.set('side', sideOf(fam));
    setQ(n, { replace: true });
  };
  const close = () => { const n = new URLSearchParams(q); ['find', 'sub', 'side', 'eq', 'own'].forEach((k) => n.delete(k)); setQ(n, { replace: true }); };
  return { find: q.get('find'), open, close };
}

export function FinderSheet({ src, caption, onClose }: { src: Pick<Source, 'history' | 'profile'>; caption: string; onClose: () => void }) {
  const [q, setQ] = useSearchParams();
  const loc = useLocation();
  const pn = usePageNav();
  const fam = familyById(q.get('find') ?? '') ?? familyById('chest')!;
  const sub = q.get('sub') && fam.heads.includes(q.get('sub')!) ? q.get('sub') : null;
  const side = (q.get('side') === 'back' ? 'back' : 'front') as 'front' | 'back';
  const equip: EquipFilter = { value: q.get('eq') ?? 'all', ownedOnly: q.get('own') === '1' };
  const patch = (kv: Record<string, string | null>) => { const n = new URLSearchParams(q); for (const [k, v] of Object.entries(kv)) if (v == null) n.delete(k); else n.set(k, v); setQ(n, { replace: true }); };
  const all = useMemo(() => finderRows(sub ? [sub] : fam.heads, src), [fam, sub, src]);
  const rows = all.filter((r) => (equip.value === 'all' || r.ex.equipmentType === equip.value) && (!equip.ownedOnly || r.owned));
  const opts = [...new Set(all.map((r) => r.ex.equipmentType))].map((id) => ({ id, name: EQUIP_NAME[id] ?? id }));
  const gender = src.profile?.gender ?? 'male';
  return (
    <Sheet title="找动作" meta={caption} onClose={onClose} tall>
      <FinderBody title={fam.name} count={rows.length} subs={fam.heads.map((h) => ({ id: h, name: HEAD[h] ?? h }))} sub={sub} onSub={(id) => patch({ sub: id })}
        equipOptions={opts} equip={equip} onEquip={(f) => patch({ eq: f.value === 'all' ? null : f.value, own: f.ownedOnly ? '1' : null })}
        side={side} onSide={(v) => patch({ side: v })}
        picker={<BodyPicker gender={gender} view={side} height={Math.round(window.innerHeight * 0.56)} groupOf={groupOf} groupName={famName} skip={PICK_SKIP[side]}
          lit={sub ? [sub] : fam.heads} dim={sub ? fam.heads.filter((h) => h !== sub) : []} onPick={(g) => patch({ find: g, sub: null })} />}>
        {rows.map((r) => <PickRow key={r.ex.id} name={r.ex.name} equipment={EQUIP_NAME[r.ex.equipmentType] ?? r.ex.equipment} last={r.last} owned={r.owned} secondary={!r.primary}
          onClick={() => pn.push(`/exercise/${r.ex.id}?${guideQuery(loc.search, 'finder')}`)} />)}
      </FinderBody>
    </Sheet>
  );
}
