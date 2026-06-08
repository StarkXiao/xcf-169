import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { MainScene, GEAR_CONFIGS, TOTAL_TIME } from './MainScene'
import { GearSystem } from './GearSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import { NightPatrolSystem, NIGHT_PERIODS } from './NightPatrolSystem'
import { StormSystem } from './StormSystem'
import { workshopSystem } from './WorkshopSystem'
import GameHUD from '../ui/GameHUD'
import type { GameResult, ClockTime, GameMode, WeatherState, ActiveGearFault, PeriodConfig, GearFaultType, WorkshopEffects, StormState, LightningStrikeEffect, StormStats } from '../types'

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

  const calculateClassicScore = useCallback((remaining: number, diffMinutes: number) => {
    const accuracyBonus = Math.max(0, (360 - diffMinutes) * 2)
    const timeBonus = remaining * 5
    const perfectBonus = diffMinutes === 0 ? 1000 : 0
    return Math.floor(accuracyBonus + timeBonus + perfectBonus)
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

    const baseScore = 500
    const accuracyBonus = Math.max(0, (360 - diffMinutes) * 2)
    const timeBonus = remaining * 5
    const periodBonus = 300 * (patrol.getPeriodIndex() + 1)

    patrol.accumulatePeriodScore(baseScore, accuracyBonus, timeBonus, periodBonus)

    const breakdown = patrol.getScoreBreakdown()
    setCurrentScore(breakdown.total)

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
    setGameEnded(true)

    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current
    const patrol = patrolRef.current
    const storm = stormRef.current

    if (!gs || !timer || !sound) return

    const remaining = timer.getTimeLeft()
    timer.stop()
    sound.playGameOver(success)

    const stormImpact = storm ? storm.calculateScoreImpact() : 0

    if (isPatrolMode && patrol) {
      if (!success) {
        scene?.playFailureAnimation()
      }
      setTimeout(() => {
        const breakdown = patrol.getScoreBreakdown()
        const finalScore = Math.max(0, breakdown.total + stormImpact)
        workshopSystem.recordGameScore(finalScore)
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
    const finalScore = Math.max(0, baseScore + stormImpact)
    workshopSystem.recordGameScore(finalScore)

    setTimeout(() => {
      onGameEnd({
        success,
        score: finalScore,
        timeLeft: remaining,
      })
    }, 3000)
  }, [gameEnded, onGameEnd, calculateClassicScore, isPatrolMode])

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
    gearSystem.setWorkshopEffects(initEffects)
    sound.setGearMaterial(workshopSystem.getCurrentMaterial())
    sound.setEnhancedFeedback(initEffects.enhancedFeedback)
    setWorkshopEffects(initEffects)

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

    scene.setCallbacks(
      (gearId: number, direction: 1 | -1) => {
        if (gameEnded) return
        const result = gearSystem.rotateGear(gearId, direction)
        if (result.skipped) {
          sound.playGearFault()
          scene.flashGearFault(gearId)
          if (patrol) {
            patrol.addFaultPenalty(15)
          }
        } else if (result.reversed || result.slipped) {
          sound.playGearFault()
        } else {
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
      if (isPatrolMode) {
        handlePeriodComplete()
      } else {
        handleGameEnd(true)
      }
    })

    gearSystem.setOnFaultTriggered((gearId: number, _faultType: GearFaultType) => {
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
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    return () => {
      const interval = (window as unknown as { _patrolFaultInterval?: number })._patrolFaultInterval
      if (interval) clearInterval(interval)
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

  return (
    <div className="game-container">
      <div ref={canvasRef} className="game-canvas" />
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
      />
    </div>
  )
}

export default Game
