import Phaser from 'phaser'
import type { ClockTime, SideTowerClock, ClockMechanism, MultiClockLevelConfig } from '../types'
import { workshopSystem, GEAR_MATERIALS } from './WorkshopSystem'
import type { GearMaterialConfig, WorkshopEffects } from '../types'

interface SideTowerVisual {
  container: Phaser.GameObjects.Container
  hourHand: Phaser.GameObjects.Graphics
  minuteHand: Phaser.GameObjects.Graphics
  targetMarker: Phaser.GameObjects.Graphics
  deviationText: Phaser.GameObjects.Text
  statusIndicator: Phaser.GameObjects.Graphics
  alignmentRing: Phaser.GameObjects.Graphics
  hitArea: Phaser.GameObjects.Zone
}

interface MechanismVisual {
  container: Phaser.GameObjects.Container
  line: Phaser.GameObjects.Graphics
  pulseCircle: Phaser.GameObjects.Graphics
  label: Phaser.GameObjects.Text
  particles: Phaser.GameObjects.Particles.ParticleEmitter | null
}

export class MultiClockScene extends Phaser.Scene {
  private sideTowers: Map<string, SideTowerVisual> = new Map()
  private mechanisms: Map<string, MechanismVisual> = new Map()
  private mainClockHourHand!: Phaser.GameObjects.Graphics
  private mainClockMinuteHand!: Phaser.GameObjects.Graphics
  private mainClockTargetHour!: Phaser.GameObjects.Graphics
  private mainClockTargetMinute!: Phaser.GameObjects.Graphics
  private mainClockHitArea!: Phaser.GameObjects.Zone
  private mainClockCenterX = 0
  private mainClockCenterY = 0
  private mainClockRadius = 0
  private interactionsLocked = false
  private levelConfig: MultiClockLevelConfig | null = null
  private gearMaterial: GearMaterialConfig = GEAR_MATERIALS[0]
  private workshopEffects: WorkshopEffects = {
    efficiencyMultiplier: 1.0,
    toleranceMinutes: 0,
    faultResistanceChance: 0,
    showTargetHint: false,
    enhancedFeedback: false,
  }
  private scaleFactor = 1

  private onMainClockClick?: (direction: 1 | -1) => void
  private onSideTowerClick?: (towerId: string, direction: 1 | -1) => void

  constructor() {
    super('MultiClockScene')
  }

  setLevelConfig(config: MultiClockLevelConfig): void {
    this.levelConfig = config
  }

  setGearMaterial(material: GearMaterialConfig): void {
    this.gearMaterial = material
  }

  setWorkshopEffects(effects: WorkshopEffects): void {
    this.workshopEffects = { ...effects }
  }

  setCallbacks(
    onMainClockClick: (direction: 1 | -1) => void,
    onSideTowerClick: (towerId: string, direction: 1 | -1) => void,
  ) {
    this.onMainClockClick = onMainClockClick
    this.onSideTowerClick = onSideTowerClick
  }

  lockInteractions(): void {
    this.interactionsLocked = true
    if (this.mainClockHitArea && this.mainClockHitArea.input) {
      this.mainClockHitArea.disableInteractive()
    }
    this.sideTowers.forEach((towerVisual) => {
      if (towerVisual.hitArea && towerVisual.hitArea.input) {
        towerVisual.hitArea.disableInteractive()
      }
    })
  }

  create() {
    const { width, height } = this.scale
    this.scaleFactor = Math.min(width / 900, height / 700)

    this.gearMaterial = workshopSystem.getCurrentMaterial()
    this.workshopEffects = workshopSystem.getEffects()

    this.mainClockCenterX = width / 2
    this.mainClockCenterY = height / 2
    this.mainClockRadius = Math.min(width, height) * 0.28

    this.createBackground()

    if (this.levelConfig) {
      this.createMechanismConnections()
      this.createMainClock()
      this.createSideTowers()
    }
  }

