import { useState, useCallback } from 'react'
import Game from './game/Game'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import WorkshopPanel from './ui/WorkshopPanel'
import type { GameResult, GameMode } from './types'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [currentMode, setCurrentMode] = useState<GameMode>('classic')
  const [showWorkshop, setShowWorkshop] = useState(false)

  const handleStart = useCallback((mode: GameMode) => {
    setCurrentMode(mode)
    setGameStarted(true)
    setGameResult(null)
  }, [])

  const handleGameEnd = useCallback((result: GameResult) => {
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

  return (
    <div className="app-container">
      {!gameStarted && !gameResult && !showWorkshop && (
        <StartScreen onStart={handleStart} onOpenWorkshop={handleOpenWorkshop} />
      )}
      {gameStarted && <Game onGameEnd={handleGameEnd} mode={currentMode} />}
      {gameResult && !showWorkshop && (
        <GameOverPanel
          result={gameResult}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          onOpenWorkshop={handleOpenWorkshop}
        />
      )}
      {showWorkshop && <WorkshopPanel onClose={handleCloseWorkshop} />}
    </div>
  )
}

export default App
