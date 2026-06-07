import type {
  ClockTime,
  MultiClockLevelConfig,
  MultiClockState,
  SideTowerClock,
  ClockMechanism,
  MultiClockGameResult,
} from '../types'

export const MULTI_CLOCK_LEVELS: MultiClockLevelConfig[] = [
  {
    id: 'level1',
    name: '双子钟塔',
    displayName: '第一关：双子钟塔',
    description: '校准主钟牵动东西两座侧塔分钟钟面，同步对准目标时刻。',
    duration: 180,
    mainClockTarget: { hours: 3, minutes: 45 },
    sideTowers: [
      {
        id: 'east',
        name: 'eastTower',
        displayName: '东塔分钟钟',
        role: 'minute',
        position: { x: 0.18, y: 0.35 },
        currentTime: { hours: 12, minutes: 10 },
        targetTime: { hours: 3, minutes: 45 },
        linkedToMain: true,
        linkageRatio: 0.75,
        deviationMinutes: 0,
      },
      {
        id: 'west',
        name: 'westTower',
        displayName: '西塔分钟钟',
        role: 'minute',
        position: { x: 0.82, y: 0.35 },
        currentTime: { hours: 12, minutes: 50 },
        targetTime: { hours: 3, minutes: 45 },
        linkedToMain: true,
        linkageRatio: 0.5,
        deviationMinutes: 0,
      },
    ],
    mechanisms: [
      {
        id: 'mech1',
        name: 'eastGearChain',
        displayName: '东塔齿轮链',
        type: 'gearChain',
        sourceClockId: 'main',
        targetClockId: 'east',
        activationCondition: 'aligned',
        isActive: false,
        effectMultiplier: 1.2,
      },
      {
        id: 'mech2',
        name: 'westPulley',
        displayName: '西塔滑轮组',
        type: 'pulley',
        sourceClockId: 'main',
        targetClockId: 'west',
        activationCondition: 'deviationWithin',
        activationValue: 30,
        isActive: false,
        effectMultiplier: 1.5,
      },
    ],
    toleranceMinutes: 5,
    scoreMultiplier: 1.0,
    requireAllAligned: true,
  },
  {
    id: 'level2',
    name: '四方钟阵',
    displayName: '第二关：四方钟阵',
    description: '四座侧塔环绕主钟，每个钟面有独立偏差和联动机关。',
    duration: 240,
    mainClockTarget: { hours: 6, minutes: 30 },
    sideTowers: [
      {
        id: 'north',
        name: 'northTower',
        displayName: '北塔时钟',
        role: 'hour',
        position: { x: 0.5, y: 0.12 },
        currentTime: { hours: 2, minutes: 15 },
        targetTime: { hours: 6, minutes: 30 },
        linkedToMain: true,
        linkageRatio: 0.6,
        deviationMinutes: 0,
        mechanismId: 'mechNorth',
      },
      {
        id: 'south',
        name: 'southTower',
        displayName: '南塔分钟钟',
        role: 'minute',
        position: { x: 0.5, y: 0.88 },
        currentTime: { hours: 9, minutes: 45 },
        targetTime: { hours: 6, minutes: 30 },
        linkedToMain: true,
        linkageRatio: 0.8,
        deviationMinutes: 0,
        mechanismId: 'mechSouth',
      },
      {
        id: 'east',
        name: 'eastTower',
        displayName: '东塔分钟钟',
        role: 'minute',
        position: { x: 0.12, y: 0.5 },
        currentTime: { hours: 4, minutes: 0 },
        targetTime: { hours: 6, minutes: 30 },
        linkedToMain: true,
        linkageRatio: 0.5,
        deviationMinutes: 0,
      },
      {
        id: 'west',
        name: 'westTower',
        displayName: '西塔时钟',
        role: 'hour',
        position: { x: 0.88, y: 0.5 },
        currentTime: { hours: 11, minutes: 20 },
        targetTime: { hours: 6, minutes: 30 },
        linkedToMain: true,
        linkageRatio: 0.65,
        deviationMinutes: 0,
      },
    ],
    mechanisms: [
      {
        id: 'mechNorth',
        name: 'northPendulum',
        displayName: '北塔钟摆',
        type: 'pendulum',
        sourceClockId: 'main',
        targetClockId: 'north',
        activationCondition: 'deviationWithin',
        activationValue: 60,
        isActive: false,
        effectMultiplier: 1.3,
      },
      {
        id: 'mechSouth',
        name: 'southSpring',
        displayName: '南塔发条',
        type: 'spring',
        sourceClockId: 'main',
        targetClockId: 'south',
        activationCondition: 'aligned',
        isActive: false,
        effectMultiplier: 1.4,
      },
    ],
    toleranceMinutes: 8,
    scoreMultiplier: 1.5,
    requireAllAligned: true,
  },
  {
    id: 'level3',
    name: '星罗钟阵',
    displayName: '第三关：星罗钟阵',
    description: '六座侧塔环绕主钟，机关联动复杂，需精密计算指针偏差。',
    duration: 300,
    mainClockTarget: { hours: 9, minutes: 15 },
    sideTowers: [
      { id: 'tower1', name: 'tower1', displayName: '奎塔', role: 'minute', position: { x: 0.15, y: 0.2 }, currentTime: { hours: 5, minutes: 40 }, targetTime: { hours: 9, minutes: 15 }, linkedToMain: true, linkageRatio: 0.55, deviationMinutes: 0 },
      { id: 'tower2', name: 'tower2', displayName: '娄塔', role: 'hour', position: { x: 0.5, y: 0.1 }, currentTime: { hours: 1, minutes: 50 }, targetTime: { hours: 9, minutes: 15 }, linkedToMain: true, linkageRatio: 0.45, deviationMinutes: 0, mechanismId: 'mech娄' },
      { id: 'tower3', name: 'tower3', displayName: '胃塔', role: 'minute', position: { x: 0.85, y: 0.2 }, currentTime: { hours: 7, minutes: 5 }, targetTime: { hours: 9, minutes: 15 }, linkedToMain: true, linkageRatio: 0.6, deviationMinutes: 0 },
      { id: 'tower4', name: 'tower4', displayName: '昴塔', role: 'minute', position: { x: 0.85, y: 0.8 }, currentTime: { hours: 11, minutes: 30 }, targetTime: { hours: 9, minutes: 15 }, linkedToMain: true, linkageRatio: 0.7, deviationMinutes: 0, mechanismId: 'mech昴' },
      { id: 'tower5', name: 'tower5', displayName: '毕塔', role: 'hour', position: { x: 0.5, y: 0.9 }, currentTime: { hours: 4, minutes: 45 }, targetTime: { hours: 9, minutes: 15 }, linkedToMain: true, linkageRatio: 0.5, deviationMinutes: 0 },
      { id: 'tower6', name: 'tower6', displayName: '觜塔', role: 'minute', position: { x: 0.15, y: 0.8 }, currentTime: { hours: 2, minutes: 25 }, targetTime: { hours: 9, minutes: 15 }, linkedToMain: true, linkageRatio: 0.65, deviationMinutes: 0 },
    ],
    mechanisms: [
      { id: 'mech娄', name: 'louGearChain', displayName: '娄塔齿轮链', type: 'gearChain', sourceClockId: 'main', targetClockId: 'tower2', activationCondition: 'deviationWithin', activationValue: 45, isActive: false, effectMultiplier: 1.5 },
      { id: 'mech昴', name: 'maoPulley', displayName: '昴塔滑轮组', type: 'pulley', sourceClockId: 'tower3', targetClockId: 'tower4', activationCondition: 'aligned', isActive: false, effectMultiplier: 1.6 },
    ],
    toleranceMinutes: 10,
    scoreMultiplier: 2.0,
    requireAllAligned: true,
  },
]

