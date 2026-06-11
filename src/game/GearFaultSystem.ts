import type {
  GearFaultType,
  ActiveGearFault,
  RepairToolType,
  ActiveRepair,
  FaultRepairResult,
  GearFaultHint,
  DifficultyLevel,
} from '../types'
import { REPAIR_TOOLS, DifficultySystem, difficultySystem } from './DifficultySystem'

export interface GearFaultCallbacks {
  onFaultSpawned?: (fault: ActiveGearFault) => void
  onFaultExpired?: (fault: ActiveGearFault) => void
  onRepairStart?: (repair: ActiveRepair) => void
  onRepairProgress?: (gearId: number, progress: number) => void
  onRepairComplete?: (result: FaultRepairResult) => void
  onHintGenerated?: (hints: GearFaultHint[]) => void
}

export const FAULT_DESCRIPTIONS: Record<GearFaultType, string> = {
  none: '正常',
  jam: '卡滞',
  slip: '打滑',
  reverse: '反转',
  freeze: '冻结',
}

export const FAULT_HINTS: Record<GearFaultType, string[]> = {
  none: ['运转正常'],
  jam: [
    '齿轮似乎卡住了，尝试用扳手松动一下',
    '听到嘎吱声，可能需要润滑',
    '齿轮无法转动，检查是否有异物',
  ],
  slip: [
    '齿轮在打滑，摩擦力不够',
    '转动时感觉空转，需要加油',
    '传动效率降低，检查齿轮咬合',
  ],
  reverse: [
    '齿轮转向不对，可能内部机构错位',
    '时间在倒退，需要校正方向',
    '反转传动，尝试敲击复位',
  ],
  freeze: [
    '齿轮完全冻住了，需要强力解冻',
    '极端天气导致齿轮冻结',
    '完全无法转动，需要用检测仪诊断',
  ],
}

export class GearFaultSystem {
  private gearIds: number[] = []
  private activeFaults: Map<number, ActiveGearFault> = new Map()
  private activeRepairs: Map<number, ActiveRepair> = new Map()
  private toolCooldowns: Map<RepairToolType, number> = new Map()
  private callbacks: GearFaultCallbacks = {}
  private difficulty: DifficultySystem = difficultySystem
  private lastSpawnTime = 0
  private baseSpawnInterval = 15000
  private faultExpireBaseTime = 20000
  private totalFaultsSpawned = 0
  private totalRepairsAttempted = 0
  private totalRepairsSuccessful = 0
  private started = false
  private repairProgressInterval: number | null = null

  constructor(gearIds: number[] = [], callbacks: GearFaultCallbacks = {}) {
    this.gearIds = gearIds
    this.callbacks = callbacks
  }

  setGearCount(count: number): void {
    this.gearIds = Array.from({ length: count }, (_, i) => i)
  }

  setGearIds(ids: number[]): void {
    this.gearIds = ids
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.lastSpawnTime = performance.now()
    this.startRepairProgressLoop()
  }

  stop(): void {
    this.started = false
    this.stopRepairProgressLoop()
  }

  private startRepairProgressLoop(): void {
    this.stopRepairProgressLoop()
    this.repairProgressInterval = window.setInterval(() => {
      this.activeRepairs.forEach((_, gearId) => {
        const progress = this.getRepairProgress(gearId)
        this.callbacks.onRepairProgress?.(gearId, progress)
      })
    }, 100)
  }

  private stopRepairProgressLoop(): void {
    if (this.repairProgressInterval !== null) {
      clearInterval(this.repairProgressInterval)
      this.repairProgressInterval = null
    }
  }

  getActiveFault(gearId: number): ActiveGearFault | undefined {
    const now = performance.now()
    const fault = this.activeFaults.get(gearId)
    return fault && fault.expiresAt > now ? fault : undefined
  }

  isRepairInProgress(gearId: number): boolean {
    return this.activeRepairs.has(gearId)
  }

  getActiveRepairsUI(): { gearId: number; progress: number; toolType: string }[] {
    return Array.from(this.activeRepairs.values()).map((repair) => ({
      gearId: repair.gearId,
      progress: this.getRepairProgress(repair.gearId),
      toolType: repair.toolType,
    }))
  }

  getToolCooldownsUI(): Record<string, number> {
    const result: Record<string, number> = {}
    REPAIR_TOOLS.forEach((tool) => {
      result[tool.id] = this.getToolCooldown(tool.id)
    })
    return result
  }

  setDifficulty(level: DifficultyLevel): void {
    this.difficulty.setDifficulty(level)
    this.updateHints()
  }

  setCallbacks(callbacks: GearFaultCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  getActiveFaults(): ActiveGearFault[] {
    const now = performance.now()
    return Array.from(this.activeFaults.values()).filter((f) => f.expiresAt > now)
  }

  getActiveRepairs(): ActiveRepair[] {
    return Array.from(this.activeRepairs.values())
  }

  getGearFault(gearId: number): GearFaultType {
    const now = performance.now()
    const fault = this.activeFaults.get(gearId)
    return fault && fault.expiresAt > now ? fault.type : 'none'
  }

  isGearFaulted(gearId: number): boolean {
    return this.getGearFault(gearId) !== 'none'
  }

  isGearBeingRepaired(gearId: number): boolean {
    return this.activeRepairs.has(gearId)
  }

  getRepairProgress(gearId: number): number {
    const repair = this.activeRepairs.get(gearId)
    if (!repair) return 0
    const now = performance.now()
    const elapsed = now - repair.startedAt
    return Math.min(1, elapsed / repair.durationMs)
  }

  getToolCooldown(toolType: RepairToolType): number {
    const lastUse = this.toolCooldowns.get(toolType) ?? 0
    const tool = REPAIR_TOOLS.find((t) => t.id === toolType)
    if (!tool) return 0
    const now = performance.now()
    const remaining = lastUse + tool.cooldownMs - now
    return Math.max(0, remaining)
  }

  isToolAvailable(toolType: RepairToolType): boolean {
    return this.getToolCooldown(toolType) <= 0
  }

  getAvailableTools() {
    return REPAIR_TOOLS.map((tool) => ({
      ...tool,
      cooldownRemaining: this.getToolCooldown(tool.id),
      isAvailable: this.isToolAvailable(tool.id),
    }))
  }

  spawnFault(gearId?: number, faultType?: GearFaultType): ActiveGearFault | null {
    const activeCount = this.getActiveFaults().length
    if (!this.difficulty.canSpawnFault(activeCount)) {
      return null
    }

    let targetGearId = gearId
    if (targetGearId === undefined) {
      const availableGears = this.gearIds.filter((id) => !this.isGearFaulted(id))
      if (availableGears.length === 0) return null
      targetGearId = availableGears[Math.floor(Math.random() * availableGears.length)]
    }

    if (this.isGearFaulted(targetGearId)) {
      return null
    }

    const type = faultType ?? this.difficulty.getRandomFaultType()
    const baseDuration = this.faultExpireBaseTime
    const duration = this.difficulty.adjustFaultDuration(baseDuration)

    const fault: ActiveGearFault = {
      gearId: targetGearId,
      type,
      expiresAt: performance.now() + duration,
    }

    this.activeFaults.set(targetGearId, fault)
    this.totalFaultsSpawned++
    this.callbacks.onFaultSpawned?.(fault)
    this.updateHints()

    return fault
  }

  clearFault(gearId: number): boolean {
    const fault = this.activeFaults.get(gearId)
    if (!fault) return false

    this.activeFaults.delete(gearId)
    this.callbacks.onFaultExpired?.(fault)
    this.updateHints()
    return true
  }

  startRepair(gearId: number, toolType: RepairToolType): boolean {
    if (this.isGearBeingRepaired(gearId)) return false
    if (!this.isGearFaulted(gearId)) return false
    if (!this.isToolAvailable(toolType)) return false

    const tool = REPAIR_TOOLS.find((t) => t.id === toolType)
    if (!tool) return false

    const faultType = this.getGearFault(gearId)
    if (!tool.effectiveFaults.includes(faultType)) {
      return false
    }

    const baseDuration = tool.repairTimeMs
    const duration = this.difficulty.adjustRepairTime(baseDuration)

    const repair: ActiveRepair = {
      gearId,
      toolType,
      startedAt: performance.now(),
      durationMs: duration,
    }

    this.activeRepairs.set(gearId, repair)
    this.toolCooldowns.set(toolType, performance.now())
    this.totalRepairsAttempted++

    this.callbacks.onRepairStart?.(repair)

    setTimeout(() => {
      this.completeRepair(gearId)
    }, duration)

    return true
  }

  private completeRepair(gearId: number): void {
    const repair = this.activeRepairs.get(gearId)
    if (!repair) return

    const tool = REPAIR_TOOLS.find((t) => t.id === repair.toolType)
    const faultType = this.getGearFault(gearId)

    if (!tool || faultType === 'none') {
      this.activeRepairs.delete(gearId)
      return
    }

    const success = Math.random() < tool.successRate
    const timeTaken = performance.now() - repair.startedAt

    const result: FaultRepairResult = {
      success,
      gearId,
      faultType,
      toolUsed: repair.toolType,
      timeTakenMs: timeTaken,
    }

    this.activeRepairs.delete(gearId)

    if (success) {
      this.clearFault(gearId)
      this.totalRepairsSuccessful++
    }

    this.callbacks.onRepairComplete?.(result)
  }

  cancelRepair(gearId: number): boolean {
    if (!this.activeRepairs.has(gearId)) return false
    this.activeRepairs.delete(gearId)
    return true
  }

  update(): void {
    const now = performance.now()

    const expiredFaults: ActiveGearFault[] = []
    this.activeFaults.forEach((fault) => {
      if (fault.expiresAt <= now) {
        expiredFaults.push(fault)
      }
    })

    expiredFaults.forEach((fault) => {
      this.activeFaults.delete(fault.gearId)
      this.callbacks.onFaultExpired?.(fault)
    })

    if (expiredFaults.length > 0) {
      this.updateHints()
    }

    if (this.started) {
      this.trySpawnFault()
    }
  }

  private trySpawnFault(): void {
    const now = performance.now()
    const frequency = this.difficulty.getFaultFrequency()
    const spawnInterval = this.baseSpawnInterval / frequency

    if (now - this.lastSpawnTime < spawnInterval) return

    this.lastSpawnTime = now

    if (Math.random() < 0.6) {
      this.spawnFault()
    }
  }

  getFaultHints(): GearFaultHint[] {
    const hints: GearFaultHint[] = []
    const hintLevel = this.difficulty.getHintLevel()

    if (hintLevel === 0) return hints

    this.activeFaults.forEach((fault) => {
      const hintTexts = FAULT_HINTS[fault.type]
      const remainingTime = fault.expiresAt - performance.now()
      const totalDuration = this.difficulty.adjustFaultDuration(this.faultExpireBaseTime)
      const progress = 1 - remainingTime / totalDuration

      let severity: 'low' | 'medium' | 'high' = 'low'
      if (progress > 0.7) severity = 'high'
      else if (progress > 0.3) severity = 'medium'

      const hintIndex = Math.min(Math.floor(progress * hintTexts.length), hintTexts.length - 1)

      const hint: GearFaultHint = {
        gearId: fault.gearId,
        faultType: fault.type,
        severity,
        hintText: hintTexts[hintIndex],
      }

      if (hintLevel >= 3) {
        const bestTool = REPAIR_TOOLS.find((t) =>
          t.effectiveFaults.includes(fault.type) && t.successRate >= 0.85,
        )
        hint.recommendedTool = bestTool?.id
      }

      if (hintLevel === 1) {
        hint.hintText = FAULT_DESCRIPTIONS[fault.type]
      }

      hints.push(hint)
    })

    return hints
  }

  private updateHints(): void {
    this.callbacks.onHintGenerated?.(this.getFaultHints())
  }

  getFaultEffect(gearId: number, direction: 1 | -1): {
    direction: 1 | -1
    skip: boolean
    multiplier: number
  } {
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

  getStats() {
    return {
      totalFaultsSpawned: this.totalFaultsSpawned,
      totalRepairsAttempted: this.totalRepairsAttempted,
      totalRepairsSuccessful: this.totalRepairsSuccessful,
      activeFaults: this.getActiveFaults().length,
      activeRepairs: this.activeRepairs.size,
      repairSuccessRate:
        this.totalRepairsAttempted > 0
          ? this.totalRepairsSuccessful / this.totalRepairsAttempted
          : 0,
    }
  }

  reset(): void {
    this.activeFaults.clear()
    this.activeRepairs.clear()
    this.toolCooldowns.clear()
    this.lastSpawnTime = 0
    this.totalFaultsSpawned = 0
    this.totalRepairsAttempted = 0
    this.totalRepairsSuccessful = 0
  }

  destroy(): void {
    this.reset()
    this.callbacks = {}
  }
}