  private createBackground() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x151528, 0x151528, 1)
    bg.fillRect(0, 0, width, height)

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const size = Phaser.Math.FloatBetween(0.5, 2.5)
      const alpha = Phaser.Math.FloatBetween(0.2, 0.7)
      this.add.circle(x, y, size, 0xe8d5a3, alpha)
    }

    const towerFrame = this.add.graphics()
    towerFrame.lineStyle(4, 0x3d3222, 0.5)
    towerFrame.strokeRoundedRect(width * 0.03, height * 0.03, width * 0.94, height * 0.94, 24)

    const innerFrame = this.add.graphics()
    innerFrame.lineStyle(2, 0x5a4a32, 0.35)
    innerFrame.strokeRoundedRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9, 18)
  }

  private createMechanismConnections() {
    if (!this.levelConfig) return

    const { width, height } = this.scale

    this.levelConfig.mechanisms.forEach((mech) => {
      const sourcePos = this.getClockPosition(mech.sourceClockId, width, height)
      const targetPos = this.getClockPosition(mech.targetClockId, width, height)

      if (!sourcePos || !targetPos) return

      const container = this.add.container(0, 0)
      container.setDepth(2)

      const line = this.add.graphics()
      line.lineStyle(3, 0x5a4a32, 0.6)
      line.beginPath()
      line.moveTo(sourcePos.x, sourcePos.y)
      line.lineTo(targetPos.x, targetPos.y)
      line.strokePath()
      container.add(line)

      const midX = (sourcePos.x + targetPos.x) / 2
      const midY = (sourcePos.y + targetPos.y) / 2

      const pulseCircle = this.add.graphics()
      pulseCircle.lineStyle(2, this.gearMaterial.visual.borderColor, 0)
      pulseCircle.strokeCircle(midX, midY, 12)
      container.add(pulseCircle)

      const label = this.add.text(midX, midY, mech.displayName, {
        fontFamily: 'Georgia, serif',
        fontSize: `${10 * this.scaleFactor}px`,
        color: '#8b7d5c',
        align: 'center',
        backgroundColor: 'rgba(10, 10, 20, 0.8)',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5)
      label.setY(midY + 18)
      container.add(label)

      this.mechanisms.set(mech.id, {
        container,
        line,
        pulseCircle,
        label,
        particles: null,
      })
    })
  }

  private getClockPosition(
    id: string,
    width: number,
    height: number,
  ): { x: number; y: number } | null {
    if (id === 'main') {
      return { x: this.mainClockCenterX, y: this.mainClockCenterY }
    }
    const tower = this.levelConfig?.sideTowers.find((t) => t.id === id)
    if (tower) {
      return { x: width * tower.position.x, y: height * tower.position.y }
    }
    return null
  }

  private createMainClock() {
    const cx = this.mainClockCenterX
    const cy = this.mainClockCenterY
    const r = this.mainClockRadius

    const frame = this.add.graphics()
    frame.lineStyle(8, 0x5a4a32, 0.8)
    frame.strokeCircle(cx, cy, r + 5)

    frame.lineStyle(4, 0x3d3222, 0.6)
    frame.strokeCircle(cx, cy, r - 12)

    const bg = this.add.graphics()
    bg.fillStyle(0x0f0f1a, 0.95)
    bg.fillCircle(cx, cy, r - 18)

    for (let i = 0; i < 12; i++) {
      const angle = Phaser.Math.DegToRad(i * 30) - Math.PI / 2
      const isMain = i % 3 === 0
      const innerR = r - (isMain ? 35 : 28)
      const outerR = r - 16

      const mark = this.add.graphics()
      mark.lineStyle(isMain ? 5 : 2, 0xc9a96a, 0.9)
      mark.beginPath()
      mark.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
      mark.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
      mark.strokePath()

      if (isMain) {
        const num = i === 0 ? 12 : i
        const numR = r - 55
        this.add.text(cx + Math.cos(angle) * numR, cy + Math.sin(angle) * numR, num.toString(), {
          fontFamily: 'Georgia, serif',
          fontSize: `${22 * this.scaleFactor}px`,
          color: '#c9a96a',
          fontStyle: 'bold',
        }).setOrigin(0.5)
      }
    }

    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue
      const angle = Phaser.Math.DegToRad(i * 6) - Math.PI / 2
      const mark = this.add.graphics()
      mark.lineStyle(1, 0x5a4a32, 0.6)
      mark.beginPath()
      mark.moveTo(cx + Math.cos(angle) * (r - 20), cy + Math.sin(angle) * (r - 20))
      mark.lineTo(cx + Math.cos(angle) * (r - 16), cy + Math.sin(angle) * (r - 16))
      mark.strokePath()
    }

    this.mainClockHourHand = this.add.graphics()
    this.mainClockMinuteHand = this.add.graphics()
    this.mainClockHourHand.setDepth(10)
    this.mainClockMinuteHand.setDepth(11)

    const center = this.add.graphics()
    center.fillStyle(0xc9a96a, 1)
    center.fillCircle(cx, cy, 10)
    center.lineStyle(3, 0x8b7355, 1)
    center.strokeCircle(cx, cy, 10)
    center.setDepth(12)

    this.mainClockTargetHour = this.add.graphics()
    this.mainClockTargetMinute = this.add.graphics()
    this.mainClockTargetHour.setDepth(5)
    this.mainClockTargetMinute.setDepth(6)

    const title = this.add.text(cx, cy - r - 30, '主钟楼', {
      fontFamily: 'Georgia, serif',
      fontSize: `${18 * this.scaleFactor}px`,
      color: '#c9a96a',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    title.setDepth(20)

    const hitArea = this.add.zone(cx, cy, r * 2.2, r * 2.2)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.setDepth(15)
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.interactionsLocked) return
      const direction: 1 | -1 = pointer.x >= cx ? 1 : -1
      this.onMainClockClick?.(direction)
    })
    this.mainClockHitArea = hitArea
  }

  private createSideTowers() {
    if (!this.levelConfig) return
    const { width, height } = this.scale

    this.levelConfig.sideTowers.forEach((tower) => {
      const cx = width * tower.position.x
      const cy = height * tower.position.y
      const r = Math.min(width, height) * 0.1

      const container = this.add.container(cx, cy)
      container.setDepth(8)

      const frame = this.add.graphics()
      frame.lineStyle(5, 0x4a3d28, 0.75)
      frame.strokeCircle(0, 0, r + 3)

      frame.lineStyle(2, 0x3d3222, 0.5)
      frame.strokeCircle(0, 0, r - 8)

      const bg = this.add.graphics()
      bg.fillStyle(0x12121e, 0.95)
      bg.fillCircle(0, 0, r - 12)
      container.add(bg)

      for (let i = 0; i < 12; i++) {
        const angle = Phaser.Math.DegToRad(i * 30) - Math.PI / 2
        const isMain = i % 3 === 0
        const innerR = r - (isMain ? 18 : 14)
        const outerR = r - 10

        const mark = this.add.graphics()
        mark.lineStyle(isMain ? 3 : 1.5, 0xc9a96a, 0.8)
        mark.beginPath()
        mark.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
        mark.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
        mark.strokePath()
        container.add(mark)
      }

      const hourHand = this.add.graphics()
      const minuteHand = this.add.graphics()
      hourHand.setDepth(2)
      minuteHand.setDepth(3)
      container.add(hourHand)
      container.add(minuteHand)

      const center = this.add.graphics()
      center.fillStyle(0xc9a96a, 1)
      center.fillCircle(0, 0, 5)
      container.add(center)

      const targetMarker = this.add.graphics()
      targetMarker.setDepth(1)
      container.add(targetMarker)

      const alignmentRing = this.add.graphics()
      alignmentRing.setDepth(4)
      container.add(alignmentRing)

      const statusIndicator = this.add.graphics()
      statusIndicator.fillStyle(0xff6b6b, 0.8)
      statusIndicator.fillCircle(0, -r - 10, 6)
      statusIndicator.setDepth(15)
      container.add(statusIndicator)

      const deviationText = this.add.text(0, r + 14, '', {
        fontFamily: 'Georgia, serif',
        fontSize: `${11 * this.scaleFactor}px`,
        color: '#ff8888',
        align: 'center',
      }).setOrigin(0.5)
      deviationText.setDepth(15)
      container.add(deviationText)

      const nameText = this.add.text(0, -r - 24, tower.displayName, {
        fontFamily: 'Georgia, serif',
        fontSize: `${12 * this.scaleFactor}px`,
        color: '#c9a96a',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5)
      nameText.setDepth(15)
      container.add(nameText)

      const roleText = this.add.text(0, 0, tower.role === 'hour' ? '时' : '分', {
        fontFamily: 'Georgia, serif',
        fontSize: `${14 * this.scaleFactor}px`,
        color: '#8b7d5c',
        align: 'center',
      }).setOrigin(0.5)
      roleText.setAlpha(0.35)
      container.add(roleText)

      const hitArea = this.add.zone(0, 0, r * 2.4, r * 2.4)
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.setDepth(10)
      hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.interactionsLocked) return
        const localX = pointer.x - cx
        const direction: 1 | -1 = localX >= 0 ? 1 : -1
        this.onSideTowerClick?.(tower.id, direction)
      })

      this.sideTowers.set(tower.id, {
        container,
        hourHand,
        minuteHand,
        targetMarker,
        deviationText,
        statusIndicator,
        alignmentRing,
        hitArea,
      })
    })
  }

  updateMainClock(time: ClockTime, immediate = false) {
    this.drawClockHands(
      this.mainClockHourHand,
      this.mainClockMinuteHand,
      time,
      this.mainClockCenterX,
      this.mainClockCenterY,
      this.mainClockRadius - 60,
      this.mainClockRadius - 30,
      immediate,
    )
  }

  setMainClockTarget(time: ClockTime) {
    this.drawTargetMarker(
      this.mainClockTargetHour,
      this.mainClockTargetMinute,
      time,
      this.mainClockCenterX,
      this.mainClockCenterY,
      this.mainClockRadius - 65,
      this.mainClockRadius - 35,
    )
  }

  updateSideTower(tower: SideTowerClock) {
    const visual = this.sideTowers.get(tower.id)
    if (!visual) return

    const { width, height } = this.scale
    const r = Math.min(width, height) * 0.1

    this.drawClockHands(
      visual.hourHand,
      visual.minuteHand,
      tower.currentTime,
      0,
      0,
      r - 30,
      r - 15,
      false,
      visual.container,
    )

    this.drawTargetMarker(
      visual.targetMarker,
      null,
      tower.targetTime,
      0,
      0,
      r - 32,
      r - 17,
    )

    visual.deviationText.setText(`偏差: ${tower.deviationMinutes}分`)
    visual.deviationText.setColor(tower.isAligned ? '#7ec97e' : '#ff8888')

    visual.statusIndicator.clear()
    visual.statusIndicator.fillStyle(tower.isAligned ? 0x7ec97e : 0xff6b6b, 0.9)
    visual.statusIndicator.fillCircle(0, -r - 10, 7)

    visual.alignmentRing.clear()
    if (tower.isAligned) {
      visual.alignmentRing.lineStyle(3, 0x7ec97e, 0.7)
      visual.alignmentRing.strokeCircle(0, 0, r + 6)
    }

    if (this.workshopEffects.enhancedFeedback) {
      this.tweens.add({
        targets: visual.container,
        scale: { from: 1.02, to: 1 },
        duration: 200,
        ease: Phaser.Math.Easing.Quadratic.Out,
      })
    }
  }

  activateMechanism(mechanism: ClockMechanism) {
    const visual = this.mechanisms.get(mechanism.id)
    if (!visual) return

    const { width, height } = this.scale
    const sourcePos = this.getClockPosition(mechanism.sourceClockId, width, height)
    const targetPos = this.getClockPosition(mechanism.targetClockId, width, height)
    if (!sourcePos || !targetPos) return

    const glowColor = this.gearMaterial.visual.borderColor

    visual.line.clear()
    visual.line.lineStyle(4, glowColor, 0.9)
    visual.line.beginPath()
    visual.line.moveTo(sourcePos.x, sourcePos.y)
    visual.line.lineTo(targetPos.x, targetPos.y)
    visual.line.strokePath()

    visual.label.setColor('#c9a96a')
    visual.label.setFontStyle('bold')

    const midX = (sourcePos.x + targetPos.x) / 2
    const midY = (sourcePos.y + targetPos.y) / 2

    this.tweens.add({
      targets: visual.pulseCircle,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 0.8, to: 0 },
      duration: 600,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onStart: () => {
        visual.pulseCircle.clear()
        visual.pulseCircle.lineStyle(2, glowColor, 0.8)
        visual.pulseCircle.strokeCircle(midX, midY, 12)
      },
      onComplete: () => {
        visual.pulseCircle.clear()
        visual.pulseCircle.fillStyle(glowColor, 0.7)
        visual.pulseCircle.fillCircle(midX, midY, 8)
      },
    })

    for (let i = 0; i < 12; i++) {
      const t = i / 12
      const px = sourcePos.x + (targetPos.x - sourcePos.x) * t
      const py = sourcePos.y + (targetPos.y - sourcePos.y) * t

      this.time.delayedCall(i * 50, () => {
        const spark = this.add.circle(px, py, 3, glowColor, 0.9)
        spark.setDepth(50)
        this.tweens.add({
          targets: spark,
          scale: { from: 1.5, to: 0 },
          alpha: { from: 1, to: 0 },
          duration: 400,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onComplete: () => spark.destroy(),
        })
      })
    }
  }

  private drawClockHands(
    hourHand: Phaser.GameObjects.Graphics,
    minuteHand: Phaser.GameObjects.Graphics,
    time: ClockTime,
    cx: number,
    cy: number,
    hourLength: number,
    minuteLength: number,
    immediate: boolean,
    container?: Phaser.GameObjects.Container,
  ) {
    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180

    const hourEndX = cx + Math.cos(hourAngle) * hourLength
    const hourEndY = cy + Math.sin(hourAngle) * hourLength
    const minEndX = cx + Math.cos(minuteAngle) * minuteLength
    const minEndY = cy + Math.sin(minuteAngle) * minuteLength

    const draw = () => {
      hourHand.clear()
      hourHand.lineStyle(8, 0xc9a96a, 1)
      hourHand.beginPath()
      hourHand.moveTo(cx, cy)
      hourHand.lineTo(hourEndX, hourEndY)
      hourHand.strokePath()

      hourHand.lineStyle(3, 0xe8d5a3, 1)
      hourHand.beginPath()
      hourHand.moveTo(cx, cy)
      hourHand.lineTo(hourEndX, hourEndY)
      hourHand.strokePath()

      minuteHand.clear()
      minuteHand.lineStyle(5, 0xc9a96a, 1)
      minuteHand.beginPath()
      minuteHand.moveTo(cx, cy)
      minuteHand.lineTo(minEndX, minEndY)
      minuteHand.strokePath()

      minuteHand.lineStyle(2, 0xe8d5a3, 1)
      minuteHand.beginPath()
      minuteHand.moveTo(cx, cy)
      minuteHand.lineTo(minEndX, minEndY)
      minuteHand.strokePath()
    }

    if (immediate || !this.tweens) {
      draw()
    } else {
      draw()
      if (container) {
        this.tweens.add({
          targets: container,
          angle: container.angle,
          duration: 150,
          ease: Phaser.Math.Easing.Quadratic.Out,
        })
      }
    }
  }

  private drawTargetMarker(
    hourMarker: Phaser.GameObjects.Graphics,
    minuteMarker: Phaser.GameObjects.Graphics | null,
    time: ClockTime,
    cx: number,
    cy: number,
    hourLength: number,
    minuteLength: number,
  ) {
    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180
    const glowColor = this.gearMaterial.visual.borderColor
    const alpha = this.workshopEffects.showTargetHint ? 0.7 : 0.45

    hourMarker.clear()
    hourMarker.lineStyle(5, glowColor, alpha)
    hourMarker.beginPath()
    hourMarker.moveTo(cx, cy)
    hourMarker.lineTo(cx + Math.cos(hourAngle) * hourLength, cy + Math.sin(hourAngle) * hourLength)
    hourMarker.strokePath()

    hourMarker.lineStyle(2, glowColor, Math.min(1, alpha + 0.3))
    hourMarker.strokeCircle(
      cx + Math.cos(hourAngle) * hourLength,
      cy + Math.sin(hourAngle) * hourLength,
      5,
    )

    if (minuteMarker) {
      minuteMarker.clear()
      minuteMarker.lineStyle(4, glowColor, alpha)
      minuteMarker.beginPath()
      minuteMarker.moveTo(cx, cy)
      minuteMarker.lineTo(
        cx + Math.cos(minuteAngle) * minuteLength,
        cy + Math.sin(minuteAngle) * minuteLength,
      )
      minuteMarker.strokePath()

      minuteMarker.lineStyle(2, glowColor, Math.min(1, alpha + 0.3))
      minuteMarker.strokeCircle(
        cx + Math.cos(minuteAngle) * minuteLength,
        cy + Math.sin(minuteAngle) * minuteLength,
        4,
      )
    }
  }

  playVictoryAnimation() {
    this.cameras.main.flash(800, 200, 180, 100)

    this.sideTowers.forEach((visual, id) => {
      const tower = this.levelConfig?.sideTowers.find((t) => t.id === id)
      const delay = tower ? Math.sqrt(tower.position.x ** 2 + tower.position.y ** 2) * 300 : 0

      this.time.delayedCall(delay, () => {
        this.tweens.add({
          targets: visual.container,
          scale: { from: 1, to: 1.2 },
          duration: 400,
          yoyo: true,
          ease: Phaser.Math.Easing.Back.Out,
        })
      })
    })

    const cx = this.mainClockCenterX
    const cy = this.mainClockCenterY
    for (let i = 0; i < 48; i++) {
      this.time.delayedCall(i * 25, () => {
        const angle = (i / 48) * Math.PI * 2
        const dist = this.mainClockRadius * 0.85
        const x = cx + Math.cos(angle) * dist
        const y = cy + Math.sin(angle) * dist
        const spark = this.add.circle(x, y, 6, 0xffd700, 1)
        spark.setDepth(100)
        this.tweens.add({
          targets: spark,
          x: cx,
          y: cy,
          scale: { from: 1, to: 0 },
          alpha: { from: 1, to: 0 },
          duration: 700,
          ease: Phaser.Math.Easing.Quadratic.In,
          onComplete: () => spark.destroy(),
        })
      })
    }
  }

  playFailureAnimation() {
    this.cameras.main.shake(600, 0.008)

    this.sideTowers.forEach((visual) => {
      this.tweens.add({
        targets: visual.container,
        x: visual.container.x + Phaser.Math.Between(-8, 8),
        y: visual.container.y + Phaser.Math.Between(-8, 8),
        duration: 80,
        yoyo: true,
        repeat: 5,
      })
    })
  }
}
