import { useState, useCallback, useRef } from 'react'
import Game from './game/Game'
import MultiClockGame from './game/MultiClockGame'
import CustomGame from './game/CustomGame'
import TrainingGame from './game/TrainingGame'
import RoguelikeGame from './game/roguelike/RoguelikeGame'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import MultiClockGameOverPanel from './ui/MultiClockGameOverPanel'
import WorkshopPanel from './ui/WorkshopPanel'
import BellChimePanel from './ui/BellChimePanel'
import LevelEditor from './ui/LevelEditor'
import AdminPanel from './admin/AdminPanel'
import TrainingPanel from './ui/TrainingPanel'
import TrainingReviewPanel from './ui/TrainingReviewPanel'
import RoguelikeResultPanel from './ui/RoguelikeResultPanel'
import type { GameResult, GameMode, MultiClockGameResult, EditorLevelConfig, TrainingLesson, TrainingGameResult } from './types'
import type { RoguelikeGameResult } from './types/roguelike'
import { loadEditorLevel, loadCustomLevelFromStorage, saveCustomLevelToStorage, type LoadedLevel } from './game/LevelLoader'
import { workshopSystem } from './game/WorkshopSystem'
import { bellChimeSystem } from './game/BellChimeSystem'
import './styles/roguelike.css'

type AnyGameResult = GameResult | MultiClockGameResult
type AppView = 'menu' | 'game' | 'result' | 'workshop' | 'bellchime' | 'editor' | 'customGame' | 'admin' | 'training' | 'trainingGame' | 'trainingReview' | 'roguelike' | 'roguelikeResult'

