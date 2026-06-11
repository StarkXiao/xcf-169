import { useState, useMemo } from 'react'
import { clocktowerRecordSystem } from '../game/ClocktowerRecordSystem'
import type { CalibrationRecord, RecordGameMode } from '../types'

interface ClocktowerLedgerPanelProps {
  onClose: () => void
}

type TabType = 'records' | 'bestPaths' | 'stats'
type ModeFilter = 'all' | RecordGameMode

const MODE_NAMES: Record<RecordGameMode, string> = {
  classic: '经典校时',
  patrol: '钟楼巡夜',
  multiclock: '多钟面连锁',
  training: '训练营',
  roguelike: '钟楼巡检',
  duoCoop: '双人协作',
  continuousShift: '连续值班',
  custom: '自定义关卡',
}

function ClocktowerLedgerPanel({ onClose }: ClocktowerLedgerPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('records')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')
  const [selectedRecord, setSelectedRecord] = useState<CalibrationRecord | null>(null)

  const stats = useMemo(() => clocktowerRecordSystem.getStatsSummary(), [])
  const gradeDistribution = useMemo(() => clocktowerRecordSystem.getGradeDistribution(), [])

  const records = useMemo(() => {
    if (modeFilter === 'all') {
      return clocktowerRecordSystem.getRecentRecords(50)
    }
    return clocktowerRecordSystem.getRecordsByMode(modeFilter, 50)
  }, [modeFilter])

  const bestPaths = useMemo(() => {
    if (modeFilter === 'all') {
      return clocktowerRecordSystem.getState().bestPaths
    }
    return clocktowerRecordSystem.getBestPathsByMode(modeFilter)
  }, [modeFilter])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分`
    }
    return `${minutes}分钟`
  }

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case 'S': return '#ffd700'
      case 'A': return '#ff8c00'
      case 'B': return '#32cd32'
      case 'C': return '#1e90ff'
      case 'D': return '#9370db'
      case 'F': return '#dc143c'
      default: return '#8b7d5c'
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return '#32cd32'
    if (rate >= 0.5) return '#ffd700'
    return '#dc143c'
  }

  return (
    <div className="clocktower-ledger-panel">
      <div className="ledger-header">
        <h2 className="ledger-title">📜 钟楼名册</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="ledger-tabs">
        <button
          className={`ledger-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          📋 校时记录
        </button>
        <button
          className={`ledger-tab ${activeTab === 'bestPaths' ? 'active' : ''}`}
          onClick={() => setActiveTab('bestPaths')}
        >
          🏆 最佳路径
        </button>
        <button
          className={`ledger-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 数据统计
        </button>
      </div>

      <div className="ledger-filter">
        <span className="filter-label">筛选模式：</span>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${modeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setModeFilter('all')}
          >
            全部
          </button>
          {(['classic', 'patrol', 'multiclock'] as RecordGameMode[]).map((mode) => (
            <button
              key={mode}
              className={`filter-btn ${modeFilter === mode ? 'active' : ''}`}
              onClick={() => setModeFilter(mode)}
            >
              {MODE_NAMES[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="ledger-content">
        {activeTab === 'records' && (
          <div className="records-list">
            {records.length === 0 ? (
              <div className="empty-state">
                <p>暂无校时记录</p>
                <p className="empty-hint">开始游戏后，你的校时记录将显示在这里</p>
              </div>
            ) : (
              records.map((record) => (
                <div
                  key={record.id}
                  className={`record-item ${record.success ? 'success' : 'failed'}`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="record-icon">
                    {record.success ? '✅' : '❌'}
                  </div>
                  <div className="record-info">
                    <div className="record-header">
                      <span className="record-mode">{MODE_NAMES[record.gameMode] || record.gameMode}</span>
                      <span className="record-date">{formatDate(record.timestamp)}</span>
                    </div>
                    <div className="record-score">
                      <span className="score-label">得分</span>
                      <span className="score-value">{record.score}</span>
                    </div>
                    <div className="record-details">
                      {record.grade && (
                        <span
                          className="record-grade"
                          style={{ color: getGradeColor(record.grade) }}
                        >
                          {record.grade}级
                        </span>
                      )}
                      <span className="record-time">用时 {formatTime(record.timeUsed)}</span>
                      <span className="record-deviation">偏差 {record.deviationMinutes.toFixed(1)}分</span>
                    </div>
                  </div>
                  {record.isPerfect && (
                    <div className="perfect-badge">⭐ 完美</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'bestPaths' && (
          <div className="best-paths-list">
            {bestPaths.length === 0 ? (
              <div className="empty-state">
                <p>暂无最佳路径记录</p>
                <p className="empty-hint">成功通关后，最佳路径将保存在这里</p>
              </div>
            ) : (
              bestPaths
                .sort((a, b) => b.bestScore - a.bestScore)
                .map((path) => (
                  <div key={path.id} className="best-path-item">
                    <div className="best-path-header">
                      <span className="best-path-name">
                        {path.levelName || MODE_NAMES[path.gameMode] || '未知关卡'}
                      </span>
                      <span className="best-path-mode">{MODE_NAMES[path.gameMode] || path.gameMode}</span>
                    </div>
                    <div className="best-path-stats">
                      <div className="path-stat">
                        <span className="path-stat-label">最高分</span>
                        <span className="path-stat-value score-value">{path.bestScore}</span>
                      </div>
                      <div className="path-stat">
                        <span className="path-stat-label">最快用时</span>
                        <span className="path-stat-value">{path.bestTime === Infinity ? '--' : formatTime(path.bestTime)}</span>
                      </div>
                      <div className="path-stat">
                        <span className="path-stat-label">最小偏差</span>
                        <span className="path-stat-value">{path.bestDeviation === Infinity ? '--' : `${path.bestDeviation.toFixed(1)}分`}</span>
                      </div>
                      <div className="path-stat">
                        <span className="path-stat-label">尝试次数</span>
                        <span className="path-stat-value">{path.attempts}次</span>
                      </div>
                    </div>
                    {path.isPerfect && (
                      <div className="best-path-perfect">
                        <span>⭐ 完美通关记录</span>
                      </div>
                    )}
                    {path.bestGrade && (
                      <div className="best-path-grade">
                        <span style={{ color: getGradeColor(path.bestGrade) }}>
                          最佳评级：{path.bestGrade}级
                        </span>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">🎮</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{stats.totalGamesPlayed}</div>
                  <div className="stat-card-label">总游戏次数</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">✅</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{stats.totalSuccesses}</div>
                  <div className="stat-card-label">成功次数</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">📈</div>
                <div className="stat-card-info">
                  <div className="stat-card-value" style={{ color: getSuccessRateColor(stats.successRate) }}>
                    {(stats.successRate * 100).toFixed(1)}%
                  </div>
                  <div className="stat-card-label">成功率</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🏆</div>
                <div className="stat-card-info">
                  <div className="stat-card-value score-value">{stats.highestScore}</div>
                  <div className="stat-card-label">最高得分</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">⭐</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{stats.totalPerfectClears}</div>
                  <div className="stat-card-label">完美通关</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">⏱️</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">
                    {stats.fastestClearSeconds ? formatTime(stats.fastestClearSeconds) : '--'}
                  </div>
                  <div className="stat-card-label">最快通关</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🎯</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">
                    {stats.lowestDeviationMinutes !== null ? `${stats.lowestDeviationMinutes.toFixed(1)}分` : '--'}
                  </div>
                  <div className="stat-card-label">最小偏差</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🔥</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{stats.highestCombo}</div>
                  <div className="stat-card-label">最高连击</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">💎</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{stats.mostPerfectSnaps}</div>
                  <div className="stat-card-label">最多完美咬合</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🕐</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{formatPlayTime(stats.totalPlayTimeSeconds)}</div>
                  <div className="stat-card-label">总游戏时长</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">💰</div>
                <div className="stat-card-info">
                  <div className="stat-card-value score-value">{stats.totalScoreEarned}</div>
                  <div className="stat-card-label">累计得分</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">🗺️</div>
                <div className="stat-card-info">
                  <div className="stat-card-value">{stats.uniqueLevelsPlayed}</div>
                  <div className="stat-card-label">探索关卡数</div>
                </div>
              </div>
            </div>

            {Object.keys(gradeDistribution).length > 0 && (
              <div className="grade-distribution">
                <h3 className="section-title">📊 评级分布</h3>
                <div className="grade-bars">
                  {['S', 'A', 'B', 'C', 'D', 'F'].map((grade) => {
                    const count = gradeDistribution[grade] || 0
                    const maxCount = Math.max(...Object.values(gradeDistribution), 1)
                    const percentage = (count / maxCount) * 100
                    return (
                      <div key={grade} className="grade-bar-row">
                        <span className="grade-label" style={{ color: getGradeColor(grade) }}>
                          {grade}
                        </span>
                        <div className="grade-bar-container">
                          <div
                            className="grade-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: getGradeColor(grade),
                            }}
                          />
                        </div>
                        <span className="grade-count">{count}次</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="record-detail-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="record-detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-header">
              <h3>校时详情</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="detail-content">
              <div className="detail-row">
                <span className="detail-label">游戏模式</span>
                <span className="detail-value">{MODE_NAMES[selectedRecord.gameMode] || selectedRecord.gameMode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">结果</span>
                <span className={`detail-value ${selectedRecord.success ? 'success' : 'failed'}`}>
                  {selectedRecord.success ? '成功' : '失败'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">得分</span>
                <span className="detail-value score-value">{selectedRecord.score}</span>
              </div>
              {selectedRecord.grade && (
                <div className="detail-row">
                  <span className="detail-label">评级</span>
                  <span className="detail-value" style={{ color: getGradeColor(selectedRecord.grade) }}>
                    {selectedRecord.grade}级
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">用时</span>
                <span className="detail-value">{formatTime(selectedRecord.timeUsed)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">偏差</span>
                <span className="detail-value">{selectedRecord.deviationMinutes.toFixed(2)}分钟</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">最高连击</span>
                <span className="detail-value">{selectedRecord.highestCombo}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">完美咬合</span>
                <span className="detail-value">{selectedRecord.perfectSnaps}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">总操作次数</span>
                <span className="detail-value">{selectedRecord.totalRotations}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">故障次数</span>
                <span className="detail-value" style={{ color: '#e85a5a' }}>{selectedRecord.faultCount}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">是否完美</span>
                <span className="detail-value">{selectedRecord.isPerfect ? '⭐ 是' : '否'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">记录时间</span>
                <span className="detail-value">{new Date(selectedRecord.timestamp).toLocaleString('zh-CN')}</span>
              </div>
              {selectedRecord.periodsCleared !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">完成时段</span>
                  <span className="detail-value">{selectedRecord.periodsCleared}/{selectedRecord.totalPeriods}</span>
                </div>
              )}
              {selectedRecord.pathSteps !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">操作步数</span>
                  <span className="detail-value">{selectedRecord.pathSteps}步</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClocktowerLedgerPanel
