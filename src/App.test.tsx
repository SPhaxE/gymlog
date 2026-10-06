import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import tokens from '../design/tokens/tokens.json';
import { App } from './App';
import { DEFAULT_PROFILE, demoState, store } from './data/store';

describe('M1 管线检查页（/check）', () => {
  it('渲染标题、每个语义色和每个文字样式', async () => {
    window.history.pushState({}, '', '/check');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '慢牛 Milo · 管线检查' })).toBeInTheDocument();
    for (const k of Object.keys(tokens.semantic.color)) expect(screen.getByText(k)).toBeInTheDocument();
    for (const t of tokens.textStyles) expect(screen.getByText(t.name)).toBeInTheDocument();
  });
});

describe('首次打开（阶段 6a）', () => {
  it('没建档：进故事引导，「跳过」进建档第 1 步，一路默认到「生成第一份处方」进首页', async () => {
    store.clear();
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByText('两千五百年前，有个扛牛的人')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/onboarding');
    screen.getByRole('button', { name: '跳过' }).click();
    expect(await screen.findByText('你练了多久？')).toBeInTheDocument();
    expect(store.get().draft?.step).toBe(1);
    screen.getByRole('button', { name: '下一步' }).click();
    expect(await screen.findByText('能用到哪些器械？')).toBeInTheDocument();
    screen.getByRole('button', { name: '下一步' }).click();
    expect(await screen.findByText('一次练多久？')).toBeInTheDocument();
    screen.getByRole('button', { name: '生成第一份处方' }).click();
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/today');
    expect(store.get().profile).toEqual(DEFAULT_PROFILE);
    expect(store.get().draft).toBeNull();
  });
});

describe('首页即打卡（2026-10-06：取消独立训练页）', () => {
  it('开始训练留在首页；打卡一组 → 休息开始：首页计时在主按钮旁（导航不重复），切到别的 Tab 计时在导航滑块；结束 → 结算页', async () => {
    store.clear();
    store.update((x) => ({ ...x, ...demoState(Date.now()), draft: null }));
    window.history.pushState({}, '', '/today');
    render(<App />);
    (await screen.findByRole('button', { name: '开始训练' })).click();
    const check = await screen.findByRole('button', { name: /^打卡 · 第 1 组/ });
    expect(window.location.pathname).toBe('/today');
    check.click();
    await screen.findByRole('button', { name: /^打卡 · 第 2 组/ });
    expect(store.get().active?.entries[0].rows[0].done).toBe(true);
    expect(store.get().rest).not.toBeNull();
    // 首页只有一个计时器：主按钮旁的胶囊；导航上不重复显示
    expect(screen.getByRole('button', { name: /组间休息剩余/ })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '主导航' }).querySelector('[aria-current="page"]')?.getAttribute('aria-label') ?? '').not.toMatch(/休息剩余/);
    // 切到增量页：计时到了导航滑块上
    screen.getByRole('link', { name: /增量/ }).click();
    // 换 Tab 要重新渲染整页（CI 机器上可能超过默认 1 秒），放宽等待
    await screen.findByRole('link', { name: /增量，休息剩余/ }, { timeout: 5000 });
    screen.getByRole('link', { name: /首页/ }).click();
    await screen.findByRole('button', { name: /组间休息剩余/ }, { timeout: 5000 });
    screen.getByRole('button', { name: '结束' }).click();
    (await screen.findByRole('button', { name: '结束并结算' })).click();
    await screen.findByText('练完了');
    expect(window.location.pathname).toMatch(/^\/summary\//);
    expect(store.get().active).toBeNull();
  });
  it('旧地址 /session 回首页', async () => {
    store.update((x) => ({ ...x, profile: DEFAULT_PROFILE, draft: null }));
    window.history.pushState({}, '', '/session');
    render(<App />);
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/today');
  });
});

