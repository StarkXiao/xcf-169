import type {
  WeatherEvent,
  WeatherEventType,
  ActiveWeather,
  WeatherEventEffect,
} from '../../types/roguelike'
import type { ClockTime } from '../../types'

export const WEATHER_EVENTS: Record<WeatherEventType, WeatherEvent & {
  pulseIntervalMs?: number
  pulseChance?: number
}> = {
  timewarp: {
    id: 'timewarp',
    name: '时空扭曲',
    displayName: '时空扭曲',
    description: '时间流速异常，操作齿轮的效果被大幅放大！',
    icon: '🌀',
    duration: 20,
    effect: { type: 'speedMultiplier', value: 2.0 },
    triggerChance: 0.3,
    durationMs: 20000,
    severity: 'medium',
  },
  clockPhantom: {
    id: 'clockPhantom',
    name: '时钟幻影',
    displayName: '时钟幻影',
    description: '过去的残像干扰着你的感知，目标时间不断飘移...',
    icon: '👻',
    duration: 25,
    effect: { type: 'targetShift', value: 25 },
    triggerChance: 0.25,
    durationMs: 25000,
    severity: 'high',
    pulseIntervalMs: 4000,
    pulseChance: 0.7,
  },
  cursedWind: {
    id: 'cursedWind',
    name: '诅咒之风',
    displayName: '诅咒之风',
    description: '阴风从钟楼缝隙钻入，操作方向偶尔反转！',
    icon: '💨',
    duration: 18,
    effect: { type: 'reverseControls', value: 0.35 },
    triggerChance: 0.3,
    durationMs: 18000,
    severity: 'medium',
  },
  ironRain: {
    id: 'ironRain',
    name: '铁屑之雨',
    displayName: '铁屑之雨',
    description: '金属碎屑从天而降，齿轮极易发生故障！',
    icon: '🌧️',
    duration: 22,
    effect: { type: 'faultChance', value: 0.45 },
    triggerChance: 0.35,
    durationMs: 22000,
    severity: 'medium',
    pulseIntervalMs: 5000,
    pulseChance: 0.35,
  },
  thunderRumble: {
    id: 'thunderRumble',
    name: '惊雷轰鸣',
    displayName: '惊雷轰鸣',
    description: '雷声震耳欲聋，每一次轰鸣都会打乱齿轮的位置！',
    icon: '⚡',
    duration: 15,
    effect: { type: 'timeChange', value: 20 },
    triggerChance: 0.28,
    durationMs: 15000,
    severity: 'high',
    pulseIntervalMs: 3500,
    pulseChance: 0.8,
  },
  mirrorShard: {
    id: 'mirrorShard',
    name: '镜像碎片',
    displayName: '镜像碎片',
    description: '散落的时间碎片产生镜像效果，得分被大幅削减！',
    icon: '🪞',
    duration: 20,
    effect: { type: 'scorePenalty', value: 0.5 },
    triggerChance: 0.32,
    durationMs: 20000,
    severity: 'low',
  },
  lostSecond: {
    id: 'lostSecond',
    name: '遗失之秒',
    displayName: '遗失之秒',
    description: '时间变得断断续续，你的反应被严重干扰，故障频发！',
    icon: '⏳',
    duration: 18,
    effect: { type: 'faultChance', value: 0.4 },
    triggerChance: 0.3,
    durationMs: 18000,
    severity: 'medium',
    pulseIntervalMs: 4500,
    pulseChance: 0.4,
  },
}

export interface WeatherPulseEvent {
  weatherId: WeatherEventType
  type: 'targetShift' | 'timeJump' | 'faultTrigger'
  value: number
  timestamp: number
}

export interface WeatherSystemCallbacks {
  onWeatherPulse?: (event: WeatherPulseEvent) => void
  onWeatherStart?: (weatherId: WeatherEventType) => void
  onWeatherEnd?: (weatherId: WeatherEventType) => void
}

export class WeatherEventSystem {
  private activeWeathers: ActiveWeather[] = []
  private weatherHistory: WeatherEventType[] = []
  private totalEncountered = 0
  private callbacks: WeatherSystemCallbacks = {}

  private lastPulseTimestamps: Map<WeatherEventType, number> = new Map()
  private totalPulses = 0

  constructor(callbacks: WeatherSystemCallbacks = {}) {
    this.callbacks = callbacks
  }

