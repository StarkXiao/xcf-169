export class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private masterGain: GainNode | null = null
  private rainSource: AudioBufferSourceNode | null = null
  private rainGain: GainNode | null = null

  constructor() {
    this.initContext()
  }

  private initContext(): void {
    try {
      const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      this.audioContext = new AudioCtx()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.5
      this.masterGain.connect(this.audioContext.destination)
    } catch (e) {
      console.warn('Web Audio API not supported')
    }
  }

  private ensureContext(): boolean {
    if (!this.audioContext || !this.masterGain) {
      this.initContext()
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
    return !!this.audioContext && !!this.masterGain && this.enabled
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 0.5 : 0
    }
    if (!this.enabled) {
      this.stopRain()
    } else {
      this.playRain()
    }
    return this.enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? 0.5 : 0
    }
  }

  playGearRotate(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(180, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(90, this.audioContext.currentTime + 0.15)

    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.15)
  }

  playGearSnap(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.08)

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.1)
  }

  playAlignSuccess(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const frequencies = [523.25, 659.25, 783.99]
    frequencies.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      const startTime = this.audioContext!.currentTime + i * 0.1
      gain.gain.setValueAtTime(0.2, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  }

  playBellChime(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const bellFreqs = [220, 277.18, 329.63, 440]
    bellFreqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      osc.type = 'sine'
      osc.frequency.value = freq

      const startTime = this.audioContext!.currentTime + i * 0.3
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + 1.5)
    })
  }

  playThunder(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }

    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    noise.start()
  }

  playRain(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return
    if (this.rainSource) return

    const bufferSize = 2 * this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }

    this.rainSource = this.audioContext.createBufferSource()
    this.rainSource.buffer = buffer
    this.rainSource.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 800

    this.rainGain = this.audioContext.createGain()
    this.rainGain.gain.value = 0.08

    this.rainSource.connect(filter)
    filter.connect(this.rainGain)
    this.rainGain.connect(this.masterGain)

    this.rainSource.start()
  }

  stopRain(): void {
    if (this.rainSource) {
      this.rainSource.stop()
      this.rainSource.disconnect()
      this.rainSource = null
    }
    if (this.rainGain) {
      this.rainGain.disconnect()
      this.rainGain = null
    }
  }

  playTick(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.value = 1000

    gain.gain.setValueAtTime(0.05, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.05)
  }

  playGameOver(success: boolean): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    if (success) {
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const startTime = this.audioContext!.currentTime + i * 0.15
        gain.gain.setValueAtTime(0.25, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
        osc.connect(gain)
        gain.connect(this.masterGain!)
        osc.start(startTime)
        osc.stop(startTime + 0.4)
      })
    } else {
      const notes = [400, 350, 300, 200]
      notes.forEach((freq, i) => {
        const osc = this.audioContext!.createOscillator()
        const gain = this.audioContext!.createGain()
        osc.type = 'sawtooth'
        osc.frequency.value = freq
        const startTime = this.audioContext!.currentTime + i * 0.2
        gain.gain.setValueAtTime(0.15, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)
        osc.connect(gain)
        gain.connect(this.masterGain!)
        osc.start(startTime)
        osc.stop(startTime + 0.4)
      })
    }
  }

  destroy(): void {
    this.stopRain()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}
