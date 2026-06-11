import { useState, useCallback, useRef } from 'react'
import Game from './game/Game'
import MultiClockGame from './game/MultiClockGame'
import DuoCoopGame from './game/DuoCoopGame'
import CustomGame from './game/CustomGame'
import TrainingGame from './game/TrainingGame'
import RoguelikeGame from './game/roguelike/RoguelikeGame'
import ContinuousShiftGame from './game/ContinuousShiftGame'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import MultiClockGameOverPanel from './ui/MultiClockGameOverPanel'
import DuoCoopGameOverPanel from './ui/DuoCoopGameOverPanel'
import WorkshopPanel from './ui/WorkshopPanel'
import BellChimePanel from './ui/BellChimePanel'
import LevelEditor from './ui/LevelEditor'
import AdminPanel from './admin/AdminPanel'
import TrainingPanel from './ui/TrainingPanel'
import TrainingReviewPanel from './ui/TrainingReviewPanel'
import RoguelikeResultPanel from './ui/RoguelikeResultPanel'
import MuseumGameView from './ui/museum/MuseumGameView'
import LevelSharePanel from './ui/LevelSharePanel'
import FestivalActivityPanel from './ui/FestivalActivityPanel'
import KeeperDiaryPanel from './ui/KeeperDiaryPanel'
import ClocktowerLedgerPanel from './ui/ClocktowerLedgerPanel'
import AchievementBookPanel from './ui/AchievementBookPanel'
import ContinuousShiftResultPanel from './ui/ContinuousShiftResultPanel'
import type { GameResult, GameMode, MultiClockGameResult, EditorLevelConfig, TrainingLesson, TrainingGameResult, DuoCoopGameResult, Achievement, SpecialBell } from './types'
import type { RoguelikeGameResult } from './types/roguelike'
import type { ShiftGameResult } from './types/continuousShift'
import { loadEditorLevel, loadCustomLevelFromStorage, saveCustomLevelToStorage, type LoadedLevel } from './game/LevelLoader'
import { workshopSystem } from './game/WorkshopSystem'
import { bellChimeSystem } from './game/BellChimeSystem'
import { levelShareSystem } from './game/LevelShareSystem'
import { keeperDiarySystem } from './game/KeeperDiarySystem'
import { clocktowerRecordSystem } from './game/ClocktowerRecordSystem'
import { achievementSystem } from './game/AchievementSystem'
import { ContinuousShiftSystem } from './game/ContinuousShiftSystem'
import './styles/roguelike.css'
import './styles/museum.css'
import './styles/level-share.css'
import './styles/keeper-diary.css'
import './styles/clocktower-ledger.css'
import './styles/achievement-book.css'
import './styles/continuousShift.css'

type AnyGameResult = GameResult | MultiClockGameResult | DuoCoopGameResult
type AppView = 'menu' | 'game' | 'result' | 'workshop' | 'bellchime' | 'editor' | 'customGame' | 'admin' | 'training' | 'trainingGame' | 'trainingReview' | 'roguelike' | 'roguelikeResult' | 'duoCoop' | 'duoCoopResult' | 'museum' | 'levelShare' | 'festival' | 'keeperDiary' | 'ledger' | 'achievements' | 'continuousShift' | 'continuousShiftResult'

