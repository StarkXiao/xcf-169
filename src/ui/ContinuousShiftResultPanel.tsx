import type { ShiftGameResult } from '../types/continuousShift'
import ContinuousShiftResult from './ContinuousShiftResult'

interface ContinuousShiftResultPanelProps {
  result: ShiftGameResult
  onRestart: () => void
  onBackToMenu: () => void
}

function ContinuousShiftResultPanel({
  result,
  onRestart,
  onBackToMenu,
}: ContinuousShiftResultPanelProps) {
  return (
    <ContinuousShiftResult
      result={result}
      onContinue={onBackToMenu}
      onRestart={onRestart}
    />
  )
}

export default ContinuousShiftResultPanel
