import type {
  TourState,
  TourHotspot,
  TourMechanismPath,
  TourAudioTrack,
  TourProgress,
  TourCallbacks,
  TourCameraView,
  TourSaveData,
  TourAudioState,
  TourHistoricalFact,
} from '../../types/tour'
import {
  TOUR_HOTSPOTS,
  TOUR_MECHANISM_PATHS,
  TOUR_AUDIO_TRACKS,
  TOUR_HISTORICAL_FACTS,
  TOUR_INITIAL_AUDIO_ID,
  TOUR_ENDING_AUDIO_ID,
  TOUR_SECRET_HOTSPOT_ID,
} from './TourData'
import { soundManager } from '../SoundManager'

const STORAGE_KEY = 'tour_save_data'

class TourAudioPlayer {
  private system: TourSystem
  private timer: number | null = null
  private ambientTimer: number | null = null
  private currentTimeSec: number = 0
  private currentDurationSec: number = 0
  private playing: boolean = false
  private volumeLevel: number = 0.8
  private ambientOn: boolean = true
  private currentTrackId: string | null = null
  private startTime: number = 0
  private pauseOffset: number = 0

  constructor(system: TourSystem) {
    this.system = system
  }

  getState(): TourAudioState {
    return {
      isPlaying: this.playing,
      currentTrackId: this.currentTrackId,
      currentTime: this.currentTimeSec,
      duration: this.currentDurationSec,
      volume: this.volumeLevel,
      ambientEnabled: this.ambientOn,
      ambientVolume: this.volumeLevel * 0.3,
    }
  }

  playTrack(trackId: string): void {
    const track = this.system.getAudioTrack(trackId)
    if (!track) return

    this.stop()
    this.currentTrackId = trackId
    this.currentDurationSec = track.durationMs / 1000
    this.currentTimeSec = 0
    this.startTime = performance.now()
    this.pauseOffset = 0
    this.playing = true

    const freqs = track.backgroundFrequencies ?? [220, 330, 440]
    freqs.forEach((freq, i) => {
      soundManager.playBellNote(
        freq,
        this.currentDurationSec * 0.8,
        (0.35 - i * 0.05) * this.volumeLevel,
        {
          attack: 0.8,
          release: this.currentDurationSec * 0.2,
          waveform: 'sine',
        },
      )
    })

    this.startTimer()
    this.emitState()
  }

  private startTimer(): void {
    this.stopTimer()
    this.timer = window.setInterval(() => {
      if (!this.playing) return
      const elapsed =
        (performance.now() - this.startTime - this.pauseOffset) / 1000
      this.currentTimeSec = Math.min(this.currentDurationSec, elapsed)
      if (this.currentTimeSec >= this.currentDurationSec) {
        this.onEnd()
      }
      this.emitState()
    }, 150)
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private onEnd(): void {
    const endedId = this.currentTrackId
    this.playing = false
    this.stopTimer()
    this.emitState()
    if (endedId) {
      this.system.onAudioEndInternal(endedId)
    }
  }

  pause(): void {
    if (!this.playing) return
    this.playing = false
    this.pauseOffset += performance.now() - this.startTime
    this.stopTimer()
    this.emitState()
  }

  resume(): void {
    if (this.playing) return
    if (!this.currentTrackId) return
    this.playing = true
    this.startTime = performance.now()
    this.startTimer()
    this.emitState()
  }

  stop(): void {
    this.playing = false
    this.stopTimer()
    this.currentTrackId = null
    this.currentTimeSec = 0
    this.currentDurationSec = 0
    this.emitState()
  }

  seek(seconds: number): void {
    if (!this.currentTrackId) return
    const wasPlaying = this.playing
    this.currentTimeSec = Math.max(0, Math.min(this.currentDurationSec, seconds))
    this.pauseOffset = 0
    this.startTime = performance.now() - this.currentTimeSec * 1000
    if (wasPlaying) {
      this.startTimer()
    }
    this.emitState()
  }

  skip(seconds: number): void {
    this.seek(this.currentTimeSec + seconds)
  }

  setVolume(level: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, level))
    this.emitState()
  }

  setAmbientEnabled(enabled: boolean): void {
    this.ambientOn = enabled
    if (enabled) {
      this.startAmbient()
    } else {
      this.stopAmbient()
    }
    this.emitState()
  }

  private startAmbient(): void {
    this.stopAmbient()
    this.ambientTimer = window.setInterval(() => {
      if (!this.ambientOn) return
      soundManager.playBellNote(
        110 + Math.random() * 22,
        6,
        0.08 * this.volumeLevel,
        {
          attack: 2,
          release: 4,
          waveform: 'sine',
        },
      )
    }, 7000)
  }

  private stopAmbient(): void {
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer)
      this.ambientTimer = null
    }
  }

  private emitState(): void {
    this.system.onAudioStateInternal(this.getState())
  }

  destroy(): void {
    this.stop()
    this.stopAmbient()
  }
}

