interface StartScreenProps {
  onStart: () => void
}

function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="start-screen">
      <h1 className="game-title">旧钟楼校时员</h1>
      <p className="game-subtitle">Clock Tower Timekeeper</p>
      <p className="story-text">
        暴雨夜，古老钟楼的齿轮错乱，时针分针停摆。<br />
        作为守钟人，你必须在时限内转动齿轮，<br />
        将钟面校准到目标时刻，让钟声按时响起。<br /><br />
        <span style={{ color: '#c9a96a' }}>
          🟠 大齿轮：±60分钟 &nbsp; 🔵 中齿轮：±15分钟 &nbsp; 🟢 小齿轮：±5分钟
        </span><br />
        <span style={{ color: '#a09070', fontSize: '0.9em' }}>
          点击齿轮左半边倒退，右半边推进。注意联动齿轮反向转动！
        </span>
      </p>
      <button className="start-btn" onClick={onStart}>
        开始校时
      </button>
    </div>
  )
}

export default StartScreen
