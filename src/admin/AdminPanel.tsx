import { useState } from 'react'
import type { AdminPage } from '../types/admin'
import Dashboard from './pages/Dashboard'
import LevelManager from './pages/LevelManager'
import EventManager from './pages/EventManager'
import DifficultyManager from './pages/DifficultyManager'
import TextManager from './pages/TextManager'
import VersionManager from './pages/VersionManager'
import '../styles/admin.css'

interface NavItem {
  id: AdminPage
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: '📊' },
  { id: 'levels', label: '关卡配置', icon: '🎮' },
  { id: 'events', label: '事件模板', icon: '⚡' },
  { id: 'difficulty', label: '难度曲线', icon: '📈' },
  { id: 'texts', label: '文案资源', icon: '📝' },
  { id: 'versions', label: '版本管理', icon: '🏷️' },
]

const pageTitles: Record<AdminPage, { title: string; desc: string }> = {
  dashboard: { title: '仪表盘', desc: '钟楼运维控制台总览' },
  levels: { title: '关卡配置管理', desc: '管理游戏中的所有关卡配置' },
  events: { title: '事件模板管理', desc: '配置游戏中的故障、天气、奖励等事件' },
  difficulty: { title: '难度曲线配置', desc: '调整不同难度等级的参数曲线' },
  texts: { title: '文案资源管理', desc: '管理多语言文案、剧情文本和UI文字' },
  versions: { title: '版本发布与回滚', desc: '管理配置版本，支持发布、归档和回滚' },
}

export default function AdminPanel() {
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'levels': return <LevelManager />
      case 'events': return <EventManager />
      case 'difficulty': return <DifficultyManager />
      case 'texts': return <TextManager />
      case 'versions': return <VersionManager />
    }
  }

  const pageInfo = pageTitles[currentPage]

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">🕰️</div>
          <div>
            <div className="admin-sidebar-title">钟楼运维</div>
            <div className="admin-sidebar-subtitle">Clock Tower Ops</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`admin-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          v1.2.0-beta · 钟楼守时人
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">{pageInfo.title}</div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-ghost admin-btn-sm">
              🔔 通知
            </button>
            <div className="admin-user-info">
              <div className="admin-user-avatar">管</div>
              <span>管理员</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">{pageInfo.title}</h1>
              <p className="admin-page-desc">{pageInfo.desc}</p>
            </div>
          </div>

          {renderPage()}
        </div>
      </div>
    </div>
  )
}
