import { motion, AnimatePresence } from 'framer-motion'
import type { CandleStyle } from '../types'

// Simple candles
import candleLit from '../assets/candle-lit.svg'
import candleOff from '../assets/candle-off.svg'

// Fancy candles with candlestick
import candleFancyLit from '../assets/candle-fancy-lit.svg'
import candleFancyOff from '../assets/candle-fancy-off.svg'

// Lantern
import lanternLit from '../assets/lantern-lit.svg'
import lanternOff from '../assets/lantern-off.svg'

// Andon (Japanese paper lantern)
import andonLit from '../assets/andon-lit.svg'
import andonOff from '../assets/andon-off.svg'

const CANDLE_IMAGES: Record<CandleStyle, { lit: string; off: string }> = {
  simple: { lit: candleLit, off: candleOff },
  fancy: { lit: candleFancyLit, off: candleFancyOff },
  lantern: { lit: lanternLit, off: lanternOff },
  andon: { lit: andonLit, off: andonOff },
}

interface CandleProps {
  slotNumber: number
  isCompleted: boolean
  isDarkMode: boolean
  candleStyle: CandleStyle
  onClick: () => void
}

export function Candle({ slotNumber, isCompleted, isDarkMode, candleStyle, onClick }: CandleProps) {
  // In Dark mode: completed = extinguished (off)
  // In Bright mode: completed = lit (on)
  const isLit = isDarkMode ? !isCompleted : isCompleted

  const images = CANDLE_IMAGES[candleStyle] || CANDLE_IMAGES.simple
  const imageSrc = isLit ? images.lit : images.off

  return (
    <motion.div
      className="candle-container"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        cursor: isCompleted ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2px',
        minWidth: '50px',
        minHeight: '70px',
        position: 'relative',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={`${candleStyle}-${isLit ? 'lit' : 'off'}`}
          src={imageSrc}
          alt={isLit ? 'lit' : 'extinguished'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: isLit
              ? 'drop-shadow(0 0 12px rgba(255, 149, 0, 0.8))'
              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '45px',
            height: '65px',
            objectFit: 'contain',
          }}
        />
      </AnimatePresence>

      {/* Slot number */}
      <motion.span
        animate={{
          color: isCompleted ? '#666' : '#ff9500',
        }}
        style={{
          fontSize: '10px',
          marginTop: '2px',
          fontWeight: 'bold',
        }}
      >
        {slotNumber}
      </motion.span>
    </motion.div>
  )
}
