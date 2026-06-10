import type {
  TrapConfig,
  TrapType,
  TowerEvent,
  EventCategory,
  NightConfig,
  TowerFloor,
  RewardNodeId,
  WeatherEventType,
} from '../../types/roguelike'

export const TRAP_CONFIGS: Record<TrapType, TrapConfig> = {
  gearJam: {
    id: 'gearJam',
    name: '齿轮卡滞',
    displayName: '齿轮卡滞',
    description: '灰尘和铁锈让齿轮无法转动，需要多次敲击才能恢复。',
    faultType: 'jam',
    damage: 10,
    duration: 15000,
    difficultyWeight: 1,
  },
  timeSlip: {
    id: 'timeSlip',
    name: '时间打滑',
    displayName: '时间打滑',
    description: '齿轮齿牙磨损，每次转动只能推进一半的时间。',
    faultType: 'slip',
    damage: 5,
    duration: 20000,
    difficultyWeight: 1,
  },
  reverseSpin: {
    id: 'reverseSpin',
    name: '反向转动',
    displayName: '反向转动',
    description: '机关被恶意改装，齿轮会向相反方向转动。',
    faultType: 'reverse',
    damage: 15,
    duration: 12000,
    difficultyWeight: 2,
  },
  frostLock: {
    id: 'frostLock',
    name: '霜冻锁死',
    displayName: '霜冻锁死',
    description: '刺骨的寒气让金属收缩，齿轮被完全冻住。',
    faultType: 'freeze',
    damage: 20,
    duration: 10000,
    difficultyWeight: 3,
  },
  springSnap: {
    id: 'springSnap',
    name: '弹簧崩断',
    displayName: '弹簧崩断',
    description: '发条弹簧突然断裂，时间剧烈跳动！',
    faultType: 'slip',
    damage: 25,
    duration: 8000,
    difficultyWeight: 2,
  },
  pendulumSwing: {
    id: 'pendulumSwing',
    name: '钟摆失控',
    displayName: '钟摆失控',
    description: '钟摆剧烈摆动，造成时间方向随机反转。',
    faultType: 'reverse',
    damage: 18,
    duration: 14000,
    difficultyWeight: 3,
  },
  cogMisalign: {
    id: 'cogMisalign',
    name: '齿牙错位',
    displayName: '齿牙错位',
    description: '齿轮安装偏移，转动时产生卡滞和打滑交替。',
    faultType: 'jam',
    damage: 12,
    duration: 16000,
    difficultyWeight: 2,
  },
  bellEcho: {
    id: 'bellEcho',
    name: '钟声回响',
    displayName: '钟声回响',
    description: '诡异的钟声回荡，让所有齿轮短暂失灵。',
    faultType: 'freeze',
    damage: 30,
    duration: 6000,
    difficultyWeight: 4,
  },
}

const EVENT_CATEGORY_INFO: Record<EventCategory, {
  name: string
  displayName: string
  icon: string
  color: string
}> = {
  trap: { name: '陷阱', displayName: '机关陷阱', icon: '🪤', color: '#ef4444' },
  puzzle: { name: '解谜', displayName: '时钟谜题', icon: '🧩', color: '#60a5fa' },
  combat: { name: '战斗', displayName: '守夜战斗', icon: '⚔️', color: '#f97316' },
  treasure: { name: '宝藏', displayName: '发现宝藏', icon: '💎', color: '#a855f7' },
  rest: { name: '休息', displayName: '休息点', icon: '🔥', color: '#4ade80' },
  shop: { name: '商店', displayName: '神秘商人', icon: '🛒', color: '#fbbf24' },
  elite: { name: '精英', displayName: '精英守卫', icon: '👑', color: '#ec4899' },
  boss: { name: 'BOSS', displayName: '钟楼之主', icon: '🐉', color: '#dc2626' },
}

