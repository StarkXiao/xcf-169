import Phaser from 'phaser'
import type { TrainingLesson, TrainingGearConfig, LessonStep, ClockTime } from '../types'
import { GEAR_TIME_DELTAS } from './GearSystem'

const GEAR_SIZES = {
  large: 80,
  medium: 58,
  small: 40,
}

const SNAP_ANGLE = 45

export interface TrainingSceneCallbacks {
  onGearClick: (gearId: number, direction: 1 | -1) => void
  onTimeChange: (time: ClockTime) => void
  onStepAdvance: () => void
  onTargetReached: () => void
  onHintUsed: () => void
}

export class TrainingScene extends Phaser.Scene {
  private gearSprites: Map<number, Phaser.GameObjects.Container> = new Map()
  private gearGraphicsMap: Map<number, Phaser.GameObjects.Graphics> = new Map()
  private gearHighlightGlow: Map<number, Phaser.GameObjects.Graphics> = new Map()
  private gearAngles: Map<number, number> = new Map()
  private currentTime: ClockTime = { hours: 12, minutes: 0 }
  private targetTime: ClockTime = { hours: 12, minutes: 0 }
  private toleranceMinutes = 0
  private callbacks: TrainingSceneCallbacks | null = null
  private scaleFactor = 1
  private currentStep: LessonStep | null = null
  private lesson: TrainingLesson | null = null

  private clockCenterX = 0
  private clockCenterY = 0
  private clockRadius = 0
  private hourHand!: Phaser.GameObjects.Graphics
  private minuteHand!: Phaser.GameObjects.Graphics
  private targetHourMarker!: Phaser.GameObjects.Graphics
  private targetMinuteMarker!: Phaser.GameObjects.Graphics
  private currentTimeText!: Phaser.GameObjects.Text
  private targetTimeText!: Phaser.GameObjects.Text
  private diffText!: Phaser.GameObjects.Text

  constructor() {
    super('TrainingScene')
  }

  setCallbacks(callbacks: TrainingSceneCallbacks): void {
    this.callbacks = callbacks
  }

  setLesson(lesson: TrainingLesson): void {
    this.lesson = lesson
    this.currentTime = { ...lesson.initialClockTime }
    this.targetTime = { ...lesson.targetClockTime }
    this.toleranceMinutes = lesson.toleranceMinutes
  }

  setCurrentStep(step: LessonStep | null): void {
    this.currentStep = step
    this.updateHighlights()
  }

  getCurrentTime(): ClockTime {
    return { ...this.currentTime }
  }

  setInitialTime(time: ClockTime): void {
    this.currentTime = { ...time }
    this.updateClockHands(true)
    this.updateTimeDisplay()
  }

  setTargetTime(time: ClockTime): void {
    this.targetTime = { ...time }
    this.updateTargetMarkers()
    this.updateTimeDisplay()
  }

  create() {
    const { width, height } = this.scale
    this.scaleFactor = Math.min(width / 1000, height / 700)

    this.clockCenterX = width * 0.78
    this.clockCenterY = height * 0.35
    this.clockRadius = Math.min(width * 0.18, height * 0.25)

    this.createBackground()
    this.createClockFace()
    this.createClockHands()
    this.createTargetMarkers()
    this.createTimeDisplay()
  }

  setupLessonGears(): void {
    if (!this.lesson) return

    this.gearSprites.forEach((c) => c.destroy())
    this.gearSprites.clear()
    this.gearGraphicsMap.clear()
    this.gearHighlightGlow.clear()
    this.gearAngles.clear()

    this.lesson.gears.forEach((config) => {
      this.createTrainingGear(config)
      this.gearAngles.set(config.id, config.initialAngle)
    })

    this.updateAllGearAngles(true)
  }

