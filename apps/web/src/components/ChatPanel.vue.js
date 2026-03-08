import { nextTick, ref, watch } from 'vue';
const props = defineProps();
const emit = defineEmits();
const draft = ref('');
const viewportRef = ref(null);
const roleMap = {
    assistant: '地下城主',
    user: '玩家行动',
    tool: '规则结算',
    system: '系统',
};
function submit() {
    if (props.pending)
        return;
    const value = draft.value.trim();
    if (!value)
        return;
    emit('submit', value);
    draft.value = '';
}
function formatModifier(modifier) {
    return modifier >= 0 ? `+${modifier}` : String(modifier);
}
watch(() => props.messages, async () => {
    await nextTick();
    const viewport = viewportRef.value;
    if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
    }
}, { deep: true, immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "chat-shell live-chat-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-head dramatic-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "summary-chip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.summary || '故事尚未开始');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chat-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "viewportRef",
    ...{ class: "message-scroll message-viewport" },
});
/** @type {typeof __VLS_ctx.viewportRef} */ ;
for (const [message, index] of __VLS_getVForSourceType((__VLS_ctx.messages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (message.id ?? `${message.role}-${index}`),
        ...{ class: (['message-row', message.role, message.variant ?? 'text']) },
    });
    if (message.variant === 'dice' && message.dice) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ class: "dice-card" },
            ...{ class: (message.dice.status) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "dice-card-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "message-role" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (message.dice.notation);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "dice-reason" },
        });
        (message.dice.reason);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "dice-stage" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "dice-box" },
            ...{ class: (message.dice.status) },
        });
        if (message.dice.status === 'rolling') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (message.dice.total);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "dice-meta" },
        });
        if (message.dice.status === 'rolling') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (message.dice.total);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (message.dice.rolls.join('、'));
            (__VLS_ctx.formatModifier(message.dice.modifier));
        }
    }
    else if (message.variant === 'tool') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ class: "message-card tool-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "message-role" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (message.content);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            ...{ class: "message-card" },
            ...{ class: (message.role) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "message-role" },
        });
        (__VLS_ctx.roleMap[message.role] ?? message.role);
        if (message.role === 'assistant' && message.loading) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "typing-shell" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "typing-dot" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "typing-dot" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "typing-dot" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (message.content);
        }
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "composer inset-composer" },
});
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onKeydown': {} },
    modelValue: (__VLS_ctx.draft),
    type: "textarea",
    rows: (3),
    disabled: (__VLS_ctx.pending),
    resize: "none",
    placeholder: "描述你的动作，例如：我压低呼吸，把火把抬向石门上的血色刻痕。",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onKeydown': {} },
    modelValue: (__VLS_ctx.draft),
    type: "textarea",
    rows: (3),
    disabled: (__VLS_ctx.pending),
    resize: "none",
    placeholder: "描述你的动作，例如：我压低呼吸，把火把抬向石门上的血色刻痕。",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onKeydown: (__VLS_ctx.submit)
};
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "composer-actions top-gap chat-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-feed" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.pending ? '地下城主正在回应' : '当前状态');
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.pending ? '正在等待后端与模型返回...' : (__VLS_ctx.latestToolLog || '等待你的下一步行动'));
const __VLS_8 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    type: "warning",
    loading: (__VLS_ctx.pending),
    disabled: (__VLS_ctx.pending || !__VLS_ctx.draft.trim()),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    type: "warning",
    loading: (__VLS_ctx.pending),
    disabled: (__VLS_ctx.pending || !__VLS_ctx.draft.trim()),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_11.slots.default;
var __VLS_11;
/** @type {__VLS_StyleScopedClasses['chat-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['live-chat-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-head']} */ ;
/** @type {__VLS_StyleScopedClasses['dramatic-head']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-body']} */ ;
/** @type {__VLS_StyleScopedClasses['message-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['message-viewport']} */ ;
/** @type {__VLS_StyleScopedClasses['dice-card']} */ ;
/** @type {__VLS_StyleScopedClasses['dice-card-head']} */ ;
/** @type {__VLS_StyleScopedClasses['message-role']} */ ;
/** @type {__VLS_StyleScopedClasses['dice-reason']} */ ;
/** @type {__VLS_StyleScopedClasses['dice-stage']} */ ;
/** @type {__VLS_StyleScopedClasses['dice-box']} */ ;
/** @type {__VLS_StyleScopedClasses['dice-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['message-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['message-role']} */ ;
/** @type {__VLS_StyleScopedClasses['message-card']} */ ;
/** @type {__VLS_StyleScopedClasses['message-role']} */ ;
/** @type {__VLS_StyleScopedClasses['typing-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['typing-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['typing-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['typing-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['composer']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-composer']} */ ;
/** @type {__VLS_StyleScopedClasses['composer-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['top-gap']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-feed']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            draft: draft,
            viewportRef: viewportRef,
            roleMap: roleMap,
            submit: submit,
            formatModifier: formatModifier,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
