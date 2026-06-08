import { useState, useCallback, useRef } from 'react'
import Game from './game/Game'
import MultiClockGame from './game/MultiClockGame'
import CustomGame from './game/CustomGame'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import MultiClockGameOverPanel from './ui/MultiClockGameOverPanel'
import WorkshopPanel from './ui/WorkshopPanel'
import BellChimePanel from './ui/BellChimePanel'
import LevelEditor from './ui/LevelEditor'
import type { GameResult, GameMode, MultiClockGameResult, EditorLevelConfig } from './types'
import { loadEditorLevel, loadCustomLevelFromStorage, saveCustomLevelToStorage, type LoadedLevel } from './game/LevelLoader'
import { workshopSystem } from './game/WorkshopSystem'
import { bellChimeSystem } from './game/BellChimeSystem'

type AnyGameResult = GameResult | MultiClockGameResult
type AppView = 'menu' | 'game' | 'result' | 'workshop' | 'bellchime' | 'editor' | 'customGame'

function App() {
  const [view, setView] = useState<AppView>('menu')
  const [gameResult, setGameResult] = useState<AnyGameResult | null>(null)
  const [currentMode, setCurrentMode] = useState<GameMode>('classic')
  const [customLevel, setCustomLevel] = useState<LoadedLevel | null>(null)
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
  const showMenu = view === 'menu' && !showGame && !showCustomGame && !showResult && !showWorkshop && !showBellChime && !showEditor

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
    </div>
  )
}

export default App
