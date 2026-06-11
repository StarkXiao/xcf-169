import type { ClockTime, WeatherState, ActiveGearFault } from './index'

export type ShiftResourceType = 'oil' | 'coal' | 'repairKit' | 'coffee' | 'windCharge'

export interface ShiftResource {
  id: ShiftResourceType
  name: string
  displayName: string
  icon: string
  description: string
  maxStack: number
}

export interface ShiftResourceState {
  oil: number
  coal: number
  repairKit: number
  coffee: number
  windCharge: number
}

export type ShiftPhase =
  | 'nightIntro'
  | 'playing'
  | 'paused'
  | 'nightComplete'
  | 'resourceShop'
  | 'shiftOver'

export interface ShiftNightConfig {
  nightNumber: number
  displayName: string
  description: string
  baseDuration: number
  periodCount: number
  difficultyMultiplier: number
  baseResourceReward: Partial<ShiftResourceState>
  minFaultCount: number
  maxFaultCount: number
  weatherIntensity: 'calm' | 'light' | 'moderate' | 'heavy' | 'storm'
  targetTimeComplexity: 'simple' | 'normal' | 'complex'
  unlockCondition?: {
    type: 'minScore' | 'minNights' | 'perfectNight'
    value: number
  }
}

export interface ShiftNightState {
  nightNumber: number
  totalNights: number
  currentPeriodIndex: number
  totalPeriods: number
  scoreThisNight: number
  perfectPeriods: number
  faultsHandled: number
  timeBonusAccumulated: number
  isCompleted: boolean
  isPerfect: boolean
}

export interface ShiftRunState {
  runId: string
  startedAt: number
  totalNights: number
  currentNightNumber: number
  totalScore: number
  bestNightScore: number
  perfectNights: number
  resources: ShiftResourceState
  maxResources: ShiftResourceState
  currentNight: ShiftNightState
  phase: ShiftPhase
  isPaused: boolean
  pauseReason?: string
  isGameOver: boolean
  isVictory: boolean
  currentTime: ClockTime
  targetTime: ClockTime
  weather: WeatherState
  activeFaults: ActiveGearFault[]
  nightHistory: ShiftNightResult[]
  activeEffects: ActiveShiftEffect[]
}

export interface ActiveShiftEffect {
  id: string
  type: 'caffeine' | 'wellOiled' | 'overdrive' | 'protected'
  name: string
  displayName: string
  icon: string
  expiresAt: number
  effect: {
    scoreMultiplier?: number
    faultResistance?: number
    timeSpeedMultiplier?: number
    toleranceBonus?: number
  }
}

export interface ShiftNightResult {
  nightNumber: number
  success: boolean
  isPerfect: boolean
  score: number
  periodsCleared: number
  totalPeriods: number
  perfectPeriods: number
  faultsHandled: number
  timeBonus: number
  resourcesSpent: Partial<ShiftResourceState>
  resourcesEarned: Partial<ShiftResourceState>
  averageDeviation: number
  completedAt: number
  duration: number
}

export interface ShiftGameResult {
  runId: string
  success: boolean
  victory: boolean
  totalScore: number
  nightsCompleted: number
  totalNights: number
  perfectNights: number
  bestNightScore: number
  totalPeriodsCleared: number
  totalPerfectPeriods: number
  totalFaultsHandled: number
  totalTimeBonus: number
  resourcesRemaining: ShiftResourceState
  averageDeviation: number
  totalDuration: number
  completedAt: number
  nightResults: ShiftNightResult[]
}

export const SHIFT_RESOURCES: Record<ShiftResourceType, ShiftResource> = {
  oil: {
    id: 'oil',
    name: 'oil',
    displayName: '润滑油',
    icon: '🛢️',
    description: '减少齿轮摩擦，降低故障发生率',
    maxStack: 10,
  },
  coal: {
    id: 'coal',
    name: 'coal',
    displayName: '煤炭',
    icon: '🪨',
    description: '维持钟楼动力，延长可用时间',
    maxStack: 15,
  },
  repairKit: {
    id: 'repairKit',
    name: 'repairKit',
    displayName: '修理包',
    icon: '🔧',
    description: '立即修复一个活跃的齿轮故障',
    maxStack: 5,
  },
  coffee: {
    id: 'coffee',
    name: 'coffee',
    displayName: '咖啡',
    icon: '☕',
    description: '提神醒脑，短时间内提升得分倍率',
    maxStack: 8,
  },
  windCharge: {
    id: 'windCharge',
    name: 'windCharge',
    displayName: '风之充能',
    icon: '💨',
    description: '抵御恶劣天气的负面效果',
    maxStack: 6,
  },
}

