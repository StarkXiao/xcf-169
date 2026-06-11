import type { ShiftRunState } from '../types/continuousShift'

interface ContinuousShiftPauseMenuProps {
  onResume: () => void
  onExit: () => void
  runState: ShiftRunState
}

function ContinuousShiftPauseMenu({ onResume, onExit, runState }: ContinuousShiftPauseMenuProps) {
  return (
    <div className="shift-pause-overlay">
      <div className="shift-pause-card">
        <h2 className="shift-pause-title">⏸ 游戏暂停</h2>

        <div className="shift-pause-info">
          <div className="shift-pause-row">
            <span>当前夜数:</span>
            <strong>
              第{runState.currentNightNumber}夜 / {runState.totalNights}
            </strong>
          </div>
          <div className="shift-pause-row">
            <span>累计得分:</span>
            <strong>🏆 {runState.totalScore}</strong>
          </div>
          <div className="shift-pause-row">
            <span>本夜得分:</span>
            <strong>{runState.currentNight.scoreThisNight}</strong>
          </div>
          <div className="shift-pause-row">
            <span>完美夜数:</span>
            <strong>💯 {runState.perfectNights}</strong>
          </div>
        </div>

        <div className="shift-pause-hint">
          💡 游戏已自动保存，下次可继续进行
        </div>

        <div className="shift-pause-buttons">
          <button className="shift-resume-btn" onClick={onResume}>
            ▶️ 继续游戏
          </button>
          <button className="shift-exit-btn" onClick={onExit}>
            🚪 放弃并退出
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContinuousShiftPauseMenu
