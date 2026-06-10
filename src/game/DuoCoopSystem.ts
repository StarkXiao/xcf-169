import type {
  ClockTime,
  DuoCoopLevelConfig,
  DuoCoopState,
  DuoCoopPlayerState,
  DuoCoopInterferenceEvent,
  DuoCoopSyncTarget,
  DuoCoopGameResult,
} from '../types'

export const DUO_COOP_LEVELS: DuoCoopLevelConfig[] = [
  {
    id: 'duo1',
    name: '双钟初鸣',
    displayName: '第一关：双钟初鸣',
    description: '主钟与副钟各自校准，注意共享漂移与偶发干扰。',
    duration: 180,
    masterTarget: { hours: 3, minutes: 0 },
    slaveTarget: { hours: 9, minutes: 0 },
    toleranceMinutes: 5,
    scoreMultiplier: 1.0,
    interferences: [
      { id: 'drift1', type: 'drift', name: '时间漂移', displayName: '时间漂移', description: '双方钟面缓慢偏移', icon: '🌊', targetPlayer: 'both', durationMs: 12000, triggerChance: 0.4, severity: 'low' },
      { id: 'rebound1', type: 'rebound', name: '弹回冲击', displayName: '弹回冲击', description: '操作方向偶尔反转', icon: '🔄', targetPlayer: 'master', durationMs: 8000, triggerChance: 0.25, severity: 'medium' },
      { id: 'fog1', type: 'fog', name: '迷雾遮蔽', displayName: '迷雾遮蔽', description: '目标时刻被遮挡', icon: '🌫️', targetPlayer: 'slave', durationMs: 10000, triggerChance: 0.2, severity: 'medium' },
    ],
    syncTargets: [
      { id: 'sync1', targetTime: { hours: 3, minutes: 0 }, toleranceMinutes: 3, label: '主钟准点', scope: 'master', bonusScore: 500, isAchieved: false },
      { id: 'sync2', targetTime: { hours: 9, minutes: 0 }, toleranceMinutes: 3, label: '副钟准点', scope: 'slave', bonusScore: 500, isAchieved: false },
      { id: 'sync3', targetTime: { hours: 6, minutes: 0 }, toleranceMinutes: 8, label: '双钟对称', scope: 'both', bonusScore: 1000, isAchieved: false },
    ],
    sharedTimeDrift: 0.3,
    interferenceIntervalMs: 15000,
  },
  {
    id: 'duo2',
    name: '磁力纠缠',
    displayName: '第二关：磁力纠缠',
    description: '磁力干扰让双钟互相牵扯，同步校准更困难。',
    duration: 240,
    masterTarget: { hours: 6, minutes: 30 },
    slaveTarget: { hours: 6, minutes: 30 },
    toleranceMinutes: 5,
    scoreMultiplier: 1.5,
    interferences: [
      { id: 'drift2', type: 'drift', name: '时间漂移', displayName: '时间漂移', description: '双方钟面缓慢偏移', icon: '🌊', targetPlayer: 'both', durationMs: 15000, triggerChance: 0.5, severity: 'medium' },
      { id: 'magnet2', type: 'magnet', name: '磁力牵引', displayName: '磁力牵引', description: '操作一方会牵动另一方', icon: '🧲', targetPlayer: 'both', durationMs: 12000, triggerChance: 0.4, severity: 'high' },
      { id: 'stutter2', type: 'stutter', name: '齿轮卡顿', displayName: '齿轮卡顿', description: '操作有概率无效', icon: '⚡', targetPlayer: 'slave', durationMs: 10000, triggerChance: 0.35, severity: 'medium' },
      { id: 'fog2', type: 'fog', name: '迷雾遮蔽', displayName: '迷雾遮蔽', description: '目标时刻被遮挡', icon: '🌫️', targetPlayer: 'both', durationMs: 8000, triggerChance: 0.3, severity: 'high' },
    ],
    syncTargets: [
      { id: 'sync1', targetTime: { hours: 6, minutes: 30 }, toleranceMinutes: 3, label: '主钟准点', scope: 'master', bonusScore: 800, isAchieved: false },
      { id: 'sync2', targetTime: { hours: 6, minutes: 30 }, toleranceMinutes: 3, label: '副钟准点', scope: 'slave', bonusScore: 800, isAchieved: false },
      { id: 'sync3', targetTime: { hours: 6, minutes: 30 }, toleranceMinutes: 2, label: '精准同步', scope: 'both', bonusScore: 2000, isAchieved: false },
    ],
    sharedTimeDrift: 0.5,
    interferenceIntervalMs: 12000,
  },
  {
    id: 'duo3',
    name: '时空裂隙',
    displayName: '第三关：时空裂隙',
    description: '所有干扰齐发，双钟必须在混沌中同步。',
    duration: 300,
    masterTarget: { hours: 10, minutes: 10 },
    slaveTarget: { hours: 2, minutes: 50 },
    toleranceMinutes: 4,
    scoreMultiplier: 2.0,
    interferences: [
      { id: 'drift3', type: 'drift', name: '时间漂移', displayName: '时间漂移', description: '双方钟面缓慢偏移', icon: '🌊', targetPlayer: 'both', durationMs: 18000, triggerChance: 0.5, severity: 'high' },
      { id: 'rebound3', type: 'rebound', name: '弹回冲击', displayName: '弹回冲击', description: '操作方向偶尔反转', icon: '🔄', targetPlayer: 'both', durationMs: 10000, triggerChance: 0.35, severity: 'high' },
      { id: 'magnet3', type: 'magnet', name: '磁力牵引', displayName: '磁力牵引', description: '操作一方会牵动另一方', icon: '🧲', targetPlayer: 'both', durationMs: 14000, triggerChance: 0.45, severity: 'high' },
      { id: 'fog3', type: 'fog', name: '迷雾遮蔽', displayName: '迷雾遮蔽', description: '目标时刻被遮挡', icon: '🌫️', targetPlayer: 'both', durationMs: 12000, triggerChance: 0.35, severity: 'high' },
      { id: 'stutter3', type: 'stutter', name: '齿轮卡顿', displayName: '齿轮卡顿', description: '操作有概率无效', icon: '⚡', targetPlayer: 'both', durationMs: 8000, triggerChance: 0.4, severity: 'high' },
    ],
    syncTargets: [
      { id: 'sync1', targetTime: { hours: 10, minutes: 10 }, toleranceMinutes: 2, label: '主钟精准', scope: 'master', bonusScore: 1000, isAchieved: false },
      { id: 'sync2', targetTime: { hours: 2, minutes: 50 }, toleranceMinutes: 2, label: '副钟精准', scope: 'slave', bonusScore: 1000, isAchieved: false },
      { id: 'sync3', targetTime: { hours: 6, minutes: 30 }, toleranceMinutes: 10, label: '双钟均值', scope: 'both', bonusScore: 1500, isAchieved: false },
      { id: 'sync4', targetTime: { hours: 12, minutes: 0 }, toleranceMinutes: 5, label: '正午共鸣', scope: 'both', bonusScore: 3000, isAchieved: false },
    ],
    sharedTimeDrift: 0.7,
    interferenceIntervalMs: 9000,
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

const MASTER_DELTA_LARGE = 30
const MASTER_DELTA_SMALL = 5
const SLAVE_DELTA_LARGE = 15
const SLAVE_DELTA_SMALL = 3

export { MASTER_DELTA_LARGE, MASTER_DELTA_SMALL, SLAVE_DELTA_LARGE, SLAVE_DELTA_SMALL }

export class DuoCoopSystem {
  private state: DuoCoopState
  private interferenceCheckInterval: number | null = null
  private driftInterval: number | null = null
  private onMasterClockChange?: (time: ClockTime, player: DuoCoopPlayerState) => void
  private onSlaveClockChange?: (time: ClockTime, player: DuoCoopPlayerState) => void
  private onInterferenceActivate?: (interference: DuoCoopInterferenceEvent & { expiresAt: number }) => void
  private onInterferenceExpire?: (interferenceId: string) => void
  private onSyncTargetAchieved?: (target: DuoCoopSyncTarget) => void
  private onStateChange?: (state: DuoCoopState) => void
  private onAllSynced?: () => void
  private onSharedDrift?: (drift: number) => void
  private interferenceCounter = 0

  constructor(levelConfig: DuoCoopLevelConfig) {
    this.state = this.initializeState(levelConfig)
  }

  private initializeState(config: DuoCoopLevelConfig): DuoCoopState {
    const master: DuoCoopPlayerState = {
      role: 'master',
      currentTime: { hours: 12, minutes: 0 },
      targetTime: config.masterTarget,
      deviationMinutes: getTimeDiffMinutes({ hours: 12, minutes: 0 }, config.masterTarget),
      isAligned: false,
      driftAccumulator: 0,
      reboundCooldown: 0,
      fogActive: false,
      magnetPullDir: 0,
      stutterActive: false,
      lastOperationTime: 0,
      operationCount: 0,
    }

    const slave: DuoCoopPlayerState = {
      role: 'slave',
      currentTime: { hours: 12, minutes: 0 },
      targetTime: config.slaveTarget,
      deviationMinutes: getTimeDiffMinutes({ hours: 12, minutes: 0 }, config.slaveTarget),
      isAligned: false,
      driftAccumulator: 0,
      reboundCooldown: 0,
      fogActive: false,
      magnetPullDir: 0,
      stutterActive: false,
      lastOperationTime: 0,
      operationCount: 0,
    }

    master.isAligned = master.deviationMinutes <= config.toleranceMinutes
    slave.isAligned = slave.deviationMinutes <= config.toleranceMinutes

    const syncTargets = config.syncTargets.map((t) => ({ ...t, isAchieved: false }))

    return {
      levelConfig: config,
      master,
      slave,
      activeInterferences: [],
      syncTargets,
      syncScore: 0,
      isCompleted: false,
      isLocked: false,
      allSynced: false,
      totalDeviation: master.deviationMinutes + slave.deviationMinutes,
      lastInterferenceTime: Date.now(),
      sharedDrift: 0,
    }
  }

  startInterferenceLoop(): void {
    this.stopInterferenceLoop()
    this.interferenceCheckInterval = window.setInterval(() => {
      this.tryTriggerInterference()
    }, 2000)
    this.driftInterval = window.setInterval(() => {
      this.applySharedDrift()
      this.expireInterferences()
    }, 1000)
  }

  stopInterferenceLoop(): void {
    if (this.interferenceCheckInterval !== null) {
      clearInterval(this.interferenceCheckInterval)
      this.interferenceCheckInterval = null
    }
    if (this.driftInterval !== null) {
      clearInterval(this.driftInterval)
      this.driftInterval = null
    }
  }

  private tryTriggerInterference(): void {
    if (this.isLocked()) return

    const now = Date.now()
    if (now - this.state.lastInterferenceTime < this.state.levelConfig.interferenceIntervalMs) return

    const config = this.state.levelConfig
    for (const interference of config.interferences) {
      if (this.state.activeInterferences.some((a) => a.id === interference.id)) continue
      if (Math.random() > interference.triggerChance) continue

      const active = { ...interference, expiresAt: now + interference.durationMs }
      this.state.activeInterferences.push(active)
      this.state.lastInterferenceTime = now

      this.applyInterferenceEffect(interference)

      this.onInterferenceActivate?.(active)
      this.onStateChange?.(this.getState())
      break
    }
  }

  private applyInterferenceEffect(interference: DuoCoopInterferenceEvent): void {
    const { type, targetPlayer } = interference

    if (type === 'fog') {
      if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.fogActive = true
      if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.fogActive = true
    }

    if (type === 'rebound') {
      if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.reboundCooldown = interference.durationMs / 1000
      if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.reboundCooldown = interference.durationMs / 1000
    }

    if (type === 'magnet') {
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1
      if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.magnetPullDir = dir
      if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.magnetPullDir = dir
    }

    if (type === 'stutter') {
      if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.stutterActive = true
      if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.stutterActive = true
    }
  }

  private expireInterferences(): void {
    const now = Date.now()
    const expired = this.state.activeInterferences.filter((a) => a.expiresAt <= now)

    for (const interference of expired) {
      const { type, targetPlayer } = interference

      if (type === 'fog') {
        if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.fogActive = false
        if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.fogActive = false
      }
      if (type === 'rebound') {
        if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.reboundCooldown = 0
        if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.reboundCooldown = 0
      }
      if (type === 'magnet') {
        if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.magnetPullDir = 0
        if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.magnetPullDir = 0
      }
      if (type === 'stutter') {
        if (targetPlayer === 'master' || targetPlayer === 'both') this.state.master.stutterActive = false
        if (targetPlayer === 'slave' || targetPlayer === 'both') this.state.slave.stutterActive = false
      }

      this.onInterferenceExpire?.(interference.id)
    }

    this.state.activeInterferences = this.state.activeInterferences.filter((a) => a.expiresAt > now)
  }

  private applySharedDrift(): void {
    if (this.isLocked()) return

    const driftAmount = this.state.levelConfig.sharedTimeDrift
    this.state.sharedDrift += driftAmount

    if (this.state.sharedDrift >= 1) {
      const driftMinutes = Math.floor(this.state.sharedDrift)
      this.state.sharedDrift -= driftMinutes

      const direction = Math.random() > 0.5 ? 1 : -1
      const driftDelta = driftMinutes * direction

      this.state.master.driftAccumulator += driftDelta
      this.state.slave.driftAccumulator += driftDelta * (Math.random() > 0.3 ? 1 : -1)

      if (Math.abs(this.state.master.driftAccumulator) >= 1) {
        const adj = Math.floor(this.state.master.driftAccumulator)
        this.state.master.driftAccumulator -= adj
        const masterMins = clockTimeToMinutes(this.state.master.currentTime)
        this.state.master.currentTime = minutesToClockTime(masterMins + adj)
        this.onMasterClockChange?.(this.state.master.currentTime, { ...this.state.master })
      }

      if (Math.abs(this.state.slave.driftAccumulator) >= 1) {
        const adj = Math.floor(this.state.slave.driftAccumulator)
        this.state.slave.driftAccumulator -= adj
        const slaveMins = clockTimeToMinutes(this.state.slave.currentTime)
        this.state.slave.currentTime = minutesToClockTime(slaveMins + adj)
        this.onSlaveClockChange?.(this.state.slave.currentTime, { ...this.state.slave })
      }

      this.updateDeviations()
      this.checkSyncTargets()
      this.onSharedDrift?.(driftDelta)
    }
  }

  advanceMasterClock(minutesDelta: number, fineMode = false): void {
    if (this.isLocked()) return

    const player = this.state.master
    if (player.stutterActive && Math.random() < 0.4) return

    let effectiveDelta = fineMode ? MASTER_DELTA_SMALL * Math.sign(minutesDelta) : MASTER_DELTA_LARGE * Math.sign(minutesDelta)

    if (player.reboundCooldown > 0 && Math.random() < 0.35) {
      effectiveDelta = -effectiveDelta
    }

    if (player.magnetPullDir !== 0) {
      effectiveDelta += player.magnetPullDir * 3
    }

    const currentMins = clockTimeToMinutes(player.currentTime)
    player.currentTime = minutesToClockTime(currentMins + effectiveDelta)
    player.lastOperationTime = Date.now()
    player.operationCount++

    if (this.state.activeInterferences.some((i) => i.type === 'magnet')) {
      const slaveDelta = Math.round(effectiveDelta * 0.3)
      if (slaveDelta !== 0) {
        const slaveMins = clockTimeToMinutes(this.state.slave.currentTime)
        this.state.slave.currentTime = minutesToClockTime(slaveMins + slaveDelta)
        this.onSlaveClockChange?.(this.state.slave.currentTime, { ...this.state.slave })
      }
    }

    this.updateDeviations()
    this.checkSyncTargets()
    this.checkCompletion()

    this.onMasterClockChange?.(player.currentTime, { ...player })
    this.onStateChange?.(this.getState())
  }

  advanceSlaveClock(minutesDelta: number, fineMode = false): void {
    if (this.isLocked()) return

    const player = this.state.slave
    if (player.stutterActive && Math.random() < 0.4) return

    let effectiveDelta = fineMode ? SLAVE_DELTA_SMALL * Math.sign(minutesDelta) : SLAVE_DELTA_LARGE * Math.sign(minutesDelta)

    if (player.reboundCooldown > 0 && Math.random() < 0.35) {
      effectiveDelta = -effectiveDelta
    }

    if (player.magnetPullDir !== 0) {
      effectiveDelta += player.magnetPullDir * 2
    }

    const currentMins = clockTimeToMinutes(player.currentTime)
    player.currentTime = minutesToClockTime(currentMins + effectiveDelta)
    player.lastOperationTime = Date.now()
    player.operationCount++

    if (this.state.activeInterferences.some((i) => i.type === 'magnet')) {
      const masterDelta = Math.round(effectiveDelta * 0.3)
      if (masterDelta !== 0) {
        const masterMins = clockTimeToMinutes(this.state.master.currentTime)
        this.state.master.currentTime = minutesToClockTime(masterMins + masterDelta)
        this.onMasterClockChange?.(this.state.master.currentTime, { ...this.state.master })
      }
    }

    this.updateDeviations()
    this.checkSyncTargets()
    this.checkCompletion()

    this.onSlaveClockChange?.(player.currentTime, { ...player })
    this.onStateChange?.(this.getState())
  }

  private updateDeviations(): void {
    const { master, slave, levelConfig } = this.state

    master.deviationMinutes = getTimeDiffMinutes(master.currentTime, master.targetTime)
    master.isAligned = master.deviationMinutes <= levelConfig.toleranceMinutes

    slave.deviationMinutes = getTimeDiffMinutes(slave.currentTime, slave.targetTime)
    slave.isAligned = slave.deviationMinutes <= levelConfig.toleranceMinutes

    this.state.totalDeviation = master.deviationMinutes + slave.deviationMinutes
  }

  private checkSyncTargets(): void {
    for (const target of this.state.syncTargets) {
      if (target.isAchieved) continue

      const masterDiff = getTimeDiffMinutes(this.state.master.currentTime, target.targetTime)
      const slaveDiff = getTimeDiffMinutes(this.state.slave.currentTime, target.targetTime)

      let achieved = false
      switch (target.scope) {
        case 'master':
          achieved = masterDiff <= target.toleranceMinutes
          break
        case 'slave':
          achieved = slaveDiff <= target.toleranceMinutes
          break
        case 'both':
          achieved = masterDiff <= target.toleranceMinutes && slaveDiff <= target.toleranceMinutes
          break
      }

      if (achieved) {
        target.isAchieved = true
        this.state.syncScore += target.bonusScore
        this.onSyncTargetAchieved?.(target)
      }
    }
  }

  private checkCompletion(): void {
    const masterAligned = this.state.master.isAligned
    const slaveAligned = this.state.slave.isAligned
    this.state.allSynced = masterAligned && slaveAligned

    if (this.state.allSynced && !this.state.isCompleted) {
      this.state.isCompleted = true
      this.onAllSynced?.()
    }
  }

  setOnMasterClockChange(cb: (time: ClockTime, player: DuoCoopPlayerState) => void): void {
    this.onMasterClockChange = cb
  }

  setOnSlaveClockChange(cb: (time: ClockTime, player: DuoCoopPlayerState) => void): void {
    this.onSlaveClockChange = cb
  }

  setOnInterferenceActivate(cb: (interference: DuoCoopInterferenceEvent & { expiresAt: number }) => void): void {
    this.onInterferenceActivate = cb
  }

  setOnInterferenceExpire(cb: (interferenceId: string) => void): void {
    this.onInterferenceExpire = cb
  }

  setOnSyncTargetAchieved(cb: (target: DuoCoopSyncTarget) => void): void {
    this.onSyncTargetAchieved = cb
  }

  setOnStateChange(cb: (state: DuoCoopState) => void): void {
    this.onStateChange = cb
  }

  setOnAllSynced(cb: () => void): void {
    this.onAllSynced = cb
  }

  setOnSharedDrift(cb: (drift: number) => void): void {
    this.onSharedDrift = cb
  }

  getState(): DuoCoopState {
    return {
      ...this.state,
      master: { ...this.state.master },
      slave: { ...this.state.slave },
      activeInterferences: this.state.activeInterferences.map((i) => ({ ...i })),
      syncTargets: this.state.syncTargets.map((t) => ({ ...t })),
    }
  }

  getLevelConfig(): DuoCoopLevelConfig {
    return { ...this.state.levelConfig }
  }

  getMasterCurrent(): ClockTime {
    return { ...this.state.master.currentTime }
  }

  getSlaveCurrent(): ClockTime {
    return { ...this.state.slave.currentTime }
  }

  isLocked(): boolean {
    return this.state.isLocked || this.state.isCompleted
  }

  lock(): void {
    this.state.isCompleted = true
    this.state.isLocked = true
    this.stopInterferenceLoop()
  }

  calculateResult(timeLeft: number): DuoCoopGameResult {
    const syncAchieved = this.state.syncTargets.filter((t) => t.isAchieved).length
    const syncTotal = this.state.syncTargets.length

    const baseScore = 1000
    const alignmentBonus = (this.state.master.isAligned ? 800 : 0) + (this.state.slave.isAligned ? 800 : 0)
    const timeBonus = timeLeft * 6
    const syncBonus = this.state.syncScore
    const accuracyBonus = Math.max(0, Math.floor((1 - this.state.totalDeviation / 720) * 1500))
    const perfectBonus = this.state.allSynced ? 2500 : 0
    const interferenceHandled = this.interferenceCounter
    const cooperationBonus = Math.floor(
      Math.min(this.state.master.operationCount, this.state.slave.operationCount) /
      Math.max(this.state.master.operationCount, this.state.slave.operationCount, 1) * 500,
    )

    const score = Math.floor(
      (baseScore + alignmentBonus + timeBonus + syncBonus + accuracyBonus + perfectBonus + cooperationBonus) *
      this.state.levelConfig.scoreMultiplier,
    )

    return {
      success: this.state.allSynced,
      score,
      timeLeft,
      levelId: this.state.levelConfig.id,
      masterDeviation: this.state.master.deviationMinutes,
      slaveDeviation: this.state.slave.deviationMinutes,
      syncTargetsAchieved: syncAchieved,
      syncTargetsTotal: syncTotal,
      interferencesHandled: interferenceHandled,
      cooperationBonus,
      totalDeviation: this.state.totalDeviation,
    }
  }

  reset(): void {
    this.stopInterferenceLoop()
    this.state = this.initializeState(this.state.levelConfig)
    this.interferenceCounter = 0
    this.onStateChange?.(this.getState())
  }

  destroy(): void {
    this.stopInterferenceLoop()
  }
}
