/* 每页的线框标注（取自 docs/ia.md §4、§6）、数据态跳转、四条核心流程的走查步骤。
 * 改页面框架时先改 ia.md，再同步这里。 */
window.PAGE_META = {
  P12: { name: '建档', route: '/onboarding?step=1', first: '当前这一问，以及默认选中项', action: '「下一步」/「生成第一份处方」', nav: '顶部步骤指示 1/3、返回；无 Tab',
    states: [['默认', { scenario: 'fresh-install', route: '/onboarding?step=1' }], ['存储失败', { scenario: 'fresh-install', route: '/onboarding?step=3', inject: { storageFail: true } }]] },
  P01: { name: '今日处方', route: '/today', first: '今天练什么：动作名、组 × 次、建议重量；一行总述（几块肌肉、共几组）', action: '「开始训练」/「继续训练」（底部固定）', nav: '底部 Tab；顶部日期；「为什么是这些」入口',
    states: [['加载', { route: '/today', inject: { loading: true } }], ['有处方（无减量）', { scenario: 'plain-prescription', route: '/today' }], ['有减量建议', { scenario: 'deload-suggested', route: '/today' }],
      ['减量周', { scenario: 'deload-adopted', route: '/today' }], ['这次不减', { scenario: 'deload-dismissed', route: '/today' }], ['恢复日', { scenario: 'rest-day', route: '/today' }],
      ['动作池不足', { scenario: 'pool-exhausted', route: '/today' }], ['今天已练完', { scenario: 'done-today', route: '/today' }], ['有进行中训练', { scenario: 'in-progress', route: '/today' }],
      ['冷启动', { scenario: 'cold-start', route: '/today' }], ['引擎错误', { scenario: 'engine-error', route: '/today' }]] },
  P02: { name: '处方依据', route: '/today/why', first: '各肌头的恢复度，对照近 7 天组数', action: '无（阅读页）', nav: '顶部返回',
    states: [['有历史', { scenario: 'deload-suggested', route: '/today/why' }], ['冷启动', { scenario: 'cold-start', route: '/today/why' }], ['减量周', { scenario: 'deload-adopted', route: '/today/why' }], ['恢复日', { scenario: 'rest-day', route: '/today/why' }]] },
  P03: { name: '训练', route: '/session', first: '当前展开动作的当前组：预填的重量和次数', action: '「完成这一组」；次要：「完成训练」', nav: '顶部动作进度（2/6）与暂停；休息悬浮条；无 Tab',
    states: [['进行中 · 休息中', { scenario: 'in-progress', route: '/session' }], ['刚开始 · 无已完成组', { scenario: 'plain-prescription', route: '/session', then: 'startSession' }], ['冷启动开始（无建议值）', { scenario: 'cold-start', route: '/session', then: 'startSession' }]] },
  P04: { name: '动作要领', route: '/exercise/barbell-bench-press-4', first: '示范媒体和一句话要点', action: '无；次要：「查看我的进步」', nav: '顶部返回',
    states: [['有示范', { route: '/exercise/barbell-bench-press-4' }], ['无示范', { route: '/exercise/barbell-bench-press-4', inject: { mediaMissing: true } }], ['素材加载失败', { route: '/exercise/barbell-bench-press-4', inject: { mediaError: true } }]] },
  P05: { name: '训练结算', route: '/summary/demo-w0-push', first: '本次进步的结论（PR 或预估 1RM 变化）', action: '「完成」', nav: '无返回箭头，只有「完成」',
    states: [['有 PR', { route: '/summary/demo-w0-push' }], ['无 PR', { route: '/summary/demo-w7-push' }], ['首次训练（基线）', { route: '/summary/demo-w7-lowerA' }], ['部分动作未做', { route: '/summary/demo-w3-pull' }]] },
  P06: { name: '容量与恢复', route: '/progress', first: '人体示意图的容量着色，和右侧带名称的肌头胶囊', action: '按住胶囊轨道滑动（放大镜）；轻点胶囊看详情', nav: '底部 Tab；顶部分段（容量与恢复 / 训练记录 / 动作进步）',
    states: [['加载', { route: '/progress', inject: { loading: true } }], ['有数据（含从未练过）', { scenario: 'deload-suggested', route: '/progress' }], ['空', { scenario: 'cold-start', route: '/progress' }]] },
  P07: { name: '训练记录', route: '/progress/history', first: '最近一次训练', action: '点列表项进入详情', nav: '底部 Tab；顶部分段',
    states: [['很多条（29 条，分段加载）', { scenario: 'deload-suggested', route: '/progress/history' }], ['空', { scenario: 'cold-start', route: '/progress/history' }], ['加载', { route: '/progress/history', inject: { loading: true } }]] },
  P08: { name: '训练记录详情', route: '/progress/history/demo-w0-push', first: '每个动作每一组的重量 × 次数', action: '无；次要：溢出菜单里删除', nav: '顶部返回',
    states: [['正常', { route: '/progress/history/demo-w0-push' }], ['有单侧动作', { route: '/progress/history/demo-w0-pull' }], ['有未做的动作', { route: '/progress/history/demo-w3-pull' }], ['已被删除', { route: '/progress/history/no-such-session' }]] },
  P09: { name: '动作进步', route: '/progress/exercises', first: '每个动作的最近预估 1RM 与趋势方向', action: '点动作进入曲线', nav: '底部 Tab；顶部分段',
    states: [['有数据', { scenario: 'deload-suggested', route: '/progress/exercises' }], ['空', { scenario: 'cold-start', route: '/progress/exercises' }]] },
  P10: { name: '动作进步曲线', route: '/progress/exercises/barbell-bench-press-4', first: '预估 1RM 折线与最新值', action: '无；点数据点看当次', nav: '顶部返回',
    states: [['正常（卧推）', { route: '/progress/exercises/barbell-bench-press-4' }], ['下滑中（深蹲）', { route: '/progress/exercises/barbell-squat-8' }], ['只有 2 次（面拉）', { route: '/progress/exercises/machine-face-pulls-22' }], ['少于 2 次（分腿蹲）', { route: '/progress/exercises/dumbbell-bulgarian-split-squat-317' }], ['动作已不存在', { route: '/progress/exercises/no-such-exercise' }]] },
  P11: { name: '设置', route: '/settings', first: '当前档案摘要（经验、器械、时长）', action: '点某一项修改；底部「演示」分组', nav: '底部 Tab',
    states: [['正常', { scenario: 'deload-suggested', route: '/settings' }], ['高阶档案', { scenario: 'advanced-profile', route: '/settings' }], ['保存失败', { route: '/settings', inject: { storageFail: true } }], ['训练进行中（改动延后生效）', { scenario: 'in-progress', route: '/settings' }]] },
};

