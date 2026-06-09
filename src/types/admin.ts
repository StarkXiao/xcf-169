import type { EditorLevelConfig, EditorFaultEvent } from './index'

export type AdminPage =
  | 'dashboard'
  | 'levels'
  | 'events'
  | 'difficulty'
  | 'texts'
  | 'versions'

export interface AdminLevelConfig extends EditorLevelConfig {
  status: 'draft' | 'testing' | 'published'
  tags: string[]
  author: string
  versionId: string
}

export interface EventTemplate {
  id: string
  name: string
  displayName: string
  description: string
  category: 'fault' | 'weather' | 'reward' | 'story'
  events: EditorFaultEvent[]
  conditions: EventCondition[]
  weight: number
  enabled: boolean
  createdAt: number
  updatedAt: number
  author: string
  tags: string[]
}

export interface EventCondition {
  type: 'time_range' | 'score_range' | 'level_progress' | 'deviation_range' | 'gear_rotations'
  min: number
  max: number
}

export interface DifficultyPoint {
  levelProgress: number
  faultRate: number
  faultSeverity: number
  weatherIntensity: number
  targetOffset: number
  timePressure: number
  scoreMultiplier: number
}

export interface DifficultyCurve {
  id: string
  name: string
  displayName: string
  description: string
  level: 'easy' | 'normal' | 'hard' | 'expert'
  points: DifficultyPoint[]
  enabled: boolean
  createdAt: number
  updatedAt: number
  author: string
}

export type TextCategory =
  | 'ui'
  | 'level_intro'
  | 'tutorial'
  | 'story'
  | 'tooltip'
  | 'achievement'
  | 'error'

export interface TextResource {
  id: string
  key: string
  category: TextCategory
  language: 'zh-CN' | 'en-US' | 'ja-JP'
  content: string
  description: string
  variables: string[]
  version: number
  enabled: boolean
  createdAt: number
  updatedAt: number
  author: string
}

export type VersionStatus = 'draft' | 'published' | 'archived' | 'rolled_back'

export interface ConfigVersion {
  id: string
  version: string
  name: string
  description: string
  status: VersionStatus
  levelIds: string[]
  eventTemplateIds: string[]
  difficultyCurveIds: string[]
  textResourceIds: string[]
  changeLog: string
  publishedAt?: number
  archivedAt?: number
  rolledBackFrom?: string
  createdAt: number
  author: string
}

export interface DashboardStats {
  totalLevels: number
  publishedLevels: number
  totalEvents: number
  totalTexts: number
  activeVersions: number
  lastPublishedAt?: number
  quickStats: {
    label: string
    value: string | number
    trend: 'up' | 'down' | 'flat'
    trendValue: string
  }[]
}
