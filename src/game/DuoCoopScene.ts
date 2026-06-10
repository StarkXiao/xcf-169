import Phaser from 'phaser'
import type { ClockTime, DuoCoopLevelConfig, DuoCoopPlayerState, DuoCoopInterferenceEvent } from '../types'

interface ClockVisual {
  hourHand: Phaser.GameObjects.Graphics
  minuteHand: Phaser.GameObjects.Graphics
  targetHour: Phaser.GameObjects.Graphics
  targetMinute: Phaser.GameObjects.Graphics
  hitArea: Phaser.GameObjects.Zone
  deviationText: Phaser.GameObjects.Text
  statusIndicator: Phaser.GameObjects.Graphics
  fogOverlay: Phaser.GameObjects.Graphics
  reboundEffect: Phaser.GameObjects.Graphics
  magnetEffect: Phaser.GameObjects.Graphics
  stutterEffect: Phaser.GameObjects.Graphics
}

interface InterferenceVisual {
  container: Phaser.GameObjects.Container
  icon: Phaser.GameObjects.Text
  label: Phaser.GameObjects.Text
  timer: Phaser.GameObjects.Graphics
}

export class DuoCoopScene extends Phaser.Scene {
  private masterClock: ClockVisual | null = null
  private slaveClock: ClockVisual | null = null
  private interferenceVisuals: Map<string, InterferenceVisual> = new Map()
  private syncLine: Phaser.GameObjects.Graphics | null = null
  private interactionsLocked = false
  private levelConfig: DuoCoopLevelConfig | null = null
  private scaleFactor = 1

  private masterCenterX = 0
  private masterCenterY = 0
  private masterRadius = 0
  private slaveCenterX = 0
  private slaveCenterY = 0
  private slaveRadius = 0

  private onMasterClick?: (direction: 1 | -1) => void
  private onSlaveClick?: (direction: 1 | -1) => void

  constructor() {
    super('DuoCoopScene')
  }

  setLevelConfig(config: DuoCoopLevelConfig): void {
    this.levelConfig = config
  }

  setCallbacks(
    onMasterClick: (direction: 1 | -1) => void,
    onSlaveClick: (direction: 1 | -1) => void,
  ) {
    this.onMasterClick = onMasterClick
    this.onSlaveClick = onSlaveClick
  }

  lockInteractions(): void {
    this.interactionsLocked = true
    if (this.masterClock?.hitArea?.input) this.masterClock.hitArea.disableInteractive()
    if (this.slaveClock?.hitArea?.input) this.slaveClock.hitArea.disableInteractive()
  }

  create() {
    const { width, height } = this.scale
    this.scaleFactor = Math.min(width / 1000, height / 700)

    this.masterCenterX = width * 0.3
    this.masterCenterY = height * 0.5
    this.masterRadius = Math.min(width * 0.22, height * 0.32)

    this.slaveCenterX = width * 0.7
    this.slaveCenterY = height * 0.5
    this.slaveRadius = Math.min(width * 0.22, height * 0.32)

    this.createBackground()
    this.createSyncLine()

    if (this.levelConfig) {
      this.createClockPanel('master', this.masterCenterX, this.masterCenterY, this.masterRadius)
      this.createClockPanel('slave', this.slaveCenterX, this.slaveCenterY, this.slaveRadius)
    }
  }

  private createBackground() {
    const { width, height } = this.scale

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x151528, 0x151528, 1)
    bg.fillRect(0, 0, width, height)

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const size = Phaser.Math.FloatBetween(0.5, 2.5)
      const alpha = Phaser.Math.FloatBetween(0.2, 0.7)
      this.add.circle(x, y, size, 0xe8d5a3, alpha)
    }

    const divider = this.add.graphics()
    divider.lineStyle(2, 0x3d3222, 0.4)
    divider.beginPath()
    divider.moveTo(width / 2, height * 0.08)
    divider.lineTo(width / 2, height * 0.92)
    divider.strokePath()

    const frame = this.add.graphics()
    frame.lineStyle(4, 0x3d3222, 0.5)
    frame.strokeRoundedRect(width * 0.03, height * 0.03, width * 0.94, height * 0.94, 24)
  }

  private createSyncLine() {
    this.syncLine = this.add.graphics()
    this.syncLine.setDepth(3)
  }

  updateSyncLine(_masterTime: ClockTime, _slaveTime: ClockTime, isSynced: boolean) {
    if (!this.syncLine) return

    this.syncLine.clear()

    const color = isSynced ? 0x7ec97e : 0x5a4a32
    const alpha = isSynced ? 0.7 : 0.3

    this.syncLine.lineStyle(isSynced ? 3 : 2, color, alpha)
    this.syncLine.beginPath()
    this.syncLine.moveTo(this.masterCenterX + this.masterRadius + 10, this.masterCenterY)
    this.syncLine.lineTo(this.slaveCenterX - this.slaveRadius - 10, this.slaveCenterY)
    this.syncLine.strokePath()

    if (isSynced) {
      const midX = (this.masterCenterX + this.slaveCenterX) / 2
      const midY = (this.masterCenterY + this.slaveCenterY) / 2
      this.syncLine.fillStyle(0x7ec97e, 0.8)
      this.syncLine.fillCircle(midX, midY, 6)

      this.tweens.add({
        targets: this.syncLine,
        alpha: { from: 1, to: 0.5 },
        duration: 800,
        yoyo: true,
        repeat: 2,
      })
    }
  }

  private createClockPanel(role: 'master' | 'slave', cx: number, cy: number, r: number) {
    const isMaster = role === 'master'
    const accentColor = isMaster ? 0xc9a96a : 0x8abbbb
    const labelColor = isMaster ? '#c9a96a' : '#8abbbb'
    const label = isMaster ? '主钟' : '副钟'
    const playerLabel = isMaster ? '玩家一' : '玩家二'

    const frame = this.add.graphics()
    frame.lineStyle(8, accentColor, 0.6)
    frame.strokeCircle(cx, cy, r + 5)
    frame.lineStyle(4, 0x3d3222, 0.5)
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
      mark.lineStyle(isMain ? 5 : 2, accentColor, 0.9)
      mark.beginPath()
      mark.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
      mark.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR)
      mark.strokePath()

      if (isMain) {
        const num = i === 0 ? 12 : i
        const numR = r - 55
        this.add.text(cx + Math.cos(angle) * numR, cy + Math.sin(angle) * numR, num.toString(), {
          fontFamily: 'Georgia, serif',
          fontSize: `${20 * this.scaleFactor}px`,
          color: labelColor,
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

    const hourHand = this.add.graphics()
    const minuteHand = this.add.graphics()
    hourHand.setDepth(10)
    minuteHand.setDepth(11)

    const center = this.add.graphics()
    center.fillStyle(accentColor, 1)
    center.fillCircle(cx, cy, 10)
    center.lineStyle(3, 0x8b7355, 1)
    center.strokeCircle(cx, cy, 10)
    center.setDepth(12)

    const targetHour = this.add.graphics()
    const targetMinute = this.add.graphics()
    targetHour.setDepth(5)
    targetMinute.setDepth(6)

    const title = this.add.text(cx, cy - r - 35, label, {
      fontFamily: 'Georgia, serif',
      fontSize: `${18 * this.scaleFactor}px`,
      color: labelColor,
      fontStyle: 'bold',
    }).setOrigin(0.5)
    title.setDepth(20)

    const playerTag = this.add.text(cx, cy - r - 18, playerLabel, {
      fontFamily: 'Georgia, serif',
      fontSize: `${12 * this.scaleFactor}px`,
      color: '#8b7d5c',
    }).setOrigin(0.5)
    playerTag.setDepth(20)

    const deviationText = this.add.text(cx, cy + r + 16, '', {
      fontFamily: 'Georgia, serif',
      fontSize: `${12 * this.scaleFactor}px`,
      color: '#ff8888',
      align: 'center',
    }).setOrigin(0.5)
    deviationText.setDepth(20)

    const statusIndicator = this.add.graphics()
    statusIndicator.fillStyle(0xff6b6b, 0.8)
    statusIndicator.fillCircle(cx, cy - r - 48, 7)
    statusIndicator.setDepth(20)

    const fogOverlay = this.add.graphics()
    fogOverlay.setDepth(15)
    fogOverlay.setVisible(false)

    const reboundEffect = this.add.graphics()
    reboundEffect.setDepth(14)
    reboundEffect.setVisible(false)

    const magnetEffect = this.add.graphics()
    magnetEffect.setDepth(14)
    magnetEffect.setVisible(false)

    const stutterEffect = this.add.graphics()
    stutterEffect.setDepth(14)
    stutterEffect.setVisible(false)

    const hitArea = this.add.zone(cx, cy, r * 2.2, r * 2.2)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.setDepth(15)
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.interactionsLocked) return
      const direction: 1 | -1 = pointer.x >= cx ? 1 : -1
      if (isMaster) {
        this.onMasterClick?.(direction)
      } else {
        this.onSlaveClick?.(direction)
      }
    })

    const clockVisual: ClockVisual = {
      hourHand,
      minuteHand,
      targetHour,
      targetMinute,
      hitArea,
      deviationText,
      statusIndicator,
      fogOverlay,
      reboundEffect,
      magnetEffect,
      stutterEffect,
    }

    if (isMaster) {
      this.masterClock = clockVisual
    } else {
      this.slaveClock = clockVisual
    }
  }

  updateClock(role: 'master' | 'slave', time: ClockTime, player: DuoCoopPlayerState) {
    const isMaster = role === 'master'
    const visual = isMaster ? this.masterClock : this.slaveClock
    const cx = isMaster ? this.masterCenterX : this.slaveCenterX
    const cy = isMaster ? this.masterCenterY : this.slaveCenterY
    const r = isMaster ? this.masterRadius : this.slaveRadius

    if (!visual) return

    this.drawClockHands(visual.hourHand, visual.minuteHand, time, cx, cy, r - 60, r - 30)
    this.drawTargetMarker(visual.targetHour, visual.targetMinute, player.targetTime, cx, cy, r - 65, r - 35, !player.fogActive)

    visual.deviationText.setText(`偏差: ${player.deviationMinutes}分`)
    visual.deviationText.setColor(player.isAligned ? '#7ec97e' : '#ff8888')

    visual.statusIndicator.clear()
    visual.statusIndicator.fillStyle(player.isAligned ? 0x7ec97e : 0xff6b6b, 0.9)
    visual.statusIndicator.fillCircle(cx, cy - r - 48, 7)

    this.updateFogOverlay(visual, cx, cy, r, player.fogActive)
    this.updateReboundEffect(visual, cx, cy, r, player.reboundCooldown > 0)
    this.updateMagnetEffect(visual, cx, cy, r, player.magnetPullDir !== 0)
    this.updateStutterEffect(visual, cx, cy, r, player.stutterActive)
  }

  private updateFogOverlay(visual: ClockVisual, cx: number, cy: number, r: number, active: boolean) {
    visual.fogOverlay.clear()
    visual.fogOverlay.setVisible(active)
    if (active) {
      visual.fogOverlay.fillStyle(0x0a0a14, 0.7)
      visual.fogOverlay.fillCircle(cx, cy, r - 15)
      visual.fogOverlay.lineStyle(2, 0x8b7d5c, 0.6)
      visual.fogOverlay.strokeCircle(cx, cy, r - 15)

      this.tweens.add({
        targets: visual.fogOverlay,
        alpha: { from: 0.6, to: 0.9 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  private updateReboundEffect(visual: ClockVisual, cx: number, cy: number, r: number, active: boolean) {
    visual.reboundEffect.clear()
    visual.reboundEffect.setVisible(active)
    if (active) {
      visual.reboundEffect.lineStyle(3, 0xaa88ff, 0.6)
      visual.reboundEffect.strokeCircle(cx, cy, r + 8)

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const x1 = cx + Math.cos(angle) * (r + 3)
        const y1 = cy + Math.sin(angle) * (r + 3)
        const x2 = cx + Math.cos(angle) * (r + 14)
        const y2 = cy + Math.sin(angle) * (r + 14)
        visual.reboundEffect.lineStyle(2, 0xaa88ff, 0.5)
        visual.reboundEffect.beginPath()
        visual.reboundEffect.moveTo(x1, y1)
        visual.reboundEffect.lineTo(x2, y2)
        visual.reboundEffect.strokePath()
      }
    }
  }

  private updateMagnetEffect(visual: ClockVisual, cx: number, cy: number, _r: number, active: boolean) {
    visual.magnetEffect.clear()
    visual.magnetEffect.setVisible(active)
    if (active) {
      const otherCx = visual === this.masterClock ? this.slaveCenterX : this.masterCenterX
      const otherCy = visual === this.masterClock ? this.slaveCenterY : this.masterCenterY

      visual.magnetEffect.lineStyle(2, 0xff6688, 0.5)
      for (let i = 0; i < 5; i++) {
        const startX = cx + (otherCx - cx) * (i / 5)
        const startY = cy + (otherCy - cy) * (i / 5)
        visual.magnetEffect.fillStyle(0xff6688, 0.4)
        visual.magnetEffect.fillCircle(startX, startY, 3)
      }
    }
  }

  private updateStutterEffect(visual: ClockVisual, cx: number, cy: number, r: number, active: boolean) {
    visual.stutterEffect.clear()
    visual.stutterEffect.setVisible(active)
    if (active) {
      visual.stutterEffect.lineStyle(2, 0xffaa44, 0.5)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + (Date.now() / 500)
        const x = cx + Math.cos(angle) * (r * 0.5)
        const y = cy + Math.sin(angle) * (r * 0.5)
        visual.stutterEffect.fillStyle(0xffaa44, 0.4)
        visual.stutterEffect.fillCircle(x, y, 4)
      }
    }
  }

  showInterference(interference: DuoCoopInterferenceEvent & { expiresAt: number }) {
    const { width, height } = this.scale
    const y = height * 0.08 + this.interferenceVisuals.size * 40
    const x = width / 2

    const container = this.add.container(x, y)
    container.setDepth(50)

    const icon = this.add.text(0, 0, interference.icon, {
      fontSize: `${16 * this.scaleFactor}px`,
    }).setOrigin(0.5)

    const label = this.add.text(0, 22, interference.displayName, {
      fontFamily: 'Georgia, serif',
      fontSize: `${11 * this.scaleFactor}px`,
      color: '#ffaa44',
      align: 'center',
      backgroundColor: 'rgba(10, 10, 18, 0.8)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5)

    const timer = this.add.graphics()
    timer.setDepth(51)

    container.add([icon, label, timer])

    this.interferenceVisuals.set(interference.id, { container, icon, label, timer })

    this.tweens.add({
      targets: container,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: Phaser.Math.Easing.Quadratic.Out,
    })
  }

  hideInterference(interferenceId: string) {
    const visual = this.interferenceVisuals.get(interferenceId)
    if (!visual) return

    this.tweens.add({
      targets: visual.container,
      alpha: 0,
      duration: 300,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        visual.container.destroy()
        this.interferenceVisuals.delete(interferenceId)
      },
    })
  }

  showSyncTargetAchieved(targetLabel: string) {
    const { width, height } = this.scale
    const text = this.add.text(width / 2, height * 0.15, `✓ ${targetLabel}`, {
      fontFamily: 'Georgia, serif',
      fontSize: `${18 * this.scaleFactor}px`,
      color: '#7ec97e',
      fontStyle: 'bold',
      backgroundColor: 'rgba(10, 10, 18, 0.85)',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(60)

    this.tweens.add({
      targets: text,
      y: height * 0.12,
      alpha: { from: 1, to: 0 },
      duration: 2500,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => text.destroy(),
    })
  }

  showDriftEffect(driftDelta: number) {
    const { width, height } = this.scale
    const dir = driftDelta > 0 ? '→' : '←'
    const text = this.add.text(width / 2, height * 0.88, `漂移 ${dir}`, {
      fontFamily: 'Georgia, serif',
      fontSize: `${12 * this.scaleFactor}px`,
      color: '#8b7d5c',
      backgroundColor: 'rgba(10, 10, 18, 0.7)',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5).setDepth(40)

    this.tweens.add({
      targets: text,
      alpha: { from: 0.8, to: 0 },
      duration: 1500,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => text.destroy(),
    })
  }

  private drawClockHands(
    hourHand: Phaser.GameObjects.Graphics,
    minuteHand: Phaser.GameObjects.Graphics,
    time: ClockTime,
    cx: number,
    cy: number,
    hourLength: number,
    minuteLength: number,
  ) {
    const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
    const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180

    hourHand.clear()
    hourHand.lineStyle(8, 0xc9a96a, 1)
    hourHand.beginPath()
    hourHand.moveTo(cx, cy)
    hourHand.lineTo(cx + Math.cos(hourAngle) * hourLength, cy + Math.sin(hourAngle) * hourLength)
    hourHand.strokePath()
    hourHand.lineStyle(3, 0xe8d5a3, 1)
    hourHand.beginPath()
    hourHand.moveTo(cx, cy)
    hourHand.lineTo(cx + Math.cos(hourAngle) * hourLength, cy + Math.sin(hourAngle) * hourLength)
    hourHand.strokePath()

    minuteHand.clear()
    minuteHand.lineStyle(5, 0xc9a96a, 1)
    minuteHand.beginPath()
    minuteHand.moveTo(cx, cy)
    minuteHand.lineTo(cx + Math.cos(minuteAngle) * minuteLength, cy + Math.sin(minuteAngle) * minuteLength)
    minuteHand.strokePath()
    minuteHand.lineStyle(2, 0xe8d5a3, 1)
    minuteHand.beginPath()
    minuteHand.moveTo(cx, cy)
    minuteHand.lineTo(cx + Math.cos(minuteAngle) * minuteLength, cy + Math.sin(minuteAngle) * minuteLength)
    minuteHand.strokePath()
  }

  private drawTargetMarker(
    hourMarker: Phaser.GameObjects.Graphics,
    minuteMarker: Phaser.GameObjects.Graphics,
    time: ClockTime,
    cx: number,
    cy: number,
    hourLength: number,
    minuteLength: number,
    visible: boolean,
  ) {
    const alpha = visible ? 0.45 : 0.08

    hourMarker.clear()
    if (visible || alpha > 0) {
      const hourAngle = ((time.hours % 12) * 30 + time.minutes * 0.5 - 90) * Math.PI / 180
      hourMarker.lineStyle(5, 0xc9a96a, alpha)
      hourMarker.beginPath()
      hourMarker.moveTo(cx, cy)
      hourMarker.lineTo(cx + Math.cos(hourAngle) * hourLength, cy + Math.sin(hourAngle) * hourLength)
      hourMarker.strokePath()
      hourMarker.lineStyle(2, 0xc9a96a, Math.min(1, alpha + 0.3))
      hourMarker.strokeCircle(
        cx + Math.cos(hourAngle) * hourLength,
        cy + Math.sin(hourAngle) * hourLength,
        5,
      )
    }

    minuteMarker.clear()
    if (visible || alpha > 0) {
      const minuteAngle = (time.minutes * 6 - 90) * Math.PI / 180
      minuteMarker.lineStyle(4, 0xc9a96a, alpha)
      minuteMarker.beginPath()
      minuteMarker.moveTo(cx, cy)
      minuteMarker.lineTo(
        cx + Math.cos(minuteAngle) * minuteLength,
        cy + Math.sin(minuteAngle) * minuteLength,
      )
      minuteMarker.strokePath()
    }
  }

  playVictoryAnimation() {
    this.cameras.main.flash(800, 200, 180, 100)

    const positions = [
      { x: this.masterCenterX, y: this.masterCenterY },
      { x: this.slaveCenterX, y: this.slaveCenterY },
    ]

    positions.forEach(({ x, y }) => {
      for (let i = 0; i < 36; i++) {
        this.time.delayedCall(i * 25, () => {
          const angle = (i / 36) * Math.PI * 2
          const dist = this.masterRadius * 0.85
          const px = x + Math.cos(angle) * dist
          const py = y + Math.sin(angle) * dist
          const spark = this.add.circle(px, py, 5, 0xffd700, 1)
          spark.setDepth(100)
          this.tweens.add({
            targets: spark,
            x: x,
            y: y,
            scale: { from: 1, to: 0 },
            alpha: { from: 1, to: 0 },
            duration: 700,
            ease: Phaser.Math.Easing.Quadratic.In,
            onComplete: () => spark.destroy(),
          })
        })
      }
    })

    const midX = (this.masterCenterX + this.slaveCenterX) / 2
    const midY = (this.masterCenterY + this.slaveCenterY) / 2
    for (let i = 0; i < 24; i++) {
      this.time.delayedCall(300 + i * 30, () => {
        const angle = (i / 24) * Math.PI * 2
        const dist = 40
        const spark = this.add.circle(
          midX + Math.cos(angle) * dist,
          midY + Math.sin(angle) * dist,
          4, 0x7ec97e, 1,
        )
        spark.setDepth(100)
        this.tweens.add({
          targets: spark,
          scale: { from: 1.5, to: 0 },
          alpha: { from: 1, to: 0 },
          duration: 600,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onComplete: () => spark.destroy(),
        })
      })
    }
  }

  playFailureAnimation() {
    this.cameras.main.shake(600, 0.008)
  }
}
