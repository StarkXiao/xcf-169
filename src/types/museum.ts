import type { ClockTime } from './index'

export type MuseumCharacterId =
  | 'narrator'
  | 'player'
  | 'old_keeper'
  | 'ghost_guardian'
  | 'clock_spirit'
  | 'mysterious_visitor'
  | 'young_apprentice'

export interface MuseumCharacter {
  id: MuseumCharacterId
  name: string
  displayName: string
  avatar: string
  emoji?: string
  title?: string
  color: string
  description: string
}

export type DialogSpeaker = MuseumCharacterId | 'system'

export interface DialogChoice {
  id: string
  text: string
  nextSceneId: string
  condition?: MuseumStateCondition
  effect?: MuseumStateEffect
  onEnter?: MuseumStateEffect[]
  hint?: string
  requiredItemId?: string
}

export interface DialogNode {
  id: string
  speaker: DialogSpeaker
  speakerId?: DialogSpeaker
  text: string
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'mysterious'
  choices?: DialogChoice[]
  nextSceneId?: string
  autoAdvanceMs?: number
  onEnter?: MuseumStateEffect[]
  onExit?: MuseumStateEffect[]
}

export type MuseumSceneType =
  | 'dialog'
  | 'puzzle'
  | 'exploration'
  | 'transition'
  | 'ending'

export interface MuseumSceneBackground {
  id: string
  name: string
  gradient: string
  imageUrl?: string
  description: string
  decorativeElements?: {
    icon: string
    position: { x: number; y: number }
    layer: 'back' | 'front'
    opacity: number
    scale: number
  }[]
  ambientSound?: string
}

export type PuzzleType =
  | 'clock_calibration'
  | 'gear_sequence'
  | 'bell_chord'
  | 'symbol_decipher'
  | 'time_portal'
  | 'constellation'
  | 'combined'

export interface MuseumPuzzleConfig {
  id: string
  type: PuzzleType
  name: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  targetTime?: ClockTime
  toleranceMinutes?: number
  gearSequence?: number[]
  bellNotes?: string[]
  symbolPattern?: string[]
  constellationPattern?: { x: number; y: number }[]
  hint?: string
  rewardScore?: number
  rewardItemId?: string
  timeLimitSeconds?: number
  successSceneId: string
  failSceneId?: string
}

export type ItemRarity = '普通' | '稀有' | '史诗' | '传说'

export interface MuseumItem {
  id: string
  name: string
  displayName: string
  icon: string
  description: string
  rarity?: ItemRarity
  lore?: string
  useEffectText?: string
  category: 'key' | 'tool' | 'clue' | 'artifact' | 'consumable'
  usableInPuzzleIds?: string[]
}

export interface MuseumStateEffect {
  type:
    | 'set_flag'
    | 'add_score'
    | 'add_item'
    | 'remove_item'
    | 'set_ending_path'
    | 'unlock_chapter'
    | 'add_relationship'
    | 'unlock_scene'
  key: string
  value?: number | string | boolean
}

export interface MuseumStateCondition {
  type:
    | 'flag_set'
    | 'flag_not_set'
    | 'has_item'
    | 'no_item'
    | 'score_above'
    | 'score_below'
    | 'relationship_above'
    | 'ending_path_is'
    | 'chapter_unlocked'
  key: string
  value?: number | string | boolean
}

export interface ExplorationHotspot {
  id: string
  name: string
  description: string
  x: number
  y: number
  width?: number
  height?: number
  position?: { x: number; y: number }
  icon: string
  clickedSceneId?: string
  giveItemId?: string
  effects?: MuseumStateEffect[]
  condition?: MuseumStateCondition
  oneTime?: boolean
}

