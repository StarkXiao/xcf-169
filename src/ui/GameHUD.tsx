import type {
  WeatherState,
  ActiveGearFault,
  PeriodConfig,
  WorkshopEffects,
  StormState,
  DiaryLevelObjective,
  RepairToolType,
  GearFaultHint,
  DifficultyLevel,
} from '../types'
import { FAULT_DESCRIPTIONS, WEATHER_DESCRIPTIONS } from '../game/NightPatrolSystem'
import { workshopSystem } from '../game/WorkshopSystem'
import { keeperDiarySystem } from '../game/KeeperDiarySystem'
import { REPAIR_TOOLS, DIFFICULTY_CONFIGS } from '../game/DifficultySystem'

interface GameHUDProps {
  timeLeft: number
  totalTime: number
  currentTime: string
  targetTime: string
  soundEnabled: boolean
  onToggleSound: () => void
  isPatrolMode?: boolean
  period?: PeriodConfig | null
  periodIndex?: number
  totalPeriods?: number
  weather?: WeatherState
  faults?: ActiveGearFault[]
  score?: number
  workshopEffects?: WorkshopEffects
  stormState?: StormState | null
  onRollback?: () => void
  stormScoreImpact?: number
  diaryObjective?: DiaryLevelObjective | null
  repairMode?: boolean
  onToggleRepairMode?: () => void
  selectedRepairTool?: RepairToolType | null
  onSelectRepairTool?: (tool: RepairToolType | null) => void
  activeRepairs?: { gearId: number; progress: number; toolType: string }[]
  toolCooldowns?: Record<string, number>
  faultHints?: GearFaultHint[]
  difficulty?: DifficultyLevel
  onDifficultyChange?: (level: DifficultyLevel) => void
  showDifficultySelector?: boolean
}

