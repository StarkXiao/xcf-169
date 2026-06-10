import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { DuoCoopScene } from './DuoCoopScene'
import { DuoCoopSystem, DUO_COOP_LEVELS } from './DuoCoopSystem'
import { TimerSystem } from './TimerSystem'
import { SoundManager } from './SoundManager'
import DuoCoopHUD from '../ui/DuoCoopHUD'
import type {
  DuoCoopGameResult,
  ClockTime,
  DuoCoopState,
  DuoCoopLevelConfig,
} from '../types'

interface DuoCoopGameProps {
  onGameEnd: (result: DuoCoopGameResult) => void
  levelId?: string
}

function formatTimeStr(t: ClockTime): string {
  return `${t.hours}:${t.minutes.toString().padStart(2, '0')}`
}

function DuoCoopGame({ onGameEnd, levelId = 'duo1' }: DuoCoopGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const duoCoopRef = useRef<DuoCoopSystem | null>(null)
  const timerRef = useRef<TimerSystem | null>(null)
  const soundRef = useRef<SoundManager | null>(null)
  const sceneRef = useRef<DuoCoopScene | null>(null)
  const gameEndedRef = useRef(false)
  const fineMasterRef = useRef(false)
  const fineSlaveRef = useRef(false)
  const onGameEndRef = useRef(onGameEnd)

  const levelConfig = useRef<DuoCoopLevelConfig>(
    DUO_COOP_LEVELS.find((l) => l.id === levelId) ?? DUO_COOP_LEVELS[0],
  )

  const [timeLeft, setTimeLeft] = useState(levelConfig.current.duration)
  const totalTime = levelConfig.current.duration
  const [masterCurrent, setMasterCurrent] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [slaveCurrent, setSlaveCurrent] = useState<ClockTime>({ hours: 12, minutes: 0 })
  const [duoState, setDuoState] = useState<DuoCoopState | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [gameEnded, setGameEnded] = useState(false)
  const [fineMaster, setFineMaster] = useState(false)
  const [fineSlave, setFineSlave] = useState(false)

  useEffect(() => {
    gameEndedRef.current = gameEnded
  }, [gameEnded])

  useEffect(() => {
    fineMasterRef.current = fineMaster
  }, [fineMaster])

  useEffect(() => {
    fineSlaveRef.current = fineSlave
  }, [fineSlave])

  useEffect(() => {
    onGameEndRef.current = onGameEnd
  }, [onGameEnd])

  const handleGameEnd = useCallback(
    (success: boolean) => {
      if (gameEndedRef.current) return
      gameEndedRef.current = true
      setGameEnded(true)

      const dc = duoCoopRef.current
      const timer = timerRef.current
      const sound = soundRef.current
      const scene = sceneRef.current

      if (!dc || !timer || !sound) return

      dc.lock()
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

      const result = dc.calculateResult(remaining)

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
    const duoCoop = new DuoCoopSystem(config)
    duoCoopRef.current = duoCoop

    const timer = new TimerSystem(config.duration, {
      onTick: (t) => setTimeLeft(Math.ceil(t)),
      onWarning: () => sound.playTick(),
      onDanger: () => sound.playTick(),
      onTimeout: () => handleGameEnd(false),
    })
    timerRef.current = timer

    const scene = new DuoCoopScene()
    sceneRef.current = scene
    scene.setLevelConfig(config)

    scene.setCallbacks(
      (direction: 1 | -1) => {
        if (gameEndedRef.current) return
        duoCoop.advanceMasterClock(direction, fineMasterRef.current)
        sound.playGearRotate()
      },
      (direction: 1 | -1) => {
        if (gameEndedRef.current) return
        duoCoop.advanceSlaveClock(direction, fineSlaveRef.current)
        sound.playGearSnap()
      },
    )

    duoCoop.setOnMasterClockChange((time, player) => {
      setMasterCurrent({ ...time })
      scene.updateClock('master', time, player)

      const slave = duoCoop.getState().slave
      scene.updateSyncLine(time, slave.currentTime, player.isAligned && slave.isAligned)
    })

    duoCoop.setOnSlaveClockChange((time, player) => {
      setSlaveCurrent({ ...time })
      scene.updateClock('slave', time, player)

      const master = duoCoop.getState().master
      scene.updateSyncLine(master.currentTime, time, master.isAligned && player.isAligned)
    })

    duoCoop.setOnInterferenceActivate((interference) => {
      scene.showInterference(interference)
      sound.playSoundEvent('fault_occur')
    })

    duoCoop.setOnInterferenceExpire((id) => {
      scene.hideInterference(id)
    })

    duoCoop.setOnSyncTargetAchieved((target) => {
      scene.showSyncTargetAchieved(target.label)
      sound.playSoundEvent('time_aligned')
    })

    duoCoop.setOnStateChange((state) => {
      setDuoState(state)
    })

    duoCoop.setOnAllSynced(() => {
      handleGameEnd(true)
    })

    duoCoop.setOnSharedDrift((drift) => {
      scene.showDriftEffect(drift)
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
        const masterCurr = duoCoop.getMasterCurrent()
        const slaveCurr = duoCoop.getSlaveCurrent()

        setMasterCurrent({ ...masterCurr })
        setSlaveCurrent({ ...slaveCurr })

        const state = duoCoop.getState()
        scene.updateClock('master', masterCurr, state.master)
        scene.updateClock('slave', slaveCurr, state.slave)
        scene.updateSyncLine(masterCurr, slaveCurr, state.master.isAligned && state.slave.isAligned)

        setDuoState(duoCoop.getState())
        timer.start()
        duoCoop.startInterferenceLoop()
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    return () => {
      duoCoop.destroy()
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

  const handleToggleFineMaster = useCallback(() => {
    setFineMaster((prev) => !prev)
  }, [])

  const handleToggleFineSlave = useCallback(() => {
    setFineSlave((prev) => !prev)
  }, [])

  return (
    <div className="game-container">
      <div ref={canvasRef} className="game-canvas" />
      <DuoCoopHUD
        timeLeft={timeLeft}
        totalTime={totalTime}
        masterCurrent={formatTimeStr(masterCurrent)}
        masterTarget={formatTimeStr(levelConfig.current.masterTarget)}
        slaveCurrent={formatTimeStr(slaveCurrent)}
        slaveTarget={formatTimeStr(levelConfig.current.slaveTarget)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        levelConfig={levelConfig.current}
        duoState={duoState}
        fineMaster={fineMaster}
        fineSlave={fineSlave}
        onToggleFineMaster={handleToggleFineMaster}
        onToggleFineSlave={handleToggleFineSlave}
      />
    </div>
  )
}

export default DuoCoopGame