const BASE_EVENTS: Omit<TowerEvent, 'id'>[] = [
  {
    category: 'trap',
    name: '生锈齿轮',
    displayName: '生锈齿轮阵',
    description: '一排积满铁锈的齿轮挡住去路，必须一一校准。',
    icon: '⚙️',
    traps: ['gearJam', 'cogMisalign'],
    difficulty: 1,
    duration: 90,
    targetTimeOffset: 180,
    requiredAccuracy: 30,
  },
  {
    category: 'trap',
    name: '滑动轴承',
    displayName: '打滑轴承',
    description: '轴承磨损严重，所有齿轮都在空转。',
    icon: '🔄',
    traps: ['timeSlip', 'springSnap'],
    difficulty: 1,
    duration: 85,
    targetTimeOffset: 200,
    requiredAccuracy: 25,
  },
  {
    category: 'puzzle',
    name: '错位表盘',
    displayName: '错位表盘之谜',
    description: '表盘上的数字被打乱，需要推理出正确的目标时间。',
    icon: '🕰️',
    traps: [],
    weatherTriggers: ['mirrorShard'],
    difficulty: 2,
    duration: 100,
    targetTimeOffset: 240,
    requiredAccuracy: 15,
  },
  {
    category: 'puzzle',
    name: '联动齿轮',
    displayName: '联动机关',
    description: '齿轮间存在隐藏的联动关系，仔细观察它们的连接。',
    icon: '🔗',
    traps: ['reverseSpin'],
    difficulty: 2,
    duration: 95,
    targetTimeOffset: 220,
    requiredAccuracy: 20,
  },
  {
    category: 'combat',
    name: '时钟幽灵',
    displayName: '时钟幽灵',
    description: '从过去的时间中浮现的幽灵，不断干扰齿轮运作。',
    icon: '👻',
    traps: ['reverseSpin', 'pendulumSwing'],
    weatherTriggers: ['clockPhantom'],
    difficulty: 3,
    duration: 110,
    targetTimeOffset: 280,
    requiredAccuracy: 20,
  },
  {
    category: 'combat',
    name: '霜冻守卫',
    displayName: '霜冻守卫',
    description: '寒气化形的守卫，会周期性冻结你的操作。',
    icon: '❄️',
    traps: ['frostLock', 'bellEcho'],
    weatherTriggers: ['ironRain'],
    difficulty: 3,
    duration: 120,
    targetTimeOffset: 300,
    requiredAccuracy: 25,
  },
  {
    category: 'treasure',
    name: '守夜人宝箱',
    displayName: '守夜人的宝藏',
    description: '前代守夜人留下的宝箱，快速校准即可获得丰厚奖励。',
    icon: '🎁',
    traps: [],
    rewards: ['scoreBoost', 'timeBonus', 'gearUpgrade'],
    difficulty: 1,
    duration: 75,
    targetTimeOffset: 120,
    requiredAccuracy: 40,
  },
  {
    category: 'treasure',
    name: '遗失的齿轮',
    displayName: '遗失的圣物',
    description: '据说能提升齿轮效率的古老零件，藏在谜题之后。',
    icon: '✨',
    traps: ['timeSlip'],
    rewards: ['faultResist', 'clockMastery', 'perfectAim'],
    difficulty: 2,
    duration: 90,
    targetTimeOffset: 180,
    requiredAccuracy: 25,
  },
  {
    category: 'rest',
    name: '守夜人营地',
    displayName: '休息营地',
    description: '一处安全的角落，可以稍作休整，恢复精力。',
    icon: '🏕️',
    traps: [],
    rewards: ['trapClear', 'weatherShield'],
    difficulty: 0,
    duration: 45,
    targetTimeOffset: 60,
    requiredAccuracy: 60,
  },
  {
    category: 'rest',
    name: '旧日志火堆',
    displayName: '温暖火堆',
    description: '翻阅前代守夜人的日志，也许能获得启发。',
    icon: '📖',
    traps: [],
    rewards: ['ancientKnowledge', 'temporalArmor'],
    difficulty: 0,
    duration: 50,
    targetTimeOffset: 90,
    requiredAccuracy: 50,
  },
  {
    category: 'shop',
    name: '时间商人',
    displayName: '神秘商人',
    description: '兜售奇特钟表零件的神秘商人，用分数换取强化。',
    icon: '🧙',
    traps: [],
    rewards: ['scoreBoost', 'gearUpgrade', 'bellBlessing'],
    difficulty: 1,
    duration: 60,
    targetTimeOffset: 100,
    requiredAccuracy: 45,
  },
  {
    category: 'elite',
    name: '三重机关阵',
    displayName: '精英·三重机关',
    description: '三种不同机关同时启动，考验你的反应和策略。',
    icon: '💀',
    traps: ['gearJam', 'reverseSpin', 'frostLock'],
    weatherTriggers: ['thunderRumble'],
    rewards: ['doubleEdge', 'chronoHeart'],
    difficulty: 4,
    duration: 140,
    targetTimeOffset: 360,
    requiredAccuracy: 15,
  },
  {
    category: 'elite',
    name: '风暴漩涡',
    displayName: '精英·时空漩涡',
    description: '时间与空间在此扭曲，天气事件频发。',
    icon: '🌀',
    traps: ['pendulumSwing', 'springSnap', 'bellEcho'],
    weatherTriggers: ['timewarp', 'cursedWind', 'lostSecond'],
    rewards: ['timeFreeze', 'windGuide'],
    difficulty: 4,
    duration: 150,
    targetTimeOffset: 400,
    requiredAccuracy: 10,
  },
  {
    category: 'boss',
    name: '钟楼之主',
    displayName: 'BOSS·钟楼守护者',
    description: '传说中守护钟楼的古老存在，拥有操控时间的力量。',
    icon: '🐲',
    traps: ['gearJam', 'timeSlip', 'reverseSpin', 'frostLock', 'pendulumSwing'],
    weatherTriggers: ['timewarp', 'clockPhantom', 'thunderRumble', 'lostSecond'],
    rewards: ['chronoHeart', 'ancientKnowledge', 'temporalArmor', 'perfectAim'],
    difficulty: 5,
    duration: 180,
    targetTimeOffset: 480,
    requiredAccuracy: 10,
  },
]

