/** 组件目录：Playground 的唯一来源（DESIGN §9）。
 *  每一项 = 一个导出组件 × 它的变体轴；变体 = 各轴取值的笛卡尔积，去掉 skip 掉的不可能组合。
 *  catalog.test 核对：components/index.ts 的每个可见组件都在这里（或在 NOT_IN_MATRIX 里写明原因），每个变体都能渲染。
 *  按下 / 聚焦在代码里是 :active / :focus-visible，这里经 state 强制显示（state.ts）。 */
import { useRef, type ReactNode } from 'react';
import {
  BackToTop, Banner, BodyFigure, DotCalendar, SteelPlate, GainGroupHead, GainRow, GainSummary, SharedDetail, FluidBackdrop, GiantNumber, Odometer, RestDock, StepRing, WeekBars, dotMonths, Button, Capsule, CapsuleRail, Card, Chip, DayCell, Delta, DialogCard, ExerciseRow, Icon, ICONS, IconButton, IncrementRuler, LandmarkRuler,
  BodyPicker, PickRow, SwapRow, WarmupStrip,
  ListRow, List, MediaFrame, Nav, NumberField, Num, OptionCard, PageHeader, PhaseSegments, PrescriptionHero, ProfileTile, ProgressSteps, RestBar, SectionLabel, Segmented,
  SessionRow, SetEditor, SetLine, SetRow, NumPad, Sheet, Tilt, SheetBlock, Skeleton, Sparkline, StateView, Stepper, Switch, Tag, Ticks, TierLegend, Toast, TopBar, TrendChart, WeekStrip,
  AppIcon, Lockup, LogoGlyph, Mascot, MascotHead, PropGlyph, type PropKind, RewardCard, AgeBadge, Coupon, FreezeCard, GrowthBar, GrowthCard, StageHero, StreakWeeks, KnowledgeTip, LedgerRow, MessageRow, NiujinBalance, Paywall, ProBadge, ProductCard, StreakBar, Breakdown, DemoBanner, EvidencePanel, NiujinLine, OrderLine, PriceBlock, ProductGrid, RecommendCard, WalletExits, MonthStats, PerkLedger, PerkTable, PlanPicker, ProCard, ProWelcome,
  type LogoState, type MascotMood, type MascotStage, type StreakStatus, type StreakWeekStatus,
  type Forced, type IconName, type NumSize, type SkeletonShape, type Tab, type TagTone,
} from '../components';
import type { DeltaDir } from '../components';
import { REGION_NAME, fmt } from '../data/demo';
import { COUPONS, KNOWLEDGE, PRODUCTS, dateOf, growthSample, sampleRewards, type KnowledgeId } from '../data/growth';
import { PRO_PERKS } from '../data/pro';
import { GROWTH_CONFIG } from '../engine';
import { T } from '../styles/tokens.gen';
import type { Fixtures } from './fixtures';
import { FinderDemo, GuideDemo, famName, groupOf } from './finderDemos';
import { PICK_SKIP } from '../data/finder';
import s from './Playground.module.css';

export type Props = Record<string, string>;
export type CellSize = 'auto' | 'm' | 'card' | 'screen';
export interface Entry {
  name: string;
  group: string;
  desc: string;
  axes: Record<string, readonly string[]>;
  /** 矩阵布局：rows 的取值组合成行，cols 成列；不写就按列表排 */
  rows?: string[];
  cols?: string;
  size?: CellSize;
  /** 同一项还覆盖了哪些导出（例如 Dialog 项也覆盖 DialogCard） */
  covers?: string[];
  skip?: (p: Props) => boolean;
  render: (p: Props, f: Fixtures) => ReactNode;
}

export const GROUPS = ['基础', '表单', '反馈与悬浮层', '列表与页头', '训练与记录', '数据图形', '容量', '导航', '品牌', '增长', '商城', '会员'] as const;

/** 只在交互演示或页面里出现、不进矩阵的导出（catalog.test 读这张表） */
export const NOT_IN_MATRIX: Record<string, string> = {
  Cascade: 'M07 交错入场是一段动画，见「训练与记录 · ExerciseRow」下的交互演示',
  Collapsible: '可收起的一块（高度弹簧 + 展开时 M07 交错弹入），是一段动画，见「训练与记录 · GainGroupHead」下的交互演示',
  Screen: '页面框（版式容器），见 /spec §4 与整页演示',
  OptionGroup: '单选组的方向键行为，见「表单」交互演示',
  ToastViewport: 'Toast 的出口，见「反馈」交互演示',
  Dialog: 'DialogCard 加遮罩、焦点圈定和返回键，见「反馈」交互演示',
  StatusStrip: 'Banner 的旧名（已弃用）',
};

const STATE = ['default', 'pressed', 'focused', 'disabled'] as const;
const st = (v: string): Forced => (v === 'pressed' || v === 'focused' ? v : undefined);
const noop = () => {};

/** 轴取值的中文标注（矩阵表头与单元格说明） */
export const CN: Record<string, string> = {
  'w-none': '还没热身', 'w-one': '热了 1 组', 'w-all': '热身做完', last: '有上次重量', secondary: '只练到协同', 'not-owned': '没有这个器械', recommended: '推荐 · 已选', 'sw-plain': '普通', 'sw-first': '首次',
  'sel-none': '没选', 'sel-family': '选整块肌肉', 'sel-sub': '细分到一个肌头', 'from-home': '从首页进', 'from-body': '从容量页进', peek: '常态',
  default: '默认', pressed: '按下', focused: '聚焦', disabled: '禁用', loading: '加载中', primary: '主操作', primary_glow: '主操作 · 光晕', neutral: '中性', ghost: '描边', danger: '危险',
  l: '大', s: '小', raised: '实底', plain: '无底', true: '是', false: '否', single: '单选', multi: '多选', empty: '空', filled: '已填', error: '错误', 'error-reps': '次数错误', 'np-ready': '可完成', 'np-blocked': '缺值 / 超范围', 'pk-freeze': '冻结卡', 'pk-niujin': '牛劲', 'pk-trial': 'Pro 体验', 'pk-shipping': '免邮券', 'pk-merchant': '商家券', 'ps-normal': '可用', 'ps-used': '刚用掉', 'ps-dim': '已用 / 过期',
  with: '带读数', without: '不带读数', mixed: '有涨有退', all_up: '全在涨', only_baseline: '都是基线', idle_4w: '近 4 周没练', min: '到下限', max: '到上限', strong: '强调', outline: '虚线', up: '上升', down: '下降', flat: '持平', baseline: '基线', static: '只读', nav: '可进入',
  toggle: '开关', plain_card: '普通', hero: '主角', todo: '待做', first: '首次', current: '进行中', done: '已完成', skipped: '未做', missing: '缺值',
  editing: '修改中', warmup: '热身组', drop: '递减组', running: '计时中', ending: '即将结束', normal: '普通', pr: '有 PR', deload: '减量周', trained: '已练',
  'trained-pr': '已练 · PR', rest: '休息', today: '今天', future: '未来', selected: '选中', ready: '已加载', many: '多次', 'many-selected': '多次 · 选中一次',
  one: '只有 1 次', none: '未练', off: '不画环', empty_pts: '没有记录', single_pt: '只有 1 次', add: '加重', hold: '保持', cut: '减重', low: '不足', ok: '达标', over: '超量', repair: '修复期',
  recovering: '恢复中', golden: '黄金窗', decayed: '已回落', near: '邻近', focus: '焦点', front: '正面', back: '背面', male: '男', female: '女',
  track: '已开始 · 0 组', partial: '进行中', full: '满环', home: '首页', body: '容量', gains: '增量', log: '记录', me: '我的', success: '成功', undo: '可撤销',
  suggest: '建议减量', week: '减量周', quiet: '一行小字', 'pool-empty': '动作池不足', resume: '继续上次训练', info: '信息', page: '子页', session: '训练中',
  sub: '标题下带日期与附件', fold: '收起', closed: '已收起', pill: '小胶囊', open: '展开', loadingState: '加载中', shown: '已出现', lifted: '抬到主按钮上面', 'today-done': '今天练过',
  experience: '训练经验', minutes: '单次时长', equipment: '可用器械', 'w-steady': '稳定守约', 'w-mixed': '有减量也有冻结', 'w-cold': '刚起步',
  'k-value': '付费墙 · 按你的数据', 'k-link': '会员中心 · 权益入口', 'k-pair': '开通成功 · 刚到手的', 'plan-year': '选中年度', 'plan-month': '选中月度', 'plan-trial': '选中试用', 'plan-two': '试用用过了',
  'pb-pro': '已开通 · Pro 实底', 'pc-pro': '已开通', 'pc-trial': '试用中', 'pc-expired': '已到期',
  'g-cycles': '涨幅太大 · 只写周期', 'g-bare': '牛龄页（不重复段名）',
  newborn: '牛犊', young: '小牛', sturdy: '壮牛', bull: '公牛', milo: 'Milo', 'm-idle': '平常', 'm-focused': '专注', 'm-happy': '开心', 'm-rest': '恢复日', 'm-pr': '破纪录', 'm-deload': '减量周', idle: '平常', training: '训练中',
  'r-stage': '升段', 'r-milo': '升段 · Milo', 'r-pr': '破纪录', 'r-streak': '连胜里程碑', 'r-level': '升小级', 'r-cycle': '周期完成', free: '免费', pro: 'Pro 会员',
  'b-compact': '紧凑（「我的」顶部）', 'b-full': '完整（牛龄页头）', 'g-normal': '进行中', 'g-near': '快升级', 'g-stage': '下一级是升段', 'g-max': 'Milo 满级',
  's-zero': '0 周', 's-open': '本周进行中', 's-kept': '本周已守约', 's-risk': '快断了', 's-frozen': '用了冻结卡', 's-deload': '减量周', 's-milestone': '里程碑周',
  'f-have': '有卡', 'f-none': '没卡', 'f-used': '刚自动使用', 'c-merchant': '商家券', 'c-shipping': '免邮券', 'c-trial': '会员体验', 'c-freeze': '冻结卡',
  'c-redeem': '可兑换', 'c-short': '牛劲不够', 'c-available': '可用', 'c-used': '已用', 'c-expired': '已过期', belt: '腰带', straps: '助力带', protein: '蛋白质与睡眠', creatine: '肌酸', knee: '护膝',
  'k-tip': '页内提示', 'k-header': '详情页头', 'p-normal': '普通', 'p-member': '会员价', 'p-niujin': '牛劲抵扣', 'p-off': '已下架',
  'w-month': '选月度', 'w-year': '选年度', 'w-trial': '选试用', 'w-member': '已是会员', 'w-success': '开通成功', locked: '入口标记', active: '已开通', reward: '奖励', freeze: '冻结卡', demote: '降级说明',
  compact: '≤ 24 像素（7 根）', wide: '完整（9 根）', dark: '深底', light: '浅底', color: '彩色', mono: '单色',
};
export const cn = (v: string) => CN[v] ?? v;

const hero = (f: Fixtures, mode: string) => {
  const it = f.items[0];
  const w = it?.suggestion.weightKg ?? 60, last = f.home.lastWeight(it?.exerciseId ?? '') ?? w;
  const map: Record<string, [number | null, number | null, string]> = {
    add: [w, last < w ? last : w - f.step, it?.suggestion.reason.text ?? ''],
    hold: [w, w, '上次有组没顶到上限 → 重量不变，每组 +1 次'],
    cut: [w, w + f.step * 2, '上次有组掉出下限 → 减重 7.5%'],
    first: [null, null, ''],
    deload: [Math.round((w * 0.9) / f.step) * f.step, w, '减量周：强度 ×0.9'],
  };
  const [weight, lastW, reason] = map[mode];
  return <PrescriptionHero order={1} region={it ? REGION_NAME[it.region] : '胸'} name={it?.name ?? '杠铃卧推'} weight={weight} sets={it?.sets ?? 3}
    reps={it?.repRange ?? [6, 8]} reason={reason} last={lastW} step={f.step} deload={mode === 'deload'} />;
};

