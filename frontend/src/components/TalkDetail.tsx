import { motion, AnimatePresence } from 'framer-motion'
import { Paper, Title, Text, Button, Group, Textarea } from '@mantine/core'
import { useState } from 'react'
import type { Participant, Talk } from '../types'
import { AVATAR_ICONS } from '../types'

interface TalkDetailProps {
  isOpen: boolean
  slotNumber: number
  talk: Talk | null
  speaker: Participant | null
  onClose: () => void
  onUpdateTranscript: (slotNumber: number, transcript: string) => void
}

export function TalkDetail({
  isOpen,
  slotNumber,
  talk,
  speaker,
  onClose,
  onUpdateTranscript,
}: TalkDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [transcript, setTranscript] = useState(talk?.transcript || '')

  const handleSave = () => {
    onUpdateTranscript(slotNumber, transcript)
    setIsEditing(false)
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '500px' }}
          >
            <Paper
              p="xl"
              radius="lg"
              style={{
                background: 'rgba(30, 20, 50, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Title order={2} ta="center" mb="md" style={{ color: '#ff9500' }}>
                第{slotNumber}話
              </Title>

              {/* Speaker info */}
              {speaker ? (
                <Group justify="center" mb="lg">
                  <Paper
                    p="md"
                    radius="md"
                    style={{
                      background: 'rgba(255, 149, 0, 0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <Text size="50px" mb="xs">
                      {AVATAR_ICONS[speaker.iconIndex]}
                    </Text>
                    <Text size="lg" c="white" fw={500}>
                      {speaker.nickname}
                    </Text>
                  </Paper>
                </Group>
              ) : (
                <Text ta="center" c="dimmed" mb="lg">
                  話者未設定
                </Text>
              )}

              {/* Time info */}
              {talk && (
                <Group justify="center" gap="xl" mb="lg">
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">開始</Text>
                    <Text size="sm" c="white">{formatDateTime(talk.startedAt)}</Text>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">終了</Text>
                    <Text size="sm" c="white">{formatDateTime(talk.completedAt)}</Text>
                  </div>
                </Group>
              )}

              {/* Transcript */}
              <Text size="sm" c="dimmed" mb="xs">
                文字起こし（Phase 4で録音対応予定）
              </Text>
              {isEditing ? (
                <>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.currentTarget.value)}
                    placeholder="ここにメモを入力..."
                    minRows={5}
                    maxRows={10}
                    mb="md"
                    styles={{
                      input: { background: 'rgba(0,0,0,0.3)' },
                    }}
                  />
                  <Group justify="center" gap="md">
                    <Button variant="subtle" color="gray" onClick={() => setIsEditing(false)}>
                      キャンセル
                    </Button>
                    <Button color="orange" onClick={handleSave}>
                      保存
                    </Button>
                  </Group>
                </>
              ) : (
                <>
                  <Paper
                    p="md"
                    radius="md"
                    mb="md"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      minHeight: '100px',
                    }}
                  >
                    <Text c={talk?.transcript ? 'white' : 'dimmed'} style={{ whiteSpace: 'pre-wrap' }}>
                      {talk?.transcript || '（まだ内容がありません）'}
                    </Text>
                  </Paper>
                  <Group justify="center" gap="md">
                    <Button variant="subtle" color="gray" onClick={onClose}>
                      閉じる
                    </Button>
                    <Button variant="light" color="orange" onClick={() => {
                      setTranscript(talk?.transcript || '')
                      setIsEditing(true)
                    }}>
                      編集
                    </Button>
                  </Group>
                </>
              )}
            </Paper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