export class EventPoolSystem {
  private seed: number
  private nightConfig: NightConfig

  constructor(seed: number, nightConfig: NightConfig) {
    this.seed = seed
    this.nightConfig = nightConfig
  }

  private seededRandom(offset: number = 0): number {
    const x = Math.sin(this.seed + offset * 9301 + 49297) * 233280
    return x - Math.floor(x)
  }

  private pickWeighted<T>(items: T[], weights: number[], offset: number): T | null {
    if (items.length === 0) return null
    const total = weights.reduce((a, b) => a + b, 0)
    let r = this.seededRandom(offset) * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }

  getTrapPool(): TrapType[] {
    return this.nightConfig.trapPool
  }

  getWeatherPool(): WeatherEventType[] {
    return this.nightConfig.weatherPool
  }

  filterTrapsByDifficulty(maxDifficulty: number): TrapType[] {
    return this.getTrapPool().filter((t) => {
      const config = TRAP_CONFIGS[t]
      return config && config.difficultyWeight <= maxDifficulty
    })
  }

  generateTrapsForEvent(eventCategory: EventCategory, difficulty: number, count: number, offset: number): TrapType[] {
    const available = this.filterTrapsByDifficulty(Math.max(1, difficulty + 1))
    const result: TrapType[] = []
    const used = new Set<TrapType>()

    for (let i = 0; i < count && available.length > 0; i++) {
      const pool = available.filter((t) => !used.has(t))
      if (pool.length === 0) break
      const weights = pool.map((t) => {
        const config = TRAP_CONFIGS[t]
        const catBonus = eventCategory === 'trap' || eventCategory === 'combat' || eventCategory === 'elite' || eventCategory === 'boss' ? 2 : 1
        return Math.max(1, (5 - Math.abs(config.difficultyWeight - difficulty))) * catBonus
      })
      const picked = this.pickWeighted(pool, weights, offset + i * 17)
      if (picked) {
        result.push(picked)
        used.add(picked)
      }
    }
    return result
  }