const cap = (f: Fixtures, tier: string, size: string) => {
  const h = f.tiers[tier as keyof Fixtures['tiers']];
  const w = T['size/screen-w'] * 0.55;
  const box = size === 'focus' ? { h: T['size/capsule-focus-h'], weight: 1, focus: true, grow: T['size/capsule-focus-grow'] }
    : size === 'near' ? { h: T['size/capsule-near-h'], weight: 0.5, focus: false, grow: T['size/capsule-near-grow'] / 2 }
    : { h: T['size/capsule-rest-max-h'], weight: 0, focus: false, grow: 0 };
  return <Capsule standalone h={h} c={{ i: 0, x: 0, y: 0, w: w + box.grow, h: box.h, weight: box.weight, focus: box.focus }} />;
};

export const CATALOG: Entry[] = [
  /* ---------------- 基础 ---------------- */
  {
    name: 'Icon', group: '基础', desc: 'I3：24u 网格上 2u 圆头断笔线稿，画完整体 skewX(−11°)；颜色跟随 currentColor；默认 size/icon，小号 size/icon-s。导航五个图标按图标网格规范对齐（下方内嵌整页规范板，源文件 design/icon-grid/index.html）。选中描线（导航、选项打勾）：横笔从左往右、竖笔从下往上、左下的笔先起，下面「重播描线」可看。装饰性，含义由文字或 aria-label 给出。',
    axes: { name: ICONS }, size: 'auto',
    render: (p) => <span className={s.iconCell}><Icon name={p.name as IconName} /><span className="milo-text-micro">{p.name}</span></span>,
  },
  {
    name: 'Button', group: '基础', desc: 'primary 荧光 = 每屏唯一的行动焦点；glow（M06）= 再加一圈慢转的圆锥渐变描边与呼吸光晕，只给首页「开始训练」；neutral 骨白 = 完成 / 确认；ghost = 次要；danger = 删除、清除。按下：缩放 + 内阴影，松手弹簧回弹（M08）。加载时宽度不变、不可重复点。',
    axes: { kind: ['primary', 'primary_glow', 'neutral', 'ghost', 'danger'], size: ['l', 's'], state: [...STATE, 'loading'] }, rows: ['kind', 'size'], cols: 'state', size: 'm',
    skip: (p) => p.kind === 'primary_glow' && (p.size === 's' || p.state !== 'default'),
    render: (p) => <Button kind={p.kind.startsWith('primary') ? 'primary' : p.kind as 'primary'} glow={p.kind === 'primary_glow'} size={p.size as 'l'} state={st(p.state)} disabled={p.state === 'disabled'} loading={p.state === 'loading'}>
      {p.kind.startsWith('primary') ? '开始训练' : p.kind === 'neutral' ? '完成' : p.kind === 'ghost' ? '再练一次' : '删除训练'}</Button>,
  },
  {
    name: 'IconButton', group: '基础', desc: '视觉 size/button-h-s，命中区补到 hit-min；必须有 aria-label。raised 用在页头与面板，plain 用在行内。',
    axes: { kind: ['raised', 'plain'], state: STATE }, rows: ['kind'], cols: 'state', size: 'auto',
    render: (p) => <IconButton icon={p.kind === 'raised' ? 'close' : 'edit'} label="示例" kind={p.kind as 'raised'} state={st(p.state)} disabled={p.state === 'disabled'} />,
  },
  {
    name: 'Tag', group: '基础', desc: 'neutral 信息；strong 骨白实心只给 PR；outline 虚线 = 首次 / 基线 / 未做；danger = 错误。',
    axes: { tone: ['neutral', 'strong', 'outline', 'danger'] }, size: 'auto',
    render: (p) => <Tag tone={p.tone as TagTone} icon={p.tone === 'strong' ? 'star' : undefined}>{({ neutral: '13 组', strong: 'PR 2', outline: '首次', danger: '保存失败' } as Props)[p.tone]}</Tag>,
  },
  {
    name: 'Num', group: '基础', desc: '数字一律 font/number（Barlow Condensed），单位跟 Caption、text/secondary。',
    axes: { size: ['hero', 'xl', 'l', 'm', 's', 'xs'] }, size: 'auto',
    render: (p) => <Num size={p.size as NumSize} value={p.size === 'hero' || p.size === 'xl' ? '85' : '13,854'} unit="kg" />,
  },
  {
    name: 'Delta', group: '基础', desc: '方向用形状 + 文字，不只靠颜色：上升 ▲、下降 ▼、持平 =（±1% 以内）、只有 1 次记录写「基线」。',
    axes: { dir: ['up', 'down', 'flat', 'baseline'] }, size: 'auto',
    render: (p) => <Delta dir={p.dir as DeltaDir} value={p.dir === 'up' ? '+2.5 kg' : '−1.2 kg'} />,
  },
  /* ---------------- 表单 ---------------- */
  {
    name: 'Segmented', group: '表单', desc: '2–3 个互斥视图（正面 / 背面、男 / 女）。选中骨白，命中区外扩到 hit-min；方向键切换。',
    axes: { items: ['2', '3'], state: STATE }, rows: ['items'], cols: 'state', size: 'auto',
    render: (p) => <Segmented label="示例" items={p.items === '2' ? [['f', '正面'], ['b', '背面']] : [['a', '全部'], ['b', '上肢'], ['c', '下肢']]} value={p.items === '2' ? 'f' : 'a'}
      state={st(p.state)} disabled={p.state === 'disabled'} />,
  },
  {
    name: 'Chip', group: '表单', desc: '筛选（增量页按部位）。选中骨白；aria-pressed。',
    axes: { selected: ['false', 'true'], state: STATE }, rows: ['selected'], cols: 'state', size: 'auto',
    render: (p) => <Chip selected={p.selected === 'true'} state={st(p.state)} disabled={p.state === 'disabled'}>{p.selected === 'true' ? '胸' : '下肢'}</Chip>,
  },
  {
    name: 'Switch', group: '表单', desc: '设置里的即时开关（显示今日进度环等），改动立即生效。role=switch。',
    axes: { on: ['false', 'true'], state: STATE }, rows: ['on'], cols: 'state', size: 'auto',
    render: (p) => <Switch checked={p.on === 'true'} label="显示今日进度环" state={st(p.state)} disabled={p.state === 'disabled'} />,
  },
  {
    name: 'OptionCard', group: '表单', desc: '建档与设置的选项：single = 单选（训练经验），multi = 多选（可用器械）。选中为骨白描边 + 实心标记；多选刚被选中时，勾按导航同一套描线画出来（从左到右、从下到上）。',
    axes: { mode: ['single', 'multi'], selected: ['false', 'true'], state: STATE }, rows: ['mode', 'selected'], cols: 'state', size: 'card',
    render: (p) => <OptionCard mode={p.mode as 'single'} selected={p.selected === 'true'} state={st(p.state)} disabled={p.state === 'disabled'}
      title={p.mode === 'single' ? '进阶' : '杠铃'} detail={p.mode === 'single' ? '规律训练 1–3 年' : undefined} />,
  },
  {
    name: 'Stepper', group: '表单', desc: '重量 ±步进、时长 ±15 分钟、休息 ±15 秒。到上下限时那一侧禁用；数值可聚焦、方向键调整。',
    axes: { state: ['default', 'min', 'max', 'focused', 'disabled'] }, size: 'auto',
    render: (p) => <Stepper label="单次训练时长" step={15} min={30} max={150} unit="分钟" value={p.state === 'min' ? 30 : p.state === 'max' ? 150 : 60}
      state={st(p.state)} disabled={p.state === 'disabled'} />,
  },
  {
    name: 'NumberField', group: '表单', desc: '记组的重量、次数。超范围或非数字一律拒绝并行内提示（feedback/danger + 图标），不静默截断。',
    axes: { state: ['empty', 'focused', 'filled', 'error', 'disabled'] }, size: 'card',
    render: (p) => <NumberField label="重量" unit="kg" placeholder="0" value={p.state === 'filled' || p.state === 'focused' ? '62.5' : p.state === 'error' ? '620' : ''}
      error={p.state === 'error' ? '重量范围 0–500 kg' : undefined} helper={p.state === 'empty' ? '0 表示自重' : undefined} state={st(p.state)} disabled={p.state === 'disabled'} />,
  },
  {
    name: 'ProgressSteps', group: '表单', desc: '建档三步；已完成与当前段骨白。',
    axes: { step: ['1', '2', '3'] }, size: 'card',
    render: (p) => <ProgressSteps current={Number(p.step)} total={3} />,
  },
  /* ---------------- 反馈与悬浮层 ---------------- */
  {
    name: 'Banner', group: '反馈与悬浮层', desc: '页面顶部的状态位：减量建议 / 减量周 / 这次不减（一行小字）/ 动作池不足 / 继续上次训练 / 错误。左侧竖条骨白或 feedback/danger。',
    axes: { kind: ['suggest', 'week', 'quiet', 'pool-empty', 'resume', 'error'] }, size: 'card',
    render: (p) => ({
      suggest: <Banner title="建议本周减量" detail="2 个动作的预估 1RM 连降两次" actions={<Button kind="ghost" size="s">看看</Button>} />,
      week: <Banner title="减量周 · 还剩 4 天" detail="组数减半、强度 ×0.9" />,
      quiet: <Banner quiet detail="减量信号仍在 · 你选了这次不减（6 天内不再提示）" />,
      'pool-empty': <Banner title="当前器械下没有可排的动作" detail="去「我的」里加器械" actions={<Button kind="ghost" size="s">去设置</Button>} />,
      resume: <Banner title="继续上次训练" detail="已记 5 组 · 32 分钟前" actions={<Button kind="neutral" size="s">继续</Button>} />,
      error: <Banner tone="error" title="处方没算出来" detail="引擎出错，数据没有丢" actions={<Button kind="ghost" size="s" icon="refresh">重试</Button>} />,
    } as Record<string, ReactNode>)[p.kind],
  },
  {
    name: 'Toast', group: '反馈与悬浮层', desc: '操作结果，停在导航上方，停留 motion/toast-hold（有撤销的加倍）；一次只显示一条。错误用 role=alert。',
    axes: { kind: ['success', 'error', 'undo'] }, size: 'card',
    render: (p) => p.kind === 'undo' ? <Toast message="已删除这次训练" action="撤销" /> : <Toast kind={p.kind as 'success'} message={p.kind === 'error' ? '保存失败，数据还在本机' : '已保存 · 3 组'} />,
  },
  {
    name: 'DialogCard', group: '反馈与悬浮层', desc: '只用于二次确认。确认在上（骨白或危险），取消在下（描边）；焦点圈定、Esc / 返回键关闭。',
    axes: { tone: ['neutral', 'danger'] }, size: 'card', covers: ['Dialog'],
    render: (p) => p.tone === 'danger'
      ? <DialogCard tone="danger" icon="trash" title="删除这次训练？" confirm="删除">近 7 天容量、恢复度、趋势和 PR 会重新计算。</DialogCard>
      : <DialogCard icon="info" title="载入示例数据？" confirm="载入">会覆盖现有的训练历史。</DialogCard>,
  },
  {
    name: 'Sheet', group: '反馈与悬浮层', desc: '底部面板（肌头详情、减量面板）。盖住导航；点遮罩、×、Esc、返回键关闭。sharedId：由某个元素原地长出来（M03，容量页胶囊 → 肌头详情），这时面板不再自己滑上来。',
    axes: {}, size: 'screen', covers: ['SheetBlock'],
    render: () => <div className={s.sheetBox}><Sheet docked title="中下胸" meta="大肌群" onClose={noop}><PhaseSegments phase="recovering" />
      <SheetBlock label="近 7 天容量"><LandmarkRuler value={7.5} mev={8} mav={16} mrv={22} /></SheetBlock></Sheet></div>,
  },
  {
    name: 'Skeleton', group: '反馈与悬浮层', desc: '加载占位，与真实内容同尺寸；减少动态效果时不闪。',
    axes: { shape: ['line', 'num', 'row', 'card', 'capsule'] }, size: 'card',
    render: (p) => <Skeleton shape={p.shape as SkeletonShape} />,
  },
  {
    name: 'StateView', group: '反馈与悬浮层', desc: '页面级数据态：加载（骨架）/ 空（引导到下一步）/ 错误（重试）。部分数据在页面里就地处理：缺的行隐藏，不显示 0。',
    axes: { kind: ['loadingState', 'empty', 'error'] }, size: 'card',
    render: (p) => p.kind === 'loadingState' ? <StateView kind="loading" />
      : p.kind === 'empty' ? <StateView kind="empty" title="还没有训练记录" detail="练完第一次，这里会按时间列出来" action="去看今日处方" />
      : <StateView kind="error" title="历史没读出来" detail="本地存储读取失败，数据没有被改动" action="重试" />,
  },
  /* ---------------- 列表与页头 ---------------- */
  {
    name: 'ListRow', group: '列表与页头', desc: '行高不小于 hit-min，行间刻度分隔线。static 只读；nav 进入子页；toggle 整行是开关的 label（按下 / 聚焦落在开关上）；danger 危险操作。',
    axes: { kind: ['static', 'nav', 'toggle', 'danger'], state: STATE }, rows: ['kind'], cols: 'state', size: 'card', covers: ['List'],
    skip: (p) => p.kind === 'static' && p.state !== 'default',
    render: (p) => <List><ListRow kind={p.kind as 'nav'} state={st(p.state)} disabled={p.state === 'disabled'}
      title={({ static: '重量单位', nav: '可用器械', toggle: '显示今日进度环', danger: '清除全部数据' } as Props)[p.kind]}
      detail={p.kind === 'nav' ? '杠铃、哑铃、固定器械 等 6 类' : p.kind === 'static' ? 'kg（lb 见 P1）' : undefined}
      trailing={p.kind === 'toggle' ? <Switch checked label="显示今日进度环" state={st(p.state)} disabled={p.state === 'disabled'} /> : undefined} /></List>,
  },
  {
    name: 'Card', group: '列表与页头', desc: 'bg/raised + 细描边 + radius/l；hero 带一点径向渐变深度，只给每屏的主角卡。可点时整卡是一个按钮。',
    axes: { kind: ['plain_card', 'hero'], state: ['default', 'pressed', 'focused'] }, rows: ['kind'], cols: 'state', size: 'card',
    render: (p) => <Card hero={p.kind === 'hero'} onClick={noop} label="示例卡片" state={st(p.state)}><span className="milo-text-caption">近 7 天</span><Num size="l" value="13,854" unit="kg" /></Card>,
  },
  {
    name: 'ProfileTile', group: '列表与页头',
    desc: '档案格（「我的」的 2×2）：小字名称在上、大字当前值在下（压缩粗体，单位小字），整格是按钮，点开对应的编辑面板；命中区远大于 hit-min。体型那一格填了体重会写「男 · 72 kg」。',
    axes: { tile: ['experience', 'minutes', 'equipment', 'body'], state: ['default', 'pressed', 'focused'] }, rows: ['tile'], cols: 'state', size: 'card',
    render: (p) => {
      const v = { experience: ['训练经验', '进阶', undefined], minutes: ['单次时长', '60', '分钟'], equipment: ['可用器械', '6', '类'], body: ['体型示意', '男 · 72', 'kg'] }[p.tile] as [string, string, string | undefined];
      return <ProfileTile label={v[0]} value={v[1]} unit={v[2]} onClick={noop} state={st(p.state)} />;
    },
  },
  {
    name: 'SectionLabel', group: '列表与页头', desc: '区块标题（Label，text/secondary），可带右侧附件。', axes: {}, size: 'card',
    render: () => <SectionLabel trailing={<span className="milo-text-caption">3 个</span>}>接下来</SectionLabel>,
  },
  {
    name: 'PageHeader', group: '列表与页头', desc: 'Tab 根页的页头：Title/L，上边距 space/l；标题行固定一个命中区高（48），右侧有没有分段控件 / 链接标题都在同一个 y 上——五个 Tab 切换时大标题不跳。标题上方不放任何东西；日期、计数、标签一律写在标题下面。页头跟着内容滑走，不留细标题栏（2026-10-06 用户）。',
    axes: { kind: ['plain', 'sub'] }, size: 'screen',
    render: (p) => p.kind === 'plain' ? <PageHeader title="记录" /> : <PageHeader title="今日处方" trailing={<Segmented label="视图" items={[['f', '正面'], ['b', '背面']]} value="f" />}><p className="milo-text-caption">10月3日 周六</p></PageHeader>,
  },
  {
    name: 'BackToTop', group: '列表与页头', desc: '回到顶端：长页滚过一屏才出现（右下角、导航上方，命中 48），点了平滑滚回顶；有固定主按钮的页（首页）抬到主按钮上面。出现 / 收起从下往上弹入（spring-soft），按下 M08；中性配色，不占荧光。所有长页都有：首页、身体、增量、动作曲线、记录、训练详情、我的、牛龄、消息。',
    axes: { state: ['shown', 'lifted'] }, size: 'screen',
    render: (p) => <BackToTopCell lift={p.state === 'lifted'} />,
  },
  {
    name: 'TopBar', group: '列表与页头', desc: '没有 Tab 的子页：返回 + 标题（Heading）+ 右侧操作。训练中右侧是计时与「结束」。',
    axes: { kind: ['page', 'session'] }, size: 'screen',
    render: (p) => p.kind === 'page' ? <TopBar title="杠铃卧推" sub="胸 · 复合" onBack={noop} trailing={<IconButton kind="plain" icon="more" label="更多" />} />
      : <TopBar title="训练中" sub={<Num size="s" value="32:15" />} onBack={noop} trailing={<Button kind="ghost" size="s">结束</Button>} />,
  },
  /* ---------------- 训练与记录 ---------------- */
  {
    name: 'PrescriptionHero', group: '训练与记录', desc: '首页第一个动作。建议重量 Number/Hero，增量尺画「上次 → 这次」；首次不编数字，写怎么选重量。',
    axes: { mode: ['add', 'hold', 'cut', 'first', 'deload'] }, size: 'card',
    render: (p, f) => hero(f, p.mode),
  },
  {
    name: 'ExerciseRow', group: '训练与记录', desc: '处方与训练中的动作行。进行中左侧骨白竖条；已完成 / 未做降到 opacity/done-row；首次不显示重量。',
    axes: { status: ['todo', 'first', 'current', 'done', 'skipped'], state: ['default', 'pressed', 'focused'] }, rows: ['status'], cols: 'state', size: 'card',
    render: (p, f) => {
      const it = f.items[1] ?? f.items[0];
      const status = p.status === 'first' ? 'todo' : p.status;
      return <ExerciseRow name={it?.name ?? '窄握下拉'} detail={`${it ? REGION_NAME[it.region] : '背'} · ${it?.sets ?? 3} × ${(it?.repRange ?? [6, 8]).join('–')}`}
        weight={p.status === 'first' ? null : it?.suggestion.weightKg ?? 50} status={status as 'todo'} sets={[p.status === 'done' ? it?.sets ?? 3 : 1, it?.sets ?? 3]} state={st(p.state)} />;
    },
  },
  {
    name: 'GainRow', group: '训练与记录', desc: '增量页的一行（P09）：名称（近 4 周 PR 打标）+ 下次目标（本行最大的数字）、迷你曲线、最近预估值 + 涨跌（▲▼ 形状 + 文字）。曲线和数值是固定宽度的列，所有行的曲线从同一条竖线开始，每条下一道淡基线；曲线每条自己缩放，只表达形状、不同动作之间不比大小。没有点击回调时是静态行，不假装能点；首次没有工作组时不给目标。',
    axes: { dir: ['up', 'flat', 'down', 'baseline'], pr: ['false', 'true'], state: ['default', 'pressed', 'focused', 'loading'] }, rows: ['dir', 'pr'], cols: 'state', size: 'card',
    skip: (p) => p.pr === 'true' && p.dir !== 'up',
    render: (p, f) => (
      <GainRow name="杠铃卧推" latest={p.dir === 'baseline' ? null : 92.5} delta={{ dir: p.dir as DeltaDir, value: p.dir === 'up' ? '+2.5 kg' : p.dir === 'down' ? '−3 kg' : undefined }}
        pr={p.pr === 'true'} points={p.dir === 'down' ? f.trends.falling : p.dir === 'baseline' ? f.trends.one : f.trends.normal}
        target={p.dir === 'baseline' ? null : '85 kg × 6'} note={p.dir === 'down' ? '6 周前' : undefined}
        onClick={p.state === 'default' && p.pr === 'false' ? undefined : () => {}} state={p.state === 'loading' ? 'loading' : st(p.state)} />
    ),
  },
  {
    name: 'GainSummary', group: '训练与记录', desc: '增量页页头首屏的摘要（2026-10-06 返工）：一个配重片环，按「在涨 / 持平 / 在退 / 刚开始记」分四段（形状 + 文字写在右边图例里，每个数后面带「个动作」），环心是近 4 周练过的动作数；下面是近 4 周破纪录次数（码表大数字）和刻度线。近 4 周没练过时环空着，写「还没练」。',
    axes: { mix: ['mixed', 'all_up', 'only_baseline', 'idle_4w'] }, size: 'card',
    render: (p) => {
      const c = { mixed: { up: 4, flat: 8, down: 2, baseline: 1, pr: 26 }, all_up: { up: 6, flat: 0, down: 0, baseline: 0, pr: 9 }, only_baseline: { up: 0, flat: 0, down: 0, baseline: 3, pr: 0 }, idle_4w: { up: 0, flat: 0, down: 0, baseline: 0, pr: 0 } }[p.mix]!;
      return <GainSummary trained={c.up + c.flat + c.down + c.baseline} {...c} />;
    },
  },
  {
    name: 'GainGroupHead', group: '训练与记录', desc: '增量页的结论色带：该加重（整行荧光，整页唯一）/ 保持，次数 +1 / 该减重 / 本周目标 · 减量（灰带）；带下面一句话说明引擎为什么这样分。可收起（2026-10-06 用户）：整条色带是按钮（aria-expanded，按下 M08），右边箭头随展开转 90°；收起时说明那句跟着收（Collapsible 高度弹簧）；增量页默认只展开第一组。减量周只有一组，是静态组头。',
    axes: { kind: ['add', 'hold', 'cut', 'week'], fold: ['open', 'closed', 'static'], state: ['default', 'pressed', 'focused'] }, rows: ['kind', 'fold'], cols: 'state', size: 'card',
    skip: (p) => (p.kind === 'week') !== (p.fold === 'static') || (p.fold === 'static' && p.state !== 'default'),
    render: (p) => <GainGroupHead kind={p.kind as 'add'} count={p.kind === 'week' ? 6 : 3} expanded={p.fold !== 'closed'} onToggle={p.fold === 'static' ? undefined : noop} state={p.state as Forced} />,
  },
  {
    name: 'NumPad', group: '训练与记录',
    desc: '训练页自带数字键盘（Stitch s6 V2 + V1 的「下一组」键）：输入框不弹系统键盘；上面一排是步进（重量 ±2.5 kg，次数 ±1）；右下「下一组」= 完成当前这一组（唯一入口），缺值或超范围时不可用。',
    axes: { state: ['np-ready', 'np-blocked'] }, size: 'card',
    render: (p) => <NumPad onKey={() => {}} onStep={() => {}} step={2.5} unit="kg" onNext={() => {}} nextDisabled={p.state === 'np-blocked'} />,
  },
  {
    name: 'SetLine', group: '训练与记录',
    desc: '首页即打卡（2026-10-06）的组行：一整行就是按钮（命中区整行、不低于 hit-min），点开改数面板（SetEditor），行里没有输入框。当前组选中描边；首次动作重量空时写「填重量」，不预先报红；已打卡的序号换成勾、数字变灰。',
    axes: { status: ['sl-current', 'sl-empty', 'sl-done', 'sl-todo'] }, size: 'card',
    render: (p) => {
      const m: Record<string, ReactNode> = {
        'sl-current': <SetLine index={2} weight="82.5" reps="6" status="current" />, 'sl-empty': <SetLine index={1} weight="" reps="10" status="current" />,
        'sl-done': <SetLine index={1} weight="80" reps="7" status="done" />, 'sl-todo': <SetLine index={3} weight="82.5" reps="6" status="todo" />,
      };
      return m[p.status];
    },
  },
  {
    name: 'SetEditor', group: '训练与记录',
    desc: '改数面板（放在 Sheet 里，M05）：重量 / 次数两块大格子，点一下切换正在改的那格；数字用滚动码表（M04），±2.5 时按位滚；提示行永远占位，提示、报错不挤动格子和键盘；主键「打卡」（从主按钮「填重量」进来）或「好了」（改已有的组）。',
    axes: { state: ['se-weight', 'se-first', 'se-error'] }, size: 'screen',
    render: (p) => {
      const m: Record<string, ReactNode> = {
        'se-weight': <SetEditor weight="82.5" reps="6" field="weight" onField={noop} onKey={noop} onStep={noop} step={2.5} hint="建议 82.5 kg · 步进 ±2.5" onDone={noop} doneLabel="好了" />,
        'se-first': <SetEditor weight="" reps="10" field="weight" onField={noop} onKey={noop} onStep={noop} step={2.5} hint="首次：选一个能干净做完 10 次的重量" onDone={noop} doneLabel="打卡" doneDisabled />,
        'se-error': <SetEditor weight="620" reps="6" field="weight" onField={noop} onKey={noop} onStep={noop} step={2.5} error="最多 500 kg" onDone={noop} doneLabel="好了" doneDisabled />,
      };
      return <div className={s.sheetBox}>{m[p.state]}</div>;
    },
  },
  {
    name: 'Tilt', group: '训练与记录',
    desc: 'M01 3D 倾斜光影：按住核心卡片移动时随触点俯仰微倾（±5°），一道径向高光跟手，松手弹簧回正；竖滑交给页面滚动。只给「这一刻的主角」——结算页的新纪录卡。在这里按住卡片拖一拖。',
    axes: {}, size: 'card',
    render: () => <Tilt><Card hero><span className="milo-text-caption">新纪录 · 杠铃卧推</span><Num size="hero" value="102.5" unit="kg" /></Card></Tilt>,
  },
  {
    name: 'SetRow', group: '训练与记录', desc: '记组。当前组预填建议值，「完成」是唯一入口（一次点击记完一组）；缺值时禁用、在缺的那格下面说明；超范围只圈出错的那一格，红字就在它正下方、同宽（不整行描红）。热身组不计入。',
    axes: { kind: ['todo', 'current', 'missing', 'done', 'editing', 'error', 'error-reps', 'warmup', 'drop'] }, size: 'card',
    render: (p) => {
      const base = { index: 2, weight: '62.5', reps: '8' };
      const m: Record<string, ReactNode> = {
        todo: <SetRow {...base} index={3} status="todo" />, current: <SetRow {...base} status="current" />, missing: <SetRow {...base} weight="" status="current" />,
        done: <SetRow {...base} index={1} status="done" rpe="8" />, editing: <SetRow {...base} index={1} status="editing" />,
        error: <SetRow {...base} weight="620" status="current" error="最多 500 kg" />, 'error-reps': <SetRow {...base} reps="0" status="current" error="1–100 次" errorField="reps" />, warmup: <SetRow index={0} type="warmup" status="done" weight="40" reps="10" />,
        drop: <SetRow index={4} type="drop" status="done" weight="45" reps="12" />,
      };
      return m[p.kind];
    },
  },
  {
    name: 'RestBar', group: '训练与记录', desc: '组间休息悬浮条。按结束时间戳计算；±15 秒、跳过；≤ 10 秒「即将结束」进度条变虚线；结束换对勾 + 骨白底（形状变化，不只靠颜色）。',
    axes: { state: ['running', 'ending', 'done'] }, size: 'card',
    render: (p) => <RestBar total={180} remaining={p.state === 'running' ? 95 : p.state === 'ending' ? 7 : 0} />,
  },
  {
    name: 'SessionRow', group: '训练与记录', desc: '训练记录票根行（P07，Stitch l6 C）：左边大号日期 + 周几，虚线撕口，中间主要部位和动作 / 组数 / 时长，右边骨白 PR 标；不在今年的带年份；没有 onClick（static）是静态行，不画箭头也没有按下反馈。',
    axes: { kind: ['normal', 'pr', 'deload', 'static'], state: ['default', 'pressed', 'focused'] }, rows: ['kind'], cols: 'state', size: 'card',
    skip: (p) => p.kind === 'static' && p.state !== 'default',
    render: (p, f) => { const x = f.sessions[0] ?? { date: '10/3', weekday: '六', title: '胸 · 肩', meta: '6 个动作 · 14 组', prs: 0 };
      return <SessionRow {...x} prs={p.kind === 'pr' ? Math.max(1, x.prs) : 0} deload={p.kind === 'deload'} state={st(p.state)} onClick={p.kind === 'static' ? undefined : noop} />; },
  },
  {
    name: 'DayCell', group: '训练与记录', desc: '周历的一天：已练 = 量尺底色 + 圆点；有 PR 换星形；今天 = 骨白描边环；选中 = 骨白实心；未来不可点。',
    axes: { status: ['trained', 'trained-pr', 'rest', 'today', 'future'], state: ['default', 'selected', 'pressed', 'focused'] }, rows: ['status'], cols: 'state', size: 'auto',
    skip: (p) => p.status === 'future' && p.state !== 'default',
    render: (p) => <DayCell weekday="三" day={30} status={(p.status === 'trained-pr' ? 'trained' : p.status) as 'trained'} pr={p.status === 'trained-pr'}
      selected={p.state === 'selected'} state={st(p.state)} />,
  },
  {
    name: 'WeekStrip', group: '训练与记录', desc: '记录页顶部的本周 7 天（完整出勤热力图属于 P1）。', axes: {}, size: 'card',
    render: (_, f) => <WeekStrip days={f.week} />,
  },
  {
    name: 'MediaFrame', group: '训练与记录', desc: '动作示范（MuscleWiki 真实素材，经动作 media 字段引用）。没有素材写「暂无示范」，不拿相近动作顶替；加载失败不显示破图。保留署名链接。',
    axes: { state: ['loading', 'ready', 'missing', 'error'] }, size: 'card',
    render: (p, f) => <MediaFrame src={p.state === 'missing' ? null : f.media.src} label={`${f.media.name} 示范`} force={p.state as 'ready'} />,
  },
  /* ---------------- 6e 首页补全：找动作 / 替换 / 热身 / 要领 ---------------- */
  {
    name: 'WarmupStrip', group: '训练与记录',
    desc: '热身组（6e，线框 warm W2 + Stitch warm-v1 / v2）：主角卡顶部一条，每组一颗胶囊（重量大、次数小），点一颗算做完 / 取消，做完的骨白打勾。只排给当天第一个练到这些主练肌头的复合动作、正式重量 ≥ 40 kg；40% × 8 → 60% × 5 → 80% × 3（2.5 kg 取整）。不计入容量、新纪录、导航外圈，不触发休息；底部大按钮只管正式组。',
    axes: { done: ['w-none', 'w-one', 'w-all'], item: ['default', 'pressed', 'focused'] }, rows: ['item'], cols: 'done', size: 'card',
    skip: (p) => p.item !== 'default' && p.done !== 'w-one',
    render: (p) => { const n = p.done === 'w-none' ? 0 : p.done === 'w-one' ? 1 : 3; return <WarmupStrip sets={[['35', '8'], ['50', '5'], ['67.5', '3']].map(([w, r], i) => ({ weight: w, reps: r, done: i < n }))} onToggle={noop} state={st(p.item)} />; },
  },
  {
    name: 'PickRow', group: '训练与记录',
    desc: '找动作的结果行：动作名（加粗）/ 器械 · 上次重量（窄体加粗）。我没有的器械变灰、写「没有这个器械」，排在最后不隐藏；只练到协同的写「协同」。整行是按钮（≥ 56），点开动作要领。',
    axes: { kind: ['last', 'first', 'secondary', 'not-owned'], item: ['default', 'pressed', 'focused'] }, rows: ['item'], cols: 'kind', size: 'card',
    skip: (p) => p.item !== 'default' && p.kind !== 'last',
    render: (p) => <PickRow name={p.kind === 'not-owned' ? '绳索夹胸' : p.kind === 'secondary' ? '上斜哑铃卧推' : '杠铃卧推'} equipment={p.kind === 'not-owned' ? '绳索' : p.kind === 'secondary' ? '哑铃' : '杠铃'}
      last={p.kind === 'last' ? 80 : p.kind === 'secondary' ? 26 : null} owned={p.kind !== 'not-owned'} secondary={p.kind === 'secondary'} onClick={noop} state={st(p.item)} />,
  },
  {
    name: 'SwapRow', group: '训练与记录',
    desc: '换一个（6e，线框 swap W1 + Stitch swap-v1，借 v2 的「推荐」）：单选行，名字 / 器械 · 肌头，右边上次重量或「首次」。候选：主练肌头有交集、器械我有；同器械 → 练过 → 同类型在前，第一个「推荐」并默认选中。',
    axes: { kind: ['recommended', 'sw-plain', 'sw-first'], item: ['default', 'pressed', 'focused'] }, rows: ['item'], cols: 'kind', size: 'card',
    skip: (p) => p.item !== 'default' && p.kind !== 'sw-plain',
    render: (p) => <SwapRow name={p.kind === 'sw-first' ? '杠铃前蹲' : p.kind === 'recommended' ? '器械站姿深蹲' : '腿举'} detail={p.kind === 'sw-first' ? '杠铃 · 股四头肌' : '固定器械 · 股四头肌 · 臀大肌'}
      last={p.kind === 'sw-first' ? null : p.kind === 'recommended' ? 70 : 120} selected={p.kind === 'recommended'} recommended={p.kind === 'recommended'} onClick={noop} state={st(p.item)} />,
  },
  {
    name: 'BodyPicker', group: '容量',
    desc: '点人体选肌肉（找动作，6e；用户：只是检索器，可读性优先，不用容量页视效）：平涂高对比——没选的中灰、选中的骨白、同一块肌肉里没选到的肌头浅灰、肌肉之间留底色缝。按「整块肌肉」点（真实路径算过：逐个肌头点正背各 9 块命中区 < 48，合并后全部 ≥ 48），点在缝里或边上 24 px 以内算最近那块；某一面只露一条的不当目标（大腿内收肌去正面点、斜方肌去背面点）。按下先亮一档（M08），松手才选；读屏是一组看不见的按钮。',
    axes: { view: ['front', 'back'], sel: ['sel-none', 'sel-family', 'sel-sub'] }, rows: ['view'], cols: 'sel', size: 'card',
    render: (p) => {
      const fam = p.view === 'front' ? ['upper-pectoralis', 'mid-lower-pectoralis'] : ['lats'];
      const lit = p.sel === 'sel-none' ? [] : p.sel === 'sel-sub' ? [fam.at(-1)!] : fam, dim = p.sel === 'sel-sub' ? fam.slice(0, -1) : [];
      return <BodyPicker gender="male" view={p.view as 'front'} height={300} groupOf={groupOf} groupName={famName} skip={PICK_SKIP[p.view as 'front']} lit={lit} dim={dim} onPick={noop} />;
    },
  },
  {
    name: 'FinderBody', group: '训练与记录', covers: [],
    desc: '找动作检索面板的内容（6e，线框 ?board=finder，Stitch finder-v2）：「输入在下、结果在上」——右栏人体（拇指点，往下放）、正 / 背在人体下面；左栏 肌肉名 + 动作数（全屏唯一的荧光）+ 细分肌头 + 器械菜单（临时面板，点别处就收）+ 结果列表。入口：首页「＋ 加一个动作」（先选本周还差最多的）、容量页肌头面板「找动作」（带上那一块、细分落在点的肌头）、点一行进动作要领。可以直接点。',
    axes: { from: ['from-home', 'from-body'] }, size: 'screen',
    render: (p) => <FinderDemo start="chest" sub={p.from === 'from-body' ? 'mid-lower-pectoralis' : null} />,
  },
  {
    name: 'GuideDrawer', group: '训练与记录',
    desc: '动作要领的底部抽屉（P04，线框 p04 W3 + Stitch p04-v2 版式 + v3 的大号步骤编号）：常态露出一句话要点（前面一道荧光短竖 = 全屏唯一的荧光）和 3 步，全在拇指区；把手上下拖或点提示行展开出练到的肌头和我的进步，高度按弹簧过渡（M05）。从找动作进来时底部多一个「加到今天」。可以直接拖 / 点。',
    axes: { open: ['peek', 'open'] }, size: 'screen',
    render: (p) => <GuideDemo open={p.open === 'open'} />,
  },
  /* ---------------- 数据图形 ---------------- */
  {
    name: 'RestDock', group: '训练与记录', desc: 'M02 流体胶囊形变：组间休息平时是一颗小胶囊（底边一道骨白细线 = 剩余比例），点开原地长成休息面板（±15、跳过），尺寸与圆角按软弹簧一起过渡。ring（首页训练中，2026-10-06）：胶囊与导航一项同宽、页面配色（凹底 + 细线，图标在上时间在下，内描边骨白、按剩余比例收短），首页导航不再重复显示休息；切 Tab 时胶囊往下滑着淡出，只有进度条借共享元素飞进被点的导航滑块并换成深色（navHandoff 让目标页滑块先停好），胶囊 ↔ 面板也是共享元素。',
    axes: { state: ['pill', 'open', 'done', 'ring', 'ring-done'] }, size: 'card', covers: ['navHandoff'],
    render: (p) => <RestDock remaining={p.state === 'done' || p.state === 'ring-done' ? 0 : 95} total={180} open={p.state === 'open'} onToggle={noop}
      ring={p.state.startsWith('ring') ? { width: 64, endAt: Date.now() + 95e3 } : undefined} />,
  },
  {
    name: 'SharedDetail', group: '训练与记录', desc: 'M03 共享元素展开（View Transitions）：列表行（ExerciseRow sharedId）的卡片底、名称、重量与详情同名，点开时原地变形成整屏详情——卡片长满屏、名称与数字飞到新位置并放大，正文随后淡入；返回时变回去。真实动画见下方交互演示。转场进行中 Chrome 会把点按落在 <html> 上（点不到页面元素）：`guardTransitionTaps`（App 启动时装一次）在按下时打断转场，并把那一下点击改投给坐标处的真元素，所以转场期间点按不丢。M09 钻入转场（`drillTransition` / `drillName`，增量页的一行 ↔ 动作曲线页）：名称、最新值、小曲线分别飞成详情页的标题、大数字、整张曲线，整页只做很快的淡出 / 淡入；真实动画在 /gains → 点任意一行。',
    axes: { state: ['open'] }, size: 'screen', covers: ['sharedName', 'sharedTransition', 'guardTransitionTaps', 'drillName', 'drillTransition'],
    render: () => <div className={s.sheetBox}><SharedDetail id="demo" title="杠铃深蹲" sub="下肢 · 3 × 6–8" hero={<Num size="hero" value="85" unit="kg" />} onBack={noop}>
      <span className="milo-text-caption">上次 8/8/8 全部顶到 8 次上限 → +5 kg</span></SharedDetail></div>,
  },
  {
    name: 'StepRing', group: '训练与记录', desc: 'E2 环中数字（ref1）：序号在进度环里，环 = 这个动作已完成的组数比例；完成后整行降到 opacity/done-row。',
    axes: { state: ['todo', 'current', 'done'] }, size: 'card',
    render: (p, f) => <StepRing n={2} ratio={p.state === 'todo' ? 0 : p.state === 'current' ? 1 / 3 : 1} done={p.state === 'done'} title={f.items[1]?.name ?? '窄握下拉'}
      sub={p.state === 'todo' ? '待做' : p.state === 'current' ? '第 2 / 3 组' : '3 / 3 组'} />,
  },
  {
    name: 'DotCalendar', group: '训练与记录', desc: 'E1 点阵日历（ref1）：近 3 个月每天一个点，练过的点亮骨白，今天一圈荧光描边；记录页顶部，也是 P1 出勤热力图。',
    axes: {}, size: 'card',
    render: (_, f) => <DotCalendar months={dotMonths(f.trainedDays, f.now)} />,
  },
  {
    name: 'SteelPlate', group: '训练与记录', desc: '记录页顶部的钢板打孔日历（2026-10-06 第 7 轮重做）：中性冷灰的冲压钢板，练过的日子是冲出来的孔、没练的只有样冲点、今天刻一圈细环。光源固定在屏幕左上角（不跟板走）：板后灯箱离光越近越亮，每个孔向光源反方向射出一束体积光（丁达尔），光束里有浮尘慢慢飘；页面滚动时板相对光源移动，孔的亮暗和光束角度真实变化。交互（M04）：按住横向拖吸到最近的练过的日子，孔口一圈光晕呼吸、轻振，上方读数行按位滚到那天；「查看」/ 再点同一个孔 / 回车钻进那天的训练。没练过任何一天时板后不点灯。一页只放一块。',
    axes: { kind: ['trained', 'selected', 'today-done', 'empty'] }, size: 'card',
    render: (p, f) => {
      const days = new Set(f.trainedDays);
      if (p.kind === 'today-done') days.add(new Date(f.now).setHours(0, 0, 0, 0));
      const months = dotMonths(p.kind === 'empty' ? new Set() : days, f.now), last = Math.max(...f.trainedDays);
      return p.kind === 'selected'
        ? <SteelPlate dense months={months} selected={last} onSelect={noop} onOpen={noop} day={{ t: last, title: '10月2日 周五', sub: '下肢 · 13 组', value: '6,209', unit: 'kg' }} />
        : <SteelPlate dense months={months} />;
    },
  },
  {
    name: 'WeekBars', group: '数据图形', desc: 'E3 竖向胶囊量表（ref3）：近 8 周每周完成组数，本周骨白；和容量页胶囊同一语言（胶囊即量尺）。short（compact）= 增量页摘要卡里的 4 周破纪录柱，柱高一档 hit-min。',
    axes: {}, size: 'card',
    render: (_, f) => <WeekBars weeks={f.weekBars} />,
  },
  {
    name: 'GiantNumber', group: '数据图形', desc: 'E4 超大渐变数字（ref5「60%」）：结算页唯一一次「大声」，数字从骨白渐隐 + 颗粒。',
    axes: {}, size: 'card',
    render: () => <GiantNumber value="+5" unit="kg" caption="杠铃深蹲 · 预估 1RM 新高" />,
  },
  {
    name: 'Odometer', group: '数据图形', desc: 'M04 滚动码表：每一位数字按弹簧滚到目标位；用于曲线读数、结算总负荷。',
    axes: { size: ['xl', 'l', 'm'] }, size: 'auto',
    render: (p) => <Odometer value="79.1" size={p.size as 'xl'} />,
  },
  {
    name: 'FluidBackdrop', group: '导航', desc: '底层流体噪点渐变（A4 追加）：几团主题色光斑缓慢漂移 + 颗粒，只铺在 Tab 根页的最底层；页面隐藏时停，减少动态效果时静止。可接音频电平随音乐涨落。',
    axes: {}, size: 'screen',
    render: () => <div className={s.sheetBox}><FluidBackdrop /></div>,
  },
  {
    name: 'Sparkline', group: '数据图形', desc: '增量页列表行的趋势小线：时间正序；末点实心；PR 用菱形。只有 1 次记录画虚线基线。',
    axes: { trend: ['up', 'down', 'single_pt'] }, size: 'auto',
    render: (p, f) => <Sparkline label="预估 1RM" points={p.trend === 'up' ? f.trends.normal : p.trend === 'down' ? f.trends.falling : f.trends.one} />,
  },
  {
    name: 'TrendChart', group: '数据图形', desc: '动作进步曲线（P10）：预估 1RM 对日期，时间按正序画；PR 点菱形；点一下或方向键选中一次。少于 2 次不画线。曲线页自己有大数字时关掉图上的读数（without），同一个数屏上只出现一次。',
    axes: { points: ['many', 'many-selected', 'one', 'empty_pts'], head: ['with', 'without'] }, rows: ['points'], cols: 'head', size: 'card',
    render: (p, f) => <TrendChart readout={p.head === 'with'} points={p.points === 'one' ? f.trends.one : p.points === 'empty_pts' ? [] : f.trends.normal}
      selected={p.points === 'many-selected' ? f.trends.normal.length - 1 : null} onSelect={noop} />,
  },
  {
    name: 'IncrementRuler', group: '数据图形', desc: '增量尺：上次 → 这次建议重量，之间那段骨白；刻度 = 加重步进。',
    axes: { dir: ['add', 'hold', 'cut'] }, size: 'card',
    render: (p, f) => <IncrementRuler last={80} next={p.dir === 'add' ? 82.5 : p.dir === 'hold' ? 80 : 75} step={f.step} />,
  },
  {
    name: 'LandmarkRuler', group: '数据图形', desc: '近 7 天组数对照最低有效量 / 适宜量 / 最大可恢复量三条地标。',
    axes: { zone: ['none', 'low', 'ok', 'over'] }, size: 'card',
    render: (p) => <LandmarkRuler value={({ none: 0, low: 4.5, ok: 13, over: 24 } as Record<string, number>)[p.zone]} mev={8} mav={16} mrv={22} />,
  },
  {
    name: 'PhaseSegments', group: '数据图形', desc: '恢复时相四段，当前段荧光（时相条属于「进度」，允许荧光）。',
    axes: { phase: ['repair', 'recovering', 'golden', 'decayed'] }, size: 'card',
    render: (p) => <PhaseSegments phase={p.phase} />,
  },
  { name: 'Ticks', group: '数据图形', desc: '刻度分隔线：做分隔和量尺用，不做装饰；向右渐隐。', axes: {}, size: 'card', render: () => <Ticks /> },
  { name: 'TierLegend', group: '数据图形', desc: '容量四档图例：明暗 + 纹理，不只靠色相；和人体图、胶囊同源。', axes: {}, size: 'card', render: () => <TierLegend /> },
  /* ---------------- 身体 ---------------- */
  {
    name: 'Capsule', group: '容量', desc: '常态缩小 1/3（2026-10-06 用户：少挡人体；高 20、宽从内容区 62% 起）。胶囊 = 量尺：底色按「组数 ÷ 最大可恢复量」从左填；0 组斜纹压暗；超量加斜纹。放大镜：邻近按余弦变大；焦点荧光实心，名称挪到最右（手指底下），组数 / 恢复度 · 时相 / 还需几小时三行写在左边（手指挡不到）。',
    axes: { tier: ['none', 'low', 'ok', 'over'], size: ['rest', 'near', 'focus'] }, rows: ['tier'], cols: 'size', size: 'm',
    render: (p, f) => cap(f, p.tier, p.size),
  },
  {
    name: 'CapsuleRail', group: '容量', desc: '胶囊列 + 引线 + 放大镜手势：手势层只盖胶囊列静止宽度（人体在左边另接轻点）；竖向短滑滚动页面，按住 150 ms 不动才进放大镜、进入后锁住滚动；先动 8 px 算滚动；松手只退出，轻点才打开详情：被点的那颗胶囊原地长成肌头详情面板（M03，名称飞成面板标题；关闭缩回胶囊）。换人体卡时引线先收、到位后从人体往胶囊（左 → 右）重新描出。真机手势见下方交互演示。',
    axes: { mag: ['rest', 'focus'] }, size: 'card',
    render: (p, f) => {
      const ids = ['upper-pectoralis', 'mid-lower-pectoralis', 'anterior-deltoid', 'lateral-deltoid', 'long-head-bicep', 'upper-abdominals'].filter((id) => f.body.stats.has(id));
      const w = T['size/screen-w'] - T['size/gutter'] * 2, h = ids.length * (T['size/capsule-rest-max-h'] + T['size/capsule-gap']) + T['size/capsule-focus-h'];
      return <div className={s.railBox} style={{ height: h }}><CapsuleRail ids={ids} stats={f.body.stats} anchors={{}} width={w} height={h} left={w * T['ratio/rail-start']} right={w}
        mag={p.mag === 'focus' ? 1 : null} onMag={noop} onSelect={noop} /></div>;
    },
  },
  {
    name: 'BodyFigure', group: '容量', desc: 'MuscleWiki 真实路径的人体。半身：从左裁掉 ratio/figure-crop、左缘渐隐（容量页与故事动画同一个版式）。三层视效（2026-10-07 方案台选定，DEFAULT_LOOK）：O2 柔光描边（轮廓一圈模糊淡光）+ F1 金属渐变（灰阶 → 湍流扭曲 + 模糊 → 暗 / 橄榄 / 荧光 / 骨白热色带，下缘白热亮边 + 外发光 + 颗粒，越热越亮）+ S9 熔流（亮带往上流过湍流扭曲场，越热越快；滚出屏幕暂停）。减少动态效果时全静止。其余方案与旧默认见 /preview 方案台。',
    axes: { view: ['front', 'back'], sex: ['male', 'female'] }, rows: ['sex'], cols: 'view', size: 'm',
    render: (p, f) => <FigureCell view={p.view as 'front'} sex={p.sex as 'male'} f={f} />,
  },
  /* ---------------- 导航 ---------------- */
  {
    name: 'Nav', group: '导航', desc: '5 项「图标 + 名称」，选中项是按弹簧滑动的骨白小胶囊，切换时图标笔画由暗到亮画出来（iconmotionref1）。外圈 = 今日进度：不画（恢复日、未开始）→ 开始训练、0 组：一整圈暗色轨道（= 整场训练）→ 每完成一组荧光实线往前走（无端点）→ 最后一组走满。休息：选中项写剩余时间，小胶囊里一道实线内描边跟着小胶囊滑、平滑收短。',
    axes: { item: ['default', 'pressed', 'focused'], selected: ['home', 'body', 'gains', 'log', 'me'], ring: ['off', 'track', 'partial', 'full', 'rest'] },
    rows: ['item', 'selected'], cols: 'ring', size: 'screen',
    skip: (p) => p.item !== 'default' && !(p.selected === 'home' && p.ring === 'partial'),
    render: (p) => <div className={s.navBox}><Nav selected={p.selected as Tab} itemState={st(p.item)}
      progress={p.ring === 'off' ? null : p.ring === 'track' ? 0 : p.ring === 'full' ? 1 : 8 / 14} started={p.ring !== 'off'} rest={p.ring === 'rest' ? '1:35' : undefined} restRatio={p.ring === 'rest' ? 95 / 180 : undefined} /></div>,
  },
  /* ---------------- 品牌（阶段 5.5b，2026-10-05） ---------------- */
  {
    name: 'Mascot', group: '品牌', desc: 'IP 小牛（PNG）：用户按意向图 3_27AM 用 Nano Banana 高清重制，scripts/mascot_png.py 切图、Real-ESRGAN 4 倍超分、抠图（边缘反解透明度不留黑边，只留牛本身；Milo 用无泛光的品红底源图，泛光由代码生成）。5 种牛龄（牛犊 · 小牛 · 壮牛 · 公牛 · Milo）× 6 种状态；前四种单眼，Milo 双眼发光。特效由代码生成：专注 = 速度线、恢复日 = 飘 z、破纪录 = 碎屑、Milo = 全身泛光 + 四角星 + 扫光；其余牛龄的荧光角带一圈会呼吸的微光。同一牛龄同比例、同地面线，换状态不跳；动效以地面线为支点整只呼吸 / 前压 / 小跳 / 欢呼 / 叹气，粒子特效挂在不动的一层、不跟着牛跳，减少动态效果时静止。只出现在品牌位置（引导、奖励、牛龄、空态、商城、会员）。',
    axes: { stage: ['newborn', 'young', 'sturdy', 'bull', 'milo'], mood: ['m-idle', 'm-focused', 'm-happy', 'm-rest', 'm-pr', 'm-deload'] }, rows: ['stage'], cols: 'mood', size: 'card',
    render: (p) => <div className={s.mascotCell}><Mascot stage={p.stage as MascotStage} mood={p.mood.slice(2) as MascotMood} animate title="慢牛小牛" /></div>,
  },
  {
    name: 'RewardCard', group: '增长', covers: ['RewardModal'],
    desc: '奖励弹窗（品牌时刻）：升段 = 满档（旧形态蓄力抖动发亮 → 闪屏 + 冲击波 + 光芒 + 碎屑 + 震屏 + 长振动 → 新形态从白光里弹出，就是「小牛长大」，五段路径长到新段）；破纪录 / 连胜里程碑 = 高（印章砸下、Logo 条点亮、重量码表滚到新纪录 / 周胶囊依次点亮）；升小级 / 周期完成 = 中。牛劲用码表滚出来，会员显示 ×1.5。一次只弹一个，其余进「消息」；点一下跳过到定格；减少动态效果时只淡入定格。这里是定格画面，交互演示里看完整编排。数据取自等级曲线模拟里的进阶用户。',
    axes: { kind: ['r-stage', 'r-milo', 'r-pr', 'r-streak', 'r-level', 'r-cycle'], member: ['free', 'pro'] }, rows: ['kind'], cols: 'member', size: 'screen',
    render: (p) => {
      const r = sampleRewards()[p.kind.slice(2) as keyof ReturnType<typeof sampleRewards>];
      const pro = p.member === 'pro';
      return <RewardCard reward={pro ? { ...r, niujin: Math.round(r.niujin * GROWTH_CONFIG.niujin.proRate) } : r} pro={pro} queued={p.kind === 'r-stage' ? 2 : 0} still />;
    },
  },
  {
    name: 'AgeBadge', group: '增长',
    desc: '牛龄徽章：紧凑 = 「我的」根页顶部一行（头像 + 段名小级 + 连胜周数）；完整 = 牛龄页头（荧光圈头像 + 段名 + 三颗小级）。Milo 的圈更亮。',
    axes: { stage: ['newborn', 'young', 'sturdy', 'bull', 'milo'], size: ['b-compact', 'b-full'] }, rows: ['stage'], cols: 'size', size: 'card',
    render: (p) => <AgeBadge stage={p.stage as MascotStage} sub={p.stage === 'milo' ? 3 : 2} size={p.size === 'b-compact' ? 'compact' : 'full'} streak={p.size === 'b-compact' ? growthSample().streak.weeks : undefined} />,
  },
  {
    name: 'GrowthBar', group: '增长',
    desc: '成长条：离下一级还差多少，用能照着做的说法（主项预估 1RM 再涨几 kg，或再完成几个周期），由引擎反推；快升级时发光扫光；下一级是升段时标出；Milo 3 级满级。主项涨幅太大就不写 kg、只写「再完成 N 个训练周期」；牛龄页（页头已写段名小级）用 bare：只写「离下一级」。',
    axes: { state: ['g-normal', 'g-near', 'g-stage', 'g-max', 'g-cycles', 'g-bare'] }, size: 'card',
    render: (p) => {
      const g = growthSample(), n = g.next!;
      const v = { 'g-normal': [g.stage, 2, n.progress], 'g-near': [g.stage, 2, 0.92], 'g-stage': [g.stage, 3, 0.4], 'g-max': ['milo', 3, 1], 'g-cycles': ['bull', 2, 0.1], 'g-bare': [g.stage, 2, n.progress] }[p.state] as [MascotStage, 1 | 2 | 3, number];
      return <GrowthBar stage={v[0]} sub={v[1]} progress={v[2]} lift={p.state === 'g-cycles' ? null : n.lift} cycles={p.state === 'g-cycles' ? 4 : n.cycles} bare={p.state === 'g-bare'} />;
    },
  },
  {
    name: 'StreakBar', group: '增长',
    desc: '守约周连胜：周数 + 本周进度（已练 / 目标次数，目标由时长和经验推出）+ 状态说明。只按周算，不做每日打卡；减量周少练一次也算；快断了（剩下的天数不够练完）标红；断档时自动用冻结卡；第 4 / 12 / 26 / 52 周是里程碑。',
    axes: { status: ['s-zero', 's-open', 's-kept', 's-risk', 's-frozen', 's-deload', 's-milestone'] }, size: 'card',
    render: (p) => {
      const v = { 's-zero': [0, 0, 4], 's-open': [7, 2, 4], 's-kept': [8, 4, 4], 's-risk': [7, 1, 4], 's-frozen': [7, 1, 4], 's-deload': [9, 3, 3], 's-milestone': [12, 4, 4] }[p.status] as [number, number, number];
      return <StreakBar weeks={v[0]} done={v[1]} target={v[2]} status={p.status.slice(2) as StreakStatus} freeze={p.status === 's-zero' ? 0 : 1} />;
    },
  },
  {
    name: 'GrowthCard', group: '增长',
    desc: '「我的」第一屏的成长卡（主角）：小牛头像 + 牛龄 + 离下一级的进度条与一句能照着做的话，下面三个数（连胜 / 本周 / 牛劲）；整张卡是按钮，点进牛龄页。右上角淡淡的配重片同心槽纹，进度条是这一屏唯一的荧光。',
    axes: { stage: ['newborn', 'young', 'sturdy', 'bull', 'milo'], state: ['default', 'pressed', 'focused'] }, rows: ['stage'], cols: 'state', size: 'card',
    render: (p) => <GrowthCard stage={p.stage as MascotStage} sub={p.stage === 'milo' ? 3 : 2} progress={p.stage === 'milo' ? 1 : 0.62} streak={growthSample().streak.weeks} done={2} target={4} niujin={fmt(growthSample().niujin.balance)}
      hint={p.stage === 'milo' ? 'Milo 满级。接下来比的只有昨天的自己。' : <>再涨 <b>3 kg</b> 杠铃卧推的预估 1RM，升 1 小级</>} onClick={noop} state={st(p.state)} />,
  },
  {
    name: 'StageHero', group: '增长',
    desc: '牛龄页头：顶上一行 5 段名字（当前这一段加下划线，一眼看到「现在在哪、还有几段」），小牛站在一圈圈配重片同心环里，下面是大号「段名 · 小级」。',
    axes: { stage: ['newborn', 'young', 'sturdy', 'bull', 'milo'] }, size: 'card',
    render: (p) => <StageHero stage={p.stage as MascotStage} sub={p.stage === 'milo' ? 3 : 2} />,
  },
  {
    name: 'StreakWeeks', group: '增长',
    desc: '最近 12 周守约点阵（牛龄页）：实心骨白 = 守约，暗 = 减量周（按计划减量也算守约），斜纹 = 冻结卡抵掉，虚线 = 没守约，粗框 = 本周；下面一行图例。每种状态形状 / 纹理都不同，不只靠颜色。',
    axes: { pattern: ['w-steady', 'w-mixed', 'w-cold'] }, size: 'card',
    render: (p) => {
      const K: StreakWeekStatus = 'kept', D: StreakWeekStatus = 'deload', F: StreakWeekStatus = 'frozen', M: StreakWeekStatus = 'missed', O: StreakWeekStatus = 'open';
      const w = { 'w-steady': [K, K, K, D, K, K, K, K, D, K, K, O], 'w-mixed': [K, K, D, K, K, K, M, F, K, K, K, O], 'w-cold': [M, M, M, M, M, M, M, M, K, K, K, O] }[p.pattern] as StreakWeekStatus[];
      return <StreakWeeks weeks={w} />;
    },
  },
  {
    name: 'FreezeCard', group: '增长',
    desc: '连胜冻结卡：有卡（断档那周的周一自动用一张）/ 没卡（牛劲兑换或开 Pro 每月送 2 张）/ 刚自动用了一张（连胜保住，变荧光）。',
    axes: { state: ['f-have', 'f-none', 'f-used'] }, size: 'card',
    render: (p) => <FreezeCard count={p.state === 'f-none' ? 0 : 1} state={p.state.slice(2) as 'have' | 'none' | 'used'} cost={COUPONS.freeze.cost} />,
  },
  {
    name: 'NiujinBalance', group: '增长', covers: ['LedgerRow'],
    desc: '牛劲余额（码表数字 + ≈¥ + 刻度尺分隔 + 本月进账，钱包 Stitch V1 + V2 刻度尺）与流水：获得是荧光 +，花出是骨白 −，会员期间标「×1.5」。数字是演示用户练到第 30 周的引擎实算（第 20 周兑换过一张冻结卡）。',
    axes: { member: ['free', 'pro'] }, size: 'card',
    render: (p) => {
      const g = growthSample(), rows = g.niujin.ledger.slice(-5).reverse(), pro = p.member === 'pro';
      const month = g.niujin.ledger.filter((r) => r.amount > 0 && r.atMs > g.niujin.ledger.at(-1)!.atMs - 30 * 86400e3).reduce((a, r) => a + r.amount, 0);
      const bal = pro ? g.niujin.ledger.reduce((a, r) => a + (r.amount > 0 ? Math.round(r.amount * 1.5) : r.amount), 0) : g.niujin.balance;
      return <div className={s.growCol}><NiujinBalance balance={bal} month={pro ? Math.round(month * 1.5) : month} pro={pro} />
        {[...rows, g.niujin.ledger.find((r) => r.amount < 0)!].map((r, i) => <LedgerRow key={i} label={r.label} amount={pro && r.amount > 0 ? Math.round(r.amount * 1.5) : r.amount} date={dateOf(r.atMs)} pro={pro && r.amount > 0} />)}</div>;
    },
  },
  {
    name: 'Coupon', group: '增长',
    desc: '卡券（票根：左侧深色存根放道具图标 PropGlyph + 面额，两侧缺口 + 虚线）：商家券 / 免邮券 / 会员体验 / 冻结卡 × 可兑换 / 牛劲不够（按钮不可用、写明还差多少）/ 可用 / 可用且能「去用」（钱包 → 商城，命中区 48）/ 已用 / 已过期。',
    axes: { type: ['c-merchant', 'c-shipping', 'c-trial', 'c-freeze'], state: ['c-redeem', 'c-short', 'c-available', 'c-use', 'c-used', 'c-expired'] }, rows: ['type'], cols: 'state', size: 'card',
    render: (p) => {
      const c = COUPONS[p.type.slice(2) as keyof typeof COUPONS], st = p.state.slice(2);
      return <Coupon type={c.type} title={c.title} detail={c.detail} state={st === 'short' ? 'redeem' : st === 'use' ? 'available' : st as 'redeem' | 'available' | 'used' | 'expired'} cost={c.cost} balance={st === 'short' ? Math.round(c.cost * 0.6) : c.cost * 3} onUse={st === 'use' ? () => {} : undefined} />;
    },
  },
  {
    name: 'KnowledgeTip', group: '增长',
    desc: '情境知识卡（商城的主要入口）：由引擎数据触发，先讲为什么现在给你看、适合什么时候、怎么用，再给商品。页内提示是摘要下面一条细横幅（容量页「近 7 天」下、增量页页头下，线框 tips W1 + W3）：点主体进知识卡、✕ 这次收起（高度弹簧收回），一屏最多一条；「不再提示这一类」在知识卡页底；不用荧光。补剂写明「不构成医疗建议」。',
    axes: { card: ['belt', 'straps', 'protein', 'creatine', 'knee'], variant: ['k-tip', 'k-header'] }, rows: ['card'], cols: 'variant', size: 'card',
    render: (p) => { const k = KNOWLEDGE[p.card as KnowledgeId]; return <KnowledgeTip {...k} variant={p.variant === 'k-tip' ? 'tip' : 'header'} />; },
  },
  {
    name: 'ProductCard', group: '商城', covers: ['StatusTag', 'ProductGrid', 'ProductImage'],
    desc: '商品卡（6f，商城 Stitch V2 排法 + V1 缺货整卡变暗）：grid = 商城两列（图左上状态标 → 商家 → 名字 → 价格 + 划线价 → 会员价 · 牛劲抵）；row = 知识卡里的相关商品行。状态：热销 / 折扣 / 新品（实心标）、缺货（虚线标、整卡变暗，仍可点进详情设到货提醒）、已下架（灰字，不在商城列表）。商家与品牌全部虚构，价格为示例；没有商品图时显示品类占位。',
    axes: { product: PRODUCTS.map((x) => x.id), variant: ['v-grid', 'v-row'] }, rows: ['product'], cols: 'variant', size: 'card',
    render: (p) => { const x = PRODUCTS.find((y) => y.id === p.product)!; const off = Math.min(Math.floor(x.member * 0.2), Math.floor(growthSample().niujin.balance / 100));
      return p.variant === 'v-grid' ? <ProductGrid><ProductCard {...x} off={off} /></ProductGrid> : <ProductCard {...x} off={off} variant="row" />; },
  },
  {
    name: 'RecommendCard', group: '商城',
    desc: '商城顶部「为你推荐」：知识卡的理由（按你的训练数据）+ 相关商品一行，背景是配重片同心槽纹；没有被数据触发时是通用入门卡（标签换「入门」，没有理由行）。整张点进知识卡。',
    axes: { state: ['r-hit', 'r-general'] }, size: 'card',
    render: (p) => p.state === 'r-hit'
      ? <RecommendCard title={KNOWLEDGE.belt.title} why="你的杠铃硬拉预估 1RM 已到体重的 1.62 倍" product={{ name: '杠铃腰带 10 毫米', price: 329 }} />
      : <RecommendCard title={KNOWLEDGE.straps.title} why={null} product={{ name: '8 字助力带', price: 69 }} />,
  },
  {
    name: 'PriceBlock', group: '商城', covers: ['NiujinLine'],
    desc: '商品详情的价格区（详情 Stitch V1）：现价大字 + 划线价 + 会员价标一行读完；会员价旁「Pro ›」进付费墙（未开通描边 / 已开通骨白实底进会员中心，命中区 48，6g）；下面牛劲能抵多少（余额 · 每单最多 20%），一元都抵不了时写还差多少牛劲。',
    axes: { state: ['pb-sale', 'pb-normal', 'pb-short', 'pb-pro'] }, size: 'card',
    render: (p) => <div className={s.growCol}>{p.state === 'pb-sale' ? <PriceBlock price={329} was={399} member={296} onPro={noop} /> : p.state === 'pb-pro' ? <PriceBlock price={329} was={399} member={296} onPro={noop} proActive /> : <PriceBlock price={69} member={62} />}
      <NiujinLine off={p.state === 'pb-short' ? 0 : p.state === 'pb-sale' ? 59 : 12} balance={p.state === 'pb-short' ? 40 : 6060} short={60} /></div>,
  },
  {
    name: 'EvidencePanel', group: '商城',
    desc: '知识卡的证据面板（知识卡 Stitch V1 证据图 + 大数，借 V2 的结论句）：走势线 + 门槛虚线，越过门槛写「已越过推荐门槛」（短竖条骨白），没越过写「还没到」（灰）。数字来自引擎（预估 1RM ÷ 档案体重），不写功效数字。',
    axes: { state: ['e-over', 'e-under'] }, size: 'card',
    render: (p) => <EvidencePanel label="杠铃硬拉预估 1RM ÷ 体重" value={p.state === 'e-over' ? '1.62' : '1.38'} unit="× 体重" threshold={1.5}
      series={p.state === 'e-over' ? [1.31, 1.36, 1.4, 1.44, 1.47, 1.52, 1.55, 1.62] : [1.21, 1.25, 1.28, 1.3, 1.34, 1.38]} detail={p.state === 'e-over' ? '150.5 kg ÷ 93 kg' : '128.3 kg ÷ 93 kg'} />,
  },
  {
    name: 'WalletExits', group: '商城',
    desc: '钱包底部两个出口（钱包线框 W2 / Stitch V1，拇指区）：「去商城抵扣」是这一屏唯一的荧光，「兑换卡券」描边；各带一行说明，高 64（命中区 ≥ 48）。',
    axes: { state: ['default', 'pressed'] }, size: 'card',
    render: (p) => <WalletExits redeemFrom={COUPONS.shipping.cost} state={p.state === 'pressed' ? 'pressed' : undefined} />,
  },
  {
    name: 'OrderLine', group: '商城', covers: ['Breakdown', 'DemoBanner'],
    desc: '下单确认 / 订单完成：演示模式横幅（不收集任何支付信息）→ 商品行（图、名字、规格 · 商家、会员价）→ 金额明细（减项写 −¥）+ 合计大字。',
    axes: { state: ['o-belt', 'o-straps'] }, size: 'card',
    render: (p) => p.state === 'o-belt'
      ? <div className={s.growCol}><DemoBanner /><OrderLine id="belt-10" name="杠铃腰带 10 毫米" size="M" merchant="铁砧运动" category="护具" member={296} />
          <Breakdown rows={[['商品', 329], ['会员价', 33, 'minus'], ['铁砧运动 满 200 减 30', 30, 'minus'], ['牛劲 5,900', 59, 'minus']]} total={207} /></div>
      : <div className={s.growCol}><DemoBanner /><OrderLine id="straps" name="8 字助力带" size={null} merchant="铁砧运动" category="护具" member={62} />
          <Breakdown rows={[['商品', 69], ['会员价', 7, 'minus'], ['运费', 10], ['免邮券', 10, 'minus']]} total={62} /></div>,
  },
  {
    name: 'PerkLedger', group: '会员',
    desc: '权益账单（6g，Stitch 付费墙 V2 的单卡 + 刻度尺分隔）：value = 付费墙「这 30 天，Pro 会多给你」四条——窄体大数 + 单位在上、按你的数据的一句理由在下（不折行）；link = 会员中心的权益入口（名称 / 说明 + ›，整行可点 ≥ 48）；pair = 开通成功「刚到手的」三条（左名右注一行）。入场：行按 M07 交错弹入，行间刻度尺从左往右画出来。',
    axes: { kind: ['k-value', 'k-link', 'k-pair'] }, size: 'card',
    render: (p) => p.kind === 'k-value'
      ? <PerkLedger label="Pro 会多给你" items={[{ value: '+525', unit: '牛劲', reason: '你这 30 天拿了 1,050，Pro ×1.5' }, { value: '2', unit: '张冻结卡 / 月', reason: '断档那周自动用，连胜 21 周不会断' }, { value: '¥33', unit: '会员价省', reason: '杠铃腰带 10 毫米 ¥329 → ¥296' }, { value: '周期自动编排', reason: '减量周到点自动插进处方' }]} />
      : p.kind === 'k-link'
        ? <PerkLedger kind="link" label="权益" items={[{ value: '周期计划自动编排', reason: '减量周到点自动插进处方', onClick: noop }, { value: '高级分析', reason: '肌群容量趋势 · 动作对比', onClick: noop }, { value: '钱包', reason: '冻结卡 · 免邮券', onClick: noop }, { value: '商城', reason: '会员价已生效', onClick: noop }]} />
        : <PerkLedger kind="pair" label="刚到手的" items={[{ value: '冻结卡', unit: '×2', reason: '已放进钱包' }, { value: '牛劲', unit: '×1.5', reason: '从下一次训练起' }, { value: '会员价', reason: '商城已生效' }]} />,
  },
  {
    name: 'PlanPicker', group: '会员',
    desc: '方案分段（6g，Stitch 付费墙 V1 的一行分段）：月度 / 年度（默认，骨白「省 40%」小标挂在上方）/ 试用 7 天；骨白滑块按软弹簧滑到选中项（M02 尺寸弹簧），每项 ≥ 48 高，方向键可切；用过试用就只剩两项。贴在主按钮正上方（拇指区）。',
    axes: { state: ['plan-year', 'plan-month', 'plan-trial', 'plan-two'] }, size: 'card',
    render: (p) => { const plans = [{ id: 'month', name: '月度', price: '¥18' }, { id: 'year', name: '年度', price: '¥128', tag: '省 40%' }, { id: 'trial', name: '试用', price: '7 天' }];
      return <div style={{ paddingTop: 'var(--milo-space-m)' }}><PlanPicker plans={p.state === 'plan-two' ? plans.slice(0, 2) : plans} value={p.state === 'plan-month' ? 'month' : p.state === 'plan-trial' ? 'trial' : 'year'} /></div>; },
  },
  {
    name: 'PerkTable', group: '会员',
    desc: '免费 vs Pro 完整对比（7 行）：付费墙「看完整对比」就地展开（高度弹簧）；没有训练历史的新用户直接看它（线框 pro W1）。Pro 一列加粗，不用荧光。',
    axes: {}, size: 'card',
    render: () => <PerkTable rows={PRO_PERKS} />,
  },
  {
    name: 'ProCard', group: '会员', covers: ['MonthStats'],
    desc: '会员卡 + 本月三格（6g，Stitch 会员中心 V2 骨架 + V1 卡上的刻度尺）：方案 + 状态标（已开通骨白实底 / 试用中描边 / 已到期灰）+ 到期与剩几天；下面一把有效期刻度尺——走过的骨白、没走的暗，荧光刻度 = 今天（会员中心这一屏唯一的荧光），挂载时从开通那头滑到今天。三格：数在上（码表）、名称在下。',
    axes: { state: ['pc-pro', 'pc-trial', 'pc-expired'] }, size: 'card',
    render: (p) => { const now = Date.UTC(2026, 9, 7, 10), from = p.state === 'pc-trial' ? now - 2 * 86_400_000 : p.state === 'pc-expired' ? now - 40 * 86_400_000 : now - 120 * 86_400_000;
      const to = p.state === 'pc-trial' ? from + 7 * 86_400_000 : p.state === 'pc-expired' ? from + 30 * 86_400_000 : from + 365 * 86_400_000;
      return <div className={s.growCol}><ProCard plan={p.state === 'pc-trial' ? '试用' : p.state === 'pc-expired' ? '月度' : '年度'} status={p.state === 'pc-pro' ? 'pro' : p.state === 'pc-trial' ? 'trial' : 'expired'} fromMs={from} toMs={to} now={now} />
        {p.state !== 'pc-expired' && <MonthStats items={[{ value: p.state === 'pc-trial' ? '+40' : '+525', label: '多拿的牛劲' }, { value: '2 / 0', label: '冻结卡 领 / 用' }, { value: p.state === 'pc-trial' ? '¥0' : '¥33', label: '会员价省' }]} />}</div>; },
  },
  {
    name: 'ProWelcome', group: '会员',
    desc: '开通成功的品牌时刻（6g，Stitch 开通成功 V2，占位换真小牛）：小牛站在配重片同心环里，三道骨白环纹从脚下荡开一次，小牛按软弹簧弹出；标题、到期日依次升起，「刚到手的」三条随后交错弹入、刻度尺画出。荧光只留给页面底部的「开始用」。减少动态效果时直接定格。',
    axes: {}, size: 'screen',
    render: () => <ProWelcome stage="bull" title="欢迎加入 Milo Pro" line="年度会员 · 2027 年 10 月 7 日到期">
      <PerkLedger kind="pair" label="刚到手的" items={[{ value: '冻结卡', unit: '×2', reason: '已放进钱包' }, { value: '牛劲', unit: '×1.5', reason: '从下一次训练起' }, { value: '会员价', reason: '商城已生效' }]} /></ProWelcome>,
  },
  {
    name: 'Paywall', group: '增长',
    desc: '会员付费墙（演示不拦截）：免费 vs Pro 对比 + 月度 / 年度（省 40%）/ 试用 7 天；已是会员显示到期与管理；开通成功是 Milo 庆祝。全程标「演示模式」，支付走假成功，不收集支付信息。',
    axes: { state: ['w-month', 'w-year', 'w-trial', 'w-member', 'w-success'] }, size: 'screen',
    render: (p) => <Paywall plan={p.state === 'w-year' ? 'year' : p.state === 'w-trial' ? 'trial' : 'month'} member={p.state === 'w-member'} success={p.state === 'w-success'} />,
  },
  {
    name: 'PropGlyph', group: '增长',
    desc: '道具图标（标志「递增条牛头」的变体）：冻结卡 = 牛头冻在冰块里（用掉时化开一角、荧光漫进来）；牛劲 = 荧光硬币压印牛头；Pro 体验 = 通行证；免邮 = 印着牛头的纸箱 + 荧光封箱带；商家券 = 吊牌 + 荧光折角。已用 / 过期整体降为禁用色。用在冻结卡、卡券票根、消息。',
    axes: { kind: ['pk-freeze', 'pk-niujin', 'pk-trial', 'pk-shipping', 'pk-merchant'], state: ['ps-normal', 'ps-used', 'ps-dim'] }, size: 'auto', covers: ['PROP_NAME'],
    render: (p) => <PropGlyph kind={p.kind.slice(3) as PropKind} used={p.state === 'ps-used'} dim={p.state === 'ps-dim'} className={s.propGlyph} />,
  },
  {
    name: 'ProBadge', group: '增长',
    desc: 'Pro 标记：高级分析、商品会员价旁的入口标记（描边）/ 已开通（实底 + 勾）。',
    axes: { state: ['locked', 'active'] }, size: 'auto',
    render: (p) => <ProBadge state={p.state as 'locked' | 'active'} />,
  },
  {
    name: 'MessageRow', group: '增长',
    desc: '「我的」→ 消息：同时达成多项时没弹出来的奖励、冻结卡已自动使用、删除训练后的降级说明（不弹窗，只写在这里）、到货提醒（6f，演示里设了就来一条「已到货」）。入账的牛劲单独一列右对齐（amount），日期在它下面；消息页按月分段。',
    axes: { kind: ['reward', 'freeze', 'demote', 'restock'], unread: ['true', 'false'] }, rows: ['kind'], cols: 'unread', size: 'card',
    render: (p) => {
      const v = { reward: ['同时达成 2 项', '升级：壮牛 2 级 · PR 杠铃卧推'], freeze: ['冻结卡已自动使用', '上周练了 1 / 4 次，连胜 7 周保住了'], demote: ['牛龄回到 壮牛 1 级', '你删除了 9 月 12 日的训练，成长值已重算'], restock: ['7 毫米护膝 已到货', '演示：你设的到货提醒。真实上线后，到货时才会发这条'] }[p.kind] as [string, string];
      return <MessageRow kind={p.kind as 'reward' | 'freeze' | 'demote' | 'restock'} title={v[0]} detail={v[1]} amount={p.kind === 'reward' ? 130 : undefined} date="今天" unread={p.unread === 'true'} />;
    },
  },
  {
    name: 'MascotHead', group: '品牌', desc: '只有头：16–48 像素的头像、通知、Toast、牛龄徽章。同一张 PNG 按逐张标定的头像框（头 + 角）裁成圆形；非 Milo 的角带一圈荧光微光，Milo 整只泛光。',
    axes: { stage: ['newborn', 'young', 'sturdy', 'bull', 'milo'], mood: ['m-idle', 'm-happy', 'm-pr', 'm-rest', 'm-deload'] }, rows: ['stage'], cols: 'mood', size: 'auto',
    render: (p) => <MascotHead stage={p.stage as MascotStage} mood={p.mood.slice(2) as MascotMood} className={s.mascotHead} />,
  },
  {
    name: 'LogoGlyph', group: '品牌', desc: 'Logo B 递增条牛头：9 根竖条从角往中间一根比一根长（渐进超负荷），两根角条荧光，倾斜 11°。≤ 24 像素用 7 根宽条。状态只改姿态、发光、点缀和条的长短：加载 = 一根根长出来，训练中 = 前压 + 速度线，破纪录 = 条从两角往中间点亮、中间条再接一节荧光，恢复日 = 变暗呼吸 + z，减量周 = 内侧条收回一半 + 原长度虚影。',
    axes: { logo: ['idle', 'loading', 'training', 'pr', 'rest', 'deload'], size: ['wide', 'compact'] }, rows: ['size'], cols: 'logo', size: 'auto',
    render: (p) => <LogoGlyph mark="bars" state={p.logo as LogoState} small={p.size === 'compact'} className={p.size === 'compact' ? s.logoS : s.logoL} />,
  },
  {
    name: 'AppIcon', group: '品牌', desc: 'App 图标：近黑圆角方形 + Logo；浅底版（商店图、浅色背景）主体变黑、角条用深一档的荧光。',
    axes: { theme: ['dark', 'light'], logo: ['idle', 'loading', 'pr', 'rest', 'deload'] }, rows: ['theme'], cols: 'logo', size: 'auto',
    render: (p) => <AppIcon mark="bars" light={p.theme === 'light'} state={p.logo as LogoState} className={s.appIcon} />,
  },
  {
    name: 'Lockup', group: '品牌', desc: '横排组合：Logo + 「慢牛 Milo」，字标同样倾斜 11°；单色版连角条也是骨白。',
    axes: { tone: ['color', 'mono'] }, size: 'auto',
    render: (p) => <Lockup mark="bars" mono={p.tone === 'mono'} />,
  },];

