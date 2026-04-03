import { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Title, Group, Text, Paper, Menu, ActionIcon, Image } from '@mantine/core'
import { CandleGrid } from './CandleGrid'
import { SpeakerSelect } from './SpeakerSelect'
import { TalkScreen } from './TalkScreen'
import { TalkDetail } from './TalkDetail'
import { AchievementScreen } from './AchievementScreen'
import { EventSettings } from './EventSettings'
import type { EventConfig, Participant, Talk } from '../types'

interface MainScreenProps {
  event: EventConfig
  participants: Participant[]
  talks: Talk[]
  onUpdateEvent: (event: EventConfig) => void
  onAddParticipant: (participant: Participant) => void
  onUpdateTalk: (talk: Talk) => void
  onReset: () => void
}

export function MainScreen({
  event,
  participants,
  talks,
  onUpdateEvent,
  onAddParticipant,
  onUpdateTalk,
  onReset,
}: MainScreenProps) {
  const navigate = useNavigate()

  // Convert talks array to Map for easier lookup
  const talksMap = useMemo(() => {
    const map = new Map<number, Talk>()
    talks.forEach((talk) => map.set(talk.slotNumber, talk))
    return map
  }, [talks])

  const completedSlots = useMemo(() => {
    const completed = new Set<number>()
    talks.forEach((talk) => {
      if (talk.isCompleted) {
        completed.add(talk.slotNumber)
      }
    })
    return completed
  }, [talks])

  // Progress stage: 0-10 based on completion ratio (not fixed 10-candle steps)
  const progressStage = useMemo(() => {
    return Math.floor((completedSlots.size / event.candleCount) * 10)
  }, [completedSlots.size, event.candleCount])

  const backgroundFilterStyle = useMemo(() => {
    if (event.mode === 'dark') {
      const brightness = 1 - progressStage * 0.08
      const grayscale = progressStage * 0.1
      const contrast = 1 + progressStage * 0.05
      return {
        filter: `brightness(${brightness}) grayscale(${grayscale}) contrast(${contrast})`,
      }
    } else {
      const brightness = 0.3 + progressStage * 0.07
      const grayscale = 1 - progressStage * 0.1
      const saturate = 0.5 + progressStage * 0.05
      return {
        filter: `brightness(${brightness}) grayscale(${grayscale}) saturate(${saturate})`,
      }
    }
  }, [event.mode, progressStage])

  // Modal states
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [showSpeakerSelect, setShowSpeakerSelect] = useState(false)
  const [showTalkScreen, setShowTalkScreen] = useState(false)
  const [showTalkDetail, setShowTalkDetail] = useState(false)
  const [showEventSettings, setShowEventSettings] = useState(false)
  const [selectedSpeaker, setSelectedSpeaker] = useState<Participant | null>(null)
  const [showAchievement, setShowAchievement] = useState(false)

  const handleCandleClick = useCallback((slotNumber: number) => {
    const existingTalk = talksMap.get(slotNumber)
    if (existingTalk?.isCompleted) {
      // Show talk detail for completed slots
      setActiveSlot(slotNumber)
      const speaker = participants.find((p) => p.id === existingTalk.speakerId) || null
      setSelectedSpeaker(speaker)
      setShowTalkDetail(true)
    } else {
      // Start new talk
      setActiveSlot(slotNumber)
      setShowSpeakerSelect(true)
    }
  }, [talksMap, participants])

  const handleSpeakerSelect = useCallback((participant: Participant) => {
    setSelectedSpeaker(participant)
    setShowSpeakerSelect(false)
    setShowTalkScreen(true)
  }, [])

  const handleAddParticipant = useCallback((participant: Participant) => {
    onAddParticipant(participant)
    setSelectedSpeaker(participant)
    setShowSpeakerSelect(false)
    setShowTalkScreen(true)
  }, [onAddParticipant])

  const handleTalkComplete = useCallback((talk: Talk) => {
    onUpdateTalk(talk)
    setShowTalkScreen(false)
    setActiveSlot(null)
    setSelectedSpeaker(null)

    // Check if all candles are done
    const newCompletedCount = completedSlots.size + 1
    if (newCompletedCount >= event.candleCount) {
      setTimeout(() => setShowAchievement(true), 500)
    }
  }, [onUpdateTalk, completedSlots.size, event.candleCount])

  const handleUpdateTranscript = useCallback((slotNumber: number, transcript: string) => {
    const existingTalk = talksMap.get(slotNumber)
    if (existingTalk) {
      onUpdateTalk({ ...existingTalk, transcript })
    }
  }, [talksMap, onUpdateTalk])

  const handleReset = useCallback(() => {
    if (confirm('全ての進捗をリセットしますか？')) {
      onReset()
      setShowAchievement(false)
    }
  }, [onReset])

  // Render event icon
  const renderEventIcon = () => {
    if (event.iconImageUrl) {
      return (
        <Image
          src={event.iconImageUrl}
          alt="Event icon"
          w={40}
          h={40}
          radius="md"
          fit="cover"
          style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}
        />
      )
    }
    return <span style={{ marginRight: '8px' }}>{event.iconEmoji || '🎃'}</span>
  }

  return (
    <div className="app-wrapper">
      {/* Background with custom image or default */}
      <div
        className={`background-layer ${event.mode === 'dark' ? 'dark-theme' : 'bright-theme'}`}
        style={{
          ...backgroundFilterStyle,
          transition: 'filter 0.5s ease',
          ...(event.backgroundImageUrl && {
            backgroundImage: `url(${event.backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }),
        }}
      />

      <div className="content-layer">
        <Container size="lg" py="md">
          <Paper
            p="md"
            radius="md"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Group justify="space-between" mb="md">
              <div>
                <Title order={1} style={{ color: event.titleColor || '#ff9500', display: 'flex', alignItems: 'center' }}>
                  {renderEventIcon()}
                  {event.name}
                </Title>
                <Text size="sm" c="dimmed">
                  持ち時間: {event.timeLimitSeconds / 60}分 | {event.mode === 'dark' ? '🌙 Get Dark' : '☀️ Get Bright'}
                </Text>
              </div>
              <Group>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="lg">
                      ⚙️
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>イベント管理</Menu.Label>
                    <Menu.Item onClick={() => setShowEventSettings(true)}>
                      ⚙️ イベント設定
                    </Menu.Item>
                    <Menu.Item onClick={() => navigate('/')}>
                      📋 イベント一覧
                    </Menu.Item>
                    <Menu.Item onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert('URLをコピーしました')
                    }}>
                      🔗 URLをコピー
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" onClick={handleReset}>
                      🔄 リセット
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${(completedSlots.size / event.candleCount) * 100}%`,
                  background:
                    event.mode === 'dark'
                      ? `linear-gradient(90deg, #ff9500, #ff6b35 ${progressStage * 10}%, #333)`
                      : `linear-gradient(90deg, #333, #ff6b35 ${progressStage * 10}%, #ff9500)`,
                }}
              />
            </div>

            <CandleGrid
              candleCount={event.candleCount}
              completedSlots={completedSlots}
              isDarkMode={event.mode === 'dark'}
              candleStyle={event.candleStyle || 'simple'}
              onCandleClick={handleCandleClick}
            />

            <Group justify="center" mt="md">
              <Text size="xl" fw={700} c="orange">
                {event.mode === 'dark' ? '消灯' : '点灯'}: {completedSlots.size} / {event.candleCount}
              </Text>
              <Text size="sm" c="dimmed">
                (Stage {progressStage}/10)
              </Text>
            </Group>
          </Paper>
        </Container>
      </div>

      <SpeakerSelect
        isOpen={showSpeakerSelect}
        slotNumber={activeSlot || 0}
        participants={participants}
        onSelect={handleSpeakerSelect}
        onAddParticipant={handleAddParticipant}
        onClose={() => {
          setShowSpeakerSelect(false)
          setActiveSlot(null)
        }}
      />

      <TalkScreen
        isOpen={showTalkScreen}
        slotNumber={activeSlot || 0}
        speaker={selectedSpeaker}
        timeLimitSeconds={event.timeLimitSeconds}
        existingTalk={activeSlot ? talksMap.get(activeSlot) || null : null}
        onComplete={handleTalkComplete}
        onClose={() => {
          setShowTalkScreen(false)
          setActiveSlot(null)
          setSelectedSpeaker(null)
        }}
      />

      <TalkDetail
        isOpen={showTalkDetail}
        slotNumber={activeSlot || 0}
        talk={activeSlot ? talksMap.get(activeSlot) || null : null}
        speaker={selectedSpeaker}
        onClose={() => {
          setShowTalkDetail(false)
          setActiveSlot(null)
          setSelectedSpeaker(null)
        }}
        onUpdateTranscript={handleUpdateTranscript}
      />

      <EventSettings
        isOpen={showEventSettings}
        event={event}
        completedCount={completedSlots.size}
        onUpdate={onUpdateEvent}
        onClose={() => setShowEventSettings(false)}
      />

      <AchievementScreen
        isVisible={showAchievement}
        isDarkMode={event.mode === 'dark'}
        onClose={() => setShowAchievement(false)}
      />
    </div>
  )
}
