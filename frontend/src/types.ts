// Event configuration
export interface EventConfig {
  id: string
  name: string
  candleCount: number
  timeLimitSeconds: number
  mode: 'dark' | 'bright'
  createdAt: Date
  // Customization
  iconEmoji: string // Emoji icon for the event
  iconImageUrl: string | null // Custom icon image (Base64 or URL)
  backgroundImageUrl: string | null // Custom background image (Base64 or URL)
  titleColor: string // Title text color
}

// Participant
export interface Participant {
  id: string
  nickname: string
  iconIndex: number // Index for default avatar icons
}

// Talk record for each candle slot
export interface Talk {
  slotNumber: number
  speakerId: string | null
  transcript: string
  isCompleted: boolean
  startedAt: Date | null
  completedAt: Date | null
}

// Application state
export interface AppState {
  currentScreen: 'setup' | 'main' | 'talk'
  event: EventConfig | null
  participants: Participant[]
  talks: Map<number, Talk>
  activeSlot: number | null
}

// Default avatar icons (emoji-based for now)
export const AVATAR_ICONS = [
  '👻', '🎃', '🦇', '🕷️', '💀',
  '🧛', '🧟', '🧙', '🦴', '👽',
  '🐱', '🦉', '🐺', '🌙', '⭐',
  '🔮', '🕯️', '🗝️', '📿', '🎭',
]

// Event icon options
export const EVENT_ICONS = [
  '🎃', '👻', '💀', '🦇', '🕷️',
  '🌙', '🔮', '🕯️', '⚰️', '🏚️',
  '🎭', '📖', '🗝️', '🌑', '🦉',
  '🐺', '🧛', '🧟', '🧙', '👹',
]

// Title color options
export const TITLE_COLORS = [
  { name: 'オレンジ', value: '#ff9500' },
  { name: '赤', value: '#ff4444' },
  { name: '紫', value: '#9b59b6' },
  { name: '青', value: '#3498db' },
  { name: '緑', value: '#2ecc71' },
  { name: 'ピンク', value: '#e91e63' },
  { name: '金', value: '#ffd700' },
  { name: '白', value: '#ffffff' },
  { name: 'シアン', value: '#00bcd4' },
  { name: 'ライム', value: '#cddc39' },
]