window.FLOWS = [
  { id: 'F1', title: '首次使用与建档', start: { scenario: 'fresh-install', route: '/onboarding?step=1' }, steps: [
    'P12 第 1 步：训练经验，默认选中「进阶」→ 下一步', 'P12 第 2 步：可用器械，六类默认勾选（全取消时「下一步」禁用）→ 下一步', 'P12 第 3 步：单次训练时长，默认 60 分钟 → 「生成第一份处方」',
    'P01 冷启动：动作旁显示「首次：选一个能干净做完 N 次的重量」'] },
  { id: 'F2', title: '完成一次训练（主闭环）', start: { scenario: 'plain-prescription', route: '/today' }, steps: [
    'P01 点「开始训练」（今日首个动作有建议重量）', 'P03 预填的重量和次数，点「完成这一组」（1 次点击）→ 休息悬浮条开始倒计时', 'P03 点重量或次数，用行内键盘改数值（试试输入 600）',
    'P03 点「要领」→ P04（倒计时在后台继续）→ 返回 P03', 'P03 做完全部动作（或点「完成训练」提前结束）→ 力竭度选择', 'P05 结算：本次总量、PR、逐动作对比 → 点某个动作进 P10 → 返回', 'P05 点「完成」→ P01 显示「今天已练完」'] },
  { id: 'F3', title: '回看进步', start: { scenario: 'deload-suggested', route: '/progress' }, steps: [
    'P06 按住右侧胶囊轨道上下滑动（放大镜），松手后打开详情；或轻点某个胶囊', 'P06 切到「训练记录」→ P07 → 点某次训练 → P08', 'P08 右上角 ⋯ → 删除这次训练（二次确认，之后容量与 PR 重算）',
    'P08 点某个动作 → P10 曲线（PR 为菱形）', 'P06 切到「动作进步」→ P09 → 选一个动作 → P10'] },
  { id: 'F4', title: '理解并采纳处方', start: { scenario: 'deload-suggested', route: '/today' }, steps: [
    'P01 点某个动作的「理由」，行内展开一句话依据', 'P01 点「为什么是这些」→ P02：肌头恢复度对照三条地标', 'P01 点「建议本周减量」→ 底部面板 →「采纳」（或「这次不减」）',
    'P01 顶部显示「减量周 · 还剩 6 天」，处方已按 ×0.5 / ×0.9 重算', 'P11 改经验 / 器械 / 时长 → 保存 → 回到 P01，变化的动作有标记'] },
];
