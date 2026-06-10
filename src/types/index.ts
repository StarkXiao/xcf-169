export interface ClockTime {
  hours: number
  minutes: number
}

export interface GearState {
  id: number
  angle: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  timeDelta: number
}

export interface GameResult {
  success: boolean
  score: number
  timeLeft: number
  isPatrolMode?: boolean
  periodsCleared?: number
  totalPeriods?: number
  patrolScoreBreakdown?: PatrolScoreBreakdown
}

export type GameStatus = 'idle' | 'playing' | 'success' | 'failed'

export type GameMode = 'classic' | 'patrol' | 'multiclock'

export type NightPeriod = 'dusk' | 'earlyNight' | 'deepNight' | 'dawn'

export type WeatherIntensity = 'calm' | 'light' | 'moderate' | 'heavy' | 'storm'

export type GearFaultType = 'none' | 'jam' | 'slip' | 'reverse' | 'freeze'

export interface PeriodConfig {
  id: NightPeriod
  name: string
  displayName: string
  clockTime: string
  duration: number
  weather: {
    rain: WeatherIntensity
    wind: WeatherIntensity
    lightning: WeatherIntensity
  }
  possibleFaults: GearFaultType[]
  faultCount: number
  scoreMultiplier: number
  targetOffset: number
}

export interface ActiveGearFault {
  gearId: number
  type: GearFaultType
  expiresAt: number
}

export interface WeatherState {
  rain: WeatherIntensity
  wind: WeatherIntensity
  lightning: WeatherIntensity
}

export interface PatrolScoreBreakdown {
  baseScore: number
  accuracyBonus: number
  timeBonus: number
  periodBonus: number
  faultPenalty: number
  total: number
}

export type GearMaterial = 'brass' | 'steel' | 'silver' | 'gold' | 'platinum'

export interface GearMaterialConfig {
  id: GearMaterial
  name: string
  displayName: string
  unlockScore: number
  efficiencyMultiplier: number
  toleranceBonus: number
  visual: {
    baseColor: number
    borderColor: number
    glowColor: string
  }
  audio: {
    rotateFreq: number
    snapFreq: number
    waveform: OscillatorType
  }
  description: string
}

export type CalibrationTool = 'magnifier' | 'lubricant' | 'metronome' | 'telescope'

export interface CalibrationToolConfig {
  id: CalibrationTool
  name: string
  displayName: string
  icon: string
  unlockScore: number
  description: string
  effect: {
    type: 'tolerance' | 'faultResist' | 'feedback' | 'targetHint'
    value: number
  }
}

export interface WorkshopState {
  currentMaterial: GearMaterial
  unlockedMaterials: GearMaterial[]
  currentTools: CalibrationTool[]
  unlockedTools: CalibrationTool[]
  totalScoreEarned: number
  bestScore: number
}

export interface WorkshopEffects {
  efficiencyMultiplier: number
  toleranceMinutes: number
  faultResistanceChance: number
  showTargetHint: boolean
  enhancedFeedback: boolean
}

export type SideTowerClockRole = 'minute' | 'hour' | 'second'

export interface SideTowerClock {
  id: string
  name: string
  displayName: string
  role: SideTowerClockRole
  position: { x: number; y: number }
  currentTime: ClockTime
  targetTime: ClockTime
  linkedToMain: boolean
  linkageRatio: number
  deviationMinutes: number
  mechanismId?: string
  isAligned: boolean
}

export type MechanismType = 'gearChain' | 'pulley' | 'pendulum' | 'spring'

export interface ClockMechanism {
  id: string
  name: string
  displayName: string
  type: MechanismType
  sourceClockId: string
  targetClockId: string
  activationCondition: 'aligned' | 'deviationWithin' | 'timeReached'
  activationValue?: number
  isActive: boolean
  effectMultiplier: number
}

export interface MultiClockLevelConfig {
  id: string
  name: string
  displayName: string
  description: string
  duration: number
  mainClockTarget: ClockTime
  sideTowers: Omit<SideTowerClock, 'isAligned'>[]
  mechanisms: ClockMechanism[]
  toleranceMinutes: number
  scoreMultiplier: number
  requireAllAligned: boolean
}

export interface MultiClockState {
  levelConfig: MultiClockLevelConfig
  mainClockCurrent: ClockTime
  sideTowers: SideTowerClock[]
  mechanisms: ClockMechanism[]
  isCompleted: boolean
  isLocked: boolean
  allAligned: boolean
  totalDeviation: number
}

export type MultiClockGameStatus = 'idle' | 'playing' | 'success' | 'failed'

export interface MultiClockGameResult {
  success: boolean
  score: number
  timeLeft: number
  levelId: string
  sideTowersAligned: number
  totalSideTowers: number
  totalDeviation: number
  averageDeviation: number
}

export type SoundEvent =
  | 'gear_click'
  | 'fault_occur'
  | 'fault_clear'
  | 'time_aligned'
  | 'level_success'
  | 'level_fail'
  | 'weather_change'
  | 'period_transition'
  | 'alarm_ring'
  | 'tower_align'
  | 'storm_warning'
  | 'lightning_strike'
  | 'storm_rollback'
  | 'storm_end'

export type EditorSoundEventType = SoundEvent

export interface EditorSoundConfig {
  event: EditorSoundEventType
  enabled: boolean
  frequency: number
  waveform: OscillatorType
  duration: number
  volume: number
}

export type EditorFaultTriggerCondition =
  | 'time'
  | 'rotations'
  | 'deviation'
  | 'random'

export type EditorFaultType = 'jam' | 'slip' | 'reverse' | 'freeze'

export interface EditorFaultEvent {
  id: string
  name: string
  displayName: string
  type: EditorFaultType
  triggerType: EditorFaultTriggerCondition
  triggerValue: number
  targetGearIds: number[]
  duration: number
  enabled: boolean
}

export interface EditorGearConfig {
  id: number
  x: number
  y: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  initialAngle: number
  label?: string
}

export interface EditorLevelConfig {
  id: string
  name: string
  displayName: string
  description: string
  gameMode: GameMode
  duration: number
  gears: EditorGearConfig[]
  initialClockTime: ClockTime
  targetClockTime: ClockTime
  toleranceMinutes: number
  scoreMultiplier: number
  patrolPeriods?: PeriodConfig[]
  faultEvents: EditorFaultEvent[]
  soundConfigs: EditorSoundConfig[]
  sideTowers?: Omit<SideTowerClock, 'isAligned'>[]
  mechanisms?: ClockMechanism[]
  requireAllAligned?: boolean
  createdAt: number
  updatedAt: number
}

// ==================== 风暴系统 (StormSystem) ====================

export type StormPhase = 'idle' | 'warning' | 'active' | 'ended'

export interface LightningStrikeEffect {
  strikeId: string
  timestamp: number
  affectedGearIds: number[]
  gearAngleChanges: Map<number, number>
  targetTimeChanged: boolean
  previousTargetTime?: ClockTime
  newTargetTime?: ClockTime
  scorePenalty: number
}

export interface StormState {
  phase: StormPhase
  intensity: WeatherIntensity
  warningTimeLeft: number
  activeTimeLeft: number
  strikesThisStorm: number
  rollbackCharges: number
  totalStrikes: number
}

export interface StormCallbacks {
  onStormWarning?: (warningDuration: number) => void
  onStormStart?: () => void
  onLightningStrike?: (effect: LightningStrikeEffect) => void
  onRollbackUsed?: (effect: LightningStrikeEffect) => void
  onStormEnd?: (stats: StormStats) => void
  onStateChange?: (state: StormState) => void
}

export interface StormStats {
  totalStrikes: number
  totalGearsAffected: number
  targetTimesChanged: number
  rollbacksUsed: number
  scorePenalty: number
  scoreBonus: number
}

// ==================== 训练营系统 (TrainingSystem / TrainingGame / TrainingScene) ====================

export type LessonType =
  | 'gear_basics'
  | 'gear_linkage'
  | 'time_conversion'
  | 'combined_practice'
  | 'fault_handling'

export type LessonDifficulty = 'intro' | 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type LessonStepType = 'instruction' | 'demo' | 'challenge' | 'quiz' | 'checkpoint'

export interface ExpectedAction {
  gearId: number
  direction: 1 | -1
  times: number
  description?: string
}

export interface LessonStep {
  id: string
  order: number
  type: LessonStepType
  title: string
  content: string
  hint?: string
  expectedActions?: ExpectedAction[]
  isComplete: boolean
}

export interface TrainingGearConfig {
  id: number
  x: number
  y: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  initialAngle: number
  label?: string
  description?: string
  highlight?: boolean
}

export interface LessonRewards {
  score: number
  exp: number
  badgeId?: string
  unlocks?: string[]
}

export interface TrainingLesson {
  id: string
  type: LessonType
  difficulty: LessonDifficulty
  order: number
  title: string
  subtitle: string
  description: string
  unlockScore: number
  targetScore: number
  duration: number
  toleranceMinutes: number
  initialClockTime: ClockTime
  targetClockTime: ClockTime
  gears: TrainingGearConfig[]
  steps: LessonStep[]
  rewards: LessonRewards
}

export interface TrainingActionRecord {
  timestamp: number
  gearId: number
  direction: 1 | -1
  timeDelta: number
  isCorrect: boolean
}

export interface TrainingGameResult {
  lessonId: string
  success: boolean
  score: number
  timeLeft: number
  stepsCompleted: number
  totalSteps: number
  stars: number
  mistakes: number
  hintsUsed: number
  actionsRecord: TrainingActionRecord[]
}

export interface LessonProgress {
  lessonId: string
  bestScore: number
  bestTime: number
  stars: number
  completedAt: number
  attempts: number
}

export interface TrainingProgress {
  currentLessonId: string | null
  completedLessons: LessonProgress[]
  totalExp: number
  totalScore: number
  level: number
  badges: string[]
  unlockedLessons: string[]
}

export interface TrainingBadge {
  id: string
  name: string
  displayName: string
  icon: string
  description: string
  condition: string
  unlockScore: number
}

export interface TrainingLevel {
  level: number
  expRequired: number
  title: string
  perks: string[]
}

export interface TrainingReviewData {
  lesson: TrainingLesson
  result: TrainingGameResult
  accuracyRate: number
  timeEfficiency: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

// ==================== 钟声谱面系统 (BellChimeSystem / BellChimePanel) ====================

export type BellNotePitch =
  | 'C3' | 'D3' | 'E3' | 'F3' | 'G3' | 'A3' | 'B3'
  | 'C4' | 'D4' | 'E4' | 'F4' | 'G4' | 'A4' | 'B4'
  | 'C5' | 'D5' | 'E5' | 'F5' | 'G5' | 'A5' | 'B5'
  | 'C6'

export const BELL_NOTE_FREQUENCIES: Record<BellNotePitch, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
}

export type HarmonyType = 'unison' | 'third' | 'fifth' | 'octave' | 'triad' | 'seventh'

export interface HarmonyLayerConfig {
  id: string
  name: string
  displayName: string
  enabled: boolean
  harmonyType: HarmonyType
  basePitch: BellNotePitch
  octaveShift: number
  detune: number
  volume: number
  attack: number
  release: number
}

export type BeatAccent = 'strong' | 'weak' | 'none'

export interface RhythmBeat {
  index: number
  timeOffset: number
  accent: BeatAccent
  rest: boolean
}

export type RhythmPatternType = 'steady' | 'waltz' | 'marching' | 'fanfare' | 'crescendo' | 'arpeggio'

export interface RhythmPatternConfig {
  id: string
  name: string
  displayName: string
  type: RhythmPatternType
  bpm: number
  beatsPerMeasure: number
  beats: RhythmBeat[]
  repeatCount: number
  swingFactor: number
}

