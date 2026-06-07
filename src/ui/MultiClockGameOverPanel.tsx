import type { MultiClockGameResult } from '../types'

interface MultiClockGameOverPanelProps {
  result: MultiClockGameResult
  onRestart: () => void
  onBackToMenu?: () => void
  onOpenWorkshop?: () => void
}

function MultiClockGameOverPanel({
  result,
  onRestart,
  onBackToMenu,
  onOpenWorkshop,
}: MultiClockGameOverPanelProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="gameover-panel">
      <h1 className={`result-title ${result.success ? 'success' : 'failed'}`}>
        {result.success ? '钟阵共鸣！' : '钟阵失准...'}
      </h1>
      <p className="game-subtitle">
        {result.success
          ? '守钟人，主钟与侧塔完美同步，钟声齐鸣响彻四方！'
          : '时间紧迫，各塔钟面未能同步对齐...'}
      </p>

      <div className="result-stats">
        <div className="stat-row">
          <span className="stat-label">最终得分</span>
          <span className="stat-value score-value">{result.score}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">侧塔对齐</span>
          <span
            className="stat-value"
            style={{
              color:
                result.sideTowersAligned === result.totalSideTowers
                  ? '#7ec97e'
                  : '#c9a96a',
            }}
          >
            {result.sideTowersAligned} / {result.totalSideTowers}
          </span>
        </div>

        <div className="stat-row">
          <span className="stat-label">总偏差值</span>
          <span className="stat-value">{result.totalDeviation} 分</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">平均偏差</span>
          <span className="stat-value">{result.averageDeviation} 分</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">剩余时间</span>
          <span className="stat-value">{formatTime(result.timeLeft)}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">关卡</span>
          <span className="stat-value">{result.levelId}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">评级</span>
          <span
            className="stat-value"
            style={{
              color:
                result.score >= 8000
                  ? '#ffd700'
                  : result.score >= 5000
                  ? '#c0c0c0'
                  : result.score >= 2500
                  ? '#cd7f32'
                  : '#8b7d5c',
            }}
          >
            {result.score >= 8000
              ? '⭐⭐⭐ 钟阵大师'
              : result.score >= 5000
              ? '⭐⭐ 精准校时'
              : result.score >= 2500
              ? '⭐ 合格守钟'
              : '继续努力'}
          </span>
        </div>
      </div>

      <div className="multiclock-hint">
        <div className="hint-title">💡 校时技巧</div>
        <div className="hint-content">
          先观察各侧塔的联动比，优先使用主钟粗调，
          接近目标时切换到微调模式，最后用侧塔单独校准处理残余偏差。
          机关激活会增强联动效果，注意利用！
        </div>
      </div>

      <div className="button-row">
        <button className="restart-btn" onClick={onRestart}>
          再次挑战
        </button>
        {onOpenWorkshop && (
          <button className="restart-btn workshop-btn-overlay" onClick={onOpenWorkshop}>
            🔧 升级装备
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

export default MultiClockGameOverPanel
