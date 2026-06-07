import type { WeatherState, ActiveGearFault, PeriodConfig } from '../types'
import { FAULT_DESCRIPTIONS, WEATHER_DESCRIPTIONS } from '../game/NightPatrolSystem'

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
}: GameHUDProps) {
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

      <div className="hint-panel">
        {isPatrolMode
          ? '钟楼巡夜：注意齿轮故障状态（卡滞无法转动、反转反向运转、打滑可能失效），按目标时刻校准大钟！'
          : '点击齿轮左半边倒退时间，右半边推进时间 · 大齿轮±60分、中齿轮±15分、小齿轮±5分'}
      </div>
    </div>
  )
}

export default GameHUD
