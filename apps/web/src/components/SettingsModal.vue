<template>
  <el-dialog :model-value="open" width="720px" top="8vh" @close="$emit('close')">
    <template #header>
      <div class="dialog-header">
        <p class="eyebrow">本地模型接入</p>
        <h2>配置你的冒险引擎</h2>
        <p class="dialog-copy">密钥仅保存在浏览器 LocalStorage。聊天时会随请求头透传到本地后端，不会上传到项目服务器。</p>
      </div>
    </template>

    <el-form label-position="top" class="settings-form">
      <el-form-item label="接入平台">
        <el-select v-model="providerId" class="w-full" popper-class="codex-dark-select" @change="applyProviderPreset">
          <el-option v-for="provider in providers" :key="provider.id" :label="provider.label" :value="provider.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="API Key">
        <el-input v-model="draft.apiKey" type="password" show-password placeholder="请输入你自己的模型 API Key" />
      </el-form-item>

      <el-form-item label="Base URL">
        <el-input v-model="draft.baseUrl" placeholder="例如：https://api.siliconflow.cn/v1" />
      </el-form-item>

      <el-form-item label="模型名称">
        <el-select v-if="activeProvider.models.length" v-model="draft.model" class="w-full" popper-class="codex-dark-select" filterable allow-create default-first-option>
          <el-option v-for="model in activeProvider.models" :key="model.value" :label="model.label" :value="model.value" />
        </el-select>
        <el-input v-else v-model="draft.model" :placeholder="activeProvider.modelPlaceholder" />
      </el-form-item>
    </el-form>

    <el-alert type="info" :closable="false" show-icon :title="activeProvider.hint" />

    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
      <el-button type="warning" @click="save">保存配置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { AppSettings } from '@/stores/session'

type ProviderPreset = {
  id: string
  label: string
  baseUrl: string
  hint: string
  modelPlaceholder: string
  models: Array<{ label: string; value: string }>
}

const providers: ProviderPreset[] = [
  {
    id: 'siliconflow',
    label: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    hint: '硅基流动使用 OpenAI 兼容接口，但模型名必须填写完整模型 ID，例如 deepseek-ai/DeepSeek-V3.2-Exp，而不是 deepseek-chat。模型列表会变动，请以官方模型广场为准。',
    modelPlaceholder: '例如：deepseek-ai/DeepSeek-V3.2-Exp',
    models: [
      { label: 'DeepSeek V3.2 Exp', value: 'deepseek-ai/DeepSeek-V3.2-Exp' },
      { label: 'GLM-4.6', value: 'zai-org/GLM-4.6' },
      { label: 'Qwen3 Coder 480B', value: 'Qwen/Qwen3-Coder-480B-A35B-Instruct' },
      { label: 'Qwen3 235B Thinking', value: 'Qwen/Qwen3-235B-A22B-Thinking-2507' },
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek 官方',
    baseUrl: 'https://api.deepseek.com/v1',
    hint: 'DeepSeek 官方接口建议直接使用官方模型名，例如 deepseek-chat。',
    modelPlaceholder: '例如：deepseek-chat',
    models: [
      { label: 'DeepSeek Chat', value: 'deepseek-chat' },
      { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
    ],
  },
  {
    id: 'qwen',
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    hint: '通义千问使用 DashScope OpenAI 兼容地址，模型名需与控制台支持列表一致。',
    modelPlaceholder: '例如：qwen-plus',
    models: [
      { label: 'Qwen Turbo', value: 'qwen-turbo' },
      { label: 'Qwen Plus', value: 'qwen-plus' },
      { label: 'Qwen Max', value: 'qwen-max' },
    ],
  },
  {
    id: 'doubao',
    label: '豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    hint: '豆包这里不能直接填 doubao-pro 一类别名，必须填写你在火山方舟控制台创建的 Endpoint ID。',
    modelPlaceholder: '请输入火山方舟 Endpoint ID',
    models: [],
  },
  {
    id: 'custom',
    label: '自定义兼容接口',
    baseUrl: '',
    hint: '如果你接的是其他 OpenAI 兼容平台，请自行确认 Base URL 和模型名完全匹配。',
    modelPlaceholder: '请输入平台要求的模型名',
    models: [],
  },
]

const props = defineProps<{ open: boolean; settings: AppSettings }>()
const emit = defineEmits<{ close: []; save: [value: AppSettings] }>()
const draft = reactive<AppSettings>({ apiKey: '', baseUrl: '', model: '' })
const providerId = ref('siliconflow')

const activeProvider = computed(() => providers.find((item) => item.id === providerId.value) ?? providers[0])

watch(
  () => props.settings,
  (value) => {
    draft.apiKey = value.apiKey
    draft.baseUrl = value.baseUrl
    draft.model = value.model
    providerId.value = inferProvider(value)
  },
  { immediate: true, deep: true },
)

function inferProvider(value: AppSettings) {
  if (value.baseUrl.includes('siliconflow.cn')) return 'siliconflow'
  if (value.baseUrl.includes('deepseek.com')) return 'deepseek'
  if (value.baseUrl.includes('dashscope.aliyuncs.com')) return 'qwen'
  if (value.baseUrl.includes('ark.cn-beijing.volces.com')) return 'doubao'
  return 'custom'
}

function applyProviderPreset(nextProviderId: string) {
  const preset = providers.find((item) => item.id === nextProviderId)
  if (!preset) return
  if (preset.baseUrl) {
    draft.baseUrl = preset.baseUrl
  }
  if (preset.models.length > 0) {
    const modelStillValid = preset.models.some((item) => item.value === draft.model)
    draft.model = modelStillValid ? draft.model : preset.models[0].value
  } else if (nextProviderId !== 'custom') {
    draft.model = ''
  }
}

function save() {
  emit('save', { ...draft })
}
</script>
