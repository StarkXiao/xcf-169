export interface ClockTime {
  hours: number
  minutes: number
}

export interface GearState {
  id: number
  angle: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
  timeDelta: number
}

export interface GameResult {
  success: boolean
  score: number
  timeLeft: number
}

export type GameStatus = 'idle' | 'playing' | 'success' | 'failed'
