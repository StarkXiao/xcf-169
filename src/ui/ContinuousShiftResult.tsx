import type { ShiftGameResult } from '../types/continuousShift'
import { SHIFT_RESOURCES } from '../types/continuousShift'

interface ContinuousShiftResultProps {
  result: ShiftGameResult | null
  onContinue: () => void
  onRestart: () => void
}

function ContinuousShiftResult({ result, onContinue, onRestart }: ContinuousShiftResultProps) {
  if (!result) {
    return <div className="shift-loading">加载中...</div>
  }

  const resourceIcons: Record<string, string> = {
    oil: '🛢️',
    coal: '🪨',
    repairKit: '🔧',
    coffee: '☕',
    windCharge: '💨',
  }

  const getGrade = () => {
    const completionRate = result.nightsCompleted / result.totalNights
    const perfectRate = result.nightsCompleted > 0 ? result.perfectNights / result.nightsCompleted : 0
    const score = result.totalScore

    if (completionRate === 1 && perfectRate >= 0.7 && score >= 20000) {
      return { grade: 'S', color: '#fbbf24', label: '传奇守钟人' }
    }
    if (completionRate >= 0.8 && score >= 15000) {
      return { grade: 'A', color: '#22c55e', label: '优秀守钟人' }
    }
    if (completionRate >= 0.6 && score >= 10000) {
      return { grade: 'B', color: '#3b82f6', label: '合格守钟人' }
    }
    if (completionRate >= 0.4) {
      return { grade: 'C', color: '#a855f7', label: '见习守钟人' }
    }
    return { grade: 'D', color: '#ef4444', label: '新手守钟人' }
  }

  const gradeInfo = getGrade()

  return (
    <div className="shift-result">
      <div className="shift-result-card">
        <div className={`shift-result-header ${result.victory ? 'victory' : 'defeat'}`}>
          {result.victory ? '🏆 连续值班成功！' : '💀 连续值班失败'}
        </div>

        <div className="shift-grade-display" style={{ color: gradeInfo.color }}>
          <div className="shift-grade-letter">{gradeInfo.grade}</div>
          <div className="shift-grade-label">{gradeInfo.label}</div>
        </div>

        <div className="shift-result-stats">
          <div className="shift-stat-row">
            <span>🏆 总分</span>
            <strong>{result.totalScore}</strong>
          </div>
          <div className="shift-stat-row">
            <span>🌙 通过夜数</span>
            <strong>
              {result.nightsCompleted}/{result.totalNights}
            </strong>
          </div>
          <div className="shift-stat-row">
            <span>💯 完美夜数</span>
            <strong>{result.perfectNights}</strong>
          </div>
          <div className="shift-stat-row">
            <span>⭐ 最高夜分</span>
            <strong>{result.bestNightScore}</strong>
          </div>
          <div className="shift-stat-row">
            <span>⚙️ 总时段完成</span>
            <strong>{result.totalPeriodsCleared}</strong>
          </div>
          <div className="shift-stat-row">
            <span>🎯 总完美时段</span>
            <strong>{result.totalPerfectPeriods}</strong>
          </div>
          <div className="shift-stat-row">
            <span>🔧 处理故障</span>
            <strong>{result.totalFaultsHandled}</strong>
          </div>
          <div className="shift-stat-row">
            <span>⏱️ 总耗时</span>
            <strong>{Math.ceil(result.totalDuration)}s</strong>
          </div>
          <div className="shift-stat-row">
            <span>📊 平均偏差</span>
            <strong>±{result.averageDeviation.toFixed(1)}分钟</strong>
          </div>
        </div>

        {result.nightResults.length > 0 && (
          <div className="shift-night-history">
            <div className="shift-section-title">📜 各夜记录</div>
            <div className="shift-night-history-list">
              {result.nightResults.map((night) => (
                <div
                  key={night.nightNumber}
                  className={`shift-night-history-item ${night.success ? 'success' : 'fail'} ${
                    night.isPerfect ? 'perfect' : ''
                  }`}
                >
                  <div className="shift-night-history-number">第{night.nightNumber}夜</div>
                  <div className="shift-night-history-info">
                    <span className={night.success ? 'good' : 'bad'}>
                      {night.isPerfect ? '💯' : night.success ? '✅' : '❌'}
                    </span>
                    <span>得分: {night.score}</span>
                    <span>
                      {night.periodsCleared}/{night.totalPeriods}时段
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="shift-remaining-resources">
          <div className="shift-section-title">📦 剩余资源</div>
          <div className="shift-resources-summary">
            {(Object.keys(SHIFT_RESOURCES) as Array<keyof typeof SHIFT_RESOURCES>).map((key) => (
              <div key={key} className="shift-resource-summary-item">
                <span>{resourceIcons[key]}</span>
                <span>
                  {result.resourcesRemaining[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="shift-result-buttons">
          <button className="shift-restart-btn" onClick={onRestart}>
            🔄 重新挑战
          </button>
          <button className="shift-continue-btn" onClick={onContinue}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContinuousShiftResult
