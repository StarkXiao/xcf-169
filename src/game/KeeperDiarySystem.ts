import type {
  DiaryEntry,
  DiaryEntryId,
  KeeperDiaryState,
  KeeperDiaryEffects,
  DiaryUnlockCondition,
  DiarySettlementText,
  DiaryLevelObjective,
} from '../types'
import { workshopSystem } from './WorkshopSystem'
import { DiaryTargetInjector } from './modules/DiaryTargetInjector'
import { DiaryScoreCalculator, type GameResultRecord } from './modules/DiaryScoreCalculator'
import { DiarySettlementProvider } from './modules/DiarySettlementProvider'

const STORAGE_KEY = 'clocktower_keeper_diary_v1'

const DEFAULT_STATE: KeeperDiaryState = {
  unlockedEntryIds: [],
  readEntryIds: [],
  activeCalibrationIds: [],
  totalDiaryScore: 0,
  currentEntryId: null,
  lastEntryUnlockedAt: 0,
  flags: {},
  stats: {
    totalPlays: 0,
    perfectClears: 0,
    consecutiveWins: 0,
    bestConsecutiveWins: 0,
    fastestClearSeconds: 9999,
    noFaultClears: 0,
  },
}

export const DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'diary_001',
    order: 1,
    title: '初遇钟楼',
    subtitle: '一切的开始',
    icon: '📖',
    date: '第一日',
    content: '今天是我成为守钟学徒的第一天。老守钟人艾德温带我参观了整座钟楼。\n\n他说："守钟人的职责，不仅仅是让钟声准时响起，更是守护时间本身。"\n\n站在巨大的齿轮前，我感到既兴奋又紧张。那些铜制的齿轮缓缓转动，仿佛在诉说着百年的故事。\n\n我一定要成为一名出色的守钟人！',
    mood: 'excited',
    unlockConditions: [
      { type: 'total_plays', value: 1 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'score_multiplier', value: 1.05, description: '新手加成：得分+5%' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 100 },
    ],
  },
  {
    id: 'diary_002',
    order: 2,
    title: '完美校准',
    subtitle: '零偏差的艺术',
    icon: '✨',
    date: '第七日',
    content: '今天我终于做到了——完美校准！\n\n时针和分毫不差地对准了目标时刻，连艾德温都露出了赞许的微笑。\n\n"时间的精准，来自内心的平静。"他这样说道。\n\n我开始明白，校时不仅仅是技术，更是一种修行。当你心无旁骛时，齿轮仿佛会回应你的意志。',
    mood: 'happy',
    unlockConditions: [
      { type: 'perfect_clear', value: 1 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'tolerance', value: 1, description: '精准加成：容差+1分钟' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 200 },
      { type: 'badge', id: 'perfect_calibrator' },
    ],
  },
  {
    id: 'diary_003',
    order: 3,
    title: '齿轮的低语',
    subtitle: '聆听机械的心跳',
    icon: '⚙️',
    date: '第十四日',
    content: '最近我发现，当我闭上眼睛时，能听到齿轮在"说话"。\n\n每一个齿轮都有自己的节奏，大齿轮沉稳，中齿轮从容，小齿轮轻快。它们组合在一起，就像一首交响乐。\n\n艾德温说，这是守钟人的天赋——能与机械共鸣的人，才能真正掌握时间的奥秘。\n\n今天我尝试跟着齿轮的呼吸来调整，果然效率提高了不少！',
    mood: 'mysterious',
    unlockConditions: [
      { type: 'total_plays', value: 10 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'fault_resist', value: 0.1, description: '故障抗性：10%几率免疫故障' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 300 },
    ],
  },
  {
    id: 'diary_004',
    order: 4,
    title: '风雨无阻',
    subtitle: '暴风雨中的坚守',
    icon: '🌧️',
    date: '第二十一日',
    content: '今晚的暴风雨格外猛烈。\n\n雷声震得钟楼都在颤抖，雨点敲打着玻璃窗，像是有无数只手在外面拍打。\n\n但钟楼的齿轮，依然在坚定地转动着。\n\n我站在钟楼顶，看着闪电划破夜空，突然明白了什么。\n\n守钟人，就是要在任何风暴中，都让时间准确前行。',
    mood: 'neutral',
    unlockConditions: [
      { type: 'no_fault_clear', value: 3 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'weather_immunity', value: true, description: '天气免疫：天气影响减半' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 400 },
      { type: 'material', id: 'steel' },
    ],
  },
  {
    id: 'diary_005',
    order: 5,
    title: '速度与精准',
    subtitle: '快刀斩乱麻',
    icon: '⚡',
    date: '第三十日',
    content: '今天我创造了新的纪录——30秒内完成校准！\n\n连艾德温都惊讶地瞪大了眼睛。\n\n"孩子，你比我年轻时还要快。"他说，"但是记住，快不是目的，准才是。"\n\n我笑着点头。我知道，速度来自熟练，精准来自专注。\n\n而我，两者都要。',
    mood: 'excited',
    unlockConditions: [
      { type: 'speed_clear', value: 45 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'time_bonus', value: 1.2, description: '时间加成：剩余时间得分+20%' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 500 },
      { type: 'badge', id: 'speed_demon' },
    ],
  },
  {
    id: 'diary_006',
    order: 6,
    title: '连胜的意志',
    subtitle: '百炼成钢',
    icon: '🏆',
    date: '第六十日',
    content: '连续十次成功校准了。\n\n我的手仿佛有了记忆，每一次转动齿轮都恰到好处。\n\n艾德温说，这就是"肌肉记忆"——当你重复足够多次，身体会比头脑更快做出反应。\n\n但我知道，支撑我坚持下来的，不是肌肉，是意志。\n\n是想要成为最好守钟人的那份执念。',
    mood: 'happy',
    unlockConditions: [
      { type: 'consecutive_wins', value: 5 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'score_multiplier', value: 1.15, description: '连胜加成：得分+15%' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 600 },
      { type: 'material', id: 'silver' },
    ],
  },
  {
    id: 'diary_007',
    order: 7,
    title: '钟楼的秘密',
    subtitle: '隐藏的房间',
    icon: '🗝️',
    date: '第九十日',
    content: '今天我在齿轮室深处发现了一扇隐藏的门。\n\n门上刻着奇怪的符号，我隐约觉得在哪里见过。\n\n哦！是小雷的日记里提到的那个符号——"守钟者的印记"。\n\n门后面是什么？是失落的宝藏？还是时光的秘密？\n\n我感觉，这座钟楼藏着的故事，远比我想象的要多得多。',
    mood: 'mysterious',
    unlockConditions: [
      { type: 'score_reached', value: 5000 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'hidden_mode', value: true, description: '隐藏模式：解锁特殊目标时间' },
      { type: 'target_time', value: '3:15', description: '神秘时刻：目标时间固定为3:15' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 800 },
      { type: 'tool', id: 'magnifier' },
    ],
  },
  {
    id: 'diary_008',
    order: 8,
    title: '传承',
    subtitle: '新的开始',
    icon: '🔔',
    date: '毕业日',
    content: '今天，艾德温把敲钟锤交到了我手中。\n\n"从今天起，你就是这座钟楼的守钟人了。"他说，眼中有泪光闪烁。\n\n我双手接过那把沉重的敲钟锤，感受到历代守钟人的重量。\n\n钟声响起，回荡在夜空中。\n\n这不是结束，这是新的开始。\n\n守钟人的故事，将由我继续书写。',
    mood: 'happy',
    unlockConditions: [
      { type: 'score_reached', value: 10000 },
      { type: 'perfect_clear', value: 10 },
    ],
    unlockAllRequired: true,
    specialCalibrations: [
      { type: 'score_multiplier', value: 1.5, description: '大师加成：得分+50%' },
      { type: 'tolerance', value: 2, description: '大师精准：容差+2分钟' },
    ],
    isUnlocked: false,
    isRead: false,
    rewards: [
      { type: 'score', value: 1000 },
      { type: 'badge', id: 'master_keeper' },
      { type: 'bell_preset', id: 'heritage_bells' },
    ],
  },
]


