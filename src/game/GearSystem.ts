import type { ClockTime, GearFaultType, WorkshopEffects } from '../types'
import type { NightPatrolSystem } from './NightPatrolSystem'

const SNAP_ANGLE = 45

export const GEAR_TIME_DELTAS = {
  large: 60,
  medium: 15,
  small: 5,
}

const DEFAULT_WORKSHOP_EFFECTS: WorkshopEffects = {
  efficiencyMultiplier: 1.0,
  toleranceMinutes: 0,
  faultResistanceChance: 0,
  showTargetHint: false,
  enhancedFeedback: false,
}

export interface GearConfig {
  id: number
  x: number
  y: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  initialAngle?: number
}

export interface RotationResult {
  applied: boolean
  skipped: boolean
  reversed: boolean
  slipped: boolean
  actualDelta: number
}

export class GearSystem {
  private gears: Map<number, {
    id: number
    angle: number
    size: 'large' | 'medium' | 'small'
    connectedTo: number[]
    timeDelta: number
  }> = new Map()

  private currentTime: ClockTime
  private targetTime: ClockTime
  private onGearRotate?: (gearId: number, angle: number) => void
  private onTimeChange?: (time: ClockTime) => void
  private onTargetReached?: () => void
  private onFaultTriggered?: (gearId: number, faultType: GearFaultType) => void
  private patrolSystem: NightPatrolSystem | null = null
  private isPatrolMode = false
  private workshopEffects: WorkshopEffects = DEFAULT_WORKSHOP_EFFECTS
  private gearFaults: Map<number, GearFaultType> = new Map()

  constructor(configs: GearConfig[]) {
    configs.forEach((config) => {
      const angle = config.initialAngle ?? Math.floor(Math.random() * 8) * SNAP_ANGLE
      this.gears.set(config.id, {
        id: config.id,
        angle,
        size: config.size,
        connectedTo: config.connectedTo,
        timeDelta: GEAR_TIME_DELTAS[config.size],
      })
    })

    this.currentTime = this.generateRandomTime()
    this.targetTime = this.generateTargetTime(this.currentTime)
  }

  setWorkshopEffects(effects: WorkshopEffects): void {
    this.workshopEffects = { ...effects }
  }

  getWorkshopEffects(): WorkshopEffects {
    return { ...this.workshopEffects }
  }

  setPatrolMode(patrolSystem: NightPatrolSystem | null): void {
    this.patrolSystem = patrolSystem
    this.isPatrolMode = !!patrolSystem
  }

  setOnFaultTriggered(callback: (gearId: number, faultType: GearFaultType) => void): void {
    this.onFaultTriggered = callback
  }

  regenerateTargetTimeForPatrol(): void {
    if (this.patrolSystem) {
      this.targetTime = this.patrolSystem.generateTargetTimeForPeriod(this.currentTime)
    }
  }

  private generateRandomTime(): ClockTime {
    const hours = Math.floor(Math.random() * 12) + 1
    const minutes = Math.floor(Math.random() * 12) * 5
    return { hours, minutes }
  }

  private generateTargetTime(current: ClockTime): ClockTime {
    const currentMinutes = current.hours * 60 + current.minutes
    let offset = 0
    while (Math.abs(offset) < 60) {
      offset = Math.floor(Math.random() * 480) - 240
    }
    let targetMinutes = (currentMinutes + offset + 720) % 720
    if (targetMinutes === 0) targetMinutes = 720
    const hours = Math.floor(targetMinutes / 60) || 12
    const minutes = targetMinutes % 60
    return { hours, minutes }
  }

  setOnGearRotate(callback: (gearId: number, angle: number) => void) {
    this.onGearRotate = callback
  }

  setOnTimeChange(callback: (time: ClockTime) => void) {
    this.onTimeChange = callback
  }

  setOnTargetReached(callback: () => void) {
    this.onTargetReached = callback
  }

