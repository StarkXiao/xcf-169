import type {
  GearMaterial,
  GearMaterialConfig,
  CalibrationTool,
  CalibrationToolConfig,
  WorkshopState,
  WorkshopEffects,
} from '../types'

export const GEAR_MATERIALS: GearMaterialConfig[] = [
  {
    id: 'brass',
    name: 'brass',
    displayName: '黄铜齿轮',
    unlockScore: 0,
    efficiencyMultiplier: 1.0,
    toleranceBonus: 0,
    visual: {
      baseColor: 0x5a4020,
      borderColor: 0xc9a96a,
      glowColor: '#c9a96a',
    },
    audio: {
      rotateFreq: 180,
      snapFreq: 440,
      waveform: 'square',
    },
    description: '基础黄铜材质，稳定可靠的标准齿轮。',
  },
  {
    id: 'steel',
    name: 'steel',
    displayName: '精钢齿轮',
    unlockScore: 2000,
    efficiencyMultiplier: 1.1,
    toleranceBonus: 5,
    visual: {
      baseColor: 0x404050,
      borderColor: 0xa0a0b8,
      glowColor: '#a0a0b8',
    },
    audio: {
      rotateFreq: 220,
      snapFreq: 520,
      waveform: 'triangle',
    },
    description: '精炼钢材，转动更高效，容错提升±5分钟。',
  },
  {
    id: 'silver',
    name: 'silver',
    displayName: '白银齿轮',
    unlockScore: 6000,
    efficiencyMultiplier: 1.25,
    toleranceBonus: 10,
    visual: {
      baseColor: 0x505560,
      borderColor: 0xd8d8e8,
      glowColor: '#e8e8f0',
    },
    audio: {
      rotateFreq: 260,
      snapFreq: 620,
      waveform: 'sine',
    },
    description: '纯银打造，精密运转，效率提升25%，容错±10分钟。',
  },
  {
    id: 'gold',
    name: 'gold',
    displayName: '黄金齿轮',
    unlockScore: 15000,
    efficiencyMultiplier: 1.5,
    toleranceBonus: 15,
    visual: {
      baseColor: 0x6a5020,
      borderColor: 0xffd700,
      glowColor: '#ffd700',
    },
    audio: {
      rotateFreq: 320,
      snapFreq: 740,
      waveform: 'sine',
    },
    description: '黄金齿轮，极致效率提升50%，容错±15分钟，音效如钟鸣。',
  },
  {
    id: 'platinum',
    name: 'platinum',
    displayName: '铂金齿轮',
    unlockScore: 30000,
    efficiencyMultiplier: 2.0,
    toleranceBonus: 25,
    visual: {
      baseColor: 0x505a65,
      borderColor: 0xe5e4e2,
      glowColor: '#88ddff',
    },
    audio: {
      rotateFreq: 380,
      snapFreq: 880,
      waveform: 'sine',
    },
    description: '传说铂金，效率翻倍，容错±25分钟，空灵音效。',
  },
]

export const CALIBRATION_TOOLS: CalibrationToolConfig[] = [
  {
    id: 'magnifier',
    name: 'magnifier',
    displayName: '刻度放大镜',
    icon: '🔍',
    unlockScore: 1000,
    description: '放大目标时刻的刻度提示，让你更清楚看到目标位置。',
    effect: { type: 'targetHint', value: 1 },
  },
  {
    id: 'lubricant',
    name: 'lubricant',
    displayName: '钟表润滑油',
    icon: '🛢️',
    unlockScore: 3000,
    description: '40%概率抵抗齿轮故障影响（卡滞/打滑/反转）。',
    effect: { type: 'faultResist', value: 0.4 },
  },
  {
    id: 'metronome',
    name: 'metronome',
    displayName: '精密节拍器',
    icon: '🎵',
    unlockScore: 5000,
    description: '增强视觉反馈，每次转动都有明显的光晕和粒子效果。',
    effect: { type: 'feedback', value: 1 },
  },
  {
    id: 'telescope',
    name: 'telescope',
    displayName: '校时望远镜',
    icon: '🔭',
    unlockScore: 8000,
    description: '再额外增加±10分钟的容错范围。',
    effect: { type: 'tolerance', value: 10 },
  },
]

const STORAGE_KEY = 'clocktower_workshop_state_v1'

const DEFAULT_STATE: WorkshopState = {
  currentMaterial: 'brass',
  unlockedMaterials: ['brass'],
  currentTools: [],
  unlockedTools: [],
  totalScoreEarned: 0,
  bestScore: 0,
}

export class WorkshopSystem {
  private state: WorkshopState

  constructor() {
    this.state = this.loadState()
  }

