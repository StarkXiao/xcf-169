import type { DuoCoopState, DuoCoopLevelConfig } from '../types'

interface DuoCoopHUDProps {
  timeLeft: number
  totalTime: number
  masterCurrent: string
  masterTarget: string
  slaveCurrent: string
  slaveTarget: string
  soundEnabled: boolean
  onToggleSound: () => void
  levelConfig: DuoCoopLevelConfig
  duoState: DuoCoopState | null
  fineMaster: boolean
  fineSlave: boolean
  onToggleFineMaster: () => void
  onToggleFineSlave: () => void
}

function DuoCoopHUD({
  timeLeft,
  totalTime,
  masterCurrent,
  masterTarget,
  slaveCurrent,
  slaveTarget,
  soundEnabled,
  onToggleSound,
  levelConfig,
  duoState,
  fineMaster,
  fineSlave,
  onToggleFineMaster,
  onToggleFineSlave,
}: DuoCoopHUDProps) {
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

  const activeInterferences = duoState?.activeInterferences ?? []
  const syncAchieved = duoState?.syncTargets.filter((t) => t.isAchieved).length ?? 0
  const syncTotal = duoState?.syncTargets.length ?? 0
  const masterAligned = duoState?.master.isAligned ?? false
  const slaveAligned = duoState?.slave.isAligned ?? false

  return (
    <div className="ui-overlay">
      <div className="hud-top duo-hud-top">
        <div className="timer-panel">
          <div className="timer-label">剩余时间</div>
          <div className={`timer-value ${getTimerClass()}`}>{formatTime(timeLeft)}</div>
          <div className="period-info">
            <span className="period-name">{levelConfig.displayName}</span>
            <span className="period-progress">得分×{levelConfig.scoreMultiplier}</span>
          </div>
        </div>

        <div className="duo-status-panel">
          <div className="duo-player-row master-row">
            <span className="duo-role-tag master-tag">主钟</span>
            <span className="status-value current">{masterCurrent}</span>
            <span className="status-arrow">→</span>
            <span className="status-value target">{masterTarget}</span>
            <span className={`duo-align-badge ${masterAligned ? 'aligned' : 'off'}`}>
              {masterAligned ? '✓ 对齐' : `${duoState?.master.deviationMinutes ?? 0}分`}
            </span>
          </div>
          <div className="duo-player-row slave-row">
            <span className="duo-role-tag slave-tag">副钟</span>
            <span className="status-value current">{slaveCurrent}</span>
            <span className="status-arrow">→</span>
            <span className="status-value target">{slaveTarget}</span>
            <span className={`duo-align-badge ${slaveAligned ? 'aligned' : 'off'}`}>
              {slaveAligned ? '✓ 对齐' : `${duoState?.slave.deviationMinutes ?? 0}分`}
            </span>
          </div>
          <div className="duo-sync-row">
            <span className="sync-label">同步目标</span>
            <span className="sync-progress">{syncAchieved}/{syncTotal}</span>
            <span className="sync-score">+{duoState?.syncScore ?? 0}</span>
          </div>
        </div>

        <div className="hud-controls">
          <button
            className={`fine-adjust-btn ${fineMaster ? 'active' : ''}`}
            onClick={onToggleFineMaster}
            title="主钟微调切换"
          >
            {fineMaster ? '🔍 主微调' : '⚡ 主粗调'}
          </button>
          <button
            className={`fine-adjust-btn slave-adjust ${fineSlave ? 'active' : ''}`}
            onClick={onToggleFineSlave}
            title="副钟微调切换"
          >
            {fineSlave ? '🔍 副微调' : '⚡ 副粗调'}
          </button>
          <button className="sound-toggle" onClick={onToggleSound}>
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {activeInterferences.length > 0 && (
        <div className="duo-interference-panel">
          <div className="panel-title">活跃干扰</div>
          <div className="interference-list">
            {activeInterferences.map((inf) => (
              <div key={inf.id} className={`interference-card severity-${inf.severity}`}>
                <span className="inf-icon">{inf.icon}</span>
                <span className="inf-name">{inf.displayName}</span>
                <span className={`inf-target ${inf.targetPlayer}`}>
                  {inf.targetPlayer === 'master' ? '主钟' : inf.targetPlayer === 'slave' ? '副钟' : '双钟'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {duoState && duoState.syncTargets.length > 0 && (
        <div className="duo-sync-panel">
          <div className="panel-title">同步目标</div>
          <div className="sync-targets-list">
            {duoState.syncTargets.map((target) => (
              <div
                key={target.id}
                className={`sync-target-card ${target.isAchieved ? 'achieved' : ''}`}
              >
                <span className="sync-target-icon">{target.isAchieved ? '✓' : '○'}</span>
                <span className="sync-target-label">{target.label}</span>
                <span className="sync-target-time">
                  {target.targetTime.hours}:{target.targetTime.minutes.toString().padStart(2, '0')}
                </span>
                <span className="sync-target-bonus">+{target.bonusScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hint-panel duo-hint">
        <div className="hint-title">双人协作校时说明</div>
        <div className="hint-content">
          • 左侧为主钟（玩家一），右侧为副钟（玩家二），点击钟面左半边倒退、右半边推进
          <br />
          • 主钟粗调±30分/微调±5分，副钟粗调±15分/微调±3分
          <br />
          • 双钟共享时间漂移，干扰事件会随机触发并影响操作
          <br />
          • 磁力牵引时操作一方会牵动另一方，需互相配合！
          <br />• 主钟和副钟同时对准目标时刻即可通关
        </div>
      </div>
    </div>
  )
}

export default DuoCoopHUD
