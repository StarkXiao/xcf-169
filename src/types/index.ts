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
