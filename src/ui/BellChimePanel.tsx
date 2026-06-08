import { useState, useEffect, useRef, useMemo } from 'react'
import { bellChimeSystem } from '../game/BellChimeSystem'
import type {
  BellChimePreset,
  BellChimeWorkshopState,
  BellNotePitch,
  HarmonyLayerConfig,
  BellTriggerCondition,
  RhythmPatternConfig,
  HarmonyType,
} from '../types'
import { BELL_NOTE_FREQUENCIES } from '../types'
import { soundManager } from '../game/SoundManager'

interface BellChimePanelProps {
  onClose: () => void
}

type TabType = 'presets' | 'rhythm' | 'harmony' | 'triggers'

const PITCH_OPTIONS: { value: BellNotePitch; label: string }[] = (
  Object.keys(BELL_NOTE_FREQUENCIES) as BellNotePitch[]
).map((p) => ({ value: p, label: p }))

const HARMONY_TYPE_OPTIONS: { value: HarmonyType; label: string }[] = [
  { value: 'unison', label: '单音' },
  { value: 'third', label: '三度' },
  { value: 'fifth', label: '五度' },
  { value: 'octave', label: '八度' },
  { value: 'triad', label: '三和弦' },
  { value: 'seventh', label: '七和弦' },
]

function BellChimePanel({ onClose }: BellChimePanelProps) {
  const [state, setState] = useState<BellChimeWorkshopState>(bellChimeSystem.getState())
  const [activeTab, setActiveTab] = useState<TabType>('presets')
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeNote, setActiveNote] = useState<BellNotePitch | null>(null)
  const playStopRef = useRef<{ stop: () => void } | null>(null)

  const currentPreset = useMemo(() => bellChimeSystem.getCurrentPreset(), [state])
  const allPresets = useMemo(() => bellChimeSystem.getAllPresets(), [state])

  const refresh = () => {
    setState(bellChimeSystem.getState())
  }

  useEffect(() => {
    return () => {
      playStopRef.current?.stop()
    }
  }, [])

  const formatScore = (score: number) => {
    if (score >= 10000) return `${(score / 10000).toFixed(1)}万`
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`
    return score.toString()
  }

  const getProgress = (unlockScore: number) => {
    if (unlockScore === 0) return 100
    return Math.min(100, Math.floor((state.totalBellScoreEarned / unlockScore) * 100))
  }

  const handleSelectPreset = (presetId: string) => {
    if (bellChimeSystem.setCurrentPreset(presetId)) {
      refresh()
      stopPlayback()
    }
  }

  const handlePreviewPreset = (preset: BellChimePreset) => {
    if (isPlaying) {
      stopPlayback()
      return
    }
    stopPlayback()
    setIsPlaying(true)
    const playback = soundManager.previewBellPreset(preset, {
      onComplete: () => setIsPlaying(false),
    })
    playStopRef.current = playback
  }

  const stopPlayback = () => {
    playStopRef.current?.stop()
    setIsPlaying(false)
    setActiveNote(null)
  }

  const handlePlaySinglePitch = (pitch: BellNotePitch) => {
    soundManager.playSingleBellPitch(pitch, 1.2, 0.7)
    setActiveNote(pitch)
    setTimeout(() => setActiveNote(null), 300)
  }

  const handleUpdateHarmonyLayer = (layer: HarmonyLayerConfig) => {
    bellChimeSystem.updateHarmonyLayer(layer)
    refresh()
  }

  const handleToggleHarmonyLayer = (layerId: string, enabled: boolean) => {
    bellChimeSystem.toggleHarmonyLayer(layerId, enabled)
    refresh()
  }

  const handleUpdateTrigger = (trigger: BellTriggerCondition) => {
    bellChimeSystem.updateTrigger(trigger)
    refresh()
  }

  const handleToggleTrigger = (triggerId: string, enabled: boolean) => {
    bellChimeSystem.toggleTrigger(triggerId, enabled)
    refresh()
  }

  const handleUpdateRhythm = (pattern: RhythmPatternConfig) => {
    bellChimeSystem.updateRhythmPattern(pattern)
    refresh()
  }

  const handleCreateCustom = () => {
    const name = prompt('输入自定义钟声名称：', '我的钟声')
    if (!name) return
    const preset = bellChimeSystem.createCustomPreset({
      displayName: name,
      name: name.toLowerCase().replace(/\s+/g, '_'),
    })
    bellChimeSystem.setCurrentPreset(preset.id)
    refresh()
  }

  const handleDeleteCustom = (presetId: string) => {
    if (confirm('确定要删除这个自定义钟声吗？')) {
      bellChimeSystem.deleteCustomPreset(presetId)
      refresh()
    }
  }

  const renderPresetsTab = () => (
    <div className="bell-tab-content">
      <div className="bell-section-header">
        <h3 className="bell-section-title">🔔 钟声预设</h3>
        <button className="bell-add-btn" onClick={handleCreateCustom}>
          + 创建自定义
        </button>
      </div>
      <div className="preset-grid">
        {allPresets.map((preset) => {
          const unlocked = bellChimeSystem.isPresetUnlocked(preset.id)
          const selected = state.currentPresetId === preset.id
          const progress = getProgress(preset.unlockScore)
          const isCustom = state.customPresets.some((p) => p.id === preset.id)

          return (
            <div
              key={preset.id}
              className={`preset-card ${selected ? 'selected' : ''} ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="preset-card-header">
                <div className="preset-name">{preset.displayName}</div>
                {isCustom && (
                  <button
                    className="preset-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCustom(preset.id)
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="preset-desc">{preset.description}</div>
              <div className="preset-info">
                <span className="preset-info-tag">
                  {bellChimeSystem.getRhythmPattern(preset.rhythmPatternId)?.displayName ?? '自定义'}
                </span>
                <span className="preset-info-tag">
                  {preset.basePitches.length}音
                </span>
                <span className="preset-info-tag">
                  {bellChimeSystem.getHarmonyLayers(preset.harmonyLayerIds).length}层和声
                </span>
              </div>
              <div className="preset-preview-pitches">
                {preset.basePitches.map((p, i) => (
                  <span
                    key={i}
                    className={`pitch-chip ${activeNote === p ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlaySinglePitch(p)
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              {!unlocked ? (
                <div className="unlock-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="progress-text">
                    {formatScore(state.totalBellScoreEarned)} / {formatScore(preset.unlockScore)}
                  </span>
                </div>
              ) : (
                <div className="preset-actions">
                  <button
                    className={`preset-btn ${selected ? 'primary' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    {selected ? '已选择' : '选择'}
                  </button>
                  <button
                    className={`preset-btn play ${isPlaying ? 'playing' : ''}`}
                    onClick={() => handlePreviewPreset(preset)}
                  >
                    {isPlaying ? '⏹ 停止' : '▶ 试听'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderRhythmTab = () => (
    <div className="bell-tab-content">
      <div className="bell-section-header">
        <h3 className="bell-section-title">🥁 节奏配置</h3>
      </div>
      <div className="rhythm-list">
        {state.rhythmPatterns.map((pattern) => (
          <div key={pattern.id} className="config-card">
            <div className="config-card-header">
              <div className="config-name">{pattern.displayName}</div>
              <div className="config-type-tag">BPM {pattern.bpm}</div>
            </div>
            <div className="config-form">
              <div className="form-row">
                <div className="form-group">
                  <label>速度 (BPM)</label>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    value={pattern.bpm}
                    onChange={(e) =>
                      handleUpdateRhythm({ ...pattern, bpm: Number(e.target.value) })
                    }
                  />
                  <div className="range-value">{pattern.bpm}</div>
                </div>
                <div className="form-group">
                  <label>重复次数</label>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    value={pattern.repeatCount}
                    onChange={(e) =>
                      handleUpdateRhythm({ ...pattern, repeatCount: Number(e.target.value) })
                    }
                  />
                  <div className="range-value">{pattern.repeatCount}</div>
                </div>
              </div>
              <div className="form-group">
                <label>摇摆感 (Swing)</label>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={pattern.swingFactor * 100}
                  onChange={(e) =>
                    handleUpdateRhythm({ ...pattern, swingFactor: Number(e.target.value) / 100 })
                  }
                />
                <div className="range-value">{Math.round(pattern.swingFactor * 100)}%</div>
              </div>
              <div className="rhythm-beats-visual">
                {pattern.beats.map((beat, i) => (
                  <div
                    key={i}
                    className={`beat-indicator accent-${beat.accent} ${beat.rest ? 'rest' : ''}`}
                    title={`拍 ${i + 1}: ${beat.rest ? '休止' : beat.accent === 'strong' ? '强' : beat.accent === 'weak' ? '弱' : '普通'}`}
                  >
                    {beat.rest ? '—' : beat.accent === 'strong' ? '●' : beat.accent === 'weak' ? '○' : '·'}
                  </div>
                ))}
              </div>
              <button
                className="preset-btn play"
                onClick={() => {
                  if (!currentPreset) return
                  const tempPreset: BellChimePreset = { ...currentPreset, rhythmPatternId: pattern.id }
                  handlePreviewPreset(tempPreset)
                }}
              >
                ▶ 试听此节奏
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderHarmonyTab = () => (
    <div className="bell-tab-content">
      <div className="bell-section-header">
        <h3 className="bell-section-title">🎵 和声层次</h3>
      </div>
      <div className="harmony-list">
        {state.harmonyLayers.map((layer) => (
          <div key={layer.id} className={`config-card ${!layer.enabled ? 'disabled' : ''}`}>
            <div className="config-card-header">
              <div className="config-name">{layer.displayName}</div>
              <label className="enable-toggle">
                <input
                  type="checkbox"
                  checked={layer.enabled}
                  onChange={(e) => handleToggleHarmonyLayer(layer.id, e.target.checked)}
                />
                <span>{layer.enabled ? '启用' : '禁用'}</span>
              </label>
            </div>
            <div className="config-form">
              <div className="form-row">
                <div className="form-group">
                  <label>和声类型</label>
                  <select
                    value={layer.harmonyType}
                    onChange={(e) =>
                      handleUpdateHarmonyLayer({ ...layer, harmonyType: e.target.value as HarmonyType })
                    }
                  >
                    {HARMONY_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>基准音高</label>
                  <select
                    value={layer.basePitch}
                    onChange={(e) =>
                      handleUpdateHarmonyLayer({ ...layer, basePitch: e.target.value as BellNotePitch })
                    }
                  >
                    {PITCH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>八度偏移</label>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    value={layer.octaveShift}
                    onChange={(e) =>
                      handleUpdateHarmonyLayer({ ...layer, octaveShift: Number(e.target.value) })
                    }
                  />
                  <div className="range-value">{layer.octaveShift > 0 ? `+${layer.octaveShift}` : layer.octaveShift}</div>
                </div>
                <div className="form-group">
                  <label>微调 (音分)</label>
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    value={layer.detune}
                    onChange={(e) =>
                      handleUpdateHarmonyLayer({ ...layer, detune: Number(e.target.value) })
                    }
                  />
                  <div className="range-value">{layer.detune > 0 ? `+${layer.detune}` : layer.detune}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>音量</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={layer.volume * 100}
                    onChange={(e) =>
                      handleUpdateHarmonyLayer({ ...layer, volume: Number(e.target.value) / 100 })
                    }
                  />
                  <div className="range-value">{Math.round(layer.volume * 100)}%</div>
                </div>
                <div className="form-group">
                  <label>释放时长 (秒)</label>
                  <input
                    type="range"
                    min={20}
                    max={400}
                    value={layer.release * 100}
                    onChange={(e) =>
                      handleUpdateHarmonyLayer({ ...layer, release: Number(e.target.value) / 100 })
                    }
                  />
                  <div className="range-value">{layer.release.toFixed(1)}s</div>
                </div>
              </div>
              <button
                className="preset-btn play"
                onClick={() => {
                  soundManager.playSingleBellPitch(layer.basePitch, 1.5, layer.volume)
                  setActiveNote(layer.basePitch)
                  setTimeout(() => setActiveNote(null), 300)
                }}
              >
                ▶ 试听此层
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderTriggersTab = () => (
    <div className="bell-tab-content">
      <div className="bell-section-header">
        <h3 className="bell-section-title">⚡ 触发条件</h3>
      </div>
      <div className="trigger-list">
        {state.triggers.map((trigger) => (
          <div key={trigger.id} className={`config-card ${!trigger.enabled ? 'disabled' : ''}`}>
            <div className="config-card-header">
              <div className="config-name">{trigger.displayName}</div>
              <label className="enable-toggle">
                <input
                  type="checkbox"
                  checked={trigger.enabled}
                  onChange={(e) => handleToggleTrigger(trigger.id, e.target.checked)}
                />
                <span>{trigger.enabled ? '启用' : '禁用'}</span>
              </label>
            </div>
            <div className="trigger-desc">{trigger.description}</div>
            <div className="config-form">
              <div className="form-row">
                <div className="form-group">
                  <label>冷却时间 (毫秒)</label>
                  <input
                    type="number"
                    min={0}
                    max={30000}
                    step={100}
                    value={trigger.cooldownMs}
                    onChange={(e) =>
                      handleUpdateTrigger({ ...trigger, cooldownMs: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>重复触发</label>
                  <select
                    value={trigger.repeatable ? 'yes' : 'no'}
                    onChange={(e) =>
                      handleUpdateTrigger({ ...trigger, repeatable: e.target.value === 'yes' })
                    }
                  >
                    <option value="yes">允许重复</option>
                    <option value="no">仅一次</option>
                  </select>
                </div>
              </div>
              <button
                className="preset-btn play"
                onClick={() => {
                  if (!currentPreset) return
                  handlePreviewPreset(currentPreset)
                }}
              >
                ▶ 模拟触发
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'presets', label: '预设', icon: '🔔' },
    { id: 'rhythm', label: '节奏', icon: '🥁' },
    { id: 'harmony', label: '和声', icon: '🎵' },
    { id: 'triggers', label: '触发', icon: '⚡' },
  ]

  return (
    <div className="bellchime-panel">
      <div className="bell-header">
        <div>
          <h2 className="bell-title">🔔 钟声谱面工坊</h2>
          <p className="bell-subtitle">配置你的专属钟声音色、节奏与触发条件</p>
        </div>
        <button className="bell-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="bell-stats">
        <div className="stat-item">
          <span className="stat-label">钟声积分</span>
          <span className="stat-value gold">{formatScore(state.totalBellScoreEarned)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">当前预设</span>
          <span className="stat-value">{currentPreset?.displayName ?? '未选择'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已解锁</span>
          <span className="stat-value">{state.unlockedPresetIds.length} / {allPresets.length}</span>
        </div>
      </div>

      {isPlaying && currentPreset && (
        <div className="now-playing">
          <span className="playing-indicator" />
          正在播放：{currentPreset.displayName}
          <button className="stop-btn" onClick={stopPlayback}>
            ⏹ 停止
          </button>
        </div>
      )}

      <div className="bell-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`bell-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bell-tab-body">
        {activeTab === 'presets' && renderPresetsTab()}
        {activeTab === 'rhythm' && renderRhythmTab()}
        {activeTab === 'harmony' && renderHarmonyTab()}
        {activeTab === 'triggers' && renderTriggersTab()}
      </div>

      <div className="bell-footer">
        <div className="hint-text">
          通过游戏获得积分解锁更多钟声预设！通关反馈将自动播放你配置的钟声。
        </div>
        <button className="start-btn bell-back" onClick={onClose}>
          返回菜单
        </button>
      </div>
    </div>
  )
}

export default BellChimePanel
