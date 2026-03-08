import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  name?: string
  tool_calls?: ToolCall[]
}

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type LlmConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

const currentDir = dirname(fileURLToPath(import.meta.url))
const llmDebugEnabled = process.env.LLM_DEBUG === 'true'
const llmDebugLogPath = resolve(currentDir, '../../logs/llm-debug.log')

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'roll_dice',
      description: 'Roll dice using D&D notation such as 1d20+3 or 2d6+1.',
      parameters: {
        type: 'object',
        properties: {
          notation: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['notation'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_hp',
      description: 'Apply HP changes to the player character in the database.',
      parameters: {
        type: 'object',
        properties: {
          delta: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['delta', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_inventory',
      description: 'Add or remove items from the player inventory in the database.',
      parameters: {
        type: 'object',
        properties: {
          itemName: { type: 'string' },
          quantity: { type: 'number' },
          operation: { type: 'string', enum: ['add', 'remove'] },
          reason: { type: 'string' },
        },
        required: ['itemName', 'quantity', 'operation', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upsert_npc',
      description: 'Create or update an NPC or monster record for the current scene.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          race: { type: 'string' },
          className: { type: 'string' },
          creatureType: { type: 'string' },
          level: { type: 'number' },
          maxHp: { type: 'number' },
          currentHp: { type: 'number' },
          armorClass: { type: 'number' },
          affinity: { type: 'number' },
          attitude: { type: 'string' },
          notes: { type: 'string' },
          skills: {
            type: 'array',
            items: { type: 'string' },
          },
          inventory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'number' },
              },
              required: ['name', 'quantity'],
            },
          },
          statuses: {
            type: 'array',
            items: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    color: { type: 'string' },
                  },
                  required: ['name'],
                },
              ],
            },
          },
          stats: {
            type: 'object',
            properties: {
              strength: { type: 'number' },
              dexterity: { type: 'number' },
              constitution: { type: 'number' },
              intelligence: { type: 'number' },
              wisdom: { type: 'number' },
              charisma: { type: 'number' },
            },
          },
          reason: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_npc_hp',
      description: 'Apply HP changes to an NPC or monster in the database.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          delta: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['name', 'delta', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_npc_inventory',
      description: 'Add or remove items from an NPC or monster inventory.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          itemName: { type: 'string' },
          quantity: { type: 'number' },
          operation: { type: 'string', enum: ['add', 'remove'] },
          reason: { type: 'string' },
        },
        required: ['name', 'itemName', 'quantity', 'operation', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_npc_affinity',
      description: 'Change how an NPC or monster feels about the player.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          delta: { type: 'number' },
          value: { type: 'number' },
          attitude: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['name', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_npc_status',
      description: 'Set, add, or remove status effects on an NPC or monster.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          operation: { type: 'string', enum: ['set', 'add', 'remove'] },
          statuses: {
            type: 'array',
            items: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    color: { type: 'string' },
                  },
                  required: ['name'],
                },
              ],
            },
          },
          reason: { type: 'string' },
        },
        required: ['name', 'statuses', 'reason'],
      },
    },
  },
] as const

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '')
}

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) return '***'
  return `${apiKey.slice(0, 4)}***${apiKey.slice(-4)}`
}

function writeLlmDebugLog(event: string, payload: unknown) {
  if (!llmDebugEnabled) return
  mkdirSync(dirname(llmDebugLogPath), { recursive: true })
  appendFileSync(
    llmDebugLogPath,
    `${new Date().toISOString()} ${event}\n${JSON.stringify(payload, null, 2)}\n\n`,
    'utf8',
  )
}

function makeToolCall(name: string, args: Record<string, unknown>): ToolCall {
  return {
    id: `call_${Math.random().toString(36).slice(2, 10)}`,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  }
}

