import { useState, useMemo } from 'react'
import { mockEventTemplates } from '../mockData'
import type { EventTemplate } from '../../types/admin'

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const categoryMap: Record<string, string> = {
  fault: '故障',
  weather: '天气',
  reward: '奖励',
  story: '剧情',
}

const triggerTypeMap: Record<string, string> = {
  time: '时间触发',
  rotations: '旋转次数',
  deviation: '偏差触发',
  random: '随机触发',
}

const faultTypeMap: Record<string, string> = {
  jam: '卡顿',
  slip: '打滑',
  reverse: '反向',
  freeze: '冻结',
}

export default function EventManager() {
  const [events, setEvents] = useState<EventTemplate[]>(mockEventTemplates)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [selected, setSelected] = useState<EventTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<EventTemplate | null>(null)

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (search && !e.displayName.includes(search) && !e.name.includes(search)) return false
      if (filterCategory !== 'all' && e.category !== filterCategory) return false
      return true
    })
  }, [events, search, filterCategory])

  const handleCreate = () => {
    const newEvent: EventTemplate = {
      id: `evt_${Date.now()}`,
      name: 'new_event',
      displayName: '新事件模板',
      description: '',
      category: 'fault',
      events: [],
      conditions: [],
      weight: 1,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'admin',
      tags: [],
    }
    setEditing(newEvent)
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!editing) return
    const isNew = !events.find((e) => e.id === editing.id)
    if (isNew) {
      setEvents([editing, ...events])
    } else {
      setEvents(events.map((e) => (e.id === editing.id ? { ...editing, updatedAt: Date.now() } : e)))
    }
    setShowEditor(false)
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除此事件模板吗？')) {
      setEvents(events.filter((e) => e.id !== id))
      if (selected?.id === id) setSelected(null)
    }
  }

  const toggleEnabled = (e: EventTemplate) => {
    setEvents(events.map((ev) => (ev.id === e.id ? { ...ev, enabled: !ev.enabled, updatedAt: Date.now() } : ev)))
    if (selected?.id === e.id) {
      setSelected({ ...e, enabled: !e.enabled })
    }
  }

  return (
    <div>
      <div className="admin-search-bar">
        <input
          className="admin-input"
          placeholder="搜索事件模板..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select admin-filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">全部分类</option>
          <option value="fault">故障事件</option>
          <option value="weather">天气事件</option>
          <option value="reward">奖励事件</option>
          <option value="story">剧情事件</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>+ 新建模板</button>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
              <th>事件名称</th>
              <th>分类</th>
              <th>子事件数</th>
              <th>权重</th>
              <th>状态</th>
              <th>标签</th>
              <th>作者</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  style={{ cursor: 'pointer', background: selected?.id === e.id ? 'rgba(139, 92, 246, 0.08)' : undefined }}
                  onClick={() => setSelected(e)}
                >
                <td>
                  <div style={{ fontWeight: 500 }}>{e.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{e.name}</div>
                </td>
                <td>{categoryMap[e.category]}</td>
                <td>{e.events.length}</td>
                <td>{e.weight}</td>
                <td>
                  <span className={`admin-badge ${e.enabled ? 'admin-badge-enabled' : 'admin-badge-disabled'}`}>
                    {e.enabled ? '启用' : '禁用'}
                  </span>
                </td>
                <td>
                  {e.tags.slice(0, 2).map((t) => (
                    <span key={t} className="admin-tag">{t}</span>
                  ))}
                </td>
                <td>{e.author}</td>
                <td>{formatDate(e.updatedAt)}</td>
                <td onClick={(ev) => ev.stopPropagation()}>
                  <div className="admin-flex admin-gap-8">
                    <button className="admin-btn admin-btn-sm" onClick={() => { setEditing({ ...e }); setShowEditor(true) }}>编辑</button>
                    <button className={`admin-btn admin-btn-sm ${e.enabled ? 'admin-btn-warning' : 'admin-btn-success'}`} onClick={() => toggleEnabled(e)}>
                      {e.enabled ? '禁用' : '启用'}
                    </button>
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(e.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="admin-card admin-mt-24">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">{selected.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
              {selected.name}
            </div>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="admin-two-col">
              <div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">分类</div>
                  <div className="admin-detail-value">{categoryMap[selected.category]}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">权重</div>
                  <div className="admin-detail-value">{selected.weight}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">状态</div>
                  <div className="admin-detail-value">
                    <span className={`admin-badge ${selected.enabled ? 'admin-badge-enabled' : 'admin-badge-disabled'}`}>
                      {selected.enabled ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">作者</div>
                  <div className="admin-detail-value">{selected.author}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">描述</div>
                  <div className="admin-detail-value">{selected.description || '-'}</div>
                </div>
              </div>
              <div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">标签</div>
                  <div className="admin-detail-value">
                    {selected.tags.length > 0 ? selected.tags.map((t) => (
                      <span key={t} className="admin-tag">{t}</span>
                    )) : '-'}
                  </div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">触发条件</div>
                  <div className="admin-detail-value">
                    {selected.conditions.length > 0 ? (
                      <div>
                        {selected.conditions.map((c, i) => (
                          <div key={i} style={{ marginBottom: 4, fontSize: 13 }}>
                            {c.type}: {c.min} ~ {c.max}
                          </div>
                        ))}
                      </div>
                    ) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {selected.events.length > 0 && (
              <div className="admin-mt-24">
                <h4 style={{ fontSize: 14, marginBottom: 12, fontWeight: 600 }}>子故障事件列表</h4>
                <table className="admin-table">
                  <thead>
                    <tr>
                    <th>事件名</th>
                    <th>类型</th>
                    <th>触发方式</th>
                    <th>触发值</th>
                    <th>目标齿轮</th>
                    <th>持续时间</th>
                    <th>状态</th>
                  </tr>
                  </thead>
                  <tbody>
                    {selected.events.map((fe) => (
                      <tr key={fe.id}>
                        <td>{fe.displayName}</td>
                        <td>{faultTypeMap[fe.type]}</td>
                        <td>{triggerTypeMap[fe.triggerType]}</td>
                        <td>{fe.triggerValue}</td>
                        <td>{fe.targetGearIds.join(', ')}</td>
                        <td>{fe.duration}s</td>
                        <td>
                          <span className={`admin-badge ${fe.enabled ? 'admin-badge-enabled' : 'admin-badge-disabled'}`}>
                            {fe.enabled ? '启用' : '禁用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showEditor && editing && (
        <div className="admin-modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                {events.find((e) => e.id === editing.id) ? '编辑事件模板' : '新建事件模板'}
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
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">描述</label>
                <textarea
                  className="admin-textarea"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">分类</label>
                  <select
                    className="admin-select"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value as EventTemplate['category'] })}
                  >
                    <option value="fault">故障事件</option>
                    <option value="weather">天气事件</option>
                    <option value="reward">奖励事件</option>
                    <option value="story">剧情事件</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">权重</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editing.weight}
                    onChange={(e) => setEditing({ ...editing, weight: Number(e.target.value) })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">状态</label>
                  <select
                    className="admin-select"
                    value={editing.enabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setEditing({ ...editing, enabled: e.target.value === 'enabled' })}
                  >
                    <option value="enabled">启用</option>
                    <option value="disabled">禁用</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">触发条件</label>
                <div style={{ background: 'var(--admin-bg)', padding: 12, borderRadius: 6 }}>
                  {editing.conditions.length === 0 ? (
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>暂无条件，点击下方按钮添加</div>
                  ) : (
                    editing.conditions.map((c, i) => (
                      <div key={i} className="admin-flex admin-gap-8 admin-items-center" style={{ marginBottom: 8 }}>
                        <select
                          className="admin-select"
                          style={{ flex: 1 }}
                          value={c.type}
                          onChange={(e) => {
                            const newConditions = [...editing.conditions]; newConditions[i] = { ...c, type: e.target.value as any }; setEditing({ ...editing, conditions: newConditions })
                          }}
                        >
                          <option value="time_range">时间范围</option>
                          <option value="score_range">分数范围</option>
                          <option value="level_progress">关卡进度</option>
                          <option value="deviation_range">偏差范围</option>
                          <option value="gear_rotations">齿轮旋转</option>
                        </select>
                        <input type="number" className="admin-input" style={{ width: 80 }} placeholder="最小" value={c.min} onChange={(e) => { const nc = [...editing.conditions]; nc[i] = { ...c, min: Number(e.target.value) }; setEditing({ ...editing, conditions: nc }) }} />
                        <input type="number" className="admin-input" style={{ width: 80 }} placeholder="最大" value={c.max} onChange={(e) => { const nc = [...editing.conditions]; nc[i] = { ...c, max: Number(e.target.value) }; setEditing({ ...editing, conditions: nc }) }} />
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setEditing({ ...editing, conditions: editing.conditions.filter((_, idx) => idx !== i) })}>删除</button>
                      </div>
                    ))
                  )}
                  <button className="admin-btn admin-btn-sm admin-mt-16" onClick={() => setEditing({ ...editing, conditions: [...editing.conditions, { type: 'time_range', min: 0, max: 60 }] })}>+ 添加条件</button>
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
