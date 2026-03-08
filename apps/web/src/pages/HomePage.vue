<template>
  <div class="page-shell theatrical-page">
    <SettingsModal :open="settingsOpen" :settings="store.settings" @close="settingsOpen = false" @save="saveSettings" />

    <header class="hero-bar marquee-bar compact-marquee">
      <div class="hero-copy-wrap">
        <p class="eyebrow">AI D&D / 单机规则验证版</p>
        <h1>黯雾地城</h1>
        <p class="hero-copy">本地运行，BYOK 接入，规则优先。先建立你的角色，再让地下城开始回应你的行动。</p>
      </div>
      <div class="hero-console">
        <div class="console-row">
          <span>模式</span>
          <strong>BYOK / 本地会话</strong>
        </div>
        <div class="console-row">
          <span>规则栈</span>
          <strong>D&amp;D 5E + 真实状态注入</strong>
        </div>
        <div class="hero-actions">
          <el-button plain @click="settingsOpen = true">模型设置</el-button>
          <el-button plain :disabled="!store.sessionId || chatPending" @click="reloadState">继续冒险</el-button>
          <el-button plain type="danger" :disabled="!store.sessionId || resetPending || chatPending" @click="restartGame">重新开始</el-button>
        </div>
      </div>
    </header>

    <main v-if="gameState" class="game-layout elevated-layout">
      <CharacterSheet :character="gameState.character" :npcs="gameState.npcs" />
      <ChatPanel :summary="gameState.summary" :messages="messages" :pending="chatPending" :latest-tool-log="latestToolLog" @submit="sendMessage" />
    </main>

    <main v-else class="landing-layout single-stage-layout">
      <CharacterForm :loading="createPending" @submit="createNewCharacter" />
    </main>

    <el-alert v-if="errorText" class="top-gap" type="error" :title="errorText" :closable="false" show-icon />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CharacterForm from '@/components/CharacterForm.vue'
import CharacterSheet from '@/components/CharacterSheet.vue'
import ChatPanel, { type ChatUiMessage } from '@/components/ChatPanel.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { createCharacter, fetchGameState, resetGameState, streamChat, type CharacterPayload, type GameState, type ToolEvent } from '@/lib/api'
import { useSessionStore, type AppSettings } from '@/stores/session'

const store = useSessionStore()
const settingsOpen = ref(!store.settings.apiKey)
const createPending = ref(false)
const chatPending = ref(false)
const resetPending = ref(false)
const errorText = ref('')
const latestToolLog = ref('')
const gameState = ref<GameState | null>(null)
const transientMessages = ref<ChatUiMessage[]>([])

const messages = computed<ChatUiMessage[]>(() => {
  const persisted = gameState.value?.recentMessages.map(mapPersistedMessage) ?? []
  return [...persisted, ...transientMessages.value]
})

onMounted(async () => {
  if (store.sessionId) await reloadState()
})

async function reloadState() {
  if (!store.sessionId) return
  try {
    errorText.value = ''
    transientMessages.value = []
    gameState.value = await fetchGameState(store.sessionId)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '读取存档失败'
    store.clearSession()
    gameState.value = null
    transientMessages.value = []
  }
}

function saveSettings(settings: AppSettings) {
  store.saveSettings(settings)
  settingsOpen.value = false
  ElMessage.success('模型配置已保存到浏览器本地存储')
}

async function createNewCharacter(payload: CharacterPayload) {
  try {
    createPending.value = true
    errorText.value = ''
    const result = await createCharacter(payload)
    store.setSessionId(result.sessionId)
    transientMessages.value = []
    gameState.value = await fetchGameState(result.sessionId)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '创建角色失败'
  } finally {
    createPending.value = false
  }
}

