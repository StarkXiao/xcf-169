interface GameHUDProps {
  timeLeft: number
  totalTime: number
  alignedCount: number
  totalGears: number
  soundEnabled: boolean
  onToggleSound: () => void
}

function GameHUD({
  timeLeft,
  totalTime,
  alignedCount,
  totalGears,
  soundEnabled,
  onToggleSound,
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

  return (
    <div className="ui-overlay">
      <div className="hud-top">
        <div className="timer-panel">
          <div className="timer-label">剩余时间</div>
          <div className={`timer-value ${getTimerClass()}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <button className="sound-toggle" onClick={onToggleSound}>
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <div className="progress-panel">
          <div className="progress-label">齿轮对齐</div>
          <div className="progress-value">{alignedCount}/{totalGears}</div>
        </div>
      </div>
      <div className="hint-panel">
        点击齿轮左半边逆时针旋转，右半边顺时针旋转 · 联动齿轮反向转动
      </div>
    </div>
  )
}

export default GameHUD
