/** 组件目录：Playground 的唯一来源（DESIGN §9）。
 *  每一项 = 一个导出组件 × 它的变体轴；变体 = 各轴取值的笛卡尔积，去掉 skip 掉的不可能组合。
 *  catalog.test 核对：components/index.ts 的每个可见组件都在这里（或在 NOT_IN_MATRIX 里写明原因），每个变体都能渲染。
 *  按下 / 聚焦在代码里是 :active / :focus-visible，这里经 state 强制显示（state.ts）。 */
import { useRef, type ReactNode } from 'react';
import {
  Banner, BodyFigure, DotCalendar, SharedDetail, FluidBackdrop, GiantNumber, Odometer, RestDock, StepRing, WeekBars, dotMonths, Button, Capsule, CapsuleRail, Card, Chip, DayCell, Delta, DialogCard, ExerciseRow, Icon, ICONS, IconButton, IncrementRuler, LandmarkRuler,
  ListRow, List, MediaFrame, Nav, NumberField, Num, OptionCard, PageHeader, PhaseSegments, PrescriptionHero, ProgressSteps, RestBar, SectionLabel, Segmented,
  SessionRow, SetRow, Sheet, SheetBlock, Skeleton, Sparkline, StateView, Stepper, Switch, Tag, Ticks, TierLegend, Toast, TopBar, TrendChart, WeekStrip,
  AppIcon, Lockup, LogoGlyph, Mascot, MascotHead, PropGlyph, type PropKind, RewardCard, AgeBadge, Coupon, FreezeCard, GrowthBar, KnowledgeTip, LedgerRow, MessageRow, NiujinBalance, Paywall, ProBadge, ProductCard, StreakBar,
  type LogoState, type MascotMood, type MascotStage, type StreakStatus,
  type Forced, type IconName, type NumSize, type SkeletonShape, type Tab, type TagTone,
} from '../components';
import type { DeltaDir } from '../components';
import { REGION_NAME, fmt } from '../data/demo';
import { COUPONS, KNOWLEDGE, PRODUCTS, dateOf, growthSample, niujinOff, sampleRewards, type KnowledgeId } from '../data/growth';
import { GROWTH_CONFIG } from '../engine';
import { T } from '../styles/tokens.gen';
import type { Fixtures } from './fixtures';
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

export const GROUPS = ['基础', '表单', '反馈与悬浮层', '列表与页头', '训练与记录', '数据图形', '身体', '导航', '品牌', '增长'] as const;

