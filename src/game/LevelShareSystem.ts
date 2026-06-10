import type {
  EditorLevelConfig,
  PlayerProfile,
  SharedLevel,
  LevelClearRecord,
  LevelComment,
  LevelShareFilters,
  LevelSortType,
} from '../types'

const STORAGE_KEYS = {
  PLAYER_PROFILE: 'clocktower_player_profile',
  SHARED_LEVELS: 'clocktower_shared_levels',
  CLEAR_RECORDS: 'clocktower_clear_records',
  COMMENTS: 'clocktower_level_comments',
  LIKED_LEVELS: 'clocktower_liked_levels',
  MY_LEVELS: 'clocktower_my_levels',
}

const AVATARS = ['🕐', '🕑', '🕓', '🕕', '🕗', '🕙', '⏰', '⌚', '🔔', '⚙️', '🌟', '🎯']

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)]
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('保存数据失败', e)
  }
}

function createMockLevels(): SharedLevel[] {
  const now = Date.now()
  const mockLevels: SharedLevel[] = [
    {
      id: 'level_mock_1',
      authorId: 'player_mock_1',
      authorName: '钟塔守护者',
      authorAvatar: '🕐',
      title: '新手入门·三齿轮',
      description: '适合新手的简单关卡，三个齿轮轻松上手。初始12:00，目标3:45。',
      difficulty: 'easy',
      tags: ['新手', '经典', '三齿轮'],
      likes: 128,
      plays: 1024,
      completions: 856,
      averageScore: 850,
      bestScore: 1250,
      bestTime: 45,
      createdAt: now - 86400000 * 7,
      updatedAt: now - 86400000 * 7,
      isFeatured: true,
      levelData: createMockLevelData(1),
    },
    {
      id: 'level_mock_2',
      authorId: 'player_mock_2',
      authorName: '齿轮大师',
      authorAvatar: '⚙️',
      title: '齿轮迷阵',
      description: '五个齿轮交织联动，考验你的空间思维能力！',
      difficulty: 'normal',
      tags: ['经典', '五齿轮', '挑战'],
      likes: 256,
      plays: 2048,
      completions: 1230,
      averageScore: 720,
      bestScore: 1580,
      bestTime: 68,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 2,
      isFeatured: true,
      levelData: createMockLevelData(2),
    },
    {
      id: 'level_mock_3',
      authorId: 'player_mock_3',
      authorName: '暗夜巡守人',
      authorAvatar: '🌙',
      title: '暴风雨之夜',
      description: '带有故障事件的巡夜模式，你能在风暴中保持钟面准确吗？',
      difficulty: 'hard',
      tags: ['巡夜', '故障', '风暴'],
      likes: 189,
      plays: 892,
      completions: 312,
      averageScore: 540,
      bestScore: 1890,
      bestTime: 95,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 1,
      levelData: createMockLevelData(3),
    },
    {
      id: 'level_mock_4',
      authorId: 'player_mock_4',
      authorName: '多塔建筑师',
      authorAvatar: '🏰',
      title: '三塔联动',
      description: '多钟面连锁模式，主钟加两座侧塔，同时对齐才算胜利！',
      difficulty: 'expert',
      tags: ['多钟面', '连锁', '专家'],
      likes: 342,
      plays: 1567,
      completions: 245,
      averageScore: 420,
      bestScore: 2100,
      bestTime: 120,
      createdAt: now - 86400000 * 10,
      updatedAt: now - 86400000 * 4,
      isFeatured: true,
      levelData: createMockLevelData(4),
    },
    {
      id: 'level_mock_5',
      authorId: 'player_mock_1',
      authorName: '钟塔守护者',
      authorAvatar: '🕐',
      title: '晨间小调',
      description: '轻松愉快的早间关卡，适合热身练习。',
      difficulty: 'easy',
      tags: ['新手', '热身', '简单'],
      likes: 67,
      plays: 512,
      completions: 445,
      averageScore: 920,
      bestScore: 1100,
      bestTime: 32,
      createdAt: now - 86400000 * 1,
      updatedAt: now - 86400000 * 1,
      levelData: createMockLevelData(5),
    },
    {
      id: 'level_mock_6',
      authorId: 'player_mock_5',
      authorName: '时间旅人',
      authorAvatar: '⏳',
      title: '齿轮迷宫',
      description: '七个齿轮组成的复杂迷宫，只有最聪明的守钟人才能解开。',
      difficulty: 'expert',
      tags: ['七齿轮', '迷宫', '高难度'],
      likes: 198,
      plays: 756,
      completions: 89,
      averageScore: 380,
      bestScore: 2450,
      bestTime: 150,
      createdAt: now - 86400000 * 14,
      updatedAt: now - 86400000 * 6,
      levelData: createMockLevelData(6),
    },
  ]
  return mockLevels
}

