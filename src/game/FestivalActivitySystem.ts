import type {
  FestivalId,
  FestivalSeason,
  FestivalConfig,
  FestivalTheme,
  FestivalActivityPeriod,
  FestivalPeriodRules,
  FestivalPeriodReward,
  FestivalLeaderboardEntry,
  FestivalPlayerRecord,
  FestivalActivityState,
  FestivalActivityEffects,
} from '../types'

const SPRING_THEME: FestivalTheme = {
  primaryColor: '#ff6b8a',
  secondaryColor: '#ff9eb5',
  accentColor: '#ffd700',
  bgColor: '#1a0a12',
  bgGradient: 'radial-gradient(ellipse at center, #2a1020 0%, #1a0a12 70%)',
  borderColor: '#ff6b8a',
  glowColor: '#ff6b8a',
  iconColor: '#ffb0c0',
}

const SUMMER_THEME: FestivalTheme = {
  primaryColor: '#5abaff',
  secondaryColor: '#8ad0ff',
  accentColor: '#ffd700',
  bgColor: '#0a1218',
  bgGradient: 'radial-gradient(ellipse at center, #102030 0%, #0a1218 70%)',
  borderColor: '#5abaff',
  glowColor: '#5abaff',
  iconColor: '#8ad0ff',
}

const AUTUMN_THEME: FestivalTheme = {
  primaryColor: '#e8943a',
  secondaryColor: '#f0b868',
  accentColor: '#ffd700',
  bgColor: '#120c06',
  bgGradient: 'radial-gradient(ellipse at center, #201810 0%, #120c06 70%)',
  borderColor: '#e8943a',
  glowColor: '#e8943a',
  iconColor: '#f0b868',
}

const WINTER_THEME: FestivalTheme = {
  primaryColor: '#a0d8ef',
  secondaryColor: '#c8e8f8',
  accentColor: '#ffd700',
  bgColor: '#080e14',
  bgGradient: 'radial-gradient(ellipse at center, #101828 0%, #080e14 70%)',
  borderColor: '#a0d8ef',
  glowColor: '#a0d8ef',
  iconColor: '#c8e8f8',
}

export const FESTIVAL_CONFIGS: FestivalConfig[] = [
  {
    id: 'spring_festival',
    name: 'spring_festival',
    displayName: '春节',
    season: 'winter',
    icon: '🧨',
    description: '钟楼鸣钟迎新春，辞旧迎新万象更。春节期间完成校时挑战获取限时奖励！',
    theme: SPRING_THEME,
    bellPresetId: 'spring_festival_bells',
  },
  {
    id: 'lantern',
    name: 'lantern',
    displayName: '元宵灯会',
    season: 'winter',
    icon: '🏮',
    description: '花灯如昼映钟楼，月圆校时正当时。元宵灯会限时开放，赢取花灯主题奖励！',
    theme: { ...SPRING_THEME, primaryColor: '#ff4040', secondaryColor: '#ff8060', borderColor: '#ff4040', glowColor: '#ff4040', iconColor: '#ff8060' },
    bellPresetId: 'lantern_bells',
  },
  {
    id: 'dragon_boat',
    name: 'dragon_boat',
    displayName: '端午龙舟',
    season: 'summer',
    icon: '🐉',
    description: '龙舟竞渡钟声催，校时争分夺秒来。端午限时活动，挑战速度极限！',
    theme: SUMMER_THEME,
    bellPresetId: 'dragon_boat_bells',
  },
  {
    id: 'mid_autumn',
    name: 'mid_autumn',
    displayName: '中秋赏月',
    season: 'autumn',
    icon: '🌕',
    description: '月满钟楼银辉洒，校时如镜映天涯。中秋佳节活动，精准校时赢月华奖励！',
    theme: AUTUMN_THEME,
    bellPresetId: 'mid_autumn_bells',
  },
  {
    id: 'double_ninth',
    name: 'double_ninth',
    displayName: '重阳登高',
    season: 'autumn',
    icon: '🏔️',
    description: '登高望远钟声远，重阳校时步步高。重阳节限时挑战，登顶排行赢殊荣！',
    theme: { ...AUTUMN_THEME, primaryColor: '#c07030', secondaryColor: '#d89860', borderColor: '#c07030', glowColor: '#c07030', iconColor: '#d89860' },
    bellPresetId: 'double_ninth_bells',
  },
  {
    id: 'christmas',
    name: 'christmas',
    displayName: '圣诞钟声',
    season: 'winter',
    icon: '🎄',
    description: '银铃叮当钟楼白，校时献礼盼春来。圣诞节限定活动，收集雪花换好礼！',
    theme: { ...WINTER_THEME, primaryColor: '#40a040', secondaryColor: '#60c060', borderColor: '#40a040', glowColor: '#60c060', iconColor: '#80d080' },
    bellPresetId: 'christmas_bells',
  },
  {
    id: 'halloween',
    name: 'halloween',
    displayName: '万圣夜',
    season: 'autumn',
    icon: '🎃',
    description: '幽暗钟楼夜色深，校时驱魔破阴森。万圣夜限时模式，暗夜校时赢南瓜灯！',
    theme: { ...AUTUMN_THEME, primaryColor: '#ff6600', secondaryColor: '#ff9944', borderColor: '#ff6600', glowColor: '#ff6600', iconColor: '#ff9944' },
    bellPresetId: 'halloween_bells',
  },
  {
    id: 'new_year',
    name: 'new_year',
    displayName: '新年庆典',
    season: 'winter',
    icon: '🎆',
    description: '新年钟声破晓来，校时启程万象开。新年庆典盛大开启，年终冲刺赢豪华奖！',
    theme: { ...WINTER_THEME, primaryColor: '#d0a0ff', secondaryColor: '#e0c0ff', borderColor: '#d0a0ff', glowColor: '#d0a0ff', iconColor: '#e0c0ff' },
    bellPresetId: 'new_year_bells',
  },
]

