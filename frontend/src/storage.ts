import type { EventConfig, Participant, Talk } from './types'

const STORAGE_KEY = 'hyakumonogatari_events'

export interface StoredEvent {
  event: EventConfig
  participants: Participant[]
  talks: Talk[]
}

export function saveEvent(data: StoredEvent): void {
  const events = getAllEvents()
  const index = events.findIndex((e) => e.event.id === data.event.id)
  if (index >= 0) {
    events[index] = data
  } else {
    events.push(data)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function getEvent(eventId: string): StoredEvent | null {
  const events = getAllEvents()
  return events.find((e) => e.event.id === eventId) || null
}

export function getAllEvents(): StoredEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    // Convert date strings back to Date objects
    return parsed.map((item: StoredEvent) => ({
      ...item,
      event: {
        ...item.event,
        createdAt: new Date(item.event.createdAt),
      },
      talks: item.talks.map((t: Talk) => ({
        ...t,
        startedAt: t.startedAt ? new Date(t.startedAt) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      })),
    }))
  } catch {
    return []
  }
}

export function deleteEvent(eventId: string): void {
  const events = getAllEvents().filter((e) => e.event.id !== eventId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function generateEventId(): string {
  // Generate a short random ID like "a1b2c3"
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}
