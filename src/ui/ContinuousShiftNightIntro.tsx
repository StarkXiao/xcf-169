import type { ShiftNightConfig, ShiftRunState } from '../types/continuousShift'

interface ContinuousShiftNightIntroProps {
  nightConfig: ShiftNightConfig
  runState: ShiftRunState
  onStart: () => void
}

function ContinuousShiftNightIntro({
  nightConfig,
  runState,
  onStart,
}: ContinuousShiftNightIntroProps) {
  const weatherIcons: Record<string, string> = {
    calm: '☀️',
    light: '🌤️',
    moderate: '🌦️',
    heavy: '🌧️',
    storm: '⛈️',
  }

  return (
    <div className="shift-night-intro">
      <div className="shift-intro-card">
        <div className="shift-intro-header">
          <div className="shift-night-number">第 {nightConfig.nightNumber} 夜</div>
          <div className="shift-night-progress">
            {nightConfig.nightNumber} / {runState.totalNights}
          </div>
        </div>

        <h2 className="shift-intro-title">🌙 {nightConfig.displayName}</h2>
        <p className="shift-intro-desc">{nightConfig.description}</p>

        <div className="shift-intro-stats">
          <div className="shift-stat-row">
            <span>难度倍率:</span>
            <span className="shift-stat-value">×{nightConfig.difficultyMultiplier.toFixed(1)}</span>
          </div>
          <div className="shift-stat-row">
            <span>时段数量:</span>
            <span className="shift-stat-value">{nightConfig.periodCount}</span>
          </div>
          <div className="shift-stat-row">
            <span>天气状况:</span>
            <span className="shift-stat-value">
              {weatherIcons[nightConfig.weatherIntensity] || '☀️'} {nightConfig.weatherIntensity}
            </span>
          </div>
          <div className="shift-stat-row">
            <span>故障范围:</span>
            <span className="shift-stat-value">
              {nightConfig.minFaultCount} - {nightConfig.maxFaultCount}
            </span>
          </div>
          <div className="shift-stat-row">
            <span>目标复杂度:</span>
            <span className="shift-stat-value">
              {nightConfig.targetTimeComplexity === 'simple'
                ? '简单'
                : nightConfig.targetTimeComplexity === 'normal'
                ? '普通'
                : '复杂'}
            </span>
          </div>
        </div>

        <div className="shift-intro-rewards">
          <div className="shift-section-title">🎁 通过奖励</div>
          <div className="shift-rewards-preview">
            {Object.entries(nightConfig.baseResourceReward).map(([key, value]) => {
              const icons: Record<string, string> = {
                oil: '🛢️',
                coal: '🪨',
                repairKit: '🔧',
                coffee: '☕',
                windCharge: '💨',
              }
              const names: Record<string, string> = {
                oil: '润滑油',
                coal: '煤炭',
                repairKit: '修理包',
                coffee: '咖啡',
                windCharge: '风之充能',
              }
              return (
                <div key={key} className="shift-reward-preview-item">
                  <span>{icons[key] || '📦'}</span>
                  <span>{names[key] || key}</span>
                  <span className="shift-reward-amount">+{value}</span>
                </div>
              )
            })}
          </div>
          <div className="shift-perfect-hint">💯 完美通关奖励 ×1.5</div>
        </div>

        <div className="shift-intro-current-stats">
          <div className="shift-current-stats-row">
            <span>累计得分:</span>
            <span className="shift-stat-value highlight">🏆 {runState.totalScore}</span>
          </div>
          <div className="shift-current-stats-row">
            <span>完美夜数:</span>
            <span className="shift-stat-value">💯 {runState.perfectNights}</span>
          </div>
        </div>

        <button className="shift-start-night-btn" onClick={onStart}>
          ⚙️ 开始值班
        </button>
      </div>
    </div>
  )
}

export default ContinuousShiftNightIntro