export const DIARY_LEVEL_OBJECTIVES: DiaryLevelObjective[] = [
  {
    id: 'obj_first_play',
    title: '初次校准',
    description: '完成第一次校时挑战',
    icon: '🎯',
    isCompleted: false,
    target: 1,
    reward: 100,
    diaryEntryId: 'diary_001',
  },
  {
    id: 'obj_perfect_clear',
    title: '完美校准',
    description: '完成一次零偏差校准',
    icon: '✨',
    isCompleted: false,
    target: 1,
    reward: 200,
    diaryEntryId: 'diary_002',
  },
  {
    id: 'obj_ten_plays',
    title: '熟能生巧',
    description: '累计进行10次校时',
    icon: '🔄',
    isCompleted: false,
    target: 10,
    reward: 300,
    diaryEntryId: 'diary_003',
  },
  {
    id: 'obj_no_fault_3',
    title: '风雨无阻',
    description: '无故障通关3次',
    icon: '🌧️',
    isCompleted: false,
    target: 3,
    reward: 400,
    diaryEntryId: 'diary_004',
  },
  {
    id: 'obj_speed_45',
    title: '闪电校时',
    description: '45秒内完成校准',
    icon: '⚡',
    isCompleted: false,
    target: 1,
    reward: 500,
    diaryEntryId: 'diary_005',
    specialCondition: 'speed_clear_45',
  },
  {
    id: 'obj_consecutive_5',
    title: '连胜达人',
    description: '连续成功校准5次',
    icon: '🏆',
    isCompleted: false,
    target: 5,
    reward: 600,
    diaryEntryId: 'diary_006',
  },
  {
    id: 'obj_score_5000',
    title: '钟楼探秘',
    description: '累计获得5000分',
    icon: '🗝️',
    isCompleted: false,
    target: 5000,
    reward: 800,
    diaryEntryId: 'diary_007',
    specialCondition: 'unlock_hidden_room',
  },
  {
    id: 'obj_master',
    title: '守钟大师',
    description: '累计10000分且10次完美校准',
    icon: '🔔',
    isCompleted: false,
    target: 1,
    reward: 1000,
    diaryEntryId: 'diary_008',
    specialCondition: 'master_keeper',
  },
]

export class KeeperDiarySystem {
  private state: KeeperDiaryState
  private targetInjector: DiaryTargetInjector
  private scoreCalculator: DiaryScoreCalculator
  private settlementProvider: DiarySettlementProvider

  constructor() {
    this.state = this.loadState()

    this.targetInjector = new DiaryTargetInjector(
      (id) => this.getEntry(id),
      () => this.getActiveCalibrationIds(),
    )

    this.scoreCalculator = new DiaryScoreCalculator(
      () => this.getState(),
      (updater) => updater(this.state),
      () => this.targetInjector.getEffects(),
      () => this.saveState(),
      () => this.checkUnlocks(),
    )

    this.settlementProvider = new DiarySettlementProvider(
      () => this.state.currentEntryId,
    )

    this.checkUnlocks()
  }

  private loadState(): KeeperDiaryState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<KeeperDiaryState>
        return {
          ...DEFAULT_STATE,
          ...parsed,
          stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
          flags: { ...DEFAULT_STATE.flags, ...parsed.flags },
        }
      }
    } catch (e) {
      console.warn('Failed to load keeper diary state', e)
    }
    return { ...DEFAULT_STATE, stats: { ...DEFAULT_STATE.stats }, flags: { ...DEFAULT_STATE.flags } }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save keeper diary state', e)
    }
  }

  getState(): KeeperDiaryState {
    return {
      ...this.state,
      stats: { ...this.state.stats },
      flags: { ...this.state.flags },
    }
  }

  getAllEntries(): DiaryEntry[] {
    return DIARY_ENTRIES.map((entry) => ({
      ...entry,
      isUnlocked: this.state.unlockedEntryIds.includes(entry.id),
      isRead: this.state.readEntryIds.includes(entry.id),
    })).sort((a, b) => a.order - b.order)
  }

  getEntry(id: DiaryEntryId): DiaryEntry | undefined {
    const entry = DIARY_ENTRIES.find((e) => e.id === id)
    if (!entry) return undefined
    return {
      ...entry,
      isUnlocked: this.state.unlockedEntryIds.includes(id),
      isRead: this.state.readEntryIds.includes(id),
    }
  }

  getUnlockedEntries(): DiaryEntry[] {
    return this.getAllEntries().filter((e) => e.isUnlocked)
  }

  getNewEntries(): DiaryEntry[] {
    return this.getUnlockedEntries().filter((e) => !e.isRead)
  }

  readEntry(id: DiaryEntryId): boolean {
    if (!this.state.unlockedEntryIds.includes(id)) return false
    if (!this.state.readEntryIds.includes(id)) {
      this.state.readEntryIds.push(id)
      const entry = this.getEntry(id)
      if (entry?.rewards) {
        entry.rewards.forEach((reward) => {
          if (reward.type === 'score' && reward.value) {
            this.scoreCalculator.addDiaryScore(reward.value)
          }
        })
      }
      this.saveState()
    }
    this.state.currentEntryId = id
    return true
  }

  setActiveCalibration(id: DiaryEntryId, active: boolean): boolean {
    if (!this.state.unlockedEntryIds.includes(id)) return false

    if (active) {
      if (!this.state.activeCalibrationIds.includes(id)) {
        this.state.activeCalibrationIds.push(id)
      }
    } else {
      const idx = this.state.activeCalibrationIds.indexOf(id)
      if (idx >= 0) {
        this.state.activeCalibrationIds.splice(idx, 1)
      }
    }
    this.saveState()
    return true
  }

  getActiveCalibrationIds(): DiaryEntryId[] {
    return [...this.state.activeCalibrationIds]
  }

  getEffects(): KeeperDiaryEffects {
    return this.targetInjector.getEffects()
  }

  getTargetInjector(): DiaryTargetInjector {
    return this.targetInjector
  }

  private evaluateCondition(condition: DiaryUnlockCondition): boolean {
    const { type, value } = condition
    const stats = this.state.stats

    switch (type) {
      case 'score_reached':
        return workshopSystem.getTotalScoreEarned() >= (typeof value === 'number' ? value : 0)
      case 'perfect_clear':
        return stats.perfectClears >= (typeof value === 'number' ? value : 0)
      case 'consecutive_wins':
        return stats.bestConsecutiveWins >= (typeof value === 'number' ? value : 0)
      case 'speed_clear':
        return stats.fastestClearSeconds <= (typeof value === 'number' ? value : 9999)
      case 'no_fault_clear':
        return stats.noFaultClears >= (typeof value === 'number' ? value : 0)
      case 'total_plays':
        return stats.totalPlays >= (typeof value === 'number' ? value : 0)
      case 'chapter_unlocked':
      case 'ending_unlocked':
      case 'item_collected':
      case 'flag_set':
        return false
      default:
        return false
    }
  }

  checkUnlocks(): DiaryEntry[] {
    const newlyUnlocked: DiaryEntry[] = []

    DIARY_ENTRIES.forEach((entry) => {
      if (this.state.unlockedEntryIds.includes(entry.id)) return

      const conditions = entry.unlockConditions
      const allRequired = entry.unlockAllRequired ?? true

      const isUnlocked = allRequired
        ? conditions.every((c) => this.evaluateCondition(c))
        : conditions.some((c) => this.evaluateCondition(c))

      if (isUnlocked) {
        this.state.unlockedEntryIds.push(entry.id)
        this.state.lastEntryUnlockedAt = Date.now()
        newlyUnlocked.push({ ...entry, isUnlocked: true, isRead: false })
      }
    })

    if (newlyUnlocked.length > 0) {
      this.saveState()
    }

    return newlyUnlocked
  }

  recordGameResult(success: boolean, score: number, timeUsed: number, isPerfect: boolean, hadFaults: boolean): void {
    const record: GameResultRecord = { success, score, timeUsed, isPerfect, hadFaults }
    this.scoreCalculator.recordGameResult(record)
  }

  getScoreCalculator(): DiaryScoreCalculator {
    return this.scoreCalculator
  }

  getSettlementText(entryId?: DiaryEntryId | null): DiarySettlementText {
    return this.settlementProvider.getSettlementText(entryId)
  }

  getSettlementProvider(): DiarySettlementProvider {
    return this.settlementProvider
  }

  getLevelObjectives(): DiaryLevelObjective[] {
    return DIARY_LEVEL_OBJECTIVES.map((obj) => {
      let progress = 0
      const stats = this.state.stats

      switch (obj.id) {
        case 'obj_first_play':
          progress = Math.min(stats.totalPlays, 1)
          break
        case 'obj_perfect_clear':
          progress = Math.min(stats.perfectClears, 1)
          break
        case 'obj_ten_plays':
          progress = Math.min(stats.totalPlays, 10)
          break
        case 'obj_no_fault_3':
          progress = Math.min(stats.noFaultClears, 3)
          break
        case 'obj_speed_45':
          progress = stats.fastestClearSeconds <= 45 ? 1 : 0
          break
        case 'obj_consecutive_5':
          progress = Math.min(stats.bestConsecutiveWins, 5)
          break
        case 'obj_score_5000':
          progress = Math.min(workshopSystem.getTotalScoreEarned(), 5000)
          break
        case 'obj_master':
          progress = (workshopSystem.getTotalScoreEarned() >= 10000 && stats.perfectClears >= 10) ? 1 : 0
          break
      }

      return {
        ...obj,
        isCompleted: this.state.unlockedEntryIds.includes(obj.diaryEntryId || ''),
        progress,
      }
    })
  }

  getCurrentDiaryChapter(): DiaryEntry | null {
    const unlocked = this.getUnlockedEntries()
    if (unlocked.length === 0) return null
    return unlocked[unlocked.length - 1] || null
  }

  getCurrentLevelObjective(): DiaryLevelObjective | null {
    const objectives = this.getLevelObjectives()
    const inProgress = objectives.find((o) => !o.isCompleted)
    return inProgress || objectives[objectives.length - 1] || null
  }

  getTotalDiaryScore(): number {
    return this.scoreCalculator.getTotalDiaryScore()
  }

  getStats(): KeeperDiaryState['stats'] {
    return this.scoreCalculator.getStats()
  }

  setFlag(key: string, value: boolean): void {
    this.state.flags[key] = value
    this.saveState()
    this.checkUnlocks()
  }

  getFlag(key: string): boolean {
    return !!this.state.flags[key]
  }

  reset(): void {
    this.state = {
      ...DEFAULT_STATE,
      stats: { ...DEFAULT_STATE.stats },
      flags: { ...DEFAULT_STATE.flags },
    }
    this.scoreCalculator.resetStats()
    this.saveState()
  }

  exportSave(): string {
    return JSON.stringify(this.state)
  }

  importSave(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as KeeperDiaryState
      this.state = {
        ...DEFAULT_STATE,
        ...parsed,
        stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
        flags: { ...DEFAULT_STATE.flags, ...parsed.flags },
      }
      this.saveState()
      return true
    } catch (e) {
      console.warn('Failed to import keeper diary save', e)
      return false
    }
  }
}

export const keeperDiarySystem = new KeeperDiarySystem()
