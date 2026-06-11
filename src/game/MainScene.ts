import Phaser from 'phaser'
import type { GearConfig } from './GearSystem'
import type { ClockTime, WeatherState, WeatherIntensity, GearFaultType, NightPeriod, GearMaterialConfig, WorkshopEffects } from '../types'
import { workshopSystem, GEAR_MATERIALS } from './WorkshopSystem'

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
  private gearGraphicsMap: Map<number, Phaser.GameObjects.Graphics> = new Map()
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
  private gearMaterial: GearMaterialConfig = GEAR_MATERIALS[0]
  private workshopEffects: WorkshopEffects = {
    efficiencyMultiplier: 1.0,
    toleranceMinutes: 0,
    faultResistanceChance: 0,
    showTargetHint: false,
    enhancedFeedback: false,
  }
  private toleranceArc!: Phaser.GameObjects.Graphics
  private targetHintGlow!: Phaser.GameObjects.Graphics

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

  setGearMaterial(material: GearMaterialConfig): void {
    this.gearMaterial = material
    this.refreshAllGearVisuals()
  }

  setWorkshopEffects(effects: WorkshopEffects): void {
    this.workshopEffects = { ...effects }
    this.updateToleranceIndicator()
    this.refreshAllGearVisuals()
  }

  private refreshAllGearVisuals(): void {
    this.gearGraphicsMap.forEach((graphics, id) => {
      const container = this.gearSprites.get(id)
      if (!container) return
      const gearConfig = GEAR_CONFIGS.find((g) => g.id === id)
      if (!gearConfig) return
      const radius = this.gearRadii.get(id) ?? GEAR_SIZES[gearConfig.size] * this.scaleFactor
      const teethCount = gearConfig.size === 'large' ? 16 : gearConfig.size === 'medium' ? 12 : 8
      this.drawGear(graphics, radius, teethCount, gearConfig.size)
    })
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

    this.gearMaterial = workshopSystem.getCurrentMaterial()
    this.workshopEffects = workshopSystem.getEffects()

    this.createBackground()
    this.createRain()
    this.createWind()
    this.createLightning()
    this.createClockFace()
    this.createClockHands()
    this.createTargetMarkers()
    this.createToleranceIndicator()
    this.createGears()
    this.createPeriodBanner()
    this.startLightningLoop()
  }

  private createToleranceIndicator(): void {
    this.toleranceArc = this.add.graphics()
    this.toleranceArc.setDepth(3)
    this.targetHintGlow = this.add.graphics()
    this.targetHintGlow.setDepth(6)
    this.updateToleranceIndicator()
  }

  updateToleranceIndicator(): void {
    if (!this.toleranceArc || !this.targetHintGlow) return
    this.toleranceArc.clear()
    this.targetHintGlow.clear()
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
    this.targetHintGlow?.clear()

    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180

    const showHint = this.workshopEffects.showTargetHint
    const hourMarkerAlpha = showHint ? 0.7 : 0.4
    const minuteMarkerAlpha = showHint ? 0.7 : 0.4
    const glowColor = this.gearMaterial.visual.borderColor

    this.targetHourMarker.lineStyle(showHint ? 8 : 6, glowColor, hourMarkerAlpha)
    this.targetHourMarker.beginPath()
    this.targetHourMarker.moveTo(cx, cy)
    this.targetHourMarker.lineTo(
      cx + Math.cos(hourAngle) * (radius - 80),
      cy + Math.sin(hourAngle) * (radius - 80),
    )
    this.targetHourMarker.strokePath()

    this.targetHourMarker.lineStyle(3, glowColor, showHint ? 1.0 : 0.8)
    this.targetHourMarker.strokeCircle(
      cx + Math.cos(hourAngle) * (radius - 80),
      cy + Math.sin(hourAngle) * (radius - 80),
      showHint ? 10 : 6,
    )

    this.targetMinuteMarker.lineStyle(showHint ? 6 : 4, glowColor, minuteMarkerAlpha)
    this.targetMinuteMarker.beginPath()
    this.targetMinuteMarker.moveTo(cx, cy)
    this.targetMinuteMarker.lineTo(
      cx + Math.cos(minuteAngle) * (radius - 40),
      cy + Math.sin(minuteAngle) * (radius - 40),
    )
    this.targetMinuteMarker.strokePath()

    this.targetMinuteMarker.lineStyle(3, glowColor, showHint ? 1.0 : 0.8)
    this.targetMinuteMarker.strokeCircle(
      cx + Math.cos(minuteAngle) * (radius - 40),
      cy + Math.sin(minuteAngle) * (radius - 40),
      showHint ? 8 : 5,
    )

    if (showHint && this.targetHintGlow) {
      this.targetHintGlow.lineStyle(12, glowColor, 0.15)
      this.targetHintGlow.beginPath()
      this.targetHintGlow.moveTo(cx, cy)
      this.targetHintGlow.lineTo(
        cx + Math.cos(minuteAngle) * (radius - 30),
        cy + Math.sin(minuteAngle) * (radius - 30),
      )
      this.targetHintGlow.strokePath()

      this.targetHintGlow.fillStyle(glowColor, 0.1)
      this.targetHintGlow.fillCircle(
        cx + Math.cos(minuteAngle) * (radius - 40),
        cy + Math.sin(minuteAngle) * (radius - 40),
        20,
      )
    }

    const tolerance = this.workshopEffects.toleranceMinutes
    if (tolerance > 0 && this.toleranceArc) {
      this.toleranceArc.clear()
      this.toleranceArc.lineStyle(2, glowColor, 0.3)
      const minuteSpanAngle = tolerance * 6 * Math.PI / 180
      this.toleranceArc.beginPath()
      this.toleranceArc.arc(cx, cy, radius - 25, minuteAngle - minuteSpanAngle, minuteAngle + minuteSpanAngle, false)
      this.toleranceArc.strokePath()
    }

    const timeStr = `${time.hours}:${time.minutes.toString().padStart(2, '0')}`
    const toleranceStr = tolerance > 0 ? `（容差±${tolerance}分）` : ''
    this.targetTimeText.setText(`目标时刻：${timeStr}${toleranceStr}`)
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
    this.gearGraphicsMap.set(id, gearGraphic)
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

    const baseColor = this.gearMaterial.visual.baseColor
    const borderColor = this.gearMaterial.visual.borderColor

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

    if (this.gearMaterial.id !== 'brass') {
      graphic.lineStyle(1, borderColor, 0.25)
      graphic.strokeCircle(0, 0, radius - toothDepth)
    }

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
    const glowColor = this.gearMaterial.visual.borderColor

    this.tweens.add({
      targets: container,
      rotation: targetRotation,
      duration: 200,
      ease: Phaser.Math.Easing.Quadratic.Out,
    })

    if (this.workshopEffects.enhancedFeedback) {
      const x = container.x
      const y = container.y
      const radius = this.gearRadii.get(gearId) ?? 50

      for (let i = 0; i < 6; i++) {
        const particleAngle = (i / 6) * Math.PI * 2 + Math.random() * 0.5
        const dist = radius * (0.6 + Math.random() * 0.4)
        const px = x + Math.cos(particleAngle) * dist
        const py = y + Math.sin(particleAngle) * dist

        const spark = this.add.circle(px, py, 2 + Math.random() * 2, glowColor, 0.8)
        spark.setDepth(30)

        this.tweens.add({
          targets: spark,
          x: x + Math.cos(particleAngle) * dist * 1.5,
          y: y + Math.sin(particleAngle) * dist * 1.5,
          alpha: { from: 0.8, to: 0 },
          scale: { from: 1, to: 0.3 },
          duration: 350 + Math.random() * 150,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onComplete: () => spark.destroy(),
        })
      }

      const pulse = this.add.circle(x, y, radius * 0.8, glowColor, 0)
      pulse.setDepth(15)
      pulse.setStrokeStyle(2, glowColor, 0.4)
      this.tweens.add({
        targets: pulse,
        scale: { from: 0.9, to: 1.2 },
        alpha: { from: 0.4, to: 0 },
        duration: 300,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: () => pulse.destroy(),
      })
    }
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

  private _tourMode: boolean = false
  private tourHotspotContainers: Map<string, Phaser.GameObjects.Container> = new Map()
  private tourPathGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map()
  private tourPathFlowGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map()
  private tourFlowAnimationTimer: Phaser.Time.TimerEvent | null = null
  private tourHistoricalLabels: Phaser.GameObjects.Container | null = null
  private _tourCameraZoom: number = 1
  private _tourCameraOffset: { x: number; y: number } = { x: 0, y: 0 }
  private onTourHotspotClick?: (hotspotId: string) => void
  private tourAmbientOverlay: Phaser.GameObjects.Graphics | null = null
  private _tourHighlightedHotspotId: string | null = null
  private _tourHighlightedPathId: string | null = null

  setTourCallbacks(onTourHotspotClick: (hotspotId: string) => void) {
    this.onTourHotspotClick = onTourHotspotClick
  }

  enableTourMode(
    hotspots: Array<{
      id: string
      x: number
      y: number
      radius?: number
      icon: string
      name: string
      isVisited: boolean
      isSecret: boolean
      category: string
      order: number
    }>,
    paths: Array<{
      id: string
      points: Array<{ x: number; y: number }>
      color: string
      glowColor: string
    }>,
  ) {
    this._tourMode = true
    this.createTourAmbientOverlay()
    this.dimOriginalGameElements()
    this.createTourPaths(paths)
    this.createTourHotspots(hotspots)
    this.createTourHistoricalLabels()
    this.startTourFlowAnimation()
    this.cameras.main.flash(800, 255, 248, 220)
  }

  disableTourMode() {
    void this._tourMode
    void this._tourCameraZoom
    void this._tourCameraOffset
    void this._tourHighlightedHotspotId
    void this._tourHighlightedPathId
    this._tourMode = false
    this.tourHotspotContainers.forEach((c) => c.destroy())
    this.tourHotspotContainers.clear()
    this.tourPathGraphics.forEach((g) => g.destroy())
    this.tourPathGraphics.clear()
    this.tourPathFlowGraphics.forEach((g) => g.destroy())
    this.tourPathFlowGraphics.clear()
    if (this.tourFlowAnimationTimer) {
      this.tourFlowAnimationTimer.remove()
      this.tourFlowAnimationTimer = null
    }
    if (this.tourHistoricalLabels) {
      this.tourHistoricalLabels.destroy()
      this.tourHistoricalLabels = null
    }
    if (this.tourAmbientOverlay) {
      this.tourAmbientOverlay.destroy()
      this.tourAmbientOverlay = null
    }
    this._tourCameraZoom = 1
    this._tourCameraOffset = { x: 0, y: 0 }
    this._tourHighlightedHotspotId = null
    this._tourHighlightedPathId = null
    this.restoreOriginalGameElements()
  }

  private dimOriginalGameElements() {
    this.gearSprites.forEach((container) => {
      container.iterate((child: unknown) => {
        const c = child as unknown as { setAlpha?: (a: number) => void; alpha?: number }
        if (typeof c.setAlpha === 'function' && c.alpha !== undefined) {
          c.setAlpha(c.alpha * 0.4)
        }
      })
    })
    ;[this.hourHand, this.minuteHand].forEach((h) => {
      if (h) h.setAlpha(0.4)
    })
  }

  private restoreOriginalGameElements() {
    this.gearSprites.forEach((container) => {
      container.iterate((child: unknown) => {
        const c = child as unknown as { setAlpha?: (a: number) => void; alpha?: number }
        if (typeof c.setAlpha === 'function' && c.alpha !== undefined) {
          c.setAlpha(c.alpha / 0.4)
        }
      })
    })
    ;[this.hourHand, this.minuteHand].forEach((h) => {
      if (h) h.setAlpha(1)
    })
  }

  private createTourAmbientOverlay() {
    const { width, height } = this.scale
    this.tourAmbientOverlay = this.add.graphics()
    this.tourAmbientOverlay.setDepth(18)
    this.tourAmbientOverlay.fillGradientStyle(
      0x0a0a28,
      0x0a0a28,
      0x1a1a4e,
      0x1a1a4e,
      0.55,
    )
    this.tourAmbientOverlay.fillRect(0, 0, width, height)

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const particle = this.add.circle(x, y, 2 + Math.random() * 3, 0xfff4cc, 0.6)
      particle.setDepth(19)
      this.tweens.add({
        targets: particle,
        y: y - 50 - Math.random() * 80,
        x: x + (Math.random() - 0.5) * 40,
        alpha: { from: 0.6, to: 0 },
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        ease: Phaser.Math.Easing.Sine.InOut,
      })
    }
  }

  private createTourPaths(
    paths: Array<{
      id: string
      points: Array<{ x: number; y: number }>
      color: string
      glowColor: string
    }>,
  ) {
    const { width, height } = this.scale

    paths.forEach((path) => {
      const pathGraphic = this.add.graphics()
      pathGraphic.setDepth(22)
      this.tourPathGraphics.set(path.id, pathGraphic)

      const flowGraphic = this.add.graphics()
      flowGraphic.setDepth(23)
      this.tourPathFlowGraphics.set(path.id, flowGraphic)

      const colorNum = Phaser.Display.Color.HexStringToColor(path.color).color
      const glowColorNum = Phaser.Display.Color.HexStringToColor(path.glowColor).color

      pathGraphic.lineStyle(4, colorNum, 0.7)
      pathGraphic.beginPath()

      path.points.forEach((point, i) => {
        const px = point.x * width
        const py = point.y * height
        if (i === 0) {
          pathGraphic.moveTo(px, py)
        } else {
          pathGraphic.lineTo(px, py)
        }
      })
      pathGraphic.strokePath()

      pathGraphic.lineStyle(2, glowColorNum, 0.9)
      pathGraphic.lineStyle(2, glowColorNum, 0.9)
      pathGraphic.strokePath()

      const glow = this.add.graphics()
      glow.setDepth(21)
      glow.lineStyle(12, glowColorNum, 0.15)
      glow.beginPath()
      path.points.forEach((point, i) => {
        const px = point.x * width
        const py = point.y * height
        if (i === 0) {
          glow.moveTo(px, py)
        } else {
          glow.lineTo(px, py)
        }
      })
      glow.strokePath()
    })
  }

  private startTourFlowAnimation() {
    let t = 0
    this.tourFlowAnimationTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        t += 0.015
        const { width, height } = this.scale

        this.tourPathGraphics.forEach((_pathGraphic, pathId) => {
          const flow = this.tourPathFlowGraphics.get(pathId)
          const path = Array.from(this.tourPathGraphics.keys()).findIndex((k) => k === pathId)
          if (!flow || path < 0) return

          const pathsData = (this.constructor as any)._tourPathsCache
          if (!pathsData || !pathsData[pathId]) return

          flow.clear()
          const points = pathsData[pathId]
          const totalLen = points.length - 1
          const flowPos = (t * 0.5) % 1

          for (let i = 0; i < totalLen; i++) {
            const segmentStart = i / totalLen
            const segmentEnd = (i + 1) / totalLen
            if (flowPos >= segmentStart && flowPos <= segmentEnd) {
              const segT = (flowPos - segmentStart) / (segmentEnd - segmentStart)
              const px =
                points[i].x * width + (points[i + 1].x - points[i].x) * segT * width
              const py =
                points[i].y * height + (points[i + 1].y - points[i].y) * segT * height

              flow.fillStyle(
                Phaser.Display.Color.HexStringToColor('#ffd700').color,
                0.8,
              )
              flow.fillCircle(px, py, 5)
              flow.fillStyle(
                Phaser.Display.Color.HexStringToColor('#fffaeb').color,
                0.9,
              )
              flow.fillCircle(px, py, 2.5)
              break
            }
          }
        })
      },
    })
  }

  setTourPathsCache(
    cache: Record<string, Array<{ x: number; y: number }>>,
  ) {
    ;(this.constructor as any)._tourPathsCache = cache
  }

  highlightTourPath(pathId: string | null) {
    this._tourHighlightedPathId = pathId

    this.tourPathGraphics.forEach((g, id) => {
      if (id === pathId) {
        g.setAlpha(1)
        g.lineStyle(8, 0xffd700, 0.9)
      } else if (pathId !== null) {
        g.setAlpha(0.3)
      } else {
        g.setAlpha(1)
      }
    })
  }

  private createTourHotspots(
    hotspots: Array<{
      id: string
      x: number
      y: number
      radius?: number
      icon: string
      name: string
      isVisited: boolean
      isSecret: boolean
      category: string
      order: number
    }>,
  ) {
    const { width, height } = this.scale

    hotspots.forEach((hs) => {
      const px = hs.x * width
      const py = hs.y * height
      const r = (hs.radius ?? 0.06) * Math.min(width, height)

      const container = this.add.container(px, py)
      container.setDepth(25)
      container.setData('hotspotId', hs.id)
      this.tourHotspotContainers.set(hs.id, container)

      const pulseBase = this.add.circle(0, 0, r * 0.9, 0x000000, 0.01)
      container.add(pulseBase)

      const bgCircle = this.add.circle(0, 0, r, 0x1a1a3a, 0.85)
      bgCircle.setStrokeStyle(3, hs.isSecret ? 0xa569bd : hs.isVisited ? 0x7ec97e : 0xc9a96a, 0.95)
      container.add(bgCircle)

      const iconText = this.add.text(0, 0, hs.icon, {
        fontSize: `${r * 0.9}px`,
        align: 'center',
      }).setOrigin(0.5)
      container.add(iconText)

      if (!hs.isVisited && !hs.isSecret) {
        this.tweens.add({
          targets: bgCircle,
          scale: { from: 1, to: 1.12 },
          alpha: { from: 0.85, to: 0.6 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: Phaser.Math.Easing.Sine.InOut,
        })
      }

      if (hs.isSecret) {
        const sparkle = this.add.circle(r * 0.6, -r * 0.6, 4, 0xdda0dd, 0.9)
        container.add(sparkle)
        this.tweens.add({
          targets: sparkle,
          scale: { from: 0.5, to: 1.5 },
          alpha: { from: 0.9, to: 0 },
          duration: 1800,
          repeat: -1,
          ease: Phaser.Math.Easing.Quadratic.Out,
        })
      }

      if (hs.isVisited && !hs.isSecret) {
        const check = this.add.text(r * 0.65, -r * 0.65, '✓', {
          fontSize: `${r * 0.5}px`,
          color: '#7ec97e',
          fontStyle: 'bold',
        }).setOrigin(0.5)
        container.add(check)
      }

      const nameBg = this.add.graphics()
      nameBg.fillStyle(0x0a0a20, 0.85)
      const nameText = this.add.text(0, r + 14, hs.name, {
        fontFamily: 'Georgia, serif',
        fontSize: `${12 * this.scaleFactor}px`,
        color: hs.isSecret ? '#dda0dd' : '#e8d5a3',
        align: 'center',
      }).setOrigin(0.5)
      const w = nameText.width + 20
      nameBg.fillRoundedRect(-w / 2, r + 4, w, 24, 6)
      nameBg.lineStyle(1, hs.isSecret ? 0xa569bd : 0x5a4a32, 0.8)
      nameBg.strokeRoundedRect(-w / 2, r + 4, w, 24, 6)
      container.add(nameBg)
      container.add(nameText)

      const orderBadge = this.add.circle(-r * 0.7, -r * 0.7, 10, 0xc9a96a, 0.95)
      const orderText = this.add.text(-r * 0.7, -r * 0.7, hs.order.toString(), {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#1a1a2e',
        fontStyle: 'bold',
      }).setOrigin(0.5)
      container.add(orderBadge)
      container.add(orderText)

      const hitArea = this.add.zone(0, 0, r * 2.5, r * 2.5 + 30)
      hitArea.setInteractive({ useHandCursor: true })
      container.add(hitArea)

      container.setSize(r * 2.5, r * 2.5 + 30)

      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.15,
          duration: 200,
          ease: Phaser.Math.Easing.Back.Out,
        })
      })

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 200,
          ease: Phaser.Math.Easing.Quadratic.Out,
        })
      })

      hitArea.on('pointerdown', () => {
        this.onTourHotspotClick?.(hs.id)
        this.playTourHotspotClick(container, hs.isSecret ? 0xa569bd : 0xc9a96a)
      })
    })
  }

  private playTourHotspotClick(
    container: Phaser.GameObjects.Container,
    color: number,
  ) {
    const cx = container.x
    const cy = container.y

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const dist = 30
      const spark = this.add.circle(
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        3,
        color,
        1,
      )
      spark.setDepth(60)
      this.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * dist * 2.5,
        y: cy + Math.sin(angle) * dist * 2.5,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.2 },
        duration: 400,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: () => spark.destroy(),
      })
    }
  }

  highlightTourHotspot(hotspotId: string | null) {
    this._tourHighlightedHotspotId = hotspotId

    this.tourHotspotContainers.forEach((container, id) => {
      if (id === hotspotId) {
        this.tweens.add({
          targets: container,
          scale: 1.25,
          duration: 300,
          ease: Phaser.Math.Easing.Back.Out,
        })
        container.setDepth(35)
      } else {
        this.tweens.add({
          targets: container,
          scale: hotspotId !== null ? 0.85 : 1,
          alpha: hotspotId !== null ? 0.5 : 1,
          duration: 250,
          ease: Phaser.Math.Easing.Quadratic.Out,
        })
        container.setDepth(25)
      }
    })
  }

  private createTourHistoricalLabels() {
    this.tourHistoricalLabels = this.add.container(0, 0)
    this.tourHistoricalLabels.setDepth(20)

    const labels = [
      { x: 0.5, y: 0.08, text: '1887 · 维多利亚时代建造', color: '#c9a96a' },
      { x: 0.5, y: 0.92, text: '时间博物馆 · 对公众开放参观', color: '#c9a96a' },
    ]

    const { width, height } = this.scale
    labels.forEach((l) => {
      const bg = this.add.graphics()
      const t = this.add.text(l.x * width, l.y * height, l.text, {
        fontFamily: 'Georgia, serif',
        fontSize: `${13 * this.scaleFactor}px`,
        color: l.color,
        fontStyle: 'italic',
        align: 'center',
      }).setOrigin(0.5)
      const w = t.width + 24
      const h = 28
      bg.fillStyle(0x0a0a1a, 0.75)
      bg.fillRoundedRect(l.x * width - w / 2, l.y * height - h / 2, w, h, 14)
      bg.lineStyle(1, 0x5a4a32, 0.7)
      bg.strokeRoundedRect(l.x * width - w / 2, l.y * height - h / 2, w, h, 14)
      this.tourHistoricalLabels?.add(bg)
      this.tourHistoricalLabels?.add(t)
    })
  }

  setTourCamera(zoom: number, offset: { x: number; y: number }) {
    this._tourCameraZoom = zoom
    this._tourCameraOffset = offset

    const { width, height } = this.scale
    this.cameras.main.setZoom(zoom)
    this.cameras.main.centerOn(
      width / 2 + offset.x * width,
      height / 2 + offset.y * height,
    )
  }

  playTourDiscoveryAnimation(position?: { x: number; y: number }) {
    const { width, height } = this.scale
    const cx = position ? position.x * width : width / 2
    const cy = position ? position.y * height : height / 2

    for (let ring = 0; ring < 3; ring++) {
      this.time.delayedCall(ring * 150, () => {
        const ringGraphic = this.add.circle(cx, cy, 30, 0xffd700, 0)
        ringGraphic.setDepth(45)
        ringGraphic.setStrokeStyle(3, 0xffd700, 0.8)
        this.tweens.add({
          targets: ringGraphic,
          scale: { from: 0.3, to: 3 },
          strokeAlpha: { from: 0.8, to: 0 },
          duration: 900,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onComplete: () => ringGraphic.destroy(),
        })
      })
    }

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3
      const startDist = 20 + Math.random() * 30
      const endDist = 120 + Math.random() * 80
      const spark = this.add.circle(
        cx + Math.cos(angle) * startDist,
        cy + Math.sin(angle) * startDist,
        3 + Math.random() * 3,
        Math.random() > 0.5 ? 0xffd700 : 0xffa500,
        1,
      )
      spark.setDepth(46)
      this.tweens.add({
        targets: spark,
        x: cx + Math.cos(angle) * endDist,
        y: cy + Math.sin(angle) * endDist,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.3 },
        duration: 700 + Math.random() * 400,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: () => spark.destroy(),
      })
    }
  }

  resetTourCamera() {
    this._tourCameraZoom = 1
    this._tourCameraOffset = { x: 0, y: 0 }
    this.cameras.main.setZoom(1)
    const { width, height } = this.scale
    this.cameras.main.centerOn(width / 2, height / 2)
  }
}
