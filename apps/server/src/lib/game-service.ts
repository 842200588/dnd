import { randomUUID } from 'node:crypto'
import type { RowDataPacket } from 'mysql2'
import { pool } from './db.js'
import { loadDndRules } from './dnd-rules.js'
import { getRules, validateAndBuildCharacter, type CharacterCreationInput } from './dnd-data.js'
import type { ChatMessage, LlmConfig, ToolCall } from './llm.js'
import { createCompletion, streamCompletion } from './llm.js'

export type CharacterInput = CharacterCreationInput

type InventoryItem = {
  name: string
  quantity: number
}

type StatusBadge = {
  name: string
  color: string
}

type CharacterRow = RowDataPacket & {
  id: number
  session_id: string
  race_id: string
  class_id: string
  name: string
  race: string
  class_name: string
  level: number
  max_hp: number
  current_hp: number
  armor_class: number
  strength_score: number
  dexterity_score: number
  constitution_score: number
  intelligence_score: number
  wisdom_score: number
  charisma_score: number
  gold_amount: number
  inventory_json: unknown
  skills_json: unknown
  notes: string | null
}

type NpcRow = RowDataPacket & {
  id: number
  session_id: string
  name: string
  race: string | null
  class_name: string | null
  creature_type: string | null
  level: number
  max_hp: number
  current_hp: number
  armor_class: number
  strength_score: number
  dexterity_score: number
  constitution_score: number
  intelligence_score: number
  wisdom_score: number
  charisma_score: number
  inventory_json: unknown
  skills_json: unknown
  affinity: number
  attitude: string
  statuses_json: unknown
  notes: string | null
}

type SessionRow = RowDataPacket & { story_summary: string | null }
type MessageRow = RowDataPacket & {
  role: 'assistant' | 'user' | 'tool' | 'system'
  content: string
  tool_name: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  '中毒': '#5cb85c',
  '魅惑': '#d982ff',
  '潮湿': '#4ba3ff',
  '灼烧': '#ff6b57',
  '流血': '#d94b5c',
  '恐慌': '#f7c65c',
  '束缚': '#8fb3ff',
  '震慑': '#ffb347',
}


/**
 * 创建一个新的游戏角色，并初始化 session、消息记录。
 * 所有写操作在一个事务中完成，任何失败都会回滚。
 * @param input 角色创建输入，包含种族、职业、属性点分配等
 * @returns 新建 session 的 ID，用于后续所有 API 调用
 */
