/** 组件库入口（DESIGN §9）。页面只从这里取组件；每个导出都必须出现在 /playground（catalog.test 核对）。 */
import './interactive.css';

export { FluidBackdrop, grainTile, installGrain } from './atmosphere';
export { BodyFigure, type Anchors } from './BodyFigure';
export { Button, IconButton, type ButtonKind } from './Button';
export { Capsule, CapsuleRail } from './CapsuleRail';
export { Sparkline, TrendChart, type Point } from './charts';
export { DotCalendar, GiantNumber, Odometer, StepRing, WeekBars, dotMonths, type DotMonth } from './dataviz';
export { Cascade, RestDock, SharedDetail, sharedName, sharedTransition } from './motion';
export { Chip, NumberField, OptionCard, OptionGroup, ProgressSteps, Stepper, Switch } from './controls';
export { Dialog, DialogCard, Skeleton, StateView, Toast, ToastViewport, type SkeletonShape, type StateKind } from './feedback';
export { IncrementRuler, LandmarkRuler, PhaseSegments } from './Gauges';
export { Icon, ICONS, type IconName } from './Icon';
export { Nav, TABS, type Tab } from './Nav';
export { OverlayHost, Portal, ToastProvider, handleBack, useBackHandler, useToast } from './overlay';
export { Screen, ScreenAtmosphere } from './Screen';
export { BodyRender, heatCss, heatOf, type Thermal } from './thermal';
export { Segmented } from './Segmented';
export { Sheet, SheetBlock } from './Sheet';
export { forced, type Forced } from './state';
export { Ticks } from './Ticks';
export {
  DayCell, ExerciseRow, MediaFrame, PrescriptionHero, RestBar, SessionRow, SetRow, WeekStrip, clock, useCountdown,
  type DayProps, type DayStatus, type ExerciseStatus, type MediaState, type SetStatus, type SetType,
} from './training';
export { Banner, Card, Delta, List, ListRow, Num, PageHeader, SectionLabel, StatusStrip, Tag, TierLegend, TopBar, type DeltaDir, type NumSize, type TagTone } from './ui';
