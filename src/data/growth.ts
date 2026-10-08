/** 增长层演示数据（阶段 5.5c）：引擎事件 → 奖励弹窗要显示的内容；演示用户 = 等级曲线模拟里的「进阶用户」。
 *  全部由引擎实算（growth.ts、growth.sim.ts），不手填数字。 */
import { growth, levelInfo, pickRewards, simulateUser, SIM_START, type GrowthEvent, type GrowthState } from '../engine';
import { DAY } from '../engine/sets';
import type { Reward } from '../components/Reward';
import { env } from './demo';

/** 一个引擎事件 → 奖励弹窗内容；守约周、冻结卡这类只进消息的事件返回 null */
export function rewardOf(ev: GrowthEvent, g: GrowthState): Reward | null {
  const stage = g.stage;
  switch (ev.kind) {
    case 'stage': {
      const to = levelInfo(ev.level!).stage, from = levelInfo(ev.level! - 1).stage;
      return { kind: 'stage', from, to, niujin: ev.niujin };
    }
    case 'level': { const { stage: st, sub } = levelInfo(ev.level!); return { kind: 'level', stage: st, sub: sub === 3 ? 3 : 2, niujin: ev.niujin }; }
    case 'pr': return { kind: 'pr', stage, exercise: ev.exerciseName ?? '', fromKg: ev.fromKg ?? 0, toKg: ev.toKg ?? 0, niujin: ev.niujin };
    case 'streak': return { kind: 'streak', stage, weeks: ev.weeks ?? 0, niujin: ev.niujin };
    case 'cycle': {
      // 这个周期里主项（预估 1RM 涨得最多的 PR）的累计增幅
      const since = ev.atMs - 5 * 7 * DAY;
      const prs = g.events.filter((e) => e.kind === 'pr' && e.atMs > since && e.atMs <= ev.atMs && e.fromKg && e.toKg);
      const gain = prs.reduce((m, e) => Math.max(m, ((e.toKg! - e.fromKg!) / e.fromKg!) * 100), 0);
      return { kind: 'cycle', stage, n: ev.weeks ?? 1, weeks: 4, gainPct: Math.round(gain * 10) / 10, niujin: ev.niujin };
    }
    default: return null;
  }
}

/** 演示用户：进阶、每周 4 练，从 SIM_START 开始，最多 60 周（一次算完缓存） */
let demoUser: ReturnType<typeof simulateUser> | null = null;
export const growthDemoUser = () => (demoUser ??= simulateUser('intermediate', 60, SIM_START));

/** 「保存第 i 次训练」之后：成长状态、要弹的奖励、进消息的其余事件 */
export function afterSession(i: number, pro = false) {
  const u = growthDemoUser();
  const s = u.history[i];
  const now = s.startMs + 2 * 3600e3;
  const prevMs = i > 0 ? u.history[i - 1].startMs + 2 * 3600e3 : SIM_START - 1;
  const g = growth(env, { history: u.history, profile: u.profile, now, deloads: u.deloads, pro: pro ? { fromMs: SIM_START, toMs: SIM_START + 400 * DAY } : null });
  const { popup, messages } = pickRewards(g.events, prevMs);
  return { g, session: s, popup: popup ? rewardOf(popup, g) : null, messages, week: Math.floor((s.startMs - SIM_START) / (7 * DAY)) + 1 };
}

/** 目录矩阵用的样例：每种奖励各取演示用户身上第一次真实发生的那一个（Milo 要跑到第 110 周） */
let samples: Record<'stage' | 'milo' | 'pr' | 'streak' | 'level' | 'cycle', Reward> | null = null;
export function sampleRewards() {
  if (samples) return samples;
  const u = simulateUser('intermediate', 110, SIM_START);
  const g = growth(env, { history: u.history, profile: u.profile, now: SIM_START + 110 * 7 * DAY, deloads: u.deloads });
  const first = (pred: (e: GrowthEvent) => boolean) => rewardOf(g.events.find(pred)!, g)!;
  const atStage = <R extends Reward>(r: R, st: GrowthState['stage']): R => ('stage' in r ? { ...r, stage: st } : r);
  samples = {
    stage: first((e) => e.kind === 'stage' && e.level === 6),
    milo: first((e) => e.kind === 'stage' && e.level === 12),
    pr: atStage(first((e) => e.kind === 'pr' && e.exerciseId === 'barbell-squat-8' && e.atMs > SIM_START + 30 * 7 * DAY), 'sturdy'),
    streak: atStage(first((e) => e.kind === 'streak' && e.weeks === 12), 'young'),
    level: atStage(first((e) => e.kind === 'level' && e.level === 8), 'sturdy'),
    cycle: atStage(first((e) => e.kind === 'cycle' && (e.weeks ?? 0) >= 3), 'sturdy'),
  };
  return samples;
}

