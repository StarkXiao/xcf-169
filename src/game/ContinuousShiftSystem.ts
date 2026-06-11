import type {
  ShiftResourceState,
  ShiftRunState,
  ShiftNightState,
  ShiftNightResult,
  ShiftGameResult,
  ShiftPhase,
  ShiftResourceType,
  ActiveShiftEffect,
} from '../types/continuousShift'
import {
  SHIFT_NIGHT_CONFIGS,
  INITIAL_RESOURCES,
  MAX_RESOURCES,
  SHIFT_RESOURCES,
} from '../types/continuousShift'
import type { ClockTime, WeatherState, ActiveGearFault, PeriodConfig } from '../types'
import { NIGHT_PERIODS } from './NightPatrolSystem'

const STORAGE_KEY = 'continuous_shift_save'

export interface ContinuousShiftCallbacks {
  onStateChange?: (state: ShiftRunState) => void
  onPhaseChange?: (phase: ShiftPhase) => void
  onNightComplete?: (result: ShiftNightResult) => void
  onGameOver?: (result: ShiftGameResult) => void
  onVictory?: (result: ShiftGameResult) => void
  onResourceChange?: (resources: ShiftResourceState) => void
  onEffectActivated?: (effect: ActiveShiftEffect) => void
  onEffectExpired?: (effectId: string) => void
}

export class ContinuousShiftSystem {
  private state: ShiftRunState
  private callbacks: ContinuousShiftCallbacks
  private saveInterval: number | null = null

  constructor(totalNights: number = 7, callbacks: ContinuousShiftCallbacks = {}) {
    this.callbacks = callbacks
    this.state = this.createInitialState(totalNights)
  }

  private createInitialState(totalNights: number): ShiftRunState {
    const clampedNights = Math.min(Math.max(totalNights, 1), SHIFT_NIGHT_CONFIGS.length)
    return {
      runId: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startedAt: Date.now(),
      totalNights: clampedNights,
      currentNightNumber: 1,
      totalScore: 0,
      bestNightScore: 0,
      perfectNights: 0,
      resources: { ...INITIAL_RESOURCES },
      maxResources: { ...MAX_RESOURCES },
      currentNight: this.createNightState(1, clampedNights),
      phase: 'nightIntro',
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      currentTime: { hours: 12, minutes: 0 },
      targetTime: { hours: 12, minutes: 0 },
      weather: { rain: 'calm', wind: 'calm', lightning: 'calm' },
      activeFaults: [],
      nightHistory: [],
      activeEffects: [],
    }
  }

  private createNightState(nightNumber: number, totalNights: number): ShiftNightState {
    const config = SHIFT_NIGHT_CONFIGS[nightNumber - 1] || SHIFT_NIGHT_CONFIGS[0]
    return {
      nightNumber,
      totalNights,
      currentPeriodIndex: 0,
      totalPeriods: config.periodCount,
      scoreThisNight: 0,
      perfectPeriods: 0,
      faultsHandled: 0,
      timeBonusAccumulated: 0,
      isCompleted: false,
      isPerfect: false,
    }
  }

  getState(): ShiftRunState {
    return { ...this.state }
  }

  getPhase(): ShiftPhase {
    return this.state.phase
  }

  getResources(): ShiftResourceState {
    return { ...this.state.resources }
  }

  getCurrentNightConfig() {
    return SHIFT_NIGHT_CONFIGS[this.state.currentNightNumber - 1] || SHIFT_NIGHT_CONFIGS[0]
  }

  getNightConfig(nightNumber: number) {
    return SHIFT_NIGHT_CONFIGS[nightNumber - 1] || SHIFT_NIGHT_CONFIGS[0]
  }

