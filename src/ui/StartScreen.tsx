interface StartScreenProps {
  onStart: () => void
}

function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="start-screen">
      <h1 className="game-title">旧钟楼校时员</h1>
      <p className="game-subtitle">Clock Tower Timekeeper</p>
      <p className="story-text">
        暴雨夜，古老的钟楼齿轮错乱，钟声即将失准。<br />
        作为守钟人，你必须在时限内调整所有齿轮，<br />
        让它们归位到正确的角度，使钟声按时响起。<br /><br />
        <span style={{ color: '#c9a96a' }}>点击齿轮两侧旋转，注意齿轮会相互联动！</span>
      </p>
      <button className="start-btn" onClick={onStart}>
        开始校时
      </button>
    </div>
  )
}

export default StartScreen
