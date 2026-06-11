import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { MainScene, GEAR_CONFIGS, TOTAL_TIME } from './MainScene'
import { GearSystem } from './GearSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import { NightPatrolSystem, NIGHT_PERIODS } from './NightPatrolSystem'
import { StormSystem } from './StormSystem'
import { workshopSystem } from './WorkshopSystem'
import { keeperDiarySystem } from './KeeperDiarySystem'
import { bellChimeEvaluationSystem } from './BellChimeEvaluationSystem'
import { tourSystem } from './tour/TourSystem'
import { GearFaultSystem } from './GearFaultSystem'
import { difficultySystem } from './DifficultySystem'
import GameHUD from '../ui/GameHUD'
import TourView from '../ui/TourView'
import type { GameResult, ClockTime, GameMode, WeatherState, ActiveGearFault, PeriodConfig, GearFaultType, WorkshopEffects, StormState, LightningStrikeEffect, StormStats, RepairToolType, ActiveRepair, FaultRepairResult, GearFaultHint, DifficultyLevel } from '../types'
import type { TourState, TourHotspot, TourProgress } from '../types/tour'

interface GameProps {
  onGameEnd: (result: GameResult) => void
  mode: GameMode
}

function formatTimeStr(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

function Game({ onGameEnd, mode }: GameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const gearSystemRef = useRef<GearSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<MainScene | null>(null)
  const patrolRef = useRef<NightPatrolSystem | null>(null)
  const stormRef = useRef<StormSystem | null>(null)

  const isPatrolMode = mode === 'patrol'

  const [timeLeft, setTimeLeft] = useState(isPatrolMode ? NIGHT_PERIODS[0].duration : TOTAL_TIME)
  const [totalTime, setTotalTime] = useState(isPatrolMode ? NIGHT_PERIODS[0].duration : TOTAL_TIME)
  const [currentTime, setCurrentTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [targetTime, setTargetTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameEnded, setGameEnded] = useState(false)

  const [currentPeriod, setCurrentPeriod] = useState<PeriodConfig | null>(
    isPatrolMode ? NIGHT_PERIODS[0] : null,
  )
  const [periodIndex, setPeriodIndex] = useState(0)
  const [weather, setWeather] = useState<WeatherState>({
    rain: 'calm',
    wind: 'calm',
    lightning: 'calm',
  })
  const [faults, setFaults] = useState<ActiveGearFault[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const [workshopEffects, setWorkshopEffects] = useState<WorkshopEffects>(
    workshopSystem.getEffects(),
  )
  const [stormState, setStormState] = useState<StormState | null>(null)
  const [stormScoreImpact, setStormScoreImpact] = useState(0)

  const gearFaultSystemRef = useRef<GearFaultSystem | null>(null)
  const [repairMode, setRepairMode] = useState(false)
  const [selectedRepairTool, setSelectedRepairTool] = useState<RepairToolType | null>(null)
  const [activeRepairs, setActiveRepairs] = useState<{ gearId: number; progress: number; toolType: string }[]>([])
  const [toolCooldowns, setToolCooldowns] = useState<Record<string, number>>({})
  const [faultHints, setFaultHints] = useState<GearFaultHint[]>([])
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal')

  const [tourActive, setTourActive] = useState(false)
  const [tourState, setTourState] = useState<TourState | null>(null)
  const [tourProgress, setTourProgress] = useState<TourProgress | null>(null)
  const [currentTourHotspot, setCurrentTourHotspot] = useState<TourHotspot | null>(null)

  const calculateClassicScore = useCallback((remaining: number, diffMinutes: number) => {
    const diEffects = keeperDiarySystem.getEffects()
    const accuracyBonus = Math.max(0, (360 - diffMinutes) * 2)
    const timeBonus = Math.floor(remaining * 5 * diEffects.timeBonusMultiplier)
    const perfectBonus = diffMinutes === 0 ? 1000 : 0
    const baseScore = accuracyBonus + timeBonus + perfectBonus
    return Math.floor(baseScore * diEffects.scoreMultiplier)
  }, [])

  const handlePeriodComplete = useCallback(() => {
    if (gameEnded) return

    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current
    const patrol = patrolRef.current
    if (!gs || !timer || !sound || !scene || !patrol) return

    const remaining = timer.getTimeLeft()
    timer.pause()
    setTimeLeft(remaining)

    const diffMinutes = gs.getTimeDiffMinutes()

    const diEffects = keeperDiarySystem.getEffects()
    const baseScore = Math.floor(500 * diEffects.scoreMultiplier)
    const accuracyBonus = Math.max(0, Math.floor((360 - diffMinutes) * 2 * diEffects.scoreMultiplier))
    const timeBonus = Math.floor(remaining * 5 * diEffects.timeBonusMultiplier * diEffects.scoreMultiplier)
    const periodBonus = Math.floor(300 * (patrol.getPeriodIndex() + 1) * diEffects.scoreMultiplier)

    patrol.accumulatePeriodScore(baseScore, accuracyBonus, timeBonus, periodBonus)

    const breakdown = patrol.getScoreBreakdown()
    setCurrentScore(breakdown.total)

    sound.playSoundEvent('time_aligned')
    sound.playAlignSuccess()
    sound.playBellChime()
    scene.playVictoryAnimation()

    const hasNext = patrol.advanceToNextPeriod()

    if (!hasNext) {
      setGameEnded(true)
      timer.stop()
      setTimeout(() => {
        const finalBreakdown = patrol.getScoreBreakdown()
        onGameEnd({
          success: true,
          score: finalBreakdown.total,
          timeLeft: remaining,
          isPatrolMode: true,
          periodsCleared: patrol.getPeriodsCleared(),
          totalPeriods: patrol.getTotalPeriods(),
          patrolScoreBreakdown: finalBreakdown,
        })
      }, 2500)
      return
    }

    setTimeout(() => {
      if (gameEnded) return

      const nextPeriod = patrol.getCurrentPeriod()
      setCurrentPeriod(nextPeriod)
      setPeriodIndex(patrol.getPeriodIndex())
      setWeather(nextPeriod.weather)
      setTotalTime(nextPeriod.duration)
      setTimeLeft(nextPeriod.duration)

      scene.setPeriodBackground(nextPeriod.id)
      scene.setWeather(nextPeriod.weather)
      scene.showPeriodBanner(`${nextPeriod.displayName} · ${nextPeriod.clockTime}`)
      sound.playPeriodTransition()
      sound.setWeatherAudio(nextPeriod.weather.rain, nextPeriod.weather.wind)

      gs.regenerateTargetTimeForPatrol()
      const newTarget = gs.getTargetTime()
      setTargetTime({ ...newTarget })
      scene.setTargetTime(newTarget)

      const newFaults = patrol.generateFaults()
      setFaults(newFaults)
      scene.clearAllGearFaults()
      newFaults.forEach((f) => scene.setGearFault(f.gearId, f.type))

      timer.restart(nextPeriod.duration)
    }, 2000)
  }, [gameEnded, onGameEnd])

  const handleGameEnd = useCallback((success: boolean) => {
    if (gameEnded) return

    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current
    const patrol = patrolRef.current
    const storm = stormRef.current

    if (!gs || !timer || !sound) return

    const remaining = timer.getTimeLeft()
    timer.stop()
    sound.playSoundEvent(success ? 'level_success' : 'level_fail')
    sound.playGameOver(success)

    const stormImpact = storm ? storm.calculateScoreImpact() : 0

    if (isPatrolMode && patrol) {
      if (!success) {
        scene?.playFailureAnimation()
      }
      setTimeout(() => {
        const breakdown = patrol.getScoreBreakdown()
        const baseScore = Math.max(0, breakdown.total + stormImpact)
        const diffMinutes = success ? 0 : gs.getTimeDiffMinutes()
        const evaluation = bellChimeEvaluationSystem.evaluate(
          success,
          diffMinutes,
          remaining,
          totalTime,
          baseScore,
        )
        const finalScore = baseScore + evaluation.totalBonus

        workshopSystem.recordGameScore(finalScore)

        bellChimeEvaluationSystem.saveReplay(
          'patrol',
          success,
          finalScore,
          evaluation,
          gs.getTargetTime(),
          gs.getCurrentTime(),
          diffMinutes,
        )

        if (success && !isPatrolMode) {
          activateTourMode(scene, gs.getCurrentTime(), finalScore)
          setGameEnded(true)
          return
        }

        onGameEnd({
          success,
          score: finalScore,
          timeLeft: success ? remaining : 0,
          isPatrolMode: true,
          periodsCleared: patrol.getPeriodsCleared(),
          totalPeriods: patrol.getTotalPeriods(),
          patrolScoreBreakdown: {
            ...breakdown,
            total: finalScore,
          },
          bellEvaluation: evaluation,
          totalDeviation: diffMinutes,
        })
      }, 2500)
      return
    }

    if (success && scene) {
      sound.playBellChime()
      scene.playVictoryAnimation()
    } else if (scene) {
      scene.playFailureAnimation()
    }

    const diffMinutes = success ? 0 : gs.getTimeDiffMinutes()
    const baseScore = calculateClassicScore(remaining, diffMinutes)
    const baseScoreWithStorm = Math.max(0, baseScore + stormImpact)
    const evaluation = bellChimeEvaluationSystem.evaluate(
      success,
      diffMinutes,
      remaining,
      totalTime,
      baseScoreWithStorm,
    )
    const finalScore = baseScoreWithStorm + evaluation.totalBonus
    workshopSystem.recordGameScore(finalScore)

    bellChimeEvaluationSystem.saveReplay(
      'classic',
      success,
      finalScore,
      evaluation,
      gs.getTargetTime(),
      gs.getCurrentTime(),
      diffMinutes,
    )

    if (success) {
      setTimeout(() => {
        activateTourMode(scene, gs.getCurrentTime(), finalScore)
        setGameEnded(true)
      }, 2500)
      return
    }

    setTimeout(() => {
      onGameEnd({
        success,
        score: finalScore,
        timeLeft: remaining,
        bellEvaluation: evaluation,
        totalDeviation: diffMinutes,
      })
    }, 3000)
  }, [gameEnded, onGameEnd, calculateClassicScore, isPatrolMode, totalTime])

  const activateTourMode = useCallback(
    (
      scene: MainScene | null,
      calibratedTime: ClockTime,
      earnedScore: number,
    ) => {
      if (!scene) {
        onGameEnd({
          success: true,
          score: earnedScore,
          timeLeft: 0,
        })
        return
      }

      tourSystem.unlockTour()
      tourSystem.loadFromStorage()
      tourSystem.startTour()

      const tourStateNow = tourSystem.getState()
      tourStateNow.time = calibratedTime
      setTourState({ ...tourStateNow })
      setTourProgress(tourSystem.getProgress())

      const hotspotsForScene = tourSystem.getVisibleHotspots().map((h) => ({
        id: h.id,
        x: h.x,
        y: h.y,
        radius: h.radius,
        icon: h.icon,
        name: h.displayName,
        isVisited: tourStateNow.visitedHotspotIds.includes(h.id),
        isSecret: !!h.isSecret,
        category: h.category,
        order: h.order,
      }))

      const pathsForScene = tourSystem.getVisiblePaths().map((p) => ({
        id: p.id,
        points: p.points,
        color: p.color,
        glowColor: p.glowColor,
      }))

      const pathsCache: Record<string, Array<{ x: number; y: number }>> = {}
      pathsForScene.forEach((p) => {
        pathsCache[p.id] = p.points
      })

      scene.setTourCallbacks((hotspotId: string) => {
        handleTourHotspotClick(hotspotId)
      })
      scene.setTourPathsCache(pathsCache)
      scene.enableTourMode(hotspotsForScene, pathsForScene)

      setCurrentTourHotspot(null)
      setTourActive(true)
      setGameEnded(true)

      soundRef.current?.stopRain()
      soundRef.current?.stopWind()
    },
    [onGameEnd],
  )

  const handleTourHotspotClick = useCallback((hotspotId: string) => {
    tourSystem.enterHotspot(hotspotId)
    const state = tourSystem.getState()
    setTourState({ ...state })
    setTourProgress(tourSystem.getProgress())

    const hotspot = tourSystem.getHotspot(hotspotId)
    if (hotspot) {
      setCurrentTourHotspot(hotspot)
      sceneRef.current?.highlightTourHotspot(hotspotId)

      if (hotspot.category === 'exit') {
        setTimeout(() => {
          handleExitTour()
        }, 2000)
      }

      if (hotspot.connectedHotspotIds) {
        const relatedPath = tourSystem
          .getPaths()
          .find((p) =>
            p.relatedGearIds.some((gid) =>
              hotspot.connectedHotspotIds!.some((hid) =>
                hid.includes(gid.toString()),
              ),
            ),
          )
        if (relatedPath) {
          sceneRef.current?.highlightTourPath(relatedPath.id)
        }
      }

      if (hotspot.rewardScore && hotspot.rewardScore > 0) {
        sceneRef.current?.playTourDiscoveryAnimation({
          x: hotspot.x,
          y: hotspot.y,
        })
      }
    }
  }, [])

  const handleExitTour = useCallback(() => {
    const scene = sceneRef.current
    if (scene) {
      scene.disableTourMode()
      scene.resetTourCamera()
    }

    const state = tourSystem.getState()
    tourSystem.endTour()

    const finalResult: GameResult = {
      success: true,
      score: state.totalScoreEarned,
      timeLeft: 0,
    }

    setTourActive(false)
    setCurrentTourHotspot(null)
    onGameEnd(finalResult)
  }, [onGameEnd])

  const handleTourStateChange = useCallback(() => {
    setTourState(tourSystem.getState())
    setTourProgress(tourSystem.getProgress())
  }, [])

  useEffect(() => {
    if (!tourActive) return

    tourSystem.getState().time = currentTime

    const hotspots = tourSystem.getVisibleHotspots()
    const nowState = tourSystem.getState()

    hotspots.forEach((h) => {
      if (nowState.currentHotspotId === h.id) {
        const related = tourSystem
          .getPaths()
          .filter((p) =>
            h.connectedHotspotIds?.some((hid) => {
              const hs = tourSystem.getHotspot(hid)
              return hs
                ? p.relatedGearIds.some((gid) =>
                    h.connectedHotspotIds!.some((id2) =>
                      tourSystem
                        .getHotspot(id2)
                        ?.name.includes(String(gid)),
                    ),
                  )
                : false
            }),
          )
        if (related.length > 0) {
          sceneRef.current?.highlightTourPath(related[0].id)
        }
      }
    })
  }, [tourActive, currentTime])

  useEffect(() => {
    if (!canvasRef.current) return

    const sound = new SoundManager()
    soundRef.current = sound

    const gearSystem = new GearSystem(GEAR_CONFIGS)
    gearSystemRef.current = gearSystem

    const gearIds = GEAR_CONFIGS.map((g) => g.id)
    let patrol: NightPatrolSystem | null = null
    if (isPatrolMode) {
      patrol = new NightPatrolSystem(gearIds)
      patrolRef.current = patrol
      gearSystem.setPatrolMode(patrol)
      gearSystem.regenerateTargetTimeForPatrol()
    }

    const initEffects = workshopSystem.getEffects()
    const initDiaryEffects = keeperDiarySystem.getEffects()
    const mergedEffects = {
      ...initEffects,
      toleranceMinutes: initEffects.toleranceMinutes + initDiaryEffects.toleranceBonus,
    }
    gearSystem.setWorkshopEffects(mergedEffects)
    sound.setGearMaterial(workshopSystem.getCurrentMaterial())
    sound.setEnhancedFeedback(initEffects.enhancedFeedback)
    setWorkshopEffects(mergedEffects)

    if (initDiaryEffects.customTargetTime && !isPatrolMode) {
      gearSystem.setTargetTime(initDiaryEffects.customTargetTime)
    }

    sound.playRain(isPatrolMode ? NIGHT_PERIODS[0].weather.rain : 'light')
    if (isPatrolMode) {
      sound.playWind(NIGHT_PERIODS[0].weather.wind)
    }

    const storm = new StormSystem(gearIds, {
      onStormWarning: (_secondsLeft) => {
        sound.playSoundEvent('storm_warning')
      },
      onStormStart: () => {
        scene.setWeather({ rain: 'storm', wind: 'storm', lightning: 'storm' })
        sound.setWeatherAudio('storm', 'storm')
        setWeather({ rain: 'storm', wind: 'storm', lightning: 'storm' })
      },
      onLightningStrike: (effect: LightningStrikeEffect) => {
        sound.playSoundEvent('lightning_strike')
        if (effect.targetTimeChanged && effect.newTargetTime) {
          const newTarget = effect.newTargetTime
          setTargetTime({ ...newTarget })
          scene.setTargetTime(newTarget)
        }
        effect.affectedGearIds.forEach((gearId) => {
          scene.flashGearFault(gearId)
        })
        scene.cameras?.main?.shake(200, 0.008)
        setStormScoreImpact(storm.calculateScoreImpact())
      },
      onRollbackUsed: (_strike: LightningStrikeEffect) => {
        const tgt = gearSystem.getTargetTime()
        setTargetTime({ ...tgt })
        scene.setTargetTime(tgt)
        setStormScoreImpact(storm.calculateScoreImpact())
      },
      onStormEnd: (_stats: StormStats) => {
        sound.playSoundEvent('storm_end')
        if (isPatrolMode && patrol) {
          const pw = patrol.getWeather()
          scene.setWeather(pw)
          sound.setWeatherAudio(pw.rain, pw.wind)
          setWeather(pw)
        } else {
          scene.setWeather({ rain: 'light', wind: 'light', lightning: 'calm' })
          sound.setWeatherAudio('light', 'calm')
          setWeather({ rain: 'light', wind: 'light', lightning: 'calm' })
        }
        setStormScoreImpact(storm.calculateScoreImpact())
      },
      onStateChange: (state) => {
        setStormState({ ...state })
      },
    })
    stormRef.current = storm

    storm.setGearAccessors(
      () => gearSystem.getGearsSnapshot(),
      (gearId, angle) => gearSystem.setGearAngleDirect(gearId, angle),
    )
    storm.setTargetTimeAccessors(
      () => gearSystem.getTargetTime(),
      (time) => gearSystem.setTargetTime(time),
    )
    storm.setCurrentTimeAccessor(() => gearSystem.getCurrentTime())

    const initialDuration = isPatrolMode ? NIGHT_PERIODS[0].duration : TOTAL_TIME
    const timer = new TimerSystem(initialDuration, {
      onTick: (t) => setTimeLeft(Math.ceil(t)),
      onWarning: () => sound.playTick(),
      onDanger: () => sound.playTick(),
      onTimeout: () => handleGameEnd(false),
    })
    timerRef.current = timer

    const scene = new MainScene()
    sceneRef.current = scene

    const faultSystem = new GearFaultSystem()
    gearFaultSystemRef.current = faultSystem

    scene.setCallbacks(
      (gearId: number, direction: 1 | -1) => {
        if (gameEnded) return

        if (repairMode && selectedRepairTool) {
          const fault = faultSystem.getActiveFault(gearId)
          if (fault && !faultSystem.isRepairInProgress(gearId)) {
            const started = faultSystem.startRepair(gearId, selectedRepairTool)
            if (started) {
              sound.playRepairStart()
              scene.startRepair(gearId, selectedRepairTool)
              setSelectedRepairTool(null)
            }
          }
          return
        }

        const result = gearSystem.rotateGear(gearId, direction)

        if (result.skipped) {
          bellChimeEvaluationSystem.recordAction({ type: 'gear_rotate', gearId, direction, result: 'skip' })
          sound.playGearFault()
          scene.flashGearFault(gearId)
          if (patrol) {
            patrol.addFaultPenalty(15)
          }
        } else if (result.reversed) {
          bellChimeEvaluationSystem.recordAction({ type: 'gear_rotate', gearId, direction, result: 'reverse' })
          sound.playGearFault()
        } else if (result.slipped) {
          bellChimeEvaluationSystem.recordAction({ type: 'gear_rotate', gearId, direction, result: 'slip' })
          sound.playGearFault()
        } else {
          bellChimeEvaluationSystem.recordAction({ type: 'gear_rotate', gearId, direction, result: 'success' })
          sound.playGearRotate()
        }
      },
    )

    gearSystem.setOnGearRotate((id, angle) => {
      scene.updateGearAngle(id, angle)
    })

    gearSystem.setOnTimeChange((t) => {
      setCurrentTime({ ...t })
      scene.updateClockHands(t)
    })

    gearSystem.setOnTargetReached(() => {
      bellChimeEvaluationSystem.recordAction({ type: 'time_align', result: 'success' })
      if (isPatrolMode) {
        handlePeriodComplete()
      } else {
        handleGameEnd(true)
      }
    })

    gearSystem.setOnFaultTriggered((gearId: number, _faultType: GearFaultType) => {
      bellChimeEvaluationSystem.recordAction({ type: 'fault_occur', gearId, result: 'failure' })
      scene.flashGearFault(gearId)
    })

    faultSystem.setCallbacks({
      onFaultSpawned: (fault: ActiveGearFault) => {
        bellChimeEvaluationSystem.recordAction({ type: 'fault_occur', gearId: fault.gearId, result: 'failure' })
        scene.setGearFault(fault.gearId, fault.type)
        sound.playGearFaultByType(fault.type)
        scene.startFaultPulse(fault.gearId)
        setFaults(faultSystem.getActiveFaults())
      },
      onFaultExpired: (fault: ActiveGearFault) => {
        scene.setGearFault(fault.gearId, 'none')
        scene.stopFaultPulse(fault.gearId)
        setFaults(faultSystem.getActiveFaults())
      },
      onRepairStart: (_repair: ActiveRepair) => {
        setActiveRepairs(faultSystem.getActiveRepairsUI())
      },
      onRepairProgress: (gearId: number, progress: number) => {
        scene.setRepairProgress(gearId, progress)
        setActiveRepairs(faultSystem.getActiveRepairsUI())
      },
      onRepairComplete: (result: FaultRepairResult) => {
        setActiveRepairs(faultSystem.getActiveRepairsUI())
        setToolCooldowns(faultSystem.getToolCooldownsUI())
        if (result.success) {
          sound.playRepairSuccess()
          scene.playRepairSuccessAnimation(result.gearId)
          scene.setGearFault(result.gearId, 'none')
          scene.stopFaultPulse(result.gearId)
          bellChimeEvaluationSystem.recordAction({ type: 'fault_clear', gearId: result.gearId, result: 'success' as const })
        } else {
          sound.playRepairFail()
          scene.playRepairFailAnimation(result.gearId)
          bellChimeEvaluationSystem.recordAction({ type: 'fault_occur', gearId: result.gearId, result: 'failure' as const })
        }
        setFaults(faultSystem.getActiveFaults())
      },
      onHintGenerated: (hints: GearFaultHint[]) => {
        setFaultHints(hints)
      },
    })

    scene.events.on('lightning', () => {
      if (Math.random() > 0.5) sound.playThunder()
    })

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: canvasRef.current,
      width: '100%',
      height: '100%',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: '#0a0a12',
      scene: [scene],
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    const initScene = () => {
      if (scene.scene.isActive()) {
        scene.setGearMaterial(workshopSystem.getCurrentMaterial())
        scene.setWorkshopEffects(initEffects)

        const curr = gearSystem.getCurrentTime()
        const tgt = gearSystem.getTargetTime()
        setCurrentTime({ ...curr })
        setTargetTime({ ...tgt })
        scene.updateClockHands(curr, true)
        scene.setTargetTime(tgt)

        if (isPatrolMode && patrol) {
          const period = patrol.getCurrentPeriod()
          scene.setPeriodBackground(period.id)
          scene.setWeather(period.weather)
          setWeather(period.weather)
          scene.showPeriodBanner(`${period.displayName} · ${period.clockTime}`)

          const initialFaults = patrol.generateFaults()
          setFaults(initialFaults)
          initialFaults.forEach((f) => scene.setGearFault(f.gearId, f.type))

          const interval = setInterval(() => {
            const activeFaults = patrol.getActiveFaults().filter(
              (f) => f.expiresAt > performance.now(),
            )
            setFaults(activeFaults)
            activeFaults.forEach((f) => scene.setGearFault(f.gearId, f.type))
            patrol
              .getActiveFaults()
              .filter((f) => f.expiresAt <= performance.now())
              .forEach((f) => scene.setGearFault(f.gearId, 'none'))
          }, 1000)
          ;(window as unknown as { _patrolFaultInterval?: number })._patrolFaultInterval = interval
        }

        storm.start()
        timer.start()
        bellChimeEvaluationSystem.startSession()

        if (isPatrolMode) {
          faultSystem.setDifficulty(difficulty)
          faultSystem.setGearCount(GEAR_CONFIGS.length)
          faultSystem.start()
        }

        const faultUpdateInterval = setInterval(() => {
          faultSystem.update()
          setToolCooldowns(faultSystem.getToolCooldownsUI())
        }, 100)
        ;(window as unknown as { _faultUpdateInterval?: number })._faultUpdateInterval = faultUpdateInterval
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    return () => {
      const interval = (window as unknown as { _patrolFaultInterval?: number })._patrolFaultInterval
      if (interval) clearInterval(interval)
      const faultInterval = (window as unknown as { _faultUpdateInterval?: number })._faultUpdateInterval
      if (faultInterval) clearInterval(faultInterval)
      storm.destroy()
      timer.destroy()
      sound.destroy()
      game.destroy(true)
    }
  }, [])

  const handleRollback = useCallback(() => {
    const storm = stormRef.current
    const sound = soundRef.current
    if (!storm) return
    const result = storm.useRollback()
    if (result && sound) {
      sound.playSoundEvent('storm_rollback')
    }
  }, [])

  const handleToggleSound = useCallback(() => {
    const sound = soundRef.current
    if (!sound) return
    const enabled = sound.toggle()
    setSoundEnabled(enabled)
  }, [])

  const handleToggleRepairMode = useCallback(() => {
    setRepairMode((prev) => !prev)
    setSelectedRepairTool(null)
  }, [])

  const handleSelectRepairTool = useCallback((tool: RepairToolType | null) => {
    setSelectedRepairTool(tool)
  }, [])

  const handleDifficultyChange = useCallback((level: DifficultyLevel) => {
    setDifficulty(level)
    difficultySystem.setDifficulty(level)
    const faultSystem = gearFaultSystemRef.current
    if (faultSystem) {
      faultSystem.setDifficulty(level)
    }
  }, [])

  const currentObjective = keeperDiarySystem.getCurrentLevelObjective()
  const allHotspots = tourSystem.getHotspots()
  const allPaths = tourSystem.getPaths()
  const allFacts = tourSystem.getFacts()

  return (
    <div className="game-container">
      <div ref={canvasRef} className="game-canvas" />
      {!tourActive && (
        <GameHUD
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentTime={formatTimeStr(currentTime)}
          targetTime={formatTimeStr(targetTime)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          isPatrolMode={isPatrolMode}
          period={currentPeriod}
          periodIndex={periodIndex}
          totalPeriods={isPatrolMode ? NIGHT_PERIODS.length : 0}
          weather={weather}
          faults={faults}
          score={currentScore}
          workshopEffects={workshopEffects}
          stormState={stormState}
          onRollback={handleRollback}
          stormScoreImpact={stormScoreImpact}
          diaryObjective={currentObjective}
          repairMode={repairMode}
          onToggleRepairMode={handleToggleRepairMode}
          selectedRepairTool={selectedRepairTool}
          onSelectRepairTool={handleSelectRepairTool}
          activeRepairs={activeRepairs}
          toolCooldowns={toolCooldowns}
          faultHints={faultHints}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          showDifficultySelector={isPatrolMode}
        />
      )}
      {tourActive && tourState && tourProgress && (
        <TourView
          state={tourState}
          progress={tourProgress}
          hotspots={allHotspots}
          paths={allPaths}
          facts={allFacts}
          currentHotspot={currentTourHotspot}
          onHotspotClick={(id) => {
            handleTourHotspotClick(id)
          }}
          onExit={handleExitTour}
          onAudioStateChange={() => {
            handleTourStateChange()
          }}
        />
      )}
    </div>
  )
}

export default Game
