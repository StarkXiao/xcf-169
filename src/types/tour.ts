import type { ClockTime } from './index'

export type TourHotspotCategory =
  | 'gear'
  | 'pendulum'
  | 'spring'
  | 'escapement'
  | 'display'
  | 'bell'
  | 'mechanism'
  | 'panel'
  | 'door'
  | 'corridor'
  | 'exit'
  | 'secret'
  | 'anchor'
  | 'historical'

export interface TourHotspot {
  id: string
  name: string
  displayName: string
  category: TourHotspotCategory
  icon: string
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  description: string
  historicalNote?: string
  mechanicalDetail?: string
  audioNarrationId?: string
  order: number
  isSecret?: boolean
  connectedHotspotIds?: string[]
  unlockCondition?: {
    type: 'visited' | 'all_visited' | 'flag_set'
    hotspotIds?: string[]
    flagKey?: string
  }
  rewardScore?: number
}

export interface TourMechanismPath {
  id: string
  name: string
  displayName: string
  description: string
  color: string
  glowColor: string
  points: Array<{ x: number; y: number }>
  relatedGearIds: number[]
  flowDirection?: 'clockwise' | 'counterclockwise' | 'bidirectional'
  energyTransferRate?: number
  historicalContext?: string
}

export interface TourAudioTrack {
  id: string
  title: string
  narrator: string
  durationMs: number
  textContent: string
  transcript?: string
  audioUrl?: string
  backgroundFrequencies?: number[]
  ambientType?: 'rain' | 'wind' | 'gear_hum' | 'bell_echo' | 'silent'
}

export interface TourHistoricalFact {
  id: string
  year: number | string
  era?: string
  title: string
  content: string
  source?: string
  category: 'architecture' | 'mechanics' | 'culture' | 'mystery' | 'people'
  relatedHotspotIds?: string[]
  imageGradient?: string
}

export interface TourFloorPlanLayer {
  id: string
  name: string
  floor: number
  visible: boolean
  opacity: number
}

export type TourCameraView =
  | 'overview'
  | 'gear_room'
  | 'clock_face'
  | 'bell_chamber'
  | 'free'

export interface TourAudioState {
  isPlaying: boolean
  currentTrackId: string | null
  currentTime: number
  duration: number
  volume: number
  ambientEnabled: boolean
  ambientVolume: number
}

export interface TourState {
  isActive: boolean
  isPaused: boolean
  currentHotspotId: string | null
  currentPathId: string | null
  visitedHotspotIds: string[]
  unlockedHotspotIds: string[]
  discoveredSecrets: string[]
  unlockedFactIds: string[]
  currentView: TourCameraView
  cameraZoom: number
  cameraOffset: { x: number; y: number }
  showPaths: boolean
  showHotspots: boolean
  showHistoricalLabels: boolean
  audioPlaying: boolean
  currentAudioTrackId: string | null
  audioProgress: number
  audioState: TourAudioState
  totalScoreEarned: number
  flags: Record<string, boolean>
  time: ClockTime
  unlocked: boolean
}

export interface TourCallbacks {
  onTourStart?: () => void
  onTourEnd?: () => void
  onHotspotEnter?: (hotspot: TourHotspot) => void
  onHotspotLeave?: (hotspotId: string) => void
  onHotspotVisit?: (hotspot: TourHotspot) => void
  onPathHighlight?: (path: TourMechanismPath) => void
  onAudioStart?: (track: TourAudioTrack) => void
  onAudioEnd?: (trackId: string) => void
  onScoreEarned?: (score: number, total: number) => void
  onSecretDiscovered?: (secretId: string, hotspot: TourHotspot) => void
  onViewChange?: (view: TourCameraView) => void
  onStateChange?: (state: TourState) => void
}

export interface TourProgress {
  totalHotspots: number
  visitedHotspots: number
  totalSecrets: number
  discoveredSecrets: number
  totalPaths: number
  exploredPaths: number
  completionPercentage: number
  scoreEarned: number
  audioTracksPlayed: number
  totalAudioTracks: number
}

export interface TourSaveData {
  visitedHotspotIds: string[]
  unlockedHotspotIds: string[]
  discoveredSecrets: string[]
  unlockedFactIds: string[]
  totalScoreEarned: number
  flags: Record<string, boolean>
  completedAt?: number
}
