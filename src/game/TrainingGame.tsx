import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { TrainingScene } from './TrainingScene'
import { trainingSystem } from './TrainingSystem'
import { GEAR_TIME_DELTAS } from './GearSystem'
import type {
  TrainingLesson,
  LessonStep,
  ClockTime,
  TrainingGameResult,
  TrainingActionRecord,
} from '../types'

interface TrainingGameProps {
  lesson: TrainingLesson
  onGameEnd: (result: TrainingGameResult) => void
  onExit: () => void
}

function TrainingGame({ lesson, onGameEnd, onExit }: TrainingGameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<TrainingScene | null>(null)

  const [timeLeft, setTimeLeft] = useState(lesson.duration)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<LessonStep[]>(() =>
    lesson.steps.map((s) => ({ ...s, isComplete: false })),
  )
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  const [actionsRecord, setActionsRecord] = useState<TrainingActionRecord[]>([])
  const [expectedActionProgress, setExpectedActionProgress] = useState<
    Map<string, number>
  >(new Map())

  const currentStep = steps[currentStepIndex]
  const timerRef = useRef<number | null>(null)

  const isActionCorrect = useCallback(
    (gearId: number, direction: 1 | -1): boolean => {
      if (!currentStep?.expectedActions) return true
      const expected = currentStep.expectedActions
      const key = `${gearId}_${direction}`
      const currentCount = expectedActionProgress.get(key) ?? 0
      const matchingAction = expected.find(
        (e) => e.gearId === gearId && e.direction === direction,
      )
      if (!matchingAction) return false
      return currentCount < matchingAction.times
    },
    [currentStep, expectedActionProgress],
  )

  const checkExpectedActionsComplete = useCallback((): boolean => {
    if (!currentStep?.expectedActions) return false
    return currentStep.expectedActions.every((action) => {
      const key = `${action.gearId}_${action.direction}`
      const count = expectedActionProgress.get(key) ?? 0
      return count >= action.times
    })
  }, [currentStep, expectedActionProgress])

  const advanceStep = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      return
    }
    const newSteps = [...steps]
    newSteps[currentStepIndex].isComplete = true
    setSteps(newSteps)
    setCurrentStepIndex((prev) => prev + 1)
    setExpectedActionProgress(new Map())
    setShowHint(false)
  }, [currentStepIndex, steps])

  const checkLessonComplete = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return false
    if (!scene.checkTargetReached()) return false
    if (currentStepIndex < steps.length - 1) return false
    return steps.every((s, idx) => idx === currentStepIndex ? true : s.isComplete)
  }, [sceneRef, currentStepIndex, steps])

  const endGame = useCallback(
    (success: boolean) => {
      if (gameEnded) return
      setGameEnded(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      const scene = sceneRef.current
      if (scene) {
        if (success) {
          scene.playSuccessAnimation()
        }
      }

      const stepsCompleted = steps.filter((s, idx) => idx <= currentStepIndex && (s.isComplete || idx === currentStepIndex)).length
      const finalSteps = [...steps]
      if (success) {
        finalSteps[currentStepIndex].isComplete = true
      }

      const score = trainingSystem.calculateScore(
        lesson,
        timeLeft,
        stepsCompleted,
        mistakes,
        hintsUsed,
      )

      const result: TrainingGameResult = {
        lessonId: lesson.id,
        success,
        score,
        timeLeft: success ? timeLeft : 0,
        stepsCompleted,
        totalSteps: lesson.steps.length,
        stars: 0,
        mistakes,
        hintsUsed,
        actionsRecord,
      }
      result.stars = trainingSystem.calculateStars(result, lesson)

      setTimeout(() => {
        onGameEnd(result)
      }, 2000)
    },
    [gameEnded, steps, currentStepIndex, timeLeft, mistakes, hintsUsed, actionsRecord, lesson, onGameEnd],
  )

  const handleGearClick = useCallback(
    (gearId: number, direction: 1 | -1) => {
      if (gameEnded) return

      const scene = sceneRef.current
      if (!scene) return

      const isCorrect = isActionCorrect(gearId, direction)
      const timestamp = Date.now()

      const gearConfig = lesson.gears.find((g) => g.id === gearId)
      let timeDelta = gearConfig ? GEAR_TIME_DELTAS[gearConfig.size] * direction : 0
      gearConfig?.connectedTo.forEach((cid) => {
        const connected = lesson.gears.find((g) => g.id === cid)
        if (connected) {
          timeDelta += GEAR_TIME_DELTAS[connected.size] * (-direction)
        }
      })

      const newRecord: TrainingActionRecord = {
        timestamp,
        gearId,
        direction,
        timeDelta,
        isCorrect,
      }
      setActionsRecord((prev) => [...prev, newRecord])

      if (!isCorrect) {
        setMistakes((prev) => prev + 1)
        scene.playMistakeAnimation(gearId)
      }

      if (currentStep?.expectedActions) {
        const key = `${gearId}_${direction}`
        setExpectedActionProgress((prev) => {
          const newMap = new Map(prev)
          const current = newMap.get(key) ?? 0
          newMap.set(key, current + 1)
          return newMap
        })
      }
    },
    [gameEnded, lesson, isActionCorrect, currentStep],
  )

  const handleTimeChange = useCallback((_time: ClockTime) => {}, [])

  const handleTargetReached = useCallback(() => {
    if (gameEnded) return
    if (checkLessonComplete()) {
      endGame(true)
    }
  }, [gameEnded, checkLessonComplete, endGame])

  const handleStepAdvance = useCallback(() => {}, [])

  const handleHintUsed = useCallback(() => {}, [])

  const handleUseHint = useCallback(() => {
    if (showHint) return
    setShowHint(true)
    setHintsUsed((prev) => prev + 1)
    if (currentStep?.expectedActions && currentStep.expectedActions.length > 0) {
      const firstAction = currentStep.expectedActions[0]
      sceneRef.current?.showHintPulse(firstAction.gearId)
    }
  }, [showHint, currentStep])

  const handleManualAdvance = useCallback(() => {
    if (!currentStep) return
    if (currentStep.type === 'instruction' || currentStep.type === 'quiz') {
      advanceStep()
    } else if (currentStep.type === 'checkpoint') {
      if (currentStepIndex === steps.length - 1) {
        if (sceneRef.current?.checkTargetReached()) {
          endGame(true)
        }
      } else {
        advanceStep()
      }
    } else if (currentStep.type === 'demo' || currentStep.type === 'challenge') {
      if (checkExpectedActionsComplete()) {
        advanceStep()
      }
    }
  }, [currentStep, currentStepIndex, steps, advanceStep, checkExpectedActionsComplete, endGame])

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new TrainingScene()
    sceneRef.current = scene

    scene.setLesson(lesson)
    scene.setCurrentStep(currentStep)

    scene.setCallbacks({
      onGearClick: handleGearClick,
      onTimeChange: handleTimeChange,
      onStepAdvance: handleStepAdvance,
      onTargetReached: handleTargetReached,
      onHintUsed: handleHintUsed,
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
      backgroundColor: '#0f1020',
      scene: [scene],
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    const initScene = () => {
      if (scene.scene.isActive()) {
        scene.setupLessonGears()
        scene.setInitialTime(lesson.initialClockTime)
        scene.setTargetTime(lesson.targetClockTime)
        scene.setCurrentStep(currentStep)
      } else {
        setTimeout(initScene, 100)
      }
    }
    initScene()

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          endGame(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      game.destroy(true)
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (scene) {
      scene.setCurrentStep(currentStep)
    }
  }, [currentStepIndex, currentStep])

  useEffect(() => {
    if (checkExpectedActionsComplete() && (currentStep?.type === 'demo' || currentStep?.type === 'challenge')) {
      const timer = setTimeout(() => {
        advanceStep()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [expectedActionProgress, currentStep, checkExpectedActionsComplete, advanceStep])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getStepTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      instruction: '📖 讲解',
      demo: '🎬 演示',
      challenge: '🎯 挑战',
      quiz: '❓ 思考',
      checkpoint: '🏁 检查点',
    }
    return labels[type] ?? type
  }

  const canAdvanceManually = (): boolean => {
    if (!currentStep) return false
    if (currentStep.type === 'instruction' || currentStep.type === 'quiz') return true
    if (currentStep.type === 'checkpoint') return true
    if (currentStep.type === 'demo' || currentStep.type === 'challenge') {
      return checkExpectedActionsComplete()
    }
    return false
  }

  return (
    <div className="training-game-container">
      <div className="training-top-bar">
        <div className="training-header">
          <button className="training-exit-btn" onClick={onExit}>
            ← 退出训练
          </button>
          <div className="training-lesson-info">
            <div className="training-lesson-title">{lesson.title}</div>
            <div className="training-lesson-subtitle">{lesson.subtitle}</div>
          </div>
          <div className="training-timer">
            <span className={`training-time ${timeLeft <= 30 ? 'danger' : ''}`}>
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="training-steps-progress">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`training-step-dot ${
                idx === currentStepIndex
                  ? 'active'
                  : step.isComplete
                    ? 'complete'
                    : 'pending'
              }`}
              title={`步骤${idx + 1}: ${step.title}`}
            >
              <span className="step-number">{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="training-main-content">
        <div ref={canvasRef} className="training-canvas" />

        <div className="training-side-panel">
          <div className="training-step-card">
            <div className="training-step-header">
              <span className="training-step-type">{getStepTypeLabel(currentStep?.type ?? '')}</span>
              <span className="training-step-progress">
                {currentStepIndex + 1} / {steps.length}
              </span>
            </div>
            <h3 className="training-step-title">{currentStep?.title}</h3>
            <p className="training-step-content">{currentStep?.content}</p>

            {currentStep?.expectedActions && currentStep.expectedActions.length > 0 && (
              <div className="training-expected-actions">
                <div className="training-actions-title">操作目标：</div>
                {currentStep.expectedActions.map((action, idx) => {
                  const key = `${action.gearId}_${action.direction}`
                  const progress = expectedActionProgress.get(key) ?? 0
                  const gear = lesson.gears.find((g) => g.id === action.gearId)
                  return (
                    <div
                      key={idx}
                      className={`training-action-item ${progress >= action.times ? 'done' : ''}`}
                    >
                      <span className="action-gear">{gear?.label ?? `齿轮${action.gearId}`}</span>
                      <span className="action-direction">
                        {action.direction === 1 ? '→ 前进' : '← 后退'}
                      </span>
                      <span className="action-progress">
                        {Math.min(progress, action.times)} / {action.times}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {showHint && currentStep?.hint && (
              <div className="training-hint-box">
                💡 <strong>提示：</strong>
                {currentStep.hint}
              </div>
            )}

            <div className="training-step-actions">
              {currentStep?.hint && !showHint && (
                <button className="training-hint-btn" onClick={handleUseHint}>
                  💡 查看提示 (-5分)
                </button>
              )}
              {canAdvanceManually() && (
                <button
                  className="training-next-btn"
                  onClick={handleManualAdvance}
                >
                  {currentStepIndex === steps.length - 1 && currentStep?.type === 'checkpoint'
                    ? '✅ 完成课程'
                    : '下一步 →'}
                </button>
              )}
            </div>
          </div>

          <div className="training-stats-card">
            <div className="training-stat-item">
              <span className="stat-label">操作失误</span>
              <span className={`stat-value ${mistakes > 0 ? 'bad' : 'good'}`}>{mistakes}</span>
            </div>
            <div className="training-stat-item">
              <span className="stat-label">使用提示</span>
              <span className={`stat-value ${hintsUsed > 0 ? 'warn' : 'good'}`}>{hintsUsed}</span>
            </div>
            <div className="training-stat-item">
              <span className="stat-label">操作次数</span>
              <span className="stat-value">{actionsRecord.length}</span>
            </div>
          </div>

          <div className="training-legend-card">
            <div className="training-legend-title">齿轮说明：</div>
            <div className="training-legend-item">
              <span className="legend-color large" />
              <span>大齿轮：±60分钟</span>
            </div>
            <div className="training-legend-item">
              <span className="legend-color medium" />
              <span>中齿轮：±15分钟</span>
            </div>
            <div className="training-legend-item">
              <span className="legend-color small" />
              <span>小齿轮：±5分钟</span>
            </div>
            <div className="training-legend-hint">
              💡 点击齿轮右半边→前进时间，左半边→后退时间
            </div>
            <div className="training-legend-hint">
              ⚙️ 连接的齿轮会反向转动！
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingGame
