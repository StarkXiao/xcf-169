import type {
  DiaryEntry,
  DiaryEntryId,
  KeeperDiaryEffects,
  SpecialCalibrationEffect,
  ClockTime,
} from '../../types'

type EntryAccessor = (id: DiaryEntryId) => DiaryEntry | undefined
type ActiveIdsAccessor = () => DiaryEntryId[]

export class DiaryTargetInjector {
  private getEntry: EntryAccessor
  private getActiveCalibrationIds: ActiveIdsAccessor

  constructor(
    getEntry: EntryAccessor,
    getActiveCalibrationIds: ActiveIdsAccessor,
  ) {
    this.getEntry = getEntry
    this.getActiveCalibrationIds = getActiveCalibrationIds
  }

  getEffects(): KeeperDiaryEffects {
    const activeEntries = this.getActiveCalibrationIds()
      .map((id) => this.getEntry(id))
      .filter((e): e is DiaryEntry => !!e && e.specialCalibrations.length > 0)

    const combinedEffects: SpecialCalibrationEffect[] = []
    activeEntries.forEach((entry) => {
      combinedEffects.push(...entry.specialCalibrations)
    })

    let scoreMultiplier = 1
    let toleranceBonus = 0
    let faultResistance = 0
    let timeBonusMultiplier = 1
    let hasHiddenMode = false
    let customTargetTime: ClockTime | undefined

    combinedEffects.forEach((effect) => {
      switch (effect.type) {
        case 'score_multiplier':
          scoreMultiplier *= typeof effect.value === 'number' ? effect.value : 1
          break
        case 'tolerance':
          toleranceBonus += typeof effect.value === 'number' ? effect.value : 0
          break
        case 'fault_resist':
          faultResistance += typeof effect.value === 'number' ? effect.value : 0
          break
        case 'time_bonus':
          timeBonusMultiplier *= typeof effect.value === 'number' ? effect.value : 1
          break
        case 'hidden_mode':
          hasHiddenMode = hasHiddenMode || effect.value === true
          break
        case 'target_time': {
          if (typeof effect.value === 'string') {
            const [h, m] = effect.value.split(':').map(Number)
            customTargetTime = { hours: h, minutes: m }
          }
          break
        }
        default:
          break
      }
    })

    const effects: KeeperDiaryEffects = {
      activeEntries,
      combinedEffects,
      scoreMultiplier,
      toleranceBonus,
      faultResistance: Math.min(faultResistance, 0.5),
      timeBonusMultiplier,
      hasHiddenMode,
      customTargetTime,
    }

    return effects
  }

  getScoreMultiplier(): number {
    return this.getEffects().scoreMultiplier
  }

  getToleranceBonus(): number {
    return this.getEffects().toleranceBonus
  }

  getCustomTargetTime(): ClockTime | undefined {
    return this.getEffects().customTargetTime
  }

  hasActiveHiddenMode(): boolean {
    return this.getEffects().hasHiddenMode
  }
}
