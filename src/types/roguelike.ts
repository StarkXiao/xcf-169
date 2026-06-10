import type { ClockTime, GearFaultType } from './index'

export type TowerFloorType =
  | 'entrance'
  | 'gearRoom'
  | 'clockFace'
  | 'bellChamber'
  | 'mechanismRoom'
  | 'observationDeck'
  | 'attic'
  | 'topSpire'

export interface TowerFloor {
  id: string
  type: TowerFloorType
  name: string
  displayName: string
  description: string
  level: number
  connections: string[]
  eventCount: number
  difficulty: number
  icon: string
  unlocked: boolean
  visited: boolean
  cleared: boolean
  hasTreasure: boolean
}

export type TrapType =
  | 'gearJam'
  | 'timeSlip'
  | 'reverseSpin'
  | 'frostLock'
  | 'springSnap'
  | 'pendulumSwing'
  | 'cogMisalign'
  | 'bellEcho'

export interface TrapConfig {
  id: TrapType
  name: string
  displayName: string
  description: string
  faultType: GearFaultType
  damage: number
  duration: number
  difficultyWeight: number
}

export type WeatherEventType =
  | 'timewarp'
  | 'clockPhantom'
  | 'cursedWind'
  | 'ironRain'
  | 'thunderRumble'
  | 'mirrorShard'
  | 'lostSecond'

export interface WeatherEvent {
  id: WeatherEventType
  name: string
  displayName: string
  description: string
  icon: string
  duration: number
  effect: WeatherEventEffect
  triggerChance: number
  durationMs: number
  severity: 'low' | 'medium' | 'high'
}

export interface WeatherEventEffect {
  type: 'speedMultiplier' | 'scorePenalty' | 'timeChange' | 'faultChance' | 'targetShift' | 'reverseControls'
  value: number
  target?: ClockTime
}

export type EventCategory = 'trap' | 'puzzle' | 'combat' | 'treasure' | 'rest' | 'shop' | 'elite' | 'boss'

export interface TowerEvent {
  id: string
  category: EventCategory
  name: string
  displayName: string
  description: string
  icon: string
  traps?: TrapType[]
  weatherTriggers?: WeatherEventType[]
  rewards?: RewardNodeId[]
  difficulty: number
  duration: number
  targetTimeOffset?: number
  requiredAccuracy?: number
}

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type RewardNodeId =
  | 'scoreBoost'
  | 'timeBonus'
  | 'faultResist'
  | 'trapClear'
  | 'weatherShield'
  | 'gearUpgrade'
  | 'clockMastery'
  | 'timeFreeze'
  | 'doubleEdge'
  | 'perfectAim'
  | 'windGuide'
  | 'bellBlessing'
  | 'ancientKnowledge'
  | 'temporalArmor'
  | 'chronoHeart'

export interface RewardNode {
  id: RewardNodeId
  name: string
  displayName: string
  description: string
  rarity: RewardRarity
  icon: string
  effect: RewardEffect
  requires?: RewardNodeId[]
  cost: number
  maxStacks: number
}

export interface RewardEffect {
  type:
    | 'scoreMultiplier'
    | 'timeBonus'
    | 'faultResistChance'
    | 'clearTraps'
    | 'weatherImmuneChance'
    | 'efficiency'
    | 'accuracyBonus'
    | 'tolerance'
    | 'damageReduce'
    | 'heal'
    | 'unlockFloor'
  value: number
}

export interface RewardTreeState {
  availableNodes: RewardNodeId[]
  unlockedNodes: Map<RewardNodeId, number>
  points: number
  maxPoints: number
}

export interface ActiveWeather {
  weatherId: WeatherEventType
  startAt: number
  expiresAt: number
  effectValue: number
}

export interface ActiveTrap {
  trapId: TrapType
  gearId: number
  startAt: number
  expiresAt: number
}

export interface RoguelikeRunState {
  runId: string
  seed: number
  currentFloorId: string
  currentEventIndex: number
  nightNumber: number
  totalNights: number
  health: number
  maxHealth: number
  score: number
  totalScore: number
  currentEventId: string | null
  map: TowerFloor[]
  events: TowerEvent[]
  activeTraps: ActiveTrap[]
  activeWeathers: ActiveWeather[]
  rewardTree: RewardTreeState
  floorsCleared: number
  eventsCompleted: number
  isGameOver: boolean
  isVictory: boolean
  elapsedMs: number
  createdAt: number
}

export interface RoguelikeGameResult {
  runId: string
  success: boolean
  victory: boolean
  totalScore: number
  floorsCleared: number
  eventsCompleted: number
  nightsSurvived: number
  totalNights: number
  rewardPointsEarned: number
  trapsTriggered: number
  weathersEncountered: number
  perfectEvents: number
  rarityUnlocked: RewardNodeId[]
  damageTaken: number
  healthRemaining: number
  maxHealth: number
  elapsedSeconds: number
  timestamp: number
}

export interface FloorResult {
  floorId: string
  cleared: boolean
  eventsCleared: number
  totalEvents: number
  scoreGained: number
  damageTaken: number
  healthRemaining: number
  perfectCount: number
  trapsEncountered: TrapType[]
  weathersEncountered: WeatherEventType[]
  rewardsSelected: RewardNodeId[]
}

export type RoguelikePhase =
  | 'mapView'
  | 'eventIntro'
  | 'playing'
  | 'eventResult'
  | 'rewardSelect'
  | 'floorComplete'
  | 'gameOver'
  | 'victory'

export interface NightConfig {
  nightNumber: number
  totalNights: number
  baseDifficulty: number
  weatherPool: WeatherEventType[]
  trapPool: TrapType[]
  floorCount: number
  eventDensity: number
  bossFloor: string
  eliteFloors: string[]
  rewardPointsPerNight: number
}
