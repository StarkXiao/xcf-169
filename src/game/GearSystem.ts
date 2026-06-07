import type { ClockTime } from '../types'

const SNAP_ANGLE = 45

export const GEAR_TIME_DELTAS = {
  large: 60,
  medium: 15,
  small: 5,
}

export interface GearConfig {
  id: number
  x: number
  y: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  initialAngle?: number
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

  getGear(id: number) {
    return this.gears.get(id)
  }

  getAllGears() {
    return Array.from(this.gears.values())
  }

  rotateGear(gearId: number, direction: 1 | -1): void {
    const gear = this.gears.get(gearId)
    if (!gear) return

    const delta = SNAP_ANGLE * direction
    gear.angle = this.normalizeAngle(gear.angle + delta)
    this.onGearRotate?.(gearId, gear.angle)

    this.advanceTime(gear.timeDelta * direction)

    gear.connectedTo.forEach((connectedId) => {
      const connected = this.gears.get(connectedId)
      if (connected) {
        const reverseDelta = -delta
        connected.angle = this.normalizeAngle(connected.angle + reverseDelta)
        this.onGearRotate?.(connectedId, connected.angle)
        this.advanceTime(connected.timeDelta * -direction)
      }
    })

    if (this.checkTargetReached()) {
      this.onTargetReached?.()
    }
  }

  private advanceTime(minutes: number): void {
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
    return (
      this.currentTime.hours === this.targetTime.hours &&
      this.currentTime.minutes === this.targetTime.minutes
    )
  }

  getTimeDiffMinutes(): number {
    const curr = this.currentTime.hours * 60 + this.currentTime.minutes
    const tgt = this.targetTime.hours * 60 + this.targetTime.minutes
    let diff = Math.abs(curr - tgt)
    if (diff > 360) diff = 720 - diff
    return diff
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
