import { useState, useEffect, useCallback } from 'react'
import type { MuseumPuzzleConfig, MuseumPuzzleProgress } from '../../types/museum'
import { museumNarrativeSystem } from '../../game/museum/MuseumNarrativeSystem'

interface MuseumPuzzlePanelProps {
  puzzle: MuseumPuzzleConfig
  progress: MuseumPuzzleProgress
  onStateChange: () => void
}

const BELL_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']
const SYMBOLS = ['☀️', '🌙', '⭐', '☄️', '🌊', '🔥', '🌿', '⚡']

function renderClockFace(hours: number, minutes: number) {
  const hourAngle = (hours % 12) * 30 + minutes * 0.5
  const minuteAngle = minutes * 6
  return (
    <svg viewBox="0 0 200 200" className="puzzle-clock">
      <circle cx="100" cy="100" r="95" fill="#1a1a2e" stroke="#c9a96a" strokeWidth="3" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i + 1) * 30 - 90
        const x1 = 100 + 75 * Math.cos((angle * Math.PI) / 180)
        const y1 = 100 + 75 * Math.sin((angle * Math.PI) / 180)
        const x2 = 100 + 85 * Math.cos((angle * Math.PI) / 180)
        const y2 = 100 + 85 * Math.sin((angle * Math.PI) / 180)
        const numX = 100 + 62 * Math.cos((angle * Math.PI) / 180)
        const numY = 100 + 62 * Math.sin((angle * Math.PI) / 180)
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9a96a" strokeWidth="2" />
            <text x={numX} y={numY + 5} textAnchor="middle" fill="#c9a96a" fontSize="14" fontFamily="serif">
              {i + 1}
            </text>
          </g>
        )
      })}
      {Array.from({ length: 60 }).map((_, i) => {
        if (i % 5 === 0) return null
        const angle = i * 6 - 90
        const x1 = 100 + 82 * Math.cos((angle * Math.PI) / 180)
        const y1 = 100 + 82 * Math.sin((angle * Math.PI) / 180)
        const x2 = 100 + 85 * Math.cos((angle * Math.PI) / 180)
        const y2 = 100 + 85 * Math.sin((angle * Math.PI) / 180)
        return <line key={`m${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6a5a3a" strokeWidth="1" />
      })}
      <line
        x1="100" y1="100"
        x2={100 + 45 * Math.sin((hourAngle * Math.PI) / 180)}
        y2={100 - 45 * Math.cos((hourAngle * Math.PI) / 180)}
        stroke="#e8a87c" strokeWidth="6" strokeLinecap="round"
      />
      <line
        x1="100" y1="100"
        x2={100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)}
        y2={100 - 70 * Math.cos((minuteAngle * Math.PI) / 180)}
        stroke="#f8b195" strokeWidth="4" strokeLinecap="round"
      />
      <circle cx="100" cy="100" r="8" fill="#c9a96a" />
    </svg>
  )
}

function ClockCalibrationPuzzle({ puzzle, progress, onStateChange }: MuseumPuzzlePanelProps) {
  const time = progress.currentTime ?? { hours: 12, minutes: 0 }
  const tolerance = puzzle.toleranceMinutes ?? 3
  const target = puzzle.targetTime
  const diff = target
    ? (() => {
        const a = time.hours * 60 + time.minutes
        const b = target.hours * 60 + target.minutes
        const d = Math.abs(((a - b + 1080) % 720) - 360)
        return Math.min(d, 720 - d)
      })()
    : null

  const diffColor = diff === null ? '#c9a96a' : diff <= tolerance ? '#58d68d' : diff <= tolerance * 3 ? '#f5b041' : '#e74c3c'

  return (
    <div className="puzzle-clock-container">
      <div className="puzzle-info">
        <h3>⏰ {puzzle.name}</h3>
        <p className="puzzle-desc">{puzzle.description}</p>
        {target && (
          <p className="puzzle-target" style={{ color: '#f5b041' }}>
            🎯 目标时刻：{target.hours}:{String(target.minutes).padStart(2, '0')}
          </p>
        )}
        {diff !== null && (
          <p style={{ color: diffColor, marginTop: '0.5rem' }}>
            📏 偏差：{diff} 分钟 {diff <= tolerance && '✓ 完美！'}
          </p>
        )}
      </div>

      <div className="puzzle-clock-wrapper">
        {renderClockFace(time.hours, time.minutes)}
        <div className="puzzle-time-display">
          {time.hours}:{String(time.minutes).padStart(2, '0')}
        </div>
      </div>

      <div className="puzzle-controls">
        <div className="puzzle-control-group">
          <span className="control-label">时针</span>
          <div className="control-buttons">
            <button
              className="puzzle-btn"
              onClick={() => { museumNarrativeSystem.advanceClockHours(-1); onStateChange() }}
            >◀ -1h</button>
            <button
              className="puzzle-btn"
              onClick={() => { museumNarrativeSystem.advanceClockHours(1); onStateChange() }}
            >+1h ▶</button>
          </div>
        </div>
        <div className="puzzle-control-group">
          <span className="control-label">分针（粗调）</span>
          <div className="control-buttons">
            <button
              className="puzzle-btn"
              onClick={() => { museumNarrativeSystem.advanceClockMinutes(-15); onStateChange() }}
            >◀ -15m</button>
            <button
              className="puzzle-btn"
              onClick={() => { museumNarrativeSystem.advanceClockMinutes(15); onStateChange() }}
            >+15m ▶</button>
          </div>
        </div>
        <div className="puzzle-control-group">
          <span className="control-label">分针（微调）</span>
          <div className="control-buttons">
            <button
              className="puzzle-btn puzzle-btn-fine"
              onClick={() => { museumNarrativeSystem.advanceClockMinutes(-5); onStateChange() }}
            >◀ -5m</button>
            <button
              className="puzzle-btn puzzle-btn-fine"
              onClick={() => { museumNarrativeSystem.advanceClockMinutes(-1); onStateChange() }}
            >◀ -1m</button>
            <button
              className="puzzle-btn puzzle-btn-fine"
              onClick={() => { museumNarrativeSystem.advanceClockMinutes(1); onStateChange() }}
            >+1m ▶</button>
            <button
              className="puzzle-btn puzzle-btn-fine"
              onClick={() => { museumNarrativeSystem.advanceClockMinutes(5); onStateChange() }}
            >+5m ▶</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GearSequencePuzzle({ puzzle, progress, onStateChange }: MuseumPuzzlePanelProps) {
  const angles = progress.gearAngles ?? [0, 0, 0]
  const targets = puzzle.gearSequence ?? [0, 0, 0]
  const gearColors = ['#e74c3c', '#3498db', '#2ecc71']
  const gearLabels = ['大', '中', '小']

  return (
    <div className="puzzle-gear-container">
      <div className="puzzle-info">
        <h3>⚙️ {puzzle.name}</h3>
        <p className="puzzle-desc">{puzzle.description}</p>
        <p className="puzzle-target" style={{ color: '#f5b041' }}>
          🎯 目标角度：{targets.map(t => `${t}°`).join(' · ')}
        </p>
        <p style={{ marginTop: '0.5rem', color: '#a09070', fontSize: '0.9em' }}>
          💡 提示：中间齿轮转动时会带动两边反向转动
        </p>
      </div>

      <div className="puzzle-gears">
        {angles.map((angle, idx) => {
          const normalized = ((angle % 360) + 360) % 360
          const target = ((targets[idx] % 360) + 360) % 360
          const diff = Math.min(Math.abs(normalized - target), 360 - Math.abs(normalized - target))
          const aligned = diff <= 15

          return (
            <div key={idx} className="gear-unit">
              <div className={`gear-angle-display ${aligned ? 'aligned' : ''}`}>
                {Math.round(normalized)}°
                {aligned && ' ✓'}
              </div>
              <svg
                viewBox="0 0 100 100"
                className={`puzzle-gear ${aligned ? 'gear-aligned' : ''}`}
                style={{ transform: `rotate(${angle}deg)` }}
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const a = (i * 30 * Math.PI) / 180
                  const x1 = 50 + 38 * Math.cos(a)
                  const y1 = 50 + 38 * Math.sin(a)
                  const x2 = 50 + 48 * Math.cos(a)
                  const y2 = 50 + 48 * Math.sin(a)
                  return (
                    <line
                      key={`t${i}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={gearColors[idx]} strokeWidth="8" strokeLinecap="round"
                    />
                  )
                })}
                <circle cx="50" cy="50" r="36" fill={gearColors[idx]} fillOpacity="0.3" stroke={gearColors[idx]} strokeWidth="3" />
                <circle cx="50" cy="50" r="8" fill={gearColors[idx]} />
                <line
                  x1="50" y1="50"
                  x2={50 + 28 * Math.cos(-Math.PI / 2)}
                  y2={50 + 28 * Math.sin(-Math.PI / 2)}
                  stroke="#fff" strokeWidth="3" strokeLinecap="round"
                />
              </svg>
              <div className="gear-label">{gearLabels[idx]}齿轮</div>
              <div className="gear-controls">
                <button
                  className="puzzle-btn"
                  onClick={() => { museumNarrativeSystem.rotateGear(idx, -30); onStateChange() }}
                >◀ 30°</button>
                <button
                  className="puzzle-btn puzzle-btn-fine"
                  onClick={() => { museumNarrativeSystem.rotateGear(idx, -5); onStateChange() }}
                >◀ 5°</button>
                <button
                  className="puzzle-btn puzzle-btn-fine"
                  onClick={() => { museumNarrativeSystem.rotateGear(idx, 5); onStateChange() }}
                >5° ▶</button>
                <button
                  className="puzzle-btn"
                  onClick={() => { museumNarrativeSystem.rotateGear(idx, 30); onStateChange() }}
                >30° ▶</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BellChordPuzzle({ puzzle, progress, onStateChange }: MuseumPuzzlePanelProps) {
  const selected = progress.selectedNotes ?? []
  const targetNotes = puzzle.bellNotes ?? []

  return (
    <div className="puzzle-bell-container">
      <div className="puzzle-info">
        <h3>🔔 {puzzle.name}</h3>
        <p className="puzzle-desc">{puzzle.description}</p>
        <p className="puzzle-target" style={{ color: '#f5b041' }}>
          🎯 目标音符数：{targetNotes.length} 个
        </p>
        <p style={{ color: '#58d68d', marginTop: '0.5rem' }}>
          已选：{selected.length} 个 [{selected.join(', ')}]
        </p>
      </div>

      <div className="piano-keys">
        {BELL_NOTES.map((note) => {
          const isSelected = selected.includes(note)
          const isBlack = note.includes('#') || ['D4', 'F4', 'A4', 'B4', 'D5'].includes(note) && false
          return (
            <button
              key={note}
              className={`piano-key ${isSelected ? 'key-selected' : ''} ${isBlack ? 'key-black' : 'key-white'}`}
              onClick={() => { museumNarrativeSystem.toggleBellNote(note); onStateChange() }}
            >
              <span className="piano-note-label">{note}</span>
              {isSelected && <span className="piano-check">✓</span>}
            </button>
          )
        })}
      </div>

      <div className="puzzle-reset-row">
        <button
          className="puzzle-btn puzzle-btn-secondary"
          onClick={() => { museumNarrativeSystem.updatePuzzleProgress({ selectedNotes: [] }); onStateChange() }}
        >🔄 清空选择</button>
      </div>
    </div>
  )
}