/** 只在交互演示或页面里出现、不进矩阵的导出（catalog.test 读这张表） */
export const NOT_IN_MATRIX: Record<string, string> = {
  Cascade: 'M07 交错入场是一段动画，见「训练与记录 · ExerciseRow」下的交互演示',
  Screen: '页面框（版式容器），见 /preview §4 与整页演示',
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
  default: '默认', pressed: '按下', focused: '聚焦', disabled: '禁用', loading: '加载中', primary: '主操作', primary_glow: '主操作 · 光晕', neutral: '中性', ghost: '描边', danger: '危险',
  l: '大', s: '小', raised: '实底', plain: '无底', true: '是', false: '否', single: '单选', multi: '多选', empty: '空', filled: '已填', error: '错误', 'error-reps': '次数错误', 'pk-freeze': '冻结卡', 'pk-niujin': '牛劲', 'pk-trial': 'Pro 体验', 'pk-shipping': '免邮券', 'pk-merchant': '商家券', 'ps-normal': '可用', 'ps-used': '刚用掉', 'ps-dim': '已用 / 过期',
  min: '到下限', max: '到上限', strong: '强调', outline: '虚线', up: '上升', down: '下降', flat: '持平', baseline: '基线', static: '只读', nav: '可进入',
  toggle: '开关', plain_card: '普通', hero: '主角', todo: '待做', first: '首次', current: '进行中', done: '已完成', skipped: '未做', missing: '缺值',
  editing: '修改中', warmup: '热身组', drop: '递减组', running: '计时中', ending: '即将结束', normal: '普通', pr: '有 PR', deload: '减量周', trained: '已练',
  'trained-pr': '已练 · PR', rest: '休息', today: '今天', future: '未来', selected: '选中', ready: '已加载', many: '多次', 'many-selected': '多次 · 选中一次',
  one: '只有 1 次', none: '未练', off: '不画环', empty_pts: '没有记录', single_pt: '只有 1 次', add: '加重', hold: '保持', cut: '减重', low: '不足', ok: '达标', over: '超量', repair: '修复期',
  recovering: '恢复中', golden: '黄金窗', decayed: '已回落', near: '邻近', focus: '焦点', front: '正面', back: '背面', male: '男', female: '女',
  track: '已开始 · 0 组', partial: '进行中', full: '满环', home: '首页', body: '身体', gains: '增量', log: '记录', me: '我的', success: '成功', undo: '可撤销',
  suggest: '建议减量', week: '减量周', quiet: '一行小字', 'pool-empty': '动作池不足', resume: '继续上次训练', info: '信息', page: '子页', session: '训练中',
  eyebrow: '带日期与附件', pill: '小胶囊', open: '展开', loadingState: '加载中',
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
    name: 'Icon', group: '基础', desc: 'I3：24u 网格上 2u 圆头断笔线稿，画完整体 skewX(−11°)；颜色跟随 currentColor；默认 size/icon，小号 size/icon-s。导航五个图标按图标网格规范对齐（下方内嵌整页规范板，源文件 design/icon-grid/index.html）。装饰性，含义由文字或 aria-label 给出。',
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
    name: 'OptionCard', group: '表单', desc: '建档与设置的选项：single = 单选（训练经验），multi = 多选（可用器械）。选中为骨白描边 + 实心标记。',
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
    name: 'Sheet', group: '反馈与悬浮层', desc: '底部面板（肌头详情、减量面板）。盖住导航；点遮罩、×、Esc、返回键关闭。',
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
    name: 'SectionLabel', group: '列表与页头', desc: '区块标题（Label，text/secondary），可带右侧附件。', axes: {}, size: 'card',
    render: () => <SectionLabel trailing={<span className="milo-text-caption">3 个</span>}>接下来</SectionLabel>,
  },
  {
    name: 'PageHeader', group: '列表与页头', desc: 'Tab 根页的页头：Title/L，上边距 space/l；日期等小字放标题上方，分段控件等放右侧。',
    axes: { kind: ['plain', 'eyebrow'] }, size: 'screen',
    render: (p) => p.kind === 'plain' ? <PageHeader title="记录" /> : <PageHeader title="今日处方" eyebrow="10月3日 周六" trailing={<Segmented label="视图" items={[['f', '正面'], ['b', '背面']]} value="f" />} />,
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
    name: 'SessionRow', group: '训练与记录', desc: '训练记录列表：日期块 + 主要部位 + 动作 / 组数 / 时长，有 PR 打强调标签。',
    axes: { kind: ['normal', 'pr', 'deload'], state: ['default', 'pressed', 'focused'] }, rows: ['kind'], cols: 'state', size: 'card',
    render: (p, f) => { const x = f.sessions[0] ?? { date: 3, weekday: '六', title: '胸 · 肩', meta: '6 个动作 · 14 组', prs: 0 };
      return <SessionRow {...x} prs={p.kind === 'pr' ? Math.max(1, x.prs) : 0} deload={p.kind === 'deload'} state={st(p.state)} />; },
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
  /* ---------------- 数据图形 ---------------- */
  {
    name: 'RestDock', group: '训练与记录', desc: 'M02 流体胶囊形变：组间休息平时是底部一颗小胶囊（底边一道骨白细线 = 剩余比例），点开原地长成休息面板（±15、跳过），尺寸与圆角按软弹簧一起过渡。',
    axes: { state: ['pill', 'open', 'done'] }, size: 'card',
    render: (p) => <RestDock remaining={p.state === 'done' ? 0 : 95} total={180} open={p.state === 'open'} onToggle={noop} />,
  },
  {
    name: 'SharedDetail', group: '训练与记录', desc: 'M03 共享元素展开（View Transitions）：列表行（ExerciseRow sharedId）的卡片底、名称、重量与详情同名，点开时原地变形成整屏详情——卡片长满屏、名称与数字飞到新位置并放大，正文随后淡入；返回时变回去。真实动画见下方交互演示。',
    axes: { state: ['open'] }, size: 'screen', covers: ['sharedName', 'sharedTransition'],
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
    name: 'WeekBars', group: '数据图形', desc: 'E3 竖向胶囊量表（ref3）：近 8 周每周完成组数，本周骨白；和身体页胶囊同一语言（胶囊即量尺）。',
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
    name: 'TrendChart', group: '数据图形', desc: '动作进步曲线（P10）：预估 1RM 对日期，时间按正序画；PR 点菱形；点一下或方向键选中一次。少于 2 次不画线。',
    axes: { points: ['many', 'many-selected', 'one', 'empty_pts'] }, size: 'card',
    render: (p, f) => <TrendChart points={p.points === 'one' ? f.trends.one : p.points === 'empty_pts' ? [] : f.trends.normal}
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
    name: 'Capsule', group: '身体', desc: '胶囊 = 量尺：底色按「组数 ÷ 最大可恢复量」从左填；0 组斜纹压暗；超量加斜纹。放大镜：邻近按余弦变大；焦点荧光实心，名称挪到最右（手指底下），组数 / 恢复度 · 时相 / 还需几小时三行写在左边（手指挡不到）。',
    axes: { tier: ['none', 'low', 'ok', 'over'], size: ['rest', 'near', 'focus'] }, rows: ['tier'], cols: 'size', size: 'm',
    render: (p, f) => cap(f, p.tier, p.size),
  },
  {
    name: 'CapsuleRail', group: '身体', desc: '胶囊列 + 引线 + 放大镜手势：手势层只盖胶囊列静止宽度（人体在左边另接轻点）；竖向短滑滚动页面，按住 150 ms 不动才进放大镜、进入后锁住滚动；先动 8 px 算滚动；松手只退出，轻点才打开详情。真机手势见下方交互演示。',
    axes: { mag: ['rest', 'focus'] }, size: 'card',
    render: (p, f) => {
      const ids = ['upper-pectoralis', 'mid-lower-pectoralis', 'anterior-deltoid', 'lateral-deltoid', 'long-head-bicep', 'upper-abdominals'].filter((id) => f.body.stats.has(id));
      const w = T['size/screen-w'] - T['size/gutter'] * 2, h = ids.length * (T['size/capsule-rest-max-h'] + T['size/capsule-gap']) + T['size/capsule-focus-h'];
      return <div className={s.railBox} style={{ height: h }}><CapsuleRail ids={ids} stats={f.body.stats} anchors={{}} width={w} height={h} left={w * T['ratio/rail-start']} right={w}
        mag={p.mag === 'focus' ? 1 : null} onMag={noop} onSelect={noop} /></div>;
    },
  },
  {
    name: 'BodyFigure', group: '身体', desc: 'MuscleWiki 真实路径的半身：从包围盒左侧裁掉 ratio/figure-crop，左缘渐隐；按容量四档着色。只用于陪衬胶囊。',
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
    desc: '成长条：离下一级还差多少，用能照着做的说法（主项预估 1RM 再涨几 kg，或再完成几个周期），由引擎反推；快升级时发光扫光；下一级是升段时标出；Milo 3 级满级。',
    axes: { state: ['g-normal', 'g-near', 'g-stage', 'g-max'] }, size: 'card',
    render: (p) => {
      const g = growthSample(), n = g.next!;
      const v = { 'g-normal': [g.stage, 2, n.progress], 'g-near': [g.stage, 2, 0.92], 'g-stage': [g.stage, 3, 0.4], 'g-max': ['milo', 3, 1] }[p.state] as [MascotStage, 1 | 2 | 3, number];
      return <GrowthBar stage={v[0]} sub={v[1]} progress={v[2]} lift={n.lift} cycles={n.cycles} />;
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
    name: 'FreezeCard', group: '增长',
    desc: '连胜冻结卡：有卡（断档那周的周一自动用一张）/ 没卡（牛劲兑换或开 Pro 每月送 2 张）/ 刚自动用了一张（连胜保住，变荧光）。',
    axes: { state: ['f-have', 'f-none', 'f-used'] }, size: 'card',
    render: (p) => <FreezeCard count={p.state === 'f-none' ? 0 : 1} state={p.state.slice(2) as 'have' | 'none' | 'used'} cost={COUPONS.freeze.cost} />,
  },
  {
    name: 'NiujinBalance', group: '增长', covers: ['LedgerRow'],
    desc: '牛劲余额（码表数字 + 本月进账，主角卡光）与流水：获得是荧光 +，花出是骨白 −，会员期间标「×1.5」。数字是演示用户练到第 30 周的引擎实算（第 20 周兑换过一张冻结卡）。',
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
    desc: '卡券（票根：左侧深色存根放道具图标 PropGlyph + 面额，两侧缺口 + 虚线）：商家券 / 免邮券 / 会员体验 / 冻结卡 × 可兑换 / 牛劲不够（按钮不可用、写明还差多少）/ 可用 / 已用 / 已过期。',
    axes: { type: ['c-merchant', 'c-shipping', 'c-trial', 'c-freeze'], state: ['c-redeem', 'c-short', 'c-available', 'c-used', 'c-expired'] }, rows: ['type'], cols: 'state', size: 'card',
    render: (p) => {
      const c = COUPONS[p.type.slice(2) as keyof typeof COUPONS], st = p.state.slice(2);
      return <Coupon type={c.type} title={c.title} detail={c.detail} state={st === 'short' ? 'redeem' : st as 'redeem' | 'available' | 'used' | 'expired'} cost={c.cost} balance={st === 'short' ? Math.round(c.cost * 0.6) : c.cost * 3} />;
    },
  },
  {
    name: 'KnowledgeTip', group: '增长',
    desc: '情境知识卡（商城的主要入口）：由引擎数据触发，先讲为什么现在给你看、适合什么时候、怎么用，再给商品。页内提示只在身体页、增量页出现，一屏最多一条，可关闭、可「不再提示这一类」；补剂写明「不构成医疗建议」。',
    axes: { card: ['belt', 'straps', 'protein', 'creatine', 'knee'], variant: ['k-tip', 'k-header'] }, rows: ['card'], cols: 'variant', size: 'card',
    render: (p) => { const k = KNOWLEDGE[p.card as KnowledgeId]; return <KnowledgeTip {...k} variant={p.variant === 'k-tip' ? 'tip' : 'header'} />; },
  },
  {
    name: 'ProductCard', group: '增长',
    desc: '商品卡：商家、品类、规格、价格；会员价（划掉原价 + Pro 价）；牛劲抵扣（100 牛劲抵 1 元，单笔最多 20%）；已下架不可点。商家与品牌全部虚构，价格为示例；商品图是用户按提示词出的实物图（品红底抠图，public/shop/<id>.webp），没有图时显示几何品类占位。',
    axes: { product: PRODUCTS.map((x) => x.id), state: ['p-normal', 'p-member', 'p-niujin', 'p-off'] }, rows: ['product'], cols: 'state', size: 'card',
    render: (p) => { const x = PRODUCTS.find((y) => y.id === p.product)!; return <ProductCard {...x} state={p.state.slice(2) as 'normal' | 'member' | 'niujin' | 'off'} off={niujinOff(x.price, growthSample().niujin.balance)} />; },
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
    desc: '「我的」→ 消息：同时达成多项时没弹出来的奖励、冻结卡已自动使用、删除训练后的降级说明（不弹窗，只写在这里）。',
    axes: { kind: ['reward', 'freeze', 'demote'], unread: ['true', 'false'] }, rows: ['kind'], cols: 'unread', size: 'card',
    render: (p) => {
      const v = { reward: ['破纪录 · 杠铃卧推', '预估 1RM 82.5 → 85 kg，+30 牛劲'], freeze: ['冻结卡已自动使用', '上周练了 1 / 4 次，连胜 7 周保住了'], demote: ['牛龄回到 壮牛 1 级', '你删除了 9 月 12 日的训练，成长值已重算'] }[p.kind] as [string, string];
      return <MessageRow kind={p.kind as 'reward' | 'freeze' | 'demote'} title={v[0]} detail={v[1]} date="今天" unread={p.unread === 'true'} />;
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
