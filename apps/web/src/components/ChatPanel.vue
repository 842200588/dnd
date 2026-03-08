<template>
  <section class="chat-shell live-chat-shell">
    <div class="chat-head dramatic-head">
      <div>
        <p class="eyebrow">冒险实况</p>
        <h2>地下城回响</h2>
      </div>
      <div class="summary-chip">
        <span>剧情摘要</span>
        <strong>{{ summary || '故事尚未开始' }}</strong>
      </div>
    </div>

    <div class="chat-body">
      <div ref="viewportRef" class="message-scroll message-viewport">
        <div v-for="(message, index) in messages" :key="message.id ?? `${message.role}-${index}`" :class="['message-row', message.role, message.variant ?? 'text']">
          <article v-if="message.variant === 'dice' && message.dice" class="dice-card" :class="message.dice.status">
            <div class="dice-card-head">
              <span class="message-role">检定裁定</span>
              <strong>{{ message.dice.notation }}</strong>
            </div>
            <p class="dice-reason">{{ message.dice.reason }}</p>
            <div class="dice-stage">
              <div class="dice-box" :class="message.dice.status">
                <span v-if="message.dice.status === 'rolling'">?</span>
                <span v-else>{{ message.dice.total }}</span>
              </div>
              <div class="dice-meta">
                <template v-if="message.dice.status === 'rolling'">
                  <strong>正在掷骰...</strong>
                  <span>地下城主正在裁定这次行动</span>
                </template>
                <template v-else>
                  <strong>结果 {{ message.dice.total }}</strong>
                  <span>掷骰 {{ message.dice.rolls.join('、') }} / 修正 {{ formatModifier(message.dice.modifier) }}</span>
                </template>
              </div>
            </div>
          </article>

          <article v-else-if="message.variant === 'tool'" class="message-card tool-card">
            <span class="message-role">规则结算</span>
            <p>{{ message.content }}</p>
          </article>

          <article v-else class="message-card" :class="message.role">
            <span class="message-role">{{ roleMap[message.role] ?? message.role }}</span>
            <div v-if="message.role === 'assistant' && message.loading" class="typing-shell">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
            <!-- assistant 消息使用 Markdown 渲染，其余角色用纯文本 -->
            <div v-else-if="message.role === 'assistant'" class="prose-dark" v-html="renderMarkdown(message.content)" />
            <p v-else>{{ message.content }}</p>
          </article>
        </div>
      </div>

      <div class="composer inset-composer">
        <el-input
          v-model="draft"
          type="textarea"
          :rows="3"
          :disabled="pending"
          resize="none"
          placeholder="描述你的动作，例如：我压低呼吸，把火把抬向石门上的血色刻痕。"
          @keydown.ctrl.enter.prevent="submit"
        />
        <div class="composer-actions top-gap chat-actions">
          <div class="tool-feed">
            <span>{{ pending ? '地下城主正在回应' : '当前状态' }}</span>
            <strong>{{ pending ? '正在等待后端与模型返回...' : (latestToolLog || '等待你的下一步行动') }}</strong>
          </div>
          <el-button type="warning" :loading="pending" :disabled="pending || !draft.trim()" @click="submit">发送行动</el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'

/** markdown-it 实例，用于渲染 assistant 叙事消息 */
const md = new MarkdownIt({ html: false, linkify: false, typographer: true, breaks: true })

export type ChatUiMessage = {
  id?: string
  role: string
  content: string
  variant?: 'text' | 'dice' | 'tool'
  loading?: boolean
  dice?: {
    notation: string
    reason: string
    total: number
    rolls: number[]
    modifier: number
    status: 'rolling' | 'resolved'
  }
}

const props = defineProps<{
  summary: string
  messages: ChatUiMessage[]
  pending: boolean
  latestToolLog: string
}>()
const emit = defineEmits<{ submit: [message: string] }>()
const draft = ref('')
const viewportRef = ref<HTMLDivElement | null>(null)

const roleMap: Record<string, string> = {
  assistant: '地下城主',
  user: '玩家行动',
  tool: '规则结算',
  system: '系统',
}

/** 将文本渲染为 Markdown HTML，仅用于 assistant 消息 */
function renderMarkdown(text: string): string {
  return md.render(text || '')
}

function submit() {
  if (props.pending) return
  const value = draft.value.trim()
  if (!value) return
  emit('submit', value)
  draft.value = ''
}

function formatModifier(modifier: number) {
  return modifier >= 0 ? `+${modifier}` : String(modifier)
}

watch(
  () => props.messages,
  async () => {
    await nextTick()
    const viewport = viewportRef.value
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  },
  { deep: true, immediate: true },
)
</script>
