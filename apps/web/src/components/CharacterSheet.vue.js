import { computed, ref } from 'vue';
import { getAbilityModifier, getSkillLabel } from '@/lib/dnd';
const props = defineProps();
const labels = {
    strength: '力量',
    dexterity: '敏捷',
    constitution: '体质',
    intelligence: '智力',
    wisdom: '感知',
    charisma: '魅力',
};
const skillsOpen = ref(false);
const inventoryOpen = ref(false);
const skillLabels = computed(() => props.character.skills.map((skill) => getSkillLabel(skill)));
const skillPreview = computed(() => skillLabels.value.slice(0, 3));
const inventoryPreview = computed(() => props.character.inventory.slice(0, 3));
function formatModifier(score) {
    const modifier = getAbilityModifier(score);
    return modifier >= 0 ? `+${modifier}` : String(modifier);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "character-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sheet-crest" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "eyebrow" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
(__VLS_ctx.character.name);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "sheet-subtitle" },
});
(__VLS_ctx.character.race);
(__VLS_ctx.character.className);
(__VLS_ctx.character.level);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stats-strip" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-pill" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.character.currentHp);
(__VLS_ctx.character.maxHp);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-pill" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.character.armorClass);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-pill" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.character.goldAmount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "ability-grid" },
});
for (const [value, key] of __VLS_getVForSourceType((__VLS_ctx.character.stats))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (key),
        ...{ class: "ability-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.labels[key] ?? key);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (value);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
    (__VLS_ctx.formatModifier(value));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-head compact-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.skillLabels.length > 3) {
    const __VLS_0 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        text: true,
        type: "warning",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        text: true,
        type: "warning",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.skillLabels.length > 3))
                return;
            __VLS_ctx.skillsOpen = true;
        }
    };
    __VLS_3.slots.default;
    var __VLS_3;
}
if (__VLS_ctx.skillPreview.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sheet-chip-grid" },
    });
    for (const [skill] of __VLS_getVForSourceType((__VLS_ctx.skillPreview))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (skill),
            ...{ class: "sheet-chip" },
        });
        (skill);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "sheet-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-head compact-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.character.inventory.length > 3) {
    const __VLS_8 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        text: true,
        type: "warning",
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        text: true,
        type: "warning",
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.character.inventory.length > 3))
                return;
            __VLS_ctx.inventoryOpen = true;
        }
    };
    __VLS_11.slots.default;
    var __VLS_11;
}
if (__VLS_ctx.inventoryPreview.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "inventory-list compact-inventory visible-inventory" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.inventoryPreview))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (item.name),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (item.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (item.quantity);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "sheet-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-head compact-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "muted" },
});
if (__VLS_ctx.npcs.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "npc-stack" },
    });
    for (const [npc] of __VLS_getVForSourceType((__VLS_ctx.npcs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (npc.id),
            ...{ class: "npc-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-head compact-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({
            ...{ class: "npc-name" },
        });
        (npc.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "npc-meta" },
        });
        (npc.creatureType || 'NPC');
        if (npc.race) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (npc.race);
        }
        if (npc.className) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (npc.className);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "npc-attitude" },
        });
        (npc.attitude);
        (npc.affinity);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stats-strip npc-strip" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stat-pill" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (npc.currentHp);
        (npc.maxHp);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stat-pill" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (npc.armorClass);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stat-pill" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (npc.level);
        if (npc.statuses.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "status-strip" },
            });
            for (const [status] of __VLS_getVForSourceType((npc.statuses))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (`${npc.id}-${status.name}`),
                    ...{ class: "status-badge" },
                    ...{ style: ({ '--status-color': status.color }) },
                });
                (status.name);
            }
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "sheet-empty" },
    });
}
const __VLS_16 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    modelValue: (__VLS_ctx.skillsOpen),
    width: "560px",
    title: "全部技能熟练",
}));
const __VLS_18 = __VLS_17({
    modelValue: (__VLS_ctx.skillsOpen),
    width: "560px",
    title: "全部技能熟练",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sheet-chip-grid expanded-grid" },
});
for (const [skill] of __VLS_getVForSourceType((__VLS_ctx.skillLabels))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (skill),
        ...{ class: "sheet-chip" },
    });
    (skill);
}
var __VLS_19;
const __VLS_20 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.inventoryOpen),
    width: "560px",
    title: "全部装备",
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.inventoryOpen),
    width: "560px",
    title: "全部装备",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
    ...{ class: "inventory-list visible-inventory" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.character.inventory))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
        key: (item.name),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (item.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (item.quantity);
}
var __VLS_23;
/** @type {__VLS_StyleScopedClasses['character-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-crest']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-strip']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['ability-card']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-head']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-chip-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-head']} */ ;
/** @type {__VLS_StyleScopedClasses['inventory-list']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-inventory']} */ ;
/** @type {__VLS_StyleScopedClasses['visible-inventory']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-head']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['npc-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['npc-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-head']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-head']} */ ;
/** @type {__VLS_StyleScopedClasses['npc-name']} */ ;
/** @type {__VLS_StyleScopedClasses['npc-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['npc-attitude']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-strip']} */ ;
/** @type {__VLS_StyleScopedClasses['npc-strip']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['status-strip']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-chip-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['expanded-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['sheet-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['inventory-list']} */ ;
/** @type {__VLS_StyleScopedClasses['visible-inventory']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            labels: labels,
            skillsOpen: skillsOpen,
            inventoryOpen: inventoryOpen,
            skillLabels: skillLabels,
            skillPreview: skillPreview,
            inventoryPreview: inventoryPreview,
            formatModifier: formatModifier,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
