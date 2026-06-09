import { useState, useMemo } from 'react'
import { mockLevels } from '../mockData'
import type { AdminLevelConfig } from '../../types/admin'

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function statusText(s: AdminLevelConfig['status']) {
  return s === 'draft' ? '草稿' : s === 'testing' ? '测试中' : '已发布'
}

function modeText(m: string) {
  return m === 'classic' ? '经典' : m === 'patrol' ? '夜巡' : '多钟'
}

export default function LevelManager() {
  const [levels, setLevels] = useState<AdminLevelConfig[]>(mockLevels)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMode, setFilterMode] = useState<string>('all')
  const [selected, setSelected] = useState<AdminLevelConfig | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingLevel, setEditingLevel] = useState<AdminLevelConfig | null>(null)

  const filteredLevels = useMemo(() => {
    return levels.filter((l) => {
      if (search && !l.displayName.includes(search) && !l.name.includes(search) && !l.description.includes(search)) {
        return false
      }
      if (filterStatus !== 'all' && l.status !== filterStatus) return false
      if (filterMode !== 'all' && l.gameMode !== filterMode) return false
      return true
    })
  }, [levels, search, filterStatus, filterMode])

  const handleCreate = () => {
    const newLevel: AdminLevelConfig = {
      id: `level_${Date.now()}`,
      name: 'new_level',
      displayName: '新关卡',
      description: '',
      gameMode: 'classic',
      duration: 120,
      status: 'draft',
      tags: [],
      author: 'admin',
      versionId: '',
      gears: [
        { id: 1, x: 300, y: 200, size: 'large', connectedTo: [], initialAngle: 0 },
      ],
      initialClockTime: { hours: 12, minutes: 0 },
      targetClockTime: { hours: 6, minutes: 0 },
      toleranceMinutes: 2,
      scoreMultiplier: 1,
      faultEvents: [],
      soundConfigs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setEditingLevel(newLevel)
    setShowEditor(true)
  }

  const handleEdit = (level: AdminLevelConfig) => {
    setEditingLevel({ ...level })
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!editingLevel) return
    const isNew = !levels.find((l) => l.id === editingLevel.id)
    if (isNew) {
      setLevels([editingLevel, ...levels])
    } else {
      setLevels(levels.map((l) => (l.id === editingLevel.id ? { ...editingLevel, updatedAt: Date.now() } : l)))
    }
    setShowEditor(false)
    setEditingLevel(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除此关卡吗？')) {
      setLevels(levels.filter((l) => l.id !== id))
      if (selected?.id === id) setSelected(null)
    }
  }

  return (
    <div>
      <div className="admin-search-bar">
        <input
          className="admin-input"
          placeholder="搜索关卡名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select admin-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="testing">测试中</option>
          <option value="published">已发布</option>
        </select>
        <select
          className="admin-select admin-filter-select"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
        >
          <option value="all">全部模式</option>
          <option value="classic">经典模式</option>
          <option value="patrol">夜巡模式</option>
          <option value="multiclock">多钟模式</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
          + 新建关卡
        </button>
      </div>

      <div className="admin-split-layout" style={{ minHeight: 500 }}>
        <div className="admin-card admin-split-left" style={{ padding: 0 }}>
          <div className="admin-card-header">
            <div className="admin-card-title">关卡列表</div>
            <span className="admin-badge admin-badge-draft">{filteredLevels.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredLevels.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-state-icon">🔍</div>
                <div className="admin-empty-state-text">没有找到匹配的关卡</div>
              </div>
            ) : (
              filteredLevels.map((level) => (
                <div
                  key={level.id}
                  className="admin-list-item"
                  style={{ cursor: 'pointer', background: selected?.id === level.id ? 'rgba(139, 92, 246, 0.1)' : undefined }}
                  onClick={() => setSelected(level)}
                >
                  <div className="admin-list-item-info">
                    <div className="admin-list-item-title">
                      {level.displayName}
                      <span style={{ marginLeft: 6 }}>
                        <span className={`admin-badge admin-badge-${level.status}`}>
                          {statusText(level.status)}
                        </span>
                      </span>
                    </div>
                    <div className="admin-list-item-meta">
                      {modeText(level.gameMode)} · {level.duration}s · {level.gears.length}齿轮
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card admin-split-right">
          {selected ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-title">{selected.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    {selected.name}
                  </div>
                </div>
                <div className="admin-action-bar">
                  <button className="admin-btn admin-btn-sm" onClick={() => handleEdit(selected)}>✏️ 编辑</button>
                  <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(selected.id)}>🗑️ 删除</button>
                </div>
              </div>
              <div className="admin-card-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">状态</div>
                  <div className="admin-detail-value">
                    <span className={`admin-badge admin-badge-${selected.status}`}>{statusText(selected.status)}</span>
                  </div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">游戏模式</div>
                  <div className="admin-detail-value">{modeText(selected.gameMode)}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">关卡时长</div>
                  <div className="admin-detail-value">{selected.duration} 秒</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">初始时间</div>
                  <div className="admin-detail-value">{selected.initialClockTime.hours}:{selected.initialClockTime.minutes.toString().padStart(2, '0')}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">目标时间</div>
                  <div className="admin-detail-value">{selected.targetClockTime.hours}:{selected.targetClockTime.minutes.toString().padStart(2, '0')}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">容差范围</div>
                  <div className="admin-detail-value">±{selected.toleranceMinutes} 分钟</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">分数倍率</div>
                  <div className="admin-detail-value">×{selected.scoreMultiplier}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">齿轮数量</div>
                  <div className="admin-detail-value">{selected.gears.length} 个</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">故障事件</div>
                  <div className="admin-detail-value">{selected.faultEvents.length} 个</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">标签</div>
                  <div className="admin-detail-value">
                    {selected.tags.length > 0 ? selected.tags.map((t) => (
                      <span key={t} className="admin-tag">{t}</span>
                    )) : '-'}
                  </div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">作者</div>
                  <div className="admin-detail-value">{selected.author}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">创建时间</div>
                  <div className="admin-detail-value">{formatDate(selected.createdAt)}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">更新时间</div>
                  <div className="admin-detail-value">{formatDate(selected.updatedAt)}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">描述</div>
                  <div className="admin-detail-value">{selected.description || '-'}</div>
                </div>

                {selected.patrolPeriods && selected.patrolPeriods.length > 0 && (
                  <div className="admin-mt-24">
                    <h4 style={{ fontSize: 14, marginBottom: 12, fontWeight: 600 }}>夜巡时段配置</h4>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>时段</th>
                          <th>时长</th>
                          <th>天气</th>
                          <th>故障数</th>
                          <th>分数倍率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.patrolPeriods.map((p) => (
                          <tr key={p.id}>
                            <td>{p.displayName}</td>
                            <td>{p.duration}s</td>
                            <td>🌧{p.weather.rain} 💨{p.weather.wind} ⚡{p.weather.lightning}</td>
                            <td>{p.faultCount}</td>
                            <td>×{p.scoreMultiplier}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-empty-state-icon">🎮</div>
              <div className="admin-empty-state-text">选择一个关卡查看详情</div>
            </div>
          )}
        </div>
      </div>

      {showEditor && editingLevel && (
        <div className="admin-modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                {levels.find((l) => l.id === editingLevel.id) ? '编辑关卡' : '新建关卡'}
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditor(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">显示名称</label>
                  <input
                    className="admin-input"
                    value={editingLevel.displayName}
                    onChange={(e) => setEditingLevel({ ...editingLevel, displayName: e.target.value })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">英文标识</label>
                  <input
                    className="admin-input"
                    value={editingLevel.name}
                    onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">描述</label>
                <textarea
                  className="admin-textarea"
                  value={editingLevel.description}
                  onChange={(e) => setEditingLevel({ ...editingLevel, description: e.target.value })}
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">游戏模式</label>
                  <select
                    className="admin-select"
                    value={editingLevel.gameMode}
                    onChange={(e) => setEditingLevel({ ...editingLevel, gameMode: e.target.value as AdminLevelConfig['gameMode'] })}
                  >
                    <option value="classic">经典模式</option>
                    <option value="patrol">夜巡模式</option>
                    <option value="multiclock">多钟模式</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">状态</label>
                  <select
                    className="admin-select"
                    value={editingLevel.status}
                    onChange={(e) => setEditingLevel({ ...editingLevel, status: e.target.value as AdminLevelConfig['status'] })}
                  >
                    <option value="draft">草稿</option>
                    <option value="testing">测试中</option>
                    <option value="published">已发布</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">关卡时长（秒）</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingLevel.duration}
                    onChange={(e) => setEditingLevel({ ...editingLevel, duration: Number(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">分数倍率</label>
                  <input
                    type="number"
                    step="0.1"
                    className="admin-input"
                    value={editingLevel.scoreMultiplier}
                    onChange={(e) => setEditingLevel({ ...editingLevel, scoreMultiplier: Number(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">容差（分钟）</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingLevel.toleranceMinutes}
                    onChange={(e) => setEditingLevel({ ...editingLevel, toleranceMinutes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">初始时间（时）</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingLevel.initialClockTime.hours}
                    onChange={(e) => setEditingLevel({ ...editingLevel, initialClockTime: { ...editingLevel.initialClockTime, hours: Number(e.target.value) } })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">初始时间（分）</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingLevel.initialClockTime.minutes}
                    onChange={(e) => setEditingLevel({ ...editingLevel, initialClockTime: { ...editingLevel.initialClockTime, minutes: Number(e.target.value) } })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">目标时间（时）</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingLevel.targetClockTime.hours}
                    onChange={(e) => setEditingLevel({ ...editingLevel, targetClockTime: { ...editingLevel.targetClockTime, hours: Number(e.target.value) } })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">目标时间（分）</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editingLevel.targetClockTime.minutes}
                    onChange={(e) => setEditingLevel({ ...editingLevel, targetClockTime: { ...editingLevel.targetClockTime, minutes: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">齿轮数量：{editingLevel.gears.length}</label>
                <div className="admin-level-preview" style={{ height: 200, position: 'relative' }}>
                  {editingLevel.gears.map((g) => (
                    <div
                      key={g.id}
                      className="admin-level-gear"
                      style={{
                        left: `${(g.x / 600) * 100}%`,
                        top: `${(g.y / 450) * 100}%`,
                        width: g.size === 'large' ? 50 : g.size === 'medium' ? 36 : 24,
                        height: g.size === 'large' ? 50 : g.size === 'medium' ? 36 : 24,
                      }}
                    >
                      {g.id}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>
                  * 齿轮的详细配置请在关卡编辑器中调整
                </div>
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