function createMockLevelData(id: number): EditorLevelConfig {
  const baseTime = Date.now() - id * 86400000
  const gears = [
    { id: 1, x: 300, y: 250, size: 'large' as const, connectedTo: [2, 3], initialAngle: 0, label: '主齿轮' },
    { id: 2, x: 180, y: 150, size: 'medium' as const, connectedTo: [1], initialAngle: 0, label: '左上' },
    { id: 3, x: 420, y: 150, size: 'medium' as const, connectedTo: [1, 4], initialAngle: 0, label: '右上' },
    { id: 4, x: 500, y: 300, size: 'small' as const, connectedTo: [3], initialAngle: 0, label: '右侧' },
  ]

  if (id >= 2) {
    gears.push({ id: 5, x: 150, y: 320, size: 'small' as const, connectedTo: [2], initialAngle: 45, label: '左下' })
  }
  if (id >= 3) {
    gears.push({ id: 6, x: 350, y: 380, size: 'medium' as const, connectedTo: [1, 5], initialAngle: 90, label: '下方' })
  }

  const targets: Record<number, { hours: number; minutes: number }> = {
    1: { hours: 3, minutes: 45 },
    2: { hours: 6, minutes: 30 },
    3: { hours: 9, minutes: 15 },
    4: { hours: 12, minutes: 0 },
    5: { hours: 2, minutes: 30 },
    6: { hours: 7, minutes: 45 },
  }

  const durations: Record<number, number> = {
    1: 120,
    2: 150,
    3: 180,
    4: 200,
    5: 90,
    6: 240,
  }

  const tolerances: Record<number, number> = {
    1: 5,
    2: 3,
    3: 2,
    4: 1,
    5: 8,
    6: 1,
  }

  return {
    id: `level_mock_${id}`,
    name: `mock_level_${id}`,
    displayName: `Mock Level ${id}`,
    description: '',
    gameMode: id === 3 ? 'patrol' : id === 4 ? 'multiclock' : 'classic',
    duration: durations[id] || 120,
    gears,
    initialClockTime: { hours: 12, minutes: 0 },
    targetClockTime: targets[id] || { hours: 3, minutes: 0 },
    toleranceMinutes: tolerances[id] || 3,
    scoreMultiplier: id >= 4 ? 2.0 : id >= 2 ? 1.5 : 1.0,
    faultEvents: id >= 3 ? [
      {
        id: 'fault_mock_1',
        name: 'slip_fault',
        displayName: '齿轮打滑',
        type: 'slip' as const,
        triggerType: 'time' as const,
        triggerValue: 30,
        targetGearIds: [1],
        duration: 10,
        enabled: true,
      },
    ] : [],
    soundConfigs: [],
    createdAt: baseTime,
    updatedAt: baseTime,
  }
}

function createMockRecords(): LevelClearRecord[] {
  const now = Date.now()
  return [
    {
      id: 'record_1',
      levelId: 'level_mock_1',
      playerId: 'player_mock_10',
      playerName: '极速守钟人',
      playerAvatar: '⚡',
      score: 1250,
      timeUsed: 45,
      deviation: 0.5,
      stars: 3,
      completedAt: now - 3600000,
      isNewRecord: true,
    },
    {
      id: 'record_2',
      levelId: 'level_mock_1',
      playerId: 'player_mock_11',
      playerName: '精密校准师',
      playerAvatar: '🎯',
      score: 1180,
      timeUsed: 52,
      deviation: 0.2,
      stars: 3,
      completedAt: now - 7200000,
    },
    {
      id: 'record_3',
      levelId: 'level_mock_1',
      playerId: 'player_mock_12',
      playerName: '新手小白',
      playerAvatar: '🌱',
      score: 650,
      timeUsed: 110,
      deviation: 3,
      stars: 1,
      completedAt: now - 14400000,
    },
    {
      id: 'record_4',
      levelId: 'level_mock_2',
      playerId: 'player_mock_13',
      playerName: '齿轮达人',
      playerAvatar: '⚙️',
      score: 1580,
      timeUsed: 68,
      deviation: 0.3,
      stars: 3,
      completedAt: now - 1800000,
    },
  ]
}