function parseDsmlToolCalls(content: string): ToolCall[] {
  const matches = [...content.matchAll(/invoke\s+name="([^"]+)"[\s\S]*?(?=<\s*\/\s*\|\s*DSML\s*\|\s*invoke\s*>|$)/gi)]
  if (!matches.length) return []

  const calls: ToolCall[] = []
  for (const match of matches) {
    const block = match[0]
    const name = match[1]
    const args: Record<string, unknown> = {}
    const paramMatches = [...block.matchAll(/parameter\s+name="([^"]+)"\s+string="true">([\s\S]*?)<\s*\/\s*\|\s*DSML\s*\|\s*parameter\s*>/gi)]
    for (const paramMatch of paramMatches) {
      args[paramMatch[1]] = paramMatch[2].trim()
    }
    calls.push(makeToolCall(name, args))
  }
  return calls
}

function parseJsonToolCalls(content: string): ToolCall[] {
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    const entries = Array.isArray(parsed) ? parsed : [parsed]
    const calls: ToolCall[] = []

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      const record = entry as Record<string, unknown>
      const name = typeof record.name === 'string'
        ? record.name
        : typeof record.function === 'string'
          ? record.function
          : typeof record.tool === 'string'
            ? record.tool
            : null
      const args = record.arguments && typeof record.arguments === 'object'
        ? record.arguments as Record<string, unknown>
        : record.params && typeof record.params === 'object'
          ? record.params as Record<string, unknown>
          : record.input && typeof record.input === 'object'
            ? record.input as Record<string, unknown>
            : null

      if (!name || !args) continue
      calls.push(makeToolCall(name, args))
    }

    return calls
  } catch {
    return []
  }
}

function extractToolCalls(message: { content?: string | null; tool_calls?: ToolCall[] }) {
  const content = message.content?.trim() || ''
  const directToolCalls = message.tool_calls ?? []
  if (directToolCalls.length > 0) {
    return { content, toolCalls: directToolCalls }
  }

  const dsmlCalls = parseDsmlToolCalls(content)
  if (dsmlCalls.length > 0) {
    return { content: '', toolCalls: dsmlCalls }
  }

  const jsonCalls = parseJsonToolCalls(content)
  if (jsonCalls.length > 0) {
    return { content: '', toolCalls: jsonCalls }
  }

  return { content, toolCalls: [] }
}

export async function createCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  withTools = true,
  toolChoice: 'auto' | 'required' = 'auto',
) {
  writeLlmDebugLog('llm.request', {
    mode: 'completion',
    baseUrl: normalizeBaseUrl(config.baseUrl),
    model: config.model,
    apiKey: maskApiKey(config.apiKey),
    withTools,
    toolChoice,
    messages,
  })

  const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.8,
      ...(withTools
        ? {
            tools: TOOL_DEFINITIONS,
            tool_choice: toolChoice,
          }
        : {}),
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string | null
        tool_calls?: ToolCall[]
      }
    }>
  }

  const message = data.choices?.[0]?.message ?? { content: '', tool_calls: [] }
  const extracted = extractToolCalls(message)
  writeLlmDebugLog('llm.response', {
    mode: 'completion',
    rawMessage: message,
    extracted,
  })

  return {
    content: extracted.content,
    tool_calls: extracted.toolCalls,
  }
}

export async function streamCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  onToken: (token: string) => Promise<void> | void,
) {
  writeLlmDebugLog('llm.request', {
    mode: 'stream',
    baseUrl: normalizeBaseUrl(config.baseUrl),
    model: config.model,
    apiKey: maskApiKey(config.apiKey),
    withTools: false,
    toolChoice: null,
    messages,
  })

  const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.8,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Streaming request failed: ${response.status} ${await response.text()}`)
  }

  const decoder = new TextDecoder()
  const reader = response.body.getReader()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''

    for (const line of parts) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') {
        writeLlmDebugLog('llm.response', {
          mode: 'stream',
          content: fullText,
        })
        return fullText
      }

      try {
        const json = JSON.parse(data) as {
          choices?: Array<{
            delta?: {
              content?: string
            }
          }>
        }
        const token = json.choices?.[0]?.delta?.content
        if (token) {
          fullText += token
          await onToken(token)
        }
      } catch {
      }
    }
  }

  writeLlmDebugLog('llm.response', {
    mode: 'stream',
    content: fullText,
  })
  return fullText
}
