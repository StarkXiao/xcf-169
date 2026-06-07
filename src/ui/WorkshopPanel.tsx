import { useState, useEffect } from 'react'
import { workshopSystem, GEAR_MATERIALS, CALIBRATION_TOOLS } from '../game/WorkshopSystem'
import type { GearMaterial, CalibrationTool, WorkshopState, WorkshopEffects } from '../types'

interface WorkshopPanelProps {
  onClose: () => void
}

function WorkshopPanel({ onClose }: WorkshopPanelProps) {
  const [state, setState] = useState<WorkshopState>(workshopSystem.getState())
  const [effects, setEffects] = useState<WorkshopEffects>(workshopSystem.getEffects())

  const refresh = () => {
    setState(workshopSystem.getState())
    setEffects(workshopSystem.getEffects())
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleSelectMaterial = (material: GearMaterial) => {
    if (workshopSystem.setCurrentMaterial(material)) {
      refresh()
    }
  }

  const handleToggleTool = (tool: CalibrationTool) => {
    if (workshopSystem.toggleTool(tool)) {
      refresh()
    }
  }

  const formatScore = (score: number) => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}万`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  const getProgress = (unlockScore: number) => {
    if (unlockScore === 0) return 100
    return Math.min(100, Math.floor((state.totalScoreEarned / unlockScore) * 100))
  }

  return (
    <div className="workshop-panel">
      <div className="workshop-header">
        <h2 className="workshop-title">⚙️ 钟表工坊</h2>
        <button className="workshop-close" onClick={onClose}>✕</button>
      </div>

      <div className="workshop-stats">
        <div className="stat-item">
          <span className="stat-label">累计得分</span>
          <span className="stat-value gold">{formatScore(state.totalScoreEarned)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">历史最高</span>
          <span className="stat-value">{formatScore(state.bestScore)}</span>
        </div>
      </div>

      <div className="workshop-section">
        <h3 className="section-title">🔩 齿轮材质</h3>
        <div className="material-grid">
          {GEAR_MATERIALS.map((mat) => {
            const unlocked = workshopSystem.isMaterialUnlocked(mat.id)
            const selected = state.currentMaterial === mat.id
            const progress = getProgress(mat.unlockScore)

            return (
              <div
                key={mat.id}
                className={`material-card ${selected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => unlocked && handleSelectMaterial(mat.id)}
              >
                <div className="material-preview">
                  <div
                    className="gear-sample"
                    style={{
                      background: `radial-gradient(circle, #${mat.visual.baseColor.toString(16).padStart(6, '0')} 40%, #${mat.visual.borderColor.toString(16).padStart(6, '0')} 100%)`,
                      boxShadow: unlocked ? `0 0 15px ${mat.visual.glowColor}55` : 'none',
                    }}
                  />
                </div>
                <div className="material-name">{mat.displayName}</div>
                <div className="material-stats">
                  <span>效率 ×{mat.efficiencyMultiplier.toFixed(2)}</span>
                  {mat.toleranceBonus > 0 && <span>容错±{mat.toleranceBonus}</span>}
                </div>
                <div className="material-desc">{mat.description}</div>
                {!unlocked ? (
                  <div className="unlock-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-text">
                      {formatScore(state.totalScoreEarned)} / {formatScore(mat.unlockScore)}
                    </span>
                  </div>
                ) : selected ? (
                  <div className="selected-badge">已装备</div>
                ) : (
                  <div className="select-hint">点击装备</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="workshop-section">
        <h3 className="section-title">🛠️ 校时工具</h3>
        <div className="tool-grid">
          {CALIBRATION_TOOLS.map((tool) => {
            const unlocked = workshopSystem.isToolUnlocked(tool.id)
            const active = workshopSystem.isToolActive(tool.id)
            const progress = getProgress(tool.unlockScore)

            return (
              <div
                key={tool.id}
                className={`tool-card ${active ? 'active' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
                onClick={() => unlocked && handleToggleTool(tool.id)}
              >
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-name">{tool.displayName}</div>
                <div className="tool-desc">{tool.description}</div>
                {!unlocked ? (
                  <div className="unlock-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-text">
                      {formatScore(state.totalScoreEarned)} / {formatScore(tool.unlockScore)}
                    </span>
                  </div>
                ) : active ? (
                  <div className="active-badge">已启用</div>
                ) : (
                  <div className="inactive-hint">点击启用</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="workshop-section effects-summary">
        <h3 className="section-title">📊 当前效果</h3>
        <div className="effects-list">
          <div className="effect-row">
            <span className="effect-label">转动效率</span>
            <span className="effect-value">×{effects.efficiencyMultiplier.toFixed(2)}</span>
          </div>
          <div className="effect-row">
            <span className="effect-label">容错范围</span>
            <span className="effect-value">
              {effects.toleranceMinutes > 0 ? `±${effects.toleranceMinutes} 分钟` : '精准对齐'}
            </span>
          </div>
          <div className="effect-row">
            <span className="effect-label">故障抵抗</span>
            <span className="effect-value">
              {effects.faultResistanceChance > 0
                ? `${Math.floor(effects.faultResistanceChance * 100)}% 概率免疫`
                : '无'}
            </span>
          </div>
          <div className="effect-row">
            <span className="effect-label">目标提示</span>
            <span className="effect-value">{effects.showTargetHint ? '增强显示' : '标准'}</span>
          </div>
          <div className="effect-row">
            <span className="effect-label">视觉反馈</span>
            <span className="effect-value">{effects.enhancedFeedback ? '粒子+光晕' : '标准'}</span>
          </div>
        </div>
      </div>

      <div className="workshop-footer">
        <div className="hint-text">通过游戏获得积分来解锁更高级的齿轮和工具！</div>
        <button className="start-btn workshop-back" onClick={onClose}>返回菜单</button>
      </div>
    </div>
  )
}

export default WorkshopPanel
