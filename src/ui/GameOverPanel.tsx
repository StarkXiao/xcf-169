import type { GameResult } from '../types'

interface GameOverPanelProps {
  result: GameResult
  onRestart: () => void
}

function GameOverPanel({ result, onRestart }: GameOverPanelProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="gameover-panel">
      <h1 className={`result-title ${result.success ? 'success' : 'failed'}`}>
        {result.success ? '钟声准时响起！' : '钟声失准了...'}
      </h1>
      <p className="game-subtitle">
        {result.success
          ? '守钟人，时间已校准，钟声回荡在雨夜中'
          : '暴风雨还是打乱了时间的节奏...'}
      </p>
      <div className="result-stats">
        <div className="stat-row">
          <span className="stat-label">最终得分</span>
          <span className="stat-value score-value">{result.score}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">剩余时间</span>
          <span className="stat-value">{formatTime(result.timeLeft)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">评级</span>
          <span className="stat-value" style={{
            color: result.score >= 1500 ? '#ffd700'
              : result.score >= 1000 ? '#c0c0c0'
              : result.score >= 500 ? '#cd7f32'
              : '#8b7d5c'
          }}>
            {result.score >= 1500 ? '⭐ 完美校时'
              : result.score >= 1000 ? '精准校时'
              : result.score >= 500 ? '勉强过关'
              : '下次加油'}
          </span>
        </div>
      </div>
      <button className="restart-btn" onClick={onRestart}>
        再次校时
      </button>
    </div>
  )
}

export default GameOverPanel