function clockTimeToMinutes(time: ClockTime): number {
  return time.hours * 60 + time.minutes
}

function minutesToClockTime(totalMinutes: number): ClockTime {
  const normalized = ((totalMinutes % 720) + 720) % 720
  const minutes = normalized === 0 ? 720 : normalized
  const hours = Math.floor(minutes / 60) || 12
  const mins = minutes % 60
  return { hours, minutes: mins }
}

function getTimeDiffMinutes(a: ClockTime, b: ClockTime): number {
  const diff = Math.abs(clockTimeToMinutes(a) - clockTimeToMinutes(b))
  return diff > 360 ? 720 - diff : diff
}

export class MultiClockSystem {
  private state: MultiClockState
  private onMainClockChange?: (time: ClockTime) => void
  private onSideTowerChange?: (tower: SideTowerClock) => void
  private onMechanismActivate?: (mechanism: ClockMechanism) => void
  private onStateChange?: (state: MultiClockState) => void
  private onAllAligned?: () => void

  constructor(levelConfig: MultiClockLevelConfig) {
    this.state = this.initializeState(levelConfig)
  }

  private initializeState(config: MultiClockLevelConfig): MultiClockState {
    const sideTowers: SideTowerClock[] = config.sideTowers.map((tower) => ({
      ...tower,
      isAligned: false,
    }))

    const mainClockCurrent = { hours: 12, minutes: 0 }

    sideTowers.forEach((tower) => {
      tower.deviationMinutes = getTimeDiffMinutes(tower.currentTime, tower.targetTime)
      tower.isAligned = tower.deviationMinutes <= config.toleranceMinutes
    })

    const mechanisms: ClockMechanism[] = config.mechanisms.map((m) => ({ ...m, isActive: false }))

    const totalDeviation = sideTowers.reduce((sum, t) => sum + t.deviationMinutes, 0)

    return {
      levelConfig: config,
      mainClockCurrent,
      sideTowers,
      mechanisms,
      isCompleted: false,
      isLocked: false,
      allAligned: false,
      totalDeviation,
    }
  }

