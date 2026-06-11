import type {
  ShiftRunState,
  ShiftResourceState,
  ShiftResourceType,
  ActiveShiftEffect,
} from '../types/continuousShift'
import { SHIFT_RESOURCES } from '../types/continuousShift'
import type {
  PeriodConfig,
  WeatherState,
  ActiveGearFault,
  WorkshopEffects,
  StormState,
} from '../types'

interface ContinuousShiftHUDProps {
  runState: ShiftRunState
  timeLeft: number
  totalTime: number
  currentTime: string
  targetTime: string
  soundEnabled: boolean
  onToggleSound: () => void
  period: PeriodConfig | null
  periodIndex: number
  totalPeriods: number
  weather: WeatherState
  faults: ActiveGearFault[]
  score: number
  workshopEffects: WorkshopEffects
  stormState: StormState | null
  onRollback: () => void
  stormScoreImpact: number
  activeEffects: ActiveShiftEffect[]
  onUseResource: (type: ShiftResourceType) => boolean
  onPause: () => void
  resources: ShiftResourceState
}

function getWeatherIcon(intensity: string): string {
  switch (intensity) {
    case 'storm':
      return '⛈️'
    case 'heavy':
      return '🌧️'
    case 'moderate':
      return '🌦️'
    case 'light':
      return '🌤️'
    default:
      return '☀️'
  }
}

function ContinuousShiftHUD({
  runState,
  timeLeft,
  totalTime,
  currentTime,
  targetTime,
  soundEnabled,
  onToggleSound,
  period,
  periodIndex,
  totalPeriods,
  weather,
  faults,
  score,
  workshopEffects,
  stormState,
  onRollback,
  stormScoreImpact,
  activeEffects,
  onUseResource,
  onPause,
  resources,
}: ContinuousShiftHUDProps) {
  const timeRatio = totalTime > 0 ? timeLeft / totalTime : 0
  const toleranceMinutes = 5 + workshopEffects.toleranceMinutes

  return (
    <div className="shift-hud">
      <div className="shift-hud-top">
        <button className="shift-exit-btn" onClick={onPause}>
          ⏸ 暂停
        </button>

        <div className="shift-header-info">
          <h2 className="shift-title">🌙 连续值班挑战 · 第{runState.currentNightNumber}夜</h2>
          <div className="shift-progress-info">
            <span>
              时段 {periodIndex + 1}/{totalPeriods}
            </span>
            <span>·</span>
            <span>
              进度 {runState.currentNightNumber}/{runState.totalNights} 夜
            </span>
            <span>·</span>
            <span>总分 🏆 {runState.totalScore}</span>
          </div>
          {period && (
            <div className="shift-period-display">
              <span className="shift-period-name">{period.displayName}</span>
              <span className="shift-period-time">· {period.clockTime}</span>
              {period.scoreMultiplier > 1 && (
                <span className="shift-score-multiplier">×{period.scoreMultiplier.toFixed(1)}</span>
              )}
            </div>
          )}
        </div>

        <div className="shift-score-display">
          <div className="shift-night-score">本夜得分: {score}</div>
          <button className="shift-sound-btn" onClick={onToggleSound}>
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      <div className="shift-hud-left">
        <div className="shift-timer-section">
          <div className={`shift-timer ${timeLeft <= 10 ? 'danger' : timeLeft <= 30 ? 'warning' : ''}`}>
            ⏱ {Math.ceil(timeLeft)}s
          </div>
          <div className="shift-timer-bar">
            <div
              className="shift-timer-fill"
              style={{
                width: `${timeRatio * 100}%`,
                backgroundColor:
                  timeRatio > 0.5 ? '#4ade80' : timeRatio > 0.25 ? '#fbbf24' : '#ef4444',
              }}
            />
          </div>
        </div>

        <div className="shift-clock-display">
          <div className="shift-clock-target">
            <div className="shift-clock-label">🎯 目标时间</div>
            <div className="shift-clock-value target">{targetTime}</div>
          </div>
          <div className="shift-clock-current">
            <div className="shift-clock-label">🕐 当前时间</div>
            <div className="shift-clock-value">{currentTime}</div>
          </div>
          <div className="shift-tolerance-hint">容差 ±{toleranceMinutes}分钟</div>
        </div>

        <div className="shift-weather-section">
          <div className="shift-section-title">🌤 天气</div>
          <div className="shift-weather-display">
            <span title="降雨">{getWeatherIcon(weather.rain)}</span>
            <span title="风力">{getWeatherIcon(weather.wind)}</span>
            <span title="雷电">{getWeatherIcon(weather.lightning)}</span>
          </div>
          {stormState && stormState.phase !== 'idle' && (
            <div className={`shift-storm-warning ${stormState.phase}`}>
              {stormState.phase === 'warning' &&
                `⚠️ 风暴警告: ${Math.ceil(stormState.warningTimeLeft)}s`}
              {stormState.phase === 'active' &&
                `⛈️ 风暴中: ${Math.ceil(stormState.activeTimeLeft)}s (回溯×${stormState.rollbackCharges})`}
              {stormScoreImpact !== 0 && (
                <span className={stormScoreImpact < 0 ? 'negative' : 'positive'}>
                  {stormScoreImpact > 0 ? '+' : ''}
                  {stormScoreImpact}
                </span>
              )}
            </div>
          )}
          {stormState && stormState.rollbackCharges > 0 && stormState.phase === 'active' && (
            <button className="shift-rollback-btn" onClick={onRollback}>
              ⏪ 时间回溯 ({stormState.rollbackCharges})
            </button>
          )}
        </div>

        {faults.length > 0 && (
          <div className="shift-faults-section">
            <div className="shift-section-title">⚠️ 活跃故障</div>
            <div className="shift-faults-list">
              {faults.map((f, i) => (
                <div key={i} className={`shift-fault-item ${f.type}`}>
                  <span>齿轮 #{f.gearId}</span>
                  <span className="shift-fault-type">
                    {f.type === 'jam' && '🔒 卡住'}
                    {f.type === 'slip' && '💨 打滑'}
                    {f.type === 'reverse' && '🔄 反转'}
                    {f.type === 'freeze' && '❄️ 冻结'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeEffects.length > 0 && (
          <div className="shift-effects-section">
            <div className="shift-section-title">✨ 活跃效果</div>
            <div className="shift-effects-list">
              {activeEffects.map((effect) => {
                const remaining = Math.max(0, Math.ceil((effect.expiresAt - Date.now()) / 1000))
                return (
                  <div key={effect.id} className={`shift-effect-item ${effect.type}`}>
                    <span>{effect.icon} {effect.displayName}</span>
                    <span className="shift-effect-timer">{remaining}s</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="shift-hud-right">
        <div className="shift-resources-section">
          <div className="shift-section-title">📦 资源</div>
          <div className="shift-resources-grid">
            {(Object.keys(SHIFT_RESOURCES) as ShiftResourceType[]).map((type) => {
              const resource = SHIFT_RESOURCES[type]
              const count = resources[type]
              return (
                <button
                  key={type}
                  className={`shift-resource-btn ${count <= 0 ? 'empty' : ''}`}
                  onClick={() => onUseResource(type)}
                  disabled={count <= 0}
                  title={resource.description}
                >
                  <span className="shift-resource-icon">{resource.icon}</span>
                  <span className="shift-resource-name">{resource.displayName}</span>
                  <span className="shift-resource-count">
                    {count}/{runState.maxResources[type]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContinuousShiftHUD
