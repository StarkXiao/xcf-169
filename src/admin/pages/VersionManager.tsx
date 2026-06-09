import { useState, useMemo } from 'react'
import { mockVersions, mockLevels, mockEventTemplates, mockDifficultyCurves, mockTextResources } from '../mockData'
import type { ConfigVersion, VersionStatus } from '../../types/admin'

function formatDate(ts?: number) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const statusMap: Record<VersionStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
  rolled_back: '已回滚',
}

export default function VersionManager() {
  const [versions, setVersions] = useState<ConfigVersion[]>(mockVersions)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selected, setSelected] = useState<ConfigVersion | null>(null)
  const [showPublisher, setShowPublisher] = useState(false)
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false)
  const [rollbackTarget, setRollbackTarget] = useState<ConfigVersion | null>(null)
  const [newVersion, setNewVersion] = useState<Partial<ConfigVersion>>({
    version: 'v1.3.0',
    name: '',
    description: '',
    changeLog: '',
    status: 'draft',
    levelIds: [],
    eventTemplateIds: [],
    difficultyCurveIds: [],
    textResourceIds: [],
  })

  const sortedVersions = useMemo(() => {
    return [...versions]
      .filter((v) => filterStatus === 'all' || v.status === filterStatus)
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [versions, filterStatus])

  const handlePublish = () => {
    const v: ConfigVersion = {
      id: `ver_${Date.now()}`,
      version: newVersion.version || 'v1.0.0',
      name: newVersion.name || '未命名版本',
      description: newVersion.description || '',
      status: 'published',
      levelIds: newVersion.levelIds || [],
      eventTemplateIds: newVersion.eventTemplateIds || [],
      difficultyCurveIds: newVersion.difficultyCurveIds || [],
      textResourceIds: newVersion.textResourceIds || [],
      changeLog: newVersion.changeLog || '',
      publishedAt: Date.now(),
      createdAt: Date.now(),
      author: 'admin',
    }

    const updatedVersions = versions.map((old) =>
      old.status === 'published' ? { ...old, status: 'archived' as VersionStatus, archivedAt: Date.now() } : old
    )

    setVersions([v, ...updatedVersions])
    setShowPublisher(false)
    setSelected(v)
    alert('版本发布成功！原已发布版本已自动归档。')
  }

  const handleRollback = () => {
    if (!rollbackTarget) return

    const rollbackVersion: ConfigVersion = {
      id: `ver_${Date.now()}`,
      version: `${rollbackTarget.version}-rollback`,
      name: `${rollbackTarget.name}（回滚版）`,
      description: `从 ${rollbackTarget.version} 回滚的版本`,
      status: 'rolled_back',
      levelIds: rollbackTarget.levelIds,
      eventTemplateIds: rollbackTarget.eventTemplateIds,
      difficultyCurveIds: rollbackTarget.difficultyCurveIds,
      textResourceIds: rollbackTarget.textResourceIds,
      changeLog: `回滚至 ${rollbackTarget.version}：${rollbackTarget.name}`,
      rolledBackFrom: rollbackTarget.id,
      publishedAt: Date.now(),
      createdAt: Date.now(),
      author: 'admin',
    }

    const updatedVersions = versions.map((old) =>
      old.status === 'published' ? { ...old, status: 'archived' as VersionStatus, archivedAt: Date.now() } : old
    )

    setVersions([rollbackVersion, ...updatedVersions])
    setShowRollbackConfirm(false)
    setRollbackTarget(null)
    setSelected(rollbackVersion)
    alert('版本回滚成功！原发布版本已归档。')
  }

  const handleArchive = (v: ConfigVersion) => {
    if (confirm(`确定归档版本 ${v.version} 吗？`)) {
      setVersions(versions.map((old) =>
        old.id === v.id ? { ...old, status: 'archived' as VersionStatus, archivedAt: Date.now() } : old
      ))
      if (selected?.id === v.id) {
        setSelected({ ...v, status: 'archived', archivedAt: Date.now() })
      }
    }
  }

  const toggleItem = (field: 'levelIds' | 'eventTemplateIds' | 'difficultyCurveIds' | 'textResourceIds', id: string) => {
    const current = (newVersion[field] as string[]) || []
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]
    setNewVersion({ ...newVersion, [field]: next })
  }

  return (
    <div>
      <div className="admin-search-bar">
        <select
          className="admin-select admin-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
          <option value="rolled_back">已回滚</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="admin-btn admin-btn-primary" onClick={() => setShowPublisher(true)}>
          🚀 发布新版本
        </button>
      </div>

      <div className="admin-two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">版本历史</div>
          </div>
          <div className="admin-card-body">
            <div className="admin-version-timeline">
              {sortedVersions.map((v) => (
                <div
                  key={v.id}
                  className={`admin-version-timeline-item ${v.status === 'published' ? 'active' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: 12,
                    paddingLeft: 16,
                    marginLeft: -8,
                    borderRadius: 6,
                    background: selected?.id === v.id ? 'rgba(139, 92, 246, 0.1)' : undefined,
                  }}
                  onClick={() => setSelected(v)}
                >
                  <div className="admin-flex admin-justify-between admin-items-center">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {v.version}
                        <span style={{ marginLeft: 8 }}>
                          <span className={`admin-badge admin-badge-${v.status}`}>
                            {statusMap[v.status]}
                          </span>
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                        {v.publishedAt ? `发布于 ${formatDate(v.publishedAt)}` : `创建于 ${formatDate(v.createdAt)}`}
                        {' · '}{v.author}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card">
          {selected ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-title">{selected.version} · {selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                    <span className={`admin-badge admin-badge-${selected.status}`}>
                      {statusMap[selected.status]}
                    </span>
                    {' · '}由 {selected.author} 创建于 {formatDate(selected.createdAt)}
                  </div>
                </div>
                <div className="admin-action-bar">
                  {selected.status === 'draft' && (
                    <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => {
                      setVersions(versions.map((v) =>
                        v.id === selected.id ? { ...v, status: 'published' as VersionStatus, publishedAt: Date.now() } : v
                      ))
                      setSelected({ ...selected, status: 'published', publishedAt: Date.now() })
                    }}>
                      发布此版本
                    </button>
                  )}
                  {selected.status === 'published' && (
                    <button className="admin-btn admin-btn-sm admin-btn-warning" onClick={() => handleArchive(selected)}>
                      归档
                    </button>
                  )}
                  {(selected.status === 'archived' || selected.status === 'published') && (
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => {
                      setRollbackTarget(selected)
                      setShowRollbackConfirm(true)
                    }}>
                      🔄 回滚到此版本
                    </button>
                  )}
                </div>
              </div>
              <div className="admin-card-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">版本号</div>
                  <div className="admin-detail-value">{selected.version}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">名称</div>
                  <div className="admin-detail-value">{selected.name}</div>
                </div>
                <div className="admin-detail-row">
                  <div className="admin-detail-label">描述</div>
                  <div className="admin-detail-value">{selected.description || '-'}</div>
                </div>

                {selected.rolledBackFrom && (
                  <div className="admin-detail-row">
                    <div className="admin-detail-label">回滚自</div>
                    <div className="admin-detail-value">
                      {versions.find((v) => v.id === selected.rolledBackFrom)?.version || '-'}
                    </div>
                  </div>
                )}

                <div className="admin-detail-row">
                  <div className="admin-detail-label">包含内容</div>
                  <div className="admin-detail-value">
                    <div style={{ marginBottom: 8 }}>
                      <strong>🎮 关卡 ({selected.levelIds.length}):</strong>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      {selected.levelIds.length === 0 ? (
                        <span style={{ color: 'var(--admin-text-muted)' }}>无</span>
                      ) : selected.levelIds.map((id) => {
                        const l = mockLevels.find((x) => x.id === id)
                        return <span key={id} className="admin-tag">{l?.displayName || id}</span>
                      })}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>⚡ 事件 ({selected.eventTemplateIds.length}):</strong>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      {selected.eventTemplateIds.length === 0 ? (
                        <span style={{ color: 'var(--admin-text-muted)' }}>无</span>
                      ) : selected.eventTemplateIds.map((id) => {
                        const e = mockEventTemplates.find((x) => x.id === id)
                        return <span key={id} className="admin-tag">{e?.displayName || id}</span>
                      })}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>📈 难度曲线 ({selected.difficultyCurveIds.length}):</strong>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      {selected.difficultyCurveIds.length === 0 ? (
                        <span style={{ color: 'var(--admin-text-muted)' }}>无</span>
                      ) : selected.difficultyCurveIds.map((id) => {
                        const d = mockDifficultyCurves.find((x) => x.id === id)
                        return <span key={id} className="admin-tag">{d?.displayName || id}</span>
                      })}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>📝 文案资源 ({selected.textResourceIds.length}):</strong>
                    </div>
                    <div>
                      {selected.textResourceIds.length === 0 ? (
                        <span style={{ color: 'var(--admin-text-muted)' }}>无</span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-secondary)' }}>
                          {selected.textResourceIds.length} 条文案记录
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selected.changeLog && (
                  <div className="admin-mt-24">
                    <h4 style={{ fontSize: 14, marginBottom: 12, fontWeight: 600 }}>更新日志</h4>
                    <div
                      style={{
                        background: 'var(--admin-bg)',
                        padding: 16,
                        borderRadius: 6,
                        whiteSpace: 'pre-wrap',
                        fontSize: 13,
                        lineHeight: 1.8,
                        fontFamily: 'monospace',
                      }}
                    >
                      {selected.changeLog}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="admin-empty-state-icon">🏷️</div>
              <div className="admin-empty-state-text">选择一个版本查看详情</div>
            </div>
          )}
        </div>
      </div>

      {showPublisher && (
        <div className="admin-modal-overlay" onClick={() => setShowPublisher(false)}>
          <div className="admin-modal" style={{ maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">🚀 发布新版本</div>
              <button className="admin-modal-close" onClick={() => setShowPublisher(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">版本号</label>
                  <input
                    className="admin-input"
                    value={newVersion.version}
                    onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                    placeholder="例：v1.2.0"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">版本名称</label>
                  <input
                    className="admin-input"
                    value={newVersion.name}
                    onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                    placeholder="例：夜巡模式大更新"
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">版本描述</label>
                <input
                  className="admin-input"
                  value={newVersion.description}
                  onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                  placeholder="简要描述这个版本的内容"
                />
              </div>

              <div className="admin-tabs">
                <div className="admin-tab active">关卡配置</div>
                <div className="admin-tab">{newVersion.eventTemplateIds?.length || 0} 事件</div>
                <div className="admin-tab">{newVersion.difficultyCurveIds?.length || 0} 难度</div>
                <div className="admin-tab">{newVersion.textResourceIds?.length || 0} 文案</div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">🎮 选择关卡</label>
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6, padding: 8 }}>
                  {mockLevels.map((l) => (
                    <label
                      key={l.id}
                      className="admin-flex admin-gap-8 admin-items-center"
                      style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={(newVersion.levelIds || []).includes(l.id)}
                        onChange={() => toggleItem('levelIds', l.id)}
                      />
                      <span style={{ fontSize: 13 }}>{l.displayName}</span>
                      <span className={`admin-badge admin-badge-${l.status}`} style={{ marginLeft: 'auto' }}>
                        {l.status === 'draft' ? '草稿' : l.status === 'testing' ? '测试' : '发布'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">⚡ 选择事件模板</label>
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6, padding: 8 }}>
                  {mockEventTemplates.map((e) => (
                    <label
                      key={e.id}
                      className="admin-flex admin-gap-8 admin-items-center"
                      style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={(newVersion.eventTemplateIds || []).includes(e.id)}
                        onChange={() => toggleItem('eventTemplateIds', e.id)}
                      />
                      <span style={{ fontSize: 13 }}>{e.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">📈 选择难度曲线</label>
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6, padding: 8 }}>
                  {mockDifficultyCurves.map((d) => (
                    <label
                      key={d.id}
                      className="admin-flex admin-gap-8 admin-items-center"
                      style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={(newVersion.difficultyCurveIds || []).includes(d.id)}
                        onChange={() => toggleItem('difficultyCurveIds', d.id)}
                      />
                      <span style={{ fontSize: 13 }}>{d.displayName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">📝 选择文案资源</label>
                <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6, padding: 8 }}>
                  {mockTextResources.slice(0, 20).map((t) => (
                    <label
                      key={t.id}
                      className="admin-flex admin-gap-8 admin-items-center"
                      style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4 }}
                    >
                      <input
                        type="checkbox"
                        checked={(newVersion.textResourceIds || []).includes(t.id)}
                        onChange={() => toggleItem('textResourceIds', t.id)}
                      />
                      <span style={{ fontSize: 13, fontFamily: 'monospace' }}>{t.key}</span>
                      <span className="admin-lang-tag" style={{ marginLeft: 'auto' }}>{t.language}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">更新日志</label>
                <textarea
                  className="admin-textarea"
                  value={newVersion.changeLog}
                  onChange={(e) => setNewVersion({ ...newVersion, changeLog: e.target.value })}
                  placeholder="1. 新功能...\n2. 优化...\n3. 修复..."
                  style={{ minHeight: 100 }}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowPublisher(false)}>取消</button>
              <button className="admin-btn admin-btn-primary" onClick={handlePublish}>🚀 确认发布</button>
            </div>
          </div>
        </div>
      )}

      {showRollbackConfirm && rollbackTarget && (
        <div className="admin-modal-overlay" onClick={() => setShowRollbackConfirm(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">⚠️ 确认回滚</div>
              <button className="admin-modal-close" onClick={() => setShowRollbackConfirm(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: 16,
                fontSize: 14,
                lineHeight: 1.8,
              }}>
                <p style={{ marginBottom: 12, fontWeight: 600, color: 'var(--admin-danger)' }}>
                  即将回滚到版本：{rollbackTarget.version}
                </p>
                <p style={{ marginBottom: 8 }}>{rollbackTarget.name}</p>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>
                  此操作将：
                </p>
                <ul style={{ fontSize: 13, color: 'var(--admin-text-secondary)', paddingLeft: 20, marginTop: 8 }}>
                  <li>创建一个新的回滚版本</li>
                  <li>当前发布版本将自动归档</li>
                  <li>所有配置将恢复到所选版本的状态</li>
                </ul>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setShowRollbackConfirm(false)}>取消</button>
              <button className="admin-btn admin-btn-danger" onClick={handleRollback}>🔄 确认回滚</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
