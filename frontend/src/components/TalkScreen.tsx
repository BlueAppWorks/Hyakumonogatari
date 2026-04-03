import { useState, useEffect, useCallback, useRef } from 'react'
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
  onComplete: (talk: Talk, audioBlob?: Blob) => void
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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null)
      audioChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      console.error('Recording error:', err)
      setRecordingError('マイクへのアクセスが拒否されました')
    }
  }, [])

  // Stop recording and return audio blob
  const stopRecording = useCallback((): Promise<Blob | undefined> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(undefined)
        return
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        })
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }, [])

  // Auto-start timer and recording when screen opens
  useEffect(() => {
    if (isOpen && !existingTalk?.isCompleted) {
      setElapsedSeconds(0)
      setIsRunning(true)
      setIsTimeUp(false)
      startRecording()
    }

    return () => {
      // Cleanup on close
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
        mediaRecorderRef.current.stop()
      }
    }
  }, [isOpen, existingTalk, startRecording])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const remainingSeconds = Math.max(0, timeLimitSeconds - elapsedSeconds)
  const progress = Math.min(100, (elapsedSeconds / timeLimitSeconds) * 100)

  const handleComplete = async () => {
    setIsRunning(false)
    const audioBlob = await stopRecording()

    const talk: Talk = {
      slotNumber,
      speakerId: speaker?.id || null,
      transcript: '', // Will be filled by Whisper later
      isCompleted: true,
      startedAt: existingTalk?.startedAt || new Date(),
      completedAt: new Date(),
      hasAudio: !!audioBlob,
    }
    onComplete(talk, audioBlob)
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

              {/* Recording indicator */}
              <Paper
                p="md"
                radius="md"
                mb="xl"
                style={{
                  background: isRecording
                    ? 'rgba(255, 0, 0, 0.15)'
                    : recordingError
                    ? 'rgba(255, 165, 0, 0.15)'
                    : 'rgba(100, 100, 100, 0.15)',
                  border: `2px solid ${isRecording ? 'rgba(255, 0, 0, 0.5)' : 'rgba(100, 100, 100, 0.3)'}`,
                  textAlign: 'center',
                }}
              >
                <motion.div
                  animate={isRecording ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Text size="24px" mb="xs">
                    {isRecording ? '🔴' : recordingError ? '⚠️' : '🎤'}
                  </Text>
                </motion.div>
                <Text c={recordingError ? 'orange' : 'dimmed'} size="sm">
                  {isRecording
                    ? '録音中...'
                    : recordingError
                    ? recordingError
                    : '録音待機中'}
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