export async function createCharacter(input: CharacterInput) {
  const sessionId = randomUUID()
  const built = validateAndBuildCharacter(input)

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [result] = await connection.execute(
      `INSERT INTO characters (
        session_id, race_id, class_id, name, race, class_name, level, max_hp, current_hp, armor_class,
        strength_score, dexterity_score, constitution_score, intelligence_score,
        wisdom_score, charisma_score, gold_amount, inventory_json, skills_json, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, ?)`,
      [
        sessionId,
        input.raceId,
        input.classId,
        input.name,
        built.race.name,
        built.clazz.name,
        built.maxHp,
        built.maxHp,
        built.armorClass,
        built.finalStats.strength,
        built.finalStats.dexterity,
        built.finalStats.constitution,
        built.finalStats.intelligence,
        built.finalStats.wisdom,
        built.finalStats.charisma,
        JSON.stringify(built.inventory),
        JSON.stringify(built.selectedSkills),
        input.notes ?? null,
      ],
    )

    const characterId = Number((result as { insertId: number }).insertId)

    await connection.execute(
      'INSERT INTO game_sessions (session_id, character_id, story_summary) VALUES (?, ?, ?)',
      [sessionId, characterId, `角色 ${input.name} 已进入冒险起点，等待地下城主开场。`],
    )

    await connection.execute(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      [sessionId, 'system', '角色已创建，等待地下城主开场。'],
    )

    await connection.commit()
    return { sessionId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}


/**
 * 获取指定 session 的完整游戏状态，包含角色、NPC、故事摘要和最近消息。
 * 四个查询并行执行以优化响应时间。
 * @param sessionId 当前局层的 UUID
 */
export async function getGameState(sessionId: string) {
  const [character, npcs, sessions, messages] = await Promise.all([
    getCharacterBySessionId(sessionId),
    getNpcsBySessionId(sessionId),
    pool.query<SessionRow[]>('SELECT story_summary FROM game_sessions WHERE session_id = ?', [sessionId]),
    pool.query<MessageRow[]>(
      'SELECT role, content, tool_name, created_at FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 16',
      [sessionId],
    ),
  ])

  return {
    sessionId,
    summary: sessions[0][0]?.story_summary ?? '',
    character,
    npcs,
    recentMessages: messages[0].reverse(),
  }
}


/**
 * 删除指定 session 的所有游戏数据，包括角色、NPC、消息、会话记录。
 * 在事务中执行，失败则回滚。
 * @param sessionId 要清除的 session UUID
 */
export async function resetSessionData(sessionId: string) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute('DELETE FROM messages WHERE session_id = ?', [sessionId])
    await connection.execute('DELETE FROM npcs WHERE session_id = ?', [sessionId])
    await connection.execute('DELETE FROM game_sessions WHERE session_id = ?', [sessionId])
    await connection.execute('DELETE FROM characters WHERE session_id = ?', [sessionId])
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/**
 * 主对话入口：处理用户输入并驱动 LLM 多轮对话流程。
 *
 * 执行流程：
 * 1. 前置检查（precheck）：快速拦截规则判断（如背包无药水），命中则不进 LLM。
 * 2. 首次调用（firstPass）：与 LLM 交互并获取工具调用列表。
 * 3. 强制工具调用（forcedToolPass）：若 LLM 漏掉工具却即兴叙事，强制重生。
 * 4. 工具执行（applyToolCall）：将 LLM 决策写入数据库并推送前端工具事件。
 * 5. 可选追加变化（followUp）：若这一轮按骰但未写回伤害，强制补调变化工具。
 * 6. 最终叙事（finalStream）：基于真实工具结果流式输出沉浸式副本。
 * 7. 摘要刷新（triggerSummaryRefresh）：异步触发，平行进行不阻塞响应。
 *
 * @param params.sessionId 当前局层 UUID
 * @param params.userInput 玩家本轮行动描述
 * @param params.llmConfig LLM 接入配置（BYOK，每次请求从请求头取得）
 * @param params.onEvent SSE 事件发送回调，推送 token/tool/done/error 到客户端
 */
export async function runChat(params: {
  sessionId: string
  userInput: string
  llmConfig: LlmConfig
  onEvent: (event: { event: string; data: unknown }) => Promise<void>
}) {
  const userInput = params.userInput.trim()
  const state = await getGameState(params.sessionId)
  const precheckFailure = runPrecheck(userInput, state.character.inventory)

  await insertMessage(params.sessionId, 'user', userInput)

  if (precheckFailure) {
    await insertMessage(params.sessionId, 'assistant', precheckFailure)
    await streamText(precheckFailure, params.onEvent)
    await params.onEvent({ event: 'done', data: { ok: true } })
    return
  }

  const rules = await loadDndRules()
  const promptState = await getPromptState(params.sessionId)
  const recentMessages = await getRecentPromptMessages(params.sessionId)
  const baseMessages = buildPromptMessages({
    rules,
    state: promptState,
    summary: state.summary,
    recentMessages,
    latestInput: userInput,
  })

  // ── 第一轮 LLM 调用：获取工具调用列表（或纯叙事）──────────────────
  const firstPass = await createCompletion(params.llmConfig, baseMessages)
  let toolCalls = firstPass.tool_calls ?? []
  let firstPassContent = firstPass.content?.trim() || ''

  // 若 LLM 涉及数值改变但未调用工具，强制重新生成 tool_choice=required
  if (!toolCalls.length && requiresToolResolution(firstPassContent)) {
    const forcedToolPass = await createCompletion(
      params.llmConfig,
      [
        ...baseMessages,
        { role: 'assistant', content: firstPassContent },
        {
          role: 'user',
          content: '你上一条回复已经涉及命中、伤害、治疗、生命值变化、物品变化或状态变化，但没有调用必须的工具。现在禁止叙事，只返回本轮所需的工具调用。',
        },
      ],
      true,
      'required',
    )

    toolCalls = forcedToolPass.tool_calls ?? []
    firstPassContent = forcedToolPass.content?.trim() || firstPassContent
  }

  // ── 无工具调用路径：清洁叙事后直接流式输出 ───────────────────────
  if (!toolCalls.length) {
    const safeNarrative = requiresToolResolution(firstPassContent)
      ? await rewriteNarrativeWithoutMechanicalClaims(params.llmConfig, baseMessages, firstPassContent)
      : firstPassContent
    const content = sanitizeNarrativeText(safeNarrative || '火光在石壁上摇晃，却没有新的回应。')
    await streamText(content, params.onEvent)
    await insertMessage(params.sessionId, 'assistant', content)
    triggerSummaryRefresh(params.sessionId, params.llmConfig)
    await params.onEvent({ event: 'done', data: { ok: true } })
    return
  }

  // ── 工具执行阶段：写库并向前端推送每个工具事件 ─────────────────────
  const toolMessages: ChatMessage[] = []
  const executedToolResults: unknown[] = []
  for (const toolCall of toolCalls) {
    const toolResult = await applyToolCall(params.sessionId, toolCall)
    toolMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      name: toolCall.function.name,
      content: JSON.stringify(toolResult),
    })
    executedToolResults.push(toolResult)
    await insertMessage(params.sessionId, 'tool', JSON.stringify(toolResult), toolCall.function.name)
    await params.onEvent({ event: 'tool', data: toolResult })
  }

  // ── 可选追加变化轮：骰子开出后强制补写伤害/治疗等状态变更工具 ──────
  if (shouldForceFollowUpMutation(userInput, toolCalls)) {
    const mutationPromptState = await getPromptState(params.sessionId)
    const followUpPass = await createCompletion(
      params.llmConfig,
      [
        { role: 'system', content: buildSystemPrompt(rules, mutationPromptState, state.summary) },
        ...recentMessages,
        { role: 'user', content: userInput },
        {
          role: 'user',
          content: `本轮已经执行的工具结果 JSON：${JSON.stringify(executedToolResults)}。如果这些结果还不足以写回真实伤害、治疗、物品或状态变化，请现在只返回缺失的必要工具调用，不要输出任何叙事。`,
        },
      ],
      true,
      'required',
    )

    for (const extraToolCall of followUpPass.tool_calls ?? []) {
      const extraToolResult = await applyToolCall(params.sessionId, extraToolCall)
      toolCalls.push(extraToolCall)
      toolMessages.push({
        role: 'tool',
        tool_call_id: extraToolCall.id,
        name: extraToolCall.function.name,
        content: JSON.stringify(extraToolResult),
      })
      executedToolResults.push(extraToolResult)
      await insertMessage(params.sessionId, 'tool', JSON.stringify(extraToolResult), extraToolCall.function.name)
      await params.onEvent({ event: 'tool', data: extraToolResult })
    }
  }

  // ── 最终叙事：基于真实工具结果流式生成沉浸式文字 ─────────────────
  const refreshedPromptState = await getPromptState(params.sessionId)
  const finalMessages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(rules, refreshedPromptState, state.summary) },
    ...recentMessages,
    { role: 'user', content: userInput },
    {
      role: 'user',
      content: `本轮工具已经执行完毕。以下是真实最新状态与工具结果 JSON：${JSON.stringify({ toolResults: executedToolResults, state: refreshedPromptState })}。请只用沉浸式剧情语言描述真实结果，不要解释系统、工具、JSON、函数调用或底层机制，也不要出现"DM注""系统提示"等字样。`,
    },
  ]

  const finalText = await streamCompletion(params.llmConfig, finalMessages, async () => { })
  let sanitizedFinalText = sanitizeNarrativeText(finalText || '四周归于死寂，只有你方才的举动还在空气里回荡。')
  // 若最终叙事仍包含未结算机械数值，触发一次改写（保险措施）
  if (requiresToolResolution(sanitizedFinalText) && !hasStateMutationTool(toolCalls)) {
    sanitizedFinalText = sanitizeNarrativeText(
      await rewriteNarrativeWithoutMechanicalClaims(params.llmConfig, baseMessages, sanitizedFinalText),
    )
  }

  await streamText(sanitizedFinalText, params.onEvent)
  await insertMessage(params.sessionId, 'assistant', sanitizedFinalText)
  triggerSummaryRefresh(params.sessionId, params.llmConfig)
  await params.onEvent({ event: 'done', data: { ok: true } })
}

