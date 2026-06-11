import type {
  BellChimeGrade,
  BellChimeEvaluation,
  BellChimeGradeConfig,
  BellChimeEvaluationState,
  GameplayActionRecord,
  GameplayReplayData,
  ClockTime,
} from '../types'

const STORAGE_KEY = 'clocktower_bell_chime_eval_v1'

export const BELL_GRADE_CONFIGS: Record<BellChimeGrade, BellChimeGradeConfig> = {
  S: {
    grade: 'S',
    name: '完美钟声',
    description: '零偏差、极速、行云流水——传说中的完美校时！',
    color: '#ffd700',
    minScore: 900,
    scoreMultiplier: 1.5,
    bellPresetId: 'preset_grandeur',
    particleCount: 50,
    vibrationIntensity: 0.5,
  },
  A: {
    grade: 'A',
    name: '悠扬钟声',
    description: '精准、迅捷、节奏流畅——优秀的守钟人！',
    color: '#c9a96a',
    minScore: 750,
    scoreMultiplier: 1.25,
    bellPresetId: 'preset_festive',
    particleCount: 30,
    vibrationIntensity: 0.3,
  },
  B: {
    grade: 'B',
    name: '清脆钟声',
    description: '干净利落的校时，不错的表现！',
    color: '#7ec97e',
    minScore: 550,
    scoreMultiplier: 1.1,
    bellPresetId: 'preset_elegant',
    particleCount: 20,
    vibrationIntensity: 0.2,
  },
  C: {
    grade: 'C',
    name: '平稳钟声',
    description: '中规中矩的校时，还有提升空间。',
    color: '#7a9ec9',
    minScore: 350,
    scoreMultiplier: 1.0,
    particleCount: 10,
    vibrationIntensity: 0.1,
  },
  D: {
    grade: 'D',
    name: '沉闷钟声',
    description: '勉强完成校准，需要多加练习。',
    color: '#a89070',
    minScore: 150,
    scoreMultiplier: 0.9,
    particleCount: 5,
    vibrationIntensity: 0.05,
  },
  F: {
    grade: 'F',
    name: '失准钟声',
    description: '钟声失准了...不要气馁，重新来过！',
    color: '#c96a6a',
    minScore: 0,
    scoreMultiplier: 0.5,
    particleCount: 2,
    vibrationIntensity: 0.02,
  },
}

export class BellChimeEvaluationSystem {
  private state: BellChimeEvaluationState
  private replayHistory: GameplayReplayData[] = []

  constructor() {
    this.state = this.createInitialState()
    this.loadReplayHistory()
  }

  private createInitialState(): BellChimeEvaluationState {
    return {
      currentCombo: 0,
      highestCombo: 0,
      perfectSnaps: 0,
      totalRotations: 0,
      faultCount: 0,
      startTime: 0,
      lastActionTime: 0,
      actions: [],
    }
  }

  private loadReplayHistory(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as GameplayReplayData[]
        this.replayHistory = parsed.slice(0, 20)
      }
    } catch (e) {
      console.warn('Failed to load replay history', e)
    }
  }

  private saveReplayHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.replayHistory))
    } catch (e) {
      console.warn('Failed to save replay history', e)
    }
  }

  startSession(): void {
    this.state = this.createInitialState()
    this.state.startTime = performance.now()
  }

  recordAction(action: Omit<GameplayActionRecord, 'timestamp'>): void {
    const now = performance.now()
    const record: GameplayActionRecord = {
      ...action,
      timestamp: now - this.state.startTime,
    }
    this.state.actions.push(record)
    this.state.lastActionTime = now

    switch (action.type) {
      case 'gear_rotate':
        this.state.totalRotations++
        if (action.result === 'success') {
          this.state.currentCombo++
          if (this.state.currentCombo > this.state.highestCombo) {
            this.state.highestCombo = this.state.currentCombo
          }
        } else if (action.result === 'skip' || action.result === 'reverse' || action.result === 'slip') {
          this.state.currentCombo = 0
        }
        break
      case 'fault_occur':
        this.state.faultCount++
        this.state.currentCombo = 0
        break
      case 'fault_clear':
        this.state.perfectSnaps++
        break
      case 'time_align':
        this.state.perfectSnaps++
        break
    }
  }

  evaluate(
    success: boolean,
    finalDeviationMinutes: number,
    timeRemaining: number,
    totalTime: number,
    baseScore: number,
  ): BellChimeEvaluation {
    const timeRemainingRatio = Math.max(0, Math.min(1, timeRemaining / totalTime))

    const accuracyScore = this.calculateAccuracyScore(finalDeviationMinutes)
    const speedScore = this.calculateSpeedScore(timeRemainingRatio)
    const flowScore = this.calculateFlowScore()

    const totalScore = accuracyScore + speedScore + flowScore
    const grade = this.determineGrade(totalScore, success)
    const gradeConfig = BELL_GRADE_CONFIGS[grade]

    const accuracyBonus = Math.floor(baseScore * (accuracyScore / 1000) * 0.3)
    const speedBonus = Math.floor(baseScore * (speedScore / 1000) * 0.3)
    const flowBonus = Math.floor(baseScore * (flowScore / 1000) * 0.3)
    const gradeBonus = Math.floor(baseScore * (gradeConfig.scoreMultiplier - 1))
    const totalBonus = accuracyBonus + speedBonus + flowBonus + gradeBonus

    return {
      grade,
      score: totalScore,
      accuracyScore,
      speedScore,
      flowScore,
      accuracyBonus,
      speedBonus,
      flowBonus,
      totalBonus,
      details: {
        finalDeviationMinutes,
        timeRemainingRatio,
        faultCount: this.state.faultCount,
        comboHighest: this.state.highestCombo,
        perfectSnaps: this.state.perfectSnaps,
        totalRotations: this.state.totalRotations,
      },
    }
  }

  private calculateAccuracyScore(deviationMinutes: number): number {
    if (deviationMinutes <= 0) return 350
    if (deviationMinutes <= 1) return 330
    if (deviationMinutes <= 3) return 300
    if (deviationMinutes <= 5) return 270
    if (deviationMinutes <= 10) return 230
    if (deviationMinutes <= 20) return 180
    if (deviationMinutes <= 30) return 130
    if (deviationMinutes <= 60) return 80
    return 30
  }

  private calculateSpeedScore(timeRemainingRatio: number): number {
    if (timeRemainingRatio >= 0.8) return 350
    if (timeRemainingRatio >= 0.6) return 300
    if (timeRemainingRatio >= 0.5) return 270
    if (timeRemainingRatio >= 0.4) return 230
    if (timeRemainingRatio >= 0.3) return 200
    if (timeRemainingRatio >= 0.2) return 160
    if (timeRemainingRatio >= 0.1) return 120
    if (timeRemainingRatio > 0) return 80
    return 30
  }

  private calculateFlowScore(): number {
    const comboBonus = Math.min(this.state.highestCombo * 3, 150)
    const faultPenalty = this.state.faultCount * 20
    const efficiencyBonus = this.state.totalRotations > 0
      ? Math.floor((this.state.perfectSnaps / this.state.totalRotations) * 150)
      : 0

    const baseFlow = 100
    const total = baseFlow + comboBonus + efficiencyBonus - faultPenalty

    return Math.max(0, Math.min(350, total))
  }

  private determineGrade(totalScore: number, success: boolean): BellChimeGrade {
    if (!success) return 'F'

    if (totalScore >= BELL_GRADE_CONFIGS.S.minScore) return 'S'
    if (totalScore >= BELL_GRADE_CONFIGS.A.minScore) return 'A'
    if (totalScore >= BELL_GRADE_CONFIGS.B.minScore) return 'B'
    if (totalScore >= BELL_GRADE_CONFIGS.C.minScore) return 'C'
    if (totalScore >= BELL_GRADE_CONFIGS.D.minScore) return 'D'
    return 'F'
  }

  getGradeConfig(grade: BellChimeGrade): BellChimeGradeConfig {
    return BELL_GRADE_CONFIGS[grade]
  }

  getCurrentState(): BellChimeEvaluationState {
    return { ...this.state, actions: [...this.state.actions] }
  }

  getCurrentCombo(): number {
    return this.state.currentCombo
  }

  getHighestCombo(): number {
    return this.state.highestCombo
  }

  saveReplay(
    mode: string,
    success: boolean,
    finalScore: number,
    evaluation: BellChimeEvaluation,
    initialTargetTime: ClockTime,
    finalCurrentTime: ClockTime,
    finalDeviationMinutes: number,
  ): GameplayReplayData {
    const replay: GameplayReplayData = {
      id: `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      mode,
      duration: performance.now() - this.state.startTime,
      success,
      finalScore,
      evaluation,
      actions: [...this.state.actions],
      initialTargetTime,
      finalCurrentTime,
      finalDeviationMinutes,
    }

    this.replayHistory.unshift(replay)
    this.replayHistory = this.replayHistory.slice(0, 20)
    this.saveReplayHistory()

    return replay
  }

  getReplayHistory(): GameplayReplayData[] {
    return [...this.replayHistory]
  }

  getBestReplay(grade?: BellChimeGrade): GameplayReplayData | null {
    let history = [...this.replayHistory]
    if (grade) {
      history = history.filter((r) => r.evaluation.grade === grade)
    }
    history.sort((a, b) => b.finalScore - a.finalScore)
    return history[0] ?? null
  }

  deleteReplay(replayId: string): boolean {
    const idx = this.replayHistory.findIndex((r) => r.id === replayId)
    if (idx < 0) return false
    this.replayHistory.splice(idx, 1)
    this.saveReplayHistory()
    return true
  }

  clearHistory(): void {
    this.replayHistory = []
    this.saveReplayHistory()
  }
}

export const bellChimeEvaluationSystem = new BellChimeEvaluationSystem()
