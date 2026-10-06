/** 引擎常数。默认值取自 V1 引擎（GYMLOGrepo src/data/adaptivePresets.js）与 ia.md；
 *  做成可配置，是为了让对照测试能用原型的系数跑同一套逻辑（src/engine/parity.test.ts）。 */
export interface EngineConfig {
  /** 容量地标（中肌群基准，再按肌群大小缩放；ia §1.10） */
  mev: number;
  mav: number;
  mrv: number;
  /** 上一次刺激的组数 → 恢复窗口系数：[上限, 系数]，按顺序匹配 */
  volumeFactor: [number, number][];
  /** 力竭度 → 系数（ia §1.7：≤6 / ≤8 / ≤9 / >9 → 0.85 / 1.0 / 1.15 / 1.3） */
  exertionFactor: [number, number][];
  experienceFactor: Record<'novice' | 'intermediate' | 'advanced', number>;
  /** 个人恢复系数自学习（V1 PERSONAL） */
  personal: { min: number; max: number; learnRate: number; enabled: boolean };
  /** 容量进阶：连续几周吃满最低有效量 → 每周 +1 组，最多 +4（ia §1.10）；有减量信号时归零 */
  volumeBonus: { maxWeeks: number; enabled: boolean };
  readiness: { block: number; partial: number };
  loadStep: number;
  progress: { upUpper: number; upLower: number; down: number };
  deload: { volume: number; intensity: number; days: number };
  /** PR 门槛：比此前最好成绩至少高 0.05 kg（ia §1.7） */
  prMinKg: number;
  /** 趋势的「持平」带：与上一次相比 ±1% 以内算持平（ia §1.9）；减量信号、处方的「先不加重」、增量页的涨跌都用同一个 */
  trendEps: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  mev: 7,
  mav: 13,
  mrv: 18,
  volumeFactor: [[2, 0.55], [4, 0.8], [7, 1.0], [Infinity, 1.25]],
  exertionFactor: [[6, 0.85], [8, 1.0], [9, 1.15], [Infinity, 1.3]],
  experienceFactor: { novice: 1.2, intermediate: 1.0, advanced: 0.85 },
  personal: { min: 0.6, max: 1.6, learnRate: 0.05, enabled: true },
  volumeBonus: { maxWeeks: 4, enabled: true },
  readiness: { block: 0.5, partial: 0.85 },
  loadStep: 2.5,
  progress: { upUpper: 0.025, upLower: 0.05, down: 0.075 },
  deload: { volume: 0.5, intensity: 0.9, days: 6 },
  prMinKg: 0.05,
  trendEps: 0.01,
};

/** 低保真原型（prototype/engine.js）用的系数：只给对照测试用 */
export const PROTOTYPE_CONFIG: EngineConfig = {
  ...DEFAULT_CONFIG,
  volumeFactor: [[2, 0.85], [4, 1.0], [6, 1.15], [Infinity, 1.3]],
  experienceFactor: { novice: 1.15, intermediate: 1.0, advanced: 0.9 },
  personal: { ...DEFAULT_CONFIG.personal, enabled: false },
  volumeBonus: { ...DEFAULT_CONFIG.volumeBonus, enabled: false },
};

export const factorFrom = (table: [number, number][], value: number) => {
  for (const [limit, k] of table) if (value <= limit) return k;
  return table[table.length - 1][1];
};