/** 回到顶端的静态格：一块不滚的页面底，按钮强制出现（真滚动见交互演示） */
function BackToTopCell({ lift }: { lift: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} className={s.backTopCell}><BackToTop target={ref} lift={lift} forceShown /></div>;
}

function FigureCell({ view, sex, f }: { view: 'front' | 'back'; sex: 'male' | 'female'; f: Fixtures }) {
  return <div className={s.figureBox}><FigureInner view={view} sex={sex} f={f} /></div>;
}
function FigureInner({ view, sex, f }: { view: 'front' | 'back'; sex: 'male' | 'female'; f: Fixtures }) {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} className={s.figureInner}><BodyFigure gender={sex} view={view} stats={f.body.stats} focus={null} height={T['size/hero-max-h'] * 2} onAnchors={noop} relativeTo={ref} /></div>;
}

/* ---------- 变体展开 ---------- */
export interface Variant { key: string; props: Props }
export function variants(e: Entry): Variant[] {
  const axes = Object.entries(e.axes);
  let combos: Props[] = [{}
];
  for (const [k, vals] of axes) combos = combos.flatMap((c) => vals.map((v) => ({ ...c, [k]: v })));
  return combos.filter((p) => !e.skip?.(p)).map((p) => ({ key: `${e.name}|${axes.map(([k]) => `${k}=${p[k]}`).join(',')}`, props: p }));
}
export const TOTAL = () => CATALOG.reduce((n, e) => n + variants(e).length, 0);
export const fmtNum = fmt;
