import { useState, useCallback } from 'react'
import Game from './game/Game'
import MultiClockGame from './game/MultiClockGame'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import MultiClockGameOverPanel from './ui/MultiClockGameOverPanel'
import WorkshopPanel from './ui/WorkshopPanel'
import LevelEditor from './ui/LevelEditor'
import type { GameResult, GameMode, MultiClockGameResult } from './types'

type AnyGameResult = GameResult | MultiClockGameResult

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResult, setGameResult] = useState<AnyGameResult | null>(null)
  const [currentMode, setCurrentMode] = useState<GameMode>('classic')
  const [showWorkshop, setShowWorkshop] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const handleStart = useCallback((mode: GameMode) => {
    setCurrentMode(mode)
    setGameStarted(true)
    setGameResult(null)
  }, [])

  const handleGameEnd = useCallback((result: AnyGameResult) => {
    setGameResult(result)
    setGameStarted(false)
  }, [])

  const handleRestart = useCallback(() => {
    setGameStarted(true)
    setGameResult(null)
  }, [])

  const handleBackToMenu = useCallback(() => {
    setGameStarted(false)
    setGameResult(null)
  }, [])

  const handleOpenWorkshop = useCallback(() => {
    setShowWorkshop(true)
  }, [])

  const handleCloseWorkshop = useCallback(() => {
    setShowWorkshop(false)
  }, [])

  const handleOpenEditor = useCallback(() => {
    setShowEditor(true)
  }, [])

  const handleCloseEditor = useCallback(() => {
    setShowEditor(false)
  }, [])

  const isMultiClockResult = (r: AnyGameResult | null): r is MultiClockGameResult => {
    return r !== null && 'sideTowersAligned' in r
  }

  return (
    <div className="app-container">
      {!gameStarted && !gameResult && !showWorkshop && !showEditor && (
        <StartScreen onStart={handleStart} onOpenWorkshop={handleOpenWorkshop} onOpenEditor={handleOpenEditor} />
      )}
      {gameStarted && currentMode !== 'multiclock' && (
        <Game onGameEnd={handleGameEnd} mode={currentMode} />
      )}
      {gameStarted && currentMode === 'multiclock' && (
        <MultiClockGame onGameEnd={handleGameEnd} />
      )}
      {gameResult && !showWorkshop && !isMultiClockResult(gameResult) && (
        <GameOverPanel
          result={gameResult as GameResult}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          onOpenWorkshop={handleOpenWorkshop}
        />
      )}
      {gameResult && !showWorkshop && isMultiClockResult(gameResult) && (
        <MultiClockGameOverPanel
          result={gameResult as MultiClockGameResult}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          onOpenWorkshop={handleOpenWorkshop}
        />
      )}
      {showWorkshop && <WorkshopPanel onClose={handleCloseWorkshop} />}
      {showEditor && <LevelEditor onClose={handleCloseEditor} />}
    </div>
  )
}

export default App
