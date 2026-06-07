import Phaser from 'phaser'
import type { GearConfig } from './GearSystem'
import type { ClockTime, WeatherState, WeatherIntensity, GearFaultType, NightPeriod } from '../types'

export const GEAR_CONFIGS: GearConfig[] = [
  { id: 0, x: 0.5, y: 0.5, size: 'large', connectedTo: [1, 2] },
  { id: 1, x: 0.25, y: 0.35, size: 'medium', connectedTo: [0, 3] },
  { id: 2, x: 0.75, y: 0.35, size: 'medium', connectedTo: [0, 4] },
  { id: 3, x: 0.2, y: 0.7, size: 'small', connectedTo: [1] },
  { id: 4, x: 0.8, y: 0.7, size: 'small', connectedTo: [2] },
]

export const TOTAL_TIME = 120
export const GEAR_SIZES = {
  large: 90,
  medium: 65,
  small: 45,
}

const WEATHER_RAIN_CONFIG: Record<WeatherIntensity, { quantity: number; speedY: [number, number]; speedX: [number, number]; alpha: [number, number] }> = {
  calm: { quantity: 0, speedY: [0, 0], speedX: [0, 0], alpha: [0, 0] },
  light: { quantity: 6, speedY: [300, 500], speedX: [-80, -30], alpha: [0.2, 0.5] },
  moderate: { quantity: 12, speedY: [400, 650], speedX: [-120, -60], alpha: [0.3, 0.6] },
  heavy: { quantity: 20, speedY: [500, 800], speedX: [-180, -100], alpha: [0.4, 0.8] },
  storm: { quantity: 35, speedY: [600, 1000], speedX: [-250, -150], alpha: [0.5, 0.9] },
}

const WEATHER_LIGHTNING_CONFIG: Record<WeatherIntensity, { minDelay: number; maxDelay: number; intensity: number }> = {
  calm: { minDelay: 999999, maxDelay: 999999, intensity: 0 },
  light: { minDelay: 15000, maxDelay: 25000, intensity: 0.2 },
  moderate: { minDelay: 8000, maxDelay: 15000, intensity: 0.35 },
  heavy: { minDelay: 5000, maxDelay: 10000, intensity: 0.5 },
  storm: { minDelay: 2500, maxDelay: 6000, intensity: 0.75 },
}

const PERIOD_BG_COLORS: Record<NightPeriod, { top: number; bottom: number }> = {
  dusk: { top: 0x1a1520, bottom: 0x2d1f30 },
  earlyNight: { top: 0x0a0a12, bottom: 0x1a1a2e },
  deepNight: { top: 0x050510, bottom: 0x0f0f20 },
  dawn: { top: 0x1a1008, bottom: 0x201510 },
}

export class MainScene extends Phaser.Scene {
  private gearSprites: Map<number, Phaser.GameObjects.Container> = new Map()
  private gearFaultIndicators: Map<number, Phaser.GameObjects.Text> = new Map()
  private gearRadii: Map<number, number> = new Map()
  private lightningFlash: Phaser.GameObjects.Rectangle | null = null
  private onGearClick?: (gearId: number, direction: 1 | -1) => void
  private scaleFactor = 1
  public alignedCache: Map<number, boolean> = new Map()
  private rainParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private windParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private lightningLoopTimer: Phaser.Time.TimerEvent | null = null
  private currentWeather: WeatherState = { rain: 'light', wind: 'light', lightning: 'calm' }
  private bgGradient: Phaser.GameObjects.Graphics | null = null
  private periodBanner: Phaser.GameObjects.Text | null = null

  private clockCenterX = 0
  private clockCenterY = 0
  private clockRadius = 0
  private hourHand!: Phaser.GameObjects.Graphics
  private minuteHand!: Phaser.GameObjects.Graphics
  private targetHourMarker!: Phaser.GameObjects.Graphics
  private targetMinuteMarker!: Phaser.GameObjects.Graphics
  private targetTimeText!: Phaser.GameObjects.Text

  constructor() {
    super('MainScene')
  }

  setCallbacks(
    onGearClick: (gearId: number, direction: 1 | -1) => void,
  ) {
    this.onGearClick = onGearClick
  }

  create() {
    const { width, height } = this.scale
    this.scaleFactor = Math.min(width / 800, height / 600)

    this.clockCenterX = width / 2
    this.clockCenterY = height / 2
    this.clockRadius = Math.min(width, height) * 0.42

    this.createBackground()
    this.createRain()
    this.createWind()
    this.createLightning()
    this.createClockFace()
    this.createClockHands()
    this.createTargetMarkers()
    this.createGears()
    this.createPeriodBanner()
    this.startLightningLoop()
  }