export const SHIFT_NIGHT_CONFIGS: ShiftNightConfig[] = [
  {
    nightNumber: 1,
    displayName: '平静初夜',
    description: '一切都很安静，熟悉钟楼的运转节奏',
    baseDuration: 120,
    periodCount: 3,
    difficultyMultiplier: 1.0,
    baseResourceReward: { oil: 2, coal: 3, repairKit: 1 },
    minFaultCount: 0,
    maxFaultCount: 2,
    weatherIntensity: 'calm',
    targetTimeComplexity: 'simple',
  },
  {
    nightNumber: 2,
    displayName: '微风渐起',
    description: '夜风中带着些许寒意，齿轮开始发出轻响',
    baseDuration: 135,
    periodCount: 3,
    difficultyMultiplier: 1.2,
    baseResourceReward: { oil: 2, coal: 3, repairKit: 1, coffee: 1 },
    minFaultCount: 1,
    maxFaultCount: 3,
    weatherIntensity: 'light',
    targetTimeComplexity: 'simple',
  },
  {
    nightNumber: 3,
    displayName: '细雨绵绵',
    description: '潮湿的空气让齿轮运转变得滞涩',
    baseDuration: 150,
    periodCount: 4,
    difficultyMultiplier: 1.4,
    baseResourceReward: { oil: 3, coal: 4, repairKit: 2, coffee: 1, windCharge: 1 },
    minFaultCount: 2,
    maxFaultCount: 4,
    weatherIntensity: 'moderate',
    targetTimeComplexity: 'normal',
  },
  {
    nightNumber: 4,
    displayName: '狂风怒号',
    description: '钟楼在风中摇晃，每一个齿轮都在悲鸣',
    baseDuration: 165,
    periodCount: 4,
    difficultyMultiplier: 1.7,
    baseResourceReward: { oil: 3, coal: 4, repairKit: 2, coffee: 2, windCharge: 2 },
    minFaultCount: 3,
    maxFaultCount: 5,
    weatherIntensity: 'heavy',
    targetTimeComplexity: 'normal',
  },
  {
    nightNumber: 5,
    displayName: '雷暴之夜',
    description: '惊雷撕裂夜空，闪电一次又一次击中钟楼尖顶',
    baseDuration: 180,
    periodCount: 5,
    difficultyMultiplier: 2.0,
    baseResourceReward: { oil: 4, coal: 5, repairKit: 3, coffee: 2, windCharge: 3 },
    minFaultCount: 4,
    maxFaultCount: 6,
    weatherIntensity: 'storm',
    targetTimeComplexity: 'complex',
  },
  {
    nightNumber: 6,
    displayName: '永夜将至',
    description: '黎明迟迟不来，仿佛时间本身也被冻结',
    baseDuration: 200,
    periodCount: 5,
    difficultyMultiplier: 2.3,
    baseResourceReward: { oil: 5, coal: 6, repairKit: 3, coffee: 3, windCharge: 3 },
    minFaultCount: 5,
    maxFaultCount: 7,
    weatherIntensity: 'storm',
    targetTimeComplexity: 'complex',
  },
  {
    nightNumber: 7,
    displayName: '终末之钟',
    description: '最后的考验，敲响黎明前最后的钟声',
    baseDuration: 240,
    periodCount: 6,
    difficultyMultiplier: 2.8,
    baseResourceReward: { oil: 6, coal: 8, repairKit: 4, coffee: 4, windCharge: 4 },
    minFaultCount: 6,
    maxFaultCount: 9,
    weatherIntensity: 'storm',
    targetTimeComplexity: 'complex',
  },
]

export const INITIAL_RESOURCES: ShiftResourceState = {
  oil: 3,
  coal: 5,
  repairKit: 2,
  coffee: 2,
  windCharge: 1,
}

export const MAX_RESOURCES: ShiftResourceState = {
  oil: 10,
  coal: 15,
  repairKit: 5,
  coffee: 8,
  windCharge: 6,
}
