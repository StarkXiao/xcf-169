import type { DifficultyConfig, DifficultyLevel, GearFaultType, RepairToolType } from '../types'

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    id: 'easy',
    name: 'easy',
    displayName: '简单',
    description: '适合新手，故障较少且持续时间短，完整提示与工具推荐。',
    scoreMultiplier: 0.7,
    faultFrequency: 0.4,
    faultDurationMultiplier: 0.6,
    faultSeverity: ['slip', 'jam'],
    maxActiveFaults: 1,
    repairTimeMultiplier: 0.7,
    timeLimitMultiplier: 1.3,
    hintLevel: 3,
    tutorialEnabled: true,
  },
  {
    id: 'normal',
    name: 'normal',
    displayName: '普通',
    description: '标准难度，基础提示和故障描述。',
    scoreMultiplier: 1.0,
    faultFrequency: 1.0,
    faultDurationMultiplier: 1.0,
    faultSeverity: ['slip', 'jam', 'reverse'],
    maxActiveFaults: 2,
    repairTimeMultiplier: 1.0,
    timeLimitMultiplier: 1.0,
    hintLevel: 2,
    tutorialEnabled: false,
  },
  {
    id: 'hard',
    name: 'hard',
    displayName: '困难',
    description: '故障频发，仅显示故障类型，无工具推荐。',
    scoreMultiplier: 1.5,
    faultFrequency: 1.6,
    faultDurationMultiplier: 1.4,
    faultSeverity: ['slip', 'jam', 'reverse', 'freeze'],
    maxActiveFaults: 3,
    repairTimeMultiplier: 1.3,
    timeLimitMultiplier: 0.85,
    hintLevel: 1,
    tutorialEnabled: false,
  },
  {
    id: 'expert',
    name: 'expert',
    displayName: '专家',
    description: '高强度故障，无提示，考验你的判断力。',
    scoreMultiplier: 2.2,
    faultFrequency: 2.2,
    faultDurationMultiplier: 1.8,
    faultSeverity: ['jam', 'reverse', 'freeze'],
    maxActiveFaults: 4,
    repairTimeMultiplier: 1.6,
    timeLimitMultiplier: 0.7,
    hintLevel: 0,
    tutorialEnabled: false,
  },
  {
    id: 'nightmare',
    name: 'nightmare',
    displayName: '噩梦',
    description: '极限挑战，无提示，只有真正的守钟人才能生存。',
    scoreMultiplier: 3.5,
    faultFrequency: 3.0,
    faultDurationMultiplier: 2.5,
    faultSeverity: ['jam', 'reverse', 'freeze'],
    maxActiveFaults: 5,
    repairTimeMultiplier: 2.0,
    timeLimitMultiplier: 0.55,
    hintLevel: 0,
    tutorialEnabled: false,
  },
]

export const REPAIR_TOOLS = [
  {
    id: 'wrench' as RepairToolType,
    name: 'wrench',
    displayName: '扳手',
    icon: '🔧',
    description: '基础维修工具，对卡滞故障特别有效。',
    effectiveFaults: ['jam', 'slip'] as GearFaultType[],
    repairTimeMs: 3000,
    successRate: 0.85,
    cooldownMs: 5000,
  },
  {
    id: 'oil' as RepairToolType,
    name: 'oil',
    displayName: '润滑油',
    icon: '🛢️',
    description: '润滑齿轮，解决打滑和卡滞问题。',
    effectiveFaults: ['slip', 'jam'] as GearFaultType[],
    repairTimeMs: 2000,
    successRate: 0.9,
    cooldownMs: 8000,
  },
  {
    id: 'hammer' as RepairToolType,
    name: 'hammer',
    displayName: '锤子',
    icon: '🔨',
    description: '强力敲击，有时能解决反转问题但有风险。',
    effectiveFaults: ['reverse', 'freeze'] as GearFaultType[],
    repairTimeMs: 2500,
    successRate: 0.7,
    cooldownMs: 6000,
  },
  {
    id: 'tester' as RepairToolType,
    name: 'tester',
    displayName: '检测仪',
    icon: '📡',
    description: '精密仪器，对所有故障都有效但速度较慢。',
    effectiveFaults: ['jam', 'slip', 'reverse', 'freeze'] as GearFaultType[],
    repairTimeMs: 5000,
    successRate: 0.95,
    cooldownMs: 10000,
  },
]

export class DifficultySystem {
  private currentDifficulty: DifficultyLevel = 'normal'

  setDifficulty(level: DifficultyLevel): void {
    this.currentDifficulty = level
  }

  getCurrentDifficulty(): DifficultyConfig {
    return DIFFICULTY_CONFIGS.find((d) => d.id === this.currentDifficulty) ?? DIFFICULTY_CONFIGS[1]
  }

  getDifficulty(level: DifficultyLevel): DifficultyConfig | undefined {
    return DIFFICULTY_CONFIGS.find((d) => d.id === level)
  }

  getAllDifficulties(): DifficultyConfig[] {
    return [...DIFFICULTY_CONFIGS]
  }

  getScoreMultiplier(): number {
    return this.getCurrentDifficulty().scoreMultiplier
  }

  getFaultFrequency(): number {
    return this.getCurrentDifficulty().faultFrequency
  }

  getMaxActiveFaults(): number {
    return this.getCurrentDifficulty().maxActiveFaults
  }

  isHintEnabled(): boolean {
    return this.getCurrentDifficulty().hintLevel > 0
  }

  getHintLevel(): number {
    return this.getCurrentDifficulty().hintLevel
  }

  adjustRepairTime(baseTimeMs: number): number {
    return baseTimeMs * this.getCurrentDifficulty().repairTimeMultiplier
  }

  adjustFaultDuration(baseDurationMs: number): number {
    return baseDurationMs * this.getCurrentDifficulty().faultDurationMultiplier
  }

  adjustTimeLimit(baseSeconds: number): number {
    return baseSeconds * this.getCurrentDifficulty().timeLimitMultiplier
  }

  canSpawnFault(currentActiveFaults: number): boolean {
    return currentActiveFaults < this.getCurrentDifficulty().maxActiveFaults
  }

  getRandomFaultType(): GearFaultType {
    const severity = this.getCurrentDifficulty().faultSeverity
    return severity[Math.floor(Math.random() * severity.length)]
  }
}

export const difficultySystem = new DifficultySystem()
