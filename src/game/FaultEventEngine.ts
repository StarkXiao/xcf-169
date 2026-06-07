import type { GearFaultType } from '../types'
import type { LoadedFaultEvent } from './LevelLoader'

export interface ActiveFaultInstance {
  eventId: string
  gearId: number
  type: GearFaultType
  startedAt: number
  expiresAt: number
}

export interface FaultEngineStats {
  totalRotations: Map<number, number>
  currentDeviationMinutes: number
}

export type FaultTriggeredCallback = (eventId: string, gearId: number, type: GearFaultType, durationMs: number) => void
export type FaultClearedCallback = (eventId: string, gearId: number) => void

export class FaultEventEngine {
  private events: LoadedFaultEvent[] = []
  private activeFaults: ActiveFaultInstance[] = []
  private totalRotations: Map<number, number> = new Map()
  private currentDeviationMinutes = 0
  private startTime = 0
  private lastRandomCheck: Map<string, number> = new Map()
  private firedOnce: Set<string> = new Set()
  private onFaultTriggered?: FaultTriggeredCallback
  private onFaultCleared?: FaultClearedCallback

  setCallbacks(
    onFaultTriggered: FaultTriggeredCallback,
    onFaultCleared?: FaultClearedCallback,
  ): void {
    this.onFaultTriggered = onFaultTriggered
    this.onFaultCleared = onFaultCleared
  }

  loadEvents(events: LoadedFaultEvent[]): void {
    this.events = events.filter((e) => e.enabled)
    this.reset()
  }

  reset(): void {
    this.activeFaults = []
    this.totalRotations.clear()
    this.currentDeviationMinutes = 0
    this.startTime = performance.now()
    this.lastRandomCheck.clear()
    this.firedOnce.clear()
  }

  recordRotation(gearId: number): void {
    const current = this.totalRotations.get(gearId) ?? 0
    this.totalRotations.set(gearId, current + 1)
  }

  updateDeviation(deviationMinutes: number): void {
    this.currentDeviationMinutes = deviationMinutes
  }

  update(): void {
    const now = performance.now()
    const elapsed = (now - this.startTime) / 1000

    this.activeFaults = this.activeFaults.filter((fault) => {
      if (now >= fault.expiresAt) {
        this.onFaultCleared?.(fault.eventId, fault.gearId)
        return false
      }
      return true
    })

    this.events.forEach((event) => {
      if (this.firedOnce.has(event.id) && event.triggerType !== 'random') return
      if (!this.shouldTrigger(event, elapsed)) return

      event.targetGearIds.forEach((gearId) => {
        const alreadyActive = this.activeFaults.find(
          (f) => f.eventId === event.id && f.gearId === gearId,
        )
        if (alreadyActive) return

        const durationMs = event.duration * 1000
        const instance: ActiveFaultInstance = {
          eventId: event.id,
          gearId,
          type: event.type,
          startedAt: now,
          expiresAt: now + durationMs,
        }
        this.activeFaults.push(instance)
        this.onFaultTriggered?.(event.id, gearId, event.type, durationMs)
      })

      if (event.triggerType !== 'random') {
        this.firedOnce.add(event.id)
      }
    })
  }

  private shouldTrigger(event: LoadedFaultEvent, elapsedSeconds: number): boolean {
    switch (event.triggerType) {
      case 'time':
        return elapsedSeconds >= event.triggerValue
      case 'rotations': {
        const targetGearRotations = event.targetGearIds.reduce((sum, id) => {
          return sum + (this.totalRotations.get(id) ?? 0)
        }, 0)
        return targetGearRotations >= event.triggerValue
      }
      case 'deviation':
        return Math.abs(this.currentDeviationMinutes) >= event.triggerValue
      case 'random': {
        const lastCheck = this.lastRandomCheck.get(event.id) ?? 0
        if (elapsedSeconds - lastCheck < event.triggerValue) return false
        this.lastRandomCheck.set(event.id, elapsedSeconds)
        return Math.random() < 0.5
      }
      default:
        return false
    }
  }

  getActiveFaults(): ActiveFaultInstance[] {
    return [...this.activeFaults]
  }

  isGearFaulted(gearId: number): GearFaultType | 'none' {
    const fault = this.activeFaults.find((f) => f.gearId === gearId)
    return fault ? fault.type : 'none'
  }

  getStats(): FaultEngineStats {
    return {
      totalRotations: new Map(this.totalRotations),
      currentDeviationMinutes: this.currentDeviationMinutes,
    }
  }

  destroy(): void {
    this.activeFaults = []
    this.totalRotations.clear()
    this.lastRandomCheck.clear()
    this.firedOnce.clear()
  }
}
