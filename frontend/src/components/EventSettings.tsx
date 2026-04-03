import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  ActionIcon,
  FileButton,
  Image,
  Tabs,
  TextInput,
  NumberInput,
  SegmentedControl,
  ColorSwatch,
} from '@mantine/core'
import type { EventConfig, CandleStyle } from '../types'
import { EVENT_ICONS, TITLE_COLORS, CANDLE_STYLES } from '../types'

// Import candle preview images
import candleLit from '../assets/candle-lit.svg'
import candleFancyLit from '../assets/candle-fancy-lit.svg'
import lanternLit from '../assets/lantern-lit.svg'
import andonLit from '../assets/andon-lit.svg'

const CANDLE_PREVIEWS: Record<CandleStyle, string> = {
  simple: candleLit,
  fancy: candleFancyLit,
  lantern: lanternLit,
  andon: andonLit,
}

interface EventSettingsProps {
  isOpen: boolean
  event: EventConfig
  completedCount: number
  onUpdate: (event: EventConfig) => void
  onClose: () => void
}

export function EventSettings({
  isOpen,
  event,
  completedCount,
  onUpdate,
  onClose,
}: EventSettingsProps) {
  // Basic settings
  const [name, setName] = useState(event.name)
  const [candleCount, setCandleCount] = useState(event.candleCount)
  const [timeLimit, setTimeLimit] = useState(event.timeLimitSeconds / 60)
  const [mode, setMode] = useState(event.mode)
  const [titleColor, setTitleColor] = useState(event.titleColor || '#ff9500')
  const [candleStyle, setCandleStyle] = useState<CandleStyle>(event.candleStyle || 'simple')

  // Appearance settings
  const [iconEmoji, setIconEmoji] = useState(event.iconEmoji)
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(event.iconImageUrl)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(event.backgroundImageUrl)

  const [activeTab, setActiveTab] = useState<string | null>('basic')

  const handleFileToBase64 = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleIconImageUpload = (file: File | null) => {
    if (file) {
      handleFileToBase64(file, (base64) => {
        setIconImageUrl(base64)
      })
    }
  }

  const handleBackgroundUpload = (file: File | null) => {
    if (file) {
      handleFileToBase64(file, (base64) => {
        setBackgroundImageUrl(base64)
      })
    }
  }

  const handleSave = () => {
    onUpdate({
      ...event,
      name: name || '百物語',
      candleCount: Math.max(candleCount, completedCount),
      timeLimitSeconds: (timeLimit || 2) * 60,
      mode,
      titleColor,
      candleStyle,
      iconEmoji,
      iconImageUrl,
      backgroundImageUrl,
    })
    onClose()
  }

  const handleRemoveIconImage = () => {
    setIconImageUrl(null)
  }

  const handleRemoveBackground = () => {
    setBackgroundImageUrl(null)
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
            zIndex: 200,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'auto' }}
          >
            <Paper
              p="xl"
              radius="lg"
              style={{
                background: 'rgba(30, 20, 50, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Title order={2} ta="center" mb="lg" style={{ color: '#ff9500' }}>
                イベント設定
              </Title>

              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow mb="lg">
                  <Tabs.Tab value="basic">基本</Tabs.Tab>
                  <Tabs.Tab value="candle">ろうそく</Tabs.Tab>
                  <Tabs.Tab value="icon">アイコン</Tabs.Tab>
                  <Tabs.Tab value="background">背景</Tabs.Tab>
                </Tabs.List>

                {/* Basic Settings Tab */}
                <Tabs.Panel value="basic">
                  <Stack gap="md">
                    <TextInput
                      label="イベント名"
                      value={name}
                      onChange={(e) => setName(e.currentTarget.value)}
                      size="md"
                      styles={{
                        label: { color: '#ccc', marginBottom: '4px' },
                      }}
                    />

                    <NumberInput
                      label={`ろうそくの本数（最小: ${completedCount}本）`}
                      value={candleCount}
                      onChange={(val) => setCandleCount(typeof val === 'number' ? Math.max(val, completedCount) : completedCount)}
                      min={completedCount}
                      max={100}
                      size="md"
                      styles={{
                        label: { color: '#ccc', marginBottom: '4px' },
                      }}
                    />
                    {completedCount > 0 && (
                      <Text size="xs" c="dimmed">
                        ※ {completedCount}本のトークが完了しているため、それ以下には設定できません
                      </Text>
                    )}

                    <NumberInput
                      label="持ち時間（分）"
                      value={timeLimit}
                      onChange={(val) => setTimeLimit(typeof val === 'number' ? val : 2)}
                      min={1}
                      max={30}
                      size="md"
                      styles={{
                        label: { color: '#ccc', marginBottom: '4px' },
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
                        size="md"
                        data={[
                          { label: '🌙 Get Dark', value: 'dark' },
                          { label: '☀️ Get Bright', value: 'bright' },
                        ]}
                        styles={{
                          root: { background: 'rgba(0,0,0,0.3)' },
                        }}
                      />
                    </div>

                    {/* Title Color */}
                    <div>
                      <Text size="sm" c="dimmed" mb="xs">
                        タイトル色
                      </Text>
                      <Group gap="xs">
                        {TITLE_COLORS.map((color) => (
                          <ColorSwatch
                            key={color.value}
                            color={color.value}
                            onClick={() => setTitleColor(color.value)}
                            style={{
                              cursor: 'pointer',
                              border: titleColor === color.value ? '3px solid white' : '2px solid transparent',
                            }}
                            size={32}
                          />
                        ))}
                      </Group>
                      <Text size="xs" c="dimmed" mt="xs">
                        選択中: <span style={{ color: titleColor }}>{name || '百物語'}</span>
                      </Text>
                    </div>
                  </Stack>
                </Tabs.Panel>

                {/* Candle Style Tab */}
                <Tabs.Panel value="candle">
                  <Stack gap="md">
                    <Text size="sm" c="dimmed">ろうそくのスタイルを選択</Text>

                    <SimpleGrid cols={2} spacing="md">
                      {CANDLE_STYLES.map((style) => (
                        <Paper
                          key={style.id}
                          p="md"
                          radius="md"
                          onClick={() => setCandleStyle(style.id)}
                          style={{
                            background: candleStyle === style.id
                              ? 'rgba(255, 149, 0, 0.2)'
                              : 'rgba(0, 0, 0, 0.3)',
                            border: candleStyle === style.id
                              ? '2px solid #ff9500'
                              : '2px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                          }}
                        >
                          <img
                            src={CANDLE_PREVIEWS[style.id]}
                            alt={style.name}
                            style={{
                              width: '60px',
                              height: '80px',
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 0 8px rgba(255, 149, 0, 0.6))',
                            }}
                          />
                          <Text size="sm" c="white" fw={500} mt="xs">
                            {style.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {style.description}
                          </Text>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Tabs.Panel>

                {/* Icon Tab */}
                <Tabs.Panel value="icon">
                  <Stack gap="md">
                    {/* Current icon preview */}
                    <Group justify="center">
                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          background: 'rgba(255, 149, 0, 0.1)',
                          textAlign: 'center',
                        }}
                      >
                        {iconImageUrl ? (
                          <Image
                            src={iconImageUrl}
                            alt="Event icon"
                            w={80}
                            h={80}
                            radius="md"
                            fit="cover"
                          />
                        ) : (
                          <Text size="60px">{iconEmoji}</Text>
                        )}
                        <Text size="sm" c="dimmed" mt="xs">現在のアイコン</Text>
                      </Paper>
                    </Group>

                    {/* Emoji selection */}
                    <Text size="sm" c="dimmed">絵文字から選択</Text>
                    <SimpleGrid cols={10} spacing="xs">
                      {EVENT_ICONS.map((emoji) => (
                        <ActionIcon
                          key={emoji}
                          size="xl"
                          variant={iconEmoji === emoji && !iconImageUrl ? 'filled' : 'subtle'}
                          color={iconEmoji === emoji && !iconImageUrl ? 'orange' : 'gray'}
                          onClick={() => {
                            setIconEmoji(emoji)
                            setIconImageUrl(null)
                          }}
                          style={{ fontSize: '24px' }}
                        >
                          {emoji}
                        </ActionIcon>
                      ))}
                    </SimpleGrid>

                    {/* Custom image upload */}
                    <Text size="sm" c="dimmed" mt="md">カスタム画像をアップロード</Text>
                    <Group>
                      <FileButton onChange={handleIconImageUpload} accept="image/*">
                        {(props) => (
                          <Button variant="light" color="orange" {...props}>
                            画像を選択
                          </Button>
                        )}
                      </FileButton>
                      {iconImageUrl && (
                        <Button variant="subtle" color="red" onClick={handleRemoveIconImage}>
                          削除
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Tabs.Panel>

                {/* Background Tab */}
                <Tabs.Panel value="background">
                  <Stack gap="md">
                    {/* Background preview */}
                    <Paper
                      p="md"
                      radius="md"
                      style={{
                        background: backgroundImageUrl
                          ? `url(${backgroundImageUrl}) center/cover`
                          : 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)',
                        height: '150px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text c="white" size="sm" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}>
                        {backgroundImageUrl ? '現在の背景' : 'デフォルト背景'}
                      </Text>
                    </Paper>

                    {/* Background upload */}
                    <Group>
                      <FileButton onChange={handleBackgroundUpload} accept="image/*">
                        {(props) => (
                          <Button variant="light" color="orange" {...props}>
                            背景画像を選択
                          </Button>
                        )}
                      </FileButton>
                      {backgroundImageUrl && (
                        <Button variant="subtle" color="red" onClick={handleRemoveBackground}>
                          デフォルトに戻す
                        </Button>
                      )}
                    </Group>

                    <Text size="xs" c="dimmed">
                      推奨: 1920x1080px以上の横長画像
                    </Text>
                  </Stack>
                </Tabs.Panel>
              </Tabs>

              <Group justify="center" gap="md" mt="xl">
                <Button variant="subtle" color="gray" onClick={onClose}>
                  キャンセル
                </Button>
                <Button color="orange" onClick={handleSave}>
                  保存
                </Button>
              </Group>
            </Paper>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