  generateWeatherForEvent(eventCategory: EventCategory, difficulty: number, offset: number): WeatherEventType[] {
    const pool = this.getWeatherPool()
    if (pool.length === 0) return []

    const baseChance = eventCategory === 'boss' ? 1.0 : eventCategory === 'elite' ? 0.7 : eventCategory === 'combat' ? 0.5 : 0.25
    const chance = Math.min(1, baseChance + difficulty * 0.05)

    if (this.seededRandom(offset + 99) > chance) return []

    const count = eventCategory === 'boss' ? 2 : eventCategory === 'elite' ? 2 : 1
    const result: WeatherEventType[] = []
    const used = new Set<WeatherEventType>()

    for (let i = 0; i < count && pool.length > 0; i++) {
      const available = pool.filter((w) => !used.has(w))
      if (available.length === 0) break
      const weights = available.map(() => 1)
      const picked = this.pickWeighted(available, weights, offset + 33 + i * 11)
      if (picked) {
        result.push(picked)
        used.add(picked)
      }
    }
    return result
  }

  generateRewardsForEvent(eventCategory: EventCategory, _difficulty: number, offset: number): RewardNodeId[] {
    const allRewards: RewardNodeId[] = [
      'scoreBoost', 'timeBonus', 'faultResist', 'trapClear', 'weatherShield',
      'gearUpgrade', 'clockMastery', 'perfectAim', 'windGuide', 'bellBlessing',
    ]
    const rareRewards: RewardNodeId[] = [
      'timeFreeze', 'doubleEdge', 'ancientKnowledge', 'temporalArmor',
    ]
    const legendaryRewards: RewardNodeId[] = ['chronoHeart']

    const categoryRewardMap: Record<EventCategory, { count: number; rareChance: number; legendaryChance: number }> = {
      trap: { count: 1, rareChance: 0.15, legendaryChance: 0 },
      puzzle: { count: 1, rareChance: 0.25, legendaryChance: 0.05 },
      combat: { count: 2, rareChance: 0.35, legendaryChance: 0.08 },
      treasure: { count: 2, rareChance: 0.5, legendaryChance: 0.15 },
      rest: { count: 1, rareChance: 0.2, legendaryChance: 0.02 },
      shop: { count: 2, rareChance: 0.3, legendaryChance: 0.1 },
      elite: { count: 3, rareChance: 0.7, legendaryChance: 0.3 },
      boss: { count: 3, rareChance: 1.0, legendaryChance: 0.8 },
    }

    const cfg = categoryRewardMap[eventCategory] || categoryRewardMap.trap
    const result: RewardNodeId[] = []
    const used = new Set<RewardNodeId>()

    for (let i = 0; i < cfg.count; i++) {
      const r = this.seededRandom(offset + 77 + i * 23)
      let pool: RewardNodeId[]
      if (r < cfg.legendaryChance) {
        pool = legendaryRewards.filter((x) => !used.has(x))
        if (pool.length === 0) pool = rareRewards.filter((x) => !used.has(x))
      } else if (r < cfg.legendaryChance + cfg.rareChance) {
        pool = rareRewards.filter((x) => !used.has(x))
        if (pool.length === 0) pool = allRewards.filter((x) => !used.has(x))
      } else {
        pool = allRewards.filter((x) => !used.has(x))
      }
      if (pool.length === 0) pool = allRewards.filter((x) => !used.has(x))
      if (pool.length === 0) break
      const weights = pool.map(() => 1)
      const picked = this.pickWeighted(pool, weights, offset + 55 + i * 19)
      if (picked) {
        result.push(picked)
        used.add(picked)
      }
    }
    return result
  }

