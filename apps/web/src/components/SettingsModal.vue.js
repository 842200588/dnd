import { computed, reactive, ref, watch } from 'vue';
const providers = [
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
];
const props = defineProps();
const emit = defineEmits();
const draft = reactive({ apiKey: '', baseUrl: '', model: '' });
const providerId = ref('siliconflow');
const activeProvider = computed(() => providers.find((item) => item.id === providerId.value) ?? providers[0]);
watch(() => props.settings, (value) => {
    draft.apiKey = value.apiKey;
    draft.baseUrl = value.baseUrl;
    draft.model = value.model;
    providerId.value = inferProvider(value);
}, { immediate: true, deep: true });
function inferProvider(value) {
    if (value.baseUrl.includes('siliconflow.cn'))
        return 'siliconflow';
    if (value.baseUrl.includes('deepseek.com'))
        return 'deepseek';
    if (value.baseUrl.includes('dashscope.aliyuncs.com'))
        return 'qwen';
    if (value.baseUrl.includes('ark.cn-beijing.volces.com'))
        return 'doubao';
    return 'custom';
}
function applyProviderPreset(nextProviderId) {
    const preset = providers.find((item) => item.id === nextProviderId);
    if (!preset)
        return;
    if (preset.baseUrl) {
        draft.baseUrl = preset.baseUrl;
    }
    if (preset.models.length > 0) {
        const modelStillValid = preset.models.some((item) => item.value === draft.model);
        draft.model = modelStillValid ? draft.model : preset.models[0].value;
    }
    else if (nextProviderId !== 'custom') {
        draft.model = '';
    }
}
function save() {
    emit('save', { ...draft });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.open),
    width: "720px",
    top: "8vh",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClose': {} },
    modelValue: (__VLS_ctx.open),
    width: "720px",
    top: "8vh",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClose: (...[$event]) => {
        __VLS_ctx.$emit('close');
    }
};
var __VLS_8 = {};
__VLS_3.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_3.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dialog-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "eyebrow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "dialog-copy" },
    });
}
const __VLS_9 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    labelPosition: "top",
    ...{ class: "settings-form" },
}));
const __VLS_11 = __VLS_10({
    labelPosition: "top",
    ...{ class: "settings-form" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    label: "接入平台",
}));
const __VLS_15 = __VLS_14({
    label: "接入平台",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
const __VLS_17 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.providerId),
    ...{ class: "w-full" },
    popperClass: "codex-dark-select",
}));
const __VLS_19 = __VLS_18({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.providerId),
    ...{ class: "w-full" },
    popperClass: "codex-dark-select",
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
let __VLS_21;
let __VLS_22;
let __VLS_23;
const __VLS_24 = {
    onChange: (__VLS_ctx.applyProviderPreset)
};
__VLS_20.slots.default;
for (const [provider] of __VLS_getVForSourceType((__VLS_ctx.providers))) {
    const __VLS_25 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
        key: (provider.id),
        label: (provider.label),
        value: (provider.id),
    }));
    const __VLS_27 = __VLS_26({
        key: (provider.id),
        label: (provider.label),
        value: (provider.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
}
var __VLS_20;
var __VLS_16;
const __VLS_29 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    label: "API Key",
}));
const __VLS_31 = __VLS_30({
    label: "API Key",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
const __VLS_33 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    modelValue: (__VLS_ctx.draft.apiKey),
    type: "password",
    showPassword: true,
    placeholder: "请输入你自己的模型 API Key",
}));
const __VLS_35 = __VLS_34({
    modelValue: (__VLS_ctx.draft.apiKey),
    type: "password",
    showPassword: true,
    placeholder: "请输入你自己的模型 API Key",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
var __VLS_32;
const __VLS_37 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    label: "Base URL",
}));
const __VLS_39 = __VLS_38({
    label: "Base URL",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_40.slots.default;
const __VLS_41 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    modelValue: (__VLS_ctx.draft.baseUrl),
    placeholder: "例如：https://api.siliconflow.cn/v1",
}));
const __VLS_43 = __VLS_42({
    modelValue: (__VLS_ctx.draft.baseUrl),
    placeholder: "例如：https://api.siliconflow.cn/v1",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
var __VLS_40;
const __VLS_45 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    label: "模型名称",
}));
const __VLS_47 = __VLS_46({
    label: "模型名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
if (__VLS_ctx.activeProvider.models.length) {
    const __VLS_49 = {}.ElSelect;
    /** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        modelValue: (__VLS_ctx.draft.model),
        ...{ class: "w-full" },
        popperClass: "codex-dark-select",
        filterable: true,
        allowCreate: true,
        defaultFirstOption: true,
    }));
    const __VLS_51 = __VLS_50({
        modelValue: (__VLS_ctx.draft.model),
        ...{ class: "w-full" },
        popperClass: "codex-dark-select",
        filterable: true,
        allowCreate: true,
        defaultFirstOption: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    for (const [model] of __VLS_getVForSourceType((__VLS_ctx.activeProvider.models))) {
        const __VLS_53 = {}.ElOption;
        /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
        // @ts-ignore
        const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
            key: (model.value),
            label: (model.label),
            value: (model.value),
        }));
        const __VLS_55 = __VLS_54({
            key: (model.value),
            label: (model.label),
            value: (model.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_54));
    }
    var __VLS_52;
}
else {
    const __VLS_57 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
        modelValue: (__VLS_ctx.draft.model),
        placeholder: (__VLS_ctx.activeProvider.modelPlaceholder),
    }));
    const __VLS_59 = __VLS_58({
        modelValue: (__VLS_ctx.draft.model),
        placeholder: (__VLS_ctx.activeProvider.modelPlaceholder),
    }, ...__VLS_functionalComponentArgsRest(__VLS_58));
}
var __VLS_48;
var __VLS_12;
const __VLS_61 = {}.ElAlert;
/** @type {[typeof __VLS_components.ElAlert, typeof __VLS_components.elAlert, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    type: "info",
    closable: (false),
    showIcon: true,
    title: (__VLS_ctx.activeProvider.hint),
}));
const __VLS_63 = __VLS_62({
    type: "info",
    closable: (false),
    showIcon: true,
    title: (__VLS_ctx.activeProvider.hint),
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
{
    const { footer: __VLS_thisSlot } = __VLS_3.slots;
    const __VLS_65 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
        ...{ 'onClick': {} },
    }));
    const __VLS_67 = __VLS_66({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_66));
    let __VLS_69;
    let __VLS_70;
    let __VLS_71;
    const __VLS_72 = {
        onClick: (...[$event]) => {
            __VLS_ctx.$emit('close');
        }
    };
    __VLS_68.slots.default;
    var __VLS_68;
    const __VLS_73 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        ...{ 'onClick': {} },
        type: "warning",
    }));
    const __VLS_75 = __VLS_74({
        ...{ 'onClick': {} },
        type: "warning",
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    let __VLS_77;
    let __VLS_78;
    let __VLS_79;
    const __VLS_80 = {
        onClick: (__VLS_ctx.save)
    };
    __VLS_76.slots.default;
    var __VLS_76;
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['dialog-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['dialog-copy']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-form']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            providers: providers,
            draft: draft,
            providerId: providerId,
            activeProvider: activeProvider,
            applyProviderPreset: applyProviderPreset,
            save: save,
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
