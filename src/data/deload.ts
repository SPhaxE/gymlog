/** 减量的两个操作（ia §1.2 规则 8）：采纳 → 6 天减量周；这次不减 → 6 天内不再弹出，只留一行小字。
 *  状态只存 status + atMs，「还剩几天」「过期后重新建议」都由引擎的 deloadView 现算，这里不管。 */
import { store } from './store';

export const adoptDeload = (now = Date.now()) => store.update((s) => ({ ...s, deload: { status: 'adopted', atMs: now } }));
export const skipDeload = (now = Date.now()) => store.update((s) => ({ ...s, deload: { status: 'dismissed', atMs: now } }));