function createMockComments(): LevelComment[] {
  const now = Date.now()
  return [
    {
      id: 'comment_1',
      levelId: 'level_mock_1',
      playerId: 'player_mock_20',
      playerName: '初学者小明',
      playerAvatar: '😊',
      content: '太棒了！作为新手第一个就过了，设计得很合理~',
      rating: 5,
      createdAt: now - 86400000,
      likes: 12,
    },
    {
      id: 'comment_2',
      levelId: 'level_mock_1',
      playerId: 'player_mock_21',
      playerName: '老玩家阿灰',
      playerAvatar: '🐺',
      content: '太简单了，建议增加难度',
      rating: 3,
      createdAt: now - 172800000,
      likes: 3,
    },
    {
      id: 'comment_3',
      levelId: 'level_mock_2',
      playerId: 'player_mock_22',
      playerName: '解谜爱好者',
      playerAvatar: '🧩',
      content: '齿轮联动设计得很巧妙，花了好一会儿才想明白！',
      rating: 5,
      createdAt: now - 43200000,
      likes: 28,
    },
  ]
}

class LevelShareSystem {
  private profile: PlayerProfile | null = null
  private sharedLevels: SharedLevel[] = []
  private clearRecords: LevelClearRecord[] = []
  private comments: LevelComment[] = []
  private likedLevelIds: Set<string> = new Set()
  private myLevelIds: Set<string> = new Set()

  constructor() {
    this.init()
  }

  private init(): void {
    this.profile = loadFromStorage<PlayerProfile | null>(STORAGE_KEYS.PLAYER_PROFILE, null)
    this.sharedLevels = loadFromStorage<SharedLevel[]>(STORAGE_KEYS.SHARED_LEVELS, [])
    this.clearRecords = loadFromStorage<LevelClearRecord[]>(STORAGE_KEYS.CLEAR_RECORDS, [])
    this.comments = loadFromStorage<LevelComment[]>(STORAGE_KEYS.COMMENTS, [])
    this.likedLevelIds = new Set(loadFromStorage<string[]>(STORAGE_KEYS.LIKED_LEVELS, []))
    this.myLevelIds = new Set(loadFromStorage<string[]>(STORAGE_KEYS.MY_LEVELS, []))

    if (this.sharedLevels.length === 0) {
      this.sharedLevels = createMockLevels()
      saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)
    }
    if (this.clearRecords.length === 0) {
      this.clearRecords = createMockRecords()
      saveToStorage(STORAGE_KEYS.CLEAR_RECORDS, this.clearRecords)
    }
    if (this.comments.length === 0) {
      this.comments = createMockComments()
      saveToStorage(STORAGE_KEYS.COMMENTS, this.comments)
    }