async function restartGame() {
  if (!store.sessionId || resetPending.value || chatPending.value) return

  try {
    await ElMessageBox.confirm('这会删除当前角色、NPC、怪物、对话记录和摘要，并返回创建角色页面。是否继续？', '重新开始', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    resetPending.value = true
    errorText.value = ''
    await resetGameState(store.sessionId)
    store.clearSession()
    gameState.value = null
    transientMessages.value = []
    latestToolLog.value = ''
    ElMessage.success('当前冒险已清除，已返回创建角色页面')
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '清除冒险失败'
  } finally {
    resetPending.value = false
  }
}

async function sendMessage(message: string) {
  if (!gameState.value || chatPending.value) return
  if (!store.settings.apiKey || !store.settings.baseUrl || !store.settings.model) {
    settingsOpen.value = true
    errorText.value = '请先配置 API Key、Base URL 和模型名称'
    return
  }

  chatPending.value = true
  errorText.value = ''
  latestToolLog.value = ''

  const userMessage: ChatUiMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
    variant: 'text',
  }
  const assistantMessage: ChatUiMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: '',
    variant: 'text',
    loading: true,
  }
  transientMessages.value.push(userMessage, assistantMessage)

  try {
    await streamChat({
      sessionId: gameState.value.sessionId,
      message,
      apiKey: store.settings.apiKey,
      baseUrl: store.settings.baseUrl,
      model: store.settings.model,
      async onToken(token) {
        assistantMessage.loading = false
        assistantMessage.content += token
      },
      async onTool(tool) {
        await handleToolEvent(tool, assistantMessage)
      },
    })
    assistantMessage.loading = false
    await reloadState()
  } catch (error) {
    assistantMessage.loading = false
    if (!assistantMessage.content) {
      transientMessages.value = transientMessages.value.filter((item) => item.id !== assistantMessage.id)
    }
    errorText.value = error instanceof Error ? error.message : '发送消息失败'
  } finally {
    chatPending.value = false
  }
}

// ── 工具事件处理：Map 分发模式，替代原来的 8 个 if 分支 ─────────────────

/** 底部状态日志文字，按工具类型查表获取 */
type ToolLogFn = (tool: ToolEvent) => string
const TOOL_LOG_MAP: Partial<Record<string, ToolLogFn>> = {
  dice: (t) => `检定：${(t as import('@/lib/api').DiceToolEvent).reason}`,
  hp: (t) => { const e = t as import('@/lib/api').HpToolEvent; return `生命变化：${e.previousHp} -> ${e.currentHp}` },
  inventory: (t) => { const e = t as import('@/lib/api').InventoryToolEvent; return e.ok ? `物品变更：${e.itemName} x${e.quantity}` : `物品判定失败：${e.itemName}` },
  npc_upsert: (t) => `新目标：${(t as import('@/lib/api').NpcUpsertToolEvent).npc.name}`,
  npc_hp: (t) => { const e = t as import('@/lib/api').NpcHpToolEvent; return `${e.name}：${e.previousHp} -> ${e.currentHp}` },
  npc_affinity: (t) => { const e = t as import('@/lib/api').NpcAffinityToolEvent; return `${e.name} 态度：${e.attitude}` },
  npc_status: (t) => { const e = t as import('@/lib/api').NpcStatusToolEvent; return `${e.name} 状态：${e.statuses.map((s) => s.name).join('、') || '无'}` },
  npc_inventory: (t) => `${(t as import('@/lib/api').NpcInventoryToolEvent).name} 装备变化`,
}

/** 工具事件内容文字，供实时插入和历史重放共用。返回 null 表示该类型用特殊卡片渲染（如 dice）。 */
type ToolContentFn = (tool: ToolEvent) => string | null
const TOOL_CONTENT_MAP: Partial<Record<string, ToolContentFn>> = {
  dice: () => null,
  hp: (t) => { const e = t as import('@/lib/api').HpToolEvent; return `${e.reason}。生命值从 ${e.previousHp} 变为 ${e.currentHp}。` },
  inventory: (t) => { const e = t as import('@/lib/api').InventoryToolEvent; return e.ok ? `${e.reason}。${e.itemName} 数量变化 ${e.quantity}。` : e.reason },
  npc_upsert: (t) => { const e = t as import('@/lib/api').NpcUpsertToolEvent; return `${e.reason}。${e.npc.name} 已加入当前场景。` },
  npc_hp: (t) => { const e = t as import('@/lib/api').NpcHpToolEvent; return `${e.reason}。${e.name} 的生命值从 ${e.previousHp} 变为 ${e.currentHp}。` },
  npc_affinity: (t) => { const e = t as import('@/lib/api').NpcAffinityToolEvent; return `${e.reason}。${e.name} 现在对你的态度是"${e.attitude}"，好感为 ${e.currentAffinity}。` },
  npc_status: (t) => { const e = t as import('@/lib/api').NpcStatusToolEvent; return `${e.reason}。${e.name} 当前状态：${e.statuses.map((s) => s.name).join('、') || '无'}。` },
  npc_inventory: (t) => { const e = t as import('@/lib/api').NpcInventoryToolEvent; return e.ok ? `${e.reason}。${e.name} 的 ${e.itemName} 数量变化 ${e.quantity}。` : e.reason },
}

async function handleToolEvent(tool: ToolEvent, assistantMessage: ChatUiMessage) {
  // 更新底部状态日志
  const logFn = TOOL_LOG_MAP[tool.type]
  latestToolLog.value = logFn ? logFn(tool) : JSON.stringify(tool)

  // dice 类型：插入专属骰子动画卡片
  if (tool.type === 'dice') {
    const diceMessage: ChatUiMessage = {
      id: crypto.randomUUID(),
      role: 'tool',
      content: '',
      variant: 'dice',
      dice: {
        notation: tool.notation,
        reason: tool.reason,
        total: tool.result.total,
        rolls: tool.result.rolls,
        modifier: tool.result.modifier,
        status: 'rolling',
      },
    }
    insertBeforeAssistant(diceMessage, assistantMessage)
    await wait(1200)
    if (diceMessage.dice) diceMessage.dice.status = 'resolved'
    await wait(350)
    return
  }

  // 其余工具类型：查表获取内容并插入普通 tool 卡片
  const contentFn = TOOL_CONTENT_MAP[tool.type]
  const content = contentFn ? contentFn(tool) : null
  if (content !== null) {
    insertBeforeAssistant({ id: crypto.randomUUID(), role: 'tool', variant: 'tool', content }, assistantMessage)
  }
}

function insertBeforeAssistant(message: ChatUiMessage, assistantMessage: ChatUiMessage) {
  const assistantIndex = transientMessages.value.findIndex((item) => item.id === assistantMessage.id)
  const insertIndex = assistantIndex >= 0 ? assistantIndex : transientMessages.value.length
  transientMessages.value.splice(insertIndex, 0, message)
}

/** 将历史持久化工具消息转为 UI 可渲染格式，复用 TOOL_CONTENT_MAP 避免重复逻辑 */
function mapPersistedMessage(message: GameState['recentMessages'][number], index: number): ChatUiMessage {
  if (message.role === 'tool') {
    try {
      const payload = JSON.parse(message.content) as ToolEvent
      if (payload.type === 'dice') {
        return {
          id: `persisted-dice-${index}-${message.created_at}`,
          role: 'tool',
          content: '',
          variant: 'dice',
          dice: {
            notation: payload.notation,
            reason: payload.reason,
            total: payload.result.total,
            rolls: payload.result.rolls,
            modifier: payload.result.modifier,
            status: 'resolved',
          },
        }
      }

      const contentFn = TOOL_CONTENT_MAP[payload.type]
      const persistedContent = contentFn ? contentFn(payload) : null
      if (persistedContent) {
        return {
          id: `persisted-tool-${index}-${message.created_at}`,
          role: 'tool',
          variant: 'tool',
          content: persistedContent,
        }
      }
    } catch {
    }
  }

  return {
    id: `${message.role}-${index}-${message.created_at}`,
    role: message.role,
    content: message.content,
    variant: 'text',
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
</script>
