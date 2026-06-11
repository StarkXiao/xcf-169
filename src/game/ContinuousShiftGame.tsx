import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { MainScene, GEAR_CONFIGS } from './MainScene'
import { GearSystem } from './GearSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import { NightPatrolSystem, NIGHT_PERIODS } from './NightPatrolSystem'
import { StormSystem } from './StormSystem'
import { workshopSystem } from './WorkshopSystem'
import { keeperDiarySystem } from './KeeperDiarySystem'
import { bellChimeEvaluationSystem } from './BellChimeEvaluationSystem'
import { ContinuousShiftSystem } from './ContinuousShiftSystem'
import {
  SHIFT_NIGHT_CONFIGS,
} from '../types/continuousShift'
import type {
  ShiftResourceState,
  ShiftRunState,
  ShiftPhase,
  ShiftNightResult,
  ShiftGameResult,
  ShiftResourceType,
  ActiveShiftEffect,
  ShiftRuntimeSaveData,
} from '../types/continuousShift'
import type {
  ClockTime,
  WeatherState,
  ActiveGearFault,
  PeriodConfig,
  GearFaultType,
  WorkshopEffects,
  StormState,
  LightningStrikeEffect,
} from '../types'
import ContinuousShiftHUD from '../ui/ContinuousShiftHUD'
import ContinuousShiftNightIntro from '../ui/ContinuousShiftNightIntro'
import ContinuousShiftNightComplete from '../ui/ContinuousShiftNightComplete'
import ContinuousShiftResourceShop from '../ui/ContinuousShiftResourceShop'
import ContinuousShiftResult from '../ui/ContinuousShiftResult'
import ContinuousShiftPauseMenu from '../ui/ContinuousShiftPauseMenu'

interface ContinuousShiftGameProps {
  totalNights?: number
  loadSaved?: boolean
  onGameEnd: (result: ShiftGameResult) => void
  onExit: () => void
}

