import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { apiRoutes } from './routes/api.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDir, '../.env'), override: true })

const app = new Hono()

app.use(
  '*',
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'x-api-key', 'x-base-url', 'x-model'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  }),
)

app.route('/api', apiRoutes)
app.get('/', (c) => c.json({ ok: true, service: 'ai-dnd-server' }))

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port })
console.log(`AI D&D server running on http://localhost:${port}`)
