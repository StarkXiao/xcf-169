import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { MultiClockScene } from './MultiClockScene'
import { MultiClockSystem, MULTI_CLOCK_LEVELS } from './MultiClockSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import { workshopSystem } from './WorkshopSystem'
import MultiClockHUD from '../ui/MultiClockHUD'
import type {
  MultiClockGameResult,
  ClockTime,
  MultiClockState,
  WorkshopEffects,
  MultiClockLevelConfig,
} from '../types'

interface MultiClockGameProps {
  onGameEnd: (result: MultiClockGameResult) => void
  levelId?: string
}

function formatTimeStr(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

const MAIN_CLOCK_DELTA_LARGE = 30
const MAIN_CLOCK_DELTA_SMALL = 5
const SIDE_TOWER_DELTA = 5

function MultiClockGame({ onGameEnd, levelId = 'level1' }: MultiClockGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const multiClockRef = useRef<MultiClockSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<MultiClockScene | null>(null)
  const gameEndedRef = useRef(false)
  const fineAdjustModeRef = useRef(false)
  const onGameEndRef = useRef(onGameEnd)
  const alignedTowersRef = useRef<Set<string>>(new Set())

  const levelConfig = useRef<MultiClockLevelConfig>(
    MULTI_CLOCK_LEVELS.find((l) => l.id === levelId) ?? MULTI_CLOCK_LEVELS[0],
  )

  const [timeLeft, setTimeLeft] = useState(levelConfig.current.duration)
  const totalTime = levelConfig.current.duration
  const [mainClockCurrent, setMainClockCurrent] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [mainClockTarget, setMainClockTarget] = useState<ClockTime>(
    levelConfig.current.mainClockTarget,
  )
  const [multiClockState, setMultiClockState] = useState<MultiClockState | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameEnded, setGameEnded] = useState(false)
  const [workshopEffects, setWorkshopEffects] = useState<WorkshopEffects>(
    workshopSystem.getEffects(),
  )
  const [fineAdjustMode, setFineAdjustMode] = useState(false)

  useEffect(() => {
    gameEndedRef.current = gameEnded
  }, [gameEnded])

  useEffect(() => {
    fineAdjustModeRef.current = fineAdjustMode
  }, [fineAdjustMode])

  useEffect(() => {
    onGameEndRef.current = onGameEnd
  }, [onGameEnd])

  const handleGameEnd = useCallback(
    (success: boolean) => {
      if (gameEndedRef.current) return
      gameEndedRef.current = true
      setGameEnded(true)

      const mc = multiClockRef.current
      const timer = timerRef.current
      const sound = soundRef.current
      const scene = sceneRef.current

      if (!mc || !timer || !sound) return

      mc.lock()
      scene?.lockInteractions()

      const remaining = timer.getTimeLeft()
      timer.stop()
      sound.playSoundEvent(success ? 'level_success' : 'level_fail')
      sound.playGameOver(success)

      if (success && scene) {
        sound.playSoundEvent('tower_align')
        sound.playBellChime()
        sound.playAlignSuccess()
        scene.playVictoryAnimation()
      } else if (scene) {
        scene.playFailureAnimation()
      }

      const result = mc.calculateResult(remaining)
      workshopSystem.recordGameScore(result.score)

      setTimeout(() => {
        onGameEndRef.current(result)
      }, 3000)
    },
    [],
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const sound = new SoundManager()
    soundRef.current = sound

    const config = levelConfig.current
    const multiClock = new MultiClockSystem(config)
    multiClockRef.current = multiClock

    const initEffects = workshopSystem.getEffects()
    sound.setGearMaterial(workshopSystem.getCurrentMaterial())
    sound.setEnhancedFeedback(initEffects.enhancedFeedback)
    setWorkshopEffects(initEffects)

    const timer = new TimerSystem(config.duration, {
      onTick: (t) => setTimeLeft(Math.ceil(t)),
      onWarning: () => sound.playTick(),
      onDanger: () => sound.playTick(),
      onTimeout: () => handleGameEnd(false),
    })
    timerRef.current = timer

    const scene = new MultiClockScene()
    sceneRef.current = scene
    scene.setLevelConfig(config)

    scene.setCallbacks(
      (direction: 1 | -1) => {
        if (gameEndedRef.current) return
        const delta = fineAdjustModeRef.current
          ? MAIN_CLOCK_DELTA_SMALL * direction
          : MAIN_CLOCK_DELTA_LARGE * direction
        multiClock.advanceMainClock(delta)
        sound.playGearRotate()
      },
      (towerId: string, direction: 1 | -1) => {
        if (gameEndedRef.current) return
        multiClock.advanceSideTower(towerId, SIDE_TOWER_DELTA * direction)
        sound.playGearSnap()
      },
    )

    multiClock.setOnMainClockChange((t) => {
      setMainClockCurrent({ ...t })
      scene.updateMainClock(t)
    })

    multiClock.setOnSideTowerChange((tower) => {
      scene.updateSideTower(tower)
      if (tower.isAligned && !alignedTowersRef.current.has(tower.id) && !gameEndedRef.current) {
        alignedTowersRef.current.add(tower.id)
        sound.playSoundEvent('tower_align')
      } else if (!tower.isAligned && alignedTowersRef.current.has(tower.id)) {
        alignedTowersRef.current.delete(tower.id)
      }
    })

    multiClock.setOnMechanismActivate((mech) => {
      scene.activateMechanism(mech)
      sound.playGearSnap()
    })

    multiClock.setOnStateChange((state) => {
      setMultiClockState(state)
    })

    multiClock.setOnAllAligned(() => {
      handleGameEnd(true)
    })

    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: canvasRef.current,
      width: '100%',
      height: '100%',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: '#0a0a14',
      scene: [scene],
    }

    const game = new Phaser.Game(gameConfig)
    gameRef.current = game

    const initScene = () => {
      if (scene.scene.isActive()) {
        scene.setGearMaterial(workshopSystem.getCurrentMaterial())
        scene.setWorkshopEffects(initEffects)

        const mainCurr = multiClock.getMainClockCurrent()
        const mainTgt = config.mainClockTarget

        setMainClockCurrent({ ...mainCurr })
        setMainClockTarget({ ...mainTgt })

        scene.updateMainClock(mainCurr, true)
        scene.setMainClockTarget(mainTgt)

        multiClock.getAllSideTowers().forEach((tower) => {
          scene.updateSideTower(tower)
        })

        setMultiClockState(multiClock.getState())
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

  const handleToggleFineAdjust = useCallback(() => {
    setFineAdjustMode((prev) => !prev)
  }, [])

  return (
    <div className="game-container">
      <div ref={canvasRef} className="game-canvas" />
      <MultiClockHUD
        timeLeft={timeLeft}
        totalTime={totalTime}
        mainClockCurrent={formatTimeStr(mainClockCurrent)}
        mainClockTarget={formatTimeStr(mainClockTarget)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        levelConfig={levelConfig.current}
        multiClockState={multiClockState}
        workshopEffects={workshopEffects}
        fineAdjustMode={fineAdjustMode}
        onToggleFineAdjust={handleToggleFineAdjust}
      />
    </div>
  )
}

export default MultiClockGame
