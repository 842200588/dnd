import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export type AppSettings = {
  apiKey: string
  baseUrl: string
  model: string
}

export const useSessionStore = defineStore('session', () => {
  const settings = useStorage<AppSettings>('ai-dnd-settings', {
    apiKey: '',
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3.2-Exp',
  })

  const sessionId = useStorage<string>('ai-dnd-session-id', '')

  function saveSettings(value: AppSettings) {
    settings.value = value
  }

  function setSessionId(value: string) {
    sessionId.value = value
  }

  function clearSession() {
    sessionId.value = ''
  }

  return {
    settings,
    sessionId,
    saveSettings,
    setSessionId,
    clearSession,
  }
})
