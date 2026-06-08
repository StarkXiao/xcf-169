import type {
  ClockTime,
  LightningStrikeEffect,
  StormState,
  StormCallbacks,
  StormStats,
} from '../types'

const SNAP_ANGLE = 45

const STORM_CONFIG = {
  warningDuration: 8,
  activeDuration: 25,
  minIntervalBetweenStorms: 45,
  maxIntervalBetweenStorms: 90,
  minStrikesPerStorm: 2,
  maxStrikesPerStorm: 5,
  minStrikeInterval: 3,
  maxStrikeInterval: 7,
  baseRollbackCharges: 1,
  scorePenaltyPerStrike: 50,
  stormSurvivalBonus: 200,
}

interface GearSnapshot {
  id: number
  angle: number
}

export class StormSystem {
  private state: StormState = {
    phase: 'idle',
    intensity: 'calm',
    warningTimeLeft: 0,
    activeTimeLeft: 0,
    strikesThisStorm: 0,
    rollbackCharges: STORM_CONFIG.baseRollbackCharges,
    totalStrikes: 0,
  }

  private callbacks: StormCallbacks
  private gearIds: number[] = []
  private strikeHistory: LightningStrikeEffect[] = []
  private animationFrameId: number | null = null
  private lastUpdateTime = 0
  private nextStormAt = 0
  private nextStrikeAt = 0
  private plannedStrikeCount = 0

  private totalGearsAffected = 0
  private totalTargetChanges = 0
  private totalScorePenalty = 0
  private totalSurvivalBonus = 0
  private rollbacksUsed = 0

  private getGearsSnapshot?: () => GearSnapshot[]
  private applyGearAngle?: (gearId: number, angle: number) => void
  private getTargetTime?: () => ClockTime
  private setTargetTime?: (time: ClockTime) => void
  private getCurrentTime?: () => ClockTime

  constructor(gearIds: number[], callbacks: StormCallbacks = {}) {
    this.gearIds = [...gearIds]
    this.callbacks = callbacks
    this.scheduleNextStorm()
  }

  setGearAccessors(
    getSnapshot: () => GearSnapshot[],
    applyAngle: (gearId: number, angle: number) => void,
  ): void {
    this.getGearsSnapshot = getSnapshot
    this.applyGearAngle = applyAngle
  }

  setTargetTimeAccessors(
    getTarget: () => ClockTime,
    setTarget: (time: ClockTime) => void,
  ): void {
    this.getTargetTime = getTarget
    this.setTargetTime = setTarget
  }

  setCurrentTimeAccessor(getCurrent: () => ClockTime): void {
    this.getCurrentTime = getCurrent
  }

  getState(): StormState {
    return { ...this.state }
  }

  getStrikeHistory(): LightningStrikeEffect[] {
    return [...this.strikeHistory]
  }

  getLastStrike(): LightningStrikeEffect | undefined {
    return this.strikeHistory[this.strikeHistory.length - 1]
  }

  getRollbackCharges(): number {
    return this.state.rollbackCharges
  }

