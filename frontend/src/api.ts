const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface EventConfig {
  id: string
  name: string
  candle_count: number
  time_limit_seconds: number
  mode: 'dark' | 'bright'
  icon_emoji: string
  icon_image_url: string | null
  background_image_url: string | null
  title_color: string
  candle_style: string
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  event_id: string
  nickname: string
  icon_index: number
  created_at: string
}

export interface Talk {
  id: string
  event_id: string
  slot_number: number
  speaker_id: string | null
  transcript: string
  is_completed: boolean
  started_at: string | null
  completed_at: string | null
  has_audio: boolean
  created_at: string
  updated_at: string
}

export interface EventFull extends EventConfig {
  participants: Participant[]
  talks: Talk[]
}

// Events API
export async function createEvent(data: {
  name: string
  candle_count: number
  time_limit_seconds: number
  mode: string
  icon_emoji: string
  icon_image_url?: string | null
  background_image_url?: string | null
  title_color: string
  candle_style: string
}): Promise<EventConfig> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function getEvents(): Promise<EventConfig[]> {
  const res = await fetch(`${API_BASE}/events`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function getEvent(eventId: string): Promise<EventFull> {
  const res = await fetch(`${API_BASE}/events/${eventId}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Event not found')
    throw new Error('Failed to fetch event')
  }
  return res.json()
}

export async function updateEvent(eventId: string, data: Partial<EventConfig>): Promise<EventConfig> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update event')
  return res.json()
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
}

// Participants API
export async function createParticipant(eventId: string, data: {
  nickname: string
  icon_index: number
}): Promise<Participant> {
  const res = await fetch(`${API_BASE}/events/${eventId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create participant')
  return res.json()
}

export async function getParticipants(eventId: string): Promise<Participant[]> {
  const res = await fetch(`${API_BASE}/events/${eventId}/participants`)
  if (!res.ok) throw new Error('Failed to fetch participants')
  return res.json()
}

// Talks API
export async function createOrUpdateTalk(eventId: string, data: {
  slot_number: number
  speaker_id?: string | null
  transcript?: string
  is_completed?: boolean
  audio_base64?: string | null
  audio_mime_type?: string | null
}): Promise<Talk> {
  const res = await fetch(`${API_BASE}/events/${eventId}/talks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create/update talk')
  return res.json()
}

// Get audio URL for a talk
export function getAudioUrl(eventId: string, slotNumber: number): string {
  return `${API_BASE}/events/${eventId}/talks/${slotNumber}/audio`
}

// Get a single talk by slot number
export async function getTalk(eventId: string, slotNumber: number): Promise<Talk | null> {
  const res = await fetch(`${API_BASE}/events/${eventId}/talks/${slotNumber}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch talk')
  return res.json()
}

export async function updateTalk(talkId: string, data: {
  transcript?: string
  is_completed?: boolean
  started_at?: string | null
  completed_at?: string | null
}): Promise<Talk> {
  const res = await fetch(`${API_BASE}/talks/${talkId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update talk')
  return res.json()
}

export async function resetTalks(eventId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}/talks`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to reset talks')
}
