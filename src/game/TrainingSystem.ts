import type {
  TrainingLesson,
  TrainingProgress,
  LessonProgress,
  TrainingGameResult,
  TrainingBadge,
  TrainingLevel,
  TrainingReviewData,
} from '../types'

export const TRAINING_BADGES: TrainingBadge[] = [
  {
    id: 'first_lesson',
    name: 'first_lesson',
    displayName: '初心守钟人',
    icon: '🌟',
    description: '完成第一堂课程，正式成为守钟人学徒。',
    condition: '完成任意一堂课程',
    unlockScore: 0,
  },
  {
    id: 'gear_master',
    name: 'gear_master',
    displayName: '齿轮匠人',
    icon: '⚙️',
    description: '精通所有齿轮基础课程。',
    condition: '完成全部齿轮基础课程',
    unlockScore: 500,
  },
  {
    id: 'time_wizard',
    name: 'time_wizard',
    displayName: '时间法师',
    icon: '⏰',
    description: '熟练掌握时间换算技巧。',
    condition: '完成全部时间换算课程',
    unlockScore: 1500,
  },
  {
    id: 'linkage_expert',
    name: 'linkage_expert',
    displayName: '联动大师',
    icon: '🔗',
    description: '完美掌握齿轮联动原理。',
    condition: '所有联动课程获得3星',
    unlockScore: 3000,
  },
  {
    id: 'night_guardian',
    name: 'night_guardian',
    displayName: '终夜守护者',
    icon: '🌙',
    description: '完成所有训练营课程，成为真正的守钟人！',
    condition: '完成全部训练营课程',
    unlockScore: 8000,
  },
]

export const TRAINING_LEVELS: TrainingLevel[] = [
  { level: 1, expRequired: 0, title: '见习学徒', perks: ['解锁基础课程'] },
  { level: 2, expRequired: 100, title: '学徒守钟人', perks: ['解锁进阶课程'] },
  { level: 3, expRequired: 300, title: '熟练守钟人', perks: ['解锁高级课程'] },
  { level: 4, expRequired: 700, title: '精英守钟人', perks: ['解锁专家课程'] },
  { level: 5, expRequired: 1500, title: '大师守钟人', perks: ['解锁全部课程', '获得专属徽章'] },
  { level: 6, expRequired: 3000, title: '钟楼传奇', perks: ['双倍经验加成'] },
]

