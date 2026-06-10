import type {
  RewardNode,
  RewardNodeId,
  RewardRarity,
  RewardTreeState,
} from '../../types/roguelike'

export const REWARD_NODES: Record<RewardNodeId, RewardNode> = {
  scoreBoost: {
    id: 'scoreBoost',
    name: '分数加成',
    displayName: '守夜人的专注',
    description: '所有得分提高15%。',
    rarity: 'common',
    icon: '📈',
    effect: { type: 'scoreMultiplier', value: 0.15 },
    cost: 1,
    maxStacks: 3,
  },
  timeBonus: {
    id: 'timeBonus',
    name: '时间奖励',
    displayName: '沙漏碎片',
    description: '每完成一个事件额外获得10秒时间。',
    rarity: 'common',
    icon: '⏱️',
    effect: { type: 'timeBonus', value: 10 },
    cost: 1,
    maxStacks: 3,
  },
  faultResist: {
    id: 'faultResist',
    name: '故障抗性',
    displayName: '防锈涂层',
    description: '20%几率完全免疫齿轮故障。',
    rarity: 'common',
    icon: '🛡️',
    effect: { type: 'faultResistChance', value: 0.2 },
    cost: 1,
    maxStacks: 3,
  },
  trapClear: {
    id: 'trapClear',
    name: '清除陷阱',
    displayName: '谨慎之心',
    description: '事件开始时有30%几率清除所有陷阱。',
    rarity: 'uncommon',
    icon: '🧹',
    effect: { type: 'clearTraps', value: 0.3 },
    cost: 2,
    maxStacks: 2,
    requires: ['faultResist'],
  },
  weatherShield: {
    id: 'weatherShield',
    name: '天气护盾',
    displayName: '晴雨斗篷',
    description: '25%几率完全免疫天气事件效果。',
    rarity: 'uncommon',
    icon: '☂️',
    effect: { type: 'weatherImmuneChance', value: 0.25 },
    cost: 2,
    maxStacks: 2,
  },
  gearUpgrade: {
    id: 'gearUpgrade',
    name: '齿轮升级',
    displayName: '精钢齿轮',
    description: '齿轮操作效率提升20%（每次操作时间增量更大）。',
    rarity: 'uncommon',
    icon: '⚙️',
    effect: { type: 'efficiency', value: 0.2 },
    cost: 2,
    maxStacks: 3,
  },
  clockMastery: {
    id: 'clockMastery',
    name: '时钟精通',
    displayName: '时间大师',
    description: '容差范围扩大5分钟（更容易达到完美）。',
    rarity: 'uncommon',
    icon: '🎯',
    effect: { type: 'tolerance', value: 5 },
    cost: 2,
    maxStacks: 2,
    requires: ['gearUpgrade'],
  },
  perfectAim: {
    id: 'perfectAim',
    name: '完美瞄准',
    displayName: '校准之眼',
    description: '完美校准（时间完全一致）额外获得300分。',
    rarity: 'rare',
    icon: '✨',
    effect: { type: 'accuracyBonus', value: 300 },
    cost: 3,
    maxStacks: 2,
    requires: ['clockMastery'],
  },
  timeFreeze: {
    id: 'timeFreeze',
    name: '时间冻结',
    displayName: '永恒时刻',
    description: '每个事件开始时暂停倒计时5秒。',
    rarity: 'rare',
    icon: '❄️',
    effect: { type: 'timeBonus', value: 5 },
    cost: 3,
    maxStacks: 2,
  },
  doubleEdge: {
    id: 'doubleEdge',
    name: '双刃之力',
    displayName: '孤注一掷',
    description: '得分+35%，但受到的伤害也+25%。高风险高回报。',
    rarity: 'rare',
    icon: '⚔️',
    effect: { type: 'scoreMultiplier', value: 0.35 },
    cost: 3,
    maxStacks: 1,
  },
  windGuide: {
    id: 'windGuide',
    name: '风之指引',
    displayName: '顺风而行',
    description: '负面天气事件持续时间减少40%。',
    rarity: 'rare',
    icon: '🍃',
    effect: { type: 'damageReduce', value: 0.4 },
    cost: 3,
    maxStacks: 2,
    requires: ['weatherShield'],
  },
  bellBlessing: {
    id: 'bellBlessing',
    name: '钟声祝福',
    displayName: '钟灵护佑',
    description: '完成事件时恢复2点生命。',
    rarity: 'rare',
    icon: '🔔',
    effect: { type: 'heal', value: 2 },
    cost: 3,
    maxStacks: 3,
  },
  ancientKnowledge: {
    id: 'ancientKnowledge',
    name: '古老知识',
    displayName: '前代传承',
    description: '立即解锁所有楼层的入口。',
    rarity: 'legendary',
    icon: '📜',
    effect: { type: 'unlockFloor', value: 1 },
    cost: 4,
    maxStacks: 1,
  },
  temporalArmor: {
    id: 'temporalArmor',
    name: '时空护甲',
    displayName: '时之铠甲',
    description: '所有受到的伤害减少35%。',
    rarity: 'legendary',
    icon: '🛡️',
    effect: { type: 'damageReduce', value: 0.35 },
    cost: 4,
    maxStacks: 1,
    requires: ['faultResist', 'weatherShield'],
  },
  chronoHeart: {
    id: 'chronoHeart',
    name: '时空之心',
    displayName: '钟楼之核',
    description: '所有加成效果+50%（分数、效率、抗性等）。',
    rarity: 'legendary',
    icon: '💎',
    effect: { type: 'scoreMultiplier', value: 0.5 },
    cost: 5,
    maxStacks: 1,
    requires: ['perfectAim', 'temporalArmor'],
  },
}

