import type { TowerFloor, TowerFloorType, NightConfig } from '../../types/roguelike'

const FLOOR_TEMPLATES: Record<TowerFloorType, {
  name: string
  displayName: string
  description: string
  baseDifficulty: number
  baseEventCount: number
  icon: string
}> = {
  entrance: {
    name: '大门入口',
    displayName: '钟楼大门',
    description: '高耸的钟楼大门矗立眼前，铜环映着暮光。踏入此处，巡夜之旅正式开始。',
    baseDifficulty: 1,
    baseEventCount: 2,
    icon: '🚪',
  },
  gearRoom: {
    name: '齿轮房',
    displayName: '齿轮机房',
    description: '大小齿轮咬合转动，金属摩擦声回荡在狭窄的走廊中。',
    baseDifficulty: 1,
    baseEventCount: 3,
    icon: '⚙️',
  },
  clockFace: {
    name: '表盘层',
    displayName: '巨型表盘',
    description: '巨大的钟面覆盖整面墙壁，指针每走一格都震动着脚下的地板。',
    baseDifficulty: 2,
    baseEventCount: 3,
    icon: '🕐',
  },
  bellChamber: {
    name: '钟琴室',
    displayName: '钟琴大厅',
    description: '数十口铜钟悬于梁上，每当风起便发出空灵的回响。',
    baseDifficulty: 2,
    baseEventCount: 3,
    icon: '🔔',
  },
  mechanismRoom: {
    name: '机关室',
    displayName: '核心机关',
    description: '精密的发条和活塞构成了钟楼的心脏，这里最容易出故障。',
    baseDifficulty: 3,
    baseEventCount: 4,
    icon: '🔩',
  },
  observationDeck: {
    name: '瞭望台',
    displayName: '观景露台',
    description: '向外可俯瞰整座城市，向内则能观察到钟楼的整体运作。',
    baseDifficulty: 2,
    baseEventCount: 3,
    icon: '🔭',
  },
  attic: {
    name: '阁楼',
    displayName: '尘封阁楼',
    description: '积满灰尘的阁楼里藏着旧日志和遗忘的零件，也藏着意想不到的危险。',
    baseDifficulty: 3,
    baseEventCount: 3,
    icon: '📚',
  },
  topSpire: {
    name: '塔尖',
    displayName: '钟楼之巅',
    description: '钟楼的最顶端，风雨飘摇之处，据说守夜人能在这里听到时间的低语。',
    baseDifficulty: 4,
    baseEventCount: 4,
    icon: '🏰',
  },
}

const STANDARD_FLOOR_ORDER: TowerFloorType[] = [
  'entrance',
  'gearRoom',
  'clockFace',
  'bellChamber',
  'mechanismRoom',
  'observationDeck',
  'attic',
  'topSpire',
]

export class TowerMapSystem {
  private seed: number
  private nightConfig: NightConfig

  constructor(seed: number, nightConfig: NightConfig) {
    this.seed = seed
    this.nightConfig = nightConfig
  }

  private seededRandom(offset: number = 0): number {
    const x = Math.sin(this.seed + offset) * 10000
    return x - Math.floor(x)
  }

  generateMap(): TowerFloor[] {
    const floors: TowerFloor[] = []
    const floorCount = Math.min(this.nightConfig.floorCount, STANDARD_FLOOR_ORDER.length)
    const selectedTypes = STANDARD_FLOOR_ORDER.slice(0, floorCount)

    selectedTypes.forEach((type, index) => {
      const template = FLOOR_TEMPLATES[type]
      const level = index + 1
      const difficulty = Math.min(
        template.baseDifficulty + this.nightConfig.baseDifficulty - 1 + Math.floor(index / 2),
        5,
      )
      const variance = Math.floor(this.seededRandom(index * 13) * 2) - 1
      const eventCount = Math.max(2, Math.min(5, template.baseEventCount + variance + Math.floor(this.nightConfig.eventDensity)))

      const connections: string[] = []
      const currentId = `floor_${level}`
      if (index > 0) {
        connections.push(`floor_${level - 1}`)
      }
      if (index < selectedTypes.length - 1) {
        connections.push(`floor_${level + 1}`)
      }

      const isElite = this.nightConfig.eliteFloors.includes(currentId)
      const isBoss = this.nightConfig.bossFloor === currentId

      const hasTreasure = this.seededRandom(index * 7 + 3) > 0.6 || isElite

      floors.push({
        id: currentId,
        type,
        name: template.name,
        displayName: template.displayName,
        description: template.description,
        level,
        connections,
        eventCount: isBoss ? 5 : isElite ? eventCount + 1 : eventCount,
        difficulty: isBoss ? difficulty + 1 : isElite ? difficulty : difficulty,
        icon: template.icon,
        unlocked: level === 1,
        visited: false,
        cleared: false,
        hasTreasure,
      })
    })

    return floors
  }

  getFloorById(map: TowerFloor[], id: string): TowerFloor | undefined {
    return map.find((f) => f.id === id)
  }

  getCurrentFloor(map: TowerFloor[], currentId: string): TowerFloor | undefined {
    return this.getFloorById(map, currentId)
  }

  getAvailableFloors(map: TowerFloor[], currentId: string): TowerFloor[] {
    const current = this.getCurrentFloor(map, currentId)
    if (!current) return []
    return map.filter((f) => current.connections.includes(f.id) && f.unlocked)
  }

  unlockNextFloors(map: TowerFloor[], clearedId: string): TowerFloor[] {
    const cleared = this.getFloorById(map, clearedId)
    if (!cleared) return map

    return map.map((floor) => {
      if (cleared.connections.includes(floor.id)) {
        return { ...floor, unlocked: true }
      }
      if (floor.id === clearedId) {
        return { ...floor, cleared: true, visited: true }
      }
      return floor
    })
  }

  getTotalFloors(map: TowerFloor[]): number {
    return map.length
  }

  getClearedFloors(map: TowerFloor[]): number {
    return map.filter((f) => f.cleared).length
  }

  getProgress(map: TowerFloor[]): number {
    const total = this.getTotalFloors(map)
    const cleared = this.getClearedFloors(map)
    return total > 0 ? cleared / total : 0
  }

  getFloorIndex(map: TowerFloor[], id: string): number {
    return map.findIndex((f) => f.id === id)
  }

  getNextFloorId(map: TowerFloor[], currentId: string): string | null {
    const idx = this.getFloorIndex(map, currentId)
    if (idx < 0 || idx >= map.length - 1) return null
    return map[idx + 1].id
  }

  isLastFloor(map: TowerFloor[], id: string): boolean {
    return this.getFloorIndex(map, id) === map.length - 1
  }

  getDifficultyLabel(difficulty: number): string {
    const labels = ['', '简单', '普通', '困难', '极难', '噩梦']
    return labels[Math.min(Math.max(0, difficulty), 5)] || '普通'
  }

  getDifficultyColor(difficulty: number): string {
    const colors = ['', '#4ade80', '#60a5fa', '#fbbf24', '#f97316', '#ef4444']
    return colors[Math.min(Math.max(0, difficulty), 5)] || '#60a5fa'
  }
}

export function getFloorTypeLabel(type: TowerFloorType): string {
  return FLOOR_TEMPLATES[type]?.displayName || type
}

export function getFloorTypeIcon(type: TowerFloorType): string {
  return FLOOR_TEMPLATES[type]?.icon || '🏠'
}
