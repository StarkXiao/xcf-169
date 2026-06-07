import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  EditorLevelConfig,
  EditorGearConfig,
  EditorFaultEvent,
  EditorSoundConfig,
  ClockTime,
  GearFaultType,
  GameMode,
  EditorFaultTriggerCondition,
  EditorSoundEventType,
} from '../types'
import {
  FAULT_DESCRIPTIONS,
  NIGHT_PERIODS,
} from '../game/NightPatrolSystem'
import { GEAR_MATERIALS } from '../game/WorkshopSystem'

const GEAR_RADIUS: Record<'large' | 'medium' | 'small', number> = {
  large: 70,
  medium: 50,
  small: 35,
}

const GEAR_COLORS: Record<'large' | 'medium' | 'small', { base: string; border: string }> = {
  large: { base: '#5a4020', border: '#e87a4a' },
  medium: { base: '#304055', border: '#5aa0e8' },
  small: { base: '#2a4530', border: '#5ae87a' },
}

const DEFAULT_SOUND_CONFIGS: EditorSoundConfig[] = [
  { eventType: 'gearRotate', enabled: true, frequency: 180, waveform: 'square', duration: 0.15, volume: 0.15 },
  { eventType: 'gearSnap', enabled: true, frequency: 440, waveform: 'square', duration: 0.1, volume: 0.2 },
  { eventType: 'gearFault', enabled: true, frequency: 200, waveform: 'sawtooth', duration: 0.2, volume: 0.12 },
  { eventType: 'alignSuccess', enabled: true, volume: 0.2 },
  { eventType: 'bellChime', enabled: true, volume: 0.3 },
  { eventType: 'thunder', enabled: true, volume: 0.4 },
  { eventType: 'tick', enabled: true, frequency: 1000, waveform: 'sine', duration: 0.05, volume: 0.05 },
  { eventType: 'periodTransition', enabled: true, volume: 0.15 },
  { eventType: 'gameOverSuccess', enabled: true, volume: 0.25 },
  { eventType: 'gameOverFail', enabled: true, volume: 0.15 },
]

function createDefaultLevel(): EditorLevelConfig {
  const now = Date.now()
  return {
    id: `level_${now}`,
    name: 'custom_level',
    displayName: '自定义关卡',
    description: '在编辑器中创建的自定义钟楼关卡',
    gameMode: 'classic',
    duration: 120,
    gears: [
      { id: 1, x: 300, y: 250, size: 'large', connectedTo: [2, 3], initialAngle: 0, label: '主齿轮' },
      { id: 2, x: 180, y: 150, size: 'medium', connectedTo: [1], initialAngle: 0, label: '左上齿轮' },
      { id: 3, x: 420, y: 150, size: 'medium', connectedTo: [1, 4], initialAngle: 0, label: '右上齿轮' },
      { id: 4, x: 500, y: 300, size: 'small', connectedTo: [3], initialAngle: 0, label: '右侧齿轮' },
    ],
    initialClockTime: { hours: 12, minutes: 0 },
    targetClockTime: { hours: 3, minutes: 45 },
    toleranceMinutes: 5,
    scoreMultiplier: 1.0,
    patrolPeriods: [...NIGHT_PERIODS],
    faultEvents: [],
    soundConfigs: [...DEFAULT_SOUND_CONFIGS],
    sideTowers: [],
    mechanisms: [],
    requireAllAligned: false,
    createdAt: now,
    updatedAt: now,
  }
}

interface LevelEditorProps {
  onClose: () => void
}

type EditorTab = 'gears' | 'time' | 'faults' | 'sounds' | 'level'

