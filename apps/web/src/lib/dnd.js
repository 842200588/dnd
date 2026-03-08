export const ABILITY_LABELS = {
    strength: '力量',
    dexterity: '敏捷',
    constitution: '体质',
    intelligence: '智力',
    wisdom: '感知',
    charisma: '魅力',
};
export const ABILITY_KEYS = Object.keys(ABILITY_LABELS);
let rulesCache = null;
export function setRules(rules) {
    rulesCache = rules;
}
export function getRules() {
    if (!rulesCache) {
        throw new Error('D&D rules not loaded yet');
    }
    return rulesCache;
}
export function getRaceRule(raceId) {
    return getRules().races.find((item) => item.id === raceId);
}
export function getClassRule(classId) {
    return getRules().classes.find((item) => item.id === classId);
}
export function getPointBuySpent(baseStats) {
    const costs = getRules().pointBuy.costs;
    return ABILITY_KEYS.reduce((sum, ability) => sum + Number(costs[String(baseStats[ability])]), 0);
}
export function getAbilityModifier(score) {
    return Math.floor((score - 10) / 2);
}
export function getSkillLabel(skill) {
    return getRules().skillLabels[skill] ?? skill;
}
export function computeFinalStats(input) {
    const race = getRaceRule(input.raceId);
    const bonuses = { ...(race?.abilityBonuses ?? {}) };
    if (race?.bonusAbilityChoices) {
        for (const choice of input.bonusAbilityChoices) {
            bonuses[choice] = (bonuses[choice] ?? 0) + race.bonusAbilityChoices.value;
        }
    }
    return ABILITY_KEYS.reduce((result, ability) => {
        result[ability] = input.baseStats[ability] + (bonuses[ability] ?? 0);
        return result;
    }, {});
}
export function computeDerivedValues(input) {
    const clazz = getClassRule(input.classId);
    const finalStats = computeFinalStats(input);
    const conMod = getAbilityModifier(finalStats.constitution);
    const dexMod = getAbilityModifier(finalStats.dexterity);
    const wisMod = getAbilityModifier(finalStats.wisdom);
    let armorClass = 10 + dexMod;
    switch (clazz?.armorModel) {
        case 'unarmored-barbarian':
            armorClass = 10 + dexMod + conMod;
            break;
        case 'unarmored-monk':
            armorClass = 10 + dexMod + wisMod;
            break;
        case 'light-armor':
            armorClass = 11 + dexMod;
            break;
        case 'medium-armor-shield':
            armorClass = 16 + Math.min(dexMod, 2);
            break;
        case 'medium-armor-wood-shield':
            armorClass = 14 + Math.min(dexMod, 2) + 2;
            break;
        case 'heavy-armor':
            armorClass = 16;
            break;
    }
    const inventory = clazz?.startingInventory ?? [];
    return {
        finalStats,
        maxHp: Math.max(1, (clazz?.hitDie ?? 0) + conMod),
        armorClass,
        inventory,
    };
}
