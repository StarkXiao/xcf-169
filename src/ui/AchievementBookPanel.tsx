import { useState, useMemo } from 'react'
import { achievementSystem } from '../game/AchievementSystem'
import type { Achievement, AchievementCategory, AchievementRarity, SpecialBell } from '../types'

interface AchievementBookPanelProps {
  onClose: () => void
}

type TabType = 'achievements' | 'specialBells'

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  score: '得分',
  speed: '速度',
  accuracy: '精准',
  combo: '连击',
  endurance: '耐力',
  collection: '收集',
  special: '特殊',
  story: '剧情',
}

const RARITY_NAMES: Record<AchievementRarity, string> = {
  common: '普通',
  uncommon: '稀有',
  rare: '精良',
  epic: '史诗',
  legendary: '传说',
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
}

function AchievementBookPanel({ onClose }: AchievementBookPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('achievements')
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<AchievementRarity | 'all'>('all')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [selectedBell, setSelectedBell] = useState<SpecialBell | null>(null)

  const achievementProgress = useMemo(() => achievementSystem.getAchievementProgress(), [])
  const bellProgress = useMemo(() => achievementSystem.getBellCollectionProgress(), [])

  const allAchievements = useMemo(() => {
    let achievements = achievementSystem.getAllAchievements()
    
    if (categoryFilter !== 'all') {
      achievements = achievements.filter((a) => a.category === categoryFilter)
    }
    
    if (rarityFilter !== 'all') {
      achievements = achievements.filter((a) => a.rarity === rarityFilter)
    }
    
    return achievements
  }, [categoryFilter, rarityFilter])

  const specialBells = useMemo(() => achievementSystem.getSpecialBells(), [])

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '--'
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getProgressPercentage = (achievement: Achievement): number => {
    if (achievement.isUnlocked) return 100
    if (!achievement.targetValue || !achievement.currentValue) return 0
    return Math.min(100, (achievement.currentValue / achievement.targetValue) * 100)
  }

  const formatValue = (achievement: Achievement): string => {
    const current = achievement.currentValue ?? 0
    const target = achievement.targetValue ?? 0
    
    if (achievement.id.startsWith('speed_') || achievement.id === 'accuracy_perfect') {
      if (achievement.isUnlocked) {
        return `${current.toFixed(0)}秒/分`
      }
      return `${current === Infinity ? '--' : current.toFixed(0)} / ${target}`
    }
    
    if (target > 1000) {
      return `${Math.floor(current)} / ${target}`
    }
    
    return `${Math.floor(current)} / ${target}`
  }

  return (
    <div className="achievement-book-panel">
      <div className="achievement-header">
        <h2 className="achievement-title">🏆 成就簿</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="achievement-progress-banner">
        <div className="progress-item">
          <span className="progress-icon">🎖️</span>
          <div className="progress-info">
            <div className="progress-label">成就完成度</div>
            <div className="progress-bar">
              <div
                className="progress-fill achievement-fill"
                style={{ width: `${achievementProgress.percentage}%` }}
              />
            </div>
            <div className="progress-text">
              {achievementProgress.unlocked} / {achievementProgress.total}
              <span className="progress-percent">({achievementProgress.percentage.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
        <div className="progress-item">
          <span className="progress-icon">🔔</span>
          <div className="progress-info">
            <div className="progress-label">特殊钟声收集</div>
            <div className="progress-bar">
              <div
                className="progress-fill bell-fill"
                style={{ width: `${bellProgress.percentage}%` }}
              />
            </div>
            <div className="progress-text">
              {bellProgress.collected} / {bellProgress.total}
              <span className="progress-percent">({bellProgress.percentage.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="achievement-tabs">
        <button
          className={`achievement-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏅 成就列表
        </button>
        <button
          className={`achievement-tab ${activeTab === 'specialBells' ? 'active' : ''}`}
          onClick={() => setActiveTab('specialBells')}
        >
          🔔 特殊钟声
        </button>
      </div>

      {activeTab === 'achievements' && (
        <div className="achievement-filters">
          <div className="filter-group">
            <span className="filter-label">分类：</span>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCategoryFilter('all')}
              >
                全部
              </button>
              {(Object.keys(CATEGORY_NAMES) as AchievementCategory[]).map((cat) => (
                <button
                  key={cat}
                  className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {CATEGORY_NAMES[cat]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">稀有度：</span>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${rarityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setRarityFilter('all')}
              >
                全部
              </button>
              {(Object.keys(RARITY_NAMES) as AchievementRarity[]).map((rarity) => (
                <button
                  key={rarity}
                  className={`filter-btn rarity-btn ${rarityFilter === rarity ? 'active' : ''}`}
                  onClick={() => setRarityFilter(rarity)}
                  style={{
                    borderColor: rarityFilter === rarity ? RARITY_COLORS[rarity] : undefined,
                    color: rarityFilter === rarity ? RARITY_COLORS[rarity] : undefined,
                  }}
                >
                  {RARITY_NAMES[rarity]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="achievement-content">
        {activeTab === 'achievements' && (
          <div className="achievements-grid">
            {allAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
                onClick={() => setSelectedAchievement(achievement)}
                style={{
                  borderColor: achievement.isUnlocked ? RARITY_COLORS[achievement.rarity] : undefined,
                  boxShadow: achievement.isUnlocked
                    ? `0 0 15px ${RARITY_COLORS[achievement.rarity]}30`
                    : undefined,
                }}
              >
                <div
                  className="achievement-icon"
                  style={{
                    color: achievement.isUnlocked ? RARITY_COLORS[achievement.rarity] : '#555',
                    filter: achievement.isUnlocked ? 'none' : 'grayscale(100%)',
                  }}
                >
                  {achievement.icon}
                </div>
                <div className="achievement-info">
                  <div
                    className="achievement-name"
                    style={{ color: achievement.isUnlocked ? RARITY_COLORS[achievement.rarity] : '#888' }}
                  >
                    {achievement.displayName}
                  </div>
                  <div className="achievement-description">
                    {achievement.isUnlocked ? achievement.description : '???'}
                  </div>
                  {!achievement.isUnlocked && achievement.targetValue && (
                    <div className="achievement-progress-mini">
                      <div
                        className="progress-mini-fill"
                        style={{
                          width: `${getProgressPercentage(achievement)}%`,
                          backgroundColor: RARITY_COLORS[achievement.rarity],
                        }}
                      />
                    </div>
                  )}
                  <div className="achievement-rarity-tag" style={{ color: RARITY_COLORS[achievement.rarity] }}>
                    {RARITY_NAMES[achievement.rarity]}
                  </div>
                </div>
                {achievement.isUnlocked && (
                  <div className="achievement-checkmark">✓</div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'specialBells' && (
          <div className="bells-grid">
            {specialBells.map((bell) => (
              <div
                key={bell.id}
                className={`bell-card ${bell.isCollected ? 'collected' : 'uncollected'}`}
                onClick={() => setSelectedBell(bell)}
                style={{
                  borderColor: bell.isCollected ? bell.color : '#333',
                  boxShadow: bell.isCollected ? `0 0 20px ${bell.color}40` : 'none',
                }}
              >
                <div
                  className="bell-icon"
                  style={{
                    color: bell.isCollected ? bell.color : '#555',
                    filter: bell.isCollected ? `drop-shadow(0 0 10px ${bell.color}60)` : 'grayscale(100%)',
                  }}
                >
                  {bell.icon}
                </div>
                <div
                  className="bell-name"
                  style={{ color: bell.isCollected ? bell.color : '#888' }}
                >
                  {bell.displayName}
                </div>
                <div className="bell-description">
                  {bell.isCollected ? bell.description : '???'}
                </div>
                <div className="bell-rarity" style={{ color: RARITY_COLORS[bell.rarity] }}>
                  {RARITY_NAMES[bell.rarity]}
                </div>
                {bell.isCollected && (
                  <div className="bell-collected-badge">已收集</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAchievement && (
        <div className="detail-overlay" onClick={() => setSelectedAchievement(null)}>
          <div
            className="detail-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: RARITY_COLORS[selectedAchievement.rarity],
              boxShadow: `0 0 30px ${RARITY_COLORS[selectedAchievement.rarity]}40`,
            }}
          >
            <div className="detail-header">
              <div
                className="detail-icon-large"
                style={{ color: RARITY_COLORS[selectedAchievement.rarity] }}
              >
                {selectedAchievement.icon}
              </div>
              <button className="close-btn" onClick={() => setSelectedAchievement(null)}>✕</button>
            </div>
            <div className="detail-body">
              <h3
                className="detail-title"
                style={{ color: RARITY_COLORS[selectedAchievement.rarity] }}
              >
                {selectedAchievement.displayName}
              </h3>
              <div
                className="detail-rarity"
                style={{ color: RARITY_COLORS[selectedAchievement.rarity] }}
              >
                {RARITY_NAMES[selectedAchievement.rarity]} · {CATEGORY_NAMES[selectedAchievement.category]}
              </div>
              <p className="detail-description">{selectedAchievement.description}</p>
              
              <div className="detail-condition">
                <span className="condition-label">达成条件：</span>
                <span className="condition-value">{selectedAchievement.unlockCondition}</span>
              </div>

              {selectedAchievement.targetValue && (
                <div className="detail-progress">
                  <div className="detail-progress-header">
                    <span>进度</span>
                    <span>{formatValue(selectedAchievement)}</span>
                  </div>
                  <div className="detail-progress-bar">
                    <div
                      className="detail-progress-fill"
                      style={{
                        width: `${getProgressPercentage(selectedAchievement)}%`,
                        backgroundColor: RARITY_COLORS[selectedAchievement.rarity],
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedAchievement.isUnlocked && selectedAchievement.unlockedAt && (
                <div className="detail-unlock-date">
                  <span>🏆 解锁于：</span>
                  <span>{formatDate(selectedAchievement.unlockedAt)}</span>
                </div>
              )}

              {selectedAchievement.reward && (
                <div className="detail-reward">
                  <span className="reward-label">🎁 奖励：</span>
                  <span className="reward-value">
                    {selectedAchievement.reward.type === 'score' && `${selectedAchievement.reward.value} 积分`}
                    {selectedAchievement.reward.type === 'bell_preset' && '特殊钟声谱面'}
                    {selectedAchievement.reward.type === 'material' && '特殊齿轮材质'}
                    {selectedAchievement.reward.type === 'tool' && '特殊校时工具'}
                    {selectedAchievement.reward.type === 'badge' && '特殊徽章'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBell && (
        <div className="detail-overlay" onClick={() => setSelectedBell(null)}>
          <div
            className="detail-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: selectedBell.color,
              boxShadow: `0 0 30px ${selectedBell.color}40`,
            }}
          >
            <div className="detail-header">
              <div
                className="detail-icon-large bell-detail-icon"
                style={{
                  color: selectedBell.color,
                  filter: `drop-shadow(0 0 15px ${selectedBell.color}80)`,
                }}
              >
                {selectedBell.icon}
              </div>
              <button className="close-btn" onClick={() => setSelectedBell(null)}>✕</button>
            </div>
            <div className="detail-body">
              <h3 className="detail-title" style={{ color: selectedBell.color }}>
                {selectedBell.displayName}
              </h3>
              <div className="detail-rarity" style={{ color: RARITY_COLORS[selectedBell.rarity] }}>
                {RARITY_NAMES[selectedBell.rarity]} · 特殊钟声
              </div>
              <p className="detail-description">{selectedBell.description}</p>
              
              <div className="detail-condition">
                <span className="condition-label">收集条件：</span>
                <span className="condition-value">{selectedBell.unlockCondition}</span>
              </div>

              {selectedBell.isCollected && selectedBell.collectedAt && (
                <div className="detail-unlock-date">
                  <span>🔔 收集于：</span>
                  <span>{formatDate(selectedBell.collectedAt)}</span>
                </div>
              )}

              {!selectedBell.isCollected && (
                <div className="detail-hint">
                  <span>💡 提示：</span>
                  <span>尝试在特定条件下完成校时来唤醒这口钟</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AchievementBookPanel