function App() {
  const [view, setView] = useState<AppView>('menu')
  const [gameResult, setGameResult] = useState<AnyGameResult | null>(null)
  const [currentMode, setCurrentMode] = useState<GameMode>('classic')
  const [customLevel, setCustomLevel] = useState<LoadedLevel | null>(null)
  const [currentTrainingLesson, setCurrentTrainingLesson] = useState<TrainingLesson | null>(null)
  const [trainingResult, setTrainingResult] = useState<TrainingGameResult | null>(null)
  const [roguelikeResult, setRoguelikeResult] = useState<RoguelikeGameResult | null>(null)
  const [duoCoopResult, setDuoCoopResult] = useState<DuoCoopGameResult | null>(null)
  const [continuousShiftResult, setContinuousShiftResult] = useState<ShiftGameResult | null>(null)
  const [loadSavedShift, setLoadSavedShift] = useState(false)
  const [currentSharedLevelId, setCurrentSharedLevelId] = useState<string | null>(null)
  const [newUnlockedAchievements, setNewUnlockedAchievements] = useState<Achievement[]>([])
  const [newCollectedBells, setNewCollectedBells] = useState<SpecialBell[]>([])
  const [isNewRecord, setIsNewRecord] = useState(false)
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

    if (currentSharedLevelId && result.success && customLevel) {
      const timeUsed = customLevel.duration - result.timeLeft
      const deviation = result.totalDeviation ?? 0
      levelShareSystem.recordClear(currentSharedLevelId, result.score, Math.max(1, timeUsed), deviation)
    }

    const totalTime = customLevel ? customLevel.duration : 120
    const timeUsed = totalTime - result.timeLeft
    const isPerfect = result.score >= 2500
    const hadFaults = result.score < 2000 && result.success
    keeperDiarySystem.recordGameResult(
      result.success,
      result.score,
      Math.max(1, timeUsed),
      isPerfect,
      hadFaults
    )

    const bellEvaluation = (result as any).bellEvaluation

    const recordResult = clocktowerRecordSystem.recordGameResult(
      result,
      currentMode,
      {
        levelId: customLevel ? 'custom' : undefined,
        levelName: customLevel?.name,
        evaluation: bellEvaluation,
        timeLimit: totalTime,
      }
    )
    setIsNewRecord(recordResult.isNewBest)

    const isPatrolMode = (result as GameResult).isPatrolMode ?? false
    const achievementResult = achievementSystem.recordGameResult(
      result as GameResult,
      {
        evaluation: bellEvaluation,
        timeUsed,
        deviation: (result as any).totalDeviation ?? 0,
        isPatrolComplete: isPatrolMode && result.success,
        gameMode: currentMode,
      }
    )
    setNewUnlockedAchievements(achievementResult.achievements.map(a => a.achievement))
    setNewCollectedBells(achievementResult.newBells)

    goTo('result')
  }, [goTo, currentSharedLevelId, customLevel, currentMode])

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

  const handleStartContinuousShift = useCallback(() => {
    setContinuousShiftResult(null)
    setLoadSavedShift(false)
    goTo('continuousShift')
  }, [goTo])

  const handleContinueContinuousShift = useCallback(() => {
    setContinuousShiftResult(null)
    setLoadSavedShift(true)
    goTo('continuousShift')
  }, [goTo])

  const handleContinuousShiftEnd = useCallback((result: ShiftGameResult) => {
    setContinuousShiftResult(result)
    workshopSystem.recordGameScore(result.totalScore)
    bellChimeSystem.recordScore(result.totalScore)
    bellChimeSystem.resetTriggers()
    goTo('continuousShiftResult')
  }, [goTo])

  const handleContinuousShiftExit = useCallback(() => {
    setContinuousShiftResult(null)
    setLoadSavedShift(false)
    goTo('menu')
  }, [goTo])

  const handleContinuousShiftRestart = useCallback(() => {
    setContinuousShiftResult(null)
    setLoadSavedShift(false)
    goTo('continuousShift')
  }, [goTo])

  const handleStartDuoCoop = useCallback(() => {
    setDuoCoopResult(null)
    goTo('duoCoop')
  }, [goTo])

  const handleDuoCoopEnd = useCallback((result: DuoCoopGameResult) => {
    setDuoCoopResult(result)
    workshopSystem.recordGameScore(result.score)
    bellChimeSystem.recordScore(result.score)
    bellChimeSystem.resetTriggers()
    goTo('duoCoopResult')
  }, [goTo])

  const handleDuoCoopExit = useCallback(() => {
    setDuoCoopResult(null)
    goTo('menu')
  }, [goTo])

  const handleDuoCoopRestart = useCallback(() => {
    setDuoCoopResult(null)
    goTo('duoCoop')
  }, [goTo])

  const handleStartMuseum = useCallback(() => {
    goTo('museum')
  }, [goTo])

  const handleExitMuseum = useCallback(() => {
    goTo('menu')
  }, [goTo])

  const handleOpenLevelShare = useCallback(() => goTo('levelShare'), [goTo])
  const handleCloseLevelShare = useCallback(() => goTo('menu'), [goTo])

  const handleOpenFestival = useCallback(() => goTo('festival'), [goTo])
  const handleCloseFestival = useCallback(() => goTo('menu'), [goTo])

  const handleOpenKeeperDiary = useCallback(() => goTo('keeperDiary'), [goTo])
  const handleCloseKeeperDiary = useCallback(() => goTo('menu'), [goTo])

  const handleOpenLedger = useCallback(() => goTo('ledger'), [goTo])
  const handleCloseLedger = useCallback(() => goTo('menu'), [goTo])

  const handleOpenAchievements = useCallback(() => goTo('achievements'), [goTo])
  const handleCloseAchievements = useCallback(() => goTo('menu'), [goTo])

  const handleOpenAchievementsFromResult = useCallback(() => goTo('achievements'), [goTo])

  const handlePlaySharedLevel = useCallback((levelData: EditorLevelConfig, sharedLevelId: string) => {
    try {
      const loaded = loadEditorLevel(levelData)
      saveCustomLevelToStorage(loaded)
      setCustomLevel(loaded)
      setCurrentSharedLevelId(sharedLevelId)
      setGameResult(null)
      goTo('customGame')
    } catch (err) {
      console.error('加载分享关卡失败', err)
    }
  }, [goTo])

  const handleCreateLevelFromShare = useCallback(() => {
    goTo('editor')
  }, [goTo])

  const handleShareFromEditor = useCallback((levelData: EditorLevelConfig) => {
    levelShareSystem.setPendingLevelData(levelData)
    goTo('levelShare')
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
  const showDuoCoop = view === 'duoCoop'
  const showDuoCoopResult = view === 'duoCoopResult'
  const showMuseum = view === 'museum'
  const showLevelShare = view === 'levelShare'
  const showFestival = view === 'festival'
  const showKeeperDiary = view === 'keeperDiary'
  const showLedger = view === 'ledger'
  const showAchievements = view === 'achievements'
  const showContinuousShift = view === 'continuousShift'
  const showContinuousShiftResult = view === 'continuousShiftResult'
  const showMenu = view === 'menu' && !showGame && !showCustomGame && !showResult && !showWorkshop && !showBellChime && !showEditor && !showAdmin && !showTraining && !showTrainingGame && !showTrainingReview && !showRoguelike && !showRoguelikeResult && !showDuoCoop && !showDuoCoopResult && !showMuseum && !showLevelShare && !showFestival && !showKeeperDiary && !showLedger && !showAchievements && !showContinuousShift && !showContinuousShiftResult

  const hasSavedShiftGame = new ContinuousShiftSystem(7).hasSavedGame()

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
          onStartDuoCoop={handleStartDuoCoop}
          onStartMuseum={handleStartMuseum}
          onOpenLevelShare={handleOpenLevelShare}
          onOpenFestival={handleOpenFestival}
          onOpenKeeperDiary={handleOpenKeeperDiary}
          onOpenLedger={handleOpenLedger}
          onOpenAchievements={handleOpenAchievements}
          onStartContinuousShift={handleStartContinuousShift}
          onContinueContinuousShift={handleContinueContinuousShift}
          hasSavedShiftGame={hasSavedShiftGame}
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
          onOpenKeeperDiary={handleOpenKeeperDiary}
          onOpenAchievements={handleOpenAchievementsFromResult}
          newAchievements={newUnlockedAchievements}
          newBells={newCollectedBells}
          isNewRecord={isNewRecord}
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
      {showEditor && <LevelEditor onClose={handleCloseEditor} onPlay={handlePlayEditorLevel} onShare={handleShareFromEditor} />}
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
      {showDuoCoop && (
        <DuoCoopGame onGameEnd={handleDuoCoopEnd} />
      )}
      {showDuoCoopResult && duoCoopResult && (
        <DuoCoopGameOverPanel
          result={duoCoopResult}
          onRestart={handleDuoCoopRestart}
          onBackToMenu={handleDuoCoopExit}
        />
      )}
      {showMuseum && (
        <MuseumGameView onExit={handleExitMuseum} />
      )}
      {showLevelShare && (
        <LevelSharePanel
          onClose={handleCloseLevelShare}
          onPlayLevel={handlePlaySharedLevel}
          onCreateLevel={handleCreateLevelFromShare}
        />
      )}
      {showFestival && (
        <FestivalActivityPanel onClose={handleCloseFestival} />
      )}
      {showKeeperDiary && (
        <KeeperDiaryPanel onClose={handleCloseKeeperDiary} />
      )}
      {showLedger && (
        <ClocktowerLedgerPanel onClose={handleCloseLedger} />
      )}
      {showAchievements && (
        <AchievementBookPanel onClose={handleCloseAchievements} />
      )}
      {showContinuousShift && (
        <ContinuousShiftGame
          totalNights={7}
          loadSaved={loadSavedShift}
          onGameEnd={handleContinuousShiftEnd}
          onExit={handleContinuousShiftExit}
        />
      )}
      {showContinuousShiftResult && continuousShiftResult && (
        <ContinuousShiftResultPanel
          result={continuousShiftResult}
          onRestart={handleContinuousShiftRestart}
          onBackToMenu={handleContinuousShiftExit}
        />
      )}
    </div>
  )
}

export default App
