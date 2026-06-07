import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { CustomMainScene } from './CustomMainScene'
import { GearSystem } from './GearSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import { FaultEventEngine } from './FaultEventEngine'
import { workshopSystem } from './WorkshopSystem'
import GameHUD from '../ui/GameHUD'
import type { GameResult, ClockTime, WeatherState, ActiveGearFault, GearFaultType, WorkshopEffects } from '../types'
import type { LoadedLevel } from './LevelLoader'

interface CustomGameProps {
  level: LoadedLevel
  onGameEnd: (result: GameResult) => void
  onExit: () => void
}

function formatTimeStr(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

export function CustomGame({ level, onGameEnd, onExit }: CustomGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const gearSystemRef = useRef<GearSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<CustomMainScene | null>(null)
  const faultEngineRef = useRef<FaultEventEngine | null>(null)
  const faultEngineLoopRef = useRef<number | null>(null)

  const [timeLeft, setTimeLeft] = useState(level.duration)
  const totalTime = level.duration
  const [currentTime, setCurrentTime] = useState<ClockTime>({ ...level.initialClockTime })
  const [targetTime, setTargetTime] = useState<ClockTime>({ ...level.targetClockTime })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameEnded, setGameEnded] = useState(false)
  const weather: WeatherState = {
    rain: 'calm',
    wind: 'calm',
    lightning: 'calm',
  }
  const [faults, setFaults] = useState<ActiveGearFault[]>([])
  const currentScore = 0
  const [workshopEffects, setWorkshopEffects] = useState<WorkshopEffects>(
    workshopSystem.getEffects(),
  )

  const calculateScore = useCallback((remaining: number, diffMinutes: number) => {
    const tolerance = level.toleranceMinutes
    const effectiveDiff = Math.max(0, diffMinutes - tolerance)
    const accuracyBonus = Math.max(0, (360 - effectiveDiff * 10) * 2) * level.scoreMultiplier
    const timeBonus = remaining * 5 * level.scoreMultiplier
    const perfectBonus = effectiveDiff === 0 ? 1000 * level.scoreMultiplier : 0
    return Math.floor(accuracyBonus + timeBonus + perfectBonus)
  }, [level.toleranceMinutes, level.scoreMultiplier])

  const handleGameEnd = useCallback((success: boolean) => {
    if (gameEnded) return
    setGameEnded(true)

    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current
    const faultEngine = faultEngineRef.current

    if (!gs || !timer || !sound) return

    const remaining = timer.getTimeLeft()
    timer.stop()
    sound.playSoundEvent(success ? 'level_success' : 'level_fail')

    if (success && scene) {
      sound.playSoundEvent('tower_align')
      scene.playVictoryAnimation()
    } else if (scene) {
      scene.playFailureAnimation()
    }

    if (faultEngineLoopRef.current) {
      clearInterval(faultEngineLoopRef.current)
      faultEngineLoopRef.current = null
    }
    faultEngine?.destroy()

    const diffMinutes = success ? 0 : gs.getTimeDiffMinutes()
    const score = calculateScore(remaining, diffMinutes)
    workshopSystem.recordGameScore(score)

    setTimeout(() => {
      onGameEnd({
        success,
        score,
        timeLeft: remaining,
      })
    }, 3000)
  }, [gameEnded, onGameEnd, calculateScore])

  useEffect(() => {
    if (!canvasRef.current) return

    const sound = new SoundManager()
    soundRef.current = sound
    sound.applySoundScripts(level.soundConfigs)

    const gearSystem = new GearSystem(level.gears)
    gearSystemRef.current = gearSystem

    const faultEngine = new FaultEventEngine()
    faultEngineRef.current = faultEngine
    faultEngine.loadEvents(level.faultEvents)

    const initEffects = workshopSystem.getEffects()
    const mergedEffects: WorkshopEffects = {
      ...initEffects,
      toleranceMinutes: Math.max(initEffects.toleranceMinutes, level.toleranceMinutes),
    }
    gearSystem.setWorkshopEffects(mergedEffects)
    sound.setGearMaterial(workshopSystem.getCurrentMaterial())
    sound.setEnhancedFeedback(mergedEffects.enhancedFeedback)
    setWorkshopEffects(mergedEffects)

    gearSystem.setInitialTime(level.initialClockTime)
    gearSystem.setTargetTime(level.targetClockTime)

    const timer = new TimerSystem(level.duration, {
      onTick: (t) => setTimeLeft(Math.ceil(t)),
      onWarning: () => sound.playSoundEvent('alarm_ring'),
      onDanger: () => sound.playSoundEvent('alarm_ring'),
      onTimeout: () => handleGameEnd(false),
    })
    timerRef.current = timer

    const scene = new CustomMainScene()
    sceneRef.current = scene

    faultEngine.setCallbacks(
      (_eventId, gearId, type, durationMs) => {
        const gearSystemNow = gearSystemRef.current
        if (gearSystemNow) {
          gearSystemNow.setGearFault(gearId, type)
        }
        sound.playSoundEvent('fault_occur')
        scene.flashGearFault(gearId)
        scene.setGearFault(gearId, type)
        setFaults((prev) => [
          ...prev.filter((f) => f.gearId !== gearId),
          { gearId, type, expiresAt: performance.now() + durationMs },
        ])
      },
      (_eventId, gearId) => {
        const gearSystemNow = gearSystemRef.current
        if (gearSystemNow) {
          gearSystemNow.setGearFault(gearId, 'none')
        }
        sound.playSoundEvent('fault_clear')
        scene.setGearFault(gearId, 'none')
        setFaults((prev) => prev.filter((f) => f.gearId !== gearId))
      },
    )

    scene.setCallbacks(
      (gearId: number, direction: 1 | -1) => {
        if (gameEnded) return
        faultEngine.recordRotation(gearId)
        const result = gearSystem.rotateGear(gearId, direction)
        if (result.skipped) {
          sound.playSoundEvent('fault_occur')
          scene.flashGearFault(gearId)
        } else if (result.reversed || result.slipped) {
          sound.playSoundEvent('fault_occur')
        } else {
          sound.playSoundEvent('gear_click')
        }

        const diff = gearSystem.getTimeDiffMinutes()
        faultEngine.updateDeviation(diff)
        faultEngine.update()
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
      sound.playSoundEvent('time_aligned')
      handleGameEnd(true)
    })

    gearSystem.setOnFaultTriggered((gearId: number, _faultType: GearFaultType) => {
      scene.flashGearFault(gearId)
    })

    scene.events.on('lightning', () => {
      if (Math.random() > 0.5) sound.playSoundEvent('weather_change')
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
        scene.setWorkshopEffects(mergedEffects)

        const curr = gearSystem.getCurrentTime()
        const tgt = gearSystem.getTargetTime()
        setCurrentTime({ ...curr })
        setTargetTime({ ...tgt })
        scene.updateClockHands(curr, true)
        scene.setTargetTime(tgt)

        faultEngine.reset()

        const engineLoop = window.setInterval(() => {
          if (!gameEnded) {
            faultEngine.update()
          }
        }, 250)
        faultEngineLoopRef.current = engineLoop

        timer.start()
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    return () => {
      if (faultEngineLoopRef.current) {
        clearInterval(faultEngineLoopRef.current)
        faultEngineLoopRef.current = null
      }
      faultEngine.destroy()
      timer.destroy()
      sound.clearSoundScripts()
      sound.destroy()
      game.destroy(true)
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
        isPatrolMode={false}
        period={null}
        periodIndex={0}
        totalPeriods={0}
        weather={weather}
        faults={faults}
        score={currentScore}
        workshopEffects={workshopEffects}
      />
      <button
        onClick={onExit}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 100,
          padding: '8px 16px',
          fontSize: 13,
          fontFamily: 'Georgia, serif',
          color: '#e8d5a3',
          backgroundColor: 'rgba(30, 20, 10, 0.85)',
          border: '2px solid #5a4a32',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        ← 退出试玩
      </button>
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 99,
          padding: '6px 12px',
          fontSize: 12,
          fontFamily: 'Georgia, serif',
          color: '#c9a96a',
          backgroundColor: 'rgba(20, 15, 10, 0.8)',
          border: '1px solid #3d3222',
          borderRadius: 4,
        }}
      >
        🧪 试玩：{level.displayName}
      </div>
    </div>
  )
}

export default CustomGame