  setOnMainClockChange(callback: (time: ClockTime) => void): void {
    this.onMainClockChange = callback
  }

  setOnSideTowerChange(callback: (tower: SideTowerClock) => void): void {
    this.onSideTowerChange = callback
  }

  setOnMechanismActivate(callback: (mechanism: ClockMechanism) => void): void {
    this.onMechanismActivate = callback
  }

  setOnStateChange(callback: (state: MultiClockState) => void): void {
    this.onStateChange = callback
  }

  setOnAllAligned(callback: () => void): void {
    this.onAllAligned = callback
  }

  getState(): MultiClockState {
    return {
      ...this.state,
      sideTowers: this.state.sideTowers.map((t) => ({ ...t })),
      mechanisms: this.state.mechanisms.map((m) => ({ ...m })),
    }
  }

  getLevelConfig(): MultiClockLevelConfig {
    return { ...this.state.levelConfig }
  }

  getMainClockCurrent(): ClockTime {
    return { ...this.state.mainClockCurrent }
  }

  getSideTower(id: string): SideTowerClock | undefined {
    const tower = this.state.sideTowers.find((t) => t.id === id)
    return tower ? { ...tower } : undefined
  }

  getAllSideTowers(): SideTowerClock[] {
    return this.state.sideTowers.map((t) => ({ ...t }))
  }

  getAlignedCount(): number {
    return this.state.sideTowers.filter((t) => t.isAligned).length
  }

  getTotalTowers(): number {
    return this.state.sideTowers.length
  }

  lock(): void {
    this.state.isCompleted = true
    this.state.isLocked = true
  }

  isLocked(): boolean {
    return this.state.isLocked || this.state.isCompleted
  }

  advanceMainClock(minutesDelta: number): void {
    if (this.isLocked()) return

    const currentMins = clockTimeToMinutes(this.state.mainClockCurrent)
    const newMins = currentMins + minutesDelta
    this.state.mainClockCurrent = minutesToClockTime(newMins)

    this.propagateToSideTowers(minutesDelta)
    this.checkMechanismActivations()
    this.updateDeviations()
    this.checkCompletion()

    this.onMainClockChange?.(this.state.mainClockCurrent)
    this.onStateChange?.(this.getState())
  }

  private propagateToSideTowers(mainDelta: number): void {
    this.state.sideTowers.forEach((tower) => {
      if (!tower.linkedToMain) return

      let effectiveRatio = tower.linkageRatio

      const relatedMech = this.state.mechanisms.find(
        (m) => m.targetClockId === tower.id && m.isActive,
      )
      if (relatedMech) {
        effectiveRatio *= relatedMech.effectMultiplier
      }

      const towerDelta = Math.round(mainDelta * effectiveRatio)
      if (towerDelta === 0) return

      const towerMins = clockTimeToMinutes(tower.currentTime)
      tower.currentTime = minutesToClockTime(towerMins + towerDelta)

      this.onSideTowerChange?.(tower)
    })
  }

