import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Text, Paper, Button, Stack } from '@mantine/core'
import { MainScreen } from './MainScreen'
import { getEvent, saveEvent } from '../storage'
import type { EventConfig, Participant, Talk } from '../types'

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventConfig | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [talks, setTalks] = useState<Talk[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Load event data
  useEffect(() => {
    if (!eventId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const stored = getEvent(eventId)
    if (stored) {
      setEvent(stored.event)
      setParticipants(stored.participants)
      setTalks(stored.talks)
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }, [eventId])

  // Save to localStorage whenever data changes
  const saveData = useCallback(() => {
    if (event) {
      saveEvent({ event, participants, talks })
    }
  }, [event, participants, talks])

  useEffect(() => {
    if (event) {
      saveData()
    }
  }, [event, participants, talks, saveData])

  const handleUpdateEvent = useCallback((updatedEvent: EventConfig) => {
    setEvent(updatedEvent)
  }, [])

  const handleAddParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => [...prev, participant])
  }, [])

  const handleUpdateTalk = useCallback((talk: Talk) => {
    setTalks((prev) => {
      const index = prev.findIndex((t) => t.slotNumber === talk.slotNumber)
      if (index >= 0) {
        const newTalks = [...prev]
        newTalks[index] = talk
        return newTalks
      }
      return [...prev, talk]
    })
  }, [])

  const handleReset = useCallback(() => {
    setTalks([])
  }, [])

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="background-layer dark-theme" />
        <div className="content-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Text c="white" size="xl">読み込み中...</Text>
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
