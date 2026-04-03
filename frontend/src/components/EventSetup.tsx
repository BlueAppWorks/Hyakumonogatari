import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Paper,
  Title,
  TextInput,
  NumberInput,
  SegmentedControl,
  Button,
  Stack,
  Group,
  Text,
} from '@mantine/core'
import { createEvent } from '../api'

export function EventSetup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [candleCount, setCandleCount] = useState<number>(100)
  const [timeLimit, setTimeLimit] = useState<number>(2)
  const [mode, setMode] = useState<'dark' | 'bright'>('dark')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    try {
      setLoading(true)
      const event = await createEvent({
        name: name || '百物語',
        candle_count: candleCount || 100,
        time_limit_seconds: (timeLimit || 2) * 60,
        mode,
        icon_emoji: '🎃',
        icon_image_url: null,
        background_image_url: null,
        title_color: '#ff9500',
        candle_style: 'simple',
      })
      navigate(`/event/${event.id}`)
    } catch (err) {
      console.error(err)
      alert('イベントの作成に失敗しました')
    } finally {
      setLoading(false)
    }
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
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <div />
            <Title order={1} ta="center" style={{ color: '#ff9500' }}>
              🎃 百物語
            </Title>
            <Button variant="subtle" color="gray" size="sm" onClick={() => navigate('/')}>
              戻る
            </Button>
          </Group>
          <Text ta="center" c="dimmed" size="lg">
            新しいイベントを作成
          </Text>

          <TextInput
            label="イベント名"
            placeholder="例: 夏の怪談ナイト"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            size="lg"
            styles={{
              input: { fontSize: '18px', padding: '12px' },
              label: { color: '#ccc', marginBottom: '8px' },
            }}
          />

          <NumberInput
            label="ろうそくの本数"
            placeholder="100"
            value={candleCount}
            onChange={(val) => setCandleCount(typeof val === 'number' ? val : 100)}
            min={1}
            max={100}
            size="lg"
            styles={{
              input: { fontSize: '18px', padding: '12px' },
              label: { color: '#ccc', marginBottom: '8px' },
            }}
          />

          <NumberInput
            label="持ち時間（分）"
            placeholder="2"
            value={timeLimit}
            onChange={(val) => setTimeLimit(typeof val === 'number' ? val : 2)}
            min={1}
            max={30}
            size="lg"
            styles={{
              input: { fontSize: '18px', padding: '12px' },
              label: { color: '#ccc', marginBottom: '8px' },
            }}
          />

          <div>
            <Text size="sm" c="dimmed" mb="xs">
              モード
            </Text>
            <SegmentedControl
              value={mode}
              onChange={(val) => setMode(val as 'dark' | 'bright')}
              fullWidth
              size="lg"
              data={[
                { label: '🌙 Get Dark', value: 'dark' },
                { label: '☀️ Get Bright', value: 'bright' },
              ]}
              styles={{
                root: { background: 'rgba(0,0,0,0.3)' },
              }}
            />
            <Text size="xs" c="dimmed" mt="xs" ta="center">
              {mode === 'dark'
                ? 'ろうそくを消していく（ホラー向け）'
                : 'ろうそくを灯していく（ホラー苦手向け）'}
            </Text>
          </div>

          <Button
            size="xl"
            color="orange"
            fullWidth
            onClick={handleStart}
            loading={loading}
            styles={{
              root: { marginTop: '16px', height: '60px', fontSize: '20px' },
            }}
          >
            はじめる 🕯️
          </Button>

          <Group justify="center" mt="md">
            <Text size="sm" c="dimmed">
              参加者はイベント開始後に追加できます
            </Text>
          </Group>
        </Stack>
      </Paper>
    </motion.div>
  )
}
