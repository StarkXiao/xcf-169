import type { GameResult } from '../types'

interface GameOverPanelProps {
  result: GameResult
  onRestart: () => void
  onBackToMenu?: () => void
  onOpenWorkshop?: () => void
  onOpenBellChime?: () => void
}

function GameOverPanel({ result, onRestart, onBackToMenu, onOpenWorkshop, onOpenBellChime }: GameOverPanelProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isPatrol = !!result.isPatrolMode

  return (
    <div className="gameover-panel">
      <h1 className={`result-title ${result.success ? 'success' : 'failed'}`}>
        {isPatrol
          ? result.success
            ? '巡夜圆满完成！'
            : '巡夜中断...'
          : result.success
            ? '钟声准时响起！'
            : '钟声失准了...'}
      </h1>
      <p className="game-subtitle">
        {isPatrol
          ? result.success
            ? `守钟人，你成功穿越了${result.periodsCleared}/${result.totalPeriods}个巡夜时段！`
            : `暴风雨太猛烈了...你完成了${result.periodsCleared}/${result.totalPeriods}个时段`
          : result.success
            ? '守钟人，时间已校准，钟声回荡在雨夜中'
            : '暴风雨还是打乱了时间的节奏...'}
      </p>
      <div className="result-stats">
        <div className="stat-row">
          <span className="stat-label">最终得分</span>
          <span className="stat-value score-value">{result.score}</span>
        </div>
        {isPatrol && result.patrolScoreBreakdown && (
          <>
            <div className="stat-row breakdown-row">
              <span className="stat-label">  基础分</span>
              <span className="stat-value">{result.patrolScoreBreakdown.baseScore}</span>
            </div>
            <div className="stat-row breakdown-row">
              <span className="stat-label">  精准奖励</span>
              <span className="stat-value" style={{ color: '#7ec97e' }}>
                +{result.patrolScoreBreakdown.accuracyBonus}
              </span>
            </div>
            <div className="stat-row breakdown-row">
              <span className="stat-label">  时间奖励</span>
              <span className="stat-value" style={{ color: '#7ec97e' }}>
                +{result.patrolScoreBreakdown.timeBonus}
              </span>
            </div>
            <div className="stat-row breakdown-row">
              <span className="stat-label">  时段奖励</span>
              <span className="stat-value" style={{ color: '#c9a96a' }}>
                +{result.patrolScoreBreakdown.periodBonus}
              </span>
            </div>
            {result.patrolScoreBreakdown.faultPenalty > 0 && (
              <div className="stat-row breakdown-row">
                <span className="stat-label">  故障扣减</span>
                <span className="stat-value" style={{ color: '#e85a5a' }}>
                  -{result.patrolScoreBreakdown.faultPenalty}
                </span>
              </div>
            )}
          </>
        )}
        <div className="stat-row">
          <span className="stat-label">剩余时间</span>
          <span className="stat-value">{formatTime(result.timeLeft)}</span>
        </div>
        {isPatrol && (
          <div className="stat-row">
            <span className="stat-label">完成时段</span>
            <span className="stat-value">
              {result.periodsCleared} / {result.totalPeriods}
            </span>
          </div>
        )}
        <div className="stat-row">
          <span className="stat-label">评级</span>
          <span className="stat-value" style={{
            color: result.score >= 3000 ? '#ffd700'
              : result.score >= 2000 ? '#c0c0c0'
              : result.score >= 1000 ? '#cd7f32'
              : '#8b7d5c'
          }}>
            {result.score >= 3000
              ? (isPatrol ? '⭐⭐⭐ 传奇守钟人' : '⭐ 完美校时')
              : result.score >= 2000
                ? (isPatrol ? '⭐⭐ 资深守钟人' : '精准校时')
                : result.score >= 1000
                  ? (isPatrol ? '⭐ 合格守钟人' : '勉强过关')
                  : (isPatrol ? '见习守钟人' : '下次加油')}
          </span>
        </div>
      </div>
      <div className="button-row">
        <button className="restart-btn" onClick={onRestart}>
          {isPatrol ? '再次巡夜' : '再次校时'}
        </button>
        {onOpenWorkshop && (
          <button className="restart-btn workshop-btn-overlay" onClick={onOpenWorkshop}>
            🔧 升级装备
          </button>
        )}
        {onOpenBellChime && (
          <button className="restart-btn bellchime-btn-overlay" onClick={onOpenBellChime}>
            🔔 钟声谱面
          </button>
        )}
        {onBackToMenu && (
          <button className="restart-btn menu-btn" onClick={onBackToMenu}>
            返回主菜单
          </button>
        )}
      </div>
    </div>
  )
}

export default GameOverPanel