/**
 * 将完整文本模拟流式推送给前端。
 * 将文本按每 18 字分块，逐块发送 token 事件，展现「打字机」效果。
 * 用于前置检查命中时的回复和纯取消息的输出。
 */
async function streamText(text: string, onEvent: (event: { event: string; data: unknown }) => Promise<void>) {
  for (const chunk of text.match(/.{1,18}/g) ?? []) {
    await onEvent({ event: 'token', data: chunk })
  }
}

/**
 * 前置规则检查，快速拖单不需进 LLM 的边界情形。
 * 目前实现：玩家尝试使用药水但背包为空时拦截并返回汉化回应。
 * @param userInput 玩家输入内容
 * @param inventory 当前局层角色的背包
 * @returns 拦截回应文本，否则返回 null 表示支持进入 LLM
 */
function runPrecheck(userInput: string, inventory: InventoryItem[]) {
  const mentionsPotion = /喝.*药水|使用.*药水|治疗药水/.test(userInput)
  if (!mentionsPotion) return null
  const potion = inventory.find((item) => item.name.includes('药水'))
  if (!potion || potion.quantity <= 0) {
    return '你伸手去翻找药水，却只摸到空空的皮袋和碰撞的铁器。背包里已经没有能立刻饮下的药剂了。'
  }
  return null
}

