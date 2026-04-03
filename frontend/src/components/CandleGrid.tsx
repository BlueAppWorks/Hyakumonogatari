import { useMemo } from 'react'
import { Candle } from './Candle'
import type { CandleStyle } from '../types'

interface CandleGridProps {
  candleCount: number
  completedSlots: Set<number>
  isDarkMode: boolean
  candleStyle: CandleStyle
  onCandleClick: (slotNumber: number) => void
}

function calculateGridSize(count: number): { cols: number; rows: number } {
  // Find the most square-like arrangement
  const sqrt = Math.sqrt(count)
  const cols = Math.ceil(sqrt)
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}

export function CandleGrid({
  candleCount,
  completedSlots,
  isDarkMode,
  candleStyle,
  onCandleClick,
}: CandleGridProps) {
  const { cols } = useMemo(() => calculateGridSize(candleCount), [candleCount])

  const candles = useMemo(() => {
    return Array.from({ length: candleCount }, (_, i) => i + 1)
  }, [candleCount])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '8px',
        justifyItems: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
      }}
    >
      {candles.map((slotNumber) => (
        <Candle
          key={slotNumber}
          slotNumber={slotNumber}
          isCompleted={completedSlots.has(slotNumber)}
          isDarkMode={isDarkMode}
          candleStyle={candleStyle}
          onClick={() => onCandleClick(slotNumber)}
        />
      ))}
    </div>
  )
}
