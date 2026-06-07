import { useState, useCallback } from 'react'
import Game from './game/Game'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import type { GameResult, GameMode } from './types'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [currentMode, setCurrentMode] = useState<GameMode>('classic')

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

  return (
    <div className="app-container">
      {!gameStarted && !gameResult && <StartScreen onStart={handleStart} />}
      {gameStarted && <Game onGameEnd={handleGameEnd} mode={currentMode} />}
      {gameResult && (
        <GameOverPanel
          result={gameResult}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}

export default App
