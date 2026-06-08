import type {
  BellChimePreset,
  BellChimeWorkshopState,
  BellNote,
  BellNotePitch,
  BellTriggerCondition,
  BellTriggerType,
  HarmonyLayerConfig,
  HarmonyType,
  RhythmPatternConfig,
  BellChimeRuntimeStats,
  BellChimePlaybackOptions,
} from '../types'
import { BELL_NOTE_FREQUENCIES } from '../types'

const HARMONY_INTERVALS: Record<HarmonyType, number[]> = {
  unison: [0],
  third: [0, 4],
  fifth: [0, 7],
  octave: [0, 12],
  triad: [0, 4, 7],
  seventh: [0, 4, 7, 11],
}

const PITCH_ORDER: BellNotePitch[] = [
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  'C6',
]

function shiftPitch(base: BellNotePitch, semitones: number): BellNotePitch {
  const baseIdx = PITCH_ORDER.indexOf(base)
  const newIdx = Math.max(0, Math.min(PITCH_ORDER.length - 1, baseIdx + semitones))
  return PITCH_ORDER[newIdx]
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export const DEFAULT_RHYTHM_PATTERNS: RhythmPatternConfig[] = [
  {
    id: 'rhythm_steady',
    name: 'steady',
    displayName: '沉稳节拍',
    type: 'steady',
    bpm: 60,
    beatsPerMeasure: 4,
    beats: [
      { index: 0, timeOffset: 0, accent: 'strong', rest: false },
      { index: 1, timeOffset: 1, accent: 'weak', rest: false },
      { index: 2, timeOffset: 2, accent: 'weak', rest: false },
      { index: 3, timeOffset: 3, accent: 'weak', rest: false },
    ],
    repeatCount: 1,
    swingFactor: 0,
  },
  {
    id: 'rhythm_waltz',
    name: 'waltz',
    displayName: '华尔兹',
    type: 'waltz',
    bpm: 90,
    beatsPerMeasure: 3,
    beats: [
      { index: 0, timeOffset: 0, accent: 'strong', rest: false },
      { index: 1, timeOffset: 1, accent: 'weak', rest: false },
      { index: 2, timeOffset: 2, accent: 'weak', rest: false },
    ],
    repeatCount: 2,
    swingFactor: 0.1,
  },
  {
    id: 'rhythm_marching',
    name: 'marching',
    displayName: '进行曲',
    type: 'marching',
    bpm: 110,
    beatsPerMeasure: 4,
    beats: [
      { index: 0, timeOffset: 0, accent: 'strong', rest: false },
      { index: 1, timeOffset: 0.5, accent: 'none', rest: true },
      { index: 2, timeOffset: 1, accent: 'strong', rest: false },
      { index: 3, timeOffset: 1.5, accent: 'none', rest: true },
      { index: 4, timeOffset: 2, accent: 'strong', rest: false },
      { index: 5, timeOffset: 2.5, accent: 'none', rest: true },
      { index: 6, timeOffset: 3, accent: 'strong', rest: false },
      { index: 7, timeOffset: 3.5, accent: 'weak', rest: false },
    ],
    repeatCount: 1,
    swingFactor: 0,
  },
  {
    id: 'rhythm_fanfare',
    name: 'fanfare',
    displayName: '号角齐鸣',
    type: 'fanfare',
    bpm: 100,
    beatsPerMeasure: 4,
    beats: [
      { index: 0, timeOffset: 0, accent: 'strong', rest: false },
      { index: 1, timeOffset: 0.5, accent: 'strong', rest: false },
      { index: 2, timeOffset: 1, accent: 'strong', rest: false },
      { index: 3, timeOffset: 2, accent: 'strong', rest: false },
      { index: 4, timeOffset: 2.5, accent: 'weak', rest: false },
      { index: 5, timeOffset: 3, accent: 'strong', rest: false },
    ],
    repeatCount: 1,
    swingFactor: 0,
  },
  {
    id: 'rhythm_crescendo',
    name: 'crescendo',
    displayName: '渐强',
    type: 'crescendo',
    bpm: 70,
    beatsPerMeasure: 4,
    beats: [
      { index: 0, timeOffset: 0, accent: 'none', rest: false },
      { index: 1, timeOffset: 1, accent: 'weak', rest: false },
      { index: 2, timeOffset: 2, accent: 'weak', rest: false },
      { index: 3, timeOffset: 3, accent: 'strong', rest: false },
    ],
    repeatCount: 2,
    swingFactor: 0,
  },
  {
    id: 'rhythm_arpeggio',
    name: 'arpeggio',
    displayName: '琶音',
    type: 'arpeggio',
    bpm: 120,
    beatsPerMeasure: 4,
    beats: [
      { index: 0, timeOffset: 0, accent: 'weak', rest: false },
      { index: 1, timeOffset: 0.5, accent: 'none', rest: false },
      { index: 2, timeOffset: 1, accent: 'weak', rest: false },
      { index: 3, timeOffset: 1.5, accent: 'none', rest: false },
      { index: 4, timeOffset: 2, accent: 'weak', rest: false },
      { index: 5, timeOffset: 2.5, accent: 'none', rest: false },
      { index: 6, timeOffset: 3, accent: 'strong', rest: false },
      { index: 7, timeOffset: 3.5, accent: 'strong', rest: false },
    ],
    repeatCount: 1,
    swingFactor: 0.05,
  },
]

export const DEFAULT_HARMONY_LAYERS: HarmonyLayerConfig[] = [
  {
    id: 'harmony_root',
    name: 'root',
    displayName: '根音层',
    enabled: true,
    harmonyType: 'unison',
    basePitch: 'C4',
    octaveShift: 0,
    detune: 0,
    volume: 0.6,
    attack: 0.02,
    release: 1.5,
  },
  {
    id: 'harmony_triad',
    name: 'triad',
    displayName: '三和弦层',
    enabled: true,
    harmonyType: 'triad',
    basePitch: 'C4',
    octaveShift: 0,
    detune: 3,
    volume: 0.35,
    attack: 0.03,
    release: 1.2,
  },
  {
    id: 'harmony_octave',
    name: 'octave',
    displayName: '高八度层',
    enabled: false,
    harmonyType: 'octave',
    basePitch: 'C5',
    octaveShift: 1,
    detune: -2,
    volume: 0.25,
    attack: 0.04,
    release: 2.0,
  },
  {
    id: 'harmony_seventh',
    name: 'seventh',
    displayName: '七和弦层',
    enabled: false,
    harmonyType: 'seventh',
    basePitch: 'C4',
    octaveShift: 0,
    detune: 5,
    volume: 0.2,
    attack: 0.05,
    release: 1.8,
  },
]

export const DEFAULT_TRIGGERS: BellTriggerCondition[] = [
  {
    id: 'trigger_time_aligned',
    name: 'time_aligned',
    displayName: '时刻对齐',
    type: 'time_aligned',
    enabled: true,
    repeatable: true,
    cooldownMs: 2000,
    description: '当钟表时刻对齐目标时触发钟声。',
  },
  {
    id: 'trigger_level_success',
    name: 'level_success',
    displayName: '通关成功',
    type: 'level_success',
    enabled: true,
    repeatable: false,
    cooldownMs: 0,
    description: '关卡成功完成时奏响欢庆钟声。',
  },
  {
    id: 'trigger_level_fail',
    name: 'level_fail',
    displayName: '通关失败',
    type: 'level_fail',
    enabled: false,
    repeatable: false,
    cooldownMs: 0,
    description: '关卡失败时敲响低沉钟声。',
  },
  {
    id: 'trigger_period_transition',
    name: 'period_transition',
    displayName: '时段切换',
    type: 'period_transition',
    enabled: false,
    repeatable: true,
    cooldownMs: 3000,
    description: '夜间巡逻时段切换时鸣钟报时。',
  },
  {
    id: 'trigger_tower_align',
    name: 'tower_align',
    displayName: '塔楼对齐',
    type: 'tower_align',
    enabled: true,
    repeatable: true,
    cooldownMs: 1500,
    description: '多钟塔模式下塔楼对齐时触发。',
  },
  {
    id: 'trigger_gear_snap',
    name: 'gear_snap',
    displayName: '齿轮咬合',
    type: 'gear_snap',
    enabled: false,
    repeatable: true,
    cooldownMs: 500,
    description: '每次齿轮成功咬合时轻响一声。',
  },
  {
    id: 'trigger_storm_end',
    name: 'storm_end',
    displayName: '风暴平息',
    type: 'storm_end',
    enabled: true,
    repeatable: true,
    cooldownMs: 5000,
    description: '风暴结束后响起平静钟声。',
  },
]

export const DEFAULT_BELL_PRESETS: BellChimePreset[] = [
  {
    id: 'preset_classic',
    name: 'classic',
    displayName: '经典钟鸣',
    description: '沉稳的 C 大调三和弦，节奏平缓，适合庄重场合。',
    unlockScore: 0,
    basePitches: ['C4', 'E4', 'G4'],
    rhythmPatternId: 'rhythm_steady',
    harmonyLayerIds: ['harmony_root', 'harmony_triad'],
    triggerIds: ['trigger_time_aligned', 'trigger_level_success'],
    isDefault: true,
  },
  {
    id: 'preset_festive',
    name: 'festive',
    displayName: '欢庆号角',
    description: '明快的进行曲节奏，多层和声叠加，充满喜庆氛围。',
    unlockScore: 3000,
    basePitches: ['C4', 'E4', 'G4', 'C5'],
    rhythmPatternId: 'rhythm_fanfare',
    harmonyLayerIds: ['harmony_root', 'harmony_triad', 'harmony_octave'],
    triggerIds: ['trigger_level_success', 'trigger_tower_align'],
  },
  {
    id: 'preset_elegant',
    name: 'elegant',
    displayName: '优雅华尔兹',
    description: '三拍子华尔兹节奏，柔和的琶音铺陈，典雅优美。',
    unlockScore: 8000,
    basePitches: ['G3', 'B3', 'D4', 'F4'],
    rhythmPatternId: 'rhythm_waltz',
    harmonyLayerIds: ['harmony_root', 'harmony_triad', 'harmony_seventh'],
    triggerIds: ['trigger_time_aligned', 'trigger_tower_align', 'trigger_storm_end'],
  },
  {
    id: 'preset_grandeur',
    name: 'grandeur',
    displayName: '恢弘钟声',
    description: '渐强节奏配合完整七和弦，庄严肃穆的大钟齐鸣。',
    unlockScore: 20000,
    basePitches: ['C3', 'E3', 'G3', 'B3', 'C4'],
    rhythmPatternId: 'rhythm_crescendo',
    harmonyLayerIds: ['harmony_root', 'harmony_triad', 'harmony_octave', 'harmony_seventh'],
    triggerIds: ['trigger_level_success', 'trigger_period_transition', 'trigger_storm_end'],
  },
]

const STORAGE_KEY = 'clocktower_bell_chime_v1'

const DEFAULT_STATE: BellChimeWorkshopState = {
  currentPresetId: 'preset_classic',
  unlockedPresetIds: ['preset_classic'],
  customPresets: [],
  rhythmPatterns: DEFAULT_RHYTHM_PATTERNS,
  harmonyLayers: DEFAULT_HARMONY_LAYERS,
  triggers: DEFAULT_TRIGGERS,
  totalBellScoreEarned: 0,
}

export class BellChimeSystem {
  private state: BellChimeWorkshopState
  private lastTriggerTimestamps: Map<string, number> = new Map()
  private runtimeStats: BellChimeRuntimeStats = {
    lastTriggerTime: 0,
    playCount: 0,
    totalNotesPlayed: 0,
  }

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): BellChimeWorkshopState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BellChimeWorkshopState>
        return {
          ...DEFAULT_STATE,
          ...parsed,
          rhythmPatterns: parsed.rhythmPatterns?.length ? parsed.rhythmPatterns : DEFAULT_RHYTHM_PATTERNS,
          harmonyLayers: parsed.harmonyLayers?.length ? parsed.harmonyLayers : DEFAULT_HARMONY_LAYERS,
          triggers: parsed.triggers?.length ? parsed.triggers : DEFAULT_TRIGGERS,
        }
      }
    } catch (e) {
      console.warn('Failed to load bell chime state', e)
    }
    return { ...DEFAULT_STATE }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save bell chime state', e)
    }
  }

  getState(): BellChimeWorkshopState {
    return { ...this.state }
  }

  getRuntimeStats(): BellChimeRuntimeStats {
    return { ...this.runtimeStats }
  }

  getAllPresets(): BellChimePreset[] {
    return [...DEFAULT_BELL_PRESETS, ...this.state.customPresets]
  }

  getCurrentPreset(): BellChimePreset | null {
    const all = this.getAllPresets()
    return all.find((p) => p.id === this.state.currentPresetId) ?? all[0] ?? null
  }

  setCurrentPreset(presetId: string): boolean {
    const all = this.getAllPresets()
    const preset = all.find((p) => p.id === presetId)
    if (!preset) return false
    if (!this.state.unlockedPresetIds.includes(presetId)) return false
    this.state.currentPresetId = presetId
    this.saveState()
    return true
  }

  isPresetUnlocked(presetId: string): boolean {
    return this.state.unlockedPresetIds.includes(presetId)
  }

  getNextPresetUnlock(): BellChimePreset | null {
    const locked = DEFAULT_BELL_PRESETS.filter(
      (p) => !this.state.unlockedPresetIds.includes(p.id),
    ).sort((a, b) => a.unlockScore - b.unlockScore)
    return locked[0] ?? null
  }

  recordScore(score: number): void {
    this.state.totalBellScoreEarned += score
    this.checkUnlocks()
    this.saveState()
  }

  private checkUnlocks(): void {
    const total = this.state.totalBellScoreEarned
    DEFAULT_BELL_PRESETS.forEach((p) => {
      if (total >= p.unlockScore && !this.state.unlockedPresetIds.includes(p.id)) {
        this.state.unlockedPresetIds.push(p.id)
      }
    })
  }

  getRhythmPattern(patternId: string): RhythmPatternConfig | undefined {
    return this.state.rhythmPatterns.find((p) => p.id === patternId)
  }

  getHarmonyLayers(layerIds: string[]): HarmonyLayerConfig[] {
    return this.state.harmonyLayers.filter((l) => layerIds.includes(l.id) && l.enabled)
  }

  getTriggers(triggerIds: string[]): BellTriggerCondition[] {
    return this.state.triggers.filter((t) => triggerIds.includes(t.id) && t.enabled)
  }

  updateRhythmPattern(pattern: RhythmPatternConfig): void {
    const idx = this.state.rhythmPatterns.findIndex((p) => p.id === pattern.id)
    if (idx >= 0) {
      this.state.rhythmPatterns[idx] = { ...pattern }
    } else {
      this.state.rhythmPatterns.push({ ...pattern })
    }
    this.saveState()
  }

  updateHarmonyLayer(layer: HarmonyLayerConfig): void {
    const idx = this.state.harmonyLayers.findIndex((l) => l.id === layer.id)
    if (idx >= 0) {
      this.state.harmonyLayers[idx] = { ...layer }
    } else {
      this.state.harmonyLayers.push({ ...layer })
    }
    this.saveState()
  }

  toggleHarmonyLayer(layerId: string, enabled: boolean): void {
    const layer = this.state.harmonyLayers.find((l) => l.id === layerId)
    if (layer) {
      layer.enabled = enabled
      this.saveState()
    }
  }

  updateTrigger(trigger: BellTriggerCondition): void {
    const idx = this.state.triggers.findIndex((t) => t.id === trigger.id)
    if (idx >= 0) {
      this.state.triggers[idx] = { ...trigger }
    } else {
      this.state.triggers.push({ ...trigger })
    }
    this.saveState()
  }

  toggleTrigger(triggerId: string, enabled: boolean): void {
    const trigger = this.state.triggers.find((t) => t.id === triggerId)
    if (trigger) {
      trigger.enabled = enabled
      this.saveState()
    }
  }

  shouldTrigger(triggerType: BellTriggerType, now?: number): BellTriggerCondition | null {
    const preset = this.getCurrentPreset()
    if (!preset) return null

    const activeTriggers = this.getTriggers(preset.triggerIds)
    const trigger = activeTriggers.find((t) => t.type === triggerType)
    if (!trigger) return null

    const currentTime = now ?? Date.now()
    const lastTime = this.lastTriggerTimestamps.get(trigger.id) ?? 0

    if (!trigger.repeatable && lastTime > 0) return null
    if (currentTime - lastTime < trigger.cooldownMs) return null

    return trigger
  }

  markTriggered(triggerId: string, now?: number): void {
    const currentTime = now ?? Date.now()
    this.lastTriggerTimestamps.set(triggerId, currentTime)
    this.runtimeStats.lastTriggerTime = currentTime
    this.runtimeStats.playCount++
  }

  generateNotes(
    preset: BellChimePreset,
    options: BellChimePlaybackOptions = {},
  ): BellNote[] {
    const notes: BellNote[] = []
    const pattern = this.getRhythmPattern(preset.rhythmPatternId)
    const layers = this.getHarmonyLayers(preset.harmonyLayerIds)
    if (!pattern || layers.length === 0) return notes

    const beatDuration = 60 / pattern.bpm
    const playbackRate = options.playbackRate ?? 1
    const volumeMult = options.volumeMultiplier ?? 1

    let noteIndex = 0

    for (let rep = 0; rep < pattern.repeatCount; rep++) {
      pattern.beats.forEach((beat) => {
        if (beat.rest) return

        const swingOffset = pattern.swingFactor * beatDuration * (beat.index % 2 === 1 ? 0.5 : 0)
        const baseTime = (rep * pattern.beatsPerMeasure + beat.timeOffset) * beatDuration + swingOffset
        const baseVelocity =
          beat.accent === 'strong' ? 1.0 : beat.accent === 'weak' ? 0.7 : 0.5

        if (pattern.type === 'arpeggio') {
          const pitchPool = preset.basePitches
          layers.forEach((layer, layerIdx) => {
            const intervals = HARMONY_INTERVALS[layer.harmonyType]
            intervals.forEach((interval, intIdx) => {
              const arpIdx = (noteIndex + intIdx) % pitchPool.length
              const basePitch = pitchPool[arpIdx]
              const finalPitch = shiftPitch(basePitch, interval + layer.octaveShift * 12)
              notes.push({
                id: `note_${genId()}`,
                pitch: finalPitch,
                startTime: (baseTime / playbackRate) + (intIdx * 0.05),
                duration: Math.max(0.4, beatDuration * 1.5) / playbackRate,
                velocity: baseVelocity * layer.volume * volumeMult,
                layer: layerIdx,
              })
            })
          })
        } else if (pattern.type === 'crescendo') {
          const crescFactor = Math.min(1, (rep * pattern.beatsPerMeasure + beat.index + 1) / (pattern.beatsPerMeasure * pattern.repeatCount))
          layers.forEach((layer, layerIdx) => {
            const intervals = HARMONY_INTERVALS[layer.harmonyType]
            intervals.forEach((interval) => {
              preset.basePitches.forEach((bp, bpIdx) => {
                const finalPitch = shiftPitch(bp, interval + layer.octaveShift * 12)
                notes.push({
                  id: `note_${genId()}`,
                  pitch: finalPitch,
                  startTime: baseTime / playbackRate,
                  duration: Math.max(0.5, beatDuration * 2) / playbackRate,
                  velocity: baseVelocity * layer.volume * volumeMult * (0.4 + crescFactor * 0.6) * (1 - bpIdx * 0.1),
                  layer: layerIdx,
                })
              })
            })
          })
        } else {
          layers.forEach((layer, layerIdx) => {
            const intervals = HARMONY_INTERVALS[layer.harmonyType]
            intervals.forEach((interval) => {
              preset.basePitches.forEach((bp, bpIdx) => {
                const finalPitch = shiftPitch(bp, interval + layer.octaveShift * 12)
                notes.push({
                  id: `note_${genId()}`,
                  pitch: finalPitch,
                  startTime: baseTime / playbackRate,
                  duration: Math.max(0.5, beatDuration * 2) / playbackRate,
                  velocity: baseVelocity * layer.volume * volumeMult * (1 - bpIdx * 0.05),
                  layer: layerIdx,
                })
              })
            })
          })
        }

        noteIndex++
      })
    }

    this.runtimeStats.totalNotesPlayed += notes.length
    return notes.sort((a, b) => a.startTime - b.startTime)
  }

  createCustomPreset(partial: Partial<BellChimePreset>): BellChimePreset {
    const preset: BellChimePreset = {
      id: `preset_custom_${genId()}`,
      name: partial.name ?? 'custom',
      displayName: partial.displayName ?? '自定义钟声',
      description: partial.description ?? '用户自定义钟声谱面。',
      unlockScore: 0,
      basePitches: partial.basePitches ?? ['C4', 'E4', 'G4'],
      rhythmPatternId: partial.rhythmPatternId ?? 'rhythm_steady',
      harmonyLayerIds: partial.harmonyLayerIds ?? ['harmony_root', 'harmony_triad'],
      triggerIds: partial.triggerIds ?? ['trigger_time_aligned', 'trigger_level_success'],
    }
    this.state.customPresets.push(preset)
    this.state.unlockedPresetIds.push(preset.id)
    this.saveState()
    return preset
  }

  deleteCustomPreset(presetId: string): boolean {
    const idx = this.state.customPresets.findIndex((p) => p.id === presetId)
    if (idx < 0) return false
    this.state.customPresets.splice(idx, 1)
    const unlockedIdx = this.state.unlockedPresetIds.indexOf(presetId)
    if (unlockedIdx >= 0) this.state.unlockedPresetIds.splice(unlockedIdx, 1)
    if (this.state.currentPresetId === presetId) {
      this.state.currentPresetId = 'preset_classic'
    }
    this.saveState()
    return true
  }

  resetTriggers(): void {
    this.lastTriggerTimestamps.clear()
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE }
    this.lastTriggerTimestamps.clear()
    this.runtimeStats = { lastTriggerTime: 0, playCount: 0, totalNotesPlayed: 0 }
    this.saveState()
  }
}

export { BELL_NOTE_FREQUENCIES, HARMONY_INTERVALS, PITCH_ORDER }
export const bellChimeSystem = new BellChimeSystem()
