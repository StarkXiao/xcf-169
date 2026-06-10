import { useState, useEffect } from 'react'
import { trainingSystem, TRAINING_BADGES, TRAINING_LEVELS } from '../game/TrainingSystem'
import type { TrainingLesson, TrainingProgress, LessonProgress, TrainingBadge, TrainingLevel } from '../types'

interface TrainingPanelProps {
  onClose: () => void
  onStartLesson: (lesson: TrainingLesson) => void
}

function TrainingPanel({ onClose, onStartLesson }: TrainingPanelProps) {
  const [progress, setProgress] = useState<TrainingProgress>(trainingSystem.getProgress())
  const [currentLevel, setCurrentLevel] = useState<TrainingLevel>(trainingSystem.getCurrentLevel())
  const [lessons, setLessons] = useState<TrainingLesson[]>(trainingSystem.getAllLessons())
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [unlockedBadges, setUnlockedBadges] = useState<TrainingBadge[]>(trainingSystem.getUnlockedBadges())
  const [activeTab, setActiveTab] = useState<'lessons' | 'badges' | 'progress'>('lessons')

  useEffect(() => {
    refreshProgress()
  }, [])

  const refreshProgress = () => {
    setProgress(trainingSystem.getProgress())
    setCurrentLevel(trainingSystem.getCurrentLevel())
    setLessons(trainingSystem.getAllLessons())
    setUnlockedBadges(trainingSystem.getUnlockedBadges())
  }

  const formatScore = (score: number): string => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}万`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  const getDifficultyLabel = (difficulty: string): { label: string; color: string } => {
    const map: Record<string, { label: string; color: string }> = {
      intro: { label: '入门', color: '#7ec97e' },
      beginner: { label: '初级', color: '#87ceeb' },
      intermediate: { label: '中级', color: '#e8c87a' },
      advanced: { label: '高级', color: '#ff9966' },
      master: { label: '大师', color: '#ff6b9d' },
    }
    return map[difficulty] ?? { label: difficulty, color: '#ccc' }
  }

  const getTypeLabel = (type: string): { label: string; icon: string; color: string } => {
    const map: Record<string, { label: string; icon: string; color: string }> = {
      gear_basics: { label: '齿轮基础', icon: '⚙️', color: '#c9a96a' },
      gear_linkage: { label: '齿轮联动', icon: '🔗', color: '#87ceeb' },
      time_conversion: { label: '时间换算', icon: '⏱️', color: '#7ec97e' },
      combined_practice: { label: '综合练习', icon: '🎯', color: '#e8c87a' },
      fault_handling: { label: '故障处理', icon: '🛠️', color: '#ff9966' },
    }
    return map[type] ?? { label: type, icon: '📚', color: '#ccc' }
  }

  const getLessonProgress = (lessonId: string): LessonProgress | undefined => {
    return progress.completedLessons.find((lp) => lp.lessonId === lessonId)
  }

  const renderStars = (stars: number, size = 'md') => {
    const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg'
    return (
      <div className={`stars ${sizeClass}`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= stars ? 'star filled' : 'star empty'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const filteredLessons = selectedFilter === 'all'
    ? lessons
    : lessons.filter((l) => l.type === selectedFilter)

  const totalCompleted = progress.completedLessons.length
  const totalLessons = lessons.length
  const progressPercent = Math.round((totalCompleted / totalLessons) * 100)

  const levelInfo = TRAINING_LEVELS.find((l) => l.level === currentLevel.level) ?? TRAINING_LEVELS[0]
  const nextLevel = TRAINING_LEVELS.find((l) => l.level === currentLevel.level + 1)
  const expForCurrentLevel = levelInfo.expRequired
  const expForNextLevel = nextLevel?.expRequired ?? expForCurrentLevel
  const expProgressInLevel = progress.totalExp - expForCurrentLevel
  const expRangeInLevel = expForNextLevel - expForCurrentLevel
  const levelExpPercent = expRangeInLevel > 0 ? Math.min(100, Math.round((expProgressInLevel / expRangeInLevel) * 100)) : 100

  return (
    <div className="training-panel-overlay">
      <div className="training-panel">
        <div className="training-panel-header">
          <div className="training-panel-title-section">
            <h2 className="training-panel-title">🎓 守钟人训练营</h2>
            <p className="training-panel-subtitle">分步教学 · 齿轮联动 · 时间换算</p>
          </div>
          <button className="training-panel-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="training-panel-level-bar">
          <div className="level-info">
            <span className="level-badge">Lv.{currentLevel.level}</span>
            <span className="level-title">{currentLevel.title}</span>
          </div>
          <div className="exp-bar-container">
            <div className="exp-bar">
              <div
                className="exp-bar-fill"
                style={{ width: `${levelExpPercent}%` }}
              />
            </div>
            <span className="exp-text">
              EXP: {progress.totalExp} {nextLevel && `/ ${nextLevel.expRequired}`}
            </span>
          </div>
          <div className="level-stats">
            <span className="stat">🏆 积分：{formatScore(progress.totalScore)}</span>
            <span className="stat">📚 已完成：{totalCompleted}/{totalLessons}</span>
            <span className="stat">🎖️ 徽章：{unlockedBadges.length}/{TRAINING_BADGES.length}</span>
          </div>
        </div>

        <div className="training-panel-tabs">
          <button
            className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            📖 课程关卡
          </button>
          <button
            className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
          >
            🏅 成长徽章
          </button>
          <button
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📊 学习进度
          </button>
        </div>

        <div className="training-panel-content">
          {activeTab === 'lessons' && (
            <>
              <div className="training-filter-bar">
                <span className="filter-label">筛选：</span>
                <button
                  className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('all')}
                >
                  全部
                </button>
                {['gear_basics', 'gear_linkage', 'time_conversion', 'combined_practice', 'fault_handling'].map(
                  (type) => {
                    const info = getTypeLabel(type)
                    return (
                      <button
                        key={type}
                        className={`filter-btn ${selectedFilter === type ? 'active' : ''}`}
                        onClick={() => setSelectedFilter(type)}
                      >
                        {info.icon} {info.label}
                      </button>
                    )
                  },
                )}
              </div>

              <div className="training-lessons-grid">
                {filteredLessons.map((lesson) => {
                  const isUnlocked = trainingSystem.isLessonUnlocked(lesson.id)
                  const isCompleted = trainingSystem.isLessonCompleted(lesson.id)
                  const lessonProgress = getLessonProgress(lesson.id)
                  const typeInfo = getTypeLabel(lesson.type)
                  const diffInfo = getDifficultyLabel(lesson.difficulty)

                  return (
                    <div
                      key={lesson.id}
                      className={`training-lesson-card ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className="lesson-card-header">
                        <span className="lesson-order">第{lesson.order}课</span>
                        <span
                          className="lesson-type-tag"
                          style={{ backgroundColor: `${typeInfo.color}22`, color: typeInfo.color }}
                        >
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                        <span
                          className="lesson-diff-tag"
                          style={{ backgroundColor: `${diffInfo.color}22`, color: diffInfo.color }}
                        >
                          {diffInfo.label}
                        </span>
                      </div>

                      <h3 className="lesson-card-title">{lesson.title}</h3>
                      <p className="lesson-card-subtitle">{lesson.subtitle}</p>
                      <p className="lesson-card-desc">{lesson.description}</p>

                      <div className="lesson-card-info">
                        <span className="info-item">⏱ {lesson.duration}秒</span>
                        <span className="info-item">🎯 {lesson.steps.length}个步骤</span>
                        <span className="info-item">📈 目标{lesson.targetScore}分</span>
                      </div>

                      {isCompleted && lessonProgress && (
                        <div className="lesson-card-progress">
                          {renderStars(lessonProgress.stars)}
                          <span className="best-score">最高：{lessonProgress.bestScore}分</span>
                          <span className="attempts">尝试：{lessonProgress.attempts}次</span>
                        </div>
                      )}

                      {!isUnlocked && (
                        <div className="lesson-card-lock">
                          <span className="lock-icon">🔒</span>
                          <span className="lock-text">需要 {lesson.unlockScore} 积分解锁</span>
                        </div>
                      )}

                      {isUnlocked && (
                        <button
                          className="lesson-start-btn"
                          onClick={() => onStartLesson(lesson)}
                        >
                          {isCompleted ? '🔄 再次挑战' : '▶️ 开始学习'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {activeTab === 'badges' && (
            <div className="training-badges-section">
              <div className="badges-description">
                完成特定成就即可解锁专属徽章，展示你的守钟人成长历程！
              </div>
              <div className="training-badges-grid">
                {TRAINING_BADGES.map((badge) => {
                  const isUnlocked = progress.badges.includes(badge.id)
                  return (
                    <div
                      key={badge.id}
                      className={`training-badge-card ${!isUnlocked ? 'locked' : ''}`}
                    >
                      <div className="badge-icon">{isUnlocked ? badge.icon : '❓'}</div>
                      <div className="badge-info">
                        <h4 className="badge-name">
                          {isUnlocked ? badge.displayName : '???'}
                        </h4>
                        <p className="badge-desc">
                          {isUnlocked ? badge.description : '完成特定条件解锁'}
                        </p>
                        <p className="badge-condition">
                          条件：{isUnlocked ? badge.condition : '???'}
                        </p>
                      </div>
                      {isUnlocked && <div className="badge-unlocked-tag">已获得</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="training-progress-section">
              <div className="progress-overview-cards">
                <div className="overview-card">
                  <div className="overview-icon">📚</div>
                  <div className="overview-value">{totalCompleted}/{totalLessons}</div>
                  <div className="overview-label">课程完成</div>
                  <div className="overview-bar">
                    <div
                      className="overview-bar-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">⭐</div>
                  <div className="overview-value">
                    {progress.completedLessons.reduce((sum, lp) => sum + lp.stars, 0)}
                    /{totalLessons * 3}
                  </div>
                  <div className="overview-label">获得星数</div>
                  <div className="overview-bar">
                    <div
                      className="overview-bar-fill gold"
                      style={{
                        width: `${Math.round(
                          (progress.completedLessons.reduce((sum, lp) => sum + lp.stars, 0) /
                            (totalLessons * 3)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">🏆</div>
                  <div className="overview-value">{formatScore(progress.totalScore)}</div>
                  <div className="overview-label">累计积分</div>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">🎖️</div>
                  <div className="overview-value">
                    {unlockedBadges.length}/{TRAINING_BADGES.length}
                  </div>
                  <div className="overview-label">徽章收集</div>
                </div>
              </div>

              <div className="progress-detail-section">
                <h3 className="progress-section-title">📋 各课程详细成绩</h3>
                <div className="progress-lesson-list">
                  {lessons.map((lesson) => {
                    const lp = getLessonProgress(lesson.id)
                    const isUnlocked = trainingSystem.isLessonUnlocked(lesson.id)
                    const typeInfo = getTypeLabel(lesson.type)
                    return (
                      <div
                        key={lesson.id}
                        className={`progress-lesson-row ${!isUnlocked ? 'locked' : ''}`}
                      >
                        <div className="lesson-col-order">第{lesson.order}课</div>
                        <div className="lesson-col-name">
                          <span
                            className="mini-type-tag"
                            style={{ color: typeInfo.color }}
                          >
                            {typeInfo.icon}
                          </span>
                          {lesson.title}
                        </div>
                        <div className="lesson-col-stars">
                          {isUnlocked ? renderStars(lp?.stars ?? 0, 'sm') : '🔒'}
                        </div>
                        <div className="lesson-col-score">
                          {lp ? `${lp.bestScore}分` : '--'}
                        </div>
                        <div className="lesson-col-attempts">
                          {lp ? `${lp.attempts}次` : '--'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainingPanel
