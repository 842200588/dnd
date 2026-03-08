import { computed, reactive } from 'vue';
import { ElButton, ElCard, ElInput, ElMessage, ElOption, ElSelect, ElTag } from 'element-plus';
import { ABILITY_KEYS, ABILITY_LABELS, getClassRule, getRaceRule, getRules, getPointBuySpent, computeDerivedValues, computeFinalStats, getSkillLabel } from '@/lib/dnd';
const emit = defineEmits();
const text = {
    eyebrow: '建卡大厅',
    title: '按规则塑造你的冒险者',
    subtitle: '先选择种族与职业，再用 27 点购分配基础属性。系统会自动计算种族加值、初始生命值、护甲等级和技能限制。',
    badges: { pointBuy: '27 点购', validation: '自动校验', locked: '规则锁定' },
    identityTitle: '角色身份',
    identityHint: '选择而非自由输入',
    labels: { name: '角色姓名', class: '职业', race: '种族 / 亚种族', notes: '角色札记' },
    placeholders: { name: '例如：艾琳·灰烬', notes: '写下信念、缺陷或背景钩子' },
    pointBuyTitle: '属性点购',
    costPrefix: '消耗',
    finalPrefix: '最终',
    extraAbilityTitle: '额外属性',
    classSkillTitle: '职业技能',
    raceSkillTitle: '额外技能',
    previewEyebrow: '预览',
    previewEmpty: '选择种族后查看特性',
    previewHp: '初始生命',
    previewAc: '默认护甲',
    proficiencyTitle: '熟练与豁免',
    inventoryTitle: '起始装备',
    submit: '创建角色并进入冒险',
    chooseCount: '请选择',
    itemsSuffix: '项',
};
const rules = getRules();
const labels = ABILITY_LABELS;
const abilityKeys = ABILITY_KEYS;
const abilityHints = {
    strength: '近战爆发与负重',
    dexterity: '敏捷行动与潜行',
    constitution: '耐力与生命值',
    intelligence: '知识与调查',
    wisdom: '察觉与直觉',
    charisma: '交涉与存在感',
};
const pointCosts = rules.pointBuy.costs;
const form = reactive({
    name: '', raceId: 'human', classId: 'fighter', notes: '', classSkillSelections: [], raceSkillSelections: [], bonusAbilityChoices: [],
    baseStats: { strength: 15, dexterity: 13, constitution: 14, intelligence: 10, wisdom: 10, charisma: 8 },
});
const baseStatsModel = form.baseStats;
const classSkillsModel = computed({ get: () => form.classSkillSelections, set: (value) => { form.classSkillSelections = value; } });
const raceSkillsModel = computed({ get: () => form.raceSkillSelections ?? [], set: (value) => { form.raceSkillSelections = value; } });
const bonusAbilityChoicesModel = computed({ get: () => (form.bonusAbilityChoices ?? []), set: (value) => { form.bonusAbilityChoices = value; } });
const spentPoints = computed(() => getPointBuySpent(baseStatsModel));
const remainingPoints = computed(() => rules.pointBuy.budget - spentPoints.value);
const raceRule = computed(() => getRaceRule(form.raceId));
const classRule = computed(() => getClassRule(form.classId));
const finalStats = computed(() => computeFinalStats({ raceId: form.raceId, baseStats: baseStatsModel, bonusAbilityChoices: bonusAbilityChoicesModel.value }));
const derived = computed(() => computeDerivedValues({ classId: form.classId, raceId: form.raceId, baseStats: baseStatsModel, bonusAbilityChoices: bonusAbilityChoicesModel.value }));
const bonusAbilityOptions = computed(() => abilityKeys.filter((ability) => !raceRule.value?.bonusAbilityChoices?.exclude?.includes(ability)));
const raceGroups = computed(() => {
    const groups = new Map();
    for (const race of rules.races) {
        if (!groups.has(race.group))
            groups.set(race.group, []);
        groups.get(race.group)?.push({ id: race.id, name: race.name });
    }
    return [...groups.entries()].map(([label, options]) => ({ label, options }));
});
const combinedSkillPreview = computed(() => [...new Set([...(raceRule.value?.fixedSkills ?? []), ...classSkillsModel.value, ...raceSkillsModel.value])]);
const pointBuySummary = computed(() => `已用 ${spentPoints.value} / ${rules.pointBuy.budget}，剩余 ${remainingPoints.value}`);
const extraAbilitySummary = computed(() => `${text.chooseCount} ${raceRule.value?.bonusAbilityChoices?.count ?? 0} ${text.itemsSuffix}`);
const classSkillSummary = computed(() => `${text.chooseCount} ${classRule.value?.skillChoices.count ?? 0} ${text.itemsSuffix}`);
const raceSkillSummary = computed(() => `${text.chooseCount} ${raceRule.value?.bonusSkillChoices ?? 0} ${text.itemsSuffix}`);
const savingThrowText = computed(() => `豁免：${classRule.value?.savingThrows?.map(formatAbilityLabel).join(' / ') || '-'}`);
const validationMessage = computed(() => {
    if (!form.name.trim())
        return '请输入角色姓名';
    if (remainingPoints.value < 0)
        return '属性点超过 27 点购预算';
    if (classRule.value && classSkillsModel.value.length !== classRule.value.skillChoices.count)
        return `请选择 ${classRule.value.skillChoices.count} 项职业技能`;
    if (raceRule.value?.bonusAbilityChoices && bonusAbilityChoicesModel.value.length !== raceRule.value.bonusAbilityChoices.count)
        return `请选择 ${raceRule.value.bonusAbilityChoices.count} 项额外属性`;
    if (raceRule.value?.bonusSkillChoices && raceSkillsModel.value.length !== raceRule.value.bonusSkillChoices)
        return `请选择 ${raceRule.value.bonusSkillChoices} 项种族额外技能`;
    return '';
});
function formatAbilityLabel(value) {
    return labels[value] ?? value;
}
function adjustBaseStat(key, delta) {
    const next = baseStatsModel[key] + delta;
    if (next < 8 || next > 15)
        return;
    baseStatsModel[key] = next;
}
function submit() {
    if (validationMessage.value) {
        ElMessage.warning(validationMessage.value);
        return;
    }
    emit('submit', { ...form });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "character-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "hero" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "eyebrow" },
});
(__VLS_ctx.text.eyebrow);
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "title" },
});
(__VLS_ctx.text.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "subtitle" },
});
(__VLS_ctx.text.subtitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "badges" },
});
const __VLS_0 = {}.ElTag;
/** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.ElTag, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    type: "primary",
}));
const __VLS_2 = __VLS_1({
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
(__VLS_ctx.text.badges.pointBuy);
var __VLS_3;
const __VLS_4 = {}.ElTag;
/** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.ElTag, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    type: "success",
}));
const __VLS_6 = __VLS_5({
    type: "success",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
(__VLS_ctx.text.badges.validation);
var __VLS_7;
const __VLS_8 = {}.ElTag;
/** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.ElTag, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    type: "info",
}));
const __VLS_10 = __VLS_9({
    type: "info",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
(__VLS_ctx.text.badges.locked);
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid" },
});
const __VLS_12 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.ElCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ class: "identity" },
    shadow: "never",
}));
const __VLS_14 = __VLS_13({
    ...{ class: "identity" },
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_15.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.text.identityTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-hint" },
    });
    (__VLS_ctx.text.identityHint);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
(__VLS_ctx.text.labels.name);
const __VLS_16 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.form.name),
    placeholder: (__VLS_ctx.text.placeholders.name),
    maxlength: "24",
    showWordLimit: true,
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.form.name),
    placeholder: (__VLS_ctx.text.placeholders.name),
    maxlength: "24",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
(__VLS_ctx.text.labels.class);
const __VLS_20 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.ElSelect, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.form.classId),
    ...{ class: "w-full" },
    popperClass: "codex-dark-select",
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.form.classId),
    ...{ class: "w-full" },
    popperClass: "codex-dark-select",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.rules.classes))) {
    const __VLS_24 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        key: (c.id),
        label: (c.name),
        value: (c.id),
    }));
    const __VLS_26 = __VLS_25({
        key: (c.id),
        label: (c.name),
        value: (c.id),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
}
var __VLS_23;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
(__VLS_ctx.text.labels.race);
const __VLS_28 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.ElSelect, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    modelValue: (__VLS_ctx.form.raceId),
    ...{ class: "w-full" },
    popperClass: "codex-dark-select",
}));
const __VLS_30 = __VLS_29({
    modelValue: (__VLS_ctx.form.raceId),
    ...{ class: "w-full" },
    popperClass: "codex-dark-select",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
for (const [g] of __VLS_getVForSourceType((__VLS_ctx.raceGroups))) {
    const __VLS_32 = {}.ElOptionGroup;
    /** @type {[typeof __VLS_components.ElOptionGroup, typeof __VLS_components.ElOptionGroup, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        key: (g.label),
        label: (g.label),
    }));
    const __VLS_34 = __VLS_33({
        key: (g.label),
        label: (g.label),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    for (const [opt] of __VLS_getVForSourceType((g.options))) {
        const __VLS_36 = {}.ElOption;
        /** @type {[typeof __VLS_components.ElOption, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            key: (opt.id),
            label: (opt.name),
            value: (opt.id),
        }));
        const __VLS_38 = __VLS_37({
            key: (opt.id),
            label: (opt.name),
            value: (opt.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    var __VLS_35;
}
var __VLS_31;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
(__VLS_ctx.text.labels.notes);
const __VLS_40 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    modelValue: (__VLS_ctx.form.notes),
    type: "textarea",
    rows: (3),
    placeholder: (__VLS_ctx.text.placeholders.notes),
    maxlength: "200",
    showWordLimit: true,
}));
const __VLS_42 = __VLS_41({
    modelValue: (__VLS_ctx.form.notes),
    type: "textarea",
    rows: (3),
    placeholder: (__VLS_ctx.text.placeholders.notes),
    maxlength: "200",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
var __VLS_15;
const __VLS_44 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.ElCard, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    ...{ class: "point-buy" },
    shadow: "never",
}));
const __VLS_46 = __VLS_45({
    ...{ class: "point-buy" },
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_47.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.text.pointBuyTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-hint" },
    });
    (__VLS_ctx.pointBuySummary);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "abilities" },
});
for (const [key] of __VLS_getVForSourceType((__VLS_ctx.abilityKeys))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (key),
        ...{ class: "ability-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ability-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ability-name" },
    });
    (__VLS_ctx.labels[key]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ability-hint" },
    });
    (__VLS_ctx.abilityHints[key]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ability-control" },
    });
    const __VLS_48 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.ElButton, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ 'onClick': {} },
        size: "small",
        disabled: (__VLS_ctx.baseStatsModel[key] <= 8),
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onClick': {} },
        size: "small",
        disabled: (__VLS_ctx.baseStatsModel[key] <= 8),
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_52;
    let __VLS_53;
    let __VLS_54;
    const __VLS_55 = {
        onClick: (...[$event]) => {
            __VLS_ctx.adjustBaseStat(key, -1);
        }
    };
    __VLS_51.slots.default;
    var __VLS_51;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ability-value" },
    });
    (__VLS_ctx.baseStatsModel[key]);
    const __VLS_56 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.ElButton, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        ...{ 'onClick': {} },
        size: "small",
        disabled: (__VLS_ctx.baseStatsModel[key] >= 15),
    }));
    const __VLS_58 = __VLS_57({
        ...{ 'onClick': {} },
        size: "small",
        disabled: (__VLS_ctx.baseStatsModel[key] >= 15),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    let __VLS_60;
    let __VLS_61;
    let __VLS_62;
    const __VLS_63 = {
        onClick: (...[$event]) => {
            __VLS_ctx.adjustBaseStat(key, 1);
        }
    };
    __VLS_59.slots.default;
    var __VLS_59;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ability-final" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "final-label" },
    });
    (__VLS_ctx.text.finalPrefix);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "final-value" },
    });
    (__VLS_ctx.finalStats[key]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "cost-label" },
    });
    (__VLS_ctx.text.costPrefix);
    (__VLS_ctx.pointCosts[String(__VLS_ctx.baseStatsModel[key])] ?? 0);
}
var __VLS_47;
if (__VLS_ctx.raceRule?.bonusAbilityChoices) {
    const __VLS_64 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.ElCard, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ class: "extra-abilities" },
        shadow: "never",
    }));
    const __VLS_66 = __VLS_65({
        ...{ class: "extra-abilities" },
        shadow: "never",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    __VLS_67.slots.default;
    {
        const { header: __VLS_thisSlot } = __VLS_67.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-title" },
        });
        (__VLS_ctx.text.extraAbilityTitle);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-hint" },
        });
        (__VLS_ctx.extraAbilitySummary);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "checkbox-group" },
    });
    for (const [ability] of __VLS_getVForSourceType((__VLS_ctx.bonusAbilityOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            key: (ability),
            ...{ class: "checkbox" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            value: (ability),
            disabled: (!__VLS_ctx.bonusAbilityChoicesModel.includes(ability) && __VLS_ctx.bonusAbilityChoicesModel.length >= (__VLS_ctx.raceRule?.bonusAbilityChoices?.count ?? 0)),
        });
        (__VLS_ctx.bonusAbilityChoicesModel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.labels[ability]);
    }
    var __VLS_67;
}
const __VLS_68 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.ElCard, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    ...{ class: "class-skills" },
    shadow: "never",
}));
const __VLS_70 = __VLS_69({
    ...{ class: "class-skills" },
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_71.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.text.classSkillTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-hint" },
    });
    (__VLS_ctx.classSkillSummary);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "checkbox-group" },
});
for (const [skill] of __VLS_getVForSourceType((__VLS_ctx.classRule?.skillChoices?.options ?? []))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        key: (skill),
        ...{ class: "checkbox" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        value: (skill),
        disabled: (!__VLS_ctx.classSkillsModel.includes(skill) && __VLS_ctx.classSkillsModel.length >= (__VLS_ctx.classRule?.skillChoices?.count ?? 0)),
    });
    (__VLS_ctx.classSkillsModel);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.getSkillLabel(skill));
}
var __VLS_71;
if ((__VLS_ctx.raceRule?.bonusSkillChoices ?? 0) > 0) {
    const __VLS_72 = {}.ElCard;
    /** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.ElCard, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        ...{ class: "race-skills" },
        shadow: "never",
    }));
    const __VLS_74 = __VLS_73({
        ...{ class: "race-skills" },
        shadow: "never",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_75.slots.default;
    {
        const { header: __VLS_thisSlot } = __VLS_75.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-title" },
        });
        (__VLS_ctx.text.raceSkillTitle);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-hint" },
        });
        (__VLS_ctx.raceSkillSummary);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "checkbox-group" },
    });
    for (const [skill] of __VLS_getVForSourceType((__VLS_ctx.rules.skills))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            key: (skill),
            ...{ class: "checkbox" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            value: (skill),
            disabled: (!__VLS_ctx.raceSkillsModel.includes(skill) && __VLS_ctx.raceSkillsModel.length >= (__VLS_ctx.raceRule?.bonusSkillChoices ?? 0)),
        });
        (__VLS_ctx.raceSkillsModel);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.getSkillLabel(skill));
    }
    var __VLS_75;
}
const __VLS_76 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.ElCard, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    ...{ class: "preview" },
    shadow: "never",
}));
const __VLS_78 = __VLS_77({
    ...{ class: "preview" },
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_79.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title" },
    });
    (__VLS_ctx.text.previewEyebrow);
}
if (!__VLS_ctx.raceRule) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-empty" },
    });
    (__VLS_ctx.text.previewEmpty);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-content" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-line" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-label" },
    });
    (__VLS_ctx.text.previewHp);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-value" },
    });
    (__VLS_ctx.derived.maxHp);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-line" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-label" },
    });
    (__VLS_ctx.text.previewAc);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-value" },
    });
    (__VLS_ctx.derived.armorClass);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-line" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-label" },
    });
    (__VLS_ctx.text.proficiencyTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-value" },
    });
    (__VLS_ctx.savingThrowText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-line" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-label" },
    });
    (__VLS_ctx.text.inventoryTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-value" },
    });
    (__VLS_ctx.derived.inventory.map((i) => i.name + '×' + i.quantity).join('，'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "preview-line" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-label" },
    });
    (__VLS_ctx.text.classSkillTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "preview-value" },
    });
    (__VLS_ctx.combinedSkillPreview.join('，') || '-');
}
var __VLS_79;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
const __VLS_80 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.ElButton, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    disabled: (!!__VLS_ctx.validationMessage),
}));
const __VLS_82 = __VLS_81({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    disabled: (!!__VLS_ctx.validationMessage),
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
let __VLS_84;
let __VLS_85;
let __VLS_86;
const __VLS_87 = {
    onClick: (__VLS_ctx.submit)
};
__VLS_83.slots.default;
(__VLS_ctx.text.submit);
var __VLS_83;
/** @type {__VLS_StyleScopedClasses['character-form']} */ ;
/** @type {__VLS_StyleScopedClasses['hero']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['badges']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['identity']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['point-buy']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['abilities']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-row']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-name']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-control']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-value']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-final']} */ ;
/** @type {__VLS_StyleScopedClasses['final-label']} */ ;
/** @type {__VLS_StyleScopedClasses['final-value']} */ ;
/** @type {__VLS_StyleScopedClasses['cost-label']} */ ;
/** @type {__VLS_StyleScopedClasses['extra-abilities']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['class-skills']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['race-skills']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-group']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['preview']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-line']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-line']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-line']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-line']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-line']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-label']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-value']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ElButton: ElButton,
            ElCard: ElCard,
            ElInput: ElInput,
            ElOption: ElOption,
            ElSelect: ElSelect,
            ElTag: ElTag,
            getSkillLabel: getSkillLabel,
            text: text,
            rules: rules,
            labels: labels,
            abilityKeys: abilityKeys,
            abilityHints: abilityHints,
            pointCosts: pointCosts,
            form: form,
            baseStatsModel: baseStatsModel,
            classSkillsModel: classSkillsModel,
            raceSkillsModel: raceSkillsModel,
            bonusAbilityChoicesModel: bonusAbilityChoicesModel,
            raceRule: raceRule,
            classRule: classRule,
            finalStats: finalStats,
            derived: derived,
            bonusAbilityOptions: bonusAbilityOptions,
            raceGroups: raceGroups,
            combinedSkillPreview: combinedSkillPreview,
            pointBuySummary: pointBuySummary,
            extraAbilitySummary: extraAbilitySummary,
            classSkillSummary: classSkillSummary,
            raceSkillSummary: raceSkillSummary,
            savingThrowText: savingThrowText,
            validationMessage: validationMessage,
            adjustBaseStat: adjustBaseStat,
            submit: submit,
        };
    },
    __typeEmits: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
});
; /* PartiallyEnd: #4569/main.vue */
