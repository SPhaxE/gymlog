/** 「我的」→ 导航的三项设置（ia §1.11）：改一项，立即写入；导航读 useTrainingNav，训练页读 restEnd。 */
import { store, type Settings } from './store';

export const setSettings = (patch: Partial<Settings>) => store.update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