  private loadState(): WorkshopState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as WorkshopState
        return { ...DEFAULT_STATE, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load workshop state', e)
    }
    return { ...DEFAULT_STATE }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.warn('Failed to save workshop state', e)
    }
  }

  getState(): WorkshopState {
    return { ...this.state }
  }

  getTotalScoreEarned(): number {
    return this.state.totalScoreEarned
  }

  getBestScore(): number {
    return this.state.bestScore
  }

  recordGameScore(score: number): void {
    this.state.totalScoreEarned += score
    if (score > this.state.bestScore) {
      this.state.bestScore = score
    }
    this.checkUnlocks()
    this.saveState()
  }

  private checkUnlocks(): void {
    const totalScore = this.state.totalScoreEarned

    GEAR_MATERIALS.forEach((mat) => {
      if (totalScore >= mat.unlockScore && !this.state.unlockedMaterials.includes(mat.id)) {
        this.state.unlockedMaterials.push(mat.id)
      }
    })

    CALIBRATION_TOOLS.forEach((tool) => {
      if (totalScore >= tool.unlockScore && !this.state.unlockedTools.includes(tool.id)) {
        this.state.unlockedTools.push(tool.id)
      }
    })
  }

  getNewlyUnlocked(): { materials: GearMaterial[]; tools: CalibrationTool[] } {
    const prevScore = this.state.totalScoreEarned
    const newMaterials = GEAR_MATERIALS.filter(
      (m) => m.unlockScore <= prevScore && !this.state.unlockedMaterials.includes(m.id),
    ).map((m) => m.id)
    const newTools = CALIBRATION_TOOLS.filter(
      (t) => t.unlockScore <= prevScore && !this.state.unlockedTools.includes(t.id),
    ).map((t) => t.id)
    return { materials: newMaterials, tools: newTools }
  }

  setCurrentMaterial(material: GearMaterial): boolean {
    if (!this.state.unlockedMaterials.includes(material)) return false
    this.state.currentMaterial = material
    this.saveState()
    return true
  }

  getCurrentMaterial(): GearMaterialConfig {
    return (
      GEAR_MATERIALS.find((m) => m.id === this.state.currentMaterial) ?? GEAR_MATERIALS[0]
    )
  }

  toggleTool(tool: CalibrationTool): boolean {
    if (!this.state.unlockedTools.includes(tool)) return false
    const idx = this.state.currentTools.indexOf(tool)
    if (idx >= 0) {
      this.state.currentTools.splice(idx, 1)
    } else {
      this.state.currentTools.push(tool)
    }
    this.saveState()
    return true
  }

  isToolActive(tool: CalibrationTool): boolean {
    return this.state.currentTools.includes(tool)
  }

  getActiveToolConfigs(): CalibrationToolConfig[] {
    return CALIBRATION_TOOLS.filter((t) => this.state.currentTools.includes(t.id))
  }

  getEffects(): WorkshopEffects {
    const material = this.getCurrentMaterial()
    const activeTools = this.getActiveToolConfigs()

    let toleranceMinutes = material.toleranceBonus
    let faultResistanceChance = 0
    let showTargetHint = false
    let enhancedFeedback = false

    activeTools.forEach((tool) => {
      switch (tool.effect.type) {
        case 'tolerance':
          toleranceMinutes += tool.effect.value
          break
        case 'faultResist':
          faultResistanceChance = Math.max(faultResistanceChance, tool.effect.value)
          break
        case 'feedback':
          enhancedFeedback = true
          break
        case 'targetHint':
          showTargetHint = true
          break
      }
    })

    return {
      efficiencyMultiplier: material.efficiencyMultiplier,
      toleranceMinutes,
      faultResistanceChance,
      showTargetHint,
      enhancedFeedback,
    }
  }

  isMaterialUnlocked(material: GearMaterial): boolean {
    return this.state.unlockedMaterials.includes(material)
  }

  isToolUnlocked(tool: CalibrationTool): boolean {
    return this.state.unlockedTools.includes(tool)
  }

  getNextMaterialUnlock(): GearMaterialConfig | null {
    const locked = GEAR_MATERIALS.filter(
      (m) => !this.state.unlockedMaterials.includes(m.id),
    ).sort((a, b) => a.unlockScore - b.unlockScore)
    return locked[0] ?? null
  }

  getNextToolUnlock(): CalibrationToolConfig | null {
    const locked = CALIBRATION_TOOLS.filter(
      (t) => !this.state.unlockedTools.includes(t.id),
    ).sort((a, b) => a.unlockScore - b.unlockScore)
    return locked[0] ?? null
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE }
    this.saveState()
  }
}

export const workshopSystem = new WorkshopSystem()
