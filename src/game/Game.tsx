import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { MainScene, GEAR_CONFIGS, TOTAL_TIME } from './MainScene'
import { GearSystem } from './GearSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import GameHUD from '../ui/GameHUD'
import type { GameResult, ClockTime } from '../types'

interface GameProps {
  onGameEnd: (result: GameResult) => void
}

function formatTimeStr(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

function Game({ onGameEnd }: GameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const gearSystemRef = useRef<GearSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<MainScene | null>(null)

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [currentTime, setCurrentTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [targetTime, setTargetTime] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameEnded, setGameEnded] = useState(false)

  const calculateScore = useCallback((remaining: number, diffMinutes: number) => {
    const accuracyBonus = Math.max(0, (360 - diffMinutes) * 2)
    const timeBonus = remaining * 5
    const perfectBonus = diffMinutes === 0 ? 1000 : 0
    return Math.floor(accuracyBonus + timeBonus + perfectBonus)
  }, [])

  const handleGameEnd = useCallback((success: boolean) => {
    if (gameEnded) return
    setGameEnded(true)

    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current

    if (!gs || !timer || !sound) return

    const remaining = timer.getTimeLeft()
    const diffMinutes = success ? 0 : gs.getTimeDiffMinutes()
    const score = calculateScore(remaining, diffMinutes)

    timer.stop()
    sound.playGameOver(success)

    if (success && scene) {
      sound.playBellChime()
      scene.playVictoryAnimation()
    } else if (scene) {
      scene.playFailureAnimation()
    }

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
    sound.playRain()

    const gearSystem = new GearSystem(GEAR_CONFIGS)
    gearSystemRef.current = gearSystem

    const timer = new TimerSystem(TOTAL_TIME, {
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
        sound.playGearRotate()
        gearSystem.rotateGear(gearId, direction)
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
      sound.playAlignSuccess()
      handleGameEnd(true)
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
        const curr = gearSystem.getCurrentTime()
        const tgt = gearSystem.getTargetTime()
        setCurrentTime({ ...curr })
        setTargetTime({ ...tgt })
        scene.updateClockHands(curr, true)
        scene.setTargetTime(tgt)
        timer.start()
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    return () => {
      timer.destroy()
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
        totalTime={TOTAL_TIME}
        currentTime={formatTimeStr(currentTime)}
        targetTime={formatTimeStr(targetTime)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    </div>
  )
}

export default Game