    if (!this.profile) {
      this.profile = {
        id: generateId('player'),
        nickname: '守钟人' + Math.floor(Math.random() * 1000),
        avatar: getRandomAvatar(),
        totalScore: 0,
        levelsCreated: 0,
        levelsCompleted: 0,
        createdAt: Date.now(),
      }
      saveToStorage(STORAGE_KEYS.PLAYER_PROFILE, this.profile)
    }
  }

  getProfile(): PlayerProfile {
    return this.profile!
  }

  updateProfile(updates: Partial<PlayerProfile>): PlayerProfile {
    this.profile = { ...this.profile!, ...updates }
    saveToStorage(STORAGE_KEYS.PLAYER_PROFILE, this.profile)
    return this.profile
  }

  getSharedLevels(filters: LevelShareFilters): SharedLevel[] {
    let levels = [...this.sharedLevels]

    if (filters.difficulty) {
      levels = levels.filter((l) => l.difficulty === filters.difficulty)
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      levels = levels.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.tags.some((t) => t.toLowerCase().includes(query)),
      )
    }

    if (filters.authorId) {
      levels = levels.filter((l) => l.authorId === filters.authorId)
    }

    if (filters.tags && filters.tags.length > 0) {
      levels = levels.filter((l) => filters.tags!.some((t) => l.tags.includes(t)))
    }

    levels = this.sortLevels(levels, filters.sortBy)

    return levels
  }

  private sortLevels(levels: SharedLevel[], sortBy: LevelSortType): SharedLevel[] {
    const sorted = [...levels]
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => b.createdAt - a.createdAt)
      case 'popular':
        return sorted.sort((a, b) => b.likes - a.likes)
      case 'mostPlayed':
        return sorted.sort((a, b) => b.plays - a.plays)
      case 'highestRated':
        return sorted.sort((a, b) => b.averageScore - a.averageScore)
      case 'easiest':
        return sorted.sort((a, b) => {
          const rateA = a.completions / Math.max(a.plays, 1)
          const rateB = b.completions / Math.max(b.plays, 1)
          return rateB - rateA
        })
      case 'hardest':
        return sorted.sort((a, b) => {
          const rateA = a.completions / Math.max(a.plays, 1)
          const rateB = b.completions / Math.max(b.plays, 1)
          return rateA - rateB
        })
      default:
        return sorted
    }
  }

  getLevelById(levelId: string): SharedLevel | null {
    return this.sharedLevels.find((l) => l.id === levelId) || null
  }

  getMyLevels(): SharedLevel[] {
    return this.sharedLevels.filter((l) => this.myLevelIds.has(l.id))
  }

  shareLevel(levelData: EditorLevelConfig, title: string, description: string, difficulty: SharedLevel['difficulty'], tags: string[]): SharedLevel {
    const profile = this.getProfile()
    const newLevel: SharedLevel = {
      id: generateId('shared'),
      authorId: profile.id,
      authorName: profile.nickname,
      authorAvatar: profile.avatar,
      levelData: { ...levelData, id: generateId('level') },
      title,
      description,
      difficulty,
      tags,
      likes: 0,
      plays: 0,
      completions: 0,
      averageScore: 0,
      bestScore: 0,
      bestTime: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.sharedLevels.unshift(newLevel)
    this.myLevelIds.add(newLevel.id)

    saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)
    saveToStorage(STORAGE_KEYS.MY_LEVELS, [...this.myLevelIds])

    this.updateProfile({ levelsCreated: profile.levelsCreated + 1 })

    return newLevel
  }

  deleteLevel(levelId: string): boolean {
    const level = this.getLevelById(levelId)
    if (!level || level.authorId !== this.getProfile().id) return false

    this.sharedLevels = this.sharedLevels.filter((l) => l.id !== levelId)
    this.myLevelIds.delete(levelId)
    this.clearRecords = this.clearRecords.filter((r) => r.levelId !== levelId)
    this.comments = this.comments.filter((c) => c.levelId !== levelId)

    saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)
    saveToStorage(STORAGE_KEYS.MY_LEVELS, [...this.myLevelIds])
    saveToStorage(STORAGE_KEYS.CLEAR_RECORDS, this.clearRecords)
    saveToStorage(STORAGE_KEYS.COMMENTS, this.comments)

    const profile = this.getProfile()
    this.updateProfile({ levelsCreated: Math.max(0, profile.levelsCreated - 1) })

    return true
  }

  incrementPlayCount(levelId: string): void {
    const level = this.getLevelById(levelId)
    if (!level) return

    level.plays += 1
    level.updatedAt = Date.now()
    saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)
  }

  recordClear(levelId: string, score: number, timeUsed: number, deviation: number): LevelClearRecord | null {
    const level = this.getLevelById(levelId)
    if (!level) return null

    const profile = this.getProfile()

    const stars = deviation <= 1 ? 3 : deviation <= 3 ? 2 : 1

    const record: LevelClearRecord = {
      id: generateId('record'),
      levelId,
      playerId: profile.id,
      playerName: profile.nickname,
      playerAvatar: profile.avatar,
      score,
      timeUsed,
      deviation,
      stars,
      completedAt: Date.now(),
    }

    const existingBest = this.getBestRecord(levelId)
    record.isNewRecord = !existingBest || score > existingBest.score

    this.clearRecords.push(record)

    level.completions += 1
    if (score > level.bestScore) {
      level.bestScore = score
    }
    if (timeUsed < level.bestTime || level.bestTime === 0) {
      level.bestTime = timeUsed
    }

    const levelRecords = this.getLevelRecords(levelId)
    level.averageScore = Math.round(levelRecords.reduce((sum, r) => sum + r.score, 0) / levelRecords.length)

    level.updatedAt = Date.now()

    saveToStorage(STORAGE_KEYS.CLEAR_RECORDS, this.clearRecords)
    saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)

    const newTotal = profile.totalScore + score
    this.updateProfile({
      totalScore: newTotal,
      levelsCompleted: profile.levelsCompleted + 1,
    })

    return record
  }

  getLevelRecords(levelId: string, limit = 10): LevelClearRecord[] {
    return this.clearRecords
      .filter((r) => r.levelId === levelId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  getMyRecords(levelId?: string): LevelClearRecord[] {
    const profile = this.getProfile()
    let records = this.clearRecords.filter((r) => r.playerId === profile.id)
    if (levelId) {
      records = records.filter((r) => r.levelId === levelId)
    }
    return records.sort((a, b) => b.completedAt - a.completedAt)
  }

  getBestRecord(levelId: string): LevelClearRecord | null {
    const records = this.getLevelRecords(levelId, 1)
    return records[0] || null
  }

  hasClearedLevel(levelId: string): boolean {
    const profile = this.getProfile()
    return this.clearRecords.some((r) => r.levelId === levelId && r.playerId === profile.id)
  }

  isLiked(levelId: string): boolean {
    return this.likedLevelIds.has(levelId)
  }

  toggleLike(levelId: string): boolean {
    const level = this.getLevelById(levelId)
    if (!level) return false

    if (this.likedLevelIds.has(levelId)) {
      this.likedLevelIds.delete(levelId)
      level.likes = Math.max(0, level.likes - 1)
    } else {
      this.likedLevelIds.add(levelId)
      level.likes += 1
    }

    level.updatedAt = Date.now()
    saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)
    saveToStorage(STORAGE_KEYS.LIKED_LEVELS, [...this.likedLevelIds])

    return this.likedLevelIds.has(levelId)
  }

  addComment(levelId: string, content: string, rating: number): LevelComment | null {
    const level = this.getLevelById(levelId)
    if (!level) return null

    const profile = this.getProfile()

    const comment: LevelComment = {
      id: generateId('comment'),
      levelId,
      playerId: profile.id,
      playerName: profile.nickname,
      playerAvatar: profile.avatar,
      content,
      rating,
      createdAt: Date.now(),
      likes: 0,
    }

    this.comments.unshift(comment)
    level.updatedAt = Date.now()

    saveToStorage(STORAGE_KEYS.COMMENTS, this.comments)
    saveToStorage(STORAGE_KEYS.SHARED_LEVELS, this.sharedLevels)

    return comment
  }

  getLevelComments(levelId: string): LevelComment[] {
    return this.comments
      .filter((c) => c.levelId === levelId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  getFeaturedLevels(): SharedLevel[] {
    return this.sharedLevels.filter((l) => l.isFeatured)
  }

  getAllTags(): string[] {
    const tagSet = new Set<string>()
    this.sharedLevels.forEach((l) => l.tags.forEach((t) => tagSet.add(t)))
    return [...tagSet]
  }

  formatTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 30) return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
  }

  getDifficultyLabel(difficulty: SharedLevel['difficulty']): string {
    const labels: Record<SharedLevel['difficulty'], string> = {
      easy: '简单',
      normal: '普通',
      hard: '困难',
      expert: '专家',
    }
    return labels[difficulty]
  }

  getDifficultyColor(difficulty: SharedLevel['difficulty']): string {
    const colors: Record<SharedLevel['difficulty'], string> = {
      easy: '#7ec97e',
      normal: '#c9a96a',
      hard: '#e8a35a',
      expert: '#e85a5a',
    }
    return colors[difficulty]
  }
}

export const levelShareSystem = new LevelShareSystem()
