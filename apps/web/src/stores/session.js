import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
export const useSessionStore = defineStore('session', () => {
    const settings = useStorage('ai-dnd-settings', {
        apiKey: '',
        baseUrl: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3.2-Exp',
    });
    const sessionId = useStorage('ai-dnd-session-id', '');
    function saveSettings(value) {
        settings.value = value;
    }
    function setSessionId(value) {
        sessionId.value = value;
    }
    function clearSession() {
        sessionId.value = '';
    }
    return {
        settings,
        sessionId,
        saveSettings,
        setSessionId,
        clearSession,
    };
});