  getCurrentTime(): ClockTime {
    return { ...this.currentTime }
  }

  getTargetTime(): ClockTime {
    return { ...this.targetTime }
  }

  setTargetTime(time: ClockTime): void {
    this.targetTime = { ...time }
  }

  setInitialTime(time: ClockTime): void {
    this.currentTime = { ...time }
    this.onTimeChange?.(this.currentTime)
  }

  setGearFault(gearId: number, faultType: GearFaultType): void {
    if (faultType === 'none') {
      this.gearFaults.delete(gearId)
    } else {
      this.gearFaults.set(gearId, faultType)
    }
  }

  getGearFault(gearId: number): GearFaultType {
    return this.gearFaults.get(gearId) ?? 'none'
  }

  getGear(id: number) {
    return this.gears.get(id)
  }

  getAllGears() {
    return Array.from(this.gears.values())
  }

  getGearsSnapshot(): { id: number; angle: number }[] {
    return Array.from(this.gears.values()).map((g) => ({ id: g.id, angle: g.angle }))
  }

  setGearAngleDirect(gearId: number, angle: number): boolean {
    const gear = this.gears.get(gearId)
    if (!gear) return false
    gear.angle = this.normalizeAngle(angle)
    this.onGearRotate?.(gearId, gear.angle)
    return true
  }

  rotateGear(gearId: number, direction: 1 | -1): RotationResult {
    const gear = this.gears.get(gearId)
    if (!gear) {
      return { applied: false, skipped: true, reversed: false, slipped: false, actualDelta: 0 }
    }

    let actualDirection = direction
    let skip = false
    let multiplier = 1
    let reversed = false
    let slipped = false
    const efficiency = this.workshopEffects.efficiencyMultiplier
    const faultResist = this.workshopEffects.faultResistanceChance

    const applyFaultEffect = (id: number, dir: 1 | -1): { direction: 1 | -1; skip: boolean; multiplier: number; faultType: GearFaultType } => {
      let resultDir = dir
      let resultSkip = false
      let resultMultiplier = 1
      let faultType: GearFaultType = 'none'

      if (this.patrolSystem && this.isPatrolMode) {
        faultType = this.patrolSystem.getGearFault(id)
      }
      if (faultType === 'none') {
        faultType = this.gearFaults.get(id) ?? 'none'
      }

      switch (faultType) {
        case 'jam':
          resultSkip = true
          break
        case 'slip':
          resultMultiplier = 0.5
          break
        case 'reverse':
          resultDir = (-dir) as 1 | -1
          break
        case 'freeze':
          resultSkip = true
          break
      }

      return { direction: resultDir, skip: resultSkip, multiplier: resultMultiplier, faultType }
    }

    const primaryFault = this.patrolSystem
      ? this.patrolSystem.getGearFault(gearId)
      : (this.gearFaults.get(gearId) ?? 'none')
    const hasPrimaryFault = primaryFault !== 'none'
    const resistedPrimary = hasPrimaryFault && Math.random() < faultResist

    if (!resistedPrimary && hasPrimaryFault) {
      const effect = applyFaultEffect(gearId, direction)
      actualDirection = effect.direction
      skip = effect.skip
      multiplier = effect.multiplier
      if (effect.faultType === 'reverse') reversed = true
      if (effect.faultType === 'slip') slipped = true
      this.onFaultTriggered?.(gearId, effect.faultType)
    } else if (!hasPrimaryFault) {
      const effect = applyFaultEffect(gearId, direction)
      if (effect.faultType !== 'none') {
        actualDirection = effect.direction
        skip = effect.skip
        multiplier = effect.multiplier
        if (effect.faultType === 'reverse') reversed = true
        if (effect.faultType === 'slip') slipped = true
        this.onFaultTriggered?.(gearId, effect.faultType)
      }
    }

    if (skip) {
      return { applied: false, skipped: true, reversed, slipped, actualDelta: 0 }
    }

    const delta = SNAP_ANGLE * actualDirection
    gear.angle = this.normalizeAngle(gear.angle + delta)
    this.onGearRotate?.(gearId, gear.angle)

    const timeDelta = gear.timeDelta * actualDirection * multiplier * efficiency
    const finalTimeDelta = multiplier < 1
      ? (Math.random() < multiplier ? timeDelta / multiplier : 0)
      : timeDelta
    this.advanceTime(Math.round(finalTimeDelta))

    gear.connectedTo.forEach((connectedId) => {
      const connected = this.gears.get(connectedId)
      if (connected) {
        let connDirection = (-actualDirection) as 1 | -1
        let connSkip = false
        let connMultiplier = 1

        const connFault = this.patrolSystem && this.isPatrolMode
          ? this.patrolSystem.getGearFault(connectedId)
          : (this.gearFaults.get(connectedId) ?? 'none')
        const connHasFault = connFault !== 'none'
        const connResisted = connHasFault && Math.random() < faultResist

        if (!connResisted && connHasFault) {
          const connEffect = applyFaultEffect(connectedId, connDirection)
          connDirection = connEffect.direction
          connSkip = connEffect.skip
          connMultiplier = connEffect.multiplier
          if (connEffect.faultType !== 'none') {
            this.onFaultTriggered?.(connectedId, connEffect.faultType)
          }
        } else if (!connHasFault) {
          const connEffect = applyFaultEffect(connectedId, connDirection)
          if (connEffect.faultType !== 'none') {
            connDirection = connEffect.direction
            connSkip = connEffect.skip
            connMultiplier = connEffect.multiplier
            this.onFaultTriggered?.(connectedId, connEffect.faultType)
          }
        }

        if (!connSkip) {
          const reverseDelta = SNAP_ANGLE * connDirection
          connected.angle = this.normalizeAngle(connected.angle + reverseDelta)
          this.onGearRotate?.(connectedId, connected.angle)

          const connTimeDelta = connected.timeDelta * connDirection * connMultiplier * efficiency
          const finalConnTimeDelta = connMultiplier < 1
            ? (Math.random() < connMultiplier ? connTimeDelta / connMultiplier : 0)
            : connTimeDelta
          this.advanceTime(Math.round(finalConnTimeDelta))
        }
      }
    })

    if (this.checkTargetReached()) {
      this.onTargetReached?.()
    }

    return {
      applied: true,
      skipped: false,
      reversed,
      slipped,
      actualDelta: gear.timeDelta * actualDirection * efficiency,
    }
  }

