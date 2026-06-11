import type { ShiftNightResult, ShiftRunState } from '../types/continuousShift'
import { SHIFT_RESOURCES } from '../types/continuousShift'

interface ContinuousShiftNightCompleteProps {
  nightResult: ShiftNightResult | null
  runState: ShiftRunState
  onNextNight: () => void
  onOpenShop: () => void
  onExit: () => void
}

function ContinuousShiftNightComplete({
  nightResult,
  runState,
  onNextNight,
  onOpenShop,
  onExit,
}: ContinuousShiftNightCompleteProps) {
  if (!nightResult) {
    return <div className="shift-loading">加载中...</div>
  }

  const isLastNight = runState.currentNightNumber >= runState.totalNights
  const resourceIcons: Record<string, string> = {
    oil: '🛢️',
    coal: '🪨',
    repairKit: '🔧',
    coffee: '☕',
    windCharge: '💨',
  }
  const resourceNames: Record<string, string> = {
    oil: '润滑油',
    coal: '煤炭',
    repairKit: '修理包',
    coffee: '咖啡',
    windCharge: '风之充能',
  }

  return (
    <div className="shift-night-complete">
      <div className="shift-complete-card">
        <div className={`shift-complete-header ${nightResult.success ? 'success' : 'fail'}`}>
          {nightResult.isPerfect
            ? '💯 完美值班！'
            : nightResult.success
            ? '✅ 本夜通过'
            : '❌ 值班失败'}
        </div>

        <h2 className="shift-complete-title">第 {nightResult.nightNumber} 夜 结算</h2>

        <div className="shift-complete-stats">
          <div className="shift-stat-item">
            <span className="stat-label">本夜得分</span>
            <span className="stat-value good">+{nightResult.score}</span>
          </div>
          <div className="shift-stat-item">
            <span className="stat-label">时段完成</span>
            <span className="stat-value">
              {nightResult.periodsCleared}/{nightResult.totalPeriods}
            </span>
          </div>
          <div className="shift-stat-item">
            <span className="stat-label">完美时段</span>
            <span className="stat-value good">💯 {nightResult.perfectPeriods}</span>
          </div>
          <div className="shift-stat-item">
            <span className="stat-label">处理故障</span>
            <span className="stat-value">🔧 {nightResult.faultsHandled}</span>
          </div>
          <div className="shift-stat-item">
            <span className="stat-label">平均偏差</span>
            <span
              className={`stat-value ${
                nightResult.averageDeviation <= 10
                  ? 'good'
                  : nightResult.averageDeviation <= 30
                  ? 'warn'
                  : 'bad'
              }`}
            >
              ±{nightResult.averageDeviation.toFixed(1)}分钟
            </span>
          </div>
          <div className="shift-stat-item">
            <span className="stat-label">耗时</span>
            <span className="stat-value">{Math.ceil(nightResult.duration)}s</span>
          </div>
        </div>

        {nightResult.success && Object.keys(nightResult.resourcesEarned).length > 0 && (
          <div className="shift-complete-rewards">
            <div className="shift-section-title">🎁 获得资源</div>
            <div className="shift-rewards-earned-grid">
              {Object.entries(nightResult.resourcesEarned).map(([key, value]) => (
                <div key={key} className="shift-reward-earned-item">
                  <span className="shift-reward-icon">{resourceIcons[key] || '📦'}</span>
                  <span className="shift-reward-name">{resourceNames[key] || key}</span>
                  <span className="shift-reward-amount positive">+{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="shift-complete-current-stats">
          <div className="shift-current-stat">
            <span>累计总分:</span>
            <strong>🏆 {runState.totalScore}</strong>
          </div>
          <div className="shift-current-stat">
            <span>完美夜数:</span>
            <strong>💯 {runState.perfectNights}</strong>
          </div>
          <div className="shift-current-stat">
            <span>最高夜分:</span>
            <strong>⭐ {runState.bestNightScore}</strong>
          </div>
        </div>

        <div className="shift-complete-resources">
          <div className="shift-section-title">📦 当前资源</div>
          <div className="shift-resources-summary">
            {(Object.keys(SHIFT_RESOURCES) as Array<keyof typeof SHIFT_RESOURCES>).map((key) => (
              <div key={key} className="shift-resource-summary-item">
                <span>{resourceIcons[key]}</span>
                <span>
                  {runState.resources[key]}/{runState.maxResources[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="shift-complete-buttons">
          <button className="shift-shop-btn" onClick={onOpenShop} disabled={!nightResult.success}>
            🏪 资源商店
          </button>
          {!isLastNight && nightResult.success && (
            <button className="shift-next-night-btn" onClick={onNextNight}>
              前往下一夜 →
            </button>
          )}
          {!nightResult.success && (
            <button className="shift-exit-btn" onClick={onExit}>
              返回主菜单
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContinuousShiftNightComplete
