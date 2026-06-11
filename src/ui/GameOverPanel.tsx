import type { GameResult } from '../types'
import { useState, useEffect } from 'react'
import { keeperDiarySystem } from '../game/KeeperDiarySystem'
import type { DiaryEntry } from '../types'

interface GameOverPanelProps {
  result: GameResult
  onRestart: () => void
  onBackToMenu?: () => void
  onOpenWorkshop?: () => void
  onOpenBellChime?: () => void
  onOpenKeeperDiary?: () => void
}

function GameOverPanel({ result, onRestart, onBackToMenu, onOpenWorkshop, onOpenBellChime, onOpenKeeperDiary }: GameOverPanelProps) {
  const [newlyUnlockedDiaries, setNewlyUnlockedDiaries] = useState<DiaryEntry[]>([])

  useEffect(() => {
    const diaries = keeperDiarySystem.getNewEntries()
    setNewlyUnlockedDiaries(diaries.slice(0, 3))
  }, [result])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isPatrol = !!result.isPatrolMode
  const isPerfect = result.score >= 2500
  const currentChapter = keeperDiarySystem.getCurrentDiaryChapter()
  const settlementText = keeperDiarySystem.getSettlementText(currentChapter?.id || null)

  const getResultTitle = () => {
    if (isPatrol) {
      return result.success ? '巡夜圆满完成！' : '巡夜中断...'
    }
    if (result.success && isPerfect && settlementText.perfect) {
      return settlementText.perfect.title
    }
    if (result.success && settlementText.success) {
      return settlementText.success.title
    }
    if (!result.success && settlementText.fail) {
      return settlementText.fail.title
    }
    return result.success ? '钟声准时响起！' : '钟声失准了...'
  }

  const getResultSubtitle = () => {
    if (isPatrol) {
      return result.success
        ? `守钟人，你成功穿越了${result.periodsCleared}/${result.totalPeriods}个巡夜时段！`
        : `暴风雨太猛烈了...你完成了${result.periodsCleared}/${result.totalPeriods}个时段`
    }
    if (result.success && isPerfect && settlementText.perfect) {
      return settlementText.perfect.subtitle
    }
    if (result.success && settlementText.success) {
      return settlementText.success.subtitle
    }
    if (!result.success && settlementText.fail) {
      return settlementText.fail.subtitle
    }
    return result.success
      ? '守钟人，时间已校准，钟声回荡在雨夜中'
      : '暴风雨还是打乱了时间的节奏...'
  }

  const getResultDescription = () => {
    if (isPatrol) return null
    if (result.success && isPerfect && settlementText.perfect) {
      return settlementText.perfect.description
    }
    if (result.success && settlementText.success) {
      return settlementText.success.description
    }
    if (!result.success && settlementText.fail) {
      return settlementText.fail.description
    }
    return null
  }

  const description = getResultDescription()

  return (
    <div className="gameover-panel">
      <h1 className={`result-title ${result.success ? 'success' : 'failed'}`}>
        {getResultTitle()}
      </h1>
      <p className="game-subtitle">
        {getResultSubtitle()}
      </p>
      {description && (
        <p className="game-description-diary">
          {description}
        </p>
      )}
      {currentChapter && !isPatrol && (
        <div className="diary-chapter-indicator">
          <span className="chapter-icon">{currentChapter.icon}</span>
          <span className="chapter-label">当前章节：第{currentChapter.order}章 · {currentChapter.title}</span>
        </div>
      )}
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

      {newlyUnlockedDiaries.length > 0 && (
        <div className="diary-unlock-section">
          <div className="diary-unlock-title">📖 守钟人日记 · 新的记忆浮现</div>
          {newlyUnlockedDiaries.map((entry) => (
            <div key={entry.id} className="diary-unlock-item">
              <span className="diary-unlock-icon">{entry.icon}</span>
              <div className="diary-unlock-info">
                <div className="diary-unlock-name">{entry.title}</div>
                <div className="diary-unlock-subtitle">{entry.subtitle}</div>
              </div>
            </div>
          ))}
          {onOpenKeeperDiary && (
            <button className="diary-unlock-button" onClick={onOpenKeeperDiary}>
              查看日记 →
            </button>
          )}
        </div>
      )}

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
