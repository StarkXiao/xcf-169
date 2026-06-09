import { useState } from 'react'
import { mockDifficultyCurves } from '../mockData'
import type { DifficultyCurve, DifficultyPoint } from '../../types/admin'

const levelMap: Record<string, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
  expert: '大师',
}

const metricLabels: Record<string, string> = {
  faultRate: '故障频率',
  faultSeverity: '故障严重度',
  weatherIntensity: '天气强度',
  targetOffset: '目标偏移',
  timePressure: '时间压力',
  scoreMultiplier: '分数倍率',
}

const metricColors: Record<string, string> = {
  faultRate: '#ef4444',
  faultSeverity: '#f59e0b',
  weatherIntensity: '#3b82f6',
  targetOffset: '#8b5cf6',
  timePressure: '#ec4899',
  scoreMultiplier: '#10b981',
}

function ChartCurve({ curve, selectedMetric }: { curve: DifficultyCurve; selectedMetric: keyof DifficultyPoint }) {
  const width = 600
  const height = 240
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const points = curve.points
  const color = metricColors[selectedMetric] || '#8b5cf6'

  const pathD = points.map((p, i) => {
    const x = padding.left + (p.levelProgress * innerW)
    const y = padding.top + innerH - (p[selectedMetric] as number) * innerH
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="admin-diff-chart">
      <svg viewBox={`0 0 ${width} ${height}`}>
        {gridLines.map((g, i) => (
          <line
            key={i}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerH - g * innerH}
            y2={padding.top + innerH - g * innerH}
            stroke="#334155"
            strokeWidth={1}
            strokeDasharray="2,4"
          />
        ))}
        {gridLines.map((g, i) => (
          <line
            key={`v${i}`}
            x1={padding.left + g * innerW}
            x2={padding.left + g * innerW}
            y1={padding.top}
            y2={height - padding.bottom}
            stroke="#334155"
            strokeWidth={1}
            strokeDasharray="2,4"
          />
        ))}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
        />
        {points.map((p, i) => {
          const x = padding.left + (p.levelProgress * innerW)
          const y = padding.top + innerH - (p[selectedMetric] as number) * innerH
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5} fill="#0f172a" stroke={color} strokeWidth={2} />
              <text x={x} y={y - 10} fill={color} fontSize={11} textAnchor="middle" fontWeight="600">
                {typeof p[selectedMetric] === 'number' ? (p[selectedMetric] as number).toFixed(2) : p[selectedMetric]}
              </text>
            </g>
          )
        })}
        {gridLines.map((g, i) => (
          <text
            key={`ly${i}`}
            x={padding.left - 8}
            y={padding.top + innerH - g * innerH + 4}
            fill="#64748b"
            fontSize={10}
            textAnchor="end"
          >
            {g.toFixed(2)}
          </text>
        ))}
        {gridLines.map((g, i) => (
          <text
            key={`lx${i}`}
            x={padding.left + g * innerW}
            y={height - padding.bottom + 18}
            fill="#64748b"
            fontSize={10}
            textAnchor="middle"
          >
            {(g * 100).toFixed(0)}%
          </text>
        ))}
        <text
          x={width / 2}
          y={height - 4}
          fill="#94a3b8"
          fontSize={11}
          textAnchor="middle"
        >
          关卡进度 →
        </text>
      </svg>
    </div>
  )
}

