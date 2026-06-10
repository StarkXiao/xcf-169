import type {
  RoguelikeGameResult,
  RoguelikeRunState,
  FloorResult,
  TowerEvent,
  TrapType,
  WeatherEventType,
  RewardNodeId,
} from '../../types/roguelike'
import { TRAP_CONFIGS } from './EventPoolSystem'
import { WEATHER_EVENTS } from './WeatherEventSystem'
import { REWARD_NODES } from './RewardTreeSystem'

export interface EventResultData {
  eventId: string
  success: boolean
  isPerfect: boolean
  scoreGained: number
  timeRemaining: number
  timeUsed: number
  accuracy: number
  diffMinutes: number
  damageTaken: number
  trapsTriggered: TrapType[]
  weathersEncountered: WeatherEventType[]
  rewardsEarned: RewardNodeId[]
}

export interface ScoreBreakdown {
  baseScore: number
  accuracyBonus: number
  timeBonus: number
  perfectBonus: number
  floorBonus: number
  difficultyMultiplier: number
  damagePenalty: number
  total: number
}

export class SettlementSystem {
  private eventResults: Map<string, EventResultData> = new Map()
  private floorResults: Map<string, FloorResult> = new Map()
  private totalDamageTaken = 0
  private totalTrapsTriggered = 0
  private totalWeathersEncountered = 0
  private totalPerfectEvents = 0
  private uniqueUnlockedRewards: Set<RewardNodeId> = new Set()

  recordEventResult(data: EventResultData): void {
    this.eventResults.set(data.eventId, data)
    this.totalTrapsTriggered += data.trapsTriggered.length
    this.totalWeathersEncountered += data.weathersEncountered.length
    if (data.isPerfect) this.totalPerfectEvents++
    data.rewardsEarned.forEach((r) => this.uniqueUnlockedRewards.add(r))
  }

  getEventResult(eventId: string): EventResultData | undefined {
    return this.eventResults.get(eventId)
  }

  recordFloorResult(data: FloorResult): void {
    this.floorResults.set(data.floorId, data)
    this.totalDamageTaken += data.damageTaken
  }

  getFloorResult(floorId: string): FloorResult | undefined {
    return this.floorResults.get(floorId)
  }

  calculateEventScore(
    event: TowerEvent,
    diffMinutes: number,
    timeRemaining: number,
    totalTime: number,
    bonusMultiplier: number = 1,
  ): ScoreBreakdown {
    const accuracy = Math.max(0, 360 - diffMinutes * 6)
    const accuracyBonus = Math.floor(accuracy * 2)
    const timeRatio = Math.max(0, Math.min(1, timeRemaining / totalTime))
    const timeBonus = Math.floor(timeRemaining * 8 * (0.5 + timeRatio * 0.5))
    const perfectBonus = diffMinutes === 0 ? 500 : diffMinutes <= 5 ? 200 : 0
    const baseScore = 300
    const difficultyMultiplier = 1 + (event.difficulty - 1) * 0.2
    const floorBonus = event.category === 'boss' ? 1000 : event.category === 'elite' ? 500 : event.category === 'treasure' ? 300 : 0
    const totalPreMultiplier = baseScore + accuracyBonus + timeBonus + perfectBonus + floorBonus
    const total = Math.floor(totalPreMultiplier * difficultyMultiplier * bonusMultiplier)

    return {
      baseScore,
      accuracyBonus,
      timeBonus,
      perfectBonus,
      floorBonus,
      difficultyMultiplier,
      damagePenalty: 0,
      total,
    }
  }

  calculateDamageFromTraps(traps: TrapType[]): number {
    return traps.reduce((sum, t) => {
      const config = TRAP_CONFIGS[t]
      return sum + (config?.damage || 5)
    }, 0)
  }

