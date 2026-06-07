import type { MultiClockState, WorkshopEffects, MultiClockLevelConfig } from '../types'
import { workshopSystem } from '../game/WorkshopSystem'

interface MultiClockHUDProps {
  timeLeft: number
  totalTime: number
  mainClockCurrent: string
  mainClockTarget: string
  soundEnabled: boolean
  onToggleSound: () => void
  levelConfig: MultiClockLevelConfig
  multiClockState: MultiClockState | null
  workshopEffects?: WorkshopEffects
  fineAdjustMode: boolean
  onToggleFineAdjust: () => void
}

function MultiClockHUD({
  timeLeft,
  totalTime,
  mainClockCurrent,
  mainClockTarget,
  soundEnabled,
  onToggleSound,
  levelConfig,
  multiClockState,
  workshopEffects,
  fineAdjustMode,
  onToggleFineAdjust,
}: MultiClockHUDProps) {
  const material = workshopSystem.getCurrentMaterial()
  const activeTools = workshopSystem.getActiveToolConfigs()
  const effects = workshopEffects ?? workshopSystem.getEffects()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getTimerClass = () => {
    const ratio = timeLeft / totalTime
    if (ratio <= 10 / totalTime) return 'danger'
    if (ratio <= 30 / totalTime) return 'warning'
    return ''
  }

  const alignedCount = multiClockState?.sideTowers.filter((t) => t.isAligned).length ?? 0
  const totalTowers = multiClockState?.sideTowers.length ?? 0
  const activeMechanisms = multiClockState?.mechanisms.filter((m) => m.isActive).length ?? 0
  const totalMechanisms = multiClockState?.mechanisms.length ?? 0

  return (
    <div className="ui-overlay">
      <div className="hud-top">
        <div className="timer-panel">
          <div className="timer-label">剩余时间</div>
          <div className={`timer-value ${getTimerClass()}`}>{formatTime(timeLeft)}</div>
          <div className="period-info">
            <span className="period-name">{levelConfig.displayName}</span>
            <span className="period-progress">
              得分×{levelConfig.scoreMultiplier}
            </span>
          </div>
        </div>

        <div className="clock-status-panel">
          <div className="status-row">
            <span className="status-label">🗼 主钟</span>
            <span className="status-value current">{mainClockCurrent}</span>
            <span className="status-arrow">→</span>
            <span className="status-value target">{mainClockTarget}</span>
          </div>
          <div className="status-row">
            <span className="status-label">🕰️ 侧塔</span>
            <span className={alignedCount === totalTowers ? 'status-value all-aligned' : 'status-value'}>
              {alignedCount}/{totalTowers} 已对齐
            </span>
            <span className="status-label" style={{ marginLeft: '1rem' }}>⚙️ 机关</span>
            <span className="status-value">
              {activeMechanisms}/{totalMechanisms} 激活
            </span>
          </div>
          {multiClockState && (
            <div className="status-row">
              <span className="status-label">📊 总偏差</span>
              <span className="status-value">
                {multiClockState.totalDeviation} 分
              </span>
              <span className="status-label" style={{ marginLeft: '1rem' }}>容差</span>
              <span className="status-value tolerance">±{levelConfig.toleranceMinutes}分</span>
            </div>
          )}
        </div>

        <div className="hud-controls">
          <button
            className={`fine-adjust-btn ${fineAdjustMode ? 'active' : ''}`}
            onClick={onToggleFineAdjust}
            title={fineAdjustMode ? '切换为粗调（每次30分）' : '切换为微调（每次5分）'}
          >
            {fineAdjustMode ? '🔍 微调' : '⚡ 粗调'}
          </button>
          <button className="sound-toggle" onClick={onToggleSound}>
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {multiClockState && multiClockState.sideTowers.length > 0 && (
        <div className="side-towers-panel">
          <div className="panel-title">侧塔钟面状态</div>
          <div className="towers-grid">
            {multiClockState.sideTowers.map((tower) => (
              <div
                key={tower.id}
                className={`tower-card ${tower.isAligned ? 'aligned' : ''}`}
              >
                <div className="tower-header">
                  <span className="tower-dot" />
                  <span className="tower-name">{tower.displayName}</span>
                  <span className={`tower-role role-${tower.role}`}>
                    {tower.role === 'hour' ? '时' : '分'}
                  </span>
                </div>
                <div className="tower-times">
                  <span className="tower-current">
                    {tower.currentTime.hours}:{tower.currentTime.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="tower-arrow">→</span>
                  <span className="tower-target">
                    {tower.targetTime.hours}:{tower.targetTime.minutes.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="tower-deviation">
                  <span className={tower.isAligned ? 'deviation-aligned' : 'deviation-off'}>
                    偏差 {tower.deviationMinutes} 分
                  </span>
                  {tower.isAligned && <span className="aligned-badge">✓ 对齐</span>}
                </div>
                <div className="tower-linkage">
                  <span className="linkage-label">联动比</span>
                  <span className="linkage-value">×{tower.linkageRatio}</span>
                  {tower.mechanismId && (
                    <span className="mechanism-tag">🔗 有机关</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="workshop-indicator">
        <div
          className="gear-material-badge"
          style={{ borderColor: material.visual.glowColor }}
        >
          <span className="badge-icon">⚙️</span>
          <span className="badge-text">{material.displayName}</span>
          {effects.efficiencyMultiplier !== 1.0 && (
            <span className="badge-value">×{effects.efficiencyMultiplier.toFixed(2)}</span>
          )}
        </div>
        {activeTools.length > 0 && (
          <div className="active-tools-list">
            {activeTools.map((t) => (
              <span key={t.id} className="tool-badge" title={t.description}>
                {t.icon}
              </span>
            ))}
          </div>
        )}
        {effects.toleranceMinutes > 0 && (
          <div className="tolerance-badge">工具容差 ±{effects.toleranceMinutes}分</div>
        )}
      </div>

      <div className="hint-panel">
        <div className="hint-title">多钟面连锁校准说明</div>
        <div className="hint-content">
          • 点击主钟左半边倒退时间，右半边推进时间 · 粗调每次{30}分，微调每次{5}分
          <br />
          • 点击侧塔钟面可单独微调，每次±5分
          <br />
          • 主钟校准会按联动比牵动所有侧塔，机关激活可增强联动效果
          <br />• 将主钟和所有侧塔钟面同时对准目标时刻，即可通关！
        </div>
      </div>
    </div>
  )
}

export default MultiClockHUD
