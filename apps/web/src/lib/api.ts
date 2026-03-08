import { API_BASE, http } from './http'

export type RulesData = {
  pointBuy: {
    budget: number
    baseScore?: number
    minScore: number
    maxScore: number
    costs: Record<string, number>
  }
  skills: string[]
  skillLabels: Record<string, string>
  races: Array<{
    id: string
    name: string
    group: string
    speed: number
    size: string
    abilityBonuses: Record<string, number>
    bonusAbilityChoices?: { count: number; value: number; exclude?: string[] }
    traits: string[]
    languages: string[]
    fixedSkills?: string[]
    bonusSkillChoices?: number
  }>
  classes: Array<{
    id: string
    name: string
    hitDie: number
    primaryAbilities: string[]
    savingThrows: string[]
    skillChoices: { count: number; options: string[] }
    armorModel: string
    startingInventory: Array<{ name: string; quantity: number }>
  }>
}

export type CharacterPayload = {
  name: string
  raceId: string
  classId: string
  notes?: string
  classSkillSelections: string[]
  raceSkillSelections?: string[]
  bonusAbilityChoices?: string[]
  baseStats: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
}

export type DiceToolEvent = {
  type: 'dice'
  notation: string
  result: { total: number; rolls: number[]; modifier: number }
  reason: string
}

export type HpToolEvent = {
  type: 'hp'
  previousHp: number
  currentHp: number
  delta: number
  reason: string
}

export type InventoryToolEvent = {
  type: 'inventory'
  ok: boolean
  itemName: string
  quantity: number
  operation?: string
  reason: string
  inventory?: Array<{ name: string; quantity: number }>
}

export type NpcStatus = {
  name: string
  color: string
}

export type NpcGameState = {
  id: number
  name: string
  race?: string | null
  className?: string | null
  creatureType?: string | null
  level: number
  maxHp: number
  currentHp: number
  armorClass: number
  stats: Record<string, number>
  inventory: Array<{ name: string; quantity: number }>
  skills: string[]
  affinity: number
  attitude: string
  statuses: NpcStatus[]
  notes?: string | null
}

export type NpcUpsertToolEvent = {
  type: 'npc_upsert'
  npc: NpcGameState
  reason: string
}

export type NpcHpToolEvent = {
  type: 'npc_hp'
  name: string
  previousHp: number
  currentHp: number
  delta: number
  reason: string
}

export type NpcInventoryToolEvent = {
  type: 'npc_inventory'
  ok: boolean
  name: string
  itemName: string
  quantity: number
  operation?: string
  reason: string
  inventory?: Array<{ name: string; quantity: number }>
}

export type NpcAffinityToolEvent = {
  type: 'npc_affinity'
  name: string
  previousAffinity: number
  currentAffinity: number
  attitude: string
  reason: string
}

export type NpcStatusToolEvent = {
  type: 'npc_status'
  name: string
  statuses: NpcStatus[]
  operation: string
  reason: string
}

export type ToolEvent =
  | DiceToolEvent
  | HpToolEvent
  | InventoryToolEvent
  | NpcUpsertToolEvent
  | NpcHpToolEvent
  | NpcInventoryToolEvent
  | NpcAffinityToolEvent
  | NpcStatusToolEvent
  | {
      type: 'unknown'
      message?: string
      [key: string]: unknown
    }

export type GameState = {
  sessionId: string
  summary: string
  character: {
    name: string
    race: string
    className: string
    raceId: string
    classId: string
    level: number
    maxHp: number
    currentHp: number
    armorClass: number
    goldAmount: number
    notes?: string
    stats: Record<string, number>
    skills: string[]
    inventory: Array<{ name: string; quantity: number }>
  }
  npcs: NpcGameState[]
  recentMessages: Array<{
    role: string
    content: string
    tool_name?: string
    created_at: string
  }>
}

function formatStreamError(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { message?: string }
    return parsed.message ?? raw
  } catch {
    return raw
  }
}

export async function fetchRules() {
  const response = await http.get<RulesData>('/rules')
  return response.data
}

export async function createCharacter(payload: CharacterPayload) {
  const response = await http.post<{ sessionId: string }>('/characters', payload)
  return response.data
}

export async function fetchGameState(sessionId: string) {
  const response = await http.get<GameState>('/game-state', {
    params: { sessionId },
  })
  return response.data
}

export async function resetGameState(sessionId: string) {
  const response = await http.delete<{ ok: boolean }>('/game-state', {
    params: { sessionId },
  })
  return response.data
}

export async function streamChat(input: {
  sessionId: string
  message: string
  apiKey: string
  baseUrl: string
  model: string
  onToken: (token: string) => void | Promise<void>
  onTool: (tool: ToolEvent) => void | Promise<void>
}) {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      'x-api-key': input.apiKey,
      'x-base-url': input.baseUrl,
      'x-model': input.model,
    },
    body: JSON.stringify({ sessionId: input.sessionId, message: input.message }),
  })

  if (!response.ok) {
    throw new Error(formatStreamError(await response.text()))
  }

  if (!response.body) {
    throw new Error('流式响应为空')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''

    for (const chunk of chunks) {
      const lines = chunk.split('\n')
      const eventLine = lines.find((line) => line.startsWith('event:'))
      const dataLine = lines.find((line) => line.startsWith('data:'))
      if (!eventLine || !dataLine) continue
      const event = eventLine.replace('event:', '').trim()
      const data = JSON.parse(dataLine.replace('data:', '').trim())
      if (event === 'token') await input.onToken(String(data))
      if (event === 'tool') await input.onTool(data as ToolEvent)
      if (event === 'error') throw new Error(data.message ?? 'stream error')
    }
  }
}