  calculateFinalResult(
    state: RoguelikeRunState,
    elapsedMs: number,
  ): RoguelikeGameResult {
    const allEventResults = Array.from(this.eventResults.values())
    const allFloorResults = Array.from(this.floorResults.values())

    const success = state.isVictory
    const victory = state.isVictory
    const floorsCleared = allFloorResults.filter((f) => f.cleared).length
    const eventsCompleted = allEventResults.filter((e) => e.success).length

    return {
      runId: state.runId,
      success,
      victory,
      totalScore: state.totalScore,
      floorsCleared,
      eventsCompleted,
      nightsSurvived: state.nightNumber,
      totalNights: state.totalNights,
      rewardPointsEarned: state.rewardTree.points,
      trapsTriggered: this.totalTrapsTriggered,
      weathersEncountered: this.totalWeathersEncountered,
      perfectEvents: this.totalPerfectEvents,
      rarityUnlocked: Array.from(this.uniqueUnlockedRewards),
      damageTaken: this.totalDamageTaken,
      healthRemaining: state.health,
      maxHealth: state.maxHealth,
      elapsedSeconds: Math.floor(elapsedMs / 1000),
      timestamp: Date.now(),
    }
  }

  getRunStats(): {
    totalEvents: number
    successRate: number
    perfectRate: number
    avgAccuracy: number
    avgDamagePerFloor: number
  } {
    const events = Array.from(this.eventResults.values())
    const floors = Array.from(this.floorResults.values())

    const totalEvents = events.length
    const successCount = events.filter((e) => e.success).length
    const perfectCount = events.filter((e) => e.isPerfect).length
    const avgAccuracy = totalEvents > 0
      ? events.reduce((s, e) => s + e.accuracy, 0) / totalEvents
      : 0
    const avgDamagePerFloor = floors.length > 0
      ? this.totalDamageTaken / floors.length
      : 0

    return {
      totalEvents,
      successRate: totalEvents > 0 ? successCount / totalEvents : 0,
      perfectRate: totalEvents > 0 ? perfectCount / totalEvents : 0,
      avgAccuracy,
      avgDamagePerFloor,
    }
  }

  getGrade(result: RoguelikeGameResult): { grade: string; color: string } {
    const maxScore = 50000
    const ratio = result.totalScore / maxScore

    if (result.victory && ratio >= 0.8) return { grade: 'S+', color: '#fbbf24' }
    if (result.victory && ratio >= 0.6) return { grade: 'S', color: '#fbbf24' }
    if (result.victory && ratio >= 0.4) return { grade: 'A', color: '#f97316' }
    if (ratio >= 0.5) return { grade: 'A', color: '#f97316' }
    if (ratio >= 0.3) return { grade: 'B', color: '#60a5fa' }
    if (ratio >= 0.15) return { grade: 'C', color: '#4ade80' }
    if (result.success) return { grade: 'D', color: '#94a3b8' }
    return { grade: 'F', color: '#ef4444' }
  }

  getAchievements(result: RoguelikeGameResult): { id: string; name: string; icon: string; description: string }[] {
    const achievements: { id: string; name: string; icon: string; description: string }[] = []

    if (result.victory) {
      achievements.push({
        id: 'clear_victory',
        name: '钟楼征服者',
        icon: '🏆',
        description: '成功登顶钟楼，完成巡夜之旅！',
      })
    }

    if (result.perfectEvents >= 5) {
      achievements.push({
        id: 'perfect_five',
        name: '完美校准',
        icon: '💯',
        description: `完成${result.perfectEvents}次完美时间校准。`,
      })
    }

    if (result.floorsCleared >= 5) {
      achievements.push({
        id: 'deep_explorer',
        name: '深入探索',
        icon: '🗺️',
        description: `通过${result.floorsCleared}层钟楼。`,
      })
    }

    if (result.trapsTriggered === 0 && result.eventsCompleted > 0) {
      achievements.push({
        id: 'trap_master',
        name: '机关大师',
        icon: '🎯',
        description: '未触发任何机关陷阱！',
      })
    }

    if (result.healthRemaining === result.maxHealth && result.eventsCompleted > 3) {
      achievements.push({
        id: 'flawless',
        name: '无伤巡夜',
        icon: '🛡️',
        description: '全程无伤通过多个事件。',
      })
    }

    if (result.rarityUnlocked.includes('chronoHeart')) {
      achievements.push({
        id: 'chrono_heart',
        name: '时空之心',
        icon: '💎',
        description: '获得传说级奖励：钟楼之核。',
      })
    }

    if (result.weathersEncountered >= 5) {
      achievements.push({
        id: 'storm_survivor',
        name: '风暴幸存者',
        icon: '⛈️',
        description: `经历了${result.weathersEncountered}次奇异天气。`,
      })
    }

    if (result.totalScore >= 30000) {
      achievements.push({
        id: 'high_score',
        name: '高分王者',
        icon: '👑',
        description: `获得${result.totalScore}的高分！`,
      })
    }

    return achievements
  }