  private createBackground() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0f1020, 0x0f1020, 0x1a1525, 0x1a1525, 1)
    bg.fillRect(0, 0, width, height)

    const gearAreaBg = this.add.graphics()
    gearAreaBg.fillStyle(0x151528, 0.8)
    gearAreaBg.fillRoundedRect(width * 0.02, height * 0.05, width * 0.52, height * 0.9, 16)
    gearAreaBg.lineStyle(2, 0x3d3252, 0.5)
    gearAreaBg.strokeRoundedRect(width * 0.02, height * 0.05, width * 0.52, height * 0.9, 16)

    const clockAreaBg = this.add.graphics()
    clockAreaBg.fillStyle(0x1a1525, 0.8)
    clockAreaBg.fillRoundedRect(width * 0.58, height * 0.05, width * 0.4, height * 0.55, 16)
    clockAreaBg.lineStyle(2, 0x5a4a32, 0.5)
    clockAreaBg.strokeRoundedRect(width * 0.58, height * 0.05, width * 0.4, height * 0.55, 16)

    const areaTitle = this.add.text(width * 0.04, height * 0.08, '⚙️ 齿轮操控区', {
      fontFamily: 'Georgia, serif',
      fontSize: `${16 * this.scaleFactor}px`,
      color: '#c9a96a',
      fontStyle: 'bold',
    })
    areaTitle.setDepth(5)

    const clockTitle = this.add.text(width * 0.6, height * 0.08, '🕰️ 钟楼时钟', {
      fontFamily: 'Georgia, serif',
      fontSize: `${16 * this.scaleFactor}px`,
      color: '#c9a96a',
      fontStyle: 'bold',
    })
    clockTitle.setDepth(5)
  }

  private createClockFace() {
    const cx = this.clockCenterX
    const cy = this.clockCenterY
    const radius = this.clockRadius

    const outer = this.add.graphics()
    outer.lineStyle(6, 0x5a4a32, 0.8)
    outer.strokeCircle(cx, cy, radius)

    outer.lineStyle(3, 0x3d3222, 0.6)
    outer.strokeCircle(cx, cy, radius - 10)

    const innerBg = this.add.graphics()
    innerBg.fillStyle(0x0f0f18, 0.95)
    innerBg.fillCircle(cx, cy, radius - 15)

    for (let i = 0; i < 12; i++) {
      const angle = Phaser.Math.DegToRad(i * 30) - Math.PI / 2
      const isMain = i % 3 === 0
      const innerR = radius - (isMain ? 28 : 22)
      const outerR = radius - 12

      const x1 = cx + Math.cos(angle) * innerR
      const y1 = cy + Math.sin(angle) * innerR
      const x2 = cx + Math.cos(angle) * outerR
      const y2 = cy + Math.sin(angle) * outerR

      const mark = this.add.graphics()
      mark.lineStyle(isMain ? 3 : 2, 0xc9a96a, 0.9)
      mark.beginPath()
      mark.moveTo(x1, y1)
      mark.lineTo(x2, y2)
      mark.strokePath()

      if (isMain) {
        const hourNum = i === 0 ? 12 : i
        const numR = radius - 42
        const nx = cx + Math.cos(angle) * numR
        const ny = cy + Math.sin(angle) * numR
        this.add.text(nx, ny, hourNum.toString(), {
          fontFamily: 'Georgia, serif',
          fontSize: `${14 * this.scaleFactor}px`,
          color: '#c9a96a',
          align: 'center',
        }).setOrigin(0.5)
      }
    }

    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue
      const angle = Phaser.Math.DegToRad(i * 6) - Math.PI / 2
      const innerR = radius - 18
      const outerR = radius - 12
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
    this.hourHand.setDepth(5)
    this.minuteHand = this.add.graphics()
    this.minuteHand.setDepth(6)

    const center = this.add.graphics()
    center.fillStyle(0xc9a96a, 1)
    center.fillCircle(this.clockCenterX, this.clockCenterY, 6)
    center.lineStyle(2, 0x8b7355, 1)
    center.strokeCircle(this.clockCenterX, this.clockCenterY, 6)
    center.setDepth(7)
  }

  private createTargetMarkers() {
    this.targetHourMarker = this.add.graphics()
    this.targetHourMarker.setDepth(3)
    this.targetMinuteMarker = this.add.graphics()
    this.targetMinuteMarker.setDepth(4)
  }

  private createTimeDisplay() {
    const { width } = this.scale
    const baseY = this.clockCenterY + this.clockRadius + 30

    this.currentTimeText = this.add.text(width * 0.62, baseY, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${18 * this.scaleFactor}px`,
      color: '#e8d5a3',
      fontStyle: 'bold',
    })
    this.currentTimeText.setDepth(10)

    this.targetTimeText = this.add.text(width * 0.82, baseY, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${18 * this.scaleFactor}px`,
      color: '#7ec97e',
      fontStyle: 'bold',
    })
    this.targetTimeText.setDepth(10)

    this.diffText = this.add.text(width * 0.7, baseY + 35, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${14 * this.scaleFactor}px`,
      color: '#a09070',
      align: 'center',
    }).setOrigin(0.5)
    this.diffText.setDepth(10)

    const currLabel = this.add.text(width * 0.62, baseY - 22, '当前时间', {
      fontFamily: 'Georgia, serif',
      fontSize: `${12 * this.scaleFactor}px`,
      color: '#8b7d5c',
    })
    currLabel.setDepth(10)

    const tgtLabel = this.add.text(width * 0.82, baseY - 22, '目标时间', {
      fontFamily: 'Georgia, serif',
      fontSize: `${12 * this.scaleFactor}px`,
      color: '#8b7d5c',
    })
    tgtLabel.setDepth(10)
  }

  updateTargetMarkers(): void {
    if (!this.targetHourMarker || !this.targetMinuteMarker) return
    const cx = this.clockCenterX
    const cy = this.clockCenterY
    const radius = this.clockRadius

    this.targetHourMarker.clear()
    this.targetMinuteMarker.clear()

    const hourAngle = ((this.targetTime.hours % 12) * 30 + this.targetTime.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (this.targetTime.minutes * 6 - 90) * Math.PI / 180

    this.targetHourMarker.lineStyle(5, 0x7ec97e, 0.4)
    this.targetHourMarker.beginPath()
    this.targetHourMarker.moveTo(cx, cy)
    this.targetHourMarker.lineTo(
      cx + Math.cos(hourAngle) * (radius - 55),
      cy + Math.sin(hourAngle) * (radius - 55),
    )
    this.targetHourMarker.strokePath()

    this.targetHourMarker.lineStyle(2, 0x7ec97e, 0.8)
    this.targetHourMarker.strokeCircle(
      cx + Math.cos(hourAngle) * (radius - 55),
      cy + Math.sin(hourAngle) * (radius - 55),
      5,
    )

    this.targetMinuteMarker.lineStyle(4, 0x7ec97e, 0.5)
    this.targetMinuteMarker.beginPath()
    this.targetMinuteMarker.moveTo(cx, cy)
    this.targetMinuteMarker.lineTo(
      cx + Math.cos(minuteAngle) * (radius - 30),
      cy + Math.sin(minuteAngle) * (radius - 30),
    )
    this.targetMinuteMarker.strokePath()

    this.targetMinuteMarker.lineStyle(2, 0x7ec97e, 0.9)
    this.targetMinuteMarker.strokeCircle(
      cx + Math.cos(minuteAngle) * (radius - 30),
      cy + Math.sin(minuteAngle) * (radius - 30),
      5,
    )

    if (this.toleranceMinutes > 0) {
      this.targetMinuteMarker.lineStyle(2, 0x7ec97e, 0.25)
      const minuteSpanAngle = this.toleranceMinutes * 6 * Math.PI / 180
      this.targetMinuteMarker.beginPath()
      this.targetMinuteMarker.arc(cx, cy, radius - 20, minuteAngle - minuteSpanAngle, minuteAngle + minuteSpanAngle, false)
      this.targetMinuteMarker.strokePath()
    }
  }

  updateTimeDisplay(): void {
    const currStr = `${this.currentTime.hours}:${this.currentTime.minutes.toString().padStart(2, '0')}`
    const tgtStr = `${this.targetTime.hours}:${this.targetTime.minutes.toString().padStart(2, '0')}`
    this.currentTimeText?.setText(currStr)
    this.targetTimeText?.setText(tgtStr)

    const diff = this.getTimeDiffMinutes()
    if (diff <= this.toleranceMinutes) {
      this.diffText?.setText(`✅ 已对齐！`)
      this.diffText?.setColor('#7ec97e')
    } else {
      const currTotal = this.currentTime.hours * 60 + this.currentTime.minutes
      const tgtTotal = this.targetTime.hours * 60 + this.targetTime.minutes
      let rawDiff = tgtTotal - currTotal
      if (rawDiff > 360) rawDiff -= 720
      if (rawDiff < -360) rawDiff += 720
      const sign = rawDiff > 0 ? '+' : ''
      this.diffText?.setText(`偏差：${sign}${rawDiff}分钟`)
      this.diffText?.setColor(Math.abs(rawDiff) <= 15 ? '#e8c87a' : '#e08080')
    }
  }

  updateClockHands(immediate = false): void {
    const cx = this.clockCenterX
    const cy = this.clockCenterY
    const radius = this.clockRadius

    const hourAngle = ((this.currentTime.hours % 12) * 30 + this.currentTime.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (this.currentTime.minutes * 6 - 90) * Math.PI / 180

    const hourEndX = cx + Math.cos(hourAngle) * (radius - 55)
    const hourEndY = cy + Math.sin(hourAngle) * (radius - 55)
    const minuteEndX = cx + Math.cos(minuteAngle) * (radius - 28)
    const minuteEndY = cy + Math.sin(minuteAngle) * (radius - 28)

    const draw = () => {
      this.hourHand?.clear()
      this.hourHand?.lineStyle(8, 0xc9a96a, 1)
      this.hourHand?.beginPath()
      this.hourHand?.moveTo(cx, cy)
      this.hourHand?.lineTo(hourEndX, hourEndY)
      this.hourHand?.strokePath()

      this.hourHand?.lineStyle(3, 0xe8d5a3, 1)
      this.hourHand?.beginPath()
      this.hourHand?.moveTo(cx, cy)
      this.hourHand?.lineTo(hourEndX, hourEndY)
      this.hourHand?.strokePath()

      this.minuteHand?.clear()
      this.minuteHand?.lineStyle(5, 0xc9a96a, 1)
      this.minuteHand?.beginPath()
      this.minuteHand?.moveTo(cx, cy)
      this.minuteHand?.lineTo(minuteEndX, minuteEndY)
      this.minuteHand?.strokePath()

      this.minuteHand?.lineStyle(2, 0xe8d5a3, 1)
      this.minuteHand?.beginPath()
      this.minuteHand?.moveTo(cx, cy)
      this.minuteHand?.lineTo(minuteEndX, minuteEndY)
      this.minuteHand?.strokePath()
    }

    if (immediate) {
      draw()
    } else {
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 200,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onUpdate: draw,
      })
      draw()
    }
  }

  private getTimeDiffMinutes(): number {
    const curr = this.currentTime.hours * 60 + this.currentTime.minutes
    const tgt = this.targetTime.hours * 60 + this.targetTime.minutes
    let diff = Math.abs(curr - tgt)
    if (diff > 360) diff = 720 - diff
    return diff
  }

  checkTargetReached(): boolean {
    return this.getTimeDiffMinutes() <= this.toleranceMinutes
  }

  private createTrainingGear(config: TrainingGearConfig): void {
    const { width, height } = this.scale
    const x = width * 0.04 + (config.x / 1000) * (width * 0.48)
    const y = height * 0.15 + (config.y / 700) * (height * 0.75)

    const container = this.add.container(x, y)
    const radius = GEAR_SIZES[config.size] * this.scaleFactor
    const teethCount = config.size === 'large' ? 16 : config.size === 'medium' ? 12 : 8
    container.setDepth(20)

    const highlightGlow = this.add.graphics()
    highlightGlow.setDepth(18)
    this.gearHighlightGlow.set(config.id, highlightGlow)

    const gearGraphic = this.add.graphics()
    this.gearGraphicsMap.set(config.id, gearGraphic)
    this.drawGear(gearGraphic, radius, teethCount, config.size, config.highlight)
    container.add(gearGraphic)

    const marker = this.add.graphics()
    const markerColors = { large: 0xffa500, medium: 0x87ceeb, small: 0x90ee90 }
    marker.fillStyle(markerColors[config.size], 1)
    marker.fillCircle(0, -radius + 10, 5)
    container.add(marker)

    if (config.label) {
      const label = this.add.text(0, 0, config.label, {
        fontFamily: 'Georgia, serif',
        fontSize: config.size === 'large' ? '14px' : config.size === 'medium' ? '12px' : '10px',
        color: '#e8d5a3',
        fontStyle: 'bold',
      }).setOrigin(0.5)
      container.add(label)
    }

    const deltaText = config.size === 'large' ? '±60分' : config.size === 'medium' ? '±15分' : '±5分'
    const hint = this.add.text(0, radius + 16, deltaText, {
      fontFamily: 'Georgia, serif',
      fontSize: '10px',
      color: '#8b7d5c',
    }).setOrigin(0.5)
    container.add(hint)

    if (config.description) {
      const desc = this.add.text(0, radius + 32, config.description, {
        fontFamily: 'Georgia, serif',
        fontSize: '9px',
        color: '#6a5d4c',
        align: 'center',
      }).setOrigin(0.5)
      container.add(desc)
    }

    const hitArea = this.add.zone(0, 0, radius * 2.5, radius * 2.5)
    hitArea.setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - x
      const direction: 1 | -1 = localX >= 0 ? 1 : -1
      this.handleGearClick(config.id, direction)
    })

    hitArea.on('pointerover', () => {
      const glow = this.gearHighlightGlow.get(config.id)
      if (glow && !config.highlight) {
        glow.clear()
        glow.lineStyle(3, 0xc9a96a, 0.4)
        glow.strokeCircle(0, 0, radius + 8)
        container.add(glow)
      }
    })

    hitArea.on('pointerout', () => {
      const glow = this.gearHighlightGlow.get(config.id)
      if (glow && !config.highlight) {
        glow.clear()
      }
    })

    this.gearSprites.set(config.id, container)
  }

  private drawGear(
    graphic: Phaser.GameObjects.Graphics,
    radius: number,
    teethCount: number,
    size: 'large' | 'medium' | 'small',
    highlight?: boolean,
  ) {
    graphic.clear()
    const toothDepth = radius * 0.12
    const toothWidth = (Math.PI * 2) / (teethCount * 2)

    const baseColor = highlight ? 0x4a3a5a : 0x353040
    const borderColor = highlight ? 0xd4a5ff : 0x8b7d5c

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

    graphic.lineStyle(1, borderColor, 0.2)
    graphic.strokeCircle(0, 0, radius - toothDepth)

    graphic.fillStyle(0x1a1a2e, 1)
    graphic.beginPath()
    graphic.arc(0, 0, radius * 0.3, 0, Math.PI * 2)
    graphic.fillPath()

    graphic.lineStyle(3, borderColor, 0.8)
    graphic.strokeCircle(0, 0, radius * 0.3)

    const spokeCount = size === 'large' ? 6 : 4
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI * 2) / spokeCount
      graphic.lineStyle(2, borderColor, 0.5)
      graphic.beginPath()
      graphic.moveTo(Math.cos(angle) * radius * 0.3, Math.sin(angle) * radius * 0.3)
      graphic.lineTo(Math.cos(angle) * (radius - toothDepth - 5), Math.sin(angle) * (radius - toothDepth - 5))
      graphic.strokePath()
    }
  }

  updateHighlights(): void {
    if (!this.lesson || !this.currentStep) {
      this.gearHighlightGlow.forEach((glow) => glow.clear())
      return
    }

    const expectedGearIds = this.currentStep.expectedActions?.map((a) => a.gearId) ?? []

    this.lesson.gears.forEach((config) => {
      const glow = this.gearHighlightGlow.get(config.id)
      const container = this.gearSprites.get(config.id)
      if (!glow || !container) return

      glow.clear()
      const radius = GEAR_SIZES[config.size] * this.scaleFactor

      if (expectedGearIds.includes(config.id)) {
        glow.lineStyle(4, 0xffd700, 0.7)
        glow.strokeCircle(0, 0, radius + 12)

        this.tweens.add({
          targets: glow,
          alpha: { from: 0.5, to: 1 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: Phaser.Math.Easing.Sine.InOut,
        })

        const arrow = this.add.graphics()
        arrow.fillStyle(0xffd700, 0.9)
        arrow.setDepth(25)
        container.add(glow)
      }
    })
  }

  private handleGearClick(gearId: number, direction: 1 | -1): void {
    if (!this.lesson) return

    const config = this.lesson.gears.find((g) => g.id === gearId)
    if (!config) return

    this.rotateGear(gearId, direction)

    const baseDelta = GEAR_TIME_DELTAS[config.size]
    let totalDelta = baseDelta * direction

    config.connectedTo.forEach((connectedId) => {
      const connectedConfig = this.lesson?.gears.find((g) => g.id === connectedId)
      if (connectedConfig) {
        this.rotateGear(connectedId, (-direction) as 1 | -1)
        totalDelta += GEAR_TIME_DELTAS[connectedConfig.size] * (-direction)
      }
    })

    this.advanceTime(Math.round(totalDelta))
    this.callbacks?.onGearClick(gearId, direction)
  }

  private rotateGear(gearId: number, direction: 1 | -1): void {
    const container = this.gearSprites.get(gearId)
    if (!container) return

    const currentAngle = this.gearAngles.get(gearId) ?? 0
    const newAngle = this.normalizeAngle(currentAngle + SNAP_ANGLE * direction)
    this.gearAngles.set(gearId, newAngle)

    this.tweens.add({
      targets: container,
      rotation: Phaser.Math.DegToRad(newAngle),
      duration: 200,
      ease: Phaser.Math.Easing.Quadratic.Out,
    })
  }

  updateAllGearAngles(immediate = false): void {
    this.gearAngles.forEach((angle, id) => {
      const container = this.gearSprites.get(id)
      if (!container) return
      if (immediate) {
        container.rotation = Phaser.Math.DegToRad(angle)
      } else {
        this.tweens.add({
          targets: container,
          rotation: Phaser.Math.DegToRad(angle),
          duration: 200,
          ease: Phaser.Math.Easing.Quadratic.Out,
        })
      }
    })
  }

  private advanceTime(minutes: number): void {
    if (minutes === 0) return
    let totalMinutes = this.currentTime.hours * 60 + this.currentTime.minutes
    totalMinutes += minutes
    totalMinutes = ((totalMinutes % 720) + 720) % 720
    if (totalMinutes === 0) totalMinutes = 720

    const hours = Math.floor(totalMinutes / 60) || 12
    const mins = totalMinutes % 60

    this.currentTime = { hours, minutes: mins }
    this.updateClockHands()
    this.updateTimeDisplay()
    this.callbacks?.onTimeChange(this.currentTime)

    if (this.checkTargetReached()) {
      this.callbacks?.onTargetReached?.()
    }
  }

  private normalizeAngle(angle: number): number {
    let result = angle % 360
    if (result < 0) result += 360
    return result
  }

  playSuccessAnimation(): void {
    this.cameras.main.flash(400, 150, 130, 80)

    this.gearSprites.forEach((container, id) => {
      this.time.delayedCall(id * 80, () => {
        this.tweens.add({
          targets: container,
          scale: { from: 1, to: 1.1 },
          duration: 200,
          yoyo: true,
          ease: Phaser.Math.Easing.Back.Out,
        })
      })
    })

    const cx = this.clockCenterX
    const cy = this.clockCenterY
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 25, () => {
        const angle = (i / 20) * Math.PI * 2
        const dist = this.clockRadius * 0.6
        const x = cx + Math.cos(angle) * dist
        const y = cy + Math.sin(angle) * dist
        const spark = this.add.circle(x, y, 4, 0xffd700, 1)
        spark.setDepth(50)
        this.tweens.add({
          targets: spark,
          x: cx,
          y: cy,
          scale: { from: 1, to: 0 },
          alpha: { from: 1, to: 0 },
          duration: 500,
          ease: Phaser.Math.Easing.Quadratic.In,
          onComplete: () => spark.destroy(),
        })
      })
    }
  }

  playMistakeAnimation(gearId: number): void {
    const container = this.gearSprites.get(gearId)
    if (!container) return

    this.cameras.main.shake(150, 0.005)
    this.tweens.add({
      targets: container,
      x: { from: container.x - 5, to: container.x + 5 },
      duration: 50,
      yoyo: true,
      repeat: 3,
    })
  }

  showHintPulse(gearId: number): void {
    const container = this.gearSprites.get(gearId)
    const glow = this.gearHighlightGlow.get(gearId)
    if (!container || !glow || !this.lesson) return

    const config = this.lesson.gears.find((g) => g.id === gearId)
    if (!config) return

    const radius = GEAR_SIZES[config.size] * this.scaleFactor
    glow.clear()
    glow.lineStyle(5, 0x00ffff, 0.9)
    glow.strokeCircle(0, 0, radius + 15)

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 1 },
      duration: 400,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        glow.clear()
      },
    })
  }
}
