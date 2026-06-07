import type {
  PeriodConfig,
  WeatherState,
  ActiveGearFault,
  GearFaultType,
  PatrolScoreBreakdown,
  ClockTime,
} from '../types'

export const NIGHT_PERIODS: PeriodConfig[] = [
  {
    id: 'dusk',
    name: '黄昏',
    displayName: '黄昏巡夜',
    clockTime: '19:00-21:00',
    duration: 60,
    weather: {
      rain: 'light',
      wind: 'light',
      lightning: 'calm',
    },
    possibleFaults: ['slip'],
    faultCount: 1,
    scoreMultiplier: 1.0,
    targetOffset: 120,
  },
  {
    id: 'earlyNight',
    name: '初夜',
    displayName: '初夜巡夜',
    clockTime: '21:00-23:00',
    duration: 75,
    weather: {
      rain: 'moderate',
      wind: 'moderate',
      lightning: 'light',
    },
    possibleFaults: ['slip', 'jam'],
    faultCount: 2,
    scoreMultiplier: 1.3,
    targetOffset: 180,
  },
  {
    id: 'deepNight',
    name: '深夜',
    displayName: '深夜巡夜',
    clockTime: '23:00-01:00',
    duration: 90,
    weather: {
      rain: 'heavy',
      wind: 'heavy',
      lightning: 'moderate',
    },
    possibleFaults: ['slip', 'jam', 'reverse'],
    faultCount: 2,
    scoreMultiplier: 1.6,
    targetOffset: 240,
  },
  {
    id: 'dawn',
    name: '黎明',
    displayName: '黎明巡夜',
    clockTime: '01:00-03:00',
    duration: 100,
    weather: {
      rain: 'storm',
      wind: 'storm',
      lightning: 'heavy',
    },
    possibleFaults: ['slip', 'jam', 'reverse', 'freeze'],
    faultCount: 3,
    scoreMultiplier: 2.0,
    targetOffset: 300,
  },
]

export const FAULT_DESCRIPTIONS: Record<GearFaultType, string> = {
  none: '正常',
  jam: '卡滞',
  slip: '打滑',
  reverse: '反转',
  freeze: '冻结',
}

export const WEATHER_DESCRIPTIONS: Record<string, string> = {
  calm: '无风无雨',
  light: '小雨微风',
  moderate: '中雨中风',
  heavy: '大雨大风',
  storm: '狂风暴雨',
}

export interface NightPatrolCallbacks {
  onPeriodChange?: (period: PeriodConfig) => void
  onWeatherChange?: (weather: WeatherState) => void
  onFaultsChange?: (faults: ActiveGearFault[]) => void
  onAllPeriodsComplete?: () => void
  onPeriodFailed?: () => void
}

export class NightPatrolSystem {
  private currentPeriodIndex = 0
  private activeFaults: ActiveGearFault[] = []
  private callbacks: NightPatrolCallbacks
  private periodsCleared = 0
  private totalFaultPenalty = 0
  private totalBaseScore = 0
  private totalAccuracyBonus = 0
  private totalTimeBonus = 0
  private totalPeriodBonus = 0
  private gearIds: number[] = []

  constructor(gearIds: number[], callbacks: NightPatrolCallbacks = {}) {
    this.gearIds = gearIds
    this.callbacks = callbacks
  }

  getCurrentPeriod(): PeriodConfig {
    return NIGHT_PERIODS[this.currentPeriodIndex]
  }

  getPeriodIndex(): number {
    return this.currentPeriodIndex
  }

  getTotalPeriods(): number {
    return NIGHT_PERIODS.length
  }

  getPeriodsCleared(): number {
    return this.periodsCleared
  }

  getWeather(): WeatherState {
    return this.getCurrentPeriod().weather
  }

  getActiveFaults(): ActiveGearFault[] {
    return [...this.activeFaults]
  }

  getGearFault(gearId: number): GearFaultType {
    const now = performance.now()
    const fault = this.activeFaults.find(f => f.gearId === gearId && f.expiresAt > now)
    return fault?.type ?? 'none'
  }

  isFaultActive(gearId: number): boolean {
    return this.getGearFault(gearId) !== 'none'
  }