export const TRAINING_LESSONS: TrainingLesson[] = [
  {
    id: 'lesson_01',
    type: 'gear_basics',
    difficulty: 'intro',
    order: 1,
    title: '齿轮初识',
    subtitle: '第一课：认识三种齿轮',
    description: '了解大中小三种齿轮的作用与时间增量。',
    unlockScore: 0,
    targetScore: 80,
    duration: 180,
    toleranceMinutes: 10,
    initialClockTime: { hours: 3, minutes: 0 },
    targetClockTime: { hours: 4, minutes: 0 },
    gears: [
      { id: 1, x: 400, y: 300, size: 'large', connectedTo: [2], initialAngle: 0, label: '大齿轮', description: '每次转动±60分钟', highlight: true },
      { id: 2, x: 600, y: 300, size: 'medium', connectedTo: [1], initialAngle: 0, label: '中齿轮', description: '每次转动±15分钟' },
      { id: 3, x: 500, y: 450, size: 'small', connectedTo: [], initialAngle: 0, label: '小齿轮', description: '每次转动±5分钟' },
    ],
    steps: [
      {
        id: 'step_1_1',
        order: 1,
        type: 'instruction',
        title: '欢迎来到守钟人训练营！',
        content: '在钟楼中，有三种不同大小的齿轮。大齿轮每次转动会让时钟前进或后退60分钟，中齿轮15分钟，小齿轮5分钟。',
        hint: '观察齿轮下方的标签，记住它们的时间增量。',
        isComplete: false,
      },
      {
        id: 'step_1_2',
        order: 2,
        type: 'demo',
        title: '大齿轮演示',
        content: '点击大齿轮的右半边，让时钟前进60分钟。点击左半边则后退60分钟。',
        hint: '齿轮的右半边代表顺时针（前进时间），左半边代表逆时针（后退时间）。',
        expectedActions: [{ gearId: 1, direction: 1, times: 1, description: '点击大齿轮右半边一次' }],
        isComplete: false,
      },
      {
        id: 'step_1_3',
        order: 3,
        type: 'challenge',
        title: '小试牛刀',
        content: '现在试着将时钟从3:00调整到4:00。只需要转动大齿轮一次！',
        hint: '目标时间比当前时间晚1小时，所以需要让时间前进60分钟。',
        expectedActions: [{ gearId: 1, direction: 1, times: 1 }],
        isComplete: false,
      },
      {
        id: 'step_1_4',
        order: 4,
        type: 'checkpoint',
        title: '第一课完成！',
        content: '恭喜你完成了齿轮初识课程！记住：大齿轮±60分钟，中齿轮±15分钟，小齿轮±5分钟。',
        isComplete: false,
      },
    ],
    rewards: { score: 100, exp: 50, badgeId: 'first_lesson' },
  },
  {
    id: 'lesson_02',
    type: 'gear_basics',
    difficulty: 'beginner',
    order: 2,
    title: '中齿轮练习',
    subtitle: '第二课：15分钟的精细调整',
    description: '使用中齿轮进行15分钟级别的时间调整。',
    unlockScore: 50,
    targetScore: 80,
    duration: 180,
    toleranceMinutes: 5,
    initialClockTime: { hours: 2, minutes: 0 },
    targetClockTime: { hours: 2, minutes: 45 },
    gears: [
      { id: 1, x: 400, y: 300, size: 'large', connectedTo: [2], initialAngle: 0, label: '大齿轮', description: '±60分钟' },
      { id: 2, x: 600, y: 300, size: 'medium', connectedTo: [1, 3], initialAngle: 0, label: '中齿轮', description: '±15分钟', highlight: true },
      { id: 3, x: 500, y: 450, size: 'small', connectedTo: [2], initialAngle: 0, label: '小齿轮', description: '±5分钟' },
    ],
    steps: [
      {
        id: 'step_2_1',
        order: 1,
        type: 'instruction',
        title: '中齿轮的作用',
        content: '中齿轮每次转动调整15分钟。它非常适合进行半小时、三刻钟这样的精细调整。',
        hint: '15分钟 × 3 = 45分钟，这就是我们今天需要的！',
        isComplete: false,
      },
      {
        id: 'step_2_2',
        order: 2,
        type: 'challenge',
        title: '调整到2:45',
        content: '当前时间是2:00，请将时钟调整到2:45。只使用中齿轮！',
        hint: '需要前进45分钟，中齿轮每次15分钟，需要转动几次呢？',
        expectedActions: [{ gearId: 2, direction: 1, times: 3 }],
        isComplete: false,
      },
      {
        id: 'step_2_3',
        order: 3,
        type: 'checkpoint',
        title: '课程完成！',
        content: '中齿轮是精细调整的好帮手。15分钟的增量让你能更精准地校准时间。',
        isComplete: false,
      },
    ],
    rewards: { score: 120, exp: 60 },
  },
  {
    id: 'lesson_03',
    type: 'gear_basics',
    difficulty: 'beginner',
    order: 3,
    title: '小齿轮微调',
    subtitle: '第三课：5分钟的极致精准',
    description: '用小齿轮进行5分钟级别的微调。',
    unlockScore: 100,
    targetScore: 85,
    duration: 180,
    toleranceMinutes: 0,
    initialClockTime: { hours: 5, minutes: 0 },
    targetClockTime: { hours: 5, minutes: 25 },
    gears: [
      { id: 1, x: 400, y: 300, size: 'large', connectedTo: [2], initialAngle: 0, label: '大齿轮', description: '±60分钟' },
      { id: 2, x: 600, y: 300, size: 'medium', connectedTo: [1, 3], initialAngle: 0, label: '中齿轮', description: '±15分钟' },
      { id: 3, x: 500, y: 450, size: 'small', connectedTo: [2], initialAngle: 0, label: '小齿轮', description: '±5分钟', highlight: true },
    ],
    steps: [
      {
        id: 'step_3_1',
        order: 1,
        type: 'instruction',
        title: '小齿轮的威力',
        content: '小齿轮每次只调整5分钟，但它是让时钟精确对齐的关键！',
        hint: '当其他齿轮把你带到接近目标的位置时，小齿轮负责最后那几步。',
        isComplete: false,
      },
      {
        id: 'step_3_2',
        order: 2,
        type: 'challenge',
        title: '精准到分钟',
        content: '将时钟从5:00调整到5:25。这次只使用小齿轮！',
        hint: '25 ÷ 5 = 5，需要前进5次小齿轮。',
        expectedActions: [{ gearId: 3, direction: 1, times: 5 }],
        isComplete: false,
      },
      {
        id: 'step_3_3',
        order: 3,
        type: 'checkpoint',
        title: '课程完成！',
        content: '现在你已经认识了三种齿轮。接下来学习它们如何联动！',
        isComplete: false,
      },
    ],
    rewards: { score: 150, exp: 75, unlocks: ['lesson_04'] },
  },
  {
    id: 'lesson_04',
    type: 'gear_linkage',
    difficulty: 'beginner',
    order: 4,
    title: '齿轮联动原理',
    subtitle: '第四课：连接的齿轮反向转动',
    description: '理解啮合齿轮会以相反方向转动。',
    unlockScore: 200,
    targetScore: 80,
    duration: 240,
    toleranceMinutes: 10,
    initialClockTime: { hours: 6, minutes: 0 },
    targetClockTime: { hours: 7, minutes: 0 },
    gears: [
      { id: 1, x: 350, y: 300, size: 'large', connectedTo: [2], initialAngle: 0, label: '主动轮', description: '你将操作这个齿轮', highlight: true },
      { id: 2, x: 550, y: 300, size: 'medium', connectedTo: [1, 3], initialAngle: 0, label: '从动轮', description: '与主动轮反向转动' },
      { id: 3, x: 700, y: 300, size: 'small', connectedTo: [2], initialAngle: 0, label: '第三轮', description: '再次反向' },
    ],
    steps: [
      {
        id: 'step_4_1',
        order: 1,
        type: 'instruction',
        title: '什么是联动？',
        content: '当两个齿轮啮合（咬合）时，一个齿轮顺时针转动，另一个就会逆时针转动。它们的时间增量都会生效！',
        hint: '仔细观察：你转动大齿轮前进时，中齿轮会后退，但两者的时间都会被计算。',
        isComplete: false,
      },
      {
        id: 'step_4_2',
        order: 2,
        type: 'demo',
        title: '观察联动效果',
        content: '点击大齿轮（主动轮）的右半边（前进方向），观察中齿轮和小齿轮如何反向转动。',
        hint: '大齿轮+60分钟前进，中齿轮-15分钟后退，小齿轮+5分钟前进，净变化是多少？',
        expectedActions: [{ gearId: 1, direction: 1, times: 1 }],
        isComplete: false,
      },
      {
        id: 'step_4_3',
        order: 3,
        type: 'challenge',
        title: '联动调整',
        content: '利用联动将时钟从6:00调整到7:00。注意联动带来的净时间变化！',
        hint: '大齿轮前进一次带来+60-15+5=+50分钟的净变化。后退一次则相反。',
        isComplete: false,
      },
      {
        id: 'step_4_4',
        order: 4,
        type: 'checkpoint',
        title: '联动课程完成！',
        content: '齿轮联动是守钟人最核心的技能。始终记住：啮合的齿轮反向转动！',
        isComplete: false,
      },
    ],
    rewards: { score: 180, exp: 90 },
  },
  {
    id: 'lesson_05',
    type: 'time_conversion',
    difficulty: 'intermediate',
    order: 5,
    title: '时间换算基础',
    subtitle: '第五课：小时与分钟的换算',
    description: '学习如何快速换算时间差，规划齿轮转动方案。',
    unlockScore: 350,
    targetScore: 85,
    duration: 240,
    toleranceMinutes: 5,
    initialClockTime: { hours: 1, minutes: 20 },
    targetClockTime: { hours: 3, minutes: 5 },
    gears: [
      { id: 1, x: 350, y: 300, size: 'large', connectedTo: [], initialAngle: 0, label: '大齿轮', description: '±60分钟' },
      { id: 2, x: 550, y: 300, size: 'medium', connectedTo: [], initialAngle: 0, label: '中齿轮', description: '±15分钟' },
      { id: 3, x: 700, y: 300, size: 'small', connectedTo: [], initialAngle: 0, label: '小齿轮', description: '±5分钟' },
    ],
    steps: [
      {
        id: 'step_5_1',
        order: 1,
        type: 'instruction',
        title: '时间规划法',
        content: '在转动齿轮前，先计算时间差。目标3:05 - 当前1:20 = 105分钟。方案：大齿轮×1（60）+ 中齿轮×3（45）= 105分钟。',
        hint: '先算大齿轮，再用中齿轮和小齿轮补零头。',
        isComplete: false,
      },
      {
        id: 'step_5_2',
        order: 2,
        type: 'quiz',
        title: '快速思考',
        content: '如果需要前进85分钟，最优方案是什么？（答案在提示中）',
        hint: '85 = 60 + 15 + 5 + 5，即大×1 + 中×1 + 小×2。共转动4次。',
        isComplete: false,
      },
      {
        id: 'step_5_3',
        order: 3,
        type: 'challenge',
        title: '实战演练',
        content: '按照刚才的方案，将1:20调整到3:05。齿轮之间没有联动，直接计算即可！',
        hint: '大齿轮×1前进，中齿轮×3前进。',
        expectedActions: [
          { gearId: 1, direction: 1, times: 1 },
          { gearId: 2, direction: 1, times: 3 },
        ],
        isComplete: false,
      },
      {
        id: 'step_5_4',
        order: 4,
        type: 'checkpoint',
        title: '时间换算掌握！',
        content: '优秀的守钟人总会在动手前先计算最优方案。',
        isComplete: false,
      },
    ],
    rewards: { score: 200, exp: 100, badgeId: 'time_wizard' },
  },
  {
    id: 'lesson_06',
    type: 'combined_practice',
    difficulty: 'intermediate',
    order: 6,
    title: '综合练习',
    subtitle: '第六课：联动+换算',
    description: '将齿轮联动与时间换算结合起来，完成复杂校准。',
    unlockScore: 500,
    targetScore: 90,
    duration: 300,
    toleranceMinutes: 5,
    initialClockTime: { hours: 12, minutes: 0 },
    targetClockTime: { hours: 2, minutes: 30 },
    gears: [
      { id: 1, x: 350, y: 280, size: 'large', connectedTo: [2], initialAngle: 0, label: '主动大轮', description: '±60分钟，与中轮联动', highlight: true },
      { id: 2, x: 550, y: 280, size: 'medium', connectedTo: [1, 3], initialAngle: 0, label: '中介中轮', description: '±15分钟，反向联动' },
      { id: 3, x: 700, y: 280, size: 'small', connectedTo: [2], initialAngle: 0, label: '微调小轮', description: '±5分钟，再次反向' },
      { id: 4, x: 450, y: 450, size: 'medium', connectedTo: [], initialAngle: 0, label: '独立中轮', description: '±15分钟，无联动' },
    ],
    steps: [
      {
        id: 'step_6_1',
        order: 1,
        type: 'instruction',
        title: '综合挑战',
        content: '这次有联动齿轮组和独立齿轮。时间差为150分钟（2.5小时）。你需要综合规划！',
        hint: '联动组转动大轮一次净变化+60-15+5=+50分钟。独立中轮每次+15分钟。',
        isComplete: false,
      },
      {
        id: 'step_6_2',
        order: 2,
        type: 'challenge',
        title: '终极校准',
        content: '将12:00调整到2:30。合理利用联动和独立齿轮！',
        hint: '方案：大轮×2次前进 = +100分钟，独立中轮×3次前进 = +45分钟，小轮×1次前进 = +5分钟，合计150分钟。',
        isComplete: false,
      },
      {
        id: 'step_6_3',
        order: 3,
        type: 'checkpoint',
        title: '综合课程完成！',
        content: '你已经具备独立校准钟楼的能力！接下来学习如何应对故障。',
        isComplete: false,
      },
    ],
    rewards: { score: 250, exp: 125, unlocks: ['lesson_07'] },
  },
  {
    id: 'lesson_07',
    type: 'fault_handling',
    difficulty: 'advanced',
    order: 7,
    title: '故障应对',
    subtitle: '第七课：齿轮故障与处理',
    description: '学习识别和处理齿轮卡滞、打滑、反转等故障。',
    unlockScore: 750,
    targetScore: 85,
    duration: 300,
    toleranceMinutes: 15,
    initialClockTime: { hours: 8, minutes: 0 },
    targetClockTime: { hours: 10, minutes: 0 },
    gears: [
      { id: 1, x: 350, y: 300, size: 'large', connectedTo: [2], initialAngle: 0, label: '大齿轮', description: '±60分钟' },
      { id: 2, x: 550, y: 300, size: 'medium', connectedTo: [1, 3], initialAngle: 0, label: '中齿轮', description: '±15分钟（可能故障）' },
      { id: 3, x: 700, y: 300, size: 'small', connectedTo: [2], initialAngle: 0, label: '小齿轮', description: '±5分钟' },
    ],
    steps: [
      {
        id: 'step_7_1',
        order: 1,
        type: 'instruction',
        title: '常见故障类型',
        content: '故障类型：卡滞（齿轮无法转动）、打滑（只转一半）、反转（方向相反）、冻结（完全锁死）。',
        hint: '注意观察齿轮转动时的反馈，如果不正常就说明有故障！',
        isComplete: false,
      },
      {
        id: 'step_7_2',
        order: 2,
        type: 'challenge',
        title: '故障下的校准',
        content: '中齿轮存在故障，但你仍需要将时间从8:00调整到10:00。灵活应对！',
        hint: '如果中齿轮故障，就多用大齿轮和小齿轮来组合出需要的时间。',
        isComplete: false,
      },
      {
        id: 'step_7_3',
        order: 3,
        type: 'checkpoint',
        title: '故障处理完成！',
        content: '真正的守钟人永远能在逆境中找到方法。恭喜你完成全部课程！',
        isComplete: false,
      },
    ],
    rewards: { score: 300, exp: 150, badgeId: 'night_guardian' },
  },
]

