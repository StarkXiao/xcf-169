import type { ShiftRunState, ShiftResourceType } from '../types/continuousShift'
import { SHIFT_RESOURCES } from '../types/continuousShift'

interface ContinuousShiftResourceShopProps {
  runState: ShiftRunState
  onPurchase: (type: ShiftResourceType) => boolean
  getPrice: (type: ShiftResourceType) => number
  onClose: () => void
}

function ContinuousShiftResourceShop({
  runState,
  onPurchase,
  getPrice,
  onClose,
}: ContinuousShiftResourceShopProps) {
  const resourceIcons: Record<string, string> = {
    oil: '🛢️',
    coal: '🪨',
    repairKit: '🔧',
    coffee: '☕',
    windCharge: '💨',
  }
  const resourceNames: Record<string, string> = {
    oil: '润滑油',
    coal: '煤炭',
    repairKit: '修理包',
    coffee: '咖啡',
    windCharge: '风之充能',
  }

  return (
    <div className="shift-resource-shop">
      <div className="shift-shop-card">
        <div className="shift-shop-header">
          <h2>🏪 资源补给站</h2>
          <div className="shift-shop-score">
            可用积分: <strong>🏆 {runState.totalScore}</strong>
          </div>
        </div>

        <p className="shift-shop-desc">使用累计积分购买补给，为下一夜做好准备</p>

        <div className="shift-shop-items">
          {(Object.keys(SHIFT_RESOURCES) as ShiftResourceType[]).map((type) => {
            const resource = SHIFT_RESOURCES[type]
            const price = getPrice(type)
            const currentCount = runState.resources[type]
            const maxCount = runState.maxResources[type]
            const canAfford = runState.totalScore >= price
            const isMaxed = currentCount >= maxCount

            return (
              <div key={type} className="shift-shop-item">
                <div className="shift-shop-item-icon">{resourceIcons[type]}</div>
                <div className="shift-shop-item-info">
                  <div className="shift-shop-item-name">{resourceNames[type]}</div>
                  <div className="shift-shop-item-desc">{resource.description}</div>
                  <div className="shift-shop-item-stock">
                    库存: {currentCount}/{maxCount}
                  </div>
                </div>
                <div className="shift-shop-item-action">
                  <div className="shift-shop-item-price">🏆 {price}</div>
                  <button
                    className="shift-buy-btn"
                    onClick={() => onPurchase(type)}
                    disabled={!canAfford || isMaxed}
                  >
                    {isMaxed ? '已满' : canAfford ? '购买' : '积分不足'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="shift-shop-current-resources">
          <div className="shift-section-title">📦 当前资源</div>
          <div className="shift-resources-summary">
            {(Object.keys(SHIFT_RESOURCES) as Array<keyof typeof SHIFT_RESOURCES>).map((key) => (
              <div key={key} className="shift-resource-summary-item">
                <span>{resourceIcons[key]}</span>
                <span>
                  {runState.resources[key]}/{runState.maxResources[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button className="shift-shop-close-btn" onClick={onClose}>
          完成补给 →
        </button>
      </div>
    </div>
  )
}

export default ContinuousShiftResourceShop