function formatTimeStr(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

function ContinuousShiftGame({
  totalNights = 7,
  loadSaved = false,
  onGameEnd,
  onExit,
}: ContinuousShiftGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const gearSystemRef = useRef<GearSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<MainScene | null>(null)
  const patrolRef = useRef<NightPatrolSystem | null>(null)
  const stormRef = useRef<StormSystem | null>(null)
  const shiftSystemRef = useRef<ContinuousShiftSystem | null>(null)
  const nightStartTimeRef = useRef<number>(0)
  const resourcesSpentThisNightRef = useRef<Partial<ShiftResourceState>>({})
  const deviationAccumulatorRef = useRef<number>(0)
  const deviationSampleCountRef = useRef<number>(0)

  const [phase, setPhase] = useState<ShiftPhase>('nightIntro')
  const [runState, setRunState] = useState<ShiftRunState | null>(null)
  const [timeLeft, setTimeLeft] = useState(120)
  const [totalTime, setTotalTime] = useState(120)
  const [currentTime, setCurrentTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [targetTime, setTargetTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentPeriod, setCurrentPeriod] = useState<PeriodConfig | null>(NIGHT_PERIODS[0])
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
  const [activeEffects, setActiveEffects] = useState<ActiveShiftEffect[]>([])
  const [lastNightResult, setLastNightResult] = useState<ShiftNightResult | null>(null)
  const [finalResult, setFinalResult] = useState<ShiftGameResult | null>(null)
  const [showPauseMenu, setShowPauseMenu] = useState(false)

  const handleStartNight = useCallback(() => {
    const shift = shiftSystemRef.current
    if (!shift) return
    shift.startNight()
    nightStartTimeRef.current = Date.now()
    resourcesSpentThisNightRef.current = {}
    deviationAccumulatorRef.current = 0
    deviationSampleCountRef.current = 0

    const periods = shift.getPeriodsForCurrentNight()
    const firstPeriod = periods[0]
    setTotalTime(firstPeriod.duration)
    setTimeLeft(firstPeriod.duration)
    setCurrentPeriod(firstPeriod)
    setPeriodIndex(0)
    setWeather(firstPeriod.weather)

    timerRef.current?.restart(firstPeriod.duration)

    if (sceneRef.current) {
      sceneRef.current.setPeriodBackground(firstPeriod.id)
      sceneRef.current.setWeather(firstPeriod.weather)
      sceneRef.current.showPeriodBanner(`${firstPeriod.displayName} · ${firstPeriod.clockTime}`)
    }

    if (soundRef.current) {
      soundRef.current.setWeatherAudio(firstPeriod.weather.rain, firstPeriod.weather.wind)
      soundRef.current.playPeriodTransition()
    }

    gearSystemRef.current?.regenerateTargetTimeForPatrol()
    const newTarget = gearSystemRef.current?.getTargetTime()
    if (newTarget) {
      setTargetTime({ ...newTarget })
      sceneRef.current?.setTargetTime(newTarget)
    }
  }, [])

  const handlePeriodComplete = useCallback(() => {
    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current
    const shift = shiftSystemRef.current
    if (!gs || !timer || !sound || !scene || !shift) return

    const remaining = timer.getTimeLeft()
    timer.pause()
    setTimeLeft(remaining)

    const diffMinutes = gs.getTimeDiffMinutes()
    deviationAccumulatorRef.current += diffMinutes
    deviationSampleCountRef.current++

    const diEffects = keeperDiarySystem.getEffects()
    const scoreMultiplier = shift.getScoreMultiplier()
    const baseScore = Math.floor(500 * diEffects.scoreMultiplier * scoreMultiplier)
    const accuracyBonus = Math.max(
      0,
      Math.floor((360 - diffMinutes) * 2 * diEffects.scoreMultiplier * scoreMultiplier),
    )
    const timeBonus = Math.floor(
      remaining *
        5 *
        diEffects.timeBonusMultiplier *
        diEffects.scoreMultiplier *
        scoreMultiplier,
    )
    const periodBonus = Math.floor(
      300 * (periodIndex + 1) * diEffects.scoreMultiplier * scoreMultiplier,
    )
    const isPerfect = diffMinutes <= 5

    const totalPeriodScore = baseScore + accuracyBonus + timeBonus + periodBonus
    shift.recordPeriodScore(totalPeriodScore, isPerfect, remaining, diffMinutes)
    setCurrentScore(shift.getState().currentNight.scoreThisNight)

    sound.playSoundEvent('time_aligned')
    sound.playAlignSuccess()
    sound.playBellChime()
    scene.playVictoryAnimation()

    const hasNext = shift.completePeriod()

    if (!hasNext) {
      const avgDeviation =
        deviationSampleCountRef.current > 0
          ? deviationAccumulatorRef.current / deviationSampleCountRef.current
          : diffMinutes
      const result = shift.completeNight(true, {
        averageDeviation: avgDeviation,
        duration: (Date.now() - nightStartTimeRef.current) / 1000,
        resourcesSpent: resourcesSpentThisNightRef.current,
      })
      setLastNightResult(result)
      setShowPauseMenu(false)
      return
    }

    setTimeout(() => {
      const nextPeriod = shift.getCurrentPeriod()
      setCurrentPeriod(nextPeriod)
      setPeriodIndex(shift.getState().currentNight.currentPeriodIndex)
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

      timer.restart(nextPeriod.duration)
    }, 2000)
  }, [periodIndex])

  const handleGameEnd = useCallback(
    (success: boolean) => {
      const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const shift = shiftSystemRef.current
    if (!gs || !timer || !sound || !shift) return

    timer.getTimeLeft()
    timer.stop()
    sound.playSoundEvent(success ? 'level_success' : 'level_fail')
    sound.playGameOver(success)

      const avgDeviation =
        deviationSampleCountRef.current > 0
          ? deviationAccumulatorRef.current / deviationSampleCountRef.current
          : gs.getTimeDiffMinutes()

      const result = shift.completeNight(success, {
        averageDeviation: avgDeviation,
        duration: (Date.now() - nightStartTimeRef.current) / 1000,
        resourcesSpent: resourcesSpentThisNightRef.current,
      })
      setLastNightResult(result)
      setShowPauseMenu(false)
    },
    [],
  )

  const handleUseResource = useCallback((resourceType: ShiftResourceType) => {
    const shift = shiftSystemRef.current
    if (!shift) return false

    const success = shift.useResource(resourceType)
    if (success) {
      resourcesSpentThisNightRef.current[resourceType] =
        (resourcesSpentThisNightRef.current[resourceType] || 0) + 1

      if (resourceType === 'coal') {
        timerRef.current?.addTime(30)
        const newTimeLeft = timerRef.current?.getTimeLeft() || 0
        setTimeLeft(newTimeLeft)
      }
    }
    return success
  }, [])

  const collectRuntimeSaveData = useCallback((): ShiftRuntimeSaveData => {
    return {
      periodIndex,
      totalTime,
      timeLeft: timerRef.current?.getTimeLeft() || timeLeft,
      currentTime: { ...currentTime },
      targetTime: { ...targetTime },
      weather: { ...weather },
      faults: [...faults],
      currentScore,
      deviationAccumulated: deviationAccumulatorRef.current || 0,
      deviationSampleCount: deviationSampleCountRef.current || 0,
      resourcesSpentThisNight: { ...resourcesSpentThisNightRef.current },
      nightStartTime: nightStartTimeRef.current || Date.now(),
      activeEffects: [...activeEffects],
      periodConfig: currentPeriod,
    }
  }, [periodIndex, totalTime, timeLeft, currentTime, targetTime, weather, faults, currentScore, currentPeriod, activeEffects])

  const handleTogglePause = useCallback(() => {
    const shift = shiftSystemRef.current
    if (!shift) return

    if (phase === 'playing') {
      shift.pause()
      timerRef.current?.pause()
      const runtimeData = collectRuntimeSaveData()
      shift.saveToStorage(runtimeData)
      setShowPauseMenu(true)
    } else if (phase === 'paused') {
      shift.resume()
      timerRef.current?.resume()
      setShowPauseMenu(false)
    }
  }, [phase, collectRuntimeSaveData])

  const handleResumeFromPause = useCallback(() => {
    const shift = shiftSystemRef.current
    if (!shift) return
    shift.resume()
    timerRef.current?.resume()
    setShowPauseMenu(false)
  }, [])

  const handleExitToMenu = useCallback(() => {
    shiftSystemRef.current?.clearSave()
    onExit()
  }, [onExit])

  const handleAdvanceToNextNight = useCallback(() => {
    shiftSystemRef.current?.advanceToNextNight()
  }, [])

  const handleOpenShop = useCallback(() => {
    shiftSystemRef.current?.openResourceShop()
  }, [])

  const handleCloseShop = useCallback(() => {
    shiftSystemRef.current?.closeResourceShop()
  }, [])

  const handlePurchaseResource = useCallback((resourceType: ShiftResourceType) => {
    const shift = shiftSystemRef.current
    if (!shift) return false
    const price = shift.getResourcePrice(resourceType)
    return shift.purchaseResource(resourceType, price)
  }, [])

  const handleViewFinalResult = useCallback(() => {
    if (finalResult) {
      onGameEnd(finalResult)
    }
  }, [finalResult, onGameEnd])

  useEffect(() => {
    if (!canvasRef.current) return

    const sound = new SoundManager()
    soundRef.current = sound

    const gearSystem = new GearSystem(GEAR_CONFIGS)
    gearSystemRef.current = gearSystem

    const gearIds = GEAR_CONFIGS.map((g) => g.id)
    const patrol = new NightPatrolSystem(gearIds)
    patrolRef.current = patrol
    gearSystem.setPatrolMode(patrol)
    gearSystem.regenerateTargetTimeForPatrol()

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

    const shift = new ContinuousShiftSystem(totalNights, {
      onStateChange: (state) => {
        setRunState(state)
        setActiveEffects(state.activeEffects)
        if (state.phase === 'shiftOver') {
          const finalResultData: ShiftGameResult = {
            runId: state.runId,
            success: state.isVictory,
            victory: state.isVictory,
            totalScore: state.totalScore,
            nightsCompleted: state.nightHistory.filter((n) => n.success).length,
            totalNights: state.totalNights,
            perfectNights: state.perfectNights,
            bestNightScore: state.bestNightScore,
            totalPeriodsCleared: state.nightHistory.reduce((acc, n) => acc + n.periodsCleared, 0),
            totalPerfectPeriods: state.nightHistory.reduce((acc, n) => acc + n.perfectPeriods, 0),
            totalFaultsHandled: state.nightHistory.reduce((acc, n) => acc + n.faultsHandled, 0),
            totalTimeBonus: state.nightHistory.reduce((acc, n) => acc + n.timeBonus, 0),
            resourcesRemaining: state.resources,
            averageDeviation:
              state.nightHistory.length > 0
                ? state.nightHistory.reduce((acc, n) => acc + n.averageDeviation, 0) /
                  state.nightHistory.length
                : 0,
            totalDuration: state.nightHistory.reduce((acc, n) => acc + n.duration, 0),
            completedAt: Date.now(),
            nightResults: state.nightHistory,
          }
          setFinalResult(finalResultData)
        }
      },
      onPhaseChange: (p) => {
        setPhase(p)
      },
      onGameOver: (_result) => {
        setShowPauseMenu(false)
      },
      onVictory: (_result) => {
        setShowPauseMenu(false)
      },
      onEffectExpired: () => {
        // Effect handled by state change
      },
    })
    shiftSystemRef.current = shift

    let loadedRuntimeData: ShiftRuntimeSaveData | null = null

    if (loadSaved) {
      const loaded = shift.loadFromStorage()
      if (loaded.success && loaded.runtimeData) {
        loadedRuntimeData = loaded.runtimeData
        const rt = loadedRuntimeData
        setPeriodIndex(rt.periodIndex)
        setTotalTime(rt.totalTime)
        setTimeLeft(rt.timeLeft)
        setCurrentTime({ ...rt.currentTime })
        setTargetTime({ ...rt.targetTime })
        setWeather({ ...rt.weather })
        setFaults([...rt.faults])
        setCurrentScore(rt.currentScore)
        setActiveEffects([...rt.activeEffects])
        if (rt.periodConfig) {
          setCurrentPeriod(rt.periodConfig)
        }
        deviationAccumulatorRef.current = rt.deviationAccumulated
        deviationSampleCountRef.current = rt.deviationSampleCount
        resourcesSpentThisNightRef.current = { ...rt.resourcesSpentThisNight }
        nightStartTimeRef.current = rt.nightStartTime

        setRunState(shift.getState())
      } else if (loaded.success) {
        setRunState(shift.getState())
      } else {
        setRunState(shift.getState())
      }
    } else {
      setRunState(shift.getState())
    }

    sound.playRain(NIGHT_PERIODS[0].weather.rain)
    sound.playWind(NIGHT_PERIODS[0].weather.wind)

    const storm = new StormSystem(gearIds, {
      onStormWarning: () => {
        sound.playSoundEvent('storm_warning')
      },
      onStormStart: () => {
        sceneRef.current?.setWeather({ rain: 'storm', wind: 'storm', lightning: 'storm' })
        sound.setWeatherAudio('storm', 'storm')
        setWeather({ rain: 'storm', wind: 'storm', lightning: 'storm' })
      },
      onLightningStrike: (effect: LightningStrikeEffect) => {
        sound.playSoundEvent('lightning_strike')
        if (effect.targetTimeChanged && effect.newTargetTime) {
          const newTarget = effect.newTargetTime
          setTargetTime({ ...newTarget })
          sceneRef.current?.setTargetTime(newTarget)
        }
        effect.affectedGearIds.forEach((gearId) => {
          sceneRef.current?.flashGearFault(gearId)
        })
        sceneRef.current?.cameras?.main?.shake(200, 0.008)
        setStormScoreImpact(storm.calculateScoreImpact())
      },
      onRollbackUsed: () => {
        const tgt = gearSystem.getTargetTime()
        setTargetTime({ ...tgt })
        sceneRef.current?.setTargetTime(tgt)
        setStormScoreImpact(storm.calculateScoreImpact())
      },
      onStormEnd: () => {
        sound.playSoundEvent('storm_end')
        const currentPeriodLocal = shift.getCurrentPeriod()
        const pw = currentPeriodLocal.weather
        sceneRef.current?.setWeather(pw)
        sound.setWeatherAudio(pw.rain, pw.wind)
        setWeather(pw)
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

    const timer = new TimerSystem(120, {
      onTick: (t) => {
        setTimeLeft(Math.ceil(t))
        shift.updateEffects()
      },
      onWarning: () => sound.playTick(),
      onDanger: () => sound.playTick(),
      onTimeout: () => handleGameEnd(false),
    })
    timerRef.current = timer

    const scene = new MainScene()
    sceneRef.current = scene

    scene.setCallbacks((gearId: number, direction: 1 | -1) => {
      if (phase !== 'playing') return
      const result = gearSystem.rotateGear(gearId, direction)

      if (result.skipped) {
        bellChimeEvaluationSystem.recordAction({
          type: 'gear_rotate',
          gearId,
          direction,
          result: 'skip',
        })
        sound.playGearFault()
        scene.flashGearFault(gearId)
        patrol.addFaultPenalty(15)
      } else if (result.reversed) {
        bellChimeEvaluationSystem.recordAction({
          type: 'gear_rotate',
          gearId,
          direction,
          result: 'reverse',
        })
        sound.playGearFault()
      } else if (result.slipped) {
        bellChimeEvaluationSystem.recordAction({
          type: 'gear_rotate',
          gearId,
          direction,
          result: 'slip',
        })
        sound.playGearFault()
      } else {
        bellChimeEvaluationSystem.recordAction({
          type: 'gear_rotate',
          gearId,
          direction,
          result: 'success',
        })
        sound.playGearRotate()
      }
    })

    gearSystem.setOnGearRotate((id, angle) => {
      scene.updateGearAngle(id, angle)
    })

    gearSystem.setOnTimeChange((t) => {
      setCurrentTime({ ...t })
      scene.updateClockHands(t)
      deviationAccumulatorRef.current += gearSystem.getTimeDiffMinutes()
      deviationSampleCountRef.current++
    })

    gearSystem.setOnTargetReached(() => {
      bellChimeEvaluationSystem.recordAction({ type: 'time_align', result: 'success' })
      handlePeriodComplete()
    })

    gearSystem.setOnFaultTriggered((gearId: number, _faultType: GearFaultType) => {
      bellChimeEvaluationSystem.recordAction({ type: 'fault_occur', gearId, result: 'failure' })
      scene.flashGearFault(gearId)
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
        scene.updateClockHands(curr, true)
        scene.setTargetTime(tgt)

        if (loadSaved && loadedRuntimeData) {
          const rt = loadedRuntimeData
          timer.reset(rt.totalTime)
          timer.subtractTime(rt.totalTime - rt.timeLeft)
          gearSystem.setTargetTime(rt.targetTime)
          scene.setTargetTime(rt.targetTime)

          if (rt.periodConfig) {
            scene.setPeriodBackground(rt.periodConfig.id)
            scene.setWeather(rt.periodConfig.weather)
            sound.setWeatherAudio(rt.periodConfig.weather.rain, rt.periodConfig.weather.wind)
          }

          rt.faults.forEach((f) => scene.setGearFault(f.gearId, f.type))

          setCurrentTime({ ...rt.currentTime })
          setTargetTime({ ...rt.targetTime })
        } else {
          const period = shift.getCurrentPeriod()
          scene.setPeriodBackground(period.id)
          scene.setWeather(period.weather)
          setWeather(period.weather)
          scene.showPeriodBanner(`${period.displayName} · ${period.clockTime}`)
          sound.setWeatherAudio(period.weather.rain, period.weather.wind)

          gearSystem.regenerateTargetTimeForPatrol()
          const newTarget = gearSystem.getTargetTime()
          scene.setTargetTime(newTarget)
          setTargetTime({ ...newTarget })
          setCurrentTime({ ...gearSystem.getCurrentTime() })

          const initialFaults = patrol.generateFaults()
          setFaults(initialFaults)
          initialFaults.forEach((f) => scene.setGearFault(f.gearId, f.type))
        }

        const interval = setInterval(() => {
          const activeFaults = patrol.getActiveFaults().filter((f) => f.expiresAt > performance.now())
          if (!loadSaved || !loadedRuntimeData) {
            setFaults(activeFaults)
          }
          activeFaults.forEach((f) => scene.setGearFault(f.gearId, f.type))
          patrol
            .getActiveFaults()
            .filter((f) => f.expiresAt <= performance.now())
            .forEach((f) => scene.setGearFault(f.gearId, 'none'))
        }, 1000)
        ;(window as unknown as { _shiftFaultInterval?: number })._shiftFaultInterval = interval

        bellChimeEvaluationSystem.startSession()
        shift.startAutoSave(30000, collectRuntimeSaveData)

        if (loadSaved && shift.getPhase() === 'paused') {
          timer.pause()
          setShowPauseMenu(true)
        }
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    return () => {
      const interval = (window as unknown as { _shiftFaultInterval?: number })._shiftFaultInterval
      if (interval) clearInterval(interval)
      storm.destroy()
      timer.destroy()
      sound.destroy()
      shift.destroy()
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

  if (!runState) {
    return <div className="shift-loading">加载中...</div>
  }

  const renderPhaseContent = () => {
    switch (phase) {
      case 'nightIntro':
        return (
          <ContinuousShiftNightIntro
            nightConfig={SHIFT_NIGHT_CONFIGS[runState.currentNightNumber - 1]}
            runState={runState}
            onStart={handleStartNight}
          />
        )
      case 'playing':
      case 'paused':
        return (
          <>
            <ContinuousShiftHUD
              runState={runState}
              timeLeft={timeLeft}
              totalTime={totalTime}
              currentTime={formatTimeStr(currentTime)}
              targetTime={formatTimeStr(targetTime)}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              period={currentPeriod}
              periodIndex={periodIndex}
              totalPeriods={runState.currentNight.totalPeriods}
              weather={weather}
              faults={faults}
              score={currentScore}
              workshopEffects={workshopEffects}
              stormState={stormState}
              onRollback={handleRollback}
              stormScoreImpact={stormScoreImpact}
              activeEffects={activeEffects}
              onUseResource={handleUseResource}
              onPause={handleTogglePause}
              resources={runState.resources}
            />
            {showPauseMenu && (
              <ContinuousShiftPauseMenu
                onResume={handleResumeFromPause}
                onExit={handleExitToMenu}
                runState={runState}
              />
            )}
          </>
        )
      case 'nightComplete':
        return (
          <ContinuousShiftNightComplete
            nightResult={lastNightResult}
            runState={runState}
            onNextNight={handleAdvanceToNextNight}
            onOpenShop={handleOpenShop}
            onExit={handleExitToMenu}
          />
        )
      case 'resourceShop':
        return (
          <ContinuousShiftResourceShop
            runState={runState}
            onPurchase={handlePurchaseResource}
            getPrice={(type) => shiftSystemRef.current?.getResourcePrice(type) || 200}
            onClose={handleCloseShop}
          />
        )
      case 'shiftOver':
        return (
          <ContinuousShiftResult
            result={finalResult}
            onContinue={handleViewFinalResult}
            onRestart={() => {
              shiftSystemRef.current?.clearSave()
              onExit()
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="continuous-shift-container">
      <div ref={canvasRef} className="game-canvas" />
      {renderPhaseContent()}
    </div>
  )
}

export default ContinuousShiftGame