describe('/demo（第一版实机演示）', () => {
  it('窄屏：清空数据后全屏进故事引导', async () => {
    store.update((x) => ({ ...x, profile: DEFAULT_PROFILE }));
    window.history.pushState({}, '', '/demo');
    render(<App />);
    expect(await screen.findByText('两千五百年前，有个扛牛的人')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/onboarding');
    expect(store.get().profile).toBeNull();
  });
});

describe('App 壳：5 个 Tab', () => {
  beforeEach(() => store.update((s) => ({ ...s, profile: DEFAULT_PROFILE, draft: null })));
  it('根路径进首页，导航有 5 项且首页为当前页', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    const nav = await screen.findByRole('navigation', { name: '主导航' });
    const links = nav.querySelectorAll('a');
    expect([...links].map((a) => a.getAttribute('href'))).toEqual(['/today', '/body', '/gains', '/log', '/me']);
    expect(nav.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe('/today');
    expect(window.location.pathname).toBe('/today');
  });
  it('旧地址 /explore/home 重定向到 /today', async () => {
    window.history.pushState({}, '', '/explore/home');
    render(<App />);
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/today');
  });
});

describe('动作进步曲线页（/gains/:exerciseId）', () => {
  it('演示场景：显示动作名、大数字、下次目标和最近几次；点明细的一行换成那一天', async () => {
    window.history.pushState({}, '', '/gains/dumbbell-incline-bench-press-398?scenario=plain-prescription');
    render(<App />);
    expect(await screen.findByRole('heading', { name: '上斜哑铃卧推' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '下次目标' })).toBeInTheDocument();
    const rows = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.getAttribute('aria-pressed') != null);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].getAttribute('aria-pressed')).toBe('true');
    rows[1].click();
    await waitFor(() => expect(rows[1].getAttribute('aria-pressed')).toBe('true'));
    expect(rows[0].getAttribute('aria-pressed')).toBe('false');
  });
  it('动作不存在：提示找不到，给回增量页的按钮', async () => {
    window.history.pushState({}, '', '/gains/not-an-exercise?scenario=plain-prescription');
    render(<App />);
    expect(await screen.findByText('找不到这个动作')).toBeInTheDocument();
    screen.getByRole('button', { name: '回增量页' }).click();
    await waitFor(() => expect(window.location.pathname).toBe('/gains'));
  });
});

describe('记录页 → 训练详情 → 删除（2026-10-06）', () => {
  it('点一行进详情，⋮ → 删除这次训练 → 二次确认；取消什么都不变，确认后回记录页、这次训练从历史和列表里消失', async () => {
    store.clear();
    store.update((x) => ({ ...x, ...demoState(Date.now()), draft: null }));
    const n0 = store.get().history.length;
    window.history.pushState({}, '', '/log');
    render(<App />);
    const rows = await screen.findAllByRole('button', { name: /个动作/ });
    const label = rows[0].textContent ?? '';
    rows[0].click();
    await screen.findByRole('group', { name: '本次汇总' });
    const id = window.location.pathname.split('/').pop()!;
    expect(store.get().history.some((s) => s.id === id)).toBe(true);
    // 子页没有 Tab 导航
    expect(screen.queryByRole('navigation', { name: '主导航' })).toBeNull();
    // 取消：什么都不变
    screen.getByRole('button', { name: '更多' }).click();
    (await screen.findByRole('button', { name: '删除这次训练' })).click();
    const dlg = await screen.findByRole('alertdialog', { name: '删除这次训练？' });
    expect(within(dlg).getByText(/不能撤销/)).toBeInTheDocument();
    within(dlg).getByRole('button', { name: '取消' }).click();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(store.get().history).toHaveLength(n0);
    // 确认：回记录页，历史少一次
    screen.getByRole('button', { name: '更多' }).click();
    (await screen.findByRole('button', { name: '删除这次训练' })).click();
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: '删除' }).click();
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/log');
    expect(store.get().history).toHaveLength(n0 - 1);
    expect(store.get().history.some((s) => s.id === id)).toBe(false);
    expect(label.length).toBeGreaterThan(0);
  });

  it('打开已被删除的训练：有「回到记录」的出口', async () => {
    store.clear();
    store.update((x) => ({ ...x, ...demoState(Date.now()), draft: null }));
    window.history.pushState({}, '', '/log/not-a-session');
    render(<App />);
    expect(await screen.findByText('这次训练已经不在了')).toBeInTheDocument();
    screen.getByRole('button', { name: '回到记录' }).click();
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/log');
  });
});