const now = Date.now()
const DAY = 86400000

export const FESTIVAL_PERIODS: FestivalActivityPeriod[] = [
  {
    id: 'spring_1',
    festivalId: 'spring_festival',
    name: '除夕守夜',
    displayName: '除夕守夜',
    order: 1,
    startTimestamp: now - DAY * 3,
    endTimestamp: now + DAY * 4,
    rules: {
      scoreMultiplier: 1.5,
      bonusCondition: 'perfect_align',
      bonusDescription: '完美校准（0偏差）额外加成2倍',
      bonusMultiplier: 2.0,
      maxAttemptsPerDay: 5,
      requiredAccuracy: 80,
      timeBonusThreshold: 60,
    },
    rewards: [
      { id: 'spring_r1', name: '红包钟声', displayName: '红包钟声', icon: '🧧', requiredScore: 500, type: 'bell_preset', rewardId: 'red_envelope_bells', quantity: 1, description: '春节限定红包钟声预设' },
      { id: 'spring_r2', name: '福字徽章', displayName: '福字徽章', icon: '🪪', requiredScore: 1500, type: 'badge', rewardId: 'fu_badge', quantity: 1, description: '春节限定福字徽章' },
      { id: 'spring_r3', name: '黄金齿轮', displayName: '黄金齿轮', icon: '⚙️', requiredScore: 3000, type: 'material', rewardId: 'gold', quantity: 1, description: '解锁黄金齿轮材质' },
    ],
  },
  {
    id: 'spring_2',
    festivalId: 'spring_festival',
    name: '初一来福',
    displayName: '初一来福',
    order: 2,
    startTimestamp: now + DAY * 4,
    endTimestamp: now + DAY * 10,
    rules: {
      scoreMultiplier: 2.0,
      bonusCondition: 'speed_clear',
      bonusDescription: '60秒内通关额外加成1.5倍',
      bonusMultiplier: 1.5,
      maxAttemptsPerDay: 3,
      requiredAccuracy: 85,
      timeBonusThreshold: 60,
    },
    rewards: [
      { id: 'spring2_r1', name: '烟花钟声', displayName: '烟花钟声', icon: '🎆', requiredScore: 800, type: 'bell_preset', rewardId: 'firework_bells', quantity: 1, description: '春节限定烟花钟声预设' },
      { id: 'spring2_r2', name: '铂金齿轮', displayName: '铂金齿轮', icon: '⚙️', requiredScore: 5000, type: 'material', rewardId: 'platinum', quantity: 1, description: '解锁铂金齿轮材质' },
    ],
  },
  {
    id: 'lantern_1',
    festivalId: 'lantern',
    name: '灯谜校时',
    displayName: '灯谜校时',
    order: 1,
    startTimestamp: now - DAY * 2,
    endTimestamp: now + DAY * 5,
    rules: {
      scoreMultiplier: 1.8,
      bonusCondition: 'consecutive_success',
      bonusDescription: '连续3次成功校准加成1.8倍',
      bonusMultiplier: 1.8,
      maxAttemptsPerDay: 5,
      requiredAccuracy: 75,
      timeBonusThreshold: 45,
    },
    rewards: [
      { id: 'lantern_r1', name: '花灯钟声', displayName: '花灯钟声', icon: '🏮', requiredScore: 600, type: 'bell_preset', rewardId: 'lantern_bell_preset', quantity: 1, description: '元宵限定花灯钟声' },
      { id: 'lantern_r2', name: '元宵徽章', displayName: '元宵徽章', icon: '🪪', requiredScore: 2000, type: 'badge', rewardId: 'lantern_badge', quantity: 1, description: '元宵限定徽章' },
    ],
  },
  {
    id: 'dragon_1',
    festivalId: 'dragon_boat',
    name: '龙舟竞速',
    displayName: '龙舟竞速',
    order: 1,
    startTimestamp: now - DAY,
    endTimestamp: now + DAY * 6,
    rules: {
      scoreMultiplier: 1.6,
      bonusCondition: 'speed_clear',
      bonusDescription: '30秒内通关加成2倍',
      bonusMultiplier: 2.0,
      maxAttemptsPerDay: 4,
      requiredAccuracy: 90,
      timeBonusThreshold: 30,
    },
    rewards: [
      { id: 'dragon_r1', name: '龙鼓钟声', displayName: '龙鼓钟声', icon: '🥁', requiredScore: 700, type: 'bell_preset', rewardId: 'dragon_drum_bells', quantity: 1, description: '端午限定龙鼓钟声' },
      { id: 'dragon_r2', name: '龙舟徽章', displayName: '龙舟徽章', icon: '🪪', requiredScore: 2500, type: 'badge', rewardId: 'dragon_boat_badge', quantity: 1, description: '端午限定龙舟徽章' },
    ],
  },
  {
    id: 'mid_autumn_1',
    festivalId: 'mid_autumn',
    name: '月华校时',
    displayName: '月华校时',
    order: 1,
    startTimestamp: now - DAY * 2,
    endTimestamp: now + DAY * 7,
    rules: {
      scoreMultiplier: 1.7,
      bonusCondition: 'perfect_align',
      bonusDescription: '完美校准加成2.5倍',
      bonusMultiplier: 2.5,
      maxAttemptsPerDay: 5,
      requiredAccuracy: 80,
      timeBonusThreshold: 50,
    },
    rewards: [
      { id: 'mid_r1', name: '月华钟声', displayName: '月华钟声', icon: '🌙', requiredScore: 600, type: 'bell_preset', rewardId: 'moonlight_bells', quantity: 1, description: '中秋限定月华钟声' },
      { id: 'mid_r2', name: '月饼徽章', displayName: '月饼徽章', icon: '🪪', requiredScore: 1800, type: 'badge', rewardId: 'mooncake_badge', quantity: 1, description: '中秋限定月饼徽章' },
      { id: 'mid_r3', name: '白银齿轮', displayName: '白银齿轮', icon: '⚙️', requiredScore: 4000, type: 'material', rewardId: 'silver', quantity: 1, description: '解锁白银齿轮材质' },
    ],
  },
  {
    id: 'halloween_1',
    festivalId: 'halloween',
    name: '暗夜校时',
    displayName: '暗夜校时',
    order: 1,
    startTimestamp: now - DAY * 3,
    endTimestamp: now + DAY * 4,
    rules: {
      scoreMultiplier: 2.0,
      bonusCondition: 'no_fault',
      bonusDescription: '无故障通关加成2倍',
      bonusMultiplier: 2.0,
      maxAttemptsPerDay: 3,
      requiredAccuracy: 85,
      timeBonusThreshold: 45,
    },
    rewards: [
      { id: 'hallow_r1', name: '鬼魅钟声', displayName: '鬼魅钟声', icon: '👻', requiredScore: 800, type: 'bell_preset', rewardId: 'ghost_bells', quantity: 1, description: '万圣限定鬼魅钟声' },
      { id: 'hallow_r2', name: '南瓜徽章', displayName: '南瓜徽章', icon: '🪪', requiredScore: 2200, type: 'badge', rewardId: 'pumpkin_badge', quantity: 1, description: '万圣限定南瓜徽章' },
    ],
  },
  {
    id: 'christmas_1',
    festivalId: 'christmas',
    name: '铃儿响叮当',
    displayName: '铃儿响叮当',
    order: 1,
    startTimestamp: now - DAY * 5,
    endTimestamp: now + DAY * 8,
    rules: {
      scoreMultiplier: 1.5,
      bonusCondition: 'consecutive_success',
      bonusDescription: '连续5次成功加成2倍',
      bonusMultiplier: 2.0,
      maxAttemptsPerDay: 6,
      requiredAccuracy: 70,
      timeBonusThreshold: 60,
    },
    rewards: [
      { id: 'xmas_r1', name: '雪橇钟声', displayName: '雪橇钟声', icon: '🔔', requiredScore: 500, type: 'bell_preset', rewardId: 'sleigh_bells', quantity: 1, description: '圣诞限定雪橇钟声' },
      { id: 'xmas_r2', name: '雪花徽章', displayName: '雪花徽章', icon: '🪪', requiredScore: 1500, type: 'badge', rewardId: 'snowflake_badge', quantity: 1, description: '圣诞限定雪花徽章' },
      { id: 'xmas_r3', name: '校时望远镜', displayName: '校时望远镜', icon: '🔭', requiredScore: 3000, type: 'tool', rewardId: 'telescope', quantity: 1, description: '解锁校时望远镜工具' },
    ],
  },
  {
    id: 'new_year_1',
    festivalId: 'new_year',
    name: '跨年钟声',
    displayName: '跨年钟声',
    order: 1,
    startTimestamp: now - DAY,
    endTimestamp: now + DAY * 6,
    rules: {
      scoreMultiplier: 2.5,
      bonusCondition: 'perfect_align',
      bonusDescription: '完美校准加成3倍',
      bonusMultiplier: 3.0,
      maxAttemptsPerDay: 3,
      requiredAccuracy: 90,
      timeBonusThreshold: 40,
    },
    rewards: [
      { id: 'ny_r1', name: '庆典钟声', displayName: '庆典钟声', icon: '🎆', requiredScore: 1000, type: 'bell_preset', rewardId: 'celebration_bells', quantity: 1, description: '新年限定庆典钟声' },
      { id: 'ny_r2', name: '新年徽章', displayName: '新年徽章', icon: '🪪', requiredScore: 3000, type: 'badge', rewardId: 'new_year_badge', quantity: 1, description: '新年限定徽章' },
      { id: 'ny_r3', name: '铂金齿轮', displayName: '铂金齿轮', icon: '⚙️', requiredScore: 6000, type: 'material', rewardId: 'platinum', quantity: 1, description: '解锁铂金齿轮材质' },
    ],
  },
]

