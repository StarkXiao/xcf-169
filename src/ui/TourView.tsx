import { useState, useEffect, useRef, useMemo } from 'react'
import { tourSystem } from '../game/tour/TourSystem'
import type { TourState, TourProgress, TourHotspot, TourMechanismPath, TourHistoricalFact, TourAudioState } from '../types/tour'

interface TourViewProps {
  state: TourState
  progress: TourProgress
  hotspots: TourHotspot[]
  paths: TourMechanismPath[]
  facts: TourHistoricalFact[]
  currentHotspot: TourHotspot | null
  onHotspotClick: (id: string) => void
  onExit: () => void
  onAudioStateChange?: () => void
}

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const CATEGORY_LABELS: Record<TourHotspot['category'], string> = {
  gear: '齿轮',
  pendulum: '摆钟',
  spring: '发条',
  escapement: '擒纵',
  display: '表盘',
  bell: '钟铃',
  mechanism: '机关',
  panel: '控制面板',
  door: '大门',
  corridor: '走廊',
  exit: '出口',
  secret: '秘境',
  anchor: '停锚',
  historical: '历史',
}

const CATEGORY_ICONS: Record<TourHotspot['category'], string> = {
  gear: '⚙️',
  pendulum: '🎐',
  spring: '🔩',
  escapement: '🧭',
  display: '🕰️',
  bell: '🔔',
  mechanism: '🔧',
  panel: '🎛️',
  door: '🚪',
  corridor: '🏛️',
  exit: '🏁',
  secret: '✨',
  anchor: '⚓',
  historical: '📖',
}

