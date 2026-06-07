import type { GameMode } from '../types'
import { workshopSystem } from '../game/WorkshopSystem'

interface StartScreenProps {
  onStart: (mode: GameMode) => void
  onOpenWorkshop: () => void
}

function StartScreen({ onStart, onOpenWorkshop }: StartScreenProps) {
  const totalScore = workshopSystem.getTotalScoreEarned()
  const currentMaterial = workshopSystem.getCurrentMaterial()

  const formatScore = (score: number) => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}万`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  return (
    <div className="start-screen">
      <h1 className="game-title">旧钟楼校时员</h1>
      <p className="game-subtitle">Clock Tower Timekeeper</p>

      <div className="workshop-entry">
        <div className="workshop-entry-info">
          <span className="workshop-score">累计积分：{formatScore(totalScore)}</span>
          <span
            className="workshop-material-tag"
            style={{ borderColor: currentMaterial.visual.glowColor, color: currentMaterial.visual.glowColor }}
          >
            ⚙️ {currentMaterial.displayName}
          </span>
        </div>
        <button className="start-btn workshop-btn" onClick={onOpenWorkshop}>
          🔧 钟表工坊
        </button>
      </div>

      <p className="story-text">
        暴雨夜，古老钟楼的齿轮错乱，时针分针停摆。<br />
        作为守钟人，你必须转动齿轮，<br />
        将钟面校准到目标时刻，让钟声按时响起。<br /><br />
        <span style={{ color: '#c9a96a' }}>
          🟠 大齿轮：±60分钟 &nbsp; 🔵 中齿轮：±15分钟 &nbsp; 🟢 小齿轮：±5分钟
        </span><br />
        <span style={{ color: '#a09070', fontSize: '0.9em' }}>
          点击齿轮左半边倒退，右半边推进。注意联动齿轮反向转动！
        </span>
      </p>
      <div className="mode-selection">
        <button className="start-btn mode-btn" onClick={() => onStart('classic')}>
          <div className="mode-title">经典校时</div>
          <div className="mode-desc">单次校准 · 120秒</div>
        </button>
        <button className="start-btn mode-btn patrol-btn" onClick={() => onStart('patrol')}>
          <div className="mode-title">钟楼巡夜</div>
          <div className="mode-desc">
            黄昏→黎明 4个时段<br />
            天气变化 · 齿轮故障 · 多重挑战
          </div>
        </button>
        <button className="start-btn mode-btn multiclock-btn" onClick={() => onStart('multiclock')}>
          <div className="mode-title">多钟面连锁</div>
          <div className="mode-desc">
            主钟+侧塔联动校准<br />
            指针偏差 · 机关联动 · 限时目标
          </div>
        </button>
      </div>
      <div className="patrol-hint">
        <div className="patrol-hint-title">🌙 钟楼巡夜规则：</div>
        <div className="patrol-hint-list">
          <span>🌆 黄昏</span>
          <span>🌙 初夜</span>
          <span>🌑 深夜</span>
          <span>🌅 黎明</span>
        </div>
        <div className="patrol-hint-desc">
          每个时段天气与故障不同，难度递增，得分倍率越高！
        </div>
      </div>
    </div>
  )
}

export default StartScreen