export default function DifficultyManager() {
  const [curves, setCurves] = useState<DifficultyCurve[]>(mockDifficultyCurves)
  const [selected, setSelected] = useState<DifficultyCurve | null>(curves[0])
  const [selectedMetric, setSelectedMetric] = useState<keyof DifficultyPoint>('faultRate')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<DifficultyCurve | null>(null)

  const handleCreate = () => {
    const newCurve: DifficultyCurve = {
      id: `diff_${Date.now()}`,
      name: 'new_curve',
      displayName: '新难度曲线',
      description: '',
      level: 'normal',
      points: [
        { levelProgress: 0, faultRate: 0.1, faultSeverity: 0.3, weatherIntensity: 0.2, targetOffset: 5, timePressure: 0.5, scoreMultiplier: 1.0 },
        { levelProgress: 0.5, faultRate: 0.3, faultSeverity: 0.5, weatherIntensity: 0.5, targetOffset: 10, timePressure: 0.7, scoreMultiplier: 1.5 },
        { levelProgress: 1, faultRate: 0.5, faultSeverity: 0.7, weatherIntensity: 0.8, targetOffset: 15, timePressure: 1.0, scoreMultiplier: 2.0 },
      ],
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'admin',
    }
    setEditing(newCurve)
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!editing) return
    const isNew = !curves.find((c) => c.id === editing.id)
    if (isNew) {
      setCurves([editing, ...curves])
    } else {
      setCurves(curves.map((c) => (c.id === editing.id ? { ...editing, updatedAt: Date.now() } : c)))
    }
    setShowEditor(false)
    setEditing(null)
  }

  const updatePoint = (index: number, key: keyof DifficultyPoint, value: number) => {
    if (!editing) return
    const newPoints = [...editing.points]
    newPoints[index] = { ...newPoints[index], [key]: value }
    setEditing({ ...editing, points: newPoints })
  }

  const addPoint = () => {
    if (!editing) return
    const lastPoint = editing.points[editing.points.length - 1]
    const newProgress = Math.min(1, lastPoint.levelProgress + 0.1)
    setEditing({
      ...editing,
      points: [...editing.points, { ...lastPoint, levelProgress: newProgress }],
    })
  }

  const removePoint = (index: number) => {
    if (!editing || editing.points.length <= 2) return
    setEditing({ ...editing, points: editing.points.filter((_, i) => i !== index) })
  }

  return (
    <div>
      <div className="admin-search-bar">
        <div style={{ flex: 1 }} />
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>+ 新建难度曲线</button>
      </div>

      <div className="admin-split-layout" style={{ minHeight: 500 }}>
        <div className="admin-card admin-split-left" style={{ padding: 0 }}>
          <div className="admin-card-header">
            <div className="admin-card-title">难度等级</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {curves.map((c) => (
              <div
                key={c.id}
                className="admin-list-item"
                style={{ cursor: 'pointer', background: selected?.id === c.id ? 'rgba(139, 92, 246, 0.1)' : undefined }}
                onClick={() => setSelected(c)}
              >
                <div className="admin-list-item-info">
                  <div className="admin-list-item-title">
                    {c.displayName}
                    <span style={{ marginLeft: 6 }}>
                      <span className={`admin-badge ${c.enabled ? 'admin-badge-enabled' : 'admin-badge-disabled'}`}>
                        {c.enabled ? '启用' : '禁用'}
                      </span>
                    </span>
                  </div>
                  <div className="admin-list-item-meta">
                    {levelMap[c.level]} · {c.points.length} 个节点
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card admin-split-right">
          {selected ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-title">{selected.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    {levelMap[selected.level]} · {selected.name}
                  </div>
                </div>
                <div className="admin-action-bar">
                  <button className="admin-btn admin-btn-sm" onClick={() => { setEditing({ ...selected }); setShowEditor(true) }}>
                    ✏️ 编辑
                  </button>
                </div>
              </div>
              <div className="admin-card-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">描述</div>
                  <div className="admin-detail-value">{selected.description || '-'}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">作者</div>
                  <div className="admin-detail-value">{selected.author}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">状态</div>
                  <div className="admin-detail-value">
                    <span className={`admin-badge ${selected.enabled ? 'admin-badge-enabled' : 'admin-badge-disabled'}`}>
                      {selected.enabled ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>

                <div className="admin-mt-24">
                  <div className="admin-flex admin-justify-between admin-items-center" style={{ marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>曲线图可视化</h4>
                    <select
                      className="admin-select"
                      style={{ width: 160 }}
                      value={selectedMetric}
                      onChange={(e) => setSelectedMetric(e.target.value as keyof DifficultyPoint)}
                    >
                      {Object.entries(metricLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <ChartCurve curve={selected} selectedMetric={selectedMetric} />
                </div>

                <div className="admin-mt-24">
                  <h4 style={{ fontSize: 14, marginBottom: 12, fontWeight: 600 }}>曲线节点数据</h4>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>进度</th>
                        <th>故障频率</th>
                        <th>严重度</th>
                        <th>天气</th>
                        <th>时间偏移</th>
                        <th>时间压力</th>
                        <th>分数倍率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.points.map((p, i) => (
                        <tr key={i}>
                          <td>{(p.levelProgress * 100).toFixed(0)}%</td>
                          <td>{p.faultRate.toFixed(2)}</td>
                          <td>{p.faultSeverity.toFixed(2)}</td>
                          <td>{p.weatherIntensity.toFixed(2)}</td>
                          <td>{p.targetOffset}</td>
                          <td>{p.timePressure.toFixed(2)}</td>
                          <td>×{p.scoreMultiplier.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-empty-state-icon">📈</div>
              <div className="admin-empty-state-text">选择一条难度曲线查看详情</div>
            </div>
          )}
        </div>
      </div>

      {showEditor && editing && (
        <div className="admin-modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="admin-modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                {curves.find((c) => c.id === editing.id) ? '编辑难度曲线' : '新建难度曲线'}
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditor(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">显示名称</label>
                  <input
                    className="admin-input"
                    value={editing.displayName}
                    onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">英文标识</label>
                  <input
                    className="admin-input"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">难度等级</label>
                  <select
                    className="admin-select"
                    value={editing.level}
                    onChange={(e) => setEditing({ ...editing, level: e.target.value as DifficultyCurve['level'] })}
                  >
                    <option value="easy">简单</option>
                    <option value="normal">普通</option>
                    <option value="hard">困难</option>
                    <option value="expert">大师</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">描述</label>
                <textarea
                  className="admin-textarea"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <div className="admin-flex admin-justify-between admin-items-center">
                  <label className="admin-form-label" style={{ marginBottom: 0 }}>曲线节点</label>
                  <button className="admin-btn admin-btn-sm" onClick={addPoint}>+ 添加节点</button>
                </div>
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>进度</th>
                      <th>故障频率</th>
                      <th>严重度</th>
                      <th>天气</th>
                      <th>偏移</th>
                      <th>压力</th>
                      <th>倍率</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editing.points.map((p, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="admin-input"
                            style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
                            value={p.levelProgress}
                            onChange={(e) => updatePoint(i, 'levelProgress', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="admin-input"
                            style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
                            value={p.faultRate}
                            onChange={(e) => updatePoint(i, 'faultRate', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="admin-input"
                            style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
                            value={p.faultSeverity}
                            onChange={(e) => updatePoint(i, 'faultSeverity', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="admin-input"
                            style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
                            value={p.weatherIntensity}
                            onChange={(e) => updatePoint(i, 'weatherIntensity', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="admin-input"
                            style={{ width: 60, padding: '4px 8px', fontSize: 12 }}
                            value={p.targetOffset}
                            onChange={(e) => updatePoint(i, 'targetOffset', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            max="1"
                            className="admin-input"
                            style={{ width: 70, padding: '4px 8px', fontSize: 12 }}
                            value={p.timePressure}
                            onChange={(e) => updatePoint(i, 'timePressure', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="admin-input"
                            style={{ width: 60, padding: '4px 8px', fontSize: 12 }}
                            value={p.scoreMultiplier}
                            onChange={(e) => updatePoint(i, 'scoreMultiplier', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => removePoint(i)}
                            disabled={editing.points.length <= 2}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowEditor(false)}>取消</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
