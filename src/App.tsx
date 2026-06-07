import { useState, useCallback } from 'react'
import Game from './game/Game'
import StartScreen from './ui/StartScreen'
import GameOverPanel from './ui/GameOverPanel'
import type { GameResult } from './types'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const handleStart = useCallback(() => {
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

  return (
    <div className="app-container">
      {!gameStarted && !gameResult && <StartScreen onStart={handleStart} />}
      {gameStarted && <Game onGameEnd={handleGameEnd} />}
      {gameResult && (
        <GameOverPanel result={gameResult} onRestart={handleRestart} />
      )}
    </div>
  )
}

export default App