export class TourSystem {
  private state: TourState
  private callbacks: TourCallbacks
  private audioTimer: number | null = null
  private audioStartTime: number = 0
  private audioPauseOffset: number = 0
  private audioPlayer: TourAudioPlayer

  constructor(callbacks: TourCallbacks = {}) {
    this.callbacks = callbacks
    this.audioPlayer = new TourAudioPlayer(this)
    this.state = this.createInitialState()
  }

  getAudio(): TourAudioPlayer {
    return this.audioPlayer
  }

  getFacts(): TourHistoricalFact[] {
    return [...TOUR_HISTORICAL_FACTS]
  }

  onAudioStateInternal(audioState: TourAudioState): void {
    this.state.audioState = { ...audioState }
    this.emitStateChange()
  }

  onAudioEndInternal(trackId: string): void {
    this.state.flags[`played_${trackId}`] = true
    this.callbacks.onAudioEnd?.(trackId)
    this.emitStateChange()
  }

  private createInitialState(): TourState {
    const playerState = this.audioPlayer?.getState?.() ?? {
      isPlaying: false,
      currentTrackId: null,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      ambientEnabled: true,
      ambientVolume: 0.24,
    }
    return {
      isActive: false,
      isPaused: false,
      currentHotspotId: null,
      currentPathId: null,
      visitedHotspotIds: [],
      unlockedHotspotIds: TOUR_HOTSPOTS.filter((h) => !h.isSecret).map(
        (h) => h.id,
      ),
      discoveredSecrets: [],
      unlockedFactIds: [],
      currentView: 'overview',
      cameraZoom: 1,
      cameraOffset: { x: 0, y: 0 },
      showPaths: true,
      showHotspots: true,
      showHistoricalLabels: true,
      audioPlaying: false,
      currentAudioTrackId: null,
      audioProgress: 0,
      audioState: playerState,
      totalScoreEarned: 0,
      flags: {},
      time: { hours: 12, minutes: 0 },
      unlocked: false,
    }
  }

  getState(): TourState {
    return { ...this.state, audioState: { ...this.state.audioState } }
  }

  getHotspots(): TourHotspot[] {
    return [...TOUR_HOTSPOTS]
  }

  getVisibleHotspots(): TourHotspot[] {
    return TOUR_HOTSPOTS.filter((h) =>
      this.state.unlockedHotspotIds.includes(h.id),
    )
  }

  getPaths(): TourMechanismPath[] {
    return [...TOUR_MECHANISM_PATHS]
  }

  getVisiblePaths(): TourMechanismPath[] {
    const secretFound = this.state.discoveredSecrets.includes(
      TOUR_SECRET_HOTSPOT_ID,
    )
    return TOUR_MECHANISM_PATHS.filter((p) => {
      if (p.id === 'path_secret_flow') return secretFound
      return true
    })
  }

  getAudioTracks(): TourAudioTrack[] {
    return [...TOUR_AUDIO_TRACKS]
  }

  getAudioTrack(trackId: string): TourAudioTrack | undefined {
    return TOUR_AUDIO_TRACKS.find((t) => t.id === trackId)
  }

  getHotspot(hotspotId: string): TourHotspot | undefined {
    return TOUR_HOTSPOTS.find((h) => h.id === hotspotId)
  }

  getPath(pathId: string): TourMechanismPath | undefined {
    return TOUR_MECHANISM_PATHS.find((p) => p.id === pathId)
  }

  getHistoricalFacts() {
    return [...TOUR_HISTORICAL_FACTS]
  }

