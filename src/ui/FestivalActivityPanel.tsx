import { useState, useEffect, useMemo } from 'react'
import { festivalActivitySystem, FESTIVAL_CONFIGS } from '../game/FestivalActivitySystem'
import type {
  FestivalId,
  FestivalSeason,
} from '../types'

interface FestivalActivityPanelProps {
  onClose: () => void
}

type TabType = 'festival' | 'periods' | 'rewards' | 'leaderboard'

const SEASON_LABELS: Record<FestivalSeason, { label: string; icon: string }> = {
  spring: { label: '春', icon: '🌸' },
  summer: { label: '夏', icon: '☀️' },
  autumn: { label: '秋', icon: '🍂' },
  winter: { label: '冬', icon: '❄️' },
}

function FestivalActivityPanel({ onClose }: FestivalActivityPanelProps) {
  const [state, setState] = useState(festivalActivitySystem.getState())
  const [activeTab, setActiveTab] = useState<TabType>('festival')
  const [selectedSeason, setSelectedSeason] = useState<FestivalSeason | 'all'>('all')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('')

  const refresh = () => {
    setState(festivalActivitySystem.getState())
  }

  useEffect(() => {
    refresh()
  }, [])

  const currentFestival = useMemo(
    () => festivalActivitySystem.getCurrentFestival(),
    [state.currentFestivalId]
  )

  useEffect(() => {
    if (state.currentFestivalId) {
      const periods = festivalActivitySystem.getPeriodsForFestival(state.currentFestivalId)
      if (periods.length > 0 && !periods.find((p) => p.id === selectedPeriodId)) {
        setSelectedPeriodId(periods[0].id)
      }
    }
  }, [state.currentFestivalId, selectedPeriodId])

  const theme = useMemo(
    () => currentFestival?.theme ?? FESTIVAL_CONFIGS[0].theme,
    [currentFestival]
  )

  const filteredFestivals = useMemo(() => {
    if (selectedSeason === 'all') return FESTIVAL_CONFIGS
    return FESTIVAL_CONFIGS.filter((f) => f.season === selectedSeason)
  }, [selectedSeason])

  const formatScore = (score: number) => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}万`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return '已结束'
    const days = Math.floor(ms / 86400000)
    const hours = Math.floor((ms % 86400000) / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    if (days > 0) return `${days}天${hours}时${mins}分`
    if (hours > 0) return `${hours}时${mins}分`
    return `${mins}分钟`
  }

  const handleSelectFestival = (id: FestivalId) => {
    festivalActivitySystem.setCurrentFestival(id)
    refresh()
  }

  const handleClaimReward = (rewardId: string) => {
    if (festivalActivitySystem.claimReward(rewardId)) {
      refresh()
    }
  }

  const renderFestivalTab = () => (
    <div className="festival-tab-content">
      <div className="festival-season-filter">
        <button
          className={`festival-season-btn ${selectedSeason === 'all' ? 'active' : ''}`}
          style={selectedSeason === 'all' ? { borderColor: theme.primaryColor, color: theme.primaryColor, background: `${theme.primaryColor}15` } : {}}
          onClick={() => setSelectedSeason('all')}
        >
          🎉 全部
        </button>
        {(Object.keys(SEASON_LABELS) as FestivalSeason[]).map((season) => (
          <button
            key={season}
            className={`festival-season-btn ${selectedSeason === season ? 'active' : ''}`}
            style={selectedSeason === season ? { borderColor: theme.primaryColor, color: theme.primaryColor, background: `${theme.primaryColor}15` } : {}}
            onClick={() => setSelectedSeason(season)}
          >
            {SEASON_LABELS[season].icon} {SEASON_LABELS[season].label}
          </button>
        ))}
      </div>
      <div className="festival-grid">
        {filteredFestivals.map((festival) => {
          const isActive = state.currentFestivalId === festival.id
          const hasActivePeriod = festivalActivitySystem.getActivePeriodsForFestival(festival.id).length > 0
          const record = state.playerRecords.find((r) => r.festivalId === festival.id)
          const t = festival.theme

          return (
            <div
              key={festival.id}
              className={`festival-card ${isActive ? 'selected' : ''} ${hasActivePeriod ? 'active-period' : ''}`}
              style={isActive ? {
                borderColor: t.primaryColor,
                boxShadow: `0 0 20px ${t.glowColor}40, inset 0 0 15px ${t.glowColor}10`,
              } : {}}
              onClick={() => handleSelectFestival(festival.id)}
            >
              <div className="festival-card-icon" style={{ color: t.iconColor }}>
                {festival.icon}
              </div>
              <div className="festival-card-header">
                <div className="festival-card-name" style={isActive ? { color: t.primaryColor } : {}}>
                  {festival.displayName}
                </div>
                {hasActivePeriod && (
                  <span className="festival-active-badge" style={{ background: `${t.primaryColor}25`, color: t.primaryColor, borderColor: `${t.primaryColor}50` }}>
                    进行中
                  </span>
                )}
              </div>
              <div className="festival-card-season" style={{ color: t.secondaryColor }}>
                {SEASON_LABELS[festival.season].icon} {SEASON_LABELS[festival.season].label}季节庆
              </div>
              <div className="festival-card-desc">{festival.description}</div>
              {record && (
                <div className="festival-card-stats">
                  <span className="festival-stat" style={{ color: t.accentColor }}>
                    积分 {formatScore(record.totalScore)}
                  </span>
                  <span className="festival-stat">
                    最高 {formatScore(record.bestScore)}
                  </span>
                  <span className="festival-stat">
                    {record.attempts}次
                  </span>
                </div>
              )}
              {isActive && (
                <div className="festival-card-selected" style={{ background: `${t.primaryColor}15`, color: t.primaryColor, borderColor: `${t.primaryColor}40` }}>
                  当前主题
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderPeriodsTab = () => {
    if (!state.currentFestivalId) {
      return (
        <div className="festival-empty">
          <p>请先在"节庆主题"中选择一个节日</p>
        </div>
      )
    }

    const festival = festivalActivitySystem.getFestival(state.currentFestivalId)
    if (!festival) return null

    const periods = festivalActivitySystem.getPeriodsForFestival(state.currentFestivalId)
    const activePeriods = festivalActivitySystem.getActivePeriodsForFestival(state.currentFestivalId)
    const t = festival.theme

    return (
      <div className="festival-tab-content">
        <div className="festival-section-header">
          <h3 className="festival-section-title" style={{ borderLeftColor: t.primaryColor, color: t.primaryColor }}>
            📅 {festival.displayName} · 限时活动期
          </h3>
          <span className="festival-count-badge" style={{ background: `${t.primaryColor}20`, color: t.primaryColor }}>
            {activePeriods.length} 期进行中
          </span>
        </div>

        {periods.map((period) => {
          const isActive = festivalActivitySystem.isPeriodActive(period.id)
          const remaining = festivalActivitySystem.getPeriodTimeRemaining(period.id)
          const untilStart = festivalActivitySystem.getPeriodTimeUntilStart(period.id)
          const remainingAttempts = festivalActivitySystem.getRemainingAttempts(state.currentFestivalId!, period.id)
          const canPlay = festivalActivitySystem.canPlayPeriod(state.currentFestivalId!, period.id)
          const record = festivalActivitySystem.getPlayerRecord(state.currentFestivalId!, period.id)

          return (
            <div
              key={period.id}
              className={`festival-period-card ${isActive ? 'active' : untilStart > 0 ? 'upcoming' : 'ended'}`}
              style={isActive ? { borderColor: `${t.primaryColor}80` } : {}}
            >
              <div className="festival-period-header">
                <div className="festival-period-name" style={isActive ? { color: t.primaryColor } : {}}>
                  {period.displayName}
                </div>
                <div className="festival-period-status">
                  {isActive ? (
                    <span className="festival-status-badge active" style={{ background: `${t.primaryColor}20`, color: t.primaryColor, borderColor: `${t.primaryColor}50` }}>
                      进行中
                    </span>
                  ) : untilStart > 0 ? (
                    <span className="festival-status-badge upcoming">
                      {formatTimeRemaining(untilStart)}后开始
                    </span>
                  ) : (
                    <span className="festival-status-badge ended">
                      已结束
                    </span>
                  )}
                </div>
              </div>

              <div className="festival-period-timer">
                {isActive && (
                  <span style={{ color: t.primaryColor }}>
                    ⏱ 剩余 {formatTimeRemaining(remaining)}
                  </span>
                )}
              </div>

              <div className="festival-period-rules">
                <div className="festival-rule-row">
                  <span className="festival-rule-label">得分倍率</span>
                  <span className="festival-rule-value" style={{ color: t.accentColor }}>
                    ×{period.rules.scoreMultiplier}
                  </span>
                </div>
                <div className="festival-rule-row">
                  <span className="festival-rule-label">加成条件</span>
                  <span className="festival-rule-value" style={{ color: t.primaryColor }}>
                    {period.rules.bonusDescription}
                  </span>
                </div>
                <div className="festival-rule-row">
                  <span className="festival-rule-label">每日次数</span>
                  <span className="festival-rule-value">
                    {isActive ? `${remainingAttempts} / ${period.rules.maxAttemptsPerDay}` : `${period.rules.maxAttemptsPerDay}次`}
                  </span>
                </div>
                <div className="festival-rule-row">
                  <span className="festival-rule-label">精度要求</span>
                  <span className="festival-rule-value">
                    ≥{period.rules.requiredAccuracy}%
                  </span>
                </div>
                <div className="festival-rule-row">
                  <span className="festival-rule-label">时间奖励线</span>
                  <span className="festival-rule-value">
                    {period.rules.timeBonusThreshold}秒内
                  </span>
                </div>
              </div>

              {record && (
                <div className="festival-period-record">
                  <div className="festival-record-item">
                    <span>累计积分</span>
                    <span style={{ color: t.accentColor, fontWeight: 'bold' }}>{formatScore(record.totalScore)}</span>
                  </div>
                  <div className="festival-record-item">
                    <span>最佳分数</span>
                    <span style={{ fontWeight: 'bold' }}>{formatScore(record.bestScore)}</span>
                  </div>
                  <div className="festival-record-item">
                    <span>参与次数</span>
                    <span>{record.attempts}</span>
                  </div>
                </div>
              )}

              {isActive && (
                <div className="festival-period-action">
                  <button
                    className={`festival-play-btn ${canPlay ? '' : 'disabled'}`}
                    style={canPlay ? { background: `linear-gradient(180deg, ${t.primaryColor}40, ${t.primaryColor}20)`, borderColor: t.primaryColor, color: t.primaryColor } : {}}
                    disabled={!canPlay}
                  >
                    {canPlay ? '🎮 参与挑战' : '今日次数已用完'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderRewardsTab = () => {
    if (!state.currentFestivalId) {
      return (
        <div className="festival-empty">
          <p>请先在"节庆主题"中选择一个节日</p>
        </div>
      )
    }

    const festival = festivalActivitySystem.getFestival(state.currentFestivalId)
    if (!festival) return null

    const periods = festivalActivitySystem.getPeriodsForFestival(state.currentFestivalId)
    const t = festival.theme
    const allRewards = periods.flatMap((p) => p.rewards)

    return (
      <div className="festival-tab-content">
        <div className="festival-section-header">
          <h3 className="festival-section-title" style={{ borderLeftColor: t.primaryColor, color: t.primaryColor }}>
            🎁 {festival.displayName} · 奖励兑换
          </h3>
        </div>

        <div className="festival-reward-stats" style={{ background: `${t.primaryColor}10`, borderColor: `${t.primaryColor}30` }}>
          <div className="festival-reward-stat">
            <span className="festival-reward-label">节庆总积分</span>
            <span className="festival-reward-value" style={{ color: t.accentColor }}>{formatScore(state.totalFestivalScore)}</span>
          </div>
          <div className="festival-reward-stat">
            <span className="festival-reward-label">已兑换</span>
            <span className="festival-reward-value">{state.claimedRewardIds.length} / {allRewards.length}</span>
          </div>
        </div>

        {periods.map((period) => {
          const record = festivalActivitySystem.getPlayerRecord(state.currentFestivalId!, period.id)

          return (
            <div key={period.id} className="festival-reward-period">
              <div className="festival-reward-period-title" style={{ color: t.primaryColor }}>
                {period.displayName}
              </div>
              <div className="festival-reward-list">
                {period.rewards.map((reward) => {
                  const claimed = festivalActivitySystem.isRewardClaimed(reward.id)
                  const canClaim = festivalActivitySystem.canClaimReward(reward.id)
                  const progress = record
                    ? Math.min(100, Math.floor((record.totalScore / reward.requiredScore) * 100))
                    : 0

                  return (
                    <div
                      key={reward.id}
                      className={`festival-reward-card ${claimed ? 'claimed' : canClaim ? 'available' : 'locked'}`}
                      style={claimed ? { borderColor: `${t.primaryColor}60` } : canClaim ? { borderColor: t.primaryColor, boxShadow: `0 0 15px ${t.glowColor}30` } : {}}
                    >
                      <div className="festival-reward-icon">{reward.icon}</div>
                      <div className="festival-reward-info">
                        <div className="festival-reward-name" style={canClaim || claimed ? { color: t.primaryColor } : {}}>
                          {reward.displayName}
                        </div>
                        <div className="festival-reward-desc">{reward.description}</div>
                        <div className="festival-reward-type-tag">
                          {reward.type === 'bell_preset' && '🔔 钟声'}
                          {reward.type === 'material' && '⚙️ 齿轮'}
                          {reward.type === 'tool' && '🛠️ 工具'}
                          {reward.type === 'badge' && '🪪 徽章'}
                          {reward.type === 'currency' && '💰 货币'}
                        </div>
                        {!claimed && !canClaim && (
                          <div className="festival-reward-progress">
                            <div className="festival-progress-bar">
                              <div
                                className="festival-progress-fill"
                                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${t.primaryColor}, ${t.accentColor})` }}
                              />
                            </div>
                            <span className="festival-progress-text">
                              {formatScore(record?.totalScore ?? 0)} / {formatScore(reward.requiredScore)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="festival-reward-action">
                        {claimed ? (
                          <span className="festival-reward-claimed" style={{ color: t.primaryColor, background: `${t.primaryColor}15` }}>
                            ✓ 已兑换
                          </span>
                        ) : canClaim ? (
                          <button
                            className="festival-claim-btn"
                            style={{ background: `linear-gradient(180deg, ${t.primaryColor}50, ${t.primaryColor}30)`, borderColor: t.primaryColor, color: t.primaryColor }}
                            onClick={() => handleClaimReward(reward.id)}
                          >
                            兑换
                          </button>
                        ) : (
                          <span className="festival-reward-locked-text">
                            🔒 {formatScore(reward.requiredScore)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderLeaderboardTab = () => {
    if (!state.currentFestivalId) {
      return (
        <div className="festival-empty">
          <p>请先在"节庆主题"中选择一个节日</p>
        </div>
      )
    }

    const festival = festivalActivitySystem.getFestival(state.currentFestivalId)
    if (!festival) return null

    const periods = festivalActivitySystem.getPeriodsForFestival(state.currentFestivalId)
    const t = festival.theme

    const leaderboard = selectedPeriodId
      ? festivalActivitySystem.getLeaderboard(state.currentFestivalId!, selectedPeriodId)
      : []

    const getRankStyle = (rank: number) => {
      if (rank === 1) return { color: '#ffd700', background: 'rgba(255, 215, 0, 0.15)', borderColor: 'rgba(255, 215, 0, 0.4)' }
      if (rank === 2) return { color: '#c0c0c0', background: 'rgba(192, 192, 192, 0.15)', borderColor: 'rgba(192, 192, 192, 0.4)' }
      if (rank === 3) return { color: '#cd7f32', background: 'rgba(205, 127, 50, 0.15)', borderColor: 'rgba(205, 127, 50, 0.4)' }
      return {}
    }

    return (
      <div className="festival-tab-content">
        <div className="festival-section-header">
          <h3 className="festival-section-title" style={{ borderLeftColor: t.primaryColor, color: t.primaryColor }}>
            🏆 {festival.displayName} · 排行榜
          </h3>
        </div>

        <div className="festival-leaderboard-periods">
          {periods.map((p) => (
            <button
              key={p.id}
              className={`festival-lb-period-btn ${selectedPeriodId === p.id ? 'active' : ''}`}
              style={selectedPeriodId === p.id ? { background: `${t.primaryColor}20`, color: t.primaryColor, borderColor: t.primaryColor } : {}}
              onClick={() => setSelectedPeriodId(p.id)}
            >
              {p.displayName}
            </button>
          ))}
        </div>

        <div className="festival-leaderboard-list">
          {leaderboard.map((entry) => {
            const rankS = getRankStyle(entry.rank)
            return (
              <div
                key={entry.playerId}
                className="festival-lb-entry"
                style={rankS.background ? { background: rankS.background, borderColor: rankS.borderColor } : {}}
              >
                <div className="festival-lb-rank" style={rankS}>
                  {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                </div>
                <div className="festival-lb-avatar">{entry.playerAvatar}</div>
                <div className="festival-lb-name">{entry.playerName}</div>
                <div className="festival-lb-score" style={{ color: t.accentColor }}>
                  {formatScore(entry.score)}
                </div>
              </div>
            )
          })}
          {leaderboard.length === 0 && (
            <div className="festival-empty">
              <p>暂无排行数据</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'festival', label: '节庆主题', icon: '🏮' },
    { id: 'periods', label: '限时活动', icon: '📅' },
    { id: 'rewards', label: '奖励兑换', icon: '🎁' },
    { id: 'leaderboard', label: '排行榜', icon: '🏆' },
  ]

  return (
    <div
      className="festival-panel"
      style={{ background: theme.bgGradient }}
    >
      <div className="festival-panel-decoration" />

      <div className="festival-header">
        <div>
          <h2
            className="festival-title"
            style={{ color: theme.primaryColor, textShadow: `0 0 20px ${theme.glowColor}50` }}
          >
            🎊 节庆钟声活动中心
          </h2>
          <p className="festival-subtitle" style={{ color: theme.secondaryColor }}>
            按节日切换主题，参与限时挑战，兑换专属奖励
          </p>
        </div>
        <button className="festival-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="festival-stats">
        <div className="festival-stat-item" style={{ borderColor: `${theme.primaryColor}50` }}>
          <span className="festival-stat-label">节庆积分</span>
          <span className="festival-stat-value gold" style={{ color: theme.accentColor }}>
            {formatScore(state.totalFestivalScore)}
          </span>
        </div>
        <div className="festival-stat-item" style={{ borderColor: `${theme.primaryColor}50` }}>
          <span className="festival-stat-label">当前节日</span>
          <span className="festival-stat-value" style={{ color: theme.primaryColor }}>
            {currentFestival ? `${currentFestival.icon} ${currentFestival.displayName}` : '未选择'}
          </span>
        </div>
        <div className="festival-stat-item" style={{ borderColor: `${theme.primaryColor}50` }}>
          <span className="festival-stat-label">已兑换奖励</span>
          <span className="festival-stat-value">{state.claimedRewardIds.length}</span>
        </div>
        <div className="festival-stat-item" style={{ borderColor: `${theme.primaryColor}50` }}>
          <span className="festival-stat-label">活跃期数</span>
          <span className="festival-stat-value" style={{ color: theme.primaryColor }}>
            {festivalActivitySystem.getActivePeriods().length}
          </span>
        </div>
      </div>

      <div className="festival-tabs" style={{ borderColor: `${theme.primaryColor}30` }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`festival-tab ${activeTab === tab.id ? 'active' : ''}`}
            style={activeTab === tab.id ? {
              background: `linear-gradient(180deg, ${theme.primaryColor}25, ${theme.primaryColor}08)`,
              color: theme.primaryColor,
            } : {}}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="festival-tab-body">
        {activeTab === 'festival' && renderFestivalTab()}
        {activeTab === 'periods' && renderPeriodsTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </div>

      <div className="festival-footer">
        <div className="hint-text" style={{ color: theme.secondaryColor }}>
          选择节庆主题参与限时活动，累积积分解锁专属奖励！每个节庆都有独特的限时规则和加成。
        </div>
        <button className="start-btn festival-back" onClick={onClose}>
          返回菜单
        </button>
      </div>
    </div>
  )
}

export default FestivalActivityPanel