const STORAGE_KEY = 'clocktower_training_progress_v1'

const DEFAULT_PROGRESS: TrainingProgress = {
  currentLessonId: null,
  completedLessons: [],
  totalExp: 0,
  totalScore: 0,
  level: 1,
  badges: [],
  unlockedLessons: ['lesson_01', 'lesson_02'],
}

export class TrainingSystem {
  private progress: TrainingProgress

  constructor() {
    this.progress = this.loadProgress()
  }

  private loadProgress(): TrainingProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as TrainingProgress
        return { ...DEFAULT_PROGRESS, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load training progress', e)
    }
    return { ...DEFAULT_PROGRESS }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress))
    } catch (e) {
      console.warn('Failed to save training progress', e)
    }
  }

  getProgress(): TrainingProgress {
    return { ...this.progress }
  }

  getAllLessons(): TrainingLesson[] {
    return [...TRAINING_LESSONS].sort((a, b) => a.order - b.order)
  }

  getLessonById(id: string): TrainingLesson | undefined {
    return TRAINING_LESSONS.find((l) => l.id === id)
  }

  isLessonUnlocked(lessonId: string): boolean {
    return this.progress.unlockedLessons.includes(lessonId)
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.progress.completedLessons.some((lp) => lp.lessonId === lessonId)
  }

  getLessonProgress(lessonId: string): LessonProgress | undefined {
    return this.progress.completedLessons.find((lp) => lp.lessonId === lessonId)
  }

  getCurrentLevel(): TrainingLevel {
    const sorted = [...TRAINING_LEVELS].sort((a, b) => b.level - a.level)
    return sorted.find((l) => this.progress.totalExp >= l.expRequired) ?? TRAINING_LEVELS[0]
  }

  getExpToNextLevel(): number {
    const current = this.getCurrentLevel()
    const next = TRAINING_LEVELS.find((l) => l.level === current.level + 1)
    if (!next) return 0
    return next.expRequired - this.progress.totalExp
  }

  calculateStars(result: TrainingGameResult, lesson: TrainingLesson): number {
    if (!result.success) return 0
    const scoreRatio = result.score / lesson.targetScore
    if (scoreRatio >= 1.2 && result.mistakes === 0 && result.hintsUsed === 0) return 3
    if (scoreRatio >= 1.0) return 2
    if (result.success) return 1
    return 0
  }

  calculateScore(
    lesson: TrainingLesson,
    timeLeft: number,
    stepsCompleted: number,
    mistakes: number,
    hintsUsed: number,
  ): number {
    const stepScore = (stepsCompleted / lesson.steps.length) * lesson.rewards.score
    const timeBonus = Math.max(0, timeLeft) * 0.5
    const mistakePenalty = mistakes * 10
    const hintPenalty = hintsUsed * 5
    return Math.max(0, Math.round(stepScore + timeBonus - mistakePenalty - hintPenalty))
  }

  recordGameResult(result: TrainingGameResult): {
    newBadges: string[]
    newUnlocks: string[]
    leveledUp: boolean
    newLevel?: TrainingLevel
  } {
    const lesson = this.getLessonById(result.lessonId)
    if (!lesson) return { newBadges: [], newUnlocks: [], leveledUp: false }

    const prevLevel = this.getCurrentLevel().level

    const existingProgress = this.progress.completedLessons.find(
      (lp) => lp.lessonId === result.lessonId,
    )
    if (existingProgress) {
      if (result.score > existingProgress.bestScore) {
        existingProgress.bestScore = result.score
        existingProgress.bestTime = lesson.duration - result.timeLeft
      }
      if (result.stars > existingProgress.stars) {
        existingProgress.stars = result.stars
      }
      existingProgress.attempts += 1
    } else {
      this.progress.completedLessons.push({
        lessonId: result.lessonId,
        bestScore: result.score,
        bestTime: lesson.duration - result.timeLeft,
        stars: result.stars,
        completedAt: Date.now(),
        attempts: 1,
      })
    }

    this.progress.totalScore += result.score
    this.progress.totalExp += result.success ? lesson.rewards.exp : Math.floor(lesson.rewards.exp * 0.3)

    const newBadges = this.checkBadges()
    const newUnlocks = this.checkLessonUnlocks()

    this.saveProgress()

    const newLevel = this.getCurrentLevel()
    const leveledUp = newLevel.level > prevLevel

    return { newBadges, newUnlocks, leveledUp, newLevel: leveledUp ? newLevel : undefined }
  }

  private checkBadges(): string[] {
    const newBadges: string[] = []
    TRAINING_BADGES.forEach((badge) => {
      if (!this.progress.badges.includes(badge.id)) {
        let earned = false
        switch (badge.id) {
          case 'first_lesson':
            earned = this.progress.completedLessons.length >= 1
            break
          case 'gear_master':
            earned = TRAINING_LESSONS.filter((l) => l.type === 'gear_basics').every((l) =>
              this.isLessonCompleted(l.id),
            )
            break
          case 'time_wizard':
            earned = TRAINING_LESSONS.filter((l) => l.type === 'time_conversion').every((l) =>
              this.isLessonCompleted(l.id),
            )
            break
          case 'linkage_expert':
            earned = TRAINING_LESSONS.filter((l) => l.type === 'gear_linkage').every((l) => {
              const lp = this.getLessonProgress(l.id)
              return lp && lp.stars >= 3
            })
            break
          case 'night_guardian':
            earned = TRAINING_LESSONS.every((l) => this.isLessonCompleted(l.id))
            break
        }
        if (earned && this.progress.totalScore >= badge.unlockScore) {
          this.progress.badges.push(badge.id)
          newBadges.push(badge.id)
        }
      }
    })
    return newBadges
  }

  private checkLessonUnlocks(): string[] {
    const newUnlocks: string[] = []
    TRAINING_LESSONS.forEach((lesson) => {
      if (
        !this.progress.unlockedLessons.includes(lesson.id) &&
        this.progress.totalScore >= lesson.unlockScore
      ) {
        this.progress.unlockedLessons.push(lesson.id)
        newUnlocks.push(lesson.id)
      }
      if (lesson.rewards.unlocks) {
        lesson.rewards.unlocks.forEach((unlockId) => {
          if (
            this.isLessonCompleted(lesson.id) &&
            !this.progress.unlockedLessons.includes(unlockId)
          ) {
            this.progress.unlockedLessons.push(unlockId)
            newUnlocks.push(unlockId)
          }
        })
      }
    })
    return newUnlocks
  }

  generateReviewData(lesson: TrainingLesson, result: TrainingGameResult): TrainingReviewData {
    const totalActions = result.actionsRecord.length
    const correctActions = result.actionsRecord.filter((a) => a.isCorrect).length
    const accuracyRate = totalActions > 0 ? correctActions / totalActions : 0
    const timeEfficiency = result.timeLeft / lesson.duration

    const strengths: string[] = []
    const weaknesses: string[] = []
    const suggestions: string[] = []

    if (accuracyRate >= 0.8) {
      strengths.push('操作精准度高')
    } else {
      weaknesses.push('操作容易出错')
      suggestions.push('每次转动前先规划好方向，避免误操作')
    }

    if (timeEfficiency >= 0.4) {
      strengths.push('时间利用率高')
    } else {
      weaknesses.push('耗时较长')
      suggestions.push('尝试提前规划最优方案，减少不必要的转动')
    }

    if (result.hintsUsed === 0) {
      strengths.push('独立完成，未使用提示')
    } else {
      suggestions.push('尝试不使用提示独立完成，可以获得更高评分')
    }

    if (result.mistakes === 0) {
      strengths.push('零失误完美表现')
    }

    if (lesson.type === 'gear_linkage' && accuracyRate < 0.7) {
      suggestions.push('重点复习齿轮联动原理：啮合的齿轮反向转动')
    }
    if (lesson.type === 'time_conversion' && timeEfficiency < 0.3) {
      suggestions.push('时间换算需要更快：先算大齿轮，再补零头')
    }

    if (strengths.length === 0) {
      strengths.push('完成课程就是最大的进步！')
    }

    return {
      lesson,
      result,
      accuracyRate,
      timeEfficiency,
      strengths,
      weaknesses,
      suggestions,
    }
  }

  getBadgeConfig(id: string): TrainingBadge | undefined {
    return TRAINING_BADGES.find((b) => b.id === id)
  }

  getUnlockedBadges(): TrainingBadge[] {
    return TRAINING_BADGES.filter((b) => this.progress.badges.includes(b.id))
  }

  reset(): void {
    this.progress = { ...DEFAULT_PROGRESS }
    this.saveProgress()
  }
}

export const trainingSystem = new TrainingSystem()
