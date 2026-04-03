import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paper, Title, Text, Button, Group, Progress } from '@mantine/core'
import type { Participant, Talk } from '../types'
import { AVATAR_ICONS } from '../types'

interface TalkScreenProps {
  isOpen: boolean
  slotNumber: number
  speaker: Participant | null
  timeLimitSeconds: number
  existingTalk: Talk | null
  onComplete: (talk: Talk) => void
  onClose: () => void
}

export function TalkScreen({
  isOpen,
  slotNumber,
  speaker,
  timeLimitSeconds,
  existingTalk,
  onComplete,
  onClose,
}: TalkScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)

  // Timer logic
  useEffect(() => {
    if (!isOpen || !isRunning) return

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1
        if (next >= timeLimitSeconds && !isTimeUp) {
          setIsTimeUp(true)
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, isRunning, timeLimitSeconds, isTimeUp])

  // Auto-start timer when screen opens
  useEffect(() => {
    if (isOpen && !existingTalk?.isCompleted) {
      setElapsedSeconds(0)
      setIsRunning(true)
      setIsTimeUp(false)
    }
  }, [isOpen, existingTalk])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const remainingSeconds = Math.max(0, timeLimitSeconds - elapsedSeconds)
  const progress = Math.min(100, (elapsedSeconds / timeLimitSeconds) * 100)

  const handleComplete = () => {
    setIsRunning(false)
    const talk: Talk = {
      slotNumber,
      speakerId: speaker?.id || null,
      transcript: '', // Will be filled by recording later
      isCompleted: true,
      startedAt: existingTalk?.startedAt || new Date(),
      completedAt: new Date(),
    }
    onComplete(talk)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <Paper
              p="xl"
              radius="lg"
              style={{
                background: isTimeUp
                  ? 'rgba(100, 30, 30, 0.95)'
                  : 'rgba(30, 20, 50, 0.95)',
                backdropFilter: 'blur(10px)',
                transition: 'background 0.5s ease',
              }}
            >
              {/* Header */}
              <Group justify="space-between" mb="md">
                <Title order={2} style={{ color: '#ff9500' }}>
                  第{slotNumber}話
                </Title>
                <motion.div
                  animate={isTimeUp ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: isTimeUp ? Infinity : 0, duration: 0.5 }}
                >
                  <Text
                    size="32px"
                    fw={700}
                    style={{
                      color: isTimeUp ? '#ff4444' : remainingSeconds <= 30 ? '#ffaa00' : '#fff',
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatTime(remainingSeconds)}
                  </Text>
                </motion.div>
              </Group>

              {/* Progress bar */}
              <Progress
                value={progress}
                size="lg"
                radius="xl"
                color={isTimeUp ? 'red' : progress > 80 ? 'yellow' : 'orange'}
                mb="xl"
                animated={isRunning}
              />

              {/* Speaker info */}
              {speaker && (
                <Group justify="center" mb="xl">
                  <Paper
                    p="lg"
                    radius="md"
                    style={{
                      background: 'rgba(255, 149, 0, 0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <Text size="60px" mb="xs">
                      {AVATAR_ICONS[speaker.iconIndex]}
                    </Text>
                    <Text size="xl" c="white" fw={500}>
                      {speaker.nickname}
                    </Text>
                  </Paper>
                </Group>
              )}

              {/* Time up message */}
              <AnimatePresence>
                {isTimeUp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Text
                      ta="center"
                      size="xl"
                      fw={700}
                      c="red"
                      mb="xl"
                      style={{ textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}
                    >
                      ⏰ 時間です！
                    </Text>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recording placeholder */}
              <Paper
                p="md"
                radius="md"
                mb="xl"
                style={{
                  background: 'rgba(255, 0, 0, 0.1)',
                  border: '2px solid rgba(255, 0, 0, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Text size="24px" mb="xs">
                  🔴
                </Text>
                <Text c="dimmed" size="sm">
                  録音機能は Phase 4 で実装予定
                </Text>
              </Paper>

              {/* Actions */}
              <Group justify="center" gap="md">
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={onClose}
                  size="lg"
                >
                  キャンセル
                </Button>
                <Button
                  color="green"
                  onClick={handleComplete}
                  size="lg"
                  leftSection={<span>✓</span>}
                >
                  完了
                </Button>
              </Group>

              {/* Elapsed time */}
              <Text ta="center" c="dimmed" size="sm" mt="md">
                経過時間: {formatTime(elapsedSeconds)}
              </Text>
            </Paper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