function GameHUD({
  timeLeft,
  totalTime,
  currentTime,
  targetTime,
  soundEnabled,
  onToggleSound,
  isPatrolMode = false,
  period = null,
  periodIndex = 0,
  totalPeriods = 0,
  weather = { rain: 'calm', wind: 'calm', lightning: 'calm' },
  faults = [],
  score = 0,
  workshopEffects,
  stormState = null,
  onRollback,
  stormScoreImpact = 0,
  diaryObjective,
  repairMode = false,
  onToggleRepairMode,
  selectedRepairTool = null,
  onSelectRepairTool,
  activeRepairs = [],
  toolCooldowns = {},
  faultHints = [],
  difficulty = 'normal',
  onDifficultyChange,
  showDifficultySelector = false,
}: GameHUDProps) {
  const objective = diaryObjective ?? keeperDiarySystem.getCurrentLevelObjective()
  const material = workshopSystem.getCurrentMaterial()
  const activeTools = workshopSystem.getActiveToolConfigs()
  const effects = workshopEffects ?? workshopSystem.getEffects()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatMs = (ms: number) => {
    return Math.ceil(ms / 1000) + 's'
  }

  const getTimerClass = () => {
    const ratio = timeLeft / totalTime
    if (ratio <= 10 / totalTime) return 'danger'
    if (ratio <= 30 / totalTime) return 'warning'
    return ''
  }

  const weatherDesc = isPatrolMode && weather
    ? WEATHER_DESCRIPTIONS[weather.rain]
    : ''

  const getFaultColor = (faultType: string) => {
    switch (faultType) {
      case 'jam': return '#ff6b6b'
      case 'slip': return '#ffa94d'
      case 'reverse': return '#b197fc'
      case 'freeze': return '#74c0fc'
      default: return '#ff6b6b'
    }
  }

  return (
    <div className="ui-overlay">
      <div className="hud-top">
        <div className="timer-panel">
          <div className="timer-label">剩余时间</div>
          <div className={`timer-value ${getTimerClass()}`}>
            {formatTime(timeLeft)}
          </div>
          {isPatrolMode && period && (
            <div className="period-info">
              <span className="period-name">{period.displayName}</span>
              <span className="period-progress">
                {periodIndex + 1}/{totalPeriods}
              </span>
            </div>
          )}
        </div>
        <button className="sound-toggle" onClick={onToggleSound}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <div className="progress-panel">
          <div className="timer-label">当前时刻</div>
          <div className="timer-value" style={{ color: '#e8d5a3' }}>
            {currentTime}
          </div>
          <div className="timer-label" style={{ marginTop: '0.4rem' }}>
            目标时刻
          </div>
          <div className="timer-value" style={{ color: '#7ec97e' }}>
            {targetTime}
          </div>
        </div>
      </div>

      {stormState && stormState.phase !== 'idle' && (
        <div className={`storm-panel storm-${stormState.phase}`}>
          {stormState.phase === 'warning' && (
            <div className="storm-warning-banner">
              <span className="storm-icon">⚠️</span>
              <span className="storm-title">暴雨预警！</span>
              <span className="storm-countdown">{Math.ceil(stormState.warningTimeLeft)}秒后雷击</span>
              <span className="storm-hint">准备使用回滚！</span>
            </div>
          )}
          {stormState.phase === 'active' && (
            <div className="storm-active-banner">
              <span className="storm-icon">⛈️</span>
              <span className="storm-title">暴雨来袭</span>
              <span className="storm-progress">
                雷击 {stormState.strikesThisStorm} 次 · 剩余 {Math.ceil(stormState.activeTimeLeft)}秒
              </span>
              <div className="storm-controls">
                <button
                  className="rollback-btn"
                  onClick={onRollback}
                  disabled={stormState.rollbackCharges <= 0}
                >
                  🔄 回滚雷击 ({stormState.rollbackCharges})
                </button>
              </div>
            </div>
          )}
          {stormState.phase === 'ended' && (
            <div className="storm-ended-banner">
              <span className="storm-icon">🌤️</span>
              <span className="storm-title">暴雨过境</span>
              <span className="storm-summary">
                共 {stormState.totalStrikes} 次雷击
                {stormScoreImpact !== 0 && (
                  <span className={stormScoreImpact >= 0 ? 'score-bonus' : 'score-penalty'}>
                    （{stormScoreImpact >= 0 ? '+' : ''}{stormScoreImpact}分）
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {isPatrolMode && (
        <div className="patrol-status-panel">
          <div className="patrol-status-row">
            <span className="status-label">🌧 天气</span>
            <span className="status-value">{weatherDesc}</span>
          </div>
          {faults.length > 0 && (
            <div className="patrol-status-row faults-row">
              <span className="status-label">⚠ 故障</span>
              <div className="faults-list">
                {faults.map((f, i) => (
                  <span key={i} className={`fault-tag fault-${f.type}`}>
                    #{f.gearId} {FAULT_DESCRIPTIONS[f.type]}
                  </span>
                ))}
              </div>
            </div>
          )}
          {period && (
            <div className="patrol-status-row">
              <span className="status-label">⏱ 时段</span>
              <span className="status-value">{period.clockTime}</span>
              <span className="score-multiplier">×{period.scoreMultiplier}</span>
            </div>
          )}
          <div className="patrol-status-row score-row">
            <span className="status-label">★ 得分</span>
            <span className="status-value score-display">{score}</span>
          </div>
        </div>
      )}

      <div className="workshop-indicator">
        <div className="gear-material-badge" style={{ borderColor: material.visual.glowColor }}>
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
          <div className="tolerance-badge">
            容差 ±{effects.toleranceMinutes}分
          </div>
        )}
      </div>

      {objective && !isPatrolMode && (
        <div className={`diary-objective-panel ${objective.isCompleted ? 'completed' : ''}`}>
          <div className="diary-objective-icon">{objective.icon}</div>
          <div className="diary-objective-info">
            <div className="diary-objective-title">
              {objective.isCompleted ? '✅ ' : '📋 '}{objective.title}
            </div>
            <div className="diary-objective-desc">{objective.description}</div>
            {!objective.isCompleted && typeof objective.progress === 'number' && (objective.target ?? 0) > 1 && (
              <div className="diary-objective-progress">
                <div className="diary-objective-progress-bar">
                  <div
                    className="diary-objective-progress-fill"
                    style={{ width: `${Math.min(100, (objective.progress / (objective.target ?? 1)) * 100)}%` }}
                  />
                </div>
                <span className="diary-objective-progress-text">
                  {objective.progress}/{objective.target}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {showDifficultySelector && (
        <div className="difficulty-selector">
          <div className="difficulty-label">难度</div>
          <div className="difficulty-buttons">
            {DIFFICULTY_CONFIGS.map((d) => (
              <button
                key={d.id}
                className={`difficulty-btn ${difficulty === d.id ? 'active' : ''}`}
                onClick={() => onDifficultyChange?.(d.id)}
                title={d.description}
              >
                {d.displayName}
                <span className="diff-multiplier">×{d.scoreMultiplier}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {faults.length > 0 && (
        <div className="repair-panel">
          <div className="repair-panel-header">
            <span className="repair-title">🔧 检修面板</span>
            <button
              className={`repair-mode-toggle ${repairMode ? 'active' : ''}`}
              onClick={onToggleRepairMode}
            >
              {repairMode ? '取消检修' : '开始检修'}
            </button>
          </div>

          {repairMode && (
            <div className="repair-tools">
              {REPAIR_TOOLS.map((tool) => {
                const cooldown = toolCooldowns[tool.id] ?? 0
                const isOnCooldown = cooldown > 0
                const isSelected = selectedRepairTool === tool.id
                const hasEffectiveFault = faults.some((f) =>
                  tool.effectiveFaults.includes(f.type),
                )

                return (
                  <button
                    key={tool.id}
                    className={`repair-tool-btn ${isSelected ? 'selected' : ''} ${isOnCooldown ? 'cooldown' : ''} ${hasEffectiveFault ? 'effective' : ''}`}
                    onClick={() => {
                      if (!isOnCooldown && hasEffectiveFault) {
                        onSelectRepairTool?.(isSelected ? null : tool.id)
                      }
                    }}
                    disabled={isOnCooldown || !hasEffectiveFault}
                    title={`${tool.displayName}: ${tool.description}`}
                  >
                    <span className="tool-icon">{tool.icon}</span>
                    <span className="tool-name">{tool.displayName}</span>
                    {isOnCooldown && (
                      <span className="tool-cooldown">{formatMs(cooldown)}</span>
                    )}
                    <span className="tool-success-rate">成功率 {Math.round(tool.successRate * 100)}%</span>
                  </button>
                )
              })}
            </div>
          )}

          {repairMode && selectedRepairTool && (
            <div className="repair-hint">
              点击有故障的齿轮进行检修
            </div>
          )}

          {activeRepairs.length > 0 && (
            <div className="active-repairs">
              {activeRepairs.map((repair, i) => (
                <div key={i} className="active-repair-item">
                  <span className="repair-gear">齿轮#{repair.gearId}</span>
                  <div className="repair-progress-bar">
                    <div
                      className="repair-progress-fill"
                      style={{ width: `${repair.progress * 100}%` }}
                    />
                  </div>
                  <span className="repair-percent">
                    {Math.round(repair.progress * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {faultHints.length > 0 && (
        <div className="fault-hints-panel">
          <div className="fault-hints-title">💡 故障提示</div>
          {faultHints.map((hint, i) => (
            <div
              key={i}
              className={`fault-hint-item severity-${hint.severity}`}
              style={{ borderLeftColor: getFaultColor(hint.faultType) }}
            >
              <span className="hint-gear">齿轮#{hint.gearId}</span>
              <span className="hint-text">{hint.hintText}</span>
            </div>
          ))}
        </div>
      )}

      <div className="hint-panel">
        {repairMode
          ? '检修模式：选择工具后点击故障齿轮进行修理。不同工具对不同故障效果不同。'
          : isPatrolMode
          ? '钟楼巡夜：注意齿轮故障状态（卡滞无法转动、反转反向运转、打滑可能失效），按目标时刻校准大钟！'
          : `点击齿轮左半边倒退时间，右半边推进时间 · 大齿轮±${Math.round(60 * effects.efficiencyMultiplier)}分、中齿轮±${Math.round(15 * effects.efficiencyMultiplier)}分、小齿轮±${Math.round(5 * effects.efficiencyMultiplier)}分`}
      </div>
    </div>
  )
}

export default GameHUD