const RARITY_COLORS: Record<RewardRarity, string> = {
  common: '#94a3b8',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  legendary: '#fbbf24',
}

const RARITY_BG: Record<RewardRarity, string> = {
  common: 'rgba(148, 163, 184, 0.1)',
  uncommon: 'rgba(74, 222, 128, 0.1)',
  rare: 'rgba(96, 165, 250, 0.1)',
  legendary: 'rgba(251, 191, 36, 0.15)',
}

const RARITY_LABELS: Record<RewardRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  legendary: '传说',
}

export class RewardTreeSystem {
  private state: RewardTreeState = {
    availableNodes: [],
    unlockedNodes: new Map(),
    points: 0,
    maxPoints: 20,
  }

  constructor(initialPoints: number = 0) {
    this.state.points = initialPoints
    this.refreshAvailableNodes()
  }

  getState(): RewardTreeState {
    return {
      ...this.state,
      availableNodes: [...this.state.availableNodes],
      unlockedNodes: new Map(this.state.unlockedNodes),
    }
  }

  getPoints(): number {
    return this.state.points
  }

  addPoints(amount: number): void {
    this.state.points = Math.min(this.state.maxPoints, this.state.points + amount)
    this.refreshAvailableNodes()
  }

  spendPoints(amount: number): boolean {
    if (this.state.points < amount) return false
    this.state.points -= amount
    return true
  }

  getNodeConfig(id: RewardNodeId): RewardNode | undefined {
    return REWARD_NODES[id]
  }

  getAllNodes(): RewardNode[] {
    return Object.values(REWARD_NODES)
  }

  getNodeStacks(id: RewardNodeId): number {
    return this.state.unlockedNodes.get(id) ?? 0
  }

  isNodeUnlocked(id: RewardNodeId): boolean {
    return this.getNodeStacks(id) > 0
  }

  isNodeMaxed(id: RewardNodeId): boolean {
    const config = this.getNodeConfig(id)
    if (!config) return false
    return this.getNodeStacks(id) >= config.maxStacks
  }

  areRequirementsMet(id: RewardNodeId): boolean {
    const config = this.getNodeConfig(id)
    if (!config || !config.requires) return true
    return config.requires.every((req) => this.isNodeUnlocked(req))
  }

  canUnlock(id: RewardNodeId): boolean {
    const config = this.getNodeConfig(id)
    if (!config) return false
    if (this.isNodeMaxed(id)) return false
    if (!this.areRequirementsMet(id)) return false
    return this.state.points >= config.cost
  }

  unlockNode(id: RewardNodeId): boolean {
    if (!this.canUnlock(id)) return false
    const config = this.getNodeConfig(id)!
    if (!this.spendPoints(config.cost)) return false
    const current = this.getNodeStacks(id)
    this.state.unlockedNodes.set(id, current + 1)
    this.refreshAvailableNodes()
    return true
  }

  forceUnlock(id: RewardNodeId): void {
    const current = this.getNodeStacks(id)
    const config = this.getNodeConfig(id)
    if (config && current < config.maxStacks) {
      this.state.unlockedNodes.set(id, current + 1)
    }
    this.refreshAvailableNodes()
  }

  private refreshAvailableNodes(): void {
    const available: RewardNodeId[] = []
    Object.values(REWARD_NODES).forEach((node) => {
      if (this.canUnlock(node.id)) {
        available.push(node.id)
      }
    })
    this.state.availableNodes = available
  }

  getAvailableNodes(): RewardNode[] {
    return this.state.availableNodes
      .map((id) => this.getNodeConfig(id))
      .filter(Boolean) as RewardNode[]
  }

  getUnlockedNodes(): RewardNode[] {
    const result: RewardNode[] = []
    this.state.unlockedNodes.forEach((_, id) => {
      const config = this.getNodeConfig(id)
      if (config) result.push(config)
    })
    return result
  }