function LevelEditor({ onClose }: LevelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [level, setLevel] = useState<EditorLevelConfig>(createDefaultLevel())
  const [activeTab, setActiveTab] = useState<EditorTab>('gears')
  const [selectedGearId, setSelectedGearId] = useState<number | null>(1)
  const [selectedFaultId, setSelectedFaultId] = useState<string | null>(null)
  const [selectedSoundType, setSelectedSoundType] = useState<EditorSoundEventType | null>('gearRotate')
  const [draggingGear, setDraggingGear] = useState<number | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }, [])

  const updateLevel = useCallback((updater: (prev: EditorLevelConfig) => EditorLevelConfig) => {
    setLevel((prev) => ({ ...updater(prev), updatedAt: Date.now() }))
  }, [])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const w = rect.width
    const h = rect.height

    ctx.fillStyle = '#0a0a12'
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = 'rgba(90, 74, 50, 0.15)'
    ctx.lineWidth = 1
    const gridSize = 40
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    level.gears.forEach((gear) => {
      gear.connectedTo.forEach((connId) => {
        const conn = level.gears.find((g) => g.id === connId)
        if (!conn || conn.id < gear.id) return
        ctx.strokeStyle = 'rgba(201, 169, 106, 0.35)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(gear.x, gear.y)
        ctx.lineTo(conn.x, conn.y)
        ctx.stroke()
        ctx.setLineDash([])
      })
    })

    level.gears.forEach((gear) => {
      const radius = GEAR_RADIUS[gear.size]
      const colors = GEAR_COLORS[gear.size]
      const isSelected = selectedGearId === gear.id
      const isConnecting = connectingFrom === gear.id

      ctx.save()
      ctx.translate(gear.x, gear.y)
      ctx.rotate((gear.initialAngle * Math.PI) / 180)

      if (isSelected) {
        ctx.shadowColor = '#ffd700'
        ctx.shadowBlur = 20
      } else if (isConnecting) {
        ctx.shadowColor = '#5ae87a'
        ctx.shadowBlur = 25
      }

      const teeth = gear.size === 'large' ? 16 : gear.size === 'medium' ? 12 : 8
      const toothHeight = radius * 0.15
      const innerR = radius - toothHeight

      ctx.beginPath()
      for (let i = 0; i < teeth * 2; i++) {
        const angle = (i * Math.PI) / teeth
        const r = i % 2 === 0 ? radius : innerR
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()

      const gradient = ctx.createRadialGradient(0, 0, innerR * 0.3, 0, 0, radius)
      gradient.addColorStop(0, colors.base)
      gradient.addColorStop(1, '#1a1520')
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.strokeStyle = isSelected ? '#ffd700' : isConnecting ? '#5ae87a' : colors.border
      ctx.lineWidth = isSelected || isConnecting ? 3 : 2
      ctx.stroke()

      ctx.shadowBlur = 0

      ctx.beginPath()
      ctx.arc(0, 0, innerR * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = '#0a0a12'
      ctx.fill()
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-innerR * 0.5, 0)
      ctx.lineTo(innerR * 0.5, 0)
      ctx.moveTo(0, -innerR * 0.5)
      ctx.lineTo(0, innerR * 0.5)
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.rotate((-gear.initialAngle * Math.PI) / 180)
      ctx.fillStyle = '#e8d5a3'
      ctx.font = 'bold 11px Georgia'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(gear.label || `齿轮${gear.id}`, 0, radius + 8)
      ctx.fillStyle = '#8b7d5c'
      ctx.font = '10px Georgia'
      ctx.fillText(`#${gear.id} · ${gear.size}`, 0, radius + 22)

      ctx.restore()
    })
  }, [level, selectedGearId, connectingFrom])

  useEffect(() => {
    drawCanvas()
    const handleResize = () => drawCanvas()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawCanvas])

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const findGearAt = useCallback(
    (x: number, y: number): EditorGearConfig | null => {
      for (let i = level.gears.length - 1; i >= 0; i--) {
        const g = level.gears[i]
        const dx = x - g.x
        const dy = y - g.y
        if (dx * dx + dy * dy <= GEAR_RADIUS[g.size] * GEAR_RADIUS[g.size]) {
          return g
        }
      }
      return null
    },
    [level.gears],
  )

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasCoords(e)
      const gear = findGearAt(x, y)

      if (e.shiftKey && gear) {
        if (connectingFrom === null) {
          setConnectingFrom(gear.id)
          showToast(`选择第二个齿轮完成连接 (按住 Shift 点击)`)
        } else if (connectingFrom !== gear.id) {
          updateLevel((prev) => {
            const newGears = prev.gears.map((g) => {
              if (g.id === connectingFrom && !g.connectedTo.includes(gear.id)) {
                return { ...g, connectedTo: [...g.connectedTo, gear.id] }
              }
              if (g.id === gear.id && !g.connectedTo.includes(connectingFrom)) {
                return { ...g, connectedTo: [...g.connectedTo, connectingFrom] }
              }
              return g
            })
            return { ...prev, gears: newGears }
          })
          showToast(`已连接齿轮 #${connectingFrom} 和 #${gear.id}`)
          setConnectingFrom(null)
        }
        return
      }

      if (gear) {
        setSelectedGearId(gear.id)
        setDraggingGear(gear.id)
      } else {
        setSelectedGearId(null)
        setConnectingFrom(null)
      }
    },
    [findGearAt, getCanvasCoords, connectingFrom, updateLevel, showToast],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingGear === null) return
      const { x, y } = getCanvasCoords(e)
      updateLevel((prev) => ({
        ...prev,
        gears: prev.gears.map((g) => (g.id === draggingGear ? { ...g, x, y } : g)),
      }))
    },
    [draggingGear, getCanvasCoords, updateLevel],
  )

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingGear(null)
  }, [])

  const addGear = useCallback(
    (size: 'large' | 'medium' | 'small') => {
      updateLevel((prev) => {
        const maxId = prev.gears.reduce((m, g) => Math.max(m, g.id), 0)
        const newGear: EditorGearConfig = {
          id: maxId + 1,
          x: 100 + Math.random() * 400,
          y: 100 + Math.random() * 300,
          size,
          connectedTo: [],
          initialAngle: 0,
          label: `新${size === 'large' ? '大' : size === 'medium' ? '中' : '小'}齿轮`,
        }
        return { ...prev, gears: [...prev.gears, newGear] }
      })
      showToast('已添加新齿轮')
    },
    [updateLevel, showToast],
  )

  const removeGear = useCallback(
    (gearId: number) => {
      updateLevel((prev) => ({
        ...prev,
        gears: prev.gears
          .filter((g) => g.id !== gearId)
          .map((g) => ({ ...g, connectedTo: g.connectedTo.filter((id) => id !== gearId) })),
      }))
      if (selectedGearId === gearId) setSelectedGearId(null)
      showToast('已删除齿轮')
    },
    [updateLevel, selectedGearId, showToast],
  )

  const updateGear = useCallback(
    (gearId: number, updates: Partial<EditorGearConfig>) => {
      updateLevel((prev) => ({
        ...prev,
        gears: prev.gears.map((g) => (g.id === gearId ? { ...g, ...updates } : g)),
      }))
    },
    [updateLevel],
  )

  const toggleConnection = useCallback(
    (gearId: number, otherId: number) => {
      updateLevel((prev) => ({
        ...prev,
        gears: prev.gears.map((g) => {
          if (g.id === gearId) {
            return {
              ...g,
              connectedTo: g.connectedTo.includes(otherId)
                ? g.connectedTo.filter((id) => id !== otherId)
                : [...g.connectedTo, otherId],
            }
          }
          if (g.id === otherId) {
            return {
              ...g,
              connectedTo: g.connectedTo.includes(gearId)
                ? g.connectedTo.filter((id) => id !== gearId)
                : [...g.connectedTo, gearId],
            }
          }
          return g
        }),
      }))
    },
    [updateLevel],
  )

  const addFaultEvent = useCallback(() => {
    const id = `fault_${Date.now()}`
    const newFault: EditorFaultEvent = {
      id,
      name: `fault_${level.faultEvents.length + 1}`,
      displayName: `故障事件 ${level.faultEvents.length + 1}`,
      faultType: 'slip',
      triggerCondition: 'timeElapsed',
      triggerValue: 30,
      targetGearIds: level.gears.slice(0, 1).map((g) => g.id),
      durationSeconds: 15,
      enabled: true,
    }
    updateLevel((prev) => ({ ...prev, faultEvents: [...prev.faultEvents, newFault] }))
    setSelectedFaultId(id)
    showToast('已添加故障事件')
  }, [level.faultEvents.length, level.gears, updateLevel, showToast])

  const updateFault = useCallback(
    (faultId: string, updates: Partial<EditorFaultEvent>) => {
      updateLevel((prev) => ({
        ...prev,
        faultEvents: prev.faultEvents.map((f) => (f.id === faultId ? { ...f, ...updates } : f)),
      }))
    },
    [updateLevel],
  )

  const removeFault = useCallback(
    (faultId: string) => {
      updateLevel((prev) => ({ ...prev, faultEvents: prev.faultEvents.filter((f) => f.id !== faultId) }))
      if (selectedFaultId === faultId) setSelectedFaultId(null)
      showToast('已删除故障事件')
    },
    [updateLevel, selectedFaultId, showToast],
  )

  const updateSound = useCallback(
    (eventType: EditorSoundEventType, updates: Partial<EditorSoundConfig>) => {
      updateLevel((prev) => ({
        ...prev,
        soundConfigs: prev.soundConfigs.map((s) =>
          s.eventType === eventType ? { ...s, ...updates } : s,
        ),
      }))
    },
    [updateLevel],
  )

  const exportLevel = useCallback(() => {
    const json = JSON.stringify(level, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${level.name || 'clocktower_level'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('关卡数据已导出')
  }, [level, showToast])

  const importLevel = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string) as EditorLevelConfig
          setLevel({ ...parsed, updatedAt: Date.now() })
          showToast(`已导入关卡: ${parsed.displayName || parsed.name}`)
        } catch {
          showToast('导入失败：无效的 JSON 文件')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [showToast],
  )

  const resetLevel = useCallback(() => {
    if (confirm('确定要重置关卡为默认配置吗？')) {
      setLevel(createDefaultLevel())
      setSelectedGearId(1)
      setSelectedFaultId(null)
      showToast('关卡已重置')
    }
  }, [showToast])

  const selectedGear = level.gears.find((g) => g.id === selectedGearId) || null
  const selectedFault = level.faultEvents.find((f) => f.id === selectedFaultId) || null
  const selectedSound =
    level.soundConfigs.find((s) => s.eventType === selectedSoundType) || null

  const formatClockTime = (t: ClockTime) =>
    `${t.hours}:${t.minutes.toString().padStart(2, '0')}`

  return (
    <div className="editor-panel">
      <div className="editor-header">
        <div>
          <h1 className="editor-title">🔧 钟楼故障编辑器</h1>
          <p className="editor-subtitle">{level.displayName} · {formatClockTime(level.initialClockTime)} → {formatClockTime(level.targetClockTime)}</p>
        </div>
        <div className="editor-header-actions">
          <button className="editor-btn secondary" onClick={() => fileInputRef.current?.click()}>
            📂 导入
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importLevel} />
          <button className="editor-btn secondary" onClick={resetLevel}>
            🔄 重置
          </button>
          <button className="editor-btn primary" onClick={exportLevel}>
            💾 导出关卡
          </button>
          <button className="editor-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="editor-body">
        <div className="editor-canvas-area">
          <div className="canvas-toolbar">
            <span className="toolbar-label">添加齿轮：</span>
            <button className="toolbar-btn" onClick={() => addGear('large')}>🟠 大齿轮</button>
            <button className="toolbar-btn" onClick={() => addGear('medium')}>🔵 中齿轮</button>
            <button className="toolbar-btn" onClick={() => addGear('small')}>🟢 小齿轮</button>
            <span className="toolbar-divider" />
            <span className="toolbar-hint">💡 拖拽移动 · Shift+点击两个齿轮建立连接</span>
            {connectingFrom !== null && (
              <span className="toolbar-connecting">🔗 正在从齿轮 #{connectingFrom} 连接...</span>
            )}
          </div>
          <canvas
            ref={canvasRef}
            className="editor-canvas"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <div className="canvas-footer">
            <span>共 {level.gears.length} 个齿轮 · {level.faultEvents.length} 个故障事件</span>
            <label className="preview-toggle">
              <input type="checkbox" checked={showPreview} onChange={(e) => setShowPreview(e.target.checked)} />
              <span>显示预览</span>
            </label>
          </div>
        </div>

        <div className="editor-sidebar">
          <div className="editor-tabs">
            <button className={activeTab === 'gears' ? 'tab active' : 'tab'} onClick={() => setActiveTab('gears')}>⚙️ 齿轮</button>
            <button className={activeTab === 'time' ? 'tab active' : 'tab'} onClick={() => setActiveTab('time')}>🕐 时间</button>
            <button className={activeTab === 'faults' ? 'tab active' : 'tab'} onClick={() => setActiveTab('faults')}>⚠️ 故障</button>
            <button className={activeTab === 'sounds' ? 'tab active' : 'tab'} onClick={() => setActiveTab('sounds')}>🔊 音效</button>
            <button className={activeTab === 'level' ? 'tab active' : 'tab'} onClick={() => setActiveTab('level')}>📋 关卡</button>
          </div>

          <div className="editor-tab-content">
            {activeTab === 'gears' && (
              <div className="tab-panel">
                <div className="panel-section">
                  <div className="section-header">
                    <h3>齿轮列表</h3>
                    <span className="section-count">{level.gears.length}</span>
                  </div>
                  <div className="gear-list">
                    {level.gears.map((g) => (
                      <div
                        key={g.id}
                        className={`gear-list-item ${selectedGearId === g.id ? 'selected' : ''}`}
                        onClick={() => setSelectedGearId(g.id)}
                      >
                        <span className={`gear-dot size-${g.size}`} />
                        <span className="gear-list-name">{g.label || `齿轮${g.id}`}</span>
                        <span className="gear-list-id">#{g.id}</span>
                        <button
                          className="gear-delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeGear(g.id)
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedGear && (
                  <div className="panel-section">
                    <div className="section-header">
                      <h3>齿轮 #{selectedGear.id} 属性</h3>
                    </div>
                    <div className="form-group">
                      <label>名称标签</label>
                      <input
                        type="text"
                        value={selectedGear.label || ''}
                        onChange={(e) => updateGear(selectedGear.id, { label: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>尺寸</label>
                        <select
                          value={selectedGear.size}
                          onChange={(e) =>
                            updateGear(selectedGear.id, {
                              size: e.target.value as 'large' | 'medium' | 'small',
                            })
                          }
                        >
                          <option value="large">大 (±60分钟)</option>
                          <option value="medium">中 (±15分钟)</option>
                          <option value="small">小 (±5分钟)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>初始角度</label>
                        <input
                          type="number"
                          min={0}
                          max={360}
                          value={selectedGear.initialAngle}
                          onChange={(e) =>
                            updateGear(selectedGear.id, { initialAngle: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>X 坐标</label>
                        <input
                          type="number"
                          value={Math.round(selectedGear.x)}
                          onChange={(e) =>
                            updateGear(selectedGear.id, { x: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Y 坐标</label>
                        <input
                          type="number"
                          value={Math.round(selectedGear.y)}
                          onChange={(e) =>
                            updateGear(selectedGear.id, { y: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>联动齿轮</label>
                      <div className="connections-list">
                        {level.gears
                          .filter((g) => g.id !== selectedGear.id)
                          .map((g) => (
                            <label key={g.id} className="connection-item">
                              <input
                                type="checkbox"
                                checked={selectedGear.connectedTo.includes(g.id)}
                                onChange={() => toggleConnection(selectedGear.id, g.id)}
                              />
                              <span className={`conn-dot size-${g.size}`} />
                              <span>{g.label || `齿轮${g.id}`}</span>
                              <span className="conn-id">#{g.id}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'time' && (
              <div className="tab-panel">
                <div className="panel-section">
                  <div className="section-header">
                    <h3>时间目标配置</h3>
                  </div>
                  <div className="form-group">
                    <label>关卡时长（秒）</label>
                    <input
                      type="number"
                      min={10}
                      max={3600}
                      value={level.duration}
                      onChange={(e) => updateLevel((p) => ({ ...p, duration: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>容差（分钟）</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={level.toleranceMinutes}
                      onChange={(e) =>
                        updateLevel((p) => ({ ...p, toleranceMinutes: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>分数倍率</label>
                    <input
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={level.scoreMultiplier}
                      onChange={(e) =>
                        updateLevel((p) => ({ ...p, scoreMultiplier: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="panel-section">
                  <div className="section-header">
                    <h3>初始时刻</h3>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>小时</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={level.initialClockTime.hours}
                        onChange={(e) =>
                          updateLevel((p) => ({
                            ...p,
                            initialClockTime: { ...p.initialClockTime, hours: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>分钟</label>
                      <input
                        type="number"
                        min={0}
                        max={55}
                        step={5}
                        value={level.initialClockTime.minutes}
                        onChange={(e) =>
                          updateLevel((p) => ({
                            ...p,
                            initialClockTime: { ...p.initialClockTime, minutes: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="time-preview">当前: {formatClockTime(level.initialClockTime)}</div>
                </div>
                <div className="panel-section">
                  <div className="section-header">
                    <h3>目标时刻</h3>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>小时</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={level.targetClockTime.hours}
                        onChange={(e) =>
                          updateLevel((p) => ({
                            ...p,
                            targetClockTime: { ...p.targetClockTime, hours: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>分钟</label>
                      <input
                        type="number"
                        min={0}
                        max={55}
                        step={5}
                        value={level.targetClockTime.minutes}
                        onChange={(e) =>
                          updateLevel((p) => ({
                            ...p,
                            targetClockTime: { ...p.targetClockTime, minutes: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="time-preview target">目标: {formatClockTime(level.targetClockTime)}</div>
                </div>
              </div>
            )}

            {activeTab === 'faults' && (
              <div className="tab-panel">
                <div className="panel-section">
                  <div className="section-header">
                    <h3>故障事件列表</h3>
                    <button className="add-btn" onClick={addFaultEvent}>+ 添加</button>
                  </div>
                  <div className="fault-list">
                    {level.faultEvents.length === 0 && (
                      <div className="empty-hint">暂无故障事件，点击上方添加按钮创建</div>
                    )}
                    {level.faultEvents.map((f) => (
                      <div
                        key={f.id}
                        className={`fault-list-item ${selectedFaultId === f.id ? 'selected' : ''} ${!f.enabled ? 'disabled' : ''}`}
                        onClick={() => setSelectedFaultId(f.id)}
                      >
                        <span className={`fault-type-badge fault-${f.faultType}`}>
                          {FAULT_DESCRIPTIONS[f.faultType]}
                        </span>
                        <span className="fault-name">{f.displayName}</span>
                        <button
                          className="gear-delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFault(f.id)
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedFault && (
                  <div className="panel-section">
                    <div className="section-header">
                      <h3>故障配置</h3>
                      <label className="enable-toggle">
                        <input
                          type="checkbox"
                          checked={selectedFault.enabled}
                          onChange={(e) => updateFault(selectedFault.id, { enabled: e.target.checked })}
                        />
                        <span>启用</span>
                      </label>
                    </div>
                    <div className="form-group">
                      <label>显示名称</label>
                      <input
                        type="text"
                        value={selectedFault.displayName}
                        onChange={(e) => updateFault(selectedFault.id, { displayName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>故障类型</label>
                      <select
                        value={selectedFault.faultType}
                        onChange={(e) =>
                          updateFault(selectedFault.id, {
                            faultType: e.target.value as GearFaultType,
                          })
                        }
                      >
                        <option value="jam">卡滞 (齿轮无法转动)</option>
                        <option value="slip">打滑 (效率减半)</option>
                        <option value="reverse">反转 (方向相反)</option>
                        <option value="freeze">冻结 (齿轮无法转动)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>触发条件</label>
                      <select
                        value={selectedFault.triggerCondition}
                        onChange={(e) =>
                          updateFault(selectedFault.id, {
                            triggerCondition: e.target.value as EditorFaultTriggerCondition,
                          })
                        }
                      >
                        <option value="timeElapsed">经过指定时间（秒）</option>
                        <option value="rotationsCount">齿轮转动次数</option>
                        <option value="deviationExceeded">偏差超过（分钟）</option>
                        <option value="randomInterval">随机间隔（秒）</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>触发值</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedFault.triggerValue}
                        onChange={(e) =>
                          updateFault(selectedFault.id, { triggerValue: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>持续时间（秒）</label>
                      <input
                        type="number"
                        min={1}
                        value={selectedFault.durationSeconds}
                        onChange={(e) =>
                          updateFault(selectedFault.id, { durationSeconds: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>目标齿轮</label>
                      <div className="connections-list">
                        {level.gears.map((g) => (
                          <label key={g.id} className="connection-item">
                            <input
                              type="checkbox"
                              checked={selectedFault.targetGearIds.includes(g.id)}
                              onChange={() => {
                                const has = selectedFault.targetGearIds.includes(g.id)
                                updateFault(selectedFault.id, {
                                  targetGearIds: has
                                    ? selectedFault.targetGearIds.filter((id) => id !== g.id)
                                    : [...selectedFault.targetGearIds, g.id],
                                })
                              }}
                            />
                            <span className={`conn-dot size-${g.size}`} />
                            <span>{g.label || `齿轮${g.id}`}</span>
                            <span className="conn-id">#{g.id}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sounds' && (
              <div className="tab-panel">
                <div className="panel-section">
                  <div className="section-header">
                    <h3>音效事件脚本</h3>
                  </div>
                  <div className="sound-list">
                    {level.soundConfigs.map((s) => (
                      <div
                        key={s.eventType}
                        className={`sound-list-item ${selectedSoundType === s.eventType ? 'selected' : ''} ${!s.enabled ? 'disabled' : ''}`}
                        onClick={() => setSelectedSoundType(s.eventType)}
                      >
                        <label className="sound-toggle" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => updateSound(s.eventType, { enabled: e.target.checked })}
                          />
                        </label>
                        <span className="sound-icon">🔊</span>
                        <span className="sound-name">{s.eventType}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedSound && (
                  <div className="panel-section">
                    <div className="section-header">
                      <h3>{selectedSound.eventType} 配置</h3>
                    </div>
                    <div className="form-group">
                      <label>自定义标签</label>
                      <input
                        type="text"
                        value={selectedSound.customLabel || ''}
                        placeholder="可选"
                        onChange={(e) =>
                          updateSound(selectedSound.eventType, { customLabel: e.target.value })
                        }
                      />
                    </div>
                    {selectedSound.frequency !== undefined && (
                      <div className="form-group">
                        <label>频率 (Hz)</label>
                        <input
                          type="number"
                          min={20}
                          max={20000}
                          value={selectedSound.frequency}
                          onChange={(e) =>
                            updateSound(selectedSound.eventType, { frequency: Number(e.target.value) })
                          }
                        />
                      </div>
                    )}
                    {selectedSound.waveform !== undefined && (
                      <div className="form-group">
                        <label>波形</label>
                        <select
                          value={selectedSound.waveform}
                          onChange={(e) =>
                            updateSound(selectedSound.eventType, {
                              waveform: e.target.value as OscillatorType,
                            })
                          }
                        >
                          <option value="sine">正弦波 (Sine)</option>
                          <option value="square">方波 (Square)</option>
                          <option value="sawtooth">锯齿波 (Sawtooth)</option>
                          <option value="triangle">三角波 (Triangle)</option>
                        </select>
                      </div>
                    )}
                    {selectedSound.duration !== undefined && (
                      <div className="form-group">
                        <label>持续时长（秒）</label>
                        <input
                          type="number"
                          min={0.01}
                          max={5}
                          step={0.01}
                          value={selectedSound.duration}
                          onChange={(e) =>
                            updateSound(selectedSound.eventType, { duration: Number(e.target.value) })
                          }
                        />
                      </div>
                    )}
                    {selectedSound.volume !== undefined && (
                      <div className="form-group">
                        <label>音量 ({Math.round((selectedSound.volume || 0) * 100)}%)</label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={selectedSound.volume}
                          onChange={(e) =>
                            updateSound(selectedSound.eventType, { volume: Number(e.target.value) })
                          }
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label>材质预设</label>
                      <div className="material-presets">
                        {GEAR_MATERIALS.slice(0, 3).map((m) => (
                          <button
                            key={m.id}
                            className="preset-btn"
                            style={{ borderColor: m.visual.glowColor }}
                            onClick={() =>
                              updateSound(selectedSound.eventType, {
                                frequency: m.audio.rotateFreq,
                                waveform: m.audio.waveform,
                              })
                            }
                          >
                            {m.displayName}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'level' && (
              <div className="tab-panel">
                <div className="panel-section">
                  <div className="section-header">
                    <h3>关卡基础信息</h3>
                  </div>
                  <div className="form-group">
                    <label>关卡 ID</label>
                    <input
                      type="text"
                      value={level.id}
                      onChange={(e) => updateLevel((p) => ({ ...p, id: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>名称 (英文标识)</label>
                    <input
                      type="text"
                      value={level.name}
                      onChange={(e) => updateLevel((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>显示名称</label>
                    <input
                      type="text"
                      value={level.displayName}
                      onChange={(e) => updateLevel((p) => ({ ...p, displayName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>描述</label>
                    <textarea
                      rows={3}
                      value={level.description}
                      onChange={(e) => updateLevel((p) => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>游戏模式</label>
                    <select
                      value={level.gameMode}
                      onChange={(e) =>
                        updateLevel((p) => ({ ...p, gameMode: e.target.value as GameMode }))
                      }
                    >
                      <option value="classic">经典校时</option>
                      <option value="patrol">钟楼巡夜</option>
                      <option value="multiclock">多钟面连锁</option>
                    </select>
                  </div>
                </div>
                <div className="panel-section">
                  <div className="section-header">
                    <h3>数据摘要</h3>
                  </div>
                  <div className="summary-list">
                    <div className="summary-row">
                      <span className="summary-label">齿轮数量</span>
                      <span className="summary-value">{level.gears.length}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">联动连接</span>
                      <span className="summary-value">
                        {level.gears.reduce((s, g) => s + g.connectedTo.length, 0) / 2}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">故障事件</span>
                      <span className="summary-value">{level.faultEvents.filter((f) => f.enabled).length}/{level.faultEvents.length}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">启用音效</span>
                      <span className="summary-value">{level.soundConfigs.filter((s) => s.enabled).length}/{level.soundConfigs.length}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">关卡时长</span>
                      <span className="summary-value">{level.duration}秒</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">容差范围</span>
                      <span className="summary-value">±{level.toleranceMinutes}分钟</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">分数倍率</span>
                      <span className="summary-value">×{level.scoreMultiplier}</span>
                    </div>
                  </div>
                </div>
                <div className="panel-section">
                  <div className="section-header">
                    <h3>JSON 预览</h3>
                  </div>
                  <pre className="json-preview">
{JSON.stringify(
  {
    id: level.id,
    name: level.name,
    gears: level.gears.length,
    duration: level.duration,
    targetTime: level.targetClockTime,
  },
  null,
  2,
)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div className="editor-toast">{toast}</div>}

      {showPreview && (
        <div className="editor-preview">
          <div className="preview-header">
            <span>🎮 关卡预览</span>
            <button onClick={() => setShowPreview(false)}>✕</button>
          </div>
          <div className="preview-content">
            <div className="preview-clock">
              <div className="preview-time">
                <span className="preview-label">初始</span>
                <span className="preview-value">{formatClockTime(level.initialClockTime)}</span>
              </div>
              <span className="preview-arrow">→</span>
              <div className="preview-time">
                <span className="preview-label">目标</span>
                <span className="preview-value target">{formatClockTime(level.targetClockTime)}</span>
              </div>
            </div>
            <div className="preview-info">
              <span>时长: {level.duration}s</span>
              <span>容差: ±{level.toleranceMinutes}min</span>
              <span>倍率: ×{level.scoreMultiplier}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LevelEditor
