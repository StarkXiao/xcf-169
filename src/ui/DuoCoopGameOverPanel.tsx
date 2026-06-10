import type { DuoCoopGameResult } from '../types'

interface DuoCoopGameOverPanelProps {
  result: DuoCoopGameResult
  onRestart: () => void
  onBackToMenu?: () => void
}

function DuoCoopGameOverPanel({
  result,
  onRestart,
  onBackToMenu,
}: DuoCoopGameOverPanelProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="gameover-panel">
      <h1 className={`result-title ${result.success ? 'success' : 'failed'}`}>
        {result.success ? '双钟共鸣！' : '双钟失准...'}
      </h1>
      <p className="game-subtitle">
        {result.success
          ? '守钟人，主钟与副钟完美同步，钟声齐鸣响彻夜空！'
          : '时间紧迫，主钟与副钟未能同步对齐...'}
      </p>

      <div className="result-stats">
        <div className="stat-row">
          <span className="stat-label">最终得分</span>
          <span className="stat-value score-value">{result.score}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">主钟偏差</span>
          <span className="stat-value" style={{ color: result.masterDeviation <= 5 ? '#7ec97e' : '#ff8888' }}>
            {result.masterDeviation} 分
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">副钟偏差</span>
          <span className="stat-value" style={{ color: result.slaveDeviation <= 5 ? '#7ec97e' : '#ff8888' }}>
            {result.slaveDeviation} 分
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">同步目标</span>
          <span className="stat-value" style={{ color: result.syncTargetsAchieved === result.syncTargetsTotal ? '#7ec97e' : '#c9a96a' }}>
            {result.syncTargetsAchieved} / {result.syncTargetsTotal}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">协作加成</span>
          <span className="stat-value" style={{ color: '#8abbbb' }}>
            +{result.cooperationBonus}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">总偏差</span>
          <span className="stat-value">{result.totalDeviation} 分</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">剩余时间</span>
          <span className="stat-value">{formatTime(result.timeLeft)}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">评级</span>
          <span
            className="stat-value"
            style={{
              color:
                result.score >= 10000
                  ? '#ffd700'
                  : result.score >= 6000
                  ? '#c0c0c0'
                  : result.score >= 3000
                  ? '#cd7f32'
                  : '#8b7d5c',
            }}
          >
            {result.score >= 10000
              ? '⭐⭐⭐ 双钟大师'
              : result.score >= 6000
              ? '⭐⭐ 默契配合'
              : result.score >= 3000
              ? '⭐ 合格搭档'
              : '继续磨合'}
          </span>
        </div>
      </div>

      <div className="multiclock-hint duo-hint-box">
        <div className="hint-title">💡 协作技巧</div>
        <div className="hint-content">
          磁力牵引时双方操作会互相影响，建议一人先调整到位后另一人再精调。
          迷雾遮蔽时记住目标时刻，弹回冲击时注意操作方向可能反转。
          同步目标达成可获得额外加分！
        </div>
      </div>

      <div className="button-row">
        <button className="restart-btn" onClick={onRestart}>
          再次挑战
        </button>
        {onBackToMenu && (
          <button className="restart-btn menu-btn" onClick={onBackToMenu}>
            返回主菜单
          </button>
        )}
      </div>
    </div>
  )
}

export default DuoCoopGameOverPanel
