import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  SimpleGrid,
  ActionIcon,
} from '@mantine/core'
import { getAllEvents, deleteEvent, type StoredEvent } from '../storage'
import { useState, useEffect } from 'react'

export function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<StoredEvent[]>([])

  useEffect(() => {
    setEvents(getAllEvents())
  }, [])

  const handleDelete = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('このイベントを削除しますか？')) {
      deleteEvent(eventId)
      setEvents(getAllEvents())
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Paper
        p="xl"
        radius="lg"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          maxWidth: '700px',
          width: '100%',
        }}
      >
        <Stack gap="lg">
          <Title order={1} ta="center" style={{ color: '#ff9500' }}>
            🎃 百物語
          </Title>
          <Text ta="center" c="dimmed" size="lg">
            イベントを選択または新規作成
          </Text>

          <Button
            size="xl"
            color="orange"
            fullWidth
            onClick={() => navigate('/new')}
            styles={{
              root: { height: '60px', fontSize: '20px' },
            }}
          >
            ＋ 新しいイベントを作成
          </Button>

          {events.length > 0 && (
            <>
              <Text c="dimmed" size="sm" mt="md">
                既存のイベント
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {events.map((stored) => {
                  const completedCount = stored.talks.filter((t) => t.isCompleted).length
                  const progress = Math.round((completedCount / stored.event.candleCount) * 100)

                  return (
                    <motion.div
                      key={stored.event.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          background: 'rgba(255, 149, 0, 0.1)',
                          cursor: 'pointer',
                          border: '2px solid transparent',
                          transition: 'border-color 0.2s',
                          position: 'relative',
                        }}
                        onClick={() => navigate(`/event/${stored.event.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ff9500'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent'
                        }}
                      >
                        <Group justify="space-between" mb="xs">
                          <Text fw={700} c="white" size="lg">
                            {stored.event.name}
                          </Text>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={(e) => handleDelete(stored.event.id, e)}
                          >
                            ✕
                          </ActionIcon>
                        </Group>
                        <Text size="sm" c="dimmed" mb="xs">
                          {formatDate(stored.event.createdAt)}
                        </Text>
                        <Group gap="xs">
                          <Text size="sm" c="orange">
                            {stored.event.mode === 'dark' ? '🌙' : '☀️'}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {completedCount}/{stored.event.candleCount}本
                          </Text>
                          <Text size="sm" c={progress === 100 ? 'green' : 'dimmed'}>
                            ({progress}%)
                          </Text>
                        </Group>
                        <div
                          style={{
                            marginTop: '8px',
                            height: '4px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: progress === 100 ? '#4caf50' : '#ff9500',
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                      </Paper>
                    </motion.div>
                  )
                })}
              </SimpleGrid>
            </>
          )}
        </Stack>
      </Paper>
    </motion.div>
  )
}
