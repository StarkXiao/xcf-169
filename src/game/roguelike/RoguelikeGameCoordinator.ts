import type {
  NightConfig,
  RoguelikeRunState,
  TowerFloor,
  TowerEvent,
  RoguelikePhase,
  RoguelikeGameResult,
  FloorResult,
  TrapType,
  WeatherEventType,
  RewardNodeId,
  ActiveTrap,
} from '../../types/roguelike'
import type { ClockTime } from '../../types'
import { TowerMapSystem } from './TowerMapSystem'
import { EventPoolSystem } from './EventPoolSystem'
import { WeatherEventSystem } from './WeatherEventSystem'
import { RewardTreeSystem } from './RewardTreeSystem'
import { SettlementSystem, type EventResultData } from './SettlementSystem'
import { generateRunId, generateSeed } from './SettlementSystem'

export interface RoguelikeCallbacks {
  onPhaseChange?: (phase: RoguelikePhase) => void
  onStateChange?: (state: RoguelikeRunState) => void
  onFloorChange?: (floor: TowerFloor) => void
  onEventChange?: (event: TowerEvent | null) => void
  onHealthChange?: (current: number, max: number, delta: number) => void
  onScoreChange?: (score: number, totalScore: number) => void
  onGameOver?: (result: RoguelikeGameResult) => void
  onVictory?: (result: RoguelikeGameResult) => void
  onTrapTriggered?: (trap: TrapType, gearId: number) => void
  onWeatherTriggered?: (weather: WeatherEventType) => void
  onRewardUnlocked?: (reward: RewardNodeId) => void
}

const BASE_MAX_HEALTH = 100

export function generateNightConfig(nightNumber: number, totalNights: number = 7): NightConfig {
  const allWeathers: WeatherEventType[] = [
    'timewarp', 'clockPhantom', 'cursedWind', 'ironRain', 'thunderRumble', 'mirrorShard', 'lostSecond',
  ]
  const allTraps: TrapType[] = [
    'gearJam', 'timeSlip', 'reverseSpin', 'frostLock', 'springSnap', 'pendulumSwing', 'cogMisalign', 'bellEcho',
  ]

  const difficulty = nightNumber
  const floorCount = Math.min(8, 4 + Math.floor(nightNumber / 2))

  const weatherPool = allWeathers.slice(0, Math.min(allWeathers.length, 3 + Math.floor(nightNumber / 2)))
  const trapPool = allTraps.slice(0, Math.min(allTraps.length, 3 + nightNumber))

  const bossFloor = `floor_${floorCount}`
  const eliteFloors: string[] = []
  if (floorCount >= 4) eliteFloors.push(`floor_${Math.floor(floorCount / 2)}`)
  if (floorCount >= 6) eliteFloors.push(`floor_${floorCount - 1}`)

  return {
    nightNumber,
    totalNights,
    baseDifficulty: difficulty,
    weatherPool,
    trapPool,
    floorCount,
    eventDensity: 0.3 + nightNumber * 0.1,
    bossFloor,
    eliteFloors,
    rewardPointsPerNight: 2 + Math.floor(nightNumber / 2),
  }
}

export class RoguelikeGameCoordinator {
  private state: RoguelikeRunState
  private phase: RoguelikePhase = 'mapView'

  private mapSystem: TowerMapSystem
  private eventPoolSystem: EventPoolSystem
  private weatherSystem: WeatherEventSystem
  private rewardTree: RewardTreeSystem
  private settlementSystem: SettlementSystem

  private callbacks: RoguelikeCallbacks
  private floorEventsCache: Map<string, TowerEvent[]> = new Map()
  private currentFloorEvents: TowerEvent[] = []
  private runStartTime = 0

  private currentTime: ClockTime = { hours: 12, minutes: 0 }
  private targetTime: ClockTime = { hours: 12, minutes: 0 }
  private eventTimeLeft = 0
  private eventTotalTime = 0