export interface MuseumScene {
  id: string
  chapterId: string
  type: MuseumSceneType
  title?: string
  backgroundId: string
  ambientSound?: string
  dialogNodes?: DialogNode[]
  puzzleId?: string
  explorationHotspots?: ExplorationHotspot[]
  endingId?: string
  onEnterEffects?: MuseumStateEffect[]
  onExitEffects?: MuseumStateEffect[]
  autoNextSceneId?: string
  isLocked?: boolean
  unlockCondition?: MuseumStateCondition
  chapterProgress?: number
}

export interface MuseumChapter {
  id: string
  order: number
  title: string
  subtitle: string
  description: string
  coverGradient: string
  estimatedMinutes: number
  sceneIds: string[]
  unlockCondition?: MuseumStateCondition
  prologueSceneId: string
  isSideContent?: boolean
  tagline?: string
}

export type EndingType =
  | '真结局'
  | '好结局'
  | '普通结局'
  | '坏结局'
  | '隐藏结局'
  | '苦乐参半'
  | 'true_ending'
  | 'good_ending'
  | 'neutral_ending'
  | 'bad_ending'
  | 'secret_ending'
  | 'bittersweet_ending'

export interface MuseumEnding {
  id: string
  type: EndingType
  title: string
  subtitle: string
  epilogue: string[]
  epilogueParagraphs?: string[]
  scoreRequirement?: number
  flagRequirements?: string[]
  itemRequirements?: string[]
  relationshipRequirements?: Record<string, number>
  unlockHint: string
  isCanon?: boolean
  artGradient: string
  coverGradient?: string
}

export interface MuseumSaveState {
  currentChapterId: string
  currentSceneId: string
  currentDialogNodeIndex: number
  flags: Record<string, boolean>
  score: number
  totalScore: number
  inventory: string[]
  unlockedChapterIds: string[]
  completedChapters: string[]
  unlockedEndings: string[]
  unlockedEndingIds: string[]
  completedPuzzleIds: string[]
  visitedSceneIds: string[]
  foundHotspots: string[]
  clickedHotspotIds: string[]
  relationships: Record<string, number>
  endingPath?: string
  totalPlayTimeSeconds: number
  lastSaveTimestamp: number
}

export type MuseumGamePhase =
  | 'title_screen'
  | 'chapter_select'
  | 'scene_playing'
  | 'puzzle_playing'
  | 'ending_playing'
  | 'gallery'
  | 'ending_collection'

export interface MuseumPuzzleProgress {
  puzzleId: string
  currentTime?: ClockTime
  gearAngles?: number[]
  selectedNotes?: string[]
  selectedSymbols?: string[]
  connectedStars?: { x: number; y: number }[]
  attempts: number
  hintsUsed: number
  isCompleted: boolean
  timeElapsed: number
}

export interface MuseumRuntimeState {
  phase: MuseumGamePhase
  saveState: MuseumSaveState
  currentScene?: MuseumScene
  currentDialogIndex: number
  currentDialogNodeId?: string
  currentPuzzleId?: string
  puzzleProgress?: MuseumPuzzleProgress
  puzzleProgressMap?: Record<string, MuseumPuzzleProgress>
  displayMessage?: { text: string; type: 'info' | 'success' | 'warning' | 'item' | 'clue'; expiresAt: number }
  fadeState?: { type: 'in' | 'out'; targetSceneId?: string; progress: number }
}

export interface MuseumChapterProgress {
  chapterId: string
  scenesTotal: number
  scenesVisited: number
  puzzlesTotal: number
  puzzlesCompleted: number
  percentComplete: number
  bestScore?: number
  lastPlayedAt?: number
}

export interface MuseumGalleryEntry {
  id: string
  type: 'artwork' | 'character' | 'music' | 'lore' | 'concept'
  name: string
  description: string
  unlockCondition: MuseumStateCondition
  content?: {
    gradient?: string
    text?: string[]
    characterId?: MuseumCharacterId
  }
}

export interface MuseumAchievement {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  condition: MuseumStateCondition
  points: number
  isHidden?: boolean
}

export interface SaveSlotInfo {
  chapterTitle: string
  timestamp: string
  sceneTitle?: string
}
