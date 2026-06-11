import type {
  CalibrationRecord,
  BestPathRecord,
  ClocktowerLedgerState,
  RecordGameMode,
  BellChimeEvaluation,
  GameResult,
  MultiClockGameResult,
  DuoCoopGameResult,
  GameMode,
} from '../types'

const STORAGE_KEY = 'clocktower_ledger_v1'
const MAX_RECORDS = 100

const DEFAULT_STATE: ClocktowerLedgerState = {
  records: [],
  bestPaths: [],
  totalGamesPlayed: 0,
  totalSuccesses: 0,
  totalScoreEarned: 0,
  totalPerfectClears: 0,
  totalPlayTimeSeconds: 0,
  highestScore: 0,
  fastestClearSeconds: Infinity,
  lowestDeviationMinutes: Infinity,
  highestCombo: 0,
  mostPerfectSnaps: 0,
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export class ClocktowerRecordSystem {
  private state: ClocktowerLedgerState

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): ClocktowerLedgerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ClocktowerLedgerState>
        return {
          ...DEFAULT_STATE,
          ...parsed,
          records: parsed.records ?? [],
          bestPaths: parsed.bestPaths ?? [],
          fastestClearSeconds: parsed.fastestClearSeconds ?? Infinity,
          lowestDeviationMinutes: parsed.lowestDeviationMinutes ?? Infinity,
        }
      }
    } catch (e) {
      console.warn('Failed to load clocktower ledger state', e)
    }
    return { ...DEFAULT_STATE }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save clocktower ledger state', e)
    }
  }

  getState(): ClocktowerLedgerState {
    return {
      ...this.state,
      records: [...this.state.records],
      bestPaths: [...this.state.bestPaths],
    }
  }

  getRecentRecords(limit: number = 20): CalibrationRecord[] {
    return this.state.records
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  getRecordsByMode(mode: RecordGameMode, limit: number = 20): CalibrationRecord[] {
    return this.state.records
      .filter((r) => r.gameMode === mode)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  getBestRecords(limit: number = 10): CalibrationRecord[] {
    return [...this.state.records]
      .filter((r) => r.success)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  getBestPathsByMode(mode: RecordGameMode): BestPathRecord[] {
    return this.state.bestPaths.filter((p) => p.gameMode === mode)
  }

  getBestPath(levelId: string): BestPathRecord | undefined {
    return this.state.bestPaths.find((p) => p.levelId === levelId)
  }

  recordGameResult(
    result: GameResult | MultiClockGameResult | DuoCoopGameResult,
    mode: GameMode | RecordGameMode,
    options: {
      levelId?: string
      levelName?: string
      evaluation?: BellChimeEvaluation
      timeLimit?: number
      gearActions?: Array<{ gearId: number; direction: 1 | -1; timestamp: number }>
      specialBells?: string[]
      weatherConditions?: string
    } = {}
  ): { record: CalibrationRecord; isNewBest: boolean; newBestCategory?: string } {
    const timeUsed = (options.timeLimit ?? 120) - result.timeLeft
    const isPerfect = result.score >= 2500
    const deviation = 'totalDeviation' in result ? result.totalDeviation : (result as any).totalDeviation ?? 0
    const hadFaults = options.evaluation?.details.faultCount ? options.evaluation.details.faultCount > 0 : false

    const record: CalibrationRecord = {
      id: genId(),
      timestamp: Date.now(),
      gameMode: mode as RecordGameMode,
      success: result.success,
      score: result.score,
      timeUsed: Math.max(1, timeUsed),
      timeLimit: options.timeLimit ?? 120,
      deviationMinutes: deviation,
      grade: options.evaluation?.grade,
      isPerfect,
      hadFaults,
      highestCombo: options.evaluation?.details.comboHighest ?? 0,
      perfectSnaps: options.evaluation?.details.perfectSnaps ?? 0,
      totalRotations: options.evaluation?.details.totalRotations ?? 0,
      faultCount: options.evaluation?.details.faultCount ?? 0,
      levelId: options.levelId,
      levelName: options.levelName,
      periodsCleared: 'periodsCleared' in result ? result.periodsCleared : undefined,
      totalPeriods: 'totalPeriods' in result ? result.totalPeriods : undefined,
      pathSteps: options.gearActions?.length,
      gearActions: options.gearActions,
      specialBellsCollected: options.specialBells,
      weatherConditions: options.weatherConditions as any,
    }

    this.state.records.push(record)
    if (this.state.records.length > MAX_RECORDS) {
      this.state.records.shift()
    }

    this.state.totalGamesPlayed++
    this.state.totalPlayTimeSeconds += Math.max(1, timeUsed)

    if (result.success) {
      this.state.totalSuccesses++
      this.state.totalScoreEarned += result.score

      if (isPerfect) {
        this.state.totalPerfectClears++
      }
    }

    let isNewBest = false
    let newBestCategory: string | undefined

    if (result.success && result.score > this.state.highestScore) {
      this.state.highestScore = result.score
      isNewBest = true
      newBestCategory = 'highestScore'
    }

    if (result.success && timeUsed < this.state.fastestClearSeconds) {
      this.state.fastestClearSeconds = timeUsed
      isNewBest = true
      newBestCategory = newBestCategory ? `${newBestCategory},fastestClear` : 'fastestClear'
    }

    if (result.success && deviation < this.state.lowestDeviationMinutes) {
      this.state.lowestDeviationMinutes = deviation
      isNewBest = true
      newBestCategory = newBestCategory ? `${newBestCategory},lowestDeviation` : 'lowestDeviation'
    }

    if (options.evaluation?.details.comboHighest && options.evaluation.details.comboHighest > this.state.highestCombo) {
      this.state.highestCombo = options.evaluation.details.comboHighest
    }

    if (options.evaluation?.details.perfectSnaps && options.evaluation.details.perfectSnaps > this.state.mostPerfectSnaps) {
      this.state.mostPerfectSnaps = options.evaluation.details.perfectSnaps
    }

    const levelId = options.levelId ?? `default_${mode}`
    const existingBest = this.state.bestPaths.find((p) => p.levelId === levelId)

    if (existingBest) {
      existingBest.attempts++
      existingBest.lastPlayedAt = Date.now()

      if (result.success) {
        if (result.score > existingBest.bestScore) {
          existingBest.bestScore = result.score
          existingBest.bestTime = timeUsed
          existingBest.bestDeviation = deviation
          existingBest.bestGrade = options.evaluation?.grade
          existingBest.isPerfect = isPerfect
          if (options.gearActions) {
            existingBest.bestPathActions = options.gearActions.map((a, i) => ({
              gearId: a.gearId,
              direction: a.direction,
              order: i,
            }))
          }
          isNewBest = true
          newBestCategory = newBestCategory ? `${newBestCategory},bestPath` : 'bestPath'
        }
      }
    } else {
      const bestPath: BestPathRecord = {
        id: genId(),
        levelId,
        levelName: options.levelName ?? '经典模式',
        gameMode: mode as RecordGameMode,
        bestScore: result.success ? result.score : 0,
        bestTime: result.success ? timeUsed : Infinity,
        bestDeviation: result.success ? deviation : Infinity,
        bestGrade: options.evaluation?.grade,
        isPerfect: isPerfect && result.success,
        attempts: 1,
        firstClearedAt: result.success ? Date.now() : 0,
        lastPlayedAt: Date.now(),
        bestPathActions: options.gearActions?.map((a, i) => ({
          gearId: a.gearId,
          direction: a.direction,
          order: i,
        })),
      }
      this.state.bestPaths.push(bestPath)
    }

    this.saveState()

    return { record, isNewBest, newBestCategory }
  }

  getStatsSummary() {
    const state = this.state
    return {
      totalGamesPlayed: state.totalGamesPlayed,
      totalSuccesses: state.totalSuccesses,
      totalScoreEarned: state.totalScoreEarned,
      totalPerfectClears: state.totalPerfectClears,
      totalPlayTimeSeconds: state.totalPlayTimeSeconds,
      successRate: state.totalGamesPlayed > 0 ? state.totalSuccesses / state.totalGamesPlayed : 0,
      highestScore: state.highestScore,
      fastestClearSeconds: state.fastestClearSeconds === Infinity ? null : state.fastestClearSeconds,
      lowestDeviationMinutes: state.lowestDeviationMinutes === Infinity ? null : state.lowestDeviationMinutes,
      highestCombo: state.highestCombo,
      mostPerfectSnaps: state.mostPerfectSnaps,
      uniqueLevelsPlayed: state.bestPaths.length,
    }
  }

  getRecordsByDateRange(startDate: number, endDate: number): CalibrationRecord[] {
    return this.state.records.filter(
      (r) => r.timestamp >= startDate && r.timestamp <= endDate
    )
  }

  getGradeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {}
    this.state.records.forEach((r) => {
      if (r.grade) {
        distribution[r.grade] = (distribution[r.grade] || 0) + 1
      }
    })
    return distribution
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE, records: [], bestPaths: [] }
    this.saveState()
  }
}

export const clocktowerRecordSystem = new ClocktowerRecordSystem()
