export interface GearState {
  id: number
  angle: number
  targetAngle: number
  size: 'large' | 'medium' | 'small'
  connectedTo: number[]
}

export interface GameResult {
  success: boolean
  score: number
  timeLeft: number
  gearsAligned: number
  totalGears: number
}

export type GameStatus = 'idle' | 'playing' | 'success' | 'failed'