  constructor(nightNumber: number = 1, totalNights: number = 7, callbacks: RoguelikeCallbacks = {}) {
    const nightConfig = generateNightConfig(nightNumber, totalNights)
    const seed = generateSeed()
    const runId = generateRunId()

    this.callbacks = callbacks
    this.mapSystem = new TowerMapSystem(seed, nightConfig)
    this.eventPoolSystem = new EventPoolSystem(seed, nightConfig)
    this.weatherSystem = new WeatherEventSystem()
    this.rewardTree = new RewardTreeSystem(nightConfig.rewardPointsPerNight)
    this.settlementSystem = new SettlementSystem()

    const map = this.mapSystem.generateMap()
    const firstFloor = map[0]

    this.state = {
      runId,
      seed,
      currentFloorId: firstFloor?.id || '',
      currentEventIndex: 0,
      nightNumber,
      totalNights,
      health: BASE_MAX_HEALTH,
      maxHealth: BASE_MAX_HEALTH,
      score: 0,
      totalScore: 0,
      currentEventId: null,
      map,
      events: [],
      activeTraps: [],
      activeWeathers: [],
      rewardTree: this.rewardTree.getState(),
      floorsCleared: 0,
      eventsCompleted: 0,
      isGameOver: false,
      isVictory: false,
      elapsedMs: 0,
      createdAt: Date.now(),
    }

    if (firstFloor) {
      this.prepareFloorEvents(firstFloor)
    }

    this.runStartTime = performance.now()
  }

  getState(): RoguelikeRunState {
    return { ...this.state }
  }

  getPhase(): RoguelikePhase {
    return this.phase
  }

  getCurrentFloor(): TowerFloor | undefined {
    return this.mapSystem.getFloorById(this.state.map, this.state.currentFloorId)
  }

  getCurrentEvent(): TowerEvent | null {
    if (!this.state.currentEventId) return null
    return this.currentFloorEvents.find((e) => e.id === this.state.currentEventId) || null
  }

  getFloorEvents(floorId: string): TowerEvent[] {
    return this.floorEventsCache.get(floorId) || []
  }

  getCurrentFloorEvents(): TowerEvent[] {
    return this.currentFloorEvents
  }

  getWeatherSystem(): WeatherEventSystem {
    return this.weatherSystem
  }

  getRewardTree(): RewardTreeSystem {
    return this.rewardTree
  }

  getSettlementSystem(): SettlementSystem {
    return this.settlementSystem
  }

  getEventTimeLeft(): number {
    return this.eventTimeLeft
  }

  getEventTotalTime(): number {
    return this.eventTotalTime
  }

  getCurrentTime(): ClockTime {
    return { ...this.currentTime }
  }

  getTargetTime(): ClockTime {
    return { ...this.targetTime }
  }

  private setPhase(phase: RoguelikePhase): void {
    this.phase = phase
    this.callbacks.onPhaseChange?.(phase)
  }

  private emitState(): void {
    this.callbacks.onStateChange?.(this.getState())
  }

  private prepareFloorEvents(floor: TowerFloor): void {
    const offset = this.state.seed + floor.level * 9999
    const events = this.eventPoolSystem.generateEventsForFloor(floor, offset)
    this.floorEventsCache.set(floor.id, events)
  }

  selectFloor(floorId: string): boolean {
    if (this.phase !== 'mapView') return false
    const floor = this.mapSystem.getFloorById(this.state.map, floorId)
    if (!floor) return false
    if (!floor.unlocked) return false

    this.state.currentFloorId = floorId
    this.state.currentEventIndex = 0
    this.currentFloorEvents = this.floorEventsCache.get(floorId) || []

    if (this.currentFloorEvents.length === 0) {
      this.prepareFloorEvents(floor)
      this.currentFloorEvents = this.floorEventsCache.get(floorId) || []
    }

    if (!floor.visited) {
      this.state.map = this.state.map.map((f) =>
        f.id === floorId ? { ...f, visited: true } : f,
      )
    }

    this.callbacks.onFloorChange?.(floor)
    this.emitState()
    return true
  }

