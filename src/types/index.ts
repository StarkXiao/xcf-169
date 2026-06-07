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

export type GameMode = 'classic' | 'patrol'

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
