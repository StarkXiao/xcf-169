import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { MainScene, GEAR_CONFIGS, TOTAL_TIME } from './MainScene'
import { GearSystem } from './GearSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import GameHUD from '../ui/GameHUD'
import type { GameResult } from '../types'

interface GameProps {
  onGameEnd: (result: GameResult) => void
}

function Game({ onGameEnd }: GameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const gearSystemRef = useRef<GearSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<MainScene | null>(null)

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [alignedCount, setAlignedCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameEnded, setGameEnded] = useState(false)

  const calculateScore = useCallback((aligned: number, total: number, remaining: number) => {
    const baseScore = aligned * 100
    const timeBonus = remaining * 5
    const completionBonus = aligned === total ? 500 : 0
    return baseScore + timeBonus + completionBonus
  }, [])

  const handleGameEnd = useCallback((success: boolean) => {
    if (gameEnded) return
    setGameEnded(true)

    const gs = gearSystemRef.current
    const timer = timerRef.current
    const sound = soundRef.current
    const scene = sceneRef.current

    if (!gs || !timer || !sound) return

    const aligned = gs.getAlignedCount()
    const total = gs.getTotalCount()
    const remaining = timer.getTimeLeft()
    const score = calculateScore(aligned, total, remaining)

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
        gearsAligned: aligned,
        totalGears: total,
      })
    }, 2500)
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
      const wasAligned = scene.alignedCache.get(id)
      const isAlignedNow = gearSystem.isAligned(id)
      if (isAlignedNow && !wasAligned) {
        sound.playGearSnap()
        scene.highlightAligned(id, true)
      } else if (!isAlignedNow && wasAligned) {
        scene.highlightAligned(id, false)
      }
      scene.alignedCache.set(id, isAlignedNow)
      setAlignedCount(gearSystem.getAlignedCount())
    })

    gearSystem.setOnAllAligned(() => {
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

    setAlignedCount(gearSystem.getAlignedCount())

    const startTimer = () => {
      if (scene.scene.isActive()) {
        timer.start()
      } else {
        setTimeout(startTimer, 100)
      }
    }
    startTimer()

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
        alignedCount={alignedCount}
        totalGears={GEAR_CONFIGS.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />
    </div>
  )
}

export default Game