  start(): void {
    this.lastUpdateTime = performance.now()
    this.loop()
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private loop = (): void => {
    const now = performance.now()
    const delta = (now - this.lastUpdateTime) / 1000
    this.lastUpdateTime = now

    this.update(delta)

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private update(delta: number): void {
    const now = performance.now()

    switch (this.state.phase) {
      case 'idle':
        if (now >= this.nextStormAt) {
          this.startWarning()
        }
        break

      case 'warning':
        this.state.warningTimeLeft = Math.max(0, this.state.warningTimeLeft - delta)
        if (this.state.warningTimeLeft <= 0) {
          this.startStorm()
        }
        this.emitStateChange()
        break

      case 'active':
        this.state.activeTimeLeft = Math.max(0, this.state.activeTimeLeft - delta)
        if (now >= this.nextStrikeAt && this.state.strikesThisStorm < this.plannedStrikeCount) {
          this.triggerLightningStrike()
          this.scheduleNextStrike()
        }
        if (this.state.activeTimeLeft <= 0 || this.state.strikesThisStorm >= this.plannedStrikeCount) {
          this.endStorm()
        }
        this.emitStateChange()
        break

      case 'ended':
        break
    }
  }

  private scheduleNextStorm(): void {
    const now = performance.now()
    const delay =
      (STORM_CONFIG.minIntervalBetweenStorms +
        Math.random() * (STORM_CONFIG.maxIntervalBetweenStorms - STORM_CONFIG.minIntervalBetweenStorms)) *
      1000
    this.nextStormAt = now + delay
  }

  private scheduleNextStrike(): void {
    const now = performance.now()
    const delay =
      (STORM_CONFIG.minStrikeInterval +
        Math.random() * (STORM_CONFIG.maxStrikeInterval - STORM_CONFIG.minStrikeInterval)) *
      1000
    this.nextStrikeAt = now + delay
  }

  private startWarning(): void {
    this.state.phase = 'warning'
    this.state.intensity = 'storm'
    this.state.warningTimeLeft = STORM_CONFIG.warningDuration
    this.state.rollbackCharges = STORM_CONFIG.baseRollbackCharges
    this.emitStateChange()
    this.callbacks.onStormWarning?.(STORM_CONFIG.warningDuration)
  }

  private startStorm(): void {
    this.state.phase = 'active'
    this.state.activeTimeLeft = STORM_CONFIG.activeDuration
    this.state.strikesThisStorm = 0
    this.plannedStrikeCount =
      STORM_CONFIG.minStrikesPerStorm +
      Math.floor(Math.random() * (STORM_CONFIG.maxStrikesPerStorm - STORM_CONFIG.minStrikesPerStorm + 1))
    this.scheduleNextStrike()
    this.emitStateChange()
    this.callbacks.onStormStart?.()
  }

  private triggerLightningStrike(): LightningStrikeEffect {
    const strikeId = `strike_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const timestamp = performance.now()

    const affectedGearCount = Math.max(1, Math.min(this.gearIds.length, Math.ceil(Math.random() * 2)))
    const shuffledGears = [...this.gearIds].sort(() => Math.random() - 0.5)
    const affectedGearIds = shuffledGears.slice(0, affectedGearCount)

    const gearAngleChanges = new Map<number, number>()
    const previousAngles = new Map<number, number>()

    if (this.getGearsSnapshot) {
      const snapshot = this.getGearsSnapshot()
      snapshot.forEach((g) => previousAngles.set(g.id, g.angle))
    }

    affectedGearIds.forEach((gearId) => {
      const previousAngle = previousAngles.get(gearId) ?? 0
      const randomSteps = Math.floor(Math.random() * 7) - 3
      const angleDelta = randomSteps * SNAP_ANGLE
      const newAngle = this.normalizeAngle(previousAngle + angleDelta)
      gearAngleChanges.set(gearId, previousAngle)

      if (this.applyGearAngle) {
        this.applyGearAngle(gearId, newAngle)
      }
    })

    let targetTimeChanged = false
    let previousTargetTime: ClockTime | undefined
    let newTargetTime: ClockTime | undefined

    if (Math.random() < 0.4 && this.getTargetTime && this.setTargetTime) {
      targetTimeChanged = true
      previousTargetTime = { ...this.getTargetTime() }
      newTargetTime = this.generateRandomTargetTime()
      this.setTargetTime(newTargetTime)
    }

    const scorePenalty = STORM_CONFIG.scorePenaltyPerStrike * affectedGearCount + (targetTimeChanged ? 100 : 0)
    this.totalScorePenalty += scorePenalty
    this.totalGearsAffected += affectedGearCount
    if (targetTimeChanged) this.totalTargetChanges++

    const effect: LightningStrikeEffect = {
      strikeId,
      timestamp,
      affectedGearIds,
      gearAngleChanges,
      targetTimeChanged,
      previousTargetTime,
      newTargetTime,
      scorePenalty,
    }

    this.strikeHistory.push(effect)
    this.state.strikesThisStorm++
    this.state.totalStrikes++

    this.callbacks.onLightningStrike?.(effect)
    this.emitStateChange()

    return effect
  }

  useRollback(strikeId?: string): LightningStrikeEffect | null {
    if (this.state.rollbackCharges <= 0) return null

    const targetStrike = strikeId
      ? this.strikeHistory.find((s) => s.strikeId === strikeId)
      : this.strikeHistory[this.strikeHistory.length - 1]

    if (!targetStrike) return null

    targetStrike.gearAngleChanges.forEach((previousAngle, gearId) => {
      if (this.applyGearAngle) {
        this.applyGearAngle(gearId, previousAngle)
      }
    })

    if (targetStrike.targetTimeChanged && targetStrike.previousTargetTime && this.setTargetTime) {
      this.setTargetTime(targetStrike.previousTargetTime)
    }

    this.totalScorePenalty = Math.max(0, this.totalScorePenalty - targetStrike.scorePenalty)
    this.totalGearsAffected = Math.max(0, this.totalGearsAffected - targetStrike.affectedGearIds.length)
    if (targetStrike.targetTimeChanged) {
      this.totalTargetChanges = Math.max(0, this.totalTargetChanges - 1)
    }

    this.state.rollbackCharges--
    this.rollbacksUsed++

    this.callbacks.onRollbackUsed?.(targetStrike)
    this.emitStateChange()

    return targetStrike
  }

  private endStorm(): void {
    this.state.phase = 'ended'
    this.totalSurvivalBonus += STORM_CONFIG.stormSurvivalBonus
    const stats = this.getStats()
    this.callbacks.onStormEnd?.(stats)
    this.emitStateChange()

    setTimeout(() => {
      this.resetForNextStorm()
    }, 2000)
  }

  private resetForNextStorm(): void {
    this.state.phase = 'idle'
    this.state.intensity = 'calm'
    this.state.warningTimeLeft = 0
    this.state.activeTimeLeft = 0
    this.state.strikesThisStorm = 0
    this.state.rollbackCharges = STORM_CONFIG.baseRollbackCharges
    this.scheduleNextStorm()
    this.emitStateChange()
  }

  private generateRandomTargetTime(): ClockTime {
    const current = this.getCurrentTime?.() ?? { hours: 12, minutes: 0 }
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

  private normalizeAngle(angle: number): number {
    let result = angle % 360
    if (result < 0) result += 360
    return result
  }

  private emitStateChange(): void {
    this.callbacks.onStateChange?.({ ...this.state })
  }

  getStats(): StormStats {
    return {
      totalStrikes: this.state.totalStrikes,
      totalGearsAffected: this.totalGearsAffected,
      targetTimesChanged: this.totalTargetChanges,
      rollbacksUsed: this.rollbacksUsed,
      scorePenalty: this.totalScorePenalty,
      scoreBonus: this.totalSurvivalBonus,
    }
  }

  calculateScoreImpact(): number {
    const stats = this.getStats()
    return stats.scoreBonus - stats.scorePenalty
  }

  reset(): void {
    this.state = {
      phase: 'idle',
      intensity: 'calm',
      warningTimeLeft: 0,
      activeTimeLeft: 0,
      strikesThisStorm: 0,
      rollbackCharges: STORM_CONFIG.baseRollbackCharges,
      totalStrikes: 0,
    }
    this.strikeHistory = []
    this.totalGearsAffected = 0
    this.totalTargetChanges = 0
    this.totalScorePenalty = 0
    this.totalSurvivalBonus = 0
    this.rollbacksUsed = 0
    this.scheduleNextStorm()
  }

  destroy(): void {
    this.stop()
    this.strikeHistory = []
  }
}