/**
 * 构建发给 LLM 的 system prompt，包含全局规则、当前状态 JSON 和剧情摘要。
 * @param rules D&D 5E 规则文本内容
 * @param state 当前玩家和 NPC 的完整状态 JSON
 * @param summary 最近的剧情摘要文字
 */
function buildSystemPrompt(rules: string, state: unknown, summary: string) {
  return [
    '以下是必须先阅读的规则说明：',
    rules,
    '以下是当前真实状态 JSON：',
    JSON.stringify(state),
    '以下是剧情摘要：',
    summary || '暂无摘要。',
  ].join('\n\n')
}

/**
 * 清洁叙事文本，去掉可能由 LLM 输出的底层机制文字。
 * 包括：DSML 标记、JSON 代码块、DM注/系统提示开头的行。
 * @param text 待清洁的叙事字符串
 * @returns 清洁后的纯叙事文本
 */
function sanitizeNarrativeText(text: string) {
  const bannedPrefixes = ['DM注', '系统提示', '工具调用', 'function_calls', 'tool_calls']
  return text
    .replace(/<\s*\|\s*DSML[\s\S]*$/gi, '')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      return !bannedPrefixes.some((prefix) => trimmed.startsWith(prefix))
    })
    .join('\n')
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .trim()
}

/**
 * 判断是否需要强制追加变化轮。
 * 当这一轮操作包含攻击/伤害意图，且骨子已掉但尚未写回具体状态变化时，返回 true。
 */
function shouldForceFollowUpMutation(userInput: string, toolCalls: ToolCall[]) {
  if (!toolCalls.some((toolCall) => toolCall.function.name === 'roll_dice')) return false
  if (hasStateMutationTool(toolCalls)) return false
  return /(攻击|打自己|自残|伤害|砍|刺|挥刀|挥拳|治疗|回血|喝药|药水|中毒|魅惑|灼烧|潮湿)/.test(userInput)
}

/**
 * 检测工具列表中是否包含写入状态的变化性工具。
 * 用于判断这一轮行动的最终和叙事是否已完整覆盖应有的数字变化。
 */
function hasStateMutationTool(toolCalls: ToolCall[]) {
  return toolCalls.some((toolCall) => [
    'update_hp',
    'update_inventory',
    'update_npc_hp',
    'update_npc_inventory',
    'update_npc_affinity',
    'update_npc_status',
    'upsert_npc',
  ].includes(toolCall.function.name))
}
function requiresToolResolution(text: string) {
  const patterns = [
    /生命(?:值|状态)?[:：]?\s*\d+\s*\/\s*\d+/,
    /\d+\s*点(?:伤害|治疗|生命)/,
    /(?:命中|未命中|暴击|豁免成功|豁免失败|扣除|恢复).{0,12}(?:生命|血量|HP)/,
    /(?:获得|失去|移除|拾起|消耗).{0,12}(?:药水|金币|背包|物品|装备)/,
    /(?:陷入|进入|受到).{0,8}(?:中毒|魅惑|潮湿|灼烧|流血|恐慌|束缚|震慑)/,
  ]
  return patterns.some((pattern) => pattern.test(text))
}

async function rewriteNarrativeWithoutMechanicalClaims(
  llmConfig: LlmConfig,
  baseMessages: ChatMessage[],
  unsafeNarrative: string,
) {
  const repaired = await createCompletion(
    llmConfig,
    [
      ...baseMessages,
      { role: 'assistant', content: unsafeNarrative },
      {
        role: 'user',
        content: '你上一条回复写出了未经工具结算确认的数值变化。请改写成纯沉浸式剧情描述，不要出现伤害数字、生命值、命中结果、背包增减、状态结算等机械信息。',
      },
    ],
    false,
  )

  return repaired.content?.trim() || unsafeNarrative
}
function buildPromptMessages(params: { rules: string; state: unknown; summary: string; recentMessages: ChatMessage[]; latestInput: string }): ChatMessage[] {
  return [
    { role: 'system', content: buildSystemPrompt(params.rules, params.state, params.summary) },
    ...params.recentMessages,
    { role: 'user', content: params.latestInput },
  ]
}

