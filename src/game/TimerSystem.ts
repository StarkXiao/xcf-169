export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerCallbacks {
  onTick?: (timeLeft: number) => void
  onWarning?: () => void
  onDanger?: () => void
  onTimeout?: () => void
}

const WARNING_THRESHOLD = 30
const DANGER_THRESHOLD = 10

export class TimerSystem {
  private totalTime: number
  private timeLeft: number
  private status: TimerStatus = 'idle'
  private lastTickTime: number = 0
  private animationFrameId: number | null = null
  private callbacks: TimerCallbacks
  private warningTriggered = false
  private dangerTriggered = false

  constructor(totalSeconds: number, callbacks: TimerCallbacks = {}) {
    this.totalTime = totalSeconds
    this.timeLeft = totalSeconds
    this.callbacks = callbacks
  }

  start(): void {
    if (this.status === 'running') return
    this.status = 'running'
    this.lastTickTime = performance.now()
    this.warningTriggered = false
    this.dangerTriggered = false
    this.tick()
  }

  pause(): void {
    if (this.status !== 'running') return
    this.status = 'paused'
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  resume(): void {
    if (this.status !== 'paused') return
    this.status = 'running'
    this.lastTickTime = performance.now()
    this.tick()
  }

  reset(newTotal?: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    if (newTotal !== undefined) {
      this.totalTime = newTotal
    }
    this.timeLeft = this.totalTime
    this.status = 'idle'
    this.warningTriggered = false
    this.dangerTriggered = false
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.status = 'finished'
  }

  getTimeLeft(): number {
    return Math.max(0, Math.ceil(this.timeLeft))
  }

  getTotalTime(): number {
    return this.totalTime
  }

  getStatus(): TimerStatus {
    return this.status
  }

  getProgress(): number {
    return this.timeLeft / this.totalTime
  }

  addTime(seconds: number): void {
    this.timeLeft = Math.min(this.totalTime, this.timeLeft + seconds)
  }

  private tick = (): void => {
    if (this.status !== 'running') return

    const now = performance.now()
    const delta = (now - this.lastTickTime) / 1000
    this.lastTickTime = now

    this.timeLeft -= delta

    if (this.timeLeft <= WARNING_THRESHOLD && !this.warningTriggered) {
      this.warningTriggered = true
      this.callbacks.onWarning?.()
    }
    if (this.timeLeft <= DANGER_THRESHOLD && !this.dangerTriggered) {
      this.dangerTriggered = true
      this.callbacks.onDanger?.()
    }

    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this.status = 'finished'
      this.callbacks.onTick?.(0)
      this.callbacks.onTimeout?.()
      return
    }

    this.callbacks.onTick?.(this.timeLeft)
    this.animationFrameId = requestAnimationFrame(this.tick)
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
