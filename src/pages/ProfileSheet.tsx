/** 档案编辑面板（P11，ia §1.11）：点「我的」里的档案格弹出，一次只改一项（经验 / 时长 / 器械 / 体型 + 可选体重）。
 *  - 每项一个底部面板，选完点底部整宽「保存」（骨白，不是荧光，在拇指区）；不合法的改动保存不了：器械至少选一类，体重 30–250 kg、最多一位小数（不填也行）；
 *  - 写进本机存储失败不静默（外壳有可见提示和「重试」）；训练进行中改的，进行中的这次不受影响（它是开始时的快照），下一次才按新档案排，面板里写明；
 *  - 校验、名称表都在 data/profile.ts，和建档共用。 */
import { useState } from 'react';
import { Banner, Button, NumberField, OptionCard, OptionGroup, Segmented, Sheet, Stepper } from '../components';
import { EQUIPMENT, EQUIPMENT_EXT, EXPERIENCES, GENDER_NAME, MINUTES, WEIGHT, parseWeight } from '../data/profile';
import type { EquipmentType, Experience, Profile } from '../engine/types';
import s from './MePage.module.css';

export type ProfileField = 'experience' | 'minutes' | 'equipment' | 'body';
const TITLE: Record<ProfileField, string> = { experience: '训练经验', minutes: '单次训练时长', equipment: '可用器械', body: '体型示意' };
const META: Record<ProfileField, string> = {
  experience: '决定起步重量和加重的快慢', minutes: '决定每天排几个动作、几组', equipment: '处方只排你能做的动作', body: '只影响肌群图和动作示范的体型示意，不影响处方',
};

export function ProfileSheet({ field, profile, training, onSave, onClose }: {
  field: ProfileField; profile: Profile; training: boolean;
  /** 保存：返回错误文案（null = 已写入） */
  onSave: (patch: Partial<Profile>) => string | null; onClose: () => void;
}) {
  const [exp, setExp] = useState<Experience>(profile.experience);
  const [minutes, setMinutes] = useState(profile.minutes);
  const [equip, setEquip] = useState<EquipmentType[]>(profile.equipment);
  const [gender, setGender] = useState(profile.gender);
  const [wText, setWText] = useState(profile.weightKg != null ? String(profile.weightKg) : '');
  const [ext, setExt] = useState(EQUIPMENT_EXT.some(([k]) => profile.equipment.includes(k)));
  const [err, setErr] = useState<string | null>(null);
  const w = parseWeight(wText);
  const toggle = (k: EquipmentType) => setEquip((e) => (e.includes(k) ? e.filter((x) => x !== k) : [...e, k]));
  const blocked = field === 'equipment' ? equip.length === 0 : field === 'body' ? !!w.error : false;
  const save = () => {
    const patch: Partial<Profile> = field === 'experience' ? { experience: exp } : field === 'minutes' ? { minutes } : field === 'equipment' ? { equipment: equip } : { gender, weightKg: w.kg };
    const e = onSave(patch);
    if (e) setErr(e); else onClose();
  };
  return (
    <Sheet title={TITLE[field]} meta={META[field]} onClose={onClose}>
      <div className={s.sheetBody}>
        {field === 'experience' && (
          <OptionGroup label="训练经验">{EXPERIENCES.map(([k, t, d]) => <OptionCard key={k} title={t} detail={d} selected={exp === k} onClick={() => setExp(k)} />)}</OptionGroup>
        )}
        {field === 'minutes' && (
          <div className={s.minutes}>
            <Stepper label="单次训练时长" value={minutes} step={MINUTES.step} min={MINUTES.min} max={MINUTES.max} unit="分钟" onChange={setMinutes} />
            <p className="milo-text-caption">60 分钟大约排 6 个动作、14 组。</p>
          </div>
        )}
        {field === 'equipment' && (
          <>
            <div className={s.grid}>{EQUIPMENT.map(([k, t]) => <OptionCard key={k} mode="multi" title={t} selected={equip.includes(k)} onClick={() => toggle(k)} />)}</div>
            {ext
              ? <div className={s.grid}>{EQUIPMENT_EXT.map(([k, t]) => <OptionCard key={k} mode="multi" title={t} selected={equip.includes(k)} onClick={() => toggle(k)} />)}</div>
              : <button type="button" className={`milo-focus ${s.more}`} onClick={() => setExt(true)}>还有壶铃、弹力带、杠铃片</button>}
            {equip.length === 0 && <Banner tone="error" detail="器械至少选一类，否则排不出动作" />}
          </>
        )}
        {field === 'body' && (
          <>
            <Segmented label="体型示意" items={[['male', GENDER_NAME.male], ['female', GENDER_NAME.female]] as const} value={gender} onChange={setGender} />
            <NumberField label="体重（可选）" value={wText} unit="kg" placeholder="不填也行" error={w.error}
              helper={`填了，腰带知识卡和增量页的体重比才有依据；不影响处方。范围 ${WEIGHT.min}–${WEIGHT.max} kg。`} onChange={setWText} />
          </>
        )}
        {training && <Banner detail="训练进行中：这次训练不受影响，改动从下一次处方开始生效。" />}
        {err && <Banner tone="error" detail={err} />}
        <Button kind="neutral" disabled={blocked} onClick={save}>保存</Button>
      </div>
    </Sheet>
  );
}