  selectEventCategoryForFloor(floor: TowerFloor, eventIndex: number, totalEvents: number, offset: number): EventCategory {
    const isBossFloor = floor.id === this.nightConfig.bossFloor
    const isEliteFloor = this.nightConfig.eliteFloors.includes(floor.id)
    const floorDiff = floor.difficulty

    if (isBossFloor && eventIndex === totalEvents - 1) {
      return 'boss'
    }

    const distribution: Record<EventCategory, number> = {
      trap: 25,
      puzzle: 18,
      combat: 15,
      treasure: 10,
      rest: 8,
      shop: 7,
      elite: isEliteFloor ? 12 : 3,
      boss: 0,
    }

    if (eventIndex === 0) {
      distribution.rest += 10
      distribution.treasure += 5
    }
    if (eventIndex === totalEvents - 1 && !isBossFloor) {
      distribution.combat += 10
      distribution.elite += isEliteFloor ? 15 : 5
    }
    if (floor.hasTreasure && eventIndex === Math.floor(totalEvents / 2)) {
      distribution.treasure += 20
    }

    if (floorDiff >= 3) {
      distribution.trap += 10
      distribution.combat += 10
      distribution.elite += 5
    }

    const categories = Object.keys(distribution) as EventCategory[]
    const weights = categories.map((c) => distribution[c])
    return this.pickWeighted(categories, weights, offset + eventIndex * 31) || 'trap'
  }

  generateEventsForFloor(floor: TowerFloor, floorOffset: number): TowerEvent[] {
    const events: TowerEvent[] = []
    const eventCount = floor.eventCount
    const diffMultiplier = (floor.difficulty + this.nightConfig.baseDifficulty - 1) / 2

    for (let i = 0; i < eventCount; i++) {
      const offset = floorOffset + i * 1000
      const category = this.selectEventCategoryForFloor(floor, i, eventCount, offset)

      const categoryEvents = BASE_EVENTS.filter((e) => e.category === category)
      const baseEvent = categoryEvents.length > 0
        ? categoryEvents[Math.floor(this.seededRandom(offset + 42) * categoryEvents.length)]
        : BASE_EVENTS[0]

      const trapCount = category === 'trap' ? 2 : category === 'combat' ? 2 : category === 'elite' ? 3 : category === 'boss' ? 4 : 1
      const generatedTraps = baseEvent.traps && baseEvent.traps.length > 0
        ? baseEvent.traps
        : this.generateTrapsForEvent(category, floor.difficulty, trapCount, offset)

      const generatedWeathers = baseEvent.weatherTriggers && baseEvent.weatherTriggers.length > 0
        ? baseEvent.weatherTriggers
        : this.generateWeatherForEvent(category, floor.difficulty, offset)

      const generatedRewards = baseEvent.rewards && baseEvent.rewards.length > 0
        ? baseEvent.rewards
        : this.generateRewardsForEvent(category, floor.difficulty, offset)

      const adjustedDuration = Math.round(baseEvent.duration * Math.max(0.8, 1 + diffMultiplier * 0.15))
      const adjustedOffset = Math.round((baseEvent.targetTimeOffset || 180) * Math.max(0.9, 1 + diffMultiplier * 0.2))
      const adjustedAccuracy = Math.max(5, Math.round((baseEvent.requiredAccuracy || 30) - diffMultiplier * 3))

      events.push({
        id: `${floor.id}_event_${i}`,
        category,
        name: baseEvent.name,
        displayName: baseEvent.displayName,
        description: baseEvent.description,
        icon: baseEvent.icon,
        traps: generatedTraps.length > 0 ? generatedTraps : undefined,
        weatherTriggers: generatedWeathers.length > 0 ? generatedWeathers : undefined,
        rewards: generatedRewards,
        difficulty: Math.max(1, Math.min(5, Math.round(floor.difficulty + (category === 'elite' ? 1 : category === 'boss' ? 2 : 0)))),
        duration: adjustedDuration,
        targetTimeOffset: adjustedOffset,
        requiredAccuracy: adjustedAccuracy,
      })
    }

    return events
  }

  getEventCategoryInfo(category: EventCategory) {
    return EVENT_CATEGORY_INFO[category]
  }

  getTrapConfig(trapId: TrapType): TrapConfig | undefined {
    return TRAP_CONFIGS[trapId]
  }
}

export function getEventCategoryLabel(category: EventCategory): string {
  return EVENT_CATEGORY_INFO[category]?.displayName || category
}

export function getEventCategoryIcon(category: EventCategory): string {
  return EVENT_CATEGORY_INFO[category]?.icon || '❓'
}

export function getEventCategoryColor(category: EventCategory): string {
  return EVENT_CATEGORY_INFO[category]?.color || '#60a5fa'
}