  getProgress(): TourProgress {
    const totalHotspots = TOUR_HOTSPOTS.filter((h) => !h.isSecret).length
    const visitedNonSecret = this.state.visitedHotspotIds.filter(
      (id) => !TOUR_HOTSPOTS.find((h) => h.id === id)?.isSecret,
    ).length
    const totalSecrets = TOUR_HOTSPOTS.filter((h) => h.isSecret).length
    const discoveredSecrets = this.state.discoveredSecrets.length
    const totalPaths = this.getVisiblePaths().length
    const exploredPaths =
      this.state.visitedHotspotIds.length > 0
        ? Math.min(
            totalPaths,
            Math.floor(this.state.visitedHotspotIds.length / 3),
          )
        : 0
    const completionPercentage = Math.floor(
      ((visitedNonSecret + discoveredSecrets * 3) /
        (totalHotspots + totalSecrets * 3)) *
        100,
    )

    return {
      totalHotspots,
      visitedHotspots: visitedNonSecret,
      totalSecrets,
      discoveredSecrets,
      totalPaths,
      exploredPaths,
      completionPercentage: Math.min(100, completionPercentage),
      scoreEarned: this.state.totalScoreEarned,
      audioTracksPlayed: this.state.flags.audio_tracks_played
        ? Object.keys(this.state.flags).filter((k) => k.startsWith('played_'))
            .length
        : 0,
      totalAudioTracks: TOUR_AUDIO_TRACKS.length,
    }
  }

  unlockTour(): void {
    if (this.state.unlocked) return
    this.state.unlocked = true
    this.emitStateChange()
  }

  startTour(): void {
    if (!this.state.unlocked) return
    this.state.isActive = true
    this.state.isPaused = false
    this.state.currentView = 'overview'
    this.state.cameraZoom = 1
    this.state.cameraOffset = { x: 0, y: 0 }

    this.callbacks.onTourStart?.()
    this.emitStateChange()

    this.audioPlayer.setAmbientEnabled(true)
    this.playAudio(TOUR_INITIAL_AUDIO_ID)
  }

  endTour(): void {
    if (!this.state.isActive) return
    this.state.isActive = false
    this.state.isPaused = false
    this.stopAudio()
    this.audioPlayer.setAmbientEnabled(false)
    this.callbacks.onTourEnd?.()
    this.emitStateChange()
    this.saveToStorage()
  }

  pauseTour(): void {
    if (!this.state.isActive) return
    this.state.isPaused = true
    if (this.state.audioPlaying) {
      this.pauseAudio()
    }
    this.emitStateChange()
  }

  resumeTour(): void {
    if (!this.state.isActive || !this.state.isPaused) return
    this.state.isPaused = false
    if (this.state.currentAudioTrackId) {
      this.resumeAudio()
    }
    this.emitStateChange()
  }

  setView(view: TourCameraView): void {
    if (!this.state.isActive) return
    this.state.currentView = view

    switch (view) {
      case 'overview':
        this.state.cameraZoom = 1
        this.state.cameraOffset = { x: 0, y: 0 }
        break
      case 'gear_room':
        this.state.cameraZoom = 1.2
        this.state.cameraOffset = { x: 0, y: 0.15 }
        break
      case 'clock_face':
        this.state.cameraZoom = 1.5
        this.state.cameraOffset = { x: 0, y: -0.1 }
        break
      case 'bell_chamber':
        this.state.cameraZoom = 1.3
        this.state.cameraOffset = { x: -0.2, y: -0.2 }
        break
      case 'free':
        break
    }

    this.callbacks.onViewChange?.(view)
    this.emitStateChange()
  }

  setCameraZoom(zoom: number): void {
    this.state.cameraZoom = Math.max(0.5, Math.min(2.5, zoom))
    this.state.currentView = 'free'
    this.emitStateChange()
  }

  setCameraOffset(offset: { x: number; y: number }): void {
    this.state.cameraOffset = { ...offset }
    this.state.currentView = 'free'
    this.emitStateChange()
  }