  private advanceTime(minutes: number): void {
    if (minutes === 0) return
    let totalMinutes = this.currentTime.hours * 60 + this.currentTime.minutes
    totalMinutes += minutes
    totalMinutes = ((totalMinutes % 720) + 720) % 720
    if (totalMinutes === 0) totalMinutes = 720

    const hours = Math.floor(totalMinutes / 60) || 12
    const mins = totalMinutes % 60

    this.currentTime = { hours, minutes: mins }
    this.onTimeChange?.(this.currentTime)
  }

  checkTargetReached(): boolean {
    const diff = this.getTimeDiffMinutes()
    return diff <= this.workshopEffects.toleranceMinutes
  }

  getTimeDiffMinutes(): number {
    const curr = this.currentTime.hours * 60 + this.currentTime.minutes
    const tgt = this.targetTime.hours * 60 + this.targetTime.minutes
    let diff = Math.abs(curr - tgt)
    if (diff > 360) diff = 720 - diff
    return diff
  }

  getToleranceMinutes(): number {
    return this.workshopEffects.toleranceMinutes
  }

  private normalizeAngle(angle: number): number {
    let result = angle % 360
    if (result < 0) result += 360
    return result
  }

  formatTime(time: ClockTime): string {
    return `${time.hours}:${time.minutes.toString().padStart(2, '0')}`
  }
}
