import { mockDashboardStats, mockLevels, mockVersions } from '../mockData'

function formatDate(ts?: number) {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getTrendIcon(trend: 'up' | 'down' | 'flat') {
  if (trend === 'up') return '↑'
  if (trend === 'down') return '↓'
  return '→'
}

function getTrendClass(trend: 'up' | 'down' | 'flat') {
  if (trend === 'up') return 'admin-stat-trend-up'
  if (trend === 'down') return 'admin-stat-trend-down'
  return 'admin-stat-trend-flat'
}

export default function Dashboard() {
  const stats = mockDashboardStats
  const recentLevels = [...mockLevels].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3)
  const recentVersions = [...mockVersions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3)

  return (
    <div>
      <div className="admin-dashboard-grid">
        {stats.quickStats.map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-label">{s.label}</div>
            <div className="admin-stat-value">{s.value}</div>
            <div className={`admin-stat-trend ${getTrendClass(s.trend)}`}>
              {getTrendIcon(s.trend)} {s.trendValue} 较上周
            </div>
          </div>
        ))}
      </div>

      <div className="admin-two-col">
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">最近编辑的关卡</div>
            <button className="admin-btn admin-btn-sm admin-btn-ghost">查看全部 →</button>
          </div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            {recentLevels.map((level) => (
              <div key={level.id} className="admin-list-item">
                <div className="admin-list-item-info">
                  <div className="admin-list-item-title">
                    {level.displayName}
                    <span style={{ marginLeft: 8 }}>
                      <span className={`admin-badge admin-badge-${level.status}`}>
                        {level.status === 'draft' ? '草稿' : level.status === 'testing' ? '测试中' : '已发布'}
                      </span>
                    </span>
                  </div>
                  <div className="admin-list-item-meta">
                    {level.gameMode === 'classic' ? '经典模式' : level.gameMode === 'patrol' ? '夜巡模式' : '多钟模式'}
                    {' · '}时长 {level.duration}s
                    {' · '}更新于 {formatDate(level.updatedAt)}
                  </div>
                </div>
                <div className="admin-list-item-actions">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">编辑</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">最近版本</div>
            <button className="admin-btn admin-btn-sm admin-btn-ghost">版本管理 →</button>
          </div>
          <div className="admin-card-body" style={{ padding: 0 }}>
            {recentVersions.map((v) => (
              <div key={v.id} className="admin-list-item">
                <div className="admin-list-item-info">
                  <div className="admin-list-item-title">
                    {v.version} · {v.name}
                    <span style={{ marginLeft: 8 }}>
                      <span className={`admin-badge admin-badge-${v.status}`}>
                        {v.status === 'draft' ? '草稿' : v.status === 'published' ? '已发布' : v.status === 'archived' ? '已归档' : '已回滚'}
                      </span>
                    </span>
                  </div>
                  <div className="admin-list-item-meta">
                    {v.levelIds.length} 个关卡 · {v.eventTemplateIds.length} 个事件
                    {' · '}创建于 {formatDate(v.createdAt)}
                  </div>
                </div>
                <div className="admin-list-item-actions">
                  <button className="admin-btn admin-btn-sm admin-btn-ghost">详情</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card admin-mt-24">
        <div className="admin-card-header">
          <div className="admin-card-title">核心数据概览</div>
        </div>
        <div className="admin-card-body">
          <table className="admin-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>总数</th>
                <th>已启用/发布</th>
                <th>最后更新</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🎮 关卡配置</td>
                <td>{stats.totalLevels}</td>
                <td>{stats.publishedLevels}</td>
                <td>{formatDate(stats.lastPublishedAt)}</td>
                <td><button className="admin-btn admin-btn-sm admin-btn-ghost">去管理</button></td>
              </tr>
              <tr>
                <td>⚡ 事件模板</td>
                <td>{stats.totalEvents}</td>
                <td>4</td>
                <td>2 天前</td>
                <td><button className="admin-btn admin-btn-sm admin-btn-ghost">去管理</button></td>
              </tr>
              <tr>
                <td>📈 难度曲线</td>
                <td>4</td>
                <td>3</td>
                <td>5 天前</td>
                <td><button className="admin-btn admin-btn-sm admin-btn-ghost">去管理</button></td>
              </tr>
              <tr>
                <td>📝 文案资源</td>
                <td>{stats.totalTexts}</td>
                <td>12</td>
                <td>2 天前</td>
                <td><button className="admin-btn admin-btn-sm admin-btn-ghost">去管理</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
