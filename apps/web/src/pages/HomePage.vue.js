import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import CharacterForm from '@/components/CharacterForm.vue';
import CharacterSheet from '@/components/CharacterSheet.vue';
import ChatPanel from '@/components/ChatPanel.vue';
import SettingsModal from '@/components/SettingsModal.vue';
import { createCharacter, fetchGameState, resetGameState, streamChat } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
const store = useSessionStore();
const settingsOpen = ref(!store.settings.apiKey);
const createPending = ref(false);
const chatPending = ref(false);
const resetPending = ref(false);
const errorText = ref('');
const latestToolLog = ref('');
const gameState = ref(null);
const transientMessages = ref([]);
const messages = computed(() => {
    const persisted = gameState.value?.recentMessages.map(mapPersistedMessage) ?? [];
    return [...persisted, ...transientMessages.value];
});
onMounted(async () => {
    if (store.sessionId)
        await reloadState();
});
async function reloadState() {
    if (!store.sessionId)
        return;
    try {
        errorText.value = '';
        transientMessages.value = [];
        gameState.value = await fetchGameState(store.sessionId);
    }
    catch (error) {
        errorText.value = error instanceof Error ? error.message : '读取存档失败';
        store.clearSession();
        gameState.value = null;
        transientMessages.value = [];
    }
}
function saveSettings(settings) {
    store.saveSettings(settings);
    settingsOpen.value = false;
    ElMessage.success('模型配置已保存到浏览器本地存储');
}
async function createNewCharacter(payload) {
    try {
        createPending.value = true;
        errorText.value = '';
        const result = await createCharacter(payload);
        store.setSessionId(result.sessionId);
        transientMessages.value = [];
        gameState.value = await fetchGameState(result.sessionId);
    }
    catch (error) {
        errorText.value = error instanceof Error ? error.message : '创建角色失败';
    }
    finally {
        createPending.value = false;
    }
}
async function restartGame() {
    if (!store.sessionId || resetPending.value || chatPending.value)
        return;
    try {
        await ElMessageBox.confirm('这会删除当前角色、NPC、怪物、对话记录和摘要，并返回创建角色页面。是否继续？', '重新开始', {
            type: 'warning',
            confirmButtonText: '确认删除',
            cancelButtonText: '取消',
        });
    }
    catch {
        return;
    }
    try {
        resetPending.value = true;
        errorText.value = '';
        await resetGameState(store.sessionId);
        store.clearSession();
        gameState.value = null;
        transientMessages.value = [];
        latestToolLog.value = '';
        ElMessage.success('当前冒险已清除，已返回创建角色页面');
    }
    catch (error) {
        errorText.value = error instanceof Error ? error.message : '清除冒险失败';
    }
    finally {
        resetPending.value = false;
    }
}
async function sendMessage(message) {
    if (!gameState.value || chatPending.value)
        return;
    if (!store.settings.apiKey || !store.settings.baseUrl || !store.settings.model) {
        settingsOpen.value = true;
        errorText.value = '请先配置 API Key、Base URL 和模型名称';
        return;
    }
    chatPending.value = true;
    errorText.value = '';
    latestToolLog.value = '';
    const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        variant: 'text',
    };
    const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        variant: 'text',
        loading: true,
    };
    transientMessages.value.push(userMessage, assistantMessage);
    try {
        await streamChat({
            sessionId: gameState.value.sessionId,
            message,
            apiKey: store.settings.apiKey,
            baseUrl: store.settings.baseUrl,
            model: store.settings.model,
            async onToken(token) {
                assistantMessage.loading = false;
                assistantMessage.content += token;
            },
            async onTool(tool) {
                await handleToolEvent(tool, assistantMessage);
            },
        });
        assistantMessage.loading = false;
        await reloadState();
    }
    catch (error) {
        assistantMessage.loading = false;
        if (!assistantMessage.content) {
            transientMessages.value = transientMessages.value.filter((item) => item.id !== assistantMessage.id);
        }
        errorText.value = error instanceof Error ? error.message : '发送消息失败';
    }
    finally {
        chatPending.value = false;
    }
}
async function handleToolEvent(tool, assistantMessage) {
    if (tool.type === 'dice') {
        latestToolLog.value = `检定：${tool.reason}`;
        const diceMessage = {
            id: `dice-${Date.now()}`,
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
        };
        insertBeforeAssistant(diceMessage, assistantMessage);
        await wait(1200);
        if (diceMessage.dice) {
            diceMessage.dice.status = 'resolved';
        }
        await wait(350);
        return;
    }
    if (tool.type === 'hp') {
        latestToolLog.value = `生命变化：${tool.previousHp} -> ${tool.currentHp}`;
        insertBeforeAssistant({
            id: `hp-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: `${tool.reason}。生命值从 ${tool.previousHp} 变为 ${tool.currentHp}。`,
        }, assistantMessage);
        return;
    }
    if (tool.type === 'inventory') {
        latestToolLog.value = tool.ok ? `物品变更：${tool.itemName} x${tool.quantity}` : `物品判定失败：${tool.itemName}`;
        insertBeforeAssistant({
            id: `inventory-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: tool.ok ? `${tool.reason}。${tool.itemName} 数量变化 ${tool.quantity}。` : tool.reason,
        }, assistantMessage);
        return;
    }
    if (tool.type === 'npc_upsert') {
        latestToolLog.value = `新目标：${tool.npc.name}`;
        insertBeforeAssistant({
            id: `npc-upsert-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: `${tool.reason}。${tool.npc.name} 已加入当前场景。`,
        }, assistantMessage);
        return;
    }
    if (tool.type === 'npc_hp') {
        latestToolLog.value = `${tool.name}：${tool.previousHp} -> ${tool.currentHp}`;
        insertBeforeAssistant({
            id: `npc-hp-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: `${tool.reason}。${tool.name} 的生命值从 ${tool.previousHp} 变为 ${tool.currentHp}。`,
        }, assistantMessage);
        return;
    }
    if (tool.type === 'npc_affinity') {
        latestToolLog.value = `${tool.name} 态度：${tool.attitude}`;
        insertBeforeAssistant({
            id: `npc-affinity-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: `${tool.reason}。${tool.name} 现在对你的态度是“${tool.attitude}”，好感为 ${tool.currentAffinity}。`,
        }, assistantMessage);
        return;
    }
    if (tool.type === 'npc_status') {
        latestToolLog.value = `${tool.name} 状态：${tool.statuses.map((item) => item.name).join('、') || '无'}`;
        insertBeforeAssistant({
            id: `npc-status-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: `${tool.reason}。${tool.name} 当前状态：${tool.statuses.map((item) => item.name).join('、') || '无'}。`,
        }, assistantMessage);
        return;
    }
    if (tool.type === 'npc_inventory') {
        latestToolLog.value = `${tool.name} 装备变化`;
        insertBeforeAssistant({
            id: `npc-inventory-${Date.now()}`,
            role: 'tool',
            variant: 'tool',
            content: tool.ok ? `${tool.reason}。${tool.name} 的 ${tool.itemName} 数量变化 ${tool.quantity}。` : tool.reason,
        }, assistantMessage);
        return;
    }
    latestToolLog.value = JSON.stringify(tool);
}
function insertBeforeAssistant(message, assistantMessage) {
    const assistantIndex = transientMessages.value.findIndex((item) => item.id === assistantMessage.id);
    const insertIndex = assistantIndex >= 0 ? assistantIndex : transientMessages.value.length;
    transientMessages.value.splice(insertIndex, 0, message);
}
function mapPersistedMessage(message, index) {
    if (message.role === 'tool') {
        try {
            const payload = JSON.parse(message.content);
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
                };
            }
            const persistedContent = toolEventToText(payload);
            if (persistedContent) {
                return {
                    id: `persisted-tool-${index}-${message.created_at}`,
                    role: 'tool',
                    variant: 'tool',
                    content: persistedContent,
                };
            }
        }
        catch {
        }
    }
    return {
        id: `${message.role}-${index}-${message.created_at}`,
        role: message.role,
        content: message.content,
        variant: 'text',
    };
}
function toolEventToText(payload) {
    if (payload.type === 'hp')
        return `${payload.reason}。生命值从 ${payload.previousHp} 变为 ${payload.currentHp}。`;
    if (payload.type === 'inventory')
        return payload.ok ? `${payload.reason}。${payload.itemName} 数量变化 ${payload.quantity}。` : payload.reason;
    if (payload.type === 'npc_upsert')
        return `${payload.reason}。${payload.npc.name} 已加入当前场景。`;
    if (payload.type === 'npc_hp')
        return `${payload.reason}。${payload.name} 的生命值从 ${payload.previousHp} 变为 ${payload.currentHp}。`;
    if (payload.type === 'npc_affinity')
        return `${payload.reason}。${payload.name} 当前态度为“${payload.attitude}”，好感 ${payload.currentAffinity}。`;
    if (payload.type === 'npc_status')
        return `${payload.reason}。${payload.name} 当前状态：${payload.statuses.map((item) => item.name).join('、') || '无'}。`;
    if (payload.type === 'npc_inventory')
        return payload.ok ? `${payload.reason}。${payload.name} 的 ${payload.itemName} 数量变化 ${payload.quantity}。` : payload.reason;
    return '';
}
function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-shell theatrical-page" },
});
/** @type {[typeof SettingsModal, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(SettingsModal, new SettingsModal({
    ...{ 'onClose': {} },
    ...{ 'onSave': {} },
    open: (__VLS_ctx.settingsOpen),
    settings: (__VLS_ctx.store.settings),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onClose': {} },
    ...{ 'onSave': {} },
    open: (__VLS_ctx.settingsOpen),
    settings: (__VLS_ctx.store.settings),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onClose: (...[$event]) => {
        __VLS_ctx.settingsOpen = false;
    }
};
const __VLS_7 = {
    onSave: (__VLS_ctx.saveSettings)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "hero-bar marquee-bar compact-marquee" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hero-copy-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "hero-copy" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hero-console" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "console-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "console-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hero-actions" },
});
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    plain: true,
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    plain: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (...[$event]) => {
        __VLS_ctx.settingsOpen = true;
    }
};
__VLS_11.slots.default;
var __VLS_11;
const __VLS_16 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    plain: true,
    disabled: (!__VLS_ctx.store.sessionId || __VLS_ctx.chatPending),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    plain: true,
    disabled: (!__VLS_ctx.store.sessionId || __VLS_ctx.chatPending),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (__VLS_ctx.reloadState)
};
__VLS_19.slots.default;
var __VLS_19;
const __VLS_24 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    plain: true,
    type: "danger",
    disabled: (!__VLS_ctx.store.sessionId || __VLS_ctx.resetPending || __VLS_ctx.chatPending),
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    plain: true,
    type: "danger",
    disabled: (!__VLS_ctx.store.sessionId || __VLS_ctx.resetPending || __VLS_ctx.chatPending),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.restartGame)
};
__VLS_27.slots.default;
var __VLS_27;
if (__VLS_ctx.gameState) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "game-layout elevated-layout" },
    });
    /** @type {[typeof CharacterSheet, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(CharacterSheet, new CharacterSheet({
        character: (__VLS_ctx.gameState.character),
        npcs: (__VLS_ctx.gameState.npcs),
    }));
    const __VLS_33 = __VLS_32({
        character: (__VLS_ctx.gameState.character),
        npcs: (__VLS_ctx.gameState.npcs),
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    /** @type {[typeof ChatPanel, ]} */ ;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent(ChatPanel, new ChatPanel({
        ...{ 'onSubmit': {} },
        summary: (__VLS_ctx.gameState.summary),
        messages: (__VLS_ctx.messages),
        pending: (__VLS_ctx.chatPending),
        latestToolLog: (__VLS_ctx.latestToolLog),
    }));
    const __VLS_36 = __VLS_35({
        ...{ 'onSubmit': {} },
        summary: (__VLS_ctx.gameState.summary),
        messages: (__VLS_ctx.messages),
        pending: (__VLS_ctx.chatPending),
        latestToolLog: (__VLS_ctx.latestToolLog),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
    let __VLS_38;
    let __VLS_39;
    let __VLS_40;
    const __VLS_41 = {
        onSubmit: (__VLS_ctx.sendMessage)
    };
    var __VLS_37;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: "landing-layout single-stage-layout" },
    });
    /** @type {[typeof CharacterForm, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(CharacterForm, new CharacterForm({
        ...{ 'onSubmit': {} },
        loading: (__VLS_ctx.createPending),
    }));
    const __VLS_43 = __VLS_42({
        ...{ 'onSubmit': {} },
        loading: (__VLS_ctx.createPending),
    }, ...__VLS_functionalComponentArgsRest(__VLS_42));
    let __VLS_45;
    let __VLS_46;
    let __VLS_47;
    const __VLS_48 = {
        onSubmit: (__VLS_ctx.createNewCharacter)
    };
    var __VLS_44;
}
if (__VLS_ctx.errorText) {
    const __VLS_49 = {}.ElAlert;
    /** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        ...{ class: "top-gap" },
        type: "error",
        title: (__VLS_ctx.errorText),
        closable: (false),
        showIcon: true,
    }));
    const __VLS_51 = __VLS_50({
        ...{ class: "top-gap" },
        type: "error",
        title: (__VLS_ctx.errorText),
        closable: (false),
        showIcon: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
}
/** @type {__VLS_StyleScopedClasses['page-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['theatrical-page']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['marquee-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-marquee']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-copy-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-console']} */ ;
/** @type {__VLS_StyleScopedClasses['console-row']} */ ;
/** @type {__VLS_StyleScopedClasses['console-row']} */ ;
/** @type {__VLS_StyleScopedClasses['hero-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['game-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['elevated-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['landing-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['single-stage-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['top-gap']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CharacterForm: CharacterForm,
            CharacterSheet: CharacterSheet,
            ChatPanel: ChatPanel,
            SettingsModal: SettingsModal,
            store: store,
            settingsOpen: settingsOpen,
            createPending: createPending,
            chatPending: chatPending,
            resetPending: resetPending,
            errorText: errorText,
            latestToolLog: latestToolLog,
            gameState: gameState,
            messages: messages,
            reloadState: reloadState,
            saveSettings: saveSettings,
            createNewCharacter: createNewCharacter,
            restartGame: restartGame,
            sendMessage: sendMessage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
