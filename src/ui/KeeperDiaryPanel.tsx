import { useState, useEffect, useMemo } from 'react'
import { keeperDiarySystem } from '../game/KeeperDiarySystem'
import type { DiaryEntry } from '../types'

interface KeeperDiaryPanelProps {
  onClose: () => void
}

type TabType = 'diary' | 'objectives' | 'effects'

const MOOD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  happy: { bg: 'rgba(100, 200, 100, 0.15)', border: '#64c864', text: '#64c864' },
  sad: { bg: 'rgba(100, 150, 200, 0.15)', border: '#6496c8', text: '#6496c8' },
  mysterious: { bg: 'rgba(150, 100, 200, 0.15)', border: '#9664c8', text: '#9664c8' },
  excited: { bg: 'rgba(255, 200, 100, 0.15)', border: '#ffc864', text: '#ffc864' },
  neutral: { bg: 'rgba(150, 150, 150, 0.15)', border: '#969696', text: '#969696' },
}

function KeeperDiaryPanel({ onClose }: KeeperDiaryPanelProps) {
  const [state, setState] = useState(keeperDiarySystem.getState())
  const [activeTab, setActiveTab] = useState<TabType>('diary')
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [showEntryDetail, setShowEntryDetail] = useState(false)
  const [newEntries, setNewEntries] = useState<DiaryEntry[]>([])

  const refresh = () => {
    setState(keeperDiarySystem.getState())
    setNewEntries(keeperDiarySystem.getNewEntries())
  }

  useEffect(() => {
    refresh()
  }, [])

  const entries = useMemo(() => keeperDiarySystem.getAllEntries(), [state])
  const objectives = useMemo(() => keeperDiarySystem.getLevelObjectives(), [state])
  const effects = useMemo(() => keeperDiarySystem.getEffects(), [state])
  const stats = useMemo(() => keeperDiarySystem.getStats(), [state])

  const formatScore = (score: number) => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}万`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  const formatTime = (seconds: number) => {
    if (seconds >= 9999) return '--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSelectEntry = (entry: DiaryEntry) => {
    if (!entry.isUnlocked) return
    setSelectedEntryId(entry.id)
    setShowEntryDetail(true)
    keeperDiarySystem.readEntry(entry.id)
    refresh()
  }

  const handleToggleEffect = (entryId: string, active: boolean) => {
    keeperDiarySystem.setActiveCalibration(entryId, active)
    refresh()
  }

  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null
    return keeperDiarySystem.getEntry(selectedEntryId)
  }, [selectedEntryId, state])

  const renderDiaryTab = () => (
    <div className="diary-tab-content">
      <div className="diary-stats-row">
        <div className="diary-stat-card">
          <span className="diary-stat-label">📖 已解锁</span>
          <span className="diary-stat-value">
            {state.unlockedEntryIds.length} / {entries.length}
          </span>
        </div>
        <div className="diary-stat-card">
          <span className="diary-stat-label">✨ 新日记</span>
          <span className="diary-stat-value new-count">{newEntries.length}</span>
        </div>
        <div className="diary-stat-card">
          <span className="diary-stat-label">📊 日记积分</span>
          <span className="diary-stat-value gold">{formatScore(state.totalDiaryScore)}</span>
        </div>
      </div>

      <div className="diary-entry-list">
        {entries.map((entry) => {
          const moodStyle = entry.mood ? MOOD_COLORS[entry.mood] : MOOD_COLORS.neutral
          const isNew = !entry.isRead && entry.isUnlocked

          return (
            <div
              key={entry.id}
              className={`diary-entry-card ${entry.isUnlocked ? 'unlocked' : 'locked'} ${isNew ? 'new' : ''}`}
              style={entry.isUnlocked ? {
                borderColor: moodStyle.border,
                background: moodStyle.bg,
              } : {}}
              onClick={() => handleSelectEntry(entry)}
            >
              <div className="diary-entry-icon">{entry.icon}</div>
              <div className="diary-entry-info">
                <div className="diary-entry-header">
                  <span className="diary-entry-date">{entry.date}</span>
                  {isNew && <span className="diary-new-badge">NEW</span>}
                </div>
                <div
                  className="diary-entry-title"
                  style={entry.isUnlocked ? { color: moodStyle.text } : {}}
                >
                  {entry.isUnlocked ? entry.title : '???'}
                </div>
                <div className="diary-entry-subtitle">
                  {entry.isUnlocked ? entry.subtitle : '尚未解锁'}
                </div>
                {entry.isUnlocked && entry.specialCalibrations.length > 0 && (
                  <div className="diary-entry-effects-preview">
                    {entry.specialCalibrations.slice(0, 2).map((eff, i) => (
                      <span key={i} className="diary-effect-tag mini">
                        {eff.description.split('：')[0]}
                      </span>
                    ))}
                    {entry.specialCalibrations.length > 2 && (
                      <span className="diary-effect-tag mini">+{entry.specialCalibrations.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              {entry.isUnlocked && (
                <div className="diary-entry-arrow">›</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderObjectivesTab = () => (
    <div className="diary-tab-content">
      <div className="diary-section-header">
        <h3 className="diary-section-title">🎯 守钟目标</h3>
        <span className="diary-count-badge">
          {objectives.filter((o) => o.isCompleted).length} / {objectives.length}
        </span>
      </div>

      <div className="diary-objective-list">
        {objectives.map((obj) => (
          <div
            key={obj.id}
            className={`diary-objective-card ${obj.isCompleted ? 'completed' : ''}`}
          >
            <div className="diary-objective-icon">{obj.icon}</div>
            <div className="diary-objective-info">
              <div className="diary-objective-title">{obj.title}</div>
              <div className="diary-objective-desc">{obj.description}</div>
              {obj.target !== undefined && obj.progress !== undefined && (
                <div className="diary-objective-progress">
                  <div className="diary-progress-bar">
                    <div
                      className="diary-progress-fill"
                      style={{
                        width: `${Math.min(100, (obj.progress / obj.target) * 100)}%`,
                        background: obj.isCompleted
                          ? 'linear-gradient(90deg, #64c864, #8ad88a)'
                          : 'linear-gradient(90deg, #c9a96a, #e8c98a)',
                      }}
                    />
                  </div>
                  <span className="diary-progress-text">
                    {obj.progress} / {obj.target}
                  </span>
                </div>
              )}
            </div>
            <div className="diary-objective-reward">
              {obj.isCompleted ? (
                <span className="diary-reward-claimed">✓ 已完成</span>
              ) : (
                <span className="diary-reward-value">+{formatScore(obj.reward || 0)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEffectsTab = () => (
    <div className="diary-tab-content">
      <div className="diary-section-header">
        <h3 className="diary-section-title">⚡ 特殊校时效果</h3>
        <span className="diary-count-badge">
          {effects.activeEntries.length} 个生效中
        </span>
      </div>

      <div className="diary-effects-summary">
        <div className="diary-effect-summary-item">
          <span className="summary-label">得分倍率</span>
          <span className="summary-value gold">×{effects.scoreMultiplier.toFixed(2)}</span>
        </div>
        <div className="diary-effect-summary-item">
          <span className="summary-label">容差加成</span>
          <span className="summary-value">+{effects.toleranceBonus}分钟</span>
        </div>
        <div className="diary-effect-summary-item">
          <span className="summary-label">故障抗性</span>
          <span className="summary-value">{Math.round(effects.faultResistance * 100)}%</span>
        </div>
        <div className="diary-effect-summary-item">
          <span className="summary-label">时间加成</span>
          <span className="summary-value">×{effects.timeBonusMultiplier.toFixed(2)}</span>
        </div>
      </div>

      <div className="diary-effects-list">
        <div className="diary-section-subtitle">可用效果</div>
        {entries.filter((e) => e.isUnlocked && e.specialCalibrations.length > 0).length === 0 && (
          <div className="diary-empty">
            <p>完成目标解锁更多校时效果</p>
          </div>
        )}
        {entries
          .filter((e) => e.isUnlocked && e.specialCalibrations.length > 0)
          .map((entry) => {
            const isActive = state.activeCalibrationIds.includes(entry.id)
            const moodStyle = entry.mood ? MOOD_COLORS[entry.mood] : MOOD_COLORS.neutral

            return (
              <div
                key={entry.id}
                className={`diary-effect-card ${isActive ? 'active' : ''}`}
                style={isActive ? { borderColor: moodStyle.border } : {}}
              >
                <div className="diary-effect-card-header">
                  <span className="diary-effect-card-icon">{entry.icon}</span>
                  <span
                    className="diary-effect-card-title"
                    style={{ color: isActive ? moodStyle.text : undefined }}
                  >
                    {entry.title}
                  </span>
                  <label className="diary-effect-toggle">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => handleToggleEffect(entry.id, e.target.checked)}
                    />
                    <span className="diary-effect-toggle-slider" />
                  </label>
                </div>
                <div className="diary-effect-card-effects">
                  {entry.specialCalibrations.map((eff, i) => (
                    <div key={i} className="diary-effect-item">
                      <span className="diary-effect-dot" style={{ background: moodStyle.border }} />
                      <span className="diary-effect-text">{eff.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )

  const renderEntryDetail = () => {
    if (!selectedEntry) return null
    const moodStyle = selectedEntry.mood ? MOOD_COLORS[selectedEntry.mood] : MOOD_COLORS.neutral

    return (
      <div className="diary-detail-overlay" onClick={() => setShowEntryDetail(false)}>
        <div
          className="diary-detail-panel"
          onClick={(e) => e.stopPropagation()}
          style={{
            borderColor: moodStyle.border,
            boxShadow: `0 0 30px ${moodStyle.border}30`,
          }}
        >
          <div className="diary-detail-header" style={{ background: moodStyle.bg }}>
            <div className="diary-detail-icon">{selectedEntry.icon}</div>
            <div className="diary-detail-title-section">
              <div className="diary-detail-date">{selectedEntry.date}</div>
              <div className="diary-detail-title" style={{ color: moodStyle.text }}>
                {selectedEntry.title}
              </div>
              <div className="diary-detail-subtitle">{selectedEntry.subtitle}</div>
            </div>
            <button
              className="diary-detail-close"
              onClick={() => setShowEntryDetail(false)}
            >
              ✕
            </button>
          </div>

          <div className="diary-detail-content">
            <div className="diary-detail-text">
              {selectedEntry.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {selectedEntry.specialCalibrations.length > 0 && (
              <div className="diary-detail-effects">
                <div className="diary-detail-effects-title">🌟 解锁的校时效果</div>
                {selectedEntry.specialCalibrations.map((eff, i) => (
                  <div
                    key={i}
                    className="diary-detail-effect-item"
                    style={{ borderLeftColor: moodStyle.border }}
                  >
                    <span className="diary-effect-text">{eff.description}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedEntry.rewards && selectedEntry.rewards.length > 0 && (
              <div className="diary-detail-rewards">
                <div className="diary-detail-rewards-title">🎁 阅读奖励</div>
                <div className="diary-reward-list">
                  {selectedEntry.rewards.map((reward, i) => (
                    <span key={i} className="diary-reward-tag">
                      {reward.type === 'score' && `积分 +${reward.value}`}
                      {reward.type === 'badge' && `🏅 徽章`}
                      {reward.type === 'material' && `⚙️ 齿轮材质`}
                      {reward.type === 'tool' && `🛠️ 工具`}
                      {reward.type === 'bell_preset' && `🔔 钟声预设`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="diary-detail-footer">
            <button
              className="diary-detail-button"
              style={{
                background: `linear-gradient(180deg, ${moodStyle.border}40, ${moodStyle.border}20)`,
                borderColor: moodStyle.border,
                color: moodStyle.text,
              }}
              onClick={() => {
                const isActive = state.activeCalibrationIds.includes(selectedEntry.id)
                handleToggleEffect(selectedEntry.id, !isActive)
              }}
            >
              {state.activeCalibrationIds.includes(selectedEntry.id)
                ? '停用此效果'
                : '启用此效果'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'diary', label: '日记手札', icon: '📖' },
    { id: 'objectives', label: '守钟目标', icon: '🎯' },
    { id: 'effects', label: '校时效果', icon: '⚡' },
  ]

  return (
    <div className="keeper-diary-panel">
      <div className="diary-panel-decoration" />

      <div className="diary-header">
        <div>
          <h2 className="diary-title">📖 守钟人日记</h2>
          <p className="diary-subtitle">记录你的守钟历程，解锁特殊校时能力</p>
        </div>
        <button className="diary-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="diary-stats-bar">
        <div className="diary-mini-stat">
          <span className="mini-stat-label">总场次</span>
          <span className="mini-stat-value">{stats.totalPlays}</span>
        </div>
        <div className="diary-mini-stat">
          <span className="mini-stat-label">完美校准</span>
          <span className="mini-stat-value gold">{stats.perfectClears}</span>
        </div>
        <div className="diary-mini-stat">
          <span className="mini-stat-label">最快记录</span>
          <span className="mini-stat-value">{formatTime(stats.fastestClearSeconds)}</span>
        </div>
        <div className="diary-mini-stat">
          <span className="mini-stat-label">最高连胜</span>
          <span className="mini-stat-value">{stats.bestConsecutiveWins}</span>
        </div>
      </div>

      <div className="diary-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`diary-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'diary' && newEntries.length > 0 && (
              <span className="diary-tab-badge">{newEntries.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="diary-tab-body">
        {activeTab === 'diary' && renderDiaryTab()}
        {activeTab === 'objectives' && renderObjectivesTab()}
        {activeTab === 'effects' && renderEffectsTab()}
      </div>

      <div className="diary-footer">
        <button className="start-btn diary-back" onClick={onClose}>
          返回菜单
        </button>
      </div>

      {showEntryDetail && renderEntryDetail()}
    </div>
  )
}

export default KeeperDiaryPanel