export type BellTriggerType =
  | 'time_aligned'
  | 'level_success'
  | 'level_fail'
  | 'period_transition'
  | 'tower_align'
  | 'gear_snap'
  | 'storm_end'

export interface BellTriggerCondition {
  id: string
  name: string
  displayName: string
  type: BellTriggerType
  enabled: boolean
  repeatable: boolean
  cooldownMs: number
  description: string
}

export interface BellChimePreset {
  id: string
  name: string
  displayName: string
  description: string
  unlockScore: number
  basePitches: BellNotePitch[]
  rhythmPatternId: string
  harmonyLayerIds: string[]
  triggerIds: string[]
  isDefault?: boolean
}

export interface BellChimeWorkshopState {
  currentPresetId: string
  unlockedPresetIds: string[]
  customPresets: BellChimePreset[]
  rhythmPatterns: RhythmPatternConfig[]
  harmonyLayers: HarmonyLayerConfig[]
  triggers: BellTriggerCondition[]
  totalBellScoreEarned: number
}

export interface BellNote {
  id: string
  pitch: BellNotePitch
  startTime: number
  duration: number
  velocity: number
  layer: number
}

export interface BellChimeRuntimeStats {
  lastTriggerTime: number
  playCount: number
  totalNotesPlayed: number
}

export interface BellChimePlaybackOptions {
  playbackRate?: number
  volumeMultiplier?: number
  startDelay?: number
  onNoteStart?: (note: BellNote) => void
  onComplete?: () => void
}

// ==================== 双人协作系统 (DuoCoopSystem / DuoCoopGame / DuoCoopScene) ====================

export type DuoCoopPlayerRole = 'master' | 'slave'

export type DuoCoopInterferenceType =
  | 'drift'
  | 'rebound'
  | 'fog'
  | 'magnet'
  | 'stutter'

export type InterferenceSeverity = 'low' | 'medium' | 'high'

export interface DuoCoopInterferenceEvent {
  id: string
  type: DuoCoopInterferenceType
  name: string
  displayName: string
  description: string
  icon: string
  targetPlayer: DuoCoopPlayerRole | 'both'
  durationMs: number
  triggerChance: number
  severity: InterferenceSeverity
}

export type DuoCoopSyncScope = 'master' | 'slave' | 'both'

export interface DuoCoopSyncTarget {
  id: string
  targetTime: ClockTime
  toleranceMinutes: number
  label: string
  scope: DuoCoopSyncScope
  bonusScore: number
  isAchieved: boolean
}

export interface DuoCoopLevelConfig {
  id: string
  name: string
  displayName: string
  description: string
  duration: number
  masterTarget: ClockTime
  slaveTarget: ClockTime
  toleranceMinutes: number
  scoreMultiplier: number
  interferences: DuoCoopInterferenceEvent[]
  syncTargets: DuoCoopSyncTarget[]
  sharedTimeDrift: number
  interferenceIntervalMs: number
}

export interface DuoCoopPlayerState {
  role: DuoCoopPlayerRole
  currentTime: ClockTime
  targetTime: ClockTime
  deviationMinutes: number
  isAligned: boolean
  driftAccumulator: number
  reboundCooldown: number
  fogActive: boolean
  magnetPullDir: number
  stutterActive: boolean
  lastOperationTime: number
  operationCount: number
}

export interface DuoCoopState {
  levelConfig: DuoCoopLevelConfig
  master: DuoCoopPlayerState
  slave: DuoCoopPlayerState
  activeInterferences: Array<DuoCoopInterferenceEvent & { expiresAt: number }>
  syncTargets: DuoCoopSyncTarget[]
  syncScore: number
  isCompleted: boolean
  isLocked: boolean
  allSynced: boolean
  totalDeviation: number
  lastInterferenceTime: number
  sharedDrift: number
}

export interface DuoCoopGameResult {
  success: boolean
  score: number
  timeLeft: number
  levelId: string
  masterDeviation: number
  slaveDeviation: number
  syncTargetsAchieved: number
  syncTargetsTotal: number
  interferencesHandled: number
  cooperationBonus: number
  totalDeviation: number
}