async function applyToolCall(sessionId: string, toolCall: ToolCall) {
  const args = safeParseArgs(toolCall.function.arguments)

  switch (toolCall.function.name) {
    case 'roll_dice': {
      const notation = String(args.notation ?? '1d20')
      return { type: 'dice', notation, result: rollDice(notation), reason: String(args.reason ?? '') }
    }
    case 'update_hp': {
      const delta = Number(args.delta ?? 0)
      const reason = String(args.reason ?? '生命值发生变化')
      const character = await getCharacterBySessionId(sessionId)
      const nextHp = Math.min(character.maxHp, Math.max(0, character.currentHp + delta))
      await pool.execute('UPDATE characters SET current_hp = ? WHERE session_id = ?', [nextHp, sessionId])
      return { type: 'hp', previousHp: character.currentHp, currentHp: nextHp, delta, reason }
    }
    case 'update_inventory': {
      const itemName = String(args.itemName ?? '')
      const quantity = Math.abs(Number(args.quantity ?? 0))
      const operation = String(args.operation ?? 'add')
      const reason = String(args.reason ?? '背包发生变化')
      const character = await getCharacterBySessionId(sessionId)
      const inventory = [...character.inventory]
      const existing = inventory.find((item) => item.name === itemName)

      if (operation === 'add') {
        if (existing) existing.quantity += quantity
        else inventory.push({ name: itemName, quantity })
      } else {
        if (!existing || existing.quantity < quantity) {
          return { type: 'inventory', ok: false, itemName, quantity, operation, reason: `库存不足，无法移除 ${quantity} 个 ${itemName}` }
        }
        existing.quantity -= quantity
      }

      const sanitized = inventory.filter((item) => item.quantity > 0)
      await pool.execute('UPDATE characters SET inventory_json = ? WHERE session_id = ?', [JSON.stringify(sanitized), sessionId])
      return { type: 'inventory', ok: true, itemName, quantity, operation, reason, inventory: sanitized }
    }
    case 'upsert_npc': {
      const npc = await upsertNpc(sessionId, args)
      return { type: 'npc_upsert', npc, reason: String(args.reason ?? `${npc.name} 的档案已更新`) }
    }
    case 'update_npc_hp': {
      const npc = await getNpcByName(sessionId, String(args.name ?? ''))
      const delta = Number(args.delta ?? 0)
      const reason = String(args.reason ?? `${npc.name} 的生命值发生变化`)
      const nextHp = Math.min(npc.maxHp, Math.max(0, npc.currentHp + delta))
      await pool.execute('UPDATE npcs SET current_hp = ? WHERE id = ?', [nextHp, npc.id])
      return { type: 'npc_hp', name: npc.name, previousHp: npc.currentHp, currentHp: nextHp, delta, reason }
    }
    case 'update_npc_inventory': {
      const npc = await getNpcByName(sessionId, String(args.name ?? ''))
      const itemName = String(args.itemName ?? '')
      const quantity = Math.abs(Number(args.quantity ?? 0))
      const operation = String(args.operation ?? 'add')
      const reason = String(args.reason ?? `${npc.name} 的装备发生变化`)
      const inventory = [...npc.inventory]
      const existing = inventory.find((item) => item.name === itemName)

      if (operation === 'add') {
        if (existing) existing.quantity += quantity
        else inventory.push({ name: itemName, quantity })
      } else {
        if (!existing || existing.quantity < quantity) {
          return { type: 'npc_inventory', ok: false, name: npc.name, itemName, quantity, operation, reason: `${npc.name} 身上没有足够的 ${itemName}` }
        }
        existing.quantity -= quantity
      }

      const sanitized = inventory.filter((item) => item.quantity > 0)
      await pool.execute('UPDATE npcs SET inventory_json = ? WHERE id = ?', [JSON.stringify(sanitized), npc.id])
      return { type: 'npc_inventory', ok: true, name: npc.name, itemName, quantity, operation, reason, inventory: sanitized }
    }
    case 'update_npc_affinity': {
      const npc = await getNpcByName(sessionId, String(args.name ?? ''))
      const delta = Number(args.delta ?? 0)
      const reason = String(args.reason ?? `${npc.name} 对玩家的好感发生变化`)
      const nextAffinity = Number.isFinite(Number(args.value)) ? Number(args.value) : npc.affinity + delta
      const attitude = typeof args.attitude === 'string' ? args.attitude : npc.attitude
      await pool.execute('UPDATE npcs SET affinity = ?, attitude = ? WHERE id = ?', [nextAffinity, attitude, npc.id])
      return { type: 'npc_affinity', name: npc.name, previousAffinity: npc.affinity, currentAffinity: nextAffinity, attitude, reason }
    }
    case 'update_npc_status': {
      const npc = await getNpcByName(sessionId, String(args.name ?? ''))
      const operation = String(args.operation ?? 'set')
      const nextStatuses = normalizeStatuses(args.statuses ?? [])
      let statuses = npc.statuses
      if (operation === 'set') {
        statuses = nextStatuses
      } else if (operation === 'add') {
        statuses = mergeStatuses([...npc.statuses, ...nextStatuses])
      } else if (operation === 'remove') {
        const removeNames = new Set(nextStatuses.map((item) => item.name))
        statuses = npc.statuses.filter((item) => !removeNames.has(item.name))
      }
      await pool.execute('UPDATE npcs SET statuses_json = ? WHERE id = ?', [JSON.stringify(statuses), npc.id])
      return { type: 'npc_status', name: npc.name, statuses, operation, reason: String(args.reason ?? `${npc.name} 的状态已更新`) }
    }
    default:
      return { type: 'unknown', ok: false, message: `未知工具：${toolCall.function.name}` }
  }
}

