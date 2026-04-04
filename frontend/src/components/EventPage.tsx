import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Text, Paper, Button, Stack, Loader, Group } from '@mantine/core'
import { MainScreen } from './MainScreen'
import {
  getEvent as getEventApi,
  updateEvent as updateEventApi,
  createParticipant as createParticipantApi,
  createOrUpdateTalk as createOrUpdateTalkApi,
  resetTalks as resetTalksApi,
  type EventFull,
} from '../api'
import type { EventConfig, Participant, Talk, CandleStyle } from '../types'

// Convert API response to frontend types
function convertEventToFrontend(apiEvent: EventFull): {
  event: EventConfig
  participants: Participant[]
  talks: Talk[]
} {
  return {
    event: {
      id: apiEvent.id,
      name: apiEvent.name,
      candleCount: apiEvent.candle_count,
      timeLimitSeconds: apiEvent.time_limit_seconds,
      mode: apiEvent.mode as 'dark' | 'bright',
      createdAt: new Date(apiEvent.created_at),
      iconEmoji: apiEvent.icon_emoji,
      iconImageUrl: apiEvent.icon_image_url,
      backgroundImageUrl: apiEvent.background_image_url,
      titleColor: apiEvent.title_color,
      candleStyle: apiEvent.candle_style as CandleStyle,
    },
    participants: apiEvent.participants.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      iconIndex: p.icon_index,
    })),
    talks: apiEvent.talks.map((t) => ({
      slotNumber: t.slot_number,
      speakerId: t.speaker_id,
      transcript: t.transcript || '',
      isCompleted: t.is_completed,
      startedAt: t.started_at ? new Date(t.started_at) : null,
      completedAt: t.completed_at ? new Date(t.completed_at) : null,
      hasAudio: t.has_audio,
    })),
  }
}

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventConfig | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [talks, setTalks] = useState<Talk[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Load event data from API
  useEffect(() => {
    if (!eventId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const fetchEvent = async () => {
      try {
        const apiEvent = await getEventApi(eventId)
        const { event, participants, talks } = convertEventToFrontend(apiEvent)
        setEvent(event)
        setParticipants(participants)
        setTalks(talks)
      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleUpdateEvent = useCallback(async (updatedEvent: EventConfig) => {
    if (!eventId) return

    try {
      await updateEventApi(eventId, {
        name: updatedEvent.name,
        candle_count: updatedEvent.candleCount,
        time_limit_seconds: updatedEvent.timeLimitSeconds,
        mode: updatedEvent.mode,
        icon_emoji: updatedEvent.iconEmoji,
        icon_image_url: updatedEvent.iconImageUrl,
        background_image_url: updatedEvent.backgroundImageUrl,
        title_color: updatedEvent.titleColor,
        candle_style: updatedEvent.candleStyle,
      })
      setEvent(updatedEvent)
    } catch (err) {
      console.error(err)
      alert('イベントの更新に失敗しました')
    }
  }, [eventId])

  const handleAddParticipant = useCallback(async (participant: Participant): Promise<Participant | null> => {
    if (!eventId) return null

    try {
      const created = await createParticipantApi(eventId, {
        nickname: participant.nickname,
        icon_index: participant.iconIndex,
      })
      const newParticipant: Participant = {
        id: created.id,
        nickname: created.nickname,
        iconIndex: created.icon_index,
      }
      setParticipants((prev) => [...prev, newParticipant])
      return newParticipant
    } catch (err) {
      console.error(err)
      alert('参加者の追加に失敗しました')
      return null
    }
  }, [eventId])

  const handleUpdateTalk = useCallback(async (talk: Talk, audioBlob?: Blob) => {
    if (!eventId) return

    try {
      // Convert audio blob to base64 if provided
      let audioBase64: string | null = null
      let audioMimeType: string | null = null
      if (audioBlob) {
        // Use FileReader for large blobs (btoa fails with large arrays)
        audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const dataUrl = reader.result as string
            // Remove the "data:audio/webm;base64," prefix
            const base64 = dataUrl.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(audioBlob)
        })
        audioMimeType = audioBlob.type
      }

      const result = await createOrUpdateTalkApi(eventId, {
        slot_number: talk.slotNumber,
        speaker_id: talk.speakerId,
        transcript: talk.transcript,
        is_completed: talk.isCompleted,
        audio_base64: audioBase64,
        audio_mime_type: audioMimeType,
      })

      const updatedTalk: Talk = {
        ...talk,
        hasAudio: result.has_audio,
      }

      setTalks((prev) => {
        const index = prev.findIndex((t) => t.slotNumber === talk.slotNumber)
        if (index >= 0) {
          const newTalks = [...prev]
          newTalks[index] = updatedTalk
          return newTalks
        }
        return [...prev, updatedTalk]
      })
    } catch (err) {
      console.error(err)
      alert('トークの更新に失敗しました')
    }
  }, [eventId])

  const handleReset = useCallback(async () => {
    if (!eventId) return

    try {
      await resetTalksApi(eventId)
      setTalks([])
    } catch (err) {
      console.error(err)
      alert('リセットに失敗しました')
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="background-layer dark-theme" />
        <div className="content-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Group>
            <Loader color="orange" />
            <Text c="white" size="xl">読み込み中...</Text>
          </Group>
        </div>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="app-wrapper">
        <div className="background-layer dark-theme" />
        <div className="content-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Paper p="xl" radius="lg" style={{ background: 'rgba(0,0,0,0.7)', textAlign: 'center' }}>
            <Stack gap="md">
              <Text size="60px">👻</Text>
              <Text c="white" size="xl">イベントが見つかりません</Text>
              <Text c="dimmed">URLが間違っているか、イベントが削除された可能性があります</Text>
              <Button color="orange" onClick={() => navigate('/')}>
                トップに戻る
              </Button>
            </Stack>
          </Paper>
        </div>
      </div>
    )
  }

  return (
    <MainScreen
      event={event}
      participants={participants}
      talks={talks}
      onUpdateEvent={handleUpdateEvent}
      onAddParticipant={handleAddParticipant}
      onUpdateTalk={handleUpdateTalk}
      onReset={handleReset}
    />
  )
}