  startEvent(eventIndex: number): boolean {
    if (this.phase !== 'mapView' && this.phase !== 'eventResult' && this.phase !== 'rewardSelect') return false
    if (eventIndex < 0 || eventIndex >= this.currentFloorEvents.length) return false

    const event = this.currentFloorEvents[eventIndex]
    if (!event) return false

    this.state.currentEventIndex = eventIndex
    this.state.currentEventId = event.id
    this.state.events = this.currentFloorEvents

    this.eventTotalTime = event.duration
    this.eventTimeLeft = event.duration + this.rewardTree.getTimeBonusPerEvent()

    this.generateTimesForEvent(event)
    this.setupEventTraps(event)
    this.setupEventWeathers(event)

    if (this.rewardTree.shouldClearTraps()) {
      this.state.activeTraps = []
    }

    this.callbacks.onEventChange?.(event)
    this.setPhase('eventIntro')
    this.emitState()

    setTimeout(() => {
      this.setPhase('playing')
      this.emitState()
    }, 2000)

    return true
  }

  private generateTimesForEvent(event: TowerEvent): void {
    const currentMinutes = Math.floor(Math.random() * 720)
    this.currentTime = {
      hours: Math.floor(currentMinutes / 60) || 12,
      minutes: currentMinutes % 60,
    }

    const offset = event.targetTimeOffset || 180
    const direction = Math.random() > 0.5 ? 1 : -1
    let targetMinutes = (currentMinutes + direction * offset + 720) % 720
    if (targetMinutes === 0) targetMinutes = 720
    this.targetTime = {
      hours: Math.floor(targetMinutes / 60) || 12,
      minutes: targetMinutes % 60,
    }
  }

  private setupEventTraps(event: TowerEvent): void {
    if (!event.traps || event.traps.length === 0) {
      this.state.activeTraps = []
      return
    }

    const now = performance.now()
    const activeTraps: ActiveTrap[] = []
    const gearCount = 4

    event.traps.forEach((trapType, idx) => {
      if (this.rewardTree.shouldResistFault()) return
      const config = this.eventPoolSystem.getTrapConfig(trapType)
      activeTraps.push({
        trapId: trapType,
        gearId: (idx % gearCount) + 1,
        startAt: now,
        expiresAt: now + (config?.duration || 15000),
      })
    })

    this.state.activeTraps = activeTraps
  }

  private setupEventWeathers(event: TowerEvent): void {
    this.weatherSystem.clearAllWeathers()
    this.state.activeWeathers = []

    if (!event.weatherTriggers || event.weatherTriggers.length === 0) return

    if (this.rewardTree.shouldIgnoreWeather()) return

    event.weatherTriggers.forEach((weatherId) => {
      const active = this.weatherSystem.triggerWeather(weatherId)
      if (active) {
        this.state.activeWeathers.push(active)
        this.callbacks.onWeatherTriggered?.(weatherId)
      }
    })
  }

  updateEventTime(deltaMs: number): void {
    if (this.phase !== 'playing') return
    this.eventTimeLeft = Math.max(0, this.eventTimeLeft - deltaMs / 1000)
    this.weatherSystem.expireWeathers()
    this.expireTraps()

    if (this.eventTimeLeft <= 0) {
      this.completeEvent(false)
    }
  }

  private expireTraps(): void {
    const now = performance.now()
    this.state.activeTraps = this.state.activeTraps.filter((t) => t.expiresAt > now)
  }

  tickClock(minutesDelta: number): ClockTime {
    if (this.phase !== 'playing') return this.currentTime

    let delta = minutesDelta
    delta = this.weatherSystem.applySpeedMultiplier(delta)
    delta = this.rewardTree.applyEfficiencyBonus(delta)

    if (this.weatherSystem.shouldReverseControls()) {
      delta = -delta
    }

    const currentMin = this.currentTime.hours * 60 + this.currentTime.minutes
    let newMin = Math.round(currentMin + delta)
    newMin = ((newMin - 1) % 720 + 720) % 720 + 1

    this.currentTime = {
      hours: Math.floor(newMin / 60) || 12,
      minutes: newMin % 60,
    }

    return this.currentTime
  }

  checkEventComplete(): boolean {
    if (this.phase !== 'playing') return false
    const diff = this.getTimeDiffMinutes()
    const tolerance = 5 + this.rewardTree.getToleranceBonus()
    return diff <= tolerance
  }

  getTimeDiffMinutes(): number {
    const currentMin = this.currentTime.hours * 60 + this.currentTime.minutes
    const targetMin = this.targetTime.hours * 60 + this.targetTime.minutes
    let diff = Math.abs(currentMin - targetMin)
    if (diff > 360) diff = 720 - diff
    return diff
  }

