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

export type EditorSoundEventType =
  | 'gearRotate'
  | 'gearSnap'
  | 'gearFault'
  | 'alignSuccess'
  | 'bellChime'
  | 'thunder'
  | 'tick'
  | 'periodTransition'
  | 'gameOverSuccess'
  | 'gameOverFail'

export interface EditorSoundConfig {
  eventType: EditorSoundEventType
  enabled: boolean
  frequency?: number
  waveform?: OscillatorType
  duration?: number
  volume?: number
  customLabel?: string
}

export type EditorFaultTriggerCondition =
  | 'timeElapsed'
  | 'rotationsCount'
  | 'deviationExceeded'
  | 'randomInterval'

export interface EditorFaultEvent {
  id: string
  name: string
  displayName: string
  faultType: GearFaultType
  triggerCondition: EditorFaultTriggerCondition
  triggerValue: number
  targetGearIds: number[]
  durationSeconds: number
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