function App() {
  const [view, setView] = useState<AppView>('menu')
  const [gameResult, setGameResult] = useState<AnyGameResult | null>(null)
  const [currentMode, setCurrentMode] = useState<GameMode>('classic')
  const [customLevel, setCustomLevel] = useState<LoadedLevel | null>(null)
  const [currentTrainingLesson, setCurrentTrainingLesson] = useState<TrainingLesson | null>(null)
  const [trainingResult, setTrainingResult] = useState<TrainingGameResult | null>(null)
  const [roguelikeResult, setRoguelikeResult] = useState<RoguelikeGameResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const goTo = useCallback((v: AppView) => setView(v), [])

  const handleStart = useCallback((mode: GameMode) => {
    setCurrentMode(mode)
    setGameResult(null)
    setCustomLevel(null)
    goTo('game')
  }, [goTo])

  const handleGameEnd = useCallback((result: AnyGameResult) => {
    setGameResult(result)
    workshopSystem.recordGameScore(result.score)
    bellChimeSystem.recordScore(result.score)
    bellChimeSystem.resetTriggers()
    goTo('result')
  }, [goTo])

  const handleRestart = useCallback(() => {
    setGameResult(null)
    if (customLevel) {
      goTo('customGame')
    } else {
      goTo('game')
    }
  }, [customLevel, goTo])

  const handleBackToMenu = useCallback(() => {
    setGameResult(null)
    setCustomLevel(null)
    goTo('menu')
  }, [goTo])

  const handleOpenWorkshop = useCallback(() => goTo('workshop'), [goTo])
  const handleCloseWorkshop = useCallback(() => goTo('menu'), [goTo])

  const handleOpenBellChime = useCallback(() => goTo('bellchime'), [goTo])
  const handleCloseBellChime = useCallback(() => goTo('menu'), [goTo])

  const handleOpenEditor = useCallback(() => goTo('editor'), [goTo])
  const handleCloseEditor = useCallback(() => goTo('menu'), [goTo])

  const handleOpenAdmin = useCallback(() => goTo('admin'), [goTo])
  const handleCloseAdmin = useCallback(() => goTo('menu'), [goTo])

  const handleOpenTraining = useCallback(() => goTo('training'), [goTo])
  const handleCloseTraining = useCallback(() => goTo('menu'), [goTo])

  const handleStartTrainingLesson = useCallback((lesson: TrainingLesson) => {
    setCurrentTrainingLesson(lesson)
    setTrainingResult(null)
    goTo('trainingGame')
  }, [goTo])

  const handleTrainingGameEnd = useCallback((result: TrainingGameResult) => {
    setTrainingResult(result)
    goTo('trainingReview')
  }, [goTo])

  const handleExitTrainingGame = useCallback(() => {
    setCurrentTrainingLesson(null)
    setTrainingResult(null)
    goTo('training')
  }, [goTo])

  const handleTrainingRestart = useCallback(() => {
    if (currentTrainingLesson) {
      setTrainingResult(null)
      goTo('trainingGame')
    }
  }, [currentTrainingLesson, goTo])

  const handleTrainingNextLesson = useCallback(() => {
    goTo('training')
  }, [goTo])

  const handleBackToTraining = useCallback(() => {
    setCurrentTrainingLesson(null)
    setTrainingResult(null)
    goTo('training')
  }, [goTo])

  const handleStartRoguelike = useCallback(() => {
    setRoguelikeResult(null)
    goTo('roguelike')
  }, [goTo])

  const handleRoguelikeEnd = useCallback((result: RoguelikeGameResult) => {
    setRoguelikeResult(result)
    workshopSystem.recordGameScore(result.totalScore)
    bellChimeSystem.recordScore(result.totalScore)
    bellChimeSystem.resetTriggers()
    goTo('roguelikeResult')
  }, [goTo])

  const handleRoguelikeExit = useCallback(() => {
    setRoguelikeResult(null)
    goTo('menu')
  }, [goTo])

  const handleRoguelikeRestart = useCallback(() => {
    setRoguelikeResult(null)
    goTo('roguelike')
  }, [goTo])

  const handlePlayEditorLevel = useCallback((_levelConfig: EditorLevelConfig) => {
    const loaded = loadCustomLevelFromStorage()
    if (loaded) {
      setCustomLevel(loaded)
      setGameResult(null)
      goTo('customGame')
    }
  }, [goTo])

  const handleExitCustomGame = useCallback(() => {
    goTo('editor')
  }, [goTo])

  const handleImportCustomLevel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string)
        const loaded = loadEditorLevel(parsed)
        saveCustomLevelToStorage(loaded)
        setCustomLevel(loaded)
        setGameResult(null)
        goTo('customGame')
      } catch (err) {
        alert(`导入失败：${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [goTo])

  const isMultiClockResult = (r: AnyGameResult | null): r is MultiClockGameResult => {
    return r !== null && 'sideTowersAligned' in r
  }

  const showGame = view === 'game'
  const showCustomGame = view === 'customGame'
  const showResult = view === 'result'
  const showWorkshop = view === 'workshop'
  const showBellChime = view === 'bellchime'
  const showEditor = view === 'editor'
  const showAdmin = view === 'admin'
  const showTraining = view === 'training'
  const showTrainingGame = view === 'trainingGame'
  const showTrainingReview = view === 'trainingReview'
  const showRoguelike = view === 'roguelike'
  const showRoguelikeResult = view === 'roguelikeResult'
  const showMenu = view === 'menu' && !showGame && !showCustomGame && !showResult && !showWorkshop && !showBellChime && !showEditor && !showAdmin && !showTraining && !showTrainingGame && !showTrainingReview && !showRoguelike && !showRoguelikeResult

  return (
    <div className="app-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportCustomLevel}
      />
      {showMenu && (
        <StartScreen
          onStart={handleStart}
          onOpenWorkshop={handleOpenWorkshop}
          onOpenBellChime={handleOpenBellChime}
          onOpenEditor={handleOpenEditor}
          onImportLevel={() => fileInputRef.current?.click()}
          onOpenAdmin={handleOpenAdmin}
          onOpenTraining={handleOpenTraining}
          onStartRoguelike={handleStartRoguelike}
        />
      )}
      {showGame && currentMode !== 'multiclock' && (
        <Game onGameEnd={handleGameEnd} mode={currentMode} />
      )}
      {showGame && currentMode === 'multiclock' && (
        <MultiClockGame onGameEnd={handleGameEnd} />
      )}
      {showCustomGame && customLevel && (
        <CustomGame
          level={customLevel}
          onGameEnd={handleGameEnd}
          onExit={handleExitCustomGame}
        />
      )}
      {showResult && !showWorkshop && !showBellChime && !isMultiClockResult(gameResult) && (
        <GameOverPanel
          result={gameResult as GameResult}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          onOpenWorkshop={handleOpenWorkshop}
          onOpenBellChime={handleOpenBellChime}
        />
      )}
      {showResult && !showWorkshop && !showBellChime && isMultiClockResult(gameResult) && (
        <MultiClockGameOverPanel
          result={gameResult as MultiClockGameResult}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          onOpenWorkshop={handleOpenWorkshop}
          onOpenBellChime={handleOpenBellChime}
        />
      )}
      {showWorkshop && <WorkshopPanel onClose={handleCloseWorkshop} />}
      {showBellChime && <BellChimePanel onClose={handleCloseBellChime} />}
      {showEditor && <LevelEditor onClose={handleCloseEditor} onPlay={handlePlayEditorLevel} />}
      {showAdmin && <AdminPanel onClose={handleCloseAdmin} />}
      {showTraining && (
        <TrainingPanel
          onClose={handleCloseTraining}
          onStartLesson={handleStartTrainingLesson}
        />
      )}
      {showTrainingGame && currentTrainingLesson && (
        <TrainingGame
          lesson={currentTrainingLesson}
          onGameEnd={handleTrainingGameEnd}
          onExit={handleExitTrainingGame}
        />
      )}
      {showTrainingReview && currentTrainingLesson && trainingResult && (
        <TrainingReviewPanel
          lesson={currentTrainingLesson}
          result={trainingResult}
          onRestart={handleTrainingRestart}
          onBackToTraining={handleBackToTraining}
          onNextLesson={handleTrainingNextLesson}
        />
      )}
      {showRoguelike && (
        <RoguelikeGame
          nightNumber={1}
          totalNights={7}
          onGameEnd={handleRoguelikeEnd}
          onExit={handleRoguelikeExit}
        />
      )}
      {showRoguelikeResult && roguelikeResult && (
        <RoguelikeResultPanel
          result={roguelikeResult}
          onRestart={handleRoguelikeRestart}
          onBackToMenu={handleRoguelikeExit}
        />
      )}
    </div>
  )
}

export default App
