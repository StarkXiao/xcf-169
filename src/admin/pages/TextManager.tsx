import { useState, useMemo } from 'react'
import { mockTextResources } from '../mockData'
import type { TextResource, TextCategory } from '../../types/admin'

const categoryMap: Record<TextCategory, string> = {
  ui: 'UI文本',
  level_intro: '关卡开场',
  tutorial: '教程引导',
  story: '剧情文本',
  tooltip: '提示说明',
  achievement: '成就描述',
  error: '错误提示',
}

const langMap: Record<string, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
  'ja-JP': '日本語',
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function TextManager() {
  const [texts, setTexts] = useState<TextResource[]>(mockTextResources)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterLang, setFilterLang] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'group'>('group')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<TextResource | null>(null)

  const filteredTexts = useMemo(() => {
    return texts.filter((t) => {
      if (search && !t.key.includes(search) && !t.content.includes(search) && !t.description.includes(search)) {
        return false
      }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (filterLang !== 'all' && t.language !== filterLang) return false
      return true
    })
  }, [texts, search, filterCategory, filterLang])

  const groupedByKey = useMemo(() => {
    const map = new Map<string, TextResource[]>()
    filteredTexts.forEach((t) => {
      if (!map.has(t.key)) map.set(t.key, [])
      map.get(t.key)!.push(t)
    })
    return Array.from(map.entries())
  }, [filteredTexts])

  const handleCreate = () => {
    const newText: TextResource = {
      id: `txt_${Date.now()}`,
      key: 'ui.new_text',
      category: 'ui',
      language: 'zh-CN',
      content: '',
      description: '',
      variables: [],
      version: 1,
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'admin',
    }
    setEditing(newText)
    setShowEditor(true)
  }

  const handleSave = () => {
    if (!editing) return
    const isNew = !texts.find((t) => t.id === editing.id)
    if (isNew) {
      setTexts([editing, ...texts])
    } else {
      setTexts(texts.map((t) => (t.id === editing.id ? { ...editing, updatedAt: Date.now(), version: t.version + 1 } : t)))
    }
    setShowEditor(false)
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定删除此文案吗？')) {
      setTexts(texts.filter((t) => t.id !== id))
    }
  }

  const getMissingLangs = (group: TextResource[]) => {
    const existing = new Set(group.map((t) => t.language))
    return (Object.keys(langMap) as TextResource['language'][]).filter((l) => !existing.has(l))
  }

  const addTranslation = (key: string, lang: string) => {
    const existing = texts.find((t) => t.key === key)
    if (!existing) return
    const newText: TextResource = {
      ...existing,
      id: `txt_${Date.now()}`,
      key,
      language: lang as TextResource['language'],
      content: '',
      description: existing.description,
      variables: existing.variables,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'admin',
    }
    setEditing(newText)
    setShowEditor(true)
  }

  return (
    <div>
      <div className="admin-search-bar">
        <input
          className="admin-input"
          placeholder="搜索文案 Key 或内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select admin-filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">全部分类</option>
          {Object.entries(categoryMap).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="admin-select admin-filter-select"
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
        >
          <option value="all">全部语言</option>
          {Object.entries(langMap).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <div className="admin-tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
          <div
            className={`admin-tab ${viewMode === 'group' ? 'active' : ''}`}
            onClick={() => setViewMode('group')}
          >
            按 Key 分组
          </div>
          <div
            className={`admin-tab ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            列表视图
          </div>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>+ 新建文案</button>
      </div>

      {viewMode === 'group' ? (
        <div className="admin-card">
          <div className="admin-card-body" style={{ padding: 0 }}>
            {groupedByKey.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-state-icon">📝</div>
                <div className="admin-empty-state-text">没有找到匹配的文案</div>
              </div>
            ) : (
              groupedByKey.map(([key, group]) => {
                const first = group[0]
                const missing = getMissingLangs(group)
                return (
                  <div key={key} className="admin-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div className="admin-flex admin-justify-between admin-items-center" style={{ marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{key}</div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                          <span className="admin-tag">{categoryMap[first.category]}</span>
                          {first.description}
                        </div>
                      </div>
                      <div className="admin-flex admin-gap-8 admin-items-center">
                        {first.variables.length > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>
                            变量: {first.variables.map((v) => `{${v}}`).join(', ')}
                          </span>
                        )}
                        {missing.length > 0 && (
                          <span style={{ fontSize: 12, color: 'var(--admin-warning)' }}>
                            缺少: {missing.map((l) => langMap[l]).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="admin-flex admin-gap-8" style={{ flexWrap: 'wrap' }}>
                      {group.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            flex: 1,
                            minWidth: 240,
                            background: 'var(--admin-bg)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: 6,
                            padding: 12,
                          }}
                        >
                          <div className="admin-flex admin-justify-between admin-items-center" style={{ marginBottom: 8 }}>
                            <div className="admin-text-multilang">
                              <span className="admin-lang-tag">{t.language}</span>
                              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                                {langMap[t.language]} v{t.version}
                              </span>
                            </div>
                            <div className="admin-flex admin-gap-8">
                              <button className="admin-btn admin-btn-sm admin-btn-ghost" onClick={() => { setEditing({ ...t }); setShowEditor(true) }}>
                                编辑
                              </button>
                              <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(t.id)}>
                                删除
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.6, minHeight: 36 }}>
                            {t.content || <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>（未填写）</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 8 }}>
                            更新于 {formatDate(t.updatedAt)} · {t.author}
                          </div>
                        </div>
                      ))}
                      {missing.length > 0 && (
                        <div
                          style={{
                            minWidth: 240,
                            border: '1px dashed var(--admin-border)',
                            borderRadius: 6,
                            padding: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--admin-text-muted)',
                            fontSize: 13,
                          }}
                          onClick={() => addTranslation(key, missing[0])}
                        >
                          + 添加 {langMap[missing[0]]} 翻译
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-body" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>分类</th>
                  <th>语言</th>
                  <th>内容</th>
                  <th>版本</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTexts.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.key}</td>
                    <td><span className="admin-tag">{categoryMap[t.category]}</span></td>
                    <td>
                      <div className="admin-text-multilang">
                        <span className="admin-lang-tag">{t.language}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.content}
                    </td>
                    <td>v{t.version}</td>
                    <td>
                      <span className={`admin-badge ${t.enabled ? 'admin-badge-enabled' : 'admin-badge-disabled'}`}>
                        {t.enabled ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td>{formatDate(t.updatedAt)}</td>
                    <td>
                      <div className="admin-flex admin-gap-8">
                        <button className="admin-btn admin-btn-sm" onClick={() => { setEditing({ ...t }); setShowEditor(true) }}>编辑</button>
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(t.id)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEditor && editing && (
        <div className="admin-modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">
                {texts.find((t) => t.id === editing.id) ? '编辑文案' : '新建文案'}
              </div>
              <button className="admin-modal-close" onClick={() => setShowEditor(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">Key</label>
                  <input
                    className="admin-input"
                    value={editing.key}
                    onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                    placeholder="例：ui.start_game"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">语言</label>
                  <select
                    className="admin-select"
                    value={editing.language}
                    onChange={(e) => setEditing({ ...editing, language: e.target.value as TextResource['language'] })}
                  >
                    {Object.entries(langMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label className="admin-form-label">分类</label>
                  <select
                    className="admin-select"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value as TextCategory })}
                  >
                    {Object.entries(categoryMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
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
                <label className="admin-form-label">描述</label>
                <input
                  className="admin-input"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="这段文案的用途说明"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">文案内容</label>
                <textarea
                  className="admin-textarea"
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  style={{ minHeight: 100 }}
                  placeholder="支持 {变量名} 格式的动态变量"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">变量列表（以逗号分隔）</label>
                <input
                  className="admin-input"
                  value={editing.variables.join(', ')}
                  onChange={(e) => setEditing({ ...editing, variables: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="例：name, score, level"
                />
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
