import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paper,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  SimpleGrid,
  ActionIcon,
} from '@mantine/core'
import type { Participant } from '../types'
import { AVATAR_ICONS } from '../types'

interface SpeakerSelectProps {
  isOpen: boolean
  slotNumber: number
  participants: Participant[]
  onSelect: (participant: Participant) => void
  onAddParticipant: (participant: Participant) => void
  onClose: () => void
}

export function SpeakerSelect({
  isOpen,
  slotNumber,
  participants,
  onSelect,
  onAddParticipant,
  onClose,
}: SpeakerSelectProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState(0)

  const handleAdd = () => {
    if (!newName.trim()) return
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      nickname: newName.trim(),
      iconIndex: selectedIcon,
    }
    onAddParticipant(newParticipant)
    setNewName('')
    setSelectedIcon(0)
    setShowAddForm(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Paper
              p="xl"
              radius="lg"
              style={{
                background: 'rgba(30, 20, 50, 0.95)',
                backdropFilter: 'blur(10px)',
                maxWidth: '600px',
                width: '100vw',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              <Title order={2} ta="center" mb="xs" style={{ color: '#ff9500' }}>
                第{slotNumber}話
              </Title>
              <Text ta="center" c="dimmed" mb="xl" size="lg">
                話者を選んでください
              </Text>

              {!showAddForm ? (
                <>
                  {/* Participant grid */}
                  <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="md" mb="xl">
                    {participants.map((p) => (
                      <motion.div
                        key={p.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Paper
                          p="md"
                          radius="md"
                          style={{
                            background: 'rgba(255, 149, 0, 0.1)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            border: '2px solid transparent',
                            transition: 'border-color 0.2s',
                          }}
                          onClick={() => onSelect(p)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ff9500'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'transparent'
                          }}
                        >
                          <Text size="40px" mb="xs">
                            {AVATAR_ICONS[p.iconIndex]}
                          </Text>
                          <Text size="sm" c="white" lineClamp={1}>
                            {p.nickname}
                          </Text>
                        </Paper>
                      </motion.div>
                    ))}

                    {/* Add button */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Paper
                        p="md"
                        radius="md"
                        style={{
                          background: 'rgba(100, 100, 100, 0.2)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          border: '2px dashed #666',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '100px',
                        }}
                        onClick={() => setShowAddForm(true)}
                      >
                        <Text size="40px" mb="xs">
                          ➕
                        </Text>
                        <Text size="sm" c="dimmed">
                          追加
                        </Text>
                      </Paper>
                    </motion.div>
                  </SimpleGrid>

                  {participants.length === 0 && (
                    <Text ta="center" c="dimmed" mb="xl">
                      まだ参加者がいません。「追加」から参加者を登録してください。
                    </Text>
                  )}

                  <Group justify="center">
                    <Button variant="subtle" color="gray" onClick={onClose} size="lg">
                      キャンセル
                    </Button>
                  </Group>
                </>
              ) : (
                /* Add participant form */
                <>
                  <Text ta="center" c="white" mb="md" size="lg">
                    新しい参加者
                  </Text>

                  <TextInput
                    placeholder="ニックネーム"
                    value={newName}
                    onChange={(e) => setNewName(e.currentTarget.value)}
                    size="lg"
                    mb="md"
                    styles={{
                      input: { fontSize: '18px', textAlign: 'center' },
                    }}
                  />

                  <Text ta="center" c="dimmed" mb="sm">
                    アイコンを選択
                  </Text>
                  <SimpleGrid cols={10} spacing="xs" mb="xl">
                    {AVATAR_ICONS.map((icon, idx) => (
                      <ActionIcon
                        key={idx}
                        size="xl"
                        variant={selectedIcon === idx ? 'filled' : 'subtle'}
                        color={selectedIcon === idx ? 'orange' : 'gray'}
                        onClick={() => setSelectedIcon(idx)}
                        style={{ fontSize: '24px' }}
                      >
                        {icon}
                      </ActionIcon>
                    ))}
                  </SimpleGrid>

                  <Group justify="center" gap="md">
                    <Button
                      variant="subtle"
                      color="gray"
                      onClick={() => setShowAddForm(false)}
                      size="lg"
                    >
                      戻る
                    </Button>
                    <Button
                      color="orange"
                      onClick={handleAdd}
                      size="lg"
                      disabled={!newName.trim()}
                    >
                      追加して選択
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
