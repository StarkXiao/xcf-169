import { useEffect, useRef, useState, useCallback } from 'react'
import type {
  RoguelikeGameResult,
  RoguelikePhase,
  TowerFloor,
  TowerEvent,
  TowerFloorType,
  TrapType,
  WeatherEventType,
  RewardNodeId,
} from '../../types/roguelike'
import type { ClockTime } from '../../types'
import {
  RoguelikeGameCoordinator,
} from './RoguelikeGameCoordinator'
import {
  getEventCategoryLabel,
  getEventCategoryIcon,
  getEventCategoryColor,
  TRAP_CONFIGS,
} from './EventPoolSystem'
import {
  WEATHER_EVENTS,
  getWeatherSeverityColor,
  getEffectDescription,
  type WeatherPulseEvent,
} from './WeatherEventSystem'
import {
  REWARD_NODES,
  getRarityColor,
  getRarityBg,
  getRarityLabel,
  formatEffectDescription,
} from './RewardTreeSystem'

interface RoguelikeGameProps {
  nightNumber?: number
  totalNights?: number
  onGameEnd: (result: RoguelikeGameResult) => void
  onExit: () => void
}

function formatClockTime(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

function RoguelikeGame({ nightNumber = 1, totalNights = 7, onGameEnd, onExit }: RoguelikeGameProps) {
  const coordinatorRef = useRef<RoguelikeGameCoordinator | null>(null)
  const timerRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const [phase, setPhase] = useState<RoguelikePhase>('mapView')
  const [currentFloor, setCurrentFloor] = useState<TowerFloor | null>(null)
  const [currentEvent, setCurrentEvent] = useState<TowerEvent | null>(null)
  const [currentFloorEvents, setCurrentFloorEvents] = useState<TowerEvent[]>([])
  const [map, setMap] = useState<TowerFloor[]>([])

  const [health, setHealth] = useState(100)
  const [maxHealth, setMaxHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [rewardPoints, setRewardPoints] = useState(0)
  const [floorsCleared, setFloorsCleared] = useState(0)
  const [eventsCompleted, setEventsCompleted] = useState(0)

  const [currentTime, setCurrentTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [targetTime, setTargetTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [eventTimeLeft, setEventTimeLeft] = useState(0)
  const [eventTotalTime, setEventTotalTime] = useState(0)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)

  const [activeTraps, setActiveTraps] = useState<TrapType[]>([])
  const [activeWeathers, setActiveWeathers] = useState<WeatherEventType[]>([])
  const [unlockedRewards, setUnlockedRewards] = useState<RewardNodeId[]>([])

  const [, setShowResult] = useState(false)
  const [finalResult, setFinalResult] = useState<RoguelikeGameResult | null>(null)
  const [lastEventResult, setLastEventResult] = useState<any>(null)

  const [weatherPulseAnim, setWeatherPulseAnim] = useState<WeatherPulseEvent | null>(null)
  const [targetShiftAnim, setTargetShiftAnim] = useState(false)
  const [timeJumpAnim, setTimeJumpAnim] = useState(false)

  const initCoordinator = useCallback(() => {
    const coordinator = new RoguelikeGameCoordinator(nightNumber, totalNights, {
      onPhaseChange: (p) => setPhase(p),
      onStateChange: (state) => {
        setHealth(state.health)
        setMaxHealth(state.maxHealth)
        setScore(state.score)
        setTotalScore(state.totalScore)
        setRewardPoints(state.rewardTree.points)
        setFloorsCleared(state.floorsCleared)
        setEventsCompleted(state.eventsCompleted)
        setMap([...state.map])
        setActiveTraps(state.activeTraps.map((t) => t.trapId))
        setActiveWeathers(state.activeWeathers.map((w) => w.weatherId))
        setCurrentEventIndex(state.currentEventIndex)
        const unlocked = Array.from(state.rewardTree.unlockedNodes.keys())
        setUnlockedRewards(unlocked)
      },
      onFloorChange: (f) => {
        setCurrentFloor(f)
        setCurrentFloorEvents(coordinator.getCurrentFloorEvents())
      },
      onEventChange: (e) => {
        setCurrentEvent(e)
        if (e) {
          setEventTimeLeft(coordinator.getEventTimeLeft())
          setEventTotalTime(coordinator.getEventTotalTime())
          setCurrentTime(coordinator.getCurrentTime())
          setTargetTime(coordinator.getTargetTime())
        }
      },
      onGameOver: (result) => {
        setFinalResult(result)
        setShowResult(true)
      },
      onVictory: (result) => {
        setFinalResult(result)
        setShowResult(true)
      },
      onWeatherPulse: (pulse) => {
        setWeatherPulseAnim(pulse)
        setTimeout(() => setWeatherPulseAnim(null), 800)
      },
      onTargetShift: (newTarget, _shiftAmount) => {
        setTargetTime({ ...newTarget })
        setTargetShiftAnim(true)
        setTimeout(() => setTargetShiftAnim(false), 600)
      },
      onTimeJump: (newTime, _jumpAmount) => {
        setCurrentTime({ ...newTime })
        setTimeJumpAnim(true)
        setTimeout(() => setTimeJumpAnim(false), 500)
      },
    })

    coordinatorRef.current = coordinator
    const state = coordinator.getState()
    setMap([...state.map])
    const floor = coordinator.getCurrentFloor()
    if (floor) {
      setCurrentFloor(floor)
      setCurrentFloorEvents(coordinator.getCurrentFloorEvents())
    }
    setHealth(state.health)
    setMaxHealth(state.maxHealth)
    setRewardPoints(state.rewardTree.points)
  }, [nightNumber, totalNights])

  useEffect(() => {
    initCoordinator()
    return () => {
      coordinatorRef.current?.destroy()
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [initCoordinator])

  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current)
        timerRef.current = null
      }
      return
    }

    lastTickRef.current = performance.now()
    const loop = (now: number) => {
      const delta = now - lastTickRef.current
      lastTickRef.current = now

      const coord = coordinatorRef.current
      if (!coord) return

      coord.updateEventTime(delta)
      setEventTimeLeft(coord.getEventTimeLeft())

      if (coord.checkEventComplete()) {
        const result = coord.completeEvent(true)
        setLastEventResult(result)
      }

      timerRef.current = requestAnimationFrame(loop)
    }
    timerRef.current = requestAnimationFrame(loop)

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current)
    }
  }, [phase])

  const handleGearClick = useCallback((gearId: number, direction: 1 | -1) => {
    const coord = coordinatorRef.current
    if (!coord || phase !== 'playing') return

    const gearDeltas: Record<number, number> = { 1: 60, 2: 15, 3: 5, 4: 30 }
    let delta = gearDeltas[gearId] || 15
    delta *= direction

    const state = coord.getState()
    const activeTrap = state.activeTraps.find((t) => t.gearId === gearId)
    if (activeTrap) {
      const config = TRAP_CONFIGS[activeTrap.trapId]
      if (config) {
        switch (config.faultType) {
          case 'jam':
          case 'freeze':
            return
          case 'reverse':
            delta = -delta
            break
          case 'slip':
            delta = Math.floor(delta * 0.5)
            break
        }
      }
    }

    const newTime = coord.tickClock(delta)
    setCurrentTime({ ...newTime })
  }, [phase])

  const handleSelectFloor = useCallback((floorId: string) => {
    coordinatorRef.current?.selectFloor(floorId)
  }, [])

  const handleStartEvent = useCallback((eventIndex: number) => {
    const coord = coordinatorRef.current
    if (!coord) return
    coord.startEvent(eventIndex)
    setTimeout(() => {
      setEventTimeLeft(coord.getEventTimeLeft())
      setEventTotalTime(coord.getEventTotalTime())
      setCurrentTime(coord.getCurrentTime())
      setTargetTime(coord.getTargetTime())
    }, 50)
  }, [])

  const handleGoToRewardSelect = useCallback(() => {
    coordinatorRef.current?.goToRewardSelect()
  }, [])

  const handlePurchaseReward = useCallback((rewardId: RewardNodeId) => {
    coordinatorRef.current?.purchaseReward(rewardId)
  }, [])

  const handleAdvance = useCallback(() => {
    coordinatorRef.current?.advanceToNextEvent()
  }, [])

  const handleAdvanceFromFloor = useCallback(() => {
    coordinatorRef.current?.advanceFromFloorComplete()
  }, [])

  const handleConfirmComplete = useCallback(() => {
    const coord = coordinatorRef.current
    if (!coord) return
    const result = coord.completeEvent(false)
    setLastEventResult(result)
  }, [])

  const handleGameEndResult = useCallback(() => {
    if (finalResult) {
      onGameEnd(finalResult)
    }
  }, [finalResult, onGameEnd])

  const getFloorBgColor = (type: TowerFloorType) => {
    const colors: Record<TowerFloorType, string> = {
      entrance: 'linear-gradient(135deg, #1e293b, #334155)',
      gearRoom: 'linear-gradient(135deg, #3f3f46, #52525b)',
      clockFace: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      bellChamber: 'linear-gradient(135deg, #581c87, #7c3aed)',
      mechanismRoom: 'linear-gradient(135deg, #7c2d12, #ea580c)',
      observationDeck: 'linear-gradient(135deg, #0c4a6e, #0284c7)',
      attic: 'linear-gradient(135deg, #422006, #a16207)',
      topSpire: 'linear-gradient(135deg, #450a0a, #dc2626)',
    }
    return colors[type] || colors.entrance
  }

  const getDifficultyStars = (diff: number) => {
    return '⭐'.repeat(Math.min(5, Math.max(1, diff)))
  }

  const renderHealthBar = () => (
    <div className="rl-health-bar">
      <div className="rl-health-label">
        ❤️ 生命 {health}/{maxHealth}
      </div>
      <div className="rl-health-track">
        <div
          className="rl-health-fill"
          style={{
            width: `${(health / maxHealth) * 100}%`,
            backgroundColor: health > maxHealth * 0.5 ? '#ef4444' : health > maxHealth * 0.25 ? '#f97316' : '#dc2626',
          }}
        />
      </div>
    </div>
  )

  const renderTopBar = () => (
    <div className="rl-top-bar">
      <button className="rl-exit-btn" onClick={onExit}>
        ← 退出巡夜
      </button>
      <div className="rl-header-info">
        <h2 className="rl-title">🏰 钟楼巡检 · 第{nightNumber}夜</h2>
        <div className="rl-progress-info">
          <span>楼层 {currentFloor?.level || 1}/{map.length}</span>
          <span>·</span>
          <span>已完成 {eventsCompleted} 事件</span>
          <span>·</span>
          <span>通过 {floorsCleared} 层</span>
        </div>
      </div>
      <div className="rl-score-display">
        <div className="rl-total-score">🏆 {totalScore}</div>
        <div className="rl-reward-points">🔷 奖励点: {rewardPoints}</div>
      </div>
    </div>
  )

  const renderMapView = () => (
    <div className="rl-map-view">
      <div className="rl-map-sidebar">
        {renderHealthBar()}
        {currentFloor && (
          <div className="rl-current-floor-info" style={{ background: getFloorBgColor(currentFloor.type) }}>
            <div className="rl-floor-icon">{currentFloor.icon}</div>
            <div className="rl-floor-name">{currentFloor.displayName}</div>
            <div className="rl-floor-desc">{currentFloor.description}</div>
            <div className="rl-floor-meta">
              <span className="rl-difficulty" style={{ color: getEventCategoryColor(currentFloor.level >= 6 ? 'boss' : 'elite') }}>
                {getDifficultyStars(currentFloor.difficulty)}
              </span>
              <span>{currentFloor.eventCount}个事件</span>
              {currentFloor.hasTreasure && <span>💎 有宝藏</span>}
            </div>
          </div>
        )}
      </div>

      <div className="rl-map-main">
        <div className="rl-tower-visual">
          <div className="rl-tower-structure">
            {[...map].reverse().map((floor) => (
              <div
                key={floor.id}
                className={`rl-tower-floor
                  ${floor.id === currentFloor?.id ? 'current' : ''}
                  ${floor.cleared ? 'cleared' : ''}
                  ${floor.unlocked ? 'unlocked' : 'locked'}`}
                style={{ background: getFloorBgColor(floor.type) }}
                onClick={() => floor.unlocked && handleSelectFloor(floor.id)}
              >
                <div className="rl-tower-floor-level">第{floor.level}层</div>
                <div className="rl-tower-floor-icon">{floor.icon}</div>
                <div className="rl-tower-floor-name">{floor.displayName}</div>
                <div className="rl-tower-floor-status">
                  {floor.cleared ? '✅' : floor.id === currentFloor?.id ? '📍' : floor.unlocked ? '🔓' : '🔒'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rl-events-panel">
          <h3>📋 {currentFloor?.displayName} - 事件列表</h3>
          <div className="rl-events-list">
            {currentFloorEvents.map((event, idx) => {
              const eventResult = coordinatorRef.current?.getSettlementSystem().getEventResult(event.id)
              const isCompleted = !!eventResult
              const isLocked = idx > 0 && !coordinatorRef.current?.getSettlementSystem().getEventResult(currentFloorEvents[idx - 1]?.id)
              return (
                <div
                  key={event.id}
                  className={`rl-event-card
                    ${isCompleted ? 'completed' : ''}
                    ${isLocked ? 'locked' : ''}
                    ${idx === currentEventIndex ? 'active' : ''}`}
                  style={{ borderLeftColor: getEventCategoryColor(event.category) }}
                  onClick={() => !isLocked && !isCompleted && handleStartEvent(idx)}
                >
                  <div className="rl-event-header">
                    <span className="rl-event-category" style={{ backgroundColor: getEventCategoryColor(event.category) }}>
                      {getEventCategoryIcon(event.category)} {getEventCategoryLabel(event.category)}
                    </span>
                    <span className="rl-event-difficulty">{getDifficultyStars(event.difficulty)}</span>
                  </div>
                  <div className="rl-event-title">{event.displayName}</div>
                  <div className="rl-event-desc">{event.description}</div>
                  <div className="rl-event-meta">
                    <span>⏱ {event.duration}秒</span>
                    {event.traps && event.traps.length > 0 && (
                      <span className="rl-trap-badge">🪤 陷阱×{event.traps.length}</span>
                    )}
                    {event.weatherTriggers && event.weatherTriggers.length > 0 && (
                      <span className="rl-weather-badge">🌤 天气×{event.weatherTriggers.length}</span>
                    )}
                  </div>
                  {isCompleted && (
                    <div className={`rl-event-status ${eventResult?.success ? 'success' : 'fail'}`}>
                      {eventResult?.success ? (eventResult?.isPerfect ? '💯 完美' : '✅ 完成') : '❌ 失败'}
                      {eventResult && ` +${eventResult.scoreGained}分`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  const renderEventIntro = () => (
    <div className="rl-event-intro">
      <div className="rl-intro-card">
        {currentEvent && (
          <>
            <div
              className="rl-intro-category"
              style={{ backgroundColor: getEventCategoryColor(currentEvent.category) }}
            >
              {getEventCategoryIcon(currentEvent.category)} {getEventCategoryLabel(currentEvent.category)}
            </div>
            <h2 className="rl-intro-title">{currentEvent.displayName}</h2>
            <p className="rl-intro-desc">{currentEvent.description}</p>
            <div className="rl-intro-details">
              <div className="rl-intro-row">
                <span>难度：</span>
                <span>{getDifficultyStars(currentEvent.difficulty)}</span>
              </div>
              <div className="rl-intro-row">
                <span>时限：</span>
                <span>{currentEvent.duration} 秒</span>
              </div>
              <div className="rl-intro-row">
                <span>要求精度：</span>
                <span>±{currentEvent.requiredAccuracy || 30} 分钟</span>
              </div>
              {currentEvent.traps && currentEvent.traps.length > 0 && (
                <div className="rl-intro-row">
                  <span>⚠️ 陷阱：</span>
                  <div className="rl-trap-list">
                    {currentEvent.traps.map((t) => (
                      <span key={t} className="rl-trap-chip">
                        🪤 {TRAP_CONFIGS[t]?.displayName || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentEvent.weatherTriggers && currentEvent.weatherTriggers.length > 0 && (
                <div className="rl-intro-row">
                  <span>🌤 天气：</span>
                  <div className="rl-weather-list">
                    {currentEvent.weatherTriggers.map((w) => (
                      <span
                        key={w}
                        className="rl-weather-chip"
                        style={{ borderColor: getWeatherSeverityColor(WEATHER_EVENTS[w]?.severity || 'low') }}
                      >
                        {WEATHER_EVENTS[w]?.icon} {WEATHER_EVENTS[w]?.displayName || w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentEvent.rewards && currentEvent.rewards.length > 0 && (
                <div className="rl-intro-row">
                  <span>🎁 奖励：</span>
                  <div className="rl-reward-list">
                    {currentEvent.rewards.map((r) => {
                      const node = REWARD_NODES[r]
                      return (
                        <span
                          key={r}
                          className="rl-reward-chip"
                          style={{
                            borderColor: node ? getRarityColor(node.rarity) : '#94a3b8',
                            backgroundColor: node ? getRarityBg(node.rarity) : 'transparent',
                          }}
                        >
                          {node?.icon} {node?.displayName || r}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="rl-intro-countdown">⚙️ 准备开始...</div>
          </>
        )}
      </div>
    </div>
  )

  const renderPlaying = () => {
    const diff = coordinatorRef.current?.getTimeDiffMinutes() || 999
    const tolerance = 5 + (coordinatorRef.current?.getRewardTree().getToleranceBonus() || 0)
    const isClose = diff <= tolerance * 3
    const isVeryClose = diff <= tolerance
    const timeRatio = eventTotalTime > 0 ? eventTimeLeft / eventTotalTime : 0

    return (
      <div className="rl-playing-view">
        {weatherPulseAnim && (
          <div className={`rl-weather-flash ${weatherPulseAnim.type}`}>
            <div className="rl-flash-content">
              {weatherPulseAnim.type === 'targetShift' && '👻 目标飘移！'}
              {weatherPulseAnim.type === 'timeJump' && '⚡ 惊雷轰鸣！'}
              {weatherPulseAnim.type === 'faultTrigger' && '🌧️ 故障产生！'}
            </div>
          </div>
        )}
        <div className="rl-playing-sidebar">
          {renderHealthBar()}
          <div className="rl-timer-section">
            <div className={`rl-timer ${eventTimeLeft <= 10 ? 'danger' : ''}`}>
              ⏱ {Math.ceil(eventTimeLeft)}s
            </div>
            <div className="rl-timer-bar">
              <div
                className="rl-timer-fill"
                style={{
                  width: `${timeRatio * 100}%`,
                  backgroundColor: timeRatio > 0.5 ? '#4ade80' : timeRatio > 0.25 ? '#fbbf24' : '#ef4444',
                }}
              />
            </div>
          </div>

          <div className="rl-clock-display">
            <div className={`rl-clock-target ${targetShiftAnim ? 'shifting' : ''}`}>
              <div className="rl-clock-label">🎯 目标时间</div>
              <div className="rl-clock-value target">{formatClockTime(targetTime)}</div>
              {targetShiftAnim && <div className="rl-shift-indicator">👻 飘移中...</div>}
            </div>
            <div className={`rl-clock-current ${isVeryClose ? 'perfect' : isClose ? 'close' : ''} ${timeJumpAnim ? 'jumping' : ''}`}>
              <div className="rl-clock-label">🕐 当前时间</div>
              <div className="rl-clock-value">{formatClockTime(currentTime)}</div>
              {timeJumpAnim && <div className="rl-jump-indicator">⚡ 雷击！</div>}
            </div>
            <div className={`rl-diff-display ${isVeryClose ? 'perfect' : isClose ? 'close' : ''}`}>
              差值: ±{diff}分钟
              <div className="rl-tolerance-hint">(容差 ±{tolerance}分钟)</div>
            </div>
          </div>

          {activeTraps.length > 0 && (
            <div className="rl-active-traps">
              <div className="rl-section-title">🪤 活动陷阱</div>
              {activeTraps.map((t, idx) => {
                const config = TRAP_CONFIGS[t]
                return (
                  <div key={`${t}-${idx}`} className="rl-active-trap">
                    <span className="rl-trap-name">{config?.displayName || t}</span>
                    <span className="rl-trap-effect">{config?.description?.slice(0, 15)}...</span>
                  </div>
                )
              })}
            </div>
          )}

          {activeWeathers.length > 0 && (
            <div className="rl-active-weathers">
              <div className="rl-section-title">🌤 活动天气</div>
              {activeWeathers.map((w) => {
                const config = WEATHER_EVENTS[w]
                if (!config) return null
                return (
                  <div
                    key={w}
                    className="rl-active-weather"
                    style={{ borderLeftColor: getWeatherSeverityColor(config.severity) }}
                  >
                    <span className="rl-weather-icon">{config.icon}</span>
                    <div>
                      <span className="rl-weather-name">{config.displayName}</span>
                      <span className="rl-weather-effect">{getEffectDescription(config.effect)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rl-playing-main">
          <div className="rl-gear-area">
            <h3>⚙️ 齿轮操作</h3>
            <p className="rl-gear-hint">点击齿轮右半边→前进时间，左半边→后退时间</p>
            <div className="rl-gears-grid">
              {[
                { id: 1, name: '大齿轮', delta: '±60分钟', size: 'large' },
                { id: 2, name: '中齿轮', delta: '±15分钟', size: 'medium' },
                { id: 3, name: '小齿轮', delta: '±5分钟', size: 'small' },
                { id: 4, name: '侧齿轮', delta: '±30分钟', size: 'side' },
              ].map((gear) => {
                const state = coordinatorRef.current?.getState()
                const hasTrap = state?.activeTraps.some((at) => at.gearId === gear.id)
                return (
                  <div key={gear.id} className={`rl-gear-control ${gear.size} ${hasTrap ? 'faulty' : ''}`}>
                    <div className="rl-gear-name">{gear.name}</div>
                    <div className="rl-gear-delta">{gear.delta}</div>
                    <div className="rl-gear-buttons">
                      <button
                        className="rl-gear-btn left"
                        onClick={() => handleGearClick(gear.id, -1)}
                      >
                        ← 后退
                      </button>
                      <div className={`rl-gear-visual ${hasTrap ? 'jammed' : ''}`}>
                        ⚙️
                      </div>
                      <button
                        className="rl-gear-btn right"
                        onClick={() => handleGearClick(gear.id, 1)}
                      >
                        前进 →
                      </button>
                    </div>
                    {hasTrap && <div className="rl-gear-fault-warn">⚠️ 故障中</div>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rl-actions-area">
            <button
              className="rl-complete-btn"
              onClick={handleConfirmComplete}
            >
              ⏹ 强制结算
            </button>
            {currentEvent && (
              <div className="rl-current-event-info" style={{ borderLeftColor: getEventCategoryColor(currentEvent.category) }}>
                <div className="rl-event-tag">{getEventCategoryIcon(currentEvent.category)} {currentEvent.displayName}</div>
                <div className="rl-event-score">本次得分: {score}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderEventResult = () => (
    <div className="rl-result-view">
      <div className="rl-result-card">
        {lastEventResult && (
          <>
            <div className={`rl-result-header ${lastEventResult.success ? 'success' : 'fail'}`}>
              {lastEventResult.isPerfect ? '💯 完美校准！' : lastEventResult.success ? '✅ 事件完成' : '❌ 事件失败'}
            </div>
            <h2 className="rl-result-title">{currentEvent?.displayName}</h2>
            <div className="rl-result-stats">
              <div className="rl-stat-item">
                <span className="stat-label">获得分数</span>
                <span className="stat-value good">+{lastEventResult.scoreGained}</span>
              </div>
              <div className="rl-stat-item">
                <span className="stat-label">时间精度</span>
                <span className={`stat-value ${lastEventResult.accuracy >= 90 ? 'good' : lastEventResult.accuracy >= 60 ? 'warn' : 'bad'}`}>
                  {lastEventResult.accuracy}%
                </span>
              </div>
              <div className="rl-stat-item">
                <span className="stat-label">时间差</span>
                <span className={`stat-value ${lastEventResult.diffMinutes <= 5 ? 'good' : lastEventResult.diffMinutes <= 30 ? 'warn' : 'bad'}`}>
                  ±{lastEventResult.diffMinutes}分钟
                </span>
              </div>
              <div className="rl-stat-item">
                <span className="stat-label">剩余时间</span>
                <span className="stat-value">{Math.ceil(lastEventResult.timeRemaining)}s</span>
              </div>
              {lastEventResult.damageTaken > 0 && (
                <div className="rl-stat-item">
                  <span className="stat-label">受到伤害</span>
                  <span className="stat-value bad">-{lastEventResult.damageTaken} HP</span>
                </div>
              )}
            </div>
            {lastEventResult.rewardsEarned.length > 0 && (
              <div className="rl-result-rewards">
                <div className="rl-section-title">🎁 获得奖励</div>
                <div className="rl-rewards-grid">
                  {lastEventResult.rewardsEarned.map((r: RewardNodeId) => {
                    const node = REWARD_NODES[r]
                    if (!node) return null
                    return (
                      <div
                        key={r}
                        className="rl-reward-earned"
                        style={{
                          borderColor: getRarityColor(node.rarity),
                          backgroundColor: getRarityBg(node.rarity),
                        }}
                      >
                        <span className="rl-reward-earned-icon">{node.icon}</span>
                        <div>
                          <div className="rl-reward-earned-name">{node.displayName}</div>
                          <div className="rl-reward-earned-rarity" style={{ color: getRarityColor(node.rarity) }}>
                            {getRarityLabel(node.rarity)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <button className="rl-next-btn" onClick={handleGoToRewardSelect}>
              前往奖励选择 →
            </button>
          </>
        )}
      </div>
    </div>
  )

  const renderRewardSelect = () => {
    const coord = coordinatorRef.current
    const availableRewards = coord?.getRewardTree().getAvailableNodes() || []
    const unlockedMap = coord?.getRewardTree().getState().unlockedNodes || new Map()

    return (
      <div className="rl-reward-select">
        <div className="rl-reward-header">
          <h2>🔷 奖励树</h2>
          <div className="rl-reward-points-display">
            可用点数: <strong>{rewardPoints}</strong>
          </div>
        </div>

        <div className="rl-reward-tree">
          <div className="rl-reward-section">
            <div className="rl-section-title">🟢 可购买</div>
            {availableRewards.length === 0 ? (
              <div className="rl-empty-reward">点数不足或没有可购买的奖励</div>
            ) : (
              <div className="rl-rewards-grid">
                {availableRewards.map((node) => {
                  const stacks = unlockedMap.get(node.id) || 0
                  return (
                    <div
                      key={node.id}
                      className="rl-reward-card available"
                      style={{
                        borderColor: getRarityColor(node.rarity),
                        backgroundColor: getRarityBg(node.rarity),
                      }}
                      onClick={() => handlePurchaseReward(node.id)}
                    >
                      <div className="rl-reward-card-header">
                        <span className="rl-reward-card-icon">{node.icon}</span>
                        <span className="rl-reward-card-rarity" style={{ color: getRarityColor(node.rarity) }}>
                          {getRarityLabel(node.rarity)}
                        </span>
                      </div>
                      <div className="rl-reward-card-name">{node.displayName}</div>
                      <div className="rl-reward-card-desc">{node.description}</div>
                      <div className="rl-reward-card-effect">
                        {formatEffectDescription(node.effect.type, node.effect.value, 1)}
                      </div>
                      <div className="rl-reward-card-footer">
                        <span className="rl-reward-cost">🔷 {node.cost}</span>
                        <span className="rl-reward-stacks">{stacks}/{node.maxStacks}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {unlockedRewards.length > 0 && (
            <div className="rl-reward-section">
              <div className="rl-section-title">✅ 已获得</div>
              <div className="rl-rewards-grid">
                {unlockedRewards.map((r) => {
                  const node = REWARD_NODES[r]
                  if (!node) return null
                  const stacks = unlockedMap.get(r) || 0
                  return (
                    <div
                      key={r}
                      className="rl-reward-card owned"
                      style={{
                        borderColor: getRarityColor(node.rarity),
                        backgroundColor: getRarityBg(node.rarity),
                      }}
                    >
                      <div className="rl-reward-card-header">
                        <span className="rl-reward-card-icon">{node.icon}</span>
                        <span className="rl-reward-card-rarity" style={{ color: getRarityColor(node.rarity) }}>
                          {getRarityLabel(node.rarity)}
                        </span>
                      </div>
                      <div className="rl-reward-card-name">{node.displayName}</div>
                      <div className="rl-reward-card-effect">
                        {formatEffectDescription(node.effect.type, node.effect.value, stacks)}
                      </div>
                      <div className="rl-reward-card-footer">
                        <span className="rl-reward-stacks-owned">层数 {stacks}/{node.maxStacks}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <button className="rl-advance-btn" onClick={handleAdvance}>
          继续探索 →
        </button>
      </div>
    )
  }

  const renderFloorComplete = () => {
    const coord = coordinatorRef.current
    const sys = coord?.getSettlementSystem()
    const result = currentFloor ? sys?.getFloorResult(currentFloor.id) : null
    const grade = coord?.getGrade()

    return (
      <div className="rl-floor-complete">
        <div className="rl-floor-complete-card">
          <div className="rl-complete-header success">
            🏆 {currentFloor?.displayName} - 通过！
          </div>
          {grade && (
            <div className="rl-grade-display" style={{ color: grade.color }}>
              评级: {grade.grade}
            </div>
          )}
          {result && (
            <div className="rl-complete-stats">
              <div className="rl-stat-item">
                <span className="stat-label">事件完成</span>
                <span className="stat-value good">{result.eventsCleared}/{result.totalEvents}</span>
              </div>
              <div className="rl-stat-item">
                <span className="stat-label">完美数</span>
                <span className="stat-value good">💯 {result.perfectCount}</span>
              </div>
              <div className="rl-stat-item">
                <span className="stat-label">本层得分</span>
                <span className="stat-value good">+{result.scoreGained}</span>
              </div>
              <div className="rl-stat-item">
                <span className="stat-label">累计分</span>
                <span className="stat-value">🏆 {totalScore}</span>
              </div>
              {result.damageTaken > 0 && (
                <div className="rl-stat-item">
                  <span className="stat-label">受到伤害</span>
                  <span className="stat-value bad">-{result.damageTaken}</span>
                </div>
              )}
            </div>
          )}
          <div className="rl-points-earned">
            🔷 获得奖励点: +{1 + Math.floor((result?.eventsCleared || 0) / 2)}
          </div>
          <button className="rl-advance-btn" onClick={handleAdvanceFromFloor}>
            {map.length === floorsCleared + 1 && currentFloor?.level === map.length ? '完成巡夜 →' : '前往下一层 →'}
          </button>
        </div>
      </div>
    )
  }

  const renderGameOver = () => {
    const coord = coordinatorRef.current
    const achievements = coord?.getAchievements() || []
    const tips = coord?.getRunTips() || []
    const grade = coord?.getGrade()

    return (
      <div className="rl-gameover-view">
        <div className="rl-gameover-card">
          <div className={`rl-gameover-header ${finalResult?.victory ? 'victory' : 'defeat'}`}>
            {finalResult?.victory ? '🏆 巡夜成功！' : '💀 巡夜失败'}
          </div>
          {grade && (
            <div className="rl-grade-display big" style={{ color: grade.color }}>
              最终评级: {grade.grade}
            </div>
          )}

          <div className="rl-gameover-stats">
            <div className="rl-stat-row">
              <span>🏆 总分数</span>
              <strong>{finalResult?.totalScore}</strong>
            </div>
            <div className="rl-stat-row">
              <span>🏰 通过楼层</span>
              <strong>{finalResult?.floorsCleared}/{map.length}</strong>
            </div>
            <div className="rl-stat-row">
              <span>⚙️ 完成事件</span>
              <strong>{finalResult?.eventsCompleted}</strong>
            </div>
            <div className="rl-stat-row">
              <span>💯 完美校准</span>
              <strong>{finalResult?.perfectEvents}次</strong>
            </div>
            <div className="rl-stat-row">
              <span>🪤 触发陷阱</span>
              <strong>{finalResult?.trapsTriggered}次</strong>
            </div>
            <div className="rl-stat-row">
              <span>🌤 遭遇天气</span>
              <strong>{finalResult?.weathersEncountered}次</strong>
            </div>
            <div className="rl-stat-row">
              <span>❤️ 剩余生命</span>
              <strong>{finalResult?.healthRemaining}/{finalResult?.maxHealth}</strong>
            </div>
          </div>

          {achievements.length > 0 && (
            <div className="rl-achievements">
              <div className="rl-section-title">🏅 获得成就</div>
              <div className="rl-achievements-grid">
                {achievements.map((a) => (
                  <div key={a.id} className="rl-achievement">
                    <span className="rl-achievement-icon">{a.icon}</span>
                    <div>
                      <div className="rl-achievement-name">{a.name}</div>
                      <div className="rl-achievement-desc">{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rl-tips-section">
            <div className="rl-section-title">💡 巡夜笔记</div>
            <ul>
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <button className="rl-final-btn" onClick={handleGameEndResult}>
            返回主菜单
          </button>
        </div>
      </div>
    )
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case 'mapView':
        return renderMapView()
      case 'eventIntro':
        return renderEventIntro()
      case 'playing':
        return renderPlaying()
      case 'eventResult':
        return renderEventResult()
      case 'rewardSelect':
        return renderRewardSelect()
      case 'floorComplete':
        return renderFloorComplete()
      case 'gameOver':
      case 'victory':
        return renderGameOver()
      default:
        return null
    }
  }

  return (
    <div className="roguelike-game-container">
      {renderTopBar()}
      <div className="rl-game-content">
        {renderPhaseContent()}
      </div>
    </div>
  )
}

export default RoguelikeGame
