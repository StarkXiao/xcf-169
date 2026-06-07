import type { GearConfig } from './GearSystem'
import type {
  EditorLevelConfig,
  EditorGearConfig,
  ClockTime,
  GameMode,
  PeriodConfig,
  SoundEvent,
} from '../types'

export interface LoadedLevel {
  id: string
  name: string
  displayName: string
  description: string
  gameMode: GameMode
  duration: number
  gears: GearConfig[]
  initialClockTime: ClockTime
  targetClockTime: ClockTime
  toleranceMinutes: number
  scoreMultiplier: number
  patrolPeriods?: PeriodConfig[]
  faultEvents: LoadedFaultEvent[]
  soundConfigs: Record<SoundEvent, LoadedSoundConfig>
  createdAt: number
  updatedAt: number
}

export interface LoadedFaultEvent {
  id: string
  name: string
  enabled: boolean
  type: 'jam' | 'slip' | 'reverse' | 'freeze'
  triggerType: 'time' | 'rotations' | 'deviation' | 'random'
  triggerValue: number
  duration: number
  targetGearIds: number[]
}

export interface LoadedSoundConfig {
  event: SoundEvent
  enabled: boolean
  frequency: number
  waveform: OscillatorType
  duration: number
  volume: number
}

const EDITOR_CANVAS_W = 600
const EDITOR_CANVAS_H = 450

export function editorGearToGameGear(editorGear: EditorGearConfig): GearConfig {
  let x = editorGear.x
  let y = editorGear.y
  if (x > 1.5) x = x / EDITOR_CANVAS_W
  if (y > 1.5) y = y / EDITOR_CANVAS_H
  x = Math.max(0.05, Math.min(0.95, x))
  y = Math.max(0.1, Math.min(0.9, y))
  return {
    id: editorGear.id,
    x,
    y,
    size: editorGear.size,
    connectedTo: editorGear.connectedTo,
  }
}

export function loadEditorLevel(raw: unknown): LoadedLevel {
  if (!raw || typeof raw !== 'object') {
    throw new Error('无效的关卡数据格式')
  }

  const data = raw as EditorLevelConfig

  if (!data.gears || !Array.isArray(data.gears) || data.gears.length === 0) {
    throw new Error('关卡缺少齿轮配置')
  }

  const gears: GearConfig[] = data.gears.map(editorGearToGameGear)

  const defaultSoundConfigs: Record<SoundEvent, LoadedSoundConfig> = {
    gear_click: {
      event: 'gear_click', enabled: true, frequency: 440, waveform: 'sine', duration: 0.08, volume: 0.25,
    },
    fault_occur: {
      event: 'fault_occur', enabled: true, frequency: 200, waveform: 'square', duration: 0.3, volume: 0.35,
    },
    fault_clear: {
      event: 'fault_clear', enabled: true, frequency: 520, waveform: 'sine', duration: 0.2, volume: 0.3,
    },
    time_aligned: {
      event: 'time_aligned', enabled: true, frequency: 660, waveform: 'sine', duration: 0.4, volume: 0.4,
    },
    level_success: {
      event: 'level_success', enabled: true, frequency: 880, waveform: 'sine', duration: 0.6, volume: 0.5,
    },
    level_fail: {
      event: 'level_fail', enabled: true, frequency: 150, waveform: 'sawtooth', duration: 0.5, volume: 0.4,
    },
    weather_change: {
      event: 'weather_change', enabled: true, frequency: 300, waveform: 'triangle', duration: 0.25, volume: 0.2,
    },
    period_transition: {
      event: 'period_transition', enabled: true, frequency: 380, waveform: 'sine', duration: 0.5, volume: 0.3,
    },
    alarm_ring: {
      event: 'alarm_ring', enabled: true, frequency: 700, waveform: 'square', duration: 0.15, volume: 0.4,
    },
    tower_align: {
      event: 'tower_align', enabled: true, frequency: 780, waveform: 'sine', duration: 0.3, volume: 0.35,
    },
  }

  const soundConfigs: Record<SoundEvent, LoadedSoundConfig> = { ...defaultSoundConfigs }
  if (data.soundConfigs && Array.isArray(data.soundConfigs)) {
    data.soundConfigs.forEach((sc) => {
      soundConfigs[sc.event] = {
        event: sc.event,
        enabled: sc.enabled,
        frequency: sc.frequency,
        waveform: sc.waveform,
        duration: sc.duration,
        volume: sc.volume,
      }
    })
  }

  const faultEvents: LoadedFaultEvent[] = (data.faultEvents || [])
    .filter((fe) => fe.enabled)
    .map((fe) => ({
      id: fe.id,
      name: fe.name,
      enabled: fe.enabled,
      type: fe.type,
      triggerType: fe.triggerType,
      triggerValue: fe.triggerValue,
      duration: fe.duration,
      targetGearIds: fe.targetGearIds,
    }))

  return {
    id: data.id || 'custom_level',
    name: data.name || 'custom_level',
    displayName: data.displayName || '自定义关卡',
    description: data.description || '',
    gameMode: data.gameMode || 'classic',
    duration: data.duration || 120,
    gears,
    initialClockTime: data.initialClockTime || { hours: 12, minutes: 0 },
    targetClockTime: data.targetClockTime || { hours: 6, minutes: 30 },
    toleranceMinutes: data.toleranceMinutes ?? 2,
    scoreMultiplier: data.scoreMultiplier || 1,
    patrolPeriods: data.patrolPeriods,
    faultEvents,
    soundConfigs,
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now(),
  }
}

export function validateLevel(level: LoadedLevel): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!level.gears || level.gears.length === 0) {
    errors.push('至少需要一个齿轮')
  }

  if (level.gears.length > 0) {
    const ids = new Set<number>()
    level.gears.forEach((g) => {
      if (ids.has(g.id)) {
        errors.push(`齿轮ID重复：${g.id}`)
      }
      ids.add(g.id)
      g.connectedTo.forEach((cid) => {
        if (!ids.has(cid) && !level.gears.find((gg) => gg.id === cid)) {
          errors.push(`齿轮 ${g.id} 的连接目标 ${cid} 不存在`)
        }
      })
    })
  }

  if (level.toleranceMinutes < 0) {
    errors.push('容差时间不能为负数')
  }

  if (level.duration <= 0) {
    errors.push('关卡时长必须大于0')
  }

  return { valid: errors.length === 0, errors }
}

const CUSTOM_LEVEL_STORAGE_KEY = 'clock_tower_custom_level'

export function saveCustomLevelToStorage(level: LoadedLevel): void {
  try {
    localStorage.setItem(CUSTOM_LEVEL_STORAGE_KEY, JSON.stringify(level))
  } catch (e) {
    console.warn('保存自定义关卡失败', e)
  }
}

export function loadCustomLevelFromStorage(): LoadedLevel | null {
  try {
    const raw = localStorage.getItem(CUSTOM_LEVEL_STORAGE_KEY)
    if (!raw) return null
    return loadEditorLevel(JSON.parse(raw))
  } catch (e) {
    console.warn('加载自定义关卡失败', e)
    return null
  }
}

export function clearCustomLevelStorage(): void {
  try {
    localStorage.removeItem(CUSTOM_LEVEL_STORAGE_KEY)
  } catch (e) {
    console.warn('清除自定义关卡失败', e)
  }
}
