import type { WeatherState, ActiveGearFault, PeriodConfig, WorkshopEffects, StormState, DiaryLevelObjective } from '../types'
import { FAULT_DESCRIPTIONS, WEATHER_DESCRIPTIONS } from '../game/NightPatrolSystem'
import { workshopSystem } from '../game/WorkshopSystem'
import { keeperDiarySystem } from '../game/KeeperDiarySystem'

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

  const getTimerClass = () => {
    const ratio = timeLeft / totalTime
    if (ratio <= 10 / totalTime) return 'danger'
    if (ratio <= 30 / totalTime) return 'warning'
    return ''
  }

  const weatherDesc = isPatrolMode && weather
    ? WEATHER_DESCRIPTIONS[weather.rain]
    : ''

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

      <div className="hint-panel">
        {isPatrolMode
          ? '钟楼巡夜：注意齿轮故障状态（卡滞无法转动、反转反向运转、打滑可能失效），按目标时刻校准大钟！'
          : `点击齿轮左半边倒退时间，右半边推进时间 · 大齿轮±${Math.round(60 * effects.efficiencyMultiplier)}分、中齿轮±${Math.round(15 * effects.efficiencyMultiplier)}分、小齿轮±${Math.round(5 * effects.efficiencyMultiplier)}分`}
      </div>
    </div>
  )
}

export default GameHUD