  getPeriodsForCurrentNight(): PeriodConfig[] {
    const config = this.getCurrentNightConfig()
    const periods: PeriodConfig[] = []
    for (let i = 0; i < config.periodCount; i++) {
      const basePeriod = NIGHT_PERIODS[i % NIGHT_PERIODS.length]
      periods.push({
        ...basePeriod,
        duration: Math.floor(basePeriod.duration * config.difficultyMultiplier),
        faultCount: Math.floor(basePeriod.faultCount * config.difficultyMultiplier),
        scoreMultiplier: basePeriod.scoreMultiplier * config.difficultyMultiplier,
      })
    }
    return periods
  }

  getCurrentPeriod(): PeriodConfig {
    const periods = this.getPeriodsForCurrentNight()
    return periods[this.state.currentNight.currentPeriodIndex] || periods[0]
  }

  setClockTimes(current: ClockTime, target: ClockTime) {
    this.state.currentTime = { ...current }
    this.state.targetTime = { ...target }
  }

  setWeather(weather: WeatherState) {
    this.state.weather = { ...weather }
  }

  setActiveFaults(faults: ActiveGearFault[]) {
    this.state.activeFaults = [...faults]
  }

  startNight() {
    this.state.phase = 'playing'
    this.state.isPaused = false
    this.emitStateChange()
    this.emitPhaseChange()
  }

  pause(reason: string = 'manual') {
    if (this.state.phase !== 'playing') return
    this.state.phase = 'paused'
    this.state.isPaused = true
    this.state.pauseReason = reason
    this.saveToStorage()
    this.emitStateChange()
    this.emitPhaseChange()
  }

  resume() {
    if (this.state.phase !== 'paused') return
    this.state.phase = 'playing'
    this.state.isPaused = false
    this.state.pauseReason = undefined
    this.emitStateChange()
    this.emitPhaseChange()
  }

  useResource(resourceType: ShiftResourceType): boolean {
    if (this.state.resources[resourceType] <= 0) return false

    const resource = SHIFT_RESOURCES[resourceType]
    if (!resource) return false

    switch (resourceType) {
      case 'oil':
        this.addEffect({
          id: `oil_${Date.now()}`,
          type: 'wellOiled',
          name: 'wellOiled',
          displayName: '润滑保护',
          icon: '🛢️',
          expiresAt: Date.now() + 60000,
          effect: { faultResistance: 0.5 },
        })
        break
      case 'repairKit':
        if (this.state.activeFaults.length > 0) {
          this.state.activeFaults = this.state.activeFaults.slice(1)
          this.state.currentNight.faultsHandled++
        } else {
          return false
        }
        break
      case 'coffee':
        this.addEffect({
          id: `coffee_${Date.now()}`,
          type: 'caffeine',
          name: 'caffeine',
          displayName: '咖啡因加持',
          icon: '☕',
          expiresAt: Date.now() + 45000,
          effect: { scoreMultiplier: 1.3 },
        })
        break
      case 'windCharge':
        this.addEffect({
          id: `wind_${Date.now()}`,
          type: 'protected',
          name: 'protected',
          displayName: '风之庇护',
          icon: '💨',
          expiresAt: Date.now() + 90000,
          effect: { toleranceBonus: 10 },
        })
        break
      case 'coal':
        this.state.currentNight.timeBonusAccumulated += 30
        break
    }

    this.state.resources[resourceType]--
    this.emitStateChange()
    this.emitResourceChange()
    return true
  }

  addResources(resources: Partial<ShiftResourceState>) {
    Object.entries(resources).forEach(([key, value]) => {
      const k = key as ShiftResourceType
      if (value !== undefined) {
        const current = this.state.resources[k]
        const max = this.state.maxResources[k]
        this.state.resources[k] = Math.min(current + value, max)
      }
    })
    this.emitStateChange()
    this.emitResourceChange()
  }

  private addEffect(effect: ActiveShiftEffect) {
    this.state.activeEffects.push(effect)
    this.callbacks.onEffectActivated?.(effect)
  }

  updateEffects() {
    const now = Date.now()
    const expired = this.state.activeEffects.filter((e) => e.expiresAt <= now)
    this.state.activeEffects = this.state.activeEffects.filter((e) => e.expiresAt > now)
    expired.forEach((e) => this.callbacks.onEffectExpired?.(e.id))
    if (expired.length > 0) {
      this.emitStateChange()
    }
  }

