import type {
  WeatherIntensity,
  GearMaterialConfig,
  SoundEvent,
  BellNote,
  BellChimePlaybackOptions,
  BellChimePreset,
  HarmonyLayerConfig,
} from '../types'
import { BELL_NOTE_FREQUENCIES } from '../types'
import type { LoadedSoundConfig } from './LevelLoader'
import { GEAR_MATERIALS } from './WorkshopSystem'
import { bellChimeSystem } from './BellChimeSystem'

const RAIN_INTENSITY_GAIN: Record<WeatherIntensity, number> = {
  calm: 0,
  light: 0.05,
  moderate: 0.1,
  heavy: 0.15,
  storm: 0.22,
}

const WIND_INTENSITY_GAIN: Record<WeatherIntensity, number> = {
  calm: 0,
  light: 0,
  moderate: 0.03,
  heavy: 0.06,
  storm: 0.1,
}

export class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private masterGain: GainNode | null = null
  private rainSource: AudioBufferSourceNode | null = null
  private rainGain: GainNode | null = null
  private windSource: AudioBufferSourceNode | null = null
  private windGain: GainNode | null = null
  private currentMaterial: GearMaterialConfig = GEAR_MATERIALS[0]
  private enhancedFeedback: boolean = false
  private soundScriptConfigs: Partial<Record<SoundEvent, LoadedSoundConfig>> = {}

  constructor() {
    this.initContext()
  }

  applySoundScripts(configs: Record<SoundEvent, LoadedSoundConfig>): void {
    this.soundScriptConfigs = { ...configs }
  }

  clearSoundScripts(): void {
    this.soundScriptConfigs = {}
  }

  private playScriptedSound(event: SoundEvent, fallback: () => void): void {
    const cfg = this.soundScriptConfigs[event]
    if (!cfg || !cfg.enabled) {
      fallback()
      return
    }
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = cfg.waveform
    osc.frequency.setValueAtTime(cfg.frequency, this.audioContext.currentTime)
    if (cfg.duration > 0.05) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, cfg.frequency * 0.6),
        this.audioContext.currentTime + cfg.duration,
      )
    }
    gain.gain.setValueAtTime(cfg.volume, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + cfg.duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + cfg.duration)
  }

  playSoundEvent(event: SoundEvent): void {
    this.triggerBellChime(event)
    switch (event) {
      case 'gear_click':
        this.playScriptedSound(event, () => this.playGearRotate())
        break
      case 'fault_occur':
        this.playScriptedSound(event, () => this.playGearFault())
        break
      case 'fault_clear':
        this.playScriptedSound(event, () => this.playGearSnap())
        break
      case 'time_aligned':
        this.playScriptedSound(event, () => this.playAlignSuccess())
        break
      case 'level_success':
        this.playScriptedSound(event, () => this.playGameOver(true))
        break
      case 'level_fail':
        this.playScriptedSound(event, () => this.playGameOver(false))
        break
      case 'weather_change':
        this.playScriptedSound(event, () => this.playThunder())
        break
      case 'period_transition':
        this.playScriptedSound(event, () => this.playPeriodTransition())
        break
      case 'alarm_ring':
        this.playScriptedSound(event, () => this.playTick())
        break
      case 'tower_align':
        this.playScriptedSound(event, () => this.playBellChime())
        break
      case 'storm_warning':
        this.playScriptedSound(event, () => this.playStormWarning())
        break
      case 'lightning_strike':
        this.playScriptedSound(event, () => this.playLightningStrike())
        break
      case 'storm_rollback':
        this.playScriptedSound(event, () => this.playStormRollback())
        break
      case 'storm_end':
        this.playScriptedSound(event, () => this.playStormEnd())
        break
    }
  }

  playStormWarning(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime)
    osc.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + 0.3)
    osc.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.6)
    gain.gain.setValueAtTime(0, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1)
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.7)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.7)

    setTimeout(() => {
      if (!this.audioContext || !this.masterGain) return
      const osc2 = this.audioContext.createOscillator()
      const gain2 = this.audioContext.createGain()
      osc2.type = 'sawtooth'
      osc2.frequency.setValueAtTime(200, this.audioContext.currentTime)
      osc2.frequency.linearRampToValueAtTime(350, this.audioContext.currentTime + 0.25)
      gain2.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain2.gain.linearRampToValueAtTime(0.12, this.audioContext.currentTime + 0.05)
      gain2.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4)
      osc2.connect(gain2)
      gain2.connect(this.masterGain)
      osc2.start()
      osc2.stop(this.audioContext.currentTime + 0.4)
    }, 350)
  }

  playLightningStrike(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const bufferSize = this.audioContext.sampleRate * 1.5
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5)
    }
    const noise = this.audioContext.createBufferSource()
    noise.buffer = buffer

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, this.audioContext.currentTime)
    filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 1)

    const gain = this.audioContext.createGain()
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start()

    const osc = this.audioContext.createOscillator()
    const oscGain = this.audioContext.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.5)
    oscGain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6)
    osc.connect(oscGain)
    oscGain.connect(this.masterGain)
    osc.start()
    osc.stop(this.audioContext.currentTime + 0.6)
  }

  playStormRollback(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const freqs = [440, 550, 660, 880]
    freqs.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * 0.08)
      const startTime = this.audioContext!.currentTime + i * 0.08
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)
      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  }

  playStormEnd(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      const startTime = this.audioContext!.currentTime + i * 0.15
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5)
      osc.connect(gain)
      gain.connect(this.masterGain!)
      osc.start(startTime)
      osc.stop(startTime + 0.5)
    })
  }

  setGearMaterial(material: GearMaterialConfig): void {
    this.currentMaterial = material
  }

  setEnhancedFeedback(enabled: boolean): void {
    this.enhancedFeedback = enabled
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
      this.stopWind()
    } else {
      this.playRain()
      this.playWind()
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

    const { rotateFreq, waveform } = this.currentMaterial.audio
    const duration = 0.15
    const baseVolume = 0.15

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = waveform
    osc.frequency.setValueAtTime(rotateFreq, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(rotateFreq * 0.5, this.audioContext.currentTime + duration)

    gain.gain.setValueAtTime(baseVolume, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + duration)

    if (this.enhancedFeedback) {
      const harmonic = this.audioContext.createOscillator()
      const hGain = this.audioContext.createGain()
      harmonic.type = 'sine'
      harmonic.frequency.setValueAtTime(rotateFreq * 2, this.audioContext.currentTime)
      harmonic.frequency.exponentialRampToValueAtTime(rotateFreq, this.audioContext.currentTime + duration * 0.8)
      hGain.gain.setValueAtTime(0.06, this.audioContext.currentTime)
      hGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration * 0.8)
      harmonic.connect(hGain)
      hGain.connect(this.masterGain)
      harmonic.start()
      harmonic.stop(this.audioContext.currentTime + duration * 0.8)
    }
  }

  playGearSnap(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const { snapFreq, waveform } = this.currentMaterial.audio
    const duration = 0.1

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = waveform
    osc.frequency.setValueAtTime(snapFreq, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(snapFreq * 2, this.audioContext.currentTime + duration * 0.8)

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + duration)

    if (this.enhancedFeedback) {
      const chime = this.audioContext.createOscillator()
      const cGain = this.audioContext.createGain()
      chime.type = 'triangle'
      chime.frequency.setValueAtTime(snapFreq * 1.5, this.audioContext.currentTime + 0.02)
      cGain.gain.setValueAtTime(0.08, this.audioContext.currentTime + 0.02)
      cGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15)
      chime.connect(cGain)
      cGain.connect(this.masterGain)
      chime.start(this.audioContext.currentTime + 0.02)
      chime.stop(this.audioContext.currentTime + 0.15)
    }
  }

  playGearFault(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.2)

    gain.gain.setValueAtTime(0.12, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start()
    osc.stop(this.audioContext.currentTime + 0.2)
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

  playRain(intensity: WeatherIntensity = 'light'): void {
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
    this.rainGain.gain.value = RAIN_INTENSITY_GAIN[intensity]

    this.rainSource.connect(filter)
    filter.connect(this.rainGain)
    this.rainGain.connect(this.masterGain)

    this.rainSource.start()
  }

  setRainIntensity(intensity: WeatherIntensity): void {
    if (!this.rainGain || !this.audioContext) return
    const targetGain = RAIN_INTENSITY_GAIN[intensity]
    this.rainGain.gain.cancelScheduledValues(this.audioContext.currentTime)
    this.rainGain.gain.linearRampToValueAtTime(targetGain, this.audioContext.currentTime + 1.0)
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

  playWind(intensity: WeatherIntensity = 'moderate'): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return
    if (this.windSource) return

    const bufferSize = 4 * this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }

    this.windSource = this.audioContext.createBufferSource()
    this.windSource.buffer = buffer
    this.windSource.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300

    this.windGain = this.audioContext.createGain()
    this.windGain.gain.value = WIND_INTENSITY_GAIN[intensity]

    this.windSource.connect(filter)
    filter.connect(this.windGain)
    this.windGain.connect(this.masterGain)

    this.windSource.start()
  }

  setWindIntensity(intensity: WeatherIntensity): void {
    if (!this.windGain || !this.audioContext) return
    const targetGain = WIND_INTENSITY_GAIN[intensity]
    this.windGain.gain.cancelScheduledValues(this.audioContext.currentTime)
    this.windGain.gain.linearRampToValueAtTime(targetGain, this.audioContext.currentTime + 1.0)
  }

  stopWind(): void {
    if (this.windSource) {
      this.windSource.stop()
      this.windSource.disconnect()
      this.windSource = null
    }
    if (this.windGain) {
      this.windGain.disconnect()
      this.windGain = null
    }
  }

  setWeatherAudio(rain: WeatherIntensity, wind: WeatherIntensity): void {
    if (!this.enabled) return

    if (RAIN_INTENSITY_GAIN[rain] > 0 && !this.rainSource) {
      this.playRain(rain)
    } else if (this.rainSource) {
      this.setRainIntensity(rain)
    }

    if (WIND_INTENSITY_GAIN[wind] > 0 && !this.windSource) {
      this.playWind(wind)
    } else if (this.windSource) {
      this.setWindIntensity(wind)
    }

    if (RAIN_INTENSITY_GAIN[rain] === 0) {
      this.stopRain()
    }
    if (WIND_INTENSITY_GAIN[wind] === 0) {
      this.stopWind()
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

  playPeriodTransition(): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const notes = [392, 523.25, 659.25]
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()

      osc.type = 'triangle'
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

  playBellNote(
    frequency: number,
    duration: number,
    volume: number,
    options: { attack?: number; release?: number; detune?: number; waveform?: OscillatorType } = {},
  ): void {
    if (!this.ensureContext() || !this.audioContext || !this.masterGain) return

    const { attack = 0.02, release = 1.5, detune = 0, waveform = 'sine' } = options
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc.type = waveform
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    osc.detune.setValueAtTime(detune, this.audioContext.currentTime)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime)
    filter.Q.setValueAtTime(1, this.audioContext.currentTime)

    const peakVolume = Math.max(0.001, volume * 0.35)
    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(peakVolume, now + attack)
    gain.gain.exponentialRampToValueAtTime(peakVolume * 0.6, now + attack + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, now + attack + 0.08 + duration + release)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    const totalDuration = attack + 0.08 + duration + release + 0.1
    osc.start(now)
    osc.stop(now + totalDuration)

    if (peakVolume > 0.05) {
      const harmonicOsc = this.audioContext.createOscillator()
      const harmonicGain = this.audioContext.createGain()
      harmonicOsc.type = 'triangle'
      harmonicOsc.frequency.setValueAtTime(frequency * 2, now)
      harmonicOsc.detune.setValueAtTime(detune * 0.5, now)
      harmonicGain.gain.setValueAtTime(0, now)
      harmonicGain.gain.linearRampToValueAtTime(peakVolume * 0.15, now + attack * 1.2)
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + attack + duration + release * 0.7)
      harmonicOsc.connect(harmonicGain)
      harmonicGain.connect(this.masterGain)
      harmonicOsc.start(now)
      harmonicOsc.stop(now + attack + duration + release)
    }
  }

  playBellChimeNotes(
    notes: BellNote[],
    layers: HarmonyLayerConfig[],
    options: BellChimePlaybackOptions = {},
  ): { stop: () => void } {
    if (!this.ensureContext() || !this.audioContext) {
      return { stop: () => {} }
    }

    const scheduledOscs: OscillatorNode[] = []
    const scheduledTimeouts: number[] = []
    const ctxNow = this.audioContext.currentTime

    notes.forEach((note) => {
      const freq = BELL_NOTE_FREQUENCIES[note.pitch]
      if (!freq) return

      const layer = layers[note.layer]
      const attack = layer?.attack ?? 0.02
      const release = layer?.release ?? 1.5
      const detune = layer?.detune ?? 0

      const startTime = ctxNow + note.startTime
      const osc = this.audioContext!.createOscillator()
      const gain = this.audioContext!.createGain()
      const filter = this.audioContext!.createBiquadFilter()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      osc.detune.setValueAtTime(detune, startTime)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(freq * 2.5, startTime)
      filter.Q.setValueAtTime(0.8, startTime)

      const peakVolume = Math.max(0.001, note.velocity * 0.4)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(peakVolume, startTime + attack)
      gain.gain.exponentialRampToValueAtTime(peakVolume * 0.5, startTime + attack + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + attack + 0.1 + note.duration + release)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain!)

      const totalDur = attack + 0.1 + note.duration + release + 0.1
      osc.start(startTime)
      osc.stop(startTime + totalDur)
      scheduledOscs.push(osc)

      if (peakVolume > 0.04 && note.layer === 0) {
        const harmOsc = this.audioContext!.createOscillator()
        const harmGain = this.audioContext!.createGain()
        harmOsc.type = 'triangle'
        harmOsc.frequency.setValueAtTime(freq * 2.01, startTime)
        harmGain.gain.setValueAtTime(0, startTime)
        harmGain.gain.linearRampToValueAtTime(peakVolume * 0.12, startTime + attack * 1.3)
        harmGain.gain.exponentialRampToValueAtTime(0.001, startTime + attack + note.duration + release * 0.6)
        harmOsc.connect(harmGain)
        harmGain.connect(this.masterGain!)
        harmOsc.start(startTime)
        harmOsc.stop(startTime + attack + note.duration + release)
        scheduledOscs.push(harmOsc)
      }

      if (options.onNoteStart) {
        const t = window.setTimeout(() => options.onNoteStart?.(note), note.startTime * 1000)
        scheduledTimeouts.push(t)
      }
    })

    if (options.onComplete) {
      const maxEnd = notes.length > 0 ? Math.max(...notes.map((n) => n.startTime + n.duration)) : 0
      const t = window.setTimeout(() => options.onComplete?.(), (maxEnd + 1) * 1000)
      scheduledTimeouts.push(t)
    }

    let stopped = false
    return {
      stop: () => {
        if (stopped) return
        stopped = true
        scheduledOscs.forEach((o) => {
          try {
            o.stop()
            o.disconnect()
          } catch {}
        })
        scheduledTimeouts.forEach((t) => window.clearTimeout(t))
      },
    }
  }

  previewBellPreset(
    preset: BellChimePreset,
    options: BellChimePlaybackOptions = {},
  ): { stop: () => void } {
    const notes = bellChimeSystem.generateNotes(preset, options)
    const layers = bellChimeSystem.getHarmonyLayers(preset.harmonyLayerIds)
    return this.playBellChimeNotes(notes, layers, options)
  }

  triggerBellChime(triggerType: SoundEvent): { stop: () => void } | null {
    const triggerMap: Record<string, string> = {
      time_aligned: 'time_aligned',
      level_success: 'level_success',
      level_fail: 'level_fail',
      period_transition: 'period_transition',
      tower_align: 'tower_align',
      fault_clear: 'gear_snap',
      storm_end: 'storm_end',
    }

    const bellType = triggerMap[triggerType]
    if (!bellType) return null

    const trigger = bellChimeSystem.shouldTrigger(bellType as any)
    if (!trigger) return null

    bellChimeSystem.markTriggered(trigger.id)
    const preset = bellChimeSystem.getCurrentPreset()
    if (!preset) return null

    let playOptions: BellChimePlaybackOptions = {}
    if (triggerType === 'level_fail') {
      playOptions = { volumeMultiplier: 0.6, playbackRate: 0.8 }
    } else if (triggerType === 'level_success') {
      playOptions = { volumeMultiplier: 1.1, playbackRate: 1.0 }
    } else if (triggerType === 'storm_end') {
      playOptions = { volumeMultiplier: 0.9, playbackRate: 0.9 }
    }

    return this.previewBellPreset(preset, playOptions)
  }

  playSingleBellPitch(pitch: string, duration: number = 1.0, volume: number = 0.6): void {
    const freq = (BELL_NOTE_FREQUENCIES as any)[pitch]
    if (!freq) return
    this.playBellNote(freq, duration, volume)
  }

  destroy(): void {
    this.stopRain()
    this.stopWind()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const soundManager = new SoundManager()
