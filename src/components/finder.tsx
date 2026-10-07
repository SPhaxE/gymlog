/** 找动作检索面板的内容（6e；线框 ?board=finder，Stitch e6 finder-v2；用户：只是检索器，可读性优先）。
 *  版式「输入在下、结果在上」：右栏人体（拇指点，往下放），左栏 已选 + 细分 + 器械 + 结果（眼睛看）；手指不挡结果。
 *  全屏唯一的荧光是动作数小徽章。器械菜单是临时面板：点别处就收（DESIGN §9.6）。
 *  替换动作（SwapRow）是同一套行的单选版：线框 swap W1 + Stitch swap-v1，第一行带「推荐」。 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Chip } from './controls';
import { Icon } from './Icon';
import { cx, forced, type Forced } from './state';
import { Num, Tag } from './ui';
import s from './finder.module.css';

const kg = (w: number) => (Number.isInteger(w) ? String(w) : w.toFixed(1));

/** 结果行：名字 / 器械 · 上次重量（窄体加粗）；我没有的器械变灰、写明 */
export function PickRow({ name, equipment, last, owned = true, secondary, onClick, state }: {
  name: string; equipment: string; last: number | null; owned?: boolean; secondary?: boolean; onClick?: () => void; state?: Forced;
}) {
  return (
    <button type="button" className={cx('milo-press milo-focus', s.row, !owned && s.rowOff)} onClick={onClick} {...forced(state)}>
      <b className="milo-text-body-strong">{name}</b>
      <span className={cx('milo-text-caption', s.meta)}>
        {equipment}{secondary ? ' · 协同' : ''} · {!owned ? '没有这个器械' : last != null ? <>上次 <Num size="s" value={kg(last)} unit="kg" /></> : '首次'}
      </span>
    </button>
  );
}

/** 替换动作的一行：单选圈 + 名字 / 器械 · 肌头 + 右边上次重量或「首次」；第一行「推荐」 */
export function SwapRow({ name, detail, last, selected, recommended, onClick, state }: {
  name: string; detail: string; last: number | null; selected?: boolean; recommended?: boolean; onClick?: () => void; state?: Forced;
}) {
  return (
    <button type="button" role="radio" aria-checked={!!selected} className={cx('milo-press milo-focus', s.swap, selected && s.swapOn)} onClick={onClick} {...forced(state)}>
      <i className={s.radio} aria-hidden="true" />
      <span className={s.swapText}>
        <span className={s.swapName}><b className="milo-text-body-strong">{name}</b>{recommended && <Tag tone="outline">推荐</Tag>}</span>
        <span className="milo-text-caption">{detail}</span>
      </span>
      {last != null ? <Num value={kg(last)} unit="kg" /> : <Tag tone="outline">首次</Tag>}
    </button>
  );
}

export interface EquipFilter { value: string; ownedOnly: boolean }

export function FinderBody({ title, count, subs, sub, onSub, equipOptions, equip, onEquip, picker, side, onSide, children }: {
  title: string; count: number;
  /** 细分到肌头（只有一个肌头的肌肉不显示） */
  subs: { id: string; name: string }[]; sub: string | null; onSub: (id: string | null) => void;
  equipOptions: { id: string; name: string }[]; equip: EquipFilter; onEquip: (f: EquipFilter) => void;
  picker: ReactNode; side: 'front' | 'back'; onSide: (v: 'front' | 'back') => void;
  /** 结果行（PickRow） */
  children: ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    // 临时面板点别处就收；听 click（先让这一下点到的东西生效）
    const away = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('click', away, true);
    return () => document.removeEventListener('click', away, true);
  }, [menu]);
  const equipLabel = equip.value === 'all' ? (equip.ownedOnly ? '只看我有的' : '全部器械') : equipOptions.find((o) => o.id === equip.value)?.name ?? '器械';
  return (
    <div className={s.body}>
      <section className={s.left} aria-label="结果">
        <div className={s.head}>
          <h3 className={`milo-text-title-m ${s.title}`}>{title}</h3>
          <span className={s.count}><b>{count}</b> 个动作</span>
        </div>
        {subs.length > 1 && (
          <div className={s.subs} role="group" aria-label="细分到肌头">
            <Chip selected={!sub} onClick={() => onSub(null)}>全部</Chip>
            {subs.map((x) => <Chip key={x.id} selected={sub === x.id} onClick={() => onSub(x.id)}>{x.name}</Chip>)}
          </div>
        )}
        <div className={s.filter} ref={menuRef}>
          <button type="button" className={cx('milo-press milo-focus', s.equip)} aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu((m) => !m)}>
            {equipLabel}<Icon name="down" small />
          </button>
          {menu && (
            <div className={s.menu} role="menu">
              {[{ id: 'all', name: '全部器械' }, ...equipOptions].map((o) => (
                <button key={o.id} type="button" role="menuitemradio" aria-checked={equip.value === o.id} className={cx('milo-focus', s.item)}
                  onClick={() => { onEquip({ ...equip, value: o.id }); setMenu(false); }}>{o.name}{equip.value === o.id && <Icon name="check" small />}</button>
              ))}
              <button type="button" role="menuitemcheckbox" aria-checked={equip.ownedOnly} className={cx('milo-focus', s.item, s.itemSep)}
                onClick={() => { onEquip({ ...equip, ownedOnly: !equip.ownedOnly }); setMenu(false); }}>只看我有的{equip.ownedOnly && <Icon name="check" small />}</button>
            </div>
          )}
        </div>
        <div className={s.list}>{children}</div>
      </section>
      <section className={s.right} aria-label="点人体选肌肉">
        <p className={`milo-text-caption ${s.hint}`}>点一块肌肉 = 选它<br />左边再细分到肌头</p>
        <div className={s.picker}>{picker}</div>
        <div className={s.side} role="radiogroup" aria-label="正面 / 背面">
          {(['front', 'back'] as const).map((v) => <button key={v} type="button" role="radio" aria-checked={side === v} className={cx('milo-press milo-focus', s.sideBtn, side === v && s.sideOn)} onClick={() => onSide(v)}>{v === 'front' ? '正面' : '背面'}</button>)}
        </div>
      </section>
    </div>
  );
}
