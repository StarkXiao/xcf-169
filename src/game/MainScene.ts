import Phaser from 'phaser'
import type { GearConfig } from './GearSystem'

export const GEAR_CONFIGS: GearConfig[] = [
  { id: 0, x: 0.5, y: 0.5, size: 'large', connectedTo: [1, 2] },
  { id: 1, x: 0.25, y: 0.35, size: 'medium', connectedTo: [0, 3] },
  { id: 2, x: 0.75, y: 0.35, size: 'medium', connectedTo: [0, 4] },
  { id: 3, x: 0.2, y: 0.7, size: 'small', connectedTo: [1] },
  { id: 4, x: 0.8, y: 0.7, size: 'small', connectedTo: [2] },
]

export const TOTAL_TIME = 90
export const GEAR_SIZES = {
  large: 90,
  medium: 65,
  small: 45,
}

export class MainScene extends Phaser.Scene {
  private gearSprites: Map<number, Phaser.GameObjects.Container> = new Map()
  private gearRadii: Map<number, number> = new Map()
  private lightningFlash: Phaser.GameObjects.Rectangle | null = null
  private onGearClick?: (gearId: number, direction: 1 | -1) => void
  private scaleFactor = 1
  public alignedCache: Map<number, boolean> = new Map()

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

    this.createBackground()
    this.createRain()
    this.createLightning()
    this.createGears()
    this.createClockFace()
    this.startLightningLoop()
  }

  private createBackground() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a12, 0x0a0a12, 0x1a1a2e, 0x12121a, 1)
    bg.fillRect(0, 0, width, height)

    for (let i = 0; i < 30; i++) {
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

  private createClockFace() {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) * 0.42

    const face = this.add.graphics()
    face.lineStyle(6, 0x5a4a32, 0.7)
    face.strokeCircle(cx, cy, radius)

    face.lineStyle(3, 0x3d3222, 0.5)
    face.strokeCircle(cx, cy, radius - 15)

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

    const gearGraphic = this.add.graphics()
    this.drawGear(gearGraphic, radius, teethCount)
    container.add(gearGraphic)

    const marker = this.add.graphics()
    marker.fillStyle(0xc9a96a, 1)
    marker.fillCircle(0, -radius + 12, 6)
    container.add(marker)

    const targetHint = this.add.graphics()
    targetHint.lineStyle(2, 0x7ec97e, 0.5)
    targetHint.beginPath()
    targetHint.arc(0, 0, radius + 10, -Math.PI / 2 - 0.15, -Math.PI / 2 + 0.15)
    targetHint.strokePath()
    container.add(targetHint)

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

  private drawGear(graphic: Phaser.GameObjects.Graphics, radius: number, teethCount: number) {
    graphic.clear()
    const toothDepth = radius * 0.12
    const toothWidth = (Math.PI * 2) / (teethCount * 2)

    graphic.fillStyle(0x4a3f2a, 1)
    graphic.lineStyle(2, 0x8b7355, 1)

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

    graphic.fillStyle(0x2a2318, 1)
    graphic.beginPath()
    graphic.arc(0, 0, radius * 0.3, 0, Math.PI * 2)
    graphic.fillPath()

    graphic.lineStyle(3, 0x8b7355, 0.8)
    graphic.strokeCircle(0, 0, radius * 0.3)

    const spokeCount = sizeFromRadius(radius) === 'large' ? 6 : 4
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * Math.PI * 2) / spokeCount
      graphic.lineStyle(3, 0x5a4a32, 0.7)
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

    this.add.particles(0, -10, 'rainTexture', {
      x: { min: 0, max: width },
      y: -10,
      lifespan: { min: 400, max: 800 },
      speedY: { min: 400, max: 700 },
      speedX: { min: -100, max: -50 },
      quantity: 8,
      scale: { min: 0.5, max: 1 },
      alpha: { min: 0.3, max: 0.7 },
      blendMode: Phaser.BlendModes.ADD,
    })
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
      const delay = Phaser.Math.Between(5000, 15000)
      this.time.delayedCall(delay, () => {
        this.triggerLightning()
        scheduleNextLightning()
      })
    }
    scheduleNextLightning()
  }

  private triggerLightning() {
    if (!this.lightningFlash) return

    this.tweens.add({
      targets: this.lightningFlash,
      alpha: { from: 0, to: 0.4 },
      duration: 50,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(100, () => {
          this.tweens.add({
            targets: this.lightningFlash!,
            alpha: { from: 0, to: 0.25 },
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

  highlightAligned(gearId: number, aligned: boolean) {
    const container = this.gearSprites.get(gearId)
    const radius = this.gearRadii.get(gearId)
    if (!container || radius === undefined) return

    const targetHint = container.list[2] as Phaser.GameObjects.Graphics
    if (targetHint) {
      targetHint.clear()
      if (aligned) {
        targetHint.lineStyle(3, 0x7ec97e, 1)
        targetHint.strokeCircle(0, 0, radius + 15)
      }
    }
  }

  playVictoryAnimation() {
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

    const { width, height } = this.scale
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 50, () => {
        const x = Phaser.Math.Between(width * 0.2, width * 0.8)
        const y = Phaser.Math.Between(height * 0.2, height * 0.8)
        const spark = this.add.circle(x, y, 4, 0xc9a96a, 1)
        this.tweens.add({
          targets: spark,
          scale: { from: 1, to: 3 },
          alpha: { from: 1, to: 0 },
          duration: 500,
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
}

function sizeFromRadius(radius: number): 'large' | 'medium' | 'small' {
  if (radius > 70) return 'large'
  if (radius > 50) return 'medium'
  return 'small'
}