  getAggregatedEffects(): {
    scoreMultiplier: number
    timeBonusPerEvent: number
    faultResistChance: number
    trapClearChance: number
    weatherImmuneChance: number
    efficiencyBonus: number
    toleranceBonus: number
    perfectAccuracyBonus: number
    damageReduction: number
    healPerEvent: number
    unlockAllFloors: boolean
  } {
    const effects = {
      scoreMultiplier: 1,
      timeBonusPerEvent: 0,
      faultResistChance: 0,
      trapClearChance: 0,
      weatherImmuneChance: 0,
      efficiencyBonus: 0,
      toleranceBonus: 0,
      perfectAccuracyBonus: 0,
      damageReduction: 0,
      healPerEvent: 0,
      unlockAllFloors: false,
    }

    this.state.unlockedNodes.forEach((stacks, id) => {
      const config = this.getNodeConfig(id)
      if (!config) return
      const value = config.effect.value * stacks

      switch (config.effect.type) {
        case 'scoreMultiplier':
          effects.scoreMultiplier += value
          break
        case 'timeBonus':
          effects.timeBonusPerEvent += value
          break
        case 'faultResistChance':
          effects.faultResistChance = Math.min(0.8, effects.faultResistChance + value)
          break
        case 'clearTraps':
          effects.trapClearChance = Math.min(0.9, effects.trapClearChance + value)
          break
        case 'weatherImmuneChance':
          effects.weatherImmuneChance = Math.min(0.8, effects.weatherImmuneChance + value)
          break
        case 'efficiency':
          effects.efficiencyBonus += value
          break
        case 'tolerance':
          effects.toleranceBonus += value
          break
        case 'accuracyBonus':
          effects.perfectAccuracyBonus += value
          break
        case 'damageReduce':
          effects.damageReduction = Math.min(0.7, effects.damageReduction + value)
          break
        case 'heal':
          effects.healPerEvent += value
          break
        case 'unlockFloor':
          effects.unlockAllFloors = true
          break
      }
    })

    return effects
  }

  applyScoreMultiplier(baseScore: number): number {
    const effects = this.getAggregatedEffects()
    return Math.floor(baseScore * effects.scoreMultiplier)
  }

  applyEfficiencyBonus(baseDelta: number): number {
    const effects = this.getAggregatedEffects()
    return baseDelta * (1 + effects.efficiencyBonus)
  }

  applyDamageReduction(damage: number): number {
    const effects = this.getAggregatedEffects()
    return Math.max(1, Math.floor(damage * (1 - effects.damageReduction)))
  }

  shouldResistFault(): boolean {
    const effects = this.getAggregatedEffects()
    return Math.random() < effects.faultResistChance
  }

  shouldClearTraps(): boolean {
    const effects = this.getAggregatedEffects()
    return Math.random() < effects.trapClearChance
  }

  shouldIgnoreWeather(): boolean {
    const effects = this.getAggregatedEffects()
    return Math.random() < effects.weatherImmuneChance
  }

  getTotalHealPerEvent(): number {
    return this.getAggregatedEffects().healPerEvent
  }

  getToleranceBonus(): number {
    return this.getAggregatedEffects().toleranceBonus
  }

  getTimeBonusPerEvent(): number {
    return this.getAggregatedEffects().timeBonusPerEvent
  }

  getPerfectBonus(): number {
    return this.getAggregatedEffects().perfectAccuracyBonus
  }

  shouldUnlockAllFloors(): boolean {
    return this.getAggregatedEffects().unlockAllFloors
  }

  getUnlockedNodeIds(): RewardNodeId[] {
    return Array.from(this.state.unlockedNodes.keys())
  }

  getUnlockedRarityCounts(): Record<RewardRarity, number> {
    const counts: Record<RewardRarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0,
    }
    this.state.unlockedNodes.forEach((stacks, id) => {
      const config = this.getNodeConfig(id)
      if (config) {
        counts[config.rarity] += stacks
      }
    })
    return counts
  }

  reset(points: number = 0): void {
    this.state = {
      availableNodes: [],
      unlockedNodes: new Map(),
      points,
      maxPoints: 20,
    }
    this.refreshAvailableNodes()
  }
}

export function getRarityColor(rarity: RewardRarity): string {
  return RARITY_COLORS[rarity]
}

export function getRarityBg(rarity: RewardRarity): string {
  return RARITY_BG[rarity]
}

export function getRarityLabel(rarity: RewardRarity): string {
  return RARITY_LABELS[rarity]
}

export function formatEffectDescription(effectType: string, value: number, stacks: number = 1): string {
  const v = value * stacks
  switch (effectType) {
    case 'scoreMultiplier':
      return `得分 +${Math.floor(v * 100)}%`
    case 'timeBonus':
      return `时间 +${v}秒`
    case 'faultResistChance':
      return `故障免疫 ${Math.floor(v * 100)}%`
    case 'clearTraps':
      return `陷阱清除 ${Math.floor(v * 100)}%`
    case 'weatherImmuneChance':
      return `天气免疫 ${Math.floor(v * 100)}%`
    case 'efficiency':
      return `效率 +${Math.floor(v * 100)}%`
    case 'tolerance':
      return `容差 +${v}分钟`
    case 'accuracyBonus':
      return `完美奖励 +${v}分`
    case 'damageReduce':
      return `减伤 ${Math.floor(v * 100)}%`
    case 'heal':
      return `每事件回复 ${v}HP`
    case 'unlockFloor':
      return `解锁所有楼层`
    default:
      return `效果值 ${v}`
  }
}