function safeParseArgs(raw: string) {
  try {
    return JSON.parse(raw || '{}') as Record<string, unknown>
  } catch {
    return {}
  }
}

function rollDice(notation: string) {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) return { total: 0, rolls: [], modifier: 0, error: 'invalid_notation' }
  const count = Number(match[1])
  const sides = Number(match[2])
  const modifier = Number(match[3] ?? 0)
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
  return { total: rolls.reduce((sum, value) => sum + value, 0) + modifier, rolls, modifier }
}

async function getPromptState(sessionId: string) {
  const [character, npcs] = await Promise.all([getCharacterBySessionId(sessionId), getNpcsBySessionId(sessionId)])
  const rules = getRules()
  const raceMeta = rules.races.find((item) => item.id === character.raceId)
  const classMeta = rules.classes.find((item) => item.id === character.classId)

  return {
    sessionId,
    player: {
      name: character.name,
      race: { id: character.raceId, name: character.race, traits: raceMeta?.traits ?? [] },
      class: { id: character.classId, name: character.className, savingThrows: classMeta?.savingThrows ?? [] },
      level: character.level,
      hp: { current: character.currentHp, max: character.maxHp },
      armorClass: character.armorClass,
      abilityScores: character.stats,
      skills: character.skills,
      gold: character.goldAmount,
      inventory: character.inventory,
      notes: character.notes,
    },
    npcs,
    statusPalette: STATUS_COLORS,
  }
}

