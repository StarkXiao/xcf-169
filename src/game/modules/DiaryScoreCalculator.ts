import type { KeeperDiaryState, KeeperDiaryEffects } from '../../types'

type EffectsAccessor = () => KeeperDiaryEffects
type StateAccessor = () => KeeperDiaryState
type StateUpdater = (updater: (state: KeeperDiaryState) => void) => void
type SaveCallback = () => void
type UnlockChecker = () => void

export interface GameResultRecord {
  success: boolean
  score: number
  timeUsed: number
  isPerfect: boolean
  hadFaults: boolean
}

export class DiaryScoreCalculator {
  private getState: StateAccessor
  private updateState: StateUpdater
  private getEffects: EffectsAccessor
  private saveState: SaveCallback
  private checkUnlocks: UnlockChecker

  constructor(
    getState: StateAccessor,
    updateState: StateUpdater,
    getEffects: EffectsAccessor,
    saveState: SaveCallback,
    checkUnlocks: UnlockChecker,
  ) {
    this.getState = getState
    this.updateState = updateState
    this.getEffects = getEffects
    this.saveState = saveState
    this.checkUnlocks = checkUnlocks
  }

  recordGameResult(record: GameResultRecord): void {
    const { success, score, timeUsed, isPerfect, hadFaults } = record

    this.updateState((state) => {
      state.stats.totalPlays += 1

      if (success) {
        state.stats.consecutiveWins += 1
        if (state.stats.consecutiveWins > state.stats.bestConsecutiveWins) {
          state.stats.bestConsecutiveWins = state.stats.consecutiveWins
        }

        if (isPerfect) {
          state.stats.perfectClears += 1
        }

        if (!hadFaults) {
          state.stats.noFaultClears += 1
        }

        if (timeUsed < state.stats.fastestClearSeconds) {
          state.stats.fastestClearSeconds = timeUsed
        }
      } else {
        state.stats.consecutiveWins = 0
      }

      const effects = this.getEffects()
      const finalScore = Math.floor(score * effects.scoreMultiplier)
      state.totalDiaryScore += finalScore
    })

    this.saveState()
    this.checkUnlocks()
  }

  getTotalDiaryScore(): number {
    return this.getState().totalDiaryScore
  }

  getStats(): KeeperDiaryState['stats'] {
    return { ...this.getState().stats }
  }

  calculateFinalScore(baseScore: number): number {
    const effects = this.getEffects()
    return Math.floor(baseScore * effects.scoreMultiplier)
  }

  addDiaryScore(amount: number): void {
    this.updateState((state) => {
      state.totalDiaryScore += amount
    })
    this.saveState()
  }

  resetStats(): void {
    this.updateState((state) => {
      state.stats = {
        totalPlays: 0,
        perfectClears: 0,
        consecutiveWins: 0,
        bestConsecutiveWins: 0,
        fastestClearSeconds: 9999,
        noFaultClears: 0,
      }
      state.totalDiaryScore = 0
    })
    this.saveState()
  }
}
