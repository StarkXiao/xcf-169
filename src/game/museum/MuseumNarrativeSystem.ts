import type {
  MuseumSaveState,
  MuseumStateEffect,
  MuseumStateCondition,
  MuseumScene,
  MuseumChapter,
  MuseumEnding,
  MuseumItem,
  MuseumPuzzleConfig,
  MuseumCharacter,
  DialogNode,
  DialogChoice,
  ExplorationHotspot,
  MuseumRuntimeState,
  MuseumPuzzleProgress,
  MuseumChapterProgress,
  SaveSlotInfo,
} from '../../types/museum'
import type { ClockTime } from '../../types'
import {
  MUSEUM_CHARACTERS,
  MUSEUM_SCENES,
  MUSEUM_CHAPTERS,
  MUSEUM_ENDINGS,
  MUSEUM_ITEMS,
  MUSEUM_PUZZLES,
  MUSEUM_BACKGROUNDS,
} from './MuseumData'

const STORAGE_KEY = 'clocktower_museum_narrative_v1'
const SLOT_KEY_PREFIX = 'clocktower_museum_slot_'

const DEFAULT_SAVE_STATE: MuseumSaveState = {
  currentChapterId: 'ch1',
  currentSceneId: 'ch1_entry',
  currentDialogNodeIndex: 0,
  flags: {},
  score: 0,
  totalScore: 0,
  inventory: [],
  unlockedChapterIds: ['ch1'],
  completedChapters: [],
  unlockedEndings: [],
  unlockedEndingIds: [],
  completedPuzzleIds: [],
  visitedSceneIds: [],
  foundHotspots: [],
  clickedHotspotIds: [],
  relationships: {},
  endingPath: undefined,
  totalPlayTimeSeconds: 0,
  lastSaveTimestamp: 0,
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function clockTimeToMinutes(time: ClockTime): number {
  return time.hours * 60 + time.minutes
}

function getTimeDiffMinutes(a: ClockTime, b: ClockTime): number {
  const diff = Math.abs(clockTimeToMinutes(a) - clockTimeToMinutes(b))
  return diff > 360 ? 720 - diff : diff
}

export class MuseumNarrativeSystem {
  private saveState: MuseumSaveState
  private runtimeState: MuseumRuntimeState
  private playTimeInterval: number | null = null

  private onSaveStateChange?: (state: MuseumSaveState) => void
  private onRuntimeStateChange?: (state: MuseumRuntimeState) => void
  private onSceneEnter?: (scene: MuseumScene) => void
  private onDialogAdvance?: (node: DialogNode, index: number) => void
  private onChoiceMade?: (choice: DialogChoice) => void
  private onItemGained?: (item: MuseumItem) => void
  private onScoreChange?: (newScore: number, delta: number) => void
  private onPuzzleStart?: (puzzle: MuseumPuzzleConfig) => void
  private onPuzzleComplete?: (puzzle: MuseumPuzzleConfig, progress: MuseumPuzzleProgress) => void
  private onChapterUnlock?: (chapter: MuseumChapter) => void
  private onEndingUnlock?: (ending: MuseumEnding) => void

  constructor() {
    this.saveState = this.loadSaveState()
    this.runtimeState = {
      phase: 'title_screen',
      saveState: this.saveState,
      currentDialogIndex: 0,
    }
  }

  private loadSaveState(): MuseumSaveState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MuseumSaveState>
        return {
          ...DEFAULT_SAVE_STATE,
          ...parsed,
          flags: parsed.flags ?? {},
          inventory: parsed.inventory ?? [],
          unlockedChapterIds: parsed.unlockedChapterIds ?? ['prologue'],
          unlockedEndingIds: parsed.unlockedEndingIds ?? [],
          completedPuzzleIds: parsed.completedPuzzleIds ?? [],
          visitedSceneIds: parsed.visitedSceneIds ?? [],
          clickedHotspotIds: parsed.clickedHotspotIds ?? [],
          relationships: parsed.relationships ?? {},
        }
      }
    } catch (e) {
      console.warn('Failed to load museum narrative state', e)
    }
    return { ...DEFAULT_SAVE_STATE }
  }

  private persistSaveState(): void {
    this.saveState.lastSaveTimestamp = Date.now()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.saveState))
    } catch (e) {
      console.warn('Failed to save museum narrative state', e)
    }
    this.onSaveStateChange?.(this.getSaveState())
    this.runtimeState.saveState = this.getSaveState()
    this.onRuntimeStateChange?.(this.getRuntimeState())
  }

  startPlayTimeTracking(): void {
    this.stopPlayTimeTracking()
    this.playTimeInterval = window.setInterval(() => {
      this.saveState.totalPlayTimeSeconds += 1
    }, 1000)
  }

  stopPlayTimeTracking(): void {
    if (this.playTimeInterval !== null) {
      clearInterval(this.playTimeInterval)
      this.playTimeInterval = null
    }
  }

  evaluateCondition(condition: MuseumStateCondition): boolean {
    const { type, key, value } = condition
    switch (type) {
      case 'flag_set':
        return !!this.saveState.flags[key]
      case 'flag_not_set':
        return !this.saveState.flags[key]
      case 'has_item':
        return this.saveState.inventory.includes(key)
      case 'no_item':
        return !this.saveState.inventory.includes(key)
      case 'score_above':
        return this.saveState.score >= (typeof value === 'number' ? value : 0)
      case 'score_below':
        return this.saveState.score < (typeof value === 'number' ? value : 0)
      case 'relationship_above':
        return (this.saveState.relationships[key] ?? 0) >= (typeof value === 'number' ? value : 0)
      case 'ending_path_is':
        return this.saveState.endingPath === key
      case 'chapter_unlocked':
        return this.saveState.unlockedChapterIds.includes(key)
      default:
        return false
    }
  }

  applyEffect(effect: MuseumStateEffect): void {
    const { type, key, value } = effect
    switch (type) {
      case 'set_flag':
        this.saveState.flags[key] = value !== false
        break
      case 'add_score': {
        const delta = typeof value === 'number' ? value : 0
        this.saveState.score += delta
        this.onScoreChange?.(this.saveState.score, delta)
        break
      }
      case 'add_item':
        if (!this.saveState.inventory.includes(key)) {
          this.saveState.inventory.push(key)
          const item = this.getItem(key)
          if (item) this.onItemGained?.(item)
          this.showMessage(`获得物品：${item?.displayName ?? key}`, 'item')
        }
        break
      case 'remove_item': {
        const idx = this.saveState.inventory.indexOf(key)
        if (idx >= 0) this.saveState.inventory.splice(idx, 1)
        break
      }
      case 'set_ending_path':
        this.saveState.endingPath = key
        break
      case 'unlock_chapter': {
        if (!this.saveState.unlockedChapterIds.includes(key)) {
          this.saveState.unlockedChapterIds.push(key)
          const chapter = this.getChapter(key)
          if (chapter) {
            this.onChapterUnlock?.(chapter)
            this.showMessage(`解锁章节：${chapter.title}`, 'success')
          }
        }
        break
      }
      case 'add_relationship': {
        const delta = typeof value === 'number' ? value : 1
        this.saveState.relationships[key] = (this.saveState.relationships[key] ?? 0) + delta
        break
      }
      case 'unlock_scene':
        this.saveState.flags[`unlocked_${key}`] = true
        break
    }
    this.persistSaveState()
  }

  applyEffects(effects: MuseumStateEffect[]): void {
    effects.forEach((e) => this.applyEffect(e))
  }

  setPhase(phase: MuseumRuntimeState['phase']): void {
    this.runtimeState.phase = phase
    this.onRuntimeStateChange?.(this.getRuntimeState())
  }

  getPhase(): MuseumRuntimeState['phase'] {
    return this.runtimeState.phase
  }

  getSaveState(): MuseumSaveState {
    return {
      ...this.saveState,
      flags: { ...this.saveState.flags },
      inventory: [...this.saveState.inventory],
      unlockedChapterIds: [...this.saveState.unlockedChapterIds],
      unlockedEndingIds: [...this.saveState.unlockedEndingIds],
      completedPuzzleIds: [...this.saveState.completedPuzzleIds],
      visitedSceneIds: [...this.saveState.visitedSceneIds],
      clickedHotspotIds: [...this.saveState.clickedHotspotIds],
      relationships: { ...this.saveState.relationships },
    }
  }

  getRuntimeState(): MuseumRuntimeState {
    return {
      ...this.runtimeState,
      saveState: this.getSaveState(),
      currentScene: this.runtimeState.currentScene ? { ...this.runtimeState.currentScene } : undefined,
      puzzleProgress: this.runtimeState.puzzleProgress ? { ...this.runtimeState.puzzleProgress } : undefined,
    }
  }

  getAllChapters(): MuseumChapter[] {
    return [...MUSEUM_CHAPTERS]
  }

  getAvailableChapters(): MuseumChapter[] {
    return MUSEUM_CHAPTERS.filter((c) => {
      if (this.saveState.unlockedChapterIds.includes(c.id)) return true
      if (c.unlockCondition && this.evaluateCondition(c.unlockCondition)) return true
      return false
    }).sort((a, b) => a.order - b.order)
  }

  getChapter(chapterId: string): MuseumChapter | undefined {
    return MUSEUM_CHAPTERS.find((c) => c.id === chapterId)
  }

  getChapterProgress(chapterId: string): MuseumChapterProgress {
    const chapter = this.getChapter(chapterId)
    const scenes = chapter?.sceneIds ?? []
    const visited = scenes.filter((s) => this.saveState.visitedSceneIds.includes(s)).length
    const puzzlesInChapter = MUSEUM_PUZZLES.filter((p) =>
      scenes.some((sId) => {
        const sc = this.getScene(sId)
        return sc?.puzzleId === p.id
      })
    )
    const completedPuzzles = puzzlesInChapter.filter((p) =>
      this.saveState.completedPuzzleIds.includes(p.id)
    ).length

    return {
      chapterId,
      scenesTotal: scenes.length,
      scenesVisited: visited,
      puzzlesTotal: puzzlesInChapter.length,
      puzzlesCompleted: completedPuzzles,
      percentComplete: scenes.length > 0 ? Math.round((visited / scenes.length) * 100) : 0,
    }
  }

  getScene(sceneId: string): MuseumScene | undefined {
    return MUSEUM_SCENES.find((s) => s.id === sceneId)
  }

  getCurrentScene(): MuseumScene | undefined {
    return this.getScene(this.saveState.currentSceneId)
  }

  enterChapter(chapterId: string): boolean {
    const chapter = this.getChapter(chapterId)
    if (!chapter) return false
    if (!this.saveState.unlockedChapterIds.includes(chapterId)) {
      if (chapter.unlockCondition && !this.evaluateCondition(chapter.unlockCondition)) {
        return false
      }
      this.saveState.unlockedChapterIds.push(chapterId)
    }
    this.saveState.currentChapterId = chapterId
    this.saveState.currentSceneId = chapter.prologueSceneId
    this.saveState.currentDialogNodeIndex = 0
    this.runtimeState.currentDialogIndex = 0
    this.persistSaveState()
    this.enterScene(chapter.prologueSceneId)
    return true
  }

  enterScene(sceneId: string): boolean {
    const scene = this.getScene(sceneId)
    if (!scene) return false
    if (scene.isLocked && scene.unlockCondition && !this.evaluateCondition(scene.unlockCondition)) {
      return false
    }

    if (!this.saveState.visitedSceneIds.includes(sceneId)) {
      this.saveState.visitedSceneIds.push(sceneId)
    }
    this.saveState.currentSceneId = sceneId
    this.saveState.currentDialogNodeIndex = 0
    this.runtimeState.currentScene = scene
    this.runtimeState.currentDialogIndex = 0
    this.runtimeState.puzzleProgress = undefined

    if (scene.onEnterEffects) {
      this.applyEffects(scene.onEnterEffects)
    }

    if (scene.type === 'puzzle' && scene.puzzleId) {
      this.startPuzzle(scene.puzzleId)
    }

    this.onSceneEnter?.(scene)
    this.persistSaveState()
    this.onRuntimeStateChange?.(this.getRuntimeState())

    return true
  }

  getCurrentDialog(): DialogNode | undefined {
    const scene = this.getCurrentScene()
    if (!scene?.dialogNodes) return undefined
    return scene.dialogNodes[this.runtimeState.currentDialogIndex]
  }

  getDialogCount(): number {
    return this.getCurrentScene()?.dialogNodes?.length ?? 0
  }

  advanceDialog(): { ok: boolean; node?: DialogNode; isLast: boolean } {
    const scene = this.getCurrentScene()
    if (!scene?.dialogNodes) return { ok: false, isLast: true }

    const currentIdx = this.runtimeState.currentDialogIndex
    const currentNode = scene.dialogNodes[currentIdx]

    if (currentNode?.onExit) {
      this.applyEffects(currentNode.onExit)
    }

    if (currentIdx + 1 < scene.dialogNodes.length) {
      this.runtimeState.currentDialogIndex = currentIdx + 1
      this.saveState.currentDialogNodeIndex = currentIdx + 1
      const nextNode = scene.dialogNodes[this.runtimeState.currentDialogIndex]
      if (nextNode?.onEnter) {
        this.applyEffects(nextNode.onEnter)
      }
      this.persistSaveState()
      this.onDialogAdvance?.(nextNode, this.runtimeState.currentDialogIndex)
      this.onRuntimeStateChange?.(this.getRuntimeState())
      return { ok: true, node: nextNode, isLast: false }
    }

    if (scene.autoNextSceneId) {
      setTimeout(() => this.enterScene(scene.autoNextSceneId!), 50)
    }

    return { ok: true, node: currentNode, isLast: true }
  }

  makeChoice(choice: DialogChoice): boolean {
    if (choice.condition && !this.evaluateCondition(choice.condition)) {
      return false
    }
    if (choice.requiredItemId && !this.saveState.inventory.includes(choice.requiredItemId)) {
      return false
    }

    if (choice.effect) {
      this.applyEffect(choice.effect)
    }

    this.onChoiceMade?.(choice)
    return this.enterScene(choice.nextSceneId)
  }

  getAvailableChoices(): DialogChoice[] {
    const dialog = this.getCurrentDialog()
    if (!dialog?.choices) return []
    return dialog.choices.filter((c) => {
      if (c.condition && !this.evaluateCondition(c.condition)) return false
      if (c.requiredItemId && !this.saveState.inventory.includes(c.requiredItemId)) return false
      return true
    })
  }

  getAllCharacters(): MuseumCharacter[] {
    return [...MUSEUM_CHARACTERS]
  }

  getCharacter(characterId: string): MuseumCharacter | undefined {
    return MUSEUM_CHARACTERS.find((c) => c.id === characterId)
  }

  getAllItems(): MuseumItem[] {
    return [...MUSEUM_ITEMS]
  }

  getItem(itemId: string): MuseumItem | undefined {
    return MUSEUM_ITEMS.find((i) => i.id === itemId)
  }

  getInventoryItems(): MuseumItem[] {
    return this.saveState.inventory
      .map((id) => this.getItem(id))
      .filter((i): i is MuseumItem => !!i)
  }

  getBackground(backgroundId: string) {
    return MUSEUM_BACKGROUNDS.find((b) => b.id === backgroundId)
  }

  getAllPuzzles(): MuseumPuzzleConfig[] {
    return [...MUSEUM_PUZZLES]
  }

  getPuzzle(puzzleId: string): MuseumPuzzleConfig | undefined {
    return MUSEUM_PUZZLES.find((p) => p.id === puzzleId)
  }

  startPuzzle(puzzleId: string): boolean {
    const puzzle = this.getPuzzle(puzzleId)
    if (!puzzle) return false

    const progress: MuseumPuzzleProgress = {
      puzzleId,
      attempts: 0,
      hintsUsed: 0,
      isCompleted: false,
      timeElapsed: 0,
    }

    if (puzzle.type === 'clock_calibration' || puzzle.type === 'time_portal') {
      progress.currentTime = { hours: 12, minutes: 0 }
    }
    if (puzzle.type === 'gear_sequence') {
      progress.gearAngles = puzzle.gearSequence?.map(() => 0) ?? [0, 0, 0]
    }
    if (puzzle.type === 'bell_chord') {
      progress.selectedNotes = []
    }
    if (puzzle.type === 'symbol_decipher') {
      progress.selectedSymbols = []
    }
    if (puzzle.type === 'constellation') {
      progress.connectedStars = []
    }

    this.runtimeState.puzzleProgress = progress
    this.runtimeState.phase = 'puzzle_playing'
    this.onPuzzleStart?.(puzzle)
    this.onRuntimeStateChange?.(this.getRuntimeState())
    return true
  }

  updatePuzzleProgress(update: Partial<MuseumPuzzleProgress>): void {
    if (!this.runtimeState.puzzleProgress) return
    this.runtimeState.puzzleProgress = { ...this.runtimeState.puzzleProgress, ...update }
    this.onRuntimeStateChange?.(this.getRuntimeState())
  }

  submitPuzzle(): { success: boolean; message?: string } {
    const progress = this.runtimeState.puzzleProgress
    const scene = this.getCurrentScene()
    if (!progress || !scene?.puzzleId) return { success: false }

    const puzzle = this.getPuzzle(scene.puzzleId)
    if (!puzzle) return { success: false }

    progress.attempts += 1
    let success = false

    switch (puzzle.type) {
      case 'clock_calibration':
      case 'time_portal': {
        if (puzzle.targetTime && progress.currentTime) {
          const diff = getTimeDiffMinutes(progress.currentTime, puzzle.targetTime)
          success = diff <= (puzzle.toleranceMinutes ?? 3)
        }
        break
      }
      case 'gear_sequence': {
        if (puzzle.gearSequence && progress.gearAngles) {
          success = puzzle.gearSequence.every((target, i) => {
            const angle = progress.gearAngles?.[i] ?? 0
            const normalized = ((angle % 360) + 360) % 360
            const targetNorm = ((target % 360) + 360) % 360
            const diff = Math.min(Math.abs(normalized - targetNorm), 360 - Math.abs(normalized - targetNorm))
            return diff <= 15
          })
        }
        break
      }
      case 'bell_chord': {
        if (puzzle.bellNotes && progress.selectedNotes) {
          const targetSorted = [...puzzle.bellNotes].sort()
          const selectedSorted = [...progress.selectedNotes].sort()
          success =
            targetSorted.length === selectedSorted.length &&
            targetSorted.every((n, i) => n === selectedSorted[i])
        }
        break
      }
      case 'symbol_decipher': {
        if (puzzle.symbolPattern && progress.selectedSymbols) {
          success =
            puzzle.symbolPattern.length === progress.selectedSymbols.length &&
            puzzle.symbolPattern.every((s, i) => s === progress.selectedSymbols![i])
        }
        break
      }
      case 'constellation': {
        if (puzzle.constellationPattern && progress.connectedStars) {
          success =
            puzzle.constellationPattern.length === progress.connectedStars.length &&
            puzzle.constellationPattern.every((target, i) => {
              const star = progress.connectedStars?.[i]
              if (!star) return false
              return Math.abs(star.x - target.x) <= 8 && Math.abs(star.y - target.y) <= 8
            })
        }
        break
      }
      case 'combined': {
        success = true
        break
      }
    }

    progress.isCompleted = success

    if (success) {
      if (!this.saveState.completedPuzzleIds.includes(puzzle.id)) {
        this.saveState.completedPuzzleIds.push(puzzle.id)
      }
      if (puzzle.rewardScore) {
        this.applyEffect({ type: 'add_score', key: '', value: puzzle.rewardScore })
      }
      if (puzzle.rewardItemId) {
        this.applyEffect({ type: 'add_item', key: puzzle.rewardItemId })
      }
      this.onPuzzleComplete?.(puzzle, progress)
      this.runtimeState.phase = 'scene_playing'
      this.persistSaveState()
      this.enterScene(puzzle.successSceneId)
    } else if (puzzle.failSceneId) {
      this.enterScene(puzzle.failSceneId)
    }

    this.onRuntimeStateChange?.(this.getRuntimeState())
    return {
      success,
      message: success ? '机关解锁成功！' : '似乎不对，请再试试...',
    }
  }

  useHint(): string | null {
    const progress = this.runtimeState.puzzleProgress
    const scene = this.getCurrentScene()
    if (!progress || !scene?.puzzleId) return null
    const puzzle = this.getPuzzle(scene.puzzleId)
    progress.hintsUsed += 1
    this.applyEffect({ type: 'add_score', key: '', value: -100 })
    this.onRuntimeStateChange?.(this.getRuntimeState())
    return puzzle?.hint ?? null
  }

  clickHotspot(hotspot: ExplorationHotspot): boolean {
    if (hotspot.condition && !this.evaluateCondition(hotspot.condition)) {
      return false
    }
    if (hotspot.oneTime && this.saveState.clickedHotspotIds.includes(hotspot.id)) {
      return false
    }

    if (hotspot.oneTime) {
      this.saveState.clickedHotspotIds.push(hotspot.id)
    }

    if (hotspot.giveItemId) {
      this.applyEffect({ type: 'add_item', key: hotspot.giveItemId })
    }
    if (hotspot.effects) {
      this.applyEffects(hotspot.effects)
    }
    if (hotspot.description) {
      this.showMessage(hotspot.description, 'clue')
    }
    if (hotspot.clickedSceneId) {
      this.enterScene(hotspot.clickedSceneId)
    }

    this.persistSaveState()
    this.onRuntimeStateChange?.(this.getRuntimeState())
    return true
  }

  isHotspotClicked(hotspotId: string): boolean {
    return this.saveState.clickedHotspotIds.includes(hotspotId)
  }

  getExplorationHotspots(): ExplorationHotspot[] {
    return this.getCurrentScene()?.explorationHotspots ?? []
  }

  getAllEndings(): MuseumEnding[] {
    return [...MUSEUM_ENDINGS]
  }

  getEnding(endingId: string): MuseumEnding | undefined {
    return MUSEUM_ENDINGS.find((e) => e.id === endingId)
  }

  getUnlockedEndings(): MuseumEnding[] {
    return MUSEUM_ENDINGS.filter((e) => this.saveState.unlockedEndingIds.includes(e.id))
  }

  checkEnding(endingId: string): boolean {
    const ending = this.getEnding(endingId)
    if (!ending) return false

    if (ending.scoreRequirement && this.saveState.score < ending.scoreRequirement) {
      return false
    }
    if (ending.flagRequirements) {
      for (const flag of ending.flagRequirements) {
        if (!this.saveState.flags[flag]) return false
      }
    }
    if (ending.itemRequirements) {
      for (const item of ending.itemRequirements) {
        if (!this.saveState.inventory.includes(item)) return false
      }
    }
    if (ending.relationshipRequirements) {
      for (const [char, req] of Object.entries(ending.relationshipRequirements)) {
        if ((this.saveState.relationships[char] ?? 0) < req) return false
      }
    }
    return true
  }

  unlockEnding(endingId: string): boolean {
    const ending = this.getEnding(endingId)
    if (!ending) return false
    if (!this.checkEnding(endingId)) return false

    if (!this.saveState.unlockedEndingIds.includes(endingId)) {
      this.saveState.unlockedEndingIds.push(endingId)
      this.onEndingUnlock?.(ending)
      this.showMessage(`解锁结局：${ending.title}`, 'success')
    }

    this.runtimeState.phase = 'ending_playing'
    this.persistSaveState()
    this.onRuntimeStateChange?.(this.getRuntimeState())
    return true
  }

  showMessage(text: string, type: NonNullable<MuseumRuntimeState['displayMessage']>['type'] = 'info', durationMs = 3000): void {
    this.runtimeState.displayMessage = {
      text,
      type,
      expiresAt: Date.now() + durationMs,
    }
    this.onRuntimeStateChange?.(this.getRuntimeState())

    setTimeout(() => {
      if (
        this.runtimeState.displayMessage &&
        this.runtimeState.displayMessage.expiresAt <= Date.now()
      ) {
        this.runtimeState.displayMessage = undefined
        this.onRuntimeStateChange?.(this.getRuntimeState())
      }
    }, durationMs + 100)
  }

  reset(): void {
    this.saveState = { ...DEFAULT_SAVE_STATE }
    this.runtimeState = {
      phase: 'title_screen',
      saveState: this.saveState,
      currentDialogIndex: 0,
    }
    this.persistSaveState()
    this.onRuntimeStateChange?.(this.getRuntimeState())
  }

  fullReset(): void {
    this.saveState = {
      ...DEFAULT_SAVE_STATE,
      unlockedEndingIds: [],
    }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('Failed to reset museum narrative storage', e)
    }
    this.runtimeState = {
      phase: 'title_screen',
      saveState: this.saveState,
      currentDialogIndex: 0,
    }
    this.onRuntimeStateChange?.(this.getRuntimeState())
  }

  destroy(): void {
    this.stopPlayTimeTracking()
  }

  setOnSaveStateChange(cb: (state: MuseumSaveState) => void): void {
    this.onSaveStateChange = cb
  }
  setOnRuntimeStateChange(cb: (state: MuseumRuntimeState) => void): void {
    this.onRuntimeStateChange = cb
  }
  setOnSceneEnter(cb: (scene: MuseumScene) => void): void {
    this.onSceneEnter = cb
  }
  setOnDialogAdvance(cb: (node: DialogNode, index: number) => void): void {
    this.onDialogAdvance = cb
  }
  setOnChoiceMade(cb: (choice: DialogChoice) => void): void {
    this.onChoiceMade = cb
  }
  setOnItemGained(cb: (item: MuseumItem) => void): void {
    this.onItemGained = cb
  }
  setOnScoreChange(cb: (newScore: number, delta: number) => void): void {
    this.onScoreChange = cb
  }
  setOnPuzzleStart(cb: (puzzle: MuseumPuzzleConfig) => void): void {
    this.onPuzzleStart = cb
  }
  setOnPuzzleComplete(cb: (puzzle: MuseumPuzzleConfig, progress: MuseumPuzzleProgress) => void): void {
    this.onPuzzleComplete = cb
  }
  setOnChapterUnlock(cb: (chapter: MuseumChapter) => void): void {
    this.onChapterUnlock = cb
  }
  setOnEndingUnlock(cb: (ending: MuseumEnding) => void): void {
    this.onEndingUnlock = cb
  }

  setClockTime(hours: number, minutes: number): void {
    if (!this.runtimeState.puzzleProgress?.currentTime) return
    this.updatePuzzleProgress({
      currentTime: {
        hours: ((hours - 1) % 12 + 12) % 12 + 1,
        minutes: ((minutes % 60) + 60) % 60,
      },
    })
  }

  advanceClockHours(delta: number): void {
    if (!this.runtimeState.puzzleProgress?.currentTime) return
    const cur = this.runtimeState.puzzleProgress.currentTime
    this.setClockTime(cur.hours + delta, cur.minutes)
  }

  advanceClockMinutes(delta: number): void {
    if (!this.runtimeState.puzzleProgress?.currentTime) return
    const cur = this.runtimeState.puzzleProgress.currentTime
    let totalMin = cur.hours * 60 + cur.minutes + delta
    totalMin = ((totalMin % 720) + 720) % 720
    const h = Math.floor(totalMin / 60) || 12
    const m = totalMin % 60
    this.setClockTime(h, m)
  }

  rotateGear(gearIndex: number, degrees: number): void {
    if (!this.runtimeState.puzzleProgress?.gearAngles) return
    const angles = [...this.runtimeState.puzzleProgress.gearAngles]
    angles[gearIndex] = (angles[gearIndex] ?? 0) + degrees
    if (gearIndex === 0 && angles[1] !== undefined) {
      angles[1] -= degrees
    }
    if (gearIndex === 1) {
      if (angles[0] !== undefined) angles[0] -= degrees
      if (angles[2] !== undefined) angles[2] -= degrees
    }
    if (gearIndex === 2 && angles[1] !== undefined) {
      angles[1] -= degrees
    }
    this.updatePuzzleProgress({ gearAngles: angles })
  }

  toggleBellNote(note: string): void {
    if (!this.runtimeState.puzzleProgress?.selectedNotes) return
    const notes = [...this.runtimeState.puzzleProgress.selectedNotes]
    const idx = notes.indexOf(note)
    if (idx >= 0) {
      notes.splice(idx, 1)
    } else {
      notes.push(note)
    }
    this.updatePuzzleProgress({ selectedNotes: notes })
  }

  selectSymbol(symbol: string): void {
    if (!this.runtimeState.puzzleProgress?.selectedSymbols) return
    const symbols = [...this.runtimeState.puzzleProgress.selectedSymbols]
    symbols.push(symbol)
    this.updatePuzzleProgress({ selectedSymbols: symbols })
  }

  clearSymbolSelection(): void {
    this.updatePuzzleProgress({ selectedSymbols: [] })
  }

  addStarConnection(x: number, y: number): void {
    if (!this.runtimeState.puzzleProgress?.connectedStars) return
    const stars = [...this.runtimeState.puzzleProgress.connectedStars, { x, y }]
    this.updatePuzzleProgress({ connectedStars: stars })
  }

  clearStarConnections(): void {
    this.updatePuzzleProgress({ connectedStars: [] })
  }

  private _initialized = false

  isInitialized(): boolean {
    return this._initialized
  }

  initialize(): void {
    if (this._initialized) return
    this.loadSaveState()
    this.startPlayTimeTracking()
    if (this.saveState.currentSceneId) {
      this.enterScene(this.saveState.currentSceneId)
    } else {
      this.enterChapter('ch1')
    }
    this._initialized = true
  }

  getCurrentDialogNode(): DialogNode | undefined {
    return this.getCurrentDialog()
  }

  getCurrentChapter(): MuseumChapter | undefined {
    const scene = this.getCurrentScene()
    if (!scene) return undefined
    return this.getChapter(scene.chapterId)
  }

  getCurrentEnding(): MuseumEnding | undefined {
    const scene = this.getCurrentScene()
    if (scene?.type !== 'ending' || !scene.endingId) return undefined
    return this.getEnding(scene.endingId)
  }

  getPuzzleProgress(puzzleId: string): MuseumPuzzleProgress | undefined {
    if (this.runtimeState.puzzleProgress?.puzzleId === puzzleId) {
      return { ...this.runtimeState.puzzleProgress }
    }
    return undefined
  }

  interactHotspot(hotspotId: string): { foundItemId?: string; message?: string } {
    const scene = this.getCurrentScene()
    if (!scene?.explorationHotspots) return {}
    const hotspot = scene.explorationHotspots.find(h => h.id === hotspotId)
    if (!hotspot) return {}

    const result: { foundItemId?: string; message?: string } = {}

    if (!this.saveState.foundHotspots.includes(hotspotId)) {
      this.saveState.foundHotspots.push(hotspotId)
    }

    if (hotspot.oneTime && this.saveState.clickedHotspotIds.includes(hotspotId)) {
      return { message: '这里已经看过了' }
    }

    const ok = this.clickHotspot(hotspot)
    if (ok && hotspot.giveItemId) {
      result.foundItemId = hotspot.giveItemId
    }
    result.message = hotspot.description
    return result
  }

  saveToSlot(slot: number): boolean {
    try {
      const key = `${SLOT_KEY_PREFIX}${slot}`
      const data = {
        saveState: this.getSaveState(),
        timestamp: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(data))
      this.showMessage(`已保存到存档 ${slot}`, 'success')
      return true
    } catch (e) {
      console.warn('Save failed', e)
      return false
    }
  }

  loadFromSlot(slot: number): boolean {
    try {
      const key = `${SLOT_KEY_PREFIX}${slot}`
      const raw = localStorage.getItem(key)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      const loadedState = parsed.saveState as MuseumSaveState
      this.saveState = {
        ...DEFAULT_SAVE_STATE,
        ...loadedState,
        flags: { ...(loadedState.flags ?? {}) },
        inventory: [...(loadedState.inventory ?? [])],
        unlockedChapterIds: [...(loadedState.unlockedChapterIds ?? ['ch1'])],
        unlockedEndingIds: [...(loadedState.unlockedEndingIds ?? [])],
        completedPuzzleIds: [...(loadedState.completedPuzzleIds ?? [])],
        visitedSceneIds: [...(loadedState.visitedSceneIds ?? [])],
        foundHotspots: [...(loadedState.foundHotspots ?? [])],
        clickedHotspotIds: [...(loadedState.clickedHotspotIds ?? [])],
        relationships: { ...(loadedState.relationships ?? {}) },
      }
      this.runtimeState.currentDialogIndex = this.saveState.currentDialogNodeIndex
      if (this.saveState.currentSceneId) {
        this.enterScene(this.saveState.currentSceneId)
      }
      this.showMessage(`已读取存档 ${slot}`, 'success')
      return true
    } catch (e) {
      console.warn('Load failed', e)
      return false
    }
  }

  deleteSlot(slot: number): boolean {
    try {
      localStorage.removeItem(`${SLOT_KEY_PREFIX}${slot}`)
      return true
    } catch (e) {
      return false
    }
  }

  getSlotInfo(slot: number): SaveSlotInfo | null {
    try {
      const key = `${SLOT_KEY_PREFIX}${slot}`
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      const state = parsed.saveState as MuseumSaveState
      const chapter = this.getChapter(state.currentChapterId)
      const scene = this.getScene(state.currentSceneId)
      const date = new Date(parsed.timestamp ?? Date.now())
      const pad = (n: number) => String(n).padStart(2, '0')
      return {
        chapterTitle: chapter?.title ?? state.currentChapterId,
        sceneTitle: scene?.title,
        timestamp: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
      }
    } catch (e) {
      return null
    }
  }

  formatPlayTime(): string {
    const total = this.saveState.totalPlayTimeSeconds
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => String(n).padStart(2, '0')
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  }

  isChapterUnlocked(chapterId: string): boolean {
    if (this.saveState.unlockedChapterIds.includes(chapterId)) return true
    const chapter = this.getChapter(chapterId)
    if (chapter?.unlockCondition && this.evaluateCondition(chapter.unlockCondition)) {
      return true
    }
    return false
  }

  returnToChapterSelect(): void {
    this.runtimeState.phase = 'chapter_select'
    this.onRuntimeStateChange?.(this.getRuntimeState())
  }
}

export const museumNarrativeSystem = new MuseumNarrativeSystem()
export { genId }