/* ---------- 商城与知识卡（brief §6、ia §1.16）：商家与品牌全部虚构，价格为示例 ---------- */
export type KnowledgeId = 'belt' | 'straps' | 'protein' | 'creatine' | 'knee';
export interface Knowledge { id: KnowledgeId; title: string; why: string; when: string; how: string[]; category: '护具' | '补剂'; supplement: boolean }
export const KNOWLEDGE: Record<KnowledgeId, Knowledge> = {
  belt: { id: 'belt', title: '腰带：什么时候该系', why: '你的深蹲预估 1RM 已到体重的 1.5 倍', when: '大重量复合动作（深蹲、硬拉）的顶组', category: '护具', supplement: false,
    how: ['只在接近极限的组里系，热身和轻重量不系', '系在肚脐上下，吸一口气顶住腰带', '不能代替核心力量：平时照样练'] },
  straps: { id: 'straps', title: '助力带：先练握力，再用它', why: '拉类动作的余力长期比推类少，握力先到极限', when: '背部还有力气、手先抓不住的组', category: '护具', supplement: false,
    how: ['只在最后几组用', '每周留一两次不用助力带的拉', '镁粉比助力带更该先试'] },
  protein: { id: 'protein', title: '恢复：蛋白质与睡眠比补剂更重要', why: '你的胸部恢复比预期窗口慢了约 20%', when: '恢复度经常不到 50% 时', category: '补剂', supplement: true,
    how: ['每天蛋白质约体重 × 1.6–2.2 克', '先保证 7 小时以上睡眠', '饮食够了再考虑蛋白粉'] },
  creatine: { id: 'creatine', title: '肌酸：研究最充分的补剂', why: '你近 4 周训练量持续上升', when: '训练量在涨、想提升高强度组的表现', category: '补剂', supplement: true,
    how: ['每天 3–5 克，什么时候吃都行', '不需要冲击期', '多喝水；肾功能有问题先问医生'] },
  knee: { id: 'knee', title: '护膝：保暖支撑，不是「借力」', why: '你的深蹲量高，膝部动作多', when: '大重量深蹲、膝盖怕冷', category: '护具', supplement: false,
    how: ['选保暖支撑型（5–7 毫米）', '弹力很强的护膝会「借力」，记录 PR 时注明', '膝盖疼不是护膝能解决的，先降重量'] },
};

