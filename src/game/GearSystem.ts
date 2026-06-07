import type { GearState } from '../types'

const TOLERANCE = 8
const SNAP_ANGLE = 45

export interface GearConfig {
  id: number
  x: number
  y: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  initialAngle?: number
}

export class GearSystem {
  private gears: Map<number, GearState> = new Map()
  private onGearRotate?: (gearId: number, angle: number) => void
  private onAllAligned?: () => void

  constructor(configs: GearConfig[]) {
    configs.forEach((config) => {
      const angle = config.initialAngle ?? Math.floor(Math.random() * 8) * SNAP_ANGLE
      let targetAngle = Math.floor(Math.random() * 8) * SNAP_ANGLE
      while (Math.abs(angle - targetAngle) < TOLERANCE * 2) {
        targetAngle = Math.floor(Math.random() * 8) * SNAP_ANGLE
      }
      this.gears.set(config.id, {
        id: config.id,
        angle,
        targetAngle,
        size: config.size,
        connectedTo: config.connectedTo,
      })
    })
  }

  setOnGearRotate(callback: (gearId: number, angle: number) => void) {
    this.onGearRotate = callback
  }

  setOnAllAligned(callback: () => void) {
    this.onAllAligned = callback
  }

  getGear(id: number): GearState | undefined {
    return this.gears.get(id)
  }

  getAllGears(): GearState[] {
    return Array.from(this.gears.values())
  }

  rotateGear(gearId: number, direction: 1 | -1): void {
    const gear = this.gears.get(gearId)
    if (!gear) return

    const delta = SNAP_ANGLE * direction
    gear.angle = this.normalizeAngle(gear.angle + delta)
    this.onGearRotate?.(gearId, gear.angle)

    gear.connectedTo.forEach((connectedId) => {
      const connected = this.gears.get(connectedId)
      if (connected) {
        const reverseDelta = -delta
        connected.angle = this.normalizeAngle(connected.angle + reverseDelta)
        this.onGearRotate?.(connectedId, connected.angle)
      }
    })

    if (this.checkAllAligned()) {
      this.onAllAligned?.()
    }
  }

  isAligned(gearId: number): boolean {
    const gear = this.gears.get(gearId)
    if (!gear) return false
    const diff = Math.abs(this.normalizeAngle(gear.angle - gear.targetAngle))
    return diff <= TOLERANCE || Math.abs(diff - 360) <= TOLERANCE
  }

  getAlignedCount(): number {
    let count = 0
    this.gears.forEach((gear) => {
      if (this.isAligned(gear.id)) count++
    })
    return count
  }

  getTotalCount(): number {
    return this.gears.size
  }

  checkAllAligned(): boolean {
    for (const gear of this.gears.values()) {
      if (!this.isAligned(gear.id)) return false
    }
    return true
  }

  private normalizeAngle(angle: number): number {
    let result = angle % 360
    if (result < 0) result += 360
    return result
  }
}
