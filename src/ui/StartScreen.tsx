import type { GameMode } from '../types'
import { workshopSystem } from '../game/WorkshopSystem'
import { keeperDiarySystem } from '../game/KeeperDiarySystem'
import { achievementSystem } from '../game/AchievementSystem'
import { clocktowerRecordSystem } from '../game/ClocktowerRecordSystem'
import { useState, useEffect } from 'react'

interface StartScreenProps {
  onStart: (mode: GameMode) => void
  onOpenWorkshop: () => void
  onOpenBellChime: () => void
  onOpenEditor: () => void
  onImportLevel?: () => void
  onOpenAdmin?: () => void
  onOpenTraining: () => void
  onStartRoguelike: () => void
  onStartDuoCoop: () => void
  onStartMuseum: () => void
  onOpenLevelShare: () => void
  onOpenFestival: () => void
  onOpenKeeperDiary: () => void
  onOpenLedger: () => void
  onOpenAchievements: () => void
  onStartContinuousShift: () => void
  onContinueContinuousShift: () => void
  hasSavedShiftGame: boolean
}

function StartScreen({ onStart, onOpenWorkshop, onOpenBellChime, onOpenEditor, onImportLevel, onOpenAdmin, onOpenTraining, onStartRoguelike, onStartDuoCoop, onStartMuseum, onOpenLevelShare, onOpenFestival, onOpenKeeperDiary, onOpenLedger, onOpenAchievements, onStartContinuousShift, onContinueContinuousShift, hasSavedShiftGame }: StartScreenProps) {
  const totalScore = workshopSystem.getTotalScoreEarned()
  const currentMaterial = workshopSystem.getCurrentMaterial()
  const [diaryNewCount, setDiaryNewCount] = useState(0)
  const [achievementNewCount, setAchievementNewCount] = useState(0)
  const [recordCount, setRecordCount] = useState(0)

  useEffect(() => {
    const newEntries = keeperDiarySystem.getNewEntries()
    setDiaryNewCount(newEntries.length)
    
    const achievementProgress = achievementSystem.getAchievementProgress()
    const bellProgress = achievementSystem.getBellCollectionProgress()
    setAchievementNewCount(achievementProgress.unlocked + bellProgress.collected)
    
    const stats = clocktowerRecordSystem.getStatsSummary()
    setRecordCount(stats.totalGamesPlayed)
  }, [])

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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="start-btn workshop-btn" onClick={onOpenWorkshop}>
            🔧 钟表工坊
          </button>
          <button className="start-btn workshop-btn bellchime-entry-btn" onClick={onOpenBellChime}>
            🔔 钟声谱面
          </button>
        </div>
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
        <button className="start-btn mode-btn museum-btn" onClick={onStartMuseum} style={{
          background: 'linear-gradient(180deg, #3d2817 0%, #2a1c0f 100%)',
          borderColor: '#c9a96a',
          color: '#f0dca8',
          boxShadow: '0 0 20px rgba(201, 169, 106, 0.3)',
        }}>
          <div className="mode-title">🏛️ 钟楼博物馆·叙事</div>
          <div className="mode-desc">
            5章剧情 · 角色对话 · 分支选择<br />
            机关解谜 · 探索收集 · 6种结局
          </div>
        </button>
        <button className="start-btn mode-btn training-btn" onClick={onOpenTraining}>
          <div className="mode-title">🎓 守钟人训练营</div>
          <div className="mode-desc">
            分步教学 · 齿轮联动<br />
            时间换算 · 课程关卡 · 成长解锁
          </div>
        </button>
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
        <button className="start-btn mode-btn roguelike-btn" onClick={onStartRoguelike} style={{
          background: 'linear-gradient(180deg, #3d2250 0%, #2a1840 100%)',
          borderColor: '#8b55aa',
          color: '#e0c0f8',
        }}>
          <div className="mode-title">🗡️ 钟楼巡检·肉鸽</div>
          <div className="mode-desc">
            随机地图 · 机关组合<br />
            天气事件 · 奖励树 · 爬塔结算
          </div>
        </button>
        <button className="start-btn mode-btn duocoop-btn" onClick={onStartDuoCoop} style={{
          background: 'linear-gradient(180deg, #1a3d3d 0%, #0f2a2a 100%)',
          borderColor: '#5a8a8a',
          color: '#8abbbb',
        }}>
          <div className="mode-title">👥 双人协作校时</div>
          <div className="mode-desc">
            主钟+副钟双操控<br />
            共享漂移 · 干扰事件 · 同步目标
          </div>
        </button>
        <button className="start-btn mode-btn continuous-shift-btn" onClick={hasSavedShiftGame ? onContinueContinuousShift : onStartContinuousShift} style={{
          background: 'linear-gradient(180deg, #3d1a2a 0%, #2a0f1a 100%)',
          borderColor: '#c77d8f',
          color: '#e8b8c4',
        }}>
          <div className="mode-title">🌙 连续值班挑战</div>
          <div className="mode-desc">
            {hasSavedShiftGame ? '继续未完成的值班<br />' : '跨多夜维持钟楼运转<br />'}
            资源管理 · 难度递进 · 暂停保存
          </div>
        </button>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="editor-entry-btn" onClick={onOpenEditor}>
          ✏️ 关卡编辑器
        </button>
        <button className="editor-entry-btn" onClick={onOpenLevelShare} style={{ backgroundColor: '#1a2a3a', borderColor: '#5a7a9a' }}>
          🏛️ 关卡广场
        </button>
        <button className="editor-entry-btn festival-entry-btn" onClick={onOpenFestival}>
          🎊 节庆活动
        </button>
        <button
          className="editor-entry-btn keeper-diary-entry-btn"
          onClick={onOpenKeeperDiary}
          style={{
            backgroundColor: '#2a1f0a',
            borderColor: '#c9a96a',
            position: 'relative',
          }}
        >
          📖 守钟人日记
          {diaryNewCount > 0 && (
            <span className="diary-notification-badge">{diaryNewCount}</span>
          )}
        </button>
        <button
          className="editor-entry-btn ledger-entry-btn"
          onClick={onOpenLedger}
          style={{
            backgroundColor: '#1a2a1a',
            borderColor: '#7ab87a',
            position: 'relative',
          }}
        >
          📜 钟楼名册
          {recordCount > 0 && (
            <span className="ledger-notification-badge">{recordCount}</span>
          )}
        </button>
        <button
          className="editor-entry-btn achievement-entry-btn"
          onClick={onOpenAchievements}
          style={{
            backgroundColor: '#2a1a2a',
            borderColor: '#c77dbb',
            position: 'relative',
          }}
        >
          🏆 成就簿
          {achievementNewCount > 0 && (
            <span className="achievement-notification-badge">{achievementNewCount}</span>
          )}
        </button>
        {onImportLevel && (
          <button className="editor-entry-btn" onClick={onImportLevel} style={{ backgroundColor: '#1a3a2a', borderColor: '#3d7a5a' }}>
            📂 导入关卡JSON
          </button>
        )}
        {onOpenAdmin && (
          <button className="editor-entry-btn" onClick={onOpenAdmin} style={{ backgroundColor: '#2a1a3a', borderColor: '#6a3d9a' }}>
            ⚙️ 运维后台
          </button>
        )}
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