  getActiveEffects(): ActiveShiftEffect[] {
    return [...this.state.activeEffects]
  }

  getCombinedEffects() {
    let scoreMultiplier = 1
    let faultResistance = 0
    let toleranceBonus = 0

    this.state.activeEffects.forEach((effect) => {
      if (effect.effect.scoreMultiplier) scoreMultiplier *= effect.effect.scoreMultiplier
      if (effect.effect.faultResistance) faultResistance += effect.effect.faultResistance
      if (effect.effect.toleranceBonus) toleranceBonus += effect.effect.toleranceBonus
    })

    return { scoreMultiplier, faultResistance, toleranceBonus }
  }

  recordPeriodScore(score: number, isPerfect: boolean, _timeRemaining: number, _diffMinutes: number) {
    this.state.currentNight.scoreThisNight += score
    if (isPerfect) {
      this.state.currentNight.perfectPeriods++
    }
    this.emitStateChange()
  }

  getScoreMultiplier(): number {
    const nightConfig = this.getCurrentNightConfig()
    const effects = this.getCombinedEffects()
    return nightConfig.difficultyMultiplier * effects.scoreMultiplier
  }

  completePeriod(): boolean {
    this.state.currentNight.currentPeriodIndex++
    if (this.state.currentNight.currentPeriodIndex >= this.state.currentNight.totalPeriods) {
      return false
    }
    this.emitStateChange()
    return true
  }

  completeNight(success: boolean, nightStats: {
    averageDeviation: number
    duration: number
    resourcesSpent: Partial<ShiftResourceState>
  }): ShiftNightResult {
    const night = this.state.currentNight
    const isPerfect = success && night.perfectPeriods === night.totalPeriods

    const result: ShiftNightResult = {
      nightNumber: night.nightNumber,
      success,
      isPerfect,
      score: night.scoreThisNight,
      periodsCleared: night.currentPeriodIndex,
      totalPeriods: night.totalPeriods,
      perfectPeriods: night.perfectPeriods,
      faultsHandled: night.faultsHandled,
      timeBonus: night.timeBonusAccumulated,
      resourcesSpent: nightStats.resourcesSpent,
      resourcesEarned: {},
      averageDeviation: nightStats.averageDeviation,
      completedAt: Date.now(),
      duration: nightStats.duration,
    }

    this.state.nightHistory.push(result)
    this.state.totalScore += night.scoreThisNight

    if (night.scoreThisNight > this.state.bestNightScore) {
      this.state.bestNightScore = night.scoreThisNight
    }

    if (isPerfect) {
      this.state.perfectNights++
    }

    if (success) {
      const config = this.getCurrentNightConfig()
      const reward = { ...config.baseResourceReward }
      if (isPerfect) {
        Object.keys(reward).forEach((k) => {
          const key = k as ShiftResourceType
          if (reward[key]) {
            reward[key] = Math.floor((reward[key] || 0) * 1.5)
          }
        })
      }
      result.resourcesEarned = reward
      this.addResources(reward)
    }

    this.state.currentNight.isCompleted = success
    this.state.currentNight.isPerfect = isPerfect

    this.callbacks.onNightComplete?.(result)

    if (!success || this.state.currentNightNumber >= this.state.totalNights) {
      this.state.isGameOver = !success
      this.state.isVictory = success && this.state.currentNightNumber >= this.state.totalNights
      this.state.phase = 'shiftOver'
      this.clearSave()
      const finalResult = this.buildFinalResult()
      if (this.state.isVictory) {
        this.callbacks.onVictory?.(finalResult)
      } else {
        this.callbacks.onGameOver?.(finalResult)
      }
    } else {
      this.state.phase = 'nightComplete'
    }

    this.emitStateChange()
    this.emitPhaseChange()

    return result
  }

  advanceToNextNight() {
    if (this.state.currentNightNumber >= this.state.totalNights) return
    this.state.currentNightNumber++
    this.state.currentNight = this.createNightState(
      this.state.currentNightNumber,
      this.state.totalNights,
    )
    this.state.activeEffects = []
    this.state.phase = 'nightIntro'
    this.saveToStorage()
    this.emitStateChange()
    this.emitPhaseChange()
  }

  openResourceShop() {
    this.state.phase = 'resourceShop'
    this.emitStateChange()
    this.emitPhaseChange()
  }

  closeResourceShop() {
    this.state.phase = 'nightComplete'
    this.emitStateChange()
    this.emitPhaseChange()
  }

  purchaseResource(resourceType: ShiftResourceType, cost: number): boolean {
    if (this.state.totalScore < cost) return false
    if (this.state.resources[resourceType] >= this.state.maxResources[resourceType]) return false

    this.state.totalScore -= cost
    this.state.resources[resourceType]++
    this.emitStateChange()
    this.emitResourceChange()
    return true
  }

  getResourcePrice(resourceType: ShiftResourceType): number {
    const basePrices: Record<ShiftResourceType, number> = {
      oil: 200,
      coal: 150,
      repairKit: 500,
      coffee: 300,
      windCharge: 400,
    }
    return basePrices[resourceType] || 200
  }

  private buildFinalResult(): ShiftGameResult {
    let totalPeriodsCleared = 0
    let totalPerfectPeriods = 0
    let totalFaultsHandled = 0
    let totalTimeBonus = 0
    let totalDeviation = 0
    let totalDuration = 0

    this.state.nightHistory.forEach((night) => {
      totalPeriodsCleared += night.periodsCleared
      totalPerfectPeriods += night.perfectPeriods
      totalFaultsHandled += night.faultsHandled
      totalTimeBonus += night.timeBonus
      totalDeviation += night.averageDeviation
      totalDuration += night.duration
    })

    return {
      runId: this.state.runId,
      success: this.state.isVictory,
      victory: this.state.isVictory,
      totalScore: this.state.totalScore,
      nightsCompleted: this.state.nightHistory.filter((n) => n.success).length,
      totalNights: this.state.totalNights,
      perfectNights: this.state.perfectNights,
      bestNightScore: this.state.bestNightScore,
      totalPeriodsCleared,
      totalPerfectPeriods,
      totalFaultsHandled,
      totalTimeBonus,
      resourcesRemaining: { ...this.state.resources },
      averageDeviation: this.state.nightHistory.length > 0
        ? totalDeviation / this.state.nightHistory.length
        : 0,
      totalDuration,
      completedAt: Date.now(),
      nightResults: [...this.state.nightHistory],
    }
  }

  saveToStorage() {
    try {
      const saveData = {
        state: this.state,
        savedAt: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
    } catch (e) {
      console.error('Failed to save continuous shift:', e)
    }
  }

  loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const saveData = JSON.parse(raw)
      if (!saveData.state) return false

      this.state = saveData.state
      this.state.phase = 'paused'
      this.state.isPaused = true
      this.state.pauseReason = 'saved'
      this.emitStateChange()
      this.emitPhaseChange()
      return true
    } catch (e) {
      console.error('Failed to load continuous shift:', e)
      return false
    }
  }

  hasSavedGame(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  clearSave() {
    localStorage.removeItem(STORAGE_KEY)
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
    }
  }

  startAutoSave(intervalMs: number = 30000) {
    if (this.saveInterval) clearInterval(this.saveInterval)
    this.saveInterval = window.setInterval(() => {
      if (this.state.phase === 'playing') {
        this.saveToStorage()
      }
    }, intervalMs)
  }

  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval)
      this.saveInterval = null
    }
  }

  private emitStateChange() {
    this.callbacks.onStateChange?.({ ...this.state })
  }

  private emitPhaseChange() {
    this.callbacks.onPhaseChange?.(this.state.phase)
  }

  private emitResourceChange() {
    this.callbacks.onResourceChange?.({ ...this.state.resources })
  }

  destroy() {
    this.stopAutoSave()
  }
}