  generateFaults(): ActiveGearFault[] {
    const period = this.getCurrentPeriod()
    const faults: ActiveGearFault[] = []
    const availableGearIds = [...this.gearIds]
    const now = performance.now()
    const faultDuration = period.duration * 1000 * 0.6

    for (let i = 0; i < period.faultCount && availableGearIds.length > 0; i++) {
      const gearIndex = Math.floor(Math.random() * availableGearIds.length)
      const gearId = availableGearIds.splice(gearIndex, 1)[0]
      const faultType = period.possibleFaults[
        Math.floor(Math.random() * period.possibleFaults.length)
      ]
      faults.push({
        gearId,
        type: faultType,
        expiresAt: now + faultDuration,
      })
    }

    this.activeFaults = faults
    this.callbacks.onFaultsChange?.(faults)
    return faults
  }

  clearAllFaults(): void {
    this.activeFaults = []
    this.callbacks.onFaultsChange?.([])
  }

  applyFaultEffect(gearId: number, direction: 1 | -1): { direction: 1 | -1; skip: boolean; multiplier: number } {
    const fault = this.getGearFault(gearId)
    switch (fault) {
      case 'freeze':
      case 'jam':
        return { direction, skip: true, multiplier: 1 }
      case 'reverse':
        return { direction: (direction * -1) as 1 | -1, skip: false, multiplier: 1 }
      case 'slip':
        return { direction, skip: false, multiplier: 0.5 }
      default:
        return { direction, skip: false, multiplier: 1 }
    }
  }

  addFaultPenalty(amount: number): void {
    this.totalFaultPenalty += amount
  }

  accumulatePeriodScore(
    baseScore: number,
    accuracyBonus: number,
    timeBonus: number,
    periodBonus: number,
  ): void {
    const multiplier = this.getCurrentPeriod().scoreMultiplier
    this.totalBaseScore += baseScore * multiplier
    this.totalAccuracyBonus += accuracyBonus * multiplier
    this.totalTimeBonus += timeBonus * multiplier
    this.totalPeriodBonus += periodBonus
    this.periodsCleared++
  }

  getScoreBreakdown(): PatrolScoreBreakdown {
    const total = Math.max(
      0,
      Math.floor(
        this.totalBaseScore +
        this.totalAccuracyBonus +
        this.totalTimeBonus +
        this.totalPeriodBonus -
        this.totalFaultPenalty,
      ),
    )
    return {
      baseScore: Math.floor(this.totalBaseScore),
      accuracyBonus: Math.floor(this.totalAccuracyBonus),
      timeBonus: Math.floor(this.totalTimeBonus),
      periodBonus: Math.floor(this.totalPeriodBonus),
      faultPenalty: Math.floor(this.totalFaultPenalty),
      total,
    }
  }

  advanceToNextPeriod(): boolean {
    if (this.currentPeriodIndex >= NIGHT_PERIODS.length - 1) {
      this.callbacks.onAllPeriodsComplete?.()
      return false
    }
    this.currentPeriodIndex++
    this.clearAllFaults()
    const nextPeriod = this.getCurrentPeriod()
    this.callbacks.onPeriodChange?.(nextPeriod)
    this.callbacks.onWeatherChange?.(nextPeriod.weather)
    return true
  }

  reset(): void {
    this.currentPeriodIndex = 0
    this.activeFaults = []
    this.periodsCleared = 0
    this.totalFaultPenalty = 0
    this.totalBaseScore = 0
    this.totalAccuracyBonus = 0
    this.totalTimeBonus = 0
    this.totalPeriodBonus = 0
  }

  generateTargetTimeForPeriod(currentTime: ClockTime): ClockTime {
    const period = this.getCurrentPeriod()
    const currentMinutes = currentTime.hours * 60 + currentTime.minutes
    let offset = 0
    while (Math.abs(offset) < Math.min(60, period.targetOffset / 2)) {
      offset = Math.floor(Math.random() * period.targetOffset * 2) - period.targetOffset
    }
    let targetMinutes = (currentMinutes + offset + 720) % 720
    if (targetMinutes === 0) targetMinutes = 720
    const hours = Math.floor(targetMinutes / 60) || 12
    const minutes = targetMinutes % 60
    return { hours, minutes }
  }
}
