/** 「我的」→ 消息：打开消息页就算看过，比这一刻新的消息才是未读（me.ts 的 unreadOf）。 */
import { store } from './store';

export const markMessagesSeen = (now = Date.now()) => store.update((s) => ({ ...s, messagesSeenAt: now }));