  completeEvent(forceSuccess: boolean = false): EventResultData | null {
    const event = this.getCurrentEvent()
    if (!event) return null

    const diff = this.getTimeDiffMinutes()
    const tolerance = 5 + this.rewardTree.getToleranceBonus()
    const success = forceSuccess || diff <= tolerance
    const isPerfect = diff === 0

    const timeRemaining = this.eventTimeLeft
    const bonusMultiplier = success ? 1 : 0.5
    const scoreBreakdown = this.settlementSystem.calculateEventScore(
      event, diff, timeRemaining, this.eventTotalTime, bonusMultiplier,
    )

    let damageTaken = 0
    if (!success) {
      damageTaken = this.settlementSystem.calculateDamageFromTraps(
        event.traps || [],
      ) * 0.5
    } else if (!isPerfect) {
      damageTaken = Math.floor(diff * 0.5)
    }
    damageTaken = this.rewardTree.applyDamageReduction(damageTaken)

    const scoreGained = Math.max(0, scoreBreakdown.total - damageTaken * 5)
    this.state.score = scoreGained
    this.state.totalScore += scoreGained

    if (damageTaken > 0) {
      this.applyDamage(damageTaken)
    }

    if (success) {
      const heal = this.rewardTree.getTotalHealPerEvent()
      if (heal > 0) {
        this.heal(heal)
      }
    }

    const perfectBonus = isPerfect ? this.rewardTree.getPerfectBonus() : 0
    if (perfectBonus > 0) {
      this.state.score += perfectBonus
      this.state.totalScore += perfectBonus
    }

    const appliedScore = this.rewardTree.applyScoreMultiplier(this.state.score)
    this.state.score = appliedScore
    this.state.totalScore = this.state.totalScore - scoreGained + appliedScore

    const trapsTriggered = [...(event.traps || [])]
    const weathersEncountered = [...(event.weatherTriggers || [])]
    const rewardsEarned = success ? (event.rewards?.slice(0, isPerfect ? 3 : 2) || []) : []

    rewardsEarned.forEach((r) => {
      this.rewardTree.forceUnlock(r)
      this.callbacks.onRewardUnlocked?.(r)
    })
    this.state.rewardTree = this.rewardTree.getState()

    const result: EventResultData = {
      eventId: event.id,
      success,
      isPerfect,
      scoreGained: this.state.score,
      timeRemaining,
      timeUsed: this.eventTotalTime - timeRemaining,
      accuracy: Math.max(0, 100 - diff * 2),
      diffMinutes: diff,
      damageTaken,
      trapsTriggered,
      weathersEncountered,
      rewardsEarned,
    }

    this.settlementSystem.recordEventResult(result)
    this.state.eventsCompleted++

    this.callbacks.onScoreChange?.(this.state.score, this.state.totalScore)
    this.setPhase('eventResult')
    this.emitState()

    return result
  }

  goToRewardSelect(): boolean {
    if (this.phase !== 'eventResult') return false
    this.setPhase('rewardSelect')
    this.emitState()
    return true
  }

  purchaseReward(rewardId: RewardNodeId): boolean {
    if (this.phase !== 'rewardSelect') return false
    const success = this.rewardTree.unlockNode(rewardId)
    if (success) {
      this.state.rewardTree = this.rewardTree.getState()
      this.callbacks.onRewardUnlocked?.(rewardId)
      this.emitState()
    }
    return success
  }

  advanceToNextEvent(): boolean {
    if (this.phase !== 'rewardSelect' && this.phase !== 'eventResult') return false

    const nextIndex = this.state.currentEventIndex + 1
    if (nextIndex < this.currentFloorEvents.length) {
      this.setPhase('mapView')
      this.state.currentEventId = null
      this.emitState()
      return true
    }

    return this.completeFloor()
  }