  advanceSideTower(towerId: string, minutesDelta: number): void {
    if (this.isLocked()) return

    const tower = this.state.sideTowers.find((t) => t.id === towerId)
    if (!tower) return

    const towerMins = clockTimeToMinutes(tower.currentTime)
    tower.currentTime = minutesToClockTime(towerMins + minutesDelta)

    this.checkMechanismActivations()
    this.updateDeviations()
    this.checkCompletion()

    this.onSideTowerChange?.(tower)
    this.onStateChange?.(this.getState())
  }

  private checkMechanismActivations(): void {
    this.state.mechanisms.forEach((mech) => {
      if (mech.isActive) return

      let shouldActivate = false

      switch (mech.activationCondition) {
        case 'aligned': {
          const source = this.getClockById(mech.sourceClockId)
          const target = this.getClockById(mech.targetClockId)
          if (source && target) {
            const diff = getTimeDiffMinutes(source.currentTime, source.targetTime)
            shouldActivate = diff <= this.state.levelConfig.toleranceMinutes
          }
          break
        }
        case 'deviationWithin': {
          const source = this.getClockById(mech.sourceClockId)
          if (source && mech.activationValue !== undefined) {
            const diff = getTimeDiffMinutes(source.currentTime, source.targetTime)
            shouldActivate = diff <= mech.activationValue
          }
          break
        }
        case 'timeReached': {
          const source = this.getClockById(mech.sourceClockId)
          if (source && mech.activationValue !== undefined) {
            const mins = clockTimeToMinutes(source.currentTime)
            shouldActivate = mins >= mech.activationValue
          }
          break
        }
      }

      if (shouldActivate) {
        mech.isActive = true
        this.onMechanismActivate?.(mech)
      }
    })
  }

  private getClockById(
    id: string,
  ): { currentTime: ClockTime; targetTime: ClockTime } | null {
    if (id === 'main') {
      return {
        currentTime: this.state.mainClockCurrent,
        targetTime: this.state.levelConfig.mainClockTarget,
      }
    }
    const tower = this.state.sideTowers.find((t) => t.id === id)
    if (tower) {
      return { currentTime: tower.currentTime, targetTime: tower.targetTime }
    }
    return null
  }

  private updateDeviations(): void {
    let totalDev = 0

    this.state.sideTowers.forEach((tower) => {
      tower.deviationMinutes = getTimeDiffMinutes(tower.currentTime, tower.targetTime)
      tower.isAligned = tower.deviationMinutes <= this.state.levelConfig.toleranceMinutes
      totalDev += tower.deviationMinutes
    })

    this.state.totalDeviation = totalDev

    const mainDiff = getTimeDiffMinutes(
      this.state.mainClockCurrent,
      this.state.levelConfig.mainClockTarget,
    )
    const mainAligned = mainDiff <= this.state.levelConfig.toleranceMinutes
    const allSideAligned = this.state.sideTowers.every((t) => t.isAligned)

    this.state.allAligned = this.state.levelConfig.requireAllAligned
      ? mainAligned && allSideAligned
      : mainAligned || allSideAligned
  }

  private checkCompletion(): void {
    if (this.state.allAligned && !this.state.isCompleted) {
      this.state.isCompleted = true
      this.onAllAligned?.()
    }
  }

  calculateResult(timeLeft: number): MultiClockGameResult {
    const alignedCount = this.getAlignedCount()
    const totalTowers = this.getTotalTowers()
    const avgDeviation = totalTowers > 0 ? this.state.totalDeviation / totalTowers : 0

    const baseScore = 1000
    const alignmentBonus = alignedCount * 500
    const timeBonus = timeLeft * 8
    const accuracyBonus = Math.max(0, Math.floor((1 - avgDeviation / 360) * 2000))
    const perfectBonus = this.state.allAligned ? 3000 : 0

    const score = Math.floor(
      (baseScore + alignmentBonus + timeBonus + accuracyBonus + perfectBonus) *
        this.state.levelConfig.scoreMultiplier,
    )

    return {
      success: this.state.allAligned,
      score,
      timeLeft,
      levelId: this.state.levelConfig.id,
      sideTowersAligned: alignedCount,
      totalSideTowers: totalTowers,
      totalDeviation: this.state.totalDeviation,
      averageDeviation: Math.round(avgDeviation * 100) / 100,
    }
  }

  reset(): void {
    this.state = this.initializeState(this.state.levelConfig)
    this.onStateChange?.(this.getState())
  }
}