  setCallbacks(callbacks: WeatherSystemCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  getActiveWeathers(): ActiveWeather[] {
    return [...this.activeWeathers]
  }

  getWeatherHistory(): WeatherEventType[] {
    return [...this.weatherHistory]
  }

  getTotalEncountered(): number {
    return this.totalEncountered
  }

  getTotalPulses(): number {
    return this.totalPulses
  }

  isWeatherActive(weatherId: WeatherEventType): boolean {
    const now = performance.now()
    return this.activeWeathers.some(
      (w) => w.weatherId === weatherId && w.expiresAt > now,
    )
  }

  triggerWeather(weatherId: WeatherEventType): ActiveWeather | null {
    const config = WEATHER_EVENTS[weatherId]
    if (!config) return null

    const now = performance.now()
    const existing = this.activeWeathers.find((w) => w.weatherId === weatherId)
    if (existing) {
      existing.expiresAt = now + config.durationMs
      return existing
    }

    const active: ActiveWeather = {
      weatherId,
      startAt: now,
      expiresAt: now + config.durationMs,
      effectValue: config.effect.value,
    }

    this.activeWeathers.push(active)
    this.weatherHistory.push(weatherId)
    this.totalEncountered++
    this.lastPulseTimestamps.set(weatherId, now)

    this.callbacks.onWeatherStart?.(weatherId)
    return active
  }

  clearWeather(weatherId: WeatherEventType): boolean {
    const index = this.activeWeathers.findIndex((w) => w.weatherId === weatherId)
    if (index >= 0) {
      this.activeWeathers.splice(index, 1)
      this.lastPulseTimestamps.delete(weatherId)
      this.callbacks.onWeatherEnd?.(weatherId)
      return true
    }
    return false
  }

  clearAllWeathers(): void {
    const cleared = this.activeWeathers.map((w) => w.weatherId)
    this.activeWeathers = []
    this.lastPulseTimestamps.clear()
    cleared.forEach((id) => this.callbacks.onWeatherEnd?.(id))
  }

  expireWeathers(): WeatherEventType[] {
    const now = performance.now()
    const expired: WeatherEventType[] = []
    this.activeWeathers = this.activeWeathers.filter((w) => {
      if (w.expiresAt <= now) {
        expired.push(w.weatherId)
        this.lastPulseTimestamps.delete(w.weatherId)
        this.callbacks.onWeatherEnd?.(w.weatherId)
        return false
      }
      return true
    })
    return expired
  }

  update(_deltaMs: number): WeatherPulseEvent[] {
    if (this.activeWeathers.length === 0) return []

    const now = performance.now()
    const pulses: WeatherPulseEvent[] = []

    this.activeWeathers.forEach((active) => {
      const config = WEATHER_EVENTS[active.weatherId]
      if (!config || !config.pulseIntervalMs) return

      const lastPulse = this.lastPulseTimestamps.get(active.weatherId) || active.startAt
      const elapsed = now - lastPulse

      if (elapsed >= config.pulseIntervalMs) {
        const chance = config.pulseChance ?? 0.5
        if (Math.random() < chance) {
          const pulseEvent = this.createPulseEvent(active.weatherId, config.effect, now)
          if (pulseEvent) {
            pulses.push(pulseEvent)
            this.totalPulses++
            this.callbacks.onWeatherPulse?.(pulseEvent)
          }
        }
        this.lastPulseTimestamps.set(active.weatherId, now)
      }
    })

    return pulses
  }

  private createPulseEvent(
    weatherId: WeatherEventType,
    effect: WeatherEventEffect,
    now: number,
  ): WeatherPulseEvent | null {
    switch (effect.type) {
      case 'targetShift':
        return {
          weatherId,
          type: 'targetShift',
          value: effect.value,
          timestamp: now,
        }
      case 'timeChange':
        return {
          weatherId,
          type: 'timeJump',
          value: effect.value,
          timestamp: now,
        }
      case 'faultChance':
        return {
          weatherId,
          type: 'faultTrigger',
          value: 1,
          timestamp: now,
        }
      default:
        return null
    }
  }

  getAggregatedEffects(): {
    speedMultiplier: number
    scorePenalty: number
    faultChanceBonus: number
    reverseControlChance: number
    targetShiftAmount: number
    timeJumpAmount: number
  } {
    const effects = {
      speedMultiplier: 1,
      scorePenalty: 0,
      faultChanceBonus: 0,
      reverseControlChance: 0,
      targetShiftAmount: 0,
      timeJumpAmount: 0,
    }

    this.activeWeathers.forEach((active) => {
      const config = WEATHER_EVENTS[active.weatherId]
      if (!config) return

      switch (config.effect.type) {
        case 'speedMultiplier':
          effects.speedMultiplier *= config.effect.value
          break
        case 'scorePenalty':
          effects.scorePenalty += config.effect.value
          break
        case 'faultChance':
          effects.faultChanceBonus += config.effect.value
          break
        case 'reverseControls':
          effects.reverseControlChance = Math.max(
            effects.reverseControlChance,
            config.effect.value,
          )
          break
        case 'targetShift':
          effects.targetShiftAmount = Math.max(
            effects.targetShiftAmount,
            config.effect.value,
          )
          break
        case 'timeChange':
          effects.timeJumpAmount = Math.max(
            effects.timeJumpAmount,
            config.effect.value,
          )
          break
      }
    })

    return effects
  }

  applySpeedMultiplier(baseDelta: number): number {
    const effects = this.getAggregatedEffects()
    return baseDelta * effects.speedMultiplier
  }

  applyScorePenalty(baseScore: number): number {
    const effects = this.getAggregatedEffects()
    const multiplier = Math.max(0.1, 1 - effects.scorePenalty)
    return Math.floor(baseScore * multiplier)
  }

  shouldTriggerRandomFault(baseChance: number): boolean {
    const effects = this.getAggregatedEffects()
    return Math.random() < baseChance + effects.faultChanceBonus
  }

  shouldReverseControls(): boolean {
    const effects = this.getAggregatedEffects()
    return Math.random() < effects.reverseControlChance
  }

  generateTargetShift(baseTarget: ClockTime, shiftAmount: number): ClockTime {
    const direction = Math.random() > 0.5 ? 1 : -1
    const shift = Math.floor(Math.random() * shiftAmount * 0.8 + shiftAmount * 0.2) * direction
    const targetMin = baseTarget.hours * 60 + baseTarget.minutes
    let newMin = (targetMin + shift + 720) % 720
    if (newMin === 0) newMin = 720
    return {
      hours: Math.floor(newMin / 60) || 12,
      minutes: newMin % 60,
    }
  }

  generateTimeJump(baseTime: ClockTime, jumpAmount: number): ClockTime {
    const direction = Math.random() > 0.5 ? 1 : -1
    const jump = Math.floor(Math.random() * jumpAmount) * direction
    const currentMin = baseTime.hours * 60 + baseTime.minutes
    let newMin = (currentMin + jump + 720) % 720
    if (newMin === 0) newMin = 720
    return {
      hours: Math.floor(newMin / 60) || 12,
      minutes: newMin % 60,
    }
  }

  getWeatherRemainingMs(weatherId: WeatherEventType): number {
    const active = this.activeWeathers.find((w) => w.weatherId === weatherId)
    if (!active) return 0
    return Math.max(0, active.expiresAt - performance.now())
  }

  getWeatherProgress(weatherId: WeatherEventType): number {
    const active = this.activeWeathers.find((w) => w.weatherId === weatherId)
    if (!active) return 0
    const config = WEATHER_EVENTS[weatherId]
    const elapsed = performance.now() - active.startAt
    return Math.min(1, Math.max(0, elapsed / config.durationMs))
  }

  getActiveWeatherConfigs(): WeatherEvent[] {
    return this.activeWeathers
      .map((w) => WEATHER_EVENTS[w.weatherId])
      .filter(Boolean) as WeatherEvent[]
  }

  reset(): void {
    const cleared = this.activeWeathers.map((w) => w.weatherId)
    this.activeWeathers = []
    this.weatherHistory = []
    this.totalEncountered = 0
    this.totalPulses = 0
    this.lastPulseTimestamps.clear()
    cleared.forEach((id) => this.callbacks.onWeatherEnd?.(id))
  }
}

export function getWeatherEventConfig(weatherId: WeatherEventType): WeatherEvent | undefined {
  return WEATHER_EVENTS[weatherId]
}

export function getWeatherSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return '#4ade80'
    case 'medium':
      return '#fbbf24'
    case 'high':
      return '#ef4444'
    default:
      return '#60a5fa'
  }
}

export function getWeatherSeverityLabel(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return '轻度'
    case 'medium':
      return '中度'
    case 'high':
      return '严重'
    default:
      return '未知'
  }
}

export function getEffectDescription(effect: WeatherEventEffect): string {
  switch (effect.type) {
    case 'speedMultiplier':
      return `操作效果 ×${effect.value}`
    case 'scorePenalty':
      return `得分 -${Math.floor(effect.value * 100)}%`
    case 'timeChange':
      return `齿轮跳动 ±${effect.value}分钟`
    case 'faultChance':
      return `故障几率 +${Math.floor(effect.value * 100)}%`
    case 'targetShift':
      return `目标飘移 ±${effect.value}分钟`
    case 'reverseControls':
      return `${Math.floor(effect.value * 100)}%几率反转`
    default:
      return '未知效果'
  }
}
