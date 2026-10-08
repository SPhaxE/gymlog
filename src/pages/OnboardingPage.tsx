/** 故事引导 + 首次建档（P12，ia §1.1 / §1.13，阶段 6a）。
 *  - 没有建档草稿时先讲 3 屏故事（不记步骤，杀进程回到第 1 屏）；「跳过」或「开始建档」进第 1 步。
 *  - 建档 3 步：训练经验 → 可用器械 → 单次时长。每一步的选择实时写进本地存储，杀进程回到上次那一步；全部有默认值，一路「下一步」就能完成。
 *  - 最后一步两个出口：「生成第一份处方」（从零开始）/「载入演示数据」（练了 30 周的进阶用户，各页都有内容）。
 *  - 写入失败由外壳显示可见提示（store.saveError），这里不静默回退。 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Banner, Button, NumberField, OptionCard, OptionGroup, ProgressSteps, Screen, Stepper, TopBar, useBackHandler } from '../components';
import { DEFAULT_PROFILE, demoState, store, useStore } from '../data/store';
import { EQUIPMENT as EQUIP, EQUIPMENT_EXT as EQUIP_EXT, EXPERIENCES as EXP, MINUTES, WEIGHT, parseWeight } from '../data/profile';
import type { EquipmentType, Profile } from '../engine/types';
import { StoryScreens } from './StoryScreens';
import s from './OnboardingPage.module.css';

const TITLE = { 1: '你练了多久？', 2: '能用到哪些器械？', 3: '一次练多久？' } as const;
const SUB = { 1: '决定起步重量和加重的快慢。', 2: '处方只排你能做的动作，至少选一类。', 3: '决定每天排几个动作、几组。' } as const;

export function OnboardingPage({ now }: { now: number }) {
  const st = useStore(), nav = useNavigate();
  const draft = st.draft;
  const [weightBad, setWeightBad] = useState(false);   // 体重写错了：行内提示在输入框下，同时挡住「生成第一份处方」（要放在提前 return 之前）
  // Android 返回键：建档里回上一步，第 1 步回到故事
  useBackHandler(!!draft, () => store.update((x) => (x.draft ? { ...x, draft: x.draft.step === 1 ? null : { ...x.draft, step: (x.draft.step - 1) as 1 | 2 } } : x)));
  if (!draft) return <StoryScreens onDone={() => store.update((x) => ({ ...x, draft: { step: 1, profile: { ...DEFAULT_PROFILE } } }))} />;

  const { step, profile } = draft;
  const set = (p: Partial<Profile>, next?: 1 | 2 | 3) => store.update((x) => ({ ...x, draft: { step: next ?? step, profile: { ...profile, ...p } } }));
  const back = () => (step === 1 ? store.update((x) => ({ ...x, draft: null })) : set({}, (step - 1) as 1 | 2));
  const finish = (demo: boolean) => {
    store.update((x) => ({ ...x, ...(demo ? demoState(now, profile) : { profile, history: [], demo: false }), draft: null }));
    nav('/today', { replace: true });
  };
  const toggle = (k: EquipmentType) => set({ equipment: profile.equipment.includes(k) ? profile.equipment.filter((e) => e !== k) : [...profile.equipment, k] });
  const noEquip = profile.equipment.length === 0;

  return (
    <Screen label="建档">
      <TopBar title="建档" onBack={back} />
      <div className={s.body}>
        <ProgressSteps current={step} total={3} />
        <div className={s.q}>
          <h2 className="milo-text-title-m">{TITLE[step]}</h2>
          <p className="milo-text-body">{SUB[step]}</p>
        </div>
        {step === 1 && (
          <OptionGroup label="训练经验">
            {EXP.map(([k, t, d]) => <OptionCard key={k} title={t} detail={d} selected={profile.experience === k} onClick={() => set({ experience: k })} />)}
          </OptionGroup>
        )}
        {step === 2 && (
          <>
            <div className={s.grid}>{EQUIP.map(([k, t]) => <OptionCard key={k} mode="multi" title={t} selected={profile.equipment.includes(k)} onClick={() => toggle(k)} />)}</div>
            <ExtEquip profile={profile} toggle={toggle} />
            {noEquip && <Banner tone="error" detail="器械至少选一类，否则排不出动作" />}
          </>
        )}
        {step === 3 && (
          <div className={s.minutes}>
            <Stepper label="单次训练时长" value={profile.minutes} step={MINUTES.step} min={MINUTES.min} max={MINUTES.max} unit="分钟" onChange={(v) => set({ minutes: v })} />
            <p className="milo-text-caption">60 分钟大约排 6 个动作、14 组；之后在「我的」里随时能改。</p>
            <WeightField kg={profile.weightKg} onChange={(kg) => set({ weightKg: kg })} onBad={setWeightBad} />
          </div>
        )}
      </div>
      <div className={s.cta}>
        {step < 3 ? <Button disabled={step === 2 && noEquip} onClick={() => set({}, (step + 1) as 2 | 3)}>下一步</Button> : (
          <>
            <Button glow disabled={weightBad} onClick={() => finish(false)}>生成第一份处方</Button>
            <Button kind="ghost" disabled={weightBad} onClick={() => finish(true)}>载入示例数据 · 练了 30 周的进阶用户</Button>
          </>
        )}
      </div>
    </Screen>
  );
}

/** 体重（可选）：自己留着输入的文字，合法才写进草稿；空 = 不填。写错了行内提示，不替用户改数 */
function WeightField({ kg, onChange, onBad }: { kg?: number; onChange: (kg: number | undefined) => void; onBad: (bad: boolean) => void }) {
  const [text, setText] = useState(kg != null ? String(kg) : '');
  useEffect(() => () => onBad(false), []); // eslint-disable-line react-hooks/exhaustive-deps
  const err = parseWeight(text).error;
  return (
    <NumberField label="体重（可选）" value={text} unit="kg" placeholder="不填也行" error={err} helper={`填了，腰带知识卡和增量页的体重比才有依据；不影响处方。范围 ${WEIGHT.min}–${WEIGHT.max} kg。`}
      onChange={(v) => { setText(v); const r = parseWeight(v); onBad(!!r.error); if (!r.error) onChange(r.kg); }} />
  );
}

/** 扩展器械默认收起：壶铃、弹力带、杠铃片（ia §1.1 默认不选） */
function ExtEquip({ profile, toggle }: { profile: Profile; toggle: (k: EquipmentType) => void }) {
  const [open, setOpen] = useState(EQUIP_EXT.some(([k]) => profile.equipment.includes(k)));
  if (!open) return <button type="button" className={`milo-focus ${s.more}`} onClick={() => setOpen(true)}>还有壶铃、弹力带、杠铃片</button>;
  return <div className={s.grid}>{EQUIP_EXT.map(([k, t]) => <OptionCard key={k} mode="multi" title={t} selected={profile.equipment.includes(k)} onClick={() => toggle(k)} />)}</div>;
}
