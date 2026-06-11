import type {
  Achievement,
  AchievementBookState,
  AchievementCategory,
  AchievementRarity,
  SpecialBell,
  SpecialBellType,
  AchievementUnlockResult,
  GameResult,
  BellChimeEvaluation,
} from '../types'

const STORAGE_KEY = 'clocktower_achievement_book_v1'

export const SPECIAL_BELLS: SpecialBell[] = [
  {
    id: 'golden_bell',
    name: 'golden_bell',
    displayName: '黄金圣钟',
    description: '首次获得S级评价时唤醒的黄金钟声，光芒万丈。',
    icon: '🔔',
    color: '#ffd700',
    rarity: 'rare',
    unlockCondition: '首次获得S级评价',
    isCollected: false,
  },
  {
    id: 'silver_bell',
    name: 'silver_bell',
    displayName: '银辉灵钟',
    description: '连续十次成功校准后响起的银铃，清越悠扬。',
    icon: '🔕',
    color: '#c0c0c0',
    rarity: 'uncommon',
    unlockCondition: '连续成功校准10次',
    isCollected: false,
  },
  {
    id: 'bronze_bell',
    name: 'bronze_bell',
    displayName: '青铜古钟',
    description: '钟楼中最古老的青铜钟，见证了无数岁月。',
    icon: '🔔',
    color: '#cd7f32',
    rarity: 'common',
    unlockCondition: '完成首次校时',
    isCollected: false,
  },
  {
    id: 'phantom_bell',
    name: 'phantom_bell',
    displayName: '幻影虚钟',
    description: '传说只有在午夜时分才能听到的神秘钟声。',
    icon: '👻',
    color: '#9b59b6',
    rarity: 'epic',
    unlockCondition: '深夜(0-6点)完成一次完美校时',
    isCollected: false,
  },
  {
    id: 'eclipse_bell',
    name: 'eclipse_bell',
    displayName: '日蚀暗钟',
    description: '日蚀时刻才会显现的黑暗之钟，神秘莫测。',
    icon: '🌑',
    color: '#2c3e50',
    rarity: 'legendary',
    unlockCondition: '在没有任何故障的情况下获得S级评价',
    isCollected: false,
  },
  {
    id: 'dawn_bell',
    name: 'dawn_bell',
    displayName: '黎明朝钟',
    description: '黎明时分第一缕阳光照射时敲响的希望之钟。',
    icon: '🌅',
    color: '#f39c12',
    rarity: 'uncommon',
    unlockCondition: '完成钟楼巡夜的黎明时段',
    isCollected: false,
  },
  {
    id: 'dusk_bell',
    name: 'dusk_bell',
    displayName: '黄昏暮钟',
    description: '黄昏时分夕阳西下时敲响的安详之钟。',
    icon: '🌆',
    color: '#e74c3c',
    rarity: 'common',
    unlockCondition: '完成钟楼巡夜的黄昏时段',
    isCollected: false,
  },
  {
    id: 'storm_bell',
    name: 'storm_bell',
    displayName: '风暴烈钟',
    description: '暴风雨中依然坚定鸣响的勇气之钟。',
    icon: '⛈️',
    color: '#3498db',
    rarity: 'rare',
    unlockCondition: '在风暴天气中完成校时',
    isCollected: false,
  },
  {
    id: 'harmony_bell',
    name: 'harmony_bell',
    displayName: '和谐和钟',
    description: '当所有塔楼完美对齐时奏响的和谐乐章。',
    icon: '🎵',
    color: '#2ecc71',
    rarity: 'epic',
    unlockCondition: '在多钟面模式下所有塔楼同时对齐',
    isCollected: false,
  },
  {
    id: 'echo_bell',
    name: 'echo_bell',
    displayName: '回音悠钟',
    description: '山谷中久久回荡的悠远钟声，余音绕梁。',
    icon: '🏔️',
    color: '#1abc9c',
    rarity: 'rare',
    unlockCondition: '达成50连击',
    isCollected: false,
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_calibration',
    name: 'first_calibration',
    displayName: '初为守钟人',
    description: '完成你的第一次校时，无论成败。',
    icon: '🎯',
    category: 'score',
    rarity: 'common',
    unlockCondition: '完成1场游戏',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'first_success',
    name: 'first_success',
    displayName: '初试锋芒',
    description: '首次成功校准钟楼时间。',
    icon: '✅',
    category: 'score',
    rarity: 'common',
    unlockCondition: '成功校准1次',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'score_1000',
    name: 'score_1000',
    displayName: '千分达人',
    description: '单局得分达到1000分。',
    icon: '💯',
    category: 'score',
    rarity: 'common',
    unlockCondition: '单局得分1000',
    targetValue: 1000,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'score_2000',
    name: 'score_2000',
    displayName: '精准校准师',
    description: '单局得分达到2000分。',
    icon: '⭐',
    category: 'score',
    rarity: 'uncommon',
    unlockCondition: '单局得分2000',
    targetValue: 2000,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'score_3000',
    name: 'score_3000',
    displayName: '完美守钟人',
    description: '单局得分达到3000分的完美校时。',
    icon: '🏆',
    category: 'score',
    rarity: 'rare',
    unlockCondition: '单局得分3000',
    targetValue: 3000,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'speed_demon',
    name: 'speed_demon',
    displayName: '疾风校时',
    description: '在30秒内完成一次成功校时。',
    icon: '⚡',
    category: 'speed',
    rarity: 'uncommon',
    unlockCondition: '30秒内完成校时',
    targetValue: 30,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'speed_master',
    name: 'speed_master',
    displayName: '闪电之手',
    description: '在15秒内完成一次成功校时。',
    icon: '🌩️',
    category: 'speed',
    rarity: 'epic',
    unlockCondition: '15秒内完成校时',
    targetValue: 15,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'accuracy_perfect',
    name: 'accuracy_perfect',
    displayName: '分毫不差',
    description: '偏差在1分钟以内的完美校准。',
    icon: '🎯',
    category: 'accuracy',
    rarity: 'rare',
    unlockCondition: '偏差小于1分钟',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'combo_10',
    name: 'combo_10',
    displayName: '连击新手',
    description: '达成10连击。',
    icon: '🔥',
    category: 'combo',
    rarity: 'common',
    unlockCondition: '达成10连击',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'combo_30',
    name: 'combo_30',
    displayName: '连击达人',
    description: '达成30连击。',
    icon: '💥',
    category: 'combo',
    rarity: 'uncommon',
    unlockCondition: '达成30连击',
    targetValue: 30,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'combo_50',
    name: 'combo_50',
    displayName: '连击大师',
    description: '达成50连击。',
    icon: '🌟',
    category: 'combo',
    rarity: 'rare',
    unlockCondition: '达成50连击',
    targetValue: 50,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'combo_100',
    name: 'combo_100',
    displayName: '连击传奇',
    description: '达成100连击的传说级表现。',
    icon: '👑',
    category: 'combo',
    rarity: 'legendary',
    unlockCondition: '达成100连击',
    targetValue: 100,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'games_10',
    name: 'games_10',
    displayName: '钟楼常客',
    description: '累计游玩10局游戏。',
    icon: '🕰️',
    category: 'endurance',
    rarity: 'common',
    unlockCondition: '游玩10局',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'games_50',
    name: 'games_50',
    displayName: '资深守钟人',
    description: '累计游玩50局游戏。',
    icon: '🎖️',
    category: 'endurance',
    rarity: 'uncommon',
    unlockCondition: '游玩50局',
    targetValue: 50,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'games_100',
    name: 'games_100',
    displayName: '钟楼守护者',
    description: '累计游玩100局游戏。',
    icon: '🛡️',
    category: 'endurance',
    rarity: 'rare',
    unlockCondition: '游玩100局',
    targetValue: 100,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'perfect_10',
    name: 'perfect_10',
    displayName: '十全十美',
    description: '累计完成10次完美校时(2500分以上)。',
    icon: '✨',
    category: 'accuracy',
    rarity: 'epic',
    unlockCondition: '完美校时10次',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'consecutive_5',
    name: 'consecutive_5',
    displayName: '连胜新星',
    description: '连续成功校准5次。',
    icon: '🔥',
    category: 'endurance',
    rarity: 'uncommon',
    unlockCondition: '连胜5次',
    targetValue: 5,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'consecutive_10',
    name: 'consecutive_10',
    displayName: '不败传说',
    description: '连续成功校准10次。',
    icon: '🏅',
    category: 'endurance',
    rarity: 'rare',
    unlockCondition: '连胜10次',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'no_fault_clear',
    name: 'no_fault_clear',
    displayName: '一帆风顺',
    description: '在没有任何故障的情况下完成校时。',
    icon: '🍀',
    category: 'special',
    rarity: 'uncommon',
    unlockCondition: '无故障通关',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'bell_collector_3',
    name: 'bell_collector_3',
    displayName: '钟铃收藏家',
    description: '收集3种不同的特殊钟声。',
    icon: '🔔',
    category: 'collection',
    rarity: 'uncommon',
    unlockCondition: '收集3种特殊钟',
    targetValue: 3,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'bell_collector_7',
    name: 'bell_collector_7',
    displayName: '钟铃鉴赏家',
    description: '收集7种不同的特殊钟声。',
    icon: '🏺',
    category: 'collection',
    rarity: 'rare',
    unlockCondition: '收集7种特殊钟',
    targetValue: 7,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'bell_collector_all',
    name: 'bell_collector_all',
    displayName: '钟铃大师',
    description: '收集所有特殊钟声。',
    icon: '👑',
    category: 'collection',
    rarity: 'legendary',
    unlockCondition: '收集所有特殊钟',
    targetValue: 10,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'patrol_complete',
    name: 'patrol_complete',
    displayName: '巡夜人',
    description: '完成一次完整的钟楼巡夜。',
    icon: '🌙',
    category: 'special',
    rarity: 'uncommon',
    unlockCondition: '完成钟楼巡夜',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
  {
    id: 'grade_s',
    name: 'grade_s',
    displayName: 'S级守钟人',
    description: '首次获得S级评价。',
    icon: '💎',
    category: 'score',
    rarity: 'rare',
    unlockCondition: '获得S级评价',
    targetValue: 1,
    currentValue: 0,
    isUnlocked: false,
  },
]

const DEFAULT_STATE: AchievementBookState = {
  unlockedAchievementIds: [],
  unlockedAtTimestamps: {},
  collectedBellIds: [],
  collectedBellTimestamps: {} as Record<SpecialBellType, number>,
  stats: {
    totalGamesPlayed: 0,
    totalScore: 0,
    totalPerfectClears: 0,
    totalPlayTimeSeconds: 0,
    highestCombo: 0,
    totalPerfectSnaps: 0,
    totalFaultsHandled: 0,
    consecutiveWins: 0,
    bestConsecutiveWins: 0,
    fastestClearSeconds: Infinity,
    lowestDeviationMinutes: Infinity,
    patrolNightsCompleted: 0,
    roguelikeFloorsCleared: 0,
    levelsCreated: 0,
    totalBellsRung: 0,
  },
}

export class AchievementSystem {
  private state: AchievementBookState

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): AchievementBookState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AchievementBookState>
        return {
          ...DEFAULT_STATE,
          ...parsed,
          unlockedAchievementIds: parsed.unlockedAchievementIds ?? [],
          unlockedAtTimestamps: parsed.unlockedAtTimestamps ?? {},
          collectedBellIds: parsed.collectedBellIds ?? [],
          collectedBellTimestamps: (parsed.collectedBellTimestamps ?? {}) as Record<SpecialBellType, number>,
          stats: {
            ...DEFAULT_STATE.stats,
            ...parsed.stats,
            fastestClearSeconds: parsed.stats?.fastestClearSeconds ?? Infinity,
            lowestDeviationMinutes: parsed.stats?.lowestDeviationMinutes ?? Infinity,
          },
        }
      }
    } catch (e) {
      console.warn('Failed to load achievement book state', e)
    }
    return { ...DEFAULT_STATE, stats: { ...DEFAULT_STATE.stats } }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save achievement book state', e)
    }
  }

  getState(): AchievementBookState {
    return {
      ...this.state,
      unlockedAchievementIds: [...this.state.unlockedAchievementIds],
      collectedBellIds: [...this.state.collectedBellIds],
      stats: { ...this.state.stats },
    }
  }

  getStats() {
    return { ...this.state.stats }
  }

  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      isUnlocked: this.state.unlockedAchievementIds.includes(a.id),
      unlockedAt: this.state.unlockedAtTimestamps[a.id],
      currentValue: this.getCurrentValue(a),
    }))
  }

  getAchievementById(id: string): Achievement | undefined {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id)
    if (!achievement) return undefined
    return {
      ...achievement,
      isUnlocked: this.state.unlockedAchievementIds.includes(id),
      unlockedAt: this.state.unlockedAtTimestamps[id],
      currentValue: this.getCurrentValue(achievement),
    }
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAllAchievements().filter((a) => a.category === category)
  }

  getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return this.getAllAchievements().filter((a) => a.rarity === rarity)
  }

  getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter((a) => a.isUnlocked)
  }

  getLockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter((a) => !a.isUnlocked)
  }

  getSpecialBells(): SpecialBell[] {
    return SPECIAL_BELLS.map((b) => ({
      ...b,
      isCollected: this.state.collectedBellIds.includes(b.id),
      collectedAt: this.state.collectedBellTimestamps[b.id],
    }))
  }

  getCollectedBells(): SpecialBell[] {
    return this.getSpecialBells().filter((b) => b.isCollected)
  }

  getUncollectedBells(): SpecialBell[] {
    return this.getSpecialBells().filter((b) => !b.isCollected)
  }

  private getCurrentValue(achievement: Achievement): number {
    const stats = this.state.stats
    switch (achievement.id) {
      case 'first_calibration':
      case 'games_10':
      case 'games_50':
      case 'games_100':
        return stats.totalGamesPlayed
      case 'first_success':
        return stats.totalGamesPlayed > 0 && stats.totalScore > 0 ? 1 : 0
      case 'score_1000':
      case 'score_2000':
      case 'score_3000':
        return stats.totalScore
      case 'speed_demon':
      case 'speed_master':
        return stats.fastestClearSeconds === Infinity ? 999 : stats.fastestClearSeconds
      case 'accuracy_perfect':
        return stats.lowestDeviationMinutes === Infinity ? 999 : stats.lowestDeviationMinutes
      case 'combo_10':
      case 'combo_30':
      case 'combo_50':
      case 'combo_100':
        return stats.highestCombo
      case 'perfect_10':
        return stats.totalPerfectClears
      case 'consecutive_5':
      case 'consecutive_10':
        return stats.bestConsecutiveWins
      case 'no_fault_clear':
        return stats.totalPerfectClears > 0 ? 1 : 0
      case 'bell_collector_3':
      case 'bell_collector_7':
      case 'bell_collector_all':
        return this.state.collectedBellIds.length
      case 'patrol_complete':
        return stats.patrolNightsCompleted
      case 'grade_s':
        return this.state.unlockedAchievementIds.includes('grade_s') ? 1 : 0
      default:
        return 0
    }
  }

  private checkAchievementUnlocks(): AchievementUnlockResult[] {
    const newlyUnlocked: AchievementUnlockResult[] = []
    const stats = this.state.stats

    ACHIEVEMENTS.forEach((achievement) => {
      if (this.state.unlockedAchievementIds.includes(achievement.id)) return

      let shouldUnlock = false
      const currentValue = this.getCurrentValue(achievement)

      switch (achievement.id) {
        case 'first_calibration':
          shouldUnlock = stats.totalGamesPlayed >= 1
          break
        case 'first_success':
          shouldUnlock = stats.totalScore > 0 || stats.totalGamesPlayed > 0
          break
        case 'score_1000':
          shouldUnlock = stats.totalScore >= 1000
          break
        case 'score_2000':
          shouldUnlock = stats.totalScore >= 2000
          break
        case 'score_3000':
          shouldUnlock = stats.totalScore >= 3000
          break
        case 'speed_demon':
          shouldUnlock = stats.fastestClearSeconds <= 30 && stats.fastestClearSeconds !== Infinity
          break
        case 'speed_master':
          shouldUnlock = stats.fastestClearSeconds <= 15 && stats.fastestClearSeconds !== Infinity
          break
        case 'accuracy_perfect':
          shouldUnlock = stats.lowestDeviationMinutes <= 1 && stats.lowestDeviationMinutes !== Infinity
          break
        case 'combo_10':
          shouldUnlock = stats.highestCombo >= 10
          break
        case 'combo_30':
          shouldUnlock = stats.highestCombo >= 30
          break
        case 'combo_50':
          shouldUnlock = stats.highestCombo >= 50
          break
        case 'combo_100':
          shouldUnlock = stats.highestCombo >= 100
          break
        case 'games_10':
          shouldUnlock = stats.totalGamesPlayed >= 10
          break
        case 'games_50':
          shouldUnlock = stats.totalGamesPlayed >= 50
          break
        case 'games_100':
          shouldUnlock = stats.totalGamesPlayed >= 100
          break
        case 'perfect_10':
          shouldUnlock = stats.totalPerfectClears >= 10
          break
        case 'consecutive_5':
          shouldUnlock = stats.bestConsecutiveWins >= 5
          break
        case 'consecutive_10':
          shouldUnlock = stats.bestConsecutiveWins >= 10
          break
        case 'no_fault_clear':
          shouldUnlock = stats.totalPerfectClears >= 1
          break
        case 'bell_collector_3':
          shouldUnlock = this.state.collectedBellIds.length >= 3
          break
        case 'bell_collector_7':
          shouldUnlock = this.state.collectedBellIds.length >= 7
          break
        case 'bell_collector_all':
          shouldUnlock = this.state.collectedBellIds.length >= SPECIAL_BELLS.length
          break
        case 'patrol_complete':
          shouldUnlock = stats.patrolNightsCompleted >= 1
          break
        case 'grade_s':
          shouldUnlock = this.state.unlockedAchievementIds.includes('golden_bell') || false
          break
      }

      if (shouldUnlock) {
        this.state.unlockedAchievementIds.push(achievement.id)
        this.state.unlockedAtTimestamps[achievement.id] = Date.now()
        newlyUnlocked.push({
          achievement: {
            ...achievement,
            isUnlocked: true,
            unlockedAt: this.state.unlockedAtTimestamps[achievement.id],
            currentValue,
          },
          isNew: true,
        })
      }
    })

    return newlyUnlocked
  }

  recordGameResult(
    result: GameResult,
    options: {
      evaluation?: BellChimeEvaluation
      timeUsed?: number
      deviation?: number
      isPatrolComplete?: boolean
      weatherCondition?: string
      gameMode?: string
    } = {}
  ): {
    achievements: AchievementUnlockResult[]
    newBells: SpecialBell[]
  } {
    const stats = this.state.stats
    const timeUsed = options.timeUsed ?? 120 - result.timeLeft
    const deviation = options.deviation ?? (result as any).totalDeviation ?? 0
    const isPerfect = result.score >= 2500
    const hadFaults = options.evaluation?.details.faultCount ? options.evaluation.details.faultCount > 0 : false

    stats.totalGamesPlayed++
    stats.totalPlayTimeSeconds += Math.max(1, timeUsed)
    stats.totalBellsRung++

    if (result.success) {
      stats.totalScore += result.score

      if (isPerfect) {
        stats.totalPerfectClears++
      }

      stats.consecutiveWins++
      if (stats.consecutiveWins > stats.bestConsecutiveWins) {
        stats.bestConsecutiveWins = stats.consecutiveWins
      }

      if (timeUsed < stats.fastestClearSeconds) {
        stats.fastestClearSeconds = timeUsed
      }

      if (deviation < stats.lowestDeviationMinutes) {
        stats.lowestDeviationMinutes = deviation
      }
    } else {
      stats.consecutiveWins = 0
    }

    if (options.evaluation?.details.comboHighest && options.evaluation.details.comboHighest > stats.highestCombo) {
      stats.highestCombo = options.evaluation.details.comboHighest
    }

    if (options.evaluation?.details.perfectSnaps) {
      stats.totalPerfectSnaps += options.evaluation.details.perfectSnaps
    }

    if (options.evaluation?.details.faultCount) {
      stats.totalFaultsHandled += options.evaluation.details.faultCount
    }

    if (options.isPatrolComplete) {
      stats.patrolNightsCompleted++
    }

    const newBells = this.checkBellCollections(result, {
      evaluation: options.evaluation,
      timeUsed,
      deviation,
      isPerfect,
      hadFaults,
      weatherCondition: options.weatherCondition,
      gameMode: options.gameMode,
    })

    const achievements = this.checkAchievementUnlocks()

    this.saveState()

    return { achievements, newBells }
  }

  private checkBellCollections(
    result: GameResult,
    options: {
      evaluation?: BellChimeEvaluation
      timeUsed: number
      deviation: number
      isPerfect: boolean
      hadFaults: boolean
      weatherCondition?: string
      gameMode?: string
    }
  ): SpecialBell[] {
    const newlyCollected: SpecialBell[] = []
    const hour = new Date().getHours()
    const isMidnight = hour >= 0 && hour < 6

    const tryCollectBell = (bellId: SpecialBellType) => {
      if (!this.state.collectedBellIds.includes(bellId)) {
        this.state.collectedBellIds.push(bellId)
        this.state.collectedBellTimestamps[bellId] = Date.now()
        const bell = SPECIAL_BELLS.find((b) => b.id === bellId)
        if (bell) {
          newlyCollected.push({
            ...bell,
            isCollected: true,
            collectedAt: Date.now(),
          })
        }
      }
    }

    if (result.success) {
      tryCollectBell('bronze_bell')
    }

    if (this.state.stats.consecutiveWins >= 10 && result.success) {
      tryCollectBell('silver_bell')
    }

    if (options.evaluation?.grade === 'S') {
      tryCollectBell('golden_bell')
    }

    if (options.isPerfect && isMidnight && result.success) {
      tryCollectBell('phantom_bell')
    }

    if (options.evaluation?.grade === 'S' && !options.hadFaults && result.success) {
      tryCollectBell('eclipse_bell')
    }

    if (options.gameMode === 'patrol' && result.success) {
      tryCollectBell('dusk_bell')
      if (options.isPerfect) {
        tryCollectBell('dawn_bell')
      }
    }

    if (options.weatherCondition === 'storm' && result.success) {
      tryCollectBell('storm_bell')
    }

    if (options.gameMode === 'multiclock' && result.success) {
      tryCollectBell('harmony_bell')
    }

    if (options.evaluation?.details.comboHighest && options.evaluation.details.comboHighest >= 50) {
      tryCollectBell('echo_bell')
    }

    return newlyCollected
  }

  getAchievementProgress(): { total: number; unlocked: number; percentage: number } {
    const total = ACHIEVEMENTS.length
    const unlocked = this.state.unlockedAchievementIds.length
    return {
      total,
      unlocked,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
    }
  }

  getBellCollectionProgress(): { total: number; collected: number; percentage: number } {
    const total = SPECIAL_BELLS.length
    const collected = this.state.collectedBellIds.length
    return {
      total,
      collected,
      percentage: total > 0 ? (collected / total) * 100 : 0,
    }
  }

  getNewlyUnlockedSince(timestamp: number): Achievement[] {
    return this.getUnlockedAchievements().filter(
      (a) => a.unlockedAt && a.unlockedAt > timestamp
    )
  }

  getNewlyCollectedBellsSince(timestamp: number): SpecialBell[] {
    return this.getCollectedBells().filter(
      (b) => b.collectedAt && b.collectedAt > timestamp
    )
  }

  reset(): void {
    this.state = {
      ...DEFAULT_STATE,
      unlockedAchievementIds: [],
      unlockedAtTimestamps: {},
      collectedBellIds: [],
      collectedBellTimestamps: {} as Record<SpecialBellType, number>,
      stats: { ...DEFAULT_STATE.stats },
    }
    this.saveState()
  }
}

export const achievementSystem = new AchievementSystem()