  getTrapsSummary(): Map<TrapType, number> {
    const summary = new Map<TrapType, number>()
    this.eventResults.forEach((result) => {
      result.trapsTriggered.forEach((t) => {
        summary.set(t, (summary.get(t) || 0) + 1)
      })
    })
    return summary
  }

  getWeathersSummary(): Map<WeatherEventType, number> {
    const summary = new Map<WeatherEventType, number>()
    this.eventResults.forEach((result) => {
      result.weathersEncountered.forEach((w) => {
        summary.set(w, (summary.get(w) || 0) + 1)
      })
    })
    return summary
  }

  getRewardsSummary(): Map<RewardNodeId, number> {
    const summary = new Map<RewardNodeId, number>()
    this.uniqueUnlockedRewards.forEach((r) => {
      let count = 0
      this.eventResults.forEach((result) => {
        count += result.rewardsEarned.filter((x) => x === r).length
      })
      summary.set(r, count)
    })
    return summary
  }

  getTips(result: RoguelikeGameResult): string[] {
    const tips: string[] = []

    if (result.damageTaken > 50) {
      tips.push('注意躲避陷阱！考虑解锁「故障抗性」或「谨慎之心」奖励。')
    }

    if (result.weathersEncountered > 3 && result.healthRemaining < result.maxHealth * 0.5) {
      tips.push('天气事件很致命，「晴雨斗篷」和「顺风而行」能有效对抗它们。')
    }

    if (result.perfectEvents === 0 && result.eventsCompleted > 0) {
      tips.push('尝试更精准地校准时间。完美校准能获得大量额外分数。')
    }

    if (result.floorsCleared < 3) {
      tips.push('循序渐进，先熟悉基础齿轮操作再挑战更高楼层。')
    }

    if (result.healthRemaining < result.maxHealth * 0.4 && result.eventsCompleted > 2) {
      tips.push('优先选择休息和宝藏事件来积累资源和强化。')
    }

    if (tips.length === 0) {
      tips.push('优秀的巡夜！继续挑战更高难度获得稀有奖励吧。')
    }

    return tips
  }

  getTrapDisplayName(trapId: TrapType): string {
    return TRAP_CONFIGS[trapId]?.displayName || trapId
  }

  getWeatherDisplayName(weatherId: WeatherEventType): string {
    return WEATHER_EVENTS[weatherId]?.displayName || weatherId
  }

  getRewardDisplayName(rewardId: RewardNodeId): string {
    return REWARD_NODES[rewardId]?.displayName || rewardId
  }

  reset(): void {
    this.eventResults.clear()
    this.floorResults.clear()
    this.totalDamageTaken = 0
    this.totalTrapsTriggered = 0
    this.totalWeathersEncountered = 0
    this.totalPerfectEvents = 0
    this.uniqueUnlockedRewards.clear()
  }
}

export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}小时${m}分${s}秒`
  }
  if (m > 0) {
    return `${m}分${s}秒`
  }
  return `${s}秒`
}

export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 1000000)
}
