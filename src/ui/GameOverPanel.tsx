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
        {result.success ? '守钟人，干得漂亮！' : '暴风雨还是扰乱了时间...'}
      </p>
      <div className="result-stats">
        <div className="stat-row">
          <span className="stat-label">得分</span>
          <span className="stat-value score-value">{result.score}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">齿轮对齐</span>
          <span className="stat-value">{result.gearsAligned} / {result.totalGears}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">剩余时间</span>
          <span className="stat-value">{formatTime(result.timeLeft)}</span>
        </div>
      </div>
      <button className="restart-btn" onClick={onRestart}>
        再次尝试
      </button>
    </div>
  )
}

export default GameOverPanel
