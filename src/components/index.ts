/** 组件库入口（DESIGN §9）。页面只从这里取组件；每个导出都必须出现在 /playground（catalog.test 核对）。 */
import './interactive.css';

export { FluidBackdrop, grainTile, installGrain } from './atmosphere';
export { BodyFigure, ContourFx, DEFAULT_LIGHT_LOOK, DEFAULT_LOOK, FillFx, LIGHT_CONTOUR_PICKS, LIGHT_CONTOURS, LIGHT_LOOKS, LightContour, LightLook, ScanFx, lightToneVars, type Anchors, type ContourFxKind, type FillFxKind, type LightContourKind, type LightLookKind, type LightLookSpec, type ScanFxKind } from './BodyFigure';
export { BodyPicker } from './BodyPicker';
export { Button, IconButton, type ButtonKind } from './Button';
export { Capsule, CapsuleRail } from './CapsuleRail';
export { Sparkline, TrendChart, type Point } from './charts';
export { FluidPanel } from './FluidPanel';
export { FinderBody, PickRow, SwapRow, type EquipFilter } from './finder';
export { GuideCue, GuideSteps, GuideVideo, useGuidePlayer } from './guide';
export { GainGroupHead, GainRow, GainSummary, type GroupKind as GainGroupKind, GainLook, type GainLookKind } from './gains';
export { DotCalendar, GiantNumber, Odometer, HeadWeeks, StepRing, WeekBars, dotDays, dotMonths, type DotCell, type DotMonth } from './dataviz';
export { SteelPlate, type PlateLook } from './plate';
export { Cascade, Collapsible, RestDock, SharedDetail, Tilt, drillName, drillTransition, guardTransitionTaps, pageSwapped, sharedName, sharedTransition, viewTransit } from './motion';
export { Chip, NumberField, OptionCard, OptionGroup, ProgressSteps, Stepper, Switch } from './controls';
export { Dialog, DialogCard, LoadMore, Skeleton, StateView, Toast, ToastViewport, type SkeletonShape, type StateKind } from './feedback';
export { IncrementRuler, LandmarkRuler, PhaseSegments } from './Gauges';
export { Icon, ICONS, type IconName } from './Icon';
export { AppIcon, Lockup, LogoGlyph, LOGO_STATE_NAME, type LogoMark, type LogoState } from './Logo';
export { PropGlyph, PROP_NAME, type PropKind } from './PropGlyph';
export { Mascot, MascotHead, MASCOT_MOODS, MASCOT_STAGES, MOOD_NAME, STAGE_NAME, type MascotMood, type MascotStage } from './Mascot';
export { Nav, TABS, navHandoff, type Tab } from './Nav';
export { OverlayHost, Portal, ToastProvider, handleBack, useBackHandler, useExitGhost, useToast } from './overlay';
export { Screen, ScreenAtmosphere } from './Screen';
export { BodyRender, heatCss, heatOf, type Thermal } from './thermal';
export { Segmented } from './Segmented';
export { Sheet, SheetBlock } from './Sheet';
export { forced, type Forced } from './state';
export { Ticks } from './Ticks';
export {
  DayCell, ExerciseRow, MediaFrame, PrescriptionHero, SessionRow, SetEditor, SetLine, SetRow, NumPad, WarmupStrip, WeekStrip, clock, useCountdown,
  type DayProps, type DayStatus, type ExerciseStatus, type MediaState, type SetStatus, type SetType,
} from './training';
export { BackToTop } from './BackToTop';
export { Banner, Card, Delta, List, ListRow, Num, PageHeader, ProfileTile, SectionLabel, StatusStrip, Tag, TierLegend, TopBar, type DeltaDir, type NumSize, type TagTone } from './ui';
export { RewardCard, RewardModal, REWARD_NAME, type Reward, type RewardKind } from './Reward';
export { AgeBadge, Coupon, FreezeCard, GrowthBar, GrowthCard, KnowledgeTip, LedgerRow, MessageRow, NiujinBalance, Paywall, ProBadge, StageHero, StreakBar, StreakRisk, StreakWeeks, type StreakStatus, type StreakWeekStatus } from './growth';
export { Breakdown, EvidencePanel, NiujinLine, OrderLine, PriceBlock, ProductCard, ProductGrid, ProductImage, RecommendCard, StatusTag, WalletExits, type ProductCardProps, type ProductStatus , ShopTagLook, type ShopTagLookKind } from './shop';
export { MonthStats, PerkLedger, PerkTable, PlanPicker, ProCard, ProLink, ProWelcome, type PerkItem, type PlanOption } from './pro';
export { GrainGlow, OrbitPlate, ParticleField, type GrainKind, type ParticleKind } from './particles';
export { ThemeBar } from './ThemeBar';