describe('我的（P11）→ 牛龄（P13）→ 消息（2026-10-06）', () => {
  beforeEach(() => { store.clear(); store.update((x) => ({ ...x, ...demoState(Date.now()), draft: null })); });

  it('「我的」：成长卡 + 档案四格 + 导航 + 数据 + 关于；改时长保存后档案变了；钱包 · 商城 / 会员两行不放（还没有页面）', async () => {
    window.history.pushState({}, '', '/me');
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: '我的' })).toBeInTheDocument();
    // 演示用户的小级随载入那天在公牛 1–3 级之间（CI 时区不同）
    expect(screen.getByRole('button', { name: /^牛龄 公牛 [123] 级，连胜 \d+ 周/ })).toBeInTheDocument();
    for (const t of ['训练经验', '单次时长', '可用器械', '体型示意']) expect(screen.getByRole('button', { name: new RegExp(`^${t}：`) })).toBeInTheDocument();
    expect(screen.queryByText('钱包 · 商城')).toBeNull();
    const before = store.get().profile!.minutes;
    screen.getByRole('button', { name: /^单次时长：/ }).click();
    const sheet = await screen.findByRole('dialog', { name: '单次训练时长' });
    within(sheet).getByRole('button', { name: '加 15分钟' }).click();
    await within(sheet).findByText(String(before + 15));   // 等步进器画出新值，再点保存（保存读的是这一刻的值）
    within(sheet).getByRole('button', { name: '保存' }).click();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(store.get().profile?.minutes).toBe(before + 15);
    expect(screen.getByRole('button', { name: new RegExp(`^单次时长：${before + 15}`) })).toBeInTheDocument();
  });

  it('体重（可选）：写错保存不了，填对写进档案，体型格带上；清空 = 不填', async () => {
    window.history.pushState({}, '', '/me');
    render(<App />);
    screen.getByRole('button', { name: /^体型示意：/ }).click();
    const sheet = await screen.findByRole('dialog', { name: '体型示意' });
    const field = within(sheet).getByLabelText(/^体重（可选）/) as HTMLInputElement;
    const type = (v: string) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, v); field.dispatchEvent(new Event('input', { bubbles: true })); };
    type('7a');
    await waitFor(() => expect(within(sheet).getByRole('button', { name: '保存' })).toBeDisabled());
    type('72');
    await waitFor(() => expect(within(sheet).getByRole('button', { name: '保存' })).toBeEnabled());
    within(sheet).getByRole('button', { name: '保存' }).click();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(store.get().profile?.weightKg).toBe(72);
    expect(screen.getByRole('button', { name: /^体型示意：男 · 72/ })).toBeInTheDocument();
    expect(await screen.findByText('已保存')).toBeInTheDocument();   // 体型 / 体重不影响处方，不说「处方重算」
    expect(screen.queryByText(/处方按新档案重算/)).toBeNull();
  });

  it('导航设置：开关立即写进存储；休息结束提示选「仅描边」', async () => {
    window.history.pushState({}, '', '/me');
    render(<App />);
    const ring = await screen.findByRole('switch', { name: '显示今日进度环' });
    expect(ring).toHaveAttribute('aria-checked', 'true');
    ring.click();
    await waitFor(() => expect(store.get().settings.ring).toBe(false));
    expect(screen.getByRole('switch', { name: '显示今日进度环' })).toHaveAttribute('aria-checked', 'false');
    screen.getByRole('button', { name: /^休息结束提示/ }).click();
    (await screen.findByRole('radio', { name: /^仅描边/ })).click();
    await waitFor(() => expect(store.get().settings.restEnd).toBe('outline'));
  });

  it('清除全部数据：先确认（取消不变），确认后清空存储、回到建档', async () => {
    window.history.pushState({}, '', '/me');
    render(<App />);
    (await screen.findByRole('button', { name: /^清除全部数据/ })).click();
    const dlg = await screen.findByRole('alertdialog', { name: '清除全部数据？' });
    expect(within(dlg).getByText(/不能撤销/)).toBeInTheDocument();
    within(dlg).getByRole('button', { name: '取消' }).click();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(store.get().history.length).toBeGreaterThan(0);
    screen.getByRole('button', { name: /^清除全部数据/ }).click();
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: '清除' }).click();
    await waitFor(() => expect(window.location.pathname).toBe('/onboarding'));
    expect(store.get().history).toEqual([]);
    expect(store.get().profile).toBeNull();
  });

  it('牛龄页：5 段名字、离下一级、连胜三格、最近 12 周、成长记录；返回回「我的」；演示用户连胜不是 0', async () => {
    window.history.pushState({}, '', '/me');
    render(<App />);
    (await screen.findByRole('button', { name: /^牛龄 / })).click();
    expect(await screen.findByRole('list', { name: '牛龄五段' })).toBeInTheDocument();
    expect(screen.getByText('离下一级')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '连胜与本周' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /^最近 \d+ 周：守约 \d+ 周/ })).toBeInTheDocument();
    expect(screen.getByText('成长记录')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '主导航' })).toBeNull();
    const weeks = Number(within(screen.getByRole('group', { name: '连胜与本周' })).getAllByText(/^\d+$/)[0].textContent);
    expect(weeks).toBeGreaterThanOrEqual(15);
    screen.getByRole('button', { name: '返回' }).click();
    await screen.findByRole('navigation', { name: '主导航' });
    expect(window.location.pathname).toBe('/me');
  });

  it('消息：「我的」上的未读数，进去后清零；记下的降级说明出现在牛龄页', async () => {
    window.history.pushState({}, '', '/me');
    render(<App />);
    const row = await screen.findByRole('button', { name: /^消息/ });
    expect(row.textContent).toMatch(/\d+ 条新/);
    row.click();
    await screen.findByRole('heading', { name: '消息' });
    await waitFor(() => expect(store.get().messagesSeenAt).toBeGreaterThan(Date.now() - 60e3));
    screen.getByRole('button', { name: '返回' }).click();
    await screen.findByRole('navigation', { name: '主导航' });
    expect(screen.getByRole('button', { name: /^消息/ }).textContent).not.toMatch(/条新/);
    store.update((x) => ({ ...x, notes: [{ atMs: Date.now(), kind: 'demote', text: '连胜 21 周 → 0 周' }] }));
    window.history.pushState({}, '', '/me/level');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(await screen.findByText('删除训练后重新计算')).toBeInTheDocument();
    expect(screen.getByText('连胜 21 周 → 0 周')).toBeInTheDocument();
  });

  it('载入示例数据：旧数据删训练写下的降级说明一起清掉', async () => {
    store.update((x) => ({ ...x, notes: [{ atMs: Date.now(), kind: 'demote', text: '连胜 9 周 → 0 周' }] }));
    window.history.pushState({}, '', '/me');
    render(<App />);
    (await screen.findByRole('button', { name: /^载入示例数据/ })).click();
    within(await screen.findByRole('alertdialog', { name: '载入示例数据？' })).getByRole('button', { name: '载入' }).click();
    await waitFor(() => expect(store.get().notes).toEqual([]));
    expect(store.get().history.length).toBeGreaterThan(0);
  });

  it('演示场景（?scenario=）：「我的」不显示未读数（场景里消息页不标已读，显示了就清不掉）', async () => {
    store.clear(); store.update((x) => ({ ...x, profile: { ...DEFAULT_PROFILE } }));
    window.history.pushState({}, '', '/me?scenario=plain-prescription');
    render(<App />);
    expect((await screen.findByRole('button', { name: /^消息/ })).textContent).not.toMatch(/条新/);
  });

  it('没有历史：牛龄页写「完成第一次训练开始长大」，导出 CSV 不可用', async () => {
    store.update((x) => ({ ...x, history: [] }));
    window.history.pushState({}, '', '/me');
    render(<App />);
    expect(await screen.findByRole('button', { name: /^导出 CSV/ })).toBeDisabled();
    expect(screen.getByText('完成第一次训练开始长大')).toBeInTheDocument();   // 「我的」成长卡上也是这句
    (screen.getByRole('button', { name: /^牛龄 牛犊 1 级/ })).click();
    await screen.findByRole('list', { name: '牛龄五段' });
    expect(screen.getByText('完成第一次训练开始长大')).toBeInTheDocument();
    expect(screen.getByText(/练完第一次训练，这里会开始记录/)).toBeInTheDocument();
  });
});
