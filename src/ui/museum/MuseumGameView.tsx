import { useState, useEffect, useCallback } from 'react'
import { museumNarrativeSystem } from '../../game/museum/MuseumNarrativeSystem'
import { MUSEUM_CHARACTERS, MUSEUM_BACKGROUNDS, MUSEUM_ITEMS, MUSEUM_PUZZLES } from '../../game/museum/MuseumData'
import type { DialogChoice, MuseumCharacter, MuseumItem } from '../../types/museum'
import MuseumPuzzlePanel from './MuseumPuzzlePanel'

interface MuseumGameViewProps {
  onExit: () => void
}

export default function MuseumGameView({ onExit }: MuseumGameViewProps) {
  const [tick, setTick] = useState(0)
  const forceUpdate = useCallback(() => setTick(t => t + 1), [])

  const [showMenu, setShowMenu] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showChapterSelect, setShowChapterSelect] = useState(false)
  const [showItemDetail, setShowItemDetail] = useState<MuseumItem | null>(null)
  const [typewriterText, setTypewriterText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const runtime = museumNarrativeSystem.getRuntimeState()
  const saveState = museumNarrativeSystem.getSaveState()
  const currentScene = museumNarrativeSystem.getCurrentScene()
  const currentDialog = museumNarrativeSystem.getCurrentDialogNode()
  const currentChapter = museumNarrativeSystem.getCurrentChapter()
  const currentPuzzle = runtime.currentPuzzleId ? MUSEUM_PUZZLES.find(p => p.id === runtime.currentPuzzleId) : null
  const puzzleProgress = runtime.currentPuzzleId ? museumNarrativeSystem.getPuzzleProgress(runtime.currentPuzzleId) : null

  const bgData = currentScene ? MUSEUM_BACKGROUNDS.find(b => b.id === currentScene.backgroundId) : null
  const speaker: MuseumCharacter | undefined = currentDialog?.speaker
    ? MUSEUM_CHARACTERS.find(c => c.id === currentDialog!.speaker)
    : undefined

  useEffect(() => {
    if (currentDialog?.text) {
      setIsTyping(true)
      setTypewriterText('')
      let i = 0
      const text = currentDialog.text
      const timer = setInterval(() => {
        i++
        setTypewriterText(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(timer)
          setIsTyping(false)
        }
      }, 40)
      return () => clearInterval(timer)
    } else {
      setTypewriterText('')
      setIsTyping(false)
    }
  }, [currentDialog?.id, tick])

  useEffect(() => {
    if (!museumNarrativeSystem.isInitialized()) {
      museumNarrativeSystem.initialize()
      forceUpdate()
    }
  }, [forceUpdate])

  useEffect(() => {
    const saved = museumNarrativeSystem.getSaveState()
    if (!currentScene && saved.currentSceneId) {
      museumNarrativeSystem.enterScene(saved.currentSceneId)
      forceUpdate()
    }
  }, [currentScene, forceUpdate])

  const handleAdvance = () => {
    if (isTyping) {
      setIsTyping(false)
      setTypewriterText(currentDialog?.text ?? '')
      return
    }
    if (currentScene?.type === 'ending' && currentDialog === undefined) {
      return
    }
    const result = museumNarrativeSystem.advanceDialog()
    if (result.node || result.isLast) {
      forceUpdate()
    }
  }

  const handleChoice = (choice: DialogChoice) => {
    museumNarrativeSystem.makeChoice(choice)
    forceUpdate()
  }

  const handleHotspotClick = (hotspotId: string) => {
    const result = museumNarrativeSystem.interactHotspot(hotspotId)
    if (result.foundItemId) {
      forceUpdate()
      const item = MUSEUM_ITEMS.find(i => i.id === result.foundItemId)
      if (item) {
        setTimeout(() => setShowItemDetail(item), 300)
      }
    } else {
      forceUpdate()
    }
  }

  const handleChapterSelect = (chapterId: string) => {
    museumNarrativeSystem.enterChapter(chapterId)
    setShowChapterSelect(false)
    forceUpdate()
  }

  const handleSave = (slot: number) => {
    museumNarrativeSystem.saveToSlot(slot)
    forceUpdate()
  }

  const handleLoad = (slot: number) => {
    museumNarrativeSystem.loadFromSlot(slot)
    setShowMenu(false)
    forceUpdate()
  }

  const handleDeleteSlot = (slot: number) => {
    museumNarrativeSystem.deleteSlot(slot)
    forceUpdate()
  }

  const handleReturnToTitle = () => {
    museumNarrativeSystem.reset()
    onExit()
  }

  const playTime = museumNarrativeSystem.formatPlayTime()

  if (!currentScene) {
    return (
      <div className="museum-loading">
        <div className="loading-spinner">🕰️</div>
        <p>加载钟楼博物馆中...</p>
      </div>
    )
  }

  const isEnding = currentScene.type === 'ending'
  const ending = museumNarrativeSystem.getCurrentEnding()

  return (
    <div className="museum-game-container">
      <div
        className="museum-background"
        style={{
          background: bgData?.gradient ?? bgData?.imageUrl ?? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {bgData?.decorativeElements?.map((el: any, i: number) => (
          <div
            key={i}
            className="bg-decor-element"
            style={{
              position: 'absolute',
              left: `${el.position?.x ?? 50}%`,
              top: `${el.position?.y ?? 50}%`,
              fontSize: `${(el.scale ?? 1) * 4}rem`,
              opacity: el.opacity ?? 0.5,
              filter: `blur(${el.layer === 'back' ? 3 : 0}px)`,
            }}
          >
            {el.icon}
          </div>
        ))}

        <div className="museum-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="museum-top-hud">
        <div className="hud-left">
          <span className="hud-chapter">
            📖 {currentChapter?.title ?? '钟楼博物馆'}
            {currentScene.chapterProgress !== undefined && currentChapter && (
              <span className="hud-progress">
                {' '}· {currentScene.chapterProgress}/{currentChapter.sceneIds.length}
              </span>
            )}
          </span>
        </div>
        <div className="hud-right">
          <span className="hud-time">⏱️ {playTime}</span>
          <button className="hud-btn" onClick={() => setShowInventory(true)}>
            🎒 {saveState.inventory.length}
          </button>
          <button className="hud-btn" onClick={() => setShowChapterSelect(true)}>📚</button>
          <button className="hud-btn" onClick={() => setShowMenu(true)}>⚙️</button>
        </div>
      </div>

      {!isEnding && !currentPuzzle && (
        <div className="museum-character-stage">
          {speaker && currentScene.type === 'dialog' && (
            <div
              className="character-sprite"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="character-portrait-large" style={{ borderColor: speaker.color }}>
                <span className="character-emoji" style={{ fontSize: '4rem' }}>{speaker.emoji ?? speaker.avatar ?? '👤'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {isEnding && ending && (
        <div className="museum-ending-screen">
          <div className="ending-cover" style={{ background: ending.coverGradient ?? ending.artGradient }}>
            <div className="ending-type-badge">{ending.type}</div>
            <h1 className="ending-title">{ending.title}</h1>
            <p className="ending-subtitle">{ending.subtitle}</p>
          </div>
          <div className="ending-epilogue">
            {(ending.epilogueParagraphs ?? ending.epilogue).map((p: string, i: number) => (
              <p key={i} className="epilogue-text">{p}</p>
            ))}
          </div>
          <div className="ending-stats">
            <div className="stat-row"><span>游玩时长</span><span>{playTime}</span></div>
            <div className="stat-row"><span>收集物品</span><span>{saveState.inventory.length} / {MUSEUM_ITEMS.length}</span></div>
            <div className="stat-row"><span>解锁结局</span><span>{saveState.unlockedEndings.length} / 6</span></div>
            <div className="stat-row"><span>总得分</span><span>{saveState.totalScore}</span></div>
          </div>
          <div className="ending-actions">
            <button className="ending-btn" onClick={() => { museumNarrativeSystem.returnToChapterSelect(); forceUpdate() }}>
              📚 选择章节
            </button>
            <button className="ending-btn ending-btn-primary" onClick={handleReturnToTitle}>
              🏠 返回标题
            </button>
          </div>
        </div>
      )}

      {currentPuzzle && puzzleProgress && (
        <div className="museum-puzzle-stage">
          <MuseumPuzzlePanel
            puzzle={currentPuzzle}
            progress={puzzleProgress}
            onStateChange={forceUpdate}
          />
        </div>
      )}

      {!isEnding && !currentPuzzle && currentScene.type === 'exploration' && (
        <div className="museum-exploration-stage">
          <h2 className="exploration-title">🔍 {currentScene.title}</h2>
          <div className="exploration-hotspots">
            {currentScene.explorationHotspots?.map((h: any) => {
              const found = saveState.foundHotspots.includes(h.id)
              const hx = h.position?.x ?? h.x ?? 50
              const hy = h.position?.y ?? h.y ?? 50
              return (
                <button
                  key={h.id}
                  className={`hotspot-btn ${found ? 'hotspot-found' : ''}`}
                  style={{
                    left: `${hx}%`,
                    top: `${hy}%`,
                  }}
                  onClick={() => handleHotspotClick(h.id)}
                >
                  <span className="hotspot-icon">{h.icon}</span>
                  <span className="hotspot-label">{h.name}</span>
                  {found && <span className="hotspot-check">✓</span>}
                </button>
              )
            })}
          </div>
          {runtime.currentDialogNodeId && currentDialog && (
            <div className="exploration-dialog-hint">
              继续探索 或 点击下方继续
            </div>
          )}
        </div>
      )}

      {!isEnding && !currentPuzzle && (
        <div className="museum-dialog-layer">
          {speaker && (
            <div className="dialog-speaker-bar">
              <div className="speaker-portrait" style={{ borderColor: speaker.color }}>
                <span style={{ fontSize: '1.5rem' }}>{speaker.emoji ?? speaker.avatar ?? '👤'}</span>
              </div>
              <div className="speaker-info">
                <div className="speaker-name" style={{ color: speaker.color }}>{speaker.name}</div>
                {speaker.title && <div className="speaker-title">{speaker.title}</div>}
              </div>
            </div>
          )}

          <div className="dialog-box" onClick={handleAdvance}>
            <p className="dialog-text">
              {typewriterText}
              {isTyping && <span className="typing-cursor">▌</span>}
            </p>

            {!isTyping && currentDialog?.choices && currentDialog.choices.length > 0 && (
              <div className="dialog-choices">
                {currentDialog.choices.map((c, i) => {
                  const visible = !c.condition || museumNarrativeSystem.evaluateCondition(c.condition)
                  if (!visible) return null
                  return (
                    <button
                      key={i}
                      className="choice-btn"
                      onClick={(e) => { e.stopPropagation(); handleChoice(c) }}
                    >
                      <span className="choice-index">{i + 1}.</span>
                      <span className="choice-text">{c.text}</span>
                      {c.condition?.type === 'has_item' && (
                        <span className="choice-condition">🎒 需要物品</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {!isTyping && (!currentDialog?.choices || currentDialog.choices.length === 0) && (
              <div className="dialog-continue-hint">
                {currentDialog ? '点击继续 ▶' : '点击开始 ▶'}
              </div>
            )}
          </div>
        </div>
      )}

      {showInventory && (
        <div className="modal-overlay" onClick={() => setShowInventory(false)}>
          <div className="modal-panel inventory-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎒 物品栏</h2>
              <button className="modal-close" onClick={() => setShowInventory(false)}>✕</button>
            </div>
            <div className="inventory-grid">
              {saveState.inventory.length === 0 ? (
                <p className="empty-hint">背包空空如也...去探索发现有趣的物品吧！</p>
              ) : (
                saveState.inventory.map(itemId => {
                  const item = MUSEUM_ITEMS.find(i => i.id === itemId)
                  if (!item) return null
                  return (
                    <button
                      key={itemId}
                      className="inventory-item"
                      onClick={() => setShowItemDetail(item)}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-name">{item.name}</span>
                    </button>
                  )
                })
              )}
            </div>
            <div className="inventory-footer">
              收集进度：{saveState.inventory.length} / {MUSEUM_ITEMS.length}
            </div>
          </div>
        </div>
      )}

      {showItemDetail && (
        <div className="modal-overlay" onClick={() => setShowItemDetail(null)}>
          <div className="modal-panel item-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="item-detail-header">
              <span className="item-detail-icon">{showItemDetail.icon}</span>
              <div>
                <h3>{showItemDetail.name}</h3>
                {(showItemDetail as any).rarity && (
                  <span className={`item-rarity item-rarity-${(showItemDetail as any).rarity}`}>
                    {(showItemDetail as any).rarity}
                  </span>
                )}
              </div>
              <button className="modal-close" onClick={() => setShowItemDetail(null)}>✕</button>
            </div>
            <div className="item-detail-body">
              <p className="item-description">{showItemDetail.description}</p>
              {(showItemDetail as any).lore && (
                <blockquote className="item-lore">"{(showItemDetail as any).lore}"</blockquote>
              )}
              {(showItemDetail as any).useEffectText && (
                <p className="item-effect">✨ {(showItemDetail as any).useEffectText}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showChapterSelect && (
        <div className="modal-overlay" onClick={() => setShowChapterSelect(false)}>
          <div className="modal-panel chapter-select-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📚 章节选择</h2>
              <button className="modal-close" onClick={() => setShowChapterSelect(false)}>✕</button>
            </div>
            <div className="chapters-grid">
              {museumNarrativeSystem.getAllChapters().map(ch => {
                const unlocked = museumNarrativeSystem.isChapterUnlocked(ch.id)
                const completed = saveState.completedChapters.includes(ch.id)
                return (
                  <button
                    key={ch.id}
                    className={`chapter-card ${unlocked ? '' : 'chapter-locked'} ${completed ? 'chapter-completed' : ''}`}
                    style={{ background: ch.coverGradient }}
                    disabled={!unlocked}
                    onClick={() => unlocked && handleChapterSelect(ch.id)}
                  >
                    <div className="chapter-card-header">
                      <span className="chapter-order">第{ch.order}章</span>
                      {completed && <span className="chapter-badge">✓ 完成</span>}
                      {!unlocked && <span className="chapter-badge">🔒 未解锁</span>}
                    </div>
                    <h3 className="chapter-card-title">{ch.subtitle}</h3>
                    <p className="chapter-card-desc">{ch.description}</p>
                    <div className="chapter-card-footer">
                      <span>⏱️ ~{ch.estimatedMinutes}分钟</span>
                      <span>{ch.tagline}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div className="modal-overlay" onClick={() => setShowMenu(false)}>
          <div className="modal-panel menu-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ 游戏菜单</h2>
              <button className="modal-close" onClick={() => setShowMenu(false)}>✕</button>
            </div>

            <div className="menu-section">
              <h3>💾 存档</h3>
              <div className="save-slots">
                {[1, 2, 3].map(slot => {
                  const data = museumNarrativeSystem.getSlotInfo(slot)
                  return (
                    <div key={slot} className="save-slot">
                      <div className="save-slot-info">
                        <span className="slot-label">存档 {slot}</span>
                        {data ? (
                          <>
                            <span className="slot-chapter">{data.chapterTitle}</span>
                            <span className="slot-time">{data.timestamp}</span>
                          </>
                        ) : (
                          <span className="slot-empty">空</span>
                        )}
                      </div>
                      <div className="save-slot-actions">
                        <button className="menu-btn" onClick={() => handleSave(slot)}>💾 保存</button>
                        <button className="menu-btn" onClick={() => handleLoad(slot)} disabled={!data}>📂 读取</button>
                        <button className="menu-btn menu-btn-danger" onClick={() => handleDeleteSlot(slot)} disabled={!data}>🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="menu-section">
              <h3>📊 游戏数据</h3>
              <div className="stats-grid">
                <div className="stat-item"><span>游玩时长</span><span>{playTime}</span></div>
                <div className="stat-item"><span>总得分</span><span>{saveState.totalScore}</span></div>
                <div className="stat-item"><span>收集物品</span><span>{saveState.inventory.length}/{MUSEUM_ITEMS.length}</span></div>
                <div className="stat-item"><span>解锁结局</span><span>{saveState.unlockedEndings.length}/6</span></div>
              </div>
            </div>

            <div className="menu-actions">
              <button className="menu-btn menu-btn-large" onClick={() => setShowMenu(false)}>继续游戏</button>
              <button className="menu-btn menu-btn-large menu-btn-danger" onClick={handleReturnToTitle}>返回标题</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