const STORAGE_KEY = 'clocktower_festival_activity_v1'

const DEFAULT_STATE: FestivalActivityState = {
  currentFestivalId: null,
  activePeriodIds: [],
  playerRecords: [],
  totalFestivalScore: 0,
  unlockedFestivalIds: [],
  claimedRewardIds: [],
}

const MOCK_LEADERBOARD: FestivalLeaderboardEntry[] = [
  { rank: 1, playerId: 'p1', playerName: '守钟大师', playerAvatar: '⏰', score: 12800, completedAt: now - 3600000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 2, playerId: 'p2', playerName: '钟楼守望者', playerAvatar: '🏰', score: 10500, completedAt: now - 7200000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 3, playerId: 'p3', playerName: '校时达人', playerAvatar: '🔧', score: 9200, completedAt: now - 10800000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 4, playerId: 'p4', playerName: '齿轮匠人', playerAvatar: '⚙️', score: 7800, completedAt: now - 14400000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 5, playerId: 'p5', playerName: '夜巡钟声', playerAvatar: '🌙', score: 6500, completedAt: now - 18000000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 6, playerId: 'p6', playerName: '晨钟暮鼓', playerAvatar: '🌅', score: 5200, completedAt: now - 21600000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 7, playerId: 'p7', playerName: '时光旅人', playerAvatar: '⏳', score: 4800, completedAt: now - 25200000, festivalId: 'spring_festival', periodId: 'spring_1' },
  { rank: 8, playerId: 'p8', playerName: '钟楼学徒', playerAvatar: '🔔', score: 3500, completedAt: now - 28800000, festivalId: 'spring_festival', periodId: 'spring_1' },
]

