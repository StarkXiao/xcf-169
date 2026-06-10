import { useState, useCallback, useMemo } from 'react'
import type {
  SharedLevel,
  LevelSortType,
  EditorLevelConfig,
} from '../types'
import { levelShareSystem } from '../game/LevelShareSystem'
import { loadEditorLevel, saveCustomLevelToStorage } from '../game/LevelLoader'

type TabType = 'plaza' | 'my' | 'share'
type DetailView = null | { level: SharedLevel; tab: 'info' | 'records' | 'comments' }

interface LevelSharePanelProps {
  onClose: () => void
  onPlayLevel?: (levelData: EditorLevelConfig, sharedLevelId: string) => void
  onCreateLevel?: () => void
}

function LevelSharePanel({ onClose, onPlayLevel, onCreateLevel }: LevelSharePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('plaza')
  const [sortBy, setSortBy] = useState<LevelSortType>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<SharedLevel['difficulty'] | undefined>()
  const [detailView, setDetailView] = useState<DetailView>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareForm, setShareForm] = useState({
    title: '',
    description: '',
    difficulty: 'normal' as SharedLevel['difficulty'],
    tags: [] as string[],
  })
  const [commentText, setCommentText] = useState('')
  const [commentRating, setCommentRating] = useState(5)
  const [toast, setToast] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const refresh = useCallback(() => {
    setRefreshTrigger((t) => t + 1)
  }, [])

  const plazaLevels = useMemo(() => {
    return levelShareSystem.getSharedLevels({
      sortBy,
      difficulty: difficultyFilter,
      searchQuery: searchQuery || undefined,
    })
  }, [sortBy, difficultyFilter, searchQuery, refreshTrigger])

  const myLevels = useMemo(() => {
    return levelShareSystem.getMyLevels()
  }, [refreshTrigger])

  const featuredLevels = useMemo(() => {
    return levelShareSystem.getFeaturedLevels()
  }, [refreshTrigger])

  const profile = useMemo(() => levelShareSystem.getProfile(), [refreshTrigger])

  const handlePlayLevel = useCallback((level: SharedLevel) => {
    try {
      const loaded = loadEditorLevel(level.levelData)
      saveCustomLevelToStorage(loaded)
      levelShareSystem.incrementPlayCount(level.id)
      refresh()
      onPlayLevel?.(level.levelData, level.id)
    } catch (err) {
      showToast('关卡加载失败')
    }
  }, [onPlayLevel, refresh, showToast])

  const handleLike = useCallback((levelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    levelShareSystem.toggleLike(levelId)
    refresh()
  }, [refresh])

  const handleShareLevel = useCallback(() => {
    if (!shareForm.title.trim()) {
      showToast('请输入关卡标题')
      return
    }
    const defaultLevel = createDefaultLevelForShare()
    const newLevel = levelShareSystem.shareLevel(
      defaultLevel,
      shareForm.title.trim(),
      shareForm.description.trim(),
      shareForm.difficulty,
      shareForm.tags.filter((t) => t.trim()),
    )
    showToast('关卡发布成功！')
    setShowShareModal(false)
    setShareForm({ title: '', description: '', difficulty: 'normal', tags: [] })
    setActiveTab('my')
    refresh()
    setDetailView({ level: newLevel, tab: 'info' })
  }, [shareForm, refresh, showToast])

  const handleDeleteLevel = useCallback((levelId: string) => {
    if (confirm('确定要删除这个关卡吗？删除后无法恢复。')) {
      const success = levelShareSystem.deleteLevel(levelId)
      if (success) {
        showToast('关卡已删除')
        setDetailView(null)
        refresh()
      } else {
        showToast('删除失败')
      }
    }
  }, [refresh, showToast])

  const handleAddComment = useCallback(() => {
    if (!detailView || !commentText.trim()) {
      showToast('请输入评论内容')
      return
    }
    levelShareSystem.addComment(detailView.level.id, commentText.trim(), commentRating)
    setCommentText('')
    setCommentRating(5)
    showToast('评论发布成功')
    refresh()
  }, [detailView, commentText, commentRating, refresh, showToast])

  const renderStars = (count: number, size = 'sm') => {
    const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg'
    return (
      <span className={`stars ${sizeClass}`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= count ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </span>
    )
  }

  const renderLevelCard = (level: SharedLevel) => {
    const isLiked = levelShareSystem.isLiked(level.id)
    const hasCleared = levelShareSystem.hasClearedLevel(level.id)
    const difficultyColor = levelShareSystem.getDifficultyColor(level.difficulty)
    const difficultyLabel = levelShareSystem.getDifficultyLabel(level.difficulty)
    const completionRate = level.plays > 0 ? Math.round((level.completions / level.plays) * 100) : 0

    return (
      <div
        key={level.id}
        className="level-card"
        onClick={() => setDetailView({ level, tab: 'info' })}
      >
        <div className="level-card-header">
          <div className="level-card-title-row">
            <h3 className="level-card-title">{level.title}</h3>
            {level.isFeatured && <span className="featured-badge">⭐ 精选</span>}
          </div>
          <span
            className="difficulty-badge"
            style={{ borderColor: difficultyColor, color: difficultyColor }}
          >
            {difficultyLabel}
          </span>
        </div>

        <p className="level-card-desc">{level.description}</p>

        <div className="level-card-meta">
          <div className="meta-author">
            <span className="author-avatar">{level.authorAvatar}</span>
            <span className="author-name">{level.authorName}</span>
          </div>
          <span className="meta-time">{levelShareSystem.formatTimeAgo(level.createdAt)}</span>
        </div>

        <div className="level-card-stats">
          <div className="stat-item">
            <span className="stat-icon">🎮</span>
            <span className="stat-num">{level.plays}</span>
            <span className="stat-label">游玩</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <span className="stat-num">{completionRate}%</span>
            <span className="stat-label">通关率</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏆</span>
            <span className="stat-num">{level.bestScore}</span>
            <span className="stat-label">最高分</span>
          </div>
          <div className="stat-item">
            <button
              className={`like-btn ${isLiked ? 'liked' : ''}`}
              onClick={(e) => handleLike(level.id, e)}
            >
              {isLiked ? '❤️' : '🤍'}
              <span>{level.likes}</span>
            </button>
          </div>
        </div>

        <div className="level-card-footer">
          <div className="tag-list">
            {level.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
          {hasCleared && <span className="cleared-badge">✓ 已通关</span>}
        </div>
      </div>
    )
  }

  const renderDetailView = () => {
    if (!detailView) return null
    const { level, tab } = detailView
    const isLiked = levelShareSystem.isLiked(level.id)
    const isMyLevel = level.authorId === profile.id
    const records = levelShareSystem.getLevelRecords(level.id)
    const comments = levelShareSystem.getLevelComments(level.id)
    const myRecord = levelShareSystem.getMyRecords(level.id)[0]
    const difficultyColor = levelShareSystem.getDifficultyColor(level.difficulty)
    const difficultyLabel = levelShareSystem.getDifficultyLabel(level.difficulty)

    return (
      <div className="detail-overlay">
        <div className="detail-panel">
          <div className="detail-header">
            <button className="detail-back-btn" onClick={() => setDetailView(null)}>
              ← 返回
            </button>
            <button
              className={`like-btn large ${isLiked ? 'liked' : ''}`}
              onClick={(e) => handleLike(level.id, e)}
            >
              {isLiked ? '❤️' : '🤍'}
              <span>{level.likes}</span>
            </button>
          </div>

          <div className="detail-content">
            <div className="detail-title-section">
              <h2 className="detail-title">{level.title}</h2>
              <span
                className="difficulty-badge large"
                style={{ borderColor: difficultyColor, color: difficultyColor }}
              >
                {difficultyLabel}
              </span>
            </div>

            <div className="detail-author-row">
              <span className="author-avatar large">{level.authorAvatar}</span>
              <div>
                <div className="author-name">{level.authorName}</div>
                <div className="detail-time">
                  {levelShareSystem.formatTimeAgo(level.createdAt)}发布
                </div>
              </div>
            </div>

            <p className="detail-desc">{level.description}</p>

            <div className="detail-tag-list">
              {level.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="detail-stats-grid">
              <div className="detail-stat-card">
                <div className="detail-stat-num">{level.plays}</div>
                <div className="detail-stat-label">总游玩次数</div>
              </div>
              <div className="detail-stat-card">
                <div className="detail-stat-num">{level.completions}</div>
                <div className="detail-stat-label">通关次数</div>
              </div>
              <div className="detail-stat-card highlight">
                <div className="detail-stat-num gold">{level.bestScore}</div>
                <div className="detail-stat-label">最高分</div>
              </div>
              <div className="detail-stat-card">
                <div className="detail-stat-num">{level.bestTime || '--'}s</div>
                <div className="detail-stat-label">最快通关</div>
              </div>
            </div>

            {myRecord && (
              <div className="my-record-card">
                <div className="my-record-header">
                  <span>🏆 我的最佳记录</span>
                  {renderStars(myRecord.stars, 'sm')}
                </div>
                <div className="my-record-stats">
                  <div>
                    <span className="record-label">得分</span>
                    <span className="record-value gold">{myRecord.score}</span>
                  </div>
                  <div>
                    <span className="record-label">用时</span>
                    <span className="record-value">{myRecord.timeUsed}秒</span>
                  </div>
                  <div>
                    <span className="record-label">偏差</span>
                    <span className="record-value">{myRecord.deviation}分钟</span>
                  </div>
                </div>
              </div>
            )}

            <div className="detail-tabs">
              <button
                className={`detail-tab ${tab === 'info' ? 'active' : ''}`}
                onClick={() => setDetailView({ level, tab: 'info' })}
              >
                📋 关卡信息
              </button>
              <button
                className={`detail-tab ${tab === 'records' ? 'active' : ''}`}
                onClick={() => setDetailView({ level, tab: 'records' })}
              >
                🏆 排行榜 ({records.length})
              </button>
              <button
                className={`detail-tab ${tab === 'comments' ? 'active' : ''}`}
                onClick={() => setDetailView({ level, tab: 'comments' })}
              >
                💬 评论 ({comments.length})
              </button>
            </div>

            {tab === 'info' && (
              <div className="detail-tab-content">
                <div className="info-section">
                  <h4>关卡配置</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">游戏模式</span>
                      <span className="info-value">
                        {level.levelData.gameMode === 'classic'
                          ? '经典校时'
                          : level.levelData.gameMode === 'patrol'
                            ? '钟楼巡夜'
                            : '多钟面连锁'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">齿轮数量</span>
                      <span className="info-value">{level.levelData.gears.length}个</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">关卡时长</span>
                      <span className="info-value">{level.levelData.duration}秒</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">容差范围</span>
                      <span className="info-value">±{level.levelData.toleranceMinutes}分钟</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">初始时间</span>
                      <span className="info-value">
                        {level.levelData.initialClockTime.hours}:
                        {level.levelData.initialClockTime.minutes.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">目标时间</span>
                      <span className="info-value success">
                        {level.levelData.targetClockTime.hours}:
                        {level.levelData.targetClockTime.minutes.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">故障事件</span>
                      <span className="info-value">
                        {level.levelData.faultEvents.filter((f) => f.enabled).length}个
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">分数倍率</span>
                      <span className="info-value gold">×{level.levelData.scoreMultiplier}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'records' && (
              <div className="detail-tab-content">
                {records.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🏆</span>
                    <p>暂无通关记录</p>
                    <p className="empty-hint">成为第一个通关的人吧！</p>
                  </div>
                ) : (
                  <div className="records-list">
                    {records.map((record, index) => (
                      <div key={record.id} className="record-item">
                        <div className={`record-rank rank-${index + 1}`}>
                          {index + 1}
                        </div>
                        <div className="record-player">
                          <span className="record-avatar">{record.playerAvatar}</span>
                          <div>
                            <div className="record-name">{record.playerName}</div>
                            <div className="record-time">
                              {levelShareSystem.formatTimeAgo(record.completedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="record-score">
                          <div className="record-score-num">{record.score}</div>
                          <div className="record-score-stars">{renderStars(record.stars)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'comments' && (
              <div className="detail-tab-content">
                <div className="comment-input-section">
                  <div className="comment-rating-input">
                    <span className="rating-label">评分：</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`rating-star ${star <= commentRating ? 'filled' : ''}`}
                        onClick={() => setCommentRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="comment-input"
                    placeholder="分享你的游玩感受..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <button className="comment-submit-btn" onClick={handleAddComment}>
                    发布评论
                  </button>
                </div>

                {comments.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">💬</span>
                    <p>暂无评论</p>
                    <p className="empty-hint">来发表第一条评论吧</p>
                  </div>
                ) : (
                  <div className="comments-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-avatar">{comment.playerAvatar}</span>
                          <div className="comment-info">
                            <span className="comment-name">{comment.playerName}</span>
                            <span className="comment-time">
                              {levelShareSystem.formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <div className="comment-rating">{renderStars(comment.rating)}</div>
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="detail-footer">
            {isMyLevel && (
              <button
                className="detail-action-btn delete"
                onClick={() => handleDeleteLevel(level.id)}
              >
                🗑️ 删除关卡
              </button>
            )}
            <button
              className="detail-action-btn primary large"
              onClick={() => handlePlayLevel(level)}
            >
              🎮 开始挑战
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderShareModal = () => {
    if (!showShareModal) return null

    const availableTags = ['经典', '新手', '挑战', '创意', '解谜', '高难度', '巡夜', '多钟面']

    const toggleTag = (tag: string) => {
      setShareForm((prev) => ({
        ...prev,
        tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      }))
    }

    return (
      <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>分享你的关卡</h3>
            <button className="modal-close" onClick={() => setShowShareModal(false)}>
              ✕
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>关卡标题 *</label>
              <input
                type="text"
                placeholder="给你的关卡起个名字"
                value={shareForm.title}
                onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                maxLength={30}
              />
            </div>
            <div className="form-group">
              <label>关卡描述</label>
              <textarea
                placeholder="介绍一下你的关卡设计思路..."
                value={shareForm.description}
                onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                rows={3}
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <label>难度等级</label>
              <div className="difficulty-selector">
                {(['easy', 'normal', 'hard', 'expert'] as const).map((diff) => (
                  <button
                    key={diff}
                    className={`diff-option ${shareForm.difficulty === diff ? 'selected' : ''}`}
                    style={{
                      borderColor:
                        shareForm.difficulty === diff
                          ? levelShareSystem.getDifficultyColor(diff)
                          : undefined,
                      color:
                        shareForm.difficulty === diff
                          ? levelShareSystem.getDifficultyColor(diff)
                          : undefined,
                    }}
                    onClick={() => setShareForm({ ...shareForm, difficulty: diff })}
                  >
                    {levelShareSystem.getDifficultyLabel(diff)}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>标签（最多选3个）</label>
              <div className="tag-selector">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={`tag-option ${shareForm.tags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => {
                      if (shareForm.tags.includes(tag) || shareForm.tags.length < 3) {
                        toggleTag(tag)
                      }
                    }}
                    disabled={!shareForm.tags.includes(tag) && shareForm.tags.length >= 3}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="share-hint">
              <p>💡 提示：当前使用默认关卡模板分享。你可以先在关卡编辑器中设计好关卡，再回来分享。</p>
              {onCreateLevel && (
                <button
                  className="link-btn"
                  onClick={() => {
                    setShowShareModal(false)
                    onCreateLevel()
                  }}
                >
                  前往编辑器设计 →
                </button>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="modal-btn secondary" onClick={() => setShowShareModal(false)}>
              取消
            </button>
            <button className="modal-btn primary" onClick={handleShareLevel}>
              发布关卡
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="level-share-panel">
      <div className="share-header">
        <button className="share-close-btn" onClick={onClose}>
          ✕
        </button>
        <h1 className="share-title">关卡广场</h1>
        <div className="share-header-spacer" />
      </div>

      <div className="share-content">
        {activeTab === 'plaza' && (
          <div className="tab-content">
            <div className="search-section">
              <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="搜索关卡、标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-section">
              <div className="filter-chips">
                <button
                  className={`filter-chip ${!difficultyFilter ? 'active' : ''}`}
                  onClick={() => setDifficultyFilter(undefined)}
                >
                  全部
                </button>
                {(['easy', 'normal', 'hard', 'expert'] as const).map((diff) => (
                  <button
                    key={diff}
                    className={`filter-chip ${difficultyFilter === diff ? 'active' : ''}`}
                    onClick={() => setDifficultyFilter(diff)}
                    style={{
                      '--diff-color': levelShareSystem.getDifficultyColor(diff),
                    } as React.CSSProperties}
                  >
                    {levelShareSystem.getDifficultyLabel(diff)}
                  </button>
                ))}
              </div>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as LevelSortType)}
              >
                <option value="newest">最新发布</option>
                <option value="popular">最受欢迎</option>
                <option value="mostPlayed">最多游玩</option>
                <option value="highestRated">最高评分</option>
                <option value="easiest">最简单</option>
                <option value="hardest">最困难</option>
              </select>
            </div>

            {featuredLevels.length > 0 && searchQuery === '' && !difficultyFilter && (
              <section className="section">
                <h2 className="section-title">⭐ 精选关卡</h2>
                <div className="level-grid featured">
                  {featuredLevels.slice(0, 3).map((level) => renderLevelCard(level))}
                </div>
              </section>
            )}

            <section className="section">
              <h2 className="section-title">
                {searchQuery || difficultyFilter ? '搜索结果' : '全部关卡'}
                <span className="section-count">{plazaLevels.length}</span>
              </h2>
              {plazaLevels.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <p>没有找到相关关卡</p>
                  <p className="empty-hint">换个关键词试试吧</p>
                </div>
              ) : (
                <div className="level-grid">{plazaLevels.map((level) => renderLevelCard(level))}</div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'my' && (
          <div className="tab-content">
            <div className="profile-card">
              <div className="profile-avatar">{profile.avatar}</div>
              <div className="profile-info">
                <h3 className="profile-name">{profile.nickname}</h3>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <span className="stat-num">{profile.levelsCreated}</span>
                    <span className="stat-label">已发布</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-num">{profile.levelsCompleted}</span>
                    <span className="stat-label">已通关</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-num gold">{profile.totalScore}</span>
                    <span className="stat-label">总积分</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="section">
              <h2 className="section-title">
                我发布的关卡
                <span className="section-count">{myLevels.length}</span>
              </h2>
              {myLevels.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">✏️</span>
                  <p>你还没有发布过关卡</p>
                  <p className="empty-hint">创建并分享你的第一个关卡吧！</p>
                  <button
                    className="empty-action-btn"
                    onClick={() => setShowShareModal(true)}
                  >
                    + 发布关卡
                  </button>
                </div>
              ) : (
                <div className="level-grid">{myLevels.map((level) => renderLevelCard(level))}</div>
              )}
            </section>
          </div>
        )}
      </div>

      <div className="share-tab-bar">
        <button
          className={`tab-bar-btn ${activeTab === 'plaza' ? 'active' : ''}`}
          onClick={() => setActiveTab('plaza')}
        >
          <span className="tab-icon">🏛️</span>
          <span className="tab-label">广场</span>
        </button>
        <button className="tab-bar-btn center-btn" onClick={() => setShowShareModal(true)}>
          <span className="tab-icon">+</span>
        </button>
        <button
          className={`tab-bar-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <span className="tab-icon">👤</span>
          <span className="tab-label">我的</span>
        </button>
      </div>

      {renderShareModal()}
      {renderDetailView()}

      {toast && <div className="share-toast">{toast}</div>}
    </div>
  )
}

function createDefaultLevelForShare(): EditorLevelConfig {
  const now = Date.now()
  return {
    id: `shared_${now}`,
    name: 'shared_level',
    displayName: '分享的关卡',
    description: '',
    gameMode: 'classic',
    duration: 120,
    gears: [
      { id: 1, x: 300, y: 250, size: 'large', connectedTo: [2, 3], initialAngle: 0, label: '主齿轮' },
      { id: 2, x: 180, y: 150, size: 'medium', connectedTo: [1], initialAngle: 0, label: '左上齿轮' },
      { id: 3, x: 420, y: 150, size: 'medium', connectedTo: [1, 4], initialAngle: 0, label: '右上齿轮' },
      { id: 4, x: 500, y: 300, size: 'small', connectedTo: [3], initialAngle: 0, label: '右侧齿轮' },
    ],
    initialClockTime: { hours: 12, minutes: 0 },
    targetClockTime: { hours: 3, minutes: 45 },
    toleranceMinutes: 5,
    scoreMultiplier: 1.0,
    faultEvents: [],
    soundConfigs: [],
    createdAt: now,
    updatedAt: now,
  }
}

export default LevelSharePanel