  completeFloor(): boolean {
    const floor = this.getCurrentFloor()
    if (!floor) return false

    const eventsCleared = this.currentFloorEvents.filter((e) => {
      const r = this.settlementSystem.getEventResult(e.id)
      return r?.success
    }).length

    const damageTaken = this.settlementSystem.calculateDamageFromTraps(
      this.currentFloorEvents.flatMap((e) => e.traps || []),
    )

    const result: FloorResult = {
      floorId: floor.id,
      cleared: true,
      eventsCleared,
      totalEvents: this.currentFloorEvents.length,
      scoreGained: this.state.score,
      damageTaken,
      healthRemaining: this.state.health,
      perfectCount: this.currentFloorEvents.filter((e) =>
        this.settlementSystem.getEventResult(e.id)?.isPerfect,
      ).length,
      trapsEncountered: this.currentFloorEvents.flatMap((e) => e.traps || []),
      weathersEncountered: this.currentFloorEvents.flatMap((e) => e.weatherTriggers || []),
      rewardsSelected: Array.from(new Set(this.currentFloorEvents.flatMap((e) => e.rewards || []))),
    }

    this.settlementSystem.recordFloorResult(result)
    this.state.floorsCleared++

    const clearedPoints = 1 + Math.floor(eventsCleared / 2)
    this.rewardTree.addPoints(clearedPoints)
    this.state.rewardTree = this.rewardTree.getState()

    this.state.map = this.mapSystem.unlockNextFloors(this.state.map, floor.id)

    if (this.rewardTree.shouldUnlockAllFloors()) {
      this.state.map = this.state.map.map((f) => ({ ...f, unlocked: true }))
    }

    this.setPhase('floorComplete')
    this.emitState()
    return true
  }

  advanceFromFloorComplete(): boolean {
    if (this.phase !== 'floorComplete') return false

    if (this.mapSystem.isLastFloor(this.state.map, this.state.currentFloorId)) {
      return this.triggerVictory()
    }

    this.setPhase('mapView')
    this.state.currentEventId = null
    this.state.score = 0
    this.emitState()
    return true
  }

  applyDamage(amount: number): void {
    if (amount <= 0) return
    this.state.health = Math.max(0, this.state.health - amount)
    this.callbacks.onHealthChange?.(this.state.health, this.state.maxHealth, -amount)

    if (this.state.health <= 0) {
      this.triggerGameOver()
    }
    this.emitState()
  }

  heal(amount: number): void {
    if (amount <= 0) return
    const actual = Math.min(amount, this.state.maxHealth - this.state.health)
    this.state.health += actual
    this.callbacks.onHealthChange?.(this.state.health, this.state.maxHealth, actual)
    this.emitState()
  }

  private triggerGameOver(): boolean {
    if (this.state.isGameOver) return false
    this.state.isGameOver = true
    this.state.isVictory = false

    const elapsed = performance.now() - this.runStartTime
    this.state.elapsedMs = elapsed

    const result = this.settlementSystem.calculateFinalResult(this.state, elapsed)
    this.callbacks.onGameOver?.(result)
    this.setPhase('gameOver')
    this.emitState()
    return true
  }

  private triggerVictory(): boolean {
    if (this.state.isVictory) return false
    this.state.isVictory = true
    this.state.isGameOver = true

    const victoryBonus = 5000
    this.state.score += victoryBonus
    this.state.totalScore += victoryBonus

    const elapsed = performance.now() - this.runStartTime
    this.state.elapsedMs = elapsed

    const result = this.settlementSystem.calculateFinalResult(this.state, elapsed)
    this.callbacks.onVictory?.(result)
    this.setPhase('victory')
    this.emitState()
    return true
  }

  getFinalResult(): RoguelikeGameResult | null {
    if (!this.state.isGameOver) return null
    return this.settlementSystem.calculateFinalResult(
      this.state,
      this.state.elapsedMs,
    )
  }

  getGrade(): { grade: string; color: string } | null {
    const result = this.getFinalResult()
    if (!result) return null
    return this.settlementSystem.getGrade(result)
  }

  getAchievements() {
    const result = this.getFinalResult()
    if (!result) return []
    return this.settlementSystem.getAchievements(result)
  }

  getRunTips(): string[] {
    const result = this.getFinalResult()
    if (!result) return []
    return this.settlementSystem.getTips(result)
  }

  destroy(): void {
    this.weatherSystem.reset()
    this.settlementSystem.reset()
  }
}
