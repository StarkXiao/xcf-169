import { useState, useEffect } from 'react'
import { trainingSystem } from '../game/TrainingSystem'
import type { TrainingGameResult, TrainingLesson, TrainingReviewData, TrainingBadge, TrainingLevel } from '../types'

interface TrainingReviewPanelProps {
  lesson: TrainingLesson
  result: TrainingGameResult
  onRestart: () => void
  onBackToTraining: () => void
  onNextLesson?: () => void
}

function TrainingReviewPanel({
  lesson, result, onRestart, onBackToTraining, onNextLesson }: TrainingReviewPanelProps) {
  const [reviewData, setReviewData] = useState<TrainingReviewData | null>(null)
  const [newBadges, setNewBadges] = useState<TrainingBadge[]>([])
  const [newLevel, setNewLevel] = useState<TrainingLevel | null>(null)
  const [leveledUp, setLeveledUp] = useState<boolean>(false)
  const [nextLesson, setNextLesson] = useState<TrainingLesson | null>(null)

  useEffect(() => {
    const review = trainingSystem.generateReviewData(lesson, result)
    setReviewData(review)

    const recordResult = trainingSystem.recordGameResult(result)
    setNewBadges(recordResult.newBadges.map((id) => trainingSystem.getBadgeConfig(id)).filter(Boolean) as TrainingBadge[])
    setLeveledUp(recordResult.leveledUp)
    setNewLevel(recordResult.newLevel ?? null)

    const allLessons = trainingSystem.getAllLessons()
    const currentIdx = allLessons.findIndex((l) => l.id === lesson.id)
    if (currentIdx >= 0 && currentIdx < allLessons.length - 1) {
      const next = allLessons[currentIdx + 1]
      if (trainingSystem.isLessonUnlocked(next.id)) {
        setNextLesson(next)
      }
    }
  }, [lesson, result])

  const formatScore = (score: number): string => {
    return score.toString()
  }

  const renderStars = (stars: number) => (
    <div className="review-stars">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= stars ? 'star big filled' : 'star big empty'}>
          ★
        </span>
      ))}
    </div>
  )

  const getAccuracyColor = (rate: number): string => {
    if (rate >= 0.9) return '#7ec97e'
    if (rate >= 0.7) return '#e8c87a'
    return '#ff9966'
  }

  const getTimeColor = (eff: number): string => {
    if (eff >= 0.5) return '#7ec97e'
    if (eff >= 0.3) return '#e8c87a'
    return '#ff9966'
  }

  return (
    <div className="training-review-overlay">
      <div className="training-review-panel">
      <div className="review-header">
        <div className={`review-result-icon ${result.success ? 'success' : 'fail'}`}>
          {result.success ? '🎉' : '😢'}
        </div>
        <h2 className="review-title">
          {result.success ? '课程完成！' : '再接再厉！'}
        </h2>
        <div className="review-lesson-name">{lesson.title}</div>
        {renderStars(result.stars)}
      </div>

      <div className="review-score-section">
        <div className="review-main-score">
          <span className="score-number">{result.score}</span>
          <span className="score-label">总得分</span>
        </div>
        <div className="review-score-target">
          目标分数：{lesson.targetScore}分
        </div>
      </div>

      {leveledUp && newLevel && (
        <div className="review-level-up">
          <div className="level-up-icon">⬆️</div>
          <div className="level-up-text">
            <div className="level-up-title">等级提升！</div>
            <div className="level-up-level">
              Lv.{newLevel.level} {newLevel.title}
            </div>
            <div className="level-up-perks">
              {newLevel.perks.map((perk, idx) => (
                <span key={idx} className="perk-tag">✨ {perk}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {newBadges.length > 0 && (
        <div className="review-new-badges">
          <div className="badges-title">🎖️ 获得新徽章！</div>
          <div className="new-badges-list">
            {newBadges.map((badge) => (
              <div key={badge.id} className="new-badge-item">
                <span className="badge-icon">{badge.icon}</span>
                <div className="badge-info">
                  <div className="badge-name">{badge.displayName}</div>
                  <div className="badge-desc">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewData && (
        <div className="review-stats-grid">
          <div className="review-stat-item">
            <div className="stat-header">
              <span className="stat-icon">🎯</span>
              <span className="stat-label">准确率</span>
            </div>
            <div
              className="stat-value"
              style={{ color: getAccuracyColor(reviewData.accuracyRate)}}
            >
              {Math.round(reviewData.accuracyRate * 100)}%
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill" style={{
                  width: `${reviewData.accuracyRate * 100}%`,
                  backgroundColor: getAccuracyColor(reviewData.accuracyRate),
                }}
              />
            </div>
          </div>

          <div className="review-stat-item">
            <div className="stat-header">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">时间效率</span>
            </div>
            <div
              className="stat-value"
              style={{ color: getTimeColor(reviewData.timeEfficiency) }}
            >
              {Math.round(reviewData.timeEfficiency * 100)}%
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${reviewData.timeEfficiency * 100}%`,
                  backgroundColor: getTimeColor(reviewData.timeEfficiency),
                }}
              />
            </div>
          </div>

          <div className="review-stat-item">
            <div className="stat-header">
              <span className="stat-icon">📝</span>
              <span className="stat-label">操作失误</span>
            </div>
            <div className={`stat-value ${result.mistakes === 0 ? 'good' : 'bad'}`}>
              {result.mistakes}次
            </div>
          </div>

          <div className="review-stat-item">
            <div className="stat-header">
              <span className="stat-icon">💡</span>
              <span className="stat-label">使用提示</span>
            </div>
            <div className={`stat-value ${result.hintsUsed === 0 ? 'good' : 'warn'}`}>
              {result.hintsUsed}次
            </div>
          </div>

          <div className="review-stat-item">
            <div className="stat-header">
              <span className="stat-icon">📚</span>
              <span className="stat-label">完成步骤</span>
            </div>
            <div className="stat-value">
              {result.stepsCompleted}/{result.totalSteps}
            </div>
          </div>

          <div className="review-stat-item">
            <div className="stat-header">
              <span className="stat-icon">⚙️</span>
              <span className="stat-label">总操作数</span>
            </div>
            <div className="stat-value">{result.actionsRecord.length}次</div>
          </div>
        </div>
      )}

      {reviewData && (
        <div className="review-feedback">
          {reviewData.strengths.length > 0 && (
          <div className="feedback-section strengths">
            <div className="feedback-title">✅ 做得好的地方：</div>
            <ul className="feedback-list">
              {reviewData.strengths.map((s, idx) => (
                <li key={idx} className="feedback-item good">{s}</li>
              ))}
            </ul>
          </div>
          )}

          {reviewData.weaknesses.length > 0 && (
            <div className="feedback-section weaknesses">
              <div className="feedback-title">⚠️ 需要改进：</div>
              <ul className="feedback-list">
                {reviewData.weaknesses.map((w, idx) => (
                  <li key={idx} className="feedback-item warn">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {reviewData.suggestions.length > 0 && (
            <div className="feedback-section suggestions">
              <div className="feedback-title">💡 学习建议：</div>
              <ul className="feedback-list">
                {reviewData.suggestions.map((s, idx) => (
                  <li key={idx} className="feedback-item">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {lesson.rewards && (
        <div className="review-rewards">
          <div className="rewards-title">🎁 本次奖励</div>
          <div className="rewards-list">
            <span className="reward-tag">🏆 +{formatScore(lesson.rewards.score)} 积分</span>
            <span className="reward-tag">✨ +{lesson.rewards.exp} 经验</span>
            {lesson.rewards.unlocks && lesson.rewards.unlocks.length > 0 && (
              <span className="reward-tag">🔓 解锁新课程</span>
            )}
          </div>
        </div>
      )}

      <div className="review-actions">
        <button className="review-btn secondary" onClick={onBackToTraining}>
          📖 返回课程
        </button>
        <button className="review-btn primary" onClick={onRestart}>
          🔄 再来一次
        </button>
        {nextLesson && onNextLesson && (
          <button className="review-btn success" onClick={onNextLesson}>
            ▶️ 下一课：{nextLesson.title}
          </button>
        )}
      </div>
    </div>
    </div>
  )
}

export default TrainingReviewPanel