function SymbolDecipherPuzzle({ puzzle, progress, onStateChange }: MuseumPuzzlePanelProps) {
  const selected = progress.selectedSymbols ?? []
  const pattern = puzzle.symbolPattern ?? []
  const currentIndex = selected.length

  return (
    <div className="puzzle-symbol-container">
      <div className="puzzle-info">
        <h3>🔣 {puzzle.name}</h3>
        <p className="puzzle-desc">{puzzle.description}</p>
        <p className="puzzle-target" style={{ color: '#f5b041' }}>
          🎯 按顺序选择 {pattern.length} 个符号
        </p>
        <div className="symbol-progress">
          {pattern.map((_, i) => (
            <div
              key={i}
              className={`symbol-slot ${i < currentIndex ? 'slot-filled' : ''} ${i === currentIndex ? 'slot-current' : ''}`}
            >
              {selected[i] ?? '?'}
            </div>
          ))}
        </div>
      </div>

      <div className="symbol-grid">
        {SYMBOLS.map((sym) => (
          <button
            key={sym}
            className="symbol-btn"
            onClick={() => { museumNarrativeSystem.selectSymbol(sym); onStateChange() }}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="puzzle-reset-row">
        <button
          className="puzzle-btn puzzle-btn-secondary"
          onClick={() => { museumNarrativeSystem.clearSymbolSelection(); onStateChange() }}
        >🔄 重新输入</button>
      </div>
    </div>
  )
}

function ConstellationPuzzle({ puzzle, progress, onStateChange }: MuseumPuzzlePanelProps) {
  const stars = puzzle.constellationPattern ?? []
  const connected = progress.connectedStars ?? []
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      museumNarrativeSystem.addStarConnection(x, y)
      onStateChange()
    },
    [onStateChange]
  )

  return (
    <div className="puzzle-constellation-container">
      <div className="puzzle-info">
        <h3>⭐ {puzzle.name}</h3>
        <p className="puzzle-desc">{puzzle.description}</p>
        <p className="puzzle-target" style={{ color: '#f5b041' }}>
          🎯 按顺序连接 {stars.length} 颗星
        </p>
        <p style={{ marginTop: '0.5rem', color: '#a09070', fontSize: '0.9em' }}>
          已连接：{connected.length} / {stars.length}
        </p>
      </div>

      <div className="constellation-wrapper">
        <svg
          viewBox="0 0 100 100"
          className="constellation-canvas"
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setHoverPos({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            })
          }}
          onMouseLeave={() => setHoverPos(null)}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <circle
              key={`bg${i}`}
              cx={Math.random() * 100}
              cy={Math.random() * 100}
              r={0.15 + Math.random() * 0.3}
              fill="#fff"
              opacity={0.3 + Math.random() * 0.4}
            />
          ))}

          {stars.map((s, i) => {
            const hit = connected.some(
              (c, idx) => idx < stars.length && Math.abs(c.x - s.x) <= 8 && Math.abs(c.y - s.y) <= 8
            )
            return (
              <g key={`star${i}`}>
                <circle
                  cx={s.x} cy={s.y} r={3}
                  fill={hit ? '#ffd700' : '#ffffff'}
                  stroke={hit ? '#ff8c00' : '#87ceeb'} strokeWidth="0.5"
                  className={hit ? 'star-hit' : ''}
                />
                <text x={s.x} y={s.y - 4} textAnchor="middle" fill="#aaa" fontSize="2.5">
                  {i + 1}
                </text>
              </g>
            )
          })}

          {connected.map((c, i) => {
            if (i === 0) return null
            const prev = connected[i - 1]
            return (
              <line
                key={`line${i}`}
                x1={prev.x} y1={prev.y} x2={c.x} y2={c.y}
                stroke="#87ceeb" strokeWidth="0.5" strokeDasharray="1,1" opacity="0.7"
              />
            )
          })}

          {hoverPos && connected.length > 0 && connected.length < stars.length && (
            <line
              x1={connected[connected.length - 1].x}
              y1={connected[connected.length - 1].y}
              x2={hoverPos.x}
              y2={hoverPos.y}
              stroke="#58d68d" strokeWidth="0.3" strokeDasharray="1,0.5" opacity="0.5"
            />
          )}
        </svg>
      </div>

      <div className="puzzle-reset-row">
        <button
          className="puzzle-btn puzzle-btn-secondary"
          onClick={() => { museumNarrativeSystem.clearStarConnections(); onStateChange() }}
        >🔄 清除连线</button>
      </div>
    </div>
  )
}