export class FestivalActivitySystem {
  private state: FestivalActivityState

  constructor() {
    this.state = this.loadState()
    this.refreshActivePeriods()
  }

  private loadState(): FestivalActivityState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FestivalActivityState
        return { ...DEFAULT_STATE, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load festival activity state', e)
    }
    return { ...DEFAULT_STATE }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save festival activity state', e)
    }
  }

  private refreshActivePeriods(): void {
    const nowTs = Date.now()
    const active = FESTIVAL_PERIODS.filter(
      (p) => p.startTimestamp <= nowTs && p.endTimestamp >= nowTs
    ).map((p) => p.id)
    this.state.activePeriodIds = active
    if (active.length > 0 && !this.state.currentFestivalId) {
      const firstActive = FESTIVAL_PERIODS.find((p) => p.id === active[0])
      if (firstActive) {
        this.state.currentFestivalId = firstActive.festivalId
      }
    }
  }

  getState(): FestivalActivityState {
    this.refreshActivePeriods()
    return { ...this.state }
  }

  getAllFestivals(): FestivalConfig[] {
    return FESTIVAL_CONFIGS
  }

  getFestival(id: FestivalId): FestivalConfig | undefined {
    return FESTIVAL_CONFIGS.find((f) => f.id === id)
  }

  getCurrentFestival(): FestivalConfig | null {
    if (!this.state.currentFestivalId) return null
    return this.getFestival(this.state.currentFestivalId) ?? null
  }

  setCurrentFestival(id: FestivalId): void {
    this.state.currentFestivalId = id
    if (!this.state.unlockedFestivalIds.includes(id)) {
      this.state.unlockedFestivalIds.push(id)
    }
    this.saveState()
  }

  getPeriodsForFestival(festivalId: FestivalId): FestivalActivityPeriod[] {
    return FESTIVAL_PERIODS.filter((p) => p.festivalId === festivalId).sort(
      (a, b) => a.order - b.order
    )
  }

  getActivePeriods(): FestivalActivityPeriod[] {
    const nowTs = Date.now()
    return FESTIVAL_PERIODS.filter(
      (p) => p.startTimestamp <= nowTs && p.endTimestamp >= nowTs
    )
  }

  getActivePeriodsForFestival(festivalId: FestivalId): FestivalActivityPeriod[] {
    const nowTs = Date.now()
    return FESTIVAL_PERIODS.filter(
      (p) => p.festivalId === festivalId && p.startTimestamp <= nowTs && p.endTimestamp >= nowTs
    ).sort((a, b) => a.order - b.order)
  }

  getPeriod(id: string): FestivalActivityPeriod | undefined {
    return FESTIVAL_PERIODS.find((p) => p.id === id)
  }

  isPeriodActive(periodId: string): boolean {
    const period = this.getPeriod(periodId)
    if (!period) return false
    const nowTs = Date.now()
    return period.startTimestamp <= nowTs && period.endTimestamp >= nowTs
  }

  getPeriodTimeRemaining(periodId: string): number {
    const period = this.getPeriod(periodId)
    if (!period) return 0
    return Math.max(0, period.endTimestamp - Date.now())
  }

  getPeriodTimeUntilStart(periodId: string): number {
    const period = this.getPeriod(periodId)
    if (!period) return 0
    return Math.max(0, period.startTimestamp - Date.now())
  }

  getPlayerRecord(festivalId: FestivalId, periodId: string): FestivalPlayerRecord | undefined {
    return this.state.playerRecords.find(
      (r) => r.festivalId === festivalId && r.periodId === periodId
    )
  }

  recordScore(festivalId: FestivalId, periodId: string, score: number): void {
    let record = this.getPlayerRecord(festivalId, periodId)
    const nowTs = Date.now()

    if (!record) {
      record = {
        festivalId,
        periodId,
        totalScore: 0,
        bestScore: 0,
        attempts: 0,
        claimedRewards: [],
        lastPlayTimestamp: 0,
        dailyAttempts: 0,
        lastDailyReset: 0,
      }
      this.state.playerRecords.push(record)
    }

    if (nowTs - record.lastDailyReset >= DAY) {
      record.dailyAttempts = 0
      record.lastDailyReset = nowTs
    }

    record.totalScore += score
    if (score > record.bestScore) {
      record.bestScore = score
    }
    record.attempts += 1
    record.dailyAttempts += 1
    record.lastPlayTimestamp = nowTs

    this.state.totalFestivalScore += score
    if (!this.state.unlockedFestivalIds.includes(festivalId)) {
      this.state.unlockedFestivalIds.push(festivalId)
    }
    this.saveState()
  }

  canPlayPeriod(festivalId: FestivalId, periodId: string): boolean {
    if (!this.isPeriodActive(periodId)) return false
    const record = this.getPlayerRecord(festivalId, periodId)
    const period = this.getPeriod(periodId)
    if (!period) return false
    if (!record) return true
    const nowTs = Date.now()
    if (nowTs - record.lastDailyReset >= DAY) return true
    return record.dailyAttempts < period.rules.maxAttemptsPerDay
  }

  getRemainingAttempts(festivalId: FestivalId, periodId: string): number {
    const record = this.getPlayerRecord(festivalId, periodId)
    const period = this.getPeriod(periodId)
    if (!period) return 0
    if (!record) return period.rules.maxAttemptsPerDay
    const nowTs = Date.now()
    if (nowTs - record.lastDailyReset >= DAY) return period.rules.maxAttemptsPerDay
    return Math.max(0, period.rules.maxAttemptsPerDay - record.dailyAttempts)
  }

  claimReward(rewardId: string): boolean {
    if (this.state.claimedRewardIds.includes(rewardId)) return false
    let reward: FestivalPeriodReward | undefined
    for (const period of FESTIVAL_PERIODS) {
      reward = period.rewards.find((r) => r.id === rewardId)
      if (reward) break
    }
    if (!reward) return false
    const record = this.state.playerRecords.find(
      (r) => r.totalScore >= reward!.requiredScore
    )
    if (!record) return false
    this.state.claimedRewardIds.push(rewardId)
    record.claimedRewards.push(rewardId)
    this.saveState()
    return true
  }

  isRewardClaimed(rewardId: string): boolean {
    return this.state.claimedRewardIds.includes(rewardId)
  }

  canClaimReward(rewardId: string): boolean {
    if (this.state.claimedRewardIds.includes(rewardId)) return false
    let reward: FestivalPeriodReward | undefined
    for (const period of FESTIVAL_PERIODS) {
      reward = period.rewards.find((r) => r.id === rewardId)
      if (reward) break
    }
    if (!reward) return false
    return this.state.playerRecords.some(
      (r) => r.totalScore >= reward!.requiredScore
    )
  }

  getLeaderboard(festivalId: FestivalId, periodId: string): FestivalLeaderboardEntry[] {
    const filtered = MOCK_LEADERBOARD.filter(
      (e) => e.festivalId === festivalId && e.periodId === periodId
    )
    if (filtered.length > 0) return filtered
    return MOCK_LEADERBOARD.map((e) => ({
      ...e,
      festivalId,
      periodId,
      score: Math.floor(e.score * (0.5 + Math.random() * 0.8)),
    })).sort((a, b) => b.score - a.score)
  }

  getEffects(): FestivalActivityEffects {
    const festival = this.getCurrentFestival()
    const activePeriods = this.getActivePeriods()

    if (!festival || activePeriods.length === 0) {
      return {
        scoreMultiplier: 1,
        bonusMultiplier: 1,
        maxAttemptsPerDay: 0,
        activeFestival: null,
        activePeriod: null,
        theme: null,
      }
    }

    const firstPeriod = activePeriods[0]
    return {
      scoreMultiplier: firstPeriod.rules.scoreMultiplier,
      bonusMultiplier: firstPeriod.rules.bonusMultiplier,
      maxAttemptsPerDay: firstPeriod.rules.maxAttemptsPerDay,
      activeFestival: festival,
      activePeriod: firstPeriod,
      theme: festival.theme,
    }
  }

  getSeasonFestivals(season: FestivalSeason): FestivalConfig[] {
    return FESTIVAL_CONFIGS.filter((f) => f.season === season)
  }

  getTotalFestivalScore(): number {
    return this.state.totalFestivalScore
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE }
    this.saveState()
  }
}

export const festivalActivitySystem = new FestivalActivitySystem()