  private createBackground(period: NightPeriod = 'earlyNight') {
    const { width, height } = this.scale

    if (this.bgGradient) {
      this.bgGradient.destroy()
    }

    const colors = PERIOD_BG_COLORS[period]
    this.bgGradient = this.add.graphics()
    this.bgGradient.fillGradientStyle(colors.top, colors.top, colors.bottom, colors.bottom, 1)
    this.bgGradient.fillRect(0, 0, width, height)

    const starCount = period === 'deepNight' ? 40 : period === 'dawn' ? 10 : 25
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const size = Phaser.Math.FloatBetween(0.5, 2)
      const alpha = Phaser.Math.FloatBetween(0.2, 0.6)
      this.add.circle(x, y, size, 0xe8d5a3, alpha)
    }

    const towerFrame = this.add.graphics()
    towerFrame.lineStyle(4, 0x3d3222, 0.6)
    towerFrame.strokeRoundedRect(
      width * 0.05,
      height * 0.05,
      width * 0.9,
      height * 0.9,
      20,
    )

    const innerFrame = this.add.graphics()
    innerFrame.lineStyle(2, 0x5a4a32, 0.4)
    innerFrame.strokeRoundedRect(
      width * 0.08,
      height * 0.08,
      width * 0.84,
      height * 0.84,
      16,
    )
  }

  setPeriodBackground(period: NightPeriod): void {
    this.createBackground(period)
    if (this.bgGradient) {
      this.bgGradient.setDepth(0)
    }
    this.clockCenterX = this.scale.width / 2
    this.clockCenterY = this.scale.height / 2
    this.clockRadius = Math.min(this.scale.width, this.scale.height) * 0.42
  }

  private createPeriodBanner() {
    const { width } = this.scale
    this.periodBanner = this.add.text(width / 2, 50, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${16 * this.scaleFactor}px`,
      color: '#c9a96a',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.periodBanner.setDepth(9)
  }

  showPeriodBanner(text: string): void {
    if (!this.periodBanner) return
    this.periodBanner.setText(text)
    this.periodBanner.setAlpha(0)
    this.tweens.add({
      targets: this.periodBanner,
      alpha: { from: 0, to: 1 },
      duration: 500,
      yoyo: true,
      hold: 1500,
      ease: Phaser.Math.Easing.Quadratic.InOut,
    })
  }

  private createRain() {
    const { width, height } = this.scale

    const rainGraphics = this.add.graphics()
    rainGraphics.lineStyle(1, 0x88aacc, 0.6)
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const length = Phaser.Math.Between(5, 15)
      rainGraphics.lineBetween(x, y, x - 3, y + length)
    }
    rainGraphics.generateTexture('rainTexture', 20, 40)
    rainGraphics.destroy()

    const config = WEATHER_RAIN_CONFIG[this.currentWeather.rain]
    this.rainParticles = this.add.particles(0, -10, 'rainTexture', {
      x: { min: 0, max: width },
      y: -10,
      lifespan: { min: 400, max: 800 },
      speedY: { min: config.speedY[0], max: config.speedY[1] },
      speedX: { min: config.speedX[0], max: config.speedX[1] },
      quantity: config.quantity,
      scale: { min: 0.5, max: 1 },
      alpha: { min: config.alpha[0], max: config.alpha[1] },
      blendMode: Phaser.BlendModes.ADD,
    })
  }

  private createWind() {
    const { height } = this.scale

    const windGraphics = this.add.graphics()
    windGraphics.lineStyle(1, 0xaabbcc, 0.3)
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, 30)
      const y = Phaser.Math.Between(0, 10)
      windGraphics.lineBetween(x, y, x + 30, y)
    }
    windGraphics.generateTexture('windTexture', 40, 15)
    windGraphics.destroy()

    const windIntensity = this.currentWeather.wind === 'calm' || this.currentWeather.wind === 'light' ? 0 : this.currentWeather.wind === 'moderate' ? 3 : this.currentWeather.wind === 'heavy' ? 8 : 15
    this.windParticles = this.add.particles(0, 0, 'windTexture', {
      x: -20,
      y: { min: 0, max: height },
      lifespan: { min: 2000, max: 4000 },
      speedX: { min: 100, max: 300 },
      speedY: { min: -20, max: 20 },
      quantity: windIntensity,
      scale: { min: 0.5, max: 1.5 },
      alpha: { min: 0.1, max: 0.3 },
      blendMode: Phaser.BlendModes.ADD,
    })
  }

  setWeather(weather: WeatherState): void {
    this.currentWeather = { ...weather }

    if (this.rainParticles) {
      this.rainParticles.destroy()
      this.rainParticles = null
    }
    this.createRain()

    const windIntensity = weather.wind === 'calm' || weather.wind === 'light' ? 0 : weather.wind === 'moderate' ? 3 : weather.wind === 'heavy' ? 8 : 15
    if (this.windParticles) {
      this.windParticles.destroy()
      this.windParticles = null
    }
    if (windIntensity > 0) {
      this.createWind()
    }

    if (this.lightningLoopTimer) {
      this.lightningLoopTimer.remove()
    }
    this.startLightningLoop()
  }

  private createLightning() {
    const { width, height } = this.scale
    this.lightningFlash = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0xffffff,
      0,
    )
    this.lightningFlash.setDepth(100)
  }

  private startLightningLoop() {
    const scheduleNextLightning = () => {
      const config = WEATHER_LIGHTNING_CONFIG[this.currentWeather.lightning]
      if (config.minDelay >= 999999) return

      const delay = Phaser.Math.Between(config.minDelay, config.maxDelay)
      this.lightningLoopTimer = this.time.delayedCall(delay, () => {
        this.triggerLightning(config.intensity)
        scheduleNextLightning()
      })
    }
    scheduleNextLightning()
  }

  private triggerLightning(intensity: number) {
    if (!this.lightningFlash) return

    const maxAlpha = 0.2 + intensity * 0.4

    this.tweens.add({
      targets: this.lightningFlash,
      alpha: { from: 0, to: maxAlpha },
      duration: 50,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(100, () => {
          this.tweens.add({
            targets: this.lightningFlash!,
            alpha: { from: 0, to: maxAlpha * 0.6 },
            duration: 40,
            yoyo: true,
            onComplete: () => {
              if (this.lightningFlash) this.lightningFlash.alpha = 0
            },
          })
        })
      },
    })

    this.events.emit('lightning')
  }

  private createClockFace() {
    const cx = this.clockCenterX
    const cy = this.clockCenterY
    const radius = this.clockRadius

    const face = this.add.graphics()
    face.lineStyle(6, 0x5a4a32, 0.7)
    face.strokeCircle(cx, cy, radius)

    face.lineStyle(3, 0x3d3222, 0.5)
    face.strokeCircle(cx, cy, radius - 15)

    const innerBg = this.add.graphics()
    innerBg.fillStyle(0x0f0f18, 0.9)
    innerBg.fillCircle(cx, cy, radius - 20)

    for (let i = 0; i < 12; i++) {
      const angle = (Phaser.Math.DegToRad(i * 30)) - Math.PI / 2
      const isMain = i % 3 === 0
      const innerR = radius - (isMain ? 40 : 30)
      const outerR = radius - 18

      const x1 = cx + Math.cos(angle) * innerR
      const y1 = cy + Math.sin(angle) * innerR
      const x2 = cx + Math.cos(angle) * outerR
      const y2 = cy + Math.sin(angle) * outerR

      const mark = this.add.graphics()
      mark.lineStyle(isMain ? 4 : 2, 0xc9a96a, 0.8)
      mark.beginPath()
      mark.moveTo(x1, y1)
      mark.lineTo(x2, y2)
      mark.strokePath()

      if (isMain) {
        const hourNum = i === 0 ? 12 : i
        const numR = radius - 60
        const nx = cx + Math.cos(angle) * numR
        const ny = cy + Math.sin(angle) * numR
        this.add.text(nx, ny, hourNum.toString(), {
          fontFamily: 'Georgia, serif',
          fontSize: `${20 * this.scaleFactor}px`,
          color: '#c9a96a',
          align: 'center',
        }).setOrigin(0.5)
      }
    }

    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue
      const angle = (Phaser.Math.DegToRad(i * 6)) - Math.PI / 2
      const innerR = radius - 24
      const outerR = radius - 18
      const x1 = cx + Math.cos(angle) * innerR
      const y1 = cy + Math.sin(angle) * innerR
      const x2 = cx + Math.cos(angle) * outerR
      const y2 = cy + Math.sin(angle) * outerR

      const mark = this.add.graphics()
      mark.lineStyle(1, 0x5a4a32, 0.6)
      mark.beginPath()
      mark.moveTo(x1, y1)
      mark.lineTo(x2, y2)
      mark.strokePath()
    }
  }

  private createClockHands() {
    this.hourHand = this.add.graphics()
    this.minuteHand = this.add.graphics()

    const center = this.add.graphics()
    center.fillStyle(0xc9a96a, 1)
    center.fillCircle(this.clockCenterX, this.clockCenterY, 8)
    center.lineStyle(2, 0x8b7355, 1)
    center.strokeCircle(this.clockCenterX, this.clockCenterY, 8)

    this.updateClockHands({ hours: 12, minutes: 0 }, true)
  }

  private createTargetMarkers() {
    this.targetHourMarker = this.add.graphics()
    this.targetMinuteMarker = this.add.graphics()
    this.targetMinuteMarker.setDepth(5)
    this.targetHourMarker.setDepth(4)

    const { width } = this.scale
    this.targetTimeText = this.add.text(width / 2, 80, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${22 * this.scaleFactor}px`,
      color: '#7ec97e',
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.targetTimeText.setDepth(10)
  }

  setTargetTime(time: ClockTime) {
    const cx = this.clockCenterX
    const cy = this.clockCenterY
    const radius = this.clockRadius

    this.targetHourMarker.clear()
    this.targetMinuteMarker.clear()

    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180

    this.targetHourMarker.lineStyle(6, 0x7ec97e, 0.4)
    this.targetHourMarker.beginPath()
    this.targetHourMarker.moveTo(cx, cy)
    this.targetHourMarker.lineTo(
      cx + Math.cos(hourAngle) * (radius - 80),
      cy + Math.sin(hourAngle) * (radius - 80),
    )
    this.targetHourMarker.strokePath()

    this.targetHourMarker.lineStyle(2, 0x7ec97e, 0.8)
    this.targetHourMarker.strokeCircle(
      cx + Math.cos(hourAngle) * (radius - 80),
      cy + Math.sin(hourAngle) * (radius - 80),
      6,
    )

    this.targetMinuteMarker.lineStyle(4, 0x7ec97e, 0.4)
    this.targetMinuteMarker.beginPath()
    this.targetMinuteMarker.moveTo(cx, cy)
    this.targetMinuteMarker.lineTo(
      cx + Math.cos(minuteAngle) * (radius - 40),
      cy + Math.sin(minuteAngle) * (radius - 40),
    )
    this.targetMinuteMarker.strokePath()

    this.targetMinuteMarker.lineStyle(2, 0x7ec97e, 0.8)
    this.targetMinuteMarker.strokeCircle(
      cx + Math.cos(minuteAngle) * (radius - 40),
      cy + Math.sin(minuteAngle) * (radius - 40),
      5,
    )

    const timeStr = `${time.hours}:${time.minutes.toString().padStart(2, '0')}`
    this.targetTimeText.setText(`目标时刻：${timeStr}`)
  }

  updateClockHands(time: ClockTime, immediate = false) {
    const cx = this.clockCenterX
    const cy = this.clockCenterY
    const radius = this.clockRadius

    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180

    const hourEndX = cx + Math.cos(hourAngle) * (radius - 80)
    const hourEndY = cy + Math.sin(hourAngle) * (radius - 80)
    const minuteEndX = cx + Math.cos(minuteAngle) * (radius - 40)
    const minuteEndY = cy + Math.sin(minuteAngle) * (radius - 40)

    const drawHands = () => {
      this.hourHand.clear()
      this.hourHand.lineStyle(10, 0xc9a96a, 1)
      this.hourHand.beginPath()
      this.hourHand.moveTo(cx, cy)
      this.hourHand.lineTo(hourEndX, hourEndY)
      this.hourHand.strokePath()

      this.hourHand.lineStyle(4, 0xe8d5a3, 1)
      this.hourHand.beginPath()
      this.hourHand.moveTo(cx, cy)
      this.hourHand.lineTo(hourEndX, hourEndY)
      this.hourHand.strokePath()

      this.minuteHand.clear()
      this.minuteHand.lineStyle(6, 0xc9a96a, 1)
      this.minuteHand.beginPath()
      this.minuteHand.moveTo(cx, cy)
      this.minuteHand.lineTo(minuteEndX, minuteEndY)
      this.minuteHand.strokePath()

      this.minuteHand.lineStyle(2, 0xe8d5a3, 1)
      this.minuteHand.beginPath()
      this.minuteHand.moveTo(cx, cy)
      this.minuteHand.lineTo(minuteEndX, minuteEndY)
      this.minuteHand.strokePath()
    }

    if (immediate) {
      drawHands()
    } else {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 250,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onUpdate: drawHands,
      })
      drawHands()
    }
  }

  private createGears() {
    GEAR_CONFIGS.forEach((config) => {
      const x = this.scale.width * config.x
      const y = this.scale.height * config.y
      this.createGear(config.id, x, y, config.size)
    })
  }

  private createGear(id: number, x: number, y: number, size: 'large' | 'medium' | 'small') {
    const container = this.add.container(x, y)
    const radius = GEAR_SIZES[size] * this.scaleFactor
    const teethCount = size === 'large' ? 16 : size === 'medium' ? 12 : 8
    this.gearRadii.set(id, radius)
    container.setDepth(20)

    const gearGraphic = this.add.graphics()
    this.drawGear(gearGraphic, radius, teethCount, size)
    container.add(gearGraphic)

    const marker = this.add.graphics()
    marker.fillStyle(size === 'large' ? 0xffa500 : size === 'medium' ? 0x87ceeb : 0x90ee90, 1)
    marker.fillCircle(0, -radius + 12, 6)
    container.add(marker)

    const labelText = size === 'large' ? '时' : size === 'medium' ? '刻' : '分'
    const label = this.add.text(0, 0, labelText, {
      fontFamily: 'Georgia, serif',
      fontSize: size === 'large' ? '20px' : size === 'medium' ? '16px' : '14px',
      color: '#e8d5a3',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(label)

    const hint = this.add.text(0, radius + 20, size === 'large' ? '±60分' : size === 'medium' ? '±15分' : '±5分', {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: '#8b7d5c',
    }).setOrigin(0.5)
    container.add(hint)

    const faultIndicator = this.add.text(0, -radius - 18, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      backgroundColor: 'rgba(20, 0, 0, 0.7)',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5)
    faultIndicator.setVisible(false)
    container.add(faultIndicator)
    this.gearFaultIndicators.set(id, faultIndicator)

    const hitArea = this.add.zone(0, 0, radius * 2.5, radius * 2.5)
    hitArea.setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - x
      const direction: 1 | -1 = localX >= 0 ? 1 : -1
      this.onGearClick?.(id, direction)
    })

    this.gearSprites.set(id, container)
  }

  setGearFault(gearId: number, faultType: GearFaultType): void {
    const indicator = this.gearFaultIndicators.get(gearId)
    const container = this.gearSprites.get(gearId)
    if (!indicator || !container) return

    if (faultType === 'none') {
      indicator.setVisible(false)
      container.iterate((child: unknown) => {
        const c = child as unknown as { clearTint?: () => void }
        if (typeof c.clearTint === 'function') {
          c.clearTint()
        }
      })
    } else {
      const faultLabels: Record<GearFaultType, string> = {
        none: '',
        jam: '⚠ 卡滞',
        slip: '⚠ 打滑',
        reverse: '⚠ 反转',
        freeze: '⚠ 冻结',
      }
      indicator.setText(faultLabels[faultType])
      indicator.setVisible(true)

      const tintColors: Record<GearFaultType, number> = {
        none: 0xffffff,
        jam: 0xff8888,
        slip: 0xffaa44,
        reverse: 0xaa88ff,
        freeze: 0x88ddff,
      }
      const tint = tintColors[faultType]
      container.iterate((child: unknown) => {
        const c = child as unknown as { setTint?: (t: number) => void }
        if (typeof c.setTint === 'function') {
          c.setTint(tint)
        }
      })
    }
  }

  clearAllGearFaults(): void {
    this.gearFaultIndicators.forEach((indicator, gearId) => {
      indicator.setVisible(false)
      const container = this.gearSprites.get(gearId)
      if (container) {
        container.iterate((child: unknown) => {
          const c = child as unknown as { clearTint?: () => void }
          if (typeof c.clearTint === 'function') {
            c.clearTint()
          }
        })
      }
    })
  }

  flashGearFault(gearId: number): void {
    const container = this.gearSprites.get(gearId)
    if (!container) return

    this.tweens.add({
      targets: container,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 100,
      yoyo: true,
      ease: Phaser.Math.Easing.Quadratic.Out,
    })
  }

  private drawGear(
    graphic: Phaser.GameObjects.Graphics,
    radius: number,
    teethCount: number,
    size: 'large' | 'medium' | 'small',
  ) {
    graphic.clear()
    const toothDepth = radius * 0.12
    const toothWidth = (Math.PI * 2) / (teethCount * 2)

    const baseColor = size === 'large' ? 0x5a4020 : size === 'medium' ? 0x3a4055 : 0x3a5540
    const borderColor = size === 'large' ? 0xc9a96a : size === 'medium' ? 0x8aa0cc : 0x8acc9a

    graphic.fillStyle(baseColor, 1)
    graphic.lineStyle(2, borderColor, 1)

    graphic.beginPath()
    for (let i = 0; i < teethCount; i++) {
      const angle1 = (i * Math.PI * 2) / teethCount - toothWidth / 2
      const angle2 = angle1 + toothWidth / 2
      const angle3 = angle2 + toothWidth / 2
      const angle4 = angle3 + toothWidth / 2

      const innerR = radius - toothDepth
      const outerR = radius

      if (i === 0) {
        graphic.moveTo(Math.cos(angle1) * innerR, Math.sin(angle1) * innerR)
      }
      graphic.lineTo(Math.cos(angle2) * outerR, Math.sin(angle2) * outerR)
      graphic.lineTo(Math.cos(angle3) * outerR, Math.sin(angle3) * outerR)
      graphic.lineTo(Math.cos(angle4) * innerR, Math.sin(angle4) * innerR)
    }
    graphic.closePath()
    graphic.fillPath()
    graphic.strokePath()

    graphic.fillStyle(0x1a1a2e, 1)
    graphic.beginPath()
    graphic.arc(0, 0, radius * 0.3, 0, Math.PI * 2)
    graphic.fillPath()

    graphic.lineStyle(3, borderColor, 0.8)
    graphic.strokeCircle(0, 0, radius * 0.3)

    const spokeCount = size === 'large' ? 6 : 4
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI * 2) / spokeCount
      graphic.lineStyle(3, borderColor, 0.5)
      graphic.beginPath()
      graphic.moveTo(
        Math.cos(angle) * radius * 0.3,
        Math.sin(angle) * radius * 0.3,
      )
      graphic.lineTo(
        Math.cos(angle) * (radius - toothDepth - 5),
        Math.sin(angle) * (radius - toothDepth - 5),
      )
      graphic.strokePath()
    }
  }

  updateGearAngle(gearId: number, angle: number) {
    const container = this.gearSprites.get(gearId)
    if (!container) return

    const targetRotation = Phaser.Math.DegToRad(angle)

    this.tweens.add({
      targets: container,
      rotation: targetRotation,
      duration: 200,
      ease: Phaser.Math.Easing.Quadratic.Out,
    })
  }

  playVictoryAnimation() {
    this.cameras.main.flash(500, 200, 180, 100)

    this.gearSprites.forEach((container, id) => {
      this.time.delayedCall(id * 100, () => {
        this.tweens.add({
          targets: container,
          scale: { from: 1, to: 1.15 },
          duration: 300,
          yoyo: true,
          ease: Phaser.Math.Easing.Back.Out,
        })
      })
    })

    const cx = this.clockCenterX
    const cy = this.clockCenterY
    for (let i = 0; i < 36; i++) {
      this.time.delayedCall(i * 30, () => {
        const angle = (i / 36) * Math.PI * 2
        const dist = this.clockRadius * 0.7
        const x = cx + Math.cos(angle) * dist
        const y = cy + Math.sin(angle) * dist
        const spark = this.add.circle(x, y, 5, 0xffd700, 1)
        spark.setDepth(50)
        this.tweens.add({
          targets: spark,
          x: cx,
          y: cy,
          scale: { from: 1, to: 0 },
          alpha: { from: 1, to: 0 },
          duration: 600,
          ease: Phaser.Math.Easing.Quadratic.In,
          onComplete: () => spark.destroy(),
        })
      })
    }
  }

  playFailureAnimation() {
    this.cameras.main.shake(500, 0.01)
    this.gearSprites.forEach((container) => {
      this.tweens.add({
        targets: container,
        angle: { from: container.angle, to: container.angle + 15 },
        duration: 100,
        yoyo: true,
        repeat: 4,
      })
    })
  }

  playPeriodTransitionAnimation() {
    this.cameras.main.fadeOut(800, 10, 5, 20)
    this.time.delayedCall(800, () => {
      this.cameras.main.fadeIn(800, 10, 5, 20)
    })
  }
}