  enterHotspot(hotspotId: string): void {
    if (!this.state.isActive) return
    const hotspot = this.getHotspot(hotspotId)
    if (!hotspot) return
    if (!this.state.unlockedHotspotIds.includes(hotspotId)) return

    this.state.currentHotspotId = hotspotId
    this.state.currentPathId = null

    this.callbacks.onHotspotEnter?.(hotspot)
    this.emitStateChange()

    if (!this.state.visitedHotspotIds.includes(hotspotId)) {
      this.visitHotspot(hotspotId)
    }

    if (hotspot.category === 'exit') {
      this.playAudio(TOUR_ENDING_AUDIO_ID)
      return
    }

    if (hotspot.audioNarrationId) {
      this.playAudio(hotspot.audioNarrationId)
    }
  }

  leaveHotspot(): void {
    if (!this.state.currentHotspotId) return
    const leavingId = this.state.currentHotspotId
    this.state.currentHotspotId = null
    this.callbacks.onHotspotLeave?.(leavingId)
    this.emitStateChange()
  }

  private visitHotspot(hotspotId: string): void {
    const hotspot = this.getHotspot(hotspotId)
    if (!hotspot) return

    this.state.visitedHotspotIds.push(hotspotId)

    if (hotspot.isSecret) {
      this.state.discoveredSecrets.push(hotspotId)
      this.callbacks.onSecretDiscovered?.(hotspotId, hotspot)
    }

    this.callbacks.onHotspotVisit?.(hotspot)

    if (hotspot.rewardScore && hotspot.rewardScore > 0) {
      this.state.totalScoreEarned += hotspot.rewardScore
      this.callbacks.onScoreEarned?.(
        hotspot.rewardScore,
        this.state.totalScoreEarned,
      )
    }

    TOUR_HISTORICAL_FACTS.forEach((fact) => {
      if (
        fact.relatedHotspotIds?.includes(hotspotId) &&
        !this.state.unlockedFactIds.includes(fact.id)
      ) {
        this.state.unlockedFactIds.push(fact.id)
      }
    })

    this.checkHotspotUnlocks()
    this.saveToStorage()
  }

  private checkHotspotUnlocks(): void {
    const nonSecretHotspots = TOUR_HOTSPOTS.filter((h) => !h.isSecret)
    const allNonSecretVisited = nonSecretHotspots.every((h) =>
      this.state.visitedHotspotIds.includes(h.id),
    )

    if (
      allNonSecretVisited &&
      !this.state.unlockedHotspotIds.includes(TOUR_SECRET_HOTSPOT_ID)
    ) {
      this.state.unlockedHotspotIds.push(TOUR_SECRET_HOTSPOT_ID)
      this.state.flags['all_hotspots_visited'] = true
    }

    TOUR_HOTSPOTS.forEach((h) => {
      if (h.unlockCondition && !this.state.unlockedHotspotIds.includes(h.id)) {
        let unlocked = false
        switch (h.unlockCondition.type) {
          case 'visited':
            unlocked =
              h.unlockCondition.hotspotIds?.every((id: string) =>
                this.state.visitedHotspotIds.includes(id),
              ) ?? false
            break
          case 'all_visited':
            unlocked = TOUR_HOTSPOTS.filter((hh) => !hh.isSecret).every((hh) =>
              this.state.visitedHotspotIds.includes(hh.id),
            )
            break
          case 'flag_set':
            unlocked = h.unlockCondition.flagKey
              ? !!this.state.flags[h.unlockCondition.flagKey]
              : false
            break
        }
        if (unlocked) {
          this.state.unlockedHotspotIds.push(h.id)
        }
      }
    })
  }

  highlightPath(pathId: string): void {
    if (!this.state.isActive) return
    const path = this.getPath(pathId)
    if (!path) return
    this.state.currentPathId = pathId
    this.state.currentHotspotId = null
    this.callbacks.onPathHighlight?.(path)
    this.emitStateChange()
  }

  clearPathHighlight(): void {
    this.state.currentPathId = null
    this.emitStateChange()
  }

  togglePaths(show: boolean): void {
    this.state.showPaths = show
    this.emitStateChange()
  }

  toggleHotspots(show: boolean): void {
    this.state.showHotspots = show
    this.emitStateChange()
  }

  toggleHistoricalLabels(show: boolean): void {
    this.state.showHistoricalLabels = show
    this.emitStateChange()
  }

  playAudio(trackId: string): void {
    if (!this.state.isActive) return
    const track = this.getAudioTrack(trackId)
    if (!track) return

    this.stopAudio()
    this.state.currentAudioTrackId = trackId
    this.state.audioPlaying = true
    this.state.audioProgress = 0
    this.audioStartTime = Date.now()
    this.audioPauseOffset = 0

    this.audioPlayer.playTrack(trackId)

    this.callbacks.onAudioStart?.(track)
    this.emitStateChange()

    this.startAudioProgressTimer(track)
  }

  private startAudioProgressTimer(track: TourAudioTrack): void {
    this.audioTimer = window.setInterval(() => {
      if (!this.state.audioPlaying) return
      const elapsed = Date.now() - this.audioStartTime - this.audioPauseOffset
      const progress = Math.min(1, elapsed / track.durationMs)
      this.state.audioProgress = progress

      if (progress >= 1) {
        this.stopAudio()
        this.state.flags[`played_${track.id}`] = true
        this.emitStateChange()
      }
    }, 100)
  }

  pauseAudio(): void {
    if (!this.state.audioPlaying) return
    this.state.audioPlaying = false
    if (this.audioTimer) {
      clearInterval(this.audioTimer)
      this.audioTimer = null
    }
    this.audioPauseOffset += Date.now() - this.audioStartTime
    this.audioPlayer.pause()
    this.emitStateChange()
  }

  resumeAudio(): void {
    if (this.state.audioPlaying) return
    if (!this.state.currentAudioTrackId) return
    const track = this.getAudioTrack(this.state.currentAudioTrackId)
    if (!track) return

    this.state.audioPlaying = true
    this.audioStartTime = Date.now()
    this.audioPlayer.resume()
    this.startAudioProgressTimer(track)
    this.emitStateChange()
  }

  stopAudio(): void {
    if (this.audioTimer) {
      clearInterval(this.audioTimer)
      this.audioTimer = null
    }
    this.state.audioPlaying = false
    this.state.currentAudioTrackId = null
    this.state.audioProgress = 0
    this.emitStateChange()
  }

  seekAudio(progress: number): void {
    if (!this.state.currentAudioTrackId) return
    const track = this.getAudioTrack(this.state.currentAudioTrackId)
    if (!track) return

    const wasPlaying = this.state.audioPlaying
    this.state.audioProgress = Math.max(0, Math.min(1, progress))
    this.audioPauseOffset = 0
    this.audioStartTime =
      Date.now() - this.state.audioProgress * track.durationMs

    this.audioPlayer.seek(this.state.audioProgress * (track.durationMs / 1000))

    if (wasPlaying) {
      this.startAudioProgressTimer(track)
    }
    this.emitStateChange()
  }

  resetTour(): void {
    this.stopAudio()
    this.audioPlayer.destroy()
    this.state = this.createInitialState()
    this.clearSave()
    this.emitStateChange()
  }

  saveToStorage(): void {
    try {
      const saveData: TourSaveData = {
        visitedHotspotIds: [...this.state.visitedHotspotIds],
        unlockedHotspotIds: [...this.state.unlockedHotspotIds],
        discoveredSecrets: [...this.state.discoveredSecrets],
        unlockedFactIds: [...this.state.unlockedFactIds],
        totalScoreEarned: this.state.totalScoreEarned,
        flags: { ...this.state.flags },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
    } catch (e) {
      console.warn('Failed to save tour progress:', e)
    }
  }

  loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const saveData: TourSaveData = JSON.parse(raw)
      this.state.visitedHotspotIds = saveData.visitedHotspotIds ?? []
      this.state.unlockedHotspotIds = saveData.unlockedHotspotIds ?? []
      this.state.discoveredSecrets = saveData.discoveredSecrets ?? []
      this.state.unlockedFactIds = saveData.unlockedFactIds ?? []
      this.state.totalScoreEarned = saveData.totalScoreEarned ?? 0
      this.state.flags = saveData.flags ?? {}
      this.emitStateChange()
      return true
    } catch (e) {
      console.warn('Failed to load tour progress:', e)
      return false
    }
  }

  hasSavedData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  clearSave(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  private emitStateChange(): void {
    this.callbacks.onStateChange?.({
      ...this.state,
      audioState: { ...this.state.audioState },
    })
  }

  destroy(): void {
    this.stopAudio()
    this.audioPlayer.destroy()
  }
}

export const tourSystem = new TourSystem()