function TourView({
  state,
  hotspots,
  facts,
  currentHotspot,
  onHotspotClick,
  onExit,
  onAudioStateChange,
}: TourViewProps) {
  const [showHotspotList, setShowHotspotList] = useState(false)
  const [showFactsPanel, setShowFactsPanel] = useState(false)
  const [audioState, setAudioState] = useState<TourAudioState | null>(state.audioState)
  const [volume, setVolume] = useState(0.8)
  const [animatingPanel, setAnimatingPanel] = useState<string | null>(null)
  const panelTimerRef = useRef<number | null>(null)

  const audio = tourSystem.getAudio()

  useEffect(() => {
    if (audio) {
      const interval = window.setInterval(() => {
        const st = audio.getState()
        setAudioState({ ...st })
        onAudioStateChange?.()
      }, 200)
      return () => window.clearInterval(interval)
    }
  }, [audio, onAudioStateChange])

  useEffect(() => {
    return () => {
      if (panelTimerRef.current) {
        window.clearTimeout(panelTimerRef.current)
      }
    }
  }, [])

  const orderedHotspots = useMemo(() => {
    return [...hotspots].sort((a, b) => a.order - b.order)
  }, [hotspots])

  const visitedCount = useMemo(() => {
    return state.visitedHotspotIds.length
  }, [state.visitedHotspotIds])

  const progressPercent = useMemo(() => {
    const total = hotspots.filter((h) => !h.isSecret).length || 1
    return Math.min(100, Math.round((visitedCount / total) * 100))
  }, [visitedCount, hotspots])

  const currentAudioTrack = useMemo(() => {
    if (!audioState || !audioState.currentTrackId) return null
    return tourSystem.getAudioTrack(audioState.currentTrackId)
  }, [audioState])

  const currentNarration = useMemo(() => {
    if (!currentHotspot) return null
    if (!currentHotspot.audioNarrationId) return null
    return tourSystem.getAudioTrack(currentHotspot.audioNarrationId)
  }, [currentHotspot])

  const nearbyHotspots = useMemo(() => {
    if (!currentHotspot || !currentHotspot.connectedHotspotIds) return []
    return hotspots.filter((h) => currentHotspot.connectedHotspotIds?.includes(h.id))
  }, [currentHotspot, hotspots])

  const triggerPanelAnimation = (panel: string) => {
    setAnimatingPanel(panel)
    if (panelTimerRef.current) window.clearTimeout(panelTimerRef.current)
    panelTimerRef.current = window.setTimeout(() => {
      setAnimatingPanel(null)
    }, 500)
  }

  const handlePlayPause = () => {
    if (!audio) return
    const st = audio.getState()
    if (st.isPlaying) {
      audio.pause()
    } else {
      audio.resume()
    }
    triggerPanelAnimation('audio')
  }

  const handleHotspotNarration = () => {
    if (!audio || !currentNarration) return
    audio.playTrack(currentNarration.id)
    triggerPanelAnimation('audio')
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audio || !audioState) return
    const percent = Number(e.target.value)
    const targetSec = (audioState.duration * percent) / 100
    audio.seek(targetSec)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    audio?.setVolume(v)
  }

  const handlePrev = () => {
    if (!audio) return
    audio.skip(-10)
  }

  const handleNext = () => {
    if (!audio) return
    audio.skip(10)
  }

  const handleAmbientToggle = () => {
    if (!audio) return
    const ambientOn = state.audioState.ambientEnabled
    audio.setAmbientEnabled(!ambientOn)
  }

  const handleNextHotspot = () => {
    const idx = orderedHotspots.findIndex((h) => h.id === state.currentHotspotId)
    const next = orderedHotspots[idx + 1]
    if (next && next.isSecret !== true) {
      onHotspotClick(next.id)
    }
  }

  const handlePrevHotspot = () => {
    const idx = orderedHotspots.findIndex((h) => h.id === state.currentHotspotId)
    const prev = orderedHotspots[idx - 1]
    if (prev) onHotspotClick(prev.id)
  }

  const displayedFacts = useMemo(() => {
    if (!currentHotspot || currentHotspot.category === 'exit') {
      return facts.slice(0, 4)
    }
    const related = facts.filter((f) =>
      f.relatedHotspotIds?.includes(currentHotspot.id),
    )
    if (related.length > 0) return related
    return facts.slice(0, 3)
  }, [currentHotspot, facts])

  const currentHotspotIndex = useMemo(() => {
    const idx = orderedHotspots.findIndex((h) => h.id === state.currentHotspotId)
    if (idx < 0) return null
    return idx + 1
  }, [orderedHotspots, state.currentHotspotId])

  return (
    <div className="tour-overlay">
      <div className="tour-top-bar">
        <div className="tour-title-panel">
          <div className="tour-title-main">
            <span className="tour-title-icon">🕰️</span>
            <span className="tour-title-text">钟楼探索之旅</span>
          </div>
          <div className="tour-subtitle">
            校时成功 · 解锁历史机械奥秘
          </div>
        </div>

        <div className="tour-progress">
          <div className="tour-progress-label">
            <span>探索进度</span>
            <span className="tour-progress-num">
              {visitedCount}/{hotspots.filter((h) => !h.isSecret).length}
            </span>
          </div>
          <div className="tour-progress-bar-wrap">
            <div
              className="tour-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="tour-score-panel">
          <div className="tour-score-label">获得积分</div>
          <div className="tour-score-value">{state.totalScoreEarned}</div>
        </div>

        <div className="tour-action-row">
          <button
            className={`tour-action-btn ${showFactsPanel ? 'active' : ''}`}
            onClick={() => setShowFactsPanel((s) => !s)}
          >
            📜 历史札记
          </button>
          <button
            className={`tour-action-btn ${showHotspotList ? 'active' : ''}`}
            onClick={() => setShowHotspotList((s) => !s)}
          >
            🗺️ 景点列表
          </button>
          <button
            className="tour-exit-btn"
            onClick={() => {
              if (window.confirm('确定要结束探索吗？')) onExit()
            }}
          >
            🚪 结束游览
          </button>
        </div>
      </div>

      <div className="tour-side-panels">
        <div
          className={`tour-hotspot-list ${showHotspotList ? 'visible' : ''} ${animatingPanel === 'hotspots' ? 'pulse' : ''}`}
        >
          <div className="tour-panel-header">
            <span>🗺️ 探索地图</span>
            <button
              className="tour-panel-close"
              onClick={() => setShowHotspotList(false)}
            >
              ✕
            </button>
          </div>
          <div className="tour-hotspot-scroll">
            {orderedHotspots.map((h) => {
              const isVisited = state.visitedHotspotIds.includes(h.id)
              const isCurrent = state.currentHotspotId === h.id
              const isLocked = h.isSecret && !isVisited

              return (
                <button
                  key={h.id}
                  className={`tour-hotspot-item ${isCurrent ? 'current' : ''} ${isVisited ? 'visited' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => !isLocked && onHotspotClick(h.id)}
                  disabled={isLocked}
                >
                  <div className="tour-hotspot-item-left">
                    <span className="tour-hotspot-order">{h.order}</span>
                    <span className="tour-hotspot-icon">
                      {isLocked ? '🔒' : CATEGORY_ICONS[h.category]}
                    </span>
                  </div>
                  <div className="tour-hotspot-item-body">
                    <div className="tour-hotspot-name">
                      {isLocked ? '未发现' : h.displayName}
                    </div>
                    <div className="tour-hotspot-cat">
                      {CATEGORY_LABELS[h.category]}
                      {h.isSecret && !isLocked ? ' · 隐藏' : ''}
                    </div>
                  </div>
                  {isVisited && <span className="tour-hotspot-check">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div
          className={`tour-facts-panel ${showFactsPanel ? 'visible' : ''} ${animatingPanel === 'facts' ? 'pulse' : ''}`}
        >
          <div className="tour-panel-header">
            <span>📜 历史札记</span>
            <button
              className="tour-panel-close"
              onClick={() => setShowFactsPanel(false)}
            >
              ✕
            </button>
          </div>
          <div className="tour-facts-scroll">
            {displayedFacts.map((f) => {
              const unlocked = state.unlockedFactIds.includes(f.id)
              return (
                <div
                  key={f.id}
                  className={`tour-fact-card ${unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="tour-fact-year">{f.year}</div>
                  <div className="tour-fact-title">{f.title}</div>
                  {unlocked ? (
                    <div className="tour-fact-content">{f.content}</div>
                  ) : (
                    <div className="tour-fact-locked">
                      🔒 访问相关景点解锁
                    </div>
                  )}
                  {unlocked && f.source && (
                    <div className="tour-fact-source">— {f.source}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="tour-bottom-area">
        {currentHotspot && currentHotspot.category !== 'exit' && (
          <div
            className={`tour-hotspot-detail ${animatingPanel === 'detail' ? 'slide-in' : ''}`}
            key={currentHotspot.id}
          >
            <div className="tour-detail-header">
              <div className="tour-detail-cat-badge">
                {CATEGORY_ICONS[currentHotspot.category]} {CATEGORY_LABELS[currentHotspot.category]}
                {currentHotspotIndex && (
                  <span className="tour-detail-index"> 第{currentHotspotIndex}站</span>
                )}
              </div>
              <div className="tour-detail-nav">
                <button
                  className="tour-nav-btn"
                  onClick={handlePrevHotspot}
                  disabled={
                    orderedHotspots.findIndex((h) => h.id === state.currentHotspotId) <= 0
                  }
                >
                  ← 上一站
                </button>
                <button
                  className="tour-nav-btn primary"
                  onClick={handleNextHotspot}
                  disabled={
                    orderedHotspots.findIndex((h) => h.id === state.currentHotspotId) >=
                    orderedHotspots.filter((h) => !h.isSecret).length - 1
                  }
                >
                  下一站 →
                </button>
              </div>
            </div>

            <div className="tour-detail-title-row">
              <h2 className="tour-detail-title">{currentHotspot.displayName}</h2>
              {currentHotspot.rewardScore &&
                currentHotspot.rewardScore > 0 &&
                !state.visitedHotspotIds.includes(currentHotspot.id) && (
                  <span className="tour-detail-reward">
                    +{currentHotspot.rewardScore} 分
                  </span>
                )}
            </div>

            <div className="tour-detail-description">{currentHotspot.description}</div>

            <div className="tour-detail-tabs">
              {currentHotspot.historicalNote && (
                <div className="tour-detail-tab-content">
                  <div className="tour-detail-tab-label">📖 历史记载</div>
                  <p className="tour-detail-note">{currentHotspot.historicalNote}</p>
                </div>
              )}
              {currentHotspot.mechanicalDetail && (
                <div className="tour-detail-tab-content">
                  <div className="tour-detail-tab-label">🔩 机械参数</div>
                  <p className="tour-detail-note">{currentHotspot.mechanicalDetail}</p>
                </div>
              )}
            </div>

            {nearbyHotspots.length > 0 && (
              <div className="tour-detail-nearby">
                <div className="tour-detail-tab-label">🔗 相关景点</div>
                <div className="tour-nearby-row">
                  {nearbyHotspots.map((nh) => (
                    <button
                      key={nh.id}
                      className={`tour-nearby-item ${state.visitedHotspotIds.includes(nh.id) ? 'visited' : ''}`}
                      onClick={() => onHotspotClick(nh.id)}
                    >
                      <span className="tour-nearby-icon">
                        {CATEGORY_ICONS[nh.category]}
                      </span>
                      <span className="tour-nearby-name">{nh.displayName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentHotspot && currentHotspot.category === 'exit' && (
          <div className="tour-hotspot-detail tour-exit-panel">
            <div className="tour-exit-title">
              <span className="tour-exit-icon">🏁</span>
              <h2>参观即将结束</h2>
            </div>
            <div className="tour-exit-stats">
              <div className="tour-exit-stat">
                <div className="tour-exit-stat-label">参观景点</div>
                <div className="tour-exit-stat-value">
                  {visitedCount}/{hotspots.filter((h) => !h.isSecret).length}
                </div>
              </div>
              <div className="tour-exit-stat">
                <div className="tour-exit-stat-label">解锁札记</div>
                <div className="tour-exit-stat-value">
                  {state.unlockedFactIds.length}/{facts.length}
                </div>
              </div>
              <div className="tour-exit-stat">
                <div className="tour-exit-stat-label">探索积分</div>
                <div className="tour-exit-stat-value">{state.totalScoreEarned}</div>
              </div>
            </div>
            <div className="tour-exit-complete">
              {progressPercent >= 100
                ? '🎉 完美参观！您已了解钟楼的全部奥秘。'
                : `您已完成 ${progressPercent}% 的参观。`}
            </div>
            <button className="tour-exit-final-btn" onClick={onExit}>
              确认离开 · 结束本次参观
            </button>
          </div>
        )}

        <div
          className={`tour-audio-player ${animatingPanel === 'audio' ? 'glow' : ''}`}
        >
          <div className="tour-audio-header">
            <div className="tour-audio-track-info">
              <div className="tour-audio-icon">
                {audioState?.isPlaying ? '🎵' : '⏸️'}
              </div>
              <div className="tour-audio-track-name">
                {currentAudioTrack
                  ? currentAudioTrack.title
                  : currentNarration
                    ? currentNarration.title
                    : '音频导览'}
              </div>
            </div>
            <div className="tour-audio-ambient-toggle">
              <button
                className={`tour-ambient-btn ${state.audioState.ambientEnabled ? 'active' : ''}`}
                onClick={handleAmbientToggle}
              >
                {state.audioState.ambientEnabled ? '🔊 环境音' : '🔇 环境音'}
              </button>
            </div>
          </div>

          {currentHotspot && currentNarration && (
            <div className="tour-audio-narration-row">
              <button
                className="tour-narration-btn"
                onClick={handleHotspotNarration}
              >
                ▶️ 播放 "{currentNarration.title}" 解说
              </button>
            </div>
          )}

          <div className="tour-audio-progress-row">
            <span className="tour-audio-time">
              {formatDuration(audioState?.currentTime || 0)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={
                audioState && audioState.duration > 0
                  ? (audioState.currentTime / audioState.duration) * 100
                  : 0
              }
              onChange={handleSeek}
              className="tour-audio-seek"
            />
            <span className="tour-audio-time">
              {formatDuration(audioState?.duration || 0)}
            </span>
          </div>

          <div className="tour-audio-controls">
            <button className="tour-audio-control-btn" onClick={handlePrev}>
              ⏪
            </button>
            <button
              className="tour-audio-play-btn"
              onClick={handlePlayPause}
            >
              {audioState?.isPlaying ? '⏸' : '▶'}
            </button>
            <button className="tour-audio-control-btn" onClick={handleNext}>
              ⏩
            </button>
            <div className="tour-audio-volume">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolume}
              />
            </div>
          </div>

          {currentAudioTrack?.transcript && (
            <div className="tour-audio-transcript">
              <div className="tour-transcript-label">💬 解说文字</div>
              <p className="tour-transcript-text">
                {currentAudioTrack.transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TourView