export default function MuseumPuzzlePanel({ puzzle, progress, onStateChange }: MuseumPuzzlePanelProps) {
  const [showHint, setShowHint] = useState(false)
  const [resultMsg, setResultMsg] = useState<{ text: string; type: 'success' | 'fail' } | null>(null)

  useEffect(() => {
    setResultMsg(null)
  }, [progress.puzzleId])

  const handleSubmit = () => {
    const result = museumNarrativeSystem.submitPuzzle()
    setResultMsg({ text: result.message ?? (result.success ? '成功！' : '失败...'), type: result.success ? 'success' : 'fail' })
    setTimeout(() => setResultMsg(null), 2500)
    onStateChange()
  }

  const handleHint = () => {
    const hint = museumNarrativeSystem.useHint()
    if (hint) {
      setShowHint(true)
      setTimeout(() => setShowHint(false), 5000)
    }
  }

  return (
    <div className="museum-puzzle-panel">
      <div className="puzzle-header">
        <div className="puzzle-stats">
          <span className="stat-item">🎯 难度：{'⭐'.repeat(puzzle.difficulty)}</span>
          <span className="stat-item">🔁 尝试：{progress.attempts}</span>
          <span className="stat-item">💡 提示：{progress.hintsUsed}</span>
          {puzzle.rewardScore && <span className="stat-item">🏆 奖励：{puzzle.rewardScore}</span>}
        </div>
        <div className="puzzle-actions">
          <button className="puzzle-hint-btn" onClick={handleHint}>💡 提示 (-100分)</button>
          <button className="puzzle-submit-btn" onClick={handleSubmit}>✅ 提交</button>
        </div>
      </div>

      {showHint && puzzle.hint && (
        <div className="puzzle-hint-box">💡 {puzzle.hint}</div>
      )}

      {resultMsg && (
        <div className={`puzzle-result-box ${resultMsg.type}`}>
          {resultMsg.type === 'success' ? '🎉' : '❌'} {resultMsg.text}
        </div>
      )}

      <div className="puzzle-content">
        {(puzzle.type === 'clock_calibration' || puzzle.type === 'time_portal') && (
          <ClockCalibrationPuzzle puzzle={puzzle} progress={progress} onStateChange={onStateChange} />
        )}
        {puzzle.type === 'gear_sequence' && (
          <GearSequencePuzzle puzzle={puzzle} progress={progress} onStateChange={onStateChange} />
        )}
        {puzzle.type === 'bell_chord' && (
          <BellChordPuzzle puzzle={puzzle} progress={progress} onStateChange={onStateChange} />
        )}
        {puzzle.type === 'symbol_decipher' && (
          <SymbolDecipherPuzzle puzzle={puzzle} progress={progress} onStateChange={onStateChange} />
        )}
        {puzzle.type === 'constellation' && (
          <ConstellationPuzzle puzzle={puzzle} progress={progress} onStateChange={onStateChange} />
        )}
      </div>
    </div>
  )
}