async function getRecentPromptMessages(sessionId: string): Promise<ChatMessage[]> {
  const [messages] = await pool.query<MessageRow[]>(
    `SELECT role, content FROM messages WHERE session_id = ? AND role IN ('assistant', 'user') ORDER BY created_at DESC LIMIT 10`,
    [sessionId],
  )

  return messages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

async function insertMessage(sessionId: string, role: 'assistant' | 'user' | 'tool' | 'system', content: string, toolName?: string) {
  await pool.execute('INSERT INTO messages (session_id, role, content, tool_name) VALUES (?, ?, ?, ?)', [sessionId, role, content, toolName ?? null])
}

async function getCharacterBySessionId(sessionId: string) {
  const [rows] = await pool.query<CharacterRow[]>('SELECT * FROM characters WHERE session_id = ? LIMIT 1', [sessionId])
  if (!rows[0]) throw new Error('Character not found')
  const row = rows[0]
  return {
    id: row.id,
    sessionId: row.session_id,
    raceId: row.race_id,
    classId: row.class_id,
    name: row.name,
    race: row.race,
    className: row.class_name,
    level: row.level,
    maxHp: row.max_hp,
    currentHp: row.current_hp,
    armorClass: row.armor_class,
    stats: {
      strength: row.strength_score,
      dexterity: row.dexterity_score,
      constitution: row.constitution_score,
      intelligence: row.intelligence_score,
      wisdom: row.wisdom_score,
      charisma: row.charisma_score,
    },
    skills: parseJson<string[]>(row.skills_json, []),
    goldAmount: row.gold_amount,
    inventory: parseJson<InventoryItem[]>(row.inventory_json, []),
    notes: row.notes,
  }
}

async function getNpcsBySessionId(sessionId: string) {
  const [rows] = await pool.query<NpcRow[]>('SELECT * FROM npcs WHERE session_id = ? ORDER BY updated_at DESC, id DESC', [sessionId])
  return rows.map(mapNpcRow)
}

async function getNpcByName(sessionId: string, name: string) {
  const [rows] = await pool.query<NpcRow[]>('SELECT * FROM npcs WHERE session_id = ? AND name = ? ORDER BY id DESC LIMIT 1', [sessionId, name])
  if (!rows[0]) {
    throw new Error(`NPC not found: ${name}`)
  }
  return mapNpcRow(rows[0])
}

async function upsertNpc(sessionId: string, args: Record<string, unknown>) {
  const name = String(args.name ?? '').trim()
  if (!name) throw new Error('NPC name is required')

  const existing = await findNpcByName(sessionId, name)
  const stats = normalizeStats(args.stats)
  const payload = {
    race: nullableString(args.race),
    className: nullableString(args.className),
    creatureType: nullableString(args.creatureType) ?? 'NPC',
    level: numberOr(args.level, existing?.level ?? 1),
    maxHp: numberOr(args.maxHp, existing?.maxHp ?? 1),
    currentHp: numberOr(args.currentHp, existing?.currentHp ?? numberOr(args.maxHp, existing?.maxHp ?? 1)),
    armorClass: numberOr(args.armorClass, existing?.armorClass ?? 10),
    stats: stats ?? existing?.stats ?? {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    inventory: normalizeInventory(args.inventory ?? existing?.inventory ?? []),
    skills: normalizeStringArray(args.skills ?? existing?.skills ?? []),
    affinity: numberOr(args.affinity, existing?.affinity ?? 0),
    attitude: nullableString(args.attitude) ?? existing?.attitude ?? '中立',
    statuses: normalizeStatuses(args.statuses ?? existing?.statuses ?? []),
    notes: nullableString(args.notes) ?? existing?.notes ?? null,
  }

  if (existing) {
    await pool.execute(
      `UPDATE npcs
       SET race = ?, class_name = ?, creature_type = ?, level = ?, max_hp = ?, current_hp = ?, armor_class = ?,
           strength_score = ?, dexterity_score = ?, constitution_score = ?, intelligence_score = ?, wisdom_score = ?, charisma_score = ?,
           inventory_json = ?, skills_json = ?, affinity = ?, attitude = ?, statuses_json = ?, notes = ?
       WHERE id = ?`,
      [
        payload.race,
        payload.className,
        payload.creatureType,
        payload.level,
        payload.maxHp,
        payload.currentHp,
        payload.armorClass,
        payload.stats.strength,
        payload.stats.dexterity,
        payload.stats.constitution,
        payload.stats.intelligence,
        payload.stats.wisdom,
        payload.stats.charisma,
        JSON.stringify(payload.inventory),
        JSON.stringify(payload.skills),
        payload.affinity,
        payload.attitude,
        JSON.stringify(payload.statuses),
        payload.notes,
        existing.id,
      ],
    )
  } else {
    await pool.execute(
      `INSERT INTO npcs (
        session_id, name, race, class_name, creature_type, level, max_hp, current_hp, armor_class,
        strength_score, dexterity_score, constitution_score, intelligence_score, wisdom_score, charisma_score,
        inventory_json, skills_json, affinity, attitude, statuses_json, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        name,
        payload.race,
        payload.className,
        payload.creatureType,
        payload.level,
        payload.maxHp,
        payload.currentHp,
        payload.armorClass,
        payload.stats.strength,
        payload.stats.dexterity,
        payload.stats.constitution,
        payload.stats.intelligence,
        payload.stats.wisdom,
        payload.stats.charisma,
        JSON.stringify(payload.inventory),
        JSON.stringify(payload.skills),
        payload.affinity,
        payload.attitude,
        JSON.stringify(payload.statuses),
        payload.notes,
      ],
    )
  }

  return getNpcByName(sessionId, name)
}

async function findNpcByName(sessionId: string, name: string) {
  const [rows] = await pool.query<NpcRow[]>('SELECT * FROM npcs WHERE session_id = ? AND name = ? ORDER BY id DESC LIMIT 1', [sessionId, name])
  return rows[0] ? mapNpcRow(rows[0]) : null
}

function mapNpcRow(row: NpcRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    race: row.race,
    className: row.class_name,
    creatureType: row.creature_type,
    level: row.level,
    maxHp: row.max_hp,
    currentHp: row.current_hp,
    armorClass: row.armor_class,
    stats: {
      strength: row.strength_score,
      dexterity: row.dexterity_score,
      constitution: row.constitution_score,
      intelligence: row.intelligence_score,
      wisdom: row.wisdom_score,
      charisma: row.charisma_score,
    },
    inventory: parseJson<InventoryItem[]>(row.inventory_json, []),
    skills: parseJson<string[]>(row.skills_json, []),
    affinity: row.affinity,
    attitude: row.attitude,
    statuses: normalizeStatuses(row.statuses_json),
    notes: row.notes,
  }
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  if (value !== null && value !== undefined) {
    return value as T
  }

  return fallback
}

function normalizeInventory(value: unknown): InventoryItem[] {
  const list = parseJson<Array<{ name?: unknown; quantity?: unknown }>>(value, [])
  return list
    .map((item) => ({
      name: String(item.name ?? '').trim(),
      quantity: Math.max(0, Number(item.quantity ?? 0)),
    }))
    .filter((item) => item.name && item.quantity > 0)
}

function normalizeStringArray(value: unknown) {
  const list = parseJson<unknown[]>(value, Array.isArray(value) ? value : [])
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))]
}

function normalizeStatuses(value: unknown): StatusBadge[] {
  const list = parseJson<unknown[]>(value, Array.isArray(value) ? value : [])
  return mergeStatuses(
    list.flatMap((entry) => {
      if (typeof entry === 'string') {
        return [{ name: entry, color: STATUS_COLORS[entry] ?? '#7aa7c7' }]
      }
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>
        const name = String(record.name ?? '').trim()
        if (!name) return []
        return [{
          name,
          color: typeof record.color === 'string' && record.color.trim() ? record.color : (STATUS_COLORS[name] ?? '#7aa7c7'),
        }]
      }
      return []
    }),
  )
}

function mergeStatuses(items: StatusBadge[]) {
  const map = new Map<string, StatusBadge>()
  for (const item of items) {
    map.set(item.name, item)
  }
  return [...map.values()]
}

function normalizeStats(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  return {
    strength: numberOr(record.strength, 10),
    dexterity: numberOr(record.dexterity, 10),
    constitution: numberOr(record.constitution, 10),
    intelligence: numberOr(record.intelligence, 10),
    wisdom: numberOr(record.wisdom, 10),
    charisma: numberOr(record.charisma, 10),
  }
}

function numberOr(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function nullableString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function triggerSummaryRefresh(sessionId: string, llmConfig: LlmConfig) {
  void refreshSummary(sessionId, llmConfig).catch((error) => {
    console.error('summary refresh failed', error)
  })
}

async function refreshSummary(sessionId: string, llmConfig: LlmConfig) {
  const [countRows] = await pool.query<Array<RowDataPacket & { count: number }>>(
    'SELECT COUNT(*) AS count FROM messages WHERE session_id = ? AND role IN (\'assistant\', \'user\')',
    [sessionId],
  )
  if ((countRows[0]?.count ?? 0) <= 10) return

  const [messages] = await pool.query<MessageRow[]>(
    `SELECT role, content FROM messages WHERE session_id = ? AND role IN ('assistant', 'user') ORDER BY created_at DESC LIMIT 20`,
    [sessionId],
  )

  const summaryPrompt: ChatMessage[] = [
    { role: 'system', content: '请把以下 D&D 剧情对话压缩成 6 句以内的中文摘要，保留地点、关键 NPC、冲突、任务目标和角色状态变化。' },
    { role: 'user', content: messages.reverse().map((item) => `${item.role}: ${item.content}`).join('\n') },
  ]

  const completion = await createCompletion(llmConfig, summaryPrompt, false)
  const summary = completion.content?.trim()
  if (summary) {
    await pool.execute('UPDATE game_sessions SET story_summary = ? WHERE session_id = ?', [summary, sessionId])
  }
}