/** 商品状态（ia §1.16，2026-10-06）：热销 / 折扣（划线价）/ 新品 / 缺货（不可下单，可「到货提醒」）/ 已下架（不在商城列表里，从知识卡或旧链接进来时详情页提示并回商城） */
export type ProductStatus = 'normal' | 'hot' | 'sale' | 'new' | 'oos' | 'off';
export interface Product {
  id: string; name: string; merchant: string; spec: string; price: number; member: number; category: '护具' | '补剂'; knowledge: KnowledgeId;
  status: ProductStatus;
  /** 折扣前的价格（划线价），只有折扣商品有 */
  was?: number;
  /** 可选规格（尺码 / 口味）；没有 = 只有一种 */
  sizes?: string[];
  /** 商家写的说明（详情页「商家 · 规格说明」），只写材质与用法，不写功效数字 */
  about: string;
  /** 缺货：预计到货 */
  eta?: string;
}
export const PRODUCTS: Product[] = [
  { id: 'belt-10', name: '杠铃腰带 10 毫米', merchant: '铁砧运动', spec: '牛皮 · 单齿扣', price: 329, member: 296, category: '护具', knowledge: 'belt', status: 'sale', was: 399, sizes: ['S', 'M', 'L'],
    about: '10 毫米植鞣牛皮，单齿扣一拉到位；前后同宽。尺码按系腰带的位置量腰围：S 64–76、M 74–90、L 86–102 厘米。' },
  { id: 'whey', name: '乳清蛋白 2 磅', merchant: '慢火补剂', spec: '约 30 份', price: 259, member: 233, category: '补剂', knowledge: 'protein', status: 'hot', sizes: ['原味', '可可'],
    about: '每份 30 克粉约含 22 克蛋白质。先吃够正餐，差多少补多少；乳糖不耐受选小份量试。' },
  { id: 'creatine', name: '一水肌酸 300 克', merchant: '慢火补剂', spec: '无味 · 约 60 份', price: 119, member: 107, category: '补剂', knowledge: 'creatine', status: 'new',
    about: '一水肌酸单一成分，无添加。每天 5 克，随水或饭后都行。' },
  { id: 'knee', name: '7 毫米护膝', merchant: '山羊护具', spec: '氯丁橡胶 · 一对', price: 199, member: 179, category: '护具', knowledge: 'knee', status: 'oos', sizes: ['S', 'M', 'L'], eta: '预计 10 月中到货',
    about: '7 毫米氯丁橡胶套筒，保暖、支撑，不带弹力绑带。尺码按膝盖上方 10 厘米的腿围：S 31–35、M 35–38、L 38–42 厘米。' },
  { id: 'straps', name: '8 字助力带', merchant: '铁砧运动', spec: '棉 + 硅胶防滑 · 一对', price: 69, member: 62, category: '护具', knowledge: 'straps', status: 'normal',
    about: '棉织带 + 硅胶防滑点，8 字形套腕。适合硬拉、耸肩这类握力先到极限的拉。' },
  { id: 'chalk', name: '液体镁粉 50 毫升', merchant: '山羊护具', spec: '速干', price: 39, member: 35, category: '护具', knowledge: 'straps', status: 'off',
    about: '涂在手掌，干了以后防滑。' },
];
/** 商城列表里的商品：已下架的不出现（详情页仍能打开，提示并回商城） */
export const SHOP_PRODUCTS = PRODUCTS.filter((p) => p.status !== 'off');
export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
export const STATUS_LABEL: Record<ProductStatus, string> = { normal: '', hot: '热销', sale: '折扣', new: '新品', oos: '缺货', off: '已下架' };
/** 牛劲抵扣：100 牛劲抵 1 元，单笔最多抵 20%（brief §4） */
export const niujinOff = (price: number, balance: number) => Math.min(Math.floor(balance / 100), Math.floor(price * 0.2));

export type CouponType = 'merchant' | 'shipping' | 'trial' | 'freeze';
export interface CouponSpec { type: CouponType; title: string; detail: string; cost: number }
export const COUPONS: Record<CouponType, CouponSpec> = {
  merchant: { type: 'merchant', title: '铁砧运动 满 200 减 30', detail: '护具类 · 30 天内有效', cost: 1500 },
  shipping: { type: 'shipping', title: '免邮券', detail: '商城任意订单', cost: 300 },
  trial: { type: 'trial', title: 'Milo Pro 体验 7 天', detail: '全部权益', cost: 2000 },
  freeze: { type: 'freeze', title: '连胜冻结卡', detail: '断档时周一自动使用', cost: 800 },
};

/** 目录矩阵用的成长状态：演示用户练到第 30 周（第 20 周用牛劲兑换过一张冻结卡），全部引擎实算 */
let gs: GrowthState | null = null;
export function growthSample(): GrowthState {
  if (gs) return gs;
  const u = growthDemoUser();
  gs = growth(env, { history: u.history, profile: u.profile, now: SIM_START + 30 * 7 * DAY - 3600e3, deloads: u.deloads,
    wallet: [{ atMs: SIM_START + 20 * 7 * DAY, kind: 'redeem', label: COUPONS.freeze.title, cost: COUPONS.freeze.cost, freeze: 1 }] });
  return gs;
}
export const dateOf = (ms: number) => { const d = new Date(ms); return `${d.getMonth() + 1}月${d.getDate()}日`; };
