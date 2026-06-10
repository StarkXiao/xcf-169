import { useMemo } from 'react'
import type { RoguelikeGameResult } from '../types/roguelike'
import { REWARD_NODES, getRarityColor, getRarityLabel } from '../game/roguelike/RewardTreeSystem'
import { formatElapsedTime } from '../game/roguelike/SettlementSystem'

interface RoguelikeResultPanelProps {
  result: RoguelikeGameResult
  onRestart: () => void
  onBackToMenu: () => void
}

function RoguelikeResultPanel({ result, onRestart, onBackToMenu }: RoguelikeResultPanelProps) {
  const grade = useMemo(() => {
    const maxScore = 50000
    const ratio = result.totalScore / maxScore
    if (result.victory && ratio >= 0.8) return { grade: 'S+', color: '#fbbf24' }
    if (result.victory && ratio >= 0.6) return { grade: 'S', color: '#fbbf24' }
    if (result.victory && ratio >= 0.4) return { grade: 'A', color: '#f97316' }
    if (ratio >= 0.5) return { grade: 'A', color: '#f97316' }
    if (ratio >= 0.3) return { grade: 'B', color: '#60a5fa' }
    if (ratio >= 0.15) return { grade: 'C', color: '#4ade80' }
    if (result.success) return { grade: 'D', color: '#94a3b8' }
    return { grade: 'F', color: '#ef4444' }
  }, [result])

  const healthPercent = (result.healthRemaining / result.maxHealth) * 100
  const accuracy = result.eventsCompleted > 0 ? (result.perfectEvents / result.eventsCompleted) * 100 : 0

  const achievements = useMemo(() => {
    const list: { id: string; name: string; icon: string; description: string }[] = []
    if (result.victory) {
      list.push({ id: 'cv', name: '钟楼征服者', icon: '🏆', description: '成功登顶钟楼！' })
    }
    if (result.perfectEvents >= 5) {
      list.push({ id: 'p5', name: '完美校准师', icon: '💯', description: `${result.perfectEvents}次完美校准` })
    }
    if (result.floorsCleared >= 5) {
      list.push({ id: 'f5', name: '深入探索者', icon: '🗺️', description: `通过${result.floorsCleared}层` })
    }
    if (result.trapsTriggered === 0 && result.eventsCompleted > 0) {
      list.push({ id: 'nt', name: '机关大师', icon: '🎯', description: '未触发任何陷阱' })
    }
    if (result.healthRemaining === result.maxHealth && result.eventsCompleted > 3) {
      list.push({ id: 'fh', name: '无伤巡夜', icon: '🛡️', description: '全程无伤' })
    }
    if (result.rarityUnlocked.includes('chronoHeart')) {
      list.push({ id: 'ch', name: '时空之心', icon: '💎', description: '获得传说奖励' })
    }
    if (result.totalScore >= 30000) {
      list.push({ id: 'hs', name: '高分王者', icon: '👑', description: `${result.totalScore}分` })
    }
    return list
  }, [result])

  return (
    <div className="gameover-panel">
      <div
        className={`patrol-result-card ${result.victory ? 'victory' : 'defeat'}`}
        style={{
          maxWidth: '720px',
          width: '92%',
          padding: '32px',
          borderRadius: '16px',
          background: result.victory
            ? 'linear-gradient(135deg, rgba(60,50,20,0.95) 0%, rgba(30,25,15,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(50,20,20,0.95) 0%, rgba(30,15,15,0.95) 100%)',
          border: `2px solid ${result.victory ? 'rgba(251,191,36,0.5)' : 'rgba(239,68,68,0.4)'}`,
          boxShadow: `0 8px 40px ${result.victory ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.2)'}`,
        }}
      >
        <div className="result-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', color: result.victory ? '#fbbf24' : '#ef4444', marginBottom: '8px', textShadow: result.victory ? '0 0 20px rgba(251,191,36,0.4)' : 'none' }}>
            {result.victory ? '🏆 钟楼巡夜成功！' : '💀 巡夜失败'}
          </h1>
          <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 'bold', color: grade.color, textShadow: `0 0 25px ${grade.color}55` }}>
            评级 {grade.grade}
          </div>
        </div>

        <div className="score-display" style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.9rem', color: '#8b7d5c', marginBottom: '4px' }}>🏆 最终得分</div>
          <div style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', fontWeight: 'bold', color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.35)' }}>
            {result.totalScore.toLocaleString()}
          </div>
        </div>

        <div className="result-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: '🏰 通过楼层', value: `${result.floorsCleared}层` },
            { label: '⚙️ 完成事件', value: `${result.eventsCompleted}件` },
            { label: '💯 完美校准', value: `${result.perfectEvents}次 (${accuracy.toFixed(0)}%)` },
            { label: '🪤 触发陷阱', value: `${result.trapsTriggered}次` },
            { label: '🌤 遭遇天气', value: `${result.weathersEncountered}次` },
            { label: '❤️ 剩余生命', value: `${result.healthRemaining}/${result.maxHealth}` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '0.75rem', color: '#8b7d5c', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e8d5a3' }}>{s.value}</div>
            </div>
          ))}
          <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: '#8b7d5c', marginBottom: '4px' }}>⏱️ 用时</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e8d5a3' }}>{formatElapsedTime(result.elapsedSeconds)}</div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ height: '8px', background: '#1a0f0f', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${healthPercent}%`,
                height: '100%',
                background: healthPercent > 50 ? 'linear-gradient(90deg,#4ade80,#22c55e)' : healthPercent > 25 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#ef4444,#dc2626)',
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>

        {result.rarityUnlocked.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#c0b090', marginBottom: '10px' }}>🎁 获得奖励 ({result.rarityUnlocked.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.rarityUnlocked.map((r) => {
                const node = REWARD_NODES[r]
                if (!node) return null
                return (
                  <span
                    key={r}
                    style={{
                      padding: '6px 12px',
                      border: `2px solid ${getRarityColor(node.rarity)}`,
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      background: `${getRarityColor(node.rarity)}15`,
                      color: '#e8d5a3',
                    }}
                  >
                    {node.icon} {node.displayName}
                    <span style={{ marginLeft: '6px', color: getRarityColor(node.rarity), fontSize: '0.7rem' }}>
                      {getRarityLabel(node.rarity)}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {achievements.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#c0b090', marginBottom: '10px' }}>🏅 解锁成就 ({achievements.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {achievements.map((a) => (
                <div key={a.id} style={{ padding: '12px', background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.8rem' }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fbbf24' }}>{a.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c0a870', lineHeight: '1.4' }}>{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-tips" style={{ padding: '16px', background: 'rgba(74,222,128,0.05)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.15)', marginBottom: '24px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#86efac', marginBottom: '8px' }}>💡 巡夜笔记</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {result.damageTaken > 50 && <li style={{ padding: '4px 0 4px 20px', position: 'relative', fontSize: '0.85rem', color: '#a0c090' }}><span style={{ position: 'absolute', left: 0 }}>•</span> 注意躲避陷阱！解锁「故障抗性」或「谨慎之心」很有帮助。</li>}
            {result.weathersEncountered > 3 && result.healthRemaining < result.maxHealth * 0.5 && <li style={{ padding: '4px 0 4px 20px', position: 'relative', fontSize: '0.85rem', color: '#a0c090' }}><span style={{ position: 'absolute', left: 0 }}>•</span> 天气事件很致命，「晴雨斗篷」和「顺风而行」效果显著。</li>}
            {result.perfectEvents === 0 && result.eventsCompleted > 0 && <li style={{ padding: '4px 0 4px 20px', position: 'relative', fontSize: '0.85rem', color: '#a0c090' }}><span style={{ position: 'absolute', left: 0 }}>•</span> 尝试更精准的校准，完美校准有大量额外分数。</li>}
            {result.floorsCleared < 3 && <li style={{ padding: '4px 0 4px 20px', position: 'relative', fontSize: '0.85rem', color: '#a0c090' }}><span style={{ position: 'absolute', left: 0 }}>•</span> 循序渐进，先熟悉齿轮操作再挑战高层。</li>}
            {achievements.length === 0 && <li style={{ padding: '4px 0 4px 20px', position: 'relative', fontSize: '0.85rem', color: '#a0c090' }}><span style={{ position: 'absolute', left: 0 }}>•</span> 继续挑战，解锁更多成就和传说奖励！</li>}
          </ul>
        </div>

        <div className="result-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="restart-btn" onClick={onRestart}>
            🔄 再次巡夜
          </button>
          <button
            className="start-btn"
            style={{
              background: 'linear-gradient(180deg, #2d3a50 0%, #1a2538 100%)',
              borderColor: '#5d7aaa',
              color: '#b0c8f0',
            }}
            onClick={onBackToMenu}
          >
            🏠 返回主菜单
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoguelikeResultPanel
