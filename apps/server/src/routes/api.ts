import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { z } from 'zod'
import { getRules, ABILITIES } from '../lib/dnd-data.js'
import { createCharacter, getGameState, resetSessionData, runChat } from '../lib/game-service.js'

const baseStatsSchema = z.object({
  strength: z.number().int().min(8).max(15),
  dexterity: z.number().int().min(8).max(15),
  constitution: z.number().int().min(8).max(15),
  intelligence: z.number().int().min(8).max(15),
  wisdom: z.number().int().min(8).max(15),
  charisma: z.number().int().min(8).max(15),
})

const characterSchema = z.object({
  name: z.string().min(1).max(100),
  raceId: z.string().min(1),
  classId: z.string().min(1),
  notes: z.string().max(1000).optional(),
  classSkillSelections: z.array(z.string()).max(6),
  raceSkillSelections: z.array(z.string()).max(4).optional(),
  bonusAbilityChoices: z.array(z.enum(ABILITIES)).max(2).optional(),
  baseStats: baseStatsSchema,
})

const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
})

export const apiRoutes = new Hono()

apiRoutes.get('/rules', (c) => {
  return c.json(getRules())
})

apiRoutes.post('/characters', async (c) => {
  try {
    const raw = await c.req.json()
    const parsed = characterSchema.safeParse(raw)
    if (!parsed.success) {
      console.error('create-character payload invalid', JSON.stringify(raw), parsed.error.flatten())
      return c.json({ message: 'Invalid character payload', issues: parsed.error.flatten() }, 400)
    }

    const result = await createCharacter(parsed.data)
    return c.json(result)
  } catch (error) {
    console.error('create-character failed', error)
    return c.json({ message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

apiRoutes.get('/game-state', async (c) => {
  try {
    const sessionId = c.req.query('sessionId')
    if (!sessionId) return c.json({ message: 'sessionId is required' }, 400)
    const state = await getGameState(sessionId)
    return c.json(state)
  } catch (error) {
    return c.json({ message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

apiRoutes.delete('/game-state', async (c) => {
  try {
    const sessionId = c.req.query('sessionId')
    if (!sessionId) return c.json({ message: 'sessionId is required' }, 400)
    await resetSessionData(sessionId)
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

apiRoutes.post('/chat/stream', async (c) => {
  const apiKey = c.req.header('x-api-key')
  const baseUrl = c.req.header('x-base-url')
  const model = c.req.header('x-model')
  if (!apiKey || !baseUrl || !model) {
    return c.json({ message: 'Missing x-api-key, x-base-url or x-model header' }, 400)
  }

  const raw = await c.req.json().catch(() => ({}))
  const parsed = chatSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ message: 'Invalid request payload', issues: parsed.error.flatten() }, 400)
  }
  const payload = parsed.data

  return streamSSE(c, async (stream) => {
    const send = async (event: string, data: unknown) => {
      await stream.writeSSE({ event, data: JSON.stringify(data) })
    }

    try {
      await runChat({
        sessionId: payload.sessionId,
        userInput: payload.message,
        llmConfig: { apiKey, baseUrl, model },
        onEvent: async ({ event, data }) => send(event, data),
      })
    } catch (error) {
      await send('error', { message: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      await stream.close()
    }
  })
})
