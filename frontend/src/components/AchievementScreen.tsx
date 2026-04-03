import { motion, AnimatePresence } from 'framer-motion'

interface AchievementScreenProps {
  isVisible: boolean
  isDarkMode: boolean
  onClose: () => void
}

export function AchievementScreen({
  isVisible,
  isDarkMode,
  onClose,
}: AchievementScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.95)'
              : 'rgba(255, 200, 100, 0.95)',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          {isDarkMode ? (
            // Dark mode: Something appears in the darkness
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                style={{ fontSize: '120px', marginBottom: '24px' }}
              >
                👻
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                  color: '#fff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                全ての灯りが消えた...
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{
                  color: '#ff6b35',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  marginTop: '16px',
                }}
              >
                何かが現れた！
              </motion.div>
              {/* Floating ghosts */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: (i - 2) * 100, y: 100 }}
                  animate={{
                    opacity: [0, 0.7, 0],
                    y: [100, -50, -200],
                  }}
                  transition={{
                    duration: 3,
                    delay: 1 + i * 0.3,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  style={{
                    position: 'absolute',
                    fontSize: '40px',
                  }}
                >
                  👻
                </motion.div>
              ))}
            </>
          ) : (
            // Bright mode: Celebration
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                style={{ fontSize: '120px', marginBottom: '24px' }}
              >
                🎉
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={{
                  color: '#1a0a2e',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                全ての灯りが点いた！
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{
                  color: '#ff6b35',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  marginTop: '16px',
                }}
              >
                おめでとう！
              </motion.div>
              {/* Confetti-like emojis */}
              {['🎃', '✨', '🌟', '🎊', '🕯️'].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [-50, -200],
                    x: (i - 2) * 80,
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.5 + i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  style={{
                    position: 'absolute',
                    fontSize: '40px',
                  }}
                >
                  {emoji}
                </motion.div>
              ))}
            </>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            style={{
              position: 'absolute',
              bottom: '40px',
              color: isDarkMode ? '#666' : '#333',
              fontSize: '16px',
            }}
          >
            タップして閉じる
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
