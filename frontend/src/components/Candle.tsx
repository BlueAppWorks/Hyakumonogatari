import { motion, AnimatePresence } from 'framer-motion'
import candleLit from '../assets/candle-lit.svg'
import candleOff from '../assets/candle-off.svg'

interface CandleProps {
  slotNumber: number
  isCompleted: boolean
  isDarkMode: boolean
  onClick: () => void
}

export function Candle({ slotNumber, isCompleted, isDarkMode, onClick }: CandleProps) {
  // In Dark mode: completed = extinguished (off)
  // In Bright mode: completed = lit (on)
  const isLit = isDarkMode ? !isCompleted : isCompleted

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
          key={isLit ? 'lit' : 'off'}
          src={isLit ? candleLit : candleOff}
          alt={isLit ? 'lit candle' : 'extinguished candle'}
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
