import type { DiaryEntryId, DiarySettlementText } from '../../types'

export const DIARY_SETTLEMENT_TEXTS: Record<string, DiarySettlementText> = {
  default: {
    success: {
      title: '钟声准时响起！',
      subtitle: '守钟人，时间已校准',
      description: '钟声回荡在雨夜中',
    },
    fail: {
      title: '钟声失准了...',
      subtitle: '暴风雨打乱了时间的节奏',
      description: '下次再试试吧',
    },
    perfect: {
      title: '完美校准！',
      subtitle: '零偏差的艺术',
      description: '时间在你的指尖完美流动',
    },
  },
  diary_001: {
    success: {
      title: '初战告捷！',
      subtitle: '守钟学徒的第一步',
      description: '你成功完成了第一次校准，钟楼的齿轮为你转动',
    },
    fail: {
      title: '还需努力...',
      subtitle: '学徒之路漫长',
      description: '没关系，每个守钟人都是从失败中成长的',
    },
  },
  diary_002: {
    perfect: {
      title: '分毫不差！',
      subtitle: '精准的极致',
      description: '齿轮仿佛回应了你的意志，时间完美对齐',
    },
  },
  diary_005: {
    success: {
      title: '闪电般的速度！',
      subtitle: '快刀斩乱麻',
      description: '你以惊人的速度完成了校准',
    },
  },
  diary_008: {
    success: {
      title: '大师级校准！',
      subtitle: '传承的证明',
      description: '历代守钟人的意志，在你手中延续',
    },
    perfect: {
      title: '完美的传承！',
      subtitle: '超越时空的技艺',
      description: '你已经达到了守钟人的最高境界',
    },
  },
}

type CurrentEntryIdAccessor = () => DiaryEntryId | null

export type SettlementResultType = 'success' | 'fail' | 'perfect'

export interface SettlementTextResult {
  title: string
  subtitle: string
  description?: string
}

export class DiarySettlementProvider {
  private getCurrentEntryId: CurrentEntryIdAccessor

  constructor(getCurrentEntryId: CurrentEntryIdAccessor) {
    this.getCurrentEntryId = getCurrentEntryId
  }

  getSettlementText(entryId?: DiaryEntryId | null): DiarySettlementText {
    const id = entryId || this.getCurrentEntryId()
    if (id && DIARY_SETTLEMENT_TEXTS[id]) {
      return DIARY_SETTLEMENT_TEXTS[id]
    }
    return DIARY_SETTLEMENT_TEXTS.default
  }

  getTextByResult(
    resultType: SettlementResultType,
    entryId?: DiaryEntryId | null,
  ): SettlementTextResult | null {
    const settlement = this.getSettlementText(entryId)
    const text = settlement[resultType]
    if (!text) return null
    return {
      title: text.title,
      subtitle: text.subtitle,
      description: text.description,
    }
  }

  getTitle(resultType: SettlementResultType, entryId?: DiaryEntryId | null): string {
    const text = this.getTextByResult(resultType, entryId)
    return text?.title ?? this.getDefaultTitle(resultType)
  }

  getSubtitle(resultType: SettlementResultType, entryId?: DiaryEntryId | null): string {
    const text = this.getTextByResult(resultType, entryId)
    return text?.subtitle ?? this.getDefaultSubtitle(resultType)
  }

  getDescription(resultType: SettlementResultType, entryId?: DiaryEntryId | null): string | null {
    const text = this.getTextByResult(resultType, entryId)
    return text?.description ?? null
  }

  private getDefaultTitle(resultType: SettlementResultType): string {
    const defaults = DIARY_SETTLEMENT_TEXTS.default[resultType]
    return defaults?.title ?? (resultType === 'success' ? '成功！' : resultType === 'fail' ? '失败...' : '完美！')
  }

  private getDefaultSubtitle(resultType: SettlementResultType): string {
    const defaults = DIARY_SETTLEMENT_TEXTS.default[resultType]
    return defaults?.subtitle ?? ''
  }

  hasCustomText(entryId: DiaryEntryId, resultType?: SettlementResultType): boolean {
    const text = DIARY_SETTLEMENT_TEXTS[entryId]
    if (!text) return false
    if (!resultType) return true
    return !!text[resultType]
  }

  getAvailableEntryIds(): string[] {
    return Object.keys(DIARY_SETTLEMENT_TEXTS).filter((id) => id !== 'default')
  }

  addSettlementText(entryId: DiaryEntryId, text: DiarySettlementText): void {
    DIARY_SETTLEMENT_TEXTS[entryId] = text
  }

  removeSettlementText(entryId: DiaryEntryId): boolean {
    if (entryId === 'default') return false
    if (!DIARY_SETTLEMENT_TEXTS[entryId]) return false
    delete DIARY_SETTLEMENT_TEXTS[entryId]
    return true
  }
}
