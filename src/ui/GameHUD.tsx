interface GameHUDProps {
  timeLeft: number
  totalTime: number
  currentTime: string
  targetTime: string
  soundEnabled: boolean
  onToggleSound: () => void
}

function GameHUD({
  timeLeft,
  totalTime,
  currentTime,
  targetTime,
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
          <div className="timer-label">当前时刻</div>
          <div className="timer-value" style={{ color: '#e8d5a3' }}>
            {currentTime}
          </div>
          <div className="timer-label" style={{ marginTop: '0.4rem' }}>
            目标时刻
          </div>
          <div className="timer-value" style={{ color: '#7ec97e' }}>
            {targetTime}
          </div>
        </div>
      </div>
      <div className="hint-panel">
        点击齿轮左半边倒退时间，右半边推进时间 · 大齿轮±60分、中齿轮±15分、小齿轮±5分
      </div>
    </div>
  )
}

export default GameHUD
